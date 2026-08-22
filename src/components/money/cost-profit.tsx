import { Link } from "@tanstack/react-router";
import type { ProfitRow } from "@/lib/money";
import { formatPercent, formatUsd } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CostProfit({
  rows,
  teamCost,
  revenue,
  profit,
  marginPct,
  loading,
}: {
  rows: ProfitRow[];
  teamCost: number;
  revenue: number;
  profit: number;
  marginPct: number | null;
  loading: boolean;
}) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-card font-semibold tracking-tight">Cost & Profit</h2>
        <p className="mt-1 text-caption text-muted">
          Profit is monthly fee minus assigned team cost. Missing team rows count as
          $0. Soft-deleted members are excluded.
        </p>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-body text-muted">
          No active clients to measure yet.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-full text-left">
            <caption className="sr-only">Per-client cost, revenue, and margin</caption>
            <thead>
              <tr className="border-y border-border text-caption text-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  Client
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Team cost
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Revenue
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Profit
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.clientId} className="border-b border-border">
                  <td className="px-3 py-2">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: row.clientId }}
                      className="inline-flex min-h-11 items-center font-medium text-fg hover:text-accent"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatUsd(row.teamCost)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatUsd(row.revenue)}</td>
                  <td className={cn("px-3 py-2 tabular-nums", signedTone(row.profit))}>
                    {formatUsd(row.profit)}
                  </td>
                  <td className={cn("px-5 py-2 tabular-nums", signedTone(row.profit))}>
                    {row.marginPct == null ? "—" : formatPercent(row.marginPct, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-body font-semibold">
                <td className="px-3 py-4">Agency total</td>
                <td className="px-3 py-4 tabular-nums">{formatUsd(teamCost)}</td>
                <td className="px-3 py-4 tabular-nums">{formatUsd(revenue)}</td>
                <td className={cn("px-3 py-4 tabular-nums", signedTone(profit))}>
                  {formatUsd(profit)}
                </td>
                <td className={cn("px-5 py-4 tabular-nums", signedTone(profit))}>
                  {marginPct == null ? "—" : formatPercent(marginPct, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function signedTone(value: number): string {
  if (value < 0) return "text-danger";
  if (value > 0) return "text-success";
  return "";
}
