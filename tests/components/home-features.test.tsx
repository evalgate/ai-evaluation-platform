/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeFeatures } from "@/components/home-features";

describe("HomeFeatures", () => {
	it("should render the section heading", () => {
		render(<HomeFeatures />);
		expect(screen.getByText("AI Quality Infrastructure")).toBeDefined();
	});

	it("should render all six feature cards", () => {
		render(<HomeFeatures />);
		expect(screen.getByText("AI Reliability Loop")).toBeDefined();
		expect(screen.getByText("CI Regression Gate")).toBeDefined();
		expect(screen.getByText("Production Tracing")).toBeDefined();
		expect(screen.getByText("LLM Judge")).toBeDefined();
		expect(screen.getByText("Human Evaluation")).toBeDefined();
		expect(screen.getByText("Observability")).toBeDefined();
	});

	it("should render feature descriptions", () => {
		render(<HomeFeatures />);
		expect(screen.getByText(/Production failures automatically/)).toBeDefined();
		expect(screen.getByText(/expert feedback/)).toBeDefined();
		expect(screen.getByText(/Model-as-a-judge/)).toBeDefined();
		expect(screen.getByText(/Real-time tracing/)).toBeDefined();
	});
});
