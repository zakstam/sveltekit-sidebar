<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
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

		// Drag and drop
		draggable = false,
		onReorder
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

		// Drag and drop
		draggable?: boolean;
		onReorder?: (event: SidebarReorderEvent<T>) => void;
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
	});

	// Track previous draggable state to detect changes
	let prevDraggable = false;

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

<aside
	class="sidebar {className}"
	class:sidebar--collapsed={ctx.isCollapsed}
	style={cssVars}
	data-collapsed={ctx.isCollapsed}
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

	<div class="sidebar__trigger-container">
		<SidebarTrigger />
	</div>
</aside>
