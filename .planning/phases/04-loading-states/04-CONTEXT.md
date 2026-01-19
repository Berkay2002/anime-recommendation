# Phase 4: Loading States - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

## Phase Boundary

Improve user experience with visual feedback during data fetching, API operations, and long-running processes. This phase covers skeleton loaders, loading indicators, progress bars, and loading state management. It does NOT include performance optimization (Phase 5) or error recovery (Phase 6).

## Implementation Decisions

### Skeleton Loader Design
- **Visual style**: Shimmer gradient animation (like LinkedIn, YouTube)
- **Detail level**: Content-aware shapes (multiple text lines with varying widths, proper image aspect ratios)
- **Animation timing**: Slow cycle (1.5-2 seconds) for calm, less distracting feel
- **Colors**: Theme-aware grays (automatic light/dark mode adaptation)
- **Corners**: Match content radius (rounded-lg for cards, rounded-md for smaller items)
- **Image skeletons**: Simple gray box (anime poster images)
- **Text line width**: Varied by content (title lines wide, subtitle/genre lines narrower)
- **Grid page skeletons**: Match page size (show exact number of items that will appear)
- **Component architecture**: Different skeleton components for list vs grid layouts

### Loading Timing and Thresholds
- **Spinner delay**: Short delay (100-200ms) to prevent flickering for fast operations
- **Minimum display time**: Instant hide (no minimum to prevent flash-of-content)
- **Slow operation threshold**: Show loading indicators for operations taking 200ms or longer
- **Initial page load**: Delayed (100-200ms) before showing skeletons to prevent flicker on fast loads

### Progress Indication for Long Operations
- **Progress type**: Hybrid approach — start indeterminate, switch to determinate when progress is trackable
- **Progress messaging**: Contextual step updates ("Finding similar anime...", "Analyzing preferences...")
- **Progress placement**: Section-level inline (in recommendations section, rest of page visible)
- **Cancellation option**: Show cancel button for user control

### Consistency Across Pages
- **Component approach**: Reusable components (LoadingSpinner, SkeletonCard, ProgressBar)
- **Transition effects**: Framer Motion transitions (fade-in, slide-up, scale animations)
- **Accessibility**: Complete ARIA attributes (role='status', aria-live='polite', aria-busy, aria-label)
- **Design system integration**: Follow existing Tailwind colors (muted, border, primary) and spacing scale

### Claude's Discretion
- Exact shimmer gradient colors and animation easing curves
- Specific transition durations and timing functions
- Skeleton component internal implementation details
- Progress bar visual design (height, color, border radius)
- Loading spinner size variants (small, medium, large)

## Specific Ideas

- Shimmer animation should feel calm and professional, not frenetic
- Skeleton loaders should mirror actual content structure closely for perceived performance
- Progress messages should be actionable and help users understand what's happening
- Transitions should feel smooth but not slow down the overall experience
- Accessibility is critical — loading states must be screen reader friendly

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 04-loading-states*
*Context gathered: 2026-01-19*
