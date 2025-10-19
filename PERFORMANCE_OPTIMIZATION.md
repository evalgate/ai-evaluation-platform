# Performance Optimization Guide

## 🚀 Implemented Optimizations

### 1. Font Loading (FIXED)

- ✅ Switched from Google Fonts to local Geist fonts (faster)
- ✅ Added proper font classes to HTML
- ✅ Font variables properly configured

### 2. Code Splitting

- ✅ Dynamic imports for AppSidebar and AppHeader in authenticated layout
- ✅ SSR disabled for heavy components
- ✅ Loading states for better UX

### 3. Next.js Config Optimizations

- ✅ Package imports optimized (lucide-react, date-fns, Radix UI)
- ✅ CSS optimization enabled
- ✅ Server React optimization enabled
- ✅ Console.log removed in production
- ✅ Image optimization configured (AVIF/WebP)

## ⚡ Additional Performance Improvements Needed

### Priority 1: High Impact

#### A. Convert Pages to Server Components

Many pages are using `"use client"` unnecessarily. Convert these to Server Components:

**Current Issues:**

- `src/app/(authenticated)/evaluations/page.tsx` - Should be Server Component
- `src/app/(authenticated)/traces/page.tsx` - Should be Server Component
- `src/app/(authenticated)/dashboard/page.tsx` - Should be Server Component
- `src/app/page.tsx` (home page) - Check if it needs "use client"

**How to Fix:**

1. Remove `"use client"` directive
2. Move data fetching to Server Components
3. Only use `"use client"` for components that need:
   - `useState`, `useEffect`, `useRouter` (client hooks)
   - Event handlers (onClick, onChange, etc.)
   - Browser APIs

#### B. Add Dynamic Imports for Heavy Components

```typescript
// Instead of:
import { EvaluationBuilder } from "@/components/evaluation-builder"

// Use:
const EvaluationBuilder = dynamic(
  () => import('@/components/evaluation-builder').then(m => m.EvaluationBuilder),
  {
    loading: () => <Skeleton className="h-96" />,
    ssr: false
  }
)
```

**Heavy components to lazy load:**

- EvaluationBuilder
- Charts (Recharts components)
- Rich text editors
- Dialog/Modal contents
- Tab contents

#### C. Database Query Optimization

```typescript
// Use Server Components for data fetching:
async function getEvaluations(orgId: number) {
  const evals = await db.query.evaluations.findMany({
    where: eq(evaluations.organizationId, orgId),
    limit: 20, // Add pagination
    orderBy: desc(evaluations.createdAt)
  })
  return evals
}

export default async function EvaluationsPage() {
  const session = await auth()
  const evals = await getEvaluations(session.user.organizationId)

  return <EvaluationsList evaluations={evals} />
}
```

### Priority 2: Medium Impact

#### D. Image Optimization

```typescript
// Always use Next.js Image component:
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

#### E. Bundle Analysis

Run bundle analyzer to find large dependencies:

```bash
npm install --save-dev @next/bundle-analyzer

# Add to next.config.ts:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run:
ANALYZE=true npm run build
```

#### F. Reduce Client-Side JavaScript

Current heavy dependencies:

- `recharts` (167 KB) - Only load when needed
- `framer-motion` (81 KB) - Use for animations only
- `@radix-ui/*` - Already optimized in config

**Solution:**

```typescript
// Lazy load charts:
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);
```

### Priority 3: Low Impact (Nice to Have)

#### G. Add Loading States

```typescript
// app/(authenticated)/evaluations/loading.tsx
export default function Loading() {
  return <EvaluationsSkeleton />
}
```

#### H. Implement React Server Actions

```typescript
// Instead of API routes for mutations:
"use server";

export async function createEvaluation(formData: FormData) {
  const name = formData.get("name");
  // ... create evaluation
  revalidatePath("/evaluations");
}
```

#### I. Enable Partial Prerendering (Experimental)

```typescript
// next.config.ts
experimental: {
  ppr: true, // Partial Prerendering
}
```

## 📊 Performance Metrics to Track

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **FID (First Input Delay)**: Target < 100ms
- **CLS (Cumulative Layout Shift)**: Target < 0.1

### Lighthouse Scores (Target: 90+)

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## 🔍 Performance Debugging

### 1. Check Page Load Speed

```bash
# Use Lighthouse in Chrome DevTools
# Or run Lighthouse CI:
npm install -g @lhci/cli
lhci autorun
```

### 2. React DevTools Profiler

1. Install React DevTools browser extension
2. Open Profiler tab
3. Record interaction
4. Look for slow components (red/yellow bars)

### 3. Next.js Build Analysis

```bash
npm run build

# Look for:
# - Page sizes (should be < 200 KB first load JS)
# - Number of chunks
# - Static vs dynamic pages
```

### 4. Network Waterfall

1. Open Chrome DevTools → Network tab
2. Reload page
3. Look for:
   - Large files (> 100 KB)
   - Blocking requests
   - Slow API calls

## 🎯 Quick Wins Checklist

- [x] Fix font loading (local Geist fonts)
- [x] Enable package import optimization
- [x] Enable CSS optimization
- [x] Add dynamic imports to authenticated layout
- [x] Convert dashboard page to Server Component with real data fetching
- [x] Add dynamic imports for all Charts (Recharts)
- [x] Add dynamic imports for EvaluationBuilder
- [x] Implement proper loading states (dashboard, evaluations, traces)
- [x] Add React.memo() to expensive components (HomeFeatures)
- [x] Add pagination to large lists (evaluations, traces - limit 20)
- [x] Split home page into separate components (HomeHero, HomeFeatures)
- [ ] Use React.useMemo() for expensive calculations (if needed)
- [ ] Implement virtual scrolling for long lists (optional)
- [ ] Run bundle analysis to verify improvements

## 🚦 Before/After Metrics

### Before Optimization

- First Load JS: ? KB
- LCP: ? s
- TTI: ? s

### After Optimization (Target)

- First Load JS: < 200 KB
- LCP: < 2.5 s
- TTI: < 3.5 s

---

**Next Steps:**

1. Run `npm run build` to see current bundle sizes
2. Implement Priority 1 fixes
3. Test with Lighthouse
4. Measure improvements
5. Move to Priority 2 fixes
