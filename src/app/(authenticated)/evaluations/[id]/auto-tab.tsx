import { Loader2, Play } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AutoExecutionPanel } from "./auto-execution-panel";
import type { AutoPlanPreview } from "./evalgate-types";
import { PermissionActionButton } from "./permission-action-button";
import type { UseAutoExecutionStateReturn } from "./use-auto-execution-state";

interface AutoTabProps {
	hasEvaluationSummary: boolean;
	evaluationSummary: {
		evaluationName: string;
		testCaseCount: number;
		runCount: number;
		latestStatus: string | null;
		qualityGrade: string | null;
	};
	autoPlanObjectiveInput: string;
	autoPlanTargetPathInput: string;
	autoPlanTargetContentInput: string;
	autoPlanAllowedFamiliesInput: string;
	autoPlanHypothesisInput: string;
	autoPlanForbiddenChangesInput: string;
	autoPlanIterationInput: string;
	autoPlanPreview: AutoPlanPreview | null;
	autoPlanLoading: boolean;
	autoPlanDisabledReason: string | null;
	createSessionDisabledReason: string | null;
	runSessionDisabledReason: string | null;
	onAutoPlanObjectiveInputChange: (value: string) => void;
	onAutoPlanTargetPathInputChange: (value: string) => void;
	onAutoPlanTargetContentInputChange: (value: string) => void;
	onAutoPlanAllowedFamiliesInputChange: (value: string) => void;
	onAutoPlanHypothesisInputChange: (value: string) => void;
	onAutoPlanForbiddenChangesInputChange: (value: string) => void;
	onAutoPlanIterationInputChange: (value: string) => void;
	onGenerateAutoPlanPreview: () => void;
	executionState: UseAutoExecutionStateReturn;
}

export function AutoTab({
	hasEvaluationSummary,
	evaluationSummary,
	autoPlanObjectiveInput,
	autoPlanTargetPathInput,
	autoPlanTargetContentInput,
	autoPlanAllowedFamiliesInput,
	autoPlanHypothesisInput,
	autoPlanForbiddenChangesInput,
	autoPlanIterationInput,
	autoPlanPreview,
	autoPlanLoading,
	autoPlanDisabledReason,
	createSessionDisabledReason,
	runSessionDisabledReason,
	onAutoPlanObjectiveInputChange,
	onAutoPlanTargetPathInputChange,
	onAutoPlanTargetContentInputChange,
	onAutoPlanAllowedFamiliesInputChange,
	onAutoPlanHypothesisInputChange,
	onAutoPlanForbiddenChangesInputChange,
	onAutoPlanIterationInputChange,
	onGenerateAutoPlanPreview,
	executionState,
}: AutoTabProps) {
	return (
		<div className="space-y-6">
			{hasEvaluationSummary ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">EvalGate summary</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
						<div>
							<p className="text-muted-foreground">Evaluation</p>
							<p className="font-medium">{evaluationSummary.evaluationName}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Test cases</p>
							<p className="font-medium">{evaluationSummary.testCaseCount}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Runs</p>
							<p className="font-medium">{evaluationSummary.runCount}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Latest status</p>
							<p className="font-medium">
								{evaluationSummary.latestStatus ?? "No runs yet"}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Quality</p>
							<p className="font-medium">
								{evaluationSummary.qualityGrade ?? "Pending"}
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No evaluation summary yet</EmptyTitle>
						<EmptyDescription>
							Run the evaluation first to give the planner and bounded execution
							a real baseline.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent />
				</Empty>
			)}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Auto Planner Preview</CardTitle>
					<p className="text-sm text-muted-foreground">
						Preview the next mutation family and patch instruction before
						bounded execution.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="auto-plan-objective-input">Objective</Label>
							<Input
								id="auto-plan-objective-input"
								value={autoPlanObjectiveInput}
								onChange={(event) =>
									onAutoPlanObjectiveInputChange(event.target.value)
								}
								placeholder="tone_mismatch"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="auto-plan-target-path-input">Target path</Label>
							<Input
								id="auto-plan-target-path-input"
								value={autoPlanTargetPathInput}
								onChange={(event) =>
									onAutoPlanTargetPathInputChange(event.target.value)
								}
								placeholder="prompts/support.md"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="auto-plan-target-content-input">
							Target content
						</Label>
						<Textarea
							id="auto-plan-target-content-input"
							value={autoPlanTargetContentInput}
							onChange={(event) =>
								onAutoPlanTargetContentInputChange(event.target.value)
							}
							placeholder="You are a concise support assistant..."
							className="min-h-28 font-mono text-xs"
						/>
					</div>

					<div className="grid gap-4 lg:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="auto-plan-families-input">Allowed families</Label>
							<Input
								id="auto-plan-families-input"
								value={autoPlanAllowedFamiliesInput}
								onChange={(event) =>
									onAutoPlanAllowedFamiliesInputChange(event.target.value)
								}
								placeholder="few-shot-examples, instruction-order"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="auto-plan-iteration-input">Iteration</Label>
							<Input
								id="auto-plan-iteration-input"
								type="number"
								min={1}
								max={100}
								value={autoPlanIterationInput}
								onChange={(event) =>
									onAutoPlanIterationInputChange(event.target.value)
								}
								placeholder="1"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="auto-plan-hypothesis-input">Hypothesis</Label>
							<Input
								id="auto-plan-hypothesis-input"
								value={autoPlanHypothesisInput}
								onChange={(event) =>
									onAutoPlanHypothesisInputChange(event.target.value)
								}
								placeholder="acknowledge the user's concern first"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="auto-plan-forbidden-input">Forbidden changes</Label>
						<Textarea
							id="auto-plan-forbidden-input"
							value={autoPlanForbiddenChangesInput}
							onChange={(event) =>
								onAutoPlanForbiddenChangesInputChange(event.target.value)
							}
							placeholder="Do not add long policy lists."
							className="min-h-20 text-xs"
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						<PermissionActionButton
							size="sm"
							onClick={onGenerateAutoPlanPreview}
							disabled={Boolean(autoPlanDisabledReason) || autoPlanLoading}
							disabledReason={autoPlanDisabledReason}
						>
							{autoPlanLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Play className="mr-2 h-4 w-4" />
							)}
							Generate Plan
						</PermissionActionButton>
					</div>

					{autoPlanPreview ? (
						<div className="rounded-lg border bg-muted/20 p-3 text-xs">
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">
									Iteration {autoPlanPreview.iteration}
								</Badge>
								<Badge variant="outline">
									Family {autoPlanPreview.selectedFamily ?? "none"}
								</Badge>
								{autoPlanPreview.candidate ? (
									<Badge variant="outline">
										Candidate {autoPlanPreview.candidate.id}
									</Badge>
								) : null}
							</div>

							<div className="mt-3 space-y-3">
								<div className="space-y-1">
									<p className="font-medium">Proposed patch</p>
									<pre className="whitespace-pre-wrap rounded bg-background p-2 text-[11px] text-muted-foreground">
										{autoPlanPreview.proposedPatch ?? "No patch proposed."}
									</pre>
								</div>

								<div className="space-y-1">
									<p className="font-medium">Ranked families</p>
									<div className="flex flex-wrap gap-2 text-muted-foreground">
										{autoPlanPreview.rankedFamilies.map((family) => (
											<span
												key={family.id}
												className="rounded bg-background px-2 py-1"
											>
												{family.id} · {family.estimatedCost}
											</span>
										))}
									</div>
								</div>

								{autoPlanPreview.reason ? (
									<p className="text-muted-foreground">
										Planner stop reason: {autoPlanPreview.reason}
									</p>
								) : null}
							</div>
						</div>
					) : (
						<p className="text-xs text-muted-foreground">
							Preview the planner's next mutation family before auto bounded
							execution is added.
						</p>
					)}
				</CardContent>
			</Card>

			<AutoExecutionPanel
				executionState={executionState}
				createSessionDisabledReason={createSessionDisabledReason}
				runSessionDisabledReason={runSessionDisabledReason}
			/>
		</div>
	);
}
