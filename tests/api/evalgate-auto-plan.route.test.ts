import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgRole } from "@/lib/permissions";

const h = vi.hoisted(() => ({
	role: "member" as OrgRole,
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			return (handler as (...args: never[]) => unknown)(
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

import { POST } from "@/app/api/evalgate/auto-plan/route";

describe("/api/evalgate/auto-plan", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.role = "member";
	});

	it("returns a planner preview using built-in auto families", async () => {
		const request = new NextRequest("http://localhost/api/evalgate/auto-plan", {
			method: "POST",
			body: JSON.stringify({
				iteration: 1,
				objective: "tone_mismatch",
				targetPath: "prompts/support.md",
				targetContent: "Base prompt text",
				allowedFamilies: ["instruction-order", "few-shot-examples"],
				hypothesis: "acknowledge the user's concern first",
				forbiddenChanges: ["Do not add long policy lists."],
			}),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(request, {
			params: Promise.resolve({}),
		} as never);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toMatchObject({
			iteration: 1,
			selectedFamily: "few-shot-examples",
			reason: null,
			candidate: {
				id: "planner-few-shot-examples-1",
				label: "few-shot-examples",
			},
		});
		expect(data.proposedPatch).toContain("tone_mismatch");
		expect(data.proposedPatch).toContain(
			"acknowledge the user's concern first",
		);
		expect(
			data.rankedFamilies.map((family: { id: string }) => family.id),
		).toEqual(["few-shot-examples", "instruction-order"]);
	});

	it("rejects unknown mutation families", async () => {
		const request = new NextRequest("http://localhost/api/evalgate/auto-plan", {
			method: "POST",
			body: JSON.stringify({
				objective: "tone_mismatch",
				targetPath: "prompts/support.md",
				targetContent: "Base prompt text",
				allowedFamilies: ["unknown-family"],
			}),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(request, {
			params: Promise.resolve({}),
		} as never);

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error?.message).toContain("Unknown mutation families");
	});

	it("returns 403 when a viewer requests an auto plan preview", async () => {
		h.role = "viewer";

		const request = new NextRequest("http://localhost/api/evalgate/auto-plan", {
			method: "POST",
			body: JSON.stringify({
				iteration: 1,
				objective: "tone_mismatch",
				targetPath: "prompts/support.md",
				targetContent: "Base prompt text",
				allowedFamilies: ["instruction-order"],
			}),
			headers: { "Content-Type": "application/json" },
		});

		const response = await POST(request, {
			params: Promise.resolve({}),
		} as never);

		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.error?.message).toBe(
			"You do not have permission to perform this action.",
		);
	});
});
