'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/company/Sidebar';
import { PlanUsageBanner } from '@/components/company/PlanUsageBanner';
import { NotificationBell } from '@/components/NotificationBell';
import { useSubscription } from '@/lib/use-subscription';
import { Search, ChevronDown } from 'lucide-react';
import { getCachedUser } from '@/lib/api';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { plan } = useSubscription();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCachedUser());
  }, []);

  const userName = user?.name || 'Recruiter Admin';
  const userInitials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'RA';

  return (
    <div className="min-h-screen bg-base-200/50 text-base-content flex flex-col md:flex-row font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar responsive to DaisyUI theme */}
        <header className="h-16 bg-base-100 border-b border-base-300 px-6 flex items-center justify-between shrink-0 shadow-xs">
          {/* Search Input */}
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-700 dark:text-stone-300 font-medium" />
            <input
              type="text"
              placeholder="Search applicants, jobs, or skills..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-base-200 border border-base-300 text-xs focus:outline-none focus:border-primary text-base-content transition-colors"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {/* Profile Avatar Dropdown */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-base-300 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary text-primary-content flex items-center justify-center font-bold text-xs shadow-xs">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-xs text-base-content leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium">Recruiting Team</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 font-medium" />
            </div>
          </div>
        </header>

        {/* Main Dashboard Canvas */}
        <main className="p-6 md:p-8 flex-1 flex flex-col gap-6">
          {plan === 'starter' && <PlanUsageBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
