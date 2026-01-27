import type { ItemKind } from '../types.js';

export interface InitialExpansionDeps<T> {
	data: T[];
	getId: (item: T) => string;
	getKind: (item: T) => ItemKind;
	getItems: (item: T) => T[];
	getDefaultExpanded?: (item: T) => boolean;
}

export function getInitialExpandedGroups<T>(deps: InitialExpansionDeps<T>): Record<string, boolean> {
	const { data, getId, getKind, getItems, getDefaultExpanded } = deps;
	const expanded: Record<string, boolean> = {};
	const visitedIds = new Set<string>();

	const processItems = (items: T[]): void => {
		for (const item of items) {
			const id = getId(item);

			// Prevent infinite recursion on cycles
			if (visitedIds.has(id)) {
				continue;
			}
			visitedIds.add(id);

			const kind = getKind(item);
			if (kind === 'group') {
				if (getDefaultExpanded?.(item)) {
					expanded[id] = true;
				}
				const children = getItems(item);
				if (children.length > 0) {
					processItems(children);
				}
			} else if (kind === 'section') {
				const children = getItems(item);
				if (children.length > 0) {
					processItems(children);
				}
			}
		}
	};

	processItems(data);

	return expanded;
}
