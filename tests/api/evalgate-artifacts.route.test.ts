import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgRole } from "@/lib/permissions";

const h = vi.hoisted(() => ({
	role: "member" as OrgRole,
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			return (handler as (...args: never[]) => unknown)(
				req,
				{
					userId: "test-user",
					organizationId: 1,
					role: h.role,
					scopes: ["eval:read", "eval:write"],
					authType: "session",
				},
				params,
			);
		};
	},
}));

import { POST as ACCEPT_POST } from "@/app/api/evaluations/[id]/artifacts/[artifactId]/accept/route";
import { DELETE as ARTIFACT_DELETE } from "@/app/api/evaluations/[id]/artifacts/[artifactId]/route";
import { GET, POST } from "@/app/api/evaluations/[id]/artifacts/route";
import { db } from "@/db";
import { evalgateArtifacts, evaluations, testCases } from "@/db/schema";

const labeledDatasetContent = [
	JSON.stringify({
		caseId: "case-1",
		input: "Ask the tool for weather in Boston",
		expected: "Return the weather summary",
		actual: "Tool call failed with a timeout",
		label: "fail",
		failureMode: "tool_failure",
		labeledAt: "2026-03-12T00:00:00.000Z",
	}),
	JSON.stringify({
		caseId: "case-2",
		input: "Greet the user",
		expected: "Say hello",
		actual: "Say hello",
		label: "pass",
		failureMode: null,
		labeledAt: "2026-03-12T00:01:00.000Z",
	}),
].join("\n");

const diversitySpecs = [
	{
		id: "spec-1",
		name: "Tool fallback coverage",
		file: "evals/tool-fallback.test.ts",
		tags: ["smoke", "tool"],
		hasAssertions: true,
		usesModels: true,
		usesTools: true,
		complexity: "medium" as const,
		fingerprintText: "tool fallback timeout retry recovery",
	},
	{
		id: "spec-2",
		name: "Tool timeout overlap",
		file: "evals/tool-timeout.test.ts",
		tags: ["smoke", "tool"],
		hasAssertions: true,
		usesModels: true,
		usesTools: true,
		complexity: "medium" as const,
		fingerprintText: "tool fallback timeout retry recovery",
	},
];

async function createEvaluation() {
	const now = new Date();
	const [evaluation] = await db
		.insert(evaluations)
		.values({
			name: `EvalGate artifacts ${Date.now()}-${Math.random()}`,
			description: "Route test evaluation",
			type: "unit_test",
			status: "draft",
			organizationId: 1,
			createdBy: "test-user",
			createdAt: now,
			updatedAt: now,
		})
		.returning({ id: evaluations.id });

	if (!evaluation) {
		throw new Error("Failed to create evaluation fixture");
	}

	return evaluation.id;
}

describe("/api/evaluations/[id]/artifacts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.role = "member";
	});

	it("creates and lists synthesis artifacts", async () => {
		const evaluationId = await createEvaluation();
		const postRequest = new NextRequest(
			`http://localhost/api/evaluations/${evaluationId}/artifacts`,
			{
				method: "POST",
				body: JSON.stringify({
					artifactType: "synthesis",
					datasetContent: labeledDatasetContent,
					dimensions: { locale: ["en", "es"] },
					count: 2,
					failureModes: ["tool_failure"],
				}),
				headers: { "Content-Type": "application/json" },
			},
		);

		const postResponse = await POST(postRequest, {
			params: Promise.resolve({ id: String(evaluationId) }),
		} as never);

		expect(postResponse.status).toBe(201);
		const createdArtifact = await postResponse.json();
		expect(createdArtifact.kind).toBe("synthesis");
		expect(createdArtifact.title).toBe("Synthetic case generation");
		expect(createdArtifact.summary).toMatchObject({
			generated: 2,
			sourceCases: 2,
			sourceFailures: 1,
			selectedFailureModes: ["tool_failure"],
		});

		const [storedArtifact] = await db
			.select()
			.from(evalgateArtifacts)
			.where(eq(evalgateArtifacts.id, createdArtifact.id));

		expect(storedArtifact).toBeDefined();
		expect(storedArtifact?.kind).toBe("synthesis");
		expect(storedArtifact?.metadata).toMatchObject({
			source: "dataset_content",
			evaluationId,
			rowCount: 2,
			artifactVersion: "v1",
		});
		expect(storedArtifact?.payload).toMatchObject({
			generated: 2,
			dimensionCombinationCount: 2,
		});
		expect(
			Array.isArray((storedArtifact?.payload as { cases?: unknown[] })?.cases),
		).toBe(true);

		const getRequest = new NextRequest(
			`http://localhost/api/evaluations/${evaluationId}/artifacts?artifactType=synthesis&limit=10`,
		);
		const getResponse = await GET(getRequest, {
			params: Promise.resolve({ id: String(evaluationId) }),
		} as never);

		expect(getResponse.status).toBe(200);
		const listed = await getResponse.json();
		expect(listed.artifacts).toHaveLength(1);
		expect(listed.artifacts[0]).toMatchObject({
			id: createdArtifact.id,
			kind: "synthesis",
			title: "Synthetic case generation",
		});
	});

	it("creates and filters diversity artifacts", async () => {
		const evaluationId = await createEvaluation();

		const diversityRequest = new NextRequest(
			`http://localhost/api/evaluations/${evaluationId}/artifacts`,
			{
				method: "POST",
				body: JSON.stringify({
					artifactType: "diversity",
					specs: diversitySpecs,
					threshold: 0.5,
				}),
				headers: { "Content-Type": "application/json" },
			},
		);

		const diversityResponse = await POST(diversityRequest, {
			params: Promise.resolve({ id: String(evaluationId) }),
		} as never);

		expect(diversityResponse.status).toBe(201);
		const diversityArtifact = await diversityResponse.json();
		expect(diversityArtifact.kind).toBe("diversity");
		expect(diversityArtifact.summary).toMatchObject({
			specCount: 2,
			redundantPairCount: 1,
		});

		const [storedDiversity] = await db
			.select()
			.from(evalgateArtifacts)
			.where(eq(evalgateArtifacts.id, diversityArtifact.id));

		expect(storedDiversity?.metadata).toMatchObject({
			source: "spec_inventory",
			evaluationId,
			threshold: 0.5,
			rowCount: 2,
		});
		expect(storedDiversity?.payload).toMatchObject({
			specs: diversitySpecs,
		});
		expect(
			(
				(
					storedDiversity?.payload as {
						diversity?: { redundantPairs?: unknown[] };
					}
				).diversity?.redundantPairs ?? []
			).length,
		).toBe(1);

		const synthesisRequest = new NextRequest(
			`http://localhost/api/evaluations/${evaluationId}/artifacts`,
			{
				method: "POST",
				body: JSON.stringify({
					artifactType: "synthesis",
					datasetContent: labeledDatasetContent,
				}),
				headers: { "Content-Type": "application/json" },
			},
		);
		const synthesisResponse = await POST(synthesisRequest, {
			params: Promise.resolve({ id: String(evaluationId) }),
		} as never);
		expect(synthesisResponse.status).toBe(201);

		const filteredRequest = new NextRequest(
			`http://localhost/api/evaluations/${evaluationId}/artifacts?artifactType=diversity&limit=10`,
		);
		const filteredResponse = await GET(filteredRequest, {
			params: Promise.resolve({ id: String(evaluationId) }),
		} as never);

		expect(filteredResponse.status).toBe(200);
		const filtered = await filteredResponse.json();
		expect(filtered.artifacts).toHaveLength(1);
		expect(filtered.artifacts[0]).toMatchObject({
			id: diversityArtifact.id,
			kind: "diversity",
			title: "Spec diversity report",
		});
	});

	it("returns 403 when a viewer tries to create a synthesis artifact", async () => {
		h.role = "viewer";
		const evaluationId = await createEvaluation();

		const response = await POST(
			new NextRequest(
				`http://localhost/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					body: JSON.stringify({
						artifactType: "synthesis",
						datasetContent: labeledDatasetContent,
					}),
					headers: { "Content-Type": "application/json" },
				},
			),
			{ params: Promise.resolve({ id: String(evaluationId) }) } as never,
		);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error?.message).toBe(
			"You do not have permission to perform this action.",
		);
	});

	it("accepts a synthesis artifact into evaluation test cases", async () => {
		h.role = "owner";
		const evaluationId = await createEvaluation();
		const createResponse = await POST(
			new NextRequest(
				`http://localhost/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					body: JSON.stringify({
						artifactType: "synthesis",
						datasetContent: labeledDatasetContent,
						count: 1,
						failureModes: ["tool_failure"],
					}),
					headers: { "Content-Type": "application/json" },
				},
			),
			{ params: Promise.resolve({ id: String(evaluationId) }) } as never,
		);

		expect(createResponse.status).toBe(201);
		const artifact = await createResponse.json();

		const acceptResponse = await ACCEPT_POST(
			new NextRequest(
				`http://localhost/api/evaluations/${evaluationId}/artifacts/${artifact.id}/accept`,
				{ method: "POST" },
			),
			{
				params: Promise.resolve({
					id: String(evaluationId),
					artifactId: String(artifact.id),
				}),
			} as never,
		);

		expect(acceptResponse.status).toBe(200);
		const accepted = await acceptResponse.json();
		expect(accepted).toMatchObject({ success: true, artifactId: artifact.id });
		expect(accepted.createdCount).toBeGreaterThan(0);

		const createdCases = await db
			.select()
			.from(testCases)
			.where(eq(testCases.evaluationId, evaluationId));

		expect(createdCases.length).toBeGreaterThan(0);
		expect(createdCases[0]?.metadata).toMatchObject({
			source: "evalgate_synthesis_artifact",
			artifactId: artifact.id,
		});
	});

	it("deletes an artifact through the nested route", async () => {
		h.role = "owner";
		const evaluationId = await createEvaluation();
		const createResponse = await POST(
			new NextRequest(
				`http://localhost/api/evaluations/${evaluationId}/artifacts`,
				{
					method: "POST",
					body: JSON.stringify({
						artifactType: "diversity",
						specs: diversitySpecs,
						threshold: 0.5,
					}),
					headers: { "Content-Type": "application/json" },
				},
			),
			{ params: Promise.resolve({ id: String(evaluationId) }) } as never,
		);

		expect(createResponse.status).toBe(201);
		const artifact = await createResponse.json();

		const deleteResponse = await ARTIFACT_DELETE(
			new NextRequest(
				`http://localhost/api/evaluations/${evaluationId}/artifacts/${artifact.id}`,
				{ method: "DELETE" },
			),
			{
				params: Promise.resolve({
					id: String(evaluationId),
					artifactId: String(artifact.id),
				}),
			} as never,
		);

		expect(deleteResponse.status).toBe(200);
		const deleted = await deleteResponse.json();
		expect(deleted).toEqual({ success: true });

		const [storedArtifact] = await db
			.select()
			.from(evalgateArtifacts)
			.where(eq(evalgateArtifacts.id, artifact.id));

		expect(storedArtifact).toBeUndefined();
	});
});
