---
phase: 02-component-refactoring
plan: 02-A
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/app/anime/page.tsx
  - frontend/components/AnimeBrowseHeader.tsx
  - frontend/components/AnimeBrowseFilters.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "AnimeBrowseHeader component displays page title and description with loading state"
    - "AnimeBrowseFilters component provides genre filter and sort controls for desktop and mobile"
    - "Both components are imported and used in the main page"
    - "No console errors or TypeScript errors"
  artifacts:
    - path: "frontend/components/AnimeBrowseHeader.tsx"
      provides: "Page header with title, description, and loading state"
      min_lines: 80
      max_lines: 150
    - path: "frontend/components/AnimeBrowseFilters.tsx"
      provides: "Genre filter popover/sheet and sort select"
      min_lines: 100
      max_lines: 180
    - path: "frontend/app/anime/page.tsx"
      provides: "Main page using extracted components"
  key_links:
    - from: "frontend/app/anime/page.tsx"
      to: "frontend/components/AnimeBrowseHeader.tsx"
      via: "Component import and prop passing (loading state, isInitialLoad)"
      pattern: "import AnimeBrowseHeader|<AnimeBrowseHeader"
    - from: "frontend/app/anime/page.tsx"
      to: "frontend/components/AnimeBrowseFilters.tsx"
      via: "Component import and prop passing (filter state and handlers)"
      pattern: "import AnimeBrowseFilters|<AnimeBrowseFilters"
---

<objective>
Extract the first two sub-components from the anime browse page: Header and Filters.

Purpose: Begin breaking down the 530-line page into focused, manageable pieces.
Output: Two extracted components (Header, Filters) integrated into the main page.
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

@frontend/app/anime/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Extract AnimeBrowseHeader component</name>
  <files>
    frontend/components/AnimeBrowseHeader.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `AnimeBrowseHeader.tsx` that contains the page header section.

    The component should:
    - Accept props: loading (boolean), isInitialLoad (boolean)
    - Render page title "Explore Anime" and description
    - Show skeleton placeholders when loading
    - Use the same responsive layout (flex-col on mobile, lg:flex-row on desktop)

    Props interface:
    ```typescript
    interface AnimeBrowseHeaderProps {
      loading: boolean
      isInitialLoad: boolean
    }
    ```

    Extract lines ~180-196 (the header div with title and description).

    The filter controls (sort select and genre popover) should NOT be included in this component - they will be extracted separately as AnimeBrowseFilters.

    Keep the Skeleton components for the loading state within this component.

    Replace in main page with: `<AnimeBrowseHeader loading={loading} isInitialLoad={isInitialLoad} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeBrowseHeader.tsx
    - Main page imports and uses AnimeBrowseHeader
    - TypeScript compiles without errors
    - Header displays correctly with title and description
    - Loading state shows skeleton placeholders
  </verify>
  <done>
    AnimeBrowseHeader component is extracted and displays the page header with loading state.
  </done>
</task>

<task type="auto">
  <name>Extract AnimeBrowseFilters component</name>
  <files>
    frontend/components/AnimeBrowseFilters.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `AnimeBrowseFilters.tsx` that contains all filter controls.

    The component should:
    - Accept props:
      - sortBy: SortOption (current sort value)
      - onSortChange: (value: SortOption) => void
      - selectedGenres: GenreOption[]
      - onGenreToggle: (genre: GenreOption) => void
      - onGenreRemove: (genre: GenreOption) => void
      - onClearGenres: () => void
      - loading: boolean
      - isInitialLoad: boolean
    - Render desktop filters (Sort Select + Genre Popover) on md screens and up
    - Render mobile filter Sheet on small screens with the full filter UI
    - Handle both desktop and mobile layouts

    Props interface:
    ```typescript
    interface AnimeBrowseFiltersProps {
      sortBy: SortOption
      onSortChange: (value: SortOption) => void
      selectedGenres: GenreOption[]
      onGenreToggle: (genre: GenreOption) => void
      onGenreRemove: (genre: GenreOption) => void
      onClearGenres: () => void
      loading: boolean
      isInitialLoad: boolean
    }
    ```

    Extract lines ~197-384 (the entire filter controls section including desktop popover and mobile sheet).

    Keep the genreOptions and sortOptions arrays in this component file since they're specific to filtering.

    Include the genrePopoverOpen and filterSheetOpen state management in this component since it's internal UI state.

    Replace the filter controls div in main page with: `<AnimeBrowseFilters sortBy={sortBy} onSortChange={setSortBy} selectedGenres={selectedGenres} onGenreToggle={toggleGenre} onGenreRemove={removeGenre} onClearGenres={() => setSelectedGenres([])} loading={loading} isInitialLoad={isInitialLoad} />`
  </action>
  <verify>
    - Component file exists at frontend/components/AnimeBrowseFilters.tsx
    - Main page imports and uses AnimeBrowseFilters
    - Desktop filters display correctly (Sort Select + Genre Popover)
    - Mobile filter Sheet opens and displays controls
    - Genre selection works in both desktop and mobile
    - Sort dropdown works correctly
    - TypeScript compiles without errors
  </verify>
  <done>
    AnimeBrowseFilters component is extracted with full desktop and mobile filter functionality.
  </done>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Component Files**: Both component files exist (AnimeBrowseHeader, AnimeBrowseFilters)
2. **TypeScript Compilation**: No TypeScript errors (npx tsc --noEmit)
3. **Build Success**: Project builds without errors (npm run build)
4. **Runtime Verification**: Page loads and displays correctly in browser
5. **Component Integration**: Both components are imported and used in main page
6. **Functionality**: Header displays correctly, filters work on desktop and mobile

## Success Criteria

- [ ] 2 components created (Header, Filters)
- [ ] Each component under 180 lines
- [ ] All functionality preserved
- [ ] No TypeScript errors
- [ ] Page renders correctly in browser
- [ ] Filters work on desktop
- [ ] Filters work on mobile
- [ ] No console errors
</verification>

<success_criteria>
First phase of anime browse page refactoring complete:
- AnimeBrowseHeader: Page title, description, and loading state extracted
- AnimeBrowseFilters: Genre filter and sort controls (desktop popover + mobile sheet) extracted
- Both components integrated into main page
- Page reduced from 530 lines toward 150-line target

All existing functionality preserved, zero breaking changes.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-02-A-SUMMARY.md`
</output>
