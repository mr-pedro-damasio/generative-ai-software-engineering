'use client';
import { useState } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import ExpenseForm from './ExpenseForm';

interface Props {
  expenses: Expense[];
  onUpdate: (id: string, data: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">💸</div>
        <p className="text-lg font-medium">No expenses found</p>
        <p className="text-sm">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <div key={expense.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          {editingId === expense.id ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Edit Expense</p>
              <ExpenseForm
                initialData={expense}
                submitLabel="Save Changes"
                onSubmit={data => { onUpdate(expense.id, data); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : deletingId === expense.id ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Delete <span className="font-medium">{expense.description}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete(expense.id); setDeletingId(null); }} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                <button onClick={() => setDeletingId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] + '20' }}
                >
                  {CATEGORY_ICONS[expense.category]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(expense.date)}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: CATEGORY_COLORS[expense.category] + '20', color: CATEGORY_COLORS[expense.category] }}
                    >
                      {expense.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditingId(expense.id)} className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-xs">✏️</button>
                  <button onClick={() => setDeletingId(expense.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs">🗑️</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
