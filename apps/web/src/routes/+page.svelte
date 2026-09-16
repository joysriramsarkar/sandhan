<svelte:head>
	<title>সন্ধান (Sandhan) — উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিন ও এআই সারসংক্ষেপ</title>
	<meta name="description" content="সন্ধান (Sandhan) হলো উন্মুক্ত ও গোপনীয়তা-প্রথম বাংলা সার্চ ইঞ্জিন। সরাসরি এআই সারসংক্ষেপ, নির্ভরযোগ্য ফ্যাক্ট এবং কোনো ধরনের ইউজার ট্র্যাকিং ছাড়া সুপারফাস্ট সার্চ।" />
	<meta name="keywords" content="সন্ধান, sandhan, sandhan search engine, bangla search engine, বাংলা সার্চ ইঞ্জিন, bangla ai search, privacy search engine bangladesh, fast bangla search, bangladesh ai search" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href="https://sandhan.site/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sandhan.site/" />
	<meta property="og:site_name" content="সন্ধান (Sandhan)" />
	<meta property="og:title" content="সন্ধান (Sandhan) — উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিন ও এআই সারসংক্ষেপ" />
	<meta property="og:description" content="বাংলা ভাষার প্রথম উন্মুক্ত ও প্রাইভেসি-ফার্স্ট সার্চ ইঞ্জিন। সরাসরি এআই উত্তর, নির্ভরযোগ্য ফ্যাক্ট এবং কোনো ধরনের ইউজার ট্র্যাকিং ছাড়া সুপারফাস্ট সার্চ।" />
	<meta property="og:image" content="https://sandhan.site/favicon.svg" />
	<meta property="og:locale" content="bn_BD" />
	<meta property="og:locale:alternate" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://sandhan.site/" />
	<meta name="twitter:title" content="সন্ধান (Sandhan) — উন্মুক্ত সার্চ ইঞ্জিন ও এআই সারসংক্ষেপ" />
	<meta name="twitter:description" content="উন্মুক্ত ও প্রাইভেসি-ফার্স্ট বাংলা সার্চ ইঞ্জিন। কোনো কুকিজ ও ট্র্যাকার ছাড়া দ্রুত ও নির্ভুল তথ্য সন্ধান।" />
	<meta name="twitter:image" content="https://sandhan.site/favicon.svg" />
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { t, localeStore } from '$lib/i18n';
	import { resolveBang } from '$lib/bangs';
	import { fetchWeatherAnswer, getInstantAnswer, isWeatherQuery, type InstantResult } from '$lib/instant';
	import { executeSearch, type SearchResponse, type SearchResultItem } from '$lib/search';
	import { isQuestionQuery, fetchAiOverview, type AiAnswerResponse } from '$lib/ai';

	let searchQuery = '';
	let isSearching = false;
	let hasSearched = false;
	let instantResult: InstantResult | null = null;
	let searchResponse: SearchResponse | null = null;
	let selectedCategory = 'all';
	let currentPage = 1;

	// AI Mode & Overview State
	let isAiMode = false;
	let aiOverview: AiAnswerResponse | null = null;
	let isAiLoading = false;
	let isAiCollapsed = false;
	let copiedAi = false;

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
		const aiParam = urlParams.get('ai');
		if (aiParam === '1' || aiParam === 'true') {
			isAiMode = true;
		}

		selectedCategory = cat;
		currentPage = p;

		if (q) {
			searchQuery = q;
			performSearch(q, cat, p);
		}

		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('sandhan:reset-home', resetToHome);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('sandhan:reset-home', resetToHome);
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		const targetTag = (document.activeElement as HTMLElement)?.tagName;
		const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || isEditable) {
			return;
		}
		if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			searchInputEl?.focus();
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
		if (isAiMode) url.searchParams.set('ai', '1');
		else url.searchParams.delete('ai');
		window.history.pushState({}, '', url);

		// Instant Answers on page 1 only
		instantResult = page === 1 ? getInstantAnswer(q) : null;
		if (page === 1 && isWeatherQuery(q)) {
			fetchWeatherAnswer(q).then((result) => {
				if (searchQuery === q) instantResult = result;
			});
		}

		// Execute Search with Goggles & Active Language & Page
		let dsl = customGoggleDsl;
		if (activeGoggle === 'academic') dsl = '$boost=3,site=edu\n$boost=2,site=org';
		if (activeGoggle === 'bengali') dsl = '$boost=3,lang=bn\n$boost=2,site=bangla';

		// Trigger AI Overview asynchronously on page 1 for questions or AI mode
		const shouldTriggerAi = page === 1 && (isQuestionQuery(q, $localeStore) || isAiMode);
		if (shouldTriggerAi) {
			isAiLoading = true;
			aiOverview = null;
		} else {
			aiOverview = null;
			isAiLoading = false;
		}

		searchResponse = await executeSearch(q, cat, dsl, $localeStore, page);
		isSearching = false;

		// If AI was triggered, synthesize using the fresh search results & knowledge
		if (shouldTriggerAi) {
			fetchAiOverview(q, $localeStore, searchResponse?.results || [], searchResponse?.knowledge)
				.then((res) => {
					aiOverview = res;
					isAiLoading = false;
				})
				.catch(() => {
					isAiLoading = false;
				});
		}
	}

	function toggleAiMode() {
		isAiMode = !isAiMode;
		if (hasSearched && searchQuery && isAiMode && !aiOverview && currentPage === 1) {
			isAiLoading = true;
			fetchAiOverview(searchQuery, $localeStore, searchResponse?.results || [], searchResponse?.knowledge)
				.then((res) => {
					aiOverview = res;
					isAiLoading = false;
				})
				.catch(() => {
					isAiLoading = false;
				});
		}
	}

	async function copyAiAnswer() {
		if (!aiOverview?.answer) return;
		try {
			await navigator.clipboard.writeText(aiOverview.answer.replace(/\[\d+\]/g, '').trim());
			copiedAi = true;
			setTimeout(() => {
				copiedAi = false;
			}, 2000);
		} catch (_) {}
	}

	function formatAiMarkdown(text: string): string {
		if (!text) return '';
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/^### (.*?)$/gm, '<h4 class="ai-subheading">$1</h4>')
			.replace(/^\* (.*?)$/gm, '<li class="ai-bullet">$1</li>')
			.replace(/\[(\d+)\]/g, '<span class="cite-pill" title="উৎস $1">[$1]</span>')
			.replace(/\n\n/g, '<p class="ai-para"></p>');
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

	function handleLogoImgError(e: Event) {
		const img = e.currentTarget as HTMLImageElement | null;
		if (img && !img.src.endsWith('sandhan_logo.png')) {
			img.src = '/sandhan_logo.png';
		}
	}

	function resetToHome() {
		hasSearched = false;
		searchQuery = '';
		searchResponse = null;
		instantResult = null;
		aiOverview = null;
		isAiLoading = false;
		selectedCategory = 'all';
		currentPage = 1;
		const url = new URL(window.location.href);
		url.searchParams.delete('q');
		url.searchParams.delete('cat');
		url.searchParams.delete('page');
		url.searchParams.delete('ai');
		window.history.pushState({}, '', url);
	}
</script>

{#if !hasSearched}
	<!-- LANDING HERO -->
	<section class="landing-section">
		<div class="hero-logo-box">
			<img src="/sandhan_logo.png" alt="সন্ধান" class="hero-logo-img" />
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

		<!-- AI Mode Quick Switch & Questions -->
		<div class="ai-mode-bar">
			<button class="ai-toggle-pill" class:active={isAiMode} on:click={toggleAiMode}>
				<span class="sparkle">✨</span>
				<span>{t('aiMode')} {isAiMode ? 'অন (ON)' : 'অফ (OFF)'}</span>
			</button>
			<span class="ai-hint-text">প্রশ্ন করলেই এআই সারসংক্ষেপ ও রিয়েল-টাইম তথ্য বিশ্লেষণ</span>
		</div>

		<!-- Quick Bang & Search Suggestions -->
		<div class="quick-chips">
			<button class="chip ai-chip" on:click={() => handleQuickSearch('কৃত্রিম বুদ্ধিমত্তা কী?')}>✨ কৃত্রিম বুদ্ধিমত্তা কী?</button>
			<button class="chip ai-chip" on:click={() => handleQuickSearch('রবীন্দ্রনাথ কেন নোবেল পেয়েছিলেন?')}>✨ রবীন্দ্রনাথ কেন নোবেল পেয়েছিলেন?</button>
			<button class="chip" on:click={() => handleQuickSearch('পদ্মা সেতু')}>🌉 পদ্মা সেতু</button>
			<button class="chip" on:click={() => handleQuickSearch('২৫ * ৪৮')}>⚡ ২৫ * ৪৮</button>
			<button class="chip" on:click={() => handleQuickSearch('!w বাংলাদেশ')}><b>!w</b> উইকিপিডিয়া</button>
			<button class="chip" on:click={() => handleQuickSearch('!gh rust-lang')}><b>!gh</b> গিটহাব</button>
		</div>

		<!-- Feature Highlights -->
		<div class="feature-cards">
			<div class="card">
				<div class="card-icon">🤖</div>
				<h3>এআই সারসংক্ষেপ (AI Mode)</h3>
				<p>যেকোনো প্রশ্নের জন্য সারা বিশ্বের উন্মুক্ত ওয়েব থেকে সংগৃহীত নির্ভরযোগ্য ও উদ্ধৃতিযুক্ত উত্তর।</p>
			</div>
			<div class="card">
				<div class="card-icon">⚡</div>
				<h3>তাত্ক্ষণিক ও নির্ভরযোগ্য সার্চ</h3>
				<p>DuckDuckGo ও উইকিপিডিয়ার মাল্টি-ইঞ্জিন ক্যাসকেডে দ্রুততম সার্চ রেজাল্ট।</p>
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
			<button class="ai-top-toggle" class:active={isAiMode} on:click={toggleAiMode} title={t('aiMode')}>
				✨ {t('aiMode')}
			</button>
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
				<!-- AI Overview Card (Shown before search results if question or AI Mode) -->
				{#if isAiLoading}
					<div class="ai-overview-card loading">
						<div class="ai-header">
							<div class="ai-title-wrap">
								<span class="ai-sparkle">✨</span>
								<span class="ai-title">{t('aiOverview')}</span>
								<span class="ai-badge">{t('aiBadge')}</span>
							</div>
						</div>
						<div class="ai-shimmer-body">
							<div class="shimmer-line line-1"></div>
							<div class="shimmer-line line-2"></div>
							<div class="shimmer-line line-3"></div>
						</div>
						<div class="ai-loading-text">{t('aiGenerating')}</div>
					</div>
				{:else if aiOverview}
					<div class="ai-overview-card" class:collapsed={isAiCollapsed}>
						<div class="ai-header">
							<div class="ai-title-wrap">
								<span class="ai-sparkle">✨</span>
								<span class="ai-title">{t('aiOverview')}</span>
								<span class="ai-badge">{t('aiBadge')}</span>
								<span class="ai-status-pill">⚡ তথ্যাবলি সংশ্লেষণ</span>
							</div>
							<div class="ai-actions">
								<button class="ai-action-btn" on:click={copyAiAnswer} title={t('copyAnswer')}>
									{copiedAi ? '✅ ' + t('copied') : '📋 ' + t('copyAnswer')}
								</button>
								<button class="ai-action-btn" on:click={() => isAiCollapsed = !isAiCollapsed} title="লুকান/দেখান">
									{isAiCollapsed ? '▼ বিস্তারিত' : '▲ সংক্ষেপ'}
								</button>
							</div>
						</div>

						{#if !isAiCollapsed}
							<div class="ai-content">
								{@html formatAiMarkdown(aiOverview.answer)}
							</div>

							<!-- Sources Section -->
							{#if aiOverview.sources && aiOverview.sources.length > 0}
								<div class="ai-sources-section">
									<span class="sources-label">📚 {t('aiSources')}:</span>
									<div class="sources-pills">
										{#each aiOverview.sources as src}
											<a href={src.url} target="_blank" rel="noopener noreferrer" class="source-pill" title={src.title}>
												<img src={`https://icons.duckduckgo.com/ip3/${src.domain}.ico`} alt="" class="src-icon" on:error={handleFaviconError} />
												<span class="src-num">[{src.index}]</span>
												<span class="src-name">{src.domain}</span>
											</a>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Related Follow-up Questions -->
							{#if aiOverview.relatedQuestions && aiOverview.relatedQuestions.length > 0}
								<div class="ai-followup-section">
									<span class="followup-label">💡 {t('relatedQuestions')}:</span>
									<div class="followup-chips">
										{#each aiOverview.relatedQuestions as rq}
											<button class="followup-chip" on:click={() => handleQuickSearch(rq)}>
												<span>❓ {rq}</span>
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

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
						
						{#if searchResponse.knowledge.attributes && searchResponse.knowledge.attributes.length > 0}
							<div class="kp-attr-grid">
								{#each searchResponse.knowledge.attributes as [k, v]}
									<div class="kp-attr-row">
										<span class="kp-k">{k}</span>
										<span class="kp-v">{v}</span>
									</div>
								{/each}
							</div>
						{/if}

						<div class="kp-footer">
							<a href={searchResponse.knowledge.sourceUrl} target="_blank" rel="noopener noreferrer">উইকিপিডিয়ায় আরও জানুন →</a>
						</div>
					</div>
				{/if}
			</aside>
		</div>
	</section>
{/if}

<!-- Modals -->
{#if activeWhySignal}
	<div class="modal-backdrop" on:click={() => activeWhySignal = null}>
		<div class="modal-card" on:click|stopPropagation>
			<h3>💡 {t('whyTitle')}</h3>
			<p class="modal-desc">{activeWhySignal.explanation}</p>
			<div class="signal-metrics">
				<div class="metric-row">
					<span>কীওয়ার্ড প্রাসঙ্গিকতা (BM25):</span>
					<strong>{(activeWhySignal.bm25 * 100).toFixed(0)}%</strong>
				</div>
				<div class="metric-row">
					<span>ডোমেইন অথরিটি:</span>
					<strong>{(activeWhySignal.authority * 100).toFixed(0)}%</strong>
				</div>
				<div class="metric-row">
					<span>তথ্য তাজাতা (Freshness):</span>
					<strong>{(activeWhySignal.freshness * 100).toFixed(0)}%</strong>
				</div>
			</div>
			<button class="modal-close-btn" on:click={() => activeWhySignal = null}>ঠিক আছে</button>
		</div>
	</div>
{/if}

{#if incognitoUrl}
	<div class="modal-backdrop" on:click={() => incognitoUrl = ''}>
		<div class="modal-card" on:click|stopPropagation>
			<h3>🛡️ {t('incognitoView')}</h3>
			<p class="modal-desc">কুকিজ ও ট্র্যাকার ছাড়া ছদ্মবেশী মোডে সাইটটি খুলতে নিচের বোতামটি চাপুন:</p>
			<div class="incognito-url-box">{incognitoUrl}</div>
			<div class="incognito-actions">
				<a href={incognitoUrl} target="_blank" rel="noreferrer noopener" class="primary-btn" on:click={() => incognitoUrl = ''}>
					ট্র্যাকারহীন ট্যাবে খুলুন ↗
				</a>
				<button class="modal-close-btn" on:click={() => incognitoUrl = ''}>বাতিল</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Landing Hero Styles */
	.landing-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 68vh;
		text-align: center;
		padding: 40px 16px;
	}
	.hero-logo-box {
		margin-bottom: 26px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.hero-logo-img {
		width: clamp(280px, 42vw, 440px);
		height: auto;
		max-height: 180px;
		object-fit: contain;
		margin: 0 auto 10px;
		display: block;
		background: transparent;
		border: none;
		box-shadow: none;
		filter: drop-shadow(0 6px 20px rgba(14, 122, 99, 0.16));
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.hero-logo-img:hover {
		transform: scale(1.04);
	}
	.hero-subtitle {
		font-size: clamp(1rem, 2.5vw, 1.22rem);
		color: var(--ink-soft);
		margin-top: 4px;
		font-weight: 500;
	}
	.search-box-wrap {
		width: 100%;
		max-width: 640px;
		margin-bottom: 12px;
	}
	.search-form, .serp-search-form {
		display: flex;
		align-items: center;
		background: var(--bg-elev);
		border: 1.5px solid var(--line);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow);
		padding: 4px 6px 4px 18px;
		transition: all 0.2s ease;
	}
	.search-form:focus-within, .serp-search-form:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px rgba(14, 122, 99, 0.15);
	}
	.search-form input, .serp-search-form input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 1.05rem;
		color: var(--ink);
		outline: none;
		font-family: inherit;
		min-width: 0;
	}
	.search-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-ink);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		flex-shrink: 0;
		transition: transform 0.15s ease, background 0.15s ease;
	}
	.search-btn:hover {
		background: var(--accent-hover);
		transform: scale(1.05);
	}

	/* AI Mode Bar in Landing */
	.ai-mode-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-bottom: 18px;
		flex-wrap: wrap;
	}
	.ai-toggle-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: var(--radius-full);
		background: var(--chip);
		border: 1.5px solid var(--line);
		color: var(--accent);
		font-size: 0.84rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.ai-toggle-pill.active {
		background: linear-gradient(135deg, var(--accent), #095041);
		color: #ffffff;
		border-color: transparent;
		box-shadow: 0 3px 10px rgba(14, 122, 99, 0.3);
	}
	.ai-hint-text {
		font-size: 0.82rem;
		color: var(--ink-faint);
	}

	.quick-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
		max-width: 680px;
		margin-bottom: 36px;
	}
	.chip {
		padding: 6px 12px;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		color: var(--ink-soft);
		transition: all 0.2s ease;
	}
	.chip.ai-chip {
		background: var(--chip);
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}
	.chip:hover {
		background: var(--bg-elev);
		border-color: var(--accent);
		color: var(--ink);
		transform: translateY(-1px);
	}
	.chip b {
		color: var(--warm);
	}
	.feature-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
		width: 100%;
		max-width: 820px;
	}
	.card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 18px;
		text-align: left;
		box-shadow: var(--shadow);
	}
	.card-icon {
		font-size: 1.8rem;
		margin-bottom: 8px;
	}
	.card h3 {
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 6px;
	}
	.card p {
		font-size: 0.85rem;
		color: var(--ink-soft);
		line-height: 1.5;
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
	.ai-top-toggle {
		padding: 8px 14px;
		border-radius: 10px;
		background: var(--chip);
		border: 1.5px solid var(--line);
		color: var(--accent);
		font-weight: 700;
		font-size: 0.86rem;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s ease;
	}
	.ai-top-toggle.active {
		background: linear-gradient(135deg, var(--accent), #095041);
		color: #ffffff;
		border-color: transparent;
		box-shadow: 0 2px 8px rgba(14, 122, 99, 0.3);
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

	/* AI Overview Card Styles */
	.ai-overview-card {
		background: var(--bg-elev);
		border: 1.5px solid transparent;
		border-radius: 16px;
		padding: 18px 20px;
		margin-bottom: 18px;
		box-shadow: 0 4px 20px rgba(14, 122, 99, 0.08);
		position: relative;
		background-clip: padding-box;
		border-image: linear-gradient(135deg, var(--accent), #2fbf9a, var(--warm)) 1;
		border-radius: 16px;
		transition: all 0.25s ease;
	}
	.ai-overview-card.loading {
		border: 1px dashed var(--accent);
		padding: 16px 20px;
	}
	.ai-overview-card.collapsed {
		padding: 14px 20px;
	}
	.ai-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 8px;
	}
	.ai-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.ai-sparkle {
		font-size: 1.2rem;
		color: var(--accent);
	}
	.ai-title {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--ink);
	}
	.ai-badge {
		background: linear-gradient(135deg, var(--accent), #095041);
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: var(--radius-full);
	}
	.ai-status-pill {
		font-size: 0.72rem;
		color: var(--ink-faint);
		background: var(--bg-soft);
		padding: 2px 8px;
		border-radius: var(--radius-full);
	}
	.ai-actions {
		display: flex;
		gap: 6px;
	}
	.ai-action-btn {
		background: var(--bg-soft);
		border: 1px solid var(--line);
		color: var(--ink-soft);
		padding: 4px 10px;
		border-radius: 8px;
		font-size: 0.76rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.ai-action-btn:hover {
		background: var(--chip);
		color: var(--accent);
	}
	.ai-content {
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--ink);
		margin-bottom: 14px;
	}
	:global(.ai-subheading) {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--accent);
		margin-top: 10px;
		margin-bottom: 4px;
	}
	:global(.ai-bullet) {
		margin-left: 18px;
		margin-bottom: 4px;
		list-style-type: disc;
	}
	:global(.cite-pill) {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--accent);
		background: var(--chip);
		padding: 1px 5px;
		border-radius: 4px;
		margin: 0 2px;
		vertical-align: super;
		cursor: help;
	}
	.ai-sources-section {
		display: flex;
		align-items: center;
		gap: 8px;
		border-top: 1px solid var(--line);
		padding-top: 10px;
		margin-top: 10px;
		flex-wrap: wrap;
	}
	.sources-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
		white-space: nowrap;
	}
	.sources-pills {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.source-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--bg-soft);
		border: 1px solid var(--line);
		padding: 3px 8px;
		border-radius: var(--radius-full);
		font-size: 0.76rem;
		color: var(--ink);
		text-decoration: none;
		transition: all 0.15s ease;
	}
	.source-pill:hover {
		background: var(--chip);
		border-color: var(--accent);
		color: var(--accent);
	}
	.src-icon {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}
	.src-num {
		font-weight: 700;
		color: var(--accent);
	}
	.src-name {
		font-weight: 500;
	}
	.ai-followup-section {
		margin-top: 12px;
		border-top: 1px dashed var(--line);
		padding-top: 10px;
	}
	.followup-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
		display: block;
		margin-bottom: 6px;
	}
	.followup-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.followup-chip {
		background: var(--bg-soft);
		border: 1px solid var(--line);
		color: var(--ink);
		padding: 4px 10px;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}
	.followup-chip:hover {
		background: var(--chip);
		border-color: var(--accent);
		color: var(--accent);
		transform: translateY(-1px);
	}

	/* Shimmer Loading for AI */
	.ai-shimmer-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 10px 0;
	}
	.shimmer-line {
		height: 14px;
		border-radius: 6px;
		background: linear-gradient(90deg, var(--bg-soft) 25%, var(--chip) 50%, var(--bg-soft) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	.shimmer-line.line-1 { width: 95%; }
	.shimmer-line.line-2 { width: 85%; }
	.shimmer-line.line-3 { width: 65%; }
	.ai-loading-text {
		font-size: 0.82rem;
		color: var(--accent);
		font-weight: 600;
	}
	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
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
		font-weight: 700;
		margin-bottom: 2px;
	}
	.kp-sub {
		font-size: 0.8rem;
		color: var(--ink-soft);
		margin-bottom: 8px;
	}
	.kp-desc {
		font-size: 0.88rem;
		color: var(--ink);
		line-height: 1.5;
		margin-bottom: 12px;
	}
	.kp-attr-grid {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-top: 1px solid var(--line);
		padding-top: 10px;
		margin-bottom: 12px;
	}
	.kp-attr-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
	}
	.kp-k {
		color: var(--ink-soft);
	}
	.kp-v {
		font-weight: 600;
		color: var(--ink);
	}
	.kp-footer {
		border-top: 1px solid var(--line);
		padding-top: 8px;
		font-size: 0.82rem;
	}
	.kp-footer a {
		color: var(--accent);
		font-weight: 600;
	}
	.empty-state {
		text-align: center;
		padding: 40px 16px;
		background: var(--bg-elev);
		border: 1px dashed var(--line);
		border-radius: 16px;
	}
	.empty-state h3 {
		font-size: 1.15rem;
		margin-bottom: 6px;
		color: var(--ink);
	}
	.empty-state p {
		font-size: 0.9rem;
		color: var(--ink-soft);
	}
	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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

	/* Modal Backdrop & Card */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 1000;
	}
	.modal-card {
		background: var(--bg-elev);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 24px;
		max-width: 480px;
		width: 100%;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	}
	.modal-card h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-bottom: 8px;
		color: var(--ink);
	}
	.modal-desc {
		font-size: 0.9rem;
		color: var(--ink-soft);
		margin-bottom: 16px;
		line-height: 1.5;
	}
	.signal-metrics {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--bg-soft);
		padding: 12px 14px;
		border-radius: 10px;
		margin-bottom: 18px;
	}
	.metric-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: var(--ink);
	}
	.metric-row strong {
		color: var(--accent);
	}
	.modal-close-btn {
		width: 100%;
		padding: 10px;
		background: var(--chip);
		color: var(--accent);
		border: none;
		border-radius: 10px;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}
	.modal-close-btn:hover {
		background: var(--line);
	}
	.incognito-url-box {
		background: var(--bg-soft);
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 8px 12px;
		font-family: monospace;
		font-size: 0.82rem;
		color: var(--accent);
		word-break: break-all;
		margin-bottom: 16px;
	}
	.incognito-actions {
		display: flex;
		gap: 8px;
	}
	.primary-btn {
		flex: 1;
		padding: 10px;
		background: var(--accent);
		color: #ffffff;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.88rem;
		text-align: center;
		text-decoration: none;
	}
</style>
