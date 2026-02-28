import { NextResponse } from "next/server";
import postgres from "postgres";
import { internalError } from "@/lib/api/errors";

export async function GET() {
	const url = process.env.DATABASE_URL;

	if (!url) {
		return internalError("Missing DATABASE_URL");
	}

	const sql = postgres(url, { max: 1 });

	try {
		// Check if verification table exists
		const verificationCheck = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'verification'
    `;

		// List all tables
		const allTables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

		return NextResponse.json({
			database: `${url.substring(0, 40)}...`,
			verificationExists: verificationCheck.length > 0,
			totalTables: allTables.length,
			tables: allTables.map((r) => r.table_name),
		});
	} catch (err: unknown) {
		return internalError(
			err instanceof Error ? err.message : "Database connection failed",
		);
	} finally {
		await sql.end();
	}
}
