import { describe, it, expect } from 'vitest';
import { t, setLocale } from './i18n';

describe('i18n Module', () => {
	it('should return Bengali translations by default', () => {
		setLocale('bn');
		expect(t('appName')).toBe('সন্ধান');
		expect(t('tabs.all')).toBe('সব');
	});

	it('should return English translations when set', () => {
		setLocale('en');
		expect(t('appName')).toBe('Sondhan');
		expect(t('tabs.all')).toBe('All');
	});

	it('should return Hindi translations when set', () => {
		setLocale('hi');
		expect(t('appName')).toBe('संधान');
		expect(t('tabs.all')).toBe('सभी');
	});
});
