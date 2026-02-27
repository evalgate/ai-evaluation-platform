// Unit test setup - no DB, no migrations, only env vars
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

console.log("[setup.unit] loaded");
