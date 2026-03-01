import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const { DATABASE_URL } = env();

const client = postgres(DATABASE_URL, {
	max: process.env.VERCEL ? 1 : 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
