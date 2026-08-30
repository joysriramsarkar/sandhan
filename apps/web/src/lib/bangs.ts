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
	{ prefix: '!gh', name: 'GitHub', urlTemplate: 'https://github.com/search?q={q}' },
	{ prefix: '!yt', name: 'YouTube', urlTemplate: 'https://www.youtube.com/results?search_query={q}' },
	{ prefix: '!g', name: 'Google', urlTemplate: 'https://www.google.com/search?q={q}' },
	{ prefix: '!ddg', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q={q}' },
	{ prefix: '!m', name: 'OpenStreetMap', urlTemplate: 'https://www.openstreetmap.org/search?query={q}' },
	{ prefix: '!r', name: 'Reddit', urlTemplate: 'https://www.reddit.com/search/?q={q}' },
	{ prefix: '!bdnews', name: 'বিডিনিউজ২৪', urlTemplate: 'https://bangla.bdnews24.com/search?q={q}' }
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
