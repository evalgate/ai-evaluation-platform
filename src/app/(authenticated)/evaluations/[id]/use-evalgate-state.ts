import type { EvaluationRun } from "./evalgate-types";
import { useEvaluationAnalysisState } from "./use-evaluation-analysis-state";
import { useEvaluationSynthesisState } from "./use-evaluation-synthesis-state";

interface UseEvalgateStateOptions {
	evaluationId: string;
	runs: EvaluationRun[];
	onSynthesisAccepted?: () => Promise<void> | void;
}

export function useEvalgateState({
	evaluationId,
	runs,
	onSynthesisAccepted,
}: UseEvalgateStateOptions) {
	const analysis = useEvaluationAnalysisState({
		evaluationId,
		onSynthesisAccepted,
	});
	const synthesis = useEvaluationSynthesisState({
		evaluationId,
		runs,
		runInsights: analysis.runInsights,
		updateRunInsight: analysis.updateRunInsight,
		setEvaluationArtifacts: analysis.setEvaluationArtifacts,
	});

	return {
		...analysis,
		...synthesis,
	};
}
