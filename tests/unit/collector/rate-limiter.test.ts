/**
 * Unit tests for the analysis queue rate limiter.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
	canEnqueueAnalysis,
	getAnalysisRate,
	resetRateLimiter,
} from "@/lib/collector/rate-limiter";

describe("canEnqueueAnalysis", () => {
	afterEach(() => {
		resetRateLimiter();
	});

	const config = { maxPerWindow: 3, windowMs: 1000 };

	it("allows enqueue under the limit", () => {
		expect(canEnqueueAnalysis(1, config, 1000)).toBe(true);
		expect(canEnqueueAnalysis(1, config, 1001)).toBe(true);
		expect(canEnqueueAnalysis(1, config, 1002)).toBe(true);
	});

	it("rejects enqueue at the limit", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1001);
		canEnqueueAnalysis(1, config, 1002);
		expect(canEnqueueAnalysis(1, config, 1003)).toBe(false);
	});

	it("allows enqueue after window expires", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1001);
		canEnqueueAnalysis(1, config, 1002);
		// Window is 1000ms — at t=2001, t=1000 has expired
		expect(canEnqueueAnalysis(1, config, 2001)).toBe(true);
	});

	it("tracks orgs independently", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1001);
		canEnqueueAnalysis(1, config, 1002);
		// Org 1 is at limit, org 2 should be fine
		expect(canEnqueueAnalysis(1, config, 1003)).toBe(false);
		expect(canEnqueueAnalysis(2, config, 1003)).toBe(true);
	});

	it("evicts old timestamps correctly", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1500);
		canEnqueueAnalysis(1, config, 1800);
		// At t=2100, t=1000 is outside window (2100-1000=1100 > 1000ms)
		// So only 2 remain (1500, 1800), room for 1 more
		expect(canEnqueueAnalysis(1, config, 2100)).toBe(true);
		// Now at 3 again
		expect(canEnqueueAnalysis(1, config, 2101)).toBe(false);
	});
});

describe("getAnalysisRate", () => {
	afterEach(() => {
		resetRateLimiter();
	});

	const config = { maxPerWindow: 10, windowMs: 1000 };

	it("returns 0 for unknown org", () => {
		const rate = getAnalysisRate(999, config, 1000);
		expect(rate.current).toBe(0);
		expect(rate.max).toBe(10);
	});

	it("returns correct count after enqueues", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1001);
		const rate = getAnalysisRate(1, config, 1002);
		expect(rate.current).toBe(2);
	});

	it("excludes expired timestamps", () => {
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(1, config, 1500);
		const rate = getAnalysisRate(1, config, 2100);
		expect(rate.current).toBe(1); // only 1500 is within window
	});
});

describe("resetRateLimiter", () => {
	it("clears specific org", () => {
		const config = { maxPerWindow: 1, windowMs: 1000 };
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(2, config, 1000);
		resetRateLimiter(1);
		expect(canEnqueueAnalysis(1, config, 1001)).toBe(true);
		expect(canEnqueueAnalysis(2, config, 1001)).toBe(false);
	});

	it("clears all orgs", () => {
		const config = { maxPerWindow: 1, windowMs: 1000 };
		canEnqueueAnalysis(1, config, 1000);
		canEnqueueAnalysis(2, config, 1000);
		resetRateLimiter();
		expect(canEnqueueAnalysis(1, config, 1001)).toBe(true);
		expect(canEnqueueAnalysis(2, config, 1001)).toBe(true);
	});
});
