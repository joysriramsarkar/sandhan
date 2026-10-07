<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { t, setLocale, getLocale, type Locale } from '$lib/i18n';
	import GIcon from '$lib/components/GIcon.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	let currentTheme = 'light';
	let currentLocale: Locale = 'bn';
	let showShortcutsModal = false;
	let showAppsMenu = false;
	let showAccountMenu = false;
	let showMobileNav = false;
	let actionsEl: HTMLDivElement;
	let isSearchRoute = true;

	// The search page renders its own Google-style chrome (home top bar / SERP header).
	// `pathname` is always at least `/`, so only the root route needs checking.
	$: isSearchRoute = $page.url.pathname === '/';

	onMount(() => {
		currentTheme =
			localStorage.getItem('sandhan_theme') ||
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		document.documentElement.dataset.theme = currentTheme;
		currentLocale = getLocale();

		window.addEventListener('keydown', handleGlobalKeydown);
		document.addEventListener('click', handleDocumentClick);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
			document.removeEventListener('click', handleDocumentClick);
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
		showAccountMenu = false;
		location.reload();
	}

	function handleDocumentClick(event: MouseEvent) {
		if (actionsEl && !actionsEl.contains(event.target as Node)) {
			showAppsMenu = false;
			showAccountMenu = false;
		}
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
			showAppsMenu = false;
			showAccountMenu = false;
			showMobileNav = false;
		}
	}

	function handleLogoClick(e: MouseEvent) {
		showMobileNav = false;
		window.dispatchEvent(new CustomEvent('sandhan:reset-home'));
		if (window.location.pathname === '/' || window.location.pathname === '') {
			window.history.pushState({}, '', '/');
		}
	}
</script>

<svelte:head>
	<title>{t('appName')} — {t('tagline')}</title>
</svelte:head>

{#if !isSearchRoute}
	<header class="g-header">
		<div class="g-header-inner">
			<a href="/" class="g-header-logo" on:click={handleLogoClick} aria-label="{t('appName')} হোম">
				<Wordmark size="sm" />
			</a>

			<nav class="g-header-nav" aria-label="প্রধান নেভিগেশন">
				<a href="/" class="g-nav-link" on:click={handleLogoClick}>{t('nav.search')}</a>
				<a href="/dashboard" class="g-nav-link">{t('nav.dashboard')}</a>
				<a href="/launch" class="g-nav-link">{t('nav.launch')}</a>
				<a href="/design" class="g-nav-link">ডিজাইন</a>
			</nav>

			<div class="g-header-actions" bind:this={actionsEl}>
				<button
					class="g-icon-btn apps-btn"
					title="সন্ধান অ্যাপ"
					aria-label="সন্ধান অ্যাপ"
					aria-expanded={showAppsMenu}
					on:click|stopPropagation={() => {
						showAppsMenu = !showAppsMenu;
						showAccountMenu = false;
					}}
				>
					<GIcon name="apps" size={20} />
				</button>

				<button class="g-icon-btn" title="থিম বদলান" aria-label="থিম বদলান" on:click={toggleTheme}>
					<GIcon name={currentTheme === 'dark' ? 'sun' : 'moon'} size={20} />
				</button>

				<button class="g-avatar-btn" aria-label="অ্যাকাউন্ট ও সেটিংস" on:click|stopPropagation={() => {
						showAccountMenu = !showAccountMenu;
						showAppsMenu = false;
					}}>
					<span>স</span>
				</button>

				<button
					class="g-icon-btn mobile-nav-btn"
					aria-label="মেনু"
					on:click={() => (showMobileNav = !showMobileNav)}
				>
					<GIcon name={showMobileNav ? 'close' : 'apps'} size={20} />
				</button>

				{#if showAppsMenu}
					<div class="g-menu g-apps-menu" role="menu">
						<div class="g-menu-title">সন্ধান অ্যাপ</div>
						<div class="g-apps-grid">
							<a class="g-app-tile" href="/" on:click={handleLogoClick}>
								<span class="g-app-ico"><GIcon name="search" size={20} /></span>
								<span>সার্চ</span>
							</a>
							<a class="g-app-tile" href="/dashboard">
								<span class="g-app-ico"><GIcon name="info" size={20} /></span>
								<span>ড্যাশবোর্ড</span>
							</a>
							<a class="g-app-tile" href="/launch">
								<span class="g-app-ico"><GIcon name="arrow-right" size={20} /></span>
								<span>ঘোষণা</span>
							</a>
							<a class="g-app-tile" href="https://github.com/joysriramsarkar/sandhan" target="_blank" rel="noopener">
								<span class="g-app-ico">⌥</span>
								<span>GitHub</span>
							</a>
							<a class="g-app-tile" href="https://github.com/joysriramsarkar/sandhan/tree/main/docs" target="_blank" rel="noopener">
								<span class="g-app-ico"><GIcon name="news" size={20} /></span>
								<span>ডকুমেন্টেশন</span>
							</a>
							<a class="g-app-tile" href="/?cat=images">
								<span class="g-app-ico"><GIcon name="images" size={20} /></span>
								<span>ছবি</span>
							</a>
						</div>
					</div>
				{/if}

				{#if showAccountMenu}
					<div class="g-menu g-account-menu" role="menu">
						<div class="g-account-head">
							<span class="g-avatar-lg">স</span>
							<div>
								<div class="g-account-name">অতিথি ব্যবহারকারী</div>
								<div class="g-account-mail">কোনো ট্র্যাকিং নেই · গোপনীয়তা-প্রথম</div>
							</div>
						</div>
						<div class="g-menu-sep"></div>
						<div class="g-menu-label">ভাষা</div>
						<div class="g-lang-row">
							<button class:active={currentLocale === 'bn'} on:click={() => handleLocaleChange('bn')}>বাংলা</button>
							<button class:active={currentLocale === 'en'} on:click={() => handleLocaleChange('en')}>English</button>
							<button class:active={currentLocale === 'hi'} on:click={() => handleLocaleChange('hi')}>हिन्दी</button>
						</div>
						<div class="g-menu-sep"></div>
						<button class="g-menu-item" on:click={toggleTheme}>
							<span>{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
							<span>{currentTheme === 'dark' ? 'লাইট থিম' : 'ডার্ক থিম'}</span>
						</button>
						<a class="g-menu-item" href="/dashboard">📊 সিস্টেম অবস্থা</a>
						<a class="g-menu-item" href="/launch">🚀 ইশতেহার</a>
						<div class="g-menu-sep"></div>
						<div class="g-menu-note">
							<GIcon name="shield" size={16} />
							<span>সার্চ হিস্টরি আপনার ডিভাইসেই এনক্রিপ্টেড (AES-256-GCM)।</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if showMobileNav}
			<nav class="g-mobile-nav">
				<a href="/" on:click={handleLogoClick}><span>🔍</span> {t('nav.search')}</a>
				<a href="/dashboard"><span>📊</span> {t('nav.dashboard')}</a>
				<a href="/launch"><span>🚀</span> {t('nav.launch')}</a>
			</nav>
		{/if}
	</header>
{/if}

<main class:g-main-search={isSearchRoute}>
	<slot />
</main>

{#if !isSearchRoute}
	<footer class="g-footer">
		<div class="g-footer-inner">
			<div class="g-footer-left">
				<a href="/launch">সম্পর্কে</a>
				<a href="/dashboard">সিস্টেম স্ট্যাটাস</a>
				<a href="https://github.com/joysriramsarkar/sandhan" target="_blank" rel="noopener">সোর্স কোড</a>
				<a href="/?q=sandhan">সন্ধান কীভাবে কাজ করে</a>
			</div>
			<div class="g-footer-right">
				<a href="/?q=গোপনীয়তা">গোপনীয়তা</a>
				<a href="/?q=শর্তাবলী">শর্তাবলী</a>
				<a href="/design">সেটিংস</a>
			</div>
		</div>
	</footer>
{/if}

{#if showShortcutsModal}
	<div class="g-scrim" role="presentation" on:click={() => (showShortcutsModal = false)}></div>
	<div class="g-dialog" role="dialog" aria-modal="true" aria-label="কীবোর্ড শর্টকাট">
		<h2>কীবোর্ড শর্টকাট</h2>
		<div class="g-shortcuts">
			<div><code>/</code><span>সার্চ বক্সে ফোকাস</span></div>
			<div><code>↑</code> <code>↓</code><span>সাজেশন নির্বাচন</span></div>
			<div><code>Enter</code><span>অনুসন্ধান চালান</span></div>
			<div><code>?</code><span>এই সহায়িকা খুলুন</span></div>
			<div><code>Esc</code><span>বন্ধ করুন</span></div>
		</div>
		<button class="g-btn-primary" on:click={() => (showShortcutsModal = false)}>ঠিক আছে</button>
	</div>
{/if}

<style>
	/* ============================================================
	   Google design tokens — light theme
	   ============================================================ */
	:global(:root),
	:global([data-theme='light']) {
		--g-font: 'Roboto', 'Noto Sans Bengali', Arial, sans-serif;
		--g-bg: #ffffff;
		--g-surface: #ffffff;
		--g-surface-2: #f8f9fa;
		--g-footer-bg: #f2f2f2;
		--g-text: #202124;
		--g-text-2: #4d5156;
		--g-text-3: #70757a;
		--g-icon: #9aa0a6;
		--g-border: #dfe1e5;
		--g-divider: #ebebeb;
		--g-hover: #f8f9fa;
		--g-blue: #1a73e8;
		--g-blue-hover: #1765cc;
		--g-link: #1a0dab;
		--g-link-visited: #681da8;
		--g-green: #188038;
		--g-red: #d93025;
		--g-yellow: #f9ab00;
		--g-shadow-1: 0 1px 6px rgba(32, 33, 36, 0.28);
		--g-shadow-2: 0 4px 6px rgba(32, 33, 36, 0.28);

		/* Legacy aliases kept so every existing surface inherits Google's palette */
		--bg: var(--g-bg);
		--bg-elev: var(--g-surface);
		--bg-soft: var(--g-surface-2);
		--ink: var(--g-text);
		--ink-soft: var(--g-text-2);
		--ink-faint: var(--g-text-3);
		--line: #dadce0;
		--accent: var(--g-blue);
		--accent-hover: var(--g-blue-hover);
		--accent-ink: #ffffff;
		--warm: var(--g-yellow);
		--warm-soft: #fef7e0;
		--chip: #f1f3f4;
		--code: #202124;
		--shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
		--radius-full: 999px;
	}

	/* Google dark theme */
	:global([data-theme='dark']) {
		--g-bg: #202124;
		--g-surface: #202124;
		--g-surface-2: #303134;
		--g-footer-bg: #171717;
		--g-text: #e8eaed;
		--g-text-2: #bdc1c6;
		--g-text-3: #9aa0a6;
		--g-icon: #9aa0a6;
		--g-border: #5f6368;
		--g-divider: #3c4043;
		--g-hover: #303134;
		--g-blue: #8ab4f8;
		--g-blue-hover: #aecbfa;
		--g-link: #99c3ff;
		--g-link-visited: #c58af9;
		--g-green: #81c995;
		--g-red: #f28b82;
		--g-yellow: #fdd663;
		--g-shadow-1: 0 1px 6px rgba(0, 0, 0, 0.6);
		--g-shadow-2: 0 4px 6px rgba(0, 0, 0, 0.65);

		--bg: #202124;
		--bg-elev: #202124;
		--bg-soft: #303134;
		--ink: #e8eaed;
		--ink-soft: #bdc1c6;
		--ink-faint: #9aa0a6;
		--line: #3c4043;
		--accent: #8ab4f8;
		--accent-hover: #aecbfa;
		--accent-ink: #202124;
		--warm: #fdd663;
		--warm-soft: #3f3a22;
		--chip: #303134;
		--code: #e8eaed;
		--shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
	}

	:global(*) {
		box-sizing: border-box;
	}
	:global(html) {
		-webkit-text-size-adjust: 100%;
	}
	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: var(--g-font);
		font-size: 14px;
		line-height: 1.5;
		background: var(--g-bg);
		color: var(--g-text);
		transition: background 0.2s ease, color 0.2s ease;
	}
	:global(button) {
		font-family: inherit;
		cursor: pointer;
		border: none;
		background: none;
		color: inherit;
		outline: none;
		-webkit-tap-highlight-color: transparent;
	}
	:global(a) {
		color: var(--g-blue);
		text-decoration: none;
	}
	:global(input),
	:global(textarea),
	:global(select) {
		font-family: inherit;
	}

	/* ============================================================
	   Header (non-search routes: dashboard, launch, design …)
	   ============================================================ */
	.g-header {
		background: var(--g-bg);
		border-bottom: 1px solid var(--g-divider);
	}
	.g-header-inner {
		max-width: 1320px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 28px;
		height: 64px;
		padding: 0 24px;
	}
	.g-header-logo {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}
	.g-header-nav {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.g-header-nav::-webkit-scrollbar {
		display: none;
	}
	.g-nav-link {
		padding: 8px 12px;
		border-radius: 999px;
		font-size: 14px;
		color: var(--g-text-2);
		white-space: nowrap;
	}
	.g-nav-link:hover {
		background: var(--g-hover);
		color: var(--g-text);
	}
	.g-header-actions {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.g-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		color: var(--g-text-2);
		transition: background 0.15s ease;
	}
	.g-icon-btn:hover {
		background: var(--g-hover);
	}
	.g-avatar-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4285f4, #34a853);
		color: #fff;
		font-weight: 500;
		font-size: 15px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: 4px;
	}
	.g-avatar-lg {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4285f4, #34a853);
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		flex-shrink: 0;
	}
	.mobile-nav-btn {
		display: none;
	}

	/* Menus */
	.g-menu {
		position: absolute;
		top: 52px;
		right: 0;
		width: 320px;
		background: var(--g-surface);
		border: 1px solid var(--g-border);
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 8px 24px rgba(60, 64, 67, 0.15);
		z-index: 60;
		padding: 8px 0;
		overflow: hidden;
	}
	.g-account-menu {
		width: 340px;
	}
	.g-menu-title {
		padding: 10px 16px 6px;
		font-size: 13px;
		color: var(--g-text-3);
	}
	.g-apps-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		padding: 4px 8px 8px;
	}
	.g-app-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px 4px;
		border-radius: 8px;
		color: var(--g-text-2);
		font-size: 12px;
		text-align: center;
	}
	.g-app-tile:hover {
		background: var(--g-hover);
	}
	.g-app-ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--g-surface-2);
		color: var(--g-blue);
	}
	.g-account-head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
	}
	.g-account-name {
		font-size: 15px;
		color: var(--g-text);
	}
	.g-account-mail {
		font-size: 12px;
		color: var(--g-text-3);
	}
	.g-menu-sep {
		height: 1px;
		background: var(--g-divider);
		margin: 6px 0;
	}
	.g-menu-label {
		padding: 6px 16px;
		font-size: 12px;
		color: var(--g-text-3);
	}
	.g-lang-row {
		display: flex;
		gap: 6px;
		padding: 0 16px 8px;
	}
	.g-lang-row button {
		flex: 1;
		padding: 7px 8px;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		font-size: 13px;
		color: var(--g-text-2);
	}
	.g-lang-row button.active {
		border-color: var(--g-blue);
		color: var(--g-blue);
		background: color-mix(in srgb, var(--g-blue) 10%, transparent);
	}
	.g-menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 16px;
		font-size: 14px;
		color: var(--g-text);
		text-align: left;
	}
	.g-menu-item:hover {
		background: var(--g-hover);
	}
	.g-menu-note {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		padding: 10px 16px 12px;
		font-size: 12px;
		color: var(--g-text-3);
		line-height: 1.45;
	}

	.g-mobile-nav {
		display: none;
		flex-direction: column;
		border-top: 1px solid var(--g-divider);
		padding: 6px 12px 12px;
	}
	.g-mobile-nav a {
		padding: 12px;
		border-radius: 8px;
		color: var(--g-text);
		font-size: 14px;
	}

	/* ============================================================
	   Main + footer
	   ============================================================ */
	main {
		flex: 1;
		width: 100%;
		max-width: 1320px;
		margin: 0 auto;
		padding: 24px 24px 48px;
	}
	main.g-main-search {
		max-width: none;
		padding: 0;
	}

	.g-footer {
		background: var(--g-footer-bg);
		color: var(--g-text-3);
		font-size: 14px;
	}
	.g-footer-inner {
		max-width: 1320px;
		margin: 0 auto;
		padding: 0 24px;
		height: 46px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}
	.g-footer-left,
	.g-footer-right {
		display: flex;
		align-items: center;
		gap: 28px;
		flex-wrap: wrap;
	}
	.g-footer a {
		color: var(--g-text-3);
	}
	.g-footer a:hover {
		color: var(--g-text);
		text-decoration: underline;
	}

	/* Dialog */
	.g-scrim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 90;
	}
	.g-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(92vw, 420px);
		background: var(--g-surface);
		border-radius: 8px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
		padding: 24px;
		z-index: 100;
	}
	.g-dialog h2 {
		margin: 0 0 16px;
		font-size: 18px;
		font-weight: 500;
		color: var(--g-text);
	}
	.g-shortcuts {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 20px;
	}
	.g-shortcuts div {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--g-text-2);
	}
	.g-shortcuts code {
		background: var(--g-surface-2);
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 13px;
		color: var(--g-text);
	}
	.g-shortcuts div span {
		margin-left: auto;
	}
	.g-btn-primary {
		width: 100%;
		height: 36px;
		border-radius: 4px;
		background: var(--g-blue);
		color: #fff;
		font-size: 14px;
		font-weight: 500;
	}
	.g-btn-primary:hover {
		background: var(--g-blue-hover);
	}

	@media (max-width: 800px) {
		.g-header-inner {
			gap: 12px;
			padding: 0 12px;
		}
		.g-header-nav {
			display: none;
		}
		.mobile-nav-btn {
			display: inline-flex;
		}
		.g-avatar-btn {
			display: none;
		}
		.g-menu {
			width: min(92vw, 320px);
			right: -8px;
		}
		.g-mobile-nav {
			display: flex;
		}
		main {
			padding: 18px 14px 40px;
		}
		.g-footer-inner {
			height: auto;
			padding: 14px;
			justify-content: center;
		}
		.g-footer-left,
		.g-footer-right {
			gap: 16px;
			justify-content: center;
		}
	}
</style>
