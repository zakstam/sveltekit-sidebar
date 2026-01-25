<script lang="ts" generics="T">
	import type { SidebarSectionProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarItems from './SidebarItems.svelte';

	let { section, class: className = '' }: SidebarSectionProps<T> = $props();

	const ctx = getSidebarContext<T>();

	const isCollapsed = $derived(ctx.isCollapsed);
	const title = $derived(ctx.getTitle(section));
	const showTitle = $derived(title && !isCollapsed);
	const items = $derived(ctx.getItems(section));
	const renderCtx = $derived(ctx.createRenderContext(section, 0));
</script>

{#snippet childrenSnippet()}
	<SidebarItems {items} depth={0} />
{/snippet}

{#if ctx.snippets?.section}
	{@render ctx.snippets.section(section, renderCtx, childrenSnippet)}
{:else}
	<section class="sidebar-section {className}">
		{#if showTitle}
			<h3 class="sidebar-section__title">{title}</h3>
		{/if}

		<SidebarItems {items} depth={0} />
	</section>
{/if}
