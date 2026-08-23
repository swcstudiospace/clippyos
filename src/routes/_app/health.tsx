import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { SloStrip } from "@/components/health/slo-strip";
import { IntegrationGrid } from "@/components/health/integration-grid";
import { HermesRuntimeCard } from "@/components/health/hermes-runtime";
import { CostGuardStrip, JobFeed, JobFeedFilters } from "@/components/health/job-feed";
import { DlqSheet } from "@/components/health/dlq-sheet";
import {
  cancelHealthJobFn,
  createLinearFromFailFn,
  dismissDlqJobFn,
  getHealthSnapshotFn,
  HEALTH_QUERY_KEY,
  retryHealthJobFn,
} from "@/lib/server/health-fns";
import { filterHealthJobs, HEALTH_POLL_MS, type HealthJob, type HealthJobFilter } from "@/lib/health";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/_app/health")({
  component: HealthPage,
});

function HealthPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<HealthJobFilter>({ status: "ALL", type: "ALL", window: "24h" });
  const [dlqOpen, setDlqOpen] = useState(false);
  const snapshot = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: () => getHealthSnapshotFn(),
    refetchInterval: HEALTH_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const data = snapshot.data;
  const canEdit = data?.role === "admin";
  const jobs = useMemo(() => {
    if (!data) return [];
    return filterHealthJobs(data.jobs, filter, Date.now());
  }, [data, filter]);
  const dlq = data?.jobs.filter((job) => job.dlq) ?? [];

  const retry = useMutation({
    mutationFn: (job: HealthJob) => retryHealthJobFn({ data: { type: job.type, id: job.id } }),
    onSuccess: (result) => {
      toast.success(result.note ?? "Retry queued");
      void queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const cancel = useMutation({
    mutationFn: (job: HealthJob) => cancelHealthJobFn({ data: { type: job.type, id: job.id } }),
    onSuccess: () => {
      toast.success("Cancel requested");
      void queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const dismiss = useMutation({
    mutationFn: (job: HealthJob) => dismissDlqJobFn({ data: { type: job.type, id: job.id } }),
    onSuccess: () => {
      toast.success("Hidden from DLQ");
      void queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const linear = useMutation({
    mutationFn: (job: HealthJob) => createLinearFromFailFn({ data: { type: job.type, id: job.id } }),
    onSuccess: (result) => {
      toast.success(result.identifier ? `Linear ${result.identifier}` : "Linear issue created");
      void queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const pendingId = retry.variables?.id ?? cancel.variables?.id ?? dismiss.variables?.id ?? linear.variables?.id ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Health"
        description="Phone: chips, then cards. Desktop: dense table. Retry is idempotent and never auto-starts the Social Machine."
      />

      {snapshot.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load health"
            description="Job queues couldn’t be read. Try again."
            onRetry={() => void snapshot.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {data?.banner ? (
            <div
              className={
                data.banner.severity === "critical"
                  ? "rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-body text-danger"
                  : "rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-body text-warning"
              }
            >
              {data.banner.title}
            </div>
          ) : null}

          <SectionBoundary title="SLOs">
            {snapshot.isPending || !data ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ) : (
              <SloStrip slos={data.slos} />
            )}
          </SectionBoundary>

          <SectionBoundary title="Cost guards">
            {snapshot.isPending || !data ? (
              <Skeleton className="h-24 w-full rounded-card" />
            ) : (
              <CostGuardStrip
                daytonaRunning={data.costGuards.daytona.running}
                daytonaMs={data.costGuards.daytona.durationMs}
                recommendStop={data.costGuards.daytona.recommendStop}
                agentActive={data.costGuards.agentActive}
                agentMax={data.costGuards.agentMax}
                automationPaused={data.costGuards.automationPaused}
                xaiMessage={data.costGuards.xai.message}
              />
            )}
          </SectionBoundary>

          <SectionBoundary title="Hermes runtime">
            {snapshot.isPending || !data ? (
              <Skeleton className="h-40 w-full rounded-card" />
            ) : (
              <HermesRuntimeCard runtime={data.hermes} />
            )}
          </SectionBoundary>

          <SectionBoundary title="Integrations">
            {snapshot.isPending || !data ? (
              <Skeleton className="h-40 w-full rounded-card" />
            ) : (
              <IntegrationGrid cards={data.integrations} canTest={canEdit} />
            )}
          </SectionBoundary>

          <SectionBoundary title="Job feed">
            {snapshot.isPending || !data ? (
              <Skeleton className="h-48 w-full rounded-card" />
            ) : (
              <div className="flex flex-col gap-4">
                <JobFeedFilters
                  filter={filter}
                  onChange={setFilter}
                  clients={data.clients}
                  dlqCount={dlq.length}
                  onOpenDlq={() => setDlqOpen(true)}
                />
                <JobFeed
                  jobs={jobs}
                  onRetry={(job) => retry.mutate(job)}
                  onCancel={(job) => cancel.mutate(job)}
                  pendingId={pendingId}
                />
              </div>
            )}
          </SectionBoundary>
        </div>
      )}

      <DlqSheet
        open={dlqOpen}
        onOpenChange={setDlqOpen}
        jobs={dlq}
        canEdit={canEdit}
        onRetry={(job) => retry.mutate(job)}
        onDismiss={(job) => dismiss.mutate(job)}
        onLinear={(job) => linear.mutate(job)}
        pendingId={pendingId}
      />
    </div>
  );
}
