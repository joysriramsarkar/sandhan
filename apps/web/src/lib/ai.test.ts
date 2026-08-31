import { describe, it, expect } from 'vitest';
import { isQuestionQuery } from './ai';

describe('AI Question Intent Detector', () => {
	it('should detect Bengali questions accurately', () => {
		expect(isQuestionQuery('কৃত্রিম বুদ্ধিমত্তা কী?')).toBe(true);
		expect(isQuestionQuery('রবীন্দ্রনাথ কেন নোবেল পেয়েছিলেন?')).toBe(true);
		expect(isQuestionQuery('পদ্মা সেতুর দৈর্ঘ্য কত')).toBe(true);
		expect(isQuestionQuery('কোথায় সুন্দরবন অবস্থিত')).toBe(true);
		expect(isQuestionQuery('বাংলাদেশ')).toBe(false);
	});

	it('should detect English questions accurately', () => {
		expect(isQuestionQuery('What is artificial intelligence?')).toBe(true);
		expect(isQuestionQuery('Why is the sky blue?')).toBe(true);
		expect(isQuestionQuery('How does search ranking work')).toBe(true);
		expect(isQuestionQuery('Explain quantum computing')).toBe(true);
		expect(isQuestionQuery('machine learning')).toBe(false);
	});

	it('should detect trailing question marks', () => {
		expect(isQuestionQuery('anything with question mark?')).toBe(true);
		expect(isQuestionQuery('bangladesh?')).toBe(true);
	});
});
