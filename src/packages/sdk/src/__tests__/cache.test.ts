import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CacheTTL, RequestCache } from "../cache";

describe("RequestCache", () => {
	let cache: RequestCache;

	beforeEach(() => {
		cache = new RequestCache();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("set/get round-trip", () => {
		it("should return stored value immediately after set", () => {
			cache.set("GET", "/api/traces", { id: 1 });
			const result = cache.get<{ id: number }>("GET", "/api/traces");
			expect(result).toEqual({ id: 1 });
		});

		it("should return null before anything is stored", () => {
			expect(cache.get("GET", "/api/missing")).toBeNull();
		});

		it("should match on method + url + params", () => {
			cache.set("GET", "/api/traces", ["a"], CacheTTL.MEDIUM, { limit: 10 });
			expect(cache.get("GET", "/api/traces", { limit: 10 })).toEqual(["a"]);
			expect(cache.get("GET", "/api/traces", { limit: 99 })).toBeNull();
			expect(cache.get("POST", "/api/traces", { limit: 10 })).toBeNull();
		});
	});

	describe("default TTL (bug fix: set without explicit ttl)", () => {
		it("should be readable immediately when called with no ttl arg", () => {
			cache.set("GET", "/api/eval", { data: true });
			expect(cache.get("GET", "/api/eval")).toEqual({ data: true });
		});

		it("should expire after the default TTL elapses", () => {
			cache.set("GET", "/api/eval", { data: true });
			expect(cache.get("GET", "/api/eval")).not.toBeNull();

			vi.advanceTimersByTime(CacheTTL.MEDIUM + 1);
			expect(cache.get("GET", "/api/eval")).toBeNull();
		});

		it("should remain valid just before the default TTL elapses", () => {
			cache.set("GET", "/api/eval", { data: true });
			vi.advanceTimersByTime(CacheTTL.MEDIUM - 1);
			expect(cache.get("GET", "/api/eval")).toEqual({ data: true });
		});
	});

	describe("explicit TTL override", () => {
		it("should expire after explicit short TTL", () => {
			cache.set("GET", "/api/fast", { x: 1 }, CacheTTL.SHORT);
			vi.advanceTimersByTime(CacheTTL.SHORT + 1);
			expect(cache.get("GET", "/api/fast")).toBeNull();
		});
	});

	describe("invalidation", () => {
		it("should remove a specific entry", () => {
			cache.set("GET", "/api/traces", { id: 1 });
			cache.invalidate("GET", "/api/traces");
			expect(cache.get("GET", "/api/traces")).toBeNull();
		});

		it("clear() removes all entries", () => {
			cache.set("GET", "/api/a", 1);
			cache.set("GET", "/api/b", 2);
			cache.clear();
			expect(cache.get("GET", "/api/a")).toBeNull();
			expect(cache.get("GET", "/api/b")).toBeNull();
		});
	});
});
