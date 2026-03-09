import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as handler } from "@/app/api/evaluations/route";
import { db } from "@/db";
import { evaluations } from "@/db/schema";
import { parseBody } from "@/lib/api/parse";
import {
	checkFeature,
	guardFeature,
	requireAuthWithOrg,
	trackFeature,
} from "@/lib/autumn-server";
import { logger } from "@/lib/logger";

// Inline mock required: vi.hoisted runs before imports. See tests/helpers/mock-auth.ts for canonical structure.
const autumnServerMock = vi.hoisted(() => {
	const v = (globalThis as { vi?: typeof vi }).vi!;
	const ctx = {
		authenticated: true,
		userId: "test-user",
		organizationId: 1,
		role: "member",
		scopes: [
			"eval:read",
			"eval:write",
			"traces:read",
			"traces:write",
			"runs:read",
			"runs:write",
		],
		authType: "session",
	};
	return {
		checkFeature: v.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
		trackFeature: v.fn().mockResolvedValue({ success: true }),
		guardFeature: v.fn().mockResolvedValue(null),
		requireAuthWithOrg: v.fn().mockResolvedValue(ctx),
		requireAuth: v.fn().mockResolvedValue(ctx),
	};
});

const evaluationInsert = {
	values: vi.fn().mockReturnThis(),
	returning: vi.fn(),
};
const testCaseInsert = {
	values: vi.fn(),
};

vi.mock("@/db", () => ({
	db: {
		insert: vi.fn(),
	},
}));

vi.mock("@/lib/api/parse", () => ({
	parseBody: vi.fn(),
}));

vi.mock("@/lib/autumn-server", () => autumnServerMock);

vi.mock("@/lib/api-rate-limit", () => ({
	withRateLimit: vi.fn(
		async (_req: unknown, handler: (req: unknown) => Promise<Response>) =>
			handler(_req),
	),
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: any) => {
		return async (req: any, props: any) => {
			const ctx = {
				userId: "test-user",
				organizationId: 1,
				role: "member",
				scopes: ["eval:read", "eval:write"],
				authType: "session",
			};
			const params = await props.params;
			return handler(req, ctx, params);
		};
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

const mockedDbInsert = vi.mocked(db.insert);
mockedDbInsert.mockImplementation((table: any) => {
	if (table === evaluations) {
		return evaluationInsert as any;
	}
	return testCaseInsert as any;
});

const routeContext = { params: Promise.resolve({}) } as const;
const baseBody = {
	name: "New Evaluation",
	type: "unit_test",
	templates: [
		{
			testCases: [
				{ name: "template-1", input: "input", expectedOutput: "output" },
			],
		},
	],
	testCases: [{ name: "top-level", input: "calc", expectedOutput: "result" }],
};

const createdEvaluation = {
	id: 42,
	name: baseBody.name,
	type: baseBody.type,
	organizationId: 1,
	description: null,
	status: "draft",
	createdBy: "test-user",
};

describe("POST /api/evaluations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(requireAuthWithOrg).mockResolvedValue({
			authenticated: true,
			userId: "test-user",
			organizationId: 1,
			role: "member",
			scopes: ["eval:read", "eval:write"],
			authType: "session",
		} as any);
		evaluationInsert.values.mockReturnThis();
		evaluationInsert.returning.mockResolvedValue([createdEvaluation]);
		testCaseInsert.values.mockResolvedValue(undefined);
	});

	it("creates an evaluation and persists templates + test cases", async () => {
		vi.mocked(checkFeature)
			.mockResolvedValueOnce({ allowed: true, remaining: 10 })
			.mockResolvedValueOnce({ allowed: true, remaining: 10 });
		vi.mocked(parseBody).mockResolvedValue({ ok: true, data: baseBody });

		const req = new (NextRequest as unknown as typeof Request)(
			"http://localhost:3000/api/evaluations",
			{
				method: "POST",
				body: JSON.stringify(baseBody),
				headers: new Headers({
					"Content-Type": "application/json",
				}),
			},
		);

		const res = await handler(req as any, routeContext as never);

		expect((res as Response).status).toBe(201);
		expect(evaluationInsert.values).toHaveBeenCalledWith(
			expect.objectContaining({ name: baseBody.name, type: baseBody.type }),
		);
		expect(testCaseInsert.values).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ input: "input" }),
				expect.objectContaining({ input: "calc" }),
			]),
		);
		expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				featureId: "evaluation_created",
				idempotencyKey: "evaluation_created-42",
			}),
		);
		expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				featureId: "projects",
				idempotencyKey: "projects-1-42",
			}),
		);
		expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining({
				featureId: "evals_per_project",
				idempotencyKey: "evals_per_project-1-42",
			}),
		);
		expect(vi.mocked(trackFeature)).toHaveBeenCalledTimes(3);
	});

	it("returns 201 even if template persistence fails", async () => {
		vi.mocked(checkFeature)
			.mockResolvedValueOnce({ allowed: true, remaining: 10 })
			.mockResolvedValueOnce({ allowed: true, remaining: 10 });
		vi.mocked(parseBody).mockResolvedValue({ ok: true, data: baseBody });
		testCaseInsert.values.mockRejectedValueOnce(new Error("boom"));

		const req = new (NextRequest as unknown as typeof Request)(
			"http://localhost:3000/api/evaluations",
			{
				method: "POST",
				body: JSON.stringify(baseBody),
				headers: new Headers({
					"Content-Type": "application/json",
				}),
			},
		);

		const res = await handler(req as any, routeContext as never);

		expect((res as Response).status).toBe(201);
		expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
			expect.stringContaining("Failed to persist template test cases"),
			expect.any(Object),
		);
	});

	it("returns quota failure when the projects feature is denied", async () => {
		const { NextResponse } = await import("next/server");
		vi.mocked(guardFeature).mockResolvedValueOnce(
			NextResponse.json(
				{
					error: { code: "QUOTA_EXCEEDED", message: "Projects limit reached." },
				},
				{ status: 403 },
			),
		);

		const req = new (NextRequest as unknown as typeof Request)(
			"http://localhost:3000/api/evaluations",
			{
				method: "POST",
				body: JSON.stringify(baseBody),
				headers: new Headers({
					"Content-Type": "application/json",
				}),
			},
		);

		const res = await handler(req as any, routeContext as never);

		const payload = await (res as Response).json();
		expect((res as Response).status).toBe(403);
		expect(payload.error.code).toBe("QUOTA_EXCEEDED");
		expect(mockedDbInsert).not.toHaveBeenCalled();
	});
});
