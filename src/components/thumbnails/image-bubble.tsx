import { Component, type ReactNode } from "react";
import {
  Clapperboard,
  Download,
  Layers,
  RefreshCw,
  Star,
  Type,
} from "lucide-react";
import type { ThumbnailMessage } from "@/lib/entities";
import { isTrustedImageUrl } from "@/lib/thumbnails";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={disabled}
            className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:text-warning disabled:opacity-50"
            onClick={() => onChange(n)}
          >
            <Star
              className={cn("size-4", on && "fill-warning text-warning")}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

class ImageBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This image couldn’t load"
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function ImageShimmer({
  label = "Generating thumbnail",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("thumb-shimmer w-full", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ImageBubble({
  message,
  generating,
  busy,
  compact,
  onRegenerate,
  onVariations,
  onDownload,
  onRate,
  onOverlay,
  onRetry,
  onSaveToLibrary,
}: {
  message: ThumbnailMessage;
  generating?: boolean;
  busy?: boolean;
  compact?: boolean;
  onRegenerate?: () => void;
  onVariations?: () => void;
  onDownload: () => void;
  onRate: (rating: number) => void;
  onOverlay: () => void;
  onRetry?: () => void;
  onSaveToLibrary?: () => void;
}) {
  const url = message.imageUrl && isTrustedImageUrl(message.imageUrl) ? message.imageUrl : null;
  const failed = Boolean(message.metadata?.imageFailed) && !url && !generating;

  return (
    <ImageBoundary>
      <div className={cn("w-full", compact ? "min-w-[16rem] max-w-[20rem] shrink-0" : "max-w-[min(100%,42rem)]")}>
        {generating ? (
          <ImageShimmer />
        ) : failed ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-card border border-border bg-secondary-surface/60 px-4">
            <p className="text-center text-body">The image didn’t come through.</p>
            {onRetry ? (
              <Button variant="secondary" size="sm" onClick={onRetry} disabled={busy}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : url ? (
          <img
            src={url}
            alt={message.content.slice(0, 120) || "Generated thumbnail"}
            className="aspect-video w-full rounded-card object-cover"
          />
        ) : (
          <ImageShimmer />
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {onRegenerate ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || generating}
              onClick={onRegenerate}
            >
              <RefreshCw className="size-4" />
              Regenerate
            </Button>
          ) : null}
          {onVariations ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || generating}
              onClick={onVariations}
            >
              <Layers className="size-4" />
              Try 3 variations
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || generating || !url}
            onClick={onDownload}
          >
            <Download className="size-4" />
            Download
          </Button>
          {onSaveToLibrary ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || generating || !url}
              onClick={onSaveToLibrary}
            >
              <Clapperboard className="size-4" />
              Save to Library
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || generating || !url}
            onClick={onOverlay}
          >
            <Type className="size-4" />
            Add text overlay
          </Button>
          <StarRating
            value={message.rating}
            onChange={onRate}
            disabled={busy || generating}
          />
        </div>
      </div>
    </ImageBoundary>
  );
}
