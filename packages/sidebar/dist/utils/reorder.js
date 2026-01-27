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
export function reorderItems(sections, event, options) {
    const { getId, getItems, setItems } = options;
    const { item, fromParentId, toParentId, toIndex } = event;
    const itemId = getId(item);
    // Deep clone to avoid mutation - use JSON parse/stringify to handle Svelte $state proxies
    // structuredClone doesn't work with Proxy objects
    const result = JSON.parse(JSON.stringify(sections));
    const itemToInsert = JSON.parse(JSON.stringify(item));
    /**
     * Remove the item from its current location
     */
    const removeItem = (items, parentId) => {
        // Check if we're at the right parent level
        if (parentId === null) {
            // Looking for root level
            const idx = items.findIndex((i) => getId(i) === itemId);
            if (idx !== -1) {
                items.splice(idx, 1);
                return true;
            }
        }
        // Search in children
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            const currentId = getId(currentItem);
            // Check if this is the parent we're looking for
            if (currentId === fromParentId) {
                const children = getItems(currentItem);
                if (children) {
                    const idx = children.findIndex((c) => getId(c) === itemId);
                    if (idx !== -1) {
                        children.splice(idx, 1);
                        items[i] = setItems(currentItem, children);
                        return true;
                    }
                }
            }
            // Recurse into children
            const children = getItems(currentItem);
            if (children && children.length > 0) {
                if (removeItem(children, parentId)) {
                    items[i] = setItems(currentItem, children);
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * Insert the item at its new location
     */
    const insertItem = (items, parentId) => {
        // Check if we're at the right parent level
        if (parentId === null) {
            // Insert at root level
            items.splice(toIndex, 0, itemToInsert);
            return true;
        }
        // Search for the target parent
        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];
            const currentId = getId(currentItem);
            // Check if this is the parent we're looking for
            if (currentId === toParentId) {
                const children = getItems(currentItem) ?? [];
                children.splice(toIndex, 0, itemToInsert);
                items[i] = setItems(currentItem, children);
                return true;
            }
            // Recurse into children
            const children = getItems(currentItem);
            if (children && children.length > 0) {
                if (insertItem(children, parentId)) {
                    items[i] = setItems(currentItem, children);
                    return true;
                }
            }
        }
        return false;
    };
    // First remove from source, then insert at destination
    removeItem(result, fromParentId);
    insertItem(result, toParentId);
    return result;
}
