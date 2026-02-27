import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

// Load .env.local for drizzle-kit commands (generate, studio). For migrations, use pnpm db:migrate.
const url = process.env.DATABASE_URL;

if (!url && process.env.NODE_ENV !== "test") {
  console.error(
    "DATABASE_URL is required. Run with: npx dotenv-cli -e .env.local -- pnpm drizzle-kit <command>",
  );
  console.error("For applying migrations, use: pnpm db:migrate");
  process.exit(1);
}

const dbConfig: Config = defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "postgres://localhost:5432/evalai",
  },
});

export default dbConfig;
