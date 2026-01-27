<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.url.pathname}</title>
</svelte:head>

<div class="placeholder">
	<h1>Page: {$page.url.pathname}</h1>
	<p>This is a placeholder page for testing sidebar navigation.</p>
</div>

<style>
	.placeholder {
		max-width: 600px;
	}

	h1 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		color: hsl(0 0% 30%);
	}

	p {
		color: hsl(0 0% 50%);
	}
</style>
