/**
 * Universal NLP Question Answering & Fact Extraction Pipeline
 * Accurately analyzes query intent, extracts core facts, cleans noise,
 * eliminates quiz questions, and synthesizes authoritative, direct answers.
 */

export interface SourceItem {
	index: number;
	title: string;
	url: string;
	domain: string;
	snippet: string;
}

export type QuestionIntent =
	| 'PERSON'
	| 'DATE_TIME'
	| 'NUMBER_QUANTITY'
	| 'MEASUREMENT'
	| 'LOCATION'
	| 'DEFINITION'
	| 'REASON'
	| 'METHOD'
	| 'COLOR_CODE'
	| 'GENERAL';

export interface ScoredSentence {
	text: string;
	sourceIndex: number;
	score: number;
	hasAnswerCue: boolean;
}

const STOPWORDS_BN = new Set([
	'কত', 'কি', 'কী', 'কেন', 'কীভাবে', 'কিভাবে', 'কোথায়', 'কোথায়', 'কখন', 'কবে', 'কে', 'কার', 'কোন', 'কোনটি',
	'কাকে', 'বলে', 'হলো', 'হল', 'হচ্ছে', 'এর', 'একটি', 'বা', 'এবং', 'ও', 'থেকে', 'দ্বারা', 'দিয়ে', 'জন্য',
	'হতে', 'পর্যন্ত', 'থাকলে', 'করলে', 'যদি', 'তবে', 'তা', 'যে', 'সে', 'তিনি', 'তারা', 'আমরা', 'মান', 'সংখ্যা'
]);

const STOPWORDS_EN = new Set([
	'what', 'why', 'who', 'how', 'when', 'where', 'which', 'whom', 'whose', 'is', 'are', 'was', 'were',
	'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'by', 'with', 'from', 'about',
	'value', 'number', 'count'
]);

export function detectQuestionIntent(query: string): QuestionIntent {
	const qLow = query.toLowerCase().trim();

	if (qLow.includes('rgb') || qLow.includes('hex') || qLow.includes('hsl') || qLow.includes('রঙের কোড') || qLow.includes('কালার কোড')) {
		return 'COLOR_CODE';
	}
	if (/(?:(?:^|\s)(?:কখন|কবে|আজকে|আজকের|কালকে|তারিখ|বার|দিন|সময়|ঘড়িতে|কয়টা বাজে)(?:\s|$|\?)|কত সালে|কোন বছর|সাল|বছর|\b(?:when|what day|today|tomorrow|yesterday|what time|what date|which year|date|time)\b)/i.test(qLow)) {
		return 'DATE_TIME';
	}
	if (/(?:(?:^|\s)(?:কে|কার|কাকে|কারা)(?:\s|$|\?)|রচয়িতা|লেখক|আবিষ্কারক|প্রতিষ্ঠাতা|জনক|\b(?:who|whom|whose|inventor|founder|author)\b)/i.test(qLow)) {
		return 'PERSON';
	}
	if (/(?:দৈর্ঘ্য|উচ্চতা|দূরত্ব|ওজন|ব্যাস|পরিধি|আয়তন|আয়তন|ক্ষেত্রফল|উষ্ণতা|তাপমাত্রা|গতিবেগ|কত মিটার|কত কিমি|কত ফুট|কত ডিগ্রি|height|length|distance|weight|speed|temperature|area|volume)/i.test(qLow)) {
		return 'MEASUREMENT';
	}
	if (/(?:কত|কয়টা|কয়টি|কতটি|সংখ্যা|how many|how much|total count|number of)/i.test(qLow)) {
		return 'NUMBER_QUANTITY';
	}
	if (/(?:কোথায়|কোথায়|কোন দেশে|কোন স্থানে|রাজধানী|অবস্থিত|where|location|capital|situated)/i.test(qLow)) {
		return 'LOCATION';
	}
	if (/(?:কেন|কী কারণে|কারণ কী|why|reason for|what causes)/i.test(qLow)) {
		return 'REASON';
	}
	if (/(?:কীভাবে|কিভাবে|কেমন করে|পদ্ধতি|নিয়ম|how to|process of|mechanism)/i.test(qLow)) {
		return 'METHOD';
	}
	if (/(?:কী|কি|কাকে বলে|বলতে কী বোঝায়|সংজ্ঞা|অর্থ কী|what is|define|definition|meaning of)/i.test(qLow)) {
		return 'DEFINITION';
	}

	return 'GENERAL';
}

export function cleanText(text: string): string {
	return (text || '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

export function cleanBoilerplateFromSentence(sentence: string): string {
	return sentence
		.replace(/Updated:\s*\d+\s*(?:months?|days?|years?|hours?)\s*ago/gi, '')
		.replace(/\b\d+\s*(?:months?|days?|years?)\s*ago\b/gi, '')
		.replace(/MCQ:\s*\d+|CQ:\s*\d+|Practice\s+[\u0980-\u09FF\w\s]+/gi, '')
		.replace(/Md\s+[A-Za-z\s\.]+\d+\s*(?:months?|days?)\s*ago/gi, '')
		.replace(/(?:অষ্টম|নবম|দশম|একাদশ|দ্বাদশ)\s*শ্রেণি\s*(?:বিজ্ঞান|পদার্থ|রসায়ন|জীববিজ্ঞান)?/gi, '')
		.replace(/^(?:বিদ্যুৎ ছাড়া আধুনিক জীবন কল্পনা করা কঠিন|কখনো ভেবেছেন|অনেকের মাথায় একটি প্রশ্ন থাকে যে|এই লেখাটিতে.*?আলোচনা করা হবে|Step \d+).*?[।.\n]/gi, '')
		.replace(/^(?:Hello|In this article|Have you ever wondered).*?[।.\n]/gi, '')
		.replace(/^(?:উত্তর:|প্রশ্ন:|জ্ঞানমূলক:|অনুধাবনমূলক:|সংক্ষিপ্ত প্রশ্ন:?)/gi, '')
		.replace(/\((?:সংক্ষিপ্ত প্রশ্ন|জ্ঞানমূলক|অনুধাবনমূলক|বহুনির্বাচনি|সৃজনশীল)\)/gi, '')
		.replace(/(?:প্রশ্নউত্তর\s*টীম|প্রশ্নোত্তর\s*টিম|Author:|Posted by|Leave a reply|Write a Comment|\d+\s*min\s*read).*$/gi, '')
		.replace(/(?:জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)\s*\d+,\s*\d{4}.*$/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function splitIntoSentences(text: string): string[] {
	const cleaned = cleanText(text);
	// Split on Bengali dari (।), period, question mark, exclamation, or newline
	const raw = cleaned.split(/(?<=[।?!.\n])\s+/);
	const result: string[] = [];

	for (const r of raw) {
		const s = cleanBoilerplateFromSentence(r);
		
		// STRICT FILTER: Discard any sentence that is actually a question!
		if (s.includes('?') || /(?:কত\?|কী\?|কি\?|কাকে বলে\?|কেমন\?|কেন\?)/.test(s)) {
			continue;
		}

		// Discard sentences that end with interrogative question phrasing
		if (/(?:কত|কী|কি|কোথায়|কখন|কবে|কেন)$/.test(s)) {
			continue;
		}

		const wordCount = s.split(/\s+/).length;
		if (s.length >= 22 && wordCount >= 4 && s.length <= 350) {
			result.push(s);
		}
	}
	return result;
}

export function scoreSentences(
	query: string,
	intent: QuestionIntent,
	sources: SourceItem[]
): ScoredSentence[] {
	const qTokens = query
		.toLowerCase()
		.replace(/["'?,.;:!()[\]{}<>`~@#$%^&*+=_\-|\\/]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 1 && !STOPWORDS_BN.has(w) && !STOPWORDS_EN.has(w));

	const scored: ScoredSentence[] = [];
	const seenSentence = new Set<string>();

	for (const src of sources) {
		const fullText = `${src.title}. ${src.snippet}`;
		const sentences = splitIntoSentences(fullText);

		for (const sent of sentences) {
			const sentNorm = sent.toLowerCase();
			if (seenSentence.has(sentNorm)) continue;
			seenSentence.add(sentNorm);

			// If query is in Bengali but sentence has NO Bengali characters, discard it
			const isQueryBn = /[\u0980-\u09FF]/.test(query);
			const hasBnInSentence = /[\u0980-\u09FF]/.test(sent);
			if (isQueryBn && !hasBnInSentence) {
				continue;
			}

			let score = 0;
			let matchCount = 0;

			for (const token of qTokens) {
				if (sentNorm.includes(token)) {
					score += 3.0;
					matchCount++;
				}
			}

			if (matchCount === 0 && qTokens.length > 0) continue;

			let hasAnswerCue = false;

			// Intent-based cue boosting
			if (intent === 'PERSON') {
				if (/(?:আবিষ্কার করেন|প্রতিষ্ঠা করেন|রচনা করেন|লেখক|বিজ্ঞানী|জনক|রচয়িতা|কবি|পরিচালক|লিখেছেন|invented|discovered|written by|founded by)/i.test(sent)) {
					score += 6.0;
					hasAnswerCue = true;
				}
			} else if (intent === 'DATE_TIME') {
				if (/(?:\b(?:১৯|২০|১৮|১৭|১৬)\d{2}\b|\b(?:19|20|18|17|16)\d{2}\b|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i.test(sent)) {
					score += 6.0;
					hasAnswerCue = true;
				}
			} else if (intent === 'MEASUREMENT' || intent === 'NUMBER_QUANTITY') {
				if (/(?:\d+|[০-৯]+)\s*(?:টি|টি\b|জন|কিলোমিটার|কিমি|মিটার|ফুট|গ্রাম|কেজি|বর্গ|শতাংশ|ডিগ্রি|ডিগ্রী|কেলভিন|সেলসিয়াস|সেলসিয়াস|%|°|km|m|ft|kg|c|k)/i.test(sent)) {
					score += 6.0;
					hasAnswerCue = true;
				}
			} else if (intent === 'DEFINITION') {
				if (/(?:হলো|হচ্ছে|বলা হয়|একটি|বলতে বোঝায়|is a|is defined as|refers to)/i.test(sent)) {
					score += 5.0;
					hasAnswerCue = true;
				}
			} else if (intent === 'REASON') {
				if (/(?:কারণ|ফলে|কারণে|উদ্দেশ্যে|because|due to|as a result)/i.test(sent)) {
					score += 5.0;
					hasAnswerCue = true;
				}
			}

			// Prioritize "মোট" (Total) when asking about overall dimensions / area / volume / count
			if ((intent === 'MEASUREMENT' || intent === 'NUMBER_QUANTITY') && /(?:মোট|সর্বমোট|total|overall)/i.test(sent)) {
				score += 6.0;
			}

			// Prioritize first-party sources
			if (src.domain.includes('wikipedia.org')) {
				score += 3.0;
			}

			scored.push({
				text: sent,
				sourceIndex: src.index,
				score,
				hasAnswerCue
			});
		}
	}

	return scored.sort((a, b) => b.score - a.score);
}

export function synthesizeIntelligentAnswer(
	query: string,
	lang: string,
	sources: SourceItem[]
): { answer: string; relatedQuestions: string[] } {
	const cleanQ = query.trim().replace(/\?+$/, '');
	const intent = detectQuestionIntent(query);

	if (sources.length === 0) {
		return {
			answer: `**${cleanQ}** সম্পর্কিত তথ্য ইন্টারনেটে অনুসন্ধান করা হয়েছে। নির্দিষ্ট কোনো উন্মুক্ত উৎস মেলেনি।`,
			relatedQuestions: [`${cleanQ} সম্পর্কিত বিস্তারিত`, `${cleanQ} এর অর্থ কী?`]
		};
	}

	const ranked = scoreSentences(query, intent, sources);

	if (ranked.length === 0) {
		const top = sources[0];
		return {
			answer: `${cleanBoilerplateFromSentence(top.snippet)} [${top.index}]`,
			relatedQuestions: [`${cleanQ} এর বিস্তারিত তথ্য`, `${cleanQ} সম্পর্কিত আরও জানুন`]
		};
	}

	// Pick top answer sentence and distinct supporting points
	const leadSentenceObj = ranked[0];
	const supporting = ranked
		.slice(1)
		.filter((s) => s.text !== leadSentenceObj.text && !s.text.includes(leadSentenceObj.text))
		.slice(0, 3);

	let answer = '';
	const isBn = lang === 'bn';

	if (isBn) {
		// Clean and natural answer opening (NO robotic 'সরাসরি উত্তর' header!)
		answer = `**${leadSentenceObj.text}** [${leadSentenceObj.sourceIndex}]`;

		if (supporting.length > 0) {
			const bulletPoints = supporting.map(
				(s) => `* ${s.text} [${s.sourceIndex}]`
			);
			answer += `\n\n### মূল বিষয় ও বিস্তারিত তথ্য:\n${bulletPoints.join('\n')}`;
		}
	} else if (lang === 'hi') {
		answer = `**${leadSentenceObj.text}** [${leadSentenceObj.sourceIndex}]`;
		if (supporting.length > 0) {
			const bulletPoints = supporting.map(
				(s) => `* ${s.text} [${s.sourceIndex}]`
			);
			answer += `\n\n### मुख्य विवरण:\n${bulletPoints.join('\n')}`;
		}
	} else {
		answer = `**${leadSentenceObj.text}** [${leadSentenceObj.sourceIndex}]`;
		if (supporting.length > 0) {
			const bulletPoints = supporting.map(
				(s) => `* ${s.text} [${s.sourceIndex}]`
			);
			answer += `\n\n### Key Highlights:\n${bulletPoints.join('\n')}`;
		}
	}

	const relatedQuestions = generateContextualQuestions(cleanQ, intent, isBn);

	return { answer, relatedQuestions };
}

function generateContextualQuestions(cleanQ: string, intent: QuestionIntent, isBn: boolean): string[] {
	if (isBn) {
		if (intent === 'PERSON') {
			return [
				`${cleanQ} এর জন্ম ও কর্মজীবন কী?`,
				`${cleanQ} এর অন্যান্য বিখ্যাত কাজ বা অবদান কী কী?`,
				`${cleanQ} সম্পর্কিত আরও জানুন`
			];
		}
		if (intent === 'DATE_TIME') {
			return [
				`${cleanQ} এর ঐতিহাসিক প্রেক্ষাপট কী ছিল?`,
				`${cleanQ} এর গুরুত্ব ও তাৎপর্য কী?`
			];
		}
		if (intent === 'MEASUREMENT' || intent === 'NUMBER_QUANTITY') {
			return [
				`${cleanQ} এর পরিমাপ কীভাবে করা হয়?`,
				`${cleanQ} সম্পর্কিত অন্যান্য বৈজ্ঞানিক তথ্য`
			];
		}
		return [
			`${cleanQ} এর ইতিহাস ও প্রেক্ষাপট কী?`,
			`${cleanQ} এর প্রধান বৈশিষ্ট্যসমূহ কী কী?`,
			`${cleanQ} সম্পর্কে আরও জানুন`
		];
	} else {
		return [
			`What is the history of ${cleanQ}?`,
			`Key facts and background of ${cleanQ}`,
			`Learn more about ${cleanQ}`
		];
	}
}
