# SvelteKit Sidebar

A type-safe, infinitely nestable sidebar component library for SvelteKit.

## Features

- **Type-safe** - Full TypeScript support with discriminated unions
- **Infinitely nestable** - Groups can contain other groups, to any depth
- **Collapsible** - Sidebar and groups can be expanded/collapsed
- **Navigable groups** - Groups can optionally have their own href
- **Persistent state** - Remembers collapsed/expanded state via localStorage
- **Flexible icons** - Supports Svelte Components, strings, or Snippets
- **Customizable** - CSS custom properties for easy theming
- **Accessible** - Proper ARIA attributes and keyboard navigation
- **Optimized** - Single `$page` subscription, minimal re-renders

## Requirements

- Svelte 5
- SvelteKit 2

## Installation

```bash
npm install github:zakstam/sveltekit-sidebar
```

## Quick Start

### 1. Create your sidebar configuration

```typescript
// src/lib/sidebar-config.ts
import type { SidebarConfig } from 'sveltekit-sidebar';

export const sidebarConfig: SidebarConfig = {
  sections: [
    {
      kind: 'section',
      id: 'main',
      title: 'Navigation',
      items: [
        { kind: 'page', id: 'home', label: 'Home', href: '/', icon: '🏠' },
        {
          kind: 'group',
          id: 'docs',
          label: 'Documentation',
          href: '/docs', // Optional: makes the group itself a link
          defaultExpanded: true,
          items: [
            { kind: 'page', id: 'intro', label: 'Introduction', href: '/docs/intro' },
            { kind: 'page', id: 'api', label: 'API Reference', href: '/docs/api' }
          ]
        }
      ]
    }
  ]
};
```

### 2. Add the Sidebar to your layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { Sidebar } from 'sveltekit-sidebar';
  import 'sveltekit-sidebar/styles';
  import { sidebarConfig } from '$lib/sidebar-config';

  let { children } = $props();
</script>

<div class="layout">
  <Sidebar config={sidebarConfig} />
  <main>{@render children()}</main>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  .layout {
    display: flex;
    height: 100vh;
  }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }
</style>
```

## Custom Header & Footer

```svelte
<Sidebar config={sidebarConfig}>
  {#snippet header()}
    <div class="logo">My App</div>
  {/snippet}

  {#snippet footer()}
    <div class="version">v1.0.0</div>
  {/snippet}
</Sidebar>
```

## Event Callbacks

```svelte
<Sidebar
  config={sidebarConfig}
  events={{
    onNavigate: (page) => {
      console.log('Navigated to', page.href);
    },
    onCollapsedChange: (collapsed) => {
      console.log('Sidebar collapsed:', collapsed);
    },
    onGroupToggle: (groupId, expanded) => {
      console.log('Group', groupId, 'expanded:', expanded);
    }
  }}
/>
```

## Type System

The library uses TypeScript discriminated unions for type safety:

```typescript
type SidebarItem = SidebarPage | SidebarGroup;

interface SidebarPage {
  kind: 'page';
  id: string;
  label: string;
  href: string;
  icon?: SidebarIcon;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

interface SidebarGroup {
  kind: 'group';
  id: string;
  label: string;
  items: SidebarItem[];  // Recursive - enables infinite nesting
  href?: string;         // Optional - makes group navigable
  icon?: SidebarIcon;
  badge?: string | number;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  external?: boolean;
}

interface SidebarSection {
  kind: 'section';
  id: string;
  title?: string;
  items: SidebarItem[];
}
```

## Navigable Groups

Groups can have an optional `href` that makes them both a navigation link and an expandable container:

```typescript
{
  kind: 'group',
  id: 'components',
  label: 'Components',
  href: '/docs/components',  // Clicking navigates here AND expands
  items: [
    { kind: 'page', id: 'button', label: 'Button', href: '/docs/components/button' },
    { kind: 'page', id: 'input', label: 'Input', href: '/docs/components/input' }
  ]
}
```

- Click the group label → navigates to the href AND expands the group
- Click the chevron → only toggles expand/collapse

## Settings

```typescript
const config: SidebarConfig = {
  sections: [...],
  settings: {
    widthExpanded: '280px',      // Default: 280px
    widthCollapsed: '64px',      // Default: 64px
    animationDuration: 200,      // Default: 200ms
    persistCollapsed: true,      // Save collapsed state to localStorage
    persistExpandedGroups: true, // Save expanded groups to localStorage
    storageKey: 'my-sidebar',    // localStorage key prefix
    defaultCollapsed: false      // Start collapsed
  }
};
```

## Components

| Component | Description |
|-----------|-------------|
| `Sidebar` | Root container, provides context |
| `SidebarContent` | Scrollable content wrapper |
| `SidebarSection` | Section with optional title |
| `SidebarItems` | Recursive item renderer |
| `SidebarPage` | Navigation link |
| `SidebarGroup` | Collapsible group (optionally navigable) |
| `SidebarIcon` | Flexible icon renderer |
| `SidebarTrigger` | Collapse/expand toggle |

## CSS Customization

Override CSS custom properties to customize the appearance:

```css
:root {
  /* Dimensions */
  --sidebar-width-expanded: 280px;
  --sidebar-width-collapsed: 64px;

  /* Colors */
  --sidebar-bg: hsl(0 0% 98%);
  --sidebar-border-color: hsl(0 0% 90%);
  --sidebar-item-bg: transparent;
  --sidebar-item-bg-hover: hsl(0 0% 95%);
  --sidebar-item-bg-active: hsl(220 90% 95%);
  --sidebar-item-color: hsl(0 0% 20%);
  --sidebar-item-color-hover: hsl(0 0% 10%);
  --sidebar-item-color-active: hsl(220 90% 40%);

  /* Typography */
  --sidebar-font-size: 14px;
  --sidebar-font-weight: 500;

  /* Spacing */
  --sidebar-padding: 12px;
  --sidebar-item-padding-x: 12px;
  --sidebar-item-padding-y: 8px;
  --sidebar-item-gap: 8px;
  --sidebar-nested-indent: 24px;

  /* Animation */
  --sidebar-animation-easing: ease-out;
}
```

## Context API

Access sidebar state from any child component:

```svelte
<script lang="ts">
  import { getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();
</script>

<p>Sidebar is {ctx.isCollapsed ? 'collapsed' : 'expanded'}</p>
<p>Current width: {ctx.width}</p>

<button onclick={() => ctx.toggleCollapsed()}>
  Toggle Sidebar
</button>

<button onclick={() => ctx.setGroupExpanded('docs', true)}>
  Expand Docs
</button>
```

## Utilities

### Type Helpers

```typescript
import {
  getAllPages,
  findItemById,
  getItemPath,
  findPageByHref,
  countItems
} from 'sveltekit-sidebar';

// Get all pages (useful for sitemaps)
const pages = getAllPages(config);

// Find any item by ID
const item = findItemById(config, 'docs');

// Get ancestor path (useful for auto-expanding to active page)
const path = getItemPath(config, 'deep-page');

// Find page by href
const page = findPageByHref(config, '/docs/api');

// Count total items
const { pages, groups } = countItems(config);
```

### Builder API

```typescript
import { sidebar, section, group, page } from 'sveltekit-sidebar';

const config = sidebar()
  .addSection('main', (s) => s
    .title('Navigation')
    .addPage('home', 'Home', '/')
    .addGroup('docs', 'Documentation', (g) => g
      .href('/docs')
      .defaultExpanded()
      .addPage('intro', 'Introduction', '/docs/intro')
      .addPage('api', 'API', '/docs/api')
    )
  )
  .build();
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build the package
npm run package

# Type check
npm run check
```

## License

MIT
