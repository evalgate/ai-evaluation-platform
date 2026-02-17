/**
 * Z-score drift detection utilities.
 */

/**
 * Compute z-score for a value given population mean and standard deviation.
 */
export function zScore(latest: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (latest - mean) / std;
}

/**
 * Compute mean and standard deviation from an array of numbers.
 */
export function meanAndStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  return { mean, std };
}
