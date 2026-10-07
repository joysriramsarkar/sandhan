// @vitest-environment jsdom
/**
 * Renders the real Google-style SERP client-side (the same code path a browser
 * takes) and asserts the Google markup: search box, tabs, result rows,
 * knowledge panel, related searches and pagination.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from '../routes/+page.svelte';
import type { SearchResultItem } from './search';

const RESULT: SearchResultItem = {
	title: 'পদ্মা সেতু — উইকিপিডিয়া',
	url: 'https://bn.wikipedia.org/wiki/পদ্মা_সেতু',
	domain: 'bn.wikipedia.org',
	snippet: 'পদ্মা বহুমুখী সেতু বাংলাদেশের পদ্মা নদীর উপর নির্মিত একটি সড়ক ও রেল সেতু।',
	source: 'Wikipedia',
	score: 0.94,
	signals: { bm25: 0.94, authority: 0.95, freshness: 0.8, explanation: 'উইকিপিডিয়া লাইভ ম্যাচ।' }
};

const SEARCH_PAYLOAD = {
	query: 'পদ্মা সেতু',
	category: 'all',
	page: 1,
	pageSize: 10,
	totalPages: 3,
	hasMore: true,
	total: 148000,
	results: [RESULT, { ...RESULT, url: 'https://padma.gov.bd/', title: 'পদ্মা সেতু প্রকল্প', domain: 'padma.gov.bd' }],
	knowledge: {
		title: 'পদ্মা সেতু',
		subtitle: 'বাংলাদেশের বহুমুখী সেতু',
		description: 'পদ্মা সেতু ২০২২ সালে উদ্বোধন করা হয়।',
		attributes: [['উৎস', 'উইকিপিডিয়া']] as [string, string][],
		sourceUrl: 'https://bn.wikipedia.org/wiki/পদ্মা_সেতু'
	},
	didYouMean: 'পদ্মা সেতু বাংলাদেশ'
};

function stubFetch(payload: unknown = SEARCH_PAYLOAD) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('/api/search')) {
				return { ok: true, json: async () => payload } as unknown as Response;
			}
			return { ok: false, json: async () => ({}) } as unknown as Response;
		})
	);
}

async function mountSerp(query = 'পদ্মা সেতু') {
	window.history.replaceState({}, '', `/?q=${encodeURIComponent(query)}`);
	const target = document.createElement('div');
	document.body.appendChild(target);
	const component = new Page({ target });
	await new Promise((resolve) => setTimeout(resolve, 60));
	return { target, component };
}

describe('Google-style SERP', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		stubFetch();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the Google home page when there is no query', async () => {
		window.history.replaceState({}, '', '/');
		const target = document.createElement('div');
		document.body.appendChild(target);
		const component = new Page({ target });
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(target.querySelector('.g-home')).toBeTruthy();
		expect(target.querySelector('.g-wordmark')).toBeTruthy();
		expect(target.querySelector('.g-search-field input')).toBeTruthy();
		expect(target.querySelector('.g-ai-pill')?.textContent).toContain('AI Mode');
		expect(target.querySelectorAll('.g-btn').length).toBeGreaterThanOrEqual(2);
		expect(target.querySelector('.g-home-footer')?.textContent).toContain('গোপনীয়তা');
		component.$destroy();
	});

	it('renders the Google SERP chrome for a query', async () => {
		const { target, component } = await mountSerp();

		expect(target.querySelector('.g-serp-header')).toBeTruthy();
		expect(target.querySelector('.g-serp-logo')?.textContent?.trim()).toBe('সন্ধান');
		expect(target.querySelector('.g-serp-box input')).toBeTruthy();

		const tabs = Array.from(target.querySelectorAll('.g-tab-label')).map((el) => el.textContent);
		expect(tabs).toEqual(['সব', 'ছবি', 'ভিডিও', 'খবর', 'মানচিত্র']);
		expect(target.querySelectorAll('.g-tab.active').length).toBe(1);

		expect(target.querySelector('.g-stats')?.textContent).toContain('প্রায়');
		expect(target.querySelector('.g-stats')?.textContent).toContain('সেকেন্ড');
		expect(target.querySelector('.g-dym')?.textContent).toContain('পদ্মা সেতু বাংলাদেশ');

		expect(target.querySelectorAll('.g-result').length).toBe(2);
		expect(target.querySelector('.g-src-name')?.textContent).toBe('bn.wikipedia.org');
		expect(target.querySelector('.g-src-url')?.textContent).toContain('bn.wikipedia.org');
		expect(target.querySelector('.g-result-title a')?.getAttribute('href')).toBe(RESULT.url);

		expect(target.querySelector('.g-kp-title')?.textContent).toBe('পদ্মা সেতু');
		expect(target.querySelectorAll('.g-kp-row').length).toBe(1);

		expect(target.querySelector('.g-related-title')?.textContent).toContain('সম্পর্কিত');
		expect(target.querySelectorAll('.g-related-item').length).toBeGreaterThan(0);

		expect(target.querySelector('.g-page-current')?.textContent).toBe('1');
		expect(target.querySelectorAll('.g-page-link').length).toBe(2);
		expect(target.querySelector('.g-next')).toBeTruthy();

		expect(target.querySelector('.g-serif-footer')?.textContent).toContain('শর্তাবলী');
		component.$destroy();
	});

	it('switches to the Google Images layout when the images tab is chosen', async () => {
		const { target, component } = await mountSerp();
		const imageTab = Array.from(target.querySelectorAll('.g-tab')).find((tab) =>
			tab.textContent?.includes('ছবি')
		) as HTMLButtonElement;
		imageTab.click();
		await new Promise((resolve) => setTimeout(resolve, 60));

		expect(target.querySelector('.g-cat-heading')?.textContent).toContain('ছবি');
		expect(target.querySelectorAll('.g-image').length).toBe(2);
		expect(target.querySelector('.g-tab.active')?.textContent).toContain('ছবি');
		component.$destroy();
	});
});
