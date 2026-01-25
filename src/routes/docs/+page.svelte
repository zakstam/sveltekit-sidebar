<svelte:head>
	<title>Documentation - SvelteKit Sidebar</title>
</svelte:head>

<h1>Documentation</h1>
<p>Welcome to the SvelteKit Sidebar documentation. Use the sidebar to navigate through the different sections.</p>

<h2>Overview</h2>
<p>
	SvelteKit Sidebar is a type-safe, infinitely nestable sidebar component library built specifically for SvelteKit applications.
	It leverages Svelte 5's new features including runes and snippets for optimal performance and developer experience.
</p>

<h2>Key Concepts</h2>

<h3>Discriminated Unions</h3>
<p>
	The library uses TypeScript discriminated unions for type safety. Each item type has a <code>kind</code> property that
	determines its type:
</p>
<ul>
	<li><code>kind: 'section'</code> - Top-level sections</li>
	<li><code>kind: 'page'</code> - Navigation links</li>
	<li><code>kind: 'group'</code> - Collapsible groups that can contain pages or other groups</li>
</ul>

<h3>Infinite Nesting</h3>
<p>
	Groups can contain other groups, allowing for infinite nesting depth. The recursive type definition ensures type safety
	at all levels.
</p>

<h3>State Management</h3>
<p>
	The sidebar state is managed through Svelte's context API with Svelte 5 runes. State can optionally be persisted to
	localStorage.
</p>
