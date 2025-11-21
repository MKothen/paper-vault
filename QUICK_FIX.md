# Quick Fix Guide for Import Errors

## Issue: "does not provide an export named 'Paper'"

This is a common Vite/TypeScript module resolution issue. Here are the solutions:

## Solution 1: Restart Dev Server (Most Common)

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

Vite caches modules and sometimes doesn't pick up new files immediately.

## Solution 2: Clear Vite Cache

```bash
# Delete node_modules/.vite
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

## Solution 3: Verify File Extensions

Make sure imports use explicit `.ts` extension in some cases:

**In AnalyticsDashboard.tsx, try:**
```typescript
import { Paper, ReadingSession } from '../types.ts'; // Add .ts
```

**Or without extension:**
```typescript
import type { Paper, ReadingSession } from '../types';
```

## Solution 4: Update tsconfig.json

Ensure your `tsconfig.json` has proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

## Solution 5: Alternative Import Pattern

If above don't work, use this pattern:

**Create src/types/index.ts:**
```typescript
export * from './paper';
export * from './filters';
// etc.
```

**Then import:**
```typescript
import { Paper } from '../types';
```

## Solution 6: Inline Type (Temporary)

As a temporary workaround, define types directly in the component:

**In AnalyticsDashboard.tsx:**
```typescript
interface Paper {
  id: string;
  title: string;
  status: string;
  createdAt: number;
  tags?: string[];
  totalReadingTime?: number;
  // ... other fields you need
}

interface ReadingSession {
  paperId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}
```

## Most Likely Solution

**99% of the time, this works:**

1. **Stop the dev server** (Ctrl+C)
2. **Delete Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Restart:**
   ```bash
   npm run dev
   ```

## If Error Persists

Check if the component files are correctly importing:

**AnalyticsDashboard.tsx should have:**
```typescript
import type { Paper, ReadingSession } from '../types';
```

**MultiFilterSidebar.tsx should have:**
```typescript
import type { FilterState, Paper } from '../types';
```

The `type` keyword is important for type-only imports.

## Verification

After fix, you should see:
- No import errors in terminal
- Dev server running without warnings
- Components render correctly

## Need More Help?

If none of these work, share:
1. Your `tsconfig.json` content
2. Your `vite.config.ts` content
3. Exact error message from browser console
