import { json } from '@sveltejs/kit';
import { telemetry } from '$lib/server/metrics';

interface SearchResultItem {
	title: string;
	url: string;
	domain: string;
	snippet: string;
	source: string;
	score: number;
	lang?: string;
	imageUrl?: string;
	publishedDate?: string;
	signals: {
		bm25: number;
		authority: number;
		freshness: number;
		explanation: string;
	};
}

interface KnowledgePanelData {
	title: string;
	subtitle: string;
	description: string;
	thumbnail?: string;
	attributes: [string, string][];
	sourceUrl: string;
}

const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const WIKIMEDIA_USER_AGENT = 'SandhanSearch/1.0 (https://sandhan.site; team@sandhan.site)';

// In-Memory Search Cache (10-minute TTL)
interface PoolCacheEntry {
	webResults: SearchResultItem[];
	totalHits: number;
	timestamp: number;
}
const SEARCH_POOL_CACHE = new Map<string, PoolCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

function getPoolFromCache(key: string): PoolCacheEntry | null {
	const entry = SEARCH_POOL_CACHE.get(key);
	if (!entry) return null;
	if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
		SEARCH_POOL_CACHE.delete(key);
		return null;
	}
	return entry;
}

function setPoolToCache(key: string, webResults: SearchResultItem[], totalHits: number) {
	if (SEARCH_POOL_CACHE.size >= MAX_CACHE_ENTRIES) {
		const firstKey = SEARCH_POOL_CACHE.keys().next().value;
		if (firstKey) SEARCH_POOL_CACHE.delete(firstKey);
	}
	SEARCH_POOL_CACHE.set(key, { webResults, totalHits, timestamp: Date.now() });
}

function cleanDDGUrl(rawUrl: string): string {
	if (!rawUrl) return '';
	if (rawUrl.includes('uddg=')) {
		const parts = rawUrl.split('uddg=');
		if (parts[1]) {
			const decoded = decodeURIComponent(parts[1].split('&')[0]);
			return decoded;
		}
	}
	if (rawUrl.startsWith('//')) {
		return 'https:' + rawUrl;
	}
	return rawUrl;
}

function extractDomain(url: string): string {
	try {
		const u = new URL(url);
		return u.hostname.replace(/^www\./, '');
	} catch (_) {
		return 'web';
	}
}

function stripHtml(html: string): string {
	if (!html) return '';
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.trim();
}

function computeTermRelevance(query: string, title: string, snippet: string): number {
	// Clean punctuation from tokens so that "AI?" matches "AI", '"sandhan"' matches "sandhan", 'tcp/ip' matches 'tcp' and 'ip'
	const cleanQuery = query.replace(/["'?,.;:!()[\]{}<>`~@#$%^&*+=_\-|\\/]/g, ' ');
	const qTerms = cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);
	if (qTerms.length === 0) {
		const raw = query.trim().toLowerCase();
		if ((title || '').toLowerCase().includes(raw) || (snippet || '').toLowerCase().includes(raw)) {
			return 0.9;
		}
		return 0.5;
	}
	const titleLow = (title || '').toLowerCase();
	const snippetLow = (snippet || '').toLowerCase();
	let matches = 0;
	for (const term of qTerms) {
		if (titleLow.includes(term)) matches += 2;
		if (snippetLow.includes(term)) matches += 1;
	}
	const ratio = matches / (qTerms.length * 3);
	return parseFloat(Math.min(0.99, Math.max(0.35, 0.4 + ratio * 0.55)).toFixed(2));
}

const SPECIAL_QUERY_EXPANSIONS: Record<string, string> = {
	'?': 'Question mark',
	'??': 'Question mark',
	'???': 'Question mark',
	'/': 'Slash punctuation',
	'//': 'Slash punctuation',
	'"': 'Quotation mark',
	'""': 'Double quotation marks',
	'"""': 'Triple quotation marks',
	'!': 'Exclamation mark',
	'@': 'At sign',
	'#': 'Number sign hashtag',
	'$': 'Dollar sign',
	'%': 'Percent sign',
	'&': 'Ampersand',
	'*': 'Asterisk'
};

const TYPO_MAP: Record<string, string> = {
	'বাংলদেশ': 'বাংলাদেশ',
	'রবিন্দ্রনাথ': 'রবীন্দ্রনাথ',
	'ভাসা': 'ভাষা',
	'গিতাঞ্জলি': 'গীতাঞ্জলি',
	'মুক্তিযুধ': 'মুক্তিযুদ্ধ',
	'নবেল': 'নোবেল',
	'পদমা সেতু': 'পদ্মা সেতু',
	'ঢকা শহর': 'ঢাকা শহর'
};

export const GET = async ({ url }: { url: URL }) => {
	const startTime = Date.now();
	const query = url.searchParams.get('q')?.trim() || '';
	const category = url.searchParams.get('category')?.toLowerCase() || 'all';
	const lang = url.searchParams.get('lang')?.toLowerCase() || 'bn';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
	const pageSize = 10;

	if (!query) {
		return json({
			query: '',
			page: 1,
			pageSize,
			totalPages: 0,
			hasMore: false,
			results: [],
			total: 0
		});
	}

	const poolKey = `${query.toLowerCase()}|${category}|${lang}`;
	const cachedPool = getPoolFromCache(poolKey);

	const didYouMean = page === 1 ? TYPO_MAP[query] || undefined : undefined;
	let knowledge: KnowledgePanelData | undefined;

	// Determine regional parameters based on selected search language
	let ddgKl = 'wt-wt';
	let acceptLang = 'en-US,en;q=0.9';
	let primaryWikiLang = 'en';

	if (lang === 'bn') {
		ddgKl = 'bd-bn';
		acceptLang = 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7';
		primaryWikiLang = 'bn';
	} else if (lang === 'hi') {
		ddgKl = 'in-hi';
		acceptLang = 'hi-IN,hi;q=0.9,en-US;q=0.7,en;q=0.6';
		primaryWikiLang = 'hi';
	} else {
		ddgKl = 'us-en';
		acceptLang = 'en-US,en;q=0.9';
		primaryWikiLang = 'en';
	}

	// 1. Real Image Search via Wikimedia Commons when category === 'images'
	if (category === 'images') {
		const imgResults: SearchResultItem[] = [];
		try {
			const imgOffset = (page - 1) * pageSize;
			const imgSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=12&gsroffset=${imgOffset}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
			const imgRes = await fetch(imgSearchUrl, {
				headers: { 'User-Agent': WIKIMEDIA_USER_AGENT }
			});
			if (imgRes.ok) {
				const imgData = await imgRes.json();
				const pages = imgData?.query?.pages || {};
				let idx = 0;
				for (const pageId of Object.keys(pages)) {
					const p = pages[pageId];
					const imgInfo = p.imageinfo?.[0];
					if (imgInfo && imgInfo.url) {
						const cleanTitle = (p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
						imgResults.push({
							title: cleanTitle,
							url: imgInfo.descriptionurl || imgInfo.url,
							domain: 'commons.wikimedia.org',
							snippet: `${cleanTitle} — ${imgInfo.mime || 'image/jpeg'} (${imgInfo.width}x${imgInfo.height})`,
							source: 'Wikimedia Commons',
							score: parseFloat((0.95 - idx * 0.04).toFixed(2)),
							imageUrl: imgInfo.url,
							signals: {
								bm25: 0.9,
								authority: 0.99,
								freshness: 0.85,
								explanation: 'Wikimedia Commons উন্মুক্ত মিডিয়া রিপোজিটরি'
							}
						});
						idx++;
					}
				}
			}
		} catch (err) {
			console.warn('Wikimedia image search error:', err);
		}

		const totalEst = Math.max(imgResults.length * 10, page * 10 + (imgResults.length >= 5 ? 50 : 0));
		const totalPages = Math.max(1, Math.min(10, Math.ceil(totalEst / pageSize)));

		return json({
			query,
			category,
			lang,
			page,
			pageSize,
			totalPages,
			hasMore: page < totalPages,
			results: imgResults,
			total: totalEst
		});
	}

	// 2. Standard Search Results (Multi-source with real pagination per page)
	const pageResults: SearchResultItem[] = [];
	const seenUrls = new Set<string>();

	const addPageResult = (item: SearchResultItem) => {
		if (!item.url || !item.title) return;
		const clean = item.url.replace(/\/$/, '').toLowerCase();
		if (seenUrls.has(clean)) return;
		seenUrls.add(clean);
		pageResults.push(item);
	};

	let totalHitsCount = 0;

	// Check if we have cached pool for this query
	if (cachedPool && cachedPool.webResults.length > 0) {
		totalHitsCount = cachedPool.totalHits;
		const startIndex = (page - 1) * pageSize;
		const endIndex = page * pageSize;
		const slice = cachedPool.webResults.slice(startIndex, endIndex);
		for (const item of slice) {
			addPageResult(item);
		}
	}

	// If pageResults are fewer than pageSize, fetch live data for this specific page offset
	if (pageResults.length < pageSize) {
		const rawCollectedPool: SearchResultItem[] = [];
		const poolSeen = new Set<string>();
		const addToRawPool = (item: SearchResultItem) => {
			if (!item.url || !item.title) return;
			const clean = item.url.replace(/\/$/, '').toLowerCase();
			if (poolSeen.has(clean)) return;
			poolSeen.add(clean);
			rawCollectedPool.push(item);
		};

		// Step A: DuckDuckGo HTML (fetches initial batch on page 1 or when pool empty)
		if (page === 1 && (!cachedPool || cachedPool.webResults.length === 0)) {
			try {
				const ddgQuery = category === 'news' ? `${query} news` : category === 'videos' ? `${query} video` : query;
				const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(ddgQuery)}&kl=${encodeURIComponent(ddgKl)}`;

				const ddgRes = await fetch(ddgUrl, {
					headers: {
						'User-Agent': BROWSER_USER_AGENT,
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						'Accept-Language': acceptLang
					}
				});

				if (ddgRes.ok) {
					const html = await ddgRes.text();
					const isBlocked =
						html.includes('challenge-form') ||
						html.includes('anomaly-modal') ||
						html.includes('cc=botnet') ||
						html.includes('anomaly-modal__submit');

					if (!isBlocked && html.includes('result results_links')) {
						const resultBlocks = html.split(/<div class="result results_links/gi);
						let idx = 0;
						for (let i = 1; i < resultBlocks.length && idx < 30; i++) {
							const block = resultBlocks[i];
							const aMatch = block.match(
								/<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
							);
							const sMatch = block.match(
								/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i
							);

							if (aMatch) {
								const directUrl = cleanDDGUrl(aMatch[1]);
								const title = stripHtml(aMatch[2]);
								const snippet = sMatch ? stripHtml(sMatch[1]) : '';
								const domain = extractDomain(directUrl);

								if (
									title &&
									directUrl &&
									!directUrl.includes('duckduckgo.com/y.js') &&
									!directUrl.includes('ad_provider')
								) {
									const bm25 = computeTermRelevance(query, title, snippet);
									const authority =
										domain.includes('wikipedia') ||
										domain.includes('.edu') ||
										domain.includes('.gov') ||
										domain.includes('.ac.bd')
											? 0.98
											: 0.82;
									const freshness = 0.85;
									const score = parseFloat(
										(bm25 * 0.55 + authority * 0.35 + freshness * 0.1 - idx * 0.015).toFixed(3)
									);

									let explanation = `Web search match ${(bm25 * 100).toFixed(0)}% from ${domain}`;
									if (lang === 'bn') {
										explanation = `ওয়েব সার্চ প্রাসঙ্গিকতা ${(bm25 * 100).toFixed(0)}% (${domain})`;
									} else if (lang === 'hi') {
										explanation = `कीवर्ड प्रासंगिकता ${(bm25 * 100).toFixed(0)}% (${domain})`;
									}

									addToRawPool({
										title,
										url: directUrl,
										domain,
										snippet,
										source: domain,
										score: Math.max(0.2, score),
										lang,
										imageUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
										signals: {
											bm25,
											authority,
											freshness,
											explanation
										}
									});
									idx++;
								}
							}
						}
					}
				}
			} catch (err) {
				console.warn('DDG HTML search error:', err);
			}

			// Step B: DuckDuckGo Lite POST Fallback
			if (rawCollectedPool.length < 5) {
				try {
					const liteBody = new URLSearchParams({ q: query, kl: ddgKl });
					const liteRes = await fetch('https://lite.duckduckgo.com/lite/', {
						method: 'POST',
						headers: {
							'User-Agent': BROWSER_USER_AGENT,
							'Content-Type': 'application/x-www-form-urlencoded',
							'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
							'Accept-Language': acceptLang
						},
						body: liteBody.toString()
					});

					if (liteRes.ok) {
						const liteHtml = await liteRes.text();
						if (!liteHtml.includes('anomaly-modal') && liteHtml.includes('class=\'result-link\'')) {
							const linkMatches = Array.from(
								liteHtml.matchAll(
									/<a[^>]+class=['"]result-link['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi
								)
							);
							const snippetMatches = Array.from(
								liteHtml.matchAll(/<td[^>]+class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)
							);

							for (let i = 0; i < linkMatches.length && i < 25; i++) {
								const directUrl = cleanDDGUrl(linkMatches[i][1]);
								const title = stripHtml(linkMatches[i][2]);
								const snippet = snippetMatches[i] ? stripHtml(snippetMatches[i][1]) : '';
								const domain = extractDomain(directUrl);

								if (title && directUrl && !directUrl.includes('duckduckgo.com/y.js')) {
									const bm25 = computeTermRelevance(query, title, snippet);
									const authority =
										domain.includes('wikipedia') ||
										domain.includes('.edu') ||
										domain.includes('.gov') ||
										domain.includes('.ac.bd')
											? 0.98
											: 0.82;
									const freshness = 0.85;
									const score = parseFloat(
										(bm25 * 0.55 + authority * 0.35 + freshness * 0.1 - i * 0.015).toFixed(3)
									);

									let explanation = `Web search relevance ${(bm25 * 100).toFixed(0)}% from ${domain}`;
									if (lang === 'bn') {
										explanation = `ওয়েব সার্চ প্রাসঙ্গিকতা ${(bm25 * 100).toFixed(0)}% (${domain})`;
									} else if (lang === 'hi') {
										explanation = `वेब सर्च प्रासंगिकता ${(bm25 * 100).toFixed(0)}% (${domain})`;
									}

									addToRawPool({
										title,
										url: directUrl,
										domain,
										snippet,
										source: domain,
										score: Math.max(0.2, score),
										lang,
										imageUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
										signals: {
											bm25,
											authority,
											freshness,
											explanation
										}
									});
								}
							}
						}
					}
				} catch (err) {
					console.warn('DDG Lite fallback error:', err);
				}
			}

			// Step C: DuckDuckGo Instant API (on page 1 only)
			if (rawCollectedPool.length < 5) {
				try {
					const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`;
					const ddgApiRes = await fetch(ddgApiUrl, {
						headers: { 'User-Agent': BROWSER_USER_AGENT }
					});
					if (ddgApiRes.ok) {
						const apiData = await ddgApiRes.json();
						if (apiData.AbstractURL && apiData.Heading) {
							const domain = extractDomain(apiData.AbstractURL);
							addToRawPool({
								title: apiData.Heading,
								url: apiData.AbstractURL,
								domain,
								snippet: apiData.AbstractText || `${apiData.Heading} — ${apiData.AbstractSource || 'DuckDuckGo Instant Answer'}`,
								source: apiData.AbstractSource || domain,
								score: 0.95,
								lang,
								imageUrl: apiData.Image ? `https://duckduckgo.com${apiData.Image}` : `https://icons.duckduckgo.com/ip3/${domain}.ico`,
								signals: {
									bm25: 0.95,
									authority: 0.99,
									freshness: 0.9,
									explanation: 'তাৎক্ষণিক তথ্য ও জ্ঞানকোষ (Instant Knowledge Result)'
								}
							});
						}

						const topics = apiData.RelatedTopics || [];
						for (const item of topics) {
							if (item.FirstURL && item.Text) {
								const domain = extractDomain(item.FirstURL);
								addToRawPool({
									title: item.Text.split(' - ')[0] || item.Text.slice(0, 60),
									url: item.FirstURL,
									domain,
									snippet: item.Text,
									source: domain,
									score: 0.88,
									lang,
									imageUrl: item.Icon?.URL ? `https://duckduckgo.com${item.Icon.URL}` : `https://icons.duckduckgo.com/ip3/${domain}.ico`,
									signals: {
										bm25: 0.88,
										authority: 0.95,
										freshness: 0.85,
										explanation: 'প্রাসঙ্গিক বিষয়বস্তু (Related Topic Match)'
									}
								});
							}
						}
					}
				} catch (err) {
					console.warn('DDG API search error:', err);
				}
			}

			if (rawCollectedPool.length > 0) {
				setPoolToCache(poolKey, rawCollectedPool, Math.max(rawCollectedPool.length * 10, 50));
				for (const item of rawCollectedPool.slice(0, pageSize)) {
					addPageResult(item);
				}
			}
		}

		// Step D: Fetch Wikipedia & Wiktionary with EXACT page offset (sroffset = (page - 1) * 10)
		if (pageResults.length < pageSize) {
			const fetchWikiList = async (wikiLang: string, endpoint = 'wikipedia.org', customQuery?: string) => {
				try {
					const targetQuery = customQuery || query;
					const wikiOffset = (page - 1) * pageSize;
					const wikiDomain = `${wikiLang}.${endpoint}`;
					const wikiSearchUrl = `https://${wikiDomain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(targetQuery)}&sroffset=${wikiOffset}&srlimit=10&utf8=&format=json&origin=*`;
					const wikiRes = await fetch(wikiSearchUrl, {
						headers: { 'User-Agent': WIKIMEDIA_USER_AGENT }
					});
					if (wikiRes.ok) {
						const wikiData = await wikiRes.json();
						const searchList = wikiData?.query?.search || [];
						const totalHits = wikiData?.query?.searchinfo?.totalhits || 0;
						if (totalHits > totalHitsCount) {
							totalHitsCount = totalHits;
						}

						for (const item of searchList) {
							const cleanTitle = item.title;
							const cleanSnippet = stripHtml(item.snippet);
							const bm25 = computeTermRelevance(query, cleanTitle, cleanSnippet);

							const sourceLabel =
								wikiDomain === 'bn.wikipedia.org'
									? 'উইকিপিডিয়া (বাংলা)'
									: wikiDomain === 'hi.wikipedia.org'
										? 'विकिपीडिया (हिन्दी)'
										: wikiDomain === 'bn.wiktionary.org'
											? 'উইকিঅভিধান (বাংলা)'
											: 'Wikipedia (English)';

							addPageResult({
								title: cleanTitle,
								url: `https://${wikiDomain}/wiki/${encodeURIComponent(cleanTitle)}`,
								domain: wikiDomain,
								snippet: cleanSnippet,
								source: sourceLabel,
								score: 0.85,
								lang,
								imageUrl: `https://icons.duckduckgo.com/ip3/${wikiDomain}.ico`,
								signals: {
									bm25,
									authority: 0.99,
									freshness: 0.85,
									explanation:
										lang === 'bn'
											? `${sourceLabel} প্রাসঙ্গিকতা ${(bm25 * 100).toFixed(0)}%`
											: `Wikipedia keyword relevance ${(bm25 * 100).toFixed(0)}%`
								}
							});
						}
					}
				} catch (e) {
					console.warn(`Wiki query error for ${wikiLang}:`, e);
				}
			};

			// Query primary language Wikipedia for this page
			await fetchWikiList(primaryWikiLang, 'wikipedia.org');

			// If Bengali and still sparse, search Wiktionary and English Wikipedia for this page
			if (pageResults.length < 5 && primaryWikiLang === 'bn') {
				await fetchWikiList('bn', 'wiktionary.org');
				await fetchWikiList('en', 'wikipedia.org');
			}

			// If punctuation expansion exists and sparse results, query expansion
			if (pageResults.length < 3 && SPECIAL_QUERY_EXPANSIONS[query]) {
				await fetchWikiList('en', 'wikipedia.org', SPECIAL_QUERY_EXPANSIONS[query]);
			}
		}
	}

	// 3. Knowledge Panel (Loaded on page 1 only)
	if (page === 1) {
		try {
			const fetchWikiPanel = async (wikiLang: string) => {
				const wikiSearchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=1`;
				const wikiRes = await fetch(wikiSearchUrl, {
					headers: { 'User-Agent': WIKIMEDIA_USER_AGENT }
				});
				if (!wikiRes.ok) return null;
				const wikiData = await wikiRes.json();
				const topWiki = wikiData?.query?.search?.[0];

				if (topWiki) {
					// Verify that topWiki title is semantically relevant to query subject
					const qClean = query.toLowerCase().replace(/["'?,.;:!()[\]{}<>`~@#$%^&*+=_\-|\\/]/g, ' ').trim();
					const qWords = qClean.split(/\s+/).filter(w => !['কত', 'কি', 'কী', 'কেন', 'কোথায়', 'কখন', 'কে', 'কার', 'কোন', 'how', 'what', 'why', 'who', 'where', 'when', 'is', 'are', 'the', 'a', 'an'].includes(w));
					const titleLow = (topWiki.title || '').toLowerCase();
					const isRelevant = qWords.length === 0 || qWords.some(w => titleLow.includes(w) || w.includes(titleLow));
					if (!isRelevant) return null;

					const sumUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topWiki.title)}`;
					const sumRes = await fetch(sumUrl, {
						headers: { 'User-Agent': WIKIMEDIA_USER_AGENT }
					});
					if (sumRes.ok) {
						const sumData = await sumRes.json();
						if (sumData.extract && sumData.type !== 'disambiguation') {
							const sourceLabel =
								wikiLang === 'bn'
									? 'বাংলা উইকিপিডিয়া'
									: wikiLang === 'hi'
										? 'हिन्दी विकिपीडिया'
										: 'English Wikipedia';
							const subLabel =
								wikiLang === 'bn'
									? 'উইকিপিডিয়া উন্মুক্ত জ্ঞানকোষ'
									: wikiLang === 'hi'
										? 'विकिपीडिया मुक्त ज्ञानकोश'
										: 'Wikipedia Knowledge Base';

							return {
								title: sumData.title,
								subtitle: sumData.description || subLabel,
								description: sumData.extract,
								thumbnail: sumData.thumbnail?.source,
								attributes: [
									[wikiLang === 'bn' ? 'উৎস' : wikiLang === 'hi' ? 'स्रोत' : 'Source', sourceLabel],
									[
										wikiLang === 'bn' ? 'পৃষ্ঠা আইডি' : wikiLang === 'hi' ? 'पेজ আইডি' : 'Page ID',
										sumData.pageid?.toString() || '—'
									],
									[wikiLang === 'bn' ? 'লাইসেন্স' : wikiLang === 'hi' ? 'লাइसेंस' : 'License', 'CC BY-SA 4.0']
								] as [string, string][],
								sourceUrl:
									sumData.content_urls?.desktop?.page ||
									`https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(topWiki.title)}`
							};
						}
					}
				}
				return null;
			};

			knowledge = (await fetchWikiPanel(primaryWikiLang)) || undefined;

			if (!knowledge && primaryWikiLang !== 'en') {
				knowledge = (await fetchWikiPanel('en')) || undefined;
			}
		} catch (err) {
			console.warn('Knowledge panel error:', err);
		}
	}

	// Calculate pagination limits
	const totalEst = Math.max(
		totalHitsCount,
		pageResults.length * 10,
		page * 10 + (pageResults.length >= 5 ? 50 : 0)
	);
	const totalPages = Math.max(1, Math.min(10, Math.ceil(totalEst / pageSize)));
	const hasMore = page < totalPages;

	const durationMs = Date.now() - startTime;
	telemetry.recordQuery({
		query,
		category,
		lang,
		engine: 'DuckDuckGo + Wikipedia Cascade',
		resultsCount: pageResults.length,
		durationMs,
		cached: Boolean(cachedPool)
	});

	return json({
		query,
		category,
		lang,
		page,
		pageSize,
		totalPages,
		hasMore,
		results: pageResults.slice(0, pageSize),
		knowledge,
		didYouMean,
		total: totalEst
	});
};
