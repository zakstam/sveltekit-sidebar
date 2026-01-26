<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';
	import type {
		SidebarConfig,
		SidebarSettings,
		SidebarEvents,
		SidebarSchema,
		SidebarRenderContext,
		SidebarReorderEvent
	} from '../types.js';
	import { createSidebarContext } from '../context.svelte.js';
	import SidebarContent from './SidebarContent.svelte';
	import SidebarTrigger from './SidebarTrigger.svelte';
	import SidebarLiveRegion from './SidebarLiveRegion.svelte';
	import SidebarBackdrop from './SidebarBackdrop.svelte';

	let {
		// New API
		data,
		schema,
		settings,

		// Legacy API (still works)
		config,

		// Render snippets for custom rendering
		page: pageSnippet,
		group: groupSnippet,
		section: sectionSnippet,

		// Common props
		events = {},
		class: className = '',
		header,
		footer,
		children,

		// Responsive
		mobileTrigger,

		// Drag and drop
		draggable = false,
		onReorder,
		dragPreview
	}: {
		// New API
		data?: T[];
		schema?: SidebarSchema<T>;
		settings?: SidebarSettings;

		// Legacy API
		config?: SidebarConfig;

		// Render snippets
		page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
		group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
		section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;

		// Common props
		events?: SidebarEvents;
		class?: string;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;

		// Responsive
		/** Custom mobile trigger snippet - rendered outside the sidebar for opening drawer */
		mobileTrigger?: Snippet;

		// Drag and drop
		draggable?: boolean;
		onReorder?: (event: SidebarReorderEvent<T>) => void;
		/** Custom drag preview snippet - receives the item being dragged and its render context */
		dragPreview?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
	} = $props();

	// Create and provide context - detects which API is being used
	// Note: config, data, schema, settings, events are intentionally captured once at mount
	const ctx = createSidebarContext<T>({
		config,
		data,
		schema,
		settings,
		events
	});

	// Set snippets immediately so they're available for initial render
	// Use $derived to track snippet prop changes
	const snippets = $derived({
		page: pageSnippet,
		group: groupSnippet,
		section: sectionSnippet
	});

	// Keep context snippets in sync
	$effect.pre(() => {
		ctx.snippets = snippets;
	});

	// Single $page subscription - sync pathname to context
	$effect(() => {
		ctx.setActiveHref($page.url.pathname);
		// Close drawer on navigation if configured
		ctx.handleNavigation();
	});

	// Clean up on destroy
	onDestroy(() => {
		ctx.destroy();
	});

	// Responsive state derived
	const responsiveMode = $derived(ctx.responsiveMode);
	const drawerOpen = $derived(ctx.drawerOpen);
	const isMobileMode = $derived(responsiveMode === 'mobile');
	const isResponsiveEnabled = $derived(ctx.settings.responsive.enabled);

	// Track previous draggable state to detect changes
	let prevDraggable = false;

	// Drag preview element reference
	let dragPreviewElement: HTMLElement;

	// Sync DnD props to context - use $effect.pre to ensure it's set before render
	$effect.pre(() => {
		// Clean up drag state if draggable was disabled mid-drag
		if (prevDraggable && !draggable && ctx.draggedItem) {
			ctx.endDrag();
		}
		prevDraggable = draggable;

		ctx.dndEnabled = draggable;
		ctx.onReorder = onReorder;
	});

	// Sync drag preview element to context
	$effect(() => {
		if (dragPreviewElement && dragPreview) {
			ctx.setDragPreviewElement(dragPreviewElement);
		}
		return () => {
			ctx.setDragPreviewElement(null);
		};
	});

	// Get dragged item info for rendering the preview
	const draggedItemInfo = $derived(ctx.draggedItem);
	const draggedItemRenderCtx = $derived(
		draggedItemInfo
			? ctx.createRenderContext(
					draggedItemInfo.item,
					0,
					draggedItemInfo.parentId,
					draggedItemInfo.index
				)
			: null
	);

	// Sync data prop to context - needed for DnD to update UI after reorder
	$effect.pre(() => {
		if (data) {
			ctx.data = data;
		}
	});

	// Derived CSS custom properties
	const cssVars = $derived(
		`--sidebar-width: ${ctx.width}; --sidebar-animation-duration: ${ctx.settings.animationDuration}ms;`
	);

	// Scroll container binding for auto-scroll during drag
	let scrollContainer: HTMLElement;

	$effect(() => {
		if (scrollContainer) {
			ctx.setScrollContainer(scrollContainer);
		}
		return () => {
			ctx.setScrollContainer(null);
		};
	});
</script>

<!-- Mobile trigger rendered outside sidebar for accessibility -->
{#if isResponsiveEnabled && isMobileMode && mobileTrigger}
	<div class="sidebar-mobile-trigger-container">
		{@render mobileTrigger()}
	</div>
{/if}

{#if isResponsiveEnabled && isMobileMode}
	<SidebarBackdrop />
{/if}

<aside
	id="sidebar-drawer"
	class="sidebar {className}"
	class:sidebar--collapsed={ctx.isCollapsed}
	class:sidebar--mode-mobile={isResponsiveEnabled && responsiveMode === 'mobile'}
	class:sidebar--mode-tablet={isResponsiveEnabled && responsiveMode === 'tablet'}
	class:sidebar--mode-desktop={isResponsiveEnabled && responsiveMode === 'desktop'}
	class:sidebar--open={drawerOpen}
	style={cssVars}
	data-collapsed={ctx.isCollapsed}
	data-responsive-mode={isResponsiveEnabled ? responsiveMode : undefined}
	role={isMobileMode ? 'dialog' : undefined}
	aria-modal={isMobileMode && drawerOpen ? 'true' : undefined}
	aria-label={isMobileMode ? 'Navigation menu' : undefined}
>
	{#if header}
		<div class="sidebar__header">
			{@render header()}
		</div>
	{/if}

	<div class="sidebar__body" bind:this={scrollContainer}>
		{#if children}
			{@render children()}
		{:else}
			<SidebarContent />
		{/if}
	</div>

	{#if draggable}
		<SidebarLiveRegion />
	{/if}

	{#if footer}
		<div class="sidebar__footer">
			{@render footer()}
		</div>
	{/if}

	<!-- Show trigger: close button in mobile, collapse chevron in tablet/desktop -->
	<div class="sidebar__trigger-container">
		<SidebarTrigger />
	</div>
</aside>

<!-- Custom drag preview container (rendered off-screen, used by setDragImage) -->
{#if draggable && dragPreview && draggedItemInfo && draggedItemRenderCtx}
	<div
		bind:this={dragPreviewElement}
		class="sidebar-drag-preview"
		aria-hidden="true"
	>
		{@render dragPreview(draggedItemInfo.item, draggedItemRenderCtx)}
	</div>
{/if}
