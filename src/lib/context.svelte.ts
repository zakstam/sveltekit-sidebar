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
	ItemKind
} from './types.js';
import { defaultSchema } from './types.js';

const SIDEBAR_CONTEXT_KEY = Symbol('sidebar-context');

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: Required<SidebarSettings> = {
	widthExpanded: '280px',
	widthCollapsed: '64px',
	animationDuration: 200,
	persistCollapsed: true,
	persistExpandedGroups: true,
	storageKey: 'sveltekit-sidebar',
	defaultCollapsed: false
};

// ============================================================================
// Snippet Types
// ============================================================================

export interface SidebarSnippets<T = unknown> {
	page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
	group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
	section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
}

// ============================================================================
// Sidebar Context Class
// ============================================================================

export class SidebarContext<T = unknown> {
	// Configuration (initialized first)
	readonly schema: SidebarSchema<T>;
	data = $state<T[]>([]); // Raw sections data - reactive for DnD reordering
	readonly settings: Required<SidebarSettings>;
	readonly events: SidebarEvents;

	// For backward compatibility - stores config when using legacy API
	readonly config: SidebarConfig | undefined;

	// Render snippets (set by Sidebar component) - reactive for updates
	snippets = $state<SidebarSnippets<T>>({});

	// Reactive state using Svelte 5 runes
	collapsed = $state(false);

	// Fine-grained reactivity: each group has its own reactive state
	// This prevents all groups from re-rendering when one changes
	#expandedGroupsMap = $state<Record<string, boolean>>({});

	// Current active pathname - set once from root Sidebar
	activeHref = $state<string>('');

	// DnD state
	dndEnabled = $state(false);
	draggedItem = $state<{ id: string; item: T; parentId: string | null; index: number } | null>(
		null
	);
	dropTargetId = $state<string | null>(null);
	onReorder?: (event: SidebarReorderEvent<T>) => void;

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
			this.settings = { ...DEFAULT_SETTINGS, ...config.settings };
		} else if (data) {
			// New API: use data + schema
			this.config = undefined;
			this.data = data;
			this.schema = schema ?? (defaultSchema as unknown as SidebarSchema<T>);
			this.settings = { ...DEFAULT_SETTINGS, ...settings };
		} else {
			throw new Error('Sidebar requires either "config" or "data" prop');
		}

		this.events = events;

		// Initialize state
		this.collapsed = this.settings.defaultCollapsed;
		this.#expandedGroupsMap = this.getInitialExpandedGroups();

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
		const dnd: SidebarDnDState = {
			enabled: this.dndEnabled,
			isDragging: this.draggedItem?.id === id,
			isDropTarget: this.dropTargetId === id,
			handleProps: {
				draggable: this.dndEnabled,
				ondragstart: (e: DragEvent) => {
					e.dataTransfer?.setData('text/plain', id);
					this.startDrag(item, parentId, index);
				},
				ondragend: () => {
					// Defer cleanup to allow ondrop to fire first
					setTimeout(() => this.endDrag(), 0);
				}
			},
			dropZoneProps: {
				ondragover: (e: DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
					this.setDropTarget(item, parentId);
				},
				ondragleave: (e: DragEvent) => {
					// Only clear if we're actually leaving this element (not entering a child)
					const relatedTarget = e.relatedTarget as Node | null;
					const currentTarget = e.currentTarget as Node | null;
					if (relatedTarget && currentTarget?.contains(relatedTarget)) {
						// Moving to a child element, don't clear
						return;
					}
					if (this.dropTargetId === id) this.setDropTarget(null);
				},
				ondrop: (e: DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
					this.handleDrop(item, parentId, index, depth);
				}
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
	 */
	endDrag(): void {
		this.draggedItem = null;
		this.dropTargetId = null;
	}

	/**
	 * Set the current drop target (with validation)
	 */
	setDropTarget(targetItem: T | null, targetParentId?: string | null): void {
		if (targetItem === null) {
			this.dropTargetId = null;
			return;
		}

		const targetId = this.getId(targetItem);
		const targetKind = this.getKind(targetItem);

		// Validate drop target if we have drag info
		if (this.draggedItem && targetParentId !== undefined) {
			const draggedKind = this.getKind(this.draggedItem.item);

			// Compute the effective parent based on target kind and dragged kind
			// Special case: sections dropping on sections = sibling reorder (root level)
			// Groups/sections: non-section items become children, so effective parent is the target
			// Pages: item becomes a sibling, so effective parent is the target's parent
			let effectiveParentId: string | null;
			if (draggedKind === 'section' && targetKind === 'section') {
				// Section-to-section: sibling reorder at root level
				effectiveParentId = null;
			} else if (targetKind === 'group' || targetKind === 'section') {
				effectiveParentId = targetId;
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

		if (this.dropTargetId !== targetId) {
			this.dropTargetId = targetId;
		}
	}

	/**
	 * Handle drop on a target item
	 */
	handleDrop(
		targetItem: T,
		targetParentId: string | null,
		targetIndex: number,
		targetDepth: number
	): void {
		if (!this.draggedItem || !this.onReorder) {
			return;
		}

		const targetId = this.getId(targetItem);
		const targetKind = this.getKind(targetItem);

		// Prevent dropping on self or descendants
		if (this.isDropDescendantOf(targetId, this.draggedItem.id)) {
			return;
		}

		const draggedKind = this.getKind(this.draggedItem.item);

		// Determine the actual drop location based on target kind and dragged kind
		let toParentId: string | null;
		let toIndex: number;
		let toDepth: number;

		if (draggedKind === 'section' && targetKind === 'section') {
			// Section-to-section: sibling reorder at root level
			toParentId = null;
			toIndex = targetIndex;
			toDepth = targetDepth;
		} else if (targetKind === 'group') {
			// Dropping ON a group: item becomes a child of that group
			toParentId = targetId;
			toIndex = 0; // Insert at the beginning of the group
			toDepth = targetDepth + 1;
		} else if (targetKind === 'section') {
			// Dropping ON a section: item becomes a child of that section
			toParentId = targetId;
			toIndex = 0;
			toDepth = targetDepth + 1;
		} else {
			// Dropping ON a page: item becomes a sibling (placed after the page)
			toParentId = targetParentId;
			toIndex = targetIndex;
			toDepth = targetDepth;
		}

		// Sections can only be dropped at root level (next to other sections)
		if (draggedKind === 'section' && toParentId !== null) {
			return;
		}

		// Non-sections cannot be dropped at root level (must stay within sections)
		if (draggedKind !== 'section' && toParentId === null) {
			return;
		}

		this.onReorder({
			item: this.draggedItem.item,
			fromIndex: this.draggedItem.index,
			toIndex,
			fromParentId: this.draggedItem.parentId,
			toParentId,
			depth: toDepth
		});

		this.endDrag();
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
