import type { SidebarResponsiveMode, SidebarResponsiveSettings } from '../types.js';
export interface ResponsiveController {
    mobileMediaQuery: MediaQueryList;
    tabletMediaQuery: MediaQueryList;
    mobileQueryHandler: (e: MediaQueryListEvent) => void;
    tabletQueryHandler: (e: MediaQueryListEvent) => void;
    cleanup: () => void;
}
export declare function createResponsiveController(options: {
    responsive: Required<SidebarResponsiveSettings>;
    onModeChange: (mode: SidebarResponsiveMode) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
}): ResponsiveController | null;
