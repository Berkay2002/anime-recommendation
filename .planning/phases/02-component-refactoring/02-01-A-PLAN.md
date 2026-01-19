---
phase: 02-component-refactoring
plan: 01-A
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/app/anime/[id]/page.tsx
  - frontend/components/AnimeDetailHeader.tsx
  - frontend/components/AnimeDetailStats.tsx
  - frontend/components/AnimeDetailSkeleton.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "AnimeDetailHeader component displays anime title, image, genres, description, and action buttons"
    - "AnimeDetailStats component displays 5 stats in a grid layout"
    - "AnimeDetailSkeleton component displays loading state with skeletons"
    - "All three components are imported and used in the main page"
    - "No console errors or TypeScript errors"
  artifacts:
    - path: "frontend/components/AnimeDetailHeader.tsx"
      provides: "Anime title, image, genres, description, action buttons"
      min_lines: 60
      max_lines: 120
    - path: "frontend/components/AnimeDetailStats.tsx"
      provides: "Stats grid (score, rank, popularity, demographic, rating)"
      min_lines: 40
      max_lines: 80
    - path: "frontend/components/AnimeDetailSkeleton.tsx"
      provides: "Loading skeleton for initial page load"
      min_lines: 60
      max_lines: 100
    - path: "frontend/app/anime/[id]/page.tsx"
      provides: "Main page using extracted components"
  key_links:
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/AnimeDetailHeader.tsx"
      via: "Component import and prop passing (anime object)"
      pattern: "import AnimeDetailHeader|<AnimeDetailHeader"
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/AnimeDetailStats.tsx"
      via: "Component import and prop passing (stats array)"
      pattern: "import AnimeDetailStats|<AnimeDetailStats"
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/AnimeDetailSkeleton.tsx"
      via: "Component import for loading state"
      pattern: "import AnimeDetailSkeleton|<AnimeDetailSkeleton"
---

<objective>
Extract the first three sub-components from the anime detail page: Header, Stats, and Skeleton.

Purpose: Begin breaking down the 749-line page into focused, manageable pieces.
Output: Three extracted components (Header, Stats, Skeleton) integrated into the main page.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-component-refactoring/02-CONTEXT.md

@frontend/app/anime/[id]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Extract AnimeDetailHeader component</name>
  <files>
    frontend/components/AnimeDetailHeader.tsx
    frontend/app/anime/[id]/page.tsx
  </files>
  <action>
    Create a new component `AnimeDetailHeader.tsx` that contains:
    - Anime image (Next.js Image component with aspect ratio)
    - Title (h1 heading)
    - Genres badges
    - Description paragraph
    - Action buttons (View full details, Jump to reviews)

    Props interface:
    ```typescript
    interface AnimeDetailHeaderProps {
      anime: Anime
      onJumpToReviews?: () => void
    }
    ```

    Extract the JSX from lines ~432-486 of the current page component into this new component.
    Keep the ButtonRow component (lines 738-749) inside this file as it's only used here.

    Replace the extracted JSX in the main page with: `<AnimeDetailHeader anime={anime} />`

    Use clientLogger.debug for any debugging if needed.
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeDetailHeader.tsx
    - Main page imports and uses AnimeDetailHeader
    - TypeScript compiles without errors: cd frontend && npx tsc --noEmit
    - Page renders correctly in browser (manual verification)
  </verify>
  <done>
    AnimeDetailHeader component is extracted, imports work correctly, and visual rendering is identical to original.
  </done>
</task>

<task type="auto">
  <name>Extract AnimeDetailStats component</name>
  <files>
    frontend/components/AnimeDetailStats.tsx
    frontend/app/anime/[id]/page.tsx
  </files>
  <action>
    Create a new component `AnimeDetailStats.tsx` that renders the stats grid.

    The component should:
    - Accept a `stats` array prop: `Array<{label: string, value: string | number}>`
    - Render a grid (sm:grid-cols-2 lg:grid-cols-3) of stat cards
    - Each stat card shows: label (dt) in uppercase muted text, value (dd) in foreground semibold
    - Use the same styling as the original (rounded-2xl, border, bg-background/60, p-4)

    Props interface:
    ```typescript
    interface AnimeDetailStatsProps {
      stats: Array<{
        label: string
        value: string | number
      }>
    }
    ```

    Extract the stats array mapping (lines 421-427) and the JSX rendering (lines 468-482) into this component.

    Replace in main page with: `<AnimeDetailStats stats={stats} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeDetailStats.tsx
    - Main page imports and uses AnimeDetailStats
    - TypeScript compiles without errors
    - Stats grid displays correctly with proper styling
  </verify>
  <done>
    AnimeDetailStats component is extracted and displays the 5 stats (Score, Rank, Popularity, Demographic, Rating) correctly.
  </done>
</task>

<task type="auto">
  <name>Extract AnimeDetailSkeleton component</name>
  <files>
    frontend/components/AnimeDetailSkeleton.tsx
    frontend/app/anime/[id]/page.tsx
  </files>
  <action>
    Create a new component `AnimeDetailSkeleton.tsx` that renders the loading state.

    The component should:
    - Display skeleton for anime image (aspect-2/3 rectangle)
    - Display skeletons for title, genres, description
    - Display skeletons for 5 stat cards
    - Display skeleton for recommendation section (3 cards)
    - Display skeleton for reviews section (3 review cards)

    Extract the entire loading JSX from lines 322-405 into this component.

    Replace the loading state return in main page with: `return <AnimeDetailSkeleton />`

    Note: Keep the skeleton placeholder arrays (skeletonPlaceholders, etc.) in this component file since they're only used for loading state.
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeDetailSkeleton.tsx
    - Main page imports and uses AnimeDetailSkeleton for loading state
    - Loading skeletons appear correctly before data loads
  </verify>
  <done>
    AnimeDetailSkeleton component is extracted and loading state displays properly.
  </done>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Component Files**: All three component files exist (AnimeDetailHeader, AnimeDetailStats, AnimeDetailSkeleton)
2. **TypeScript Compilation**: No TypeScript errors (npx tsc --noEmit)
3. **Build Success**: Project builds without errors (npm run build)
4. **Runtime Verification**: Page loads and displays correctly in browser
5. **Component Integration**: All three components are imported and used in main page

## Success Criteria

- [ ] 3 components created (Header, Stats, Skeleton)
- [ ] Each component under 120 lines
- [ ] All functionality preserved
- [ ] No TypeScript errors
- [ ] Page renders correctly in browser
- [ ] Loading state works
- [ ] No console errors
</verification>

<success_criteria>
First phase of anime detail page refactoring complete:
- AnimeDetailHeader: Image, title, genres, description, action buttons extracted
- AnimeDetailStats: Stats grid displaying 5 stats extracted
- AnimeDetailSkeleton: Loading state with placeholder skeletons extracted
- All three components integrated into main page
- Page reduced from 749 lines toward 200-line target

All existing functionality preserved, zero breaking changes.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-01-A-SUMMARY.md`
</output>
