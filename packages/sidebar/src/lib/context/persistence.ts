import type { SidebarSettings } from '../types.js';

export interface SidebarPersistenceSettings {
	persistCollapsed: boolean;
	persistExpandedGroups: boolean;
	storageKey: string;
}

export interface PersistedSidebarState {
	collapsed: boolean | null;
	expandedGroupIds: string[];
}

export function toPersistenceSettings(settings: SidebarSettings): SidebarPersistenceSettings {
	return {
		persistCollapsed: settings.persistCollapsed ?? true,
		persistExpandedGroups: settings.persistExpandedGroups ?? true,
		storageKey: settings.storageKey ?? 'sveltekit-sidebar'
	};
}

export function loadPersistedSidebarState(
	settings: SidebarPersistenceSettings
): PersistedSidebarState {
	if (typeof window === 'undefined') {
		return { collapsed: null, expandedGroupIds: [] };
	}

	try {
		let collapsed: boolean | null = null;
		if (settings.persistCollapsed) {
			const storedCollapsed = localStorage.getItem(`${settings.storageKey}-collapsed`);
			if (storedCollapsed !== null) {
				collapsed = storedCollapsed === 'true';
			}
		}

		let expandedGroupIds: string[] = [];
		if (settings.persistExpandedGroups) {
			const storedGroups = localStorage.getItem(`${settings.storageKey}-expanded`);
			if (storedGroups !== null) {
				expandedGroupIds = JSON.parse(storedGroups) as string[];
			}
		}

		return { collapsed, expandedGroupIds };
	} catch {
		return { collapsed: null, expandedGroupIds: [] };
	}
}

export function persistSidebarState(
	settings: SidebarPersistenceSettings,
	collapsed: boolean,
	expandedMap: Record<string, boolean>
): void {
	if (typeof window === 'undefined') return;

	try {
		if (settings.persistCollapsed) {
			localStorage.setItem(`${settings.storageKey}-collapsed`, String(collapsed));
		}

		if (settings.persistExpandedGroups) {
			const groupIds = Object.entries(expandedMap)
				.filter(([, expanded]) => expanded)
				.map(([id]) => id);
			localStorage.setItem(`${settings.storageKey}-expanded`, JSON.stringify(groupIds));
		}
	} catch {
		// Ignore localStorage errors
	}
}
