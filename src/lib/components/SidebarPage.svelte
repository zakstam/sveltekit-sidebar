<script lang="ts" generics="T">
	import type { SidebarPageProps, SidebarPage as SidebarPageData } from '../types.js';
	import { getSidebarContext } from '../context.svelte.js';
	import SidebarIcon from './SidebarIcon.svelte';

	let {
		item,
		depth = 0,
		class: className = '',
		parentId = null,
		index = 0
	}: SidebarPageProps<T> = $props();

	const ctx = getSidebarContext<T>();

	// Create render context for snippet or default rendering
	const renderCtx = $derived(ctx.createRenderContext(item, depth, parentId, index));

	// Derived values for default rendering
	const isCollapsed = $derived(ctx.isCollapsed);
	const showLabel = $derived(!isCollapsed || depth > 0);

	function handleClick() {
		// Legacy compatibility: call handleNavigate if using built-in types
		if (ctx.config) {
			ctx.handleNavigate(item as unknown as SidebarPageData);
		}
	}
</script>

{#if ctx.snippets?.page}
	{@render ctx.snippets.page(item, renderCtx)}
{:else}
	<li
		class="sidebar-page"
		class:sidebar-page--dragging={renderCtx.dnd.isDragging}
		class:sidebar-page--drop-target={renderCtx.dnd.isDropTarget}
		style="--depth: {depth}"
		{...renderCtx.dnd.dropZoneProps}
	>
		{#if renderCtx.dnd.enabled}
			<span class="sidebar-page__drag-handle" {...renderCtx.dnd.handleProps}>⋮⋮</span>
		{/if}
		<a
			href={renderCtx.href}
			class="sidebar-page__link {className}"
			class:sidebar-page__link--active={renderCtx.isActive}
			class:sidebar-page__link--disabled={renderCtx.isDisabled}
			class:sidebar-page__link--collapsed={isCollapsed && depth === 0}
			aria-current={renderCtx.isActive ? 'page' : undefined}
			aria-disabled={renderCtx.isDisabled}
			target={renderCtx.isExternal ? '_blank' : undefined}
			rel={renderCtx.isExternal ? 'noopener noreferrer' : undefined}
			onclick={handleClick}
		>
			{#if renderCtx.icon}
				<SidebarIcon icon={renderCtx.icon} class="sidebar-page__icon" />
			{/if}

			{#if showLabel}
				<span class="sidebar-page__label">{renderCtx.label}</span>
			{/if}

			{#if renderCtx.badge !== undefined && showLabel}
				<span class="sidebar-page__badge">{renderCtx.badge}</span>
			{/if}

			{#if renderCtx.isExternal && showLabel}
				<span class="sidebar-page__external" aria-label="Opens in new tab">↗</span>
			{/if}
		</a>
	</li>
{/if}
