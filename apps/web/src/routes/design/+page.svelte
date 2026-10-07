<script lang="ts">
	import GIcon from '$lib/components/GIcon.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';

	let demoQuery = '';

	const brandColors = [
		{ name: 'Blue', hex: '#4285F4', token: '--g-blue', use: 'লোগো, লিংক, প্রাইমারি বাটন' },
		{ name: 'Red', hex: '#EA4335', token: '--g-red', use: 'সতর্কতা, লোগো' },
		{ name: 'Yellow', hex: '#FBBC05', token: '--g-yellow', use: 'AI ও ইশারা' },
		{ name: 'Green', hex: '#34A853', token: '--g-green', use: 'সফলতা ও সতেজতা' }
	];

	const neutralLight = [
		['--g-bg', '#ffffff', 'পৃষ্ঠার পটভূমি'],
		['--g-surface-2', '#f8f9fa', 'বাটন, চিপ, হোভার'],
		['--g-footer-bg', '#f2f2f2', 'ফুটার'],
		['--g-text', '#202124', 'মূল টেক্সট'],
		['--g-text-2', '#4d5156', 'স্নিপেট'],
		['--g-text-3', '#70757a', 'সেকেন্ডারি তথ্য'],
		['--g-border', '#dfe1e5', 'বর্ডার'],
		['--g-divider', '#ebebeb', 'বিভাজক রেখা']
	];

	const darkTokens = [
		['--g-bg', '#202124', 'পটভূমি'],
		['--g-surface-2', '#303134', 'সারফেস'],
		['--g-link', '#99c3ff', 'ফলাফলের শিরোনাম'],
		['--g-divider', '#3c4043', 'বিভাজক']
	];

	const typeScale = [
		['Display / wordmark', '2.5–5.5rem', '500'],
		['ফলাফল শিরোনাম', '20px', '400'],
		['সেকশন শিরোনাম', '18px', '400'],
		['বডি ও স্নিপেট', '14px', '400'],
		['মেটা / URL', '12px', '400'],
		['বাটন লেবেল', '14px', '500']
	];
</script>

<svelte:head>
	<title>ডিজাইন সিস্টেম — সন্ধান (Google Search রেফারেন্স)</title>
	<meta name="description" content="সন্ধান সার্চ ইঞ্জিনের Google Search-অনুপ্রাণিত ডিজাইন সিস্টেম: রঙ, টাইপোগ্রাফি, উপাদান ও ইন্টার‍্যাকশন নির্দেশিকা।" />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://sandhan.site/design" />
</svelte:head>

<article class="ds">
	<header class="ds-header">
		<Wordmark size="md" />
		<h1>ডিজাইন সিস্টেম</h1>
		<p>
			সন্ধানের পুরো ইন্টারফেস Google Search-এর রেফারেন্স ডিজাইন ভাষায় তৈরি — একই রঙ, একই
			টাইপোগ্রাফি, একই বিন্যাস ও একই ইন্টার‍্যাকশন ব্যাকরণ, কোনো ব্যতিক্রম ছাড়া। নিচের সব টোকেন
			<code>brand/tokens.json</code> এবং <code>+layout.svelte</code> এর <code>--g-*</code> ভেরিয়েবলে বাস্তবায়িত।
		</p>
	</header>

	<section class="ds-section">
		<h2>১. ব্র্যান্ড প্যালেট</h2>
		<div class="swatch-grid">
			{#each brandColors as color}
				<div class="swatch">
					<span class="swatch-chip" style={`background:${color.hex}`}></span>
					<div class="swatch-meta">
						<b>{color.name}</b>
						<code>{color.token}</code>
						<span>{color.hex}</span>
						<small>{color.use}</small>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="ds-section">
		<h2>২. নিউট্রাল ও সারফেস (লাইট)</h2>
		<div class="token-table">
			{#each neutralLight as [token, hex, use]}
				<div class="token-row">
					<span class="token-dot" style={`background:${hex}`}></span>
					<code>{token}</code>
					<span class="token-hex">{hex}</span>
					<span class="token-use">{use}</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="ds-section">
		<h2>৩. ডার্ক থিম</h2>
		<div class="token-table">
			{#each darkTokens as [token, hex, use]}
				<div class="token-row">
					<span class="token-dot" style={`background:${hex}`}></span>
					<code>{token}</code>
					<span class="token-hex">{hex}</span>
					<span class="token-use">{use}</span>
				</div>
			{/each}
		</div>
		<p class="ds-note">
			ডার্ক থিমে রঙিন টোকেনগুলো নরম (desaturated) সংস্করণে বদলে যায় — যেমন <code>#1a73e8 → #8ab4f8</code>।
			থিম বদলাতে <kbd>?</kbd> চেপে শর্টকাট দেখুন বা হেডারের 🌙 বাটনে চাপুন।
		</p>
	</section>

	<section class="ds-section">
		<h2>৪. টাইপোগ্রাফি</h2>
		<p class="ds-type-sample">
			রবীন্দ্রনাথ ঠাকুর — বিশ্বকবি, ১৯১৩ সালে সাহিত্যে নোবেল পুরস্কারে ভূষিত।
		</p>
		<div class="token-table">
			{#each typeScale as [label, size, weight]}
				<div class="token-row">
					<span class="token-use">{label}</span>
					<span class="token-hex">{size}</span>
					<span class="token-hex">weight {weight}</span>
				</div>
			{/each}
		</div>
		<p class="ds-note">
			ফন্ট স্ট্যাক: <code>Roboto, 'Noto Sans Bengali', Arial, sans-serif</code> — বাংলা গ্লিফের জন্য
			Noto Sans Bengali স্বয়ংক্রিয়ভাবে ব্যবহৃত হয়।
		</p>
	</section>

	<section class="ds-section">
		<h2>৫. অনুসন্ধান বক্স ও চিপ</h2>
		<div class="demo-searchbox">
			<SearchBox bind:value={demoQuery} variant="serp" placeholder="খুঁজুন…" />
		</div>
		<div class="demo-row">
			<button class="g-chipbtn">সব</button>
			<button class="g-chipbtn">ছবি</button>
			<button class="g-chipbtn">খবর</button>
			<span class="g-chip">!w উইকিপিডিয়া</span>
		</div>
	</section>

	<section class="ds-section">
		<h2>৬. বাটন</h2>
		<div class="demo-row">
			<button class="btn-filled">অনুসন্ধান করুন</button>
			<button class="btn-text">বাতিল</button>
			<button class="btn-tonal">আমি ভাগ্যবান বোধ করছি</button>
			<button class="btn-pill">
				<span class="ai-dot"><GIcon name="ai" size={16} /></span> AI Mode
			</button>
		</div>
	</section>

	<section class="ds-section">
		<h2>৭. ফলাফল কার্ড (SERP রেফারেন্স)</h2>
		<div class="demo-result">
			<div class="demo-src">
				<span class="demo-favicon">স</span>
				<span class="demo-src-lines">
					<span class="demo-src-name">bn.wikipedia.org</span>
					<span class="demo-src-url">https://bn.wikipedia.org › wiki › পদ্মা_সেতু</span>
				</span>
			</div>
			<h3><a href="/?q=পদ্মা সেতু">পদ্মা সেতু — উইকিপিডিয়া</a></h3>
			<p>
				পদ্মা বহুমুখী সেতু বাংলাদেশের পদ্মা নদীর উপর নির্মিত একটি বহুমুখী সড়ক ও রেল সেতু। এটি বাংলাদেশের
				সবচেয়ে বড় সেতু এবং দেশের দক্ষিণাঞ্চলকে রাজধানী ঢাকার সঙ্গে যুক্ত করেছে।
			</p>
			<div class="demo-actions">
				<button class="btn-text small"><GIcon name="info" size={14} /> কেন এই ফলাফল?</button>
				<button class="btn-text small"><GIcon name="shield" size={14} /> ছদ্মবেশী ভিউ</button>
			</div>
		</div>
	</section>

	<section class="ds-section">
		<h2>৮. AI Overview কার্ড</h2>
		<div class="demo-ai">
			<div class="demo-ai-head">
				<span class="ai-dot lg"><GIcon name="ai" size={20} /></span>
				<span class="demo-ai-title">AI Overview</span>
				<span class="demo-ai-badge">সন্ধান AI</span>
			</div>
			<p>
				পদ্মা সেতু ২০২২ সালের ২৫ জুন উদ্বোধন করা হয় এবং এটি দেশের প্রথম নিজস্ব অর্থায়নে নির্মিত সেতু।
				আরও জানতে <a href="/?q=পদ্মা সেতু">এই ফলাফলগুলো</a> দেখুন।
			</p>
			<div class="demo-chips">
				<span class="g-chip"><GIcon name="search" size={14} /> bn.wikipedia.org</span>
				<span class="g-chip"><GIcon name="search" size={14} /> padma.gov.bd</span>
			</div>
		</div>
	</section>

	<section class="ds-section">
		<h2>৯. নীতি</h2>
		<ul class="ds-rules">
			<li>প্রতিটি পৃষ্ঠা (হোম, SERP, ড্যাশবোর্ড, ঘোষণা, এক্সটেনশন) একই <code>--g-*</code> টোকেন ব্যবহার করবে।</li>
			<li>আইকন সবসময় ইনলাইন SVG — কোনো তৃতীয় পক্ষের স্ক্রিপ্ট বা ট্র্যাকার নয়।</li>
			<li>রেডিআই: কার্ড ৮px, সার্চ পিল ২৪px, বাটন ৪px, চিপ ১৬px/999px।</li>
			<li>শ্যাডো: হোভারে <code>0 1px 6px rgba(32,33,36,.28)</code>, ফোকাসে <code>0 4px 6px …</code>।</li>
			<li>বাংলা টেক্সট কখনো ভাঙা বা উপেক্ষিত হবে না — ডিফল্ট ভাষা বাংলা।</li>
		</ul>
	</section>

	<footer class="ds-footer">
		<a href="/">← সার্চে ফিরে যান</a>
		<a href="/launch">ইশতেহার</a>
		<a href="/dashboard">সিস্টেম অবস্থা</a>
	</footer>
</article>

<style>
	.ds {
		max-width: 860px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 36px;
	}
	.ds-header h1 {
		font-size: 32px;
		font-weight: 400;
		color: var(--g-text);
		margin: 12px 0 8px;
	}
	.ds-header p {
		font-size: 15px;
		line-height: 1.6;
		color: var(--g-text-2);
	}
	.ds-section h2 {
		font-size: 20px;
		font-weight: 400;
		color: var(--g-text);
		margin-bottom: 14px;
	}
	code {
		background: var(--g-surface-2);
		border-radius: 4px;
		padding: 1px 6px;
		font-size: 13px;
		color: var(--g-text);
	}
	kbd {
		background: var(--g-surface-2);
		border: 1px solid var(--g-border);
		border-radius: 3px;
		padding: 0 5px;
		font-size: 12px;
	}
	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 14px;
	}
	.swatch {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		overflow: hidden;
	}
	.swatch-chip {
		display: block;
		height: 72px;
	}
	.swatch-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 12px 14px;
		font-size: 13px;
		color: var(--g-text-2);
	}
	.swatch-meta b {
		color: var(--g-text);
		font-weight: 500;
	}
	.token-table {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		overflow: hidden;
	}
	.token-row {
		display: grid;
		grid-template-columns: 22px 1fr 90px 1fr;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-bottom: 1px solid var(--g-divider);
		font-size: 13px;
		color: var(--g-text-2);
	}
	.token-row:last-child {
		border-bottom: none;
	}
	.token-dot {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1px solid var(--g-border);
	}
	.token-hex {
		color: var(--g-text-3);
		font-family: ui-monospace, Menlo, Consolas, monospace;
		font-size: 12px;
	}
	.ds-note {
		margin-top: 12px;
		font-size: 13px;
		line-height: 1.6;
		color: var(--g-text-2);
	}
	.ds-type-sample {
		font-size: 18px;
		line-height: 1.7;
		color: var(--g-text);
		margin-bottom: 14px;
	}
	.demo-searchbox {
		max-width: 584px;
		margin-bottom: 16px;
	}
	.demo-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.g-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: var(--g-chip);
		border-radius: 16px;
		font-size: 13px;
		color: var(--g-text-2);
	}
	.g-chipbtn {
		padding: 6px 14px;
		border: 1px solid var(--g-border);
		border-radius: 16px;
		font-size: 13px;
		color: var(--g-text-2);
		background: transparent;
	}
	.g-chipbtn:hover {
		background: var(--g-surface-2);
	}
	.btn-filled {
		height: 36px;
		padding: 0 20px;
		border-radius: 4px;
		background: var(--g-blue);
		color: #fff;
		font-size: 14px;
		font-weight: 500;
	}
	.btn-filled:hover {
		background: var(--g-blue-hover);
	}
	.btn-text {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 4px;
		color: var(--g-blue);
		font-size: 14px;
		font-weight: 500;
	}
	.btn-text:hover {
		background: color-mix(in srgb, var(--g-blue) 10%, transparent);
	}
	.btn-text.small {
		font-size: 13px;
		font-weight: 400;
		padding: 0;
	}
	.btn-tonal {
		height: 36px;
		padding: 0 16px;
		border-radius: 4px;
		background: var(--g-surface-2);
		border: 1px solid var(--g-surface-2);
		color: var(--g-text-2);
		font-size: 14px;
		font-weight: 500;
	}
	.btn-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 16px;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		font-size: 14px;
		color: var(--g-text);
	}
	.ai-dot {
		display: inline-flex;
	}
	.ai-dot.lg {
		font-size: 0;
	}
	.demo-result,
	.demo-ai {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		padding: 16px 18px;
	}
	.demo-ai {
		border-radius: 16px;
		background: linear-gradient(180deg, color-mix(in srgb, var(--g-blue) 7%, transparent), transparent 65%);
	}
	.demo-src {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 6px;
	}
	.demo-favicon {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--g-surface-2);
		border: 1px solid var(--g-divider);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: var(--g-text-2);
	}
	.demo-src-lines {
		display: flex;
		flex-direction: column;
	}
	.demo-src-name {
		font-size: 14px;
		color: var(--g-text);
	}
	.demo-src-url {
		font-size: 12px;
		color: var(--g-text-2);
	}
	.demo-result h3 {
		font-size: 20px;
		font-weight: 400;
		margin: 2px 0 4px;
	}
	.demo-result h3 a {
		color: var(--g-link);
	}
	.demo-result h3 a:hover {
		text-decoration: underline;
	}
	:global([data-theme='dark']) .demo-result h3 a {
		color: var(--g-blue);
	}
	.demo-result p,
	.demo-ai p {
		font-size: 14px;
		line-height: 1.58;
		color: var(--g-text-2);
		margin-bottom: 10px;
	}
	.demo-actions {
		display: flex;
		gap: 16px;
	}
	.demo-ai-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	.demo-ai-title {
		font-size: 18px;
		font-weight: 500;
		color: var(--g-text);
	}
	.demo-ai-badge {
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--g-blue) 14%, transparent);
		color: var(--g-blue);
	}
	.demo-chips {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.ds-rules {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-left: 20px;
		font-size: 14px;
		line-height: 1.6;
		color: var(--g-text-2);
	}
	.ds-footer {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		border-top: 1px solid var(--g-divider);
		padding-top: 18px;
		font-size: 14px;
	}
</style>
