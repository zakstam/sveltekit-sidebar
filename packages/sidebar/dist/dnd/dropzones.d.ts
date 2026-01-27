export interface DropZoneRect {
    id: string;
    rect: DOMRect;
    element: HTMLElement;
}
export declare function cacheDropZoneRects(options: {
    container: HTMLElement | null;
    excludeId: string | null;
}): DropZoneRect[];
export declare function findDropZoneAtPoint(rects: DropZoneRect[], x: number, y: number): {
    id: string;
    element: HTMLElement;
} | null;
export declare function findNearestDropZone(rects: DropZoneRect[], y: number): {
    id: string;
    element: HTMLElement;
    rect: DOMRect;
} | null;
