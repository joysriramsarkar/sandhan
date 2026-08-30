import { describe, it, expect } from 'vitest';
import { deriveKey } from './crypto';
import { prepareRecordForSync, restoreRecordFromSync, type SyncRecord } from './sync';

describe('Zero-Knowledge Sync Module', () => {
	it('should encrypt and restore sync records without leaking plaintexts', async () => {
		const key = await deriveKey('sync-test-passphrase', new Uint8Array(16).fill(9), 1000);
		const anonId = 'anon_user_xyz123';

		const record: SyncRecord = {
			entryId: 'rec_001',
			query: 'পদ্মা সেতু নির্মাণ ইতিহাস',
			timestamp: Date.now(),
			clickedUrl: 'https://bn.wikipedia.org/wiki/পদ্মা_সেতু',
			version: 1
		};

		const blob = await prepareRecordForSync(key, anonId, record);
		expect(blob.anonId).toBe(anonId);
		expect(blob.entryId).toBe('rec_001');
		expect(blob.nonce).toBeDefined();
		expect(blob.ciphertext).toBeDefined();
		expect(blob.ciphertext).not.toContain('পদ্মা সেতু');

		const restored = await restoreRecordFromSync(key, blob);
		expect(restored.query).toBe(record.query);
		expect(restored.entryId).toBe(record.entryId);
		expect(restored.clickedUrl).toBe(record.clickedUrl);
	});
});
