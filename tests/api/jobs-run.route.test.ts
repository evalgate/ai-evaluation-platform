import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResult = {
	processed: 2,
	failed: 0,
	reclaimed: 0,
	deadLettered: 0,
	stoppedEarly: false,
	runtimeMs: 10,
};

vi.mock("@/lib/jobs/runner", () => ({
	runDueJobs: vi.fn(async () => mockResult),
}));

const { runDueJobs } = await import("@/lib/jobs/runner");
const { POST } = await import("@/app/api/jobs/run/route");

describe("POST /api/jobs/run", () => {
	const secret = "cron-secret";

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.CRON_SECRET = secret;
	});

	it("rejects requests without valid CRON_SECRET", async () => {
		const request = new NextRequest("http://localhost/api/jobs/run", {
			headers: { authorization: "Bearer bad" },
		});

		const res = await POST(request);

		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body.error?.code).toBe("UNAUTHORIZED");
		expect(runDueJobs).not.toHaveBeenCalled();
	});

	it("runs due jobs when proper secret provided", async () => {
		const request = new NextRequest("http://localhost/api/jobs/run", {
			headers: { authorization: `Bearer ${secret}` },
		});

		const res = await POST(request);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		expect(body.processed).toBe(mockResult.processed);
		expect(runDueJobs).toHaveBeenCalledTimes(1);
	});
});
