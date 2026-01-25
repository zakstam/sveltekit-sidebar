<svelte:head>
	<title>Getting Started - SvelteKit Sidebar</title>
</svelte:head>

<h1>Getting Started</h1>

<h2>Installation</h2>
<p>Install the package from GitHub:</p>
<pre><code>npm install github:username/sveltekit-sidebar</code></pre>

<h2>Basic Setup</h2>

<h3>1. Create your sidebar configuration</h3>
<p>Create a file to define your sidebar structure:</p>
<pre><code>{`// src/routes/sidebar-config.ts
import type { SidebarConfig } from 'sveltekit-sidebar';

export const config: SidebarConfig = {
  sections: [
    {
      kind: 'section',
      id: 'main',
      items: [
        { kind: 'page', id: 'home', label: 'Home', href: '/' }
      ]
    }
  ]
};`}</code></pre>

<h3>2. Add the Sidebar to your layout</h3>
<pre><code>{`<!-- src/routes/+layout.svelte -->
<script>
  import { Sidebar } from 'sveltekit-sidebar';
  import 'sveltekit-sidebar/styles';
  import { config } from './sidebar-config';

  let { children } = $props();
<\/script>

<div class="layout">
  <Sidebar {config} />
  <main>{@render children()}</main>
</div>

<style>
  .layout {
    display: flex;
    height: 100vh;
  }
  main {
    flex: 1;
    overflow-y: auto;
  }
</style>`}</code></pre>

<h2>Next Steps</h2>
<ul>
	<li>Explore the <a href="/docs/components/sidebar">Components documentation</a></li>
	<li>Learn about <a href="/docs/guides/theming">Theming</a></li>
	<li>Check out the <a href="/examples/basic">Examples</a></li>
</ul>

<style>
	pre {
		background: hsl(220 15% 15%);
		color: hsl(0 0% 90%);
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
	}

	code {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875em;
	}

	h2 {
		margin-top: 2rem;
	}

	h3 {
		margin-top: 1.5rem;
	}
</style>
