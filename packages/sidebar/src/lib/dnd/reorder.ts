import type { SidebarReorderEvent, SidebarReorderMode, SidebarSchema } from '../types.js';
import { reorderItems } from '../utils/reorder.js';

export function getEffectiveReorderMode(
	reorderMode: SidebarReorderMode,
	hasExternalHandler: boolean
): Exclude<SidebarReorderMode, 'auto'> {
	if (reorderMode === 'controlled' || reorderMode === 'uncontrolled') {
		return reorderMode;
	}
	return hasExternalHandler ? 'controlled' : 'uncontrolled';
}

export function canReorderInternally<T>(schema: SidebarSchema<T>): boolean {
	return !!schema.getItems && !!schema.setItems;
}

export function applyInternalReorder<T>(options: {
	data: T[];
	event: SidebarReorderEvent<T>;
	schema: SidebarSchema<T>;
	getId: (item: T) => string;
}): T[] {
	const { data, event, schema, getId } = options;
	const getItems = schema.getItems;
	const setItems = schema.setItems;

	if (!getItems || !setItems) {
		return data;
	}

	return reorderItems(data, event, {
		getId,
		getItems,
		setItems
	});
}
