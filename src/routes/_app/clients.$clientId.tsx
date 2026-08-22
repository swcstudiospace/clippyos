import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, RefreshCw } from "lucide-react";
import {
  getAiStatus,
  getClientBundle,
  markPaymentPaid,
  refreshClientAnalysis,
  setClientStage,
  updateClientNotes,
} from "@/lib/server/clients";
import { type ProgressStage } from "@/lib/entities";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  PLAN_LABELS,
  PLAN_TONES,
  ROLE_LABELS,
  STATUS_LABELS,
} from "@/lib/labels";
import { formatCompactCount, formatDate, formatRelativeTime, formatUsd, initials } from "@/lib/format";
import { parseStrategy } from "@/lib/strategy";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { StagePill, SourceBadge } from "@/components/ui/stage-pill";
import { StrategyBullet } from "@/components/ui/strategy-bullet";
import { PipelineTracker } from "@/components/ui/pipeline-tracker";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { SuggestedTools } from "@/components/clients/suggested-tools";
import { ClientOnboardingChecklistCard } from "@/components/onboarding/client-checklist";
import { ApprovalReview } from "@/components/safety/approval-review";
import { listApprovalsFn, getSafetyInbox, listAuditEventsFn } from "@/lib/server/safety-fns";
import { APPROVALS_QUERY_KEY, SAFETY_INBOX_QUERY_KEY, AUDIT_QUERY_KEY, AUDIT_ACTOR_LABELS } from "@/lib/safety";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { listLibraryAssetsFn } from "@/lib/server/library-fns";
import { formatDurationSec } from "@/lib/library";
import { KnowledgeProposalsInbox } from "@/components/knowledge/proposals-inbox";
import { PortalAccessPanel } from "@/components/clients/portal-access";
import { ScoreBadge } from "@/components/performance/score-badge";
import { PERFORMANCE_QUERY_KEY } from "@/lib/performance";
import { getPerformanceSnapshot } from "@/lib/server/performance-fns";

export const Route = createFileRoute("/_app/clients/$clientId")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const queryClient = useQueryClient();
  const bundleQuery = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientBundle({ data: clientId }),
  });
  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const assetsQuery = useQuery({
    queryKey: ["library-assets", clientId],
    queryFn: () => listLibraryAssetsFn({ data: { clientId, status: "READY" } }),
  });
  const performanceQuery = useQuery({
    queryKey: [...PERFORMANCE_QUERY_KEY, clientId],
    queryFn: () => getPerformanceSnapshot(),
  });
  const pendingApprovals = useQuery({
    queryKey: [...APPROVALS_QUERY_KEY, clientId],
    queryFn: () => listApprovalsFn({ data: { status: "PENDING", clientId } }),
  });
  const inbox = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
  });
  const activity = useQuery({
    queryKey: [...AUDIT_QUERY_KEY, clientId],
    queryFn: () => listAuditEventsFn({ data: { clientId } }),
    enabled: inbox.data?.role === "admin",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<ProgressStage | null>(null);
  const [notes, setNotes] = useState("");

  const bundle = bundleQuery.data ?? null;
  useEffect(() => {
    setNotes(bundle?.client.notes ?? "");
  }, [bundle?.client.notes]);

  const refresh = useMutation({
    mutationFn: () => refreshClientAnalysis({ data: clientId }),
    onSuccess: async () => {
      toast.success("Analysis refreshed from latest uploads");
      await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      captureClientError(error, { source: "refresh-analysis" });
      const message =
        error instanceof Error && error.message === "AI_UNAVAILABLE"
          ? "Analysis isn’t available right now."
          : error instanceof Error && error.message === "AI_RATE_LIMIT"
            ? "The analysis service is busy. Retry in a moment."
            : userFacingErrorMessage(error);
      toast.error(message);
    },
  });

  const stageMut = useMutation({
    mutationFn: (stage: ProgressStage) =>
      setClientStage({ data: { clientId, stage, notes: null } }),
    onSuccess: async () => {
      setPendingStage(null);
      toast.success("Pipeline updated");
      await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      captureClientError(error, { source: "set-stage" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const notesMut = useMutation({
    mutationFn: (value: string) => updateClientNotes({ data: { id: clientId, notes: value } }),
    onSuccess: () => toast.success("Notes saved"),
    onError: (error) => {
      captureClientError(error, { source: "save-notes" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const paidMut = useMutation({
    mutationFn: (id: string) => markPaymentPaid({ data: id }),
    onSuccess: async () => {
      toast.success("Marked paid");
      await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      await queryClient.invalidateQueries({ queryKey: ["money"] });
    },
    onError: (error) => {
      captureClientError(error, { source: "mark-paid" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  if (bundleQuery.isPending) return <DetailSkeleton />;
  if (bundleQuery.isError) {
    return (
      <ErrorState
        title="Couldn’t load this client"
        onRetry={() => void bundleQuery.refetch()}
      />
    );
  }
  if (!bundle) {
    return (
      <EmptyState
        title="Client not found"
        description="It may have been removed or the link is outdated."
        action={
          <ButtonLink />
        }
      />
    );
  }

  const { client } = bundle;
  const strategy = parseStrategy(client.contentStrategy);
  const aiReady = aiQuery.data?.llm ?? false;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/clients"
            className="inline-flex min-h-11 items-center gap-2 text-caption text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Clients
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-page font-semibold tracking-tight">
              <AnimatedShinyText>{client.name}</AnimatedShinyText>
            </h1>
            <Badge tone={statusTone(client.status)}>{STATUS_LABELS[client.status]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={refresh.isPending || !client.channelUrl}
            onClick={() => {
              if (!aiReady) {
                toast.message("Connect AI to refresh analysis");
                return;
              }
              refresh.mutate();
            }}
          >
            <RefreshCw className={`size-4 ${refresh.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
            {refresh.isPending ? "Refreshing…" : "Refresh Analysis"}
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <SectionBoundary title="Overview">
          {pendingApprovals.data?.items.length ? (
            <div className="mb-4 flex flex-col gap-2">
              {pendingApprovals.data.items.map((row) => (
                <ApprovalReview
                  key={row.id}
                  request={row}
                  canDecide={inbox.data?.role === "admin"}
                  compact
                />
              ))}
            </div>
          ) : null}
          <GlassCard>
            <div className="flex flex-col gap-4 sm:flex-row">
              {client.channelThumbnail ? (
                <img
                  src={client.channelThumbnail}
                  alt=""
                  className="size-24 rounded-control object-cover"
                />
              ) : (
                <span className="grid size-24 place-items-center rounded-control bg-secondary-surface text-section font-semibold">
                  {initials(client.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={PLAN_TONES[client.planType]}>
                    {PLAN_LABELS[client.planType]}
                    {client.customPlanLabel ? ` · ${client.customPlanLabel}` : ""}
                  </Badge>
                  <span className="text-body">
                    {formatUsd(client.monthlyFee)}
                    <span className="ml-1 text-caption text-muted">/ mo</span>
                  </span>
                  <span className="text-caption text-muted">
                    Setup {formatUsd(client.setupFee)}
                  </span>
                </div>
                {client.channelUrl ? (
                  <a
                    href={client.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-accent"
                  >
                    {client.channelUrl}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
                <p className="mt-2 text-caption text-muted">
                  Uploads go to the connected workspace YouTube publish channel (v1). Per-client
                  OAuth is phase 2.
                </p>
                <p className="mt-3 text-body text-muted">
                  {client.channelSummary || "No channel summary yet."}
                </p>
              </div>
            </div>
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Assets">
          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-card font-semibold tracking-tight">Library</h2>
              <Link to="/library" className="text-caption text-accent">
                Open library
              </Link>
            </div>
            {assetsQuery.data?.assets.filter((asset) => asset.kind === "VIDEO" || asset.kind === "IMAGE")
              .length ? (
              <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {assetsQuery.data.assets
                  .filter((asset) => asset.kind === "VIDEO" || asset.kind === "IMAGE")
                  .slice(0, 8)
                  .map((asset) => (
                  <li key={asset.id} className="w-36 shrink-0">
                    <Link
                      to="/library"
                      className="block overflow-hidden rounded-control bg-secondary-surface"
                    >
                      {asset.previewUrl && (asset.kind === "IMAGE" || asset.kind === "VIDEO") ? (
                        asset.kind === "IMAGE" ? (
                          <img src={asset.previewUrl} alt="" className="aspect-video w-full object-cover" />
                        ) : (
                          <video
                            src={asset.previewUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="aspect-video" />
                      )}
                      <p className="truncate px-2 py-1.5 text-caption">{asset.title}</p>
                      {asset.durationSec ? (
                        <p className="px-2 pb-1.5 text-caption text-muted">
                          {formatDurationSec(asset.durationSec)}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-caption text-muted">
                No READY assets yet. Upload from Library or save a Twitch clip.
              </p>
            )}
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Winning assets">
          <GlassCard>
            {(() => {
              const pendingCount = (performanceQuery.data?.proposals ?? []).filter(
                (row) => row.status === "PENDING_REVIEW" && row.clientId === clientId,
              ).length;
              const winners = (performanceQuery.data?.rollups ?? [])
                .filter((row) => row.clientId === clientId && (row.winnerCount > 0 || (row.score ?? 0) >= 70))
                .slice(0, 6);
              const assets = assetsQuery.data?.assets ?? [];
              return (
                <>
                  {pendingCount > 0 ? (
                    <p className="mb-3 text-caption text-muted">
                      {pendingCount} learning proposal{pendingCount === 1 ? "" : "s"} waiting for review.
                    </p>
                  ) : null}
                  {!winners.length ? (
                    <p className="text-caption text-muted">
                      Winners appear after published posts have stats. Missing metrics stay unknown.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {winners.map((row) => {
                        const asset = assets.find((item) => item.id === row.assetId);
                        return (
                          <li key={row.assetId} className="flex items-center justify-between gap-3">
                            <Link to="/library" className="min-w-0 text-body hover:underline">
                              {asset?.title ?? "Asset"}
                            </Link>
                            <div className="flex items-center gap-2">
                              {row.viewsTotal != null ? (
                                <span className="text-caption text-muted">
                                  {formatCompactCount(row.viewsTotal)} views
                                </span>
                              ) : null}
                              <ScoreBadge
                                score={row.score}
                                verdict={row.winnerCount > 0 ? "WINNER" : "NEUTRAL"}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              );
            })()}
          </GlassCard>
          <div className="mt-3">
            <KnowledgeProposalsInbox
              clientId={clientId}
              clientNames={new Map([[clientId, client.name]])}
              compact
            />
          </div>
        </SectionBoundary>

        <SectionBoundary title="Strategy">
          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-card font-semibold tracking-tight">Strategy</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            </div>
            {strategy.bullets.length === 0 ? (
              <p className="mt-3 text-body text-muted">No strategy bullets yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {strategy.bullets.map((bullet) => (
                  <li key={bullet.title}>
                    <StrategyBullet title={bullet.title} reasoning={bullet.reasoning} />
                  </li>
                ))}
              </ul>
            )}
            {strategy.style || strategy.growth ? (
              <p className="mt-4 text-caption text-muted">
                {strategy.style}
                {strategy.style && strategy.growth ? " · " : ""}
                {strategy.growth}
              </p>
            ) : null}
          </GlassCard>
        </SectionBoundary>

        <SuggestedTools client={client} llmReady={aiReady} />

        <SectionBoundary title="Production pipeline">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Production pipeline</h2>
            <p className="mt-1 text-caption text-muted">
              Current stage:{" "}
              <StagePill stage={bundle.currentStage} />
              {bundle.currentSource ? (
                <>
                  {" "}
                  <SourceBadge source={bundle.currentSource} />
                </>
              ) : null}
            </p>
            <p className="mt-2 text-caption text-muted">
              Discord Status Agent is read-only and runs automatically about every
              30 minutes. It matches Discord server names to client names and
              updates production stages. Manual updates are kept for two hours.
            </p>
            <div className="mt-4">
              <PipelineTracker
                current={bundle.currentStage}
                onSelect={(stage) => setPendingStage(stage)}
              />
            </div>
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Onboarding">
          <ClientOnboardingChecklistCard
            clientId={client.id}
            checklist={client.onboardingChecklist}
          />
        </SectionBoundary>

        <SectionBoundary title="Portal access">
          <PortalAccessPanel clientId={client.id} />
        </SectionBoundary>

        <SectionBoundary title="Team">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Team</h2>
            {bundle.team.length === 0 ? (
              <p className="mt-3 text-body text-muted">No team members assigned yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {bundle.team.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-body font-medium">{member.name}</p>
                      <p className="text-caption text-muted">{ROLE_LABELS[member.role]}</p>
                    </div>
                    <p className="text-body">{formatUsd(member.cost)}</p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Payments">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Payments</h2>
            {bundle.payments.length === 0 ? (
              <p className="mt-3 text-body text-muted">No payments recorded.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {bundle.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-body font-medium">
                        {formatUsd(payment.amount)} · {PAYMENT_TYPE_LABELS[payment.type]}
                      </p>
                      <p className="text-caption text-muted">Due {formatDate(payment.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(payment.status)}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                      {payment.status !== "PAID" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={paidMut.isPending}
                          onClick={() => paidMut.mutate(payment.id)}
                        >
                          Mark paid
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Performance">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Performance</h2>
            {bundle.analytics ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Views" value={bundle.analytics.views} />
                <Metric label="Subscribers" value={bundle.analytics.subscribers} />
                <Metric label="Watch hours" value={bundle.analytics.watchHours} />
                <Metric label="CTR" value={bundle.analytics.impressionsCtr} />
              </dl>
            ) : (
              <p className="mt-3 text-body text-muted">No analytics yet.</p>
            )}
          </GlassCard>
        </SectionBoundary>

        {inbox.data?.role === "admin" ? (
        <SectionBoundary title="Activity">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Activity</h2>
            <p className="mt-1 text-caption text-muted">Publishes, payments, and approvals for this client.</p>
            {activity.isFetching && !activity.data ? (
              <p className="mt-3 text-body text-muted">Loading activity…</p>
            ) : (activity.data?.items.length ?? 0) === 0 ? (
              <p className="mt-3 text-body text-muted">No audit events for this client yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {(activity.data?.items ?? []).slice(0, 12).map((row) => (
                  <li
                    key={row.id}
                    className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3"
                  >
                    <p className="text-body font-medium">{row.summary}</p>
                    <p className="mt-1 text-caption text-muted">
                      {row.action} · {AUDIT_ACTOR_LABELS[row.actorType]} · {formatRelativeTime(row.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </SectionBoundary>
        ) : null}

        <SectionBoundary title="Notes">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Notes</h2>
            <Textarea
              className="mt-3"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-label="Client notes"
            />
            <Button
              className="mt-3"
              variant="secondary"
              disabled={notesMut.isPending}
              onClick={() => notesMut.mutate(notes)}
            >
              {notesMut.isPending ? "Saving…" : "Save notes"}
            </Button>
          </GlassCard>
        </SectionBoundary>

        <SectionBoundary title="Refresh analysis">
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Refresh analysis</h2>
            <p className="mt-2 text-body text-muted">
              Always fetches the latest uploads and rewrites the summary, offers, and
              strategy. Long-form is any video 4 minutes or longer.
            </p>
            {!aiReady ? (
              <div className="mt-4">
                <AIFallbackPanel />
              </div>
            ) : null}
          </GlassCard>
        </SectionBoundary>
      </div>

      <ClientFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        aiReady={aiReady}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["client", clientId] });
          void queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />

      <Dialog open={Boolean(pendingStage)} onOpenChange={(next) => !next && setPendingStage(null)}>
        <DialogContent>
          <DialogTitle>Update production stage?</DialogTitle>
          <DialogDescription>
            This records a manual progress update
            {pendingStage ? ` to ${pendingStage.replaceAll("_", " ").toLowerCase()}` : ""}.
            The previous stage stays in the history.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              disabled={!pendingStage || stageMut.isPending}
              onClick={() => pendingStage && stageMut.mutate(pendingStage)}
            >
              Update stage
            </Button>
            <Button variant="ghost" onClick={() => setPendingStage(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="mt-1 text-body font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function ButtonLink() {
  return (
    <Link to="/clients" className="inline-flex min-h-11 items-center text-caption text-accent">
      Back to clients
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-4 h-12 w-72" />
      <div className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-56 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    </div>
  );
}


