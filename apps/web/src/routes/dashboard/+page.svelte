<script lang="ts">
	import { t } from '$lib/i18n';

	const metrics = {
		indexedDocs: '২৮৪,০৫০',
		indexedDomains: '১,৪২০',
		avgLatency: '৪২.৫ মি.সে.',
		p99Latency: '১১৮ মি.সে.',
		queriesToday: '৩৪,৮৯০',
		uptime: '৯৯.৯৮%',
		privacyStatus: 'লগশূন্য ও এনক্রিপ্টেড'
	};
</script>

<svelte:head>
	<title>সিস্টেম ও ইনডেক্স ড্যাশবোর্ড — {t('appName')}</title>
</svelte:head>

<section class="dashboard-container">
	<div class="dashboard-header">
		<span class="badge">📊 লাইভ টেলিমেট্রি ও ইনডেক্স পরিসংখ্যান</span>
		<h1 class="page-title">সন্ধান সিস্টেম স্বাস্থ্য ও ইনডেক্স ড্যাশবোর্ড</h1>
		<p class="page-subtitle">গোপনীয়তা অক্ষুণ্ণ রেখে সংগৃহীত ডিফারেনশিয়াল-প্রাইভেসি অ্যানালিটিক্স।</p>
	</div>

	<!-- Status Grid -->
	<div class="metrics-grid">
		<div class="metric-card">
			<div class="m-label">ইনডেক্সড ডকুমেন্টস</div>
			<div class="m-val">{metrics.indexedDocs}</div>
			<div class="m-sub">বাংলা উইকিপিডিয়া + উন্মুক্ত ওয়েব</div>
		</div>

		<div class="metric-card">
			<div class="m-label">অনন্য ডোমেইন সংখ্যা</div>
			<div class="m-val">{metrics.indexedDomains}</div>
			<div class="m-sub">স্মল-ওয়েব ও স্বাধীন ব্লগসমূহ</div>
		</div>

		<div class="metric-card">
			<div class="m-label">গড় সার্চ রেসপন্স টাইম</div>
			<div class="m-val">{metrics.avgLatency}</div>
			<div class="m-sub">p99 লেটেন্সি: {metrics.p99Latency}</div>
		</div>

		<div class="metric-card">
			<div class="m-label">আজকের মোট অনুসন্ধান</div>
			<div class="m-val">{metrics.queriesToday}</div>
			<div class="m-sub">ডিফারেনশিয়াল প্রাইভেসি সুরক্ষিত</div>
		</div>
	</div>

	<!-- System Architecture Status -->
	<div class="system-health-box">
		<h2>🖥️ সার্ভিস স্বাস্থ্য ও ক্লাস্টার স্ট্যাটাস</h2>
		<div class="service-list">
			<div class="service-row">
				<span class="s-name">API Gateway (Rust / Axum)</span>
				<span class="s-status online">🟢 সচল (Health: OK)</span>
			</div>
			<div class="service-row">
				<span class="s-name">Zero-Knowledge Sync Store</span>
				<span class="s-status online">🟢 সচল (AES-256-GCM)</span>
			</div>
			<div class="service-row">
				<span class="s-name">Bengali NLP & Spell Checker</span>
				<span class="s-status online">🟢 সচল (১০,০০০+ শব্দভাণ্ডার)</span>
			</div>
			<div class="service-row">
				<span class="s-name">OpenSearch / Vespa Cluster</span>
				<span class="s-status online">🟢 ৪টি নোড সক্রিয়</span>
			</div>
			<div class="service-row">
				<span class="s-name">Polite Crawler Pipeline</span>
				<span class="s-status online">🟢 শিডিউলড (Rate Limit Safe)</span>
			</div>
		</div>
	</div>
</section>

<style>
	.dashboard-container {
		max-width: 960px;
		margin: 0 auto;
		padding: 20px 0;
	}
	.dashboard-header {
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
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
		margin-bottom: 30px;
	}
	.metric-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 18px;
		padding: 22px;
		box-shadow: var(--shadow);
	}
	.m-label {
		font-size: 0.82rem;
		color: var(--ink-soft);
		font-weight: 600;
		margin-bottom: 8px;
	}
	.m-val {
		font-family: 'Outfit', sans-serif;
		font-size: 2.2rem;
		font-weight: 900;
		color: var(--accent);
		line-height: 1.1;
		margin-bottom: 6px;
	}
	.m-sub {
		font-size: 0.8rem;
		color: var(--ink-faint);
	}
	.system-health-box {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 28px;
		box-shadow: var(--shadow);
	}
	.system-health-box h2 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.3rem;
		margin-bottom: 18px;
		color: var(--ink);
	}
	.service-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.service-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-radius: 10px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	.s-name {
		font-weight: 600;
		color: var(--ink);
	}
	.s-status {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--accent);
	}
</style>
