import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { logger } from "@/lib/logger";
import { validatePayload } from "./payload-schemas";
import type { JobMeta, JobType } from "./types";

/** Max serialized payload size in bytes (128 KB). */
const MAX_PAYLOAD_BYTES = 128 * 1024;
/** Max object nesting depth. */
const MAX_DEPTH = 10;
/** Max total keys across the entire payload object. */
const MAX_KEYS = 500;

export interface EnqueueOptions {
  idempotencyKey?: string;
  organizationId?: number;
  maxAttempts?: number;
  /** Run at a specific time; defaults to now */
  runAt?: Date;
  /** Metadata for traceability (source, createdBy, traceId). */
  meta?: JobMeta;
  /** Skip Zod payload validation at enqueue time (default: false). */
  skipValidation?: boolean;
}

export class EnqueueError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EnqueueError";
  }
}

// ── Payload guards ────────────────────────────────────────────────────────────

function measureDepthAndKeys(obj: unknown, depth = 0): { maxDepth: number; keys: number } {
  if (depth > MAX_DEPTH) return { maxDepth: depth, keys: 0 };
  if (obj === null || typeof obj !== "object") return { maxDepth: depth, keys: 0 };

  const entries = Object.keys(obj as Record<string, unknown>);
  let totalKeys = entries.length;
  let maxDepth = depth;

  for (const key of entries) {
    const child = measureDepthAndKeys((obj as Record<string, unknown>)[key], depth + 1);
    if (child.maxDepth > maxDepth) maxDepth = child.maxDepth;
    totalKeys += child.keys;
  }
  return { maxDepth, keys: totalKeys };
}

function assertPayloadLimits(payload: Record<string, unknown>): void {
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    throw new EnqueueError(
      `Payload too large: ${serialized.length} bytes (max ${MAX_PAYLOAD_BYTES})`,
      "PAYLOAD_TOO_LARGE",
    );
  }
  const { maxDepth, keys } = measureDepthAndKeys(payload);
  if (maxDepth > MAX_DEPTH) {
    throw new EnqueueError(
      `Payload too deep: depth ${maxDepth} (max ${MAX_DEPTH})`,
      "PAYLOAD_TOO_LARGE",
    );
  }
  if (keys > MAX_KEYS) {
    throw new EnqueueError(
      `Payload too complex: ${keys} keys (max ${MAX_KEYS})`,
      "PAYLOAD_TOO_LARGE",
    );
  }
}

/**
 * Enqueue a background job.
 *
 * Idempotency is enforced atomically via INSERT … ON CONFLICT DO NOTHING
 * on the unique `idempotency_key` constraint. If a conflict occurs, the
 * existing job ID is returned — no duplicate rows are ever created even
 * under parallel requests.
 *
 * Payload is validated for size/depth limits and (optionally) against the
 * Zod schema for the job type before insertion.
 */
export async function enqueue(
  type: JobType,
  payload: Record<string, unknown>,
  opts: EnqueueOptions = {},
): Promise<number> {
  const {
    idempotencyKey,
    organizationId,
    maxAttempts = 5,
    runAt = new Date(),
    meta,
    skipValidation = false,
  } = opts;

  // ── 1B: Payload size + shape validation ──────────────────────────────────
  assertPayloadLimits(payload);

  if (!skipValidation) {
    const validation = validatePayload(type, payload);
    if (!validation.success) {
      throw new EnqueueError(`Invalid payload: ${validation.error}`, "PAYLOAD_INVALID");
    }
  }

  // ── 1C: Inject _meta for traceability ────────────────────────────────────
  const enrichedPayload = meta
    ? {
        ...payload,
        _meta: { source: meta.source, createdBy: meta.createdBy, traceId: meta.traceId },
      }
    : payload;

  const now = new Date();

  // ── 1A: Atomic idempotent insert ─────────────────────────────────────────
  if (idempotencyKey) {
    // INSERT ON CONFLICT DO NOTHING — if the key already exists, 0 rows returned
    const inserted = await db
      .insert(jobs)
      .values({
        type,
        payload: enrichedPayload,
        status: "pending",
        attempt: 0,
        maxAttempts,
        nextRunAt: runAt,
        idempotencyKey,
        organizationId: organizationId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: jobs.idempotencyKey })
      .returning({ id: jobs.id });

    if (inserted[0]) {
      logger.info("Job enqueued", {
        jobId: inserted[0].id,
        type,
        idempotencyKey,
        organizationId,
        source: meta?.source,
      });
      return inserted[0].id;
    }

    // Conflict — fetch the existing row
    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing) {
      logger.info("Job already enqueued (idempotency conflict)", {
        jobId: existing.id,
        idempotencyKey,
        type,
      });
      return existing.id;
    }

    // Should never happen — defensive fallback
    throw new EnqueueError("Idempotency conflict but existing row not found", "IDEMPOTENCY_ERROR");
  }

  // No idempotency key — plain insert
  const [inserted] = await db
    .insert(jobs)
    .values({
      type,
      payload: enrichedPayload,
      status: "pending",
      attempt: 0,
      maxAttempts,
      nextRunAt: runAt,
      idempotencyKey: null,
      organizationId: organizationId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: jobs.id });

  logger.info("Job enqueued", {
    jobId: inserted.id,
    type,
    organizationId,
    source: meta?.source,
  });
  return inserted.id;
}
