'use client';

import React from 'react';
import { PlanGate } from './PlanGate';

export interface CandidateCardData {
  id: string;
  name: string;
  avatarUrl?: string;
  matchScore: number;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  verifiedSkillsCount: number;
  rating?: number;
}

interface PipelineCardProps {
  candidate: CandidateCardData;
  onSelect: (candidate: CandidateCardData) => void;
  onMoveStage?: (id: string, direction: 'prev' | 'next') => void;
}

export function PipelineCard({
  candidate,
  onSelect,
  onMoveStage,
}: PipelineCardProps) {
  return (
    <div
      onClick={() => onSelect(candidate)}
      className="p-3.5 rounded-xl bg-base-100 border border-base-300 shadow-xs flex flex-col gap-2.5 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-sm leading-tight text-base-content group-hover:text-primary transition-colors">
            {candidate.name}
          </h4>
          <span className="text-[11px] text-success font-medium">
            ✓ {candidate.verifiedSkillsCount} verified certs
          </span>
        </div>
      </div>

      <PlanGate requiredPlan="growth" fallbackText="Upgrade to Growth to see match %">
        <div className="flex justify-between items-center bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
          <span className="text-[10px] font-semibold text-primary uppercase">
            Match Score
          </span>
          <span className="text-xs font-bold font-mono text-primary">
            {candidate.matchScore}%
          </span>
        </div>
      </PlanGate>

      {onMoveStage && (
        <div
          className="flex justify-between items-center pt-2 border-t border-base-200 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onMoveStage(candidate.id, 'prev')}
            className="btn btn-ghost btn-xs text-base-content/60"
            disabled={candidate.stage === 'applied'}
          >
            ← Move
          </button>
          <button
            onClick={() => onMoveStage(candidate.id, 'next')}
            className="btn btn-ghost btn-xs text-primary font-semibold"
            disabled={candidate.stage === 'hired'}
          >
            Move →
          </button>
        </div>
      )}
    </div>
  );
}
