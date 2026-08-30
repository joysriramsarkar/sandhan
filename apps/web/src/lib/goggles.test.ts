import { describe, it, expect } from 'vitest';
import { parseGoggleRules, applyGoggles, encodeGoggleUrl, decodeGoggleUrl, type SearchResult } from './goggles';

describe('Goggles Reranker Engine', () => {
	it('should parse Goggles DSL rules properly', () => {
		const dsl = `
			! Name: Test Goggle
			$boost=3,site=edu
			$demote=4,site=spam.com
			$discard,site=malware.xyz
		`;

		const rules = parseGoggleRules(dsl);
		expect(rules).toHaveLength(3);
		expect(rules[0]).toEqual({ action: 'boost', multiplier: 3, matchField: 'site', matchValue: 'edu' });
		expect(rules[1]).toEqual({ action: 'demote', multiplier: 4, matchField: 'site', matchValue: 'spam.com' });
		expect(rules[2]).toEqual({ action: 'discard', multiplier: 1, matchField: 'site', matchValue: 'malware.xyz' });
	});

	it('should boost, demote, and discard results accordingly', () => {
		const items: SearchResult[] = [
			{ title: 'Normal Page', url: 'https://example.com/page', snippet: '...', score: 1.0 },
			{ title: 'Academic Research', url: 'https://du.ac.bd/research', snippet: '...', score: 1.0 },
			{ title: 'Spam Forum', url: 'https://spam.com/thread', snippet: '...', score: 1.0 },
			{ title: 'Harmful Page', url: 'https://malware.xyz/dl', snippet: '...', score: 1.0 }
		];

		const rules = parseGoggleRules(`
			$boost=3,site=ac.bd
			$demote=2,site=spam.com
			$discard,site=malware.xyz
		`);

		const reranked = applyGoggles(items, rules);

		// Academic site should now be top
		expect(reranked[0].title).toBe('Academic Research');
		expect(reranked[0].score).toBe(3.0);

		// Malware should be discarded
		expect(reranked.find(r => r.url.includes('malware.xyz'))).toBeUndefined();

		// Spam should be demoted to bottom
		expect(reranked[reranked.length - 1].title).toBe('Spam Forum');
		expect(reranked[reranked.length - 1].score).toBe(0.5);
	});

	it('should encode and decode goggle URLs cleanly', () => {
		const dsl = '$boost=3,site=ac.bd\n$discard,site=spam.com';
		const encoded = encodeGoggleUrl(dsl);
		expect(encoded).toBeTruthy();
		const decoded = decodeGoggleUrl(encoded);
		expect(decoded).toBe(dsl);
	});
});

