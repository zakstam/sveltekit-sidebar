import type { SidebarConfig, SidebarPage, SidebarRootItem } from '../types.js';
/**
 * Extract all pages from a sidebar configuration (flat list)
 * Useful for generating sitemaps or navigation menus
 */
export declare function getAllPages(config: SidebarConfig): SidebarPage[];
/**
 * Find an item by ID anywhere in the sidebar configuration
 */
export declare function findItemById(config: SidebarConfig, id: string): SidebarRootItem | undefined;
/**
 * Get the path (ancestor IDs) to an item
 * Useful for auto-expanding groups when navigating to a deep item
 */
export declare function getItemPath(config: SidebarConfig, targetId: string): string[];
/**
 * Find a page by its href
 */
export declare function findPageByHref(config: SidebarConfig, href: string): SidebarPage | undefined;
/**
 * Get all group IDs from a configuration
 */
export declare function getAllGroupIds(config: SidebarConfig): string[];
/**
 * Count total items (pages + groups) in a configuration
 */
export declare function countItems(config: SidebarConfig): {
    pages: number;
    groups: number;
    total: number;
};
/**
 * Get the depth of an item in the hierarchy
 */
export declare function getItemDepth(config: SidebarConfig, targetId: string): number;
/**
 * Check if an item is a descendant of a group
 */
export declare function isDescendantOf(config: SidebarConfig, itemId: string, groupId: string): boolean;
