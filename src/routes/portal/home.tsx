import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clapperboard, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { PipelineTracker } from "@/components/ui/pipeline-tracker";
import { StagePill } from "@/components/ui/stage-pill";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { formatRelativeTime } from "@/lib/format";
import { GUARANTEE_WINDOW_DAYS } from "@/lib/constants";
import { PORTAL_HOME_KEY } from "@/lib/portal";
import { getPortalHomeFn } from "@/lib/server/portal-fns";

export const Route = createFileRoute("/portal/home")({
  component: PortalHomePage,
});

function PortalHomePage() {
  const home = useQuery({
    queryKey: PORTAL_HOME_KEY,
    queryFn: () => getPortalHomeFn(),
  });

  if (home.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (home.isError || !home.data) {
    return (
      <ErrorState
        title="Couldn’t load your portal"
        description="Sign in again with the invite your producer sent."
        onRetry={() => void home.refetch()}
      />
    );
  }

  const data = home.data;
  const greeting = data.client.name;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={greeting}
        description={data.settings.welcomeBlurb}
      />

      {data.preview ? (
        <p className="rounded-control border border-border bg-secondary-surface/50 px-3 py-2 text-caption text-muted">
          You’re previewing this portal as an operator. Approvals stay read-only.
        </p>
      ) : null}

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card font-semibold tracking-tight">Production stage</h2>
          <StagePill stage={data.stage} />
        </div>
        {data.stageUpdatedAt ? (
          <p className="mt-1 text-caption text-muted">
            Updated {formatRelativeTime(data.stageUpdatedAt)}
          </p>
        ) : null}
        <div className="mt-4">
          <PipelineTracker current={data.stage} disabled />
        </div>
        {data.workingOn ? (
          <p className="mt-4 text-body">
            <span className="text-caption text-muted">What we’re working on · </span>
            {data.workingOn}
          </p>
        ) : (
          <p className="mt-4 text-caption text-muted">
            We’ll post a one-liner here when there’s something client-facing in motion.
          </p>
        )}
        {data.dayCount ? (
          <p className="mt-3 text-caption text-muted">
            Day {data.dayCount} of {GUARANTEE_WINDOW_DAYS}
          </p>
        ) : null}
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link to="/portal/approvals" className="block">
          <GlassCard interactive className="h-full">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-section font-semibold tracking-tight">
              {data.pendingApprovals}
            </p>
            <p className="text-caption text-muted">Waiting for your review</p>
          </GlassCard>
        </Link>
        <Link to="/portal/assets" className="block">
          <GlassCard interactive className="h-full">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <Clapperboard className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-section font-semibold tracking-tight">
              {data.newAssetsThisWeek}
            </p>
            <p className="text-caption text-muted">New deliverables this week</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
