import type { Snippet } from 'svelte';
import type { SidebarConfig, SidebarSettings, SidebarEvents, SidebarPage, SidebarItem, SidebarSection, SidebarSchema, SidebarRenderContext, SidebarReorderEvent, ItemKind, DropPosition, KeyboardDragState, PointerDragState, SidebarResponsiveMode, SidebarAnnouncements, SidebarReorderMode } from './types.js';
import { DEFAULT_LABELS, type SidebarResolvedSettings } from './context/settings.js';
export interface SidebarSnippets<T = unknown> {
    page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
    group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
    section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
    dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;
}
export declare class SidebarContext<T = unknown> {
    #private;
    readonly schema: SidebarSchema<T>;
    data: T[];
    readonly settings: SidebarResolvedSettings;
    readonly events: SidebarEvents;
    readonly config: SidebarConfig | undefined;
    snippets: SidebarSnippets<T>;
    collapsed: boolean;
    responsiveMode: SidebarResponsiveMode;
    drawerOpen: boolean;
    activeHref: string;
    dndEnabled: boolean;
    livePreview: boolean;
    animated: boolean;
    draggedItem: {
        id: string;
        item: T;
        parentId: string | null;
        index: number;
    } | null;
    dropTargetId: string | null;
    dropPosition: DropPosition | null;
    onReorder?: (event: SidebarReorderEvent<T>) => void;
    reorderMode: SidebarReorderMode;
    previewInsert: {
        parentId: string | null;
        index: number;
    } | null;
    keyboardDragState: KeyboardDragState<T> | null;
    announcement: string;
    pointerDragState: PointerDragState<T> | null;
    private get isForcedCollapsed();
    private getEffectiveCollapsed;
    get width(): string;
    get isCollapsed(): boolean;
    get longPressDelay(): number;
    get hoverExpandDelay(): number;
    get autoScrollThreshold(): number;
    get autoScrollMaxSpeed(): number;
    get rectCacheInterval(): number;
    get labels(): typeof DEFAULT_LABELS;
    get announcements(): Required<SidebarAnnouncements>;
    /**
     * Format an announcement template with placeholder values
     */
    formatAnnouncement(template: string, values: Record<string, string | number>): string;
    /**
     * Check if a key matches a shortcut (single key or array of keys)
     */
    matchesShortcut(key: string, shortcut: string | string[]): boolean;
    constructor(options: {
        config?: SidebarConfig;
        data?: T[];
        schema?: SidebarSchema<T>;
        settings?: SidebarSettings;
        events?: SidebarEvents;
    });
    /**
     * Set up media query listeners for responsive behavior
     */
    private setupResponsiveMediaQueries;
    /**
     * Clean up responsive media query listeners
     */
    private cleanupResponsiveMediaQueries;
    /**
     * Clean up all resources (called on component destroy)
     */
    destroy(): void;
    /**
     * Set the responsive mode
     */
    private setResponsiveMode;
    /**
     * Open the mobile drawer
     */
    openDrawer(): void;
    /**
     * Close the mobile drawer
     */
    closeDrawer(): void;
    /**
     * Toggle the mobile drawer
     */
    toggleDrawer(): void;
    /**
     * Lock body scroll (for mobile drawer)
     */
    private lockBodyScroll;
    /**
     * Unlock body scroll
     */
    private unlockBodyScroll;
    /**
     * Handle navigation (closes drawer if configured)
     */
    handleNavigation(): void;
    /**
     * Get the kind of an item using the schema
     */
    getKind(item: T): ItemKind;
    /**
     * Get the ID of an item using the schema
     */
    getId(item: T): string;
    /**
     * Get the label of an item using the schema
     */
    getLabel(item: T): string;
    /**
     * Get the href of an item using the schema
     */
    getHref(item: T): string | undefined;
    /**
     * Get child items using the schema
     */
    getItems(item: T): T[];
    /**
     * Get the icon of an item using the schema
     */
    getIcon(item: T): ReturnType<NonNullable<SidebarSchema<T>['getIcon']>>;
    /**
     * Get the badge of an item using the schema
     */
    getBadge(item: T): string | number | undefined;
    /**
     * Check if an item is disabled using the schema
     */
    getDisabled(item: T): boolean;
    /**
     * Check if an item is external using the schema
     */
    getExternal(item: T): boolean;
    /**
     * Check if a group is collapsible using the schema
     */
    getCollapsible(item: T): boolean;
    /**
     * Get section title using the schema
     */
    getTitle(item: T): string | undefined;
    /**
     * Create a render context for use with custom snippets.
     * Contains pre-computed values from the schema for convenience.
     */
    createRenderContext(item: T, depth: number, parentId?: string | null, index?: number): SidebarRenderContext<T>;
    /**
     * Toggle sidebar collapsed state
     */
    toggleCollapsed(): void;
    /**
     * Set sidebar collapsed state
     */
    setCollapsed(value: boolean): void;
    /**
     * Toggle a group's expanded state
     */
    toggleGroup(groupId: string): void;
    /**
     * Set a group's expanded state
     */
    setGroupExpanded(groupId: string, expanded: boolean): void;
    /**
     * Set the currently active href (called from root Sidebar)
     */
    setActiveHref(href: string): void;
    /**
     * Check if a group is expanded
     * Returns a reactive value that only updates when THIS specific group changes
     */
    isGroupExpanded(groupId: string): boolean;
    /**
     * Get all expanded group IDs (for utilities/debugging)
     */
    getExpandedGroupIds(): string[];
    /**
     * Expand all groups in the path to an item
     */
    expandPathTo(itemId: string): void;
    /**
     * Handle navigation to a page (legacy compatibility)
     */
    handleNavigate(page: SidebarPage): void;
    /**
     * Set the custom drag preview element (called by Sidebar component)
     */
    setDragPreviewElement(element: HTMLElement | null): void;
    /**
     * Get the custom drag preview element
     */
    getDragPreviewElement(): HTMLElement | null;
    /**
     * Start dragging an item
     */
    startDrag(item: T, parentId: string | null, index: number): void;
    /**
     * End dragging (cleanup)
     * @param animate - Whether to animate items back if preview was active
     */
    endDrag(animate?: boolean): void;
    /**
     * Calculate drop position based on mouse Y coordinate relative to element
     */
    calculateDropPosition(e: DragEvent | PointerEvent, targetKind: ItemKind, currentPosition?: DropPosition | null): DropPosition;
    /**
     * Set the current drop target (with validation)
     */
    setDropTarget(targetItem: T | null, targetParentId?: string | null, event?: DragEvent | PointerEvent): void;
    /**
     * Set drop target with explicit rect (for touch drag where we have cached rects)
     */
    setDropTargetWithRect(targetItem: T, targetParentId: string | null, clientY: number, rect: DOMRect): void;
    /**
     * Calculate drop position from clientY and bounding rect
     */
    private calculateDropPositionFromRect;
    /**
     * Internal method to set drop target after position is calculated
     */
    private setDropTargetInternal;
    /**
     * Handle drop on a target item
     */
    private getEffectiveReorderMode;
    private canReorderInternally;
    private applyInternalReorder;
    handleDrop(_targetItem: T, _targetParentId: string | null, _targetIndex: number, _targetDepth: number): void;
    /**
     * Calculate the insert position (parentId and index) based on target and position
     */
    private calculateInsertPosition;
    /**
     * Check if targetId is the same as ancestorId or is a descendant of it.
     * Prevents dropping an item into itself or its children.
     */
    private isDropDescendantOf;
    /**
     * Check if an item is the preview placeholder (the dragged item shown at its target position).
     * This is true when:
     * 1. Live preview is active
     * 2. The item being checked is the dragged item
     * 3. The dragged item is being shown at a different position than its original
     */
    isPreviewItem(id: string): boolean;
    /**
     * Get items with live preview reordering applied.
     * During drag, shows items as they would appear after drop.
     */
    getItemsWithPreview(items: T[], parentId: string | null): T[];
    /**
     * Update the preview insertion point based on current drop target and position
     */
    private updatePreviewInsert;
    /**
     * Schedule a debounced preview update.
     * Drop target/position state updates immediately (for CSS indicators),
     * but DOM-shuffling preview is delayed to avoid layout thrashing feedback loops.
     */
    private schedulePreviewUpdate;
    /**
     * Cancel any pending preview debounce timer and flush the update if needed.
     */
    private flushPreviewDebounce;
    private getKeyboardDeps;
    /**
     * Handle keyboard events on drag handle
     */
    handleKeyDown(e: KeyboardEvent, item: T, parentId: string | null, index: number, depth: number): void;
    /**
     * Pick up an item for keyboard reordering
     */
    pickUpItem(item: T, parentId: string | null, index: number, _depth: number): void;
    /**
     * Move the picked up item up or down
     */
    movePickedUpItem(direction: -1 | 1): void;
    /**
     * Move picked up item to parent level
     */
    movePickedUpItemToParent(): void;
    /**
     * Move picked up item into a sibling group
     */
    movePickedUpItemIntoGroup(): void;
    /**
     * Drop the picked up item at its current position
     */
    dropPickedUpItem(depth: number): void;
    /**
     * Cancel keyboard drag and restore original position
     */
    cancelKeyboardDrag(): void;
    /**
     * Get siblings at a given parent level
     */
    private getSiblingsAtLevel;
    /**
     * Find an item by ID and return its parent info
     */
    private findItemById;
    /**
     * Calculate depth by counting parents
     */
    private calculateDepth;
    private getPointerDeps;
    /**
     * Handle pointer down on drag handle
     */
    handlePointerDown(e: PointerEvent, item: T, parentId: string | null, index: number): void;
    /**
     * Start pointer drag after long press
     */
    private startPointerDrag;
    /**
     * Cache bounding rects of all drop zones for hit testing during touch drag
     */
    private cacheDropZoneRects;
    /**
     * Find drop zone at given coordinates using cached rects
     */
    private findDropZoneAtPoint;
    /**
     * Handle pointer move during drag
     */
    handlePointerMove(e: PointerEvent): void;
    /**
     * Handle pointer up (drop or cancel)
     */
    handlePointerUp(_e: PointerEvent): void;
    /**
     * Clean up pointer drag state
     */
    private cleanupPointerDrag;
    /**
     * Set the scroll container for auto-scroll during drag
     */
    setScrollContainer(element: HTMLElement | null): void;
    /**
     * Handle auto-scroll when dragging near edges
     */
    handleDragAutoScroll(clientY: number): void;
    /**
     * Stop auto-scroll animation
     */
    stopAutoScroll(): void;
    /**
     * Find the nearest drop zone by vertical distance when the cursor is in a gap.
     * Returns the closest item above or below the cursor position.
     */
    private findNearestDropZone;
    /**
     * Get event handlers for the scroll container to catch drag events in gaps between items.
     * Per-item ondragover uses e.stopPropagation(), so these only fire when the cursor
     * is NOT over an item (i.e., in a gap).
     */
    getContainerDragHandlers(): {
        ondragover: (e: DragEvent) => void;
        ondragleave: (e: DragEvent) => void;
        ondrop: (e: DragEvent) => void;
    };
    /**
     * Start timer to expand a collapsed group on hover during drag
     */
    startHoverExpandTimer(groupId: string): void;
    /**
     * Cancel hover-expand timer
     */
    cancelHoverExpandTimer(): void;
    /**
     * Capture current positions of all items for FLIP animation
     */
    captureItemPositions(): void;
    /**
     * Animate items from old positions to new positions (FLIP)
     */
    animateItemPositions(): void;
    private getTreeIndex;
    /**
     * Invalidate the cached tree index. Useful if data is mutated in place.
     */
    invalidateTreeIndex(): void;
    private getInitialExpandedGroups;
    private loadPersistedState;
    private persistState;
    private findPathToItem;
}
/**
 * Create and set sidebar context (new generic API)
 */
export declare function createSidebarContext<T = SidebarItem | SidebarSection>(options: {
    config?: SidebarConfig;
    data?: T[];
    schema?: SidebarSchema<T>;
    settings?: SidebarSettings;
    events?: SidebarEvents;
}): SidebarContext<T>;
/**
 * Set sidebar context (for use when context is created externally)
 */
export declare function setSidebarContext<T>(context: SidebarContext<T>): void;
/**
 * Get sidebar context from parent component
 */
export declare function getSidebarContext<T = unknown>(): SidebarContext<T>;
/**
 * Try to get sidebar context (returns undefined if not found)
 */
export declare function tryGetSidebarContext<T = unknown>(): SidebarContext<T> | undefined;
