/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE_NAME = `sandhan-cache-${version}`;
const ASSETS_TO_CACHE = [...build, ...files];

self.addEventListener('install', (event: any) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS_TO_CACHE))
			.then(() => (self as any).skipWaiting())
	);
});

self.addEventListener('activate', (event: any) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE_NAME) {
					await caches.delete(key);
				}
			}
			await (self as any).clients.claim();
		})
	);
});

self.addEventListener('fetch', (event: any) => {
	const url = new URL(event.request.url);

	// Don't cache dynamic search API calls
	if (url.pathname.startsWith('/api/')) {
		return;
	}

	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
				return cached;
			}
			return fetch(event.request)
				.then((response) => {
					if (response.status === 200 && event.request.url.startsWith('http')) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
					}
					return response;
				})
				.catch(() => {
					return caches.match('/');
				});
		})
	);
});
