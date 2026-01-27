/**
 * Fluent builder for creating SidebarPage items
 */
export class PageBuilder {
    page;
    constructor(id, label, href) {
        this.page = { kind: 'page', id, label, href };
    }
    icon(icon) {
        this.page.icon = icon;
        return this;
    }
    badge(badge) {
        this.page.badge = badge;
        return this;
    }
    disabled(disabled = true) {
        this.page.disabled = disabled;
        return this;
    }
    external(external = true) {
        this.page.external = external;
        return this;
    }
    build() {
        return this.page;
    }
}
/**
 * Fluent builder for creating SidebarGroup items
 */
export class GroupBuilder {
    group;
    constructor(id, label) {
        this.group = { kind: 'group', id, label, items: [] };
    }
    icon(icon) {
        this.group.icon = icon;
        return this;
    }
    badge(badge) {
        this.group.badge = badge;
        return this;
    }
    defaultExpanded(expanded = true) {
        this.group.defaultExpanded = expanded;
        return this;
    }
    collapsible(collapsible = true) {
        this.group.collapsible = collapsible;
        return this;
    }
    href(href) {
        this.group.href = href;
        return this;
    }
    external(external = true) {
        this.group.external = external;
        return this;
    }
    items(...items) {
        this.group.items = items;
        return this;
    }
    addItem(item) {
        this.group.items.push(item);
        return this;
    }
    addPage(id, label, href) {
        this.group.items.push({ kind: 'page', id, label, href });
        return this;
    }
    addGroup(id, label, configure) {
        const builder = new GroupBuilder(id, label);
        configure?.(builder);
        this.group.items.push(builder.build());
        return this;
    }
    build() {
        return this.group;
    }
}
/**
 * Fluent builder for creating SidebarSection items
 */
export class SectionBuilder {
    section;
    constructor(id) {
        this.section = { kind: 'section', id, items: [] };
    }
    title(title) {
        this.section.title = title;
        return this;
    }
    collapsible(collapsible = true) {
        this.section.collapsible = collapsible;
        return this;
    }
    defaultExpanded(expanded = true) {
        this.section.defaultExpanded = expanded;
        return this;
    }
    items(...items) {
        this.section.items = items;
        return this;
    }
    addItem(item) {
        this.section.items.push(item);
        return this;
    }
    addPage(id, label, href) {
        this.section.items.push({ kind: 'page', id, label, href });
        return this;
    }
    addGroup(id, label, configure) {
        const builder = new GroupBuilder(id, label);
        configure?.(builder);
        this.section.items.push(builder.build());
        return this;
    }
    build() {
        return this.section;
    }
}
/**
 * Fluent builder for creating SidebarConfig
 */
export class SidebarConfigBuilder {
    config;
    constructor() {
        this.config = { sections: [] };
    }
    settings(settings) {
        this.config.settings = settings;
        return this;
    }
    sections(...sections) {
        this.config.sections = sections;
        return this;
    }
    addSection(id, configure) {
        const builder = new SectionBuilder(id);
        configure?.(builder);
        this.config.sections.push(builder.build());
        return this;
    }
    build() {
        return this.config;
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a new page item
 */
export function page(id, label, href) {
    return new PageBuilder(id, label, href);
}
/**
 * Create a new group item
 */
export function group(id, label) {
    return new GroupBuilder(id, label);
}
/**
 * Create a new section
 */
export function section(id) {
    return new SectionBuilder(id);
}
/**
 * Create a new sidebar config
 */
export function sidebar() {
    return new SidebarConfigBuilder();
}
// ============================================================================
// Quick creation functions (without builder pattern)
// ============================================================================
/**
 * Create a page item directly
 */
export function createPage(id, label, href, options) {
    return { kind: 'page', id, label, href, ...options };
}
/**
 * Create a group item directly
 */
export function createGroup(id, label, items, options) {
    return { kind: 'group', id, label, items, ...options };
}
/**
 * Create a section directly
 */
export function createSection(id, items, options) {
    return { kind: 'section', id, items, ...options };
}
/**
 * Create a sidebar config directly
 */
export function createConfig(sections, settings) {
    return { sections, settings };
}
