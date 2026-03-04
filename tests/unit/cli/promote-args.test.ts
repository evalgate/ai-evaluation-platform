/**
 * Unit tests for CLI promote argument parsing.
 */
import { describe, expect, it } from "vitest";
import { parsePromoteArgs } from "@/packages/sdk/src/cli/promote";

describe("parsePromoteArgs", () => {
	it("parses candidate ID as positional arg", () => {
		const result = parsePromoteArgs(["42"]);
		expect(result.candidateId).toBe("42");
	});

	it("parses --auto flag", () => {
		const result = parsePromoteArgs(["--auto"]);
		expect(result.auto).toBe(true);
		expect(result.candidateId).toBeUndefined();
	});

	it("parses --list flag", () => {
		const result = parsePromoteArgs(["--list"]);
		expect(result.list).toBe(true);
	});

	it("parses --evaluation-id", () => {
		const result = parsePromoteArgs(["42", "--evaluation-id", "99"]);
		expect(result.candidateId).toBe("42");
		expect(result.evaluationId).toBe("99");
	});

	it("parses --apiKey and --baseUrl", () => {
		const result = parsePromoteArgs([
			"--apiKey",
			"sk-test",
			"--baseUrl",
			"https://api.example.com",
		]);
		expect(result.apiKey).toBe("sk-test");
		expect(result.baseUrl).toBe("https://api.example.com");
	});

	it("returns empty object for no args", () => {
		const result = parsePromoteArgs([]);
		expect(result.candidateId).toBeUndefined();
		expect(result.auto).toBeUndefined();
		expect(result.list).toBeUndefined();
	});
});
