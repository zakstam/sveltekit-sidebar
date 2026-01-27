import type { PointerDragState } from '../types.js';
import type { DropZoneRect } from './dropzones.js';
export interface PointerDeps<T> {
    dndEnabled: boolean;
    longPressDelay: number;
    rectCacheInterval: number;
    getPointerDragState: () => PointerDragState<T> | null;
    setPointerDragState: (value: PointerDragState<T> | null) => void;
    getDraggedItemId: () => string | null;
    getDropTargetId: () => string | null;
    setLastRectCacheTime: (value: number) => void;
    getLastRectCacheTime: () => number;
    getDropZoneRects: () => DropZoneRect[];
    setDropZoneRects: (rects: DropZoneRect[]) => void;
    cacheDropZoneRects: () => void;
    findDropZoneAtPoint: (x: number, y: number) => {
        id: string;
        element: HTMLElement;
    } | null;
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    startDrag: (item: T, parentId: string | null, index: number) => void;
    endDrag: (animate?: boolean) => void;
    setDropTargetWithRect: (item: T, parentId: string | null, clientY: number, rect: DOMRect) => void;
    setDropTarget: (item: T | null) => void;
    findItemById: (id: string) => {
        item: T;
        parentId: string | null;
        index: number;
    } | null;
    calculateDepth: (parentId: string | null) => number;
    handleDrop: (item: T, parentId: string | null, index: number, depth: number) => void;
    handleDragAutoScroll: (clientY: number) => void;
    stopAutoScroll: () => void;
    formatAnnouncement: (template: string, values: Record<string, string | number>) => string;
    announceTouchDragStarted: (label: string) => void;
    addGlobalListeners: () => void;
    removeGlobalListeners: () => void;
}
export declare function handlePointerDown<T>(deps: PointerDeps<T>, e: PointerEvent, item: T, parentId: string | null, index: number): void;
export declare function startPointerDrag<T>(deps: PointerDeps<T>): void;
export declare function handlePointerMove<T>(deps: PointerDeps<T>, e: PointerEvent): void;
export declare function handlePointerUp<T>(deps: PointerDeps<T>): void;
export declare function cleanupPointerDrag<T>(deps: PointerDeps<T>): void;
