# SvelteKit Sidebar

A type-safe, infinitely nestable sidebar component library for SvelteKit.

## Features

- **Type-safe** - Full TypeScript support with discriminated unions
- **Infinitely nestable** - Groups can contain other groups, to any depth
- **Collapsible** - Sidebar and groups can be expanded/collapsed
- **Persistent state** - Remembers collapsed/expanded state via localStorage
- **Flexible icons** - Supports Svelte Components, strings, or Snippets
- **Customizable** - CSS custom properties for easy theming
- **Accessible** - Proper ARIA attributes and keyboard navigation

## Installation

```bash
# From GitHub
npm install github:username/sveltekit-sidebar

# Or if published to npm
npm install sveltekit-sidebar
```

## Quick Start

### 1. Create your sidebar configuration

```typescript
// sidebar-config.ts
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
          defaultExpanded: true,
          items: [
            { kind: 'page', id: 'intro', label: 'Introduction', href: '/docs' },
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
<!-- +layout.svelte -->
<script>
  import { Sidebar } from 'sveltekit-sidebar';
  import 'sveltekit-sidebar/styles';
  import { config } from './sidebar-config';

  let { children } = $props();
</script>

<div class="layout">
  <Sidebar {config}>
    {#snippet header()}<Logo />{/snippet}
    {#snippet footer()}<UserMenu />{/snippet}
  </Sidebar>
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
</style>
```

## Type System

The library uses TypeScript discriminated unions for type safety:

```typescript
type SidebarItem = SidebarPage | SidebarGroup;

interface SidebarPage {
  kind: 'page';        // Discriminant
  id: string;
  label: string;
  href: string;
  icon?: SidebarIcon;
  badge?: string | number;
}

interface SidebarGroup {
  kind: 'group';       // Discriminant
  id: string;
  label: string;
  items: SidebarItem[]; // Recursive - enables infinite nesting
  defaultExpanded?: boolean;
}
```

## Components

| Component | Description |
|-----------|-------------|
| `Sidebar` | Root container, provides context |
| `SidebarContent` | Scrollable content wrapper |
| `SidebarSection` | Section with optional title |
| `SidebarItems` | Recursive item renderer |
| `SidebarPage` | Navigation link |
| `SidebarGroup` | Collapsible group |
| `SidebarIcon` | Flexible icon renderer |
| `SidebarTrigger` | Collapse/expand toggle |

## Customization

Override CSS custom properties to customize the appearance:

```css
:root {
  --sidebar-width-expanded: 280px;
  --sidebar-width-collapsed: 64px;
  --sidebar-bg: hsl(0 0% 98%);
  --sidebar-item-bg-active: hsl(220 90% 95%);
  --sidebar-item-color-active: hsl(220 90% 40%);
  /* ... more variables */
}
```

## Utilities

### Type Helpers

```typescript
import { getAllPages, findItemById, getItemPath } from 'sveltekit-sidebar';

// Get all pages for sitemap
const pages = getAllPages(config);

// Find any item by ID
const item = findItemById(config, 'docs');

// Get ancestor path for auto-expand
const path = getItemPath(config, 'deep-page');
```

### Builder API

```typescript
import { sidebar, section, group, page } from 'sveltekit-sidebar';

const config = sidebar()
  .addSection('main', (s) => s
    .title('Navigation')
    .addPage('home', 'Home', '/')
    .addGroup('docs', 'Documentation', (g) => g
      .defaultExpanded()
      .addPage('intro', 'Introduction', '/docs')
    )
  )
  .build();
```

## Context API

Access sidebar state from any child component:

```svelte
<script>
  import { getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();
</script>

<button onclick={() => ctx.toggleCollapsed()}>
  {ctx.isCollapsed ? 'Expand' : 'Collapse'}
</button>
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
