// Unit test setup - no DB, no migrations, only env vars
process.env.NODE_ENV = "test";
process.env.TURSO_CONNECTION_URL ??= "file:memory.db";
process.env.TURSO_AUTH_TOKEN ??= "test-token";

console.log("[setup.unit] loaded");
