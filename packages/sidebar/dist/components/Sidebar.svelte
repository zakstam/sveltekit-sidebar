<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { onDestroy, onMount } from 'svelte';
	import type {
		SidebarConfig,
		SidebarSettings,
		SidebarEvents,
		SidebarSchema,
		SidebarReorderMode,
		SidebarRenderContext,
		SidebarReorderEvent,
		DropPosition
	} from '../types.js';
	import { createSidebarContext } from '../context.svelte.js';
	import SidebarContent from './SidebarContent.svelte';
	import SidebarTrigger from './SidebarTrigger.svelte';
	import SidebarLiveRegion from './SidebarLiveRegion.svelte';
	import SidebarBackdrop from './SidebarBackdrop.svelte';
	import SidebarMobileTrigger from './SidebarMobileTrigger.svelte';

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
		activeHref,
		header,
		footer,
		children,

		// Responsive
		mobileTrigger,

		// Drag and drop
		draggable = false,
		onReorder,
		reorderMode = 'auto',
		dragPreview,
		dropIndicator,
		livePreview = true,
		animated = true
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
		/** Current active pathname/href. Provide this to decouple from SvelteKit routing. */
		activeHref?: string;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;

		// Responsive
		/** Custom mobile trigger snippet - rendered outside the sidebar for opening drawer */
		mobileTrigger?: Snippet;

		// Drag and drop
		draggable?: boolean;
		onReorder?: (event: SidebarReorderEvent<T>) => void;
		/** Reorder mode. Defaults to 'auto'. */
		reorderMode?: SidebarReorderMode;
		/** Custom drag preview snippet - receives the item being dragged and its render context */
		dragPreview?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
		/** Custom drop indicator snippet. Falls back to built-in faded item preview. */
		dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;
		/** Show live preview (items move during drag). Set to false to use custom drop indicators only. Default: true */
		livePreview?: boolean;
		/** Enable smooth animations when items reorder (default: true) */
		animated?: boolean;
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
		section: sectionSnippet,
		dropIndicator
	});

	// Keep context snippets in sync
	$effect.pre(() => {
		ctx.snippets = snippets;
	});

	// Track previous pathname to detect actual navigation
	let previousPathname = '';

	// Sync active href to context (routing-agnostic)
	$effect(() => {
		const currentPathname =
			activeHref ?? (typeof window !== 'undefined' ? window.location.pathname : '');
		if (!currentPathname) return;
		ctx.setActiveHref(currentPathname);

		// Only close drawer on actual navigation (URL change), not initial mount
		if (previousPathname && previousPathname !== currentPathname) {
			ctx.handleNavigation();
		}
		previousPathname = currentPathname;
	});

	// Clean up on destroy
	onDestroy(() => {
		ctx.destroy();
	});

	let hydrated = $state(false);
	// Avoid initial-load layout shifts by gating transitions until hydration
	onMount(() => {
		hydrated = true;
	});

	// Responsive state derived
	const responsiveMode = $derived(ctx.responsiveMode);
	const drawerOpen = $derived(ctx.drawerOpen);
	const isMobileMode = $derived(responsiveMode === 'mobile');
	const isResponsiveEnabled = $derived(ctx.settings.responsive.enabled);

	// Track previous draggable state to detect changes
	let prevDraggable = false;

	// Drag preview element reference
	let dragPreviewElement = $state<HTMLElement | null>(null);

	// Sync DnD props to context - use $effect.pre to ensure it's set before render
	$effect.pre(() => {
		// Clean up drag state if draggable was disabled mid-drag
		if (prevDraggable && !draggable && ctx.draggedItem) {
			ctx.endDrag();
		}
		prevDraggable = draggable;

		ctx.dndEnabled = draggable;
		ctx.onReorder = onReorder;
		ctx.reorderMode = reorderMode;
		ctx.livePreview = livePreview;
		ctx.animated = animated;
	});

	// Sync drag preview element to context immediately when available
	$effect.pre(() => {
		if (dragPreviewElement) {
			ctx.setDragPreviewElement(dragPreviewElement);
		}
	});

	// Cleanup on unmount
	$effect(() => {
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

	// Sync data prop to context when it changes (controlled mode / external updates)
	$effect.pre(() => {
		if (data) {
			ctx.data = data;
			// Defensive: if callers mutate in place, ensure the index rebuilds.
			ctx.invalidateTreeIndex();
		}
	});

	// Derived CSS custom properties
	const cssVars = $derived(
		`--sidebar-width: ${ctx.width}; --sidebar-animation-duration: ${ctx.settings.animationDuration}ms;`
	);

	// Scroll container binding for auto-scroll during drag
	let scrollContainer: HTMLElement;

	// Container-level drag handlers for gap fallback
	const containerDragHandlers = ctx.getContainerDragHandlers();

	$effect(() => {
		if (scrollContainer) {
			ctx.setScrollContainer(scrollContainer);
		}
		return () => {
			ctx.setScrollContainer(null);
		};
	});

	// Tooltip handling for collapsed mode
	let sidebarElement: HTMLElement;
	let tooltipElement: HTMLElement;
	let currentTooltipTarget: HTMLElement | null = null;

	$effect(() => {
		if (!sidebarElement || typeof window === 'undefined') return;

		function handleMouseOver(e: MouseEvent) {
			if (!ctx.isCollapsed || !tooltipElement) return;

			const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement | null;
			if (!target || target === currentTooltipTarget) return;

			currentTooltipTarget = target;
			const text = target.getAttribute('data-tooltip');
			if (!text) return;

			const rect = target.getBoundingClientRect();
			tooltipElement.textContent = text;
			tooltipElement.style.top = `${rect.top + rect.height / 2}px`;
			tooltipElement.style.left = `${rect.right + 8}px`;
			tooltipElement.style.transform = 'translateY(-50%)';
			tooltipElement.classList.add('sidebar-tooltip--visible');
		}

		function handleMouseOut(e: MouseEvent) {
			if (!tooltipElement) return;

			const relatedTarget = e.relatedTarget as HTMLElement | null;
			const stillInTooltipTarget = relatedTarget?.closest('[data-tooltip]') === currentTooltipTarget;

			if (!stillInTooltipTarget) {
				tooltipElement.classList.remove('sidebar-tooltip--visible');
				currentTooltipTarget = null;
			}
		}

		sidebarElement.addEventListener('mouseover', handleMouseOver);
		sidebarElement.addEventListener('mouseout', handleMouseOut);

		return () => {
			sidebarElement.removeEventListener('mouseover', handleMouseOver);
			sidebarElement.removeEventListener('mouseout', handleMouseOut);
		};
	});
</script>

<!-- Mobile trigger rendered outside sidebar for accessibility -->
{#if isResponsiveEnabled && isMobileMode}
	<div class="sidebar-mobile-trigger-container">
		{#if mobileTrigger}
			{@render mobileTrigger()}
		{:else}
			<SidebarMobileTrigger />
		{/if}
	</div>
{/if}

	{#if isResponsiveEnabled && isMobileMode}
		<SidebarBackdrop class={hydrated ? '' : 'sidebar-backdrop--prehydrate'} />
	{/if}

<!-- Tooltip element for collapsed mode -->
<div bind:this={tooltipElement} class="sidebar-tooltip" aria-hidden="true"></div>

<aside
	bind:this={sidebarElement}
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
	data-hydrated={hydrated ? 'true' : undefined}
	role={isMobileMode && drawerOpen ? 'dialog' : undefined}
	aria-modal={isMobileMode && drawerOpen ? 'true' : undefined}
	aria-hidden={isMobileMode && !drawerOpen ? 'true' : undefined}
	aria-label={isMobileMode && drawerOpen ? ctx.labels.navigation.mobileDrawer : undefined}
>
	{#if header}
		<div class="sidebar__header">
			{@render header()}
		</div>
	{/if}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="sidebar__body"
		bind:this={scrollContainer}
		ondragover={containerDragHandlers.ondragover}
		ondragleave={containerDragHandlers.ondragleave}
		ondrop={containerDragHandlers.ondrop}
	>
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

<!-- Custom drag preview container (always rendered when dragPreview is provided, so it exists before drag starts) -->
{#if draggable && dragPreview}
	<div
		bind:this={dragPreviewElement}
		class="sidebar-drag-preview"
		aria-hidden="true"
	>
		{#if draggedItemInfo && draggedItemRenderCtx}
			{@render dragPreview(draggedItemInfo.item, draggedItemRenderCtx)}
		{/if}
	</div>
{/if}
