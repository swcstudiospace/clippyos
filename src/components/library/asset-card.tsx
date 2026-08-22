import { Film, Image as ImageIcon } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/performance/score-badge";
import { cn } from "@/lib/utils";
import {
  SOURCE_LABELS,
  formatBytes,
  formatDurationSec,
  type LibraryAsset,
} from "@/lib/library";
import type { AssetPerformanceRollup } from "@/lib/performance";
import { formatUnknownNumber } from "@/lib/performance";
import { formatCompactCount } from "@/lib/format";

export function AssetCard({
  asset,
  selected,
  onOpen,
  onToggle,
  rollup,
}: {
  asset: LibraryAsset;
  selected?: boolean;
  onOpen: () => void;
  onToggle?: () => void;
  rollup?: AssetPerformanceRollup | null;
}) {
  const visual = asset.kind === "IMAGE" || asset.kind === "VIDEO";
  return (
    <GlassCard
      interactive
      className={cn("flex flex-col overflow-hidden p-0", selected && "ring-2 ring-accent")}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-video w-full overflow-hidden bg-secondary-surface"
        aria-label={`Open ${asset.title}`}
      >
        {visual && asset.previewUrl ? (
          asset.kind === "IMAGE" ? (
            <img src={asset.previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <video
              src={asset.previewUrl}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          )
        ) : (
          <span className="grid size-full place-items-center text-muted">
            {asset.kind === "IMAGE" ? (
              <ImageIcon className="size-8" aria-hidden="true" />
            ) : (
              <Film className="size-8" aria-hidden="true" />
            )}
          </span>
        )}
        {asset.durationSec ? (
          <span className="absolute right-2 bottom-2 rounded-full bg-bg/80 px-2 py-0.5 text-caption text-fg">
            {formatDurationSec(asset.durationSec)}
          </span>
        ) : null}
      </button>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 text-left text-body font-medium tracking-tight"
          >
            <span className="line-clamp-2">{asset.title}</span>
          </button>
          {onToggle ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              aria-label={`Select ${asset.title}`}
              className="mt-1 size-4"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
          <Badge tone="neutral">{SOURCE_LABELS[asset.source]}</Badge>
          {asset.aspectRatio ? <Badge tone="blue">{asset.aspectRatio}</Badge> : null}
          {rollup ? (
            <ScoreBadge
              score={rollup.score}
              verdict={rollup.winnerCount > 0 ? "WINNER" : null}
            />
          ) : null}
        </div>
        <p className="text-caption text-muted">
          {[
            asset.kind.toLowerCase(),
            formatBytes(asset.byteSize),
            rollup?.viewsTotal != null
              ? `${formatUnknownNumber(rollup.viewsTotal, formatCompactCount)} views`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </GlassCard>
  );
}