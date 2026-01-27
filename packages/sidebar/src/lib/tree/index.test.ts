import { describe, expect, it } from 'vitest';
import { buildTreeIndex } from './index.js';
import { findItemById, calculateDepth, isDescendantOf } from './search.js';
import { findPathToItem } from './path.js';

type NodeKind = 'section' | 'group' | 'page';

interface Node {
	id: string;
	kind: NodeKind;
	items?: Node[];
}

const getId = (node: Node) => node.id;
const getItems = (node: Node) => node.items ?? [];
const getKind = (node: Node) => node.kind;

function makeTree(): Node[] {
	return [
		{
			id: 'section-main',
			kind: 'section',
			items: [
				{ id: 'page-home', kind: 'page' },
				{
					id: 'group-guides',
					kind: 'group',
					items: [
						{ id: 'page-intro', kind: 'page' },
						{
							id: 'group-advanced',
							kind: 'group',
							items: [{ id: 'page-deep', kind: 'page' }]
						}
					]
				}
			]
		}
	];
}

describe('tree index integration', () => {
	it('findItemById returns the same result with and without an index', () => {
		const data = makeTree();
		const index = buildTreeIndex({ data, getId, getItems });

		const slow = findItemById({ data, getId, getItems }, 'page-deep');
		const fast = findItemById({ data, getId, getItems, index }, 'page-deep');

		expect(fast).toEqual(slow);
		expect(fast?.parentId).toBe('group-advanced');
		expect(fast?.index).toBe(0);
	});

	it('calculateDepth uses the index when available', () => {
		const data = makeTree();
		const index = buildTreeIndex({ data, getId, getItems });

		const depth = calculateDepth({ data, getId, getItems, index }, 'group-advanced');
		expect(depth).toBe(2);
	});

	it('findPathToItem reconstructs ancestor groups from the index', () => {
		const data = makeTree();
		const index = buildTreeIndex({ data, getId, getItems });

		const path = findPathToItem({ data, getId, getKind, getItems, index }, 'page-deep');
		expect(path).toEqual(['group-guides', 'group-advanced']);
	});

	it('isDescendantOf works via parent-chain traversal when indexed', () => {
		const data = makeTree();
		const index = buildTreeIndex({ data, getId, getItems });

		expect(isDescendantOf({ data, getId, getItems, index }, 'page-deep', 'group-guides')).toBe(true);
		expect(isDescendantOf({ data, getId, getItems, index }, 'group-guides', 'page-deep')).toBe(false);
	});
});
