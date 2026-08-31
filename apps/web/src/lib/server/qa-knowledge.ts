/**
 * Sandhan Direct QA Knowledge & Fact Reasoning Engine
 */

export interface DirectAnswerResult {
	answer: string;
	relatedQuestions: string[];
	sourceTitle?: string;
	sourceUrl?: string;
	sourceDomain?: string;
	sourceSnippet?: string;
}

interface ColorDef {
	namesBn: string[];
	nameEn: string;
	hex: string;
	rgb: [number, number, number];
	hsl: [number, number, number];
	cmyk: [number, number, number, number];
	shades?: Array<{ nameBn: string; hex: string; rgb: string }>;
}

const COLOR_DATABASE: ColorDef[] = [
	{
		namesBn: ['গোলাপি', 'গোলাপী', 'পিংক', 'গোলাপী রঙের', 'গোলাপি রঙের'],
		nameEn: 'Pink',
		hex: '#FFC0CB',
		rgb: [255, 192, 203],
		hsl: [350, 100, 88],
		cmyk: [0, 25, 20, 0],
		shades: [
			{ nameBn: 'হালকা গোলাপি (Light Pink)', hex: '#FFB6C1', rgb: 'rgb(255, 182, 193)' },
			{ nameBn: 'হট পিংক (Hot Pink)', hex: '#FF69B4', rgb: 'rgb(255, 105, 180)' },
			{ nameBn: 'গাঢ় গোলাপি (Deep Pink)', hex: '#FF1493', rgb: 'rgb(255, 20, 147)' }
		]
	},
	{
		namesBn: ['লাল', 'রেড', 'লাল রঙের'],
		nameEn: 'Red',
		hex: '#FF0000',
		rgb: [255, 0, 0],
		hsl: [0, 100, 50],
		cmyk: [0, 100, 100, 0],
		shades: [
			{ nameBn: 'গাঢ় লাল (Dark Red)', hex: '#8B0000', rgb: 'rgb(139, 0, 0)' },
			{ nameBn: 'ক্রিমসন (Crimson)', hex: '#DC143C', rgb: 'rgb(220, 20, 60)' }
		]
	},
	{
		namesBn: ['সবুজ', 'গ্রিন', 'সবুজ রঙের'],
		nameEn: 'Green',
		hex: '#008000',
		rgb: [0, 128, 0],
		hsl: [120, 100, 25],
		cmyk: [100, 0, 100, 50],
		shades: [
			{ nameBn: 'লাইম সবুজ (Lime)', hex: '#00FF00', rgb: 'rgb(0, 255, 0)' },
			{ nameBn: 'গাঢ় সবুজ (Dark Green)', hex: '#006400', rgb: 'rgb(0, 100, 0)' },
			{ nameBn: 'জলপাই সবুজ (Olive)', hex: '#808000', rgb: 'rgb(128, 128, 0)' }
		]
	},
	{
		namesBn: ['নীল', 'ব্লু', 'নীল রঙের'],
		nameEn: 'Blue',
		hex: '#0000FF',
		rgb: [0, 0, 255],
		hsl: [240, 100, 50],
		cmyk: [100, 100, 0, 0],
		shades: [
			{ nameBn: 'নেভি ব্লু (Navy Blue)', hex: '#000080', rgb: 'rgb(0, 0, 128)' },
			{ nameBn: 'রয়্যাল ব্লু (Royal Blue)', hex: '#4169E1', rgb: 'rgb(65, 105, 225)' },
			{ nameBn: 'আকাশি নীল (Sky Blue)', hex: '#87CEEB', rgb: 'rgb(135, 206, 235)' }
		]
	},
	{
		namesBn: ['হলুদ', 'ইয়েলো', 'হলুদ রঙের'],
		nameEn: 'Yellow',
		hex: '#FFFF00',
		rgb: [255, 255, 0],
		hsl: [60, 100, 50],
		cmyk: [0, 0, 100, 0],
		shades: [
			{ nameBn: 'সোনালি হলুদ (Gold)', hex: '#FFD700', rgb: 'rgb(255, 215, 0)' },
			{ nameBn: 'হালকা হলুদ (Light Yellow)', hex: '#FFFFE0', rgb: 'rgb(255, 255, 224)' }
		]
	},
	{
		namesBn: ['কমলা', 'অরেঞ্জ', 'কমলা রঙের'],
		nameEn: 'Orange',
		hex: '#FFA500',
		rgb: [255, 165, 0],
		hsl: [39, 100, 50],
		cmyk: [0, 35, 100, 0]
	},
	{
		namesBn: ['বেগুনি', 'বেগুনী', 'পার্পল', 'ভায়োলেট'],
		nameEn: 'Purple / Violet',
		hex: '#800080',
		rgb: [128, 0, 128],
		hsl: [300, 100, 25],
		cmyk: [0, 100, 0, 50],
		shades: [
			{ nameBn: 'ভায়োলেট (Violet)', hex: '#EE82EE', rgb: 'rgb(238, 130, 238)' },
			{ nameBn: 'ল্যাভেন্ডার (Lavender)', hex: '#E6E6FA', rgb: 'rgb(230, 230, 250)' }
		]
	},
	{
		namesBn: ['কালো', 'ব্ল্যাক'],
		nameEn: 'Black',
		hex: '#000000',
		rgb: [0, 0, 0],
		hsl: [0, 0, 0],
		cmyk: [0, 0, 0, 100]
	},
	{
		namesBn: ['সাদা', 'হোয়াইট'],
		nameEn: 'White',
		hex: '#FFFFFF',
		rgb: [255, 255, 255],
		hsl: [0, 0, 100],
		cmyk: [0, 0, 0, 0]
	},
	{
		namesBn: ['ধূসর', 'গ্রে', 'ছাই'],
		nameEn: 'Gray',
		hex: '#808080',
		rgb: [128, 128, 128],
		hsl: [0, 0, 50],
		cmyk: [0, 0, 0, 50]
	},
	{
		namesBn: ['বাদামি', 'বাদামী', 'ব্রাউন'],
		nameEn: 'Brown',
		hex: '#A52A2A',
		rgb: [165, 42, 42],
		hsl: [0, 59, 41],
		cmyk: [0, 75, 75, 35]
	},
	{
		namesBn: ['সায়ান', 'আসমানি'],
		nameEn: 'Cyan',
		hex: '#00FFFF',
		rgb: [0, 255, 255],
		hsl: [180, 100, 50],
		cmyk: [100, 0, 0, 0]
	},
	{
		namesBn: ['ম্যাজেন্টা'],
		nameEn: 'Magenta',
		hex: '#FF00FF',
		rgb: [255, 0, 255],
		hsl: [300, 100, 50],
		cmyk: [0, 100, 0, 0]
	}
];

const INVENTIONS_AND_DISCOVERIES: Array<{
	keywords: string[];
	targetBn: string;
	answerBn: string;
	answerEn: string;
	relatedBn: string[];
	relatedEn: string[];
	wikiSlug: string;
}> = [
	{
		keywords: ['ইলেকট্রিসিটি', 'বিদ্যুৎ', 'তড়িৎ', 'electricity', 'বিদ্যুত'],
		targetBn: 'বিদ্যুৎ / ইলেকট্রিসিটি আবিষ্কার',
		answerBn:
			`বিদ্যুৎ (ইলেকট্রিসিটি) কোনো একক ব্যক্তি উদ্ভাবন করেননি, কারণ এটি প্রকৃতির একটি মৌলিক শক্তি। তবে বিদ্যুতের বৈজ্ঞানিক পর্যবেক্ষণ ও গবেষণায় সবচেয়ে ঐতিহাসিক অবদান রাখেন **বেঞ্জামিন ফ্রাঙ্কলিন (Benjamin Franklin)**, যিনি ১৭৫২ সালে বিখ্যাত ঘুড়ি ও চাবির পরীক্ষার মাধ্যমে প্রমাণ করেন যে আকাশের বজ্রপাত আসলে এক ধরণের বিদ্যুৎ।\n\n### প্রধান ঐতিহাসিক অবদানসমূহ:\n* **উইলিয়াম গিলবার্ট (১৬০০ সাল)**: তিনি প্রথম 'Electricus' (Electricity) শব্দটি প্রবর্তন করেন এবং ভূ-চৌম্বকত্ব ও স্থির বিদ্যুৎ নিয়ে বিস্তারিত গবেষণা করেন।\n* **বেঞ্জামিন ফ্রাঙ্কলিন (১৭৫২ সাল)**: ধনাত্মক (+) ও ঋণাত্মক (-) চার্জের ধারণা দেন।\n* **আলেসান্দ্রো ভোল্টা (১৮০০ সাল)**: বিশ্বের প্রথম বৈদ্যুতিক ব্যাটারি (ভোল্টাইক পাইল) আবিষ্কার করেন।\n* **মাইকেল ফ্যারাডে (১৮৩১ সাল)**: তড়িৎচৌম্বক আবেশ আবিষ্কার করেন, যার ওপর ভিত্তি করে আজকের বৈদ্যুতিক জেনারেটর ও মোটর কাজ করে।\n* **টমাস এডিসন ও নিকোলা টেসলা (১৯শ শতাব্দী)**: ডিসি (DC) ও এসি (AC) বিদ্যুৎ ব্যবস্থায় মানব সভ্যতায় বিদ্যুতের বাণিজ্যিক বিপ্লব ঘটান।`,
		answerEn:
			`Electricity was not invented by a single person because it is a fundamental force of nature. However, **Benjamin Franklin** is widely credited with major scientific breakthroughs in 1752 through his famous kite and key experiment proving that lightning is electricity.\n\n### Key Historical Milestones:\n* **William Gilbert (1600)**: Coined the term 'Electricus' and studied static electricity.\n* **Alessandro Volta (1800)**: Invented the first electrical battery (Voltaic Pile).\n* **Michael Faraday (1831)**: Discovered electromagnetic induction, enabling generators and motors.\n* **Nikola Tesla & Thomas Edison**: Developed AC and DC power distribution.`,
		relatedBn: [
			'বেঞ্জামিন ফ্রাঙ্কলিনের ঘুড়ির পরীক্ষা কী ছিল?',
			'মাইকেল ফ্যারাডে কীভাবে বিদ্যুৎ তৈরি করেছিলেন?',
			'এসি (AC) ও ডিসি (DC) বিদ্যুতের মধ্যে পার্থক্য কী?'
		],
		relatedEn: [
			'How did Benjamin Franklin discover electricity?',
			'What is Michael Faraday\'s contribution to electricity?',
			'Difference between AC and DC electricity'
		],
		wikiSlug: 'Electricity'
	},
	{
		keywords: ['টেলিফোন', 'telephone', 'ফোন'],
		targetBn: 'টেলিফোন আবিষ্কার',
		answerBn:
			`টেলিফোন আবিষ্কার করেন স্কটিশ বংশোদ্ভূত বিজ্ঞানী **আলেকজান্ডার গ্রাহাম বেল (Alexander Graham Bell)**। তিনি **১৮৭৬ সালের ৭ই মার্চ** টেলিফোনের জন্য অফিসিয়াল পেটেন্ট লাভ করেন এবং ১০ই মার্চ তাঁর সহকারী টমাস ওয়াটসনকে প্রথম ঐতিহাসিক বাক্য বলেন: *"Mr. Watson, come here, I want to see you."*`,
		answerEn:
			`The telephone was invented by **Alexander Graham Bell** in **1876**. He was awarded the official patent on March 7, 1876, and made the first successful phone call to his assistant Thomas Watson.`,
		relatedBn: ['মোবাইল ফোন কে আবিষ্কার করেন?', 'টেলিগ্রাফ কে আবিষ্কার করেন?', 'আলেকজান্ডার গ্রাহাম বেলের জন্ম কত সালে?'],
		relatedEn: ['Who invented the mobile phone?', 'Who invented the telegraph?', 'When was Alexander Graham Bell born?'],
		wikiSlug: 'Telephone'
	},
	{
		keywords: ['বৈদ্যুতিক বাতি', 'বাল্ব', 'লাইট বাল্ব', 'light bulb', 'bulb'],
		targetBn: 'বৈদ্যুতিক বাল্ব আবিষ্কার',
		answerBn:
			`ব্যবহারিক ও দীর্ঘস্থায়ী বৈদ্যুতিক লাইট বাল্ব আবিষ্কার ও বাণিজ্যিকভাবে সফল করেন মার্কিন বিজ্ঞানী ও উদ্যোক্তা **টমাস আলভা এডিসন (Thomas Alva Edison)** **১৮৭৯ সালে**। তিনি কার্বন ফিলামেন্ট ব্যবহার করে এমন একটি বাল্ব তৈরি করেন যা বহু ঘণ্টা একটানা জ্বলতে পারত।`,
		answerEn:
			`The practical incandescent light bulb was invented and commercialized by **Thomas Alva Edison** in **1879** using a carbonized filament that could last for over 1,200 hours.`,
		relatedBn: ['টমাস এডিসনের অন্যান্য আবিষ্কার কী কী?', 'টেলিগ্রাফ কে আবিষ্কার করেন?', 'নিকোলা টেসলার আবিষ্কারসমূহ'],
		relatedEn: ['What else did Thomas Edison invent?', 'Who invented LED lights?', 'Tesla vs Edison facts'],
		wikiSlug: 'Incandescent_light_bulb'
	},
	{
		keywords: ['কম্পিউটার', 'computer'],
		targetBn: 'কম্পিউটার আবিষ্কার',
		answerBn:
			`কম্পিউটারের জনক বলা হয় ব্রিটিশ গণিতবিদ **চার্লস ব্যাবেজ (Charles Babbage)**-কে। তিনি ১৯শ শতাব্দীতে (১৮৩৭ সালে) প্রথম যান্ত্রিক গণনাকারী যন্ত্র **'অ্যানালিটিক্যাল ইঞ্জিন' (Analytical Engine)**-এর নকশা তৈরি করেন।\n\nআধুনিক ইলেকট্রনিক ও প্রোগ্রামেবল কম্পিউটারের ভিত্তি স্থাপন করেন **অ্যালান টুরিং (Alan Turing)** এবং প্রথম সম্পূর্ণ কার্যকর ডিজিটাল কম্পিউটার 'ENIAC' তৈরি হয় ১৯৪৫ সালে।`,
		answerEn:
			`**Charles Babbage** is considered the "Father of the Computer" for conceptualizing and designing the first mechanical computer, the Analytical Engine, in 1837. **Alan Turing** later laid the foundation of modern computer science and theoretical computing.`,
		relatedBn: ['প্রথম ডিজিটাল কম্পিউটারের নাম কী?', 'অ্যালান টুরিং কে ছিলেন?', 'কম্পিউটারের প্রধান অংশগুলো কী কী?'],
		relatedEn: ['What was the first digital computer?', 'Who was Alan Turing?', 'Who is the mother of computer programming?'],
		wikiSlug: 'Computer'
	},
	{
		keywords: ['ইন্টারনেট', 'internet', 'ওয়ার্ল্ড ওয়াইড ওয়েব', 'www'],
		targetBn: 'ইন্টারনেট আবিষ্কার',
		answerBn:
			`ইন্টারনেটের প্রটোকল ও ভিত্তি (TCP/IP) তৈরি করেন **ভিন্ট সার্ফ (Vint Cerf)** এবং **বব কান (Bob Kahn)** (১৯৭০-এর দশকে), যাদের 'ইন্টারনেটের জনক' বলা হয়।\n\nঅন্যদিকে, ওয়েবপেজ ও ব্রাউজিংয়ের জন্য **ওয়ার্ল্ড ওয়াইড ওয়েব (WWW)** আবিষ্কার করেন ব্রিটিশ বিজ্ঞানী **স্যার টিম বার্নার্স-লি (Tim Berners-Lee)** **১৯৮৯ সালে** CERN গবেষণাগারে।`,
		answerEn:
			`The core architecture of the Internet (TCP/IP protocols) was developed by **Vint Cerf** and **Bob Kahn** in the 1970s. The **World Wide Web (WWW)** was invented by British scientist **Sir Tim Berners-Lee** in **1989** at CERN.`,
		relatedBn: ['প্রথম ওয়েব ব্রাউজারের নাম কী?', 'টিম বার্নার্স-লি কে?', 'ইন্টারনেট কীভাবে কাজ করে?'],
		relatedEn: ['Who invented the first web browser?', 'What was ARPANET?', 'How does the internet work?'],
		wikiSlug: 'Internet'
	},
	{
		keywords: ['পেনিসিলিন', 'penicillin', 'অ্যান্টিবায়োটিক'],
		targetBn: 'পেনিসিলিন আবিষ্কার',
		answerBn:
			`বিশ্বের প্রথম কার্যকরী অ্যান্টিবায়োটিক **পেনিসিলিন** আবিষ্কার করেন স্কটিশ বিজ্ঞানী **স্যার আলেকজান্ডার ফ্লেমিং (Sir Alexander Fleming)** **১৯২৮ সালে**। তিনি পেনিসিলিয়াম নোটেটাম নামক ছত্রাক থেকে এটি আবিষ্কার করেন, যা চিকিৎসাবিজ্ঞানে কোটি কোটি মানুষের জীবন রক্ষা করেছে।`,
		answerEn:
			`**Sir Alexander Fleming** discovered the world\'s first antibiotic, **Penicillin**, in **1928** from the mold Penicillium notatum, revolutionizing modern medicine.`,
		relatedBn: ['অ্যান্টিবায়োটিক কীভাবে কাজ করে?', 'আলেকজান্ডার ফ্লেমিং কত সালে নোবেল পান?'],
		relatedEn: ['How do antibiotics work?', 'When did Alexander Fleming win the Nobel Prize?'],
		wikiSlug: 'Penicillin'
	},
	{
		keywords: ['মহাকর্ষ', 'মধ্যাকর্ষণ', 'gravity', 'গ্র্যাভিটি'],
		targetBn: 'মহাকর্ষ সূত্র আবিষ্কার',
		answerBn:
			`মহাকর্ষ বলের সার্বজনীন সূত্র (Law of Universal Gravitation) আবিষ্কার করেন ইংরেজ বিজ্ঞানী **স্যার আইজ্যাক নিউটন (Sir Isaac Newton)** **১৬৮৭ সালে** তাঁর বিখ্যাত গ্রন্থ *Philosophiae Naturalis Principia Mathematica*-এ। গাছ থেকে আপেল মাটিতে পড়ার ঘটনা পর্যবেক্ষণ করে তিনি এই সূত্রের সিদ্ধান্তে পৌঁছান।`,
		answerEn:
			`**Sir Isaac Newton** formulated the Universal Law of Gravitation in **1687** in his masterpiece *Principia Mathematica*, explaining how gravity governs both falling objects on Earth and planetary orbits.`,
		relatedBn: ['নিউটনের গতির ৩টি সূত্র কী কী?', 'আইনস্টাইনের আপেক্ষিকতা তত্ত্ব কী?'],
		relatedEn: ['What are Newton\'s 3 laws of motion?', 'Einstein\'s theory of general relativity'],
		wikiSlug: 'Gravity'
	},
	{
		keywords: ['রেডিও', 'বেতার', 'radio'],
		targetBn: 'রেডিও আবিষ্কার',
		answerBn:
			`রেডিও তরঙ্গ দিয়ে বার্তা পাঠানোর ক্ষেত্রে ইতালীয় বিজ্ঞানী **গুগলিয়েলমো মার্কনি (Guglielmo Marconi)** ১৮৯৫ সালে সফল হন এবং পেটেন্ট লাভ করেন।\n\nতবে বাঙালি বিজ্ঞানী **আচার্য জগদীশ চন্দ্র বসু** ১৮৯৫ সালেই কলকাতায় উদ্ভিদের বৃদ্ধি ও মিলিমিটার মাইক্রোওয়েভ বেতার তরঙ্গ আবিষ্কার করে রিমোট দিয়ে গানপাউডার জ্বালিয়ে বিশ্বকে তাক লাগিয়েছিলেন।`,
		answerEn:
			`**Guglielmo Marconi** successfully developed long-distance radio communication in 1895. Indian-Bengali polymath **Sir Jagadish Chandra Bose** was a pioneer who demonstrated microwave radio transmission in 1895 in Kolkata.`,
		relatedBn: ['জগদীশ চন্দ্র বসুর আবিষ্কারসমূহ কী কী?', 'মার্কনি কত সালে নোবেল পান?'],
		relatedEn: ['Jagadish Chandra Bose contributions', 'Marconi Nobel prize'],
		wikiSlug: 'Radio'
	},
	{
		keywords: ['মোবাইল ফোন', 'সেলফোন', 'mobile phone', 'cellphone'],
		targetBn: 'মোবাইল ফোন আবিষ্কার',
		answerBn:
			`হাতে বহনযোগ্য প্রথম মোবাইল ফোন আবিষ্কার করেন মটোরোলা (Motorola)-র প্রকৌশলী **মার্টিন কুপার (Martin Cooper)**। **১৯৭৩ সালের ৩রা এপ্রিল** তিনি নিউইয়র্কের রাস্তায় বিশ্বের প্রথম মোবাইল ফোন কলটি করেন। সেই ফোনটির মডেল ছিল Motorola DynaTAC 8000X।`,
		answerEn:
			`The first handheld mobile phone was invented by **Martin Cooper** of Motorola. On **April 3, 1973**, he made the world's first public mobile telephone call using a Motorola DynaTAC.`,
		relatedBn: ['বিশ্বের প্রথম স্মার্টফোনের নাম কী?', 'অ্যান্ড্রয়েড কে তৈরি করেন?'],
		relatedEn: ['What was the first smartphone?', 'Who founded Android?'],
		wikiSlug: 'Mobile_phone'
	},
	{
		keywords: ['উড়োজাহাজ', 'বিমান', 'উড়োজাহাজ', 'airplane', 'aeroplane'],
		targetBn: 'উড়োজাহাজ আবিষ্কার',
		answerBn:
			`বিশ্বের প্রথম সফল নিয়ন্ত্রিত ও ইঞ্জিনচালিত উড়োজাহাজ আবিষ্কার করেন আমেরিকান দুই ভাই **অরভিল রাইট এবং উইলবার রাইট (Wright Brothers)**। **১৯০৩ সালের ১৭ই ডিসেম্বর** তাঁরা প্রথম সফল ফ্লাইট সম্পন্ন করেন।`,
		answerEn:
			`The **Wright Brothers (Orville and Wilbur Wright)** invented and built the world's first successful motor-operated airplane on **December 17, 1903**.`,
		relatedBn: ['রাইট ব্রাদার্সের বিমান কতক্ষণ উড়েছিল?', 'জেট ইঞ্জিন কে আবিষ্কার করেন?'],
		relatedEn: ['How long was the Wright brothers first flight?', 'Who invented the jet engine?'],
		wikiSlug: 'Wright_brothers'
	}
];

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBnNum(n: number | string): string {
	return String(n).replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

const DAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_BN = [
	'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
	'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const MONTHS_EN = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

export function getBengaliDate(now: Date = new Date()): { day: number; monthName: string; year: number; season: string } {
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const bdDate = new Date(utc + 3600000 * 6);

	const gYear = bdDate.getFullYear();
	const isLeapYear = (gYear % 4 === 0 && gYear % 100 !== 0) || (gYear % 400 === 0);

	const bnMonths = [
		{ name: 'বৈশাখ', days: 31, season: 'গ্রীষ্ম' },
		{ name: 'জ্যৈষ্ঠ', days: 31, season: 'গ্রীষ্ম' },
		{ name: 'আষাঢ়', days: 31, season: 'বর্ষা' },
		{ name: 'শ্রাবণ', days: 31, season: 'বর্ষা' },
		{ name: 'ভাদ্র', days: 31, season: 'শরৎ' },
		{ name: 'আশ্বিন', days: 31, season: 'শরৎ' },
		{ name: 'কার্তিক', days: 30, season: 'হেমন্ত' },
		{ name: 'অগ্রহায়ণ', days: 30, season: 'হেমন্ত' },
		{ name: 'পৌষ', days: 30, season: 'শীত' },
		{ name: 'মাঘ', days: 30, season: 'শীত' },
		{ name: 'ফাল্গুন', days: isLeapYear ? 31 : 30, season: 'বসন্ত' },
		{ name: 'চৈত্র', days: 30, season: 'বসন্ত' }
	];

	const april14 = new Date(gYear, 3, 14);
	let bnYear = gYear - 593;
	let diffDays = Math.floor((bdDate.getTime() - april14.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		bnYear -= 1;
		const prevApril14 = new Date(gYear - 1, 3, 14);
		diffDays = Math.floor((bdDate.getTime() - prevApril14.getTime()) / (1000 * 60 * 60 * 24));
	}

	let monthIndex = 0;
	let day = diffDays + 1;

	for (let i = 0; i < bnMonths.length; i++) {
		if (day <= bnMonths[i].days) {
			monthIndex = i;
			break;
		}
		day -= bnMonths[i].days;
	}

	return {
		day,
		monthName: bnMonths[monthIndex].name,
		year: bnYear,
		season: bnMonths[monthIndex].season
	};
}

export function resolveGeneralKnowledge(query: string, lang = 'bn'): DirectAnswerResult | null {
	const qNorm = (query || '')
		.normalize('NFC')
		.replace(/\u09A1\u09BC/g, '\u09DC')
		.replace(/\u09A2\u09BC/g, '\u09DD')
		.replace(/\u09AF\u09BC/g, '\u09DF');
	const qLow = qNorm.toLowerCase().trim();

	// 0. Real-time Temporal: Day, Date, Time, Relative Days (Today, Tomorrow, Yesterday, Day After Tomorrow)
	const isRelativeDayQuery =
		qLow.includes('কী বার') ||
		qLow.includes('কি বার') ||
		qLow.includes('কীবার') ||
		qLow.includes('কিবার') ||
		qLow.includes('আজকের দিন') ||
		qLow.includes('কত তারিখ') ||
		qLow.includes('তারিখ কত') ||
		qLow.includes('আজকের তারিখ') ||
		qLow.includes('বাংলা তারিখ') ||
		qLow.includes('বাংলা কত') ||
		qLow.includes('বঙ্গাব্দ') ||
		qLow.includes('কয়টা বাজে') ||
		qLow.includes('কয়টা বাজে') ||
		qLow.includes('সময় কত') ||
		qLow.includes('সময় কত') ||
		qLow.includes('today date') ||
		qLow.includes("today's date") ||
		qLow.includes('tomorrow date') ||
		qLow.includes('yesterday date') ||
		qLow.includes('what day is today') ||
		qLow.includes('what day is tomorrow') ||
		qLow.includes('what day was yesterday') ||
		qLow.includes('what time is it') ||
		qLow.includes('current time');

	if (isRelativeDayQuery) {
		const now = new Date();
		const utc = now.getTime() + now.getTimezoneOffset() * 60000;
		const bdNow = new Date(utc + 3600000 * 6);

		let dayOffset = 0;
		let relLabelBn = 'আজকে';
		let relHeadingBn = 'আজকের';
		let relLabelEn = 'Today';

		if (qLow.includes('গত পরশু') || qLow.includes('day before yesterday')) {
			dayOffset = -2;
			relLabelBn = 'গত পরশু ছিল';
			relHeadingBn = 'গত পরশুর';
			relLabelEn = 'Day before yesterday was';
		} else if (qLow.includes('গতকাল') || qLow.includes('গতকল্য') || qLow.includes('yesterday')) {
			dayOffset = -1;
			relLabelBn = 'গতকাল ছিল';
			relHeadingBn = 'গতকালের';
			relLabelEn = 'Yesterday was';
		} else if (qLow.includes('পরশু') || qLow.includes('পরশুদিন') || qLow.includes('day after tomorrow')) {
			dayOffset = 2;
			relLabelBn = 'পরশু (আগামী পরশু)';
			relHeadingBn = 'পরশুর';
			relLabelEn = 'Day after tomorrow';
		} else if (
			qLow.includes('কালকে') ||
			qLow.includes('আগামীকাল') ||
			(qLow.includes('কাল') && !qLow.includes('কালার') && !qLow.includes('কালো') && !qLow.includes('কালবৈশাখী') && !qLow.includes('কালে')) ||
			qLow.includes('tomorrow')
		) {
			dayOffset = 1;
			relLabelBn = 'আগামীকাল (কালকে)';
			relHeadingBn = 'আগামীকালের';
			relLabelEn = 'Tomorrow';
		}

		const targetDate = new Date(bdNow.getTime() + dayOffset * 24 * 60 * 60 * 1000);
		const targetNow = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);

		const gDay = targetDate.getDate();
		const gMonth = targetDate.getMonth();
		const gYear = targetDate.getFullYear();
		const dayIdx = targetDate.getDay();

		const dayNameBn = DAYS_BN[dayIdx];
		const dayNameEn = DAYS_EN[dayIdx];
		const monthNameBn = MONTHS_BN[gMonth];
		const monthNameEn = MONTHS_EN[gMonth];

		const hours = bdNow.getHours();
		const minutes = bdNow.getMinutes();
		const padMin = minutes < 10 ? `0${minutes}` : `${minutes}`;
		const isPm = hours >= 12;
		const hour12 = hours % 12 || 12;
		const periodBn = hours < 6 ? 'রাত' : hours < 12 ? 'সকাল' : hours < 15 ? 'দুপুর' : hours < 18 ? 'বিকেল' : hours < 20 ? 'সন্ধ্যা' : 'রাত';

		const bnCal = getBengaliDate(targetNow);

		const isDayQuery = qLow.includes('কী বার') || qLow.includes('কি বার') || qLow.includes('কীবার') || qLow.includes('কিবার') || qLow.includes('what day');
		const isTimeQuery = qLow.includes('কয়টা বাজে') || qLow.includes('কয়টা বাজে') || qLow.includes('সময় কত') || qLow.includes('সময় কত') || qLow.includes('what time');

		if (lang === 'bn') {
			let leadAnswer = '';
			if (isTimeQuery && dayOffset === 0) {
				leadAnswer = `বর্তমানে বাংলাদেশে সময় **${periodBn} ${toBnNum(hour12)}:${toBnNum(padMin)} মিনিট** (বাংলাদেশ মান সময়, BST)।`;
			} else if (isDayQuery) {
				leadAnswer = `${relLabelBn} **${dayNameBn} (${dayNameEn})**, **${toBnNum(gDay)} ${monthNameBn} ${toBnNum(gYear)}**।`;
			} else {
				leadAnswer = `${relLabelBn} ইংরেজি তারিখ **${toBnNum(gDay)} ${monthNameBn} ${toBnNum(gYear)}** এবং বাংলা তারিখ **${toBnNum(bnCal.day)} ${bnCal.monthName} ${toBnNum(bnCal.year)} বঙ্গাব্দ**।`;
			}

			return {
				answer: `${leadAnswer}\n\n### ${relHeadingBn} পূর্ণাঙ্গ ক্যালেন্ডার ও পঞ্জিকা:\n* **বার**: ${dayNameBn} (${dayNameEn})\n* **ইংরেজি তারিখ**: ${toBnNum(gDay)} ${monthNameBn} ${toBnNum(gYear)} (${gDay} ${monthNameEn} ${gYear})\n* **বাংলা তারিখ**: ${toBnNum(bnCal.day)} ${bnCal.monthName} ${toBnNum(bnCal.year)} বঙ্গাব্দ (${bnCal.season}কাল)\n* **সময় অঞ্চল**: বাংলাদেশ মান সময় (BST, UTC+6)`,
				relatedQuestions: [
					'আজকের বাংলা তারিখ কত?',
					'কালকে কি বার?',
					'বর্তমানে কয়টা বাজে?'
				],
				sourceTitle: 'লাইভ ক্যালেন্ডার ও বাংলাদেশ মান সময় (BST)',
				sourceUrl: 'https://time.is/Bangladesh',
				sourceDomain: 'time.is',
				sourceSnippet: `তারিখ ${gDay} ${monthNameEn} ${gYear} এবং বার ${dayNameEn}।`
			};
		} else {
			let leadAnswer = '';
			if (isTimeQuery && dayOffset === 0) {
				leadAnswer = `The current time in Bangladesh is **${hour12}:${padMin} ${isPm ? 'PM' : 'AM'}** (BST, UTC+6).`;
			} else if (isDayQuery) {
				leadAnswer = `${relLabelEn} is **${dayNameEn}, ${monthNameEn} ${gDay}, ${gYear}**.`;
			} else {
				leadAnswer = `${relLabelEn}'s date is **${monthNameEn} ${gDay}, ${gYear}** (${bnCal.day} ${bnCal.monthName} ${bnCal.year} BS).`;
			}

			return {
				answer: `${leadAnswer}\n\n### Calendar Details:\n* **Day**: ${dayNameEn}\n* **Gregorian Date**: ${monthNameEn} ${gDay}, ${gYear}\n* **Bengali Date**: ${bnCal.day} ${bnCal.monthName} ${bnCal.year} BS\n* **Timezone**: Bangladesh Standard Time (BST, UTC+6)`,
				relatedQuestions: [
					'What day is tomorrow?',
					'What is the current time in Bangladesh?',
					'What is today\'s Bengali calendar date?'
				],
				sourceTitle: 'Live Calendar & Time (BST)',
				sourceUrl: 'https://time.is/Bangladesh',
				sourceDomain: 'time.is',
				sourceSnippet: `${relLabelEn} is ${dayNameEn}, ${monthNameEn} ${gDay}, ${gYear}.`
			};
		}
	}

	// 1. Color RGB & HEX Code Queries
	const isColorQuery =
		qLow.includes('rgb') ||
		qLow.includes('hex') ||
		qLow.includes('রং') ||
		qLow.includes('রঙ') ||
		qLow.includes('রঙের') ||
		qLow.includes('color') ||
		qLow.includes('মান কত') ||
		qLow.includes('কোড কত');

	if (isColorQuery) {
		for (const col of COLOR_DATABASE) {
			const matchesBn = col.namesBn.some((name) => qLow.includes(name.toLowerCase()));
			const matchesEn = qLow.includes(col.nameEn.toLowerCase());

			if (matchesBn || matchesEn) {
				const isBn = lang === 'bn';
				const shadesText = col.shades
					? `\n\n### বিভিন্ন শেডের ${col.namesBn[0]} রং:\n` +
						col.shades.map((s) => `* **${s.nameBn}**: \`${s.hex}\` | \`${s.rgb}\``).join('\n')
					: '';

				return {
					answer: isBn
						? `**${col.namesBn[0]} (${col.nameEn})** রঙের আরজিবি (RGB) মান হলো:\n**RGB(${col.rgb.join(', ')})**\n\n### রঙের প্রধান কোড ও মানসমূহ:\n* **RGB মান**: \`rgb(${col.rgb.join(', ')})\`\n* **HEX কোড**: \`${col.hex}\`\n* **HSL মান**: \`hsl(${col.hsl[0]}°, ${col.hsl[1]}%, ${col.hsl[2]}%)\`\n* **সিএমওয়াইকে (CMYK)**: \`cmyk(${col.cmyk[0]}%, ${col.cmyk[1]}%, ${col.cmyk[2]}%, ${col.cmyk[3]}%)\`${shadesText}`
						: `The RGB value for **${col.nameEn}** is **rgb(${col.rgb.join(', ')})**.\n\n### Color Codes:\n* **RGB**: \`rgb(${col.rgb.join(', ')})\`\n* **HEX**: \`${col.hex}\`\n* **HSL**: \`hsl(${col.hsl[0]}°, ${col.hsl[1]}%, ${col.hsl[2]}%)\`\n* **CMYK**: \`cmyk(${col.cmyk.join('%, ')}%)\``,
					relatedQuestions: [
						`${col.namesBn[0]} রঙের HEX কোড কত?`,
						`লাল রঙের RGB মান কত?`,
						`সবুজ রঙের RGB মান কত?`
					],
					sourceTitle: `${col.nameEn} Color Codes - RapidTables`,
					sourceUrl: `https://www.rapidtables.com/web/color/${col.nameEn.toLowerCase()}-color.html`,
					sourceDomain: 'rapidtables.com',
					sourceSnippet: `${col.nameEn} RGB color code = rgb(${col.rgb.join(',')}) and HEX = ${col.hex}.`
				};
			}
		}
	}

	// 2. Planetary Moons & Astronomy
	if (
		qLow.includes('উপগ্রহ') ||
		qLow.includes('moon') ||
		qLow.includes('satellite') ||
		qLow.includes('গ্রহ') ||
		qLow.includes('পৃথিবী') ||
		qLow.includes('earth') ||
		qLow.includes('সূর্য') ||
		qLow.includes('sun') ||
		qLow.includes('সৌরজগৎ') ||
		qLow.includes('সৌরজগত')
	) {
		// Mars / মঙ্গল গ্রহের উপগ্রহ
		if (qLow.includes('মঙ্গল') || qLow.includes('mars')) {
			return {
				answer: `মঙ্গল গ্রহের প্রাকৃতিক উপগ্রহ **২টি (দুটি)**।\n\n### উপগ্রহ দুটির নাম ও বিবরণ:\n1. **ফোবোস (Phobos)**: মঙ্গলের বৃহত্তম ও নিকটতম উপগ্রহ (ব্যাস প্রায় ২২.২ কিমি)।\n2. **ডিমোস (Deimos)**: মঙ্গলের ক্ষুদ্রতম ও দূরবর্তী উপগ্রহ (ব্যাস প্রায় ১২.৪ কিমি)।\n\nউভয় উপগ্রহই **১৮৭৭ সালে** আমেরিকান জ্যোতির্বিজ্ঞানী **আসাফ হল (Asaph Hall)** আবিষ্কার করেন।`,
				relatedQuestions: [
					'ফোবোস ও ডিমোস উপগ্রহ দুটির আকার কত?',
					'সৌরজগতের কোন গ্রহের সবচেয়ে বেশি উপগ্রহ আছে?',
					'বৃহস্পতি গ্রহের উপগ্রহ কয়টি?'
				],
				sourceTitle: 'মঙ্গল গ্রহের উপগ্রহসমূহ - উইকিপিডিয়া',
				sourceUrl: 'https://bn.wikipedia.org/wiki/Moons_of_Mars',
				sourceDomain: 'wikipedia.org',
				sourceSnippet: 'মঙ্গল গ্রহের দুটি প্রাকৃতিক উপগ্রহ রয়েছে: ফোবোস এবং ডিমোস।'
			};
		}

		// Jupiter / বৃহস্পতির উপগ্রহ
		if (qLow.includes('বৃহস্পতি') || qLow.includes('jupiter')) {
			return {
				answer: `বৃহস্পতি (Jupiter) গ্রহের মোট **৯৫টি** প্রাকৃতিক উপগ্রহ রয়েছে।\n\n### প্রধান ৪টি গ্যালিলিয়ান উপগ্রহ:\n* **গ্যানিমিড (Ganymede)**: সমগ্র সৌরজগতের বৃহত্তম উপগ্রহ (এমনকি বুধ গ্রহের চেয়েও বড়)।\n* **ক্যালিস্টো (Callisto)**: দ্বিতীয় বৃহত্তম উপগ্রহ।\n* **আইও (Io)**: সৌরজগতের সবচেয়ে সক্রিয় আগ্নেয়গিরিসমৃদ্ধ উপগ্রহ।\n* **ইউরোপা (Europa)**: বরফে ঢাকা উপগ্রহ, যার নিচে তরল পানির সমুদ্র রয়েছে।\n\n১৬১০ সালে বিজ্ঞানী **গ্যালিলিও গ্যালিলি** প্রথম এই চারটি উপগ্রহ আবিষ্কার করেন।`,
				relatedQuestions: [
					'সৌরজগতের বৃহত্তম উপগ্রহ কোনটি?',
					'শনির কয়টি উপগ্রহ রয়েছে?',
					'ইউরোপা উপগ্রহে কি প্রাণের সম্ভাবনা আছে?'
				],
				sourceTitle: 'বৃহস্পতির প্রাকৃতিক উপগ্রহসমূহ - উইকিপিডিয়া',
				sourceUrl: 'https://bn.wikipedia.org/wiki/Moons_of_Jupiter',
				sourceDomain: 'wikipedia.org',
				sourceSnippet: 'বৃহস্পতি গ্রহের মোট ৯৫টি নিশ্চিত উপগ্রহ রয়েছে।'
			};
		}

		// Saturn / শনির উপগ্রহ
		if (qLow.includes('শনি') || qLow.includes('saturn')) {
			return {
				answer: `শনি (Saturn) গ্রহের মোট **১৪৬টি** প্রাকৃতিক উপগ্রহ রয়েছে, যা সমগ্র সৌরজগতের যেকোনো গ্রহের মধ্যে সর্বাধিক।\n\n### প্রধান উপগ্রহ:\n* **টাইটান (Titan)**: শনির বৃহত্তম এবং সৌরজগতের দ্বিতীয় বৃহত্তম উপগ্রহ। সৌরজগতে একমাত্র টাইটানেরই নিজস্ব ঘন নাইট্রোজেনসমৃদ্ধ বায়ুমণ্ডল ও তরল মিথেনের হ্রদ রয়েছে।\n* **এনসেলাডাস (Enceladus)**: বরফাবৃত উপগ্রহ যাতে পানির ফোয়ারা বা গিজার দেখা যায়।`,
				relatedQuestions: ['টাইটান উপগ্রহের বৈশিষ্ট্য কী?', 'শনির বলয় কী দিয়ে তৈরি?']
			};
		}

		// Earth / পৃথিবীর উপগ্রহ ও আয়তন
		if (qLow.includes('পৃথিবী') || qLow.includes('earth')) {
			if (qLow.includes('আয়তন') || qLow.includes('আয়তন') || qLow.includes('ক্ষেত্রফল') || qLow.includes('area') || qLow.includes('surface area') || qLow.includes('ভর') || qLow.includes('ব্যাসার্ধ')) {
				return {
					answer: `সমগ্র পৃথিবীর মোট পৃষ্ঠের ক্ষেত্রফল (আয়তন) হলো প্রায় **৫১ কোটি বর্গ কিলোমিটার (৫১,০০,৯৮,৫২০ বর্গ কিমি বা প্রায় ১৯৭ মিলিয়ন বর্গ মাইল)**।\n\n### প্রধান ভৌগোলিক বিভাজন ও তথ্য:\n* **জলভাগ (মহাসাগর ও সাগর)**: প্রায় **৩৬ কোটি ১১ লক্ষ ৪৮ হাজার ২০০ বর্গ কিমি** (সমগ্র পৃথিবীর প্রায় **৭০.৮%**)।\n* **স্থলভাগ (মহাদেশ ও দ্বীপপুঞ্জ)**: প্রায় **১৪ কোটি ৮৯ লক্ষ ৫০ হাজার ৩২০ বর্গ কিমি** (সমগ্র পৃথিবীর প্রায় **২৯.২%**)।\n* **পৃথিবীর আয়তন (ঘনফল/Volume)**: প্রায় **১.০৮৩২১ × ১০¹² ঘন কিলোমিটার**।\n* **পৃথিবীর গড় ব্যাসার্ধ**: প্রায় **৬,৩৭১ কিলোমিটার**।\n* **পৃথিবীর মোট ভর**: প্রায় **৫.৯৭২ × ১০²⁴ কেজি**।`,
					relatedQuestions: [
						'পৃথিবীর জলভাগ ও স্থলভাগের অনুপাত কত?',
						'পৃথিবীর গড় ব্যাসার্ধ কত কিমি?',
						'পৃথিবীর ভর কত?'
					],
					sourceTitle: 'পৃথিবীর ক্ষেত্রফল ও আয়তন - উইকিপিডিয়া',
					sourceUrl: 'https://bn.wikipedia.org/wiki/Earth',
					sourceDomain: 'wikipedia.org',
					sourceSnippet: 'পৃথিবীর মোট ক্ষেত্রফল ৫১ কোটি বর্গ কিলোমিটার।'
				};
			}

			return {
				answer: `পৃথিবীর একমাত্র প্রাকৃতিক উপগ্রহ হলো **চাঁদ (The Moon)**। পৃথিবী থেকে চাঁদের গড় দূরত্ব প্রায় **৩,৮৪,৪০০ কিলোমিটার**। চাঁদের আলো পৃথিবীতে পৌঁছাতে প্রায় **১.৩ সেকেন্ড** সময় লাগে।`,
				relatedQuestions: ['চাঁদ থেকে পৃথিবীর দূরত্ব কত?', 'চাঁদে প্রথম কে পা রাখেন?']
			};
		}

		// Mercury & Venus / বুধ ও শুক্র
		if (qLow.includes('বুধ') || qLow.includes('শুক্র') || qLow.includes('mercury') || qLow.includes('venus')) {
			return {
				answer: `বুধ (Mercury) এবং শুক্র (Venus) গ্রহের **কোনো প্রাকৃতিক উপগ্রহ নেই (০টি)**। সৌরজগতের এই দুটি গ্রহ ছাড়া অন্য সব গ্রহেরই অন্তত একটি করে উপগ্রহ রয়েছে।`,
				relatedQuestions: ['সৌরজগতের উষ্ণতম গ্রহ কোনটি?', 'সূর্যের নিকটতম গ্রহ কোনটি?']
			};
		}

		// Sun / সূর্যের তাপমাত্রা ও উষ্ণতা
		if (qLow.includes('সূর্য') || qLow.includes('sun')) {
			if (qLow.includes('উষ্ণতা') || qLow.includes('তাপমাত্রা') || qLow.includes('temperature') || qLow.includes('গরম') || qLow.includes('হিট')) {
				return {
					answer: `সূর্যের উপরিভাগের (পৃষ্ঠদেশ বা ফটোস্ফিয়ারের) গড় তাপমাত্রা প্রায় **৫,৫০০° থেকে ৫,৭৭৮° সেলসিয়াস (প্রায় ৯,৯৩০° ফারেনহাইট বা ৫,৭৭৮ কেলভিন)**।\n\n### সূর্যের বিভিন্ন অংশের তাপমাত্রা ও মূল তথ্য:\n* **কেন্দ্রভাগের (Core) তাপমাত্রা**: প্রায় **১ কোটি ৫০ লক্ষ° সেলসিয়াস (১৫,০০০,০০০°C)**, যেখানে পারমাণবিক ফিউশন বিক্রিয়ায় শক্তি তৈরি হয়।\n* **করোনা (বাইরের বায়ুমণ্ডল)**: প্রায় **১০ লক্ষ থেকে ৩০ লক্ষ° সেলসিয়াস**।\n* **সৌরকলঙ্ক (Sunspots)**: সূর্যের অপেক্ষাকৃত শীতল অঞ্চল, যার তাপমাত্রা প্রায় **৩,৮০০° থেকে ৪,০০০° সেলসিয়াস**।\n* **পৃথিবী থেকে গড় দূরত্ব**: প্রায় **১৪ কোটি ৯৬ লক্ষ কিলোমিটার** (আলো আসতে সময় লাগে ৮ মিনিট ২০ সেকেন্ড)।`,
					relatedQuestions: [
						'সূর্যের কেন্দ্রভাগের তাপমাত্রা কত?',
						'সূর্য থেকে পৃথিবীতে আলো আসতে কত সময় লাগে?',
						'সৌরজগতের উষ্ণতম গ্রহ কোনটি?'
					],
					sourceTitle: 'সূর্যের তাপমাত্রা ও বায়ুমণ্ডল - উইকিপিডিয়া',
					sourceUrl: 'https://bn.wikipedia.org/wiki/Sun',
					sourceDomain: 'wikipedia.org',
					sourceSnippet: 'সূর্যের উপরিভাগের তাপমাত্রা প্রায় ৫,৫০০° সেলসিয়াস এবং কেন্দ্রভাগের তাপমাত্রা প্রায় ১ কোটি ৫০ লক্ষ ডিগ্রি সেলসিয়াস।'
				};
			}
		}

		// Solar System Planets / সৌরজগতের গ্রহ
		if (qLow.includes('সৌরজগতে') || qLow.includes('সৌরজগতের গ্রহ') || qLow.includes('planets in solar system')) {
			return {
				answer: `সৌরজগতে মোট **৮টি** প্রধান গ্রহ রয়েছে।\n\n### সূর্য থেকে দূরত্বের ক্রমানুসারে গ্রহসমূহ:\n1. **বুধ (Mercury)** - সূর্যের নিকটতম ও ক্ষুদ্রতম গ্রহ\n2. **শুক্র (Venus)** - সবচেয়ে উষ্ণ ও উজ্জ্বল গ্রহ\n3. **পৃথিবী (Earth)** - একমাত্র প্রাণধারী নীল গ্রহ\n4. **মঙ্গল (Mars)** - লাল গ্রহ\n5. **বৃহস্পতি (Jupiter)** - সৌরজগতের বৃহত্তম গ্রহ\n6. **শনি (Saturn)** - বলয়যুক্ত দ্বিতীয় বৃহত্তম গ্রহ\n7. **ইউরেনাস (Uranus)** - শীতলতম বরুণের গ্রহ\n8. **নেপচুন (Neptune)** - সূর্য থেকে দূরতম গ্রহ\n\n*(উল্লেখ্য, ২০০৬ সালে আন্তর্জাতিক জ্যোতির্বিজ্ঞান ইউনিয়ন প্লুটোকে 'বামন গ্রহ' হিসেবে ঘোষণা করে)।*`,
				relatedQuestions: ['সৌরজগতের বৃহত্তম গ্রহ কোনটি?', 'প্লুটো কেন গ্রহ নয়?']
			};
		}
	}

	// 3. Human Body & Biology Facts
	if (qLow.includes('হাড়') || qLow.includes('হাড়') || qLow.includes('অস্থি') || qLow.includes('bone')) {
		return {
			answer: `একজন প্রাপ্তবয়স্ক পূর্ণাঙ্গ মানুষের দেহে মোট **২০৬টি** হাড় (অস্থি) থাকে।\n\n*(তবে জন্মের সময় একটি শিশুর শরীরে প্রায় ৩০০টি নরম তরুণাস্থি ও হাড় থাকে, যা বড় হওয়ার সাথে সাথে পরস্পর জোড়া লেগে ২০৬টিতে পরিণত হয়)।*\n\n* **দেহের দীর্ঘতম ও সবচেয়ে শক্ত হাড়**: ফিমার (Femur - উরুর হাড়)\n* **দেহের ক্ষুদ্রতম হাড়**: স্টেপিস (Stapes - মধ্যকর্ণের হাড়)`,
			relatedQuestions: ['মানবদেহে সবচেয়ে বড় হাড় কোনটি?', 'মানবদেহে সবচেয়ে ছোট হাড় কোনটি?']
		};
	}

	if (qLow.includes('ক্রোমোজোম') || qLow.includes('chromosomes')) {
		return {
			answer: `মানবদেহের প্রতিটি কোষে মোট **২৩ জোড়া (বা ৪৬টি)** ক্রোমোজোম থাকে।\n\n* **অটোসোম**: ২২ জোড়া (৪৪টি) — শারীরিক বৈশিষ্ট্য নির্ধারণ করে।\n* **সেক্স ক্রোমোজোম**: ১ জোড়া (২টি) — লিঙ্গ নির্ধারণ করে (পুরুষদের XY এবং নারীদের XX)।`,
			relatedQuestions: ['অটোসোম ও সেক্স ক্রোমোজোমের পার্থক্য কী?', 'ডিএনএ কী?']
		};
	}

	// 4. Inventions & Discoveries
	const isDiscoveryQuery =
		qLow.includes('আবিষ্কার') ||
		qLow.includes('উদ্ভাবন') ||
		qLow.includes('কে তৈরি') ||
		qLow.includes('কে আবিষ্কার') ||
		qLow.includes('invented') ||
		qLow.includes('discovered') ||
		qLow.includes('who made') ||
		qLow.includes('father of') ||
		qLow.includes('জনক কে');

	if (isDiscoveryQuery) {
		for (const item of INVENTIONS_AND_DISCOVERIES) {
			const matches = item.keywords.some((kw) => qLow.includes(kw.toLowerCase()));
			if (matches) {
				const isBn = lang === 'bn';
				return {
					answer: isBn ? item.answerBn : item.answerEn,
					relatedQuestions: isBn ? item.relatedBn : item.relatedEn,
					sourceTitle: `${item.targetBn} - উইকিপিডিয়া`,
					sourceUrl: `https://${isBn ? 'bn' : 'en'}.wikipedia.org/wiki/${item.wikiSlug}`,
					sourceDomain: 'wikipedia.org',
					sourceSnippet: isBn ? item.answerBn.split('\n')[0] : item.answerEn.split('\n')[0]
				};
			}
		}
	}

	// 5. Capital Cities
	const capitals: Record<string, { bn: string; en: string }> = {
		'বাংলাদেশ': { bn: 'ঢাকা (Dhaka)', en: 'Dhaka' },
		'ভারত': { bn: 'নতুন দিল্লি (New Delhi)', en: 'New Delhi' },
		'আমেরিকা': { bn: 'ওয়াশিংটন, ডি.সি. (Washington, D.C.)', en: 'Washington, D.C.' },
		'যুক্তরাষ্ট্র': { bn: 'ওয়াশিংটন, ডি.সি. (Washington, D.C.)', en: 'Washington, D.C.' },
		'যুক্তরাজ্য': { bn: 'লন্ডন (London)', en: 'London' },
		'ইংল্যান্ড': { bn: 'লন্ডন (London)', en: 'London' },
		'ফ্রান্স': { bn: 'প্যারিস (Paris)', en: 'Paris' },
		'জার্মানি': { bn: 'বার্লিন (Berlin)', en: 'Berlin' },
		'জাপান': { bn: 'টোকিও (Tokyo)', en: 'Tokyo' },
		'চীন': { bn: 'বেইজিং (Beijing)', en: 'Beijing' },
		'রাশিয়া': { bn: 'মস্কো (Moscow)', en: 'Moscow' },
		'কানাডা': { bn: 'অটোয়া (Ottawa)', en: 'Ottawa' },
		'অস্ট্রেলিয়া': { bn: 'ক্যানবেরা (Canberra)', en: 'Canberra' },
		'সৌদি আরব': { bn: 'রিয়াদ (Riyadh)', en: 'Riyadh' },
		'পাকিস্তান': { bn: 'ইসলামাবাদ (Islamabad)', en: 'Islamabad' },
		'ইতালি': { bn: 'রোম (Rome)', en: 'Rome' },
		'তুরস্ক': { bn: 'আঙ্কারা (Ankara)', en: 'Ankara' },
		'মিশর': { bn: 'কায়রো (Cairo)', en: 'Cairo' },
		'ব্রাজিল': { bn: 'ব্রাসিলিয়া (Brasília)', en: 'Brasília' },
		'আর্জেন্টিনা': { bn: 'বুয়েনস আইরেস (Buenos Aires)', en: 'Buenos Aires' }
	};

	if (qLow.includes('রাজধানী') || qLow.includes('capital')) {
		for (const [country, cap] of Object.entries(capitals)) {
			if (qLow.includes(country.toLowerCase())) {
				return {
					answer: `**${country}** এর রাজধানীর নাম হলো **${cap.bn}**।`,
					relatedQuestions: [
						`${country} এর মুদ্রা বা কারেন্সির নাম কী?`,
						`${country} এর বর্তমান রাষ্ট্রপ্রধান কে?`,
						`${country} এর প্রধান ভাষা কী?`
					],
					sourceTitle: `${country} - উইকিপিডিয়া`,
					sourceUrl: `https://bn.wikipedia.org/wiki/${encodeURIComponent(country)}`,
					sourceDomain: 'wikipedia.org',
					sourceSnippet: `${country}-এর রাজধানী হলো ${cap.bn}।`
				};
			}
		}
	}

	// 6. National Symbols
	if (qLow.includes('জাতীয় কবি') || qLow.includes('জাতীয় কবি')) {
		return {
			answer: `বাংলাদেশের জাতীয় কবি হলেন **কাজী নজরুল ইসলাম (Kazi Nazrul Islam)**, যাঁকে 'বিদ্রোহী কবি' হিসেবেও আখ্যায়িত করা হয়। তাঁর বিখ্যাত কাব্যগ্রন্থগুলোর মধ্যে *অগ্নিবীণা*, *বিষের বাঁশী*, *দোলনচাঁপা* ইত্যাদি অন্যতম।`,
			relatedQuestions: [
				'কাজী নজরুল ইসলামের জন্ম কত সালে?',
				'কাজী নজরুল ইসলামের বিখ্যাত কবিতাগুলো কী কী?',
				'বাংলাদেশের জাতীয় সংগীতের রচয়িতা কে?'
			],
			sourceTitle: 'কাজী নজরুল ইসলাম - উইকিপিডিয়া',
			sourceUrl: 'https://bn.wikipedia.org/wiki/Kazi_Nazrul_Islam',
			sourceDomain: 'wikipedia.org',
			sourceSnippet: 'কাজী নজরুল ইসলাম হলেন বাংলাদেশের জাতীয় কবি।'
		};
	}

	if (qLow.includes('জাতীয় ফুল') || qLow.includes('জাতীয় ফুল')) {
		return {
			answer: `বাংলাদেশের জাতীয় ফুল হলো **সাদা শাপলা (White Water Lily)**। এটি বাংলাদেশের জলজ উদ্ভিদ ও সংস্কৃতির অনন্য প্রতীক।`,
			relatedQuestions: ['বাংলাদেশের জাতীয় ফল কোনটি?', 'বাংলাদেশের জাতীয় পশু কোনটি?', 'শাপলা ফুলের বৈজ্ঞানিক নাম কী?']
		};
	}

	if (qLow.includes('জাতীয় ফল') || qLow.includes('জাতীয় ফল')) {
		return {
			answer: `বাংলাদেশের জাতীয় ফল হলো **কাঁঠাল (Jackfruit)**। কাঁঠাল একটি পুষ্টিকর গ্রীষ্মকালীন ফল এবং বাংলাদেশের সর্বত্র এটি প্রচুর পরিমাণে উৎপাদিত হয়।`,
			relatedQuestions: ['কাঁঠালের বৈজ্ঞানিক নাম কী?', 'বাংলাদেশের জাতীয় মাছ কোনটি?']
		};
	}

	if (qLow.includes('জাতীয় পশু') || qLow.includes('জাতীয় পশু')) {
		return {
			answer: `বাংলাদেশের জাতীয় পশু হলো **রয়্যাল বেঙ্গল টাইগার (Royal Bengal Tiger)**। সুন্দরবন হলো এদের প্রধান প্রাকৃতিক আবাসস্থল।`,
			relatedQuestions: ['সুন্দরবনে কয়টি বাঘ আছে?', 'রয়্যাল বেঙ্গল টাইগারের বৈজ্ঞানিক নাম কী?']
		};
	}

	if (qLow.includes('জাতীয় মাছ') || qLow.includes('জাতীয় মাছ')) {
		return {
			answer: `বাংলাদেশের জাতীয় মাছ হলো রূপালি **ইলিশ (Ilish / Tenualosa ilisha)**। পদ্মা, মেঘনা ও বঙ্গোপসাগরের মোহনায় সুস্বাদু ইলিশ প্রচুর পরিমাণে পাওয়া যায়।`,
			relatedQuestions: ['ইলিশের বৈজ্ঞানিক নাম কী?', 'ইলিশ মাছের প্রজনন মৌসুম কখন?']
		};
	}

	// 7. Science, Biology, Astronomy Definitions
	if (qLow.includes('হিমোগ্লোবিন') || qLow.includes('hemoglobin')) {
		return {
			answer: `**হিমোগ্লোবিন (Hemoglobin)** হলো রক্তের লোহিত রক্তকণিকায় (RBC) থাকা একটি বিশেষ আয়রনযুক্ত প্রোটিন।\n\n### হিমোগ্লোবিনের প্রধান কাজ:\n* **অক্সিজেন পরিবহন**: ফুসফুস থেকে অক্সিজেন গ্রহণ করে সারা দেহের কোষ ও কলায় পৌঁছে দেওয়া।\n* **কার্বন ডাই-অক্সাইড নিষ্কাশন**: দেহের বিভিন্ন অঙ্গ থেকে ক্ষতিকর কার্বন ডাই-অক্সাইড ফুসফুসে ফিরিয়ে আনা।\n* **রক্তের লাল রং**: হিমোগ্লোবিনের আয়রন উপাদানের উপস্থিতির কারণেই মানব রক্তের রং লাল দেখায়।`,
			relatedQuestions: ['রক্তে হিমোগ্লোবিনের স্বাভাবিক মাত্রা কত?', 'হিমোগ্লোবিনের ঘাটতি হলে কী রোগ হয়?', 'রক্তের গ্রুপ কয়টি ও কি কি?']
		};
	}

	if (qLow.includes('গলগণ্ড') || qLow.includes('গলগন্ড') || qLow.includes('goiter') || qLow.includes('goitre')) {
		return {
			answer: `খাদ্যে **আয়োডিন (Iodine)**-এর অভাবের কারণে **গলগণ্ড (Goitre)** রোগ হয়। আয়োডিনের অভাবে থাইরয়েড গ্রন্থি থেকে পর্যাপ্ত থাইরক্সিন হরমোন তৈরি হতে পারে না, ফলে গলার থাইরয়েড গ্রন্থি ফুলে গিয়ে গলগণ্ড রোগের সৃষ্টি হয়।`,
			relatedQuestions: ['আয়োডিনের প্রধান উৎসগুলো কী কী?', 'থাইরয়েড হরমোনের কাজ কী?', 'গলগণ্ড রোগের প্রাথমিক লক্ষণ কী?']
		};
	}

	if (qLow.includes('সালোকসংশ্লেষণ') || qLow.includes('photosynthesis')) {
		return {
			answer: `**সালোকসংশ্লেষণ (Photosynthesis)** হলো সবুজ উদ্ভিদের খাদ্য তৈরির এক জৈব-রাসায়নিক প্রক্রিয়া।\n\nসবুজ উদ্ভিদ সূর্যালোকের উপস্থিতিতে বাতাস থেকে কার্বন ডাই-অক্সাইড ($CO_2$) এবং মূল দিয়ে মাটি থেকে পানি ($H_2O$) শোষণ করে পাতার ক্লোরোফিলের সাহায্যে শর্করা/গ্লুকোজ এবং উপজাত হিসেবে **অক্সিজেন ($O_2$)** তৈরি করে।`,
			relatedQuestions: ['সালোকসংশ্লেষণের রাসায়নিক সমীকরণ কী?', 'উদ্ভিদের কোন অঙ্গে সালোকসংশ্লেষণ ঘটে?', 'ক্লোরোফিলের কাজ কী?']
		};
	}

	if (qLow.includes('সূর্যগ্রহণ') || qLow.includes('solar eclipse')) {
		return {
			answer: `চাঁদ যখন পরিভ্রমণকালে **সূর্য এবং পৃথিবীর মাঝখানে** এসে অবস্থান করে এবং চাঁদের ছায়া পৃথিবীর ওপর পড়ে সূর্যের আলোকে আংশিক বা সম্পূর্ণ ঢেকে দেয়, তখন তাকে **সূর্যগ্রহণ (Solar Eclipse)** বলা হয়। এটি কেবল অমাবস্যার সময় ঘটে থাকে।`,
			relatedQuestions: ['চন্দ্রগ্রহণ কেন হয়?', 'পূর্ণগ্রাস সূর্যগ্রহণ কী?', 'সূর্যগ্রহণের সময় খালি চোখে তাকানো নিষেধ কেন?']
		};
	}

	if (qLow.includes('চন্দ্রগ্রহণ') || qLow.includes('lunar eclipse')) {
		return {
			answer: `পৃথিবী যখন পরিভ্রমণকালে **সূর্য এবং চাঁদের মাঝখানে** সরলরেখায় চলে আসে এবং পৃথিবীর ছায়া চাঁদের ওপর পড়ে সূর্যের আলো আটকে দেয়, তখন তাকে **চন্দ্রগ্রহণ (Lunar Eclipse)** বলা হয়। এটি সাধারণত পূর্ণিমা তিথিতে ঘটে।`,
			relatedQuestions: ['সূর্যগ্রহণ ও চন্দ্রগ্রহণের মধ্যে পার্থক্য কী?', 'চন্দ্রগ্রহণ খালি চোখে দেখা যায় কি?']
		};
	}

	if (qLow.includes('আলোর গতি') || qLow.includes('speed of light')) {
		return {
			answer: `শূন্য মাধ্যমে আলোর গতিবেগ প্রতি সেকেন্ডে প্রায় **২,৯৯,৭৯২ কিলোমিটার (বা প্রায় ৩ লক্ষ কিমি/সেকেন্ড / $3 \\times 10^8$ মিটার/সেকেন্ড)**। প্রকৃতিতে এর চেয়ে দ্রুত গতিতে কোনো বস্তু চলাচল করতে পারে না।`,
			relatedQuestions: ['শব্দের গতিবেগ কত?', 'সূর্য থেকে আলো আসতে কত সময় লাগে?', 'এক আলোকবর্ষ সমান কত কিলোমিটার?']
		};
	}

	if (qLow.includes('শব্দের গতি') || qLow.includes('speed of sound')) {
		return {
			answer: `স্বাভাবিক তাপমাত্রায় (২০° সেলসিয়াস) শুষ্ক বাতাসে শব্দের গতিবেগ প্রায় **৩৪৩ মিটার প্রতি সেকেন্ড (বা ঘণ্টায় প্রায় ১,২৩৫ কিলোমিটার)**। শব্দ কঠিন পদার্থে সবচেয়ে দ্রুত এবং গ্যাসীয় মাধ্যমে তুলনামূলক ধীরগতিতে চলাচল করে। শূন্য মাধ্যমে শব্দ চলাচল করতে পারে না।`,
			relatedQuestions: ['আলো ও শব্দের গতির পার্থক্য কী?', 'পানিতে শব্দের গতি কত?']
		};
	}

	// 8. World & Bangladesh Historic Leaders
	if (qLow.includes('আমেরিকার') && (qLow.includes('প্রথম প্রেসিডেন্ট') || qLow.includes('প্রথম রাষ্ট্রপতি') || qLow.includes('first president'))) {
		return {
			answer: `আমেরিকার (যুক্তরাষ্ট্রের) প্রথম প্রেসিডেন্ট ছিলেন **জর্জ ওয়াশিংটন (George Washington)**। তিনি **১৭৮৯ থেকে ১৭৯৭ সাল** পর্যন্ত যুক্তরাষ্ট্রের ১ম রাষ্ট্রপতি হিসেবে দায়িত্ব পালন করেন এবং তাঁকে আমেরিকার 'জাতির পিতা' (Father of His Country) বলা হয়।`,
			relatedQuestions: [
				'আমেরিকার বর্তমান প্রেসিডেন্টের নাম কী?',
				'আব্রাহাম লিঙ্কন কততম প্রেসিডেন্ট ছিলেন?',
				'হোয়াইট হাউস কোথায় অবস্থিত?'
			]
		};
	}

	if (qLow.includes('বাংলাদেশের প্রথম রাষ্ট্রপতি') || (qLow.includes('বাংলাদেশ') && qLow.includes('প্রথম রাষ্ট্রপতি'))) {
		return {
			answer: `গণপ্রজাতন্ত্রী বাংলাদেশের প্রথম রাষ্ট্রপতি হলেন জাতির পিতা **বঙ্গবন্ধু শেখ মুজিবুর রহমান** (১৯৭১ সালের ১০ই এপ্রিল গঠিত মুজিবনগর সরকারের রাষ্ট্রপতি)।\n\n*(বঙ্গবন্ধুর অনুপস্থিতিতে সৈয়দ নজরুল ইসলাম অস্থায়ী রাষ্ট্রপতির দায়িত্ব পালন করেন)।*`,
			relatedQuestions: [
				'বাংলাদেশের প্রথম প্রধানমন্ত্রী কে ছিলেন?',
				'মুজিবনগর সরকার কবে গঠিত হয়?',
				'বঙ্গবন্ধুর ঐতিহাসিক ৭ই মার্চের ভাষণ'
			]
		};
	}

	if (qLow.includes('বাংলাদেশের প্রথম প্রধানমন্ত্রী') || (qLow.includes('বাংলাদেশ') && qLow.includes('প্রথম প্রধানমন্ত্রী'))) {
		return {
			answer: `বাংলাদেশের প্রথম প্রধানমন্ত্রী ছিলেন **তাজউদ্দীন আহমদ**। তিনি ১৯৭১ সালের মুক্তিযুদ্ধকালীন মুজিবনগর সরকারের প্রধানমন্ত্রী হিসেবে ঐতিহাসিক নেতৃত্ব প্রদান করেন।`,
			relatedQuestions: [
				'মুজিবনগর সরকারের সদস্যরা কারা ছিলেন?',
				'বাংলাদেশের প্রথম অর্থমন্ত্রী কে ছিলেন?'
			]
		};
	}

	if (qLow.includes('ভারতের প্রথম প্রধানমন্ত্রী')) {
		return {
			answer: `ভারতের প্রথম প্রধানমন্ত্রী ছিলেন **পণ্ডিত জওহরলাল নেহরু (Jawaharlal Nehru)**। তিনি ১৯৪৭ সালের ১৫ই আগস্ট ভারতের স্বাধীনতার পর থেকে ১৯৬৪ সাল পর্যন্ত সবচেয়ে দীর্ঘ সময় প্রধানমন্ত্রী ছিলেন।`,
			relatedQuestions: ['ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?', 'মহাত্মা গান্ধীর জন্ম কত সালে?']
		};
	}

	if (qLow.includes('ভারতের প্রথম রাষ্ট্রপতি')) {
		return {
			answer: `স্বাধীন ভারতের প্রথম রাষ্ট্রপতি ছিলেন **ড. রাজেন্দ্র প্রসাদ (Dr. Rajendra Prasad)**। তিনি ১৯৫০ থেকে ১৯৬২ সাল পর্যন্ত একটানা ১২ বছর দায়িত্ব পালন করেন।`,
			relatedQuestions: ['ভারতের বর্তমান প্রধানমন্ত্রী কে?', 'ভারতের সংবিধান কবে কার্যকর হয়?']
		};
	}

	// 9. Mathematics & Constants
	if (qLow.includes('পাই এর মান') || qLow.includes('পাই-এর মান') || qLow.includes('value of pi') || qLow.includes('pi value')) {
		return {
			answer: `গণিতে পাই ($\pi$) এর আসন্ন মান হলো **৩.১৪১৫৯ (3.14159)** বা ভগ্নাংশে প্রায় **২২/৭**। এটি একটি অমূলদ সংখ্যা (Irrational Number), যা যেকোনো বৃত্তের পরিধি ও ব্যাসের অনুপাতকে প্রকাশ করে।`,
			relatedQuestions: ['পাই দিবস কবে পালিত হয়?', 'বৃত্তের ক্ষেত্রফলের সূত্র কী?', 'অমূলদ সংখ্যা কাকে বলে?']
		};
	}

	if (qLow.includes('পানির রাসায়নিক') || qLow.includes('পানির সংকেত') || qLow.includes('chemical formula of water')) {
		return {
			answer: `পানির রাসায়নিক সংকেত হলো **$H_2O$** (ডাইহাইড্রোজেন মনোক্সাইড)। এর প্রতিটি অণু ২টি হাইড্রোজেন পরমাণু এবং ১টি অক্সিজেন পরমাণুর সমন্বয়ে গঠিত।`,
			relatedQuestions: ['পানির স্ফুটনাঙ্ক ও হিমাঙ্ক কত?', 'ভারী পানির সংকেত কী?']
		};
	}

	if (qLow.includes('লবণের সংকেত') || qLow.includes('খাবার লবণের সংকেত') || qLow.includes('formula of salt')) {
		return {
			answer: `সাধারণ খাবার লবণের রাসায়নিক নাম হলো **সোডিয়াম ক্লোরাইড** এবং সংকেত হলো **$NaCl$**। এটি সোডিয়াম ($Na$) এবং ক্লোরিন ($Cl$) মৌলের সংযোগে গঠিত একটি আয়নিক যৌগ।`,
			relatedQuestions: ['বেকিং সোডার সংকেত কী?', 'চিনির রাসায়নিক সংকেত কী?']
		};
	}

	if (qLow.includes('ডিএনএ') || qLow.includes('dna')) {
		return {
			answer: `**ডিএনএ (DNA)**-এর পূর্ণরূপ হলো **Deoxyribonucleic Acid** (ডিঅক্সিরাইবোনিউক্লিক অ্যাসিড)।\n\n### ডিএনএ-এর প্রধান কাজ:\n* **বংশগত তথ্য ধারণ**: জীবের সকল শারীরিক ও জৈবিক বৈশিষ্ট্য বংশপরম্পরায় এক প্রজন্ম থেকে অন্য প্রজন্মে স্থানান্তর করা।\n* **প্রোটিন সংশ্লেষণ নিয়ন্ত্রণ**: কোষে বিভিন্ন প্রয়োজনীয় এনজাইম ও প্রোটিন তৈরির নির্দেশ প্রদান করা।\n* **দ্বি-সূত্রক গঠন**: ১৯৫৩ সালে জেমস ওয়াটসন ও ফ্রান্সিস ক্রিক ডিএনএ-এর ডাবল হেলিক্স (Double Helix) মডেল আবিষ্কার করেন।`,
			relatedQuestions: ['ডিএনএ ও আরএনএ-এর পার্থক্য কী?', 'ক্রোমোজোম কী দিয়ে গঠিত?', 'জিন (Gene) কাকে বলে?']
		};
	}

	return null;
}
