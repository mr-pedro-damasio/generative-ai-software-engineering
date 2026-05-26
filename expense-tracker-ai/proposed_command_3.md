# /audit

Audit the expense tracker codebase for consistency and common mistakes.

## What it does
Runs a quick health check across the files most likely to drift out of sync as the project grows. Reports problems found and fixes any that are safe to auto-correct.

## Instructions
Check each of the following and report pass / fail with file and line references:

**1. Category registry completeness**
- Read `types/expense.ts` and extract every string in the `Category` union.
- Verify each category appears in all three locations in `lib/utils.ts`: `CATEGORIES`, `CATEGORY_COLORS`, and `CATEGORY_ICONS`.
- Flag any category that is missing from any of the three.

**2. Client Component declarations**
- Check every file in `components/` and `hooks/` for `'use client'` as the first line.
- Flag any file that is missing it.

**3. Direct localStorage access outside `useExpenses`**
- Search all files except `hooks/useExpenses.ts` and `lib/exportCloud.ts` for the string `localStorage`.
- Flag any match — direct access bypasses the hook and causes state/storage divergence.

**4. Date construction safety**
- Search all `.ts` and `.tsx` files for `new Date(` followed by a variable that looks like a date string.
- Flag any call that does NOT append `T00:00:00`, which risks timezone-offset date shifts.

**5. Unused exports in `lib/utils.ts`**
- List every exported function and constant in `lib/utils.ts`.
- Check whether each is imported anywhere else in the project.
- Report any that appear to be unused.

After the report, ask the user which issues (if any) they want auto-fixed.
