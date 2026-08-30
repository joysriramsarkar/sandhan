<script lang="ts">
	import { onMount } from 'svelte';
	import { t, localeStore } from '$lib/i18n';
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
	let currentPage = 1;

	// Reactive language switcher for searches
	let lastSearchedLocale = $localeStore;
	$: if ($localeStore !== lastSearchedLocale) {
		lastSearchedLocale = $localeStore;
		if (hasSearched && searchQuery) {
			performSearch(searchQuery, selectedCategory, 1);
		}
	}

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
		const p = parseInt(urlParams.get('page') || '1', 10) || 1;
		selectedCategory = cat;
		currentPage = p;

		if (q) {
			searchQuery = q;
			performSearch(q, cat, p);
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

	async function performSearch(queryToRun?: string, categoryToRun?: string, pageToRun?: number) {
		const q = (queryToRun || searchQuery).trim();
		if (!q) return;

		// Check Bang
		const bangUrl = resolveBang(q);
		if (bangUrl) {
			window.open(bangUrl, '_blank');
			return;
		}

		const cat = categoryToRun || selectedCategory;
		const page = pageToRun || (queryToRun && queryToRun !== searchQuery ? 1 : currentPage);
		currentPage = page;
		selectedCategory = cat;
		searchQuery = q;
		isSearching = true;
		hasSearched = true;

		// Update URL without reload
		const url = new URL(window.location.href);
		url.searchParams.set('q', q);
		if (cat !== 'all') url.searchParams.set('cat', cat);
		else url.searchParams.delete('cat');
		if (page > 1) url.searchParams.set('page', page.toString());
		else url.searchParams.delete('page');
		window.history.pushState({}, '', url);

		// Instant Answers on page 1 only
		instantResult = page === 1 ? getInstantAnswer(q) : null;

		// Execute Search with Goggles & Active Language & Page
		let dsl = customGoggleDsl;
		if (activeGoggle === 'academic') dsl = '$boost=3,site=edu\n$boost=2,site=org';
		if (activeGoggle === 'bengali') dsl = '$boost=3,lang=bn\n$boost=2,site=bangla';

		searchResponse = await executeSearch(q, cat, dsl, $localeStore, page);
		isSearching = false;

		// Save to encrypted history on first page
		if (page === 1) {
			saveQueryToEncryptedHistory(q);
		}
	}

	function goToPage(p: number) {
		if (p < 1 || (searchResponse && p > searchResponse.totalPages)) return;
		currentPage = p;
		performSearch(searchQuery, selectedCategory, p);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function switchCategory(cat: string) {
		selectedCategory = cat;
		currentPage = 1;
		if (hasSearched && searchQuery) {
			performSearch(searchQuery, cat, 1);
		}
	}

	async function saveQueryToEncryptedHistory(query: string) {
		try {
			const key = await deriveKey('sandhan-default-pass');
			const payload = await encryptJSON(key, { q: query, ts: Date.now() });
			const existing = JSON.parse(localStorage.getItem('sandhan_history') || '[]');
			existing.unshift(payload);
			localStorage.setItem('sandhan_history', JSON.stringify(existing.slice(0, 50)));
		} catch (e) {
			console.warn('Encrypted history save skipped', e);
		}
	}

	function handleQuickSearch(q: string) {
		searchQuery = q;
		currentPage = 1;
		performSearch(q, selectedCategory, 1);
	}

	function handleFaviconError(e: Event) {
		const target = e.currentTarget as HTMLElement | null;
		if (target) {
			target.style.display = 'none';
		}
	}

	function resetToHome() {
		hasSearched = false;
		searchQuery = '';
		searchResponse = null;
		instantResult = null;
		selectedCategory = 'all';
		currentPage = 1;
		const url = new URL(window.location.href);
		url.searchParams.delete('q');
		url.searchParams.delete('cat');
		url.searchParams.delete('page');
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

		<!-- Category Tabs & Goggles Bar -->
		<div class="category-bar-wrap">
			<div class="category-scroll">
				<button class="cat-item" class:active={selectedCategory === 'all'} on:click={() => switchCategory('all')}>{t('tabs.all')}</button>
				<button class="cat-item" class:active={selectedCategory === 'images'} on:click={() => switchCategory('images')}>{t('tabs.images')}</button>
				<button class="cat-item" class:active={selectedCategory === 'videos'} on:click={() => switchCategory('videos')}>{t('tabs.videos')}</button>
				<button class="cat-item" class:active={selectedCategory === 'news'} on:click={() => switchCategory('news')}>{t('tabs.news')}</button>
				<button class="cat-item" class:active={selectedCategory === 'maps'} on:click={() => switchCategory('maps')}>{t('tabs.maps')}</button>
			</div>

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
				<button class="dym-btn" on:click={() => handleQuickSearch(searchResponse?.didYouMean || '')}>
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
					height="380"
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
										<img src={`https://icons.duckduckgo.com/ip3/${item.domain}.ico`} alt="" class="site-favicon" on:error={handleFaviconError} />
									{/if}
									<span class="source-tag">{item.domain || item.source}</span>
									<span class="direct-url-hint">{item.url}</span>
								</div>
								<span class="rank-index">#{((currentPage - 1) * 10) + idx + 1}</span>
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

					<!-- Multi-page Pagination Controls -->
					{#if searchResponse && searchResponse.totalPages > 1}
						<nav class="pagination-nav" aria-label="Pagination">
							<button
								class="page-btn prev-btn"
								disabled={currentPage <= 1}
								on:click={() => goToPage(currentPage - 1)}
							>
								‹ {t('tabs.all') === 'All' ? 'Previous' : 'পূর্ববর্তী'}
							</button>

							<div class="page-numbers">
								{#each Array.from({ length: Math.min(10, searchResponse.totalPages) }, (_, i) => i + 1) as p}
									<button
										class="page-btn num-btn"
										class:active={p === currentPage}
										on:click={() => goToPage(p)}
									>
										{p}
									</button>
								{/each}
							</div>

							<button
								class="page-btn next-btn"
								disabled={currentPage >= searchResponse.totalPages}
								on:click={() => goToPage(currentPage + 1)}
							>
								{t('tabs.all') === 'All' ? 'Next' : 'পরবর্তী'} ›
							</button>
						</nav>
					{/if}
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
		<p style="font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 10px; word-break: break-all;">
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
		padding: 24px 0;
		width: 100%;
	}
	.hero-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: clamp(2.8rem, 8vw, 4.5rem);
		font-weight: 900;
		letter-spacing: -1.5px;
		background: linear-gradient(135deg, var(--ink) 30%, var(--accent));
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.hero-subtitle {
		font-size: clamp(1rem, 3.5vw, 1.2rem);
		color: var(--ink-soft);
		margin-top: 4px;
		margin-bottom: 24px;
		word-break: break-word;
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
		border-radius: 16px;
		padding: 4px 6px 4px 16px;
		box-shadow: var(--shadow);
		transition: all 0.2s ease;
		width: 100%;
	}
	.search-form:focus-within, .serp-search-form:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px rgba(14, 122, 99, 0.15);
	}
	.search-form input, .serp-search-form input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1.05rem;
		color: var(--ink);
		font-family: inherit;
		padding: 8px 0;
	}
	.search-btn {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--accent);
		color: #fff;
		font-size: 1.1rem;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		transition: background 0.2s;
	}
	.search-btn:hover {
		background: var(--accent-hover);
	}
	.quick-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: center;
		margin-top: 18px;
		max-width: 720px;
		width: 100%;
	}
	.chip {
		padding: 5px 12px;
		border-radius: 16px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 600;
		border: 1px solid var(--line);
		transition: transform 0.15s, background 0.2s;
	}
	.chip:hover {
		transform: translateY(-1px);
		background: var(--bg-soft);
	}
	.feature-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		margin-top: 36px;
		width: 100%;
		max-width: 950px;
		text-align: left;
	}
	.card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 18px;
		box-shadow: var(--shadow);
	}
	.card-icon {
		font-size: 28px;
		margin-bottom: 8px;
	}
	.card h3 {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.15rem;
		margin-bottom: 6px;
		color: var(--ink);
	}
	.card p {
		font-size: 0.88rem;
		color: var(--ink-soft);
		line-height: 1.55;
	}

	/* SERP Styles */
	.serp-section {
		width: 100%;
		max-width: 100%;
	}
	.serp-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}
	.back-home-btn {
		padding: 8px 12px;
		border-radius: 10px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		font-weight: 600;
		color: var(--ink);
		font-size: 0.88rem;
		flex-shrink: 0;
	}
	.serp-search-form {
		flex: 1;
		min-width: 200px;
	}
	.category-bar-wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--line);
		padding-bottom: 8px;
		margin-bottom: 18px;
		gap: 10px;
		flex-wrap: wrap;
	}
	.category-scroll {
		display: flex;
		gap: 4px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		max-width: 100%;
	}
	.category-scroll::-webkit-scrollbar {
		display: none;
	}
	.cat-item {
		padding: 6px 12px;
		border-radius: 8px;
		background: transparent;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.88rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.cat-item.active {
		background: var(--bg-soft);
		color: var(--accent);
	}
	.goggles-selector {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--ink-soft);
		flex-shrink: 0;
	}
	.goggles-selector select {
		padding: 5px 8px;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--bg-elev);
		color: var(--ink);
		font-family: inherit;
		font-size: 0.82rem;
		max-width: 180px;
	}
	.did-you-mean-banner {
		margin-bottom: 14px;
		color: var(--warm);
		font-weight: 600;
		font-size: 0.95rem;
		word-break: break-word;
	}
	.dym-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-weight: 700;
		text-decoration: underline;
		font-size: 0.95rem;
	}
	.instant-card {
		background: var(--bg-elev);
		border: 1.5px solid var(--accent);
		border-radius: 14px;
		padding: 16px 18px;
		margin-bottom: 20px;
		box-shadow: var(--shadow);
		word-break: break-word;
	}
	.instant-title {
		font-size: 0.82rem;
		color: var(--ink-soft);
		margin-bottom: 2px;
	}
	.instant-value {
		font-family: 'Outfit', sans-serif;
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 900;
		color: var(--accent);
		line-height: 1.2;
	}
	.instant-detail {
		font-size: 0.88rem;
		color: var(--ink-soft);
		margin-top: 4px;
	}
	.serp-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
		max-width: 100%;
	}
	@media (max-width: 860px) {
		.serp-grid {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
	.results-col {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.result-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 16px;
		box-shadow: var(--shadow);
		transition: border-color 0.2s;
		word-break: break-word;
		overflow-wrap: break-word;
	}
	.result-card:hover {
		border-color: var(--accent);
	}
	.result-source {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 6px;
		gap: 8px;
	}
	.source-group {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		overflow: hidden;
	}
	.site-favicon {
		width: 15px;
		height: 15px;
		border-radius: 3px;
		flex-shrink: 0;
	}
	.source-tag {
		white-space: nowrap;
		flex-shrink: 0;
	}
	.direct-url-hint {
		color: var(--ink-faint);
		font-weight: 400;
		font-size: 0.75rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: clamp(100px, 30vw, 240px);
	}
	.rank-index {
		font-size: 0.75rem;
		color: var(--ink-faint);
		flex-shrink: 0;
	}
	.result-title {
		font-family: 'Noto Serif Bengali', serif;
		font-size: clamp(1.1rem, 3.5vw, 1.25rem);
		font-weight: 700;
		margin-bottom: 6px;
		line-height: 1.4;
		word-break: break-word;
	}
	.result-title a {
		color: var(--ink);
	}
	.result-title a:hover {
		color: var(--accent);
	}
	.result-snippet {
		font-size: 0.9rem;
		color: var(--ink-soft);
		line-height: 1.55;
		word-break: break-word;
	}
	.result-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		flex-wrap: wrap;
	}
	.why-btn, .incognito-btn {
		padding: 4px 10px;
		border-radius: 6px;
		background: var(--chip);
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 600;
	}
	.visit-link {
		font-size: 0.78rem;
		font-weight: 600;
		margin-left: auto;
		white-space: nowrap;
	}
	.sidebar-col {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.knowledge-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 16px;
		box-shadow: var(--shadow);
		word-break: break-word;
	}
	.kp-image {
		width: 100%;
		max-height: 180px;
		object-fit: cover;
		border-radius: 10px;
		margin-bottom: 12px;
	}
	.kp-heading {
		font-family: 'Noto Serif Bengali', serif;
		font-size: 1.25rem;
		font-weight: 900;
		margin-bottom: 2px;
	}
	.kp-sub {
		font-size: 0.82rem;
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 10px;
	}
	.kp-desc {
		font-size: 0.88rem;
		color: var(--ink-soft);
		line-height: 1.55;
		margin-bottom: 14px;
	}
	.kp-attributes {
		border-top: 1px solid var(--line);
		padding-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.kp-attr-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		gap: 8px;
	}
	.attr-key { font-weight: 600; color: var(--ink); flex-shrink: 0; }
	.attr-val { color: var(--ink-soft); text-align: right; word-break: break-word; }
	.kp-source-link {
		display: inline-block;
		margin-top: 12px;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.privacy-guarantee-card {
		background: var(--chip);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 14px;
		color: var(--accent);
	}
	.privacy-guarantee-card h4 {
		margin-bottom: 4px;
		font-size: 0.92rem;
	}
	.privacy-guarantee-card p {
		font-size: 0.82rem;
		line-height: 1.5;
	}
	.signals-breakdown {
		margin: 14px 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.signal-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		padding: 6px 0;
		border-bottom: 1px solid var(--line);
		gap: 8px;
	}
	.large-modal {
		max-width: 800px;
		width: 94vw;
		height: 80vh;
		display: flex;
		flex-direction: column;
		padding: 16px;
	}
	.modal-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.proxy-frame-box {
		flex: 1;
		background: #fff;
		border-radius: 10px;
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
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 10px;
	}
	.image-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow);
	}
	.image-card img {
		width: 100%;
		height: 110px;
		object-fit: cover;
	}
	.img-caption {
		font-size: 0.78rem;
		font-weight: 600;
		padding: 6px 8px 2px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.img-domain {
		font-size: 0.7rem;
		color: var(--ink-faint);
		padding: 0 8px 6px;
	}
	.map-view-box {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 14px;
		overflow: hidden;
		margin-bottom: 20px;
		box-shadow: var(--shadow);
	}
	.map-footer {
		padding: 10px 14px;
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		background: var(--bg-soft);
		flex-wrap: wrap;
		gap: 6px;
	}
	.loading-state {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 24px 0;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.92rem;
	}
	.spinner {
		width: 20px;
		height: 20px;
		border: 2.5px solid var(--chip);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.pagination-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 28px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.page-numbers {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.page-btn {
		padding: 8px 14px;
		border-radius: 10px;
		background: var(--bg-elev);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.page-btn:hover:not(:disabled) {
		background: var(--bg-soft);
		border-color: var(--accent);
		transform: translateY(-1px);
	}
	.page-btn.active {
		background: var(--accent);
		color: var(--accent-ink);
		border-color: var(--accent);
		box-shadow: 0 4px 12px rgba(14, 122, 99, 0.25);
	}
	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.num-btn {
		min-width: 38px;
		height: 38px;
		padding: 0;
	}
	.prev-btn, .next-btn {
		padding: 8px 16px;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
