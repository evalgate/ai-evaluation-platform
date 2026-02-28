import { describe, expect, it } from "vitest";
import { canonicalizeJson } from "@/lib/crypto/canonical-json";

describe("canonicalizeJson", () => {
	it("serializes simple object", () => {
		const result = canonicalizeJson({ name: "test", value: 42 });
		expect(result).toBe('{"name":"test","value":42}');
	});

	it("sorts object keys alphabetically", () => {
		const result = canonicalizeJson({ z: 1, a: 2, m: 3 });
		expect(result).toBe('{"a":2,"m":3,"z":1}');
	});

	it("handles nested objects with sorted keys", () => {
		const result = canonicalizeJson({ outer: { z: 1, a: 2 }, first: true });
		expect(result).toBe('{"first":true,"outer":{"a":2,"z":1}}');
	});

	it("handles arrays", () => {
		const result = canonicalizeJson({ items: [3, 1, 2] });
		expect(result).toBe('{"items":[3,1,2]}');
	});

	it("handles arrays of objects", () => {
		const result = canonicalizeJson({ items: [{ b: 2, a: 1 }] });
		expect(result).toBe('{"items":[{"a":1,"b":2}]}');
	});

	it("handles null values", () => {
		const result = canonicalizeJson({ value: null });
		expect(result).toBe('{"value":null}');
	});

	it("handles boolean values", () => {
		const result = canonicalizeJson({ active: true, disabled: false });
		expect(result).toBe('{"active":true,"disabled":false}');
	});

	it("handles string values", () => {
		const result = canonicalizeJson({ message: "hello world" });
		expect(result).toBe('{"message":"hello world"}');
	});

	it("handles number values", () => {
		const result = canonicalizeJson({ integer: 42, float: 3.14 });
		expect(result).toBe('{"float":3.14,"integer":42}');
	});

	it("handles empty object", () => {
		const result = canonicalizeJson({});
		expect(result).toBe("{}");
	});

	it("handles empty array", () => {
		const result = canonicalizeJson({ items: [] });
		expect(result).toBe('{"items":[]}');
	});

	it("handles deeply nested structures", () => {
		const result = canonicalizeJson({
			level1: {
				level2: {
					level3: { value: "deep" },
				},
			},
		});
		expect(result).toBe('{"level1":{"level2":{"level3":{"value":"deep"}}}}');
	});

	it("handles special characters in strings", () => {
		const result = canonicalizeJson({ text: 'hello "world"' });
		expect(result).toBe('{"text":"hello \\"world\\""}');
	});

	it("handles unicode characters", () => {
		const result = canonicalizeJson({ emoji: "🎉", chinese: "你好" });
		// Keys should be sorted
		expect(result).toBe('{"chinese":"你好","emoji":"🎉"}');
	});

	it("produces consistent output for same input", () => {
		const obj = { c: 3, a: 1, b: 2 };
		const result1 = canonicalizeJson(obj);
		const result2 = canonicalizeJson(obj);
		expect(result1).toBe(result2);
	});

	it("produces same output regardless of key insertion order", () => {
		const obj1 = { a: 1, b: 2, c: 3 };
		const obj2 = { c: 3, b: 2, a: 1 };
		expect(canonicalizeJson(obj1)).toBe(canonicalizeJson(obj2));
	});
});
