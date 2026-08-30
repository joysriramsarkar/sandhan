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
		historyTitle: 'এনক্রিপ্টেড ইতিহাস',
		historyDesc: 'প্রতিটি সার্চ আপনার ব্রাউজারে AES-256-GCM দিয়ে সুরক্ষিত।',
		unlock: 'আনলক',
		clear: 'মুছুন',
		noHistory: 'কোনো অনুসন্ধানের ইতিহাস নেই।',
		source: 'উৎস',
		tabs: { all: 'সব', images: 'ছবি', videos: 'ভিডিও', news: 'খবর', maps: 'মানচিত্র' },
		privacyNote: 'এই অনুসন্ধান প্রক্রিয়ায় কোনো ব্যবহারকারী ট্র্যাকার ব্যবহৃত হয়নি।',
		nav: { search: 'সার্চ', blueprint: 'নীলনকশা', crypto: 'ক্রিপ্টো ল্যাব', judge: 'মানব-রায়', dashboard: 'ড্যাশবোর্ড', design: 'ডিজাইন', launch: 'ঘোষণা' }
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
		historyTitle: 'Encrypted History',
		historyDesc: 'Every query is encrypted in your browser using AES-256-GCM.',
		unlock: 'Unlock',
		clear: 'Clear',
		noHistory: 'No search history entries found.',
		source: 'Source',
		tabs: { all: 'All', images: 'Images', videos: 'Videos', news: 'News', maps: 'Maps' },
		privacyNote: 'Zero trackers or profiling cookies were used in this search.',
		nav: { search: 'Search', blueprint: 'Blueprint', crypto: 'Crypto Lab', judge: 'Judge', dashboard: 'Dashboard', design: 'Design', launch: 'Launch' }
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
		historyTitle: 'एन्क्रिप्टेड इतिहास',
		historyDesc: 'प्रत्येक खोज आपके ब्राउज़र में AES-256-GCM द्वारा सुरक्षित है।',
		unlock: 'अनलॉक',
		clear: 'मिटाएं',
		noHistory: 'कोई खोज इतिहास नहीं मिला।',
		source: 'स्रोत',
		tabs: { all: 'सभी', images: 'छवियां', videos: 'वीडियो', news: 'समाचार', maps: 'मानचित्र' },
		privacyNote: 'इस खोज प्रक्रिया में कोई उपयोगकर्ता ट्रैकर उपयोग नहीं किया गया।',
		nav: { search: 'खोज', blueprint: 'ब्लूप्रिंट', crypto: 'क्रिप्टो लैब', judge: 'जज', dashboard: 'डैशबोर्ड', design: 'डिज़ाइन', launch: 'लॉन्च' }
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

