'use client';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Expense, Category } from '@/types/expense';
import {
  formatCurrency,
  getTotalByCategory,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  getBudgetStreak,
} from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function MonthlyInsights({ expenses }: Props) {
  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return expenses.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [expenses]);

  const categoryData = useMemo(() => {
    const totals = getTotalByCategory(monthlyExpenses);
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const top3 = categoryData.slice(0, 3);
  const streak = useMemo(() => getBudgetStreak(expenses), [expenses]);
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Monthly Insights</h2>
          <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
          <div className="mt-1 border-b-2 border-dashed border-gray-200 mx-8" />
        </div>

        {/* Donut Chart */}
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={2}
              >
                <Label
                  value="Spending"
                  position="center"
                  fontSize={13}
                  fontWeight={600}
                  fill="#374151"
                />
                {categoryData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={CATEGORY_COLORS[entry.name as Category] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
            No expenses this month
          </div>
        )}

        {/* Top 3 Categories */}
        {top3.length > 0 && (
          <div className="space-y-2.5">
            {top3.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div
                  className="w-1 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat.name as Category] || '#6b7280' }}
                />
                <span className="text-base leading-none">{CATEGORY_ICONS[cat.name as Category]}</span>
                <span className="text-sm text-gray-700 flex-1">
                  {cat.name}:
                  <span className="font-semibold ml-1">{formatCurrency(cat.value)}</span>
                </span>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-right pt-1">Top {top3.length}</p>
          </div>
        )}

        {/* Budget Streak */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 text-center mb-2">Budget Streak</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-green-500 leading-none">{streak}</span>
              <p className="text-sm text-gray-500 mt-0.5">days!</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full opacity-60" />
          </div>
        </div>

      </div>
    </div>
  );
}
