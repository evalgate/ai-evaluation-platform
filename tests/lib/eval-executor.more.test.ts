import { beforeEach, describe, expect, it, vi } from "vitest";
import { createExecutor } from "@/lib/services/eval-executor";

describe("eval-executor (more)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("webhook executor maps non-200 to deterministic error result", async () => {
		global.fetch = vi.fn(async () => {
			return new Response(JSON.stringify({ error: "bad" }), { status: 500 });
		}) as unknown as typeof fetch;

		const executor = createExecutor(
			"webhook" as unknown as "webhook",
			{ url: "https://example.com/hook" } as unknown as { url: string },
			1,
		);

		// The webhook executor throws an error when response is not ok
		await expect(executor.run("hello", { traceId: "t1" })).rejects.toThrow(
			'Webhook error (500): {"error":"bad"}',
		);
	});

	it("webhook executor returns output on 200", async () => {
		global.fetch = vi.fn(async () => {
			return new Response(JSON.stringify({ output: "ok" }), { status: 200 });
		}) as unknown as typeof fetch;

		const executor = createExecutor(
			"webhook" as unknown as "webhook",
			{ url: "https://example.com/hook" } as unknown as { url: string },
			1,
		);

		const result = await executor.run("hello");

		expect(result).toBeTruthy();
		expect(result.output).toBe("ok");
	});
});
