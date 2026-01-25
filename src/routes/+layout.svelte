<script lang="ts">
	import { Sidebar } from '$lib/index.js';
	import '$lib/styles/index.css';
	import { sidebarConfig } from './sidebar-config.js';

	let { children } = $props();
</script>

<div class="layout">
	<Sidebar config={sidebarConfig}>
		{#snippet header()}
			<div class="logo">
				<span class="logo__icon">📑</span>
				<span class="logo__text">SvelteKit Sidebar</span>
			</div>
		{/snippet}

		{#snippet footer()}
			<div class="footer-info">
				<span>v0.1.0</span>
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

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		font-size: 16px;
	}

	.logo__icon {
		font-size: 24px;
	}

	:global(.sidebar--collapsed) .logo__text {
		display: none;
	}

	.footer-info {
		font-size: 12px;
		color: hsl(0 0% 50%);
		text-align: center;
	}

	:global(.sidebar--collapsed) .footer-info {
		display: none;
	}
</style>
