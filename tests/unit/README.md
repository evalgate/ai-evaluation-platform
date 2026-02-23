# Unit Tests - Pure Logic Coverage Lane

## 🎯 Purpose
This directory contains unit tests for pure logic modules that provide meaningful coverage without full-module mocks.

## 🚫 Anti-Regression Rule: No Full Module Mocks

**CRITICAL**: In `tests/unit/**`, avoid `vi.mock("@/")` except for true external boundaries:
- Database clients (e.g., `vi.mock("@/db")`)
- Fetch/HTTP wrappers (e.g., `vi.mock("@/lib/fetch")`)
- File system wrappers (e.g., `vi.mock("@/lib/fs")`)

### Why This Matters
- **Real Coverage**: Tests execute actual code paths, not mocked implementations
- **Regression Protection**: Coverage stays meaningful as code evolves
- **Refactoring Safety**: Real tests catch breaking changes that mocks hide

### Examples

❌ **BAD** - Full module mock:
```typescript
vi.mock("@/lib/utils", () => ({
  formatCurrency: vi.fn(() => "$10.00"),
  calculateTax: vi.fn(() => "$1.00")
}))
```

✅ **GOOD** - Boundary mock only:
```typescript
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  }
}))
```

✅ **BEST** - No mocks for pure logic:
```typescript
// Test the actual implementation
import { calculateQualityScore } from "@/lib/ai-quality-score"
// Test with real inputs, verify real outputs
```

## 📊 Current Coverage Modules

The following pure logic modules have comprehensive unit tests:

1. `crypto/hash.ts` - SHA256 hashing (100% coverage)
2. `crypto/canonical-json.ts` - JSON sorting and normalization
3. `api/pagination.ts` - Zod validation and parsing
4. `auth/scopes.ts` - Role-based scope mapping
5. `utils/error-handling.ts` - Type guards and error extraction
6. `drift/zscore.ts` - Mathematical functions (statistics)
7. `eval/assertions.ts` - Complex parsing and validation logic
8. `utils/input-hash.ts` - JSON normalization and hashing
9. `governance/rules.ts` - Enterprise governance logic
10. `jobs/payload-schemas.ts` - Zod validation for job payloads
11. `ai-quality-score.ts` - Quality metrics calculation

## 🧪 Test Philosophy

- **Real Execution**: Tests exercise actual code paths
- **Edge Cases**: Cover boundaries, error conditions, mathematical properties
- **Type Safety**: Maintain TypeScript type safety throughout
- **No Shortcuts**: Avoid mocks that hide real behavior

## 🚀 Adding New Tests

When adding unit tests for pure logic modules:

1. Identify modules without external dependencies
2. Write comprehensive tests covering all branches
3. Include edge cases and error conditions
4. Never mock the module you're testing
5. Only mock true external boundaries (db, network, fs)

This ensures our coverage numbers represent real code execution and meaningful regression protection.
