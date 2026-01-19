---
phase: 02-component-refactoring
plan: 01-B
type: execute
wave: 1
depends_on: ["02-01-A"]
files_modified:
  - frontend/app/anime/[id]/page.tsx
  - frontend/components/AnimeDetailExtraDetails.tsx
  - frontend/components/AnimeDetailReviews.tsx
autonomous: false
user_setup: []

must_haves:
  truths:
    - "AnimeDetailExtraDetails component displays Jikan data tabs (Characters, Staff, Stats)"
    - "AnimeDetailReviews component displays reviews with pagination"
    - "Both components handle loading, error, and empty states correctly"
    - "Main page orchestrates all 5 components cleanly"
    - "No console errors or TypeScript errors"
  artifacts:
    - path: "frontend/components/AnimeDetailExtraDetails.tsx"
      provides: "Jikan details tabs (characters, staff, statistics)"
      min_lines: 100
      max_lines: 180
    - path: "frontend/components/AnimeDetailReviews.tsx"
      provides: "Reviews section with pagination"
      min_lines: 80
      max_lines: 150
    - path: "frontend/app/anime/[id]/page.tsx"
      provides: "Main page orchestrating all components (target ~200 lines)"
      max_lines: 200
  key_links:
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/AnimeDetailExtraDetails.tsx"
      via: "Component import and prop passing (details, loading, error states)"
      pattern: "import AnimeDetailExtraDetails|<AnimeDetailExtraDetails"
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/AnimeDetailReviews.tsx"
      via: "Component import and prop passing (reviews array, pagination state)"
      pattern: "import AnimeDetailReviews|<AnimeDetailReviews"
---

<objective>
Extract the final two sub-components from the anime detail page: ExtraDetails and Reviews, completing the refactoring.

Purpose: Complete breaking down the 749-line page into focused, manageable pieces.
Output: Two additional extracted components (ExtraDetails, Reviews) with main page at ~200 lines.
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
@.planning/phases/02-component-refactoring/02-01-A-SUMMARY.md

@frontend/app/anime/[id]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Extract AnimeDetailExtraDetails component</name>
  <files>
    frontend/components/AnimeDetailExtraDetails.tsx
    frontend/app/anime/[id]/page.tsx
  </files>
  <action>
    Create a new component `AnimeDetailExtraDetails.tsx` for the Jikan details tabs section.

    The component should:
    - Accept props: details (JikanDetails | null), detailsLoading (boolean), detailsError (string | null)
    - Render Tabs component with 3 tabs: Characters, Staff, Stats
    - Each tab shows appropriate table with data from details prop
    - Handle loading state (show detailsSkeleton)
    - Handle error state (show Alert variant="destructive")
    - Handle empty state (show Alert with "no data found" message)

    Props interface:
    ```typescript
    interface AnimeDetailExtraDetailsProps {
      details: JikanDetails | null
      detailsLoading: boolean
      detailsError: string | null
    }
    ```

    Extract the entire section from lines 511-666 (including the section header, Card, Tabs, and all TabsContent blocks).

    Keep the Jikan interfaces (JikanCharacter, JikanStaff, JikanStatistic, JikanDetails) in this component file since they're only used here.

    Include the detailsSkeleton helper function (lines 152-161) in this component.

    Replace in main page with: `<AnimeDetailExtraDetails details={details} detailsLoading={detailsLoading} detailsError={detailsError} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeDetailExtraDetails.tsx
    - Main page imports and uses AnimeDetailExtraDetails
    - Tabs render correctly (Characters, Staff, Stats)
    - Tables display data properly when available
    - Loading and error states work correctly
  </verify>
  <done>
    AnimeDetailExtraDetails component is extracted and displays Jikan data with proper loading/error/empty states.
  </done>
</task>

<task type="auto">
  <name>Extract AnimeDetailReviews component</name>
  <files>
    frontend/components/AnimeDetailReviews.tsx
    frontend/app/anime/[id]/page.tsx
  </files>
  <action>
    Create a new component `AnimeDetailReviews.tsx` for the reviews section with pagination.

    The component should:
    - Accept props: reviews (string[]), reviewsPerPage (number, default 3)
    - Manage internal pagination state (currentPage)
    - Calculate paginatedReviews and totalPages using useMemo
    - Render section header with review count
    - Render ReviewCard components for paginated reviews
    - Render pagination controls (Previous, Page X of Y, Next)
    - Show empty state Alert when no reviews

    Props interface:
    ```typescript
    interface AnimeDetailReviewsProps {
      reviews: string[]
      reviewsPerPage?: number
    }
    ```

    Extract the entire section from lines 668-733 (section header, review cards, pagination).

    Move pagination state (currentPage) and the REVIEWS_PER_PAGE constant into this component.
    Include the paginatedReviews and totalPages useMemo calculations.

    The component should manage its own pagination state internally since it's isolated logic.

    Replace in main page with: `<AnimeDetailReviews reviews={reviews} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeDetailReviews.tsx
    - Main page imports and uses AnimeDetailReviews
    - Reviews display correctly with pagination (3 per page)
    - Pagination controls work (Previous/Next buttons update displayed reviews)
    - Page counter shows "Page X of Y" correctly
    - Empty state displays when no reviews
  </verify>
  <done>
    AnimeDetailReviews component is extracted with internal pagination state and displays reviews correctly.
  </done>
</task>

<task type="checkpoint:human-verify">
  <what-built>
    Complete refactoring of anime detail page from 749 lines to ~200 lines:
    - Extracted 5 focused sub-components (Header, Stats, Skeleton, ExtraDetails, Reviews)
    - Main page now orchestrates data fetching and component composition
    - All existing functionality preserved
  </what-built>
  <how-to-verify>
    1. Start dev server: cd frontend && npm run dev
    2. Navigate to an anime detail page (e.g., http://localhost:3000/anime/1)
    3. Verify page loads and displays correctly:
       - Image, title, genres, description visible
       - Stats grid shows 5 stats
       - Recommendations section displays
       - Extra Details tabs (Characters, Staff, Stats) work
       - Reviews section with pagination works
    4. Check browser console for errors (should be none)
    5. Test loading state: Refresh page and verify skeleton displays
    6. Test navigation: Click "Jump to reviews" button
    7. Check line count of main page: wc -l frontend/app/anime/[id]/page.tsx (should be ~200 lines)
  </how-to-verify>
  <resume-signal>
    Type "approved" if all functionality works correctly, or describe any issues found.
  </resume-signal>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Component Size**: Main page is under 200 lines (wc -l frontend/app/anime/[id]/page.tsx)
2. **TypeScript Compilation**: No TypeScript errors (npx tsc --noEmit)
3. **Build Success**: Project builds without errors (npm run build)
4. **Runtime Verification**: Page loads and displays correctly in browser
5. **Functionality Preservation**:
   - All sections render (header, stats, recommendations, details, reviews)
   - Loading state displays skeleton
   - Pagination works for reviews
   - Tabs switch correctly in extra details section
   - No console errors or warnings

## Success Criteria

- [ ] Main page reduced to ~200 lines
- [ ] 5 sub-components created (Header, Stats, Skeleton, ExtraDetails, Reviews)
- [ ] Each component under 200 lines
- [ ] All functionality preserved
- [ ] No TypeScript errors
- [ ] Page renders correctly in browser
- [ ] Loading state works
- [ ] Pagination works
- [ ] No console errors
</verification>

<success_criteria>
Anime detail page refactoring complete:
- Main page orchestrates data fetching and component composition (~200 lines)
- AnimeDetailHeader: Image, title, genres, description, action buttons
- AnimeDetailStats: Stats grid displaying score, rank, popularity, demographic, rating
- AnimeDetailSkeleton: Loading state with placeholder skeletons
- AnimeDetailExtraDetails: Jikan details tabs (characters, staff, statistics)
- AnimeDetailReviews: Reviews section with internal pagination state

All existing functionality preserved, zero breaking changes, code is more maintainable and reusable.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-01-B-SUMMARY.md`
</output>
