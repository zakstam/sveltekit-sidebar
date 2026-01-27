# SvelteKit Sidebar

> 🤖 **LLM-Optimized Documentation** - This README contains complete type definitions, self-contained code examples, and comprehensive API references designed for AI assistants and code generation tools.

A type-safe, infinitely nestable sidebar component library for SvelteKit with schema-based data mapping and custom render snippets.

## Features

- **Schema System** - Use your own data types without transformation
- **Render Snippets** - Full control over item rendering
- **Drag and Drop** - Production-ready reordering with live preview, keyboard, and touch support
- **Responsive** - Built-in mobile drawer, tablet collapsed, and desktop modes
- **Type-safe** - Full TypeScript support with generics
- **Infinitely nestable** - Groups can contain other groups, to any depth
- **Flexible structure** - Pages and groups can live at root level or inside sections
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

## Repo Structure (Monorepo)

- Library package: `packages/sidebar`
- Docs/demo app: `apps/docs`

Useful workspace scripts from the repo root:

```bash
pnpm dev:docs
pnpm check:sidebar
pnpm check:docs
pnpm test:sidebar
```

---

## Two APIs: Legacy Config vs Schema + Snippets

### Legacy API (simple, quick setup)

Use the built-in types with a config object:

```svelte
<script lang="ts">
  import { Sidebar } from 'sveltekit-sidebar';
  // Styles (recommended)
  import 'sveltekit-sidebar/styles.css';
  // Legacy (still supported)
  // import 'sveltekit-sidebar/styles';

  const config = {
    sections: [
      // Root-level page (no section wrapper needed)
      { kind: 'page', id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '📊' },

      // Root-level group
      {
        kind: 'group',
        id: 'quick-actions',
        label: 'Quick Actions',
        icon: '⚡',
        items: [
          { kind: 'page', id: 'new', label: 'New Project', href: '/new' }
        ]
      },

      // Section with nested items
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
  import 'sveltekit-sidebar/styles.css';

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

## Routing

The core `Sidebar` is routing-agnostic. Provide the current pathname via `activeHref`:

```svelte
<Sidebar data={navigation} {schema} activeHref={currentPath} />
```

For SvelteKit, use the thin adapter component:

```svelte
<script lang="ts">
  import { SvelteKitSidebar } from 'sveltekit-sidebar';
</script>

<SvelteKitSidebar data={navigation} {schema} />
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
  setItems?: (item: T, items: T[]) => T; // Required for uncontrolled DnD
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

### Tree Index & Data Updates

The sidebar now builds a lightweight tree index for faster lookups.

Recommended:
- Prefer immutable updates (new `data` array reference).

If you mutate in place:
- Call `ctx.invalidateTreeIndex()` to force a rebuild.

See `TREE_INDEX_NOTES.md` for details.

```ts
import { buildTreeIndex, getSidebarContext } from 'sveltekit-sidebar';

// Optional: build an index for your own utilities
const index = buildTreeIndex({
  data: navigation,
  getId: (item) => item.id,
  getItems: (item) => item.children ?? []
});

// Escape hatch: if you mutate in place, invalidate the cached index
const ctx = getSidebarContext();
ctx.invalidateTreeIndex();
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
  isPreview: boolean;              // This is the preview at the drop target position
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

// Root-level items can be sections, pages, or groups
type SidebarRootItem = SidebarSection | SidebarItem;

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
  sections: SidebarRootItem[];  // Accepts sections, pages, or groups at root level
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
  responsive?: SidebarResponsiveSettings;  // Responsive behavior
  dnd?: SidebarDnDSettings;              // Drag-and-drop settings
  labels?: SidebarLabels;                // ARIA labels (i18n support)
  announcements?: SidebarAnnouncements;  // Screen reader announcements
}

interface SidebarResponsiveSettings {
  enabled?: boolean;             // Default: true
  mobileBreakpoint?: number;     // Default: 768 (px)
  tabletBreakpoint?: number;     // Default: 1024 (px)
  defaultMode?: SidebarResponsiveMode;  // Default: 'desktop' (for SSR)
  closeOnNavigation?: boolean;   // Default: true
  closeOnEscape?: boolean;       // Default: true
  lockBodyScroll?: boolean;      // Default: true
}

type SidebarResponsiveMode = 'mobile' | 'tablet' | 'desktop';

interface SidebarEvents {
  onCollapsedChange?: (collapsed: boolean) => void;
  onGroupToggle?: (groupId: string, expanded: boolean) => void;
  onNavigate?: (page: SidebarPage) => void;
  onOpenChange?: (open: boolean) => void;           // Mobile drawer open/close
  onModeChange?: (mode: SidebarResponsiveMode) => void;  // Responsive mode change

  // Preventable events (return false to prevent the action)
  onBeforeNavigate?: (page: SidebarPage) => boolean | void;
  onBeforeReorder?: (event: SidebarReorderEvent) => boolean | void;
  onBeforeGroupToggle?: (groupId: string, willExpand: boolean) => boolean | void;
  onBeforeCollapsedChange?: (willCollapse: boolean) => boolean | void;
  onBeforeOpenChange?: (willOpen: boolean) => boolean | void;
}

type SidebarIcon = Component<{ class?: string }> | string | Snippet<[{ class?: string }]>;

// Drag-and-drop settings
interface SidebarDnDSettings {
  longPressDelay?: number;       // Touch long-press delay in ms (default: 400)
  hoverExpandDelay?: number;     // Hover-expand delay in ms (default: 500)
  autoScrollThreshold?: number;  // Auto-scroll trigger distance in px (default: 50)
  autoScrollMaxSpeed?: number;   // Max auto-scroll speed in px/frame (default: 15)
  rectCacheInterval?: number;    // Drop zone rect cache interval in ms (default: 100)
  keyboard?: SidebarKeyboardShortcuts;  // Keyboard shortcuts
}

interface SidebarKeyboardShortcuts {
  pickUpDrop?: string[];         // Keys to pick up/drop (default: [' ', 'Enter'])
  moveUp?: string;               // Move up key (default: 'ArrowUp')
  moveDown?: string;             // Move down key (default: 'ArrowDown')
  moveToParent?: string;         // Move to parent key (default: 'ArrowLeft')
  moveIntoGroup?: string;        // Move into group key (default: 'ArrowRight')
  cancel?: string;               // Cancel key (default: 'Escape')
}

// ARIA labels (i18n support)
interface SidebarLabels {
  navigation?: {
    main?: string;               // "Sidebar navigation"
    mobileDrawer?: string;       // "Navigation menu"
  };
  trigger?: {
    expand?: string;             // "Expand sidebar"
    collapse?: string;           // "Collapse sidebar"
    openMenu?: string;           // "Open navigation menu"
    closeMenu?: string;          // "Close navigation menu"
  };
  group?: {
    expand?: string;             // "Expand"
    collapse?: string;           // "Collapse"
  };
  link?: {
    external?: string;           // "Opens in new tab"
  };
  dnd?: {
    draggableItem?: string;      // "Draggable item"
    instructions?: string;       // Full DnD instructions text
  };
}

// Screen reader announcements (use placeholders: {label}, {position}, {target}, {index}, {count})
interface SidebarAnnouncements {
  pickedUp?: string;             // "Picked up {label}. Use arrow keys..."
  moved?: string;                // "Moved {position} {target}. Position {index} of {count}."
  dropped?: string;              // "Dropped {label}. Reorder complete."
  cancelled?: string;            // "Cancelled. {label} returned to original position."
  atTop?: string;                // "At the top of the list"
  atBottom?: string;             // "At the bottom of the list"
  atTopLevel?: string;           // "Already at the top level"
  noGroupAbove?: string;         // "No group above to move into"
  notAGroup?: string;            // "Previous item is not a group"
  movedOutOf?: string;           // "Moved out of {target}. Now at parent level."
  movedInto?: string;            // "Moved into {target}. Position {index}."
  touchDragStarted?: string;     // "Dragging {label}. Move finger to reposition."
  groupExpanded?: string;        // "Expanded group"
}
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
  reorderMode?: 'auto' | 'controlled' | 'uncontrolled'; // Defaults to 'auto'
  animated?: boolean;              // Enable FLIP animations (default: true)
  livePreview?: boolean;           // Items reorder during drag (default: true)
  dragPreview?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;  // Custom drag image
  dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;  // Custom drop indicator

  // Responsive
  mobileTrigger?: Snippet<[open: boolean, toggle: () => void]>;  // Custom mobile menu button

  // Common
  events?: SidebarEvents;
  class?: string;
  activeHref?: string;             // Current active pathname/href (routing-agnostic)
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
<p>Responsive mode: {ctx.responsiveMode}</p>
<p>Drawer open: {ctx.drawerOpen}</p>

<!-- Methods -->
<button onclick={() => ctx.toggleCollapsed()}>Toggle Sidebar</button>
<button onclick={() => ctx.setCollapsed(true)}>Collapse</button>
<button onclick={() => ctx.toggleGroup('docs')}>Toggle Docs Group</button>
<button onclick={() => ctx.setGroupExpanded('docs', true)}>Expand Docs</button>
<button onclick={() => ctx.expandPathTo('deep-item')}>Expand Path to Item</button>
<button onclick={() => ctx.toggleDrawer()}>Toggle Mobile Drawer</button>
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
  readonly settings: SidebarSettings;

  // Responsive state (reactive)
  readonly responsiveMode: SidebarResponsiveMode;  // 'mobile' | 'tablet' | 'desktop'
  readonly drawerOpen: boolean;                     // Mobile drawer state

  // Collapse/Expand
  toggleCollapsed(): void;
  setCollapsed(value: boolean): void;

  // Groups
  toggleGroup(groupId: string): void;
  setGroupExpanded(groupId: string, expanded: boolean): void;
  isGroupExpanded(groupId: string): boolean;
  getExpandedGroupIds(): string[];
  expandPathTo(itemId: string): void;

  // Routing / active state
  setActiveHref(href: string): void;

  // Tree index
  invalidateTreeIndex(): void;

  // Responsive / Mobile drawer
  openDrawer(): void;
  closeDrawer(): void;
  toggleDrawer(): void;

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
    },
    onOpenChange: (open) => {
      console.log('Mobile drawer open:', open);
    },
    onModeChange: (mode) => {
      console.log('Responsive mode:', mode);  // 'mobile' | 'tablet' | 'desktop'
    }
  }}
/>
```

---

## Preventable Events

Use `onBefore*` events to intercept and optionally prevent actions by returning `false`:

```svelte
<script lang="ts">
  let hasUnsavedChanges = $state(false);
</script>

<Sidebar
  config={sidebarConfig}
  events={{
    // Confirm before navigating away with unsaved changes
    onBeforeNavigate: (page) => {
      if (hasUnsavedChanges) {
        return confirm('You have unsaved changes. Leave anyway?');
      }
    },

    // Prevent reordering of certain items
    onBeforeReorder: (event) => {
      // Prevent moving the "home" item
      if (event.item.id === 'home') {
        return false;
      }
    },

    // Confirm before collapsing sidebar
    onBeforeCollapsedChange: (willCollapse) => {
      if (willCollapse) {
        console.log('Sidebar is about to collapse');
      }
      // Return false to prevent, or nothing/true to allow
    },

    // Prevent certain groups from being toggled
    onBeforeGroupToggle: (groupId, willExpand) => {
      if (groupId === 'locked-group') {
        return false;  // Prevent toggle
      }
    },

    // Control mobile drawer opening
    onBeforeOpenChange: (willOpen) => {
      // Allow close but prevent open in certain conditions
      if (willOpen && someCondition) {
        return false;
      }
    }
  }}
/>
```

---

## Customization

### DnD Timing Settings

Customize drag-and-drop timing for different use cases:

```svelte
<Sidebar
  config={sidebarConfig}
  draggable={true}
  settings={{
    dnd: {
      // Longer delay for mobile users (default: 400ms)
      longPressDelay: 600,

      // Slower hover-expand for precision (default: 500ms)
      hoverExpandDelay: 750,

      // Larger auto-scroll zone (default: 50px)
      autoScrollThreshold: 80,

      // Slower auto-scroll (default: 15px/frame)
      autoScrollMaxSpeed: 10,

      // More frequent rect updates during drag (default: 100ms)
      rectCacheInterval: 50
    }
  }}
/>
```

### Custom Keyboard Shortcuts

Customize the keyboard shortcuts for drag-and-drop:

```svelte
<Sidebar
  config={sidebarConfig}
  draggable={true}
  settings={{
    dnd: {
      keyboard: {
        // Custom pick up/drop keys
        pickUpDrop: ['Enter'],  // Remove Space to avoid conflicts

        // Use WASD instead of arrow keys
        moveUp: 'w',
        moveDown: 's',
        moveToParent: 'a',
        moveIntoGroup: 'd',

        // Use 'q' to cancel
        cancel: 'q'
      }
    }
  }}
/>
```

### Internationalization (i18n)

Customize ARIA labels for different languages:

```svelte
<Sidebar
  config={sidebarConfig}
  settings={{
    labels: {
      navigation: {
        main: 'Navigation latérale',        // French: "Sidebar navigation"
        mobileDrawer: 'Menu de navigation'  // French: "Navigation menu"
      },
      trigger: {
        expand: 'Développer la barre latérale',
        collapse: 'Réduire la barre latérale',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu'
      },
      group: {
        expand: 'Développer',
        collapse: 'Réduire'
      },
      link: {
        external: 'Ouvre dans un nouvel onglet'
      },
      dnd: {
        draggableItem: 'Élément déplaçable',
        instructions: 'Appuyez sur Espace ou Entrée pour sélectionner. Utilisez les touches fléchées pour déplacer. Appuyez sur Entrée pour déposer ou Échap pour annuler.'
      }
    }
  }}
/>
```

### Custom Screen Reader Announcements

Customize the announcements for screen readers with placeholder support:

```svelte
<Sidebar
  config={sidebarConfig}
  draggable={true}
  settings={{
    announcements: {
      pickedUp: 'Élément "{label}" sélectionné. Utilisez les flèches pour déplacer.',
      moved: 'Déplacé {position} "{target}". Position {index} sur {count}.',
      dropped: '"{label}" déposé. Réorganisation terminée.',
      cancelled: 'Annulé. "{label}" revenu à sa position initiale.',
      atTop: 'En haut de la liste',
      atBottom: 'En bas de la liste',
      atTopLevel: 'Déjà au niveau racine',
      noGroupAbove: 'Pas de groupe au-dessus',
      notAGroup: "L'élément précédent n'est pas un groupe",
      movedOutOf: 'Sorti de "{target}". Maintenant au niveau parent.',
      movedInto: 'Entré dans "{target}". Position {index}.',
      touchDragStarted: 'Déplacement de "{label}". Bougez le doigt pour repositionner.',
      groupExpanded: 'Groupe développé'
    }
  }}
/>
```

Available placeholders:
- `{label}` - The label of the dragged item
- `{target}` - The label of the target item
- `{position}` - Position relative to target ("before" or "after")
- `{index}` - Current position (1-based)
- `{count}` - Total items in the list

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

### Controlled vs Uncontrolled Reordering

`reorderMode` controls who updates the data:
- `'auto'` (default): controlled when `onReorder` is provided, otherwise uncontrolled
- `'controlled'`: you must update `data` in `onReorder`
- `'uncontrolled'`: the sidebar updates its internal data (requires `schema.getItems` + `schema.setItems`)

```svelte
<Sidebar
  data={navigation}
  {schema}
  draggable={true}
  reorderMode="controlled"
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

- **Sections** can only be dropped at root level (next to other root items)
- **Pages and groups** can be dropped at root level or within sections/groups
- **Items** cannot be dropped into themselves or their descendants

### Features

The built-in DnD system includes:

- **Live preview** - Items physically reorder as you drag for instant visual feedback
- **Custom drop indicator** - Replace the default faded preview with your own indicator
- **Custom drag preview** - Render any component as the drag preview image
- **FLIP animations** - Smooth transitions when items change position (can be disabled)
- **Keyboard support** - Tab to drag handle, Space/Enter to pick up, Arrow keys to move, Enter to drop, Escape to cancel
- **Touch support** - Long-press (~400ms) to initiate drag on mobile/tablet devices
- **Auto-scroll** - Sidebar scrolls automatically when dragging near edges
- **Hover-expand** - Collapsed groups auto-expand after hovering during drag
- **Accessible** - Full ARIA support with screen reader announcements

### Custom Drag Preview

Customize the drag preview image using the `dragPreview` snippet:

```svelte
<Sidebar data={navigation} {schema} draggable={true} onReorder={handleReorder}>
  {#snippet dragPreview(item, ctx)}
    <div class="my-drag-preview">
      <span class="icon">{ctx.meta.emoji}</span>
      <span class="label">{ctx.label}</span>
    </div>
  {/snippet}
</Sidebar>

<style>
  .my-drag-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    font-weight: 500;
  }
</style>
```

The `dragPreview` snippet receives:
- `item: T` - The item being dragged (your original data)
- `ctx: SidebarRenderContext<T>` - The render context with `label`, `meta`, `icon`, etc.

### Custom Drop Indicator

By default, a faded preview of the dragged item appears at the target position. You can replace this with a custom drop indicator using the `dropIndicator` snippet:

```svelte
<Sidebar
  data={navigation}
  {schema}
  draggable={true}
  onReorder={handleReorder}
>
  {#snippet dropIndicator(position, draggedLabel)}
    <div class="my-drop-indicator">
      <span class="icon">↳</span>
      <span>Drop "{draggedLabel}" {position}</span>
    </div>
  {/snippet}
</Sidebar>

<style>
  .my-drop-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, hsl(220 90% 96%), hsl(260 90% 96%));
    border: 2px dashed hsl(240 70% 60%);
    border-radius: 6px;
    color: hsl(240 70% 40%);
    font-size: 13px;
  }
</style>
```

The `dropIndicator` snippet receives:
- `position: DropPosition` - Where the item will be dropped: `'before'`, `'inside'`, or `'after'`
- `draggedLabel: string` - The label of the item being dragged

When a custom `dropIndicator` is provided, the default faded preview is disabled.

### Animation Control

Control the FLIP animations during drag with the `animated` prop:

```svelte
<!-- Smooth animations (default) -->
<Sidebar draggable={true} animated={true} ... />

<!-- Instant position changes -->
<Sidebar draggable={true} animated={false} ... />
```

You can also customize the default preview styles with CSS variables:

```css
:root {
  --sidebar-drag-preview-bg: white;
  --sidebar-drag-preview-radius: 8px;
  --sidebar-drag-preview-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  --sidebar-drag-preview-padding: 8px 12px;
  --sidebar-drag-preview-max-width: 280px;
}
```

---

## Responsive Design

The sidebar includes built-in responsive behavior with three modes:

| Mode | Screen Width | Behavior |
|------|--------------|----------|
| **Mobile** | < 768px | Drawer slides from left, hidden by default |
| **Tablet** | 768px - 1023px | Collapsed sidebar (64px, icons only) |
| **Desktop** | ≥ 1024px | Full expanded sidebar (280px) |

### Basic Usage

Responsive behavior is enabled by default:

```svelte
<Sidebar config={sidebarConfig} />
```

### Configuration

Customize responsive behavior via settings:

```svelte
<Sidebar
  config={sidebarConfig}
  settings={{
    responsive: {
      enabled: true,              // Enable/disable responsive (default: true)
      mobileBreakpoint: 768,      // Mobile breakpoint in px
      tabletBreakpoint: 1024,     // Tablet breakpoint in px
      defaultMode: 'desktop',     // SSR default (prevents hydration mismatch)
      closeOnNavigation: true,    // Close drawer when navigating
      closeOnEscape: true,        // Close drawer on Escape key
      lockBodyScroll: true        // Prevent body scroll when drawer open
    }
  }}
  events={{
    onOpenChange: (open) => console.log('Drawer:', open),
    onModeChange: (mode) => console.log('Mode:', mode)
  }}
/>
```

### Collapsed Mode Behavior

When the sidebar is collapsed (tablet mode or manually collapsed):

- **Icons only** - Labels and badges are hidden
- **Avatar fallback** - Items without icons show a circular avatar with the first letter of their label
- **Tooltips** - Hover over any item to see its full label in a tooltip
- **No indentation** - Nested items are centered like root items
- **Subtle nesting** - Nested items have slightly reduced opacity (0.85)

### Mobile Drawer

On mobile, the sidebar becomes a drawer that slides from the left:

```svelte
<script lang="ts">
  import { getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();
</script>

<!-- Programmatic control -->
<button onclick={() => ctx.openDrawer()}>Open Menu</button>
<button onclick={() => ctx.closeDrawer()}>Close Menu</button>
<button onclick={() => ctx.toggleDrawer()}>Toggle Menu</button>

<!-- Check state -->
{#if ctx.drawerOpen}
  <p>Drawer is open</p>
{/if}
```

### Custom Mobile Trigger

Replace the default hamburger button with your own:

```svelte
<Sidebar config={sidebarConfig}>
  {#snippet mobileTrigger(open, toggle)}
    <button class="my-menu-btn" onclick={toggle} aria-expanded={open}>
      {open ? '✕' : '☰'} Menu
    </button>
  {/snippet}
</Sidebar>

<style>
  .my-menu-btn {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 999;
  }
</style>
```

### Disable Responsive

To disable responsive behavior entirely:

```svelte
<Sidebar
  config={sidebarConfig}
  settings={{
    responsive: { enabled: false }
  }}
/>
```

### SSR Considerations

To prevent hydration mismatches, the sidebar uses `defaultMode: 'desktop'` for server-side rendering. CSS media queries provide responsive fallbacks before JavaScript hydrates.

---

## CSS Customization

Import the default styles and override CSS custom properties:

```svelte
<script>
  import 'sveltekit-sidebar/styles.css';
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

    /* Responsive */
    --sidebar-breakpoint-mobile: 768px;
    --sidebar-breakpoint-tablet: 1024px;
    --sidebar-drawer-width: min(320px, 85vw);
    --sidebar-backdrop-color: rgba(0, 0, 0, 0.5);
    --sidebar-drawer-z-index: 1000;
    --sidebar-mobile-trigger-size: 44px;

    /* Collapsed mode avatars (items without icons) */
    --sidebar-avatar-size: 28px;
    --sidebar-avatar-bg: hsl(220 15% 85%);
    --sidebar-avatar-color: hsl(220 15% 35%);
    --sidebar-avatar-font-size: 12px;
    --sidebar-avatar-font-weight: 600;

    /* Collapsed mode tooltips */
    --sidebar-tooltip-bg: hsl(0 0% 20%);
    --sidebar-tooltip-color: white;
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
  buildTreeIndex,
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
  SidebarLiveRegion,
  SidebarBackdrop,
  SidebarMobileTrigger
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
  SidebarRootItem,
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
  PointerDragState,
  SidebarResponsiveSettings,
  SidebarResponsiveMode,
  SidebarReorderMode,
  // Customization types
  SidebarDnDSettings,
  SidebarKeyboardShortcuts,
  SidebarLabels,
  SidebarAnnouncements
} from 'sveltekit-sidebar';

// Components
export { Sidebar, SvelteKitSidebar } from 'sveltekit-sidebar';

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

The sidebar has built-in responsive behavior. For custom mobile handling:

```svelte
<script lang="ts">
  import { Sidebar, getSidebarContext } from 'sveltekit-sidebar';

  const ctx = getSidebarContext();
</script>

<!-- React to responsive mode changes -->
{#if ctx.responsiveMode === 'mobile'}
  <header class="mobile-header">
    <button onclick={() => ctx.toggleDrawer()}>
      {ctx.drawerOpen ? '✕' : '☰'}
    </button>
    <h1>My App</h1>
  </header>
{/if}

<Sidebar {config} />
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
pnpm dev:docs

# Build the package
pnpm build:sidebar

# Type check
pnpm check:sidebar

# Lint
pnpm test:sidebar
```

## License

MIT
