export interface TreeIndexEntry<T> {
	item: T;
	parentId: string | null;
	depth: number;
	index: number;
}

export interface TreeIndex<T> {
	entries: Map<string, TreeIndexEntry<T>>;
}

export interface TreeIndexDeps<T> {
	data: T[];
	getId: (item: T) => string;
	getItems: (item: T) => T[];
}

export function buildTreeIndex<T>(deps: TreeIndexDeps<T>): TreeIndex<T> {
	const { data, getId, getItems } = deps;
	const entries = new Map<string, TreeIndexEntry<T>>();
	const visited = new Set<string>();

	const walk = (items: T[], parentId: string | null, depth: number): void => {
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const id = getId(item);

			// Prevent infinite recursion on cycles; keep the first-seen entry.
			if (visited.has(id)) continue;
			visited.add(id);

			entries.set(id, { item, parentId, depth, index: i });

			const children = getItems(item);
			if (children.length > 0) {
				walk(children, id, depth + 1);
			}
		}
	};

	walk(data, null, 0);

	return { entries };
}
