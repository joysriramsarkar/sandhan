/**
 * Autocomplete / search suggestion engine.
 *
 * Suggestions are built strictly on-device from:
 *  1. the current session's own searches (never persisted, never sent anywhere),
 *  2. a curated list of popular public queries,
 *  3. the offline typo-correction dictionary (বাংলা বানান সংশোধক),
 *  4. the `!bang` shortcut catalogue.
 *
 * No keystroke ever leaves the browser for suggestions.
 */

import { BANGS } from './bangs';
import { TYPO_SUGGESTIONS } from './search';

export type SuggestionKind = 'query' | 'history' | 'typo' | 'bang';

export interface Suggestion {
	/** Text placed into the search box when picked. */
	text: string;
	/** The part of `text` that should be shown in bold (the typed prefix). */
	match: string;
	kind: SuggestionKind;
	/** Optional right-hand label (used for bang targets). */
	label?: string;
}

export const POPULAR_QUERIES: string[] = [
	'বাংলাদেশ',
	'বাংলা ভাষা',
	'পদ্মা সেতু',
	'জাতীয় সংগীত',
	'মুক্তিযুদ্ধের ইতিহাস',
	'রবীন্দ্রনাথ ঠাকুর',
	'কাজী নজরুল ইসলাম',
	'সুন্দরবন',
	'কক্সবাজার',
	'চট্টগ্রাম',
	'ঢাকা শহর',
	'বাংলাদেশ ব্যাংক',
	'শেয়ার বাজার',
	'আবহাওয়া',
	'চাকরির খবর',
	'ক্রিকেট স্কোর',
	'বিশ্বকাপ ক্রিকেট',
	'বাংলা ব্যাকরণ',
	'কৃত্রিম বুদ্ধিমত্তা',
	'প্রোগ্রামিং শেখা',
	'উইকিপিডিয়া',
	'বিশ্ববিদ্যালয় ভর্তি',
	'এইচএসসি রেজাল্ট',
	'বাংলা ছড়া',
	'স্বাস্থ্য টিপস',
	'ভাষা আন্দোলন',
	'বাংলাদেশের ইতিহাস',
	'wind power',
	'climate change',
	'world cup schedule',
	'machine learning tutorial',
	'open source search engine',
	'google search alternatives',
	'bangla newspaper',
	'learn javascript',
	'python tutorial',
	'weather forecast',
	'bitcoin price',
	'chatgpt',
	'প্রযুক্তি খবর'
];

const QUERY_REFINEMENTS = [
	'কী',
	'কেন',
	'কীভাবে',
	'ইতিহাস',
	'খবর',
	'ছবি',
	'meaning',
	'history',
	'how to',
	'news',
	'विषय में',
	'खबर'
];

function normalize(text: string): string {
	return text.toLowerCase().trim();
}

export interface BuildSuggestionOptions {
	limit?: number;
	sessionQueries?: string[];
}

export function buildSuggestions(
	query: string,
	options: BuildSuggestionOptions = {}
): Suggestion[] {
	const limit = options.limit ?? 9;
	const sessionQueries = options.sessionQueries ?? [];
	const raw = query.trim();
	const value = normalize(raw);
	const seen = new Set<string>([normalize(raw)]);
	const out: Suggestion[] = [];

	function push(text: string, kind: SuggestionKind, label?: string) {
		const key = normalize(text);
		if (!text || seen.has(key) || out.length >= limit) return;
		seen.add(key);
		if (!value) return;
		const idx = key.indexOf(value);
		out.push({
			text,
			match: idx >= 0 ? text.slice(idx, idx + value.length) : '',
			kind,
			label
		});
	}

	// 0. Bang shortcuts — either the query starts with a bang, or it looks like one.
	const bangProbe = raw.startsWith('!') ? normalize(raw) : '';
	if (bangProbe) {
		const rest = raw.replace(/^!\S*\s?/, '');
		const startsWithMatch = BANGS.filter((b) => bangProbe.startsWith(b.prefix)).length > 0;
		for (const bang of BANGS) {
			if (bangProbe.startsWith(bang.prefix)) {
				push(`${bang.prefix} ${rest}`.trim(), 'bang', bang.name);
			} else if (bang.prefix.startsWith(bangProbe) || (!startsWithMatch && bangProbe.length > 1)) {
				const short = bangProbe.slice(1);
				if (bang.prefix.replace('!', '').startsWith(short)) {
					push(`${bang.prefix} ${rest}`.trim(), 'bang', bang.name);
				}
			}
		}
	}

	// Bang queries only ever return bang suggestions.
	if (raw.startsWith('!')) return out.slice(0, limit);

	if (!value) return [];

	// 1. This session's own searches (in-memory only).
	for (const item of sessionQueries) {
		if (normalize(item).includes(value)) push(item, 'history');
	}

	// 2. Offline typo correction (runs before generic matching, like a "did you mean" row).
	const corrected = TYPO_SUGGESTIONS[raw] || TYPO_SUGGESTIONS[normalize(raw)];
	if (corrected && corrected !== raw) push(corrected, 'typo');

	// 3. Curated popular queries.
	const popularMatches = POPULAR_QUERIES.filter((item) => normalize(item).includes(value));
	for (const item of popularMatches.slice(0, 4)) push(item, 'query');

	// 4. Bang keyword search: "wikipedia bangla" → "!w bangla".
	for (const bang of BANGS) {
		const bangName = normalize(bang.name);
		if (bangName.includes(value) && value.length >= 2) {
			push(`${bang.prefix} ${raw}`, 'bang', bang.name);
		}
	}

	// 5. Query refinements — the same trick Google uses with "people also search for".
	for (const stem of QUERY_REFINEMENTS) {
		const candidate = `${raw} ${stem}`;
		const prefixCandidate = `${stem} ${raw}`;
		if (normalize(stem).startsWith(value) || normalize(candidate).includes(value)) {
			push(candidate, 'query');
		} else if (normalize(prefixCandidate).startsWith(value)) {
			push(prefixCandidate, 'query');
		}
	}

	return out.slice(0, limit);
}
