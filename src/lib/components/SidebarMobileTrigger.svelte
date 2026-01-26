<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getSidebarContext } from '../context.svelte.js';

	let {
		class: className = '',
		children
	}: {
		class?: string;
		children?: Snippet;
	} = $props();

	const ctx = getSidebarContext();

	const isOpen = $derived(ctx.drawerOpen);

	function handleClick() {
		ctx.toggleDrawer();
	}
</script>

<button
	type="button"
	class="sidebar-mobile-trigger {className}"
	aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
	aria-expanded={isOpen}
	aria-controls="sidebar-drawer"
	onclick={handleClick}
>
	{#if children}
		{@render children()}
	{:else}
		<svg
			class="sidebar-mobile-trigger__icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			{#if isOpen}
				<!-- X icon (close) -->
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			{:else}
				<!-- Hamburger icon (menu) -->
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			{/if}
		</svg>
	{/if}
</button>
