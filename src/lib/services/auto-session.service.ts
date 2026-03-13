import crypto from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { autoExperiments, autoSessions, evaluations } from "@/db/schema";
import { enqueue } from "@/lib/jobs/enqueue";
import { track } from "@/lib/telemetry";
import { getMutationFamily } from "@/packages/sdk/src/cli/auto-families";

export interface CreateAutoSessionInput {
	organizationId: number;
	evaluationId: number;
	createdBy: string;
	name: string;
	objective: string;
	targetPath: string;
	allowedFamilies: string[];
	maxIterations: number;
	maxCostUsd?: number;
}

export interface AutoExperimentSummary {
	id: string;
	iteration: number;
	mutationFamily: string;
	candidatePatch: string | null;
	utilityScore: number | null;
	objectiveReduction: number | null;
	regressions: number | null;
	improvements: number | null;
	decision: string | null;
	hardVetoReason: string | null;
	reflection: string | null;
	createdAt: string;
}

export interface AutoSessionStatus {
	sessionId: string;
	name: string;
	objective: string;
	status: "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
	currentIteration: number;
	maxIterations: number;
	experiments: AutoExperimentSummary[];
	bestExperiment: AutoExperimentSummary | null;
	budgetUsed: { iterations: number; costUsd: number };
	startedAt: string | null;
	completedAt: string | null;
	stopReason: string | null;
	error: string | null;
}

export interface AutoSessionListItem {
	sessionId: string;
	name: string;
	status: string;
	currentIteration: number;
	maxIterations: number;
	createdAt: string;
}

export type AutoSessionServiceErrorCode =
	| "NOT_FOUND"
	| "CONFLICT"
	| "VALIDATION";

export class AutoSessionServiceError extends Error {
	constructor(
		message: string,
		public readonly code: AutoSessionServiceErrorCode,
	) {
		super(message);
		this.name = "AutoSessionServiceError";
	}
}

function createAutoRecordId(prefix: string): string {
	return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function toIsoString(value: Date | null | undefined): string | null {
	return value ? value.toISOString() : null;
}

function assertKnownFamilies(allowedFamilies: string[]): void {
	const unknownFamilies = allowedFamilies.filter(
		(familyId) => !getMutationFamily(familyId),
	);
	if (unknownFamilies.length > 0) {
		throw new AutoSessionServiceError(
			`Unknown mutation families: ${unknownFamilies.join(", ")}`,
			"VALIDATION",
		);
	}
}

async function assertEvaluationAccess(
	evaluationId: number,
	organizationId: number,
): Promise<void> {
	const [evaluation] = await db
		.select({ id: evaluations.id })
		.from(evaluations)
		.where(
			and(
				eq(evaluations.id, evaluationId),
				eq(evaluations.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!evaluation) {
		throw new AutoSessionServiceError("Evaluation not found", "NOT_FOUND");
	}
}

async function getScopedSession(sessionId: string, organizationId: number) {
	const [session] = await db
		.select()
		.from(autoSessions)
		.where(
			and(
				eq(autoSessions.id, sessionId),
				eq(autoSessions.organizationId, organizationId),
			),
		)
		.limit(1);
	if (!session) {
		throw new AutoSessionServiceError("Auto session not found", "NOT_FOUND");
	}
	return session;
}

function mapExperimentSummary(
	experiment: typeof autoExperiments.$inferSelect,
): AutoExperimentSummary {
	return {
		id: experiment.id,
		iteration: experiment.iteration,
		mutationFamily: experiment.mutationFamily,
		candidatePatch: experiment.candidatePatch,
		utilityScore: experiment.utilityScore ?? null,
		objectiveReduction: experiment.objectiveReduction ?? null,
		regressions: experiment.regressions ?? null,
		improvements: experiment.improvements ?? null,
		decision: experiment.decision ?? null,
		hardVetoReason: experiment.hardVetoReason ?? null,
		reflection: experiment.reflection ?? null,
		createdAt: experiment.createdAt.toISOString(),
	};
}

export async function createAutoSession(
	input: CreateAutoSessionInput,
): Promise<{ sessionId: string }> {
	assertKnownFamilies(input.allowedFamilies);
	await assertEvaluationAccess(input.evaluationId, input.organizationId);
	const sessionId = createAutoRecordId("session");
	const now = new Date();
	await db.insert(autoSessions).values({
		id: sessionId,
		organizationId: input.organizationId,
		evaluationId: input.evaluationId,
		createdBy: input.createdBy,
		name: input.name.trim(),
		objective: input.objective.trim(),
		targetPath: input.targetPath.trim(),
		allowedFamilies: JSON.stringify(input.allowedFamilies),
		maxIterations: input.maxIterations,
		maxCostUsd: input.maxCostUsd ?? null,
		status: "idle",
		jobId: null,
		currentIteration: 0,
		stopReason: null,
		error: null,
		startedAt: null,
		completedAt: null,
		createdAt: now,
		updatedAt: now,
	});
	track("evalgate.auto.session_created", {
		organizationId: input.organizationId,
		evaluationId: input.evaluationId,
		sessionId,
		allowedFamilyCount: input.allowedFamilies.length,
		maxIterations: input.maxIterations,
	});
	return { sessionId };
}

export async function startAutoSession(
	sessionId: string,
	organizationId: number,
): Promise<{ jobId: string; status: "queued" }> {
	const session = await getScopedSession(sessionId, organizationId);
	if (session.status === "queued" || session.status === "running") {
		throw new AutoSessionServiceError(
			"Auto session is already queued or running",
			"CONFLICT",
		);
	}
	await db
		.delete(autoExperiments)
		.where(eq(autoExperiments.sessionId, sessionId));
	const now = new Date();
	const jobId = await enqueue(
		"auto_session_run",
		{ sessionId, organizationId },
		{
			organizationId,
			meta: { source: "auto_session", createdBy: session.createdBy },
		},
	);
	await db
		.update(autoSessions)
		.set({
			status: "queued",
			jobId,
			currentIteration: 0,
			stopReason: null,
			error: null,
			startedAt: null,
			completedAt: null,
			updatedAt: now,
		})
		.where(eq(autoSessions.id, sessionId));
	track("evalgate.auto.run_started", {
		organizationId,
		sessionId,
		jobId: String(jobId),
		source: "service",
	});
	return { jobId: String(jobId), status: "queued" };
}

export async function getAutoSessionStatus(
	sessionId: string,
	organizationId: number,
): Promise<AutoSessionStatus> {
	const session = await getScopedSession(sessionId, organizationId);
	const experiments = await db
		.select()
		.from(autoExperiments)
		.where(eq(autoExperiments.sessionId, sessionId))
		.orderBy(asc(autoExperiments.iteration), asc(autoExperiments.createdAt));
	const summaries = experiments.map(mapExperimentSummary);
	const bestExperiment =
		[...summaries]
			.filter(
				(experiment) =>
					experiment.decision === "keep" && experiment.utilityScore !== null,
			)
			.sort(
				(left, right) =>
					(right.utilityScore ?? -Infinity) - (left.utilityScore ?? -Infinity),
			)[0] ?? null;
	return {
		sessionId: session.id,
		name: session.name,
		objective: session.objective,
		status: session.status as AutoSessionStatus["status"],
		currentIteration: session.currentIteration,
		maxIterations: session.maxIterations,
		experiments: summaries,
		bestExperiment,
		budgetUsed: {
			iterations: experiments.length,
			costUsd: 0,
		},
		startedAt: toIsoString(session.startedAt),
		completedAt: toIsoString(session.completedAt),
		stopReason: session.stopReason,
		error: session.error,
	};
}

export async function listAutoSessions(
	evaluationId: number,
	organizationId: number,
): Promise<AutoSessionListItem[]> {
	await assertEvaluationAccess(evaluationId, organizationId);
	const sessions = await db
		.select()
		.from(autoSessions)
		.where(
			and(
				eq(autoSessions.evaluationId, evaluationId),
				eq(autoSessions.organizationId, organizationId),
			),
		)
		.orderBy(desc(autoSessions.createdAt));
	return sessions.map((session) => ({
		sessionId: session.id,
		name: session.name,
		status: session.status,
		currentIteration: session.currentIteration,
		maxIterations: session.maxIterations,
		createdAt: session.createdAt.toISOString(),
	}));
}

export async function stopAutoSession(
	sessionId: string,
	organizationId: number,
): Promise<{ status: "cancelled" }> {
	const session = await getScopedSession(sessionId, organizationId);
	if (
		session.status === "completed" ||
		session.status === "failed" ||
		session.status === "cancelled"
	) {
		throw new AutoSessionServiceError(
			"Auto session is already in a terminal state",
			"CONFLICT",
		);
	}
	const now = new Date();
	await db
		.update(autoSessions)
		.set({
			status: "cancelled",
			stopReason: "user_requested",
			completedAt: now,
			updatedAt: now,
		})
		.where(eq(autoSessions.id, sessionId));
	track("evalgate.auto.run_stopped", {
		organizationId,
		sessionId,
		reason: "user_requested",
	});
	return { status: "cancelled" };
}
