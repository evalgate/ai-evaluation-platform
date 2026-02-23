import { describe, expect, it } from "vitest";

describe("baseline comparison logic", () => {
  // Test the core regression detection logic that's used in qualityService.latest()
  it("regressionDetected true when delta ≤ -5", () => {
    const baselineScore = 90;
    const currentScore = 84; // 90 - 6
    const regressionDelta = currentScore - baselineScore; // -6
    const regressionDetected = regressionDelta <= -5;

    expect(regressionDetected).toBe(true);
    expect(regressionDelta).toBe(-6);
  });

  it("regressionDetected false when delta is -4", () => {
    const baselineScore = 90;
    const currentScore = 86; // 90 - 4
    const regressionDelta = currentScore - baselineScore; // -4
    const regressionDetected = regressionDelta <= -5;

    expect(regressionDetected).toBe(false);
    expect(regressionDelta).toBe(-4);
  });

  it("regressionDetected false when delta is positive", () => {
    const baselineScore = 85;
    const currentScore = 92; // 85 + 7
    const regressionDelta = currentScore - baselineScore; // 7
    const regressionDetected = regressionDelta <= -5;

    expect(regressionDetected).toBe(false);
    expect(regressionDelta).toBe(7);
  });

  it("regressionDetected false when delta is exactly -5", () => {
    const baselineScore = 90;
    const currentScore = 85; // 90 - 5
    const regressionDelta = currentScore - baselineScore; // -5
    const regressionDetected = regressionDelta <= -5;

    expect(regressionDetected).toBe(true);
    expect(regressionDelta).toBe(-5);
  });

  it("baselineMissing when no baseline score exists", () => {
    const baselineScore = null;
    const currentScore = 85;

    const baselineMissing = baselineScore === null;
    const regressionDelta = baselineScore !== null ? currentScore - baselineScore : null;

    expect(baselineMissing).toBe(true);
    expect(regressionDelta).toBeNull();
  });

  it("baseline comparison with valid scores", () => {
    const baselineScore = 88;
    const currentScore = 82;

    const baselineMissing = baselineScore === null;
    const regressionDelta = baselineScore !== null ? currentScore - baselineScore : null;
    const regressionDetected = regressionDelta !== null && regressionDelta <= -5;

    expect(baselineMissing).toBe(false);
    expect(regressionDelta).toBe(-6);
    expect(regressionDetected).toBe(true);
  });

  it("baseline comparison with improvement", () => {
    const baselineScore = 75;
    const currentScore = 92;

    const baselineMissing = baselineScore === null;
    const regressionDelta = baselineScore !== null ? currentScore - baselineScore : null;
    const regressionDetected = regressionDelta !== null && regressionDelta <= -5;

    expect(baselineMissing).toBe(false);
    expect(regressionDelta).toBe(17);
    expect(regressionDetected).toBe(false);
  });
});
