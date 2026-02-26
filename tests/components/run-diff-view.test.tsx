/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunDiffView } from "@/components/run-diff-view";

describe("RunDiffView", () => {
  it("should show loading state initially", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<RunDiffView evaluationId="1" runId={2} compareRunId={1} />);
    expect(screen.getByText(/Loading diff/)).toBeDefined();
  });

  it("should show error on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    render(<RunDiffView evaluationId="1" runId={2} compareRunId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/Diff error/)).toBeDefined();
    });
  });

  it("should show 'No failing cases' when all pass", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ testCaseId: 1, status: "passed", output: "ok" }],
            baselineResults: [{ testCaseId: 1, status: "passed", output: "ok" }],
          }),
      }),
    );
    render(<RunDiffView evaluationId="1" runId={2} compareRunId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/No failing cases/)).toBeDefined();
    });
  });

  it("should render diff table for failed cases", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                testCaseId: 1,
                status: "failed",
                output: "wrong",
                test_cases: { name: "Case A", expectedOutput: "right" },
              },
            ],
            baselineResults: [{ testCaseId: 1, status: "passed", output: "right" }],
          }),
      }),
    );
    render(<RunDiffView evaluationId="1" runId={2} compareRunId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Case A")).toBeDefined();
      // "right" appears in both Expected and Baseline columns
      expect(screen.getAllByText("right").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("wrong")).toBeDefined();
    });
  });
});
