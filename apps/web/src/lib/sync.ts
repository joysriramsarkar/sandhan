/**
 * Zero-Knowledge Encrypted Synchronization Client
 * Encrypts search records on device and syncs only {anon_id, nonce, ciphertext} to gateway
 */

import { deriveKey, encryptJSON, decryptJSON, type EncryptedPayload } from './crypto';

export interface SyncRecord {
	entryId: string;
	query: string;
	timestamp: number;
	clickedUrl?: string;
	version: number;
}

export interface EncryptedSyncBlob {
	anonId: string;
	entryId: string;
	nonce: string;
	ciphertext: string;
	version: number;
}

export function generateAnonymousId(): string {
	if (typeof localStorage !== 'undefined') {
		let id = localStorage.getItem('sondhan_anon_id');
		if (!id) {
			id = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
			localStorage.setItem('sondhan_anon_id', id);
		}
		return id;
	}
	return 'anon_' + Math.random().toString(36).substring(2);
}

export async function prepareRecordForSync(
	key: CryptoKey,
	anonId: string,
	record: SyncRecord
): Promise<EncryptedSyncBlob> {
	const payload: EncryptedPayload = await encryptJSON(key, record);
	return {
		anonId,
		entryId: record.entryId,
		nonce: payload.iv,
		ciphertext: payload.ct,
		version: record.version
	};
}

export async function restoreRecordFromSync(
	key: CryptoKey,
	blob: EncryptedSyncBlob
): Promise<SyncRecord> {
	return await decryptJSON<SyncRecord>(key, {
		iv: blob.nonce,
		ct: blob.ciphertext
	});
}
