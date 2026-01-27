import type { SidebarConfig, SidebarSection, SidebarItem, SidebarPage, SidebarGroup, SidebarSettings, SidebarIcon } from '../types.js';
/**
 * Fluent builder for creating SidebarPage items
 */
export declare class PageBuilder {
    private page;
    constructor(id: string, label: string, href: string);
    icon(icon: SidebarIcon): this;
    badge(badge: string | number): this;
    disabled(disabled?: boolean): this;
    external(external?: boolean): this;
    build(): SidebarPage;
}
/**
 * Fluent builder for creating SidebarGroup items
 */
export declare class GroupBuilder {
    private group;
    constructor(id: string, label: string);
    icon(icon: SidebarIcon): this;
    badge(badge: string | number): this;
    defaultExpanded(expanded?: boolean): this;
    collapsible(collapsible?: boolean): this;
    href(href: string): this;
    external(external?: boolean): this;
    items(...items: SidebarItem[]): this;
    addItem(item: SidebarItem): this;
    addPage(id: string, label: string, href: string): this;
    addGroup(id: string, label: string, configure?: (builder: GroupBuilder) => void): this;
    build(): SidebarGroup;
}
/**
 * Fluent builder for creating SidebarSection items
 */
export declare class SectionBuilder {
    private section;
    constructor(id: string);
    title(title: string): this;
    collapsible(collapsible?: boolean): this;
    defaultExpanded(expanded?: boolean): this;
    items(...items: SidebarItem[]): this;
    addItem(item: SidebarItem): this;
    addPage(id: string, label: string, href: string): this;
    addGroup(id: string, label: string, configure?: (builder: GroupBuilder) => void): this;
    build(): SidebarSection;
}
/**
 * Fluent builder for creating SidebarConfig
 */
export declare class SidebarConfigBuilder {
    private config;
    constructor();
    settings(settings: SidebarSettings): this;
    sections(...sections: SidebarSection[]): this;
    addSection(id: string, configure?: (builder: SectionBuilder) => void): this;
    build(): SidebarConfig;
}
/**
 * Create a new page item
 */
export declare function page(id: string, label: string, href: string): PageBuilder;
/**
 * Create a new group item
 */
export declare function group(id: string, label: string): GroupBuilder;
/**
 * Create a new section
 */
export declare function section(id: string): SectionBuilder;
/**
 * Create a new sidebar config
 */
export declare function sidebar(): SidebarConfigBuilder;
/**
 * Create a page item directly
 */
export declare function createPage(id: string, label: string, href: string, options?: Partial<Omit<SidebarPage, 'kind' | 'id' | 'label' | 'href'>>): SidebarPage;
/**
 * Create a group item directly
 */
export declare function createGroup(id: string, label: string, items: SidebarItem[], options?: Partial<Omit<SidebarGroup, 'kind' | 'id' | 'label' | 'items'>>): SidebarGroup;
/**
 * Create a section directly
 */
export declare function createSection(id: string, items: SidebarItem[], options?: Partial<Omit<SidebarSection, 'kind' | 'id' | 'items'>>): SidebarSection;
/**
 * Create a sidebar config directly
 */
export declare function createConfig(sections: SidebarSection[], settings?: SidebarSettings): SidebarConfig;
