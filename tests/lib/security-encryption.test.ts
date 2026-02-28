import { describe, expect, it } from "vitest";
import {
	decryptData,
	decryptJSON,
	encryptData,
	encryption,
	encryptJSON,
	KeyManager,
} from "@/lib/security/encryption";

describe("security/encryption helpers", () => {
	it("round-trips plaintext through encrypt/decrypt", () => {
		const key = encryption.generateKey();
		const payload = "sensitive-data-123";

		const encrypted = encryptData(payload, key);
		const decrypted = decryptData(encrypted, key);

		expect(decrypted.success).toBe(true);
		expect(decrypted.decrypted).toBe(payload);
	});

	it("decrypt reports failure when payload is tampered", () => {
		const key = encryption.generateKey();
		const payload = "another-secret";
		const encrypted = encryptData(payload, key);

		const tampered = {
			...encrypted,
			encrypted: `${encrypted.encrypted.slice(0, -4)}deadbeef`,
		};

		const result = decryptData(tampered, key);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Decryption failed");
	});

	it("fails gracefully when key material is invalid", () => {
		const invalidKey = "short";
		const dummy: Parameters<typeof decryptData>[0] = {
			encrypted: "00",
			iv: "00",
			tag: "00",
		};

		const result = decryptData(dummy, invalidKey);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Decryption failed");
	});

	it("round-trips JSON payloads", () => {
		const key = encryption.generateKey();
		const payload = { apiKey: "sk_test", scopes: ["read", "write"] };

		const encrypted = encryptJSON(payload, key);
		const decrypted = decryptJSON<typeof payload>(encrypted, key);

		expect(decrypted).toEqual(payload);
	});

	it("KeyManager utilities behave as expected", () => {
		const { key } = KeyManager.generateKey();
		expect(KeyManager.validateKey(key)).toBe(true);
		expect(KeyManager.validateKey("not-base64")).toBe(false);

		const fingerprint = KeyManager.fingerprint(key);
		expect(fingerprint).toHaveLength(64);

		expect(KeyManager.keysMatch(key, key)).toBe(true);
		expect(KeyManager.keysMatch(key, encryption.generateKey())).toBe(false);
	});
});
