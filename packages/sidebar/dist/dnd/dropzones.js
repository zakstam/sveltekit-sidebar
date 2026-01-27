export function cacheDropZoneRects(options) {
    const { container, excludeId } = options;
    const scope = container ?? document;
    const rects = [];
    const dropZones = scope.querySelectorAll('[data-sidebar-item-id]');
    dropZones.forEach((element) => {
        const id = element.getAttribute('data-sidebar-item-id');
        if (id && id !== excludeId) {
            rects.push({
                id,
                rect: element.getBoundingClientRect(),
                element: element
            });
        }
    });
    return rects;
}
export function findDropZoneAtPoint(rects, x, y) {
    let bestMatch = null;
    for (const { id, rect, element } of rects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            const area = rect.width * rect.height;
            if (!bestMatch || area < bestMatch.area) {
                bestMatch = { id, element, area };
            }
        }
    }
    return bestMatch ? { id: bestMatch.id, element: bestMatch.element } : null;
}
export function findNearestDropZone(rects, y) {
    let bestMatch = null;
    for (const { id, rect, element } of rects) {
        const distance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
        if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { id, element, rect, distance };
        }
    }
    return bestMatch ? { id: bestMatch.id, element: bestMatch.element, rect: bestMatch.rect } : null;
}
