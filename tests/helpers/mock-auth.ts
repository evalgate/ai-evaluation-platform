import { vi } from "vitest";

/**
 * Default mock return value for requireAuthWithOrg.
 * Override per-test with vi.mocked(requireAuthWithOrg).mockResolvedValueOnce(...)
 */
export const defaultAuthContext = {
	authenticated: true,
	userId: "test-user",
	organizationId: 1,
	role: "member" as const,
	scopes: [
		"eval:read",
		"eval:write",
		"traces:read",
		"traces:write",
		"runs:read",
		"runs:write",
	],
	authType: "session" as const,
};

/**
 * Standard mock factory for @/lib/autumn-server.
 * Use in vi.mock("@/lib/autumn-server", () => mockAutumnServer())
 *
 * For tests where vi.mock runs before imports (hoisting), inline the mock in vi.hoisted()
 * using globalThis.vi - see existing api route tests for the pattern.
 */
export function mockAutumnServer(overrides?: Record<string, unknown>) {
	return {
		checkFeature: vi.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
		trackFeature: vi.fn().mockResolvedValue({ success: true }),
		guardFeature: vi.fn().mockResolvedValue(null),
		requireAuthWithOrg: vi.fn().mockResolvedValue(defaultAuthContext),
		requireAuth: vi.fn().mockResolvedValue(defaultAuthContext),
		...overrides,
	};
}
