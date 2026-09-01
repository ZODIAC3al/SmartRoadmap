'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, MapPin, Users, Briefcase, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { useGetCompanyBySlugQuery } from '@/store/api/companyApi';
import { useGetJobsQuery } from '@/store/api/jobsApi';

interface PublicCompanyProps {
  params: { slug: string };
}

export default function PublicCompanyPage({ params }: PublicCompanyProps) {
  const slug = params.slug;

  const { data: company, isLoading, isError } = useGetCompanyBySlugQuery(slug);
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery(undefined as any);

  const jobs = React.useMemo(() => {
    if (!jobsData) return [];
    if (Array.isArray(jobsData)) return jobsData as any[];
    return Object.values((jobsData as any).entities || {}).filter(Boolean) as any[];
  }, [jobsData]);

  const displayName = company?.name
    || slug.split('-').slice(0, -1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    || slug;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200/50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-sm font-semibold text-base-content/70">Loading company profile...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200/50 text-base-content/70">
        <span className="text-4xl">🏢</span>
        <p className="font-bold text-lg">Company profile not found.</p>
        <Link href="/company/jobs" className="btn btn-primary btn-sm rounded-xl text-xs">
          ← Back to Job Board
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/50 text-base-content p-4 sm:p-8 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header Back Button */}
        <div>
          <Link
            href="/company/jobs"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 transition-all duration-300 ease-in-out"
          >
            ← Back to Job Postings
          </Link>
        </div>

        {/* Public Profile Hero Card with Cover Banner */}
        <div className="bg-base-100 rounded-3xl border border-base-300 shadow-md overflow-hidden">
          {/* Cover Banner */}
          <div className="h-44 relative overflow-hidden">
            {company?.coverImageUrl ? (
              <Image
                src={company.coverImageUrl}
                alt={`${displayName} cover`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary via-secondary to-accent relative">
                <div className="absolute inset-0 bg-black/10" />
              </div>
            )}
          </div>

          {/* Profile Header Details */}
          <div className="p-6 md:p-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-10 mb-4">
              {/* Logo */}
              <div className="w-20 h-20 rounded-3xl bg-base-100 border-4 border-base-100 shadow-xl overflow-hidden flex items-center justify-center font-extrabold text-2xl text-primary font-heading">
                {company?.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={`${displayName} logo`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span>{displayName.substring(0, 2).toUpperCase()}</span>
                )}
              </div>

              {company?.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <span>Visit Company Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content font-heading tracking-tight">
                  {displayName}
                </h1>
                {company?.isVerified && (
                  <span className="badge badge-primary text-xs font-mono font-bold py-3 px-3 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
                {company?.about || 'Building next-generation cloud architecture, AI-driven platforms, and adaptive enterprise software. Partnered with SmartRoadmap to source verified technical talent.'}
              </p>

              <div className="flex flex-wrap gap-4 pt-3 text-xs text-base-content/60 font-medium">
                {company?.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-primary" /> {company.industry}
                  </span>
                )}
                {company?.size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-secondary" /> {company.size} Employees
                  </span>
                )}
                {company?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-accent" /> {company.location}
                  </span>
                )}
                {company?.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-info" />
                    {company.website.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Open Positions from DB */}
        <div className="bg-base-100 p-6 md:p-8 rounded-3xl border border-base-300 shadow-xs flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-base-200 pb-3">
            <h2 className="font-extrabold text-lg text-base-content font-heading">
              {jobsLoading ? 'Loading Positions...' : `Open Technical Positions (${jobs.length})`}
            </h2>
            <span className="text-xs font-mono text-primary font-bold">
              AI Skill Match Active
            </span>
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center p-8 text-base-content/50">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-xs">Fetching live job openings...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-base-content/50">
              No open positions at this time. Check back soon!
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div
                  key={job._id || job.id}
                  className="p-4 rounded-2xl bg-base-200 border border-base-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/40 transition-all"
                >
                  <div>
                    <h3 className="font-bold text-sm text-base-content font-heading">
                      {job.title}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-0.5 font-mono">
                      {job.employmentType || 'Full-time'}
                      {job.salaryMin ? ` • $${job.salaryMin.toLocaleString()} - $${(job.salaryMax || 0).toLocaleString()}` : ''}
                      {job.requiredSkills?.length ? ` • ${job.requiredSkills.slice(0, 2).join(' & ')} Skill Match Required` : ''}
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm rounded-xl font-bold text-xs shrink-0">
                    Apply with Passport
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
