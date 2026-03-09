import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	GET as getWorkflowHandoffs,
	POST as postWorkflowHandoff,
} from "@/app/api/workflows/[id]/handoffs/route";
import { GET as getWorkflowRun } from "@/app/api/workflows/[id]/runs/[runId]/route";
import { db } from "@/db";
import {
	agentHandoffs,
	organizationMembers,
	organizations,
	traces,
	user,
	workflowRuns,
	workflows,
} from "@/db/schema";

vi.mock("@/lib/api-rate-limit", () => ({
	withRateLimit: vi.fn(
		async (_req: Request, handler: (req: Request) => Promise<Response>) =>
			handler(_req),
	),
}));

vi.mock("@/lib/api/request-id", () => ({
	extractOrGenerateRequestId: () => "test-request-id",
	runWithRequestIdAsync: (_id: string, fn: () => Promise<Response>) => fn(),
	getRequestId: () => "test-request-id",
	setRequestContext: () => {},
	getRequestContext: () => ({}),
}));

const { requireAuth, requireAuthWithOrg } = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	requireAuthWithOrg: vi.fn(),
}));

vi.mock("@/lib/autumn-server", () => ({
	requireAuth,
	requireAuthWithOrg,
}));

let ORG_A_ID: number;
let ORG_B_ID: number;
let WORKFLOW_A_ID: number;
let WORKFLOW_A_2_ID: number;
let RUN_A_ID: number;
let USER_A_ID: string;
let USER_B_ID: string;
let dbReady = false;

describe("Workflow access boundary — cross-tenant and cross-workflow isolation", () => {
	beforeAll(async () => {
		try {
			await db.select().from(organizations).limit(1);
			dbReady = true;
		} catch {
			dbReady = false;
			return;
		}
		if (!dbReady) return;

		const now = new Date();
		const unique = Date.now().toString();
		const definition = {
			nodes: [{ id: "start", type: "agent", name: "Start" }],
			edges: [],
			entrypoint: "start",
		};

		const [orgA] = await db
			.insert(organizations)
			.values({
				name: `Workflow Tenant A ${unique}`,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: organizations.id });
		const [orgB] = await db
			.insert(organizations)
			.values({
				name: `Workflow Tenant B ${unique}`,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: organizations.id });

		ORG_A_ID = orgA.id;
		ORG_B_ID = orgB.id;

		USER_A_ID = `tenant-a-user-${unique}`;
		USER_B_ID = `tenant-b-user-${unique}`;

		await db.insert(user).values([
			{
				id: USER_A_ID,
				name: "Tenant A User",
				email: `tenant-a-${unique}@example.com`,
				emailVerified: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: USER_B_ID,
				name: "Tenant B User",
				email: `tenant-b-${unique}@example.com`,
				emailVerified: true,
				createdAt: now,
				updatedAt: now,
			},
		]);

		await db.insert(organizationMembers).values([
			{
				organizationId: ORG_A_ID,
				userId: USER_A_ID,
				role: "member",
				createdAt: now,
			},
			{
				organizationId: ORG_B_ID,
				userId: USER_B_ID,
				role: "member",
				createdAt: now,
			},
		]);

		const [workflowA] = await db
			.insert(workflows)
			.values({
				name: `Workflow A ${unique}`,
				description: "",
				organizationId: ORG_A_ID,
				definition,
				status: "active",
				createdBy: USER_A_ID,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: workflows.id });
		const [workflowA2] = await db
			.insert(workflows)
			.values({
				name: `Workflow A2 ${unique}`,
				description: "",
				organizationId: ORG_A_ID,
				definition,
				status: "active",
				createdBy: USER_A_ID,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: workflows.id });

		WORKFLOW_A_ID = workflowA.id;
		WORKFLOW_A_2_ID = workflowA2.id;

		const [traceA] = await db
			.insert(traces)
			.values({
				name: `Trace A ${unique}`,
				traceId: `trace-a-${unique}`,
				organizationId: ORG_A_ID,
				status: "completed",
				createdAt: now,
			})
			.returning({ id: traces.id });

		const [runA] = await db
			.insert(workflowRuns)
			.values({
				workflowId: WORKFLOW_A_ID,
				traceId: traceA.id,
				organizationId: ORG_A_ID,
				status: "completed",
				startedAt: now,
				completedAt: now,
				handoffCount: 1,
			})
			.returning({ id: workflowRuns.id });

		RUN_A_ID = runA.id;

		await db.insert(agentHandoffs).values({
			workflowRunId: RUN_A_ID,
			organizationId: ORG_A_ID,
			fromSpanId: "span-1",
			toSpanId: "span-2",
			fromAgent: "planner",
			toAgent: "writer",
			handoffType: "delegation",
			context: { task: "draft" },
			timestamp: now,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	async function assertNormalizedEnvelope(
		res: Response,
		expectedStatus: number,
	) {
		expect(res.status).toBe(expectedStatus);
		const data = await res.json();
		expect(data.error).toBeDefined();
		expect(data.error.code).toBeDefined();
		expect(data.error.message).toBeDefined();
		expect(data.error.requestId).toBeDefined();
		return data;
	}

	it("Tenant B cannot get Tenant A workflow run by ID (404)", async () => {
		if (!dbReady) return;

		requireAuthWithOrg.mockResolvedValue({
			authenticated: true,
			userId: USER_B_ID,
			organizationId: ORG_B_ID,
			role: "member",
			scopes: ["runs:read"],
			authType: "apiKey",
		});

		const req = new NextRequest(
			`http://localhost/api/workflows/${WORKFLOW_A_ID}/runs/${RUN_A_ID}`,
		);
		const res = await getWorkflowRun(req, {
			params: Promise.resolve({
				id: String(WORKFLOW_A_ID),
				runId: String(RUN_A_ID),
			}),
		});

		const data = await assertNormalizedEnvelope(res, 404);
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("Tenant A cannot fetch a run through another workflow path in the same org (404)", async () => {
		if (!dbReady) return;

		requireAuthWithOrg.mockResolvedValue({
			authenticated: true,
			userId: USER_A_ID,
			organizationId: ORG_A_ID,
			role: "member",
			scopes: ["runs:read"],
			authType: "apiKey",
		});

		const req = new NextRequest(
			`http://localhost/api/workflows/${WORKFLOW_A_2_ID}/runs/${RUN_A_ID}`,
		);
		const res = await getWorkflowRun(req, {
			params: Promise.resolve({
				id: String(WORKFLOW_A_2_ID),
				runId: String(RUN_A_ID),
			}),
		});

		const data = await assertNormalizedEnvelope(res, 404);
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("Tenant B cannot list Tenant A handoffs by runId (404)", async () => {
		if (!dbReady) return;

		requireAuthWithOrg.mockResolvedValue({
			authenticated: true,
			userId: USER_B_ID,
			organizationId: ORG_B_ID,
			role: "member",
			scopes: ["runs:read"],
			authType: "apiKey",
		});

		const req = new NextRequest(
			`http://localhost/api/workflows/${WORKFLOW_A_ID}/handoffs?runId=${RUN_A_ID}`,
		);
		const res = await getWorkflowHandoffs(req, {
			params: Promise.resolve({ id: String(WORKFLOW_A_ID) }),
		});

		const data = await assertNormalizedEnvelope(res, 404);
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("Tenant A cannot create a handoff against a run through another workflow path (404)", async () => {
		if (!dbReady) return;

		requireAuthWithOrg.mockResolvedValue({
			authenticated: true,
			userId: USER_A_ID,
			organizationId: ORG_A_ID,
			role: "member",
			scopes: ["runs:write"],
			authType: "apiKey",
		});

		const req = new NextRequest(
			`http://localhost/api/workflows/${WORKFLOW_A_2_ID}/handoffs`,
			{
				method: "POST",
				body: JSON.stringify({
					workflowRunId: RUN_A_ID,
					toSpanId: "span-3",
					toAgent: "reviewer",
					handoffType: "delegation",
				}),
				headers: { "Content-Type": "application/json" },
			},
		);
		const res = await postWorkflowHandoff(req, {
			params: Promise.resolve({ id: String(WORKFLOW_A_2_ID) }),
		});

		const data = await assertNormalizedEnvelope(res, 404);
		expect(data.error.code).toBe("NOT_FOUND");
	});

	it("Tenant A can read own workflow handoffs (200)", async () => {
		if (!dbReady) return;

		requireAuthWithOrg.mockResolvedValue({
			authenticated: true,
			userId: USER_A_ID,
			organizationId: ORG_A_ID,
			role: "member",
			scopes: ["runs:read"],
			authType: "apiKey",
		});

		const req = new NextRequest(
			`http://localhost/api/workflows/${WORKFLOW_A_ID}/handoffs?runId=${RUN_A_ID}`,
		);
		const res = await getWorkflowHandoffs(req, {
			params: Promise.resolve({ id: String(WORKFLOW_A_ID) }),
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data)).toBe(true);
		expect(data).toHaveLength(1);
	});
});
