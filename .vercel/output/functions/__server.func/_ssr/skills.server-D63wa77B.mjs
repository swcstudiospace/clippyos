import { r as __exportAll } from "../_runtime.mjs";
import { $t as unknown, Bt as _enum, Jt as object, Ut as boolean, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { n as bumpToolsGeneration } from "./addons.server-DwUuR_Y2.mjs";
import { a as parseSkillFrontmatter, c as skillPackageContainsSecrets, i as clipAgentSkillPermissions, l as stripSecretsFromSkillText, o as skillListItem, s as skillMcpGet, t as BUILTIN_SKILLS } from "./skills-BbKBTrYf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills.server-D63wa77B.js
var skills_server_D63wa77B_exports = /* @__PURE__ */ __exportAll({
	n: () => invokeSkillInternal,
	r: () => skills_server_exports,
	t: () => createSkillInternalFromDistill
});
var skills_server_exports = /* @__PURE__ */ __exportAll$1({
	createSkillInternal: () => createSkillInternal,
	createSkillInternalFromDistill: () => createSkillInternalFromDistill,
	getSkillById: () => getSkillById,
	getSkillRun: () => getSkillRun,
	invokeSkillInternal: () => invokeSkillInternal,
	listPublicSkills: () => listPublicSkills,
	listSkillRunsForSkill: () => listSkillRunsForSkill,
	listSkillVersions: () => listSkillVersions,
	patchSkillInternal: () => patchSkillInternal,
	publicSkill: () => publicSkill,
	publicSkillMcpGet: () => publicSkillMcpGet,
	publicSkillSummary: () => publicSkillSummary,
	readSkills: () => readSkills,
	rollbackSkill: () => rollbackSkill,
	seedBuiltinSkills: () => seedBuiltinSkills,
	skillManageCreate: () => skillManageCreate,
	skillManageEdit: () => skillManageEdit,
	skillManagePatch: () => skillManagePatch,
	skillManageSetProvenanceReview: () => skillManageSetProvenanceReview,
	skillManageWriteFile: () => skillManageWriteFile
});
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
var schemaReady = null;
async function ensureSkillsSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		const sql = await localSql();
		await sql.query(`
      create table if not exists skills (
        id              text primary key,
        slug            text not null unique,
        name            text not null,
        description     text not null,
        version         text not null,
        tags            text not null default '[]',
        category        text,
        provenance      text not null,
        status          text not null,
        permissions     text not null default '[]',
        runtime_json    text not null default '{}',
        inputs_schema   text,
        outputs_schema  text,
        skill_md        text not null,
        scripts_json    text not null default '{}',
        enabled         boolean not null default true,
        parent_id       text,
        created_at      timestamptz not null default now(),
        updated_at      timestamptz not null default now(),
        created_by      text
      )
    `);
		await sql.query(`
      create table if not exists skill_runs (
        id           text primary key,
        skill_id     text not null,
        version      text not null,
        status       text not null,
        actor        text,
        args_json    text,
        stdout       text,
        stderr       text,
        exit_code    integer,
        duration_ms  integer,
        error_code   text,
        created_at   timestamptz not null default now(),
        updated_at   timestamptz not null default now()
      )
    `);
		await sql.query(`create index if not exists skills_status_idx on skills (status)`);
		await sql.query(`create index if not exists skill_runs_skill_idx on skill_runs (skill_id, created_at desc)`);
		await sql.query(`alter table skills add column if not exists refs_json text not null default '{}'`);
		await sql.query(`alter table skills add column if not exists templates_json text not null default '{}'`);
		await sql.query(`alter table skill_runs add column if not exists artifacts_json text`);
		await sql.query(`
      create table if not exists skill_versions (
        id           text primary key,
        skill_id     text not null,
        version      text not null,
        skill_md     text not null,
        scripts_json text not null default '{}',
        refs_json    text not null default '{}',
        templates_json text not null default '{}',
        created_at   timestamptz not null default now(),
        created_by   text
      )
    `);
		await sql.query(`create index if not exists skill_versions_skill_idx on skill_versions (skill_id, created_at desc)`);
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
function mapSkill(row) {
	return {
		id: String(row.id ?? ""),
		slug: String(row.slug ?? ""),
		name: String(row.name ?? ""),
		description: String(row.description ?? ""),
		version: String(row.version ?? "1.0.0"),
		tags: parseJson(row.tags, []),
		category: row.category ? String(row.category) : null,
		provenance: row.provenance ?? "human",
		status: row.status ?? "active",
		permissions: parseJson(row.permissions, []),
		runtime: parseJson(row.runtime_json, {}),
		inputsSchema: parseJson(row.inputs_schema, null),
		outputsSchema: parseJson(row.outputs_schema, null),
		skillMd: String(row.skill_md ?? ""),
		scripts: parseJson(row.scripts_json, {}),
		references: parseJson(row.refs_json, {}),
		templates: parseJson(row.templates_json, {}),
		enabled: row.enabled !== false && row.enabled !== 0,
		parentId: row.parent_id ? String(row.parent_id) : null,
		createdAt: String(row.created_at ?? ""),
		updatedAt: String(row.updated_at ?? ""),
		createdBy: row.created_by ? String(row.created_by) : null
	};
}
function mapRun(row) {
	return {
		id: String(row.id ?? ""),
		skillId: String(row.skill_id ?? ""),
		version: String(row.version ?? ""),
		status: row.status ?? "queued",
		stdout: row.stdout ? String(row.stdout) : null,
		stderr: row.stderr ? String(row.stderr) : null,
		exitCode: row.exit_code == null ? null : Number(row.exit_code),
		durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
		errorCode: row.error_code ? String(row.error_code) : null,
		artifacts: parseJson(row.artifacts_json, []),
		createdAt: String(row.created_at ?? ""),
		updatedAt: String(row.updated_at ?? "")
	};
}
function publicSkill(skill) {
	return {
		...skill,
		skillMd: stripSecretsFromSkillText(skill.skillMd),
		scripts: Object.fromEntries(Object.entries(skill.scripts).map(([name, body]) => [name, stripSecretsFromSkillText(body)])),
		references: Object.fromEntries(Object.entries(skill.references ?? {}).map(([name, body]) => [name, stripSecretsFromSkillText(body)])),
		templates: Object.fromEntries(Object.entries(skill.templates ?? {}).map(([name, body]) => [name, stripSecretsFromSkillText(body)]))
	};
}
async function seedBuiltinSkills() {
	await ensureSkillsSchema();
	const existing = await readSkills();
	const bySlug = new Map(existing.map((row) => [row.slug, row]));
	for (const pack of BUILTIN_SKILLS) {
		const { meta, body } = parseSkillFrontmatter(pack.skillMd);
		const version = String(meta.version ?? "1.0.0");
		const runtime = pack.runtime ?? {
			python: pack.scripts ? "3.11" : void 0,
			timeoutSec: 60,
			network: false
		};
		const found = bySlug.get(pack.slug);
		if (found) {
			if (found.provenance === "builtin" && found.version !== version) await patchSkillRow(found.id, {
				name: String(meta.name ?? pack.slug),
				description: String(meta.description ?? ""),
				version,
				tags: JSON.stringify(Array.isArray(meta.tags) ? meta.tags : []),
				skill_md: pack.skillMd.slice(0, 2e5),
				scripts_json: JSON.stringify(pack.scripts ?? {}),
				templates_json: JSON.stringify(pack.templates ?? {}),
				runtime_json: JSON.stringify(runtime)
			});
			continue;
		}
		await insertSkillRow({
			slug: pack.slug,
			name: String(meta.name ?? pack.slug),
			description: String(meta.description ?? ""),
			version,
			tags: Array.isArray(meta.tags) ? meta.tags : [],
			category: typeof meta.category === "string" ? meta.category : "ops",
			provenance: "builtin",
			status: "active",
			permissions: Array.isArray(meta.permissions) ? meta.permissions : [],
			runtime,
			skillMd: pack.skillMd,
			scripts: pack.scripts ?? {},
			templates: pack.templates ?? {},
			enabled: true,
			createdBy: "system",
			body
		});
	}
}
async function insertSkillRow(input) {
	const id = newId();
	const stamp = nowIso();
	const row = {
		id,
		slug: input.slug,
		name: input.name,
		description: input.description,
		version: input.version,
		tags: JSON.stringify(input.tags),
		category: input.category,
		provenance: input.provenance,
		status: input.status,
		permissions: JSON.stringify(input.permissions),
		runtime_json: JSON.stringify(input.runtime),
		inputs_schema: null,
		outputs_schema: null,
		skill_md: stripSecretsFromSkillText(input.skillMd).slice(0, 2e5),
		scripts_json: JSON.stringify(Object.fromEntries(Object.entries(input.scripts).map(([name, body]) => [name.slice(0, 80), stripSecretsFromSkillText(body).slice(0, 8e4)]))),
		refs_json: JSON.stringify(input.references ?? {}),
		templates_json: JSON.stringify(input.templates ?? {}),
		enabled: input.enabled,
		parent_id: input.parentId ?? null,
		created_at: stamp,
		updated_at: stamp,
		created_by: input.createdBy
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("skills").insert(row);
		if (error && !isMissingTable(error)) {} else if (!error) return mapSkill(row);
	}
	await (await localSql()).query(`insert into skills
      (id, slug, name, description, version, tags, category, provenance, status, permissions,
       runtime_json, inputs_schema, outputs_schema, skill_md, scripts_json, refs_json, templates_json,
       enabled, parent_id, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`, [
		row.id,
		row.slug,
		row.name,
		row.description,
		row.version,
		row.tags,
		row.category,
		row.provenance,
		row.status,
		row.permissions,
		row.runtime_json,
		row.inputs_schema,
		row.outputs_schema,
		row.skill_md,
		row.scripts_json,
		row.refs_json,
		row.templates_json,
		row.enabled,
		row.parent_id,
		row.created_at,
		row.updated_at,
		row.created_by
	]);
	return mapSkill(row);
}
async function readSkills() {
	await ensureSkillsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("skills").select("*").order("updated_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapSkill(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		return (await (await localSql()).query("select * from skills order by updated_at desc")).map(mapSkill);
	} catch {
		return [];
	}
}
async function listPublicSkills() {
	await seedBuiltinSkills();
	await archiveStaleAgentSkills();
	return (await readSkills()).filter((row) => row.enabled && row.status === "active");
}
function publicSkillSummary(skill) {
	return skillListItem(publicSkill(skill));
}
function publicSkillMcpGet(skill) {
	return skillMcpGet(publicSkill(skill));
}
async function archiveStaleAgentSkills() {
	const cutoff = Date.now() - 2592e6;
	const all = await readSkills();
	for (const skill of all) {
		if (skill.provenance !== "agent") continue;
		if (skill.status !== "pending_review") continue;
		const at = Date.parse(skill.updatedAt);
		if (!Number.isFinite(at) || at > cutoff) continue;
		await patchSkillRow(skill.id, {
			status: "archived",
			enabled: false
		});
	}
}
async function listSkillRunsForSkill(skillId, limit = 20) {
	await ensureSkillsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("skill_runs").select("*").eq("skill_id", skillId).order("created_at", { ascending: false }).limit(limit);
		if (!error) return (data ?? []).map((row) => mapRun(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		return (await (await localSql()).query("select * from skill_runs where skill_id = $1 order by created_at desc limit $2", [skillId, limit])).map(mapRun);
	} catch {
		return [];
	}
}
async function getSkillById(id) {
	return (await readSkills()).find((row) => row.id === id || row.slug === id) ?? null;
}
async function patchSkillRow(id, patch) {
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("skills").update({
		...patch,
		updated_at: stamp
	}).eq("id", id);
	try {
		const sql = await localSql();
		const keys = Object.keys(patch);
		if (!keys.length) return;
		const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
		await sql.query(`update skills set ${sets}, updated_at = $1 where id = $${keys.length + 2}`, [
			stamp,
			...keys.map((key) => patch[key]),
			id
		]);
	} catch {}
}
async function insertRun(row) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("skill_runs").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) {}
	}
	await (await localSql()).query(`insert into skill_runs (id, skill_id, version, status, actor, args_json, stdout, stderr, exit_code, duration_ms, error_code, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
		row.id,
		row.skill_id,
		row.version,
		row.status,
		row.actor,
		row.args_json,
		row.stdout,
		row.stderr,
		row.exit_code,
		row.duration_ms,
		row.error_code,
		row.created_at,
		row.updated_at
	]);
}
async function patchRun(id, patch) {
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("skill_runs").update({
			...patch,
			updated_at: stamp
		}).eq("id", id);
		if (!error) return;
	}
	const sql = await localSql();
	const keys = Object.keys(patch);
	const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
	await sql.query(`update skill_runs set ${sets}, updated_at = $1 where id = $${keys.length + 2}`, [
		stamp,
		...keys.map((key) => patch[key]),
		id
	]);
}
async function getSkillRun(id) {
	await ensureSkillsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("skill_runs").select("*").eq("id", id).maybeSingle();
		if (!error && data) return mapRun(data);
		if (error && !isMissingTable(error) && data) {}
	}
	try {
		const rows = await (await localSql()).query("select * from skill_runs where id = $1", [id]);
		return rows[0] ? mapRun(rows[0]) : null;
	} catch {
		return null;
	}
}
async function invokeSkillInternal(input) {
	await seedBuiltinSkills();
	const skill = await getSkillById(input.skillId);
	if (!skill) throw new Error("SKILL_MISSING");
	if (!skill.enabled || skill.status === "disabled" || skill.status === "archived") throw new Error("SKILL_DISABLED");
	if (skill.status === "pending_review") throw new Error("SKILL_PENDING");
	const runId = newId();
	const stamp = nowIso();
	await insertRun({
		id: runId,
		skill_id: skill.id,
		version: skill.version,
		status: "running",
		actor: input.actorId,
		args_json: JSON.stringify(input.args ?? {}),
		stdout: null,
		stderr: null,
		exit_code: null,
		duration_ms: null,
		error_code: null,
		created_at: stamp,
		updated_at: stamp
	});
	const scripts = Object.entries(skill.scripts);
	const { readPlaybookPolicies } = await import("./autonomy-policy.server-HcFlL3K7.mjs").then((n) => n.n);
	const policies = await readPlaybookPolicies();
	const network = skill.runtime.network === true && policies.skillsAllowNetwork === true;
	const requirePython = Boolean(skill.runtime.python) || Boolean(skill.runtime.entrypoint) || scripts.some(([name]) => name.endsWith(".py"));
	if (scripts.length === 0 && !requirePython) {
		await patchRun(runId, {
			status: "completed",
			stdout: skill.skillMd.slice(0, 8e3),
			exit_code: 0,
			duration_ms: 0
		});
		return {
			run: await getSkillRun(runId),
			skill: publicSkill(skill),
			taskId: runId
		};
	}
	try {
		const { runPythonInSkillSandbox } = await import("./skill-sandbox.server-DQUvCXDi.mjs");
		const result = await runPythonInSkillSandbox({
			slug: skill.slug,
			skillId: skill.id,
			version: skill.version,
			skillMd: skill.skillMd,
			scripts: skill.scripts,
			references: skill.references,
			templates: skill.templates,
			args: input.args ?? {},
			timeoutSec: skill.runtime.timeoutSec ?? 120,
			network,
			entrypoint: skill.runtime.entrypoint
		});
		await patchRun(runId, {
			status: result.exitCode === 0 ? "completed" : "error",
			stdout: result.stdout,
			stderr: result.stderr,
			exit_code: result.exitCode,
			duration_ms: result.durationMs,
			error_code: result.exitCode === 0 ? null : "SKILL_EXIT",
			artifacts_json: JSON.stringify(result.artifacts ?? [])
		});
	} catch (error) {
		const code = error instanceof Error ? error.message : "SKILL_EXEC_FAILED";
		await patchRun(runId, {
			status: "error",
			error_code: code.slice(0, 80),
			duration_ms: Date.now() - Date.parse(stamp)
		});
		if (code === "DAYTONA_UNAVAILABLE") throw error;
	}
	return {
		run: await getSkillRun(runId),
		skill: publicSkill(skill),
		taskId: runId
	};
}
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("610e12ffe9c58b278aa912efd83d291e5a686d9d03bf6d9e95da3b774daab5e9"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("ca61aeb9f4931bd10f2682a0c09265b8b27388feb4ebb4e9ec32da0a947aca67"));
var CreateSchema = object({
	skillMd: string().min(10).max(2e5),
	scripts: record(string(), string()).optional(),
	provenance: _enum(["human", "agent"]).optional()
});
async function createSkillInternal(input) {
	await seedBuiltinSkills();
	const blob = [
		input.skillMd,
		JSON.stringify(input.scripts ?? {}),
		JSON.stringify(input.references ?? {})
	].join("\n");
	if (skillPackageContainsSecrets(blob)) throw new Error("SKILL_SECRETS_FORBIDDEN");
	const { meta } = parseSkillFrontmatter(input.skillMd);
	const slug = `${sanitizeText(String(input.name ?? meta.name ?? "skill")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "skill"}-${newId().slice(0, 8)}`;
	const provenance = input.provenance === "agent" || input.provenance === "builtin" ? input.provenance : "human";
	const permissions = input.permissions ?? (Array.isArray(meta.permissions) ? meta.permissions : []);
	const agentPending = provenance === "agent" && input.autoPublish !== true;
	const runtimeMeta = meta.runtime && typeof meta.runtime === "object" ? meta.runtime : {};
	const skill = await insertSkillRow({
		slug,
		name: String(input.name ?? meta.name ?? slug),
		description: String(input.description ?? meta.description ?? "").slice(0, 400),
		version: String(meta.version ?? "1.0.0"),
		tags: input.tags ?? (Array.isArray(meta.tags) ? meta.tags : []),
		category: input.category ?? (typeof meta.category === "string" ? meta.category : "custom"),
		provenance,
		status: agentPending ? "pending_review" : "active",
		permissions: provenance === "agent" ? clipAgentSkillPermissions(permissions) : permissions,
		runtime: {
			python: input.scripts && Object.keys(input.scripts).length ? "3.11" : runtimeMeta.python,
			timeoutSec: input.runtime?.timeoutSec ?? runtimeMeta.timeoutSec ?? 120,
			network: false,
			entrypoint: input.runtime?.entrypoint ?? runtimeMeta.entrypoint
		},
		skillMd: input.skillMd,
		scripts: input.scripts ?? {},
		references: input.references,
		templates: input.templates,
		enabled: !agentPending,
		createdBy: input.createdBy
	});
	await bumpToolsGeneration();
	return publicSkill(skill);
}
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateSchema.parse(input)).handler(createSsrRpc("2672a606148443a121316ce485fcc621517f985f8ec37e09a8c92e7236591dbe"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	enabled: boolean()
}).parse(input)).handler(createSsrRpc("b92afe8985e7d0a8a8414d98b67b2e44602023ca1035204ba08a5286c1f97501"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("6160af63598ed78507bd7978a9459665038068a88d180e3f5f4967bf2a21ad91"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	args: record(string(), unknown()).optional()
}).parse(input)).handler(createSsrRpc("e57792484125d51863bb6eaf0ad706d616369370877f9d505bbb97707eebc6f6"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("a9143a55fe73e1fa12a296827e7316db4bba4b616e09888d4a14666275db8922"));
async function createSkillInternalFromDistill(input) {
	await seedBuiltinSkills();
	const { meta } = parseSkillFrontmatter(input.skillMd);
	const skill = await insertSkillRow({
		slug: `${sanitizeText(String(meta.name ?? "agent-skill")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "agent-skill"}-${newId().slice(0, 8)}`,
		name: String(meta.name ?? "Agent skill"),
		description: String(meta.description ?? "Proposed from a successful autonomous run.").slice(0, 400),
		version: String(meta.version ?? "0.1.0"),
		tags: Array.isArray(meta.tags) ? meta.tags : ["agent"],
		category: typeof meta.category === "string" ? meta.category : "agent",
		provenance: "agent",
		status: input.autoPublish ? "active" : "pending_review",
		permissions: clipAgentSkillPermissions(Array.isArray(meta.permissions) ? meta.permissions : ["clients:read"]),
		runtime: {
			timeoutSec: 60,
			network: false
		},
		skillMd: stripSecretsFromSkillText(input.skillMd),
		scripts: {},
		enabled: input.autoPublish,
		createdBy: input.createdBy
	});
	await bumpToolsGeneration();
	return publicSkill(skill);
}
async function patchSkillInternal(input) {
	const skill = await getSkillById(input.id);
	if (!skill) throw new Error("SKILL_MISSING");
	const blob = [
		input.skillMd ?? "",
		JSON.stringify(input.scripts ?? {}),
		JSON.stringify(input.references ?? {})
	].join("\n");
	if (blob.trim() && skillPackageContainsSecrets(blob)) throw new Error("SKILL_SECRETS_FORBIDDEN");
	if (input.snapshot !== false && (input.skillMd || input.scripts)) await snapshotSkillVersion(skill);
	const patch = {};
	if (typeof input.skillMd === "string") {
		const md = stripSecretsFromSkillText(input.skillMd);
		const { meta } = parseSkillFrontmatter(md);
		patch.skill_md = md.slice(0, 2e5);
		if (meta.name) patch.name = String(meta.name).slice(0, 120);
		if (meta.description) patch.description = String(meta.description).slice(0, 400);
		if (meta.version) patch.version = String(meta.version).slice(0, 32);
		if (Array.isArray(meta.permissions) && skill.provenance === "agent") patch.permissions = JSON.stringify(clipAgentSkillPermissions(meta.permissions));
	}
	if (input.scripts) patch.scripts_json = JSON.stringify(Object.fromEntries(Object.entries(input.scripts).map(([name, body]) => [name.slice(0, 80), stripSecretsFromSkillText(body).slice(0, 8e4)])));
	if (input.references) patch.refs_json = JSON.stringify(input.references);
	if (input.templates) patch.templates_json = JSON.stringify(input.templates);
	if (typeof input.enabled === "boolean") {
		patch.enabled = input.enabled;
		if (!input.status) patch.status = input.enabled ? "active" : "disabled";
	}
	if (input.status) patch.status = input.status;
	await patchSkillRow(skill.id, patch);
	await bumpToolsGeneration();
	const next = await getSkillById(skill.id);
	if (!next) throw new Error("SKILL_MISSING");
	return publicSkill(next);
}
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	skillMd: string().min(10).max(2e5).optional(),
	scripts: record(string(), string()).optional(),
	enabled: boolean().optional()
}).parse(input)).handler(createSsrRpc("3e81bd0b365cba9918015efc6ea5a30c31adc485e2ac5ee857afb1e5f95584c5"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("11bce1c7701acaaf0e543216784e9c1aaa80999f3408df52c73d92bb155155dc"));
async function snapshotSkillVersion(skill, createdBy) {
	await ensureSkillsSchema();
	const row = {
		id: newId(),
		skill_id: skill.id,
		version: skill.version,
		skill_md: skill.skillMd,
		scripts_json: JSON.stringify(skill.scripts ?? {}),
		refs_json: JSON.stringify(skill.references ?? {}),
		templates_json: JSON.stringify(skill.templates ?? {}),
		created_at: nowIso(),
		created_by: createdBy ?? skill.createdBy
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("skill_versions").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) {}
	}
	try {
		await (await localSql()).query(`insert into skill_versions (id, skill_id, version, skill_md, scripts_json, refs_json, templates_json, created_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
			row.id,
			row.skill_id,
			row.version,
			row.skill_md,
			row.scripts_json,
			row.refs_json,
			row.templates_json,
			row.created_at,
			row.created_by
		]);
	} catch {}
}
async function listSkillVersions(skillId) {
	await ensureSkillsSchema();
	const skill = await getSkillById(skillId);
	if (!skill) throw new Error("SKILL_MISSING");
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("skill_versions").select("id,skill_id,version,created_at").eq("skill_id", skill.id).order("created_at", { ascending: false }).limit(40);
		if (!error) return (data ?? []).map((row) => ({
			id: String(row.id),
			skillId: String(row.skill_id),
			version: String(row.version),
			createdAt: String(row.created_at)
		}));
	}
	try {
		return (await (await localSql()).query("select id, skill_id, version, created_at from skill_versions where skill_id = $1 order by created_at desc limit 40", [skill.id])).map((row) => ({
			id: String(row.id),
			skillId: String(row.skill_id),
			version: String(row.version),
			createdAt: String(row.created_at)
		}));
	} catch {
		return [];
	}
}
async function rollbackSkill(input) {
	const skill = await getSkillById(input.id);
	if (!skill) throw new Error("SKILL_MISSING");
	await snapshotSkillVersion(skill, input.actor);
	const admin = await getAgencyAdmin();
	let snapshot = null;
	if (admin) {
		const { data } = await admin.from("skill_versions").select("*").eq("skill_id", skill.id).eq("version", input.version).order("created_at", { ascending: false }).limit(1).maybeSingle();
		snapshot = data ?? null;
	}
	if (!snapshot) snapshot = (await (await localSql()).query("select * from skill_versions where skill_id = $1 and version = $2 order by created_at desc limit 1", [skill.id, input.version]))[0] ?? null;
	if (!snapshot) throw new Error("SKILL_VERSION_MISSING");
	return patchSkillInternal({
		id: skill.id,
		skillMd: String(snapshot.skill_md ?? skill.skillMd),
		scripts: parseJson(snapshot.scripts_json, skill.scripts),
		references: parseJson(snapshot.refs_json, skill.references),
		templates: parseJson(snapshot.templates_json, skill.templates),
		snapshot: false
	});
}
function scriptsFromPayload(raw) {
	if (!raw) return void 0;
	if (Array.isArray(raw)) {
		const out = {};
		for (const item of raw) {
			if (!item || typeof item !== "object") continue;
			const row = item;
			const path = String(row.path ?? "").replace(/^\/+/, "");
			if (!path || path.includes("..")) continue;
			out[path] = String(row.content ?? "");
		}
		return out;
	}
	if (typeof raw === "object") return raw;
}
async function skillManageCreate(input) {
	const payload = input.payload;
	const scripts = scriptsFromPayload(payload.scripts);
	let skillMd = String(payload.skill_md ?? payload.skillMd ?? "");
	if (skillMd.length < 10) {
		const name = String(payload.name ?? "Untitled skill");
		const description = String(payload.description ?? "");
		skillMd = `---\nname: ${name}\ndescription: ${description}\nversion: 1.0.0\n---\n\n# ${name}\n\n${description}\n`;
	}
	return createSkillInternal({
		skillMd,
		scripts,
		references: scriptsFromPayload(payload.references),
		templates: scriptsFromPayload(payload.templates),
		provenance: payload.provenance === "human" ? "human" : "agent",
		createdBy: input.actor,
		autoPublish: input.autoPublish,
		name: typeof payload.name === "string" ? payload.name : void 0,
		description: typeof payload.description === "string" ? payload.description : void 0,
		category: typeof payload.category === "string" ? payload.category : void 0,
		tags: Array.isArray(payload.tags) ? payload.tags.map(String) : void 0,
		permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : void 0,
		runtime: payload.runtime && typeof payload.runtime === "object" ? payload.runtime : void 0
	});
}
async function skillManageEdit(input) {
	return patchSkillInternal({
		id: input.id,
		skillMd: input.skillMd,
		scripts: input.scripts
	});
}
async function skillManagePatch(input) {
	const skill = await getSkillById(input.id);
	if (!skill) throw new Error("SKILL_MISSING");
	if (!input.find) throw new Error("VALIDATION");
	const path = (input.path ?? "SKILL.md").replace(/^\/+/, "");
	if (path === "SKILL.md" || path === "skill.md") {
		if (!skill.skillMd.includes(input.find)) throw new Error("SKILL_PATCH_MISS");
		return patchSkillInternal({
			id: skill.id,
			skillMd: skill.skillMd.split(input.find).join(input.replace)
		});
	}
	const key = Object.keys(skill.scripts).find((name) => name === path || name.endsWith(`/${path}`) || `scripts/${name}` === path) ?? null;
	if (!key) throw new Error("SKILL_FILE_MISSING");
	const body = skill.scripts[key] ?? "";
	if (!body.includes(input.find)) throw new Error("SKILL_PATCH_MISS");
	const next = {
		...skill.scripts,
		[key]: body.split(input.find).join(input.replace)
	};
	return patchSkillInternal({
		id: skill.id,
		scripts: next
	});
}
async function skillManageWriteFile(input) {
	const skill = await getSkillById(input.id);
	if (!skill) throw new Error("SKILL_MISSING");
	const path = input.path.replace(/^\/+/, "");
	if (path.includes("..")) throw new Error("VALIDATION");
	if (skillPackageContainsSecrets(input.content)) throw new Error("SKILL_SECRETS_FORBIDDEN");
	if (path === "SKILL.md") return patchSkillInternal({
		id: skill.id,
		skillMd: input.content
	});
	if (path.startsWith("scripts/") || path.endsWith(".py")) {
		const key = path.startsWith("scripts/") ? path.slice(8) : path;
		return patchSkillInternal({
			id: skill.id,
			scripts: {
				...skill.scripts,
				[key]: input.content
			}
		});
	}
	if (path.startsWith("references/")) {
		const key = path.slice(11);
		return patchSkillInternal({
			id: skill.id,
			references: {
				...skill.references ?? {},
				[key]: input.content
			}
		});
	}
	if (path.startsWith("templates/")) {
		const key = path.slice(10);
		return patchSkillInternal({
			id: skill.id,
			templates: {
				...skill.templates ?? {},
				[key]: input.content
			}
		});
	}
	throw new Error("VALIDATION");
}
async function skillManageSetProvenanceReview(input) {
	const skill = await getSkillById(input.id);
	if (!skill) throw new Error("SKILL_MISSING");
	if (input.decision === "approve") return patchSkillInternal({
		id: skill.id,
		enabled: true,
		status: "active",
		snapshot: false
	});
	return patchSkillInternal({
		id: skill.id,
		enabled: false,
		status: "archived",
		snapshot: false
	});
}
//#endregion
export { invokeSkillInternal as n, skills_server_D63wa77B_exports as r, createSkillInternalFromDistill as t };
