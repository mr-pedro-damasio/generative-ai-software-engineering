'use client';
import { useMemo } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, getTopVendors, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function TopVendors({ expenses }: Props) {
  const vendors = useMemo(() => getTopVendors(expenses, 10), [expenses]);
  const maxTotal = vendors[0]?.total || 1;

  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-3">🏪</p>
        <p className="text-gray-500 text-sm">No expenses yet. Add some to see your top vendors.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-700">Top Vendors</h2>
        <p className="text-xs text-gray-400 mt-0.5">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} across {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
      </div>
      {vendors.map((vendor, i) => (
        <div key={vendor.name} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
            <span className="text-xl">{CATEGORY_ICONS[vendor.category]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">{vendor.name}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[vendor.category] + '20', color: CATEGORY_COLORS[vendor.category] }}
                  >
                    {vendor.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-400">{vendor.count} txn{vendor.count !== 1 ? 's' : ''}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(vendor.total)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(vendor.total / maxTotal) * 100}%`,
                    backgroundColor: CATEGORY_COLORS[vendor.category],
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
