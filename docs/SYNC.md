# Sync Protocol v1 (Zero-Knowledge)

## 1. Endpoints
- `POST /api/sync/register`: `{ anon_id, salt }`
- `GET /api/sync/pull?anon_id=...&since=...`: returns array of encrypted blobs
- `POST /api/sync/push`: `{ anon_id, entry_id, nonce, ct, ver, ts }`
- `POST /api/sync/recovery`: stores wrapped recovery blob

## 2. Invariants
- The server never receives or stores plaintexts or decryption keys.
- Last-Write-Wins (LWW) conflict resolution using monotonicity checks on `ver` timestamps.
- Zero association with emails, phone numbers, or hardware IDs.
