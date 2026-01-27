export declare class AutoScrollController {
    #private;
    handleDrag(options: {
        clientY: number;
        container: HTMLElement | null;
        threshold: number;
        maxSpeed: number;
    }): void;
    start(container: HTMLElement, speed: number): void;
    stop(): void;
}
