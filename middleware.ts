import "@/lib/polyfill-global";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware: security headers only.
 * Auth is handled by each protected page/layout - Edge middleware cannot reliably
 * read session cookies after OAuth redirects (cookie timing/visibility issues).
 */
export function middleware(_request: NextRequest) {
	const response = NextResponse.next();
	const isProd =
		process.env.NODE_ENV === "production" ||
		process.env.VERCEL_ENV === "production";

	// Security headers
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// CSP: 'unsafe-inline' is required for Next.js hydration scripts and
	// Radix/shadcn inline styles. 'unsafe-eval' is dev-only (HMR).
	const scriptSrc = [
		"'self'",
		"'unsafe-inline'",
		"https://slelguoygbfzlpylpxfs.supabase.co",
		"https://va.vercel-scripts.com",
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
