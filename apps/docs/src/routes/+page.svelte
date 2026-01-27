<script lang="ts">
	import { getSidebarContext } from 'sveltekit-sidebar';

	const ctx = getSidebarContext();
</script>

<svelte:head>
	<title>SvelteKit Sidebar - Home</title>
</svelte:head>

<div class="home">
	<h1>SvelteKit Sidebar</h1>
	<p class="subtitle">A type-safe, infinitely nestable sidebar component library for SvelteKit</p>

	<section class="features">
		<h2>Features</h2>
		<ul>
			<li><strong>Type-safe</strong> - Full TypeScript support with discriminated unions</li>
			<li><strong>Infinitely nestable</strong> - Groups can contain other groups, to any depth</li>
			<li><strong>Collapsible</strong> - Sidebar and groups can be expanded/collapsed</li>
			<li><strong>Persistent state</strong> - Remembers collapsed/expanded state via localStorage</li>
			<li><strong>Flexible icons</strong> - Supports Components, strings, or Snippets</li>
			<li><strong>Customizable</strong> - CSS custom properties for easy theming</li>
			<li><strong>Accessible</strong> - Proper ARIA attributes and keyboard navigation</li>
		</ul>
	</section>

	<section class="demo-controls">
		<h2>Demo Controls</h2>
		<p>Current state:</p>
		<ul>
			<li>Sidebar collapsed: <code>{ctx.isCollapsed}</code></li>
			<li>Sidebar width: <code>{ctx.width}</code></li>
		</ul>
		<button onclick={() => ctx.toggleCollapsed()}>
			{ctx.isCollapsed ? 'Expand' : 'Collapse'} Sidebar
		</button>
	</section>

	<section class="installation">
		<h2>Installation</h2>
		<pre><code>npm install github:username/sveltekit-sidebar</code></pre>
	</section>

	<section class="quick-start">
		<h2>Quick Start</h2>
		<pre><code>{`// sidebar-config.ts
  import type { SidebarConfig } from 'sveltekit-sidebar';

export const config: SidebarConfig = {
  sections: [
    {
      kind: 'section',
      id: 'main',
      title: 'Navigation',
      items: [
        { kind: 'page', id: 'home', label: 'Home', href: '/' },
        {
          kind: 'group',
          id: 'docs',
          label: 'Documentation',
          items: [
            { kind: 'page', id: 'intro', label: 'Introduction', href: '/docs' }
          ]
        }
      ]
    }
  ]
};`}</code></pre>

		<pre><code>{`<!-- +layout.svelte -->
<script>
  import { Sidebar } from 'sveltekit-sidebar';
  import '$lib/sidebar-styles';
  import { config } from './sidebar-config';
<\/script>

<div class="layout">
  <Sidebar {config} />
  <main>{@render children()}</main>
</div>`}</code></pre>
	</section>
</div>

<style>
	.home {
		max-width: 800px;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2.5rem;
	}

	.subtitle {
		margin: 0 0 2rem;
		font-size: 1.25rem;
		color: hsl(0 0% 40%);
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.5rem;
		margin: 0 0 1rem;
		border-bottom: 1px solid hsl(0 0% 90%);
		padding-bottom: 0.5rem;
	}

	ul {
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	code {
		background: hsl(0 0% 92%);
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 0.875em;
	}

	pre {
		background: hsl(220 15% 15%);
		color: hsl(0 0% 90%);
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
	}

	pre code {
		background: none;
		padding: 0;
		color: inherit;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border: 1px solid hsl(220 90% 50%);
		background: hsl(220 90% 50%);
		color: white;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background: hsl(220 90% 45%);
	}

	.demo-controls ul {
		list-style: none;
		padding-left: 0;
	}
</style>
