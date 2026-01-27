export function calculateInsertPosition(options) {
    const { draggedItem, targetId, position, deps } = options;
    if (!draggedItem)
        return null;
    const targetInfo = deps.findItemById(targetId);
    if (!targetInfo)
        return null;
    const { item: targetItem, parentId: targetParentId, index: targetIndex } = targetInfo;
    const targetKind = deps.getKind(targetItem);
    const draggedKind = deps.getKind(draggedItem.item);
    let toParentId;
    let toIndex;
    if (position === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
        toParentId = targetId;
        toIndex = 0;
    }
    else if (position === 'before') {
        toParentId = targetParentId;
        toIndex = targetIndex;
    }
    else {
        toParentId = targetParentId;
        toIndex = targetIndex + 1;
    }
    // Sections can only be at root level
    if (draggedKind === 'section' && toParentId !== null) {
        return null;
    }
    // Adjust index if moving within same parent and dragged item is before target
    if (draggedItem.parentId === toParentId && draggedItem.index < toIndex) {
        toIndex--;
    }
    return { parentId: toParentId, index: toIndex };
}
export function computePreviewInsert(options) {
    const { livePreview, draggedItem, dropTargetId, dropPosition, deps } = options;
    if (!livePreview)
        return null;
    if (!draggedItem || !dropTargetId || !dropPosition)
        return null;
    const targetInfo = deps.findItemById(dropTargetId);
    if (!targetInfo)
        return null;
    const { item: targetItem, parentId: targetParentId, index: targetIndex } = targetInfo;
    const targetKind = deps.getKind(targetItem);
    const draggedKind = deps.getKind(draggedItem.item);
    let toParentId;
    let toIndex;
    if (draggedKind === 'section' && targetKind === 'section') {
        toParentId = null;
        toIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
    }
    else if (dropPosition === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
        toParentId = dropTargetId;
        toIndex = 0;
    }
    else if (dropPosition === 'before') {
        toParentId = targetParentId;
        toIndex = targetIndex;
    }
    else {
        toParentId = targetParentId;
        toIndex = targetIndex + 1;
    }
    // Sections can only be at root level
    if (draggedKind === 'section' && toParentId !== null) {
        return null;
    }
    if (draggedItem.parentId === toParentId && draggedItem.index < toIndex) {
        toIndex = Math.max(0, toIndex - 1);
    }
    return { parentId: toParentId, index: toIndex };
}
export function isPreviewItem(options) {
    const { livePreview, draggedItem, previewInsert, id } = options;
    if (!livePreview || !draggedItem || !previewInsert) {
        return false;
    }
    if (draggedItem.id !== id) {
        return false;
    }
    return draggedItem.parentId !== previewInsert.parentId || draggedItem.index !== previewInsert.index;
}
export function getItemsWithPreview(options) {
    const { items, parentId, draggedItem, previewInsert, getId } = options;
    if (!draggedItem || !previewInsert) {
        return items;
    }
    const { id: draggedId, parentId: fromParentId } = draggedItem;
    const { parentId: toParentId, index: toIndex } = previewInsert;
    const isSourceLevel = fromParentId === parentId;
    const isTargetLevel = toParentId === parentId;
    if (!isSourceLevel && !isTargetLevel) {
        return items;
    }
    let result = isSourceLevel ? items.filter((item) => getId(item) !== draggedId) : [...items];
    if (isTargetLevel) {
        const insertIndex = Math.min(toIndex, result.length);
        result = [...result.slice(0, insertIndex), draggedItem.item, ...result.slice(insertIndex)];
    }
    return result;
}
