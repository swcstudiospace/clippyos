import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getHealthSnapshotFn, HEALTH_QUERY_KEY } from "@/lib/server/health-fns";
import { formatRate } from "@/lib/health";

export function HealthWidget() {
  const health = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: () => getHealthSnapshotFn(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const data = health.data;
  const stalled = data?.slos.stalled ?? 0;
  const failed = data?.jobs.filter((job) => job.status === "FAILED").length ?? 0;
  const tone = data?.banner?.severity === "critical" ? "red" : stalled || failed ? "orange" : "green";

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Health</h2>
            <p className="mt-1 text-caption text-muted">Queues, rails, and stalled work.</p>
          </div>
        </div>
        {health.isPending ? <Skeleton className="h-6 w-20 rounded-full" /> : <Badge tone={tone}>{data?.banner ? "Attention" : "Clear"}</Badge>}
      </div>
      {health.isPending ? (
        <Skeleton className="h-16 w-full rounded-control" />
      ) : (
        <dl className="grid grid-cols-3 gap-2">
          <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
            <dt className="text-caption text-muted">Queue</dt>
            <dd className="text-page font-semibold tabular-nums">{data?.slos.queueDepth ?? 0}</dd>
          </div>
          <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
            <dt className="text-caption text-muted">Stalled</dt>
            <dd className="text-page font-semibold tabular-nums">{stalled}</dd>
          </div>
          <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
            <dt className="text-caption text-muted">Uploads 24h</dt>
            <dd className="text-page font-semibold tabular-nums">{formatRate(data?.slos.uploadSuccessRate24h ?? null)}</dd>
          </div>
        </dl>
      )}
      <Link to="/health" className="text-caption text-accent underline-offset-2 hover:underline">
        Open Health
      </Link>
    </GlassCard>
  );
}
