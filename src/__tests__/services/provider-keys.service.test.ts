import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock process.env directly
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    PROVIDER_KEY_ENCRYPTION_KEY: "test-key-32-bytes-minimum-length!!",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

const insertReturning = vi.fn();
const updateReturning = vi.fn();
const selectReturning = vi.fn();

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: insertReturning })) })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => ({ returning: updateReturning })) })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => selectReturning()),
        })),
      })),
    })),
  },
}));

// Set up default mock return values
insertReturning.mockResolvedValue([{ id: 1, organizationId: 1 }]);
updateReturning.mockResolvedValue([{ id: 2, revokedAt: new Date().toISOString() }]);
selectReturning.mockResolvedValue([{ id: 1 }]); // Return array for destructuring

vi.mock("@/db/schema", () => ({
  providerKeys: { id: "id", organizationId: "organizationId", revokedAt: "revokedAt" },
  organizations: { id: "id" }, // Add missing organizations export
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const svc = await import("@/lib/services/provider-keys.service");

describe("provider-keys.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create returns inserted key row", async () => {
    insertReturning.mockResolvedValueOnce([{ id: 1, organizationId: 1 }]);
    const res = await (svc as unknown).providerKeysService.createProviderKey?.(
      1,
      { provider: "openai", keyName: "test", keyType: "api_key", apiKey: "sk-test" },
      "user",
    );
    expect(res).toBeTruthy();
  });

  it("revoke returns updated row", async () => {
    updateReturning.mockResolvedValueOnce([{ id: 2, revokedAt: new Date().toISOString() }]);
    const res = await (svc as unknown).providerKeysService.updateProviderKey?.(1, 2, {
      isActive: false,
    });
    expect(res).toBeTruthy();
  });
});
