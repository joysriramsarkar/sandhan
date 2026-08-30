<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>সন্ধান উন্মুক্ত ঘোষণা (Public Launch) — {t('appName')}</title>
</svelte:head>

<article class="launch-page">
	<div class="launch-header">
		<span class="badge">🚀 সার্বজনীন মুক্তি — ২০২৬</span>
		<h1 class="page-title">সন্ধান v0.1.0 «প্রথম ভোর»</h1>
		<p class="page-subtitle">সার্চ, এখন আপনার নিজের হাতে। একটি মুক্ত, উন্মুক্ত ও গোপনীয়তা-প্রথম সার্চ ইঞ্জিন।</p>
	</div>

	<div class="manifesto-card">
		<h2>📜 আমাদের ইশতেহার (Our Manifesto)</h2>
		<p class="manifesto-text">
			আজকের ইন্টারনেটে আমাদের প্রতিটি ভাবনা, জিজ্ঞাসা ও অনুসন্ধানকে বিক্রি করা হয় বিজ্ঞাপনের বাজারে। সার্চ ইঞ্জিনগুলো জানে আমরা কী ভাবছি, কী খুঁজছি, এবং কাকে বিশ্বাস করছি।
		</p>
		<p class="manifesto-text">
			<b>সন্ধান</b> তৈরি হয়েছে এই অবস্থার পরিবর্তনের জন্য। এটি এমন একটি সার্চ ইঞ্জিন যা আপনার সার্চ কোয়েরি পড়তে পারে না — কারণ তা আপনার ডিভাইসেই এনক্রিপ্ট হয়ে যায়। এটি সবার জন্য উন্মুক্ত (AGPLv3) এবং বিশ্বের ২৭ কোটি বাংলা ভাষাভাষীর জ্ঞানযাত্রাকে অগ্রাধিকার দেয়।
		</p>

		<div class="pillars-grid">
			<div class="pillar">
				<div class="p-icon">🔓</div>
				<h4>শতভাগ উন্মুক্ত</h4>
				<p>AGPLv3 লাইসেন্সে প্রকাশিত — কেউ এটিকে কুক্ষিগত করতে পারবে না।</p>
			</div>
			<div class="pillar">
				<div class="p-icon">🔐</div>
				<h4>শূন্য-জ্ঞান গোপনীয়তা</h4>
				<p>সার্ভার কোনো আইপি বা কোয়েরি সংরক্ষণ করে না। ক্লায়েন্ট-সাইড AES-256-GCM নিরাপত্তা।</p>
			</div>
			<div class="pillar">
				<div class="p-icon">⚡</div>
				<h4>স্বচ্ছ ও স্বাধীন</h4>
				<p>উন্মুক্ত অ্যালগরিদম ও কমিউনিটি Goggles দিয়ে পছন্দমতো র‍্যাংকিং।</p>
			</div>
		</div>
	</div>

	<!-- Good First Issues -->
	<div class="issues-card">
		<h2>🤝 মুক্ত অবদানের সুযোগ (Good First Issues)</h2>
		<p style="color: var(--ink-soft); font-size: 0.92rem; margin-bottom: 16px;">
			আপনি একজন ডেভেলপার, অনুবাদক, ডিজাইনার বা ভাষাপ্রেমী? সন্ধানে অবদান রাখুন:
		</p>

		<div class="issue-list">
			<div class="issue-item">
				<span class="i-tag">NLP / Language</span>
				<b>বাংলা একক রূপান্তর সম্প্রসারণ (মন, সের, ছটাক, কাঠা)</b>
				<p>ইনস্ট্যান্ট অ্যান্সার ইঞ্জিনে লোকাল একক কনভার্টারের লজিক উন্নত করুন।</p>
			</div>
			<div class="issue-item">
				<span class="i-tag">Ranking / Goggles</span>
				<b>কমিউনিটি Goggles প্রিসেট তালিকা সমৃদ্ধকরণ</b>
				<p>শিক্ষা, স্বাস্থ্য ও টেক ব্লগের জন্য কিউরেটেড র‍্যাংকিং রুল তৈরি।</p>
			</div>
			<div class="issue-item">
				<span class="i-tag">Frontend / UI</span>
				<b>উন্নত বাংলা ভয়েস সার্চ ও অ্যাক্সেসিবিলিটি</b>
				<p>ব্রাউজার স্পিচ রিকগনিশন এপিআই সমন্বয় ও WCAG 2.2 AA মান নিশ্চিতকরণ।</p>
			</div>
		</div>
	</div>
</article>

<style>
	.launch-page {
		max-width: 860px;
		margin: 0 auto;
		padding: 16px 0;
		width: 100%;
	}
	.launch-header {
		text-align: center;
		margin-bottom: 24px;
	}
	.badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 20px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 600;
		margin-bottom: 6px;
	}
	.page-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 900;
		color: var(--ink);
		margin-bottom: 6px;
	}
	.page-subtitle {
		font-size: clamp(0.9rem, 3.2vw, 1.05rem);
		color: var(--ink-soft);
	}
	.manifesto-card, .issues-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: clamp(16px, 4vw, 30px);
		box-shadow: var(--shadow);
		margin-bottom: 20px;
		word-break: break-word;
	}
	.manifesto-card h2, .issues-card h2 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.3rem;
		margin-bottom: 12px;
		color: var(--ink);
	}
	.manifesto-text {
		font-size: 0.95rem;
		color: var(--ink-soft);
		line-height: 1.65;
		margin-bottom: 14px;
	}
	.pillars-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
		margin-top: 18px;
	}
	.pillar {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 14px;
	}
	.p-icon {
		font-size: 22px;
		margin-bottom: 6px;
	}
	.pillar h4 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1rem;
		margin-bottom: 4px;
		color: var(--ink);
	}
	.pillar p {
		font-size: 0.84rem;
		color: var(--ink-soft);
	}
	.issue-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.issue-item {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 14px;
	}
	.i-tag {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--chip);
		color: var(--accent);
		margin-bottom: 4px;
	}
	.issue-item b {
		display: block;
		font-size: 0.95rem;
		color: var(--ink);
		margin-bottom: 4px;
	}
	.issue-item p {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
</style>
