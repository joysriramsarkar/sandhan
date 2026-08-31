/**
 * Sandhan AI Assist & Question Intent Detector
 */

export interface AiSourceCitation {
	index: number;
	title: string;
	url: string;
	domain: string;
	snippet: string;
}

export interface AiAnswerResponse {
	query: string;
	answer: string;
	sources: AiSourceCitation[];
	relatedQuestions: string[];
	confidence: number;
	model: string;
}

const QUESTION_PATTERNS_BN = [
	/\?$/,
	/^(কি|কী|কেন|কীভাবে|কিভাবে|কোথায়|কোথায়|কখন|কে|কাকে|কার|কোন|কোনটি|কত|কতো)/i,
	/(কী|কি|কেন|কীভাবে|কিভাবে|কোথায়|কোথায়|কখন|কে|কার|কোন|কত|কতো)(\s+|$)/i,
	/(ব্যাখ্যা|সম্পর্কে বলুন|পার্থক্য|ইতিহাস|অর্থ|মানে কী|কারণ কী|কী বোঝায়)/i
];

const QUESTION_PATTERNS_EN = [
	/\?$/,
	/^(what|why|how|who|where|when|which|whose|whom|is|are|can|could|does|do|did|explain|tell me|define|difference between|guide to|summary of)/i,
	/(what is|how to|why does|who is|where is|when was|difference between)/i
];

const QUESTION_PATTERNS_HI = [
	/\?$/,
	/^(क्या|क्यों|कैसे|कहाँ|कब|कौन|किसका|कितना|बताइए|समझाइए)/i,
	/(क्या है|कैसे करें|क्यों होता है|मतलब क्या है)/i
];

export function isQuestionQuery(query: string, lang = 'bn'): boolean {
	const trimmed = query.trim();
	if (!trimmed) return false;
	if (trimmed.endsWith('?')) return true;

	const patterns =
		lang === 'en'
			? QUESTION_PATTERNS_EN
			: lang === 'hi'
				? QUESTION_PATTERNS_HI
				: [...QUESTION_PATTERNS_BN, ...QUESTION_PATTERNS_EN];

	return patterns.some((p) => p.test(trimmed));
}

export async function fetchAiOverview(
	query: string,
	lang = 'bn',
	results: any[] = [],
	knowledge?: any
): Promise<AiAnswerResponse | null> {
	try {
		const res = await fetch('/api/ai', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, lang, results, knowledge })
		});

		if (!res.ok) return null;
		return await res.json();
	} catch (err) {
		console.warn('AI overview fetch failed:', err);
		return null;
	}
}
