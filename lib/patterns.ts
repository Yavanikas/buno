import type { Expense, RiskLabel } from './calc';

export type PatternExpense = Expense & {
  category?: string;
  note?: string;
};

export type PatternExpenseSample = {
  category: string;
  timing: 'weekday' | 'weekend' | 'unknown';
  size: 'small' | 'medium' | 'larger';
  note: string;
};

export type PatternSummary = {
  recentExpenseCount: number;
  uniqueCategoriesCount: number;
  topCategoryByFrequency: string;
  topCategoryByTotalSpend: string;
  weekendExpenseCount: number;
  weekdayExpenseCount: number;
  appearsClusteredInLastFiveDays: boolean;
  hasRepeatedSmallPurchases: boolean;
  hasDominantCategory: boolean;
  spendingRhythm: 'even' | 'bursty' | 'not enough data';
  sampleWindowDays: number;
  expenseSample: PatternExpenseSample[];
  riskLabel: RiskLabel;
  daysRemaining: number | null;
};

type NormalizedExpense = {
  amount: number;
  category: string;
  note: string;
  time: number;
  date: Date;
};

const FALLBACK_CATEGORY = 'uncategorized';
const MAX_SAMPLE_SIZE = 8;
const DEFAULT_WINDOW_DAYS = 14;
const RECENT_CLUSTER_DAYS = 5;

// Builds a safe, qualitative recent-spending summary before any model call.
export function getRecentPatternSummary(
  expenses: PatternExpense[] = [],
  options: { riskLabel?: RiskLabel; daysRemaining?: number; windowDays?: number } = {},
): PatternSummary {
  const windowDays = clampWholeNumber(options.windowDays, 7, DEFAULT_WINDOW_DAYS);
  const safeRiskLabel = isRiskLabel(options.riskLabel) ? options.riskLabel : 'watchful';
  const safeDaysRemaining = toNullableWholeNumber(options.daysRemaining);
  const normalizedExpenses = normalizeExpenses(expenses);

  if (normalizedExpenses.length === 0) {
    return createEmptySummary(windowDays, safeRiskLabel, safeDaysRemaining);
  }

  const latestExpenseTime = Math.max(...normalizedExpenses.map((expense) => expense.time));
  const firstIncludedTime = latestExpenseTime - (windowDays - 1) * getMillisecondsPerDay();
  const recentExpenses = normalizedExpenses.filter(
    (expense) => expense.time >= firstIncludedTime && expense.time <= latestExpenseTime,
  );

  if (recentExpenses.length === 0) {
    return createEmptySummary(windowDays, safeRiskLabel, safeDaysRemaining);
  }

  const categoryFrequency = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  let weekendExpenseCount = 0;
  let weekdayExpenseCount = 0;
  let smallPurchaseCount = 0;
  let lastFiveDayCount = 0;

  for (const expense of recentExpenses) {
    categoryFrequency.set(expense.category, (categoryFrequency.get(expense.category) ?? 0) + 1);
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);

    if (isWeekend(expense.date)) {
      weekendExpenseCount += 1;
    } else {
      weekdayExpenseCount += 1;
    }

    if (getAmountSize(expense.amount) === 'small') {
      smallPurchaseCount += 1;
    }

    if (expense.time >= latestExpenseTime - (RECENT_CLUSTER_DAYS - 1) * getMillisecondsPerDay()) {
      lastFiveDayCount += 1;
    }
  }

  const topCategoryByFrequency = getTopMapKey(categoryFrequency);
  const topCategoryByTotalSpend = getTopMapKey(categoryTotals);
  const topCategoryFrequency = topCategoryByFrequency ? categoryFrequency.get(topCategoryByFrequency) ?? 0 : 0;
  const appearsClusteredInLastFiveDays = recentExpenses.length >= 4 && lastFiveDayCount / recentExpenses.length >= 0.6;
  const hasRepeatedSmallPurchases = smallPurchaseCount >= 4 || smallPurchaseCount / recentExpenses.length >= 0.5;
  const hasDominantCategory = recentExpenses.length >= 3 && topCategoryFrequency / recentExpenses.length >= 0.5;

  return {
    recentExpenseCount: recentExpenses.length,
    uniqueCategoriesCount: categoryFrequency.size,
    topCategoryByFrequency: topCategoryByFrequency || 'not enough data',
    topCategoryByTotalSpend: topCategoryByTotalSpend || 'not enough data',
    weekendExpenseCount,
    weekdayExpenseCount,
    appearsClusteredInLastFiveDays,
    hasRepeatedSmallPurchases,
    hasDominantCategory,
    spendingRhythm: getSpendingRhythm(recentExpenses),
    sampleWindowDays: windowDays,
    expenseSample: recentExpenses.slice(-MAX_SAMPLE_SIZE).map(toExpenseSample),
    riskLabel: safeRiskLabel,
    daysRemaining: safeDaysRemaining,
  };
}

function createEmptySummary(
  windowDays: number,
  riskLabel: RiskLabel,
  daysRemaining: number | null,
): PatternSummary {
  return {
    recentExpenseCount: 0,
    uniqueCategoriesCount: 0,
    topCategoryByFrequency: 'not enough data',
    topCategoryByTotalSpend: 'not enough data',
    weekendExpenseCount: 0,
    weekdayExpenseCount: 0,
    appearsClusteredInLastFiveDays: false,
    hasRepeatedSmallPurchases: false,
    hasDominantCategory: false,
    spendingRhythm: 'not enough data',
    sampleWindowDays: windowDays,
    expenseSample: [],
    riskLabel,
    daysRemaining,
  };
}

function normalizeExpenses(expenses: PatternExpense[]): NormalizedExpense[] {
  if (!Array.isArray(expenses)) {
    return [];
  }

  return expenses.flatMap((expense) => {
    if (!isRecord(expense)) {
      return [];
    }

    const amount = toSafeNumber(expense.amount);
    const date = toStartOfDay(expense.date);
    const time = date.getTime();

    if (amount <= 0 || !Number.isFinite(time)) {
      return [];
    }

    return [
      {
        amount,
        category: toSafeText(expense.category, FALLBACK_CATEGORY),
        note: toSafeText(expense.note, 'expense'),
        time,
        date,
      },
    ];
  });
}

function toExpenseSample(expense: NormalizedExpense): PatternExpenseSample {
  return {
    category: expense.category,
    timing: isWeekend(expense.date) ? 'weekend' : 'weekday',
    size: getAmountSize(expense.amount),
    note: expense.note,
  };
}

function getSpendingRhythm(expenses: NormalizedExpense[]): PatternSummary['spendingRhythm'] {
  if (expenses.length < 4) {
    return 'not enough data';
  }

  const expensesPerDay = new Map<number, number>();

  for (const expense of expenses) {
    expensesPerDay.set(expense.time, (expensesPerDay.get(expense.time) ?? 0) + 1);
  }

  const busiestDayCount = Math.max(...expensesPerDay.values());

  return busiestDayCount >= 3 || busiestDayCount / expenses.length >= 0.45 ? 'bursty' : 'even';
}

function getTopMapKey(map: Map<string, number>): string {
  let topKey = '';
  let topValue = -1;

  for (const [key, value] of map) {
    if (value > topValue) {
      topKey = key;
      topValue = value;
    }
  }

  return topKey;
}

function getAmountSize(amount: number): PatternExpenseSample['size'] {
  if (amount <= 150) {
    return 'small';
  }

  if (amount <= 500) {
    return 'medium';
  }

  return 'larger';
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function clampWholeNumber(value: unknown, minimum: number, fallback: number): number {
  const safeValue = Math.floor(toSafeNumber(value));

  return safeValue >= minimum ? safeValue : fallback;
}

function toNullableWholeNumber(value: unknown): number | null {
  const safeValue = Math.floor(toSafeNumber(value));

  return safeValue >= 0 ? safeValue : null;
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toSafeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || containsExactAmount(trimmedValue)) {
    return fallback;
  }

  return trimmedValue.slice(0, 60);
}

function containsExactAmount(value: string): boolean {
  return /₹|\brs\.?\b|\brupees?\b|\d/.test(value.toLowerCase());
}

function toStartOfDay(date: unknown): Date {
  const parsedDate = date instanceof Date || typeof date === 'string' ? new Date(date) : new Date(Number.NaN);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}

function getMillisecondsPerDay(): number {
  return 24 * 60 * 60 * 1000;
}

function isRiskLabel(value: unknown): value is RiskLabel {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
