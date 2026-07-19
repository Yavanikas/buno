'use client';

import { type FormEvent, useMemo, useState } from 'react';
import ProbabilityWindow from '../components/ProbabilityWindow';
import { mockExpenses, type MockExpense } from '../data/mockExpenses';
import { getBudgetState, getRemainingDays } from '../lib/calc';

const monthlyBudget = 8000;
const expenseCategories: MockExpense['category'][] = [
  'food',
  'transport',
  'groceries',
  'subscriptions',
  'academics',
  'social',
  'personal care',
];

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [expenses, setExpenses] = useState<MockExpense[]>(mockExpenses);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<MockExpense['category']>('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayInputValue);
  const [formMessage, setFormMessage] = useState('');

  const today = new Date();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = getRemainingDays(today, monthEnd);
  const totalExpensesLogged = Array.isArray(expenses) ? expenses.length : 0;
  const budgetState = useMemo(
    () =>
      getBudgetState({
        totalBudget: monthlyBudget,
        expenses,
        remainingDays: daysRemaining,
      }),
    [daysRemaining, expenses],
  );
  const recentExpenses = useMemo(
    () => [...expenses].sort((firstExpense, secondExpense) => getExpenseTime(secondExpense) - getExpenseTime(firstExpense)),
    [expenses],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    const trimmedNote = note.trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !date || !trimmedNote) {
      setFormMessage('Add an amount, date, and short note before saving.');
      return;
    }

    setExpenses((currentExpenses) => [
      ...currentExpenses,
      {
        amount: parsedAmount,
        category,
        date,
        note: trimmedNote,
      },
    ]);
    setAmount('');
    setCategory('food');
    setNote('');
    setDate(getTodayInputValue());
    setFormMessage('Expense added for this session.');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:py-16">
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Buno</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Your calm budget assistant</h1>
          <p className="max-w-prose text-sm leading-6 text-slate-600">
            Track your monthly setup, understand your spending pace, and get simple guidance without exposing exact remaining balances.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly budget</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">₹{monthlyBudget.toLocaleString('en-IN')}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Days remaining</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{daysRemaining}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Expenses logged</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{totalExpensesLogged}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-950">Add expense</h2>
          <p className="text-sm text-slate-600">Log a simple expense for this demo session.</p>
        </div>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Amount
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-950 outline-none focus:border-slate-400"
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 120"
              required
              type="number"
              value={amount}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Category
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-950 outline-none focus:border-slate-400"
              onChange={(event) => setCategory(event.target.value as MockExpense['category'])}
              value={category}
            >
              {expenseCategories.map((expenseCategory) => (
                <option key={expenseCategory} value={expenseCategory}>
                  {expenseCategory}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Note
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-950 outline-none focus:border-slate-400"
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Canteen lunch"
              required
              type="text"
              value={note}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-950 outline-none focus:border-slate-400"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
            <button
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Add expense
            </button>
            {formMessage ? <p className="text-sm text-slate-600">{formMessage}</p> : null}
          </div>
        </form>
      </section>

      <ProbabilityWindow
        riskLabel={budgetState.riskLabel}
        zoneLabel={budgetState.zoneLabel}
        paceLabel={budgetState.paceLabel}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-950">Recent expenses</h2>
          <p className="text-sm text-slate-600">Your latest logged expenses for this demo session.</p>
        </div>

        {recentExpenses.length > 0 ? (
          <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {recentExpenses.map((expense, index) => (
              <div
                className="grid gap-3 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                key={`${expense.date}-${expense.category}-${expense.note}-${index}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                      {expense.category}
                    </span>
                    <span className="text-xs text-slate-500">{formatExpenseDate(expense.date)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-950">{expense.note}</p>
                </div>

                <p className="text-sm font-semibold text-slate-950">₹{expense.amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No expenses yet. Add your first expense above when you are ready.
          </p>
        )}
      </section>
    </main>
  );
}

function getExpenseTime(expense: MockExpense): number {
  const time = new Date(expense.date).getTime();

  return Number.isFinite(time) ? time : 0;
}

function formatExpenseDate(date: Date | string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date not set';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
