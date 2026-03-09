import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/annotations/tasks/route";
import { db } from "@/db";
import { trackFeature } from "@/lib/autumn-server";

const autumnServerMock = vi.hoisted(() => {
	const v = (globalThis as { vi?: typeof vi }).vi!;
	const ctx = {
		authenticated: true,
		userId: "test-user",
		organizationId: 1,
		role: "member",
		scopes: ["eval:read", "eval:write"],
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

const insertResult = [{ id: 7, name: "Task A", organizationId: 1 }];

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: () => Promise.resolve(insertResult),
			})),
		})),
		update: vi.fn(),
	},
}));

vi.mock("drizzle-orm", () => ({
	and: vi.fn(),
	desc: vi.fn(),
	eq: vi.fn(),
	like: vi.fn(),
}));

vi.mock("@/lib/autumn-server", () => autumnServerMock);

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (req: NextRequest) =>
			(handler as (...args: never[]) => unknown)(req, {
				userId: "test-user",
				organizationId: 1,
				role: "member",
				scopes: ["eval:read", "eval:write"],
				authType: "session",
			});
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("POST /api/annotations/tasks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.insert).mockImplementation(
			() =>
				({
					values: vi.fn(() => ({
						returning: () => Promise.resolve(insertResult),
					})),
				}) as any,
		);
	});

	it("tracks annotation creation with deterministic idempotency keys", async () => {
		const req = new NextRequest("http://localhost:3000/api/annotations/tasks", {
			method: "POST",
			body: JSON.stringify({
				name: "Task A",
				type: "human_review",
				organizationId: 1,
			}),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(req, { params: Promise.resolve({}) } as never);

		expect(response.status).toBe(201);
		expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				featureId: "annotations",
				idempotencyKey: "annotations-7",
			}),
		);
		expect(vi.mocked(trackFeature)).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				featureId: "annotations_per_project",
				idempotencyKey: "annotations_per_project-1-7",
			}),
		);
	});
});
