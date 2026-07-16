export type Expense = {
  amount: number;
  date: Date | string;
};

export type SafetyRange = {
  low: number;
  high: number;
};

export type RiskLabel = 'safe' | 'watchful' | 'fragile';

// Adds up every expense amount to show how much has been spent so far.
export function getSpentSoFar(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Subtracts the spent money from the full budget to show what is still left.
export function getRemainingBudget(budget: number, spent: number): number {
  return budget - spent;
}

// Counts how many calendar days remain from today through the end date.
export function getRemainingDays(today: Date | string, monthEnd: Date | string): number {
  const start = toStartOfDay(today).getTime();
  const end = toStartOfDay(monthEnd).getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((end - start) / millisecondsPerDay) + 1);
}

// Divides the money that is left by the days that are left to get a daily amount.
export function getBaseDailyAllowance(remainingBudget: number, remainingDays: number): number {
  if (remainingDays <= 0) {
    return 0;
  }

  return remainingBudget / remainingDays;
}

// Creates a simple low-to-high spending range around the daily allowance.
export function getSafetyRange(baseAllowance: number): SafetyRange {
  return {
    low: baseAllowance * 0.8,
    high: baseAllowance,
  };
}

// Finds the average daily spending from expenses within the most recent number of days.
export function getRecentAverage(expenses: Expense[], lastNDays: number): number {
  if (lastNDays <= 0 || expenses.length === 0) {
    return 0;
  }

  const latestExpenseTime = Math.max(
    ...expenses.map((expense) => toStartOfDay(expense.date).getTime()),
  );
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const firstIncludedDay = latestExpenseTime - (lastNDays - 1) * millisecondsPerDay;
  const recentTotal = expenses.reduce((total, expense) => {
    const expenseTime = toStartOfDay(expense.date).getTime();

    if (expenseTime < firstIncludedDay || expenseTime > latestExpenseTime) {
      return total;
    }

    return total + expense.amount;
  }, 0);

  return recentTotal / lastNDays;
}

// Labels spending as safe, watchful, or fragile by comparing it to the safety range.
export function getRiskLabel(recentAverage: number, safetyRange: SafetyRange): RiskLabel {
  if (recentAverage <= safetyRange.low) {
    return 'safe';
  }

  if (recentAverage <= safetyRange.high) {
    return 'watchful';
  }

  return 'fragile';
}

function toStartOfDay(date: Date | string): Date {
  const parsedDate = new Date(date);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}
