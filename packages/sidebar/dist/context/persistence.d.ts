import type { SidebarSettings } from '../types.js';
export interface SidebarPersistenceSettings {
    persistCollapsed: boolean;
    persistExpandedGroups: boolean;
    storageKey: string;
}
export interface PersistedSidebarState {
    collapsed: boolean | null;
    expandedGroupIds: string[];
}
export declare function toPersistenceSettings(settings: SidebarSettings): SidebarPersistenceSettings;
export declare function loadPersistedSidebarState(settings: SidebarPersistenceSettings): PersistedSidebarState;
export declare function persistSidebarState(settings: SidebarPersistenceSettings, collapsed: boolean, expandedMap: Record<string, boolean>): void;
