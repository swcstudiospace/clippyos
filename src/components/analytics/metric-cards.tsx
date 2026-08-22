import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AnalyticsMetricCard({
  label,
  value,
  hint,
  loading = false,
}: {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <p className="text-caption text-muted">{label}</p>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-9 w-28" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className="metric-in mt-1 text-page font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint ? <p className="mt-1 text-caption text-muted">{hint}</p> : null}
        </>
      )}
    </GlassCard>
  );
}

export function AnalyticsMetricRow({
  subscribers,
  views,
  ctr,
  watchHours,
  loading,
}: {
  subscribers: number | null;
  views: number | null;
  ctr: number | null;
  watchHours: number | null;
  loading?: boolean;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4")}>
      <AnalyticsMetricCard
        label="Subscribers"
        value={formatCompactCount(subscribers)}
        hint="Latest snapshot"
        loading={loading}
      />
      <AnalyticsMetricCard
        label="Total Views"
        value={formatCompactCount(views)}
        hint="Channel lifetime"
        loading={loading}
      />
      <AnalyticsMetricCard
        label="Average CTR"
        value={ctr == null ? "—" : formatPercent(ctr, 2)}
        hint={ctr == null ? "Not available via public API" : "Mean of stored snapshots"}
        loading={loading}
      />
      <AnalyticsMetricCard
        label="Watch Hours"
        value={watchHours == null ? "—" : formatCompactCount(watchHours)}
        hint={watchHours == null ? "Not available via public API" : "From stored snapshots"}
        loading={loading}
      />
    </div>
  );
}
