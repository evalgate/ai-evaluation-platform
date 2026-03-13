export interface DiscoverableSpec {
	id: string;
	name: string;
	file: string;
	tags: string[];
	hasAssertions: boolean;
	usesModels: boolean;
	usesTools: boolean;
	complexity: "simple" | "medium" | "complex";
	fingerprintText?: string;
}

export interface RedundantSpecPair {
	leftSpecId: string;
	leftName: string;
	rightSpecId: string;
	rightName: string;
	similarity: number;
}

export interface DiversityStats {
	score: number;
	averageNearestNeighborSimilarity: number;
	redundantPairs: RedundantSpecPair[];
	threshold: number;
}

const DEFAULT_DIVERSITY_THRESHOLD = 0.55;

const DIVERSITY_STOP_WORDS = new Set([
	"the",
	"and",
	"for",
	"with",
	"that",
	"this",
	"from",
	"into",
	"your",
	"have",
	"should",
	"would",
	"could",
	"about",
	"uses",
	"using",
	"spec",
	"eval",
	"test",
	"case",
	"name",
	"file",
	"description",
]);

function tokenizeDiversityText(text: string): string[] {
	return text
		.toLowerCase()
		.split(/\W+/)
		.map((token) => token.trim())
		.filter((token) => token.length > 2 && !DIVERSITY_STOP_WORDS.has(token));
}

function diversityTokenSet(text: string): Set<string> {
	return new Set(tokenizeDiversityText(text));
}

function diversityJaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) {
		return 1;
	}
	if (a.size === 0 || b.size === 0) {
		return 0;
	}

	let intersection = 0;
	for (const token of a) {
		if (b.has(token)) {
			intersection++;
		}
	}

	return intersection / (a.size + b.size - intersection);
}

function buildFallbackFingerprint(spec: DiscoverableSpec): string {
	return [
		spec.name,
		spec.file,
		spec.tags.join(" "),
		spec.complexity,
		spec.usesModels ? "model" : "",
		spec.usesTools ? "tool" : "",
		spec.hasAssertions ? "assertion" : "",
	]
		.filter((value) => value.length > 0)
		.join(" ");
}

export function calculateDiversityStats(
	specs: DiscoverableSpec[],
	threshold = DEFAULT_DIVERSITY_THRESHOLD,
): DiversityStats {
	if (specs.length === 0) {
		return {
			score: 0,
			averageNearestNeighborSimilarity: 0,
			redundantPairs: [],
			threshold,
		};
	}

	if (specs.length === 1) {
		return {
			score: 100,
			averageNearestNeighborSimilarity: 0,
			redundantPairs: [],
			threshold,
		};
	}

	const fingerprints = specs.map((spec) =>
		diversityTokenSet(spec.fingerprintText ?? buildFallbackFingerprint(spec)),
	);
	const redundantPairs: RedundantSpecPair[] = [];
	const nearestSimilarities = new Array(specs.length).fill(0);

	for (let i = 0; i < specs.length; i++) {
		for (let j = i + 1; j < specs.length; j++) {
			const similarity = diversityJaccard(fingerprints[i]!, fingerprints[j]!);
			nearestSimilarities[i] = Math.max(nearestSimilarities[i]!, similarity);
			nearestSimilarities[j] = Math.max(nearestSimilarities[j]!, similarity);
			if (similarity >= threshold) {
				redundantPairs.push({
					leftSpecId: specs[i]?.id,
					leftName: specs[i]?.name,
					rightSpecId: specs[j]?.id,
					rightName: specs[j]?.name,
					similarity,
				});
			}
		}
	}

	const averageNearestNeighborSimilarity =
		nearestSimilarities.reduce((total, value) => total + value, 0) /
		specs.length;

	return {
		score: Math.max(
			0,
			Math.round((1 - averageNearestNeighborSimilarity) * 100),
		),
		averageNearestNeighborSimilarity,
		redundantPairs: redundantPairs
			.sort(
				(a, b) =>
					b.similarity - a.similarity ||
					a.leftSpecId.localeCompare(b.leftSpecId) ||
					a.rightSpecId.localeCompare(b.rightSpecId),
			)
			.slice(0, 5),
		threshold,
	};
}
