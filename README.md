# SvelteKit Sidebar

> 🤖 **LLM-Optimized Documentation** - This README contains complete type definitions, self-contained code examples, and comprehensive API references designed for AI assistants and code generation tools.

A type-safe, infinitely nestable sidebar component library for SvelteKit with schema-based data mapping and custom render snippets.

## Features

- **Schema System** - Use your own data types without transformation
- **Render Snippets** - Full control over item rendering
- **Drag and Drop** - Production-ready reordering with live preview, keyboard, and touch support
- **Type-safe** - Full TypeScript support with generics
- **Infinitely nestable** - Groups can contain other groups, to any depth
- **Collapsible** - Sidebar and groups can be expanded/collapsed
- **Navigable groups** - Groups can optionally have their own href
- **Persistent state** - Remembers collapsed/expanded state via localStorage
- **Flexible icons** - Supports Svelte Components, strings, or Snippets
- **Customizable** - CSS custom properties for easy theming
- **Accessible** - Proper ARIA attributes and keyboard navigation

## Requirements

- Svelte 5
- SvelteKit 2

## Installation

```bash
npm install github:zakstam/sveltekit-sidebar
```

---

## Two APIs: Legacy Config vs Schema + Snippets

### Legacy API (simple, quick setup)

Use the built-in types with a config object:

```svelte
<script lang="ts">
  import { Sidebar } from 'sveltekit-sidebar';
  import 'sveltekit-sidebar/styles';

  const config = {
    sections: [
      {
        kind: 'section',
        id: 'main',
        title: 'Navigation',
        items: [
          { kind: 'page', id: 'home', label: 'Home', href: '/' },
          { kind: 'page', id: 'about', label: 'About', href: '/about' }
        ]
      }
    ]
  };
</script>

<Sidebar {config} />
```

### Schema API (custom data types, full control)

Use your own data types with a schema mapper:

```svelte
<script lang="ts">
  import { Sidebar, type SidebarSchema } from 'sveltekit-sidebar';
  import 'sveltekit-sidebar/styles';

  // Your own data type
  interface NavItem {
    type: 'page' | 'folder' | 'category';
    id: string;
    title: string;
    path?: string;
    children?: NavItem[];
    emoji?: string;
    isDraft?: boolean;
  }

  // Your data
  const navigation: NavItem[] = [
    {
      type: 'category',
      id: 'main',
      title: 'Navigation',
      children: [
        { type: 'page', id: 'home', title: 'Home', path: '/', emoji: '🏠' },
        { type: 'page', id: 'about', title: 'About', path: '/about', emoji: '📖', isDraft: true }
      ]
    }
  ];

  // Schema maps your types to sidebar structure
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
    getMeta: (item) => ({ emoji: item.emoji, isDraft: item.isDraft })
  };
</script>

<Sidebar data={navigation} {schema} />
```

---

## Complete Type Reference

### SidebarSchema<T>

Maps your custom data type to sidebar structure:

```typescript
interface SidebarSchema<T = unknown> {
  // Required
  getKind: (item: T) => 'page' | 'group' | 'section';
  getId: (item: T) => string;
  getLabel: (item: T) => string;

  // Optional
  getHref?: (item: T) => string | undefined;
  getItems?: (item: T) => T[] | undefined;
  getIcon?: (item: T) => SidebarIcon | undefined;
  getBadge?: (item: T) => string | number | undefined;
  getDisabled?: (item: T) => boolean;
  getExternal?: (item: T) => boolean;
  getCollapsible?: (item: T) => boolean;
  getDefaultExpanded?: (item: T) => boolean;
  getTitle?: (item: T) => string | undefined;
  getMeta?: (item: T) => Record<string, unknown>;
}
```

### SidebarRenderContext<T>

Passed to render snippets with pre-computed values:

```typescript
interface SidebarRenderContext<T = unknown> {
  id: string;                      // From schema.getId()
  label: string;                   // From schema.getLabel()
  href?: string;                   // From schema.getHref()
  icon?: SidebarIcon;              // From schema.getIcon()
  badge?: string | number;         // From schema.getBadge()
  depth: number;                   // Nesting level (0 = top)
  isActive: boolean;               // href matches current route
  isCollapsed: boolean;            // Sidebar collapsed state
  isExpanded?: boolean;            // Group expanded state (groups only)
  isDisabled?: boolean;            // From schema.getDisabled()
  isExternal?: boolean;            // From schema.getExternal()
  meta: Record<string, unknown>;   // From schema.getMeta()
  original: T;                     // Your original data item
  toggleExpanded?: () => void;     // Toggle group (groups only)
  dnd: SidebarDnDState;            // Drag-and-drop state and handlers
}

interface SidebarDnDState {
  enabled: boolean;                // DnD is active (draggable prop is true)
  isDragging: boolean;             // This item is being dragged
  isKeyboardDragging: boolean;     // Item picked up via keyboard
  isPointerDragging: boolean;      // Pointer/touch drag active
  handleProps: {                   // Spread on drag handle element
    draggable: boolean;
    tabIndex: number;
    role: string;
    'aria-roledescription': string;
    'aria-describedby': string;
    'aria-pressed'?: boolean;
    'aria-grabbed'?: boolean;
    style?: string;                // touch-action: none for mobile
    ondragstart: (e: DragEvent) => void;
    ondragend: (e: DragEvent) => void;
    onkeydown: (e: KeyboardEvent) => void;
    onpointerdown: (e: PointerEvent) => void;
  };
  dropZoneProps: {                 // Spread on drop zone element
    'data-sidebar-item-id': string;
    'data-sidebar-item-kind': string;
    ondragover: (e: DragEvent) => void;
    ondragleave: (e: DragEvent) => void;
    ondrop: (e: DragEvent) => void;
  };
  keyboard: {                      // Keyboard DnD state
    isActive: boolean;             // Whether keyboard drag mode is active
    announcement: string;          // Screen reader announcement
  };
}
```

### Built-in Types (Legacy API)

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
  items: SidebarItem[];
  href?: string;
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
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface SidebarConfig {
  sections: SidebarSection[];
  settings?: SidebarSettings;
}

interface SidebarSettings {
  widthExpanded?: string;        // Default: '280px'
  widthCollapsed?: string;       // Default: '64px'
  animationDuration?: number;    // Default: 200 (ms)
  persistCollapsed?: boolean;    // Default: true
  persistExpandedGroups?: boolean; // Default: true
  storageKey?: string;           // Default: 'sveltekit-sidebar'
  defaultCollapsed?: boolean;    // Default: false
}

interface SidebarEvents {
  onCollapsedChange?: (collapsed: boolean) => void;
  onGroupToggle?: (groupId: string, expanded: boolean) => void;
  onNavigate?: (page: SidebarPage) => void;
}

type SidebarIcon = Component<{ class?: string }> | string | Snippet<[{ class?: string }]>;
```

### Sidebar Component Props

```typescript
interface SidebarProps<T = SidebarItem | SidebarSection> {
  // Legacy API
  config?: SidebarConfig;

  // Schema API
  data?: T[];
  schema?: SidebarSchema<T>;
  settings?: SidebarSettings;

  // Render snippets (Schema API)
  page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
  group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
  section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;

  // Drag and drop
  draggable?: boolean;             // Enable drag-and-drop reordering
  onReorder?: (event: SidebarReorderEvent<T>) => void;

  // Common
  events?: SidebarEvents;
  class?: string;
  header?: Snippet;
  footer?: Snippet;
  children?: Snippet;
}

interface SidebarReorderEvent<T = unknown> {
  item: T;                         // The item that was moved
  fromIndex: number;               // Original index in parent
  toIndex: number;                 // New index in target parent
  fromParentId: string | null;     // Source parent ID (null = root)
  toParentId: string | null;       // Target parent ID (null = root)
  depth: number;                   // Target nesting depth
  position: DropPosition;          // 'before' | 'inside' | 'after'
}
```

---

## Custom Rendering with Snippets

Override how pages, groups, and sections render:

```svelte
<script lang="ts">
  import { Sidebar, type SidebarSchema, type SidebarRenderContext } from 'sveltekit-sidebar';

  interface NavItem {
    type: 'page' | 'folder' | 'category';
    id: string;
    title: string;
    path?: string;
    children?: NavItem[];
    emoji?: string;
    color?: string;
    isDraft?: boolean;
  }

  let editMode = $state(false);

  const navigation: NavItem[] = [
    {
      type: 'category',
      id: 'workspace',
      title: 'Workspace',
      color: 'blue',
      children: [
        { type: 'page', id: 'dashboard', title: 'Dashboard', path: '/dashboard', emoji: '📊' },
        { type: 'page', id: 'drafts', title: 'Drafts', path: '/drafts', emoji: '📝', isDraft: true },
        {
          type: 'folder',
          id: 'projects',
          title: 'Projects',
          emoji: '📁',
          children: [
            { type: 'page', id: 'alpha', title: 'Alpha', path: '/projects/alpha', emoji: '🚀' }
          ]
        }
      ]
    }
  ];

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
    getDefaultExpanded: (item) => item.type === 'folder',
    getMeta: (item) => ({
      emoji: item.emoji,
      color: item.color,
      isDraft: item.isDraft
    })
  };
</script>

<Sidebar data={navigation} {schema}>
  {#snippet header()}
    <div class="header">
      <span>My App</span>
      <label>
        <input type="checkbox" bind:checked={editMode} />
        Edit
      </label>
    </div>
  {/snippet}

  {#snippet section(item, ctx, children)}
    <section class="section" style="--color: {ctx.meta.color}">
      <h3>{ctx.label}</h3>
      {@render children()}
    </section>
  {/snippet}

  {#snippet group(item, ctx, children)}
    <li class="group">
      <button onclick={ctx.toggleExpanded}>
        {#if editMode}<span class="drag-handle">⋮⋮</span>{/if}
        <span>{ctx.meta.emoji}</span>
        <span>{ctx.label}</span>
        <span>{ctx.isExpanded ? '▾' : '▸'}</span>
      </button>
      {#if ctx.isExpanded}
        <ul>{@render children()}</ul>
      {/if}
    </li>
  {/snippet}

  {#snippet page(item, ctx)}
    <li class="page" class:active={ctx.isActive}>
      <a href={ctx.href}>
        {#if editMode}<span class="drag-handle">⋮⋮</span>{/if}
        <span>{ctx.meta.emoji}</span>
        <span>{ctx.label}</span>
        {#if ctx.meta.isDraft}
          <span class="badge">Draft</span>
        {/if}
      </a>
    </li>
  {/snippet}

  {#snippet footer()}
    <div class="footer">v1.0.0</div>
  {/snippet}
</Sidebar>

<style>
  .section h3 {
    color: var(--color);
  }
  .page.active a {
    background: #e0f0ff;
  }
  .drag-handle {
    cursor: grab;
    color: #999;
  }
  .badge {
    font-size: 10px;
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
  }
</style>
```

---

## Snippet Reference

### page snippet

```svelte
{#snippet page(item, ctx)}
  <!-- item: T - your original data -->
  <!-- ctx: SidebarRenderContext<T> -->
  <li>
    <a href={ctx.href} class:active={ctx.isActive}>
      {ctx.label}
    </a>
  </li>
{/snippet}
```

### group snippet

```svelte
{#snippet group(item, ctx, children)}
  <!-- item: T - your original data -->
  <!-- ctx: SidebarRenderContext<T> -->
  <!-- children: Snippet - renders nested items -->
  <li>
    <button onclick={ctx.toggleExpanded}>
      {ctx.label} {ctx.isExpanded ? '▾' : '▸'}
    </button>
    {#if ctx.isExpanded}
      <ul>{@render children()}</ul>
    {/if}
  </li>
{/snippet}
```

### section snippet

```svelte
{#snippet section(item, ctx, children)}
  <!-- item: T - your original data -->
  <!-- ctx: SidebarRenderContext<T> -->
  <!-- children: Snippet - renders section items -->
  <section>
    <h3>{ctx.label}</h3>
    <ul>{@render children()}</ul>
  </section>
{/snippet}
```

---

## Context API

Access sidebar state from any child component:

```svelte
<script lang="ts">
  import { getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();
</script>

<!-- Reactive state -->
<p>Collapsed: {ctx.isCollapsed}</p>
<p>Width: {ctx.width}</p>
<p>Active href: {ctx.activeHref}</p>

<!-- Methods -->
<button onclick={() => ctx.toggleCollapsed()}>Toggle Sidebar</button>
<button onclick={() => ctx.setCollapsed(true)}>Collapse</button>
<button onclick={() => ctx.toggleGroup('docs')}>Toggle Docs Group</button>
<button onclick={() => ctx.setGroupExpanded('docs', true)}>Expand Docs</button>
<button onclick={() => ctx.expandPathTo('deep-item')}>Expand Path to Item</button>
```

### SidebarContext Methods

```typescript
class SidebarContext<T = unknown> {
  // State (reactive)
  readonly collapsed: boolean;
  readonly activeHref: string;
  readonly isCollapsed: boolean;
  readonly width: string;
  readonly data: T[];
  readonly schema: SidebarSchema<T>;
  readonly settings: Required<SidebarSettings>;

  // Collapse/Expand
  toggleCollapsed(): void;
  setCollapsed(value: boolean): void;

  // Groups
  toggleGroup(groupId: string): void;
  setGroupExpanded(groupId: string, expanded: boolean): void;
  isGroupExpanded(groupId: string): boolean;
  getExpandedGroupIds(): string[];
  expandPathTo(itemId: string): void;

  // Schema accessors
  getKind(item: T): 'page' | 'group' | 'section';
  getId(item: T): string;
  getLabel(item: T): string;
  getHref(item: T): string | undefined;
  getItems(item: T): T[];
  getIcon(item: T): SidebarIcon | undefined;
  getBadge(item: T): string | number | undefined;
  getDisabled(item: T): boolean;
  getExternal(item: T): boolean;
  getCollapsible(item: T): boolean;
  getTitle(item: T): string | undefined;

  // Create render context for custom components
  createRenderContext(item: T, depth: number): SidebarRenderContext<T>;
}
```

---

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

---

## Header and Footer

```svelte
<Sidebar config={sidebarConfig}>
  {#snippet header()}
    <div class="logo">
      <img src="/logo.svg" alt="Logo" />
      <span>My App</span>
    </div>
  {/snippet}

  {#snippet footer()}
    <div class="user">
      <img src={user.avatar} alt={user.name} />
      <span>{user.name}</span>
    </div>
  {/snippet}
</Sidebar>
```

---

## Navigable Groups

Groups can have an optional `href` making them both a link and expandable:

```typescript
{
  kind: 'group',
  id: 'components',
  label: 'Components',
  href: '/docs/components',  // Click navigates AND expands
  items: [
    { kind: 'page', id: 'button', label: 'Button', href: '/docs/components/button' }
  ]
}
```

- Click group label → navigates to href AND expands
- Click chevron → only toggles expand/collapse

---

## Drag and Drop

Enable built-in drag-and-drop reordering with the `draggable` prop:

### Basic Usage

```svelte
<script lang="ts">
  import { Sidebar, reorderItems, type SidebarReorderEvent } from 'sveltekit-sidebar';

  let navigation = $state([...]);

  function handleReorder(event: SidebarReorderEvent<NavItem>) {
    navigation = reorderItems(navigation, event, {
      getId: (item) => item.id,
      getItems: (item) => item.children,
      setItems: (item, children) => ({ ...item, children })
    });
  }
</script>

<Sidebar
  data={navigation}
  {schema}
  draggable={true}
  onReorder={handleReorder}
/>
```

### Edit Mode Toggle

```svelte
<script lang="ts">
  let editMode = $state(false);
</script>

<Sidebar data={navigation} {schema} draggable={editMode} onReorder={handleReorder}>
  {#snippet header()}
    <label>
      <input type="checkbox" bind:checked={editMode} />
      Edit Mode
    </label>
  {/snippet}
</Sidebar>
```

### Custom Drag Handle with Snippets

When using custom snippets, use `ctx.dnd` to wire up drag-and-drop:

```svelte
<Sidebar data={navigation} {schema} draggable={editMode} onReorder={handleReorder}>
  {#snippet page(item, ctx)}
    <li
      class="page"
      class:dragging={ctx.dnd.isDragging}
      class:keyboard-dragging={ctx.dnd.isKeyboardDragging}
      {...ctx.dnd.dropZoneProps}
    >
      <div class="page-row">
        {#if ctx.dnd.enabled}
          <span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
        {/if}
        <a href={ctx.href}>{ctx.label}</a>
      </div>
    </li>
  {/snippet}

  {#snippet group(item, ctx, children)}
    <li
      class="group"
      class:dragging={ctx.dnd.isDragging}
      class:keyboard-dragging={ctx.dnd.isKeyboardDragging}
      {...ctx.dnd.dropZoneProps}
    >
      <div class="group-row">
        {#if ctx.dnd.enabled}
          <span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
        {/if}
        <button onclick={ctx.toggleExpanded}>
          {ctx.label} {ctx.isExpanded ? '▾' : '▸'}
        </button>
      </div>
      {#if ctx.isExpanded}
        <ul>{@render children()}</ul>
      {/if}
    </li>
  {/snippet}
</Sidebar>

<style>
  .drag-handle {
    cursor: grab;
    color: #999;
  }
  .dragging {
    opacity: 0.4;
  }
  .keyboard-dragging {
    background: hsl(220 90% 95%);
  }
</style>
```

### Important: Drag Handle Placement

Place drag handles **outside** of `<button>` and `<a>` elements for reliable drag events:

```svelte
<!-- ✓ Correct: drag handle is sibling of button -->
<div class="row">
  <span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
  <button onclick={ctx.toggleExpanded}>{ctx.label}</button>
</div>

<!-- ✗ Incorrect: drag handle inside button -->
<button onclick={ctx.toggleExpanded}>
  <span class="drag-handle" {...ctx.dnd.handleProps}>⋮⋮</span>
  {ctx.label}
</button>
```

### reorderItems Helper

The `reorderItems` utility handles the tree manipulation for you:

```typescript
import { reorderItems } from 'sveltekit-sidebar';

function handleReorder(event: SidebarReorderEvent<NavItem>) {
  navigation = reorderItems(navigation, event, {
    getId: (item) => item.id,           // Get unique identifier
    getItems: (item) => item.children,  // Get child items
    setItems: (item, children) => ({    // Create item with new children
      ...item,
      children
    })
  });
}
```

### Drop Restrictions

Built-in validation prevents invalid drops:

- **Sections** can only be dropped next to other sections (root level)
- **Pages and groups** cannot be dropped at root level (must stay within sections)
- **Items** cannot be dropped into themselves or their descendants

### Features

The built-in DnD system includes:

- **Live preview** - Items physically reorder as you drag for instant visual feedback
- **Keyboard support** - Tab to drag handle, Space/Enter to pick up, Arrow keys to move, Enter to drop, Escape to cancel
- **Touch support** - Long-press (~400ms) to initiate drag on mobile/tablet devices
- **Auto-scroll** - Sidebar scrolls automatically when dragging near edges
- **Hover-expand** - Collapsed groups auto-expand after hovering during drag
- **FLIP animations** - Smooth transitions when items change position
- **Accessible** - Full ARIA support with screen reader announcements

---

## CSS Customization

Import the default styles and override CSS custom properties:

```svelte
<script>
  import 'sveltekit-sidebar/styles';
</script>

<style>
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
</style>
```

---

## Utilities

### Type Helpers

```typescript
import {
  getAllPages,
  findItemById,
  getItemPath,
  findPageByHref,
  getAllGroupIds,
  countItems,
  getItemDepth,
  isDescendantOf,
  reorderItems
} from 'sveltekit-sidebar';

// Get all pages (useful for sitemaps)
const pages = getAllPages(config);

// Find any item by ID
const item = findItemById(config, 'docs');

// Get ancestor path (useful for auto-expanding to active page)
const path = getItemPath(config, 'deep-page');

// Find page by href
const page = findPageByHref(config, '/docs/api');

// Get all group IDs
const groupIds = getAllGroupIds(config);

// Count total items
const { pages, groups } = countItems(config);

// Get nesting depth of an item
const depth = getItemDepth(config, 'nested-item');

// Check if item is descendant of another
const isChild = isDescendantOf(config, 'child-id', 'parent-id');

// Reorder items after drag-and-drop (see Drag and Drop section)
const newData = reorderItems(data, reorderEvent, {
  getId: (item) => item.id,
  getItems: (item) => item.children,
  setItems: (item, children) => ({ ...item, children })
});
```

### Builder API

```typescript
import { sidebar, section, group, page } from 'sveltekit-sidebar';

const config = sidebar()
  .settings({ persistCollapsed: true, storageKey: 'my-app' })
  .addSection('main', (s) => s
    .title('Navigation')
    .addPage('home', 'Home', '/')
    .addGroup('docs', 'Documentation', (g) => g
      .icon('📚')
      .href('/docs')
      .defaultExpanded()
      .addPage('intro', 'Introduction', '/docs/intro')
      .addPage('api', 'API', '/docs/api')
      .addGroup('advanced', 'Advanced', (nested) => nested
        .addPage('perf', 'Performance', '/docs/advanced/perf')
      )
    )
  )
  .addSection('external', (s) => s
    .title('Links')
    .addPage('github', 'GitHub', 'https://github.com', { external: true })
  )
  .build();
```

---

## Type Guards

```typescript
import { isPage, isGroup, isSection } from 'sveltekit-sidebar';

function processItem(item: SidebarItem | SidebarSection) {
  if (isPage(item)) {
    console.log('Page:', item.href);
  } else if (isGroup(item)) {
    console.log('Group with', item.items.length, 'children');
  } else if (isSection(item)) {
    console.log('Section:', item.title);
  }
}
```

---

## Full Exports Reference

```typescript
// Components
export {
  Sidebar,
  SidebarContent,
  SidebarSection,
  SidebarItems,
  SidebarPage,
  SidebarGroup,
  SidebarIcon,
  SidebarTrigger,
  SidebarLiveRegion
} from 'sveltekit-sidebar';

// Context
export {
  SidebarContext,
  createSidebarContext,
  setSidebarContext,
  getSidebarContext,
  tryGetSidebarContext
} from 'sveltekit-sidebar';

// Types
export type {
  SidebarItem,
  SidebarConfig,
  SidebarSettings,
  SidebarState,
  SidebarEvents,
  SidebarProps,
  ItemKind,
  SidebarSchema,
  SidebarRenderContext,
  SidebarSnippets,
  SidebarIconType,
  SidebarPageData,
  SidebarGroupData,
  SidebarSectionData,
  SidebarReorderEvent,
  SidebarDnDState,
  DropPosition,
  KeyboardDragState,
  PointerDragState
} from 'sveltekit-sidebar';

// Type Guards
export { isPage, isGroup, isSection, defaultSchema } from 'sveltekit-sidebar';

// Utilities
export {
  getAllPages,
  findItemById,
  getItemPath,
  findPageByHref,
  getAllGroupIds,
  countItems,
  getItemDepth,
  isDescendantOf,
  reorderItems
} from 'sveltekit-sidebar';

// Builder
export {
  PageBuilder,
  GroupBuilder,
  SectionBuilder,
  SidebarConfigBuilder,
  page,
  group,
  section,
  sidebar,
  createPage,
  createGroup,
  createSection,
  createConfig
} from 'sveltekit-sidebar';
```

---

## Common Patterns

### Auto-expand to Active Page

```svelte
<script lang="ts">
  import { Sidebar, getSidebarContext } from 'sveltekit-sidebar';
  import { page } from '$app/stores';

  const ctx = getSidebarContext();

  // Expand groups containing the active page
  $effect(() => {
    const activeItem = findPageByHref(config, $page.url.pathname);
    if (activeItem) {
      ctx.expandPathTo(activeItem.id);
    }
  });
</script>
```

### Keyboard Navigation

```svelte
<script lang="ts">
  import { getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '[' && e.metaKey) {
      ctx.toggleCollapsed();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
```

### Mobile Responsive

```svelte
<script lang="ts">
  import { Sidebar, getSidebarContext } from 'sveltekit-sidebar';

  let isMobile = $state(false);

  $effect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    isMobile = mq.matches;
    mq.addEventListener('change', (e) => isMobile = e.matches);
  });
</script>

{#if !isMobile || !ctx.isCollapsed}
  <Sidebar {config} />
{/if}
```

### Persist Custom State

```svelte
<script lang="ts">
  import { Sidebar } from 'sveltekit-sidebar';

  // Custom persistence beyond built-in localStorage
  const config = {
    sections: [...],
    settings: {
      persistCollapsed: false,  // Disable built-in
      persistExpandedGroups: false
    }
  };

  // Your own persistence
  $effect(() => {
    const saved = localStorage.getItem('my-sidebar-state');
    if (saved) {
      const state = JSON.parse(saved);
      ctx.setCollapsed(state.collapsed);
      state.expandedGroups.forEach(id => ctx.setGroupExpanded(id, true));
    }
  });
</script>
```

---

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

# Lint
npm run lint
```

## License

MIT
