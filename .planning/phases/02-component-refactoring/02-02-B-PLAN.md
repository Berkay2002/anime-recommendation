---
phase: 02-component-refactoring
plan: 02-B
type: execute
wave: 1
depends_on: ["02-02-A"]
files_modified:
  - frontend/app/anime/page.tsx
  - frontend/components/AnimeBrowseGrid.tsx
  - frontend/components/AnimeBrowsePagination.tsx
autonomous: false
user_setup: []

must_haves:
  truths:
    - "AnimeBrowseGrid component displays anime grid with loading/error/empty/success states"
    - "AnimeBrowsePagination component provides pagination controls with numbered pages"
    - "Main page orchestrates all 4 components cleanly"
    - "Page is under 150 lines"
    - "No console errors or TypeScript errors"
  artifacts:
    - path: "frontend/components/AnimeBrowseGrid.tsx"
      provides: "Anime grid with loading, error, empty, and data states"
      min_lines: 80
      max_lines: 150
    - path: "frontend/components/AnimeBrowsePagination.tsx"
      provides: "Pagination controls with numbered pages"
      min_lines: 50
      max_lines: 100
    - path: "frontend/app/anime/page.tsx"
      provides: "Main page orchestrating all components (target ~150 lines)"
      max_lines: 150
  key_links:
    - from: "frontend/app/anime/page.tsx"
      to: "frontend/components/AnimeBrowseGrid.tsx"
      via: "Component import and prop passing (anime list, loading, error states)"
      pattern: "import AnimeBrowseGrid|<AnimeBrowseGrid"
    - from: "frontend/app/anime/page.tsx"
      to: "frontend/components/AnimeBrowsePagination.tsx"
      via: "Component import and prop passing (current page, total pages, page change handler)"
      pattern: "import AnimeBrowsePagination|<AnimeBrowsePagination"
---

<objective>
Extract the final two sub-components from the anime browse page: Grid and Pagination, completing the refactoring.

Purpose: Complete breaking down the 530-line page into focused, manageable pieces.
Output: Two additional extracted components (Grid, Pagination) with main page at ~150 lines.
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
@.planning/phases/02-component-refactoring/02-02-A-SUMMARY.md

@frontend/app/anime/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Extract AnimeBrowseGrid component</name>
  <files>
    frontend/components/AnimeBrowseGrid.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `AnimeBrowseGrid.tsx` that renders the anime grid with all its states.

    The component should:
    - Accept props: animeList (Anime[]), loading (boolean), isInitialLoad (boolean), error (string | null)
    - Handle 4 states:
      1. Initial load: Show skeleton grid (2 columns)
      2. Error: Show Alert variant="destructive" with error message
      3. Empty: Show Alert with "No matches found" message
      4. Success: Show grid of AnimeBrowseCard components
    - Use transition-opacity for loading state (opacity-50 when loading after initial load)

    Props interface:
    ```typescript
    interface AnimeBrowseGridProps {
      animeList: Anime[]
      loading: boolean
      isInitialLoad: boolean
      error: string | null
    }
    ```

    Extract lines ~429-477 (the div with transition-opacity and all its conditional rendering).

    Keep the skeletonPlaceholders array in this component since it's only used for the grid loading state.

    Import AnimeBrowseCard from '@/components/AnimeBrowseCard'

    Replace in main page with: `<AnimeBrowseGrid animeList={animeList} loading={loading} isInitialLoad={isInitialLoad} error={error} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeBrowseGrid.tsx
    - Main page imports and uses AnimeBrowseGrid
    - Initial load displays skeleton grid correctly
    - Error state shows alert with error message
    - Empty state shows "No matches found" alert
    - Success state displays anime cards in 2-column grid
    - Loading state (after initial) shows opacity-50
  </verify>
  <done>
    AnimeBrowseGrid component is extracted and handles all 4 states (loading, error, empty, success).
  </done>
</task>

<task type="auto">
  <name>Extract AnimeBrowsePagination component</name>
  <files>
    frontend/components/AnimeBrowsePagination.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `AnimeBrowsePagination.tsx` for the pagination controls.

    The component should:
    - Accept props: currentPage (number), totalPages (number), onPageChange (page: number) => void
    - Render Pagination component with:
      - Previous button (disabled on page 1)
      - Numbered page links (1 to totalPages)
      - Next button (disabled on last page)
    - Only render when totalPages > 1 and not loading/error
    - Handle click events with e.preventDefault() to prevent anchor jump

    Props interface:
    ```typescript
    interface AnimeBrowsePaginationProps {
      currentPage: number
      totalPages: number
      onPageChange: (page: number) => void
    }
    ```

    Extract lines ~479-525 (the Pagination component with all its items).

    Include the handlePageChange logic in the main page and pass it as onPageChange prop.
    Or, better: Include the handlePageChange logic inside this component since it's simple validation.

    The onPageChange handler should:
    - Check if page is within valid range (1 to totalPages)
    - Call the provided callback
    - Scroll to top of page with smooth behavior

    Replace in main page with: `<AnimeBrowsePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeBrowsePagination.tsx
    - Main page imports and uses AnimeBrowsePagination
    - Pagination displays numbered pages correctly
    - Previous button disabled on page 1
    - Next button disabled on last page
    - Clicking page numbers navigates correctly
    - Page scrolls to top when changing pages
    - Pagination only shows when totalPages > 1
  </verify>
  <done>
    AnimeBrowsePagination component is extracted with full pagination functionality.
  </done>
</task>

<task type="auto">
  <name>Clean up main page component</name>
  <files>
    frontend/app/anime/page.tsx
  </files>
  <action>
    Simplify the main page component to orchestrate data fetching and component composition.

    The main page should now:
    1. Import all 4 extracted components
    2. Manage state:
       - animeList, loading, isInitialLoad, error
       - selectedGenres, currentPage, totalPages, sortBy
    3. Define handlers:
       - handlePageChange (if not in pagination component)
       - toggleGenre, removeGenre (if not in filters component)
    4. Define constants:
       - genreOptions, sortOptions (if not in filters component)
    5. useEffect for fetching anime data
    6. Render:
       - Container div with gap
       - AnimeBrowseHeader
       - AnimeBrowseFilters
       - Selected genre badges (if not in filters)
       - AnimeBrowseGrid
       - AnimeBrowsePagination

    After extraction, the page should be much shorter and easier to read.
    The focus should be on data fetching and state management, not rendering logic.

    Verify that all functionality still works and the page is under 150 lines.
  </action>
  <verify>
    - Main page is under 150 lines (wc -l frontend/app/anime/page.tsx)
    - All 4 components are imported and used
    - Page renders correctly in browser
    - All functionality works (filtering, sorting, pagination)
    - TypeScript compiles without errors
    - No console errors or warnings
  </verify>
  <done>
    Main page component is simplified to orchestrate data fetching and component composition, under 150 lines.
  </done>
</task>

<task type="checkpoint:human-verify">
  <what-built>
    Complete refactoring of anime browse page from 530 lines to ~150 lines:
    - Extracted 4 focused sub-components (Header, Filters, Grid, Pagination)
    - Main page now orchestrates data fetching and component composition
    - All existing functionality preserved (filtering, sorting, pagination)
  </what-built>
  <how-to-verify>
    1. Start dev server: cd frontend && npm run dev
    2. Navigate to anime browse page (http://localhost:3000/anime)
    3. Verify page loads and displays correctly:
       - Header with title and description visible
       - Desktop filter controls (Sort dropdown + Genre popover) work
       - Mobile filter Sheet opens on small screens
       - Genre selection and removal works
       - Sorting works (Popularity, Score, Rank)
       - Anime grid displays cards
       - Pagination controls work
    4. Test filtering: Select genres, verify results update
    5. Test sorting: Change sort option, verify results update
    6. Test pagination: Navigate between pages, verify smooth scroll to top
    7. Check browser console for errors (should be none)
    8. Check line count: wc -l frontend/app/anime/page.tsx (should be ~150 lines)
  </how-to-verify>
  <resume-signal>
    Type "approved" if all functionality works correctly, or describe any issues found.
  </resume-signal>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Component Size**: Main page is under 150 lines (wc -l frontend/app/anime/page.tsx)
2. **TypeScript Compilation**: No TypeScript errors (npx tsc --noEmit)
3. **Build Success**: Project builds without errors (npm run build)
4. **Runtime Verification**: Page loads and displays correctly in browser
5. **Functionality Preservation**:
   - Genre filtering works (desktop popover and mobile sheet)
   - Sort dropdown works (Popularity, Score, Rank)
   - Selected genre badges display and can be removed
   - Clear all genres button works
   - Anime grid displays correctly
   - Loading state shows skeleton
   - Error state shows alert
   - Empty state shows alert
   - Pagination works (page numbers, prev/next buttons)
   - Page scrolls to top on page change

## Success Criteria

- [ ] Main page reduced to ~150 lines
- [ ] 4 sub-components created (Header, Filters, Grid, Pagination)
- [ ] Each component under 180 lines
- [ ] All functionality preserved
- [ ] No TypeScript errors
- [ ] Page renders correctly in browser
- [ ] Filtering works (genres and sort)
- [ ] Pagination works
- [ ] Mobile and desktop layouts work
- [ ] No console errors
</verification>

<success_criteria>
Anime browse page refactoring complete:
- Main page orchestrates data fetching and component composition (~150 lines)
- AnimeBrowseHeader: Page title, description, and loading state
- AnimeBrowseFilters: Genre filter and sort controls (desktop popover + mobile sheet)
- AnimeBrowseGrid: Anime grid with loading/error/empty/success states
- AnimeBrowsePagination: Pagination controls with numbered pages

All existing functionality preserved, zero breaking changes, code is more maintainable and testable.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-02-B-SUMMARY.md`
</output>
