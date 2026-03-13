import type { DiscoverableSpec } from "@/lib/evalgate/discover-core";
import type { PersistedEvalgateArtifact } from "./evalgate-types";

export function mergeArtifacts(
	current: PersistedEvalgateArtifact[],
	incoming: PersistedEvalgateArtifact[],
	options?: { replaceRunId?: number },
) {
	const incomingIds = new Set(incoming.map((artifact) => artifact.id));
	return [
		...incoming,
		...current.filter((artifact) => {
			if (incomingIds.has(artifact.id)) {
				return false;
			}
			if (options?.replaceRunId !== undefined) {
				return artifact.evaluationRunId !== options.replaceRunId;
			}
			return true;
		}),
	].sort(
		(left, right) =>
			new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
	);
}

export function parseListInput(value: string): string[] | undefined {
	const items = value
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
	return items.length > 0 ? items : undefined;
}

export function parseOptionalIntegerInput(
	value: string,
	label: string,
	min: number,
	max: number,
): number | undefined {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	const parsed = Number(trimmed);
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
		throw new Error(`${label} must be an integer between ${min} and ${max}.`);
	}
	return parsed;
}

export function parseOptionalThresholdInput(value: string): number | undefined {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	const parsed = Number(trimmed);
	if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
		throw new Error("Threshold must be a number between 0 and 1.");
	}
	return parsed;
}

export function parseDiscoverableSpecsInput(value: string): DiscoverableSpec[] {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new Error("Spec inventory JSON is required.");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed) as unknown;
	} catch {
		throw new Error("Spec inventory must be valid JSON.");
	}

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error("Spec inventory must be a non-empty JSON array.");
	}

	return parsed.map((item, index) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) {
			throw new Error(`Spec ${index + 1} must be a JSON object.`);
		}

		const candidate = item as Record<string, unknown>;
		const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
		const name =
			typeof candidate.name === "string" ? candidate.name.trim() : "";
		const file =
			typeof candidate.file === "string" ? candidate.file.trim() : "";
		const complexity =
			typeof candidate.complexity === "string"
				? candidate.complexity.trim()
				: "medium";

		if (!id || !name || !file) {
			throw new Error(
				`Spec ${index + 1} requires string id, name, and file fields.`,
			);
		}

		if (!["simple", "medium", "complex"].includes(complexity)) {
			throw new Error(
				`Spec ${index + 1} complexity must be simple, medium, or complex.`,
			);
		}

		return {
			id,
			name,
			file,
			tags: Array.isArray(candidate.tags)
				? candidate.tags
						.filter((tag): tag is string => typeof tag === "string")
						.map((tag) => tag.trim())
						.filter((tag) => tag.length > 0)
				: [],
			hasAssertions: candidate.hasAssertions === true,
			usesModels: candidate.usesModels === true,
			usesTools: candidate.usesTools === true,
			complexity: complexity as DiscoverableSpec["complexity"],
			fingerprintText:
				typeof candidate.fingerprintText === "string" &&
				candidate.fingerprintText.trim().length > 0
					? candidate.fingerprintText.trim()
					: undefined,
		};
	});
}

export function formatArtifactKind(kind: PersistedEvalgateArtifact["kind"]) {
	return kind
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function formatArtifactSummaryValue(value: unknown) {
	if (typeof value === "number") {
		if (value >= 0 && value <= 1) {
			return `${Math.round(value * 100)}%`;
		}
		return `${value}`;
	}
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "boolean") {
		return value ? "Yes" : "No";
	}
	if (Array.isArray(value)) {
		return `${value.length} items`;
	}
	if (value && typeof value === "object") {
		return `${Object.keys(value as Record<string, unknown>).length} fields`;
	}
	return "n/a";
}

export function summarizeArtifact(summary: Record<string, unknown>) {
	return Object.entries(summary)
		.slice(0, 3)
		.map(
			([key, value]) =>
				`${key
					.replace(/([A-Z])/g, " $1")
					.replace(/_/g, " ")
					.trim()}: ${formatArtifactSummaryValue(value)}`,
		);
}
