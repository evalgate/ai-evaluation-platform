/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock sonner
vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import { GettingStartedWizard } from "@/components/getting-started-wizard";

describe("GettingStartedWizard", () => {
	it("should render the wizard heading", () => {
		render(<GettingStartedWizard />);
		expect(screen.getByText("Getting Started")).toBeDefined();
	});

	it("should show step 1 initially", () => {
		render(<GettingStartedWizard />);
		expect(screen.getByText("Install SDK")).toBeDefined();
		expect(screen.getByText("Add our SDK to your project")).toBeDefined();
	});

	it("should show 'Next Step' button on first step", () => {
		render(<GettingStartedWizard />);
		expect(screen.getByText("Next Step")).toBeDefined();
	});

	it("should advance to step 2 when clicking Next Step", () => {
		// Mock clipboard
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
		render(<GettingStartedWizard />);
		fireEvent.click(screen.getByText("Next Step"));
		expect(screen.getByText("Set Environment Variables")).toBeDefined();
		expect(screen.getByText("Back")).toBeDefined();
	});

	it("should go back when clicking Back", () => {
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
		render(<GettingStartedWizard />);
		fireEvent.click(screen.getByText("Next Step"));
		fireEvent.click(screen.getByText("Back"));
		expect(screen.getByText("Install SDK")).toBeDefined();
	});

	it("should show Finish on last step", () => {
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
		render(<GettingStartedWizard />);
		fireEvent.click(screen.getByText("Next Step"));
		fireEvent.click(screen.getByText("Next Step"));
		expect(screen.getByText("Finish")).toBeDefined();
	});

	it("should show completion message after all steps", () => {
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
		const onComplete = vi.fn();
		render(<GettingStartedWizard onComplete={onComplete} />);
		fireEvent.click(screen.getByText("Next Step"));
		fireEvent.click(screen.getByText("Next Step"));
		fireEvent.click(screen.getByText("Finish"));
		expect(screen.getByText(/Congratulations/)).toBeDefined();
		expect(onComplete).toHaveBeenCalled();
	});

	it("should include API key in step 2 code when provided", () => {
		render(<GettingStartedWizard apiKey="test-key-123" />);
		fireEvent.click(screen.getByText("Next Step"));
		expect(screen.getByText(/test-key-123/)).toBeDefined();
	});
});
