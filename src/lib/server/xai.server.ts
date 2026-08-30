/**
 * Unified xAI / Grok client.
 *
 * Credential order:
 *   1. SuperGrok OAuth (device-code against auth.x.ai — same flow as Grok Build / Hermes)
 *   2. Platform-injected XAI_API_KEY (preview + deploy)
 *
 * OAuth traffic prefers the Grok CLI chat proxy so SuperGrok Heavy quota is used
 * instead of API credits. Tokens never leave the server.
 */
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import type { LlmProviderId } from "@/lib/llm";
import { DEFAULT_OPENAI_COMPAT_BASE } from "@/lib/llm";
import { CANONICAL_APP_ORIGIN } from "@/lib/app-hosts";

export const XAI_MODEL = "grok-4.6";
export const XAI_MODEL_FALLBACK = "grok-4.5";

const TOKEN_KEY = "GROK_OAUTH_TOKENS";
const PENDING_KEY = "GROK_OAUTH_PENDING";
const ISSUER = "https://auth.x.ai";
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;
const DEVICE_CODE_URL = `${ISSUER}/oauth2/device/code`;
const TOKEN_URL = `${ISSUER}/oauth2/token`;
const USERINFO_URL = `${ISSUER}/oauth2/userinfo`;
const PROXY_BASE = "https://cli-chat-proxy.grok.com/v1";
const API_BASE = "https://api.x.ai/v1";
const SCOPE = "openid profile email offline_access grok-cli:access api:access";
const REFRESH_SKEW_MS = 60_000;
const CLIENT_VERSION = "0.2.114";

/**
 * Public Grok CLI / Hermes Agent OAuth client. Device-code flow has no secret.
 * Override with XAI_OAUTH_CLIENT_ID when xAI issues an app-specific client.
 */
const DEFAULT_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";

type OAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  email: string | null;
  tokenType: string;
};

type PendingDevice = {
  deviceCode: string;
  interval: number;
  expiresAt: string;
};

export type XaiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type XaiChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | XaiContentPart[] | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

export type LlmSource = "oauth" | "platform" | "key" | "none";

type ResolvedCreds = {
  source: Exclude<LlmSource, "none">;
  bearer: string;
  bases: string[];
  extraHeaders: Record<string, string>;
};

const mem = globalThis as typeof globalThis & {
  __clippyGrokTokens__?: OAuthTokens | null;
  __clippyGrokPending__?: PendingDevice | null;
};

function clientId(): string {
  return process.env.XAI_OAUTH_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
}

function proxyBase(): string {
  return (process.env.GROK_CLI_CHAT_PROXY_BASE_URL?.trim() || PROXY_BASE).replace(/\/+$/, "");
}

function platformKey(): string | null {
  const key = process.env.XAI_API_KEY?.trim();
  return key || null;
}

async function settingsApiKey(): Promise<string | null> {
  const stored = (await readAppSetting("XAI_API_KEY"))?.trim() || "";
  if (!stored || /[•…]|YOUR_|changeme|placeholder/i.test(stored)) return null;
  return stored;
}

async function compatApiKey(): Promise<string | null> {
  const stored = (await readAppSetting("AI_API_KEY"))?.trim() || "";
  if (!stored || /[•…]|YOUR_|changeme|placeholder/i.test(stored)) return null;
  return stored;
}

function parseTokens(raw: string | null): OAuthTokens | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OAuthTokens>;
    if (!parsed.accessToken) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString(),
      email: parsed.email ?? null,
      tokenType: parsed.tokenType ?? "Bearer",
    };
  } catch {
    return null;
  }
}

async function loadStoredTokens(): Promise<OAuthTokens | null> {
  if (mem.__clippyGrokTokens__?.accessToken) return mem.__clippyGrokTokens__;
  const stored = parseTokens(await readAppSetting(TOKEN_KEY));
  mem.__clippyGrokTokens__ = stored;
  return stored;
}

async function persistTokens(tokens: OAuthTokens | null): Promise<void> {
  mem.__clippyGrokTokens__ = tokens;
  if (!tokens) {
    await deleteAppSetting(TOKEN_KEY);
    return;
  }
  await writeAppSetting(TOKEN_KEY, JSON.stringify(tokens));
}

async function loadPending(): Promise<PendingDevice | null> {
  if (mem.__clippyGrokPending__) return mem.__clippyGrokPending__;
  const raw = await readAppSetting(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingDevice;
    if (!parsed.deviceCode) return null;
    mem.__clippyGrokPending__ = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function persistPending(pending: PendingDevice | null): Promise<void> {
  mem.__clippyGrokPending__ = pending;
  if (!pending) {
    await deleteAppSetting(PENDING_KEY);
    return;
  }
  await writeAppSetting(PENDING_KEY, JSON.stringify(pending));
}

function isExpired(expiresAt: string, skewMs = REFRESH_SKEW_MS): boolean {
  const at = Date.parse(expiresAt);
  if (!Number.isFinite(at)) return true;
  return at - skewMs <= Date.now();
}

async function refreshTokens(current: OAuthTokens): Promise<OAuthTokens | null> {
  if (!current.refreshToken) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId(),
    refresh_token: current.refreshToken,
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!json.access_token) return null;
  const next: OAuthTokens = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? current.refreshToken,
    expiresAt: new Date(Date.now() + Math.max(60, json.expires_in ?? 3600) * 1000).toISOString(),
    email: current.email,
    tokenType: json.token_type ?? "Bearer",
  };
  await persistTokens(next);
  return next;
}

async function lookupEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { email?: string; preferred_username?: string };
    return json.email ?? json.preferred_username ?? null;
  } catch {
    return null;
  }
}

async function oauthBearer(): Promise<string | null> {
  let tokens = await loadStoredTokens();
  if (!tokens) return null;
  if (isExpired(tokens.expiresAt)) {
    tokens = (await refreshTokens(tokens)) ?? tokens;
    if (isExpired(tokens.expiresAt, 0)) {
      await persistTokens(null);
      return null;
    }
  }
  return tokens.accessToken;
}

async function resolveCreds(): Promise<ResolvedCreds | null> {
  return resolveCredsFor();
}

export async function resolveCredsFor(prefer?: LlmProviderId): Promise<ResolvedCreds | null> {
  if (prefer === "xai-oauth") {
    const oauth = await oauthBearer();
    if (!oauth) return null;
    return oauthCreds(oauth);
  }
  if (prefer === "xai-api") {
    const stored = await settingsApiKey();
    if (stored) return keyCreds(stored);
    const key = platformKey();
    if (key) {
      return {
        source: "platform",
        bearer: key,
        bases: [API_BASE],
        extraHeaders: {},
      };
    }
    return null;
  }
  if (prefer === "openai-compat") {
    const key = await compatApiKey();
    if (!key) return null;
    const base =
      (await readAppSetting("OPENAI_COMPAT_BASE"))?.trim().replace(/\/+$/, "") ||
      DEFAULT_OPENAI_COMPAT_BASE;
    const extraHeaders: Record<string, string> = {};
    if (/openrouter\.ai/i.test(base)) {
      extraHeaders["HTTP-Referer"] = CANONICAL_APP_ORIGIN;
      extraHeaders["X-Title"] = "ClippyOS";
    }
    return {
      source: "key",
      bearer: key,
      bases: [base],
      extraHeaders,
    };
  }
  const oauth = await oauthBearer();
  if (oauth) return oauthCreds(oauth);
  const stored = (await settingsApiKey()) || (await compatApiKey());
  if (stored) return keyCreds(stored);
  const key = platformKey();
  if (key) {
    return {
      source: "platform",
      bearer: key,
      bases: [API_BASE],
      extraHeaders: {},
    };
  }
  return null;
}

function oauthCreds(oauth: string): ResolvedCreds {
  return {
    source: "oauth",
    bearer: oauth,
    bases: [proxyBase(), API_BASE],
    extraHeaders: {
      "x-xai-token-auth": "xai-grok-cli",
      "x-grok-client-identifier": "grok-shell",
      "x-grok-client-version": CLIENT_VERSION,
      "User-Agent": "xai-grok-cli",
    },
  };
}

function keyCreds(stored: string): ResolvedCreds {
  return {
    source: "key",
    bearer: stored,
    bases: [API_BASE],
    extraHeaders: {},
  };
}

type ModelLimiter = {
  inFlight: number;
  queue: Array<() => void>;
  recent429: number[];
  last429At: number | null;
  backoffUntil: number | null;
};

const limiters = new Map<string, ModelLimiter>();
const MAX_CONCURRENCY = 4;
const MAX_429_ATTEMPTS = 6;
const RECENT_429_WINDOW_MS = 10 * 60 * 1000;

function limiterFor(model: string): ModelLimiter {
  const existing = limiters.get(model);
  if (existing) return existing;
  const created: ModelLimiter = {
    inFlight: 0,
    queue: [],
    recent429: [],
    last429At: null,
    backoffUntil: null,
  };
  limiters.set(model, created);
  return created;
}

async function acquireSlot(model: string): Promise<void> {
  const lim = limiterFor(model);
  if (lim.inFlight < MAX_CONCURRENCY) {
    lim.inFlight += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    lim.queue.push(resolve);
  });
  lim.inFlight += 1;
}

function releaseSlot(model: string): void {
  const lim = limiterFor(model);
  lim.inFlight = Math.max(0, lim.inFlight - 1);
  const next = lim.queue.shift();
  if (next) next();
}

function prune429(lim: ModelLimiter): void {
  const cutoff = Date.now() - RECENT_429_WINDOW_MS;
  lim.recent429 = lim.recent429.filter((at) => at >= cutoff);
}

function backoffMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.max(seconds * 1000, 250), 60_000);
    }
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) {
      return Math.min(Math.max(date - Date.now(), 250), 60_000);
    }
  }
  const base = Math.min(2 ** attempt * 1000, 32_000);
  const jitter = Math.floor(Math.random() * 400);
  return base + jitter;
}

export function xaiRateLimitSnapshot(): {
  recent429: number;
  backoffUntil: string | null;
  inFlight: number;
  retrying: boolean;
  message: string | null;
} {
  let recent429 = 0;
  let backoffUntil: number | null = null;
  let inFlight = 0;
  for (const lim of limiters.values()) {
    prune429(lim);
    recent429 += lim.recent429.length;
    inFlight += lim.inFlight;
    if (lim.backoffUntil && (backoffUntil == null || lim.backoffUntil > backoffUntil)) {
      backoffUntil = lim.backoffUntil;
    }
  }
  const retrying = backoffUntil != null && backoffUntil > Date.now();
  return {
    recent429,
    backoffUntil: backoffUntil ? new Date(backoffUntil).toISOString() : null,
    inFlight,
    retrying,
    message: retrying ? "Capacity — retrying…" : recent429 > 0 ? "Recent rate limits; requests are queued." : null,
  };
}

export async function llmAvailable(): Promise<boolean> {
  if (platformKey()) return true;
  if (await settingsApiKey()) return true;
  return Boolean(await oauthBearer());
}

export async function llmStatus(): Promise<{
  available: boolean;
  source: LlmSource;
  email: string | null;
}> {
  const tokens = await loadStoredTokens();
  if (tokens?.accessToken && !isExpired(tokens.expiresAt, 0)) {
    return { available: true, source: "oauth", email: tokens.email };
  }
  if (tokens?.refreshToken) {
    const refreshed = await refreshTokens(tokens);
    if (refreshed) return { available: true, source: "oauth", email: refreshed.email };
  }
  if (await settingsApiKey()) return { available: true, source: "key", email: null };
  if (platformKey()) return { available: true, source: "platform", email: null };
  return { available: false, source: "none", email: null };
}

export type DeviceStart = {
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string | null;
  expiresIn: number;
  interval: number;
};

export async function startGrokDeviceLogin(): Promise<DeviceStart> {
  // Discovery keeps us honest if xAI relocates the device endpoint.
  let deviceUrl = DEVICE_CODE_URL;
  try {
    const disco = await fetch(DISCOVERY_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (disco.ok) {
      const json = (await disco.json()) as { device_authorization_endpoint?: string };
      const next = json.device_authorization_endpoint?.trim();
      if (next?.startsWith("https://") && new URL(next).hostname.endsWith("x.ai")) {
        deviceUrl = next;
      }
    }
  } catch {
    /* use default */
  }

  const response = await fetch(deviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId(),
      scope: SCOPE,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("OAUTH_START_FAILED");
  const json = (await response.json()) as {
    device_code?: string;
    user_code?: string;
    verification_uri?: string;
    verification_uri_complete?: string;
    expires_in?: number;
    interval?: number;
  };
  if (!json.device_code || !json.user_code || !json.verification_uri) {
    throw new Error("OAUTH_START_FAILED");
  }
  const expiresIn = Math.max(60, json.expires_in ?? 600);
  const interval = Math.max(3, json.interval ?? 5);
  await persistPending({
    deviceCode: json.device_code,
    interval,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
  return {
    userCode: json.user_code,
    verificationUri: json.verification_uri,
    verificationUriComplete: json.verification_uri_complete ?? null,
    expiresIn,
    interval,
  };
}

export type DevicePoll =
  | { status: "pending"; interval: number }
  | { status: "slow_down"; interval: number }
  | { status: "connected"; email: string | null }
  | { status: "expired" }
  | { status: "denied" };

export async function pollGrokDeviceLogin(): Promise<DevicePoll> {
  const pending = await loadPending();
  if (!pending) return { status: "expired" };
  if (isExpired(pending.expiresAt, 0)) {
    await persistPending(null);
    return { status: "expired" };
  }
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: pending.deviceCode,
      client_id: clientId(),
    }),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!response.ok) {
    const err = json.error ?? "";
    if (err === "authorization_pending") {
      return { status: "pending", interval: pending.interval };
    }
    if (err === "slow_down") {
      return { status: "slow_down", interval: pending.interval + 5 };
    }
    if (err === "access_denied") {
      await persistPending(null);
      return { status: "denied" };
    }
    if (err === "expired_token") {
      await persistPending(null);
      return { status: "expired" };
    }
    return { status: "pending", interval: pending.interval };
  }
  if (!json.access_token) return { status: "pending", interval: pending.interval };
  const email = await lookupEmail(json.access_token);
  await persistTokens({
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + Math.max(60, json.expires_in ?? 3600) * 1000).toISOString(),
    email,
    tokenType: json.token_type ?? "Bearer",
  });
  await persistPending(null);
  return { status: "connected", email };
}

export async function disconnectGrokOAuth(): Promise<void> {
  await persistPending(null);
  await persistTokens(null);
}

function modelNotFound(status: number, body: string): boolean {
  if (status !== 400 && status !== 404) return false;
  return /model/i.test(body) && /(not found|does not exist|unknown|invalid)/i.test(body);
}

export async function xaiChat(params: {
  messages: XaiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: unknown;
  toolChoice?: unknown;
  timeoutMs?: number;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  model?: string;
  provider?: LlmProviderId;
  conversationId?: string;
  promptCacheKey?: string;
}): Promise<{ message: XaiChatMessage; finish: string | null }> {
  const creds = await resolveCredsFor(params.provider);
  if (!creds) throw new Error("AI_UNAVAILABLE");

  const requested = params.model?.trim();
  const models =
    params.provider === "openai-compat"
      ? [requested && !requested.startsWith("grok") ? requested : "z-ai/glm-5.3-flash"]
      : requested
        ? [requested, XAI_MODEL, XAI_MODEL_FALLBACK].filter(
            (item, index, all) => all.indexOf(item) === index,
          )
        : [XAI_MODEL, XAI_MODEL_FALLBACK];
  let lastStatus = 0;
  let usedRefresh = false;

  for (const base of creds.bases) {
    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex]!;
      const payload: Record<string, unknown> = {
        model,
        temperature: params.temperature ?? 0.6,
        max_tokens: params.maxTokens ?? 1600,
        messages: params.messages,
      };
      if (params.tools) {
        payload.tools = params.tools;
        payload.tool_choice = params.toolChoice ?? "auto";
      }
      if (params.reasoningEffort) payload.reasoning_effort = params.reasoningEffort;
      if (params.promptCacheKey) payload.prompt_cache_key = params.promptCacheKey;

      const extra: Record<string, string> = { ...creds.extraHeaders };
      if (params.conversationId) extra["x-conversation-id"] = params.conversationId;
      if (params.promptCacheKey) extra["x-prompt-cache-key"] = params.promptCacheKey;

      const lim = limiterFor(model);
      await acquireSlot(model);
      try {
        if (lim.backoffUntil && lim.backoffUntil > Date.now()) {
          await new Promise((resolve) => setTimeout(resolve, lim.backoffUntil! - Date.now()));
        }
        let attempt = 0;
        while (attempt < MAX_429_ATTEMPTS) {
          const response = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${creds.bearer}`,
              ...extra,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(params.timeoutMs ?? 60_000),
          });
          lastStatus = response.status;
          if (response.status === 429) {
            prune429(lim);
            lim.recent429.push(Date.now());
            lim.last429At = Date.now();
            const wait = backoffMs(attempt, response.headers.get("retry-after"));
            lim.backoffUntil = Date.now() + wait;
            attempt += 1;
            if (attempt >= MAX_429_ATTEMPTS) {
              throw new Error("AI_RATE_LIMIT");
            }
            await new Promise((resolve) => setTimeout(resolve, wait));
            continue;
          }
          const raw = await response.text();
          if (response.ok) {
            lim.backoffUntil = null;
            const body = JSON.parse(raw) as {
              choices?: {
                finish_reason?: string;
                message?: {
                  role?: string;
                  content?: string | null;
                  tool_calls?: XaiChatMessage["tool_calls"];
                };
              }[];
            };
            const choice = body.choices?.[0];
            return {
              finish: choice?.finish_reason ?? null,
              message: {
                role: "assistant",
                content: choice?.message?.content ?? null,
                tool_calls: choice?.message?.tool_calls,
              },
            };
          }
          if (response.status === 403 && creds.source === "oauth") throw new Error("AI_TIER_GATED");
          if (response.status === 401 && creds.source === "oauth" && !usedRefresh) {
            usedRefresh = true;
            const tokens = await loadStoredTokens();
            if (tokens) await refreshTokens(tokens);
            const next = await resolveCreds();
            if (next) {
              creds.bearer = next.bearer;
              modelIndex -= 1;
              break;
            }
          }
          if (modelNotFound(response.status, raw) && modelIndex < models.length - 1) {
            break;
          }
          if (params.reasoningEffort && (response.status === 400 || response.status === 422)) {
            params.reasoningEffort = undefined;
            modelIndex -= 1;
            break;
          }
          if (response.status === 426 || response.status === 402) {
            break;
          }
          break;
        }
      } finally {
        releaseSlot(model);
      }
    }
  }

  if (lastStatus === 429) throw new Error("AI_RATE_LIMIT");
  throw new Error("GENERATION_FAILED");
}

export function xaiTextContent(content: XaiChatMessage["content"]): string {
  if (typeof content === "string") return content.trim();
  if (!content) return "";
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

export async function xaiText(params: {
  messages: XaiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
}): Promise<string> {
  const { message } = await xaiChat(params);
  const text = xaiTextContent(message.content);
  if (!text) throw new Error("GENERATION_FAILED");
  return text;
}
