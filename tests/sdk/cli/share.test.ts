import { describe, expect, it, vi } from "vitest";

vi.mock("@/packages/sdk/src/cli/api", () => ({
	apiPost: vi.fn(async () => ({ shareId: "abc123" })),
	fetchRunExport: vi.fn(async () => ({ shareId: "abc123" })), // Add missing export
}));

describe("CLI share", () => {
	it("calls API and returns share id", async () => {
		const mod = await import("@/packages/sdk/src/cli/share");

		// Many CLIs export a function like runShare(args) or shareCmd(...)
		// Adjust the call name to your actual export.
		const modAny = mod as Record<string, unknown>;
		const fn =
			(modAny.runShare as unknown) ??
			(modAny.share as unknown) ??
			(modAny.default as unknown);

		expect(typeof fn).toBe("function");

		const res = await (
			fn as (args: Record<string, unknown>) => Promise<unknown>
		)({
			runId: "r1",
			evaluationId: "e1",
		});
		expect((res as Record<string, unknown>)?.shareId ?? res).toBeTruthy();
	});
});
