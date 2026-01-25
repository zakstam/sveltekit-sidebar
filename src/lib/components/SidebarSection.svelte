<script lang="ts">
	import type { SidebarSectionProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarItems from './SidebarItems.svelte';

	let { section, class: className = '' }: SidebarSectionProps = $props();

	const ctx = getSidebarContext();

	const isCollapsed = $derived(ctx.isCollapsed);
	const showTitle = $derived(section.title && !isCollapsed);
</script>

<section class="sidebar-section {className}">
	{#if showTitle}
		<h3 class="sidebar-section__title">{section.title}</h3>
	{/if}

	<SidebarItems items={section.items} depth={0} />
</section>
