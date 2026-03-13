import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type OrgRole = "viewer" | "member" | "admin" | "owner";

const h = vi.hoisted(() => ({
	parseBody: vi.fn(),
	parseIdParam: vi.fn((value: string) => Number(value)),
	listAutoSessions: vi.fn(),
	createAutoSession: vi.fn(),
	startAutoSession: vi.fn(),
	getAutoSessionStatus: vi.fn(),
	stopAutoSession: vi.fn(),
	sessionLookupResult: [{ id: "auto_session_1" }],
	role: "member" as OrgRole,
}));

class MockAutoSessionServiceError extends Error {
	code: "NOT_FOUND" | "CONFLICT" | "VALIDATION";

	constructor(message: string, code: "NOT_FOUND" | "CONFLICT" | "VALIDATION") {
		super(message);
		this.name = "AutoSessionServiceError";
		this.code = code;
	}
}

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => h.sessionLookupResult),
				})),
			})),
		})),
	},
}));

vi.mock("@/db/schema", () => ({
	autoSessions: {
		id: "id",
		evaluationId: "evaluationId",
		organizationId: "organizationId",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: vi.fn(),
	eq: vi.fn(),
}));

vi.mock("@/lib/api/parse", () => ({
	parseBody: (req: NextRequest, schema: unknown, options?: unknown) =>
		h.parseBody(req, schema, options),
}));

vi.mock("@/lib/validation", () => ({
	parseIdParam: (value: string) => h.parseIdParam(value),
}));

vi.mock("@/lib/api/errors", () => ({
	validationError: vi.fn(
		(message: string) =>
			new Response(JSON.stringify({ error: { message } }), {
				status: 400,
				headers: { "content-type": "application/json" },
			}),
	),
	forbidden: vi.fn(
		(message: string) =>
			new Response(JSON.stringify({ error: { message } }), {
				status: 403,
				headers: { "content-type": "application/json" },
			}),
	),
	notFound: vi.fn(
		(message: string) =>
			new Response(JSON.stringify({ error: { message } }), {
				status: 404,
				headers: { "content-type": "application/json" },
			}),
	),
	conflict: vi.fn(
		(message: string) =>
			new Response(JSON.stringify({ error: { message } }), {
				status: 409,
				headers: { "content-type": "application/json" },
			}),
	),
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			return (
				handler as (
					request: NextRequest,
					ctx: {
						userId: string;
						organizationId: number;
						role: OrgRole;
						scopes: string[];
						authType: string;
					},
					params: Record<string, string>,
				) => unknown
			)(
				req,
				{
					userId: "test-user",
					organizationId: 1,
					role: h.role,
					scopes: ["eval:read", "eval:write"],
					authType: "session",
				},
				params,
			);
		};
	},
}));

vi.mock("@/lib/auth/scopes", () => ({
	SCOPES: {
		EVAL_READ: "eval:read",
		EVAL_WRITE: "eval:write",
	},
}));

vi.mock("@/lib/services/auto-session.service", () => ({
	AutoSessionServiceError: MockAutoSessionServiceError,
	listAutoSessions: (evaluationId: number, organizationId: number) =>
		h.listAutoSessions(evaluationId, organizationId),
	createAutoSession: (input: unknown) => h.createAutoSession(input),
	startAutoSession: (sessionId: string, organizationId: number) =>
		h.startAutoSession(sessionId, organizationId),
	getAutoSessionStatus: (sessionId: string, organizationId: number) =>
		h.getAutoSessionStatus(sessionId, organizationId),
	stopAutoSession: (sessionId: string, organizationId: number) =>
		h.stopAutoSession(sessionId, organizationId),
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { GET: listGET, POST: createPOST } = await import(
	"@/app/api/evaluations/[id]/auto-sessions/route"
);
const { POST: runPOST } = await import(
	"@/app/api/evaluations/[id]/auto-sessions/[sessionId]/run/route"
);
const { GET: statusGET } = await import(
	"@/app/api/evaluations/[id]/auto-sessions/[sessionId]/status/route"
);
const { POST: stopPOST } = await import(
	"@/app/api/evaluations/[id]/auto-sessions/[sessionId]/stop/route"
);

describe("auto session evaluation routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.role = "member";
		h.parseIdParam.mockImplementation((value: string) => Number(value));
		h.sessionLookupResult = [{ id: "auto_session_1" }];
		h.parseBody.mockResolvedValue({
			ok: true,
			data: {
				name: "Tone mismatch repair",
				objective: "Reduce tone mismatch failures",
				targetPath: "prompts/support.md",
				allowedFamilies: ["few-shot-examples", "instruction-order"],
				maxIterations: 4,
				maxCostUsd: 1.5,
			},
		});
	});

	it("lists auto sessions for the evaluation", async () => {
		h.listAutoSessions.mockResolvedValue([
			{
				sessionId: "auto_session_1",
				name: "Tone mismatch repair",
				status: "idle",
				currentIteration: 0,
				maxIterations: 4,
				createdAt: "2026-03-13T00:00:00.000Z",
			},
		]);

		const response = await listGET(
			new NextRequest("http://localhost/api/evaluations/123/auto-sessions"),
			{
				params: Promise.resolve({ id: "123" }),
			} as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.sessions).toHaveLength(1);
		expect(h.listAutoSessions).toHaveBeenCalledWith(123, 1);
	});

	it("creates a new auto session", async () => {
		h.createAutoSession.mockResolvedValue({ sessionId: "auto_session_1" });

		const response = await createPOST(
			new NextRequest("http://localhost/api/evaluations/123/auto-sessions", {
				method: "POST",
				body: JSON.stringify({ name: "ignored-by-mock" }),
				headers: { "content-type": "application/json" },
			}),
			{ params: Promise.resolve({ id: "123" }) } as never,
		);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body).toMatchObject({ sessionId: "auto_session_1", status: "idle" });
		expect(h.createAutoSession).toHaveBeenCalledWith({
			organizationId: 1,
			evaluationId: 123,
			createdBy: "test-user",
			name: "Tone mismatch repair",
			objective: "Reduce tone mismatch failures",
			targetPath: "prompts/support.md",
			allowedFamilies: ["few-shot-examples", "instruction-order"],
			maxIterations: 4,
			maxCostUsd: 1.5,
		});
	});

	it("starts an existing auto session run", async () => {
		h.startAutoSession.mockResolvedValue({
			jobId: "job_auto_1",
			status: "queued",
		});

		const response = await runPOST(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/auto_session_1/run",
				{ method: "POST" },
			),
			{
				params: Promise.resolve({ id: "123", sessionId: "auto_session_1" }),
			} as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			sessionId: "auto_session_1",
			jobId: "job_auto_1",
			status: "queued",
		});
		expect(h.startAutoSession).toHaveBeenCalledWith("auto_session_1", 1);
	});

	it("returns session status for an existing auto session", async () => {
		h.getAutoSessionStatus.mockResolvedValue({
			sessionId: "auto_session_1",
			name: "Tone mismatch repair",
			objective: "Reduce tone mismatch failures",
			status: "running",
			currentIteration: 2,
			maxIterations: 4,
			experiments: [],
			bestExperiment: null,
			budgetUsed: { iterations: 2, costUsd: 0.42 },
			startedAt: "2026-03-13T00:01:00.000Z",
			completedAt: null,
			stopReason: null,
			error: null,
		});

		const response = await statusGET(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/auto_session_1/status",
			),
			{
				params: Promise.resolve({ id: "123", sessionId: "auto_session_1" }),
			} as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe("running");
		expect(h.getAutoSessionStatus).toHaveBeenCalledWith("auto_session_1", 1);
	});

	it("stops an existing auto session", async () => {
		h.stopAutoSession.mockResolvedValue({ status: "cancelled" });

		const response = await stopPOST(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/auto_session_1/stop",
				{ method: "POST" },
			),
			{
				params: Promise.resolve({ id: "123", sessionId: "auto_session_1" }),
			} as never,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			sessionId: "auto_session_1",
			status: "cancelled",
		});
		expect(h.stopAutoSession).toHaveBeenCalledWith("auto_session_1", 1);
	});

	it("returns 404 when starting a session that does not belong to the evaluation", async () => {
		h.sessionLookupResult = [];

		const response = await runPOST(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/missing/run",
				{ method: "POST" },
			),
			{ params: Promise.resolve({ id: "123", sessionId: "missing" }) } as never,
		);

		expect(response.status).toBe(404);
		expect(h.startAutoSession).not.toHaveBeenCalled();
	});

	it("returns 403 when a viewer tries to create an auto session", async () => {
		h.role = "viewer";

		const response = await createPOST(
			new NextRequest("http://localhost/api/evaluations/123/auto-sessions", {
				method: "POST",
				body: JSON.stringify({ name: "ignored-by-mock" }),
				headers: { "content-type": "application/json" },
			}),
			{ params: Promise.resolve({ id: "123" }) } as never,
		);

		expect(response.status).toBe(403);
		expect(h.createAutoSession).not.toHaveBeenCalled();
	});

	it("returns 403 when a viewer tries to start an auto session", async () => {
		h.role = "viewer";

		const response = await runPOST(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/auto_session_1/run",
				{ method: "POST" },
			),
			{
				params: Promise.resolve({ id: "123", sessionId: "auto_session_1" }),
			} as never,
		);

		expect(response.status).toBe(403);
		expect(h.startAutoSession).not.toHaveBeenCalled();
	});

	it("returns 403 when a viewer tries to stop an auto session", async () => {
		h.role = "viewer";

		const response = await stopPOST(
			new NextRequest(
				"http://localhost/api/evaluations/123/auto-sessions/auto_session_1/stop",
				{ method: "POST" },
			),
			{
				params: Promise.resolve({ id: "123", sessionId: "auto_session_1" }),
			} as never,
		);

		expect(response.status).toBe(403);
		expect(h.stopAutoSession).not.toHaveBeenCalled();
	});
});
