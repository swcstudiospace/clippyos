import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { FilterChip } from "@/components/money/filter-chip";
import {
  HEALTH_JOB_STATUS_LABELS,
  HEALTH_JOB_TYPE_LABELS,
  HEALTH_JOB_STATUSES,
  HEALTH_JOB_TYPES,
  HEALTH_WINDOWS,
  type HealthJob,
  type HealthJobFilter,
  type HealthJobStatus,
  type HealthJobType,
  type HealthWindow,
} from "@/lib/health";
import { formatRelativeTime } from "@/lib/format";

/** Phone: wrapping chips then cards. Desktop (md+): dense table. Tap targets 44px. */

export function JobFeedFilters({
  filter,
  onChange,
  clients,
  dlqCount,
  onOpenDlq,
}: {
  filter: HealthJobFilter;
  onChange: (next: HealthJobFilter) => void;
  clients: Array<{ id: string; name: string }>;
  dlqCount: number;
  onOpenDlq: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...HEALTH_JOB_STATUSES] as const).map((status) => (
          <FilterChip
            key={status}
            label={status === "ALL" ? "All status" : HEALTH_JOB_STATUS_LABELS[status]}
            active={(filter.status ?? "ALL") === status}
            onClick={() => onChange({ ...filter, status })}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...HEALTH_JOB_TYPES] as const).map((type) => (
          <FilterChip
            key={type}
            label={type === "ALL" ? "All types" : HEALTH_JOB_TYPE_LABELS[type]}
            active={(filter.type ?? "ALL") === type}
            onClick={() => onChange({ ...filter, type })}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {HEALTH_WINDOWS.map((window) => (
          <FilterChip
            key={window}
            label={window === "24h" ? "Last 24h" : window === "7d" ? "Last 7d" : "All time"}
            active={(filter.window ?? "24h") === window}
            onClick={() => onChange({ ...filter, window: window as HealthWindow })}
          />
        ))}
        <FilterChip
          label="All clients"
          active={!filter.clientId || filter.clientId === "ALL"}
          onClick={() => onChange({ ...filter, clientId: "ALL" })}
        />
        {clients.slice(0, 8).map((client) => (
          <FilterChip
            key={client.id}
            label={client.name}
            active={filter.clientId === client.id}
            onClick={() => onChange({ ...filter, clientId: client.id })}
          />
        ))}
        <Button type="button" variant="secondary" size="sm" className="min-h-11" onClick={onOpenDlq}>
          DLQ{dlqCount ? ` · ${dlqCount}` : ""}
        </Button>
      </div>
    </div>
  );
}

function JobStatusBadge({ status }: { status: HealthJobStatus }) {
  const tone =
    status === "SUCCEEDED"
      ? "green"
      : status === "FAILED" || status === "STALLED"
        ? "red"
        : status === "AWAITING_APPROVAL" || status === "QUEUED"
          ? "orange"
          : status === "RUNNING"
            ? "blue"
            : "neutral";
  return <Badge tone={tone}>{HEALTH_JOB_STATUS_LABELS[status]}</Badge>;
}

function JobLinks({ job }: { job: HealthJob }) {
  if (job.href.to === "/settings") {
    return (
      <Link to="/settings" hash={job.href.hash} className="text-caption text-accent underline-offset-2 hover:underline">
        Open
      </Link>
    );
  }
  return (
    <Link to={job.href.to} className="text-caption text-accent underline-offset-2 hover:underline">
      Open
    </Link>
  );
}

export function JobFeed({
  jobs,
  onRetry,
  onCancel,
  pendingId,
}: {
  jobs: HealthJob[];
  onRetry: (job: HealthJob) => void;
  onCancel: (job: HealthJob) => void;
  pendingId: string | null;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs in this filter"
        description="Queued, running, and failed work from render, upload, agent, and metrics ingest shows up here."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {jobs.map((job) => (
          <GlassCard key={`${job.type}:${job.id}`} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption text-muted">{HEALTH_JOB_TYPE_LABELS[job.type]}</p>
                <h3 className="text-card font-semibold tracking-tight">{job.clientName ?? job.id.slice(0, 8)}</h3>
              </div>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-caption text-muted">
              {job.provider ?? "—"}
              {job.progressPercent != null ? ` · ${job.progressPercent}%` : ""}
              {` · ${formatRelativeTime(job.updatedAt)}`}
            </p>
            {job.error ? <p className="text-caption text-danger">{job.error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <JobLinks job={job} />
              {job.linearUrl ? (
                <a href={job.linearUrl} className="text-caption text-accent underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  Linear
                </a>
              ) : null}
              {job.canRetry ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-11"
                  disabled={pendingId === job.id}
                  onClick={() => onRetry(job)}
                >
                  Retry
                </Button>
              ) : null}
              {job.canCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  disabled={pendingId === job.id}
                  onClick={() => onCancel(job)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-xl text-left text-caption">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Client</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Rail</th>
              <th className="py-2 pr-3 font-medium">Progress</th>
              <th className="py-2 pr-3 font-medium">Updated</th>
              <th className="py-2 pr-3 font-medium">Error</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={`${job.type}:${job.id}`} className="border-b border-border/60">
                <td className="py-3 pr-3">{HEALTH_JOB_TYPE_LABELS[job.type]}</td>
                <td className="py-3 pr-3">{job.clientName ?? "—"}</td>
                <td className="py-3 pr-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="py-3 pr-3">{job.provider ?? "—"}</td>
                <td className="py-3 pr-3 tabular-nums">{job.progressPercent != null ? `${job.progressPercent}%` : "—"}</td>
                <td className="py-3 pr-3">{formatRelativeTime(job.updatedAt)}</td>
                <td className="max-w-48 truncate py-3 pr-3 text-danger">{job.error ?? ""}</td>
                <td className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <JobLinks job={job} />
                    {job.linearUrl ? (
                      <a href={job.linearUrl} className="text-accent underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                        Linear
                      </a>
                    ) : null}
                    {job.canRetry ? (
                      <Button type="button" variant="secondary" size="sm" disabled={pendingId === job.id} onClick={() => onRetry(job)}>
                        Retry
                      </Button>
                    ) : null}
                    {job.canCancel ? (
                      <Button type="button" variant="ghost" size="sm" disabled={pendingId === job.id} onClick={() => onCancel(job)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CostGuardStrip({
  daytonaRunning,
  daytonaMs,
  recommendStop,
  agentActive,
  agentMax,
  automationPaused,
  xaiMessage,
}: {
  daytonaRunning: boolean;
  daytonaMs: number | null;
  recommendStop: boolean;
  agentActive: number;
  agentMax: number;
  automationPaused: boolean;
  xaiMessage: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <GlassCard className="flex flex-col gap-1">
        <p className="text-caption text-muted">Daytona</p>
        <p className="text-card font-semibold">{daytonaRunning ? "Running" : "Stopped"}</p>
        <p className="text-caption text-muted">
          {recommendStop ? "Idle — stop recommended" : daytonaMs != null ? `${Math.round(daytonaMs / 60000)} min up` : "No VM cost"}
        </p>
      </GlassCard>
      <GlassCard className="flex flex-col gap-1">
        <p className="text-caption text-muted">Agent concurrency</p>
        <p className="text-card font-semibold">
          {agentActive} / {agentMax}
        </p>
        <p className="text-caption text-muted">Active clipping runs</p>
      </GlassCard>
      <GlassCard className="flex flex-col gap-1">
        <p className="text-caption text-muted">Automation</p>
        <p className="text-card font-semibold">{automationPaused ? "Paused" : "Live"}</p>
        <p className="text-caption text-muted">Human UI stays up when paused</p>
      </GlassCard>
      <GlassCard className="flex flex-col gap-1">
        <p className="text-caption text-muted">xAI capacity</p>
        <p className="text-card font-semibold">{xaiMessage ? "Backoff" : "Clear"}</p>
        <p className="text-caption text-muted">{xaiMessage ?? "No recent 429s"}</p>
      </GlassCard>
    </div>
  );
}
