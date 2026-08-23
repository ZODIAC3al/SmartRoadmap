'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: string;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  const isPositive = trend?.startsWith('+');

  return (
    <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-xs text-base-content/60 font-medium">{label}</span>
        {icon && (
          <span className="p-2 rounded-lg bg-primary/10 text-primary text-sm">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-base-content">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold ${
              isPositive ? 'text-success' : 'text-warning'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
