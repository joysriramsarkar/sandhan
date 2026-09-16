/**
 * DuckDuckGo Style Bang Redirects
 */

export interface BangItem {
	prefix: string;
	name: string;
	urlTemplate: string;
}

export const BANGS: BangItem[] = [
	{ prefix: '!w', name: 'উইকিপিডিয়া (বাংলা)', urlTemplate: 'https://bn.wikipedia.org/wiki/Special:Search?search={q}' },
	{ prefix: '!wen', name: 'Wikipedia (EN)', urlTemplate: 'https://en.wikipedia.org/wiki/Special:Search?search={q}' },
	{ prefix: '!wh', name: 'উইকশনারি', urlTemplate: 'https://bn.wiktionary.org/wiki/Special:Search?search={q}' },
	{ prefix: '!wq', name: 'উইকিকুয়োট', urlTemplate: 'https://bn.wikiquote.org/wiki/Special:Search?search={q}' },
	{ prefix: '!ws', name: 'উইকিসোর্স', urlTemplate: 'https://bn.wikisource.org/wiki/Special:Search?search={q}' },
	{ prefix: '!wv', name: 'উইকিভয়েজ', urlTemplate: 'https://bn.wikivoyage.org/wiki/Special:Search?search={q}' },
	{ prefix: '!gh', name: 'GitHub', urlTemplate: 'https://github.com/search?q={q}' },
	{ prefix: '!g', name: 'Google', urlTemplate: 'https://www.google.com/search?q={q}' },
	{ prefix: '!ddg', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q={q}' },
	{ prefix: '!yt', name: 'YouTube', urlTemplate: 'https://www.youtube.com/results?search_query={q}' },
	{ prefix: '!m', name: 'OpenStreetMap', urlTemplate: 'https://www.openstreetmap.org/search?query={q}' },
	{ prefix: '!r', name: 'Reddit', urlTemplate: 'https://www.reddit.com/search/?q={q}' },
	{ prefix: '!bdnews', name: 'বিডিনিউজ২৪', urlTemplate: 'https://bangla.bdnews24.com/search?q={q}' },
	{ prefix: '!prothom', name: 'প্রথম আলো', urlTemplate: 'https://www.prothomalo.com/search?q={q}' },
	{ prefix: '!thedaily', name: 'দৈনিক ইত্তেফাক', urlTemplate: 'https://www.ittefaq.com.bd/search?q={q}' },
	{ prefix: '!wikt', name: 'Wiktionary (EN)', urlTemplate: 'https://en.wiktionary.org/wiki/Special:Search?search={q}' },
	{ prefix: '!scholar', name: 'Google Scholar', urlTemplate: 'https://scholar.google.com/scholar?q={q}' },
	{ prefix: '!nyt', name: 'The New York Times', urlTemplate: 'https://www.nytimes.com/search?query={q}' },
	{ prefix: '!arxiv', name: 'arXiv', urlTemplate: 'https://arxiv.org/search/?query={q}' }
	,
	{ prefix: '!maps', name: 'Google Maps', urlTemplate: 'https://www.google.com/maps/search/{q}' },
	{ prefix: '!npm', name: 'npm', urlTemplate: 'https://www.npmjs.com/search?q={q}' },
	{ prefix: '!mdn', name: 'MDN Web Docs', urlTemplate: 'https://developer.mozilla.org/en-US/search?q={q}' },
	{ prefix: '!weather', name: 'আবহাওয়া', urlTemplate: 'https://www.google.com/search?q=weather+{q}' }
];

export function resolveBang(query: string): string | null {
	const parts = query.trim().split(/\s+/);
	if (!parts.length) return null;

	const prefix = parts[0].toLowerCase();
	const rest = parts.slice(1).join(' ');

	const match = BANGS.find((b) => b.prefix === prefix);
	if (match) {
		return match.urlTemplate.replace('{q}', encodeURIComponent(rest || ''));
	}

	return null;
}
