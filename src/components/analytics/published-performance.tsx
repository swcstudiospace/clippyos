import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/money/filter-chip";
import { ScoreBadge } from "@/components/performance/score-badge";
import { formatCompactCount, formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import {
  PERFORMANCE_PLATFORMS,
  PLATFORM_LABELS,
  WINDOW_LABELS,
  formatEngagementPct,
  formatUnknownNumber,
  latestSnapshotPerPost,
  type MetricsApiStatus,
  type PerformancePlatform,
  type PostMetrics,
  type PostPerformance,
} from "@/lib/performance";
import { recordManualMetricsFn, refreshPostPerformanceFn } from "@/lib/server/performance-fns";
import { PERFORMANCE_QUERY_KEY } from "@/lib/performance";
import { ANALYTICS_QUERY_KEY } from "@/lib/analytics";

export function PublishedPerformance({
  rows,
  metricsApi,
  clientId,
  clientNames,
}: {
  rows: PostPerformance[];
  metricsApi: MetricsApiStatus;
  clientId?: string;
  clientNames: Map<string, string>;
}) {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<PerformancePlatform | "ALL">("ALL");
  const [winnersOnly, setWinnersOnly] = useState(false);
  const [manualFor, setManualFor] = useState<PostPerformance | null>(null);

  const latest = useMemo(() => latestSnapshotPerPost(rows), [rows]);
  const filtered = useMemo(() => {
    return latest.filter((row) => {
      if (clientId && row.clientId !== clientId) return false;
      if (platform !== "ALL" && row.platform !== platform) return false;
      if (winnersOnly && row.verdict !== "WINNER") return false;
      return true;
    });
  }, [latest, clientId, platform, winnersOnly]);

  const refresh = useMutation({
    mutationFn: (socialPostId: string) => refreshPostPerformanceFn({ data: { socialPostId } }),
    onSuccess: async () => {
      toast.success("Stats refreshed");
      await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const sweep = useMutation({
    mutationFn: () => refreshPostPerformanceFn({ data: { sweep: true } }),
    onSuccess: async () => {
      toast.success("Swept published stats");
      await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-card font-semibold tracking-tight">Published performance</h2>
          <p className="mt-1 text-caption text-muted">
            Scores compare each post to other posts for the same client and platform (90 days). Missing
            stats stay blank — never zero.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <MetricsApiPills status={metricsApi} />
          <Button
            size="sm"
            variant="secondary"
            disabled={sweep.isPending}
            onClick={() => sweep.mutate()}
          >
            {sweep.isPending ? "Sweeping…" : "Sweep published stats"}
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Platform filter">
        <FilterChip label="All platforms" active={platform === "ALL"} onClick={() => setPlatform("ALL")} />
        {PERFORMANCE_PLATFORMS.filter((p) => p !== "OTHER").map((p) => (
          <FilterChip
            key={p}
            label={PLATFORM_LABELS[p]}
            active={platform === p}
            onClick={() => setPlatform(p)}
          />
        ))}
        <FilterChip label="Winners only" active={winnersOnly} onClick={() => setWinnersOnly((v) => !v)} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No published stats yet"
          description="After a post goes live, refresh stats or enter views manually. YouTube channel snapshots stay in the section above."
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-body font-medium">
                    {row.clientId ? (clientNames.get(row.clientId) ?? "Client") : "Workspace"} ·{" "}
                    {PLATFORM_LABELS[row.platform]}
                  </p>
                  <p className="text-caption text-muted">
                    {WINDOW_LABELS[row.window]} · {formatRelativeTime(row.capturedAt)} · {row.metricsSource}
                    {row.externalUrl ? "" : row.externalPostId ? ` · ${row.externalPostId.slice(0, 12)}` : ""}
                  </p>
                  <p className="mt-1 text-caption">
                    {formatUnknownNumber(row.metrics.views, formatCompactCount)} views ·{" "}
                    {formatUnknownNumber(row.metrics.likes, formatCompactCount)} likes ·{" "}
                    {formatEngagementPct(row.engagementRate)} engagement
                  </p>
                  {row.externalUrl ? (
                    <a
                      href={row.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-caption text-accent underline-offset-2 hover:underline"
                    >
                      Open post
                    </a>
                  ) : null}
                  {row.mediaAssetId ? (
                    <Link
                      to="/library"
                      className="ml-3 inline-block text-caption text-accent underline-offset-2 hover:underline"
                    >
                      Asset
                    </Link>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={row.score} verdict={row.verdict} />
                  {row.socialPostId ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={refresh.isPending}
                      onClick={() => refresh.mutate(row.socialPostId!)}
                    >
                      Refresh stats
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setManualFor(row)}>
                    Enter manually
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {manualFor ? (
        <ManualMetricsForm
          seed={manualFor}
          onClose={() => setManualFor(null)}
          onSaved={async () => {
            setManualFor(null);
            await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
          }}
        />
      ) : null}
    </GlassCard>
  );
}

function MetricsApiPills({ status }: { status: MetricsApiStatus }) {
  const items: Array<[string, boolean]> = [
    ["YouTube", status.youtube],
    ["X", status.x],
    ["TikTok", status.tiktok],
    ["Instagram", status.instagram],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, ok]) => (
        <Badge key={label} tone={ok ? "green" : "neutral"}>
          {label} {ok ? "API" : "manual"}
        </Badge>
      ))}
    </div>
  );
}

function ManualMetricsForm({
  seed,
  onClose,
  onSaved,
}: {
  seed: PostPerformance;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [views, setViews] = useState(seed.metrics.views?.toString() ?? "");
  const [likes, setLikes] = useState(seed.metrics.likes?.toString() ?? "");
  const [comments, setComments] = useState(seed.metrics.comments?.toString() ?? "");
  const [shares, setShares] = useState(seed.metrics.shares?.toString() ?? "");
  const [saves, setSaves] = useState(seed.metrics.saves?.toString() ?? "");
  const save = useMutation({
    mutationFn: () =>
      recordManualMetricsFn({
        data: {
          socialPostId: seed.socialPostId ?? undefined,
          clientId: seed.clientId,
          platform: seed.platform,
          externalPostId: seed.externalPostId,
          externalUrl: seed.externalUrl,
          mediaAssetId: seed.mediaAssetId,
          window: seed.window,
          metrics: {
            views: parseOptional(views),
            likes: parseOptional(likes),
            comments: parseOptional(comments),
            shares: parseOptional(shares),
            saves: parseOptional(saves),
          } satisfies Partial<PostMetrics>,
        },
      }),
    onSuccess: async () => {
      toast.success("Manual snapshot saved");
      await onSaved();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  return (
    <form
      className="mt-4 grid gap-3 rounded-control border border-border bg-bg/40 p-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <p className="sm:col-span-2 text-caption text-muted">
        Leave a field blank if you don’t know it. Blank is unknown, not zero.
      </p>
      <Field id="pf-views" label="Views" value={views} onChange={setViews} />
      <Field id="pf-likes" label="Likes" value={likes} onChange={setLikes} />
      <Field id="pf-comments" label="Comments" value={comments} onChange={setComments} />
      <Field id="pf-shares" label="Shares" value={shares} onChange={setShares} />
      <Field id="pf-saves" label="Saves" value={saves} onChange={setSaves} />
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save snapshot"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="unknown"
      />
    </div>
  );
}

function parseOptional(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
