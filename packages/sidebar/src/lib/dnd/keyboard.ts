import type {
	ItemKind,
	KeyboardDragState,
	SidebarAnnouncements,
	SidebarReorderEvent
} from '../types.js';
import type { PreviewDraggedItem, PreviewInsertPosition } from './preview.js';

export interface KeyboardDeps<T> {
	getId: (item: T) => string;
	getLabel: (item: T) => string;
	getKind: (item: T) => ItemKind;
	getItems: (item: T) => T[];
	getSiblingsAtLevel: (parentId: string | null) => T[];
	findItemById: (id: string) => { item: T; parentId: string | null; index: number } | null;
	isGroupExpanded: (id: string) => boolean;
	setGroupExpandedDirect: (id: string, expanded: boolean) => void;
	captureItemPositions: () => void;
	animateItemPositions: () => void;
	announcements: Required<SidebarAnnouncements>;
	formatAnnouncement: (template: string, values: Record<string, string | number>) => string;
	setAnnouncement: (value: string) => void;
	getKeyboardDragState: () => KeyboardDragState<T> | null;
	setKeyboardDragState: (value: KeyboardDragState<T> | null) => void;
	setDraggedItem: (value: PreviewDraggedItem<T> | null) => void;
	setPreviewInsert: (value: PreviewInsertPosition | null) => void;
}

export function pickUpItem<T>(deps: KeyboardDeps<T>, item: T, parentId: string | null, index: number): void {
	const id = deps.getId(item);
	const siblings = deps.getSiblingsAtLevel(parentId);

	deps.setDraggedItem({ id, item, parentId, index });
	deps.setKeyboardDragState({
		item,
		id,
		originalParentId: parentId,
		originalIndex: index,
		currentIndex: index,
		currentParentId: parentId,
		siblings
	});
	deps.setPreviewInsert({ parentId, index });

	const label = deps.getLabel(item);
	deps.setAnnouncement(deps.formatAnnouncement(deps.announcements.pickedUp, { label }));
}

export function movePickedUpItem<T>(deps: KeyboardDeps<T>, direction: -1 | 1): void {
	const state = deps.getKeyboardDragState();
	if (!state) return;

	const { currentIndex, siblings, currentParentId } = state;
	const newIndex = currentIndex + direction;

	if (newIndex < 0 || newIndex >= siblings.length) {
		deps.setAnnouncement(direction === -1 ? deps.announcements.atTop : deps.announcements.atBottom);
		return;
	}

	deps.captureItemPositions();
	state.currentIndex = newIndex;
	deps.setPreviewInsert({ parentId: currentParentId, index: newIndex });

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			deps.animateItemPositions();
		});
	});

	const targetItem = siblings[newIndex];
	const targetLabel = deps.getLabel(targetItem);
	const position = direction === -1 ? 'before' : 'after';
	deps.setAnnouncement(
		deps.formatAnnouncement(deps.announcements.moved, {
			position,
			target: targetLabel,
			index: newIndex + 1,
			count: siblings.length
		})
	);
}

export function movePickedUpItemToParent<T>(deps: KeyboardDeps<T>): void {
	const state = deps.getKeyboardDragState();
	if (!state || !state.currentParentId) {
		deps.setAnnouncement(deps.announcements.atTopLevel);
		return;
	}

	const parentInfo = deps.findItemById(state.currentParentId);
	if (!parentInfo) return;

	const { parentId: grandparentId, index: parentIndex } = parentInfo;
	const newSiblings = deps.getSiblingsAtLevel(grandparentId);
	const newIndex = parentIndex + 1;

	deps.captureItemPositions();
	state.currentParentId = grandparentId;
	state.currentIndex = newIndex;
	state.siblings = newSiblings;
	deps.setPreviewInsert({ parentId: grandparentId, index: newIndex });

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			deps.animateItemPositions();
		});
	});

	const parentLabel = deps.getLabel(parentInfo.item);
	deps.setAnnouncement(deps.formatAnnouncement(deps.announcements.movedOutOf, { target: parentLabel }));
}

export function movePickedUpItemIntoGroup<T>(deps: KeyboardDeps<T>): void {
	const state = deps.getKeyboardDragState();
	if (!state) return;

	const { currentIndex, siblings } = state;

	if (currentIndex <= 0) {
		deps.setAnnouncement(deps.announcements.noGroupAbove);
		return;
	}

	const prevSibling = siblings[currentIndex - 1];
	if (deps.getKind(prevSibling) !== 'group') {
		deps.setAnnouncement(deps.announcements.notAGroup);
		return;
	}

	const groupId = deps.getId(prevSibling);
	const groupLabel = deps.getLabel(prevSibling);
	const groupChildren = deps.getItems(prevSibling);
	const newIndex = groupChildren.length;

	if (!deps.isGroupExpanded(groupId)) {
		deps.setGroupExpandedDirect(groupId, true);
	}

	deps.captureItemPositions();
	state.currentParentId = groupId;
	state.currentIndex = newIndex;
	state.siblings = [...groupChildren];
	deps.setPreviewInsert({ parentId: groupId, index: newIndex });

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			deps.animateItemPositions();
		});
	});

	deps.setAnnouncement(
		deps.formatAnnouncement(deps.announcements.movedInto, {
			target: groupLabel,
			index: groupChildren.length + 1
		})
	);
}

export function cancelKeyboardDrag<T>(deps: KeyboardDeps<T>): void {
	const state = deps.getKeyboardDragState();
	if (!state) return;

	const label = deps.getLabel(state.item);
	deps.captureItemPositions();
	deps.setAnnouncement(deps.formatAnnouncement(deps.announcements.cancelled, { label }));
	deps.setKeyboardDragState(null);
	deps.setDraggedItem(null);
	deps.setPreviewInsert(null);
	requestAnimationFrame(() => deps.animateItemPositions());
}
