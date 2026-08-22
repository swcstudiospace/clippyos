import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMoneySnapshot } from "@/lib/server/money";
import { MONEY_QUERY_KEY } from "@/lib/money";
import { deriveTeam } from "@/lib/team";
import { formatUsd } from "@/lib/format";
import { CAPACITY_OVERLOAD_THRESHOLD } from "@/lib/constants";
import { AllocationLanes } from "@/components/team/allocation-lanes";
import { CapacityTracker } from "@/components/team/capacity-tracker";
import { MetricCard } from "@/components/money/metric-card";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
});

function TeamPage() {
  const snapshotQuery = useQuery({
    queryKey: MONEY_QUERY_KEY,
    queryFn: () => getMoneySnapshot(),
  });
  const derived = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return deriveTeam(snapshotQuery.data.clients, snapshotQuery.data.teamMembers);
  }, [snapshotQuery.data]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Team"
        description={`Allocation by client and capacity by person. Overloaded means more than ${CAPACITY_OVERLOAD_THRESHOLD} active clients.`}
      />

      {snapshotQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load team"
            description="Assignments couldn’t be read. Try again."
            onRetry={() => void snapshotQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Overview">
            {snapshotQuery.isPending || !derived ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Team cost"
                  value={formatUsd(derived.overallCost)}
                  amount={derived.overallCost}
                  hint="Sum of active-client lanes"
                />
                <MetricCard
                  label="People assigned"
                  value={String(derived.assignedPeople)}
                  hint="Unique names on active clients"
                />
                <MetricCard
                  label="Overloaded"
                  value={String(derived.overloadedCount)}
                  hint={`Over ${CAPACITY_OVERLOAD_THRESHOLD} clients`}
                  tone={derived.overloadedCount > 0 ? "danger" : "default"}
                />
              </div>
            )}
          </SectionBoundary>

          <SectionBoundary title="Capacity">
            <CapacityTracker
              rows={derived?.capacity ?? []}
              loading={snapshotQuery.isPending}
            />
          </SectionBoundary>

          <SectionBoundary title="Allocation lanes">
            <AllocationLanes
              lanes={derived?.lanes ?? []}
              loading={snapshotQuery.isPending}
            />
          </SectionBoundary>
        </div>
      )}
    </div>
  );
}
