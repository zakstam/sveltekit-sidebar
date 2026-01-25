<script lang="ts">
	import type { SidebarPageProps } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarIcon from './SidebarIcon.svelte';

	let { item, depth = 0, class: className = '' }: SidebarPageProps = $props();

	const ctx = getSidebarContext();

	const isActive = $derived(ctx.activeHref === item.href);
	const isCollapsed = $derived(ctx.isCollapsed);
	const showLabel = $derived(!isCollapsed || depth > 0);

	function handleClick() {
		ctx.handleNavigate(item);
	}
</script>

<li class="sidebar-page" style="--depth: {depth}">
	<a
		href={item.href}
		class="sidebar-page__link {className}"
		class:sidebar-page__link--active={isActive}
		class:sidebar-page__link--disabled={item.disabled}
		class:sidebar-page__link--collapsed={isCollapsed && depth === 0}
		aria-current={isActive ? 'page' : undefined}
		aria-disabled={item.disabled}
		target={item.external ? '_blank' : undefined}
		rel={item.external ? 'noopener noreferrer' : undefined}
		onclick={handleClick}
	>
		{#if item.icon}
			<SidebarIcon icon={item.icon} class="sidebar-page__icon" />
		{/if}

		{#if showLabel}
			<span class="sidebar-page__label">{item.label}</span>
		{/if}

		{#if item.badge !== undefined && showLabel}
			<span class="sidebar-page__badge">{item.badge}</span>
		{/if}

		{#if item.external && showLabel}
			<span class="sidebar-page__external" aria-label="Opens in new tab">↗</span>
		{/if}
	</a>
</li>
