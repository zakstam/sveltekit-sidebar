import type { TreeIndex } from './index.js';
export interface TreeSearchDeps<T> {
    data: T[];
    getId: (item: T) => string;
    getItems: (item: T) => T[];
    index?: TreeIndex<T>;
}
export declare function findItemById<T>(deps: TreeSearchDeps<T>, targetId: string): {
    item: T;
    parentId: string | null;
    index: number;
} | null;
export declare function calculateDepth<T>(deps: TreeSearchDeps<T>, parentId: string | null): number;
export declare function containsId<T>(deps: TreeSearchDeps<T>, items: T[], targetId: string): boolean;
export declare function isDescendantOf<T>(deps: TreeSearchDeps<T>, targetId: string, ancestorId: string): boolean;
