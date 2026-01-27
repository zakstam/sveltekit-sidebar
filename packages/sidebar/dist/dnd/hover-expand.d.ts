export declare class HoverExpandController {
    #private;
    get targetId(): string | null;
    start(options: {
        groupId: string;
        delayMs: number;
        isExpanded: (groupId: string) => boolean;
        onExpand: (groupId: string) => void;
    }): void;
    cancel(): void;
}
