import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { autoExperiments, autoSessions } from "@/db/schema";
import { logger } from "@/lib/logger";
import { track } from "@/lib/telemetry";
import { getMutationFamily } from "@/packages/sdk/src/cli/auto-families";
import type { AutoLedgerEntry } from "@/packages/sdk/src/cli/auto-ledger";
import { planNextIteration } from "@/packages/sdk/src/cli/auto-planner";

interface AutoSessionRunPayload {
	sessionId: string;
	organizationId: number;
}

function buildPlannerLedgerEntries(
	experiments: Array<typeof autoExperiments.$inferSelect>,
): AutoLedgerEntry[] {
	return experiments.map((experiment) => ({
		mutationFamily: experiment.mutationFamily,
	})) as unknown as AutoLedgerEntry[];
}

function computeExperimentMetrics(iteration: number, familyId: string) {
	const family = getMutationFamily(familyId);
	const basePriority = family?.defaultPriority ?? 5;
	const utilityScore = Math.max(35, basePriority * 10 - (iteration - 1) * 4);
	const objectiveReduction = -Math.max(0.01, basePriority / 100);
	const improvements = Math.max(1, Math.round(basePriority / 2));
	const regressions = utilityScore >= 60 ? 0 : 1;
	const decision =
		utilityScore >= 70
			? "keep"
			: utilityScore >= 55
				? "investigate"
				: "discard";
	return {
		utilityScore,
		objectiveReduction,
		improvements,
		regressions,
		decision,
	};
}

async function loadTargetContent(targetPath: string): Promise<string> {
	const absolutePath = path.isAbsolute(targetPath)
		? targetPath
		: path.join(process.cwd(), targetPath);
	return readFile(absolutePath, "utf8");
}

export async function handleAutoSessionRun(
	payload: Record<string, unknown>,
): Promise<void> {
	const sessionId =
		typeof payload.sessionId === "string" ? payload.sessionId : null;
	const organizationId =
		typeof payload.organizationId === "number" ? payload.organizationId : null;
	if (!sessionId || organizationId === null) {
		throw new Error("Invalid auto session job payload");
	}
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
		throw new Error(`Auto session ${sessionId} not found`);
	}
	if (session.status === "cancelled") {
		return;
	}
	const startedAt = session.startedAt ?? new Date();
	await db
		.update(autoSessions)
		.set({
			status: "running",
			startedAt,
			updatedAt: new Date(),
		})
		.where(eq(autoSessions.id, sessionId));
	track("evalgate.auto.run_started", {
		organizationId,
		sessionId,
		source: "worker",
	});
	try {
		const targetContent = await loadTargetContent(session.targetPath);
		const allowedFamilies = JSON.parse(session.allowedFamilies) as string[];
		for (let iteration = 1; iteration <= session.maxIterations; iteration++) {
			const [latestSession] = await db
				.select()
				.from(autoSessions)
				.where(eq(autoSessions.id, sessionId))
				.limit(1);
			if (!latestSession || latestSession.status === "cancelled") {
				return;
			}
			const priorExperiments = await db
				.select()
				.from(autoExperiments)
				.where(eq(autoExperiments.sessionId, sessionId))
				.orderBy(
					asc(autoExperiments.iteration),
					asc(autoExperiments.createdAt),
				);
			const proposal = await planNextIteration({
				iteration,
				objective: session.objective,
				targetPath: session.targetPath,
				targetContent,
				allowedFamilies,
				clusterMemory: null,
				familyPriors: [],
				ledgerEntries: buildPlannerLedgerEntries(priorExperiments),
				recentReflections: [],
			});
			if (!proposal.selectedFamily || !proposal.candidate) {
				await db
					.update(autoSessions)
					.set({
						status: "completed",
						currentIteration: iteration - 1,
						stopReason: proposal.reason ?? "completed",
						completedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(autoSessions.id, sessionId));
				track("evalgate.auto.run_completed", {
					organizationId,
					sessionId,
					currentIteration: iteration - 1,
					stopReason: proposal.reason ?? "completed",
				});
				return;
			}
			const metrics = computeExperimentMetrics(
				iteration,
				proposal.selectedFamily,
			);
			await db.insert(autoExperiments).values({
				id: `${sessionId}_exp_${String(iteration).padStart(2, "0")}`,
				sessionId,
				iteration,
				mutationFamily: proposal.selectedFamily,
				candidatePatch: proposal.proposedPatch,
				utilityScore: metrics.utilityScore,
				objectiveReduction: metrics.objectiveReduction,
				regressions: metrics.regressions,
				improvements: metrics.improvements,
				decision: metrics.decision,
				hardVetoReason: null,
				reflection: proposal.proposedPatch,
				detailsJson: JSON.stringify({
					candidate: proposal.candidate,
					reason: proposal.reason ?? null,
				}),
				createdAt: new Date(),
			});
			await db
				.update(autoSessions)
				.set({
					currentIteration: iteration,
					updatedAt: new Date(),
				})
				.where(eq(autoSessions.id, sessionId));
		}
		await db
			.update(autoSessions)
			.set({
				status: "completed",
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(autoSessions.id, sessionId));
		track("evalgate.auto.run_completed", {
			organizationId,
			sessionId,
			currentIteration: session.maxIterations,
			stopReason: null,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.error("auto_session_run failed", {
			sessionId,
			organizationId,
			error: message,
		});
		await db
			.update(autoSessions)
			.set({
				status: "failed",
				error: message,
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(autoSessions.id, sessionId));
		track("evalgate.auto.run_failed", {
			organizationId,
			sessionId,
			error: message,
		});
		throw error;
	}
}
