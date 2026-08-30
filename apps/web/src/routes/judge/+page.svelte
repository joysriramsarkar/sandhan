<script lang="ts">
	import { t } from '$lib/i18n';

	interface JudgeTask {
		query: string;
		title: string;
		url: string;
		snippet: string;
	}

	const SAMPLE_TASKS: JudgeTask[] = [
		{
			query: 'রবীন্দ্রনাথ ঠাকুর',
			title: 'রবীন্দ্রনাথ ঠাকুর - উইকিপিডিয়া',
			url: 'https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর',
			snippet: 'রবীন্দ্রনাথ ঠাকুর (৭ মে ১৮৬১ – ৭ আগস্ট ১৯৪১) ছিলেন একজন বাঙালি বহুবিদ্যাবিশারদ, কবি, সুরকার, এবং চিত্রশিল্পী যিনি বাংলা সাহিত্য ও সংগীতকে বিশ্বমঞ্চে অধিষ্ঠিত করেছিলেন।'
		},
		{
			query: 'পদ্মা সেতু দৈর্ঘ্য',
			title: 'পদ্মা সেতু - উইকিপিডিয়া',
			url: 'https://bn.wikipedia.org/wiki/পদ্মা_সেতু',
			snippet: 'পদ্মা সেতু হলো বাংলাদেশের পদ্মা নদীর উপর নির্মিত একটি বহুমুখী সড়ক ও রেল সেতু। এর মূল দৈর্ঘ্য ৬.১৫ কিলোমিটার।'
		},
		{
			query: 'বাংলাদেশের স্বাধীনতা দিবস',
			title: 'স্বাধীনতা দিবস (বাংলাদেশ) - উইকিপিডিয়া',
			url: 'https://bn.wikipedia.org/wiki/স্বাধীনতা_দিবস_(বাংলাদেশ)',
			snippet: '২৬ মার্চ বাংলাদেশের স্বাধীনতা দিবস। ১৯৭১ সালের এই দিনে জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের আহ্বানে স্বাধীনতা যুদ্ধের সূচনা ঘটে।'
		}
	];

	let currentIndex = 0;
	let submittedCount = 0;
	let lastSubmittedRating: number | null = null;
	let showSuccessToast = false;

	$: currentTask = SAMPLE_TASKS[currentIndex % SAMPLE_TASKS.length];

	function submitRating(grade: number) {
		lastSubmittedRating = grade;
		submittedCount++;
		showSuccessToast = true;
		setTimeout(() => {
			showSuccessToast = false;
			currentIndex++;
		}, 800);
	}
</script>

<svelte:head>
	<title>মানব-রায় প্ল্যাটফর্ম (/judge) — {t('appName')}</title>
</svelte:head>

<section class="judge-container">
	<div class="judge-header">
		<span class="badge">⚖️ সন্ধান জাজ প্ল্যাটফর্ম</span>
		<h1 class="page-title">সার্চ প্রাসঙ্গিকতা মানব-রায় (/judge)</h1>
		<p class="page-subtitle">
			ব্যবহারকারীর কোনো আইপি, কুকি বা পরিচয় সংরক্ষণ না করে সম্পূর্ণ গোপনীয়ভাবে সার্চ ফলাফলের গুণমান যাচাইকরণ।
		</p>
	</div>

	<div class="judge-card">
		<div class="task-query-box">
			<span class="q-label">অনুসন্ধান কিওয়ার্ড (Query):</span>
			<span class="q-val">{currentTask.query}</span>
		</div>

		<div class="doc-preview">
			<h2 class="doc-title">{currentTask.title}</h2>
			<a href={currentTask.url} target="_blank" class="doc-url">{currentTask.url}</a>
			<p class="doc-snippet">{currentTask.snippet}</p>
		</div>

		<div class="grading-section">
			<h3>এই ফলাফলটি কয়েরির জন্য কতটা প্রাসঙ্গিক? (Select Grade):</h3>
			<div class="grade-buttons">
				<button class="grade-btn g-0" on:click={() => submitRating(0)}>
					<span class="g-num">০</span>
					<span class="g-text">অপ্রাসঙ্গিক (Irrelevant)</span>
				</button>
				<button class="grade-btn g-1" on:click={() => submitRating(1)}>
					<span class="g-num">১</span>
					<span class="g-text">আংশিক প্রাসঙ্গিক (Partial)</span>
				</button>
				<button class="grade-btn g-2" on:click={() => submitRating(2)}>
					<span class="g-num">২</span>
					<span class="g-text">প্রাসঙ্গিক (Relevant)</span>
				</button>
				<button class="grade-btn g-3" on:click={() => submitRating(3)}>
					<span class="g-num">৩</span>
					<span class="g-text">নিখুঁত উত্তর (Perfect) ⭐</span>
				</button>
			</div>
		</div>

		{#if showSuccessToast}
			<div class="toast-message">
				✅ রায় সফলভাবে গৃহীত হয়েছে! (গ্রেড: {lastSubmittedRating})
			</div>
		{/if}

		<div class="judge-stats">
			<span>সম্পন্ন মূল্যায়ন: <b>{submittedCount}</b>টি</span>
			<span>বর্তমান টাস্ক: <b>#{(currentIndex % SAMPLE_TASKS.length) + 1}</b> / {SAMPLE_TASKS.length}</span>
		</div>
	</div>
</section>

<style>
	.judge-container {
		max-width: 760px;
		margin: 0 auto;
		padding: 20px 0;
	}
	.judge-header {
		text-align: center;
		margin-bottom: 28px;
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
	.judge-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 28px;
		box-shadow: var(--shadow);
	}
	.task-query-box {
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 14px 18px;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 20px;
	}
	.q-label {
		font-size: 0.85rem;
		color: var(--ink-soft);
		font-weight: 600;
	}
	.q-val {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--accent);
	}
	.doc-preview {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 20px;
		margin-bottom: 24px;
	}
	.doc-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 4px;
		color: var(--ink);
	}
	.doc-url {
		font-size: 0.82rem;
		color: var(--accent);
		display: inline-block;
		margin-bottom: 10px;
		word-break: break-all;
	}
	.doc-snippet {
		font-size: 0.94rem;
		color: var(--ink-soft);
		line-height: 1.6;
	}
	.grading-section h3 {
		font-size: 1rem;
		margin-bottom: 14px;
		color: var(--ink);
	}
	.grade-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 10px;
	}
	.grade-btn {
		background: var(--bg);
		border: 1.5px solid var(--line);
		border-radius: 12px;
		padding: 14px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		transition: all 0.2s;
	}
	.grade-btn:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
		background: var(--bg-soft);
	}
	.g-num {
		font-family: 'Outfit', sans-serif;
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--ink);
	}
	.g-text {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink-soft);
		text-align: center;
	}
	.g-3 .g-num { color: var(--accent); }
	.toast-message {
		margin-top: 16px;
		padding: 12px;
		border-radius: 10px;
		background: var(--chip);
		color: var(--accent);
		font-weight: 600;
		text-align: center;
		animation: fadeIn 0.2s;
	}
	.judge-stats {
		margin-top: 24px;
		border-top: 1px solid var(--line);
		padding-top: 16px;
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
</style>
