import { json } from '@sveltejs/kit';

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

function cleanDDGUrl(rawUrl: string): string {
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
	const qTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (qTerms.length === 0) return 0.5;
	const titleLow = title.toLowerCase();
	const snippetLow = snippet.toLowerCase();
	let matches = 0;
	for (const term of qTerms) {
		if (titleLow.includes(term)) matches += 2;
		if (snippetLow.includes(term)) matches += 1;
	}
	const ratio = matches / (qTerms.length * 3);
	return parseFloat(Math.min(0.99, Math.max(0.35, 0.4 + ratio * 0.55)).toFixed(2));
}

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

	const didYouMean = page === 1 ? (TYPO_MAP[query] || undefined) : undefined;
	const results: SearchResultItem[] = [];
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
		try {
			const imgOffset = (page - 1) * pageSize;
			const imgSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=12&gsroffset=${imgOffset}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
			const imgRes = await fetch(imgSearchUrl);
			if (imgRes.ok) {
				const imgData = await imgRes.json();
				const pages = imgData?.query?.pages || {};
				let idx = 0;
				for (const pageId of Object.keys(pages)) {
					const p = pages[pageId];
					const imgInfo = p.imageinfo?.[0];
					if (imgInfo && imgInfo.url) {
						const cleanTitle = (p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
						results.push({
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
	} else {
		// 2. DuckDuckGo Deep Web Search with Offset
		try {
			const ddgOffset = (page - 1) * 30;
			const ddgQuery = category === 'news' ? `${query} news` : category === 'videos' ? `${query} video` : query;
			
			let ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(ddgQuery)}&kl=${encodeURIComponent(ddgKl)}`;
			if (ddgOffset > 0) {
				ddgUrl += `&s=${ddgOffset}`;
			}
			
			const ddgRes = await fetch(ddgUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': acceptLang
				}
			});

			if (ddgRes.ok) {
				const html = await ddgRes.text();
				const resultBlocks = html.split(/<div class="result results_links/gi);

				let idx = 0;
				for (let i = 1; i < resultBlocks.length && idx < 20; i++) {
					const block = resultBlocks[i];
					const aMatch = block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
					const sMatch = block.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

					if (aMatch) {
						const directUrl = cleanDDGUrl(aMatch[1]);
						const title = stripHtml(aMatch[2]);
						const snippet = sMatch ? stripHtml(sMatch[1]) : '';
						const domain = extractDomain(directUrl);

						if (title && directUrl && !directUrl.includes('duckduckgo.com/y.js') && !directUrl.includes('ad_provider')) {
							const bm25 = computeTermRelevance(query, title, snippet);
							const authority = domain.includes('wikipedia') || domain.includes('.edu') || domain.includes('.gov') || domain.includes('.ac.bd') ? 0.98 : 0.82;
							const freshness = 0.85;
							const score = parseFloat(((bm25 * 0.55 + authority * 0.35 + freshness * 0.10) - (idx * 0.015)).toFixed(3));
							
							let explanation = `Keyword relevance match ${(bm25 * 100).toFixed(0)}% from ${domain}`;
							if (lang === 'bn') {
								explanation = `কিওয়ার্ড প্রাসঙ্গিকতা ${(bm25 * 100).toFixed(0)}% (${domain})`;
							} else if (lang === 'hi') {
								explanation = `कीवर्ड प्रासंगिकता ${(bm25 * 100).toFixed(0)}% (${domain})`;
							}

							results.push({
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
		} catch (err) {
			console.warn('Global web search error:', err);
		}

		// 3. Fetch Wikipedia Deep Search Results for additional depth
		if (results.length < pageSize) {
			try {
				const wikiOffset = (page - 1) * pageSize;
				const wikiDomain = primaryWikiLang === 'bn' ? 'bn.wikipedia.org' : primaryWikiLang === 'hi' ? 'hi.wikipedia.org' : 'en.wikipedia.org';
				const wikiSearchUrl = `https://${wikiDomain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&sroffset=${wikiOffset}&srlimit=10&utf8=&format=json&origin=*`;
				const wikiRes = await fetch(wikiSearchUrl);
				if (wikiRes.ok) {
					const wikiData = await wikiRes.json();
					const searchList = wikiData?.query?.search || [];
					for (const item of searchList) {
						if (!results.some(r => r.title === item.title)) {
							const cleanTitle = item.title;
							const cleanSnippet = stripHtml(item.snippet);
							const bm25 = computeTermRelevance(query, cleanTitle, cleanSnippet);

							results.push({
								title: cleanTitle,
								url: `https://${wikiDomain}/wiki/${encodeURIComponent(cleanTitle)}`,
								domain: wikiDomain,
								snippet: cleanSnippet,
								source: primaryWikiLang === 'bn' ? 'উইকিপিডিয়া (বাংলা)' : primaryWikiLang === 'hi' ? 'विकिपीडिया (हिन्दी)' : 'Wikipedia (English)',
								score: 0.85,
								lang,
								imageUrl: `https://icons.duckduckgo.com/ip3/${wikiDomain}.ico`,
								signals: {
									bm25,
									authority: 0.99,
									freshness: 0.85,
									explanation: lang === 'bn' ? `উইকিপিডিয়া প্রাসঙ্গিকতা ${(bm25 * 100).toFixed(0)}%` : `Wikipedia keyword relevance ${(bm25 * 100).toFixed(0)}%`
								}
							});
						}
					}
				}
			} catch (_) {}
		}
	}

	// 4. Knowledge Panel (Loaded on page 1 only)
	if (page === 1) {
		try {
			const fetchWikiPanel = async (wikiLang: string) => {
				const wikiSearchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=1`;
				const wikiRes = await fetch(wikiSearchUrl);
				if (!wikiRes.ok) return null;
				const wikiData = await wikiRes.json();
				const topWiki = wikiData?.query?.search?.[0];

				if (topWiki) {
					const sumUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topWiki.title)}`;
					const sumRes = await fetch(sumUrl);
					if (sumRes.ok) {
						const sumData = await sumRes.json();
						if (sumData.extract && sumData.type !== 'disambiguation') {
							const sourceLabel = wikiLang === 'bn' ? 'বাংলা উইকিপিডিয়া' : wikiLang === 'hi' ? 'हिन्दी विकिपीडिया' : 'English Wikipedia';
							const subLabel = wikiLang === 'bn' ? 'উইকিপিডিয়া উন্মুক্ত জ্ঞানকোষ' : wikiLang === 'hi' ? 'विकिपीडिया मुक्त ज्ञानकोश' : 'Wikipedia Knowledge Base';

							return {
								title: sumData.title,
								subtitle: sumData.description || subLabel,
								description: sumData.extract,
								thumbnail: sumData.thumbnail?.source,
								attributes: [
									[wikiLang === 'bn' ? 'উৎস' : wikiLang === 'hi' ? 'स्रोत' : 'Source', sourceLabel],
									[wikiLang === 'bn' ? 'পৃষ্ঠা আইডি' : wikiLang === 'hi' ? 'पेज आईडी' : 'Page ID', sumData.pageid?.toString() || '—'],
									[wikiLang === 'bn' ? 'লাইসেন্স' : wikiLang === 'hi' ? 'লাइसेंस' : 'License', 'CC BY-SA 4.0']
								] as [string, string][],
								sourceUrl: sumData.content_urls?.desktop?.page || `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(topWiki.title)}`
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
	const totalEstimated = Math.max(results.length * 10, page * 10 + (results.length >= 5 ? 50 : 0));
	const totalPages = Math.max(1, Math.min(10, Math.ceil(totalEstimated / pageSize)));
	const hasMore = page < totalPages;

	return json({
		query,
		category,
		lang,
		page,
		pageSize,
		totalPages,
		hasMore,
		results,
		knowledge,
		didYouMean,
		total: totalEstimated
	});
};
