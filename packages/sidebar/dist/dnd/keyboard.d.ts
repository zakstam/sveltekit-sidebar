import type { ItemKind, KeyboardDragState, SidebarAnnouncements } from '../types.js';
import type { PreviewDraggedItem, PreviewInsertPosition } from './preview.js';
export interface KeyboardDeps<T> {
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    getKind: (item: T) => ItemKind;
    getItems: (item: T) => T[];
    getSiblingsAtLevel: (parentId: string | null) => T[];
    findItemById: (id: string) => {
        item: T;
        parentId: string | null;
        index: number;
    } | null;
    isGroupExpanded: (id: string) => boolean;
    setGroupExpandedDirect: (id: string, expanded: boolean) => void;
    captureItemPositions: () => void;
    animateItemPositions: () => void;
    announcements: Required<SidebarAnnouncements>;
    formatAnnouncement: (template: string, values: Record<string, string | number>) => string;
    setAnnouncement: (value: string) => void;
    getKeyboardDragState: () => KeyboardDragState<T> | null;
    setKeyboardDragState: (value: KeyboardDragState<T> | null) => void;
    setDraggedItem: (value: PreviewDraggedItem<T> | null) => void;
    setPreviewInsert: (value: PreviewInsertPosition | null) => void;
}
export declare function pickUpItem<T>(deps: KeyboardDeps<T>, item: T, parentId: string | null, index: number): void;
export declare function movePickedUpItem<T>(deps: KeyboardDeps<T>, direction: -1 | 1): void;
export declare function movePickedUpItemToParent<T>(deps: KeyboardDeps<T>): void;
export declare function movePickedUpItemIntoGroup<T>(deps: KeyboardDeps<T>): void;
export declare function cancelKeyboardDrag<T>(deps: KeyboardDeps<T>): void;
