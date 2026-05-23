'use client';
import { ExpenseFilter } from '@/types/expense';
import { CATEGORIES } from '@/lib/utils';

interface Props {
  filter: ExpenseFilter;
  onChange: (f: ExpenseFilter) => void;
}

const empty: ExpenseFilter = { category: 'All', dateFrom: '', dateTo: '', search: '' };

function isActive(f: ExpenseFilter) {
  return f.category !== 'All' || f.dateFrom || f.dateTo || f.search;
}

export default function FilterBar({ filter, onChange }: Props) {
  function set(key: keyof ExpenseFilter, value: string) {
    onChange({ ...filter, [key]: value });
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search expenses..."
          value={filter.search}
          onChange={e => set('search', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={filter.category}
          onChange={e => set('category', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={filter.dateFrom}
          onChange={e => set('dateFrom', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="From date"
        />
        <input
          type="date"
          value={filter.dateTo}
          onChange={e => set('dateTo', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="To date"
        />
      </div>
      {isActive(filter) && (
        <button
          onClick={() => onChange(empty)}
          className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}
