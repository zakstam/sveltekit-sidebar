import type { ItemKind } from '../types.js';
import type { TreeIndex } from './index.js';
export interface TreePathDeps<T> {
    data: T[];
    getId: (item: T) => string;
    getKind: (item: T) => ItemKind;
    getItems: (item: T) => T[];
    index?: TreeIndex<T>;
}
export declare function findPathToItem<T>(deps: TreePathDeps<T>, targetId: string): string[];
