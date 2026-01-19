---
phase: 02-component-refactoring
plan: 03-A
type: execute
wave: 2
depends_on: ["02-01-A", "02-01-B", "02-02-A", "02-02-B"]
files_modified:
  - frontend/hooks/useKeyboardShortcut.ts
  - frontend/hooks/useClickOutside.ts
  - frontend/components/SearchBar.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "useKeyboardShortcut hook encapsulates keyboard shortcut logic"
    - "useClickOutside hook encapsulates click outside detection logic"
    - "SearchBar component uses both extracted hooks"
    - "SearchBar is simplified to under 180 lines"
    - "All search functionality still works correctly"
  artifacts:
    - path: "frontend/hooks/useKeyboardShortcut.ts"
      provides: "Reusable keyboard shortcut hook"
      min_lines: 40
      max_lines: 80
    - path: "frontend/hooks/useClickOutside.ts"
      provides: "Reusable click outside detection hook"
      min_lines: 30
      max_lines: 60
    - path: "frontend/components/SearchBar.tsx"
      provides: "Simplified search bar using extracted hooks"
      max_lines: 180
  key_links:
    - from: "frontend/components/SearchBar.tsx"
      to: "frontend/hooks/useKeyboardShortcut.ts"
      via: "Hook import for Cmd+K shortcut"
      pattern: "import useKeyboardShortcut|useKeyboardShortcut\\("
    - from: "frontend/components/SearchBar.tsx"
      to: "frontend/hooks/useClickOutside.ts"
      via: "Hook import for click outside detection"
      pattern: "import useClickOutside|useClickOutside\\("
---

<objective>
Extract reusable hooks from SearchBar component and simplify SearchBar to use them.

Purpose: Create reusable hooks that can be used throughout the application and reduce code duplication.
Output: Two extracted hooks (useKeyboardShortcut, useClickOutside) with simplified SearchBar using them.
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
@.planning/phases/02-component-refactoring/02-01-B-SUMMARY.md
@.planning/phases/02-component-refactoring/02-02-B-SUMMARY.md

@frontend/components/SearchBar.tsx
</context>

<tasks>

<task type="auto">
  <name>Extract useKeyboardShortcut hook</name>
  <files>
    frontend/hooks/useKeyboardShortcut.ts
    frontend/components/SearchBar.tsx
  </files>
  <action>
    Create a new hook `useKeyboardShortcut.ts` that encapsulates keyboard shortcut logic.

    The hook should:
    - Accept parameters:
      - keys: string - the key to listen for (e.g., "k")
      - handler: () => void - callback function to execute
      - options: { ctrlOrCmd?: boolean, alt?: boolean, shift?: boolean, preventDefault?: boolean }
    - Set up event listener for keyboard events
    - Check if the pressed key matches the shortcut
    - Check if target element is editable (skip if input/textarea/contentEditable)
    - Clean up event listener on unmount

    Hook signature:
    ```typescript
    interface UseKeyboardShortcutOptions {
      ctrlOrCmd?: boolean
      alt?: boolean
      shift?: boolean
      preventDefault?: boolean
    }

    function useKeyboardShortcut(
      keys: string,
      handler: () => void,
      options?: UseKeyboardShortcutOptions
    ): void
    ```

    Extract the keyboard shortcut logic from SearchBar (lines 54-80).

    In SearchBar, replace the useEffect with:
    ```typescript
    useKeyboardShortcut('k', focusInput, {
      ctrlOrCmd: true,
      preventDefault: true
    })
    ```

    This hook is reusable for any keyboard shortcuts throughout the app.
  </action>
  <verify>
    - Hook file exists at frontend/hooks/useKeyboardShortcut.ts
    - SearchBar imports and uses useKeyboardShortcut
    - Cmd+K / Ctrl+K shortcut still works to focus search
    - Shortcut doesn't trigger when typing in input fields
    - TypeScript compiles without errors
  </verify>
  <done>
    useKeyboardShortcut hook is extracted and SearchBar uses it for Cmd+K shortcut.
  </done>
</task>

<task type="auto">
  <name>Extract useClickOutside hook</name>
  <files>
    frontend/hooks/useClickOutside.ts
    frontend/components/SearchBar.tsx
  </files>
  <action>
    Create a new hook `useClickOutside.ts` that encapsulates click outside detection logic.

    The hook should:
    - Accept parameters:
      - ref: RefObject<HTMLElement> - reference to the container element
      - handler: () => void - callback when click outside is detected
      - enabled: boolean - optional flag to enable/disable detection
    - Set up event listeners for mousedown and touchstart
    - Check if click target is outside the referenced element
    - Clean up event listeners on unmount

    Hook signature:
    ```typescript
    function useClickOutside(
      ref: RefObject<HTMLElement>,
      handler: () => void,
      enabled?: boolean
    ): void
    ```

    Extract the click outside logic from SearchBar (lines 82-97).

    In SearchBar, replace the useEffect with:
    ```typescript
    useClickOutside(containerRef, () => setIsOpen(false), isOpen)
    ```

    This hook is reusable for any dropdown/popover that needs to close on outside click.
  </action>
  <verify>
    - Hook file exists at frontend/hooks/useClickOutside.ts
    - SearchBar imports and uses useClickOutside
    - Search dropdown closes when clicking outside
    - Dropdown stays open when clicking inside
    - TypeScript compiles without errors
  </verify>
  <done>
    useClickOutside hook is extracted and SearchBar uses it for closing dropdown on outside click.
  </done>
</task>

<task type="auto">
  <name>Simplify SearchBar component</name>
  <files>
    frontend/components/SearchBar.tsx
  </files>
  <action>
    Simplify the SearchBar component by using the extracted hooks and cleaning up redundant code.

    After extracting the hooks, the SearchBar should:
    1. Import useKeyboardShortcut and useClickOutside from hooks
    2. Remove the manual keyboard shortcut useEffect (lines 54-80)
    3. Remove the manual click outside useEffect (lines 82-97)
    4. Use the extracted hooks instead
    5. Keep the search logic (query state, results, API call)
    6. Keep the JSX rendering (Command input, results dropdown)

    The component should be significantly shorter and easier to read.
    Focus should be on search functionality, not generic event handling.

    Target: Reduce from 236 lines to under 180 lines.
  </action>
  <verify>
    - SearchBar uses useKeyboardShortcut for Cmd+K
    - SearchBar uses useClickOutside for dropdown closing
    - All search functionality still works:
      - Typing queries works
      - Results display
      - Clicking result navigates to anime page
      - Cmd+K focuses search
      - Clicking outside closes dropdown
    - Component is under 180 lines (wc -l frontend/components/SearchBar.tsx)
    - TypeScript compiles without errors
    - No console errors or warnings
  </verify>
  <done>
    SearchBar is simplified to under 180 lines using extracted hooks.
  </done>
</task>

</tasks>

<verification>
## Overall Verification

After completing all tasks, verify:

1. **Hook Extraction**: Both hooks created and used in SearchBar
2. **Code Reduction**: SearchBar is under 180 lines
3. **Functionality Preservation**:
   - SearchBar works (typing, results, keyboard shortcut, click outside)
   - Cmd+K shortcut focuses search
   - Clicking outside closes dropdown
4. **TypeScript Compilation**: No errors (npx tsc --noEmit)
5. **Build Success**: Project builds (npm run build)
6. **Runtime Verification**: SearchBar functions correctly in browser

## Success Criteria

- [ ] 2 hooks created (useKeyboardShortcut, useClickOutside)
- [ ] SearchBar reduced to ~180 lines
- [ ] All search functionality preserved
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Hooks are reusable for other components
</verification>

<success_criteria>
Reusable hooks extracted from SearchBar:
- useKeyboardShortcut hook: Encapsulates keyboard shortcut logic
- useClickOutside hook: Encapsulates click outside detection
- SearchBar simplified from 236 to ~180 lines
- Both hooks are reusable for other components in the app

All existing functionality preserved, zero breaking changes.
</success_criteria>

<output>
After completion, create `.planning/phases/02-component-refactoring/02-03-A-SUMMARY.md`
</output>
