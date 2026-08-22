import { A as isMissingTable, g as PROGRESS_STAGES } from "./mappers-Bmic_hyw.mjs";
import { t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { a as deleteCookie$1, d as setCookie$1, o as getCookie, s as getRequest } from "./ssr2.mjs";
import { g as PLAN_LABELS, u as inclusiveDayCount } from "./dashboard-Dk6DLyWe.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { f as parsePortalSettings, n as PORTAL_ACTIVITY_ACTIONS, p as portalActorId, s as PORTAL_CLIENT_FACING_TYPES, t as DEFAULT_PORTAL_SETTINGS } from "./portal-BZQkNPFJ.mjs";
import { writeAuditEvent } from "./audit.server-B2Y-2eMJ.mjs";
import { notifyUsers } from "./notifications.server-CiVCMOdN.mjs";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/portal.server-Bv5Rx_Kz.js
var scryptAsync = promisify(scrypt);
var COOKIE = "clippy_portal_sid";
var SETTINGS_KEY = "PORTAL_SETTINGS_JSON";
var SESSION_TTL_MS = 2592e6;
var PREVIEW_TTL_MS = 72e5;
var INVITE_TTL_MS = 6048e5;
var failMap = /* @__PURE__ */ new Map();
var DDL = `
create table if not exists client_portal_users (
  id              text primary key,
  workspace_id    text not null default 'default',
  client_id       text not null,
  email           text not null,
  name            text,
  status          text not null,
  password_hash   text,
  invite_hash     text,
  invite_expires  timestamptz,
  last_login_at   timestamptz,
  can_approve     text not null default '1',
  created_at      timestamptz not null default now(),
  created_by      text
);
create unique index if not exists client_portal_users_email_uidx
  on client_portal_users (workspace_id, email);
create index if not exists client_portal_users_client_idx
  on client_portal_users (client_id, status);
create table if not exists client_portal_sessions (
  id           text primary key,
  user_id      text,
  client_id    text not null,
  token_hash   text not null,
  preview      text not null default '0',
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create unique index if not exists client_portal_sessions_token_uidx
  on client_portal_sessions (token_hash);
`;
var schemaReady = null;
async function ensurePortalSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		try {
			const sql = await localSql();
			for (const statement of DDL.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(`${statement};`);
		} catch {}
	})();
	return schemaReady;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function asBool(value, fallback = false) {
	if (value === true || value === "1" || value === "true") return true;
	if (value === false || value === "0" || value === "false") return false;
	return fallback;
}
function normalizeEmail(email) {
	return email.trim().toLowerCase();
}
function rateLimitOk(key, max = 8, windowMs = 9e5) {
	const now = Date.now();
	const rec = failMap.get(key);
	if (rec && rec.until > now && rec.n >= max) return false;
	if (rec && rec.until <= now) failMap.delete(key);
	return true;
}
function rateLimitHit(key, windowMs = 9e5) {
	const now = Date.now();
	const rec = failMap.get(key);
	if (!rec || rec.until <= now) {
		failMap.set(key, {
			n: 1,
			until: now + windowMs
		});
		return;
	}
	rec.n += 1;
}
async function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	return `${salt}:${(await scryptAsync(password, salt, 64)).toString("hex")}`;
}
async function verifyPassword(password, stored) {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const buf = await scryptAsync(password, salt, 64);
	const expected = Buffer.from(hash, "hex");
	if (expected.length !== buf.length) return false;
	return timingSafeEqual(expected, buf);
}
function mapUser(row) {
	return {
		id: String(row.id ?? ""),
		clientId: String(row.client_id ?? ""),
		email: String(row.email ?? ""),
		name: row.name == null || row.name === "" ? null : String(row.name),
		status: oneOf(row.status, [
			"INVITED",
			"ACTIVE",
			"REVOKED"
		], "INVITED"),
		lastLoginAt: row.last_login_at == null ? null : String(row.last_login_at),
		canApprove: asBool(row.can_approve, true),
		createdAt: String(row.created_at ?? ""),
		passwordHash: row.password_hash == null ? null : String(row.password_hash),
		inviteHash: row.invite_hash == null ? null : String(row.invite_hash),
		inviteExpires: row.invite_expires == null ? null : String(row.invite_expires)
	};
}
function publicUser(row) {
	return {
		id: row.id,
		clientId: row.clientId,
		email: row.email,
		name: row.name,
		status: row.status,
		lastLoginAt: row.lastLoginAt,
		canApprove: row.canApprove,
		createdAt: row.createdAt
	};
}
async function readPortalSettings() {
	const raw = await readAppSetting(SETTINGS_KEY);
	if (!raw) return {
		...DEFAULT_PORTAL_SETTINGS,
		agencyName: APP_NAME
	};
	try {
		return parsePortalSettings(JSON.parse(raw));
	} catch {
		return {
			...DEFAULT_PORTAL_SETTINGS,
			agencyName: APP_NAME
		};
	}
}
async function writePortalSettings(next) {
	const parsed = parsePortalSettings(next);
	await writeAppSetting(SETTINGS_KEY, JSON.stringify(parsed));
	return parsed;
}
async function readClientWorkingOn(clientId) {
	const note = (await readAppSetting(`PORTAL_NOTE:${clientId}`))?.trim() ?? "";
	return note ? note.slice(0, 280) : null;
}
async function writeClientWorkingOn(clientId, note) {
	await writeAppSetting(`PORTAL_NOTE:${clientId}`, (note ?? "").trim().slice(0, 280));
}
function setSessionCookie(token, maxAgeSec) {
	try {
		setCookie$1(COOKIE, token, {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			maxAge: maxAgeSec,
			secure: false
		});
	} catch {}
}
function clearSessionCookie() {
	try {
		deleteCookie$1(COOKIE);
	} catch {
		try {
			setCookie$1(COOKIE, "", {
				path: "/",
				maxAge: 0
			});
		} catch {}
	}
}
function cookieToken() {
	try {
		return getCookie(COOKIE);
	} catch {
		return;
	}
}
function portalOrigin() {
	try {
		const req = getRequest();
		if (req) return new URL(req.url).origin;
	} catch {}
	return "http://localhost:8080";
}
async function insertUser(row) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("client_portal_users").insert(row);
		if (error && !isMissingTable(error)) {}
	}
	try {
		await (await localSql()).query(`insert into client_portal_users
        (id, workspace_id, client_id, email, name, status, password_hash, invite_hash, invite_expires, last_login_at, can_approve, created_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
			row.id,
			row.workspace_id,
			row.client_id,
			row.email,
			row.name,
			row.status,
			row.password_hash,
			row.invite_hash,
			row.invite_expires,
			row.last_login_at,
			row.can_approve,
			row.created_at,
			row.created_by
		]);
	} catch {}
}
async function patchUser(id, patch) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("client_portal_users").update(patch).eq("id", id);
	try {
		const sql = await localSql();
		const keys = Object.keys(patch);
		if (keys.length === 0) return;
		const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
		await sql.query(`update client_portal_users set ${sets} where id = $1`, [id, ...keys.map((key) => patch[key])]);
	} catch {}
}
async function getUserById(id) {
	await ensurePortalSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_portal_users").select("*").eq("id", id).maybeSingle();
		if (!error && data) return mapUser(data);
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from client_portal_users where id = $1 limit 1", [id]);
		return rows[0] ? mapUser(rows[0]) : null;
	} catch {
		return null;
	}
}
async function getUserByEmail(email) {
	await ensurePortalSchema();
	const normalized = normalizeEmail(email);
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_portal_users").select("*").eq("email", normalized).maybeSingle();
		if (!error && data) return mapUser(data);
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from client_portal_users where email = $1 limit 1", [normalized]);
		return rows[0] ? mapUser(rows[0]) : null;
	} catch {
		return null;
	}
}
async function getUserByInviteHash(hash) {
	await ensurePortalSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_portal_users").select("*").eq("invite_hash", hash).maybeSingle();
		if (!error && data) return mapUser(data);
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from client_portal_users where invite_hash = $1 limit 1", [hash]);
		return rows[0] ? mapUser(rows[0]) : null;
	} catch {
		return null;
	}
}
async function listPortalUsers(clientId) {
	await ensurePortalSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_portal_users").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => publicUser(mapUser(row)));
		if (!isMissingTable(error)) return [];
	}
	try {
		return (await (await localSql()).query("select * from client_portal_users where client_id = $1 order by created_at desc", [clientId])).map((row) => publicUser(mapUser(row)));
	} catch {
		return [];
	}
}
async function listActivePortalUsersForClient(clientId) {
	return (await listPortalUsers(clientId)).filter((row) => row.status === "ACTIVE");
}
async function insertSession(row) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("client_portal_sessions").insert(row);
	try {
		await (await localSql()).query(`insert into client_portal_sessions
        (id, user_id, client_id, token_hash, preview, expires_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7)`, [
			row.id,
			row.user_id,
			row.client_id,
			row.token_hash,
			row.preview,
			row.expires_at,
			row.created_at
		]);
	} catch {}
}
async function findSessionByHash(hash) {
	await ensurePortalSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_portal_sessions").select("*").eq("token_hash", hash).maybeSingle();
		if (!error && data) return data;
		if (error && !isMissingTable(error)) return null;
	}
	try {
		return (await (await localSql()).query("select * from client_portal_sessions where token_hash = $1 limit 1", [hash]))[0] ?? null;
	} catch {
		return null;
	}
}
async function deleteSessionsForUser(userId) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("client_portal_sessions").delete().eq("user_id", userId);
	try {
		await (await localSql()).query("delete from client_portal_sessions where user_id = $1", [userId]);
	} catch {}
}
async function deleteSessionByHash(hash) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("client_portal_sessions").delete().eq("token_hash", hash);
	try {
		await (await localSql()).query("delete from client_portal_sessions where token_hash = $1", [hash]);
	} catch {}
}
async function issueSession(input) {
	await ensurePortalSchema();
	const token = randomBytes(32).toString("base64url");
	const ttl = input.preview ? PREVIEW_TTL_MS : SESSION_TTL_MS;
	await insertSession({
		id: newId(),
		user_id: input.userId,
		client_id: input.clientId,
		token_hash: sha256(token),
		preview: input.preview ? "1" : "0",
		expires_at: new Date(Date.now() + ttl).toISOString(),
		created_at: nowIso()
	});
	setSessionCookie(token, Math.floor(ttl / 1e3));
	return token;
}
async function resolvePortalSession(bearer) {
	await ensurePortalSchema();
	const settings = await readPortalSettings();
	if (!settings.enabled) return null;
	const raw = (bearer ?? cookieToken() ?? "").trim();
	if (!raw) return null;
	const row = await findSessionByHash(sha256(raw));
	if (!row) return null;
	const expires = Date.parse(String(row.expires_at ?? ""));
	if (!Number.isFinite(expires) || expires < Date.now()) {
		await deleteSessionByHash(String(row.token_hash));
		return null;
	}
	const preview = asBool(row.preview, false);
	const clientId = String(row.client_id ?? "");
	if (!clientId) return null;
	if (preview) return {
		userId: null,
		clientId,
		email: null,
		name: "Preview",
		canApprove: false,
		preview: true,
		status: "PREVIEW"
	};
	const userId = row.user_id == null ? null : String(row.user_id);
	if (!userId) return null;
	const user = await getUserById(userId);
	if (!user || user.status === "REVOKED") {
		await deleteSessionsForUser(userId);
		return null;
	}
	if (user.clientId !== clientId) return null;
	return {
		userId: user.id,
		clientId: user.clientId,
		email: user.email,
		name: user.name,
		canApprove: user.canApprove && settings.approvalsEnabled,
		preview: false,
		status: user.status
	};
}
async function invitePortalUser(input) {
	await ensurePortalSchema();
	if (!(await readPortalSettings()).enabled) throw new Error("PORTAL_DISABLED");
	const email = normalizeEmail(input.email);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("PORTAL_EMAIL_INVALID");
	const limitKey = `invite:${email}`;
	if (!rateLimitOk(limitKey, 6)) throw new Error("PORTAL_RATE_LIMIT");
	rateLimitHit(limitKey);
	const client = await loadClientPublic(input.clientId);
	if (!client) throw new Error("CLIENT_MISSING");
	const existing = await getUserByEmail(email);
	if (existing && existing.clientId !== input.clientId) throw new Error("PORTAL_EMAIL_IN_USE");
	const token = randomBytes(32).toString("base64url");
	const inviteHash = sha256(token);
	const expires = new Date(Date.now() + INVITE_TTL_MS).toISOString();
	const stamp = nowIso();
	const canApprove = input.canApprove !== false;
	let userId = existing?.id;
	if (existing) {
		await patchUser(existing.id, {
			status: "INVITED",
			name: input.name?.trim().slice(0, 80) || existing.name,
			invite_hash: inviteHash,
			invite_expires: expires,
			can_approve: canApprove ? "1" : "0"
		});
		await deleteSessionsForUser(existing.id);
	} else {
		userId = newId();
		await insertUser({
			id: userId,
			workspace_id: "default",
			client_id: input.clientId,
			email,
			name: input.name?.trim().slice(0, 80) || null,
			status: "INVITED",
			password_hash: null,
			invite_hash: inviteHash,
			invite_expires: expires,
			last_login_at: null,
			can_approve: canApprove ? "1" : "0",
			created_at: stamp,
			created_by: input.actorId
		});
	}
	const user = await getUserById(userId);
	const inviteUrl = `${portalOrigin()}/portal/login?invite=${encodeURIComponent(token)}`;
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "USER",
		action: "portal.invite",
		entityType: "client_portal_user",
		entityId: user.id,
		clientId: input.clientId,
		summary: `Invited ${email} to the client portal`,
		metadata: {
			email,
			canApprove
		}
	});
	try {
		const { readAppSetting: readSetting } = await import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
		const hook = (await readSetting("OPS_EMAIL_WEBHOOK"))?.trim();
		if (hook) await fetch(hook, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: `Portal invite — ${client.name}`,
				body: `Activate your client portal: ${inviteUrl}`,
				href: inviteUrl,
				severity: "INFO"
			}),
			signal: AbortSignal.timeout(8e3)
		});
	} catch {}
	return {
		user: publicUser(user),
		inviteUrl,
		token
	};
}
async function peekInvite(token) {
	if (!rateLimitOk(`peek:${token.slice(0, 12)}`, 20)) throw new Error("PORTAL_RATE_LIMIT");
	const user = await getUserByInviteHash(sha256(token));
	if (!user || user.status === "REVOKED") throw new Error("PORTAL_INVITE_INVALID");
	if (user.inviteExpires && Date.parse(user.inviteExpires) < Date.now()) throw new Error("PORTAL_INVITE_EXPIRED");
	const settings = await readPortalSettings();
	const client = await loadClientPublic(user.clientId);
	return {
		email: user.email,
		clientName: client?.name ?? "your brand",
		agencyName: settings.agencyName,
		expiresAt: user.inviteExpires
	};
}
async function activateInvite(input) {
	if (!rateLimitOk(`activate:${input.token.slice(0, 12)}`, 8)) throw new Error("PORTAL_RATE_LIMIT");
	if (input.password.length < 8) throw new Error("PORTAL_PASSWORD");
	const settings = await readPortalSettings();
	if (!settings.enabled) throw new Error("PORTAL_DISABLED");
	const user = await getUserByInviteHash(sha256(input.token));
	if (!user || user.status === "REVOKED") {
		rateLimitHit(`activate:${input.token.slice(0, 12)}`);
		throw new Error("PORTAL_INVITE_INVALID");
	}
	if (user.inviteExpires && Date.parse(user.inviteExpires) < Date.now()) throw new Error("PORTAL_INVITE_EXPIRED");
	const passwordHash = await hashPassword(input.password);
	await patchUser(user.id, {
		status: "ACTIVE",
		password_hash: passwordHash,
		invite_hash: null,
		invite_expires: null,
		last_login_at: nowIso(),
		name: input.name?.trim().slice(0, 80) || user.name
	});
	const token = await issueSession({
		userId: user.id,
		clientId: user.clientId,
		preview: false
	});
	await writeAuditEvent({
		actorUserId: portalActorId(user.id),
		actorType: "PORTAL",
		action: "portal.login",
		entityType: "client_portal_user",
		entityId: user.id,
		clientId: user.clientId,
		summary: "Portal access activated"
	});
	return {
		token,
		session: {
			userId: user.id,
			clientId: user.clientId,
			email: user.email,
			name: input.name?.trim() || user.name,
			canApprove: user.canApprove && settings.approvalsEnabled,
			preview: false,
			status: "ACTIVE"
		}
	};
}
async function portalPasswordLogin(input) {
	const email = normalizeEmail(input.email);
	const key = `login:${email}`;
	if (!rateLimitOk(key, 8)) throw new Error("PORTAL_RATE_LIMIT");
	const settings = await readPortalSettings();
	if (!settings.enabled) throw new Error("PORTAL_DISABLED");
	const user = await getUserByEmail(email);
	if (!user || user.status === "REVOKED" || !user.passwordHash) {
		rateLimitHit(key);
		throw new Error("PORTAL_LOGIN_FAILED");
	}
	if (!await verifyPassword(input.password, user.passwordHash)) {
		rateLimitHit(key);
		throw new Error("PORTAL_LOGIN_FAILED");
	}
	if (user.status !== "ACTIVE") await patchUser(user.id, {
		status: "ACTIVE",
		last_login_at: nowIso()
	});
	else await patchUser(user.id, { last_login_at: nowIso() });
	const token = await issueSession({
		userId: user.id,
		clientId: user.clientId,
		preview: false
	});
	await writeAuditEvent({
		actorUserId: portalActorId(user.id),
		actorType: "PORTAL",
		action: "portal.login",
		entityType: "client_portal_user",
		entityId: user.id,
		clientId: user.clientId,
		summary: "Portal sign-in"
	});
	return {
		token,
		session: {
			userId: user.id,
			clientId: user.clientId,
			email: user.email,
			name: user.name,
			canApprove: user.canApprove && settings.approvalsEnabled,
			preview: false,
			status: "ACTIVE"
		}
	};
}
async function startPortalPreview(input) {
	const client = await loadClientPublic(input.clientId);
	if (!client) throw new Error("CLIENT_MISSING");
	const token = await issueSession({
		userId: null,
		clientId: input.clientId,
		preview: true
	});
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "USER",
		action: "portal.preview",
		entityType: "client",
		entityId: input.clientId,
		clientId: input.clientId,
		summary: `Previewed portal as ${client.name}`
	});
	return {
		token,
		session: {
			userId: null,
			clientId: input.clientId,
			email: null,
			name: "Preview",
			canApprove: false,
			preview: true,
			status: "PREVIEW"
		}
	};
}
async function portalLogout(bearer) {
	const raw = (bearer ?? cookieToken() ?? "").trim();
	if (raw) await deleteSessionByHash(sha256(raw));
	clearSessionCookie();
}
async function revokePortalUser(input) {
	const user = await getUserById(input.id);
	if (!user) throw new Error("PORTAL_USER_MISSING");
	await patchUser(user.id, {
		status: "REVOKED",
		invite_hash: null,
		invite_expires: null
	});
	await deleteSessionsForUser(user.id);
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "USER",
		action: "portal.revoke",
		entityType: "client_portal_user",
		entityId: user.id,
		clientId: user.clientId,
		summary: `Revoked portal access for ${user.email}`
	});
	return {
		...publicUser(user),
		status: "REVOKED"
	};
}
async function setPortalCanApprove(input) {
	const user = await getUserById(input.id);
	if (!user) throw new Error("PORTAL_USER_MISSING");
	await patchUser(user.id, { can_approve: input.canApprove ? "1" : "0" });
	return {
		...publicUser(user),
		canApprove: input.canApprove
	};
}
async function loadClientPublic(clientId) {
	const admin = await getAgencyAdmin();
	let row = null;
	if (admin) {
		const { data, error } = await admin.from("clients").select("id,name,channel_thumbnail,plan_type,custom_plan_label,start_date,deleted_at").eq("id", clientId).maybeSingle();
		if (!error && data) row = data;
	}
	if (!row) try {
		row = (await (await localSql()).query("select id, name, channel_thumbnail, plan_type, custom_plan_label, start_date, deleted_at from clients where id = $1 limit 1", [clientId]))[0] ?? null;
	} catch {
		return null;
	}
	if (!row || row.deleted_at) return null;
	const planType = String(row.plan_type ?? "TEAM_ONLY");
	const custom = row.custom_plan_label == null ? null : String(row.custom_plan_label);
	const planLabel = planType === "CUSTOM" && custom ? custom : PLAN_LABELS[planType] ?? "Content plan";
	return {
		id: String(row.id),
		name: String(row.name ?? "Client"),
		channelThumbnail: row.channel_thumbnail == null ? null : String(row.channel_thumbnail),
		planLabel,
		startDate: row.start_date == null ? null : String(row.start_date).slice(0, 10)
	};
}
async function loadStage(clientId) {
	try {
		const rec = (await (await localSql()).query("select stage, created_at from client_progress where client_id = $1 order by created_at desc limit 1", [clientId]))[0];
		if (!rec) return {
			stage: null,
			updatedAt: null
		};
		const stage = String(rec.stage ?? "");
		return {
			stage: PROGRESS_STAGES.includes(stage) ? stage : null,
			updatedAt: rec.created_at == null ? null : String(rec.created_at)
		};
	} catch {
		return {
			stage: null,
			updatedAt: null
		};
	}
}
async function loadPortalHome(session) {
	const settings = await readPortalSettings();
	const client = await loadClientPublic(session.clientId);
	if (!client) throw new Error("CLIENT_MISSING");
	const [stageInfo, workingOn, assets, approvals, notifications, unread] = await Promise.all([
		loadStage(session.clientId),
		readClientWorkingOn(session.clientId),
		loadPortalAssets(session, "ALL"),
		loadPortalApprovals(session, "PENDING"),
		session.userId ? (await import("./notifications.server-CiVCMOdN.mjs")).listNotifications(portalActorId(session.userId), { limit: 8 }) : Promise.resolve([]),
		session.userId ? (await import("./notifications.server-CiVCMOdN.mjs")).unreadCount(portalActorId(session.userId)) : Promise.resolve(0)
	]);
	const weekAgo = Date.now() - 6048e5;
	const newAssetsThisWeek = assets.filter((row) => Date.parse(row.createdAt) >= weekAgo).length;
	const dayCount = client.startDate ? inclusiveDayCount(client.startDate, todayIsoDate()) : null;
	return {
		settings,
		client,
		stage: stageInfo.stage,
		stageUpdatedAt: stageInfo.updatedAt,
		workingOn,
		pendingApprovals: approvals.filter((row) => row.status === "PENDING").length,
		newAssetsThisWeek,
		dayCount: dayCount && dayCount > 0 ? Math.min(dayCount, 30) : dayCount,
		preview: session.preview,
		canApprove: session.canApprove && !session.preview,
		notifications,
		unread
	};
}
async function loadPortalAssets(session, kind = "ALL") {
	const { listAssets } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	const filters = {
		clientId: session.clientId,
		status: "READY"
	};
	if (kind !== "ALL") filters.kind = kind;
	const assets = await listAssets(filters, 80);
	const settings = await readPortalSettings();
	let viewsByAsset = /* @__PURE__ */ new Map();
	if (settings.showMetrics) try {
		const { listPostPerformance } = await import("./performance.server-kOlT5k3Z.mjs");
		const posts = await listPostPerformance({
			clientId: session.clientId,
			limit: 200
		});
		for (const post of posts) {
			if (!post.mediaAssetId) continue;
			const current = viewsByAsset.get(post.mediaAssetId);
			const next = post.metrics.views;
			if (next == null) continue;
			viewsByAsset.set(post.mediaAssetId, current == null ? next : Math.max(current, next));
		}
	} catch {
		viewsByAsset = /* @__PURE__ */ new Map();
	}
	return assets.filter((row) => row.clientId === session.clientId && (row.status === "READY" || row.status === "PROCESSING")).filter((row) => row.kind === "VIDEO" || row.kind === "IMAGE").map((row) => ({
		id: row.id,
		kind: row.kind,
		title: row.title,
		status: row.status,
		durationSec: row.durationSec,
		previewUrl: row.previewUrl,
		createdAt: row.createdAt,
		mimeType: row.mimeType,
		views: settings.showMetrics ? viewsByAsset.get(row.id) ?? null : null
	}));
}
async function signPortalDownload(session, assetId) {
	if (!(await readPortalSettings()).allowDownload) throw new Error("PORTAL_DOWNLOAD_DENIED");
	const { getAsset, listVersions } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	const asset = await getAsset(assetId);
	if (!asset || asset.clientId !== session.clientId) throw new Error("PORTAL_ASSET_MISSING");
	const url = (await listVersions(asset.id))[0]?.previewUrl ?? asset.previewUrl;
	if (!url) throw new Error("PORTAL_ASSET_MISSING");
	return url;
}
async function loadPortalApprovals(session, status = "PENDING") {
	const { listApprovalRequests } = await import("./approvals.server-Bpax_gE8.mjs");
	return (await listApprovalRequests({
		status: status === "PENDING" ? "PENDING" : void 0,
		clientId: session.clientId,
		limit: 80
	})).filter((row) => row.clientId === session.clientId && PORTAL_CLIENT_FACING_TYPES.includes(row.type));
}
async function loadPortalActivity(session) {
	const { listAuditEvents } = await import("./audit.server-B2Y-2eMJ.mjs");
	const rows = await listAuditEvents({
		clientId: session.clientId,
		limit: 80
	});
	const allowed = new Set(PORTAL_ACTIVITY_ACTIONS);
	return rows.filter((row) => row.clientId === session.clientId && allowed.has(row.action)).slice(0, 40).map((row) => ({
		id: row.id,
		at: row.at,
		action: row.action,
		title: friendlyActivityTitle(row.action),
		detail: row.summary
	}));
}
function friendlyActivityTitle(action) {
	switch (action) {
		case "approval.requested": return "Review requested";
		case "approval.approved": return "Approved";
		case "approval.rejected": return "Changes requested";
		case "progress.stage_changed": return "Production stage updated";
		case "social.publish.succeeded": return "Delivered";
		case "portal.login": return "Portal sign-in";
		case "portal.approve": return "You approved a delivery";
		case "portal.reject": return "You requested changes";
		case "portal.invite": return "Portal access invited";
		case "library.asset_ready": return "New asset ready";
		default: return "Update";
	}
}
async function notifyPortalClient(input) {
	try {
		const users = await listActivePortalUsersForClient(input.clientId);
		if (users.length === 0) return;
		await notifyUsers({
			userIds: users.map((row) => portalActorId(row.id)),
			category: input.category,
			severity: input.severity ?? "INFO",
			title: input.title,
			body: input.body,
			href: input.href,
			entityType: input.entityType ?? null,
			entityId: input.entityId ?? null
		});
	} catch {}
}
async function markPortalNotificationsRead(session) {
	if (!session.userId) return;
	const { markNotificationsRead } = await import("./notifications.server-CiVCMOdN.mjs");
	await markNotificationsRead({
		userId: portalActorId(session.userId),
		all: true
	});
}
function assertClientFacingApproval(request, session) {
	if (request.clientId !== session.clientId) throw new Error("APPROVAL_FORBIDDEN");
	if (!PORTAL_CLIENT_FACING_TYPES.includes(request.type)) throw new Error("APPROVAL_FORBIDDEN");
}
//#endregion
export { activateInvite, assertClientFacingApproval, invitePortalUser, listPortalUsers, loadPortalActivity, loadPortalApprovals, loadPortalAssets, loadPortalHome, markPortalNotificationsRead, notifyPortalClient, peekInvite, portalLogout, portalPasswordLogin, readClientWorkingOn, readPortalSettings, resolvePortalSession, revokePortalUser, setPortalCanApprove, signPortalDownload, startPortalPreview, writeClientWorkingOn, writePortalSettings };
