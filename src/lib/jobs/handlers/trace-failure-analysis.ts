/**
 * Job handler for trace_failure_analysis.
 *
 * Invoked by the job runner when a trace needs failure detection.
 * Delegates to the trace failure pipeline orchestrator.
 */

import { logger } from "@/lib/logger";
import { runTraceFailurePipeline } from "@/lib/pipeline/trace-failure-pipeline";

export async function handleTraceFailureAnalysis(
	payload: Record<string, unknown>,
): Promise<void> {
	const traceDbId = payload.traceDbId as number;
	const organizationId = payload.organizationId as number;

	logger.info("trace_failure_analysis handler started", {
		traceDbId,
		organizationId,
	});

	const result = await runTraceFailurePipeline({ traceDbId, organizationId });

	if (result.skipped) {
		logger.info("trace_failure_analysis skipped", {
			traceDbId,
			reason: result.skipReason,
		});
		return;
	}

	logger.info("trace_failure_analysis completed", {
		traceDbId,
		failureReportId: result.failureReportId,
		candidateId: result.candidateId,
		category: result.category,
		autoPromoteEligible: result.autoPromoteEligible,
	});
}
