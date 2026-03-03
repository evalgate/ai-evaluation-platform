import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { compareSnapshots, compareWithSnapshot, snapshot } from "../snapshot";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "evalgate-snapshot-test-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("snapshot(name, undefined) — bug fix: no crash on undefined output", () => {
	it("should save without throwing when output is undefined", async () => {
		await expect(
			snapshot("undef-test", undefined, { dir: tmpDir }),
		).resolves.toBeDefined();
	});

	it("should serialize undefined to the string 'undefined'", async () => {
		const saved = await snapshot("undef-test", undefined, { dir: tmpDir });
		expect(saved.output).toBe("undefined");
	});

	it("should serialize null to the string 'null'", async () => {
		const saved = await snapshot("null-test", null, { dir: tmpDir });
		expect(saved.output).toBe("null");
	});

	it("should serialize a plain string as-is", async () => {
		const saved = await snapshot("str-test", "hello world", { dir: tmpDir });
		expect(saved.output).toBe("hello world");
	});

	it("should serialize an object via JSON.stringify", async () => {
		const saved = await snapshot("obj-test", { x: 1 }, { dir: tmpDir });
		expect(saved.output).toBe(JSON.stringify({ x: 1 }));
	});
});

describe("compareSnapshots(nameA, nameB) — bug fix: loads nameB from disk", () => {
	it("should match when both snapshots have identical content", async () => {
		await snapshot("snap-a", "hello", { dir: tmpDir });
		await snapshot("snap-b", "hello", { dir: tmpDir });

		const result = await compareSnapshots("snap-a", "snap-b", tmpDir);
		expect(result.matches).toBe(true);
		expect(result.similarity).toBe(1);
	});

	it("should detect differences when snapshots differ", async () => {
		await snapshot("snap-a", "hello", { dir: tmpDir });
		await snapshot("snap-b", "world", { dir: tmpDir });

		const result = await compareSnapshots("snap-a", "snap-b", tmpDir);
		expect(result.matches).toBe(false);
		expect(result.differences.length).toBeGreaterThan(0);
	});

	it("should not treat nameB as raw content (the original bug)", async () => {
		await snapshot("baseline", "expected output", { dir: tmpDir });
		await snapshot("current", "expected output", { dir: tmpDir });

		const resultCorrect = await compareSnapshots("baseline", "current", tmpDir);
		expect(resultCorrect.matches).toBe(true);

		const resultWrong = await compareWithSnapshot(
			"baseline",
			"current",
			tmpDir,
		);
		expect(resultWrong.matches).toBe(false);
	});
});
