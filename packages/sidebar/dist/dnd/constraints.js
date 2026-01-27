export function computeEffectiveParentId(options) {
    const { draggedKind, targetKind, targetId, targetParentId, position } = options;
    if (draggedKind === 'section' && targetKind === 'section') {
        return null;
    }
    if (position === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
        return targetId;
    }
    if (position === 'before' || position === 'after') {
        return targetParentId;
    }
    return targetParentId;
}
export function isValidDropTarget(options) {
    const { draggedItem, draggedKind, targetId, targetKind, targetParentId, position, isDescendant } = options;
    if (!draggedItem || !draggedKind)
        return true;
    const effectiveParentId = computeEffectiveParentId({
        draggedKind,
        targetKind,
        targetId,
        targetParentId,
        position
    });
    // Sections can only be dropped at root level
    if (draggedKind === 'section' && effectiveParentId !== null) {
        return false;
    }
    // Prevent dropping on self or descendant
    if (isDescendant(targetId, draggedItem.id)) {
        return false;
    }
    return true;
}
