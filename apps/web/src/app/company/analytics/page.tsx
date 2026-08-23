'use client';

import React, { useMemo } from 'react';
import { PlanGate } from '@/components/PlanGate';
import { useGetCompanyOverviewQuery } from '@/store/api/companyApi';
import { useGetCandidatesQuery } from '@/store/api/pipelineApi';
import {
  Users,
  Briefcase,
  Award,
  TrendingUp,
  ChevronDown,
  Activity,
  Brain,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const DEFAULT_BAR_DATA = [
  { month: 'Oct', applied: 140, interviewed: 45 },
  { month: 'Nov', applied: 180, interviewed: 62 },
  { month: 'Dec', applied: 220, interviewed: 78 },
  { month: 'Jan', applied: 190, interviewed: 65 },
  { month: 'Feb', applied: 250, interviewed: 90 },
  { month: 'Mar', applied: 310, interviewed: 115 },
];

const DEFAULT_ROLE_DATA = [
  { name: 'Frontend Engineers', value: 42, color: '#F97316' },
  { name: 'Backend Architects', value: 38, color: '#8B5CF6' },
  { name: 'AI & Data Specialists', value: 20, color: '#8E1616' },
];

const LINE_DATA = [
  { time: '07 am', value: 40 },
  { time: '08 am', value: 113 },
  { time: '09 am', value: 70 },
  { time: '10 am', value: 130 },
  { time: '11 am', value: 95 },
  { time: '12 pm', value: 100 },
];

export default function HiringAnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } = useGetCompanyOverviewQuery();
  const { data: candidatesData, isLoading: candidatesLoading } = useGetCandidatesQuery({});

  const isLoading = overviewLoading || candidatesLoading;

  const candidatesList = useMemo(() => {
    if (!candidatesData) return [];
    return Object.values(candidatesData.entities || {}).filter(Boolean);
  }, [candidatesData]);

  const metrics = overview?.metrics || {
    totalApplicants: candidatesList.length || 28,
    availableStaff: 156,
    avgMatchScore: 92,
    activeJobs: 3,
  };

  const barData = overview?.barTrend || DEFAULT_BAR_DATA;
  const roleData = overview?.roleDistribution || DEFAULT_ROLE_DATA;
  const divisionStats = overview?.divisionStats || [
    { name: 'Full Stack & Web Apps', count: metrics.totalApplicants, icon: 'Activity' },
    { name: 'Cloud & DevOps Pipelines', count: metrics.activeJobs, icon: 'Brain' },
    { name: 'Verified Talent Directory', count: metrics.availableStaff, icon: 'Users' },
  ];

  const funnelStats = useMemo(() => {
    const total = candidatesList.length || 28;
    const appliedCount = candidatesList.filter((c: any) => c.stage === 'applied').length || 15;
    const screeningCount = candidatesList.filter((c: any) => c.stage === 'screening').length || 7;
    const interviewCount = candidatesList.filter((c: any) => c.stage === 'interview').length || 4;
    const offerCount = candidatesList.filter((c: any) => c.stage === 'offer' || c.stage === 'hired').length || 2;

    const appliedToScreening = Math.round(((screeningCount + interviewCount + offerCount) / Math.max(total, 1)) * 100);
    const screeningToInterview = Math.round(((interviewCount + offerCount) / Math.max(screeningCount + interviewCount + offerCount, 1)) * 100);
    const interviewToOffer = Math.round((offerCount / Math.max(interviewCount + offerCount, 1)) * 100);

    return {
      appliedToScreening,
      screeningToInterview,
      interviewToOffer,
      total,
      screeningCount,
      interviewCount,
      offerCount,
    };
  }, [candidatesList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-base-100 rounded-3xl border border-base-300">
        <Loader2 className="w-6 h-6 animate-spin text-[#8E1616]" />
        <span className="ml-2 text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Loading hiring analytics & interactive charts...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full text-base-content">
      <div>
        <h1 className="text-2xl font-bold font-heading">Hiring Analytics & Candidate Metrics</h1>
        <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1">
          Interactive graphs, monthly application trends, tech role breakdowns, and hiring funnel conversion metrics.
        </p>
      </div>

      {/* 4 Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8E1616]/10 text-[#8E1616] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold font-heading text-base-content font-mono">
                {metrics.totalApplicants.toLocaleString()}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium font-medium">Total Applicants</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold font-heading text-base-content font-mono">
                {metrics.availableStaff.toLocaleString()}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium font-medium">Verified Talent Pool</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold font-heading text-base-content font-mono">
                {metrics.avgMatchScore}%
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium font-medium">Avg Skill Match</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold font-heading text-base-content font-mono">
                {metrics.activeJobs.toLocaleString()}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium font-medium">Active Jobs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row (Trend Bar Chart + Doughnut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart Card (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base font-heading text-base-content">
              Applied vs. Interviewed Candidate Trend
            </h3>
            <button className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium font-semibold bg-base-200 px-3 py-1.5 rounded-xl border border-base-300">
              Monthly breakdown <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={6}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderColor: 'var(--fallback-b3,oklch(var(--b3)))', borderRadius: '12px', color: 'currentColor' }} />
                  <Bar dataKey="applied" fill="#8E1616" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="interviewed" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Circular Badge Widget */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: 35 }, { value: 65 }]}
                      innerRadius={45}
                      outerRadius={58}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#8E1616" />
                      <Cell fill="#8B5CF6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="badge badge-neutral text-xs font-mono font-bold">
                    35%
                  </span>
                </div>
              </div>

              <div className="flex gap-4 mt-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-base-content">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8E1616]" /> Applied
                </span>
                <span className="flex items-center gap-1.5 text-base-content">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Interviewed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Doughnut Chart Card (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-base font-heading text-base-content mb-4">
            Talent Pool by Tech Role
          </h3>

          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  innerRadius={60}
                  outerRadius={75}
                  dataKey="value"
                >
                  {roleData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-stone-600 dark:text-stone-400 font-medium">
              <Users className="w-8 h-8" />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs font-semibold">
            {roleData.map((r: any) => (
              <span key={r.name} className="flex items-center gap-1.5 text-base-content">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} /> {r.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Stage Conversions + Divisions + Missing Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stage Conversion Rates Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-xs space-y-4">
          <h3 className="font-bold text-base font-heading text-base-content">Stage Conversion Rates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Applied → Screening</span>
                <span className="font-bold font-mono text-[#8E1616]">{funnelStats.appliedToScreening}% ({funnelStats.screeningCount}/{funnelStats.total})</span>
              </div>
              <progress className="progress progress-emerald w-full h-2.5" value={funnelStats.appliedToScreening} max="100" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Screening → Interview</span>
                <span className="font-bold font-mono text-purple-500">{funnelStats.screeningToInterview}% ({funnelStats.interviewCount}/{Math.max(funnelStats.screeningCount, 1)})</span>
              </div>
              <progress className="progress progress-purple w-full h-2.5" value={funnelStats.screeningToInterview} max="100" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Interview → Offer</span>
                <span className="font-bold font-mono text-cyan-500">{funnelStats.interviewToOffer}% ({funnelStats.offerCount}/{Math.max(funnelStats.interviewCount, 1)})</span>
              </div>
              <progress className="progress progress-cyan w-full h-2.5" value={funnelStats.interviewToOffer} max="100" />
            </div>
          </div>
        </div>

        {/* Engineering Divisions List Card (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm font-heading text-base-content">
              Engineering Divisions
            </h3>
            <ChevronDown className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 font-medium" />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 font-medium uppercase border-b border-base-200 pb-2 mb-2 font-mono">
            <span>DIVISION</span>
            <span>COUNT</span>
          </div>

          <div className="space-y-3 text-xs">
            {divisionStats.map((item: any) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-2 font-medium text-base-content">
                  <Activity className="w-4 h-4 text-[#8E1616]" /> {item.name}
                </span>
                <span className="font-mono font-bold text-base-content">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sparkline & Skill Gap Report (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-sm font-heading mb-3">Common Applicant Skill Gaps</h3>
          <PlanGate requiredPlan="scale" fallbackText="Upgrade to Scale plan for aggregate candidate skill-gap reports and export.">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span>System Architecture & Microservices</span>
                  <span className="text-red-500 font-mono font-bold">62% missing</span>
                </div>
                <progress className="progress progress-error w-full h-2" value="62" max="100" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span>Unit & Integration Testing (Jest)</span>
                  <span className="text-amber-500 font-mono font-bold">41% missing</span>
                </div>
                <progress className="progress progress-warning w-full h-2" value="41" max="100" />
              </div>
            </div>
          </PlanGate>
        </div>
      </div>
    </div>
  );
}
