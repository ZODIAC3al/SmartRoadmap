'use client';

import React from 'react';
import Link from 'next/link';
import { PipelineBoard } from '@/components/company/PipelineBoard';
import { useGetJobsQuery, selectJobById } from '@/store/api/jobsApi';

export default function JobKanbanPage({ params }: { params: { jobId: string } }) {
  const { data: jobsData } = useGetJobsQuery();
  const job = jobsData ? selectJobById(jobsData, params.jobId) : null;
  const jobTitle = job?.title || 'Job Pipeline';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-base-content/60 mb-1">
            <Link href="/company/jobs" className="hover:underline text-primary">
              ← Jobs List
            </Link>
            <span>/</span>
            <span>Kanban Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-base-content">
            {jobTitle}
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline btn-warning text-xs font-semibold">
            ⚡ Boost Job ($15)
          </button>
        </div>
      </div>

      <PipelineBoard jobId={params.jobId} />
    </div>
  );
}
