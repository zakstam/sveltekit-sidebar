<script lang="ts">
	import type { SidebarContentProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarSection from './SidebarSection.svelte';
	import SidebarPage from './SidebarPage.svelte';
	import SidebarGroup from './SidebarGroup.svelte';
	import SidebarItems from './SidebarItems.svelte';

	let { class: className = '' }: SidebarContentProps = $props();

	const ctx = getSidebarContext();

	// Get root items with live preview support for DnD
	const rootItems = $derived(ctx.getItemsWithPreview(ctx.data, null));
	const dropIndicator = $derived(ctx.snippets?.dropIndicator);
	const draggedLabel = $derived(ctx.draggedItem ? ctx.getLabel(ctx.draggedItem.item) : '');
</script>

<nav class="sidebar-content {className}" aria-label={ctx.labels.navigation.main}>
	{#each rootItems as item, index (ctx.getId(item))}
		{@const kind = ctx.getKind(item)}
		{@const isPreview = ctx.isPreviewItem(ctx.getId(item))}
		{#if isPreview && dropIndicator}
			<!-- Custom drop indicator instead of faded preview -->
			<div class="sidebar-drop-indicator-wrapper">
				{@render dropIndicator(ctx.dropPosition ?? 'before', draggedLabel)}
			</div>
		{:else if kind === 'section'}
			<SidebarSection section={item} {index} />
		{:else if kind === 'page'}
			<ul class="sidebar-items sidebar-items--root">
				<SidebarPage {item} depth={0} parentId={null} {index} />
			</ul>
		{:else if kind === 'group'}
			<ul class="sidebar-items sidebar-items--root">
				<SidebarGroup {item} depth={0} parentId={null} {index}>
					{#snippet children()}
						<SidebarItems items={ctx.getItems(item)} depth={1} parentId={ctx.getId(item)} />
					{/snippet}
				</SidebarGroup>
			</ul>
		{/if}
	{/each}
</nav>
