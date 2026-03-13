import {
	ChevronRight,
	FileText,
	GitBranch,
	Loader2,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { RunDiffView } from "@/components/run-diff-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import type {
	EvaluationRun,
	PersistedEvalgateArtifact,
	RunInsightKind,
	RunInsightState,
} from "./evalgate-types";
import { formatArtifactKind, summarizeArtifact } from "./evalgate-utils";
import { PermissionActionButton } from "./permission-action-button";

type CheckReport = {
	baselineRunId?: number;
	ciRunUrl?: string;
	verdict?: unknown;
	reasonCode?: unknown;
	reasonMessage?: unknown;
	score?: unknown;
	baselineScore?: unknown;
	delta?: unknown;
};

interface EvaluationRecentRunsSectionProps {
	evaluationId: string;
	runs: EvaluationRun[];
	runInsights: Record<number, RunInsightState>;
	openDiffRunId: number | null;
	analysisActionDisabledReason: string | null;
	clusterActionDisabledReason: string | null;
	onOpenDiffRunIdChange: (runId: number | null) => void;
	onFetchRunInsight: (runId: number, kind: RunInsightKind) => void;
	onSaveRunArtifact: (runId: number, kind: RunInsightKind) => void;
	onLoadRunArtifacts: (runId: number) => void;
	onOpenArtifact: (artifact: PersistedEvalgateArtifact) => void;
	onNavigateToTab: (tab: string) => void;
}

function parseCheckReport(traceLog: unknown): CheckReport | null {
	const parsedTraceLog =
		typeof traceLog === "string"
			? (() => {
					try {
						return JSON.parse(traceLog) as Record<string, unknown>;
					} catch {
						return {};
					}
				})()
			: ((traceLog ?? {}) as Record<string, unknown>);
	const importSection = parsedTraceLog.import as
		| { checkReport?: CheckReport }
		| undefined;
	return importSection?.checkReport ?? null;
}

export function EvaluationRecentRunsSection({
	evaluationId,
	runs,
	runInsights,
	openDiffRunId,
	analysisActionDisabledReason,
	clusterActionDisabledReason,
	onOpenDiffRunIdChange,
	onFetchRunInsight,
	onSaveRunArtifact,
	onLoadRunArtifacts,
	onOpenArtifact,
	onNavigateToTab,
}: EvaluationRecentRunsSectionProps) {
	return (
		<div>
			<h2 className="mb-4 text-xl font-semibold">Recent Runs</h2>
			{runs.length > 0 ? (
				<div className="space-y-3">
					{runs.map((run) => {
						const insight = runInsights[run.id] ?? {};
						const checkReport = parseCheckReport(run.traceLog);

						return (
							<Card key={run.id} id={`run-${run.id}`}>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="mb-1 flex items-center gap-3">
												<Badge
													variant="outline"
													className={`${
														run.status === "completed"
															? "bg-green-500/10 text-green-500 border-green-500/20"
															: run.status === "running"
																? "bg-blue-500/10 text-blue-500 border-blue-500/20"
																: run.status === "failed"
																	? "bg-red-500/10 text-red-500 border-red-500/20"
																	: "bg-gray-500/10 text-gray-500 border-gray-500/20"
													}`}
												>
													{run.status}
												</Badge>
												<span className="text-sm text-muted-foreground">
													{new Date(
														run.startedAt ||
															run.started_at ||
															run.createdAt ||
															"",
													).toLocaleString()}
												</span>
											</div>
											{run.status === "completed" ? (
												<p className="text-sm">
													{run.passedCases || run.passed_cases || 0} /{" "}
													{run.totalCases || run.total_cases || 0} tests passed
												</p>
											) : null}
											{checkReport ? (
												<details className="group mt-2 text-xs">
													<summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
														<ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
														CI Check Report
													</summary>
													<div className="mt-1 space-y-1">
														{checkReport.baselineRunId ? (
															<p className="text-muted-foreground">
																Compares to baseline{" "}
																<Link
																	href={`/evaluations/${evaluationId}#run-${checkReport.baselineRunId}`}
																	className="text-primary hover:underline"
																>
																	run #{checkReport.baselineRunId}
																</Link>
															</p>
														) : null}
														{checkReport.ciRunUrl ? (
															<p className="text-muted-foreground">
																<a
																	href={checkReport.ciRunUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-primary hover:underline"
																>
																	CI run
																</a>
															</p>
														) : null}
														{checkReport.baselineRunId ? (
															<details
																className="group/diff mt-1"
																onToggle={(event) =>
																	onOpenDiffRunIdChange(
																		(event.target as HTMLDetailsElement).open
																			? run.id
																			: null,
																	)
																}
															>
																<summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
																	<ChevronRight className="h-3 w-3 transition-transform group-open/diff:rotate-90" />
																	View diff (baseline vs current)
																</summary>
																{openDiffRunId === run.id ? (
																	<div className="mt-1">
																		<RunDiffView
																			evaluationId={evaluationId}
																			runId={run.id}
																			compareRunId={checkReport.baselineRunId}
																		/>
																	</div>
																) : null}
															</details>
														) : null}
														<pre className="max-h-32 overflow-y-auto overflow-x-auto rounded bg-muted p-2">
															{JSON.stringify(
																{
																	verdict: checkReport.verdict,
																	reasonCode: checkReport.reasonCode,
																	reasonMessage: checkReport.reasonMessage,
																	score: checkReport.score,
																	baselineScore: checkReport.baselineScore,
																	delta: checkReport.delta,
																},
																null,
																2,
															)}
														</pre>
													</div>
												</details>
											) : null}
											<div className="mt-3 flex flex-wrap gap-2">
												<PermissionActionButton
													variant="secondary"
													size="sm"
													onClick={() => onFetchRunInsight(run.id, "dataset")}
													disabled={
														Boolean(analysisActionDisabledReason) ||
														insight.loading === "dataset"
													}
													disabledReason={analysisActionDisabledReason}
												>
													{insight.loading === "dataset" ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<FileText className="mr-2 h-4 w-4" />
													)}
													Dataset
												</PermissionActionButton>
												<PermissionActionButton
													variant="secondary"
													size="sm"
													onClick={() => onFetchRunInsight(run.id, "analysis")}
													disabled={
														Boolean(analysisActionDisabledReason) ||
														insight.loading === "analysis"
													}
													disabledReason={analysisActionDisabledReason}
												>
													{insight.loading === "analysis" ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<Sparkles className="mr-2 h-4 w-4" />
													)}
													Analyze
												</PermissionActionButton>
												<PermissionActionButton
													variant="secondary"
													size="sm"
													onClick={() => onFetchRunInsight(run.id, "cluster")}
													disabled={
														Boolean(clusterActionDisabledReason) ||
														insight.loading === "cluster"
													}
													disabledReason={clusterActionDisabledReason}
												>
													{insight.loading === "cluster" ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<GitBranch className="mr-2 h-4 w-4" />
													)}
													Cluster
												</PermissionActionButton>
											</div>
											{insight.error ? (
												<p className="mt-3 text-sm text-red-500">
													{insight.error}
												</p>
											) : null}
											{insight.dataset ||
											insight.analysis ||
											insight.clusters ? (
												<div className="mt-4 grid gap-3 lg:grid-cols-3">
													{insight.dataset ? (
														<div className="rounded-lg border bg-muted/30 p-3 lg:col-span-1">
															<div className="mb-2 flex items-center justify-between">
																<div>
																	<p className="text-sm font-medium">
																		Labeled Dataset
																	</p>
																	<span className="text-xs text-muted-foreground">
																		{insight.dataset.failed} failed /{" "}
																		{insight.dataset.total} total
																	</span>
																</div>
																<PermissionActionButton
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		onSaveRunArtifact(run.id, "dataset")
																	}
																	disabled={
																		Boolean(analysisActionDisabledReason) ||
																		insight.saving === "dataset"
																	}
																	disabledReason={analysisActionDisabledReason}
																>
																	{insight.saving === "dataset" ? (
																		<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
																	) : null}
																	Save
																</PermissionActionButton>
															</div>
															<pre className="max-h-40 overflow-auto rounded bg-background p-2 text-xs">
																{insight.dataset.content
																	.split("\n")
																	.slice(0, 4)
																	.join("\n") || "No dataset rows generated"}
															</pre>
														</div>
													) : null}
													{insight.analysis ? (
														<div className="rounded-lg border bg-muted/30 p-3 lg:col-span-1">
															<div className="mb-2 flex items-center justify-between">
																<div>
																	<p className="text-sm font-medium">
																		Failure Analysis
																	</p>
																	<span className="text-xs text-muted-foreground">
																		{Math.round(
																			insight.analysis.passRate * 100,
																		)}
																		% pass rate
																	</span>
																</div>
																<PermissionActionButton
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		onSaveRunArtifact(run.id, "analysis")
																	}
																	disabled={
																		Boolean(analysisActionDisabledReason) ||
																		insight.saving === "analysis"
																	}
																	disabledReason={analysisActionDisabledReason}
																>
																	{insight.saving === "analysis" ? (
																		<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
																	) : null}
																	Save
																</PermissionActionButton>
															</div>
															<div className="space-y-2">
																{insight.analysis.failureModes.length > 0 ? (
																	insight.analysis.failureModes
																		.slice(0, 4)
																		.map((mode) => (
																			<div
																				key={`${run.id}-${mode.mode}`}
																				className="flex items-center justify-between rounded bg-background px-2 py-1 text-xs"
																			>
																				<span className="truncate pr-3">
																					{mode.mode}
																				</span>
																				<span className="text-muted-foreground">
																					{mode.count} (
																					{Math.round(mode.frequency * 100)}%)
																				</span>
																			</div>
																		))
																) : (
																	<p className="text-xs text-muted-foreground">
																		No failure modes detected.
																	</p>
																)}
															</div>
														</div>
													) : null}
													{insight.clusters && insight.clusters.length > 0 ? (
														<div className="rounded-lg border bg-muted/30 p-3 lg:col-span-1">
															<div className="mb-2 flex items-center justify-between">
																<div>
																	<p className="text-sm font-medium">
																		Trace Clusters
																	</p>
																	<span className="text-xs text-muted-foreground">
																		{insight.clusters.length} groups
																	</span>
																</div>
																<PermissionActionButton
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		onSaveRunArtifact(run.id, "cluster")
																	}
																	disabled={
																		Boolean(clusterActionDisabledReason) ||
																		insight.saving === "cluster"
																	}
																	disabledReason={clusterActionDisabledReason}
																>
																	{insight.saving === "cluster" ? (
																		<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
																	) : null}
																	Save
																</PermissionActionButton>
															</div>
															<div className="space-y-2">
																{insight.clusters.slice(0, 3).map((cluster) => (
																	<div
																		key={cluster.id}
																		className="rounded bg-background px-2 py-2 text-xs"
																	>
																		<div className="flex items-center justify-between gap-2">
																			<span className="font-medium">
																				{cluster.clusterLabel}
																			</span>
																			<span className="text-muted-foreground">
																				{cluster.traceCount} traces
																			</span>
																		</div>
																		<p className="mt-1 text-muted-foreground">
																			{cluster.dominantPattern}
																		</p>
																		{cluster.suggestedFailureMode ? (
																			<p className="mt-1">
																				Suggested mode:{" "}
																				{cluster.suggestedFailureMode}
																			</p>
																		) : null}
																	</div>
																))}
															</div>
														</div>
													) : null}
												</div>
											) : null}
											{insight.artifactsLoading ? (
												<p className="mt-3 text-xs text-muted-foreground">
													Loading saved artifacts...
												</p>
											) : null}
											{insight.savedArtifacts &&
											insight.savedArtifacts.length > 0 ? (
												<div className="mt-4 rounded-lg border bg-muted/20 p-3">
													<div className="mb-3 flex items-center justify-between">
														<p className="text-sm font-medium">
															Saved Artifacts
														</p>
														<div className="flex items-center gap-2">
															<span className="text-xs text-muted-foreground">
																{insight.savedArtifacts.length} saved
															</span>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => onLoadRunArtifacts(run.id)}
																disabled={insight.artifactsLoading}
															>
																Refresh
															</Button>
														</div>
													</div>
													<div className="space-y-2">
														{insight.savedArtifacts
															.slice(0, 4)
															.map((artifact) => (
																<div
																	key={artifact.id}
																	className="rounded-md bg-background px-3 py-2 text-xs"
																>
																	<div className="flex items-center justify-between gap-2">
																		<div className="min-w-0">
																			<p className="truncate font-medium">
																				{artifact.title}
																			</p>
																			<div className="mt-1 flex items-center gap-2">
																				<Badge variant="outline">
																					{formatArtifactKind(artifact.kind)}
																				</Badge>
																				<span className="text-muted-foreground">
																					{new Date(
																						artifact.createdAt,
																					).toLocaleString()}
																				</span>
																			</div>
																		</div>
																	</div>
																	<div className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
																		{summarizeArtifact(artifact.summary).map(
																			(item) => (
																				<span
																					key={`${artifact.id}-${item}`}
																					className="rounded bg-muted px-2 py-1"
																				>
																					{item}
																				</span>
																			),
																		)}
																	</div>
																	<div className="mt-2 flex justify-end">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() => onOpenArtifact(artifact)}
																		>
																			Open
																		</Button>
																	</div>
																</div>
															))}
													</div>
												</div>
											) : null}
										</div>
										<Button variant="outline" size="sm">
											View Results
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No runs yet</EmptyTitle>
						<EmptyDescription>
							Run the evaluation once to unlock labeled datasets, failure
							analysis, and clusters.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onNavigateToTab("overview")}
						>
							Generate cases
						</Button>
					</EmptyContent>
				</Empty>
			)}
		</div>
	);
}
