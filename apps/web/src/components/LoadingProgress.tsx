"use client";

import { formatBytes } from "@/lib/useApiProgress";

/**
 * Progress indicator for an in-flight API download.
 *
 * Renders a determinate bar when the server declared a size, and a sliding
 * indeterminate bar when it did not. Those are genuinely different states and
 * showing the second as a fake percentage is worse than showing no number —
 * a bar that stalls at 90% or jumps backwards reads as a broken app.
 */
export default function LoadingProgress({
  percent,
  loaded,
  total,
  indeterminate,
  label,
  showBytes = false,
  className = "",
}: {
  percent: number | null;
  loaded?: number;
  total?: number | null;
  indeterminate?: boolean;
  label?: string;
  showBytes?: boolean;
  className?: string;
}) {
  const isIndeterminate = indeterminate || percent === null;
  const value = Math.max(0, Math.min(100, percent ?? 0));

  return (
    <div className={`w-full ${className}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="font-semibold text-base-content/70">
          {label ?? "Loading…"}
        </span>
        <span className="font-mono text-base-content/50 tabular-nums">
          {isIndeterminate
            ? showBytes && loaded
              ? formatBytes(loaded)
              : ""
            : `${value}%`}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-base-300"
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Loading"}
      >
        {isIndeterminate ? (
          <div className="h-full w-1/3 animate-[loading-slide_1.2s_ease-in-out_infinite] rounded-full bg-indigo-600" />
        ) : (
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width] duration-200 ease-out"
            style={{ width: `${value}%` }}
          />
        )}
      </div>

      {showBytes && !isIndeterminate && total ? (
        <p className="mt-1 text-[10px] font-mono text-base-content/40 tabular-nums">
          {formatBytes(loaded ?? 0)} / {formatBytes(total)}
        </p>
      ) : null}

      <style jsx>{`
        @keyframes loading-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
