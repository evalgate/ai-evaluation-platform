const fs = require("node:fs");
const data = JSON.parse(
	fs.readFileSync("coverage/coverage-summary.json", "utf-8"),
);
const THRESHOLDS = {
	"src/lib/scoring": 60,
	"src/lib/jobs": 55,
	"src/lib": 20,
	"src/db": 28,
	"src/app/api": 6,
	"src/packages/sdk": 39,
};

const byDir = new Map();

for (const [filePath, fileData] of Object.entries(data)) {
	if (filePath === "total") continue;
	const norm = filePath.replace(/\\/g, "/");
	const statements = fileData.s ?? {};
	const total = Object.keys(statements).length;
	const covered = Object.values(statements).filter((v) => v > 0).length;
	if (total === 0) continue;

	for (const folder of Object.keys(THRESHOLDS)) {
		if (norm.includes(folder)) {
			const prev = byDir.get(folder) ?? { covered: 0, total: 0 };
			byDir.set(folder, {
				covered: prev.covered + covered,
				total: prev.total + total,
			});
			break;
		}
	}
}

console.log("Coverage by directory:");
for (const [folder, { covered, total }] of byDir) {
	const pct = total > 0 ? (covered / total) * 100 : 100;
	console.log(
		`${folder}: ${pct.toFixed(1)}% (threshold ${THRESHOLDS[folder]}%)`,
	);
}
