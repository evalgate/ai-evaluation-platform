import { expect, test } from "@playwright/test";
import { expectAuthGuard, expectStablePageLoad } from "./evalgate-fixture";

test.describe("EvalGate flows", () => {
	test("evaluation auto deep link does not hard-crash when unauthenticated", async ({
		page,
	}) => {
		await expectStablePageLoad(
			page,
			"/evaluations/1?tab=auto&session=session_demo_1",
		);
		expect(
			page.url().includes("/auth/login") ||
				page.url().includes("/evaluations/1"),
		).toBe(true);
	});

	test("evaluation synthesize deep link does not hard-crash when unauthenticated", async ({
		page,
	}) => {
		await expectStablePageLoad(page, "/evaluations/1?tab=synthesize");
		expect(
			page.url().includes("/auth/login") ||
				page.url().includes("/evaluations/1"),
		).toBe(true);
	});

	test("artifact accept route requires auth", async ({ request }) => {
		await expectAuthGuard(
			request,
			"post",
			"/api/evaluations/1/artifacts/1/accept",
		);
	});

	test("artifact delete route requires auth", async ({ request }) => {
		await expectAuthGuard(request, "delete", "/api/evaluations/1/artifacts/1");
	});
});
