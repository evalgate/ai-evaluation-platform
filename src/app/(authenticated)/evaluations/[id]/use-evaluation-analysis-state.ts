import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
	FailureModeSummary,
	PersistedEvalgateArtifact,
	RunClusterPreview,
	RunDatasetPreview,
	RunInsightKind,
	RunInsightState,
} from "./evalgate-types";
import { mergeArtifacts } from "./evalgate-utils";

interface UseEvaluationAnalysisStateOptions {
	evaluationId: string;
	onSynthesisAccepted?: () => Promise<void> | void;
}

export function useEvaluationAnalysisState({
	evaluationId,
	onSynthesisAccepted,
}: UseEvaluationAnalysisStateOptions) {
	const [runInsights, setRunInsights] = useState<
		Record<number, RunInsightState>
	>({});
	const [artifactsLoading, setArtifactsLoading] = useState(false);
	const [evaluationArtifacts, setEvaluationArtifacts] = useState<
		PersistedEvalgateArtifact[]
	>([]);
	const [selectedArtifact, setSelectedArtifact] =
		useState<PersistedEvalgateArtifact | null>(null);
	const [artifactDialogOpen, setArtifactDialogOpen] = useState(false);
	const [deletingArtifactId, setDeletingArtifactId] = useState<number | null>(
		null,
	);
	const [acceptingArtifactId, setAcceptingArtifactId] = useState<number | null>(
		null,
	);

	const updateRunInsight = useCallback(
		(runId: number, patch: Partial<RunInsightState>) => {
			setRunInsights((current) => ({
				...current,
				[runId]: {
					...(current[runId] ?? {}),
					...patch,
				},
			}));
		},
		[],
	);

	const loadEvaluationArtifacts = useCallback(
		async (silent = false) => {
			if (!silent) {
				setArtifactsLoading(true);
			}

			try {
				const response = await fetch(
					`/api/evaluations/${evaluationId}/artifacts?limit=25`,
					{
						credentials: "include",
					},
				);
				const data = (await response.json()) as
					| {
							error?: { message?: string };
							artifacts?: PersistedEvalgateArtifact[];
					  }
					| undefined;

				if (!response.ok) {
					throw new Error(
						data?.error?.message ?? "Failed to load saved artifacts",
					);
				}

				setEvaluationArtifacts(data?.artifacts ?? []);
			} catch (error) {
				if (!silent) {
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to load saved artifacts",
					);
				}
			} finally {
				setArtifactsLoading(false);
			}
		},
		[evaluationId],
	);

	const loadRunArtifacts = useCallback(
		async (runId: number, silent = false) => {
			if (!silent) {
				updateRunInsight(runId, { artifactsLoading: true, error: null });
			}

			try {
				const response = await fetch(
					`/api/evaluations/${evaluationId}/artifacts?runId=${runId}&limit=10`,
					{
						credentials: "include",
					},
				);
				const data = (await response.json()) as
					| {
							error?: { message?: string };
							artifacts?: PersistedEvalgateArtifact[];
					  }
					| undefined;

				if (!response.ok) {
					throw new Error(
						data?.error?.message ??
							`Failed to load saved artifacts for run ${runId}`,
					);
				}

				updateRunInsight(runId, {
					artifactsLoading: false,
					savedArtifacts: data?.artifacts ?? [],
				});
				setEvaluationArtifacts((current) =>
					mergeArtifacts(current, data?.artifacts ?? [], {
						replaceRunId: runId,
					}),
				);
			} catch (error) {
				updateRunInsight(runId, {
					artifactsLoading: false,
				});
				if (!silent) {
					const message =
						error instanceof Error
							? error.message
							: `Failed to load saved artifacts for run ${runId}`;
					toast.error(message);
				}
			}
		},
		[evaluationId, updateRunInsight],
	);

	const saveRunArtifact = async (
		runId: number,
		kind: "dataset" | "analysis" | "cluster",
	) => {
		const insight = runInsights[runId] ?? {};
		if (kind === "dataset" && !insight.dataset) {
			toast.error("Generate the labeled dataset before saving it.");
			return;
		}
		if (kind === "analysis" && !insight.analysis) {
			toast.error("Generate the failure analysis before saving it.");
			return;
		}
		if (
			kind === "cluster" &&
			(!insight.clusters || insight.clusters.length === 0)
		) {
			toast.error("Generate trace clusters before saving them.");
			return;
		}

		const artifactType =
			kind === "dataset"
				? "labeled_dataset"
				: kind === "analysis"
					? "analysis"
					: "cluster";

		updateRunInsight(runId, { saving: kind, error: null });

		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						artifactType,
						runId,
					}),
				},
			);
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & PersistedEvalgateArtifact)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ??
						`Failed to save ${kind} artifact for run ${runId}`,
				);
			}

			const artifact = data as PersistedEvalgateArtifact;
			updateRunInsight(runId, {
				saving: undefined,
				savedArtifacts: [
					artifact,
					...(runInsights[runId]?.savedArtifacts ?? []).filter(
						(existingArtifact) => existingArtifact.id !== artifact.id,
					),
				],
			});
			setEvaluationArtifacts((current) => mergeArtifacts(current, [artifact]));
			toast.success(`Saved ${kind} artifact for run #${runId}`);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: `Failed to save ${kind} artifact for run ${runId}`;
			updateRunInsight(runId, { saving: undefined, error: message });
			toast.error(message);
		}
	};

	const openArtifactDetail = useCallback(
		(artifact: PersistedEvalgateArtifact) => {
			setSelectedArtifact(artifact);
			setArtifactDialogOpen(true);
		},
		[],
	);

	const deleteArtifact = async (artifact: PersistedEvalgateArtifact) => {
		setDeletingArtifactId(artifact.id);
		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/artifacts/${artifact.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			const data = (await response.json()) as
				| { error?: { message?: string } }
				| undefined;

			if (!response.ok) {
				throw new Error(data?.error?.message ?? "Failed to delete artifact");
			}

			setEvaluationArtifacts((current) =>
				current.filter((currentArtifact) => currentArtifact.id !== artifact.id),
			);
			setRunInsights((current) =>
				Object.fromEntries(
					Object.entries(current).map(([runId, insight]) => [
						runId,
						{
							...insight,
							savedArtifacts: (insight.savedArtifacts ?? []).filter(
								(savedArtifact) => savedArtifact.id !== artifact.id,
							),
						},
					]),
				),
			);
			if (selectedArtifact?.id === artifact.id) {
				setArtifactDialogOpen(false);
				setSelectedArtifact(null);
			}
			toast.success("Deleted artifact");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete artifact",
			);
		} finally {
			setDeletingArtifactId(null);
		}
	};

	const acceptSynthesisArtifact = async (
		artifact: PersistedEvalgateArtifact,
	) => {
		setAcceptingArtifactId(artifact.id);
		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/artifacts/${artifact.id}/accept`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			const data = (await response.json()) as
				| { error?: { message?: string }; createdCount?: number }
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to accept synthesis artifact",
				);
			}

			await onSynthesisAccepted?.();
			toast.success(
				`Accepted ${data?.createdCount ?? 0} synthetic case${
					(data?.createdCount ?? 0) === 1 ? "" : "s"
				}`,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to accept synthesis artifact",
			);
		} finally {
			setAcceptingArtifactId(null);
		}
	};

	const fetchRunInsight = async (runId: number, kind: RunInsightKind) => {
		updateRunInsight(runId, { loading: kind, error: null });
		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/runs/${runId}/${kind}`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}),
				},
			);
			const data = (await response.json()) as
				| {
						error?: { message?: string };
						total?: number;
						passed?: number;
						failed?: number;
						content?: string;
						dataset?: RunDatasetPreview;
						summary?: {
							total?: number;
							failed?: number;
							passRate?: number;
							failureModes?: FailureModeSummary[];
							clusters?: RunClusterPreview[];
						};
				  }
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? `Failed to load ${kind} for run ${runId}`,
				);
			}

			if (kind === "dataset") {
				updateRunInsight(runId, {
					loading: undefined,
					dataset: {
						total: data?.total ?? 0,
						passed: data?.passed ?? 0,
						failed: data?.failed ?? 0,
						content: data?.content ?? "",
					},
				});
				return;
			}

			if (kind === "analysis") {
				updateRunInsight(runId, {
					loading: undefined,
					dataset: data?.dataset,
					analysis: {
						total: data?.summary?.total ?? 0,
						failed: data?.summary?.failed ?? 0,
						passRate: data?.summary?.passRate ?? 0,
						failureModes: data?.summary?.failureModes ?? [],
					},
				});
				return;
			}

			updateRunInsight(runId, {
				loading: undefined,
				clusters: data?.summary?.clusters ?? [],
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: `Failed to load ${kind} for run ${runId}`;
			updateRunInsight(runId, {
				loading: undefined,
				error: message,
			});
			toast.error(message);
		}
	};

	return {
		runInsights,
		artifactsLoading,
		evaluationArtifacts,
		selectedArtifact,
		artifactDialogOpen,
		setArtifactDialogOpen,
		loadEvaluationArtifacts,
		loadRunArtifacts,
		saveRunArtifact,
		deleteArtifact,
		acceptSynthesisArtifact,
		deletingArtifactId,
		acceptingArtifactId,
		openArtifactDetail,
		fetchRunInsight,
		updateRunInsight,
		setEvaluationArtifacts,
	};
}
