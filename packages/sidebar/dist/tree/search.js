export function findItemById(deps, targetId) {
    const { data, getId, getItems, index } = deps;
    if (index) {
        const entry = index.entries.get(targetId);
        if (!entry)
            return null;
        return { item: entry.item, parentId: entry.parentId, index: entry.index };
    }
    const search = (items, parentId) => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (getId(item) === targetId) {
                return { item, parentId, index: i };
            }
            const children = getItems(item);
            if (children.length) {
                const found = search(children, getId(item));
                if (found)
                    return found;
            }
        }
        return null;
    };
    return search(data, null);
}
export function calculateDepth(deps, parentId) {
    if (parentId === null)
        return 0;
    if (deps.index) {
        const entry = deps.index.entries.get(parentId);
        if (!entry)
            return 0;
        return entry.depth;
    }
    let depth = 1;
    let currentId = parentId;
    while (currentId) {
        const info = findItemById(deps, currentId);
        if (!info || !info.parentId)
            break;
        currentId = info.parentId;
        depth++;
    }
    return depth;
}
export function containsId(deps, items, targetId) {
    const { getId, getItems } = deps;
    for (const item of items) {
        if (getId(item) === targetId)
            return true;
        const children = getItems(item);
        if (children.length && containsId(deps, children, targetId))
            return true;
    }
    return false;
}
export function isDescendantOf(deps, targetId, ancestorId) {
    if (targetId === ancestorId)
        return true;
    if (deps.index) {
        const visited = new Set();
        let currentId = targetId;
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const entry = deps.index.entries.get(currentId);
            if (!entry)
                return false;
            if (entry.parentId === ancestorId)
                return true;
            currentId = entry.parentId;
        }
        return false;
    }
    const { data, getId, getItems } = deps;
    const findInChildren = (items) => {
        for (const item of items) {
            if (getId(item) === ancestorId) {
                return containsId(deps, getItems(item), targetId);
            }
            const children = getItems(item);
            if (children.length && findInChildren(children))
                return true;
        }
        return false;
    };
    return findInChildren(data);
}
