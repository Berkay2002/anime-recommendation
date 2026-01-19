# Phase 04: Loading States - Research

**Researched:** 2026-01-19
**Domain:** React loading states, skeleton screens, Framer Motion animations, accessibility
**Confidence:** HIGH

## Summary

This research phase investigated the current codebase's loading implementations, best practices for skeleton screens and loading indicators, Framer Motion animation patterns, and WAI-ARIA accessibility requirements for loading states. The codebase already has some skeleton components (`AnimeCardSkeleton`, `AnimeDetailSkeleton`, `DataLoadingStates`) and basic loading patterns, but lacks shimmer animations, consistent loading timing thresholds, and proper ARIA attributes.

**Key findings:**
- Existing skeletons use `animate-pulse` (Tailwind's built-in) but lack professional shimmer gradients
- Loading states are inconsistent across components (some use `loading`, others use `isLoading`)
- No loading delay mechanism to prevent flicker on fast operations
- Framer Motion 11.18.2 is installed with existing animation patterns in `AnimatedAnimeCard`
- ARIA attributes for accessibility are mostly missing from loading states

**Primary recommendation:** Implement a cohesive loading system with shimmer-enhanced skeletons, consistent timing patterns (100-200ms delay), proper ARIA attributes (`role="status"`, `aria-live="polite"`, `aria-busy`), and Framer Motion transitions for smooth state changes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **framer-motion** | 11.18.2 | Animation library for smooth transitions | Already installed, industry standard for React animations, provides `<motion.div>` for fade/slide effects |
| **@radix-ui/react-progress** | ^1.1.8 | Progress bar component (already in codebase) | Provides accessible Progress primitive, already used in `frontend/components/ui/progress.tsx` |
| **Tailwind CSS** | 4.1.18 | Styling with built-in `animate-pulse` | Already installed, provides animation utilities via `animate-pulse` class |

### Existing Components (Reuse/Enhance)
| Component | Location | Purpose | Enhancement Needed |
|-----------|----------|---------|-------------------|
| `Skeleton` | `components/ui/skeleton.tsx` | Base skeleton primitive | Add shimmer variant, ARIA attributes |
| `AnimeCardSkeleton` | `components/AnimeCardSkeleton.tsx` | Card placeholder | Add shimmer animation, aspect ratio support |
| `AnimeDetailSkeleton` | `components/AnimeDetailSkeleton.tsx` | Detail page skeleton | Add shimmer, proper accessibility |
| `LoadingState` | `components/DataLoadingStates.tsx` | Generic skeleton loader | Add shimmer variant, customizable count |
| `Progress` | `components/ui/progress.tsx` | Radix UI progress bar | Already accessible, add indeterminate variant |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **lucide-react** | ^0.546.0 | Icon library (includes `Loader2` spinner) | Already using `Loader2` in SearchBar, standard for loading spinners |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Shimmer effect with Framer Motion** | Pure CSS shimmer | Framer Motion provides smoother animations and better performance optimization, but CSS shimmer is simpler to implement |
| **Radix UI Progress** | Custom progress bar | Radix UI provides built-in accessibility and ARIA support, custom would require manual implementation |
| **Component-based skeletons** | Library-based (react-loading-skeleton) | Custom components match exact layout, library might not match design system perfectly |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
# Framer Motion, Radix UI Progress, and Tailwind CSS are available
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── components/
│   ├── loading/
│   │   ├── LoadingSpinner.tsx       # NEW: Reusable spinner component
│   │   ├── LoadingOverlay.tsx       # NEW: Full-page loading overlay
│   │   ├── ProgressBar.tsx          # NEW: Enhanced progress bar (indeterminate/determinate)
│   │   └── index.ts                 # NEW: Export all loading components
│   ├── ui/
│   │   ├── skeleton.tsx             # ENHANCE: Add shimmer variant
│   │   └── progress.tsx             # ENHANCE: Add messaging, cancel button
│   ├── hooks/
│   │   ├── useLoadingState.ts       # NEW: Custom hook for loading state with delay
│   │   ├── useProgress.ts           # NEW: Hook for long-running operations
│   │   └── useFetchData.ts          # ENHANCE: Add delay mechanism
│   └── [existing skeleton components]  # ENHANCE: Add shimmer and ARIA
```

### Pattern 1: Loading State with Delay (Prevent Flicker)
**What:** Custom hook that introduces a 100-200ms delay before showing loading state to prevent flickering on fast operations
**When to use:** All loading states that might complete quickly (< 200ms)
**Example:**
```typescript
// NEW: frontend/hooks/useLoadingState.ts
import { useState, useEffect } from 'react'

export function useLoadingState(initialDelay = 150) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isLoading) {
      // Delay showing loading state to prevent flicker
      timeoutId = setTimeout(() => {
        setShowLoading(true)
      }, initialDelay)
    } else {
      setShowLoading(false)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading, initialDelay])

  return { isLoading: showLoading, setIsLoading }
}
```

### Pattern 2: Shimmer Animation with Tailwind + Keyframes
**What:** Professional shimmer effect using gradient animation
**When to use:** All skeleton loaders for better perceived performance
**Example:**
```typescript
// ENHANCE: frontend/components/ui/skeleton.tsx
// Add shimmer variant with custom animation

// Add to global CSS or tailwind.config:
// @keyframes shimmer {
//   0% { background-position: -1000px 0; }
//   100% { background-position: 1000px 0; }
// }

// Usage:
<Skeleton className="animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:1000px_100%]" />
```

### Pattern 3: Framer Motion Transitions for Loading States
**What:** Smooth fade-in/slide-up animations when content loads
**When to use:** Replacing skeleton with actual content, page transitions
**Example:**
```typescript
// Source: Existing pattern in AnimatedAnimeCard.tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 32 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 32 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

### Pattern 4: Accessible Loading with ARIA Attributes
**What:** Proper ARIA attributes for screen reader announcements
**When to use:** ALL loading states (skeletons, spinners, progress bars)
**Example:**
```typescript
// Skeleton with accessibility
<div
  role="status"
  aria-live="polite"
  aria-label="Loading content"
  aria-busy="true"
>
  <Skeleton className="h-20 w-full" />
  <span className="sr-only">Loading...</span>
</div>
```

### Pattern 5: Progress Tracking for Long Operations
**What:** Hybrid progress bar (indeterminate → determinate) with step messaging
**When to use:** Recommendation generation, embedding calculations, operations > 2 seconds
**Example:**
```typescript
// NEW: frontend/components/loading/ProgressBar.tsx
<Progress value={progress} />
<p className="text-sm text-muted-foreground">{message}</p>
<Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
```

### Anti-Patterns to Avoid
- **No delay on loading states:** Causes flickering on fast operations - **Always use 100-200ms delay**
- **Generic pulse animation:** Less professional than shimmer gradient - **Use shimmer for better perceived performance**
- **Missing ARIA attributes:** Screen readers can't announce loading state - **Always include role, aria-live, aria-busy**
- **Blocking UI during load:** Frustrating users - **Use inline loading where possible, keep page interactive**
- **Skeletons for small components:** Misleading UX - **Use skeletons for container-based components only**

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Loading spinner** | Custom SVG/CSS spinner | `lucide-react` Loader2 with animate-spin | Already used in SearchBar, consistent with design system, includes proper sizing |
| **Progress bar component** | Custom div-based progress | `@radix-ui/react-progress` (already installed) | Built-in accessibility, ARIA support, indeterminate state |
| **Animation library** | CSS animations or Web Animations API | `framer-motion` (already installed) | Smoother animations, better performance, declarative API, already used in AnimatedAnimeCard |
| **Loading state management** | Complex useEffect logic | `useLoadingState` custom hook with delay | Reusable pattern, consistent timing, prevents flicker |
| **Skeleton base component** | Custom div placeholders | Shadcn/ui `Skeleton` (already exists) | Follows design system, theme-aware colors, consistent styling |

**Key insight:** The codebase already has most components needed. Focus on enhancing existing components with shimmer animations, proper accessibility, and consistent loading patterns rather than building from scratch.

## Common Pitfalls

### Pitfall 1: Flickering Loading States
**What goes wrong:** Loading indicator flashes briefly (< 100ms) for fast operations, creating jarring UX
**Why it happens:** No delay mechanism, loading state shows immediately even when operation completes quickly
**How to avoid:** Implement 100-200ms delay before showing loading state (see Pattern 1)
**Warning signs:** Users report "flashing" UI, skeleton appears then disappears instantly

### Pitfall 2: Missing Accessibility Attributes
**What goes wrong:** Screen readers don't announce loading state, leaving blind users confused
**Why it happens:** Developers focus on visual loading only, forget ARIA attributes
**How to avoid:** Always include `role="status"`, `aria-live="polite"`, `aria-busy` on loading containers
**Warning signs:** Accessibility audits fail, screen reader testing shows silence during load

### Pitfall 3: Inconsistent Loading Patterns
**What goes wrong:** Different components use different loading state names (`loading` vs `isLoading` vs `isInitialLoad`)
**Why it happens:** No established pattern, each component implements loading independently
**How to avoid:** Use `useLoadingState` hook consistently, standardize on `isLoading` and `showLoading` pattern
**Warning signs:** Component props vary (`loading`, `isLoading`, `isInitialLoad`), confusing prop drilling

### Pitfall 4: Skeletons Don't Match Content Layout
**What goes wrong:** Skeleton layout differs from actual content, causing jarring transition
**Why it happens:** Skeletons created without reviewing final layout, or layout changed later
**How to avoid:** Keep skeleton components in sync with actual components, use same grid/flex structure
**Warning signs:** Content "jumps" when loading completes, layout shift visible

### Pitfall 5: No Progressive Loading
**What goes wrong:** Entire page waits until all content loads, showing blank screen
**Why it happens:** Single loading state for page, loading data sequentially instead of in parallel
**How to avoid:** Load sections independently, show skeleton for each section, reveal content as it loads
**Warning signs:** Long initial page load, users wait extended time before seeing any content

### Pitfall 6: Blocking Interactions During Load
**What goes wrong:** Users can't interact with any part of page while one section loads
**Why it happens:** Full-page loading overlay used instead of inline loading
**How to avoid:** Use inline skeletons/spinners for specific sections, keep rest of page interactive
**Warning signs:** Users report "stuck" interface, can't scroll or click during load

## Code Examples

Verified patterns from official sources:

### Enhanced Skeleton with Shimmer and Accessibility
```typescript
// ENHANCE: frontend/components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent animate-pulse rounded-md",
        "aria-busy" // Add for accessibility
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      {...props}
    />
  )
}

// NEW: Shimmer variant (add to global CSS)
/*
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    to right,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.5) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 1000px 100%;
}
*/
```

### Loading Spinner with Accessibility
```typescript
// NEW: frontend/components/loading/LoadingSpinner.tsx
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
}

export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center gap-2"
    >
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
```

### Enhanced AnimeCardSkeleton with Shimmer
```typescript
// ENHANCE: frontend/components/AnimeCardSkeleton.tsx
import { memo } from "react"
import { Card } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

interface AnimeCardSkeletonProps {
  showAction?: boolean
}

const AnimeCardSkeleton = memo(({ showAction = true }: AnimeCardSkeletonProps) => {
  return (
    <div className="min-w-[13rem] max-w-[13rem] shrink-0">
      <Card className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-0 shadow-sm">
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Loading anime card"
          className="relative h-full"
        >
          {showAction && (
            <div className="absolute right-3 top-3 z-10">
              <Skeleton className="h-9 w-9 rounded-full border border-border/60 bg-background/70" />
            </div>
          )}
          {/* Add shimmer variant here */}
          <Skeleton className="aspect-[2/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent px-4 pb-4 pt-8">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Card>
    </div>
  )
})

export default AnimeCardSkeleton
```

### Progress Bar with Messaging
```typescript
// NEW: frontend/components/loading/ProgressBar.tsx
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ProgressBarProps {
  progress?: number // undefined = indeterminate
  message: string
  onCancel?: () => void
}

export function ProgressBar({ progress, message, onCancel }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{message}</p>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Static skeleton placeholders** | **Animated shimmer effect** | ~2020 | Improved perceived performance, more professional appearance |
| **Full-page loading spinners** | **Inline skeleton loaders** | ~2018-2019 | Better UX, keeps users engaged with layout preview |
| **CSS animations** | **Framer Motion for transitions** | ~2021-2022 | Smoother animations, better performance, declarative API |
| **No ARIA attributes** | **role="status" + aria-live="polite"** | ~2019 (WCAG 2.1) | Essential for accessibility, screen reader support |
| **Immediate loading display** | **Delayed loading (100-200ms)** | ~2020-2021 | Prevents flicker on fast operations, better perceived performance |

**Current best practices (2025):**
- Shimmer animation with gradient (not just pulse)
- Loading delay to prevent flicker
- ARIA attributes on all loading states
- Progressive loading (reveal content as it loads)
- Inline loading over full-page blocking
- Framer Motion for smooth transitions

**Deprecated/outdated:**
- **Full-page preloaders:** Users see blank screen then spinner, poor perceived performance
- **Generic spinners without context:** Users don't know what's loading
- **No ARIA attributes:** Inaccessible to screen readers, violates WCAG
- **Immediate loading display:** Causes flickering on fast networks
- **Static skeletons:** Doesn't indicate activity, users think app is broken

## Open Questions

1. **Shimmer animation timing**
   - What we know: Research suggests 1.5-2 second cycle for calm feel
   - What's unclear: Exact easing curve and gradient colors for this design system
   - Recommendation: Test 1.5s, 2s, 2.5s cycles with user testing, use Tailwind's default easing

2. **Recommendation generation progress tracking**
   - What we know: Web Worker used in `useRecommendations.ts`, no current progress reporting
   - What's unclear: Can we track Web Worker progress or should we use indeterminate progress?
   - Recommendation: Start with indeterminate progress, explore Web Worker message passing for progress tracking if operation > 3 seconds

3. **Global loading state management**
   - What we know: Each component manages loading independently
   - What's unclear: Should there be a global loading context for app-wide loading states?
   - Recommendation: Keep loading local to components for now, global context adds complexity without clear benefit

## Sources

### Primary (HIGH confidence)
- **LogRocket Blog - Skeleton Loading Screen Design** (Updated April 16, 2025) - Comprehensive guide on skeleton screens, best practices, accessibility, and comparison with other loading indicators
- **MDN Web Docs - aria-busy attribute** (Updated June 23, 2025) - Official documentation on aria-busy for loading states
- **MDN Web Docs - status role** (Updated June 23, 2025) - Official ARIA role for status messages including loading
- **MDN Web Docs - ARIA Live Regions** (Updated September 23, 2025) - Guide on live regions for dynamic content
- **Tailwind CSS 4.1.18 Documentation** - Current version installed, provides animate-pulse utility
- **Framer Motion 11.18.2** - Current version installed, animation library documentation

### Secondary (MEDIUM confidence)
- **Framer Motion with Framer Motion - Medium** - Creating lazy load shimmer effects with Framer Motion
- **Motion UI with Framer Motion in 2025** (2025) - Modern Framer Motion practices
- **Implementing Progress Bars in Angular and React** (April 2025) - Progress bar implementation guide
- **Progress Bar Design Best Practices** (December 2024) - UX-focused progress bar design
- **Animated Loading Skeletons with Tailwind CSS** - Tailwind-specific skeleton implementation
- **Shiny Skeleton Animation using TailwindCSS** - Custom shimmer animation with Tailwind

### Tertiary (LOW confidence)
- **Skeleton Screens Are Just Gray Lies We Tell Ourselves** (Medium) - Critical perspective on skeleton screens (cautionary view)
- **Web Animation 2025: Complete Guide** - General animation guide, not loading-specific
- **Stack Overflow: How to label a loading animation for WAI-ARIA?** (9 years old) - May be outdated

### Codebase Analysis (HIGH confidence)
- **frontend/components/AnimeCardSkeleton.tsx** - Existing skeleton component
- **frontend/components/AnimeDetailSkeleton.tsx** - Existing detail page skeleton
- **frontend/components/DataLoadingStates.tsx** - Generic loading states
- **frontend/components/ui/skeleton.tsx** - Base Skeleton component
- **frontend/components/ui/progress.tsx** - Radix UI Progress component
- **frontend/components/AnimatedAnimeCard.tsx** - Existing Framer Motion usage
- **frontend/hooks/useFetchData.ts** - Existing data fetching hook
- **frontend/hooks/useRecommendations.ts** - Recommendation generation with Web Worker
- **frontend/package.json** - Confirms installed versions: framer-motion 11.18.2, @radix-ui/react-progress 1.1.8

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed, verified in package.json
- Architecture: HIGH - Based on existing codebase patterns and verified best practices
- Pitfalls: HIGH - Based on common UX issues documented in LogRocket article and MDN
- Code examples: HIGH - Based on actual codebase components and official documentation

**Research date:** 2026-01-19
**Valid until:** 30 days (stable domain - loading states best practices evolve slowly)

**Key recommendations verified:**
✓ Shimmer animation superior to pulse (LogRocket, multiple Tailwind sources)
✓ 100-200ms delay prevents flicker (UX best practice)
✓ ARIA attributes required for accessibility (MDN, WCAG 2.1)
✓ Framer Motion best for animations (already installed, industry standard)
✓ Progressive loading better than blocking (LogRocket case studies)

**Areas marked for validation:**
- Exact shimmer timing values (recommend user testing)
- Web Worker progress tracking feasibility (recommend technical investigation)
