import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import { sanitizeText } from "@/lib/sanitize";
import {
  API_KEY_SCOPES,
  DEFAULT_HERMES_SCOPES,
  WEBHOOK_EVENT_TYPES,
  type ApiKeyScope,
  type AutonomyHealth,
  type AutonomySnapshot,
  type WebhookEventType,
} from "@/lib/autonomy";

import { DEFAULT_PLAYBOOK_POLICIES } from "@/lib/playbooks";
import { PLAYBOOK_PACKAGE_VERSION, deriveHermesConnection } from "@/lib/connect";

async function load_autonomy_auth() {
  return import("@/lib/server/autonomy-auth.server");
}
async function load_autonomy_audit() {
  return import("@/lib/server/autonomy-audit.server");
}
async function load_autonomy_events() {
  return import("@/lib/server/autonomy-events.server");
}
async function load_app_settings() {
  return import("@/lib/server/app-settings.server");
}
async function load_autonomy_policy() {
  return import("@/lib/server/autonomy-policy.server");
}
async function load_hermes_connect() {
  return import("@/lib/server/hermes-connect.server");
}

function paths() {
  return {
    apiBase: "/api/v1",
    mcp: "/api/mcp",
    inboundWebhook: "/api/webhooks/inbound",
  };
}

function saneWhen(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  if (time < Date.parse("2020-01-01T00:00:00.000Z") || time > Date.now() + 120_000) return null;
  return value;
}

async function snapshot(): Promise<AutonomySnapshot> {
  const [
    keys,
    mcpHash,
    mcpLast4,
    mcpUsed,
    webhookSecret,
    outbound,
    lastDelivery,
    byEvent,
    enabled,
    policies,
    audit,
    flags,
  ] =
    await Promise.all([
      (await load_autonomy_auth()).listApiKeyRows(),
      (await load_app_settings()).readAppSetting("MCP_TOKEN_HASH"),
      (await load_app_settings()).readAppSetting("MCP_TOKEN_LAST4"),
      (await load_app_settings()).readAppSetting("MCP_LAST_USED_AT"),
      (await load_app_settings()).readAppSetting("WEBHOOK_SIGNING_SECRET"),
      (await load_autonomy_events()).readOutboundConfig(),
      (await load_autonomy_events()).readLastDelivery(),
      (await load_autonomy_events()).readLastDeliveryByEvent(),
      (await load_autonomy_policy()).readAutomationEnabled(),
      (await load_autonomy_policy()).readPlaybookPolicies(),
      (await load_autonomy_audit()).listAuditLog(1),
      (await load_hermes_connect()).readConnectFlags(),
    ]);
  const keyUsed = keys
    .map((row) => saneWhen(row.lastUsedAt))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const auditAt = saneWhen(audit[0]?.createdAt);
  const lastActivityAt = [saneWhen(mcpUsed), keyUsed, auditAt].filter(Boolean).sort().at(-1) ?? null;
  const active = keys.filter((row) => !row.revokedAt);
  const hermesConnection = deriveHermesConnection({
    hasHermesKey: active.length > 0,
    keyLastUsedAt: keyUsed ?? null,
  });
  return {
    keys,
    mcpConfigured: Boolean(mcpHash),
    mcpLast4: mcpLast4 || null,
    mcpLastUsedAt: saneWhen(mcpUsed),
    webhookConfigured: Boolean(webhookSecret),
    webhookLast4: webhookSecret ? webhookSecret.slice(-4) : null,
    outboundUrl: outbound.destinationUrl,
    outboundEvents: outbound.events,
    lastDelivery: {
      at: saneWhen(lastDelivery.at),
      status: lastDelivery.status,
      eventType: lastDelivery.eventType,
    },
    lastDeliveryByEvent: byEvent,
    connect: {
      pastedIntoHermes: flags.pastedIntoHermes,
      pastedAt: flags.pastedAt,
      socialPolicyAckedAt: flags.socialPolicyAckedAt,
      outboundSkipped: flags.outboundSkipped,
      hermesConnection,
      playbookPackageVersion: PLAYBOOK_PACKAGE_VERSION,
    },
    paths: paths(),
    automationEnabled: enabled,
    policies: policies ?? DEFAULT_PLAYBOOK_POLICIES,
    lastActivityAt,
  };
}

export const getAutonomySnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AutonomySnapshot> => {
    await requireAdmin(context.userId);
    return snapshot();
  });

export const listAutonomyAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_autonomy_audit()).listAuditLog(100);
  });

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1),
});

export const createAutonomyKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CreateKeySchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
    const scopes = data.scopes.length ? data.scopes : [...DEFAULT_HERMES_SCOPES];
    const row = await (await load_autonomy_auth()).insertApiKey({
      name: sanitizeText(data.name),
      scopes: scopes as ApiKeyScope[],
      plaintext,
      actorId: context.userId,
    });
    return { key: row, plaintext };
  });

export const createHermesPresetKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
    const row = await (await load_autonomy_auth()).insertApiKey({
      name: "Hermes Agent",
      scopes: [...DEFAULT_HERMES_SCOPES],
      plaintext,
      actorId: context.userId,
    });
    return { key: row, plaintext };
  });

export const revokeAutonomyKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    await (await load_autonomy_auth()).revokeApiKey(id);
    try {
      const team = await import("@/lib/server/team.server");
      await team.unlinkAutomationSeatsByTokenId(id);
    } catch {
      /* seats optional */
    }
    return { ok: true as const };
  });

export const rotateAutonomyKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const existing = (await (await load_autonomy_auth()).listApiKeyRows()).find((row) => row.id === id);
    if (!existing) throw new Error("KEY_MISSING");
    await (await load_autonomy_auth()).revokeApiKey(id);
    try {
      const team = await import("@/lib/server/team.server");
      await team.unlinkAutomationSeatsByTokenId(id);
    } catch {
      /* seats optional */
    }
    const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
    const key = await (await load_autonomy_auth()).insertApiKey({
      name: existing.name,
      scopes: existing.scopes.length ? existing.scopes : [...DEFAULT_HERMES_SCOPES],
      plaintext,
      actorId: context.userId,
    });
    return { key, plaintext };
  });

export const rotateMcpToken = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const plaintext = (await load_autonomy_auth()).generateMcpTokenPlaintext();
    await (await load_app_settings()).writeAppSetting("MCP_TOKEN_HASH", (await load_autonomy_auth()).hashToken(plaintext));
    await (await load_app_settings()).writeAppSetting("MCP_TOKEN_LAST4", (await load_autonomy_auth()).last4Of(plaintext));
    await (await load_app_settings()).writeAppSetting("MCP_LAST_USED_AT", "");
    return { plaintext, last4: (await load_autonomy_auth()).last4Of(plaintext) };
  });

export const rotateWebhookSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const plaintext = (await load_autonomy_auth()).generateWebhookSecretPlaintext();
    await (await load_app_settings()).writeAppSetting("WEBHOOK_SIGNING_SECRET", plaintext);
    return { plaintext, last4: (await load_autonomy_auth()).last4Of(plaintext) };
  });

const OutboundSchema = z.object({
  destinationUrl: z.string().trim().max(500).nullable(),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)),
});

export const saveOutboundWebhook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => OutboundSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const url = data.destinationUrl?.trim() || null;
    if (url && !url.startsWith("https://")) throw new Error("HTTPS_ONLY");
    await (await load_autonomy_events()).writeOutboundConfig({
      destinationUrl: url,
      events: data.events as WebhookEventType[],
    });
    return { ok: true as const };
  });

export const testOutboundWebhook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_autonomy_events()).emitTestPing();
  });

export const markPlaybookPasted = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_hermes_connect()).writeConnectFlags({
      pastedIntoHermes: true,
      pastedAt: new Date().toISOString(),
    });
  });

export const ackSocialVmPolicy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_hermes_connect()).writeConnectFlags({
      socialPolicyAckedAt: new Date().toISOString(),
    });
  });

const SkipOutboundSchema = z.object({ skipped: z.boolean() });

export const skipOutboundConnect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SkipOutboundSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return (await load_hermes_connect()).writeConnectFlags({ outboundSkipped: data.skipped });
  });

export const getConnectStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_hermes_connect()).buildConnectStatus();
  });

export const getPlaybookPackage = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    return (await load_hermes_connect()).buildPlaybookPackageText();
  });

const PoliciesSchema = z.object({
  enabled: z.boolean(),
  policies: z.object({
    autoMarkPayments: z.boolean(),
    autoAdvanceStageWithoutEvidence: z.boolean(),
    autoCreateClientFromClosedLead: z.boolean(),
    analyticsPullConcurrency: z.enum(["low", "medium"]),
    socialAutoStartForUpload: z.boolean().optional(),
    socialDefaultUploadMode: z.enum(["draft", "publish"]).optional(),
    socialMaxAutoRetries: z.union([z.literal(1), z.literal(2)]).optional(),
    socialMaxBulkJobsPerRun: z.number().int().min(1).max(20).optional(),
    socialIdleStopMinutes: z.number().int().min(5).max(240).optional(),
    socialRequireLoggedInPlatformsOnly: z.boolean().optional(),
    skillsAutoPublishAgent: z.boolean().optional(),
    skillsMinToolCallsToDistill: z.number().int().min(3).max(20).optional(),
    skillsAllowNetwork: z.boolean().optional(),
    skillsProposeOnAgentSuccess: z.boolean().optional(),
  }),
});

export const saveAutomationSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => PoliciesSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const previous = await (await load_autonomy_policy()).readPlaybookPolicies();
    await (await load_autonomy_policy()).writeAutomationEnabled(data.enabled);
    const next = {
      ...DEFAULT_PLAYBOOK_POLICIES,
      ...data.policies,
      socialAutoStartForUpload:
        data.policies.socialAutoStartForUpload ?? DEFAULT_PLAYBOOK_POLICIES.socialAutoStartForUpload,
      socialDefaultUploadMode:
        data.policies.socialDefaultUploadMode ?? DEFAULT_PLAYBOOK_POLICIES.socialDefaultUploadMode,
      socialMaxAutoRetries:
        data.policies.socialMaxAutoRetries ?? DEFAULT_PLAYBOOK_POLICIES.socialMaxAutoRetries,
      socialMaxBulkJobsPerRun:
        data.policies.socialMaxBulkJobsPerRun ?? DEFAULT_PLAYBOOK_POLICIES.socialMaxBulkJobsPerRun,
      socialIdleStopMinutes:
        data.policies.socialIdleStopMinutes ?? DEFAULT_PLAYBOOK_POLICIES.socialIdleStopMinutes,
      socialRequireLoggedInPlatformsOnly:
        data.policies.socialRequireLoggedInPlatformsOnly ??
        DEFAULT_PLAYBOOK_POLICIES.socialRequireLoggedInPlatformsOnly,
      skillsAutoPublishAgent:
        data.policies.skillsAutoPublishAgent ?? DEFAULT_PLAYBOOK_POLICIES.skillsAutoPublishAgent,
      skillsMinToolCallsToDistill:
        data.policies.skillsMinToolCallsToDistill ??
        DEFAULT_PLAYBOOK_POLICIES.skillsMinToolCallsToDistill,
      skillsAllowNetwork:
        data.policies.skillsAllowNetwork ?? DEFAULT_PLAYBOOK_POLICIES.skillsAllowNetwork,
      skillsProposeOnAgentSuccess:
        data.policies.skillsProposeOnAgentSuccess ??
        DEFAULT_PLAYBOOK_POLICIES.skillsProposeOnAgentSuccess,
    };
    await (await load_autonomy_policy()).writePlaybookPolicies(next);
    if (previous.socialAutoStartForUpload !== next.socialAutoStartForUpload) {
      await (await load_hermes_connect()).writeConnectFlags({ socialPolicyAckedAt: new Date().toISOString() });
      const historyRaw = (await (await load_app_settings()).readAppSetting("AUTOMATION_POLICY_AUDIT")) ?? "[]";
      let history: unknown[] = [];
      try {
        history = JSON.parse(historyRaw) as unknown[];
      } catch {
        history = [];
      }
      history = [
        {
          at: new Date().toISOString(),
          actorId: context.userId,
          field: "social.auto_start_for_upload",
          from: previous.socialAutoStartForUpload,
          to: next.socialAutoStartForUpload,
        },
        ...history,
      ].slice(0, 50);
      await (await load_app_settings()).writeAppSetting("AUTOMATION_POLICY_AUDIT", JSON.stringify(history));
    }
    return { ok: true as const, enabled: data.enabled, policies: await (await load_autonomy_policy()).readPlaybookPolicies() };
  });

export const getAutonomyHealth = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AutonomyHealth> => {
    if (!context.userId) throw new Error("Unauthorized");
    const [keys, mcpHash, webhookSecret, enabled, audit] = await Promise.all([
      (await load_autonomy_auth()).listApiKeyRows(),
      (await load_app_settings()).readAppSetting("MCP_TOKEN_HASH"),
      (await load_app_settings()).readAppSetting("WEBHOOK_SIGNING_SECRET"),
      (await load_autonomy_policy()).readAutomationEnabled(),
      (await load_autonomy_audit()).listAuditLog(1),
    ]);
    const latest = audit[0];
    const keyUsed = keys
      .map((row) => (row.lastUsedAt && new Date(row.lastUsedAt).getTime() > Date.parse("2020-01-01") ? row.lastUsedAt : null))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    const lastActivityAt = [latest?.createdAt, keyUsed].filter(Boolean).sort().at(-1) ?? null;
    let social = null;
    try {
      const { peekSocialHealth } = await import("@/lib/server/social");
      social = await peekSocialHealth();
    } catch {
      social = null;
    }
    return {
      automationEnabled: enabled,
      mcpConfigured: Boolean(mcpHash),
      webhookConfigured: Boolean(webhookSecret),
      activeKeys: keys.filter((row) => !row.revokedAt).length,
      lastActivityAt,
      lastAction: latest
        ? {
            action: latest.action,
            source: latest.source,
            playbookId: latest.playbookId,
            result: latest.result,
            at: latest.createdAt,
            actorLabel: latest.actorLabel,
          }
        : null,
      hermesConnection: deriveHermesConnection({
        hasHermesKey: keys.filter((row) => !row.revokedAt).length > 0,
        keyLastUsedAt: keyUsed ?? null,
      }),
      grokBot: await (async () => {
        try {
          const grok = await import("@/lib/server/grok-bot.server");
          const snap = await grok.buildGrokBotSnapshot();
          return { connection: snap.connection, queued: snap.queued, claimed: snap.claimed };
        } catch {
          return null;
        }
      })(),
      social,
    };
  });

