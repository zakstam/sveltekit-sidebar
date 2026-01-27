import type { DropPosition, ItemKind } from '../types.js';
import type { PreviewDraggedItem } from './preview.js';

export function computeEffectiveParentId(options: {
	draggedKind: ItemKind;
	targetKind: ItemKind;
	targetId: string;
	targetParentId: string | null;
	position: DropPosition;
}): string | null {
	const { draggedKind, targetKind, targetId, targetParentId, position } = options;

	if (draggedKind === 'section' && targetKind === 'section') {
		return null;
	}
	if (position === 'inside' && (targetKind === 'group' || targetKind === 'section')) {
		return targetId;
	}
	if (position === 'before' || position === 'after') {
		return targetParentId;
	}
	return targetParentId;
}

export function isValidDropTarget(options: {
	draggedItem: PreviewDraggedItem<unknown> | null;
	draggedKind: ItemKind | null;
	targetId: string;
	targetKind: ItemKind;
	targetParentId: string | null;
	position: DropPosition;
	isDescendant: (targetId: string, ancestorId: string) => boolean;
}): boolean {
	const { draggedItem, draggedKind, targetId, targetKind, targetParentId, position, isDescendant } =
		options;
	if (!draggedItem || !draggedKind) return true;

	const effectiveParentId = computeEffectiveParentId({
		draggedKind,
		targetKind,
		targetId,
		targetParentId,
		position
	});

	// Sections can only be dropped at root level
	if (draggedKind === 'section' && effectiveParentId !== null) {
		return false;
	}

	// Prevent dropping on self or descendant
	if (isDescendant(targetId, draggedItem.id)) {
		return false;
	}

	return true;
}
