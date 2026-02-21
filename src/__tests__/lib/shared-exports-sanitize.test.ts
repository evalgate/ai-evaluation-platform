/**
 * Sanitize export data — enforce denylist + allowlist.
 * Ensures forbidden keys (secrets, org identifiers) never persist in share payloads.
 */
/// <reference types="vitest/globals" />

import {
  assertNoSecrets,
  computeExportHash,
  prepareExportForShare,
  sanitizeExportData,
  stableStringify,
} from "@/lib/shared-exports";

/** Forbidden keys — must not appear in sanitized output (regression guard) */
const FORBIDDEN_KEYS = new Set([
  "apikey",
  "api_key",
  "authorization",
  "bearer",
  "bearer_token",
  "secret",
  "password",
  "token",
  "organizationid",
  "organization_id",
  "userid",
  "user_id",
  "createdby",
  "created_by",
  "annotatorid",
  "annotator_id",
  "internalnotes",
  "internal_notes",
]);

/** Recursively check for forbidden keys in output. Returns true if unknown found. */
function hasSensitiveKeys(obj: unknown, depth = 0): boolean {
  if (depth > 50) return false;
  if (obj === null || obj === undefined) return false;
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return false;
  if (Array.isArray(obj)) {
    return obj.some((item) => hasSensitiveKeys(item, depth + 1));
  }
  if (typeof obj === "object") {
    for (const [key] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      if (
        FORBIDDEN_KEYS.has(keyLower) ||
        keyLower.includes("apikey") ||
        keyLower.includes("secret")
      ) {
        return true;
      }
      if (hasSensitiveKeys((obj as Record<string, unknown>)[key], depth + 1)) return true;
    }
  }
  return false;
}

describe("sanitizeExportData + assertNoSecrets", () => {
  const baseExport = {
    evaluation: { id: "1", name: "Test", type: "unit_test" },
    summary: { totalTests: 10, passed: 8, failed: 2, passRate: "80%" },
    qualityScore: { overall: 80, grade: "B", metrics: {}, insights: [], recommendations: [] },
    type: "unit_test",
  };

  it("allows clean export data", () => {
    const sanitized = sanitizeExportData(baseExport);
    expect(sanitized.evaluation).toBeDefined();
    expect(sanitized.summary).toBeDefined();
    expect(sanitized.qualityScore).toBeDefined();
    assertNoSecrets(sanitized);
  });

  it("sanitized output from clean input has no sensitive keys (regression guard)", () => {
    const sanitized = sanitizeExportData(baseExport);
    expect(hasSensitiveKeys(sanitized)).toBe(false);
  });

  it("prepareExportForShare throws when export contains sensitive key (write-time gate)", () => {
    const withSecret = {
      ...baseExport,
      evaluation: { ...baseExport.evaluation, apiKey: "sk-xxx" },
    };
    expect(() => prepareExportForShare(withSecret)).toThrow(/disallowed keys/);
  });

  it("prepareExportForShare output has no sensitive keys (persisted exportData invariant)", () => {
    const prepared = prepareExportForShare(baseExport);
    expect(hasSensitiveKeys(prepared)).toBe(false);
  });

  it("rejects apiKey unknownwhere nested", () => {
    const withSecret = {
      ...baseExport,
      evaluation: { ...baseExport.evaluation, apiKey: "sk-xxx" },
    };
    const sanitized = sanitizeExportData(withSecret);
    expect(() => assertNoSecrets(sanitized)).toThrow(/disallowed keys/);
  });

  it("rejects organizationId unknownwhere nested", () => {
    const withOrg = {
      ...baseExport,
      evaluation: { ...baseExport.evaluation, organizationId: 42 },
    };
    expect(() => {
      const s = sanitizeExportData(withOrg);
      assertNoSecrets(s);
    }).toThrow(/disallowed keys/);
  });

  it("rejects authorization in nested object", () => {
    const withAuth = {
      ...baseExport,
      testResults: [{ input: "x", authorization: "Bearer xxx" }],
    };
    expect(() => {
      const s = sanitizeExportData(withAuth);
      assertNoSecrets(s);
    }).toThrow(/disallowed keys/);
  });

  it("rejects authorization nested 5 levels deep (CLI share publish rejects)", () => {
    const withAuthDeep = {
      ...baseExport,
      evaluation: {
        ...baseExport.evaluation,
        a: { b: { c: { d: { authorization: "Bearer secret-token" } } } },
      },
    };
    expect(() => {
      const s = sanitizeExportData(withAuthDeep);
      assertNoSecrets(s);
    }).toThrow(/disallowed keys/);
  });

  it("rejects internalNotes nested", () => {
    const withNotes = {
      ...baseExport,
      evaluation: { ...baseExport.evaluation, internalNotes: "confidential" },
    };
    expect(() => {
      const s = sanitizeExportData(withNotes);
      assertNoSecrets(s);
    }).toThrow(/disallowed keys/);
  });

  it("rejects object with too munknown keys (max object keys guard)", () => {
    const munknownKeys: Record<string, unknown> = { ...baseExport };
    for (let i = 0; i < 600; i++) {
      munknownKeys[`key${i}`] = "value";
    }
    expect(() => sanitizeExportData(munknownKeys)).toThrow(/max 500/);
  });

  it("whitelists only allowed top-level keys", () => {
    const withExtra = {
      ...baseExport,
      _internal: "strip me",
      __proto__: {},
      forbiddenKey: "strip me",
    };
    const sanitized = sanitizeExportData(withExtra);
    expect(sanitized._internal).toBeUndefined();
    expect(sanitized.forbiddenKey).toBeUndefined();
    expect(sanitized.evaluation).toBeDefined();
  });

  it("rejects OpenAI-style API key in value", () => {
    const withSk = {
      ...baseExport,
      evaluation: {
        ...baseExport.evaluation,
        config: "use key sk-proj-abcdefghijklmnopqrstuvwxyz123",
      },
    };
    const sanitized = sanitizeExportData(withSk);
    expect(() => assertNoSecrets(sanitized)).toThrow(/disallowed/);
  });

  it("rejects Bearer token in value", () => {
    const withBearer = {
      ...baseExport,
      testResults: [{ output: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx.yyy" }],
    };
    const sanitized = sanitizeExportData(withBearer);
    expect(() => assertNoSecrets(sanitized)).toThrow(/disallowed/);
  });

  it("rejects JWT-like value", () => {
    const withJwt = {
      ...baseExport,
      evaluation: {
        ...baseExport.evaluation,
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      },
    };
    const sanitized = sanitizeExportData(withJwt);
    expect(() => assertNoSecrets(sanitized)).toThrow(/disallowed/);
  });

  it("rejects circular reference", () => {
    const circular: Record<string, unknown> = { ...baseExport };
    circular.self = circular;
    expect(() => assertNoSecrets(circular)).toThrow(/disallowed/);
  });

  it("rejects deeply nested structure (maxDepth)", () => {
    let deep: Record<string, unknown> = { evaluation: baseExport.evaluation };
    for (let i = 0; i < 55; i++) {
      deep = { evaluation: deep };
    }
    const sanitized = sanitizeExportData(deep);
    expect(() => assertNoSecrets(sanitized)).toThrow(/disallowed/);
  });
});

describe("stableStringify + computeExportHash", () => {
  it("produces identical output for same content with different key order", () => {
    const a = { z: 1, a: { y: 2, x: 3 }, b: [4, 5] };
    const b = { b: [4, 5], a: { x: 3, y: 2 }, z: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("computeExportHash is stable for nested key order", () => {
    const a = { evaluation: { name: "Test", id: "1" }, summary: { passed: 8, failed: 2 } };
    const b = { summary: { failed: 2, passed: 8 }, evaluation: { id: "1", name: "Test" } };
    expect(computeExportHash(a)).toBe(computeExportHash(b));
  });

  it("computeExportHash differs when content differs", () => {
    const a = { evaluation: { name: "Test" } };
    const b = { evaluation: { name: "Other" } };
    expect(computeExportHash(a)).not.toBe(computeExportHash(b));
  });

  it("republish with only published_at changed does NOT change exportHash", () => {
    const coreExport = {
      evaluation: { id: "1", name: "Test" },
      summary: { totalTests: 10, passed: 8 },
    };
    const withMetadata1 = { ...coreExport, published_at: "2024-01-01T00:00:00Z", share_id: "abc" };
    const withMetadata2 = { ...coreExport, published_at: "2024-06-15T12:00:00Z", public: true };
    const sanitized1 = sanitizeExportData(withMetadata1);
    const sanitized2 = sanitizeExportData(withMetadata2);
    expect(computeExportHash(sanitized1)).toBe(computeExportHash(sanitized2));
  });

  it("hash stability across deep nested key order changes", () => {
    const deep1 = {
      a: { z: 1, y: { c: 3, b: 2 }, x: [1, 2, 3] },
      b: { nested: { f: 6, e: 5, d: 4 } },
    };
    const deep2 = {
      b: { nested: { d: 4, e: 5, f: 6 } },
      a: { x: [1, 2, 3], y: { b: 2, c: 3 }, z: 1 },
    };
    expect(computeExportHash(deep1)).toBe(computeExportHash(deep2));
  });
});
