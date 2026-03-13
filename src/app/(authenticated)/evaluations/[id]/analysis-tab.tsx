import type {
	EvaluationRun,
	PersistedEvalgateArtifact,
	RunInsightKind,
	RunInsightState,
} from "./evalgate-types";
import { EvaluationRecentRunsSection } from "./evaluation-recent-runs-section";
import { SavedEvalgateArtifactsSection } from "./saved-evalgate-artifacts-section";

interface AnalysisTabProps {
	evaluationId: string;
	artifacts: PersistedEvalgateArtifact[];
	artifactsLoading: boolean;
	runs: EvaluationRun[];
	runInsights: Record<number, RunInsightState>;
	openDiffRunId: number | null;
	analysisActionDisabledReason: string | null;
	clusterActionDisabledReason: string | null;
	deletingArtifactId: number | null;
	acceptingArtifactId: number | null;
	onRefreshArtifacts: () => void;
	onOpenArtifact: (artifact: PersistedEvalgateArtifact) => void;
	onOpenDiffRunIdChange: (runId: number | null) => void;
	onFetchRunInsight: (runId: number, kind: RunInsightKind) => void;
	onSaveRunArtifact: (runId: number, kind: RunInsightKind) => void;
	onLoadRunArtifacts: (runId: number) => void;
	onNavigateToTab: (tab: string) => void;
	onDeleteArtifact: (
		artifact: PersistedEvalgateArtifact,
	) => void | Promise<void>;
	onAcceptSynthesisArtifact: (
		artifact: PersistedEvalgateArtifact,
	) => void | Promise<void>;
}

export function AnalysisTab({
	evaluationId,
	artifacts,
	artifactsLoading,
	runs,
	runInsights,
	openDiffRunId,
	analysisActionDisabledReason,
	clusterActionDisabledReason,
	deletingArtifactId,
	acceptingArtifactId,
	onRefreshArtifacts,
	onOpenArtifact,
	onOpenDiffRunIdChange,
	onFetchRunInsight,
	onSaveRunArtifact,
	onLoadRunArtifacts,
	onNavigateToTab,
	onDeleteArtifact,
	onAcceptSynthesisArtifact,
}: AnalysisTabProps) {
	return (
		<div className="space-y-6">
			<SavedEvalgateArtifactsSection
				artifacts={artifacts}
				artifactsLoading={artifactsLoading}
				deletingArtifactId={deletingArtifactId}
				acceptingArtifactId={acceptingArtifactId}
				onRefresh={onRefreshArtifacts}
				onOpenArtifact={onOpenArtifact}
				onDeleteArtifact={onDeleteArtifact}
				onAcceptSynthesisArtifact={onAcceptSynthesisArtifact}
			/>
			<EvaluationRecentRunsSection
				evaluationId={evaluationId}
				runs={runs}
				runInsights={runInsights}
				openDiffRunId={openDiffRunId}
				analysisActionDisabledReason={analysisActionDisabledReason}
				clusterActionDisabledReason={clusterActionDisabledReason}
				onOpenDiffRunIdChange={onOpenDiffRunIdChange}
				onFetchRunInsight={onFetchRunInsight}
				onSaveRunArtifact={onSaveRunArtifact}
				onLoadRunArtifacts={onLoadRunArtifacts}
				onOpenArtifact={onOpenArtifact}
				onNavigateToTab={onNavigateToTab}
			/>
		</div>
	);
}
