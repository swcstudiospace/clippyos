/** Live dashboard derivations. Never store these totals. */

import type {
  AnalyticsSnapshot,
  Client,
  ClientProgress,
  Lead,
  Payment,
  ProgressStage,
} from "@/lib/entities";
import { PROGRESS_STAGES } from "@/lib/entities";
import {
  DISCORD_AGENT_STALE_MS,
  DASHBOARD_ACTIVITY_LIMIT,
  GUARANTEE_WARNING_DAY,
  GUARANTEE_WINDOW_DAYS,
  PIPELINE_STALL_DAYS,
} from "@/lib/constants";
import type { DiscordAgentHealth } from "@/lib/integrations";
import type { CapacityRow } from "@/lib/team";
import { LEAD_STATUS_LABELS, STAGE_LABELS } from "@/lib/labels";
import {
  asMoney,
  displayPaymentStatus,
  isActiveClient,
  monthKey,
  type MoneySnapshot,
} from "@/lib/money";
import { sanitizeText } from "@/lib/sanitize";

export const DASHBOARD_PROGRESS_QUERY_KEY = ["client-progress"] as const;

export type DashboardMetrics = {
  totalMrr: number;
  totalClients: number;
  revenueThisMonth: number;
  outstanding: number;
  clientsAtRisk: number;
  overdueCount: number;
  overdueTotal: number;
};

export type GuaranteeTone = "neutral" | "orange" | "red" | "green";
export type GuaranteeStatus = "on_track" | "approaching" | "past_deadline";
export type ViewsSignal = "up" | "flat" | "insufficient";

export type GuaranteeItem = {
  id: string;
  clientId: string;
  name: string;
  dayCount: number;
  tone: GuaranteeTone;
  status: GuaranteeStatus;
  viewsIncreased: boolean | null;
  viewsSignal: ViewsSignal;
  viewsLabel: string;
  label: string;
};

export type PipelineCounts = {
  stages: Record<ProgressStage, number>;
  notStarted: number;
  total: number;
};

export type PipelineFilter = ProgressStage | "NONE" | null;

export type DashboardAlertSeverity = "warning" | "critical";

export type DashboardLink =
  | { to: "/money" }
  | { to: "/calendar" }
  | { to: "/clients" }
  | { to: "/clients/$clientId"; params: { clientId: string } }
  | { to: "/ideation" }
  | { to: "/analytics" }
  | { to: "/settings"; hash?: string }
  | { to: "/team" }
  | { to: "/leads" }
  | { to: "/social" }
  | { to: "/approvals" }
  | { to: "/health" }
  | { to: "/library" }
  | { to: "/agent" };

export type DashboardAlert = {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  href: DashboardLink;
};

export type ActivityKind =
  | "payment_paid"
  | "stage_change"
  | "lead_created"
  | "lead_moved"
  | "client_created";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  at: string;
  title: string;
  href: DashboardLink;
};

export type PipelineClient = Pick<Client, "id" | "status" | "deletedAt"> & {
  currentStage: ProgressStage | null;
};

/** Inclusive: the start date is Day 1 of the 30-day window. */
export function inclusiveDayCount(startDate: string, today: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

/** Whole calendar days since an ISO timestamp (same day → 0). */
export function daysSinceTimestamp(iso: string | null | undefined, today: string): number | null {
  if (!iso) return null;
  const date = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = Date.parse(`${date}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000);
}

export function deriveDashboardMetrics(
  snapshot: MoneySnapshot,
  today: string,
): DashboardMetrics {
  const active = snapshot.clients.filter(isActiveClient);
  let totalMrr = 0;
  let clientsAtRisk = 0;
  for (const client of active) {
    totalMrr += asMoney(client.monthlyFee);
    if (!client.startDate) continue;
    const dayCount = inclusiveDayCount(client.startDate, today);
    if (dayCount >= GUARANTEE_WARNING_DAY) clientsAtRisk += 1;
  }

  const thisMonth = monthKey(today);
  let revenueThisMonth = 0;
  let outstanding = 0;
  let overdueCount = 0;
  let overdueTotal = 0;
  for (const payment of snapshot.payments) {
    const amount = asMoney(payment.amount);
    if (
      payment.status === "PAID" &&
      payment.paidDate &&
      monthKey(payment.paidDate) === thisMonth
    ) {
      revenueThisMonth += amount;
    }
    const display = displayPaymentStatus(payment, today);
    if (display === "PENDING" || display === "OVERDUE") outstanding += amount;
    if (display === "OVERDUE") {
      overdueCount += 1;
      overdueTotal += amount;
    }
  }

  return {
    totalMrr,
    totalClients: active.length,
    revenueThisMonth,
    outstanding,
    clientsAtRisk,
    overdueCount,
    overdueTotal,
  };
}

function viewsIncreasedForClient(
  clientId: string,
  startDate: string,
  snapshots: AnalyticsSnapshot[],
): boolean | null {
  const points = snapshots
    .filter(
      (row) =>
        row.clientId === clientId &&
        row.date >= startDate &&
        row.views != null &&
        row.views !== "",
    )
    .map((row) => ({ date: row.date, views: Number(row.views) }))
    .filter((row) => Number.isFinite(row.views))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 2) return null;
  const first = points[0]!.views;
  const last = points[points.length - 1]!.views;
  return last > first;
}

export function guaranteeStatusForDay(dayCount: number): GuaranteeStatus {
  if (dayCount >= GUARANTEE_WINDOW_DAYS) return "past_deadline";
  if (dayCount >= GUARANTEE_WARNING_DAY) return "approaching";
  return "on_track";
}

export function deriveGuaranteeItems(
  clients: Client[],
  snapshots: AnalyticsSnapshot[],
  today: string,
): GuaranteeItem[] {
  const items: GuaranteeItem[] = [];
  for (const client of clients) {
    if (!isActiveClient(client) || !client.startDate) continue;
    const dayCount = inclusiveDayCount(client.startDate, today);
    if (dayCount <= 0) continue;
    const viewsIncreased = viewsIncreasedForClient(
      client.id,
      client.startDate,
      snapshots,
    );
    const status = guaranteeStatusForDay(dayCount);
    const viewsSignal: ViewsSignal =
      viewsIncreased === true ? "up" : viewsIncreased === false ? "flat" : "insufficient";
    const viewsLabel =
      viewsSignal === "up"
        ? "Views ↑"
        : viewsSignal === "flat"
          ? "Views flat/↓"
          : "Insufficient data";

    let tone: GuaranteeTone = "neutral";
    if (viewsIncreased === true) tone = "green";
    else if (status === "past_deadline") tone = "red";
    else if (status === "approaching") tone = "orange";

    let label = `Day ${dayCount}/${GUARANTEE_WINDOW_DAYS} — monitor views for ${client.name}`;
    if (viewsIncreased === true) {
      label = `Day ${dayCount}/${GUARANTEE_WINDOW_DAYS} — views are up for ${client.name}`;
    } else if (status === "past_deadline") {
      label = `Day ${dayCount}/${GUARANTEE_WINDOW_DAYS} — refund window for ${client.name}`;
    }

    items.push({
      id: client.id,
      clientId: client.id,
      name: client.name,
      dayCount,
      tone,
      status,
      viewsIncreased,
      viewsSignal,
      viewsLabel,
      label,
    });
  }
  items.sort((a, b) => b.dayCount - a.dayCount || a.name.localeCompare(b.name));
  return items;
}

export function derivePipelineCounts(
  clients: Array<Pick<Client, "id" | "status" | "deletedAt"> & { currentStage?: ProgressStage | null }>,
): PipelineCounts {
  const stages = Object.fromEntries(PROGRESS_STAGES.map((stage) => [stage, 0])) as Record<
    ProgressStage,
    number
  >;
  let notStarted = 0;
  let total = 0;
  for (const client of clients) {
    if (client.status !== "ACTIVE" || client.deletedAt) continue;
    total += 1;
    const stage = client.currentStage ?? null;
    if (!stage) notStarted += 1;
    else stages[stage] += 1;
  }
  return { stages, notStarted, total };
}

export function deriveStuckStageCount(
  clients: PipelineClient[],
  progress: Pick<ClientProgress, "clientId" | "stage" | "createdAt">[],
  today: string,
  stallDays = PIPELINE_STALL_DAYS,
): number {
  const latest = new Map<string, Pick<ClientProgress, "stage" | "createdAt">>();
  for (const row of progress) {
    if (!latest.has(row.clientId)) latest.set(row.clientId, row);
  }
  let count = 0;
  for (const client of clients) {
    if (client.status !== "ACTIVE" || client.deletedAt) continue;
    const row = latest.get(client.id);
    if (!row || row.stage === "PUBLISHED") continue;
    const days = daysSinceTimestamp(row.createdAt, today);
    if (days != null && days >= stallDays) count += 1;
  }
  return count;
}

export function deriveRecentActivity(input: {
  clients: Client[];
  payments: Payment[];
  progress: ClientProgress[];
  leads: Lead[];
}): ActivityItem[] {
  const names = new Map(input.clients.map((client) => [client.id, sanitizeText(client.name)]));
  const items: ActivityItem[] = [];

  for (const client of input.clients) {
    if (client.deletedAt) continue;
    items.push({
      id: `client:${client.id}`,
      kind: "client_created",
      at: client.createdAt,
      title: `Client added — ${sanitizeText(client.name)}`,
      href: { to: "/clients/$clientId", params: { clientId: client.id } },
    });
  }

  for (const payment of input.payments) {
    if (payment.status !== "PAID" || !payment.paidDate) continue;
    const who = names.get(payment.clientId) || "a client";
    items.push({
      id: `pay:${payment.id}`,
      kind: "payment_paid",
      at: payment.paidDate,
      title: `Payment collected — ${who}`,
      href: { to: "/money" },
    });
  }

  for (const row of input.progress) {
    const who = names.get(row.clientId) || "Client";
    items.push({
      id: `stage:${row.id}`,
      kind: "stage_change",
      at: row.createdAt,
      title: `${who} → ${STAGE_LABELS[row.stage]}`,
      href: { to: "/clients/$clientId", params: { clientId: row.clientId } },
    });
  }

  for (const lead of input.leads) {
    if (lead.deletedAt) continue;
    const name = sanitizeText(lead.name);
    items.push({
      id: `lead-new:${lead.id}`,
      kind: "lead_created",
      at: lead.createdAt,
      title: `Lead added — ${name}`,
      href: { to: "/leads" },
    });
    if (lead.updatedAt && lead.updatedAt !== lead.createdAt && lead.status !== "TO_CONTACT") {
      items.push({
        id: `lead-move:${lead.id}:${lead.updatedAt}`,
        kind: "lead_moved",
        at: lead.updatedAt,
        title: `${name} → ${LEAD_STATUS_LABELS[lead.status]}`,
        href: { to: "/leads" },
      });
    }
  }

  items.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  return items.slice(0, DASHBOARD_ACTIVITY_LIMIT);
}

export function deriveDashboardAlerts(input: {
  overdueCount: number;
  overdueTotal: number;
  guarantees: GuaranteeItem[];
  discordConfigured: boolean;
  discordAgent: DiscordAgentHealth | null;
  aiConfigured: boolean;
  overloaded: CapacityRow[];
  nowMs: number;
  pendingApprovals?: number;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if ((input.pendingApprovals ?? 0) > 0) {
    alerts.push({
      id: "approvals",
      severity: "warning",
      title: `${input.pendingApprovals} publish${input.pendingApprovals === 1 ? "" : "es"} waiting for approval`,
      href: { to: "/approvals" },
    });
  }

  if (input.overdueCount > 0) {
    alerts.push({
      id: "overdue",
      severity: "critical",
      title: `${input.overdueCount} overdue payment${input.overdueCount === 1 ? "" : "s"}`,
      href: { to: "/money" },
    });
  }

  const past = input.guarantees.filter(
    (item) => item.status === "past_deadline" && item.viewsIncreased !== true,
  );
  if (past.length > 0) {
    const first = past[0]!;
    alerts.push({
      id: "guarantee-past",
      severity: "critical",
      title:
        past.length === 1
          ? `${first.name} is past the 30-day views window`
          : `${past.length} clients are past the 30-day views window`,
      href:
        past.length === 1
          ? { to: "/clients/$clientId", params: { clientId: first.clientId } }
          : { to: "/clients" },
    });
  }

  const approaching = input.guarantees.filter(
    (item) => item.status === "approaching" && item.viewsIncreased !== true,
  );
  if (approaching.length > 0) {
    alerts.push({
      id: "guarantee-warn",
      severity: "warning",
      title: `${approaching.length} client${approaching.length === 1 ? "" : "s"} approaching day 30`,
      href: { to: "/clients" },
    });
  }

  if (!input.aiConfigured) {
    alerts.push({
      id: "ai-missing",
      severity: "warning",
      title: "AI isn’t connected — ideation and titles are paused",
      href: { to: "/settings", hash: "integrations" },
    });
  }

  if (input.discordConfigured) {
    const last = input.discordAgent?.lastRunAt
      ? Date.parse(input.discordAgent.lastRunAt)
      : NaN;
    const stale =
      !Number.isFinite(last) || input.nowMs - last > DISCORD_AGENT_STALE_MS;
    if (stale) {
      alerts.push({
        id: "discord-stale",
        severity: "warning",
        title: "Discord Status Agent hasn’t run recently",
        href: { to: "/settings", hash: "integrations" },
      });
    } else if (input.discordAgent?.lastOk === false) {
      alerts.push({
        id: "discord-fail",
        severity: "warning",
        title: "Discord Status Agent’s last run failed",
        href: { to: "/settings", hash: "integrations" },
      });
    }
  }

  if (input.overloaded.length > 0) {
    alerts.push({
      id: "capacity",
      severity: "warning",
      title: `${input.overloaded.length} teammate${input.overloaded.length === 1 ? "" : "s"} assigned to more than 3 clients`,
      href: { to: "/team" },
    });
  }

  return alerts;
}
