/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock the QualityScore type import
vi.mock("@/lib/ai-quality-score", () => ({}));

import { AIQualityScoreCard } from "@/components/ai-quality-score-card";
import type { QualityScore } from "@/lib/ai-quality-score";

const baseScore: QualityScore = {
	overall: 85,
	grade: "A",
	trend: 5,
	metrics: {
		accuracy: 90,
		safety: 95,
		latency: 80,
		cost: 75,
		consistency: 88,
	},
	insights: ["High accuracy across all test cases"],
	recommendations: ["Consider optimizing latency"],
};

describe("AIQualityScoreCard", () => {
	it("should render overall score and grade", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("85")).toBeDefined();
		expect(screen.getByText("A")).toBeDefined();
	});

	it("should render the title", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("AI Quality Score")).toBeDefined();
	});

	it("should render all metric labels", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("Accuracy")).toBeDefined();
		expect(screen.getByText("Safety")).toBeDefined();
		expect(screen.getByText("Latency")).toBeDefined();
		expect(screen.getByText("Cost")).toBeDefined();
		expect(screen.getByText("Consistency")).toBeDefined();
	});

	it("should render trend indicator for positive trend", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("+5%")).toBeDefined();
	});

	it("should render insights section", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("Key Insights")).toBeDefined();
	});

	it("should render recommendations section", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.getByText("Recommendations")).toBeDefined();
		expect(screen.getByText("Consider optimizing latency")).toBeDefined();
	});

	it("should render share button when showShare is true", () => {
		const onShare = vi.fn();
		render(
			<AIQualityScoreCard score={baseScore} showShare onShare={onShare} />,
		);
		expect(screen.getByText("Share")).toBeDefined();
	});

	it("should not render share button by default", () => {
		render(<AIQualityScoreCard score={baseScore} />);
		expect(screen.queryByText("Share")).toBe(null);
	});

	it("should not render trend when trend is 0", () => {
		const zeroTrend: QualityScore = { ...baseScore, trend: 0 };
		render(<AIQualityScoreCard score={zeroTrend} />);
		expect(screen.queryByText("+0%")).toBe(null);
		expect(screen.queryByText("0%")).toBe(null);
	});
});
