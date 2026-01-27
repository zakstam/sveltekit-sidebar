export function buildTreeIndex(deps) {
    const { data, getId, getItems } = deps;
    const entries = new Map();
    const visited = new Set();
    const walk = (items, parentId, depth) => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = getId(item);
            // Prevent infinite recursion on cycles; keep the first-seen entry.
            if (visited.has(id))
                continue;
            visited.add(id);
            entries.set(id, { item, parentId, depth, index: i });
            const children = getItems(item);
            if (children.length > 0) {
                walk(children, id, depth + 1);
            }
        }
    };
    walk(data, null, 0);
    return { entries };
}
