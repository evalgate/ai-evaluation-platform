/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock sonner
vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import { EmailCaptureWidget } from "@/components/email-capture-widget";

describe("EmailCaptureWidget", () => {
	it("should render the form with email input and submit button", () => {
		render(<EmailCaptureWidget />);
		expect(screen.getByPlaceholderText("your@email.com")).toBeDefined();
		expect(screen.getByText("Get Results")).toBeDefined();
	});

	it("should render the heading", () => {
		render(<EmailCaptureWidget />);
		expect(
			screen.getByText("Want these results emailed to you?"),
		).toBeDefined();
	});

	it("should render benefit items", () => {
		render(<EmailCaptureWidget />);
		expect(screen.getByText("Your Results")).toBeDefined();
		expect(screen.getByText("Weekly Templates")).toBeDefined();
		expect(screen.getByText("Quality Tips")).toBeDefined();
	});

	it("should render trust signals", () => {
		render(<EmailCaptureWidget />);
		expect(screen.getByText("No spam")).toBeDefined();
		expect(screen.getByText("100% free")).toBeDefined();
	});

	it("should show success state after successful submit", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }),
		);
		render(<EmailCaptureWidget />);
		fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
			target: { value: "test@example.com" },
		});
		fireEvent.click(screen.getByText("Get Results"));
		await waitFor(() => {
			expect(screen.getByText(/You're all set/)).toBeDefined();
		});
	});

	it("should have required and type=email on input for validation", () => {
		render(<EmailCaptureWidget />);
		const input = screen.getByPlaceholderText("your@email.com");
		expect(input.getAttribute("type")).toBe("email");
		expect(input.hasAttribute("required")).toBe(true);
	});
});
