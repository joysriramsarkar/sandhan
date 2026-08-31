import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSearch, TYPO_SUGGESTIONS } from './search';

describe('Search Service & Aggregator Client', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('should return empty response for whitespace-only query', async () => {
		const res = await executeSearch('   ');
		expect(res.results).toEqual([]);
		expect(res.total).toBe(0);
	});

	it('should suggest known typos correctly', () => {
		expect(TYPO_SUGGESTIONS['বাংলদেশ']).toBe('বাংলাদেশ');
		expect(TYPO_SUGGESTIONS['রবিন্দ্রনাথ']).toBe('রবীন্দ্রনাথ');
		expect(TYPO_SUGGESTIONS['পদমা সেতু']).toBe('পদ্মা সেতু');
	});

	it('should call api endpoint with appropriate query params', async () => {
		const mockResponse = {
			query: 'বাংলাদেশ',
			category: 'all',
			page: 1,
			pageSize: 10,
			totalPages: 3,
			hasMore: true,
			results: [
				{
					title: 'বাংলাদেশ - উইকিপিডিয়া',
					url: 'https://bn.wikipedia.org/wiki/বাংলাদেশ',
					domain: 'bn.wikipedia.org',
					snippet: 'দক্ষিণ এশিয়ার রাষ্ট্র',
					source: 'উইকিপিডিয়া',
					score: 0.95,
					signals: { bm25: 0.9, authority: 0.99, freshness: 0.85, explanation: 'উইকি' }
				}
			],
			total: 30
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		} as any);

		const res = await executeSearch('বাংলাদেশ', 'all', undefined, 'bn', 1);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining(`/api/search?q=${encodeURIComponent('বাংলাদেশ')}&category=all&lang=bn&page=1`)
		);
		expect(res.results).toHaveLength(1);
		expect(res.results[0].title).toBe('বাংলাদেশ - উইকিপিডিয়া');
		expect(res.totalPages).toBe(3);
	});
});
