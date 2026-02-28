/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegressionBadge } from "@/components/regression-badge";

describe("RegressionBadge", () => {
	it("should show idle state with 'Run Regression Check' text", () => {
		render(<RegressionBadge evaluationId={1} />);
		expect(screen.getByText("Run Regression Check")).toBeDefined();
	});

	it("should show passed state when initialStatus is passed", () => {
		render(<RegressionBadge evaluationId={1} initialStatus="passed" />);
		expect(screen.getByText(/Regression Passed/)).toBeDefined();
	});

	it("should show failed state when initialStatus is failed", () => {
		render(<RegressionBadge evaluationId={1} initialStatus="failed" />);
		expect(screen.getByText(/Regression Failed/)).toBeDefined();
	});

	it("should show running state after clicking run", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise(() => {})),
		);
		render(<RegressionBadge evaluationId={42} />);
		fireEvent.click(screen.getByText("Run Regression Check"));
		await waitFor(() => {
			expect(screen.getByText(/Checking/)).toBeDefined();
		});
	});

	it("should show passed with score after successful fetch", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ status: "passed", avgScore: 95 }),
			}),
		);
		render(<RegressionBadge evaluationId={42} />);
		fireEvent.click(screen.getByText("Run Regression Check"));
		await waitFor(() => {
			expect(screen.getByText(/Regression Passed/)).toBeDefined();
			expect(screen.getByText(/95%/)).toBeDefined();
		});
	});

	it("should show failed state on fetch error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("Network error")),
		);
		render(<RegressionBadge evaluationId={42} />);
		fireEvent.click(screen.getByText("Run Regression Check"));
		await waitFor(() => {
			expect(screen.getByText(/Regression Failed/)).toBeDefined();
		});
	});
});
