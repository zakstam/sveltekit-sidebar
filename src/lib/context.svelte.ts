import { getContext, setContext, untrack, flushSync } from 'svelte';
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
	SidebarResponsiveMode
} from './types.js';
import { defaultSchema } from './types.js';

const SIDEBAR_CONTEXT_KEY = Symbol('sidebar-context');

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_RESPONSIVE_SETTINGS: Required<SidebarResponsiveSettings> = {
	enabled: true,
	mobileBreakpoint: 768,
	tabletBreakpoint: 1024,
	defaultMode: 'desktop',
	closeOnNavigation: true,
	closeOnEscape: true,
	lockBodyScroll: true
};

const DEFAULT_SETTINGS: Required<Omit<SidebarSettings, 'responsive'>> & {
	responsive: Required<SidebarResponsiveSettings>;
} = {
	widthExpanded: '280px',
	widthCollapsed: '64px',
	animationDuration: 200,
	persistCollapsed: true,
	persistExpandedGroups: true,
	storageKey: 'sveltekit-sidebar',
	defaultCollapsed: false,
	responsive: DEFAULT_RESPONSIVE_SETTINGS
};

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
	readonly settings: Required<Omit<SidebarSettings, 'responsive'>> & {
		responsive: Required<SidebarResponsiveSettings>;
	};
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
	#mobileMediaQuery: MediaQueryList | null = null;
	#tabletMediaQuery: MediaQueryList | null = null;
	#mobileQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
	#tabletQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

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
	readonly longPressDelay = 400; // ms
	#dropZoneRects: Array<{ id: string; rect: DOMRect; element: HTMLElement }> = [];
	#lastRectCacheTime = 0;
	readonly rectCacheInterval = 100; // Refresh rects every 100ms during drag

	// Custom drag preview element (set by Sidebar component)
	#dragPreviewElement: HTMLElement | null = null;

	// Auto-scroll state
	#scrollContainer: HTMLElement | null = null;
	#autoScrollAnimationId: number | null = null;
	readonly autoScrollThreshold = 50; // px from edge
	readonly autoScrollMaxSpeed = 15; // px per frame

	// Hover-expand state
	#hoverExpandTimerId: ReturnType<typeof setTimeout> | null = null;
	#hoverExpandTargetId: string | null = null;
	readonly hoverExpandDelay = 500; // ms

	// FLIP animation state
	#itemPositions = new Map<string, DOMRect>();
	#isAnimating = false;
	#previousPreview: { parentId: string | null; index: number } | null = null;

	// Getters for derived values
	get width(): string {
		return this.collapsed ? this.settings.widthCollapsed : this.settings.widthExpanded;
	}

	get isCollapsed(): boolean {
		return this.collapsed;
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
			this.settings = {
				...DEFAULT_SETTINGS,
				...config.settings,
				responsive: { ...DEFAULT_RESPONSIVE_SETTINGS, ...config.settings?.responsive }
			};
		} else if (data) {
			// New API: use data + schema
			this.config = undefined;
			this.data = data;
			this.schema = schema ?? (defaultSchema as unknown as SidebarSchema<T>);
			this.settings = {
				...DEFAULT_SETTINGS,
				...settings,
				responsive: { ...DEFAULT_RESPONSIVE_SETTINGS, ...settings?.responsive }
			};
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

		const { mobileBreakpoint, tabletBreakpoint } = this.settings.responsive;

		// Media query for mobile: max-width < mobileBreakpoint
		this.#mobileMediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
		// Media query for tablet: min-width >= mobileBreakpoint AND max-width < tabletBreakpoint
		this.#tabletMediaQuery = window.matchMedia(
			`(min-width: ${mobileBreakpoint}px) and (max-width: ${tabletBreakpoint - 1}px)`
		);

		// Handler for mobile media query
		this.#mobileQueryHandler = (e: MediaQueryListEvent) => {
			if (e.matches) {
				this.setResponsiveMode('mobile');
			} else {
				// Check if tablet matches
				if (this.#tabletMediaQuery?.matches) {
					this.setResponsiveMode('tablet');
				} else {
					this.setResponsiveMode('desktop');
				}
			}
		};

		// Handler for tablet media query
		this.#tabletQueryHandler = (e: MediaQueryListEvent) => {
			if (e.matches) {
				this.setResponsiveMode('tablet');
			} else if (!this.#mobileMediaQuery?.matches) {
				this.setResponsiveMode('desktop');
			}
		};

		// Set initial mode based on current viewport
		if (this.#mobileMediaQuery.matches) {
			this.setResponsiveMode('mobile');
		} else if (this.#tabletMediaQuery.matches) {
			this.setResponsiveMode('tablet');
		} else {
			this.setResponsiveMode('desktop');
		}

		// Add listeners
		this.#mobileMediaQuery.addEventListener('change', this.#mobileQueryHandler);
		this.#tabletMediaQuery.addEventListener('change', this.#tabletQueryHandler);

		// Set up escape key handler
		if (this.settings.responsive.closeOnEscape) {
			document.addEventListener('keydown', this.#boundEscapeHandler);
		}
	}

	/**
	 * Clean up responsive media query listeners
	 */
	private cleanupResponsiveMediaQueries(): void {
		if (typeof window === 'undefined') return;

		if (this.#mobileMediaQuery && this.#mobileQueryHandler) {
			this.#mobileMediaQuery.removeEventListener('change', this.#mobileQueryHandler);
		}
		if (this.#tabletMediaQuery && this.#tabletQueryHandler) {
			this.#tabletMediaQuery.removeEventListener('change', this.#tabletQueryHandler);
		}
		if (this.settings.responsive.closeOnEscape) {
			document.removeEventListener('keydown', this.#boundEscapeHandler);
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

		const previousMode = this.responsiveMode;
		this.responsiveMode = mode;
		this.events.onModeChange?.(mode);

		// Close drawer when switching away from mobile mode
		if (previousMode === 'mobile' && mode !== 'mobile' && this.drawerOpen) {
			this.closeDrawer();
		}

		// Auto-collapse in tablet mode
		if (mode === 'tablet' && !this.collapsed) {
			this.setCollapsed(true);
		}
	}

	/**
	 * Open the mobile drawer
	 */
	openDrawer(): void {
		if (this.drawerOpen) {
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
		if (typeof document === 'undefined') return;
		document.body.classList.add('sidebar-scroll-locked');
	}

	/**
	 * Unlock body scroll
	 */
	private unlockBodyScroll(): void {
		if (typeof document === 'undefined') return;
		document.body.classList.remove('sidebar-scroll-locked');
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
		const isPreview = hasCustomDropIndicator ? false : this.isPreviewItem(id);

		const dnd: SidebarDnDState = {
			enabled: this.dndEnabled,
			isDragging: this.draggedItem?.id === id,
			isKeyboardDragging,
			isPointerDragging,
			isDropTarget,
			dropPosition: isDropTarget ? this.dropPosition : null,
			draggedLabel: this.draggedItem ? this.getLabel(this.draggedItem.item) : null,
			isPreview,
			handleProps: {
				draggable: this.dndEnabled && !isKeyboardDragging,
				tabIndex: this.dndEnabled ? 0 : -1,
				role: 'button',
				'aria-roledescription': 'Draggable item',
				'aria-describedby': 'sidebar-dnd-instructions',
				'aria-pressed': isKeyboardDragging ? true : undefined,
				'aria-grabbed': this.draggedItem?.id === id || isKeyboardDragging ? true : undefined,
				style: this.dndEnabled ? 'touch-action: none;' : undefined,
				onmousedown: () => {
					// Pre-set draggedItem on mousedown so the preview can render before dragstart
					// Use flushSync to force synchronous DOM update before dragstart fires
					if (this.dndEnabled && !this.draggedItem) {
						flushSync(() => {
							this.draggedItem = { id, item, parentId, index };
						});
					}
				},
				ondragstart: (e: DragEvent) => {
					e.dataTransfer?.setData('text/plain', id);
					// draggedItem is already set from mousedown, just ensure it's correct
					if (!this.draggedItem || this.draggedItem.id !== id) {
						this.startDrag(item, parentId, index);
					}
					// Use custom drag preview if available
					// Query DOM directly since $effect may not have synced yet
					const preview =
						this.#dragPreviewElement ??
						(this.#scrollContainer?.closest('.sidebar')?.parentElement?.querySelector(
							'.sidebar-drag-preview'
						) as HTMLElement | null);
					if (preview && e.dataTransfer) {
						// Use the center of the preview as the drag point
						const rect = preview.getBoundingClientRect();
						e.dataTransfer.setDragImage(preview, rect.width / 2, rect.height / 2);
					}
				},
				ondragend: () => {
					// Defer cleanup to allow ondrop to fire first
					// If draggedItem is still set, the drop was cancelled - animate back
					setTimeout(() => {
						const wasCancelled = this.draggedItem !== null;
						this.endDrag(wasCancelled);
					}, 0);
				},
				onkeydown: (e: KeyboardEvent) => {
					this.handleKeyDown(e, item, parentId, index, depth);
				},
				onpointerdown: (e: PointerEvent) => {
					this.handlePointerDown(e, item, parentId, index);
				}
			},
			dropZoneProps: {
				'data-sidebar-item-id': id,
				'data-sidebar-item-kind': kind,
				ondragover: (e: DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
					this.setDropTarget(item, parentId, e);
				},
				ondragleave: (e: DragEvent) => {
					// Only clear if we're actually leaving this element (not entering a child)
					const relatedTarget = e.relatedTarget as Node | null;
					const currentTarget = e.currentTarget as Node | null;
					if (relatedTarget && currentTarget?.contains(relatedTarget)) {
						// Moving to a child element, don't clear
						return;
					}
					if (this.dropTargetId === id) {
						this.setDropTarget(null);
						this.cancelHoverExpandTimer();
					}
				},
				ondrop: (e: DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
					this.handleDrop(item, parentId, index, depth);
				}
			},
			keyboard: {
				isActive: isKeyboardDragging,
				announcement: isKeyboardDragging ? this.announcement : ''
			}
		};

		return {
			id,
			label: this.getLabel(item),
			href,
			icon: this.getIcon(item),
			badge: this.getBadge(item),
			depth,
			isActive: href ? this.activeHref === href : false,
			isCollapsed: this.collapsed,
			isExpanded: kind === 'group' ? this.isGroupExpanded(id) : undefined,
			isDisabled: this.getDisabled(item),
			isExternal: this.getExternal(item),
			meta: this.schema.getMeta?.(item) ?? {},
			original: item,
			toggleExpanded: kind === 'group' ? () => this.toggleGroup(id) : undefined,
			dnd
		};
	}

	// ========================================================================
	// Public Methods
	// ========================================================================

	/**
	 * Toggle sidebar collapsed state
	 */
	toggleCollapsed(): void {
		this.collapsed = !this.collapsed;
		this.events.onCollapsedChange?.(this.collapsed);
	}

	/**
	 * Set sidebar collapsed state
	 */
	setCollapsed(value: boolean): void {
		this.collapsed = value;
		this.events.onCollapsedChange?.(this.collapsed);
	}

	/**
	 * Toggle a group's expanded state
	 */
	toggleGroup(groupId: string): void {
		const currentState = this.#expandedGroupsMap[groupId] ?? false;
		this.#expandedGroupsMap[groupId] = !currentState;
		this.events.onGroupToggle?.(groupId, !currentState);
	}

	/**
	 * Set a group's expanded state
	 */
	setGroupExpanded(groupId: string, expanded: boolean): void {
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
	calculateDropPosition(e: DragEvent | PointerEvent, targetKind: ItemKind): DropPosition {
		const target = e.currentTarget as HTMLElement;
		if (!target) return 'inside';

		const rect = target.getBoundingClientRect();
		const mouseY = e.clientY;
		const relativeY = mouseY - rect.top;
		const height = rect.height;

		// For groups/sections, divide into thirds: before (top 25%), inside (middle 50%), after (bottom 25%)
		// For pages, divide into halves: before (top 50%), after (bottom 50%)
		if (targetKind === 'group' || targetKind === 'section') {
			if (relativeY < height * 0.25) {
				return 'before';
			} else if (relativeY > height * 0.75) {
				return 'after';
			} else {
				return 'inside';
			}
		} else {
			// Pages can't have children, so only before/after
			return relativeY < height * 0.5 ? 'before' : 'after';
		}
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

		// Calculate drop position from event
		const position = event ? this.calculateDropPosition(event, targetKind) : 'inside';

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

		// Calculate drop position from clientY and rect
		const position = this.calculateDropPositionFromRect(clientY, rect, targetKind);

		this.setDropTargetInternal(targetItem, targetParentId, targetId, targetKind, position);
	}

	/**
	 * Calculate drop position from clientY and bounding rect
	 */
	private calculateDropPositionFromRect(
		clientY: number,
		rect: DOMRect,
		targetKind: ItemKind
	): DropPosition {
		const relativeY = clientY - rect.top;
		const height = rect.height;

		if (targetKind === 'group' || targetKind === 'section') {
			if (relativeY < height * 0.25) {
				return 'before';
			} else if (relativeY > height * 0.75) {
				return 'after';
			} else {
				return 'inside';
			}
		} else {
			return relativeY < height * 0.5 ? 'before' : 'after';
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

			// Compute the effective parent based on target kind, dragged kind, and position
			let effectiveParentId: string | null;
			if (draggedKind === 'section' && targetKind === 'section') {
				// Section-to-section: sibling reorder at root level
				effectiveParentId = null;
			} else if (position === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
				// Dropping inside a group/section: item becomes a child
				effectiveParentId = targetId;
			} else if (position === 'before' || position === 'after') {
				// Dropping before/after: item becomes a sibling
				effectiveParentId = targetParentId;
			} else {
				effectiveParentId = targetParentId;
			}

			// Sections can only be dropped at root level
			if (draggedKind === 'section' && effectiveParentId !== null) {
				return; // Don't highlight invalid target
			}

			// Non-sections cannot be dropped at root level
			if (draggedKind !== 'section' && effectiveParentId === null) {
				return; // Don't highlight invalid target
			}

			// Prevent highlighting if dropping on self or descendant
			if (this.isDropDescendantOf(targetId, this.draggedItem.id)) {
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

			// Update live preview
			this.updatePreviewInsert();
		}
	}

	/**
	 * Handle drop on a target item
	 */
	handleDrop(
		_targetItem: T,
		_targetParentId: string | null,
		_targetIndex: number,
		_targetDepth: number
	): void {
		if (!this.draggedItem || !this.onReorder) {
			return;
		}

		let toParentId: string | null;
		let toIndex: number;
		const position = this.dropPosition ?? 'inside';

		// Use previewInsert if available (livePreview mode)
		if (this.previewInsert) {
			toParentId = this.previewInsert.parentId;
			toIndex = this.previewInsert.index;
		} else if (this.dropTargetId && this.dropPosition) {
			// Calculate position from dropTarget (non-livePreview mode)
			const calculated = this.calculateInsertPosition(this.dropTargetId, this.dropPosition);
			if (!calculated) {
				this.endDrag();
				return;
			}
			toParentId = calculated.parentId;
			toIndex = calculated.index;
		} else {
			this.endDrag();
			return;
		}

		// Calculate depth based on parent
		const toDepth = this.calculateDepth(toParentId);

		// Capture positions before reorder for FLIP animation (when livePreview is off)
		if (!this.livePreview) {
			this.captureItemPositions();
		}

		this.onReorder({
			item: this.draggedItem.item,
			fromIndex: this.draggedItem.index,
			toIndex,
			fromParentId: this.draggedItem.parentId,
			toParentId,
			depth: toDepth,
			position
		});

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
		if (!this.draggedItem) return null;

		const targetInfo = this.findItemById(targetId);
		if (!targetInfo) return null;

		const { item: targetItem, parentId: targetParentId, index: targetIndex } = targetInfo;
		const targetKind = this.getKind(targetItem);
		const draggedKind = this.getKind(this.draggedItem.item);

		let toParentId: string | null;
		let toIndex: number;

		if (position === 'inside' && targetKind === 'group') {
			// Dropping inside a group
			toParentId = targetId;
			toIndex = 0;
		} else if (position === 'inside' && targetKind === 'section') {
			// Dropping inside a section
			toParentId = targetId;
			toIndex = 0;
		} else if (position === 'before') {
			// Dropping before target
			toParentId = targetParentId;
			toIndex = targetIndex;
		} else {
			// Dropping after target (position === 'after')
			toParentId = targetParentId;
			toIndex = targetIndex + 1;
		}

		// Sections can only be at root level
		if (draggedKind === 'section' && toParentId !== null) {
			return null;
		}

		// Adjust index if moving within same parent and dragged item is before target
		if (
			this.draggedItem.parentId === toParentId &&
			this.draggedItem.index < toIndex
		) {
			toIndex--;
		}

		return { parentId: toParentId, index: toIndex };
	}

	/**
	 * Check if targetId is the same as ancestorId or is a descendant of it.
	 * Prevents dropping an item into itself or its children.
	 */
	private isDropDescendantOf(targetId: string, ancestorId: string): boolean {
		if (targetId === ancestorId) return true;

		const findInChildren = (items: T[]): boolean => {
			for (const item of items) {
				if (this.getId(item) === ancestorId) {
					// Found ancestor, check if target is in its subtree
					return this.containsId(this.getItems(item), targetId);
				}
				const children = this.getItems(item);
				if (children.length && findInChildren(children)) return true;
			}
			return false;
		};

		return findInChildren(this.data);
	}

	/**
	 * Check if items array contains an item with the given id (recursively)
	 */
	private containsId(items: T[], targetId: string): boolean {
		for (const item of items) {
			if (this.getId(item) === targetId) return true;
			const children = this.getItems(item);
			if (children.length && this.containsId(children, targetId)) return true;
		}
		return false;
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
		if (!this.livePreview || !this.draggedItem || !this.previewInsert) {
			return false;
		}
		// The item is a preview if it's the dragged item AND it's at a different position
		if (this.draggedItem.id !== id) {
			return false;
		}
		// Check if position has actually changed
		const positionChanged =
			this.draggedItem.parentId !== this.previewInsert.parentId ||
			this.draggedItem.index !== this.previewInsert.index;
		return positionChanged;
	}

	/**
	 * Get items with live preview reordering applied.
	 * During drag, shows items as they would appear after drop.
	 */
	getItemsWithPreview(items: T[], parentId: string | null): T[] {
		if (!this.draggedItem || !this.previewInsert) {
			return items;
		}

		const { id: draggedId, parentId: fromParentId } = this.draggedItem;
		const { parentId: toParentId, index: toIndex } = this.previewInsert;

		// Filter out the dragged item from source
		const isSourceLevel = fromParentId === parentId;
		const isTargetLevel = toParentId === parentId;

		if (!isSourceLevel && !isTargetLevel) {
			// This level is not affected by the drag
			return items;
		}

		// Start with items, removing the dragged item if it's from this level
		let result = isSourceLevel ? items.filter((item) => this.getId(item) !== draggedId) : [...items];

		// Insert the dragged item at the preview position if this is the target level
		if (isTargetLevel) {
			const insertIndex = Math.min(toIndex, result.length);
			result = [...result.slice(0, insertIndex), this.draggedItem.item, ...result.slice(insertIndex)];
		}

		return result;
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

		const targetInfo = this.findItemById(this.dropTargetId);
		if (!targetInfo) {
			this.previewInsert = null;
			return;
		}

		const { item: targetItem, parentId: targetParentId, index: targetIndex } = targetInfo;
		const targetKind = this.getKind(targetItem);
		const draggedKind = this.getKind(this.draggedItem.item);
		const position = this.dropPosition;

		let toParentId: string | null;
		let toIndex: number;

		if (draggedKind === 'section' && targetKind === 'section') {
			// Section-to-section: sibling reorder at root level
			toParentId = null;
			toIndex = position === 'before' ? targetIndex : targetIndex + 1;
		} else if (position === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
			// Dropping inside a group/section
			toParentId = this.dropTargetId;
			toIndex = 0;
		} else if (position === 'before') {
			toParentId = targetParentId;
			toIndex = targetIndex;
		} else {
			// 'after'
			toParentId = targetParentId;
			toIndex = targetIndex + 1;
		}

		// Validate the move
		if (draggedKind === 'section' && toParentId !== null) {
			this.previewInsert = null;
			return;
		}
		if (draggedKind !== 'section' && toParentId === null) {
			this.previewInsert = null;
			return;
		}

		// Adjust index if moving within same parent and source is before target
		if (this.draggedItem.parentId === toParentId && this.draggedItem.index < toIndex) {
			toIndex = Math.max(0, toIndex - 1);
		}

		// Only update if changed to avoid unnecessary re-renders
		// Also skip updates while animation is in progress to prevent feedback loop
		if (
			!this.#isAnimating &&
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

	// ========================================================================
	// Keyboard DnD Methods
	// ========================================================================

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

		// If keyboard drag is not active
		if (!this.keyboardDragState) {
			// Space or Enter to pick up
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				this.pickUpItem(item, parentId, index, depth);
			}
			return;
		}

		// If this item is being dragged
		if (this.keyboardDragState.id === id) {
			e.preventDefault();

			switch (e.key) {
				case 'ArrowUp':
					this.movePickedUpItem(-1);
					break;
				case 'ArrowDown':
					this.movePickedUpItem(1);
					break;
				case 'ArrowLeft':
					// Move to parent level (if nested)
					this.movePickedUpItemToParent();
					break;
				case 'ArrowRight':
					// Move into previous sibling group (if it's a group)
					this.movePickedUpItemIntoGroup();
					break;
				case 'Enter':
				case ' ':
					this.dropPickedUpItem(depth);
					break;
				case 'Escape':
					this.cancelKeyboardDrag();
					break;
			}
		}
	}

	/**
	 * Pick up an item for keyboard reordering
	 */
	pickUpItem(item: T, parentId: string | null, index: number, _depth: number): void {
		const id = this.getId(item);
		const siblings = this.getSiblingsAtLevel(parentId);

		// Set up draggedItem for preview system
		this.draggedItem = { id, item, parentId, index };

		this.keyboardDragState = {
			item,
			id,
			originalParentId: parentId,
			originalIndex: index,
			currentIndex: index,
			currentParentId: parentId,
			siblings
		};

		// Set initial preview position (same as current)
		this.previewInsert = { parentId, index };

		const label = this.getLabel(item);
		this.announcement = `Picked up ${label}. Use arrow keys to move, Enter to drop, Escape to cancel.`;
	}

	/**
	 * Move the picked up item up or down
	 */
	movePickedUpItem(direction: -1 | 1): void {
		if (!this.keyboardDragState) return;

		const { currentIndex, siblings, currentParentId } = this.keyboardDragState;
		const newIndex = currentIndex + direction;

		// Bounds check
		if (newIndex < 0 || newIndex >= siblings.length) {
			this.announcement = direction === -1 ? 'At the top of the list' : 'At the bottom of the list';
			return;
		}

		// Capture positions before update
		this.captureItemPositions();

		this.keyboardDragState.currentIndex = newIndex;
		this.previewInsert = { parentId: currentParentId, index: newIndex };

		// Animate after DOM updates
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.animateItemPositions();
			});
		});

		const targetItem = siblings[newIndex];
		const targetLabel = this.getLabel(targetItem);
		const position = direction === -1 ? 'before' : 'after';
		this.announcement = `Moved ${position} ${targetLabel}. Position ${newIndex + 1} of ${siblings.length}.`;
	}

	/**
	 * Move picked up item to parent level
	 */
	movePickedUpItemToParent(): void {
		if (!this.keyboardDragState || !this.keyboardDragState.currentParentId) {
			this.announcement = 'Already at the top level';
			return;
		}

		// Find parent and its siblings
		const parentInfo = this.findItemById(this.keyboardDragState.currentParentId);
		if (!parentInfo) return;

		const { parentId: grandparentId, index: parentIndex } = parentInfo;
		const newSiblings = this.getSiblingsAtLevel(grandparentId);
		const newIndex = parentIndex + 1; // After the parent

		// Capture positions before update
		this.captureItemPositions();

		this.keyboardDragState.currentParentId = grandparentId;
		this.keyboardDragState.currentIndex = newIndex;
		this.keyboardDragState.siblings = newSiblings;
		this.previewInsert = { parentId: grandparentId, index: newIndex };

		// Animate after DOM updates
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.animateItemPositions();
			});
		});

		const parentLabel = this.getLabel(parentInfo.item);
		this.announcement = `Moved out of ${parentLabel}. Now at parent level.`;
	}

	/**
	 * Move picked up item into a sibling group
	 */
	movePickedUpItemIntoGroup(): void {
		if (!this.keyboardDragState) return;

		const { currentIndex, siblings } = this.keyboardDragState;

		// Look for the previous sibling that is a group
		if (currentIndex <= 0) {
			this.announcement = 'No group above to move into';
			return;
		}

		const prevSibling = siblings[currentIndex - 1];
		if (this.getKind(prevSibling) !== 'group') {
			this.announcement = 'Previous item is not a group';
			return;
		}

		const groupId = this.getId(prevSibling);
		const groupLabel = this.getLabel(prevSibling);
		const groupChildren = this.getItems(prevSibling);
		const newIndex = groupChildren.length; // At the end

		// Expand the group if collapsed
		if (!this.isGroupExpanded(groupId)) {
			this.setGroupExpanded(groupId, true);
		}

		// Capture positions before update
		this.captureItemPositions();

		this.keyboardDragState.currentParentId = groupId;
		this.keyboardDragState.currentIndex = newIndex;
		this.keyboardDragState.siblings = [...groupChildren];
		this.previewInsert = { parentId: groupId, index: newIndex };

		// Animate after DOM updates
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.animateItemPositions();
			});
		});

		this.announcement = `Moved into ${groupLabel}. Position ${groupChildren.length + 1}.`;
	}

	/**
	 * Drop the picked up item at its current position
	 */
	dropPickedUpItem(depth: number): void {
		if (!this.keyboardDragState || !this.onReorder) return;

		const { item, originalParentId, originalIndex, currentIndex, currentParentId } =
			this.keyboardDragState;

		// Calculate depth based on parent
		let toDepth = depth;
		if (currentParentId !== originalParentId) {
			// Count depth by traversing to root
			toDepth = this.calculateDepth(currentParentId);
		}

		const label = this.getLabel(item);

		// Items are already in preview position, so no FLIP animation needed
		this.onReorder({
			item,
			fromIndex: originalIndex,
			toIndex: currentIndex,
			fromParentId: originalParentId,
			toParentId: currentParentId,
			depth: toDepth,
			position: 'before' // Keyboard always uses explicit positioning
		});

		this.announcement = `Dropped ${label}. Reorder complete.`;

		// Clean up all drag state
		this.keyboardDragState = null;
		this.draggedItem = null;
		this.previewInsert = null;
	}

	/**
	 * Cancel keyboard drag and restore original position
	 */
	cancelKeyboardDrag(): void {
		if (!this.keyboardDragState) return;

		const label = this.getLabel(this.keyboardDragState.item);

		// Capture positions before clearing preview (items will snap back)
		this.captureItemPositions();

		this.announcement = `Cancelled. ${label} returned to original position.`;

		// Clean up all drag state
		this.keyboardDragState = null;
		this.draggedItem = null;
		this.previewInsert = null;

		// Animate items back to original positions
		requestAnimationFrame(() => this.animateItemPositions());
	}

	/**
	 * Get siblings at a given parent level
	 */
	private getSiblingsAtLevel(parentId: string | null): T[] {
		if (parentId === null) {
			// Root level - return all sections
			return this.data;
		}

		// Find parent and return its children
		const findParent = (items: T[]): T[] | null => {
			for (const item of items) {
				if (this.getId(item) === parentId) {
					return this.getItems(item);
				}
				const children = this.getItems(item);
				if (children.length) {
					const found = findParent(children);
					if (found) return found;
				}
			}
			return null;
		};

		return findParent(this.data) ?? [];
	}

	/**
	 * Find an item by ID and return its parent info
	 */
	private findItemById(
		targetId: string
	): { item: T; parentId: string | null; index: number } | null {
		const search = (
			items: T[],
			parentId: string | null
		): { item: T; parentId: string | null; index: number } | null => {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (this.getId(item) === targetId) {
					return { item, parentId, index: i };
				}
				const children = this.getItems(item);
				if (children.length) {
					const found = search(children, this.getId(item));
					if (found) return found;
				}
			}
			return null;
		};

		return search(this.data, null);
	}

	/**
	 * Calculate depth by counting parents
	 */
	private calculateDepth(parentId: string | null): number {
		if (parentId === null) return 0;

		let depth = 1;
		let currentId = parentId;

		while (currentId) {
			const info = this.findItemById(currentId);
			if (!info || !info.parentId) break;
			currentId = info.parentId;
			depth++;
		}

		return depth;
	}

	// ========================================================================
	// Pointer/Touch DnD Methods
	// ========================================================================

	/**
	 * Handle pointer down on drag handle
	 */
	handlePointerDown(e: PointerEvent, item: T, parentId: string | null, index: number): void {
		if (!this.dndEnabled) return;

		// Only handle primary button (left click / touch)
		if (e.button !== 0) return;

		// Don't interfere with native drag on desktop
		if (e.pointerType === 'mouse') return;

		e.preventDefault();

		const id = this.getId(item);

		this.pointerDragState = {
			item,
			id,
			parentId,
			index,
			startX: e.clientX,
			startY: e.clientY,
			currentX: e.clientX,
			currentY: e.clientY,
			isDragging: false,
			longPressTimer: setTimeout(() => {
				this.startPointerDrag();
			}, this.longPressDelay)
		};

		// Add global listeners with passive: false to allow preventDefault
		document.addEventListener('pointermove', this.#boundPointerMove, { passive: false });
		document.addEventListener('pointerup', this.#boundPointerUp);
		document.addEventListener('pointercancel', this.#boundPointerUp);
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
		if (!this.pointerDragState) return;

		this.pointerDragState.isDragging = true;
		this.pointerDragState.longPressTimer = null;

		// Start native drag state too
		this.startDrag(
			this.pointerDragState.item,
			this.pointerDragState.parentId,
			this.pointerDragState.index
		);

		// Cache all drop zone rects for hit testing (more reliable than elementFromPoint on mobile)
		this.cacheDropZoneRects();

		// Haptic feedback
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(50);
		}

		this.announcement = `Dragging ${this.getLabel(this.pointerDragState.item)}. Move finger to reposition.`;
	}

	/**
	 * Cache bounding rects of all drop zones for hit testing during touch drag
	 */
	private cacheDropZoneRects(): void {
		this.#dropZoneRects = [];
		// Scope to this sidebar's scroll container to avoid affecting other sidebars
		const container = this.#scrollContainer ?? document;
		const dropZones = container.querySelectorAll('[data-sidebar-item-id]');
		dropZones.forEach((element) => {
			const id = element.getAttribute('data-sidebar-item-id');
			if (id && id !== this.pointerDragState?.id) {
				this.#dropZoneRects.push({
					id,
					rect: element.getBoundingClientRect(),
					element: element as HTMLElement
				});
			}
		});
	}

	/**
	 * Find drop zone at given coordinates using cached rects
	 */
	private findDropZoneAtPoint(x: number, y: number): { id: string; element: HTMLElement } | null {
		// Find the smallest (most specific) drop zone containing the point
		let bestMatch: { id: string; element: HTMLElement; area: number } | null = null;

		for (const { id, rect, element } of this.#dropZoneRects) {
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				const area = rect.width * rect.height;
				if (!bestMatch || area < bestMatch.area) {
					bestMatch = { id, element, area };
				}
			}
		}

		return bestMatch ? { id: bestMatch.id, element: bestMatch.element } : null;
	}

	/**
	 * Handle pointer move during drag
	 */
	handlePointerMove(e: PointerEvent): void {
		if (!this.pointerDragState) return;

		this.pointerDragState.currentX = e.clientX;
		this.pointerDragState.currentY = e.clientY;

		// If not yet dragging, check if moved too far (cancel long press)
		if (!this.pointerDragState.isDragging) {
			const dx = e.clientX - this.pointerDragState.startX;
			const dy = e.clientY - this.pointerDragState.startY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 10) {
				// Moved too much, cancel long press
				if (this.pointerDragState.longPressTimer) {
					clearTimeout(this.pointerDragState.longPressTimer);
					this.pointerDragState.longPressTimer = null;
				}
				this.cleanupPointerDrag();
				return;
			}
		}

		if (this.pointerDragState.isDragging) {
			// Prevent scrolling while dragging
			e.preventDefault();

			// Refresh cached rects periodically (items move during live preview)
			const now = Date.now();
			if (now - this.#lastRectCacheTime > this.rectCacheInterval) {
				this.cacheDropZoneRects();
				this.#lastRectCacheTime = now;
			}

			// Find drop zone using cached rects (more reliable than elementFromPoint on mobile)
			const dropZone = this.findDropZoneAtPoint(e.clientX, e.clientY);

			if (dropZone) {
				const targetItem = this.findItemById(dropZone.id);
				if (targetItem) {
					this.setDropTargetWithRect(
						targetItem.item,
						targetItem.parentId,
						e.clientY,
						dropZone.element.getBoundingClientRect()
					);
				}
			} else {
				this.setDropTarget(null);
			}

			// Handle auto-scroll
			this.handleDragAutoScroll(e.clientY);
		}
	}

	/**
	 * Handle pointer up (drop or cancel)
	 */
	handlePointerUp(_e: PointerEvent): void {
		if (!this.pointerDragState) return;

		// Cancel long press timer
		if (this.pointerDragState.longPressTimer) {
			clearTimeout(this.pointerDragState.longPressTimer);
		}

		if (this.pointerDragState.isDragging && this.dropTargetId) {
			// Find drop target and trigger drop
			const targetInfo = this.findItemById(this.dropTargetId);
			if (targetInfo) {
				const depth = this.calculateDepth(targetInfo.parentId);
				this.handleDrop(targetInfo.item, targetInfo.parentId, targetInfo.index, depth);
			}
		}

		this.cleanupPointerDrag();
	}

	/**
	 * Clean up pointer drag state
	 */
	private cleanupPointerDrag(): void {
		document.removeEventListener('pointermove', this.#boundPointerMove);
		document.removeEventListener('pointerup', this.#boundPointerUp);
		document.removeEventListener('pointercancel', this.#boundPointerUp);

		// Clear cached drop zone rects
		this.#dropZoneRects = [];

		// Clear drag state if still active (handleDrop may have already cleared it)
		if (this.pointerDragState?.isDragging && this.draggedItem) {
			this.endDrag(true); // Animate back if cancelled
		}
		this.pointerDragState = null;
		this.stopAutoScroll();
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
		if (!this.#scrollContainer) return;

		const rect = this.#scrollContainer.getBoundingClientRect();
		const topDistance = clientY - rect.top;
		const bottomDistance = rect.bottom - clientY;

		let scrollSpeed = 0;

		if (topDistance < this.autoScrollThreshold) {
			// Near top edge, scroll up
			const intensity = 1 - topDistance / this.autoScrollThreshold;
			scrollSpeed = -this.autoScrollMaxSpeed * intensity;
		} else if (bottomDistance < this.autoScrollThreshold) {
			// Near bottom edge, scroll down
			const intensity = 1 - bottomDistance / this.autoScrollThreshold;
			scrollSpeed = this.autoScrollMaxSpeed * intensity;
		}

		if (scrollSpeed !== 0) {
			this.startAutoScroll(scrollSpeed);
		} else {
			this.stopAutoScroll();
		}
	}

	/**
	 * Start auto-scroll animation
	 */
	private startAutoScroll(speed: number): void {
		if (this.#autoScrollAnimationId !== null) {
			cancelAnimationFrame(this.#autoScrollAnimationId);
		}

		const scroll = () => {
			if (!this.#scrollContainer) return;

			this.#scrollContainer.scrollTop += speed;
			this.#autoScrollAnimationId = requestAnimationFrame(scroll);
		};

		this.#autoScrollAnimationId = requestAnimationFrame(scroll);
	}

	/**
	 * Stop auto-scroll animation
	 */
	stopAutoScroll(): void {
		if (this.#autoScrollAnimationId !== null) {
			cancelAnimationFrame(this.#autoScrollAnimationId);
			this.#autoScrollAnimationId = null;
		}
	}

	// ========================================================================
	// Hover-expand Methods
	// ========================================================================

	/**
	 * Start timer to expand a collapsed group on hover during drag
	 */
	startHoverExpandTimer(groupId: string): void {
		// Don't restart timer for same target
		if (this.#hoverExpandTargetId === groupId) return;

		this.cancelHoverExpandTimer();
		this.#hoverExpandTargetId = groupId;

		this.#hoverExpandTimerId = setTimeout(() => {
			if (this.#hoverExpandTargetId === groupId) {
				this.setGroupExpanded(groupId, true);
				this.announcement = `Expanded group`;
			}
			this.#hoverExpandTimerId = null;
			this.#hoverExpandTargetId = null;
		}, this.hoverExpandDelay);
	}

	/**
	 * Cancel hover-expand timer
	 */
	cancelHoverExpandTimer(): void {
		if (this.#hoverExpandTimerId !== null) {
			clearTimeout(this.#hoverExpandTimerId);
			this.#hoverExpandTimerId = null;
		}
		this.#hoverExpandTargetId = null;
	}

	// ========================================================================
	// FLIP Animation Methods
	// ========================================================================

	/**
	 * Capture current positions of all items for FLIP animation
	 */
	captureItemPositions(): void {
		this.#itemPositions.clear();

		// Scope to this sidebar's scroll container to avoid affecting other sidebars
		const container = this.#scrollContainer ?? document;
		const items = container.querySelectorAll('[data-sidebar-item-id]');
		items.forEach((element) => {
			const id = element.getAttribute('data-sidebar-item-id');
			if (id) {
				this.#itemPositions.set(id, element.getBoundingClientRect());
			}
		});
	}

	/**
	 * Animate items from old positions to new positions (FLIP)
	 */
	animateItemPositions(): void {
		if (!this.animated || this.#isAnimating || this.#itemPositions.size === 0) return;
		this.#isAnimating = true;

		// Scope to this sidebar's scroll container to avoid affecting other sidebars
		const container = this.#scrollContainer ?? document;
		const items = container.querySelectorAll('[data-sidebar-item-id]');

		items.forEach((element) => {
			const id = element.getAttribute('data-sidebar-item-id');
			if (!id) return;

			const oldRect = this.#itemPositions.get(id);
			if (!oldRect) return;

			const newRect = element.getBoundingClientRect();

			// Calculate the delta
			const deltaX = oldRect.left - newRect.left;
			const deltaY = oldRect.top - newRect.top;

			if (deltaX === 0 && deltaY === 0) return;

			// Apply inverse transform (First -> Last inverted)
			const el = element as HTMLElement;
			el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
			el.style.transition = 'none';

			// Force reflow
			void el.offsetHeight;

			// Animate to final position (Play)
			el.style.transition = `transform ${this.settings.animationDuration}ms ease-out`;
			el.style.transform = '';

			// Clean up after animation
			const cleanup = () => {
				el.style.transition = '';
				el.style.transform = '';
				el.removeEventListener('transitionend', cleanup);
			};
			el.addEventListener('transitionend', cleanup);
		});

		// Clear state after animation
		setTimeout(() => {
			this.#itemPositions.clear();
			this.#isAnimating = false;
		}, this.settings.animationDuration);
	}

	// ========================================================================
	// Private Methods
	// ========================================================================

	private getInitialExpandedGroups(): Record<string, boolean> {
		const expanded: Record<string, boolean> = {};

		const processItems = (items: T[]): void => {
			for (const item of items) {
				const kind = this.getKind(item);
				if (kind === 'group') {
					const id = this.getId(item);
					if (this.schema.getDefaultExpanded?.(item)) {
						expanded[id] = true;
					}
					const children = this.getItems(item);
					if (children.length > 0) {
						processItems(children);
					}
				}
			}
		};

		for (const section of this.data) {
			const kind = this.getKind(section);
			if (kind === 'section') {
				const items = this.getItems(section);
				processItems(items);
			}
		}

		return expanded;
	}

	private loadPersistedState(): void {
		if (typeof window === 'undefined') return;

		try {
			// Load collapsed state
			if (this.settings.persistCollapsed) {
				const storedCollapsed = localStorage.getItem(`${this.settings.storageKey}-collapsed`);
				if (storedCollapsed !== null) {
					this.collapsed = storedCollapsed === 'true';
				}
			}

			// Load expanded groups
			if (this.settings.persistExpandedGroups) {
				const storedGroups = localStorage.getItem(`${this.settings.storageKey}-expanded`);
				if (storedGroups !== null) {
					const groupIds = JSON.parse(storedGroups) as string[];
					// Merge with initial state
					for (const id of groupIds) {
						this.#expandedGroupsMap[id] = true;
					}
				}
			}
		} catch {
			// Ignore localStorage errors
		}
	}

	private persistState(collapsed: boolean, expandedMap: Record<string, boolean>): void {
		if (typeof window === 'undefined') return;

		try {
			// Persist collapsed state
			if (this.settings.persistCollapsed) {
				localStorage.setItem(`${this.settings.storageKey}-collapsed`, String(collapsed));
			}

			// Persist expanded groups
			if (this.settings.persistExpandedGroups) {
				const groupIds = Object.entries(expandedMap)
					.filter(([, expanded]) => expanded)
					.map(([id]) => id);
				localStorage.setItem(`${this.settings.storageKey}-expanded`, JSON.stringify(groupIds));
			}
		} catch {
			// Ignore localStorage errors
		}
	}

	private findPathToItem(targetId: string): string[] {
		const findPath = (items: T[], path: string[]): string[] | null => {
			for (const item of items) {
				const id = this.getId(item);
				if (id === targetId) {
					return path;
				}

				const kind = this.getKind(item);
				if (kind === 'group') {
					const children = this.getItems(item);
					const result = findPath(children, [...path, id]);
					if (result) return result;
				}
			}
			return null;
		};

		for (const section of this.data) {
			const items = this.getItems(section);
			const result = findPath(items, []);
			if (result) return result;
		}

		return [];
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
