'use client';

import React from 'react';
import Link from 'next/link';
import { useGetMyJobsQuery } from '@/store/api/jobsApi';
import { Loader2 } from 'lucide-react';

export default function JobsListPage() {
  const { data: jobsData, isLoading } = useGetMyJobsQuery();

  const jobsList = React.useMemo(() => {
    if (!jobsData) return [];
    const items = Object.values(jobsData.entities || {}).filter(Boolean);
    return items.map((j: any) => ({
      id: j.id || j._id,
      title: j.title || 'Job Posting',
      location: j.location || 'Remote',
      applicantsCount: j.applicantCount || 0,
      status: j.status || 'published',
      postedAt: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'Recently',
      boosted: false,
    }));
  }, [jobsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-base-100 rounded-3xl border border-base-300">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-xs font-semibold text-base-content/70">Loading active jobs from database...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto text-base-content">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">Active Job Postings</h1>
          <p className="text-xs text-base-content/70 mt-1">
            Manage jobs, review candidates, and trigger candidate boosts dynamically.
          </p>
        </div>
        <Link href="/company?action=new" className="btn btn-sm btn-primary shadow-xs rounded-xl font-bold">
          + Post Job
        </Link>
      </div>

      {jobsList.length === 0 ? (
        <div className="p-12 text-center bg-base-100 rounded-3xl border border-base-300 flex flex-col items-center gap-3">
          <h3 className="font-extrabold text-base">No active job postings in database</h3>
          <p className="text-xs text-base-content/60 max-w-sm">
            Create your first job posting to start receiving verified candidate applications.
          </p>
          <Link href="/company?action=new" className="btn btn-sm btn-primary rounded-xl font-bold mt-2">
            Create First Job Posting
          </Link>
        </div>
      ) : (
        <div className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-xs">
          <table className="table w-full text-left">
            <thead>
              <tr className="bg-base-200/50 text-xs text-base-content/60 uppercase">
                <th>Job Title</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Boost Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200 text-sm">
              {jobsList.map((job) => (
                <tr key={job.id} className="hover:bg-base-200/40 transition-colors">
                  <td className="font-semibold text-base-content">
                    <Link
                      href={`/company/jobs/${job.id}`}
                      className="hover:text-primary transition-colors font-bold"
                    >
                      {job.title}
                    </Link>
                    <div className="text-xs font-normal text-base-content/60">
                      {job.location} • {job.postedAt}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-sm badge-ghost font-semibold font-mono">
                      {job.applicantsCount} Candidates
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-xs badge-success uppercase font-bold">
                      {job.status}
                    </span>
                  </td>
                  <td>
                    {job.boosted ? (
                      <span className="badge badge-xs badge-warning uppercase font-bold">
                        ⚡ BOOSTED
                      </span>
                    ) : (
                      <button className="btn btn-xs btn-outline btn-warning rounded-2xl">
                        ⚡ Boost ($15)
                      </button>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/company/jobs/${job.id}`}
                      className="btn btn-xs btn-primary btn-outline rounded-2xl font-bold"
                    >
                      Open Kanban Board
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
