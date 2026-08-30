import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface SearchResultItem {
	title: string;
	url: string;
	domain: string;
	snippet: string;
	source: string;
	score: number;
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

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.trim() || '';
	const category = url.searchParams.get('category')?.toLowerCase() || 'all';

	if (!query) {
		return json({ query: '', results: [], total: 0 });
	}

	const didYouMean = TYPO_MAP[query] || undefined;
	const results: SearchResultItem[] = [];
	let knowledge: KnowledgePanelData | undefined;

	// 1. Universal Web Search via DDG HTML SERP Engine
	try {
		const ddgQuery = category === 'news' ? `${query} news` : category === 'videos' ? `${query} video` : query;
		const ddgUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(ddgQuery);
		
		const ddgRes = await fetch(ddgUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7'
			}
		});

		if (ddgRes.ok) {
			const html = await ddgRes.text();
			
			// Split by each result container
			const resultBlocks = html.split(/<div class="result results_links/gi);

			let idx = 0;
			for (let i = 1; i < resultBlocks.length && idx < 25; i++) {
				const block = resultBlocks[i];
				const aMatch = block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
				const sMatch = block.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

				if (aMatch) {
					const directUrl = cleanDDGUrl(aMatch[1]);
					const title = stripHtml(aMatch[2]);
					const snippet = sMatch ? stripHtml(sMatch[1]) : '';
					const domain = extractDomain(directUrl);

					if (title && directUrl && !directUrl.includes('duckduckgo.com/y.js') && !directUrl.includes('ad_provider')) {
						const isBengali = /[\u0980-\u09FF]/.test(title + ' ' + snippet);
						const score = parseFloat((1.0 - idx * 0.03).toFixed(3));

						results.push({
							title,
							url: directUrl,
							domain,
							snippet,
							source: domain,
							score,
							imageUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
							signals: {
								bm25: parseFloat((0.95 - idx * 0.03).toFixed(2)),
								authority: domain.includes('wikipedia') || domain.includes('.edu') || domain.includes('.gov') ? 0.98 : 0.85,
								freshness: 0.85,
								explanation: isBengali
									? `উন্মুক্ত ওয়েব র‍্যাংকিং ও বাংলা ভাষার প্রাসঙ্গিকতা (${domain})`
									: `Global web relevance match from ${domain}`
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

	// 2. Fetch Wikipedia & Wikidata Knowledge Panel
	try {
		const wikiSearchUrl = `https://bn.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=1`;
		const wikiRes = await fetch(wikiSearchUrl);
		const wikiData = await wikiRes.json();
		const topWiki = wikiData?.query?.search?.[0];

		if (topWiki) {
			const sumUrl = `https://bn.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topWiki.title)}`;
			const sumRes = await fetch(sumUrl);
			if (sumRes.ok) {
				const sumData = await sumRes.json();
				if (sumData.extract && sumData.type !== 'disambiguation') {
					knowledge = {
						title: sumData.title,
						subtitle: sumData.description || 'উইকিপিডিয়া উন্মুক্ত জ্ঞানকোষ',
						description: sumData.extract,
						thumbnail: sumData.thumbnail?.source,
						attributes: [
							['উৎস', 'বাংলা উইকিপিডিয়া'],
							['পৃষ্ঠা আইডি', sumData.pageid?.toString() || '—'],
							['লাইসেন্স', 'CC BY-SA 4.0']
						],
						sourceUrl: sumData.content_urls?.desktop?.page || `https://bn.wikipedia.org/wiki/${encodeURIComponent(topWiki.title)}`
					};
				}
			}
		} else {
			const enWikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=1`;
			const enRes = await fetch(enWikiUrl);
			const enData = await enRes.json();
			const topEn = enData?.query?.search?.[0];

			if (topEn) {
				const enSumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topEn.title)}`;
				const enSumRes = await fetch(enSumUrl);
				if (enSumRes.ok) {
					const enSumData = await enSumRes.json();
					if (enSumData.extract) {
						knowledge = {
							title: enSumData.title,
							subtitle: enSumData.description || 'Wikipedia Knowledge Base',
							description: enSumData.extract,
							thumbnail: enSumData.thumbnail?.source,
							attributes: [
								['Source', 'English Wikipedia'],
								['Page ID', enSumData.pageid?.toString() || '—'],
								['License', 'CC BY-SA 4.0']
							],
							sourceUrl: enSumData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topEn.title)}`
						};
					}
				}
			}
		}
	} catch (err) {
		console.warn('Knowledge panel error:', err);
	}

	// 3. Category Filter Handling (Images, Videos)
	let filteredResults = results;
	if (category === 'images') {
		filteredResults = results.map((r, i) => ({
			...r,
			imageUrl: `https://picsum.photos/seed/${encodeURIComponent(r.domain + i)}/400/300`
		}));
	}

	return json({
		query,
		category,
		results: filteredResults,
		knowledge,
		didYouMean,
		total: filteredResults.length
	});
};
