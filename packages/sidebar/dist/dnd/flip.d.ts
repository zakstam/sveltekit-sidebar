export declare class FlipController {
    #private;
    get isAnimating(): boolean;
    capture(container: HTMLElement | null): void;
    animate(options: {
        container: HTMLElement | null;
        enabled: boolean;
        durationMs: number;
    }): void;
}
