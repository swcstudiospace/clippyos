/**
 * Whop Billing — server-only. Keys live in AppSetting.
 * Embedded/hosted checkout only; no raw card data touches ClippyOS.
 *
 * Pure helpers (webhook signature verification, event mapping) keep runtime
 * dependencies behind dynamic imports so `node --test` can load this module
 * directly (tests only exercise the pure surface).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingInvoice,
  BillingStatus,
  SaasPlanKey,
  WorkspaceSubscription,
} from "@/lib/billing";

const API_KEY_KEY = "WHOP_API_KEY";
const WEBHOOK_KEY = "WHOP_WEBHOOK_SECRET";
const ACCOUNT_KEY = "WHOP_ACCOUNT_ID";
const ENV_KEY = "WHOP_ENV";
const COMMUNITY_URL_KEY = "WHOP_COMMUNITY_URL";
const CARD_KEY = "BILLING_CARD_JSON";

export const WHOP_PLAN_SETTING_KEYS = {
  starter: "WHOP_PLAN_STARTER",
  pro: "WHOP_PLAN_PRO",
  agency: "WHOP_PLAN_AGENCY",
} as const;

export const WHOP_HOSTS = {
  sandbox: "https://sandbox-api.whop.com/api/v1",
  live: "https://api.whop.com/api/v1",
} as const;
export type WhopEnv = keyof typeof WHOP_HOSTS;

/** Dated API pin — bump deliberately; request/response shapes follow it. */
export const WHOP_API_VERSION_DATE = "2026-08-14";

export type WhopPlanIds = Record<SaasPlanKey, string | null>;

export type WhopConfig = {
  apiKey: string;
  webhookSecret: string | null;
  accountId: string | null;
  env: WhopEnv;
  communityUrl: string | null;
  planIds: WhopPlanIds;
};

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}


async function settingsStore() {
  return import("@/lib/server/app-settings.server");
}

export async function loadWhopConfig(): Promise<WhopConfig | null> {
  const { readAppSetting } = await settingsStore();
  const apiKey = (await readAppSetting(API_KEY_KEY))?.trim() || "";
  if (!apiKey || looksRedacted(apiKey)) return null;
  const planIds: WhopPlanIds = {
    starter: (await readAppSetting(WHOP_PLAN_SETTING_KEYS.starter))?.trim() || null,
    pro: (await readAppSetting(WHOP_PLAN_SETTING_KEYS.pro))?.trim() || null,
    agency: (await readAppSetting(WHOP_PLAN_SETTING_KEYS.agency))?.trim() || null,
  };
  if (planIds.starter && looksRedacted(planIds.starter)) planIds.starter = null;
  if (planIds.pro && looksRedacted(planIds.pro)) planIds.pro = null;
  if (planIds.agency && looksRedacted(planIds.agency)) planIds.agency = null;
  const webhookSecret = (await readAppSetting(WEBHOOK_KEY))?.trim() || null;
  const accountId = (await readAppSetting(ACCOUNT_KEY))?.trim() || null;
  const communityUrl = (await readAppSetting(COMMUNITY_URL_KEY))?.trim() || null;
  return {
    apiKey,
    webhookSecret: webhookSecret && !looksRedacted(webhookSecret) ? webhookSecret : null,
    accountId,
    env: (await readAppSetting(ENV_KEY)) === "live" ? "live" : "sandbox",
    communityUrl,
    planIds,
  };
}

export function whopHasPlans(config: WhopConfig): boolean {
  return Boolean(config.planIds.starter || config.planIds.pro || config.planIds.agency);
}

export async function persistWhopSettings(values: Record<string, string>): Promise<void> {
  const { writeAppSetting } = await settingsStore();
  const apiKey = (values.apiKey ?? values.key ?? "").trim();
  if (apiKey) await writeAppSetting(API_KEY_KEY, apiKey);
  const webhookSecret = (values.webhookSecret ?? values.secret ?? "").trim();
  if (webhookSecret) await writeAppSetting(WEBHOOK_KEY, webhookSecret);
  const accountId = (values.accountId ?? "").trim();
  if (accountId) await writeAppSetting(ACCOUNT_KEY, accountId);
  const env = (values.env ?? "").trim();
  if (env === "sandbox" || env === "live") await writeAppSetting(ENV_KEY, env);
  const communityUrl = (values.communityUrl ?? "").trim();
  if (communityUrl) await writeAppSetting(COMMUNITY_URL_KEY, communityUrl);
  const plans: Array<[keyof typeof WHOP_PLAN_SETTING_KEYS, string]> = [
    ["starter", (values.planStarter ?? "").trim()],
    ["pro", (values.planPro ?? "").trim()],
    ["agency", (values.planAgency ?? "").trim()],
  ];
  for (const [tier, planId] of plans) {
    if (planId) await writeAppSetting(WHOP_PLAN_SETTING_KEYS[tier], planId);
  }
}

export async function disconnectWhop(): Promise<void> {
  const { deleteAppSetting } = await settingsStore();
  for (const key of [
    API_KEY_KEY,
    WEBHOOK_KEY,
    ACCOUNT_KEY,
    ENV_KEY,
    COMMUNITY_URL_KEY,
    CARD_KEY,
    ...Object.values(WHOP_PLAN_SETTING_KEYS),
  ]) {
    await deleteAppSetting(key);
  }
}

export async function whopCard(): Promise<{ brand: string | null; last4: string | null } | null> {
  const { readAppSetting } = await settingsStore();
  const raw = await readAppSetting(CARD_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { brand?: unknown; last4?: unknown };
    const brand = typeof parsed.brand === "string" ? parsed.brand : null;
    const last4 = typeof parsed.last4 === "string" ? parsed.last4 : null;
    if (!brand && !last4) return null;
    return { brand, last4 };
  } catch {
    return null;
  }
}

export async function persistWhopCard(
  card: { brand: string; last4: string } | null,
): Promise<void> {
  if (!card) return;
  const { writeAppSetting } = await settingsStore();
  await writeAppSetting(CARD_KEY, JSON.stringify(card));
}

export async function testWhopConnection(config: WhopConfig): Promise<{ ok: true }> {
  const res = await whopFetch(config, "/companies?limit=1");
  if (!res.ok) throw new Error("WHOP_TEST_FAILED");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// REST client
// ---------------------------------------------------------------------------

type WhopFetchInit = {
  method?: string;
  body?: unknown;
  idempotencyKey?: string;
};

async function whopFetch(
  config: WhopConfig,
  path: string,
  init: WhopFetchInit = {},
): Promise<Response> {
  return fetch(`${WHOP_HOSTS[config.env]}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Api-Version-Date": WHOP_API_VERSION_DATE,
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export function sanitizeWhopError(message: string): string {
  return message.length > 400 ? `${message.slice(0, 397)}…` : message;
}

// ---------------------------------------------------------------------------
// Checkout + membership lifecycle
// ---------------------------------------------------------------------------

export type CheckoutSession = {
  /** `ch_…` session/configuration id — also the embedded checkout sessionId. */
  id: string;
  /** Hosted fallback URL (`purchase_url`) when Whop returns one. */
  url: string | null;
  planId: string | null;
};

export async function createCheckoutConfiguration(
  config: WhopConfig,
  input: { planId: string; metadata: Record<string, string>; redirectUrl: string },
): Promise<CheckoutSession> {
  const res = await whopFetch(config, "/checkout_configurations", {
    method: "POST",
    idempotencyKey: crypto.randomUUID(),
    body: {
      account_id: config.accountId,
      plan_id: input.planId,
      metadata: input.metadata,
      redirect_url: input.redirectUrl,
    },
  });
  if (!res.ok) {
    throw new Error(`WHOP_CHECKOUT_FAILED:${sanitizeWhopError(await res.text())}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  const id = typeof json.id === "string" ? json.id : null;
  if (!id) throw new Error("WHOP_CHECKOUT_FAILED:no session id");
  const plan =
    json.plan && typeof json.plan === "object"
      ? (json.plan as Record<string, unknown>)
      : undefined;
  return {
    id,
    url: typeof json.purchase_url === "string" ? json.purchase_url : null,
    planId: typeof plan?.id === "string" ? plan.id : input.planId,
  };
}

export async function retrieveMembership(
  config: WhopConfig,
  membershipId: string,
): Promise<Record<string, unknown> | null> {
  const res = await whopFetch(config, `/memberships/${encodeURIComponent(membershipId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`WHOP_MEMBERSHIP_LOOKUP_FAILED:${sanitizeWhopError(await res.text())}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function cancelMembershipAtPeriodEnd(
  config: WhopConfig,
  membershipId: string,
): Promise<boolean> {
  const res = await whopFetch(config, `/memberships/${encodeURIComponent(membershipId)}/cancel`, {
    method: "POST",
    body: { cancel_at_period_end: true },
  });
  return res.ok;
}

export async function listMembershipsByPlan(
  config: WhopConfig,
  planId: string,
  limit = 20,
): Promise<Array<Record<string, unknown>>> {
  const res = await whopFetch(
    config,
    `/memberships?plan_id=${encodeURIComponent(planId)}&limit=${limit}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: unknown } | unknown[];
  if (Array.isArray(json))
    return json.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  return Array.isArray(json.data) ? (json.data as Array<Record<string, unknown>>) : [];
}

// ---------------------------------------------------------------------------
// Webhook signature — Standard Webhooks spec
// ---------------------------------------------------------------------------

function signatureKey(secret: string): Buffer {
  const bare = secret.replace(/^(whsec_|ws_)/, "");
  const decoded = Buffer.from(bare, "base64");
  if (decoded.length > 0 && /^[A-Za-z0-9+/=_-]+$/.test(bare)) return decoded;
  return Buffer.from(bare, "utf8");
}

export function verifyWhopSignature(input: {
  secret: string;
  id: string;
  timestamp: string;
  rawBody: string;
  signatureHeader: string;
}): boolean {
  const timestampMs = Number(input.timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) return false;
  // Standard Webhooks replay window.
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;
  const expected = createHmac("sha256", signatureKey(input.secret))
    .update(`${input.id}.${input.timestamp}.${input.rawBody}`)
    .digest("base64");
  // Header format: space-separated schemes, each `v1,<base64 sig>`.
  return input.signatureHeader
    .split(" ")
    .filter(Boolean)
    .some((scheme) => {
      const [version, sig] = scheme.split(",");
      if (version !== "v1" || !sig) return false;
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    });
}

// ---------------------------------------------------------------------------
// Event → subscription state mapping (pure)
// ---------------------------------------------------------------------------

const MRR_BY_PLAN: Record<SaasPlanKey, number> = { starter: 99, pro: 249, agency: 499 };

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function nestedString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object") return null;
  return pickString((value as Record<string, unknown>)[key]);
}

function pickTime(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value > 1e12 ? value : value * 1000;
      return new Date(ms).toISOString();
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    }
  }
  return null;
}

function asPlanKey(value: unknown): SaasPlanKey | null {
  return value === "starter" || value === "pro" || value === "agency" ? value : null;
}

function planKeyFromPlanId(planId: string | null, planIds: WhopPlanIds): SaasPlanKey | null {
  if (!planId) return null;
  for (const key of ["starter", "pro", "agency"] as const) {
    if (planIds[key] === planId) return key;
  }
  return null;
}

function statusFromMembership(status: string | null): BillingStatus | null {
  switch (status) {
    case "trialing":
      return "in_trial";
    case "active":
    case "canceling":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "expired":
    case "completed":
      return "canceled";
    default:
      return null;
  }
}

export type WhopEventApplication = {
  patch: Partial<WorkspaceSubscription>;
  invoice: BillingInvoice | null;
  card: { brand: string; last4: string } | null;
};

/**
 * Map a Whop webhook event (or a fetched membership/payment object paired with
 * a synthetic event name) onto the provider-neutral subscription patch.
 */
export function mapWhopEvent(
  eventName: string,
  data: Record<string, unknown>,
  planIds: WhopPlanIds,
): WhopEventApplication {
  const name = eventName.toLowerCase();
  const patch: Partial<WorkspaceSubscription> = {};

  const statusHint = statusFromMembership(pickString(data.status));
  let status: BillingStatus | null = null;
  if (name.includes("membership.deactivated")) status = "canceled";
  else if (name.includes("payment.succeeded") || name.includes("invoice.paid")) status = "active";
  else if (name.includes("payment.failed") || name.includes("invoice.past_due")) status = "past_due";
  else status = statusHint;

  const planId = pickString(nestedString(data.plan, "id"));
  const metadata = data.metadata && typeof data.metadata === "object" ? data.metadata : {};
  const planKey =
    asPlanKey(nestedString(metadata, "planKey") ?? nestedString(data.plan, "planKey")) ??
    planKeyFromPlanId(planId, planIds);

  const membershipId = nestedString(data.membership, "id");
  const memberId = pickString(
    membershipId?.startsWith("mem_") ? membershipId : null,
    typeof data.id === "string" && data.id.startsWith("mem_") ? data.id : null,
  );
  const checkoutId = pickString(data.checkout_configuration_id, data.checkout_id);
  const customerId = pickString(nestedString(data.user, "id"), nestedString(data.member, "id"));
  const periodEnd = pickTime(data.renewal_period_end, data.current_period_end);

  if (status && !(status === "active" && planId && !planKey)) patch.status = status;
  if (planKey) {
    patch.planKey = planKey;
    patch.mrr = MRR_BY_PLAN[planKey];
  }
  if (planId) patch.priceId = planId;
  if (memberId) patch.externalSubscriptionId = memberId;
  if (checkoutId) patch.externalCheckoutId = checkoutId;
  if (customerId) patch.externalCustomerId = customerId;
  if (periodEnd) patch.currentPeriodEnd = periodEnd;
  if (typeof data.cancel_at_period_end === "boolean") {
    patch.cancelAtPeriodEnd = data.cancel_at_period_end;
  }

  let invoice: BillingInvoice | null = null;
  const isInvoiceEvent = name.includes("invoice.");
  const isPaidPayment = name.includes("payment.succeeded");
  if (isInvoiceEvent || isPaidPayment) {
    const invoiceId = pickString(data.id, data.invoice_id) ?? crypto.randomUUID();
    const amountRaw =
      data.settlement_amount ?? data.total ?? data.usd_total ?? data.subtotal ?? data.amount_after_fees ?? 0;
    const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw) || 0;
    const paid = isPaidPayment || name.includes("paid");
    const invoiceStatus = paid
      ? "paid"
      : (pickString(data.status) ?? (name.includes("past_due") ? "past_due" : "open"));
    invoice = {
      id: invoiceId,
      externalId: invoiceId,
      amount,
      currency: (pickString(data.currency) ?? "usd").toUpperCase(),
      status: invoiceStatus,
      hostedUrl: pickString(data.invoice_url, data.hosted_url, data.url),
      periodStart: pickTime(data.period_start, data.renewal_period_start),
      periodEnd: pickTime(data.period_end, data.renewal_period_end),
      paidAt: paid ? new Date().toISOString() : pickTime(data.paid_at),
      createdAt: pickTime(data.created_at) ?? new Date().toISOString(),
    };
    patch.lastInvoiceStatus = invoiceStatus;
    patch.lastInvoiceAt = new Date().toISOString();
  }

  let card: { brand: string; last4: string } | null = null;
  const brand = pickString(data.card_brand);
  const last4 = pickString(data.card_last4);
  if (brand && last4) card = { brand, last4 };
  return { patch, invoice, card };
}

/**
 * Whop delivers events without ordering guarantees: a late `payment.*` or
 * `invoice.*` event must not flip a workspace that membership.deactivated
 * already canceled.
 */
export function shouldIgnoreStatusFlip(currentStatus: string, eventName: string): boolean {
  return currentStatus === "canceled" && /^(payment|invoice)\./i.test(eventName);
}
