import type { DropPosition, ItemKind } from '../types.js';
import type { PreviewDraggedItem } from './preview.js';
export declare function computeEffectiveParentId(options: {
    draggedKind: ItemKind;
    targetKind: ItemKind;
    targetId: string;
    targetParentId: string | null;
    position: DropPosition;
}): string | null;
export declare function isValidDropTarget(options: {
    draggedItem: PreviewDraggedItem<unknown> | null;
    draggedKind: ItemKind | null;
    targetId: string;
    targetKind: ItemKind;
    targetParentId: string | null;
    position: DropPosition;
    isDescendant: (targetId: string, ancestorId: string) => boolean;
}): boolean;
