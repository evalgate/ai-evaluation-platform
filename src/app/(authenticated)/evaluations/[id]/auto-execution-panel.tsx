"use client";

import { ChevronDown, Loader2, Play, Square, Trophy } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { listMutationFamilies } from "@/packages/sdk/src/cli/auto-families";
import type { AutoExperimentSummary } from "./evalgate-types";
import { PermissionActionButton } from "./permission-action-button";
import type { UseAutoExecutionStateReturn } from "./use-auto-execution-state";

const FAMILY_OPTIONS = listMutationFamilies();

function getStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (status === "completed") {
		return "default";
	}
	if (status === "failed" || status === "cancelled") {
		return "destructive";
	}
	if (status === "queued" || status === "running") {
		return "secondary";
	}
	return "outline";
}

function getDecisionBadgeVariant(
	decision: string | null,
): "default" | "secondary" | "destructive" | "outline" {
	if (decision === "keep") {
		return "default";
	}
	if (decision === "discard" || decision === "vetoed") {
		return "destructive";
	}
	if (decision === "investigate") {
		return "secondary";
	}
	return "outline";
}

function formatNumber(value: number | null): string {
	return value === null ? "—" : value.toFixed(2);
}

function formatSignedNumber(value: number | null): string {
	if (value === null) {
		return "—";
	}
	return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function FamilyChecklist({
	selected,
	onToggle,
}: {
	selected: string[];
	onToggle: (familyId: string, checked: boolean) => void;
}) {
	return (
		<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
			{FAMILY_OPTIONS.map((family) => {
				const checked = selected.includes(family.id);
				return (
					<div
						key={family.id}
						className="flex items-start gap-3 rounded-lg border p-3 text-sm"
					>
						<Checkbox
							checked={checked}
							onCheckedChange={(value) => onToggle(family.id, value === true)}
						/>
						<span className="space-y-1">
							<span className="block font-medium">{family.id}</span>
							<span className="block text-xs text-muted-foreground">
								{family.description}
							</span>
						</span>
					</div>
				);
			})}
		</div>
	);
}

function ExperimentRow({ experiment }: { experiment: AutoExperimentSummary }) {
	return (
		<Collapsible>
			<div className="border-b last:border-b-0">
				<div className="grid grid-cols-[60px_1.2fr_110px_100px_110px_1.1fr_44px] items-center gap-3 px-3 py-3 text-xs md:text-sm">
					<div className="font-medium">#{experiment.iteration}</div>
					<div>
						<Badge variant="outline">{experiment.mutationFamily}</Badge>
					</div>
					<div>
						<Badge variant={getDecisionBadgeVariant(experiment.decision)}>
							{experiment.decision ?? "pending"}
						</Badge>
					</div>
					<div>{formatNumber(experiment.utilityScore)}</div>
					<div>{formatSignedNumber(experiment.objectiveReduction)}</div>
					<div className="truncate text-muted-foreground">
						{experiment.hardVetoReason ?? "—"}
					</div>
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 w-8 px-0">
							<ChevronDown className="h-4 w-4" />
						</Button>
					</CollapsibleTrigger>
				</div>
				<CollapsibleContent>
					<div className="space-y-3 bg-muted/20 px-3 pb-3 text-xs">
						<div>
							<p className="font-medium">Candidate patch</p>
							<pre className="mt-1 whitespace-pre-wrap rounded border bg-background p-2 text-[11px] text-muted-foreground">
								{experiment.candidatePatch ?? "No patch recorded."}
							</pre>
						</div>
						<div>
							<p className="font-medium">Reflection</p>
							<p className="mt-1 text-muted-foreground">
								{experiment.reflection ?? "No reflection recorded."}
							</p>
						</div>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

export function AutoExecutionPanel({
	executionState,
	createSessionDisabledReason,
	runSessionDisabledReason,
}: {
	executionState: UseAutoExecutionStateReturn;
	createSessionDisabledReason?: string | null;
	runSessionDisabledReason?: string | null;
}) {
	const {
		sessionConfig,
		updateSessionConfig,
		createSession,
		startRun,
		stopRun,
		sessionId,
		jobId,
		createError,
		startError,
		status,
		isPolling,
		pollError,
		isIdle,
		isQueued,
		isRunning,
		currentIteration,
		maxIterations,
		experiments,
		bestExperiment,
		sessions,
		sessionsLoading,
		selectSession,
		createFieldErrors,
	} = executionState;
	const progressValue =
		maxIterations > 0 ? (currentIteration / maxIterations) * 100 : 0;
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Auto Bounded Execution</CardTitle>
					<CardDescription>
						Create an execution session, run it in the background, and monitor
						experiments as they arrive.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="auto-session-name">Name</Label>
							<Input
								id="auto-session-name"
								value={sessionConfig.name}
								onChange={(event) =>
									updateSessionConfig({ name: event.target.value })
								}
								placeholder="Tone mismatch repair"
							/>
							{createFieldErrors.name?.map((message) => (
								<p key={message} className="text-xs text-destructive">
									{message}
								</p>
							))}
						</div>
						<div className="space-y-2">
							<Label htmlFor="auto-session-target-path">Target path</Label>
							<Input
								id="auto-session-target-path"
								value={sessionConfig.targetPath}
								onChange={(event) =>
									updateSessionConfig({ targetPath: event.target.value })
								}
								placeholder="prompts/support.md"
							/>
							{createFieldErrors.targetPath?.map((message) => (
								<p key={message} className="text-xs text-destructive">
									{message}
								</p>
							))}
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="auto-session-objective">Objective</Label>
						<Textarea
							id="auto-session-objective"
							value={sessionConfig.objective}
							onChange={(event) =>
								updateSessionConfig({ objective: event.target.value })
							}
							className="min-h-20"
							placeholder="Reduce tone mismatch failures without adding regressions."
						/>
						{createFieldErrors.objective?.map((message) => (
							<p key={message} className="text-xs text-destructive">
								{message}
							</p>
						))}
					</div>
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="auto-session-max-iterations">
								Max iterations
							</Label>
							<Input
								id="auto-session-max-iterations"
								type="number"
								min={1}
								max={20}
								value={sessionConfig.maxIterations}
								onChange={(event) =>
									updateSessionConfig({
										maxIterations: Number(event.target.value || 1),
									})
								}
							/>
							{createFieldErrors.maxIterations?.map((message) => (
								<p key={message} className="text-xs text-destructive">
									{message}
								</p>
							))}
						</div>
						<div className="space-y-2">
							<Label htmlFor="auto-session-max-cost">Max cost (optional)</Label>
							<Input
								id="auto-session-max-cost"
								type="number"
								min={0}
								step="0.01"
								value={sessionConfig.maxCostUsd}
								onChange={(event) =>
									updateSessionConfig({ maxCostUsd: event.target.value })
								}
								placeholder="1.50"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Allowed families</Label>
						<FamilyChecklist
							selected={sessionConfig.allowedFamilies}
							onToggle={(familyId, checked) => {
								const nextFamilies = checked
									? [...sessionConfig.allowedFamilies, familyId]
									: sessionConfig.allowedFamilies.filter(
											(value) => value !== familyId,
										);
								updateSessionConfig({ allowedFamilies: nextFamilies });
							}}
						/>
						{createFieldErrors.allowedFamilies?.map((message) => (
							<p key={message} className="text-xs text-destructive">
								{message}
							</p>
						))}
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<PermissionActionButton
							onClick={() => void createSession()}
							disabled={Boolean(createSessionDisabledReason)}
							disabledReason={createSessionDisabledReason}
						>
							Create session
						</PermissionActionButton>
						{createError ? (
							<p className="text-sm text-destructive">{createError}</p>
						) : null}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Execution monitor</CardTitle>
					<CardDescription>
						Switch between saved sessions, control execution, and inspect
						experiment output.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{sessionsLoading ? (
						<div className="space-y-3 rounded-lg border p-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-24 w-full" />
						</div>
					) : null}
					<div className="grid gap-4 lg:grid-cols-[1.3fr_auto] lg:items-end">
						<div className="space-y-2">
							<Label htmlFor="auto-session-selector">Session</Label>
							<Select
								value={sessionId ?? undefined}
								onValueChange={selectSession}
							>
								<SelectTrigger id="auto-session-selector" className="w-full">
									<SelectValue placeholder="Select a session" />
								</SelectTrigger>
								<SelectContent>
									{sessions.map((session) => (
										<SelectItem
											key={session.sessionId}
											value={session.sessionId}
										>
											{session.name} · {session.status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant={getStatusBadgeVariant(status?.status ?? "idle")}>
								{status?.status ?? "idle"}
							</Badge>
							<PermissionActionButton
								onClick={() => void startRun()}
								disabled={
									Boolean(runSessionDisabledReason) ||
									!sessionId ||
									isQueued ||
									isRunning
								}
								disabledReason={runSessionDisabledReason}
							>
								{isQueued || isRunning ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Play className="mr-2 h-4 w-4" />
								)}
								Run
							</PermissionActionButton>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<div>
										<PermissionActionButton
											variant="outline"
											disabled={
												Boolean(runSessionDisabledReason) ||
												!sessionId ||
												(!isQueued && !isRunning)
											}
											disabledReason={runSessionDisabledReason}
										>
											<Square className="mr-2 h-4 w-4" />
											Stop
										</PermissionActionButton>
									</div>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Stop active auto run?</AlertDialogTitle>
										<AlertDialogDescription>
											This cancels the current bounded execution session and
											marks it as user requested.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Keep running</AlertDialogCancel>
										<AlertDialogAction onClick={() => void stopRun()}>
											Stop run
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
					{startError ? (
						<p className="text-sm text-destructive">{startError}</p>
					) : null}
					{pollError ? (
						<p className="text-sm text-destructive">{pollError}</p>
					) : null}
					{jobId ? (
						<p className="text-xs text-muted-foreground">
							Background job {jobId}
						</p>
					) : null}
					<div className="space-y-2 rounded-lg border p-4">
						<div className="flex items-center justify-between text-sm">
							<span>
								Iteration {currentIteration} / {maxIterations}
							</span>
							<span className="text-muted-foreground">
								{status?.budgetUsed.iterations ?? experiments.length}{" "}
								experiments
							</span>
						</div>
						<Progress value={progressValue} />
						{isPolling ? (
							<p className="text-xs text-muted-foreground">
								Polling every 3 seconds while execution is active.
							</p>
						) : null}
					</div>
					{bestExperiment ? (
						<Card className="gap-3 py-4">
							<CardHeader className="pb-0">
								<CardTitle className="flex items-center gap-2 text-sm">
									<Trophy className="h-4 w-4" />
									Best kept experiment
								</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-2 text-sm md:grid-cols-2">
								<div>
									<p className="text-muted-foreground">Family</p>
									<p className="font-medium">{bestExperiment.mutationFamily}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Utility</p>
									<p className="font-medium">
										{formatNumber(bestExperiment.utilityScore)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Objective Δ</p>
									<p className="font-medium">
										{formatSignedNumber(bestExperiment.objectiveReduction)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Patch</p>
									<p className="line-clamp-2 font-medium">
										{bestExperiment.candidatePatch ?? "No patch recorded."}
									</p>
								</div>
							</CardContent>
						</Card>
					) : null}
					<div className="overflow-hidden rounded-lg border">
						<div className="grid grid-cols-[60px_1.2fr_110px_100px_110px_1.1fr_44px] gap-3 bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
							<div>#</div>
							<div>Family</div>
							<div>Decision</div>
							<div>Utility</div>
							<div>Objective Δ</div>
							<div>Veto reason</div>
							<div />
						</div>
						{experiments.length > 0 ? (
							experiments.map((experiment) => (
								<ExperimentRow key={experiment.id} experiment={experiment} />
							))
						) : (
							<div className="px-3 py-6 text-sm text-muted-foreground">
								No experiments yet. Create a session and run it to populate
								bounded execution results.
							</div>
						)}
					</div>
					{status?.error ? (
						<p className="text-sm text-destructive">{status.error}</p>
					) : null}
					{!sessionsLoading && sessions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No saved auto sessions yet. Create one above to unlock execution
							monitoring.
						</p>
					) : null}
					{isIdle && !status ? (
						<p className="text-sm text-muted-foreground">
							Select a session to inspect its history or create a new one to
							begin bounded execution.
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
