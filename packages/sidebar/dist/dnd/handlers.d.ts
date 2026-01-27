import type { DropPosition, SidebarDnDState, SidebarLabels, ItemKind, KeyboardDragState, PointerDragState } from '../types.js';
export interface DraggedItemState<T> {
    id: string;
    item: T;
    parentId: string | null;
    index: number;
}
export interface DnDHandlerDeps<T> {
    dndEnabled: boolean;
    labels: Required<{
        navigation: Required<NonNullable<SidebarLabels['navigation']>>;
        trigger: Required<NonNullable<SidebarLabels['trigger']>>;
        group: Required<NonNullable<SidebarLabels['group']>>;
        link: Required<NonNullable<SidebarLabels['link']>>;
        dnd: Required<NonNullable<SidebarLabels['dnd']>>;
    }>;
    announcement: string;
    draggedItem: DraggedItemState<T> | null;
    keyboardDragState: KeyboardDragState<T> | null;
    pointerDragState: PointerDragState<T> | null;
    dropTargetId: string | null;
    dropPosition: DropPosition | null;
    getLabel: (item: T) => string;
    isPreviewItem: (id: string) => boolean;
    getDragPreviewElement: () => HTMLElement | null;
    getScrollContainer: () => HTMLElement | null;
    getHoverExpandTargetId: () => string | null;
    setDraggedItem: (value: DraggedItemState<T> | null) => void;
    startDrag: (item: T, parentId: string | null, index: number) => void;
    endDrag: (animate?: boolean) => void;
    handleKeyDown: (e: KeyboardEvent, item: T, parentId: string | null, index: number, depth: number) => void;
    handlePointerDown: (e: PointerEvent, item: T, parentId: string | null, index: number) => void;
    setDropTarget: (item: T, parentId: string | null, e: DragEvent) => void;
    handleDrop: (item: T, parentId: string | null, index: number, depth: number) => void;
    findItemById: (id: string) => {
        item: T;
        parentId: string | null;
        index: number;
    } | null;
    calculateDepth: (parentId: string | null) => number;
    cancelHoverExpandTimer: () => void;
}
export declare function createDnDState<T>(options: {
    item: T;
    id: string;
    kind: ItemKind;
    parentId: string | null;
    index: number;
    depth: number;
    hasCustomDropIndicator: boolean;
    deps: DnDHandlerDeps<T>;
}): SidebarDnDState;
