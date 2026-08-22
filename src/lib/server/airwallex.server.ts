/**
 * Airwallex Billing — server-only. Keys live in AppSetting.
 * Hosted Checkout only; no raw card data.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import { last4 } from "@/lib/server/discord.server";

const CLIENT_ID_KEY = "AIRWALLEX_CLIENT_ID";
const API_KEY_KEY = "AIRWALLEX_API_KEY";
const WEBHOOK_KEY = "AIRWALLEX_WEBHOOK_SECRET";
const LEGAL_KEY = "AIRWALLEX_LEGAL_ENTITY_ID";
const ACCOUNT_KEY = "AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID";
const ENV_KEY = "AIRWALLEX_ENV";
const PRICE_KEYS = {
  starter: "AIRWALLEX_PRICE_STARTER",
  pro: "AIRWALLEX_PRICE_PRO",
  agency: "AIRWALLEX_PRICE_AGENCY",
} as const;

export const AIRWALLEX_HOSTS = {
  sandbox: "https://api.sandbox.airwallex.com",
  live: "https://api.airwallex.com",
} as const;

export type AirwallexEnv = keyof typeof AIRWALLEX_HOSTS;

export type AirwallexConfig = {
  clientId: string;
  apiKey: string;
  webhookSecret: string | null;
  legalEntityId: string | null;
  linkedPaymentAccountId: string | null;
  env: AirwallexEnv;
  priceIds: { starter: string | null; pro: string | null; agency: string | null };
};

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

function asEnv(value: string | null | undefined): AirwallexEnv {
  return value === "live" ? "live" : "sandbox";
}

export async function loadAirwallexConfig(): Promise<AirwallexConfig | null> {
  const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim() || "";
  const apiKey = (await readAppSetting(API_KEY_KEY))?.trim() || "";
  if (!clientId || !apiKey || looksRedacted(clientId) || looksRedacted(apiKey)) return null;
  const webhookSecret = (await readAppSetting(WEBHOOK_KEY))?.trim() || "";
  const legalEntityId = (await readAppSetting(LEGAL_KEY))?.trim() || "";
  const linkedPaymentAccountId = (await readAppSetting(ACCOUNT_KEY))?.trim() || "";
  const env = asEnv(await readAppSetting(ENV_KEY));
  const priceIds = {
    starter: (await readAppSetting(PRICE_KEYS.starter))?.trim() || null,
    pro: (await readAppSetting(PRICE_KEYS.pro))?.trim() || null,
    agency: (await readAppSetting(PRICE_KEYS.agency))?.trim() || null,
  };
  return {
    clientId,
    apiKey,
    webhookSecret: webhookSecret && !looksRedacted(webhookSecret) ? webhookSecret : null,
    legalEntityId: legalEntityId || null,
    linkedPaymentAccountId: linkedPaymentAccountId || null,
    env,
    priceIds,
  };
}

export function airwallexHasPrice(config: AirwallexConfig): boolean {
  return Boolean(config.priceIds.starter || config.priceIds.pro || config.priceIds.agency);
}

export async function persistAirwallexSettings(values: Record<string, string>): Promise<void> {
  const clientId = (values.clientId ?? values.key ?? "").trim();
  const apiKey = (values.apiKey ?? values.secret ?? "").trim();
  if (clientId) {
    if (clientId.length < 8) throw new Error("KEY_TOO_SHORT");
    await writeAppSetting(CLIENT_ID_KEY, clientId);
  }
  if (apiKey) {
    if (apiKey.length < 12) throw new Error("KEY_TOO_SHORT");
    await writeAppSetting(API_KEY_KEY, apiKey);
  }
  const webhook = (values.webhookSecret ?? "").trim();
  if (webhook) await writeAppSetting(WEBHOOK_KEY, webhook);
  const legal = (values.legalEntityId ?? "").trim();
  if (legal) await writeAppSetting(LEGAL_KEY, legal);
  else if ("legalEntityId" in values) await deleteAppSetting(LEGAL_KEY);
  const account = (values.linkedPaymentAccountId ?? "").trim();
  if (account) await writeAppSetting(ACCOUNT_KEY, account);
  else if ("linkedPaymentAccountId" in values) await deleteAppSetting(ACCOUNT_KEY);
  const envRaw = (values.env ?? "").trim().toLowerCase();
  await writeAppSetting(ENV_KEY, envRaw === "live" ? "live" : "sandbox");
  for (const [plan, key] of Object.entries(PRICE_KEYS)) {
    const value = (values[`price_${plan}`] ?? values[`price${plan[0]!.toUpperCase()}${plan.slice(1)}`] ?? "").trim();
    if (value) await writeAppSetting(key, value);
  }
  const starter = (values.priceStarter ?? "").trim();
  const pro = (values.pricePro ?? "").trim();
  const agency = (values.priceAgency ?? "").trim();
  if (starter) await writeAppSetting(PRICE_KEYS.starter, starter);
  if (pro) await writeAppSetting(PRICE_KEYS.pro, pro);
  if (agency) await writeAppSetting(PRICE_KEYS.agency, agency);
}

export async function disconnectAirwallex(): Promise<void> {
  await deleteAppSetting(CLIENT_ID_KEY);
  await deleteAppSetting(API_KEY_KEY);
  await deleteAppSetting(WEBHOOK_KEY);
  await deleteAppSetting(LEGAL_KEY);
  await deleteAppSetting(ACCOUNT_KEY);
}

export async function airwallexLast4(): Promise<string | null> {
  const key = (await readAppSetting(API_KEY_KEY))?.trim() || "";
  return last4(key || null);
}

type TokenCache = { token: string; expiresAt: number; env: AirwallexEnv; clientId: string };
const tokenCache: { current: TokenCache | null } = { current: null };

export async function airwallexLogin(config: AirwallexConfig): Promise<string> {
  const cached = tokenCache.current;
  if (
    cached &&
    cached.env === config.env &&
    cached.clientId === config.clientId &&
    cached.expiresAt - Date.now() > 60_000
  ) {
    return cached.token;
  }
  const response = await fetch(`${AIRWALLEX_HOSTS[config.env]}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.clientId,
      "x-api-key": config.apiKey,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("AIRWALLEX_UNAVAILABLE");
  }
  if (!response.ok) throw new Error("AIRWALLEX_UNAVAILABLE");
  const body = (await response.json()) as { token?: string; expires_at?: string };
  const token = body.token?.trim();
  if (!token) throw new Error("AIRWALLEX_UNAVAILABLE");
  const expiresAt = body.expires_at ? Date.parse(body.expires_at) : Date.now() + 25 * 60_000;
  tokenCache.current = {
    token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 25 * 60_000,
    env: config.env,
    clientId: config.clientId,
  };
  return token;
}

export async function testAirwallexConnection(): Promise<{ ok: true }> {
  const config = await loadAirwallexConfig();
  if (!config) throw new Error("AIRWALLEX_UNAVAILABLE");
  await airwallexLogin(config);
  return { ok: true };
}

async function airwallexFetch(
  config: AirwallexConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Response> {
  const token = await airwallexLogin(config);
  return fetch(`${AIRWALLEX_HOSTS[config.env]}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(20000),
  });
}

export function publicAppOrigin(): string {
  const envUrl = process.env.BETTER_AUTH_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  try {
    const request = getRequest();
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (request.url.startsWith("http:") ? "http" : "https");
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      "";
    if (host) return `${proto}://${host}`;
  } catch {
    /* no request context */
  }
  return "http://127.0.0.1:8080";
}

export type CheckoutCreateInput = {
  priceId: string;
  email: string;
  name: string;
  requestId: string;
  successUrl: string;
  backUrl: string;
};

export async function createBillingCheckout(
  config: AirwallexConfig,
  input: CheckoutCreateInput,
): Promise<{ id: string; url: string }> {
  const body: Record<string, unknown> = {
    request_id: input.requestId,
    mode: "SUBSCRIPTION",
    ui_mode: "HOSTED",
    success_url: input.successUrl,
    back_url: input.backUrl,
    customer_data: {
      email: input.email,
      name: input.name || input.email,
      type: "INDIVIDUAL",
    },
    line_items: [{ price_id: input.priceId, quantity: 1 }],
    payment_options: {
      payment_method_types: ["card", "applepay", "googlepay"],
    },
    metadata: { app: "clippy-admin" },
  };
  if (config.legalEntityId) body.legal_entity_id = config.legalEntityId;
  if (config.linkedPaymentAccountId) {
    body.linked_payment_account_id = config.linkedPaymentAccountId;
  }
  const response = await airwallexFetch(config, "/api/v1/billing/billing_checkouts/create", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new Error("AIRWALLEX_CHECKOUT_FAILED");
  }
  const payload = (await response.json()) as { id?: string; url?: string };
  if (!payload.id || !payload.url) throw new Error("AIRWALLEX_CHECKOUT_FAILED");
  return { id: payload.id, url: payload.url };
}

export async function retrieveCheckout(
  config: AirwallexConfig,
  checkoutId: string,
): Promise<Record<string, unknown> | null> {
  const encoded = encodeURIComponent(checkoutId);
  const response = await airwallexFetch(config, `/api/v1/billing/billing_checkouts/${encoded}`);
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

export async function retrieveSubscription(
  config: AirwallexConfig,
  subscriptionId: string,
): Promise<Record<string, unknown> | null> {
  const encoded = encodeURIComponent(subscriptionId);
  const paths = [
    `/api/v1/billing/subscriptions/${encoded}`,
    `/api/v1/subscriptions/${encoded}`,
  ];
  for (const path of paths) {
    const response = await airwallexFetch(config, path);
    if (response.ok) return (await response.json()) as Record<string, unknown>;
  }
  return null;
}

export async function cancelAirwallexSubscription(
  config: AirwallexConfig,
  subscriptionId: string,
): Promise<boolean> {
  const encoded = encodeURIComponent(subscriptionId);
  const requestId = crypto.randomUUID();
  const attempts: Array<{ path: string; body: unknown }> = [
    {
      path: `/api/v1/billing/subscriptions/${encoded}/cancel`,
      body: { request_id: requestId, proration_behavior: "NONE" },
    },
    {
      path: `/api/v1/billing/subscriptions/cancel`,
      body: { id: subscriptionId, request_id: requestId },
    },
  ];
  for (const attempt of attempts) {
    const response = await airwallexFetch(config, attempt.path, {
      method: "POST",
      body: attempt.body,
    });
    if (response.ok) return true;
  }
  return false;
}

export function verifyAirwallexSignature(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  nowMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts) || !input.signature || !input.secret) return false;
  if (Math.abs(now - ts) > 5 * 60 * 1000) return false;
  const expectedHex = createHmac("sha256", input.secret)
    .update(`${input.timestamp}${input.rawBody}`)
    .digest("hex");
  const given = input.signature.replace(/^sha256=/i, "").trim().toLowerCase();
  const expectedBuf = Buffer.from(expectedHex, "hex");
  let givenBuf: Buffer;
  try {
    givenBuf = Buffer.from(given, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== givenBuf.length) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

export function sanitizeAirwallexError(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/[A-Za-z0-9+/]{24,}={0,2}/g, "[redacted]")
    .slice(0, 180);
}
