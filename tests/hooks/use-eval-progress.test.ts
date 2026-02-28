/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEvalProgress } from "@/hooks/use-eval-progress";

describe("useEvalProgress", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should start in loading state", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise(() => {})),
		);
		const { result } = renderHook(() => useEvalProgress(1, 1));
		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBe(null);
	});

	it("should fetch progress and set data", async () => {
		const mockData = {
			runId: 1,
			status: "running",
			totalCases: 10,
			processedCount: 5,
			passedCases: 4,
			failedCases: 1,
			startedAt: "2026-01-01T00:00:00Z",
			completedAt: null,
			percentage: 50,
			heartbeat: { lastMessage: "Processing...", count: 5, entries: [] },
			estimatedTimeRemaining: 30,
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockData),
			}),
		);

		const { result } = renderHook(() =>
			useEvalProgress(1, 1, { refreshInterval: 10000 }),
		);
		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});
		expect(result.current.data?.status).toBe("running");
		expect(result.current.isRunning).toBe(true);
		expect(result.current.progress).toBe(50);
		expect(result.current.timeRemaining).toBe("30s");
	});

	it("should report isComplete for completed status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						runId: 1,
						status: "completed",
						totalCases: 10,
						processedCount: 10,
						passedCases: 10,
						failedCases: 0,
						startedAt: "2026-01-01T00:00:00Z",
						completedAt: "2026-01-01T00:01:00Z",
						percentage: 100,
						heartbeat: { lastMessage: "Done", count: 10, entries: [] },
						estimatedTimeRemaining: null,
					}),
			}),
		);

		const { result } = renderHook(() =>
			useEvalProgress(1, 1, { refreshInterval: 10000 }),
		);
		await waitFor(() => {
			expect(result.current.isComplete).toBe(true);
		});
		expect(result.current.progress).toBe(100);
	});

	it("should report hasFailed for failed status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						runId: 1,
						status: "failed",
						totalCases: 10,
						processedCount: 3,
						passedCases: 0,
						failedCases: 3,
						startedAt: "2026-01-01T00:00:00Z",
						completedAt: null,
						percentage: 30,
						heartbeat: { lastMessage: "Error", count: 3, entries: [] },
						estimatedTimeRemaining: null,
					}),
			}),
		);

		const { result } = renderHook(() =>
			useEvalProgress(1, 1, { refreshInterval: 10000 }),
		);
		await waitFor(() => {
			expect(result.current.hasFailed).toBe(true);
		});
	});

	it("should handle fetch errors", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("Network error")),
		);

		const onError = vi.fn();
		const { result } = renderHook(() =>
			useEvalProgress(1, 1, { refreshInterval: 10000, onError }),
		);
		await waitFor(() => {
			expect(result.current.error).not.toBe(null);
		});
		expect(onError).toHaveBeenCalled();
	});

	it("should format time remaining for minutes", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						runId: 1,
						status: "running",
						totalCases: 100,
						processedCount: 10,
						passedCases: 10,
						failedCases: 0,
						startedAt: "2026-01-01T00:00:00Z",
						completedAt: null,
						percentage: 10,
						heartbeat: { lastMessage: "Processing...", count: 10, entries: [] },
						estimatedTimeRemaining: 90,
					}),
			}),
		);

		const { result } = renderHook(() =>
			useEvalProgress(1, 1, { refreshInterval: 10000 }),
		);
		await waitFor(() => {
			expect(result.current.timeRemaining).toBe("1m 30s");
		});
	});
});
