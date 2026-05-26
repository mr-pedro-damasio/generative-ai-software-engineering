import { Expense, Category } from '@/types/expense';

export const CATEGORIES: Category[] = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Transportation: '#3b82f6',
  Entertainment: '#a855f7',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Other: '#6b7280',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍔',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Other: '📦',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function exportToCSV(expenses: Expense[]): void {
  const header = ['Date', 'Amount', 'Category', 'Description'];
  const rows = expenses.map(e => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getMonthlyTotal(expenses: Expense[]): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return expenses
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
}

export interface VendorSummary {
  name: string;
  total: number;
  count: number;
  category: Category;
}

export function getTopVendors(expenses: Expense[], limit = 10): VendorSummary[] {
  const map = new Map<string, { total: number; count: number; categoryCounts: Map<Category, number> }>();
  for (const e of expenses) {
    const key = e.description.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { total: 0, count: 0, categoryCounts: new Map() });
    const entry = map.get(key)!;
    entry.total += e.amount;
    entry.count += 1;
    entry.categoryCounts.set(e.category, (entry.categoryCounts.get(e.category) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, { total, count, categoryCounts }]) => {
      const expenses_with_key = expenses.find(e => e.description.trim().toLowerCase() === key);
      const displayName = expenses_with_key ? expenses_with_key.description.trim() : key;
      const category = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return { name: displayName, total, count, category };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function getLast6MonthsData(expenses: Expense[]): { month: string; total: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const total = expenses
      .filter(e => {
        const ed = new Date(e.date + 'T00:00:00');
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    result.push({ month, total });
  }
  return result;
}
