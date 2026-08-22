import { PROGRESS_STAGES } from "@/lib/entities";
import type { PipelineCounts, PipelineFilter } from "@/lib/dashboard";
import { STAGE_LABELS, STAGE_TONES } from "@/lib/labels";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function PipelineSummary({
  counts,
  filter,
  onFilter,
  loading,
}: {
  counts: PipelineCounts | null;
  filter: PipelineFilter;
  onFilter: (next: PipelineFilter) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <GlassCard>
        <h2 className="text-card font-semibold tracking-tight">Production pipeline</h2>
        <p className="mt-1 text-caption text-muted">
          Active clients by latest stage.
        </p>
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-28 shrink-0" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!counts || counts.total === 0) {
    return (
      <EmptyState
        title="Production pipeline"
        description="Stage counts appear once you have active clients."
        action={
          <Button asChild>
            <Link to="/clients">Add a client</Link>
          </Button>
        }
      />
    );
  }

  function toggle(next: PipelineFilter) {
    onFilter(filter === next ? null : next);
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <ShineBorder />
      <div className="relative z-[1]">
        <h2 className="text-card font-semibold tracking-tight">Production pipeline</h2>
        <p className="mt-1 text-caption text-muted">
          Active clients by latest stage. Click a stage to filter the cards below.
        </p>
        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
          role="toolbar"
          aria-label="Filter clients by production stage"
        >
          {PROGRESS_STAGES.map((stage) => {
            const count = counts.stages[stage];
            const selected = filter === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => toggle(stage)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-16 min-w-28 shrink-0 flex-col items-start justify-center rounded-control border px-3 py-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  selected
                    ? "border-accent bg-accent/12"
                    : "border-border bg-secondary-surface/50 hover:bg-secondary-surface",
                )}
              >
                <span className="text-page font-semibold tabular-nums">{count}</span>
                <span
                  className={cn(
                    "text-caption",
                    STAGE_TONES[stage] === "green" && "text-success",
                    STAGE_TONES[stage] === "orange" && "text-warning",
                    STAGE_TONES[stage] === "red" && "text-danger",
                    !selected && "text-muted",
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => toggle("NONE")}
            aria-pressed={filter === "NONE"}
            className={cn(
              "flex min-h-16 min-w-28 shrink-0 flex-col items-start justify-center rounded-control border px-3 py-2 text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              filter === "NONE"
                ? "border-accent bg-accent/12"
                : "border-border bg-secondary-surface/50 hover:bg-secondary-surface",
            )}
          >
            <span className="text-page font-semibold tabular-nums">{counts.notStarted}</span>
            <span className="text-caption text-muted">Not started</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
