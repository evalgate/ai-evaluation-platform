// Unit test setup - no DB, no migrations, only env vars
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-for-unit-tests";

console.log("[setup.unit] loaded");
