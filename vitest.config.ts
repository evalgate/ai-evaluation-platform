// vitest.config.ts
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const alias = {
  "@": resolve(__dirname, "./src"),
};

const common = {
  globals: true,
  setupFiles: ["./src/__tests__/setup.ts"],
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/e2e/**",
    "**/playwright/**",
    "**/cypress/**",
    "**/.{idea,git,cache,output,temp}/**",
  ],
};

export default defineConfig({
  plugins: [react()],

  // keep it here too (helps editor + non-project usage)
  resolve: { alias },

  test: {
    // ✅ projects replace environmentMatchGlobs
    projects: [
      // --- Node project (API routes, server libs, jobs, db) ---
      {
        resolve: { alias },
        test: {
          ...common,
          environment: "node",
          include: [
            "src/__tests__/api/**/*.test.{ts,tsx}",
            "src/__tests__/lib/**/*.test.{ts,tsx}",
            "src/app/api/**/*.test.{ts,tsx}",
            "src/lib/**/*.test.{ts,tsx}",
          ],
        },
      },

      // --- DOM project (components/hooks/ui) ---
      {
        resolve: { alias },
        test: {
          ...common,
          environment: "happy-dom",
          include: [
            "src/__tests__/components/**/*.test.{ts,tsx}",
            "src/__tests__/hooks/**/*.test.{ts,tsx}",
            "src/**/*.test.{ts,tsx}",
            "src/**/*.spec.{ts,tsx}",
          ],
          exclude: [
            ...common.exclude,
            "src/__tests__/api/**/*.test.{ts,tsx}",
            "src/__tests__/lib/**/*.test.{ts,tsx}",
            "src/app/api/**/*.test.{ts,tsx}",
            "src/lib/**/*.test.{ts,tsx}",
          ],
        },
      },
    ],

    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/integrations/**",
        "src/remotion/**",
        "src/visual-edits/**",
        "src/components/ui/**",
      ],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
    },
  },
});
