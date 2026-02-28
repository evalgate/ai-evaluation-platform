/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock error handling utility
vi.mock("@/lib/utils/error-handling", () => ({
	handleError: vi.fn((e: unknown) =>
		e instanceof Error ? e.message : String(e),
	),
}));

import { ShadowEvalButton } from "@/components/shadow-eval-button";

describe("ShadowEvalButton", () => {
	it("should render idle state with 'Run against Production Logs'", () => {
		render(<ShadowEvalButton evaluationId={1} />);
		expect(screen.getByText(/Run against Production Logs/)).toBeDefined();
	});

	it("should be disabled when disabled prop is true", () => {
		render(<ShadowEvalButton evaluationId={1} disabled />);
		const button = screen.getByRole("button");
		expect(button).toHaveProperty("disabled", true);
	});

	it("should show running state after click", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise(() => {})),
		);
		render(<ShadowEvalButton evaluationId={1} />);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => {
			expect(screen.getByText(/Running Shadow Eval/)).toBeDefined();
		});
	});

	it("should show matched count on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ matched: 8, total: 10 }),
			}),
		);
		render(<ShadowEvalButton evaluationId={1} />);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => {
			expect(screen.getByText("8/10 matched")).toBeDefined();
		});
	});

	it("should show error state on failure", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ error: "Not found" }),
			}),
		);
		render(<ShadowEvalButton evaluationId={1} />);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => {
			expect(screen.getByText(/Not found|Failed/)).toBeDefined();
		});
	});
});
