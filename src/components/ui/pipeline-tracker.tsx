import { Check } from "lucide-react";
import { PROGRESS_STAGES, type ProgressStage } from "@/lib/entities";
import { STAGE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function PipelineTracker({
  current,
  onSelect,
  disabled,
}: {
  current: ProgressStage | null;
  onSelect?: (stage: ProgressStage) => void;
  disabled?: boolean;
}) {
  const currentIndex = current ? PROGRESS_STAGES.indexOf(current) : -1;
  return (
    <ol className="-mx-1 flex flex-row gap-0 overflow-x-auto pb-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible">
      {PROGRESS_STAGES.map((stage, index) => {
        const done = currentIndex >= 0 && index < currentIndex;
        const active = stage === current;
        const upcoming = currentIndex < 0 || index > currentIndex;
        return (
          <li
            key={stage}
            className="relative flex min-w-[9.5rem] snap-start md:min-w-[25%] md:flex-1 md:flex-col"
          >
            {index < PROGRESS_STAGES.length - 1 ? (
              <span
                className={cn(
                  "absolute bg-border top-4 right-0 left-8 h-px w-auto",
                  done && "bg-accent",
                )}
                aria-hidden="true"
              />
            ) : null}
            <button
              type="button"
              disabled={disabled || !onSelect}
              onClick={() => onSelect?.(stage)}
              className={cn(
                "relative z-10 flex min-h-11 w-full flex-col items-start gap-2 px-1 py-2 text-left",
                (disabled || !onSelect) && "cursor-default",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-caption font-medium",
                  done && "border-accent bg-accent text-accent-fg",
                  active &&
                    "border-accent bg-accent/15 text-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]",
                  upcoming && "border-border bg-secondary-surface text-muted",
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-caption md:pr-3",
                  active ? "font-medium text-fg" : "text-muted",
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
