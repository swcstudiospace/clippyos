import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { mapWhopEvent, shouldIgnoreStatusFlip, verifyWhopSignature } from "./whop.server.ts";

const SECRET = "ws_" + Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");

// Independent implementation of the documented Standard Webhooks scheme:
// HMAC-SHA256 over "{id}.{timestamp}.{body}", key = base64(secret without ws_).
function sign(id: string, timestamp: string, body: string): string {
  const key = Buffer.from(SECRET.replace(/^ws_/, ""), "base64");
  return createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
}

test("webhook signatures verify against the standard-webhooks scheme", () => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_1" } });
  const header = `v1,${sign("msg_1", timestamp, body)}`;
  assert.equal(
    verifyWhopSignature({ secret: SECRET, id: "msg_1", timestamp, rawBody: body, signatureHeader: header }),
    true,
  );
});

test("tampered bodies and stale timestamps are rejected", () => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = '{"type":"payment.succeeded"}';
  const header = `v1,${sign("msg_2", timestamp, body)}`;
  assert.equal(
    verifyWhopSignature({
      secret: SECRET,
      id: "msg_2",
      timestamp,
      rawBody: '{"type":"payment.failed"}',
      signatureHeader: header,
    }),
    false,
  );
  const stale = String(Math.floor(Date.now() / 1000) - 601);
  assert.equal(
    verifyWhopSignature({
      secret: SECRET,
      id: "msg_3",
      timestamp: stale,
      rawBody: body,
      signatureHeader: `v1,${sign("msg_3", stale, body)}`,
    }),
    false,
  );
});

const PLAN_IDS = { starter: "plan_starter", pro: "plan_pro", agency: null };

test("membership activation maps to active with plan metadata", () => {
  const { patch, invoice, card } = mapWhopEvent(
    "membership.activated",
    {
      id: "mem_123",
      status: "active",
      plan: { id: "plan_pro" },
      metadata: { planKey: "pro" },
      user: { id: "user_1" },
      renewal_period_end: "2026-09-24T00:00:00Z",
      cancel_at_period_end: false,
    },
    PLAN_IDS,
  );
  assert.equal(patch.status, "active");
  assert.equal(patch.planKey, "pro");
  assert.equal(patch.mrr, 249);
  assert.equal(patch.externalSubscriptionId, "mem_123");
  assert.equal(patch.externalCustomerId, "user_1");
  assert.equal(patch.currentPeriodEnd, "2026-09-24T00:00:00.000Z");
  assert.equal(patch.cancelAtPeriodEnd, false);
  assert.equal(invoice, null);
  assert.equal(card, null);
});

test("trialing memberships map to in_trial", () => {
  const { patch } = mapWhopEvent(
    "membership.activated",
    { status: "trialing", plan: { id: "plan_starter" }, metadata: {} },
    PLAN_IDS,
  );
  assert.equal(patch.status, "in_trial");
});

test("payment success flips entitlement, records an invoice, and stores the card", () => {
  const { patch, invoice, card } = mapWhopEvent(
    "payment.succeeded",
    {
      id: "pay_9",
      status: "succeeded",
      amount_after_fees: 9.71,
      currency: "usd",
      card_brand: "visa",
      card_last4: "4242",
      member: { id: "mem_77" },
      metadata: { planKey: "starter" },
    },
    PLAN_IDS,
  );
  assert.equal(patch.status, "active");
  assert.equal(invoice?.externalId, "pay_9");
  assert.equal(invoice?.status, "paid");
  assert.equal(invoice?.currency, "USD");
  assert.deepEqual(card, { brand: "visa", last4: "4242" });
  assert.equal(patch.lastInvoiceStatus, "paid");
});

test("failures, deactivations, and pending cancellations drive the state machine", () => {
  assert.equal(
    mapWhopEvent("payment.failed", {}, PLAN_IDS).patch.status,
    "past_due",
  );
  assert.equal(mapWhopEvent("invoice.past_due", {}, PLAN_IDS).patch.status, "past_due");
  const off = mapWhopEvent("membership.deactivated", { status: "active" }, PLAN_IDS);
  assert.equal(off.patch.status, "canceled");
  const cancelFlag = mapWhopEvent(
    "membership.cancel_at_period_end_changed",
    { cancel_at_period_end: true, status: "active" },
    PLAN_IDS,
  );
  assert.equal(cancelFlag.patch.cancelAtPeriodEnd, true);
});

test("unknown events and unmapped plans produce no state change", () => {
  const ignored = mapWhopEvent("chat.message.created", { id: "x" }, PLAN_IDS);
  assert.deepEqual(ignored.patch, {});
  assert.equal(ignored.invoice, null);
  const unmapped = mapWhopEvent(
    "membership.activated",
    { status: "active", plan: { id: "plan_unknown" }, metadata: {} },
    PLAN_IDS,
  );
  assert.equal(unmapped.patch.planKey, undefined);
  assert.equal(unmapped.patch.status, "active");
});

test("late payment events cannot resurrect a canceled workspace", () => {
  assert.equal(shouldIgnoreStatusFlip("canceled", "payment.succeeded"), true);
  assert.equal(shouldIgnoreStatusFlip("canceled", "invoice.paid"), true);
  assert.equal(shouldIgnoreStatusFlip("past_due", "payment.succeeded"), false);
  assert.equal(shouldIgnoreStatusFlip("active", "membership.deactivated"), false);
});
