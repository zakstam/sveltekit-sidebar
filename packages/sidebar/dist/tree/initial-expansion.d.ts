import type { ItemKind } from '../types.js';
export interface InitialExpansionDeps<T> {
    data: T[];
    getId: (item: T) => string;
    getKind: (item: T) => ItemKind;
    getItems: (item: T) => T[];
    getDefaultExpanded?: (item: T) => boolean;
}
export declare function getInitialExpandedGroups<T>(deps: InitialExpansionDeps<T>): Record<string, boolean>;
