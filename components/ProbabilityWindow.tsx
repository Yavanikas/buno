'use client';

import { useEffect, useState } from 'react';
import type { BudgetState } from '../lib/calc';

type RiskLabel = BudgetState['riskLabel'];
type ZoneLabel = BudgetState['zoneLabel'];
type PaceLabel = BudgetState['paceLabel'];

type ProbabilityWindowProps = {
  riskLabel: RiskLabel;
  zoneLabel?: ZoneLabel;
  paceLabel?: PaceLabel;
  [unusedProp: string]: unknown;
};

type AdviceResponse = {
  advice?: string;
};

type RiskBadgeStyle = {
  label: string;
  className: string;
  dotClassName: string;
};

const FALLBACK_ADVICE = 'Keep an eye on your pace today.';

const riskBadgeStyles: Record<RiskLabel, RiskBadgeStyle> = {
  safe: {
    label: 'Safe',
    className: 'border-[#d6b07d]/60 bg-[#6d4735]/70 text-[#fff7ed]',
    dotClassName: 'bg-[#99c28a]',
  },
  watchful: {
    label: 'Watchful',
    className: 'border-[#d6a15e]/70 bg-[#6d4735]/70 text-[#fff7ed]',
    dotClassName: 'bg-[#d8a35d]',
  },
  fragile: {
    label: 'Fragile',
    className: 'border-[#d28d78]/70 bg-[#6d4735]/70 text-[#fff7ed]',
    dotClassName: 'bg-[#d98268]',
  },
};

const zoneLabels: Record<RiskLabel, ZoneLabel> = {
  safe: 'Comfortable zone',
  watchful: 'Watchful zone',
  fragile: 'Fragile zone',
};

const paceLabels: Record<RiskLabel, PaceLabel> = {
  safe: 'Flexible today',
  watchful: 'Pace is tightening',
  fragile: 'Very limited flexibility',
};

export default function ProbabilityWindow({
  riskLabel,
  zoneLabel,
  paceLabel,
}: ProbabilityWindowProps) {
  const [advice, setAdvice] = useState<string>(FALLBACK_ADVICE);
  const [isLoading, setIsLoading] = useState(true);
  const safeRiskLabel = isRiskLabel(riskLabel) ? riskLabel : 'watchful';
  const safeZoneLabel = toSafeLabel(zoneLabel, zoneLabels[safeRiskLabel]);
  const safePaceLabel = toSafeLabel(paceLabel, paceLabels[safeRiskLabel]);
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
            zoneLabel: safeZoneLabel,
            paceLabel: safePaceLabel,
          }),
        });

        if (!response.ok) {
          throw new Error('Advice request failed');
        }

        const data = (await response.json()) as AdviceResponse;
        const nextAdvice = toSafeAdvice(data.advice);

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
  }, [riskLabel, zoneLabel, paceLabel]);

  if (isLoading) {
    return <ProbabilityWindowSkeleton />;
  }

  return (
    <section className="overflow-hidden rounded-[2.25rem] border border-[#6f4938] bg-[radial-gradient(circle_at_top_left,#704634,#3f241b_58%,#2f1a14)] p-6 text-[#fff7ed] shadow-[0_28px_70px_rgba(76,45,33,0.28)] sm:p-8 lg:p-10">
      <div className="flex min-w-0 flex-col gap-10">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d8c1ad]">Today&apos;s Spending Window</p>
          <div
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-inner ${riskBadge.className}`}
            aria-label={`Current spending risk: ${riskBadge.label}`}
          >
            <span className={`h-3 w-3 rounded-full ${riskBadge.dotClassName}`} aria-hidden="true" />
            {riskBadge.label}
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 py-2 text-center sm:py-6">
          <div className="flex flex-col gap-3">
            <h2 className="break-words text-5xl font-semibold tracking-tight text-[#fffaf3] sm:text-6xl lg:text-7xl">
              {safeZoneLabel}
            </h2>
            <p className="text-xl leading-8 text-[#ead5c2] sm:text-2xl">{safePaceLabel}</p>
          </div>

          <p className="max-w-xl break-words text-sm leading-6 text-[#d8c1ad] sm:text-base">{advice}</p>
        </div>
      </div>
    </section>
  );
}

function isRiskLabel(value: unknown): value is RiskLabel {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function toSafeLabel(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const label = value.trim();

  if (!label || isBrokenText(label) || containsExactAmount(label)) {
    return fallback;
  }

  return label;
}

function toSafeAdvice(value: unknown): string {
  return toSafeLabel(value, FALLBACK_ADVICE);
}

function isBrokenText(value: string): boolean {
  const normalizedValue = value.toLowerCase();

  return normalizedValue === 'undefined' || normalizedValue === 'null' || normalizedValue === 'nan';
}

function containsExactAmount(value: string): boolean {
  return /₹|\brs\.?\b|\brupees?\b|\d/.test(value.toLowerCase());
}

function ProbabilityWindowSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-[2.25rem] border border-[#6f4938] bg-[#4b2c22] p-6 shadow-[0_28px_70px_rgba(76,45,33,0.28)] sm:p-8 lg:p-10"
      aria-label="Loading today's spending window"
    >
      <div className="flex animate-pulse flex-col gap-10">
        <div className="flex items-start justify-between gap-4">
          <div className="h-4 w-48 max-w-full rounded bg-[#7b5749]" />
          <div className="h-9 w-28 shrink-0 rounded-full bg-[#7b5749]" />
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-2 sm:py-6">
          <div className="h-14 w-64 max-w-full rounded bg-[#7b5749] sm:h-16" />
          <div className="h-6 w-52 max-w-full rounded bg-[#7b5749]" />
          <div className="h-4 w-full max-w-xl rounded bg-[#7b5749]" />
        </div>
      </div>
    </section>
  );
}
