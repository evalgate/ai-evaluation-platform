/**
 * Sliding-window rate limiter for the analysis queue.
 *
 * Prevents production traffic spikes from overwhelming the failure analysis
 * pipeline. Uses an in-memory sliding window counter per organization.
 *
 * When the rate is exceeded, traces are silently dropped from analysis
 * (they are still ingested — only the analysis job enqueue is skipped).
 */

export interface RateLimiterConfig {
	/** Max traces per window that can be enqueued for analysis */
	maxPerWindow: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
	maxPerWindow: Number(process.env.MAX_ANALYSIS_RATE ?? 200),
	windowMs: 60_000, // 1 minute
};

/** Per-org sliding window state */
interface WindowState {
	timestamps: number[];
}

const windows = new Map<number, WindowState>();

/**
 * Check if an analysis job can be enqueued for the given org.
 * Returns true if under the rate limit, false if exceeded.
 */
export function canEnqueueAnalysis(
	organizationId: number,
	config: RateLimiterConfig = DEFAULT_CONFIG,
	now: number = Date.now(),
): boolean {
	let state = windows.get(organizationId);
	if (!state) {
		state = { timestamps: [] };
		windows.set(organizationId, state);
	}

	// Evict timestamps outside the window
	const cutoff = now - config.windowMs;
	state.timestamps = state.timestamps.filter((t) => t > cutoff);

	// Check limit
	if (state.timestamps.length >= config.maxPerWindow) {
		return false;
	}

	// Record this enqueue
	state.timestamps.push(now);
	return true;
}

/**
 * Get current usage for an org (for observability / doctor command).
 */
export function getAnalysisRate(
	organizationId: number,
	config: RateLimiterConfig = DEFAULT_CONFIG,
	now: number = Date.now(),
): { current: number; max: number; windowMs: number } {
	const state = windows.get(organizationId);
	if (!state) {
		return { current: 0, max: config.maxPerWindow, windowMs: config.windowMs };
	}

	const cutoff = now - config.windowMs;
	const current = state.timestamps.filter((t) => t > cutoff).length;
	return { current, max: config.maxPerWindow, windowMs: config.windowMs };
}

/**
 * Reset state for a specific org (for testing).
 */
export function resetRateLimiter(organizationId?: number): void {
	if (organizationId != null) {
		windows.delete(organizationId);
	} else {
		windows.clear();
	}
}
