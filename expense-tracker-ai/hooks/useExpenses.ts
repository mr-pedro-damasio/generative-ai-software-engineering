'use client';
import { useState, useEffect, useCallback } from 'react';
import { Expense, Category } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadFromStorage(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadFromStorage());
    setIsLoaded(true);
  }, []);

  const addExpense = useCallback((data: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpenses(prev => {
      const next = [{ ...data, id: generateId(), createdAt: new Date().toISOString() }, ...prev];
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateExpense = useCallback((id: string, data: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...data } : e);
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense };
}
