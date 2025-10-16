import { db } from "@/db";
import { session, user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Server-side Autumn feature checking and tracking
 * This runs on the server and cannot be bypassed by client-side manipulation
 */

interface CheckFeatureParams {
  userId: string;
  featureId: string;
  requiredBalance?: number;
}

interface TrackFeatureParams {
  userId: string;
  featureId: string;
  value: number;
  idempotencyKey?: string;
}

interface ValidateSessionResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validate bearer token and extract user ID
 * Server-side only - cannot be manipulated by client
 */
export async function validateSession(token: string | null): Promise<ValidateSessionResult> {
  if (!token) {
    return { valid: false, error: "No authentication token provided" };
  }

  try {
    // Query session table to validate token
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return { valid: false, error: "Invalid session token" };
    }

    const userSession = sessions[0];

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(userSession.expiresAt);

    if (expiresAt < now) {
      return { valid: false, error: "Session expired" };
    }

    return {
      valid: true,
      userId: userSession.userId,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { valid: false, error: "Session validation failed" };
  }
}

/**
 * Check if user has allowance for a feature
 * Calls Autumn API to verify quota server-side
 */
export async function checkFeature(params: CheckFeatureParams): Promise<{
  allowed: boolean;
  remaining?: number;
  error?: string;
}> {
  const { userId, featureId, requiredBalance = 1 } = params;

  try {
    // Call Autumn API to check feature allowance
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/autumn/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        featureId,
        requiredBalance,
      }),
    });

    if (!response.ok) {
      return {
        allowed: false,
        error: "Failed to check feature allowance",
      };
    }

    const data = await response.json();
    return {
      allowed: data.allowed || false,
      remaining: data.remaining,
    };
  } catch (error) {
    console.error("Feature check error:", error);
    return {
      allowed: false,
      error: "Feature check failed",
    };
  }
}

/**
 * Track feature usage
 * Records usage server-side to prevent manipulation
 */
export async function trackFeature(params: TrackFeatureParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const { userId, featureId, value, idempotencyKey } = params;

  try {
    // Call Autumn API to track usage
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/autumn/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        featureId,
        value,
        idempotencyKey,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to track feature usage",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Feature tracking error:", error);
    return {
      success: false,
      error: "Feature tracking failed",
    };
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Middleware helper for protected API routes
 * Returns standardized error responses
 */
export async function requireAuth(request: Request): Promise<
  | { authenticated: true; userId: string }
  | { authenticated: false; response: Response }
> {
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);

  const validation = await validateSession(token);

  if (!validation.valid || !validation.userId) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({
          error: validation.error || "Unauthorized",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return {
    authenticated: true,
    userId: validation.userId,
  };
}

/**
 * Middleware helper for feature-gated API routes
 * Checks both auth and feature allowance
 */
export async function requireFeature(
  request: Request,
  featureId: string,
  requiredBalance: number = 1
): Promise<
  | { allowed: true; userId: string }
  | { allowed: false; response: Response }
> {
  // First check auth
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return { allowed: false, response: authResult.response };
  }

  // Then check feature allowance
  const featureCheck = await checkFeature({
    userId: authResult.userId,
    featureId,
    requiredBalance,
  });

  if (!featureCheck.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: `${featureId.charAt(0).toUpperCase() + featureId.slice(1)} limit reached. Upgrade your plan to increase quota.`,
          code: "QUOTA_EXCEEDED",
          featureId,
          remaining: featureCheck.remaining || 0,
        }),
        {
          status: 402, // Payment Required
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return {
    allowed: true,
    userId: authResult.userId,
  };
}