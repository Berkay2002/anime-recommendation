# Phase 2: Component Refactoring - Context

**Gathered:** 2025-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Break down large components (anime detail page: 748 lines, sidebar: 726 lines) into smaller, focused components for better maintainability and reusability. Max 200 lines per component with clear responsibilities.

</domain>

<decisions>
## Implementation Decisions

### Component Extraction Strategy

- **Primary approach**: Extract by reusability — prioritize patterns that can be shared across the app
- **Target component size**: Balanced size (100-200 lines) — maintain focus while reducing file count
- **File structure**:
  - `components/ui/` — primitive UI components (buttons, cards, badges) - already exists
  - `components/` or `components/{common,shared,...}` — larger UI components built upon ui primitives
  - Keep components co-located with their features when feature-specific
- **Extraction threshold**: Extract proactively — identify patterns that seem reusable even if used once currently

### Composition Patterns

- **Priority**: Reduce code duplication — extract patterns that appear repeated
- **Approach**: Simple composition — small pieces combine into larger features
- **Pattern preference**: Keep it straightforward — simple parent/child relationships, no complex patterns initially

### Claude's Discretion

- **Data fetching pattern**: Not specified — recommended to use custom hooks for shared logic, presentational components for UI
- **Exact composition patterns to use**: Flexible — can use container/presentational or compound patterns where appropriate
- **Threshold for extraction**: Flexible — "extract proactively" gives freedom to identify reusable patterns early
- **Folder naming**: Can choose between `components/common`, `components/shared`, or keeping in `components/` root

</decisions>

<specifics>
## Specific Ideas

- "We already have a components/ui folder for primitive ui components that are the foundation"
- Larger UI components built upon ui primitives can be in components/ or a dedicated subfolder (common/shared)
- Focus on duplication reduction as the primary goal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-component-refactoring*
*Context gathered: 2025-01-19*
