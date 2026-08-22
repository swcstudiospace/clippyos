import { A as isMissingTable, O as isEntitled, T as emptyProductOnboarding, _ as SAAS_PLAN_KEYS, n as BILLING_STATUSES, o as DEFAULT_SAAS_PLANS } from "./mappers-Bmic_hyw.mjs";
import { i as getSql } from "./db-Bjmpu96a.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { a as createBillingCheckout, c as retrieveCheckout, i as cancelAirwallexSubscription, l as retrieveSubscription, n as airwallexLast4, o as loadAirwallexConfig, s as publicAppOrigin, t as airwallexHasPrice } from "./airwallex.server-CjwNksJP.mjs";
import { n as getUserRole } from "./access-CV3glphY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/billing.server-Dn_P3iW1.js
var SUB_KEY = "WORKSPACE_SUBSCRIPTION_JSON";
var INVOICES_KEY = "BILLING_INVOICES_JSON";
var PRODUCT_KEY = "PRODUCT_ONBOARDING_JSON";
var EVENTS_KEY = "AIRWALLEX_WEBHOOK_EVENTS_JSON";
var DEFAULT_SUB_ID = "default";
var schemaReady = null;
async function ensureBillingSchema() {
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
		} catch {}
	})();
	return schemaReady;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function emptySubscription() {
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
		updatedAt: null
	};
}
function asStatus(value) {
	const raw = String(value ?? "").toLowerCase().replace(/-/g, "_");
	if (raw === "trialing" || raw === "trial") return "in_trial";
	if (raw === "cancelled") return "canceled";
	if (BILLING_STATUSES.includes(raw)) return raw;
	return "none";
}
function asPlanKey(value, priceId) {
	const raw = String(value ?? "").toLowerCase();
	if (SAAS_PLAN_KEYS.includes(raw)) return raw;
	return null;
}
async function readSubscription() {
	const raw = await readAppSetting(SUB_KEY);
	if (raw) try {
		const parsed = JSON.parse(raw);
		return {
			...emptySubscription(),
			...parsed,
			status: asStatus(parsed.status)
		};
	} catch {}
	try {
		const row = (await (await localSql()).query("select * from workspace_subscriptions where id = $1", [DEFAULT_SUB_ID]))[0];
		if (!row) return emptySubscription();
		return {
			status: asStatus(row.status),
			planKey: asPlanKey(row.plan_key),
			priceId: typeof row.price_id === "string" ? row.price_id : null,
			externalCustomerId: typeof row.external_customer_id === "string" ? row.external_customer_id : null,
			externalSubscriptionId: typeof row.external_subscription_id === "string" ? row.external_subscription_id : null,
			externalCheckoutId: typeof row.external_checkout_id === "string" ? row.external_checkout_id : null,
			currentPeriodEnd: typeof row.current_period_end === "string" ? row.current_period_end : null,
			cancelAtPeriodEnd: row.cancel_at_period_end === true,
			lastInvoiceStatus: typeof row.last_invoice_status === "string" ? row.last_invoice_status : null,
			lastInvoiceAt: typeof row.last_invoice_at === "string" ? row.last_invoice_at : null,
			mrr: typeof row.mrr === "number" ? row.mrr : row.mrr != null ? Number(row.mrr) : null,
			updatedAt: typeof row.updated_at === "string" ? row.updated_at : null
		};
	} catch {
		return emptySubscription();
	}
}
async function writeSubscription(patch) {
	await ensureBillingSchema();
	const next = {
		...await readSubscription(),
		...patch,
		updatedAt: nowIso()
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
		updated_at: next.updatedAt
	};
	if (admin) {
		const { error } = await admin.from("workspace_subscriptions").upsert(row, { onConflict: "id" });
		if (error && !isMissingTable(error)) {}
	}
	try {
		await (await localSql()).query(`insert into workspace_subscriptions (
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
        updated_at = excluded.updated_at`, [
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
			next.updatedAt
		]);
	} catch {}
	return next;
}
async function readInvoices() {
	const raw = await readAppSetting(INVOICES_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
	} catch {
		return [];
	}
}
async function upsertInvoice(invoice) {
	const next = [invoice, ...(await readInvoices()).filter((row) => row.externalId !== invoice.externalId)].slice(0, 50);
	await writeAppSetting(INVOICES_KEY, JSON.stringify(next));
}
async function readProductOnboarding() {
	const empty = emptyProductOnboarding();
	const raw = await readAppSetting(PRODUCT_KEY);
	if (!raw) return empty;
	try {
		const parsed = JSON.parse(raw);
		return {
			dismissed: parsed.dismissed === true,
			steps: {
				...empty.steps,
				...parsed.steps ?? {}
			}
		};
	} catch {
		return empty;
	}
}
async function writeProductOnboarding(state) {
	await writeAppSetting(PRODUCT_KEY, JSON.stringify(state));
	return state;
}
async function alreadyProcessed(eventId) {
	const raw = await readAppSetting(EVENTS_KEY);
	let ids = [];
	if (raw) try {
		ids = JSON.parse(raw);
	} catch {
		ids = [];
	}
	if (ids.includes(eventId)) return true;
	ids.unshift(eventId);
	await writeAppSetting(EVENTS_KEY, JSON.stringify(ids.slice(0, 200)));
	return false;
}
function planKeyFromPrice(priceId, priceIds) {
	if (!priceId) return null;
	for (const key of SAAS_PLAN_KEYS) if (priceIds[key] === priceId) return key;
	return null;
}
function mrrForPlan(planKey) {
	if (planKey === "starter") return 99;
	if (planKey === "pro") return 249;
	if (planKey === "agency") return 499;
	return null;
}
function pickString(...values) {
	for (const value of values) if (typeof value === "string" && value.trim()) return value;
	return null;
}
function nestedString(value, key) {
	if (!value || typeof value !== "object") return null;
	return pickString(value[key]);
}
function pickTime(...values) {
	for (const value of values) {
		if (typeof value === "number" && Number.isFinite(value)) {
			const ms = value > 0xe8d4a51000 ? value : value * 1e3;
			return new Date(ms).toISOString();
		}
		if (typeof value === "string" && value.trim()) {
			const parsed = Date.parse(value);
			if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
		}
	}
	return null;
}
async function applyAirwallexObject(object, eventName) {
	const config = await loadAirwallexConfig();
	const nested = object.data && typeof object.data === "object" ? object.data : object;
	const inner = nested.object && typeof nested.object === "object" ? nested.object : nested;
	const name = eventName.toLowerCase();
	const statusHint = pickString(inner.status, inner.subscription_status, inner.state);
	const priceId = pickString(inner.price_id, inner.line_items?.[0]?.price_id, inner.items?.[0]?.price_id);
	const subscriptionId = pickString(inner.subscription_id, inner.id?.toString().startsWith("sub") ? inner.id : null, typeof inner.id === "string" && /sub/i.test(inner.id) ? inner.id : null);
	const checkoutId = pickString(inner.checkout_id, inner.id?.toString().startsWith("bco") ? inner.id : null);
	const customerId = pickString(inner.billing_customer_id, inner.customer_id, inner.billingCustomerId);
	const periodEnd = pickTime(inner.current_period_end, inner.currentPeriodEnd, inner.next_billing_at, nestedString(inner.current_period, "end"));
	let status = asStatus(statusHint);
	if (name.includes("checkout") && name.includes("complet")) status = "active";
	if (name.includes("active") && !name.includes("inact")) status = "active";
	if (name.includes("trial")) status = "in_trial";
	if (name.includes("unpaid") || name.includes("past_due") || name.includes("pastdue")) status = name.includes("unpaid") ? "unpaid" : "past_due";
	if (name.includes("cancel")) status = "canceled";
	if (name.includes("payment_failed") || name.includes("invoice.payment_failed")) status = "past_due";
	if (name.includes("invoice") && name.includes("paid")) status = "active";
	const planKey = asPlanKey(inner.plan_key) ?? planKeyFromPrice(priceId, config?.priceIds ?? {
		starter: null,
		pro: null,
		agency: null
	});
	const patch = {};
	if (status !== "none" || name.includes("checkout") || name.includes("subscription")) {
		if (status !== "none") patch.status = status;
	}
	if (planKey) patch.planKey = planKey;
	if (priceId) patch.priceId = priceId;
	if (subscriptionId) patch.externalSubscriptionId = subscriptionId;
	if (checkoutId) patch.externalCheckoutId = checkoutId;
	if (customerId) patch.externalCustomerId = customerId;
	if (periodEnd) patch.currentPeriodEnd = periodEnd;
	if (typeof inner.cancel_at_period_end === "boolean") patch.cancelAtPeriodEnd = inner.cancel_at_period_end;
	if (planKey) patch.mrr = mrrForPlan(planKey);
	if (name.includes("invoice")) {
		const invoiceId = pickString(inner.id, inner.invoice_id) ?? crypto.randomUUID();
		const amountRaw = inner.amount ?? inner.total_amount ?? inner.amount_due ?? 0;
		const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw) || 0;
		const invoiceStatus = pickString(inner.status) ?? (name.includes("paid") ? "paid" : "open");
		await upsertInvoice({
			id: invoiceId,
			externalId: invoiceId,
			amount,
			currency: pickString(inner.currency) ?? "USD",
			status: invoiceStatus,
			hostedUrl: pickString(inner.hosted_url, inner.invoice_url, inner.url),
			periodStart: pickTime(inner.period_start, nestedString(inner.period, "start")),
			periodEnd: pickTime(inner.period_end, nestedString(inner.period, "end")),
			paidAt: name.includes("paid") ? nowIso() : pickTime(inner.paid_at),
			createdAt: pickTime(inner.created_at) ?? nowIso()
		});
		patch.lastInvoiceStatus = invoiceStatus;
		patch.lastInvoiceAt = nowIso();
	}
	if (Object.keys(patch).length > 0) {
		await writeSubscription(patch);
		if (patch.status === "past_due" || patch.status === "canceled" || patch.status === "unpaid") import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onSaasStatus({ status: patch.status })).catch(() => {});
	}
}
async function handleAirwallexWebhook(eventId, eventName, payload) {
	if (eventId && await alreadyProcessed(eventId)) return;
	await applyAirwallexObject(payload, eventName);
}
async function refreshFromAirwallex() {
	const config = await loadAirwallexConfig();
	const current = await readSubscription();
	if (!config) return current;
	if (current.externalCheckoutId) {
		const checkout = await retrieveCheckout(config, current.externalCheckoutId);
		if (checkout) {
			if (String(checkout.status ?? "").toUpperCase() === "COMPLETED") await applyAirwallexObject(checkout, "billing_checkout.completed");
			const subId = pickString(checkout.subscription_id);
			if (subId) {
				const remote = await retrieveSubscription(config, subId);
				if (remote) await applyAirwallexObject(remote, "subscription.updated");
			}
		}
	} else if (current.externalSubscriptionId) {
		const remote = await retrieveSubscription(config, current.externalSubscriptionId);
		if (remote) await applyAirwallexObject(remote, "subscription.updated");
	}
	return readSubscription();
}
async function countSeats() {
	try {
		const rows = await (await getSql()).query(`select count(*) as n from app_profiles where coalesce(status, 'ACTIVE') <> 'REVOKED'`);
		return Number(rows[0]?.n ?? 0);
	} catch {
		return 1;
	}
}
async function buildBillingSnapshot(userId, returnCheckout = null) {
	const [role, subscription, invoices, config] = await Promise.all([
		getUserRole(userId),
		readSubscription(),
		readInvoices(),
		loadAirwallexConfig()
	]);
	const workspaceRole = role === "admin" ? "owner" : "member";
	const hasCreds = Boolean(config);
	const hasPrice = Boolean(config && airwallexHasPrice(config));
	const enforced = hasCreds && hasPrice;
	const plans = SAAS_PLAN_KEYS.map((key) => ({
		...DEFAULT_SAAS_PLANS[key],
		priceId: config?.priceIds[key] ?? null
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
		airwallex: {
			configured: hasCreds,
			env: config?.env ?? "sandbox",
			hasWebhookSecret: Boolean(config?.webhookSecret),
			legalEntitySet: Boolean(config?.legalEntityId),
			paymentAccountSet: Boolean(config?.linkedPaymentAccountId),
			last4: await airwallexLast4()
		},
		returnCheckout
	};
}
async function startHostedCheckout(input) {
	const config = await loadAirwallexConfig();
	if (!config) throw new Error("AIRWALLEX_UNAVAILABLE");
	const priceId = config.priceIds[input.planKey];
	if (!priceId) throw new Error("AIRWALLEX_PRICE_MISSING");
	const origin = publicAppOrigin();
	const checkout = await createBillingCheckout(config, {
		priceId,
		email: input.email,
		name: input.name,
		requestId: crypto.randomUUID(),
		successUrl: `${origin}/billing?checkout=success`,
		backUrl: `${origin}/billing?checkout=back`
	});
	await writeSubscription({
		planKey: input.planKey,
		priceId,
		externalCheckoutId: checkout.id
	});
	import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onPayLinkCreated({
		actorId: input.userId,
		checkoutId: checkout.id,
		planKey: input.planKey
	})).catch(() => {});
	return { url: checkout.url };
}
async function requestCancelAtPeriodEnd() {
	const config = await loadAirwallexConfig();
	const current = await readSubscription();
	if (config && current.externalSubscriptionId) await cancelAirwallexSubscription(config, current.externalSubscriptionId);
	return writeSubscription({ cancelAtPeriodEnd: true });
}
//#endregion
export { requestCancelAtPeriodEnd as a, refreshFromAirwallex as i, handleAirwallexWebhook as n, startHostedCheckout as o, readProductOnboarding as r, writeProductOnboarding as s, buildBillingSnapshot as t };
