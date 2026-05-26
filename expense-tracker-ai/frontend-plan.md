# Frontend Improvement Plan

## Tier 1 — High Impact (UX & Core Functionality)

### 1. Add Error Boundaries
- **Files:** `app/page.tsx:86-87`, `components/Dashboard.tsx`
- **Task:** Create an `<ErrorBoundary>` wrapper component; add toast notifications for errors; handle graceful degradation when charts fail to render.

### 2. Fix Accessibility Gaps
- **Files:** `components/ExpenseForm.tsx`, `components/FilterBar.tsx`, `components/ExportHub.tsx`, `components/ExpenseList.tsx:74-75`
- **Tasks:**
  - Add `aria-label` to all icon-only buttons (edit/delete with emojis)
  - Add `role="dialog"` and `aria-modal="true"` to ExportHub modal (`ExportHub.tsx:545`)
  - Add `aria-label` / `aria-describedby` to form inputs
  - Replace generic tab `<button>` elements with proper ARIA tab roles

### 3. Add Error Handling to Forms
- **File:** `components/ExpenseForm.tsx`
- **Task:** Wrap `onSubmit` in try-catch; surface errors via a toast notification; reset form after successful submission.

### 4. Break Up ExportHub Monolith
- **File:** `components/ExportHub.tsx` (~900 lines)
- **Task:** Extract `TemplatesPanel`, `SendSharePanel`, `IntegrationsPanel`, `SchedulePanel`, and `HistoryPanel` into separate files under `components/export/`.

---

## Tier 2 — Code Quality & Maintainability

### 5. Centralize UI State
- **Files:** `app/page.tsx`, `components/ExpenseList.tsx`, `components/ExportHub.tsx`
- **Task:** Create a `useExpenseTrackerUI()` custom hook that owns tab state, form visibility, and filter state to eliminate prop drilling.

### 6. Extract Shared UI Components
- **Files:** `components/ExpenseForm.tsx`, `components/FilterBar.tsx`, `components/ExportHub.tsx`
- **Task:** Create `/components/ui/Button.tsx`, `/components/ui/Input.tsx`, `/components/ui/Select.tsx` with variants (primary, secondary, danger) to replace 15+ repeated Tailwind class strings.

### 7. Move Filter Logic to a Utility
- **File:** `app/page.tsx:20-28`, `components/FilterBar.tsx`
- **Task:** Extract filtering into `lib/utils.ts` as `applyExpenseFilters(expenses, filter)` — single source of truth, easier to test.

### 8. Create a Constants File
- **Files:** `components/ExpenseForm.tsx`, `lib/utils.ts`, `types/expense.ts`
- **Task:** Create `lib/constants.ts` with `CATEGORY_ENUM`, `DATE_FORMAT_ISO`, `STORAGE_VERSION` to eliminate magic strings duplicated in 3+ places.

### 9. Improve Input Validation Feedback
- **File:** `components/ExpenseForm.tsx`
- **Task:** Add conditional `border-red-500` class to inputs when a validation error exists; clear form state after successful submit.

### 10. Strengthen Type Safety
- **File:** `lib/utils.ts:65-69`
- **Task:** Change `getTotalByCategory` return type from `Record<string, number>` to `Partial<Record<Category, number>>`.

---

## Tier 3 — Mobile UX & Responsiveness

### 11. Fix Touch Target Sizes
- **File:** `components/ExpenseList.tsx:74-75`
- **Task:** Increase edit/delete button padding to at least `p-2.5` or add `min-h-10 min-w-10` to meet WCAG 44×44px minimum.

### 12. Fix ExportHub Mobile Layout
- **File:** `components/ExportHub.tsx:550,568`
- **Task:** Hide fixed `w-48` sidebar on small screens; replace with a slide-out or collapsible nav on mobile.

### 13. Validate Chart Responsiveness
- **File:** `components/Dashboard.tsx:44-45,60-61`
- **Task:** Test `ResponsiveContainer` charts on real mobile viewports; add responsive height breakpoints.

---

## Tier 4 — Performance

### 14. Stabilize Chart Tooltip Formatters
- **File:** `components/Dashboard.tsx:48,67`
- **Task:** Wrap `(v) => formatCurrency(Number(v))` in `useCallback` to prevent new function reference on every render.

### 15. Memoize ExportHub Panel Calculations
- **File:** `components/ExportHub.tsx:83,135`
- **Task:** Wrap `filterByTemplate()` calls in `useMemo` so they don't recalculate on every keystroke/render.

### 16. Add List Virtualization
- **Files:** `components/ExpenseList.tsx`, `app/page.tsx`
- **Task:** Implement pagination (20 items/page) or use `react-window` for virtualized rendering of large expense lists.

---

## Tier 5 — UX Flows

### 17. Distinguish Empty States
- **File:** `components/ExpenseList.tsx:17-25`
- **Task:** Show "No expenses. Add one to get started." when list is empty vs. "No expenses match your filters. Try adjusting." when a filter returns nothing.

### 18. Add Unsaved-Changes Guard
- **File:** `components/ExpenseList.tsx:41-48`
- **Task:** Track dirty form state; show confirmation modal ("You have unsaved changes. Discard?") before abandoning an in-progress edit.

### 19. Improve Filter Visibility
- **File:** `components/FilterBar.tsx:53-60`
- **Task:** Always show a "Filters: N active" badge; make the reset button more prominent.

### 20. Add Undo for Deletions
- **Files:** `hooks/useExpenses.ts`, `components/ExpenseList.tsx`
- **Task:** Implement soft delete — mark as deleted, hide immediately, show 5-second undo toast before permanent removal.

---

## Tier 6 — Robustness

### 21. Surface localStorage Corruption
- **File:** `hooks/useExpenses.ts:14-18`
- **Task:** On JSON parse failure, show a warning toast ("Data corrupted. Starting fresh.") rather than silently returning `[]`.

### 22. Validate Date Format at Input Boundary
- **File:** `app/page.tsx:23-24`, `components/ExpenseForm.tsx`
- **Task:** Enforce `YYYY-MM-DD` format on form input; use `Date` objects internally for comparisons.

---

## Quick Wins (< 1 hour each)

| Task | File | Est. Time |
|------|------|-----------|
| Add `aria-label` to icon buttons | `ExpenseList.tsx:74-75` | 10 min |
| Distinguish empty vs. no-filter state | `ExpenseList.tsx:17-25` | 5 min |
| Increase touch target size | `ExpenseList.tsx:74-75` | 5 min |
| Add error toast on form submit failure | `ExpenseForm.tsx` | 10 min |
| Create `/components/ui/Button.tsx` + `Input.tsx` | new files | 45 min |
| Extract ExportHub panels | `ExportHub.tsx` | 1 hr |
