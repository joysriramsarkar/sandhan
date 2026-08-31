<script lang="ts">
	import { onMount } from 'svelte';
	import { t, setLocale, getLocale, type Locale } from '$lib/i18n';

	let currentTheme = 'light';
	let currentLocale: Locale = 'bn';
	let showShortcutsModal = false;
	let showMobileMenu = false;

	onMount(() => {
		currentTheme = localStorage.getItem('sandhan_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		document.documentElement.dataset.theme = currentTheme;
		currentLocale = getLocale();

		window.addEventListener('keydown', handleGlobalKeydown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	function toggleTheme() {
		currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = currentTheme;
		localStorage.setItem('sandhan_theme', currentTheme);
	}

	function handleLocaleChange(loc: Locale) {
		currentLocale = loc;
		setLocale(loc);
		location.reload();
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		const targetTag = (document.activeElement as HTMLElement)?.tagName;
		const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || isEditable) {
			if (e.key === 'Escape') {
				(document.activeElement as HTMLElement)?.blur();
			}
			return;
		}
		if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			showShortcutsModal = !showShortcutsModal;
		}
		if (e.key === 'Escape') {
			showShortcutsModal = false;
			showMobileMenu = false;
		}
	}

	function handleLogoClick(e: MouseEvent) {
		showMobileMenu = false;
		window.dispatchEvent(new CustomEvent('sandhan:reset-home'));
		if (window.location.pathname === '/' || window.location.pathname === '') {
			window.history.pushState({}, '', '/');
		}
	}
</script>

<svelte:head>
	<title>{t('appName')} — {t('tagline')}</title>
</svelte:head>

<header>
	<div class="header-bar">
		<a href="/" class="brand-logo" on:click={handleLogoClick}>
			<span class="logo-badge">স</span>
			<span class="logo-text">{t('appName')}</span>
		</a>

		<!-- Desktop Navigation -->
		<nav class="desktop-nav">
			<a href="/" class="nav-item">{t('nav.search')}</a>
			<a href="/dashboard" class="nav-item">{t('nav.dashboard')}</a>
			<a href="/launch" class="nav-item">{t('nav.launch')}</a>
		</nav>

		<!-- Right Action Items -->
		<div class="header-actions">
			<!-- Language Switcher -->
			<div class="lang-picker">
				<button class="lang-btn" class:active={currentLocale === 'bn'} on:click={() => handleLocaleChange('bn')}>বাংলা</button>
				<button class="lang-btn" class:active={currentLocale === 'en'} on:click={() => handleLocaleChange('en')}>EN</button>
				<button class="lang-btn" class:active={currentLocale === 'hi'} on:click={() => handleLocaleChange('hi')}>हिन्दी</button>
			</div>

			<!-- Theme Toggle Button -->
			<button class="action-btn theme-toggle" on:click={toggleTheme} title="থিম বদল (d)">
				{currentTheme === 'dark' ? '☀️' : '🌙'}
			</button>

			<!-- Mobile Menu Toggle Button -->
			<button class="mobile-menu-btn" on:click={() => showMobileMenu = !showMobileMenu} aria-label="মেনু">
				{showMobileMenu ? '✕' : '☰'}
			</button>
		</div>
	</div>

	<!-- Mobile Dropdown Navigation -->
	{#if showMobileMenu}
		<nav class="mobile-nav">
			<a href="/" class="mobile-nav-item" on:click={() => showMobileMenu = false}>🔍 {t('nav.search')}</a>
			<a href="/dashboard" class="mobile-nav-item" on:click={() => showMobileMenu = false}>📊 {t('nav.dashboard')}</a>
			<a href="/launch" class="mobile-nav-item" on:click={() => showMobileMenu = false}>🚀 {t('nav.launch')}</a>
		</nav>
	{/if}
</header>

<main>
	<slot />
</main>

<!-- Shortcuts Modal -->
{#if showShortcutsModal}
	<div class="scrim" on:click={() => showShortcutsModal = false} role="presentation"></div>
	<div class="modal">
		<h3>⌨️ কীবোর্ড শর্টকাট (Keyboard Shortcuts)</h3>
		<div class="shortcuts-grid">
			<div><code>/</code> <span>সার্চ বক্সে ফোকাস</span></div>
			<div><code>d</code> <span>ডার্ক / লাইট থিম টগল</span></div>
			<div><code>?</code> <span>এই সাহায্য পপআপ খোলা</span></div>
			<div><code>Esc</code> <span>মোডাল বন্ধ করা</span></div>
			<div><code>Enter</code> <span>অনুসন্ধান চালু</span></div>
		</div>
		<button class="primary-btn full-btn" on:click={() => showShortcutsModal = false}>ঠিক আছে</button>
	</div>
{/if}

<footer>
	<div class="footer-content">
		<p><b>{t('appName')}</b> — একটি উন্মুক্ত, মুক্ত ও স্বাধীন সার্চ ইঞ্জিন · লাইসেন্স: AGPL-3.0</p>
		<small>কীবোর্ড শর্টকাটের জন্য <code>?</code> চাপুন · সার্চ ফোকাস করতে <code>/</code> চাপুন</small>
	</div>
</footer>

<style>
	:global(:root), :global([data-theme="light"]) {
		--bg: #f7f4ee;
		--bg-elev: #ffffff;
		--bg-soft: #efe9dd;
		--ink: #1c2321;
		--ink-soft: #5b6663;
		--ink-faint: #8a938f;
		--line: #e3dccc;
		--accent: #0e7a63;
		--accent-hover: #0a5c4a;
		--accent-ink: #ffffff;
		--warm: #e0762f;
		--warm-soft: #fbe8d8;
		--chip: #e7f2ee;
		--code: #12312a;
		--shadow: 0 10px 30px rgba(28, 35, 33, 0.08);
	}
	:global([data-theme="dark"]) {
		--bg: #0e1513;
		--bg-elev: #152019;
		--bg-soft: #1a2620;
		--ink: #e9efe9;
		--ink-soft: #a3b3ab;
		--ink-faint: #6f7f77;
		--line: #263830;
		--accent: #2fbf9a;
		--accent-hover: #3ad9af;
		--accent-ink: #06231b;
		--warm: #f0954f;
		--warm-soft: #3a2a1a;
		--chip: #1c332b;
		--code: #0c1f1a;
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
	}
	:global(*) { box-sizing: border-box; margin: 0; padding: 0; }
	:global(html, body) {
		max-width: 100vw;
		overflow-x: hidden;
	}
	:global(body) {
		font-family: 'Noto Sans Bengali', system-ui, sans-serif;
		background: var(--bg);
		color: var(--ink);
		line-height: 1.65;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		transition: background 0.3s ease, color 0.3s ease;
		-webkit-text-size-adjust: 100%;
	}
	:global(a) { color: var(--accent); text-decoration: none; word-break: break-word; }
	:global(button) { font-family: inherit; cursor: pointer; border: none; outline: none; -webkit-tap-highlight-color: transparent; }

	header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--line);
	}
	.header-bar {
		max-width: 1200px;
		margin: 0 auto;
		padding: 10px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.brand-logo {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		font-weight: 800;
		font-size: 1.25rem;
	}
	.logo-badge {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: var(--accent);
		color: var(--accent-ink);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.2rem;
		font-weight: 700;
		flex-shrink: 0;
	}
	.logo-text {
		font-family: 'Noto Serif Bengali', serif;
	}

	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.nav-item {
		padding: 6px 12px;
		border-radius: 8px;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.92rem;
		transition: all 0.2s ease;
	}
	.nav-item:hover {
		background: var(--bg-soft);
		color: var(--accent);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.lang-picker {
		display: flex;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 2px;
		gap: 2px;
	}
	.lang-btn {
		padding: 4px 8px;
		border-radius: 6px;
		background: transparent;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink-soft);
		transition: all 0.2s ease;
	}
	.lang-btn.active {
		background: var(--bg-elev);
		color: var(--accent);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}
	.action-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.theme-toggle {
		padding: 6px 10px;
		font-size: 1rem;
	}

	.mobile-menu-btn {
		display: none;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-size: 1.1rem;
	}

	.mobile-nav {
		display: none;
		flex-direction: column;
		padding: 10px 16px 16px;
		background: var(--bg-elev);
		border-bottom: 1px solid var(--line);
		gap: 6px;
	}
	.mobile-nav-item {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--bg-soft);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.95rem;
	}

	@media (max-width: 768px) {
		.desktop-nav { display: none; }
		.mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
		.mobile-nav { display: flex; }
	}

	main {
		flex: 1;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		padding: 24px 16px;
	}

	footer {
		border-top: 1px solid var(--line);
		padding: 24px 16px;
		text-align: center;
		color: var(--ink-soft);
		font-size: 0.88rem;
		margin-top: auto;
	}
	.footer-content {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.footer-content small {
		color: var(--ink-faint);
		font-size: 0.78rem;
	}

	/* Modal Backdrop & Modal Box */
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(4px);
		z-index: 50;
	}
	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 24px;
		width: 90%;
		max-width: 440px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
		z-index: 60;
	}
	.modal h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 16px;
		color: var(--ink);
	}
	.shortcuts-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 20px;
	}
	.shortcuts-grid div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.9rem;
	}
	.shortcuts-grid code {
		padding: 3px 8px;
		background: var(--chip);
		border-radius: 6px;
		font-family: monospace;
		font-weight: 700;
		color: var(--accent);
	}
	.primary-btn {
		padding: 10px 16px;
		background: var(--accent);
		color: #ffffff;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.92rem;
		transition: background 0.15s;
	}
	.primary-btn:hover {
		background: var(--accent-hover);
	}
	.full-btn {
		width: 100%;
	}
</style>
