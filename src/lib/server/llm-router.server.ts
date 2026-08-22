import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import {
  DEFAULT_LLM_ROUTER,
  LLM_MODELS,
  LLM_PROVIDER_IDS,
  type LlmFeature,
  type LlmProviderId,
  type LlmProviderStatus,
  type LlmRouterConfig,
  type LlmSnapshot,
} from "@/lib/llm";
import {
  llmStatus,
  xaiChat,
  xaiRateLimitSnapshot,
  xaiTextContent,
  XAI_MODEL,
  type XaiChatMessage,
} from "@/lib/server/xai.server";

const ROUTER_KEY = "LLM_ROUTER_JSON";

export function parseLlmRouter(raw: unknown): LlmRouterConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LLM_ROUTER };
  const row = raw as Record<string, unknown>;
  const provider = String(row.defaultProvider ?? "");
  const fallback = String(row.fallbackProvider ?? "");
  const features: LlmRouterConfig["features"] = {};
  if (row.features && typeof row.features === "object") {
    for (const [key, value] of Object.entries(row.features as Record<string, unknown>)) {
      if (LLM_PROVIDER_IDS.includes(value as LlmProviderId)) {
        features[key as LlmFeature] = value as LlmProviderId;
      }
    }
  }
  return {
    defaultProvider: LLM_PROVIDER_IDS.includes(provider as LlmProviderId)
      ? (provider as LlmProviderId)
      : DEFAULT_LLM_ROUTER.defaultProvider,
    defaultModel: String(row.defaultModel ?? XAI_MODEL) || XAI_MODEL,
    fallbackProvider: LLM_PROVIDER_IDS.includes(fallback as LlmProviderId)
      ? (fallback as LlmProviderId)
      : DEFAULT_LLM_ROUTER.fallbackProvider,
    features,
  };
}

export async function readLlmRouter(): Promise<LlmRouterConfig> {
  const raw = await readAppSetting(ROUTER_KEY);
  if (!raw) return { ...DEFAULT_LLM_ROUTER };
  try {
    return parseLlmRouter(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LLM_ROUTER };
  }
}

export async function writeLlmRouter(config: LlmRouterConfig): Promise<void> {
  await writeAppSetting(ROUTER_KEY, JSON.stringify(config));
}

function last4(value: string | null): string | null {
  if (!value || value.length < 4) return null;
  return value.slice(-4);
}

export async function buildLlmSnapshot(): Promise<LlmSnapshot> {
  const [router, status, xaiKey, compatKey] = await Promise.all([
    readLlmRouter(),
    llmStatus(),
    readAppSetting("XAI_API_KEY"),
    readAppSetting("AI_API_KEY"),
  ]);
  const models = LLM_MODELS.map((row) => row.id);
  const providers: Record<LlmProviderId, LlmProviderStatus> = {
    "xai-oauth": {
      id: "xai-oauth",
      configured: status.source === "oauth",
      health: status.source === "oauth" ? "connected" : "not_configured",
      last4: null,
      email: status.email,
      models,
    },
    "xai-api": {
      id: "xai-api",
      configured: Boolean(xaiKey?.trim()) || status.source === "key" || status.source === "platform",
      health:
        status.source === "key" || status.source === "platform"
          ? "connected"
          : xaiKey?.trim()
            ? "connected"
            : "not_configured",
      last4: last4(xaiKey) ?? (status.source === "platform" ? "plat" : null),
      email: null,
      models,
    },
    "openai-compat": {
      id: "openai-compat",
      configured: Boolean(compatKey?.trim()),
      health: compatKey?.trim() ? "connected" : "not_configured",
      last4: last4(compatKey),
      email: null,
      models: [],
    },
  };
  return { router, providers, catalog: LLM_MODELS, rateLimit: xaiRateLimitSnapshot() };
}

export async function routedChat(input: {
  feature: LlmFeature;
  messages: XaiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: unknown;
  toolChoice?: unknown;
  timeoutMs?: number;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  conversationId?: string;
  promptCacheKey?: string;
}): Promise<{ message: XaiChatMessage; finish: string | null; provider: LlmProviderId; model: string }> {
  const router = await readLlmRouter();
  const preferred = router.features[input.feature] ?? router.defaultProvider;
  const model = router.defaultModel || XAI_MODEL;
  const attempt = async (provider: LlmProviderId) =>
    xaiChat({
      messages: input.messages,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      tools: input.tools,
      toolChoice: input.toolChoice,
      timeoutMs: input.timeoutMs,
      reasoningEffort: input.reasoningEffort,
      model,
      provider,
      conversationId: input.conversationId,
      promptCacheKey: input.promptCacheKey,
    });
  try {
    const result = await attempt(preferred);
    return { ...result, provider: preferred, model };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "AI_TIER_GATED") throw error;
    const fallback = router.fallbackProvider;
    if (
      fallback &&
      fallback !== preferred &&
      (code === "AI_UNAVAILABLE" || code === "AI_RATE_LIMIT")
    ) {
      const result = await attempt(fallback);
      return { ...result, provider: fallback, model };
    }
    throw error;
  }
}

export async function routedText(input: {
  feature: LlmFeature;
  messages: XaiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const { message } = await routedChat(input);
  const text = xaiTextContent(message.content);
  if (!text) throw new Error("GENERATION_FAILED");
  return text;
}

export const getLlmSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    return buildLlmSnapshot();
  });

export const saveLlmRouter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        defaultProvider: z.enum(LLM_PROVIDER_IDS),
        defaultModel: z.string().min(1).max(80),
        fallbackProvider: z.enum(LLM_PROVIDER_IDS).nullable(),
        features: z.record(z.string(), z.enum(LLM_PROVIDER_IDS)).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const next: LlmRouterConfig = {
      defaultProvider: data.defaultProvider,
      defaultModel: data.defaultModel,
      fallbackProvider: data.fallbackProvider,
      features: (data.features ?? {}) as LlmRouterConfig["features"],
    };
    await writeLlmRouter(next);
    return { ok: true as const, router: next };
  });

export const saveLlmApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        provider: z.enum(["xai-api", "openai-compat"]),
        key: z.string().trim().min(8).max(400),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const setting = data.provider === "xai-api" ? "XAI_API_KEY" : "AI_API_KEY";
    await writeAppSetting(setting, data.key);
    return { ok: true as const };
  });

export const disconnectLlmProvider = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ provider: z.enum(["xai-api", "openai-compat"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { deleteAppSetting } = await import("@/lib/server/app-settings.server");
    await deleteAppSetting(data.provider === "xai-api" ? "XAI_API_KEY" : "AI_API_KEY");
    return { ok: true as const };
  });

export const testLlmProvider = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ provider: z.enum(LLM_PROVIDER_IDS) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const router = await readLlmRouter();
    const { message } = await xaiChat({
      messages: [{ role: "user", content: "Reply with the single word pong." }],
      maxTokens: 8,
      temperature: 0,
      timeoutMs: 20000,
      model: router.defaultModel || XAI_MODEL,
      provider: data.provider,
    });
    const text = xaiTextContent(message.content);
    if (!text) throw new Error("GENERATION_FAILED");
    return { ok: true as const, preview: text.slice(0, 40) };
  });
