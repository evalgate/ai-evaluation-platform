import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { evalgateArtifacts, evaluations } from "@/db/schema";
import type {
	EvalgateArtifactKind,
	EvalgateArtifactMetadata,
	EvalgateArtifactPayload,
	EvalgateArtifactSummary,
} from "@/db/types";
import { evalgateComputeService } from "@/lib/services/evalgate-compute.service";
import { testCaseService } from "@/lib/services/test-case.service";
import { track } from "@/lib/telemetry";

export interface CreateEvalgateArtifactInput {
	artifactType: EvalgateArtifactKind;
	title?: string;
	runId?: number;
	datasetContent?: string;
	includePassed?: boolean;
	top?: number;
	clusters?: number | null;
	dimensions?: Record<string, string[]>;
	count?: number | null;
	failureModes?: string[];
	specs?: Array<{
		id: string;
		name: string;
		file: string;
		tags: string[];
		hasAssertions: boolean;
		usesModels: boolean;
		usesTools: boolean;
		complexity: "simple" | "medium" | "complex";
		fingerprintText?: string;
	}>;
	threshold?: number;
}

async function evaluationExists(
	organizationId: number,
	evaluationId: number,
): Promise<boolean> {
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
	return !!evaluation;
}

function nowIso(): string {
	return new Date().toISOString();
}

async function getArtifact(
	organizationId: number,
	evaluationId: number,
	artifactId: number,
) {
	const [artifact] = await db
		.select()
		.from(evalgateArtifacts)
		.where(
			and(
				eq(evalgateArtifacts.id, artifactId),
				eq(evalgateArtifacts.organizationId, organizationId),
				eq(evalgateArtifacts.evaluationId, evaluationId),
			),
		)
		.limit(1);
	return artifact ?? null;
}

export const evalgateArtifactService = {
	async list(
		organizationId: number,
		evaluationId: number,
		options: {
			limit: number;
			offset: number;
			artifactType?: EvalgateArtifactKind;
			runId?: number;
		},
	) {
		const exists = await evaluationExists(organizationId, evaluationId);
		if (!exists) {
			return null;
		}

		const conditions = [
			eq(evalgateArtifacts.organizationId, organizationId),
			eq(evalgateArtifacts.evaluationId, evaluationId),
		];
		if (options.artifactType) {
			conditions.push(eq(evalgateArtifacts.kind, options.artifactType));
		}
		if (options.runId) {
			conditions.push(eq(evalgateArtifacts.evaluationRunId, options.runId));
		}

		const artifacts = await db
			.select()
			.from(evalgateArtifacts)
			.where(and(...conditions))
			.orderBy(desc(evalgateArtifacts.createdAt))
			.limit(options.limit)
			.offset(options.offset);

		return { artifacts };
	},

	async create(
		organizationId: number,
		evaluationId: number,
		createdBy: string,
		input: CreateEvalgateArtifactInput,
	) {
		const exists = await evaluationExists(organizationId, evaluationId);
		if (!exists) {
			return null;
		}

		const generatedAt = nowIso();
		let evaluationRunId: number | null = input.runId ?? null;
		let title = input.title?.trim();
		let summary: EvalgateArtifactSummary;
		let payload: EvalgateArtifactPayload;
		let metadata: EvalgateArtifactMetadata;

		switch (input.artifactType) {
			case "labeled_dataset": {
				const runId = input.runId;
				if (typeof runId !== "number") {
					return null;
				}
				const dataset = await evalgateComputeService.buildRunDataset(
					organizationId,
					evaluationId,
					runId,
					{ includePassed: input.includePassed },
				);
				if (!dataset) {
					return null;
				}
				title ||= `Run ${runId} labeled dataset`;
				summary = {
					total: dataset.total,
					passed: dataset.passed,
					failed: dataset.failed,
				};
				payload = {
					run: dataset.run,
					rows: dataset.rows,
					content: dataset.content,
					total: dataset.total,
					passed: dataset.passed,
					failed: dataset.failed,
				};
				metadata = {
					source: "evaluation_run",
					generatedAt,
					evaluationId,
					evaluationRunId: dataset.run.id,
					includePassed: input.includePassed ?? true,
					rowCount: dataset.total,
					artifactVersion: "v1",
				};
				break;
			}
			case "analysis": {
				if (input.runId) {
					const result = await evalgateComputeService.analyzeRunDataset(
						organizationId,
						evaluationId,
						input.runId,
						{ includePassed: input.includePassed, top: input.top },
					);
					if (!result) {
						return null;
					}
					title ||= `Run ${input.runId} failure analysis`;
					evaluationRunId = result.run.id;
					summary = {
						total: result.summary.total,
						failed: result.summary.failed,
						passRate: result.summary.passRate,
						failureModes: result.summary.failureModes,
					};
					payload = {
						run: result.run,
						dataset: result.dataset,
						summary: result.summary,
					};
					metadata = {
						source: "evaluation_run",
						generatedAt,
						evaluationId,
						evaluationRunId: result.run.id,
						includePassed: input.includePassed ?? true,
						top: input.top ?? 5,
						rowCount: result.dataset.total,
						artifactVersion: "v1",
					};
				} else {
					const datasetContent = input.datasetContent;
					if (typeof datasetContent !== "string") {
						return null;
					}
					const result = evalgateComputeService.analyzeDatasetContent(
						datasetContent,
						input.top ?? 5,
					);
					title ||= "Dataset failure analysis";
					summary = {
						total: result.summary.total,
						failed: result.summary.failed,
						passRate: result.summary.passRate,
						failureModes: result.summary.failureModes,
					};
					payload = {
						rows: result.rows,
						summary: result.summary,
					};
					metadata = {
						source: "dataset_content",
						generatedAt,
						evaluationId,
						top: input.top ?? 5,
						rowCount: result.rows.length,
						artifactVersion: "v1",
					};
				}
				break;
			}
			case "cluster": {
				const runId = input.runId;
				if (typeof runId !== "number") {
					return null;
				}
				const result = await evalgateComputeService.clusterRun(
					organizationId,
					evaluationId,
					runId,
					{ clusters: input.clusters, includePassed: input.includePassed },
				);
				if (!result) {
					return null;
				}
				title ||= `Run ${runId} trace clusters`;
				evaluationRunId = result.run.id;
				summary = {
					clusters: result.summary.clusters.length,
					clusteredCases: result.summary.clusteredCases,
					skippedCases: result.summary.skippedCases,
				};
				payload = {
					run: result.run,
					summary: result.summary,
				};
				metadata = {
					source: "evaluation_run",
					generatedAt,
					evaluationId,
					evaluationRunId: result.run.id,
					includePassed: input.includePassed ?? false,
					clusters: input.clusters ?? null,
					artifactVersion: "v1",
				};
				break;
			}
			case "synthesis": {
				const datasetContent = input.datasetContent;
				if (typeof datasetContent !== "string") {
					return null;
				}
				const result = evalgateComputeService.synthesizeDatasetContent(
					datasetContent,
					{
						dimensions: input.dimensions,
						count: input.count,
						failureModes: input.failureModes,
					},
				);
				title ||= "Synthetic case generation";
				summary = {
					generated: result.generated,
					sourceCases: result.sourceCases,
					sourceFailures: result.sourceFailures,
					selectedFailureModes: result.selectedFailureModes,
				};
				payload = result as unknown as EvalgateArtifactPayload;
				metadata = {
					source: "dataset_content",
					generatedAt,
					evaluationId,
					rowCount: result.sourceCases,
					artifactVersion: "v1",
				};
				break;
			}
			case "diversity": {
				const specs = input.specs;
				if (!specs) {
					return null;
				}
				const diversity = evalgateComputeService.discoverDiversity(
					specs,
					input.threshold,
				);
				title ||= "Spec diversity report";
				summary = {
					specCount: specs.length,
					score: diversity.score,
					redundantPairCount: diversity.redundantPairs.length,
				};
				payload = {
					specs,
					diversity,
				};
				metadata = {
					source: "spec_inventory",
					generatedAt,
					evaluationId,
					threshold: input.threshold,
					rowCount: specs.length,
					artifactVersion: "v1",
				};
				break;
			}
		}

		const [artifact] = await db
			.insert(evalgateArtifacts)
			.values({
				organizationId,
				evaluationId,
				evaluationRunId,
				kind: input.artifactType,
				title: title ?? `${input.artifactType} artifact`,
				summary,
				payload,
				metadata,
				createdBy,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return artifact;
	},

	async remove(
		organizationId: number,
		evaluationId: number,
		artifactId: number,
	): Promise<boolean> {
		const exists = await evaluationExists(organizationId, evaluationId);
		if (!exists) {
			return false;
		}

		const artifact = await getArtifact(
			organizationId,
			evaluationId,
			artifactId,
		);
		if (!artifact) {
			return false;
		}

		await db
			.delete(evalgateArtifacts)
			.where(eq(evalgateArtifacts.id, artifactId));
		return true;
	},

	async acceptSynthesis(
		organizationId: number,
		evaluationId: number,
		artifactId: number,
	): Promise<{ artifactId: number; createdCount: number } | null> {
		const exists = await evaluationExists(organizationId, evaluationId);
		if (!exists) {
			return null;
		}

		const artifact = await getArtifact(
			organizationId,
			evaluationId,
			artifactId,
		);
		if (!artifact || artifact.kind !== "synthesis") {
			return null;
		}

		const payload = (artifact.payload ?? {}) as {
			cases?: Array<{
				caseId?: string;
				input?: string;
				expected?: string;
			}>;
		};
		const cases = Array.isArray(payload.cases) ? payload.cases : [];
		let createdCount = 0;

		for (const item of cases) {
			if (!item?.input || typeof item.input !== "string") {
				continue;
			}
			await testCaseService.create(organizationId, evaluationId, {
				name:
					typeof item.caseId === "string" && item.caseId.trim().length > 0
						? item.caseId.trim()
						: undefined,
				input: item.input,
				expectedOutput:
					typeof item.expected === "string" ? item.expected : undefined,
				metadata: {
					source: "evalgate_synthesis_artifact",
					artifactId,
				},
			});
			createdCount += 1;
		}

		track("evalgate.synthesis.accepted", {
			organizationId,
			evaluationId,
			artifactId,
			createdCount,
		});

		return { artifactId, createdCount };
	},
};
