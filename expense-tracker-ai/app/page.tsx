'use client';
import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseFilter } from '@/types/expense';
import Dashboard from '@/components/Dashboard';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import FilterBar from '@/components/FilterBar';
import ExportHub from '@/components/ExportHub';
import TopVendors from '@/components/TopVendors';

const defaultFilter: ExpenseFilter = { category: 'All', dateFrom: '', dateTo: '', search: '' };

export default function Home() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [tab, setTab] = useState<'dashboard' | 'expenses' | 'vendors'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>(defaultFilter);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filter.category !== 'All' && e.category !== filter.category) return false;
      if (filter.dateFrom && e.date < filter.dateFrom) return false;
      if (filter.dateTo && e.date > filter.dateTo) return false;
      if (filter.search && !e.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [expenses, filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">ExpenseTracker</h1>
              <p className="text-xs text-gray-500">Personal finance manager</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHub(true)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            >
              Export Data
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {showForm ? '✕ Cancel' : '+ Add Expense'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add Expense Panel */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">New Expense</h2>
            <ExpenseForm
              onSubmit={data => { addExpense(data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['dashboard', 'expenses', 'vendors'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'dashboard' ? '📊 Dashboard' : t === 'expenses' ? '📋 Expenses' : '🏪 Top Vendors'}
            </button>
          ))}
        </div>

        {!isLoaded ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : tab === 'dashboard' ? (
          <Dashboard expenses={expenses} />
        ) : tab === 'vendors' ? (
          <TopVendors expenses={expenses} />
        ) : (
          <div className="space-y-4">
            <FilterBar filter={filter} onChange={setFilter} />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ExpenseList expenses={filtered} onUpdate={updateExpense} onDelete={deleteExpense} />
          </div>
        )}
      </main>

      {showHub && (
        <ExportHub expenses={expenses} onClose={() => setShowHub(false)} />
      )}
    </div>
  );
}
