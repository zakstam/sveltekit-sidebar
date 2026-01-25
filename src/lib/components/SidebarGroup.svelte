<script lang="ts">
	import type { SidebarGroupProps } from '../types.js';
	import type { Snippet } from 'svelte';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarIcon from './SidebarIcon.svelte';

	let {
		item,
		depth = 0,
		class: className = '',
		children
	}: SidebarGroupProps & { children?: Snippet } = $props();

	const ctx = getSidebarContext();

	const isExpanded = $derived(ctx.isGroupExpanded(item.id));
	const isCollapsed = $derived(ctx.isCollapsed);
	const isCollapsible = $derived(item.collapsible !== false);
	const showLabel = $derived(!isCollapsed || depth > 0);
	const hasHref = $derived(!!item.href);
	const isActive = $derived(hasHref && ctx.activeHref === item.href);

	function handleToggle() {
		if (isCollapsible) {
			ctx.toggleGroup(item.id);
		}
	}

	function handleClick() {
		// Always expand when clicking a group with href
		if (hasHref && isCollapsible && !isExpanded) {
			ctx.setGroupExpanded(item.id, true);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleToggle();
		}
	}
</script>

<li class="sidebar-group" style="--depth: {depth}">
	{#if hasHref}
		<a
			href={item.href}
			class="sidebar-group__trigger {className}"
			class:sidebar-group__trigger--expanded={isExpanded}
			class:sidebar-group__trigger--collapsed={isCollapsed && depth === 0}
			class:sidebar-group__trigger--active={isActive}
			aria-expanded={isCollapsible ? isExpanded : undefined}
			aria-current={isActive ? 'page' : undefined}
			target={item.external ? '_blank' : undefined}
			rel={item.external ? 'noopener noreferrer' : undefined}
			onclick={handleClick}
		>
			{#if item.icon}
				<SidebarIcon icon={item.icon} class="sidebar-group__icon" />
			{/if}

			{#if showLabel}
				<span class="sidebar-group__label">{item.label}</span>
			{/if}

			{#if item.badge !== undefined && showLabel}
				<span class="sidebar-group__badge">{item.badge}</span>
			{/if}

			{#if isCollapsible && showLabel}
				<button
					type="button"
					class="sidebar-group__chevron-btn"
					class:sidebar-group__chevron--expanded={isExpanded}
					aria-label={isExpanded ? 'Collapse' : 'Expand'}
					onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="6 4 10 8 6 12"></polyline>
					</svg>
				</button>
			{/if}
		</a>
	{:else}
		<button
			type="button"
			class="sidebar-group__trigger {className}"
			class:sidebar-group__trigger--expanded={isExpanded}
			class:sidebar-group__trigger--collapsed={isCollapsed && depth === 0}
			class:sidebar-group__trigger--non-collapsible={!isCollapsible}
			aria-expanded={isCollapsible ? isExpanded : undefined}
			onclick={handleToggle}
			onkeydown={handleKeydown}
			disabled={!isCollapsible}
		>
			{#if item.icon}
				<SidebarIcon icon={item.icon} class="sidebar-group__icon" />
			{/if}

			{#if showLabel}
				<span class="sidebar-group__label">{item.label}</span>
			{/if}

			{#if item.badge !== undefined && showLabel}
				<span class="sidebar-group__badge">{item.badge}</span>
			{/if}

			{#if isCollapsible && showLabel}
				<span class="sidebar-group__chevron" class:sidebar-group__chevron--expanded={isExpanded}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="6 4 10 8 6 12"></polyline>
					</svg>
				</span>
			{/if}
		</button>
	{/if}

	{#if isExpanded || !isCollapsible}
		<div class="sidebar-group__content" class:sidebar-group__content--hidden={!isExpanded && isCollapsible}>
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</li>
