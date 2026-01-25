<script lang="ts">
	import type { SidebarTriggerProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';

	let { class: className = '' }: SidebarTriggerProps = $props();

	const ctx = getSidebarContext();

	const isCollapsed = $derived(ctx.isCollapsed);

	function handleClick() {
		ctx.toggleCollapsed();
	}
</script>

<button
	type="button"
	class="sidebar-trigger {className}"
	class:sidebar-trigger--collapsed={isCollapsed}
	aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	aria-expanded={!isCollapsed}
	onclick={handleClick}
>
	<svg
		class="sidebar-trigger__icon"
		width="20"
		height="20"
		viewBox="0 0 20 20"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if isCollapsed}
			<!-- Chevron right (expand) -->
			<polyline points="7 4 13 10 7 16"></polyline>
		{:else}
			<!-- Chevron left (collapse) -->
			<polyline points="13 4 7 10 13 16"></polyline>
		{/if}
	</svg>
</button>
