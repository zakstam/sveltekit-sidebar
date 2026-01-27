export interface DropZoneRect {
	id: string;
	rect: DOMRect;
	element: HTMLElement;
}

export function cacheDropZoneRects(options: {
	container: HTMLElement | null;
	excludeId: string | null;
}): DropZoneRect[] {
	const { container, excludeId } = options;
	const scope: ParentNode = container ?? document;
	const rects: DropZoneRect[] = [];
	const dropZones = scope.querySelectorAll('[data-sidebar-item-id]');

	dropZones.forEach((element) => {
		const id = element.getAttribute('data-sidebar-item-id');
		if (id && id !== excludeId) {
			rects.push({
				id,
				rect: element.getBoundingClientRect(),
				element: element as HTMLElement
			});
		}
	});

	return rects;
}

export function findDropZoneAtPoint(
	rects: DropZoneRect[],
	x: number,
	y: number
): { id: string; element: HTMLElement } | null {
	let bestMatch: { id: string; element: HTMLElement; area: number } | null = null;

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

export function findNearestDropZone(
	rects: DropZoneRect[],
	y: number
): { id: string; element: HTMLElement; rect: DOMRect } | null {
	let bestMatch: { id: string; element: HTMLElement; rect: DOMRect; distance: number } | null = null;

	for (const { id, rect, element } of rects) {
		const distance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
		if (!bestMatch || distance < bestMatch.distance) {
			bestMatch = { id, element, rect, distance };
		}
	}

	return bestMatch ? { id: bestMatch.id, element: bestMatch.element, rect: bestMatch.rect } : null;
}
