import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@next/bundle-analyzer", () => ({
	default: vi.fn(() => (config: unknown) => config),
}));

vi.mock("@sentry/nextjs", () => ({
	withSentryConfig: vi.fn((config: unknown) => config),
}));

vi.mock("next-axiom", () => ({
	withAxiom: vi.fn((config: unknown) => config),
}));

const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
	process,
	"platform",
);
const originalStandaloneEnv = process.env.NEXT_OUTPUT_STANDALONE;

async function loadNextConfig(
	platform: NodeJS.Platform,
	standaloneEnv?: string,
) {
	vi.resetModules();

	Object.defineProperty(process, "platform", {
		value: platform,
		configurable: true,
	});

	if (standaloneEnv === undefined) {
		delete process.env.NEXT_OUTPUT_STANDALONE;
	} else {
		process.env.NEXT_OUTPUT_STANDALONE = standaloneEnv;
	}

	const mod = await import("../../next.config");
	return mod.default;
}

afterEach(() => {
	vi.resetModules();

	if (originalPlatformDescriptor) {
		Object.defineProperty(process, "platform", originalPlatformDescriptor);
	}

	if (originalStandaloneEnv === undefined) {
		delete process.env.NEXT_OUTPUT_STANDALONE;
	} else {
		process.env.NEXT_OUTPUT_STANDALONE = originalStandaloneEnv;
	}
});

describe("next.config standalone output", () => {
	it("disables standalone output on native Windows by default", async () => {
		const config = await loadNextConfig("win32");

		expect(config.output).toBeUndefined();
	});

	it("enables standalone output on Windows when explicitly forced", async () => {
		const config = await loadNextConfig("win32", "true");

		expect(config.output).toBe("standalone");
	});

	it("enables standalone output on non-Windows platforms by default", async () => {
		const config = await loadNextConfig("linux");

		expect(config.output).toBe("standalone");
	});
});
