import { describe, expect, it } from "vitest";
import {
	AuthenticationError,
	EvalGateError,
	NetworkError,
	RateLimitError,
	ValidationError,
} from "../errors";

describe("Error prototype chain (bug fix: Object.setPrototypeOf in subclasses)", () => {
	it("ValidationError.name should be 'ValidationError' not 'EvalGateError'", () => {
		const err = new ValidationError("bad input");
		expect(err.name).toBe("ValidationError");
	});

	it("RateLimitError.name should be 'RateLimitError'", () => {
		const err = new RateLimitError("too many requests");
		expect(err.name).toBe("RateLimitError");
	});

	it("AuthenticationError.name should be 'AuthenticationError'", () => {
		const err = new AuthenticationError();
		expect(err.name).toBe("AuthenticationError");
	});

	it("NetworkError.name should be 'NetworkError'", () => {
		const err = new NetworkError();
		expect(err.name).toBe("NetworkError");
	});

	it("instanceof checks should work through prototype chain", () => {
		const ve = new ValidationError();
		expect(ve).toBeInstanceOf(ValidationError);
		expect(ve).toBeInstanceOf(EvalGateError);
		expect(ve).toBeInstanceOf(Error);
	});

	it("RateLimitError instanceof chain", () => {
		const rl = new RateLimitError("rate limited", 30);
		expect(rl).toBeInstanceOf(RateLimitError);
		expect(rl).toBeInstanceOf(EvalGateError);
	});
});

describe("RateLimitError.retryAfter (bug fix: direct property not just in details)", () => {
	it("should expose retryAfter as a direct property", () => {
		const err = new RateLimitError("slow down", 60);
		expect(err.retryAfter).toBe(60);
	});

	it("should have retryAfter undefined when not provided", () => {
		const err = new RateLimitError("slow down");
		expect(err.retryAfter).toBeUndefined();
	});

	it("should still set the correct code and statusCode", () => {
		const err = new RateLimitError("slow down", 30);
		expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
		expect(err.statusCode).toBe(429);
		expect(err.retryable).toBe(true);
	});
});

describe("ValidationError details", () => {
	it("should carry details payload", () => {
		const err = new ValidationError("bad", { field: "email" });
		expect(err.details).toEqual({ field: "email" });
		expect(err.statusCode).toBe(400);
	});
});

describe("NetworkError", () => {
	it("should be retryable", () => {
		expect(new NetworkError().retryable).toBe(true);
	});
});

describe("EvalGateError base — retryAfter via details (existing path should still work)", () => {
	it("should set retryAfter from details when code is RATE_LIMIT_EXCEEDED", () => {
		const err = new EvalGateError("rate limit", "RATE_LIMIT_EXCEEDED", 429, {
			retryAfter: 90,
		});
		expect(err.retryAfter).toBe(90);
	});
});
