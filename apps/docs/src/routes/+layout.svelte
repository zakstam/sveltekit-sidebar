<script lang="ts">
	import { Sidebar } from 'sveltekit-sidebar';
	import '$lib/sidebar-styles';
	import { sidebarConfig } from './sidebar-config.js';
	import { onDestroy, onMount } from 'svelte';

	let { children } = $props();
	let hydrated = $state(false);

	onMount(() => {
		hydrated = true;
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.hydrated = 'true';
		}
		return () => {
			delete document?.documentElement.dataset.hydrated;
		};
	});
</script>

<div class="layout" data-hydrated={hydrated ? 'true' : undefined}>
	<Sidebar
		config={sidebarConfig}
		events={{
			onModeChange: (mode) => console.log('Mode changed:', mode),
			onOpenChange: (open) => console.log('Drawer open:', open)
		}}
	>
		{#snippet header()}
			<div class="logo">
				<span class="logo__icon">📑</span>
				<span class="logo__text">SvelteKit Sidebar</span>
			</div>
		{/snippet}

		{#snippet footer()}
			<div class="footer-info">
				<span>v0.4.0</span>
			</div>
		{/snippet}
	</Sidebar>

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		font-family:
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
	}

	.layout {
		display: flex;
		height: 100vh;
	}

	.main {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		background: hsl(0 0% 98%);
	}

	/* On mobile, main takes full width since sidebar is an overlay */
	@media (max-width: 767px) {
		.main {
			padding-top: 4rem; /* Space for mobile trigger */
		}
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		font-size: 16px;
	}

	.logo__text {
		max-width: 200px;
		overflow: hidden;
		transition:
			opacity 200ms ease,
			max-width 200ms ease;
	}

	.logo__icon {
		font-size: 24px;
	}

	:global(.sidebar--collapsed) .logo__text {
		opacity: 0;
		max-width: 0;
	}

	.footer-info {
		font-size: 12px;
		color: hsl(0 0% 50%);
		text-align: center;
		max-height: 24px;
		overflow: hidden;
		transition:
			opacity 200ms ease,
			max-height 200ms ease;
	}

	:global(.sidebar--collapsed) .footer-info {
		opacity: 0;
		max-height: 0;
	}
</style>
