/**
 * Universal Web Search & Knowledge Aggregator
 * Searches all websites across the global internet (DuckDuckGo, Wikipedia, Open Web) with Multi-page Pagination
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
	page: number;
	pageSize: number;
	totalPages: number;
	hasMore: boolean;
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
	goggleDsl?: string,
	lang = 'bn',
	page = 1
): Promise<SearchResponse> {
	const trimmed = query.trim();
	if (!trimmed) {
		return { query: '', page: 1, pageSize: 10, totalPages: 0, hasMore: false, results: [], total: 0 };
	}

	let items: SearchResultItem[] = [];
	let knowledge: KnowledgePanelData | undefined;
	let didYouMean = page === 1 ? TYPO_SUGGESTIONS[trimmed] : undefined;
	let totalPages = 1;
	let hasMore = false;
	let total = 0;

	try {
		// Call our universal web search API endpoint with pagination parameters
		const apiUrl = `/api/search?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(category)}&lang=${encodeURIComponent(lang)}&page=${page}`;
		const res = await fetch(apiUrl);
		if (res.ok) {
			const data = await res.json();
			items = data.results || [];
			knowledge = data.knowledge;
			totalPages = data.totalPages || 1;
			hasMore = !!data.hasMore;
			total = data.total || items.length;
			if (data.didYouMean) didYouMean = data.didYouMean;
		}
	} catch (err) {
		console.warn('API search request failed', err);
	}

	// Apply Goggles custom reranking rules if provided
	if (goggleDsl && items.length > 0) {
		const rules = parseGoggleRules(goggleDsl);
		const reranked = applyGoggles(items, rules) as SearchResultItem[];
		items = reranked;
	}

	return {
		query: trimmed,
		category,
		page,
		pageSize: 10,
		totalPages,
		hasMore,
		results: items,
		knowledge,
		didYouMean,
		total: total || items.length
	};
}
