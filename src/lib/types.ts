import type { Component, Snippet } from 'svelte';

// ============================================================================
// Icon Types
// ============================================================================

/**
 * Flexible icon type supporting:
 * - Svelte Components (e.g., Lucide icons)
 * - String (for icon names/URLs)
 * - Snippets (for custom rendering)
 */
export type SidebarIcon = Component<{ class?: string }> | string | Snippet<[{ class?: string }]>;

// ============================================================================
// Core Item Types (Discriminated Unions)
// ============================================================================

/**
 * Navigation link item
 */
export interface SidebarPage {
	kind: 'page';
	id: string;
	label: string;
	href: string;
	icon?: SidebarIcon;
	badge?: string | number;
	disabled?: boolean;
	external?: boolean;
}

/**
 * Collapsible group containing nested items
 * The `items` array enables infinite nesting
 * Optionally has its own href - clicking navigates AND expands
 */
export interface SidebarGroup {
	kind: 'group';
	id: string;
	label: string;
	icon?: SidebarIcon;
	items: SidebarItem[];
	defaultExpanded?: boolean;
	collapsible?: boolean;
	badge?: string | number;
	/** Optional href - group becomes a navigable link that also expands */
	href?: string;
	external?: boolean;
}

/**
 * Union type for items that can appear in sections or groups
 * This recursive definition enables infinite nesting
 */
export type SidebarItem = SidebarPage | SidebarGroup;

/**
 * Top-level section containing items
 */
export interface SidebarSection {
	kind: 'section';
	id: string;
	title?: string;
	items: SidebarItem[];
	collapsible?: boolean;
	defaultExpanded?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Sidebar settings for customization
 */
export interface SidebarSettings {
	/** Width when expanded (default: 280px) */
	widthExpanded?: string;
	/** Width when collapsed (default: 64px) */
	widthCollapsed?: string;
	/** Animation duration in ms (default: 200) */
	animationDuration?: number;
	/** Persist collapsed state to localStorage */
	persistCollapsed?: boolean;
	/** Persist expanded groups to localStorage */
	persistExpandedGroups?: boolean;
	/** localStorage key prefix */
	storageKey?: string;
	/** Start collapsed */
	defaultCollapsed?: boolean;
}

/**
 * Root configuration object
 */
export interface SidebarConfig {
	sections: SidebarSection[];
	settings?: SidebarSettings;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Sidebar state managed by context
 */
export interface SidebarState {
	collapsed: boolean;
	expandedGroups: Set<string>;
}

// ============================================================================
// Event Types
// ============================================================================

export interface SidebarEvents {
	onCollapsedChange?: (collapsed: boolean) => void;
	onGroupToggle?: (groupId: string, expanded: boolean) => void;
	onNavigate?: (page: SidebarPage) => void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for SidebarPage
 */
export function isPage(item: SidebarItem | SidebarSection): item is SidebarPage {
	return item.kind === 'page';
}

/**
 * Type guard for SidebarGroup
 */
export function isGroup(item: SidebarItem | SidebarSection): item is SidebarGroup {
	return item.kind === 'group';
}

/**
 * Type guard for SidebarSection
 */
export function isSection(item: SidebarItem | SidebarSection): item is SidebarSection {
	return item.kind === 'section';
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface SidebarProps {
	config: SidebarConfig;
	class?: string;
	events?: SidebarEvents;
}

export interface SidebarContentProps {
	class?: string;
}

export interface SidebarSectionProps {
	section: SidebarSection;
	class?: string;
}

export interface SidebarItemsProps {
	items: SidebarItem[];
	depth?: number;
}

export interface SidebarPageProps {
	item: SidebarPage;
	depth?: number;
	class?: string;
}

export interface SidebarGroupProps {
	item: SidebarGroup;
	depth?: number;
	class?: string;
}

export interface SidebarIconProps {
	icon: SidebarIcon;
	class?: string;
}

export interface SidebarTriggerProps {
	class?: string;
}
