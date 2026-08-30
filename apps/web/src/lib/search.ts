/**
 * Universal Web Search & Knowledge Aggregator
 * Searches all websites across the global internet (DuckDuckGo, Wikipedia, Open Web)
 */

import { applyGoggles, parseGoggleRules, type SearchResult } from './goggles';

export interface KnowledgePanelData {
	title: string;
	subtitle: string;
	description: string;
	thumbnail?: string;
	attributes: [string, string][];
	sourceUrl: string;
}

export interface SearchResponse {
	query: string;
	category?: string;
	results: SearchResultItem[];
	knowledge?: KnowledgePanelData;
	didYouMean?: string;
	total: number;
}

export interface SearchResultItem extends SearchResult {
	domain?: string;
	source: string;
	imageUrl?: string;
	publishedDate?: string;
	signals: {
		bm25: number;
		authority: number;
		freshness: number;
		explanation: string;
	};
}

export const TYPO_SUGGESTIONS: Record<string, string> = {
	'বাংলদেশ': 'বাংলাদেশ',
	'রবিন্দ্রনাথ': 'রবীন্দ্রনাথ',
	'ভাসা': 'ভাষা',
	'গিতাঞ্জলি': 'গীতাঞ্জলি',
	'মুক্তিযুধ': 'মুক্তিযুদ্ধ',
	'নবেল': 'নোবেল',
	'পদমা সেতু': 'পদ্মা সেতু',
	'ঢকা শহর': 'ঢাকা শহর'
};

export async function executeSearch(
	query: string,
	category = 'all',
	goggleDsl?: string
): Promise<SearchResponse> {
	const trimmed = query.trim();
	if (!trimmed) {
		return { query: '', results: [], total: 0 };
	}

	let items: SearchResultItem[] = [];
	let knowledge: KnowledgePanelData | undefined;
	let didYouMean = TYPO_SUGGESTIONS[trimmed];

	try {
		// Call our universal web search API endpoint
		const apiUrl = `/api/search?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(category)}`;
		const res = await fetch(apiUrl);
		if (res.ok) {
			const data = await res.json();
			items = data.results || [];
			knowledge = data.knowledge;
			if (data.didYouMean) didYouMean = data.didYouMean;
		}
	} catch (err) {
		console.warn('API search failed, falling back to direct Wikipedia search', err);
	}

	// Fallback to Wikipedia if API returned 0 results
	if (items.length === 0) {
		try {
			const wikiUrl = `https://bn.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(trimmed)}&utf8=&format=json&origin=*&srlimit=8`;
			const res = await fetch(wikiUrl);
			const data = await res.json();
			const list = data?.query?.search || [];

			if (list.length > 0) {
				items = list.map((item: any, idx: number) => ({
					title: item.title,
					url: `https://bn.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
					domain: 'bn.wikipedia.org',
					snippet: item.snippet.replace(/<[^>]+>/g, ''),
					score: 1.0 - idx * 0.08,
					lang: 'bn',
					source: 'Wikipedia (বাংলা)',
					signals: {
						bm25: Math.max(0.4, 0.95 - idx * 0.06),
						authority: 0.98,
						freshness: 0.85,
						explanation: `উইকিপিডিয়া উন্মুক্ত জ্ঞানভাণ্ডার কিওয়ার্ড মিল।`
					}
				}));
			}
		} catch (_) {}
	}

	// Apply Goggles custom reranking rules if provided
	if (goggleDsl) {
		const rules = parseGoggleRules(goggleDsl);
		const reranked = applyGoggles(items, rules) as SearchResultItem[];
		items = reranked;
	}

	return {
		query: trimmed,
		category,
		results: items,
		knowledge,
		didYouMean,
		total: items.length
	};
}
