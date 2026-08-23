/** Live finance derivations. Never store these totals — always compute from entities. */

import type {
  Client,
  Payment,
  PaymentStatus,
  PlanType,
  TeamMember,
} from "./entities.ts";
import { addDaysIso, addMonthsIso } from "./format.ts";

export const MONEY_PERIODS = ["all", "ytd", "12m", "90d"] as const;
export type MoneyPeriod = (typeof MONEY_PERIODS)[number];

export const MONEY_PERIOD_LABELS: Record<MoneyPeriod, string> = {
  all: "All time",
  ytd: "This year",
  "12m": "12 months",
  "90d": "Last 90 days",
};

export type DisplayPaymentStatus = Extract<
  PaymentStatus,
  "PAID" | "PENDING" | "OVERDUE"
>;

export type SetupFeeDisplay = {
  label: "Paid" | "Outstanding";
  tone: "green" | "orange" | "red";
};

export type MoneySnapshot = {
  clients: Client[];
  payments: Payment[];
  teamMembers: TeamMember[];
  includeAutomationCostInMargin?: boolean;
};

export type MrrBreakdownRow = {
  clientId: string;
  name: string;
  planType: PlanType;
  customPlanLabel: string | null;
  monthlyFee: number;
  setup: SetupFeeDisplay;
};

export type PaymentTrackerRow = {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: Payment["type"];
  dueDate: string;
  paidDate: string | null;
  storedStatus: PaymentStatus;
  displayStatus: DisplayPaymentStatus;
};

export type ProfitRow = {
  clientId: string;
  name: string;
  teamCost: number;
  revenue: number;
  profit: number;
  marginPct: number | null;
};

export type MonthBucket = {
  key: string;
  label: string;
  collectedMonthly: number;
  contractedMrr: number;
  collectedAll: number;
  teamCosts: number;
  dueAmount: number;
  paidTowardDue: number;
  collectionRate: number;
};

export type MoneyDerived = {
  currentMrr: number;
  projectedAnnual: number;
  totalRevenue: number;
  overallTeamCost: number;
  overallProfit: number;
  overallMarginPct: number | null;
  collectionPaid: number;
  collectionDue: number;
  collectionRate: number;
  mrrRows: MrrBreakdownRow[];
  paymentRows: PaymentTrackerRow[];
  profitRows: ProfitRow[];
  months: MonthBucket[];
  hasMrrGrowth: boolean;
  hasRevenueVsCosts: boolean;
  hasCollectionHistory: boolean;
};

/** Stored monetary fields are never negative; missing / NaN / Infinity → 0. */
export function asMoney(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export function isActiveClient(client: Pick<Client, "status" | "deletedAt">): boolean {
  return client.status === "ACTIVE" && client.deletedAt == null;
}

export function displayPaymentStatus(
  payment: Payment,
  today: string,
): DisplayPaymentStatus {
  if (payment.status === "PAID") return "PAID";
  if (payment.status === "OVERDUE") return "OVERDUE";
  if (payment.dueDate < today) return "OVERDUE";
  return "PENDING";
}

export function setupFeeStatus(
  client: Client,
  payments: Payment[],
  today: string,
): SetupFeeDisplay {
  const setups = payments.filter(
    (payment) => payment.clientId === client.id && payment.type === "SETUP",
  );
  if (setups.some((payment) => payment.status === "PAID")) {
    return { label: "Paid", tone: "green" };
  }
  const overdue = setups.some(
    (payment) => displayPaymentStatus(payment, today) === "OVERDUE",
  );
  if (overdue) return { label: "Outstanding", tone: "red" };
  if (setups.length === 0 && asMoney(client.setupFee) <= 0) {
    return { label: "Paid", tone: "green" };
  }
  return { label: "Outstanding", tone: "orange" };
}

export function periodStartIso(period: MoneyPeriod, today: string): string | null {
  if (period === "all") return null;
  if (period === "ytd") return `${today.slice(0, 4)}-01-01`;
  if (period === "12m") return addMonthsIso(today, -12);
  return addDaysIso(today, -90);
}

function inWindow(isoDate: string | null, start: string | null, today: string): boolean {
  if (!isoDate) return false;
  if (isoDate > today) return false;
  if (start && isoDate < start) return false;
  return true;
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthLabel(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return key;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function monthEnd(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const date = new Date(Date.UTC(year, month, 0));
  return date.toISOString().slice(0, 10);
}

function monthsInRange(fromKey: string, toKey: string): string[] {
  const result: string[] = [];
  let year = Number(fromKey.slice(0, 4));
  let month = Number(fromKey.slice(5, 7));
  const endYear = Number(toKey.slice(0, 4));
  const endMonth = Number(toKey.slice(5, 7));
  if (![year, month, endYear, endMonth].every(Number.isFinite)) return result;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

function minIso(values: Array<string | null | undefined>): string | null {
  let min: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (!min || value < min) min = value;
  }
  return min;
}

function visibleMonthKeys(
  period: MoneyPeriod,
  today: string,
  earliest: string | null,
): string[] {
  const end = monthKey(today);
  let start: string;
  if (period === "ytd") start = `${today.slice(0, 4)}-01`;
  else if (period === "12m") start = monthKey(addMonthsIso(today, -11));
  else if (period === "90d") start = monthKey(addMonthsIso(today, -2));
  else {
    start = earliest ? monthKey(earliest) : monthKey(addMonthsIso(today, -5));
    const cap = monthKey(addMonthsIso(today, -23));
    if (start < cap) start = cap;
  }
  if (start > end) start = end;
  return monthsInRange(start, end);
}

export function perClientTeamCost(
  clientId: string,
  teamMembers: TeamMember[],
  includeAutomationCost = false,
): number {
  let total = 0;
  for (const member of teamMembers) {
    if (member.deletedAt || !member.isActive) continue;
    if (member.isAutomation) {
      if (!includeAutomationCost) continue;
      if (member.assignedClientIds.length === 0 && member.clientId !== clientId) continue;
      if (member.assignedClientIds.length > 0 && !member.assignedClientIds.includes(clientId) && member.clientId !== clientId) {
        continue;
      }
    } else if (member.clientId !== clientId) {
      continue;
    }
    total += asMoney(member.cost);
  }
  return total;
}

/** Covers-all automation seats — counted once, never per client. */
export function workspaceAutomationCost(teamMembers: TeamMember[]): number {
  let total = 0;
  for (const member of teamMembers) {
    if (!member.isAutomation || member.deletedAt || !member.isActive) continue;
    if (member.assignedClientIds.length > 0 || member.clientId) continue;
    total += asMoney(member.cost);
  }
  return total;
}

export function deriveMoney(
  snapshot: MoneySnapshot,
  period: MoneyPeriod,
  today: string,
): MoneyDerived {
  const { clients, payments, teamMembers } = snapshot;
  const active = clients.filter(isActiveClient);
  const start = periodStartIso(period, today);

  let currentMrr = 0;
  for (const client of active) currentMrr += asMoney(client.monthlyFee);

  let totalRevenue = 0;
  for (const payment of payments) {
    if (payment.status !== "PAID") continue;
    if (!inWindow(payment.paidDate, start, today)) continue;
    totalRevenue += asMoney(payment.amount);
  }

  let collectionPaid = 0;
  let collectionDue = 0;
  for (const payment of payments) {
    if (!inWindow(payment.dueDate, start, today)) continue;
    const amount = asMoney(payment.amount);
    collectionDue += amount;
    if (payment.status === "PAID") collectionPaid += amount;
  }
  const collectionRate = collectionDue > 0 ? (collectionPaid / collectionDue) * 100 : 0;

  const mrrRows: MrrBreakdownRow[] = active.map((client) => ({
    clientId: client.id,
    name: client.name,
    planType: client.planType,
    customPlanLabel: client.customPlanLabel,
    monthlyFee: asMoney(client.monthlyFee),
    setup: setupFeeStatus(client, payments, today),
  }));
  mrrRows.sort((a, b) => a.name.localeCompare(b.name));

  const nameById = new Map(clients.map((client) => [client.id, client.name]));
  const paymentRows: PaymentTrackerRow[] = payments.map((payment) => ({
    id: payment.id,
    clientId: payment.clientId,
    clientName: nameById.get(payment.clientId) ?? "Unknown client",
    amount: asMoney(payment.amount),
    type: payment.type,
    dueDate: payment.dueDate,
    paidDate: payment.paidDate,
    storedStatus: payment.status,
    displayStatus: displayPaymentStatus(payment, today),
  }));
  paymentRows.sort((a, b) => {
    const rank = (status: DisplayPaymentStatus) =>
      status === "OVERDUE" ? 0 : status === "PENDING" ? 1 : 2;
    const byStatus = rank(a.displayStatus) - rank(b.displayStatus);
    if (byStatus !== 0) return byStatus;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const includeAutomation = snapshot.includeAutomationCostInMargin === true;

  let overallTeamCost = 0;
  const profitRows: ProfitRow[] = active.map((client) => {
    const revenue = asMoney(client.monthlyFee);
    const teamCost = perClientTeamCost(client.id, teamMembers, includeAutomation);
    overallTeamCost += teamCost;
    const profit = revenue - teamCost;
    return {
      clientId: client.id,
      name: client.name,
      teamCost,
      revenue,
      profit,
      marginPct: revenue > 0 ? (profit / revenue) * 100 : null,
    };
  });
  profitRows.sort((a, b) => a.name.localeCompare(b.name));

  if (includeAutomation) overallTeamCost += workspaceAutomationCost(teamMembers);

  const overallProfit = currentMrr - overallTeamCost;
  const overallMarginPct = currentMrr > 0 ? (overallProfit / currentMrr) * 100 : null;

  const earliest = minIso([
    ...payments.map((payment) => payment.paidDate),
    ...payments.map((payment) => payment.dueDate),
    ...clients.map((client) => client.startDate),
  ]);
  const keys = visibleMonthKeys(period, today, earliest);
  const liveTeamCost = overallTeamCost;

  const months: MonthBucket[] = keys.map((key) => {
    const end = monthEnd(key);
    let collectedMonthly = 0;
    let collectedAll = 0;
    let dueAmount = 0;
    let paidTowardDue = 0;
    for (const payment of payments) {
      const amount = asMoney(payment.amount);
      if (payment.status === "PAID" && payment.paidDate && monthKey(payment.paidDate) === key) {
        collectedAll += amount;
        if (payment.type === "MONTHLY") collectedMonthly += amount;
      }
      if (monthKey(payment.dueDate) === key) {
        dueAmount += amount;
        if (payment.status === "PAID") paidTowardDue += amount;
      }
    }
    let contractedMrr = 0;
    for (const client of active) {
      const started = client.startDate ?? client.createdAt.slice(0, 10);
      if (started && started <= end) contractedMrr += asMoney(client.monthlyFee);
    }
    return {
      key,
      label: monthLabel(key),
      collectedMonthly,
      contractedMrr,
      collectedAll,
      teamCosts: liveTeamCost,
      dueAmount,
      paidTowardDue,
      collectionRate: dueAmount > 0 ? (paidTowardDue / dueAmount) * 100 : 0,
    };
  });

  const hasMrrGrowth = months.some(
    (month) => month.collectedMonthly > 0 || month.contractedMrr > 0,
  );
  const hasRevenueVsCosts = months.some(
    (month) => month.collectedAll > 0 || month.teamCosts > 0,
  );
  const hasCollectionHistory = months.some((month) => month.dueAmount > 0);

  return {
    currentMrr,
    projectedAnnual: currentMrr * 12,
    totalRevenue,
    overallTeamCost,
    overallProfit,
    overallMarginPct,
    collectionPaid,
    collectionDue,
    collectionRate,
    mrrRows,
    paymentRows,
    profitRows,
    months,
    hasMrrGrowth,
    hasRevenueVsCosts,
    hasCollectionHistory,
  };
}

export const MONEY_QUERY_KEY = ["money"] as const;
