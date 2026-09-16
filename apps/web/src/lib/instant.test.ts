import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWeatherAnswer, getInstantAnswer, isWeatherQuery } from './instant';

describe('Instant answers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('keeps synchronous answers for time and math', () => {
		expect(getInstantAnswer('2 + 2')?.type).toBe('math');
		expect(getInstantAnswer('এখন সময়')?.type).toBe('time');
	});

	it('recognizes weather queries and formats live forecast data', async () => {
		expect(isWeatherQuery('ঢাকার আবহাওয়া কেমন?')).toBe(true);
		vi.stubGlobal(
			'fetch',
			vi.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ name: 'ঢাকা', latitude: 23.81, longitude: 90.41 }] }) })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ current: { temperature_2m: 29, weather_code: 2, relative_humidity_2m: 70, wind_speed_10m: 12 } })
				})
		);

		const result = await fetchWeatherAnswer('ঢাকা আবহাওয়া');
		expect(result?.type).toBe('weather');
		expect(result?.value).toContain('২৯');
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
