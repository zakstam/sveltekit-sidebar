export class AutoScrollController {
    #animationId = null;
    handleDrag(options) {
        const { clientY, container, threshold, maxSpeed } = options;
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        const topDistance = clientY - rect.top;
        const bottomDistance = rect.bottom - clientY;
        let scrollSpeed = 0;
        if (topDistance < threshold) {
            const intensity = 1 - topDistance / threshold;
            scrollSpeed = -maxSpeed * intensity;
        }
        else if (bottomDistance < threshold) {
            const intensity = 1 - bottomDistance / threshold;
            scrollSpeed = maxSpeed * intensity;
        }
        if (scrollSpeed !== 0) {
            this.start(container, scrollSpeed);
        }
        else {
            this.stop();
        }
    }
    start(container, speed) {
        if (this.#animationId !== null) {
            cancelAnimationFrame(this.#animationId);
        }
        const scroll = () => {
            container.scrollTop += speed;
            this.#animationId = requestAnimationFrame(scroll);
        };
        this.#animationId = requestAnimationFrame(scroll);
    }
    stop() {
        if (this.#animationId !== null) {
            cancelAnimationFrame(this.#animationId);
            this.#animationId = null;
        }
    }
}
