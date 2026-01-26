<script lang="ts">
	import {
		Sidebar,
		reorderItems,
		type SidebarSchema,
		type SidebarRenderContext,
		type SidebarReorderEvent,
		type DropPosition,
		type SidebarSettings
	} from '$lib/index.js';
	import '$lib/styles/index.css';

	// =========================================================================
	// Custom Data Types (user's own format - no transformation needed!)
	// =========================================================================

	interface NavItem {
		type: 'page' | 'folder' | 'category';
		id: string;
		title: string;
		path?: string;
		emoji?: string;
		children?: NavItem[];
		color?: string;
		isDraft?: boolean;
		isNew?: boolean;
		count?: number;
	}

	// User's navigation data in their own format
	let navigation: NavItem[] = $state([
		{
			type: 'category',
			id: 'workspace',
			title: 'Workspace',
			color: 'blue',
			children: [
				{
					type: 'page',
					id: 'dashboard',
					title: 'Dashboard',
					path: '/examples/advanced',
					emoji: '📊'
				},
				{
					type: 'page',
					id: 'inbox',
					title: 'Inbox',
					path: '/examples/advanced/inbox',
					emoji: '📥',
					count: 12,
					isNew: true
				},
				{
					type: 'folder',
					id: 'projects',
					title: 'Projects',
					emoji: '📁',
					children: [
						{
							type: 'page',
							id: 'project-alpha',
							title: 'Project Alpha',
							path: '/examples/advanced/projects/alpha',
							emoji: '🚀',
							isDraft: true
						},
						{
							type: 'page',
							id: 'project-beta',
							title: 'Project Beta',
							path: '/examples/advanced/projects/beta',
							emoji: '🔬'
						},
						{
							type: 'folder',
							id: 'archived',
							title: 'Archived',
							emoji: '🗄️',
							children: [
								{
									type: 'page',
									id: 'old-project',
									title: 'Old Project',
									path: '/examples/advanced/projects/old',
									emoji: '📜'
								}
							]
						}
					]
				}
			]
		},
		{
			type: 'category',
			id: 'resources',
			title: 'Resources',
			color: 'green',
			children: [
				{
					type: 'page',
					id: 'docs',
					title: 'Documentation',
					path: '/docs',
					emoji: '📚'
				},
				{
					type: 'page',
					id: 'settings',
					title: 'Settings',
					path: '/examples/advanced/settings',
					emoji: '⚙️'
				}
			]
		}
	]);

	// =========================================================================
	// Schema - Maps custom types to sidebar structure
	// =========================================================================

	const schema: SidebarSchema<NavItem> = {
		getKind: (item) => {
			if (item.type === 'category') return 'section';
			if (item.type === 'folder') return 'group';
			return 'page';
		},
		getId: (item) => item.id,
		getLabel: (item) => item.title,
		getHref: (item) => item.path,
		getItems: (item) => item.children,
		getBadge: (item) => item.count,
		getTitle: (item) => item.title,
		getDefaultExpanded: (item) => item.type === 'folder' && item.id === 'projects',
		getMeta: (item) => ({
			emoji: item.emoji,
			color: item.color,
			isDraft: item.isDraft,
			isNew: item.isNew
		})
	};

	// =========================================================================
	// Edit Mode State
	// =========================================================================

	let editMode = $state(false);
	let animated = $state(true);
	let useCustomDropIndicator = $state(false);
	let useLongerTiming = $state(false);
	let useCustomLabels = $state(false);
	let preventReorderHome = $state(false);

	// Handle reorder using built-in DnD
	function handleReorder(event: SidebarReorderEvent<NavItem>) {
		navigation = reorderItems(navigation, event, {
			getId: (item) => item.id,
			getItems: (item) => item.children,
			setItems: (item, children) => ({ ...item, children })
		});
	}

	// Dynamic settings based on toggles
	const settings: SidebarSettings = $derived({
		persistCollapsed: false,
		dnd: useLongerTiming
			? {
					longPressDelay: 800, // Longer touch delay
					hoverExpandDelay: 1000, // Slower auto-expand
					autoScrollThreshold: 80, // Larger scroll zone
					autoScrollMaxSpeed: 8 // Slower scrolling
				}
			: undefined,
		labels: useCustomLabels
			? {
					navigation: {
						main: 'Custom Navigation',
						mobileDrawer: 'Custom Menu'
					},
					trigger: {
						expand: 'Open Sidebar',
						collapse: 'Close Sidebar',
						openMenu: 'Show Menu',
						closeMenu: 'Hide Menu'
					},
					group: {
						expand: 'Open',
						collapse: 'Close'
					},
					dnd: {
						draggableItem: 'Movable item',
						instructions:
							'Press Space to select. Use arrows to move. Press Enter to confirm, Escape to cancel.'
					}
				}
			: undefined,
		announcements: useCustomLabels
			? {
					pickedUp: 'Selected {label}. Arrow keys to move.',
					dropped: '{label} placed successfully.',
					cancelled: 'Cancelled. {label} back in place.'
				}
			: undefined
	});
</script>

<svelte:head>
	<title>Advanced Example - SvelteKit Sidebar</title>
</svelte:head>

<!-- Define the custom drop indicator snippet at page level (outside Sidebar) -->
{#snippet customDropIndicator(position: DropPosition, draggedLabel: string)}
	<div class="custom-drop-indicator">
		<span class="custom-drop-indicator__icon">↳</span>
		<span class="custom-drop-indicator__text">Drop "{draggedLabel}" {position}</span>
	</div>
{/snippet}

<div class="advanced-demo">
	<div class="demo-sidebar">
		<Sidebar
			data={navigation}
			{schema}
			{settings}
			draggable={editMode}
			onReorder={handleReorder}
			{animated}
			dropIndicator={useCustomDropIndicator ? customDropIndicator : undefined}
			events={{
				onBeforeReorder: preventReorderHome
					? (event) => {
							// Prevent moving the dashboard item
							const item = event.item as NavItem;
							if (item.id === 'dashboard') {
								alert('Dashboard cannot be moved when protection is enabled!');
								return false;
							}
						}
					: undefined
			}}
		>
			{#snippet dragPreview(item, ctx)}
				<div class="drag-preview">
					<span class="drag-preview__emoji">{ctx.meta.emoji}</span>
					<span class="drag-preview__label">{ctx.label}</span>
				</div>
			{/snippet}


			{#snippet header()}
				<div class="demo-header">
					<span class="demo-logo">🎨</span>
					<span class="demo-title">Custom Sidebar</span>
				</div>
				<div class="demo-toggles">
					<label class="edit-toggle">
						<input type="checkbox" bind:checked={editMode} />
						<span>Edit Mode</span>
					</label>
					{#if editMode}
						<label class="edit-toggle">
							<input type="checkbox" bind:checked={animated} />
							<span>Animated</span>
						</label>
						<label class="edit-toggle">
							<input type="checkbox" bind:checked={useCustomDropIndicator} />
							<span>Custom Indicator</span>
						</label>
						<label class="edit-toggle">
							<input type="checkbox" bind:checked={useLongerTiming} />
							<span>Longer Timing</span>
						</label>
						<label class="edit-toggle">
							<input type="checkbox" bind:checked={preventReorderHome} />
							<span>Protect Dashboard</span>
						</label>
					{/if}
					<label class="edit-toggle">
						<input type="checkbox" bind:checked={useCustomLabels} />
						<span>Custom Labels</span>
					</label>
				</div>
			{/snippet}

			{#snippet section(item, ctx, children)}
				<section
					class="custom-section"
					class:custom-section--collapsed={ctx.isCollapsed}
					class:custom-section--dragging={ctx.dnd.isDragging}
					style="--section-color: var(--color-{ctx.meta.color})"
					{...ctx.dnd.dropZoneProps}
				>
					{#if !ctx.isCollapsed}
					<div class="custom-section__header">
						{#if ctx.dnd.enabled}
							<span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
						{/if}
						<h3 class="custom-section__title">
							<span class="custom-section__color-dot"></span>
							{ctx.label}
						</h3>
					</div>
					{/if}
					{@render children()}
				</section>
			{/snippet}

			{#snippet group(item, ctx, children)}
				<li
					class="custom-group"
					class:custom-group--expanded={ctx.isExpanded}
					class:custom-group--dragging={ctx.dnd.isDragging}
					class:custom-group--preview={ctx.dnd.isPreview}
					class:custom-group--collapsed={ctx.isCollapsed}
					{...ctx.dnd.dropZoneProps}
				>
					<div class="custom-group__row">
						{#if ctx.dnd.enabled && !ctx.isCollapsed}
							<span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
						{/if}
						<button class="custom-group__trigger"
							data-tooltip={ctx.isCollapsed ? ctx.label : undefined}
							title={ctx.isCollapsed ? ctx.label : undefined} onclick={ctx.toggleExpanded}>
							<span class="custom-group__emoji">{ctx.meta.emoji}</span>
							{#if !ctx.isCollapsed}
								<span class="custom-group__label">{ctx.label}</span>
								<span class="custom-group__chevron">{ctx.isExpanded ? '▾' : '▸'}</span>
							{/if}
						</button>
					</div>
					{#if ctx.isExpanded}
						<div class="custom-group__content">
							{@render children()}
						</div>
					{/if}
				</li>
			{/snippet}

			{#snippet page(item, ctx)}
				<li
					class="custom-page"
					class:custom-page--active={ctx.isActive}
					class:custom-page--dragging={ctx.dnd.isDragging}
					class:custom-page--preview={ctx.dnd.isPreview}
					class:custom-page--collapsed={ctx.isCollapsed}
					{...ctx.dnd.dropZoneProps}
				>
					<div class="custom-page__row">
						{#if ctx.dnd.enabled && !ctx.isCollapsed}
							<span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
						{/if}
						<a href={ctx.href} class="custom-page__link"
							data-tooltip={ctx.isCollapsed ? ctx.label : undefined}
							title={ctx.isCollapsed ? ctx.label : undefined}
						>
							<span class="custom-page__emoji">{ctx.meta.emoji}</span>
							{#if !ctx.isCollapsed}
								<span class="custom-page__label">{ctx.label}</span>
								{#if ctx.meta.isDraft}
									<span class="custom-page__draft">Draft</span>
								{/if}
								{#if ctx.meta.isNew}
									<span class="custom-page__new">New</span>
								{/if}
								{#if ctx.badge}
									<span class="custom-page__badge">{ctx.badge}</span>
								{/if}
							{/if}
						</a>
					</div>
				</li>
			{/snippet}

			{#snippet footer()}
				<div class="demo-footer">
					<span>Schema Demo v1.0</span>
				</div>
			{/snippet}
		</Sidebar>
	</div>

	<main class="demo-content">
		<h1>Advanced Demo: Schema System</h1>

		<section class="demo-section">
			<h2>What This Demo Shows</h2>
			<ul>
				<li><strong>Custom Data Types</strong> - Navigation uses a custom <code>NavItem</code> interface</li>
				<li><strong>Schema Mapping</strong> - Schema maps <code>type: 'folder'</code> to <code>'group'</code></li>
				<li><strong>Custom Rendering</strong> - Snippets provide full control over appearance</li>
				<li><strong>Metadata Access</strong> - <code>ctx.meta</code> exposes custom fields like <code>emoji</code>, <code>isDraft</code></li>
				<li><strong>Edit Mode</strong> - Toggle shows drag handles on all items</li>
			</ul>
		</section>

		<section class="demo-section">
			<h2>Schema Definition</h2>
			<pre><code>{`const schema: SidebarSchema<NavItem> = {
  getKind: (item) => {
    if (item.type === 'category') return 'section';
    if (item.type === 'folder') return 'group';
    return 'page';
  },
  getId: (item) => item.id,
  getLabel: (item) => item.title,
  getHref: (item) => item.path,
  getItems: (item) => item.children,
  getMeta: (item) => ({
    emoji: item.emoji,
    color: item.color,
    isDraft: item.isDraft
  })
};`}</code></pre>
		</section>

		<section class="demo-section">
			<h2>Render Context</h2>
			<p>Each snippet receives <code>ctx: SidebarRenderContext&lt;T&gt;</code> with:</p>
			<pre><code>{`interface SidebarRenderContext<T> {
  id: string;           // From schema.getId()
  label: string;        // From schema.getLabel()
  href?: string;        // From schema.getHref()
  depth: number;        // Nesting level
  isActive: boolean;    // Matches current route
  isCollapsed: boolean; // Sidebar collapsed state
  isExpanded?: boolean; // Group expanded state
  meta: Record<...>;    // From schema.getMeta()
  original: T;          // Your original item
  toggleExpanded?: () => void;
}`}</code></pre>
		</section>

		<section class="demo-section">
			<h2>Usage Example</h2>
			<pre><code>{`<Sidebar data={navigation} {schema}>
  {#snippet page(item, ctx)}
    <li class:active={ctx.isActive}>
      <a href={ctx.href}>
        {ctx.meta.emoji} {ctx.label}
        {#if ctx.meta.isDraft}
          <span class="draft">Draft</span>
        {/if}
      </a>
    </li>
  {/snippet}
</Sidebar>`}</code></pre>
		</section>
	</main>
</div>

<style>
	.advanced-demo {
		display: flex;
		height: 100vh;
		margin: -2rem;
	}

	.demo-sidebar {
		flex-shrink: 0;
	}

	.demo-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
		background: #f8f9fa;
	}

	.demo-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.demo-logo {
		font-size: 24px;
	}

	.demo-title {
		font-size: 16px;
	}

	.demo-toggles {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.edit-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		cursor: pointer;
		padding: 4px 8px;
		background: #f0f0f0;
		border-radius: 4px;
	}

	.edit-toggle input {
		cursor: pointer;
	}

	/* Custom drop indicator styles */
	.custom-drop-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: linear-gradient(135deg, hsl(220 90% 96%), hsl(260 90% 96%));
		border: 2px dashed hsl(240 70% 60%);
		border-radius: 6px;
		color: hsl(240 70% 40%);
		font-size: 13px;
		font-weight: 500;
		margin: 2px 0;
	}

	.custom-drop-indicator__icon {
		font-size: 16px;
	}

	.custom-drop-indicator__text {
		flex: 1;
	}

	.demo-footer {
		font-size: 11px;
		color: #888;
		text-align: center;
	}

	/* Custom Section Styles */
	.custom-section {
		--color-blue: #3b82f6;
		--color-green: #22c55e;
		margin-bottom: 16px;
	}

	.custom-section--dragging {
		opacity: 0.4;
	}

	.custom-section__header {
		display: flex;
		align-items: center;
	}

	.custom-section__title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #666;
		padding: 8px 12px;
		margin: 0;
	}

	.custom-section__color-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--section-color, #888);
	}

	/* Custom Group Styles */
	.custom-group {
		list-style: none;
	}

	.custom-group__row {
		display: flex;
		align-items: center;
	}

	.custom-group--dragging {
		opacity: 0.4;
	}

	.custom-group__trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 8px 12px;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 14px;
		text-align: left;
		border-radius: 6px;
	}

	.custom-group__trigger:hover {
		background: #f0f0f0;
	}

	.custom-group__emoji {
		font-size: 16px;
	}

	.custom-group__label {
		flex: 1;
		font-weight: 500;
	}

	.custom-group__chevron {
		font-size: 10px;
		color: #888;
	}

	.custom-group__content {
		padding-left: 12px;
	}

	/* Custom Page Styles */
	.custom-page {
		list-style: none;
	}

	.custom-page__row {
		display: flex;
		align-items: center;
	}

	.custom-page--dragging {
		opacity: 0.4;
	}

	.custom-page--preview,
	.custom-group--preview {
		opacity: 0.5;
		pointer-events: none;
	}

	.custom-page__link {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 8px 12px;
		text-decoration: none;
		color: #333;
		border-radius: 6px;
		font-size: 14px;
	}

	.custom-page__link:hover {
		background: #f0f0f0;
	}

	.custom-page--active .custom-page__link {
		background: #e8f0fe;
		color: #1a73e8;
	}

	.custom-page__emoji {
		font-size: 16px;
	}

	.custom-page__label {
		flex: 1;
	}

	.custom-page__draft {
		font-size: 10px;
		padding: 2px 6px;
		background: #fef3c7;
		color: #92400e;
		border-radius: 4px;
		font-weight: 500;
	}

	.custom-page__new {
		font-size: 10px;
		padding: 2px 6px;
		background: #dcfce7;
		color: #166534;
		border-radius: 4px;
		font-weight: 500;
	}

	.custom-page__badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #ef4444;
		color: white;
		border-radius: 10px;
		font-weight: 600;
	}

	/* Drag Handle */
	.drag-handle {
		cursor: grab;
		color: #999;
		font-size: 12px;
		letter-spacing: -2px;
		padding-right: 4px;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	/* Drag Preview (follows cursor) */
	.drag-preview {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: white;
		border: 1px solid hsl(0 0% 85%);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-size: 14px;
	}

	.drag-preview__emoji {
		font-size: 16px;
	}

	.drag-preview__label {
		font-weight: 500;
		color: #333;
	}


	/* Collapsed Mode Styles */
	:global(.sidebar--collapsed) .demo-title,
	:global(.sidebar--collapsed) .edit-toggle,
	:global(.sidebar--collapsed) .demo-footer {
		display: none;
	}

	:global(.sidebar--collapsed) .demo-header {
		justify-content: center;
	}

	.custom-section--collapsed {
		margin-bottom: 8px;
	}

	.custom-group--collapsed .custom-group__row,
	.custom-page--collapsed .custom-page__row {
		justify-content: center;
	}

	.custom-group--collapsed .custom-group__trigger,
	.custom-page--collapsed .custom-page__link {
		justify-content: center;
		padding: 8px;
	}

	.custom-group--collapsed .custom-group__content {
		padding-left: 0;
	}

	/* Demo Content Styles */
	h1 {
		margin-top: 0;
		color: #333;
	}

	.demo-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.demo-section h2 {
		margin-top: 0;
		font-size: 18px;
		color: #333;
	}

	.demo-section ul {
		padding-left: 20px;
	}

	.demo-section li {
		margin-bottom: 8px;
	}

	.demo-section code {
		background: #f0f0f0;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 13px;
	}

	.demo-section pre {
		background: #1e1e1e;
		color: #d4d4d4;
		padding: 16px;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.5;
	}

	.demo-section pre code {
		background: none;
		padding: 0;
		color: inherit;
	}
</style>
