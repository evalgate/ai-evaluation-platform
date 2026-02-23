// DOM environment setup for component tests
// Independent setup - no cross-imports

import { vi } from "vitest";
import "@testing-library/jest-dom";

// Set default environment variables (allow overrides)
process.env.NODE_ENV = "test";
process.env.TURSO_CONNECTION_URL ??= "file:memory.db";
process.env.TURSO_AUTH_TOKEN ??= "test-token";

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

console.log("[setup.dom] loaded");
