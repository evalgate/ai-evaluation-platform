import { logger } from "@/lib/logger";

export type EvalgateTelemetryEvent =
	| "evalgate.analysis.generated"
	| "evalgate.cluster.generated"
	| "evalgate.synthesis.preview_generated"
	| "evalgate.synthesis.accepted"
	| "evalgate.auto.session_created"
	| "evalgate.auto.run_started"
	| "evalgate.auto.run_completed"
	| "evalgate.auto.run_stopped"
	| "evalgate.auto.run_failed";

interface TelemetryPayloadMap {
	"evalgate.analysis.generated": {
		organizationId?: number;
		evaluationId?: number;
		runId?: number;
		source: "run" | "dataset_content";
		total: number;
		failed: number;
	};
	"evalgate.cluster.generated": {
		organizationId: number;
		evaluationId: number;
		runId: number;
		clusterCount: number;
		clusteredCases: number;
		skippedCases: number;
	};
	"evalgate.synthesis.preview_generated": {
		organizationId?: number;
		evaluationId?: number;
		source: "dataset_content";
		generated: number;
		sourceCases: number;
		sourceFailures: number;
	};
	"evalgate.synthesis.accepted": {
		organizationId: number;
		evaluationId: number;
		artifactId: number;
		createdCount: number;
	};
	"evalgate.auto.session_created": {
		organizationId: number;
		evaluationId: number;
		sessionId: string;
		allowedFamilyCount: number;
		maxIterations: number;
	};
	"evalgate.auto.run_started": {
		organizationId: number;
		sessionId: string;
		jobId?: string;
		source: "service" | "worker";
	};
	"evalgate.auto.run_completed": {
		organizationId: number;
		sessionId: string;
		currentIteration: number;
		stopReason: string | null;
	};
	"evalgate.auto.run_stopped": {
		organizationId: number;
		sessionId: string;
		reason: string;
	};
	"evalgate.auto.run_failed": {
		organizationId: number;
		sessionId: string;
		error: string;
	};
}

export type EvalgateTelemetryPayload<T extends EvalgateTelemetryEvent> =
	TelemetryPayloadMap[T];

function logTelemetry(
	event: EvalgateTelemetryEvent,
	payload: TelemetryPayloadMap[EvalgateTelemetryEvent],
): void {
	const maybeChildLogger = logger as typeof logger & {
		child?: (context: Record<string, unknown>) => typeof logger;
	};
	if (typeof maybeChildLogger.child === "function") {
		maybeChildLogger.child({ channel: "telemetry" }).info("event", {
			event,
			payload,
		});
		return;
	}

	logger.info("event", {
		channel: "telemetry",
		event,
		payload,
	});
}

export function track<T extends EvalgateTelemetryEvent>(
	event: T,
	payload: EvalgateTelemetryPayload<T>,
): void {
	try {
		void Promise.resolve().then(() => {
			try {
				logTelemetry(event, payload);
			} catch {
				return;
			}
		});
	} catch {
		return;
	}
}
