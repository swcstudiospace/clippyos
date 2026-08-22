import { useMemo, useState } from "react";
import type { TopVideo } from "@/lib/analytics";
import { formatCompactCount, formatDate } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function TopVideos({
  videos,
  loading,
}: {
  videos: TopVideo[];
  loading?: boolean;
}) {
  const [longFormOnly, setLongFormOnly] = useState(false);
  const rows = useMemo(
    () => (longFormOnly ? videos.filter((video) => video.isLongForm) : videos),
    [videos, longFormOnly],
  );

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-card font-semibold tracking-tight">Top-performing videos</h3>
          <p className="mt-1 text-caption text-muted">
            From the latest snapshot. Public API returns recent uploads ranked by views.
          </p>
        </div>
        <div className="flex min-h-11 items-center gap-2">
          <Switch
            id="long-form-filter"
            checked={longFormOnly}
            onCheckedChange={setLongFormOnly}
            aria-label="Show only long-form videos"
          />
          <Label htmlFor="long-form-filter">Long-form only (≥ 4 min)</Label>
        </div>
      </div>
      {loading ? (
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          className="mt-4"
          title={longFormOnly ? "No long-form videos in this snapshot" : "No videos stored yet"}
          description="Pull analytics or enter videos on a manual snapshot."
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((video, index) => (
            <li key={`${video.videoId || video.title}-${index}`}>
              <a
                href={video.url || undefined}
                target={video.url ? "_blank" : undefined}
                rel="noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-control bg-secondary-surface/50 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="size-12 shrink-0 rounded-control object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-control bg-secondary-surface text-caption text-muted">
                    {index + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body">{video.title}</span>
                  <span className="text-caption text-muted">
                    {formatCompactCount(video.views)} views
                    {video.publishedAt ? ` · ${formatDate(video.publishedAt)}` : ""}
                  </span>
                </span>
                {video.isLongForm ? (
                  <Badge tone="green">Long-form</Badge>
                ) : video.durationSeconds != null ? (
                  <Badge tone="neutral">Short</Badge>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
