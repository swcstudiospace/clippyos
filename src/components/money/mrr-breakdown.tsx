import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { MrrBreakdownRow } from "@/lib/money";
import { formatUsd } from "@/lib/format";
import { PLAN_LABELS, PLAN_TONES } from "@/lib/labels";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SortKey = "name" | "fee";
type SortDir = "asc" | "desc";

export function MrrBreakdown({
  rows,
  total,
  loading,
}: {
  rows: MrrBreakdownRow[];
  total: number;
  loading: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : a.monthlyFee - b.monthlyFee;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggle(next: SortKey) {
    if (sortKey === next) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir(next === "fee" ? "desc" : "asc");
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-end justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-card font-semibold tracking-tight">MRR Breakdown</h2>
          <p className="mt-1 text-caption text-muted">Active clients only</p>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-body text-muted">
          No active clients. Add an active client to see contracted monthly
          recurring revenue.
        </p>
      ) : (
        <>
        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full min-w-full text-left">
            <caption className="sr-only">
              Monthly recurring revenue by active client
            </caption>
            <thead>
              <tr className="border-y border-border text-caption text-muted">
                <th scope="col" className="px-3">
                  <SortHeader
                    label="Client"
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggle("name")}
                  />
                </th>
                <th scope="col" className="px-3">
                  Plan
                </th>
                <th scope="col" className="px-3">
                  <SortHeader
                    label="Monthly fee"
                    active={sortKey === "fee"}
                    dir={sortDir}
                    onClick={() => toggle("fee")}
                  />
                </th>
                <th scope="col" className="px-3">
                  Setup fee
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.clientId} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: row.clientId }}
                      className="inline-flex min-h-11 items-center font-medium text-fg hover:text-accent"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={PLAN_TONES[row.planType]}>
                      {PLAN_LABELS[row.planType]}
                      {row.planType === "CUSTOM" && row.customPlanLabel
                        ? ` · ${row.customPlanLabel}`
                        : ""}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.monthlyFee)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={row.setup.tone}>{row.setup.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-body font-semibold">
                <td className="px-3 py-4" colSpan={2}>
                  Current MRR
                </td>
                <td className="px-3 py-4 tabular-nums">{formatUsd(total)}</td>
                <td className="px-3 py-4" />
              </tr>
            </tfoot>
          </table>
        </div>
        <ul className="mt-3 flex flex-col gap-2 px-5 pb-5 md:hidden">
          {sorted.map((row) => (
            <li key={row.clientId} className="rounded-control bg-secondary-surface/50 px-3 py-3">
              <Link
                to="/clients/$clientId"
                params={{ clientId: row.clientId }}
                className="flex min-h-11 items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.name}</span>
                  <span className="text-caption text-muted">
                    {PLAN_LABELS[row.planType]} · {row.setup.label}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatUsd(row.monthlyFee)}</span>
              </Link>
            </li>
          ))}
          <li className="flex justify-between px-1 pt-1 font-semibold">
            <span>Current MRR</span>
            <span className="tabular-nums">{formatUsd(total)}</span>
          </li>
        </ul>
        </>
      )}
    </GlassCard>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-1 font-medium",
        active ? "text-fg" : "text-muted",
      )}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        )
      ) : null}
    </button>
  );
}
