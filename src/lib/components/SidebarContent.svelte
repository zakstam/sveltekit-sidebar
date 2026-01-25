<script lang="ts">
	import type { SidebarContentProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarSection from './SidebarSection.svelte';

	let { class: className = '' }: SidebarContentProps = $props();

	const ctx = getSidebarContext();
</script>

<nav class="sidebar-content {className}" aria-label="Sidebar navigation">
	{#each ctx.config.sections as section (section.id)}
		<SidebarSection {section} />
	{/each}
</nav>
