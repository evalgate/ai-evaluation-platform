import { describe, expect, it, vi } from "vitest";
import { autoPaginate, autoPaginateGenerator } from "../pagination";

describe("autoPaginate (bug fix: returns Promise<T[]> not AsyncGenerator)", () => {
	it("should return a plain array — await gives an array not an iterator", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(["a", "b"])
			.mockResolvedValueOnce([]);
		const result = await autoPaginate(fetcher);
		expect(Array.isArray(result)).toBe(true);
		expect(result).toEqual(["a", "b"]);
	});

	it("should return an empty array when first page is empty", async () => {
		const fetcher = vi.fn().mockResolvedValueOnce([]);
		const result = await autoPaginate(fetcher);
		expect(result).toEqual([]);
	});

	it("should collect multiple pages into a flat array", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce([1, 2])
			.mockResolvedValueOnce([3, 4])
			.mockResolvedValueOnce([]);
		const result = await autoPaginate(fetcher, 2);
		expect(result).toEqual([1, 2, 3, 4]);
	});

	it("should stop when a page returns fewer items than limit (hasMore = false)", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(["x", "y", "z"])
			.mockResolvedValueOnce(["a"]);
		const result = await autoPaginate(fetcher, 3);
		expect(result).toEqual(["x", "y", "z", "a"]);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it("should pass incrementing offsets to the fetcher", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(["a", "b"])
			.mockResolvedValueOnce([]);
		await autoPaginate(fetcher, 2);
		expect(fetcher).toHaveBeenNthCalledWith(1, 0, 2);
		expect(fetcher).toHaveBeenNthCalledWith(2, 2, 2);
	});
});

describe("autoPaginateGenerator (streaming variant)", () => {
	it("should yield items one at a time across pages", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(["a", "b"])
			.mockResolvedValueOnce(["c"])
			.mockResolvedValueOnce([]);
		const collected: string[] = [];
		for await (const item of autoPaginateGenerator<string>(fetcher, 2)) {
			collected.push(item);
		}
		expect(collected).toEqual(["a", "b", "c"]);
	});

	it("should yield nothing when first page is empty", async () => {
		const fetcher = vi.fn().mockResolvedValueOnce([]);
		const items: unknown[] = [];
		for await (const item of autoPaginateGenerator(fetcher)) {
			items.push(item);
		}
		expect(items).toEqual([]);
	});
});
