import type { SidebarReorderEvent } from '../types.js';
/**
 * Options for the reorderItems helper function
 */
export interface ReorderOptions<T> {
    /** Get unique identifier for an item */
    getId: (item: T) => string;
    /** Get child items of an item (undefined if no children) */
    getItems: (item: T) => T[] | undefined;
    /** Create a new item with updated children */
    setItems: (item: T, children: T[]) => T;
}
/**
 * Helper function to reorder items in a nested tree structure after a drag-and-drop operation.
 * This handles cross-parent reordering (moving items between different groups/sections).
 *
 * @param sections - The root data array (sections)
 * @param event - The reorder event from the sidebar's onReorder callback
 * @param options - Configuration for accessing item properties
 * @returns A new array with the item moved to its new position
 *
 * @example
 * ```typescript
 * function handleReorder(event: SidebarReorderEvent<NavItem>) {
 *   navigation = reorderItems(navigation, event, {
 *     getId: (item) => item.id,
 *     getItems: (item) => item.children,
 *     setItems: (item, children) => ({ ...item, children })
 *   });
 * }
 * ```
 */
export declare function reorderItems<T>(sections: T[], event: SidebarReorderEvent<T>, options: ReorderOptions<T>): T[];
