# সন্ধান (Sandhan) 🔍

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Privacy: Zero-Knowledge](https://img.shields.io/badge/Privacy-Zero--Knowledge-0e7a63.svg)](docs/THREAT-MODEL.md)
[![Language: Bengali--First](https://img.shields.io/badge/Language-Bengali--First-e0762f.svg)](apps/web/src/lib/i18n.ts)
[![Web Search: Universal](https://img.shields.io/badge/Search-Universal_Open_Web-3b82f6.svg)](apps/web/src/routes/api/search/+server.ts)

**সন্ধান (Sandhan)** একটি উন্মুক্ত, সার্বজনীন ও গোপনীয়তা-প্রথম সার্চ ইঞ্জিন। এটি সমগ্র বিশ্বব্রহ্মাণ্ডের কোটি কোটি ওয়েবসাইট, উইকি, ব্লগ ও নিউজ পোর্টাল থেকে তাৎক্ষণিক ফলাফল খুঁজে আনে, ব্যবহারকারীর সার্চ হিস্টরি ক্লায়েন্ট-সাইডে ক্রিপ্টোগ্রাফিকভাবে এনক্রিপ্ট রাখে এবং সম্পূর্ণ স্বচ্ছ র‍্যাংকিং প্রদান করে।

> **Search with complete privacy.** An open-source, universal search engine with Bengali-first multilingual support, zero-knowledge client-side encrypted search history (AES-256-GCM + PBKDF2), transparent ranking with Goggles, instant answers, and live metasearch aggregation across the entire open web.

---

## 🌟 প্রধান বৈশিষ্ট্যসমূহ (Key Features)

- 🌐 **সার্বজনীন উন্মুক্ত ওয়েব সার্চ (Universal Web Search)**: যেকোনো ব্যক্তি, ওয়েবসাইট, কোড রিপোজিটরি, টেক ব্লগ, ছবি, ভিডিও বা খবর সমগ্র ইন্টারনেট থেকে খুঁজে আনে।
- 🔐 **শূন্য-জ্ঞান এনক্রিপশন (Zero-Knowledge History)**: আপনার প্রতিটি সার্চ ব্রাউজারেই **AES-256-GCM** দ্বারা এনক্রিপ্ট হয়ে জমা হয়। কোনো পাসফ্রেজ ছাড়া সার্ভার বা তৃতীয় পক্ষ তা পড়তে পারে না।
- 👓 **স্বচ্ছ র‍্যাংকিং ও Goggles (Transparent Ranking & Goggles)**: প্রতিটি ফলাফলের পাশে "কেন এই ফলাফল?" (BM25, Authority, Freshness) দেখুন এবং নিজস্ব নিয়ম লিখে র‍্যাংকিং সাজান।
- ⚡ **তাত্ক্ষণিক উত্তর ও ক্যালকুলেটর (Instant Answers & Bangs)**: বাংলা সংখ্যা (`০-৯`) সমর্থিত গণিত সমাধানকারী, মুদ্রা/একক রূপান্তরকারী এবং `!w`, `!gh`, `!yt`, `!ddg`, `!g`, `!m` ব্যাং শর্টকাট।
- 📚 **উইকি ও জ্ঞানকোষ প্যানেল (Knowledge Graph)**: উইকিপিডিয়া ও উইকিউপাত্ত থেকে সমৃদ্ধ ইনফোবক্স ও সারসংক্ষেপ।
- ⚖️ **মানব-রায় মূল্যায়ন প্ল্যাটফর্ম (`/judge`)**: ব্যবহারকারীর পরিচয় গোপন রেখে সার্চ কোয়ালিটি মূল্যায়ন ব্যবস্থা।
- 📊 **সিস্টেম স্বাস্থ্য ও ইনডেক্স ড্যাশবোর্ড (`/dashboard`)**: ডিফারেনশিয়াল-প্রাইভেসি সুরক্ষিত লাইভ টেলিমেট্রি।
- 🎨 **প্রিমিয়াম নান্দনিক ডিজাইন**: ডার্ক ও লাইট মোড, বাংলা টাইপোগ্রাফি (*Noto Serif Bengali*, *Noto Sans Bengali*), ফুল কীবোর্ড শর্টকাট (`/`, `d`, `?`, `Esc`, `Enter`)।

---

## 📁 রিপোজিটরি কাঠামো (Repository Structure)

```
sandhan/
├── apps/
│   └── web/                           # আধুনিক SvelteKit + TypeScript ওয়েব অ্যাপ্লিকেশন
│       ├── src/
│       │   ├── lib/
│       │   │   ├── crypto.ts          # WebCrypto AES-256-GCM + PBKDF2 এনক্রিপশন
│       │   │   ├── goggles.ts         # ক্লায়েন্ট-সাইড Goggles রি-র‍্যাংক ইঞ্জিন
│       │   │   ├── i18n.ts            # বাংলা, ইংরেজি ও হিন্দি অনুবাদ
│       │   │   ├── sync.ts            # শূন্য-জ্ঞান সিঙ্ক প্রোটোকল
│       │   │   ├── instant.ts         # ক্যালকুলেটর ও একক রূপান্তর
│       │   │   ├── bangs.ts           # ব্যাং শর্টকাট রাউটার
│       │   │   └── search.ts          # মেটাসার্চ ক্লায়েন্ট ও নলেজ লোডার
│       │   └── routes/
│       │       ├── api/search/        # ইউনিভার্সাল ওয়েব মেটাসার্চ সার্ভার এন্ডপয়েন্ট
│       │       ├── +page.svelte       # সার্চ হোমপেজ ও SERP
│       │       ├── judge/             # /judge মানব-রায় প্ল্যাটফর্ম
│       │       ├── dashboard/         # /dashboard টেলিমেট্রি ড্যাশবোর্ড
│       │       ├── design/            # /design ডিজাইন টোকেন ও ক্রিপ্টো ল্যাব
│       │       └── launch/            # /launch ইশতেহার ও লঞ্চ ঘোষণা
├── core/                              # কোর ব্যাকএন্ড সার্ভিসসমূহ (Rust স্পেসিফিকেশন)
│   ├── gateway/                       # Axum API গেটওয়ে ও রেট লিমিটার
│   ├── nlp/                           # বাংলা ইউনিকোড নরম্যালাইজার ও বানান সংশোধক
│   ├── crawler/                       # নীতিমান ক্রলার ও MinHash ডিডুপ্লিকেটর
│   └── indexer/                       # ইনভার্টেড ইনডেক্স ও ওপেনসার্চ লোডার
├── eval/                              # কোয়ালিটি বেঞ্চমার্ক ও মূল্যায়ন স্ক্রিপ্ট
│   ├── typo_bench.py                  # বাংলা বানান শুদ্ধিকরণ বেঞ্চমার্ক (১০০% পাস)
│   └── bench.py                       # NDCG@5 প্রাসঙ্গিকতা বেঞ্চমার্ক
├── brand/                             # এসভিজি লোগো, সোশ্যাল কার্ড ও ডিজাইন টোকেন
├── docs/                              # থ্রেট মডেল, গগলস ও ডিপ্লয়মেন্ট গাইড
├── sondhan.html                       # পোর্টেবল একক-ফাইলের স্ট্যান্ডঅ্যালন ডিস্ট্রিবিউশন
├── docker-compose.yml                 # ডকার কম্পোজ কনটেইনারাইজেশন
├── setup.sh                           # ওয়ান-ক্লিক সেটআপ স্ক্রিপ্ট
└── LICENSE                            # CC0 1.0 Universal পাবলিক ডোমেইন
```

---

## 🚀 দ্রুত শুরু (Quick Start)

### ১. লোকাল ডেভেলপমেন্ট
```bash
# ডিপেন্ডেন্সি ইন্সটল
cd apps/web
npm install

# ডেভেলপমেন্ট সার্ভার চালু
npm run dev
```
ব্রাউজারে খুলুন: **`http://localhost:5173`**

### ২. ইউনিট টেস্ট ও কোয়ালিটি বেঞ্চমার্ক
```bash
# ফ্রন্টএন্ড ও ক্রিপ্টো টেস্ট (Vitest)
cd apps/web && npm test

# বাংলা বানান ও টাইপো বেঞ্চমার্ক
python eval/typo_bench.py

# NDCG@5 প্রাসঙ্গিকতা বেঞ্চমার্ক
python eval/bench.py
```

### ৩. প্রোডাকশন বিল্ড
```bash
cd apps/web
npm run build
npm run preview
```

### ৪. স্ট্যান্ডঅ্যালন একক-ফাইল সংস্করণ
কোনো সার্ভার ছাড়াই সরাসরি ব্রাউজারে খুলতে পারেন **`sondhan.html`**।

---

## ⌨️ কীবোর্ড শর্টকাট (Keyboard Shortcuts)

| শর্টকাট | কাজ |
|---|---|
| `/` | সার্চ বক্সে ফোকাস |
| `d` | ডার্ক / লাইট থিম টগল |
| `?` | কীবোর্ড সাহায্য পপআপ |
| `Esc` | যেকোনো মোডাল বা ড্রয়ার বন্ধ করা |
| `Enter` | অনুসন্ধান চালু করা |

---

## 📜 লাইসেন্স (License)

এই প্রকল্পটি **Creative Commons CC0 1.0 Universal (Public Domain Dedication)** লাইসেন্সের আওতায় সম্পূর্ণ উন্মুক্ত। আপনি যেকোনো উদ্দেশ্যে এটি ব্যবহার, পরিবর্তন, ও পুনর্বিতরণ করতে পারেন।
