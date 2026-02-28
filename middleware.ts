import "@/lib/polyfill-global";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware: security headers only.
 * Auth is handled by each protected page/layout - Edge middleware cannot reliably
 * read session cookies after OAuth redirects (cookie timing/visibility issues).
 */
export function middleware(_request: NextRequest) {
	// Generate a per-request nonce for CSP script-src
	const nonce = crypto.randomUUID();

	const requestHeaders = new Headers(_request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	const isProd =
		process.env.NODE_ENV === "production" ||
		process.env.VERCEL_ENV === "production";

	// Security headers
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// Content-Security-Policy with nonce-based script-src
	// - Nonce replaces 'unsafe-inline' for scripts, blocking injected inline scripts.
	// - 'unsafe-inline' is kept for style-src only (Radix/shadcn emit inline styles).
	// - 'unsafe-eval' is allowed in dev only (HMR / React Fast Refresh needs it).
	const scriptSrc = [
		"'self'",
		`'nonce-${nonce}'`,
		"'strict-dynamic'",
		"https://slelguoygbfzlpylpxfs.supabase.co",
		...(isProd ? [] : ["'unsafe-eval'"]),
	].join(" ");
	response.headers.set(
		"Content-Security-Policy",
		`default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
	);

	// Permissions-Policy: disable unused features
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
	);

	// HSTS: only in production (avoid local HTTPS issues)
	if (isProd) {
		response.headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
