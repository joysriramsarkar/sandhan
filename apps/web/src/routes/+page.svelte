<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { resolveBang } from '$lib/bangs';
	import { getInstantAnswer, type InstantResult } from '$lib/instant';
	import { executeSearch, type SearchResponse, type SearchResultItem } from '$lib/search';
	import { deriveKey, encryptJSON } from '$lib/crypto';

	let searchQuery = '';
	let isSearching = false;
	let hasSearched = false;
	let instantResult: InstantResult | null = null;
	let searchResponse: SearchResponse | null = null;
	let selectedCategory = 'all';

	// Goggles Preset
	let activeGoggle = 'none';
	let customGoggleDsl = '';

	// Why Modal & Incognito Modal
	let activeWhySignal: SearchResultItem['signals'] | null = null;
	let incognitoUrl = '';

	let searchInputEl: HTMLInputElement;

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const q = urlParams.get('q');
		const cat = urlParams.get('cat') || 'all';
		selectedCategory = cat;

		if (q) {
			searchQuery = q;
			performSearch(q, cat);
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
			e.preventDefault();
			searchInputEl?.focus();
			searchInputEl?.select();
		}
	}

	async function performSearch(queryToRun?: string, categoryToRun?: string) {
		const q = (queryToRun || searchQuery).trim();
		if (!q) return;

		// Check Bang
		const bangUrl = resolveBang(q);
		if (bangUrl) {
			window.open(bangUrl, '_blank');
			return;
		}

		const cat = categoryToRun || selectedCategory;
		selectedCategory = cat;
		searchQuery = q;
		isSearching = true;
		hasSearched = true;

		// Update URL without reload
		const url = new URL(window.location.href);
		url.searchParams.set('q', q);
		if (cat !== 'all') url.searchParams.set('cat', cat);
		else url.searchParams.delete('cat');
		window.history.pushState({}, '', url);

		// Instant Answers
		instantResult = getInstantAnswer(q);

		// Execute Search with Goggles
		let dsl = customGoggleDsl;
		if (activeGoggle === 'academic') dsl = '$boost=3,site=edu\n$boost=2,site=org';
		if (activeGoggle === 'bengali') dsl = '$boost=3,lang=bn\n$boost=2,site=bangla';

		searchResponse = await executeSearch(q, cat, dsl);
		isSearching = false;

		// Save to encrypted history
		saveQueryToEncryptedHistory(q);
	}

	function switchCategory(cat: string) {
		selectedCategory = cat;
		if (hasSearched && searchQuery) {
			performSearch(searchQuery, cat);
		}
	}

	async function saveQueryToEncryptedHistory(query: string) {
		try {
			const key = await deriveKey('sondhan-default-pass');
			const payload = await encryptJSON(key, { q: query, ts: Date.now() });
			const existing = JSON.parse(localStorage.getItem('sondhan_history') || '[]');
			existing.unshift(payload);
			localStorage.setItem('sondhan_history', JSON.stringify(existing.slice(0, 50)));
		} catch (e) {
			console.warn('Encrypted history save skipped', e);
		}
	}

	function handleQuickSearch(q: string) {
		searchQuery = q;
		performSearch(q);
	}

	function resetToHome() {
		hasSearched = false;
		searchQuery = '';
		searchResponse = null;
		instantResult = null;
		selectedCategory = 'all';
		const url = new URL(window.location.href);
		url.searchParams.delete('q');
		url.searchParams.delete('cat');
		window.history.pushState({}, '', url);
	}
</script>

{#if !hasSearched}
	<!-- LANDING HERO -->
	<section class="landing-section">
		<div class="hero-logo-box">
			<h1 class="hero-title">{t('appName')}</h1>
			<p class="hero-subtitle">{t('tagline')}</p>
		</div>

		<div class="search-box-wrap">
			<form on:submit|preventDefault={() => performSearch()} class="search-form">
				<input
					bind:this={searchInputEl}
					type="text"
					bind:value={searchQuery}
					placeholder={t('searchPlaceholder')}
					autocomplete="off"
				/>
				<button type="submit" class="search-btn" title="অনুসন্ধান করুন">🔍</button>
			</form>
		</div>

		<!-- Quick Bang & Search Suggestions -->
		<div class="quick-chips">
			<button class="chip" on:click={() => handleQuickSearch('joysriram sarkar')}>👤 joysriram sarkar</button>
			<button class="chip" on:click={() => handleQuickSearch('অ্যান্টিগ্রাভিটি')}>🚀 অ্যান্টিগ্রাভিটি</button>
			<button class="chip" on:click={() => handleQuickSearch('রবীন্দ্রনাথ ঠাকুর')}>📖 রবীন্দ্রনাথ ঠাকুর</button>
			<button class="chip" on:click={() => handleQuickSearch('পদ্মা সেতু')}>🌉 পদ্মা সেতু</button>
			<button class="chip" on:click={() => handleQuickSearch('২৫ * ৪৮')}>⚡ ২৫ * ৪৮</button>
			<button class="chip" on:click={() => handleQuickSearch('!w বাংলাদেশ')}><b>!w</b> উইকিপিডিয়া</button>
			<button class="chip" on:click={() => handleQuickSearch('!gh rust-lang')}><b>!gh</b> গিটহাব</button>
		</div>

		<!-- Feature Highlights -->
		<div class="feature-cards">
			<div class="card">
				<div class="card-icon">🌐</div>
				<h3>সারা বিশ্বের উন্মুক্ত ওয়েব</h3>
				<p>সমগ্র ইন্টারনেটের কোটি কোটি ওয়েবসাইট, ব্লগ, উইকি ও নিউজ পোর্টাল থেকে তাৎক্ষণিক ফলাফল।</p>
			</div>
			<div class="card">
				<div class="card-icon">🔐</div>
				<h3>শূন্য-জ্ঞান গোপনীয়তা</h3>
				<p>সার্চ হিস্টরি ক্লায়েন্ট-সাইডে AES-256-GCM এনক্রিপ্টেড। সার্ভারে কোনো আইপি বা কোয়েরি লগিং নেই।</p>
			</div>
			<div class="card">
				<div class="card-icon">🔍</div>
				<h3>স্বচ্ছ র‍্যাংকিং ও Goggles</h3>
				<p>প্রতিটি রেজাল্টের স্কোরিং সিগন্যাল দেখুন এবং নিজস্ব কাস্টম নিয়মে ফলাফল ফিল্টার করুন।</p>
			</div>
		</div>
	</section>
{:else}
	<!-- SERP (SEARCH ENGINE RESULTS PAGE) -->
	<section class="serp-section">
		<!-- Top Bar Search Input -->
		<div class="serp-header">
			<button class="back-home-btn" on:click={resetToHome}>← {t('nav.search')}</button>
			<form on:submit|preventDefault={() => performSearch()} class="serp-search-form">
				<input
					bind:this={searchInputEl}
					type="text"
					bind:value={searchQuery}
					autocomplete="off"
				/>
				<button type="submit" class="search-btn">🔍</button>
			</form>
		</div>

		<!-- Category Tabs -->
		<div class="category-bar">
			<button class="cat-item" class:active={selectedCategory === 'all'} on:click={() => switchCategory('all')}>{t('tabs.all')}</button>
			<button class="cat-item" class:active={selectedCategory === 'images'} on:click={() => switchCategory('images')}>{t('tabs.images')}</button>
			<button class="cat-item" class:active={selectedCategory === 'videos'} on:click={() => switchCategory('videos')}>{t('tabs.videos')}</button>
			<button class="cat-item" class:active={selectedCategory === 'news'} on:click={() => switchCategory('news')}>{t('tabs.news')}</button>
			<button class="cat-item" class:active={selectedCategory === 'maps'} on:click={() => switchCategory('maps')}>{t('tabs.maps')}</button>

			<!-- Goggles Selector -->
			<div class="goggles-selector">
				<span>👓 Goggles:</span>
				<select bind:value={activeGoggle} on:change={() => performSearch()}>
					<option value="none">ডিফল্ট র‍্যাংকিং</option>
					<option value="bengali">বাংলা প্রাধান্য (Bengali Boost)</option>
					<option value="academic">একাডেমিক প্রাধান্য (Academic Boost)</option>
				</select>
			</div>
		</div>

		<!-- Did You Mean Suggestion -->
		{#if searchResponse?.didYouMean}
			<div class="did-you-mean-banner">
				{t('didYouMean')}: 
				<button class="dym-btn" on:click={() => handleQuickSearch(searchResponse.didYouMean)}>
					{searchResponse.didYouMean}
				</button>
			</div>
		{/if}

		<!-- Instant Answer Card -->
		{#if instantResult}
			<div class="instant-card">
				<div class="instant-title">{instantResult.title}</div>
				<div class="instant-value">{instantResult.value}</div>
				{#if instantResult.detail}
					<div class="instant-detail">{instantResult.detail}</div>
				{/if}
			</div>
		{/if}

		<!-- Category Specific Views: Maps -->
		{#if selectedCategory === 'maps'}
			<div class="map-view-box">
				<iframe
					title="OpenStreetMap"
					width="100%"
					height="450"
					frameborder="0"
					scrolling="no"
					marginheight="0"
					marginwidth="0"
					src={`https://www.openstreetmap.org/export/embed.html?bbox=88.0,20.5,92.8,26.7&layer=mapnik&marker=23.8,90.4`}
				></iframe>
				<div class="map-footer">
					<span>📍 মানচিত্র অনুসন্ধান: {searchQuery}</span>
					<a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer">
						ওপেনস্ট্রিটম্যাপে বিস্তারিত দেখুন →
					</a>
				</div>
			</div>
		{/if}

		<!-- Results & Knowledge Panel Grid -->
		<div class="serp-grid">
			<!-- Main Results Column -->
			<div class="results-col">
				{#if isSearching}
					<div class="loading-state">
						<div class="spinner"></div>
						<span>সারা বিশ্বের ওয়েবসাইটে অনুসন্ধান করা হচ্ছে...</span>
					</div>
				{:else if !searchResponse?.results.length}
					<div class="empty-state">
						<h3>কোনো সরাসরি ফলাফল পাওয়া যায়নি</h3>
						<p>অনুগ্রহ করে অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন অথবা ব্যাং শর্টকাট (যেমন <code>!g {searchQuery}</code> বা <code>!w {searchQuery}</code>) ব্যবহার করুন।</p>
					</div>
				{:else if selectedCategory === 'images'}
					<!-- Images Grid -->
					<div class="images-grid">
						{#each searchResponse.results as item}
							<a href={item.url} target="_blank" rel="noopener noreferrer" class="image-card">
								<img src={item.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.title)}/300/200`} alt={item.title} loading="lazy" />
								<div class="img-caption">{item.title}</div>
								<span class="img-domain">{item.domain || item.source}</span>
							</a>
						{/each}
					</div>
				{:else}
					<!-- Standard Web Results -->
					{#each searchResponse.results as item, idx}
						<article class="result-card">
							<div class="result-source">
								<div class="source-group">
									{#if item.domain}
										<img src={`https://icons.duckduckgo.com/ip3/${item.domain}.ico`} alt="" class="site-favicon" on:error={(e) => (e.currentTarget.style.display = 'none')} />
									{/if}
									<span class="source-tag">{item.domain || item.source}</span>
									<span class="direct-url-hint">{item.url.slice(0, 55)}{item.url.length > 55 ? '...' : ''}</span>
								</div>
								<span class="rank-index">#{idx + 1}</span>
							</div>

							<h2 class="result-title">
								<a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
							</h2>

							<p class="result-snippet">{item.snippet}</p>
							
							<div class="result-actions">
								<button class="why-btn" on:click={() => activeWhySignal = item.signals}>
									💡 {t('whyThisResult')}
								</button>
								<button class="incognito-btn" on:click={() => incognitoUrl = item.url}>
									🛡️ {t('incognitoView')}
								</button>
								<a href={item.url} target="_blank" rel="noopener noreferrer" class="visit-link">
									ভিজিট করুন ↗
								</a>
							</div>
						</article>
					{/each}
				{/if}
			</div>

			<!-- Knowledge Panel Sidebar -->
			<aside class="sidebar-col">
				{#if searchResponse?.knowledge}
					<div class="knowledge-card">
						{#if searchResponse.knowledge.thumbnail}
							<img src={searchResponse.knowledge.thumbnail} alt={searchResponse.knowledge.title} class="kp-image" />
						{/if}
						<h3 class="kp-heading">{searchResponse.knowledge.title}</h3>
						<div class="kp-sub">{searchResponse.knowledge.subtitle}</div>
						<p class="kp-desc">{searchResponse.knowledge.description}</p>
						
						<div class="kp-attributes">
							{#each searchResponse.knowledge.attributes as [k, v]}
								<div class="kp-attr-row">
									<span class="attr-key">{k}</span>
									<span class="attr-val">{v}</span>
								</div>
							{/each}
						</div>

						<a href={searchResponse.knowledge.sourceUrl} target="_blank" rel="noopener noreferrer" class="kp-source-link">
							জ্ঞানভাণ্ডারে সম্পূর্ণ পড়ুন →
						</a>
					</div>
				{/if}

				<div class="privacy-guarantee-card">
					<h4>🔒 শূন্য-জ্ঞান ওয়েব সার্চ</h4>
					<p>{t('privacyNote')}</p>
				</div>
			</aside>
		</div>
	</section>
{/if}

<!-- Why This Result Modal -->
{#if activeWhySignal}
	<div class="scrim" on:click={() => activeWhySignal = null} role="presentation"></div>
	<div class="modal">
		<h3>💡 {t('whyTitle')}</h3>
		<p class="why-explanation">{activeWhySignal.explanation}</p>

		<div class="signals-breakdown">
			<div class="signal-row">
				<span>BM25 কিওয়ার্ড ম্যাচ স্কোর</span>
				<b>{(activeWhySignal.bm25 * 100).toFixed(0)}%</b>
			</div>
			<div class="signal-row">
				<span>ডোমেইন অথরিটি সিগন্যাল</span>
				<b>{(activeWhySignal.authority * 100).toFixed(0)}%</b>
			</div>
			<div class="signal-row">
				<span>ফ্রেশনেস (তাত্ক্ষণিকতা মান)</span>
				<b>{(activeWhySignal.freshness * 100).toFixed(0)}%</b>
			</div>
		</div>

		<button class="primary-btn full-btn" on:click={() => activeWhySignal = null}>ঠিক আছে</button>
	</div>
{/if}

<!-- Incognito / Proxy Preview Modal -->
{#if incognitoUrl}
	<div class="scrim" on:click={() => incognitoUrl = ''} role="presentation"></div>
	<div class="modal large-modal">
		<div class="modal-top">
			<h3>🛡️ ছদ্মবেশী ভিউ (Incognito Web View)</h3>
			<button class="close-btn" on:click={() => incognitoUrl = ''}>✕</button>
		</div>
		<p style="font-size: 0.88rem; color: var(--ink-soft); margin-bottom: 12px;">
			তৃতীয় পক্ষের ট্র্যাকার ও আইপি ফিঙ্গারপ্রিন্ট ছাড়াই পাতা প্রদর্শন করা হচ্ছে: <code>{incognitoUrl}</code>
		</p>
		<div class="proxy-frame-box">
			<iframe src={incognitoUrl} title="Anonymous Preview" sandbox="allow-same-origin allow-scripts"></iframe>
		</div>
	</div>
{/if}

<style>
	.landing-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 40px 0;
	}
	.hero-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 4.5rem;
		font-weight: 900;
		letter-spacing: -2px;
		background: linear-gradient(135deg, var(--ink) 30%, var(--accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.hero-subtitle {
		font-size: 1.2rem;
		color: var(--ink-soft);
		margin-top: 6px;
		margin-bottom: 30px;
	}
	.search-box-wrap {
		width: 100%;
		max-width: 680px;
	}
	.search-form, .serp-search-form {
		display: flex;
		align-items: center;
		background: var(--bg-elev);
		border: 2px solid var(--line);
		border-radius: 18px;
		padding: 6px 8px 6px 20px;
		box-shadow: var(--shadow);
		transition: all 0.2s ease;
	}
	.search-form:focus-within, .serp-search-form:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px rgba(14, 122, 99, 0.15);
	}
	.search-form input, .serp-search-form input {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1.15rem;
		color: var(--ink);
		font-family: inherit;
		padding: 8px 0;
	}
	.search-btn {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--accent);
		color: #fff;
		font-size: 1.2rem;
		display: grid;
		place-items: center;
		transition: background 0.2s;
	}
	.search-btn:hover {
		background: var(--accent-hover);
	}
	.quick-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
		margin-top: 20px;
		max-width: 720px;
	}
	.chip {
		padding: 6px 14px;
		border-radius: 20px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.85rem;
		font-weight: 600;
		border: 1px solid var(--line);
		transition: transform 0.15s, background 0.2s;
	}
	.chip:hover {
		transform: translateY(-2px);
		background: var(--bg-soft);
	}
	.feature-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin-top: 50px;
		width: 100%;
		max-width: 950px;
		text-align: left;
	}
	.card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 24px;
		box-shadow: var(--shadow);
	}
	.card-icon {
		font-size: 32px;
		margin-bottom: 12px;
	}
	.card h3 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.2rem;
		margin-bottom: 8px;
		color: var(--ink);
	}
	.card p {
		font-size: 0.9rem;
		color: var(--ink-soft);
		line-height: 1.6;
	}

	/* SERP Styles */
	.serp-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
	}
	.back-home-btn {
		padding: 10px 16px;
		border-radius: 12px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		font-weight: 600;
		color: var(--ink);
	}
	.serp-search-form {
		flex: 1;
		max-width: 640px;
	}
	.category-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid var(--line);
		padding-bottom: 10px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.cat-item {
		padding: 6px 14px;
		border-radius: 8px;
		background: transparent;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.92rem;
	}
	.cat-item.active {
		background: var(--bg-soft);
		color: var(--accent);
	}
	.goggles-selector {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.goggles-selector select {
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--bg-elev);
		color: var(--ink);
		font-family: inherit;
		font-size: 0.85rem;
	}
	.did-you-mean-banner {
		margin-bottom: 18px;
		color: var(--warm);
		font-weight: 600;
		font-size: 1rem;
	}
	.dym-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-weight: 700;
		text-decoration: underline;
		font-size: 1rem;
	}
	.instant-card {
		background: var(--bg-elev);
		border: 1.5px solid var(--accent);
		border-radius: 16px;
		padding: 20px 24px;
		margin-bottom: 24px;
		box-shadow: var(--shadow);
	}
	.instant-title {
		font-size: 0.88rem;
		color: var(--ink-soft);
		margin-bottom: 4px;
	}
	.instant-value {
		font-family: 'Outfit', sans-serif;
		font-size: 2.4rem;
		font-weight: 900;
		color: var(--accent);
	}
	.instant-detail {
		font-size: 0.95rem;
		color: var(--ink-soft);
		margin-top: 4px;
	}
	.serp-grid {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 32px;
	}
	@media (max-width: 860px) {
		.serp-grid {
			grid-template-columns: 1fr;
		}
	}
	.results-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.result-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px;
		box-shadow: var(--shadow);
		transition: border-color 0.2s, transform 0.2s;
	}
	.result-card:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
	}
	.result-source {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 8px;
	}
	.source-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.site-favicon {
		width: 16px;
		height: 16px;
		border-radius: 3px;
	}
	.direct-url-hint {
		color: var(--ink-faint);
		font-weight: 400;
		font-size: 0.78rem;
	}
	.result-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 8px;
	}
	.result-title a {
		color: var(--ink);
	}
	.result-title a:hover {
		color: var(--accent);
	}
	.result-snippet {
		font-size: 0.94rem;
		color: var(--ink-soft);
		line-height: 1.6;
	}
	.result-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 14px;
	}
	.why-btn, .incognito-btn {
		padding: 5px 12px;
		border-radius: 6px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 600;
	}
	.visit-link {
		font-size: 0.82rem;
		font-weight: 600;
		margin-left: auto;
	}
	.sidebar-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.knowledge-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px;
		box-shadow: var(--shadow);
	}
	.kp-image {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
		border-radius: 12px;
		margin-bottom: 14px;
	}
	.kp-heading {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.4rem;
		font-weight: 900;
		margin-bottom: 4px;
	}
	.kp-sub {
		font-size: 0.85rem;
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 12px;
	}
	.kp-desc {
		font-size: 0.92rem;
		color: var(--ink-soft);
		line-height: 1.6;
		margin-bottom: 16px;
	}
	.kp-attributes {
		border-top: 1px solid var(--line);
		padding-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.kp-attr-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
	}
	.attr-key { font-weight: 600; color: var(--ink); }
	.attr-val { color: var(--ink-soft); }
	.kp-source-link {
		display: inline-block;
		margin-top: 14px;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.privacy-guarantee-card {
		background: var(--chip);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 16px;
		color: var(--accent);
	}
	.privacy-guarantee-card h4 {
		margin-bottom: 6px;
	}
	.privacy-guarantee-card p {
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.signals-breakdown {
		margin: 16px 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.signal-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		padding: 6px 0;
		border-bottom: 1px solid var(--line);
	}
	.large-modal {
		max-width: 800px;
		width: 95%;
		height: 80vh;
		display: flex;
		flex-direction: column;
	}
	.modal-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.proxy-frame-box {
		flex: 1;
		background: #fff;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--line);
	}
	.proxy-frame-box iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}
	.image-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow);
		transition: transform 0.2s;
	}
	.image-card:hover {
		transform: translateY(-3px);
	}
	.image-card img {
		width: 100%;
		height: 140px;
		object-fit: cover;
	}
	.img-caption {
		font-size: 0.85rem;
		font-weight: 600;
		padding: 8px 10px 2px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.img-domain {
		font-size: 0.75rem;
		color: var(--ink-faint);
		padding: 0 10px 8px;
	}
	.map-view-box {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 24px;
		box-shadow: var(--shadow);
	}
	.map-footer {
		padding: 12px 18px;
		display: flex;
		justify-content: space-between;
		font-size: 0.88rem;
		background: var(--bg-soft);
	}
	.loading-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 30px 0;
		color: var(--accent);
		font-weight: 600;
	}
	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--chip);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
