/**
 * Job runner error taxonomy.
 *
 * Tests expect these exact string values.
 */
export const JobErrorCodes = {
	HANDLER_MISSING: "JOB_HANDLER_MISSING",
	HANDLER_ERROR: "JOB_HANDLER_ERROR",
	PAYLOAD_INVALID: "JOB_PAYLOAD_INVALID",
} as const;

export type JobErrorCode = (typeof JobErrorCodes)[keyof typeof JobErrorCodes];
