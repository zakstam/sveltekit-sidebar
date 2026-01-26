<script lang="ts" generics="T">
	import type { SidebarItemsProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarPage from './SidebarPage.svelte';
	import SidebarGroup from './SidebarGroup.svelte';

	let { items, depth = 0, parentId = null }: SidebarItemsProps<T> = $props();

	const ctx = getSidebarContext<T>();
</script>

<!--
	Recursive rendering of sidebar items using snippets.
	This enables infinite nesting of groups within groups.
	Uses preview-reordered items during drag for live feedback.
-->
{#snippet renderItems(itemList: T[], currentDepth: number, currentParentId: string | null)}
	{@const previewList = ctx.getItemsWithPreview(itemList, currentParentId)}
	<ul
		class="sidebar-items"
		class:sidebar-items--nested={currentDepth > 0}
	>
		{#each previewList as item, index (ctx.getId(item))}
			{@const kind = ctx.getKind(item)}
			{#if kind === 'page'}
				<SidebarPage
					{item}
					depth={currentDepth}
					parentId={currentParentId}
					{index}
				/>
			{:else if kind === 'group'}
				<SidebarGroup
					{item}
					depth={currentDepth}
					parentId={currentParentId}
					{index}
				>
					{#snippet children()}
						{@render renderItems(ctx.getItems(item), currentDepth + 1, ctx.getId(item))}
					{/snippet}
				</SidebarGroup>
			{/if}
		{/each}
	</ul>
{/snippet}

{@render renderItems(items, depth, parentId)}
