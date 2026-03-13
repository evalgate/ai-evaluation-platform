import { type APIRequestContext, expect, type Page } from "@playwright/test";

export async function expectStablePageLoad(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState("domcontentloaded");
	await expect(page.locator("body")).toBeAttached();
	await expect(page.getByText("Application error")).not.toBeAttached();
	await expect(page.getByText("Something went wrong")).not.toBeAttached();
	await expect(page.getByText("Internal Server Error")).not.toBeAttached();
}

export async function expectAuthGuard(
	request: APIRequestContext,
	method: "get" | "post" | "delete",
	path: string,
	data?: unknown,
) {
	const response = await request[method](path, data ? { data } : undefined);
	expect([401, 403]).toContain(response.status());
}
