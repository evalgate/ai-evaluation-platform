/**
 * Shared types for the background job runner.
 */

export type JobType = "webhook_delivery" | "trace_failure_analysis";

export type JobStatus = "pending" | "running" | "success" | "dead_letter";

export const JobErrorCodes = {
	HANDLER_MISSING: "JOB_HANDLER_MISSING",
	PAYLOAD_INVALID: "JOB_PAYLOAD_INVALID",
	PAYLOAD_TOO_LARGE: "JOB_PAYLOAD_TOO_LARGE",
	HANDLER_ERROR: "JOB_HANDLER_ERROR",
	LOCK_TIMEOUT_RECLAIMED: "JOB_LOCK_TIMEOUT_RECLAIMED",
	RATE_LIMITED: "JOB_RATE_LIMITED",
	UPSTREAM_5XX: "JOB_UPSTREAM_5XX",
} as const;

export type JobErrorCode = (typeof JobErrorCodes)[keyof typeof JobErrorCodes];

/** Metadata attached to every job for traceability. */
export interface JobMeta {
	source?: string;
	createdBy?: string;
	traceId?: string;
}

/** Retry modes for the DLQ retry endpoint. */
export type RetryMode = "now" | "later" | "reset";

export interface RunnerResult {
	processed: number;
	failed: number;
	reclaimed: number;
	deadLettered: number;
	stoppedEarly: boolean;
	runtimeMs: number;
	skipped?: "lock_held";
}

/** Per-job result for bulk operations. */
export interface BulkJobResult {
	jobId: number;
	ok: boolean;
	error?: string;
}
