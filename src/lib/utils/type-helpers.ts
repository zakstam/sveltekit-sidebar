import type {
	SidebarConfig,
	SidebarSection,
	SidebarItem,
	SidebarPage,
	SidebarGroup,
	SidebarRootItem
} from '../types.js';
import { isPage, isGroup, isSection } from '../types.js';

/**
 * Extract all pages from a sidebar configuration (flat list)
 * Useful for generating sitemaps or navigation menus
 */
export function getAllPages(config: SidebarConfig): SidebarPage[] {
	const pages: SidebarPage[] = [];

	function processItems(items: SidebarItem[]): void {
		for (const item of items) {
			if (isPage(item)) {
				pages.push(item);
			} else if (isGroup(item)) {
				processItems(item.items);
			}
		}
	}

	for (const rootItem of config.sections) {
		if (isSection(rootItem)) {
			processItems(rootItem.items);
		} else if (isPage(rootItem)) {
			pages.push(rootItem);
		} else if (isGroup(rootItem)) {
			processItems(rootItem.items);
		}
	}

	return pages;
}

/**
 * Find an item by ID anywhere in the sidebar configuration
 */
export function findItemById(
	config: SidebarConfig,
	id: string
): SidebarRootItem | undefined {
	for (const rootItem of config.sections) {
		// Check if this root item itself matches
		if (rootItem.id === id) {
			return rootItem;
		}

		// Search inside sections and groups
		if (isSection(rootItem) || isGroup(rootItem)) {
			const found = findInItems(rootItem.items, id);
			if (found) return found;
		}
	}

	return undefined;
}

function findInItems(items: SidebarItem[], id: string): SidebarItem | undefined {
	for (const item of items) {
		if (item.id === id) {
			return item;
		}

		if (isGroup(item)) {
			const found = findInItems(item.items, id);
			if (found) return found;
		}
	}

	return undefined;
}

/**
 * Get the path (ancestor IDs) to an item
 * Useful for auto-expanding groups when navigating to a deep item
 */
export function getItemPath(config: SidebarConfig, targetId: string): string[] {
	function findPath(items: SidebarItem[], path: string[]): string[] | null {
		for (const item of items) {
			if (item.id === targetId) {
				return path;
			}

			if (isGroup(item)) {
				const result = findPath(item.items, [...path, item.id]);
				if (result) return result;
			}
		}
		return null;
	}

	for (const rootItem of config.sections) {
		// Check if this root item itself is the target
		if (rootItem.id === targetId) {
			return [];
		}

		if (isSection(rootItem)) {
			// Search inside sections
			const result = findPath(rootItem.items, []);
			if (result) return result;
		} else if (isGroup(rootItem)) {
			// Root-level group: search its children
			const result = findPath(rootItem.items, [rootItem.id]);
			if (result) return result;
		}
	}

	return [];
}

/**
 * Find a page by its href
 */
export function findPageByHref(config: SidebarConfig, href: string): SidebarPage | undefined {
	const pages = getAllPages(config);
	return pages.find((page) => page.href === href);
}

/**
 * Get all group IDs from a configuration
 */
export function getAllGroupIds(config: SidebarConfig): string[] {
	const ids: string[] = [];

	function processItems(items: SidebarItem[]): void {
		for (const item of items) {
			if (isGroup(item)) {
				ids.push(item.id);
				processItems(item.items);
			}
		}
	}

	for (const rootItem of config.sections) {
		if (isSection(rootItem)) {
			processItems(rootItem.items);
		} else if (isGroup(rootItem)) {
			ids.push(rootItem.id);
			processItems(rootItem.items);
		}
	}

	return ids;
}

/**
 * Count total items (pages + groups) in a configuration
 */
export function countItems(config: SidebarConfig): { pages: number; groups: number; total: number } {
	let pages = 0;
	let groups = 0;

	function processItems(items: SidebarItem[]): void {
		for (const item of items) {
			if (isPage(item)) {
				pages++;
			} else if (isGroup(item)) {
				groups++;
				processItems(item.items);
			}
		}
	}

	for (const rootItem of config.sections) {
		if (isSection(rootItem)) {
			processItems(rootItem.items);
		} else if (isPage(rootItem)) {
			pages++;
		} else if (isGroup(rootItem)) {
			groups++;
			processItems(rootItem.items);
		}
	}

	return { pages, groups, total: pages + groups };
}

/**
 * Get the depth of an item in the hierarchy
 */
export function getItemDepth(config: SidebarConfig, targetId: string): number {
	const path = getItemPath(config, targetId);
	return path.length;
}

/**
 * Check if an item is a descendant of a group
 */
export function isDescendantOf(
	config: SidebarConfig,
	itemId: string,
	groupId: string
): boolean {
	const path = getItemPath(config, itemId);
	return path.includes(groupId);
}
