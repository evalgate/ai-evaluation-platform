import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectQueue: unknown[] = [];

const createChain = (result: unknown) => {
	const builder: Record<string, unknown> = {
		select: vi.fn(() => builder),
		from: vi.fn(() => builder),
		where: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		// biome-ignore lint/suspicious/noThenProperty: test mock
		then: (onFulfilled: (value: unknown) => unknown) => {
			return Promise.resolve(result).then(onFulfilled);
		},
	};
	return builder;
};

vi.mock("@/db", () => ({
	db: {
		select: () => createChain(selectQueue.shift() ?? []),
	},
}));

vi.mock("@/db/schema", () => ({
	sharedExports: { shareId: "shareId", id: "id" },
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

vi.mock("@/lib/api/request-id", () => ({ getRequestId: () => "rid" }));
vi.mock("@/lib/api/errors", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/lib/api/errors")>();
	return { ...original };
});
vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { GET } = await import("@/app/api/exports/[shareId]/route");

describe("GET /api/exports/[shareId] - not found", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectQueue.length = 0;
	});

	it("returns 404 when shareId is unknown", async () => {
		selectQueue.push([]); // no rows

		const req = new NextRequest("http://localhost/api/exports/missing");
		const res = await GET(req, {
			params: Promise.resolve({ shareId: "missing" }),
		});

		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error?.code).toBe("NOT_FOUND");
	});

	it("does not set an ETag on 404 responses", async () => {
		selectQueue.push([]);

		const req = new NextRequest("http://localhost/api/exports/missing");
		const res = await GET(req, {
			params: Promise.resolve({ shareId: "missing" }),
		});

		expect(res.headers.get("ETag")).toBeFalsy();
	});
});
