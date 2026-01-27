export function findPathToItem(deps, targetId) {
    const { data, getId, getKind, getItems, index } = deps;
    if (index) {
        const entry = index.entries.get(targetId);
        if (!entry)
            return [];
        const path = [];
        const visited = new Set();
        let currentParentId = entry.parentId;
        while (currentParentId && !visited.has(currentParentId)) {
            visited.add(currentParentId);
            const parentEntry = index.entries.get(currentParentId);
            if (parentEntry && getKind(parentEntry.item) === 'group') {
                path.push(currentParentId);
            }
            currentParentId = parentEntry?.parentId ?? null;
        }
        return path.reverse();
    }
    const findPath = (items, path) => {
        for (const item of items) {
            const id = getId(item);
            if (id === targetId) {
                return path;
            }
            const kind = getKind(item);
            if (kind === 'group') {
                const children = getItems(item);
                const result = findPath(children, [...path, id]);
                if (result)
                    return result;
            }
        }
        return null;
    };
    for (const rootItem of data) {
        const id = getId(rootItem);
        const kind = getKind(rootItem);
        if (id === targetId) {
            return [];
        }
        if (kind === 'section') {
            const items = getItems(rootItem);
            const result = findPath(items, []);
            if (result)
                return result;
        }
        else if (kind === 'group') {
            const children = getItems(rootItem);
            const result = findPath(children, [id]);
            if (result)
                return result;
        }
    }
    return [];
}
