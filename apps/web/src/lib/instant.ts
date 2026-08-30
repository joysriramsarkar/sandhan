/**
 * Instant Answers: Math, Currency, and Unit Converters
 */

export function toAsciiDigits(str: string): string {
	return str.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
}

export function toBengaliDigits(num: number | string): string {
	const str = num.toString();
	return str.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
}

export interface InstantResult {
	type: 'math' | 'unit' | 'currency';
	title: string;
	value: string;
	detail?: string;
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

export function getInstantAnswer(query: string): InstantResult | null {
	return tryEvaluateMath(query) || tryConvertUnits(query);
}
