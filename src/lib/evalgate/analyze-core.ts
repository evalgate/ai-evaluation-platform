export type LabeledOutcome = "pass" | "fail";

export interface LabeledGoldenCase {
	caseId: string;
	input: string;
	expected: string;
	actual: string;
	label: LabeledOutcome;
	failureMode: string | null;
	labeledAt: string;
}

export interface FailureModeSummary {
	mode: string;
	count: number;
	frequency: number;
}

export interface AnalyzeSummary {
	total: number;
	failed: number;
	passRate: number;
	failureModes: FailureModeSummary[];
}

function isIsoTimestamp(value: string): boolean {
	return Number.isFinite(Date.parse(value));
}

export function parseLabeledDataset(content: string): LabeledGoldenCase[] {
	const rows = content
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	return rows.map((line, index) => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(line) as unknown;
		} catch {
			throw new Error(
				`Invalid JSONL at line ${index + 1}: expected valid JSON object`,
			);
		}

		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error(
				`Invalid JSONL at line ${index + 1}: expected JSON object record`,
			);
		}

		const record = parsed as Record<string, unknown>;
		const caseId = record.caseId;
		const input = record.input;
		const expected = record.expected;
		const actual = record.actual;
		const label = record.label;
		const failureMode = record.failureMode;
		const labeledAt = record.labeledAt;

		if (typeof caseId !== "string" || caseId.trim().length === 0) {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: caseId must be a non-empty string`,
			);
		}
		if (typeof input !== "string") {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: input must be a string`,
			);
		}
		if (typeof expected !== "string") {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: expected must be a string`,
			);
		}
		if (typeof actual !== "string") {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: actual must be a string`,
			);
		}
		if (label !== "pass" && label !== "fail") {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: label must be "pass" or "fail"`,
			);
		}
		if (!(typeof failureMode === "string" || failureMode === null)) {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: failureMode must be string or null`,
			);
		}
		if (label === "fail" && (!failureMode || failureMode.trim().length === 0)) {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: failed rows require a non-empty failureMode`,
			);
		}
		if (
			label === "pass" &&
			typeof failureMode === "string" &&
			failureMode.trim().length > 0
		) {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: passing rows must set failureMode to null or empty string`,
			);
		}
		if (typeof labeledAt !== "string" || !isIsoTimestamp(labeledAt)) {
			throw new Error(
				`Invalid labeled dataset at line ${index + 1}: labeledAt must be an ISO timestamp string`,
			);
		}

		return {
			caseId,
			input,
			expected,
			actual,
			label,
			failureMode,
			labeledAt,
		};
	});
}

function classifyFailureMode(item: LabeledGoldenCase): string {
	if (item.failureMode && item.failureMode.trim().length > 0) {
		return item.failureMode.trim();
	}
	return "failed_without_mode";
}

export function analyzeLabeledDataset(
	rows: LabeledGoldenCase[],
	top = 5,
): AnalyzeSummary {
	const total = rows.length;
	const failedItems = rows.filter((row) => row.label === "fail");
	const failed = failedItems.length;
	const passRate = total > 0 ? (total - failed) / total : 0;

	const counts = new Map<string, number>();
	for (const item of failedItems) {
		const mode = classifyFailureMode(item);
		counts.set(mode, (counts.get(mode) ?? 0) + 1);
	}

	const failureModes = [...counts.entries()]
		.map(([mode, count]) => ({
			mode,
			count,
			frequency: failed > 0 ? count / failed : 0,
		}))
		.sort((a, b) => b.count - a.count || a.mode.localeCompare(b.mode))
		.slice(0, Math.max(1, top));

	return { total, failed, passRate, failureModes };
}
