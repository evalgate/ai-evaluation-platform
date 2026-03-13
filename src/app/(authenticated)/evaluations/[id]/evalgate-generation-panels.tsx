import { GitBranch, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { SynthesizeSummary } from "@/lib/evalgate/synthesize-core";
import type { DiversityPreview } from "./evalgate-types";
import { PermissionActionButton } from "./permission-action-button";

interface EvalgateGenerationPanelsProps {
	hasRuns: boolean;
	hasAnalysisSeed: boolean;
	onNavigateToTab: (tab: string) => void;
	synthesisDatasetContent: string;
	synthesisDimensionsInput: string;
	synthesisFailureModesInput: string;
	synthesisCountInput: string;
	synthesisPreview: SynthesizeSummary | null;
	synthesisLoading: boolean;
	synthesisSaving: boolean;
	synthesisDatasetLoading: boolean;
	diversitySpecsInput: string;
	diversityThresholdInput: string;
	diversityPreview: DiversityPreview | null;
	diversityLoading: boolean;
	diversitySaving: boolean;
	datasetActionDisabledReason?: string | null;
	synthesisActionDisabledReason?: string | null;
	diversityActionDisabledReason?: string | null;
	onSynthesisDatasetContentChange: (value: string) => void;
	onSynthesisDimensionsInputChange: (value: string) => void;
	onSynthesisFailureModesInputChange: (value: string) => void;
	onSynthesisCountInputChange: (value: string) => void;
	onLoadLatestRunDataset: () => void;
	onGenerateSynthesisPreview: () => void;
	onSaveSynthesisArtifact: () => void;
	onDiversitySpecsInputChange: (value: string) => void;
	onDiversityThresholdInputChange: (value: string) => void;
	onGenerateDiversityPreview: () => void;
	onSaveDiversityArtifact: () => void;
}

export function EvalgateGenerationPanels({
	hasRuns,
	hasAnalysisSeed,
	onNavigateToTab,
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
	datasetActionDisabledReason,
	synthesisActionDisabledReason,
	diversityActionDisabledReason,
	onSynthesisDatasetContentChange,
	onSynthesisDimensionsInputChange,
	onSynthesisFailureModesInputChange,
	onSynthesisCountInputChange,
	onLoadLatestRunDataset,
	onGenerateSynthesisPreview,
	onSaveSynthesisArtifact,
	onDiversitySpecsInputChange,
	onDiversityThresholdInputChange,
	onGenerateDiversityPreview,
	onSaveDiversityArtifact,
}: EvalgateGenerationPanelsProps) {
	return (
		<div className="space-y-4">
			{!hasRuns ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No run dataset available yet</EmptyTitle>
						<EmptyDescription>
							Run the evaluation first so synthesis and diversity can start from
							real EvalGate inputs.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<PermissionActionButton
							variant="outline"
							size="sm"
							onClick={() => onNavigateToTab("overview")}
						>
							Go to overview
						</PermissionActionButton>
					</EmptyContent>
				</Empty>
			) : !hasAnalysisSeed ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>Run analysis first</EmptyTitle>
						<EmptyDescription>
							Load a labeled dataset or failure analysis from the Analysis tab
							before generating synthetic cases.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<PermissionActionButton
							variant="outline"
							size="sm"
							onClick={() => onNavigateToTab("analysis")}
						>
							Open analysis
						</PermissionActionButton>
					</EmptyContent>
				</Empty>
			) : null}
			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							Synthetic Case Generation
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Generate synthetic failure drafts from labeled dataset content.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<Label htmlFor="synthesis-dataset-content">
									Dataset content
								</Label>
								<PermissionActionButton
									variant="ghost"
									size="sm"
									onClick={onLoadLatestRunDataset}
									disabled={
										Boolean(datasetActionDisabledReason) ||
										synthesisDatasetLoading
									}
									disabledReason={datasetActionDisabledReason}
								>
									{synthesisDatasetLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Use Latest Run Dataset
								</PermissionActionButton>
							</div>
							<Textarea
								id="synthesis-dataset-content"
								value={synthesisDatasetContent}
								onChange={(event) =>
									onSynthesisDatasetContentChange(event.target.value)
								}
								placeholder='{"caseId":"case-1","input":"...","expected":"...","actual":"...","label":"fail","failureMode":"tool_failure","labeledAt":"2026-03-12T00:00:00.000Z"}'
								className="min-h-40 font-mono text-xs"
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="synthesis-count-input">Target count</Label>
								<Input
									id="synthesis-count-input"
									type="number"
									min={1}
									max={1000}
									value={synthesisCountInput}
									onChange={(event) =>
										onSynthesisCountInputChange(event.target.value)
									}
									placeholder="12"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="synthesis-failure-modes-input">
									Failure modes
								</Label>
								<Input
									id="synthesis-failure-modes-input"
									value={synthesisFailureModesInput}
									onChange={(event) =>
										onSynthesisFailureModesInputChange(event.target.value)
									}
									placeholder="tool_failure, rate_limited"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="synthesis-dimensions-input">
								Dimension matrix JSON
							</Label>
							<Textarea
								id="synthesis-dimensions-input"
								value={synthesisDimensionsInput}
								onChange={(event) =>
									onSynthesisDimensionsInputChange(event.target.value)
								}
								placeholder='{"customer_tier":["free","pro"],"locale":["en","es"]}'
								className="min-h-28 font-mono text-xs"
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							<PermissionActionButton
								size="sm"
								onClick={onGenerateSynthesisPreview}
								disabled={
									Boolean(synthesisActionDisabledReason) || synthesisLoading
								}
								disabledReason={synthesisActionDisabledReason}
							>
								{synthesisLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Sparkles className="mr-2 h-4 w-4" />
								)}
								Generate Preview
							</PermissionActionButton>
							<PermissionActionButton
								variant="outline"
								size="sm"
								onClick={onSaveSynthesisArtifact}
								disabled={
									Boolean(synthesisActionDisabledReason) ||
									synthesisSaving ||
									!synthesisDatasetContent.trim()
								}
								disabledReason={synthesisActionDisabledReason}
							>
								{synthesisSaving ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Save Artifact
							</PermissionActionButton>
						</div>

						{synthesisLoading && !synthesisPreview ? (
							<div className="space-y-2 rounded-lg border p-3">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-4 w-1/2" />
								<Skeleton className="h-20 w-full" />
							</div>
						) : synthesisPreview ? (
							<div className="rounded-lg border bg-muted/20 p-3">
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">
										Generated {synthesisPreview.generated}
									</Badge>
									<Badge variant="outline">
										Source cases {synthesisPreview.sourceCases}
									</Badge>
									<Badge variant="outline">
										Failures {synthesisPreview.sourceFailures}
									</Badge>
									<Badge variant="outline">
										Dimension combos{" "}
										{synthesisPreview.dimensionCombinationCount}
									</Badge>
								</div>
								<div className="mt-3 space-y-3 text-xs">
									{synthesisPreview.modeCounts.length > 0 ? (
										<div className="space-y-1">
											<p className="font-medium">Mode distribution</p>
											<div className="flex flex-wrap gap-2 text-muted-foreground">
												{synthesisPreview.modeCounts.map((item) => (
													<span
														key={item.failureMode}
														className="rounded bg-background px-2 py-1"
													>
														{item.failureMode}: {item.count}
													</span>
												))}
											</div>
										</div>
									) : null}
									{synthesisPreview.cases.length > 0 ? (
										<div className="space-y-2">
											<p className="font-medium">Sample cases</p>
											{synthesisPreview.cases.slice(0, 2).map((item) => (
												<div
													key={item.caseId}
													className="rounded bg-background p-2"
												>
													<div className="flex items-center justify-between gap-2">
														<span className="font-medium">{item.caseId}</span>
														<span className="text-muted-foreground">
															{item.failureMode ?? "unknown"}
														</span>
													</div>
													<pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
														{item.input}
													</pre>
												</div>
											))}
										</div>
									) : null}
								</div>
							</div>
						) : (
							<p className="text-xs text-muted-foreground">
								Preview synthetic cases before saving them as an artifact.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Spec Diversity Report</CardTitle>
						<p className="text-sm text-muted-foreground">
							Score spec overlap and identify redundant pairs from a JSON
							inventory.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="diversity-specs-input">Spec inventory JSON</Label>
							<Textarea
								id="diversity-specs-input"
								value={diversitySpecsInput}
								onChange={(event) =>
									onDiversitySpecsInputChange(event.target.value)
								}
								placeholder='[{"id":"spec-1","name":"Tool fallback","file":"evals/tool-fallback.ts","tags":["smoke"],"hasAssertions":true,"usesModels":true,"usesTools":true,"complexity":"medium"}]'
								className="min-h-48 font-mono text-xs"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="diversity-threshold-input">
								Redundancy threshold
							</Label>
							<Input
								id="diversity-threshold-input"
								type="number"
								min={0}
								max={1}
								step="0.01"
								value={diversityThresholdInput}
								onChange={(event) =>
									onDiversityThresholdInputChange(event.target.value)
								}
								placeholder="0.55"
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							<PermissionActionButton
								size="sm"
								onClick={onGenerateDiversityPreview}
								disabled={
									Boolean(diversityActionDisabledReason) || diversityLoading
								}
								disabledReason={diversityActionDisabledReason}
							>
								{diversityLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<GitBranch className="mr-2 h-4 w-4" />
								)}
								Generate Preview
							</PermissionActionButton>
							<PermissionActionButton
								variant="outline"
								size="sm"
								onClick={onSaveDiversityArtifact}
								disabled={
									Boolean(diversityActionDisabledReason) ||
									diversitySaving ||
									!diversitySpecsInput.trim()
								}
								disabledReason={diversityActionDisabledReason}
							>
								{diversitySaving ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Save Artifact
							</PermissionActionButton>
						</div>

						{diversityLoading && !diversityPreview ? (
							<div className="space-y-2 rounded-lg border p-3">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-4 w-1/2" />
								<Skeleton className="h-20 w-full" />
							</div>
						) : diversityPreview ? (
							<div className="rounded-lg border bg-muted/20 p-3 text-xs">
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">
										Specs {diversityPreview.specCount}
									</Badge>
									<Badge variant="outline">
										Score {diversityPreview.diversity.score}
									</Badge>
									<Badge variant="outline">
										Avg similarity{" "}
										{Math.round(
											diversityPreview.diversity
												.averageNearestNeighborSimilarity * 100,
										)}
										%
									</Badge>
									<Badge variant="outline">
										Threshold{" "}
										{Math.round(diversityPreview.diversity.threshold * 100)}%
									</Badge>
								</div>
								<div className="mt-3 space-y-2">
									<p className="font-medium">Redundant pairs</p>
									{diversityPreview.diversity.redundantPairs.length > 0 ? (
										diversityPreview.diversity.redundantPairs.map((pair) => (
											<div
												key={`${pair.leftSpecId}-${pair.rightSpecId}`}
												className="rounded bg-background px-2 py-2"
											>
												<div className="flex items-center justify-between gap-2">
													<span className="font-medium">
														{pair.leftName} ↔ {pair.rightName}
													</span>
													<span className="text-muted-foreground">
														{Math.round(pair.similarity * 100)}%
													</span>
												</div>
											</div>
										))
									) : (
										<p className="text-muted-foreground">
											No redundant pairs detected at the current threshold.
										</p>
									)}
								</div>
							</div>
						) : (
							<p className="text-xs text-muted-foreground">
								Preview diversity before saving it as an artifact.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
