"use client";

/**
 * Circular countdown indicator.
 *
 * This used to be a Recharts <RadialBarChart>, which pulled ~200 kB of charting
 * and d3 into the quiz route to draw two arcs. A stroke-dashoffset circle is the
 * same picture for no dependency at all.
 */
export default function CountdownRing({
  percent,
  color,
  trackColor = "currentColor",
  strokeWidth = 8,
}: {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  color: string;
  trackColor?: string;
  strokeWidth?: number;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  // viewBox is 100×100, so the radius leaves room for the stroke on both sides.
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full -rotate-90"
      role="presentation"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeOpacity={0.15}
        strokeWidth={strokeWidth}
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s ease" }}
      />
    </svg>
  );
}
