export const DEFAULT_RESPONSIVE_SETTINGS = {
    enabled: true,
    mobileBreakpoint: 768,
    tabletBreakpoint: 1024,
    defaultMode: 'desktop',
    closeOnNavigation: true,
    closeOnEscape: true,
    lockBodyScroll: true
};
export const DEFAULT_KEYBOARD_SHORTCUTS = {
    pickUpDrop: [' ', 'Enter'],
    moveUp: 'ArrowUp',
    moveDown: 'ArrowDown',
    moveToParent: 'ArrowLeft',
    moveIntoGroup: 'ArrowRight',
    cancel: 'Escape'
};
export const DEFAULT_DND_SETTINGS = {
    longPressDelay: 400,
    hoverExpandDelay: 500,
    autoScrollThreshold: 50,
    autoScrollMaxSpeed: 15,
    rectCacheInterval: 100,
    keyboard: DEFAULT_KEYBOARD_SHORTCUTS
};
export const DEFAULT_LABELS = {
    navigation: {
        main: 'Sidebar navigation',
        mobileDrawer: 'Navigation menu'
    },
    trigger: {
        expand: 'Expand sidebar',
        collapse: 'Collapse sidebar',
        openMenu: 'Open navigation menu',
        closeMenu: 'Close navigation menu'
    },
    group: {
        expand: 'Expand',
        collapse: 'Collapse'
    },
    link: {
        external: 'Opens in new tab'
    },
    dnd: {
        draggableItem: 'Draggable item',
        instructions: 'Press Space or Enter to pick up a draggable item. Use Arrow keys to move the item. Press Enter to drop the item in a new position, or press Escape to cancel.'
    }
};
export const DEFAULT_ANNOUNCEMENTS = {
    pickedUp: 'Picked up {label}. Use arrow keys to move, Enter to drop, Escape to cancel.',
    moved: 'Moved {position} {target}. Position {index} of {count}.',
    dropped: 'Dropped {label}. Reorder complete.',
    cancelled: 'Cancelled. {label} returned to original position.',
    atTop: 'At the top of the list',
    atBottom: 'At the bottom of the list',
    atTopLevel: 'Already at the top level',
    noGroupAbove: 'No group above to move into',
    notAGroup: 'Previous item is not a group',
    movedOutOf: 'Moved out of {target}. Now at parent level.',
    movedInto: 'Moved into {target}. Position {index}.',
    touchDragStarted: 'Dragging {label}. Move finger to reposition.',
    groupExpanded: 'Expanded group'
};
export const DEFAULT_SETTINGS = {
    widthExpanded: '280px',
    widthCollapsed: '64px',
    animationDuration: 200,
    persistCollapsed: true,
    persistExpandedGroups: true,
    storageKey: 'sveltekit-sidebar',
    defaultCollapsed: false,
    responsive: DEFAULT_RESPONSIVE_SETTINGS,
    dnd: DEFAULT_DND_SETTINGS,
    labels: DEFAULT_LABELS,
    announcements: DEFAULT_ANNOUNCEMENTS
};
function mergeLabels(labels) {
    return {
        navigation: { ...DEFAULT_LABELS.navigation, ...labels?.navigation },
        trigger: { ...DEFAULT_LABELS.trigger, ...labels?.trigger },
        group: { ...DEFAULT_LABELS.group, ...labels?.group },
        link: { ...DEFAULT_LABELS.link, ...labels?.link },
        dnd: { ...DEFAULT_LABELS.dnd, ...labels?.dnd }
    };
}
export function resolveSidebarSettings(settings) {
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        responsive: { ...DEFAULT_RESPONSIVE_SETTINGS, ...settings?.responsive },
        dnd: {
            ...DEFAULT_DND_SETTINGS,
            ...settings?.dnd,
            keyboard: { ...DEFAULT_KEYBOARD_SHORTCUTS, ...settings?.dnd?.keyboard }
        },
        labels: mergeLabels(settings?.labels),
        announcements: { ...DEFAULT_ANNOUNCEMENTS, ...settings?.announcements }
    };
}
