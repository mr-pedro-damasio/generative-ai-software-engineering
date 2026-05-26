# /new-tab $ARGUMENTS

Scaffold a new analytics tab in the expense tracker following the project's existing patterns.

Usage: `/new-tab <TabName> "<short description>"`
Example: `/new-tab Trends "Month-over-month spending trends"`

## What it does
Creates a new top-level tab end-to-end: the component file, the type union update, the tab bar button, and the conditional render — all consistent with how Dashboard, TopCategories, TopVendors, and MonthlyInsights are wired up.

## Instructions
1. Parse `$ARGUMENTS` to extract the tab name (PascalCase for the component, lowercase for the tab value) and the description.
2. Create `components/<TabName>.tsx`:
   - Start with `'use client'`
   - Accept `{ expenses: Expense[] }` as props
   - Show an empty state when `expenses.length === 0`
   - Import from `@/lib/utils` and `@/types/expense` as needed
   - Put any data transforms in `lib/utils.ts`, not inside the component
3. Edit `app/page.tsx`:
   - Add the new lowercase tab value to the `tab` state union type
   - Add a button in the `.map()` tab bar block with an appropriate emoji label
   - Add a conditional render that passes `expenses` to the new component
4. Import the new component at the top of `page.tsx`.
5. Confirm all 4 changes were made and show the diff summary.
