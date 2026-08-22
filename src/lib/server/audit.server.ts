import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { ensureSafetySchema } from "@/lib/server/safety-schema.server";
import {
  AUDIT_ACTOR_TYPES,
  type AuditActorType,
  type AuditEvent,
  type JsonRecord,
} from "@/lib/safety";

const SECRET_KEYS = /token|secret|password|authorization|cookie|apikey|api_key|bearer|webhook.?secret|card|cvv|refresh/i;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function parseJson(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  if (typeof value !== "string" || !value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

export function redactMetadata(input: Record<string, unknown> | null | undefined): JsonRecord {
  if (!input) return {};
  const out: JsonRecord = {};
  for (const [key, value] of Object.entries(input)) {
    if (SECRET_KEYS.test(key)) continue;
    if (typeof value === "string" && /bearer\s+\S+/i.test(value)) {
      out[key] = "[redacted]";
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        typeof item === "string" || typeof item === "number" || typeof item === "boolean"
          ? item
          : item == null
            ? null
            : String(item),
      );
      continue;
    }
    if (value && typeof value === "object") {
      const nested: { [key: string]: string | number | boolean | null } = {};
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
        if (SECRET_KEYS.test(childKey)) continue;
        if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") {
          nested[childKey] = child;
        } else if (child == null) {
          nested[childKey] = null;
        }
      }
      out[key] = nested;
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (value == null) {
      out[key] = null;
    }
  }
  return out;
}

function mapAudit(row: Record<string, unknown>): AuditEvent {
  const actorType = AUDIT_ACTOR_TYPES.includes(row.actor_type as AuditActorType)
    ? (row.actor_type as AuditActorType)
    : "SYSTEM";
  return {
    id: String(row.id ?? ""),
    workspaceId: String(row.workspace_id ?? "default"),
    at: String(row.at ?? ""),
    actorUserId: row.actor_user_id == null ? null : String(row.actor_user_id),
    actorType,
    action: String(row.action ?? ""),
    entityType: row.entity_type == null ? null : String(row.entity_type),
    entityId: row.entity_id == null ? null : String(row.entity_id),
    clientId: row.client_id == null ? null : String(row.client_id),
    summary: String(row.summary ?? ""),
    metadata: parseJson(row.metadata),
    requestId: row.request_id == null ? null : String(row.request_id),
    jobId: row.job_id == null ? null : String(row.job_id),
  };
}

export async function writeAuditEvent(input: {
  actorUserId?: string | null;
  actorType: AuditActorType;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  clientId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
  jobId?: string | null;
}): Promise<void> {
  try {
    await ensureSafetySchema();
  } catch {
    /* still try */
  }
  const row = {
    id: newId(),
    workspace_id: "default",
    at: nowIso(),
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType,
    action: input.action.slice(0, 120),
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    client_id: input.clientId ?? null,
    summary: input.summary.slice(0, 400),
    metadata: JSON.stringify(redactMetadata(input.metadata)),
    request_id: input.requestId ?? null,
    job_id: input.jobId ?? null,
  };
  try {
    const admin = await getAgencyAdmin();
    if (admin) {
      const { error } = await admin.from("audit_events").insert(row);
      if (!error) return;
      if (!isMissingTable(error)) return;
    }
  } catch {
    /* local */
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into audit_events
        (id, workspace_id, at, actor_user_id, actor_type, action, entity_type, entity_id, client_id, summary, metadata, request_id, job_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        row.id,
        row.workspace_id,
        row.at,
        row.actor_user_id,
        row.actor_type,
        row.action,
        row.entity_type,
        row.entity_id,
        row.client_id,
        row.summary,
        row.metadata,
        row.request_id,
        row.job_id,
      ],
    );
  } catch {
    /* never block the caller */
  }
}

export async function listAuditEvents(filter: {
  action?: string;
  actorUserId?: string;
  clientId?: string;
  since?: string;
  until?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  try {
    await ensureSafetySchema();
  } catch {
    /* still try */
  }
  const limit = Math.min(Math.max(filter.limit ?? 80, 1), 500);
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("audit_events").select("*").order("at", { ascending: false }).limit(limit);
    if (filter.action) q = q.eq("action", filter.action);
    if (filter.actorUserId) q = q.eq("actor_user_id", filter.actorUserId);
    if (filter.clientId) q = q.eq("client_id", filter.clientId);
    if (filter.since) q = q.gte("at", filter.since);
    if (filter.until) q = q.lte("at", filter.until);
    const { data, error } = await q;
    if (!error) return (data ?? []).map((row) => mapAudit(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const clauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filter.action) {
      clauses.push(`action = $${i++}`);
      params.push(filter.action);
    }
    if (filter.actorUserId) {
      clauses.push(`actor_user_id = $${i++}`);
      params.push(filter.actorUserId);
    }
    if (filter.clientId) {
      clauses.push(`client_id = $${i++}`);
      params.push(filter.clientId);
    }
    if (filter.since) {
      clauses.push(`at >= $${i++}`);
      params.push(filter.since);
    }
    if (filter.until) {
      clauses.push(`at <= $${i++}`);
      params.push(filter.until);
    }
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    params.push(limit);
    const rows = await sql.query<Record<string, unknown>>(
      `select * from audit_events ${where} order by at desc limit $${i}`,
      params,
    );
    return rows.map(mapAudit);
  } catch {
    return [];
  }
}

export function auditEventsToCsv(rows: AuditEvent[]): string {
  const header = [
    "at",
    "actorType",
    "actorUserId",
    "action",
    "entityType",
    "entityId",
    "clientId",
    "summary",
    "jobId",
    "requestId",
    "metadata",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.at,
        row.actorType,
        row.actorUserId ?? "",
        row.action,
        row.entityType ?? "",
        row.entityId ?? "",
        row.clientId ?? "",
        row.summary,
        row.jobId ?? "",
        row.requestId ?? "",
        JSON.stringify(row.metadata),
      ]
        .map(escape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
