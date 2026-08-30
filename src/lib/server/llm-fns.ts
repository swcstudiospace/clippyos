import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { LLM_PROVIDER_IDS } from "@/lib/llm";

export const getLlmSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { buildLlmSnapshot } = await import("@/lib/server/llm-router.server");
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
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { writeLlmRouter } = await import("@/lib/server/llm-router.server");
    const next = {
      defaultProvider: data.defaultProvider,
      defaultModel: data.defaultModel,
      fallbackProvider: data.fallbackProvider,
      features: (data.features ?? {}) as import("@/lib/llm").LlmRouterConfig["features"],
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
        key: z.string().trim().min(8).max(400).optional(),
        baseUrl: z.string().trim().max(300).optional(),
      })
      .refine((value) => Boolean(value.key) || value.provider === "openai-compat", {
        message: "API key required",
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireSecretEditor } = await import("@/lib/server/access");
    await requireSecretEditor(context.userId);
    const { deleteAppSetting, writeAppSetting } = await import("@/lib/server/app-settings.server");
    if (data.key) {
      await writeAppSetting(data.provider === "xai-api" ? "XAI_API_KEY" : "AI_API_KEY", data.key);
    }
    if (data.provider === "openai-compat" && data.baseUrl !== undefined) {
      const { normalizeOpenAiCompatBase } = await import("@/lib/llm");
      const normalized = normalizeOpenAiCompatBase(data.baseUrl);
      if (data.baseUrl.trim() && !normalized) throw new Error("Enter an https OpenAI-compatible base URL.");
      if (normalized) await writeAppSetting("OPENAI_COMPAT_BASE", normalized);
      else await deleteAppSetting("OPENAI_COMPAT_BASE");
    }
    return { ok: true as const };
  });

export const disconnectLlmProvider = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ provider: z.enum(["xai-api", "openai-compat"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireSecretEditor } = await import("@/lib/server/access");
    await requireSecretEditor(context.userId);
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
    const { requireSecretEditor } = await import("@/lib/server/access");
    await requireSecretEditor(context.userId);
    const { readLlmRouter } = await import("@/lib/server/llm-router.server");
    const { xaiChat, xaiTextContent, XAI_MODEL } = await import("@/lib/server/xai.server");
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
