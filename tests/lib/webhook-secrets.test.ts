import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptWebhookSecret, encryptWebhookSecret } from "@/lib/security/webhook-secrets";

describe("webhook secrets", () => {
  beforeEach(() => {
    // Ensure encryption key is available for tests
    vi.stubEnv("PROVIDER_KEY_ENCRYPTION_KEY", "test-key-32-chars-long-1234567890");
  });

  it("encrypt then decrypt returns original secret", () => {
    const orgId = 123;
    const secret = "whsec_test_secret_12345";

    const encrypted = encryptWebhookSecret(orgId, secret);
    const decrypted = decryptWebhookSecret(orgId, encrypted);

    expect(decrypted).toBe(secret);
  });

  it("decrypt with missing fields returns null", () => {
    const orgId = 123;

    // Missing encryptedSecret
    const missingEncrypted = {
      encryptedSecret: null,
      secretIv: "test-iv",
      secretTag: "test-tag",
    };
    expect(decryptWebhookSecret(orgId, missingEncrypted)).toBeNull();

    // Missing secretIv
    const missingIv = {
      encryptedSecret: "test-encrypted",
      secretIv: null,
      secretTag: "test-tag",
    };
    expect(decryptWebhookSecret(orgId, missingIv)).toBeNull();

    // Missing secretTag
    const missingTag = {
      encryptedSecret: "test-encrypted",
      secretIv: "test-iv",
      secretTag: null,
    };
    expect(decryptWebhookSecret(orgId, missingTag)).toBeNull();
  });

  it("decrypt with legacy placeholder returns null", () => {
    const orgId = 123;
    const legacyPayload = {
      secret: "[encrypted]", // Legacy placeholder
      encryptedSecret: null,
      secretIv: null,
      secretTag: null,
    };

    expect(decryptWebhookSecret(orgId, legacyPayload)).toBeNull();
  });

  it("decrypt with actual legacy secret returns the secret", () => {
    const orgId = 123;
    const actualSecret = "whsec_real_legacy_secret";
    const legacyPayload = {
      secret: actualSecret, // Not the placeholder
      encryptedSecret: null,
      secretIv: null,
      secretTag: null,
    };

    expect(decryptWebhookSecret(orgId, legacyPayload)).toBe(actualSecret);
  });

  it("throws when PROVIDER_KEY_ENCRYPTION_KEY is missing", () => {
    vi.stubEnv("PROVIDER_KEY_ENCRYPTION_KEY", "");

    expect(() => {
      encryptWebhookSecret(123, "test-secret");
    }).toThrow("PROVIDER_KEY_ENCRYPTION_KEY environment variable is required");
  });

  it("different orgId produces different encrypted values", () => {
    const secret = "shared_secret";

    const encrypted1 = encryptWebhookSecret(123, secret);
    const encrypted2 = encryptWebhookSecret(456, secret);

    expect(encrypted1.encryptedSecret).not.toBe(encrypted2.encryptedSecret);
    expect(encrypted1.secretIv).not.toBe(encrypted2.secretIv);
    expect(encrypted1.secretTag).not.toBe(encrypted2.secretTag);
  });

  it("throws for corrupted data (invalid base64/crypto)", () => {
    const orgId = 123;
    const corruptedPayload = {
      encryptedSecret: "corrupted-data",
      secretIv: "invalid-iv",
      secretTag: "invalid-tag",
    };

    // AES-GCM auth tag verification fails → throws, not null
    expect(() => decryptWebhookSecret(orgId, corruptedPayload)).toThrow();
  });
});
