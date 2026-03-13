import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
	AutoExperimentSummary,
	AutoSessionListItem,
	AutoSessionStatus,
} from "./evalgate-types";

interface AutoSessionConfig {
	name: string;
	objective: string;
	targetPath: string;
	allowedFamilies: string[];
	maxIterations: number;
	maxCostUsd: string;
}

interface ApiErrorIssue {
	path?: Array<string | number>;
	message?: string;
}

interface UseAutoExecutionStateReturn {
	sessionConfig: AutoSessionConfig;
	updateSessionConfig: (patch: Partial<AutoSessionConfig>) => void;
	createSession: () => Promise<void>;
	startRun: () => Promise<void>;
	stopRun: () => Promise<void>;
	sessionId: string | null;
	jobId: string | null;
	createError: string | null;
	startError: string | null;
	status: AutoSessionStatus | null;
	isPolling: boolean;
	pollError: string | null;
	isIdle: boolean;
	isQueued: boolean;
	isRunning: boolean;
	isTerminal: boolean;
	currentIteration: number;
	maxIterations: number;
	experiments: AutoExperimentSummary[];
	bestExperiment: AutoExperimentSummary | null;
	sessions: AutoSessionListItem[];
	sessionsLoading: boolean;
	loadSessions: () => Promise<void>;
	selectSession: (sessionId: string) => void;
	createFieldErrors: Record<string, string[]>;
}

const DEFAULT_ALLOWED_FAMILIES = [
	"constraint-clarification",
	"instruction-order",
	"few-shot-examples",
];

const DEFAULT_SESSION_CONFIG: AutoSessionConfig = {
	name: "",
	objective: "",
	targetPath: "",
	allowedFamilies: DEFAULT_ALLOWED_FAMILIES,
	maxIterations: 5,
	maxCostUsd: "",
};

function isTerminalStatus(
	status: AutoSessionStatus | null,
): status is AutoSessionStatus {
	return (
		status?.status === "completed" ||
		status?.status === "failed" ||
		status?.status === "cancelled"
	);
}

async function parseErrorResponse(response: Response): Promise<{
	message: string;
	fieldErrors: Record<string, string[]>;
}> {
	const fallback = {
		message: "Request failed",
		fieldErrors: {},
	};
	try {
		const data = (await response.json()) as {
			error?: { message?: string; details?: unknown };
		};
		const fieldErrors: Record<string, string[]> = {};
		if (Array.isArray(data?.error?.details)) {
			for (const issue of data.error.details as ApiErrorIssue[]) {
				const key = issue.path?.[0];
				if (typeof key !== "string") {
					continue;
				}
				fieldErrors[key] = [
					...(fieldErrors[key] ?? []),
					issue.message ?? "Invalid value",
				];
			}
		}
		return {
			message: data?.error?.message ?? fallback.message,
			fieldErrors,
		};
	} catch {
		return fallback;
	}
}

export function useAutoExecutionState(
	evaluationId: string,
	options: {
		preferredSessionId?: string | null;
		onSessionIdChange?: (sessionId: string | null) => void;
	} = {},
): UseAutoExecutionStateReturn {
	const preferredSessionId = options.preferredSessionId ?? null;
	const onSessionIdChange = options.onSessionIdChange;
	const [sessionConfig, setSessionConfig] = useState<AutoSessionConfig>(
		DEFAULT_SESSION_CONFIG,
	);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [createError, setCreateError] = useState<string | null>(null);
	const [startError, setStartError] = useState<string | null>(null);
	const [status, setStatus] = useState<AutoSessionStatus | null>(null);
	const [pollError, setPollError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<AutoSessionListItem[]>([]);
	const [sessionsLoading, setSessionsLoading] = useState(false);
	const [createFieldErrors, setCreateFieldErrors] = useState<
		Record<string, string[]>
	>({});
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const backoffMsRef = useRef(3000);
	const cancelledRef = useRef(false);
	const hasEmittedSessionRef = useRef(false);
	const statusValue = status?.status;

	const clearPollTimeout = useCallback(() => {
		if (pollTimeoutRef.current) {
			clearTimeout(pollTimeoutRef.current);
			pollTimeoutRef.current = null;
		}
	}, []);

	const fetchStatus = useCallback(
		async (targetSessionId: string): Promise<AutoSessionStatus | null> => {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/auto-sessions/${targetSessionId}/status`,
				{
					credentials: "include",
				},
			);
			if (!response.ok) {
				const { message } = await parseErrorResponse(response);
				throw new Error(message || "Failed to fetch status");
			}
			const data = (await response.json()) as AutoSessionStatus;
			setStatus(data);
			setPollError(null);
			backoffMsRef.current = 3000;
			return data;
		},
		[evaluationId],
	);

	const loadSessions = useCallback(async () => {
		setSessionsLoading(true);
		try {
			const response = await fetch(
				`/api/evaluations/${evaluationId}/auto-sessions`,
				{
					credentials: "include",
				},
			);
			if (!response.ok) {
				throw new Error("Failed to load auto sessions");
			}
			const data = (await response.json()) as {
				sessions: AutoSessionListItem[];
			};
			setSessions(data.sessions ?? []);
			setSessionId((current) => {
				if (current) {
					return current;
				}
				if (preferredSessionId) {
					const preferred = (data.sessions ?? []).find(
						(session) => session.sessionId === preferredSessionId,
					);
					if (preferred) {
						return preferred.sessionId;
					}
				}
				return data.sessions[0]?.sessionId ?? null;
			});
		} finally {
			setSessionsLoading(false);
		}
	}, [evaluationId, preferredSessionId]);

	useEffect(() => {
		void loadSessions().catch(() => undefined);
	}, [loadSessions]);

	useEffect(() => {
		if (!preferredSessionId) {
			return;
		}
		const preferred = sessions.find(
			(session) => session.sessionId === preferredSessionId,
		);
		if (preferred && sessionId !== preferred.sessionId) {
			setSessionId(preferred.sessionId);
			setJobId(null);
			setStatus(null);
		}
	}, [preferredSessionId, sessionId, sessions]);

	useEffect(() => {
		if (!onSessionIdChange) {
			return;
		}
		if (!hasEmittedSessionRef.current) {
			if (sessionId === null && preferredSessionId) {
				return;
			}
			hasEmittedSessionRef.current = true;
		}
		onSessionIdChange(sessionId);
	}, [onSessionIdChange, preferredSessionId, sessionId]);

	useEffect(() => {
		cancelledRef.current = false;
		return () => {
			cancelledRef.current = true;
			clearPollTimeout();
		};
	}, [clearPollTimeout]);

	useEffect(() => {
		clearPollTimeout();
		if (!sessionId) {
			return;
		}
		if (isTerminalStatus(status)) {
			return;
		}
		if (statusValue && statusValue !== "queued" && statusValue !== "running") {
			return;
		}
		const scheduleNext = (delayMs: number) => {
			pollTimeoutRef.current = setTimeout(async () => {
				if (cancelledRef.current || !sessionId) {
					return;
				}
				try {
					const nextStatus = await fetchStatus(sessionId);
					if (
						nextStatus &&
						(nextStatus.status === "queued" || nextStatus.status === "running")
					) {
						scheduleNext(3000);
					}
				} catch {
					setPollError("Failed to fetch status");
					backoffMsRef.current = Math.min(backoffMsRef.current * 2, 30000);
					scheduleNext(backoffMsRef.current);
				}
			}, delayMs);
		};
		void fetchStatus(sessionId)
			.then((nextStatus) => {
				if (
					nextStatus &&
					(nextStatus.status === "queued" || nextStatus.status === "running")
				) {
					scheduleNext(3000);
				}
			})
			.catch(() => {
				setPollError("Failed to fetch status");
				backoffMsRef.current = Math.min(backoffMsRef.current * 2, 30000);
				scheduleNext(backoffMsRef.current);
			});
		return clearPollTimeout;
	}, [clearPollTimeout, fetchStatus, sessionId, statusValue, status]);

	const updateSessionConfig = useCallback(
		(patch: Partial<AutoSessionConfig>) => {
			setSessionConfig((current) => ({ ...current, ...patch }));
			setCreateFieldErrors({});
			setCreateError(null);
		},
		[],
	);

	const createSession = useCallback(async () => {
		setCreateError(null);
		setCreateFieldErrors({});
		const payload: Record<string, unknown> = {
			name: sessionConfig.name,
			objective: sessionConfig.objective,
			targetPath: sessionConfig.targetPath,
			allowedFamilies: sessionConfig.allowedFamilies,
			maxIterations: sessionConfig.maxIterations,
		};
		if (sessionConfig.maxCostUsd.trim()) {
			payload.maxCostUsd = Number(sessionConfig.maxCostUsd);
		}
		const response = await fetch(
			`/api/evaluations/${evaluationId}/auto-sessions`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			},
		);
		if (!response.ok) {
			const { message, fieldErrors } = await parseErrorResponse(response);
			setCreateFieldErrors(fieldErrors);
			setCreateError(message);
			return;
		}
		const data = (await response.json()) as { sessionId: string };
		setSessionId(data.sessionId);
		setJobId(null);
		setStatus(null);
		await loadSessions();
		toast.success("Created auto session");
	}, [evaluationId, loadSessions, sessionConfig]);

	const startRun = useCallback(async () => {
		if (!sessionId) {
			setStartError("Create or select a session first");
			return;
		}
		setStartError(null);
		const response = await fetch(
			`/api/evaluations/${evaluationId}/auto-sessions/${sessionId}/run`,
			{
				method: "POST",
				credentials: "include",
			},
		);
		if (!response.ok) {
			const { message } = await parseErrorResponse(response);
			setStartError(message);
			return;
		}
		const data = (await response.json()) as {
			jobId: string;
			status: "queued";
		};
		setJobId(data.jobId);
		setStatus((current) =>
			current
				? { ...current, status: "queued" }
				: {
						sessionId,
						name: sessionConfig.name,
						objective: sessionConfig.objective,
						status: "queued",
						currentIteration: 0,
						maxIterations: sessionConfig.maxIterations,
						experiments: [],
						bestExperiment: null,
						budgetUsed: { iterations: 0, costUsd: 0 },
						startedAt: null,
						completedAt: null,
						stopReason: null,
						error: null,
					},
		);
		await loadSessions();
		toast.success("Queued auto run");
	}, [
		evaluationId,
		loadSessions,
		sessionConfig.maxIterations,
		sessionConfig.name,
		sessionConfig.objective,
		sessionId,
	]);

	const stopRun = useCallback(async () => {
		if (!sessionId) {
			return;
		}
		const response = await fetch(
			`/api/evaluations/${evaluationId}/auto-sessions/${sessionId}/stop`,
			{
				method: "POST",
				credentials: "include",
			},
		);
		if (!response.ok) {
			const { message } = await parseErrorResponse(response);
			setStartError(message);
			return;
		}
		setStatus((current) =>
			current
				? {
						...current,
						status: "cancelled",
						stopReason: "user_requested",
					}
				: current,
		);
		clearPollTimeout();
		await loadSessions();
		toast.success("Stopped auto run");
	}, [clearPollTimeout, evaluationId, loadSessions, sessionId]);

	const selectSession = useCallback((nextSessionId: string) => {
		setSessionId(nextSessionId);
		setJobId(null);
		setStatus(null);
	}, []);

	const isQueued = status?.status === "queued";
	const isRunning = status?.status === "running";
	const isTerminal = isTerminalStatus(status);
	const isIdle = !sessionId || status?.status === "idle";
	const isPolling = Boolean(sessionId && (isQueued || isRunning));
	const currentIteration = status?.currentIteration ?? 0;
	const maxIterations = status?.maxIterations ?? sessionConfig.maxIterations;
	const experiments = status?.experiments ?? [];
	const bestExperiment = status?.bestExperiment ?? null;

	return useMemo(
		() => ({
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
			isTerminal,
			currentIteration,
			maxIterations,
			experiments,
			bestExperiment,
			sessions,
			sessionsLoading,
			loadSessions,
			selectSession,
			createFieldErrors,
		}),
		[
			bestExperiment,
			createError,
			createFieldErrors,
			createSession,
			currentIteration,
			experiments,
			isIdle,
			isPolling,
			isQueued,
			isRunning,
			isTerminal,
			jobId,
			loadSessions,
			maxIterations,
			pollError,
			selectSession,
			sessionConfig,
			sessionId,
			sessions,
			sessionsLoading,
			startError,
			startRun,
			status,
			stopRun,
			updateSessionConfig,
		],
	);
}

export type { AutoSessionConfig, UseAutoExecutionStateReturn };
