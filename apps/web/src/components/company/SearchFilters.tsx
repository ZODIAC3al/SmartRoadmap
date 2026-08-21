'use client';

import React from 'react';
import { PlanGate } from './PlanGate';

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  return (
    <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs flex flex-col gap-4">
      <h3 className="font-bold text-xs uppercase tracking-wider text-[#181B23]">
        Talent Search Filters
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#6B7280]">Required Skill Tags</label>
        <input
          type="text"
          placeholder="e.g. React, NestJS, TypeScript..."
          className="input input-sm input-bordered text-xs"
        />
      </div>

      {/* Growth Gated Verified Evidence Toggle */}
      <PlanGate requiredPlan="growth" fallbackText="Upgrade to Growth for verified evidence filter">
        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" />
          <span>Show Verified Certificate Evidence Only</span>
        </label>
      </PlanGate>

      <button
        onClick={() => onSearch({})}
        className="btn btn-sm btn-primary bg-[#4F46E5] text-white shadow-xs border-none w-full text-xs font-medium"
      >
        Apply Search Filters
      </button>
    </div>
  );
}
