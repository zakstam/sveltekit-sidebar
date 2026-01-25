import { getContext, setContext, untrack } from 'svelte';
import type { SidebarConfig, SidebarSettings, SidebarEvents, SidebarPage, SidebarGroup } from './types.js';

const SIDEBAR_CONTEXT_KEY = Symbol('sidebar-context');

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: Required<SidebarSettings> = {
	widthExpanded: '280px',
	widthCollapsed: '64px',
	animationDuration: 200,
	persistCollapsed: true,
	persistExpandedGroups: true,
	storageKey: 'sveltekit-sidebar',
	defaultCollapsed: false
};

// ============================================================================
// Sidebar Context Class
// ============================================================================

export class SidebarContext {
	// Configuration (initialized first)
	readonly config: SidebarConfig;
	readonly settings: Required<SidebarSettings>;
	readonly events: SidebarEvents;

	// Reactive state using Svelte 5 runes
	collapsed = $state(false);

	// Fine-grained reactivity: each group has its own reactive state
	// This prevents all groups from re-rendering when one changes
	#expandedGroupsMap = $state<Record<string, boolean>>({});

	// Current active pathname - set once from root Sidebar
	activeHref = $state<string>('');

	// Getters for derived values
	get width(): string {
		return this.collapsed ? this.settings.widthCollapsed : this.settings.widthExpanded;
	}

	get isCollapsed(): boolean {
		return this.collapsed;
	}

	constructor(config: SidebarConfig, events: SidebarEvents = {}) {
		this.config = config;
		this.settings = { ...DEFAULT_SETTINGS, ...config.settings };
		this.events = events;

		// Initialize state
		this.collapsed = this.settings.defaultCollapsed;
		this.#expandedGroupsMap = this.getInitialExpandedGroups();

		// Load persisted state (must happen before effect setup)
		this.loadPersistedState();

		// Set up persistence effect - use untrack to read values without creating dependencies
		$effect(() => {
			// Read the values we want to persist
			const collapsedValue = this.collapsed;
			const expandedMap = this.#expandedGroupsMap;

			// Persist without tracking
			untrack(() => {
				this.persistState(collapsedValue, expandedMap);
			});
		});
	}

	// ========================================================================
	// Public Methods
	// ========================================================================

	/**
	 * Toggle sidebar collapsed state
	 */
	toggleCollapsed(): void {
		this.collapsed = !this.collapsed;
		this.events.onCollapsedChange?.(this.collapsed);
	}

	/**
	 * Set sidebar collapsed state
	 */
	setCollapsed(value: boolean): void {
		this.collapsed = value;
		this.events.onCollapsedChange?.(this.collapsed);
	}

	/**
	 * Toggle a group's expanded state
	 */
	toggleGroup(groupId: string): void {
		const currentState = this.#expandedGroupsMap[groupId] ?? false;
		this.#expandedGroupsMap[groupId] = !currentState;
		this.events.onGroupToggle?.(groupId, !currentState);
	}

	/**
	 * Set a group's expanded state
	 */
	setGroupExpanded(groupId: string, expanded: boolean): void {
		this.#expandedGroupsMap[groupId] = expanded;
		this.events.onGroupToggle?.(groupId, expanded);
	}

	/**
	 * Set the currently active href (called from root Sidebar)
	 */
	setActiveHref(href: string): void {
		this.activeHref = href;
	}

	/**
	 * Check if a group is expanded
	 * Returns a reactive value that only updates when THIS specific group changes
	 */
	isGroupExpanded(groupId: string): boolean {
		return this.#expandedGroupsMap[groupId] ?? false;
	}

	/**
	 * Get all expanded group IDs (for utilities/debugging)
	 */
	getExpandedGroupIds(): string[] {
		return Object.entries(this.#expandedGroupsMap)
			.filter(([, expanded]) => expanded)
			.map(([id]) => id);
	}

	/**
	 * Expand all groups in the path to an item
	 */
	expandPathTo(itemId: string): void {
		const path = this.findPathToItem(itemId);
		for (const id of path) {
			this.#expandedGroupsMap[id] = true;
		}
	}

	/**
	 * Handle navigation to a page
	 */
	handleNavigate(page: SidebarPage): void {
		this.events.onNavigate?.(page);
	}

	// ========================================================================
	// Private Methods
	// ========================================================================

	private getInitialExpandedGroups(): Record<string, boolean> {
		const expanded: Record<string, boolean> = {};

		const processItems = (items: (SidebarPage | SidebarGroup)[]): void => {
			for (const item of items) {
				if (item.kind === 'group') {
					if (item.defaultExpanded) {
						expanded[item.id] = true;
					}
					processItems(item.items);
				}
			}
		};

		for (const section of this.config.sections) {
			processItems(section.items);
		}

		return expanded;
	}

	private loadPersistedState(): void {
		if (typeof window === 'undefined') return;

		try {
			// Load collapsed state
			if (this.settings.persistCollapsed) {
				const storedCollapsed = localStorage.getItem(`${this.settings.storageKey}-collapsed`);
				if (storedCollapsed !== null) {
					this.collapsed = storedCollapsed === 'true';
				}
			}

			// Load expanded groups
			if (this.settings.persistExpandedGroups) {
				const storedGroups = localStorage.getItem(`${this.settings.storageKey}-expanded`);
				if (storedGroups !== null) {
					const groupIds = JSON.parse(storedGroups) as string[];
					// Merge with initial state
					for (const id of groupIds) {
						this.#expandedGroupsMap[id] = true;
					}
				}
			}
		} catch {
			// Ignore localStorage errors
		}
	}

	private persistState(collapsed: boolean, expandedMap: Record<string, boolean>): void {
		if (typeof window === 'undefined') return;

		try {
			// Persist collapsed state
			if (this.settings.persistCollapsed) {
				localStorage.setItem(`${this.settings.storageKey}-collapsed`, String(collapsed));
			}

			// Persist expanded groups
			if (this.settings.persistExpandedGroups) {
				const groupIds = Object.entries(expandedMap)
					.filter(([, expanded]) => expanded)
					.map(([id]) => id);
				localStorage.setItem(`${this.settings.storageKey}-expanded`, JSON.stringify(groupIds));
			}
		} catch {
			// Ignore localStorage errors
		}
	}

	private findPathToItem(targetId: string): string[] {
		const findPath = (
			items: (SidebarPage | SidebarGroup)[],
			path: string[]
		): string[] | null => {
			for (const item of items) {
				if (item.id === targetId) {
					return path;
				}

				if (item.kind === 'group') {
					const result = findPath(item.items, [...path, item.id]);
					if (result) return result;
				}
			}
			return null;
		};

		for (const section of this.config.sections) {
			const result = findPath(section.items, []);
			if (result) return result;
		}

		return [];
	}
}

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Create and set sidebar context
 */
export function createSidebarContext(config: SidebarConfig, events: SidebarEvents = {}): SidebarContext {
	const context = new SidebarContext(config, events);
	setContext(SIDEBAR_CONTEXT_KEY, context);
	return context;
}

/**
 * Set sidebar context (for use when context is created externally)
 */
export function setSidebarContext(context: SidebarContext): void {
	setContext(SIDEBAR_CONTEXT_KEY, context);
}

/**
 * Get sidebar context from parent component
 */
export function getSidebarContext(): SidebarContext {
	const context = getContext<SidebarContext>(SIDEBAR_CONTEXT_KEY);
	if (!context) {
		throw new Error('Sidebar context not found. Make sure to use this component inside a <Sidebar> component.');
	}
	return context;
}

/**
 * Try to get sidebar context (returns undefined if not found)
 */
export function tryGetSidebarContext(): SidebarContext | undefined {
	return getContext<SidebarContext>(SIDEBAR_CONTEXT_KEY);
}
