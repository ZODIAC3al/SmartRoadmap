'use client';

import React from 'react';

interface FunnelStage {
  stage: string;
  count: number;
  conversionPercent: number;
}

const DEFAULT_STAGES: FunnelStage[] = [
  { stage: 'Applied', count: 28, conversionPercent: 100 },
  { stage: 'Screening', count: 13, conversionPercent: 46 },
  { stage: 'Interview', count: 7, conversionPercent: 54 },
  { stage: 'Offer', count: 2, conversionPercent: 28 },
  { stage: 'Hired', count: 1, conversionPercent: 50 },
];

export function FunnelChart() {
  return (
    <div className="p-6 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col gap-4">
      <h3 className="font-bold text-sm text-base-content">
        Hiring Funnel Stage Conversion
      </h3>
      <div className="space-y-3">
        {DEFAULT_STAGES.map((s) => (
          <div key={s.stage} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-base-content font-semibold">{s.stage}</span>
              <span className="font-mono text-stone-700 dark:text-stone-300 font-medium">
                {s.count} candidates ({s.conversionPercent}% conv)
              </span>
            </div>
            <progress
              className="progress progress-primary w-full h-2 rounded-full"
              value={s.conversionPercent}
              max="100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
