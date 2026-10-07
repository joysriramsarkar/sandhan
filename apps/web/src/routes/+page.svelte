<svelte:head>
	<title>{hasSearched && searchQuery ? `${searchQuery} — সন্ধান সার্চ` : 'সন্ধান (Sandhan) — উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিন ও এআই সারসংক্ষেপ'}</title>
	<meta name="description" content="সন্ধান (Sandhan) হলো উন্মুক্ত ও গোপনীয়তা-প্রথম বাংলা সার্চ ইঞ্জিন। সরাসরি এআই সারসংক্ষেপ, নির্ভরযোগ্য ফ্যাক্ট এবং কোনো ধরনের ইউজার ট্র্যাকিং ছাড়া সুপারফাস্ট সার্চ।" />
	<meta name="keywords" content="সন্ধান, sandhan, sandhan search engine, bangla search engine, বাংলা সার্চ ইঞ্জিন, bangla ai search, privacy search engine bangladesh, fast bangla search, bangladesh ai search" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href={hasSearched && searchQuery ? `https://sandhan.site/?q=${encodeURIComponent(searchQuery)}` : 'https://sandhan.site/'} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={hasSearched && searchQuery ? `https://sandhan.site/?q=${encodeURIComponent(searchQuery)}` : 'https://sandhan.site/'} />
	<meta property="og:site_name" content="সন্ধান (Sandhan)" />
	<meta property="og:title" content={hasSearched && searchQuery ? `${searchQuery} — সন্ধান সার্চ` : 'সন্ধান (Sandhan) — উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিন'} />
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
	import { t, localeStore, setLocale, type Locale } from '$lib/i18n';
	import { resolveBang } from '$lib/bangs';
	import {
		fetchWeatherAnswer,
		getInstantAnswer,
		isWeatherQuery,
		type InstantResult
	} from '$lib/instant';
	import { executeSearch, type SearchResponse, type SearchResultItem } from '$lib/search';
	import { isQuestionQuery, fetchAiOverview, type AiAnswerResponse } from '$lib/ai';
	import GIcon from '$lib/components/GIcon.svelte';
	import type { GIconName } from '$lib/components/icons';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';

	/* ---------------------------------------------------------------
	   State
	   --------------------------------------------------------------- */
	let searchQuery = '';
	let isSearching = false;
	let hasSearched = false;
	let instantResult: InstantResult | null = null;
	let searchResponse: SearchResponse | null = null;
	let selectedCategory = 'all';
	let currentPage = 1;
	let elapsedMs = 0;
	let scrolled = false;

	// AI Mode & Overview
	let isAiMode = false;
	let aiOverview: AiAnswerResponse | null = null;
	let isAiLoading = false;
	let isAiCollapsed = false;
	let copiedAi = false;

	// Autocomplete memory (session only — never persisted, never transmitted)
	let sessionQueries: string[] = [];

	// Goggles (tools)
	let activeGoggle = 'none';
	let customGoggleDsl = '';
	let toolsOpen = false;
	let openPaa: number | null = null;

	let activeWhySignal: SearchResultItem['signals'] | null = null;
	let incognitoUrl = '';

	// Reactive language switcher for searches
	let lastSearchedLocale = $localeStore;
	$: if ($localeStore !== lastSearchedLocale) {
		lastSearchedLocale = $localeStore;
		if (hasSearched && searchQuery) {
			performSearch(searchQuery, selectedCategory, 1);
		}
	}

	const CATEGORY_TABS: { id: string; label: string; icon: GIconName }[] = [
		{ id: 'all', label: t('tabs.all'), icon: 'search' },
		{ id: 'images', label: t('tabs.images'), icon: 'images' },
		{ id: 'videos', label: t('tabs.videos'), icon: 'videos' },
		{ id: 'news', label: t('tabs.news'), icon: 'news' },
		{ id: 'maps', label: t('tabs.maps'), icon: 'maps' }
	];

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
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('sandhan:reset-home', resetToHome);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('sandhan:reset-home', resetToHome);
		};
	});

	function handleScroll() {
		scrolled = window.scrollY > 4;
	}

	function handleKeydown(e: KeyboardEvent) {
		const targetTag = (document.activeElement as HTMLElement)?.tagName;
		const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || isEditable) {
			return;
		}
		if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			document.querySelector<HTMLInputElement>('.g-search-field input')?.focus();
		}
	}

	/* ---------------------------------------------------------------
	   Search
	   --------------------------------------------------------------- */
	async function performSearch(queryToRun?: string, categoryToRun?: string, pageToRun?: number) {
		const q = (queryToRun || searchQuery).trim();
		if (!q) return;

		// Bang shortcut → direct engine redirect (like Google's site: shortcuts)
		const bangUrl = resolveBang(q);
		if (bangUrl) {
			window.open(bangUrl, '_blank', 'noopener');
			return;
		}

		const cat = categoryToRun || selectedCategory;
		const page = pageToRun || (queryToRun && queryToRun !== searchQuery ? 1 : currentPage);
		currentPage = page;
		selectedCategory = cat;
		searchQuery = q;
		isSearching = true;
		hasSearched = true;
		openPaa = null;
		sessionQueries = [q, ...sessionQueries.filter((item) => item !== q)].slice(0, 12);

		const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

		// Update the URL without a reload (deep-linkable searches, like /search?q=)
		const url = new URL(window.location.href);
		url.searchParams.set('q', q);
		if (cat !== 'all') url.searchParams.set('cat', cat);
		else url.searchParams.delete('cat');
		if (page > 1) url.searchParams.set('page', page.toString());
		else url.searchParams.delete('page');
		if (isAiMode) url.searchParams.set('ai', '1');
		else url.searchParams.delete('ai');
		window.history.pushState({}, '', url);

		// Instant answers (calculator, units, time, weather) on page 1
		instantResult = page === 1 ? getInstantAnswer(q) : null;
		if (page === 1 && isWeatherQuery(q)) {
			fetchWeatherAnswer(q).then((result) => {
				if (searchQuery === q) instantResult = result;
			});
		}

		// Goggles DSL
		let dsl = customGoggleDsl;
		if (activeGoggle === 'academic') dsl = '$boost=3,site=edu\n$boost=2,site=org';
		if (activeGoggle === 'bengali') dsl = '$boost=3,lang=bn\n$boost=2,site=bangla';

		const shouldTriggerAi = page === 1 && (isQuestionQuery(q, $localeStore) || isAiMode);
		if (shouldTriggerAi) {
			isAiLoading = true;
			aiOverview = null;
		} else {
			aiOverview = null;
			isAiLoading = false;
		}

		searchResponse = await executeSearch(q, cat, dsl, $localeStore, page);
		elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
		isSearching = false;

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

	async function luckySearch() {
		const q = searchQuery.trim();
		if (!q) return;
		const bangUrl = resolveBang(q);
		if (bangUrl) {
			window.open(bangUrl, '_blank', 'noopener');
			return;
		}
		const probe = await executeSearch(q, 'all', undefined, $localeStore, 1);
		const first = probe.results[0];
		performSearch(q, 'all', 1);
		if (first?.url) window.open(first.url, '_blank', 'noopener');
	}

	function toggleAiMode() {
		isAiMode = !isAiMode;
		const url = new URL(window.location.href);
		if (isAiMode) url.searchParams.set('ai', '1');
		else url.searchParams.delete('ai');
		if (typeof window !== 'undefined' && hasSearched) window.history.replaceState({}, '', url);

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
			.replace(/^### (.*?)$/gm, '<h3 class="ai-h3">$1</h3>')
			.replace(/^## (.*?)$/gm, '<h3 class="ai-h3">$1</h3>')
			.replace(/^\* (.*?)$/gm, '<li class="ai-li">$1</li>')
			.replace(/\[(\d+)\]/g, '<sup class="ai-cite">$1</sup>')
			.replace(/\n\n/g, '</p><p class="ai-p">')
			.replace(/^/, '<p class="ai-p">')
			.replace(/$/, '</p>');
	}

	function goToPage(p: number) {
		if (p < 1 || (searchResponse && p > searchResponse.totalPages) || p === currentPage) return;
		performSearch(searchQuery, selectedCategory, p);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function switchCategory(cat: string) {
		if (cat === selectedCategory && hasSearched) return;
		selectedCategory = cat;
		currentPage = 1;
		if (hasSearched && searchQuery) {
			performSearch(searchQuery, cat, 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function handleSuggestionSubmit(event: CustomEvent<{ q: string }>) {
		const q = event.detail.q;
		searchQuery = q;
		currentPage = 1;
		performSearch(q, selectedCategory, 1);
	}

	function handleLens(event: CustomEvent<{ q: string }>) {
		const q = (event.detail.q || searchQuery).trim();
		searchQuery = q;
		if (q) performSearch(q, 'images', 1);
		else document.querySelector<HTMLInputElement>('.g-search-field input')?.focus();
	}

	function handleFaviconError(e: Event) {
		const target = e.currentTarget as HTMLElement | null;
		if (target) {
			target.style.visibility = 'hidden';
		}
	}

	function openIncognito(url: string) {
		incognitoUrl = url;
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
		toolsOpen = false;
		const url = new URL(window.location.href);
		['q', 'cat', 'page', 'ai'].forEach((key) => url.searchParams.delete(key));
		window.history.pushState({}, '', url);
	}

	function handleLocaleChange(locale: Locale) {
		setLocale(locale);
		window.location.reload();
	}

	/* ---------------------------------------------------------------
	   Helpers
	   --------------------------------------------------------------- */
	function formatCount(value: number): string {
		try {
			return Math.round(value).toLocaleString('bn-BD');
		} catch (_) {
			return String(Math.round(value));
		}
	}

	function formatSeconds(ms: number): string {
		const seconds = (ms / 1000).toFixed(2);
		try {
			return Number(seconds).toLocaleString('bn-BD', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		} catch (_) {
			return seconds;
		}
	}

	function breadcrumb(url: string): string {
		try {
			const parsed = new URL(url);
			const parts = parsed.pathname.split('/').filter(Boolean).slice(0, 3);
			const host = parsed.hostname.replace(/^www\./, '');
			return [host, ...parts].join(' › ');
		} catch (_) {
			return url;
		}
	}

	function faviconFor(domain?: string): string {
		const host = (domain || '').replace(/^www\./, '') || 'sandhan.site';
		return `https://icons.duckduckgo.com/ip3/${host}.ico`;
	}

	const RELATED_STEMS: Record<Locale, string[]> = {
		bn: ['কী', 'কেন', 'কীভাবে', 'ইতিহাস', 'অর্থ', 'উদাহরণ'],
		en: ['meaning', 'definition', 'history', 'how to', 'examples', 'vs'],
		hi: ['क्या है', 'क्यों', 'कैसे', 'इतिहास', 'अर्थ', 'उदाहरण']
	};

	$: relatedSearches = buildRelatedSearches(searchQuery, searchResponse);
	$: peopleAlsoAsk = aiOverview?.relatedQuestions || [];

	function buildRelatedSearches(q: string, response: SearchResponse | null): string[] {
		if (!q) return [];
		const locale = $localeStore as Locale;
		const stems = RELATED_STEMS[locale] || RELATED_STEMS.bn;
		const out: string[] = [];
		const push = (value: string) => {
			const text = value.trim();
			if (text && !out.includes(text)) out.push(text);
		};
		for (const stem of stems.slice(0, 4)) push(`${q} ${stem}`);
		const knowledgeTitle = response?.knowledge?.title;
		if (knowledgeTitle && knowledgeTitle.toLowerCase() !== q.toLowerCase()) {
			push(`${knowledgeTitle} কী`);
			push(`${knowledgeTitle} ইতিহাস`);
		}
		for (const item of (response?.results || []).slice(1, 3)) {
			const firstWord = item.title?.split(/[—|–:·]/)[0]?.trim();
			if (firstWord && firstWord.length > 3 && firstWord.toLowerCase() !== q.toLowerCase()) {
				push(firstWord);
			}
		}
		return out.slice(0, 8);
	}

	function paaAnswer(index: number): SearchResultItem | null {
		const results = searchResponse?.results || [];
		if (!results.length) return null;
		return results[index % results.length] || null;
	}

	const PAGE_WINDOW = 10;
</script>

{#if !hasSearched}
	<!-- ============================================================
	     HOME — google.com style landing page
	     ============================================================ -->
	<div class="g-home">
		<div class="g-home-topbar">
			<a class="g-top-link" href="/launch">সন্ধান সম্পর্কে</a>
			<a class="g-top-link" href="/dashboard">ড্যাশবোর্ড</a>
			<button class="g-top-icon" title="সন্ধান অ্যাপ" aria-label="সন্ধান অ্যাপ" on:click={() => (toolsOpen = !toolsOpen)}>
				<GIcon name="apps" size={20} />
			</button>
			<button class="g-top-avatar" title="অ্যাকাউন্ট" aria-label="অ্যাকাউন্ট ও সেটিংস" on:click={() => (toolsOpen = !toolsOpen)}>স</button>
			{#if toolsOpen}
				<div class="g-home-menu">
					<a class="g-menu-row" href="/dashboard">📊 সিস্টেম অবস্থা</a>
					<a class="g-menu-row" href="/launch">🚀 ইশতেহার ও ঘোষণা</a>
					<a class="g-menu-row" href="/?q=গোপনীয়তা">🛡️ গোপনীয়তা নীতি</a>
					<a class="g-menu-row" href="https://github.com/joysriramsarkar/sandhan" target="_blank" rel="noopener">⌥ সোর্স কোড (AGPL-3.0)</a>
					<div class="g-menu-hr"></div>
					<div class="g-menu-note">
						<GIcon name="shield" size={15} />
						<span>সার্চ হিস্টরি AES-256-GCM এনক্রিপশনে আপনার ব্রাউজারেই থাকে।</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="g-home-main">
			<div class="g-home-logo"><Wordmark size="lg" /></div>

			<div class="g-home-searchbox">
				<SearchBox
					bind:value={searchQuery}
					variant="home"
					{sessionQueries}
					autofocus
					placeholder={t('searchPlaceholder')}
					on:submit={handleSuggestionSubmit}
					on:lens={handleLens}
				/>
			</div>

			<div class="g-home-airow">
				<button class="g-ai-pill" class:on={isAiMode} on:click={toggleAiMode} title="AI Mode চালু/বন্ধ করুন">
					<span class="g-ai-ico"><GIcon name="ai" size={18} /></span>
					<span>AI Mode</span>
					<span class="g-ai-state">{isAiMode ? 'চালু' : 'বন্ধ'}</span>
				</button>
			</div>

			<div class="g-home-buttons">
				<button class="g-btn" on:click={() => performSearch()}>{t('searchBtn')}</button>
				<button class="g-btn" on:click={luckySearch}>{t('feelingLucky')}</button>
			</div>

			<p class="g-home-offered">
				{t('offeredIn')}
				<button class="g-offered-link" on:click={() => handleLocaleChange('bn')}>বাংলা</button>
				<button class="g-offered-link" on:click={() => handleLocaleChange('en')}>English</button>
				<button class="g-offered-link" on:click={() => handleLocaleChange('hi')}>हिन्दी</button>
			</p>
		</div>

		<footer class="g-home-footer">
			<div class="g-home-footer-region">
				<span>বাংলাদেশ</span>
				<span class="g-home-footer-tag">{t('tagline')}</span>
			</div>
			<div class="g-home-footer-links">
				<div class="g-home-footer-left">
					<a href="/launch">সম্পর্কে</a>
					<a href="/dashboard">সিস্টেম স্ট্যাটাস</a>
					<a href="https://github.com/joysriramsarkar/sandhan" target="_blank" rel="noopener">সোর্স কোড</a>
					<a href="/?q=সন্ধান কীভাবে কাজ করে">সন্ধান কীভাবে কাজ করে</a>
				</div>
				<div class="g-home-footer-right">
					<a href="/?q=গোপনীয়তা">গোপনীয়তা</a>
					<a href="/?q=শর্তাবলী">শর্তাবলী</a>
					<button class="g-footer-setting" on:click={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}>সেটিংস</button>
				</div>
			</div>
		</footer>
	</div>
{:else}
	<!-- ============================================================
	     SERP — google.com/search style results page
	     ============================================================ -->
	<div class="g-serp">
		<header class="g-serp-header" class:scrolled>
			<div class="g-serp-head-inner">
				<div class="g-serp-bar">
					<a class="g-serp-logo" href="/" on:click|preventDefault={resetToHome} aria-label="সন্ধান হোম">
						<Wordmark size="sm" />
					</a>

					<div class="g-serp-box">
						<SearchBox
							bind:value={searchQuery}
							variant="serp"
							{sessionQueries}
							on:submit={handleSuggestionSubmit}
							on:lens={handleLens}
						/>
					</div>

					<div class="g-serp-actions">
						<button class="g-ai-pill compact" class:on={isAiMode} on:click={toggleAiMode} title="AI Mode">
							<span class="g-ai-ico"><GIcon name="ai" size={16} /></span>
							<span>AI Mode</span>
						</button>
						<button class="g-icon-btn" title="সেটিংস" aria-label="সেটিংস" on:click={() => (toolsOpen = !toolsOpen)}>
							<GIcon name="tools" size={20} />
						</button>
						<button class="g-avatar" title="অ্যাকাউন্ট" aria-label="অ্যাকাউন্ট">স</button>
					</div>
				</div>

				<div class="g-serp-tabsrow">
					<nav class="g-tabs" aria-label="ফলাফলের ধরন">
						{#each CATEGORY_TABS as tab (tab.id)}
							<button
								class="g-tab"
								class:active={selectedCategory === tab.id}
								on:click={() => switchCategory(tab.id)}
								aria-current={selectedCategory === tab.id ? 'page' : undefined}
							>
								<span class="g-tab-ico"><GIcon name={tab.icon} size={18} /></span>
								<span class="g-tab-label">{tab.label}</span>
							</button>
						{/each}
					</nav>

					<button class="g-tools-btn" class:open={toolsOpen} on:click={() => (toolsOpen = !toolsOpen)}>
						<span>{t('tools')}</span>
						<GIcon name="chevron-down" size={18} />
					</button>
				</div>

				{#if toolsOpen}
					<div class="g-tools-panel">
						<div class="g-tools-group">
							<label class="g-tools-label" for="goggle-select">👓 র‍্যাংকিং (Goggles)</label>
							<select
								id="goggle-select"
								bind:value={activeGoggle}
								on:change={() => performSearch()}
							>
								<option value="none">ডিফল্ট র‍্যাংকিং</option>
								<option value="bengali">বাংলা প্রাধান্য</option>
								<option value="academic">একাডেমিক প্রাধান্য</option>
							</select>
						</div>
						<div class="g-tools-group grow">
							<label class="g-tools-label" for="goggle-dsl">কাস্টম র‍্যাংকিং নিয়ম (Goggles DSL)</label>
							<input
								id="goggle-dsl"
								type="text"
								bind:value={customGoggleDsl}
								placeholder="যেমন: $boost=2,site=wikipedia.org"
								on:keydown={(event) => {
									if (event.key === 'Enter') performSearch();
								}}
							/>
						</div>
						<button class="g-btn small" on:click={() => performSearch()}>প্রয়োগ করুন</button>
					</div>
				{/if}
			</div>
		</header>

		<div class="g-serp-body">
			<div class="g-serp-col">
				<!-- Result statistics -->
				{#if !isSearching}
					<div class="g-stats">
						প্রায় {formatCount(searchResponse?.total || 0)} ফলাফল ({formatSeconds(elapsedMs)} সেকেন্ড)
					</div>
				{/if}

				<!-- Did you mean -->
				{#if searchResponse?.didYouMean}
					<div class="g-dym">
						<span>আপনি কি বোঝাতে চেয়েছেন</span>
						<button class="g-dym-link" on:click={() => handleSuggestionSubmit(new CustomEvent('submit', { detail: { q: searchResponse?.didYouMean || '' } }))}>
							{searchResponse.didYouMean}
						</button>
					</div>
				{/if}

				<!-- Instant answer (calculator, unit conversion, time, weather) -->
				{#if instantResult}
					<div class="g-instant">
						<div class="g-instant-title">{instantResult.title}</div>
						<div class="g-instant-value">{instantResult.value}</div>
						{#if instantResult.detail}
							<div class="g-instant-detail">{instantResult.detail}</div>
						{/if}
						<div class="g-instant-src">সন্ধান ইনস্ট্যান্ট উত্তর</div>
					</div>
				{/if}

				<!-- AI Overview -->
				{#if isAiLoading}
					<div class="g-ai-card loading">
						<div class="g-ai-head">
							<span class="g-ai-ico lg"><GIcon name="ai" size={22} /></span>
							<span class="g-ai-title">AI Overview</span>
						</div>
						<div class="g-shimmer">
							<span></span><span></span><span></span>
						</div>
						<div class="g-ai-loading-text">{t('aiGenerating')}</div>
					</div>
				{:else if aiOverview}
					<div class="g-ai-card" class:collapsed={isAiCollapsed}>
						<div class="g-ai-head">
							<span class="g-ai-ico lg"><GIcon name="ai" size={22} /></span>
							<span class="g-ai-title">AI Overview</span>
							<span class="g-ai-badge">সন্ধান AI</span>
							<div class="g-ai-head-actions">
								<button class="g-ai-action" on:click={copyAiAnswer} title={t('copyAnswer')}>
									<GIcon name={copiedAi ? 'check' : 'copy'} size={16} />
									<span>{copiedAi ? t('copied') : t('copyAnswer')}</span>
								</button>
								<button class="g-ai-action" on:click={() => (isAiCollapsed = !isAiCollapsed)}>
									<GIcon name="chevron-down" size={16} />
									<span>{isAiCollapsed ? 'আরও দেখান' : 'সংক্ষেপ করুন'}</span>
								</button>
							</div>
						</div>

						{#if !isAiCollapsed}
							<div class="g-ai-content">{@html formatAiMarkdown(aiOverview.answer)}</div>

							{#if aiOverview.sources?.length}
								<div class="g-ai-sources">
									<span class="g-ai-sources-label">উৎসসমূহ</span>
									<div class="g-ai-chips">
										{#each aiOverview.sources as src}
											<a class="g-ai-chip" href={src.url} target="_blank" rel="noopener noreferrer" title={src.title}>
												<img src={faviconFor(src.domain)} alt="" on:error={handleFaviconError} />
												<span>{src.domain}</span>
											</a>
										{/each}
									</div>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

				<!-- Maps view -->
				{#if selectedCategory === 'maps'}
					<div class="g-maps">
						<iframe
							title="মানচিত্র"
							loading="lazy"
							src={`https://www.google.com/maps?q=${encodeURIComponent(searchQuery)}&output=embed`}
						></iframe>
						<div class="g-maps-footer">
							<span>📍 {searchQuery}</span>
							<a href={`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer">
								বড় মানচিত্রে দেখুন
							</a>
						</div>
					</div>
				{/if}

				<!-- Loading -->
				{#if isSearching}
					<div class="g-loading">
						<div class="g-spinner"></div>
						<span>ফলাফল আনা হচ্ছে…</span>
					</div>
				{:else if !searchResponse?.results.length}
					<div class="g-empty">
						<h3>আপনার অনুসন্ধান <b>{searchQuery}</b> এর সাথে মিলে এমন কোনো ফলাফল পাওয়া যায়নি</h3>
						<ul>
							<li>বানান ঠিক আছে কিনা যাচাই করুন।</li>
							<li>অন্য কীওয়ার্ড বা কম নির্দিষ্ট শব্দ ব্যবহার করে দেখুন।</li>
							<li>
								<b>!w</b>, <b>!gh</b>, <b>!yt</b> এর মতো ব্যাং শর্টকাট দিয়ে সরাসরি অন্য ইঞ্জিনে খুঁজুন।
							</li>
						</ul>
					</div>
				{:else if selectedCategory === 'images'}
					<h2 class="g-cat-heading">ছবি — {searchQuery}</h2>
					<div class="g-images">
						{#each searchResponse.results as item}
							<a class="g-image" href={item.url} target="_blank" rel="noopener noreferrer" title={item.title}>
								<img
									src={item.imageUrl || faviconFor(item.domain)}
									alt={item.title}
									loading="lazy"
									on:error={handleFaviconError}
								/>
								<span class="g-image-caption">{item.title}</span>
							</a>
						{/each}
					</div>
				{:else if selectedCategory === 'videos'}
					<h2 class="g-cat-heading">ভিডিও — {searchQuery}</h2>
					<div class="g-videos">
						{#each searchResponse.results as item}
							<div class="g-video">
								<a class="g-video-thumb" href={item.url} target="_blank" rel="noopener noreferrer">
									{#if item.imageUrl}
										<img src={item.imageUrl} alt="" loading="lazy" on:error={handleFaviconError} />
									{:else}
										<span class="g-video-placeholder"><GIcon name="videos" size={28} /></span>
									{/if}
									<span class="g-video-badge">{item.domain}</span>
								</a>
								<div class="g-video-meta">
									<div class="g-src-row">
										<span class="g-favicon-circle"><img src={faviconFor(item.domain)} alt="" on:error={handleFaviconError} /></span>
										<span class="g-src-name">{item.domain || item.source}</span>
									</div>
									<h3 class="g-result-title"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
									<p class="g-result-snippet">{item.snippet}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<!-- Web results -->
					<div class="g-results">
						{#each searchResponse.results as item, idx (item.url + idx)}
							<article class="g-result">
								<div class="g-src-row">
									<span class="g-favicon-circle">
										<img src={faviconFor(item.domain)} alt="" on:error={handleFaviconError} />
									</span>
									<div class="g-src-lines">
										<span class="g-src-name">{item.domain || item.source}</span>
										<span class="g-src-url">{breadcrumb(item.url)}</span>
									</div>
								</div>

								<h3 class="g-result-title">
									<a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
								</h3>

								<p class="g-result-snippet">{item.snippet}</p>

								<div class="g-result-actions">
									<button class="g-link-btn" on:click={() => (activeWhySignal = item.signals)}>
										<GIcon name="info" size={15} />
										<span>{t('whyThisResult')}</span>
									</button>
									<button class="g-link-btn" on:click={() => openIncognito(item.url)}>
										<GIcon name="shield" size={15} />
										<span>{t('incognitoView')}</span>
									</button>
									<a class="g-link-btn" href={item.url} target="_blank" rel="noopener noreferrer">
										<GIcon name="external" size={15} />
										<span>ভিজিট করুন</span>
									</a>
									<span class="g-result-rank">#{((currentPage - 1) * 10) + idx + 1}</span>
								</div>
							</article>
						{/each}
					</div>

					<!-- People also ask -->
					{#if peopleAlsoAsk.length > 0}
						<div class="g-paa">
							<h2 class="g-paa-title">অন্যরা আরও জিজ্ঞাসা করেছে</h2>
							{#each peopleAlsoAsk as question, index}
								<div class="g-paa-item">
									<button
										class="g-paa-question"
										class:open={openPaa === index}
										on:click={() => (openPaa = openPaa === index ? null : index)}
									>
										<span>{question}</span>
										<GIcon name="chevron-down" size={20} />
									</button>
									{#if openPaa === index}
										<div class="g-paa-answer">
											{#if paaAnswer(index)}
												<p>{paaAnswer(index)?.snippet}</p>
												<div class="g-paa-answer-actions">
													<a href={paaAnswer(index)?.url} target="_blank" rel="noopener noreferrer" class="g-paa-source">
														<span class="g-favicon-circle small">
															<img src={faviconFor(paaAnswer(index)?.domain)} alt="" on:error={handleFaviconError} />
														</span>
														<span>{paaAnswer(index)?.domain}</span>
													</a>
													<button class="g-link-btn" on:click={() => handleSuggestionSubmit(new CustomEvent('submit', { detail: { q: question } }))}>
														<GIcon name="search" size={15} />
														<span>সম্পূর্ণ অনুসন্ধান</span>
													</button>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<!-- Related searches -->
					{#if relatedSearches.length > 0}
						<div class="g-related">
							<h2 class="g-related-title">সম্পর্কিত অনুসন্ধান</h2>
							<div class="g-related-grid">
								{#each relatedSearches as related}
									<button class="g-related-item" on:click={() => handleSuggestionSubmit(new CustomEvent('submit', { detail: { q: related } }))}>
										<span class="g-related-ico"><GIcon name="search" size={18} /></span>
										<span class="g-related-text">{related}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Pagination -->
					{#if searchResponse.totalPages > 1}
						<nav class="g-pagination" aria-label="পেজ নেভিগেশন">
							<div class="g-pages">
								{#each Array.from({ length: Math.min(PAGE_WINDOW, searchResponse.totalPages) }, (_, i) => i + 1) as p}
									{#if p === currentPage}
										<span class="g-page-current" aria-current="page">{p}</span>
									{:else}
										<button class="g-page-link" on:click={() => goToPage(p)}>{p}</button>
									{/if}
								{/each}
							</div>
							{#if currentPage < searchResponse.totalPages}
								<button class="g-next" on:click={() => goToPage(currentPage + 1)}>
									<span>পরবর্তী</span>
									<GIcon name="chevron-right" size={18} />
								</button>
							{/if}
						</nav>
					{/if}
				{/if}
			</div>

			<!-- Knowledge panel -->
			<aside class="g-serp-side">
				{#if searchResponse?.knowledge}
					<div class="g-kp">
						{#if searchResponse.knowledge.thumbnail}
							<img class="g-kp-image" src={searchResponse.knowledge.thumbnail} alt={searchResponse.knowledge.title} />
						{/if}
						<h2 class="g-kp-title">{searchResponse.knowledge.title}</h2>
						{#if searchResponse.knowledge.subtitle}
							<div class="g-kp-sub">{searchResponse.knowledge.subtitle}</div>
						{/if}
						<p class="g-kp-desc">{searchResponse.knowledge.description}</p>

						{#if searchResponse.knowledge.attributes?.length}
							<div class="g-kp-attributes">
								{#each searchResponse.knowledge.attributes as [key, value]}
									<div class="g-kp-row">
										<span class="g-kp-key">{key}</span>
										<span class="g-kp-value">{value}</span>
									</div>
								{/each}
							</div>
						{/if}

						<div class="g-kp-footer">
							<a href={searchResponse.knowledge.sourceUrl} target="_blank" rel="noopener noreferrer">
								উইকিপিডিয়ায় দেখুন
							</a>
						</div>
					</div>
				{/if}

				{#if isAiMode && hasSearched}
					<div class="g-kp g-kp-note">
						<div class="g-ai-pill-note">
							<span class="g-ai-ico"><GIcon name="ai" size={16} /></span>
							<span>AI Mode চালু আছে — প্রশ্ন করলে সংশ্লেষিত উত্তর ও উৎস দেখানো হয়।</span>
						</div>
					</div>
				{/if}
			</aside>
		</div>

		<footer class="g-serif-footer">
			<div class="g-serif-footer-region">
				<span>বাংলাদেশ</span>
				<span class="g-serif-footer-tag">{t('tagline')}</span>
			</div>
			<div class="g-serif-footer-links">
				<div class="g-serif-footer-left">
					<a href="/launch">সম্পর্কে</a>
					<a href="/dashboard">সিস্টেম স্ট্যাটাস</a>
					<a href="https://github.com/joysriramsarkar/sandhan" target="_blank" rel="noopener">সোর্স কোড</a>
					<a href="/?q=সন্ধান কীভাবে কাজ করে">সন্ধান কীভাবে কাজ করে</a>
				</div>
				<div class="g-serif-footer-right">
					<a href="/?q=গোপনীয়তা">গোপনীয়তা</a>
					<a href="/?q=শর্তাবলী">শর্তাবলী</a>
					<a href="/?q=সেটিংস">সেটিংস</a>
				</div>
			</div>
		</footer>
	</div>
{/if}

<!-- Ranking explanation dialog -->
{#if activeWhySignal}
	<div class="g-scrim" role="presentation" on:click={() => (activeWhySignal = null)}></div>
	<div class="g-modal" role="dialog" aria-modal="true" aria-label={t('whyTitle')}>
		<h3>{t('whyTitle')}</h3>
		<p class="g-modal-desc">{activeWhySignal.explanation}</p>
		<div class="g-signals">
			<div class="g-signal-row">
				<span>কীওয়ার্ড প্রাসঙ্গিকতা (BM25)</span>
				<strong>{(activeWhySignal.bm25 * 100).toFixed(0)}%</strong>
			</div>
			<div class="g-signal-bar"><span style={`width:${activeWhySignal.bm25 * 100}%`}></span></div>
			<div class="g-signal-row">
				<span>ডোমেইন অথরিটি</span>
				<strong>{(activeWhySignal.authority * 100).toFixed(0)}%</strong>
			</div>
			<div class="g-signal-bar"><span style={`width:${activeWhySignal.authority * 100}%`}></span></div>
			<div class="g-signal-row">
				<span>তথ্যের তাজাতা (Freshness)</span>
				<strong>{(activeWhySignal.freshness * 100).toFixed(0)}%</strong>
			</div>
			<div class="g-signal-bar"><span style={`width:${activeWhySignal.freshness * 100}%`}></span></div>
		</div>
		<div class="g-modal-actions">
			<button class="g-btn-text" on:click={() => (activeWhySignal = null)}>বাতিল</button>
			<button class="g-btn-filled" on:click={() => (activeWhySignal = null)}>ঠিক আছে</button>
		</div>
	</div>
{/if}

<!-- Anonymous view dialog -->
{#if incognitoUrl}
	<div class="g-scrim" role="presentation" on:click={() => (incognitoUrl = '')}></div>
	<div class="g-modal" role="dialog" aria-modal="true" aria-label={t('incognitoView')}>
		<h3>{t('incognitoView')}</h3>
		<p class="g-modal-desc">
			কুকিজ, ট্র্যাকার ও প্রোফাইলিং ছাড়া এই পাতাটি খুলুন — আপনার অনুসন্ধান কোথাও সংরক্ষিত হয় না।
		</p>
		<div class="g-url-box">{incognitoUrl}</div>
		<div class="g-modal-actions">
			<button class="g-btn-text" on:click={() => (incognitoUrl = '')}>বাতিল</button>
			<a class="g-btn-filled" href={incognitoUrl} target="_blank" rel="noopener noreferrer" on:click={() => (incognitoUrl = '')}>
				খুলুন
			</a>
		</div>
	</div>
{/if}

<style>
	/* ============================================================
	   HOME
	   ============================================================ */
	.g-home {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.g-home-topbar {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 15px;
		padding: 10px 18px 0;
	}
	.g-top-link {
		font-size: 13px;
		color: var(--g-text);
		line-height: 24px;
	}
	.g-top-link:hover {
		text-decoration: underline;
	}
	.g-top-icon,
	.g-top-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		color: var(--g-text-2);
	}
	.g-top-icon:hover,
	.g-top-avatar:hover {
		background: var(--g-hover);
	}
	.g-top-avatar {
		width: 32px;
		height: 32px;
		background: linear-gradient(135deg, #4285f4, #34a853);
		color: #fff;
		font-size: 15px;
	}
	.g-home-menu {
		position: absolute;
		top: 54px;
		right: 18px;
		width: 320px;
		background: var(--g-surface);
		border: 1px solid var(--g-border);
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 8px 24px rgba(60, 64, 67, 0.15);
		padding: 8px 0;
		z-index: 70;
	}
	.g-menu-row {
		display: block;
		padding: 10px 16px;
		font-size: 14px;
		color: var(--g-text);
	}
	.g-menu-row:hover {
		background: var(--g-hover);
	}
	.g-menu-hr {
		height: 1px;
		background: var(--g-divider);
		margin: 6px 0;
	}
	.g-menu-note {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		padding: 8px 16px 10px;
		font-size: 12px;
		color: var(--g-text-3);
		line-height: 1.45;
	}

	.g-home-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 16px 120px;
		text-align: center;
	}
	.g-home-logo {
		margin-top: clamp(36px, 14vh, 140px);
		margin-bottom: 26px;
	}
	.g-home-searchbox {
		width: 100%;
		max-width: 584px;
		margin-bottom: 26px;
	}
	.g-home-airow {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		max-width: 584px;
		margin-bottom: 16px;
	}
	.g-home-buttons {
		display: flex;
		gap: 11px;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 26px;
	}
	.g-btn {
		height: 36px;
		padding: 0 16px;
		background: var(--g-surface-2);
		border: 1px solid var(--g-surface-2);
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		color: var(--g-text-2);
		transition: box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}
	.g-btn:hover {
		border-color: var(--g-border);
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		color: var(--g-text);
	}
	.g-btn.small {
		height: 32px;
		padding: 0 14px;
		background: var(--g-blue);
		color: #fff;
		border-color: var(--g-blue);
	}
	:global([data-theme='dark']) .g-btn {
		background: #303134;
		border-color: #303134;
		color: #e8eaed;
	}
	.g-home-offered {
		font-size: 13px;
		color: var(--g-text-2);
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.g-offered-link {
		color: var(--g-link);
		font-size: 13px;
		padding: 0 2px;
	}
	.g-offered-link:hover {
		text-decoration: underline;
	}
	:global([data-theme='dark']) .g-offered-link {
		color: var(--g-blue);
	}

	/* AI Mode pill (google.com/search 2025) */
	.g-ai-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 16px;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		background: var(--g-surface);
		font-size: 14px;
		color: var(--g-text);
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.g-ai-pill:hover {
		background: var(--g-hover);
	}
	.g-ai-pill.on {
		background: color-mix(in srgb, var(--g-blue) 12%, transparent);
		border-color: var(--g-blue);
		color: var(--g-blue);
	}
	.g-ai-pill.compact {
		height: 36px;
		padding: 0 12px;
		font-size: 13px;
	}
	.g-ai-ico {
		display: inline-flex;
		align-items: center;
	}
	.g-ai-state {
		font-size: 12px;
		color: var(--g-text-3);
	}
	.g-ai-pill.on .g-ai-state {
		color: inherit;
	}

	.g-home-footer {
		background: var(--g-footer-bg);
		color: var(--g-text-3);
		font-size: 14px;
	}
	.g-home-footer-region,
	.g-home-footer-links {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 0 30px;
	}
	.g-home-footer-region {
		height: 46px;
		border-bottom: 1px solid var(--g-border);
	}
	.g-home-footer-tag {
		font-size: 13px;
	}
	.g-home-footer-links {
		height: 46px;
	}
	.g-home-footer-left,
	.g-home-footer-right {
		display: flex;
		align-items: center;
		gap: 28px;
		flex-wrap: wrap;
	}
	.g-home-footer a,
	.g-footer-setting {
		color: var(--g-text-3);
		font-size: 14px;
	}
	.g-home-footer a:hover,
	.g-footer-setting:hover {
		text-decoration: underline;
	}

	/* ============================================================
	   SERP
	   ============================================================ */
	.g-serp {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.g-serp-header {
		position: sticky;
		top: 0;
		z-index: 60;
		background: var(--g-bg);
		border-bottom: 1px solid transparent;
	}
	.g-serp-header.scrolled {
		border-bottom-color: var(--g-divider);
		box-shadow: var(--g-shadow-1);
	}
	.g-serp-head-inner {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
	}
	.g-serp-bar {
		display: flex;
		align-items: center;
		gap: 20px;
		height: 64px;
		padding: 0 24px;
	}
	.g-serp-logo {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}
	.g-serp-box {
		flex: 1;
		min-width: 0;
		max-width: 692px;
	}
	.g-serp-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}
	.g-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		color: var(--g-text-2);
	}
	.g-icon-btn:hover {
		background: var(--g-hover);
	}
	.g-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4285f4, #34a853);
		color: #fff;
		font-size: 15px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.g-serp-tabsrow {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		padding: 0 24px;
	}
	.g-tabs {
		display: flex;
		align-items: flex-end;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.g-tabs::-webkit-scrollbar {
		display: none;
	}
	.g-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 6px 12px 10px;
		border-bottom: 3px solid transparent;
		font-size: 14px;
		color: var(--g-text-2);
		white-space: nowrap;
	}
	.g-tab:hover {
		color: var(--g-text);
	}
	.g-tab.active {
		color: var(--g-text);
		border-bottom-color: var(--g-blue);
	}
	.g-tab-ico {
		display: inline-flex;
	}
	.g-tools-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		margin-bottom: 6px;
		border: 1px solid var(--g-border);
		border-radius: 4px;
		font-size: 14px;
		color: var(--g-text-2);
		white-space: nowrap;
	}
	.g-tools-btn:hover,
	.g-tools-btn.open {
		background: var(--g-hover);
		color: var(--g-text);
	}
	.g-tools-panel {
		display: flex;
		align-items: flex-end;
		gap: 16px;
		flex-wrap: wrap;
		padding: 14px 24px 16px;
		border-top: 1px solid var(--g-divider);
		background: var(--g-surface-2);
	}
	.g-tools-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.g-tools-group.grow {
		flex: 1;
		min-width: 220px;
	}
	.g-tools-label {
		font-size: 12px;
		color: var(--g-text-3);
	}
	.g-tools-panel select,
	.g-tools-panel input {
		height: 32px;
		min-width: 200px;
		padding: 0 10px;
		border: 1px solid var(--g-border);
		border-radius: 4px;
		background: var(--g-surface);
		color: var(--g-text);
		font-size: 13px;
	}

	.g-serp-body {
		display: flex;
		gap: 40px;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 24px 48px;
		flex: 1;
	}
	.g-serp-col {
		width: 652px;
		max-width: 100%;
		min-width: 0;
		padding-top: 16px;
	}
	.g-serp-side {
		width: 380px;
		flex-shrink: 0;
		padding-top: 16px;
	}
	@media (min-width: 1164px) {
		.g-serp-bar,
		.g-serp-tabsrow,
		.g-serp-body {
			padding-left: 180px;
		}
		.g-serp-logo {
			position: absolute;
			left: 24px;
			top: 32px;
			transform: translateY(-50%);
		}
	}

	.g-stats {
		font-size: 14px;
		color: var(--g-text-3);
		margin-bottom: 20px;
	}
	.g-dym {
		font-size: 14px;
		color: var(--g-text-2);
		margin-bottom: 18px;
	}
	.g-dym-link {
		color: var(--g-link);
		font-weight: 700;
		font-size: 14px;
	}
	.g-dym-link:hover {
		text-decoration: underline;
	}
	:global([data-theme='dark']) .g-dym-link {
		color: var(--g-blue);
	}

	/* Instant answers */
	.g-instant {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		padding: 16px 20px;
		margin-bottom: 24px;
	}
	.g-instant-title {
		font-size: 13px;
		color: var(--g-text-3);
	}
	.g-instant-value {
		font-size: clamp(26px, 6vw, 36px);
		line-height: 1.2;
		color: var(--g-text);
		margin: 4px 0;
	}
	.g-instant-detail {
		font-size: 14px;
		color: var(--g-text-2);
	}
	.g-instant-src {
		font-size: 12px;
		color: var(--g-text-3);
		margin-top: 8px;
	}

	/* AI Overview */
	.g-ai-card {
		border: 1px solid var(--g-border);
		border-radius: 16px;
		padding: 18px 20px;
		margin-bottom: 26px;
		background: linear-gradient(180deg, color-mix(in srgb, var(--g-blue) 7%, transparent), transparent 65%);
	}
	.g-ai-card.collapsed {
		padding: 14px 20px;
	}
	.g-ai-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}
	.g-ai-ico.lg {
		display: inline-flex;
	}
	.g-ai-title {
		font-size: 18px;
		font-weight: 500;
		color: var(--g-text);
	}
	.g-ai-badge {
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--g-blue) 14%, transparent);
		color: var(--g-blue);
	}
	.g-ai-head-actions {
		margin-left: auto;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.g-ai-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		font-size: 13px;
		color: var(--g-text-2);
	}
	.g-ai-action:hover {
		background: var(--g-hover);
		color: var(--g-text);
	}
	.g-ai-content {
		font-size: 16px;
		line-height: 1.65;
		color: var(--g-text);
	}
	:global(.g-ai-content .ai-p) {
		margin: 0 0 10px;
	}
	:global(.g-ai-content .ai-h3) {
		font-size: 16px;
		font-weight: 700;
		margin: 14px 0 6px;
		color: var(--g-text);
	}
	:global(.g-ai-content .ai-li) {
		margin: 0 0 6px 22px;
		list-style: disc;
	}
	:global(.g-ai-content .ai-cite) {
		color: var(--g-blue);
		font-size: 11px;
		padding: 0 2px;
		cursor: help;
	}
	.g-ai-sources {
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid var(--g-divider);
	}
	.g-ai-sources-label {
		display: block;
		font-size: 13px;
		color: var(--g-text-3);
		margin-bottom: 8px;
	}
	.g-ai-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.g-ai-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		background: var(--g-surface);
		font-size: 13px;
		color: var(--g-text-2);
	}
	.g-ai-chip:hover {
		background: var(--g-hover);
	}
	.g-ai-chip img {
		width: 16px;
		height: 16px;
		border-radius: 50%;
	}
	.g-shimmer {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 12px 0;
	}
	.g-shimmer span {
		height: 12px;
		border-radius: 6px;
		background: linear-gradient(90deg, var(--g-surface-2) 25%, var(--g-hover) 50%, var(--g-surface-2) 75%);
		background-size: 200% 100%;
		animation: g-shimmer 1.4s infinite;
	}
	.g-shimmer span:nth-child(1) { width: 92%; }
	.g-shimmer span:nth-child(2) { width: 78%; }
	.g-shimmer span:nth-child(3) { width: 60%; }
	@keyframes g-shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
	.g-ai-loading-text {
		font-size: 13px;
		color: var(--g-text-3);
	}

	/* Results */
	.g-results {
		display: flex;
		flex-direction: column;
	}
	.g-result {
		margin-bottom: 28px;
	}
	.g-src-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 6px;
	}
	.g-favicon-circle {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--g-surface-2);
		border: 1px solid var(--g-divider);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.g-favicon-circle.small {
		width: 20px;
		height: 20px;
	}
	.g-favicon-circle img {
		width: 16px;
		height: 16px;
		border-radius: 50%;
	}
	.g-favicon-circle.small img {
		width: 12px;
		height: 12px;
	}
	.g-src-lines {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.g-src-name {
		font-size: 14px;
		color: var(--g-text);
		line-height: 20px;
	}
	.g-src-url {
		font-size: 12px;
		color: var(--g-text-2);
		line-height: 16px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.g-result-title {
		font-size: 20px;
		font-weight: 400;
		line-height: 1.3;
		margin: 2px 0 4px;
	}
	.g-result-title a {
		color: var(--g-link);
	}
	.g-result-title a:hover {
		text-decoration: underline;
	}
	:global([data-theme='dark']) .g-result-title a {
		color: var(--g-blue);
	}
	.g-result-snippet {
		font-size: 14px;
		line-height: 1.58;
		color: var(--g-text-2);
		margin: 0;
	}
	.g-result-actions {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 10px;
		flex-wrap: wrap;
	}
	.g-link-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--g-blue);
		padding: 0;
	}
	.g-link-btn:hover {
		text-decoration: underline;
	}
	.g-result-rank {
		margin-left: auto;
		font-size: 12px;
		color: var(--g-text-3);
	}

	/* People also ask */
	.g-paa {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		margin: 0 0 28px;
		overflow: hidden;
	}
	.g-paa-title {
		font-size: 18px;
		font-weight: 400;
		color: var(--g-text);
		margin: 0;
		padding: 14px 18px;
		border-bottom: 1px solid var(--g-border);
	}
	.g-paa-item {
		border-bottom: 1px solid var(--g-border);
	}
	.g-paa-item:last-child {
		border-bottom: none;
	}
	.g-paa-question {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 14px 18px;
		font-size: 16px;
		color: var(--g-text);
		text-align: left;
	}
	.g-paa-question:hover {
		background: var(--g-hover);
	}
	.g-paa-question.open :global(svg) {
		transform: rotate(180deg);
	}
	.g-paa-answer {
		padding: 0 18px 16px;
	}
	.g-paa-answer p {
		font-size: 14px;
		line-height: 1.58;
		color: var(--g-text-2);
		margin: 0 0 12px;
	}
	.g-paa-answer-actions {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
	}
	.g-paa-source {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--g-text-2);
	}

	/* Related searches */
	.g-related {
		margin: 34px 0 24px;
	}
	.g-related-title {
		font-size: 20px;
		font-weight: 400;
		color: var(--g-text);
		margin: 0 0 16px;
	}
	.g-related-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	.g-related-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border: 1px solid var(--g-border);
		border-radius: 8px;
		background: var(--g-surface);
		font-size: 14px;
		color: var(--g-text);
		text-align: left;
	}
	.g-related-item:hover {
		box-shadow: 0 1px 6px rgba(32, 33, 36, 0.18);
	}
	.g-related-ico {
		display: inline-flex;
		color: var(--g-text-3);
	}
	.g-related-text {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Pagination */
	.g-pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin: 38px 0 12px;
	}
	.g-pages {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.g-page-link,
	.g-page-current {
		font-size: 14px;
	}
	.g-page-link {
		color: var(--g-link);
	}
	.g-page-link:hover {
		text-decoration: underline;
	}
	:global([data-theme='dark']) .g-page-link {
		color: var(--g-blue);
	}
	.g-page-current {
		color: var(--g-text);
		font-weight: 700;
	}
	.g-next {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--g-link);
	}
	:global([data-theme='dark']) .g-next {
		color: var(--g-blue);
	}
	.g-next:hover {
		text-decoration: underline;
	}

	/* Category views */
	.g-cat-heading {
		font-size: 20px;
		font-weight: 400;
		color: var(--g-text);
		margin: 0 0 16px;
	}
	.g-images {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 12px;
	}
	.g-image {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.g-image img {
		width: 100%;
		height: 130px;
		object-fit: cover;
		border-radius: 8px;
		background: var(--g-surface-2);
	}
	.g-image:hover img {
		box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
	}
	.g-image-caption {
		font-size: 12px;
		color: var(--g-text-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.g-videos {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.g-video {
		display: flex;
		gap: 16px;
	}
	.g-video-thumb {
		position: relative;
		width: 190px;
		height: 106px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--g-surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.g-video-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.g-video-placeholder {
		color: var(--g-text-3);
	}
	.g-video-badge {
		position: absolute;
		left: 6px;
		bottom: 6px;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 4px;
	}
	.g-video-meta {
		min-width: 0;
	}
	.g-maps {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 24px;
	}
	.g-maps iframe {
		width: 100%;
		height: 380px;
		border: 0;
		display: block;
	}
	.g-maps-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding: 12px 16px;
		background: var(--g-surface-2);
		font-size: 13px;
		color: var(--g-text-2);
	}

	/* Knowledge panel */
	.g-kp {
		border: 1px solid var(--g-border);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 20px;
	}
	.g-kp-image {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.g-kp-title {
		font-size: 20px;
		font-weight: 400;
		color: var(--g-text);
		margin: 0 0 4px;
	}
	.g-kp-sub {
		font-size: 12px;
		color: var(--g-text-3);
		margin-bottom: 10px;
	}
	.g-kp-desc {
		font-size: 14px;
		line-height: 1.55;
		color: var(--g-text-2);
		margin: 0 0 12px;
	}
	.g-kp-attributes {
		display: flex;
		flex-direction: column;
	}
	.g-kp-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
		border-top: 1px solid var(--g-divider);
		font-size: 14px;
	}
	.g-kp-key {
		color: var(--g-text-3);
	}
	.g-kp-value {
		color: var(--g-text);
		text-align: right;
	}
	.g-kp-footer {
		border-top: 1px solid var(--g-divider);
		padding-top: 12px;
		font-size: 14px;
	}
	.g-kp-note {
		border-style: dashed;
	}
	.g-ai-pill-note {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 13px;
		color: var(--g-text-2);
		line-height: 1.5;
	}

	/* Loading & empty */
	.g-loading {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 24px 0;
		color: var(--g-text-2);
		font-size: 14px;
	}
	.g-spinner {
		width: 22px;
		height: 22px;
		border: 3px solid var(--g-divider);
		border-top-color: var(--g-blue);
		border-radius: 50%;
		animation: g-spin 0.8s linear infinite;
	}
	@keyframes g-spin {
		to { transform: rotate(360deg); }
	}
	.g-empty {
		padding: 12px 0 24px;
	}
	.g-empty h3 {
		font-size: 18px;
		font-weight: 400;
		color: var(--g-text);
		margin: 0 0 12px;
	}
	.g-empty ul {
		margin: 0;
		padding-left: 20px;
		color: var(--g-text-2);
		font-size: 14px;
		line-height: 1.7;
	}

	.g-serif-footer {
		background: var(--g-footer-bg);
		color: var(--g-text-3);
		font-size: 14px;
	}
	.g-serif-footer-region,
	.g-serif-footer-links {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}
	.g-serif-footer-region {
		height: 44px;
		padding: 0 24px 0 180px;
		border-bottom: 1px solid var(--g-border);
	}
	.g-serif-footer-links {
		height: 44px;
		padding: 0 24px 0 180px;
	}
	.g-serif-footer-left,
	.g-serif-footer-right {
		display: flex;
		align-items: center;
		gap: 28px;
		flex-wrap: wrap;
	}
	.g-serif-footer a:hover {
		text-decoration: underline;
	}
	.g-serif-footer-tag {
		font-size: 13px;
	}
	@media (max-width: 1163px) {
		.g-serif-footer-region,
		.g-serif-footer-links {
			padding-left: 24px;
		}
	}

	/* Dialogs */
	.g-scrim {
		position: fixed;
		inset: 0;
		background: rgba(32, 33, 36, 0.6);
		z-index: 200;
	}
	.g-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(92vw, 460px);
		background: var(--g-surface);
		border-radius: 8px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
		padding: 24px;
		z-index: 210;
	}
	.g-modal h3 {
		margin: 0 0 10px;
		font-size: 18px;
		font-weight: 500;
		color: var(--g-text);
	}
	.g-modal-desc {
		font-size: 14px;
		line-height: 1.55;
		color: var(--g-text-2);
		margin: 0 0 16px;
	}
	.g-signals {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 20px;
	}
	.g-signal-row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: var(--g-text-2);
	}
	.g-signal-row strong {
		color: var(--g-text);
	}
	.g-signal-bar {
		height: 6px;
		border-radius: 3px;
		background: var(--g-surface-2);
		overflow: hidden;
		margin-bottom: 6px;
	}
	.g-signal-bar span {
		display: block;
		height: 100%;
		background: var(--g-blue);
	}
	.g-url-box {
		background: var(--g-surface-2);
		border-radius: 4px;
		padding: 10px 12px;
		font-family: monospace;
		font-size: 12px;
		color: var(--g-text-2);
		word-break: break-all;
		margin-bottom: 20px;
	}
	.g-modal-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8px;
	}
	.g-btn-text {
		padding: 8px 14px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		color: var(--g-blue);
	}
	.g-btn-text:hover {
		background: color-mix(in srgb, var(--g-blue) 10%, transparent);
	}
	.g-btn-filled {
		padding: 8px 18px;
		border-radius: 4px;
		background: var(--g-blue);
		color: #fff;
		font-size: 14px;
		font-weight: 500;
	}
	.g-btn-filled:hover {
		background: var(--g-blue-hover);
	}

	/* Responsive */
	@media (max-width: 1020px) {
		.g-serp-body {
			flex-direction: column;
			gap: 8px;
		}
		.g-serp-col,
		.g-serp-side {
			width: 100%;
		}
		.g-kp {
			max-width: 652px;
		}
	}
	@media (max-width: 800px) {
		.g-serp-bar {
			height: 56px;
			gap: 12px;
			padding: 0 12px;
		}
		.g-serp-tabsrow {
			padding: 0 8px;
		}
		.g-serp-body {
			padding: 0 14px 40px;
		}
		.g-serp-actions .g-ai-pill span:last-child,
		.g-serp-actions .g-icon-btn {
			display: none;
		}
		.g-related-grid {
			grid-template-columns: 1fr;
		}
		.g-result-title {
			font-size: 18px;
		}
		.g-video {
			flex-direction: column;
		}
		.g-video-thumb {
			width: 100%;
			height: 170px;
		}
		.g-home-main {
			padding-bottom: 60px;
		}
		.g-home-footer-region,
		.g-home-footer-links {
			padding: 12px 16px;
			height: auto;
		}
		.g-serif-footer-region,
		.g-serif-footer-links {
			height: auto;
			padding: 12px 14px;
		}
		.g-tools-panel {
			padding: 12px 14px;
		}
	}
</style>
