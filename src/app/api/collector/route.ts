/**
 * POST /api/collector — Single-payload trace + spans ingest.
 *
 * Accepts a trace with all its spans in one request (LangWatch pattern).
 * Inserts trace + spans transactionally, optionally stores user feedback,
 * and enqueues an async failure analysis job based on sampling rules.
 */

import { type NextRequest, NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { ingestTrace } from "@/lib/collector/collector.service";
import { canEnqueueAnalysis } from "@/lib/collector/rate-limiter";
import { shouldAnalyzeTrace } from "@/lib/collector/sampling";
import { enqueue } from "@/lib/jobs/enqueue";
import { logger } from "@/lib/logger";
import { collectorBodySchema } from "@/lib/validation";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		const parsed = await parseBody(req, collectorBodySchema);
		if (!parsed.ok) return parsed.response;

		try {
			const result = await ingestTrace(ctx.organizationId, parsed.data);

			// Determine if we should enqueue failure analysis
			const sampling = shouldAnalyzeTrace({
				traceStatus: parsed.data.status ?? "pending",
				hasFeedback: !!parsed.data.user_feedback,
				feedbackType: parsed.data.user_feedback?.type,
			});

			let queuedForAnalysis = false;

			if (sampling.shouldAnalyze) {
				// Rate-limit guardrail — prevent traffic spikes from overwhelming pipeline
				if (canEnqueueAnalysis(ctx.organizationId)) {
					await enqueue(
						"trace_failure_analysis",
						{
							traceDbId: result.traceDbId,
							organizationId: ctx.organizationId,
						},
						{ organizationId: ctx.organizationId },
					);
					queuedForAnalysis = true;
					logger.info("Trace queued for failure analysis", {
						traceId: result.traceId,
						traceDbId: result.traceDbId,
						reason: sampling.reason,
					});
				} else {
					logger.warn("Analysis rate limit exceeded — skipping enqueue", {
						traceId: result.traceId,
						traceDbId: result.traceDbId,
						organizationId: ctx.organizationId,
					});
				}
			}

			return NextResponse.json(
				{
					trace_id: result.traceId,
					trace_db_id: result.traceDbId,
					span_count: result.spanCount,
					feedback_recorded: result.feedbackInserted,
					queued_for_analysis: queuedForAnalysis,
					sampling_reason: sampling.reason,
				},
				{ status: 201 },
			);
		} catch (error) {
			// Handle duplicate traceId (unique constraint violation)
			if (
				error instanceof Error &&
				error.message.includes("unique") &&
				error.message.includes("trace_id")
			) {
				return validationError(
					`Trace with trace_id "${parsed.data.trace_id}" already exists`,
				);
			}

			logger.error("Collector ingest failed", {
				error: error instanceof Error ? error.message : String(error),
				traceId: parsed.data.trace_id,
			});
			return internalError();
		}
	},
	{ requiredScopes: [SCOPES.TRACES_WRITE] },
);
