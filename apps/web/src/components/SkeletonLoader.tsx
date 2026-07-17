import React from "react";

export function CardSkeleton() {
  return (
    <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-sm space-y-4 w-full">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl shrink-0"></div>
        <div className="space-y-2 flex-grow">
          <div className="skeleton h-4 w-1/3"></div>
          <div className="skeleton h-3 w-1/2"></div>
        </div>
      </div>
      <div className="skeleton h-3 w-full"></div>
      <div className="skeleton h-3 w-5/6"></div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex justify-between items-center bg-base-200 border border-base-300 rounded-xl p-4 w-full">
          <div className="flex items-center gap-3 flex-grow">
            <div className="skeleton w-4 h-4 rounded-full"></div>
            <div className="skeleton h-3 w-1/3"></div>
          </div>
          <div className="skeleton h-3 w-16"></div>
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 w-full py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 items-start w-full">
          <div className="flex flex-col items-center">
            <div className="skeleton w-3 h-3 rounded-full"></div>
            <div className="w-0.5 h-16 bg-base-300 mt-2"></div>
          </div>
          <div className="flex-grow space-y-2 card bg-base-200 border border-base-300 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div className="skeleton h-4 w-1/4"></div>
              <div className="skeleton h-3 w-12"></div>
            </div>
            <div className="skeleton h-3 w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
