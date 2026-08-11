"use client";

/**
 * Every Recharts-backed chart on the dashboard, in one module.
 *
 * Recharts (plus its d3 dependencies) is ~200 kB of the bundle. Keeping it in
 * a single module means the page can pull it in with one `next/dynamic` import
 * and it lands in one shared async chunk instead of the initial payload.
 *
 * Each export takes plain data props so the page keeps ownership of layout,
 * headings and i18n — only the drawing lives here.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DARK_TOOLTIP = {
  borderRadius: 12,
  fontSize: 12,
  background: "rgba(15, 23, 42, 0.9)",
  border: "none",
  color: "#fff",
} as const;

type Datum = Record<string, any>;

export function ProgressRadial({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        barSize={14}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background dataKey="value" cornerRadius={12} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function StreakBars({ data, daysLabel }: { data: Datum[]; daysLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(v: any) => [`${v} ${daysLabel}`, ""]}
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
        />
        <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function QuizHistoryLine({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f46e5"
          strokeWidth={3}
          activeDot={{ r: 6 }}
          dot={{ strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StudyTimeArea({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorMinutes)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillRadar({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#cbd5e1" opacity={0.3} />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
        <Radar name="Mastery %" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TopicDonut({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={60}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: any) => [`${v}% of total time`, "Weight"]}
          contentStyle={{ borderRadius: 12, fontSize: 11 }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: "10px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyMinutesArea({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="activityMinutesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
        <XAxis
          dataKey="date"
          tickFormatter={(str: string) => str.slice(5)}
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={DARK_TOOLTIP} labelFormatter={(label) => `Date: ${label}`} />
        <Area
          type="monotone"
          dataKey="minutesStudied"
          name="Minutes"
          stroke="#4f46e5"
          strokeWidth={2.5}
          fill="url(#activityMinutesGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function QuizzesAndScoreBars({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
        <XAxis
          dataKey="date"
          tickFormatter={(str: string) => str.slice(5)}
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={{ value: "Quizzes", angle: -90, position: "insideLeft", fontSize: 10 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Avg Score %", angle: 90, position: "insideRight", fontSize: 10 }}
        />
        <Tooltip contentStyle={DARK_TOOLTIP} />
        <Bar
          yAxisId="left"
          dataKey="quizzes"
          name="Quizzes"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          maxBarSize={30}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgScore"
          name="Avg Score %"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
