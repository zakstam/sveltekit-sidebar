<script lang="ts" generics="T">
	import type { SidebarItemsProps } from "../types.js";
	import { getSidebarContext } from "../context.svelte.js";
	import SidebarPage from "./SidebarPage.svelte";
	import SidebarGroup from "./SidebarGroup.svelte";

	let { items, depth = 0, parentId = null }: SidebarItemsProps<T> = $props();

	const ctx = getSidebarContext<T>();
</script>

<!--
	Recursive rendering of sidebar items using snippets.
	This enables infinite nesting of groups within groups.
	Uses preview-reordered items during drag for live feedback.
-->
{#snippet renderItems(
	itemList: T[],
	currentDepth: number,
	currentParentId: string | null,
	ancestorIds: Set<string>,
)}
	{@const previewList = ctx.getItemsWithPreview(itemList, currentParentId)}
	<ul class="sidebar-items" class:sidebar-items--nested={currentDepth > 0}>
		{#each previewList as item, index (ctx.getId(item))}
			{@const id = ctx.getId(item)}

			<!-- Cycle detection: prevent rendering if we've seen this ID in the current ancestry -->
			{#if !ancestorIds.has(id)}
				{@const kind = ctx.getKind(item)}
				{@const isPreview = ctx.isPreviewItem(id)}
				{@const dropIndicator = ctx.snippets?.dropIndicator}
				{@const draggedLabel = ctx.draggedItem
					? ctx.getLabel(ctx.draggedItem.item)
					: ""}

				<!-- Create a new set for children to include current ID -->
				{@const nextAncestorIds = new Set(ancestorIds).add(id)}

				{#if isPreview && dropIndicator}
					<!-- Custom drop indicator instead of faded preview -->
					<li class="sidebar-drop-indicator-wrapper">
						{@render dropIndicator(
							ctx.dropPosition ?? "before",
							draggedLabel,
						)}
					</li>
				{:else if kind === "page"}
					<SidebarPage
						{item}
						depth={currentDepth}
						parentId={currentParentId}
						{index}
					/>
				{:else if kind === "group"}
					<SidebarGroup
						{item}
						depth={currentDepth}
						parentId={currentParentId}
						{index}
					>
						{#snippet children()}
							{@render renderItems(
								ctx.getItems(item),
								currentDepth + 1,
								id,
								nextAncestorIds,
							)}
						{/snippet}
					</SidebarGroup>
				{/if}
			{/if}
		{/each}
	</ul>
{/snippet}

{@render renderItems(items, depth, parentId, new Set())}
