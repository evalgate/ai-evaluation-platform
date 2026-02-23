import { describe, expect, it } from "vitest";
import { calculateQualityScore } from "@/lib/ai-quality-score";

describe("ai-quality-score (more)", () => {
  it("normalizes weights and keeps score in [0, 100]", () => {
    const stats = {
      totalEvaluations: 100,
      passedEvaluations: 95,
      failedEvaluations: 5,
      averageLatency: 150,
      averageCost: 0.05,
      averageScore: 88,
      consistencyScore: 0.92,
    };

    const result = calculateQualityScore(stats);

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(typeof result.overall).toBe("number");
  });
});
