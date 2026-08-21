'use client';

import React, { useState, useMemo } from 'react';
import { PipelineCard, CandidateCardData } from './PipelineCard';
import { CandidateDrawer } from './CandidateDrawer';
import { useGetCandidatesQuery, useUpdateStageMutation } from '@/store/api/pipelineApi';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface PipelineBoardProps {
  jobId: string;
}

const STAGES: { id: CandidateCardData['stage']; label: string }[] = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
];

const FALLBACK_CANDIDATES: CandidateCardData[] = [
  {
    id: 'c1',
    name: 'Ahmed Hassan',
    matchScore: 92,
    stage: 'interview',
    verifiedSkillsCount: 6,
    rating: 5,
  },
  {
    id: 'c2',
    name: 'Sara Mahmoud',
    matchScore: 84,
    stage: 'screening',
    verifiedSkillsCount: 4,
    rating: 4,
  },
  {
    id: 'c3',
    name: 'Omar Farouk',
    matchScore: 78,
    stage: 'applied',
    verifiedSkillsCount: 3,
  },
  {
    id: 'c4',
    name: 'Nour Ali',
    matchScore: 95,
    stage: 'offer',
    verifiedSkillsCount: 8,
    rating: 5,
  },
];

export function PipelineBoard({ jobId }: PipelineBoardProps) {
  const { data: candidatesData, isLoading } = useGetCandidatesQuery({ jobId });
  const [updateStageMutation] = useUpdateStageMutation();
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCardData | null>(null);

  const candidates = useMemo<CandidateCardData[]>(() => {
    if (!candidatesData) return FALLBACK_CANDIDATES;
    const items = Object.values(candidatesData.entities || {}).filter(Boolean);
    if (items.length === 0) return FALLBACK_CANDIDATES;

    return items.map((c: any) => ({
      id: c.id || c.userId,
      name: c.candidateName || 'Verified Candidate',
      matchScore: c.matchScore || 88,
      stage: (c.stage || 'applied') as CandidateCardData['stage'],
      verifiedSkillsCount: c.completedMilestones || 4,
      rating: 5,
    }));
  }, [candidatesData]);

  const moveStage = async (candidateId: string, direction: 'prev' | 'next') => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    const currentIdx = STAGES.findIndex((s) => s.id === cand.stage);
    const newIdx =
      direction === 'next'
        ? Math.min(STAGES.length - 1, currentIdx + 1)
        : Math.max(0, currentIdx - 1);
    const newStage = STAGES[newIdx].id;

    try {
      await updateStageMutation({ id: candidateId, stage: newStage }).unwrap();
      toast.success(`Candidate stage updated to "${STAGES[newIdx].label}"!`);
    } catch (err: any) {
      toast.error(err?.data?.message || err.message || 'Failed to update candidate stage');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 5-Stage Dotted Edge Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {STAGES.map((col, idx) => {
          const stageCandidates = candidates.filter((c) => c.stage === col.id);
          const isNotLast = idx < STAGES.length - 1;

          return (
            <div
              key={col.id}
              className="relative p-3.5 rounded-2xl bg-base-100 border border-base-300 flex flex-col min-h-[500px] shadow-xs"
            >
              {/* Dotted Edge Connector motif */}
              {isNotLast && (
                <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 border-b-2 border-dashed border-primary/40 z-10" />
              )}

              <div className="flex justify-between items-center mb-3.5 pb-2 border-b border-base-200">
                <span className="font-bold text-xs uppercase tracking-wider text-base-content">
                  {col.label}
                </span>
                <span className="badge badge-xs badge-neutral font-mono font-bold">
                  {stageCandidates.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {stageCandidates.map((cand) => (
                  <PipelineCard
                    key={cand.id}
                    candidate={cand}
                    onSelect={(c) => setSelectedCandidate(c)}
                    onMoveStage={moveStage}
                  />
                ))}
                {stageCandidates.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-xs text-base-content/40 italic">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Slide-Over Drawer */}
      <CandidateDrawer
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate || undefined}
      />
    </div>
  );
}
