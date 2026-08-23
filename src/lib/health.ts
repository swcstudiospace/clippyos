/** Client-safe Health + job orchestration. Secrets never live here. */

import type { AppRole } from "@/lib/entities";
import type { ApiKeyScope, AuditRow } from "@/lib/autonomy";
import type { LinearEntityType } from "@/lib/linear";
import type { HermesConnectStatus } from "@/lib/connect";
import type { GrokBotConnectionState } from "@/lib/grok-bot";
import type { CostGuard } from "@/lib/social";
import type { IntegrationCardStatus, DiscordAgentHealth } from "@/lib/integrations";
import type { PublisherStatus } from "@/lib/publishers";

export const HEALTH_QUERY_KEY = ["health"] as const;

export const HEALTH_POLL_MS = 15_000;
export const HEALTH_STALL_MS = 10 * 60 * 1000;
export const HEALTH_DLQ_SETTING = "HEALTH_DLQ_DISMISSED_JSON";
export const HEALTH_RENDER_DLQ_ATTEMPTS = 2;
export const HEALTH_LINEAR_DLQ_ATTEMPTS = 5;

export const HEALTH_JOB_TYPES = [
  "RENDER",
  "SOCIAL_UPLOAD",
  "AGENT",
  "PERFORMANCE_FETCH",
  "DISCORD_STAGE",
  "LINEAR_SYNC",
  "OTHER",
] as const;
export type HealthJobType = (typeof HEALTH_JOB_TYPES)[number];

export const HEALTH_JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "AWAITING_APPROVAL",
  "FAILED",
  "SUCCEEDED",
  "CANCELLED",
  "STALLED",
] as const;
export type HealthJobStatus = (typeof HEALTH_JOB_STATUSES)[number];

export const HEALTH_WINDOWS = ["24h", "7d", "all"] as const;
export type HealthWindow = (typeof HEALTH_WINDOWS)[number];

export const HEALTH_JOB_TYPE_LABELS: Record<HealthJobType, string> = {
  RENDER: "Render",
  SOCIAL_UPLOAD: "Upload",
  AGENT: "Agent",
  PERFORMANCE_FETCH: "Metrics ingest",
  DISCORD_STAGE: "Discord stage",
  LINEAR_SYNC: "Linear sync",
  OTHER: "Other",
};

export const HEALTH_JOB_STATUS_LABELS: Record<HealthJobStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  AWAITING_APPROVAL: "Awaiting approval",
  FAILED: "Failed",
  SUCCEEDED: "Succeeded",
  CANCELLED: "Cancelled",
  STALLED: "Stalled",
};

export type HealthJobHref =
  | { to: "/library" }
  | { to: "/social" }
  | { to: "/agent" }
  | { to: "/analytics" }
  | { to: "/settings"; hash?: string }
  | { to: "/health" };

export type HealthJob = {
  id: string;
  type: HealthJobType;
  status: HealthJobStatus;
  clientId: string | null;
  clientName: string | null;
  provider: string | null;
  progressPercent: number | null;
  startedAt: string | null;
  updatedAt: string;
  error: string | null;
  attempts: number;
  createdBy: string | null;
  href: HealthJobHref;
  linearUrl: string | null;
  assetId: string | null;
  canRetry: boolean;
  canCancel: boolean;
  dlq: boolean;
};

export type HealthSlo = {
  uploadSuccessRate24h: number | null;
  renderSuccessRate24h: number | null;
  uploadP50Ms: number | null;
  uploadP95Ms: number | null;
  renderP50Ms: number | null;
  renderP95Ms: number | null;
  awaitingApproval: number;
  needsLogin: number;
  stalled: number;
  queueDepth: number;
  failRate24h: number | null;
};

export type HealthCostGuards = {
  daytona: CostGuard;
  agentActive: number;
  agentMax: number;
  automationPaused: boolean;
  socialAutoStart: boolean;
  xai: {
    recent429: number;
    retrying: boolean;
    backoffUntil: string | null;
    message: string | null;
  };
  higgsfieldError: string | null;
};

export type HealthIntegrationTone = "connected" | "degraded" | "error" | "not_configured";

export type HealthIntegrationCard = {
  id: string;
  name: string;
  group: "publisher" | "runtime" | "ops";
  tone: HealthIntegrationTone;
  lastSuccessAt: string | null;
  lastError: string | null;
  testId: string | null;
  detail: string | null;
};

export type HealthHermesRuntime = {
  connection: HermesConnectStatus["hermesConnection"];
  lastLoginAt: string | null;
  keyLast4: string | null;
  keyName: string | null;
  playbookPackageVersion: string;
  pastedIntoHermes: boolean;
  pastedAt: string | null;
  lastDelivery: HermesConnectStatus["lastDelivery"];
  scopes: string[];
  mcpConfigured: boolean;
  mcpLastUsedAt: string | null;
  mcpLast4: string | null;
  grokBot: {
    connection: GrokBotConnectionState;
    queued: number;
    claimed: number;
  } | null;
  recentAudit: Array<Pick<AuditRow, "id" | "action" | "result" | "createdAt" | "actorLabel" | "errorCode" | "source">>;
  revokedTokenCount: number;
  activeTokenCount: number;
};

export type HealthBanner = {
  severity: "critical" | "warning";
  title: string;
} | null;

export type HealthSnapshot = {
  jobs: HealthJob[];
  slos: HealthSlo;
  costGuards: HealthCostGuards;
  integrations: HealthIntegrationCard[];
  hermes: HealthHermesRuntime;
  banner: HealthBanner;
  clients: Array<{ id: string; name: string }>;
  role: AppRole | null;
  generatedAt: string;
  discordAgent: DiscordAgentHealth;
};

export type HealthJobFilter = {
  status?: HealthJobStatus | "ALL";
  type?: HealthJobType | "ALL";
  clientId?: string | "ALL";
  window?: HealthWindow;
};

export type DlqDismissKey = { type: HealthJobType; id: string };

export function healthJobKey(job: Pick<HealthJob, "type" | "id">): string {
  return `${job.type}:${job.id}`;
}

export function parseDlqDismissed(raw: unknown): DlqDismissKey[] {
  if (!Array.isArray(raw)) return [];
  const out: DlqDismissKey[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const type = String(rec.type ?? "");
    const id = String(rec.id ?? "").trim();
    if (!(HEALTH_JOB_TYPES as readonly string[]).includes(type) || !id) continue;
    out.push({ type: type as HealthJobType, id });
  }
  return out.slice(0, 400);
}

export function isDismissed(job: Pick<HealthJob, "type" | "id">, dismissed: readonly DlqDismissKey[]): boolean {
  return dismissed.some((row) => row.type === job.type && row.id === job.id);
}

const SECRET_PATTERNS: readonly RegExp[] = [
  /dtn_[a-zA-Z0-9]+/gi,
  /lin_api_[a-zA-Z0-9]+/gi,
  /sk-[a-zA-Z0-9_-]+/gi,
  /xai-[a-zA-Z0-9_-]+/gi,
  /ghp_[a-zA-Z0-9]+/gi,
  /cos_mcp_[a-zA-Z0-9]+/gi,
  /agk_[a-zA-Z0-9]+/gi,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /Bot\s+[A-Za-z0-9._-]+/gi,
  /AIza[A-Za-z0-9_-]+/gi,
];

export function sanitizeHealthError(value: string | null | undefined): string | null {
  if (!value) return null;
  let next = value;
  for (const pattern of SECRET_PATTERNS) next = next.replace(pattern, "[redacted]");
  next = next.replace(/[A-Za-z0-9+/]{32,}={0,2}/g, "[redacted]");
  return next.slice(0, 180);
}

export function mapSocialStatus(status: string): HealthJobStatus {
  switch (status) {
    case "queued":
      return "QUEUED";
    case "running":
      return "RUNNING";
    case "awaiting_approval":
      return "AWAITING_APPROVAL";
    case "succeeded":
      return "SUCCEEDED";
    case "cancelled":
      return "CANCELLED";
    case "failed":
    case "needs_attention":
      return "FAILED";
    default:
      return "QUEUED";
  }
}

export function mapRenderStatus(status: string): HealthJobStatus {
  switch (status) {
    case "QUEUED":
      return "QUEUED";
    case "RUNNING":
      return "RUNNING";
    case "SUCCEEDED":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    case "CANCELED":
      return "CANCELLED";
    default:
      return "QUEUED";
  }
}

export function mapAgentStatus(status: string): HealthJobStatus {
  switch (status) {
    case "queued":
    case "planning":
      return "QUEUED";
    case "stepping":
    case "backoff":
    case "running":
      return "RUNNING";
    case "waiting_human":
    case "waiting_resource":
    case "paused":
    case "needs_login":
      return "AWAITING_APPROVAL";
    case "succeeded":
    case "completed":
      return "SUCCEEDED";
    case "failed":
    case "error":
      return "FAILED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "QUEUED";
  }
}

export function mapPerformanceStatus(status: string): HealthJobStatus {
  switch (status) {
    case "DONE":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    default:
      return "QUEUED";
  }
}

export function mapLinearStatus(input: { attempts: number; lastError: string | null; nextAttemptAt: string }, nowMs: number): HealthJobStatus {
  if (input.attempts >= HEALTH_LINEAR_DLQ_ATTEMPTS && input.lastError) return "FAILED";
  if (input.lastError && Date.parse(input.nextAttemptAt) > nowMs) return "FAILED";
  return "QUEUED";
}

export function applyStalled(status: HealthJobStatus, updatedAt: string, nowMs: number): HealthJobStatus {
  if (status !== "RUNNING" && status !== "QUEUED") return status;
  const at = Date.parse(updatedAt);
  if (!Number.isFinite(at)) return status;
  if (nowMs - at > HEALTH_STALL_MS) return "STALLED";
  return status;
}

export function isDlqJob(job: Pick<HealthJob, "type" | "status" | "attempts">): boolean {
  if (job.type === "DISCORD_STAGE") return false;
  if (job.status !== "FAILED" && job.status !== "STALLED") return false;
  if (job.type === "RENDER") return job.attempts >= HEALTH_RENDER_DLQ_ATTEMPTS;
  if (job.type === "LINEAR_SYNC") return job.attempts >= HEALTH_LINEAR_DLQ_ATTEMPTS || job.status === "FAILED";
  return true;
}

export function retryScopeForType(type: HealthJobType): ApiKeyScope {
  switch (type) {
    case "AGENT":
      return "actions:ai";
    case "LINEAR_SYNC":
      return "linear:write";
    default:
      return "write:social";
  }
}

export function linearEntityForType(type: HealthJobType): LinearEntityType | null {
  switch (type) {
    case "AGENT":
      return "AgentRun";
    case "RENDER":
      return "RenderJob";
    case "SOCIAL_UPLOAD":
      return "SocialUploadJob";
    default:
      return null;
  }
}

export function hrefForType(type: HealthJobType): HealthJobHref {
  switch (type) {
    case "RENDER":
      return { to: "/library" };
    case "SOCIAL_UPLOAD":
      return { to: "/social" };
    case "AGENT":
      return { to: "/agent" };
    case "PERFORMANCE_FETCH":
      return { to: "/analytics" };
    case "DISCORD_STAGE":
      return { to: "/settings", hash: "integrations" };
    case "LINEAR_SYNC":
      return { to: "/settings", hash: "linear" };
    default:
      return { to: "/health" };
  }
}

export function jobActions(input: {
  type: HealthJobType;
  status: HealthJobStatus;
  createdBy: string | null;
  isAdmin: boolean;
  userId: string;
}): { canRetry: boolean; canCancel: boolean } {
  if (input.type === "DISCORD_STAGE") return { canRetry: false, canCancel: false };
  const owned = input.isAdmin || (input.createdBy != null && input.createdBy === input.userId);
  if (!owned && !input.isAdmin) return { canRetry: false, canCancel: false };
  const canRetry =
    owned &&
    (input.status === "FAILED" ||
      input.status === "CANCELLED" ||
      input.status === "STALLED" ||
      (input.type === "LINEAR_SYNC" && input.status === "QUEUED"));
  const canCancel =
    owned &&
    (input.status === "QUEUED" ||
      input.status === "RUNNING" ||
      input.status === "STALLED" ||
      input.status === "AWAITING_APPROVAL") &&
    input.type !== "PERFORMANCE_FETCH" &&
    input.type !== "LINEAR_SYNC";
  return { canRetry, canCancel };
}

export function windowStartMs(window: HealthWindow, nowMs: number): number | null {
  if (window === "all") return null;
  if (window === "24h") return nowMs - 24 * 60 * 60 * 1000;
  return nowMs - 7 * 24 * 60 * 60 * 1000;
}

export function filterHealthJobs(jobs: readonly HealthJob[], filter: HealthJobFilter, nowMs: number): HealthJob[] {
  const start = windowStartMs(filter.window ?? "all", nowMs);
  return jobs.filter((job) => {
    if (filter.status && filter.status !== "ALL" && job.status !== filter.status) return false;
    if (filter.type && filter.type !== "ALL" && job.type !== filter.type) return false;
    if (filter.clientId && filter.clientId !== "ALL" && job.clientId !== filter.clientId) return false;
    if (start != null) {
      const at = Date.parse(job.updatedAt);
      if (!Number.isFinite(at) || at < start) return false;
    }
    return true;
  });
}

export function percentile(values: readonly number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));
  return sorted[rank - 1] ?? null;
}

export function successRate(rows: readonly { status: HealthJobStatus }[]): number | null {
  const finished = rows.filter((row) => row.status === "SUCCEEDED" || row.status === "FAILED" || row.status === "CANCELLED");
  if (!finished.length) return null;
  const ok = finished.filter((row) => row.status === "SUCCEEDED").length;
  return ok / finished.length;
}

export function durationMs(startedAt: string | null, finishedAt: string | null): number | null {
  if (!startedAt || !finishedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

export type SloSample = {
  type: HealthJobType;
  status: HealthJobStatus;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export function computeSlos(input: {
  samples: readonly SloSample[];
  awaitingApproval: number;
  needsLogin: number;
  nowMs: number;
}): HealthSlo {
  const start24 = input.nowMs - 24 * 60 * 60 * 1000;
  const in24h = input.samples.filter((row) => Date.parse(row.updatedAt) >= start24);
  const uploads = in24h.filter((row) => row.type === "SOCIAL_UPLOAD");
  const renders = in24h.filter((row) => row.type === "RENDER");
  const uploadDurations = uploads
    .filter((row) => row.status === "SUCCEEDED")
    .map((row) => durationMs(row.startedAt, row.finishedAt))
    .filter((value): value is number => value != null);
  const renderDurations = renders
    .filter((row) => row.status === "SUCCEEDED")
    .map((row) => durationMs(row.startedAt, row.finishedAt))
    .filter((value): value is number => value != null);
  const stalled = input.samples.filter((row) => row.status === "STALLED").length;
  const queueDepth = input.samples.filter(
    (row) => row.status === "QUEUED" || row.status === "RUNNING" || row.status === "STALLED",
  ).length;
  return {
    uploadSuccessRate24h: successRate(uploads),
    renderSuccessRate24h: successRate(renders),
    uploadP50Ms: percentile(uploadDurations, 50),
    uploadP95Ms: percentile(uploadDurations, 95),
    renderP50Ms: percentile(renderDurations, 50),
    renderP95Ms: percentile(renderDurations, 95),
    awaitingApproval: input.awaitingApproval,
    needsLogin: input.needsLogin,
    stalled,
    queueDepth,
    failRate24h: (() => {
      const finished = in24h.filter(
        (row) => row.status === "SUCCEEDED" || row.status === "FAILED" || row.status === "CANCELLED",
      );
      if (!finished.length) return null;
      return finished.filter((row) => row.status === "FAILED").length / finished.length;
    })(),
  };
}

export function integrationTone(status: Pick<IntegrationCardStatus, "configured" | "health">): HealthIntegrationTone {
  if (!status.configured || status.health === "not_configured") return "not_configured";
  if (status.health === "error" || status.health === "token_expired") return "error";
  if (status.health === "saved") return "degraded";
  return "connected";
}

export function publisherTone(status: Pick<PublisherStatus, "connected" | "eligible" | "tokenExpired" | "appConfigured">): HealthIntegrationTone {
  if (!status.appConfigured && !status.connected) return "not_configured";
  if (status.tokenExpired) return "error";
  if (status.connected && status.eligible) return "connected";
  if (status.connected) return "degraded";
  if (status.appConfigured) return "degraded";
  return "not_configured";
}

export function deriveHealthBanner(input: {
  integrations: readonly HealthIntegrationCard[];
  mcpConfigured: boolean;
  activeTokenCount: number;
  needsLogin: number;
  stalled: number;
}): HealthBanner {
  const publishers = input.integrations.filter((row) => row.group === "publisher");
  const allSocialDown =
    publishers.length > 0 && publishers.every((row) => row.tone === "not_configured" || row.tone === "error");
  const mcpFailing = !input.mcpConfigured && input.activeTokenCount === 0;
  if (allSocialDown) {
    return { severity: "critical", title: "All social rails are down — connect a publisher or Daytona." };
  }
  if (mcpFailing) {
    return { severity: "critical", title: "MCP is not authenticated — mint a token in Settings." };
  }
  const errors = input.integrations.filter((row) => row.tone === "error");
  if (errors.length) {
    return { severity: "warning", title: `${errors.length} integration${errors.length === 1 ? "" : "s"} in error.` };
  }
  if (input.stalled > 0) {
    return {
      severity: "warning",
      title: `${input.stalled} job${input.stalled === 1 ? "" : "s"} stalled (no progress for 10+ minutes).`,
    };
  }
  if (input.needsLogin > 0) {
    return {
      severity: "warning",
      title: `${input.needsLogin} platform${input.needsLogin === 1 ? "" : "s"} need a login.`,
    };
  }
  return null;
}

export function formatDurationMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec < 10 ? sec.toFixed(1) : Math.round(sec)}s`;
  const min = sec / 60;
  if (min < 60) return `${min < 10 ? min.toFixed(1) : Math.round(min)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

export function formatRate(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}
