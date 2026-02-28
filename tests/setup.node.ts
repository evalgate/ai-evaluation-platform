// Node.js environment setup for unit tests
// Lightweight setup - no DB, no heavy imports

export {}; // Node.js environment setup for unit tests
// Lightweight setup - no DB, no heavy imports

// Set default environment variables (allow overrides)
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-for-node-tests";
process.env.NODE_ENV = "test";

// Optional: silence console noise when needed
// vi.spyOn(console, "error").mockImplementation(() => {});
