import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	unstable_cache: vi.fn((fn, _keyParts, _opts) => fn),
	revalidateTag: vi.fn(),
}));

vi.mock("@/lib/redis-cache", () => {
	const mockWrap = vi.fn(async (_key, fn) => fn());
	const mockInvalidateResource = vi.fn();
	const mockInvalidateOrganization = vi.fn();

	return {
		cache: {
			wrap: mockWrap,
			invalidateResource: mockInvalidateResource,
			invalidateOrganization: mockInvalidateOrganization,
		},
		CacheTTL: {
			SHORT: 60,
			MEDIUM: 300,
			LONG: 900,
			VERY_LONG: 3600,
			DAY: 86400,
		},
	};
});

vi.mock("@/lib/logger", () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

const { cachedDbQuery, cachedHotPath, invalidateTag, invalidateOrganization } =
	await import("@/lib/cache");

const { unstable_cache } = await import("next/cache");
const { cache: redisCache } = await import("@/lib/redis-cache");

describe("Cache layer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("cachedDbQuery", () => {
		it("calls unstable_cache with correct key parts and options", async () => {
			const fn = vi.fn().mockResolvedValue({ data: "test" });

			const result = await cachedDbQuery(["test", "key"], fn, {
				tags: ["evaluations"],
				revalidateSeconds: 120,
			});

			expect(unstable_cache).toHaveBeenCalledWith(fn, ["test", "key"], {
				tags: ["evaluations", "db"],
				revalidate: 120,
			});
			expect(result).toEqual({ data: "test" });
		});

		it("uses default options when none provided", async () => {
			const fn = vi.fn().mockResolvedValue([]);

			await cachedDbQuery(["default"], fn);

			expect(unstable_cache).toHaveBeenCalledWith(fn, ["default"], {
				tags: ["db"],
				revalidate: 60,
			});
		});
	});

	describe("cachedHotPath", () => {
		it("delegates to Redis cache.wrap", async () => {
			const fn = vi.fn().mockResolvedValue({ score: 95 });

			const result = await cachedHotPath("leaderboard", fn, {
				ttlSeconds: 300,
				organizationId: 1,
				resource: "benchmarks",
			});

			expect(redisCache.wrap).toHaveBeenCalledWith(
				"benchmarks:org:1:leaderboard",
				fn,
				{ ttl: 300 },
			);
			expect(result).toEqual({ score: 95 });
		});

		it("uses default prefix when no resource specified", async () => {
			const fn = vi.fn().mockResolvedValue("value");

			await cachedHotPath("simple-key", fn);

			expect(redisCache.wrap).toHaveBeenCalledWith("hot:simple-key", fn, {
				ttl: 300,
			});
		});
	});

	describe("invalidateTag", () => {
		it("calls revalidateTag and Redis invalidation", async () => {
			const { revalidateTag: mockRevalidateTag } = await import("next/cache");

			await invalidateTag("evaluations", 1);

			expect(mockRevalidateTag).toHaveBeenCalledWith("evaluations");
			expect(redisCache.invalidateResource).toHaveBeenCalledWith(
				"evaluations",
				1,
			);
		});

		it("skips Redis invalidation when no orgId provided", async () => {
			await invalidateTag("global-tag");

			expect(redisCache.invalidateResource).not.toHaveBeenCalled();
		});
	});

	describe("invalidateOrganization", () => {
		it("invalidates both Next.js cache and Redis", async () => {
			const { revalidateTag: mockRevalidateTag } = await import("next/cache");

			await invalidateOrganization(42);

			expect(mockRevalidateTag).toHaveBeenCalledWith("org:42");
			expect(redisCache.invalidateOrganization).toHaveBeenCalledWith(42);
		});
	});
});
