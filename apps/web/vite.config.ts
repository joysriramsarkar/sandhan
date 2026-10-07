import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		host: true,
		// Self-hosted deployments sit behind arbitrary proxies/domains — never
		// reject a request because of its Host header.
		allowedHosts: true
	},
	preview: {
		port: 4173,
		host: true,
		allowedHosts: true
	}
});
