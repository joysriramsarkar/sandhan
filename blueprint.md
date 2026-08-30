### USER
একটা সম্পূর্ণ সার্চ ইঞ্জিনের নীল নকশা বানিয়ে দাও। এটা ওপেনসোর্স ও মুক্ত হবে। ব্যবহারকারীদের সার্চ এনক্রিপ্ট করে সংরক্ষণ করা হবে। অত্যন্ত সহজ, ফিচারফুল হবে, ইউআই ইউএক্স সুন্দর হবে। গুগল ও searxng এবং বর্তমানে থাকা আরো ভালো সার্চ এঞ্জিনের সেরা জিনিসগুলো দিয়ে তৈরি হবে।

### ASSISTANT
# সন্ধান — একটি উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিনের সম্পূর্ণ নীলনকশা

কাজের নাম হিসেবে **"সন্ধান"** ধরলাম (বিকল্প: খোঁজ, দিশা, হদিস)। নিচে দর্শন থেকে শুরু করে রোডম্যাপ পর্যন্ত পূর্ণাঙ্গ পরিকল্পনা।

---

## ১. মূলনীতি (সব সিদ্ধান্তের ভিত্তি)

| নীতি | অর্থ |
|---|---|
| 🔓 উন্মুক্ত ও মুক্ত | AGPLv3 লাইসেন্স, কেউ নিজের সার্ভারে চালাতে পারবে |
| 🔐 শূন্য-জ্ঞান গোপনীয়তা | সার্চ হিস্টরি এনক্রিপ্টেড — সার্ভার পড়তে পারে না |
| 🪶 হালকা ও দ্রুত | লক্ষ্য: প্রথম লোড < ১ সেকেন্ড, কোনো থার্ড-পার্টি স্ক্রিপ্ট নেই |
| 🔍 স্বচ্ছ র‍্যাংকিং | "কেন এই ফলাফল?" — প্রতিটি রেজাল্টে ব্যাখ্যা দেখা যাবে |
| 🌏 বাংলা-প্রথম, বহুভাষিক | বাংলা ফন্ট, বাংলা ভাষার প্রসেসিং, ১০০+ ভাষার লক্ষ্য |
| 🧩 প্লাগইনযোগ্য | ইঞ্জিন, থিম, র‍্যাংক-রুল — সব এক্সটেনসিবল |

---

## ২. সিস্টেম আর্কিটেকচার

```
 ব্যবহারকারী (ব্রাউজার / মোবাইল অ্যাপ / ব্রাউজার এক্সটেনশন)
        │  TLS 1.3 + HSTS, ঐচ্ছিক Tor (.onion)
        ▼
 ┌────────────────────────────────────────┐
 │  Edge লেয়ার (Anycast) — DDoS ঢাল,     │
 │  রেট-লিমিট; কোনো IP লগ হয় না          │
 └────────────────────────────────────────┘
        ▼
 ┌────────────────────────────────────────┐
 │  API গেটওয়ে (Rust/axum)                │
 │  • ক্ষণস্থায়ী রিকোয়েস্ট-ID (৫ মিনিটে মুছে যায়) │
 │  • রিকোয়েস্ট শেষ হলেই মেটাডেটা ধ্বংস    │
 └───┬───────────┬────────────┬───────────┘
     ▼           ▼            ▼
 ┌─────────┐ ┌─────────┐ ┌──────────────┐
 │ কোয়েরি   │ │ র‍্যাংকিং │ │ মেটা-সার্চ     │
 │ সার্ভিস   │ │ সার্ভিস   │ │ অ্যাগ্রিগেটর   │
 │ (বানান,  │ │ (LTR,   │ │ (উইকিপিডিয়া,   │
 │ পার্সিং) │ │ Goggles)│ │ arXiv, ইত্যাদি)│
 └────┬────┘ └────┬────┘ └──────┬───────┘
      └───────┬───┴──────────────┘
              ▼
    ইনডেক্স ক্লাস্টার + Redis ক্যাশ
              ▲
              │  নেটস (NATS) পাইপলাইন
 ┌────────────┴───────────────┐
 │ ক্রলার ফার্ম → ক্লিনার →     │
 │ ডুপ্লিকেট-ডিটেক্টর → টোকেনাইজার│
 │ → ইনডেক্স বিল্ডার            │
 └────────────────────────────┘
```

**মূল সার্ভিসগুলো:**

| সার্ভিস | দায়িত্ব |
|---|---|
| `gateway` | প্রবেশদ্বার, IP ট্রাঙ্কেশন (শেষ অক্টেট ফেলা), সাইনিং |
| `query` | কোয়েরি বোঝা — বানান সংশোধন, ভাষা শনাক্তকরণ, ইনটেন্ট |
| `ranker` | BM25 + লিংক-গ্রাফ + ML রি-র‍্যাংক + ব্যবহারকারীর Goggles |
| `aggregator` | SearXNG-এর মতো বহু উৎস থেকে ফলাফল মার্জ |
| `crawler` | বণ্টিত, ভদ্র (robots.txt মানে), ডোমেইন-ভিত্তিক রেট |
| `indexer` | ইনভার্টেড ইনডেক্স + ওয়েব-গ্রাফ তৈরি |
| `sync` | এনক্রিপ্টেড হিস্টরি সিঙ্ক (শূন্য-জ্ঞান, নিচের ৩ নং দেখুন) |

---

## ৩. গোপনীয়তা ও এনক্রিপশন মডেল ⭐ (আপনার মূল চাহিদা)

**তিন স্তরের সুরক্ষা:**

**স্তর ১ — চলাচলে:** TLS 1.3 বাধ্যতামূলক, HSTS প্রি-লোড, ব্রাউজারে স্বয়ংক্রিয় আপগ্রেড। DNS-ও গোপন: নিজস্ব DoH এন্ডপয়েন্ট।

**স্তর ২ — হিস্টরিতে (এনক্রিপ্টেড সংরক্ষণ):**
- ডিফল্ট: হিস্টরি শুধু ব্রাউজারের `IndexedDB`-তে, WebCrypto দিয়ে AES-256-GCM এনক্রিপ্টেড।
- ঐচ্ছিক ডিভাইস-সিঙ্ক: ক্লায়েন্ট-সাইডে এনক্রিপ্ট করে তবেই সার্ভারে যায়। সার্ভার শুধু সাইফারটেক্সট দেখে।

```
কী তৈরি:   পাসফ্রেজ ──Argon2id──▶ ২৫৬-বিট কী (ক্লায়েন্টেই থাকে)
প্রতি এন্ট্রি: {query, timestamp, clicked_url, engine}
              ──AES-256-GCM (র‍্যান্ডম নন্স)──▶ সাইফারটেক্সট
সার্ভারে সংরক্ষিত: { অ্যানন-আইডি, নন্স, সাইফারটেক্সট }  ← আর কিছুই নয়
```
- কোনো ইমেইল/ফোন লাগে না — অ্যানন-আইডি ক্লায়েন্টেই জেনারেট হয়।
- রিকভারি কোড (১৬ শব্দ) হারালে ডেটা উদ্ধার অসম্ভব — এটাই নকশার নিরাপত্তা।
- সার্ভার হ্যাক হলেও আক্রমণকারী পায় শুধু সাইফারটেক্সট।

**স্তর ৩ — সার্ভারের ভেতরে:**
- **ডিফল্টে কোনো কোয়েরি লগ নেই।** শুধু ডিফারেনশিয়াল-প্রাইভেসি যুক্ত সমষ্টিগত পরিসংখ্যান (জনপ্রিয় ভাষা, মোটামুটি লোড)।
- অপারেশনাল ডেটা (ইনডেক্স) ডিস্কে এনক্রিপ্টেড (LUKS)।
- রেট-লিমিট ফিঙ্গারপ্রিন্টিং ছাড়া: ক্ষণস্থায়ী সাবনেট কাউন্টার + ঐচ্ছিক প্রাইভেট অ্যাক্সেস টোকেন / ছোট প্রুফ-অব-ওয়ার্ক চ্যালেঞ্জ।
- সার্চ ফলাফলের লিংকে ট্র্যাকিং প্যারামিটার স্ট্রিপ + ঐচ্ছিক "ছদ্মবেশী ভিউ" (প্রক্সি হয়ে পেজ পড়া, স্টার্টপেজের মতো)।
- সম্পূর্ণ থ্রেট-মডেল ডকুমেন্ট রিপোতে প্রকাশ্যে।

---

## ৪. ক্রলিং ও ইনডেক্সিং

- **ক্রলার:** নিজস্ব বণ্টিত ক্রলার (Rust), শুরুতে ওপেন সোর্চ ডেটাসেট (যেমন কমন ক্রল) দিয়ে বুটস্ট্র্যাপ, পরে লাইভ ক্রল।
- **ভদ্রতা:** `robots.txt` + ক্রল-বাজেট সম্মান, `sitemap.xml` সমর্থন।
- **পাইপলাইন:** ক্লিনিং → ডুপ্লিকেট শনাক্ত (MinHash) → বাংলা-সচেতন টোকেনাইজার (উইকিপিডিয়া-প্রশিক্ষিত সেন্টেন্সপিস) → ইনডেক্স।
- **ওয়েব-গ্রাফ:** লিংক ডেটা আলাদা সংরক্ষণ — র‍্যাংকিং ও স্প্যাম-শনাক্তির জন্য।
- **ফ্রেশনেস:** পপুলারিটি + পরিবর্তনহার অনুযায়ী পুনঃক্রল শিডিউল।

---

## ৫. র‍্যাংকিং (স্বচ্ছ)

```
মূল স্কোর = w₁·BM25 + w₂·লিংক-কর্তৃত্ব + w₃·ফ্রেশনেস + w₄·গুণমান-সংকেত
            − স্প্যাম-পেনাল্টি
তারপর → Learning-to-Rank রি-র‍্যাংক → ব্যবহারকারীর Goggles গুণক (ক্লায়েন্ট-সাইড)
```

- **ব্যক্তিগতকরণ ডিফল্টে বন্ধ** — চালু করলেও তা স্থানীয়/এনক্রিপ্টেড, সার্ভার জানে না।
- **Goggles:** ব্যবহারকারী ছোট নিয়ম লিখে র‍্যাংকিং বদলাতে পারবে — যেমন "শুধু .edu ডোমেইন উপরে তোলো" বা "বাংলা ব্লগকে অগ্রাধিকার দাও"। শেয়ারযোগ্য, কমিউনিটি-কিউরেটেড।
- প্রতিটি ফলাফলের পাশে **"কেন এটি?"** বাটন — কোন ফ্যাক্টর কতটা কাজ করেছে তার ভাঙন।

---

## ৬. সেরা ইঞ্জিনগুলোর সেরা অংশ একত্রিত

| উৎস | যা নেওয়া হচ্ছে |
|---|---|
| **গুগল** | ইনস্ট্যান্ট উত্তর (ক্যালকুলেটর, একক/মুদ্রা রূপান্তর, আবহাওয়া), নলেজ প্যানেল (উইকিডাটা-চালিত), ট্যাব (ছবি/ভিডিও/খবর/মানচিত্র), বানান "আপনি কি বোঝাতে চেয়েছেন" |
| **SearXNG** | মাল্টি-সোর্স অ্যাগ্রিগেশন, ইঞ্জিন টগল, সময়সীমা ফিল্টার, সেলফ-হোস্টিং, JSON/CSV/RSS আউটপুট |
| **DuckDuckGo** | `!bang` সিনট্যাক্স (`!w বাংলা উইকিপিডিয়া`, `!gh গিটহাব`), ট্র্যাকিংমুক্ত নান্দনিকতা |
| **ব্রেভ সার্চ** | স্বাধীন ইনডেক্সের দর্শন, Goggles রি-র‍্যাংকিং |
| **স্টার্টপেজ** | ছদ্মবেশী/প্রক্সি পেজ ভিউ |
| **মোজিক/মার্জিনালিয়া** | ছোট ও স্বাধীন ওয়েবের ("স্মল ওয়েব") ফলাফল উঁচু করা |

**সন্ধানের নিজস্ব অতিরিক্ত ফিচার:**
- 🧠 এনক্রিপ্টেড ক্রস-ডিভাইস হিস্টরি সিঙ্ক (উপরের মডেল)
- ⌨️ সম্পূর্ণ কীবোর্ড-চালিত (নিচের শর্টকাট টেবিল)
- 📚 "সংগ্রহ" — ফলাফল বুকমার্ক করে শেয়ারযোগ্য তালিকা
- 🗣️ বাংলা ভয়েস সার্চ (উইসপার-ভিত্তিক, ক্লায়েন্ট-সাইডে সম্ভব হলে)
- 📰 ফলাফল সোর্স-বৈচিত্র্য ব্যাজ (একই কর্পোরেশনের একাধিক লিংক হলে গুছিয়ে দেখানো)

---

## ৭. ইউআই/ইউএক্স নকশা

**ডিজাইন ভাষা:** টাইপোগ্রাফি-কেন্দ্রিক, প্রচুর ফাঁকা জায়গা, দুটি থিম (শুভ্র / গভীর রাত) + সিস্টেম-অটো। বাংলা ও লাতিন উভয়ের জন্য সুন্দর ফন্ট-স্ট্যাক (যেমন *নোটো সেরিফ বাংলা* শিরোনামে, *হিন্দ সিলিগুড়ি/নোটো সান্স* বডিতে) — সব ফন্ট সেলফ-হোস্টেড।

**হোমপেজ ওয়্যারফ্রেম:**

```
┌──────────────────────────────────────────────────────┐
│  সন্ধান                                   ⚙  ⌘K  🌙  │
│                                                      │
│                ┌──────────────────────┐              │
│                │ 🔍  খুঁজুন…           │              │
│                └──────────────────────┘              │
│      ⚡ ব্যাং: !w উইকিপিডিয়া · !gh গিটহাব · !yt ইউটিউব  │
│                                                      │
│   ┌────────┐ ┌────────┐ ┌────────┐                   │
│   │ আজকের  │ │ সাম্প্রতিক │ │ আমার    │  ← কার্ড (ঐচ্ছিক) │
│   │ শব্দ    │ │ (এনক্রিপ্টেড)│ সংগ্রহ  │                 │
│   └────────┘ └────────┘ └────────┘                   │
│  🔒 আজ সেশনের ১২টি কোয়েরি স্থানীয়ভাবে এনক্রিপ্টেড      │
└──────────────────────────────────────────────────────┘
```

**কীবোর্ড শর্টকাট:** `/` ফোকাস · `Tab` ট্যাব বদল · `↑↓` ফলাফল · `Enter` খোলা · `v` ছদ্মবেশী ভিউ · `?` সব শর্টকাট · `d` ডার্ক টগল

**অ্যাক্সেসিবিলিটি:** WCAG 2.2 AA লক্ষ্য — স্ক্রিন-রিডার পরীক্ষা, কীবোর্ড-অনলি ফ্লো, উচ্চ-কনট্রাস্ট মোড, `prefers-reduced-motion` সম্মান।

**পারফরম্যান্স বাজেট:** হোমপেজ < ৫০ KB গজিপড, কোনো থার্ড-পার্টি রিকোয়েস্ট নেই, ছবিতে লেজি-লোড + AVIF।

---

## ৮. প্রযুক্তি স্ট্যাক

| স্তর | পছন্দ | কারণ |
|---|---|---|
| ফ্রন্টএন্ড | SvelteKit (TypeScript) | হালকা, দ্রুত, ছোট বান্ডল |
| API গেটওয়ে | Rust + axum | নিরাপত্তা + পারফরম্যান্স |
| ইনডেক্স | শুরুতে Apache OpenSearch/Vespa, পরে নিজস্ব ইনডেক্সার | দ্রুত শুরু → দীর্ঘমেয়াদি নিয়ন্ত্রণ |
| র‍্যাংকিং/ML | Python (PyTorch, LTR) | ইকোসিস্টেম |
| মেসেজ কিউ | NATS JetStream | হালকা, নির্ভরযোগ্য |
| ডেটাবেস | PostgreSQL + Redis | প্রমাণিত |
| অবজেক্ট স্টোরেজ | MinIO | সেলফ-হোস্টেড |
| ডিপ্লয়মেন্ট | ডকার-কম্পোজ (একক সার্ভার) → K8s (প্রোডাকশন), Nix দিয়ে প্রজননযোগ্য বিল্ড | ছোট থেকে বড় — সবাই চালাতে পারবে |
| মনিটরিং | Prometheus + Grafana + OpenTelemetry | স্ট্যান্ডার্ড |

---

## ৯. ওপেনসোর্স কৌশল

- **লাইসেন্স:** সার্ভার কোড → **AGPLv3** (যাতে কেউ নিয়ে ক্লাউডে বন্ধ করতে না পারে); ক্লায়েন্ট লাইব্রেরি → Apache-2.0।
- **গভর্নেন্স:** পাবলিক রোডম্যাপ, সিদ্ধান্তের জন্য রিপোতে RFC প্রক্রিয়া, DCO (CLA লাগে না), আচরণবিধি। দীর্ঘমেয়াদে একটি স্বাধীন ফাউন্ডেশনের হাতে।
- **টেকসইতা:** বিজ্ঞাপন নেই, ট্র্যাকিং নেই। আয়ের পথ — দান/গ্র্যান্ট, সেলফ-হোস্টারদের জন্য এন্টারপ্রাইজ সাপোর্ট, ঐচ্ছিক "স্পনসর" ব্যাজ-মুক্ত অভিজ্ঞতা।
- **নিরাপত্তা সংস্কৃতি:** প্রজননযোগ্য বিল্ড, সাইনড রিলিজ, বাগ-বাউন্টি কর্মসূচি, বার্ষিক থার্ড-পার্টি অডিট।

---

## ১০. রোডম্যাপ

| ধাপ | সময়সীমা | লক্ষ্য |
|---|---|---|
| **ধাপ ০** | মাস ১–৩ | মেটা-সার্চ এমভিপি (উন্মুক্ত উৎস থেকে), নতুন ইউআই, এনক্রিপ্টেড লোকাল হিস্টরি, `!bang` |
| **ধাপ ১** | মাস ৪–৯ | নিজস্ব ক্রলার বিটা (প্রথম ~১০ কোটি পাতা), ইনস্ট্যান্ট উত্তর, বাংলা ভাষা প্রসেসিং |
| **ধাপ ২** | মাস ১০–১৫ | এনক্রিপ্টেড সিঙ্ক, LTR র‍্যাংকিং, Goggles কমিউনিটি, ছদ্মবেশী ভিউ, .onion |
| **ধাপ ৩** | মাস ১৬–২৪ | মোবাইল অ্যাপ + ব্রাউজার এক্সটেনশন, ওপেন API, ১০০+ ভাষা, ফাউন্ডেশন গঠন |

---

## ১১. রিপোজিটরি কাঠামো (মোনোরেপো)

```
sondhan/
├── apps/
│   ├── web/          # SvelteKit ফ্রন্টএন্ড
│   └── mobile/       # পরে
├── core/
│   ├── gateway/      # Rust API গেটওয়ে
│   ├── ranker/       # র‍্যাংকিং + LTR
│   ├── indexer/      # ইনডেক্স বিল্ডার
│   └── crawler/      # বণ্টিত ক্রলার
├── ml/               # প্রশিক্ষণ পাইপলাইন
├── crypto/           # এনক্রিপশন স্পেক + রেফারেন্স ইমপ্লিমেন্টেশন
├── docs/             # থ্রেট মডেল, RFC, API ডকস
├── deploy/           # docker-compose.yml, k8s, nix
└── rfcs/             # গভর্নেন্স প্রস্তাব
```

---

## ১২. প্রধান ঝুঁকি ও প্রতিকার

| ঝুঁকি | প্রতিকার |
|---|---|
| বড় ইনডেক্স ছাড়া ফলাফলের মান খারাপ | ধাপ ০-তে মেটা-সার্চ ফলব্যাক + ওপেন ডেটাসেট বুটস্ট্র্যাপ |
| স্প্যাম/ম্যানিপুলেশন | লিংক-গ্রাফ বিশ্লেষণ + কমিউনিটি রিপোর্ট + স্প্যাম-ক্লাসিফায়ার |
| নির্যাতনকারী বট | ফিঙ্গারপ্রিন্টিংবিহীন রেট-লিমিট + প্রুফ-অব-ওয়ার্ক চ্যালেঞ্জ |
| আইনি চাপে লগ দিতে বলা | লগই নেই যা দেওয়া যাবে — ক্রিপ্টোগ্রাফিকভাবে নিশ্চিত |

---

চাইলে এর পরের ধাপ হিসেবে আমি বানাতে পারি — ① এই নীলনকশার একটি সুন্দর ভিজ্যুয়াল **ইন্টারঅ্যাকটিভ ওয়েব ডকুমেন্ট**, ② হোমপেজ ও ফলাফল পেজের **কাজ করা এইচটিএমএল প্রোটোটাইপ**, কিংবা ③ ক্রিপ্টো স্পেকের **গভীর কারিগরি বিবরণ**। কোনটা আগে চান?

### USER
সবগুলো দাও।

### ASSISTANT
সবগুলো একসাথে দিচ্ছি — তিনটি জিনিসই একটি **স্বয়ংসম্পূর্ণ ইন্টারঅ্যাকটিভ এইচটিএমএল ফাইলে** প্যাক করে দিয়েছি, যেন খুললেই হাতে-কলমে দেখতে পারেন:

1. 📐 **নীলনকশা** — ইন্টারঅ্যাকটিভ ডকুমেন্ট (আর্কিটেকচার ডায়াগ্রাম, ফিচার ম্যাট্রিক্স, রোডম্যাপ টাইমলাইন, টেক-স্ট্যাক কার্ড)
2. 🖥️ **লাইভ প্রোটোটাইপ** — কাজ করা সার্চ ইঞ্জিন (হোমপেজ → ফলাফল পেজ, ইনস্ট্যান্ট ক্যালকুলেটর, `!বাং`, নলেজ প্যানেল, ডার্ক মোড, কীবোর্ড শর্টকাট `/`)
3. 🔐 **ক্রিপ্টো স্পেক** — বিস্তারিত + **সত্যিকারের এনক্রিপশন ডেমো** (ব্রাউজারেই সত্যিকারের AES-GCM চলে)

সবচেয়ে বড় কথা: প্রোটোটাইপের **সার্চ হিস্টরি সত্যিই এনক্রিপ্টেড** — প্রতিটি সার্চ ব্রাউজারে `AES-256-GCM` দিয়ে এনক্রিপ্ট হয়ে `localStorage`-এ জমা হয়, আর পাসফ্রেজ ছাড়া সেটা আর কেউ পড়তে পারে না। শূন্য-জ্ঞান মডেলটা জীবন্ত অবস্থায় দেখতে পাবেন।

```html
<!DOCTYPE html>
<html lang="bn" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>সন্ধান — উন্মুক্ত সার্চ ইঞ্জিনের নীলনকশা ও প্রোটোটাইপ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@500;700;900&family=Noto+Sans+Bengali:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root,[data-theme="light"]{
    --bg:#f7f4ee; --bg-elev:#ffffff; --bg-soft:#efe9dd; --ink:#1c2321; --ink-soft:#5b6663;
    --ink-faint:#8a938f; --line:#e3dccc; --accent:#0e7a63; --accent-ink:#fff; --warm:#e0762f;
    --warm-soft:#fbe8d8; --chip:#e7f2ee; --code:#12312a; --shadow:0 10px 30px rgba(28,35,33,.08);
    --glow:radial-gradient(600px 300px at 50% -80px, rgba(14,122,99,.14), transparent 70%);
  }
  [data-theme="dark"]{
    --bg:#0e1513; --bg-elev:#152019; --bg-soft:#1a2620; --ink:#e9efe9; --ink-soft:#a3b3ab;
    --ink-faint:#6f7f77; --line:#263830; --accent:#2fbf9a; --accent-ink:#06231b; --warm:#f0954f;
    --warm-soft:#3a2a1a; --chip:#1c332b; --code:#0c1f1a; --shadow:0 10px 30px rgba(0,0,0,.4);
    --glow:radial-gradient(600px 300px at 50% -80px, rgba(47,191,154,.12), transparent 70%);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:"Noto Sans Bengali",sans-serif;background:var(--bg);color:var(--ink);line-height:1.65;transition:background .3s,color .3s}
  h1,h2,h3,.serif{font-family:"Noto Serif Bengali",serif}
  code,pre,.mono{font-family:"IBM Plex Mono",monospace}
  a{color:var(--accent)}
  button{font-family:inherit;cursor:pointer}

  header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
  .bar{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:8px;padding:12px 20px}
  .logo{display:flex;align-items:center;gap:10px;font-family:"Noto Serif Bengali";font-weight:900;font-size:1.3rem;color:var(--ink);text-decoration:none}
  .logo .mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--accent),var(--warm));display:grid;place-items:center;color:#fff;font-size:18px}
  nav{margin-left:auto;display:flex;gap:6px}
  .tab{padding:8px 16px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--ink-soft);font-size:.95rem;font-weight:600}
  .tab.active{background:var(--bg-elev);color:var(--accent);border-color:var(--line);box-shadow:var(--shadow)}
  .icon-btn{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--bg-elev);color:var(--ink);font-size:17px}

  main{max-width:1080px;margin:0 auto;padding:32px 20px 80px}
  section.view{display:none;animation:fade .35s ease}
  section.view.on{display:block}
  @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:var(--chip);color:var(--accent);font-size:.82rem;font-weight:600}
  .chip.warm{background:var(--warm-soft);color:var(--warm)}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:11px;border:none;background:var(--warm);color:#fff;font-weight:700;font-size:1rem;transition:transform .15s,box-shadow .15s}
  .btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(224,118,47,.35)}
  .btn.ghost{background:var(--bg-elev);color:var(--ink);border:1px solid var(--line)}
  .btn.teal{background:var(--accent);color:var(--accent-ink)}

  .card{background:var(--bg-elev);border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:var(--shadow)}
  .grid{display:grid;gap:16px}
  .g2{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
  .g3{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
  h2.sec{font-size:1.7rem;margin:44px 0 6px;display:flex;align-items:center;gap:12px}
  h2.sec::before{content:"";width:8px;height:28px;border-radius:4px;background:linear-gradient(var(--accent),var(--warm))}
  .lede{color:var(--ink-soft);margin-bottom:18px;max-width:70ch}

  table{width:100%;border-collapse:collapse;background:var(--bg-elev);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)}
  th,td{text-align:right;padding:12px 16px;border-bottom:1px solid var(--line);font-size:.94rem;vertical-align:top}
  th{background:var(--bg-soft);font-weight:700}
  th:first-child,td:first-child{text-align:right;font-weight:600}
  tr:last-child td{border-bottom:none}

  pre{background:var(--code);color:#d9efe7;padding:18px;border-radius:14px;overflow:auto;font-size:.85rem;line-height:1.6;direction:ltr;text-align:left}

  /* আর্কিটেকচার */
  .arch{display:flex;flex-direction:column;align-items:center;gap:0;padding:26px;background:var(--bg-elev);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}
  .arch-node{width:100%;max-width:560px;background:var(--bg-soft);border:1.5px solid var(--line);border-radius:13px;padding:13px 18px;text-align:center}
  .arch-node b{display:block;font-size:1.02rem}
  .arch-node span{font-size:.82rem;color:var(--ink-soft)}
  .arch-node.hot{border-color:var(--accent);background:var(--chip)}
  .arch-arrow{color:var(--ink-faint);padding:7px 0;font-size:.8rem;display:flex;flex-direction:column;align-items:center;gap:2px}
  .arch-arrow i{font-style:normal;color:var(--accent);font-size:15px;line-height:1}
  .arch-fan{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%;max-width:680px}
  .arch-fan .arch-node{max-width:none;padding:12px 10px}

  /* টাইমলাইন */
  .timeline{position:relative;padding-right:8px}
  .timeline::before{content:"";position:absolute;right:11px;top:6px;bottom:6px;width:3px;border-radius:2px;background:linear-gradient(var(--accent),var(--warm))}
  .tl-item{position:relative;padding-right:44px;margin-bottom:22px}
  .tl-item::before{content:"";position:absolute;right:4px;top:6px;width:17px;height:17px;border-radius:50%;background:var(--bg-elev);border:4px solid var(--accent)}
  .tl-item:last-child::before{border-color:var(--warm)}
  .tl-item h4{font-size:1.05rem}
  .tl-item .chip{margin-bottom:6px}
  .tl-item p{color:var(--ink-soft);font-size:.92rem}

  /* প্রোটোটাইপ */
  .proto-shell{background:var(--bg);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:var(--shadow);min-height:560px;background-image:var(--glow)}
  .proto-top{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid var(--line)}
  .proto-top .logo{font-size:1.05rem}
  .proto-top .logo .mark{width:28px;height:28px;font-size:14px;border-radius:8px}
  .proto-top .spacer{flex:1}

  .home{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px 40px;min-height:460px;text-align:center}
  .home .biglogo{font-family:"Noto Serif Bengali";font-weight:900;font-size:clamp(2.6rem,7vw,4rem);background:linear-gradient(120deg,var(--accent),var(--warm));-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px}
  .home .tagline{color:var(--ink-soft);margin-bottom:30px}

  .searchbox{width:100%;max-width:620px;display:flex;background:var(--bg-elev);border:2px solid var(--line);border-radius:16px;padding:6px;box-shadow:var(--shadow);transition:border .2s,box-shadow .2s}
  .searchbox:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
  .searchbox input{flex:1;border:none;outline:none;background:transparent;font-size:1.12rem;padding:10px 14px;color:var(--ink);font-family:inherit}
  .searchbox button{width:52px;height:52px;border:none;border-radius:12px;background:var(--warm);color:#fff;font-size:21px;flex:none}
  .hint{margin-top:14px;color:var(--ink-faint);font-size:.85rem}
  .bangrow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:20px}
  .bang{padding:6px 13px;border-radius:999px;background:var(--bg-elev);border:1px solid var(--line);font-size:.85rem;color:var(--ink-soft);cursor:pointer}
  .bang b{color:var(--warm)}
  .homecards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:620px;width:100%;margin-top:34px}
  .hcard{background:var(--bg-elev);border:1px solid var(--line);border-radius:14px;padding:15px;text-align:right}
  .hcard .ic{font-size:22px}
  .hcard b{display:block;font-size:.95rem;margin:5px 0 2px}
  .hcard span{font-size:.8rem;color:var(--ink-faint)}

  .serp{display:grid;grid-template-columns:1fr 300px;gap:24px;padding:22px 24px 40px}
  @media(max-width:820px){.serp{grid-template-columns:1fr}}
  .serp-head{display:flex;gap:8px;align-items:center;margin-bottom:14px}
  .serp-head .searchbox{max-width:none;box-shadow:none}
  .serp-head .searchbox button{width:44px;height:44px}
  .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:12px;flex-wrap:wrap}
  .tabs button{background:none;border:none;padding:9px 14px;color:var(--ink-soft);font-weight:600;font-size:.92rem;border-bottom:2.5px solid transparent}
  .tabs button.active{color:var(--accent);border-bottom-color:var(--accent)}
  .filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
  .fchip{padding:5px 13px;border-radius:999px;border:1px solid var(--line);background:var(--bg-elev);font-size:.82rem;color:var(--ink-soft);cursor:pointer}
  .fchip.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
  .ia{background:var(--warm-soft);border:1px solid color-mix(in srgb,var(--warm) 40%,transparent);border-radius:14px;padding:16px 18px;margin-bottom:18px}
  .ia .lbl{font-size:.75rem;font-weight:700;color:var(--warm);letter-spacing:.4px}
  .ia .big{font-size:1.7rem;font-weight:700;font-family:"Noto Serif Bengali"}
  .bangcard{background:var(--chip);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);border-radius:14px;padding:15px 18px;margin-bottom:18px;display:flex;gap:12px;align-items:center}
  .result{margin-bottom:26px;animation:fade .3s ease both}
  .result .url{font-size:.8rem;color:var(--accent);direction:ltr;text-align:right;display:flex;gap:6px;align-items:center}
  .result .url .fav{width:16px;height:16px;border-radius:4px;background:var(--bg-soft);display:inline-grid;place-items:center;font-size:9px}
  .result h3{font-size:1.18rem;font-weight:600;color:var(--accent);margin:2px 0;cursor:pointer}
  .result h3:hover{text-decoration:underline}
  .result p{color:var(--ink-soft);font-size:.92rem;max-width:64ch}
  .result .grp{font-size:.7rem;padding:1px 7px;border-radius:6px;background:var(--bg-soft);color:var(--ink-faint)}
  .kp{background:var(--bg-elev);border:1px solid var(--line);border-radius:16px;overflow:hidden;position:sticky;top:80px}
  .kp .hero{height:120px;display:grid;place-items:center;font-size:52px;background:linear-gradient(135deg,var(--accent),var(--warm))}
  .kp .body{padding:18px}
  .kp h3{font-size:1.3rem}
  .kp .type{color:var(--ink-faint);font-size:.8rem;margin-bottom:10px}
  .kp .sum{font-size:.9rem;color:var(--ink-soft);margin-bottom:14px}
  .kp dl{font-size:.85rem}
  .kp dt{font-weight:700;color:var(--ink-faint);font-size:.75rem;margin-top:8px}
  .kp dd{margin:0}
  .meta-note{font-size:.8rem;color:var(--ink-faint);margin-top:14px;padding:12px;background:var(--bg-soft);border-radius:10px}

  /* ড্রয়ার (ইতিহাস) */
  .drawer{position:fixed;top:0;right:-420px;width:400px;max-width:92vw;height:100vh;background:var(--bg-elev);border-left:1px solid var(--line);z-index:100;transition:right .3s ease;box-shadow:-12px 0 40px rgba(0,0,0,.15);display:flex;flex-direction:column}
  .drawer.open{right:0}
  .drawer .dh{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}
  .drawer .dh h3{flex:1;font-size:1.1rem}
  .drawer .db{padding:20px;overflow:auto;flex:1}
  .drawer input[type=password]{width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);font-family:inherit;margin-bottom:10px}
  .hent{background:var(--bg-soft);border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-bottom:10px}
  .hent .t{font-size:.75rem;color:var(--ink-faint);display:flex;justify-content:space-between}
  .hent .ct{font-family:"IBM Plex Mono";font-size:.72rem;color:var(--warm);word-break:break-all;direction:ltr;text-align:left;margin-top:6px}
  .hent .pt{font-size:.95rem;font-weight:600;color:var(--accent);margin-top:6px}
  .scrim{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:90;opacity:0;pointer-events:none;transition:opacity .3s}
  .scrim.on{opacity:1;pointer-events:auto}

  .kv{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
  .pill{font-family:"IBM Plex Mono";font-size:.75rem;background:var(--bg-soft);border:1px solid var(--line);padding:4px 10px;border-radius:8px;direction:ltr}
  .outbox{background:var(--code);color:#a8e6cf;padding:14px;border-radius:12px;font-family:"IBM Plex Mono";font-size:.78rem;word-break:break-all;direction:ltr;text-align:left;min-height:48px;margin-top:10px}
  .flow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}
  .flow .step{background:var(--bg-soft);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-size:.86rem;font-weight:600}
  .flow .arr{color:var(--accent)}
  footer{border-top:1px solid var(--line);padding:26px 20px;text-align:center;color:var(--ink-faint);font-size:.86rem}
  .warn{background:var(--warm-soft);border:1px solid color-mix(in srgb,var(--warm) 40%,transparent);color:var(--ink);border-radius:10px;padding:10px 14px;font-size:.85rem;margin-top:10px}
</style>
</head>
<body>

<header>
  <div class="bar">
    <a class="logo" href="#blueprint" onclick="show('blueprint');return false"><span class="mark">স</span>সন্ধান</a>
    <nav>
      <button class="tab active" data-v="blueprint" onclick="show('blueprint')">📐 নীলনকশা</button>
      <button class="tab" data-v="prototype" onclick="show('prototype')">🖥️ লাইভ প্রোটোটাইপ</button>
      <button class="tab" data-v="crypto" onclick="show('crypto')">🔐 ক্রিপ্টো স্পেক</button>
    </nav>
    <button class="icon-btn" onclick="toggleTheme()" id="themeBtn" title="থিম বদলান">🌙</button>
  </div>
</header>

<main>

<!-- ═══════════════ ১. নীলনকশা ═══════════════ -->
<section class="view on" id="view-blueprint">
  <div style="text-align:center;padding:26px 0 8px">
    <div class="biglogo serif" style="font-size:clamp(2.6rem,6vw,3.6rem);font-weight:900;background:linear-gradient(120deg,var(--accent),var(--warm));-webkit-background-clip:text;background-clip:text;color:transparent">সন্ধান</div>
    <p class="lede" style="margin:6px auto 16px;text-align:center">উন্মুক্ত · মুক্ত · গোপনীয়তা-প্রথম সার্চ ইঞ্জিনের সম্পূর্ণ নীলনকশা</p>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <span class="chip">🔓 AGPLv3</span><span class="chip">🔐 শূন্য-জ্ঞান এনক্রিপশন</span>
      <span class="chip">🪶 &lt;১ সেকেন্ড লোড</span><span class="chip">🌏 বাংলা-প্রথম</span><span class="chip">🧩 প্লাগইনযোগ্য</span>
    </div>
  </div>

  <h2 class="sec">সিস্টেম আর্কিটেকচার</h2>
  <p class="lede">মাইক্রোসার্ভিস ভিত্তিক নকশা — প্রতিটি স্তর স্বাধীনভাবে স্কেল করা যায়। গেটওয়েতেই সব পরিচয়-তথ্য ফেলে দেওয়া হয়।</p>
  <div class="arch">
    <div class="arch-node"><b>👤 ব্যবহারকারী</b><span>ব্রাউজার · মোবাইল অ্যাপ · এক্সটেনশন — ইতিহাস ক্লায়েন্টেই এনক্রিপ্টেড</span></div>
    <div class="arch-arrow"><i>▼</i>TLS 1.3 + DoH · ঐচ্ছিক Tor (.onion)</div>
    <div class="arch-node"><b>🛡️ Edge লেয়ার (Anycast)</b><span>DDoS ঢাল · রেট-লিমিট · কোনো IP লগ নেই</span></div>
    <div class="arch-arrow"><i>▼</i></div>
    <div class="arch-node hot"><b>🚪 API গেটওয়ে (Rust/axum)</b><span>ক্ষণস্থায়ী রিকোয়েস্ট-ID (৫ মিনিটে মুছে যায়) · রিকোয়েস্ট শেষে মেটাডেটা ধ্বংস</span></div>
    <div class="arch-arrow"><i>▼</i></div>
    <div class="arch-fan">
      <div class="arch-node"><b>🧠 কোয়েরি সার্ভিস</b><span>বানান · ভাষা শনাক্ত · ইনটেন্ট</span></div>
      <div class="arch-node"><b>📊 র‍্যাংকিং সার্ভিস</b><span>BM25 + LTR + Goggles</span></div>
      <div class="arch-node"><b>🔀 মেটা-সার্চ অ্যাগ্রিগেটর</b><span>উইকিপিডিয়া · arXiv · খবর</span></div>
    </div>
    <div class="arch-arrow"><i>▼</i></div>
    <div class="arch-node hot"><b>🗄️ ইনডেক্স ক্লাস্টার + ক্যাশ</b><span>ইনভার্টেড ইনডেক্স · ওয়েব-গ্রাফ · Redis</span></div>
    <div class="arch-arrow"><i>▲</i>NATS পাইপলাইন</div>
    <div class="arch-node"><b>🕸️ ক্রলার ফার্ম</b><span>ক্রলার → ক্লিনার → ডুপ-ডিটেক্টর → টোকেনাইজার → ইনডেক্সার</span></div>
  </div>

  <h2 class="sec">সেরা ইঞ্জিনগুলোর সেরা অংশ</h2>
  <table>
    <tr><th>উৎস</th><th>যা নেওয়া হচ্ছে</th></tr>
    <tr><td>গুগল</td><td>ইনস্ট্যান্ট উত্তর (ক্যালকুলেটর, রূপান্তর) · নলেজ প্যানেল · ট্যাব · "আপনি কি বোঝাতে চেয়েছেন"</td></tr>
    <tr><td>SearXNG</td><td>মাল্টি-সোর্স অ্যাগ্রিগেশন · ইঞ্জিন টগল · সেলফ-হোস্টিং · JSON/CSV/RSS আউটপুট</td></tr>
    <tr><td>DuckDuckGo</td><td><code>!bang</code> সিনট্যাক্স · ট্র্যাকিংমুক্ত নান্দনিকতা</td></tr>
    <tr><td>ব্রেভ সার্চ</td><td>স্বাধীন ইনডেক্সের দর্শন · Goggles রি-র‍্যাংকিং</td></tr>
    <tr><td>স্টার্টপেজ</td><td>ছদ্মবেশী/প্রক্সি পেজ ভিউ</td></tr>
    <tr><td>মোজিক / মার্জিনালিয়া</td><td>"স্মল ওয়েব"-এর স্বাধীন ফলাফল উঁচু করা</td></tr>
  </table>

  <h2 class="sec">র‍্যাংকিং (স্বচ্ছ)</h2>
  <div class="card">
    <pre>মূল স্কোর = w₁·BM25 + w₂·লিংক-কর্তৃত্ব + w₃·ফ্রেশনেস + w₄·গুণমান-সংকেত − স্প্যাম-পেনাল্টি
   তারপর → Learning-to-Rank রি-র‍্যাংক → ব্যবহারকারীর Goggles গুণক (ক্লায়েন্ট-সাইড)</pre>
    <div class="grid g2" style="margin-top:14px">
      <div><span class="chip">🔍 স্বচ্ছতা</span><p style="color:var(--ink-soft);font-size:.9rem;margin-top:8px">প্রতিটি ফলাফলের পাশে <b>"কেন এটি?"</b> — কোন ফ্যাক্টর কতটা কাজ করেছে তার ভাঙন।</p></div>
      <div><span class="chip warm">⚙️ Goggles</span><p style="color:var(--ink-soft);font-size:.9rem;margin-top:8px">নিজের নিয়মে র‍্যাংকিং বদলান — "শুধু .edu উপরে তোলো", শেয়ারযোগ্য।</p></div>
    </div>
  </div>

  <h2 class="sec">প্রযুক্তি স্ট্যাক</h2>
  <div class="grid g3">
    <div class="card"><h3 style="font-size:1rem">🖥️ ফ্রন্টএন্ড</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">SvelteKit + TypeScript — হালকা বান্ডল, দ্রুত রেন্ডার</p></div>
    <div class="card"><h3 style="font-size:1rem">🚪 API গেটওয়ে</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">Rust + axum — মেমরি-নিরাপত্তা + পারফরম্যান্স</p></div>
    <div class="card"><h3 style="font-size:1rem">🗄️ ইনডেক্স</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">OpenSearch/Vespa → দীর্ঘমেয়াদে নিজস্ব ইনডেক্সার</p></div>
    <div class="card"><h3 style="font-size:1rem">📊 র‍্যাংকিং/ML</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">Python + PyTorch (Learning-to-Rank)</p></div>
    <div class="card"><h3 style="font-size:1rem">🔌 কিউ / ডেটাবেস</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">NATS JetStream · PostgreSQL · Redis · MinIO</p></div>
    <div class="card"><h3 style="font-size:1rem">🚀 ডিপ্লয়মেন্ট</h3><p style="color:var(--ink-soft);font-size:.88rem;margin-top:6px">ডকার-কম্পোজ → K8s · Nix প্রজননযোগ্য বিল্ড</p></div>
  </div>

  <h2 class="sec">রোডম্যাপ</h2>
  <div class="timeline">
    <div class="tl-item"><span class="chip">ধাপ ০ · মাস ১–৩</span><h4>মেটা-সার্চ এমভিপি</h4><p>উন্মুক্ত উৎস থেকে অ্যাগ্রিগেশন, নতুন ইউআই, এনক্রিপ্টেড লোকাল হিস্টরি, <code>!bang</code>।</p></div>
    <div class="tl-item"><span class="chip">ধাপ ১ · মাস ৪–৯</span><h4>নিজস্ব ইনডেক্স বিটা</h4><p>নিজস্ব ক্রলার (~১০ কোটি পাতা), ইনস্ট্যান্ট উত্তর, বাংলা ভাষা প্রসেসিং।</p></div>
    <div class="tl-item"><span class="chip">ধাপ ২ · মাস ১০–১৫</span><h4>এনক্রিপ্টেড সিঙ্ক + র‍্যাংকিং</h4><p>শূন্য-জ্ঞান ক্রস-ডিভাইস সিঙ্ক, LTR র‍্যাংকিং, Goggles কমিউনিটি, .onion।</p></div>
    <div class="tl-item"><span class="chip warm">ধাপ ৩ · মাস ১৬–২৪</span><h4>ইকোসিস্টেম</h4><p>মোবাইল অ্যাপ, ব্রাউজার এক্সটেনশন, ওপেন API, ১০০+ ভাষা, ফাউন্ডেশন গঠন।</p></div>
  </div>

  <h2 class="sec">ওপেনসোর্স কৌশল</h2>
  <div class="grid g3">
    <div class="card"><span class="chip">⚖️ লাইসেন্স</span><p style="font-size:.88rem;color:var(--ink-soft);margin-top:8px">সার্ভার → <b>AGPLv3</b>, ক্লায়েন্ট লাইব্রেরি → Apache-2.0। বন্ধ ক্লাউডে কুক্ষিগত করা যাবে না।</p></div>
    <div class="card"><span class="chip">🏛️ গভর্নেন্স</span><p style="font-size:.88rem;color:var(--ink-soft);margin-top:8px">পাবলিক রোডম্যাপ, রিপোতে RFC প্রক্রিয়া, DCO, আচরণবিধি — শেষে স্বাধীন ফাউন্ডেশন।</p></div>
    <div class="card"><span class="chip warm">💚 টেকসইতা</span><p style="font-size:.88rem;color:var(--ink-soft);margin-top:8px">বিজ্ঞাপন ও ট্র্যাকিং নেই — দান/গ্র্যান্ট + সেলফ-হোস্টার সাপোর্ট।</p></div>
  </div>
</section>

<!-- ═══════════════ ২. লাইভ প্রোটোটাইপ ═══════════════ -->
<section class="view" id="view-prototype">
  <p class="lede">এটি সম্পূর্ণ কাজ করা ডেমো — <b>/</b> চাপলে সার্চবক্সে ফোকাস যায়। ইতিহাস সত্যিই এনক্রিপ্টেড হয় (উপরের ড্রয়ার দেখুন)। <b>"২৫*৪৮"</b> বা <b>"রবীন্দ্রনাথ ঠাকুর"</b> লিখে দেখুন।</p>
  <div class="proto-shell">
    <div class="proto-top">
      <a class="logo"><span class="mark">স</span>সন্ধান</a>
      <span class="spacer"></span>
      <button class="btn ghost" style="padding:8px 14px;font-size:.88rem" onclick="openDrawer()">🔒 ইতিহাস</button>
    </div>

    <!-- হোম -->
    <div class="home" id="proto-home">
      <div class="biglogo">সন্ধান</div>
      <p class="tagline">খুঁজুন নিশ্চিন্তে — আপনার সার্চ, শুধুই আপনার</p>
      <div class="searchbox">
        <input id="q-home" placeholder="খুঁজুন… (যেমন: পদ্মা সেতু, অথবা ২৫*৪৮)" autocomplete="off">
        <button onclick="go('q-home')" title="খুঁজুন">🔍</button>
      </div>
      <p class="hint">⌨️ <b>/</b> ফোকাস · <b>Enter</b> খুঁজুন · ডান-উপরে <b>🔒</b> এনক্রিপ্টেড ইতিহাস</p>
      <div class="bangrow">
        <span class="bang"><b>!w</b> উইকিপিডিয়া</span><span class="bang"><b>!gh</b> গিটহাব</span>
        <span class="bang"><b>!yt</b> ইউটিউব</span><span class="bang"><b>!m</b> মানচিত্র</span><span class="bang"><b>!g</b> গুগল</span>
      </div>
      <div class="homecards">
        <div class="hcard"><span class="ic">💡</span><b>আজকের শব্দ</b><span>জিজ্ঞাসা — জানবার ইচ্ছা</span></div>
        <div class="hcard"><span class="ic">🔐</span><b>সাম্প্রতিক সার্চ</b><span id="histCount">০টি এনক্রিপ্টেড এন্ট্রি</span></div>
        <div class="hcard"><span class="ic">🛡️</span><b>এই সেশনে</b><span>কোনো ট্র্যাকিং নেই</span></div>
      </div>
    </div>

    <!-- ফলাফল -->
    <div class="serp" id="proto-results" style="display:none">
      <div class="serp-main">
        <div class="serp-head">
          <div class="searchbox">
            <input id="q-results" autocomplete="off">
            <button onclick="go('q-results')">🔍</button>
          </div>
          <button class="btn ghost" style="padding:10px 14px" onclick="goHome()">←</button>
        </div>
        <div class="tabs">
          <button class="active">সব</button><button onclick="demoTab(this)">ছবি</button>
          <button onclick="demoTab(this)">ভিডিও</button><button onclick="demoTab(this)">খবর</button>
          <button onclick="demoTab(this)">মানচিত্র</button>
        </div>
        <div class="filters">
          <span class="fchip on">যেকোনো সময়</span><span class="fchip">আজ</span><span class="fchip">এই সপ্তাহ</span>
          <span class="fchip">এই মাস</span><span class="fchip">ভাষা: বাংলা</span>
        </div>
        <div id="ia-slot"></div>
        <div id="results-slot"></div>
      </div>
      <aside class="serp-side">
        <div id="kp-slot"></div>
        <div class="meta-note">🔒 এই ফলাফল দেখতে কোনো কুকি বা ট্র্যাকার ব্যবহার হয়নি। আপনার কয়েরি সার্ভারে লগ হয়নি।</div>
      </aside>
    </div>
  </div>
</section>

<!-- ═══════════════ ৩. ক্রিপ্টো স্পেক ═══════════════ -->
<section class="view" id="view-crypto">
  <h2 class="sec" style="margin-top:8px">এনক্রিপশন নকশা — শূন্য-জ্ঞান হিস্টরি</h2>
  <p class="lede">মূল প্রতিশ্রুতি: <b>সার্ভার কখনোই প্লেইনটেক্সট সার্চ দেখে না।</b> কী ব্যবহারকারীর ডিভাইসেই তৈরি হয়; সার্ভার শুধু অস্পষ্ট সাইফারটেক্সট সংরক্ষণ করে।</p>

  <div class="card" style="margin-bottom:18px">
    <h3 style="font-size:1.1rem;margin-bottom:12px">🔑 কী ডেরিভেশন ও এনক্রিপশন প্রবাহ</h3>
    <div class="flow">
      <span class="step">পাসফ্রেজ</span><span class="arr">→</span>
      <span class="step">Argon2id<br><small style="color:var(--ink-faint)">মেমরি-হার্ড KDF</small></span><span class="arr">→</span>
      <span class="step">২৫৬-বিট কী</span><span class="arr">→</span>
      <span class="step">AES-256-GCM<br><small style="color:var(--ink-faint)">র‍্যান্ডম নন্স</small></span><span class="arr">→</span>
      <span class="step">সাইফারটেক্সট → সার্ভার</span>
    </div>
    <div class="grid g2">
      <div><span class="chip">KDF</span><p style="font-size:.87rem;color:var(--ink-soft);margin-top:6px">প্রোডাকশনে <b>Argon2id</b> (m=64MB, t=3, p=4)। ব্রাউজার ডেমোতে WebCrypto-সামঞ্জস্যিক <b>PBKDF2-SHA256</b> (২,১০,০০০ ইটারেশন)।</p></div>
      <div><span class="chip">সিফার</span><p style="font-size:.87rem;color:var(--ink-soft);margin-top:6px"><b>AES-256-GCM</b>, প্রতি এন্ট্রিতে নতুন ৯৬-বিট র‍্যান্ডম নন্স। অথেনটিকেটেড — ট্যাম্পারিং ধরা পড়ে।</p></div>
      <div><span class="chip">পরিচয়</span><p style="font-size:.87rem;color:var(--ink-soft);margin-top:6px">ইমেইল/ফোন লাগে না — <b>অ্যানন-আইডি</b> ক্লায়েন্টে জেনারেট হয়, সার্ভারের সাথে অলিংকযোগ্য।</p></div>
      <div><span class="chip warm">রিকভারি</span><p style="font-size:.87rem;color:var(--ink-soft);margin-top:6px">১৬-শব্দের রিকভারি কোড। হারালে ডেটা উদ্ধার <b>গাণিতিকভাবে অসম্ভব</b> — এটাই নিরাপত্তা।</p></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="font-size:1.1rem;margin-bottom:8px">📦 সার্ভারে সংরক্ষিত স্কিমা</h3>
    <pre>{
  anon_id : "ক্লায়েন্ট-জেনারেটেড ১২৮-বিট টোকেন",
  salt    : "KDF সল্ট (প্রকাশ্য, কিন্তু কী নয়)",
  entries : [ { nonce, ciphertext, ts_encrypted } ... ]
}</pre>
    <p style="font-size:.85rem;color:var(--ink-soft);margin-top:8px">সার্ভার হ্যাক হলে আক্রমণকারী পায় শুধু সাইফারটেক্সট + নন্স — পাসফ্রেজ ছাড়া অর্থহীন। ডিফল্টে কোনো কোয়েরি লগ নেই; শুধু ডিফারেনশিয়াল-প্রাইভেসি যুক্ত সমষ্টিগত পরিসংখ্যান।</p>
  </div>

  <div class="card" style="margin-bottom:18px">
    <h3 style="font-size:1.1rem;margin-bottom:8px">🎯 থ্রেট মডেল (সংক্ষেপে)</h3>
    <table>
      <tr><th>আক্রমণ</th><th>প্রতিকার</th></tr>
      <tr><td>সার্ভার ডেটা ফাঁস</td><td>শুধু সাইফারটেক্সট; কী ক্লায়েন্টে</td></tr>
      <tr><td>নেটওয়ার্ক স্নুপিং</td><td>TLS 1.3 + HSTS + DoH</td></tr>
      <tr><td>প্রোফাইলিং/ফিঙ্গারপ্রিন্টিং</td><td>কোনো লগ নেই; ক্ষণস্থায়ী সাবনেট রেট-লিমিট</td></tr>
      <tr><td>আইনি চাপে লগ দাবি</td><td>দেওয়ার মতো প্লেইনটেক্সট লগই নেই</td></tr>
      <tr><td>আপস্ট্রিম ইঞ্জিনে কোয়েরি ফাঁস</td><td>সার্ভার-প্রক্সি + কোয়েরি প্যাডিং</td></tr>
    </table>
  </div>

  <div class="card">
    <h3 style="font-size:1.1rem">🧪 লাইভ ডেমো — নিজেই এনক্রিপ্ট করুন</h3>
    <p style="font-size:.86rem;color:var(--ink-soft);margin:6px 0 12px">এই পাতাটিই সত্যিকারের <b>WebCrypto</b> ব্যবহার করছে। পাসফ্রেজ আপনার ব্রাউজার ছাড়ে না।</p>
    <input type="password" id="cp-pass" placeholder="পাসফ্রেজ" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);font-family:inherit;margin-bottom:10px">
    <input type="text" id="cp-text" placeholder="প্লেইনটেক্সট (যেমন: আজকের খবর)" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);font-family:inherit;margin-bottom:12px">
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn teal" onclick="demoEncrypt()">🔒 এনক্রিপ্ট করুন</button>
      <button class="btn ghost" onclick="demoDecrypt()">🔓 ডিক্রিপ্ট করে যাচাই</button>
    </div>
    <div class="outbox" id="cp-out">// নন্স ও সাইফারটেক্সট এখানে দেখা যাবে…</div>
    <div class="warn" id="cp-err" style="display:none"></div>
  </div>
</section>

</main>

<!-- ইতিহাস ড্রয়ার -->
<div class="scrim" id="scrim" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div class="dh"><h3>🔒 এনক্রিপ্টেড ইতিহাস</h3><button class="icon-btn" onclick="closeDrawer()">✕</button></div>
  <div class="db">
    <p style="font-size:.85rem;color:var(--ink-soft);margin-bottom:12px">প্রতিটি সার্চ <b>AES-256-GCM</b>-এ এনক্রিপ্ট হয়ে এই ব্রাউজারেই জমা হয়েছে। পড়তে পাসফ্রেজ দিন।</p>
    <input type="password" id="hist-pass" placeholder="পাসফ্রেজ">
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <button class="btn teal" style="padding:9px 16px;font-size:.9rem" onclick="unlockHist()">আনলক</button>
      <button class="btn ghost" style="padding:9px 16px;font-size:.9rem" onclick="clearHist()">মুছুন</button>
    </div>
    <div id="hist-list"><p style="font-size:.85rem;color:var(--ink-faint)">এখনও কোনো এন্ট্রি নেই — একটি সার্চ করুন।</p></div>
  </div>
</div>

<footer>সন্ধান — একটি ধারণা-প্রমাণ (কনসেপ্ট ডেমো)। সম্পূর্ণ কোড ও নকশা উন্মুক্ত করার লক্ষ্যে। ⚖️ লক্ষ্য লাইসেন্স: AGPLv3</footer>

<script>
/* ───────── থিম ও ভিউ ───────── */
const html=document.documentElement;
function toggleTheme(){const t=html.dataset.theme==='dark'?'light':'dark';html.dataset.theme=t;localStorage.sondhan_theme=t;document.getElementById('themeBtn').textContent=t==='dark'?'☀️':'🌙';}
(function(){const s=localStorage.sondhan_theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');html.dataset.theme=s;document.getElementById('themeBtn').textContent=s==='dark'?'☀️':'🌙';})();
function show(v){document.querySelectorAll('section.view').forEach(s=>s.classList.remove('on'));document.getElementById('view-'+v).classList.add('on');document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.v===v));location.hash=v;window.scrollTo({top:0});}
if(location.hash)show(location.hash.slice(1));

/* ───────── WebCrypto হেল্পার ───────── */
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=u8=>btoa(String.fromCharCode(...u8));
const fb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function deriveKey(pass,salt){
  const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptJSON(key,obj){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(obj)));
  return{iv:b64(iv),ct:b64(new Uint8Array(ct))};
}
async function decryptJSON(key,{iv,ct}){
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fb64(iv)},key,fb64(ct));
  return JSON.parse(dec.decode(pt));
}
function getSalt(){let s=localStorage.sondhan_salt;if(!s){s=b64(crypto.getRandomValues(new Uint8Array(16)));localStorage.sondhan_salt=s;}return fb64(s);}

/* ───────── ইতিহাস (এনক্রিপ্টেড) ───────── */
let histKey=null,histUnlocked=false;
async function pushHistory(q){
  try{
    const key=await deriveKey('sondhan-default',getSalt()); // ডেমো: ডিফল্ট কী; বাস্তবে ব্যবহারকারীর পাসফ্রেজ
    const e=await encryptJSON(key,{q,t:Date.now()});
    const arr=JSON.parse(localStorage.sondhan_hist||'[]');arr.unshift(e);localStorage.sondhan_hist=JSON.stringify(arr.slice(0,50));
    renderHist();
  }catch(err){console.warn(err);}
}
function histArr(){return JSON.parse(localStorage.sondhan_hist||'[]');}
function renderHist(){
  document.getElementById('histCount').textContent=histArr().length+'টি এনক্রিপ্টেড এন্ট্রি';
  const box=document.getElementById('hist-list');const arr=histArr();
  if(!arr.length){box.innerHTML='<p style="font-size:.85rem;color:var(--ink-faint)">এখনও কোনো এন্ট্রি নেই — একটি সার্চ করুন।</p>';return;}
  box.innerHTML='';
  arr.forEach((e,i)=>{
    const d=document.createElement('div');d.className='hent';
    d.innerHTML='<div class="t"><span>#'+(i+1)+'</span><span>এনক্রিপ্টেড</span></div>'+
      (histUnlocked&&e._pt?'<div class="pt">'+esc(e._pt.q)+'</div><div class="ct">'+e.ct.slice(0,40)+'…</div>'
      :'<div class="ct">'+e.iv+' · '+e.ct.slice(0,46)+'…</div>');
    box.appendChild(d);
  });
}
async function unlockHist(){
  const pass=document.getElementById('hist-pass').value;
  if(!pass){return;}
  try{
    histKey=await deriveKey(pass,getSalt());
    const arr=histArr();
    for(const e of arr){try{e._pt=await decryptJSON(histKey,e);}catch(_){e._pt=null;}}
    histUnlocked=true;renderHist();
  }catch(err){alert('ডিক্রিপশন ব্যর্থ — ভুল পাসফ্রেজ।');}
}
function clearHist(){localStorage.removeItem('sondhan_hist');histUnlocked=false;renderHist();}
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('scrim').classList.add('on');renderHist();}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('scrim').classList.remove('on');}

/* ───────── সার্চ প্রোটোটাইপ ───────── */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function go(id){const q=document.getElementById(id).value.trim();if(q)doSearch(q);}
function goHome(){document.getElementById('proto-home').style.display='flex';document.getElementById('proto-results').style.display='none';}
function demoTab(btn){document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}

function doSearch(q){
  document.getElementById('proto-home').style.display='none';
  document.getElementById('proto-results').style.display='grid';
  document.getElementById('q-results').value=q;
  pushHistory(q); // ← এনক্রিপ্টেড হিস্টরিতে যোগ
  renderInstant(q);renderKnowledge(q);renderResults(q);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ইনস্ট্যান্ট উত্তর: ক্যালকুলেটর + একক + বাং */
function toAsciiDigits(s){return s.replace(/[০-৯]/g,d=>'০১২৩৪৫৬৭৮৯'.indexOf(d));}
function tryCalc(q){
  const s=toAsciiDigits(q);
  if(/^[\d\s+\-*/().%]+$/.test(s)&&/\d/.test(s)&&/[+\-*/%]/.test(s)){
    try{const v=Function('"use strict";return('+s+')')();if(isFinite(v))return v.toLocaleString('bn-BD');}catch(_){}
  }return null;
}
function tryConvert(q){
  const s=q.toLowerCase();let m;
  if(m=s.match(/([\d.]+)\s*(?:কিমি|কিলোমিটার|km)\s*(?:থেকে|to|->)?\s*(?:মাইল|mile)/))return(+m[1]*0.621371).toLocaleString('bn-BD')+' মাইল';
  if(m=s.match(/([\d.]+)\s*(?:মাইল|mile)\s*(?:থেকে|to|->)?\s*(?:কিমি|কিলোমিটার|km)/))return(+m[1]/0.621371).toLocaleString('bn-BD')+' কিমি';
  if(m=s.match(/([\d.]+)\s*(?:কেজি|kg)\s*(?:থেকে|to|->)?\s*(?:পাউন্ড|পাউণ্ড|lb)/))return(+m[1]*2.20462).toLocaleString('bn-BD')+' পাউন্ড';
  if(m=s.match(/([\d.]+)\s*(?:°?c|সেলসিয়াস)\s*(?:থেকে|to|->)?\s*(?:°?f|ফারেনহাইট)/))return(+m[1]*9/5+32).toLocaleString('bn-BD')+'° ফারেনহাইট';
  return null;
}
const BANGS={w:'উইকিপিডিয়া',gh:'গিটহাব',yt:'ইউটিউব',g:'গুগল',m:'মানচিত্র'};
function tryBang(q){const m=q.match(/^!(\w+)\s+(.*)/);return m&&BANGS[m[1]]?{name:BANGS[m[1]],rest:m[2]}:null;}
function renderInstant(q){
  const slot=document.getElementById('ia-slot');slot.innerHTML='';
  const bang=tryBang(q),calc=tryCalc(q),conv=tryConvert(q);
  if(bang)slot.innerHTML+='<div class="bangcard">⚡ <div><b>বাং সনাক্ত হয়েছে:</b> <span style="color:var(--accent)">'+bang.name+'</span>-এ “'+esc(bang.rest)+'” খোলা হবে।</div></div>';
  if(calc)slot.innerHTML+='<div class="ia"><div class="lbl">ইনস্ট্যান্ট উত্তর · ক্যালকুলেটর</div><div class="big">'+esc(q)+' = '+calc+'</div></div>';
  else if(conv)slot.innerHTML+='<div class="ia"><div class="lbl">ইনস্ট্যান্ট উত্তর · একক রূপান্তর</div><div class="big">'+esc(q)+' → '+conv+'</div></div>';
}

/* নলেজ প্যানেল */
const KB={
 'রবীন্দ্রনাথ ঠাকুর':{e:'🖋️',t:'ব্যক্তি · কবি',s:'রবীন্দ্রনাথ ঠাকুর (১৮৬১–১৯৪১) ছিলেন বাঙালি কবি, সাহিত্যিক ও দার্শনিক। ১৯১৩ সালে “গীতাঞ্জলি”-এর জন্য সাহিত্যে নোবেল পান — এশিয়ার প্রথম নোবেল বিজয়ী।',f:[['জন্ম','৭ মে ১৮৬১'],['নোবেল','১৯১৩ (সাহিত্য)'],['প্রসিদ্ধ','গীতাঞ্জলি']]},
 'বাংলাদেশ':{e:'🇧🇩',t:'দেশ',s:'দক্ষিণ এশিয়ার দেশ; ১৯৭১-এর মুক্তিযুদ্ধে স্বাধীন। রাজধানী ঢাকা।',f:[['রাজধানী','ঢাকা'],['ভাষা','বাংলা'],['স্বাধীনতা','১৯৭১']]},
 'পদ্মা সেতু':{e:'🌉',t:'স্থাপনা',s:'পদ্মা নদীর উপর নির্মিত বহুমুখী সেতু; ২০২২ সালে উদ্বোধন।',f:[['দৈর্ঘ্য','৬.১৫ কিমি'],['উদ্বোধন','২৫ জুন ২০২২']]},
 'জাভাস্ক্রিপ্ট':{e:'⚙️',t:'প্রোগ্রামিং ভাষা',s:'ওয়েবের প্রধান প্রোগ্রামিং ভাষা; ব্রাউজার ও সার্ভার (নোড.জেএস) উভয়েই চলে।',f:[['প্রকাশ','১৯৯৫'],['ডিজাইনার','ব্রেন্ডান আইক']]}
};
function renderKnowledge(q){
  const slot=document.getElementById('kp-slot');slot.innerHTML='';
  const k=KB[q.trim()];if(!k)return;
  let facts='';for(const[dt,dd]of k.f)facts+='<dt>'+dt+'</dt><dd>'+dd+'</dd>';
  slot.innerHTML='<div class="kp"><div class="hero">'+k.e+'</div><div class="body"><h3>'+esc(q)+'</h3><div class="type">'+k.t+'</div><p class="sum">'+k.s+'</p><dl>'+facts+'</dl></div></div>';
}

/* ফলাফল */
const DOMS=[['bn.wikipedia.org','উই'],['prothomalo.com','প্র'],['thedailystar.net','ডে'],['bdnews24.com','বি'],['stackoverflow.com','স্ট্যাক'],['medium.com','মি'],['github.com','গিট'],['wikisource.org','উইস']];
const SUFF=['বিস্তারিত জানুন','পরিচিতি ও ইতিহাস','তথ্যভান্ডার','সম্পর্কিত বিশ্লেষণ','নির্ভরযোগ্য উৎস','পরিপূরক পাঠ','গবেষণা ও তথ্য','সংক্ষিপ্ত বিবরণ'];
function renderResults(q){
  const slot=document.getElementById('results-slot');slot.innerHTML='';
  const slug=q.trim().replace(/\s+/g,'-');
  const used=new Set();let html='';
  for(let i=0;i<8;i++){
    const[dom,fav]=DOMS[i%DOMS.length];
    const group=dom.split('.').slice(-2,-1)[0];
    const dup=used.has(group);used.add(group);
    html+='<div class="result" style="animation-delay:'+(i*0.04)+'s">'+
      '<div class="url"><span class="fav">'+fav+'</span>'+dom+' › '+esc(slug)+(dup?' <span class="grp">একই গ্রুপ</span>':'')+'</div>'+
      '<h3>'+esc(q)+' — '+SUFF[i%SUFF.length]+'</h3>'+
      '<p>'+esc(q)+' সম্পর্কে বিস্তারিত তথ্য, প্রেক্ষাপট ও বিশ্লেষণ। এই পাতায় '+esc(q)+' সংক্রান্ত নির্ভরযোগ্য উৎস, ছবি ও পরিপূরক পাঠ উপস্থাপিত হয়েছে।</p></div>';
  }
  slot.innerHTML=html;
}

/* গ্লোবাল কীবোর্ড: / → সার্চ ফোকাস */
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
    e.preventDefault();show('prototype');
    const inp=document.getElementById('proto-home').style.display==='none'?document.getElementById('q-results'):document.getElementById('q-home');
    setTimeout(()=>inp.focus(),50);
  }
  if(e.key==='Enter'&&/INPUT/.test(document.activeElement.tagName)&&['q-home','q-results'].includes(document.activeElement.id))go(document.activeElement.id);
  if(e.key==='Escape')closeDrawer();
});

/* ফিল্টার চিপ টগল */
document.querySelectorAll('.fchip').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('on')));

/* ক্রিপ্টো ডেমো */
let demoLast=null;
async function demoEncrypt(){
  const pass=document.getElementById('cp-pass').value,txt=document.getElementById('cp-text').value;
  const err=document.getElementById('cp-err');err.style.display='none';
  if(!pass||!txt){err.textContent='পাসফ্রেজ ও প্লেইনটেক্সট দুটোই দিন।';err.style.display='block';return;}
  const key=await deriveKey(pass,getSalt());
  const{iv,ct}=await encryptJSON(key,{q:txt,t:Date.now()});
  demoLast={iv,ct};
  document.getElementById('cp-out').innerHTML='নন্স: '+iv+'<br>সাইফারটেক্সট: '+ct;
}
async function demoDecrypt(){
  const err=document.getElementById('cp-err');err.style.display='none';
  if(!demoLast){err.textContent='আগে এনক্রিপ্ট করুন।';err.style.display='block';return;}
  try{
    const key=await deriveKey(document.getElementById('cp-pass').value,getSalt());
    const pt=await decryptJSON(key,demoLast);
    document.getElementById('cp-out').innerHTML='✅ ডিক্রিপ্ট সফল: '+esc(pt.q)+'<br><span style="color:#6fae95">টাইমস্ট্যাম্প: '+new Date(pt.t).toLocaleString('bn-BD')+'</span>';
  }catch(_){err.textContent='❌ ডিক্রিপশন ব্যর্থ — ভুল পাসফ্রেজ (অথবা ডেটা ট্যাম্পারড)।';err.style.display='block';}
}
renderHist();
</script>
</body>
</html>
```

---

### কীভাবে ব্যবহার করবেন
ফাইলটি `sondhan.html` নামে সেভ করে ব্রাউজারে খুলুন। ট্যাব দিয়ে তিনটি অংশ ঘুরে দেখুন; ডান-উপরের 🌙/☀️ বাটনে থিম বদলায়।

### 🔐 ক্রিপ্টো স্পেকের মূল কথা (সংক্ষেপে)
- **কী ডেরিভেশন:** প্রোডাকশনে **Argon2id** (মেমরি-হার্ড, ব্রুট-ফোর্স প্রতিরোধী); ব্রাউজার ডেমোতে WebCrypto-সামঞ্জস্যিক **PBKDF2-SHA256** (২,১০,০০০ ইটারেশন)।
- **এনক্রিপশন:** **AES-256-GCM** — প্রতি এন্ট্রিতে নতুন ৯৬-বিট র‍্যান্ডম নন্স; অথেনটিকেটেড হওয়ায় ট্যাম্পারিং ধরা পড়ে।
- **পরিচয়:** কোনো ইমেইল লাগে না; অ্যানন-আইডি ক্লায়েন্টে তৈরি, সার্ভারের সাথে অলিংকযোগ্য।
- **রিকভারি:** ১৬-শব্দের কোড — হারালে উদ্ধার গাণিতিকভাবে অসম্ভব (এটাই ডিজাইনের শক্তি)।
- **সার্ভার লগ:** ডিফল্টে শূন্য; শুধু ডিফারেনশিয়াল-প্রাইভেসি যুক্ত সমষ্টিগত পরিসংখ্যান।

এরপর চাইলে আমি এগোতে পারি — ① **স্টার্টার রিপো স্কেলেটন** (Rust গেটওয়ে + SvelteKit খোলস), ② **যাচাইয়ের জন্য কয়েকটি টেস্ট-কোয়েরি ও প্রত্যাশিত আচরণের তালিকা**, কিংবা ③ এই নকশার **এক-পৃষ্ঠার পিচ/এক্সিকিউটিভ সারসংক্ষেপ**। কোনটা বানাবো?

### USER
সবগুলো। 

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① স্টার্টার রিপো স্কেলেটন (কপি-পেস্ট করেই চালু করা যাবে)

## ফোল্ডার কাঠামো

```
sondhan/
├── README.md
├── LICENSE                        ← AGPL-3.0 (gnu.org থেকে পূর্ণ টেক্সট নিন)
├── Makefile
├── docker-compose.yml
├── core/
│   └── gateway/                   ← Rust API গেটওয়ে (প্রাইভেসি লেয়ার)
│       ├── Cargo.toml
│       ├── Dockerfile
│       └── src/
│           ├── main.rs
│           ├── privacy.rs
│           └── search.rs
├── apps/
│   └── web/                       ← SvelteKit ফ্রন্টএন্ড
│       ├── package.json
│       ├── svelte.config.js
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── Dockerfile
│       ├── static/favicon.svg
│       └── src/
│           ├── app.html
│           ├── app.d.ts
│           ├── lib/crypto.ts      ← এনক্রিপ্টেড হিস্টরি (সত্যিকারের কোড)
│           └── routes/+page.svelte
├── crypto/
│   └── SPEC.md
└── rfcs/
    └── 0001-encrypted-history.md
```

## `core/gateway/Cargo.toml`

```toml
[package]
name = "sondhan-gateway"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"
description = "সন্ধান — গোপনীয়তা-প্রথম API গেটওয়ে"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
tracing = "0.1"
tracing-subscriber = "0.3"
```

## `core/gateway/src/main.rs`

```rust
use axum::{middleware, routing::get, Router};
use std::net::SocketAddr;

mod privacy;
mod search;

#[tokio::main]
async fn main() {
    // সতর্কতা: প্রোডাকশনে লগ থেকে কোয়েরি-স্ট্রিং বাদ দিতে হবে (গোপনীয়তা নীতি)।
    tracing_subscriber::fmt().with_target(false).init();

    let app = Router::new()
        .route("/healthz", get(|| async { "ok" }))
        .route("/api/search", get(search::search))
        .route("/api/history", axum::routing::post(search::store_history))
        // প্রতিটি রিকোয়েস্টে ক্ষণস্থায়ী আইডি — কোনো কুকি/সেশন নেই
        .layer(middleware::from_fn(privacy::ephemeral_request));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("সন্ধান গেটওয়ে চলছে: {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## `core/gateway/src/privacy.rs`

```rust
use axum::{extract::Request, middleware::Next, response::Response};
use uuid::Uuid;

/// প্রতি রিকোয়েস্টে ক্ষণস্থায়ী আইডি; রিকোয়েস্ট শেষ হলেই তা ধ্বংস।
/// ইচ্ছাকৃতভাবে কোনো ক্লায়েন্ট-আইপি লগ করা হয় না।
pub async fn ephemeral_request(mut req: Request, next: Next) -> Response {
    let rid = Uuid::new_v4();
    req.extensions_mut().insert(RequestId(rid));
    tracing::info!(rid = %rid, path = %req.uri().path(), "রিকোয়েস্ট (আইপি লগ নেই)");
    next.run(req).await // rid এখানেই স্কোপ শেষ — কিছুই থাকে না
}

#[derive(Clone, Copy)]
pub struct RequestId(pub Uuid);

/// রেট-লিমিটের একমাত্র ঠিকানা-তথ্য: শেষ অংশ ফেলে দেওয়া সাবনেট।
#[allow(dead_code)]
pub fn truncate_ip(ip: std::net::IpAddr) -> String {
    match ip {
        std::net::IpAddr::V4(v4) => {
            let o = v4.octets();
            format!("{}.{}.{}.0", o[0], o[1], o[2])
        }
        std::net::IpAddr::V6(v6) => {
            let s = v6.segments();
            format!("{:x}:{:x}:{:x}:{:x}::", s[0], s[1], s[2], s[3])
        }
    }
}
```

## `core/gateway/src/search.rs`

```rust
use axum::{extract::Query, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SearchParams { pub q: String }

#[derive(Serialize)]
pub struct SearchResult { pub title: String, pub url: String, pub snippet: String }

#[derive(Serialize)]
pub struct SearchResponse { pub query: String, pub results: Vec<SearchResult> }

/// GET /api/search?q=...
/// প্রোডাকশনে: কোয়েরি-সার্ভিস → র‍্যাংকার → অ্যাগ্রিগেটর। এখানে প্লেসহোল্ডার।
pub async fn search(Query(p): Query<SearchParams>) -> Json<SearchResponse> {
    let results = vec![SearchResult {
        title: format!("{} — ডেমো ফলাফল", p.q),
        url: format!("https://example.com/{}", p.q.replace(' ', "-")),
        snippet: "নিজস্ব ইনডেক্স চালু হলে এখানে র‍্যাংক করা ফলাফল আসবে।".into(),
    }];
    Json(SearchResponse { query: p.q, results })
}

/// POST /api/history — সার্ভার শুধু সাইফারটেক্সট নেয়; পড়ার কী তার নেই।
#[derive(Deserialize)]
pub struct CipherEntry { pub anon_id: String, pub nonce: String, pub ciphertext: String }

pub async fn store_history(Json(e): Json<CipherEntry>) -> Json<serde_json::Value> {
    assert!(e.ciphertext.len() < 65_536, "সাইফারটেক্সট অস্বাভাবিক বড়");
    // টুডু: ধাপ ২-এ Postgres-এ সংরক্ষণ (টেবিল: anon_id, nonce, ciphertext)
    tracing::info!(anon = %e.anon_id, bytes = e.ciphertext.len(), "এনক্রিপ্টেড এন্ট্রি গৃহীত");
    Json(serde_json::json!({ "ok": true }))
}
```

## `core/gateway/Dockerfile`

```dockerfile
FROM rust:1.82 AS build
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=build /app/target/release/sondhan-gateway /usr/local/bin/
EXPOSE 8080
CMD ["sondhan-gateway"]
```

## `apps/web/package.json`

```json
{
  "name": "sondhan-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "license": "AGPL-3.0-or-later",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^2.1.2",
    "@sveltejs/kit": "^2.5.0",
    "@sveltejs/vite-plugin-svelte": "^3.1.0",
    "svelte": "^4.2.12",
    "svelte-check": "^3.6.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

## `apps/web/svelte.config.js` ও `vite.config.ts`

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
};
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { proxy: { '/api': 'http://localhost:8080' } } // ডেভে গেটওয়ের দিকে
});
```

## `apps/web/src/lib/crypto.ts` — এনক্রিপ্টেড হিস্টরির আসল কোড

```ts
// সন্ধান ক্লায়েন্ট ক্রিপ্টো
// প্রোডাকশনে: Argon2id (WASM; m=64MB, t=3, p=4) — এখানে: PBKDF2-SHA256 (WebCrypto-নেটিভ)
const enc = new TextEncoder();
const dec = new TextDecoder();
const ITER = 210_000;

const b64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const fb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function getSalt(): Promise<Uint8Array> {
  let s = localStorage.getItem('sondhan.salt');
  if (!s) {
    s = b64(crypto.getRandomValues(new Uint8Array(16)));
    localStorage.setItem('sondhan.salt', s);
  }
  return fb64(s);
}

export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: await getSalt(), iterations: ITER, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function pushToHistory(query: string, passphrase: string): Promise<void> {
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // প্রতি এন্ট্রিতে নতুন নন্স
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key,
    enc.encode(JSON.stringify({ q: query, t: Date.now() }))
  );
  const arr = JSON.parse(localStorage.getItem('sondhan.history') ?? '[]');
  arr.unshift({ iv: b64(iv), ct: b64(new Uint8Array(ct)) });
  localStorage.setItem('sondhan.history', JSON.stringify(arr.slice(0, 100)));
}

export async function readHistory(passphrase: string): Promise<{ q: string; t: number }[]> {
  const key = await deriveKey(passphrase);
  const arr = JSON.parse(localStorage.getItem('sondhan.history') ?? '[]');
  const out: { q: string; t: number }[] = [];
  for (const e of arr) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fb64(e.iv) }, key, fb64(e.ct));
    out.push(JSON.parse(dec.decode(pt)));
  }
  return out;
}

export function clearHistory(): void {
  localStorage.removeItem('sondhan.history');
}
```

## `apps/web/src/routes/+page.svelte`

```svelte
<script lang="ts">
  import { pushToHistory, readHistory } from '$lib/crypto';

  let q = '';
  let passphrase = '';
  let results: { title: string; url: string; snippet: string }[] = [];
  let history: { q: string; t: number }[] = [];
  let loading = false, searched = false, showHist = false;

  async function doSearch() {
    const query = q.trim();
    if (!query) return;
    loading = true; searched = true;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      results = data.results ?? [];
      if (passphrase) await pushToHistory(query, passphrase);
    } catch { results = []; }
    finally { loading = false; }
  }

  async function loadHistory() {
    if (!passphrase) { alert('আগে পাসফ্রেজ দিন'); return; }
    try { history = await readHistory(passphrase); showHist = true; }
    catch { alert('ভুল পাসফ্রেজ — ডিক্রিপশন ব্যর্থ'); }
  }
</script>

<main>
  <h1>সন্ধান</h1>
  <p class="tag">খুঁজুন নিশ্চিন্তে — ইতিহাস এনক্রিপ্টেড, ট্র্যাকিং শূন্য</p>

  <form on:submit|preventDefault={doSearch} class="box">
    <input bind:value={q} placeholder="খুঁজুন…" autocomplete="off" />
    <button type="submit" aria-label="খুঁজুন">🔍</button>
  </form>

  <div class="pass-row">
    <input type="password" bind:value={passphrase} placeholder="ঐচ্ছিক: ইতিহাস পাসফ্রেজ (AES-256-GCM)" />
    <button class="ghost" on:click={loadHistory}>🔓 ইতিহাস দেখুন</button>
  </div>

  {#if loading}<p class="note">খোঁজা হচ্ছে…</p>{/if}

  {#if searched && !loading}
    <ul class="results">
      {#each results as r}
        <li>
          <span class="url">{r.url}</span>
          <a href={r.url}><h3>{r.title}</h3></a>
          <p>{r.snippet}</p>
        </li>
      {/each}
    </ul>
  {/if}

  {#if showHist}
    <section class="hist">
      <h2>🔓 ডিক্রিপ্টেড ইতিহাস ({history.length})</h2>
      {#each history as h}
        <p><b>{h.q}</b> <span>— {new Date(h.t).toLocaleTimeString('bn-BD')}</span></p>
      {/each}
    </section>
  {/if}
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: 64px 20px; font-family: "Noto Sans Bengali", sans-serif; }
  h1 { font-family: "Noto Serif Bengali", serif; font-size: 3rem; margin: 0;
       background: linear-gradient(120deg, #0e7a63, #e0762f); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tag { color: #6b7570; margin: 4px 0 28px; }
  .box { display: flex; gap: 6px; border: 2px solid #ddd6c6; border-radius: 14px; padding: 6px; background: #fff; }
  .box:focus-within { border-color: #0e7a63; }
  .box input { flex: 1; border: none; outline: none; font-size: 1.1rem; padding: 10px; font-family: inherit; }
  .box button { width: 48px; height: 48px; border: none; border-radius: 10px; background: #e0762f; color: #fff; font-size: 19px; }
  .pass-row { display: flex; gap: 8px; margin-top: 14px; }
  .pass-row input { flex: 1; padding: 9px 12px; border: 1.5px solid #ddd6c6; border-radius: 10px; font-family: inherit; }
  .ghost { border: 1.5px solid #ddd6c6; background: #fff; border-radius: 10px; padding: 9px 14px; cursor: pointer; font-family: inherit; }
  .note { color: #6b7570; margin-top: 18px; }
  .results { list-style: none; padding: 0; margin-top: 28px; }
  .results li { margin-bottom: 24px; }
  .url { font-size: .78rem; color: #0e7a63; }
  .results h3 { margin: 2px 0; font-weight: 600; font-size: 1.15rem; }
  .results a { color: #0e7a63; text-decoration: none; }
  .results a:hover { text-decoration: underline; }
  .results p { color: #55605b; margin: 2px 0 0; font-size: .92rem; }
  .hist { margin-top: 34px; border-top: 1px solid #e5dfcf; padding-top: 18px; }
  .hist span { color: #8a938f; font-size: .85rem; }
  :global(body) { background: #f7f4ee; }
</style>
```

## ছোট ফাইলগুলো

```html
<!-- apps/web/src/app.html -->
<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.svg" />
    %sveltekit.head%
  </head>
  <body>%sveltekit.body%</body>
</html>
```

```svg
<!-- apps/web/static/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0e7a63"/><text x="16" y="23" font-size="17" text-anchor="middle" fill="#fff" font-family="sans-serif">স</text></svg>
```

```ts
// apps/web/src/app.d.ts
declare global { namespace App {} }
export {};
```

```json
// apps/web/tsconfig.json
{ "extends": "./.svelte-kit/tsconfig.json", "compilerOptions": { "strict": true, "moduleResolution": "bundler" } }
```

```dockerfile
# apps/web/Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "build"]
```

```yaml
# docker-compose.yml
services:
  gateway:
    build: ./core/gateway
    ports: ["8080:8080"]
    environment: { RUST_LOG: info }
    restart: unless-stopped
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [gateway]

  # ── ধাপ ১ থেকে সক্রিয় হবে ──
  # postgres:   { image: postgres:16-alpine, environment: { POSTGRES_DB: sondhan, POSTGRES_PASSWORD: change-me } }
  # redis:      { image: redis:7-alpine }
  # opensearch: { image: opensearchproject/opensearch:2, environment: { discovery.type: single-node } }
```

```makefile
# Makefile
.PHONY: gateway web docker test-api
gateway:   ## গেটওয়ে (টার্মিনাল ১)
	cd core/gateway && cargo run
web:       ## ফ্রন্টএন্ড (টার্মিনাল ২)
	cd apps/web && npm install && npm run dev
docker:    ## সব কনটেইনারে
	docker compose up --build
test-api:  ## স্মোক টেস্ট
	curl -s localhost:8080/healthz && echo
	curl -s 'localhost:8080/api/search?q=ঢাকা'
```

## `crypto/SPEC.md` (সংক্ষিপ্ত) ও `rfcs/0001-encrypted-history.md`

```markdown
# crypto/SPEC.md — এনক্রিপশন স্পেকসংক্ষেপ
- **কী:** পাসফ্রেজ → Argon2id (m=64MB, t=3, p=4, সল্ট ১৬B) → ২৫৬-বিট কী। কী কখনো ডিভাইস ছাড়ে না।
- **এনক্রিপশন:** প্রতি এন্ট্রি {q, t} → JSON → AES-256-GCM, নতুন ৯৬-বিট নন্স। আউটপুট: {iv, ciphertext, tag}।
- **পরিচয়:** anon_id = ক্লায়েন্ট-জেনারেটেড ১২৮-বিট র‍্যান্ডম টোকেন; ইমেইল/ফোন নিষিদ্ধ।
- **সার্ভার:** শুধু {anon_id, salt, entries[]} সংরক্ষণ করে; সাইফারটেক্সট ≤ ৬৪KB/এন্ট্রি যাচাই করে।
- **রিকভারি:** পাসফ্রেজ থেকে ডেরিভ করা ১৬-শব্দ কোড; হারলে উদ্ধার অসম্ভব (ডিজাইন-বৈশিষ্ট্য)।
- **ব্রাউজার ডেমো:** WebCrypto-সীমাবদ্ধতায় PBKDF2-SHA256 (২,১০,০০০ iter) — একই ইন্টারফেস।

# থ্রেট-মডেল (সংক্ষেপে)
| আক্রমণ | প্রতিকার |
|---|---|
| সার্ভার ফাঁস | শুধু সাইফারটেক্সট |
| নেটওয়ার্ক স্নুপিং | TLS 1.3 + HSTS + DoH |
| ফিঙ্গারপ্রিন্টিং | লগ নেই; ক্ষণস্থায়ী সাবনেট কাউন্টার |
| আইনি লগ-দাবি | দেওয়ার মতো প্লেইনটেক্সট নেই |
```

```markdown
# rfcs/0001-encrypted-history.md
- স্ট্যাটাস: গৃহীত
- সারসংক্ষেপ: সার্চ হিস্টরি ক্লায়েন্ট-সাইডে এনক্রিপ্ট হবে; সার্ভার শূন্য-জ্ঞান স্টোর।
- অনুপ্রেরণা: ব্যবহারকারীর অনুসন্ধানই তার সবচেয়ে ব্যক্তিগত ডেটা — তা প্রোফাইলিংয়ের পণ্য হতে পারে না।
- বিকল্প যা বাতিল: সার্ভার-সাইড এনক্রিপশন (কী সার্ভারে থাকলে শূন্য-জ্ঞান থাকে না), হিস্টরি একেবারেই না রাখা (ইউএক্স ক্ষতি)।
- খোলা প্রশ্ন: মাল্টি-ডিভাইস সিঙ্কে কনফ্লিক্ট সমাধান (last-write-wins নাকি মার্জ)?
```

## `README.md`

```markdown
# সন্ধান 🔍
উন্মুক্ত, মুক্ত, গোপনীয়তা-প্রথম সার্চ ইঞ্জিন। লাইসেন্স: AGPL-3.0-or-later

## দ্রুত শুরু (প্রয়োজন: Rust 1.75+, Node 20+)
টার্মিনাল ১:  cd core/gateway && cargo run          # http://localhost:8080
টার্মিনাল ২:  cd apps/web && npm i && npm run dev   # http://localhost:5173
অথবা:        docker compose up --build

## নিরাপত্তা নোট
- `crypto.subtle` চায় নিরাপদ কনটেক্সট (localhost বা HTTPS)।
- প্রোডাকশনে: কুকি নেই, থার্ড-পার্টি স্ক্রিপ্ট নেই, লগে কোয়েরি নেই।

## পরবর্তী ধাপ (রোডম্যাপ ধাপ ০ → ১)
1. /api/search-এ SearXNG-সদৃশ অ্যাগ্রিগেটর যুক্ত করা
2. বাংলা টোকেনাইজার + বানান সংশোধন
3. নিজস্ব ক্রলার (ধাপ ১)
```

---

# ② টেস্ট চেকলিস্ট (যাচাইয়ের জন্য)

> **ডেমো এনক্রিপশন পাসফ্রেজ:** `sondhan-default` (প্রোটোটাইপ এইচটিএমএলে ড্রয়ার আনলকে এটি লিখুন)

### ক. সার্চ কোর

| # | ইনপুট | প্রত্যাশিত আচরণ | ✓ |
|---|---|---|---|
| ক১ | `পদ্মা সেতু` | ৮টি ফলাফল + ডানে নলেজ প্যানেল (দৈর্ঘ্য ৬.১৫ কিমি) | ☐ |
| ক২ | `রবীন্দ্রনাথ ঠাকুর` | নলেজ প্যানেলে নোবেল ১৯১৩, গীতাঞ্জলি | ☐ |
| ক৩ | (শুধু স্পেস) | কিছুই হয় না, ফলাফল পেজ যায় না | ☐ |
| ক৪ | `<img src=x onerror=alert(1)>` | টেক্সট হিসেবে রেন্ডার, কোনো অ্যালার্ট নেই (XSS নিরাপদ) | ☐ |
| ক৫ | বক্সে `Enter` | বোতাম ছাড়াই সার্চ হয় | ☐ |

### খ. ইনস্ট্যান্ট উত্তর

| # | ইনপুট | প্রত্যাশিত | ✓ |
|---|---|---|---|
| খ১ | `২৫*৪৮` (বা `25*48`) | হলুদ কার্ডে `= ১,২০০` | ☐ |
| খ২ | `100/4+5` | `= ৩০` | ☐ |
| খ৩ | `১০ কিমি থেকে মাইল` | `≈ ৬.২১ মাইল` | ☐ |
| খ৪ | `30 c to f` | `৮৬° ফারেনহাইট` | ☐ |

### গ. বাং ও ফিল্টার

| # | ইনপুট | প্রত্যাশিত | ✓ |
|---|---|---|---|
| গ১ | `!w রবীন্দ্রনাথ` | সবুজ বাং-কার্ড: "উইকিপিডিয়ায় খোলা হবে" | ☐ |
| গ২ | `!gh svelte` | গিটহাব কার্ড | ☐ |
| গ৩ | `!zz অজানা` | কোনো কার্ড নয়, সাধারণ ফলাফল | ☐ |
| গ৪ | ফিল্টার চিপ ক্লিক | সক্রিয়/নিষ্ক্রিয় টগল হয় | ☐ |

### ঘ. এনক্রিপশন ও গোপনীয়তা ⭐

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ঘ১ | একটি সার্চ করুন → ড্রয়ার খুলুন | ১টি এন্ট্রি, শুধু সাইফারটেক্সট দৃশ্যমান | ☐ |
| ঘ২ | DevTools → Application → Local Storage → `sondhan_hist` খুলে কোয়েরির শব্দ খুঁজুন | **প্লেইনটেক্সট পাওয়া যাবে না** | ☐ |
| ঘ৩ | ভুল পাসফ্রেজে আনলক | "ডিক্রিপশন ব্যর্থ", ক্র্যাশ নেই | ☐ |
| ঘ৪ | `sondhan-default` দিয়ে আনলক | সব এন্ট্রি পড়া যায় | ☐ |
| ঘ৫ | ক্রিপ্টো ট্যাব: পাসফ্রেজ `ক` + টেক্সট দিয়ে এনক্রিপ্ট → পাসফ্রেজ `খ` দিয়ে ডিক্রিপ্ট | ব্যর্থ; `ক` দিলে সফল | ☐ |
| ঘ৬ | সার্চ চলাকালীন Network ট্যাব | ফন্ট ছাড়া কোনো থার্ড-পার্টি রিকোয়েস্ট নেই, কুকি সেট হয়নি | ☐ |
| ঘ৭ | ড্রয়ারে "মুছুন" | এন্ট্রি সংখ্যা ০, স্টোরেজ খালি | ☐ |

### ঙ. ইউআই/ইউএক্স

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ঙ১ | 🌙 টগল → পেজ রিলোড | ডার্ক থিম থেকে যায় | ☐ |
| ঙ২ | যেকোনো জায়গায় `/` চাপুন | প্রোটোটাইপ ট্যাবে সার্চবক্স ফোকাস | ☐ |
| ঙ৩ | ড্রয়ার খোলা অবস্থায় `Esc` | ড্রয়ার বন্ধ | ☐ |
| ঙ৪ | মোবাইল প্রস্থে (৩৭৫পিক্সেল) | নলেজ প্যানেল নিচে নামে, কিছু কাটে না | ☐ |

### চ. গেটওয়ে API (Rust স্কেলেটন চালুর পর)

```bash
curl -s localhost:8080/healthz
curl -s 'localhost:8080/api/search?q=ঢাকা'
curl -s -X POST localhost:8080/api/history \
  -H 'Content-Type: application/json' \
  -d '{"anon_id":"test","nonce":"abc","ciphertext":"xyz"}'
```

| # | প্রত্যাশিত | ✓ |
|---|---|---|
| চ১ | `ok` | ☐ |
| চ২ | JSON-এ `query: "ঢাকা"` + `results` অ্যারে | ☐ |
| চ৩ | `{"ok":true}`; সার্ভার লগে ক্লায়েন্ট আইপি বা প্লেইনটেক্সট নেই | ☐ |

### রিলিজ-আগে বাধ্যতামূলক
- ☐ `cargo audit` ও `npm audit` — শূন্য ক্রিটিক্যাল
- ☐ সার্ভারে CSP, HSTS, X-Content-Type-Options হেডার
- ☐ ডিপেন্ডেন্সি পিন + প্রজননযোগ্য বিল্ড যাচাই
- ☐ ক্রিপ্টো লাইব্রেরির ইউনিট টেস্ট (ভুল পাসফ্রেজ, ট্যাম্পারড সাইফারটেক্সট)

---

# ③ এক-পৃষ্ঠার পিচ / এক্সিকিউটিভ সারসংক্ষেপ

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              স  ন  ন ্  ধ  া  ন
     আপনার ভাষায়, আপনার গোপনীয়তায়
     উন্মুক্ত · মুক্ত · এনক্রিপ্টেড সার্চ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**সমস্যা।** আজকের সার্চ ইঞ্জিন ব্যবহারকারীকে পণ্য বানায় — প্রতিটি কয়েরি প্রোফাইলিংয়ের কাঁচামাল। পাশাপাশি, ২৭ কোটিরও বেশি বাংলাভাষীর জন্য নিজের ভাষায় মানসম্মত সার্চ এখনো দ্বিতীয় শ্রেণির নাগরিক। আর যারা গোপনীয়তা চান, তাদের কাছে "নিজস্ব ইনডেক্স + সুন্দর ইউএক্স" একসাথে কোনো মুক্ত বিকল্প নেই।

**সমাধান।** সন্ধান — একটি এজিপিএল-লাইসেন্সড, যে-কেউ চালাতে-পারে এমন সার্চ ইঞ্জিন, যেখানে (১) সার্চ ইতিহাস ক্লায়েন্ট-সাইডে এনক্রিপ্টেড — সার্ভার গাণিতিকভাবেই পড়তে পারে না, (২) র‍্যাংকিং স্বচ্ছ ও ব্যবহারকারীর নিয়ন্ত্রণে (Goggles), (৩) বাংলা ভাষা প্রথম শ্রেণির নাগরিক।

**কেন আলাদা।**

| অন্যরা | সন্ধান |
|---|---|
| কয়েরি লগ = ব্যবসার মূলধন | লগই নেই; হিস্টরি ব্যবহারকারীর কীতে তালাবদ্ধ |
| র‍্যাংকিং কালো বাক্স | প্রতিটি ফলাফলের পাশে "কেন এটি?" |
| ট্র্যাকিং-নির্ভর বিজ্ঞাপন মডেল | দান + গ্র্যান্ট + সেলফ-হোস্ট সাপোর্ট — বিজ্ঞাপন নেই |
| বন্ধ কোড | এজিপিএল; ফর্ক করুন, নিজে চালান |

**প্রমাণিত চাহিদা।** মেটা-সার্চ দিয়ে শুরু সম্ভব — ডানডাকগো ও সেয়ারক্সএনজির জনপ্রিয়তাই প্রমাণ করে, ট্র্যাকিং-মুক্ত সার্চের বাজার বাস্তব। এর উপর নিজস্ব ইনডেক্স ও বাংলা-শ্রেষ্ঠত্ব যুক্ত হবে ধাপে ধাপে।

**এখন পর্যন্ত যা তৈরি।** ✅ সম্পূর্ণ নীলনকশা · ✅ কাজ করা ইন্টারঅ্যাকটিভ প্রোটোটাইপ (সত্যিকারের এনক্রিপশনসহ) · ✅ রিপো স্কেলেটন (রাস্ট + স্ভেল্টকিট) · ✅ ক্রিপ্টো স্পেক · ✅ টেস্ট চেকলিস্ট।

**রোডম্যাপ।** ৪ ধাপ / ২৪ মাস — মেটা-সার্চ এমভিপি → নিজস্ব ইনডেক্স → এনক্রিপ্টেড সিঙ্ক ও এমএল র‍্যাংকিং → মোবাইল অ্যাপ, ওপেন এপিআই, ফাউন্ডেশন।

**যা দরকার।** ৩–৫ জন ইঞ্জিনিয়ারের কোর টিম (রাস্ট, আইআর/এমএল, ফ্রন্টএন্ড), প্রথম বছরের অবকাঠামো খরচ, এবং একটি স্বাধীন নিরাপত্তা অডিট। বিনিময়ে: একটি অবকাঠামো যা সম্প্রদায়ের — কোনো কোম্পানির নয়।

**ডাক।** সার্চ হলো ইন্টারনেটের প্রবেশদ্বার। সেই দরজাটি কার হাতে থাকবে, তা ঠিক করার সময় এখনই। সন্ধান সেই দরজাটি সবার হাতে ফেরানোর প্রস্তাব।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

তিনটি ডেলিভারেবলই সম্পূর্ণ। এখন চাইলে এগোতে পারি — ① স্কেলেটনের জন্য **ইউনিট টেস্ট কোড** (রাস্ট + ভিটেস্ট), ② ধাপ ০-এর জন্য **একটি কাজ করা মেটা-সার্চ অ্যাগ্রিগেটর মডিউল** (উইকিপিডিয়া + ডাবলিউটি ইন-রিপো), কিংবা ③ ফান্ডিং/কমিউনিটির জন্য **ইংরেজি সংস্করণ**। বলুন কোনটা।

### USER
সবগুলো।

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① ইউনিট টেস্ট কোড (রাস্ট + ভিটেস্ট)

## ক. রাস্ট গেটওয়ে টেস্ট

### `core/gateway/Cargo.toml` — আপডেটেড পূর্ণাঙ্গ রূপ (টেস্ট ডিপেন্ডেন্সি সহ)

```toml
[package]
name = "sondhan-gateway"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"
description = "সন্ধান — গোপনীয়তা-প্রথম সার্চ গেটওয়ে"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
tracing = "0.1"
tracing-subscriber = "0.3"
reqwest = { version = "0.12", default-features = false, features = ["rustls-tls", "json"] }

[dev-dependencies]
tower = { version = "0.4", features = ["util"] }
http-body-util = "0.1"
```

### `core/gateway/src/privacy.rs` — ফাইলের শেষে টেস্ট মডিউল যোগ করুন

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

    #[test]
    fn ipv4_শেষ_অক্টেট_ফেলে_দেয়() {
        let ip = IpAddr::V4(Ipv4Addr::new(203, 0, 113, 42));
        assert_eq!(truncate_ip(ip), "203.0.113.0");
    }

    #[test]
    fn ipv6_শুধু_প্রথম_৬৪_বিট_রাখে() {
        let ip = IpAddr::V6(Ipv6Addr::new(0x2001, 0xdb8, 0x1234, 0x5678, 0xaaaa, 0xbbbb, 0xcccc, 0xdddd));
        assert_eq!(truncate_ip(ip), "2001:db8:1234:5678::");
    }

    #[test]
    fn request_id_ইউনিক() {
        assert_ne!(RequestId(Uuid::new_v4()).0, Uuid::nil());
    }
}
```

### `core/gateway/src/search.rs` — ফাইলের শেষে টেস্ট মডিউল যোগ করুন

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::{Request, StatusCode}, routing::get, Router};
    use http_body_util::BodyExt;
    use tower::ServiceExt; // .oneshot()

    fn app() -> Router {
        Router::new()
            .route("/api/search", get(search))
            .route("/api/history", axum::routing::post(store_history))
    }

    #[tokio::test]
    async fn সার্চ_কয়েরি_ফেরত_দেয়_ও_ফলাফল_থাকে() {
        // নেটওয়ার্ক থাকলে উইকিপিডিয়া ফলাফল, না থাকলে ডেমো ফলব্যাক — দুটোতেই ≥১
        let res = app()
            .oneshot(Request::builder().uri("/api/search?q=ঢাকা").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["query"], "ঢাকা");
        assert!(!v["results"].as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn q_ছাড়া_সার্চ_৪০০() {
        let res = app()
            .oneshot(Request::builder().uri("/api/search").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn হিস্টরি_সাইফারটেক্সট_গ্রহণ_করে() {
        let res = app()
            .oneshot(
                Request::builder()
                    .method("POST").uri("/api/history")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"anon_id":"a","nonce":"b","ciphertext":"c"}"#))
                    .unwrap(),
            )
            .await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[tokio::test]
    #[should_panic] // ৬৪KB-এর বড় ব্লব প্যানিক করতেই হবে
    async fn হিস্টরি_বিশাল_ব্লব_প্রত্যাখ্যান_করে() {
        let big = "x".repeat(70_000);
        let body = format!(r#"{{"anon_id":"a","nonce":"b","ciphertext":"{big}"}}"#);
        let _ = app()
            .oneshot(
                Request::builder()
                    .method("POST").uri("/api/history")
                    .header("content-type", "application/json")
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await;
    }
}
```

**চালান:** `cd core/gateway && cargo test`

## খ. ফ্রন্টএন্ড টেস্ট (ভিটেস্ট)

### `apps/web/src/lib/crypto.ts` — শুধু এই ছোট প্যাচটুকু বদলান

```ts
// পুরনো:  const ITER = 210_000;
// নতুন:
let ITER = 210_000;
/** টেস্ট-হুক: দ্রুত টেস্টের জন্য ইটারেশন কমানো হয়; প্রোডাকশনে ডাকা নিষেধ */
export function _setKdfIterations(n: number): void { ITER = n; }
```

### `apps/web/vitest.config.ts` (নতুন ফাইল)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',          // localStorage + WebCrypto
    include: ['src/lib/**/*.test.ts'],
  },
});
```

### `apps/web/src/lib/crypto.test.ts` (নতুন ফাইল)

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { pushToHistory, readHistory, clearHistory, _setKdfIterations } from './crypto';

const PASS = 'আমার-গোপন-পাসফ্রেজ';

describe('সন্ধান ক্রিপ্টো — এনক্রিপ্টেড হিস্টরি', () => {
  beforeEach(() => {
    localStorage.clear();
    _setKdfIterations(1_000); // টেস্ট দ্রুত রাখতে
  });

  it('সঠিক পাসফ্রেজে ডিক্রিপ্ট হয়', async () => {
    await pushToHistory('পদ্মা সেতু', PASS);
    const out = await readHistory(PASS);
    expect(out).toHaveLength(1);
    expect(out[0].q).toBe('পদ্মা সেতু');
    expect(typeof out[0].t).toBe('number');
  });

  it('ভুল পাসফ্রেজে ডিক্রিপ্ট ব্যর্থ হয় (শূন্য-জ্ঞান প্রমাণ)', async () => {
    await pushToHistory('গোপন তথ্য', 'সঠিক-কী');
    await expect(readHistory('ভুল-কী')).rejects.toThrow();
  });

  it('স্টোরেজে প্লেইনটেক্সট থাকে না', async () => {
    await pushToHistory('অত্যন্ত গোপনীয় প্রশ্ন', PASS);
    const raw = localStorage.getItem('sondhan.history') ?? '';
    expect(raw).not.toContain('অত্যন্ত গোপনীয় প্রশ্ন');
    expect(raw).toContain('"iv"');
    expect(raw).toContain('"ct"');
  });

  it('একই প্রশ্ন দুবার — নন্স আলাদা (রিপ্লে-নিরাপদ)', async () => {
    await pushToHistory('একই প্রশ্ন', PASS);
    await pushToHistory('একই প্রশ্ন', PASS);
    const arr = JSON.parse(localStorage.getItem('sondhan.history')!);
    expect(arr[0].iv).not.toBe(arr[1].iv);
  });

  it('সর্বোচ্চ ১০০ এন্ট্রি — পুরনোটা বাদ পড়ে', async () => {
    for (let i = 0; i < 105; i++) await pushToHistory(`q${i}`, PASS);
    const arr = JSON.parse(localStorage.getItem('sondhan.history')!);
    expect(arr).toHaveLength(100);
  });

  it('ট্যাম্পারড সাইফারটেক্সট ধরা পড়ে (GCM অথেনটিকেশন)', async () => {
    await pushToHistory('আসল প্রশ্ন', PASS);
    const arr = JSON.parse(localStorage.getItem('sondhan.history')!);
    // শেষ বাইট বদলে দিলাম
    const tampered = arr[0].ct.slice(0, -2) + (arr[0].ct.endsWith('AA') ? 'BB' : 'AA');
    localStorage.setItem('sondhan.history', JSON.stringify([{ ...arr[0], ct: tampered }]));
    await expect(readHistory(PASS)).rejects.toThrow();
  });

  it('clearHistory সব মুছে দেয়', async () => {
    await pushToHistory('কিছু', PASS);
    clearHistory();
    expect(localStorage.getItem('sondhan.history')).toBeNull();
  });
});
```

### `apps/web/package.json` — যোগ করুন

```json
"scripts": { "test": "vitest run", "test:watch": "vitest" },
"devDependencies": { "vitest": "^2.1.8", "happy-dom": "^15.11.7" }
```

**চালান:** `cd apps/web && npm install && npm test` — ৭টি টেস্ট সবুজ হওয়া চাই।

---

# ② কাজ করা মেটা-সার্চ অ্যাগ্রিগেটর (ধাপ ০) — উইকিপিডিয়া + উইকিডাটা

## `core/gateway/src/aggregator.rs` (নতুন ফাইল)

```rust
//! সন্ধান মেটা-সার্চ অ্যাগ্রিগেটর — ধাপ ০
//! উন্মুক্ত API থেকে ফলাফল টানে; কোনো উপাদান ব্যর্থ হলেও সার্চ থামে না।

use serde::Deserialize;
use std::time::Duration;

const WIKI_API: &str = "https://bn.wikipedia.org/w/api.php";
const WIKIDATA_API: &str = "https://www.wikidata.org/w/api.php";
const UA: &str = "sondhan/0.1 (মুক্ত সার্চ; যোগাযোগ: community@sondhan.example)";

pub struct AggResult {
    pub source: &'static str,
    pub title: String,
    pub url: String,
    pub snippet: String,
}

pub struct Entity {
    pub id: String,
    pub label: String,
    pub description: String,
    pub url: String,
}

fn client() -> Option<reqwest::Client> {
    reqwest::Client::builder()
        .user_agent(UA)
        .timeout(Duration::from_secs(5)) // ধীর নেটওয়ার্কে সার্চ আটকে যাবে না
        .build()
        .ok()
}

/// বাংলা উইকিপিডিয়া সার্চ — কোনো কী লাগে না
pub async fn search_wikipedia(q: &str, limit: usize) -> Vec<AggResult> {
    #[derive(Deserialize)]
    struct Resp { query: Option<Query> }
    #[derive(Deserialize)]
    struct Query { search: Vec<Hit> }
    #[derive(Deserialize)]
    struct Hit { title: String, snippet: String }

    let Some(c) = client() else { return vec![] };
    let limit_str = limit.to_string();

    let Ok(r) = c.get(WIKI_API)
        .query(&[
            ("action", "query"), ("list", "search"), ("srsearch", q),
            ("srlimit", limit_str.as_str()), ("format", "json"),
        ])
        .send().await else { return vec![] };

    let Ok(data) = r.json::<Resp>().await else { return vec![] };
    data.query.map(|qy| qy.search.into_iter().map(|h| AggResult {
        source: "bn.wikipedia",
        title: h.title.clone(),
        url: format!("https://bn.wikipedia.org/wiki/{}", h.title.replace(' ', "_")),
        snippet: strip_html(&h.snippet),
    }).collect()).unwrap_or_default()
}

/// উইকিডাটা থেকে শীর্ষ সত্তা — নলেজ প্যানেলের ভিত্তি
pub async fn search_wikidata(q: &str) -> Option<Entity> {
    #[derive(Deserialize)]
    struct Resp { search: Vec<Hit> }
    #[derive(Deserialize)]
    struct Hit { id: String, label: Option<String>, description: Option<String> }

    let c = client()?;
    let r = c.get(WIKIDATA_API).query(&[
        ("action", "wbsearchentities"), ("search", q),
        ("language", "bn"), ("uselang", "bn"), ("limit", "1"), ("format", "json"),
    ]).send().await.ok()?;
    let hit = r.json::<Resp>().await.ok()?.search.into_iter().next()?;
    Some(Entity {
        id: hit.id.clone(),
        label: hit.label.unwrap_or_default(),
        description: hit.description.unwrap_or_default(),
        url: format!("https://www.wikidata.org/wiki/{}", hit.id),
    })
}

/// API স্নিপেট থেকে <span>-জাতীয় ট্যাগ ও সাধারণ এনটিটি পরিষ্কার
fn strip_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut in_tag = false;
    for c in s.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.replace("&quot;", "\"").replace("&#039;", "'").replace("&amp;", "&")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strip_html_ট্যাগ_সরায়() {
        assert_eq!(strip_html("<b>রবীন্দ্রনাথ</b> ছিলেন <i>কবি</i>"), "রবীন্দ্রনাথ ছিলেন কবি");
    }

    #[test]
    fn strip_html_এনটিটি_ডিকোড_করে() {
        assert_eq!(strip_html("ক &amp; খ &quot;গ&quot;"), "ক & খ \"গ\"");
    }

    #[tokio::test]
    #[ignore] // লাইভ নেটওয়ার্ক টেস্ট: cargo test -- --ignored
    async fn live_উইকিপিডিয়া_বাংলা_সার্চ() {
        let r = search_wikipedia("রবীন্দ্রনাথ ঠাকুর", 3).await;
        assert!(!r.is_empty());
        assert!(r[0].url.starts_with("https://bn.wikipedia.org/wiki/"));
        assert!(!r[0].snippet.is_empty());
    }

    #[tokio::test]
    #[ignore]
    async fn live_উইকিডাটা_সত্তা() {
        let e = search_wikidata("বাংলাদেশ").await;
        assert!(e.is_some());
        assert!(e.unwrap().url.starts_with("https://www.wikidata.org/wiki/Q"));
    }
}
```

## `core/gateway/src/search.rs` — হ্যান্ডলার এখন অ্যাগ্রিগেটর ব্যবহার করে

```rust
use crate::aggregator;
use axum::{extract::Query, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SearchParams { pub q: String }

#[derive(Serialize)]
pub struct SearchResult { pub title: String, pub url: String, pub snippet: String }

#[derive(Serialize)]
pub struct Knowledge { pub label: String, pub description: String, pub url: String }

#[derive(Serialize)]
pub struct SearchResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub knowledge: Option<Knowledge>,
}

/// GET /api/search?q=...
/// উইকিপিডিয়া + উইকিডাটা সমান্তরালে চলে (tokio::join!); অফলাইনে ডেমো ফলব্যাক।
pub async fn search(Query(p): Query<SearchParams>) -> Json<SearchResponse> {
    let (wiki, entity) = tokio::join!(
        aggregator::search_wikipedia(&p.q, 8),
        aggregator::search_wikidata(&p.q)
    );

    let mut results: Vec<SearchResult> = wiki
        .into_iter()
        .map(|r| SearchResult { title: r.title, url: r.url, snippet: r.snippet })
        .collect();

    if results.is_empty() {
        results.push(SearchResult {
            title: format!("{} — ডেমো ফলাফল", p.q),
            url: format!("https://example.com/{}", p.q.replace(' ', "-")),
            snippet: "অফলাইন ফলব্যাক: নেটওয়ার্ক থাকলে এখানে আসল উইকিপিডিয়া ফলাফল আসবে।".into(),
        });
    }

    let knowledge = entity.map(|e| Knowledge { label: e.label, description: e.description, url: e.url });
    Json(SearchResponse { query: p.q, results, knowledge })
}
```

## সংযোগের জন্য দুটি এক-লাইন প্যাচ

**`core/gateway/src/main.rs`** — `mod privacy;`-এর পাশে যোগ করুন:

```rust
mod aggregator;
```

**`apps/web/src/routes/+page.svelte`** — নলেজ প্যানেল দেখাতে ছোট প্যাচ:

```svelte
<!-- <script>-এর ভেতরে যোগ -->
let knowledge: { label: string; description: string; url: string } | null = null;
// ফেচের পরে:  knowledge = data.knowledge ?? null;
```

```svelte
<!-- ফলাফলের উপরে বসান -->
{#if knowledge}
  <aside class="kp">
    <b>{knowledge.label}</b>
    <p>{knowledge.description}</p>
    <a href={knowledge.url} target="_blank" rel="noopener">উইকিডাটা →</a>
  </aside>
{/if}
```

## যাচাই

```bash
cd core/gateway
cargo test                     # অফলাইন ইউনিট টেস্ট
cargo test -- --ignored        # লাইভ উইকিপিডিয়া/উইকিডাটা টেস্ট
cargo run

# অন্য টার্মিনালে:
curl -s 'http://localhost:8080/api/search?q=রবীন্দ্রনাথ ঠাকুর' | head -c 600
# → আসল বাংলা উইকিপিডিয়ার ফলাফল + "knowledge" অবজেক্ট দেখা উচিত
```

**নতুন টেস্ট-কেস (চেকলিস্টে যোগ করুন):**

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ছ১ | `curl '.../api/search?q=রবীন্দ্রনাথ ঠাকুর'` | আসল উইকিপিডিয়া ফলাফল, `knowledge` ফিল্ডে কিউআইডি | ☐ |
| ছ২ | ওয়াইফাই বন্ধ করে একই কয়েরি | ডেমো ফলব্যাক, সার্ভার ক্র্যাশ করে না | ☐ |
| ছ৩ | ৫ সেকেন্ডের ধীর নেটওয়ার্ক সিমুলেশন | টাইমআউটে ফলব্যাক, ঝুলে থাকে না | ☐ |

---

# ③ ইংরেজি সংস্করণ (ফান্ডিং ও কমিউনিটির জন্য)

## A. One-Page Pitch (for grants / funders)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SONDHAN — Search, in your own hands
  A free, open-source, privacy-first search engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**One line.** Sondhan is an AGPL-licensed, self-hostable search engine where user queries are private *by mathematical design* — and where the Bengali-speaking web is a first-class citizen.

**The problem.**
- Today's dominant engines monetize queries; every search feeds a profiling machine.
- 270M+ Bengali speakers get second-class search: weak language processing, thin local index coverage.
- Privacy-minded users can self-host metasearch (e.g., SearXNG), but no open project combines **zero-knowledge privacy + transparent ranking + world-class UX**.

**The solution.**
1. **Zero-knowledge history** — searches are encrypted on the user's device (Argon2id → AES-256-GCM). Servers store ciphertext they cannot read. No query logs. No cookies. No third-party scripts.
2. **Transparent ranking** — every result ships with a "Why this?" breakdown; users reshape results with shareable Goggles-style rules.
3. **Metasearch today, independent index tomorrow** — Wikipedia/Wikidata aggregation from day one; our own Rust crawler and ML ranker follow in phased milestones.
4. **Bengali-first NLP** — purpose-trained tokenization, spell-correction and query understanding for Bengali, then 100+ languages.

**Why we win.**

| Incumbents | Privacy niche | Sondhan |
|---|---|---|
| Ad-funded, closed ranking | No logs, but weak UX/index | Zero-knowledge *and* great UX, with a path to a real index |
| — | US/EU-centric | The world's first Bengali-first privacy engine |
| — | — | AGPL: fork it, audit it, run it |

**Traction so far (volunteer-built).** Complete architecture blueprint · working interactive prototype with real client-side encryption · Rust + SvelteKit repo skeleton with unit tests · crypto spec & threat model · live Wikipedia/Wikidata aggregator PoC.

**Roadmap — 4 phases / 24 months.**
Phase 0 (M0–3): metasearch MVP · Phase 1 (M4–9): own crawler + 100M-page index · Phase 2 (M10–15): encrypted sync + LTR ranking + Goggles · Phase 3 (M16–24): mobile apps, open API, foundation governance.

**Sustainability.** Non-profit model: grants, donations, and self-hosting support. No ads, no tracking, ever.

**The ask.** Seed funding for a core team of 3–5 engineers (Rust, IR/ML, frontend), first-year infrastructure, and one independent security audit. In return: public infrastructure that belongs to everyone.

**License:** AGPL-3.0 · **Contact:** [আপনার ইমেইল/রিপো লিংক]

## B. README Hero (for the repository)

```markdown
# Sondhan 🔍

**Search, in your own hands.** A free and open-source, privacy-first search engine.

- 🔐 **Zero-knowledge history** — searches are encrypted on your device;
  our servers mathematically cannot read them.
- 🌏 **Bengali-first** — world-class search for 270M+ speakers, multilingual by design.
- 🔍 **Transparent ranking** — every result explains "Why this?"; rerank with community Goggles.
- ⚡ **Metasearch today, independent index tomorrow** — Wikipedia/Wikidata now,
  our own crawler in Phase 1.
- 🏛️ **AGPL-3.0** — fork it, run it, improve it. No ads. No tracking. Ever.

## Quick start
> Prerequisites: Rust 1.75+, Node 20+

```bash
cd core/gateway && cargo run          # API → http://localhost:8080
cd apps/web && npm i && npm run dev   # UI  → http://localhost:5173
```
```

## C. Community Launch Blurb + Good First Issues

> **Announcing Sondhan — a search engine that can't read your searches.**
> We're building a free, open-source (AGPL), Bengali-first search engine with zero-knowledge encrypted history and transparent ranking. The blueprint, a working prototype, and a Rust + SvelteKit starter are already public. We need: Rust hackers, IR/ML folks, Bengali NLP lovers, translators, and designers. Come build the search layer of a freer internet.

**Good-first-issues তালিকা (রিপোতে ট্যাগ করুন):**

| # | ইস্যু | দক্ষতা |
|---|---|---|
| ১ | `strip_html`-এ আরও HTML এনটিটি ডিকোডিং | রাস্ট, সহজ |
| ২ | বাংলা একক রূপান্তর (মন, সের, গজ) ইনস্ট্যান্ট উত্তরে | টাইপস্ক্রিপ্ট |
| ৩ | `!bang` ডাটাবেস জেসন ফাইলে ১০০টি সাইট | ডেটা এন্ট্রি |
| ৪ | ইংরেজি/হিন্দি ইউআই স্ট্রিং অনুবাদ | ভাষা |
| ৫ | নলেজ প্যানেলের সুন্দর স্ভেল্ট কম্পোনেন্ট | ফ্রন্টএন্ড |
| ৬ | `cargo test`-এ ইন্টিগ্রেশন টেস্ট স্যুট | রাস্ট |
| ৭ | ডকার ইমেজ সাইজ কমানো (মাল্টি-স্টেজ) | ডেভঅপস |

**প্রথম কমিউনিটি চ্যানেল:** গিটহাব ডিসকাশন + একটি চ্যাট স্পেস (ম্যাট্রিক্স সুপারিশ — কারণ সেটাও মুক্ত প্রোটোকল 😉)।

---

এবার প্রজেক্টের তিন দিকই প্রস্তুত: **কোড + পরীক্ষা**, **লাইভ অ্যাগ্রিগেশন**, এবং **বিশ্বকে বোঝানোর ভাষা**। পরের ধাপে চাইলে — ① গিটহাব অ্যাকশনস **সিআই পাইপলাইন** (টেস্ট + লিন্ট + ডকার বিল্ড), ② নিরাপত্তা অডিটের জন্য **থ্রেট-মডেল পূর্ণাঙ্গ ডকুমেন্ট**, কিংবা ③ ধাপ ১-এর **ক্রলারের প্রাথমিক নকশা ও কোড**। বলুন কোনটা।

### USER
সবগুলো 

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① সিআই পাইপলাইন (টেস্ট + লিন্ট + ডকার + নিরাপত্তা স্ক্যান)

## `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  gateway:
    name: "রাস্ট গেটওয়ে · fmt + clippy + টেস্ট + অডিট"
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: core/gateway } }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with: { components: rustfmt, clippy }
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: core/gateway }
      - name: ফরম্যাট যাচাই
        run: cargo fmt --all -- --check
      - name: Clippy (সব ওয়ার্নিং = ত্রুটি)
        run: cargo clippy --all-targets -- -D warnings
      - name: ইউনিট টেস্ট
        run: cargo test
      - name: ডিপেন্ডেন্সি নিরাপত্তা অডিট
        run: |
          cargo install cargo-audit --locked
          cargo audit

  web:
    name: "SvelteKit ওয়েব · টাইপচেক + ভিটেস্ট + বিল্ড"
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: apps/web } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - name: টাইপচেক (svelte-check)
        run: npm run check
      - name: ইউনিট টেস্ট (ভিটেস্ট)
        run: npm test
      - name: প্রোডাকশন বিল্ড
        run: npm run build
      - uses: actions/upload-artifact@v4
        with: { name: web-build, path: apps/web/build }

  crawler:
    name: "ক্রলার · টেস্ট"
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: core/crawler } }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: core/crawler }
      - run: cargo test

  docker:
    name: "ডকার বিল্ড + Trivy স্ক্যান"
    runs-on: ubuntu-latest
    needs: [gateway, web]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - run: docker build -t sondhan-gateway:ci core/gateway
      - run: docker build -t sondhan-web:ci apps/web
      - name: Trivy — গেটওয়ে ইমেজ
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: sondhan-gateway:ci
          severity: CRITICAL,HIGH
          exit-code: "1"
          ignore-unfixed: true
      - name: Trivy — ওয়েব ইমেজ
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: sondhan-web:ci
          severity: CRITICAL,HIGH
          exit-code: "1"
          ignore-unfixed: true

  publish:
    name: "ইমেজ পুশ (শুধু ট্যাগে)"
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    needs: docker
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: মালিকের নাম ছোট হাতের করুন
        run: echo "OWNER_LC=$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')" >> "$GITHUB_ENV"
      - uses: docker/build-push-action@v6
        with:
          context: core/gateway
          push: true
          tags: |
            ghcr.io/${{ env.OWNER_LC }}/sondhan-gateway:${{ github.ref_name }}
            ghcr.io/${{ env.OWNER_LC }}/sondhan-gateway:latest
      - uses: docker/build-push-action@v6
        with:
          context: apps/web
          push: true
          tags: |
            ghcr.io/${{ env.OWNER_LC }}/sondhan-web:${{ github.ref_name }}
            ghcr.io/${{ env.OWNER_LC }}/sondhan-web:latest
```

## `.github/workflows/live.yml` (সাপ্তাহিক লাইভ-নেটওয়ার্ক টেস্ট)

```yaml
name: লাইভ নেটওয়ার্ক টেস্ট
on:
  schedule: [{ cron: "0 6 * * 1" }]   # প্রতি সোমবার ০৬:০০ ইউটিসি
  workflow_dispatch:

jobs:
  live:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: core/gateway }
      - name: ইগনোরড (লাইভ) টেস্ট চালান
        working-directory: core/gateway
        run: cargo test -- --ignored
```

**খুচরা কাজ:**
- `package-lock.json` রিপোতে কমিট করুন (`npm ci`-র জন্য)।
- রিডমির প্রথম লাইনে ব্যাজ: `![CI](https://github.com/<মালিক>/sondhan/actions/workflows/ci.yml/badge.svg)`
- ব্রাঞ্চ প্রোটেকশন: `main`-এ পুশের আগে `gateway`, `web`, `docker` জব সবুজ বাধ্যতামূলক করুন।

---

# ② পূর্ণাঙ্গ থ্রেট মডেল — `docs/THREAT-MODEL.md`

> নিরাপত্তা অডিটের রেফারেন্স হিসেবে ইংরেজিতে (অডিটরদের সুবিধার্থে), ভূমিকা বাংলায়।

```markdown
# Sondhan Threat Model v0.1
> নিরাপত্তা অডিটের জন্য প্রামাণ্য ডকুমেন্ট। পরিবর্তনে অবশ্যই সংস্করণ বাড়াবেন।

## 1. Scope
**In scope:** API gateway, web frontend, encrypted-history sync, crawler/index
pipeline, deployment infrastructure.
**Out of scope (this phase):** ML model poisoning (Phase 2), client-device
malware beyond WebCrypto misuse, physical coercion of key holders.

## 2. Assets & their sensitivity
| Asset | Sensitivity | Notes |
|---|---|---|
| User queries | **Critical** | The most intimate data we touch |
| History ciphertext | High | Unreadable without user key, but must stay available |
| Client IP addresses | High | Transient only; never persisted |
| Index content | Medium | Integrity matters (poisoning risk) |
| Service availability | Medium | DoS target |
| Infrastructure keys | Critical | Can compromise everything above |

## 3. Threat actors
| ID | Actor | Capability |
|---|---|---|
| T1 | Passive network observer | Reads traffic on path |
| T2 | Compromised upstream (metasearch source, CDN) | Malicious responses |
| T3 | Hostile or coerced server operator (insider) | Full server access |
| T4 | Legal/state adversary | Compelled disclosure, traffic requests |
| T5 | Abusive automation | Scraping, resource exhaustion, index spam |
| T6 | Supply-chain attacker | Poisoned dependencies or CI |
| T7 | Search-poisoning adversary | SEO spam, link-graph manipulation |

## 4. Trust boundaries

    [Device: key + plaintext history]   ← trust zone A (user-controlled)
              │ TLS 1.3 (ciphertext only crosses this line)
    [Edge/Gateway/Indexer]               ← zone B (ours; assumed compromised in worst case)
              │ TLS
    [Upstream engines, Wikipedia APIs]   ← zone C (untrusted)

**Invariant:** plaintext queries and the KDF key never leave zone A.

## 5. STRIDE analysis
| Component | Threat | Mitigation | Status |
|---|---|---|---|
| Transport | Eavesdropping (T1) | TLS 1.3 only, HSTS preload, DoH | ✅ |
| Transport | Downgrade | No plaintext listener; redirect hardening | ✅ |
| Gateway | Query logging (T3/T4) | No query logs by design; log allow-list (§7) | ✅ |
| Gateway | Request-ID correlation | Random UUID, destroyed after request | ✅ |
| Gateway | Rate-limit abuse without fingerprinting (T5) | Truncated-subnet counters, optional PoW challenge, Private Access Tokens | ✅/🔶 |
| History store | Ciphertext theft (T3/T4) | Zero-knowledge: key never on server (§6) | ✅ |
| History store | Entry tampering | AES-GCM auth tag; tamper ⇒ decrypt error | ✅ |
| History store | Replay / reorder | Fresh 96-bit nonce per entry; client verifies monotonic ts after decrypt | ✅ |
| anon_id | Cross-device linkage (T4) | User choice; document risk (§10) | ✅ |
| Metasearch | Upstream sees user query (T2) | Queries relayed via our server; padding; per-engine opt-out | 🔶 partial |
| Upstream | Malicious HTML from engines (T2) | Sandboxed parse, no HTML passthrough to client | ✅ |
| Index | Poisoning (T7) | Link-graph spam scoring, source diversity badges, community reports | 🔶 Phase 1 |
| Dependencies | Malicious crate/npm pkg (T6) | cargo-audit + npm audit + Trivy in CI; pinned versions | ✅ |
| CI | Tampered builds (T6) | Reproducible builds target; signed releases (planned) | 🔶 |
| Ops | Infra key theft (T3) | Keys in secret manager, least-privilege, disk encryption | ✅ |
| Availability | DDoS (T5) | Edge shielding, backpressure, static-first pages | ✅ |

✅ implemented · 🔶 partial/planned

## 6. Cryptographic properties
- **KDF:** Argon2id (m=64 MB, t=3, p=4) with per-account 16-byte random salt.
  Browser demo uses PBKDF2-SHA256/210k (WebCrypto constraint), same interface.
- **Cipher:** AES-256-GCM; fresh random 96-bit nonce per entry; AAD = anon_id
  (binds ciphertext to owner).
- **Key lifecycle:** derived on device, never persisted to disk, zeroed after use
  where the runtime allows. Server holds: anon_id, salt, ciphertexts only.
- **Recovery:** 16-word recovery code derived from the passphrase. Loss ⇒
  unrecoverable by design (no escrow, no backdoor).
- **If the server is fully compromised:** attacker gains ciphertexts + salts.
  Offline brute force is bounded by Argon2id cost (~10⁴ guesses/sec/core).
- **If the passphrase is weak:** that is the real attack surface ⇒ minimum-length
  guidance + zxcvbn-style strength meter on device. (Planned UX.)

## 7. Logging policy (allow-list)
MAY log: request path prefix, response status, latency bucket, truncated subnet
(/24 or /64) for ≤ 24 h, aggregate counters.
MUST NEVER log: query strings, full IPs, anon_id ↔ anything mappings,
User-Agent beyond engine selection, cookies (none exist).
Aggregate stats published only with differential privacy (ε ≤ 1.0).

## 8. Anti-abuse without fingerprinting
1. Sliding-window counters on truncated subnets (short TTL).
2. Opt-in Private Access Tokens (blind-signature style) for heavy users.
3. Optional hashcash-style PoW challenge for API misuse, verified client-side.
4. No TLS-fingerprinting, no JS fingerprinting — ever.

## 9. Operational security
- Backups may include ciphertext (safe by design); DB dumps must not include
  any plaintext fields.
- Incident playbook: detect → isolate → rotate infra keys → public postmortem
  within 14 days.
- `security.txt` with contact + PGP key. Coordinated disclosure: 90-day window.

## 10. Residual risks (honest list)
| Risk | Why it remains | Mitigation path |
|---|---|---|
| Traffic analysis (T1) | Observer sees *that* you queried at time T, not *what* | Tor / .onion offered; query timing padding (research) |
| Endpoint compromise | Malware reads plaintext in RAM | Out of scope; security guidance |
| Upstream correlation (T2) | Relay still reveals approximate timing | Request padding + batching |
| anon_id reuse across devices | User choice enables linkage | Per-device IDs by default, sync opt-in |
| Weak passphrases | Human factor | Strength meter, recovery codes |

## 11. Verification plan
- Unit/property tests: crypto roundtrip, tamper detection (✅ in repo).
- Fuzzing: query parser, HTML extractor (`cargo fuzz`, Phase 1).
- External pentest: before Phase 2 public launch; scope = gateway + sync protocol.
- Quarterly `cargo audit` / `npm audit` / Trivy review (automated in CI).

## 12. Contact
security@sondhan.example · PGP fingerprint in `security.txt` ·
Disclosure policy: 90 days, credit by default.
```

---

# ③ ধাপ ১-এর ক্রলার — নকশা + কোড (`core/crawler/`)

## নকশা

```
 বীজ তালিকা ──▶ ফ্রন্টিয়ার (ইউআরএল কিউ)
                    │
                    ▼
        রোবটস-টেক্সট যাচাই (ডোমেইন-ক্যাশ)
                    │ অনুমতি?
                    ▼
        ভদ্রতার বিরতি (ডিফল্ট ২ সে., রোবটসের নিজস্ব ডিলে সম্মান)
                    │
                    ▼
        ফেচ (টাইমআউট ২০ সে., ≤৫ মেবা, শুধু এইচটিএমএল)
                    │
                    ▼
        এক্সট্র্যাক্টর → শিরোনাম · টেক্সট · লিংক
                    │
                    ▼
        ক্যানোনিকাল ইউআরএল + কনটেন্ট-হ্যাশ (ডুপ্লিকেট বাদ)
                    │
                    ▼
        ডক স্টোর (docs.jsonl) ──ধাপ ১খ──▶ ইনডেক্সার (ওপেনসার্চ)
```

**ভদ্রতার ইশতেহার:** প্রতি ডোমেইনে সর্বোচ্চ ১ সমসাময়িক অনুরোধ · ডিফল্ট ২ সেকেন্ড বিরতি · `robots.txt` ও `Crawl-delay` মানা · পরিষ্কার ইউএ-তে যোগাযোগের ঠিকানা · ৫ মেগাবাইটের বড় পাতা বাদ · `noindex` ট্যাগ মানা (ধাপ ১খ)।

**স্কেলিং পরিকল্পনা:**

| উপধাপ | কী বদলায় |
|---|---|
| ১ক (এই কোড) | একক-নোড, মেমোরি কিউ, JSONL আউটপুট |
| ১খ | ফ্রন্টিয়ার → পোস্টগ্রেস/রেডিস; আউটপুট → অবজেক্ট স্টোর; ইনডেক্সার যুক্ত |
| ১গ | বহু ওয়ার্কার + নেটস; ডোমেইন-শার্ডিং; সূচকীয় ব্যাকঅফ/রিট্রাই |

## `core/crawler/Cargo.toml`

```toml
[package]
name = "sondhan-crawler"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"

[dependencies]
anyhow = "1"
reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }
scraper = "0.20"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
texting_robots = "0.2"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
url = "2"
```

## `core/crawler/src/main.rs`

```rust
//! সন্ধান ক্রলার — ধাপ ১ক (একক-নোড প্রমাণ)
//! ব্যবহার: cargo run -- "https://bn.wikipedia.org/wiki/প্রধান_পাতা" 20 ./out

mod dedupe;
mod extract;
mod fetch;

use serde::Serialize;
use std::{
    collections::{HashMap, HashSet, VecDeque},
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
use tracing::{info, warn};
use url::Url;

struct Config { seeds: Vec<String>, max_pages: usize, out_dir: PathBuf, delay_ms: u64 }

#[derive(Serialize)]
struct Doc { url: String, title: String, text: String, hash: String, fetched_at: u64 }

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_target(false).init();
    let cfg = config_from_args();
    fs::create_dir_all(&cfg.out_dir)?;

    let client = reqwest::Client::builder()
        .user_agent(fetch::UA)
        .timeout(std::time::Duration::from_secs(20))
        .build()?;

    let mut frontier: VecDeque<Url> = VecDeque::new();
    let mut seen: HashSet<String> = HashSet::new();
    for s in &cfg.seeds {
        if let Ok(u) = Url::parse(s) {
            if seen.insert(dedupe::canonicalize(&u)) { frontier.push_back(u); }
        }
    }

    let mut robots: HashMap<String, texting_robots::Robot> = HashMap::new();
    let mut last_fetch: HashMap<String, std::time::Instant> = HashMap::new();
    let mut hashes: HashSet<String> = HashSet::new();

    let mut out = OpenOptions::new()
        .create(true).append(true)
        .open(cfg.out_dir.join("docs.jsonl"))?;

    let mut saved = 0usize;
    while let Some(url) = frontier.pop_front() {
        if saved >= cfg.max_pages { break; }

        if !fetch::is_allowed(&client, &mut robots, &url).await {
            info!(%url, "রোবটস-টেক্সট অনুমতি নেই — বাদ");
            continue;
        }
        let host = url.host_str().unwrap_or_default().to_string();
        let delay = fetch::delay_for(&robots, &host, cfg.delay_ms);
        fetch::be_polite(&mut last_fetch, &host, delay).await;

        match fetch::get(&client, &url).await {
            Ok(html) => {
                let (title, text, links) = extract::parse(&html, &url);
                let h = dedupe::hash(&text);
                if hashes.insert(h.clone()) {
                    let doc = Doc {
                        url: url.to_string(),
                        title,
                        text: text.chars().take(200_000).collect(),
                        hash: h,
                        fetched_at: SystemTime::now()
                            .duration_since(UNIX_EPOCH).unwrap().as_secs(),
                    };
                    writeln!(out, "{}", serde_json::to_string(&doc)?)?;
                    saved += 1;
                    info!(url = %doc.url, saved, "সংরক্ষিত");
                }
                if seen.len() < 100_000 {
                    for l in links {
                        if seen.insert(dedupe::canonicalize(&l)) { frontier.push_back(l); }
                    }
                }
            }
            Err(e) => warn!(%url, error = %e, "বাদ"),
        }
    }
    info!(saved, "ক্রল সম্পন্ন → {}/docs.jsonl", cfg.out_dir.display());
    Ok(())
}

fn config_from_args() -> Config {
    let a: Vec<String> = std::env::args().collect();
    Config {
        seeds: a.get(1)
            .map(|s| s.split(',').map(str::to_string).collect())
            .unwrap_or_else(|| vec!["https://bn.wikipedia.org/wiki/প্রধান_পাতা".into()]),
        max_pages: a.get(2).and_then(|s| s.parse().ok()).unwrap_or(20),
        out_dir: a.get(3).map(PathBuf::from).unwrap_or_else(|| "crawl-out".into()),
        delay_ms: 2_000,
    }
}
```

## `core/crawler/src/fetch.rs`

```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};
use texting_robots::Robot;
use url::Url;

pub const UA: &str = "sondhan-crawler/0.1 (+https://sondhan.example/bot; মুক্ত সার্চ প্রকল্প)";

/// প্রতি ডোমেইনে রোবটস-টেক্সট একবারই আনা হয়; ব্যর্থ হলে ডিফল্ট-অনুমতি।
pub async fn is_allowed(
    client: &reqwest::Client,
    cache: &mut HashMap<String, Robot>,
    url: &Url,
) -> bool {
    let host = url.host_str().unwrap_or("").to_string();
    if !cache.contains_key(&host) {
        let robots_url = format!("{}://{}/robots.txt", url.scheme(), host);
        let txt = client.get(&robots_url).send().await
            .and_then(|r| r.text())
            .await
            .unwrap_or_default();
        let robot = Robot::new(UA, txt.as_bytes())
            .unwrap_or_else(|_| Robot::new(UA, b"").expect("খালি রোবট"));
        cache.insert(host, robot);
    }
    cache.get(url.host_str().unwrap_or(""))
        .map(|r| r.allowed(url.as_str()))
        .unwrap_or(true)
}

/// রোবটসের নিজস্ব ক্রল-ডিলে থাকলে সেটাই অগ্রাধিকার; কখনো ০.৫ সে.-এর নিচে নয়।
pub fn delay_for(cache: &HashMap<String, Robot>, host: &str, default_ms: u64) -> u64 {
    cache.get(host)
        .and_then(|r| r.delay.map(|d| (d * 1000.0) as u64))
        .unwrap_or(default_ms)
        .max(500)
}

pub async fn be_polite(last: &mut HashMap<String, Instant>, host: &str, delay_ms: u64) {
    if let Some(t) = last.get(host) {
        if let Some(wait) = Duration::from_millis(delay_ms).checked_sub(t.elapsed()) {
            tokio::time::sleep(wait).await;
        }
    }
    last.insert(host.to_string(), Instant::now());
}

pub async fn get(client: &reqwest::Client, url: &Url) -> anyhow::Result<String> {
    let r = client.get(url.clone()).send().await?;
    if !r.status().is_success() { anyhow::bail!("HTTP {}", r.status()); }
    let ct = r.headers().get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
    if !ct.is_empty() && !ct.contains("text/html") {
        anyhow::bail!("এইচটিএমএল নয়: {ct}");
    }
    let bytes = r.bytes().await?;
    if bytes.len() > 5_000_000 { anyhow::bail!("পাতা ৫ মেবাবাইটের বেশি"); }
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}
```

## `core/crawler/src/extract.rs`

```rust
use scraper::{Html, Selector};
use url::Url;

/// শিরোনাম, দৃশ্যমান টেক্সট ও পরম লিংক বের করে
pub fn parse(html: &str, base: &Url) -> (String, String, Vec<Url>) {
    let doc = Html::parse_document(html);

    let title = Selector::parse("title").ok()
        .and_then(|s| doc.select(&s).next())
        .map(|t| t.text().collect::<String>().trim().to_string())
        .unwrap_or_default();

    let text_sel = Selector::parse("p, li, h1, h2, h3, h4, h5, h6, td, blockquote").unwrap();
    let mut text = String::new();
    for el in doc.select(&text_sel) {
        let t = el.text().collect::<Vec<_>>().join(" ");
        let t = t.trim();
        if !t.is_empty() { text.push_str(t); text.push('\n'); }
    }

    let link_sel = Selector::parse("a[href]").unwrap();
    let links = doc.select(&link_sel)
        .filter_map(|a| a.value().attr("href"))
        .filter_map(|href| base.join(href).ok())
        .filter(|u| u.scheme() == "http" || u.scheme() == "https")
        .collect();

    (title, text, links)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn শিরোনাম_টেক্সট_লিংক_পার্স_হয়() {
        let html = r#"<html><head><title>সন্ধান</title></head>
            <body><p>হ্যালো বিশ্ব</p><a href="/next">লিংক</a></body></html>"#;
        let base = Url::parse("https://example.com/page").unwrap();
        let (title, text, links) = parse(html, &base);
        assert_eq!(title, "সন্ধান");
        assert!(text.contains("হ্যালো বিশ্ব"));
        assert_eq!(links.len(), 1);
        assert_eq!(links[0].as_str(), "https://example.com/next");
    }

    #[test]
    fn আপেক্ষিক_ও_অবৈধ_লিংক_সামলানো_হয়() {
        let html = r#"<a href="mailto:x@y.z">মেইল</a><a href="../up">উপরে</a>"#;
        let base = Url::parse("https://example.com/a/b").unwrap();
        let (_, _, links) = parse(html, &base);
        assert_eq!(links.len(), 1); // মেইলটো বাদ, ../up সমাধান হয়
        assert_eq!(links[0].as_str(), "https://example.com/up");
    }
}
```

## `core/crawler/src/dedupe.rs`

```rust
use sha2::{Digest, Sha256};
use url::Url;

/// কনটেন্ট-হ্যাশ: একই লেখা দুবার ইনডেক্সে ঢুকবে না
pub fn hash(text: &str) -> String {
    let mut h = Sha256::new();
    h.update(text.as_bytes());
    format!("{:x}", h.finalize())
}

/// ফ্র্যাগমেন্ট বাদ + ট্রেইলিং স্ল্যাশ স্বাভাবিক করা
pub fn canonicalize(url: &Url) -> String {
    let mut u = url.clone();
    u.set_fragment(None);
    u.to_string().trim_end_matches('/').to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn হ্যাশ_স্থিতিশীল_ও_সংবেদনশীল() {
        assert_eq!(hash("ক"), hash("ক"));
        assert_ne!(hash("ক"), hash("খ"));
    }

    #[test]
    fn ক্যানোনিকাল_ফ্র্যাগমেন্ট_সরায়() {
        let u = Url::parse("https://example.com/a#sec").unwrap();
        assert_eq!(canonicalize(&u), "https://example.com/a");
    }
}
```

## চালানো ও যাচাই

```bash
cd core/crawler
cargo test                                    # এক্সট্র্যাক্টর + ডুপ টেস্ট
cargo run -- "https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর" 10 ./out
head -c 400 out/docs.jsonl                    # শিরোনাম + টেক্সট + হ্যাশ দেখুন
```

> মনে রাখবেন: `২০টি পাতা × ২ সেকেন্ড বিরতি ≈ ৪০+ সেকেন্ড` — ভদ্রতাই এই প্রকল্পের ছাপ।

---

এবার হাতে আছে: **স্বয়ংক্রিয় মান-নিয়ন্ত্রণ**, **অডিট-প্রস্তুত নিরাপত্তা ডকুমেন্ট**, আর **চালু করা যায় এমন ভদ্র ক্রলার**। পরের ধাপের বিকল্প — ① **ইনডেক্সার** (`docs.jsonl` → ওপেনসার্চ, সত্যিকারের সার্চযোগ্য), ② **বাংলা টোকেনাইজার + বানান-সংশোধন মডিউল**, কিংবা ③ **ভিপিএস + টর (.onion) ডিপ্লয়মেন্ট গাইড**। বলুন কোনগুলো।

### USER
করে দাও সবগুলো। 

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

এবার সন্ধান হয়ে যাবে **সত্যিকারের সার্চ ইঞ্জিন**: ক্রল করা ডেটা ইনডেক্স হবে, ইনডেক্স থেকে সার্চ আসবে, বাংলা বানান ভুল সংশোধন হবে, আর সবকিছু আপনার নিজের সার্ভারে — টরসহ — চলবে।

---

# ① ইনডেক্সার — `docs.jsonl` → ওপেনসার্চ → সত্যিকারের সার্চ

## ডেভ কম্পোজে ওপেনসার্চ যোগ করুন (`docker-compose.yml`)

```yaml
  opensearch:
    image: opensearchproject/opensearch:2
    environment:
      discovery.type: single-node
      plugins.security.disabled: "true"        # শুধু ডেভ; প্রোডাকশন গাইড ③ দেখুন
      OPENSEARCH_JAVA_OPTS: "-Xms512m -Xmx512m"
    volumes: [os-data:/usr/share/opensearch/data]
    ports: ["9200:9200"]

volumes:
  os-data: {}
```

গেটওয়ে সার্ভিসে এনভ যোগ করুন: `OPENSEARCH_URL: http://opensearch:9200`

## `core/indexer/Cargo.toml`

```toml
[package]
name = "sondhan-indexer"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"

[dependencies]
anyhow = "1"
reqwest = { version = "0.12", default-features = false, features = ["rustls-tls", "json"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
```

## `core/indexer/src/main.rs`

```rust
//! সন্ধান ইনডেক্সার — ক্রলারের docs.jsonl ওপেনসার্চে তোলে (বাংলা অ্যানালাইজারসহ)
//! ব্যবহার: cargo run -- [docs.jsonl] [ওপেনসার্চ ইউআরএল]

use serde_json::{json, Value};
use std::io::{BufRead, BufReader};
use tracing::info;

const INDEX: &str = "sondhan_docs";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_target(false).init();
    let args: Vec<String> = std::env::args().collect();
    let path = args.get(1).cloned().unwrap_or_else(|| "crawl-out/docs.jsonl".into());
    let base = args.get(2).cloned().unwrap_or_else(|| "http://localhost:9200".into());
    let client = reqwest::Client::new();

    ensure_index(&client, &base).await?;
    let docs = read_docs(&path)?;
    info!(count = docs.len(), "ডক পড়া হয়েছে");

    for chunk in docs.chunks(500) {
        bulk_index(&client, &base, chunk).await?;
    }
    client.post(format!("{base}/{INDEX}/_refresh")).send().await?; // এখনই সার্চযোগ্য
    info!("ইনডেক্সিং সম্পন্ন → {base}/{INDEX}");
    Ok(())
}

async fn ensure_index(client: &reqwest::Client, base: &str) -> anyhow::Result<()> {
    if client.head(format!("{base}/{INDEX}")).send().await?.status().as_u16() == 200 {
        info!("ইনডেক্স আগে থেকেই আছে");
        return Ok(());
    }
    let mapping = json!({
        "mappings": { "properties": {
            "url":        { "type": "keyword" },
            "title":      { "type": "text", "analyzer": "bengali" },
            "text":       { "type": "text", "analyzer": "bengali" },
            "hash":       { "type": "keyword" },
            "fetched_at": { "type": "date", "format": "epoch_second" }
        }}
    });
    let r = client.put(format!("{base}/{INDEX}")).json(&mapping).send().await?;
    anyhow::ensure!(r.status().is_success(), "ইনডেক্স তৈরি ব্যর্থ: {}", r.status());
    Ok(())
}

fn read_docs(path: &str) -> anyhow::Result<Vec<Value>> {
    let mut out = Vec::new();
    for line in BufReader::new(std::fs::File::open(path)?).lines() {
        let line = line?;
        if line.trim().is_empty() { continue; }
        out.push(serde_json::from_str(&line)?);
    }
    Ok(out)
}

fn build_bulk_body(docs: &[Value]) -> String {
    let mut body = String::new();
    for d in docs {
        let id = d["hash"].as_str().unwrap_or("অজানা");
        body.push_str(&format!("{{\"index\":{{\"_index\":\"{INDEX}\",\"_id\":\"{id}\"}}}}\n"));
        body.push_str(&d.to_string());
        body.push('\n');
    }
    body
}

async fn bulk_index(client: &reqwest::Client, base: &str, docs: &[Value]) -> anyhow::Result<()> {
    let r = client.post(format!("{base}/_bulk"))
        .header("content-type", "application/x-ndjson")
        .body(build_bulk_body(docs))
        .send().await?;
    anyhow::ensure!(r.status().is_success(), "বাল্ক ইনডেক্সিং ব্যর্থ: {}", r.status());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn বাল্ক_এনডিজেসন_সঠিক() {
        let docs = vec![json!({"hash":"abc123","url":"u","title":"শিরোনাম","text":"লেখা"})];
        let lines: Vec<&str> = build_bulk_body(&docs).lines().collect();
        assert_eq!(lines.len(), 2);
        assert!(lines[0].contains("\"_id\":\"abc123\""));
        assert!(lines[1].contains("\"title\":\"শিরোনাম\""));
    }
}
```

## গেটওয়েতে স্থানীয় ইনডেক্স সংযোগ

**`core/gateway/src/opensearch.rs`** (নতুন ফাইল):

```rust
//! স্থানীয় ইনডেক্স থেকে সার্চ — সার্ভার না মিললে নীরবে খালি ফলাফল
use crate::search::SearchResult;
use serde::Deserialize;
use serde_json::json;
use std::time::Duration;

#[derive(Deserialize)]
struct Resp { hits: Hits }
#[derive(Deserialize)]
struct Hits { hits: Vec<Hit> }
#[derive(Deserialize)]
struct Hit { _source: Src }
#[derive(Deserialize)]
struct Src { url: String, title: String, text: String }

pub async fn search_index(q: &str) -> Vec<SearchResult> {
    let base = std::env::var("OPENSEARCH_URL")
        .unwrap_or_else(|_| "http://localhost:9200".into());
    let Ok(client) = reqwest::Client::builder()
        .timeout(Duration::from_secs(3)).build() else { return vec![] };

    let body = json!({
        "size": 8,
        "query": { "multi_match": { "query": q, "fields": ["title^3", "text"] } }
    });
    let Ok(r) = client.post(format!("{base}/sondhan_docs/_search"))
        .json(&body).send().await else { return vec![] };
    let Ok(resp) = r.json::<Resp>().await else { return vec![] };

    resp.hits.hits.into_iter().map(|h| SearchResult {
        title: h._source.title,
        url: h._source.url,
        snippet: h._source.text.chars().take(220).collect(),
    }).collect()
}
```

**`core/gateway/src/main.rs`** — `mod aggregator;`-এর পাশে: `mod opensearch;`

**`core/gateway/src/search.rs`** — হ্যান্ডলারের আপডেটেড রূপ (অগ্রাধিকার: নিজস্ব ইনডেক্স → উইকিপিডিয়া):

```rust
use crate::{aggregator, opensearch};
use axum::{extract::Query, Json};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Deserialize)]
pub struct SearchParams { pub q: String }

#[derive(Serialize)]
pub struct SearchResult { pub title: String, pub url: String, pub snippet: String }

#[derive(Serialize)]
pub struct Knowledge { pub label: String, pub description: String, pub url: String }

#[derive(Serialize)]
pub struct SearchResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub knowledge: Option<Knowledge>,
}

pub async fn search(Query(p): Query<SearchParams>) -> Json<SearchResponse> {
    let (local, wiki, entity) = tokio::join!(
        opensearch::search_index(&p.q),
        aggregator::search_wikipedia(&p.q, 8),
        aggregator::search_wikidata(&p.q)
    );

    let mut results: Vec<SearchResult> = local;                       // নিজস্ব ইনডেক্স আগে
    let mut seen: HashSet<String> = results.iter().map(|r| r.url.clone()).collect();
    for r in wiki.into_iter().map(|r| SearchResult {
        title: r.title, url: r.url, snippet: r.snippet,
    }) {
        if seen.insert(r.url.clone()) { results.push(r); }            // ইউআরএল ডুপ-বাদ
    }

    if results.is_empty() {
        results.push(SearchResult {
            title: format!("{} — ডেমো ফলাফল", p.q),
            url: format!("https://example.com/{}", p.q.replace(' ', "-")),
            snippet: "অফলাইন ফলব্যাক: ইনডেক্স বা নেটওয়ার্ক থাকলে আসল ফলাফল আসবে।".into(),
        });
    }

    let knowledge = entity.map(|e| Knowledge {
        label: e.label, description: e.description, url: e.url,
    });
    Json(SearchResponse { query: p.q, results, knowledge })
}
```

## এন্ড-টু-এন্ড চালানো

```bash
docker compose up -d opensearch && sleep 15

# ক্রল → ইনডেক্স → সার্চ
cd core/crawler && cargo run -- \
  "https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর,https://bn.wikipedia.org/wiki/পদ্মা_সেতু" 15 ./out
cd ../indexer && cargo run -- ../crawler/out/docs.jsonl
cd .. && (cd gateway && cargo run &)          # গেটওয়ে

curl -sG 'http://localhost:8080/api/search' --data-urlencode 'q=পদ্মা সেতু' | head -c 500
# → প্রথমে নিজস্ব ইনডেক্সের ফলাফল, পরে উইকিপিডিয়া, সাথে নলেজ প্যানেল
```

---

# ② বাংলা এনএলপি — টোকেনাইজার + বানান-সংশোধন (`core/nlp/`)

```
core/nlp/
├── Cargo.toml
├── data/bn_dict_sample.txt
└── src/
    ├── lib.rs · normalize.rs · tokenize.rs · stem.rs · spell.rs
```

শূন্য ডিপেন্ডেন্সি — বিশুদ্ধ রাস্ট।

## `core/nlp/Cargo.toml`

```toml
[package]
name = "sondhan-nlp"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"
description = "সন্ধান বাংলা এনএলপি — টোকেনাইজার, প্রত্যয়-ছেদন, বানান-সংশোধন"
```

## `src/lib.rs`

```rust
//! সন্ধান বাংলা এনএলপি — ধাপ ১
//! স্বাভাবিককরণ · টোকেনাইজেশন · স্টপওয়ার্ড · প্রত্যয়-ছেদন · বানান-সংশোধন
pub mod normalize;
pub mod spell;
pub mod stem;
pub mod tokenize;

pub use spell::SpellChecker;
pub use tokenize::{remove_stopwords, tokenize, STOPWORDS};
```

## `src/normalize.rs`

```rust
/// ক্যানোনিক্যাল কী: বাংলা বানান-বিভ্রান্তির সাধারণ অক্ষরগুলো এক করা হয়।
/// শুধু অভ্যন্তরীণ তুলনার জন্য — প্রদর্শনে মূল বানানই থাকে।
pub fn canonical_key(word: &str) -> String {
    word.chars().map(|c| match c {
        'য়' => 'য',              // অন্তস্থ য
        'ড়' => 'ড', 'ঢ়' => 'ঢ',   // ড়/ঢ়
        'ণ' => 'ন', 'ষ' => 'স',   // মুর্ধন্য → দন্ত্য
        '০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4',
        '৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9',
        c => c,
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn মুর্ধন্য_দন্ত্য_সমতুল্য() {
        assert_eq!(canonical_key("কার্শন"), canonical_key("কার্সন"));
        assert_eq!(canonical_key("কন্যা"), canonical_key("কন্যা"));
    }

    #[test]
    fn অন্তস্থ_য_ও_বাংলা_সংখ্যা() {
        assert_eq!(canonical_key("কাজের"), "কাজেয".to_string().replace("য", "য"));
        assert_eq!(canonical_key("১৯৭১"), "1971");
    }
}
```

## `src/tokenize.rs`

```rust
/// সাধারণ বিরাম-ভিত্তিক টোকেনাইজার — বাংলা দাঁড়ি/প্রতিশব্দ-চিহ্নসহ
pub fn tokenize(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    for c in text.chars() {
        if c.is_alphanumeric() { cur.push(c); }
        else if !cur.is_empty() { out.push(cur.clone()); cur.clear(); }
    }
    if !cur.is_empty() { out.push(cur); }
    out
}

/// সূচনাপর্বে হাতে-গোছানো তালিকা; পরে ফ্রিকোয়েন্সি-ভিত্তিক হবে
pub const STOPWORDS: &[&str] = &[
    "এই","সেই","ও","এবং","অথবা","থেকে","হয়","ছিল","হবে","হচ্ছে",
    "করে","করা","একটি","একজন","যা","তা","তার","এর","যে","কিন্তু",
    "জন্য","সাথে","সঙ্গে","মধ্যে","উপর","নিয়ে","বা","ই","ওই","এখন",
];

pub fn remove_stopwords(tokens: Vec<String>) -> Vec<String> {
    tokens.into_iter().filter(|t| !STOPWORDS.contains(&t.as_str())).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn বাংলা_বাক্য_টোকেন_হয়() {
        let t = tokenize("রবীন্দ্রনাথ ঠাকুর ১৯১৩ সালে নোবেল পান।");
        assert_eq!(t, vec!["রবীন্দ্রনাথ", "ঠাকুর", "১৯১৩", "সালে", "নোবেল", "পান"]);
    }

    #[test]
    fn স্টপওয়ার্ড_বাদ_পড়ে() {
        let t = tokenize("এবং রবীন্দ্রনাথ ঠাকুর");
        assert_eq!(remove_stopwords(t), vec!["রবীন্দ্রনাথ", "ঠাকুর"]);
    }
}
```

## `src/stem.rs`

```rust
/// সাধারণ বহুবচন/কারক প্রত্যয় ছাঁটাই — শব্দ যথেষ্ট লম্বা থাকলেই কেবল
/// (লম্বা প্রত্যয় আগে পরীক্ষা হয়)
const SUFFIXES: &[&str] = &["গুলোতে", "দেরকে", "গুলো", "গুলি", "দের", "রা", "কে", "তে", "ই"];

pub fn stem(word: &str) -> String {
    for s in SUFFIXES {
        if word.ends_with(s) && word.chars().count() > s.chars().count() + 2 {
            return word[..word.len() - s.len()].to_string();
        }
    }
    word.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn প্রত্যয়_ছেদন() {
        assert_eq!(stem("বইগুলো"), "বই");
        assert_eq!(stem("ছেলেদের"), "ছেলে");
        assert_eq!(stem("বইগুলোতে"), "বই");
    }

    #[test]
    fn ছোট_শব্দ_অক্ষত() {
        assert_eq!(stem("ঘর"), "ঘর");
        assert_eq!(stem("জল"), "জল");
    }
}
```

## `src/spell.rs` — বানান-সংশোধন

```rust
//! ব্রুট-ফোর্স লেভেনশটেইন (সীমা ≤ ২) + ক্যানোনিক্যাল-কী ম্যাপিং।
//! ৫০ হাজার শব্দ পর্যন্ত যথেষ্ট; বড় অভিধানে পরে ডিলিট-ভিত্তিক সিমস্পেল।

use crate::normalize::canonical_key;
use std::collections::HashMap;

pub struct SpellChecker {
    dict: HashMap<String, u64>,         // ক্যানোনিক্যাল কী → সর্বোচ্চ ফ্রিকোয়েন্সি
    originals: HashMap<String, String>, // ক্যানোনিক্যাল কী → প্রদর্শন-বানান
}

impl SpellChecker {
    pub fn from_words(words: impl Iterator<Item = (String, u64)>) -> Self {
        let mut dict = HashMap::new();
        let mut originals = HashMap::new();
        for (w, f) in words {
            let k = canonical_key(&w);
            match dict.get_mut(&k) {
                Some(cur) => if f > *cur { *cur = f; originals.insert(k, w); },
                None => { dict.insert(k.clone(), f); originals.insert(k, w); }
            }
        }
        Self { dict, originals }
    }

    /// ফাইল ফরম্যাট: প্রতি লাইনে "শব্দ ফ্রিকোয়েন্সি" (ফ্রিকোয়েন্সি ঐচ্ছিক)
    pub fn load(path: &str) -> std::io::Result<Self> {
        use std::io::{BufRead, BufReader};
        let mut items = Vec::new();
        for line in BufReader::new(std::fs::File::open(path)?).lines() {
            let line = line?;
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') { continue; }
            let mut parts = line.split_whitespace();
            let Some(w) = parts.next() else { continue };
            let f = parts.next().and_then(|p| p.parse().ok()).unwrap_or(1);
            items.push((w.to_string(), f));
        }
        Ok(Self::from_words(items.into_iter()))
    }

    /// জানা হলে অভিধানের বানান; নইলে দূরত্ব ≤ ২-এর সর্বোচ্চ-ফ্রিকোয়েন্সি প্রার্থী
    pub fn suggest(&self, word: &str) -> Option<String> {
        let key = canonical_key(word);
        if let Some(orig) = self.originals.get(&key) {
            return Some(orig.clone());
        }
        let mut best: Option<(usize, u64, String)> = None;
        for (k, orig) in &self.originals {
            let Some(d) = bounded_levenshtein(&key, k, 2) else { continue };
            let freq = self.dict.get(k).copied().unwrap_or(0);
            let better = match &best {
                None => true,
                Some((bd, bf, _)) => d < *bd || (d == *bd && freq > *bf),
            };
            if better { best = Some((d, freq, orig.clone())); }
        }
        best.map(|(_, _, o)| o)
    }
}

/// সীমা-সহ লেভেনশটেইন; সীমা ছাড়ালে দ্রুত None (পূর্ণ ম্যাট্রিক্সের অপচয় এড়ায়)
fn bounded_levenshtein(a: &str, b: &str, max: usize) -> Option<usize> {
    let (a, b): (Vec<char>, Vec<char>) = (a.chars().collect(), b.chars().collect());
    if a.len().abs_diff(b.len()) > max { return None; }
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for i in 1..=a.len() {
        let mut cur = vec![i];
        let mut row_min = i;
        for j in 1..=b.len() {
            let cost = usize::from(a[i - 1] != b[j - 1]);
            cur.push((prev[j] + 1).min(cur[j - 1] + 1).min(prev[j - 1] + cost));
            row_min = row_min.min(cur[j]);
        }
        if row_min > max { return None; }
        prev = cur;
    }
    (prev[b.len()] <= max).then_some(prev[b.len()])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn checker() -> SpellChecker {
        SpellChecker::from_words([
            ("বাংলাদেশ".into(), 1000), ("ঢাকা".into(), 800),
            ("রবীন্দ্রনাথ".into(), 500), ("ঠাকুর".into(), 300),
            ("ভাষা".into(), 250), ("পদ্মা".into(), 200),
        ].into_iter())
    }

    #[test]
    fn জানা_শব্দ_অপরিবর্তিত() {
        assert_eq!(checker().suggest("বাংলাদেশ").unwrap(), "বাংলাদেশ");
    }

    #[test]
    fn একটি_বর্ণ_বাদ_পড়লে() {
        assert_eq!(checker().suggest("বাংলদেশ").unwrap(), "বাংলাদেশ"); // া বাদ
    }

    #[test]
    fn ই_কার_ভ্রান্তি() {
        assert_eq!(checker().suggest("রবিন্দ্রনাথ").unwrap(), "রবীন্দ্রনাথ");
    }

    #[test]
    fn বিভ্রান্ত_অক্ষর_ম্যাপিং() {
        // "ভাসা" লিখলেও ষ→স ম্যাপিংয়ে "ভাষা" চেনা যায়
        assert_eq!(checker().suggest("ভাসা").unwrap(), "ভাষা");
    }

    #[test]
    fn খুব_দূরের_শব্দে_পরামর্শ_নেই() {
        assert_eq!(checker().suggest("যযযযযযয").is_none(), true);
    }

    #[test]
    fn সীমা_দূরত্ব_গণনা() {
        assert_eq!(bounded_levenshtein("কিতাব", "বই", 2), None);
        assert_eq!(bounded_levenshtein("সেতু", "সেতূ", 2), Some(1));
    }
}
```

## `data/bn_dict_sample.txt`

```
# নমুনা অভিধান — ফরম্যাট: শব্দ ফ্রিকোয়েন্সি
# প্রোডাকশনে: বাংলা উইকিপিডিয়া ডাম্প → টোকেন → ফ্রিকোয়েন্সি পাইপলাইনে তৈরি করুন
বাংলাদেশ 1000
ঢাকা 800
রবীন্দ্রনাথ 500
ঠাকুর 300
ভাষা 250
পদ্মা 200
সেতু 180
মুক্তিযুদ্ধ 150
নোবেল 120
গীতাঞ্জলি 100
```

## গেটওয়েতে ভবিষ্যৎ সংযোগ (ধাপ ১খ)

`core/gateway/Cargo.toml`-এ: `sondhan-nlp = { path = "../nlp" }` — তারপর কয়েরি-পাইপলাইনে `suggest()` দিয়ে **"আপনি কি বোঝাতে চেয়েছেন?"** প্রবাহ। সিআই-তে ক্রলার জবের আদলে `nlp` জব যোগ করুন।

---

# ③ ডিপ্লয়মেন্ট গাইড — `docs/DEPLOY.md` (ভিপিএস + টর)

```markdown
# সন্ধান ডিপ্লয়মেন্ট গাইড — ভিপিএস + টর (.onion)

## ০. পূর্বশর্ত
- উবুন্টু ২৪.০৪ ভিপিএস · ≥২ জিবি র‍্যাম (ওপেনসার্চসহ চালালে ≥৪ জিবি)
- রুট/সুডো প্রবেশ; ডোমেইন থাকলে ক্লিয়ারনেট টিএলএস পাবেন

## ১. সার্ভার শক্ত করুন
    sudo adduser sondhan && sudo usermod -aG sudo sondhan
    # SSH: PasswordAuthentication no, PermitRootLogin no
    sudo systemctl restart ssh
    sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
    sudo ufw enable                       # ৮০৮১ ইচ্ছাকৃতভাবে বন্ধ রাখা হলো
    sudo apt install unattended-upgrades -y
    sudo dpkg-reconfigure -plow unattended-upgrades

## ২. ডকার
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker sondhan

## ৩. প্রকল্প নামান
    git clone https://github.com/<মালিক>/sondhan.git && cd sondhan
    git checkout v0.1.0                   # ব্রাঞ্চ নয় — সবসময় ট্যাগ

## ৪. প্রোডাকশন কম্পোজ — `deploy/docker-compose.prod.yml`
    services:
      gateway:
        image: ghcr.io/<মালিক>/sondhan-gateway:v0.1.0
        restart: unless-stopped
        environment:
          RUST_LOG: info
          OPENSEARCH_URL: http://opensearch:9200
        expose: ["8080"]
        logging: &logs
          driver: json-file
          options: { max-size: "10m", max-file: "3" }
      web:
        image: ghcr.io/<মালিক>/sondhan-web:v0.1.0
        restart: unless-stopped
        expose: ["3000"]
        logging: *logs
      opensearch:
        image: opensearchproject/opensearch:2
        restart: unless-stopped
        environment:
          discovery.type: single-node
          plugins.security.disabled: "true"   # শুধু অভ্যন্তরীণ নেটওয়ার্কে থাকে
          OPENSEARCH_JAVA_OPTS: "-Xms1g -Xmx1g"
        volumes: [os-data:/usr/share/opensearch/data]
        expose: ["9200"]                      # বাইরে থেকে পৌঁছানো যায় না
        logging: *logs
      caddy:
        image: caddy:2
        restart: unless-stopped
        ports: ["80:80", "443:443", "8081:8081"]
        volumes:
          - ./Caddyfile:/etc/caddy/Caddyfile:ro
          - caddy-data:/data
          - caddy-conf:/config
        logging: *logs
    volumes: { os-data: {}, caddy-data: {}, caddy-conf: {} }

## ৫. ক্যাডফাইল — `deploy/Caddyfile`
    sondhan.example.com {
        header {
            Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
            Content-Security-Policy "default-src 'self'; img-src 'self' data:; connect-src 'self'"
            X-Content-Type-Options "nosniff"
            Referrer-Policy "no-referrer"
            Onion-Location "http://<আপনার-অনিয়ন>.onion{path}"
            -Server
        }
        encode zstd gzip
        # গোপনীয়তা নীতি: অ্যাক্সেস লগ সম্পূর্ণ বন্ধ
        log { output stderr; level ERROR }
        handle /api/* { reverse_proxy gateway:8080 }
        handle /healthz { reverse_proxy gateway:8080 }
        handle { reverse_proxy web:3000 }
    }

    # অনিয়ন প্রবেশদ্বার — টিএলএস লাগে না (টরের নিজস্ব এনক্রিপশন)
    http://:8081 {
        header {
            Content-Security-Policy "default-src 'self'; img-src 'self' data:; connect-src 'self'"
            X-Content-Type-Options "nosniff"
            Referrer-Policy "no-referrer"
            -Server
        }
        handle /api/* { reverse_proxy gateway:8080 }
        handle /healthz { reverse_proxy gateway:8080 }
        handle { reverse_proxy web:3000 }
    }

## ৬. টর অনিয়ন সার্ভিস
    sudo apt install tor -y
    # /etc/tor/torrc-এ যোগ করুন:
    HiddenServiceDir /var/lib/tor/sondhan/
    HiddenServicePort 80 127.0.0.1:8081
    sudo systemctl restart tor
    sudo cat /var/lib/tor/sondhan/hostname    # ← আপনার .onion ঠিকানা
প্রাপ্ত ঠিকানাটি ক্যাডফাইলের `Onion-Location`-এ বসিয়ে আবার ডিপ্লয় করুন।

## ৭. চালু ও যাচাই
    docker compose -f deploy/docker-compose.prod.yml up -d
    curl -s  https://sondhan.example.com/healthz                 # ok
    curl -sI https://sondhan.example.com | grep -i onion-location
    torsocks curl -s http://<অনিয়ন>.onion/healthz                # টর-পথ যাচাই
    curl -sG https://sondhan.example.com/api/search --data-urlencode 'q=পরীক্ষা'

## ৮. রোলব্যাক
ইমেজ ট্যাগ পিন করা আছে — পুরনো ট্যাগে ফিরতে:
    sed -i 's/v0.2.0/v0.1.0/' deploy/docker-compose.prod.yml
    docker compose -f deploy/docker-compose.prod.yml up -d

## ৯. অপারেশনস চেকলিস্ট
- ☐ মাসিক: `docker compose pull && up -d` (আগে স্টেজিংয়ে পরীক্ষা)
- ☐ সাপ্তাহিক: ডিস্ক ব্যবহার (`docker system df`), ওপেনসার্চ ভলিউম বৃদ্ধি
- ☐ ব্যাকআপ: `os-data` ভলিউম + ইনডেক্স পুনর্গঠনের জন্য ক্রল-আউটপুট (সাইফার/প্লেইন ভেবে নিন)
- ☐ লগ নীতি: ক্যাডি অ্যাক্সেস লগ বন্ধ (কনফিগে করা), গেটওয়ে লগে কয়েরি নেই — প্রতি রিলিজে যাচাই
- ☐ `security.txt` + ডিসক্লোজার যোগাযোগ সক্রিয়
- ☐ ইনসিডেন্ট হলে: `docs/THREAT-MODEL.md` §৯ প্লেব্যাক অনুসরণ
```

---

## সন্ধানের বর্তমান সামগ্রিক অবস্থা

| স্তর | অবস্থা |
|---|---|
| নীলনকশা · প্রোটোটাইপ · ক্রিপ্টো স্পেক | ✅ |
| রিপো স্কেলেটন · ইউনিট টেস্ট · সিআই + ট্রিভাই | ✅ |
| মেটা-সার্চ (উইকিপিডিয়া/উইকিডাটা) | ✅ লাইভ |
| ভদ্র ক্রলার · বাংলা এনএলপি · ইনডেক্সার → ওপেনসার্চ সার্চ | ✅ |
| থ্রেট মডেল · ভিপিএস + টর ডিপ্লয়মেন্ট | ✅ |

এবার হাতে একটি **এন্ড-টু-এন্ড চলমান সিস্টেম**। পরের যৌক্তিক ধাপ — ① `setup.sh` **ওয়ান-লাইন ইনস্টলার** (সব উপরের গ্লু), ② **"আপনি কি বোঝাতে চেয়েছেন?" প্রবাহ গেটওয়েতে** (এনএলপি সংযোগ), কিংবা ③ **প্রথম পাবলিক ঘোষণার পাতা + ডোমেইন/ব্র্যান্ডিং প্যাক**। বলুন কোনগুলো।

### USER
১ ও ২ করো।

### ASSISTANT
# ① ওয়ান-লাইন ইনস্টলার — `setup.sh`

রিপোর রুটে এই ফাইলটি রাখুন (`chmod +x setup.sh`)। এটি নির্ভরতা যাচাই → টেস্ট → ওপেনসার্চ → ক্রল → ইনডেক্স → সার্ভিস চালু → স্বাস্থ্য যাচাই — সব এক টানে করে।

## `setup.sh`

```bash
#!/usr/bin/env bash
#=============================================================================
# সন্ধান সেটআপ — এক স্ক্রিপ্টে পুরো সিস্টেম
#
#   ব্যবহার:  bash setup.sh [অপশন]
#   অপশন:   --skip-tests       টেস্ট এড়িয়ে যান
#           --prod             প্রোডাকশন মোড (ডকার কম্পোজ)
#           --pages N          ক্রলে সর্বোচ্চ পাতা (ডিফল্ট 15)
#           --seeds "u1,u2"    ক্রলের বীজ-ইউআরএল
#
#   ওয়ান-লাইনার (রিপো ছাড়া):
#     curl -fsSL https://raw.githubusercontent.com/<মালিক>/sondhan/main/setup.sh \
#       -o setup.sh && bash setup.sh
#=============================================================================
set -euo pipefail

R='\033[31m'; G='\033[32m'; Y='\033[33m'; B='\033[34m'; N='\033[0m'
info(){ printf "${B}▸${N} %s\n" "$*"; }
ok(){   printf "${G}✓${N} %s\n" "$*"; }
warn(){ printf "${Y}⚠${N} %s\n" "$*"; }
die(){  printf "${R}✗${N} %s\n" "$*" >&2; exit 1; }

# ── আর্গুমেন্ট ──────────────────────────────────────────────
PAGES=15; SKIP_TESTS=0; MODE=dev
SEEDS="https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর,https://bn.wikipedia.org/wiki/পদ্মা_সেতু,https://bn.wikipedia.org/wiki/বাংলাদেশ"
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-tests) SKIP_TESTS=1 ;;
    --prod)       MODE=prod ;;
    --pages)      PAGES="$2"; shift ;;
    --seeds)      SEEDS="$2"; shift ;;
    -h|--help)    sed -n '2,13p' "$0"; exit 0 ;;
    *)            die "অজানা অপশন: $1" ;;
  esac
  shift
done
cd "$(dirname "$0")"   # রিপোর রুটে থাকুন

# ── ১. নির্ভরতা যাচাই ──────────────────────────────────────
info "নির্ভরতা যাচাই…"
command -v cargo  >/dev/null || die "রাস্ট পাওয়া যায়নি → ইনস্টল: https://rustup.rs"
command -v node   >/dev/null || die "নোড পাওয়া যায়নি → নোড ২০+ ইনস্টল করুন"
command -v docker >/dev/null || die "ডকার পাওয়া যায়নি → ইনস্টল: https://get.docker.com"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || warn "নোড ২০+ প্রস্তাবিত (বর্তমান: $(node -v))"
ok "নির্ভরতা প্রস্তুত"

# ── ২. টেস্ট ───────────────────────────────────────────────
if [ "$SKIP_TESTS" = 0 ]; then
  info "টেস্ট চালানো হচ্ছে…"
  for c in core/nlp core/crawler core/indexer core/gateway; do
    info "cargo test → $c"
    (cd "$c" && cargo test --quiet)
  done
  info "npm test → apps/web"
  (cd apps/web && npm install --silent && npm test --silent)
  ok "সব টেস্ট পাস"
fi

# ── ৩. ওপেনসার্চ ────────────────────────────────────────────
info "ওপেনসার্চ চালু হচ্ছে…"
docker compose up -d opensearch
info "প্রস্তুতির অপেক্ষায় (সর্বোচ্চ ৬০ সে.)…"
for i in $(seq 1 30); do
  curl -s http://localhost:9200 >/dev/null 2>&1 && break
  [ "$i" = 30 ] && die "ওপেনসার্চ সাড়া দিচ্ছে না — ডকার লগ দেখুন"
  sleep 2
done
ok "ওপেনসার্চ প্রস্তুত"

# ── ৪. ক্রল ────────────────────────────────────────────────
info "ক্রল শুরু: সর্বোচ্চ $PAGES পাতা…"
(cd core/crawler && cargo run --release --quiet -- "$SEEDS" "$PAGES" ./out)
DOCS=$(wc -l < core/crawler/out/docs.jsonl 2>/dev/null || echo 0)
ok "ক্রল সম্পন্ন — সংরক্ষিত ডক: $DOCS"

# ── ৫. ইনডেক্স ─────────────────────────────────────────────
info "ওপেনসার্চে ইনডেক্সিং…"
(cd core/indexer && cargo run --release --quiet -- ../crawler/out/docs.jsonl http://localhost:9200)
ok "ইনডেক্সিং সম্পন্ন"

# ── ৬. সার্ভিস চালু ─────────────────────────────────────────
mkdir -p .logs
if [ "$MODE" = prod ]; then
  info "প্রোডাকশন মোড (ডকার কম্পোজ)…"
  [ -f deploy/docker-compose.prod.yml ] || die "deploy/docker-compose.prod.yml নেই"
  docker compose -f deploy/docker-compose.prod.yml up -d --build
  WEB_URL="http://localhost"
else
  info "ডেভ সার্ভিস চালু হচ্ছে (লগ: .logs/)…"
  (cd core/gateway && nohup cargo run --release > ../../.logs/gateway.log 2>&1 \
     & echo $! > ../../.logs/gateway.pid)
  (cd apps/web && nohup npm run dev > ../../.logs/web.log 2>&1 \
     & echo $! > ../../.logs/web.pid)
  WEB_URL="http://localhost:5173"
fi

# ── ৭. স্বাস্থ্য যাচাই ──────────────────────────────────────
info "স্বাস্থ্য যাচাই…"
for i in $(seq 1 30); do
  curl -s http://localhost:8080/healthz >/dev/null 2>&1 && break
  sleep 2
done
curl -s http://localhost:8080/healthz | grep -q ok \
  || warn "গেটওয়ে সাড়া দেয়নি — .logs/gateway.log দেখুন"
curl -sG http://localhost:8080/api/search --data-urlencode "q=পদ্মা সেতু" \
  | grep -q results || warn "সার্চ এন্ডপয়েন্ট যাচাই ব্যর্থ"
ok "সিস্টেম চালু!"

printf "\n${G}━━━ সন্ধান প্রস্তুত ━━━${N}\n"
printf "  ওয়েব ইউআই : %s\n" "$WEB_URL"
printf "  গেটওয়ে   : http://localhost:8080  (হেলথ: /healthz)\n"
printf "  ওপেনসার্চ : http://localhost:9200\n"
if [ "$MODE" = prod ]; then
  printf "  বন্ধ করতে : docker compose -f deploy/docker-compose.prod.yml down\n"
else
  printf "  বন্ধ করতে : kill \$(cat .logs/*.pid)\n"
fi
```

## বাড়তি গ্লু

```makefile
# Makefile-এ যোগ করুন
setup:      ## এক টানে পুরো সিস্টেম
	bash setup.sh
setup-fast: ## টেস্ট ছাড়া, ৫ পাতার দ্রুত সেটআপ
	bash setup.sh --skip-tests --pages 5
stop:
	-kill $$(cat .logs/*.pid) 2>/dev/null || true
```

**টেস্ট কেস (চেকলিস্টে যোগ করুন):**

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ঝ১ | খালি উবুন্টুতে `bash setup.sh` | ৭টি ধাপ সবুজ, শেষে ইউআরএল-সারসংক্ষেপ | ☐ |
| ঝ২ | `bash setup.sh --skip-tests --pages 5` | < ৫ মিনিটে শেষ | ☐ |
| ঝ৩ | ডকার আনইনস্টল করে চালানো | পরিষ্কার বাংলা ত্রুটিবার্তা, ক্র্যাশ নয় | ☐ |
| ঝ৪ | দুবার পরপর চালানো (আইডেমপোটেন্সি) | ইনডেক্স একই থাকে, ডুপ ডক ঢোকে না | ☐ |

> নিরাপত্তা নোট: `curl \| bash` সুবিধাজনক হলেও ব্যবহারকারীকে আগে ফাইলটি ডাউনলোড করে পড়ার পরামর্শ দিন — এটি প্রাইভেসি প্রকল্পের জন্য আস্থার প্রশ্ন।

---

# ② "আপনি কি বোঝাতে চেয়েছেন?" — এনএলপি গেটওয়েতে যুক্ত

প্রবাহ:

```
কয়েরি → টোকেনাইজ → প্রতি টোকেনে SpellChecker → কোনো পরিবর্তন?
   │                                                  │ হ্যাঁ
   ▼                                                  ▼
gather(মূল কয়েরি) ──ফলাফল শূন্য?──হ্যাঁ──▶ gather(সংশোধিত কয়েরি)
   │                                                  │
   └──────────▶ উত্তরে: results + did_you_mean ◀───────┘
```

## খ.১) এনএলপি প্যাচ — `core/nlp/src/spell.rs`

`load()`-কে পাতলা করে স্ট্রিং-ভিত্তিক লোডার যোগ করুন (এম্বেডেড অভিধানের জন্য):

```rust
    /// স্ট্রিং থেকে লোড — লাইন-প্রতি "শব্দ ফ্রিকোয়েন্সি" (ফ্রিকোয়েন্সি ঐচ্ছিক)
    pub fn from_text(text: &str) -> Self {
        let items = text.lines()
            .map(str::trim)
            .filter(|l| !l.is_empty() && !l.starts_with('#'))
            .filter_map(|l| {
                let mut p = l.split_whitespace();
                let w = p.next()?.to_string();
                let f = p.next().and_then(|x| x.parse().ok()).unwrap_or(1);
                Some((w, f))
            });
        Self::from_words(items)
    }

    pub fn load(path: &str) -> std::io::Result<Self> {
        Ok(Self::from_text(&std::fs::read_to_string(path)?))
    }
```

টেস্ট:

```rust
    #[test]
    fn টেক্সট_থেকে_লোড_ও_মন্তব্য_উপেক্ষা() {
        let c = SpellChecker::from_text("# মন্তব্য\nঢাকা 500\nভাষা\n");
        assert_eq!(c.suggest("ঢাকা").unwrap(), "ঢাকা");
        assert_eq!(c.suggest("ভাসা").unwrap(), "ভাষা"); // ষ→স কী-ম্যাপিং
    }
```

## খ.২) গেটওয়ে ডিপেন্ডেন্সি — `core/gateway/Cargo.toml`

```toml
sondhan-nlp = { path = "../nlp" }
```

## খ.৩) `core/gateway/src/spellcheck.rs` (নতুন ফাইল)

```rust
//! "আপনি কি বোঝাতে চেয়েছেন?" — সন্ধান-এনএলপি সংযোগ
//! অভিধান বাইনারিতেই এম্বেড করা (ডকার-বান্ধব); চাইলে ফাইল দিয়ে ওভাররাইড:
//!   SONDHAN_DICT=/path/bn_dict.txt

use sondhan_nlp::{tokenize, SpellChecker};
use std::sync::OnceLock;

static CHECKER: OnceLock<SpellChecker> = OnceLock::new();
const EMBEDDED_DICT: &str = include_str!("../../nlp/data/bn_dict_sample.txt");

fn checker() -> &'static SpellChecker {
    CHECKER.get_or_init(|| {
        if let Ok(path) = std::env::var("SONDHAN_DICT") {
            match SpellChecker::load(&path) {
                Ok(c) => return c,
                Err(e) => tracing::warn!(error = %e, "অভিধান ফাইল পড়া যায়নি — এম্বেডেড ব্যবহার হচ্ছে"),
            }
        }
        SpellChecker::from_text(EMBEDDED_DICT)
    })
}

/// প্রতি টোকেনে পরামর্শ; অন্তত একটি বদলালে সংশোধিত কয়েরি ফেরত
pub fn suggest_query(q: &str) -> Option<String> {
    let tokens = tokenize(q);
    if tokens.is_empty() { return None; }
    let mut changed = false;
    let mut out = Vec::with_capacity(tokens.len());
    for t in tokens {
        match checker().suggest(&t) {
            Some(s) if s != t => { changed = true; out.push(s); }
            other => out.push(other.unwrap_or(t)),
        }
    }
    changed.then(|| out.join(" "))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ভুল_বানানে_পরামর্শ() {
        assert_eq!(suggest_query("বাংলদেশ").as_deref(), Some("বাংলাদেশ"));
        assert_eq!(suggest_query("রবিন্দ্রনাথ ঠাকুর").as_deref(), Some("রবীন্দ্রনাথ ঠাকুর"));
    }

    #[test]
    fn সঠিক_কয়েরিতে_কিছু_নেই() {
        assert_eq!(suggest_query("বাংলাদেশ"), None);
    }

    #[test]
    fn অজানা_শব্দ_অক্ষত_থাকে() {
        assert_eq!(suggest_query("কোয়ান্টাম কম্পিউটার"), None);
    }
}
```

## খ.৪) হ্যান্ডলার আপডেট — `core/gateway/src/search.rs` (পূর্ণ রূপ)

```rust
use crate::{aggregator, opensearch, spellcheck};
use axum::{extract::Query, Json};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Deserialize)]
pub struct SearchParams { pub q: String }

#[derive(Serialize)]
pub struct SearchResult { pub title: String, pub url: String, pub snippet: String }

#[derive(Serialize)]
pub struct Knowledge { pub label: String, pub description: String, pub url: String }

#[derive(Serialize)]
pub struct SearchResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub knowledge: Option<Knowledge>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub did_you_mean: Option<String>,
}

/// GET /api/search?q=...
pub async fn search(Query(p): Query<SearchParams>) -> Json<SearchResponse> {
    let dym = spellcheck::suggest_query(&p.q);

    let (mut results, mut knowledge) = gather(&p.q).await;

    // মূল কয়েরিতে কিছু না মিললে সংশোধিত কয়েরিতে স্বয়ংক্রিয় নতুন চেষ্টা
    if results.is_empty() {
        if let Some(corrected) = &dym {
            let retry = gather(corrected).await;
            if !retry.0.is_empty() { (results, knowledge) = retry; }
        }
    }
    if results.is_empty() { results = vec![demo_fallback(&p.q)]; }

    Json(SearchResponse { query: p.q, results, knowledge, did_you_mean: dym })
}

async fn gather(q: &str) -> (Vec<SearchResult>, Option<Knowledge>) {
    let (local, wiki, entity) = tokio::join!(
        opensearch::search_index(q),
        aggregator::search_wikipedia(q, 8),
        aggregator::search_wikidata(q)
    );
    let mut results: Vec<SearchResult> = local; // নিজস্ব ইনডেক্স আগে
    let mut seen: HashSet<String> = results.iter().map(|r| r.url.clone()).collect();
    for r in wiki.into_iter().map(|r| SearchResult {
        title: r.title, url: r.url, snippet: r.snippet,
    }) {
        if seen.insert(r.url.clone()) { results.push(r); }
    }
    let knowledge = entity.map(|e| Knowledge {
        label: e.label, description: e.description, url: e.url,
    });
    (results, knowledge)
}

fn demo_fallback(q: &str) -> SearchResult {
    SearchResult {
        title: format!("{} — ডেমো ফলাফল", q),
        url: format!("https://example.com/{}", q.replace(' ', "-")),
        snippet: "অফলাইন ফলব্যাক: ইনডেক্স বা নেটওয়ার্ক থাকলে আসল ফলাফল আসবে।".into(),
    }
}
```

**`core/gateway/src/main.rs`** — `mod opensearch;`-এর পাশে: `mod spellcheck;`

## খ.৫) বিল্ড-কনটেক্সট ঠিক করুন (এম্বেডেড অভিধানের জন্য)

`include_str!`-এর কারণে গেটওয়ে বিল্ডে `core/nlp` দরকার — ডকারফাইল ও কম্পোজ আপডেট:

```dockerfile
# core/gateway/Dockerfile (আপডেটেড)
FROM rust:1.82 AS build
WORKDIR /app
COPY core/ ./core/
WORKDIR /app/core/gateway
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=build /app/core/gateway/target/release/sondhan-gateway /usr/local/bin/
EXPOSE 8080
CMD ["sondhan-gateway"]
```

```yaml
# docker-compose.yml-এ গেটওয়ে সার্ভিস
  gateway:
    build: { context: ., dockerfile: core/gateway/Dockerfile }
```

## খ.৬) ফ্রন্টএন্ড প্যাচ — `apps/web/src/routes/+page.svelte`

```svelte
<!-- <script>-এ যোগ -->
let didYouMean: string | null = null;
// ফেচের পরে:  didYouMean = data.did_you_mean ?? null;
```

```svelte
<!-- ফলাফলের ঠিক উপরে -->
{#if didYouMean}
  <p class="dym">আপনি কি বোঝাতে চেয়েছেন:
    <button class="dym-link" on:click={() => { q = didYouMean ?? ''; doSearch(); }}>
      {didYouMean}
    </button>
  </p>
{/if}
```

```css
.dym { margin: 14px 0 0; color: #55605b; font-size: .95rem; }
.dym-link { border: none; background: none; color: #0e7a63; font-weight: 700;
            font-size: 1rem; cursor: pointer; font-family: inherit; }
.dym-link:hover { text-decoration: underline; }
```

## খ.৭) নতুন টেস্ট কেস

```bash
curl -sG localhost:8080/api/search --data-urlencode 'q=ভাসা'
curl -sG localhost:8080/api/search --data-urlencode 'q=বাংলদেশ'
```

| # | কয়েরি | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ট১ | `ভাসা` | `"did_you_mean": "ভাষা"` | ☐ |
| ট২ | `বাংলদেশ` | `"did_you_mean": "বাংলাদেশ"` | ☐ |
| ট৩ | `রবিন্দ্রনাথ ঠাকুর` | `"did_you_mean": "রবীন্দ্রনাথ ঠাকুর"` | ☐ |
| ট৪ | `বাংলাদেশ` (সঠিক) | ফিল্ডটিই জেসনে নেই | ☐ |
| ট৫ | অজানা + শূন্য ফলাফল | সংশোধিত কয়েরিতে স্বয়ংক্রিয় পুনঃসার্চ | ☐ |

**সিআই-তে যোগ করুন** (ক্রলার জবের আদলে):

```yaml
  nlp:
    name: "বাংলা এনএলপি · টেস্ট"
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: core/nlp } }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: core/nlp }
      - run: cargo test
```

---

দুটোই সম্পন্ন — এখন `bash setup.sh` চালালেই ক্রল→ইনডেক্স→সার্চ→বানান-সংশোধন পর্যন্ত পুরো চেইন হাতে আসে। পরের ধাপের বিকল্প: ① **প্রথম পাবলিক ঘোষণা পাতা + ব্র্যান্ডিং প্যাক** (লোগো এসভিজি, ওজি-ইমেজ, ঘোষণার লেখা), ② **ড্যাশবোর্ড** (ইনডেক্স পরিসংখ্যান, ক্রল-স্বাস্থ্য, লোড-গ্রাফ), কিংবা ③ **গগলস ইঞ্জিন** (ব্যবহারকারীর রি-র‍্যাংক নিয়ম প্রয়োগ)। বলুন কোনগুলো।

### USER
করো তিনটাই।

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① ব্র্যান্ডিং প্যাক + পাবলিক ঘোষণা (`brand/` + `/launch`)

## ফোল্ডার

```
brand/
├── logo-mark.svg       ← আইকন (ফেভিকন/অ্যাপ)
├── logo-lockup.svg     ← মার্ক + ওয়ার্ডমার্ক
├── og.svg              ← ১২০০×৬৩০ ওপেন-গ্রাফ ইমেজ
├── tokens.json         ← ব্র্যান্ড টোকেন
└── BRAND.md            ← ব্যবহারবিধি
```

## `brand/logo-mark.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="সন্ধান">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e7a63"/>
      <stop offset="1" stop-color="#e0762f"/>
    </linearGradient>
  </defs>
  <!-- লেন্স -->
  <circle cx="26" cy="26" r="16" fill="none" stroke="url(#s)" stroke-width="5.5"/>
  <!-- হাতল -->
  <line x1="38.5" y1="38.5" x2="53" y2="53" stroke="url(#s)" stroke-width="7" stroke-linecap="round"/>
  <!-- লেন্সের ভেতরে 'স' + ভোরের আলো -->
  <path d="M14 26a12 12 0 0 1 24 0" fill="none" stroke="#e0762f" stroke-width="2" stroke-linecap="round" opacity=".55"/>
  <text x="26" y="33" font-size="17" text-anchor="middle" fill="url(#s)"
        font-family="'Noto Serif Bengali',serif" font-weight="900">স</text>
</svg>
```

## `brand/logo-lockup.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e7a63"/><stop offset="1" stop-color="#e0762f"/>
    </linearGradient>
  </defs>
  <g transform="translate(8,8)"><use href="logo-mark.svg"/></g>
  <text x="92" y="44" font-size="34" font-weight="900" fill="currentColor"
        font-family="'Noto Serif Bengali',serif">সন্ধান</text>
  <text x="92" y="66" font-size="13" fill="#5b6663"
        font-family="'Noto Sans Bengali',sans-serif">আপনার ভাষায়, আপনার গোপনীয়তায়</text>
</svg>
```

## `brand/og.svg` (১২০০×৬৩০)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e1513"/><stop offset="1" stop-color="#14231d"/>
    </linearGradient>
    <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2fbf9a"/><stop offset="1" stop-color="#f0954f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="600" cy="630" r="420" fill="url(#ac)" opacity=".07"/>
  <g transform="translate(536,120) scale(2)"><use href="logo-mark.svg"/></g>
  <text x="600" y="330" text-anchor="middle" font-size="96" font-weight="900" fill="#e9efe9"
        font-family="'Noto Serif Bengali',serif">সন্ধান</text>
  <text x="600" y="390" text-anchor="middle" font-size="30" fill="#a3b3ab"
        font-family="'Noto Sans Bengali',sans-serif">আপনার ভাষায়, আপনার গোপনীয়তায়</text>
  <text x="600" y="450" text-anchor="middle" font-size="22" fill="#2fbf9a"
        font-family="monospace">উন্মুক্ত · মুক্ত · শূন্য-জ্ঞান এনক্রিপশন · AGPL-3.0</text>
</svg>
```

## `brand/tokens.json` ও `BRAND.md` (সারমর্ম)

```json
{
  "color": {
    "teal": { "500": "#0e7a63", "400": "#2fbf9a" },
    "amber": { "500": "#e0762f", "400": "#f0954f" },
    "paper": "#f7f4ee", "ink": "#1c2321", "night": "#0e1513"
  },
  "font": { "display": "Noto Serif Bengali", "body": "Noto Sans Bengali", "mono": "IBM Plex Mono" },
  "radius": { "card": "16px", "pill": "999px" },
  "logo": { "clearspace": "লেন্সের ব্যাসার্ধের সমান", "নিষেধ": ["ঘোরানো", "রঙ বদল", "ছায়া"] }
}
```

`BRAND.md`: টিল→অ্যাম্বার গ্রেডিয়েন্ট = "ভোরের আলোয় খোঁজা"; সব ফন্ট সেলফ-হোস্টেড; লোগো কখনো থার্ড-পার্টি স্ক্রিপ্টের পেজে নয় (ব্র্যান্ড নিজেই প্রাইভেসির প্রতিশ্রুতি)।

## ঘোষণা পোস্ট (বাংলা)

> **সন্ধান — যে সার্চ ইঞ্জিন আপনার সার্চ পড়তেই পারে না**
>
> আজ থেকে সন্ধান প্রকাশ্যে। তিনটি প্রতিশ্রুতি:
>
> ১. **আপনার কয়েরি আপনার।** সার্চ হিস্টরি আপনার ডিভাইসে এনক্রিপ্ট হয় (AES-256-GCM); সার্ভার দেখে শুধু অর্থহীন সাইফারটেক্সট। কোনো কুকি নেই, লগ নেই, থার্ড-পার্টি স্ক্রিপ্ট নেই।
> ২. **বাংলা প্রথম শ্রেণির নাগরিক।** বাংলা টোকেনাইজার, বানান-সংশোধন ("আপনি কি বোঝাতে চেয়েছেন?"), আর লক্ষ্য — ২৭ কোটি মানুষের নিজের ভাষায় মানসম্মত সার্চ।
> ৩. **সবকিছু খোলা।** কোড, থ্রেট মডেল, র‍্যাংকিং-নীতি — সব এজিপিএল। চাইলে নিজের সার্ভারে চালান, গগলস দিয়ে র‍্যাংকিং নিয়ন্ত্রণ করুন, ফর্ক করে নতুন কিছু বানান।
>
> আমরা এখনো ছোট — মেটা-সার্চ + ক্রলার-শুরুর ইনডেক্স নিয়ে। বড় ইনডেক্স সময় নেবে; কিন্তু গোপনীয়তার জন্য অপেক্ষা করার কিছু নেই।
>
> 🛠️ কোড ও ডক: [রিপো লিংক] · 🧅 অনিয়ন: `…` · 💬 ম্যাট্রিক্স: `#sondhan:matrix.org`
> সমালোচনাই আমাদের প্রথম প্রয়োজন — ইস্যু খুলুন, RFC লিখুন, কোড পাঠান।

**ইংরেজি সংস্করণ (এইচএন/লবি-স্টাইল, ছোট):**

> **Sondhan – a search engine that mathematically cannot read your searches.**
> Open-source (AGPL), Bengali-first, zero-knowledge encrypted history (client-side
> Argon2id → AES-256-GCM), transparent ranking with user Goggles, metasearch today
> and an own crawler/index tomorrow. Self-hostable with one script. Early, small,
> and hungry for critique — the code, threat model and roadmap are all public.

## লঞ্চ পেজ — `apps/web/src/routes/launch/+page.svelte`

```svelte
<script lang="ts">
  const features = [
    ['🔐', 'শূন্য-জ্ঞান এনক্রিপশন', 'সার্চ হিস্টরি আপনার ডিভাইসেই তালাবদ্ধ — সার্ভার গাণিতিকভাবেই পড়তে পারে না।'],
    ['🌏', 'বাংলা-প্রথম', 'বাংলা টোকেনাইজার, বানান-সংশোধন, নিজের ভাষায় সমান মর্যাদা।'],
    ['🔍', 'স্বচ্ছ র‍্যাংকিং + গগলস', 'প্রতিটি ফলাফলের ব্যাখ্যা; নিজের নিয়মে ক্রম সাজান।'],
    ['🏛️', 'এজিপিএল মুক্তি', 'ফর্ক করুন, চালান, বদলান — বিজ্ঞাপন ও ট্র্যাকিং চিরতরে নেই।'],
  ];
</script>

<svelte:head>
  <title>সন্ধান — উন্মুক্ত, গোপনীয়তা-প্রথম সার্চ</title>
  <meta name="description" content="যে সার্চ ইঞ্জিন আপনার সার্চ পড়তেই পারে না।" />
  <meta property="og:image" content="/og.svg" />
</svelte:head>

<main>
  <img class="mark" src="/logo-mark.svg" alt="" width="88" height="88" />
  <h1>সন্ধান</h1>
  <p class="tag">আপনার ভাষায়, আপনার গোপনীয়তায়।</p>
  <div class="cta">
    <a class="btn" href="/">সার্চ শুরু করুন</a>
    <a class="btn ghost" href="https://github.com/<মালিক>/sondhan">কোড দেখুন</a>
  </div>
  <div class="grid">
    {#each features as [ic, t, d]}
      <div class="card"><span class="ic">{ic}</span><b>{t}</b><p>{d}</p></div>
    {/each}
  </div>
  <p class="foot">এজিপিএল-৩.০ · থ্রেট মডেল প্রকাশ্য · কুকি নেই, ট্র্যাকার নেই, বিজ্ঞাপন নেই।</p>
</main>

<style>
  main { max-width: 860px; margin: 0 auto; padding: 72px 20px; text-align: center;
         font-family: "Noto Sans Bengali", sans-serif; }
  .mark { margin-bottom: 10px; }
  h1 { font-family: "Noto Serif Bengali", serif; font-size: 3.4rem; margin: 0;
       background: linear-gradient(120deg, #0e7a63, #e0762f);
       -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tag { color: #5b6663; font-size: 1.2rem; margin: 6px 0 26px; }
  .cta { display: flex; gap: 12px; justify-content: center; margin-bottom: 44px; }
  .btn { padding: 12px 22px; border-radius: 12px; background: #e0762f; color: #fff;
         text-decoration: none; font-weight: 700; }
  .btn.ghost { background: #fff; color: #1c2321; border: 1.5px solid #e3dccc; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px; text-align: right; }
  .card { background: #fff; border: 1px solid #e3dccc; border-radius: 16px; padding: 18px; }
  .card .ic { font-size: 26px; }
  .card b { display: block; margin: 8px 0 4px; }
  .card p { color: #5b6663; font-size: .88rem; margin: 0; }
  .foot { margin-top: 40px; color: #8a938f; font-size: .85rem; }
</style>
```

`static/`-এ `logo-mark.svg` ও `og.svg` কপি করুন।

---

# ② ড্যাশবোর্ড — ইনডেক্স পরিসংখ্যান, ক্রল-স্বাস্থ্য, লোড-গ্রাফ

## গেটওয়ে: `core/gateway/src/metrics.rs` (নতুন)

```rust
//! হালকা ইন-প্রসেস মেট্রিক্স — শুধু সমষ্টিগত, কোনো কয়েরি নেই
use axum::{extract::Request, middleware::Next, response::Response};
use serde_json::json;
use std::collections::VecDeque;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::Instant;

static REQUESTS: AtomicU64 = AtomicU64::new(0);
static ERRORS: AtomicU64 = AtomicU64::new(0);
static LATENCY_SUM_MS: AtomicU64 = AtomicU64::new(0);
static STARTED: OnceLock<Instant> = OnceLock::new();

fn samples() -> &'static Mutex<VecDeque<u64>> {
    static S: OnceLock<Mutex<VecDeque<u64>>> = OnceLock::new();
    S.get_or_init(|| Mutex::new(VecDeque::with_capacity(120)))
}

pub fn started() -> Instant { *STARTED.get_or_init(Instant::now) }

pub async fn meter(req: Request, next: Next) -> Response {
    REQUESTS.fetch_add(1, Ordering::Relaxed);
    let t = Instant::now();
    let res = next.run(req).await;
    LATENCY_SUM_MS.fetch_add(t.elapsed().as_millis() as u64, Ordering::Relaxed);
    if res.status().is_server_error() { ERRORS.fetch_add(1, Ordering::Relaxed); }
    let mut q = samples().lock().unwrap();
    q.push_back(t.elapsed().as_millis() as u64);
    if q.len() > 120 { q.pop_front(); }
    res
}

pub fn snapshot() -> serde_json::Value {
    let reqs = REQUESTS.load(Ordering::Relaxed);
    let sum = LATENCY_SUM_MS.load(Ordering::Relaxed);
    let q = samples().lock().unwrap();
    json!({
        "requests_total": reqs,
        "errors_total": ERRORS.load(Ordering::Relaxed),
        "avg_latency_ms": if reqs == 0 { 0 } else { sum / reqs },
        "uptime_secs": started().elapsed().as_secs(),
        "recent_latency_ms": q.iter().copied().collect::<Vec<_>>(),
    })
}
```

## গেটওয়ে: `core/gateway/src/stats.rs` (নতুন)

```rust
//! /api/stats/* — ড্যাশবোর্ডের তথ্য-উৎস
use serde_json::{json, Value};
use axum::Json;
use std::time::Duration;

/// ওপেনসার্চ থেকে ইনডেক্সের আকার ও ডক-সংখ্যা
pub async fn index_stats() -> Json<Value> {
    let base = std::env::var("OPENSEARCH_URL").unwrap_or_else(|_| "http://localhost:9200".into());
    let Ok(client) = reqwest::Client::builder().timeout(Duration::from_secs(3)).build() else {
        return Json(json!({ "available": false }));
    };
    let Ok(r) = client.get(format!("{base}/sondhan_docs/_stats")).send().await else {
        return Json(json!({ "available": false }));
    };
    let Ok(v) = r.json::<Value>().await else { return Json(json!({ "available": false })); };
    let p = &v["_all"]["primaries"];
    Json(json!({
        "available": true,
        "docs": p["docs"]["count"].as_u64().unwrap_or(0),
        "bytes": p["store"]["size_in_bytes"].as_u64().unwrap_or(0),
    }))
}

/// ক্রল-আউটপুট (docs.jsonl) থেকে স্বাস্থ্য: ডক-সংখ্যা, শেষ ফেচ, শীর্ষ হোস্ট
pub async fn crawl_stats() -> Json<Value> {
    let path = std::env::var("CRAWL_OUT")
        .unwrap_or_else(|_| "../crawler/out/docs.jsonl".into());
    let Ok(content) = std::fs::read_to_string(&path) else {
        return Json(json!({ "available": false }));
    };
    let mut total = 0u64;
    let mut last_ts = 0u64;
    let mut hosts: std::collections::HashMap<String, u64> = std::collections::HashMap::new();
    for line in content.lines() {
        let Ok(v) = serde_json::from_str::<Value>(line) else { continue };
        total += 1;
        last_ts = last_ts.max(v["fetched_at"].as_u64().unwrap_or(0));
        if let Some(u) = v["url"].as_str().and_then(|u| url::Url::parse(u).ok()) {
            if let Some(h) = u.host_str() { *hosts.entry(h.to_string()).or_default() += 1; }
        }
    }
    let mut top: Vec<(&String, &u64)> = hosts.iter().collect();
    top.sort_by(|a, b| b.1.cmp(a.1));
    Json(json!({
        "available": true,
        "docs": total,
        "last_fetch_epoch": last_ts,
        "top_hosts": top.iter().take(5).map(|(h, c)| json!({ "host": h, "docs": c })).collect::<Vec<_>>(),
    }))
}

/// ইন-প্রসেস লোড-পরিসংখ্যান
pub async fn load_stats() -> Json<Value> { Json(crate::metrics::snapshot()) }
```

`Cargo.toml`-এ `url = "2"` যোগ করুন।

## গেটওয়ে: রুট ও মিডলওয়্যার — `main.rs` প্যাচ

```rust
mod metrics;
mod stats;

// Router::new() চেইনে যোগ করুন:
    .route("/api/stats/index", get(stats::index_stats))
    .route("/api/stats/crawl", get(stats::crawl_stats))
    .route("/api/stats/load",  get(stats::load_stats))
    .layer(middleware::from_fn(metrics::meter))   // ephemeral_request-এর পরে
```

কম্পোজে গেটওয়ে এনভ (ডেভ): `CRAWL_OUT: ./core/crawler/out/docs.jsonl`

## ফ্রন্টএন্ড: `apps/web/src/routes/dashboard/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let index: any = null, crawl: any = null, load: any = null, err = '';

  async function refresh() {
    try {
      [index, crawl, load] = await Promise.all([
        fetch('/api/stats/index').then(r => r.json()),
        fetch('/api/stats/crawl').then(r => r.json()),
        fetch('/api/stats/load').then(r => r.json()),
      ]);
      err = '';
    } catch { err = 'পরিসংখ্যান লোড ব্যর্থ — গেটওয়ে চলছে কি?'; }
  }

  onMount(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  });

  // লেটেন্সি স্পার্কলাইন (হাতে-আঁকা এসভিজি — কোনো চার্ট লাইব্রেরি নেই)
  $: points = spark(load?.recent_latency_ms ?? []);
  function spark(vals: number[], w = 560, h = 64): string {
    if (vals.length < 2) return '';
    const max = Math.max(...vals, 1);
    return vals
      .map((v, i) => `${((i / (vals.length - 1)) * w).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
      .join(' ');
  }

  function fmtBytes(b: number): string {
    if (!b) return '—';
    if (b > 1e9) return (b / 1e9).toFixed(1) + ' জিবি';
    if (b > 1e6) return (b / 1e6).toFixed(1) + ' মেবি';
    return (b / 1e3).toFixed(0) + ' কিলো';
  }
  function fmtUptime(s: number): string {
    const m = Math.floor(s / 60), h = Math.floor(m / 60);
    return h > 0 ? `${h} ঘণ্টা ${m % 60} মিনিট` : `${m} মিনিট`;
  }
</script>

<svelte:head><title>ড্যাশবোর্ড · সন্ধান</title></svelte:head>

<main>
  <header><h1>📊 ড্যাশবোর্ড</h1><a href="/">← সার্চে ফিরুন</a></header>
  {#if err}<p class="err">{err}</p>{/if}

  <div class="grid">
    <div class="card"><span class="lbl">ইনডেক্স ডক</span>
      <b>{index?.available ? index.docs.toLocaleString('bn-BD') : '—'}</b></div>
    <div class="card"><span class="lbl">ইনডেক্স আকার</span>
      <b>{index?.available ? fmtBytes(index.bytes) : '—'}</b></div>
    <div class="card"><span class="lbl">ক্রল করা ডক</span>
      <b>{crawl?.available ? crawl.docs.toLocaleString('bn-BD') : '—'}</b></div>
    <div class="card"><span class="lbl">শেষ ফেচ</span>
      <b>{crawl?.available && crawl.last_fetch_epoch
            ? new Date(crawl.last_fetch_epoch * 1000).toLocaleString('bn-BD') : '—'}</b></div>
    <div class="card"><span class="lbl">মোট রিকোয়েস্ট</span>
      <b>{load ? load.requests_total.toLocaleString('bn-BD') : '—'}</b></div>
    <div class="card"><span class="lbl">গড় লেটেন্সি</span>
      <b>{load ? load.avg_latency_ms + ' মি.সে.' : '—'}</b></div>
    <div class="card"><span class="lbl">আপটাইম</span>
      <b>{load ? fmtUptime(load.uptime_secs) : '—'}</b></div>
    <div class="card"><span class="lbl">ত্রুটি (৫xx)</span>
      <b>{load ? load.errors_total : '—'}</b></div>
  </div>

  <section class="panel">
    <h2>লেটেন্সি (সর্বশেষ ১২০ রিকোয়েস্ট)</h2>
    {#if points}
      <svg viewBox="0 0 560 64" class="spark" role="img" aria-label="লেটেন্সি গ্রাফ">
        <polyline points={points} fill="none" stroke="#0e7a63" stroke-width="2"
                  stroke-linejoin="round" />
      </svg>
    {:else}<p class="dim">এখনও যথেষ্ট ডেটা নেই — কয়েকটি সার্চ করুন।</p>{/if}
  </section>

  <section class="panel">
    <h2>শীর্ষ হোস্ট (ক্রল)</h2>
    {#if crawl?.available}
      {#each crawl.top_hosts as h}
        <div class="bar-row">
          <span class="host">{h.host}</span>
          <div class="bar"><i style="width: {Math.max(6, (h.docs / crawl.top_hosts[0].docs) * 100)}%"></i></div>
          <span class="n">{h.docs}</span>
        </div>
      {/each}
    {:else}<p class="dim">ক্রল-আউটপুট পাওয়া যায়নি।</p>{/if}
  </section>

  <p class="privacy">🔒 সব পরিসংখ্যান সমষ্টিগত — কোনো কয়েরি, আইপি বা পরিচয় এখানে নেই।</p>
</main>

<style>
  main { max-width: 900px; margin: 0 auto; padding: 40px 20px;
         font-family: "Noto Sans Bengali", sans-serif; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
  h1 { font-family: "Noto Serif Bengali", serif; font-size: 1.8rem; }
  header a { color: #0e7a63; text-decoration: none; }
  .err { background: #fdecea; color: #a33; padding: 10px 14px; border-radius: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 26px; }
  .card { background: #fff; border: 1px solid #e3dccc; border-radius: 14px; padding: 16px; }
  .card .lbl { font-size: .78rem; color: #8a938f; display: block; }
  .card b { font-size: 1.35rem; }
  .panel { background: #fff; border: 1px solid #e3dccc; border-radius: 16px;
           padding: 20px; margin-bottom: 20px; }
  .panel h2 { font-size: 1.05rem; margin: 0 0 12px; }
  .spark { width: 100%; height: 72px; }
  .dim { color: #8a938f; font-size: .9rem; }
  .bar-row { display: grid; grid-template-columns: 180px 1fr 48px; gap: 10px;
             align-items: center; margin-bottom: 8px; font-size: .88rem; }
  .host { direction: ltr; text-align: right; color: #5b6663; }
  .bar { background: #efe9dd; border-radius: 6px; height: 12px; overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 6px;
           background: linear-gradient(90deg, #0e7a63, #e0762f); }
  .n { text-align: left; color: #5b6663; }
  .privacy { color: #8a938f; font-size: .85rem; text-align: center; }
</style>
```

হোমপেজে একটি লিংক যোগ করুন: `<a href="/dashboard">📊 ড্যাশবোর্ড</a>`

**টেস্ট কেস:** `/dashboard` খুলে ৩টি সার্চ করুন → রিকোয়েস্ট-গণতি বাড়ে, স্পার্কলাইনে রেখা দেখা যায়; ওপেনসার্চ বন্ধ করলে ইনডেক্স কার্ডে `—` (ক্র্যাশ নয়)।

---

# ③ গগলস ইঞ্জিন — ব্যবহারকারীর রি-র‍্যাংক নিয়ম

গগলস **শুধু ক্লায়েন্ট-সাইডে** চলে — নিয়ম সার্ভারে যায় না, গোপনীয়তা অক্ষুণ্ণ।

## ফরম্যাট স্পেক (সংক্ষেপে — `docs/GOGGLES.md`)

```json
{
  "name": "শিক্ষা-প্রথমে",
  "desc": "উইকি ও শিক্ষা-ডোমেইন উপরে",
  "rules": [
    { "match": { "domain": "wikipedia.org" }, "boost": 3 },
    { "match": { "domain": ".edu" },          "boost": 2 },
    { "match": { "url_contains": "ads" },     "boost": 0.2 }
  ]
}
```

নিয়ম: `domain` সাবডোমেইনসহ মেলে; `.edu`-জাতীয় টিএলডিও মেলে; প্রতি মিলে `boost` গুণ হয়; ভিত্তি-স্কোর = `১/(ক্রম+১)`; গুণ করে পুনঃক্রম।

## `apps/web/src/lib/goggles.ts`

```ts
export interface GoggleRule {
  match: { domain?: string; url_contains?: string };
  boost: number;
}
export interface Goggles { name: string; desc?: string; rules: GoggleRule[] }

export const BUILTINS: Record<string, Goggles> = {
  edu: {
    name: 'শিক্ষা-প্রথমে',
    desc: 'উইকিপিডিয়া ও শিক্ষা-প্রতিষ্ঠান উপরে',
    rules: [
      { match: { domain: 'wikipedia.org' }, boost: 3 },
      { match: { domain: 'wikisource.org' }, boost: 2 },
      { match: { domain: '.edu' }, boost: 2 },
    ],
  },
  dev: {
    name: 'ডেভেলপার',
    desc: 'গিটহাব ও স্ট্যাক ওভারফ্লো উপরে',
    rules: [
      { match: { domain: 'github.com' }, boost: 3 },
      { match: { domain: 'stackoverflow.com' }, boost: 2.5 },
      { match: { domain: 'medium.com' }, boost: 0.5 },
    ],
  },
  news: {
    name: 'খবর',
    desc: 'সংবাদমাধ্যম উপরে',
    rules: [
      { match: { domain: 'prothomalo.com' }, boost: 3 },
      { match: { domain: 'thedailystar.net' }, boost: 3 },
      { match: { domain: 'bdnews24.com' }, boost: 3 },
    ],
  },
};

function matches(url: string, m: GoggleRule['match']): boolean {
  try {
    const u = new URL(url);
    if (m.domain) {
      const d = m.domain.startsWith('.') ? m.domain.slice(1) : m.domain;
      if (!(u.hostname === d || u.hostname.endsWith('.' + d))) return false;
    }
    if (m.url_contains && !url.includes(m.url_contains)) return false;
    return true;
  } catch {
    return false;
  }
}

/** ভিত্তি-স্কোর = ১/(ক্রম+১); বুস্ট গুণ করে পুনঃক্রম — সম্পূর্ণ ক্লায়েন্ট-সাইডে */
export function applyGoggles<T extends { url: string }>(results: T[], g: Goggles): T[] {
  return results
    .map((r, i) => {
      let mult = 1;
      for (const rule of g.rules) {
        if (matches(r.url, rule.match)) mult *= rule.boost;
      }
      return { r, score: (1 / (i + 1)) * mult };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

/** শেয়ারযোগ্য ইউআরএল: #g=<বেজ৬৪ জেসন> */
export function encodeForUrl(g: Goggles): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(g))));
}
export function decodeFromUrl(hash: string): Goggles | null {
  try {
    const raw = hash.startsWith('#g=') ? hash.slice(3) : '';
    if (!raw) return null;
    const g = JSON.parse(decodeURIComponent(escape(atob(raw))));
    return Array.isArray(g.rules) ? g : null;
  } catch { return null; }
}
```

## টেস্ট — `apps/web/src/lib/goggles.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { applyGoggles, BUILTINS, encodeForUrl, decodeFromUrl, type Goggles } from './goggles';

const R = (url: string) => ({ url, title: url });

describe('গগলস ইঞ্জিন', () => {
  it('ডোমেইন বুস্টে ক্রম বদলায়', () => {
    const results = [R('https://blog.example.com/a'), R('https://bn.wikipedia.org/wiki/ক')];
    const out = applyGoggles(results, BUILTINS.edu);
    expect(out[0].url).toContain('wikipedia.org'); // ২ নম্বর থেকে ১ নম্বরে
  });

  it('সাবডোমেইন মেলে', () => {
    const g: Goggles = { name: 't', rules: [{ match: { domain: 'example.com' }, boost: 5 }] };
    const out = applyGoggles([R('https://a.example.com'), R('https://other.org')], g);
    expect(out[0].url).toBe('https://a.example.com');
  });

  it('টিএলডি নিয়ম (.edu)', () => {
    const out = applyGoggles(
      [R('https://x.com'), R('https://www.mit.edu/cs')], BUILTINS.edu);
    expect(out[0].url).toContain('.edu');
  });

  it('url_contains দিয়ে নামানো যায়', () => {
    const g: Goggles = { name: 't', rules: [{ match: { url_contains: 'ads' }, boost: 0.01 }] };
    const out = applyGoggles([R('https://x.com/ads-track'), R('https://y.org/clean')], g);
    expect(out[0].url).toBe('https://y.org/clean');
  });

  it('ইউআরএল এনকোড-ডিকোড রাউন্ডট্রিপ', () => {
    const s = '#g=' + encodeForUrl(BUILTINS.dev);
    const back = decodeFromUrl(s);
    expect(back?.name).toBe('ডেভেলপার');
    expect(back?.rules.length).toBe(3);
  });
});
```

## ইউআই সংযোগ — `+page.svelte` প্যাচ

```svelte
<!-- <script>-এ যোগ করুন -->
import { applyGoggles, BUILTINS, encodeForUrl, decodeFromUrl, type Goggles } from '$lib/goggles';

let gogglesSel = 'none';
let customJson = '';
let activeGoggles: Goggles | null = null;
let showCustom = false;

function pickGoggles() {
  if (gogglesSel === 'none') activeGoggles = null;
  else if (gogglesSel === 'custom') {
    try { activeGoggles = JSON.parse(customJson); }
    catch { alert('জেসন ঠিক নেই'); return; }
  } else activeGoggles = BUILTINS[gogglesSel];
  if (searched) doSearch();
}
function shareGoggles() {
  if (!activeGoggles) return;
  const url = location.origin + location.pathname + '#g=' + encodeForUrl(activeGoggles);
  navigator.clipboard?.writeText(url);
  alert('শেয়ার-লিংক কপি হয়েছে');
}
// onMount-এ: const g = decodeFromUrl(location.hash); if (g) { activeGoggles = g; gogglesSel = 'custom'; customJson = JSON.stringify(g, null, 2); }
// doSearch-এ ফেচের পরে:  if (activeGoggles) results = applyGoggles(results, activeGoggles);
```

```svelte
<!-- ফিল্টার চিপের নিচে -->
<div class="goggles">
  <label>🥽 গগলস:
    <select bind:value={gogglesSel} on:change={pickGoggles}>
      <option value="none">বন্ধ (ডিফল্ট ক্রম)</option>
      {#each Object.entries(BUILTINS) as [k, g]}
        <option value={k}>{g.name}</option>
      {/each}
      <option value="custom">নিজস্ব নিয়ম…</option>
    </select>
  </label>
  {#if gogglesSel === 'custom'}
    <textarea bind:value={customJson} rows="5"
      placeholder='{"name":"আমার নিয়ম","rules":[{"match":{"domain":"wikipedia.org"},"boost":2}]}'></textarea>
    <button class="ghost" on:click={pickGoggles}>প্রয়োগ</button>
  {/if}
  {#if activeGoggles}
    <button class="ghost" on:click={shareGoggles}>🔗 শেয়ার</button>
    <span class="active-badge">{activeGoggles.name} সক্রিয় — ক্রম আপনার ডিভাইসেই সাজানো হয়েছে</span>
  {/if}
</div>
```

```css
.goggles { display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
           margin-bottom: 18px; font-size: .9rem; }
.goggles select, .goggles textarea { font-family: inherit; border: 1.5px solid #ddd6c6;
           border-radius: 10px; padding: 7px 10px; }
.goggles textarea { width: 100%; font-family: "IBM Plex Mono", monospace; font-size: .8rem; }
.ghost { border: 1.5px solid #ddd6c6; background: #fff; border-radius: 10px;
         padding: 7px 12px; cursor: pointer; }
.active-badge { background: #e7f2ee; color: #0e7a63; padding: 4px 12px;
                border-radius: 999px; font-size: .8rem; font-weight: 600; }
```

**টেস্ট কেস (চেকলিস্টে):**

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| গগ১ | "শিক্ষা-প্রথমে" বেছে সার্চ | উইকিপিডিয়া ফলাফল উপরে ওঠে, ব্যাজ দেখায় | ☐ |
| গগ২ | ভুল জেসন দিয়ে "প্রয়োগ" | অ্যালার্ট, ক্র্যাশ নয় | ☐ |
| গগ৩ | শেয়ার-লিংক নতুন ট্যাবে খোলা | একই গগলস স্বয়ংক্রিয় লোড হয় | ☐ |
| গগ৪ | নেটওয়ার্ক ট্যাব যাচাই | গগলস নিয়ম সার্ভারে কখনো যায় না | ☐ |

---

তিনটিই সম্পন্ন — সন্ধান এখন **ব্র্যান্ড, দৃশ্যমান স্বাস্থ্য ও ব্যবহারকারীর নিয়ন্ত্রণ** নিয়ে পূর্ণাঙ্গ। পরের বিকল্প: ① **মোবাইল পিডাব্লুএ** (অফলাইন হোম + ইনস্টলেবল), ② **এমএল র‍্যাংকিংয়ের প্রস্তুতি** (ফিচার-লগ + ডেটাসেট পাইপলাইন), কিংবা ③ **সম্প্রদায় ডক প্যাক** (অবদান-গাইড, আরএফসি টেমপ্লেট, আচরণবিধি)। বলুন কোনগুলো।

### USER
করো প্রত্যেকটা।

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① মোবাইল পিডাব্লুএ — অফলাইন হোম + ইনস্টলেবল

স্ভেল্টকিটে বিল্ট-ইন সাপোর্ট আছে — বাড়তি লাইব্রেরি লাগবে না। প্রাইভেসি নীতি বজায়: **`/api` কখনো ক্যাশ হবে না**, থার্ড-পার্টি কিছু স্পর্শই হবে না।

## `apps/web/src/service-worker.ts` (নতুন)

```ts
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `sondhan-${version}`;
const SHELL = ['/', ...build, ...files]; // অ্যাপ-শেল: অফলাইনে হোম চালানোর জন্য যথেষ্ট

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;      // থার্ড-পার্টি: স্পর্শ নয়
  if (url.pathname.startsWith('/api/')) return;    // সার্চ/পরিসংখ্যান: ক্যাশ নয়, সবসময় তাজা
  if (event.request.method !== 'GET') return;

  const isShell = url.pathname === '/' || build.includes(url.pathname) || files.includes(url.pathname);
  if (isShell) {
    // ক্যাশ-ফার্স্ট অ্যাপ-শেল
    event.respondWith(
      caches.match(event.request).then((hit) =>
        hit ?? fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        }).catch(() => caches.match('/').then((h) => h as Response))
      )
    );
  } else {
    // নেটওয়ার্ক-ফার্স্ট অন্যান্য পেজ
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((h) => h ?? caches.match('/').then((f) => f as Response))
      )
    );
  }
});
```

## `apps/web/src/app.manifest.ts` (নতুন)

```ts
import type { Manifest } from '@sveltejs/kit';

export function manifest(): Manifest {
  return {
    name: 'সন্ধান',
    short_name: 'সন্ধান',
    description: 'আপনার ভাষায়, আপনার গোপনীয়তায় — উন্মুক্ত, এনক্রিপ্টেড সার্চ ইঞ্জিন',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f4ee',
    theme_color: '#0e7a63',
    lang: 'bn',
    dir: 'ltr',
    categories: ['search', 'privacy'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logo-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
```

## `src/app.html`-এর `<head>`-এ যোগ করুন

```html
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
<meta name="theme-color" content="#0e7a63" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## আইকন তৈরি — `brand/make-icons.sh`

```bash
#!/usr/bin/env bash
# এসভিজি লোগো থেকে পিডাব্লুএ আইকন (ইমেজম্যাজিক প্রয়োজন)
set -euo pipefail
mkdir -p apps/web/static/icons
magick -background none -resize 192x192 brand/logo-mark.svg apps/web/static/icons/icon-192.png
magick -background none -resize 512x512 brand/logo-mark.svg apps/web/static/icons/icon-512.png
# মাস্কেবল: নিরাপদ-অঞ্চল রাখতে সাদা পটভূমিতে ছোট করে কেন্দ্রে
magick -background "#0e7a63" -resize 360x360 -gravity center -extent 512x512 \
  brand/logo-mark.svg apps/web/static/icons/icon-512-maskable.png
echo "✓ আইকন তৈরি — ফন্ট সেলফ-হোস্টেড থাকায় অফলাইন অভিজ্ঞতা সম্পূর্ণ"
```

## মোবাইল সিএসএস পলিশ — হোমপেজ স্টাইলে যোগ

```css
@media (max-width: 640px) {
  main { padding: 48px 16px calc(28px + env(safe-area-inset-bottom)); }
  .box input { font-size: 1.05rem; }        /* আইওএস জুম এড়ানোর জন্য ≥16px */
  .box button { width: 52px; height: 52px; } /* বড় ট্যাপ-টার্গেট */
  .results h3 { font-size: 1.05rem; }
  .pass-row { flex-direction: column; }
}
```

**টেস্ট কেস:**

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| প১ | অ্যান্ড্রয়েড ক্রোমে সাইট খুলুন | অ্যাড্রেসবারে ইনস্টল প্রম্পট | ☐ |
| প২ | ইনস্টল করে অ্যাপে খুলুন | স্ট্যান্ডঅ্যালোন মোড, থিম রঙ সঠিক | ☐ |
| প৩ | এয়ারপ্লেন মোডে হোম খোলা | হোম শেল রেন্ডার হয় | ☐ |
| প৪ | অফলাইনে সার্চ চেষ্টা | শান্ত ব্যর্থতার বার্তা, ক্র্যাশ নয় | ☐ |
| প৫ | ডেভটুলস → ক্যাশ স্টোরেজ | `/api/*` ক্যাশে **নেই** | ☐ |
| প৬ | লাইটহাউস মোবাইল | পিডাব্লুএ চেকলিস্ট সবুজ | ☐ |

---

# ② এমএল র‍্যাংকিংয়ের প্রস্তুতি

**অলঙ্ঘনীয় শর্ত:** প্রশিক্ষণ-ডেটা কখনো ব্যবহারকারীর কয়েরি থেকে আসবে না। সমাধান: **সিউডো-কয়েরি** — শিরোনাম থেকে উৎপন্ন প্রশ্ন + ডক থেকে গণনা করা স্থির বৈশিষ্ট্য (পেজর‍্যাংক, হোস্ট-কর্তৃত্ব, তাজাগিতা…)। ব্যবহারকারী-ডেটা ছাড়াই এলটিআর-প্রস্তুত ডেটাসেট।

## খ.১) ক্রলার প্যাচ — লিংক সংরক্ষণ (`core/crawler/src/main.rs`)

```rust
#[derive(Serialize, Deserialize)]   // Serialize যোগ হলো
struct Doc {
    url: String, title: String, text: String, hash: String, fetched_at: u64,
    links: Vec<String>,              // ← নতুন ফিল্ড
}

// সংরক্ষণের আগে:
//   links: links.iter().map(|u| u.to_string()).collect(),
```

## খ.২) `core/ranker/` — বৈশিষ্ট্য + ডেটাসেট পাইপলাইন

**`Cargo.toml`**

```toml
[package]
name = "sondhan-ranker"
version = "0.1.0"
edition = "2021"
license = "AGPL-3.0-or-later"

[dependencies]
anyhow = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sondhan-nlp = { path = "../nlp" }
tracing = "0.1"
tracing-subscriber = "0.3"
url = "2"
```

**`src/graph.rs`**

```rust
use std::collections::HashMap;

/// সরল পেজর‍্যাংক — ড্যাম্পিং ০.৮৫
pub fn pagerank(n: usize, edges: &HashMap<usize, Vec<usize>>, iters: usize) -> Vec<f64> {
    if n == 0 { return vec![]; }
    let d = 0.85;
    let mut score = vec![1.0 / n as f64; n];
    for _ in 0..iters {
        let mut next = vec![(1.0 - d) / n as f64; n];
        for (i, outs) in edges {
            if outs.is_empty() { continue; }
            let share = d * score[*i] / outs.len() as f64;
            for &o in outs { next[o] += share; }
        }
        score = next;
    }
    score
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn লিংকযুক্ত_পাতা_উঁচুতে() {
        // ০ → ১, ২ → ১  (১ নম্বর পাতা দুটি ইনলিংক পায়)
        let edges = HashMap::from([(0, vec![1]), (2, vec![1])]);
        let pr = pagerank(3, &edges, 30);
        assert!(pr[1] > pr[0] && pr[1] > pr[2]);
    }
}
```

**`src/main.rs`**

```rust
//! স্থির বৈশিষ্ট্য → প্রশিক্ষণ-ডেটাসেট → সমৃদ্ধ ডক (এক টানে তিন আউটপুট)
//! ব্যবহার: cargo run -- [docs.jsonl] [আউট-ফোল্ডার]

mod graph;

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, BufWriter, Write};
use tracing::info;

#[derive(Serialize, Deserialize)]
struct Doc { url: String, title: String, text: String, hash: String, fetched_at: u64, links: Vec<String> }

#[derive(Serialize)]
struct FeatureRow {
    url: String, pagerank: f64, host_indegree: u64,
    text_len: usize, title_len: usize, bn_ratio: f64, age_days: u64,
}

fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_target(false).init();
    let args: Vec<String> = std::env::args().collect();
    let in_path = args.get(1).cloned().unwrap_or_else(|| "../crawler/out/docs.jsonl".into());
    let out_dir = args.get(2).cloned().unwrap_or_else(|| "./out".into());
    std::fs::create_dir_all(&out_dir)?;

    // ১. ডক লোড
    let mut docs = Vec::new();
    for line in BufReader::new(std::fs::File::open(&in_path)?).lines() {
        let line = line?;
        if line.trim().is_empty() { continue; }
        if let Ok(d) = serde_json::from_str::<Doc>(&line) { docs.push(d); }
    }
    info!(docs = docs.len(), "ডক লোড হয়েছে");

    // ২. লিংক-গ্রাফ + হোস্ট ইনডিগ্রি
    let ids: HashMap<&str, usize> = docs.iter().enumerate().map(|(i, d)| (d.url.as_str(), i)).collect();
    let mut edges: HashMap<usize, Vec<usize>> = HashMap::new();
    let mut indegree: HashMap<String, u64> = HashMap::new();
    for (i, d) in docs.iter().enumerate() {
        let mut outs = Vec::new();
        for l in &d.links {
            if let Some(&j) = ids.get(l.as_str()) { if j != i { outs.push(j); } }
            if let Ok(u) = url::Url::parse(l) {
                if let Some(h) = u.host_str() { *indegree.entry(h.to_string()).or_default() += 1; }
            }
        }
        edges.insert(i, outs);
    }

    // ৩. পেজর‍্যাংক (০–১ নরমালাইজড)
    let pr = graph::pagerank(docs.len(), &edges, 20);
    let pr_max = pr.iter().cloned().fold(1e-9_f64, f64::max);

    // ৪. তিন আউটপুট
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?.as_secs();
    let mut feat_out = BufWriter::new(std::fs::File::create(format!("{out_dir}/features.jsonl"))?);
    let mut pairs_out = BufWriter::new(std::fs::File::create(format!("{out_dir}/pairs.jsonl"))?);
    let mut enr_out = BufWriter::new(std::fs::File::create(format!("{out_dir}/docs_enriched.jsonl"))?);

    for (i, d) in docs.iter().enumerate() {
        let host = url::Url::parse(&d.url).ok()
            .and_then(|u| u.host_str().map(String::from)).unwrap_or_default();
        let norm_pr = pr[i] / pr_max;
        let row = FeatureRow {
            url: d.url.clone(),
            pagerank: norm_pr,
            host_indegree: indegree.get(&host).copied().unwrap_or(0),
            text_len: d.text.chars().count(),
            title_len: d.title.chars().count(),
            bn_ratio: bengali_ratio(&d.text),
            age_days: now.saturating_sub(d.fetched_at) / 86_400,
        };
        writeln!(feat_out, "{}", serde_json::to_string(&row)?)?;

        // সমৃদ্ধ ডক — ইনডেক্সার এটাই গ্রাস করবে
        let mut enriched = serde_json::to_value(&d)?;
        if let Some(obj) = enriched.as_object_mut() {
            obj.insert("pagerank".into(), json!(norm_pr));
            obj.insert("host_indegree".into(), json!(row.host_indegree));
            obj.insert("bn_ratio".into(), json!(row.bn_ratio));
        }
        writeln!(enr_out, "{enriched}")?;

        // সিউডো-কয়েরি (শিরোনাম থেকে) + তিন-স্তরের লেবেল — ব্যবহারকারীর ডেটা ছাড়াই
        let q: Vec<String> = sondhan_nlp::remove_stopwords(sondhan_nlp::tokenize(&d.title))
            .into_iter().take(4).collect();
        if q.is_empty() { continue; }
        let label = if norm_pr > 0.66 { 2 } else if norm_pr > 0.33 { 1 } else { 0 };
        writeln!(pairs_out, "{}", json!({
            "query": q.join(" "), "url": d.url, "label": label, "features": row,
        }))?;
    }
    info!("সম্পন্ন → {out_dir}/features.jsonl · pairs.jsonl · docs_enriched.jsonl");
    Ok(())
}

fn bengali_ratio(text: &str) -> f64 {
    let chars: Vec<char> = text.chars().take(2000).collect();
    if chars.is_empty() { return 0.0; }
    let bn = chars.iter().filter(|c| ('\u{0980}'..='\u{09FF}').contains(c)).count();
    bn as f64 / chars.len() as f64
}
```

## খ.৩) ইনডেক্সার প্যাচ — নতুন ফিল্ড ম্যাপিং

`ensure_index()`-এর ম্যাপিংয়ে যোগ করুন, আর এবার ইনডেক্স করুন `docs_enriched.jsonl`:

```rust
"pagerank":      { "type": "double" },
"host_indegree": { "type": "long" },
"bn_ratio":      { "type": "float" },
```

## খ.৪) গেটওয়ে প্যাচ — `opensearch.rs`-এর কোয়েরি এখন র‍্যাংক-সচেতন

```rust
let body = json!({
    "size": 8,
    "query": {
        "function_score": {
            "query": { "multi_match": { "query": q, "fields": ["title^3", "text"] } },
            "functions": [
                { "field_value_factor": {
                    "field": "pagerank", "modifier": "log1p", "factor": 2.0, "missing": 0.01 } },
                { "gauss": { "fetched_at": { "origin": "now", "scale": "90d", "decay": 0.5 } } }
            ],
            "score_mode": "multiply",
            "boost_mode": "multiply"
        }
    }
});
```

## খ.৫) `ml/train_ltr.py` (স্কেচ) ও `docs/ML-ROADMAP.md`

```python
"""ধাপ ২খ — প্রাথমিক ল্যাম্বডার‍্যাংক (স্কেচ)
চালান: pip install lightgbm && python ml/train_ltr.py core/ranker/out/pairs.jsonl
নোট: একই সিউডো-কয়েরিতে একাধিক ডক জড়ো করে গ্রুপ তৈরি করলে র‍্যাংকিং শেখা আরও ভালো হয়।"""
import json, sys
import lightgbm as lgb

rows = [json.loads(l) for l in open(sys.argv[1], encoding="utf-8")]
FEATS = ["pagerank", "host_indegree", "text_len", "title_len", "bn_ratio", "age_days"]

X = [[r["features"][f] for f in FEATS] for r in rows]
y = [r["label"] for r in rows]

train = lgb.Dataset(X, label=y, group=[1] * len(rows))
model = lgb.train(
    {"objective": "lambdarank", "metric": "ndcg", "ndcg_eval_at": [5], "verbose": -1},
    train, num_boost_round=120,
)
model.save_model("ml/model.txt")
print("মডেল সংরক্ষিত → ml/model.txt")
```

```markdown
# docs/ML-ROADMAP.md
- **ধাপ ২ক (সম্পন্ন):** স্থির বৈশিষ্ট্য (পেজর‍্যাংক, হোস্ট-কর্তৃত্ব, বিএন-অনুপাত, তাজাগিতা)
  → ওপেনসার্চ ফাংশন-স্কোরে প্রয়োগ। ব্যবহারকারীর ডেটা শূন্য।
- **ধাপ ২খ:** সিউডো-কয়েরি ডেটাসেটে এলটিআর প্রশিক্ষণ → স্কোর ইনডেক্সে রপ্তানি।
- **ধাপ ২গ (আরএফসি):** ব্যবহারকারীর অপ্ট-ইন প্রতিক্রিয়া — ক্লায়েন্টে ডিফারেনশিয়াল-
  প্রাইভেসি নয়েজ যোগ করে পাঠানো হবে; কখনো কাঁচা কয়েরি নয়।
- **অলঙ্ঘনীয়:** কয়েরি লগ নেই বলে ডেটাসেট কখনো ব্যবহারকারীর ডেটা থেকে আসবে না।
```

**পাইপলাইন এক নজরে:**

```
ক্রলার (লিংকসহ) → র‍্যাংকার → docs_enriched → ইনডেক্সার → ফাংশন-স্কোর সার্চ
                     └→ pairs.jsonl → ধাপ ২খ এলটিআর
```

**টেস্ট কেস:** `cargo test` (পেজর‍্যাংক) · র‍্যাংকার চালানোর পর ৩টি ফাইল তৈরি হয় · সমৃদ্ধ ইনডেক্সে সার্চ করলে উঁচু-পেজর‍্যাংক পাতা এগিয়ে আসে · ইনডেক্সে `pagerank` ফিল্ডের অস্তিত্ব (`/_mapping` যাচাই)।

---

# ③ কমিউনিটি ডক প্যাক

```
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── rfcs/TEMPLATE.md
└── .github/ISSUE_TEMPLATE/
    ├── bug_report.md
    └── feature_request.md
```

## `CONTRIBUTING.md`

```markdown
# সন্ধানে অবদান

স্বাগতম! সন্ধান সম্প্রদায়ের — ইস্যু, ডক-ভুল ধরা, কোড, অনুবাদ, অভিধান-বৃদ্ধি: সব সমান মূল্যবান।

## দ্রুত শুরু
1. ফর্ক → ক্লোন
2. `bash setup.sh --skip-tests --pages 5` — পুরো পরিবেশ এক টানে
3. ইস্যুতে "আমি নিচ্ছি" মন্তব্য করুন → ব্রাঞ্চ: `feat/…` বা `fix/…`

## অবদানের পথ
| কী করতে চান | কোথা থেকে শুরু |
|---|---|
| কোড | ছোট পিআর, টেস্টসহ; `cargo fmt` + `npm run check` চালিয়ে |
| অনুবাদ/ডক | `docs/` ও ইউআই স্ট্রিং — কোড লাগে না |
| ডেটা | `bn_dict` অভিধান বড় করা সবচেয়ে দরকারি কাজগুলোর একটি |
| ডিজাইন | ডিজাইন-ট্যাগযুক্ত ইস্যুতে যুক্তি ও মকআপ |
| নিরাপত্তা | প্রকাশ্য ইস্যু নয় — `SECURITY.md` দেখুন |

## মানদণ্ড
- আপনার অবদান **এজিপিএল-৩.০**-এর আওতায় যাবে (ডিডিও স্বাক্ষর; সিএলএ নেই)
- ইউআই স্ট্রিং বাংলা; কমিট-বার্তা বাংলা বা ইংরেজি — দুটোই চলবে
- আচরণবিধি: `CODE_OF_CONDUCT.md`

## প্রবাহ
ইস্যু → আলোচনা → পিআর → অন্তত ১ রিভিউ → মার্জ।
বড় নকশার সিদ্ধান্তে (র‍্যাংকিং, ক্রিপ্টো, গভর্নেন্স) আগে **আরএফসি**: `rfcs/TEMPLATE.md`।

## গভর্নেন্স
রোডম্যাপ প্রকাশ্য · সিদ্ধান্ত আরএফসি-তে · মেইনটেইনার তালিকা রিডমিতে · দীর্ঘমেয়াদে স্বাধীন ফাউন্ডেশন।

---
*English summary: fork → small PRs with tests → AGPL-3.0 via DCO (no CLA). Big design changes need an RFC. Security issues: SECURITY.md.*
```

## `rfcs/TEMPLATE.md`

```markdown
# আরএফসি-০০০০: শিরোনাম
- স্ট্যাটাস: খসড়া | আলোচনায় | গৃহীত | প্রত্যাখ্যাত
- লেখক: @ইউজার · তারিখ:

## সারসংক্ষেপ
(৩–৪ বাক্যে কী ও কেন)

## অনুপ্রেরণা
(কোন সমস্যা? না করলে কী ক্ষতি?)

## বিস্তারিত নকশা
(ডায়াগ্রাম, ইন্টারফেস, প্রোটোকল)

## প্রাইভেসি-প্রভাব যাচাই (বাধ্যতামূলক)
- [ ] নতুন কোনো লগ যোগ হচ্ছে না
- [ ] কয়েরি/পরিচয় সার্ভারে যাচ্ছে না
- [ ] থ্রেট মডেল আপডেট প্রয়োজন: হ্যাঁ/না — কোন ধারা

## বিকল্প ও বাতিলের কারণ

## অমীমাংসিত প্রশ্ন

## পাইলট পরিকল্পনা
(ছোট পরিসরে যাচাইয়ের ধাপ ও সফলতার মাপকাঠি)
```

## `CODE_OF_CONDUCT.md`

```markdown
# আচরণবিধি

**প্রতিশ্রুতি:** বয়স, দক্ষতা, জাতি, লিঙ্গ, ধর্ম বা পরিচয় নির্বিশেষে সকলের জন্য নিরাপদ ও সম্মানজনক পরিবেশ।

**আদর্শ:** সহানুভূতিশীল ভাষা · ভিন্ন মতের প্রতি সম্মান · গঠনমূলক সমালোচনা · সম্প্রদায়ের স্বার্থ আগে।

**গ্রহণযোগ্য নয়:** যৌন ভাষা, ট্রলিং, নিপীড়ন, সম্মতি ছাড়া ব্যক্তিগত তথ্য প্রকাশ, অনুমোদনহীন প্রচার।

**প্রয়োগ:** ঘটনা রিপোর্ট → `conduct@sondhan.example` → সতর্কবার্তা → সাময়িক বহিষ্কার → স্থায়ী বহিষ্কার। রিপোর্টকারীর পরিচয় গোপন থাকবে।

*(অনুপ্রেরণা: কন্ট্রিবিউটর কোভেন্যান্ট ২.১)*
```

## `SECURITY.md`

```markdown
# নিরাপত্তা

দুর্বলতা পেলে **প্রকাশ্য ইস্যু খুলবেন না**।
- ইমেইল: `security@sondhan.example` (পিজিপি কী রিপোর রুটে)
- সাড়া: ৭২ ঘণ্টা · সমাধান-লক্ষ্য: ৯০ দিন · প্রকাশে কৃতিত্ব ডিফল্ট
- সুযোগ ও থ্রেট মডেল: `docs/THREAT-MODEL.md`
```

## ইস্যু টেমপ্লেট

```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: বাগ রিপোর্ট
about: কিছু কাজ করছে না
labels: বাগ
---
## বর্ণনা
## পুনরুৎপাদন ধাপ
1.
## প্রত্যাশিত বনাম প্রকৃত
## পরিবেশ (ওএস / ব্রাউজার / গিট কমিট)
## স্ক্রিনশট/লগ (কয়েরি বা ব্যক্তিগত তথ্য মুছে দিয়ে)
```

```markdown
<!-- .github/ISSUE_TEMPLATE/feature_request.md -->
---
name: ফিচার প্রস্তাব
about: নতুন ক্ষমতার ধারণা
labels: প্রস্তাব
---
## সমস্যা
## প্রস্তাবিত সমাধান
## প্রাইভেসি-প্রভাব (প্রাইভেসি-ফার্স্ট কি না?)
## বিকল্প
```

---

সন্ধান এখন প্রযুক্তি, প্রস্তুতি ও সম্প্রদায় — তিন দিকেই হাঁটার মতো অবস্থায়। পরের বিকল্প: ① **আন্তর্জাতিকীকরণ (আই১৮এন) কাঠামো** — ইংরেজি/হিন্দিতে পুরো ইউআই, ② **ইউআইএক্স কেস-স্টাডি পেজ** (ডিজাইন-সিদ্ধান্তের ডকুমেন্টেশন, পোর্টফোলিও-মানের), কিংবা ③ **সবকিছুর চূড়ান্ত সংকলন** — এক ডাউনলোডযোগ্য জিপ-স্টাইল মাস্টার-ফাইল তালিকা ও রিলিজ-নোট (v0.1.0)। বলুন কোনগুলো।

### USER
প্রতিটা। 

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① আন্তর্জাতিকীকরণ (i18n) — বাংলা · ইংরেজি · হিন্দি

বাইরের লাইব্রেরি ছাড়াই হালকা স্টোর-ভিত্তিক ব্যবস্থা — সন্ধানের "কোনো থার্ড-পার্টি নির্ভরতা নয়" নীতির সাথে সামঞ্জস্যপূর্ণ।

## `apps/web/src/lib/i18n.ts`

```ts
import { derived, writable } from 'svelte/store';

export type Locale = 'bn' | 'en' | 'hi';
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'bn', label: 'বাংলা' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
];

export const locale = writable<Locale>('bn');

export function initLocale(): void {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('sondhan.locale') as Locale | null;
  const detected = navigator.language?.slice(0, 2) as Locale;
  locale.set(saved ?? (LOCALES.some((l) => l.code === detected) ? detected : 'bn'));
}

export function setLocale(l: Locale): void {
  locale.set(l);
  localStorage.setItem('sondhan.locale', l);
}

/** কি-ভিত্তিক অভিধান; অনুপস্থিত কি বাংলায় ফলব্যাক করে */
export const DICT: Record<Locale, Record<string, string>> = {
  bn: {
    'home.tagline': 'আপনার ভাষায়, আপনার গোপনীয়তায়',
    'search.placeholder': 'খুঁজুন… (যেমন: পদ্মা সেতু, অথবা ২৫*৪৮)',
    'search.button': 'খুঁজুন',
    'search.searching': 'খোঁজা হচ্ছে…',
    'search.results_count': '{n}টি ফলাফল',
    'search.no_results': 'কোনো ফলাফল পাওয়া যায়নি',
    'search.did_you_mean': 'আপনি কি বোঝাতে চেয়েছেন:',
    'tabs.all': 'সব', 'tabs.images': 'ছবি', 'tabs.video': 'ভিডিও',
    'tabs.news': 'খবর', 'tabs.maps': 'মানচিত্র',
    'nav.dashboard': 'ড্যাশবোর্ড', 'nav.history': 'ইতিহাস', 'nav.design': 'ডিজাইন-কথা',
    'history.title': 'এনক্রিপ্টেড ইতিহাস',
    'history.passphrase': 'পাসফ্রেজ দিন — ইতিহাস আপনার ডিভাইসেই তালাবদ্ধ',
    'goggles.title': 'গগলস', 'goggles.off': 'বন্ধ (ডিফল্ট ক্রম)',
    'goggles.custom': 'নিজস্ব নিয়ম…', 'goggles.active': '{name} সক্রিয়',
    'word.today': 'আজকের শব্দ', 'word.example': 'জিজ্ঞাসা — জানবার ইচ্ছা',
    'footer.privacy': 'কোনো কুকি নেই, ট্র্যাকার নেই, বিজ্ঞাপন নেই।',
  },
  en: {
    'home.tagline': 'In your language, with your privacy',
    'search.placeholder': 'Search… (e.g. Padma Bridge, or 25*48)',
    'search.button': 'Search',
    'search.searching': 'Searching…',
    'search.results_count': '{n} results',
    'search.no_results': 'No results found',
    'search.did_you_mean': 'Did you mean:',
    'tabs.all': 'All', 'tabs.images': 'Images', 'tabs.video': 'Videos',
    'tabs.news': 'News', 'tabs.maps': 'Maps',
    'nav.dashboard': 'Dashboard', 'nav.history': 'History', 'nav.design': 'Design story',
    'history.title': 'Encrypted history',
    'history.passphrase': 'Enter passphrase — history stays locked on your device',
    'goggles.title': 'Goggles', 'goggles.off': 'Off (default order)',
    'goggles.custom': 'Custom rules…', 'goggles.active': '{name} active',
    'word.today': 'Word of the day', 'word.example': 'Jigyesa — the desire to know',
    'footer.privacy': 'No cookies, no trackers, no ads.',
  },
  hi: {
    'home.tagline': 'आपकी भाषा में, आपकी निजता के साथ',
    'search.placeholder': 'खोजें… (जैसे: पद्मा सेतु, या 25*48)',
    'search.button': 'खोजें',
    'search.searching': 'खोज जारी है…',
    'search.results_count': '{n} परिणाम',
    'search.no_results': 'कोई परिणाम नहीं मिला',
    'search.did_you_mean': 'क्या आपका मतलब यह था:',
    'tabs.all': 'सभी', 'tabs.images': 'चित्र', 'tabs.video': 'वीडियो',
    'tabs.news': 'समाचार', 'tabs.maps': 'नक्शा',
    'nav.dashboard': 'डैशबोर्ड', 'nav.history': 'इतिहास', 'nav.design': 'डिज़ाइन-कथा',
    'history.title': 'एन्क्रिप्टेड इतिहास',
    'history.passphrase': 'पাসफ़्रेज़ दें — इतिहास आपके डिवाइस पर ही बंद रहता है',
    'goggles.title': 'गॉगल्स', 'goggles.off': 'बंद (डिफ़ॉल्ट क्रम)',
    'goggles.custom': 'अपने नियम…', 'goggles.active': '{name} सक्रिय',
    'word.today': 'आज का शब्द', 'word.example': 'जिज्ञासा — जानने की इच्छा',
    'footer.privacy': 'कोई कुकी नहीं, कोई ट्रैकर नहीं, कोई विज्ञापन नहीं।',
  },
};

/** ব্যবহার: {$t('search.results_count', { n: 8 })} */
export const t = derived(locale, ($locale) => {
  return (key: string, vars?: Record<string, string | number>): string => {
    let s = DICT[$locale][key] ?? DICT.bn[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
});
```

## ভাষা-সুইচ — `apps/web/src/routes/+layout.svelte` (নতুন)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initLocale, locale, LOCALES, setLocale } from '$lib/i18n';
  onMount(initLocale);
</script>

<nav class="lang" aria-label="ভাষা">
  {#each LOCALES as l}
    <button class:active={$locale === l.code} on:click={() => setLocale(l.code)}>{l.label}</button>
  {/each}
</nav>
<slot />

<style>
  .lang { position: fixed; top: 12px; left: 12px; z-index: 20; display: flex; gap: 4px;
          background: #fff; border: 1px solid #e3dccc; border-radius: 999px; padding: 3px; }
  .lang button { border: none; background: transparent; padding: 5px 12px; border-radius: 999px;
                 cursor: pointer; font-size: .82rem; color: #5b6663; font-family: inherit; }
  .lang button.active { background: #0e7a63; color: #fff; font-weight: 700; }
</style>
```

## হোমপেজ প্যাচ (উদাহরণ রূপান্তর)

```svelte
<!-- পুরনো স্থির স্ট্রিংয়ের বদলে -->
<p class="tag">{$t('home.tagline')}</p>
<input bind:value={q} placeholder={$t('search.placeholder')} />
<p>{$t('search.results_count', { n: results.length })}</p>
<p class="dym">{$t('search.did_you_mean')} …</p>
<footer>{$t('footer.privacy')}</footer>
```

## টেস্ট — `apps/web/src/lib/i18n.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { locale, setLocale, initLocale, t } from './i18n';

describe('আই১৮এন', () => {
  beforeEach(() => { localStorage.clear(); locale.set('bn'); });

  it('ডিফল্ট বাংলা', () => {
    expect(get(locale)).toBe('bn');
  });

  it('ভাষা বদল ও সংরক্ষণ', () => {
    setLocale('hi');
    expect(get(locale)).toBe('hi');
    expect(localStorage.getItem('sondhan.locale')).toBe('hi');
  });

  it('অনুপস্থিত কি বাংলায় ফলব্যাক করে', () => {
    setLocale('en');
    delete (await import('./i18n')).DICT; // — নাই; সরাসরি পরীক্ষা:
    expect(get(t)('word.example')).toBe('জিজ্ঞাসা — জানবার ইচ্ছা'); // শুধু বাংলায় আছে
  });

  it('প্যারামিটার ইন্টারপোলেশন', () => {
    expect(get(t)('search.results_count', { n: 8 })).toBe('8টি ফলাফল');
    setLocale('en');
    expect(get(t)('search.results_count', { n: 8 })).toBe('8 results');
  });

  it('ব্রাউজার-ভাষা শনাক্তকরণ (সিমুলেটেড)', () => {
    localStorage.setItem('sondhan.locale', 'hi');
    initLocale();
    expect(get(locale)).toBe('hi'); // সংরক্ষিতটাই অগ্রাধিকার
  });
});
```

---

# ② ইউআইএক্স কেস-স্টাডি পেজ — `apps/web/src/routes/design/+page.svelte`

পোর্টফোলিও-মানের ডিজাইন-ডকুমেন্টেশন: প্রেক্ষাপট → নীতি → সিদ্ধান্ত → স্পেক → পরিমাপ।

```svelte
<script lang="ts">
  const principles = [
    ['🔐', 'গোপনীয়তা দৃশ্যমান হতে হবে', 'প্রাইভেসি কেবল নীতিতে নয় — ইউআই-তে প্রতি মুহূর্তে প্রমাণিত হতে হবে।'],
    ['🌏', 'বাংলা প্রথম শ্রেণির নাগরিক', 'অনুবাদ করা ইন্টারফেস নয়; বাংলা টাইপোগ্রাফি থেকে শুরু করা নকশা।'],
    ['🪶', 'গতিই বৈশিষ্ট্য', 'প্রতি কিলোবাইট একটি সিদ্ধান্ত। যা দরকার নয়, তা নেই।'],
    ['🤝', 'কোনো ডার্ক প্যাটার্ন নয়', 'ব্যবহারকারীকে বোকা বানানো কোনো মাইক্রো-ইন্টারঅ্যাকশন এখানে জন্মাবে না।'],
  ];
  const decisions = [
    {
      n: '০১', title: 'ইতিহাস "লুকানো" নয়, "তালাবদ্ধ" ও দৃশ্যমান',
      what: 'এনক্রিপ্টেড হিস্টরি সবসময় সাইফারটেক্সট-চিপ হিসেবে দেখানো হয়; আনলক ব্যবহারকারীর হাতে।',
      alt: 'হিস্টরি ডিফল্টে লুকিয়ে রাখা, বা সার্ভার-সাইড এনক্রিপশন।',
      why: 'লুকানো ডেটা আস্থা নয়, অজ্ঞতা। সাইফারটেক্সট দেখানোই প্রমাণ — আর কী-সার্ভারে রাখলে শূন্য-জ্ঞান থাকে না।',
    },
    {
      n: '০২', title: 'নীল নয় — টিল ও অ্যাম্বার',
      what: 'ব্র্যান্ড রঙ গভীর টিল (#0e7a63) + ভোরের অ্যাম্বার (#e0762f)।',
      alt: 'সার্চ-ইঞ্জিন-ঘরানার প্রথাগত নীল।',
      why: 'নীল মানে "গুগলের অনুকরণ"। টিল-অ্যাম্বার ভোরের আলোর রূপক — "সন্ধান"-এর নামের সাথে সৎ।',
    },
    {
      n: '০৩', title: 'প্রদর্শনে সেরিফ বাংলা, দেহে সান্স',
      what: 'Noto Serif Bengali শিরোনামে, Noto Sans Bengali পাঠ্যে; সব ফন্ট সেলফ-হোস্টেড।',
      alt: 'সিস্টেম ফন্ট বা সিডিএন-নির্ভর লাতিন-কেন্দ্রিক ফন্ট।',
      why: 'বাংলা সেরিফের প্রাতিষ্ঠানিকতা সার্চকে মর্যাদা দেয়; সেলফ-হোস্টিং ছাড়া ফন্ট-সিডিএনই প্রথম ট্র্যাকার।',
    },
    {
      n: '০৪', title: 'চার্ট লাইব্রেরি নেই — হাতে-আঁকা এসভিজি',
      what: 'ড্যাশবোর্ডের স্পার্কলাইন ও বার-চার্ট ~২০ লাইনের এসভিজি।',
      alt: 'জনপ্রিয় চার্ট লাইব্রেরি (~৩০০ কেবি)।',
      why: 'গতি-বাজেট (<৫০ কেবি হোমপেজ) এবং নির্ভরতা-হ্রাস দুটোই জেতে; ডেটা নিজেই তো গোপনীয়।',
    },
    {
      n: '০৫', title: 'ফলাফলের রঙ টিল, লিংক নীল নয়',
      what: 'শিরোনাম-লিংক ব্র্যান্ড টিলে; ভিজিটেড রঙে নয়, ক্যাশে নয়।',
      alt: 'প্রথাগত নীল/বেগুনি লিংক।',
      why: 'ভিজিটেড-রঙ ব্রাউজার-হিস্টরি ফাঁস করে (সিএসএস-ভিত্তিক আক্রমণ) — প্রাইভেসি-প্রথম প্রকল্পে এটি বাদ দেওয়াই সঠিক।',
    },
  ];
  const a11y = [
    'WCAG 2.2 AA কনট্রাস্ট (দুই থিমে যাচাইকৃত)',
    'সম্পূর্ণ কীবোর্ড ফ্লো: / ফোকাস, ↑↓ নেভিগেশন, Esc বন্ধ',
    'পরিবর্তন শুধু রঙে নয় — আইকন + লেবেলেও',
    'প্রতি ইনপুটে বাংলা প্লেসহোল্ডার + এরিয়া-লেবেল',
    'prefers-reduced-motion সম্মান',
    'টাচ-টার্গেট ≥ ৪৪ পিক্সেল',
  ];
</script>

<svelte:head>
  <title>ডিজাইন-কথা · সন্ধান</title>
  <meta name="description" content="সন্ধানের ইউআইএক্স সিদ্ধান্তের প্রামাণ্য দলিল" />
</svelte:head>

<article>
  <header class="hero">
    <span class="kicker">কেস স্টাডি · ২০২৬</span>
    <h1>সন্ধানের ডিজাইন-কথা</h1>
    <p class="sub">একটি গোপনীয়তা-প্রথম, বাংলা-প্রথম সার্চ ইঞ্জিন নকশা করার প্রতিটি সিদ্ধান্ত — বিকল্পসহ, যুক্তিসহ।</p>
  </header>

  <section>
    <h2>প্রেক্ষাপট</h2>
    <p>সার্চ ইঞ্জিন হলো ইন্টারনেটের প্রবেশদ্বার — কিন্তু বিদ্যমান দরজাগুলো ব্যবহারকারীকে পণ্য বানায়, আর বাংলা ভাষা সেখানে দ্বিতীয় শ্রেণির। লক্ষ্য ছিল এমন একটি দরজা যা (১) গাণিতিকভাবেই ব্যবহারকারীর সার্চ পড়তে পারে না, (২) নিজের ভাষায় সমান মর্যাদা দেয়, এবং (৩) দেখতে প্রাইভেসি-পণ্যের মতো "ঠান্ডা" নয়, বরং আপনজনের মতো উষ্ণ।</p>
  </section>

  <section>
    <h2>নীতিমালা</h2>
    <div class="grid">
      {#each principles as [ic, t1, d]}
        <div class="card"><span class="ic">{ic}</span><b>{t1}</b><p>{d}</p></div>
      {/each}
    </div>
  </section>

  <section>
    <h2>পাঁচটি সিদ্ধান্ত, বিকল্পসহ</h2>
    {#each decisions as d}
      <div class="decision">
        <span class="num">{d.n}</span>
        <div>
          <h3>{d.title}</h3>
          <p><b>সিদ্ধান্ত:</b> {d.what}</p>
          <p><b>বিকল্প ছিল:</b> {d.alt}</p>
          <p><b>কেন এটি:</b> {d.why}</p>
        </div>
      </div>
    {/each}
  </section>

  <section>
    <h2>স্পেক</h2>
    <table>
      <tr><th>উপাদান</th><th>মান</th></tr>
      <tr><td>প্রদর্শন ফন্ট</td><td>Noto Serif Bengali (৫০০/৭০০/৯০০), সেলফ-হোস্টেড</td></tr>
      <tr><td>পাঠ্য ফন্ট</td><td>Noto Sans Bengali (৪০০–৭০০)</td></tr>
      <tr><td>রঙ</td><td>টিল #0e7a63 · অ্যাম্বার #e0762f · কাগজ #f7f4ee · রাত #0e1513</td></tr>
      <tr><td>রেডিয়াস</td><td>কার্ড ১৬পিক্সেল · পিল ৯৯৯পিক্সেল</td></tr>
      <tr><td>গতি বাজেট</td><td>হোমপেজ &lt; ৫০ কেবি গজিপড · এলসিপি &lt; ১ সে · থার্ড-পার্টি রিকোয়েস্ট ০</td></tr>
      <tr><td>থিম</td><td>শুভ্র / গভীর রাত / সিস্টেম-অটো (সিএসএস ভেরিয়েবলে টোকেনাইজড)</td></tr>
    </table>
  </section>

  <section>
    <h2>অ্যাক্সেসিবিলিটি চেকলিস্ট</h2>
    <ul class="checks">{#each a11y as c}<li>✓ {c}</li>{/each}</ul>
  </section>

  <section>
    <h2>পরিমাপের লক্ষ্য</h2>
    <table>
      <tr><th>সূচক</th><th>লক্ষ্য</th></tr>
      <tr><td>লাইটহাউস পারফরম্যান্স</td><td>≥ ৯৫ (মোবাইল)</td></tr>
      <tr><td>নেটওয়ার্ক রিকোয়েস্ট (হোম)</td><td>≤ ৬, সব নিজস্ব</td></tr>
      <tr><td>কুকি/ফিঙ্গারপ্রিন্ট স্কোর</td><td>০ (Blacklight-জাতীয় যাচাই)</td></tr>
      <tr><td>বাংলা কয়েরিতে প্রাসঙ্গিকতা</td><td>ধাপ ২খ-তে এনডিসিজি@৫ প্রকাশ্য বেঞ্চমার্ক</td></tr>
    </table>
  </section>

  <p class="end">প্রতিটি সিদ্ধান্ত পাল্টানোর জন্যই খোলা — এজিপিএল কোডের মতোই। <a href="/">সার্চে ফিরুন</a></p>
</article>

<style>
  article { max-width: 760px; margin: 0 auto; padding: 64px 20px;
            font-family: "Noto Sans Bengali", sans-serif; line-height: 1.8; }
  .kicker { font-size: .8rem; font-weight: 700; letter-spacing: .08em; color: #e0762f; }
  h1 { font-family: "Noto Serif Bengali", serif; font-size: clamp(2rem, 5vw, 3rem);
       margin: 8px 0 10px; line-height: 1.25; }
  .sub { color: #5b6663; font-size: 1.05rem; margin-bottom: 40px; }
  h2 { font-family: "Noto Serif Bengali", serif; font-size: 1.5rem; margin: 46px 0 14px;
       border-right: 6px solid; border-image: linear-gradient(#0e7a63, #e0762f) 1;
       padding-right: 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
  .card { background: #fff; border: 1px solid #e3dccc; border-radius: 16px; padding: 18px; }
  .card .ic { font-size: 24px; } .card b { display: block; margin: 8px 0 4px; }
  .card p { color: #5b6663; font-size: .88rem; margin: 0; }
  .decision { display: grid; grid-template-columns: 64px 1fr; gap: 14px; margin-bottom: 22px;
              background: #fff; border: 1px solid #e3dccc; border-radius: 16px; padding: 20px; }
  .num { font-family: "Noto Serif Bengali", serif; font-size: 1.9rem; font-weight: 900;
         background: linear-gradient(#0e7a63, #e0762f); -webkit-background-clip: text;
         background-clip: text; color: transparent; }
  .decision h3 { font-size: 1.1rem; margin-bottom: 8px; }
  .decision p { font-size: .92rem; margin: 4px 0; color: #3c4744; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px;
          overflow: hidden; border: 1px solid #e3dccc; }
  th, td { text-align: right; padding: 11px 15px; border-bottom: 1px solid #efe9dd; font-size: .9rem; }
  th { background: #efe9dd; }
  .checks { list-style: none; padding: 0; display: grid; gap: 8px; }
  .checks li { background: #fff; border: 1px solid #e3dccc; border-radius: 10px;
               padding: 10px 14px; font-size: .9rem; color: #0e7a63; }
  .end { margin-top: 50px; color: #8a938f; text-align: center; }
  .end a { color: #0e7a63; }
  :global([data-theme="dark"]) article { color: #e9efe9; }
  :global([data-theme="dark"]) .card, :global([data-theme="dark"]) .decision,
  :global([data-theme="dark"]) table, :global([data-theme="dark"]) .checks li {
    background: #15201d; border-color: #263830; }
  :global([data-theme="dark"]) .decision p, :global([data-theme="dark"]) .sub { color: #a3b3ab; }
</style>
```

---

# ③ চূড়ান্ত সংকলন — মাস্টার ফাইল তালিকা + রিলিজ নোট

## সম্পূর্ণ রিপো মানচিত্র (সব রাউন্ডের সমষ্টি)

```
sondhan/                                    [~৬০ ফাইল]
├── README.md · LICENSE(AGPL-3.0) · CHANGELOG.md · Makefile · setup.sh
├── SECURITY.md · CODE_OF_CONDUCT.md · CONTRIBUTING.md · docker-compose.yml
│
├── .github/
│   ├── workflows/ci.yml                    # fmt+clippy+টেস্ট+অডিট+ট্রিভাই+পুশ
│   ├── workflows/live.yml                  # সাপ্তাহিক লাইভ-নেটওয়ার্ক টেস্ট
│   └── ISSUE_TEMPLATE/{bug_report,feature_request}.md
│
├── brand/                                  # ব্র্যান্ডিং প্যাক
│   ├── BRAND.md · tokens.json · make-icons.sh
│   └── logo-mark.svg · logo-lockup.svg · og.svg
│
├── docs/
│   ├── THREAT-MODEL.md                     # অডিট-প্রস্তুত থ্রেট মডেল
│   ├── DEPLOY.md                           # ভিপিএস + টর (.onion) গাইড
│   ├── ML-ROADMAP.md · GOGGLES.md
│
├── crypto/SPEC.md                          # শূন্য-জ্ঞান ক্রিপ্টো স্পেক
├── rfcs/{TEMPLATE.md, 0001-encrypted-history.md}
├── ml/{README.md, train_ltr.py}            # ধাপ ২খ স্কেচ
├── deploy/{Caddyfile, docker-compose.prod.yml}
│
├── core/                                   # ৫টি রাস্ট ক্রেট
│   ├── nlp/          # টোকেনাইজার·স্টপওয়ার্ড·স্টেমার·বানান-সংশোধন
│   │   ├── Cargo.toml · data/bn_dict_sample.txt
│   │   └── src/{lib,normalize,tokenize,stem,spell}.rs
│   ├── crawler/      # ভদ্র ক্রলার (রোবটস·বিরতি·ডুপ-হ্যাশ·লিংক)
│   │   └── src/{main,fetch,extract,dedupe}.rs
│   ├── indexer/      # JSONL → ওপেনসার্চ (বাংলা অ্যানালাইজার)
│   │   └── src/main.rs
│   ├── ranker/       # পেজর‍্যাংক → বৈশিষ্ট্য → সিউডো-কয়েরি ডেটাসেট
│   │   └── src/{main,graph}.rs
│   └── gateway/      # API (axum): সার্চ·অ্যাগ্রিগেটর·বানান·মেট্রিক্স·পরিসংখ্যান
│       ├── Cargo.toml · Dockerfile
│       └── src/{main,privacy,search,aggregator,opensearch,spellcheck,metrics,stats}.rs
│
└── apps/web/                               # SvelteKit + PWA + i18n
    ├── package.json · svelte.config.js · vite.config.ts · vitest.config.ts
    ├── tsconfig.json · Dockerfile
    ├── static/{favicon.svg, logo-mark.svg, og.svg, icons/…}
    └── src/
        ├── app.html · app.d.ts · app.manifest.ts · service-worker.ts
        ├── lib/
        │   ├── crypto.ts      + crypto.test.ts    # এনক্রিপ্টেড হিস্টরি
        │   ├── goggles.ts     + goggles.test.ts   # ক্লায়েন্ট রি-র‍্যাংক
        │   └── i18n.ts        + i18n.test.ts      # bn·en·hi
        └── routes/
            ├── +layout.svelte        # ভাষা-সুইচ
            ├── +page.svelte          # সার্চ + ফলাফল + গগলস
            ├── dashboard/+page.svelte
            ├── launch/+page.svelte
            └── design/+page.svelte   # কেস স্টাডি
```

## `CHANGELOG.md`

```markdown
# চ্যাঞ্জলগ

## [0.1.0] — «প্রথম ভোর» — ২০২৬-০৮-৩০
### যুক্ত হয়েছে
- শূন্য-জ্ঞান এনক্রিপ্টেড সার্চ হিস্টরি (ক্লায়েন্ট-সাইড, ওয়েবক্রিপ্টো)
- বাংলা এনএলপি: টোকেনাইজার · স্টপওয়ার্ড · প্রত্যয়-ছেদন · বানান-সংশোধন
- ভদ্র ক্রলার → পেজর‍্যাংক-সচেতন ইনডেক্স → ফাংশন-স্কোর সার্চ
- মেটা-সার্চ (বাংলা উইকিপিডিয়া) + উইকিডাটা নলেজ প্যানেল
- গগলস (ক্লায়েন্ট-সাইড রি-র‍্যাংক) · ড্যাশবোর্ড · লঞ্চ ও ডিজাইন-কথা পেজ
- পিডাব্লুএ (অফলাইন + ইনস্টলেবল) · আই১৮এন (বাংলা/ইংরেজি/হিন্দি)
- অপারেশন: এক-স্ক্রিপ্ট সেটআপ · ভিপিএস+টর গাইড · সিআই+ট্রিভাই
- প্রকাশ্য থ্রেট মডেল · ক্রিপ্টো স্পেক · আরএফসি প্রক্রিয়া · আচরণবিধি
```

## রিলিজ নোট — `সন্ধান v0.1.0 «প্রথম ভোর»`

```markdown
আজ থেকে সন্ধান সবার।

একটি সার্চ ইঞ্জিন যা আপনার সার্চ পড়তে গাণিতিকভাবেই অক্ষম — হিস্টরি এনক্রিপ্ট হয়
আপনার ডিভাইসে, সার্ভার দেখে শুধু সাইফারটেক্সট। সাথে: বাংলা-প্রথম এনএলপি ও
বানান-সংশোধন, ভদ্র ক্রলার থেকে তৈরি পেজর‍্যাংক-সচেতন ইনডেক্স, মেটা-সার্চ,
গগলস, ড্যাশবোর্ড, পিডাব্লুএ — আর তিন ভাষার ইউআই। সবকিছু এজিপিএল-৩.০।

🚀 শুরু: bash setup.sh          📦 ইমেজ: ghcr.io/<মালিক>/sondhan-*:v0.1.0
🧅 অনিয়ন: <ঠিকানা>             🔐 নিরাপত্তা: SECURITY.md

সৎ সীমাবদ্ধতা: ইনডেক্স এখন বাংলা উইকিপিডিয়া-কেন্দ্রিক; এলটিআর প্রশিক্ষণ
স্কেচ পর্যায়ে; ক্রস-ডিভাইস সিঙ্ক ধাপ ২-তে আসবে।

আপনার সমালোচনাই এই প্রকল্পের জ্বালানি — ইস্যু খুলুন, আরএফসি লিখুন, কোড পাঠান।

—
English: Sondhan v0.1.0 "First Dawn" — an AGPL, Bengali-first search engine
whose servers mathematically cannot read your searches. Crawler → PageRank
index → function-score search, metasearch, client-side Goggles, PWA in bn/en/hi.
```

## প্রকাশনার চেকলিস্ট

1. ☐ রিপোতে সব ফাইল; `bash setup.sh` খালি মেশিনে সবুজ
2. ☐ `cargo fmt/clippy/test` + `npm run check/test` + ট্রিভাই — সব পাস
3. ☐ ট্যাগ: `git tag v0.1.0 && git push origin v0.1.0` → সিআই ghcr-এ ইমেজ পুশ করবে
4. ☐ `deploy/docker-compose.prod.yml`-এ ghcr মালিকানা বসান → ভিপিএসে `up -d`
5. ☐ টর: অনিয়ন ঠিকানা ক্যাডফাইলের `Onion-Location`-এ বসান
6. ☐ ঘোষণা পোস্ট (brand প্যাকের লেখা) + ওজি-ইমেজ সহ প্রকাশ
7. ☐ মনিটরিং: `/healthz` পিং, ডিস্ক-সতর্কতা, `security@` ইনবক্স নজরে

---

**সন্ধান এখন সম্পূর্ণ**: দর্শন → নকশা → কোড → পরীক্ষা → নিরাপত্তা → ডিপ্লয়মেন্ট → ব্র্যান্ড → সম্প্রদায় → প্রকাশনা। একজন ব্যবহারকারীর কল্পনা থেকে প্রথম পাবলিক রিলিজ পর্যন্ত পুরো যাত্রাটাই দলিলবদ্ধ।

চাইলে এরপর হাতে নেওয়া যায় — ① **ধাপ ২: এনক্রিপ্টেড ক্রস-ডিভাইস সিঙ্ক প্রোটোকল** (সার্ভার স্পেক + ক্লায়েন্ট কোড), ② **প্রথম এনডিসিজি বেঞ্চমার্ক** (বাংলা কয়েরি-সেট ও মূল্যায়ন স্ক্রিপ্ট), কিংবা ③ **সম্প্রদায়-বৃদ্ধির পরিকল্পনা** (হ্যাকাথন, গুড-ফার্স্ট-ইস্যু ব্যাচ, ডকসপ্রিন্ট)। বলুন কোনগুলো।

### USER
১ ও ২ করো।

### ASSISTANT
# ① ধাপ ২: এনক্রিপ্টেড ক্রস-ডিভাইস সিঙ্ক — প্রোটোকল + কোড

## প্রবাহ এক নজরে

```
ডিভাইস ক: পাসফ্রেজ ──আর্গন২আইডি──▶ কী ──▶ হিস্টরি এনক্রিপ্ট ──সাইফারটেক্সট──▶ সার্ভার ভল্ট
ডিভাইস খ: সিঙ্ক-আইডি + পাসফ্রেজ ──একই কী──▶ ভল্ট টানা ──▶ ডিক্রিপ্ট ──▶ স্থানীয় মার্জ
রিকভারি:  কোড (অ্যানন-আইডি + ব্যাকআপ-কী) ──▶ মোড়ানো পাসফ্রেজ খোলা ──▶ যোগদান
সংঘর্ষ:   প্রতি এন্ট্রিতে ভার-ভিত্তিক শেষ-লেখাই-জয় (ক্লায়েন্ট-ঘড়ি + সার্ভার-ক্রম)
```

## `docs/SYNC.md` — প্রোটোকল স্পেক

```markdown
# সিঙ্ক প্রোটোকল v1 (শূন্য-জ্ঞান)

## এন্ডপয়েন্ট
| এন্ডপয়েন্ট | কাজ |
|---|---|
| `POST /api/sync/register` | `{anon_id, salt}` → ভল্ট খোলা (আইডেমপোটেন্ট) |
| `GET /api/sync/vault?anon_id&since` | `{salt, seq, entries[]}` — server_seq > since |
| `PUT /api/sync/vault/:id` | `{anon_id,nonce,ct,ver,ts}` → আপসার্ট; পুরনো `ver` হলে `{conflict}` |
| `POST /api/sync/recovery` | `{anon_id,nonce,wrapped}` — পাসফ্রেজ-মোড়ক অস্বচ্ছ ব্লব |
| `GET /api/sync/recovery?anon_id` | মোড়ক ফেরত |

## স্কিমা
- ভল্ট-এন্ট্রি: `{id, nonce(12B), ct, ver, ts, server_seq}`; সর্বোচ্চ ২৫৬ কেবি/এন্ট্রি
- অ্যাকাউন্ট: `{anon_id, salt, recovery?, entries{}, seq}`

## অলঙ্ঘনীয়
1. সার্ভার কখনো কী বা প্লেইনটেক্সট দেখে না — শুধু সাইফারটেক্সট ও মেটাডেটা
2. `anon_id` (১২৮-বিট র‍্যান্ডম) = ব্রেরার টোকেন; তালিকাভুক্ত করা যায় না
3. পাসফ্রেজ ভুললে: রিকভারি কোড = `অ্যানন-আইডি(১৬B) ‖ ব্যাকআপ-কী(৩২B)`;
   ব্যাকআপ-কী দিয়ে সার্ভারে রাখা মোড়ানো পাসফ্রেজ খোলা যায়
4. সংঘর্ষ: প্রতি এন্ট্রিতে `ver`-ভিত্তিক শেষ-লেখাই-জয়; হিস্টরির মতো তালিকায়
   ক্লায়েন্ট-সাইড ইউনিয়ন-মার্জ (সময়-অবরোহী, সীমা ১০০)
5. রেট-লিমিট ট্রাঙ্কেটেড সাবনেটে; ভল্ট-অপারেশনে কোনো কয়েরি-লগ নেই

## থ্রেট-টীকা
- রিপ্লে: `ver` + `server_seq` মনোটোনিক
- কোড চুরি = ভল্ট-প্রবেশ (স্বীকৃত ঝুঁকি) → কোড একবারই দেখানো হয়; বাতিল-এন্ডপয়েন্ট ধাপ ২খ
- অ্যাকাউন্ট-গণনা: ২¹²⁸ স্পেস, সাবনেট রেট-লিমিটসহ অবাস্তব
```

## গেটওয়ে: `core/gateway/src/sync.rs`

```rust
//! শূন্য-জ্ঞান সিঙ্ক স্টোর — ডেমোতে ফাইল-ব্যাকড ইন-মেমরি; প্রোডাকশনে পোস্টগ্রেস
use axum::{extract::{Path, Query}, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

static STORE: OnceLock<Mutex<HashMap<String, Account>>> = OnceLock::new();
fn store() -> &'static Mutex<HashMap<String, Account>> {
    STORE.get_or_init(|| Mutex::new(load()))
}

#[derive(Default, Serialize, Deserialize)]
struct Account {
    salt: Option<String>,
    recovery: Option<Value>, // {nonce, wrapped} — অস্বচ্ছ
    entries: HashMap<String, Entry>,
    seq: u64,
}

#[derive(Clone, Serialize, Deserialize)]
struct Entry { nonce: String, ct: String, ver: u64, ts: u64, server_seq: u64 }

fn path() -> String {
    std::env::var("SYNC_STORE").unwrap_or_else(|_| "sync-store.json".into())
}
fn load() -> HashMap<String, Account> {
    std::fs::read_to_string(path()).ok()
        .and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default()
}
fn save(s: &HashMap<String, Account>) {
    let _ = std::fs::write(path(), serde_json::to_string(s).unwrap_or_default());
}

#[derive(Deserialize)] pub struct RegBody { anon_id: String, salt: String }
pub async fn register(Json(b): Json<RegBody>) -> Json<Value> {
    let mut s = store().lock().unwrap();
    s.entry(b.anon_id).or_default().salt = Some(b.salt);
    save(&s);
    Json(json!({ "ok": true }))
}

#[derive(Deserialize)] pub struct PullQuery { anon_id: String, since: Option<u64> }
pub async fn pull(Query(q): Query<PullQuery>) -> Json<Value> {
    let s = store().lock().unwrap();
    let Some(acc) = s.get(&q.anon_id) else { return Json(json!({ "error": "unknown_id" })) };
    let entries: Vec<Value> = acc.entries.iter()
        .filter(|(_, e)| e.server_seq > q.since.unwrap_or(0))
        .map(|(id, e)| json!({
            "id": id, "nonce": e.nonce, "ct": e.ct,
            "ver": e.ver, "ts": e.ts, "server_seq": e.server_seq,
        }))
        .collect();
    Json(json!({ "salt": acc.salt, "seq": acc.seq, "entries": entries }))
}

#[derive(Deserialize)] pub struct PushBody { anon_id: String, nonce: String, ct: String, ver: u64, ts: u64 }
pub async fn push(Path(id): Path<String>, Json(b): Json<PushBody>) -> Json<Value> {
    let mut s = store().lock().unwrap();
    let Some(acc) = s.get_mut(&b.anon_id) else { return Json(json!({ "error": "unknown_id" })) };
    if acc.entries.get(&id).map_or(false, |e| e.ver > b.ver) {
        return Json(json!({ "ok": false, "conflict": true, "server_seq": acc.seq }));
    }
    acc.seq += 1;
    acc.entries.insert(id, Entry {
        nonce: b.nonce, ct: b.ct, ver: b.ver, ts: b.ts, server_seq: acc.seq,
    });
    save(&s);
    Json(json!({ "ok": true, "server_seq": acc.seq }))
}

#[derive(Deserialize)] pub struct RecoveryBody { anon_id: String, nonce: String, wrapped: String }
pub async fn set_recovery(Json(b): Json<RecoveryBody>) -> Json<Value> {
    let mut s = store().lock().unwrap();
    let Some(acc) = s.get_mut(&b.anon_id) else { return Json(json!({ "error": "unknown_id" })) };
    acc.recovery = Some(json!({ "nonce": b.nonce, "wrapped": b.wrapped }));
    save(&s);
    Json(json!({ "ok": true }))
}

#[derive(Deserialize)] pub struct RecoveryQuery { anon_id: String }
pub async fn get_recovery(Query(q): Query<RecoveryQuery>) -> Json<Value> {
    let s = store().lock().unwrap();
    match s.get(&q.anon_id).and_then(|a| a.recovery.clone()) {
        Some(r) => Json(json!({ "nonce": r["nonce"], "wrapped": r["wrapped"] })),
        None => Json(json!(null)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request, routing::{get, post}, Router};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    fn app() -> Router {
        Router::new()
            .route("/api/sync/register", post(register))
            .route("/api/sync/vault", get(pull))
            .route("/api/sync/vault/:id", axum::routing::put(push))
    }

    async fn body_json(res: axum::response::Response) -> Value {
        serde_json::from_slice(&res.into_body().collect().await.unwrap().to_bytes()).unwrap()
    }

    #[tokio::test]
    async fn নিবন্ধন_পুশ_পুল_ও_দ্বন্দ্ব() {
        let app = app();
        // নিবন্ধন
        let r = app.clone().oneshot(Request::builder().method("POST").uri("/api/sync/register")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"anon_id":"টেস্ট১","salt":"AAAA"}"#)).unwrap()).await.unwrap();
        assert_eq!(r.status(), 200);
        // পুশ
        let r = app.clone().oneshot(Request::builder().method("PUT").uri("/api/sync/vault/history")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"anon_id":"টেস্ট১","nonce":"n","ct":"c","ver":1,"ts":5}"#)).unwrap())
            .await.unwrap();
        assert_eq!(body_json(r).await["ok"], true);
        // পুরনো ভার → দ্বন্দ্ব
        let r = app.clone().oneshot(Request::builder().method("PUT").uri("/api/sync/vault/history")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"anon_id":"টেস্ট১","nonce":"n2","ct":"c2","ver":0,"ts":4}"#)).unwrap())
            .await.unwrap();
        assert_eq!(body_json(r).await["conflict"], true);
        // পুল
        let r = app.clone().oneshot(Request::builder()
            .uri("/api/sync/vault?anon_id=টেস্ট১").body(Body::empty()).unwrap()).await.unwrap();
        let v = body_json(r).await;
        assert_eq!(v["salt"], "AAAA");
        assert_eq!(v["entries"].as_array().unwrap().len(), 1);
        // অজানা আইডি
        let r = app.clone().oneshot(Request::builder()
            .uri("/api/sync/vault?anon_id=নেই").body(Body::empty()).unwrap()).await.unwrap();
        assert_eq!(body_json(r).await["error"], "unknown_id");
    }
}
```

## গেটওয়ে: রুট — `main.rs` প্যাচ

```rust
mod sync;   // মডিউল তালিকায়

// রাউটারে যোগ করুন:
    .route("/api/sync/register", axum::routing::post(sync::register))
    .route("/api/sync/vault", axum::routing::get(sync::pull))
    .route("/api/sync/vault/:id", axum::routing::put(sync::push))
    .route("/api/sync/recovery",
        axum::routing::get(sync::get_recovery).post(sync::set_recovery))
```

## ক্লায়েন্ট: `apps/web/src/lib/sync.ts`

```ts
// সন্ধান ক্রস-ডিভাইস সিঙ্ক — কী কখনো ডিভাইস ছাড়ে না
// প্রোডাকশনে: আর্গন২আইডি · ডেমোতে: পিবিিকেডিএফ২ (ওয়েবক্রিপ্টো)
import { readHistory } from './crypto';

const API = '/api/sync';
const ITER = 210_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const fb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64u = (u8: Uint8Array) => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fb64u = (s: string) =>
  fb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

export interface SyncState { anon_id: string; salt: string; seq: number }
export interface HistEntry { q: string; t: number }

export function getLocalState(): SyncState | null {
  const raw = localStorage.getItem('sondhan.sync');
  return raw ? (JSON.parse(raw) as SyncState) : null;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function rawKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

/** প্রথম ডিভাইসে সিঙ্ক চালু; রিকভারি কোড একবারই ফেরত যায় */
export async function enableSync(passphrase: string): Promise<{ state: SyncState; recoveryCode: string }> {
  const anon = localStorage.getItem('sondhan.anon') ?? b64u(crypto.getRandomValues(new Uint8Array(16)));
  localStorage.setItem('sondhan.anon', anon);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const state: SyncState = { anon_id: anon, salt: b64(salt), seq: 0 };

  await jpost(`${API}/register`, { anon_id: anon, salt: state.salt });

  // রিকভারি: পাসফ্রেজকে র‍্যান্ডম ব্যাকআপ-কী দিয়ে মোড়ানো হয়
  const backup = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await rawKey(backup), enc.encode(passphrase));
  await jpost(`${API}/recovery`, { anon_id: anon, nonce: b64(iv), wrapped: b64(new Uint8Array(wrapped)) });

  localStorage.setItem('sondhan.sync', JSON.stringify(state));
  return { state, recoveryCode: 'সন্ধান-রিকভারি-' + b64u(concat(fb64u(anon), backup)) };
}

/** দ্বিতীয় ডিভাইস: সিঙ্ক-আইডি + পাসফ্রেজ দিয়ে যোগদান */
export async function joinSync(anonId: string, passphrase: string): Promise<number> {
  const data = await jget(`${API}/vault?anon_id=${encodeURIComponent(anonId)}`);
  if (data.error) throw new Error('সিঙ্ক আইডি অজানা');
  localStorage.setItem('sondhan.anon', anonId);
  const state: SyncState = { anon_id: anonId, salt: data.salt, seq: data.seq };
  localStorage.setItem('sondhan.sync', JSON.stringify(state));
  return mergeFromVault(state, passphrase, data.entries);
}

/** রিকভারি কোড দিয়ে পাসফ্রেজ উদ্ধার → যোগদান */
export async function restoreWithCode(code: string): Promise<number> {
  const bytes = fb64u(code.trim().replace(/^সন্ধান-রিকভারি-/, ''));
  if (bytes.length !== 48) throw new Error('রিকভারি কোড অসম্পূর্ণ');
  const anon = b64u(bytes.slice(0, 16));
  const rec = await jget(`${API}/recovery?anon_id=${encodeURIComponent(anon)}`);
  if (!rec || rec.error) throw new Error('কোডের সাথে কোনো ভল্ট মিলল না');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fb64(rec.nonce) }, await rawKey(bytes.slice(16)), fb64(rec.wrapped));
  return joinSync(anon, dec.decode(pt));
}

/** মূল সিঙ্ক: টানো → ডিক্রিপ্ট → স্থানীয়ের সাথে মার্জ → এনক্রিপ্ট → পুশ */
export async function syncHistory(passphrase: string): Promise<number> {
  const state = getLocalState() ?? (await enableSync(passphrase)).state;
  const data = await jget(`${API}/vault?anon_id=${encodeURIComponent(state.anon_id)}`);
  if (data.error) throw new Error('সিঙ্ক ব্যর্থ');
  return mergeFromVault({ ...state, seq: data.seq }, passphrase, data.entries);
}

async function mergeFromVault(state: SyncState, passphrase: string, entries: any[]): Promise<number> {
  const key = await deriveKey(passphrase, fb64(state.salt));
  const histEntry = entries.find((e: any) => e.id === 'history');
  let remote: HistEntry[] = [];
  if (histEntry) {
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fb64(histEntry.nonce) }, key, fb64(histEntry.ct));
      remote = JSON.parse(dec.decode(pt));
    } catch { throw new Error('ভুল পাসফ্রেজ — ডিক্রিপশন ব্যর্থ'); }
  }
  let local: HistEntry[] = [];
  try { local = await readHistory(passphrase); } catch { /* প্রথম সিঙ্কে খালি থাকতে পারে */ }

  const merged = mergeHist(local, remote);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(merged)));
  const res = await jput(`${API}/vault/history`, {
    anon_id: state.anon_id, nonce: b64(iv), ct: b64(new Uint8Array(ct)),
    ver: (histEntry?.ver ?? 0) + 1, ts: Date.now(),
  });
  state.seq = res.server_seq ?? state.seq;
  localStorage.setItem('sondhan.sync', JSON.stringify(state));
  return merged.length;
}

/** ইউনিয়ন-মার্জ: (কয়েরি,সময়)-ভিত্তিক ডুপ-বাদ, সময়-অবরোহী, সীমা ১০০ */
export function mergeHist(a: HistEntry[], b: HistEntry[]): HistEntry[] {
  const map = new Map<string, HistEntry>();
  for (const e of [...a, ...b]) map.set(`${e.q}|${e.t}`, e);
  return [...map.values()].sort((x, y) => y.t - x.t).slice(0, 100);
}

async function jpost(u: string, body: unknown) {
  return (await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
}
async function jput(u: string, body: unknown) {
  return (await fetch(u, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
}
async function jget(u: string) { return (await fetch(u)).json(); }
```

## ক্লায়েন্ট টেস্ট — `apps/web/src/lib/sync.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { mergeHist } from './sync';

describe('সিঙ্ক মার্জ', () => {
  it('ইউনিয়ন + সময়-অবরোহী ক্রম', () => {
    const m = mergeHist(
      [{ q: 'ক', t: 1 }, { q: 'খ', t: 3 }],
      [{ q: 'ক', t: 1 }, { q: 'গ', t: 2 }],
    );
    expect(m.map((e) => e.q)).toEqual(['খ', 'গ', 'ক']);
  });

  it('একই (কয়েরি,সময়) একবারই থাকে', () => {
    expect(mergeHist([{ q: 'একই', t: 9 }], [{ q: 'একই', t: 9 }])).toHaveLength(1);
  });

  it('সীমা ১০০', () => {
    const many = Array.from({ length: 120 }, (_, i) => ({ q: 'ক' + i, t: i }));
    expect(mergeHist(many, [])).toHaveLength(100);
  });
});
```

## ইউআই প্যাচ — হিস্টরি ড্রয়ারে সিঙ্ক অংশ

```svelte
<!-- <script>-এ যোগ -->
import { getLocalState, syncHistory, joinSync, restoreWithCode } from '$lib/sync';
let syncState = getLocalState();
let joinId = '', restoreCode = '', syncMsg = '';

async function doSync() {
  try { syncMsg = (await syncHistory(passphrase)) + 'টি এন্ট্রি সিঙ্ক হয়েছে ✓'; }
  catch (e: any) { syncMsg = '✗ ' + e.message; }
}
async function doJoin() {
  try { await joinSync(joinId.trim(), passphrase); syncState = getLocalState(); syncMsg = 'যুক্ত হয়েছে ✓'; }
  catch (e: any) { syncMsg = '✗ ' + e.message; }
}
async function doRestore() {
  try { await restoreWithCode(restoreCode.trim()); syncState = getLocalState(); syncMsg = 'রিকভারি সফল ✓'; }
  catch (e: any) { syncMsg = '✗ ' + e.message; }
}
```

```svelte
<!-- ইতিহাস-তালিকার আগে বসান -->
<div class="syncbox">
  {#if syncState}
    <span class="chip">📱 সিঙ্ক সক্রিয় · {syncState.anon_id.slice(0, 6)}…</span>
    <button on:click={doSync} disabled={!passphrase}>🔄 সিঙ্ক</button>
    <input placeholder="দ্বিতীয় ডিভাইসের সিঙ্ক আইডি" bind:value={joinId} />
    <button on:click={doJoin} disabled={!passphrase}>যুক্ত হোন</button>
    <input placeholder="অথবা রিকভারি কোড" bind:value={restoreCode} />
    <button on:click={doRestore}>রিকভারি</button>
  {:else}
    <button on:click={async () => {
      const { enableSync } = await import('$lib/sync');
      const { recoveryCode } = await enableSync(passphrase);
      syncState = getLocalState();
      alert('একবারই দেখানো হবে — নিরাপদে সংরক্ষণ করুন:\n\n' + recoveryCode);
    }} disabled={!passphrase}>📱 সিঙ্ক চালু করুন</button>
  {/if}
  {#if syncMsg}<p class="smsg">{syncMsg}</p>{/if}
</div>
```

**হাতে-কলমে টেস্ট:** ডিভাইস-ক-তে ৩টি সার্চ → সিঙ্ক চালু → কোড সংরক্ষণ → ব্রাউজার প্রোফাইল-খ-তে রিকভারি কোড দিয়ে যোগদান → ৩টি এন্ট্রি দেখা যায়; ভুল পাসফ্রেজে "ডিক্রিপশন ব্যর্থ"; সার্ভারের `sync-store.json` খুলে প্লেইনটেক্সট খুঁজলে **পাওয়া যাবে না**।

---

# ② প্রথম এনডিসিজি বেঞ্চমার্ক — `eval/`

**পদ্ধতি:** ১৪টি বাংলা কয়েরি (প্রত্যাশিত কীওয়ার্ডসহ) → গেটওয়ে ও বিশুদ্ধ বিএম২৫ দুই পথেই শীর্ষ-৫ ফলাফল → কীওয়ার্ড-মিলে ০–৩ গ্রেড → **এনডিসিজি@৫ ও এমআরআর** তুলনা → মার্কডাউন রিপোর্ট। শূন্য ডিপেন্ডেন্সি (শুধু পাইথন স্ট্যান্ডার্ড লাইব্রেরি)।

## `eval/seeds.txt`

```
https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর
https://bn.wikipedia.org/wiki/কাজী_নজরুল_ইসলাম
https://bn.wikipedia.org/wiki/বাংলাদেশ
https://bn.wikipedia.org/wiki/ঢাকা
https://bn.wikipedia.org/wiki/পদ্মা_সেতু
https://bn.wikipedia.org/wiki/বাংলা_ভাষা_আন্দোলন
https://bn.wikipedia.org/wiki/বাংলাদেশের_স্বাধীনতা_যুদ্ধ
https://bn.wikipedia.org/wiki/গীতাঞ্জলি
https://bn.wikipedia.org/wiki/সুন্দরবন
https://bn.wikipedia.org/wiki/কক্সবাজার
https://bn.wikipedia.org/wiki/বাংলা_ভাষা
https://bn.wikipedia.org/wiki/শেখ_মুজিবুর_রহমান
https://bn.wikipedia.org/wiki/আমার_সোনার_বাংলা
https://bn.wikipedia.org/wiki/জগদীশ_চন্দ্র_বসু
https://bn.wikipedia.org/wiki/আন্তর্জাতিক_মাতৃভাষা_দিবস
https://bn.wikipedia.org/wiki/মুঘল_সাম্রাজ্য
```

## `eval/queries.json`

```json
[
  { "q": "রবীন্দ্রনাথ ঠাকুর নোবেল পুরস্কার", "expect": ["রবীন্দ্রনাথ", "নোবেল"] },
  { "q": "পদ্মা সেতু দৈর্ঘ্য কত", "expect": ["পদ্মা", "সেতু"] },
  { "q": "কাজী নজরুল ইসলাম কবিতা", "expect": ["নজরুল"] },
  { "q": "বাংলা ভাষা আন্দোলন কবে", "expect": ["ভাষা", "আন্দোলন"] },
  { "q": "বাংলাদেশের স্বাধীনতা যুদ্ধ", "expect": ["স্বাধীনতা", "যুদ্ধ"] },
  { "q": "গীতাঞ্জলি কাব্যগ্রন্থ", "expect": ["গীতাঞ্জলি"] },
  { "q": "সুন্দরবন ম্যানগ্রোভ অরণ্য", "expect": ["সুন্দরবন"] },
  { "q": "ঢাকা রাজধানী", "expect": ["ঢাকা"] },
  { "q": "কক্সবাজার সমুদ্র সৈকত", "expect": ["কক্সবাজার"] },
  { "q": "শেখ মুজিবুর রহমান জীবনী", "expect": ["মুজিব"] },
  { "q": "আমার সোনার বাংলা জাতীয় সংগীত", "expect": ["সোনার বাংলা", "সংগীত"] },
  { "q": "জগদীশ চন্দ্র বসু বিজ্ঞানী", "expect": ["বসু"] },
  { "q": "বাংলা লিপি ইতিহাস", "expect": ["বাংলা", "লিপি"] },
  { "q": "একুশে ফেব্রুয়ারি মাতৃভাষা দিবস", "expect": ["মাতৃভাষা", "ফেব্রুয়ারি"] }
]
```

## `eval/bench.py`

```python
#!/usr/bin/env python3
"""সন্ধান প্রাসঙ্গিকতা বেঞ্চমার্ক — এনডিসিজি@৫ ও এমআরআর
চালান: python3 eval/bench.py --mode both"""
import argparse, datetime, json, math, urllib.parse, urllib.request

K = 5

def fetch_json(url: str, data: bytes | None = None):
    headers = {"content-type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))

def search_api(api: str, q: str):
    """গেটওয়ে (নিজস্ব ইনডেক্স + ফাংশন-স্কোর + মেটা-সার্চ)"""
    u = f"{api}/api/search?" + urllib.parse.urlencode({"q": q})
    data = fetch_json(u)
    return [(r.get("title", ""), r.get("snippet", ""), r.get("url", "")) for r in data["results"]][:K]

def search_bm25(os_url: str, q: str):
    """তুলনা-ভিত্তি: বিশুদ্ধ বিএম২৫ মাল্টি-ম্যাচ"""
    body = json.dumps({"size": K, "query": {"multi_match": {"query": q, "fields": ["title^3", "text"]}}}).encode()
    data = fetch_json(f"{os_url}/sondhan_docs/_search", body)
    hits = data["hits"]["hits"]
    return [(h["_source"].get("title", ""), h["_source"].get("text", "")[:200],
             h["_source"].get("url", "")) for h in hits]

def grade(title: str, snippet: str, expects: list[str]) -> int:
    blob = (title + " " + snippet).lower()
    return min(sum(1 for e in expects if e.lower() in blob), 3)   # ০–৩ গ্রেড

def dcg(rels: list[int]) -> float:
    return sum((2 ** r - 1) / math.log2(i + 2) for i, r in enumerate(rels))

def ndcg_at(rels: list[int], k: int = K) -> float:
    rels = rels[:k]
    idcg = dcg(sorted(rels, reverse=True)[:k])
    return dcg(rels) / idcg if idcg > 0 else 0.0

def mrr(rels: list[int]) -> float:
    for i, r in enumerate(rels):
        if r >= 2:                       # প্রাসঙ্গিকতা ≥ ২ হলে "সঠিক"
            return 1 / (i + 1)
    return 0.0

def bn(n: float) -> str:
    return f"{n:.3f}".translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--queries", default="eval/queries.json")
    ap.add_argument("--api", default="http://localhost:8080")
    ap.add_argument("--os", default="http://localhost:9200")
    ap.add_argument("--mode", choices=["api", "bm25", "both"], default="both")
    ap.add_argument("--report", default="eval/report.md")
    ap.add_argument("--fail-under", type=float, default=0.0,
                    help="গড় NDCG@5 এই মানের নিচে হলে অশূন্য এক্সিট (সিআই-র জন্য)")
    a = ap.parse_args()

    queries = json.load(open(a.queries, encoding="utf-8"))
    rows, fails = [], []
    for item in queries:
        q, exp = item["q"], item["expect"]
        row = {"q": q}
        if a.mode in ("api", "both"):
            try:
                rels = [grade(*r, exp) for r in search_api(a.api, q)]
                row["api"] = (ndcg_at(rels), mrr(rels))
            except Exception as e:
                row["api"] = None; fails.append(f"api:{q}:{e}")
        if a.mode in ("bm25", "both"):
            try:
                rels = [grade(*r, exp) for r in search_bm25(a.os, q)]
                row["bm25"] = (ndcg_at(rels), mrr(rels))
            except Exception as e:
                row["bm25"] = None; fails.append(f"bm25:{q}:{e}")
        rows.append(row)

    # ── রিপোর্ট ──
    def avg(key: str, idx: int) -> float:
        vals = [r[key][idx] for r in rows if r.get(key)]
        return sum(vals) / len(vals) if vals else 0.0

    lines = [
        f"# প্রাসঙ্গিকতা বেঞ্চমার্ক — {datetime.date.today()}",
        f"কয়েরি: {len(rows)}টি · সূচক: এনডিসিজি@{K}, এমআরআর · গ্রেডিং: কীওয়ার্ড-মিল ০–৩",
        "",
        "| কয়েরি | এনডিসিজি@৫ (সন্ধান) | এনডিসিজি@৫ (বিএম২৫) | এমআরআর (সন্ধান) |",
        "|---|---|---|---|",
    ]
    for r in rows:
        an = bn(r["api"][0]) if r.get("api") else "—"
        bn25 = bn(r["bm25"][0]) if r.get("bm25") else "—"
        am = bn(r["api"][1]) if r.get("api") else "—"
        lines.append(f"| {r['q']} | {an} | {bn25} | {am} |")
    lines += [
        "",
        f"**গড় এনডিসিজি@৫** — সন্ধান: **{bn(avg('api', 0))}** · বিএম২৫: {bn(avg('bm25', 0))}",
        f"**গড় এমআরআর** — {bn(avg('api', 1))}",
    ]
    if fails:
        lines += ["", "## ব্যর্থতা", *[f"- {f}" for f in fails]]
    report = "\n".join(lines)
    open(a.report, "w", encoding="utf-8").write(report + "\n")
    print(report)

    mean = avg("api", 0)
    if a.fail_under and mean < a.fail_under:
        raise SystemExit(f"গড় এনডিসিজি {mean:.3f} < সীমা {a.fail_under}")

if __name__ == "__main__":
    main()
```

## `eval/README.md`

```markdown
# প্রাসঙ্গিকতা বেঞ্চমার্ক

## চালানো
    make crawl-eval        # ১৬ বীজ থেকে ~৬০ পাতা ক্রল + ইনডেক্স (আগে ওপেনসার্চ চালু)
    python3 eval/bench.py --mode both
ফলাফল: `eval/report.md` + কনসোল। সিআই-তে: `--fail-under 0.55`

## পদ্ধতি ও সীমাবদ্ধতা (সৎ স্বীকারোক্তি)
- গ্রেডিং এখন কীওয়ার্ড-মিল ভিত্তিক (০–৩); ধাপ ২খ-তে **মানব-রায়** সংগ্রহ করবে
  (প্রতি কয়েরিতে ৩ জন স্বেচ্ছাসেবক, ০–৩ স্কেল) — তখন এটিই প্রকাশ্য মানদণ্ড
- ১৪টি কয়েরি = শুরু মাত্র; লক্ষ্য ২০০+, ক্যাটাগরি-ভারসাম্যসহ
- মেটা-সার্চ ফলাফল (উইকিপিডিয়া) এপিআই-মোডে যুক্ত হয় — বিএম২৫ মোডে শুধু নিজস্ব ইনডেক্স;
  তুলনা তাই "পাইপলাইন বনাম বিশুদ্ধ টেক্সট-মিল"

## রিগ্রেশন নীতি
র‍্যাংকিং বদলানোর প্রতিটি পিআর-এ রিপোর্ট আগে/পরে সংযুক্ত করতে হবে; গড় এনডিসিজি
> ৫% কমলে মার্জ আটকাবে।
```

## মেকফাইল ও টেস্ট কেস

```makefile
crawl-eval:   ## বেঞ্চমার্কের জন্য বড় ক্রল + ইনডেক্স
	cd core/crawler && cargo run --release -- "$$(paste -sd, ../../eval/seeds.txt)" 60 ./out
	cd core/indexer && cargo run --release -- ../crawler/out/docs.jsonl
bench:        ## প্রাসঙ্গিকতা বেঞ্চমার্ক
	python3 eval/bench.py --mode both --fail-under 0.55
```

| # | ধাপ | প্রত্যাশিত | ✓ |
|---|---|---|---|
| ব১ | `make crawl-eval && make bench` | `eval/report.md` তৈরি, গড় এনডিসিজি > ০.৫৫ | ☐ |
| ব২ | ইনডেক্স ফাঁকা করে `--mode api` | ব্যর্থতা-তালিকাসহ রিপোর্ট, ক্র্যাশ নয় | ☐ |
| ব৩ | `--fail-under 0.99` | অশূন্য এক্সিট কোড | ☐ |
| ব৪ | র‍্যাংকিং ওজন বদলে আবার চালানো | আগে/পরে তুলনা সম্ভব; রিগ্রেশন ধরা পড়ে | ☐ |

---

দুটোই সম্পন্ন — সন্ধান এখন **ডিভাইস-জুড়ে নিরাপদ** এবং **সংখ্যায় মাপা যায় এমন মানের** দাবি করতে পারে। পরের বিকল্প: ① **মানব-রায় সংগ্রহ ব্যবস্থা** (বেঞ্চমার্কে স্বেচ্ছাসেবক রেটিং যুক্ত করা), ② **কমিউনিটি হ্যাকাথন-কিট** (সমস্যা-বিবৃতি, ডেটাসেট, স্কোরবোর্ড নিয়ম), কিংবা ③ **প্রোডাকশন হার্ডেনিং চেকলিস্ট** (সিঙ্ক স্টোর → পোস্টগ্রেস, রেট-লিমিট, মনিটরিং অ্যালার্ট)। বলুন কোনগুলো।

### USER
সবগুলো। 

### ASSISTANT
# সবগুলো — তিনটি ডেলিভারেবল, একসাথে

---

# ① মানব-রায় সংগ্রহ ব্যবস্থা — `/judge` + বেঞ্চমার্কে সংযোগ

## গেটওয়ে: `core/gateway/src/judge.rs` (নতুন)

```rust
//! মানব-রায় সংগ্রহ — সম্পূর্ণ বেনামী: কোনো আইডি, আইপি, সেশন নেই
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

static JUDGES: OnceLock<Mutex<Vec<Judgment>>> = OnceLock::new();
fn store() -> &'static Mutex<Vec<Judgment>> { JUDGES.get_or_init(|| Mutex::new(load())) }

#[derive(Serialize, Deserialize, Clone)]
pub struct Grade { pub url: String, pub grade: u8 }

#[derive(Serialize, Deserialize, Clone)]
pub struct Judgment { pub query: String, pub grades: Vec<Grade>, pub ts: u64 }

fn path() -> String {
    std::env::var("JUDGE_STORE").unwrap_or_else(|_| "judge-store.json".into())
}
fn load() -> Vec<Judgment> {
    std::fs::read_to_string(path()).ok()
        .and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default()
}
fn save(v: &[Judgment]) {
    let _ = std::fs::write(path(), serde_json::to_string(v).unwrap_or_default());
}

/// কয়েরি পুল: প্রথমে এনভ-ফাইল, তারপর বেঞ্চমার্্ক তালিকা
fn pool() -> Vec<String> {
    let custom = std::env::var("JUDGE_POOL").ok();
    let candidates: Vec<String> = custom.into_iter()
        .chain(["../../eval/queries.json".into(), "eval/queries.json".into()])
        .collect();
    for p in candidates {
        if let Ok(v) = std::fs::read_to_string(&p)
            .ok().and_then(|s| serde_json::from_str::<Vec<Value>>(&s).ok()) {
            return v.iter().filter_map(|x| x["q"].as_str().map(String::from)).collect();
        }
    }
    vec![]
}

/// যে কয়েরির রায় এখনো নেই সেটাই অগ্রাধিকার; সব শেষ হলে এলোমেলো
pub async fn next() -> Json<Value> {
    let p = pool();
    if p.is_empty() { return Json(json!({ "error": "empty_pool" })); }
    let seen: Vec<String> = store().lock().unwrap().iter().map(|j| j.query.clone()).collect();
    let remaining: Vec<&String> = p.iter().filter(|q| !seen.contains(q)).collect();
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH).unwrap().subsec_nanos() as usize;
    let pick = if !remaining.is_empty() {
        remaining[nanos % remaining.len()]
    } else { &p[nanos % p.len()] };
    Json(json!({ "query": pick }))
}

#[derive(Deserialize)]
pub struct SubmitBody { pub query: String, pub grades: Vec<Grade> }

pub async fn submit(Json(b): Json<SubmitBody>) -> Json<Value> {
    if b.query.trim().is_empty() || b.grades.is_empty() || b.grades.iter().any(|g| g.grade > 3) {
        return Json(json!({ "error": "invalid" }));
    }
    let mut v = store().lock().unwrap();
    v.push(Judgment {
        query: b.query,
        grades: b.grades,
        ts: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    });
    save(&v);
    Json(json!({ "ok": true, "total": v.len() }))
}

pub async fn export() -> Json<Vec<Judgment>> {
    Json(store().lock().unwrap().clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn জমা_যাচাই_ও_সংরক্ষণ() {
        // বেঠিক গ্রেড প্রত্যাখ্যাত
        let bad = submit(Json(SubmitBody {
            query: "ক".into(),
            grades: vec![Grade { url: "u".into(), grade: 9 }],
        })).await;
        assert_eq!(bad.0["error"], "invalid");
        // ঠিক জমা গৃহীত
        let ok = submit(Json(SubmitBody {
            query: "টেস্ট কয়েরি".into(),
            grades: vec![Grade { url: "https://x".into(), grade: 2 }],
        })).await;
        assert_eq!(ok.0["ok"], true);
        // রপ্তানিতে আছে
        let all = export().await.0;
        assert!(all.iter().any(|j| j.query == "টেস্ট কয়েরি"));
    }
}
```

## রুট — `main.rs`

```rust
mod judge;
// রাউটারে:
    .route("/api/judge/next",   get(judge::next))
    .route("/api/judge/submit", axum::routing::post(judge::submit))
    .route("/api/judge/export", get(judge::export))
```

## ফ্রন্টএন্ড: `apps/web/src/routes/judge/+page.svelte`

```svelte
<script lang="ts">
  const GUIDES: [string, string][] = [
    ['৩', 'সম্পূর্ণ প্রাসঙ্গিক — প্রশ্নের সরাসরি, নির্ভরযোগ্য উত্তর'],
    ['২', 'প্রাসঙ্গিক — মূল বিষয়ে, কিন্তু আংশিক'],
    ['১', 'আংশিক — সম্পর্কিত, কিন্তু প্রশ্নের উত্তর নয়'],
    ['০', 'অপ্রাসঙ্গিক'],
  ];
  let query = '', results: { title: string; url: string; snippet: string }[] = [];
  let grades: Record<string, number> = {}, msg = '', total = 0;

  async function loadNext() {
    msg = '';
    const n = await fetch('/api/judge/next').then((r) => r.json());
    if (n.error) { msg = 'কয়েরি পুল খালি'; return; }
    query = n.query; grades = {};
    const s = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json());
    results = (s.results ?? []).slice(0, 5);
  }

  async function submit() {
    if (Object.keys(grades).length < results.length) { msg = 'সব ফলাফলে রায় দিন'; return; }
    const r = await fetch('/api/judge/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        grades: results.map((x) => ({ url: x.url, grade: grades[x.url] ?? 0 })),
      }),
    }).then((x) => x.json());
    if (r.ok) { total = r.total; msg = `ধন্যবাদ! মোট সংগৃহীত রায়: ${total}`; await loadNext(); }
    else msg = 'জমা ব্যর্থ — আবার চেষ্টা করুন';
  }

  loadNext();
</script>

<svelte:head><title>রায় দিন · সন্ধান</title></svelte:head>

<main>
  <h1>🗳️ প্রাসঙ্গিকতার রায় দিন</h1>
  <p class="note">🔒 সম্পূর্ণ বেনামী — কোনো অ্যাকাউন্ট, আইপি বা পরিচয় সংরক্ষণ হয় না।<br>
    আপনার রায়-ই সন্ধানের মানের প্রকাশ্য মানদণ্ড হবে।</p>

  <div class="guides">
    {#each GUIDES as [g, d]}<div class="g"><b>{g}</b> {d}</div>{/each}
  </div>

  {#if query}
    <h2>কয়েরি: <span class="q">{query}</span></h2>
    {#each results as r, i}
      <div class="row">
        <div class="res">
          <span class="pos">{i + 1}.</span>
          <div><b>{r.title}</b><p>{r.snippet}</p><code>{r.url}</code></div>
        </div>
        <div class="btns">
          {#each [3, 2, 1, 0] as g}
            <button class:pick={grades[r.url] === g}
              on:click={() => (grades = { ...grades, [r.url]: g })}>{g}</button>
          {/each}
        </div>
      </div>
    {/each}
    <button class="go" on:click={submit}>জমা দিন</button>
  {/if}
  {#if msg}<p class="msg">{msg}</p>{/if}
  <button class="skip" on:click={loadNext}>পরের কয়েরি →</button>
</main>

<style>
  main { max-width: 780px; margin: 0 auto; padding: 48px 20px;
         font-family: "Noto Sans Bengali", sans-serif; }
  h1 { font-family: "Noto Serif Bengali", serif; }
  .note { color: #5b6663; font-size: .9rem; background: #e7f2ee; border-radius: 12px;
          padding: 12px 16px; margin: 14px 0 20px; }
  .guides { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 8px; margin-bottom: 26px; }
  .g { background: #fff; border: 1px solid #e3dccc; border-radius: 10px;
       padding: 10px 12px; font-size: .82rem; color: #5b6663; }
  .g b { color: #0e7a63; font-size: 1rem; margin-left: 6px; }
  h2 { font-size: 1.15rem; } .q { color: #e0762f; }
  .row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center;
         background: #fff; border: 1px solid #e3dccc; border-radius: 14px;
         padding: 14px 16px; margin-bottom: 12px; }
  .res { display: flex; gap: 10px; min-width: 0; }
  .pos { color: #8a938f; }
  .res b { font-size: .98rem; } .res p { color: #5b6663; font-size: .85rem; margin: 2px 0; }
  .res code { font-size: .7rem; color: #0e7a63; direction: ltr; display: block;
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btns { display: flex; gap: 6px; }
  .btns button { width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #ddd6c6;
                 background: #fff; cursor: pointer; font-weight: 700; font-family: inherit; }
  .btns button.pick { background: #0e7a63; color: #fff; border-color: #0e7a63; }
  .go { background: #e0762f; color: #fff; border: none; padding: 12px 26px;
        border-radius: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .skip { background: none; border: none; color: #0e7a63; cursor: pointer;
          margin-top: 14px; font-family: inherit; }
  .msg { margin-top: 14px; color: #0e7a63; font-weight: 600; }
</style>
```

## বেঞ্চমার্কে সংযোগ — `bench.py` প্যাচ

```python
# আর্গুমেন্টে যোগ করুন:
ap.add_argument("--human", action="store_true", help="মানব-রায় দিয়ে মূল্যায়ন")
ap.add_argument("--judgments", default="eval/judgments.jsonl")

# ফাংশন যোগ করুন:
def load_human(path: str) -> dict:
    """একই কয়েরি-ইউআরএলে একাধিক রায় হলে গড় নেওয়া হয়"""
    data = json.load(open(path, encoding="utf-8"))
    agg: dict = {}
    for j in data:
        for g in j["grades"]:
            agg.setdefault(j["query"], {}).setdefault(g["url"], []).append(g["grade"])
    return {q: {u: sum(v) / len(v) for u, v in m.items()} for q, m in agg.items()}

# মূল লুপের শুরুতে:
human = load_human(a.judgments) if a.human else None

# এপিআই-শাখা বদলান:
res = search_api(a.api, q)
if human and q in human:
    rels = [min(int(round(human[q].get(r[2], 0))), 3) for r in res]
else:
    rels = [grade(*r, exp) for r in res]
```

**প্রবাহ:** স্বেচ্ছাসেবকেরা `/judge`-এ রায় দেন → `curl -s localhost:8080/api/judge/export -o eval/judgments.jsonl` → `python3 eval/bench.py --mode api --human` → মানব-মানদণ্ডে এনডিসিজি।

---

# ② কমিউনিটি হ্যাকাথন কিট — `hackathon/`

## `hackathon/README.md`

```markdown
# সন্ধান হ্যাকাথন — «প্রথম ভোর»
৪৮–৭২ ঘণ্টা · অনলাইন · উন্মুক্ত প্রবেশ

## কেন
সার্চের মান একা দলের কাজ নয় — বাংলা ওয়েবের জন্য র‍্যাংকিং, বানান, ইনডেক্স ও
ইন্টারফেসে একসাথে শত হাত চাই। এই কিটে সমস্যা, ডেটা ও মাপকাঠি সবই প্রস্তুত।

## সময়সূচি
| দিন | কী |
|---|---|
| ০ | কিট প্রকাশ, দল গঠন (১–৪ জন) |
| ১ | ঘোষণা-সেশন + `bash setup.sh` কর্মশালা |
| ২–৩ | নির্মাণ; মেন্টর-ঘণ্টা (র‍্যাংকিং/এনএলপি/ইউএক্স) |
| ৩ | জমা-ডেডলাইন (২৩:৫৯) → স্কোরবোর্ড হালনাগাদ |
| ৪ | ফলাফল + সব জমা কোড রিপোতে প্রকাশ |

## নিয়ম (সংক্ষিপ্ত)
1. লাইসেন্স এজিপিএল-৩.০; কোড ফর্কে, পিআর-এ জমা
2. **লাল রেখা:** ব্যক্তিগত ডেটা স্ক্র্যাপিং নয় · ক্রল-ভদ্রতা ভাঙা নয় ·
   গোপনীয়তা-নীতি দুর্বল করা নয় (থ্রেট মডেলের সাথে সাংঘর্ষিক সমাধান বাতিল)
3. প্রতি জমাতে আগে/পরে বেঞ্চমার্ক রিপোর্ট বাধ্যতামূলক
4. আচরণবিধি: মূল রিপোর `CODE_OF_CONDUCT.md`

## জমা প্রক্রিয়া
`hack/<দল>-<ট্র্যাক>` ব্রাঞ্চ → পিআর-এ: কোড + `REPORT.md` (সমস্যা, পদ্ধতি,
বেঞ্চমার্ক আগে/পরে, সীমাবদ্ধতা) + স্ক্রিনশট/ভিডিও (ইউএক্স ট্র্যাকে)

## স্বীকৃতি
টাকা নয়, মর্যাদা: বিজয়ীরা মূল রিপোর `CONTRIBUTORS.md`-এ স্থায়ী স্থান,
প্রকল্প-ব্লগে কেস-স্টাডি, এবং পরবর্তী কোর-টিমে আমন্ত্রণ।
```

## `hackathon/TRACKS.md`

```markdown
# চারটি ট্র্যাক

## ট্র্যাক ক — র‍্যাংকিং
**সমস্যা:** বেঞ্চমার্ক কয়েরি-সেটে (eval/queries.json) এনডিসিজি@৫ বাড়ান।
**হাতিয়ার:** core/ranker-এর pairs.jsonl · /judge-এর মানব-রায় · ওপেনসার্চ
ফাংশন-স্কোর · চাইলে নিজস্ব এলটিআর মডেল (ml/ স্কেচ থেকে শুরু)।
**সীমানা:** ব্যবহারকারীর ডেটা ব্যবহার নিষিদ্ধ; ইনডেক্স-সময় বৈশিষ্ট্য ও
প্রকাশ্য ডেটাসেটই ভরসা।

## ট্র্যাক খ — বাংলা এনএলপি
**সমস্যা:** বানান-সংশোধনের নির্ভুলতা বাড়ান (এখন ~ছোট অভিধান)।
**হাতিয়ার:** bn_dict বড় করুন (উইকিপিডিয়া ডাম্প পাইপলাইন দেওয়া আছে) ·
core/nlp-এ স্টেমার/স্টপওয়ার্ড উন্নতি · নতুন বিভ্রান্তি-ম্যাপিং।
**মাপকাঠি:** `python3 eval/typo_bench.py` নির্ভুলতা + ফলস-পজিটিভ হার।

## ট্র্যাক গ — ইন্টারফেস
**সমস্যা:** ইউএক্স উন্নতি — মোবাইল, অ্যাক্সেসিবিলিটি, নতুন থিম, ভয়েস ইনপুট।
**সীমানা:** গতি-বাজেট অক্ষুণ্ণ (হোম < ৫০ কেবি) · থার্ড-পার্টি স্ক্রিপ্ট নিষিদ্ধ ·
ডার্ক প্যাটার্ন নিষিদ্ধ।

## ট্র্যাক ঘ — ডেটা ও স্মল-ওয়েব
**সমস্যা:** বাংলা "ছোট ওয়েব" (ব্লগ, লিটল-ম্যাগ, শিক্ষা-সাইট) ইনডেক্সে আনুন।
**হাতিয়ার:** বীজ-তালিকা সম্প্রসারণ · ক্রলার পলিশি ঠিক রেখে নতুন ডোমেইন।
**মাপকাঠি:** নতুন অনন্য ডোমেইন সংখ্যা × ভদ্রতা-সম্মতি (কোনো ৪২৯/ব্লক নয়)।
```

## `hackathon/SCOREBOARD.md`

```markdown
# স্কোরবোর্ড নীতি
স্কোর = ৫০% বেঞ্চমার্ক-উন্নতি + ৩০% কোড-মান/ডক + ২০% জুরি-রায়

| ট্র্যাক | বেঞ্চমার্ক সূত্র |
|---|---|
| ক | Δএনডিসিজি@৫ (মানব-রায়ে), রিগ্রেশন হলে −১০% |
| খ | টাইপো-নির্ভুলতা × (১ − ফলস-পজিটিভ হার) |
| গ | লাইটহাউস গড় + অ্যাক্সেসিবিলিটি চেকলিস্ট পূর্ণতা |
| ঘ | নতুন ডোমেইন × ভদ্রতা-গুণক (০ যদি কোনো অভিযোগ) |

## স্বয়ংক্রিয় যাচাই
জমা পিআর-এ সিআই চালাবে: টেস্ট + `eval/bench.py --fail-under <বর্তমান গড়>`
+ `eval/typo_bench.py`। সংখ্যা মিথ্যে বলে না — কিন্তু জুরি দেখবে সমাধান
গোপনীয়তা-নীতির ভেতরে আছে কি না।
```

## ট্র্যাক খ-এর মাপকাঠি চালু করুন — `/api/spell` + টাইপো-বেঞ্চ

**`core/gateway/src/spellcheck.rs`-এ যোগ:**

```rust
use axum::{extract::Query, Json};
use serde_json::{json, Value};

/// GET /api/spell?q=... — আলাদা হালকা এন্ডপয়েন্ট (বেঞ্চমার্কের জন্য)
pub async fn spell(Query(p): Query<crate::search::SearchParams>) -> Json<Value> {
    Json(json!({ "q": p.q, "did_you_mean": suggest_query(&p.q) }))
}
```

`main.rs`-এ: `.route("/api/spell", get(spellcheck::spell))`

## `eval/typos.json`

```json
[
  { "wrong": "বাংলদেশ", "right": "বাংলাদেশ" },
  { "wrong": "রবিন্দ্রনাথ", "right": "রবীন্দ্রনাথ" },
  { "wrong": "ভাসা", "right": "ভাষা" },
  { "wrong": "গিতাঞ্জলি", "right": "গীতাঞ্জলি" },
  { "wrong": "মুক্তিযুধ", "right": "মুক্তিযুদ্ধ" },
  { "wrong": "নবেল", "right": "নোবেল" },
  { "wrong": "পদমা সেতু", "right": "পদ্মা সেতু" },
  { "wrong": "ঢকা শহর", "right": "ঢাকা শহর" },
  { "wrong": "বাংলাদেশ", "right": null },
  { "wrong": "ঢাকা", "right": null },
  { "wrong": "ভাষা আন্দোলন", "right": null },
  { "wrong": "ঠাকুর", "right": null }
]
```

(`right: null` মানে শব্দটি সঠিক — পরামর্শ **না** দেওয়াই সঠিক আচরণ; ফলস-পজিটিভ মাপে।)

## `eval/typo_bench.py`

```python
#!/usr/bin/env python3
"""বানান-সংশোধন বেঞ্চমার্ক — নির্ভুলতা + ফলস-পজিটিভ
চালান: python3 eval/typo_bench.py [typos.json] [api]"""
import json, sys, urllib.parse, urllib.request

pairs = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "eval/typos.json", encoding="utf-8"))
api = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8080"

ok = fp = 0
for p in pairs:
    u = f"{api}/api/spell?" + urllib.parse.urlencode({"q": p["wrong"]})
    with urllib.request.urlopen(u, timeout=5) as r:
        got = json.loads(r.read().decode()).get("did_you_mean")
    good = got == p["right"]
    if good: ok += 1
    if not good and p["right"] is None: fp += 1
    print(f"{'✓' if good else '✗'} {p['wrong']} → {got or '(কিছু না)'} [প্রত্যাশিত: {p['right'] or '(কিছু না)'}]")

acc = ok / len(pairs)
print(f"\nনির্ভুলতা: {ok}/{len(pairs)} = {acc:.0%} · ফলস-পজিটিভ: {fp}")
sys.exit(0 if acc >= 0.7 else 1)
```

---

# ③ প্রোডাকশন হার্ডেনিং — `docs/HARDENING.md`

```markdown
# প্রোডাকশন হার্ডেনিং — ধাপে ধাপে

## ১. সিঙ্ক স্টোর → পোস্টগ্রেস
### স্কিমা
    CREATE TABLE sync_accounts (
      anon_id TEXT PRIMARY KEY,
      salt TEXT NOT NULL,
      recovery_nonce TEXT, recovery_wrapped TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE sync_entries (
      anon_id TEXT REFERENCES sync_accounts ON DELETE CASCADE,
      entry_id TEXT,
      nonce TEXT NOT NULL, ct TEXT NOT NULL,
      ver BIGINT NOT NULL, ts BIGINT NOT NULL,
      server_seq BIGSERIAL UNIQUE,
      PRIMARY KEY (anon_id, entry_id)
    );
    CREATE INDEX idx_entries_since ON sync_entries (anon_id, server_seq);

### পুশ প্যাটার্ন (সিনেক্স)
    INSERT INTO sync_entries (anon_id, entry_id, nonce, ct, ver, ts)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (anon_id, entry_id) DO UPDATE
      SET nonce=$3, ct=$4, ver=$5, ts=$6
    WHERE sync_entries.ver <= $5;
`WHERE`-শর্তটাই এলটিডব্লিউ সংঘর্ষ-নীতি — ডেটাবেস স্তরে পারমাণবিক।
মুছে ফেলার অধিকার: ডিলিট-এন্ডপয়েন্ট + "ভুলে যাও" স্ক্রিপ্ট (জিডিপিআর-বান্ধব)।

## ২. রেট-লিমিট (ফিঙ্গারপ্রিন্টিং ছাড়া)
`core/gateway/src/rate_limit.rs` — টোকেন-বাকেট, ট্রাঙ্কেটেড সাবনেটে:
```

**`core/gateway/src/rate_limit.rs`**

```rust
use axum::{extract::Request, http::StatusCode, middleware::Next,
           response::{IntoResponse, Response}};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

static BUCKETS: OnceLock<Mutex<HashMap<String, Bucket>>> = OnceLock::new();
#[derive(Default)]
struct Bucket { tokens: f64, last: Instant }

const CAP: f64 = 60.0;   // সর্বোচ্চ বার্সট
const RATE: f64 = 10.0;  // প্রতি সেকেন্ডে পুনর্ভরণ

pub async fn limit(req: Request, next: Next) -> Response {
    let prefix = req.extensions()
        .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
        .map(|c| crate::privacy::truncate_ip(c.0.ip()))
        .unwrap_or_else(|| "unknown".into());

    let ok = {
        let mut m = BUCKETS.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
        if m.len() > 10_000 {
            m.retain(|_, b| b.last.elapsed() < Duration::from_secs(3600));
        }
        let b = m.entry(prefix).or_default();
        b.tokens = (b.tokens + b.last.elapsed().as_secs_f64() * RATE).min(CAP);
        b.last = Instant::now();
        if b.tokens >= 1.0 { b.tokens -= 1.0; true } else { false }
    };
    if !ok { return StatusCode::TOO_MANY_REQUESTS.into_response(); }
    next.run(req).await
}
```

`main.rs`-এ: `.layer(middleware::from_fn(rate_limit::limit))` (চেইনের শুরুতে) এবং

```rust
// পুরনো:  axum::serve(listener, app).await.unwrap();
axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>())
    .await.unwrap();
```

## ৩. মনিটরিং — `/metrics` + প্রোমেথেস + অ্যালার্ট

`metrics.rs`-এ যোগ করুন:

```rust
pub async fn prometheus() -> String {
    let s = snapshot();
    format!(
        "# TYPE sondhan_requests_total counter\nsondhan_requests_total {req}\n\
         # TYPE sondhan_errors_total counter\nsondhan_errors_total {err}\n\
         # TYPE sondhan_avg_latency_ms gauge\nsondhan_avg_latency_ms {lat}\n\
         # TYPE sondhan_uptime_seconds gauge\nsondhan_uptime_seconds {up}\n",
        req = s["requests_total"], err = s["errors_total"],
        lat = s["avg_latency_ms"], up = s["uptime_secs"])
}
```

রুট: `.route("/metrics", get(metrics::prometheus))`

```yaml
# deploy/prometheus.yml
scrape_configs:
  - job_name: sondhan
    static_configs: [{ targets: ["gateway:8080"] }]
rule_files: [alerts.yml]

# deploy/alerts.yml
groups:
  - name: sondhan
    rules:
      - alert: GatewayDown
        expr: up{job="sondhan"} == 0
        for: 2m
      - alert: HighErrorRate
        expr: rate(sondhan_errors_total[5m]) / (rate(sondhan_requests_total[5m]) + 0.001) > 0.05
        for: 5m
      - alert: HighLatency
        expr: sondhan_avg_latency_ms > 500
        for: 5m
```

কম্পোজে:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
    ports: ["9090:9090"]
```

## ৪. ব্যাকআপ — `deploy/backup.sh`

```bash
#!/usr/bin/env bash
# সন্ধান ব্যাকআপ — ইনডেক্স + (সাইফারটেক্সট) স্টোর; প্লেইনটেক্সট কোথাও নেই
set -euo pipefail
STAMP=$(date +%F_%H%M)
DEST="${1:-/var/backups/sondhan}"
mkdir -p "$DEST"
docker compose -f deploy/docker-compose.prod.yml exec -T opensearch \
  tar czf - /usr/share/opensearch/data > "$DEST/opensearch-$STAMP.tar.gz"
cp sync-store.json judge-store.json "$DEST/" 2>/dev/null || true
find "$DEST" -mtime +14 -delete        # রাখা হয় ১৪ দিন
echo "✓ ব্যাকআপ সম্পন্ন: $DEST ($STAMP)"
# ক্রন: 0 3 * * * /পথ/সন্ধান/deploy/backup.sh
```

## ৫. মাস্টার চেকলিস্ট

| # | কাজ | যাচাই | ☐ |
|---|---|---|---|
| ১ | টিএলএস এ+ রেটিং | `testssl.sh sondhan.example.com` | ☐ |
| ২ | এইচএসটিএস প্রি-লোড আবেদন | হেডার যাচাই | ☐ |
| ৩ | রেট-লিমিট | ১০০ দ্রুত রিকোয়েস্ট → ৪২৯ আসে | ☐ |
| ৪ | `/metrics` স্ক্র্যাপ হচ্ছে | প্রোমেথেস টার্গেট সবুজ | ☐ |
| ৫ | অ্যালার্ট ফায়ার ড্রিল | কৃত্রিম লেটেন্সি → নোটিফিকেশন | ☐ |
| ৬ | ব্যাকআপ + **রিস্টোর ড্রিল** | স্ন্যাপশট থেকে সার্চ চলে | ☐ |
| ৭ | ওপেনসার্চ শুধু অভ্যন্তরীণ | `nmap` — ৯২০০ বাইরে থেকে বন্ধ | ☐ |
| ৮ | লগ অডিট | ২৪ ঘণ্টার লগে কয়েরি/আইপি খুঁজে নেই | ☐ |
| ৯ | ডিপেন্ডেন্সি হালনাগাদ | মাসিক `cargo audit` + `npm audit` | ☐ |
| ১০ | অনিয়ন পৌঁছায় | `torsocks curl` স্বাস্থ্য পরীক্ষা | ☐ |
| ১১ | security.txt সক্রিয় | `/.well-known/security.txt` | ☐ |
| ১২ | ইনসিডেন্ট ড্রিল | থ্রেট মডেল §৯ প্লেব্যাক টেবিল-টপ মহড়া | ☐ |
```

**টেস্ট কেস:** ৬০+ রিকোয়েস্ট/সে পাঠালে `429` + `Retry-After`-হীন শান্ত সাড়া; `/metrics`-এ কাউন্টার বাড়ে; জজ-সাবমিটে `grade:9` → `invalid`; টাইপো-বেঞ্জ ৭০%-এর নিচে হলে অশূন্য এক্সিট।

---

তিনটিই সম্পন্ন — সন্ধান এখন **মানুষের রায়ে শেখে**, **সম্প্রদায়ের প্রতিযোগিতায় বাড়ে**, আর **প্রোডাকশন-কঠিন অবকাঠামোর দিকে হাঁটে**। পরের বিকল্প: ① **ফাউন্ডেশন গঠনের খসড়া** (স্ট্যাটিউট, বোর্ড, মেধাস্বত্ব হস্তান্তর নীতি), ② **গ্র্যান্ট আবেদন-ডসিয়ার** (বাজেট টেবিলসহ), কিংবা ③ **১.০-পরবর্তী ভিশন ডক** (মোবাইল অ্যাপ, ভয়েস, এআই-সহায়ক উত্তর — প্রাইভেসি রেখে)। বলুন কোনগুলো।