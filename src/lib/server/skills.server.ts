import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole, requireAdmin } from "@/lib/server/access";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { sanitizeText } from "@/lib/sanitize";
import { bumpToolsGeneration } from "@/lib/server/addons.server";
import {
  BUILTIN_SKILLS,
  clipAgentSkillPermissions,
  parseSkillFrontmatter,
  skillListItem,
  skillMcpGet,
  skillPackageContainsSecrets,
  stripSecretsFromSkillText,
  type SkillProvenance,
  type SkillRecord,
  type SkillRun,
  type SkillRuntime,
  type SkillStatus,
} from "@/lib/skills";

function nowIso(): string {
  return new Date().toISOString();
}
function newId(): string {
  return crypto.randomUUID();
}

let schemaReady: Promise<void> | null = null;

async function ensureSkillsSchema(): Promise<void> {
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

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== "string") return (raw as T) ?? fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapSkill(row: Record<string, unknown>): SkillRecord {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    version: String(row.version ?? "1.0.0"),
    tags: parseJson<string[]>(row.tags, []),
    category: row.category ? String(row.category) : null,
    provenance: (row.provenance as SkillProvenance) ?? "human",
    status: (row.status as SkillStatus) ?? "active",
    permissions: parseJson<string[]>(row.permissions, []),
    runtime: parseJson<SkillRuntime>(row.runtime_json, {}),
    inputsSchema: parseJson<SkillRecord["inputsSchema"]>(row.inputs_schema, null),
    outputsSchema: parseJson<SkillRecord["outputsSchema"]>(row.outputs_schema, null),
    skillMd: String(row.skill_md ?? ""),
    scripts: parseJson<Record<string, string>>(row.scripts_json, {}),
    references: parseJson<Record<string, string>>(row.refs_json, {}),
    templates: parseJson<Record<string, string>>(row.templates_json, {}),
    enabled: row.enabled !== false && row.enabled !== 0,
    parentId: row.parent_id ? String(row.parent_id) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdBy: row.created_by ? String(row.created_by) : null,
  };
}

function mapRun(row: Record<string, unknown>): SkillRun {
  return {
    id: String(row.id ?? ""),
    skillId: String(row.skill_id ?? ""),
    version: String(row.version ?? ""),
    status: (row.status as SkillRun["status"]) ?? "queued",
    stdout: row.stdout ? String(row.stdout) : null,
    stderr: row.stderr ? String(row.stderr) : null,
    exitCode: row.exit_code == null ? null : Number(row.exit_code),
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    errorCode: row.error_code ? String(row.error_code) : null,
    artifacts: parseJson<SkillRun["artifacts"]>(row.artifacts_json, []),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function publicSkill(skill: SkillRecord): SkillRecord {
  return {
    ...skill,
    skillMd: stripSecretsFromSkillText(skill.skillMd),
    scripts: Object.fromEntries(
      Object.entries(skill.scripts).map(([name, body]) => [name, stripSecretsFromSkillText(body)]),
    ),
    references: Object.fromEntries(
      Object.entries(skill.references ?? {}).map(([name, body]) => [name, stripSecretsFromSkillText(body)]),
    ),
    templates: Object.fromEntries(
      Object.entries(skill.templates ?? {}).map(([name, body]) => [name, stripSecretsFromSkillText(body)]),
    ),
  };
}

export async function seedBuiltinSkills(): Promise<void> {
  await ensureSkillsSchema();
  const existing = await readSkills();
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  for (const pack of BUILTIN_SKILLS) {
    const { meta, body } = parseSkillFrontmatter(pack.skillMd);
    const version = String(meta.version ?? "1.0.0");
    const runtime: SkillRuntime =
      pack.runtime ?? {
        python: pack.scripts ? "3.11" : undefined,
        timeoutSec: 60,
        network: false,
      };
    const found = bySlug.get(pack.slug);
    if (found) {
      if (found.provenance === "builtin" && found.version !== version) {
        await patchSkillRow(found.id, {
          name: String(meta.name ?? pack.slug),
          description: String(meta.description ?? ""),
          version,
          tags: JSON.stringify(Array.isArray(meta.tags) ? meta.tags : []),
          skill_md: pack.skillMd.slice(0, 200_000),
          scripts_json: JSON.stringify(pack.scripts ?? {}),
          templates_json: JSON.stringify(pack.templates ?? {}),
          runtime_json: JSON.stringify(runtime),
        });
      }
      continue;
    }
    await insertSkillRow({
      slug: pack.slug,
      name: String(meta.name ?? pack.slug),
      description: String(meta.description ?? ""),
      version,
      tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
      category: typeof meta.category === "string" ? meta.category : "ops",
      provenance: "builtin",
      status: "active",
      permissions: Array.isArray(meta.permissions) ? (meta.permissions as string[]) : [],
      runtime,
      skillMd: pack.skillMd,
      scripts: pack.scripts ?? {},
      templates: pack.templates ?? {},
      enabled: true,
      createdBy: "system",
      body,
    });
  }
}

async function insertSkillRow(input: {
  slug: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  category: string | null;
  provenance: SkillProvenance;
  status: SkillStatus;
  permissions: string[];
  runtime: SkillRuntime;
  skillMd: string;
  scripts: Record<string, string>;
  references?: Record<string, string>;
  templates?: Record<string, string>;
  enabled: boolean;
  createdBy: string | null;
  parentId?: string | null;
  body?: string;
}): Promise<SkillRecord> {
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
    inputs_schema: null as string | null,
    outputs_schema: null as string | null,
    skill_md: stripSecretsFromSkillText(input.skillMd).slice(0, 200_000),
    scripts_json: JSON.stringify(
      Object.fromEntries(
        Object.entries(input.scripts).map(([name, body]) => [
          name.slice(0, 80),
          stripSecretsFromSkillText(body).slice(0, 80_000),
        ]),
      ),
    ),
    refs_json: JSON.stringify(input.references ?? {}),
    templates_json: JSON.stringify(input.templates ?? {}),
    enabled: input.enabled,
    parent_id: input.parentId ?? null,
    created_at: stamp,
    updated_at: stamp,
    created_by: input.createdBy,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("skills").insert(row);
    if (error && !isMissingTable(error)) {
      /* fall through */
    } else if (!error) {
      return mapSkill(row);
    }
  }
  const sql = await localSql();
  await sql.query(
    `insert into skills
      (id, slug, name, description, version, tags, category, provenance, status, permissions,
       runtime_json, inputs_schema, outputs_schema, skill_md, scripts_json, refs_json, templates_json,
       enabled, parent_id, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
    [
      row.id, row.slug, row.name, row.description, row.version, row.tags, row.category,
      row.provenance, row.status, row.permissions, row.runtime_json, row.inputs_schema,
      row.outputs_schema, row.skill_md, row.scripts_json, row.refs_json, row.templates_json,
      row.enabled, row.parent_id, row.created_at, row.updated_at, row.created_by,
    ],
  );
  return mapSkill(row);
}

export async function readSkills(): Promise<SkillRecord[]> {
  await ensureSkillsSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("skills").select("*").order("updated_at", { ascending: false });
    if (!error) return (data ?? []).map((row) => mapSkill(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from skills order by updated_at desc");
    return rows.map(mapSkill);
  } catch {
    return [];
  }
}

export async function listPublicSkills(): Promise<SkillRecord[]> {
  await seedBuiltinSkills();
  await archiveStaleAgentSkills();
  return (await readSkills()).filter(
    (row) => row.enabled && row.status === "active",
  );
}

export function publicSkillSummary(skill: SkillRecord) {
  return skillListItem(publicSkill(skill));
}

export function publicSkillMcpGet(skill: SkillRecord) {
  return skillMcpGet(publicSkill(skill));
}

async function archiveStaleAgentSkills(): Promise<void> {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const all = await readSkills();
  for (const skill of all) {
    if (skill.provenance !== "agent") continue;
    if (skill.status !== "pending_review") continue;
    const at = Date.parse(skill.updatedAt);
    if (!Number.isFinite(at) || at > cutoff) continue;
    await patchSkillRow(skill.id, { status: "archived", enabled: false });
  }
}

export async function listSkillRunsForSkill(skillId: string, limit = 20): Promise<SkillRun[]> {
  await ensureSkillsSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("skill_runs")
      .select("*")
      .eq("skill_id", skillId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error) return (data ?? []).map((row) => mapRun(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from skill_runs where skill_id = $1 order by created_at desc limit $2",
      [skillId, limit],
    );
    return rows.map(mapRun);
  } catch {
    return [];
  }
}

export async function getSkillById(id: string): Promise<SkillRecord | null> {
  const all = await readSkills();
  return all.find((row) => row.id === id || row.slug === id) ?? null;
}

async function patchSkillRow(id: string, patch: Record<string, unknown>): Promise<void> {
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("skills").update({ ...patch, updated_at: stamp }).eq("id", id);
  }
  try {
    const sql = await localSql();
    const keys = Object.keys(patch);
    if (!keys.length) return;
    const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
    await sql.query(
      `update skills set ${sets}, updated_at = $1 where id = $${keys.length + 2}`,
      [stamp, ...keys.map((key) => patch[key]), id],
    );
  } catch {
    /* ignore */
  }
}

async function insertRun(row: Record<string, unknown>): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("skill_runs").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) {
      /* fall through to local */
    } else {
      /* missing table — local */
    }
  }
  const sql = await localSql();
  await sql.query(
    `insert into skill_runs (id, skill_id, version, status, actor, args_json, stdout, stderr, exit_code, duration_ms, error_code, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      row.id, row.skill_id, row.version, row.status, row.actor, row.args_json, row.stdout,
      row.stderr, row.exit_code, row.duration_ms, row.error_code, row.created_at, row.updated_at,
    ],
  );
}

async function patchRun(id: string, patch: Record<string, unknown>): Promise<void> {
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("skill_runs").update({ ...patch, updated_at: stamp }).eq("id", id);
    if (!error) return;
  }
  const sql = await localSql();
  const keys = Object.keys(patch);
  const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
  await sql.query(`update skill_runs set ${sets}, updated_at = $1 where id = $${keys.length + 2}`, [
    stamp,
    ...keys.map((key) => patch[key]),
    id,
  ]);
}

export async function getSkillRun(id: string): Promise<SkillRun | null> {
  await ensureSkillsSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("skill_runs").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapRun(data as Record<string, unknown>);
    if (error && !isMissingTable(error) && data) {
      /* continue */
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from skill_runs where id = $1", [id]);
    return rows[0] ? mapRun(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function invokeSkillInternal(input: {
  skillId: string;
  args?: Record<string, unknown>;
  actorId: string;
}): Promise<{ run: SkillRun; skill: SkillRecord; taskId: string }> {
  await seedBuiltinSkills();
  const skill = await getSkillById(input.skillId);
  if (!skill) throw new Error("SKILL_MISSING");
  if (!skill.enabled || skill.status === "disabled" || skill.status === "archived") {
    throw new Error("SKILL_DISABLED");
  }
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
    updated_at: stamp,
  });

  const scripts = Object.entries(skill.scripts);
  const { readPlaybookPolicies } = await import("@/lib/server/autonomy-policy.server");
  const policies = await readPlaybookPolicies();
  const network = skill.runtime.network === true && policies.skillsAllowNetwork === true;
  const requirePython =
    Boolean(skill.runtime.python) ||
    Boolean(skill.runtime.entrypoint) ||
    scripts.some(([name]) => name.endsWith(".py"));
  if (scripts.length === 0 && !requirePython) {
    await patchRun(runId, {
      status: "completed",
      stdout: skill.skillMd.slice(0, 8000),
      exit_code: 0,
      duration_ms: 0,
    });
    const run = (await getSkillRun(runId))!;
    return { run, skill: publicSkill(skill), taskId: runId };
  }

  try {
    const { runPythonInSkillSandbox } = await import("@/lib/server/skill-sandbox.server");
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
      entrypoint: skill.runtime.entrypoint,
    });
    await patchRun(runId, {
      status: result.exitCode === 0 ? "completed" : "error",
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exitCode,
      duration_ms: result.durationMs,
      error_code: result.exitCode === 0 ? null : "SKILL_EXIT",
      artifacts_json: JSON.stringify(result.artifacts ?? []),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SKILL_EXEC_FAILED";
    await patchRun(runId, {
      status: "error",
      error_code: code.slice(0, 80),
      duration_ms: Date.now() - Date.parse(stamp),
    });
    if (code === "DAYTONA_UNAVAILABLE") throw error;
  }
  const run = (await getSkillRun(runId))!;
  return { run, skill: publicSkill(skill), taskId: runId };
}

export const listSkillsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    await seedBuiltinSkills();
    return (await readSkills()).map(publicSkill);
  });

export const getSkillFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    await seedBuiltinSkills();
    const skill = await getSkillById(id);
    if (!skill) throw new Error("SKILL_MISSING");
    return publicSkill(skill);
  });

function isAutonomyCreatedBy(createdBy: string): boolean {
  const value = createdBy.trim().toLowerCase();
  if (!value) return false;
  if (value.startsWith("mcp:") || value.startsWith("agent:") || value.startsWith("webhook:")) return true;
  return value === "mcp" || value === "agent" || value === "webhook" || value === "hermes";
}

const CreateSchema = z.object({
  skillMd: z.string().min(10).max(200_000),
  scripts: z.record(z.string(), z.string()).optional(),
  provenance: z.enum(["human", "agent"]).optional(),
});

export async function createSkillInternal(input: {
  skillMd: string;
  scripts?: Record<string, string>;
  references?: Record<string, string>;
  templates?: Record<string, string>;
  provenance?: SkillProvenance;
  createdBy: string;
  autoPublish?: boolean;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  permissions?: string[];
  runtime?: SkillRuntime;
}): Promise<SkillRecord> {
  await seedBuiltinSkills();
  const blob = [input.skillMd, JSON.stringify(input.scripts ?? {}), JSON.stringify(input.references ?? {})].join("\n");
  if (skillPackageContainsSecrets(blob)) throw new Error("SKILL_SECRETS_FORBIDDEN");
  const { meta } = parseSkillFrontmatter(input.skillMd);
  const slugBase =
    sanitizeText(String(input.name ?? meta.name ?? "skill"))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "skill";
  const slug = `${slugBase}-${newId().slice(0, 8)}`;
  let provenance: SkillProvenance =
    input.provenance === "agent" || input.provenance === "builtin" ? input.provenance : "human";
  let autoPublish = input.autoPublish === true;
  if (provenance === "human" && isAutonomyCreatedBy(input.createdBy)) {
    provenance = "agent";
    autoPublish = false;
  }
  const permissions = input.permissions ?? (Array.isArray(meta.permissions) ? (meta.permissions as string[]) : []);
  const agentPending = provenance === "agent" && !autoPublish;
  const runtimeMeta = (meta.runtime && typeof meta.runtime === "object" ? meta.runtime : {}) as SkillRuntime;
  const skill = await insertSkillRow({
    slug,
    name: String(input.name ?? meta.name ?? slug),
    description: String(input.description ?? meta.description ?? "").slice(0, 400),
    version: String(meta.version ?? "1.0.0"),
    tags: input.tags ?? (Array.isArray(meta.tags) ? (meta.tags as string[]) : []),
    category: input.category ?? (typeof meta.category === "string" ? meta.category : "custom"),
    provenance,
    status: agentPending ? "pending_review" : "active",
    permissions: provenance === "agent" ? clipAgentSkillPermissions(permissions) : permissions,
    runtime: {
      python: input.scripts && Object.keys(input.scripts).length ? "3.11" : runtimeMeta.python,
      timeoutSec: input.runtime?.timeoutSec ?? runtimeMeta.timeoutSec ?? 120,
      network: false,
      entrypoint: input.runtime?.entrypoint ?? runtimeMeta.entrypoint,
    },
    skillMd: input.skillMd,
    scripts: input.scripts ?? {},
    references: input.references,
    templates: input.templates,
    enabled: !agentPending,
    createdBy: input.createdBy,
  });
  await bumpToolsGeneration();
  return publicSkill(skill);
}

export const createSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return createSkillInternal({
      skillMd: data.skillMd,
      scripts: data.scripts,
      provenance: data.provenance === "agent" ? "agent" : "human",
      createdBy: context.userId,
    });
  });

export const setSkillEnabledFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string(), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const skill = await getSkillById(data.id);
    if (!skill) throw new Error("SKILL_MISSING");
    if (skill.status === "pending_review" && data.enabled) {
      return { ok: true as const };
    }
    await patchSkillRow(skill.id, {
      enabled: data.enabled,
      status: data.enabled ? "active" : "disabled",
    });
    await bumpToolsGeneration();
    return { ok: true as const };
  });

export const approveSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const skill = await getSkillById(id);
    if (!skill) throw new Error("SKILL_MISSING");
    await patchSkillRow(skill.id, { status: "active", enabled: true });
    await bumpToolsGeneration();
    try {
      const { writeAuditEvent } = await import("@/lib/server/audit.server");
      await writeAuditEvent({
        actorUserId: context.userId,
        actorType: "USER",
        action: "skill_manage.approve",
        entityType: "skill",
        entityId: skill.id,
        summary: `Approved skill ${skill.slug ?? skill.id}`,
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const invokeSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string(), args: z.record(z.string(), z.unknown()).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const role = await getUserRole(context.userId);
    if (role !== "admin" && role !== "member") throw new Error("Unauthorized");
    return invokeSkillInternal({
      skillId: data.id,
      args: data.args,
      actorId: context.userId,
    });
  });

export const getSkillRunFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const run = await getSkillRun(id);
    if (!run) throw new Error("JOB_MISSING");
    return run;
  });

export async function createSkillInternalFromDistill(input: {
  skillMd: string;
  autoPublish: boolean;
  createdBy: string;
}): Promise<SkillRecord> {
  await seedBuiltinSkills();
  const { meta } = parseSkillFrontmatter(input.skillMd);
  const slugBase =
    sanitizeText(String(meta.name ?? "agent-skill"))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "agent-skill";
  const skill = await insertSkillRow({
    slug: `${slugBase}-${newId().slice(0, 8)}`,
    name: String(meta.name ?? "Agent skill"),
    description: String(meta.description ?? "Proposed from a successful autonomous run.").slice(0, 400),
    version: String(meta.version ?? "0.1.0"),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : ["agent"],
    category: typeof meta.category === "string" ? meta.category : "agent",
    provenance: "agent",
    status: input.autoPublish ? "active" : "pending_review",
    permissions: clipAgentSkillPermissions(
      Array.isArray(meta.permissions) ? (meta.permissions as string[]) : ["clients:read"],
    ),
    runtime: { timeoutSec: 60, network: false },
    skillMd: stripSecretsFromSkillText(input.skillMd),
    scripts: {},
    enabled: input.autoPublish,
    createdBy: input.createdBy,
  });
  await bumpToolsGeneration();
  return publicSkill(skill);
}

export async function patchSkillInternal(input: {
  id: string;
  skillMd?: string;
  scripts?: Record<string, string>;
  references?: Record<string, string>;
  templates?: Record<string, string>;
  enabled?: boolean;
  status?: SkillStatus;
  snapshot?: boolean;
}): Promise<SkillRecord> {
  const skill = await getSkillById(input.id);
  if (!skill) throw new Error("SKILL_MISSING");
  const blob = [input.skillMd ?? "", JSON.stringify(input.scripts ?? {}), JSON.stringify(input.references ?? {})].join(
    "\n",
  );
  if (blob.trim() && skillPackageContainsSecrets(blob)) throw new Error("SKILL_SECRETS_FORBIDDEN");
  if (input.snapshot !== false && (input.skillMd || input.scripts)) {
    await snapshotSkillVersion(skill);
  }
  const patch: Record<string, unknown> = {};
  if (typeof input.skillMd === "string") {
    const md = stripSecretsFromSkillText(input.skillMd);
    const { meta } = parseSkillFrontmatter(md);
    patch.skill_md = md.slice(0, 200_000);
    if (meta.name) patch.name = String(meta.name).slice(0, 120);
    if (meta.description) patch.description = String(meta.description).slice(0, 400);
    if (meta.version) patch.version = String(meta.version).slice(0, 32);
    if (Array.isArray(meta.permissions) && skill.provenance === "agent") {
      patch.permissions = JSON.stringify(clipAgentSkillPermissions(meta.permissions as string[]));
    }
  }
  if (input.scripts) {
    patch.scripts_json = JSON.stringify(
      Object.fromEntries(
        Object.entries(input.scripts).map(([name, body]) => [
          name.slice(0, 80),
          stripSecretsFromSkillText(body).slice(0, 80_000),
        ]),
      ),
    );
  }
  if (input.references) patch.refs_json = JSON.stringify(input.references);
  if (input.templates) patch.templates_json = JSON.stringify(input.templates);
  if (typeof input.enabled === "boolean") {
    const approvePending = skill.status === "pending_review" && input.status === "active";
    if (skill.status !== "pending_review" || !input.enabled || approvePending) {
      patch.enabled = input.enabled;
      if (!input.status) patch.status = input.enabled ? "active" : "disabled";
    }
  }
  if (input.status) patch.status = input.status;
  await patchSkillRow(skill.id, patch);
  await bumpToolsGeneration();
  const next = await getSkillById(skill.id);
  if (!next) throw new Error("SKILL_MISSING");
  return publicSkill(next);
}

export const patchSkillFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        skillMd: z.string().min(10).max(200_000).optional(),
        scripts: z.record(z.string(), z.string()).optional(),
        enabled: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return patchSkillInternal(data);
  });

export const listSkillRunsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const skill = await getSkillById(id);
    if (!skill) throw new Error("SKILL_MISSING");
    return listSkillRunsForSkill(skill.id);
  });

async function snapshotSkillVersion(skill: SkillRecord, createdBy?: string | null): Promise<void> {
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
    created_by: createdBy ?? skill.createdBy,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("skill_versions").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) {
      /* fall through */
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into skill_versions (id, skill_id, version, skill_md, scripts_json, refs_json, templates_json, created_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        row.id,
        row.skill_id,
        row.version,
        row.skill_md,
        row.scripts_json,
        row.refs_json,
        row.templates_json,
        row.created_at,
        row.created_by,
      ],
    );
  } catch {
    /* schema may lag */
  }
}

export type SkillVersionRow = {
  id: string;
  skillId: string;
  version: string;
  createdAt: string;
};

export async function listSkillVersions(skillId: string): Promise<SkillVersionRow[]> {
  await ensureSkillsSchema();
  const skill = await getSkillById(skillId);
  if (!skill) throw new Error("SKILL_MISSING");
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("skill_versions")
      .select("id,skill_id,version,created_at")
      .eq("skill_id", skill.id)
      .order("created_at", { ascending: false })
      .limit(40);
    if (!error) {
      return (data ?? []).map((row) => ({
        id: String((row as { id: string }).id),
        skillId: String((row as { skill_id: string }).skill_id),
        version: String((row as { version: string }).version),
        createdAt: String((row as { created_at: string }).created_at),
      }));
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select id, skill_id, version, created_at from skill_versions where skill_id = $1 order by created_at desc limit 40",
      [skill.id],
    );
    return rows.map((row) => ({
      id: String(row.id),
      skillId: String(row.skill_id),
      version: String(row.version),
      createdAt: String(row.created_at),
    }));
  } catch {
    return [];
  }
}

export async function rollbackSkill(input: {
  id: string;
  version: string;
  actor?: string | null;
}): Promise<SkillRecord> {
  const skill = await getSkillById(input.id);
  if (!skill) throw new Error("SKILL_MISSING");
  await snapshotSkillVersion(skill, input.actor);
  const admin = await getAgencyAdmin();
  let snapshot: Record<string, unknown> | null = null;
  if (admin) {
    const { data } = await admin
      .from("skill_versions")
      .select("*")
      .eq("skill_id", skill.id)
      .eq("version", input.version)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    snapshot = (data as Record<string, unknown> | null) ?? null;
  }
  if (!snapshot) {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from skill_versions where skill_id = $1 and version = $2 order by created_at desc limit 1",
      [skill.id, input.version],
    );
    snapshot = rows[0] ?? null;
  }
  if (!snapshot) throw new Error("SKILL_VERSION_MISSING");
  return patchSkillInternal({
    id: skill.id,
    skillMd: String(snapshot.skill_md ?? skill.skillMd),
    scripts: parseJson<Record<string, string>>(snapshot.scripts_json, skill.scripts),
    references: parseJson<Record<string, string>>(snapshot.refs_json, skill.references),
    templates: parseJson<Record<string, string>>(snapshot.templates_json, skill.templates),
    snapshot: false,
  });
}

function scriptsFromPayload(raw: unknown): Record<string, string> | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as { path?: unknown; content?: unknown };
      const path = String(row.path ?? "").replace(/^\/+/, "");
      if (!path || path.includes("..")) continue;
      out[path] = String(row.content ?? "");
    }
    return out;
  }
  if (typeof raw === "object") return raw as Record<string, string>;
  return undefined;
}

export async function skillManageCreate(input: {
  payload: Record<string, unknown>;
  actor: string;
  autoPublish?: boolean;
}): Promise<SkillRecord> {
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
    provenance: "agent",
    createdBy: input.actor,
    autoPublish: payload.provenance === "human" ? false : input.autoPublish,
    name: typeof payload.name === "string" ? payload.name : undefined,
    description: typeof payload.description === "string" ? payload.description : undefined,
    category: typeof payload.category === "string" ? payload.category : undefined,
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : undefined,
    permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : undefined,
    runtime:
      payload.runtime && typeof payload.runtime === "object"
        ? (payload.runtime as SkillRuntime)
        : undefined,
  });
}

export async function skillManageEdit(input: {
  id: string;
  skillMd?: string;
  scripts?: Record<string, string>;
}): Promise<SkillRecord> {
  return patchSkillInternal({
    id: input.id,
    skillMd: input.skillMd,
    scripts: input.scripts,
  });
}

export async function skillManagePatch(input: {
  id: string;
  path?: string;
  find: string;
  replace: string;
}): Promise<SkillRecord> {
  const skill = await getSkillById(input.id);
  if (!skill) throw new Error("SKILL_MISSING");
  if (!input.find) throw new Error("VALIDATION");
  const path = (input.path ?? "SKILL.md").replace(/^\/+/, "");
  if (path === "SKILL.md" || path === "skill.md") {
    if (!skill.skillMd.includes(input.find)) throw new Error("SKILL_PATCH_MISS");
    return patchSkillInternal({
      id: skill.id,
      skillMd: skill.skillMd.split(input.find).join(input.replace),
    });
  }
  const key =
    Object.keys(skill.scripts).find((name) => name === path || name.endsWith(`/${path}`) || `scripts/${name}` === path) ??
    null;
  if (!key) throw new Error("SKILL_FILE_MISSING");
  const body = skill.scripts[key] ?? "";
  if (!body.includes(input.find)) throw new Error("SKILL_PATCH_MISS");
  const next = { ...skill.scripts, [key]: body.split(input.find).join(input.replace) };
  return patchSkillInternal({ id: skill.id, scripts: next });
}

export async function skillManageWriteFile(input: {
  id: string;
  path: string;
  content: string;
}): Promise<SkillRecord> {
  const skill = await getSkillById(input.id);
  if (!skill) throw new Error("SKILL_MISSING");
  const path = input.path.replace(/^\/+/, "");
  if (path.includes("..")) throw new Error("VALIDATION");
  if (skillPackageContainsSecrets(input.content)) throw new Error("SKILL_SECRETS_FORBIDDEN");
  if (path === "SKILL.md") {
    return patchSkillInternal({ id: skill.id, skillMd: input.content });
  }
  if (path.startsWith("scripts/") || path.endsWith(".py")) {
    const key = path.startsWith("scripts/") ? path.slice("scripts/".length) : path;
    return patchSkillInternal({ id: skill.id, scripts: { ...skill.scripts, [key]: input.content } });
  }
  if (path.startsWith("references/")) {
    const key = path.slice("references/".length);
    return patchSkillInternal({
      id: skill.id,
      references: { ...(skill.references ?? {}), [key]: input.content },
    });
  }
  if (path.startsWith("templates/")) {
    const key = path.slice("templates/".length);
    return patchSkillInternal({
      id: skill.id,
      templates: { ...(skill.templates ?? {}), [key]: input.content },
    });
  }
  throw new Error("VALIDATION");
}

export async function skillManageSetProvenanceReview(input: {
  id: string;
  decision: "approve" | "reject";
}): Promise<SkillRecord> {
  const skill = await getSkillById(input.id);
  if (!skill) throw new Error("SKILL_MISSING");
  if (input.decision === "approve") {
    return patchSkillInternal({ id: skill.id, enabled: true, status: "active", snapshot: false });
  }
  return patchSkillInternal({ id: skill.id, enabled: false, status: "archived", snapshot: false });
}
