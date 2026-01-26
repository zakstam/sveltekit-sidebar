<script lang="ts">
	import type { SidebarContentProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarSection from './SidebarSection.svelte';

	let { class: className = '' }: SidebarContentProps = $props();

	const ctx = getSidebarContext();
</script>

<nav class="sidebar-content {className}" aria-label={ctx.labels.navigation.main}>
	{#each ctx.data as section, index (ctx.getId(section))}
		<SidebarSection {section} {index} />
	{/each}
</nav>
