import { defineConfig, devices } from "@playwright/test";

/**
 * Minimal Playwright config for smoke tests only.
 * Full E2E suite is out of scope — this covers the critical path:
 * public pages load, auth-gated endpoints return correct status codes.
 */
export default defineConfig({
	testDir: "./e2e",
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// No webServer config — server lifecycle is managed externally:
	//   CI:    build → start & → wait-on → test → kill  (see platform-ci.yml)
	//   Local: run `pnpm dev` or `pnpm start` first, then `pnpm test:e2e`
});
