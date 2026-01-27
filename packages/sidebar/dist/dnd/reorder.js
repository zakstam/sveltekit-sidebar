import { reorderItems } from '../utils/reorder.js';
export function getEffectiveReorderMode(reorderMode, hasExternalHandler) {
    if (reorderMode === 'controlled' || reorderMode === 'uncontrolled') {
        return reorderMode;
    }
    return hasExternalHandler ? 'controlled' : 'uncontrolled';
}
export function canReorderInternally(schema) {
    return !!schema.getItems && !!schema.setItems;
}
export function applyInternalReorder(options) {
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
