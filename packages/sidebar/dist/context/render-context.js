export function createSidebarRenderContext(options) {
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
