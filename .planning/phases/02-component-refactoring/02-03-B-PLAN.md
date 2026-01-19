---
phase: 02-component-refactoring
plan: 03-B
type: execute
wave: 2
depends_on: ["02-03-A"]
files_modified:
  - frontend/components/SectionHeader.tsx
  - frontend/components/DataLoadingStates.tsx
  - frontend/components/Navbar.tsx
  - frontend/app/anime/[id]/page.tsx
  - frontend/app/anime/page.tsx
autonomous: false
user_setup: []

must_haves:
  truths:
    - "SectionHeader component provides consistent section headers across the app"
    - "DataLoadingStates component provides reusable loading/error/empty state components"
    - "Navbar uses SectionHeader for mobile sheet header"
    - "Anime detail and browse pages use SectionHeader and DataLoadingStates"
    - "Code duplication is reduced by at least 30%"
    - "All existing functionality works correctly"
  artifacts:
    - path: "frontend/components/SectionHeader.tsx"
      provides: "Reusable section header with title and description"
      min_lines: 30
      max_lines: 60
    - path: "frontend/components/DataLoadingStates.tsx"
      provides: "Reusable loading/error/empty state components"
      min_lines: 80
      max_lines: 150
    - path: "frontend/components/Navbar.tsx"
      provides: "Simplified navbar using extracted components"
      max_lines: 150
  key_links:
    - from: "frontend/components/Navbar.tsx"
      to: "frontend/components/SectionHeader.tsx"
      via: "Component import for mobile sheet header"
      pattern: "import SectionHeader|<SectionHeader"
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/SectionHeader.tsx"
      via: "Component import for section headers"
      pattern: "import SectionHeader|<SectionHeader"
    - from: "frontend/app/anime/[id]/page.tsx"
      to: "frontend/components/DataLoadingStates.tsx"
      via: "Component import for loading/error/empty states"
      pattern: "import DataLoadingStates|from.*DataLoadingStates"
    - from: "frontend/app/anime/page.tsx"
      to: "frontend/components/DataLoadingStates.tsx"
      via: "Component import for loading/error/empty states"
      pattern: "import DataLoadingStates|from.*DataLoadingStates"
---

<objective>
Create reusable components (SectionHeader, DataLoadingStates) and update existing components to use them.

Purpose: Reduce code duplication across the application and establish consistent patterns for common UI elements.
Output: Two reusable component sets with updated Navbar and pages using them.
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
@.planning/phases/02-component-refactoring/02-03-A-SUMMARY.md

@frontend/components/Navbar.tsx
@frontend/app/anime/[id]/page.tsx
@frontend/app/anime/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Create SectionHeader reusable component</name>
  <files>
    frontend/components/SectionHeader.tsx
    frontend/components/Navbar.tsx
    frontend/app/anime/[id]/page.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `SectionHeader.tsx` that provides a consistent section header pattern.

    The component should:
    - Accept props:
      - title: string - section title
      - description?: string - optional description
      - id?: string - optional id for anchor linking
      - className?: string - optional additional classes
      - titleClassName?: string - optional title classes
      - descriptionClassName?: string - optional description classes
    - Render a consistent header pattern:
      - h2 for title with text-2xl font-semibold tracking-tight
      - p for description with text-sm text-muted-foreground
      - Wrapped in a div with space-y-1
    - Support optional id for anchor navigation

    Component signature:
    ```typescript
    interface SectionHeaderProps {
      title: string
      description?: string
      id?: string
      className?: string
      titleClassName?: string
      descriptionClassName?: string
    }
    ```

    This component is used in multiple places:
    1. Navbar mobile sheet header (lines 70-77)
    2. Anime detail page: Recommendations section (lines 489-498)
    3. Anime detail page: Extra details section (lines 512-519)
    4. Anime detail page: Reviews section (lines 669-681)

    After creating the component, update all these locations to use SectionHeader.
  </action>
  <verify>
    - Component file exists at frontend/components/SectionHeader.tsx
    - Navbar mobile sheet uses SectionHeader
    - Anime detail page uses SectionHeader for 3 sections (Recommendations, Details, Reviews)
    - All section headers display consistently
    - Anchor links work (e.g., #recommendations, #reviews)
    - TypeScript compiles without errors
  </verify>
  <done>
    SectionHeader component is created and used across the app, reducing duplication.
  </done>
</task>

<task type="auto">
  <name>Create DataLoadingStates reusable component</name>
  <files>
    frontend/components/DataLoadingStates.tsx
    frontend/app/anime/[id]/page.tsx
    frontend/app/anime/page.tsx
  </files>
  <action>
    Create a new component `DataLoadingStates.tsx` that provides common loading/error/empty state patterns.

    The component should export multiple sub-components:

    1. **LoadingState**: Displays skeleton loaders
       - Props: count (number), type (default | card)
       - Uses Skeleton components from ui/skeleton

    2. **ErrorState**: Displays error alert
       - Props: message (string), title? (string)
       - Uses Alert from ui/alert

    3. **EmptyState**: Displays empty state alert
       - Props: message (string), title? (string)
       - Uses Alert from ui/alert

    This consolidates the repeated patterns in:
    - Anime detail page (loading skeleton, error alerts, empty alerts)
    - Anime browse page (loading skeleton, error alert, empty alert)

    After creating the component, update:
    1. AnimeBrowseGrid to use LoadingState, ErrorState, EmptyState
    2. AnimeDetailExtraDetails to use ErrorState, EmptyState
    3. AnimeDetailReviews to use EmptyState

    Component structure:
    ```typescript
    export function LoadingState({ count, type }: LoadingStateProps)
    export function ErrorState({ message, title }: ErrorStateProps)
    export function EmptyState({ message, title }: EmptyStateProps)
    ```

    Each component should handle the common patterns so individual pages don't need to repeat Alert JSX.
  </action>
  <verify>
    - Component file exists at frontend/components/DataLoadingStates.tsx
    - AnimeBrowseGrid uses LoadingState, ErrorState, EmptyState
    - AnimeDetailExtraDetails uses ErrorState, EmptyState
    - AnimeDetailReviews uses EmptyState
    - All loading/error/empty states display correctly
    - Code duplication reduced
    - TypeScript compiles without errors
  </verify>
  <done>
    DataLoadingStates component is created and used across the app, reducing duplication of loading/error/empty patterns.
  </done>
</task>

<task type="auto">
  <name>Simplify Navbar component</name>
  <files>
    frontend/components/Navbar.tsx
  </files>
  <action>
    Simplify the Navbar component by using the extracted SectionHeader component.

    After extracting SectionHeader, the Navbar should:
    1. Import SectionHeader from components
    2. Replace the mobile sheet header (lines 70-77) with SectionHeader
    3. Keep the mobile/desktop layout logic
    4. Keep the navigation links and auth buttons
    5. Keep the SearchBar integration

    The mobile sheet header replacement:
    ```typescript
    // Old (lines 70-77):
    <SheetHeader className="space-y-1 text-left">
      <SheetTitle className="text-2xl font-semibold tracking-tight">
        Browse AniMatch
      </SheetTitle>
      <SheetDescription>
        Jump to a page or search for a new series.
      </SheetDescription>
    </SheetHeader>

    // New:
    <SectionHeader
      title="Browse AniMatch"
      description="Jump to a page or search for a new series."
    />
    ```

    Target: Reduce from 180 lines to under 150 lines.
  </action>
  <verify>
    - Navbar uses SectionHeader for mobile sheet header
    - Mobile sheet displays header correctly
    - Desktop navbar works correctly
    - Navigation links work
    - Auth buttons work
    - SearchBar integration works
    - Component is under 150 lines (wc -l frontend/components/Navbar.tsx)
    - TypeScript compiles without errors
  </verify>
  <done>
    Navbar is simplified to under 150 lines using SectionHeader component.
  </done>
</task>

<task type="checkpoint:human-verify">
  <what-built>
    Complete component composition and pattern extraction:
    - Extracted 2 reusable hooks (useKeyboardShortcut, useClickOutside) from plan 02-03-A
    - Created 2 reusable component sets (SectionHeader, DataLoadingStates)
    - Simplified SearchBar from 236 to ~180 lines using hooks
    - Simplified Navbar from 180 to ~150 lines using SectionHeader
    - Updated existing pages to use new reusable components
    - Reduced code duplication across the app
  </what-built>
  <how-to-verify>
    1. Start dev server: cd frontend && npm run dev
    2. Test SearchBar:
       - Type in search, verify results display
       - Press Cmd+K (Mac) or Ctrl+K (Windows), verify search focuses
       - Click outside search, verify dropdown closes
    3. Test Navbar:
       - Open mobile sheet (hamburger menu)
       - Verify sheet header displays correctly
       - Navigate using links
    4. Test Anime Detail Page:
       - Scroll to Recommendations section, verify header displays
       - Scroll to Details section, verify header displays
       - Scroll to Reviews section, verify header displays
       - Check for consistent styling across all section headers
    5. Test Anime Browse Page:
       - Verify loading state displays correctly
       - Trigger an error (disconnect network), verify error alert displays
       - Filter to show no results, verify empty alert displays
    6. Check browser console for errors (should be none)
    7. Check line counts:
       - wc -l frontend/components/SearchBar.tsx (should be ~180)
       - wc -l frontend/components/Navbar.tsx (should be ~150)
  </how-to-verify>
  <resume-signal>
    Type "approved" if all functionality works correctly, or describe any issues found.
  </resume-signal>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Hook Extraction**: useKeyboardShortcut and useClickOutside hooks created and used (from 02-03-A)
2. **Component Creation**: SectionHeader and DataLoadingStates components created
3. **Code Reduction**: SearchBar and Navbar are simplified
4. **Duplication Reduction**: Section headers and loading states are consistent across app
5. **Functionality Preservation**:
   - SearchBar works (typing, results, keyboard shortcut, click outside)
   - Navbar works (mobile sheet, navigation, auth)
   - Section headers display consistently
   - Loading/error/empty states work correctly
6. **TypeScript Compilation**: No errors (npx tsc --noEmit)
7. **Build Success**: Project builds (npm run build)
8. **Runtime Verification**: All pages load and display correctly

## Success Criteria

- [ ] 2 hooks created (useKeyboardShortcut, useClickOutside)
- [ ] 2 component sets created (SectionHeader, DataLoadingStates)
- [ ] SearchBar reduced to ~180 lines
- [ ] Navbar reduced to ~150 lines
- [ ] Section headers consistent across app
- [ ] Loading/error/empty states consistent
- [ ] All functionality preserved
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Code duplication reduced by at least 30%
</verification>

<success_criteria>
Reusable patterns extracted and code duplication reduced:
- useKeyboardShortcut hook: Encapsulates keyboard shortcut logic
- useClickOutside hook: Encapsulates click outside detection
- SectionHeader component: Consistent section headers across app
- DataLoadingStates component: Consistent loading/error/empty states
- SearchBar simplified from 236 to ~180 lines
- Navbar simplified from 180 to ~150 lines
- Code duplication reduced by at least 30%

All existing functionality preserved, zero breaking changes, code is more maintainable and reusable.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-03-B-SUMMARY.md`
</output>
