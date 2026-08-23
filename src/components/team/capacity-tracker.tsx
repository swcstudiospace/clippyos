import type { CapacityRow } from "@/lib/team";
import { CAPACITY_OVERLOAD_THRESHOLD } from "@/lib/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function CapacityTracker({
  rows,
  loading,
  aiActiveCount = 0,
}: {
  rows: CapacityRow[];
  loading: boolean;
  aiActiveCount?: number;
}) {
  if (loading) {
    return (
      <GlassCard>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-full" />
      </GlassCard>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Capacity tracker"
        description={`No one is assigned yet. Overloaded means more than ${CAPACITY_OVERLOAD_THRESHOLD} active clients.`}
      />
    );
  }

  return (
    <GlassCard>
      <h2 className="text-card font-semibold tracking-tight">Capacity tracker</h2>
      <p className="mt-1 text-caption text-muted">
        People are grouped by name across active clients. Overloaded means more
        than {CAPACITY_OVERLOAD_THRESHOLD} clients. AI teammates: {aiActiveCount} active — not counted in load.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{row.name}</p>
              <p className="text-caption text-muted">
                {row.clientNames.join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-body">
                {row.clientCount} client{row.clientCount === 1 ? "" : "s"}
              </span>
              {row.overloaded ? (
                <Badge tone={row.clientCount > CAPACITY_OVERLOAD_THRESHOLD + 1 ? "red" : "orange"}>
                  Overloaded
                </Badge>
              ) : (
                <Badge tone="green">Healthy</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
