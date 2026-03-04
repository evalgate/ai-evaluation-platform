/**
 * Unit tests for CLI replay argument parsing.
 */
import { describe, expect, it } from "vitest";
import { parseReplayArgs } from "@/packages/sdk/src/cli/replay";

describe("parseReplayArgs", () => {
	it("parses candidate ID as positional arg", () => {
		const result = parseReplayArgs(["42"]);
		expect(result.candidateId).toBe("42");
	});

	it("parses --model flag", () => {
		const result = parseReplayArgs(["42", "--model", "gpt-4o"]);
		expect(result.candidateId).toBe("42");
		expect(result.model).toBe("gpt-4o");
	});

	it("parses --format flag", () => {
		const result = parseReplayArgs(["42", "--format", "json"]);
		expect(result.format).toBe("json");
	});

	it("parses --apiKey and --baseUrl", () => {
		const result = parseReplayArgs([
			"--apiKey",
			"sk-test",
			"--baseUrl",
			"https://api.example.com",
			"42",
		]);
		expect(result.apiKey).toBe("sk-test");
		expect(result.baseUrl).toBe("https://api.example.com");
		expect(result.candidateId).toBe("42");
	});

	it("returns empty object for no args", () => {
		const result = parseReplayArgs([]);
		expect(result.candidateId).toBeUndefined();
		expect(result.model).toBeUndefined();
	});
});
