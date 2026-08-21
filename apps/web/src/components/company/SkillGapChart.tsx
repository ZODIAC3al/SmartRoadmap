'use client';

import React from 'react';
import { PlanGate } from './PlanGate';

const MOCK_GAPS = [
  { skill: 'System Design & Architecture', missingPercent: 62 },
  { skill: 'Unit & Integration Testing (Jest)', missingPercent: 41 },
  { skill: 'Docker & Kubernetes Containerization', missingPercent: 38 },
  { skill: 'GraphQL & Apollo Server', missingPercent: 29 },
];

export function SkillGapChart() {
  return (
    <div className="p-6 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-base-content">
          Aggregate Applicant Skill Gap Analysis
        </h3>
        <span className="badge badge-xs badge-neutral font-mono uppercase">
          Scale Feature
        </span>
      </div>

      <PlanGate
        requiredPlan="scale"
        fallbackText="Upgrade to Scale plan for aggregate applicant skill gap analytics and CSV/PDF export."
      >
        <div className="space-y-3">
          {MOCK_GAPS.map((g) => (
            <div key={g.skill} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-base-content font-semibold">{g.skill}</span>
                <span className="font-mono text-warning font-bold">
                  {g.missingPercent}% missing
                </span>
              </div>
              <progress
                className="progress progress-warning w-full h-2 rounded-full"
                value={g.missingPercent}
                max="100"
              />
            </div>
          ))}
        </div>
      </PlanGate>
    </div>
  );
}
