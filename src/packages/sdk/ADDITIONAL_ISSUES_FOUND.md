# Additional Issues Found in Second Review

## 🔴 Issues Discovered

### 1. **process.env Usage in Browser Context** ✅ FIXED

**Files**: `client.ts` (lines 105, 116, 178)

**Problem**: The SDK uses `process.env` directly, which is undefined in browsers:

```typescript
// Line 105
this.apiKey = config.apiKey || process.env.EVALAI_API_KEY || ...

// Line 116
const orgIdFromEnv = process.env.EVALAI_ORGANIZATION_ID || ...

// Line 178 (in static init method)
baseUrl: process.env.EVALAI_BASE_URL,
```

**Solution**: Added `getEnvVar()` helper function that safely checks for `process.env` existence:

```typescript
function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}
```

**Status**: ✅ **COMPLETED** - All direct `process.env` usage replaced with safe `getEnvVar()` calls

**Impact**: 
- ✅ Works in both Node.js and browsers
- ✅ Zero-config initialization works in browsers  
- ✅ `AIEvalClient.init()` is browser-safe

**Severity**: RESOLVED - Core functionality now works in browsers

---

### 2. **Type Name Collision** 🟡 MEDIUM PRIORITY

**Files**: `types.ts` (line 209) and `testing.ts` (line 27)

**Problem**: Two different `TestCase` interfaces with same name but different purposes:

**types.ts** (Database Model):
```typescript
export interface TestCase {
  id: number;
  evaluationId: number;
  input: string;
  expectedOutput: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
```

**testing.ts** (Test Suite Model):
```typescript
export interface TestCase {
  id?: string;
  input: string;
  expected?: string;
  metadata?: Record<string, unknown>;
  assertions?: ((output: string) => AssertionResult)[];
}
```

**Impact**:
- Confusing for developers
- IDE autocomplete shows wrong interface
- Only `types.ts` version is exported from index.ts (line 117)
- Could cause type errors if both are imported

**Severity**: MEDIUM - Causes confusion but only types.ts version is publicly exported

---

### 3. **Dynamic Import Pattern in export.ts** 🟢 LOW PRIORITY

**Files**: `export.ts` (lines 296, 316)

**Pattern**:
```typescript
const fs = await import('fs');
fs.writeFileSync(filePath, ...);
```

**Issue**: 
- Dynamic import returns a module namespace object
- Works but is unusual pattern (normally use static imports in Node.js-only files)
- Could fail in some bundler configurations

**Impact**: 
- Works but non-standard
- Tree-shaking friendly but unnecessary for Node.js-only code
- Some bundlers might have issues

**Severity**: LOW - Works but not best practice

---

### 4. **TypeScript Module Configuration** 🟢 INFO

**File**: `tsconfig.json`

**Current**:
```json
{
  "module": "commonjs"
}
```

**Observation**: 
- Using CommonJS but package.json has ES module exports
- CLI uses `.js` extensions in imports (which is correct for ES modules)
- Mismatch between TypeScript config and runtime expectations

**Impact**: 
- May cause issues with module resolution
- CLI imports might not work as expected
- Bundlers might be confused

**Severity**: LOW - Currently working but could cause subtle issues

---

## 📊 Summary

| Issue | Severity | Status | Impact | Affected |
|-------|----------|--------|--------|----------|
| process.env in browser | 🔴 HIGH | ✅ FIXED | Works in browsers | Core client |
| TestCase collision | 🟡 MEDIUM | 🟡 OPEN | Developer confusion | Types |
| Dynamic imports | 🟢 LOW | 🟢 OPEN | Unusual pattern | export.ts |
| Module config | 🟢 INFO | 🟢 OPEN | Potential confusion | Build system |

---

## ✅ Recommended Fixes

### ✅ Fix 1: Safe process.env Access - COMPLETED

**Status**: ✅ **IMPLEMENTED**

Added helper function:
```typescript
// client.ts (lines 66-71)
function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}
```

**Applied to all locations**:
- Line 123: `getEnvVar('EVALAI_API_KEY')`
- Line 135: `getEnvVar('EVALAI_ORGANIZATION_ID')`  
- Line 264: `getEnvVar('EVALAI_BASE_URL')`

### Fix 2: Rename Test Suite TestCase

Rename in `testing.ts`:
```typescript
export interface TestSuiteCase {  // Was: TestCase
  id?: string;
  input: string;
  expected?: string;
  // ...
}
```

### Fix 3: Static Imports in export.ts

Since already checked for Node.js environment:
```typescript
import * as fs from 'fs';  // Instead of: const fs = await import('fs')
```

### Fix 4: Consider ES Modules

Either:
- Change tsconfig to `"module": "es2020"` 
- Or change package.json exports to use `.cjs` extensions

