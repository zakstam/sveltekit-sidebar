<script lang="ts">
	import type { SidebarTriggerProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';

	let { class: className = '' }: SidebarTriggerProps = $props();

	const ctx = getSidebarContext();

	const isCollapsed = $derived(ctx.isCollapsed);
	const isMobileMode = $derived(ctx.responsiveMode === 'mobile');
	const drawerOpen = $derived(ctx.drawerOpen);

	function handleClick() {
		if (isMobileMode) {
			ctx.closeDrawer();
		} else {
			ctx.toggleCollapsed();
		}
	}

	// Determine aria-label based on mode
	const ariaLabel = $derived(
		isMobileMode
			? 'Close navigation menu'
			: isCollapsed
				? 'Expand sidebar'
				: 'Collapse sidebar'
	);
</script>

<button
	type="button"
	class="sidebar-trigger {className}"
	class:sidebar-trigger--collapsed={isCollapsed}
	class:sidebar-trigger--mobile={isMobileMode}
	aria-label={ariaLabel}
	aria-expanded={isMobileMode ? drawerOpen : !isCollapsed}
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
		aria-hidden="true"
	>
		{#if isMobileMode}
			<!-- X icon (close drawer) -->
			<line x1="15" y1="5" x2="5" y2="15"></line>
			<line x1="5" y1="5" x2="15" y2="15"></line>
		{:else if isCollapsed}
			<!-- Chevron right (expand) -->
			<polyline points="7 4 13 10 7 16"></polyline>
		{:else}
			<!-- Chevron left (collapse) -->
			<polyline points="13 4 7 10 13 16"></polyline>
		{/if}
	</svg>
</button>
