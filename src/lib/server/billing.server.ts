import { getSql } from "@/lib/db";
import {
  BILLING_STATUSES,
  DEFAULT_SAAS_PLANS,
  SAAS_PLAN_KEYS,
  emptyProductOnboarding,
  isEntitled,
  parseClientChecklist,
  type BillingInvoice,
  type BillingSnapshot,
  type BillingStatus,
  type ClientOnboardingChecklist,
  type ProductOnboardingState,
  type SaasPlan,
  type SaasPlanKey,
  type WorkspaceRole,
  type WorkspaceSubscription,
} from "@/lib/billing";
import { getUserRole } from "@/lib/server/access";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import {
  cancelMembershipAtPeriodEnd,
  createCheckoutConfiguration,
  listMembershipsByPlan,
  loadWhopConfig,
  mapWhopEvent,
  retrieveMembership,
  shouldIgnoreStatusFlip,
  whopCard,
  whopHasPlans,
  persistWhopCard,
  type WhopEventApplication,
} from "@/lib/server/whop.server";
import { publicAppOrigin } from "@/lib/server/public-origin.server";
import {
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";

const SUB_KEY = "WORKSPACE_SUBSCRIPTION_JSON";
const INVOICES_KEY = "BILLING_INVOICES_JSON";
const PRODUCT_KEY = "PRODUCT_ONBOARDING_JSON";
const EVENTS_KEY = "WHOP_WEBHOOK_EVENTS_JSON";
const DEFAULT_SUB_ID = "default";

let schemaReady: Promise<void> | null = null;

async function ensureBillingSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    try {
      const sql = await localSql();
      await sql.query(`
        create table if not exists workspace_subscriptions (
          id                       text primary key,
          status                   text not null default 'none',
          plan_key                 text,
          price_id                 text,
          external_customer_id     text,
          external_subscription_id text,
          external_checkout_id     text,
          current_period_end       timestamptz,
          cancel_at_period_end     boolean not null default false,
          last_invoice_status      text,
          last_invoice_at          timestamptz,
          mrr                      numeric(12, 2),
          created_at               timestamptz not null default now(),
          updated_at               timestamptz not null default now()
        )
      `);
      await sql.query(`alter table clients add column if not exists onboarding_checklist text`);
    } catch {
      /* JSON snapshot is enough */
    }
  })();
  return schemaReady;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptySubscription(): WorkspaceSubscription {
  return {
    status: "none",
    planKey: null,
    priceId: null,
    externalCustomerId: null,
    externalSubscriptionId: null,
    externalCheckoutId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    lastInvoiceStatus: null,
    lastInvoiceAt: null,
    mrr: null,
    updatedAt: null,
  };
}

function asStatus(value: unknown): BillingStatus {
  const raw = String(value ?? "").toLowerCase().replace(/-/g, "_");
  if (raw === "trialing" || raw === "trial") return "in_trial";
  if (raw === "cancelled") return "canceled";
  if ((BILLING_STATUSES as readonly string[]).includes(raw)) return raw as BillingStatus;
  return "none";
}

function asPlanKey(value: unknown): SaasPlanKey | null {
  const raw = String(value ?? "").toLowerCase();
  if ((SAAS_PLAN_KEYS as readonly string[]).includes(raw)) return raw as SaasPlanKey;
  return null;
}

export async function readSubscription(): Promise<WorkspaceSubscription> {
  const raw = await readAppSetting(SUB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<WorkspaceSubscription>;
      return { ...emptySubscription(), ...parsed, status: asStatus(parsed.status) };
    } catch {
      /* fall through */
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from workspace_subscriptions where id = $1",
      [DEFAULT_SUB_ID],
    );
    const row = rows[0];
    if (!row) return emptySubscription();
    return {
      status: asStatus(row.status),
      planKey: asPlanKey(row.plan_key),
      priceId: typeof row.price_id === "string" ? row.price_id : null,
      externalCustomerId:
        typeof row.external_customer_id === "string" ? row.external_customer_id : null,
      externalSubscriptionId:
        typeof row.external_subscription_id === "string" ? row.external_subscription_id : null,
      externalCheckoutId:
        typeof row.external_checkout_id === "string" ? row.external_checkout_id : null,
      currentPeriodEnd:
        typeof row.current_period_end === "string" ? row.current_period_end : null,
      cancelAtPeriodEnd: row.cancel_at_period_end === true,
      lastInvoiceStatus:
        typeof row.last_invoice_status === "string" ? row.last_invoice_status : null,
      lastInvoiceAt: typeof row.last_invoice_at === "string" ? row.last_invoice_at : null,
      mrr: typeof row.mrr === "number" ? row.mrr : row.mrr != null ? Number(row.mrr) : null,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    };
  } catch {
    return emptySubscription();
  }
}

export async function writeSubscription(
  patch: Partial<WorkspaceSubscription>,
): Promise<WorkspaceSubscription> {
  await ensureBillingSchema();
  const current = await readSubscription();
  const next: WorkspaceSubscription = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  await writeAppSetting(SUB_KEY, JSON.stringify(next));
  const admin = await getAgencyAdmin();
  const row = {
    id: DEFAULT_SUB_ID,
    status: next.status,
    plan_key: next.planKey,
    price_id: next.priceId,
    external_customer_id: next.externalCustomerId,
    external_subscription_id: next.externalSubscriptionId,
    external_checkout_id: next.externalCheckoutId,
    current_period_end: next.currentPeriodEnd,
    cancel_at_period_end: next.cancelAtPeriodEnd,
    last_invoice_status: next.lastInvoiceStatus,
    last_invoice_at: next.lastInvoiceAt,
    mrr: next.mrr,
    updated_at: next.updatedAt,
  };
  if (admin) {
    const { error } = await admin.from("workspace_subscriptions").upsert(row, { onConflict: "id" });
    if (error && !isMissingTable(error)) {
      /* JSON snapshot is the source of truth */
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into workspace_subscriptions (
        id, status, plan_key, price_id, external_customer_id, external_subscription_id,
        external_checkout_id, current_period_end, cancel_at_period_end, last_invoice_status,
        last_invoice_at, mrr, created_at, updated_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
      on conflict (id) do update set
        status = excluded.status,
        plan_key = excluded.plan_key,
        price_id = excluded.price_id,
        external_customer_id = excluded.external_customer_id,
        external_subscription_id = excluded.external_subscription_id,
        external_checkout_id = excluded.external_checkout_id,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        last_invoice_status = excluded.last_invoice_status,
        last_invoice_at = excluded.last_invoice_at,
        mrr = excluded.mrr,
        updated_at = excluded.updated_at`,
      [
        DEFAULT_SUB_ID,
        next.status,
        next.planKey,
        next.priceId,
        next.externalCustomerId,
        next.externalSubscriptionId,
        next.externalCheckoutId,
        next.currentPeriodEnd,
        next.cancelAtPeriodEnd,
        next.lastInvoiceStatus,
        next.lastInvoiceAt,
        next.mrr,
        next.updatedAt,
      ],
    );
  } catch {
    /* JSON snapshot is enough */
  }
  return next;
}

export async function readInvoices(): Promise<BillingInvoice[]> {
  const raw = await readAppSetting(INVOICES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BillingInvoice[];
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

export async function upsertInvoice(invoice: BillingInvoice): Promise<void> {
  const list = await readInvoices();
  const next = [invoice, ...list.filter((row) => row.externalId !== invoice.externalId)].slice(0, 50);
  await writeAppSetting(INVOICES_KEY, JSON.stringify(next));
}

export async function readProductOnboarding(): Promise<ProductOnboardingState> {
  const empty = emptyProductOnboarding();
  const raw = await readAppSetting(PRODUCT_KEY);
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<ProductOnboardingState>;
    return {
      dismissed: parsed.dismissed === true,
      steps: { ...empty.steps, ...(parsed.steps ?? {}) },
    };
  } catch {
    return empty;
  }
}

export async function writeProductOnboarding(
  state: ProductOnboardingState,
): Promise<ProductOnboardingState> {
  await writeAppSetting(PRODUCT_KEY, JSON.stringify(state));
  return state;
}

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const raw = await readAppSetting(EVENTS_KEY);
  let ids: string[] = [];
  if (raw) {
    try {
      ids = JSON.parse(raw) as string[];
    } catch {
      ids = [];
    }
  }
  if (ids.includes(eventId)) return true;
  ids.unshift(eventId);
  await writeAppSetting(EVENTS_KEY, JSON.stringify(ids.slice(0, 200)));
  return false;
}


async function applyWhopApplication(application: WhopEventApplication): Promise<void> {
  const { patch, invoice, card } = application;
  if (invoice) await upsertInvoice(invoice);
  await persistWhopCard(card);
  if (Object.keys(patch).length > 0) {
    await writeSubscription(patch);
    if (patch.status === "past_due" || patch.status === "canceled" || patch.status === "unpaid") {
      void import("@/lib/server/safety-hooks.server")
        .then((mod) => mod.onSaasStatus({ status: patch.status as string }))
        .catch(() => {});
    }
  }
}

export async function handleWhopWebhook(
  eventId: string,
  eventName: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (eventId && (await alreadyProcessed(eventId))) return;
  const config = await loadWhopConfig();
  const application = mapWhopEvent(
    eventName,
    data,
    config?.planIds ?? { starter: null, pro: null, agency: null },
  );
  // Whop does not guarantee delivery order: a late payment.*/invoice.* event
  // must not resurrect a workspace that membership.deactivated canceled.
  const current = await readSubscription();
  if (application.patch.status && shouldIgnoreStatusFlip(current.status, eventName)) {
    delete application.patch.status;
  }
  await applyWhopApplication(application);
}


export async function refreshFromWhop(): Promise<WorkspaceSubscription> {
  const config = await loadWhopConfig();
  const current = await readSubscription();
  if (!config) return current;
  let remote: Record<string, unknown> | null = null;
  if (current.externalSubscriptionId) {
    remote = await retrieveMembership(config, current.externalSubscriptionId);
  } else if (current.externalCheckoutId && current.priceId) {
    // Webhook may have been missed right after checkout; reconcile by plan id.
    const rows = await listMembershipsByPlan(config, current.priceId);
    remote =
      rows.find((row) => row.checkout_configuration_id === current.externalCheckoutId) ?? null;
  }
  if (remote) {
    await applyWhopApplication(mapWhopEvent("membership.synced", remote, config.planIds));
  }
  return readSubscription();
}

async function countSeats(): Promise<number> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{ n: string | number }>(
      `select count(*) as n from app_profiles where coalesce(status, 'ACTIVE') <> 'REVOKED'`,
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 1;
  }
}

export async function buildBillingSnapshot(
  userId: string,
  returnCheckout: BillingSnapshot["returnCheckout"] = null,
): Promise<BillingSnapshot> {
  const [role, subscription, invoices, config] = await Promise.all([
    getUserRole(userId),
    readSubscription(),
    readInvoices(),
    loadWhopConfig(),
  ]);
  const workspaceRole: WorkspaceRole = role === "admin" ? "owner" : "member";
  const hasCreds = Boolean(config);
  const hasPrice = Boolean(config && whopHasPlans(config));
  const enforced = hasCreds && hasPrice;
  const plans: SaasPlan[] = SAAS_PLAN_KEYS.map((key) => ({
    ...DEFAULT_SAAS_PLANS[key],
    priceId: config?.planIds[key] ?? null,
  }));
  const plan = subscription.planKey ? DEFAULT_SAAS_PLANS[subscription.planKey] : null;
  const seatsUsed = await countSeats();
  return {
    role: workspaceRole,
    enforced,
    entitled: !enforced || isEntitled(subscription.status),
    subscription,
    plans,
    invoices,
    seatsUsed,
    seatLimit: plan?.seats ?? null,
    whop: {
      configured: hasCreds,
      env: config?.env ?? "sandbox",
      hasWebhookSecret: Boolean(config?.webhookSecret),
      accountIdSet: Boolean(config?.accountId),
      communityUrl: config?.communityUrl ?? null,
      last4: (await whopCard())?.last4 ?? null,
    },
    returnCheckout,
  };
}

export async function startHostedCheckout(input: {
  userId: string;
  planKey: SaasPlanKey;
  email: string;
  name: string;
}): Promise<{ sessionId: string; hostedUrl: string | null }> {
  const config = await loadWhopConfig();
  if (!config) throw new Error("WHOP_UNAVAILABLE");
  const planId = config.planIds[input.planKey];
  if (!planId) throw new Error("WHOP_PRICE_MISSING");
  const origin = publicAppOrigin();
  const session = await createCheckoutConfiguration(config, {
    planId,
    metadata: { planKey: input.planKey },
    redirectUrl: `${origin}/billing?checkout=success`,
  });
  await writeSubscription({
    planKey: input.planKey,
    priceId: session.planId ?? planId,
    externalCheckoutId: session.id,
  });
  void import("@/lib/server/safety-hooks.server")
    .then((mod) =>
      mod.onPayLinkCreated({
        actorId: input.userId,
        checkoutId: session.id,
        planKey: input.planKey,
      }),
    )
    .catch(() => {});
  return { sessionId: session.id, hostedUrl: session.url };
}

export async function requestCancelAtPeriodEnd(): Promise<WorkspaceSubscription> {
  const config = await loadWhopConfig();
  const current = await readSubscription();
  if (config && current.externalSubscriptionId) {
    await cancelMembershipAtPeriodEnd(config, current.externalSubscriptionId);
  }
  return writeSubscription({ cancelAtPeriodEnd: true });
}

export function parseClientChecklistColumn(raw: unknown): ClientOnboardingChecklist {
  if (typeof raw === "string") {
    try {
      return parseClientChecklist(JSON.parse(raw));
    } catch {
      return parseClientChecklist(null);
    }
  }
  return parseClientChecklist(raw);
}
