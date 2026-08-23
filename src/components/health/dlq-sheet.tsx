import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { HEALTH_JOB_TYPE_LABELS, type HealthJob } from "@/lib/health";
import { formatRelativeTime } from "@/lib/format";

export function DlqSheet({
  open,
  onOpenChange,
  jobs,
  canEdit,
  onRetry,
  onDismiss,
  onLinear,
  pendingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: HealthJob[];
  canEdit: boolean;
  onRetry: (job: HealthJob) => void;
  onDismiss: (job: HealthJob) => void;
  onLinear: (job: HealthJob) => void;
  pendingId: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetTitle>Dead letter queue</SheetTitle>
        <SheetDescription>
          Failed jobs that exhausted retries. Dismiss hides them here without changing the source job.
        </SheetDescription>
        <div className="mt-4 flex flex-col gap-3">
          {jobs.length === 0 ? (
            <EmptyState title="DLQ is empty" description="Exhausted retries land here. Dismiss never mutates the original job." />
          ) : (
            jobs.map((job) => (
              <div key={`${job.type}:${job.id}`} className="rounded-card border border-border bg-secondary-surface/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-caption text-muted">{HEALTH_JOB_TYPE_LABELS[job.type]}</p>
                    <p className="text-body font-semibold">{job.clientName ?? job.id.slice(0, 8)}</p>
                    <p className="mt-1 text-caption text-muted">
                      {formatRelativeTime(job.updatedAt)}
                      {job.error ? ` · ${job.error}` : ""}
                    </p>
                  </div>
                  <Badge tone="red">{job.attempts} attempt{job.attempts === 1 ? "" : "s"}</Badge>
                </div>
                {canEdit ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-h-11"
                      disabled={pendingId === job.id || !job.canRetry}
                      onClick={() => onRetry(job)}
                    >
                      Retry
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-11"
                      disabled={pendingId === job.id}
                      onClick={() => onDismiss(job)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-11"
                      disabled={pendingId === job.id}
                      onClick={() => onLinear(job)}
                    >
                      Linear ticket
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
