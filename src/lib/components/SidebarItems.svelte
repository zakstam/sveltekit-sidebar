<script lang="ts">
	import type { SidebarItemsProps, SidebarItem } from '../types.js';
	import { isPage, isGroup } from '../types.js';
	import SidebarPage from './SidebarPage.svelte';
	import SidebarGroup from './SidebarGroup.svelte';

	let { items, depth = 0 }: SidebarItemsProps = $props();
</script>

<!--
	Recursive rendering of sidebar items using snippets.
	This enables infinite nesting of groups within groups.
-->
{#snippet renderItems(itemList: SidebarItem[], currentDepth: number)}
	<ul class="sidebar-items" class:sidebar-items--nested={currentDepth > 0}>
		{#each itemList as item (item.id)}
			{#if isPage(item)}
				<SidebarPage {item} depth={currentDepth} />
			{:else if isGroup(item)}
				<SidebarGroup {item} depth={currentDepth}>
					{#snippet children()}
						{@render renderItems(item.items, currentDepth + 1)}
					{/snippet}
				</SidebarGroup>
			{/if}
		{/each}
	</ul>
{/snippet}

{@render renderItems(items, depth)}
