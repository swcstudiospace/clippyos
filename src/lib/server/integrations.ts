import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin, getUserRole, getOperatorAccess, requireSecretEditor } from "@/lib/server/access";

import {
  INTEGRATION_IDS,
  type IntegrationCardStatus,
  type IntegrationHealth,
  type IntegrationId,
  type IntegrationMeta,
  type IntegrationsSnapshot,
} from "@/lib/integrations";

async function load_app_settings() {
  return import("@/lib/server/app-settings.server");
}
async function load_discord() {
  return import("@/lib/server/discord.server");
}
async function load_discord_agent() {
  return import("@/lib/server/discord-agent.server");
}

const META_KEY = "INTEGRATION_META";
const FIRST_LAUNCH_KEY = "FIRST_LAUNCH_COMPLETED";

type MetaBlob = Partial<Record<IntegrationId, IntegrationMeta>> & {
  discordAgent?: unknown;
};

const testLock = new Map<string, number>();

function emptyMeta(): IntegrationMeta {
  return { lastTestedAt: null, lastError: null, lastOk: null };
}

function saneIso(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() < 2020) return null;
  return value;
}

function sanitizeError(message: string): string {
  return message
    .replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]")
    .replace(/lin_api_[a-zA-Z0-9]+/g, "[redacted]")
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/xai-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/ghp_[a-zA-Z0-9]+/g, "[redacted]")
    .replace(/Bot\s+[A-Za-z0-9._-]+/g, "Bot [redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 180);
}

async function readMeta(): Promise<MetaBlob> {
  const raw = await (await load_app_settings()).readAppSetting(META_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as MetaBlob;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeMeta(meta: MetaBlob): Promise<void> {
  await (await load_app_settings()).writeAppSetting(META_KEY, JSON.stringify(meta));
}

async function patchMeta(id: IntegrationId, patch: Partial<IntegrationMeta>): Promise<void> {
  const meta = await readMeta();
  meta[id] = { ...emptyMeta(), ...meta[id], ...patch };
  await writeMeta(meta);
}

async function aiKey(): Promise<string | null> {
  const stored =
    (await (await load_app_settings()).readAppSetting("XAI_API_KEY"))?.trim() ||
    (await (await load_app_settings()).readAppSetting("AI_API_KEY"))?.trim() ||
    "";
  return stored || null;
}

async function youtubeKey(): Promise<string | null> {
  const { loadYoutubeApiKey } = await import("@/lib/server/youtube-data.server");
  return loadYoutubeApiKey();
}

async function higgsfieldStored(): Promise<{ key: string; secret: string } | null> {
  const key =
    (await (await load_app_settings()).readAppSetting("HIGGSFIELD_API_KEY"))?.trim() ||
    (await (await load_app_settings()).readAppSetting("HIGGSFIELD_KEY_ID"))?.trim() ||
    "";
  const secret =
    (await (await load_app_settings()).readAppSetting("HIGGSFIELD_API_SECRET"))?.trim() ||
    (await (await load_app_settings()).readAppSetting("HIGGSFIELD_SECRET"))?.trim() ||
    "";
  if (key && secret) return { key, secret };
  return null;
}

async function notionToken(): Promise<string | null> {
  const value = (await (await load_app_settings()).readAppSetting("NOTION_TOKEN"))?.trim() || "";
  return value || null;
}

async function daytonaKey(): Promise<string | null> {
  const { loadDaytonaApiKey } = await import("@/lib/server/daytona.server");
  return loadDaytonaApiKey();
}

async function airwallexConfigured(): Promise<boolean> {
  const { loadAirwallexConfig } = await import("@/lib/server/airwallex.server");
  return Boolean(await loadAirwallexConfig());
}

function healthFor(configured: boolean, meta: IntegrationMeta, liveOk: boolean): IntegrationHealth {
  if (!configured) return "not_configured";
  if (meta.lastOk === true) return "connected";
  if (meta.lastOk === false) return "error";
  if (liveOk) return "connected";
  return "saved";
}

function xCard(
  status: {
    appConfigured: boolean;
    connected: boolean;
    eligible: boolean;
    tokenExpired: boolean;
    handle: string | null;
    last4: string | null;
  } | null,
  meta: IntegrationMeta,
): IntegrationCardStatus {
  const configured = Boolean(status?.appConfigured || status?.connected);
  let health: IntegrationHealth = "not_configured";
  if (status?.tokenExpired) health = "token_expired";
  else if (!configured) health = "not_configured";
  else if (meta.lastOk === false) health = "error";
  else if (status?.eligible && status.connected) health = "connected";
  else health = "saved";
  return {
    id: "x",
    configured,
    health,
    lastTestedAt: saneIso(meta.lastTestedAt),
    lastError: status?.tokenExpired ? "Token expired" : (meta.lastError ?? null),
    last4: status?.last4 ?? null,
    required: false,
    handle: status?.handle ?? null,
  };
}

async function buildSnapshot(userId: string): Promise<IntegrationsSnapshot> {
  (await load_discord_agent()).ensureDiscordAgentLoop();
  const [meta, llm, yt, hf, discord, notion, daytona, airwallex, first, sa, role, access, discordAgentHealth, xPub, linear, telegram, whatsapp] = await Promise.all([
    readMeta(),
    import("@/lib/server/xai.server").then((mod) => mod.llmStatus()),
    youtubeKey(),
    higgsfieldStored(),
    (await load_discord()).loadDiscordToken(),
    notionToken(),
    daytonaKey(),
    airwallexConfigured(),
    (await load_app_settings()).readAppSetting(FIRST_LAUNCH_KEY),
    (await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH"),
    getUserRole(userId),
    getOperatorAccess(userId),
    (await load_discord_agent()).readDiscordAgentHealth(),
    import("@/lib/server/social-oauth.server")
      .then((mod) => mod.publisherStatusFor("x"))
      .catch(() => null),
    import("@/lib/server/linear.server")
      .then((mod) => mod.publicLinearStatus())
      .catch(() => null),
    import("@/lib/server/channels.server")
      .then((mod) => mod.loadTelegramToken())
      .catch(() => null),
    import("@/lib/server/channels.server")
      .then((mod) => mod.loadWhatsAppConfig())
      .catch(() => null),
  ]);

  const aiConfigured = llm.source !== "none";
  const items = {
    ai: {
      id: "ai" as const,
      configured: aiConfigured,
      health: healthFor(aiConfigured, meta.ai ?? emptyMeta(), llm.available),
      lastTestedAt: saneIso(meta.ai?.lastTestedAt),
      lastError: meta.ai?.lastError ?? null,
      last4: (await load_discord()).last4((await aiKey()) ?? (llm.source === "oauth" ? "oauthxxxx" : llm.source === "platform" ? "platxxxx" : null)),
      required: true,
    },
    higgsfield: {
      id: "higgsfield" as const,
      configured: Boolean(hf),
      health: healthFor(Boolean(hf), meta.higgsfield ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.higgsfield?.lastTestedAt),
      lastError: meta.higgsfield?.lastError ?? null,
      last4: (await load_discord()).last4(hf?.key ?? null),
      required: false,
    },
    youtube: {
      id: "youtube" as const,
      configured: Boolean(yt),
      health: healthFor(Boolean(yt), meta.youtube ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.youtube?.lastTestedAt),
      lastError: meta.youtube?.lastError ?? null,
      last4: (await load_discord()).last4(yt),
      required: false,
    },
    discord: {
      id: "discord" as const,
      configured: Boolean(discord),
      health: healthFor(Boolean(discord), meta.discord ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.discord?.lastTestedAt),
      lastError: meta.discord?.lastError ?? null,
      last4: (await load_discord()).last4(discord),
      required: false,
    },
    notion: {
      id: "notion" as const,
      configured: Boolean(notion),
      health: healthFor(Boolean(notion), meta.notion ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.notion?.lastTestedAt),
      lastError: meta.notion?.lastError ?? null,
      last4: (await load_discord()).last4(notion),
      required: false,
    },
    linear: {
      id: "linear" as const,
      configured: Boolean(linear?.configured),
      health: (linear?.health as IntegrationHealth | undefined) ?? healthFor(Boolean(linear?.configured), meta.linear ?? emptyMeta(), false),
      lastTestedAt: saneIso(linear?.lastTestedAt ?? meta.linear?.lastTestedAt),
      lastError: linear?.lastError ?? meta.linear?.lastError ?? null,
      last4: linear?.last4 ?? null,
      required: false,
      handle: linear?.viewerName ?? linear?.workspaceSlug ?? null,
    },
    x: xCard(xPub, meta.x ?? emptyMeta()),
    daytona: {
      id: "daytona" as const,
      configured: Boolean(daytona),
      health: healthFor(Boolean(daytona), meta.daytona ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.daytona?.lastTestedAt),
      lastError: meta.daytona?.lastError ?? null,
      last4: (await load_discord()).last4(daytona),
      required: false,
    },
    telegram: {
      id: "telegram" as const,
      configured: Boolean(telegram),
      health: healthFor(Boolean(telegram), meta.telegram ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.telegram?.lastTestedAt),
      lastError: meta.telegram?.lastError ?? null,
      last4: (await load_discord()).last4(telegram),
      required: false,
    },
    whatsapp: {
      id: "whatsapp" as const,
      configured: Boolean(whatsapp),
      health: healthFor(Boolean(whatsapp), meta.whatsapp ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.whatsapp?.lastTestedAt),
      lastError: meta.whatsapp?.lastError ?? null,
      last4: (await load_discord()).last4(whatsapp?.token ?? null),
      required: false,
    },
    airwallex: {
      id: "airwallex" as const,
      configured: Boolean(airwallex),
      health: healthFor(Boolean(airwallex), meta.airwallex ?? emptyMeta(), false),
      lastTestedAt: saneIso(meta.airwallex?.lastTestedAt),
      lastError: meta.airwallex?.lastError ?? null,
      last4: (await import("@/lib/server/airwallex.server").then((mod) => mod.airwallexLast4())),
      required: false,
    },
  } satisfies Record<IntegrationId, IntegrationCardStatus>;

  return {
    items,
    firstLaunchCompleted: first === "1" || first === "true",
    superAdminConfigured: Boolean(sa),
    role,
    inheritWorkspaceApis: access.inheritWorkspaceApis,
    canEditIntegrations:
      access.role === "admin" || (access.role === "member" && !access.inheritWorkspaceApis),
    discordAgent: discordAgentHealth,
  };
}

export async function readIntegrationsSnapshot(userId: string): Promise<IntegrationsSnapshot> {
  return buildSnapshot(userId);
}

export const getIntegrationsStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<IntegrationsSnapshot> => {
    return buildSnapshot(context.userId);
  });

export const completeFirstLaunch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    await (await load_app_settings()).writeAppSetting(FIRST_LAUNCH_KEY, "1");
    return { ok: true as const };
  });

const SaveSchema = z.object({
  id: z.enum(INTEGRATION_IDS),
  values: z.record(z.string(), z.string()),
});

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ context, data }) => {
    if (data.id === "airwallex") await requireAdmin(context.userId);
    else await requireSecretEditor(context.userId);
    const values = data.values;
    if (data.id === "ai") {
      const key = (values.key ?? values.apiKey ?? "").trim();
      if (key.length < 8) throw new Error("KEY_TOO_SHORT");
      await (await load_app_settings()).writeAppSetting("XAI_API_KEY", key);
      await (await load_app_settings()).writeAppSetting("AI_API_KEY", key);
    } else if (data.id === "higgsfield") {
      const keyId = (values.keyId ?? values.key ?? "").trim();
      const secret = (values.secret ?? "").trim();
      if (keyId.length < 8 || secret.length < 8) throw new Error("KEY_TOO_SHORT");
      const { persistHiggsfieldCreds, clearHiggsfieldCredsCache } = await import(
        "@/lib/server/higgsfield.server"
      );
      await persistHiggsfieldCreds({ key: keyId, secret });
      clearHiggsfieldCredsCache();
    } else if (data.id === "youtube") {
      const key = (values.apiKey ?? values.key ?? "").trim();
      if (key.length < 8) throw new Error("KEY_TOO_SHORT");
      const { persistYoutubeApiKey } = await import("@/lib/server/youtube-data.server");
      await persistYoutubeApiKey(key);
    } else if (data.id === "discord") {
      const token = (values.token ?? values.key ?? "").trim();
      if (token.length < 20) throw new Error("KEY_TOO_SHORT");
      await (await load_app_settings()).writeAppSetting("DISCORD_BOT_TOKEN", token);
    } else if (data.id === "notion") {
      const token = (values.token ?? values.key ?? "").trim();
      if (token.length < 10) throw new Error("KEY_TOO_SHORT");
      await (await load_app_settings()).writeAppSetting("NOTION_TOKEN", token);
    } else if (data.id === "linear") {
      const key = (values.apiKey ?? values.key ?? values.token ?? "").trim();
      if (key.length < 12) throw new Error("KEY_TOO_SHORT");
      const { persistLinearApiKey } = await import("@/lib/server/linear.server");
      await persistLinearApiKey(key);
    } else if (data.id === "daytona") {
      const { persistDaytonaSettings } = await import("@/lib/server/daytona.server");
      await persistDaytonaSettings({
        apiKey: values.key ?? values.apiKey,
        apiUrl: values.apiUrl,
        target: values.target,
        autoStopMinutes: values.autoStopMinutes,
        size: values.size,
        proxyUrl: values.proxyUrl ?? values.proxy,
        proxyHost: values.proxyHost,
        proxyPort: values.proxyPort,
        proxyUsername: values.proxyUsername,
        proxyPassword: values.proxyPassword,
        proxyProtocol: values.proxyProtocol,
      });
    } else if (data.id === "telegram") {
      const { persistTelegramSettings } = await import("@/lib/server/channels.server");
      await persistTelegramSettings({
        token: values.token ?? values.key,
        webhookSecret: values.webhookSecret,
      });
    } else if (data.id === "whatsapp") {
      const { persistWhatsAppSettings } = await import("@/lib/server/channels.server");
      await persistWhatsAppSettings({
        token: values.token ?? values.key,
        phoneNumberId: values.phoneNumberId,
        verifyToken: values.verifyToken,
        appSecret: values.appSecret,
      });
    } else if (data.id === "airwallex") {
      const { persistAirwallexSettings } = await import("@/lib/server/airwallex.server");
      await persistAirwallexSettings(values);
    } else if (data.id === "x") {
      const clientId = (values.clientId ?? "").trim();
      const clientSecret = (values.clientSecret ?? "").trim();
      const apiBase = (values.apiBase ?? "").trim();
      const oauth = await import("@/lib/server/social-oauth.server");
      if (clientId && clientSecret) {
        await oauth.persistPublisherApp("x", { clientId, clientSecret });
      }
      if (values.apiBase !== undefined) {
        await oauth.persistXApiBase(apiBase);
      }
      if (!clientId && !clientSecret && values.apiBase === undefined) {
        throw new Error("KEY_TOO_SHORT");
      }
      if (!clientId && !clientSecret && !(await oauth.loadPublisherApp("x")) && !apiBase) {
        throw new Error("KEY_TOO_SHORT");
      }
    }
    await patchMeta(data.id, { lastError: null });
    return { ok: true as const };
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.enum(INTEGRATION_IDS).parse(id))
  .handler(async ({ context, data: id }) => {
    if (id === "airwallex") await requireAdmin(context.userId);
    else await requireSecretEditor(context.userId);
    if (id === "ai") {
      await (await load_app_settings()).deleteAppSetting("XAI_API_KEY");
      await (await load_app_settings()).deleteAppSetting("AI_API_KEY");
      const { disconnectGrokOAuth } = await import("@/lib/server/xai.server");
      await disconnectGrokOAuth();
    } else if (id === "higgsfield") {
      await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_API_KEY");
      await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_API_SECRET");
      await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_KEY_ID");
      await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_SECRET");
      const { clearHiggsfieldCredsCache } = await import("@/lib/server/higgsfield.server");
      clearHiggsfieldCredsCache();
    } else if (id === "youtube") {
      await (await load_app_settings()).deleteAppSetting("YOUTUBE_API_KEY");
      await (await load_app_settings()).deleteAppSetting("YOUTUBE_DATA_API_KEY");
    } else if (id === "discord") {
      await (await load_app_settings()).deleteAppSetting("DISCORD_BOT_TOKEN");
      await (await load_app_settings()).deleteAppSetting("DISCORD_TOKEN");
    } else if (id === "notion") {
      await (await load_app_settings()).deleteAppSetting("NOTION_TOKEN");
    } else if (id === "linear") {
      const { disconnectLinear } = await import("@/lib/server/linear.server");
      await disconnectLinear();
    } else if (id === "daytona") {
      const { disconnectDaytona } = await import("@/lib/server/daytona.server");
      await disconnectDaytona();
    } else if (id === "telegram") {
      const { disconnectTelegram } = await import("@/lib/server/channels.server");
      await disconnectTelegram();
    } else if (id === "whatsapp") {
      const { disconnectWhatsApp } = await import("@/lib/server/channels.server");
      await disconnectWhatsApp();
    } else if (id === "airwallex") {
      const { disconnectAirwallex } = await import("@/lib/server/airwallex.server");
      await disconnectAirwallex();
    } else if (id === "x") {
      const { disconnectPublisherTokens } = await import("@/lib/server/social-oauth.server");
      await disconnectPublisherTokens("x");
    }
    await patchMeta(id, { lastTestedAt: null, lastError: null, lastOk: null });
    return { ok: true as const };
  });

async function testAi(): Promise<void> {
  const { llmAvailable, xaiText } = await import("@/lib/server/xai.server");
  if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
  const ping = await xaiText({
    messages: [{ role: "user", content: "Reply with the single word pong." }],
    maxTokens: 8,
    temperature: 0,
    timeoutMs: 20000,
  });
  if (!ping) throw new Error("AI_UNAVAILABLE");
}

async function testHiggsfield(): Promise<void> {
  const creds = await higgsfieldStored();
  if (!creds) throw new Error("HIGGSFIELD_UNAVAILABLE");
  const response = await fetch("https://platform.higgsfield.ai/requests", {
    method: "GET",
    headers: {
      Authorization: `Key ${creds.key}:${creds.secret}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("HIGGSFIELD_UNAVAILABLE");
  }
  if (response.status === 429) throw new Error("AI_RATE_LIMIT");
}

async function testYoutube(): Promise<void> {
  const key = await youtubeKey();
  if (!key) throw new Error("YOUTUBE_KEY_MISSING");
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id");
  url.searchParams.set("id", "UC_x5XG1OV2P6uZZ5FSM9Ttw");
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (response.status === 400 || response.status === 403) throw new Error("YOUTUBE_UNAVAILABLE");
  if (!response.ok) throw new Error("YOUTUBE_UNAVAILABLE");
}

async function testDiscord(): Promise<void> {
  const token = await (await load_discord()).loadDiscordToken();
  if (!token) throw new Error("DISCORD_UNAVAILABLE");
  const result = await (await load_discord()).testDiscordToken(token);
  if (!result.ok) throw new Error(result.reason);
}

async function testNotion(): Promise<void> {
  const token = await notionToken();
  if (!token) throw new Error("NOTION_UNAVAILABLE");
  const response = await fetch("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 401) throw new Error("NOTION_UNAVAILABLE");
  if (!response.ok) throw new Error("NOTION_UNAVAILABLE");
}

async function testDaytona(): Promise<void> {
  const { testDaytonaConnection } = await import("@/lib/server/daytona.server");
  await testDaytonaConnection();
}

async function testAirwallex(): Promise<void> {
  const { testAirwallexConnection } = await import("@/lib/server/airwallex.server");
  await testAirwallexConnection();
}

async function testLinear(): Promise<void> {
  const { testLinearConnection } = await import("@/lib/server/linear.server");
  await testLinearConnection();
}

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.enum(INTEGRATION_IDS).parse(id))
  .handler(async ({ context, data: id }) => {
    if (id === "airwallex") await requireAdmin(context.userId);
    else await requireSecretEditor(context.userId);
    const stamp = `${context.userId}:${id}`;
    const last = testLock.get(stamp) ?? 0;
    if (Date.now() - last < 4000) throw new Error("AI_RATE_LIMIT");
    testLock.set(stamp, Date.now());
    try {
      if (id === "ai") await testAi();
      else if (id === "higgsfield") await testHiggsfield();
      else if (id === "youtube") await testYoutube();
      else if (id === "discord") await testDiscord();
      else if (id === "daytona") await testDaytona();
      else if (id === "telegram") {
        const { testTelegramConnection } = await import("@/lib/server/channels.server");
        await testTelegramConnection();
      } else if (id === "whatsapp") {
        const { testWhatsAppConnection } = await import("@/lib/server/channels.server");
        await testWhatsAppConnection();
      }
      else if (id === "airwallex") await testAirwallex();
      else if (id === "linear") await testLinear();
      else if (id === "x") {
        const { testPublisherConnection } = await import("@/lib/server/social-oauth.server");
        await testPublisherConnection("x");
      }
      else await testNotion();
      await patchMeta(id, {
        lastTestedAt: new Date().toISOString(),
        lastError: null,
        lastOk: true,
      });
      return { ok: true as const };
    } catch (error) {
      const message =
        error instanceof Error ? sanitizeError(error.message) : "Connection failed.";
      const friendly =
        message === "AI_UNAVAILABLE"
          ? "The AI provider didn’t accept the key."
          : message === "HIGGSFIELD_UNAVAILABLE"
            ? "Higgsfield rejected those credentials."
            : message === "YOUTUBE_KEY_MISSING" || message === "YOUTUBE_UNAVAILABLE"
              ? "YouTube rejected that API key."
              : message === "NOTION_UNAVAILABLE"
                ? "Notion rejected that token."
                : message === "DISCORD_UNAVAILABLE"
                  ? "Discord rejected that bot token."
                  : message === "DAYTONA_UNAVAILABLE"
                    ? "Daytona rejected that API key. Test never starts a machine."
                    : message === "CHANNEL_NOT_CONFIGURED" || message === "CHANNEL_UNAVAILABLE"
                      ? "That channel rejected the credentials. Test never sends a customer message."
                    : message === "AIRWALLEX_UNAVAILABLE"
                    ? "Airwallex rejected those credentials. Test never opens checkout."
                    : message === "PUBLISHER_APP_MISSING"
                      ? "Save the X Client ID and secret, then Connect."
                      : message === "PUBLISHER_NOT_CONNECTED" || message === "PUBLISHER_TOKEN_EXPIRED"
                        ? "Connect X with OAuth. Test never posts."
                        : message === "PUBLISHER_UNAVAILABLE"
                          ? "X didn’t accept that token. Reconnect."
                    : message === "LINEAR_NOT_CONFIGURED"
                      ? "Save a Linear API key first."
                      : message === "LINEAR_UNAUTHORIZED"
                        ? "Linear rejected that key. Create a new one in Linear Settings → API."
                        : message === "LINEAR_UNAVAILABLE" || message === "LINEAR_RATE_LIMIT"
                          ? "Linear didn’t accept that token. Retry Test Connection."
                    : message === "AI_RATE_LIMIT"
                    ? "Too many tests. Wait a few seconds."
                    : message;
      await patchMeta(id, {
        lastTestedAt: new Date().toISOString(),
        lastError: friendly,
        lastOk: false,
      });
      try {
        const { onIntegrationTestFailed } = await import("@/lib/server/safety-hooks.server");
        await onIntegrationTestFailed({
          actorId: context.userId,
          provider: id,
          reason: friendly,
        });
      } catch {
        /* */
      }
      throw new Error(friendly);
    }
  });

export const runDiscordAgentNow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await load_discord_agent()).runDiscordStatusAgent();
  });
