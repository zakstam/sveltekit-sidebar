import type { TreeIndex } from './index.js';

export interface TreeSearchDeps<T> {
	data: T[];
	getId: (item: T) => string;
	getItems: (item: T) => T[];
	index?: TreeIndex<T>;
}

export function findItemById<T>(
	deps: TreeSearchDeps<T>,
	targetId: string
): { item: T; parentId: string | null; index: number } | null {
	const { data, getId, getItems, index } = deps;

	if (index) {
		const entry = index.entries.get(targetId);
		if (!entry) return null;
		return { item: entry.item, parentId: entry.parentId, index: entry.index };
	}

	const search = (
		items: T[],
		parentId: string | null
	): { item: T; parentId: string | null; index: number } | null => {
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (getId(item) === targetId) {
				return { item, parentId, index: i };
			}
			const children = getItems(item);
			if (children.length) {
				const found = search(children, getId(item));
				if (found) return found;
			}
		}
		return null;
	};

	return search(data, null);
}

export function calculateDepth<T>(
	deps: TreeSearchDeps<T>,
	parentId: string | null
): number {
	if (parentId === null) return 0;
	if (deps.index) {
		const entry = deps.index.entries.get(parentId);
		if (!entry) return 0;
		return entry.depth;
	}

	let depth = 1;
	let currentId: string | null = parentId;

	while (currentId) {
		const info: { item: T; parentId: string | null; index: number } | null = findItemById(
			deps,
			currentId
		);
		if (!info || !info.parentId) break;
		currentId = info.parentId;
		depth++;
	}

	return depth;
}

export function containsId<T>(
	deps: TreeSearchDeps<T>,
	items: T[],
	targetId: string
): boolean {
	const { getId, getItems } = deps;
	for (const item of items) {
		if (getId(item) === targetId) return true;
		const children = getItems(item);
		if (children.length && containsId(deps, children, targetId)) return true;
	}
	return false;
}

export function isDescendantOf<T>(
	deps: TreeSearchDeps<T>,
	targetId: string,
	ancestorId: string
): boolean {
	if (targetId === ancestorId) return true;
	if (deps.index) {
		const visited = new Set<string>();
		let currentId: string | null = targetId;
		while (currentId && !visited.has(currentId)) {
			visited.add(currentId);
			const entry = deps.index.entries.get(currentId);
			if (!entry) return false;
			if (entry.parentId === ancestorId) return true;
			currentId = entry.parentId;
		}
		return false;
	}

	const { data, getId, getItems } = deps;

	const findInChildren = (items: T[]): boolean => {
		for (const item of items) {
			if (getId(item) === ancestorId) {
				return containsId(deps, getItems(item), targetId);
			}
			const children = getItems(item);
			if (children.length && findInChildren(children)) return true;
		}
		return false;
	};

	return findInChildren(data);
}
