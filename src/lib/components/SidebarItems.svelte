<script lang="ts" generics="T">
	import type { SidebarItemsProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarPage from './SidebarPage.svelte';
	import SidebarGroup from './SidebarGroup.svelte';

	let { items, depth = 0 }: SidebarItemsProps<T> = $props();

	const ctx = getSidebarContext<T>();
</script>

<!--
	Recursive rendering of sidebar items using snippets.
	This enables infinite nesting of groups within groups.
-->
{#snippet renderItems(itemList: T[], currentDepth: number)}
	<ul class="sidebar-items" class:sidebar-items--nested={currentDepth > 0}>
		{#each itemList as item (ctx.getId(item))}
			{@const kind = ctx.getKind(item)}
			{#if kind === 'page'}
				<SidebarPage {item} depth={currentDepth} />
			{:else if kind === 'group'}
				<SidebarGroup {item} depth={currentDepth}>
					{#snippet children()}
						{@render renderItems(ctx.getItems(item), currentDepth + 1)}
					{/snippet}
				</SidebarGroup>
			{/if}
		{/each}
	</ul>
{/snippet}

{@render renderItems(items, depth)}
