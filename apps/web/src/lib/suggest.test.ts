import { describe, it, expect } from 'vitest';
import { buildSuggestions, POPULAR_QUERIES } from './suggest';

describe('Autocomplete suggestions', () => {
	it('returns nothing for an empty query (no history is ever replayed)', () => {
		expect(buildSuggestions('', { sessionQueries: ['পদ্মা সেতু'] })).toEqual([]);
		expect(buildSuggestions('   ')).toEqual([]);
	});

	it('surfaces the offline typo correction as a suggestion', () => {
		const items = buildSuggestions('বাংলদেশ');
		expect(items.some((item) => item.kind === 'typo' && item.text === 'বাংলাদেশ')).toBe(true);
	});

	it('suggests bang shortcuts for bang prefixes', () => {
		const items = buildSuggestions('!w');
		expect(items.length).toBeGreaterThan(0);
		expect(items.every((item) => item.kind === 'bang')).toBe(true);
		expect(items.some((item) => item.text.startsWith('!w'))).toBe(true);
	});

	it('keeps the session queries first and marks them as history', () => {
		const items = buildSuggestions('পদ্মা', { sessionQueries: ['পদ্মা সেতুর দৈর্ঘ্য'] });
		expect(items[0]).toMatchObject({ kind: 'history', text: 'পদ্মা সেতুর দৈর্ঘ্য' });
		expect(items[0].match).toBe('পদ্মা');
	});

	it('never exceeds the requested limit and de-duplicates results', () => {
		const items = buildSuggestions('বাংলাদেশ', { limit: 4, sessionQueries: ['বাংলাদেশ'] });
		expect(items.length).toBeLessThanOrEqual(4);
		const texts = items.map((item) => item.text);
		expect(new Set(texts).size).toBe(texts.length);
	});

	it('exposes a curated popular-query catalogue for offline use', () => {
		expect(POPULAR_QUERIES.length).toBeGreaterThan(10);
		expect(POPULAR_QUERIES).toContain('পদ্মা সেতু');
	});
});
