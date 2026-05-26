'use client';
import { useMemo } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, getTotalByCategory, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function TopCategories({ expenses }: Props) {
  const ranked = useMemo(() => {
    const totals = getTotalByCategory(expenses);
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
    return CATEGORIES
      .map(cat => ({
        category: cat,
        total: totals[cat] || 0,
        count: expenses.filter(e => e.category === cat).length,
        pct: grandTotal > 0 ? ((totals[cat] || 0) / grandTotal) * 100 : 0,
      }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const maxTotal = ranked[0]?.total || 1;

  if (ranked.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-500 text-sm">No expenses yet. Add some to see category rankings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-700">Top Expense Categories</h2>
        <p className="text-xs text-gray-400 mt-0.5">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} across {ranked.length} categor{ranked.length !== 1 ? 'ies' : 'y'}</p>
      </div>
      {ranked.map((row, i) => (
        <div key={row.category} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
            <span className="text-xl">{CATEGORY_ICONS[row.category]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-900">{row.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{row.count} expense{row.count !== 1 ? 's' : ''}</span>
                  <span className="text-xs text-gray-500">{row.pct.toFixed(1)}%</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.total)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(row.total / maxTotal) * 100}%`,
                    backgroundColor: CATEGORY_COLORS[row.category],
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
