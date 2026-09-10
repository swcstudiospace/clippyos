/** LLM provider catalog — client-safe. Tokens never live here. */

export const LLM_PROVIDER_IDS = ["xai-oauth", "xai-api", "openai-compat", "anthropic-api"] as const;
export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number];

export const LLM_FEATURES = [
  "system",
  "ideation",
  "thumbnails",
  "discord",
  "skillAuthor",
  "agent",
  "vision",
] as const;
export type LlmFeature = (typeof LLM_FEATURES)[number];

export const LLM_MODELS = [
  { id: "grok-4.6", label: "Grok 4.6", provider: "xai", class: "flagship" },
  { id: "grok-4.5", label: "Grok 4.5", provider: "xai", class: "flagship" },
  { id: "z-ai/glm-5.3-flash", label: "GLM 5.3 Flash (OpenRouter)", provider: "openrouter", class: "fast" },
  { id: "claude-opus-5", label: "Claude Opus 5", provider: "anthropic", class: "flagship" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "anthropic", class: "fast" },
] as const;

export const DEFAULT_OPENAI_COMPAT_BASE = "https://openrouter.ai/api/v1";
export const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";

export function modelsForProvider(provider: LlmProviderId) {
  if (provider === "openai-compat") {
    return LLM_MODELS.filter((row) => row.provider === "openrouter");
  }
  if (provider === "anthropic-api") {
    return LLM_MODELS.filter((row) => row.provider === "anthropic");
  }
  return LLM_MODELS.filter((row) => row.provider === "xai");
}

/** https anywhere; http only on loopback. Empty → null (caller uses the default). */
export function normalizeOpenAiCompatBase(raw: string): string | null {
  const value = raw.trim().replace(/\/+$/, "");
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.protocol === "http:") {
    const host = url.hostname.toLowerCase();
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") return null;
  }
  return value;
}

export type LlmRouterConfig = {
  defaultProvider: LlmProviderId;
  defaultModel: string;
  fallbackProvider: LlmProviderId | null;
  features: Partial<Record<LlmFeature, LlmProviderId>>;
};

export const DEFAULT_LLM_ROUTER: LlmRouterConfig = {
  defaultProvider: "xai-oauth",
  defaultModel: "grok-4.6",
  fallbackProvider: "xai-api",
  features: {},
};

export const LLM_PROVIDER_COPY: Record<
  LlmProviderId,
  { name: string; purpose: string; billing: string }
> = {
  "xai-oauth": {
    name: "xAI Grok (SuperGrok / X Premium+ OAuth)",
    purpose: "Subscription quota via the same device-code flow Hermes and Grok Build use. No XAI_API_KEY required.",
    billing: "Uses SuperGrok / linked X Premium+ quota. A 403 means this tier cannot run inference — switch to the metered API key.",
  },
  "xai-api": {
    name: "xAI API (metered)",
    purpose: "Production server workloads billed against console.x.ai credits.",
    billing: "Separate from SuperGrok subscription. Key stored in AppSetting (XAI_API_KEY).",
  },
  "openai-compat": {
    name: "OpenAI-compatible API",
    purpose: "OpenRouter or any other OpenAI-style base URL + key (AI_API_KEY + OPENAI_COMPAT_BASE).",
    billing: "Whatever that provider bills. Set the base URL to https://openrouter.ai/api/v1 for GLM 5.3 Flash.",
  },
  "anthropic-api": {
    name: "Anthropic API (metered)",
    purpose: "Claude Opus 5 / Sonnet 5 via the native Messages API, billed against console.anthropic.com credits.",
    billing: "Metered per-token API key, not a Claude Pro/Max subscription — Anthropic restricts subscription OAuth to Claude Code and Claude.ai only. Key stored in AppSetting (ANTHROPIC_API_KEY).",
  },
};

export const LLM_FEATURE_LABELS: Record<LlmFeature, string> = {
  system: "System default",
  ideation: "Ideation",
  thumbnails: "Thumbnails",
  discord: "Discord agent",
  skillAuthor: "Skill author",
  agent: "Clipping Agent",
  vision: "Vision",
};

export const LLM_QUERY_KEY = ["llm-providers"] as const;

export type LlmProviderStatus = {
  id: LlmProviderId;
  configured: boolean;
  health: "connected" | "not_configured" | "error";
  last4: string | null;
  email: string | null;
  models: string[];
  baseUrl?: string | null;
};

export type LlmRateLimitState = {
  recent429: number;
  backoffUntil: string | null;
  inFlight: number;
  retrying: boolean;
  message: string | null;
};

export type LlmSnapshot = {
  router: LlmRouterConfig;
  providers: Record<LlmProviderId, LlmProviderStatus>;
  catalog: typeof LLM_MODELS;
  rateLimit: LlmRateLimitState;
};
