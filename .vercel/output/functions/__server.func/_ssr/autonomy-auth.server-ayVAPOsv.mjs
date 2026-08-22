import { r as __exportAll } from "../_runtime.mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { p as parseScopes } from "./autonomy-CEwFxjUt.mjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/autonomy-auth.server-ayVAPOsv.js
var autonomy_auth_server_ayVAPOsv_exports = /* @__PURE__ */ __exportAll({
	a: () => listApiKeyRows,
	i: () => ensureAutonomySchema,
	n: () => authenticateMcpToken,
	o: () => rateLimitOrThrow,
	r: () => autonomy_auth_server_exports,
	s: () => readWebhookSecret,
	t: () => authenticateApiKey
});
var autonomy_auth_server_exports = /* @__PURE__ */ __exportAll$1({
	authenticateApiKey: () => authenticateApiKey,
	authenticateMcpToken: () => authenticateMcpToken,
	ensureAutonomySchema: () => ensureAutonomySchema,
	generateApiKeyPlaintext: () => generateApiKeyPlaintext,
	generateMcpTokenPlaintext: () => generateMcpTokenPlaintext,
	generateWebhookSecretPlaintext: () => generateWebhookSecretPlaintext,
	hashToken: () => hashToken,
	insertApiKey: () => insertApiKey,
	last4Of: () => last4Of,
	listApiKeyRows: () => listApiKeyRows,
	prefixOf: () => prefixOf,
	rateLimitOrThrow: () => rateLimitOrThrow,
	readWebhookSecret: () => readWebhookSecret,
	revokeApiKey: () => revokeApiKey
});
var RATE_MAX = 120;
var RATE_WINDOW_MS = 6e4;
var hits = /* @__PURE__ */ new Map();
var SCHEMA_STATEMENTS = [
	`alter table client_progress drop constraint if exists client_progress_source_check`,
	`alter table client_progress add constraint client_progress_source_check check (source in ('MANUAL', 'AI_DISCORD', 'AGENT'))`,
	`create table if not exists api_keys (
    id           text primary key,
    name         text not null,
    key_hash     text not null,
    key_prefix   text not null,
    last4        text not null,
    scopes       text not null,
    last_used_at timestamptz,
    revoked_at   timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    created_by   text
  )`,
	`create unique index if not exists api_keys_hash_uidx on api_keys (key_hash)`,
	`create index if not exists api_keys_revoked_idx on api_keys (revoked_at)`,
	`create table if not exists agent_audit_log (
    id           text primary key,
    request_id   text not null,
    source       text not null check (source in ('api', 'mcp', 'webhook')),
    actor_key_id text,
    actor_label  text,
    action       text not null,
    entity_type  text,
    entity_id    text,
    result       text not null check (result in ('ok', 'error', 'denied')),
    error_code   text,
    created_at   timestamptz not null default now()
  )`,
	`create index if not exists agent_audit_log_created_idx on agent_audit_log (created_at desc)`,
	`create index if not exists agent_audit_log_source_idx on agent_audit_log (source)`,
	`alter table agent_audit_log add column if not exists playbook_id text`,
	`alter table agent_audit_log add column if not exists run_id text`,
	`create index if not exists agent_audit_log_playbook_idx on agent_audit_log (playbook_id)`,
	`create table if not exists webhook_deliveries (
    id              text primary key,
    event_id        text not null,
    event_type      text not null,
    payload         text not null,
    destination     text not null,
    status          text not null check (status in ('pending', 'delivered', 'failed')),
    attempts        integer not null default 0,
    last_error      text,
    last_attempt_at timestamptz,
    created_at      timestamptz not null default now()
  )`,
	`create index if not exists webhook_deliveries_event_idx on webhook_deliveries (event_id)`,
	`create index if not exists webhook_deliveries_created_idx on webhook_deliveries (created_at desc)`,
	`create table if not exists agent_jobs (
    id          text primary key,
    kind        text not null,
    client_id   text,
    status      text not null check (status in ('queued', 'running', 'completed', 'error')),
    result      text,
    error_code  text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
  )`,
	`create table if not exists agent_idempotency (
    id          text primary key,
    body        text not null,
    created_at  timestamptz not null default now()
  )`
];
var schemaReady = null;
async function ensureAutonomySchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		const sql = await localSql();
		for (const statement of SCHEMA_STATEMENTS) try {
			await sql.query(statement);
		} catch {}
	})().catch((error) => {
		schemaReady = null;
		throw error;
	});
	return schemaReady;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function hashToken(value) {
	return createHash("sha256").update(value).digest("hex");
}
function tokensEqual(a, b) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
function generateApiKeyPlaintext() {
	return `agk_live_${randomBytes(24).toString("hex")}`;
}
function generateMcpTokenPlaintext() {
	return `mcp_${randomBytes(24).toString("hex")}`;
}
function generateWebhookSecretPlaintext() {
	return `whsec_${randomBytes(24).toString("hex")}`;
}
function last4Of(value) {
	return value.slice(-4);
}
function prefixOf(value) {
	return value.slice(0, 12);
}
function rateLimitOrThrow(bucket) {
	const now = Date.now();
	const prior = (hits.get(bucket) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (prior.length >= RATE_MAX) throw new Error("RATE_LIMITED");
	prior.push(now);
	hits.set(bucket, prior);
}
function mapKey(row) {
	return {
		id: String(row.id ?? ""),
		name: String(row.name ?? ""),
		keyPrefix: String(row.key_prefix ?? ""),
		last4: String(row.last4 ?? ""),
		scopes: parseScopes(row.scopes),
		lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
		revokedAt: row.revoked_at ? String(row.revoked_at) : null,
		createdAt: String(row.created_at ?? "")
	};
}
async function listApiKeyRows() {
	await ensureAutonomySchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("api_keys").select("*").order("created_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapKey(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	try {
		return (await (await localSql()).query("select * from api_keys order by created_at desc")).map(mapKey);
	} catch {
		return [];
	}
}
async function insertApiKey(input) {
	await ensureAutonomySchema();
	const stamp = nowIso();
	const row = {
		id: newId(),
		name: input.name,
		key_hash: hashToken(input.plaintext),
		key_prefix: prefixOf(input.plaintext),
		last4: last4Of(input.plaintext),
		scopes: JSON.stringify(input.scopes),
		last_used_at: null,
		revoked_at: null,
		created_at: stamp,
		updated_at: stamp,
		created_by: input.actorId
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("api_keys").insert(row);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) return mapKey(row);
	}
	await (await localSql()).query(`insert into api_keys (id, name, key_hash, key_prefix, last4, scopes, last_used_at, revoked_at, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,null,null,$7,$7,$8)`, [
		row.id,
		row.name,
		row.key_hash,
		row.key_prefix,
		row.last4,
		row.scopes,
		stamp,
		input.actorId
	]);
	return mapKey(row);
}
async function revokeApiKey(id) {
	await ensureAutonomySchema();
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("api_keys").update({
			revoked_at: stamp,
			updated_at: stamp
		}).eq("id", id).is("revoked_at", null);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) return;
	}
	await (await localSql()).query("update api_keys set revoked_at = $2, updated_at = $2 where id = $1 and revoked_at is null", [id, stamp]);
}
async function touchKey(id) {
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		await admin.from("api_keys").update({
			last_used_at: stamp,
			updated_at: stamp
		}).eq("id", id);
		return;
	}
	try {
		await (await localSql()).query("update api_keys set last_used_at = $2, updated_at = $2 where id = $1", [id, stamp]);
	} catch {}
}
async function authenticateApiKey(header) {
	await ensureAutonomySchema();
	if (!header || !header.toLowerCase().startsWith("bearer ")) throw new Error("UNAUTHORIZED");
	const token = header.slice(7).trim();
	if (!token.startsWith("agk_")) throw new Error("UNAUTHORIZED");
	const digest = hashToken(token);
	const admin = await getAgencyAdmin();
	let row = null;
	if (admin) {
		const { data, error } = await admin.from("api_keys").select("*").eq("key_hash", digest).maybeSingle();
		if (!error) row = data ?? null;
		else if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	if (!row) try {
		row = (await (await localSql()).query("select * from api_keys where key_hash = $1 limit 1", [digest]))[0] ?? null;
	} catch {
		row = null;
	}
	if (!row || row.revoked_at) throw new Error("UNAUTHORIZED");
	const mapped = mapKey(row);
	rateLimitOrThrow(`api:${mapped.id}`);
	touchKey(mapped.id);
	return {
		source: "api",
		keyId: mapped.id,
		label: mapped.name,
		scopes: mapped.scopes
	};
}
async function authenticateMcpToken(header) {
	if (!header || !header.toLowerCase().startsWith("bearer ")) throw new Error("UNAUTHORIZED");
	const token = header.slice(7).trim();
	const stored = await readAppSetting("MCP_TOKEN_HASH");
	if (!stored || !token.startsWith("mcp_")) throw new Error("UNAUTHORIZED");
	if (!tokensEqual(hashToken(token), stored)) throw new Error("UNAUTHORIZED");
	rateLimitOrThrow("mcp");
	await writeAppSetting("MCP_LAST_USED_AT", nowIso());
	return {
		source: "mcp",
		keyId: "mcp",
		label: "MCP",
		scopes: [
			"read",
			"write:progress",
			"write:payments",
			"write:leads",
			"write:clients",
			"actions:ai",
			"write:social",
			"skills:execute"
		]
	};
}
async function readWebhookSecret() {
	return (await readAppSetting("WEBHOOK_SIGNING_SECRET"))?.trim() || null;
}
//#endregion
export { listApiKeyRows as a, ensureAutonomySchema as i, authenticateMcpToken as n, rateLimitOrThrow as o, autonomy_auth_server_ayVAPOsv_exports as r, readWebhookSecret as s, authenticateApiKey as t };
