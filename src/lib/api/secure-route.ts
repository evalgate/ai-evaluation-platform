/**
 * Centralized API route wrapper — the single entry point for authenticated handlers.
 *
 * Every API route should be wrapped with `secureRoute()` (or listed in the
 * public route allowlist tested by route-auth-audit.test.ts).
 *
 * Responsibilities:
 *  1. Authentication (session or API-key)
 *  2. Organization resolution
 *  3. Rate limiting (always-on for anonymous, configurable tier for authed)
 *  4. Standard error envelope (see errors.ts)
 *  5. Structured logging of failures
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  requireAuthWithOrg,
} from '@/lib/autumn-server';
import { withRateLimit } from '@/lib/api-rate-limit';
import {
  apiError,
  internalError,
  zodValidationError,
  type ApiErrorCode,
} from '@/lib/api/errors';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

// ── Types ──

export type RateLimitTier = 'anonymous' | 'free' | 'pro' | 'enterprise';

export type Role = 'viewer' | 'member' | 'admin' | 'owner';
export type AuthType = 'session' | 'apiKey' | 'anonymous';

export interface AuthContext {
  userId: string;
  organizationId: number;
  role: Role;
  scopes: string[];
  authType: AuthType;
}

export interface AuthOnlyContext {
  userId: string;
  scopes: string[];
  authType: Exclude<AuthType, 'anonymous'>;
}

export type SecureRouteOptions = {
  /** Require org membership (default: true). Set false for user-only auth. */
  requireOrg?: boolean;
  /** Require authentication at all (default: true). */
  requireAuth?: boolean;
  /** Allow unauthenticated access — used for public endpoints. */
  allowAnonymous?: boolean;
  /** Rate-limit tier. Applied for anonymous; authed users get their plan tier. */
  rateLimit?: RateLimitTier;
  /** Scopes the caller must hold. Checked after auth resolves. */
  requiredScopes?: string[];
  /** Minimum organization role required (checked via ROLE_RANK hierarchy). */
  minRole?: Role;
};

// ── Role ranking & helpers ──

export const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function normalizeRole(role: string): Role {
  const r = role.toLowerCase();
  if (r === 'owner') return 'owner';
  if (r === 'admin') return 'admin';
  if (r === 'member') return 'member';
  return 'viewer';
}

export function hasMinRole(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export function hasScopes(granted: string[], required: string[]): boolean {
  const set = new Set(granted);
  return required.every((s) => set.has(s));
}

// ── Overloads so callers get the correct context type ──

/** Authenticated + org-scoped handler (default) */
export function secureRoute(
  handler: (req: NextRequest, ctx: AuthContext, params: Record<string, string>) => Promise<NextResponse>,
  options?: SecureRouteOptions & { requireOrg?: true; allowAnonymous?: false | undefined },
): (req: NextRequest, props: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

/** Authenticated but user-only (no org) */
export function secureRoute(
  handler: (req: NextRequest, ctx: AuthOnlyContext, params: Record<string, string>) => Promise<NextResponse>,
  options: SecureRouteOptions & { requireOrg: false; allowAnonymous?: false | undefined },
): (req: NextRequest, props: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

/** Anonymous / public handler — context may be empty */
export function secureRoute(
  handler: (req: NextRequest, ctx: Partial<AuthContext>, params: Record<string, string>) => Promise<NextResponse>,
  options: SecureRouteOptions & { allowAnonymous: true },
): (req: NextRequest, props: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

// ── Implementation ──

export function secureRoute(
  handler: (req: NextRequest, ctx: any, params: Record<string, string>) => Promise<NextResponse>,
  options: SecureRouteOptions = {},
): (req: NextRequest, props: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  const {
    requireOrg: needsOrg = true,
    requireAuth: needsAuth = true,
    allowAnonymous = false,
    rateLimit: tier,
  } = options;

  return async (req: NextRequest, props: { params: Promise<Record<string, string>> }) => {
    const resolvedParams = await props.params;

    // Wrap the core logic so rate limiting can wrap it too
    const coreHandler = async (request: NextRequest): Promise<NextResponse> => {
      try {
        // ── Anonymous path ──
        if (allowAnonymous && !needsAuth) {
          return await handler(request, {}, resolvedParams);
        }

        // ── Auth path ──
        if (needsAuth) {
          if (needsOrg) {
            const authResult = await requireAuthWithOrg(request);
            if (!authResult.authenticated) {
              // Parse the error from the auth response
              try {
                const errBody = await authResult.response.json();
                const code = (errBody.code ?? 'UNAUTHORIZED') as ApiErrorCode;
                return apiError(code, errBody.error ?? 'Unauthorized');
              } catch {
                return apiError('UNAUTHORIZED', 'Unauthorized');
              }
            }
            const ctx: AuthContext = {
              userId: authResult.userId,
              organizationId: authResult.organizationId,
              role: authResult.role,
              scopes: authResult.scopes,
              authType: authResult.authType,
            };

            // ── Role gate ──
            if (options.minRole && !hasMinRole(ctx.role, options.minRole)) {
              return apiError('FORBIDDEN', `Requires at least ${options.minRole} role`);
            }
            // ── Scope gate ──
            if (options.requiredScopes?.length && !hasScopes(ctx.scopes, options.requiredScopes)) {
              return apiError('FORBIDDEN', 'Insufficient scope');
            }

            return await handler(request, ctx, resolvedParams);
          } else {
            const authResult = await requireAuth(request);
            if (!authResult.authenticated) {
              return apiError('UNAUTHORIZED', 'Unauthorized');
            }
            const ctx: AuthOnlyContext = {
              userId: authResult.userId,
              scopes: authResult.scopes,
              authType: authResult.authType,
            };

            // ── Scope gate (no role check for user-only routes) ──
            if (options.requiredScopes?.length && !hasScopes(ctx.scopes, options.requiredScopes)) {
              return apiError('FORBIDDEN', 'Insufficient scope');
            }

            return await handler(request, ctx, resolvedParams);
          }
        }

        // fallback (shouldn't reach here)
        return await handler(request, {}, resolvedParams);
      } catch (err) {
        if (err instanceof ZodError) {
          return zodValidationError(err);
        }
        const message = err instanceof Error ? err.message : 'Internal server error';
        logger.error('Unhandled route error', { error: message, path: request.nextUrl.pathname });
        return internalError(message);
      }
    };

    // ── Rate limiting wrapper ──
    if (tier) {
      return withRateLimit(req, coreHandler, { customTier: tier });
    }
    return coreHandler(req);
  };
}
