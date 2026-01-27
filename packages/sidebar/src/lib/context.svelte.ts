import { getContext, setContext, untrack } from 'svelte';
import type { Snippet } from 'svelte';
import type {
	SidebarConfig,
	SidebarSettings,
	SidebarEvents,
	SidebarPage,
	SidebarGroup,
	SidebarItem,
	SidebarSection,
	SidebarSchema,
	SidebarRenderContext,
	SidebarReorderEvent,
	SidebarDnDState,
	ItemKind,
	DropPosition,
	KeyboardDragState,
	PointerDragState,
	SidebarResponsiveSettings,
	SidebarResponsiveMode,
	SidebarDnDSettings,
	SidebarKeyboardShortcuts,
	SidebarLabels,
	SidebarAnnouncements,
	SidebarReorderMode
} from './types.js';
import { defaultSchema } from './types.js';
import {
	toPersistenceSettings,
	loadPersistedSidebarState,
	persistSidebarState
} from './context/persistence.js';
import { createResponsiveController } from './context/responsive.js';
import {
	DEFAULT_LABELS,
	resolveSidebarSettings,
	type SidebarResolvedSettings
} from './context/settings.js';
import {
	getEffectiveReorderMode as resolveReorderMode,
	canReorderInternally as schemaSupportsInternalReorder,
	applyInternalReorder as applyInternalReorderToData
} from './dnd/reorder.js';
import { createDnDState } from './dnd/handlers.js';
import {
	calculateInsertPosition as calculateInsertPositionForPreview,
	computePreviewInsert,
	isPreviewItem as isPreviewItemForPreview,
	getItemsWithPreview as getItemsWithPreviewForPreview
} from './dnd/preview.js';
import { isValidDropTarget } from './dnd/constraints.js';
import { FlipController } from './dnd/flip.js';
import { HoverExpandController } from './dnd/hover-expand.js';
import { AutoScrollController } from './dnd/auto-scroll.js';
import {
	cacheDropZoneRects as cacheDropZoneRectsForDnD,
	findDropZoneAtPoint as findDropZoneAtPointForDnD,
	findNearestDropZone as findNearestDropZoneForDnD,
	type DropZoneRect
} from './dnd/dropzones.js';
import {
	pickUpItem as pickUpItemForDnD,
	movePickedUpItem as movePickedUpItemForDnD,
	movePickedUpItemToParent as movePickedUpItemToParentForDnD,
	movePickedUpItemIntoGroup as movePickedUpItemIntoGroupForDnD,
	cancelKeyboardDrag as cancelKeyboardDragForDnD
} from './dnd/keyboard.js';
import {
	handlePointerDown as handlePointerDownForDnD,
	startPointerDrag as startPointerDragForDnD,
	handlePointerMove as handlePointerMoveForDnD,
	handlePointerUp as handlePointerUpForDnD,
	cleanupPointerDrag as cleanupPointerDragForDnD
} from './dnd/pointer.js';
import {
	findItemById as findItemByIdInTree,
	calculateDepth as calculateTreeDepth,
	isDescendantOf as isDescendantInTree
} from './tree/search.js';
import { findPathToItem as findPathToItemInTree } from './tree/path.js';
import { getInitialExpandedGroups as getInitialExpandedGroupsInTree } from './tree/initial-expansion.js';
import { buildTreeIndex, type TreeIndex } from './tree/index.js';
import { createSidebarRenderContext } from './context/render-context.js';

const SIDEBAR_CONTEXT_KEY = Symbol('sidebar-context');

// ============================================================================
// Snippet Types
// ============================================================================

export interface SidebarSnippets<T = unknown> {
	page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
	group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
	section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
	dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;
}

// ============================================================================
// Sidebar Context Class
// ============================================================================

export class SidebarContext<T = unknown> {
	// Configuration (initialized first)
	readonly schema: SidebarSchema<T>;
	data = $state<T[]>([]); // Raw sections data - reactive for DnD reordering
	readonly settings: SidebarResolvedSettings;
	readonly events: SidebarEvents;

	// For backward compatibility - stores config when using legacy API
	readonly config: SidebarConfig | undefined;

	// Render snippets (set by Sidebar component) - reactive for updates
	snippets = $state<SidebarSnippets<T>>({});

	// Reactive state using Svelte 5 runes
	collapsed = $state(false);

	// Responsive state
	responsiveMode = $state<SidebarResponsiveMode>('desktop');
	drawerOpen = $state(false);
	#scrollLockY: number | null = null;
	#mobileMediaQuery: MediaQueryList | null = null;
	#tabletMediaQuery: MediaQueryList | null = null;
	#mobileQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
	#tabletQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
	#responsiveCleanup: (() => void) | null = null;

	// Fine-grained reactivity: each group has its own reactive state
	// This prevents all groups from re-rendering when one changes
	#expandedGroupsMap = $state<Record<string, boolean>>({});

	// Current active pathname - set once from root Sidebar
	activeHref = $state<string>('');

	// DnD state
	dndEnabled = $state(false);
	livePreview = $state(true);
	animated = $state(true);
	draggedItem = $state<{ id: string; item: T; parentId: string | null; index: number } | null>(
		null
	);
	dropTargetId = $state<string | null>(null);
	dropPosition = $state<DropPosition | null>(null);
	onReorder?: (event: SidebarReorderEvent<T>) => void;
	reorderMode = $state<SidebarReorderMode>('auto');

	// Live preview state - where the item would be inserted
	previewInsert = $state<{
		parentId: string | null;
		index: number;
	} | null>(null);

	// Keyboard DnD state
	keyboardDragState = $state<KeyboardDragState<T> | null>(null);
	announcement = $state<string>('');

	// Pointer/Touch DnD state
	pointerDragState = $state<PointerDragState<T> | null>(null);
	#dropZoneRects: DropZoneRect[] = [];
	#lastRectCacheTime = 0;

	// Custom drag preview element (set by Sidebar component)
	#dragPreviewElement: HTMLElement | null = null;

	// Auto-scroll state
	#scrollContainer: HTMLElement | null = null;
	#autoScroll = new AutoScrollController();

	// Hover-expand state
	#hoverExpand = new HoverExpandController();

	// Preview debounce state
	#previewDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// FLIP animation state
	#flip = new FlipController();

	// Tree index cache
	#treeIndex: TreeIndex<T> | null = null;
	#treeIndexSource: T[] | null = null;

	private get isForcedCollapsed(): boolean {
		return this.settings.responsive.enabled && this.responsiveMode === 'tablet';
	}

	private getEffectiveCollapsed(userCollapsed: boolean = this.collapsed): boolean {
		return this.isForcedCollapsed || userCollapsed;
	}

	// Getters for derived values
	get width(): string {
		return this.isCollapsed ? this.settings.widthCollapsed : this.settings.widthExpanded;
	}

	get isCollapsed(): boolean {
		return this.getEffectiveCollapsed();
	}

	// DnD timing constants (from settings)
	get longPressDelay(): number {
		return this.settings.dnd.longPressDelay;
	}

	get hoverExpandDelay(): number {
		return this.settings.dnd.hoverExpandDelay;
	}

	get autoScrollThreshold(): number {
		return this.settings.dnd.autoScrollThreshold;
	}

	get autoScrollMaxSpeed(): number {
		return this.settings.dnd.autoScrollMaxSpeed;
	}

	get rectCacheInterval(): number {
		return this.settings.dnd.rectCacheInterval;
	}

	// Labels getter for i18n
	get labels(): typeof DEFAULT_LABELS {
		return this.settings.labels;
	}

	// Announcements getter
	get announcements(): Required<SidebarAnnouncements> {
		return this.settings.announcements;
	}

	/**
	 * Format an announcement template with placeholder values
	 */
	formatAnnouncement(
		template: string,
		values: Record<string, string | number>
	): string {
		return template.replace(/\{(\w+)\}/g, (_, key) => {
			return key in values ? String(values[key]) : `{${key}}`;
		});
	}

	/**
	 * Check if a key matches a shortcut (single key or array of keys)
	 */
	matchesShortcut(key: string, shortcut: string | string[]): boolean {
		if (Array.isArray(shortcut)) {
			return shortcut.includes(key);
		}
		return key === shortcut;
	}

	constructor(options: {
		config?: SidebarConfig;
		data?: T[];
		schema?: SidebarSchema<T>;
		settings?: SidebarSettings;
		events?: SidebarEvents;
	}) {
		const { config, data, schema, settings, events = {} } = options;

		// Determine which API is being used
		if (config) {
			// Legacy API: use config.sections as data with defaultSchema
			this.config = config;
			this.data = config.sections as unknown as T[];
			this.schema = defaultSchema as unknown as SidebarSchema<T>;
			this.settings = resolveSidebarSettings(config.settings);
		} else if (data) {
			// New API: use data + schema
			this.config = undefined;
			this.data = data;
			this.schema = schema ?? (defaultSchema as unknown as SidebarSchema<T>);
			this.settings = resolveSidebarSettings(settings);
		} else {
			throw new Error('Sidebar requires either "config" or "data" prop');
		}

		this.events = events;

		// Initialize state
		this.collapsed = this.settings.defaultCollapsed;
		this.#expandedGroupsMap = this.getInitialExpandedGroups();

		// Initialize responsive mode with SSR-safe default
		this.responsiveMode = this.settings.responsive.defaultMode;

		// Load persisted state (must happen before effect setup)
		this.loadPersistedState();

		// Set up persistence effect - use untrack to read values without creating dependencies
		$effect(() => {
			// Read the values we want to persist
			const collapsedValue = this.collapsed;
			const expandedMap = this.#expandedGroupsMap;

			// Persist without tracking
			untrack(() => {
				this.persistState(collapsedValue, expandedMap);
			});
		});

		// Set up responsive media queries (client-side only, runs after hydration)
		$effect(() => {
			// Use untrack to prevent this effect from re-running when state changes
			untrack(() => {
				this.setupResponsiveMediaQueries();
			});

			// Cleanup on destroy
			return () => {
				this.cleanupResponsiveMediaQueries();
			};
		});
	}

	// ========================================================================
	// Responsive Methods
	// ========================================================================

	/**
	 * Set up media query listeners for responsive behavior
	 */
	private setupResponsiveMediaQueries(): void {
		if (typeof window === 'undefined') return;
		if (!this.settings.responsive.enabled) return;
		// Prevent double initialization
		if (this.#mobileMediaQuery) return;

		const controller = createResponsiveController({
			responsive: this.settings.responsive,
			onModeChange: (mode) => this.setResponsiveMode(mode),
			onEscapeKeyDown: this.#boundEscapeHandler
		});
		if (!controller) return;

		this.#mobileMediaQuery = controller.mobileMediaQuery;
		this.#tabletMediaQuery = controller.tabletMediaQuery;
		this.#mobileQueryHandler = controller.mobileQueryHandler;
		this.#tabletQueryHandler = controller.tabletQueryHandler;
		this.#responsiveCleanup = controller.cleanup;
	}

	/**
	 * Clean up responsive media query listeners
	 */
	private cleanupResponsiveMediaQueries(): void {
		if (typeof window === 'undefined') return;

		if (this.#responsiveCleanup) {
			this.#responsiveCleanup();
			this.#responsiveCleanup = null;
		} else {
			// Fallback cleanup for older instances or partial initialization
			if (this.#mobileMediaQuery && this.#mobileQueryHandler) {
				this.#mobileMediaQuery.removeEventListener('change', this.#mobileQueryHandler);
			}
			if (this.#tabletMediaQuery && this.#tabletQueryHandler) {
				this.#tabletMediaQuery.removeEventListener('change', this.#tabletQueryHandler);
			}
			if (this.settings.responsive.closeOnEscape) {
				document.removeEventListener('keydown', this.#boundEscapeHandler);
			}
		}
		// Reset references so setup can run again if needed
		this.#mobileMediaQuery = null;
		this.#tabletMediaQuery = null;
		this.#mobileQueryHandler = null;
		this.#tabletQueryHandler = null;
		// Ensure body scroll is unlocked
		this.unlockBodyScroll();
	}

	/**
	 * Clean up all resources (called on component destroy)
	 */
	destroy(): void {
		this.cleanupResponsiveMediaQueries();
	}

	/**
	 * Bound escape key handler
	 */
	#boundEscapeHandler = (e: KeyboardEvent): void => {
		if (e.key === 'Escape' && this.drawerOpen && this.responsiveMode === 'mobile') {
			this.closeDrawer();
		}
	};

	/**
	 * Set the responsive mode
	 */
	private setResponsiveMode(mode: SidebarResponsiveMode): void {
		if (this.responsiveMode === mode) return;

		const previousEffectiveCollapsed = this.isCollapsed;
		const previousMode = this.responsiveMode;
		this.responsiveMode = mode;
		this.events.onModeChange?.(mode);

		// Close drawer when switching away from mobile mode
		if (previousMode === 'mobile' && mode !== 'mobile' && this.drawerOpen) {
			this.closeDrawer();
		}

		// Tablet mode forces collapsed visuals, but should not persist user preference.
		const nextEffectiveCollapsed = this.isCollapsed;
		if (previousEffectiveCollapsed !== nextEffectiveCollapsed) {
			this.events.onCollapsedChange?.(nextEffectiveCollapsed);
		}
	}

	/**
	 * Open the mobile drawer
	 */
	openDrawer(): void {
		if (this.drawerOpen) {
			return;
		}
		if (this.events.onBeforeOpenChange?.(true) === false) {
			return;
		}
		this.drawerOpen = true;
		this.events.onOpenChange?.(true);

		if (this.settings.responsive.lockBodyScroll) {
			this.lockBodyScroll();
		}
	}

	/**
	 * Close the mobile drawer
	 */
	closeDrawer(): void {
		if (!this.drawerOpen) {
			return;
		}
		if (this.events.onBeforeOpenChange?.(false) === false) {
			return;
		}
		this.drawerOpen = false;
		this.events.onOpenChange?.(false);

		if (this.settings.responsive.lockBodyScroll) {
			this.unlockBodyScroll();
		}
	}

	/**
	 * Toggle the mobile drawer
	 */
	toggleDrawer(): void {
		if (this.drawerOpen) {
			this.closeDrawer();
		} else {
			this.openDrawer();
		}
	}

	/**
	 * Lock body scroll (for mobile drawer)
	 */
	private lockBodyScroll(): void {
		if (typeof document === 'undefined' || typeof window === 'undefined') return;
		if (this.#scrollLockY !== null) return;
		this.#scrollLockY = window.scrollY;
		document.body.style.top = `-${this.#scrollLockY}px`;
		document.body.classList.add('sidebar-scroll-locked');
	}

	/**
	 * Unlock body scroll
	 */
	private unlockBodyScroll(): void {
		if (typeof document === 'undefined' || typeof window === 'undefined') return;
		const lockedY = this.#scrollLockY;
		document.body.classList.remove('sidebar-scroll-locked');
		document.body.style.top = '';
		this.#scrollLockY = null;
		if (lockedY !== null) {
			window.scrollTo({ top: lockedY, left: 0, behavior: 'auto' });
		}
	}

	/**
	 * Handle navigation (closes drawer if configured)
	 */
	handleNavigation(): void {
		if (
			this.settings.responsive.closeOnNavigation &&
			this.responsiveMode === 'mobile' &&
			this.drawerOpen
		) {
			this.closeDrawer();
		}
	}

	// ========================================================================
	// Schema Accessor Methods
	// ========================================================================

	/**
	 * Get the kind of an item using the schema
	 */
	getKind(item: T): ItemKind {
		return this.schema.getKind(item);
	}

	/**
	 * Get the ID of an item using the schema
	 */
	getId(item: T): string {
		return this.schema.getId(item);
	}

	/**
	 * Get the label of an item using the schema
	 */
	getLabel(item: T): string {
		return this.schema.getLabel(item);
	}

	/**
	 * Get the href of an item using the schema
	 */
	getHref(item: T): string | undefined {
		return this.schema.getHref?.(item);
	}

	/**
	 * Get child items using the schema
	 */
	getItems(item: T): T[] {
		return (this.schema.getItems?.(item) ?? []) as T[];
	}

	/**
	 * Get the icon of an item using the schema
	 */
	getIcon(item: T): ReturnType<NonNullable<SidebarSchema<T>['getIcon']>> {
		return this.schema.getIcon?.(item);
	}

	/**
	 * Get the badge of an item using the schema
	 */
	getBadge(item: T): string | number | undefined {
		return this.schema.getBadge?.(item);
	}

	/**
	 * Check if an item is disabled using the schema
	 */
	getDisabled(item: T): boolean {
		return this.schema.getDisabled?.(item) ?? false;
	}

	/**
	 * Check if an item is external using the schema
	 */
	getExternal(item: T): boolean {
		return this.schema.getExternal?.(item) ?? false;
	}

	/**
	 * Check if a group is collapsible using the schema
	 */
	getCollapsible(item: T): boolean {
		return this.schema.getCollapsible?.(item) ?? true;
	}

	/**
	 * Get section title using the schema
	 */
	getTitle(item: T): string | undefined {
		return this.schema.getTitle?.(item);
	}

	// ========================================================================
	// Render Context Creation
	// ========================================================================

	/**
	 * Create a render context for use with custom snippets.
	 * Contains pre-computed values from the schema for convenience.
	 */
	createRenderContext(
		item: T,
		depth: number,
		parentId: string | null = null,
		index: number = 0
	): SidebarRenderContext<T> {
		const id = this.getId(item);
		const href = this.getHref(item);
		const kind = this.getKind(item);

		// Create DnD state for this item
		const isKeyboardDragging = this.keyboardDragState?.id === id;
		const isPointerDragging = this.pointerDragState?.id === id && this.pointerDragState.isDragging;
		const isDropTarget = this.dropTargetId === id;
		// When a custom dropIndicator is provided, it handles preview visualization,
		// so items should not show faded preview styling (isPreview = false)
		const hasCustomDropIndicator = !!this.snippets?.dropIndicator;

		const dnd: SidebarDnDState = createDnDState({
			item,
			id,
			kind,
			parentId,
			index,
			depth,
			hasCustomDropIndicator,
			deps: {
				dndEnabled: this.dndEnabled,
				labels: this.labels,
				announcement: this.announcement,
				draggedItem: this.draggedItem,
				keyboardDragState: this.keyboardDragState,
				pointerDragState: this.pointerDragState,
				dropTargetId: this.dropTargetId,
				dropPosition: this.dropPosition,
				getLabel: (value) => this.getLabel(value),
				isPreviewItem: (value) => this.isPreviewItem(value),
				getDragPreviewElement: () => this.#dragPreviewElement,
				getScrollContainer: () => this.#scrollContainer,
				getHoverExpandTargetId: () => this.#hoverExpand.targetId,
				setDraggedItem: (value) => {
					this.draggedItem = value;
				},
				startDrag: (value, targetParentId, targetIndex) =>
					this.startDrag(value, targetParentId, targetIndex),
				endDrag: (animate) => this.endDrag(animate),
				handleKeyDown: (e, value, targetParentId, targetIndex, targetDepth) =>
					this.handleKeyDown(e, value, targetParentId, targetIndex, targetDepth),
				handlePointerDown: (e, value, targetParentId, targetIndex) =>
					this.handlePointerDown(e, value, targetParentId, targetIndex),
				setDropTarget: (value, targetParentId, e) => this.setDropTarget(value, targetParentId, e),
				handleDrop: (value, targetParentId, targetIndex, targetDepth) =>
					this.handleDrop(value, targetParentId, targetIndex, targetDepth),
				findItemById: (targetId) => this.findItemById(targetId) ?? null,
				calculateDepth: (targetParentId) => this.calculateDepth(targetParentId),
				cancelHoverExpandTimer: () => this.cancelHoverExpandTimer()
			}
		});

		return createSidebarRenderContext({
			item,
			id,
			href,
			depth,
			kind,
			activeHref: this.activeHref,
			collapsed: this.isCollapsed,
			dnd,
			deps: {
				getLabel: (value) => this.getLabel(value),
				getIcon: (value) => this.getIcon(value),
				getBadge: (value) => this.getBadge(value),
				getDisabled: (value) => this.getDisabled(value),
				getExternal: (value) => this.getExternal(value),
				getMeta: (value) => this.schema.getMeta?.(value) ?? {},
				isGroupExpanded: (groupId) => this.isGroupExpanded(groupId),
				toggleGroup: (groupId) => this.toggleGroup(groupId)
			}
		});
	}

	// ========================================================================
	// Public Methods
	// ========================================================================

	/**
	 * Toggle sidebar collapsed state
	 */
	toggleCollapsed(): void {
		const previousEffectiveCollapsed = this.isCollapsed;
		const nextUserCollapsed = !this.collapsed;
		const nextEffectiveCollapsed = this.getEffectiveCollapsed(nextUserCollapsed);
		if (
			previousEffectiveCollapsed !== nextEffectiveCollapsed &&
			this.events.onBeforeCollapsedChange?.(nextEffectiveCollapsed) === false
		) {
			return;
		}
		this.collapsed = nextUserCollapsed;
		if (previousEffectiveCollapsed !== nextEffectiveCollapsed) {
			this.events.onCollapsedChange?.(nextEffectiveCollapsed);
		}
	}

	/**
	 * Set sidebar collapsed state
	 */
	setCollapsed(value: boolean): void {
		if (value === this.collapsed) return;
		const previousEffectiveCollapsed = this.isCollapsed;
		const nextEffectiveCollapsed = this.getEffectiveCollapsed(value);
		if (
			previousEffectiveCollapsed !== nextEffectiveCollapsed &&
			this.events.onBeforeCollapsedChange?.(nextEffectiveCollapsed) === false
		) {
			return;
		}
		this.collapsed = value;
		if (previousEffectiveCollapsed !== nextEffectiveCollapsed) {
			this.events.onCollapsedChange?.(nextEffectiveCollapsed);
		}
	}

	/**
	 * Toggle a group's expanded state
	 */
	toggleGroup(groupId: string): void {
		const currentState = this.#expandedGroupsMap[groupId] ?? false;
		const willExpand = !currentState;
		if (this.events.onBeforeGroupToggle?.(groupId, willExpand) === false) {
			return;
		}
		this.#expandedGroupsMap[groupId] = willExpand;
		this.events.onGroupToggle?.(groupId, willExpand);
	}

	/**
	 * Set a group's expanded state
	 */
	setGroupExpanded(groupId: string, expanded: boolean): void {
		const currentState = this.#expandedGroupsMap[groupId] ?? false;
		if (currentState === expanded) return;
		if (this.events.onBeforeGroupToggle?.(groupId, expanded) === false) {
			return;
		}
		this.#expandedGroupsMap[groupId] = expanded;
		this.events.onGroupToggle?.(groupId, expanded);
	}

	/**
	 * Set the currently active href (called from root Sidebar)
	 */
	setActiveHref(href: string): void {
		this.activeHref = href;
	}

	/**
	 * Check if a group is expanded
	 * Returns a reactive value that only updates when THIS specific group changes
	 */
	isGroupExpanded(groupId: string): boolean {
		return this.#expandedGroupsMap[groupId] ?? false;
	}

	/**
	 * Get all expanded group IDs (for utilities/debugging)
	 */
	getExpandedGroupIds(): string[] {
		return Object.entries(this.#expandedGroupsMap)
			.filter(([, expanded]) => expanded)
			.map(([id]) => id);
	}

	/**
	 * Expand all groups in the path to an item
	 */
	expandPathTo(itemId: string): void {
		const path = this.findPathToItem(itemId);
		for (const id of path) {
			this.#expandedGroupsMap[id] = true;
		}
	}

	/**
	 * Handle navigation to a page (legacy compatibility)
	 */
	handleNavigate(page: SidebarPage): void {
		this.events.onNavigate?.(page);
	}

	// ========================================================================
	// Drag and Drop Methods
	// ========================================================================

	/**
	 * Set the custom drag preview element (called by Sidebar component)
	 */
	setDragPreviewElement(element: HTMLElement | null): void {
		this.#dragPreviewElement = element;
	}

	/**
	 * Get the custom drag preview element
	 */
	getDragPreviewElement(): HTMLElement | null {
		return this.#dragPreviewElement;
	}

	/**
	 * Start dragging an item
	 */
	startDrag(item: T, parentId: string | null, index: number): void {
		this.draggedItem = {
			id: this.getId(item),
			item,
			parentId,
			index
		};
	}

	/**
	 * End dragging (cleanup)
	 * @param animate - Whether to animate items back if preview was active
	 */
	endDrag(animate: boolean = false): void {
		// Clear any pending preview debounce (don't flush — we're ending the drag)
		if (this.#previewDebounceTimer !== null) {
			clearTimeout(this.#previewDebounceTimer);
			this.#previewDebounceTimer = null;
		}

		// Capture positions if we need to animate back (respects animated flag)
		const shouldAnimate = animate && this.animated && this.previewInsert;
		if (shouldAnimate) {
			this.captureItemPositions();
		}

		this.draggedItem = null;
		this.dropTargetId = null;
		this.dropPosition = null;
		this.previewInsert = null;
		this.cancelHoverExpandTimer();
		this.stopAutoScroll();

		// Animate items back to original positions
		if (shouldAnimate) {
			requestAnimationFrame(() => this.animateItemPositions());
		}
	}

	/**
	 * Calculate drop position based on mouse Y coordinate relative to element
	 */
	calculateDropPosition(
		e: DragEvent | PointerEvent,
		targetKind: ItemKind,
		currentPosition?: DropPosition | null
	): DropPosition {
		const target = e.currentTarget as HTMLElement;
		if (!target) return 'inside';

		const rect = target.getBoundingClientRect();
		return this.calculateDropPositionFromRect(e.clientY, rect, targetKind, currentPosition);
	}

	/**
	 * Set the current drop target (with validation)
	 */
	setDropTarget(
		targetItem: T | null,
		targetParentId?: string | null,
		event?: DragEvent | PointerEvent
	): void {
		if (targetItem === null) {
			this.dropTargetId = null;
			this.dropPosition = null;
			this.cancelHoverExpandTimer();
			return;
		}

		const targetId = this.getId(targetItem);
		const targetKind = this.getKind(targetItem);

		// Calculate drop position from event, passing current position for hysteresis
		const currentPos = this.dropTargetId === targetId ? this.dropPosition : null;
		const position = event ? this.calculateDropPosition(event, targetKind, currentPos) : 'inside';

		this.setDropTargetInternal(targetItem, targetParentId ?? null, targetId, targetKind, position);
	}

	/**
	 * Set drop target with explicit rect (for touch drag where we have cached rects)
	 */
	setDropTargetWithRect(
		targetItem: T,
		targetParentId: string | null,
		clientY: number,
		rect: DOMRect
	): void {
		const targetId = this.getId(targetItem);
		const targetKind = this.getKind(targetItem);

		// Calculate drop position from clientY and rect, passing current position for hysteresis
		const currentPos = this.dropTargetId === targetId ? this.dropPosition : null;
		const position = this.calculateDropPositionFromRect(clientY, rect, targetKind, currentPos);

		this.setDropTargetInternal(targetItem, targetParentId, targetId, targetKind, position);
	}

	/**
	 * Calculate drop position from clientY and bounding rect
	 */
	private calculateDropPositionFromRect(
		clientY: number,
		rect: DOMRect,
		targetKind: ItemKind,
		currentPosition?: DropPosition | null
	): DropPosition {
		const relativeY = clientY - rect.top;
		const height = Math.max(rect.height, 1);

		// Provide a small pixel-based edge zone so users don't need to travel
		// deep into the item to trigger before/after.
		const edgePx = Math.min(16, height * 0.25);
		if (relativeY <= edgePx) return 'before';
		if (height - relativeY <= edgePx) return 'after';

		const ratio = relativeY / height;

		// Hysteresis buffer: when a position is already set, require the cursor to move
		// further past the boundary before switching. This prevents flickering at edges.
		const HYSTERESIS = 0.04;

		if (targetKind === 'group' || targetKind === 'section') {
			// Nominal boundaries: before < 0.2, inside 0.2-0.8, after > 0.8
			const BEFORE_BOUNDARY = 0.2;
			const AFTER_BOUNDARY = 0.8;
			if (currentPosition === 'before') {
				// Stay "before" until cursor passes boundary + buffer
				return ratio < BEFORE_BOUNDARY + HYSTERESIS
					? 'before'
					: ratio > AFTER_BOUNDARY
						? 'after'
						: 'inside';
			} else if (currentPosition === 'after') {
				// Stay "after" until cursor passes boundary - buffer
				return ratio > AFTER_BOUNDARY - HYSTERESIS
					? 'after'
					: ratio < BEFORE_BOUNDARY
						? 'before'
						: 'inside';
			} else if (currentPosition === 'inside') {
				// Stay "inside" until cursor passes boundaries - buffer
				if (ratio < BEFORE_BOUNDARY - HYSTERESIS) return 'before';
				if (ratio > AFTER_BOUNDARY + HYSTERESIS) return 'after';
				return 'inside';
			}
			// No current position — use nominal boundaries
			if (ratio < BEFORE_BOUNDARY) return 'before';
			if (ratio > AFTER_BOUNDARY) return 'after';
			return 'inside';
		} else {
			// Pages: before/after at 0.5 boundary
			if (currentPosition === 'before') {
				return ratio < 0.5 + HYSTERESIS ? 'before' : 'after';
			} else if (currentPosition === 'after') {
				return ratio > 0.5 - HYSTERESIS ? 'after' : 'before';
			}
			return ratio < 0.5 ? 'before' : 'after';
		}
	}

	/**
	 * Internal method to set drop target after position is calculated
	 */
	private setDropTargetInternal(
		targetItem: T,
		targetParentId: string | null,
		targetId: string,
		targetKind: ItemKind,
		position: DropPosition
	): void {

		// Validate drop target if we have drag info
		if (this.draggedItem && targetParentId !== undefined) {
			const draggedKind = this.getKind(this.draggedItem.item);
			const validTarget = isValidDropTarget({
				draggedItem: this.draggedItem,
				draggedKind,
				targetId,
				targetKind,
				targetParentId,
				position,
				isDescendant: (candidateId, ancestorId) => this.isDropDescendantOf(candidateId, ancestorId)
			});
			if (!validTarget) {
				return;
			}
		}

		// Start hover-expand timer for collapsed groups
		if (targetKind === 'group' && position === 'inside') {
			const isExpanded = this.isGroupExpanded(targetId);
			if (!isExpanded) {
				this.startHoverExpandTimer(targetId);
			}
		} else {
			this.cancelHoverExpandTimer();
		}

		if (this.dropTargetId !== targetId || this.dropPosition !== position) {
			this.dropTargetId = targetId;
			this.dropPosition = position;

			// Update live preview (debounced to avoid layout thrashing)
			this.schedulePreviewUpdate();
		}
	}

	/**
	 * Handle drop on a target item
	 */
	private getEffectiveReorderMode(): Exclude<SidebarReorderMode, 'auto'> {
		return resolveReorderMode(this.reorderMode, !!this.onReorder);
	}

	private canReorderInternally(): boolean {
		return schemaSupportsInternalReorder(this.schema);
	}

	private applyInternalReorder(event: SidebarReorderEvent<T>): boolean {
		if (!this.canReorderInternally()) {
			return false;
		}

		this.data = applyInternalReorderToData({
			data: this.data,
			event,
			schema: this.schema,
			getId: (item) => this.getId(item)
		});

		return true;
	}

	handleDrop(
		_targetItem: T,
		_targetParentId: string | null,
		_targetIndex: number,
		_targetDepth: number
	): void {
		if (!this.draggedItem) {
			return;
		}
		const mode = this.getEffectiveReorderMode();
		const canInternal = this.canReorderInternally();
		const hasExternalHandler = !!this.onReorder;

		// Controlled mode requires an external handler. Uncontrolled mode requires schema setters.
		if (!hasExternalHandler && (mode === 'controlled' || !canInternal)) {
			this.endDrag(true);
			return;
		}

		// Ensure previewInsert reflects the latest drop target/position before we
		// decide where to drop. This prevents "snap back" when debounce lags.
		if (this.livePreview) {
			this.flushPreviewDebounce();
		}

		const position = this.dropPosition ?? 'inside';

		// If live preview is enabled and we have a preview position, use it.
		// This ensures WYSIWYG behavior - we drop exactly where the user sees the item
		// even if the mouse has moved slightly or the preview debouncing/animation caused a lag.
		let calculated: { parentId: string | null; index: number } | null = null;

		if (this.livePreview && this.previewInsert) {
			calculated = this.previewInsert;
		} else {
			// Fallback to calculation from current drop target
			// Always calculate the insert position from dropTargetId/dropPosition,
			// which are the authoritative source of truth (updated synchronously).
			if (!this.dropTargetId || !this.dropPosition) {
				this.endDrag();
				return;
			}
			calculated = this.calculateInsertPosition(this.dropTargetId, this.dropPosition);
		}

		if (!calculated) {
			this.endDrag();
			return;
		}
		const { parentId: toParentId, index: toIndex } = calculated;

		// Calculate depth based on parent
		const toDepth = this.calculateDepth(toParentId);

		// Build reorder event
		const reorderEvent: SidebarReorderEvent<T> = {
			item: this.draggedItem.item,
			fromIndex: this.draggedItem.index,
			toIndex,
			fromParentId: this.draggedItem.parentId,
			toParentId,
			depth: toDepth,
			position
		};

		// Check if reorder should be prevented
		if (this.events.onBeforeReorder?.(reorderEvent as SidebarReorderEvent) === false) {
			this.endDrag(true); // Animate back
			return;
		}

		// Capture positions before reorder for FLIP animation (when livePreview is off)
		if (!this.livePreview) {
			this.captureItemPositions();
		}

		// Uncontrolled mode: apply the reorder internally when possible.
		if (mode === 'uncontrolled' && canInternal) {
			this.applyInternalReorder(reorderEvent);
		}

		// External handler is always notified when provided.
		this.onReorder?.(reorderEvent);

		// Animate items to new positions (when livePreview is off)
		if (!this.livePreview) {
			// Use requestAnimationFrame to ensure DOM has updated
			requestAnimationFrame(() => {
				this.animateItemPositions();
			});
		}

		this.endDrag();
	}

	/**
	 * Calculate the insert position (parentId and index) based on target and position
	 */
	private calculateInsertPosition(
		targetId: string,
		position: DropPosition
	): { parentId: string | null; index: number } | null {
		return calculateInsertPositionForPreview({
			draggedItem: this.draggedItem,
			targetId,
			position,
			deps: {
				getKind: (item) => this.getKind(item),
				getId: (item) => this.getId(item),
				findItemById: (id) => this.findItemById(id)
			}
		});
	}

	/**
	 * Check if targetId is the same as ancestorId or is a descendant of it.
	 * Prevents dropping an item into itself or its children.
	 */
	private isDropDescendantOf(targetId: string, ancestorId: string): boolean {
		const index = this.getTreeIndex();
		return isDescendantInTree(
			{
				data: this.data,
				getId: (item) => this.getId(item),
				getItems: (item) => this.getItems(item),
				index
			},
			targetId,
			ancestorId
		);
	}

	// ========================================================================
	// Live Preview Methods
	// ========================================================================

	/**
	 * Check if an item is the preview placeholder (the dragged item shown at its target position).
	 * This is true when:
	 * 1. Live preview is active
	 * 2. The item being checked is the dragged item
	 * 3. The dragged item is being shown at a different position than its original
	 */
	isPreviewItem(id: string): boolean {
		return isPreviewItemForPreview({
			livePreview: this.livePreview,
			draggedItem: this.draggedItem,
			previewInsert: this.previewInsert,
			id
		});
	}

	/**
	 * Get items with live preview reordering applied.
	 * During drag, shows items as they would appear after drop.
	 */
	getItemsWithPreview(items: T[], parentId: string | null): T[] {
		return getItemsWithPreviewForPreview({
			items,
			parentId,
			draggedItem: this.draggedItem,
			previewInsert: this.previewInsert,
			getId: (item) => this.getId(item)
		});
	}

	/**
	 * Update the preview insertion point based on current drop target and position
	 */
	private updatePreviewInsert(): void {
		// Skip live preview if disabled (user is using custom drop indicators)
		if (!this.livePreview) {
			this.previewInsert = null;
			return;
		}

		if (!this.draggedItem || !this.dropTargetId || !this.dropPosition) {
			this.previewInsert = null;
			return;
		}

		const nextPreview = computePreviewInsert({
			livePreview: this.livePreview,
			draggedItem: this.draggedItem,
			dropTargetId: this.dropTargetId,
			dropPosition: this.dropPosition,
			deps: {
				getKind: (item) => this.getKind(item),
				getId: (item) => this.getId(item),
				findItemById: (id) => this.findItemById(id)
			}
		});
		if (!nextPreview) {
			this.previewInsert = null;
			return;
		}
		const { parentId: toParentId, index: toIndex } = nextPreview;

		// Only update if changed to avoid unnecessary re-renders
		// Also skip updates while animation is in progress to prevent feedback loop
		if (
			!this.#flip.isAnimating &&
			(!this.previewInsert ||
				this.previewInsert.parentId !== toParentId ||
				this.previewInsert.index !== toIndex)
		) {
			// Capture positions before the preview changes (for FLIP animation)
			if (this.animated) {
				this.captureItemPositions();
			}

			this.previewInsert = { parentId: toParentId, index: toIndex };

			// Animate items to new positions after DOM updates
			if (this.animated) {
				requestAnimationFrame(() => {
					this.animateItemPositions();
				});
			}
		}
	}

	/**
	 * Schedule a debounced preview update.
	 * Drop target/position state updates immediately (for CSS indicators),
	 * but DOM-shuffling preview is delayed to avoid layout thrashing feedback loops.
	 */
	private schedulePreviewUpdate(): void {
		if (this.#previewDebounceTimer !== null) {
			clearTimeout(this.#previewDebounceTimer);
		}
		this.#previewDebounceTimer = setTimeout(() => {
			this.#previewDebounceTimer = null;
			this.updatePreviewInsert();
		}, 40);
	}

	/**
	 * Cancel any pending preview debounce timer and flush the update if needed.
	 */
	private flushPreviewDebounce(): void {
		if (this.#previewDebounceTimer !== null) {
			clearTimeout(this.#previewDebounceTimer);
			this.#previewDebounceTimer = null;
			this.updatePreviewInsert();
		}
	}

	// ========================================================================
	// Keyboard DnD Methods
	// ========================================================================

	private getKeyboardDeps() {
		return {
			getId: (item: T) => this.getId(item),
			getLabel: (item: T) => this.getLabel(item),
			getKind: (item: T) => this.getKind(item),
			getItems: (item: T) => this.getItems(item),
			getSiblingsAtLevel: (parentId: string | null) => this.getSiblingsAtLevel(parentId),
			findItemById: (id: string) => this.findItemById(id),
			isGroupExpanded: (id: string) => this.isGroupExpanded(id),
			setGroupExpandedDirect: (id: string, expanded: boolean) => {
				this.#expandedGroupsMap[id] = expanded;
				this.events.onGroupToggle?.(id, expanded);
				if (expanded) {
					this.announcement = this.announcements.groupExpanded;
				}
			},
			captureItemPositions: () => this.captureItemPositions(),
			animateItemPositions: () => this.animateItemPositions(),
			announcements: this.announcements,
			formatAnnouncement: (template: string, values: Record<string, string | number>) =>
				this.formatAnnouncement(template, values),
			setAnnouncement: (value: string) => {
				this.announcement = value;
			},
			getKeyboardDragState: () => this.keyboardDragState,
			setKeyboardDragState: (value: KeyboardDragState<T> | null) => {
				this.keyboardDragState = value;
			},
			setDraggedItem: (value: { id: string; item: T; parentId: string | null; index: number } | null) => {
				this.draggedItem = value;
			},
			setPreviewInsert: (value: { parentId: string | null; index: number } | null) => {
				this.previewInsert = value;
			}
		};
	}

	/**
	 * Handle keyboard events on drag handle
	 */
	handleKeyDown(
		e: KeyboardEvent,
		item: T,
		parentId: string | null,
		index: number,
		depth: number
	): void {
		if (!this.dndEnabled) return;

		const id = this.getId(item);
		const shortcuts = this.settings.dnd.keyboard;

		// If keyboard drag is not active
		if (!this.keyboardDragState) {
			// Space or Enter to pick up
			if (this.matchesShortcut(e.key, shortcuts.pickUpDrop)) {
				e.preventDefault();
				this.pickUpItem(item, parentId, index, depth);
			}
			return;
		}

		// If this item is being dragged
		if (this.keyboardDragState.id === id) {
			e.preventDefault();

			if (this.matchesShortcut(e.key, shortcuts.moveUp)) {
				this.movePickedUpItem(-1);
			} else if (this.matchesShortcut(e.key, shortcuts.moveDown)) {
				this.movePickedUpItem(1);
			} else if (this.matchesShortcut(e.key, shortcuts.moveToParent)) {
				// Move to parent level (if nested)
				this.movePickedUpItemToParent();
			} else if (this.matchesShortcut(e.key, shortcuts.moveIntoGroup)) {
				// Move into previous sibling group (if it's a group)
				this.movePickedUpItemIntoGroup();
			} else if (this.matchesShortcut(e.key, shortcuts.pickUpDrop)) {
				this.dropPickedUpItem(depth);
			} else if (this.matchesShortcut(e.key, shortcuts.cancel)) {
				this.cancelKeyboardDrag();
			}
		}
	}

	/**
	 * Pick up an item for keyboard reordering
	 */
	pickUpItem(item: T, parentId: string | null, index: number, _depth: number): void {
		pickUpItemForDnD(this.getKeyboardDeps(), item, parentId, index);
	}

	/**
	 * Move the picked up item up or down
	 */
	movePickedUpItem(direction: -1 | 1): void {
		movePickedUpItemForDnD(this.getKeyboardDeps(), direction);
	}

	/**
	 * Move picked up item to parent level
	 */
	movePickedUpItemToParent(): void {
		movePickedUpItemToParentForDnD(this.getKeyboardDeps());
	}

	/**
	 * Move picked up item into a sibling group
	 */
	movePickedUpItemIntoGroup(): void {
		movePickedUpItemIntoGroupForDnD(this.getKeyboardDeps());
	}

	/**
	 * Drop the picked up item at its current position
	 */
	dropPickedUpItem(depth: number): void {
		if (!this.keyboardDragState) return;
		const mode = this.getEffectiveReorderMode();
		const canInternal = this.canReorderInternally();
		const hasExternalHandler = !!this.onReorder;

		if (!hasExternalHandler && (mode === 'controlled' || !canInternal)) {
			this.cancelKeyboardDrag();
			return;
		}

		const { item, originalParentId, originalIndex, currentIndex, currentParentId } =
			this.keyboardDragState;

		// Calculate depth based on parent
		let toDepth = depth;
		if (currentParentId !== originalParentId) {
			// Count depth by traversing to root
			toDepth = this.calculateDepth(currentParentId);
		}

		const label = this.getLabel(item);

		// Build reorder event
		const reorderEvent: SidebarReorderEvent<T> = {
			item,
			fromIndex: originalIndex,
			toIndex: currentIndex,
			fromParentId: originalParentId,
			toParentId: currentParentId,
			depth: toDepth,
			position: 'before' // Keyboard always uses explicit positioning
		};

		// Check if reorder should be prevented
		if (this.events.onBeforeReorder?.(reorderEvent as SidebarReorderEvent) === false) {
			this.cancelKeyboardDrag();
			return;
		}

		// Items are already in preview position, so no FLIP animation needed
		if (mode === 'uncontrolled' && canInternal) {
			this.applyInternalReorder(reorderEvent);
		}
		this.onReorder?.(reorderEvent);

		this.announcement = this.formatAnnouncement(this.announcements.dropped, { label });

		// Clean up all drag state
		this.keyboardDragState = null;
		this.draggedItem = null;
		this.previewInsert = null;
	}

	/**
	 * Cancel keyboard drag and restore original position
	 */
	cancelKeyboardDrag(): void {
		cancelKeyboardDragForDnD(this.getKeyboardDeps());
	}

	/**
	 * Get siblings at a given parent level
	 */
	private getSiblingsAtLevel(parentId: string | null): T[] {
		if (parentId === null) {
			// Root level - return all sections
			return this.data;
		}

		// Fast path: use the index to find the parent and return its children.
		const index = this.getTreeIndex();
		const entry = index.entries.get(parentId);
		if (entry) {
			return this.getItems(entry.item);
		}

		// Fallback: parent not found in index.
		return [];
	}

	/**
	 * Find an item by ID and return its parent info
	 */
	private findItemById(
		targetId: string
	): { item: T; parentId: string | null; index: number } | null {
		const index = this.getTreeIndex();
		return findItemByIdInTree(
			{
				data: this.data,
				getId: (item) => this.getId(item),
				getItems: (item) => this.getItems(item),
				index
			},
			targetId
		);
	}

	/**
	 * Calculate depth by counting parents
	 */
	private calculateDepth(parentId: string | null): number {
		const index = this.getTreeIndex();
		return calculateTreeDepth(
			{
				data: this.data,
				getId: (item) => this.getId(item),
				getItems: (item) => this.getItems(item),
				index
			},
			parentId
		);
	}

	// ========================================================================
	// Pointer/Touch DnD Methods
	// ========================================================================

	private getPointerDeps() {
		return {
			dndEnabled: this.dndEnabled,
			longPressDelay: this.longPressDelay,
			rectCacheInterval: this.rectCacheInterval,
			getPointerDragState: () => this.pointerDragState,
			setPointerDragState: (value: PointerDragState<T> | null) => {
				this.pointerDragState = value;
			},
			getDraggedItemId: () => this.draggedItem?.id ?? null,
			getDropTargetId: () => this.dropTargetId,
			setLastRectCacheTime: (value: number) => {
				this.#lastRectCacheTime = value;
			},
			getLastRectCacheTime: () => this.#lastRectCacheTime,
			getDropZoneRects: () => this.#dropZoneRects,
			setDropZoneRects: (rects: DropZoneRect[]) => {
				this.#dropZoneRects = rects;
			},
			cacheDropZoneRects: () => this.cacheDropZoneRects(),
			findDropZoneAtPoint: (x: number, y: number) => this.findDropZoneAtPoint(x, y),
			getId: (item: T) => this.getId(item),
			getLabel: (item: T) => this.getLabel(item),
			startDrag: (item: T, parentId: string | null, index: number) =>
				this.startDrag(item, parentId, index),
			endDrag: (animate?: boolean) => this.endDrag(animate),
			setDropTargetWithRect: (item: T, parentId: string | null, clientY: number, rect: DOMRect) =>
				this.setDropTargetWithRect(item, parentId, clientY, rect),
			setDropTarget: (item: T | null) => this.setDropTarget(item),
			findItemById: (id: string) => this.findItemById(id),
			calculateDepth: (parentId: string | null) => this.calculateDepth(parentId),
			handleDrop: (item: T, parentId: string | null, index: number, depth: number) =>
				this.handleDrop(item, parentId, index, depth),
			handleDragAutoScroll: (clientY: number) => this.handleDragAutoScroll(clientY),
			stopAutoScroll: () => this.stopAutoScroll(),
			formatAnnouncement: (template: string, values: Record<string, string | number>) =>
				this.formatAnnouncement(template, values),
			announceTouchDragStarted: (label: string) => {
				this.announcement = this.formatAnnouncement(this.announcements.touchDragStarted, { label });
			},
			addGlobalListeners: () => {
				document.addEventListener('pointermove', this.#boundPointerMove, { passive: false });
				document.addEventListener('pointerup', this.#boundPointerUp);
				document.addEventListener('pointercancel', this.#boundPointerUp);
			},
			removeGlobalListeners: () => {
				document.removeEventListener('pointermove', this.#boundPointerMove);
				document.removeEventListener('pointerup', this.#boundPointerUp);
				document.removeEventListener('pointercancel', this.#boundPointerUp);
			}
		};
	}

	/**
	 * Handle pointer down on drag handle
	 */
	handlePointerDown(e: PointerEvent, item: T, parentId: string | null, index: number): void {
		handlePointerDownForDnD(this.getPointerDeps(), e, item, parentId, index);
	}

	/**
	 * Bound pointer move handler
	 */
	#boundPointerMove = (e: PointerEvent): void => {
		this.handlePointerMove(e);
	};

	/**
	 * Bound pointer up handler
	 */
	#boundPointerUp = (e: PointerEvent): void => {
		this.handlePointerUp(e);
	};

	/**
	 * Start pointer drag after long press
	 */
	private startPointerDrag(): void {
		startPointerDragForDnD(this.getPointerDeps());
	}

	/**
	 * Cache bounding rects of all drop zones for hit testing during touch drag
	 */
	private cacheDropZoneRects(): void {
		const excludeId = this.pointerDragState?.id ?? this.draggedItem?.id ?? null;
		this.#dropZoneRects = cacheDropZoneRectsForDnD({
			container: this.#scrollContainer,
			excludeId
		});
	}

	/**
	 * Find drop zone at given coordinates using cached rects
	 */
	private findDropZoneAtPoint(x: number, y: number): { id: string; element: HTMLElement } | null {
		return findDropZoneAtPointForDnD(this.#dropZoneRects, x, y);
	}

	/**
	 * Handle pointer move during drag
	 */
	handlePointerMove(e: PointerEvent): void {
		handlePointerMoveForDnD(this.getPointerDeps(), e);
	}

	/**
	 * Handle pointer up (drop or cancel)
	 */
	handlePointerUp(_e: PointerEvent): void {
		handlePointerUpForDnD(this.getPointerDeps());
	}

	/**
	 * Clean up pointer drag state
	 */
	private cleanupPointerDrag(): void {
		cleanupPointerDragForDnD(this.getPointerDeps());
	}

	// ========================================================================
	// Auto-scroll Methods
	// ========================================================================

	/**
	 * Set the scroll container for auto-scroll during drag
	 */
	setScrollContainer(element: HTMLElement | null): void {
		this.#scrollContainer = element;
	}

	/**
	 * Handle auto-scroll when dragging near edges
	 */
	handleDragAutoScroll(clientY: number): void {
		this.#autoScroll.handleDrag({
			clientY,
			container: this.#scrollContainer,
			threshold: this.autoScrollThreshold,
			maxSpeed: this.autoScrollMaxSpeed
		});
	}

	/**
	 * Stop auto-scroll animation
	 */
	stopAutoScroll(): void {
		this.#autoScroll.stop();
	}

	// ========================================================================
	// Container-level Drag Handlers (gap fallback)
	// ========================================================================

	/**
	 * Find the nearest drop zone by vertical distance when the cursor is in a gap.
	 * Returns the closest item above or below the cursor position.
	 */
	private findNearestDropZone(
		_x: number,
		y: number
	): { id: string; element: HTMLElement; rect: DOMRect } | null {
		return findNearestDropZoneForDnD(this.#dropZoneRects, y);
	}

	/**
	 * Get event handlers for the scroll container to catch drag events in gaps between items.
	 * Per-item ondragover uses e.stopPropagation(), so these only fire when the cursor
	 * is NOT over an item (i.e., in a gap).
	 */
	getContainerDragHandlers(): {
		ondragover: (e: DragEvent) => void;
		ondragleave: (e: DragEvent) => void;
		ondrop: (e: DragEvent) => void;
	} {
		return {
			ondragover: (e: DragEvent) => {
				if (!this.draggedItem) return;

				e.preventDefault();

				// Cache rects periodically
				const now = Date.now();
				if (now - this.#lastRectCacheTime > this.rectCacheInterval) {
					this.cacheDropZoneRects();
					this.#lastRectCacheTime = now;
				}

				// Try exact hit first, then nearest
				const exactHit = this.findDropZoneAtPoint(e.clientX, e.clientY);
				const nearestHit = exactHit ? null : this.findNearestDropZone(e.clientX, e.clientY);
				const dropZoneId = exactHit?.id ?? nearestHit?.id;
				const dropZoneElement = exactHit?.element ?? nearestHit?.element;

				if (dropZoneId && dropZoneElement) {
					const targetItem = this.findItemById(dropZoneId);
					if (targetItem) {
						const rect = nearestHit?.rect ?? dropZoneElement.getBoundingClientRect();
						this.setDropTargetWithRect(
							targetItem.item,
							targetItem.parentId,
							e.clientY,
							rect
						);
					}
				}

				// Handle auto-scroll
				this.handleDragAutoScroll(e.clientY);
			},
			ondragleave: (e: DragEvent) => {
				if (!this.draggedItem) return;

				// Only clear if leaving the container entirely
				const relatedTarget = e.relatedTarget as Node | null;
				const currentTarget = e.currentTarget as Node | null;
				if (relatedTarget && currentTarget?.contains(relatedTarget)) {
					return;
				}

				this.setDropTarget(null);
				this.cancelHoverExpandTimer();
			},
			ondrop: (e: DragEvent) => {
				if (!this.draggedItem) return;

				e.preventDefault();

				if (this.dropTargetId && this.dropPosition) {
					const targetInfo = this.findItemById(this.dropTargetId);
					if (targetInfo) {
						const depth = this.calculateDepth(targetInfo.parentId);
						this.handleDrop(targetInfo.item, targetInfo.parentId, targetInfo.index, depth);
						return;
					}
				}

				this.endDrag(true);
			}
		};
	}

	// ========================================================================
	// Hover-expand Methods
	// ========================================================================

	/**
	 * Start timer to expand a collapsed group on hover during drag
	 */
	startHoverExpandTimer(groupId: string): void {
		this.#hoverExpand.start({
			groupId,
			delayMs: this.hoverExpandDelay,
			isExpanded: (id) => this.isGroupExpanded(id),
			onExpand: (id) => {
				// Direct assignment to bypass onBeforeGroupToggle during DnD hover-expand
				this.#expandedGroupsMap[id] = true;
				this.events.onGroupToggle?.(id, true);
				this.announcement = this.announcements.groupExpanded;
			}
		});
	}

	/**
	 * Cancel hover-expand timer
	 */
	cancelHoverExpandTimer(): void {
		this.#hoverExpand.cancel();
	}

	// ========================================================================
	// FLIP Animation Methods
	// ========================================================================

	/**
	 * Capture current positions of all items for FLIP animation
	 */
	captureItemPositions(): void {
		this.#flip.capture(this.#scrollContainer);
	}

	/**
	 * Animate items from old positions to new positions (FLIP)
	 */
	animateItemPositions(): void {
		this.#flip.animate({
			container: this.#scrollContainer,
			enabled: this.animated,
			durationMs: this.settings.animationDuration
		});
	}

	// ========================================================================
	// Private Methods
	// ========================================================================

	private getTreeIndex(): TreeIndex<T> {
		if (this.#treeIndex && this.#treeIndexSource === this.data) {
			return this.#treeIndex;
		}
		this.#treeIndex = buildTreeIndex({
			data: this.data,
			getId: (item) => this.getId(item),
			getItems: (item) => this.getItems(item)
		});
		this.#treeIndexSource = this.data;
		return this.#treeIndex;
	}

	/**
	 * Invalidate the cached tree index. Useful if data is mutated in place.
	 */
	invalidateTreeIndex(): void {
		this.#treeIndex = null;
		this.#treeIndexSource = null;
	}

	private getInitialExpandedGroups(): Record<string, boolean> {
		return getInitialExpandedGroupsInTree({
			data: this.data,
			getId: (item) => this.getId(item),
			getKind: (item) => this.getKind(item),
			getItems: (item) => this.getItems(item),
			getDefaultExpanded: (item) => this.schema.getDefaultExpanded?.(item) ?? false
		});
	}

	private loadPersistedState(): void {
		const persisted = loadPersistedSidebarState(toPersistenceSettings(this.settings));

		if (persisted.collapsed !== null) {
			this.collapsed = persisted.collapsed;
		}

		// Merge persisted expanded groups with initial state
		for (const id of persisted.expandedGroupIds) {
			this.#expandedGroupsMap[id] = true;
		}
	}

	private persistState(collapsed: boolean, expandedMap: Record<string, boolean>): void {
		persistSidebarState(toPersistenceSettings(this.settings), collapsed, expandedMap);
	}

	private findPathToItem(targetId: string): string[] {
		const index = this.getTreeIndex();
		return findPathToItemInTree(
			{
				data: this.data,
				getId: (item) => this.getId(item),
				getKind: (item) => this.getKind(item),
				getItems: (item) => this.getItems(item),
				index
			},
			targetId
		);
	}
}

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Create and set sidebar context (new generic API)
 */
export function createSidebarContext<T = SidebarItem | SidebarSection>(options: {
	config?: SidebarConfig;
	data?: T[];
	schema?: SidebarSchema<T>;
	settings?: SidebarSettings;
	events?: SidebarEvents;
}): SidebarContext<T> {
	const context = new SidebarContext<T>(options);
	setContext(SIDEBAR_CONTEXT_KEY, context);
	return context;
}

/**
 * Set sidebar context (for use when context is created externally)
 */
export function setSidebarContext<T>(context: SidebarContext<T>): void {
	setContext(SIDEBAR_CONTEXT_KEY, context);
}

/**
 * Get sidebar context from parent component
 */
export function getSidebarContext<T = unknown>(): SidebarContext<T> {
	const context = getContext<SidebarContext<T>>(SIDEBAR_CONTEXT_KEY);
	if (!context) {
		throw new Error(
			'Sidebar context not found. Make sure to use this component inside a <Sidebar> component.'
		);
	}
	return context;
}

/**
 * Try to get sidebar context (returns undefined if not found)
 */
export function tryGetSidebarContext<T = unknown>(): SidebarContext<T> | undefined {
	return getContext<SidebarContext<T>>(SIDEBAR_CONTEXT_KEY);
}
