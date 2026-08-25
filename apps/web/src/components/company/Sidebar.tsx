'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubscription } from '@/lib/use-subscription';
import {
  LayoutDashboard,
  Briefcase,
  Target,
  MessageSquare,
  BarChart3,
  Building2,
  Plus,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/company', icon: LayoutDashboard },
  { label: 'Jobs & Pipeline', href: '/company/jobs', icon: Briefcase },
  { label: 'Messages', href: '/company/messages', icon: MessageSquare },
  { label: 'Analytics', href: '/company/analytics', icon: BarChart3 },
  { label: 'Company Profile', href: '/company/profile', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { plan, usage } = useSubscription();

  return (
    <aside className="w-full md:w-64 bg-base-100 border-r border-base-300 p-5 flex flex-col justify-between shrink-0 shadow-xs text-base-content">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-bold text-xl shadow-md">
            SR
          </div>
          <div>
            <h2 className="font-extrabold text-base font-heading text-base-content tracking-tight">
              SmartRoadmap
            </h2>
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Recruiter Hub
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <Link
          href="/company/jobs?action=new"
          className="w-full py-3 px-4 mb-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-content font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all transform active:scale-95 border-none"
        >
          <span>Post New Job</span>
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/company' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-xs'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-primary' : 'text-base-content/50'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card Widget linking out to /pricing */}
      <div className="mt-8 p-4 rounded-3xl bg-base-200 border border-base-300 relative overflow-hidden flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary text-primary-content flex items-center justify-center shadow-lg transform -rotate-6">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-base-content font-heading uppercase">
            {plan} Plan Active
          </h4>
          <p className="text-[11px] text-base-content/60 mt-0.5 font-medium">
            {usage.jobPostsActive} job posts • {usage.messagesSentThisPeriod} msgs
          </p>
        </div>
        <Link
          href="/pricing?for=company"
          className="w-full py-2 px-3 rounded-xl bg-base-100 text-primary font-bold text-xs shadow-xs hover:bg-base-200 transition-colors border border-base-300"
        >
          View Plans & Upgrade
        </Link>
      </div>
    </aside>
  );
}
