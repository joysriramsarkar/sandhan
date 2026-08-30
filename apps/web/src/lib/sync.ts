/**
 * Zero-Knowledge Encrypted Synchronization Client
 * Encrypts search records on device and syncs only {anon_id, nonce, ciphertext} to gateway
 */

import { encryptJSON, decryptJSON, type EncryptedPayload } from './crypto';

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
	authToken?: string;
}

function generateSecureHex(bytes = 16): string {
	const u8 = crypto.getRandomValues(new Uint8Array(bytes));
	return Array.from(u8)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function generateAnonymousId(): string {
	if (typeof localStorage !== 'undefined') {
		let id = localStorage.getItem('sandhan_anon_id');
		if (!id) {
			id = 'anon_' + generateSecureHex(16);
			localStorage.setItem('sandhan_anon_id', id);
		}
		return id;
	}
	return 'anon_' + generateSecureHex(16);
}

export function getOrCreateSyncAuthToken(): string {
	if (typeof localStorage !== 'undefined') {
		let token = localStorage.getItem('sandhan_sync_auth_token');
		if (!token) {
			token = 'tok_' + generateSecureHex(24);
			localStorage.setItem('sandhan_sync_auth_token', token);
		}
		return token;
	}
	return 'tok_' + generateSecureHex(24);
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
		version: record.version,
		authToken: getOrCreateSyncAuthToken()
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
