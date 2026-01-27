import type { SidebarAnnouncements, SidebarDnDSettings, SidebarKeyboardShortcuts, SidebarLabels, SidebarResponsiveSettings, SidebarSettings } from '../types.js';
export declare const DEFAULT_RESPONSIVE_SETTINGS: Required<SidebarResponsiveSettings>;
export declare const DEFAULT_KEYBOARD_SHORTCUTS: Required<SidebarKeyboardShortcuts>;
export declare const DEFAULT_DND_SETTINGS: Required<Omit<SidebarDnDSettings, 'keyboard'>> & {
    keyboard: Required<SidebarKeyboardShortcuts>;
};
export declare const DEFAULT_LABELS: Required<{
    navigation: Required<NonNullable<SidebarLabels['navigation']>>;
    trigger: Required<NonNullable<SidebarLabels['trigger']>>;
    group: Required<NonNullable<SidebarLabels['group']>>;
    link: Required<NonNullable<SidebarLabels['link']>>;
    dnd: Required<NonNullable<SidebarLabels['dnd']>>;
}>;
export declare const DEFAULT_ANNOUNCEMENTS: Required<SidebarAnnouncements>;
export type SidebarResolvedSettings = Required<Omit<SidebarSettings, 'responsive' | 'dnd' | 'labels' | 'announcements'>> & {
    responsive: Required<SidebarResponsiveSettings>;
    dnd: Required<Omit<SidebarDnDSettings, 'keyboard'>> & {
        keyboard: Required<SidebarKeyboardShortcuts>;
    };
    labels: typeof DEFAULT_LABELS;
    announcements: Required<SidebarAnnouncements>;
};
export declare const DEFAULT_SETTINGS: SidebarResolvedSettings;
export declare function resolveSidebarSettings(settings: SidebarSettings | undefined): SidebarResolvedSettings;
