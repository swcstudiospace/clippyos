import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMoneySnapshot } from "@/lib/server/money";
import {
  MONEY_PERIODS,
  MONEY_PERIOD_LABELS,
  MONEY_QUERY_KEY,
  deriveMoney,
  type MoneyPeriod,
} from "@/lib/money";
import { formatPercent, formatUsd, todayIsoDate } from "@/lib/format";
import { MetricCard, MetricCardRowSkeleton } from "@/components/money/metric-card";
import { MrrBreakdown } from "@/components/money/mrr-breakdown";
import { PaymentTracker } from "@/components/money/payment-tracker";
import { CostProfit } from "@/components/money/cost-profit";
import { MoneyCharts } from "@/components/money/charts";
import { FilterChip } from "@/components/money/filter-chip";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_app/money")({
  component: MoneyPage,
});

function MoneyPage() {
  const [period, setPeriod] = useState<MoneyPeriod>("all");
  const snapshotQuery = useQuery({
    queryKey: MONEY_QUERY_KEY,
    queryFn: () => getMoneySnapshot(),
  });
  const today = todayIsoDate();
  const derived = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return deriveMoney(snapshotQuery.data, period, today);
  }, [snapshotQuery.data, period, today]);

  const loading = snapshotQuery.isPending;
  const profitTone =
    !derived || derived.overallProfit === 0
      ? "default"
      : derived.overallProfit > 0
        ? "success"
        : "danger";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Money"
        description="Live totals from clients, payments, and team costs — nothing is stored as a rollup."
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Reporting period">
            {MONEY_PERIODS.map((value) => (
              <FilterChip
                key={value}
                label={MONEY_PERIOD_LABELS[value]}
                active={period === value}
                onClick={() => setPeriod(value)}
              />
            ))}
          </div>
        }
      />

      {snapshotQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load money"
            description="Workspace totals couldn’t be calculated. Try again."
            onRetry={() => void snapshotQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Revenue overview">
            {loading || !derived ? (
              <MetricCardRowSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total Revenue"
                  value={formatUsd(derived.totalRevenue)}
                  amount={derived.totalRevenue}
                  hint={MONEY_PERIOD_LABELS[period]}
                />
                <MetricCard
                  label="Current MRR"
                  value={formatUsd(derived.currentMrr)}
                  amount={derived.currentMrr}
                  hint="Active clients · monthly recurring"
                />
                <MetricCard
                  label="Projected Annual"
                  value={formatUsd(derived.projectedAnnual)}
                  amount={derived.projectedAnnual}
                  hint="Current MRR × 12"
                />
                <MetricCard
                  label="Overall Profit"
                  value={formatUsd(derived.overallProfit)}
                  amount={derived.overallProfit}
                  hint={
                    derived.overallMarginPct == null
                      ? "Monthly · active roster"
                      : `${formatPercent(derived.overallMarginPct, 0)} margin`
                  }
                  tone={profitTone}
                />
              </div>
            )}
          </SectionBoundary>

          <SectionBoundary title="MRR Breakdown">
            <MrrBreakdown
              rows={derived?.mrrRows ?? []}
              total={derived?.currentMrr ?? 0}
              loading={loading}
            />
          </SectionBoundary>

          <SectionBoundary title="Payment Tracker">
            <PaymentTracker rows={derived?.paymentRows ?? []} loading={loading} />
          </SectionBoundary>

          <SectionBoundary title="Cost & Profit">
            <CostProfit
              rows={derived?.profitRows ?? []}
              teamCost={derived?.overallTeamCost ?? 0}
              revenue={derived?.currentMrr ?? 0}
              profit={derived?.overallProfit ?? 0}
              marginPct={derived?.overallMarginPct ?? null}
              loading={loading}
            />
          </SectionBoundary>

          <MoneyCharts derived={derived} loading={loading} />
        </div>
      )}
    </div>
  );
}
