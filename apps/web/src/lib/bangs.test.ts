import { describe, it, expect } from 'vitest';
import { BANGS, resolveBang } from './bangs';

describe('Bang shortcuts', () => {
	it('contains the expanded shortcut catalog', () => {
		expect(BANGS.length).toBeGreaterThanOrEqual(15);
		expect(BANGS.some((bang) => bang.prefix === '!maps')).toBe(true);
		expect(BANGS.some((bang) => bang.prefix === '!mdn')).toBe(true);
	});

	it('encodes query text in a shortcut URL', () => {
		expect(resolveBang('!npm svelte kit')).toBe('https://www.npmjs.com/search?q=svelte%20kit');
		expect(resolveBang('বাংলাদেশ')).toBeNull();
	});
});
