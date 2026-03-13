/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AutoExecutionPanel } from "@/app/(authenticated)/evaluations/[id]/auto-execution-panel";
import type { UseAutoExecutionStateReturn } from "@/app/(authenticated)/evaluations/[id]/use-auto-execution-state";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/permissions";

function createExecutionState(
	overrides: Partial<UseAutoExecutionStateReturn> = {},
): UseAutoExecutionStateReturn {
	return {
		sessionConfig: {
			name: "Tone mismatch repair",
			objective: "Reduce tone mismatch failures without regressions",
			targetPath: "prompts/support.md",
			allowedFamilies: ["few-shot-examples", "instruction-order"],
			maxIterations: 4,
			maxCostUsd: "1.25",
		},
		updateSessionConfig: vi.fn(),
		createSession: vi.fn().mockResolvedValue(undefined),
		startRun: vi.fn().mockResolvedValue(undefined),
		stopRun: vi.fn().mockResolvedValue(undefined),
		sessionId: "auto_session_1",
		jobId: "job_auto_1",
		createError: null,
		startError: null,
		status: {
			sessionId: "auto_session_1",
			name: "Tone mismatch repair",
			objective: "Reduce tone mismatch failures without regressions",
			status: "running",
			currentIteration: 1,
			maxIterations: 4,
			experiments: [
				{
					id: "exp-1",
					iteration: 1,
					mutationFamily: "few-shot-examples",
					candidatePatch: "Add an empathetic example before the answer.",
					utilityScore: 72,
					objectiveReduction: 0.12,
					regressions: 0,
					improvements: 2,
					decision: "keep",
					hardVetoReason: null,
					reflection: "Improved acknowledgement rate.",
					createdAt: "2026-03-13T02:01:00.000Z",
				},
			],
			bestExperiment: {
				id: "exp-1",
				iteration: 1,
				mutationFamily: "few-shot-examples",
				candidatePatch: "Add an empathetic example before the answer.",
				utilityScore: 72,
				objectiveReduction: 0.12,
				regressions: 0,
				improvements: 2,
				decision: "keep",
				hardVetoReason: null,
				reflection: "Improved acknowledgement rate.",
				createdAt: "2026-03-13T02:01:00.000Z",
			},
			budgetUsed: {
				iterations: 1,
				costUsd: 0.11,
			},
			startedAt: "2026-03-13T02:01:00.000Z",
			completedAt: null,
			stopReason: null,
			error: null,
		},
		isPolling: true,
		pollError: null,
		isIdle: false,
		isQueued: false,
		isRunning: true,
		isTerminal: false,
		currentIteration: 1,
		maxIterations: 4,
		experiments: [
			{
				id: "exp-1",
				iteration: 1,
				mutationFamily: "few-shot-examples",
				candidatePatch: "Add an empathetic example before the answer.",
				utilityScore: 72,
				objectiveReduction: 0.12,
				regressions: 0,
				improvements: 2,
				decision: "keep",
				hardVetoReason: null,
				reflection: "Improved acknowledgement rate.",
				createdAt: "2026-03-13T02:01:00.000Z",
			},
		],
		bestExperiment: {
			id: "exp-1",
			iteration: 1,
			mutationFamily: "few-shot-examples",
			candidatePatch: "Add an empathetic example before the answer.",
			utilityScore: 72,
			objectiveReduction: 0.12,
			regressions: 0,
			improvements: 2,
			decision: "keep",
			hardVetoReason: null,
			reflection: "Improved acknowledgement rate.",
			createdAt: "2026-03-13T02:01:00.000Z",
		},
		sessions: [
			{
				sessionId: "auto_session_1",
				name: "Tone mismatch repair",
				status: "running",
				currentIteration: 1,
				maxIterations: 4,
				createdAt: "2026-03-13T02:00:00.000Z",
			},
		],
		sessionsLoading: false,
		loadSessions: vi.fn().mockResolvedValue(undefined),
		selectSession: vi.fn(),
		createFieldErrors: {},
		...overrides,
	};
}

describe("AutoExecutionPanel", () => {
	it("renders the best experiment summary and execution history", () => {
		render(<AutoExecutionPanel executionState={createExecutionState()} />);

		expect(screen.getByText("Auto Bounded Execution")).toBeInTheDocument();
		expect(screen.getByText("Background job job_auto_1")).toBeInTheDocument();
		expect(screen.getByText("Best kept experiment")).toBeInTheDocument();
		expect(screen.getAllByText("few-shot-examples").length).toBeGreaterThan(0);
		expect(
			screen.getByText("Add an empathetic example before the answer."),
		).toBeInTheDocument();
		expect(
			screen.getByText("Polling every 3 seconds while execution is active."),
		).toBeInTheDocument();
	});

	it("delegates create and run actions to the execution hook when the session is idle", () => {
		const executionState = createExecutionState({
			jobId: null,
			status: {
				sessionId: "auto_session_1",
				name: "Tone mismatch repair",
				objective: "Reduce tone mismatch failures without regressions",
				status: "idle",
				currentIteration: 0,
				maxIterations: 4,
				experiments: [],
				bestExperiment: null,
				budgetUsed: {
					iterations: 0,
					costUsd: 0,
				},
				startedAt: null,
				completedAt: null,
				stopReason: null,
				error: null,
			},
			isPolling: false,
			isIdle: true,
			isQueued: false,
			isRunning: false,
			isTerminal: false,
			currentIteration: 0,
			experiments: [],
			bestExperiment: null,
		});

		render(<AutoExecutionPanel executionState={executionState} />);

		fireEvent.click(screen.getByText("Create session"));
		fireEvent.click(screen.getByText("Run"));

		expect(executionState.createSession).toHaveBeenCalledTimes(1);
		expect(executionState.startRun).toHaveBeenCalledTimes(1);
		expect(executionState.stopRun).toHaveBeenCalledTimes(0);
	});

	it("delegates stop actions to the execution hook when the session is running", () => {
		const executionState = createExecutionState();

		render(<AutoExecutionPanel executionState={executionState} />);

		fireEvent.click(screen.getByText("Stop"));
		fireEvent.click(screen.getByText("Stop run"));

		expect(executionState.stopRun).toHaveBeenCalledTimes(1);
	});

	it("disables mutation controls when permission reasons are provided", () => {
		const executionState = createExecutionState();

		render(
			<AutoExecutionPanel
				executionState={executionState}
				createSessionDisabledReason={PERMISSION_DENIED_MESSAGE}
				runSessionDisabledReason={PERMISSION_DENIED_MESSAGE}
			/>,
		);

		const createButton = screen.getByRole("button", { name: "Create session" });
		const runButton = screen.getByRole("button", { name: "Run" });
		const stopButton = screen.getByRole("button", { name: "Stop" });

		expect(createButton).toBeDisabled();
		expect(runButton).toBeDisabled();
		expect(stopButton).toBeDisabled();
		expect(createButton.parentElement).toHaveAttribute(
			"title",
			PERMISSION_DENIED_MESSAGE,
		);

		fireEvent.click(createButton);
		fireEvent.click(runButton);
		fireEvent.click(stopButton);

		expect(executionState.createSession).not.toHaveBeenCalled();
		expect(executionState.startRun).not.toHaveBeenCalled();
		expect(executionState.stopRun).not.toHaveBeenCalled();
	});

	it("renders a loading skeleton while sessions are being fetched", () => {
		render(
			<AutoExecutionPanel
				executionState={createExecutionState({
					sessionsLoading: true,
					sessions: [],
				})}
			/>,
		);

		expect(screen.getByText("Execution monitor")).toBeInTheDocument();
		expect(screen.getByText("Session")).toBeInTheDocument();
	});

	it("forwards form edits through updateSessionConfig", () => {
		const executionState = createExecutionState({
			sessionId: null,
			jobId: null,
			status: null,
			isPolling: false,
			isIdle: true,
			isRunning: false,
			currentIteration: 0,
			experiments: [],
			bestExperiment: null,
			sessions: [],
			stopRun: vi.fn().mockResolvedValue(undefined),
		});

		render(<AutoExecutionPanel executionState={executionState} />);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "New auto session" },
		});
		fireEvent.change(screen.getByLabelText("Target path"), {
			target: { value: "prompts/new.md" },
		});
		fireEvent.change(screen.getByLabelText("Objective"), {
			target: { value: "Reduce verbosity" },
		});

		expect(executionState.updateSessionConfig).toHaveBeenCalledWith({
			name: "New auto session",
		});
		expect(executionState.updateSessionConfig).toHaveBeenCalledWith({
			targetPath: "prompts/new.md",
		});
		expect(executionState.updateSessionConfig).toHaveBeenCalledWith({
			objective: "Reduce verbosity",
		});
	});
});
