import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectQueue: unknown[] = [];

const createChain = (result: unknown) => {
	const builder: Record<string, unknown> = {
		select: vi.fn(() => builder),
		from: vi.fn(() => builder),
		where: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		returning: vi.fn(() => builder),
		values: vi.fn(() => builder),
		update: vi.fn(() => builder),
		set: vi.fn(() => builder),
		orderBy: vi.fn(() => builder),
		and: vi.fn(() => builder),
		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: (value: unknown) => unknown) => {
			return Promise.resolve(result).then(onFulfilled);
		},
		catch(onRejected: (err: unknown) => unknown) {
			return Promise.resolve(result).catch(onRejected);
		},
	};
	return builder;
};

vi.mock("@/db", () => ({
	db: {
		select: () => createChain(selectQueue.shift() ?? []),
		update: () => createChain(null),
		from: () => createChain(selectQueue.shift() ?? []),
	},
}));

vi.mock("@/lib/api/secure-route", () => ({
	secureRoute: (handler: unknown) => {
		return async (
			req: NextRequest,
			props: { params: Promise<Record<string, string>> },
		) => {
			const params = await props.params;
			return handler(req, { authType: "anonymous" }, params);
		};
	},
}));

vi.mock("@/lib/api/request-id", () => ({
	getRequestId: () => "request-id",
}));

// ✅ FIX: use async factory + importOriginal so apiError exists
vi.mock("@/lib/api/errors", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/lib/api/errors")>();
	return { ...original };
});

vi.mock("@/db/schema", () => ({
	sharedExports: {
		viewCount: "viewCount",
		shareId: "shareId",
		id: "id",
	},
}));

const { GET } = await import("@/app/api/exports/[shareId]/route");

const baseRow = {
	id: 1,
	shareId: "share-link",
	shareScope: "evaluation",
	organizationId: 1,
	exportData: { summary: {} },
	exportHash: "hash-123",
	isPublic: true,
	revokedAt: null,
	createdAt: new Date().toISOString(),
	updatedAt: null,
	expiresAt: null,
};

describe("GET /api/exports/[shareId] (unit)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectQueue.length = 0;
	});

	it("returns 410 when share is revoked", async () => {
		selectQueue.push([{ ...baseRow, revokedAt: new Date().toISOString() }]);

		const request = new NextRequest("http://localhost/api/exports/share-link");
		const response = await GET(request, {
			params: Promise.resolve({ shareId: "share-link" }),
		});

		expect(response.status).toBe(410);
		const body = await response.json();
		expect(body.error?.code).toBe("SHARE_REVOKED");
	});

	it("returns 410 when share is expired", async () => {
		const past = new Date(Date.now() - 1000).toISOString();
		selectQueue.push([{ ...baseRow, expiresAt: past }]);

		const request = new NextRequest("http://localhost/api/exports/share-link");
		const response = await GET(request, {
			params: Promise.resolve({ shareId: "share-link" }),
		});

		expect(response.status).toBe(410);
		const body = await response.json();
		expect(body.error?.code).toBe("SHARE_EXPIRED");
	});

	it("returns 304 when If-None-Match matches export hash", async () => {
		selectQueue.push([{ ...baseRow }]);

		const request = new NextRequest("http://localhost/api/exports/share-link", {
			headers: { "If-None-Match": `"${baseRow.exportHash}"` },
		});
		const response = await GET(request, {
			params: Promise.resolve({ shareId: "share-link" }),
		});

		expect(response.status).toBe(304);
		expect(response.headers.get("ETag")).toBe(`"${baseRow.exportHash}"`);
	});
});
