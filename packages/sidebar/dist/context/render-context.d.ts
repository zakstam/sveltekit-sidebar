import type { ItemKind, SidebarDnDState, SidebarRenderContext } from '../types.js';
export interface RenderContextDeps<T> {
    getLabel: (item: T) => string;
    getIcon: (item: T) => SidebarRenderContext<T>['icon'];
    getBadge: (item: T) => SidebarRenderContext<T>['badge'];
    getDisabled: (item: T) => boolean;
    getExternal: (item: T) => boolean;
    getMeta: (item: T) => Record<string, unknown>;
    isGroupExpanded: (id: string) => boolean;
    toggleGroup: (id: string) => void;
}
export declare function createSidebarRenderContext<T>(options: {
    item: T;
    id: string;
    href: string | undefined;
    depth: number;
    kind: ItemKind;
    activeHref: string;
    collapsed: boolean;
    dnd: SidebarDnDState;
    deps: RenderContextDeps<T>;
}): SidebarRenderContext<T>;
