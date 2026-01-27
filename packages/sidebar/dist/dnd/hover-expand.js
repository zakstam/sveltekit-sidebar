export class HoverExpandController {
    #timerId = null;
    #targetId = null;
    get targetId() {
        return this.#targetId;
    }
    start(options) {
        const { groupId, delayMs, isExpanded, onExpand } = options;
        if (this.#targetId === groupId)
            return;
        this.cancel();
        this.#targetId = groupId;
        this.#timerId = setTimeout(() => {
            if (this.#targetId === groupId && !isExpanded(groupId)) {
                onExpand(groupId);
            }
            this.#timerId = null;
            this.#targetId = null;
        }, delayMs);
    }
    cancel() {
        if (this.#timerId !== null) {
            clearTimeout(this.#timerId);
            this.#timerId = null;
        }
        this.#targetId = null;
    }
}
