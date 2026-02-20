/**
 * Shared DB mock helper for Vitest tests.
 *
 * Usage in a test file:
 *
 *   import { createDbMock } from "@/__tests__/helpers/mock-db";
 *
 *   const { mockDbSelect } = createDbMock();
 *
 *   // Override for a single test:
 *   mockDbSelect.mockReturnValueOnce(makeDbChain([{ id: 1 }]));
 *
 * The vi.mock("@/db") call is still required in each test file because
 * Vitest hoists it — but the factory references the shared mockDbSelect
 * returned by createDbMock(), eliminating the boilerplate chain.
 */

import { vi } from "vitest";

export type DbRow = Record<string, unknown>;

/** Build a chainable Drizzle-style query result: .from().where?().limit?() */
export function makeDbChain(rows: DbRow[] = []) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(rows)),
  };
  return chain;
}

/**
 * Creates a hoistable mockDbSelect function.
 * Call this at module level (before vi.mock) so the reference is stable.
 *
 * @example
 * const { mockDbSelect } = createDbMock();
 * vi.mock("@/db", () => ({ db: { select: mockDbSelect } }));
 */
export function createDbMock(defaultRows: DbRow[] = [{ "1": 1 }]) {
  const mockDbSelect = vi.fn(() => makeDbChain(defaultRows));

  /** Reset to the default healthy response between tests */
  function resetDbMock(rows: DbRow[] = defaultRows) {
    mockDbSelect.mockReturnValue(makeDbChain(rows));
  }

  /** Simulate a DB error for the next call only */
  function mockDbError(message = "DB connection failed") {
    const chain = makeDbChain();
    chain.limit = vi.fn(() => Promise.reject(new Error(message)));
    mockDbSelect.mockReturnValueOnce(chain);
  }

  return { mockDbSelect, resetDbMock, mockDbError };
}
