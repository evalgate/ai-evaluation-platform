import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { env, resetEnvCache } from "@/lib/env";

describe("Environment variable validation", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		resetEnvCache();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		resetEnvCache();
	});

	it("passes with valid required variables", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		process.env.BETTER_AUTH_SECRET = "test-secret-value-here";
		process.env.NODE_ENV = "test";

		expect(() => env()).not.toThrow();
		const result = env();
		expect(result.DATABASE_URL).toBe(
			"postgresql://user:pass@localhost:5432/evalai",
		);
		expect(result.NODE_ENV).toBe("test");
	});

	it("throws on missing DATABASE_URL", () => {
		delete process.env.DATABASE_URL;
		process.env.BETTER_AUTH_SECRET = "secret";

		expect(() => env()).toThrow("Invalid environment variables");
	});

	it("throws on missing BETTER_AUTH_SECRET", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		delete process.env.BETTER_AUTH_SECRET;

		expect(() => env()).toThrow("Invalid environment variables");
	});

	it("throws on invalid DATABASE_URL format", () => {
		process.env.DATABASE_URL = "not-a-url";
		process.env.BETTER_AUTH_SECRET = "secret";

		expect(() => env()).toThrow("Invalid environment variables");
	});

	it("defaults NODE_ENV to development", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		process.env.BETTER_AUTH_SECRET = "secret";
		delete process.env.NODE_ENV;

		const result = env();
		expect(result.NODE_ENV).toBe("development");
	});

	it("accepts valid optional variables", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		process.env.BETTER_AUTH_SECRET = "secret";
		process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io";
		process.env.MAX_JOBS_PER_RUN = "50";
		process.env.RUNNER_TIME_BUDGET_MS = "30000";

		const result = env();
		expect(result.UPSTASH_REDIS_REST_URL).toBe("https://fake-redis.upstash.io");
		expect(result.MAX_JOBS_PER_RUN).toBe(50);
		expect(result.RUNNER_TIME_BUDGET_MS).toBe(30000);
	});

	it("caches the result after first call", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		process.env.BETTER_AUTH_SECRET = "secret";

		const first = env();
		const second = env();
		expect(first).toBe(second);
	});

	it("rejects invalid NODE_ENV values", () => {
		process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/evalai";
		process.env.BETTER_AUTH_SECRET = "secret";
		process.env.NODE_ENV = "staging";

		expect(() => env()).toThrow("Invalid environment variables");
	});
});
