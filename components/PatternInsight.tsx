'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RiskLabel } from '../lib/calc';
import type { PatternExpense } from '../lib/patterns';

type PatternInsightProps = {
  riskLabel: RiskLabel;
  recentExpenses: PatternExpense[];
  daysRemaining?: number;
};

type PatternInsightResponse = {
  patternTag?: string;
  insight?: string;
  confidence?: 'low' | 'medium' | 'high';
};

type PatternInsightState = {
  patternTag: string;
  insight: string;
  confidence: 'low' | 'medium' | 'high';
};

const FALLBACK_PATTERN_INSIGHT: PatternInsightState = {
  patternTag: 'Recent activity',
  insight: 'Recent spending activity is worth watching over the next few days.',
  confidence: 'low',
};

export default function PatternInsight({
  riskLabel,
  recentExpenses,
  daysRemaining,
}: PatternInsightProps) {
  const [patternInsight, setPatternInsight] = useState(FALLBACK_PATTERN_INSIGHT);
  const [isLoading, setIsLoading] = useState(true);
  const safeRiskLabel = isRiskLabel(riskLabel) ? riskLabel : 'watchful';
  const safeDaysRemaining = typeof daysRemaining === 'number' && Number.isFinite(daysRemaining) ? daysRemaining : undefined;
  const safeRecentExpenses = useMemo(
    () => (Array.isArray(recentExpenses) ? recentExpenses : []),
    [recentExpenses],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPatternInsight() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/pattern-insight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            riskLabel: safeRiskLabel,
            recentExpenses: safeRecentExpenses,
            daysRemaining: safeDaysRemaining,
          }),
        });

        if (!response.ok) {
          throw new Error('Pattern insight request failed');
        }

        const data = (await response.json()) as PatternInsightResponse;
        const nextPatternInsight = toSafePatternInsight(data);

        if (isMounted) {
          setPatternInsight(nextPatternInsight);
        }
      } catch {
        if (isMounted) {
          setPatternInsight(FALLBACK_PATTERN_INSIGHT);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPatternInsight();

    return () => {
      isMounted = false;
    };
  }, [safeRiskLabel, safeRecentExpenses, safeDaysRemaining]);

  if (isLoading) {
    return <PatternInsightSkeleton />;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Pattern Insight</h2>
          <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {patternInsight.patternTag}
          </span>
        </div>

        <p className="max-w-prose text-sm leading-6 text-slate-600">{patternInsight.insight}</p>

        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Confidence: {patternInsight.confidence}
        </p>
      </div>
    </section>
  );
}

function toSafePatternInsight(value: PatternInsightResponse) {
  return {
    patternTag: toSafeText(value.patternTag, FALLBACK_PATTERN_INSIGHT.patternTag),
    insight: toSafeText(value.insight, FALLBACK_PATTERN_INSIGHT.insight),
    confidence: isConfidence(value.confidence) ? value.confidence : FALLBACK_PATTERN_INSIGHT.confidence,
  };
}

function toSafeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const text = value.trim();

  if (!text || isBrokenText(text) || containsExactAmount(text)) {
    return fallback;
  }

  return text;
}

function isRiskLabel(value: unknown): value is RiskLabel {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function isConfidence(value: unknown): value is 'low' | 'medium' | 'high' {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isBrokenText(value: string): boolean {
  const normalizedValue = value.toLowerCase();

  return normalizedValue === 'undefined' || normalizedValue === 'null' || normalizedValue === 'nan';
}

function containsExactAmount(value: string): boolean {
  return /₹|\brs\.?\b|\brupees?\b|\d/.test(value.toLowerCase());
}

function PatternInsightSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md" aria-label="Loading pattern insight">
      <div className="flex animate-pulse flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="h-7 w-32 rounded-full bg-slate-200" />
        </div>
        <div className="h-4 max-w-prose rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>
    </section>
  );
}
