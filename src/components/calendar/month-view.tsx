import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaymentTrackerRow } from "@/lib/money";
import {
  WEEKDAY_LABELS,
  cashCollected,
  groupPaymentsByDueDate,
  markerTone,
  monthGrid,
  monthTitle,
  paymentsForMonth,
  shiftMonth,
} from "@/lib/calendar";
import { MARK_COLLECTED_CONFIRM_THRESHOLD } from "@/lib/constants";
import { monthKey } from "@/lib/money";
import { formatUsd } from "@/lib/format";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import { useMarkPaymentPaid } from "@/lib/use-mark-payment-paid";
import type { Payment } from "@/lib/entities";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/money/filter-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { MetricCard } from "@/components/money/metric-card";
import { cn } from "@/lib/utils";

export function CalendarMonthView({
  payments,
  rows,
  today,
  loading,
}: {
  payments: Payment[];
  rows: PaymentTrackerRow[];
  today: string;
  loading: boolean;
}) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const [cursor, setCursor] = useState({
    year: todayDate.getUTCFullYear(),
    month: todayDate.getUTCMonth() + 1,
  });
  const [scope, setScope] = useState<"month" | "all">("month");
  const [pending, setPending] = useState<PaymentTrackerRow | null>(null);
  const [daySheet, setDaySheet] = useState<string | null>(null);
  const paidMut = useMarkPaymentPaid("calendar-mark-paid");

  const viewedKey = `${cursor.year}-${String(cursor.month).padStart(2, "0")}`;
  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month, today),
    [cursor.year, cursor.month, today],
  );
  const monthRows = useMemo(
    () => paymentsForMonth(rows, cursor.year, cursor.month),
    [rows, cursor.year, cursor.month],
  );
  const grouped = useMemo(() => groupPaymentsByDueDate(monthRows), [monthRows]);
  const collected = cashCollected(
    payments,
    scope,
    scope === "month" ? viewedKey : monthKey(today),
  );
  const viewingCurrent =
    cursor.year === todayDate.getUTCFullYear() &&
    cursor.month === todayDate.getUTCMonth() + 1;

  function requestCollect(row: PaymentTrackerRow) {
    if (row.displayStatus === "PAID") return;
    if (row.amount >= MARK_COLLECTED_CONFIRM_THRESHOLD) {
      setPending(row);
      return;
    }
    paidMut.mutate(row.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 grid gap-3 sm:static sm:grid-cols-2">
        <MetricCard
          label="Cash collected"
          value={formatUsd(collected)}
          amount={collected}
          hint={
            scope === "all"
              ? "All-time paid invoices"
              : `Paid in ${monthTitle(cursor.year, cursor.month)}`
          }
          loading={loading}
          tone="success"
        />
        <GlassCard className="flex flex-col justify-center gap-3">
          <p className="text-caption text-muted">Collection window</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cash collected range">
            <FilterChip
              label={monthTitle(cursor.year, cursor.month)}
              active={scope === "month"}
              onClick={() => setScope("month")}
            />
            <FilterChip
              label="All time"
              active={scope === "all"}
              onClick={() => setScope("all")}
            />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCursor((value) => shiftMonth(value.year, value.month, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="min-w-36 flex-1 text-center text-card font-semibold tracking-tight sm:flex-none">
              {monthTitle(cursor.year, cursor.month)}
            </h2>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next month"
              onClick={() => setCursor((value) => shiftMonth(value.year, value.month, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            className="w-full sm:w-auto"
            variant={viewingCurrent ? "ghost" : "secondary"}
            disabled={viewingCurrent}
            onClick={() =>
              setCursor({
                year: todayDate.getUTCFullYear(),
                month: todayDate.getUTCMonth() + 1,
              })
            }
          >
            Today
          </Button>
        </div>

        <div className="grid grid-cols-7 border-t border-border text-center text-caption text-muted">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-1 py-2">
              <span className="sm:hidden">
                <span aria-hidden="true">{label.slice(0, 1)}</span>
                <span className="sr-only">{label}</span>
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 border-t border-border">
            {Array.from({ length: 35 }, (_, index) => (
              <div key={index} className="min-h-24 border-border p-2 not-first:border-l [&:nth-child(n+8)]:border-t">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 border-t border-border">
            {cells.map((cell, index) => {
              const dayRows = cell.iso ? grouped.get(cell.iso) ?? [] : [];
              const visible = dayRows.slice(0, 2);
              const extra = dayRows.length - visible.length;
              const CellTag = cell.inMonth ? "button" : "div";
              return (
                <CellTag
                  key={`${cell.iso}-${index}`}
                  type={cell.inMonth ? "button" : undefined}
                  onClick={
                    cell.inMonth && cell.iso
                      ? () => setDaySheet(cell.iso)
                      : undefined
                  }
                  className={cn(
                    "min-h-11 border-border p-1.5 text-left sm:min-h-28 sm:p-2",
                    index % 7 !== 0 && "border-l",
                    index >= 7 && "border-t",
                    cell.isToday && "bg-accent/8 motion-safe:animate-pulse-glow",
                    !cell.inMonth && "bg-secondary-surface/20",
                    cell.inMonth && "hover:bg-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                >
                  {cell.inMonth ? (
                    <>
                      <p
                        className={cn(
                          "text-caption tabular-nums",
                          cell.isToday
                            ? "font-semibold text-accent"
                            : "text-muted",
                        )}
                      >
                        <span className="sr-only">
                          {cell.isToday ? "Today, " : ""}
                          {cell.iso}
                        </span>
                        {cell.day}
                      </p>
                      <ul className="mt-1 hidden flex-col gap-1 md:flex">
                        {visible.map((row) => (
                          <li key={row.id}>
                            <MarkerButton
                              row={row}
                              busy={paidMut.isPending && paidMut.variables === row.id}
                              onCollect={() => requestCollect(row)}
                            />
                          </li>
                        ))}
                        {extra > 0 ? (
                          <li className="text-caption text-muted">+{extra} more</li>
                        ) : null}
                      </ul>
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden" aria-hidden="true">
                        {dayRows.slice(0, 4).map((row) => (
                          <span
                            key={row.id}
                            className={cn(
                              "size-2 rounded-full",
                              markerTone(row.displayStatus) === "green" && "bg-success",
                              markerTone(row.displayStatus) === "orange" && "bg-warning",
                              markerTone(row.displayStatus) === "red" && "bg-danger",
                            )}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </CellTag>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="md:hidden">
        <h2 className="text-card font-semibold tracking-tight">This month’s payments</h2>
        <p className="mt-1 text-caption text-muted">
          Tap a pending or overdue row to mark it collected.
        </p>
        {loading ? (
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : monthRows.length === 0 ? (
          <p className="mt-4 text-body text-muted">No invoices due this month.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {monthRows.map((row) => (
              <li key={row.id}>
                <AgendaRow
                  row={row}
                  busy={paidMut.isPending && paidMut.variables === row.id}
                  onCollect={() => requestCollect(row)}
                />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <div className="hidden md:block">
        {loading ? null : monthRows.length === 0 ? (
          <EmptyState
            title="No invoices this month"
            description="Payments appear on the day they are due. Mark collected turns the marker green and adds to cash collected."
          />
        ) : (
          <GlassCard>
            <h2 className="text-card font-semibold tracking-tight">Agenda</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {monthRows.map((row) => (
                <li key={row.id}>
                  <AgendaRow
                    row={row}
                    busy={paidMut.isPending && paidMut.variables === row.id}
                    onCollect={() => requestCollect(row)}
                  />
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>

      <Sheet open={Boolean(daySheet)} onOpenChange={(open) => !open && setDaySheet(null)}>
        <SheetContent side="bottom" className="md:max-w-lg md:mx-auto">
          <SheetTitle>{daySheet ? `Payments on ${daySheet}` : "Payments"}</SheetTitle>
          <SheetDescription>
            Tap an unpaid invoice to mark it collected. Same action as Money.
          </SheetDescription>
          <ul className="mt-4 flex flex-col gap-2">
            {(daySheet ? grouped.get(daySheet) ?? [] : []).length === 0 ? (
              <li className="text-body text-muted">No invoices due this day.</li>
            ) : (
              (grouped.get(daySheet ?? "") ?? []).map((row) => (
                <li key={row.id}>
                  <AgendaRow
                    row={row}
                    busy={paidMut.isPending && paidMut.variables === row.id}
                    onCollect={() => {
                      setDaySheet(null);
                      requestCollect(row);
                    }}
                  />
                </li>
              ))
            )}
          </ul>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogTitle>Mark as collected?</DialogTitle>
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
              Mark collected
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarkerButton({
  row,
  busy,
  onCollect,
}: {
  row: PaymentTrackerRow;
  busy: boolean;
  onCollect: () => void;
}) {
  const tone = markerTone(row.displayStatus);
  const paid = row.displayStatus === "PAID";
  return (
    <button
      type="button"
      disabled={paid || busy}
      onClick={onCollect}
      className={cn(
        "flex min-h-11 w-full flex-col items-start rounded-control px-2 py-1.5 text-left text-caption leading-tight transition-[background-color,transform] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:not-disabled:scale-[0.98]",
        tone === "green" && "bg-success/15 text-success",
        tone === "orange" && "bg-warning/15 text-warning",
        tone === "red" && "bg-danger/15 text-danger",
      )}
      aria-label={
        paid
          ? `Collected ${formatUsd(row.amount)} from ${row.clientName}`
          : `Mark ${formatUsd(row.amount)} from ${row.clientName} as collected`
      }
    >
      <span className="w-full truncate font-medium">{row.clientName}</span>
      <span className="tabular-nums">{formatUsd(row.amount)}</span>
    </button>
  );
}

function AgendaRow({
  row,
  busy,
  onCollect,
}: {
  row: PaymentTrackerRow;
  busy: boolean;
  onCollect: () => void;
}) {
  const paid = row.displayStatus === "PAID";
  return (
    <div className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.clientName}</p>
        <p className="text-caption text-muted">
          {row.dueDate} · {PAYMENT_TYPE_LABELS[row.type]} · {formatUsd(row.amount)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={statusTone(row.displayStatus)}>
          {row.displayStatus === "PAID" ? "Collected" : row.displayStatus === "OVERDUE" ? "Overdue" : "Pending"}
        </Badge>
        {paid ? null : (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onCollect}
            aria-label={`Mark ${row.clientName} ${formatUsd(row.amount)} as collected`}
          >
            {busy ? "Saving…" : "Mark collected"}
          </Button>
        )}
      </div>
    </div>
  );
}
