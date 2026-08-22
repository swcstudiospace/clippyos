import {
  asMoney,
  monthKey,
  type DisplayPaymentStatus,
  type PaymentTrackerRow,
} from "@/lib/money";
import type { Payment } from "@/lib/entities";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthTitle(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function monthGrid(
  year: number,
  month: number,
  today: string,
): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ iso: "", day: 0, inMonth: false, isToday: false });
  }
  for (let day = 1; day <= days; day += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day, inMonth: true, isToday: iso === today });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: "", day: 0, inMonth: false, isToday: false });
  }
  return cells;
}

export function paymentsForMonth(
  payments: PaymentTrackerRow[],
  year: number,
  month: number,
): PaymentTrackerRow[] {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  return payments.filter((row) => monthKey(row.dueDate) === key);
}

export function groupPaymentsByDueDate(
  rows: PaymentTrackerRow[],
): Map<string, PaymentTrackerRow[]> {
  const map = new Map<string, PaymentTrackerRow[]>();
  for (const row of rows) {
    const list = map.get(row.dueDate) ?? [];
    list.push(row);
    map.set(row.dueDate, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const rank = (status: DisplayPaymentStatus) =>
        status === "OVERDUE" ? 0 : status === "PENDING" ? 1 : 2;
      const byStatus = rank(a.displayStatus) - rank(b.displayStatus);
      if (byStatus !== 0) return byStatus;
      return a.clientName.localeCompare(b.clientName);
    });
  }
  return map;
}

export function cashCollected(
  payments: Payment[],
  scope: "month" | "all",
  month: string,
): number {
  let total = 0;
  for (const payment of payments) {
    if (payment.status !== "PAID" || !payment.paidDate) continue;
    if (scope === "month" && monthKey(payment.paidDate) !== month) continue;
    total += asMoney(payment.amount);
  }
  return total;
}

export function markerTone(
  status: DisplayPaymentStatus,
): "green" | "orange" | "red" {
  if (status === "PAID") return "green";
  if (status === "OVERDUE") return "red";
  return "orange";
}
