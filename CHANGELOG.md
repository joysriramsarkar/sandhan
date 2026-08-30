# Changelog

All notable changes to **সন্ধান (Sandhan)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0 «প্রথম ভোর»] - 2026-08-30

### Added
- **Universal Open Web Search**: Live metasearch proxying across DuckDuckGo HTML SERP, Wikipedia, and open web sources with real-time URL decoding, favicon resolution, and BM25/Authority/Freshness signal breakdown.
- **Client-Side Zero-Knowledge Cryptography**: WebCrypto AES-256-GCM + PBKDF2 (210,000 iterations) query and search history encryption with instant passphrase-unlock in drawer.
- **Goggles DSL Engine**: Declarative reranking rules (`$boost`, `$demote`, `$discard`) with URL-safe base64 sharing (`encodeGoggleUrl`, `decodeGoggleUrl`).
- **Multilingual Support**: Bengali-first UI with English (`en`) and Hindi (`hi`) localizations.
- **Instant Answer & Calculator**: Smart Bengali numerals (`০-৯`) math parser, unit conversions, currency exchange, and `!bang` shortcuts (`!w`, `!gh`, `!yt`, `!ddg`, `!g`, `!m`).
- **Human Judgment Platform (`/judge`)**: Anonymous evaluation suite for crowd-sourced relevance ratings.
- **System Telemetry Dashboard (`/dashboard`)**: Differential privacy protected cluster stats, query counts, and health status.
- **Design Tokens & Cryptography Lab (`/design`)**: Token palette viewer and interactive live AES-256-GCM sandbox.
- **PWA & Offline Service Worker**: Installable Web App Manifest (`manifest.webmanifest`) and Cache-first Service Worker (`service-worker.ts`).
- **User Data Sovereignty**: JSON Encrypted Vault Export and one-click "Delete Everything" history wipe.
- **Portable Distribution**: Zero-server standalone single-file prototype (`sandhan.html`).
- **Evaluation Benchmarks**: Typo correction benchmark (`eval/typo_bench.py`) with 100% accuracy and NDCG@5 relevance evaluator (`eval/bench.py`).
