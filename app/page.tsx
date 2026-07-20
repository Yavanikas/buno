'use client';

import { type FormEvent, useMemo, useState } from 'react';
import PatternInsight from '../components/PatternInsight';
import ProbabilityWindow from '../components/ProbabilityWindow';
import { mockExpenses, type MockExpense } from '../data/mockExpenses';
import { getBudgetState, getRemainingDays } from '../lib/calc';
import { getMonthlyPatternSummary, type MonthlyPatternSummary } from '../lib/patterns';

const initialMonthlyBudget = 8000;
const expenseCategories: MockExpense['category'][] = [
  'food',
  'transport',
  'groceries',
  'subscriptions',
  'academics',
  'social',
  'personal care',
];

type ActiveTab = 'overview' | 'patterns' | 'settings';
type SessionExpense = MockExpense & { id: string };

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [monthlyBudget, setMonthlyBudget] = useState(initialMonthlyBudget);
  const [budgetInput, setBudgetInput] = useState(String(initialMonthlyBudget));
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState('');
  const [expenses, setExpenses] = useState<SessionExpense[]>(() =>
    mockExpenses.map((expense, index) => ({
      ...expense,
      id: createExpenseId(expense, index),
    })),
  );
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
    [daysRemaining, expenses, monthlyBudget],
  );
  const recentExpenses = useMemo(
    () =>
      [...expenses].sort(
        (firstExpense, secondExpense) => getExpenseTime(secondExpense) - getExpenseTime(firstExpense),
      ),
    [expenses],
  );
  const monthlyPatternSummary = useMemo(
    () => getMonthlyPatternSummary(expenses, today),
    [expenses, today],
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
        id: createNewExpenseId({ amount: parsedAmount, category, date, note: trimmedNote }, currentExpenses.length),
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

  function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedBudget = Number(budgetInput);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setBudgetMessage('Enter a monthly budget greater than zero.');
      return;
    }

    setMonthlyBudget(parsedBudget);
    setBudgetInput(String(Math.round(parsedBudget)));
    setIsEditingBudget(false);
    setBudgetMessage('Monthly budget updated for this session.');
  }

  function handleDeleteExpense(expenseId: unknown) {
    if (typeof expenseId !== 'string' || !expenseId.trim()) {
      setFormMessage('Could not delete that expense. Please try again.');
      return;
    }

    setExpenses((currentExpenses) => currentExpenses.filter((expense) => expense.id !== expenseId));
    setFormMessage('Expense deleted for this session.');
  }

  return (
    <main className="min-h-screen bg-[#f8efe4] text-[#3a2118]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:w-32">
          <nav
            className="flex items-center gap-2 overflow-x-auto rounded-[2rem] border border-[#ead9c8] bg-[#765447] p-2 shadow-[0_18px_45px_rgba(76,45,33,0.18)] lg:h-full lg:flex-col lg:justify-start lg:gap-4 lg:overflow-visible lg:py-8"
            aria-label="Dashboard navigation"
          >
            <SidebarItem label="Overview" icon="⌂" active={activeTab === 'overview'} onSelect={() => setActiveTab('overview')} />
            <SidebarItem label="Patterns" icon="⌘" active={activeTab === 'patterns'} onSelect={() => setActiveTab('patterns')} />
            <SidebarItem label="Settings" icon="⚙" active={activeTab === 'settings'} onSelect={() => setActiveTab('settings')} />
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8">
          <header className="flex flex-col gap-6 rounded-[2rem] border border-[#ead9c8] bg-[#fffaf3]/85 p-5 shadow-[0_20px_60px_rgba(76,45,33,0.10)] sm:p-7">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9b7968]">Buno</p>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-[#3a2118] sm:text-4xl lg:text-5xl">
                Minimalist Budget Overview
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[#735747] sm:text-base">
                A calm student budget assistant that tracks your setup, reads your spending pace, and keeps guidance qualitative.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-3xl border border-[#ead9c8] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a48673]">Monthly budget</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-words text-lg font-bold text-[#3a2118]">Set for this cycle</p>
                  <button
                    className="w-fit rounded-full border border-[#d8c3b2] px-3 py-1 text-xs font-bold text-[#5d4035] transition hover:bg-[#f3e6d8]"
                    onClick={() => {
                      setBudgetInput(String(Math.round(monthlyBudget)));
                      setIsEditingBudget(true);
                    }}
                    type="button"
                  >
                    Edit budget
                  </button>
                </div>
              </div>
              <SummaryTile label="Days remaining" value={String(daysRemaining)} />
              <SummaryTile label="Expenses logged" value={String(totalExpensesLogged)} />
            </div>

            {isEditingBudget || budgetMessage ? <div className="rounded-3xl border border-[#ead9c8] bg-white/60 p-4">
              {isEditingBudget ? (
                <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleBudgetSubmit}>
                  <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                    Change monthly budget
                    <input
                      className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition placeholder:text-[#b79b89] focus:border-[#9a715f]"
                      min="1"
                      onChange={(event) => setBudgetInput(event.target.value)}
                      placeholder="Enter monthly budget"
                      type="number"
                      value={budgetInput}
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      className="rounded-2xl bg-[#4b2c22] px-4 py-3 text-sm font-bold text-[#fff7ed]"
                      type="submit"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-2xl border border-[#d8c3b2] px-4 py-3 text-sm font-bold text-[#5d4035]"
                      onClick={() => {
                        setBudgetInput(String(Math.round(monthlyBudget)));
                        setIsEditingBudget(false);
                        setBudgetMessage('');
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                null
              )}

              {budgetMessage ? <p className="mt-3 text-sm text-[#7d6253]">{budgetMessage}</p> : null}
            </div> : null}
          </header>

          {activeTab === 'overview' ? (
            <>
              <ProbabilityWindow
                riskLabel={budgetState.riskLabel}
                zoneLabel={budgetState.zoneLabel}
                paceLabel={budgetState.paceLabel}
              />

              <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
                <RecentActivitySection expenses={recentExpenses} onDeleteExpense={handleDeleteExpense} />

                <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-[#3a2118]">Add expense</h2>
                  <p className="text-sm text-[#7d6253]">Log a simple expense for this demo session.</p>
                </div>

                <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                    Amount
                    <input
                      className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition placeholder:text-[#b79b89] focus:border-[#9a715f]"
                      min="1"
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Enter amount"
                      required
                      type="number"
                      value={amount}
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                    Category
                    <select
                      className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition focus:border-[#9a715f]"
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

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                    Note
                    <input
                      className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition placeholder:text-[#b79b89] focus:border-[#9a715f]"
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="e.g. Canteen lunch"
                      required
                      type="text"
                      value={note}
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                    Date
                    <input
                      className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition focus:border-[#9a715f]"
                      onChange={(event) => setDate(event.target.value)}
                      required
                      type="date"
                      value={date}
                    />
                  </label>

                  <button
                    className="rounded-2xl bg-[#4b2c22] px-5 py-3 text-sm font-bold text-[#fff7ed] shadow-[0_12px_28px_rgba(75,44,34,0.24)] transition hover:bg-[#5b382c]"
                    type="submit"
                  >
                    Add expense
                  </button>
                  {formMessage ? <p className="text-sm text-[#7d6253]">{formMessage}</p> : null}
                </form>
              </section>
              </div>
            </>
          ) : null}

          {activeTab === 'patterns' ? (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
              <MonthlyPatternsSection summary={monthlyPatternSummary} />
              <PatternInsight
                riskLabel={budgetState.riskLabel}
                recentExpenses={expenses}
                daysRemaining={daysRemaining}
              />
            </div>
          ) : null}

          {activeTab === 'settings' ? (
            <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
              <h2 className="text-xl font-bold tracking-tight text-[#3a2118]">Settings</h2>
              <p className="mt-2 text-sm leading-6 text-[#7d6253]">
                Settings are intentionally light for this demo. Budget and expenses stay in this browser session.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function SidebarItem({
  label,
  icon,
  active = false,
  onSelect,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`flex min-w-24 flex-1 items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-medium transition lg:min-w-0 lg:flex-none lg:flex-col lg:px-3 lg:py-5 ${
        active
          ? 'bg-[#fffaf3] text-[#3a2118] shadow-[0_12px_30px_rgba(48,28,20,0.18)]'
          : 'text-[#fff3e7] hover:bg-white/10'
      }`}
      onClick={onSelect}
      type="button"
      aria-current={active ? 'page' : undefined}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-3xl border border-[#ead9c8] bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a48673]">{label}</p>
      <p className="mt-2 break-words text-lg font-bold text-[#3a2118]">{value}</p>
    </div>
  );
}

function RecentActivitySection({
  expenses,
  onDeleteExpense,
}: {
  expenses: SessionExpense[];
  onDeleteExpense: (expenseId: string) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Recent Activity</h2>
        <p className="text-sm text-[#7d6253]">Your latest logged expenses for this demo session.</p>
      </div>

      {expenses.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {expenses.slice(0, 6).map((expense) => (
            <div
              className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-4 rounded-2xl border border-[#efe2d4] bg-white/80 p-3 shadow-[0_12px_30px_rgba(76,45,33,0.08)] sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center sm:p-4"
              key={expense.id}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8a6557] text-lg font-semibold uppercase text-[#fff7ed] shadow-inner">
                {getCategoryInitial(expense.category)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#b09380]">
                    {formatExpenseDate(expense.date)}
                  </span>
                  <span className="rounded-full bg-[#f3e6d8] px-2.5 py-1 text-xs font-medium capitalize text-[#6e4d3f]">
                    {expense.category}
                  </span>
                </div>
                <p className="mt-1 break-words text-base font-semibold text-[#3a2118]">{expense.note}</p>
              </div>

              <div className="col-start-2 flex flex-wrap items-center gap-3 sm:col-start-auto sm:justify-end">
                <p className="text-sm font-semibold text-[#7d6253]">{getExpenseSizeLabel(expense.amount)}</p>
                <button
                  className="rounded-full border border-[#ead9c8] px-3 py-1 text-xs font-semibold text-[#8a4f3f] transition hover:bg-[#f3e6d8]"
                  onClick={() => onDeleteExpense(expense.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-[#ead9c8] bg-white/70 p-4 text-sm text-[#7d6253]">
          No expenses yet. Add your first expense when you are ready.
        </p>
      )}
    </section>
  );
}

function MonthlyPatternsSection({ summary }: { summary: MonthlyPatternSummary }) {
  const hasEnoughData = summary.totalExpensesThisMonth > 0;

  return (
    <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Monthly Patterns</h2>
        <p className="text-sm leading-6 text-[#7d6253]">{summary.currentMonthActivitySummary}</p>
      </div>

      {hasEnoughData ? (
        <div className="mt-5 grid gap-3">
          <PatternStat label="Total expenses this month" value={String(summary.totalExpensesThisMonth)} />
          <PatternStat label="Most frequent category" value={toTitleCase(summary.mostFrequentCategory)} />
          <PatternStat
            label="Weekday vs weekend"
            value={`${summary.weekdayExpenseCount} weekday / ${summary.weekendExpenseCount} weekend`}
          />
          <PatternStat
            label="Small-purchase signal"
            value={summary.hasRepeatedSmallPurchases ? 'Repeated small spends appear present' : 'No strong small-spend repetition yet'}
          />
          <PatternStat
            label="Clustered spending"
            value={summary.hasClusteredSpending ? 'Activity appears a little bursty' : 'Activity appears fairly spread out'}
          />

          <div className="rounded-2xl border border-[#efe2d4] bg-white/75 p-4">
            <p className="text-sm font-semibold text-[#5d4035]">Category breakdown</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.categoryFrequencyBreakdown.map((categorySummary) => (
                <span
                  className="rounded-full bg-[#f3e6d8] px-3 py-1 text-xs font-semibold capitalize text-[#6e4d3f]"
                  key={categorySummary.category}
                >
                  {categorySummary.category}: {categorySummary.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-[#ead9c8] bg-white/70 p-4 text-sm text-[#7d6253]">
          Add a few expenses this month to see calm pattern signals here.
        </p>
      )}
    </section>
  );
}

function PatternStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#efe2d4] bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a48673]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#3a2118]">{value}</p>
    </div>
  );
}

function getExpenseTime(expense: MockExpense): number {
  const time = new Date(expense.date).getTime();

  return Number.isFinite(time) ? time : 0;
}

function createExpenseId(expense: MockExpense, index: number): string {
  return `${expense.date}-${expense.category}-${expense.note}-${index}`;
}

function createNewExpenseId(expense: MockExpense, index: number): string {
  return `${createExpenseId(expense, index)}-${Date.now()}`;
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

function getExpenseSizeLabel(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Spend logged';
  }

  if (amount <= 150) {
    return 'Small spend';
  }

  if (amount <= 500) {
    return 'Medium spend';
  }

  return 'Larger spend';
}

function getCategoryInitial(category: string): string {
  const trimmedCategory = category.trim();

  return trimmedCategory ? trimmedCategory.charAt(0) : '•';
}

function toTitleCase(value: string): string {
  if (!value.trim()) {
    return 'Not enough data';
  }

  return value
    .split(' ')
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(' ');
}
