import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParsedSnapshot } from "@/lib/analytics";
import { formatCompactCount, formatDate } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const tooltipStyle = {
  background: "var(--elevated)",
  border: "0.5px solid var(--border)",
  borderRadius: "12px",
  color: "var(--fg)",
  fontSize: 13,
};

function ChartFrame({
  title,
  caption,
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  caption: string;
  loading: boolean;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  return (
    <GlassCard className="flex min-h-[280px] flex-col">
      <h3 className="text-card font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-caption text-muted">{caption}</p>
      <div className="mt-4 min-h-0 flex-1">
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : empty ? (
          <div className="flex h-[220px] flex-col justify-center rounded-control bg-secondary-surface/40 px-4">
            <p className="text-body font-medium">{emptyTitle}</p>
            <p className="mt-1 text-caption text-muted">{emptyDescription}</p>
          </div>
        ) : (
          <div className="h-[220px] w-full">{children}</div>
        )}
      </div>
    </GlassCard>
  );
}

export function AnalyticsCharts({
  history,
  loading,
}: {
  history: ParsedSnapshot[];
  loading: boolean;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const data = history.map((row) => ({
    label: formatDate(row.date),
    views: row.viewsN,
    watchHours: row.watchHoursN,
  }));
  const hasViews = data.some((row) => row.views != null);
  const hasWatch = data.some((row) => row.watchHours != null);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartFrame
        title="Views over time"
        caption="Each point is an AnalyticsSnapshot for this client, ordered by date."
        loading={loading}
        empty={!loading && !hasViews}
        emptyTitle="No view history yet"
        emptyDescription="Pull from YouTube or enter a snapshot to start the series."
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => formatCompactCount(value)}
              tickCount={5}
              width={48}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCompactCount(Number(value ?? 0))} />
            <Legend />
            <Area
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.18}
              connectNulls
              isAnimationActive={!reduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame
        title="Watch-time trends"
        caption="Public YouTube Data API does not expose watch hours. Manual snapshots can fill this series."
        loading={loading}
        empty={!loading && !hasWatch}
        emptyTitle="Watch time not available"
        emptyDescription="Enter watch hours manually — the public API cannot supply them."
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => formatCompactCount(value)}
              tickCount={5}
              width={48}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCompactCount(Number(value ?? 0))} />
            <Legend />
            <Area
              type="monotone"
              dataKey="watchHours"
              name="Watch hours"
              stroke="var(--teal)"
              fill="var(--teal)"
              fillOpacity={0.18}
              connectNulls
              isAnimationActive={!reduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
