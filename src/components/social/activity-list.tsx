import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SocialPost, SocialPostStatus } from "@/lib/entities";
import { formatRelativeTime, formatCompactCount } from "@/lib/format";
import { PLATFORM_LABELS, SOCIAL_QUERY_KEY, jobStatusLabel, postStatusLabel, uploadPhaseLabel, type SocialJobView } from "@/lib/social";
import { RAIL_LABELS, TIKTOK_MODE_LABELS } from "@/lib/publishers";
import { shortActor } from "@/lib/safety";
import { Link } from "@tanstack/react-router";
import {
  PERFORMANCE_QUERY_KEY,
  WINDOW_LABELS,
  formatUnknownNumber,
  socialPlatformToPerformance,
  type PostPerformance,
} from "@/lib/performance";
import { ScoreBadge } from "@/components/performance/score-badge";
import { recordManualMetricsFn } from "@/lib/server/performance-fns";
import { userFacingErrorMessage } from "@/lib/errors";
import { LinearIssueActions } from "@/components/linear/issue-actions";

export function ActivityList({
  posts,
  jobs,
  clientNames,
  onStatus,
  onResume,
  onCancel,
  busyJobId,
  performance,
}: {
  posts: SocialPost[];
  jobs?: SocialJobView[];
  clientNames: Map<string, string>;
  onStatus: (id: string, status: Extract<SocialPostStatus, "succeeded" | "failed" | "needs_attention">) => void;
  onResume?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  busyJobId?: string | null;
  performance?: PostPerformance[];
}) {
  const waiting = (jobs ?? []).filter((job) => job.status === "awaiting_approval");
  return (
    <GlassCard>
      <h2 className="text-card font-semibold tracking-tight">Upload jobs</h2>
      <p className="mt-1 text-caption text-muted">
        Per-platform results. Live publishes may wait for approval. API posts include a permalink when
        the platform returns one.
      </p>
      {waiting.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {waiting.map((job) => (
            <li
              key={job.id}
              className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-body font-medium">
                    {clientNames.get(job.clientId) ?? "Client"} · {job.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
                  </p>
                  <p className="text-caption text-muted">
                    Waiting for approval · {formatRelativeTime(job.createdAt)}
                    {job.createdBy ? ` · ${shortActor(job.createdBy)}` : ""}
                    {job.caption ? ` · ${job.caption.slice(0, 80)}` : ""}
                  </p>
                </div>
                <Badge tone={statusTone("AWAITING_APPROVAL")}>{jobStatusLabel(job.status)}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  to="/approvals"
                  className="inline-flex min-h-11 items-center text-caption text-accent underline-offset-2 hover:underline"
                >
                  Review approval
                </Link>
                {onCancel ? (
                  <Button size="sm" variant="ghost" onClick={() => onCancel(job.id)}>
                    Cancel
                  </Button>
                ) : null}
                <LinearIssueActions
                  entityType="SocialUploadJob"
                  entityId={job.id}
                  title={`[Social] Awaiting approval — ${clientNames.get(job.clientId) ?? "client"}`}
                  description={job.caption ?? undefined}
                  labels={["social"]}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {posts.length === 0 && waiting.length === 0 ? (
        <p className="mt-4 text-body text-muted">
          No social posts yet. Queue a 1-click upload — API publishers work without the Social
          Machine.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {posts.map((post) => {
            const percent = post.uploadPercent ?? 0;
            const showProgress =
              post.rail === "API" && (post.status === "running" || post.status === "queued");
            const canResume =
              Boolean(post.jobId) &&
              Boolean(post.resumableSessionId) &&
              post.rail === "API" &&
              post.status === "failed";
            const canCancel =
              Boolean(post.jobId) &&
              post.rail === "API" &&
              (post.status === "running" || post.status === "queued");
            const busy = Boolean(post.jobId && busyJobId === post.jobId);
            return (
              <li
                key={post.id}
                className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-body font-medium">
                      {clientNames.get(post.clientId) ?? "Client"} · {PLATFORM_LABELS[post.platform]}
                    </p>
                    <p className="text-caption text-muted">
                      {formatRelativeTime(post.createdAt)}
                      {` · ${post.source === "GROK_BOT" ? "Grok Bot" : RAIL_LABELS[post.rail ?? "BROWSER"]}`}
                      {post.tiktokPostMode
                        ? ` · ${TIKTOK_MODE_LABELS[post.tiktokPostMode]}`
                        : ""}
                      {post.caption ? ` · ${post.caption.slice(0, 80)}` : ""}
                    </p>
                    {post.externalUrl ? (
                      <a
                        href={post.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-caption text-accent underline-offset-2 hover:underline"
                      >
                        Open post
                      </a>
                    ) : post.externalPostId ? (
                      <p className="mt-1 text-caption text-muted">id {post.externalPostId}</p>
                    ) : null}
                    {post.attentionReason ? (
                      <p className="mt-1 text-caption text-warning">{post.attentionReason}</p>
                    ) : null}
                    {post.status === "succeeded" ? (
                      <PostSnapshots
                        post={post}
                        rows={(performance ?? []).filter((row) => row.socialPostId === post.id)}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={post.source === "GROK_BOT" ? "purple" : post.rail === "API" ? "teal" : "neutral"}>
                      {post.source === "GROK_BOT" ? "Grok Bot" : RAIL_LABELS[post.rail ?? "BROWSER"]}
                    </Badge>
                    {post.tiktokPostMode ? (
                      <Badge tone="neutral">{TIKTOK_MODE_LABELS[post.tiktokPostMode]}</Badge>
                    ) : null}
                    <Badge tone={statusTone(post.status.toUpperCase())}>
                      {postStatusLabel(post.status)}
                    </Badge>
                  </div>
                </div>
                {showProgress ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-caption text-muted">
                      <span>{uploadPhaseLabel(post.uploadPhase)}</span>
                      <span>{percent}%</span>
                    </div>
                    <div
                      className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary-surface"
                      role="progressbar"
                      aria-label="Upload progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {post.screenshotUrl ? (
                  <img
                    src={post.screenshotUrl}
                    alt=""
                    className="mt-2 max-h-40 w-full rounded-control object-cover object-top"
                  />
                ) : null}
                {post.status === "needs_attention" || post.status === "running" || canResume || canCancel ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {canCancel && onCancel && post.jobId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onCancel(post.jobId!)}
                      >
                        Cancel upload
                      </Button>
                    ) : null}
                    {canResume && onResume && post.jobId ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => onResume(post.jobId!)}
                      >
                        Resume upload
                      </Button>
                    ) : null}
                    {post.status === "needs_attention" || post.status === "running" ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onStatus(post.id, "succeeded")}
                        >
                          Mark published
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onStatus(post.id, "failed")}>
                          Mark failed
                        </Button>
                      </>
                    ) : null}
                    {post.jobId ? (
                      <LinearIssueActions
                        entityType="SocialUploadJob"
                        entityId={post.jobId}
                        title={`[Social] ${post.status} — ${PLATFORM_LABELS[post.platform]} — ${clientNames.get(post.clientId) ?? "client"}`}
                        description={post.attentionReason ?? undefined}
                        labels={["social"]}
                        compact
                      />
                    ) : null}
                  </div>
                ) : post.status === "failed" || post.jobId ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {post.jobId ? (
                      <LinearIssueActions
                        entityType="SocialUploadJob"
                        entityId={post.jobId}
                        title={`[Social] ${post.status} — ${PLATFORM_LABELS[post.platform]} — ${clientNames.get(post.clientId) ?? "client"}`}
                        description={post.attentionReason ?? undefined}
                        labels={["social", post.status === "failed" ? "bug" : "social"]}
                        compact
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}

function PostSnapshots({ rows, post }: { rows: PostPerformance[]; post: SocialPost }) {
  const [open, setOpen] = useState(false);
  if (!rows.length) {
    return (
      <div className="mt-1">
        <p className="text-caption text-muted">No stats yet — unknown, not zero.</p>
        <Button size="sm" variant="ghost" className="mt-1" onClick={() => setOpen(true)}>
          Enter stats
        </Button>
        {open ? <InlineManualMetrics post={post} onClose={() => setOpen(false)} /> : null}
      </div>
    );
  }
  const ordered = [...rows].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
  return (
    <div className="mt-2">
      <ul className="flex flex-col gap-1">
        {ordered.slice(0, 4).map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-2 text-caption text-muted">
            <span>
              {WINDOW_LABELS[row.window]} · {formatUnknownNumber(row.metrics.views, formatCompactCount)} views
            </span>
            <ScoreBadge score={row.score} verdict={row.verdict} />
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" className="mt-1" onClick={() => setOpen(true)}>
        Enter stats
      </Button>
      {open ? <InlineManualMetrics post={post} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function InlineManualMetrics({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const save = useMutation({
    mutationFn: () =>
      recordManualMetricsFn({
        data: {
          socialPostId: post.id,
          clientId: post.clientId,
          platform: socialPlatformToPerformance(post.platform),
          externalPostId: post.externalPostId || post.id,
          externalUrl: post.externalUrl,
          mediaAssetId: post.contentRef,
          window: "LIFETIME",
          metrics: {
            views: parseOptional(views),
            likes: parseOptional(likes),
            comments: parseOptional(comments),
          },
        },
      }),
    onSuccess: async () => {
      toast.success("Manual snapshot saved");
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
      onClose();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  return (
    <form
      className="mt-2 grid gap-2 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <Field id={`ps-views-${post.id}`} label="Views" value={views} onChange={setViews} />
      <Field id={`ps-likes-${post.id}`} label="Likes" value={likes} onChange={setLikes} />
      <Field id={`ps-comments-${post.id}`} label="Comments" value={comments} onChange={setComments} />
      <div className="sm:col-span-3 flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save snapshot"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
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
    <div className="flex flex-col gap-1">
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
