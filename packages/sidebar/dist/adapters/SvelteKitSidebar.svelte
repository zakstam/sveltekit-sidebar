<script lang="ts" generics="T">
	import { page } from '$app/stores';
	import Sidebar from '../components/Sidebar.svelte';
	import type { SidebarProps } from '../types.js';

	let { activeHref, ...rest }: SidebarProps<T> = $props();
	const resolvedActiveHref = $derived(activeHref ?? $page.url.pathname);
</script>

<Sidebar {...rest} activeHref={resolvedActiveHref} />
