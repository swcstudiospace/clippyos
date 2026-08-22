import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import type { AuditRow } from "@/lib/autonomy";
import type { AutonomyActor } from "@/lib/server/autonomy-auth.server";
import { ensureAutonomySchema } from "@/lib/server/autonomy-auth.server";

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapAudit(row: Record<string, unknown>): AuditRow {
  return {
    id: String(row.id ?? ""),
    requestId: String(row.request_id ?? ""),
    source: (row.source as AuditRow["source"]) ?? "api",
    actorKeyId: row.actor_key_id ? String(row.actor_key_id) : null,
    actorLabel: row.actor_label ? String(row.actor_label) : null,
    action: String(row.action ?? ""),
    entityType: row.entity_type ? String(row.entity_type) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
    playbookId: row.playbook_id ? String(row.playbook_id) : null,
    runId: row.run_id ? String(row.run_id) : null,
    result: (row.result as AuditRow["result"]) ?? "ok",
    errorCode: row.error_code ? String(row.error_code) : null,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function writeAuditLog(input: {
  requestId: string;
  actor: Pick<AutonomyActor, "source" | "keyId" | "label">;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  playbookId?: string | null;
  runId?: string | null;
  result: "ok" | "error" | "denied";
  errorCode?: string | null;
}): Promise<void> {
  try {
    await ensureAutonomySchema();
  } catch {
    /* still try the insert */
  }
  const row = {
    id: newId(),
    request_id: input.requestId,
    source: input.actor.source,
    actor_key_id: input.actor.keyId,
    actor_label: input.actor.label.slice(0, 80),
    action: input.action.slice(0, 80),
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    playbook_id: input.playbookId ? input.playbookId.slice(0, 80) : null,
    run_id: input.runId ? input.runId.slice(0, 80) : null,
    result: input.result,
    error_code: input.errorCode ?? null,
    created_at: nowIso(),
  };
  try {
    const admin = await getAgencyAdmin();
    if (admin) {
      const { error } = await admin.from("agent_audit_log").insert(row);
      if (error) {
        const slim = { ...row };
        delete (slim as { playbook_id?: string | null }).playbook_id;
        delete (slim as { run_id?: string | null }).run_id;
        await admin.from("agent_audit_log").insert(slim);
      }
      if (!error || !isMissingTable(error)) return;
    }
    const sql = await localSql();
    try {
      await sql.query(
        `insert into agent_audit_log
          (id, request_id, source, actor_key_id, actor_label, action, entity_type, entity_id, playbook_id, run_id, result, error_code, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          row.id,
          row.request_id,
          row.source,
          row.actor_key_id,
          row.actor_label,
          row.action,
          row.entity_type,
          row.entity_id,
          row.playbook_id,
          row.run_id,
          row.result,
          row.error_code,
          row.created_at,
        ],
      );
    } catch {
      await sql.query(
        `insert into agent_audit_log
          (id, request_id, source, actor_key_id, actor_label, action, entity_type, entity_id, result, error_code, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          row.id,
          row.request_id,
          row.source,
          row.actor_key_id,
          row.actor_label,
          row.action,
          row.entity_type,
          row.entity_id,
          row.result,
          row.error_code,
          row.created_at,
        ],
      );
    }
  } catch {
    /* audit must never break the mutation */
  }
}

export async function listAuditLog(limit = 80): Promise<AuditRow[]> {
  try {
    await ensureAutonomySchema();
  } catch {
    return [];
  }
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("agent_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error) return (data ?? []).map((row) => mapAudit(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from agent_audit_log order by created_at desc limit $1",
      [limit],
    );
    return rows.map(mapAudit);
  } catch {
    return [];
  }
}

export async function readIdempotency(key: string): Promise<string | null> {
  try {
    await ensureAutonomySchema();
    const admin = await getAgencyAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("agent_idempotency")
        .select("body")
        .eq("id", key)
        .maybeSingle();
      if (!error && data) return String((data as { body?: string }).body ?? "");
    }
    const sql = await localSql();
    const rows = await sql.query<{ body: string }>(
      "select body from agent_idempotency where id = $1",
      [key],
    );
    return rows[0]?.body ?? null;
  } catch {
    return null;
  }
}

export async function writeIdempotency(key: string, body: string): Promise<void> {
  try {
    await ensureAutonomySchema();
    const admin = await getAgencyAdmin();
    if (admin) {
      await admin.from("agent_idempotency").upsert({
        id: key,
        body,
        created_at: nowIso(),
      });
      return;
    }
    const sql = await localSql();
    await sql.query(
      "insert into agent_idempotency (id, body, created_at) values ($1,$2,$3) on conflict (id) do nothing",
      [key, body, nowIso()],
    );
  } catch {
    /* ignore */
  }
}

export type AgentJob = {
  id: string;
  kind: string;
  clientId: string | null;
  status: "queued" | "running" | "completed" | "error";
  result: unknown;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapJob(row: Record<string, unknown>): AgentJob {
  let parsed: unknown = null;
  if (typeof row.result === "string" && row.result) {
    try {
      parsed = JSON.parse(row.result);
    } catch {
      parsed = row.result;
    }
  }
  return {
    id: String(row.id ?? ""),
    kind: String(row.kind ?? ""),
    clientId: row.client_id ? String(row.client_id) : null,
    status: (row.status as AgentJob["status"]) ?? "queued",
    result: parsed,
    errorCode: row.error_code ? String(row.error_code) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function insertAgentJob(input: {
  id: string;
  kind: string;
  clientId: string | null;
}): Promise<void> {
  await ensureAutonomySchema();
  const stamp = nowIso();
  const row = {
    id: input.id,
    kind: input.kind,
    client_id: input.clientId,
    status: "queued",
    result: null as string | null,
    error_code: null as string | null,
    created_at: stamp,
    updated_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("agent_jobs").insert(row);
    if (!error || !isMissingTable(error)) return;
  }
  const sql = await localSql();
  await sql.query(
    `insert into agent_jobs (id, kind, client_id, status, result, error_code, created_at, updated_at)
     values ($1,$2,$3,'queued',null,null,$4,$4)`,
    [row.id, row.kind, row.client_id, stamp],
  );
}

export async function updateAgentJob(
  id: string,
  patch: { status: AgentJob["status"]; result?: unknown; errorCode?: string | null },
): Promise<void> {
  const stamp = nowIso();
  const encoded = patch.result === undefined ? undefined : JSON.stringify(patch.result).slice(0, 8000);
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin
      .from("agent_jobs")
      .update({
        status: patch.status,
        result: encoded ?? null,
        error_code: patch.errorCode ?? null,
        updated_at: stamp,
      })
      .eq("id", id);
    if (!error || !isMissingTable(error)) return;
  }
  try {
    const sql = await localSql();
    await sql.query(
      "update agent_jobs set status=$2, result=$3, error_code=$4, updated_at=$5 where id=$1",
      [id, patch.status, encoded ?? null, patch.errorCode ?? null, stamp],
    );
  } catch {
    /* ignore */
  }
}

export async function readAgentJob(id: string): Promise<AgentJob | null> {
  await ensureAutonomySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("agent_jobs").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapJob(data as Record<string, unknown>);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from agent_jobs where id = $1", [id]);
    return rows[0] ? mapJob(rows[0]) : null;
  } catch {
    return null;
  }
}
