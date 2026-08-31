<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { t } from '$lib/i18n';

	interface TelemetryData {
		totalQueries: number;
		totalRequests: number;
		cacheHits: number;
		cacheMisses: number;
		cacheHitRate: string;
		avgLatencyMs: number;
		p95LatencyMs: number;
		uptimeSeconds: number;
		memory: {
			rssMb: string;
			heapUsedMb: string;
			heapTotalMb: string;
		};
		engineDistribution: Record<string, number>;
		languageDistribution: Record<string, number>;
		engineHealth: Array<{
			name: string;
			endpoint: string;
			status: 'online' | 'degraded' | 'offline';
			latencyMs: number;
			lastChecked: number;
		}>;
		database: {
			provider: string;
			connected: boolean;
			statusText: string;
		};
		recentQueries: Array<{
			id: string;
			query: string;
			category: string;
			lang: string;
			engine: string;
			resultsCount: number;
			durationMs: number;
			cached: boolean;
			timestamp: number;
		}>;
	}

	let data: TelemetryData | null = null;
	let isLoading = true;
	let lastUpdated = '';
	let intervalTimer: ReturnType<typeof setInterval>;
	let isAutoRefresh = true;

	async function fetchMetrics() {
		try {
			const res = await fetch('/api/metrics');
			if (res.ok) {
				data = await res.json();
				lastUpdated = new Date().toLocaleTimeString();
			}
		} catch (err) {
			console.error('Failed to load metrics:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchMetrics();
		intervalTimer = setInterval(() => {
			if (isAutoRefresh) {
				fetchMetrics();
			}
		}, 3000);
	});

	onDestroy(() => {
		if (intervalTimer) clearInterval(intervalTimer);
	});

	function formatUptime(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h} ঘণ্টা ${m} মিনিট`;
		if (m > 0) return `${m} মিনিট ${s} সেকেন্ড`;
		return `${s} সেকেন্ড`;
	}
</script>

<svelte:head>
	<title>লাইভ সিস্টেম ও ইঞ্জিন ড্যাশবোর্ড — {t('appName')}</title>
</svelte:head>

<section class="dashboard-container">
	<div class="dashboard-header">
		<div class="header-top">
			<span class="live-pill">
				<span class="pulse-dot"></span> লাইভ রিয়েল-টাইম টেলিমেট্রি
			</span>
			<div class="header-actions-bar">
				<label class="auto-refresh-toggle">
					<input type="checkbox" bind:checked={isAutoRefresh} />
					<span>স্বয়ংক্রিয় আপডেট (প্রতি ৩ সেকেন্ড)</span>
				</label>
				<button class="refresh-btn" on:click={fetchMetrics} title="রিফ্রেশ করুন">
					🔄 রিফ্রেশ {lastUpdated ? `(${lastUpdated})` : ''}
				</button>
			</div>
		</div>

		<h1 class="page-title">সন্ধান সিস্টেম স্বাস্থ্য ও রিয়েল-টাইম ড্যাশবোর্ড</h1>
		<p class="page-subtitle">সার্ভার প্রসেস, মাল্টি-ইঞ্জিন ক্যাসকেড লেটেন্সি এবং আসল লাইভ কোয়েরি মেট্রিক্স।</p>
	</div>

	{#if isLoading && !data}
		<div class="loading-box">
			<div class="spinner"></div>
			<span>আসল লাইভ টেলিমেট্রি লোড হচ্ছে...</span>
		</div>
	{:else if data}
		<!-- Real Metrics Grid -->
		<div class="metrics-grid">
			<div class="metric-card">
				<div class="m-icon">⚡</div>
				<div class="m-label">মোট সার্চ অনুরোধ</div>
				<div class="m-val">{data.totalRequests}</div>
				<div class="m-sub">আসল অনুসন্ধান: {data.totalQueries} টি</div>
			</div>

			<div class="metric-card">
				<div class="m-icon">⏱️</div>
				<div class="m-label">গড় রেসপন্স সময় (Latency)</div>
				<div class="m-val">{data.avgLatencyMs} <small>ms</small></div>
				<div class="m-sub">p95 লেটেন্সি: {data.p95LatencyMs} ms</div>
			</div>

			<div class="metric-card">
				<div class="m-icon">💾</div>
				<div class="m-label">LRU ক্যাশ পারফরম্যান্স</div>
				<div class="m-val">{data.cacheHitRate}%</div>
				<div class="m-sub">হিট: {data.cacheHits} | মিস: {data.cacheMisses}</div>
			</div>

			<div class="metric-card">
				<div class="m-icon">🖥️</div>
				<div class="m-label">সিস্টেম মেমোরি ও আপটাইম</div>
				<div class="m-val">{data.memory.heapUsedMb} <small>MB</small></div>
				<div class="m-sub">আপটাইম: {formatUptime(data.uptimeSeconds)}</div>
			</div>
		</div>

		<!-- Database / Neon Status Card -->
		<div class="db-status-card">
			<div class="db-header">
				<div class="db-title-wrap">
					<span class="db-icon">🐘</span>
					<div>
						<h3>ডেটাবেস সংযোগ স্থিতি (Database & Storage)</h3>
						<span class="db-provider">{data.database.provider}</span>
					</div>
				</div>
				<span class="db-badge" class:connected={data.database.connected}>
					{data.database.connected ? '🟢 Neon সংযুক্ত' : '⚡ ইন-মেমরি সক্রিয়'}
				</span>
			</div>
			<p class="db-desc">{data.database.statusText}</p>
			<div class="db-tip">
				💡 <b>টিপ:</b> আপনি যদি স্থায়ীভাবে সমস্ত সার্চ লগ ও অ্যানালিটিক্স ক্লাউডে রাখতে চান, তবে আপনার প্রজেক্টের <code>.env</code> ফাইলে Neon PostgreSQL কানেকশন স্ট্রিং (<code>DATABASE_URL=postgresql://...</code>) দিয়ে দিন। সন্ধান কোনো কনফিগ ছাড়া সরাসরি Neon-এর সাথে যুক্ত হয়ে যাবে!
			</div>
		</div>

		<!-- Engine Health Cascade -->
		<div class="section-card">
			<h2>📡 সার্চ ইঞ্জিন ও ব্যাকএন্ড সার্ভিস স্বাস্থ্য</h2>
			<div class="engine-table">
				<div class="table-header">
					<span>সার্ভিস / ইঞ্জিন</span>
					<span>এন্ডপয়েন্ট</span>
					<span>লেটেন্সি</span>
					<span>অবস্থা</span>
				</div>
				{#each data.engineHealth as eng}
					<div class="table-row">
						<span class="eng-name"><b>{eng.name}</b></span>
						<span class="eng-endpoint"><code>{eng.endpoint}</code></span>
						<span class="eng-lat">{eng.latencyMs} ms</span>
						<span class="eng-status">
							<span class="status-dot"></span> সচল (Online)
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Recent Real-Time Queries Stream -->
		<div class="section-card">
			<div class="stream-header">
				<h2>🔍 রিয়েল-টাইম লাইভ কোয়েরি স্ট্রিম (Recent Live Queries)</h2>
				<span class="stream-badge">লাইভ অটো-আপডেট</span>
			</div>
			
			{#if data.recentQueries && data.recentQueries.length > 0}
				<div class="query-stream-list">
					{#each data.recentQueries as q}
						<div class="query-item">
							<div class="q-main">
								<span class="q-text">"{q.query}"</span>
								<span class="q-cat">ক্যাটাগরি: {q.category}</span>
								<span class="q-lang">ভাষা: {q.lang.toUpperCase()}</span>
							</div>
							<div class="q-meta">
								<span class="q-hits">{q.resultsCount} ফলাফল</span>
								<span class="q-dur">{q.durationMs} ms</span>
								{#if q.cached}
									<span class="q-cached">⚡ ক্যাশড</span>
								{/if}
								<span class="q-time">{new Date(q.timestamp).toLocaleTimeString()}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-stream">
					<p>এখনো কোনো অনুসন্ধান লগ হয়নি। সার্চবারে গিয়ে কিছু লিখে সার্চ করলেই এখানে সরাসরি রিয়েল-টাইম তথ্য দেখতে পাবেন!</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style>
	.dashboard-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 10px 0 30px;
		width: 100%;
	}
	.dashboard-header {
		margin-bottom: 24px;
	}
	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 10px;
	}
	.live-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 14px;
		border-radius: var(--radius-full, 20px);
		background: var(--chip);
		color: var(--accent);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 0 rgba(14, 122, 99, 0.7);
		animation: pulse 1.6s infinite;
	}
	@keyframes pulse {
		0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(14, 122, 99, 0.7); }
		70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(14, 122, 99, 0); }
		100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(14, 122, 99, 0); }
	}
	.header-actions-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.auto-refresh-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		color: var(--ink-soft);
		cursor: pointer;
	}
	.refresh-btn {
		padding: 6px 14px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 10px;
		color: var(--ink);
		font-size: 0.84rem;
		font-weight: 600;
		transition: all 0.2s;
	}
	.refresh-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.page-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		font-weight: 800;
		color: var(--ink);
		margin-bottom: 4px;
	}
	.page-subtitle {
		font-size: 0.95rem;
		color: var(--ink-soft);
	}

	.loading-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 16px;
		gap: 12px;
		color: var(--accent);
		font-weight: 600;
	}
	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--chip);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}
	.metric-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 18px;
		box-shadow: var(--shadow);
		transition: transform 0.2s;
	}
	.metric-card:hover {
		transform: translateY(-2px);
		border-color: var(--accent);
	}
	.m-icon {
		font-size: 1.4rem;
		margin-bottom: 6px;
	}
	.m-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-soft);
		margin-bottom: 4px;
	}
	.m-val {
		font-family: 'Outfit', sans-serif;
		font-size: 2rem;
		font-weight: 800;
		color: var(--accent);
		line-height: 1.1;
		margin-bottom: 6px;
	}
	.m-val small {
		font-size: 1rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.m-sub {
		font-size: 0.78rem;
		color: var(--ink-faint);
	}

	/* Database Status Card */
	.db-status-card {
		background: var(--bg-elev);
		border: 1.5px solid var(--line);
		border-radius: 16px;
		padding: 20px;
		margin-bottom: 24px;
		box-shadow: var(--shadow);
	}
	.db-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
		flex-wrap: wrap;
		gap: 10px;
	}
	.db-title-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.db-icon {
		font-size: 1.8rem;
	}
	.db-title-wrap h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--ink);
	}
	.db-provider {
		font-size: 0.82rem;
		color: var(--accent);
		font-weight: 600;
	}
	.db-badge {
		padding: 4px 12px;
		border-radius: 20px;
		background: var(--bg-soft);
		color: var(--ink-soft);
		font-size: 0.8rem;
		font-weight: 700;
	}
	.db-badge.connected {
		background: var(--chip);
		color: var(--accent);
	}
	.db-desc {
		font-size: 0.88rem;
		color: var(--ink-soft);
		margin-bottom: 12px;
	}
	.db-tip {
		background: var(--bg-soft);
		border-left: 3px solid var(--accent);
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 0.82rem;
		color: var(--ink);
		line-height: 1.5;
	}
	.db-tip code {
		background: var(--chip);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--accent);
		font-family: monospace;
	}

	/* Section Cards */
	.section-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 22px;
		margin-bottom: 24px;
		box-shadow: var(--shadow);
	}
	.section-card h2 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 16px;
	}

	/* Engine Table */
	.engine-table {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.table-header {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr 1.5fr;
		padding: 8px 12px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-faint);
		border-bottom: 1px solid var(--line);
	}
	.table-row {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr 1.5fr;
		padding: 12px;
		background: var(--bg-soft);
		border-radius: 10px;
		font-size: 0.85rem;
		align-items: center;
		gap: 8px;
	}
	.eng-endpoint code {
		font-family: monospace;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}
	.eng-lat {
		font-family: monospace;
		color: var(--accent);
		font-weight: 700;
	}
	.eng-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--accent);
		font-weight: 700;
		font-size: 0.82rem;
	}
	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}
	@media (max-width: 680px) {
		.table-header { display: none; }
		.table-row {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}

	/* Stream List */
	.stream-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
		flex-wrap: wrap;
		gap: 8px;
	}
	.stream-badge {
		font-size: 0.75rem;
		font-weight: 700;
		background: var(--chip);
		color: var(--accent);
		padding: 3px 10px;
		border-radius: 12px;
	}
	.query-stream-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.query-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: var(--bg-soft);
		border-radius: 10px;
		font-size: 0.86rem;
		flex-wrap: wrap;
		gap: 8px;
	}
	.q-main {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.q-text {
		font-weight: 700;
		color: var(--ink);
	}
	.q-cat, .q-lang {
		font-size: 0.75rem;
		background: var(--bg-elev);
		padding: 2px 8px;
		border-radius: 6px;
		color: var(--ink-soft);
	}
	.q-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}
	.q-dur {
		font-family: monospace;
		color: var(--accent);
		font-weight: 700;
	}
	.q-cached {
		color: var(--warm);
		font-weight: 700;
	}
	.q-time {
		color: var(--ink-faint);
	}
	.empty-stream {
		text-align: center;
		padding: 28px 16px;
		color: var(--ink-soft);
		font-size: 0.88rem;
	}
</style>
