import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PRESET_LABELS, type RenderJob } from "@/lib/library";
import { LinearIssueActions } from "@/components/linear/issue-actions";

export function RenderQueue({
  jobs,
  onCancel,
  onRetry,
  onOpenOutput,
}: {
  jobs: RenderJob[];
  onCancel: (id: string) => void;
  onRetry?: (id: string) => void;
  onOpenOutput: (assetId: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No renders yet"
        description="Queue a 9:16, 1:1, or 16:9 export from an asset. Optional burned captions ride along."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <GlassCard key={job.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-body font-medium tracking-tight">
              {job.sourceTitle ?? "Asset"} · {PRESET_LABELS[job.preset]}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(job.status)}>{job.status}</Badge>
              {job.options.burnInCaptions ? <Badge tone="blue">Captions</Badge> : null}
              {job.error ? <span className="text-caption text-danger">{job.error}</span> : null}
            </div>
            {(job.status === "QUEUED" || job.status === "RUNNING") && (
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-secondary-surface">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{ width: `${job.progressPercent}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {job.outputAssetId ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => onOpenOutput(job.outputAssetId!)}>
                Open output
              </Button>
            ) : null}
            {job.status === "FAILED" && onRetry ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => onRetry(job.id)}>
                Retry
              </Button>
            ) : null}
            {job.status === "QUEUED" || job.status === "RUNNING" ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onCancel(job.id)}>
                Cancel
              </Button>
            ) : null}
            <LinearIssueActions
              entityType="RenderJob"
              entityId={job.id}
              title={`[Render] ${job.status} — ${PRESET_LABELS[job.preset]}`}
              description={job.error ?? job.sourceTitle ?? undefined}
              labels={["media", job.status === "FAILED" ? "bug" : "media"]}
              compact
            />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
