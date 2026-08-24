/**
 * Linear GraphQL client + issue bridge. Tokens stay in AppSetting.
 * Outages never throw to publish/render callers — queue + retry instead.
 */
import { randomBytes } from "node:crypto";
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { last4 } from "@/lib/server/discord.server";
import { publicAppOrigin } from "@/lib/server/public-origin.server";
import { ensureLinearSchema } from "@/lib/server/linear-schema.server";
import {
  DEFAULT_LINEAR_FLAGS,
  EMPTY_STATE_MAP,
  LINEAR_DEFAULT_MILESTONES,
  LINEAR_KANBAN_COLUMNS,
  guessColumnFromType,
  isLinearColumn,
  isLinearEntityType,
  type LinearEntityType,
  type LinearFlags,
  type LinearIssueView,
  type LinearKanbanColumn,
  type LinearLink,
  type LinearMilestoneOption,
  type LinearProjectOption,
  type LinearPublicStatus,
  type LinearStateMap,
  type LinearTeamOption,
  type LinearWorkflowState,
} from "@/lib/linear";

const API_KEY = "LINEAR_API_KEY";
const OAUTH_ACCESS = "LINEAR_OAUTH_ACCESS_TOKEN";
const OAUTH_REFRESH = "LINEAR_OAUTH_REFRESH_TOKEN";
const CLIENT_ID_KEY = "LINEAR_CLIENT_ID";
const CLIENT_SECRET_KEY = "LINEAR_CLIENT_SECRET";
const CONFIG_KEY = "LINEAR_CONFIG_JSON";
const RATE_KEY = "LINEAR_RATE_JSON";
const PENDING_OAUTH_KEY = "LINEAR_OAUTH_PENDING";
const GRAPHQL = "https://api.linear.app/graphql";
const OAUTH_TOKEN = "https://api.linear.app/oauth/token";
const OAUTH_AUTHORIZE = "https://linear.app/oauth/authorize";
const CREATE_CAP_PER_HOUR = 20;
const MANUAL_BOARD_LABEL = "manual-board";
const GQL_TIMEOUT_MS = 18000;

type LinearConfigBlob = {
  organizationId: string | null;
  organizationName: string | null;
  workspaceSlug: string | null;
  viewerName: string | null;
  teamId: string | null;
  teamName: string | null;
  projectId: string | null;
  projectName: string | null;
  stateMap: LinearStateMap;
  flags: LinearFlags;
  lastTestedAt: string | null;
  lastError: string | null;
  lastOk: boolean | null;
  milestones: LinearMilestoneOption[];
};

type GqlError = { message?: string; extensions?: { code?: string } };

type TokenBundle = {
  access: string;
  kind: "api_key" | "oauth";
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function scrubLinearText(input: string): string {
  return input
    .replace(/lin_api_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/xai-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/dtn_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/ghp_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/whsec_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]+/g, "[redacted]")
    .slice(0, 8000);
}

function emptyConfig(): LinearConfigBlob {
  return {
    organizationId: null,
    organizationName: null,
    workspaceSlug: null,
    viewerName: null,
    teamId: null,
    teamName: null,
    projectId: null,
    projectName: null,
    stateMap: { ...EMPTY_STATE_MAP },
    flags: { ...DEFAULT_LINEAR_FLAGS },
    lastTestedAt: null,
    lastError: null,
    lastOk: null,
    milestones: [],
  };
}

function normalizeFlags(input: unknown): LinearFlags {
  const src = input && typeof input === "object" ? (input as Partial<LinearFlags>) : {};
  return {
    enabled: src.enabled === true,
    syncJobs: src.syncJobs === true,
    autoIssueOnFail: src.autoIssueOnFail !== false,
    autoIssueOnProposal: src.autoIssueOnProposal === true,
    membersCanCreate: src.membersCanCreate === true,
    failColumn: isLinearColumn(src.failColumn) ? src.failColumn : "inProgress",
  };
}

function normalizeStateMap(input: unknown): LinearStateMap {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: LinearStateMap = { ...EMPTY_STATE_MAP };
  for (const col of LINEAR_KANBAN_COLUMNS) {
    const value = src[col];
    out[col] = typeof value === "string" && value.trim() ? value.trim() : null;
  }
  return out;
}

async function readConfig(): Promise<LinearConfigBlob> {
  const raw = await readAppSetting(CONFIG_KEY);
  const parsed = parseJson<Partial<LinearConfigBlob>>(raw, {});
  const base = emptyConfig();
  return {
    ...base,
    ...parsed,
    stateMap: normalizeStateMap(parsed.stateMap),
    flags: normalizeFlags(parsed.flags),
    milestones: Array.isArray(parsed.milestones)
      ? parsed.milestones.filter(
          (row): row is LinearMilestoneOption =>
            Boolean(row && typeof row === "object" && typeof row.id === "string" && typeof row.name === "string"),
        )
      : [],
  };
}

async function writeConfig(next: LinearConfigBlob): Promise<void> {
  await writeAppSetting(CONFIG_KEY, JSON.stringify(next));
}

async function patchConfig(patch: Partial<LinearConfigBlob>): Promise<LinearConfigBlob> {
  const current = await readConfig();
  const next: LinearConfigBlob = {
    ...current,
    ...patch,
    stateMap: patch.stateMap ? normalizeStateMap(patch.stateMap) : current.stateMap,
    flags: patch.flags ? normalizeFlags({ ...current.flags, ...patch.flags }) : current.flags,
    milestones: patch.milestones ?? current.milestones,
  };
  await writeConfig(next);
  return next;
}

async function loadToken(): Promise<TokenBundle | null> {
  const oauth = (await readAppSetting(OAUTH_ACCESS))?.trim();
  if (oauth) return { access: oauth, kind: "oauth" };
  const key = (await readAppSetting(API_KEY))?.trim();
  if (key) return { access: key, kind: "api_key" };
  return null;
}

function authHeader(token: TokenBundle): string {
  if (token.kind === "oauth") return `Bearer ${token.access}`;
  if (token.access.startsWith("lin_api_")) return token.access;
  return `Bearer ${token.access}`;
}

async function refreshOauth(): Promise<TokenBundle | null> {
  const refresh = (await readAppSetting(OAUTH_REFRESH))?.trim();
  const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
  const clientSecret = (await readAppSetting(CLIENT_SECRET_KEY))?.trim();
  if (!refresh || !clientId || !clientSecret) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string; refresh_token?: string };
  if (!json.access_token) return null;
  await writeAppSetting(OAUTH_ACCESS, json.access_token);
  if (json.refresh_token) await writeAppSetting(OAUTH_REFRESH, json.refresh_token);
  return { access: json.access_token, kind: "oauth" };
}

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  attempt = 0,
): Promise<T> {
  const token = await loadToken();
  if (!token) throw new Error("LINEAR_NOT_CONFIGURED");
  const response = await fetch(GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: authHeader(token),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(GQL_TIMEOUT_MS),
  });
  if (response.status === 401 && attempt === 0 && token.kind === "oauth") {
    const refreshed = await refreshOauth();
    if (refreshed) return gql<T>(query, variables, 1);
    throw new Error("LINEAR_UNAUTHORIZED");
  }
  if (response.status === 401) throw new Error("LINEAR_UNAUTHORIZED");
  if (response.status === 429) {
    if (attempt >= 3) throw new Error("LINEAR_RATE_LIMIT");
    const retryAfter = Number(response.headers.get("retry-after") ?? "") || 1 + attempt * 2;
    await new Promise((resolve) => setTimeout(resolve, Math.min(8000, retryAfter * 1000)));
    return gql<T>(query, variables, attempt + 1);
  }
  if (response.status >= 500 && attempt < 2) {
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    return gql<T>(query, variables, attempt + 1);
  }
  if (!response.ok) throw new Error("LINEAR_UNAVAILABLE");
  const json = (await response.json()) as { data?: T; errors?: GqlError[] };
  if (json.errors?.length) {
    const code = json.errors[0]?.extensions?.code ?? "";
    const message = json.errors[0]?.message ?? "LINEAR_UNAVAILABLE";
    if (/ratelimit|rate limit/i.test(code + message)) throw new Error("LINEAR_RATE_LIMIT");
    if (/unauth|forbidden/i.test(code + message)) throw new Error("LINEAR_UNAUTHORIZED");
    throw new Error("LINEAR_UNAVAILABLE");
  }
  if (!json.data) throw new Error("LINEAR_UNAVAILABLE");
  return json.data;
}

async function consumeCreateBudget(): Promise<void> {
  const raw = await readAppSetting(RATE_KEY);
  const now = Date.now();
  const parsed = parseJson<{ windowStart?: number; count?: number }>(raw, {});
  const windowStart = typeof parsed.windowStart === "number" ? parsed.windowStart : now;
  const count = typeof parsed.count === "number" ? parsed.count : 0;
  if (now - windowStart >= 60 * 60 * 1000) {
    await writeAppSetting(RATE_KEY, JSON.stringify({ windowStart: now, count: 1 }));
    return;
  }
  if (count >= CREATE_CAP_PER_HOUR) throw new Error("LINEAR_RATE_LIMIT");
  await writeAppSetting(RATE_KEY, JSON.stringify({ windowStart, count: count + 1 }));
}

function callbackUrl(): string {
  return `${publicAppOrigin()}/api/oauth/linear`;
}

export function linearCallbackUrl(): string {
  return callbackUrl();
}

export async function publicLinearStatus(): Promise<LinearPublicStatus> {
  const [token, config, clientId] = await Promise.all([
    loadToken(),
    readConfig(),
    readAppSetting(CLIENT_ID_KEY),
  ]);
  const configured = Boolean(token);
  let health: LinearPublicStatus["health"] = "not_configured";
  if (!configured) health = "not_configured";
  else if (config.lastOk === false) health = "error";
  else if (config.lastOk === true && config.teamId) health = "connected";
  else health = "saved";
  const stateNames: Partial<Record<LinearKanbanColumn, string>> = {};
  return {
    configured,
    health,
    last4: last4(token?.access ?? null),
    oauthConfigured: Boolean(clientId?.trim()),
    viewerName: config.viewerName,
    organizationId: config.organizationId,
    organizationName: config.organizationName,
    workspaceSlug: config.workspaceSlug,
    teamId: config.teamId,
    teamName: config.teamName,
    projectId: config.projectId,
    projectName: config.projectName,
    stateMap: config.stateMap,
    stateNames,
    flags: config.flags,
    teams: [],
    projects: [],
    states: [],
    milestones: config.milestones,
    lastTestedAt: config.lastTestedAt,
    lastError: config.lastError,
    callbackUrl: callbackUrl(),
  };
}

const VIEWER_QUERY = `query Viewer {
  viewer {
    id name displayName email
    organization { id name urlKey }
  }
  teams { nodes { id name key } }
}`;

const TEAM_QUERY = `query TeamDetail($id: String!) {
  team(id: $id) {
    id name key
    states { nodes { id name type position } }
    projects { nodes { id name } }
  }
}`;

const PROJECT_MS_QUERY = `query ProjectMilestones($id: String!) {
  project(id: $id) {
    id name
    projectMilestones { nodes { id name } }
  }
}`;

type ViewerPayload = {
  viewer: {
    id: string;
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    organization?: { id: string; name: string; urlKey?: string | null } | null;
  } | null;
  teams: { nodes: LinearTeamOption[] } | null;
};

type TeamPayload = {
  team: {
    id: string;
    name: string;
    key: string;
    states: { nodes: Array<{ id: string; name: string; type: string; position?: number | null }> } | null;
    projects: { nodes: LinearProjectOption[] } | null;
  } | null;
};

function mapStates(nodes: Array<{ id: string; name: string; type: string; position?: number | null }>): LinearWorkflowState[] {
  return nodes
    .map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      position: typeof row.position === "number" ? row.position : 0,
    }))
    .sort((a, b) => a.position - b.position);
}

function autoMapStates(states: LinearWorkflowState[]): LinearStateMap {
  const map: LinearStateMap = { ...EMPTY_STATE_MAP };
  for (const state of states) {
    const col = guessColumnFromType(state.type, state.name);
    if (col && !map[col]) map[col] = state.id;
  }
  return map;
}

export async function persistLinearApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (trimmed.length < 12) throw new Error("KEY_TOO_SHORT");
  await writeAppSetting(API_KEY, trimmed);
  await patchConfig({ lastError: null });
}

export async function persistLinearOauthApp(input: { clientId: string; clientSecret: string }): Promise<void> {
  if (input.clientId.trim().length < 8 || input.clientSecret.trim().length < 8) {
    throw new Error("KEY_TOO_SHORT");
  }
  await writeAppSetting(CLIENT_ID_KEY, input.clientId.trim());
  await writeAppSetting(CLIENT_SECRET_KEY, input.clientSecret.trim());
}

export async function disconnectLinear(): Promise<void> {
  await Promise.all([
    deleteAppSetting(API_KEY),
    deleteAppSetting(OAUTH_ACCESS),
    deleteAppSetting(OAUTH_REFRESH),
    deleteAppSetting(PENDING_OAUTH_KEY),
    deleteAppSetting(RATE_KEY),
  ]);
  await writeConfig(emptyConfig());
}

export async function testLinearConnection(): Promise<LinearPublicStatus> {
  const data = await gql<ViewerPayload>(VIEWER_QUERY);
  const viewerName = data.viewer?.displayName || data.viewer?.name || data.viewer?.email || "Linear user";
  const org = data.viewer?.organization ?? null;
  const teams = data.teams?.nodes ?? [];
  const current = await readConfig();
  let projects: LinearProjectOption[] = [];
  let states: LinearWorkflowState[] = [];
  let teamName = current.teamName;
  let stateMap = current.stateMap;
  const teamId = current.teamId && teams.some((row) => row.id === current.teamId) ? current.teamId : teams[0]?.id ?? null;
  if (teamId) {
    const team = await gql<TeamPayload>(TEAM_QUERY, { id: teamId });
    teamName = team.team?.name ?? teamName;
    projects = team.team?.projects?.nodes ?? [];
    states = mapStates(team.team?.states?.nodes ?? []);
    const mapped = autoMapStates(states);
    stateMap = {
      backlog: current.stateMap.backlog ?? mapped.backlog,
      ready: current.stateMap.ready ?? mapped.ready,
      inProgress: current.stateMap.inProgress ?? mapped.inProgress,
      inReview: current.stateMap.inReview ?? mapped.inReview,
      done: current.stateMap.done ?? mapped.done,
    };
  }
  const projectId =
    current.projectId && projects.some((row) => row.id === current.projectId)
      ? current.projectId
      : projects.find((row) => /clipping|ai clipping/i.test(row.name))?.id ??
        projects[0]?.id ??
        current.projectId;
  const projectName = projects.find((row) => row.id === projectId)?.name ?? current.projectName;
  let milestones = current.milestones;
  if (projectId) {
    try {
      const ms = await gql<{
        project: { projectMilestones?: { nodes: LinearMilestoneOption[] } | null } | null;
      }>(PROJECT_MS_QUERY, { id: projectId });
      milestones = ms.project?.projectMilestones?.nodes ?? [];
    } catch {
      /* optional */
    }
  }
  await patchConfig({
    viewerName,
    organizationId: org?.id ?? null,
    organizationName: org?.name ?? null,
    workspaceSlug: org?.urlKey ?? null,
    teamId,
    teamName: teamId ? (teams.find((row) => row.id === teamId)?.name ?? teamName) : teamName,
    projectId: projectId ?? null,
    projectName: projectName ?? null,
    stateMap,
    lastTestedAt: nowIso(),
    lastError: null,
    lastOk: true,
    milestones,
    flags: { ...current.flags, enabled: current.flags.enabled || Boolean(teamId) },
  });
  const status = await publicLinearStatus();
  status.teams = teams;
  status.projects = projects;
  status.states = states;
  const names: Partial<Record<LinearKanbanColumn, string>> = {};
  for (const col of LINEAR_KANBAN_COLUMNS) {
    const id = status.stateMap[col];
    const match = states.find((row) => row.id === id);
    if (match) names[col] = match.name;
  }
  status.stateNames = names;
  return status;
}

export async function loadLinearCatalog(teamId?: string | null): Promise<{
  teams: LinearTeamOption[];
  projects: LinearProjectOption[];
  states: LinearWorkflowState[];
}> {
  const data = await gql<ViewerPayload>(VIEWER_QUERY);
  const teams = data.teams?.nodes ?? [];
  const config = await readConfig();
  const id = teamId || config.teamId || teams[0]?.id || null;
  if (!id) return { teams, projects: [], states: [] };
  const team = await gql<TeamPayload>(TEAM_QUERY, { id });
  return {
    teams,
    projects: team.team?.projects?.nodes ?? [],
    states: mapStates(team.team?.states?.nodes ?? []),
  };
}

export async function saveLinearBinding(input: {
  teamId?: string | null;
  projectId?: string | null;
  stateMap?: Partial<LinearStateMap>;
  flags?: Partial<LinearFlags>;
}): Promise<LinearPublicStatus> {
  const current = await readConfig();
  let teamName = current.teamName;
  let projectName = current.projectName;
  let states: LinearWorkflowState[] = [];
  let projects: LinearProjectOption[] = [];
  if (input.teamId) {
    try {
      const team = await gql<TeamPayload>(TEAM_QUERY, { id: input.teamId });
      teamName = team.team?.name ?? teamName;
      projects = team.team?.projects?.nodes ?? [];
      states = mapStates(team.team?.states?.nodes ?? []);
    } catch {
      /* keep names */
    }
  }
  const projectId = input.projectId === undefined ? current.projectId : input.projectId;
  if (projectId && projects.length) {
    projectName = projects.find((row) => row.id === projectId)?.name ?? projectName;
  }
  const nextMap = normalizeStateMap({ ...current.stateMap, ...input.stateMap });
  if (states.length) {
    const auto = autoMapStates(states);
    for (const col of LINEAR_KANBAN_COLUMNS) {
      if (!nextMap[col]) nextMap[col] = auto[col];
    }
  }
  await patchConfig({
    teamId: input.teamId === undefined ? current.teamId : input.teamId,
    teamName,
    projectId,
    projectName,
    stateMap: nextMap,
    flags: input.flags ? { ...current.flags, ...input.flags } : current.flags,
  });
  const status = await publicLinearStatus();
  if (states.length) {
    status.states = states;
    status.projects = projects;
    const names: Partial<Record<LinearKanbanColumn, string>> = {};
    for (const col of LINEAR_KANBAN_COLUMNS) {
      const id = status.stateMap[col];
      const match = states.find((row) => row.id === id);
      if (match) names[col] = match.name;
    }
    status.stateNames = names;
  }
  return status;
}

export async function startLinearOAuth(userId: string): Promise<{ url: string }> {
  const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
  if (!clientId) throw new Error("LINEAR_OAUTH_APP_MISSING");
  const state = randomBytes(16).toString("hex");
  await writeAppSetting(
    PENDING_OAUTH_KEY,
    JSON.stringify({ state, userId, createdAt: nowIso() }),
  );
  const url = new URL(OAUTH_AUTHORIZE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read,write,issues:create,comments:create");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return { url: url.toString() };
}

export async function completeLinearOAuth(input: { code: string; state: string }): Promise<void> {
  const pending = parseJson<{ state?: string; userId?: string; createdAt?: string }>(
    await readAppSetting(PENDING_OAUTH_KEY),
    {},
  );
  if (!pending.state || pending.state !== input.state) throw new Error("OAUTH_STATE");
  const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
  const clientSecret = (await readAppSetting(CLIENT_SECRET_KEY))?.trim();
  if (!clientId || !clientSecret) throw new Error("LINEAR_OAUTH_APP_MISSING");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: callbackUrl(),
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("OAUTH_EXCHANGE");
  const json = (await response.json()) as { access_token?: string; refresh_token?: string };
  if (!json.access_token) throw new Error("OAUTH_EXCHANGE");
  await writeAppSetting(OAUTH_ACCESS, json.access_token);
  if (json.refresh_token) await writeAppSetting(OAUTH_REFRESH, json.refresh_token);
  await deleteAppSetting(PENDING_OAUTH_KEY);
  await testLinearConnection().catch(() => {});
}

function mapLink(row: Record<string, unknown>): LinearLink {
  return {
    id: String(row.id ?? ""),
    agencyEntityType: isLinearEntityType(row.agency_entity_type) ? row.agency_entity_type : "SocialUploadJob",
    agencyEntityId: String(row.agency_entity_id ?? ""),
    linearIssueId: String(row.linear_issue_id ?? ""),
    linearIdentifier: row.linear_identifier == null ? null : String(row.linear_identifier),
    linearUrl: row.linear_url == null ? null : String(row.linear_url),
    lastStateId: row.last_state_id == null ? null : String(row.last_state_id),
    lastSyncedAt: row.last_synced_at == null ? null : String(row.last_synced_at),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function findLinearLink(
  entityType: LinearEntityType,
  entityId: string,
): Promise<LinearLink | null> {
  await ensureLinearSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("linear_links")
      .select("*")
      .eq("agency_entity_type", entityType)
      .eq("agency_entity_id", entityId)
      .maybeSingle();
    if (!error && data) return mapLink(data as Record<string, unknown>);
    if (error && !isMissingTable(error)) return null;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from linear_links where agency_entity_type = $1 and agency_entity_id = $2 limit 1",
      [entityType, entityId],
    );
    return rows[0] ? mapLink(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listLinearLinks(ids?: { type: LinearEntityType; id: string }[]): Promise<LinearLink[]> {
  await ensureLinearSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const q = admin.from("linear_links").select("*").order("created_at", { ascending: false }).limit(200);
    const { data, error } = await q;
    if (!error && data) {
      const rows = (data as Record<string, unknown>[]).map(mapLink);
      if (!ids?.length) return rows;
      const set = new Set(ids.map((row) => `${row.type}:${row.id}`));
      return rows.filter((row) => set.has(`${row.agencyEntityType}:${row.agencyEntityId}`));
    }
    if (error && !isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from linear_links order by created_at desc limit 200",
    );
    const mapped = rows.map(mapLink);
    if (!ids?.length) return mapped;
    const set = new Set(ids.map((row) => `${row.type}:${row.id}`));
    return mapped.filter((row) => set.has(`${row.agencyEntityType}:${row.agencyEntityId}`));
  } catch {
    return [];
  }
}

async function upsertLink(row: {
  entityType: LinearEntityType;
  entityId: string;
  issueId: string;
  identifier: string | null;
  url: string | null;
  stateId: string | null;
  actorId?: string | null;
}): Promise<LinearLink> {
  await ensureLinearSchema();
  const existing = await findLinearLink(row.entityType, row.entityId);
  const id = existing?.id ?? newId();
  const stamp = nowIso();
  const payload = {
    id,
    workspace_id: "default",
    agency_entity_type: row.entityType,
    agency_entity_id: row.entityId,
    linear_issue_id: row.issueId,
    linear_identifier: row.identifier,
    linear_url: row.url,
    last_state_id: row.stateId,
    last_synced_at: stamp,
    created_at: existing?.createdAt ?? stamp,
    created_by: row.actorId ?? null,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("linear_links").upsert(payload, { onConflict: "agency_entity_type,agency_entity_id" });
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into linear_links (
         id, workspace_id, agency_entity_type, agency_entity_id, linear_issue_id,
         linear_identifier, linear_url, last_state_id, last_synced_at, created_at, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (agency_entity_type, agency_entity_id) do update set
         linear_issue_id = excluded.linear_issue_id,
         linear_identifier = excluded.linear_identifier,
         linear_url = excluded.linear_url,
         last_state_id = excluded.last_state_id,
         last_synced_at = excluded.last_synced_at`,
      [
        payload.id,
        payload.workspace_id,
        payload.agency_entity_type,
        payload.agency_entity_id,
        payload.linear_issue_id,
        payload.linear_identifier,
        payload.linear_url,
        payload.last_state_id,
        payload.last_synced_at,
        payload.created_at,
        payload.created_by,
      ],
    );
  } catch {
    /* local optional */
  }
  return mapLink(payload);
}

const LABEL_QUERY = `query TeamLabels($teamId: ID) {
  issueLabels(filter: { team: { id: { eq: $teamId } } }, first: 100) {
    nodes { id name }
  }
}`;

const LABEL_CREATE = `mutation LabelCreate($input: IssueLabelCreateInput!) {
  issueLabelCreate(input: $input) { issueLabel { id name } }
}`;

async function ensureLabelIds(teamId: string, names: string[]): Promise<string[]> {
  const wanted = [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];
  if (!wanted.length) return [];
  let nodes: Array<{ id: string; name: string }> = [];
  try {
    const data = await gql<{ issueLabels: { nodes: Array<{ id: string; name: string }> } }>(LABEL_QUERY, {
      teamId,
    });
    nodes = data.issueLabels?.nodes ?? [];
  } catch {
    nodes = [];
  }
  const ids: string[] = [];
  for (const name of wanted) {
    const existing = nodes.find((row) => row.name.toLowerCase() === name);
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    try {
      const created = await gql<{
        issueLabelCreate: { issueLabel: { id: string; name: string } | null };
      }>(LABEL_CREATE, { input: { name, teamId } });
      const id = created.issueLabelCreate?.issueLabel?.id;
      if (id) ids.push(id);
    } catch {
      /* label create is best-effort */
    }
  }
  return ids;
}

const ISSUE_CREATE = `mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id identifier url title
      state { id name }
      labels { nodes { id name } }
    }
  }
}`;

const ISSUE_UPDATE = `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue {
      id identifier url title
      state { id name }
      labels { nodes { id name } }
    }
  }
}`;

const COMMENT_CREATE = `mutation CommentCreate($input: CommentCreateInput!) {
  commentCreate(input: $input) { success comment { id } }
}`;

const ISSUE_GET = `query IssueGet($id: String!) {
  issue(id: $id) {
    id identifier url title
    state { id name type }
    labels { nodes { id name } }
  }
}`;

const ISSUES_SEARCH = `query FindIssues($teamId: ID!, $term: String) {
  issues(
    filter: {
      team: { id: { eq: $teamId } }
      title: { containsIgnoreCase: $term }
    }
    first: 10
  ) {
    nodes { id identifier url title state { name } }
  }
}`;

type LinearIssueNode = {
  id: string;
  identifier: string;
  url: string;
  title: string;
  state?: { id?: string; name?: string } | null;
  labels?: { nodes?: Array<{ id: string; name: string }> } | null;
};

function toIssueView(node: LinearIssueNode): LinearIssueView {
  return {
    id: node.id,
    identifier: node.identifier,
    url: node.url,
    title: node.title,
    stateName: node.state?.name ?? null,
  };
}

function hasManualBoard(node: LinearIssueNode | null | undefined): boolean {
  return Boolean(node?.labels?.nodes?.some((row) => row.name.toLowerCase() === MANUAL_BOARD_LABEL));
}

function agencyDeepLink(entityType: LinearEntityType, entityId: string): string {
  const origin = publicAppOrigin();
  switch (entityType) {
    case "SocialUploadJob":
      return `${origin}/social`;
    case "RenderJob":
      return `${origin}/library`;
    case "AgentRun":
      return `${origin}/agent`;
    case "KnowledgeProposal":
      return `${origin}/settings#ai-training`;
    case "ApprovalRequest":
      return `${origin}/approvals`;
    case "Milestone":
      return `${origin}/settings#linear`;
    default:
      return origin;
  }
}

function stateIdFor(config: LinearConfigBlob, column: LinearKanbanColumn): string | undefined {
  return config.stateMap[column] ?? undefined;
}

export type CreateLinearIssueInput = {
  title: string;
  description?: string | null;
  state?: LinearKanbanColumn | string | null;
  labels?: string[];
  priority?: number | null;
  projectId?: string | null;
  linkTo?: { type: LinearEntityType; id: string } | null;
  actorId?: string | null;
};

export async function createLinearIssue(input: CreateLinearIssueInput): Promise<{
  issue: LinearIssueView;
  link: LinearLink | null;
  skipped?: string;
}> {
  const config = await readConfig();
  if (!config.flags.enabled) {
    await auditLinear("linear.issue.skipped", "Linear is disabled", {
      reason: "LINEAR_ENABLED false",
      title: input.title.slice(0, 80),
    });
    return { issue: { id: "", identifier: "", url: "", title: input.title, stateName: null }, link: null, skipped: "disabled" };
  }
  const token = await loadToken();
  if (!token) throw new Error("LINEAR_NOT_CONFIGURED");
  if (!config.teamId) throw new Error("LINEAR_TEAM_REQUIRED");
  await consumeCreateBudget();
  const column = isLinearColumn(input.state) ? input.state : "backlog";
  const labelIds = await ensureLabelIds(config.teamId, input.labels ?? []);
  const description = scrubLinearText(
    [input.description ?? "", input.linkTo ? `\n\nAgency: ${agencyDeepLink(input.linkTo.type, input.linkTo.id)}` : ""]
      .join("")
      .trim(),
  );
  const created = await gql<{ issueCreate: { success: boolean; issue: LinearIssueNode | null } }>(ISSUE_CREATE, {
    input: {
      title: scrubLinearText(input.title).slice(0, 250),
      description: description || undefined,
      teamId: config.teamId,
      projectId: input.projectId || config.projectId || undefined,
      stateId: stateIdFor(config, column),
      labelIds: labelIds.length ? labelIds : undefined,
      priority: typeof input.priority === "number" ? Math.min(4, Math.max(0, input.priority)) : undefined,
    },
  });
  const issue = created.issueCreate?.issue;
  if (!issue) throw new Error("LINEAR_UNAVAILABLE");
  let link: LinearLink | null = null;
  if (input.linkTo) {
    link = await upsertLink({
      entityType: input.linkTo.type,
      entityId: input.linkTo.id,
      issueId: issue.id,
      identifier: issue.identifier,
      url: issue.url,
      stateId: issue.state?.id ?? null,
      actorId: input.actorId,
    });
  }
  await auditLinear("linear.issue.created", `Created ${issue.identifier}`, {
    issueId: issue.id,
    identifier: issue.identifier,
    entityType: input.linkTo?.type ?? null,
    entityId: input.linkTo?.id ?? null,
  });
  try {
    const { notifyAdmins } = await import("@/lib/server/notifications.server");
    await notifyAdmins({
      extraUserIds: input.actorId ? [input.actorId] : [],
      category: "SYSTEM",
      severity: "INFO",
      title: `Issue created in Linear · ${issue.identifier}`,
      body: issue.title,
      href: issue.url,
      entityType: input.linkTo?.type ?? "linear_issue",
      entityId: input.linkTo?.id ?? issue.id,
    });
  } catch {
    /* */
  }
  try {
    const { emitAutonomyEvent } = await import("@/lib/server/autonomy-events.server");
    await emitAutonomyEvent({
      type: "linear.issue.created",
      entityType: "linear_issue",
      entityId: issue.id,
      data: { identifier: issue.identifier, url: issue.url },
    });
  } catch {
    /* */
  }
  return { issue: toIssueView(issue), link };
}

export async function updateLinearIssue(input: {
  issueId?: string;
  linkTo?: { type: LinearEntityType; id: string } | null;
  state?: LinearKanbanColumn | string | null;
  labels?: string[];
  comment?: string | null;
  actorId?: string | null;
}): Promise<{ issue: LinearIssueView | null; skipped?: string }> {
  const config = await readConfig();
  if (!config.flags.enabled) return { issue: null, skipped: "disabled" };
  let issueId = input.issueId ?? "";
  if (!issueId && input.linkTo) {
    const link = await findLinearLink(input.linkTo.type, input.linkTo.id);
    issueId = link?.linearIssueId ?? "";
  }
  if (!issueId) throw new Error("LINEAR_ISSUE_MISSING");
  let current: LinearIssueNode | null = null;
  try {
    const got = await gql<{ issue: LinearIssueNode | null }>(ISSUE_GET, { id: issueId });
    current = got.issue;
  } catch {
    current = null;
  }
  if (hasManualBoard(current)) return { issue: current ? toIssueView(current) : null, skipped: "manual-board" };
  const patch: Record<string, unknown> = {};
  if (input.state && isLinearColumn(input.state)) {
    const stateId = stateIdFor(config, input.state);
    if (stateId) patch.stateId = stateId;
  }
  if (input.labels?.length && config.teamId) {
    patch.labelIds = await ensureLabelIds(config.teamId, input.labels);
  }
  let node = current;
  if (Object.keys(patch).length) {
    const updated = await gql<{ issueUpdate: { issue: LinearIssueNode | null } }>(ISSUE_UPDATE, {
      id: issueId,
      input: patch,
    });
    node = updated.issueUpdate?.issue ?? node;
  }
  if (input.comment?.trim()) {
    await gql(COMMENT_CREATE, {
      input: { issueId, body: scrubLinearText(input.comment.trim()) },
    }).catch(() => null);
  }
  if (input.linkTo && node) {
    await upsertLink({
      entityType: input.linkTo.type,
      entityId: input.linkTo.id,
      issueId: node.id,
      identifier: node.identifier,
      url: node.url,
      stateId: node.state?.id ?? null,
      actorId: input.actorId,
    });
  }
  await auditLinear("linear.issue.updated", `Updated ${node?.identifier ?? issueId}`, {
    issueId,
    identifier: node?.identifier ?? null,
    state: input.state ?? null,
  });
  return { issue: node ? toIssueView(node) : null };
}

export async function findLinearIssues(term: string): Promise<LinearIssueView[]> {
  const config = await readConfig();
  if (!config.teamId) throw new Error("LINEAR_TEAM_REQUIRED");
  const data = await gql<{ issues: { nodes: LinearIssueNode[] } }>(ISSUES_SEARCH, {
    teamId: config.teamId,
    term: term.trim().slice(0, 80) || undefined,
  });
  return (data.issues?.nodes ?? []).map(toIssueView);
}

export async function attachExistingIssue(input: {
  entityType: LinearEntityType;
  entityId: string;
  issueId: string;
  actorId?: string | null;
}): Promise<LinearLink> {
  const got = await gql<{ issue: LinearIssueNode | null }>(ISSUE_GET, { id: input.issueId });
  const issue = got.issue;
  if (!issue) throw new Error("LINEAR_ISSUE_MISSING");
  return upsertLink({
    entityType: input.entityType,
    entityId: input.entityId,
    issueId: issue.id,
    identifier: issue.identifier,
    url: issue.url,
    stateId: issue.state?.id ?? null,
    actorId: input.actorId,
  });
}

async function auditLinear(
  action: string,
  summary: string,
  metadata: Record<string, unknown>,
  actorId?: string | null,
): Promise<void> {
  try {
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    await writeAuditEvent({
      actorUserId: actorId ?? null,
      actorType: actorId?.startsWith("agent:") ? "HERMES" : actorId ? "USER" : "SYSTEM",
      action,
      entityType: typeof metadata.entityType === "string" ? metadata.entityType : "linear",
      entityId: typeof metadata.entityId === "string" ? String(metadata.entityId) : null,
      summary,
      metadata,
    });
  } catch {
    /* never block */
  }
}

async function enqueueSync(kind: string, payload: Record<string, unknown>): Promise<void> {
  await ensureLinearSchema();
  const id = newId();
  const stamp = nowIso();
  const row = {
    id,
    kind,
    payload: JSON.stringify(payload),
    attempts: 0,
    next_attempt_at: stamp,
    last_error: null,
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("linear_sync_queue").insert(row).then(
      () => {},
      () => {},
    );
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into linear_sync_queue (id, kind, payload, attempts, next_attempt_at, last_error, created_at)
       values ($1,$2,$3,0,$4,null,$4)`,
      [id, kind, row.payload, stamp],
    );
  } catch {
    /* */
  }
  scheduleSweep();
}

let sweepTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSweep(): void {
  if (sweepTimer) return;
  sweepTimer = setTimeout(() => {
    sweepTimer = null;
    void sweepLinearQueue(8).catch(() => {});
  }, 250);
}

async function dueQueueRows(limit: number): Promise<Array<Record<string, unknown>>> {
  await ensureLinearSchema();
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("linear_sync_queue")
      .select("*")
      .lte("next_attempt_at", stamp)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (!error && data) return data as Record<string, unknown>[];
  }
  try {
    const sql = await localSql();
    return await sql.query<Record<string, unknown>>(
      "select * from linear_sync_queue where next_attempt_at <= $1 order by created_at asc limit $2",
      [stamp, limit],
    );
  } catch {
    return [];
  }
}

async function deleteQueueRow(id: string): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) await admin.from("linear_sync_queue").delete().eq("id", id);
  try {
    const sql = await localSql();
    await sql.query("delete from linear_sync_queue where id = $1", [id]);
  } catch {
    /* */
  }
}

async function bumpQueueRow(id: string, attempts: number, error: string): Promise<void> {
  const delay = Math.min(15 * 60 * 1000, 4000 * 2 ** Math.min(attempts, 6));
  const next = new Date(Date.now() + delay).toISOString();
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin
      .from("linear_sync_queue")
      .update({ attempts, next_attempt_at: next, last_error: error.slice(0, 180) })
      .eq("id", id);
  }
  try {
    const sql = await localSql();
    await sql.query(
      "update linear_sync_queue set attempts = $2, next_attempt_at = $3, last_error = $4 where id = $1",
      [id, attempts, next, error.slice(0, 180)],
    );
  } catch {
    /* */
  }
}

export type LinearSyncQueueRow = {
  id: string;
  kind: string;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
};

function mapSyncQueue(rec: Record<string, unknown>): LinearSyncQueueRow {
  return {
    id: String(rec.id ?? ""),
    kind: String(rec.kind ?? "sync"),
    attempts: Number(rec.attempts ?? 0) || 0,
    nextAttemptAt: String(rec.next_attempt_at ?? rec.created_at ?? nowIso()),
    lastError: rec.last_error ? String(rec.last_error) : null,
    createdAt: String(rec.created_at ?? nowIso()),
  };
}

export async function listLinearSyncQueue(limit = 40): Promise<LinearSyncQueueRow[]> {
  await ensureLinearSchema();
  const cap = Math.min(Math.max(limit, 1), 80);
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("linear_sync_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(cap);
    if (!error && data) return (data as Record<string, unknown>[]).map(mapSyncQueue);
    if (error && !isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from linear_sync_queue order by created_at desc limit $1",
      [cap],
    );
    return rows.map(mapSyncQueue);
  } catch {
    return [];
  }
}

export async function retryLinearSync(id: string): Promise<LinearSyncQueueRow> {
  const rows = await listLinearSyncQueue(80);
  const hit = rows.find((row) => row.id === id);
  if (!hit) throw new Error("JOB_MISSING");
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin
      .from("linear_sync_queue")
      .update({ attempts: 0, next_attempt_at: stamp, last_error: null })
      .eq("id", id);
  }
  try {
    const sql = await localSql();
    await sql.query(
      "update linear_sync_queue set attempts = 0, next_attempt_at = $2, last_error = null where id = $1",
      [id, stamp],
    );
  } catch {
    /* remote path may have already applied */
  }
  void sweepLinearQueue(8).catch(() => {});
  return { ...hit, attempts: 0, nextAttemptAt: stamp, lastError: null };
}

export async function sweepLinearQueue(limit = 8): Promise<number> {
  const rows = await dueQueueRows(limit);
  let done = 0;
  for (const row of rows) {
    const id = String(row.id ?? "");
    const kind = String(row.kind ?? "");
    const attempts = Number(row.attempts ?? 0) + 1;
    const payload = parseJson<Record<string, unknown>>(
      typeof row.payload === "string" ? row.payload : JSON.stringify(row.payload ?? {}),
      {},
    );
    try {
      if (kind === "create_issue") {
        await createLinearIssue({
          title: String(payload.title ?? "Agency event"),
          description: typeof payload.description === "string" ? payload.description : null,
          state: typeof payload.state === "string" ? payload.state : "backlog",
          labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
          priority: typeof payload.priority === "number" ? payload.priority : 2,
          linkTo:
            payload.linkType && payload.linkId && isLinearEntityType(payload.linkType)
              ? { type: payload.linkType, id: String(payload.linkId) }
              : null,
          actorId: typeof payload.actorId === "string" ? payload.actorId : null,
        });
      } else if (kind === "update_state") {
        await updateLinearIssue({
          linkTo:
            payload.linkType && payload.linkId && isLinearEntityType(payload.linkType)
              ? { type: payload.linkType, id: String(payload.linkId) }
              : null,
          issueId: typeof payload.issueId === "string" ? payload.issueId : undefined,
          state: typeof payload.state === "string" ? payload.state : null,
          comment: typeof payload.comment === "string" ? payload.comment : null,
        });
      }
      await deleteQueueRow(id);
      done += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "LINEAR_UNAVAILABLE";
      if (attempts >= 8) {
        await deleteQueueRow(id);
        await auditLinear("linear.sync.dropped", "Dropped Linear sync after retries", {
          kind,
          error: message,
        });
      } else {
        await bumpQueueRow(id, attempts, message);
      }
    }
  }
  return done;
}

function columnForJobStatus(status: string): LinearKanbanColumn | null {
  const s = status.toUpperCase();
  if (s === "RUNNING" || s === "UPLOADING" || s === "QUEUED" || s === "STEPPING" || s === "PROCESSING") {
    return "inProgress";
  }
  if (s === "AWAITING_APPROVAL" || s === "WAITING_HUMAN" || s === "IN_REVIEW" || s === "NEEDS_ATTENTION") {
    return "inReview";
  }
  if (s === "SUCCEEDED" || s === "COMPLETED" || s === "DONE" || s === "PUBLISHED") return "done";
  if (s === "FAILED" || s === "ERROR" || s === "CANCELED") return null;
  return null;
}

export async function notifyLinearOfEntity(input: {
  entityType: LinearEntityType;
  entityId: string;
  status?: string | null;
  failed?: boolean;
  title: string;
  description?: string | null;
  labels?: string[];
  priority?: number;
  actorId?: string | null;
  proposal?: boolean;
}): Promise<void> {
  try {
    const config = await readConfig();
    if (!config.flags.enabled) {
      if (input.failed) {
        await auditLinear("linear.issue.skipped", "Linear disabled — no issue created", {
          entityType: input.entityType,
          entityId: input.entityId,
        });
      }
      return;
    }
    const token = await loadToken();
    if (!token || !config.teamId) return;
    const link = await findLinearLink(input.entityType, input.entityId);
    if (link && config.flags.syncJobs) {
      const failCol = input.failed ? config.flags.failColumn : columnForJobStatus(input.status ?? "");
      const column = failCol ?? (input.failed ? config.flags.failColumn : null);
      if (column) {
        await enqueueSync("update_state", {
          linkType: input.entityType,
          linkId: input.entityId,
          issueId: link.linearIssueId,
          state: column,
          comment: input.failed ? scrubLinearText(input.description ?? input.title) : null,
        });
      }
      return;
    }
    const shouldCreate =
      (input.failed && config.flags.autoIssueOnFail) ||
      (input.proposal && config.flags.autoIssueOnProposal);
    if (!shouldCreate || link) return;
    await enqueueSync("create_issue", {
      title: input.title.slice(0, 250),
      description: input.description ?? "",
      state: input.failed ? config.flags.failColumn : "backlog",
      labels: input.labels ?? [],
      priority: input.failed ? (input.priority ?? 2) : 0,
      linkType: input.entityType,
      linkId: input.entityId,
      actorId: input.actorId ?? null,
    });
  } catch {
    /* never block callers */
  }
}

export async function ensureProjectMilestones(): Promise<LinearMilestoneOption[]> {
  const config = await readConfig();
  if (!config.projectId) throw new Error("LINEAR_PROJECT_REQUIRED");
  const data = await gql<{
    project: { projectMilestones?: { nodes: LinearMilestoneOption[] } | null } | null;
  }>(PROJECT_MS_QUERY, { id: config.projectId });
  const existing = data.project?.projectMilestones?.nodes ?? [];
  const byName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row]));
  const CREATE_MS = `mutation MsCreate($input: ProjectMilestoneCreateInput!) {
    projectMilestoneCreate(input: $input) { projectMilestone { id name } }
  }`;
  const out = [...existing];
  for (const name of LINEAR_DEFAULT_MILESTONES) {
    if (byName.has(name.toLowerCase())) continue;
    try {
      const created = await gql<{
        projectMilestoneCreate: { projectMilestone: LinearMilestoneOption | null };
      }>(CREATE_MS, { input: { name, projectId: config.projectId } });
      const row = created.projectMilestoneCreate?.projectMilestone;
      if (row) {
        out.push(row);
        byName.set(row.name.toLowerCase(), row);
      }
    } catch {
      /* optional */
    }
  }
  await patchConfig({ milestones: out });
  return out;
}

export async function linearEnabledAndReady(): Promise<boolean> {
  const [token, config] = await Promise.all([loadToken(), readConfig()]);
  return Boolean(token && config.flags.enabled && config.teamId);
}

export async function getLinearStatusForHermes(): Promise<{
  configured: boolean;
  enabled: boolean;
  team: string | null;
  project: string | null;
  workspace: string | null;
  stateMap: LinearStateMap;
  syncJobs: boolean;
  autoIssueOnFail: boolean;
}> {
  const status = await publicLinearStatus();
  return {
    configured: status.configured,
    enabled: status.flags.enabled,
    team: status.teamName,
    project: status.projectName,
    workspace: status.workspaceSlug,
    stateMap: status.stateMap,
    syncJobs: status.flags.syncJobs,
    autoIssueOnFail: status.flags.autoIssueOnFail,
  };
}

export { readConfig as readLinearConfig };
