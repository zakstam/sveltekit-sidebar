<script lang="ts">
	import { getSidebarContext } from '../context.svelte.js';

	let { class: className = '' }: { class?: string } = $props();

	const ctx = getSidebarContext();

	const isVisible = $derived(ctx.responsiveMode === 'mobile' && ctx.drawerOpen);

	function handleClick() {
		ctx.closeDrawer();
	}
</script>

<div
	class="sidebar-backdrop {className}"
	class:sidebar-backdrop--visible={isVisible}
	role="presentation"
	aria-hidden={!isVisible}
	onclick={handleClick}
></div>
