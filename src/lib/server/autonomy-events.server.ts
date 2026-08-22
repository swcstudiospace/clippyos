import { createHmac } from "node:crypto";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import {
  WEBHOOK_EVENT_TYPES,
  type WebhookEventType,
} from "@/lib/autonomy";

export type OutboundConfig = {
  destinationUrl: string | null;
  events: WebhookEventType[];
};

export type DeliveryRecord = {
  at: string;
  status: string;
  eventType: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export async function readOutboundConfig(): Promise<OutboundConfig> {
  const raw = await readAppSetting("WEBHOOK_OUTBOUND_JSON");
  if (!raw) return { destinationUrl: null, events: [...WEBHOOK_EVENT_TYPES] };
  try {
    const parsed = JSON.parse(raw) as Partial<OutboundConfig>;
    const url =
      typeof parsed.destinationUrl === "string" && parsed.destinationUrl.startsWith("https://")
        ? parsed.destinationUrl
        : null;
    const events = Array.isArray(parsed.events)
      ? parsed.events.filter((item): item is WebhookEventType =>
          (WEBHOOK_EVENT_TYPES as readonly string[]).includes(String(item)),
        )
      : [...WEBHOOK_EVENT_TYPES];
    return { destinationUrl: url, events };
  } catch {
    return { destinationUrl: null, events: [...WEBHOOK_EVENT_TYPES] };
  }
}

export async function writeOutboundConfig(config: OutboundConfig): Promise<void> {
  await writeAppSetting("WEBHOOK_OUTBOUND_JSON", JSON.stringify(config));
}

function signBody(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyInboundSignature(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  nowMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) return false;
  const tsMs = ts > 1e12 ? ts : ts * 1000;
  if (Math.abs(now - tsMs) > 5 * 60 * 1000) return false;
  const expected = signBody(input.secret, input.timestamp, input.rawBody);
  const given = input.signature.replace(/^sha256=/i, "").trim().toLowerCase();
  if (given.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  }
  return mismatch === 0;
}

async function persistDelivery(row: {
  id: string;
  event_id: string;
  event_type: string;
  payload: string;
  destination: string;
  status: string;
  attempts: number;
  last_error: string | null;
  last_attempt_at: string;
  created_at: string;
}): Promise<void> {
  try {
    const admin = await getAgencyAdmin();
    if (admin) {
      await admin.from("webhook_deliveries").insert(row);
    } else {
      const sql = await localSql();
      await sql.query(
        `insert into webhook_deliveries
          (id, event_id, event_type, payload, destination, status, attempts, last_error, last_attempt_at, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          row.id,
          row.event_id,
          row.event_type,
          row.payload,
          row.destination,
          row.status,
          row.attempts,
          row.last_error,
          row.last_attempt_at,
          row.created_at,
        ],
      );
    }
  } catch {
    /* ignore */
  }
}

async function deliverEnvelope(input: {
  type: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
}): Promise<{ status: "delivered" | "failed" | "skipped"; lastError: string | null; at: string }> {
  const config = await readOutboundConfig();
  const createdAt = nowIso();
  if (!config.destinationUrl) {
    return { status: "skipped", lastError: "NO_DESTINATION", at: createdAt };
  }
  const secret = (await readAppSetting("WEBHOOK_SIGNING_SECRET"))?.trim();
  if (!secret) {
    return { status: "skipped", lastError: "NO_SECRET", at: createdAt };
  }

  const eventId = newId();
  const envelope = {
    id: eventId,
    type: input.type,
    createdAt,
    resource: { type: input.entityType, id: input.entityId },
    data: input.data,
  };
  const body = JSON.stringify(envelope);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${signBody(secret, timestamp, body)}`;

  let status: "delivered" | "failed" = "failed";
  let lastError: string | null = null;
  let attempts = 0;
  for (let tryN = 0; tryN < 3; tryN += 1) {
    attempts += 1;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(config.destinationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agency-Signature": signature,
          "X-Agency-Timestamp": timestamp,
          "X-Agency-Event": input.type,
          "X-Agency-Event-Id": eventId,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        status = "delivered";
        lastError = null;
        break;
      }
      lastError = `HTTP ${res.status}`;
    } catch {
      lastError = "DELIVERY_FAILED";
    }
    if (tryN < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (tryN + 1)));
  }

  await persistDelivery({
    id: newId(),
    event_id: eventId,
    event_type: input.type,
    payload: body.slice(0, 8000),
    destination: config.destinationUrl,
    status,
    attempts,
    last_error: lastError,
    last_attempt_at: nowIso(),
    created_at: createdAt,
  });

  await writeAppSetting(
    "WEBHOOK_LAST_DELIVERY",
    JSON.stringify({
      at: createdAt,
      status,
      eventType: input.type,
    }),
  );

  return { status, lastError, at: createdAt };
}

export async function emitAutonomyEvent(input: {
  type: WebhookEventType;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  force?: boolean;
}): Promise<void> {
  const config = await readOutboundConfig();
  if (!input.force) {
    if (!config.destinationUrl) return;
    if (!config.events.includes(input.type)) return;
  }
  await deliverEnvelope(input);
}

export async function emitTestPing(): Promise<{
  ok: boolean;
  status: string;
  at: string;
  error: string | null;
}> {
  const result = await deliverEnvelope({
    type: "automation.ping",
    entityType: "automation",
    entityId: "ping",
    data: { ping: true, source: "clippy-admin" },
  });
  return {
    ok: result.status === "delivered",
    status: result.status,
    at: result.at,
    error: result.lastError,
  };
}

export async function readLastDelivery(): Promise<{
  at: string | null;
  status: string | null;
  eventType: string | null;
}> {
  const raw = await readAppSetting("WEBHOOK_LAST_DELIVERY");
  if (!raw) return { at: null, status: null, eventType: null };
  try {
    const parsed = JSON.parse(raw) as {
      at?: string;
      status?: string;
      eventType?: string;
    };
    return {
      at: parsed.at ?? null,
      status: parsed.status ?? null,
      eventType: parsed.eventType ?? null,
    };
  } catch {
    return { at: null, status: null, eventType: null };
  }
}

export async function readLastDeliveryByEvent(): Promise<
  Partial<Record<WebhookEventType, { at: string; status: string }>>
> {
  const map: Partial<Record<WebhookEventType, { at: string; status: string }>> = {};
  try {
    const admin = await getAgencyAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("webhook_deliveries")
        .select("event_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      if (!error) {
        for (const row of data ?? []) {
          const type = String((row as { event_type?: string }).event_type ?? "");
          if (!(WEBHOOK_EVENT_TYPES as readonly string[]).includes(type)) continue;
          const key = type as WebhookEventType;
          if (map[key]) continue;
          map[key] = {
            at: String((row as { created_at?: string }).created_at ?? ""),
            status: String((row as { status?: string }).status ?? ""),
          };
        }
        return map;
      }
      if (!isMissingTable(error)) return map;
    }
    const sql = await localSql();
    const rows = await sql.query<{ event_type: string; status: string; created_at: string }>(
      `select event_type, status, created_at from webhook_deliveries order by created_at desc limit 80`,
    );
    for (const row of rows) {
      if (!(WEBHOOK_EVENT_TYPES as readonly string[]).includes(row.event_type)) continue;
      const key = row.event_type as WebhookEventType;
      if (map[key]) continue;
      map[key] = { at: row.created_at, status: row.status };
    }
  } catch {
    /* empty */
  }
  return map;
}

export { signBody };
