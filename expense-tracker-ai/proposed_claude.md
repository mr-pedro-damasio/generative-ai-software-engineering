# Expense Tracker AI

## Stack
- **Framework**: Next.js 16.2.6, App Router (not Pages Router)
- **UI**: React 19.2.4 — avoid patterns from React 17/18 training data
- **Styling**: Tailwind CSS 4.x — no `tailwind.config.js`; tokens go in `app/globals.css`
- **Charts**: Recharts 3.x (bar, pie, donut)
- **Language**: TypeScript 5.x strict mode

## Commands
```bash
npm run dev    # http://localhost:3000
npm run build  # type-check + lint + build
npm run lint   # ESLint only
```
No test runner configured.

## Architecture
Pure client-side SPA — no backend, no API routes, no database. All data is stored in `localStorage` under the key `expense-tracker-data`. Every component must be a Client Component (`'use client'`).

**Data flow:**
```
localStorage → useExpenses (hooks/useExpenses.ts) → app/page.tsx → components
```
`page.tsx` owns all shared state: `tab`, `filter`, `showForm`, `showHub`. It derives `filtered` via `useMemo`. Never compute filtered lists inside child components.

## Key Files
- `types/expense.ts` — `Expense`, `Category`, `ExpenseFilter` types (single source of truth)
- `hooks/useExpenses.ts` — all CRUD + localStorage sync; every mutation goes through here
- `lib/utils.ts` — pure helpers, `CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS`, chart transforms
- `lib/exportCloud.ts` — export templates, CSV/JSON/PDF download, history, integrations, schedules
- `app/page.tsx` — single route; owns tab/filter state; renders all components
- `components/Dashboard.tsx` — stat cards + bar chart + pie chart
- `components/ExpenseList.tsx` — filtered list with inline edit and delete confirmation
- `components/ExpenseForm.tsx` — shared add/edit form used in page.tsx and ExpenseList
- `components/FilterBar.tsx` — category, date range, and search filters
- `components/TopCategories.tsx` — spending ranked by category with progress bars
- `components/TopVendors.tsx` — top 10 vendors keyed on `description.trim().toLowerCase()`
- `components/MonthlyInsights.tsx` — current-month donut chart, top-3 categories, streak
- `components/ExportHub.tsx` — full-screen drawer: Templates, Send & Share, Integrations, Schedule, History

Use `@/` for all imports (alias for project root).

## Data Model
```ts
type Category = 'Food' | 'Transportation' | 'Entertainment' | 'Shopping' | 'Bills' | 'Other';

interface Expense {
  id: string;          // generated: Date.now().toString(36) + random
  date: string;        // YYYY-MM-DD — compared lexicographically in filters
  amount: number;      // positive float, USD
  category: Category;
  description: string;
  createdAt: string;   // full ISO timestamp, set once on creation
}
```

## Critical Rules
- **All mutations go through `useExpenses`** — never write to `localStorage` directly
- **Date strings must use `T00:00:00`** — `new Date(dateStr + 'T00:00:00')` forces local time; omitting it causes off-by-one-day bugs in negative-UTC timezones
- **Adding a category requires 3 changes**: `types/expense.ts` (union), `lib/utils.ts` (`CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS`)
- **Never read `localStorage` at module level** — only inside `useEffect` or behind `typeof window !== 'undefined'`
- **`isLoaded` guards all renders** — `page.tsx` shows a spinner until the hook has hydrated from storage
