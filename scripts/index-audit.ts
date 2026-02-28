#!/usr/bin/env npx tsx
/**
 * Index Audit — verify that every high-volume query column has a covering index.
 *
 * Reads the Drizzle migration SQL files and checks that each required index
 * exists. Exits 1 if unknown required index is missing (CI gate).
 *
 * Run: npx tsx scripts/index-audit.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Each entry: { table, column, reason } — must have at least one index covering the column */
const REQUIRED_INDEXES: Array<{
	table: string;
	column: string;
	reason: string;
}> = [
	// SLO endpoint — rolling 24h window queries
	{
		table: "api_usage_logs",
		column: "created_at",
		reason: "SLO p95 latency window scan",
	},
	{
		table: "webhook_deliveries",
		column: "created_at",
		reason: "SLO webhook success rate window scan",
	},
	{
		table: "quality_scores",
		column: "created_at",
		reason: "SLO eval gate pass rate window scan",
	},

	// Job runner — status + next_run_at composite
	{ table: "jobs", column: "status", reason: "Job runner due-job scan" },
	{ table: "jobs", column: "next_run_at", reason: "Job runner due-job scan" },

	// Hot join paths
	{
		table: "test_results",
		column: "evaluation_run_id",
		reason: "Aggregate metrics join",
	},
	{
		table: "llm_judge_results",
		column: "evaluation_run_id",
		reason: "Judge avg join",
	},
	{
		table: "cost_records",
		column: "evaluation_run_id",
		reason: "Cost aggregate join",
	},
	{
		table: "quality_scores",
		column: "evaluation_run_id",
		reason: "Quality score lookup",
	},
	{
		table: "webhook_deliveries",
		column: "webhook_id",
		reason: "Delivery history lookup",
	},
];

/** Collect indexed columns from migration SQL files and schema.ts */
function collectIndexedColumns(): Map<string, Set<string>> {
	const indexed = new Map<string, Set<string>>();

	function addCol(table: string, col: string) {
		const t = table.toLowerCase();
		const c = col.toLowerCase();
		if (!indexed.has(t)) indexed.set(t, new Set());
		indexed.get(t)?.add(c);
	}

	// 1. Scan migration SQL files
	const drizzleDir = path.join(process.cwd(), "drizzle");
	if (fs.existsSync(drizzleDir)) {
		const files = fs
			.readdirSync(drizzleDir)
			.filter((f) => f.endsWith(".sql"))
			.sort();

		for (const file of files) {
			const content = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
			const indexRe =
				/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?\S+\s+ON\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)/gi;
			let m: RegExpExecArray | null = indexRe.exec(content);
			while (m !== null) {
				const cols = m[2]
					.split(",")
					.map((c) => c.trim().replace(/[`"]/g, "").toLowerCase());
				for (const col of cols) addCol(m[1], col);
				m = indexRe.exec(content);
			}
		}
	}

	// 2. Scan schema.ts for Drizzle index() / uniqueIndex() definitions
	const schemaPath = path.join(process.cwd(), "src", "db", "schema.ts");
	if (fs.existsSync(schemaPath)) {
		const src = fs.readFileSync(schemaPath, "utf-8");
		// Match index("name").on(table.col1, table.col2)
		const idxRe =
			/(?:unique)?[Ii]ndex\(\s*["'][^"']+["']\s*\)\s*\.on\(([^)]+)\)/g;
		// We also need to know which table this belongs to — find pgTable("name", ...)
		const tableRe = /pgTable\(\s*\n?\s*["'](\w+)["']/g;
		const tablePositions: Array<{ name: string; pos: number }> = [];
		let tm: RegExpExecArray | null = tableRe.exec(src);
		while (tm !== null) {
			tablePositions.push({ name: tm[1], pos: tm.index });
			tm = tableRe.exec(src);
		}

		let im: RegExpExecArray | null = idxRe.exec(src);
		while (im !== null) {
			// Find which table this index belongs to (nearest preceding pgTable)
			let tableName = "unknown";
			for (const tp of tablePositions) {
				if (tp.pos < im.index) tableName = tp.name;
				else break;
			}
			// Extract column names from table.colName references
			const colStr = im[1];
			const colRe = /table\.(\w+)/g;
			let cm: RegExpExecArray | null = colRe.exec(colStr);
			while (cm !== null) {
				// Convert camelCase to snake_case
				const snake = cm[1].replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
				addCol(tableName, snake);
				cm = colRe.exec(colStr);
			}
			im = idxRe.exec(src);
		}
	}

	return indexed;
}

function main(): void {
	const indexed = collectIndexedColumns();
	let failed = false;

	console.log("Index Audit\n");
	console.log(
		`${"Table".padEnd(25)} ${"Column".padEnd(25)} ${"Status".padEnd(8)} Reason`,
	);
	console.log("─".repeat(90));

	for (const { table, column, reason } of REQUIRED_INDEXES) {
		const cols = indexed.get(table.toLowerCase());
		const found = cols?.has(column.toLowerCase()) ?? false;
		const status = found ? "✓" : "✗ MISSING";
		if (!found) failed = true;
		console.log(
			`${table.padEnd(25)} ${column.padEnd(25)} ${status.padEnd(8)} ${reason}`,
		);
	}

	console.log();
	if (failed) {
		console.error(
			"Index audit FAILED — add missing indexes in a new migration.",
		);
		process.exit(1);
	}
	console.log("Index audit passed.");
}

main();
