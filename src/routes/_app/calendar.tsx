import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMoneySnapshot } from "@/lib/server/money";
import { MONEY_QUERY_KEY, deriveMoney } from "@/lib/money";
import { todayIsoDate } from "@/lib/format";
import { CalendarMonthView } from "@/components/calendar/month-view";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const today = todayIsoDate();
  const snapshotQuery = useQuery({
    queryKey: MONEY_QUERY_KEY,
    queryFn: () => getMoneySnapshot(),
  });
  const derived = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return deriveMoney(snapshotQuery.data, "all", today);
  }, [snapshotQuery.data, today]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendar"
        description="Monthly collection tracker. Mark collected uses the same paid mutation as Money — markers turn green immediately."
      />
      <div className="mt-6">
        {snapshotQuery.isError ? (
          <ErrorState
            title="Couldn’t load the calendar"
            description="Payment due dates couldn’t be read. Try again."
            onRetry={() => void snapshotQuery.refetch()}
          />
        ) : (
          <SectionBoundary title="Payment calendar">
            <CalendarMonthView
              payments={snapshotQuery.data?.payments ?? []}
              rows={derived?.paymentRows ?? []}
              today={today}
              loading={snapshotQuery.isPending}
            />
          </SectionBoundary>
        )}
      </div>
    </div>
  );
}
