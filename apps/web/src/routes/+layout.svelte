<script lang="ts">
	import { onMount } from 'svelte';
	import { t, setLocale, getLocale, type Locale } from '$lib/i18n';
	import { deriveKey, decryptJSON, type EncryptedPayload } from '$lib/crypto';

	let currentTheme = 'light';
	let currentLocale: Locale = 'bn';
	let showHistoryDrawer = false;
	let showShortcutsModal = false;
	let historyPassphrase = '';
	let historyUnlocked = false;
	let encryptedHistory: Array<EncryptedPayload & { _pt?: { q: string; ts: number } }> = [];

	onMount(() => {
		currentTheme = localStorage.getItem('sondhan_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
		localStorage.setItem('sondhan_theme', currentTheme);
	}

	function handleLocaleChange(loc: Locale) {
		currentLocale = loc;
		setLocale(loc);
		location.reload();
	}

	function loadHistoryFromStorage() {
		try {
			encryptedHistory = JSON.parse(localStorage.getItem('sondhan_history') || '[]');
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
			localStorage.removeItem('sondhan_history');
			encryptedHistory = [];
			historyUnlocked = false;
		}
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
		}
	}
</script>

<svelte:head>
	<title>{t('appName')} — {t('tagline')}</title>
</svelte:head>

<header>
	<div class="header-bar">
		<a href="/" class="brand-logo">
			<span class="logo-badge">স</span>
			<span class="logo-text">{t('appName')}</span>
		</a>

		<nav class="nav-links">
			<a href="/" class="nav-item">{t('nav.search')}</a>
			<a href="/dashboard" class="nav-item">{t('nav.dashboard')}</a>
			<a href="/judge" class="nav-item">{t('nav.judge')}</a>
			<a href="/design" class="nav-item">{t('nav.design')}</a>
			<a href="/launch" class="nav-item">{t('nav.launch')}</a>

			<!-- Language Switcher -->
			<div class="lang-picker">
				<button class="lang-btn" class:active={currentLocale === 'bn'} on:click={() => handleLocaleChange('bn')}>বাংলা</button>
				<button class="lang-btn" class:active={currentLocale === 'en'} on:click={() => handleLocaleChange('en')}>EN</button>
				<button class="lang-btn" class:active={currentLocale === 'hi'} on:click={() => handleLocaleChange('hi')}>हिन्दी</button>
			</div>

			<!-- History Button -->
			<button class="action-btn history-trigger" on:click={() => { showHistoryDrawer = true; loadHistoryFromStorage(); }}>
				🔒 {t('historyTitle')}
			</button>

			<!-- Theme Toggle Button -->
			<button class="action-btn theme-toggle" on:click={toggleTheme} title="থিম বদল (d)">
				{currentTheme === 'dark' ? '☀️' : '🌙'}
			</button>
		</nav>
	</div>
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
								<div class="ct-snippet">{item.ct.slice(0, 36)}...</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<button class="danger-btn" on:click={clearHistory}>🗑️ {t('clear')}</button>
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
		<p><b>{t('appName')}</b> — একটি উন্মুক্ত, মুক্ত ও স্বাধীন সার্চ ইঞ্জিন · লাইসেন্স: AGPL-3.0 · শূন্য ট্র্যাকিং</p>
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
	:global(body) {
		font-family: 'Noto Sans Bengali', system-ui, sans-serif;
		background: var(--bg);
		color: var(--ink);
		line-height: 1.65;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		transition: background 0.3s ease, color 0.3s ease;
	}
	:global(a) { color: var(--accent); text-decoration: none; }
	:global(button) { font-family: inherit; cursor: pointer; border: none; outline: none; }

	header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--line);
	}
	.header-bar {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		gap: 16px;
	}
	.brand-logo {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: 'Noto Serif Bengali', serif;
		font-weight: 900;
		font-size: 1.4rem;
		color: var(--ink);
	}
	.logo-badge {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: linear-gradient(135deg, var(--accent), var(--warm));
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 1.2rem;
		box-shadow: 0 4px 12px rgba(14, 122, 99, 0.25);
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.nav-item {
		padding: 6px 12px;
		border-radius: 8px;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.92rem;
		transition: all 0.2s;
	}
	.nav-item:hover {
		background: var(--bg-soft);
		color: var(--ink);
	}
	.lang-picker {
		display: flex;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 2px;
	}
	.lang-btn {
		padding: 4px 8px;
		border-radius: 6px;
		background: transparent;
		color: var(--ink-soft);
		font-size: 0.78rem;
		font-weight: 600;
	}
	.lang-btn.active {
		background: var(--bg-elev);
		color: var(--accent);
		box-shadow: 0 2px 6px rgba(0,0,0,0.05);
	}
	.action-btn {
		padding: 6px 12px;
		border-radius: 8px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.88rem;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}
	.action-btn:hover {
		background: var(--bg-soft);
	}
	main {
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
		padding: 30px 20px 80px;
		flex: 1;
	}
	footer {
		border-top: 1px solid var(--line);
		padding: 24px 20px;
		text-align: center;
		background: var(--bg-soft);
		color: var(--ink-soft);
		font-size: 0.88rem;
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
		width: 400px;
		max-width: 90vw;
		height: 100vh;
		background: var(--bg-elev);
		border-left: 1px solid var(--line);
		z-index: 100;
		padding: 24px;
		display: flex;
		flex-direction: column;
		box-shadow: -10px 0 30px rgba(0,0,0,0.2);
	}
	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.drawer-desc {
		font-size: 0.85rem;
		color: var(--ink-soft);
		margin-bottom: 16px;
	}
	.unlock-box {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}
	.unlock-box input {
		flex: 1;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
	}
	.primary-btn {
		padding: 8px 16px;
		border-radius: 8px;
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
	}
	.danger-btn {
		padding: 10px;
		border-radius: 8px;
		background: var(--bg-soft);
		color: #e63946;
		font-weight: 600;
		margin-top: 10px;
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
		padding: 12px;
	}
	.card-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--ink-soft);
		margin-bottom: 4px;
	}
	.enc-tag {
		color: var(--accent);
		font-weight: 600;
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
		z-index: 100;
		max-width: 460px;
		width: 90%;
		box-shadow: var(--shadow);
	}
	.shortcuts-grid {
		display: grid;
		gap: 12px;
		margin: 16px 0;
	}
	.shortcuts-grid div {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.shortcuts-grid code {
		padding: 4px 8px;
		border-radius: 6px;
		background: var(--chip);
		color: var(--accent);
		font-family: 'IBM Plex Mono', monospace;
	}
	.full-btn {
		width: 100%;
	}
</style>
