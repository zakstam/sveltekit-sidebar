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

export function createSidebarRenderContext<T>(options: {
	item: T;
	id: string;
	href: string | undefined;
	depth: number;
	kind: ItemKind;
	activeHref: string;
	collapsed: boolean;
	dnd: SidebarDnDState;
	deps: RenderContextDeps<T>;
}): SidebarRenderContext<T> {
	const { item, id, href, depth, kind, activeHref, collapsed, dnd, deps } = options;

	return {
		id,
		label: deps.getLabel(item),
		href,
		icon: deps.getIcon(item),
		badge: deps.getBadge(item),
		depth,
		isActive: href ? activeHref === href : false,
		isCollapsed: collapsed,
		isExpanded: kind === 'group' ? deps.isGroupExpanded(id) : undefined,
		isDisabled: deps.getDisabled(item),
		isExternal: deps.getExternal(item),
		meta: deps.getMeta(item),
		original: item,
		toggleExpanded: kind === 'group' ? () => deps.toggleGroup(id) : undefined,
		dnd
	};
}
