import type { Snippet } from 'svelte';
import type { SidebarConfig, SidebarSettings, SidebarEvents, SidebarSchema, SidebarReorderMode, SidebarRenderContext, SidebarReorderEvent, DropPosition } from '../types.js';
declare function $$render<T>(): {
    props: {
        data?: T[];
        schema?: SidebarSchema<T>;
        settings?: SidebarSettings;
        config?: SidebarConfig;
        page?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
        group?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
        section?: Snippet<[item: T, ctx: SidebarRenderContext<T>, children: Snippet]>;
        events?: SidebarEvents;
        class?: string;
        /** Current active pathname/href. Provide this to decouple from SvelteKit routing. */
        activeHref?: string;
        header?: Snippet;
        footer?: Snippet;
        children?: Snippet;
        /** Custom mobile trigger snippet - rendered outside the sidebar for opening drawer */
        mobileTrigger?: Snippet;
        draggable?: boolean;
        onReorder?: (event: SidebarReorderEvent<T>) => void;
        /** Reorder mode. Defaults to 'auto'. */
        reorderMode?: SidebarReorderMode;
        /** Custom drag preview snippet - receives the item being dragged and its render context */
        dragPreview?: Snippet<[item: T, ctx: SidebarRenderContext<T>]>;
        /** Custom drop indicator snippet. Falls back to built-in faded item preview. */
        dropIndicator?: Snippet<[position: DropPosition, draggedLabel: string]>;
        /** Show live preview (items move during drag). Set to false to use custom drop indicators only. Default: true */
        livePreview?: boolean;
        /** Enable smooth animations when items reorder (default: true) */
        animated?: boolean;
    };
    exports: {};
    bindings: "";
    slots: {};
    events: {};
};
declare class __sveltets_Render<T> {
    props(): ReturnType<typeof $$render<T>>['props'];
    events(): ReturnType<typeof $$render<T>>['events'];
    slots(): ReturnType<typeof $$render<T>>['slots'];
    bindings(): "";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <T>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<T>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<T>['props']>, ReturnType<__sveltets_Render<T>['events']>, ReturnType<__sveltets_Render<T>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<T>['bindings']>;
    } & ReturnType<__sveltets_Render<T>['exports']>;
    <T>(internal: unknown, props: ReturnType<__sveltets_Render<T>['props']> & {}): ReturnType<__sveltets_Render<T>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const Sidebar: $$IsomorphicComponent;
type Sidebar<T> = InstanceType<typeof Sidebar<T>>;
export default Sidebar;
