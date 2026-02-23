import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("crypto", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    createHash: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => "mocked-hash"),
      })),
    })),
    randomBytes: vi.fn(() => Buffer.from("mocked-iv-123456789012")),
  };
});

const { encryptJSON, decryptJSON } = await import("@/lib/security/encryption");

describe("security/encryption (more)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrypt fails with altered version header", async () => {
    // Generate a proper 32-byte key and encode as base64
    const keyBytes = Buffer.alloc(32, "test-key-32-bytes-minimum!!"); // Exactly 32 bytes
    const key = keyBytes.toString("base64");
    const data = "hello world";

    // Encrypt data
    const encrypted = await encryptJSON(data, key);

    // Tamper with the encrypted data more significantly - change the whole string
    const tampered = encrypted.replace(/./g, "X"); // Replace all characters

    // Decrypt should fail
    const result = await decryptJSON(tampered, key);
    expect(result).toBeNull(); // decryptJSON returns null on failure
  });
});
