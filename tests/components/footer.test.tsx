/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/footer";

describe("Footer", () => {
	it("should render all section headings", () => {
		render(<Footer />);
		expect(screen.getByText("Product")).toBeDefined();
		expect(screen.getByText("Developers")).toBeDefined();
		expect(screen.getByText("Community")).toBeDefined();
		expect(screen.getByText("Legal")).toBeDefined();
	});

	it("should render product links", () => {
		render(<Footer />);
		expect(screen.getByText("Evaluations")).toBeDefined();
		expect(screen.getByText("Traces")).toBeDefined();
		expect(screen.getByText("LLM Judge")).toBeDefined();
		expect(screen.getByText("Pricing")).toBeDefined();
	});

	it("should render developer links", () => {
		render(<Footer />);
		expect(screen.getByText("SDK")).toBeDefined();
		expect(screen.getByText("API Reference")).toBeDefined();
		expect(screen.getByText("Documentation")).toBeDefined();
		expect(screen.getByText("GitHub")).toBeDefined();
	});

	it("should render copyright text", () => {
		render(<Footer />);
		const year = new Date().getFullYear().toString();
		expect(screen.getByText(new RegExp(year))).toBeDefined();
		expect(screen.getByText(/All rights reserved/)).toBeDefined();
	});
});
