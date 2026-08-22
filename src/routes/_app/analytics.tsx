import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ANALYTICS_QUERY_KEY,
  aggregateLatest,
  averageCtr,
  latestByClient,
  snapshotsForClient,
  type ClientAnalyticsRow,
} from "@/lib/analytics";
import { formatCompactCount, formatDate, formatRelativeTime } from "@/lib/format";
import { connectChannel, getAnalytics, pullAnalytics } from "@/lib/server/analytics";
import { userFacingErrorMessage } from "@/lib/errors";
import { parseYouTubeChannelUrl } from "@/lib/youtube";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Badge, statusTone } from "@/components/ui/badge";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { AnalyticsMetricRow } from "@/components/analytics/metric-cards";
import { AnalyticsCharts } from "@/components/analytics/charts";
import { TopVideos } from "@/components/analytics/top-videos";
import { ManualEntryForm } from "@/components/analytics/manual-entry";
import { FilterChip } from "@/components/money/filter-chip";
import type { Client } from "@/lib/entities";
import { PublishedPerformance } from "@/components/analytics/published-performance";
import { PERFORMANCE_QUERY_KEY } from "@/lib/performance";
import { getPerformanceSnapshot } from "@/lib/server/performance-fns";

type AnalyticsSearch = { client?: string };

export const Route = createFileRoute("/_app/analytics")({
  validateSearch: (search: Record<string, unknown>): AnalyticsSearch => ({
    client:
      typeof search.client === "string" && search.client.length > 0
        ? search.client
        : undefined,
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { client: selectedId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => getAnalytics(),
  });
  const performanceQuery = useQuery({
    queryKey: PERFORMANCE_QUERY_KEY,
    queryFn: () => getPerformanceSnapshot(),
  });
  const [channelInput, setChannelInput] = useState("");
  const [linkClientId, setLinkClientId] = useState("");

  const clients = query.data?.clients ?? [];
  const snapshots = query.data?.snapshots ?? [];
  const youtubeDataApi = query.data?.youtubeDataApi === true;
  const active = useMemo(
    () => clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt),
    [clients],
  );
  const latestMap = useMemo(() => latestByClient(snapshots), [snapshots]);
  const rows: ClientAnalyticsRow[] = useMemo(
    () => active.map((client) => ({ client, latest: latestMap.get(client.id) ?? null })),
    [active, latestMap],
  );
  const selected = selectedId ? (clients.find((row) => row.id === selectedId) ?? null) : null;
  const history = selected ? snapshotsForClient(snapshots, selected.id) : [];
  const latest = selected ? (latestMap.get(selected.id) ?? null) : null;
  const totals = aggregateLatest(rows);

  const connect = useMutation({
    mutationFn: () =>
      connectChannel({
        data: {
          input: channelInput.trim(),
          clientId: linkClientId || selectedId || null,
        },
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        toast.error("No matching client. Create or pick a client, then connect.");
        return;
      }
      toast.success(
        result.alreadyLinked
          ? `${result.client.name} already has this channel`
          : `Connected ${result.channelTitle} to ${result.client.name}`,
      );
      setChannelInput("");
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      void navigate({ search: { client: result.client.id } });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const pull = useMutation({
    mutationFn: (clientId: string | null) => pullAnalytics({ data: { clientId } }),
    onSuccess: async () => {
      toast.success("Analytics snapshot updated");
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function selectClient(id: string | undefined) {
    void navigate({ search: { client: id } });
  }

  const loading = query.isPending;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Analytics"
        description="Subscribers, views, and video stats from stored snapshots — never from a live API response held only in memory."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={pull.isPending || !youtubeDataApi}
              onClick={() => pull.mutate(selectedId ?? null)}
            >
              <RefreshCw className={`size-4 ${pull.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
              {pull.isPending ? "Pulling…" : selected ? "Refresh Analytics" : "Pull latest"}
            </Button>
          </div>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Client filter">
        <FilterChip label="All clients" active={!selectedId} onClick={() => selectClient(undefined)} />
        {active.map((client) => (
          <FilterChip
            key={client.id}
            label={client.name}
            active={selectedId === client.id}
            onClick={() => selectClient(client.id)}
          />
        ))}
      </div>

      {!youtubeDataApi ? (
        <div className="mt-4">
          <AIFallbackPanel
            title="Automated YouTube pulls will be available once you connect your API key"
            integration="youtube"
          />
        </div>
      ) : null}

      <ConnectBar
        value={channelInput}
        onChange={setChannelInput}
        clients={active}
        linkClientId={linkClientId || selectedId || ""}
        onLinkClient={setLinkClientId}
        pending={connect.isPending}
        onConnect={() => {
          const parsed = parseYouTubeChannelUrl(channelInput);
          if (!parsed.ok) {
            toast.error(parsed.error);
            return;
          }
          connect.mutate();
        }}
      />

      {query.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load analytics"
            description="Workspace snapshots couldn’t be read. Try again."
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : selected ? (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Client dashboard">
            <GlassCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-card font-semibold tracking-tight">{selected.name}</h2>
                  {selected.channelUrl ? (
                    <a
                      href={selected.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center text-caption text-accent"
                    >
                      Open channel
                    </a>
                  ) : (
                    <p className="mt-1 text-caption text-muted">No channel connected yet.</p>
                  )}
                  <p className="text-caption text-muted">
                    Last snapshot{" "}
                    {latest
                      ? `${formatDate(latest.date)} · ${formatRelativeTime(latest.updatedAt)}`
                      : "never"}
                  </p>
                </div>
                <Button
                  disabled={pull.isPending || !youtubeDataApi || !selected.channelUrl}
                  onClick={() => pull.mutate(selected.id)}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Refresh Analytics
                </Button>
              </div>
            </GlassCard>
          </SectionBoundary>

          <SectionBoundary title="Metrics">
            {latest || loading ? (
              <AnalyticsMetricRow
                subscribers={latest?.subscribersN ?? null}
                views={latest?.viewsN ?? null}
                ctr={averageCtr(history)}
                watchHours={latest?.watchHoursN ?? null}
                loading={loading}
              />
            ) : (
              <EmptyState
                title="No snapshots for this client"
                description="Pull from YouTube or enter the first snapshot manually."
                action={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={!youtubeDataApi || !selected.channelUrl || pull.isPending}
                      onClick={() => pull.mutate(selected.id)}
                    >
                      Refresh Analytics
                    </Button>
                  </div>
                }
              />
            )}
          </SectionBoundary>

          <SectionBoundary title="Trends">
            <AnalyticsCharts history={history} loading={loading} />
          </SectionBoundary>

          <SectionBoundary title="Top videos">
            <TopVideos videos={latest?.videos ?? []} loading={loading} />
          </SectionBoundary>

          <SectionBoundary title="Published performance">
            <PublishedPerformance
              rows={performanceQuery.data?.posts ?? []}
              metricsApi={
                performanceQuery.data?.metricsApi ?? {
                  youtube: youtubeDataApi,
                  x: false,
                  tiktok: false,
                  instagram: false,
                }
              }
              clientId={selected.id}
              clientNames={new Map(clients.map((row) => [row.id, row.name]))}
            />
          </SectionBoundary>

          <SectionBoundary title="Manual entry">
            <ManualEntryForm clients={clients} selectedClientId={selected.id} />
          </SectionBoundary>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Overview">
            {loading ? (
              <AnalyticsMetricRow subscribers={null} views={null} ctr={null} watchHours={null} loading />
            ) : active.length === 0 ? (
              <EmptyState
                title="No active clients"
                description="Add a client first, then connect their YouTube channel."
                action={
                  <Button asChild>
                    <Link to="/clients">Go to Clients</Link>
                  </Button>
                }
              />
            ) : (
              <AnalyticsMetricRow
                subscribers={totals.subscribers}
                views={totals.views}
                ctr={totals.ctr}
                watchHours={totals.watchHours}
              />
            )}
          </SectionBoundary>

          <SectionBoundary title="All clients">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="Nothing to compare yet"
                description="Active clients appear here with their latest snapshot."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                  <button
                    key={row.client.id}
                    type="button"
                    className="text-left"
                    onClick={() => selectClient(row.client.id)}
                  >
                    <GlassCard interactive>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-card font-semibold tracking-tight">{row.client.name}</p>
                        <Badge tone={statusTone(row.client.channelUrl ? "CONNECTED" : "PENDING")}>
                          {row.client.channelUrl ? "Channel" : "No channel"}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-caption">
                        <div>
                          <dt className="text-muted">Subscribers</dt>
                          <dd className="tabular-nums">{formatCompactCount(row.latest?.subscribersN ?? null)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">Views</dt>
                          <dd className="tabular-nums">{formatCompactCount(row.latest?.viewsN ?? null)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">CTR</dt>
                          <dd className="tabular-nums">
                            {row.latest?.ctrN == null ? "—" : `${row.latest.ctrN.toFixed(2)}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Updated</dt>
                          <dd>{row.latest ? formatDate(row.latest.date) : "—"}</dd>
                        </div>
                      </dl>
                    </GlassCard>
                  </button>
                ))}
              </div>
            )}
          </SectionBoundary>

          <SectionBoundary title="Published performance">
            <PublishedPerformance
              rows={performanceQuery.data?.posts ?? []}
              metricsApi={
                performanceQuery.data?.metricsApi ?? {
                  youtube: youtubeDataApi,
                  x: false,
                  tiktok: false,
                  instagram: false,
                }
              }
              clientNames={new Map(clients.map((row) => [row.id, row.name]))}
            />
          </SectionBoundary>

          <SectionBoundary title="Manual entry">
            <ManualEntryForm clients={clients} selectedClientId={null} />
          </SectionBoundary>
        </div>
      )}
    </div>
  );
}

function ConnectBar({
  value,
  onChange,
  clients,
  linkClientId,
  onLinkClient,
  pending,
  onConnect,
}: {
  value: string;
  onChange: (value: string) => void;
  clients: Client[];
  linkClientId: string;
  onLinkClient: (id: string) => void;
  pending: boolean;
  onConnect: () => void;
}) {
  return (
    <GlassCard className="mt-4">
      <h2 className="text-card font-semibold tracking-tight">Connect channel</h2>
      <p className="mt-1 text-caption text-muted">
        Paste a YouTube URL or channel ID (UC…). We match an existing client instead of creating orphan stats.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          onConnect();
        }}
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="channel-input">Channel URL or ID</Label>
          <Input
            id="channel-input"
            className="mt-1.5"
            placeholder="https://www.youtube.com/@handle or UC…"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <div className="w-full lg:w-56">
          <Label htmlFor="link-client">Link to client</Label>
          <select
            id="link-client"
            className="mt-1.5 min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body"
            value={linkClientId}
            onChange={(event) => onLinkClient(event.target.value)}
          >
            <option value="">Auto-match</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending || value.trim().length < 3}>
          {pending ? "Connecting…" : "Connect"}
        </Button>
      </form>
    </GlassCard>
  );
}
