export function getInitialExpandedGroups(deps) {
    const { data, getId, getKind, getItems, getDefaultExpanded } = deps;
    const expanded = {};
    const visitedIds = new Set();
    const processItems = (items) => {
        for (const item of items) {
            const id = getId(item);
            // Prevent infinite recursion on cycles
            if (visitedIds.has(id)) {
                continue;
            }
            visitedIds.add(id);
            const kind = getKind(item);
            if (kind === 'group') {
                if (getDefaultExpanded?.(item)) {
                    expanded[id] = true;
                }
                const children = getItems(item);
                if (children.length > 0) {
                    processItems(children);
                }
            }
            else if (kind === 'section') {
                const children = getItems(item);
                if (children.length > 0) {
                    processItems(children);
                }
            }
        }
    };
    processItems(data);
    return expanded;
}
