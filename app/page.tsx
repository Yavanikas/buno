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

function createExpenseId(
  expense: { date?: string | Date; category?: string; amount?: number; note?: string },
  index: number,
): string {
  const safeDate =
    typeof expense.date === 'string'
      ? expense.date
      : expense.date instanceof Date && !Number.isNaN(expense.date.getTime())
        ? expense.date.toISOString()
        : 'unknown-date';

  const safeCategory =
    typeof expense.category === 'string' && expense.category.trim()
      ? expense.category.trim().toLowerCase().replace(/\s+/g, '-')
      : 'uncategorized';

  const safeAmount =
    typeof expense.amount === 'number' && Number.isFinite(expense.amount)
      ? String(expense.amount)
      : '0';

  const safeNote =
    typeof expense.note === 'string' && expense.note.trim()
      ? expense.note.trim().toLowerCase().replace(/\s+/g, '-')
      : 'expense';

  return `${safeDate}-${safeCategory}-${safeAmount}-${safeNote}-${index}`;
}

function createNewExpenseId(
  expense: { date?: string | Date; category?: string; amount?: number; note?: string },
  index: number,
): string {
  return createExpenseId(expense, index);
}

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
            <BunnyLogo />
            <SidebarItem
              label="Overview"
              icon="⌂"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <SidebarItem
              label="Patterns"
              icon="⌘"
              active={activeTab === 'patterns'}
              onClick={() => setActiveTab('patterns')}
            />
            <SidebarItem
              label="Settings"
              icon="⚙"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:gap-8">
                <header className="flex flex-col gap-3 rounded-[2rem] border border-[#ead9c8] bg-[#fffaf3]/85 p-5 shadow-[0_20px_60px_rgba(76,45,33,0.10)] sm:p-7">
                  <h1 className="text-4xl font-black tracking-wide text-[#8B4513] sm:text-5xl" style={{ fontFamily: '"Nunito", "Arial Rounded MT Bold", "Varela Round", system-ui, sans-serif', letterSpacing: '0.06em' }}>
                    BUNO
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-[#735747] sm:text-base">
                    A calm student budget assistant that tracks your setup, reads your spending pace, and keeps guidance qualitative.
                  </p>
                </header>

                <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
                  <section className="flex min-h-[26rem] flex-col justify-between rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Activity Rhythm</h2>
                      <p className="text-sm text-[#7d6253]">{monthlyPatternSummary.currentMonthActivitySummary}</p>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <SummaryTile label="This month" value={`${monthlyPatternSummary.totalExpensesThisMonth} logs`} />
                      <SummaryTile label="Top category" value={toTitleCase(monthlyPatternSummary.mostFrequentCategory)} />
                      <SummaryTile
                        label="Rhythm"
                        value={monthlyPatternSummary.hasClusteredSpending ? 'Clustered' : 'Steady'}
                      />
                    </div>
                  </section>

                  <div className="flex min-w-0 flex-col gap-6">
                    <ProbabilityWindow
                      riskLabel={budgetState.riskLabel}
                      zoneLabel={budgetState.zoneLabel}
                      paceLabel={budgetState.paceLabel}
                    />
                  </div>
                </div>

                <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
                      <div className="mb-5 flex flex-col gap-1">
                        <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Monthly Budget</h2>
                        <p className="text-sm text-[#7d6253]">Your core budget setup for this month.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {isEditingBudget ? (
                          <form onSubmit={handleBudgetSubmit} className="min-w-0 rounded-3xl border border-[#ead9c8] bg-white/70 p-4 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a48673]">Monthly budget</p>
                              <input
                                type="number"
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-[#ead9c8] bg-white px-2 py-1 text-sm text-[#3a2118] outline-none"
                                min="1"
                                required
                              />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button type="submit" className="rounded-lg bg-[#4b2c22] px-3 py-1 text-xs font-bold text-[#fff7ed]">Save</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingBudget(false);
                                  setBudgetInput(String(monthlyBudget));
                                  setBudgetMessage('');
                                }}
                                className="rounded-lg bg-[#ead9c8] px-3 py-1 text-xs font-semibold text-[#6e4d3f]"
                              >
                                Cancel
                              </button>
                            </div>
                            {budgetMessage && <p className="mt-1 text-[10px] text-[#7d6253] font-medium">{budgetMessage}</p>}
                          </form>
                        ) : (
                          <SummaryTile
                            label="Monthly budget"
                            value={`₹${monthlyBudget}`}
                            action={
                              <button
                                onClick={() => {
                                  setIsEditingBudget(true);
                                  setBudgetMessage('');
                                }}
                                className="text-xs font-semibold text-[#8a6557] hover:underline"
                              >
                                Change Budget
                              </button>
                            }
                          />
                        )}
                        <SummaryTile label="Days remaining" value={String(daysRemaining)} />
                        <SummaryTile label="Expenses logged" value={String(totalExpensesLogged)} />
                      </div>
                    </section>

                <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight text-[#3a2118]">Add expense</h2>
                    <p className="text-sm text-[#7d6253]">Log a simple expense for this demo session.</p>
                  </div>

                  <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                      Amount
                      <input className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition placeholder:text-[#b79b89] focus:border-[#9a715f]" min="1" onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" required type="number" value={amount} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                      Category
                      <select className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition focus:border-[#9a715f]" onChange={(event) => setCategory(event.target.value as MockExpense['category'])} value={category}>
                        {expenseCategories.map((expenseCategory) => <option key={expenseCategory} value={expenseCategory}>{expenseCategory}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035] md:col-span-2">
                      Note
                      <input className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition placeholder:text-[#b79b89] focus:border-[#9a715f]" onChange={(event) => setNote(event.target.value)} placeholder="e.g. Canteen lunch" required type="text" value={note} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-[#5d4035]">
                      Date
                      <input className="min-w-0 rounded-2xl border border-[#ead9c8] bg-white/80 px-4 py-3 text-[#3a2118] outline-none transition focus:border-[#9a715f]" onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
                    </label>
                    <div className="flex flex-col justify-end gap-2">
                      <button className="rounded-2xl bg-[#4b2c22] px-5 py-3 text-sm font-bold text-[#fff7ed] shadow-[0_12px_28px_rgba(75,44,34,0.24)] transition hover:bg-[#5b382c]" type="submit">Add expense</button>
                      {formMessage ? <p className="text-sm text-[#7d6253]">{formMessage}</p> : null}
                    </div>
                  </form>
                </section>
              </div>

              <aside className="flex min-w-0 flex-col gap-6 rounded-[2rem] border border-[#f0d87b] bg-[#fef9c3] p-5 shadow-[0_24px_65px_rgba(154,116,35,0.18)] sm:p-6 lg:col-span-1 lg:min-h-[calc(100vh-4rem)]">
                <PatternInsight riskLabel={budgetState.riskLabel} recentExpenses={expenses} daysRemaining={daysRemaining} />

                <section className="min-w-0 rounded-[1.75rem] border border-[#eadf9a] bg-white/55 p-5 shadow-[0_14px_32px_rgba(154,116,35,0.10)]">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Recent Activity</h2>
                    <p className="text-sm text-[#7d6253]">Your latest logged expenses for this demo session.</p>
                  </div>

                  {recentExpenses.length > 0 ? (
                    <div className="mt-5 flex flex-col gap-3">
                      {recentExpenses.slice(0, 6).map((expense) => (
                        <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-4 rounded-2xl border border-[#efe2d4] bg-white/80 p-3 shadow-[0_12px_30px_rgba(76,45,33,0.08)]" key={expense.id}>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8a6557] text-lg font-semibold uppercase text-[#fff7ed] shadow-inner">{getCategoryInitial(expense.category)}</div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#b09380]">{formatExpenseDate(expense.date)}</span>
                              <span className="rounded-full bg-[#f3e6d8] px-2.5 py-1 text-xs font-medium capitalize text-[#6e4d3f]">{expense.category}</span>
                            </div>
                            <p className="mt-1 break-words text-base font-semibold text-[#3a2118]">{expense.note}</p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[#7d6253]">{getExpenseSizeLabel(expense.amount)}</p>
                              <button onClick={() => handleDeleteExpense(expense.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#c49a84] transition hover:bg-[#f3e6d8] hover:text-[#4b2c22]" title="Delete expense">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-[#ead9c8] bg-white/70 p-4 text-sm text-[#7d6253]">No expenses yet. Add your first expense when you are ready.</p>
                  )}
                </section>
              </aside>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="flex flex-col gap-6">
              <PatternInsight
                riskLabel={budgetState.riskLabel}
                recentExpenses={expenses}
                daysRemaining={daysRemaining}
              />

              {monthlyPatternSummary.totalExpensesThisMonth === 0 ? (
                <div className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-8 text-center shadow-[0_18px_48px_rgba(76,45,33,0.10)]">
                  <p className="text-lg font-bold text-[#3a2118]">No pattern history yet</p>
                  <p className="mt-2 text-sm text-[#7d6253]">
                    Log some expenses in the Overview tab to view your monthly patterns.
                  </p>
                </div>
              ) : (
                <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6 flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Monthly spending patterns</h2>
                    <p className="text-sm text-[#7d6253]">Deterministic analysis based on your activity this month.</p>
                  </div>

                  <div className="rounded-2xl bg-white/60 p-4 border border-[#efe2d4]">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7968]">Activity Rhythm</h3>
                    <p className="mt-2 text-base font-semibold text-[#3a2118]">
                      {monthlyPatternSummary.currentMonthActivitySummary}
                    </p>
                    <p className="mt-1 text-sm text-[#7d6253]">
                      You have logged <span className="font-semibold text-[#3a2118]">{monthlyPatternSummary.totalExpensesThisMonth} expenses</span> this month.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/60 p-4 border border-[#efe2d4] flex flex-col gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7968]">Top Categories</h3>
                      <p className="text-sm text-[#7d6253]">
                        Most frequent: <span className="font-semibold text-[#3a2118] capitalize">{monthlyPatternSummary.mostFrequentCategory}</span>
                      </p>
                      <div className="flex flex-col gap-2 mt-2">
                        {monthlyPatternSummary.categoryFrequencyBreakdown.map((item) => (
                          <div key={item.category} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-[#3a2118]">{item.category}</span>
                            <span className="rounded-full bg-[#f3e6d8] px-2.5 py-0.5 text-xs font-semibold text-[#6e4d3f]">
                              {item.count} {item.count === 1 ? 'time' : 'times'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/60 p-4 border border-[#efe2d4] flex flex-col gap-4">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7968]">Timing & Trends</h3>
                      
                      <div>
                        <h4 className="text-[10px] font-bold text-[#7d6253] uppercase tracking-wider">Weekly distribution</h4>
                        <p className="mt-1 text-sm text-[#3a2118]">
                          {monthlyPatternSummary.weekdayExpenseCount > 0 || monthlyPatternSummary.weekendExpenseCount > 0 ? (
                            <>
                              You have logged <span className="font-semibold">{monthlyPatternSummary.weekdayExpenseCount} weekday</span> spends and <span className="font-semibold">{monthlyPatternSummary.weekendExpenseCount} weekend</span> spends.
                            </>
                          ) : (
                            "No weekly distribution data available."
                          )}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-[#7d6253] uppercase tracking-wider">Small Spends Pace</h4>
                        <p className="mt-1 text-sm text-[#3a2118]">
                          {monthlyPatternSummary.hasRepeatedSmallPurchases ? (
                            "A high frequency of smaller purchases has been detected. These can accumulate quietly over time."
                          ) : (
                            "Your small spends are well spaced, keeping your budget pace steady."
                          )}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-[#7d6253] uppercase tracking-wider">Spending rhythm</h4>
                        <p className="mt-1 text-sm text-[#3a2118]">
                          {monthlyPatternSummary.hasClusteredSpending ? (
                            "Bursty clusters of spending detected. Spends are concentrated in certain short periods."
                          ) : (
                            "Your spending is relatively evenly distributed across the month so far."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <section className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(76,45,33,0.10)] sm:p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#3a2118]">Settings</h2>
                <p className="text-sm text-[#7d6253]">Manage your demo session configurations.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white/60 p-4 border border-[#efe2d4] flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7968]">Monthly Budget</h3>
                  <p className="text-sm text-[#7d6253]">
                    Update your total spending budget for this monthly cycle. Recalculates risk indicators and daily allowance automatically.
                  </p>
                  
                  <form onSubmit={handleBudgetSubmit} className="flex flex-col gap-3 mt-2">
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#5d4035]">
                      Budget Value (₹)
                      <input
                        type="number"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        className="rounded-xl border border-[#ead9c8] bg-white px-3 py-2 text-sm text-[#3a2118] outline-none"
                        min="1"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="w-fit rounded-xl bg-[#4b2c22] px-4 py-2 text-sm font-bold text-[#fff7ed] shadow transition hover:bg-[#5b382c]"
                    >
                      Save Budget
                    </button>
                    {budgetMessage && <p className="text-xs text-[#7d6253] font-medium">{budgetMessage}</p>}
                  </form>
                </div>

                <div className="rounded-2xl bg-white/60 p-4 border border-[#efe2d4] flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7968]">Session Data</h3>
                  <p className="text-sm text-[#7d6253]">
                    Reset the mock expenses back to the default dataset or clear everything.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setExpenses(mockExpenses.map((expense, index) => ({
                          ...expense,
                          id: createExpenseId(expense, index),
                        })));
                        setFormMessage('Expenses reset to mock defaults.');
                      }}
                      className="rounded-xl bg-[#ead9c8] px-4 py-2 text-sm font-semibold text-[#6e4d3f] hover:bg-[#dfcdbb] transition"
                    >
                      Reset to defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenses([]);
                        setFormMessage('All expenses cleared.');
                      }}
                      className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      Clear all expenses
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function SidebarItem({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-24 flex-1 items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-medium transition lg:min-w-0 lg:flex-none lg:flex-col lg:px-3 lg:py-5 ${
        active
          ? 'bg-[#fffaf3] text-[#3a2118] shadow-[0_12px_30px_rgba(48,28,20,0.18)]'
          : 'text-[#fff3e7] hover:bg-white/10'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function BunnyLogo() {
  return (
    <div className="flex flex-col items-center justify-center p-1 lg:mb-2">
      <svg width="56" height="80" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BUNO Bunny Logo">
        {/* Left Ear */}
        <ellipse cx="36" cy="28" rx="8" ry="26" fill="#8B4513" transform="rotate(-10 36 28)" />
        <ellipse cx="36" cy="28" rx="4.5" ry="20" fill="#C08B6B" transform="rotate(-10 36 28)" />
        {/* Right Ear */}
        <ellipse cx="64" cy="28" rx="8" ry="26" fill="#8B4513" transform="rotate(10 64 28)" />
        <ellipse cx="64" cy="28" rx="4.5" ry="20" fill="#C08B6B" transform="rotate(10 64 28)" />

        {/* Head */}
        <circle cx="50" cy="62" r="22" fill="#D2B48C" />

        {/* Eyes */}
        <circle cx="42" cy="58" r="2.5" fill="#3E2215" />
        <circle cx="58" cy="58" r="2.5" fill="#3E2215" />

        {/* Nose */}
        <ellipse cx="50" cy="65" rx="2" ry="1.5" fill="#3E2215" />

        {/* Mouth */}
        <path d="M 47 68 Q 50 72 53 68" stroke="#3E2215" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Body */}
        <ellipse cx="50" cy="108" rx="24" ry="28" fill="#8B4513" />

        {/* Belly */}
        <ellipse cx="50" cy="110" rx="14" ry="18" fill="#D2B48C" />

        {/* Coins on stomach */}
        <ellipse cx="50" cy="104" rx="10" ry="3.5" fill="#C8913B" stroke="#A67424" strokeWidth="1" />
        <ellipse cx="50" cy="109" rx="10" ry="3.5" fill="#D4A04A" stroke="#B8892E" strokeWidth="1" />
        <ellipse cx="50" cy="114" rx="10" ry="3.5" fill="#E0B05A" stroke="#C89838" strokeWidth="1" />

        {/* Feet */}
        <ellipse cx="34" cy="132" rx="10" ry="5" fill="#8B4513" />
        <ellipse cx="66" cy="132" rx="10" ry="5" fill="#8B4513" />
      </svg>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-[#ead9c8] bg-white/70 p-4 flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a48673]">{label}</p>
        <p className="mt-2 break-words text-lg font-bold text-[#3a2118]">{value}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
