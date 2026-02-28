import { describe, expect, it } from "vitest";
import { paginationSchema, parsePagination } from "@/lib/api/pagination";

describe("paginationSchema", () => {
	// Happy path tests
	it("should accept valid pagination values", () => {
		expect(paginationSchema.parse({ page: 1, limit: 20 })).toEqual({
			page: 1,
			limit: 20,
		});
	});

	it("should coerce string numbers to integers", () => {
		expect(paginationSchema.parse({ page: "2", limit: "10" })).toEqual({
			page: 2,
			limit: 10,
		});
	});

	it("should apply default values", () => {
		expect(paginationSchema.parse({})).toEqual({
			page: 1,
			limit: 20,
		});
	});

	// Edge case tests
	it("should handle boundary values", () => {
		expect(paginationSchema.parse({ page: 1, limit: 1 })).toEqual({
			page: 1,
			limit: 1,
		});
		expect(paginationSchema.parse({ page: 999, limit: 100 })).toEqual({
			page: 999,
			limit: 100,
		});
	});

	it("should reject decimal numbers (int coercion)", () => {
		expect(() => paginationSchema.parse({ page: 2.9, limit: 19.1 })).toThrow();
		expect(() =>
			paginationSchema.parse({ page: "2.5", limit: "10.5" }),
		).toThrow();
	});

	// Error/invalid input tests
	it("should reject page less than 1", () => {
		expect(() => paginationSchema.parse({ page: 0 })).toThrow();
		expect(() => paginationSchema.parse({ page: -1 })).toThrow();
	});

	it("should reject limit less than 1", () => {
		expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
		expect(() => paginationSchema.parse({ limit: -5 })).toThrow();
	});

	it("should reject limit greater than 100", () => {
		expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
		expect(() => paginationSchema.parse({ limit: 1000 })).toThrow();
	});

	it("should reject invalid string numbers", () => {
		expect(() => paginationSchema.parse({ page: "abc" })).toThrow();
		expect(() => paginationSchema.parse({ limit: "xyz" })).toThrow();
	});
});

describe("parsePagination", () => {
	// Happy path tests
	it("should parse valid pagination params", () => {
		const params = new URLSearchParams({ page: "2", limit: "10" });
		expect(parsePagination(params)).toEqual({
			page: 2,
			limit: 10,
			offset: 10,
		});
	});

	it("should use defaults when params are missing", () => {
		const params = new URLSearchParams();
		expect(parsePagination(params)).toEqual({
			page: 1,
			limit: 20,
			offset: 0,
		});
	});

	it("should calculate offset correctly", () => {
		const params = new URLSearchParams({ page: "3", limit: "15" });
		expect(parsePagination(params)).toEqual({
			page: 3,
			limit: 15,
			offset: 30,
		});
	});

	// Edge case tests
	it("should handle first page offset", () => {
		const params = new URLSearchParams({ page: "1", limit: "25" });
		expect(parsePagination(params)).toEqual({
			page: 1,
			limit: 25,
			offset: 0,
		});
	});

	it("should throw on invalid limit param", () => {
		const params = new URLSearchParams({ page: "1", limit: "invalid" });
		expect(() => parsePagination(params)).toThrow();
	});

	it("should throw on decimal string numbers", () => {
		const params = new URLSearchParams({ page: "5.5", limit: "10.9" });
		expect(() => parsePagination(params)).toThrow();
	});

	// Error/invalid input tests
	it("should throw on invalid page param", () => {
		const params = new URLSearchParams({ page: "0", limit: "10" });
		expect(() => parsePagination(params)).toThrow();
	});

	it("should throw on invalid limit param", () => {
		const params = new URLSearchParams({ page: "1", limit: "0" });
		expect(() => parsePagination(params)).toThrow();
	});

	it("should throw on limit exceeding maximum", () => {
		const params = new URLSearchParams({ page: "1", limit: "101" });
		expect(() => parsePagination(params)).toThrow();
	});
});
