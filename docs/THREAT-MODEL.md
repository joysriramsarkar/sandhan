# Sondhan Threat Model v0.1

## 1. Scope
This document outlines the security assumptions, trust boundaries, threat actors, and cryptographic protections of **Sondhan (সন্ধান)**.

## 2. Assets & Their Sensitivity
- **User Search Queries**: Extremely sensitive. Kept strictly on client device or encrypted with client-held keys (AES-256-GCM + PBKDF2).
- **Search History**: Stored encrypted in client browser (`IndexedDB`/`localStorage`) or stored as ciphertext `{anon_id, nonce, ciphertext}` on sync server.
- **User IP Address**: Ephemeral. Truncated at edge gateway (last octet dropped for IPv4, /64 prefix kept for IPv6). Zero persistent query logs.

## 3. Threat Actors
1. **Curious Server Operators / Compromised Servers**: Attempting to read stored user history or inspect queries.
   - *Mitigation*: Client-side zero-knowledge encryption. Servers store ciphertext only.
2. **Network Snooper / ISP**: Attempting to inspect traffic.
   - *Mitigation*: TLS 1.3 enforced, HSTS preload, optional Tor onion service (.onion).
3. **Subpoena / Legal Demand for Logs**:
   - *Mitigation*: No logs exist to produce. Zero persistent query storage.
4. **Abusive Crawlers / Scraping Bots**:
   - *Mitigation*: Token-bucket subnet rate limiter without browser fingerprinting.

## 4. Cryptographic Specifications
- **Key Derivation (KDF)**: PBKDF2-SHA256 (210,000 iterations in browser WebCrypto; Argon2id in native apps).
- **Cipher**: AES-256-GCM with authenticated tags.
- **Nonce/IV**: 96-bit cryptographically secure random value generated per entry.
- **Recovery Phrase**: 16-word mnemonic passphrase. If lost, data recovery is mathematically impossible.
