import { describe, it, expect, beforeEach } from 'vitest';
import { deriveKey, encryptJSON, decryptJSON, _setKdfIterations } from './crypto';

describe('Zero-Knowledge Cryptography Module', () => {
	beforeEach(() => {
		// Set low iterations for fast unit test execution
		_setKdfIterations(1000);
	});

	it('should encrypt and decrypt search history item correctly', async () => {
		const testPassphrase = 'my-secret-vault-phrase';
		const salt = new Uint8Array(16).fill(42);
		const key = await deriveKey(testPassphrase, salt);

		const searchRecord = {
			q: 'রবীন্দ্রনাথ ঠাকুর নোবেল পুরস্কার',
			timestamp: 1725000000000,
			clicked: 'https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর'
		};

		const encrypted = await encryptJSON(key, searchRecord);
		expect(encrypted.iv).toBeDefined();
		expect(encrypted.ct).toBeDefined();
		expect(typeof encrypted.ct).toBe('string');
		expect(encrypted.ct).not.toContain('রবীন্দ্রনাথ');

		const decrypted = await decryptJSON<typeof searchRecord>(key, encrypted);
		expect(decrypted.q).toBe(searchRecord.q);
		expect(decrypted.timestamp).toBe(searchRecord.timestamp);
		expect(decrypted.clicked).toBe(searchRecord.clicked);
	});

	it('should fail decryption if wrong passphrase or key is used', async () => {
		const salt = new Uint8Array(16).fill(7);
		const correctKey = await deriveKey('correct-passphrase', salt);
		const wrongKey = await deriveKey('wrong-passphrase', salt);

		const payload = await encryptJSON(correctKey, { secret: 'top-secret' });

		await expect(decryptJSON(wrongKey, payload)).rejects.toThrow();
	});
});
