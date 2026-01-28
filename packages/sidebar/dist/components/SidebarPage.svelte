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
	const showLabel = $derived(!isCollapsed);
	const showAvatar = $derived(isCollapsed && !renderCtx.icon);

	function handleClick(e: MouseEvent) {
		// Legacy compatibility: call handleNavigate if using built-in types
		if (ctx.config) {
			const page = item as unknown as SidebarPageData;
			// Check if navigation should be prevented
			if (ctx.events.onBeforeNavigate?.(page) === false) {
				e.preventDefault();
				return;
			}
			ctx.handleNavigate(page);
		}
	}
</script>

{#if ctx.snippets?.page}
	{@render ctx.snippets.page(item, renderCtx)}
{:else}
	<li
		class="sidebar-page"
		class:sidebar-page--dragging={renderCtx.dnd.isDragging}
		class:sidebar-page--keyboard-dragging={renderCtx.dnd.isKeyboardDragging}
		class:sidebar-page--pointer-dragging={renderCtx.dnd.isPointerDragging}
		class:sidebar-page--preview={renderCtx.dnd.isPreview}
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
			class:sidebar-page__link--collapsed={isCollapsed}
			aria-current={renderCtx.isActive ? 'page' : undefined}
			aria-disabled={renderCtx.isDisabled}
			target={renderCtx.isExternal ? '_blank' : undefined}
			rel={renderCtx.isExternal ? 'noopener noreferrer' : undefined}
			onclick={handleClick}
		>
			{#if renderCtx.icon}
				<SidebarIcon icon={renderCtx.icon} class="sidebar-page__icon" />
			{:else if showAvatar}
				<span class="sidebar-avatar">{renderCtx.label.charAt(0)}</span>
			{/if}

			{#if showLabel}
				<span class="sidebar-page__label">{renderCtx.label}</span>
			{/if}

			{#if renderCtx.badge !== undefined && showLabel}
				<span class="sidebar-page__badge">{renderCtx.badge}</span>
			{/if}

			{#if renderCtx.isExternal && showLabel}
				<span class="sidebar-page__external" aria-label={ctx.labels.link.external}>↗</span>
			{/if}
		</a>
	</li>
{/if}
