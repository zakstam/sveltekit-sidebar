import type { Component, Snippet } from 'svelte';

// ============================================================================
// Icon Types
// ============================================================================

/**
 * Flexible icon type supporting:
 * - Svelte Components (e.g., Lucide icons)
 * - String (for icon names/URLs)
 * - Snippets (for custom rendering)
 */
export type SidebarIcon = Component<{ class?: string }> | string | Snippet<[{ class?: string }]>;

// ============================================================================
// Core Item Types (Discriminated Unions)
// ============================================================================

/**
 * Navigation link item
 */
export interface SidebarPage {
	kind: 'page';
	id: string;
	label: string;
	href: string;
	icon?: SidebarIcon;
	badge?: string | number;
	disabled?: boolean;
	external?: boolean;
}

/**
 * Collapsible group containing nested items
 * The `items` array enables infinite nesting
 * Optionally has its own href - clicking navigates AND expands
 */
export interface SidebarGroup {
	kind: 'group';
	id: string;
	label: string;
	icon?: SidebarIcon;
	items: SidebarItem[];
	defaultExpanded?: boolean;
	collapsible?: boolean;
	badge?: string | number;
	/** Optional href - group becomes a navigable link that also expands */
	href?: string;
	external?: boolean;
}

/**
 * Union type for items that can appear in sections or groups
 * This recursive definition enables infinite nesting
 */
export type SidebarItem = SidebarPage | SidebarGroup;

/**
 * Top-level section containing items
 */
export interface SidebarSection {
	kind: 'section';
	id: string;
	title?: string;
	items: SidebarItem[];
	collapsible?: boolean;
	defaultExpanded?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Responsive mode for the sidebar
 */
export type SidebarResponsiveMode = 'mobile' | 'tablet' | 'desktop';

/**
 * Responsive settings for the sidebar
 */
export interface SidebarResponsiveSettings {
	/** Enable responsive behavior (default: true) */
	enabled?: boolean;
	/** Breakpoint for mobile mode in px (default: 768) */
	mobileBreakpoint?: number;
	/** Breakpoint for tablet mode in px (default: 1024) */
	tabletBreakpoint?: number;
	/** Default mode for SSR to prevent hydration mismatch (default: 'desktop') */
	defaultMode?: SidebarResponsiveMode;
	/** Close drawer when navigating (default: true) */
	closeOnNavigation?: boolean;
	/** Close drawer when pressing Escape (default: true) */
	closeOnEscape?: boolean;
	/** Lock body scroll when drawer is open (default: true) */
	lockBodyScroll?: boolean;
}

/**
 * Keyboard shortcuts for drag-and-drop operations
 */
export interface SidebarKeyboardShortcuts {
	/** Keys to pick up or drop an item (default: [' ', 'Enter']) */
	pickUpDrop?: string[];
	/** Key to move item up (default: 'ArrowUp') */
	moveUp?: string;
	/** Key to move item down (default: 'ArrowDown') */
	moveDown?: string;
	/** Key to move item to parent level (default: 'ArrowLeft') */
	moveToParent?: string;
	/** Key to move item into a group (default: 'ArrowRight') */
	moveIntoGroup?: string;
	/** Key to cancel drag operation (default: 'Escape') */
	cancel?: string;
}

/**
 * Drag-and-drop timing and behavior settings
 */
export interface SidebarDnDSettings {
	/** Delay before long-press initiates drag on touch devices in ms (default: 400) */
	longPressDelay?: number;
	/** Delay before hovering over collapsed group expands it during drag in ms (default: 500) */
	hoverExpandDelay?: number;
	/** Distance from edge that triggers auto-scroll in px (default: 50) */
	autoScrollThreshold?: number;
	/** Maximum auto-scroll speed in px per frame (default: 15) */
	autoScrollMaxSpeed?: number;
	/** Interval to refresh drop zone rectangles during drag in ms (default: 100) */
	rectCacheInterval?: number;
	/** Keyboard shortcuts for DnD operations */
	keyboard?: SidebarKeyboardShortcuts;
}

/**
 * ARIA labels for sidebar components (i18n support)
 */
export interface SidebarLabels {
	/** Labels for navigation landmarks */
	navigation?: {
		/** Main sidebar navigation label (default: "Sidebar navigation") */
		main?: string;
		/** Mobile drawer dialog label (default: "Navigation menu") */
		mobileDrawer?: string;
	};
	/** Labels for collapse/expand triggers */
	trigger?: {
		/** Expand sidebar button (default: "Expand sidebar") */
		expand?: string;
		/** Collapse sidebar button (default: "Collapse sidebar") */
		collapse?: string;
		/** Open mobile menu button (default: "Open navigation menu") */
		openMenu?: string;
		/** Close mobile menu button (default: "Close navigation menu") */
		closeMenu?: string;
	};
	/** Labels for group expand/collapse */
	group?: {
		/** Expand group (default: "Expand") */
		expand?: string;
		/** Collapse group (default: "Collapse") */
		collapse?: string;
	};
	/** Labels for link elements */
	link?: {
		/** External link indicator (default: "Opens in new tab") */
		external?: string;
	};
	/** Labels for drag-and-drop */
	dnd?: {
		/** Draggable item role description (default: "Draggable item") */
		draggableItem?: string;
		/** Full DnD instructions for screen readers */
		instructions?: string;
	};
}

/**
 * Screen reader announcement templates for drag-and-drop operations.
 * Use placeholders: {label}, {position}, {target}, {count}
 */
export interface SidebarAnnouncements {
	/** Item picked up (default: "Picked up {label}. Use arrow keys to move, Enter to drop, Escape to cancel.") */
	pickedUp?: string;
	/** Item moved (default: "Moved {position} {target}. Position {index} of {count}.") */
	moved?: string;
	/** Item dropped (default: "Dropped {label}. Reorder complete.") */
	dropped?: string;
	/** Drag cancelled (default: "Cancelled. {label} returned to original position.") */
	cancelled?: string;
	/** At top of list (default: "At the top of the list") */
	atTop?: string;
	/** At bottom of list (default: "At the bottom of the list") */
	atBottom?: string;
	/** Already at top level (default: "Already at the top level") */
	atTopLevel?: string;
	/** No group above to move into (default: "No group above to move into") */
	noGroupAbove?: string;
	/** Previous item is not a group (default: "Previous item is not a group") */
	notAGroup?: string;
	/** Moved out of group (default: "Moved out of {target}. Now at parent level.") */
	movedOutOf?: string;
	/** Moved into group (default: "Moved into {target}. Position {index}.") */
	movedInto?: string;
	/** Touch drag started (default: "Dragging {label}. Move finger to reposition.") */
	touchDragStarted?: string;
	/** Group expanded during drag (default: "Expanded group") */
	groupExpanded?: string;
}

/**
 * Sidebar settings for customization
 */
export interface SidebarSettings {
	/** Width when expanded (default: 280px) */
	widthExpanded?: string;
	/** Width when collapsed (default: 64px) */
	widthCollapsed?: string;
	/** Animation duration in ms (default: 200) */
	animationDuration?: number;
	/** Persist collapsed state to localStorage */
	persistCollapsed?: boolean;
	/** Persist expanded groups to localStorage */
	persistExpandedGroups?: boolean;
	/** localStorage key prefix */
	storageKey?: string;
	/** Start collapsed */
	defaultCollapsed?: boolean;
	/** Responsive settings */
	responsive?: SidebarResponsiveSettings;
	/** Drag-and-drop settings */
	dnd?: SidebarDnDSettings;
	/** ARIA labels for i18n support */
	labels?: SidebarLabels;
	/** Screen reader announcements for DnD operations */
	announcements?: SidebarAnnouncements;
}

/**
 * Root configuration object
 */
export interface SidebarConfig {
	sections: SidebarSection[];
	settings?: SidebarSettings;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Sidebar state managed by context
 */
export interface SidebarState {
	collapsed: boolean;
	expandedGroups: Set<string>;
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

/**
 * Drop position relative to target element
 */
export type DropPosition = 'before' | 'inside' | 'after';

/**
 * Event fired when a drag-and-drop reorder completes
 */
export interface SidebarReorderEvent<T = unknown> {
	/** The item that was moved */
	item: T;
	/** Original index in parent */
	fromIndex: number;
	/** New index in parent */
	toIndex: number;
	/** Original parent ID (null = root section) */
	fromParentId: string | null;
	/** Target parent ID (null = root section) */
	toParentId: string | null;
	/** Target nesting depth */
	depth: number;
	/** Position relative to target ('before', 'inside', 'after') */
	position: DropPosition;
}

/**
 * State for keyboard-based drag and drop
 */
export interface KeyboardDragState<T = unknown> {
	/** The item being moved */
	item: T;
	/** ID of the item being moved */
	id: string;
	/** Original parent ID */
	originalParentId: string | null;
	/** Original index in parent */
	originalIndex: number;
	/** Current virtual position in sibling list */
	currentIndex: number;
	/** Current parent ID (may change during keyboard navigation) */
	currentParentId: string | null;
	/** Siblings at current level for navigation */
	siblings: T[];
}

/**
 * State for pointer/touch-based drag and drop
 */
export interface PointerDragState<T = unknown> {
	/** The item being dragged */
	item: T;
	/** ID of the item being dragged */
	id: string;
	/** Parent ID of the dragged item */
	parentId: string | null;
	/** Index of the dragged item */
	index: number;
	/** Starting X coordinate */
	startX: number;
	/** Starting Y coordinate */
	startY: number;
	/** Current X coordinate */
	currentX: number;
	/** Current Y coordinate */
	currentY: number;
	/** Whether drag threshold has been met (long-press complete) */
	isDragging: boolean;
	/** Timer ID for long-press detection */
	longPressTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * DnD state passed to render context for custom rendering
 */
export interface SidebarDnDState {
	/** DnD is active (draggable prop is true) */
	enabled: boolean;
	/** This item is currently being dragged */
	isDragging: boolean;
	/** Whether this item is picked up via keyboard */
	isKeyboardDragging: boolean;
	/** Whether pointer/touch drag is active */
	isPointerDragging: boolean;
	/** Whether this item is currently a drop target */
	isDropTarget: boolean;
	/** Where the drop will occur relative to this item ('before' | 'inside' | 'after') */
	dropPosition: DropPosition | null;
	/** Label of the item being dragged (for custom drop indicators) */
	draggedLabel: string | null;
	/** Whether this item is the preview placeholder (the dragged item shown at its target position) */
	isPreview: boolean;
	/** Props to spread on drag handle element */
	handleProps: {
		draggable: boolean;
		tabIndex: number;
		role: string;
		'aria-roledescription': string;
		'aria-describedby': string;
		'aria-pressed'?: boolean;
		'aria-grabbed'?: boolean;
		style?: string;
		onmousedown: () => void;
		ondragstart: (e: DragEvent) => void;
		ondragend: (e: DragEvent) => void;
		onkeydown: (e: KeyboardEvent) => void;
		onpointerdown: (e: PointerEvent) => void;
	};
	/** Props to spread on drop zone element */
	dropZoneProps: {
		'data-sidebar-item-id': string;
		'data-sidebar-item-kind': string;
		ondragover: (e: DragEvent) => void;
		ondragleave: (e: DragEvent) => void;
		ondrop: (e: DragEvent) => void;
	};
	/** Keyboard DnD state and handlers */
	keyboard: {
		/** Whether keyboard drag mode is active for this item */
		isActive: boolean;
		/** Current position announcement for screen readers */
		announcement: string;
	};
}

// ============================================================================
// Event Types
// ============================================================================

export interface SidebarEvents {
	onCollapsedChange?: (collapsed: boolean) => void;
	onGroupToggle?: (groupId: string, expanded: boolean) => void;
	onNavigate?: (page: SidebarPage) => void;
	/** Called when the drawer opens or closes (mobile mode) */
	onOpenChange?: (open: boolean) => void;
	/** Called when the responsive mode changes */
	onModeChange?: (mode: SidebarResponsiveMode) => void;

	// Preventable events (return false to prevent the action)

	/** Called before navigation. Return false to prevent navigation. */
	onBeforeNavigate?: (page: SidebarPage) => boolean | void;
	/** Called before reorder completes. Return false to prevent the reorder. */
	onBeforeReorder?: (event: SidebarReorderEvent) => boolean | void;
	/** Called before group toggle. Return false to prevent the toggle. */
	onBeforeGroupToggle?: (groupId: string, willExpand: boolean) => boolean | void;
	/** Called before sidebar collapse state changes. Return false to prevent the change. */
	onBeforeCollapsedChange?: (willCollapse: boolean) => boolean | void;
	/** Called before drawer opens/closes (mobile mode). Return false to prevent the change. */
	onBeforeOpenChange?: (willOpen: boolean) => boolean | void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for SidebarPage
 */
export function isPage(item: SidebarItem | SidebarSection): item is SidebarPage {
	return item.kind === 'page';
}

/**
 * Type guard for SidebarGroup
 */
export function isGroup(item: SidebarItem | SidebarSection): item is SidebarGroup {
	return item.kind === 'group';
}

/**
 * Type guard for SidebarSection
 */
export function isSection(item: SidebarItem | SidebarSection): item is SidebarSection {
	return item.kind === 'section';
}

// ============================================================================
// Schema Types (Generic API)
// ============================================================================

/**
 * Item kind discriminator
 */
export type ItemKind = 'page' | 'group' | 'section';

/**
 * Schema accessor functions for mapping user data types to sidebar structure.
 * Enables users to use their own data types without transformation.
 */
export interface SidebarSchema<T = unknown> {
	/** Get the kind of item: 'page', 'group', or 'section' */
	getKind: (item: T) => ItemKind;
	/** Get unique identifier for the item */
	getId: (item: T) => string;
	/** Get display label for the item */
	getLabel: (item: T) => string;
	/** Get navigation href (for pages and optionally groups) */
	getHref?: (item: T) => string | undefined;
	/** Get child items (for groups and sections) */
	getItems?: (item: T) => T[] | undefined;
	/** Get icon for the item */
	getIcon?: (item: T) => SidebarIcon | undefined;
	/** Get badge value */
	getBadge?: (item: T) => string | number | undefined;
	/** Check if item is disabled */
	getDisabled?: (item: T) => boolean;
	/** Check if link opens externally */
	getExternal?: (item: T) => boolean;
	/** Check if group is collapsible */
	getCollapsible?: (item: T) => boolean;
	/** Get default expanded state for groups */
	getDefaultExpanded?: (item: T) => boolean;
	/** Get section title */
	getTitle?: (item: T) => string | undefined;
	/** Get custom metadata for render context */
	getMeta?: (item: T) => Record<string, unknown>;
}

/**
 * Context passed to render snippets for custom item rendering.
 * Contains pre-computed values from the schema for convenience.
 */
export interface SidebarRenderContext<T = unknown> {
	/** Unique identifier */
	id: string;
	/** Display label */
	label: string;
	/** Navigation href (if applicable) */
	href?: string;
	/** Icon (if any) */
	icon?: SidebarIcon;
	/** Badge value (if any) */
	badge?: string | number;
	/** Nesting depth (0 = top level) */
	depth: number;
	/** Whether this item's href matches current route */
	isActive: boolean;
	/** Whether sidebar is in collapsed state */
	isCollapsed: boolean;
	/** Whether group is expanded (only for groups) */
	isExpanded?: boolean;
	/** Whether item is disabled */
	isDisabled?: boolean;
	/** Whether link is external */
	isExternal?: boolean;
	/** Custom metadata from schema */
	meta: Record<string, unknown>;
	/** Original item data */
	original: T;
	/** Toggle expanded state (only for groups) */
	toggleExpanded?: () => void;
	/** Drag and drop state and handlers */
	dnd: SidebarDnDState;
}

/**
 * Default schema implementation for built-in types (SidebarItem | SidebarSection).
 * Used automatically when using the legacy config prop.
 */
export const defaultSchema: SidebarSchema<SidebarItem | SidebarSection> = {
	getKind: (item) => item.kind,
	getId: (item) => item.id,
	getLabel: (item) => ('label' in item ? item.label : ''),
	getHref: (item) => ('href' in item ? item.href : undefined),
	getItems: (item) => ('items' in item ? item.items : undefined),
	getIcon: (item) => ('icon' in item ? item.icon : undefined),
	getBadge: (item) => ('badge' in item ? item.badge : undefined),
	getDisabled: (item) => ('disabled' in item ? item.disabled ?? false : false),
	getExternal: (item) => ('external' in item ? item.external ?? false : false),
	getCollapsible: (item) => ('collapsible' in item ? item.collapsible !== false : true),
	getDefaultExpanded: (item) => ('defaultExpanded' in item ? item.defaultExpanded ?? false : false),
	getTitle: (item) => ('title' in item ? item.title : undefined),
	getMeta: () => ({})
};

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for Sidebar component.
 * Supports both legacy (config) and new (data + schema) APIs.
 */
export interface SidebarProps<T = SidebarItem | SidebarSection> {
	/** Legacy API: Full config object with sections and settings */
	config?: SidebarConfig;
	/** New API: Raw data array (sections) */
	data?: T[];
	/** New API: Schema for mapping data to sidebar structure */
	schema?: SidebarSchema<T>;
	/** Sidebar settings (used with new API) */
	settings?: SidebarSettings;
	class?: string;
	events?: SidebarEvents;

	// ---- Drag and Drop Props ----

	/** Enable built-in drag-and-drop reordering */
	draggable?: boolean;
	/** Callback fired when an item is reordered via drag-and-drop */
	onReorder?: (event: SidebarReorderEvent<T>) => void;
	/** Enable smooth animations when items reorder (default: true) */
	animated?: boolean;
	/**
	 * Show live preview (items move during drag to show where they'll be placed).
	 * Default: true
	 */
	livePreview?: boolean;
	/**
	 * Custom drag preview snippet - renders the element that follows the cursor during drag.
	 * If not provided, uses the browser's default drag ghost.
	 * Receives: (item: T, ctx: SidebarRenderContext<T>)
	 */
	dragPreview?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
	/**
	 * Custom drop indicator snippet - renders where the item will be dropped.
	 * If not provided, shows a faded preview of the dragged item at the target position.
	 * When provided, the faded preview is disabled and only the custom indicator is shown.
	 * Receives: (position: DropPosition, draggedLabel: string)
	 */
	dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;
}

export interface SidebarContentProps {
	class?: string;
}

export interface SidebarSectionProps<T = SidebarSection> {
	section: T;
	/** Index of this section in the root data array (for DnD) */
	index?: number;
	class?: string;
}

export interface SidebarItemsProps<T = SidebarItem> {
	items: T[];
	depth?: number;
	/** Parent ID for DnD tracking (null = root level) */
	parentId?: string | null;
}

export interface SidebarPageProps<T = SidebarPage> {
	item: T;
	depth?: number;
	class?: string;
	/** Parent ID for DnD tracking (null = root level) */
	parentId?: string | null;
	/** Index within parent for DnD tracking */
	index?: number;
}

export interface SidebarGroupProps<T = SidebarGroup> {
	item: T;
	depth?: number;
	class?: string;
	/** Parent ID for DnD tracking (null = root level) */
	parentId?: string | null;
	/** Index within parent for DnD tracking */
	index?: number;
}

export interface SidebarIconProps {
	icon: SidebarIcon;
	class?: string;
}

export interface SidebarTriggerProps {
	class?: string;
}
