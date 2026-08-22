import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { f as normalizePreset, p as normalizeRunStatus } from "./agent-BK3m7JzY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent.server-DlFy-Bd5.js
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
var schemaReady = null;
async function ensureAgentSchema() {
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
function parseJson(raw, fallback) {
	if (raw == null) return fallback;
	if (typeof raw !== "string") return raw ?? fallback;
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function mapRun(row) {
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
		plan: parseJson(row.plan_json, null),
		outputs: parseJson(row.outputs_json, null),
		idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
		cancelRequested: row.cancel_requested === true || row.cancel_requested === "t",
		deadlineAt: row.deadline_at ? String(row.deadline_at) : null,
		startedAt: String(row.started_at ?? ""),
		finishedAt: row.finished_at ? String(row.finished_at) : null,
		createdBy: row.created_by ? String(row.created_by) : null
	};
}
function mapIteration(row) {
	return {
		id: String(row.id ?? ""),
		runId: String(row.run_id ?? ""),
		index: Number(row.idx ?? 0),
		kind: row.kind ?? "tool",
		stepId: row.step_id ? String(row.step_id) : null,
		toolName: row.tool_name ? String(row.tool_name) : null,
		argsSummary: row.args_summary ? String(row.args_summary) : null,
		resultSummary: row.result_summary ? String(row.result_summary) : null,
		screenshotRef: row.screenshot_ref ? String(row.screenshot_ref) : null,
		screenshotDataUrl: row.screenshot_data_url ? String(row.screenshot_data_url) : null,
		durationMs: row.duration_ms != null ? Number(row.duration_ms) : null,
		status: row.status ?? "ok",
		createdAt: String(row.created_at ?? "")
	};
}
async function listAgentRuns(limit = 40) {
	await ensureAgentSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("agent_runs").select("*").order("started_at", { ascending: false }).limit(limit);
		if (!error) return (data ?? []).map((row) => mapRun(row));
		if (!isMissingTable(error)) return [];
	}
	return (await (await localSql()).query("select * from agent_runs order by started_at desc limit $1", [limit])).map(mapRun);
}
async function getAgentRun(id) {
	await ensureAgentSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("agent_runs").select("*").eq("id", id).maybeSingle();
		if (!error && data) return mapRun(data);
	}
	try {
		const rows = await (await localSql()).query("select * from agent_runs where id = $1", [id]);
		return rows[0] ? mapRun(rows[0]) : null;
	} catch {
		return null;
	}
}
async function listIterations(runId) {
	await ensureAgentSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("agent_iterations").select("*").eq("run_id", runId).order("idx", { ascending: true });
		if (!error) return (data ?? []).map((row) => mapIteration(row));
	}
	return (await (await localSql()).query("select * from agent_iterations where run_id = $1 order by idx asc", [runId])).map(mapIteration);
}
async function getAgentRunDetail(id) {
	const run = await getAgentRun(id);
	if (!run) return null;
	const iterations = await listIterations(id);
	let clientName = null;
	let skillName = null;
	if (run.clientId) {
		const { readClients } = await import("./clients-CmcyBPZd.mjs").then((n) => n.n).then((n) => n.n);
		clientName = (await readClients()).find((row) => row.id === run.clientId)?.name ?? null;
	}
	if (run.skillId) {
		const { getSkillById } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
		skillName = (await getSkillById(run.skillId))?.name ?? null;
	}
	return {
		run,
		iterations,
		clientName,
		skillName
	};
}
async function insertAgentRun(input) {
	await ensureAgentSchema();
	const stamp = nowIso();
	const row = {
		id: newId(),
		goal: sanitizeText(input.goal).slice(0, 4e3),
		preset: input.preset,
		client_id: input.clientId,
		skill_id: input.skillId,
		status: "queued",
		model: input.model,
		provider: null,
		summary: null,
		error_code: null,
		iteration_count: 0,
		plan_json: null,
		outputs_json: null,
		idempotency_key: input.idempotencyKey ?? null,
		cancel_requested: false,
		deadline_at: input.deadlineAt ?? null,
		started_at: stamp,
		finished_at: null,
		created_at: stamp,
		updated_at: stamp,
		created_by: input.createdBy
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("agent_runs").insert(row);
		if (!error) return mapRun(row);
	}
	await (await localSql()).query(`insert into agent_runs
      (id, goal, preset, client_id, skill_id, status, model, provider, summary, error_code,
       iteration_count, plan_json, outputs_json, idempotency_key, cancel_requested, deadline_at,
       started_at, finished_at, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`, [
		row.id,
		row.goal,
		row.preset,
		row.client_id,
		row.skill_id,
		row.status,
		row.model,
		row.provider,
		row.summary,
		row.error_code,
		row.iteration_count,
		row.plan_json,
		row.outputs_json,
		row.idempotency_key,
		row.cancel_requested,
		row.deadline_at,
		row.started_at,
		row.finished_at,
		row.created_at,
		row.updated_at,
		row.created_by
	]);
	return mapRun(row);
}
async function findRunByIdempotency(key, createdBy) {
	if (!key.trim()) return null;
	await ensureAgentSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("agent_runs").select("*").eq("idempotency_key", key).eq("created_by", createdBy).order("started_at", { ascending: false }).limit(1).maybeSingle();
		if (!error && data) return mapRun(data);
	}
	try {
		const rows = await (await localSql()).query("select * from agent_runs where idempotency_key = $1 and created_by = $2 order by started_at desc limit 1", [key, createdBy]);
		return rows[0] ? mapRun(rows[0]) : null;
	} catch {
		return null;
	}
}
async function countActiveAgentRuns() {
	return (await listAgentRuns(30)).filter((row) => [
		"queued",
		"planning",
		"stepping",
		"backoff"
	].includes(row.status)).length;
}
async function patchAgentRun(id, patch) {
	const db = { updated_at: nowIso() };
	if (patch.status) db.status = patch.status;
	if (patch.provider !== void 0) db.provider = patch.provider;
	if (patch.summary !== void 0) db.summary = patch.summary;
	if (patch.errorCode !== void 0) db.error_code = patch.errorCode;
	if (patch.iterationCount !== void 0) db.iteration_count = patch.iterationCount;
	if (patch.finishedAt !== void 0) db.finished_at = patch.finishedAt;
	if (patch.plan !== void 0) db.plan_json = patch.plan ? JSON.stringify(patch.plan) : null;
	if (patch.outputs !== void 0) db.outputs_json = patch.outputs ? JSON.stringify(patch.outputs) : null;
	if (patch.cancelRequested !== void 0) db.cancel_requested = patch.cancelRequested;
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
async function insertIteration(input) {
	await ensureAgentSchema();
	const row = {
		id: newId(),
		run_id: input.runId,
		idx: input.index,
		kind: input.kind,
		step_id: input.stepId ?? null,
		tool_name: input.toolName ?? null,
		args_summary: input.argsSummary ? sanitizeText(input.argsSummary).slice(0, 800) : null,
		result_summary: input.resultSummary ? sanitizeText(input.resultSummary).slice(0, 2e3) : null,
		screenshot_ref: input.screenshotRef ?? null,
		screenshot_data_url: input.screenshotDataUrl ? input.screenshotDataUrl.slice(0, 18e4) : null,
		duration_ms: input.durationMs ?? null,
		status: input.status ?? "ok",
		created_at: nowIso()
	};
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("agent_iterations").insert(row);
	try {
		await (await localSql()).query(`insert into agent_iterations
        (id, run_id, idx, kind, step_id, tool_name, args_summary, result_summary, screenshot_ref, screenshot_data_url, duration_ms, status, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
			row.id,
			row.run_id,
			row.idx,
			row.kind,
			row.step_id,
			row.tool_name,
			row.args_summary,
			row.result_summary,
			row.screenshot_ref,
			row.screenshot_data_url,
			row.duration_ms,
			row.status,
			row.created_at
		]);
	} catch {}
	return mapIteration(row);
}
//#endregion
export { countActiveAgentRuns, findRunByIdempotency, getAgentRun, getAgentRunDetail, insertAgentRun, insertIteration, listAgentRuns, patchAgentRun };
