import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingColumn, isMissingTable, mapTeamMember } from "@/lib/server/mappers";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { listApiKeyRows } from "@/lib/server/autonomy-auth.server";
import { listRemoteMcpTokens } from "@/lib/server/remote-mcp.server";
import { sanitizeText } from "@/lib/sanitize";
import {
  AUTOMATION_KINDS,
  AUTOMATION_RUNTIME_HINTS,
  BOT_ROLE_KEYS,
  HUMAN_ROLES,
  type AutomationKind,
  type AutomationRuntimeHint,
  type BotRoleKey,
  type HumanRole,
  type TeamMember,
} from "@/lib/entities";
import {
  DEFAULT_TEAM_SETTINGS,
  parseTeamSettings,
  type LinkableToken,
  type TeamSettings,
} from "@/lib/team";

const SETTINGS_KEY = "TEAM_SETTINGS_JSON";

const SCHEMA_STATEMENTS = [
  `alter table team_members alter column client_id drop not null`,
  `alter table team_members drop constraint if exists team_members_role_check`,
  `alter table team_members add constraint team_members_role_check check (role in (
      'CHANNEL_MANAGER','SHORT_FORM_EDITOR','LONG_FORM_EDITOR','THUMBNAIL_DESIGNER','AUTOMATION'))`,
  `alter table team_members add column if not exists is_automation boolean not null default false`,
  `alter table team_members add column if not exists automation_kind text`,
  `alter table team_members add column if not exists bot_label text`,
  `alter table team_members add column if not exists bot_role_key text`,
  `alter table team_members add column if not exists mcp_token_id text`,
  `alter table team_members add column if not exists mcp_token_label text`,
  `alter table team_members add column if not exists runtime_hint text`,
  `alter table team_members add column if not exists is_active boolean not null default true`,
  `alter table team_members add column if not exists notes text`,
  `alter table team_members add column if not exists assigned_client_ids text`,
  `alter table team_members drop constraint if exists team_members_bot_role_key_check`,
  `alter table team_members add constraint team_members_bot_role_key_check check (
      bot_role_key is null or bot_role_key in (
        'CLIPPY_OPS','PUBLISH_DESK','CLIENT_SUCCESS','ENG_BOT','LEARNING_BOT','REVENUE_OPS','CUSTOM'))`,
];

let schemaReady: Promise<void> | null = null;

export async function ensureTeamSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    for (const statement of SCHEMA_STATEMENTS) {
      try {
        await sql.query(statement);
      } catch {
        /* already applied */
      }
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function nowIso() {
  return new Date().toISOString();
}
function newId() {
  return crypto.randomUUID();
}

export async function readTeamSettings(): Promise<TeamSettings> {
  const raw = await readAppSetting(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_TEAM_SETTINGS };
  try {
    return parseTeamSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_TEAM_SETTINGS };
  }
}

export async function writeTeamSettings(patch: Partial<TeamSettings>): Promise<TeamSettings> {
  const current = await readTeamSettings();
  const next: TeamSettings = {
    showAiTeammates: patch.showAiTeammates ?? current.showAiTeammates,
    includeAutomationCostInMargin:
      patch.includeAutomationCostInMargin ?? current.includeAutomationCostInMargin,
    grokBotRosterNotes:
      typeof patch.grokBotRosterNotes === "string"
        ? patch.grokBotRosterNotes.slice(0, 4000)
        : current.grokBotRosterNotes,
  };
  await writeAppSetting(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function readTeamMembersInternal(): Promise<TeamMember[]> {
  await ensureTeamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("team_members").select("*").is("deleted_at", null);
    if (!error) return (data ?? []).map((row) => mapTeamMember(row as Record<string, unknown>));
    if (!isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from team_members where deleted_at is null",
    );
    return rows.map(mapTeamMember);
  } catch {
    return [];
  }
}

export async function listLinkableTokens(): Promise<LinkableToken[]> {
  const [mcp, hermes] = await Promise.all([
    listRemoteMcpTokens().catch(() => []),
    listApiKeyRows().catch(() => []),
  ]);
  const mcpRows: LinkableToken[] = mcp.map((row) => ({
    id: row.id,
    label: row.label,
    last4: row.last4,
    revokedAt: row.revokedAt,
    source: "mcp",
  }));
  const hermesRows: LinkableToken[] = hermes.map((row) => ({
    id: row.id,
    label: row.name,
    last4: row.last4,
    revokedAt: row.revokedAt,
    source: "hermes",
  }));
  return [...mcpRows, ...hermesRows];
}

function asKind(value: unknown): AutomationKind {
  return AUTOMATION_KINDS.includes(value as AutomationKind) ? (value as AutomationKind) : "OTHER";
}
function asRoleKey(value: unknown): BotRoleKey {
  return BOT_ROLE_KEYS.includes(value as BotRoleKey) ? (value as BotRoleKey) : "CUSTOM";
}
function asRuntime(value: unknown): AutomationRuntimeHint {
  return AUTOMATION_RUNTIME_HINTS.includes(value as AutomationRuntimeHint)
    ? (value as AutomationRuntimeHint)
    : "AUTO";
}

export type AutomationInput = {
  botLabel?: string;
  automationKind?: AutomationKind | string;
  botRoleKey?: BotRoleKey | string;
  runtimeHint?: AutomationRuntimeHint | string | null;
  mcpTokenId?: string | null;
  cost?: number | string | null;
  notes?: string | null;
  isActive?: boolean;
  assignedClientIds?: string[];
};

async function resolveTokenLabel(id: string | null): Promise<{ id: string; label: string } | null> {
  if (!id) return null;
  const tokens = await listLinkableTokens();
  const hit = tokens.find((row) => row.id === id);
  if (!hit || hit.revokedAt) throw new Error("KEY_MISSING");
  return { id: hit.id, label: hit.label };
}

function toRow(member: TeamMember) {
  return {
    id: member.id,
    client_id: member.clientId,
    role: member.role,
    name: member.name,
    cost: member.cost,
    is_automation: member.isAutomation,
    automation_kind: member.automationKind,
    bot_label: member.botLabel,
    bot_role_key: member.botRoleKey,
    mcp_token_id: member.mcpTokenId,
    mcp_token_label: member.mcpTokenLabel,
    runtime_hint: member.runtimeHint,
    is_active: member.isActive,
    notes: member.notes,
    assigned_client_ids: JSON.stringify(member.assignedClientIds),
    created_at: member.createdAt,
    updated_at: member.updatedAt,
    created_by: member.createdBy,
    deleted_at: member.deletedAt,
  };
}

async function persist(member: TeamMember, insert: boolean): Promise<TeamMember> {
  await ensureTeamSchema();
  const row = toRow(member);
  const admin = await getAgencyAdmin();
  if (admin) {
    const result = insert
      ? await admin.from("team_members").insert(row)
      : await admin.from("team_members").update(row).eq("id", member.id);
    if (result.error && !isMissingTable(result.error) && !isMissingColumn(result.error)) {
      throw new Error("DATA_UNAVAILABLE");
    }
    if (!result.error) return member;
  }
  const sql = await localSql();
  if (insert) {
    await sql.query(
      `insert into team_members (
          id, client_id, role, name, cost, is_automation, automation_kind, bot_label, bot_role_key,
          mcp_token_id, mcp_token_label, runtime_hint, is_active, notes, assigned_client_ids,
          created_at, updated_at, created_by, deleted_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        row.id, row.client_id, row.role, row.name, row.cost, row.is_automation, row.automation_kind,
        row.bot_label, row.bot_role_key, row.mcp_token_id, row.mcp_token_label, row.runtime_hint,
        row.is_active, row.notes, row.assigned_client_ids, row.created_at, row.updated_at,
        row.created_by, row.deleted_at,
      ],
    );
  } else {
    await sql.query(
      `update team_members set
          client_id=$2, role=$3, name=$4, cost=$5, is_automation=$6, automation_kind=$7, bot_label=$8,
          bot_role_key=$9, mcp_token_id=$10, mcp_token_label=$11, runtime_hint=$12, is_active=$13,
          notes=$14, assigned_client_ids=$15, updated_at=$16, created_by=$17, deleted_at=$18
        where id=$1`,
      [
        row.id, row.client_id, row.role, row.name, row.cost, row.is_automation, row.automation_kind,
        row.bot_label, row.bot_role_key, row.mcp_token_id, row.mcp_token_label, row.runtime_hint,
        row.is_active, row.notes, row.assigned_client_ids, row.updated_at, row.created_by, row.deleted_at,
      ],
    );
  }
  return member;
}

export async function createAutomationSeat(
  input: AutomationInput,
  actorId: string,
): Promise<TeamMember> {
  const stamp = nowIso();
  const botLabel = sanitizeText(input.botLabel ?? "").slice(0, 80);
  if (!botLabel) throw new Error("VALIDATION");
  const token = await resolveTokenLabel(input.mcpTokenId?.trim() || null);
  const assigned = (input.assignedClientIds ?? []).filter(Boolean).slice(0, 40);
  const cost =
    input.cost == null || input.cost === ""
      ? "0"
      : String(Math.max(0, Number(input.cost) || 0));
  const member: TeamMember = {
    id: newId(),
    clientId: null,
    role: "AUTOMATION",
    name: botLabel,
    cost,
    isAutomation: true,
    automationKind: asKind(input.automationKind),
    botLabel,
    botRoleKey: asRoleKey(input.botRoleKey),
    mcpTokenId: token?.id ?? null,
    mcpTokenLabel: token?.label ?? null,
    runtimeHint: asRuntime(input.runtimeHint),
    isActive: input.isActive !== false,
    notes: input.notes ? sanitizeText(input.notes).slice(0, 2000) : null,
    assignedClientIds: assigned,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: actorId,
    deletedAt: null,
  };
  await persist(member, true);
  return member;
}

export async function patchAutomationSeat(
  id: string,
  patch: AutomationInput & { isActive?: boolean },
  actorId: string,
): Promise<TeamMember> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const botLabel = (
    patch.botLabel != null ? sanitizeText(patch.botLabel) : current.botLabel || current.name
  ).slice(0, 80);
  if (!botLabel) throw new Error("VALIDATION");
  const tokenId = patch.mcpTokenId === undefined ? current.mcpTokenId : patch.mcpTokenId?.trim() || null;
  const token =
    patch.mcpTokenId === undefined
      ? current.mcpTokenId
        ? { id: current.mcpTokenId, label: current.mcpTokenLabel ?? current.mcpTokenId }
        : null
      : await resolveTokenLabel(tokenId);
  const assigned =
    patch.assignedClientIds === undefined ? current.assignedClientIds : patch.assignedClientIds.filter(Boolean).slice(0, 40);
  const cost =
    patch.cost === undefined
      ? current.cost
      : patch.cost == null || patch.cost === ""
        ? "0"
        : String(Math.max(0, Number(patch.cost) || 0));
  const next: TeamMember = {
    ...current,
    name: botLabel,
    botLabel,
    cost,
    automationKind: patch.automationKind != null ? asKind(patch.automationKind) : current.automationKind,
    botRoleKey: patch.botRoleKey != null ? asRoleKey(patch.botRoleKey) : current.botRoleKey,
    runtimeHint: patch.runtimeHint !== undefined ? asRuntime(patch.runtimeHint) : current.runtimeHint,
    mcpTokenId: token?.id ?? null,
    mcpTokenLabel: token?.label ?? null,
    isActive: patch.isActive ?? current.isActive,
    notes: patch.notes !== undefined ? (patch.notes ? sanitizeText(patch.notes).slice(0, 2000) : null) : current.notes,
    assignedClientIds: assigned,
    updatedAt: nowIso(),
    createdBy: current.createdBy ?? actorId,
  };
  await persist(next, false);
  return next;
}

export async function setAutomationActive(id: string, isActive: boolean, actorId: string): Promise<TeamMember> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const next = { ...current, isActive, updatedAt: nowIso(), createdBy: current.createdBy ?? actorId };
  await persist(next, false);
  return next;
}

export async function disableAutomationSeat(id: string, actorId: string): Promise<TeamMember> {
  return setAutomationActive(id, false, actorId);
}

export async function removeAutomationSeat(id: string, actorId: string): Promise<void> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const next = { ...current, deletedAt: nowIso(), updatedAt: nowIso(), createdBy: current.createdBy ?? actorId };
  await persist(next, false);
}

export async function linkAutomationToken(
  id: string,
  mcpTokenId: string | null,
  actorId: string,
): Promise<TeamMember> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const token = await resolveTokenLabel(mcpTokenId);
  const next: TeamMember = {
    ...current,
    mcpTokenId: token?.id ?? null,
    mcpTokenLabel: token?.label ?? null,
    updatedAt: nowIso(),
    createdBy: current.createdBy ?? actorId,
  };
  await persist(next, false);
  return next;
}

/** Clear MCP/Hermes links on AI seats when a token is revoked. Seats stay on the roster. */
export async function unlinkAutomationSeatsByTokenId(tokenId: string): Promise<number> {
  const id = tokenId.trim();
  if (!id) return 0;
  const rows = await readTeamMembersInternal();
  const hits = rows.filter((row) => row.isAutomation && row.mcpTokenId === id && !row.deletedAt);
  const stamp = nowIso();
  for (const member of hits) {
    await persist(
      {
        ...member,
        mcpTokenId: null,
        mcpTokenLabel: null,
        updatedAt: stamp,
      },
      false,
    );
  }
  return hits.length;
}

export type HumanInput = {
  name?: string;
  role?: HumanRole | string;
  clientId?: string | null;
  cost?: number | string | null;
  notes?: string | null;
  isActive?: boolean;
};

function asHumanRole(value: unknown): HumanRole {
  return HUMAN_ROLES.includes(value as HumanRole) ? (value as HumanRole) : "CHANNEL_MANAGER";
}

export async function createHumanSeat(input: HumanInput, actorId: string): Promise<TeamMember> {
  const name = sanitizeText(input.name ?? "").slice(0, 80);
  const clientId = input.clientId?.trim() || "";
  if (!name || !clientId) throw new Error("VALIDATION");
  const role = asHumanRole(input.role);
  const stamp = nowIso();
  const cost =
    input.cost == null || input.cost === ""
      ? "0"
      : String(Math.max(0, Number(input.cost) || 0));
  const member: TeamMember = {
    id: newId(),
    clientId,
    role,
    name,
    cost,
    isAutomation: false,
    automationKind: null,
    botLabel: null,
    botRoleKey: null,
    mcpTokenId: null,
    mcpTokenLabel: null,
    runtimeHint: null,
    isActive: input.isActive !== false,
    notes: input.notes ? sanitizeText(input.notes).slice(0, 2000) : null,
    assignedClientIds: [],
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: actorId,
    deletedAt: null,
  };
  await persist(member, true);
  return member;
}

export async function patchHumanSeat(
  id: string,
  patch: HumanInput,
  actorId: string,
): Promise<TeamMember> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && !row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const name = (patch.name != null ? sanitizeText(patch.name) : current.name).slice(0, 80);
  if (!name) throw new Error("VALIDATION");
  const clientId =
    patch.clientId === undefined ? current.clientId : patch.clientId?.trim() || null;
  if (!clientId) throw new Error("VALIDATION");
  const cost =
    patch.cost === undefined
      ? current.cost
      : patch.cost == null || patch.cost === ""
        ? "0"
        : String(Math.max(0, Number(patch.cost) || 0));
  const next: TeamMember = {
    ...current,
    name,
    clientId,
    role: patch.role != null ? asHumanRole(patch.role) : current.role,
    cost,
    isAutomation: false,
    automationKind: null,
    botLabel: null,
    botRoleKey: null,
    mcpTokenId: null,
    mcpTokenLabel: null,
    runtimeHint: null,
    isActive: patch.isActive ?? current.isActive,
    notes:
      patch.notes !== undefined
        ? patch.notes
          ? sanitizeText(patch.notes).slice(0, 2000)
          : null
        : current.notes,
    assignedClientIds: [],
    updatedAt: nowIso(),
    createdBy: current.createdBy ?? actorId,
  };
  await persist(next, false);
  return next;
}

export async function removeHumanSeat(id: string, actorId: string): Promise<void> {
  const rows = await readTeamMembersInternal();
  const current = rows.find((row) => row.id === id && !row.isAutomation);
  if (!current) throw new Error("TEAM_MEMBER_MISSING");
  const next = {
    ...current,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: current.createdBy ?? actorId,
  };
  await persist(next, false);
}
