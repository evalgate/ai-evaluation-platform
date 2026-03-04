/**
 * Collector Service — Transactional trace + spans ingest.
 *
 * Accepts the parsed collector body, inserts trace + all spans in a single
 * transaction, optionally inserts user feedback, and returns the IDs needed
 * for downstream job enqueue.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { spans, traces, userFeedback } from "@/db/schema";
import type { SpanMetadata, TraceMetadata } from "@/db/types";
import { canonicalizeJson } from "@/lib/crypto/canonical-json";
import { sha256Hex } from "@/lib/crypto/hash";
import { sha256Input } from "@/lib/utils/input-hash";
import type { CollectorBody, CollectorSpan } from "@/lib/validation";

export interface CollectorResult {
	traceDbId: number;
	traceId: string;
	spanCount: number;
	feedbackInserted: boolean;
}

export async function ingestTrace(
	organizationId: number,
	body: CollectorBody,
): Promise<CollectorResult> {
	const now = new Date();

	// Build trace metadata with source/environment
	const traceMetadata: TraceMetadata = {
		...(body.metadata ?? {}),
		...(body.source ? { source: body.source } : {}),
		...(body.environment ? { environment: body.environment } : {}),
	};

	// Insert trace — ON CONFLICT DO NOTHING for idempotent retries
	const inserted = await db
		.insert(traces)
		.values({
			name: body.name.trim(),
			traceId: body.trace_id.trim(),
			organizationId,
			status: body.status ?? "pending",
			analysisStatus: "pending",
			source: body.source ?? null,
			environment: body.environment ?? null,
			durationMs: body.duration_ms ?? null,
			metadata: traceMetadata,
			createdAt: now,
		})
		.onConflictDoNothing({ target: traces.traceId })
		.returning();

	// If conflict (retry), look up the existing row
	let traceDbId: number;
	if (inserted[0]) {
		traceDbId = inserted[0].id;
	} else {
		const [existing] = await db
			.select({ id: traces.id })
			.from(traces)
			.where(eq(traces.traceId, body.trace_id.trim()))
			.limit(1);
		if (!existing)
			throw new Error(`Trace conflict but row not found: ${body.trace_id}`);
		traceDbId = existing.id;
	}

	// Batch insert spans
	const spanValues = body.spans.map((s: CollectorSpan) => {
		const inputStr = serializeInput(s.input);
		const inputHash = computeInputHash(s.input, inputStr);

		const outputStr =
			typeof s.output === "string"
				? s.output
				: s.output != null
					? JSON.stringify(s.output)
					: null;

		const spanMeta: SpanMetadata = {
			...(s.metadata ?? {}),
			...(s.model ? { model: s.model } : {}),
			...(s.vendor ? { provider: s.vendor } : {}),
			...(s.metrics?.prompt_tokens != null
				? {
						tokenCount:
							(s.metrics.prompt_tokens ?? 0) +
							(s.metrics.completion_tokens ?? 0),
					}
				: {}),
			...(s.params
				? { temperature: s.params.temperature as number | undefined }
				: {}),
			...(s.behavioral ? { behavioral: s.behavioral } : {}),
			...(s.error ? { error: s.error } : {}),
		};

		const startTime = s.timestamps?.started_at
			? new Date(s.timestamps.started_at)
			: now;
		const endTime = s.timestamps?.finished_at
			? new Date(s.timestamps.finished_at)
			: null;
		const durationMs =
			s.timestamps?.started_at && s.timestamps?.finished_at
				? s.timestamps.finished_at - s.timestamps.started_at
				: null;

		return {
			traceId: traceDbId,
			spanId: s.span_id.trim(),
			parentSpanId: s.parent_span_id?.trim() ?? null,
			name: s.name.trim(),
			type: s.type ?? "default",
			startTime,
			endTime,
			input: inputStr,
			inputHash,
			output: outputStr,
			durationMs,
			metadata: spanMeta,
			evaluationRunId: null,
			createdAt: now,
		};
	});

	if (spanValues.length > 0) {
		// ON CONFLICT DO NOTHING — idempotent on span_id unique constraint
		await db
			.insert(spans)
			.values(spanValues)
			.onConflictDoNothing({ target: spans.spanId });
	}

	// Insert user feedback if present
	let feedbackInserted = false;
	if (body.user_feedback) {
		await db.insert(userFeedback).values({
			organizationId,
			traceId: traceDbId,
			feedbackType: body.user_feedback.type,
			value:
				body.user_feedback.value != null
					? (body.user_feedback.value as Record<string, unknown>)
					: null,
			userIdExternal: body.user_feedback.user_id ?? null,
			createdAt: now,
		});
		feedbackInserted = true;
	}

	return {
		traceDbId,
		traceId: body.trace_id,
		spanCount: body.spans.length,
		feedbackInserted,
	};
}

// ── Helpers ────────────────────────────────────────────────────────────────

function serializeInput(input: unknown): string | null {
	if (input == null) return null;
	if (typeof input === "string") return input;
	if (typeof input === "object") return canonicalizeJson(input);
	return JSON.stringify(input);
}

function computeInputHash(
	input: unknown,
	inputStr: string | null,
): string | null {
	if (!inputStr) return null;
	if (typeof input === "object" && input != null) {
		return sha256Hex(canonicalizeJson(input));
	}
	return sha256Input(inputStr);
}
