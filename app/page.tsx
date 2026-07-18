import ProbabilityWindow from '../components/ProbabilityWindow';
import { mockExpenses } from '../data/mockExpenses';
import { getBudgetState, getRemainingDays } from '../lib/calc';

const monthlyBudget = 8000;

export default function Home() {
  const today = new Date();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = getRemainingDays(today, monthEnd);
  const totalExpensesLogged = Array.isArray(mockExpenses) ? mockExpenses.length : 0;
  const budgetState = getBudgetState({
    totalBudget: monthlyBudget,
    expenses: mockExpenses,
    remainingDays: daysRemaining,
  });

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

      <ProbabilityWindow
        riskLabel={budgetState.riskLabel}
        zoneLabel={budgetState.zoneLabel}
        paceLabel={budgetState.paceLabel}
      />
    </main>
  );
}
