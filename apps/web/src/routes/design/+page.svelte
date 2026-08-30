<script lang="ts">
	import { t } from '$lib/i18n';
	import { deriveKey, encryptJSON, decryptJSON, type EncryptedPayload } from '$lib/crypto';

	let labPassphrase = 'sondhan-vault-key-2026';
	let labPlaintext = 'সন্ধান উন্মুক্ত সার্চ ইঞ্জিন — আপনার তথ্য আপনারই কাছে';
	let encryptedResult: EncryptedPayload | null = null;
	let decryptedResult: string | null = null;
	let errorMessage = '';

	async function runEncrypt() {
		errorMessage = '';
		try {
			const key = await deriveKey(labPassphrase);
			encryptedResult = await encryptJSON(key, { text: labPlaintext, timestamp: Date.now() });
			decryptedResult = null;
		} catch (e: any) {
			errorMessage = e.message;
		}
	}

	async function runDecrypt() {
		errorMessage = '';
		if (!encryptedResult) {
			errorMessage = 'প্রথমে এনক্রিপ্ট করুন।';
			return;
		}
		try {
			const key = await deriveKey(labPassphrase);
			const data = await decryptJSON<{ text: string; timestamp: number }>(key, encryptedResult);
			decryptedResult = data.text;
		} catch (e: any) {
			errorMessage = 'ডিক্রিপশন ব্যর্থ — ভুল পাসফ্রেজ অথবা সাইফারটেক্সট পরিবর্তিত হয়েছে!';
		}
	}
</script>

<svelte:head>
	<title>ডিজাইন সিস্টেম ও ক্রিপ্টো ল্যাব — {t('appName')}</title>
</svelte:head>

<section class="design-page">
	<div class="header-center">
		<span class="badge">🎨 ডিজাইন সিস্টেম ও প্রযুক্তি ল্যাব</span>
		<h1 class="page-title">সন্ধান ডিজাইন ও ক্রিপ্টোগ্রাফি আর্কিটেকচার</h1>
		<p class="page-subtitle">টাইপোগ্রাফি, কালার প্যালেট, ও ব্রাউজার-নেটিভ WebCrypto বাস্তবায়ন।</p>
	</div>

	<!-- Live WebCrypto Sandbox -->
	<div class="section-card">
		<h2>🔐 লাইভ WebCrypto AES-256-GCM স্যান্ডবক্স</h2>
		<p class="section-desc">
			আপনার ব্রাউজারের <code>crypto.subtle</code> এপিআই ব্যবহার করে সরাসরি এনক্রিপশন ও ডিক্রিপশন পরীক্ষা করুন।
		</p>

		<div class="form-group">
			<label for="lab-pass">পাসফ্রেজ (Key Derivation Input):</label>
			<input id="lab-pass" type="password" bind:value={labPassphrase} />
		</div>

		<div class="form-group">
			<label for="lab-text">প্লেইনটেক্সট কোয়েরি (Plaintext Message):</label>
			<input id="lab-text" type="text" bind:value={labPlaintext} />
		</div>

		<div class="action-row">
			<button class="primary-btn" on:click={runEncrypt}>🔒 AES-256-GCM এনক্রিপ্ট</button>
			<button class="secondary-btn" on:click={runDecrypt}>🔓 যাচাই ডিক্রিপ্ট</button>
		</div>

		{#if errorMessage}
			<div class="error-box">⚠️ {errorMessage}</div>
		{/if}

		{#if encryptedResult}
			<div class="code-box">
				<div><b>নন্স (96-bit IV):</b> <code>{encryptedResult.iv}</code></div>
				<div style="margin-top: 8px;"><b>সাইফারটেক্সট + অথেনটিকেশন ট্যাগ (Base64):</b></div>
				<code class="ct-block">{encryptedResult.ct}</code>
			</div>
		{/if}

		{#if decryptedResult}
			<div class="success-box">
				✅ <b>সফলভাবে ডিক্রিপ্ট হয়েছে:</b> "{decryptedResult}"
			</div>
		{/if}
	</div>

	<!-- Color Palette Tokens -->
	<div class="section-card">
		<h2>🎨 ডিজাইন টোকেন ও কালার প্যালেট</h2>
		<div class="colors-grid">
			<div class="color-tile" style="background: #0e7a63; color: #fff;">
				<b>Forest Teal</b>
				<span>#0e7a63</span>
				<small>Primary Accent</small>
			</div>
			<div class="color-tile" style="background: #e0762f; color: #fff;">
				<b>Terracotta</b>
				<span>#e0762f</span>
				<small>Warm Accent</small>
			</div>
			<div class="color-tile" style="background: #1c2321; color: #fff;">
				<b>Deep Ink</b>
				<span>#1c2321</span>
				<small>Typography</small>
			</div>
			<div class="color-tile" style="background: #f7f4ee; color: #1c2321; border: 1px solid #e3dccc;">
				<b>Parchment Light</b>
				<span>#f7f4ee</span>
				<small>Light Canvas</small>
			</div>
			<div class="color-tile" style="background: #0e1513; color: #e9efe9;">
				<b>Obsidian Dark</b>
				<span>#0e1513</span>
				<small>Dark Canvas</small>
			</div>
		</div>
	</div>
</section>

<style>
	.design-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px 0;
	}
	.header-center {
		text-align: center;
		margin-bottom: 30px;
	}
	.badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 20px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 8px;
	}
	.page-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 2.2rem;
		font-weight: 900;
		color: var(--ink);
		margin-bottom: 8px;
	}
	.page-subtitle {
		font-size: 0.95rem;
		color: var(--ink-soft);
	}
	.section-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 28px;
		box-shadow: var(--shadow);
		margin-bottom: 24px;
	}
	.section-card h2 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.35rem;
		margin-bottom: 8px;
		color: var(--ink);
	}
	.section-desc {
		font-size: 0.92rem;
		color: var(--ink-soft);
		margin-bottom: 20px;
	}
	.form-group {
		margin-bottom: 16px;
	}
	.form-group label {
		display: block;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 6px;
	}
	.form-group input {
		width: 100%;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-family: inherit;
		font-size: 1rem;
	}
	.action-row {
		display: flex;
		gap: 12px;
		margin-top: 20px;
	}
	.primary-btn {
		padding: 10px 20px;
		border-radius: 10px;
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
		font-size: 0.92rem;
	}
	.secondary-btn {
		padding: 10px 20px;
		border-radius: 10px;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.92rem;
	}
	.code-box {
		margin-top: 20px;
		padding: 16px;
		border-radius: 12px;
		background: var(--code);
		color: #2fbf9a;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.85rem;
	}
	.ct-block {
		display: block;
		word-break: break-all;
		margin-top: 4px;
	}
	.success-box {
		margin-top: 16px;
		padding: 14px;
		border-radius: 12px;
		background: var(--chip);
		color: var(--accent);
		font-weight: 600;
	}
	.error-box {
		margin-top: 16px;
		padding: 14px;
		border-radius: 12px;
		background: #fbe8d8;
		color: #d90429;
		font-weight: 600;
	}
	.colors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 14px;
	}
	.color-tile {
		border-radius: 14px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.color-tile b { font-size: 0.95rem; }
	.color-tile span { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; }
	.color-tile small { opacity: 0.8; font-size: 0.75rem; }
</style>
