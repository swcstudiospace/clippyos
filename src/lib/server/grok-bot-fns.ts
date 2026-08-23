import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import { DEFAULT_HERMES_SCOPES } from "@/lib/autonomy";
import { formatClippyOsMcpOauthConnectorJson } from "@/lib/mcp-oauth";
import { publishedMcpEndpoints } from "@/lib/app-hosts";

export const getGrokBotStatusFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { buildGrokBotSnapshot } = await import("@/lib/server/grok-bot.server");
    return buildGrokBotSnapshot();
  });

export const saveGrokBotSettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        enabled: z.boolean().optional(),
        preferAsComputer: z.boolean().optional(),
        fallbackToDaytona: z.boolean().optional(),
        botName: z.string().trim().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { writeGrokBotConfig, buildGrokBotSnapshot } = await import("@/lib/server/grok-bot.server");
    await writeGrokBotConfig(data);
    return buildGrokBotSnapshot();
  });

export const markGrokBotPastedFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { writeGrokBotConfig, buildGrokBotSnapshot } = await import("@/lib/server/grok-bot.server");
    await writeGrokBotConfig({ pastedConnectorAt: new Date().toISOString() });
    return buildGrokBotSnapshot();
  });

export const createGrokBotPresetKeyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const auth = await import("@/lib/server/autonomy-auth.server");
    const plaintext = auth.generateApiKeyPlaintext();
    const row = await auth.insertApiKey({
      name: "Grok Bot",
      scopes: [...DEFAULT_HERMES_SCOPES],
      plaintext,
      actorId: context.userId,
    });
    return { key: row, plaintext };
  });

export const grokBotBriefFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { readGrokBotConfig, operatorBriefFor } = await import("@/lib/server/grok-bot.server");
    const endpoints = publishedMcpEndpoints();
    const config = await readGrokBotConfig();
    return {
      brief: operatorBriefFor(endpoints.canonical, config.botName),
      connectorJson: formatClippyOsMcpOauthConnectorJson(endpoints.canonical),
      mcpUrl: endpoints.canonical,
      mcpAliasUrl: endpoints.alias,
    };
  });

export const dispatchGrokBotWorkFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        kind: z.enum(["social_upload", "agent_run", "session_login", "custom"]),
        title: z.string().trim().min(1).max(200),
        brief: z.string().trim().min(1).max(8000),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { grokBotIsConnected, enqueueGrokBotWork } = await import("@/lib/server/grok-bot.server");
    if (!(await grokBotIsConnected())) throw new Error("GROK_BOT_NOT_CONNECTED");
    return enqueueGrokBotWork({
      kind: data.kind,
      title: data.title,
      brief: data.brief,
      payload: { actorId: context.userId },
    });
  });
