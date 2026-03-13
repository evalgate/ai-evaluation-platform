import { useState } from "react";
import { toast } from "sonner";
import {
	parseDimensionMatrix,
	type SynthesizeSummary,
} from "@/lib/evalgate/synthesize-core";
import type {
	DiversityPreview,
	EvaluationRun,
	PersistedEvalgateArtifact,
	RunInsightState,
} from "./evalgate-types";
import {
	mergeArtifacts,
	parseDiscoverableSpecsInput,
	parseListInput,
	parseOptionalIntegerInput,
	parseOptionalThresholdInput,
} from "./evalgate-utils";

interface UseEvaluationSynthesisStateOptions {
	evaluationId: string;
	runs: EvaluationRun[];
	runInsights: Record<number, RunInsightState>;
	updateRunInsight: (runId: number, patch: Partial<RunInsightState>) => void;
	setEvaluationArtifacts: (
		updater: (
			current: PersistedEvalgateArtifact[],
		) => PersistedEvalgateArtifact[],
	) => void;
}

export function useEvaluationSynthesisState({
	evaluationId,
	runs,
	runInsights,
	updateRunInsight,
	setEvaluationArtifacts,
}: UseEvaluationSynthesisStateOptions) {
	const [synthesisDatasetContent, setSynthesisDatasetContentState] =
		useState("");
	const [synthesisDimensionsInput, setSynthesisDimensionsInputState] =
		useState("");
	const [synthesisFailureModesInput, setSynthesisFailureModesInputState] =
		useState("");
	const [synthesisCountInput, setSynthesisCountInputState] = useState("");
	const [synthesisPreview, setSynthesisPreview] =
		useState<SynthesizeSummary | null>(null);
	const [synthesisLoading, setSynthesisLoading] = useState(false);
	const [synthesisSaving, setSynthesisSaving] = useState(false);
	const [synthesisDatasetLoading, setSynthesisDatasetLoading] = useState(false);
	const [diversitySpecsInput, setDiversitySpecsInputState] = useState("");
	const [diversityThresholdInput, setDiversityThresholdInputState] =
		useState("");
	const [diversityPreview, setDiversityPreview] =
		useState<DiversityPreview | null>(null);
	const [diversityLoading, setDiversityLoading] = useState(false);
	const [diversitySaving, setDiversitySaving] = useState(false);

	const loadLatestRunDataset = async () => {
		const latestRun = runs[0];
		if (!latestRun) {
			toast.error("Run an evaluation first to seed synthesis from a dataset.");
			return;
		}

		const existingDataset = runInsights[latestRun.id]?.dataset?.content;
		if (existingDataset) {
			setSynthesisDatasetContentState(existingDataset);
			setSynthesisPreview(null);
			toast.success(`Loaded dataset from run #${latestRun.id}`);
			return;
		}

		setSynthesisDatasetLoading(true);
		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/runs/${latestRun.id}/dataset`,
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
				  }
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ??
						`Failed to load dataset for run ${latestRun.id}`,
				);
			}

			updateRunInsight(latestRun.id, {
				dataset: {
					total: data?.total ?? 0,
					passed: data?.passed ?? 0,
					failed: data?.failed ?? 0,
					content: data?.content ?? "",
				},
			});
			setSynthesisDatasetContentState(data?.content ?? "");
			setSynthesisPreview(null);
			toast.success(`Loaded dataset from run #${latestRun.id}`);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Failed to load dataset for run ${latestRun.id}`,
			);
		} finally {
			setSynthesisDatasetLoading(false);
		}
	};

	const generateSynthesisPreview = async () => {
		if (!synthesisDatasetContent.trim()) {
			toast.error("Dataset content is required for synthesis.");
			return;
		}

		setSynthesisLoading(true);
		try {
			const dimensions = synthesisDimensionsInput.trim()
				? parseDimensionMatrix(synthesisDimensionsInput).dimensions
				: undefined;
			const count = parseOptionalIntegerInput(
				synthesisCountInput,
				"Count",
				1,
				1000,
			);
			const failureModes = parseListInput(synthesisFailureModesInput);
			const response = await fetch(`/api/evalgate/synthesize`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					datasetContent: synthesisDatasetContent,
					dimensions,
					count,
					failureModes,
				}),
			});
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & Partial<SynthesizeSummary>)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to generate synthetic cases.",
				);
			}

			setSynthesisPreview(data as SynthesizeSummary);
			toast.success("Generated synthetic case preview");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to generate synthetic cases.",
			);
		} finally {
			setSynthesisLoading(false);
		}
	};

	const saveSynthesisArtifact = async () => {
		if (!synthesisDatasetContent.trim()) {
			toast.error("Dataset content is required before saving synthesis.");
			return;
		}

		setSynthesisSaving(true);
		try {
			const dimensions = synthesisDimensionsInput.trim()
				? parseDimensionMatrix(synthesisDimensionsInput).dimensions
				: undefined;
			const count = parseOptionalIntegerInput(
				synthesisCountInput,
				"Count",
				1,
				1000,
			);
			const failureModes = parseListInput(synthesisFailureModesInput);
			const response = await fetch(
				`/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						artifactType: "synthesis",
						datasetContent: synthesisDatasetContent,
						dimensions,
						count,
						failureModes,
					}),
				},
			);
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & PersistedEvalgateArtifact)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to save synthesis artifact.",
				);
			}

			setEvaluationArtifacts((current) =>
				mergeArtifacts(current, [data as PersistedEvalgateArtifact]),
			);
			toast.success("Saved synthesis artifact");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save synthesis artifact.",
			);
		} finally {
			setSynthesisSaving(false);
		}
	};

	const generateDiversityPreview = async () => {
		setDiversityLoading(true);
		try {
			const specs = parseDiscoverableSpecsInput(diversitySpecsInput);
			const threshold = parseOptionalThresholdInput(diversityThresholdInput);
			const response = await fetch(`/api/evalgate/discover-diversity`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ specs, threshold }),
			});
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & Partial<DiversityPreview>)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to generate diversity preview.",
				);
			}

			setDiversityPreview(data as DiversityPreview);
			toast.success("Generated diversity preview");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to generate diversity preview.",
			);
		} finally {
			setDiversityLoading(false);
		}
	};

	const saveDiversityArtifact = async () => {
		setDiversitySaving(true);
		try {
			const specs = parseDiscoverableSpecsInput(diversitySpecsInput);
			const threshold = parseOptionalThresholdInput(diversityThresholdInput);
			const response = await fetch(
				`/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						artifactType: "diversity",
						specs,
						threshold,
					}),
				},
			);
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & PersistedEvalgateArtifact)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to save diversity artifact.",
				);
			}

			setEvaluationArtifacts((current) =>
				mergeArtifacts(current, [data as PersistedEvalgateArtifact]),
			);
			toast.success("Saved diversity artifact");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save diversity artifact.",
			);
		} finally {
			setDiversitySaving(false);
		}
	};

	return {
		synthesisDatasetContent,
		synthesisDimensionsInput,
		synthesisFailureModesInput,
		synthesisCountInput,
		synthesisPreview,
		synthesisLoading,
		synthesisSaving,
		synthesisDatasetLoading,
		diversitySpecsInput,
		diversityThresholdInput,
		diversityPreview,
		diversityLoading,
		diversitySaving,
		setSynthesisDatasetContent: (value: string) => {
			setSynthesisDatasetContentState(value);
			setSynthesisPreview(null);
		},
		setSynthesisDimensionsInput: (value: string) => {
			setSynthesisDimensionsInputState(value);
			setSynthesisPreview(null);
		},
		setSynthesisFailureModesInput: (value: string) => {
			setSynthesisFailureModesInputState(value);
			setSynthesisPreview(null);
		},
		setSynthesisCountInput: (value: string) => {
			setSynthesisCountInputState(value);
			setSynthesisPreview(null);
		},
		setDiversitySpecsInput: (value: string) => {
			setDiversitySpecsInputState(value);
			setDiversityPreview(null);
		},
		setDiversityThresholdInput: (value: string) => {
			setDiversityThresholdInputState(value);
			setDiversityPreview(null);
		},
		loadLatestRunDataset,
		generateSynthesisPreview,
		saveSynthesisArtifact,
		generateDiversityPreview,
		saveDiversityArtifact,
	};
}
