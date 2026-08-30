<script lang="ts">
	import { onMount } from 'svelte';
	import { t, setLocale, getLocale, type Locale } from '$lib/i18n';
	import { deriveKey, decryptJSON, type EncryptedPayload } from '$lib/crypto';

	let currentTheme = 'light';
	let currentLocale: Locale = 'bn';
	let showHistoryDrawer = false;
	let showShortcutsModal = false;
	let showMobileMenu = false;
	let historyPassphrase = '';
	let historyUnlocked = false;
	let encryptedHistory: Array<EncryptedPayload & { _pt?: { q: string; ts: number } }> = [];

	onMount(() => {
		currentTheme = localStorage.getItem('sandhan_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		document.documentElement.dataset.theme = currentTheme;
		currentLocale = getLocale();
		loadHistoryFromStorage();

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

	function loadHistoryFromStorage() {
		try {
			encryptedHistory = JSON.parse(localStorage.getItem('sandhan_history') || '[]');
		} catch (_) {
			encryptedHistory = [];
		}
	}

	async function unlockHistory() {
		if (!historyPassphrase.trim()) return;
		try {
			const key = await deriveKey(historyPassphrase.trim());
			const updated = [...encryptedHistory];
			for (const item of updated) {
				try {
					item._pt = await decryptJSON<{ q: string; ts: number }>(key, item);
				} catch (_) {
					item._pt = undefined;
				}
			}
			encryptedHistory = updated;
			historyUnlocked = true;
		} catch (e) {
			alert('ডিক্রিপশন ব্যর্থ — পাসফ্রেজ সঠিক নয়!');
		}
	}

	function clearHistory() {
		if (confirm('আপনি কি নিশ্চিত যে সম্পূর্ণ এনক্রিপ্টেড ইতিহাস মুছে ফেলতে চান?')) {
			localStorage.removeItem('sandhan_history');
			encryptedHistory = [];
			historyUnlocked = false;
		}
	}

	function exportData() {
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(encryptedHistory, null, 2));
		const dlAnchor = document.createElement('a');
		dlAnchor.setAttribute('href', dataStr);
		dlAnchor.setAttribute('download', `sandhan-encrypted-vault-${new Date().toISOString().slice(0, 10)}.json`);
		dlAnchor.click();
	}


	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
			e.preventDefault();
			showShortcutsModal = !showShortcutsModal;
		}
		if (e.key === 'd' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
			e.preventDefault();
			toggleTheme();
		}
		if (e.key === 'Escape') {
			showHistoryDrawer = false;
			showShortcutsModal = false;
			showMobileMenu = false;
		}
	}
</script>

<svelte:head>
	<title>{t('appName')} — {t('tagline')}</title>
</svelte:head>

<header>
	<div class="header-bar">
		<a href="/" class="brand-logo" on:click={() => showMobileMenu = false}>
			<span class="logo-badge">স</span>
			<span class="logo-text">{t('appName')}</span>
		</a>

		<!-- Desktop Navigation -->
		<nav class="desktop-nav">
			<a href="/" class="nav-item">{t('nav.search')}</a>
			<a href="/dashboard" class="nav-item">{t('nav.dashboard')}</a>
			<a href="/judge" class="nav-item">{t('nav.judge')}</a>
			<a href="/design" class="nav-item">{t('nav.design')}</a>
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

			<!-- History Button -->
			<button class="action-btn history-trigger" on:click={() => { showHistoryDrawer = true; loadHistoryFromStorage(); }} title="এনক্রিপ্টেড ইতিহাস">
				🔒 <span class="btn-text">{t('historyTitle')}</span>
			</button>

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
			<a href="/judge" class="mobile-nav-item" on:click={() => showMobileMenu = false}>⚖️ {t('nav.judge')}</a>
			<a href="/design" class="mobile-nav-item" on:click={() => showMobileMenu = false}>🎨 {t('nav.design')}</a>
			<a href="/launch" class="mobile-nav-item" on:click={() => showMobileMenu = false}>🚀 {t('nav.launch')}</a>
		</nav>
	{/if}
</header>

<main>
	<slot />
</main>

<!-- Encrypted History Drawer -->
{#if showHistoryDrawer}
	<div class="scrim" on:click={() => showHistoryDrawer = false} role="presentation"></div>
	<aside class="drawer">
		<div class="drawer-header">
			<h3>🔒 {t('historyTitle')}</h3>
			<button class="close-btn" on:click={() => showHistoryDrawer = false}>✕</button>
		</div>
		<p class="drawer-desc">{t('historyDesc')}</p>

		<div class="unlock-box">
			<input type="password" bind:value={historyPassphrase} placeholder="পাসফ্রেজ লিখুন..." />
			<button class="primary-btn" on:click={unlockHistory}>{t('unlock')}</button>
		</div>

		<div class="history-list">
			{#if encryptedHistory.length === 0}
				<p class="empty-state">{t('noHistory')}</p>
			{:else}
				{#each encryptedHistory as item, i}
					<div class="history-card">
						<div class="card-meta">
							<span>এন্ট্রি #{i + 1}</span>
							<span class="enc-tag">AES-256-GCM</span>
						</div>
						{#if historyUnlocked && item._pt}
							<div class="plain-query">🔓 {item._pt.q}</div>
							<div class="timestamp">{new Date(item._pt.ts).toLocaleTimeString()}</div>
						{:else}
							<div class="cipher-blob">
								<small>IV: {item.iv}</small>
								<div class="ct-snippet">{item.ct.slice(0, 32)}...</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="drawer-actions-row">
			<button class="export-btn" on:click={exportData}>📥 ডেটা এক্সপোর্ট (JSON)</button>
			<button class="danger-btn" on:click={clearHistory}>🗑️ {t('clear')}</button>
		</div>
	</aside>
{/if}

<!-- Shortcuts Modal -->
{#if showShortcutsModal}
	<div class="scrim" on:click={() => showShortcutsModal = false} role="presentation"></div>
	<div class="modal">
		<h3>⌨️ কীবোর্ড শর্টকাট (Keyboard Shortcuts)</h3>
		<div class="shortcuts-grid">
			<div><code>/</code> <span>সার্চ বক্সে ফোকাস</span></div>
			<div><code>d</code> <span>ডার্ক / লাইট থিম টগল</span></div>
			<div><code>?</code> <span>এই সাহায্য পপআপ খোলা</span></div>
			<div><code>Esc</code> <span>ড্রয়ার / মোডাল বন্ধ করা</span></div>
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
		width: 100%;
	}
	.header-bar {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		gap: 10px;
	}
	.brand-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: 'Noto Serif Bengali', serif;
		font-weight: 900;
		font-size: 1.35rem;
		color: var(--ink);
		flex-shrink: 0;
	}
	.logo-badge {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: linear-gradient(135deg, var(--accent), var(--warm));
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 1.15rem;
		box-shadow: 0 4px 12px rgba(14, 122, 99, 0.25);
		flex-shrink: 0;
	}
	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	@media (max-width: 820px) {
		.desktop-nav {
			display: none;
		}
	}
	.nav-item {
		padding: 6px 10px;
		border-radius: 8px;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.2s;
	}
	.nav-item:hover {
		background: var(--bg-soft);
		color: var(--ink);
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.lang-picker {
		display: flex;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 2px;
	}
	.lang-btn {
		padding: 4px 6px;
		border-radius: 6px;
		background: transparent;
		color: var(--ink-soft);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.lang-btn.active {
		background: var(--bg-elev);
		color: var(--accent);
		box-shadow: 0 2px 6px rgba(0,0,0,0.05);
	}
	.action-btn {
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.84rem;
		display: flex;
		align-items: center;
		gap: 4px;
		transition: all 0.2s;
		min-height: 34px;
	}
	.action-btn:hover {
		background: var(--bg-soft);
	}
	@media (max-width: 600px) {
		.history-trigger .btn-text {
			display: none;
		}
		.action-btn {
			padding: 6px 8px;
		}
	}
	.mobile-menu-btn {
		display: none;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-size: 1.1rem;
		font-weight: bold;
		place-items: center;
	}
	@media (max-width: 820px) {
		.mobile-menu-btn {
			display: grid;
		}
	}
	.mobile-nav {
		display: flex;
		flex-direction: column;
		background: var(--bg-elev);
		border-bottom: 1px solid var(--line);
		padding: 10px 16px;
		gap: 4px;
		animation: slideDown 0.2s ease-out;
	}
	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.mobile-nav-item {
		padding: 10px 12px;
		border-radius: 8px;
		color: var(--ink);
		font-weight: 600;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.mobile-nav-item:hover {
		background: var(--bg-soft);
	}

	main {
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
		padding: 24px 16px 60px;
		flex: 1;
	}
	@media (max-width: 600px) {
		main {
			padding: 16px 12px 40px;
		}
	}
	footer {
		border-top: 1px solid var(--line);
		padding: 20px 16px;
		text-align: center;
		background: var(--bg-soft);
		color: var(--ink-soft);
		font-size: 0.85rem;
		word-break: break-word;
	}
	.footer-content p {
		margin-bottom: 4px;
	}
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		z-index: 90;
	}
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		width: 380px;
		max-width: 90vw;
		height: 100vh;
		background: var(--bg-elev);
		border-left: 1px solid var(--line);
		z-index: 100;
		padding: 20px;
		display: flex;
		flex-direction: column;
		box-shadow: -10px 0 30px rgba(0,0,0,0.2);
	}
	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.drawer-desc {
		font-size: 0.84rem;
		color: var(--ink-soft);
		margin-bottom: 14px;
	}
	.unlock-box {
		display: flex;
		gap: 8px;
		margin-bottom: 14px;
	}
	.unlock-box input {
		flex: 1;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.9rem;
	}
	.primary-btn {
		padding: 8px 14px;
		border-radius: 8px;
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
		font-size: 0.88rem;
		white-space: nowrap;
	}
	.drawer-actions-row {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.export-btn {
		flex: 1;
		padding: 10px;
		border-radius: 8px;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.84rem;
	}
	.danger-btn {
		padding: 10px 14px;
		border-radius: 8px;
		background: var(--bg-soft);
		color: #e63946;
		font-weight: 600;
		font-size: 0.84rem;
	}
	.history-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.history-card {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 10px;
	}
	.card-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.72rem;
		color: var(--ink-soft);
		margin-bottom: 4px;
	}
	.enc-tag {
		color: var(--accent);
		font-weight: 600;
	}
	.ct-snippet {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.75rem;
		color: var(--accent);
		word-break: break-all;
	}
	.plain-query {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink);
	}
	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px;
		z-index: 100;
		max-width: 440px;
		width: 90vw;
		box-shadow: var(--shadow);
		max-height: 85vh;
		overflow-y: auto;
	}
	.shortcuts-grid {
		display: grid;
		gap: 10px;
		margin: 14px 0;
	}
	.shortcuts-grid div {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.88rem;
	}
	.shortcuts-grid code {
		padding: 3px 6px;
		border-radius: 6px;
		background: var(--chip);
		color: var(--accent);
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.82rem;
	}
	.full-btn {
		width: 100%;
		margin-top: 10px;
	}
</style>
