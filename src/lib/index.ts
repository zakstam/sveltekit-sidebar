// ============================================================================
// Types
// ============================================================================

// Non-conflicting types (exported with original names)
export type {
	SidebarItem,
	SidebarRootItem,
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
	SidebarTriggerProps,
	// Schema types (new generic API)
	ItemKind,
	SidebarSchema,
	SidebarRenderContext,
	// Drag and Drop types
	SidebarReorderEvent,
	SidebarDnDState,
	DropPosition,
	KeyboardDragState,
	PointerDragState,
	// Responsive types
	SidebarResponsiveSettings,
	SidebarResponsiveMode,
	// Customization types
	SidebarDnDSettings,
	SidebarKeyboardShortcuts,
	SidebarLabels,
	SidebarAnnouncements
} from './types.js';

// Conflicting types (renamed to avoid collision with component names)
// These types define the data structure for sidebar items
export type {
	SidebarIcon as SidebarIconType,
	SidebarPage as SidebarPageData,
	SidebarGroup as SidebarGroupData,
	SidebarSection as SidebarSectionData
} from './types.js';

// Default schema for backward compatibility
export { defaultSchema } from './types.js';

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
	SidebarTrigger,
	SidebarLiveRegion,
	SidebarBackdrop,
	SidebarMobileTrigger
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

export type { SidebarSnippets } from './context.svelte.js';

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
// Utilities - Drag and Drop
// ============================================================================

export { reorderItems } from './utils/reorder.js';
export type { ReorderOptions } from './utils/reorder.js';

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
