// Node.js environment setup for unit tests
// Lightweight setup - no DB, no heavy imports

export {}; // Node.js environment setup for unit tests
// Lightweight setup - no DB, no heavy imports

// Set default environment variables (allow overrides)
process.env.TURSO_CONNECTION_URL ??= "file:memory.db";
process.env.TURSO_AUTH_TOKEN ??= "test-token";
process.env.NODE_ENV = "test";

// Optional: silence console noise when needed
// vi.spyOn(console, "error").mockImplementation(() => {});
