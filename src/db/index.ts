import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Validate environment variables at startup
if (!process.env.DATABASE_URL) {
	console.error("DATABASE_URL environment variable is not set");
}

const client = postgres(
	process.env.DATABASE_URL || "postgres://localhost:5432/evalai",
);

export const db = drizzle(client, { schema });

export type Database = typeof db;
