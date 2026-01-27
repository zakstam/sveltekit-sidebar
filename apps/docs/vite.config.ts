import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
const sidebarSrc = new URL('../../packages/sidebar/src/lib/', import.meta.url);
const sidebarIndex = new URL('index.ts', sidebarSrc).pathname;
const sidebarStyles = new URL('styles/index.css', sidebarSrc).pathname;

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Source-only local development:
		// bundle SSR deps so we never hand `.css` imports off to Node.
		noExternal: true
	},
	resolve: {
		// Order matters: put the subpath alias before the package root alias.
		alias: [
			{
				find: 'sveltekit-sidebar/styles',
				replacement: sidebarStyles
			},
			{
				find: 'sveltekit-sidebar',
				replacement: sidebarIndex
			}
		]
	}
});
