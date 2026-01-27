// ============================================================================
// Type Guards
// ============================================================================
/**
 * Type guard for SidebarPage
 */
export function isPage(item) {
    return item.kind === 'page';
}
/**
 * Type guard for SidebarGroup
 */
export function isGroup(item) {
    return item.kind === 'group';
}
/**
 * Type guard for SidebarSection
 */
export function isSection(item) {
    return item.kind === 'section';
}
/**
 * Default schema implementation for built-in types (SidebarItem | SidebarSection).
 * Used automatically when using the legacy config prop.
 */
export const defaultSchema = {
    getKind: (item) => item.kind,
    getId: (item) => item.id,
    getLabel: (item) => ('label' in item ? item.label : ''),
    getHref: (item) => ('href' in item ? item.href : undefined),
    getItems: (item) => ('items' in item ? item.items : undefined),
    setItems: (item, items) => {
        if ('items' in item) {
            // Built-in tree shape only allows SidebarItem children under items.
            return { ...item, items: items };
        }
        return item;
    },
    getIcon: (item) => ('icon' in item ? item.icon : undefined),
    getBadge: (item) => ('badge' in item ? item.badge : undefined),
    getDisabled: (item) => ('disabled' in item ? item.disabled ?? false : false),
    getExternal: (item) => ('external' in item ? item.external ?? false : false),
    getCollapsible: (item) => ('collapsible' in item ? item.collapsible !== false : true),
    getDefaultExpanded: (item) => ('defaultExpanded' in item ? item.defaultExpanded ?? false : false),
    getTitle: (item) => ('title' in item ? item.title : undefined),
    getMeta: () => ({})
};
