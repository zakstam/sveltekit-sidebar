import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sidebarSrc = path.resolve(__dirname, '../../packages/sidebar/src/lib');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			// Resolve the local package source in the docs app without a build step.
			'sveltekit-sidebar': path.join(sidebarSrc, 'index.ts'),
			'sveltekit-sidebar/styles': path.join(sidebarSrc, 'styles/index.css')
		}
	}
};

export default config;
