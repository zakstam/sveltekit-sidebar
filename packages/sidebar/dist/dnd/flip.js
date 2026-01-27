export class FlipController {
    #itemPositions = new Map();
    #isAnimating = false;
    get isAnimating() {
        return this.#isAnimating;
    }
    capture(container) {
        this.#itemPositions.clear();
        const scope = container ?? document;
        const items = scope.querySelectorAll('[data-sidebar-item-id]');
        items.forEach((element) => {
            const id = element.getAttribute('data-sidebar-item-id');
            if (id) {
                this.#itemPositions.set(id, element.getBoundingClientRect());
            }
        });
    }
    animate(options) {
        const { container, enabled, durationMs } = options;
        if (!enabled || this.#isAnimating || this.#itemPositions.size === 0)
            return;
        this.#isAnimating = true;
        const scope = container ?? document;
        const items = scope.querySelectorAll('[data-sidebar-item-id]');
        items.forEach((element) => {
            const id = element.getAttribute('data-sidebar-item-id');
            if (!id)
                return;
            const oldRect = this.#itemPositions.get(id);
            if (!oldRect)
                return;
            const newRect = element.getBoundingClientRect();
            const deltaX = oldRect.left - newRect.left;
            const deltaY = oldRect.top - newRect.top;
            if (deltaX === 0 && deltaY === 0)
                return;
            const el = element;
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            el.style.transition = 'none';
            void el.offsetHeight;
            el.style.transition = `transform ${durationMs}ms ease-out`;
            el.style.transform = '';
            const cleanup = () => {
                el.style.transition = '';
                el.style.transform = '';
                el.removeEventListener('transitionend', cleanup);
            };
            el.addEventListener('transitionend', cleanup);
        });
        setTimeout(() => {
            this.#itemPositions.clear();
            this.#isAnimating = false;
        }, durationMs);
    }
}
