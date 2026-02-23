import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/crypto/hash";

describe("sha256Hex", () => {
  it("should return correct SHA256 hash for known input", () => {
    const result = sha256Hex("hello world");
    expect(result).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("should return different hashes for different inputs", () => {
    const hash1 = sha256Hex("input1");
    const hash2 = sha256Hex("input2");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty string", () => {
    const result = sha256Hex("");
    expect(result).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("should handle unicode characters", () => {
    const result = sha256Hex("🚀 test");
    expect(result).toBe("334b49fca206e58d51b9ccd0cf4a0aef6f9eb1d98fbc5078ce3f5db277600215");
  });
});
