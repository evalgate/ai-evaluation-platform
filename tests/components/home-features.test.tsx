/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeFeatures } from "@/components/home-features";

describe("HomeFeatures", () => {
	it("should render the section heading", () => {
		render(<HomeFeatures />);
		expect(
			screen.getByText("Everything You Need to Evaluate AI"),
		).toBeDefined();
	});

	it("should render all four feature cards", () => {
		render(<HomeFeatures />);
		expect(screen.getByText("Unit Testing")).toBeDefined();
		expect(screen.getByText("Human Evaluation")).toBeDefined();
		expect(screen.getByText("LLM Judge")).toBeDefined();
		expect(screen.getByText("Observability")).toBeDefined();
	});

	it("should render feature descriptions", () => {
		render(<HomeFeatures />);
		expect(screen.getByText(/Automated assertions/)).toBeDefined();
		expect(screen.getByText(/expert feedback/)).toBeDefined();
		expect(screen.getByText(/Model-as-a-judge/)).toBeDefined();
		expect(screen.getByText(/Real-time tracing/)).toBeDefined();
	});
});
