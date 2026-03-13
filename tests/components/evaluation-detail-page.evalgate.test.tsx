/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
	useSession: vi.fn(() => ({
		data: { user: { id: "test-user", email: "test@example.com" } },
		isPending: false,
		error: null,
		refetch: vi.fn(),
	})),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: pushMock, replace: replaceMock })),
	usePathname: vi.fn(() => "/evaluations/123"),
	useSearchParams: vi.fn(() => searchParamsState),
}));

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/components/ai-quality-score-card", () => ({
	AIQualityScoreCard: () => <div>AI Quality Score Card</div>,
}));

vi.mock("@/components/export-modal", () => ({
	ExportModal: () => null,
}));

vi.mock("@/components/run-diff-view", () => ({
	RunDiffView: () => <div>Run Diff View</div>,
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

import { toast } from "sonner";
import EvaluationDetailPage from "@/app/(authenticated)/evaluations/[id]/page";
import { type OrgRole, PERMISSION_DENIED_MESSAGE } from "@/lib/permissions";

const baseEvaluation = {
	id: 123,
	name: "Artifact Evaluation",
	type: "unit_test",
	description: "Evaluation detail page",
};

const labeledDatasetContent = [
	JSON.stringify({
		caseId: "case-1",
		input: "Ask the tool for weather in Boston",
		expected: "Return the weather summary",
		actual: "Tool call failed with a timeout",
		label: "fail",
		failureMode: "tool_failure",
		labeledAt: "2026-03-12T00:00:00.000Z",
	}),
	JSON.stringify({
		caseId: "case-2",
		input: "Greet the user",
		expected: "Say hello",
		actual: "Say hello",
		label: "pass",
		failureMode: null,
		labeledAt: "2026-03-12T00:01:00.000Z",
	}),
].join("\n");

const diversitySpecsJson = JSON.stringify([
	{
		id: "spec-1",
		name: "Tool fallback coverage",
		file: "evals/tool-fallback.test.ts",
		tags: ["smoke", "tool"],
		hasAssertions: true,
		usesModels: true,
		usesTools: true,
		complexity: "medium",
		fingerprintText: "tool fallback timeout retry recovery",
	},
	{
		id: "spec-2",
		name: "Tool timeout overlap",
		file: "evals/tool-timeout.test.ts",
		tags: ["smoke", "tool"],
		hasAssertions: true,
		usesModels: true,
		usesTools: true,
		complexity: "medium",
		fingerprintText: "tool fallback timeout retry recovery",
	},
]);

const initialSavedArtifacts = [
	{
		id: 501,
		kind: "synthesis",
		title: "Synthetic case generation",
		summary: {
			generated: 2,
			sourceCases: 2,
			sourceFailures: 1,
			selectedFailureModes: ["tool_failure"],
		},
		payload: { generated: 2 },
		metadata: { source: "dataset_content", rowCount: 2 },
		createdAt: "2026-03-12T01:05:00.000Z",
	},
	{
		id: 502,
		kind: "diversity",
		title: "Spec diversity report",
		summary: {
			specCount: 2,
			score: 42,
			redundantPairCount: 1,
		},
		payload: { specs: JSON.parse(diversitySpecsJson) },
		metadata: { source: "spec_inventory", rowCount: 2 },
		createdAt: "2026-03-12T01:10:00.000Z",
	},
];

const completedRun = {
	id: 301,
	status: "completed",
	passedCases: 3,
	totalCases: 4,
	startedAt: "2026-03-12T02:00:00.000Z",
	createdAt: "2026-03-12T02:00:00.000Z",
	traceLog: {},
};

function jsonResponse(body: unknown, status = 200): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response;
}

function createFetchMock(options?: {
	initialArtifacts?: unknown[];
	role?: OrgRole;
	runs?: unknown[];
}) {
	return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === "string" ? input : input.toString();
		const method = init?.method ?? "GET";

		if (url === "/api/organizations/current" && method === "GET") {
			return jsonResponse({
				organization: {
					id: 1,
					name: "EvalGate Org",
					role: options?.role ?? "member",
					createdAt: "2026-03-12T00:00:00.000Z",
					updatedAt: "2026-03-12T00:00:00.000Z",
				},
			});
		}
		if (url === "/api/evaluations/123" && method === "GET") {
			return jsonResponse({ evaluation: baseEvaluation });
		}
		if (url === "/api/evaluations/123/test-cases" && method === "GET") {
			return jsonResponse({ testCases: [] });
		}
		if (url === "/api/evaluations/123/runs" && method === "GET") {
			return jsonResponse({ runs: options?.runs ?? [] });
		}
		if (url === "/api/evaluations/123/auto-sessions" && method === "GET") {
			return jsonResponse({ sessions: [] });
		}
		if (
			url === "/api/evaluations/123/artifacts/501/accept" &&
			method === "POST"
		) {
			return jsonResponse({ success: true, artifactId: 501, createdCount: 1 });
		}
		if (url === "/api/evaluations/123/artifacts/501" && method === "DELETE") {
			return jsonResponse({ success: true });
		}
		if (url === "/api/evaluations/123/artifacts?limit=25" && method === "GET") {
			return jsonResponse({ artifacts: options?.initialArtifacts ?? [] });
		}
		if (url === "/api/evalgate/synthesize" && method === "POST") {
			return jsonResponse({
				sourceCases: 2,
				sourceFailures: 1,
				selectedFailureModes: ["tool_failure"],
				dimensionNames: ["locale"],
				dimensionCombinationCount: 2,
				generated: 2,
				modeCounts: [{ failureMode: "tool_failure", count: 2 }],
				cases: [
					{
						caseId: "synthetic-tool-failure-locale-en-001",
						input: "Synthetic input",
						expected: "Synthetic expected",
						actual: "Synthetic actual",
						label: "fail",
						failureMode: "tool_failure",
						labeledAt: "2026-03-12T01:00:00.000Z",
						synthetic: true,
						synthesizedAt: "2026-03-12T01:00:00.000Z",
						sourceCaseIds: ["case-1"],
						dimensions: { locale: "en" },
					},
				],
			});
		}
		if (url === "/api/evalgate/discover-diversity" && method === "POST") {
			return jsonResponse({
				specCount: 2,
				diversity: {
					score: 42,
					averageNearestNeighborSimilarity: 0.58,
					threshold: 0.55,
					redundantPairs: [
						{
							leftSpecId: "spec-1",
							leftName: "Tool fallback coverage",
							rightSpecId: "spec-2",
							rightName: "Tool timeout overlap",
							similarity: 0.9,
						},
					],
				},
			});
		}
		if (url === "/api/evalgate/auto-plan" && method === "POST") {
			return jsonResponse({
				iteration: 1,
				selectedFamily: "few-shot-examples",
				proposedPatch:
					"Use the Add 2-3 examples demonstrating correct behavior strategy to reduce tone_mismatch. Example: Input: [INPUT] → Output: [CORRECT_OUTPUT] Working hypothesis: acknowledge the user's concern first.",
				candidate: {
					id: "planner-few-shot-examples-1",
					label: "few-shot-examples",
					instruction:
						"Use the Add 2-3 examples demonstrating correct behavior strategy to reduce tone_mismatch. Example: Input: [INPUT] → Output: [CORRECT_OUTPUT] Working hypothesis: acknowledge the user's concern first.",
				},
				reason: null,
				rankedFamilies: [
					{
						id: "few-shot-examples",
						description: "Add 2-3 examples demonstrating correct behavior",
						estimatedCost: "medium",
						targetedFailureModes: ["tone_mismatch", "generalization"],
					},
					{
						id: "instruction-order",
						description:
							"Reorder instructions to front-load critical requirements",
						estimatedCost: "low",
						targetedFailureModes: ["constraint_missing", "formatting"],
					},
				],
			});
		}
		if (url === "/api/evaluations/123/artifacts" && method === "POST") {
			const body = JSON.parse(String(init?.body ?? "{}")) as Record<
				string,
				unknown
			>;
			if (body.artifactType === "synthesis") {
				return jsonResponse(
					{
						id: 501,
						kind: "synthesis",
						title: "Synthetic case generation",
						summary: {
							generated: 2,
							sourceCases: 2,
							sourceFailures: 1,
							selectedFailureModes: ["tool_failure"],
						},
						payload: { generated: 2 },
						metadata: { source: "dataset_content", rowCount: 2 },
						createdAt: "2026-03-12T01:05:00.000Z",
					},
					201,
				);
			}
			if (body.artifactType === "diversity") {
				return jsonResponse(
					{
						id: 502,
						kind: "diversity",
						title: "Spec diversity report",
						summary: {
							specCount: 2,
							score: 42,
							redundantPairCount: 1,
						},
						payload: { specs: JSON.parse(diversitySpecsJson) },
						metadata: { source: "spec_inventory", rowCount: 2 },
						createdAt: "2026-03-12T01:10:00.000Z",
					},
					201,
				);
			}
		}

		throw new Error(`Unhandled fetch: ${method} ${url}`);
	});
}

function fulfilledParams(value: { id: string }): Promise<{ id: string }> {
	const promise = Promise.resolve(value) as Promise<{ id: string }> & {
		status?: "fulfilled";
		value?: { id: string };
		reason?: undefined;
	};
	promise.status = "fulfilled";
	promise.value = value;
	promise.reason = undefined;
	return promise;
}

async function renderPage(fetchMock: ReturnType<typeof createFetchMock>) {
	vi.stubGlobal("fetch", fetchMock);

	render(
		<Suspense fallback={null}>
			<EvaluationDetailPage params={fulfilledParams({ id: "123" })} />
		</Suspense>,
	);
}

function activateTab(name: string) {
	const tab = screen.getByRole("tab", { name });
	fireEvent.mouseDown(tab, { button: 0 });
	fireEvent.click(tab);
}

describe("EvaluationDetailPage EvalGate artifact flows", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		pushMock.mockReset();
		replaceMock.mockReset();
		searchParamsState.delete("tab");
		searchParamsState.delete("session");
	});

	it("previews synthesis and saves the artifact into the saved list", async () => {
		const fetchMock = createFetchMock();

		await renderPage(fetchMock);

		await screen.findByRole("heading", { name: "Artifact Evaluation" });
		activateTab("Synthesize");
		await screen.findByText("Synthetic Case Generation");

		fireEvent.change(screen.getByLabelText("Dataset content"), {
			target: { value: labeledDatasetContent },
		});
		fireEvent.change(screen.getByLabelText("Target count"), {
			target: { value: "2" },
		});
		fireEvent.change(screen.getByLabelText("Failure modes"), {
			target: { value: "tool_failure" },
		});
		fireEvent.change(screen.getByLabelText("Dimension matrix JSON"), {
			target: { value: JSON.stringify({ locale: ["en", "es"] }) },
		});

		const [firstGeneratePreviewButton] =
			screen.getAllByText("Generate Preview");
		if (!firstGeneratePreviewButton) {
			throw new Error("Expected first Generate Preview button");
		}
		fireEvent.click(firstGeneratePreviewButton);

		await screen.findByText("Generated 2");
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/evalgate/synthesize",
			expect.objectContaining({ method: "POST" }),
		);

		const [firstSaveArtifactButton] = screen.getAllByText("Save Artifact");
		if (!firstSaveArtifactButton) {
			throw new Error("Expected first Save Artifact button");
		}
		fireEvent.click(firstSaveArtifactButton);

		await waitFor(() => {
			expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
				"Saved synthesis artifact",
			);
		});
		const saveCall = fetchMock.mock.calls.find(
			([url, init]) =>
				url === "/api/evaluations/123/artifacts" && init?.method === "POST",
		);
		expect(saveCall).toBeDefined();
		expect(JSON.parse(String(saveCall?.[1]?.body ?? "{}"))).toMatchObject({
			artifactType: "synthesis",
			count: 2,
			failureModes: ["tool_failure"],
			dimensions: { locale: ["en", "es"] },
		});
	});

	it("renders saved EvalGate artifacts from the initial list fetch", async () => {
		const fetchMock = createFetchMock({
			initialArtifacts: initialSavedArtifacts,
		});

		await renderPage(fetchMock);

		await screen.findByText("Synthetic case generation");
		expect(screen.getByText("Spec diversity report")).toBeDefined();
	}, 15_000);

	it("disables viewer mutation actions across EvalGate tabs", async () => {
		const fetchMock = createFetchMock({
			role: "viewer",
			runs: [completedRun],
		});

		await renderPage(fetchMock);

		await screen.findByRole("heading", { name: "Artifact Evaluation" });
		await screen.findByText("Recent Runs");

		const datasetButton = screen.getByRole("button", { name: "Dataset" });
		const analyzeButton = screen.getByRole("button", { name: "Analyze" });
		const clusterButton = screen.getByRole("button", { name: "Cluster" });

		expect(datasetButton).toBeDisabled();
		expect(analyzeButton).toBeDisabled();
		expect(clusterButton).toBeDisabled();
		expect(datasetButton.parentElement).toHaveAttribute(
			"title",
			PERMISSION_DENIED_MESSAGE,
		);

		activateTab("Synthesize");
		await screen.findByText("Synthetic Case Generation");

		expect(
			screen.getByRole("button", { name: "Use Latest Run Dataset" }),
		).toBeDisabled();
		expect(
			screen.getAllByRole("button", { name: "Generate Preview" })[0],
		).toBeDisabled();
		expect(
			screen.getAllByRole("button", { name: "Save Artifact" })[0],
		).toBeDisabled();
		expect(
			screen.getAllByRole("button", { name: "Generate Preview" })[1],
		).toBeDisabled();
		expect(
			screen.getAllByRole("button", { name: "Save Artifact" })[1],
		).toBeDisabled();

		activateTab("Auto");
		await screen.findByText("Auto Planner Preview");

		expect(
			screen.getByRole("button", { name: "Generate Plan" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Create session" }),
		).toBeDisabled();
	});

	it("previews diversity and saves the artifact into the saved list", async () => {
		const fetchMock = createFetchMock();

		await renderPage(fetchMock);

		await screen.findByRole("heading", { name: "Artifact Evaluation" });
		activateTab("Synthesize");
		await screen.findByText("Spec Diversity Report");

		fireEvent.change(screen.getByLabelText("Spec inventory JSON"), {
			target: { value: diversitySpecsJson },
		});
		fireEvent.change(screen.getByLabelText("Redundancy threshold"), {
			target: { value: "0.55" },
		});

		const [, secondGeneratePreviewButton] =
			screen.getAllByText("Generate Preview");
		if (!secondGeneratePreviewButton) {
			throw new Error("Expected second Generate Preview button");
		}
		fireEvent.click(secondGeneratePreviewButton);

		await screen.findByText("Tool fallback coverage ↔ Tool timeout overlap");
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/evalgate/discover-diversity",
			expect.objectContaining({ method: "POST" }),
		);

		const [, secondSaveArtifactButton] = screen.getAllByText("Save Artifact");
		if (!secondSaveArtifactButton) {
			throw new Error("Expected second Save Artifact button");
		}
		fireEvent.click(secondSaveArtifactButton);

		await waitFor(() => {
			expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
				"Saved diversity artifact",
			);
		});
		const saveCall = fetchMock.mock.calls.find(
			([url, init]) =>
				url === "/api/evaluations/123/artifacts" && init?.method === "POST",
		);
		expect(saveCall).toBeDefined();
		expect(JSON.parse(String(saveCall?.[1]?.body ?? "{}"))).toMatchObject({
			artifactType: "diversity",
			threshold: 0.55,
		});
	});

	it("syncs the selected tab into the query string", async () => {
		const fetchMock = createFetchMock({ runs: [completedRun] });

		await renderPage(fetchMock);
		await screen.findByRole("heading", { name: "Artifact Evaluation" });

		activateTab("Auto");

		expect(replaceMock).toHaveBeenCalledWith("/evaluations/123?tab=auto");
	});
});
