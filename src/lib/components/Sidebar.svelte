<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import type { SidebarProps } from '../types.js';
	import { createSidebarContext } from '../context.svelte.js';
	import SidebarContent from './SidebarContent.svelte';
	import SidebarTrigger from './SidebarTrigger.svelte';

	let {
		config,
		events = {},
		class: className = '',
		header,
		footer,
		children
	}: SidebarProps & {
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	} = $props();

	// Create and provide context
	const ctx = createSidebarContext(config, events);

	// Single $page subscription - sync pathname to context
	$effect(() => {
		ctx.setActiveHref($page.url.pathname);
	});

	// Derived CSS custom properties
	const cssVars = $derived(
		`--sidebar-width: ${ctx.width}; --sidebar-animation-duration: ${ctx.settings.animationDuration}ms;`
	);
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

	<div class="sidebar__body">
		{#if children}
			{@render children()}
		{:else}
			<SidebarContent />
		{/if}
	</div>

	{#if footer}
		<div class="sidebar__footer">
			{@render footer()}
		</div>
	{/if}

	<div class="sidebar__trigger-container">
		<SidebarTrigger />
	</div>
</aside>
