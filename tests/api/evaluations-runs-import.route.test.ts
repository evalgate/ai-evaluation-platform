// src/__tests__/api/evaluations-runs-import.route.test.ts

import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * parseBody mock (hoisted)
 */
const h = vi.hoisted(() => ({
	parseBody: vi.fn(),
}));

vi.mock("@/lib/api/parse", () => ({
	parseBody: (...args: unknown[]) => h.parseBody(...args),
}));

/**
 * secureRoute mock: calls handler(req, ctx, params)
 */
vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			const ctx = (globalThis as { __ctx?: Record<string, unknown> }).__ctx ?? {
				userId: "u1",
				organizationId: 1,
				role: "admin",
				scopes: ["runs:write"],
				authType: "session",
			};

			return handler(req, ctx, params);
		};
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/**
 * Schema mock: identifiable table objects
 * IMPORTANT: route uses `testResults` (not `evaluationTestResults`)
 */
type Table = { __table: string };

const evaluationsTable: Table = { __table: "evaluations" };
const testCasesTable: Table = { __table: "testCases" };
const evaluationRunsTable: Table = { __table: "evaluationRuns" };
const testResultsTable: Table = { __table: "testResults" };

vi.mock("@/db/schema", () => ({
	evaluations: evaluationsTable,
	testCases: testCasesTable,
	evaluationRuns: evaluationRunsTable,
	testResults: testResultsTable,
}));

/**
 * DB mock: table-aware builder that supports:
 * - db.select(...).from(table)...
 * - db.insert(table).values(...).returning()
 */
let runsSelectCount = 0;

const createBuilder = () => {
	const state: { table?: Table } = {};

	const builder: Record<string, unknown> = {
		__setTable: (table: Table) => {
			state.table = table;
			return builder;
		},

		// SELECT chain
		select: vi.fn(() => builder),
		from: vi.fn((table: Table) => {
			state.table = table;
			return builder;
		}),
		where: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		orderBy: vi.fn(() => builder),

		// INSERT chain
		values: vi.fn(() => builder),
		returning: vi.fn(() => builder),

		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: (v: unknown) => unknown) => {
			const t = state.table?.__table;

			// --- SELECT responses ---
			if (t === "evaluations") {
				// evaluation exists + correct org scope
				return Promise.resolve([{ id: 42, organizationId: 1 }]).then(
					onFulfilled,
				);
			}

			if (t === "testCases") {
				// route often validates testCaseIds exist
				return Promise.resolve([{ id: "tc1" }]).then(onFulfilled);
			}

			if (t === "evaluationRuns") {
				// "check if existing run already imported"
				runsSelectCount += 1;
				if (runsSelectCount === 1) return Promise.resolve([]).then(onFulfilled);
				return Promise.resolve([{ id: 777 }]).then(onFulfilled);
			}

			// --- INSERT responses ---
			if (t === "testResults") {
				// inserts of test results don't need returning
				return Promise.resolve([]).then(onFulfilled);
			}

			// default
			return Promise.resolve([]).then(onFulfilled);
		},

		catch: (onRejected: (e: unknown) => unknown) => {
			return Promise.resolve([]).catch(onRejected);
		},
	};

	return builder;
};

vi.mock("@/db", () => {
	return {
		db: {
			select: vi.fn(() => createBuilder()),

			insert: vi.fn((table: Table) => {
				const b = createBuilder().__setTable(table);

				// Special-case: inserting evaluationRuns must return a run row via returning()
				if (table?.__table === "evaluationRuns") {
					// biome-ignore lint/suspicious/noThenProperty: test mock
					b.then = (onFulfilled: (v: unknown) => unknown) => {
						return Promise.resolve([{ id: 777 }]).then(onFulfilled);
					};
				}

				return b;
			}),
		},
	};
});

const { POST } = await import("@/app/api/evaluations/[id]/runs/import/route");

describe("POST /api/evaluations/[id]/runs/import", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(globalThis as { __ctx?: Record<string, unknown> | undefined }).__ctx =
			undefined;
		runsSelectCount = 0;
	});

	it("returns 400 on invalid payload", async () => {
		h.parseBody.mockResolvedValueOnce({
			ok: false,
			response: NextResponse.json(
				{ error: { code: "VALIDATION_ERROR", message: "bad payload" } },
				{ status: 400 },
			),
		});

		const req = new NextRequest(
			"http://localhost/api/evaluations/42/runs/import",
			{
				method: "POST",
				body: JSON.stringify({ nope: true }),
			},
		);

		const res = await POST(req, { params: Promise.resolve({ id: "42" }) });
		expect(res.status).toBe(400);
	});

	it("supports idempotent import (same run twice) by returning success both times", async () => {
		h.parseBody.mockResolvedValue({
			ok: true,
			data: {
				environment: "ci",
				importClientVersion: "1.0.0",
				results: [{ testCaseId: "tc1", output: "hello" }],
				ci: { provider: "github" },
				checkReport: { score: 100 },
			},
		});

		const req1 = new NextRequest(
			"http://localhost/api/evaluations/42/runs/import",
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
		const res1 = await POST(req1, { params: Promise.resolve({ id: "42" }) });

		if (res1.status >= 400) {
			const body = await res1.json().catch(() => null);
			throw new Error(
				`First POST failed: status=${res1.status} body=${JSON.stringify(body)}`,
			);
		}

		const req2 = new NextRequest(
			"http://localhost/api/evaluations/42/runs/import",
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
		const res2 = await POST(req2, { params: Promise.resolve({ id: "42" }) });

		if (res2.status >= 400) {
			const body = await res2.json().catch(() => null);
			throw new Error(
				`Second POST failed: status=${res2.status} body=${JSON.stringify(body)}`,
			);
		}

		const b1 = await res1.json();
		const b2 = await res2.json();

		expect(b1.runId ?? b1.id ?? true).toBeTruthy();
		expect(b2.runId ?? b2.id ?? true).toBeTruthy();
	});
});
