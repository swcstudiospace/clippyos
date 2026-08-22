import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listClients, listProgress, getAiStatus } from "@/lib/server/clients";
import { getMoneySnapshot } from "@/lib/server/money";
import { getAnalytics, pullAnalytics } from "@/lib/server/analytics";
import { listLeads } from "@/lib/server/leads";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { getBillingSnapshot } from "@/lib/server/billing-fns";
import { getSafetyInbox } from "@/lib/server/safety-fns";
import { SAFETY_INBOX_QUERY_KEY } from "@/lib/safety";
import { BILLING_QUERY_KEY } from "@/lib/billing";
import { MONEY_QUERY_KEY, isActiveClient } from "@/lib/money";
import { ANALYTICS_QUERY_KEY } from "@/lib/analytics";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import { LEADS_QUERY_KEY } from "@/lib/leads";
import { deriveTeam } from "@/lib/team";
import {
  DASHBOARD_PROGRESS_QUERY_KEY,
  deriveDashboardAlerts,
  deriveDashboardMetrics,
  deriveGuaranteeItems,
  derivePipelineCounts,
  deriveRecentActivity,
  deriveStuckStageCount,
  type PipelineFilter,
} from "@/lib/dashboard";
import { formatUsd, todayIsoDate } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import { MetricCard } from "@/components/money/metric-card";
import { ClientStageCards } from "@/components/dashboard/stage-cards";
import { DailyObjectives } from "@/components/dashboard/daily-objectives";
import { AlertStrip } from "@/components/dashboard/alert-strip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PipelineSummary } from "@/components/dashboard/pipeline-summary";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AutomationWidget } from "@/components/dashboard/automation-widget";
import { SubscriptionTracker } from "@/components/billing/tracker";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Particles } from "@/components/magicui/particles";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/home")({
  component: DashboardPage,
});

function DashboardPage() {
  const today = todayIsoDate();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stageFilter, setStageFilter] = useState<PipelineFilter>(null);
  const [addOpen, setAddOpen] = useState(false);

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });
  const moneyQuery = useQuery({
    queryKey: MONEY_QUERY_KEY,
    queryFn: () => getMoneySnapshot(),
  });
  const analyticsQuery = useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => getAnalytics(),
  });
  const progressQuery = useQuery({
    queryKey: DASHBOARD_PROGRESS_QUERY_KEY,
    queryFn: () => listProgress(),
  });
  const leadsQuery = useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: () => listLeads(),
  });
  const integrationsQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const billingQuery = useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => getBillingSnapshot(),
  });
  const inboxQuery = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
  });
  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });

  const metrics = useMemo(() => {
    if (!moneyQuery.data) return null;
    return deriveDashboardMetrics(moneyQuery.data, today);
  }, [moneyQuery.data, today]);

  const guarantees = useMemo(() => {
    const clients = clientsQuery.data ?? [];
    const snapshots = analyticsQuery.data?.snapshots ?? [];
    return deriveGuaranteeItems(clients, snapshots, today);
  }, [clientsQuery.data, analyticsQuery.data, today]);

  const pipeline = useMemo(() => {
    if (!clientsQuery.data) return null;
    return derivePipelineCounts(clientsQuery.data);
  }, [clientsQuery.data]);

  const activity = useMemo(() => {
    return deriveRecentActivity({
      clients: clientsQuery.data ?? moneyQuery.data?.clients ?? [],
      payments: moneyQuery.data?.payments ?? [],
      progress: progressQuery.data ?? [],
      leads: leadsQuery.data ?? [],
    });
  }, [clientsQuery.data, moneyQuery.data, progressQuery.data, leadsQuery.data]);

  const alerts = useMemo(() => {
    const integrations = integrationsQuery.data;
    const team = moneyQuery.data
      ? deriveTeam(moneyQuery.data.clients, moneyQuery.data.teamMembers)
      : null;
    return deriveDashboardAlerts({
      overdueCount: metrics?.overdueCount ?? 0,
      overdueTotal: metrics?.overdueTotal ?? 0,
      guarantees,
      discordConfigured: Boolean(integrations?.items.discord.configured),
      discordAgent: integrations?.discordAgent ?? null,
      aiConfigured:
        integrationsQuery.isSuccess || aiQuery.isSuccess
          ? Boolean(integrations?.items.ai.configured || aiQuery.data?.llm)
          : true,
      overloaded: (team?.capacity ?? []).filter((row) => row.overloaded),
      nowMs: Date.now(),
      pendingApprovals: inboxQuery.data?.pendingApprovals ?? 0,
    });
  }, [metrics, guarantees, integrationsQuery.data, integrationsQuery.isSuccess, moneyQuery.data, aiQuery.data, aiQuery.isSuccess, inboxQuery.data]);

  const missingStartDates = (clientsQuery.data ?? []).filter(
    (client) => isActiveClient(client) && !client.startDate,
  ).length;

  const stuckStages = useMemo(() => {
    const clients = clientsQuery.data ?? [];
    const progress = progressQuery.data ?? [];
    return deriveStuckStageCount(
      clients.map((client) => ({
        id: client.id,
        status: client.status,
        deletedAt: client.deletedAt,
        currentStage: client.currentStage,
      })),
      progress,
      today,
    );
  }, [clientsQuery.data, progressQuery.data, today]);

  const youtubeReady = Boolean(analyticsQuery.data?.youtubeDataApi);
  const highlightIntegrations = Boolean(
    integrationsQuery.data && !integrationsQuery.data.items.ai.configured && !aiQuery.data?.llm,
  );

  const pull = useMutation({
    mutationFn: () => pullAnalytics({ data: { clientId: null } }),
    onSuccess: async (result) => {
      const ok = result.results.filter((row) => row.ok).length;
      toast.success(
        ok === 0
          ? "No channels were pulled. Connect a YouTube URL on each client first."
          : `Analytics refreshed for ${ok} client${ok === 1 ? "" : "s"}`,
      );
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const moneyError = moneyQuery.isError;
  const clientsError = clientsQuery.isError;
  const overviewLoading = moneyQuery.isPending && !metrics;

  return (
    <div className="relative mx-auto max-w-6xl">
      <Particles className="opacity-50" quantity={18} />
      <PageHeader
        sparkle
        title="Dashboard"
        description="Agency command center — live roster, collections, pipeline, and the 30-day views guarantee. Nothing here is stored as a rollup."
      />

      <div className="mt-6 flex flex-col gap-4">
        <SectionBoundary title="Alerts">
          <AlertStrip
            alerts={alerts}
            loading={moneyQuery.isPending && integrationsQuery.isPending}
          />
        </SectionBoundary>

        {billingQuery.data?.role === "owner" ? (
          <SectionBoundary title="ClippyOS subscription">
            <SubscriptionTracker snapshot={billingQuery.data} />
          </SectionBoundary>
        ) : null}

        <SectionBoundary title="Overview">
          {moneyError ? (
            <ErrorState
              title="Couldn’t load overview"
              description="Totals couldn’t be calculated. Try again."
              onRetry={() => void moneyQuery.refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total MRR"
                value={formatUsd(metrics?.totalMrr ?? 0)}
                amount={metrics?.totalMrr ?? 0}
                hint="Active clients · monthly fee"
                loading={overviewLoading}
              />
              <MetricCard
                label="Total clients"
                value={String(metrics?.totalClients ?? 0)}
                hint="Active, not churned"
                loading={overviewLoading}
              />
              <MetricCard
                label="Revenue this month"
                value={formatUsd(metrics?.revenueThisMonth ?? 0)}
                amount={metrics?.revenueThisMonth ?? 0}
                hint="Paid invoices dated this month"
                tone="success"
                loading={overviewLoading}
              />
              <MetricCard
                label="Outstanding payments"
                value={formatUsd(metrics?.outstanding ?? 0)}
                amount={metrics?.outstanding ?? 0}
                hint="Pending and overdue"
                tone={metrics && metrics.outstanding > 0 ? "danger" : "default"}
                loading={overviewLoading}
              />
              <MetricCard
                label="Clients at risk"
                value={String(metrics?.clientsAtRisk ?? 0)}
                hint="Day 25+ on the 30-day guarantee"
                tone={metrics && metrics.clientsAtRisk > 0 ? "danger" : "default"}
                loading={overviewLoading}
              />
            </div>
          )}
        </SectionBoundary>

        <SectionBoundary title="Quick actions">
          <QuickActions
            onAddClient={() => setAddOpen(true)}
            onRefreshAnalytics={() => pull.mutate()}
            refreshing={pull.isPending}
            youtubeReady={youtubeReady}
            highlightIntegrations={highlightIntegrations}
          />
        </SectionBoundary>

        <SectionBoundary title="Automation">
          <AutomationWidget
            atRisk={metrics?.clientsAtRisk ?? 0}
            overdueCount={metrics?.overdueCount ?? 0}
            stuckStages={stuckStages}
          />
        </SectionBoundary>

        <SectionBoundary title="Production pipeline">
          <PipelineSummary
            counts={pipeline}
            filter={stageFilter}
            onFilter={setStageFilter}
            loading={clientsQuery.isPending}
          />
        </SectionBoundary>

        <SectionBoundary title="Client stages">
          <div>
            <h2 className="mb-3 text-section font-semibold tracking-tight">
              Client stages
            </h2>
            <p className="mb-3 text-caption text-muted">
              Discord Status Agent is read-only and runs automatically about every
              30 minutes. It matches Discord server names to client names and
              updates production stages.
            </p>
            {clientsError ? (
              <ErrorState
                title="Couldn’t load clients"
                description="Stage cards need the live roster. Try again."
                onRetry={() => void clientsQuery.refetch()}
              />
            ) : (
              <ClientStageCards
                clients={clientsQuery.data ?? []}
                loading={clientsQuery.isPending}
                filter={stageFilter}
              />
            )}
          </div>
        </SectionBoundary>

        <SectionBoundary title="30-day guarantee">
          <DailyObjectives
            items={guarantees}
            missingStartDates={missingStartDates}
            loading={clientsQuery.isPending}
          />
        </SectionBoundary>

        <SectionBoundary title="Recent activity">
          {leadsQuery.isError && progressQuery.isError ? (
            <ErrorState
              title="Couldn’t load activity"
              description="Payments, stages, and leads couldn’t be combined. Try again."
              onRetry={() => {
                void leadsQuery.refetch();
                void progressQuery.refetch();
              }}
            />
          ) : (
            <RecentActivity
              items={activity}
              loading={
                (clientsQuery.isPending || moneyQuery.isPending) &&
                activity.length === 0
              }
            />
          )}
        </SectionBoundary>
      </div>

      <ClientFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        client={null}
        aiReady={Boolean(aiQuery.data?.llm)}
        onSaved={(id) => {
          setAddOpen(false);
          void queryClient.invalidateQueries({ queryKey: ["clients"] });
          void queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
          void navigate({ to: "/clients/$clientId", params: { clientId: id } });
        }}
      />
    </div>
  );
}
