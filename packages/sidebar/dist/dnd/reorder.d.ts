import type { SidebarReorderEvent, SidebarReorderMode, SidebarSchema } from '../types.js';
export declare function getEffectiveReorderMode(reorderMode: SidebarReorderMode, hasExternalHandler: boolean): Exclude<SidebarReorderMode, 'auto'>;
export declare function canReorderInternally<T>(schema: SidebarSchema<T>): boolean;
export declare function applyInternalReorder<T>(options: {
    data: T[];
    event: SidebarReorderEvent<T>;
    schema: SidebarSchema<T>;
    getId: (item: T) => string;
}): T[];
