import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { type PaymentTrackerRow } from "@/lib/money";
import { formatDate, formatUsd } from "@/lib/format";
import { PAYMENT_STATUS_LABELS, PAYMENT_TYPE_LABELS } from "@/lib/labels";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChip } from "@/components/money/filter-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMarkPaymentPaid } from "@/lib/use-mark-payment-paid";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "OVERDUE" | "PENDING" | "PAID";
type SortKey = "name" | "amount" | "dueDate" | "status";
type SortDir = "asc" | "desc";

const STATUS_RANK: Record<PaymentTrackerRow["displayStatus"], number> = {
  OVERDUE: 0,
  PENDING: 1,
  PAID: 2,
};

export function PaymentTracker({
  rows,
  loading,
}: {
  rows: PaymentTrackerRow[];
  loading: boolean;
}) {
  const paidMut = useMarkPaymentPaid("money-mark-paid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pending, setPending] = useState<PaymentTrackerRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const copy = rows.filter((row) => {
      if (status !== "ALL" && row.displayStatus !== status) return false;
      if (!q) return true;
      return row.clientName.toLowerCase().includes(q);
    });
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.clientName.localeCompare(b.clientName);
      else if (sortKey === "amount") cmp = a.amount - b.amount;
      else if (sortKey === "dueDate") cmp = a.dueDate.localeCompare(b.dueDate);
      else cmp = STATUS_RANK[a.displayStatus] - STATUS_RANK[b.displayStatus];
      if (cmp === 0) cmp = a.dueDate.localeCompare(b.dueDate);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, search, status, sortKey, sortDir]);

  function toggle(next: SortKey) {
    if (sortKey === next) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir("asc");
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-card font-semibold tracking-tight">Payment Tracker</h2>
        <p className="mt-1 text-caption text-muted">
          Status is derived live. Overdue means still unpaid after the due date.
        </p>
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client…"
            aria-label="Search payments by client"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["ALL", "OVERDUE", "PENDING", "PAID"] as const).map((value) => (
            <FilterChip
              key={value}
              label={value === "ALL" ? "All" : PAYMENT_STATUS_LABELS[value]}
              active={status === value}
              onClick={() => setStatus(value)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-body text-muted">No payments yet</p>
      ) : filtered.length === 0 ? (
        <p className="px-5 py-8 text-body text-muted">No matching payments.</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2 px-5 pb-5 md:hidden">
            {filtered.map((row) => (
              <li
                key={row.id}
                className="rounded-control bg-secondary-surface/50 px-3 py-3"
              >
                <PaymentRow
                  row={row}
                  busy={paidMut.isPending && paidMut.variables === row.id}
                  onPay={() => setPending(row)}
                  compact
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-full text-left">
              <caption className="sr-only">Client payments and collection status</caption>
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
                    Type
                  </th>
                  <th scope="col" className="px-3">
                    <SortHeader
                      label="Amount"
                      active={sortKey === "amount"}
                      dir={sortDir}
                      onClick={() => toggle("amount")}
                    />
                  </th>
                  <th scope="col" className="px-3">
                    <SortHeader
                      label="Due"
                      active={sortKey === "dueDate"}
                      dir={sortDir}
                      onClick={() => toggle("dueDate")}
                    />
                  </th>
                  <th scope="col" className="px-3">
                    <SortHeader
                      label="Status"
                      active={sortKey === "status"}
                      dir={sortDir}
                      onClick={() => toggle("status")}
                    />
                  </th>
                  <th scope="col" className="px-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <PaymentRow
                      row={row}
                      busy={paidMut.isPending && paidMut.variables === row.id}
                      onPay={() => setPending(row)}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogTitle>Mark as paid?</DialogTitle>
          <DialogDescription>
            {pending
              ? `Record ${formatUsd(pending.amount)} from ${pending.clientName} as paid today. Amount, due date, and type stay the same.`
              : null}
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              disabled={!pending || paidMut.isPending}
              onClick={() => {
                if (!pending) return;
                const id = pending.id;
                setPending(null);
                paidMut.mutate(id);
              }}
            >
              Mark as paid
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

function PaymentRow({
  row,
  busy,
  onPay,
  compact = false,
}: {
  row: PaymentTrackerRow;
  busy: boolean;
  onPay: () => void;
  compact?: boolean;
}) {
  const action =
    row.displayStatus === "PAID" ? null : (
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={onPay}
        aria-label={`Mark ${row.clientName} ${formatUsd(row.amount)} as paid`}
      >
        {busy ? "Saving…" : "Mark as Paid"}
      </Button>
    );

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/clients/$clientId"
              params={{ clientId: row.clientId }}
              className="font-medium text-fg hover:text-accent"
            >
              {row.clientName}
            </Link>
            <p className="text-caption text-muted">
              {PAYMENT_TYPE_LABELS[row.type]} · Due {formatDate(row.dueDate)}
            </p>
          </div>
          <p className="tabular-nums">{formatUsd(row.amount)}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge tone={statusTone(row.displayStatus)}>
            {PAYMENT_STATUS_LABELS[row.displayStatus]}
          </Badge>
          {action}
        </div>
      </div>
    );
  }

  return (
    <>
      <td className="px-3 py-2">
        <Link
          to="/clients/$clientId"
          params={{ clientId: row.clientId }}
          className="inline-flex min-h-11 items-center font-medium text-fg hover:text-accent"
        >
          {row.clientName}
        </Link>
      </td>
      <td className="px-3 py-2 text-caption text-muted">
        {PAYMENT_TYPE_LABELS[row.type]}
      </td>
      <td className="px-3 py-2 tabular-nums">{formatUsd(row.amount)}</td>
      <td className="px-3 py-2 text-caption">{formatDate(row.dueDate)}</td>
      <td className="px-3 py-2">
        <Badge tone={statusTone(row.displayStatus)}>
          {PAYMENT_STATUS_LABELS[row.displayStatus]}
        </Badge>
      </td>
      <td className="px-5 py-2 text-right">{action}</td>
    </>
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
