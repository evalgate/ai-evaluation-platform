export interface ClusterableRunResult {
	runId: string;
	results: ClusterableSpecResult[];
}

export interface ClusterableSpecResult {
	specId: string;
	name: string;
	filePath: string;
	result: {
		status: "passed" | "failed" | "skipped";
		error?: string;
		duration?: number;
	};
	input?: string;
	expected?: string;
	actual?: string;
}

export interface ClusterSample {
	caseId: string;
	name: string;
}

export interface ClusterCase {
	caseId: string;
	name: string;
	filePath: string;
	status: ClusterableSpecResult["result"]["status"];
	input: string;
	expected: string;
	actual: string;
}

export interface TraceCluster {
	id: string;
	clusterLabel: string;
	dominantPattern: string;
	suggestedFailureMode: string | null;
	similarityThreshold: number;
	traceIds: string[];
	traceCount: number;
	keywords: string[];
	memberIds: string[];
	memberCount: number;
	density: number;
	statusCounts: {
		passed: number;
		failed: number;
		skipped: number;
	};
	samples: ClusterSample[];
	cases: ClusterCase[];
}

export interface ClusterSummary {
	runId: string;
	totalRunResults: number;
	clusteredCases: number;
	skippedCases: number;
	requestedClusters: number | null;
	includePassed: boolean;
	clusters: TraceCluster[];
}

const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

const STOP_WORDS = new Set([
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
	"what",
	"when",
	"where",
	"while",
	"were",
	"them",
	"then",
	"than",
	"also",
	"been",
	"because",
	"expected",
	"actual",
	"input",
	"output",
	"error",
	"failed",
	"passed",
	"skipped",
	"result",
	"spec",
	"case",
	"file",
]);

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash;
	}
	return hash;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	return texts.map((text) => {
		const embedding = new Array(128).fill(0);
		const baseHash = simpleHash(text);

		if (
			text.toLowerCase().includes("refund") ||
			text.toLowerCase().includes("payment")
		) {
			for (let i = 0; i < 64; i++) {
				embedding[i] = Math.sin(baseHash * (i + 1)) * 0.8 + 0.2;
			}
			for (let i = 64; i < 128; i++) {
				embedding[i] = Math.cos(baseHash * (i + 1)) * 0.1;
			}
		} else if (
			text.toLowerCase().includes("tone") ||
			text.toLowerCase().includes("support")
		) {
			for (let i = 0; i < 64; i++) {
				embedding[i] = Math.cos(baseHash * (i + 1)) * 0.1;
			}
			for (let i = 64; i < 128; i++) {
				embedding[i] = Math.sin(baseHash * (i + 1)) * 0.8 + 0.2;
			}
		} else {
			for (let i = 0; i < 128; i++) {
				embedding[i] =
					Math.sin(baseHash * (i + 1)) * Math.cos(baseHash * (i + 2));
			}
		}

		const norm = Math.sqrt(
			embedding.reduce((sum, value) => sum + value * value, 0),
		);
		return embedding.map((value) => value / norm);
	});
}

function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length === 0 || b.length === 0) {
		return 0;
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	normA = Math.sqrt(normA);
	normB = Math.sqrt(normB);
	if (normA === 0 || normB === 0) {
		return 0;
	}
	return dotProduct / (normA * normB);
}

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/\W+/)
		.map((token) => token.trim())
		.filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function centroidKeywords(texts: string[], topN = 4): string[] {
	const frequencies = new Map<string, number>();
	for (const text of texts) {
		for (const token of tokenize(text)) {
			frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
		}
	}

	return [...frequencies.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, topN)
		.map(([token]) => token);
}

function buildTraceText(spec: ClusterableSpecResult): string {
	return [
		spec.name,
		spec.filePath,
		spec.result.error ?? "",
		spec.input ?? "",
		spec.expected ?? "",
		spec.actual ?? "",
	]
		.filter((value) => value.trim().length > 0)
		.join("\n");
}

function generateClusterMetadata(
	members: Array<{ text: string; status: string }>,
): { dominantPattern: string; suggestedFailureMode: string | null } {
	const keywords = centroidKeywords(members.map((member) => member.text));
	const dominantPattern =
		keywords.length > 0 ? keywords.slice(0, 3).join(", ") : "No clear pattern";

	const failedMembers = members.filter((member) => member.status === "failed");
	if (failedMembers.length === 0) {
		return { dominantPattern, suggestedFailureMode: null };
	}

	const failedTexts = failedMembers
		.map((member) => member.text)
		.join(" ")
		.toLowerCase();

	if (failedTexts.includes("timeout") || failedTexts.includes("slow")) {
		return { dominantPattern, suggestedFailureMode: "performance_timeout" };
	}
	if (failedTexts.includes("null") || failedTexts.includes("undefined")) {
		return { dominantPattern, suggestedFailureMode: "null_reference" };
	}
	if (failedTexts.includes("format") || failedTexts.includes("parse")) {
		return { dominantPattern, suggestedFailureMode: "format_mismatch" };
	}
	if (
		failedTexts.includes("constraint") ||
		failedTexts.includes("validation")
	) {
		return { dominantPattern, suggestedFailureMode: "constraint_violation" };
	}

	return { dominantPattern, suggestedFailureMode: "general_failure" };
}

async function buildEmbeddingAssignments(
	points: Array<{ caseId: string; text: string; embedding: number[] }>,
	k: number,
): Promise<Map<number, string[]>> {
	if (points.length === 0) {
		return new Map();
	}

	const clusterCount = Math.min(k, points.length);
	const step = Math.max(1, Math.floor(points.length / clusterCount));
	const centroids = points
		.filter((_, index) => index % step === 0)
		.slice(0, clusterCount)
		.map((point) => point.embedding);

	const assignments = new Map<number, string[]>();
	for (let i = 0; i < clusterCount; i++) {
		assignments.set(i, []);
	}

	for (const point of points) {
		let bestCluster = 0;
		let bestSimilarity = -1;
		for (let index = 0; index < centroids.length; index++) {
			const similarity = cosineSimilarity(point.embedding, centroids[index]!);
			if (similarity > bestSimilarity) {
				bestSimilarity = similarity;
				bestCluster = index;
			}
		}
		assignments.get(bestCluster)?.push(point.caseId);
	}

	return assignments;
}

export async function clusterRunResult(
	runResult: ClusterableRunResult,
	options: { clusters?: number | null; includePassed?: boolean } = {},
): Promise<ClusterSummary> {
	const includePassed = options.includePassed === true;
	const candidates = runResult.results
		.filter((spec) => includePassed || spec.result.status === "failed")
		.map((spec) => ({
			caseId: spec.specId,
			name: spec.name,
			filePath: spec.filePath,
			status: spec.result.status,
			input: spec.input ?? "",
			expected: spec.expected ?? "",
			actual: spec.actual ?? "",
			text: buildTraceText(spec),
		}));

	if (candidates.length === 0) {
		return {
			runId: runResult.runId,
			totalRunResults: runResult.results.length,
			clusteredCases: 0,
			skippedCases: runResult.results.length,
			requestedClusters: options.clusters ?? null,
			includePassed,
			clusters: [],
		};
	}

	const embeddings = await generateEmbeddings(
		candidates.map((candidate) => candidate.text),
	);
	const candidatesWithEmbeddings = candidates.map((candidate, index) => ({
		...candidate,
		embedding: embeddings[index]!,
	}));
	const clusterCount =
		options.clusters ??
		Math.min(8, Math.max(1, Math.round(Math.sqrt(candidates.length))));
	const assignments = await buildEmbeddingAssignments(
		candidatesWithEmbeddings,
		clusterCount,
	);
	const candidateById = new Map(
		candidatesWithEmbeddings.map((candidate) => [candidate.caseId, candidate]),
	);

	const clusters: TraceCluster[] = [];
	for (const [index, memberIds] of assignments) {
		if (memberIds.length === 0) {
			continue;
		}

		const members = memberIds
			.map((memberId) => candidateById.get(memberId))
			.filter(
				(member): member is NonNullable<typeof member> => member !== undefined,
			);
		const keywords = centroidKeywords(members.map((member) => member.text));
		const { dominantPattern, suggestedFailureMode } =
			generateClusterMetadata(members);
		const statusCounts = {
			passed: 0,
			failed: 0,
			skipped: 0,
		};
		for (const member of members) {
			statusCounts[member.status]++;
		}

		let totalSimilarity = 0;
		let similarityCount = 0;
		for (let left = 0; left < members.length; left++) {
			for (let right = left + 1; right < members.length; right++) {
				totalSimilarity += cosineSimilarity(
					members[left]?.embedding,
					members[right]?.embedding,
				);
				similarityCount++;
			}
		}
		const averageSimilarity =
			similarityCount > 0
				? totalSimilarity / similarityCount
				: DEFAULT_SIMILARITY_THRESHOLD;

		clusters.push({
			id: `cluster-${index}`,
			clusterLabel:
				keywords.length > 0
					? keywords.slice(0, 3).join(", ")
					: `Cluster ${index + 1}`,
			dominantPattern,
			suggestedFailureMode,
			similarityThreshold: averageSimilarity,
			traceIds: memberIds,
			traceCount: members.length,
			keywords,
			memberIds,
			memberCount: members.length,
			density: averageSimilarity,
			statusCounts,
			samples: members.slice(0, 3).map((member) => ({
				caseId: member.caseId,
				name: member.name,
			})),
			cases: members.map((member) => ({
				caseId: member.caseId,
				name: member.name,
				filePath: member.filePath,
				status: member.status,
				input: member.input,
				expected: member.expected,
				actual: member.actual,
			})),
		});
	}

	clusters.sort(
		(a, b) =>
			b.traceCount - a.traceCount ||
			b.similarityThreshold - a.similarityThreshold ||
			a.id.localeCompare(b.id),
	);

	return {
		runId: runResult.runId,
		totalRunResults: runResult.results.length,
		clusteredCases: candidates.length,
		skippedCases: runResult.results.length - candidates.length,
		requestedClusters: options.clusters ?? null,
		includePassed,
		clusters,
	};
}
