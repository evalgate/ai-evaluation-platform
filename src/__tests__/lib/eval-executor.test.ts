import { beforeEach, describe, expect, it, vi } from "vitest";
import { DirectLLMExecutor, WebhookExecutor } from "@/lib/services/eval-executor";
import {
  type DecryptedProviderKey,
  providerKeysService,
} from "@/lib/services/provider-keys.service";

vi.mock("@/lib/services/provider-keys.service", () => ({
  providerKeysService: {
    getActiveProviderKey: vi.fn(),
  },
}));

describe("eval executor error handling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("throws deterministic error when OpenAI provider responds with non-ok", async () => {
    vi.mocked(providerKeysService.getActiveProviderKey).mockResolvedValue({
      organizationId: 1,
      id: 1,
      provider: "openai",
      keyName: "key",
      keyType: "api_key",
      keyPrefix: "sk_test",
      decryptedKey: "secret",
      metadata: {},
      isActive: true,
      lastUsedAt: null,
      expiresAt: null,
      createdBy: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as DecryptedProviderKey);

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: async () => "bad stuff",
        } as Response),
      ),
    );

    const executor = new DirectLLMExecutor(1, "gpt-4o-mini", "openai");

    await expect(executor.run("input")).rejects.toThrow("OpenAI API error (401): bad stuff");
  });

  it("throws when webhook provider returns error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: async () => "webhook failure",
        } as Response),
      ),
    );

    const executor = new WebhookExecutor("http://example.com", "secret");

    await expect(executor.run("test", { metadata: {} })).rejects.toThrow(
      "Webhook error (500): webhook failure",
    );
  });
});
