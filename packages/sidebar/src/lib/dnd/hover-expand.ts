export class HoverExpandController {
	#timerId: ReturnType<typeof setTimeout> | null = null;
	#targetId: string | null = null;

	get targetId(): string | null {
		return this.#targetId;
	}

	start(options: {
		groupId: string;
		delayMs: number;
		isExpanded: (groupId: string) => boolean;
		onExpand: (groupId: string) => void;
	}): void {
		const { groupId, delayMs, isExpanded, onExpand } = options;
		if (this.#targetId === groupId) return;

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

	cancel(): void {
		if (this.#timerId !== null) {
			clearTimeout(this.#timerId);
			this.#timerId = null;
		}
		this.#targetId = null;
	}
}
