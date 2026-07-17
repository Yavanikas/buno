export type Expense = {
  amount: number;
  date: Date | string;
};

export type SafetyRange = {
  low: number;
  high: number;
};

export type RiskLabel = 'safe' | 'watchful' | 'fragile';

// Adds up every valid expense amount to show how much has been spent so far.
export function getSpentSoFar(expenses: Expense[]): number {
  if (!Array.isArray(expenses)) {
    return 0;
  }

  return expenses.reduce((total, expense) => total + toSafeNumber(expense.amount), 0);
}

// Subtracts the spent money from the full budget to show what is still left.
export function getRemainingBudget(budget: number, spent: number): number {
  const remainingBudget = toSafeNumber(budget) - toSafeNumber(spent);

  return Math.max(0, remainingBudget);
}

// Counts how many calendar days remain from today through the end date.
export function getRemainingDays(today: Date | string, monthEnd: Date | string): number {
  const start = toStartOfDay(today).getTime();
  const end = toStartOfDay(monthEnd).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((end - start) / millisecondsPerDay) + 1);
}

// Divides the money that is left by the days that are left to get a daily amount.
export function getBaseDailyAllowance(remainingBudget: number, remainingDays: number): number {
  const safeRemainingBudget = toSafeNumber(remainingBudget);
  const safeRemainingDays = toSafeNumber(remainingDays);

  if (safeRemainingBudget <= 0 || safeRemainingDays <= 0) {
    return 0;
  }

  return safeRemainingBudget / safeRemainingDays;
}

// Creates a simple low-to-high spending range around the daily allowance.
export function getSafetyRange(baseAllowance: number): SafetyRange {
  const safeBaseAllowance = Math.max(0, toSafeNumber(baseAllowance));

  return {
    low: safeBaseAllowance * 0.8,
    high: safeBaseAllowance,
  };
}

// Finds the average daily spending from expenses within the most recent number of days.
export function getRecentAverage(expenses: Expense[], lastNDays: number): number {
  const safeLastNDays = toSafeNumber(lastNDays);

  if (!Array.isArray(expenses) || safeLastNDays <= 0 || expenses.length === 0) {
    return 0;
  }

  const expenseTimes = expenses
    .map((expense) => toStartOfDay(expense.date).getTime())
    .filter(Number.isFinite);

  if (expenseTimes.length === 0) {
    return 0;
  }

  const latestExpenseTime = Math.max(...expenseTimes);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const firstIncludedDay = latestExpenseTime - (safeLastNDays - 1) * millisecondsPerDay;
  const recentTotal = expenses.reduce((total, expense) => {
    const expenseTime = toStartOfDay(expense.date).getTime();

    if (
      !Number.isFinite(expenseTime) ||
      expenseTime < firstIncludedDay ||
      expenseTime > latestExpenseTime
    ) {
      return total;
    }

    return total + toSafeNumber(expense.amount);
  }, 0);

  return recentTotal / safeLastNDays;
}

// Labels spending as safe, watchful, or fragile by comparing it to the safety range.
export function getRiskLabel(recentAverage: number, safetyRange: SafetyRange): RiskLabel {
  const safeRecentAverage = toSafeNumber(recentAverage);
  const low = toSafeNumber(safetyRange?.low);
  const high = toSafeNumber(safetyRange?.high);

  if (safeRecentAverage <= low) {
    return 'safe';
  }

  if (safeRecentAverage <= high) {
    return 'watchful';
  }

  return 'fragile';
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toStartOfDay(date: Date | string): Date {
  const parsedDate = new Date(date);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}
