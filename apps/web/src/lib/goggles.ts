/**
 * Goggles Custom Reranking Engine
 * Allows users to define declarative rules for boosting, demoting, or discarding search results.
 */

export interface GoggleRule {
	action: 'boost' | 'demote' | 'discard';
	multiplier: number;
	matchField: 'site' | 'lang' | 'title';
	matchValue: string;
}

export interface SearchResult {
	title: string;
	url: string;
	snippet: string;
	score: number;
	lang?: string;
}

export function parseGoggleRules(rulesText: string): GoggleRule[] {
	const rules: GoggleRule[] = [];
	const lines = rulesText.split('\n');

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('!') || line.startsWith('#')) continue;

		// Format: $boost=3,site=edu or $demote=2,site=pinterest.com or $discard,site=spam.com
		if (line.startsWith('$')) {
			const parts = line.slice(1).split(',');
			let action: 'boost' | 'demote' | 'discard' = 'boost';
			let multiplier = 1;
			let matchField: 'site' | 'lang' | 'title' = 'site';
			let matchValue = '';

			for (const p of parts) {
				const [k, v] = p.split('=');
				if (k === 'boost') {
					action = 'boost';
					multiplier = parseFloat(v) || 2;
				} else if (k === 'demote') {
					action = 'demote';
					multiplier = parseFloat(v) || 2;
				} else if (k === 'discard') {
					action = 'discard';
				} else if (k === 'site' || k === 'lang' || k === 'title') {
					matchField = k;
					matchValue = v || '';
				}
			}

			if (matchValue) {
				rules.push({ action, multiplier, matchField, matchValue });
			}
		}
	}

	return rules;
}

export function applyGoggles(results: SearchResult[], rules: GoggleRule[]): SearchResult[] {
	if (!rules.length) return results;

	const transformed: SearchResult[] = [];

	for (const item of results) {
		let score = item.score;
		let discard = false;

		for (const rule of rules) {
			let isMatch = false;

			if (rule.matchField === 'site') {
				isMatch = item.url.toLowerCase().includes(rule.matchValue.toLowerCase());
			} else if (rule.matchField === 'lang') {
				isMatch = (item.lang || 'bn').toLowerCase() === rule.matchValue.toLowerCase();
			} else if (rule.matchField === 'title') {
				isMatch = item.title.toLowerCase().includes(rule.matchValue.toLowerCase());
			}

			if (isMatch) {
				if (rule.action === 'discard') {
					discard = true;
					break;
				} else if (rule.action === 'boost') {
					score *= rule.multiplier;
				} else if (rule.action === 'demote') {
					score /= rule.multiplier;
				}
			}
		}

		if (!discard) {
			transformed.push({ ...item, score });
		}
	}

	// Rerank descending by new score
	return transformed.sort((a, b) => b.score - a.score);
}
