/**
 * Health control plane. Reads existing job tables — no parallel ledger.
 * Retry is idempotent. Cancel is cooperative. Jobs never auto-start Social Machine.
 */
import { AGENT_MAX_CONCURRENT, AGENT_MAX_STEPS, normalizePreset } from "@/lib/agent";
import { SOCIAL_PLATFORMS } from "@/lib/entities";
import type { AppRole } from "@/lib/entities";
import {
  HEALTH_DLQ_SETTING,
  applyStalled,
  computeSlos,
  deriveHealthBanner,
  hrefForType,
  integrationTone,
  isDismissed,
  isDlqJob,
  jobActions,
  linearEntityForType,
  mapAgentStatus,
  mapLinearStatus,
  mapPerformanceStatus,
  mapRenderStatus,
  mapSocialStatus,
  parseDlqDismissed,
  publisherTone,
  sanitizeHealthError,
  type DlqDismissKey,
  type HealthHermesRuntime,
  type HealthIntegrationCard,
  type HealthJob,
  type HealthJobType,
  type HealthSnapshot,
  type SloSample,
} from "@/lib/health";
import { INTEGRATION_COPY } from "@/lib/integrations";
import { PLATFORM_LABELS } from "@/lib/social";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";

function nowIso() {
  return new Date().toISOString();
}

async function readDismissed(): Promise<DlqDismissKey[]> {
  const raw = await readAppSetting(HEALTH_DLQ_SETTING);
  if (!raw) return [];
  try {
    return parseDlqDismissed(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeDismissed(rows: DlqDismissKey[]): Promise<void> {
  await writeAppSetting(HEALTH_DLQ_SETTING, JSON.stringify(rows.slice(0, 400)));
}

export async function buildHealthSnapshot(input: {
  userId: string;
  role: AppRole | null;
}): Promise<HealthSnapshot> {
  const nowMs = Date.now();
  const isAdmin = input.role === "admin";
  const [
    clients,
    socialJobs,
    socialPosts,
    socialHealth,
    renders,
    agentRuns,
    agentActive,
    performanceQueue,
    linearQueue,
    linearLinks,
    approvals,
    discordAgent,
    costGuard,
    policies,
    automationEnabled,
    integrationsMeta,
    publishers,
    hermes,
    keys,
    mcpTokens,
    mcpLast4,
    mcpUsed,
    mcpHash,
    audit,
    xai,
    twitch,
    grok,
  ] = await Promise.all([
    import("@/lib/server/clients").then((mod) => mod.readClients()).catch(() => []),
    import("@/lib/server/social").then((mod) => mod.readSocialJobs()).catch(() => []),
    import("@/lib/server/social").then((mod) => mod.readSocialPosts()).catch(() => []),
    import("@/lib/server/social").then((mod) => mod.peekSocialHealth()).catch(() => ({
      state: "not_configured",
      configured: false,
      needsLogin: 0,
      failedJobs: 0,
      needsAttention: 0,
    })),
    import("@/lib/server/library.server").then((mod) => mod.listRenders()).catch(() => []),
    import("@/lib/server/agent.server").then((mod) => mod.listAgentRuns(80)).catch(() => []),
    import("@/lib/server/agent.server").then((mod) => mod.countActiveAgentRuns()).catch(() => 0),
    import("@/lib/server/performance-fetch.server")
      .then((mod) => mod.listRecentPerformanceQueue(40))
      .catch(() => []),
    import("@/lib/server/linear.server").then((mod) => mod.listLinearSyncQueue(40)).catch(() => []),
    import("@/lib/server/linear.server").then((mod) => mod.listLinearLinks()).catch(() => []),
    import("@/lib/server/approvals.server")
      .then((mod) => mod.listApprovalRequests({ status: "PENDING", limit: 80 }))
      .catch(() => []),
    import("@/lib/server/discord-agent.server")
      .then((mod) => mod.readDiscordAgentHealth())
      .catch(() => ({ lastRunAt: null, lastOk: null, summary: null, matched: 0, skipped: 0 })),
    import("@/lib/server/social-ops.server")
      .then((mod) => mod.socialGetCostGuard())
      .catch(() => ({
        running: false,
        durationMs: null,
        autoStopMinutes: 20,
        activeJobs: 0,
        recommendStop: false,
      })),
    import("@/lib/server/autonomy-policy.server")
      .then((mod) => mod.readPlaybookPolicies())
      .catch(() => null),
    import("@/lib/server/autonomy-policy.server")
      .then((mod) => mod.readAutomationEnabled())
      .catch(() => true),
    import("@/lib/server/integrations")
      .then((mod) => mod.readIntegrationsSnapshot(input.userId))
      .catch(() => null),
    Promise.all(
      SOCIAL_PLATFORMS.map((platform) =>
        import("@/lib/server/social-oauth.server")
          .then((mod) => mod.publisherStatusFor(platform))
          .catch(() => null),
      ),
    ),
    import("@/lib/server/hermes-connect.server")
      .then((mod) => mod.buildConnectStatus())
      .catch(() => null),
    import("@/lib/server/autonomy-auth.server")
      .then((mod) => mod.listApiKeyRows())
      .catch(() => []),
    import("@/lib/server/remote-mcp.server")
      .then((mod) => mod.listRemoteMcpTokens())
      .catch(() => []),
    import("@/lib/server/app-settings.server").then((mod) => mod.readAppSetting("MCP_TOKEN_LAST4")),
    import("@/lib/server/app-settings.server").then((mod) => mod.readAppSetting("MCP_LAST_USED_AT")),
    import("@/lib/server/app-settings.server").then((mod) => mod.readAppSetting("MCP_TOKEN_HASH")),
    import("@/lib/server/autonomy-audit.server")
      .then((mod) => mod.listAuditLog(8))
      .catch(() => []),
    import("@/lib/server/xai.server").then((mod) => mod.xaiRateLimitSnapshot()),
    import("@/lib/server/twitch.server")
      .then((mod) => mod.loadTwitchConfig())
      .catch(() => null),
    import("@/lib/server/grok-bot.server")
      .then((mod) => mod.buildGrokBotSnapshot())
      .catch(() => null),
  ]);

  let oauthGrantCount = 0;
  try {
    const oauth = await import("@/lib/server/mcp-oauth.server");
    oauthGrantCount = await oauth.countActiveMcpOAuthGrants();
  } catch {
    oauthGrantCount = 0;
  }

  const clientName = new Map(clients.filter((row) => !row.deletedAt).map((row) => [row.id, row.name]));
  const dismissed = await readDismissed();
  const views = (await import("@/lib/server/social")).attachPostsToJobs(socialJobs, socialPosts);
  const linkMap = new Map(
    linearLinks.map((row) => [`${row.agencyEntityType}:${row.agencyEntityId}`, row.linearUrl]),
  );

  const jobs: HealthJob[] = [];

  for (const view of views) {
    const status = applyStalled(mapSocialStatus(view.status), view.updatedAt, nowMs);
    const attempts = view.posts.filter((post) => post.status === "failed" || post.status === "needs_attention").length;
    const base: HealthJob = {
      id: view.id,
      type: "SOCIAL_UPLOAD",
      status,
      clientId: view.clientId,
      clientName: clientName.get(view.clientId) ?? null,
      provider: view.preferredRail ?? view.platforms.join(", "),
      progressPercent: view.uploadPercent,
      startedAt: view.createdAt,
      updatedAt: view.updatedAt,
      error: sanitizeHealthError(view.errorCode),
      attempts,
      createdBy: view.createdBy,
      href: hrefForType("SOCIAL_UPLOAD"),
      linearUrl: linkMap.get(`SocialUploadJob:${view.id}`) ?? null,
      assetId: view.assetId,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  for (const render of renders) {
    const status = applyStalled(mapRenderStatus(render.status), render.finishedAt ?? render.startedAt ?? render.createdAt, nowMs);
    const updatedAt = render.finishedAt ?? render.startedAt ?? render.createdAt;
    const base: HealthJob = {
      id: render.id,
      type: "RENDER",
      status,
      clientId: render.clientId,
      clientName: render.clientId ? clientName.get(render.clientId) ?? null : null,
      provider: render.worker,
      progressPercent: render.progressPercent,
      startedAt: render.startedAt,
      updatedAt,
      error: sanitizeHealthError(render.error),
      attempts: render.attempts,
      createdBy: render.createdBy,
      href: hrefForType("RENDER"),
      linearUrl: linkMap.get(`RenderJob:${render.id}`) ?? null,
      assetId: render.sourceAssetId,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  for (const run of agentRuns) {
    const updatedAt = run.finishedAt ?? run.startedAt;
    const status = applyStalled(mapAgentStatus(run.status), updatedAt, nowMs);
    const base: HealthJob = {
      id: run.id,
      type: "AGENT",
      status,
      clientId: run.clientId,
      clientName: run.clientId ? clientName.get(run.clientId) ?? null : null,
      provider: run.provider ?? run.model,
      progressPercent: Math.min(100, Math.round((run.iterationCount / AGENT_MAX_STEPS) * 100)),
      startedAt: run.startedAt,
      updatedAt,
      error: sanitizeHealthError(run.errorCode ?? run.summary),
      attempts: run.iterationCount,
      createdBy: run.createdBy,
      href: hrefForType("AGENT"),
      linearUrl: linkMap.get(`AgentRun:${run.id}`) ?? null,
      assetId: null,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  for (const row of performanceQueue) {
    const status = applyStalled(mapPerformanceStatus(row.status), row.runAt, nowMs);
    const base: HealthJob = {
      id: row.id,
      type: "PERFORMANCE_FETCH",
      status,
      clientId: null,
      clientName: null,
      provider: row.platform,
      progressPercent: row.status === "DONE" ? 100 : row.status === "FAILED" ? 0 : 40,
      startedAt: row.createdAt,
      updatedAt: row.runAt,
      error: sanitizeHealthError(row.lastError),
      attempts: row.attempts,
      createdBy: null,
      href: hrefForType("PERFORMANCE_FETCH"),
      linearUrl: null,
      assetId: null,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  for (const row of linearQueue) {
    const status = applyStalled(mapLinearStatus(row, nowMs), row.nextAttemptAt, nowMs);
    const base: HealthJob = {
      id: row.id,
      type: "LINEAR_SYNC",
      status,
      clientId: null,
      clientName: null,
      provider: row.kind,
      progressPercent: null,
      startedAt: row.createdAt,
      updatedAt: row.nextAttemptAt,
      error: sanitizeHealthError(row.lastError),
      attempts: row.attempts,
      createdBy: null,
      href: hrefForType("LINEAR_SYNC"),
      linearUrl: null,
      assetId: null,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  if (discordAgent.lastRunAt) {
    const status = discordAgent.lastOk === false ? "FAILED" : "SUCCEEDED";
    const base: HealthJob = {
      id: "discord-stage-last",
      type: "DISCORD_STAGE",
      status,
      clientId: null,
      clientName: null,
      provider: "Discord",
      progressPercent: 100,
      startedAt: discordAgent.lastRunAt,
      updatedAt: discordAgent.lastRunAt,
      error: discordAgent.lastOk === false ? sanitizeHealthError(discordAgent.summary) : null,
      attempts: 1,
      createdBy: null,
      href: hrefForType("DISCORD_STAGE"),
      linearUrl: null,
      assetId: null,
      canRetry: false,
      canCancel: false,
      dlq: false,
    };
    jobs.push(finalizeJob(base, dismissed, isAdmin, input.userId));
  }

  jobs.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const visible = isAdmin
    ? jobs
    : jobs.filter((job) => job.createdBy === input.userId || job.createdBy == null);

  const samples: SloSample[] = jobs.map((job) => ({
    type: job.type,
    status: job.status,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    finishedAt: job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED" ? job.updatedAt : null,
  }));
  const slos = computeSlos({
    samples,
    awaitingApproval: approvals.length + jobs.filter((job) => job.status === "AWAITING_APPROVAL").length,
    needsLogin: socialHealth.needsLogin,
    nowMs,
  });

  const integrationCards = buildIntegrationCards({
    integrations: integrationsMeta,
    publishers: publishers.filter(Boolean),
    hermes,
    grok,
    mcpConfigured: Boolean(mcpHash) || mcpTokens.some((row) => !row.revokedAt) || oauthGrantCount > 0,
    twitchConfigured: Boolean(twitch),
  });

  const activeHermes = keys.filter((row) => !row.revokedAt);
  const activeMcp = mcpTokens.filter((row) => !row.revokedAt);
  const hermesKey = activeHermes.find((row) => row.name.toLowerCase().includes("hermes")) ?? activeHermes[0] ?? null;

  const hermesRuntime: HealthHermesRuntime = {
    connection: hermes?.hermesConnection ?? "not_connected",
    lastLoginAt: hermes?.keyLastUsedAt ?? hermesKey?.lastUsedAt ?? null,
    keyLast4: hermes?.keyLast4 ?? hermesKey?.last4 ?? null,
    keyName: hermes?.keyName ?? hermesKey?.name ?? null,
    playbookPackageVersion: hermes?.playbookPackageVersion ?? "—",
    pastedIntoHermes: hermes?.pastedIntoHermes ?? false,
    pastedAt: hermes?.pastedAt ?? null,
    lastDelivery: hermes?.lastDelivery ?? { at: null, status: null, eventType: null },
    scopes: hermesKey?.scopes ?? [],
    mcpConfigured: Boolean(mcpHash) || activeMcp.length > 0 || oauthGrantCount > 0,
    mcpLastUsedAt: mcpUsed || activeMcp.map((row) => row.lastUsedAt).filter(Boolean).sort().at(-1) || null,
    mcpLast4: mcpLast4 || activeMcp[0]?.last4 || null,
    grokBot: grok
      ? { connection: grok.connection, queued: grok.queued, claimed: grok.claimed }
      : null,
    recentAudit: audit.map((row) => ({
      id: row.id,
      action: row.action,
      result: row.result,
      createdAt: row.createdAt,
      actorLabel: row.actorLabel,
      errorCode: row.errorCode,
      source: row.source,
    })),
    revokedTokenCount: mcpTokens.filter((row) => row.revokedAt).length + keys.filter((row) => row.revokedAt).length,
    activeTokenCount: activeMcp.length + activeHermes.length + oauthGrantCount,
  };

  const banner = deriveHealthBanner({
    integrations: integrationCards,
    mcpConfigured: hermesRuntime.mcpConfigured,
    activeTokenCount: hermesRuntime.activeTokenCount,
    needsLogin: socialHealth.needsLogin,
    stalled: slos.stalled,
  });

  return {
    jobs: visible,
    slos,
    costGuards: {
      daytona: costGuard,
      agentActive,
      agentMax: AGENT_MAX_CONCURRENT,
      automationPaused: automationEnabled === false,
      socialAutoStart: policies?.socialAutoStartForUpload === true,
      xai: {
        recent429: xai.recent429,
        retrying: xai.retrying,
        backoffUntil: xai.backoffUntil,
        message: xai.message,
      },
      higgsfieldError: integrationsMeta?.items.higgsfield.lastError ?? null,
    },
    integrations: integrationCards,
    hermes: hermesRuntime,
    banner,
    clients: clients.filter((row) => !row.deletedAt).map((row) => ({ id: row.id, name: row.name })),
    role: input.role,
    generatedAt: nowIso(),
    discordAgent,
  };
}

function finalizeJob(
  job: HealthJob,
  dismissed: readonly DlqDismissKey[],
  isAdmin: boolean,
  userId: string,
): HealthJob {
  const actions = jobActions({
    type: job.type,
    status: job.status,
    createdBy: job.createdBy,
    isAdmin,
    userId,
  });
  const dlq = isDlqJob(job) && !isDismissed(job, dismissed);
  return { ...job, ...actions, dlq };
}

function buildIntegrationCards(input: {
  integrations: Awaited<ReturnType<typeof import("@/lib/server/integrations").readIntegrationsSnapshot>> | null;
  publishers: Array<Awaited<ReturnType<typeof import("@/lib/server/social-oauth.server").publisherStatusFor>> | null>;
  hermes: Awaited<ReturnType<typeof import("@/lib/server/hermes-connect.server").buildConnectStatus>> | null;
  grok: Awaited<ReturnType<typeof import("@/lib/server/grok-bot.server").buildGrokBotSnapshot>> | null;
  mcpConfigured: boolean;
  twitchConfigured: boolean;
}): HealthIntegrationCard[] {
  const cards: HealthIntegrationCard[] = [];
  for (const pub of input.publishers) {
    if (!pub) continue;
    cards.push({
      id: `pub:${pub.platform}`,
      name: PLATFORM_LABELS[pub.platform],
      group: "publisher",
      tone: publisherTone(pub),
      lastSuccessAt: null,
      lastError: pub.reason,
      testId: pub.platform === "x" ? "x" : null,
      detail: pub.handle ?? pub.note,
    });
  }
  const items = input.integrations?.items;
  if (items) {
    for (const id of ["ai", "higgsfield", "daytona", "linear", "whop", "discord", "youtube"] as const) {
      const row = items[id];
      if (!row) continue;
      cards.push({
        id,
        name: INTEGRATION_COPY[id].name,
        group: id === "daytona" || id === "ai" ? "runtime" : "ops",
        tone: integrationTone(row),
        lastSuccessAt: row.lastError ? null : row.lastTestedAt,
        lastError: row.lastError,
        testId: id,
        detail: row.last4 ? `…${row.last4}` : null,
      });
    }
  }
  cards.push({
    id: "mcp",
    name: "ClippyOS MCP",
    group: "runtime",
    tone: input.mcpConfigured ? "connected" : "not_configured",
    lastSuccessAt: input.hermes ? null : null,
    lastError: null,
    testId: null,
    detail: input.mcpConfigured ? "OAuth or keys ready" : "Connect Grok with OAuth in Settings",
  });
  const hermesTone =
    input.hermes?.hermesConnection === "fully_connected"
      ? "connected"
      : input.hermes?.hermesConnection === "key_only"
        ? "degraded"
        : "not_configured";
  cards.push({
    id: "hermes",
    name: "Hermes",
    group: "runtime",
    tone: hermesTone,
    lastSuccessAt: input.hermes?.keyLastUsedAt ?? null,
    lastError: null,
    testId: null,
    detail: input.hermes?.playbookPackageVersion ?? null,
  });
  const grokTone =
    input.grok?.connection === "online" || input.grok?.connection === "working"
      ? "connected"
      : input.grok?.connection === "waiting" || input.grok?.connection === "key_only"
        ? "degraded"
        : "not_configured";
  cards.push({
    id: "grok-bot",
    name: "Grok Bot",
    group: "runtime",
    tone: grokTone,
    lastSuccessAt: input.grok?.lastHeartbeatAt ?? input.grok?.keyLastUsedAt ?? null,
    lastError: null,
    testId: null,
    detail: input.grok ? `${input.grok.queued} queued` : null,
  });
  cards.push({
    id: "twitch",
    name: "Twitch",
    group: "ops",
    tone: input.twitchConfigured ? "connected" : "not_configured",
    lastSuccessAt: null,
    lastError: null,
    testId: null,
    detail: input.twitchConfigured ? "Helix connected" : "Not configured",
  });
  return cards;
}

export async function retryHealthJob(input: {
  actorId: string;
  type: HealthJobType;
  id: string;
  isAdmin: boolean;
}): Promise<{ id: string; type: HealthJobType; note?: string }> {
  await assertJobAccess(input);
  if (input.type === "DISCORD_STAGE") throw new Error("VALIDATION");
  if (input.type === "SOCIAL_UPLOAD") {
    const { socialRetryUploadJob } = await import("@/lib/server/social-ops.server");
    const next = await socialRetryUploadJob({ actorId: input.actorId, jobId: input.id });
    return { id: next.id, type: input.type };
  }
  if (input.type === "RENDER") {
    const { retryRender } = await import("@/lib/server/library-pipeline.server");
    const next = await retryRender({ actorId: input.actorId, jobId: input.id });
    return { id: next.id, type: input.type };
  }
  if (input.type === "AGENT") {
    const { getAgentRun } = await import("@/lib/server/agent.server");
    const { startAgentRun } = await import("@/lib/server/agent-loop.server");
    const run = await getAgentRun(input.id);
    if (!run) throw new Error("JOB_MISSING");
    const started = await startAgentRun({
      goal: run.goal,
      preset: normalizePreset(run.preset),
      clientId: run.clientId,
      skillId: run.skillId,
      createdBy: input.actorId,
      triggeredByTeamMemberId: run.triggeredByTeamMemberId,
    });
    return { id: started.id, type: input.type, note: "Started a new run with the same goal. The original run is unchanged." };
  }
  if (input.type === "PERFORMANCE_FETCH") {
    const { retryPerformanceFetch } = await import("@/lib/server/performance-fetch.server");
    const next = await retryPerformanceFetch(input.id);
    return { id: next.id, type: input.type };
  }
  if (input.type === "LINEAR_SYNC") {
    const { retryLinearSync } = await import("@/lib/server/linear.server");
    const next = await retryLinearSync(input.id);
    return { id: next.id, type: input.type };
  }
  throw new Error("VALIDATION");
}

export async function cancelHealthJob(input: {
  actorId: string;
  type: HealthJobType;
  id: string;
  isAdmin: boolean;
}): Promise<{ id: string; type: HealthJobType }> {
  await assertJobAccess(input);
  if (input.type === "SOCIAL_UPLOAD") {
    const { socialCancelUploadJob } = await import("@/lib/server/social-ops.server");
    const next = await socialCancelUploadJob({ actorId: input.actorId, jobId: input.id });
    return { id: next.id, type: input.type };
  }
  if (input.type === "RENDER") {
    const { cancelRender } = await import("@/lib/server/library-pipeline.server");
    const next = await cancelRender({ actorId: input.actorId, jobId: input.id });
    return { id: next.id, type: input.type };
  }
  if (input.type === "AGENT") {
    const { cancelAgentRun } = await import("@/lib/server/agent-loop.server");
    await cancelAgentRun(input.id);
    return { id: input.id, type: input.type };
  }
  throw new Error("VALIDATION");
}

export async function dismissDlqJob(input: { type: HealthJobType; id: string }): Promise<void> {
  const current = await readDismissed();
  if (current.some((row) => row.type === input.type && row.id === input.id)) return;
  current.push({ type: input.type, id: input.id });
  await writeDismissed(current);
}

export async function createLinearFromFail(input: {
  actorId: string;
  type: HealthJobType;
  id: string;
  isAdmin: boolean;
}): Promise<{ url: string | null; identifier: string | null }> {
  await assertJobAccess(input);
  const snapshot = await buildHealthSnapshot({ userId: input.actorId, role: input.isAdmin ? "admin" : "member" });
  const job = snapshot.jobs.find((row) => row.type === input.type && row.id === input.id);
  if (!job) throw new Error("JOB_MISSING");
  const entity = linearEntityForType(input.type);
  const { createLinearIssue } = await import("@/lib/server/linear.server");
  const created = await createLinearIssue({
    title: `[Health] ${job.type} ${job.status}: ${job.clientName ?? job.id.slice(0, 8)}`,
    description: [
      `Type: ${job.type}`,
      `Status: ${job.status}`,
      job.error ? `Error: ${job.error}` : null,
      job.provider ? `Provider: ${job.provider}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    state: "backlog",
    labels: ["health", "failed-job"],
    linkTo: entity ? { type: entity, id: job.id } : null,
    actorId: input.actorId,
  });
  return { url: created.issue.url || created.link?.linearUrl || null, identifier: created.issue.identifier || null };
}

async function assertJobAccess(input: {
  actorId: string;
  type: HealthJobType;
  id: string;
  isAdmin: boolean;
}): Promise<void> {
  if (input.isAdmin) return;
  if (input.type === "PERFORMANCE_FETCH" || input.type === "LINEAR_SYNC" || input.type === "DISCORD_STAGE") {
    throw new Error("Forbidden");
  }
  if (input.type === "SOCIAL_UPLOAD") {
    const { readSocialJobs } = await import("@/lib/server/social");
    const hit = (await readSocialJobs()).find((row) => row.id === input.id);
    if (!hit) throw new Error("JOB_MISSING");
    if (hit.createdBy && hit.createdBy !== input.actorId) throw new Error("Forbidden");
    return;
  }
  if (input.type === "RENDER") {
    const { listRenders } = await import("@/lib/server/library.server");
    const hit = (await listRenders()).find((row) => row.id === input.id);
    if (!hit) throw new Error("JOB_MISSING");
    if (hit.createdBy && hit.createdBy !== input.actorId) throw new Error("Forbidden");
    return;
  }
  if (input.type === "AGENT") {
    const { getAgentRun } = await import("@/lib/server/agent.server");
    const hit = await getAgentRun(input.id);
    if (!hit) throw new Error("JOB_MISSING");
    if (hit.createdBy && hit.createdBy !== input.actorId) throw new Error("Forbidden");
  }
}
