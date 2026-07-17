'use client';

import { useEffect, useState } from 'react';

type RiskLabel = 'safe' | 'watchful' | 'fragile';

type ProbabilityWindowProps = {
  safetyRangeLow: number;
  safetyRangeHigh: number;
  riskLabel: RiskLabel;
  recentAverage: number;
};

type AdviceResponse = {
  advice?: string;
};

type RiskBadgeStyle = {
  label: string;
  className: string;
};

const FALLBACK_ADVICE = 'Keep an eye on your pace today.';

const riskBadgeStyles: Record<RiskLabel, RiskBadgeStyle> = {
  safe: {
    label: 'Safe',
    className: 'border-green-200 bg-green-50 text-green-700',
  },
  watchful: {
    label: 'Watchful',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  },
  fragile: {
    label: 'Fragile',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
};

export default function ProbabilityWindow({
  safetyRangeLow,
  safetyRangeHigh,
  riskLabel,
  recentAverage,
}: ProbabilityWindowProps) {
  const [advice, setAdvice] = useState<string>(FALLBACK_ADVICE);
  const [isLoading, setIsLoading] = useState(true);
  const safeRiskLabel = isRiskLabel(riskLabel) ? riskLabel : 'watchful';
  const safeSafetyRangeLow = toDisplayNumber(safetyRangeLow);
  const safeSafetyRangeHigh = toDisplayNumber(safetyRangeHigh);
  const safeRecentAverage = toDisplayNumber(recentAverage);
  const riskBadge = riskBadgeStyles[safeRiskLabel];

  useEffect(() => {
    let isMounted = true;

    async function loadAdvice() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/advice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            riskLabel: safeRiskLabel,
            safetyRangeLow: safeSafetyRangeLow,
            safetyRangeHigh: safeSafetyRangeHigh,
            recentAverage: safeRecentAverage,
          }),
        });

        if (!response.ok) {
          throw new Error('Advice request failed');
        }

        const data = (await response.json()) as AdviceResponse;
        const nextAdvice = data.advice?.trim() || FALLBACK_ADVICE;

        if (isMounted) {
          setAdvice(nextAdvice);
        }
      } catch {
        if (isMounted) {
          setAdvice(FALLBACK_ADVICE);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAdvice();

    return () => {
      isMounted = false;
    };
  }, [safeRecentAverage, safeRiskLabel, safeSafetyRangeHigh, safeSafetyRangeLow]);

  if (isLoading) {
    return <ProbabilityWindowSkeleton />;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-prose flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-950">Today&apos;s Spending Window</h2>
            <p className="text-3xl font-bold tracking-tight text-slate-950">
              ₹{formatCurrencyAmount(safeSafetyRangeLow)}–₹{formatCurrencyAmount(
                safeSafetyRangeHigh,
              )}
            </p>
            <p className="text-sm text-slate-500">Comfortable spending zone</p>
          </div>

          <p className="max-w-prose text-sm leading-6 text-slate-600">{advice}</p>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${riskBadge.className}`}
          aria-label={`Current spending risk: ${riskBadge.label}`}
        >
          {riskBadge.label}
        </div>
      </div>
    </section>
  );
}

function isRiskLabel(value: unknown): value is RiskLabel {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function toDisplayNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function formatCurrencyAmount(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value)) : '0';
}

function ProbabilityWindowSkeleton() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
      aria-label="Loading today's spending window"
    >
      <div className="flex animate-pulse flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-9 w-40 rounded bg-slate-200" />
            <div className="h-4 w-52 rounded bg-slate-200" />
          </div>

          <div className="h-4 max-w-prose rounded bg-slate-200" />
        </div>

        <div className="h-7 w-24 rounded-full bg-slate-200" />
      </div>
    </section>
  );
}
