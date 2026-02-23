// DB integration test setup - includes migrations and seeding
import { tmpdir } from "node:os";
import { join } from "node:path";

const workerId = process.env.VITEST_WORKER_ID ?? process.pid;
const testDbPath = join(tmpdir(), `evalai-test-${workerId}-${Date.now()}.db`).replace(/\\/g, "/");
process.env.TURSO_CONNECTION_URL = `file:${testDbPath}`;
process.env.TURSO_AUTH_TOKEN = "test-token";

const { runMigrations } = await import(join(process.cwd(), "scripts/run-migrations.ts"));
await runMigrations({ url: `file:${testDbPath}`, authToken: "test-token", silent: true });

import { beforeAll } from "vitest";
import { db } from "@/db";
import { organizations, user } from "@/db/schema";

beforeAll(async () => {
  // Seed minimal data for FK constraints (user, org) used by MCP usage tracking
  const now = new Date();
  try {
    await db
      .insert(user)
      .values({
        id: "test-user",
        name: "Test User",
        email: "test@example.com",
        emailVerified: false,
      })
      .onConflictDoNothing();
    const existingOrg = await db.select().from(organizations).limit(1);
    if (existingOrg.length === 0) {
      await db.insert(organizations).values({
        name: "Test Org",
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch {
    // Ignore if already seeded
  }
});

console.log("[setup.db] loaded");
