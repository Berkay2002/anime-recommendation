# Coding Conventions

**Analysis Date:** 2025-01-19

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `AnimeCard.tsx`, `HeroSection.tsx`)
- Services: camelCase with Service suffix (e.g., `animeService.ts`, `jikanService.ts`)
- API routes: camelCase with method-based naming (e.g., `route.ts` for all routes)
- Hooks: camelCase with "use" prefix (e.g., `useDebounce.ts`, `useRecommendations.ts`)
- Utilities: camelCase (e.g., `utils.ts`, `postgres.ts`)

**Functions/Components:**
- React Components: PascalCase (e.g., `const AnimeCard`, `function RootLayout`)
- Regular functions: camelCase (e.g., `getAnime()`, `parseVector()`)
- Hooks: camelCase with "use" prefix (e.g., `useDebounce`, `useFetchData`)
- Arrow functions: Used for callbacks and simple operations

**Variables:**
- Constants: UPPER_SNAKE_CASE for true constants (rarely used)
- Regular variables: camelCase (e.g., `selectedAnime`, `isLoading`)
- State variables: Descriptive names with useState pattern (e.g., `[selectedAnime, setSelectedAnime]`)

**Types/Interfaces:**
- Interfaces: PascalCase with descriptive names (e.g., `interface Anime`, `interface GetAnimeParams`)
- Type aliases: PascalCase (e.g., `type VariantProps`)

## Code Style

**Formatting:**
- ESLint with Next.js configuration (`eslint-config-next`)
- TypeScript with strict mode disabled (`"strict": false`)
- Semicolons: Always used
- Quotes: Double quotes for JSX attributes, single quotes for TypeScript/JavaScript
- Indentation: 2 spaces
- Trailing commas: Not enforced

**Key ESLint Rules:**
- `'no-undef': 'off'` - Disabled due to Next.js/React globals
- `'no-unused-vars': 'off'` - TypeScript handles unused variables

## Import Organization

**Order:**
1. React and Next.js imports
2. Third-party library imports
3. Internal component imports (from `@/components`)
4. Utility/Service imports (from `@/lib`, `@/hooks`)
5. Relative imports (for local files)

**Path Aliases:**
- `@/*` maps to project root (e.g., `@/components/ui/button`)

**Import Patterns:**
```typescript
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
```

## Error Handling

**API Routes:**
- Try-catch blocks for all async operations
- Consistent error response format: `{ message: string }`
- HTTP status codes: 500 for server errors, appropriate codes for client errors
- Console.error for logging server-side errors

**Client Components:**
- Try-catch for JSON parsing operations
- Console.error for debugging
- Graceful fallbacks (e.g., empty arrays, null checks)

**Patterns:**
```typescript
// API route error handling
try {
  // operation
} catch (error) {
  console.error('Descriptive error message:', error);
  return NextResponse.json(
    { message: 'User-friendly error message' },
    { status: 500 }
  );
}

// Client-side error handling
try {
  const data = JSON.parse(savedData)
} catch (parseError) {
  console.error('Failed to parse data:', parseError)
  // Fallback behavior
}
```

## Logging

**Framework:** Console API only (no structured logging framework)

**Patterns:**
- `console.error()` for errors with descriptive messages
- Contextual logging with operation details
- No console.log for production code (mostly removed)

## Comments

**When to Comment:**
- Complex business logic
- API endpoint behavior documentation
- Performance optimizations
- Workarounds or temporary solutions

**Comment Style:**
- Single-line comments with `//`
- Comments above the code they describe
- No JSDoc/TSDoc usage observed

## Function Design

**Size:** Functions tend to be focused and single-purpose

**Parameters:**
- Destructuring used extensively for props and options
- Optional parameters with defaults where appropriate
- Type annotations for all parameters

**Return Values:**
- Explicit return types not commonly used (relying on inference)
- Consistent return patterns within modules

## Module Design

**Exports:**
- Named exports for multiple functions/values
- Default exports for main components
- Barrel exports not commonly used

**Component Structure:**
- Props interfaces defined at top of file
- Helper functions within component files
- Minimal external dependencies per component

## React Patterns

**Component Declaration:**
- Arrow functions for components (e.g., `const ComponentName = () => {}`)
- Function declarations for complex components
- FC type not commonly used

**State Management:**
- useState for local state
- useEffect for side effects and data fetching
- useMemo for expensive computations
- useCallback for stable function references

**Client Components:**
- `"use client"` directive at top of client components
- Proper checks for browser APIs (`typeof window === "undefined"`)

---

*Convention analysis: 2025-01-19*