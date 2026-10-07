import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Pinned explicitly instead of using `adapter-auto`: the auto adapter installs
		// `@sveltejs/adapter-vercel@4` at build time, which only knows `nodejs18.x` /
		// `nodejs20.x` and fails the Vercel build with
		// "Unsupported Node.js version: v24.x.y" now that the project builds on Node 24.
		// `nodejs24.x` matches the `engines` field in package.json and .nvmrc.
		adapter: adapter({ runtime: 'nodejs24.x' })
	}
};

export default config;
