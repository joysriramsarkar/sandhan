# Sandhan Production Hardening Guide

## 1. Database & Persistence
- Postgres schema with `sync_accounts` and `sync_entries` tables.
- Monotonic LWW atomic conflict checks with `ON CONFLICT (anon_id, entry_id) DO UPDATE ... WHERE sync_entries.ver <= EXCLUDED.ver`.

## 2. Rate Limiting (Privacy-Preserving)
- Token bucket algorithms operating on truncated IP subnets (`/24` for IPv4, `/64` for IPv6).
- No canvas or user-agent tracking.

## 3. Metrics & OpenTelemetry
- Prometheus scrape target at `/metrics`.
- Tracks request volume, response latency, and error counts with differential privacy perturbation.
