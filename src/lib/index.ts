// ============================================================================
// Types
// ============================================================================

// Non-conflicting types (exported with original names)
export type {
	SidebarItem,
	SidebarConfig,
	SidebarSettings,
	SidebarState,
	SidebarEvents,
	SidebarProps,
	SidebarContentProps,
	SidebarSectionProps,
	SidebarItemsProps,
	SidebarPageProps,
	SidebarGroupProps,
	SidebarIconProps,
	SidebarTriggerProps
} from './types.js';

// Conflicting types (renamed to avoid collision with component names)
// These types define the data structure for sidebar items
export type {
	SidebarIcon as SidebarIconType,
	SidebarPage as SidebarPageData,
	SidebarGroup as SidebarGroupData,
	SidebarSection as SidebarSectionData
} from './types.js';

// ============================================================================
// Type Guards
// ============================================================================

export { isPage, isGroup, isSection } from './types.js';

// ============================================================================
// Components
// ============================================================================

export {
	Sidebar,
	SidebarContent,
	SidebarSection,
	SidebarItems,
	SidebarPage,
	SidebarGroup,
	SidebarIcon,
	SidebarTrigger
} from './components/index.js';

// ============================================================================
// Context
// ============================================================================

export {
	SidebarContext,
	createSidebarContext,
	setSidebarContext,
	getSidebarContext,
	tryGetSidebarContext
} from './context.svelte.js';

// ============================================================================
// Utilities - Type Helpers
// ============================================================================

export {
	getAllPages,
	findItemById,
	getItemPath,
	findPageByHref,
	getAllGroupIds,
	countItems,
	getItemDepth,
	isDescendantOf
} from './utils/type-helpers.js';

// ============================================================================
// Utilities - Builder API
// ============================================================================

export {
	// Builder classes
	PageBuilder,
	GroupBuilder,
	SectionBuilder,
	SidebarConfigBuilder,
	// Factory functions (fluent API)
	page,
	group,
	section,
	sidebar,
	// Direct creation functions
	createPage,
	createGroup,
	createSection,
	createConfig
} from './utils/builder.js';
