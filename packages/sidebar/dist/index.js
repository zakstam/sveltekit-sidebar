// ============================================================================
// Types
// ============================================================================
// Default schema for backward compatibility
export { defaultSchema } from './types.js';
// ============================================================================
// Type Guards
// ============================================================================
export { isPage, isGroup, isSection } from './types.js';
// ============================================================================
// Components
// ============================================================================
export { Sidebar, SidebarContent, SidebarSection, SidebarItems, SidebarPage, SidebarGroup, SidebarIcon, SidebarTrigger, SidebarLiveRegion, SidebarBackdrop, SidebarMobileTrigger } from './components/index.js';
// ============================================================================
// Adapters
// ============================================================================
export { SvelteKitSidebar } from './adapters/index.js';
// ============================================================================
// Context
// ============================================================================
export { SidebarContext, createSidebarContext, setSidebarContext, getSidebarContext, tryGetSidebarContext } from './context.svelte.js';
// ============================================================================
// Utilities - Type Helpers
// ============================================================================
export { getAllPages, findItemById, getItemPath, findPageByHref, getAllGroupIds, countItems, getItemDepth, isDescendantOf } from './utils/type-helpers.js';
// ============================================================================
// Utilities - Tree Index
// ============================================================================
export { buildTreeIndex } from './tree/index.js';
// ============================================================================
// Utilities - Drag and Drop
// ============================================================================
export { reorderItems } from './utils/reorder.js';
// ============================================================================
// Utilities - Builder API
// ============================================================================
export { 
// Builder classes
PageBuilder, GroupBuilder, SectionBuilder, SidebarConfigBuilder, 
// Factory functions (fluent API)
page, group, section, sidebar, 
// Direct creation functions
createPage, createGroup, createSection, createConfig } from './utils/builder.js';
