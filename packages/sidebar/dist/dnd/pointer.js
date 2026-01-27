export function handlePointerDown(deps, e, item, parentId, index) {
    if (!deps.dndEnabled)
        return;
    if (e.button !== 0)
        return;
    if (e.pointerType === 'mouse')
        return;
    e.preventDefault();
    const id = deps.getId(item);
    const longPressTimer = setTimeout(() => {
        startPointerDrag(deps);
    }, deps.longPressDelay);
    deps.setPointerDragState({
        item,
        id,
        parentId,
        index,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging: false,
        longPressTimer
    });
    deps.addGlobalListeners();
}
export function startPointerDrag(deps) {
    const state = deps.getPointerDragState();
    if (!state)
        return;
    state.isDragging = true;
    state.longPressTimer = null;
    deps.startDrag(state.item, state.parentId, state.index);
    deps.cacheDropZoneRects();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
    }
    const label = deps.getLabel(state.item);
    deps.announceTouchDragStarted(label);
}
export function handlePointerMove(deps, e) {
    const state = deps.getPointerDragState();
    if (!state)
        return;
    state.currentX = e.clientX;
    state.currentY = e.clientY;
    if (!state.isDragging) {
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            if (state.longPressTimer) {
                clearTimeout(state.longPressTimer);
                state.longPressTimer = null;
            }
            cleanupPointerDrag(deps);
            return;
        }
    }
    if (state.isDragging) {
        e.preventDefault();
        const now = Date.now();
        if (now - deps.getLastRectCacheTime() > deps.rectCacheInterval) {
            deps.cacheDropZoneRects();
            deps.setLastRectCacheTime(now);
        }
        const dropZone = deps.findDropZoneAtPoint(e.clientX, e.clientY);
        if (dropZone) {
            const targetItem = deps.findItemById(dropZone.id);
            if (targetItem) {
                deps.setDropTargetWithRect(targetItem.item, targetItem.parentId, e.clientY, dropZone.element.getBoundingClientRect());
            }
        }
        else {
            deps.setDropTarget(null);
        }
        deps.handleDragAutoScroll(e.clientY);
    }
}
export function handlePointerUp(deps) {
    const state = deps.getPointerDragState();
    if (!state)
        return;
    if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
    }
    if (state.isDragging) {
        const dropTargetId = deps.getDropTargetId();
        if (dropTargetId) {
            const targetInfo = deps.findItemById(dropTargetId);
            if (targetInfo) {
                const depth = deps.calculateDepth(targetInfo.parentId);
                deps.handleDrop(targetInfo.item, targetInfo.parentId, targetInfo.index, depth);
            }
        }
    }
    cleanupPointerDrag(deps);
}
export function cleanupPointerDrag(deps) {
    deps.removeGlobalListeners();
    deps.setDropZoneRects([]);
    const state = deps.getPointerDragState();
    if (state?.isDragging && deps.getDraggedItemId()) {
        deps.endDrag(true);
    }
    deps.setPointerDragState(null);
    deps.stopAutoScroll();
}
