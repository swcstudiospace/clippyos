import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, n as deleteAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { n as last4 } from "./discord.server-Dlb8OQV5.mjs";
import { s as publicAppOrigin } from "./airwallex.server-CjwNksJP.mjs";
import { a as LINEAR_DEFAULT_MILESTONES, d as isLinearColumn, f as isLinearEntityType, n as EMPTY_STATE_MAP, s as LINEAR_KANBAN_COLUMNS, t as DEFAULT_LINEAR_FLAGS, u as guessColumnFromType } from "./linear-CrgEmECq.mjs";
import { randomBytes } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/linear.server-DI-z011N.js
var schemaReady = null;
var STATEMENTS = [
	`create table if not exists linear_links (
  id                   text primary key,
  workspace_id         text not null default 'default',
  agency_entity_type   text not null,
  agency_entity_id     text not null,
  linear_issue_id      text not null,
  linear_identifier    text,
  linear_url           text,
  last_state_id        text,
  last_synced_at       timestamptz,
  created_at           timestamptz not null default now(),
  created_by           text
)`,
	`create unique index if not exists linear_links_entity_uidx
  on linear_links (agency_entity_type, agency_entity_id)`,
	`create index if not exists linear_links_issue_idx on linear_links (linear_issue_id)`,
	`create table if not exists linear_sync_queue (
  id               text primary key,
  kind             text not null,
  payload          text not null default '{}',
  attempts         integer not null default 0,
  next_attempt_at  timestamptz not null default now(),
  last_error       text,
  created_at       timestamptz not null default now()
)`,
	`create index if not exists linear_sync_queue_due_idx
  on linear_sync_queue (next_attempt_at)`
];
async function ensureLinearSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		try {
			const sql = await localSql();
			for (const statement of STATEMENTS) try {
				await sql.query(`${statement};`);
			} catch {}
		} catch {}
		try {
			const admin = await getAgencyAdmin();
			if (admin) {
				const { error } = await admin.from("linear_links").select("id").limit(0);
				if (error && isMissingTable(error)) {}
			}
		} catch {}
	})();
	return schemaReady;
}
/**
* Linear GraphQL client + issue bridge. Tokens stay in AppSetting.
* Outages never throw to publish/render callers — queue + retry instead.
*/
var linear_server_exports = /* @__PURE__ */ __exportAll({
	completeLinearOAuth: () => completeLinearOAuth,
	createLinearIssue: () => createLinearIssue,
	disconnectLinear: () => disconnectLinear,
	ensureProjectMilestones: () => ensureProjectMilestones,
	findLinearIssues: () => findLinearIssues,
	findLinearLink: () => findLinearLink,
	getLinearStatusForHermes: () => getLinearStatusForHermes,
	linearEnabledAndReady: () => linearEnabledAndReady,
	listLinearLinks: () => listLinearLinks,
	loadLinearCatalog: () => loadLinearCatalog,
	notifyLinearOfEntity: () => notifyLinearOfEntity,
	persistLinearApiKey: () => persistLinearApiKey,
	persistLinearOauthApp: () => persistLinearOauthApp,
	publicLinearStatus: () => publicLinearStatus,
	readLinearConfig: () => readConfig,
	saveLinearBinding: () => saveLinearBinding,
	scrubLinearText: () => scrubLinearText,
	startLinearOAuth: () => startLinearOAuth,
	sweepLinearQueue: () => sweepLinearQueue,
	testLinearConnection: () => testLinearConnection,
	updateLinearIssue: () => updateLinearIssue
});
var API_KEY = "LINEAR_API_KEY";
var OAUTH_ACCESS = "LINEAR_OAUTH_ACCESS_TOKEN";
var OAUTH_REFRESH = "LINEAR_OAUTH_REFRESH_TOKEN";
var CLIENT_ID_KEY = "LINEAR_CLIENT_ID";
var CLIENT_SECRET_KEY = "LINEAR_CLIENT_SECRET";
var CONFIG_KEY = "LINEAR_CONFIG_JSON";
var RATE_KEY = "LINEAR_RATE_JSON";
var PENDING_OAUTH_KEY = "LINEAR_OAUTH_PENDING";
var GRAPHQL = "https://api.linear.app/graphql";
var OAUTH_TOKEN = "https://api.linear.app/oauth/token";
var OAUTH_AUTHORIZE = "https://linear.app/oauth/authorize";
var CREATE_CAP_PER_HOUR = 20;
var MANUAL_BOARD_LABEL = "manual-board";
var GQL_TIMEOUT_MS = 18e3;
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function parseJson(raw, fallback) {
	if (!raw) return fallback;
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : fallback;
	} catch {
		return fallback;
	}
}
function scrubLinearText(input) {
	return input.replace(/lin_api_[A-Za-z0-9]+/g, "[redacted]").replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]").replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").replace(/xai-[A-Za-z0-9_-]+/g, "[redacted]").replace(/dtn_[A-Za-z0-9]+/g, "[redacted]").replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").replace(/ghp_[A-Za-z0-9]+/g, "[redacted]").replace(/whsec_[A-Za-z0-9]+/g, "[redacted]").replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]+/g, "[redacted]").slice(0, 8e3);
}
function emptyConfig() {
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
		milestones: []
	};
}
function normalizeFlags(input) {
	const src = input && typeof input === "object" ? input : {};
	return {
		enabled: src.enabled === true,
		syncJobs: src.syncJobs === true,
		autoIssueOnFail: src.autoIssueOnFail !== false,
		autoIssueOnProposal: src.autoIssueOnProposal === true,
		membersCanCreate: src.membersCanCreate === true,
		failColumn: isLinearColumn(src.failColumn) ? src.failColumn : "inProgress"
	};
}
function normalizeStateMap(input) {
	const src = input && typeof input === "object" ? input : {};
	const out = { ...EMPTY_STATE_MAP };
	for (const col of LINEAR_KANBAN_COLUMNS) {
		const value = src[col];
		out[col] = typeof value === "string" && value.trim() ? value.trim() : null;
	}
	return out;
}
async function readConfig() {
	const parsed = parseJson(await readAppSetting(CONFIG_KEY), {});
	return {
		...emptyConfig(),
		...parsed,
		stateMap: normalizeStateMap(parsed.stateMap),
		flags: normalizeFlags(parsed.flags),
		milestones: Array.isArray(parsed.milestones) ? parsed.milestones.filter((row) => Boolean(row && typeof row === "object" && typeof row.id === "string" && typeof row.name === "string")) : []
	};
}
async function writeConfig(next) {
	await writeAppSetting(CONFIG_KEY, JSON.stringify(next));
}
async function patchConfig(patch) {
	const current = await readConfig();
	const next = {
		...current,
		...patch,
		stateMap: patch.stateMap ? normalizeStateMap(patch.stateMap) : current.stateMap,
		flags: patch.flags ? normalizeFlags({
			...current.flags,
			...patch.flags
		}) : current.flags,
		milestones: patch.milestones ?? current.milestones
	};
	await writeConfig(next);
	return next;
}
async function loadToken() {
	const oauth = (await readAppSetting(OAUTH_ACCESS))?.trim();
	if (oauth) return {
		access: oauth,
		kind: "oauth"
	};
	const key = (await readAppSetting(API_KEY))?.trim();
	if (key) return {
		access: key,
		kind: "api_key"
	};
	return null;
}
function authHeader(token) {
	if (token.kind === "oauth") return `Bearer ${token.access}`;
	if (token.access.startsWith("lin_api_")) return token.access;
	return `Bearer ${token.access}`;
}
async function refreshOauth() {
	const refresh = (await readAppSetting(OAUTH_REFRESH))?.trim();
	const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
	const clientSecret = (await readAppSetting(CLIENT_SECRET_KEY))?.trim();
	if (!refresh || !clientId || !clientSecret) return null;
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refresh,
		client_id: clientId,
		client_secret: clientSecret
	});
	const response = await fetch(OAUTH_TOKEN, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		},
		body,
		signal: AbortSignal.timeout(12e3)
	});
	if (!response.ok) return null;
	const json = await response.json();
	if (!json.access_token) return null;
	await writeAppSetting(OAUTH_ACCESS, json.access_token);
	if (json.refresh_token) await writeAppSetting(OAUTH_REFRESH, json.refresh_token);
	return {
		access: json.access_token,
		kind: "oauth"
	};
}
async function gql(query, variables, attempt = 0) {
	let token = await loadToken();
	if (!token) throw new Error("LINEAR_NOT_CONFIGURED");
	const response = await fetch(GRAPHQL, {
		method: "POST",
		headers: {
			Authorization: authHeader(token),
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			query,
			variables
		}),
		signal: AbortSignal.timeout(GQL_TIMEOUT_MS)
	});
	if (response.status === 401 && attempt === 0 && token.kind === "oauth") {
		if (await refreshOauth()) return gql(query, variables, 1);
		throw new Error("LINEAR_UNAUTHORIZED");
	}
	if (response.status === 401) throw new Error("LINEAR_UNAUTHORIZED");
	if (response.status === 429) {
		if (attempt >= 3) throw new Error("LINEAR_RATE_LIMIT");
		const retryAfter = Number(response.headers.get("retry-after") ?? "") || 1 + attempt * 2;
		await new Promise((resolve) => setTimeout(resolve, Math.min(8e3, retryAfter * 1e3)));
		return gql(query, variables, attempt + 1);
	}
	if (response.status >= 500 && attempt < 2) {
		await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
		return gql(query, variables, attempt + 1);
	}
	if (!response.ok) throw new Error("LINEAR_UNAVAILABLE");
	const json = await response.json();
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
async function consumeCreateBudget() {
	const raw = await readAppSetting(RATE_KEY);
	const now = Date.now();
	const parsed = parseJson(raw, {});
	const windowStart = typeof parsed.windowStart === "number" ? parsed.windowStart : now;
	const count = typeof parsed.count === "number" ? parsed.count : 0;
	if (now - windowStart >= 36e5) {
		await writeAppSetting(RATE_KEY, JSON.stringify({
			windowStart: now,
			count: 1
		}));
		return;
	}
	if (count >= CREATE_CAP_PER_HOUR) throw new Error("LINEAR_RATE_LIMIT");
	await writeAppSetting(RATE_KEY, JSON.stringify({
		windowStart,
		count: count + 1
	}));
}
function callbackUrl() {
	return `${publicAppOrigin()}/api/oauth/linear`;
}
async function publicLinearStatus() {
	const [token, config, clientId] = await Promise.all([
		loadToken(),
		readConfig(),
		readAppSetting(CLIENT_ID_KEY)
	]);
	const configured = Boolean(token);
	let health = "not_configured";
	if (!configured) health = "not_configured";
	else if (config.lastOk === false) health = "error";
	else if (config.lastOk === true && config.teamId) health = "connected";
	else health = "saved";
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
		stateNames: {},
		flags: config.flags,
		teams: [],
		projects: [],
		states: [],
		milestones: config.milestones,
		lastTestedAt: config.lastTestedAt,
		lastError: config.lastError,
		callbackUrl: callbackUrl()
	};
}
var VIEWER_QUERY = `query Viewer {
  viewer {
    id name displayName email
    organization { id name urlKey }
  }
  teams { nodes { id name key } }
}`;
var TEAM_QUERY = `query TeamDetail($id: String!) {
  team(id: $id) {
    id name key
    states { nodes { id name type position } }
    projects { nodes { id name } }
  }
}`;
var PROJECT_MS_QUERY = `query ProjectMilestones($id: String!) {
  project(id: $id) {
    id name
    projectMilestones { nodes { id name } }
  }
}`;
function mapStates(nodes) {
	return nodes.map((row) => ({
		id: row.id,
		name: row.name,
		type: row.type,
		position: typeof row.position === "number" ? row.position : 0
	})).sort((a, b) => a.position - b.position);
}
function autoMapStates(states) {
	const map = { ...EMPTY_STATE_MAP };
	for (const state of states) {
		const col = guessColumnFromType(state.type, state.name);
		if (col && !map[col]) map[col] = state.id;
	}
	return map;
}
async function persistLinearApiKey(key) {
	const trimmed = key.trim();
	if (trimmed.length < 12) throw new Error("KEY_TOO_SHORT");
	await writeAppSetting(API_KEY, trimmed);
	await patchConfig({ lastError: null });
}
async function persistLinearOauthApp(input) {
	if (input.clientId.trim().length < 8 || input.clientSecret.trim().length < 8) throw new Error("KEY_TOO_SHORT");
	await writeAppSetting(CLIENT_ID_KEY, input.clientId.trim());
	await writeAppSetting(CLIENT_SECRET_KEY, input.clientSecret.trim());
}
async function disconnectLinear() {
	await Promise.all([
		deleteAppSetting(API_KEY),
		deleteAppSetting(OAUTH_ACCESS),
		deleteAppSetting(OAUTH_REFRESH),
		deleteAppSetting(PENDING_OAUTH_KEY),
		deleteAppSetting(RATE_KEY)
	]);
	await writeConfig(emptyConfig());
}
async function testLinearConnection() {
	const data = await gql(VIEWER_QUERY);
	const viewerName = data.viewer?.displayName || data.viewer?.name || data.viewer?.email || "Linear user";
	const org = data.viewer?.organization ?? null;
	const teams = data.teams?.nodes ?? [];
	const current = await readConfig();
	let projects = [];
	let states = [];
	let teamName = current.teamName;
	let stateMap = current.stateMap;
	const teamId = current.teamId && teams.some((row) => row.id === current.teamId) ? current.teamId : teams[0]?.id ?? null;
	if (teamId) {
		const team = await gql(TEAM_QUERY, { id: teamId });
		teamName = team.team?.name ?? teamName;
		projects = team.team?.projects?.nodes ?? [];
		states = mapStates(team.team?.states?.nodes ?? []);
		const mapped = autoMapStates(states);
		stateMap = {
			backlog: current.stateMap.backlog ?? mapped.backlog,
			ready: current.stateMap.ready ?? mapped.ready,
			inProgress: current.stateMap.inProgress ?? mapped.inProgress,
			inReview: current.stateMap.inReview ?? mapped.inReview,
			done: current.stateMap.done ?? mapped.done
		};
	}
	const projectId = current.projectId && projects.some((row) => row.id === current.projectId) ? current.projectId : projects.find((row) => /clipping|ai clipping/i.test(row.name))?.id ?? projects[0]?.id ?? current.projectId;
	const projectName = projects.find((row) => row.id === projectId)?.name ?? current.projectName;
	let milestones = current.milestones;
	if (projectId) try {
		milestones = (await gql(PROJECT_MS_QUERY, { id: projectId })).project?.projectMilestones?.nodes ?? [];
	} catch {}
	await patchConfig({
		viewerName,
		organizationId: org?.id ?? null,
		organizationName: org?.name ?? null,
		workspaceSlug: org?.urlKey ?? null,
		teamId,
		teamName: teamId ? teams.find((row) => row.id === teamId)?.name ?? teamName : teamName,
		projectId: projectId ?? null,
		projectName: projectName ?? null,
		stateMap,
		lastTestedAt: nowIso(),
		lastError: null,
		lastOk: true,
		milestones,
		flags: {
			...current.flags,
			enabled: current.flags.enabled || Boolean(teamId)
		}
	});
	const status = await publicLinearStatus();
	status.teams = teams;
	status.projects = projects;
	status.states = states;
	const names = {};
	for (const col of LINEAR_KANBAN_COLUMNS) {
		const id = status.stateMap[col];
		const match = states.find((row) => row.id === id);
		if (match) names[col] = match.name;
	}
	status.stateNames = names;
	return status;
}
async function loadLinearCatalog(teamId) {
	const teams = (await gql(VIEWER_QUERY)).teams?.nodes ?? [];
	const config = await readConfig();
	const id = teamId || config.teamId || teams[0]?.id || null;
	if (!id) return {
		teams,
		projects: [],
		states: []
	};
	const team = await gql(TEAM_QUERY, { id });
	return {
		teams,
		projects: team.team?.projects?.nodes ?? [],
		states: mapStates(team.team?.states?.nodes ?? [])
	};
}
async function saveLinearBinding(input) {
	const current = await readConfig();
	let teamName = current.teamName;
	let projectName = current.projectName;
	let states = [];
	let projects = [];
	if (input.teamId) try {
		const team = await gql(TEAM_QUERY, { id: input.teamId });
		teamName = team.team?.name ?? teamName;
		projects = team.team?.projects?.nodes ?? [];
		states = mapStates(team.team?.states?.nodes ?? []);
	} catch {}
	const projectId = input.projectId === void 0 ? current.projectId : input.projectId;
	if (projectId && projects.length) projectName = projects.find((row) => row.id === projectId)?.name ?? projectName;
	const nextMap = normalizeStateMap({
		...current.stateMap,
		...input.stateMap
	});
	if (states.length) {
		const auto = autoMapStates(states);
		for (const col of LINEAR_KANBAN_COLUMNS) if (!nextMap[col]) nextMap[col] = auto[col];
	}
	await patchConfig({
		teamId: input.teamId === void 0 ? current.teamId : input.teamId,
		teamName,
		projectId,
		projectName,
		stateMap: nextMap,
		flags: input.flags ? {
			...current.flags,
			...input.flags
		} : current.flags
	});
	const status = await publicLinearStatus();
	if (states.length) {
		status.states = states;
		status.projects = projects;
		const names = {};
		for (const col of LINEAR_KANBAN_COLUMNS) {
			const id = status.stateMap[col];
			const match = states.find((row) => row.id === id);
			if (match) names[col] = match.name;
		}
		status.stateNames = names;
	}
	return status;
}
async function startLinearOAuth(userId) {
	const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
	if (!clientId) throw new Error("LINEAR_OAUTH_APP_MISSING");
	const state = randomBytes(16).toString("hex");
	await writeAppSetting(PENDING_OAUTH_KEY, JSON.stringify({
		state,
		userId,
		createdAt: nowIso()
	}));
	const url = new URL(OAUTH_AUTHORIZE);
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", callbackUrl());
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", "read,write,issues:create,comments:create");
	url.searchParams.set("state", state);
	url.searchParams.set("prompt", "consent");
	return { url: url.toString() };
}
async function completeLinearOAuth(input) {
	const pending = parseJson(await readAppSetting(PENDING_OAUTH_KEY), {});
	if (!pending.state || pending.state !== input.state) throw new Error("OAUTH_STATE");
	const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim();
	const clientSecret = (await readAppSetting(CLIENT_SECRET_KEY))?.trim();
	if (!clientId || !clientSecret) throw new Error("LINEAR_OAUTH_APP_MISSING");
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code: input.code,
		redirect_uri: callbackUrl(),
		client_id: clientId,
		client_secret: clientSecret
	});
	const response = await fetch(OAUTH_TOKEN, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		},
		body,
		signal: AbortSignal.timeout(15e3)
	});
	if (!response.ok) throw new Error("OAUTH_EXCHANGE");
	const json = await response.json();
	if (!json.access_token) throw new Error("OAUTH_EXCHANGE");
	await writeAppSetting(OAUTH_ACCESS, json.access_token);
	if (json.refresh_token) await writeAppSetting(OAUTH_REFRESH, json.refresh_token);
	await deleteAppSetting(PENDING_OAUTH_KEY);
	await testLinearConnection().catch(() => {});
}
function mapLink(row) {
	return {
		id: String(row.id ?? ""),
		agencyEntityType: isLinearEntityType(row.agency_entity_type) ? row.agency_entity_type : "SocialUploadJob",
		agencyEntityId: String(row.agency_entity_id ?? ""),
		linearIssueId: String(row.linear_issue_id ?? ""),
		linearIdentifier: row.linear_identifier == null ? null : String(row.linear_identifier),
		linearUrl: row.linear_url == null ? null : String(row.linear_url),
		lastStateId: row.last_state_id == null ? null : String(row.last_state_id),
		lastSyncedAt: row.last_synced_at == null ? null : String(row.last_synced_at),
		createdAt: String(row.created_at ?? "")
	};
}
async function findLinearLink(entityType, entityId) {
	await ensureLinearSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("linear_links").select("*").eq("agency_entity_type", entityType).eq("agency_entity_id", entityId).maybeSingle();
		if (!error && data) return mapLink(data);
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from linear_links where agency_entity_type = $1 and agency_entity_id = $2 limit 1", [entityType, entityId]);
		return rows[0] ? mapLink(rows[0]) : null;
	} catch {
		return null;
	}
}
async function listLinearLinks(ids) {
	await ensureLinearSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("linear_links").select("*").order("created_at", { ascending: false }).limit(200);
		if (!error && data) {
			const rows = data.map(mapLink);
			if (!ids?.length) return rows;
			const set = new Set(ids.map((row) => `${row.type}:${row.id}`));
			return rows.filter((row) => set.has(`${row.agencyEntityType}:${row.agencyEntityId}`));
		}
		if (error && !isMissingTable(error)) return [];
	}
	try {
		const mapped = (await (await localSql()).query("select * from linear_links order by created_at desc limit 200")).map(mapLink);
		if (!ids?.length) return mapped;
		const set = new Set(ids.map((row) => `${row.type}:${row.id}`));
		return mapped.filter((row) => set.has(`${row.agencyEntityType}:${row.agencyEntityId}`));
	} catch {
		return [];
	}
}
async function upsertLink(row) {
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
		created_by: row.actorId ?? null
	};
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("linear_links").upsert(payload, { onConflict: "agency_entity_type,agency_entity_id" });
	try {
		await (await localSql()).query(`insert into linear_links (
         id, workspace_id, agency_entity_type, agency_entity_id, linear_issue_id,
         linear_identifier, linear_url, last_state_id, last_synced_at, created_at, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (agency_entity_type, agency_entity_id) do update set
         linear_issue_id = excluded.linear_issue_id,
         linear_identifier = excluded.linear_identifier,
         linear_url = excluded.linear_url,
         last_state_id = excluded.last_state_id,
         last_synced_at = excluded.last_synced_at`, [
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
			payload.created_by
		]);
	} catch {}
	return mapLink(payload);
}
var LABEL_QUERY = `query TeamLabels($teamId: ID) {
  issueLabels(filter: { team: { id: { eq: $teamId } } }, first: 100) {
    nodes { id name }
  }
}`;
var LABEL_CREATE = `mutation LabelCreate($input: IssueLabelCreateInput!) {
  issueLabelCreate(input: $input) { issueLabel { id name } }
}`;
async function ensureLabelIds(teamId, names) {
	const wanted = [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];
	if (!wanted.length) return [];
	let nodes = [];
	try {
		nodes = (await gql(LABEL_QUERY, { teamId })).issueLabels?.nodes ?? [];
	} catch {
		nodes = [];
	}
	const ids = [];
	for (const name of wanted) {
		const existing = nodes.find((row) => row.name.toLowerCase() === name);
		if (existing) {
			ids.push(existing.id);
			continue;
		}
		try {
			const id = (await gql(LABEL_CREATE, { input: {
				name,
				teamId
			} })).issueLabelCreate?.issueLabel?.id;
			if (id) ids.push(id);
		} catch {}
	}
	return ids;
}
var ISSUE_CREATE = `mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id identifier url title
      state { id name }
      labels { nodes { id name } }
    }
  }
}`;
var ISSUE_UPDATE = `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue {
      id identifier url title
      state { id name }
      labels { nodes { id name } }
    }
  }
}`;
var COMMENT_CREATE = `mutation CommentCreate($input: CommentCreateInput!) {
  commentCreate(input: $input) { success comment { id } }
}`;
var ISSUE_GET = `query IssueGet($id: String!) {
  issue(id: $id) {
    id identifier url title
    state { id name type }
    labels { nodes { id name } }
  }
}`;
var ISSUES_SEARCH = `query FindIssues($teamId: ID!, $term: String) {
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
function toIssueView(node) {
	return {
		id: node.id,
		identifier: node.identifier,
		url: node.url,
		title: node.title,
		stateName: node.state?.name ?? null
	};
}
function hasManualBoard(node) {
	return Boolean(node?.labels?.nodes?.some((row) => row.name.toLowerCase() === MANUAL_BOARD_LABEL));
}
function agencyDeepLink(entityType, entityId) {
	const origin = publicAppOrigin();
	switch (entityType) {
		case "SocialUploadJob": return `${origin}/social`;
		case "RenderJob": return `${origin}/library`;
		case "AgentRun": return `${origin}/agent`;
		case "KnowledgeProposal": return `${origin}/settings#ai-training`;
		case "ApprovalRequest": return `${origin}/approvals`;
		case "Milestone": return `${origin}/settings#linear`;
		default: return origin;
	}
}
function stateIdFor(config, column) {
	return config.stateMap[column] ?? void 0;
}
async function createLinearIssue(input) {
	const config = await readConfig();
	if (!config.flags.enabled) {
		await auditLinear("linear.issue.skipped", "Linear is disabled", {
			reason: "LINEAR_ENABLED false",
			title: input.title.slice(0, 80)
		});
		return {
			issue: {
				id: "",
				identifier: "",
				url: "",
				title: input.title,
				stateName: null
			},
			link: null,
			skipped: "disabled"
		};
	}
	if (!await loadToken()) throw new Error("LINEAR_NOT_CONFIGURED");
	if (!config.teamId) throw new Error("LINEAR_TEAM_REQUIRED");
	await consumeCreateBudget();
	const column = isLinearColumn(input.state) ? input.state : "backlog";
	const labelIds = await ensureLabelIds(config.teamId, input.labels ?? []);
	const description = scrubLinearText([input.description ?? "", input.linkTo ? `\n\nAgency: ${agencyDeepLink(input.linkTo.type, input.linkTo.id)}` : ""].join("").trim());
	const issue = (await gql(ISSUE_CREATE, { input: {
		title: scrubLinearText(input.title).slice(0, 250),
		description: description || void 0,
		teamId: config.teamId,
		projectId: input.projectId || config.projectId || void 0,
		stateId: stateIdFor(config, column),
		labelIds: labelIds.length ? labelIds : void 0,
		priority: typeof input.priority === "number" ? Math.min(4, Math.max(0, input.priority)) : void 0
	} })).issueCreate?.issue;
	if (!issue) throw new Error("LINEAR_UNAVAILABLE");
	let link = null;
	if (input.linkTo) link = await upsertLink({
		entityType: input.linkTo.type,
		entityId: input.linkTo.id,
		issueId: issue.id,
		identifier: issue.identifier,
		url: issue.url,
		stateId: issue.state?.id ?? null,
		actorId: input.actorId
	});
	await auditLinear("linear.issue.created", `Created ${issue.identifier}`, {
		issueId: issue.id,
		identifier: issue.identifier,
		entityType: input.linkTo?.type ?? null,
		entityId: input.linkTo?.id ?? null
	});
	try {
		const { notifyAdmins } = await import("./notifications.server-CiVCMOdN.mjs");
		await notifyAdmins({
			extraUserIds: input.actorId ? [input.actorId] : [],
			category: "SYSTEM",
			severity: "INFO",
			title: `Issue created in Linear · ${issue.identifier}`,
			body: issue.title,
			href: issue.url,
			entityType: input.linkTo?.type ?? "linear_issue",
			entityId: input.linkTo?.id ?? issue.id
		});
	} catch {}
	try {
		const { emitAutonomyEvent } = await import("./autonomy-events.server-DCl-_J_B.mjs").then((n) => n.t);
		await emitAutonomyEvent({
			type: "linear.issue.created",
			entityType: "linear_issue",
			entityId: issue.id,
			data: {
				identifier: issue.identifier,
				url: issue.url
			}
		});
	} catch {}
	return {
		issue: toIssueView(issue),
		link
	};
}
async function updateLinearIssue(input) {
	const config = await readConfig();
	if (!config.flags.enabled) return {
		issue: null,
		skipped: "disabled"
	};
	let issueId = input.issueId ?? "";
	if (!issueId && input.linkTo) issueId = (await findLinearLink(input.linkTo.type, input.linkTo.id))?.linearIssueId ?? "";
	if (!issueId) throw new Error("LINEAR_ISSUE_MISSING");
	let current = null;
	try {
		current = (await gql(ISSUE_GET, { id: issueId })).issue;
	} catch {
		current = null;
	}
	if (hasManualBoard(current)) return {
		issue: current ? toIssueView(current) : null,
		skipped: "manual-board"
	};
	const patch = {};
	if (input.state && isLinearColumn(input.state)) {
		const stateId = stateIdFor(config, input.state);
		if (stateId) patch.stateId = stateId;
	}
	if (input.labels?.length && config.teamId) patch.labelIds = await ensureLabelIds(config.teamId, input.labels);
	let node = current;
	if (Object.keys(patch).length) node = (await gql(ISSUE_UPDATE, {
		id: issueId,
		input: patch
	})).issueUpdate?.issue ?? node;
	if (input.comment?.trim()) await gql(COMMENT_CREATE, { input: {
		issueId,
		body: scrubLinearText(input.comment.trim())
	} }).catch(() => null);
	if (input.linkTo && node) await upsertLink({
		entityType: input.linkTo.type,
		entityId: input.linkTo.id,
		issueId: node.id,
		identifier: node.identifier,
		url: node.url,
		stateId: node.state?.id ?? null,
		actorId: input.actorId
	});
	await auditLinear("linear.issue.updated", `Updated ${node?.identifier ?? issueId}`, {
		issueId,
		identifier: node?.identifier ?? null,
		state: input.state ?? null
	});
	return { issue: node ? toIssueView(node) : null };
}
async function findLinearIssues(term) {
	const config = await readConfig();
	if (!config.teamId) throw new Error("LINEAR_TEAM_REQUIRED");
	return ((await gql(ISSUES_SEARCH, {
		teamId: config.teamId,
		term: term.trim().slice(0, 80) || void 0
	})).issues?.nodes ?? []).map(toIssueView);
}
async function auditLinear(action, summary, metadata, actorId) {
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: actorId ?? null,
			actorType: actorId?.startsWith("agent:") ? "HERMES" : actorId ? "USER" : "SYSTEM",
			action,
			entityType: typeof metadata.entityType === "string" ? metadata.entityType : "linear",
			entityId: typeof metadata.entityId === "string" ? String(metadata.entityId) : null,
			summary,
			metadata
		});
	} catch {}
}
async function enqueueSync(kind, payload) {
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
		created_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("linear_sync_queue").insert(row).then(() => {}, () => {});
	try {
		await (await localSql()).query(`insert into linear_sync_queue (id, kind, payload, attempts, next_attempt_at, last_error, created_at)
       values ($1,$2,$3,0,$4,null,$4)`, [
			id,
			kind,
			row.payload,
			stamp
		]);
	} catch {}
	scheduleSweep();
}
var sweepTimer = null;
function scheduleSweep() {
	if (sweepTimer) return;
	sweepTimer = setTimeout(() => {
		sweepTimer = null;
		sweepLinearQueue(8).catch(() => {});
	}, 250);
}
async function dueQueueRows(limit) {
	await ensureLinearSchema();
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("linear_sync_queue").select("*").lte("next_attempt_at", stamp).order("created_at", { ascending: true }).limit(limit);
		if (!error && data) return data;
	}
	try {
		return await (await localSql()).query("select * from linear_sync_queue where next_attempt_at <= $1 order by created_at asc limit $2", [stamp, limit]);
	} catch {
		return [];
	}
}
async function deleteQueueRow(id) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("linear_sync_queue").delete().eq("id", id);
	try {
		await (await localSql()).query("delete from linear_sync_queue where id = $1", [id]);
	} catch {}
}
async function bumpQueueRow(id, attempts, error) {
	const delay = Math.min(9e5, 4e3 * 2 ** Math.min(attempts, 6));
	const next = new Date(Date.now() + delay).toISOString();
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("linear_sync_queue").update({
		attempts,
		next_attempt_at: next,
		last_error: error.slice(0, 180)
	}).eq("id", id);
	try {
		await (await localSql()).query("update linear_sync_queue set attempts = $2, next_attempt_at = $3, last_error = $4 where id = $1", [
			id,
			attempts,
			next,
			error.slice(0, 180)
		]);
	} catch {}
}
async function sweepLinearQueue(limit = 8) {
	const rows = await dueQueueRows(limit);
	let done = 0;
	for (const row of rows) {
		const id = String(row.id ?? "");
		const kind = String(row.kind ?? "");
		const attempts = Number(row.attempts ?? 0) + 1;
		const payload = parseJson(typeof row.payload === "string" ? row.payload : JSON.stringify(row.payload ?? {}), {});
		try {
			if (kind === "create_issue") await createLinearIssue({
				title: String(payload.title ?? "Agency event"),
				description: typeof payload.description === "string" ? payload.description : null,
				state: typeof payload.state === "string" ? payload.state : "backlog",
				labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
				priority: typeof payload.priority === "number" ? payload.priority : 2,
				linkTo: payload.linkType && payload.linkId && isLinearEntityType(payload.linkType) ? {
					type: payload.linkType,
					id: String(payload.linkId)
				} : null,
				actorId: typeof payload.actorId === "string" ? payload.actorId : null
			});
			else if (kind === "update_state") await updateLinearIssue({
				linkTo: payload.linkType && payload.linkId && isLinearEntityType(payload.linkType) ? {
					type: payload.linkType,
					id: String(payload.linkId)
				} : null,
				issueId: typeof payload.issueId === "string" ? payload.issueId : void 0,
				state: typeof payload.state === "string" ? payload.state : null,
				comment: typeof payload.comment === "string" ? payload.comment : null
			});
			await deleteQueueRow(id);
			done += 1;
		} catch (error) {
			const message = error instanceof Error ? error.message : "LINEAR_UNAVAILABLE";
			if (attempts >= 8) {
				await deleteQueueRow(id);
				await auditLinear("linear.sync.dropped", "Dropped Linear sync after retries", {
					kind,
					error: message
				});
			} else await bumpQueueRow(id, attempts, message);
		}
	}
	return done;
}
function columnForJobStatus(status) {
	const s = status.toUpperCase();
	if (s === "RUNNING" || s === "UPLOADING" || s === "QUEUED" || s === "STEPPING" || s === "PROCESSING") return "inProgress";
	if (s === "AWAITING_APPROVAL" || s === "WAITING_HUMAN" || s === "IN_REVIEW" || s === "NEEDS_ATTENTION") return "inReview";
	if (s === "SUCCEEDED" || s === "COMPLETED" || s === "DONE" || s === "PUBLISHED") return "done";
	if (s === "FAILED" || s === "ERROR" || s === "CANCELED") return null;
	return null;
}
async function notifyLinearOfEntity(input) {
	try {
		const config = await readConfig();
		if (!config.flags.enabled) {
			if (input.failed) await auditLinear("linear.issue.skipped", "Linear disabled — no issue created", {
				entityType: input.entityType,
				entityId: input.entityId
			});
			return;
		}
		if (!await loadToken() || !config.teamId) return;
		const link = await findLinearLink(input.entityType, input.entityId);
		if (link && config.flags.syncJobs) {
			const column = (input.failed ? config.flags.failColumn : columnForJobStatus(input.status ?? "")) ?? (input.failed ? config.flags.failColumn : null);
			if (column) await enqueueSync("update_state", {
				linkType: input.entityType,
				linkId: input.entityId,
				issueId: link.linearIssueId,
				state: column,
				comment: input.failed ? scrubLinearText(input.description ?? input.title) : null
			});
			return;
		}
		if (!(input.failed && config.flags.autoIssueOnFail || input.proposal && config.flags.autoIssueOnProposal) || link) return;
		await enqueueSync("create_issue", {
			title: input.title.slice(0, 250),
			description: input.description ?? "",
			state: input.failed ? config.flags.failColumn : "backlog",
			labels: input.labels ?? [],
			priority: input.failed ? input.priority ?? 2 : 0,
			linkType: input.entityType,
			linkId: input.entityId,
			actorId: input.actorId ?? null
		});
	} catch {}
}
async function ensureProjectMilestones() {
	const config = await readConfig();
	if (!config.projectId) throw new Error("LINEAR_PROJECT_REQUIRED");
	const existing = (await gql(PROJECT_MS_QUERY, { id: config.projectId })).project?.projectMilestones?.nodes ?? [];
	const byName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row]));
	const CREATE_MS = `mutation MsCreate($input: ProjectMilestoneCreateInput!) {
    projectMilestoneCreate(input: $input) { projectMilestone { id name } }
  }`;
	const out = [...existing];
	for (const name of LINEAR_DEFAULT_MILESTONES) {
		if (byName.has(name.toLowerCase())) continue;
		try {
			const row = (await gql(CREATE_MS, { input: {
				name,
				projectId: config.projectId
			} })).projectMilestoneCreate?.projectMilestone;
			if (row) {
				out.push(row);
				byName.set(row.name.toLowerCase(), row);
			}
		} catch {}
	}
	await patchConfig({ milestones: out });
	return out;
}
async function linearEnabledAndReady() {
	const [token, config] = await Promise.all([loadToken(), readConfig()]);
	return Boolean(token && config.flags.enabled && config.teamId);
}
async function getLinearStatusForHermes() {
	const status = await publicLinearStatus();
	return {
		configured: status.configured,
		enabled: status.flags.enabled,
		team: status.teamName,
		project: status.projectName,
		workspace: status.workspaceSlug,
		stateMap: status.stateMap,
		syncJobs: status.flags.syncJobs,
		autoIssueOnFail: status.flags.autoIssueOnFail
	};
}
//#endregion
export { linear_server_exports as n, completeLinearOAuth as t };
