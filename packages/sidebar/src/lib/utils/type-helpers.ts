import type {
	SidebarConfig,
	SidebarSection,
	SidebarItem,
	SidebarPage,
	SidebarGroup,
	SidebarRootItem
} from '../types.js';
import { isPage, isGroup, isSection } from '../types.js';
import { buildTreeIndex } from '../tree/index.js';
import { findPathToItem as findPathToItemInTree } from '../tree/path.js';

function getItems(item: SidebarRootItem): SidebarItem[] {
	return 'items' in item ? item.items : [];
}

function buildConfigIndex(config: SidebarConfig) {
	return buildTreeIndex({
		data: config.sections,
		getId: (item) => item.id,
		getItems
	});
}

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
	const index = buildConfigIndex(config);
	return index.entries.get(id)?.item as SidebarRootItem | undefined;
}

/**
 * Get the path (ancestor IDs) to an item
 * Useful for auto-expanding groups when navigating to a deep item
 */
export function getItemPath(config: SidebarConfig, targetId: string): string[] {
	const index = buildConfigIndex(config);
	return findPathToItemInTree(
		{
			data: config.sections,
			getId: (item) => item.id,
			getKind: (item) => item.kind,
			getItems,
			index
		},
		targetId
	);
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
