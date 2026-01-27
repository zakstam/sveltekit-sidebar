import { flushSync } from 'svelte';
import type {
	DropPosition,
	SidebarDnDState,
	SidebarLabels,
	SidebarReorderEvent,
	ItemKind,
	KeyboardDragState,
	PointerDragState
} from '../types.js';

export interface DraggedItemState<T> {
	id: string;
	item: T;
	parentId: string | null;
	index: number;
}

export interface DnDHandlerDeps<T> {
	// State
	dndEnabled: boolean;
	labels: Required<{
		navigation: Required<NonNullable<SidebarLabels['navigation']>>;
		trigger: Required<NonNullable<SidebarLabels['trigger']>>;
		group: Required<NonNullable<SidebarLabels['group']>>;
		link: Required<NonNullable<SidebarLabels['link']>>;
		dnd: Required<NonNullable<SidebarLabels['dnd']>>;
	}>;
	announcement: string;
	draggedItem: DraggedItemState<T> | null;
	keyboardDragState: KeyboardDragState<T> | null;
	pointerDragState: PointerDragState<T> | null;
	dropTargetId: string | null;
	dropPosition: DropPosition | null;

	// Getters
	getLabel: (item: T) => string;
	isPreviewItem: (id: string) => boolean;
	getDragPreviewElement: () => HTMLElement | null;
	getScrollContainer: () => HTMLElement | null;
	getHoverExpandTargetId: () => string | null;

	// Commands
	setDraggedItem: (value: DraggedItemState<T> | null) => void;
	startDrag: (item: T, parentId: string | null, index: number) => void;
	endDrag: (animate?: boolean) => void;
	handleKeyDown: (
		e: KeyboardEvent,
		item: T,
		parentId: string | null,
		index: number,
		depth: number
	) => void;
	handlePointerDown: (e: PointerEvent, item: T, parentId: string | null, index: number) => void;
	setDropTarget: (item: T, parentId: string | null, e: DragEvent) => void;
	handleDrop: (item: T, parentId: string | null, index: number, depth: number) => void;
	findItemById: (id: string) => { item: T; parentId: string | null; index: number } | null;
	calculateDepth: (parentId: string | null) => number;
	cancelHoverExpandTimer: () => void;
}

export function createDnDState<T>(options: {
	item: T;
	id: string;
	kind: ItemKind;
	parentId: string | null;
	index: number;
	depth: number;
	hasCustomDropIndicator: boolean;
	deps: DnDHandlerDeps<T>;
}): SidebarDnDState {
	const { item, id, kind, parentId, index, depth, hasCustomDropIndicator, deps } = options;

	const isKeyboardDragging = deps.keyboardDragState?.id === id;
	const isPointerDragging = deps.pointerDragState?.id === id && deps.pointerDragState.isDragging;
	const isDropTarget = deps.dropTargetId === id;
	const isPreview = hasCustomDropIndicator ? false : deps.isPreviewItem(id);

	return {
		enabled: deps.dndEnabled,
		isDragging: deps.draggedItem?.id === id,
		isKeyboardDragging,
		isPointerDragging,
		isDropTarget,
		dropPosition: isDropTarget ? deps.dropPosition : null,
		draggedLabel: deps.draggedItem ? deps.getLabel(deps.draggedItem.item) : null,
		isPreview,
		handleProps: {
			draggable: deps.dndEnabled && !isKeyboardDragging,
			tabIndex: deps.dndEnabled ? 0 : -1,
			role: 'button',
			'aria-roledescription': deps.labels.dnd.draggableItem,
			'aria-describedby': 'sidebar-dnd-instructions',
			'aria-pressed': isKeyboardDragging ? true : undefined,
			'aria-grabbed': deps.draggedItem?.id === id || isKeyboardDragging ? true : undefined,
			style: deps.dndEnabled ? 'touch-action: none;' : undefined,
			onmousedown: () => {
				// Pre-set draggedItem on mousedown so the preview can render before dragstart
				// Use flushSync to force synchronous DOM update before dragstart fires
				if (deps.dndEnabled && !deps.draggedItem) {
					flushSync(() => {
						deps.setDraggedItem({ id, item, parentId, index });
					});
				}
			},
			ondragstart: (e: DragEvent) => {
				e.dataTransfer?.setData('text/plain', id);
				// draggedItem is already set from mousedown, just ensure it's correct
				if (!deps.draggedItem || deps.draggedItem.id !== id) {
					deps.startDrag(item, parentId, index);
				}
				// Use custom drag preview if available
				// Query DOM directly since $effect may not have synced yet
				const preview =
					deps.getDragPreviewElement() ??
					(deps.getScrollContainer()
						?.closest('.sidebar')
						?.parentElement?.querySelector('.sidebar-drag-preview') as HTMLElement | null);
				if (preview && e.dataTransfer) {
					// Use the center of the preview as the drag point
					const rect = preview.getBoundingClientRect();
					e.dataTransfer.setDragImage(preview, rect.width / 2, rect.height / 2);
				}
			},
			ondragend: () => {
				// Defer cleanup to allow ondrop to fire first
				// If draggedItem is still set but we have a valid drop target, trigger the drop manually
				// (workaround for browsers not firing ondrop in some edge cases)
				setTimeout(() => {
					if (deps.draggedItem && deps.dropTargetId && deps.dropPosition) {
						const targetInfo = deps.findItemById(deps.dropTargetId);
						if (targetInfo) {
							const targetDepth = deps.calculateDepth(targetInfo.parentId);
							deps.handleDrop(targetInfo.item, targetInfo.parentId, targetInfo.index, targetDepth);
							return;
						}
					}
					const wasCancelled = deps.draggedItem !== null;
					deps.endDrag(wasCancelled);
				}, 0);
			},
			onkeydown: (e: KeyboardEvent) => {
				deps.handleKeyDown(e, item, parentId, index, depth);
			},
			onpointerdown: (e: PointerEvent) => {
				deps.handlePointerDown(e, item, parentId, index);
			}
		},
		dropZoneProps: {
			'data-sidebar-item-id': id,
			'data-sidebar-item-kind': kind,
			ondragover: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				deps.setDropTarget(item, parentId, e);
			},
			ondragleave: () => {
				// Don't clear dropTargetId here. During live preview, Svelte may
				// reorder DOM elements which triggers spurious ondragleave events
				// (the element moved, not the cursor). The container-level ondragleave
				// handles the case where the cursor actually leaves the sidebar.
				// The next ondragover (on an item or the container) will update the target.
				if (deps.getHoverExpandTargetId() === id) {
					deps.cancelHoverExpandTimer();
				}
			},
			ondrop: (e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				deps.handleDrop(item, parentId, index, depth);
			}
		},
		keyboard: {
			isActive: isKeyboardDragging,
			announcement: isKeyboardDragging ? deps.announcement : ''
		}
	};
}
