"use client";

import { ArrowLeft, Copy, Download, Play } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AIQualityScoreCard } from "@/components/ai-quality-score-card";
import { ExportModal, type ExportOptions } from "@/components/export-modal";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/use-organization";
import {
	calculateQualityScore,
	type EvaluationStats,
	type QualityScore,
} from "@/lib/ai-quality-score";
import { useSession } from "@/lib/auth-client";
import {
	type EvaluationType,
	formatExportData,
	generateExportFilename,
	validateExportData,
} from "@/lib/export-templates";
import { logger } from "@/lib/logger";
import {
	hasPermission,
	PERMISSION_DENIED_MESSAGE,
	type Permission,
} from "@/lib/permissions";
import { AnalysisTab } from "./analysis-tab";
import { AutoTab } from "./auto-tab";
import { EvalgateArtifactDialog } from "./evalgate-artifact-dialog";
import type { Evaluation, EvaluationRun, TestCase } from "./evalgate-types";
import { EvaluationTestCasesSection } from "./evaluation-test-cases-section";
import { SynthesizeTab } from "./synthesize-tab";
import { TabErrorBoundary } from "./tab-error-boundary";
import { useAutoExecutionState } from "./use-auto-execution-state";
import { useAutoPlanState } from "./use-auto-plan-state";
import { useEvalgateState } from "./use-evalgate-state";

// Update type
type PageProps = {
	params: Promise<{ id: string }>;
};

export default function EvaluationDetailPage({ params }: PageProps) {
	const { id } = use(params); // Unwrap Promise with use()
	const { data: session, isPending } = useSession();
	const { organization, isLoading: organizationLoading } = useOrganization();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
	const [testCases, setTestCases] = useState<TestCase[]>([]);
	const [runs, setRuns] = useState<EvaluationRun[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
	const [exportModalOpen, setExportModalOpen] = useState(false);
	const [openDiffRunId, setOpenDiffRunId] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState("analysis");
	const requestedTab = searchParams.get("tab");
	const requestedSessionId = searchParams.get("session");
	const validTabs = useMemo(
		() => new Set(["overview", "analysis", "synthesize", "auto"]),
		[],
	);

	const updateQuery = useCallback(
		(next: Record<string, string | null>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, value] of Object.entries(next)) {
				if (value === null || value.length === 0) {
					params.delete(key);
				} else {
					params.set(key, value);
				}
			}
			const query = params.toString();
			router.replace(query ? `${pathname}?${query}` : pathname);
		},
		[pathname, router, searchParams],
	);

	const handleTabChange = useCallback(
		(nextTab: string) => {
			setActiveTab(nextTab);
			updateQuery({ tab: nextTab });
		},
		[updateQuery],
	);

	const handleSessionIdChange = useCallback(
		(sessionId: string | null) => {
			if (sessionId === null && !requestedSessionId) {
				return;
			}
			updateQuery({ session: sessionId });
		},
		[requestedSessionId, updateQuery],
	);

	useEffect(() => {
		if (
			requestedTab &&
			validTabs.has(requestedTab) &&
			requestedTab !== activeTab
		) {
			setActiveTab(requestedTab);
		}
	}, [activeTab, requestedTab, validTabs]);

	const loadTestCases = useCallback(async () => {
		const res = await fetch(`/api/evaluations/${id}/test-cases`, {
			credentials: "include",
		});
		const data = (await res.json()) as { testCases?: TestCase[] };
		setTestCases(data.testCases || []);
	}, [id]);
	const {
		runInsights,
		artifactsLoading,
		evaluationArtifacts,
		selectedArtifact,
		artifactDialogOpen,
		setArtifactDialogOpen,
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
		setSynthesisDatasetContent,
		setSynthesisDimensionsInput,
		setSynthesisFailureModesInput,
		setSynthesisCountInput,
		setDiversitySpecsInput,
		setDiversityThresholdInput,
		loadEvaluationArtifacts,
		loadRunArtifacts,
		saveRunArtifact,
		deleteArtifact,
		acceptSynthesisArtifact,
		deletingArtifactId,
		acceptingArtifactId,
		openArtifactDetail,
		loadLatestRunDataset,
		generateSynthesisPreview,
		saveSynthesisArtifact,
		generateDiversityPreview,
		saveDiversityArtifact,
		fetchRunInsight,
	} = useEvalgateState({
		evaluationId: id,
		runs,
		onSynthesisAccepted: loadTestCases,
	});

	const loadRuns = useCallback(async () => {
		const res = await fetch(`/api/evaluations/${id}/runs`, {
			credentials: "include",
		});
		const data = (await res.json()) as { runs?: EvaluationRun[] };
		const fetchedRuns = data.runs || [];
		setRuns(fetchedRuns);
		void Promise.allSettled(
			fetchedRuns.map((run: EvaluationRun) => loadRunArtifacts(run.id, true)),
		);

		if (fetchedRuns.length > 0) {
			const latestRun = fetchedRuns[0];
			const totalCases = latestRun.totalCases || latestRun.total_cases || 0;
			const passedCases = latestRun.passedCases || latestRun.passed_cases || 0;
			const failedCases = latestRun.failedCases || latestRun.failed_cases || 0;
			const stats: EvaluationStats = {
				totalEvaluations: totalCases,
				passedEvaluations: passedCases,
				failedEvaluations: failedCases,
				averageLatency: 500,
				averageCost: 0.01,
				averageScore: totalCases > 0 ? (passedCases / totalCases) * 100 : 0,
				consistencyScore: 85,
			};
			setQualityScore(calculateQualityScore(stats));
		}
	}, [id, loadRunArtifacts]);
	const {
		autoPlanObjectiveInput,
		autoPlanTargetPathInput,
		autoPlanTargetContentInput,
		autoPlanAllowedFamiliesInput,
		autoPlanHypothesisInput,
		autoPlanForbiddenChangesInput,
		autoPlanIterationInput,
		autoPlanPreview,
		autoPlanLoading,
		setAutoPlanObjectiveInput,
		setAutoPlanTargetPathInput,
		setAutoPlanTargetContentInput,
		setAutoPlanAllowedFamiliesInput,
		setAutoPlanHypothesisInput,
		setAutoPlanForbiddenChangesInput,
		setAutoPlanIterationInput,
		generateAutoPlanPreview,
	} = useAutoPlanState();
	const autoExecutionState = useAutoExecutionState(id, {
		preferredSessionId: requestedSessionId,
		onSessionIdChange: handleSessionIdChange,
	});

	const getPermissionDisabledReason = (permission: Permission) => {
		if (organizationLoading) {
			return "Checking permissions...";
		}

		if (!organization?.role) {
			return PERMISSION_DENIED_MESSAGE;
		}

		return hasPermission(organization.role, permission)
			? null
			: PERMISSION_DENIED_MESSAGE;
	};

	const analysisActionDisabledReason =
		getPermissionDisabledReason("analysis:run");
	const clusterActionDisabledReason =
		getPermissionDisabledReason("cluster:run");
	const synthesisActionDisabledReason =
		getPermissionDisabledReason("synthesis:generate");
	const autoCreateDisabledReason = getPermissionDisabledReason("auto:create");
	const autoRunDisabledReason = getPermissionDisabledReason("auto:run");

	useEffect(() => {
		if (!isPending && !session?.user) {
			router.push("/auth/login");
			return;
		}

		if (session?.user) {
			// Fetch evaluation
			fetch(`/api/evaluations/${id}`, {
				credentials: "include",
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.error) {
						router.push("/evaluations");
					} else {
						setEvaluation(data.evaluation);
					}
				});

			void loadTestCases();

			void loadEvaluationArtifacts(true);

			void loadRuns().finally(() => setIsLoading(false));
		}
	}, [
		session,
		isPending,
		router,
		id,
		loadEvaluationArtifacts,
		loadRuns,
		loadTestCases,
	]); // Changed from params.id to id

	const handleCopyResults = () => {
		if (!qualityScore || !evaluation) return;

		const latestRun = runs[0];
		const runTotal = latestRun?.totalCases || latestRun?.total_cases || 0;
		const runPassed = latestRun?.passedCases || latestRun?.passed_cases || 0;
		const summary = `
Evaluation Results: ${evaluation.name}
Grade: ${qualityScore.grade} (${qualityScore.overall}/100)

Summary:
- Total Tests: ${runTotal}
- Passed: ${runPassed}
- Failed: ${runTotal - runPassed}
- Pass Rate: ${runTotal ? Math.round((runPassed / runTotal) * 100) : 0}%

Quality Metrics:
- Accuracy: ${qualityScore.metrics.accuracy}/100
- Safety: ${qualityScore.metrics.safety}/100
- Latency: ${qualityScore.metrics.latency}/100
- Cost: ${qualityScore.metrics.cost}/100
- Consistency: ${qualityScore.metrics.consistency}/100

Key Insights:
${qualityScore.insights.map((insight: string) => `- ${insight}`).join("\n")}

Recommendations:
${qualityScore.recommendations.map((recommendation: string) => `- ${recommendation}`).join("\n")}
    `.trim();

		navigator.clipboard.writeText(summary);
		toast.success("Results copied to clipboard!");
	};

	const handleExportWithOptions = async (
		options: ExportOptions,
	): Promise<string | null> => {
		if (!qualityScore || !evaluation) return null;

		const latestRun = runs[0];
		const runId = latestRun?.id ?? latestRun?.runId;

		if (runId) {
			try {
				const res = await fetch(`/api/evaluations/${id}/runs/${runId}/export`, {
					credentials: "include",
				});
				if (res.ok) {
					const exportData = await res.json();
					if (options.publishAsDemo) {
						const publishRes = await fetch(`/api/evaluations/${id}/publish`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								exportData,
								customShareId: options.customShareId,
								shareScope: options.shareScope ?? "evaluation",
								evaluationRunId: runId,
							}),
						});
						if (!publishRes.ok) {
							const err = (await publishRes.json()) as { error?: string };
							throw new Error(err.error || "Failed to publish");
						}
						const result = await publishRes.json();
						downloadExportFile(exportData, evaluation);
						return result.shareId;
					}
					downloadExportFile(exportData, evaluation);
					return null;
				}
			} catch (error: unknown) {
				console.warn("Server export failed, falling back to client:", error);
			}
		}

		const baseData = {
			evaluation: {
				id: String(evaluation.id),
				name: evaluation.name,
				description: evaluation.description || "",
				type: evaluation.type as EvaluationType,
				category: evaluation.category,
				created_at: evaluation.created_at || new Date().toISOString(),
			},
			timestamp: new Date().toISOString(),
			summary: {
				totalTests: latestRun?.totalCases || latestRun?.total_cases || 0,
				passed: latestRun?.passedCases || latestRun?.passed_cases || 0,
				failed:
					(latestRun?.totalCases || latestRun?.total_cases || 0) -
					(latestRun?.passedCases || latestRun?.passed_cases || 0),
				passRate:
					latestRun?.totalCases || latestRun?.total_cases
						? `${Math.round(((latestRun?.passedCases || latestRun?.passed_cases || 0) / (latestRun?.totalCases || latestRun?.total_cases || 1)) * 100)}%`
						: "0%",
			},
			qualityScore: qualityScore || undefined,
		};

		const additionalData = getAdditionalExportData(
			evaluation.type,
			testCases,
			runs,
			latestRun,
		);

		const exportData = formatExportData(baseData, additionalData);

		const validation = validateExportData(exportData);
		if (!validation.valid) {
			console.warn("Export data incomplete:", validation.missingFields);
		}

		if (options.publishAsDemo) {
			try {
				const response = await fetch(`/api/evaluations/${id}/publish`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						exportData,
						customShareId: options.customShareId,
						shareScope: options.shareScope ?? "evaluation",
						evaluationRunId: latestRun?.id ?? latestRun?.runId,
					}),
				});

				if (!response.ok) {
					const error = (await response.json()) as { error?: string };
					throw new Error(error.error || "Failed to publish");
				}

				const result = await response.json();

				downloadExportFile(exportData, evaluation);

				return result.shareId;
			} catch (error) {
				logger.error("Publish error", error);
				throw error;
			}
		} else {
			downloadExportFile(exportData, evaluation);
			return null;
		}
	};

	const downloadExportFile = (
		exportData: unknown,
		evaluationDetails: { name?: string; type?: string; category?: string },
	) => {
		const filename = generateExportFilename(
			evaluationDetails.name || "evaluation",
			evaluationDetails.type as EvaluationType,
			evaluationDetails.category || "",
		);

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Helper function to get type-specific export data
	const getAdditionalExportData = (
		type: string,
		testCaseItems: TestCase[],
		runItems: EvaluationRun[],
		latestRun: EvaluationRun | undefined,
	) => {
		switch (type) {
			case "unit_test":
				return {
					testResults: testCaseItems.map((testCase: TestCase) => ({
						id: testCase.id,
						name: testCase.name || "",
						input: testCase.input,
						expected_output: testCase.expectedOutput || testCase.expected,
						actual_output: testCase.actualOutput,
						passed: testCase.passed ?? false,
						execution_time_ms: testCase.executionTimeMs,
						error_message: testCase.errorMessage,
					})),
					codeValidation: (latestRun as Record<string, unknown> | undefined)
						?.code_validation,
				};

			case "human_eval": {
				const latestRunRecord = latestRun as
					| Record<string, unknown>
					| undefined;
				return {
					evaluations: (latestRunRecord?.human_evaluations as unknown[]) || [],
					criteria: evaluation?.human_eval_criteria || [],
					interRaterReliability: latestRunRecord?.inter_rater_reliability,
				};
			}

			case "model_eval": {
				const latestRunRecord = latestRun as
					| Record<string, unknown>
					| undefined;
				return {
					judgeEvaluations:
						(latestRunRecord?.judge_evaluations as unknown[]) || [],
					judgePrompt: evaluation?.judge_prompt || "",
					judgeModel: evaluation?.judge_model || "gpt-4",
					aggregateMetrics: latestRunRecord?.aggregate_metrics,
				};
			}

			case "ab_test": {
				const latestRunRecord = latestRun as
					| Record<string, unknown>
					| undefined;
				return {
					variants: evaluation?.variants || [],
					results: runItems.map((run: EvaluationRun) => ({
						variant_id: run.variant_id,
						variant_name: run.variant_name,
						test_count: run.total_tests,
						success_rate: (run.passed_tests || 0) / (run.total_tests || 1),
						average_latency: run.average_latency,
						average_cost: run.average_cost,
						quality_score: run.quality_score,
					})),
					statisticalSignificance: latestRunRecord?.statistical_significance,
					comparison: latestRunRecord?.comparison,
				};
			}

			default:
				return {
					testResults: testCaseItems,
					recentRuns: runItems.slice(0, 5),
				};
		}
	};

	if (isPending || !session?.user || isLoading || !evaluation) {
		return null;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/evaluations">Evaluations</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{evaluation.name}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="flex items-center gap-3 sm:gap-4">
				<Button variant="ghost" size="sm" asChild className="h-9">
					<Link href="/evaluations">
						<ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
						<span className="hidden sm:inline">Back to Evaluations</span>
						<span className="sm:hidden">Back</span>
					</Link>
				</Button>
			</div>

			{/* Evaluation Header */}
			<div>
				<div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
					<div className="flex-1">
						<div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
							<h1 className="text-2xl font-bold sm:text-3xl">
								{evaluation.name}
							</h1>
							<Badge
								variant="outline"
								className={`${
									evaluation.type === "unit_test"
										? "bg-blue-500/10 text-blue-500 border-blue-500/20"
										: evaluation.type === "human_eval"
											? "bg-green-500/10 text-green-500 border-green-500/20"
											: evaluation.type === "model_eval"
												? "bg-purple-500/10 text-purple-500 border-purple-500/20"
												: "bg-orange-500/10 text-orange-500 border-orange-500/20"
								}`}
							>
								{evaluation.type.replace("_", " ")}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground sm:text-base">
							{evaluation.description || "No description provided"}
						</p>
					</div>
					<div className="flex w-full gap-2 sm:w-auto">
						{qualityScore ? (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={handleCopyResults}
									className="flex-1 sm:flex-none"
								>
									<Copy className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
									Copy
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setExportModalOpen(true)}
									className="flex-1 sm:flex-none"
								>
									<Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
									Export
								</Button>
							</>
						) : null}
						<Button size="sm" className="flex-1 sm:flex-none">
							<Play className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
							Run
						</Button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-3 sm:gap-4">
				<Card>
					<CardHeader className="pb-2 sm:pb-3">
						<CardTitle className="text-xs font-medium sm:text-sm">
							Test Cases
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold sm:text-2xl">
							{testCases.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2 sm:pb-3">
						<CardTitle className="text-xs font-medium sm:text-sm">
							Total Runs
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold sm:text-2xl">{runs.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2 sm:pb-3">
						<CardTitle className="text-xs font-medium sm:text-sm">
							Last Run
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xs sm:text-sm">
							{runs.length > 0
								? new Date(
										runs[0].startedAt ||
											runs[0].started_at ||
											runs[0].createdAt ||
											"",
									).toLocaleDateString()
								: "Never"}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quality Score Card */}
			{qualityScore ? <AIQualityScoreCard score={qualityScore} /> : null}

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="space-y-4"
			>
				<TabsList className="grid h-auto w-full grid-cols-4">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="analysis">Analysis</TabsTrigger>
					<TabsTrigger value="synthesize">Synthesize</TabsTrigger>
					<TabsTrigger value="auto">Auto</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<TabErrorBoundary
						label="Overview"
						resetKeys={[activeTab, id, testCases.length]}
					>
						<EvaluationTestCasesSection testCases={testCases} />
					</TabErrorBoundary>
				</TabsContent>

				<TabsContent value="analysis" className="space-y-6">
					<TabErrorBoundary
						label="Analysis"
						resetKeys={[activeTab, id, runs.length, evaluationArtifacts.length]}
					>
						<AnalysisTab
							evaluationId={id}
							artifacts={evaluationArtifacts}
							artifactsLoading={artifactsLoading}
							runs={runs}
							runInsights={runInsights}
							openDiffRunId={openDiffRunId}
							onRefreshArtifacts={loadEvaluationArtifacts}
							onOpenArtifact={openArtifactDetail}
							onOpenDiffRunIdChange={setOpenDiffRunId}
							onFetchRunInsight={fetchRunInsight}
							onSaveRunArtifact={saveRunArtifact}
							onLoadRunArtifacts={loadRunArtifacts}
							analysisActionDisabledReason={analysisActionDisabledReason}
							clusterActionDisabledReason={clusterActionDisabledReason}
							onNavigateToTab={handleTabChange}
							onDeleteArtifact={deleteArtifact}
							onAcceptSynthesisArtifact={acceptSynthesisArtifact}
							deletingArtifactId={deletingArtifactId}
							acceptingArtifactId={acceptingArtifactId}
						/>
					</TabErrorBoundary>
				</TabsContent>

				<TabsContent value="synthesize" className="space-y-6">
					<TabErrorBoundary
						label="Synthesize"
						resetKeys={[
							activeTab,
							id,
							synthesisPreview?.generated ?? 0,
							diversityPreview?.specCount ?? 0,
						]}
					>
						<SynthesizeTab
							hasRuns={runs.length > 0}
							hasAnalysisSeed={runs.some((run) =>
								Boolean(
									runInsights[run.id]?.analysis || runInsights[run.id]?.dataset,
								),
							)}
							onNavigateToTab={handleTabChange}
							synthesisDatasetContent={synthesisDatasetContent}
							synthesisDimensionsInput={synthesisDimensionsInput}
							synthesisFailureModesInput={synthesisFailureModesInput}
							synthesisCountInput={synthesisCountInput}
							synthesisPreview={synthesisPreview}
							synthesisLoading={synthesisLoading}
							synthesisSaving={synthesisSaving}
							synthesisDatasetLoading={synthesisDatasetLoading}
							diversitySpecsInput={diversitySpecsInput}
							diversityThresholdInput={diversityThresholdInput}
							diversityPreview={diversityPreview}
							diversityLoading={diversityLoading}
							diversitySaving={diversitySaving}
							onSynthesisDatasetContentChange={setSynthesisDatasetContent}
							onSynthesisDimensionsInputChange={setSynthesisDimensionsInput}
							onSynthesisFailureModesInputChange={setSynthesisFailureModesInput}
							onSynthesisCountInputChange={setSynthesisCountInput}
							onLoadLatestRunDataset={loadLatestRunDataset}
							onGenerateSynthesisPreview={generateSynthesisPreview}
							onSaveSynthesisArtifact={saveSynthesisArtifact}
							onDiversitySpecsInputChange={setDiversitySpecsInput}
							onDiversityThresholdInputChange={setDiversityThresholdInput}
							onGenerateDiversityPreview={generateDiversityPreview}
							onSaveDiversityArtifact={saveDiversityArtifact}
							datasetActionDisabledReason={analysisActionDisabledReason}
							synthesisActionDisabledReason={synthesisActionDisabledReason}
							diversityActionDisabledReason={analysisActionDisabledReason}
						/>
					</TabErrorBoundary>
				</TabsContent>

				<TabsContent value="auto" className="space-y-6">
					<TabErrorBoundary
						label="Auto"
						resetKeys={[
							activeTab,
							id,
							requestedSessionId ?? "",
							autoExecutionState.sessions.length,
						]}
					>
						<AutoTab
							hasEvaluationSummary={Boolean(evaluation && qualityScore)}
							evaluationSummary={{
								evaluationName: evaluation.name,
								testCaseCount: testCases.length,
								runCount: runs.length,
								latestStatus: runs[0]?.status ?? null,
								qualityGrade: qualityScore?.grade ?? null,
							}}
							autoPlanObjectiveInput={autoPlanObjectiveInput}
							autoPlanTargetPathInput={autoPlanTargetPathInput}
							autoPlanTargetContentInput={autoPlanTargetContentInput}
							autoPlanAllowedFamiliesInput={autoPlanAllowedFamiliesInput}
							autoPlanHypothesisInput={autoPlanHypothesisInput}
							autoPlanForbiddenChangesInput={autoPlanForbiddenChangesInput}
							autoPlanIterationInput={autoPlanIterationInput}
							autoPlanPreview={autoPlanPreview}
							autoPlanLoading={autoPlanLoading}
							onAutoPlanObjectiveInputChange={setAutoPlanObjectiveInput}
							onAutoPlanTargetPathInputChange={setAutoPlanTargetPathInput}
							onAutoPlanTargetContentInputChange={setAutoPlanTargetContentInput}
							onAutoPlanAllowedFamiliesInputChange={
								setAutoPlanAllowedFamiliesInput
							}
							onAutoPlanHypothesisInputChange={setAutoPlanHypothesisInput}
							onAutoPlanForbiddenChangesInputChange={
								setAutoPlanForbiddenChangesInput
							}
							onAutoPlanIterationInputChange={setAutoPlanIterationInput}
							onGenerateAutoPlanPreview={generateAutoPlanPreview}
							executionState={autoExecutionState}
							autoPlanDisabledReason={autoCreateDisabledReason}
							createSessionDisabledReason={autoCreateDisabledReason}
							runSessionDisabledReason={autoRunDisabledReason}
						/>
					</TabErrorBoundary>
				</TabsContent>
			</Tabs>

			<EvalgateArtifactDialog
				open={artifactDialogOpen}
				onOpenChange={setArtifactDialogOpen}
				artifact={selectedArtifact}
			/>

			{/* Export Modal */}
			<ExportModal
				open={exportModalOpen}
				onOpenChange={setExportModalOpen}
				evaluationName={evaluation?.name || "Evaluation"}
				onExport={handleExportWithOptions}
			/>
		</div>
	);
}
