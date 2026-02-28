import type { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "./api-rate-limit";

/**
 * Wrapper to add rate limiting to unknown API route handler
 */
export function withRateLimiting(
	handler: (req: NextRequest) => Promise<NextResponse>,
	tier: "free" | "pro" | "enterprise" | "anonymous" = "free",
) {
	return async (req: NextRequest) => {
		return withRateLimit(req, handler, { customTier: tier });
	};
}

/**
 * HOC to wrap route handlers with rate limiting
 */
export function rateLimit(tier?: "free" | "pro" | "enterprise" | "anonymous") {
	return <T extends (...args: unknown[]) => Promise<NextResponse>>(
		target: T,
	): T =>
		(async (...args: unknown[]) => {
			const req = args[0] as NextRequest;
			return withRateLimit(req, async () => target(...args), {
				customTier: tier || "free",
			});
		}) as T;
}
