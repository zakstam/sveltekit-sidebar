import type { DropPosition, ItemKind } from '../types.js';
export interface PreviewDraggedItem<T> {
    id: string;
    item: T;
    parentId: string | null;
    index: number;
}
export interface PreviewInsertPosition {
    parentId: string | null;
    index: number;
}
export interface PreviewDeps<T> {
    getKind: (item: T) => ItemKind;
    getId: (item: T) => string;
    findItemById: (id: string) => {
        item: T;
        parentId: string | null;
        index: number;
    } | null;
}
export declare function calculateInsertPosition<T>(options: {
    draggedItem: PreviewDraggedItem<T> | null;
    targetId: string;
    position: DropPosition;
    deps: PreviewDeps<T>;
}): PreviewInsertPosition | null;
export declare function computePreviewInsert<T>(options: {
    livePreview: boolean;
    draggedItem: PreviewDraggedItem<T> | null;
    dropTargetId: string | null;
    dropPosition: DropPosition | null;
    deps: PreviewDeps<T>;
}): PreviewInsertPosition | null;
export declare function isPreviewItem<T>(options: {
    livePreview: boolean;
    draggedItem: PreviewDraggedItem<T> | null;
    previewInsert: PreviewInsertPosition | null;
    id: string;
}): boolean;
export declare function getItemsWithPreview<T>(options: {
    items: T[];
    parentId: string | null;
    draggedItem: PreviewDraggedItem<T> | null;
    previewInsert: PreviewInsertPosition | null;
    getId: (item: T) => string;
}): T[];
