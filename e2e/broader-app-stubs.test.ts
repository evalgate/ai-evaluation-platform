import { test } from "@playwright/test";
import { expectStablePageLoad } from "./evalgate-fixture";

test.describe("Broader app stubs", () => {
	test("developer api keys route renders or redirects without crashing", async ({
		page,
	}) => {
		await expectStablePageLoad(page, "/developer/api-keys");
	});

	test("traces route renders or redirects without crashing", async ({
		page,
	}) => {
		await expectStablePageLoad(page, "/traces");
	});

	test("evaluations route renders or redirects without crashing", async ({
		page,
	}) => {
		await expectStablePageLoad(page, "/evaluations");
	});
});
