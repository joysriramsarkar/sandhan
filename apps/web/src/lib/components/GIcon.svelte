<script lang="ts">
	/**
	 * Google-style Material icon set (inline SVG, no third-party requests).
	 */
	import type { GIconName } from './icons';

	export let name: GIconName = 'search';
	export let size = 20;
</script>

{#if name === 'search'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path
			d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
		/>
	</svg>
{:else if name === 'mic'}
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path fill="#4285f4" d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" />
		<path fill="#34a853" d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
		<path fill="#ea4335" d="M12 3c-1.66 0-3 1.34-3 3h6c0-1.66-1.34-3-3-3z" />
	</svg>
{:else if name === 'lens'}
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="#4285f4"
			d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"
		/>
		<path
			fill="#34a853"
			d="M9 3a1.5 1.5 0 0 0-1.4 1H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1.6A1.5 1.5 0 0 0 15 3zM5 7.6A1.6 1.6 0 0 1 6.6 6h1.2L8.4 4.8h7.2L16.2 6h1.2A1.6 1.6 0 0 1 19 7.6v9.8a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 17.4z"
		/>
		<path fill="#fbbc05" d="M3 7a3 3 0 0 1 3-3h2.4L8.4 5H6.6A1.6 1.6 0 0 0 5 6.6V10H3z" />
		<path fill="#ea4335" d="M21 17a3 3 0 0 1-3 3h-2.4l1-1h1.4A1.6 1.6 0 0 0 19 17.4V14h2z" />
	</svg>
{:else if name === 'ai'}
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path fill="#4285f4" d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
		<path fill="#ea4335" d="M19 14l.95 2.8L22.75 17.75l-2.8.95L19 21.5l-.95-2.8-2.8-.95 2.8-.95z" />
		<path fill="#fbbc05" d="M6 15.5l.7 2.05 2.05.7-2.05.7L6 21l-.7-2.05-2.05-.7 2.05-.7z" />
	</svg>
{:else if name === 'sparkle'}
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="#4285f4"
			d="M10.5 2.5l1.65 4.85L17 9l-4.85 1.65L10.5 15.5 8.85 10.65 4 9l4.85-1.65z"
		/>
		<path fill="#ea4335" d="M17.5 13l1 2.9 2.9 1-2.9 1-1 2.9-1-2.9-2.9-1 2.9-1z" />
	</svg>
{:else if name === 'apps'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM6 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM6 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
	</svg>
{:else if name === 'avatar'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 4.5V21h16v-2.5c0-2.8-4.7-4.5-8-4.5z" />
	</svg>
{:else if name === 'chevron-down'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
	</svg>
{:else if name === 'chevron-right'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M9.29 6.71a.996.996 0 0 0 0 1.41L13.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.7 6.7a.996.996 0 0 0-1.41.01z" />
	</svg>
{:else if name === 'arrow-right'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
	</svg>
{:else if name === 'close'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
	</svg>
{:else if name === 'clock'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.1.8-1.3-4.5-2.7z" />
	</svg>
{:else if name === 'images'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V6h16zM8.5 12.5 5 17h14l-4.5-6-2.5 3.2z" />
	</svg>
{:else if name === 'videos'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M21 6.5a2.5 2.5 0 0 0-2.5-2.5h-13A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5zM10 8.98v6.04L15.5 12z" />
	</svg>
{:else if name === 'news'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M20 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM5.5 7.5h5V12h-5zm11 9h-11v-2h11zm0-4h-4v-5h4z" />
	</svg>
{:else if name === 'maps'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" />
	</svg>
{:else if name === 'tools'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M3 17v2h6v-2zM3 5v2h10V5zm10 16v-2h8v-2h-8v-2h-2v6zM7 9v2H3v2h4v2h2V9zm14 4v-2H11v2zm-6-4h2V7h4V5h-4V3h-2z" />
	</svg>
{:else if name === 'shield'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11z" />
	</svg>
{:else if name === 'info'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
	</svg>
{:else if name === 'external'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z" />
	</svg>
{:else if name === 'moon'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
	</svg>
{:else if name === 'sun'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5 2 3h-4zm0 20-2-3h4zm10-10-3 2v-4zM2 12l3-2v4zm17.07-7.07-1.41 1.41-1.42-1.41 1.42-1.42zM5.34 18.66l-1.41-1.41 1.41-1.42 1.41 1.42zM18.66 18.66l-1.41-1.41 1.41-1.42 1.42 1.42zM5.34 5.34 4.93 6.75 3.52 5.34l1.41-1.41z" />
	</svg>
{:else if name === 'copy'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z" />
	</svg>
{:else if name === 'check'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
	</svg>
{:else if name === 'goggles'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M2 9h4.5a3.5 3.5 0 0 1 3.4 2.7L11 15h2l1.1-3.3A3.5 3.5 0 0 1 17.5 9H22v2h-4.5a1.5 1.5 0 0 0-1.45 1.1L14.8 16h-5.6l-1.25-3.9A1.5 1.5 0 0 0 6.5 11H2z" />
	</svg>
{/if}
