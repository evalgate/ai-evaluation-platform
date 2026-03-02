import { describe, expect, it } from "vitest";
import { signReport, verifyReport } from "@/lib/reports/sign";

// ── signReport ────────────────────────────────────────────────────────────────

describe("signReport", () => {
	it("returns body and sig", () => {
		const { body, sig } = signReport({ score: 0.9, runId: "r1" }, "secret");
		expect(typeof body).toBe("string");
		expect(typeof sig).toBe("string");
	});

	it("body is valid JSON matching the payload", () => {
		const payload = { score: 0.9, runId: "r1" };
		const { body } = signReport(payload, "secret");
		expect(JSON.parse(body)).toEqual(payload);
	});

	it("sig is a 64-char hex string (SHA-256)", () => {
		const { sig } = signReport({}, "secret");
		expect(sig).toMatch(/^[0-9a-f]{64}$/);
	});

	it("produces different signatures for different secrets", () => {
		const payload = { x: 1 };
		const { sig: sig1 } = signReport(payload, "secret-a");
		const { sig: sig2 } = signReport(payload, "secret-b");
		expect(sig1).not.toBe(sig2);
	});

	it("produces different signatures for different payloads", () => {
		const { sig: sig1 } = signReport({ a: 1 }, "secret");
		const { sig: sig2 } = signReport({ a: 2 }, "secret");
		expect(sig1).not.toBe(sig2);
	});

	it("is deterministic — same payload + secret = same sig", () => {
		const payload = { runId: "r42", score: 0.88 };
		const { sig: sig1 } = signReport(payload, "my-secret");
		const { sig: sig2 } = signReport(payload, "my-secret");
		expect(sig1).toBe(sig2);
	});
});

// ── verifyReport ──────────────────────────────────────────────────────────────

describe("verifyReport", () => {
	it("returns true for a valid signature", () => {
		const payload = { score: 0.9, runId: "r1" };
		const { body, sig } = signReport(payload, "secret");
		expect(verifyReport(body, sig, "secret")).toBe(true);
	});

	it("returns false when sig is tampered", () => {
		const { body } = signReport({ x: 1 }, "secret");
		const fakeSig = "a".repeat(64);
		expect(verifyReport(body, fakeSig, "secret")).toBe(false);
	});

	it("returns false when body is tampered", () => {
		const { sig } = signReport({ x: 1 }, "secret");
		const tamperedBody = JSON.stringify({ x: 2 });
		expect(verifyReport(tamperedBody, sig, "secret")).toBe(false);
	});

	it("returns false when secret is wrong", () => {
		const { body, sig } = signReport({ x: 1 }, "correct-secret");
		expect(verifyReport(body, sig, "wrong-secret")).toBe(false);
	});

	it("returns false for empty sig string", () => {
		const { body } = signReport({ x: 1 }, "secret");
		expect(verifyReport(body, "", "secret")).toBe(false);
	});

	it("returns false for sig of wrong length", () => {
		const { body } = signReport({ x: 1 }, "secret");
		expect(verifyReport(body, "abc", "secret")).toBe(false);
	});

	it("round-trips sign → verify for complex nested payload", () => {
		const payload = {
			runId: "run-123",
			results: [
				{ testCaseId: 1, score: 0.9, passed: true },
				{ testCaseId: 2, score: 0.6, passed: false },
			],
			meta: { env: "production", commitSha: "abc123" },
		};
		const { body, sig } = signReport(payload, "signing-key");
		expect(verifyReport(body, sig, "signing-key")).toBe(true);
	});
});
