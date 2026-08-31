/**
 * Internationalization (i18n) Module
 * Supported: Bengali (bn), English (en), Hindi (hi)
 */

export type Locale = 'bn' | 'en' | 'hi';

export const translations = {
	bn: {
		appName: 'সন্ধান',
		tagline: 'খুঁজুন নিশ্চিন্তে — আপনার সার্চ, শুধুই আপনার',
		searchPlaceholder: 'খুঁজুন… (যেমন: রবীন্দ্রনাথ ঠাকুর, ২৫ * ৪৮, !w বাংলাদেশ)',
		searchBtn: 'খুঁজুন',
		instantCalculation: 'ক্যালকুলেশন ফলাফল',
		didYouMean: 'আপনি কি বোঝাতে চেয়েছেন',
		whyThisResult: 'কেন এই ফলাফল?',
		whyTitle: 'র‍্যাংকিং সিগন্যাল বিশ্লেষণ',
		incognitoView: 'ছদ্মবেশী ভিউ',
		source: 'উৎস',
		tabs: { all: 'সব', images: 'ছবি', videos: 'ভিডিও', news: 'খবর', maps: 'মানচিত্র' },
		aiOverview: 'এআই সারসংক্ষেপ',
		aiMode: 'এআই মোড',
		aiBadge: 'সন্ধান এআই',
		aiGenerating: 'সন্ধান এআই ইন্টারনেট থেকে উত্তর তৈরি করছে...',
		aiSources: 'উৎসসমূহ',
		relatedQuestions: 'সম্পর্কিত প্রশ্ন',
		copyAnswer: 'উত্তর কপি করুন',
		copied: 'কপি করা হয়েছে!',
		privacyNote: 'এই অনুসন্ধান প্রক্রিয়ায় কোনো ব্যবহারকারী ট্র্যাকার ব্যবহৃত হয়নি।',
		nav: { search: 'সার্চ', dashboard: 'ড্যাশবোর্ড', launch: 'ঘোষণা' }
	},
	en: {
		appName: 'sandhan',
		tagline: 'Search with confidence — your queries belong solely to you',
		searchPlaceholder: 'Search… (e.g. Rabindranath Tagore, 25 * 48, !w Bangladesh)',
		searchBtn: 'Search',
		instantCalculation: 'Calculation Result',
		didYouMean: 'Did you mean',
		whyThisResult: 'Why this result?',
		whyTitle: 'Ranking Signals Breakdown',
		incognitoView: 'Anonymous View',
		source: 'Source',
		tabs: { all: 'All', images: 'Images', videos: 'Videos', news: 'News', maps: 'Maps' },
		aiOverview: 'AI Overview',
		aiMode: 'AI Mode',
		aiBadge: 'Sandhan AI',
		aiGenerating: 'Sandhan AI is synthesizing an answer from the web...',
		aiSources: 'Sources',
		relatedQuestions: 'Related Questions',
		copyAnswer: 'Copy Answer',
		copied: 'Copied!',
		privacyNote: 'Zero trackers or profiling cookies were used in this search.',
		nav: { search: 'Search', dashboard: 'Dashboard', launch: 'Launch' }
	},
	hi: {
		appName: 'संधान',
		tagline: 'खोजें निश्चिंत होकर — आपकी खोज केवल आपकी है',
		searchPlaceholder: 'खोजें… (उदा: रवींद्रनाथ टैगोर, 25 * 48, !w भारत)',
		searchBtn: 'खोजें',
		instantCalculation: 'गणना परिणाम',
		didYouMean: 'क्या आपका मतलब था',
		whyThisResult: 'यह परिणाम क्यों?',
		whyTitle: 'रैंकिंग सिग्नल विश्लेषण',
		incognitoView: 'अज्ञात दृश्य',
		source: 'स्रोत',
		tabs: { all: 'सभी', images: 'छवियां', videos: 'वीडियो', news: 'समाचार', maps: 'मानचित्र' },
		aiOverview: 'एआई सारांश',
		aiMode: 'एआई मोड',
		aiBadge: 'संधान एआई',
		aiGenerating: 'संधान एआई इंटरनेट से उत्तर तैयार कर रहा है...',
		aiSources: 'स्रोत',
		relatedQuestions: 'संबंधित प्रश्न',
		copyAnswer: 'उत्तर कॉपी करें',
		copied: 'कॉपी किया गया!',
		privacyNote: 'इस खोज प्रक्रिया में कोई उपयोगकर्ता ट्रैकर उपयोग नहीं किया गया।',
		nav: { search: 'खोज', dashboard: 'डैशबोर्ड', launch: 'लॉन्च' }
	}
};

import { writable } from 'svelte/store';

let initialLocale: Locale = 'bn';
if (typeof localStorage !== 'undefined') {
	const saved = localStorage.getItem('sandhan_locale') as Locale;
	if (saved && translations[saved]) {
		initialLocale = saved;
	}
}

let currentLocale: Locale = initialLocale;
export const localeStore = writable<Locale>(initialLocale);

export function setLocale(locale: Locale): void {
	if (translations[locale]) {
		currentLocale = locale;
		localeStore.set(locale);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('sandhan_locale', locale);
		}
	}
}

export function getLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('sandhan_locale') as Locale;
		if (saved && translations[saved]) {
			return saved;
		}
	}
	return currentLocale;
}

export function t(key: string, locale?: Locale): string {
	const loc = locale || getLocale();
	const keys = key.split('.');
	let current: any = translations[loc] || translations.bn;

	for (const k of keys) {
		if (current && typeof current === 'object' && k in current) {
			current = current[k];
		} else {
			return key;
		}
	}

	return typeof current === 'string' ? current : key;
}

