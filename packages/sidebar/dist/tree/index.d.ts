export interface TreeIndexEntry<T> {
    item: T;
    parentId: string | null;
    depth: number;
    index: number;
}
export interface TreeIndex<T> {
    entries: Map<string, TreeIndexEntry<T>>;
}
export interface TreeIndexDeps<T> {
    data: T[];
    getId: (item: T) => string;
    getItems: (item: T) => T[];
}
export declare function buildTreeIndex<T>(deps: TreeIndexDeps<T>): TreeIndex<T>;
