import type { SidebarResponsiveMode, SidebarResponsiveSettings } from '../types.js';

export interface ResponsiveController {
	mobileMediaQuery: MediaQueryList;
	tabletMediaQuery: MediaQueryList;
	mobileQueryHandler: (e: MediaQueryListEvent) => void;
	tabletQueryHandler: (e: MediaQueryListEvent) => void;
	cleanup: () => void;
}

function resolveMode(
	mobileMediaQuery: MediaQueryList,
	tabletMediaQuery: MediaQueryList
): SidebarResponsiveMode {
	if (mobileMediaQuery.matches) return 'mobile';
	if (tabletMediaQuery.matches) return 'tablet';
	return 'desktop';
}

export function createResponsiveController(options: {
	responsive: Required<SidebarResponsiveSettings>;
	onModeChange: (mode: SidebarResponsiveMode) => void;
	onEscapeKeyDown?: (e: KeyboardEvent) => void;
}): ResponsiveController | null {
	if (typeof window === 'undefined') return null;
	if (!options.responsive.enabled) return null;

	const { mobileBreakpoint, tabletBreakpoint, closeOnEscape } = options.responsive;

	// Defensive: ensure breakpoints are valid and ordered.
	const safeMobileBreakpoint = Math.max(1, Math.floor(mobileBreakpoint));
	const safeTabletBreakpoint = Math.max(safeMobileBreakpoint + 1, Math.floor(tabletBreakpoint));

	const mobileMediaQuery = window.matchMedia(`(max-width: ${safeMobileBreakpoint - 1}px)`);
	const tabletMediaQuery = window.matchMedia(
		`(min-width: ${safeMobileBreakpoint}px) and (max-width: ${safeTabletBreakpoint - 1}px)`
	);

	const mobileQueryHandler = (e: MediaQueryListEvent) => {
		if (e.matches) {
			options.onModeChange('mobile');
			return;
		}
		options.onModeChange(resolveMode(mobileMediaQuery, tabletMediaQuery));
	};

	const tabletQueryHandler = (e: MediaQueryListEvent) => {
		if (e.matches) {
			options.onModeChange('tablet');
			return;
		}
		if (!mobileMediaQuery.matches) {
			options.onModeChange('desktop');
		}
	};

	mobileMediaQuery.addEventListener('change', mobileQueryHandler);
	tabletMediaQuery.addEventListener('change', tabletQueryHandler);

	// Set initial mode based on current viewport
	options.onModeChange(resolveMode(mobileMediaQuery, tabletMediaQuery));

	if (closeOnEscape && options.onEscapeKeyDown) {
		document.addEventListener('keydown', options.onEscapeKeyDown);
	}

	const cleanup = () => {
		mobileMediaQuery.removeEventListener('change', mobileQueryHandler);
		tabletMediaQuery.removeEventListener('change', tabletQueryHandler);
		if (closeOnEscape && options.onEscapeKeyDown) {
			document.removeEventListener('keydown', options.onEscapeKeyDown);
		}
	};

	return {
		mobileMediaQuery,
		tabletMediaQuery,
		mobileQueryHandler,
		tabletQueryHandler,
		cleanup
	};
}
