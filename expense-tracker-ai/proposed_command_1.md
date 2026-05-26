# /seed-data

Inject realistic sample expense data into the app for development and testing.

## What it does
Generates a JavaScript snippet the developer can paste into the browser console to populate `localStorage` with 40–60 realistic expenses spread across all 6 categories, covering the last 6 months. This makes charts, filters, Top Vendors, and Monthly Insights immediately testable without manual data entry.

## Instructions
1. Generate a self-contained JavaScript snippet that:
   - Creates an array of 40–60 `Expense` objects matching this shape:
     ```ts
     { id: string, date: string, amount: number, category: Category, description: string, createdAt: string }
     ```
   - Uses realistic descriptions that repeat across entries (e.g. "Starbucks", "Uber", "Netflix") so Top Vendors has meaningful data
   - Spreads dates across the last 6 months in `YYYY-MM-DD` format
   - Covers all 6 categories: Food, Transportation, Entertainment, Shopping, Bills, Other
   - Writes the array to `localStorage.setItem('expense-tracker-data', JSON.stringify(data))`
   - Logs a summary: total records inserted and total amount
2. Print the snippet in a fenced code block so the developer can copy it.
3. Remind them to **refresh the page** after running it so `useExpenses` re-reads from storage.
