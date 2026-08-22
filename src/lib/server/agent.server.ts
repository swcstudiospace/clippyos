import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import {
  normalizePreset,
  normalizeRunStatus,
  type AgentIteration,
  type AgentPlanStep,
  type AgentPreset,
  type AgentRun,
  type AgentRunDetail,
  type AgentRunStatus,
} from "@/lib/agent";
import { sanitizeText } from "@/lib/sanitize";

function nowIso() {
  return new Date().toISOString();
}
function newId() {
  return crypto.randomUUID();
}

let schemaReady: Promise<void> | null = null;

export async function ensureAgentSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    await sql.query(`
      create table if not exists agent_runs (
        id               text primary key,
        goal             text not null,
        preset           text not null,
        client_id        text,
        skill_id         text,
        status           text not null,
        model            text not null default 'grok-4.6',
        provider         text,
        summary          text,
        error_code       text,
        iteration_count  integer not null default 0,
        started_at       timestamptz not null default now(),
        finished_at      timestamptz,
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now(),
        created_by       text
      )
    `);
    await sql.query(`create index if not exists agent_runs_started_idx on agent_runs (started_at desc)`);
    await sql.query(`
      create table if not exists agent_iterations (
        id                   text primary key,
        run_id               text not null,
        idx                  integer not null,
        kind                 text not null,
        tool_name            text,
        args_summary         text,
        result_summary       text,
        screenshot_ref       text,
        screenshot_data_url  text,
        status               text not null default 'ok',
        created_at           timestamptz not null default now()
      )
    `);
    await sql.query(`create index if not exists agent_iterations_run_idx on agent_iterations (run_id, idx)`);
    await sql.query(`alter table agent_runs add column if not exists plan_json text`);
    await sql.query(`alter table agent_runs add column if not exists outputs_json text`);
    await sql.query(`alter table agent_runs add column if not exists idempotency_key text`);
    await sql.query(`alter table agent_runs add column if not exists cancel_requested boolean not null default false`);
    await sql.query(`alter table agent_runs add column if not exists deadline_at timestamptz`);
    await sql.query(`alter table agent_iterations add column if not exists step_id text`);
    await sql.query(`alter table agent_iterations add column if not exists duration_ms integer`);
    await sql.query(`create index if not exists agent_runs_idempotency_idx on agent_runs (idempotency_key)`);
  })();
  return schemaReady;
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== "string") return (raw as T) ?? fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapRun(row: Record<string, unknown>): AgentRun {
  return {
    id: String(row.id ?? ""),
    goal: String(row.goal ?? ""),
    preset: normalizePreset(String(row.preset ?? "custom")),
    clientId: row.client_id ? String(row.client_id) : null,
    skillId: row.skill_id ? String(row.skill_id) : null,
    status: normalizeRunStatus(String(row.status ?? "queued")),
    model: String(row.model ?? "grok-4.6"),
    provider: row.provider ? String(row.provider) : null,
    summary: row.summary ? String(row.summary) : null,
    errorCode: row.error_code ? String(row.error_code) : null,
    iterationCount: Number(row.iteration_count ?? 0),
    plan: parseJson<AgentPlanStep[] | null>(row.plan_json, null),
    outputs: parseJson<Record<string, import("@/lib/skills").JsonValue> | null>(row.outputs_json, null),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    cancelRequested: row.cancel_requested === true || row.cancel_requested === "t",
    deadlineAt: row.deadline_at ? String(row.deadline_at) : null,
    startedAt: String(row.started_at ?? ""),
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
  };
}

function mapIteration(row: Record<string, unknown>): AgentIteration {
  return {
    id: String(row.id ?? ""),
    runId: String(row.run_id ?? ""),
    index: Number(row.idx ?? 0),
    kind: (row.kind as AgentIteration["kind"]) ?? "tool",
    stepId: row.step_id ? String(row.step_id) : null,
    toolName: row.tool_name ? String(row.tool_name) : null,
    argsSummary: row.args_summary ? String(row.args_summary) : null,
    resultSummary: row.result_summary ? String(row.result_summary) : null,
    screenshotRef: row.screenshot_ref ? String(row.screenshot_ref) : null,
    screenshotDataUrl: row.screenshot_data_url ? String(row.screenshot_data_url) : null,
    durationMs: row.duration_ms != null ? Number(row.duration_ms) : null,
    status: (row.status as AgentIteration["status"]) ?? "ok",
    createdAt: String(row.created_at ?? ""),
  };
}

export async function listAgentRuns(limit = 40): Promise<AgentRun[]> {
  await ensureAgentSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("agent_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (!error) return (data ?? []).map((row) => mapRun(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from agent_runs order by started_at desc limit $1",
    [limit],
  );
  return rows.map(mapRun);
}

export async function getAgentRun(id: string): Promise<AgentRun | null> {
  await ensureAgentSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("agent_runs").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapRun(data as Record<string, unknown>);
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from agent_runs where id = $1", [id]);
    return rows[0] ? mapRun(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listIterations(runId: string): Promise<AgentIteration[]> {
  await ensureAgentSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("agent_iterations")
      .select("*")
      .eq("run_id", runId)
      .order("idx", { ascending: true });
    if (!error) return (data ?? []).map((row) => mapIteration(row as Record<string, unknown>));
  }
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from agent_iterations where run_id = $1 order by idx asc",
    [runId],
  );
  return rows.map(mapIteration);
}

export async function getAgentRunDetail(id: string): Promise<AgentRunDetail | null> {
  const run = await getAgentRun(id);
  if (!run) return null;
  const iterations = await listIterations(id);
  let clientName: string | null = null;
  let skillName: string | null = null;
  if (run.clientId) {
    const { readClients } = await import("@/lib/server/clients");
    const clients = await readClients();
    clientName = clients.find((row) => row.id === run.clientId)?.name ?? null;
  }
  if (run.skillId) {
    const { getSkillById } = await import("@/lib/server/skills.server");
    skillName = (await getSkillById(run.skillId))?.name ?? null;
  }
  return { run, iterations, clientName, skillName };
}

export async function insertAgentRun(input: {
  goal: string;
  preset: AgentPreset;
  clientId: string | null;
  skillId: string | null;
  model: string;
  createdBy: string | null;
  idempotencyKey?: string | null;
  deadlineAt?: string | null;
}): Promise<AgentRun> {
  await ensureAgentSchema();
  const stamp = nowIso();
  const row = {
    id: newId(),
    goal: sanitizeText(input.goal).slice(0, 4000),
    preset: input.preset,
    client_id: input.clientId,
    skill_id: input.skillId,
    status: "queued",
    model: input.model,
    provider: null as string | null,
    summary: null as string | null,
    error_code: null as string | null,
    iteration_count: 0,
    plan_json: null as string | null,
    outputs_json: null as string | null,
    idempotency_key: input.idempotencyKey ?? null,
    cancel_requested: false,
    deadline_at: input.deadlineAt ?? null,
    started_at: stamp,
    finished_at: null as string | null,
    created_at: stamp,
    updated_at: stamp,
    created_by: input.createdBy,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("agent_runs").insert(row);
    if (!error) return mapRun(row);
  }
  const sql = await localSql();
  await sql.query(
    `insert into agent_runs
      (id, goal, preset, client_id, skill_id, status, model, provider, summary, error_code,
       iteration_count, plan_json, outputs_json, idempotency_key, cancel_requested, deadline_at,
       started_at, finished_at, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      row.id, row.goal, row.preset, row.client_id, row.skill_id, row.status, row.model, row.provider,
      row.summary, row.error_code, row.iteration_count, row.plan_json, row.outputs_json,
      row.idempotency_key, row.cancel_requested, row.deadline_at, row.started_at, row.finished_at,
      row.created_at, row.updated_at, row.created_by,
    ],
  );
  return mapRun(row);
}

export async function findRunByIdempotency(key: string, createdBy: string): Promise<AgentRun | null> {
  if (!key.trim()) return null;
  await ensureAgentSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("agent_runs")
      .select("*")
      .eq("idempotency_key", key)
      .eq("created_by", createdBy)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return mapRun(data as Record<string, unknown>);
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from agent_runs where idempotency_key = $1 and created_by = $2 order by started_at desc limit 1",
      [key, createdBy],
    );
    return rows[0] ? mapRun(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function countActiveAgentRuns(): Promise<number> {
  const runs = await listAgentRuns(30);
  return runs.filter((row) =>
    ["queued", "planning", "stepping", "backoff"].includes(row.status),
  ).length;
}

export async function patchAgentRun(
  id: string,
  patch: Partial<{
    status: AgentRunStatus;
    provider: string | null;
    summary: string | null;
    errorCode: string | null;
    iterationCount: number;
    finishedAt: string | null;
    plan: AgentPlanStep[] | null;
    outputs: Record<string, import("@/lib/skills").JsonValue> | null;
    cancelRequested: boolean;
  }>,
): Promise<void> {
  const stamp = nowIso();
  const db: Record<string, unknown> = { updated_at: stamp };
  if (patch.status) db.status = patch.status;
  if (patch.provider !== undefined) db.provider = patch.provider;
  if (patch.summary !== undefined) db.summary = patch.summary;
  if (patch.errorCode !== undefined) db.error_code = patch.errorCode;
  if (patch.iterationCount !== undefined) db.iteration_count = patch.iterationCount;
  if (patch.finishedAt !== undefined) db.finished_at = patch.finishedAt;
  if (patch.plan !== undefined) db.plan_json = patch.plan ? JSON.stringify(patch.plan) : null;
  if (patch.outputs !== undefined) db.outputs_json = patch.outputs ? JSON.stringify(patch.outputs) : null;
  if (patch.cancelRequested !== undefined) db.cancel_requested = patch.cancelRequested;
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("agent_runs").update(db).eq("id", id);
    if (!error) return;
  }
  const sql = await localSql();
  const keys = Object.keys(db);
  const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
  await sql.query(`update agent_runs set ${sets} where id = $1`, [id, ...keys.map((key) => db[key])]);
}

export async function insertIteration(input: {
  runId: string;
  index: number;
  kind: AgentIteration["kind"];
  stepId?: string | null;
  toolName?: string | null;
  argsSummary?: string | null;
  resultSummary?: string | null;
  screenshotRef?: string | null;
  screenshotDataUrl?: string | null;
  durationMs?: number | null;
  status?: AgentIteration["status"];
}): Promise<AgentIteration> {
  await ensureAgentSchema();
  const row = {
    id: newId(),
    run_id: input.runId,
    idx: input.index,
    kind: input.kind,
    step_id: input.stepId ?? null,
    tool_name: input.toolName ?? null,
    args_summary: input.argsSummary ? sanitizeText(input.argsSummary).slice(0, 800) : null,
    result_summary: input.resultSummary ? sanitizeText(input.resultSummary).slice(0, 2000) : null,
    screenshot_ref: input.screenshotRef ?? null,
    screenshot_data_url: input.screenshotDataUrl
      ? input.screenshotDataUrl.slice(0, 180_000)
      : null,
    duration_ms: input.durationMs ?? null,
    status: input.status ?? "ok",
    created_at: nowIso(),
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("agent_iterations").insert(row);
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into agent_iterations
        (id, run_id, idx, kind, step_id, tool_name, args_summary, result_summary, screenshot_ref, screenshot_data_url, duration_ms, status, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        row.id, row.run_id, row.idx, row.kind, row.step_id, row.tool_name, row.args_summary, row.result_summary,
        row.screenshot_ref, row.screenshot_data_url, row.duration_ms, row.status, row.created_at,
      ],
    );
  } catch {
    /* supabase path may already have inserted */
  }
  return mapIteration(row);
}
