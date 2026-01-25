import type {
	SidebarConfig,
	SidebarSection,
	SidebarItem,
	SidebarPage,
	SidebarGroup,
	SidebarSettings,
	SidebarIcon
} from '../types.js';

/**
 * Fluent builder for creating SidebarPage items
 */
export class PageBuilder {
	private page: SidebarPage;

	constructor(id: string, label: string, href: string) {
		this.page = { kind: 'page', id, label, href };
	}

	icon(icon: SidebarIcon): this {
		this.page.icon = icon;
		return this;
	}

	badge(badge: string | number): this {
		this.page.badge = badge;
		return this;
	}

	disabled(disabled = true): this {
		this.page.disabled = disabled;
		return this;
	}

	external(external = true): this {
		this.page.external = external;
		return this;
	}

	build(): SidebarPage {
		return this.page;
	}
}

/**
 * Fluent builder for creating SidebarGroup items
 */
export class GroupBuilder {
	private group: SidebarGroup;

	constructor(id: string, label: string) {
		this.group = { kind: 'group', id, label, items: [] };
	}

	icon(icon: SidebarIcon): this {
		this.group.icon = icon;
		return this;
	}

	badge(badge: string | number): this {
		this.group.badge = badge;
		return this;
	}

	defaultExpanded(expanded = true): this {
		this.group.defaultExpanded = expanded;
		return this;
	}

	collapsible(collapsible = true): this {
		this.group.collapsible = collapsible;
		return this;
	}

	items(...items: SidebarItem[]): this {
		this.group.items = items;
		return this;
	}

	addItem(item: SidebarItem): this {
		this.group.items.push(item);
		return this;
	}

	addPage(id: string, label: string, href: string): this {
		this.group.items.push({ kind: 'page', id, label, href });
		return this;
	}

	addGroup(id: string, label: string, configure?: (builder: GroupBuilder) => void): this {
		const builder = new GroupBuilder(id, label);
		configure?.(builder);
		this.group.items.push(builder.build());
		return this;
	}

	build(): SidebarGroup {
		return this.group;
	}
}

/**
 * Fluent builder for creating SidebarSection items
 */
export class SectionBuilder {
	private section: SidebarSection;

	constructor(id: string) {
		this.section = { kind: 'section', id, items: [] };
	}

	title(title: string): this {
		this.section.title = title;
		return this;
	}

	collapsible(collapsible = true): this {
		this.section.collapsible = collapsible;
		return this;
	}

	defaultExpanded(expanded = true): this {
		this.section.defaultExpanded = expanded;
		return this;
	}

	items(...items: SidebarItem[]): this {
		this.section.items = items;
		return this;
	}

	addItem(item: SidebarItem): this {
		this.section.items.push(item);
		return this;
	}

	addPage(id: string, label: string, href: string): this {
		this.section.items.push({ kind: 'page', id, label, href });
		return this;
	}

	addGroup(id: string, label: string, configure?: (builder: GroupBuilder) => void): this {
		const builder = new GroupBuilder(id, label);
		configure?.(builder);
		this.section.items.push(builder.build());
		return this;
	}

	build(): SidebarSection {
		return this.section;
	}
}

/**
 * Fluent builder for creating SidebarConfig
 */
export class SidebarConfigBuilder {
	private config: SidebarConfig;

	constructor() {
		this.config = { sections: [] };
	}

	settings(settings: SidebarSettings): this {
		this.config.settings = settings;
		return this;
	}

	sections(...sections: SidebarSection[]): this {
		this.config.sections = sections;
		return this;
	}

	addSection(id: string, configure?: (builder: SectionBuilder) => void): this {
		const builder = new SectionBuilder(id);
		configure?.(builder);
		this.config.sections.push(builder.build());
		return this;
	}

	build(): SidebarConfig {
		return this.config;
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new page item
 */
export function page(id: string, label: string, href: string): PageBuilder {
	return new PageBuilder(id, label, href);
}

/**
 * Create a new group item
 */
export function group(id: string, label: string): GroupBuilder {
	return new GroupBuilder(id, label);
}

/**
 * Create a new section
 */
export function section(id: string): SectionBuilder {
	return new SectionBuilder(id);
}

/**
 * Create a new sidebar config
 */
export function sidebar(): SidebarConfigBuilder {
	return new SidebarConfigBuilder();
}

// ============================================================================
// Quick creation functions (without builder pattern)
// ============================================================================

/**
 * Create a page item directly
 */
export function createPage(
	id: string,
	label: string,
	href: string,
	options?: Partial<Omit<SidebarPage, 'kind' | 'id' | 'label' | 'href'>>
): SidebarPage {
	return { kind: 'page', id, label, href, ...options };
}

/**
 * Create a group item directly
 */
export function createGroup(
	id: string,
	label: string,
	items: SidebarItem[],
	options?: Partial<Omit<SidebarGroup, 'kind' | 'id' | 'label' | 'items'>>
): SidebarGroup {
	return { kind: 'group', id, label, items, ...options };
}

/**
 * Create a section directly
 */
export function createSection(
	id: string,
	items: SidebarItem[],
	options?: Partial<Omit<SidebarSection, 'kind' | 'id' | 'items'>>
): SidebarSection {
	return { kind: 'section', id, items, ...options };
}

/**
 * Create a sidebar config directly
 */
export function createConfig(
	sections: SidebarSection[],
	settings?: SidebarSettings
): SidebarConfig {
	return { sections, settings };
}
