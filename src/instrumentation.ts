import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(
  error: unknown,
  request: { method: string; url: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) {
  // Sentry.captureRequestError expects request.headers.entries() which doesn't
  // exist in Next.js 16's instrumentation hook (headers is a plain object).
  // Wrap headers in a real Headers instance before forwarding to Sentry.
  const safeRequest = {
    ...request,
    headers: new Headers(request.headers as Record<string, string>),
  };

  await Sentry.captureRequestError(error, safeRequest as any, context);
}
