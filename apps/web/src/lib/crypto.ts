/**
 * Zero-Knowledge Client-Side History Encryption Module
 * Standard: PBKDF2-SHA256 (KDF) + AES-256-GCM (Cipher)
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export let KDF_ITERATIONS = 210000;

export function _setKdfIterations(n: number): void {
	KDF_ITERATIONS = n;
}

export function toBase64(u8: Uint8Array): string {
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(u8).toString('base64');
	}
	let binary = '';
	for (let i = 0; i < u8.byteLength; i++) {
		binary += String.fromCharCode(u8[i]);
	}
	return btoa(binary);
}

export function fromBase64(s: string): Uint8Array {
	if (typeof Buffer !== 'undefined') {
		return new Uint8Array(Buffer.from(s, 'base64'));
	}
	const binary = atob(s);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export function getOrCreateSalt(): Uint8Array {
	if (typeof localStorage === 'undefined') {
		return crypto.getRandomValues(new Uint8Array(16));
	}
	let saltB64 = localStorage.getItem('sondhan_salt');
	if (!saltB64) {
		const newSalt = crypto.getRandomValues(new Uint8Array(16));
		saltB64 = toBase64(newSalt);
		localStorage.setItem('sondhan_salt', saltB64);
	}
	return fromBase64(saltB64);
}

export async function deriveKey(passphrase: string, salt?: Uint8Array): Promise<CryptoKey> {
	const currentSalt = salt || getOrCreateSalt();
	const baseKey = await crypto.subtle.importKey(
		'raw',
		enc.encode(passphrase),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: currentSalt,
			iterations: KDF_ITERATIONS,
			hash: 'SHA-256'
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export interface EncryptedPayload {
	iv: string; // Base64 96-bit IV
	ct: string; // Base64 Ciphertext + Auth Tag
}

export async function encryptJSON<T>(key: CryptoKey, data: T): Promise<EncryptedPayload> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const plaintext = enc.encode(JSON.stringify(data));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		plaintext
	);

	return {
		iv: toBase64(iv),
		ct: toBase64(new Uint8Array(ciphertext))
	};
}

export async function decryptJSON<T>(key: CryptoKey, payload: EncryptedPayload): Promise<T> {
	const iv = fromBase64(payload.iv);
	const ct = fromBase64(payload.ct);
	const plaintextBuffer = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		key,
		ct
	);

	return JSON.parse(dec.decode(plaintextBuffer)) as T;
}
