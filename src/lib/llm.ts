/** LLM provider catalog — client-safe. Tokens never live here. */

export const LLM_PROVIDER_IDS = ["xai-oauth", "xai-api", "openai-compat"] as const;
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
] as const;

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
    purpose: "Existing Claude / OpenAI-style key (AI_API_KEY) for continuity.",
    billing: "Whatever that provider bills. Kept until you migrate defaults to Grok.",
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
