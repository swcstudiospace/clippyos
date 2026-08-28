import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HEALTH_STALL_MS,
  applyStalled,
  computeSlos,
  deriveHealthBanner,
  grokBotHealthTone,
  filterHealthJobs,
  formatRate,
  isDismissed,
  isDlqJob,
  jobActions,
  mapAgentStatus,
  mapLinearStatus,
  mapRenderStatus,
  mapSocialStatus,
  parseDlqDismissed,
  percentile,
  retryScopeForType,
  sanitizeHealthError,
  successRate,
  type HealthJob,
} from "./health.ts";

function job(partial: Partial<HealthJob> & Pick<HealthJob, "id" | "type" | "status">): HealthJob {
  return {
    clientId: null,
    clientName: null,
    provider: null,
    progressPercent: null,
    startedAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:10:00.000Z",
    error: null,
    attempts: 0,
    createdBy: "u1",
    href: { to: "/health" },
    linearUrl: null,
    assetId: null,
    canRetry: false,
    canCancel: false,
    dlq: false,
    ...partial,
  };
}

test("maps social / render / agent statuses into the unified feed", () => {
  assert.equal(mapSocialStatus("awaiting_approval"), "AWAITING_APPROVAL");
  assert.equal(mapSocialStatus("needs_attention"), "FAILED");
  assert.equal(mapRenderStatus("CANCELED"), "CANCELLED");
  assert.equal(mapAgentStatus("waiting_human"), "AWAITING_APPROVAL");
  assert.equal(mapAgentStatus("stepping"), "RUNNING");
  assert.equal(mapAgentStatus("needs_login"), "AWAITING_APPROVAL");
});

test("stalled overlay only applies to running/queued jobs older than 10 minutes", () => {
  const now = Date.parse("2026-08-23T01:00:00.000Z");
  const fresh = new Date(now - 60_000).toISOString();
  const stale = new Date(now - HEALTH_STALL_MS - 1_000).toISOString();
  assert.equal(applyStalled("RUNNING", fresh, now), "RUNNING");
  assert.equal(applyStalled("RUNNING", stale, now), "STALLED");
  assert.equal(applyStalled("FAILED", stale, now), "FAILED");
  assert.equal(applyStalled("QUEUED", stale, now), "STALLED");
});

test("DLQ is exhausted retries — render needs 2 attempts, social failed is eligible", () => {
  assert.equal(isDlqJob({ type: "SOCIAL_UPLOAD", status: "FAILED", attempts: 1 }), true);
  assert.equal(isDlqJob({ type: "RENDER", status: "FAILED", attempts: 1 }), false);
  assert.equal(isDlqJob({ type: "RENDER", status: "FAILED", attempts: 2 }), true);
  assert.equal(isDlqJob({ type: "AGENT", status: "FAILED", attempts: 0 }), true);
  assert.equal(isDlqJob({ type: "DISCORD_STAGE", status: "FAILED", attempts: 3 }), false);
  assert.equal(isDlqJob({ type: "LINEAR_SYNC", status: "FAILED", attempts: 5 }), true);
  assert.equal(isDlqJob({ type: "SOCIAL_UPLOAD", status: "SUCCEEDED", attempts: 4 }), false);
});

test("dismissed DLQ keys stay out of the list without mutating the source job", () => {
  const dismissed = parseDlqDismissed([
    { type: "SOCIAL_UPLOAD", id: "s1" },
    { type: "nope", id: "x" },
    { id: "missing-type" },
  ]);
  assert.deepEqual(dismissed, [{ type: "SOCIAL_UPLOAD", id: "s1" }]);
  assert.equal(isDismissed({ type: "SOCIAL_UPLOAD", id: "s1" }, dismissed), true);
  assert.equal(isDismissed({ type: "SOCIAL_UPLOAD", id: "s2" }, dismissed), false);
});

test("success-rate widgets match job table data for the last 24h", () => {
  const now = Date.parse("2026-08-23T12:00:00.000Z");
  const samples = [
    {
      type: "SOCIAL_UPLOAD" as const,
      status: "SUCCEEDED" as const,
      updatedAt: "2026-08-23T11:00:00.000Z",
      startedAt: "2026-08-23T10:59:00.000Z",
      finishedAt: "2026-08-23T11:00:00.000Z",
    },
    {
      type: "SOCIAL_UPLOAD" as const,
      status: "FAILED" as const,
      updatedAt: "2026-08-23T11:10:00.000Z",
      startedAt: "2026-08-23T11:09:00.000Z",
      finishedAt: "2026-08-23T11:10:00.000Z",
    },
    {
      type: "SOCIAL_UPLOAD" as const,
      status: "SUCCEEDED" as const,
      updatedAt: "2026-08-22T10:00:00.000Z",
      startedAt: "2026-08-22T09:00:00.000Z",
      finishedAt: "2026-08-22T10:00:00.000Z",
    },
    {
      type: "RENDER" as const,
      status: "SUCCEEDED" as const,
      updatedAt: "2026-08-23T11:30:00.000Z",
      startedAt: "2026-08-23T11:20:00.000Z",
      finishedAt: "2026-08-23T11:30:00.000Z",
    },
    {
      type: "RENDER" as const,
      status: "FAILED" as const,
      updatedAt: "2026-08-23T11:40:00.000Z",
      startedAt: "2026-08-23T11:35:00.000Z",
      finishedAt: "2026-08-23T11:40:00.000Z",
    },
    {
      type: "RENDER" as const,
      status: "FAILED" as const,
      updatedAt: "2026-08-23T11:50:00.000Z",
      startedAt: "2026-08-23T11:45:00.000Z",
      finishedAt: "2026-08-23T11:50:00.000Z",
    },
  ];
  const slos = computeSlos({ samples, awaitingApproval: 2, needsLogin: 1, nowMs: now });
  assert.equal(slos.uploadSuccessRate24h, 0.5);
  assert.equal(slos.renderSuccessRate24h, 1 / 3);
  assert.equal(slos.awaitingApproval, 2);
  assert.equal(slos.needsLogin, 1);
  assert.equal(formatRate(slos.uploadSuccessRate24h), "50%");
});

test("p50 / p95 durations use finished timestamps only", () => {
  const values = [1000, 2000, 3000, 4000, 10_000];
  assert.equal(percentile(values, 50), 3000);
  assert.equal(percentile(values, 95), 10_000);
  assert.equal(percentile([], 95), null);
  const slos = computeSlos({
    samples: [
      {
        type: "SOCIAL_UPLOAD",
        status: "SUCCEEDED",
        updatedAt: "2026-08-23T11:00:00.000Z",
        startedAt: "2026-08-23T10:59:50.000Z",
        finishedAt: "2026-08-23T11:00:00.000Z",
      },
      {
        type: "SOCIAL_UPLOAD",
        status: "SUCCEEDED",
        updatedAt: "2026-08-23T11:01:00.000Z",
        startedAt: "2026-08-23T11:00:00.000Z",
        finishedAt: "2026-08-23T11:01:00.000Z",
      },
    ],
    awaitingApproval: 0,
    needsLogin: 0,
    nowMs: Date.parse("2026-08-23T12:00:00.000Z"),
  });
  assert.equal(slos.uploadP50Ms, 10_000);
  assert.equal(slos.uploadP95Ms, 60_000);
});

test("filters by status, type, client, and rolling window", () => {
  const now = Date.parse("2026-08-23T12:00:00.000Z");
  const jobs = [
    job({ id: "1", type: "SOCIAL_UPLOAD", status: "FAILED", clientId: "c1", updatedAt: "2026-08-23T11:00:00.000Z" }),
    job({ id: "2", type: "RENDER", status: "SUCCEEDED", clientId: "c2", updatedAt: "2026-08-23T11:00:00.000Z" }),
    job({ id: "3", type: "SOCIAL_UPLOAD", status: "FAILED", clientId: "c1", updatedAt: "2026-08-21T11:00:00.000Z" }),
  ];
  assert.equal(filterHealthJobs(jobs, { status: "FAILED" }, now).length, 2);
  assert.equal(filterHealthJobs(jobs, { type: "RENDER" }, now).length, 1);
  assert.equal(filterHealthJobs(jobs, { clientId: "c1", window: "24h" }, now).map((row) => row.id).join(","), "1");
  assert.equal(filterHealthJobs(jobs, { clientId: "c1", window: "7d" }, now).length, 2);
});

test("members cannot retry jobs they did not create; admins can", () => {
  const failed = { type: "SOCIAL_UPLOAD" as const, status: "FAILED" as const, createdBy: "u1" };
  assert.deepEqual(jobActions({ ...failed, isAdmin: false, userId: "u1" }), { canRetry: true, canCancel: false });
  assert.deepEqual(jobActions({ ...failed, isAdmin: false, userId: "u2" }), { canRetry: false, canCancel: false });
  assert.deepEqual(jobActions({ ...failed, isAdmin: true, userId: "u2" }), { canRetry: true, canCancel: false });
  assert.deepEqual(
    jobActions({ type: "SOCIAL_UPLOAD", status: "RUNNING", createdBy: "u1", isAdmin: false, userId: "u1" }),
    { canRetry: false, canCancel: true },
  );
  assert.deepEqual(
    jobActions({ type: "DISCORD_STAGE", status: "FAILED", createdBy: null, isAdmin: true, userId: "admin" }),
    { canRetry: false, canCancel: false },
  );
});

test("linear exhausted retries map to FAILED; retry scope is write-scoped", () => {
  const now = Date.parse("2026-08-23T12:00:00.000Z");
  assert.equal(
    mapLinearStatus({ attempts: 5, lastError: "LINEAR_UNAVAILABLE", nextAttemptAt: "2026-08-23T13:00:00.000Z" }, now),
    "FAILED",
  );
  assert.equal(
    mapLinearStatus({ attempts: 2, lastError: "LINEAR_UNAVAILABLE", nextAttemptAt: "2026-08-23T13:00:00.000Z" }, now),
    "QUEUED",
  );
  assert.equal(
    mapLinearStatus({ attempts: 2, lastError: "LINEAR_UNAVAILABLE", nextAttemptAt: "2026-08-23T11:00:00.000Z" }, now),
    "RUNNING",
  );
  assert.equal(
    mapLinearStatus({ attempts: 0, lastError: null, nextAttemptAt: "2026-08-23T11:00:00.000Z" }, now),
    "QUEUED",
  );
  assert.equal(isDlqJob({ type: "LINEAR_SYNC", status: "QUEUED", attempts: 2 }), false);
  assert.equal(isDlqJob({ type: "LINEAR_SYNC", status: "FAILED", attempts: 2 }), false);
  assert.equal(isDlqJob({ type: "LINEAR_SYNC", status: "FAILED", attempts: 5 }), true);
  assert.equal(retryScopeForType("AGENT"), "actions:ai");
  assert.equal(retryScopeForType("LINEAR_SYNC"), "linear:write");
  assert.equal(retryScopeForType("SOCIAL_UPLOAD"), "write:social");
});

test("grok oauth_ready maps to degraded, not not_configured", () => {
  assert.equal(grokBotHealthTone("oauth_ready"), "degraded");
  assert.equal(grokBotHealthTone("online"), "connected");
  assert.equal(grokBotHealthTone("working"), "connected");
  assert.equal(grokBotHealthTone("key_only"), "degraded");
  assert.equal(grokBotHealthTone("waiting"), "degraded");
  assert.equal(grokBotHealthTone(null), "not_configured");
});

test("sanitizeHealthError never leaks bearer or MCP tokens", () => {
  const raw = "Bearer abcdefghijklmnop failed; token cos_mcp_secretvalue123 agk_alsoasecret cos_oa_oauthsecret";
  const cleaned = sanitizeHealthError(raw) ?? "";
  assert.equal(cleaned.includes("cos_mcp_secretvalue123"), false);
  assert.equal(cleaned.includes("cos_oa_oauthsecret"), false);
  assert.equal(cleaned.includes("abcdefghijklmnop"), false);
  assert.match(cleaned, /\[redacted\]/);
});

test("critical banner fires when every social rail is down or MCP is unauthenticated", () => {
  const allDown = deriveHealthBanner({
    integrations: [
      { id: "x", name: "X", group: "publisher", tone: "error", lastSuccessAt: null, lastError: "expired", testId: null, detail: null },
      { id: "tiktok", name: "TikTok", group: "publisher", tone: "not_configured", lastSuccessAt: null, lastError: null, testId: null, detail: null },
    ],
    mcpConfigured: true,
    activeTokenCount: 1,
    needsLogin: 0,
    stalled: 0,
  });
  assert.equal(allDown?.severity, "critical");
  const mcp = deriveHealthBanner({
    integrations: [],
    mcpConfigured: false,
    activeTokenCount: 0,
    needsLogin: 0,
    stalled: 0,
  });
  assert.equal(mcp?.severity, "critical");
  const stalled = deriveHealthBanner({
    integrations: [
      { id: "x", name: "X", group: "publisher", tone: "connected", lastSuccessAt: null, lastError: null, testId: null, detail: null },
    ],
    mcpConfigured: true,
    activeTokenCount: 1,
    needsLogin: 0,
    stalled: 3,
  });
  assert.equal(stalled?.severity, "warning");
});

test("successRate ignores in-flight jobs so widgets stay honest", () => {
  assert.equal(
    successRate([
      { status: "SUCCEEDED" },
      { status: "FAILED" },
      { status: "RUNNING" },
      { status: "QUEUED" },
    ]),
    0.5,
  );
  assert.equal(successRate([{ status: "RUNNING" }]), null);
});
