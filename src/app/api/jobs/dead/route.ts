import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { validationError } from "@/lib/api/errors";
import { secureRoute } from "@/lib/api/secure-route";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * GET /api/jobs/dead
 *
 * List dead-letter jobs for the caller's organization.
 * Admin-only. Payload is redacted from responses.
 *
 * Query params:
 *   limit      — number of results (default 50, max 200)
 *   offset     — pagination offset (default 0)
 *   type       — filter by job type
 *   errorCode  — filter by last_error_code
 *   since      — ISO timestamp lower bound for updatedAt
 *   until      — ISO timestamp upper bound for updatedAt
 *   minAttempt — minimum attempt count
 */
export const GET = secureRoute(
  async (req: NextRequest, ctx) => {
    const { searchParams } = new URL(req.url);

    // Parse & validate numeric params
    const rawLimit = searchParams.get("limit");
    const rawOffset = searchParams.get("offset");
    if (rawLimit && Number.isNaN(Number(rawLimit))) {
      return validationError("limit must be a number");
    }
    if (rawOffset && Number.isNaN(Number(rawOffset))) {
      return validationError("offset must be a number");
    }

    const limit = rawLimit ? Math.min(Math.max(1, Number(rawLimit)), MAX_LIMIT) : DEFAULT_LIMIT;
    const offset = rawOffset ? Math.max(0, Number(rawOffset)) : 0;

    // Optional filters
    const typeFilter = searchParams.get("type");
    const errorCodeFilter = searchParams.get("errorCode");
    const sinceFilter = searchParams.get("since");
    const untilFilter = searchParams.get("until");
    const minAttemptFilter = searchParams.get("minAttempt");

    // Build WHERE conditions
    const conditions = [
      eq(jobs.status, "dead_letter"),
      eq(jobs.organizationId, ctx.organizationId),
    ];

    if (typeFilter) conditions.push(eq(jobs.type, typeFilter));
    if (errorCodeFilter) conditions.push(eq(jobs.lastErrorCode, errorCodeFilter));
    if (sinceFilter) {
      const sinceDate = new Date(sinceFilter);
      if (Number.isNaN(sinceDate.getTime()))
        return validationError("since must be a valid ISO date");
      conditions.push(gte(jobs.updatedAt, sinceDate));
    }
    if (untilFilter) {
      const untilDate = new Date(untilFilter);
      if (Number.isNaN(untilDate.getTime()))
        return validationError("until must be a valid ISO date");
      conditions.push(lte(jobs.updatedAt, untilDate));
    }
    if (minAttemptFilter) {
      const minAttempt = Number(minAttemptFilter);
      if (Number.isNaN(minAttempt)) return validationError("minAttempt must be a number");
      conditions.push(gte(jobs.attempt, minAttempt));
    }

    const where = and(...conditions);

    // Total count for pagination
    const [{ value: total }] = await db.select({ value: count() }).from(jobs).where(where);

    // Fetch page
    const dlqJobs = await db
      .select({
        id: jobs.id,
        type: jobs.type,
        status: jobs.status,
        attempt: jobs.attempt,
        maxAttempts: jobs.maxAttempts,
        lastErrorCode: jobs.lastErrorCode,
        lastError: jobs.lastError,
        lastStartedAt: jobs.lastStartedAt,
        lastFinishedAt: jobs.lastFinishedAt,
        lastDurationMs: jobs.lastDurationMs,
        nextRunAt: jobs.nextRunAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(where)
      .orderBy(desc(jobs.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      jobs: dlqJobs,
      total,
      limit,
      offset,
      hasMore: offset + dlqJobs.length < total,
    });
  },
  { minRole: "admin" },
);
