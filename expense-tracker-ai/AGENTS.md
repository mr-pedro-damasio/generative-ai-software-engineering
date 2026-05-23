# Expense Tracker AI — Agent Guide

## Stack

| Layer | Version | Notes |
|---|---|---|
| Next.js | 16.2.6 | App Router, **not** Pages Router |
| React | 19.2.4 | New APIs — avoid patterns from React 17/18 training data |
| Tailwind CSS | 4.x | **Breaking changes from v3.** No `tailwind.config.js`; config is in `postcss.config.mjs` and CSS. |
| TypeScript | 5.x | Strict mode |
| Recharts | 3.x | Used for bar and pie charts in Dashboard |

> **Warning:** This Next.js version has breaking changes. Before writing any routing, data-fetching, or server component code, read the relevant guide in `node_modules/next/dist/docs/`.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test runner is configured.

## Architecture

This is a **pure client-side SPA** — there is no backend, no API routes, and no database. All data is persisted in `localStorage` under the key `expense-tracker-data`.

### Data flow

```
localStorage
    ↕ (read on mount, write on every mutation)
useExpenses hook  (hooks/useExpenses.ts)
    ↓ (expenses[], addExpense, updateExpense, deleteExpense)
app/page.tsx      (single page — owns filter state, tab state, filtered list)
    ↓
Dashboard / ExpenseList / ExpenseForm / FilterBar
```

### Key files

| File | Role |
|---|---|
| `types/expense.ts` | `Expense`, `Category`, `ExpenseFilter` types — single source of truth for the data model |
| `hooks/useExpenses.ts` | All CRUD operations + localStorage sync. **All mutations go through here.** |
| `lib/utils.ts` | Pure helpers: `formatCurrency`, `formatDate`, `exportToCSV`, chart data transforms, `CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS` |
| `app/page.tsx` | Root page — composes all components, owns filter and tab state, derives `filtered` via `useMemo` |
| `components/Dashboard.tsx` | Summary cards + bar chart (last 6 months) + pie chart (by category) using Recharts |
| `components/ExpenseList.tsx` | Renders filtered expenses; inline edit and delete confirmation states managed locally |
| `components/ExpenseForm.tsx` | Shared add/edit form with client-side validation; used in `page.tsx` (add) and `ExpenseList` (edit) |
| `components/FilterBar.tsx` | Category, date range, and search filters; raises changes via `onChange` prop |

### Path alias

`@/` resolves to the project root (configured in `tsconfig.json`). Use it for all imports.

### Data model

```ts
type Category = 'Food' | 'Transportation' | 'Entertainment' | 'Shopping' | 'Bills' | 'Other';

interface Expense {
  id: string;         // generated: Date.now().toString(36) + random
  date: string;       // ISO date YYYY-MM-DD (no time component)
  amount: number;     // positive float, USD
  category: Category;
  description: string;
  createdAt: string;  // full ISO timestamp
}
```

Date strings are always compared lexicographically (`e.date < filter.dateFrom`), which works because the format is `YYYY-MM-DD`. Don't change the date format without updating filter logic in `page.tsx`.

## Tailwind CSS v4 constraints

- No `tailwind.config.js` — utility classes are generated from CSS source.
- Custom colours and design tokens go in `app/globals.css` using CSS custom properties, not in a config file.
- Arbitrary values (`bg-[#fff]`) and standard utilities work as expected.
- The `@apply` directive is still supported but prefer direct class usage.

## Patterns to follow

- Every component is a Client Component (`'use client'` at the top). There are no Server Components in this project.
- State that needs to survive re-renders or be shared upward goes in `page.tsx` or `useExpenses`. Keep local UI state (editing row, delete confirmation) in the component that owns it.
- Chart data transforms belong in `lib/utils.ts`, not inside components.
- Adding a new category requires updating: `types/expense.ts` (`Category` union), `lib/utils.ts` (`CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS`).
