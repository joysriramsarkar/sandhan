/**
 * Instant Answers: Math, Currency, Unit Conversion, Time & Date
 */

export function toAsciiDigits(str: string): string {
	return str.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
}

export function toBengaliDigits(num: number | string): string {
	const str = num.toString();
	return str.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
}

export interface InstantResult {
	type: 'math' | 'unit' | 'currency' | 'time' | 'date' | 'weather';
	title: string;
	value: string;
	detail?: string;
}

const WEATHER_TERMS = /আবহাওয়া|আবহাওয়া|তাপমাত্রা|বৃষ্টি হবে|weather|temperature|forecast|rain/i;
const DEFAULT_WEATHER_CITY = 'ঢাকা';

export function isWeatherQuery(query: string): boolean {
	return WEATHER_TERMS.test(query.trim());
}

function extractWeatherLocation(query: string): string {
	const withoutIntent = query
		.replace(WEATHER_TERMS, '')
		.replace(/আজকের?|আজ|এখন|কেমন|কত|ডিগ্রি|in|of|today|now|like/gi, ' ')
		.replace(/[?।,.!]/g, ' ')
		.trim();
	return withoutIntent || DEFAULT_WEATHER_CITY;
}

export async function fetchWeatherAnswer(query: string): Promise<InstantResult | null> {
	if (!isWeatherQuery(query)) return null;

	try {
		const location = extractWeatherLocation(query);
		const geoResponse = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=bn&format=json`
		);
		if (!geoResponse.ok) return null;
		const geoData = await geoResponse.json();
		const place = geoData?.results?.[0];
		if (!place?.latitude || !place?.longitude) return null;

		const weatherResponse = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`
		);
		if (!weatherResponse.ok) return null;
		const weatherData = await weatherResponse.json();
		const current = weatherData?.current;
		if (typeof current?.temperature_2m !== 'number') return null;

		const weatherLabel = getWeatherLabel(current.weather_code);
		return {
			type: 'weather',
			title: `${place.name || location} এর বর্তমান আবহাওয়া`,
			value: `${toBengaliDigits(current.temperature_2m)}°C · ${weatherLabel}`,
			detail: `আর্দ্রতা ${toBengaliDigits(current.relative_humidity_2m)}% · বাতাস ${toBengaliDigits(current.wind_speed_10m)} কিমি/ঘণ্টা`
		};
	} catch (error) {
		console.warn('Weather instant answer failed:', error);
		return null;
	}
}

function getWeatherLabel(code: number): string {
	if (code === 0) return 'পরিষ্কার আকাশ';
	if ([1, 2, 3].includes(code)) return 'আংশিক মেঘলা';
	if ([45, 48].includes(code)) return 'কুয়াশা';
	if ([51, 53, 55, 56, 57].includes(code)) return 'গুঁড়ি গুঁড়ি বৃষ্টি';
	if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'বৃষ্টি';
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'তুষারপাত';
	if ([95, 96, 99].includes(code)) return 'বজ্রঝড়';
	return 'পরিবর্তনশীল আবহাওয়া';
}

export function tryEvaluateMath(query: string): InstantResult | null {
	const norm = toAsciiDigits(query).replace(/×/g, '*').replace(/÷/g, '/');
	if (/^[\d\s+\-*/().%]+$/.test(norm) && /\d/.test(norm) && /[+\-*/%]/.test(norm)) {
		try {
			const res = Function('"use strict";return (' + norm + ')')();
			if (isFinite(res)) {
				return {
					type: 'math',
					title: 'ক্যালকুলেশন ফলাফল',
					value: res.toLocaleString('bn-BD'),
					detail: query
				};
			}
		} catch (_) {}
	}
	return null;
}

export function tryConvertUnits(query: string): InstantResult | null {
	const q = toAsciiDigits(query.toLowerCase());

	// 10 kg in lbs / ১০ কেজি পাউন্ডে
	const kgMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:কেজি|kg)\s*(?:to|in|এ|পাউন্ডে)?\s*(?:lbs|pound|পাউন্ড)?/);
	if (kgMatch && (query.includes('pound') || query.includes('পাউন্ড') || query.includes('lbs'))) {
		const kg = parseFloat(kgMatch[1]);
		const lbs = (kg * 2.20462).toFixed(2);
		return {
			type: 'unit',
			title: 'একক রূপান্তর (ওজন)',
			value: `${toBengaliDigits(lbs)} পাউন্ড (lbs)`,
			detail: `${toBengaliDigits(kg)} কেজি = ${lbs} lbs`
		};
	}

	// 100 USD in BDT / ১০০ ডলার টাকায়
	const usdMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:usd|ডলার|\$)\s*(?:to|in|এ|টাকায়)?\s*(?:bdt|টাকা|tk)?/);
	if (usdMatch && (query.includes('টাকা') || query.includes('bdt') || query.includes('tk') || query.includes('usd') || query.includes('ডলার'))) {
		const usd = parseFloat(usdMatch[1]);
		const bdt = (usd * 122.5).toFixed(2);
		return {
			type: 'currency',
			title: 'মুদ্রা রূপান্তর (USD → BDT)',
			value: `৳ ${toBengaliDigits(bdt)} টাকা`,
			detail: `$${usd} USD ≈ ${bdt} BDT (১ USD ≈ ১২২.৫০ ৳)`
		};
	}

	return null;
}

/**
 * Time-related instant answers: "সময়", "time", "কটা সময়"
 */
export function tryTimeAnswer(query: string): InstantResult | null {
	const q = query.toLowerCase().trim();
	if (q.includes('সময়') || q.includes('time') || q.includes('কটা') || q.includes('কত সময')) {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const period = now.getHours() >= 12 ? 'দুপুর' : 'সকাল';
		return {
			type: 'time',
			title: 'বর্তমান সময়',
			value: `${hours}:${minutes} ${period}`,
			detail: `${toBengaliDigits(now.getDate())} ${getMonthName(now.getMonth())} ${now.getFullYear()}`
		};
	}
	return null;
}

/**
 * Date-related instant answers: "আজকের তারিখ", "date", "কী তারিখ"
 */
export function tryDateAnswer(query: string): InstantResult | null {
	const q = query.toLowerCase().trim();
	if (q.includes('তারিখ') || q.includes('date') || q.includes('আজ') || q.includes('কী তারিখ') || q.includes('কত তারিখ')) {
		const now = new Date();
		return {
			type: 'date',
			title: 'আজকের তারিখ',
			value: `${toBengaliDigits(now.getDate())} ${getMonthName(now.getMonth())} ${toBengaliDigits(now.getFullYear())}`,
			detail: `${getDayName(now.getDay())}`
		};
	}
	return null;
}

function getMonthName(month: number): string {
	const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
	return months[month] || '';
}

function getDayName(day: number): string {
	const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
	return days[day] || '';
}

export function getInstantAnswer(query: string): InstantResult | null {
	return tryTimeAnswer(query) || tryDateAnswer(query) || tryEvaluateMath(query) || tryConvertUnits(query);
}
