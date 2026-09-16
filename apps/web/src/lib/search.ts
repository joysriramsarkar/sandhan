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
	// Real Bengali common typos — misspelling → correct form
	'বাংলদেশ': 'বাংলাদেশ',
	'বাংলাদশ': 'বাংলাদেশ',
	'বাংলাদেস': 'বাংলাদেশ',
	'রবিন্দ্রনাথ': 'রবীন্দ্রনাথ',
	'রবীন্দনাথ': 'রবীন্দ্রনাথ',
	'ভাসা': 'ভাষা',
	'ভাশা': 'ভাষা',
	'গিতাঞ্জলি': 'গীতাঞ্জলি',
	'গীতাঞ্জলী': 'গীতাঞ্জলি',
	'মুক্তিযুধ': 'মুক্তিযুদ্ধ',
	'মুক্তিযুদ্ধের ইতিহাস': 'মুক্তিযুদ্ধের ইতিহাস',
	'পদমা সেতু': 'পদ্মা সেতু',
	'পদ্মা সেতুু': 'পদ্মা সেতু',
	'ঢকা শহর': 'ঢাকা শহর',
	'ঢাকা সহর': 'ঢাকা শহর',
	'সুদুর': 'সুদূর',
	'দুরত্ব': 'দূরত্ব',
	'প্রশ্নো': 'প্রশ্ন',
	'উত্তরো': 'উত্তর',
	'বিজ্গান': 'বিজ্ঞান',
	'বিগ্গান': 'বিজ্ঞান',
	'প্রযোক্তি': 'প্রযুক্তি',
	'প্রযু্ক্তি': 'প্রযুক্তি',
	'বিশশ্ববিদ্যালয়': 'বিশ্ববিদ্যালয়',
	'বিশ্ববিদ্যলয়': 'বিশ্ববিদ্যালয়',
	'স্বাধীনতা যুদ্দ': 'স্বাধীনতা যুদ্ধ',
	'সাহিত্ত': 'সাহিত্য',
	'অর্থনিতি': 'অর্থনীতি',
	'চিকিতসা': 'চিকিৎসা',
	'পরিবেশ দুষন': 'পরিবেশ দূষণ',
	'জলবায়ু পরবর্তন': 'জলবায়ু পরিবর্তন',
	'কম্পিউটার সায়েন্স': 'কম্পিউটার সায়েন্স',
	'কৃত্তিম বুদ্ধিমত্তা': 'কৃত্রিম বুদ্ধিমত্তা',
	'ইন্টারনেটের গতি': 'ইন্টারনেটের গতি',
	'আবহাওয়া কেমন': 'আবহাওয়া কেমন',
	'সুন্দরবন কোথায়': 'সুন্দরবন কোথায়',
	'বাংলাদেশের রাজধানি': 'বাংলাদেশের রাজধানী',
	'রাজধানি ঢাকা': 'রাজধানী ঢাকা',
	'আন্তরজাতিক': 'আন্তর্জাতিক',
	'সাংবিধানিক': 'সাংবিধানিক',
	'গনিত': 'গণিত',
	'গননা': 'গণনা',
	'ব্যাবহার': 'ব্যবহার',
	'ব্যবস্তাপনা': 'ব্যবস্থাপনা',
	'নিরাপতা': 'নিরাপত্তা',
	'সাস্থ্য': 'স্বাস্থ্য',
	'স্বাস্হ্য': 'স্বাস্থ্য',
	'উন্নয়নশিল': 'উন্নয়নশীল',
	'অভিবাসন': 'অভিবাসন',
	'বিশ্লেশন': 'বিশ্লেষণ',
	'পরিসংখান': 'পরিসংখ্যান',
	'প্রভাত': 'প্রভাত',
	'অভিজ্ঞ': 'অভিজ্ঞ',
	'প্রকাশ': 'প্রকাশ',
	'শিক্ষা': 'শিক্ষা',
	'অর্থনীতি': 'অর্থনীতি',
	'প্রযুক্তি': 'প্রযুক্তি',
	'জীবন': 'জীবন',
	'পৃথিবী': 'পৃথিবী',
	'বিশ্ব': 'বিশ্ব',
	'ইতিহাস': 'ইতিহাস',
	'সংস্কৃতি': 'সংস্কৃতি',
	'খেলা': 'খেলাধুলা',
	'ক্রিকেট': 'ক্রিকেট',
	'ফুটবল': 'ফুটবল',
	'বুয়েট': 'বুয়েট',
	'কৃষি': 'কৃষি',
	'চিকিৎসা': 'চিকিৎসা',
	'আইন': 'আইন',
	'ব্যবস্থাপনা': 'ব্যবস্থাপনা',
	'পেট্রোলিয়াম': 'পেট্রোলিয়াম',
	'বিদ্যুৎ': 'বিদ্যুৎ',
	'কম্পিউটার': 'কম্পিউটার',
	'ইন্টারনেট': 'ইন্টারনেট',
	'অ্যান্ড্রয়েড': 'অ্যান্ড্রয়েড',
	'কৃত্রিম বুদ্ধিমত্তা': 'কৃত্রিম বুদ্ধিমত্তা',
	'মেশিন লার্নিং': 'মেশিন লার্নিং',
	'ব্লকচেইন': 'ব্লকচেইন',
	'বিটকয়েন': 'বিটকয়েন',
	'চাঁদ': 'চাঁদ',
	'গ্রহ': 'গ্রহ',
	'নক্ষত্র': 'নক্ষত্র',
	'পরিবেশ': 'পরিবেশ',
	'জলবায়ু পরিবর্তন': 'জলবায়ু পরিবর্তন',
	'গ্লোবাল ওয়ার্মিং': 'গ্লোবাল ওয়ার্মিং',
	'প্লাস্টিক দূষণ': 'প্লাস্টিক দূষণ',
	'বায়ু দূষণ': 'বায়ু দূষণ',
	'সবজি': 'সবজি',
	'ফল': 'ফল',
	'ভাত': 'ভাত',
	'মাছ': 'মাছ',
	'মাংস': 'মাংস',
	'ডাল': 'ডাল',
	'ভর্তা': 'ভর্তা',
	'বিরিয়ানি': 'বিরিয়ানি',
	'দস্তা': 'দস্তা',
	'রুটি': 'রুটি',
	'নান': 'নান',
	'ইচলি': 'ইচলি',
	'চিংড়ি': 'চিংড়ি',
	'রুই': 'রুই',
	'কাতল': 'কাতল',
	'টেংরা': 'টেংরা',
	'তেলাপিয়া': 'তেলাপিয়া',
	'কব্জি': 'কব্জি',
	'লাউ': 'লাউ',
	'কুমড়ো': 'কুমড়ো',
	'পটল': 'পটল',
	'ঝিঙ্গা': 'ঝিঙ্গা',
	'শিম': 'শিম',
	'মসুর ডাল': 'মসুর ডাল',
	'মুগ ডাল': 'মুগ ডাল',
	'চনা ডাল': 'চনা ডাল',
	'কাঁচা আম': 'কাঁচা আম',
	'কাঁচা পেঁপে': 'কাঁচা পেঁপে',
	'কাঁচা কলা': 'কাঁচা কলা',
	'আলু': 'আলু',
	'পটাতো': 'পটাতো',
	'টমেটো': 'টমেটো',
	'বেগুন': 'বেগুন',
	'গাজর': 'গাজর',
	'মুলা': 'মুলা',
	'চিনি': 'চিনি',
	'লবণ': 'লবণ',
	'তেল': 'তেল',
	'ঘি': 'ঘি',
	'দুধ': 'দুধ',
	'দই': 'দই',
	'রসমালাই': 'রসমালাই',
	'বরফ': 'বরফ',
	'কলকাতা': 'কলকাতা',
	'চট্টগ্রাম': 'চট্টগ্রাম',
	'সিলেট': 'সিলেট',
	'রাজশাহী': 'রাজশাহী',
	'খুলনা': 'খুলনা',
	'বরিশাল': 'বরিশাল',
	'রংপুর': 'রংপুর',
	'ময়মনসিংহ': 'ময়মনসিংহ',
	'কক্সবাজার': 'কক্সবাজার',
	'টি-শার্ট': 'টি-শার্ট',
	'জিন্স': 'জিন্স',
	'শৌড়ি': 'শৌড়ি',
	'লুঙ্গি': 'লুঙ্গি',
	'গামছা': 'গামছা',
	'টুপি': 'টুপি'
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
