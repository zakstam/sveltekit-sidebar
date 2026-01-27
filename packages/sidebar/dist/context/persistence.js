export function toPersistenceSettings(settings) {
    return {
        persistCollapsed: settings.persistCollapsed ?? true,
        persistExpandedGroups: settings.persistExpandedGroups ?? true,
        storageKey: settings.storageKey ?? 'sveltekit-sidebar'
    };
}
export function loadPersistedSidebarState(settings) {
    if (typeof window === 'undefined') {
        return { collapsed: null, expandedGroupIds: [] };
    }
    try {
        let collapsed = null;
        if (settings.persistCollapsed) {
            const storedCollapsed = localStorage.getItem(`${settings.storageKey}-collapsed`);
            if (storedCollapsed !== null) {
                collapsed = storedCollapsed === 'true';
            }
        }
        let expandedGroupIds = [];
        if (settings.persistExpandedGroups) {
            const storedGroups = localStorage.getItem(`${settings.storageKey}-expanded`);
            if (storedGroups !== null) {
                expandedGroupIds = JSON.parse(storedGroups);
            }
        }
        return { collapsed, expandedGroupIds };
    }
    catch {
        return { collapsed: null, expandedGroupIds: [] };
    }
}
export function persistSidebarState(settings, collapsed, expandedMap) {
    if (typeof window === 'undefined')
        return;
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
    }
    catch {
        // Ignore localStorage errors
    }
}
