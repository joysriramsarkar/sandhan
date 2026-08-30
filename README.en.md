# Sandhan (সন্ধান) 🔍

[English Documentation](README.en.md) | [বাংলা সংস্করণ](README.md)

[![Live Website](https://img.shields.io/badge/Live_Site-sandhan.site-0e7a63?style=for-the-badge&logo=vercel)](https://sandhan.site)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Privacy: Zero-Knowledge](https://img.shields.io/badge/Privacy-Zero--Knowledge-0e7a63.svg)](docs/THREAT-MODEL.md)
[![Language: Multilingual](https://img.shields.io/badge/Language-Multilingual-e0762f.svg)](apps/web/src/lib/i18n.ts)

**Sandhan** is an open-source, universal, privacy-first search engine — **[sandhan.site](https://sandhan.site)**. It aggregates real-time search results across millions of websites, knowledge bases, and news outlets worldwide while guaranteeing zero-knowledge client-side encryption for search history and transparent ranking signals.

---

## 🌟 Key Features

- 🌐 **Universal Open Web Search**: Comprehensive search results across the entire internet for people, websites, blogs, wikis, code repositories, images, and news.
- 🔐 **Zero-Knowledge Client Encryption**: Search history is encrypted in your local browser using military-grade **AES-256-GCM** with PBKDF2 key derivation. Zero queries are logged on the server.
- 📱 **Mobile-First Responsive Interface**: Clean, fast, and optimized interface designed for smartphones, tablets, and desktops alike.
- 👓 **Transparent Ranking & Goggles**: Inspect ranking signals (BM25, Authority, Freshness) behind every result and apply custom declarative rules to customize ranking.
- ⚡ **Instant Answers & Calculator**: Math evaluator supporting Bengali and Arabic numerals, unit and currency conversions, and fast bang shortcuts (`!w`, `!gh`, `!yt`, `!ddg`, `!g`).
- 📚 **Knowledge Graph Cards**: Real-time Wikipedia entity summaries and infoboxes localized to your selected language.
- ⚖️ **Human Evaluation Platform (`/judge`)**: Privacy-preserving platform for community relevance reviews and benchmark data collection.
- 📊 **Telemetry Dashboard (`/dashboard`)**: Differential-privacy protected cluster and operational statistics.

---

## 📦 Zero-Dependency Standalone Edition

To run Sandhan entirely offline or without any server installation:
- Open **[`sandhan.html`](sandhan.html)** directly in any modern web browser.
- It includes standalone WebCrypto client encryption, calculator, and direct search integrations in a single portable file.

---

## 🗺️ Roadmap

- [x] **Phase 1:** Metasearch layer integration and server-side IP stripping proxy.
- [ ] **Phase 2:** Vertical web crawler deployment for regional web ecosystems (`core/crawler`).
- [ ] **Phase 3:** Dedicated inverted index with OpenSearch integration (`core/indexer`).
- [ ] **Phase 4:** Bengali NLP tokenizer and spelling correction dataset expansion (`core/nlp`).
- [ ] **Phase 5:** Human feedback evaluation dataset integration for NDCG@5 optimization.

---

## 📁 Repository Structure

```
sandhan/
├── apps/
│   └── web/                           # Modern SvelteKit web application
│       ├── src/
│       │   ├── lib/
│       │   │   ├── crypto.ts          # Client-side WebCrypto AES-256-GCM
│       │   │   ├── goggles.ts         # Goggles reranking engine
│       │   │   ├── i18n.ts            # Multilingual localization
│       │   │   ├── sync.ts            # Zero-knowledge sync protocol
│       │   │   ├── instant.ts         # Math and unit conversions
│       │   │   ├── bangs.ts           # Shortcut router
│       │   │   └── search.ts          # Metasearch client
│       │   └── routes/
│       │       ├── api/search/        # Anonymizing proxy search server
│       │       ├── +page.svelte       # Main homepage and search SERP
│       │       ├── judge/             # Human evaluation platform
│       │       ├── dashboard/         # Cluster telemetry dashboard
│       │       ├── design/            # Design tokens & crypto sandbox
│       │       └── launch/            # Manifesto and launch page
├── core/                              # Core backend services (Rust specifications)
│   ├── gateway/                       # API gateway and rate limiter
│   ├── nlp/                           # Unicode normalization and spellchecker
│   ├── crawler/                       # Polite web crawler
│   └── indexer/                       # Inverted index loader
├── eval/                              # Quality benchmarks and evaluation scripts
│   ├── typo_bench.py                  # Typo correction benchmark
│   └── bench.py                       # Relevance NDCG@5 benchmark
├── brand/                             # Logos, SVG assets, and design tokens
├── docs/                              # Threat models and deployment guides
├── deploy/                            # Production Caddyfile, Prometheus, and backup scripts
├── sandhan.html                       # Standalone single-file distribution
├── docker-compose.yml                 # Docker Compose orchestrations
├── setup.sh                           # One-click installation script
└── LICENSE                            # GNU AGPLv3 copyleft license
```

---

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
cd apps/web
npm install

# Start development server
npm run dev
```
Open in browser: **`http://localhost:5173`**

### Tests & Evaluation
```bash
# Frontend & crypto unit tests
cd apps/web && npm test

# Spellcheck benchmark
python eval/typo_bench.py

# Relevance benchmark
python eval/bench.py
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus search input |
| `d` | Toggle dark / light theme |
| `?` | Show shortcuts modal |
| `Esc` | Close modal or drawer |
| `Enter` | Submit query |

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
