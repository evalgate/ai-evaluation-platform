import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
	Redis: class MockRedis {
		static fromEnv() {
			throw new Error("Redis not configured");
		}
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("redis-cache (not configured)", () => {
	beforeEach(() => {
		delete process.env.UPSTASH_REDIS_REST_URL;
		delete process.env.UPSTASH_REDIS_REST_TOKEN;
	});

	it("get returns null/undefined when redis is not configured", async () => {
		const mod = await import("@/lib/redis-cache");
		const val = await mod.cache.get("k1");
		expect(val == null).toBe(true);
	});

	it("set does not throw when redis is not configured", async () => {
		const mod = await import("@/lib/redis-cache");
		await expect(mod.cache.set("k1", "v1", 60)).resolves.not.toThrow();
	});
});
