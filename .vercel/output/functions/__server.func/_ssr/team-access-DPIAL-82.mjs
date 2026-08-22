import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { i as getSql } from "./db-Bjmpu96a.mjs";
import { n as auth } from "./server-C5l0fORE.mjs";
import { r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/team-access-DPIAL-82.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_app_settings() {
	return import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_isolation() {
	return import("./isolation.server-BhkgXDma.mjs");
}
async function load_airwallex() {
	return import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r);
}
var scryptAsync = promisify(scrypt);
var OWNER_EMAIL = "owner@clippy.internal";
var failMap = /* @__PURE__ */ new Map();
async function hashSecret(password) {
	const salt = randomBytes(16).toString("hex");
	return `${salt}:${(await scryptAsync(password, salt, 64)).toString("hex")}`;
}
async function verifySecret(password, stored) {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const buf = await scryptAsync(password, salt, 64);
	const expected = Buffer.from(hash, "hex");
	if (expected.length !== buf.length) return false;
	return timingSafeEqual(expected, buf);
}
function rateLimit(key) {
	const now = Date.now();
	const rec = failMap.get(key);
	if (rec && rec.until > now && rec.n >= 5) return false;
	if (rec && rec.until <= now) failMap.delete(key);
	return true;
}
function recordFail(key) {
	const now = Date.now();
	const rec = failMap.get(key);
	if (!rec || rec.until <= now) {
		failMap.set(key, {
			n: 1,
			until: now + 9e5
		});
		return;
	}
	rec.n += 1;
}
async function ensureProfile(userId, role, status = "ACTIVE") {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("app_profiles").upsert({
			user_id: userId,
			role,
			status,
			updated_at: now
		}, { onConflict: "user_id" });
		if (!error || !isMissingTable(error)) {
			if (error && !isMissingTable(error)) await admin.from("app_profiles").upsert({
				user_id: userId,
				role,
				updated_at: now
			}, { onConflict: "user_id" });
			return;
		}
	}
	try {
		await (await (await load_agency_db()).localSql()).query(`insert into app_profiles (user_id, role, status, created_at, updated_at)
       values ($1,$2,$3,$4,$4)
       on conflict (user_id) do update set role = excluded.role, status = excluded.status, updated_at = excluded.updated_at`, [
			userId,
			role,
			status,
			now
		]);
	} catch {
		try {
			await (await (await load_agency_db()).localSql()).query(`insert into app_profiles (user_id, role, created_at, updated_at)
         values ($1,$2,$3,$3)
         on conflict (user_id) do update set role = excluded.role, updated_at = excluded.updated_at`, [
				userId,
				role,
				now
			]);
		} catch {}
	}
}
async function readAuthUsers() {
	try {
		const sql = await getSql();
		try {
			return (await sql.query(`select id, name, email, "createdAt" from "user" order by "createdAt" desc`)).map((row) => ({
				id: row.id,
				name: row.name ?? "",
				email: row.email ?? "",
				createdAt: row.createdAt
			}));
		} catch {
			return (await sql.query(`select id, name, email, created_at from "user" order by created_at desc`)).map((row) => ({
				id: row.id,
				name: row.name ?? "",
				email: row.email ?? "",
				createdAt: row.created_at
			}));
		}
	} catch {
		return [];
	}
}
async function readProfiles() {
	const map = /* @__PURE__ */ new Map();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("app_profiles").select("user_id,role,status");
		if (!error) {
			for (const row of data ?? []) {
				const rec = row;
				if (!rec.user_id) continue;
				map.set(rec.user_id, {
					role: rec.role === "admin" ? "admin" : "member",
					status: rec.status === "REVOKED" ? "REVOKED" : "ACTIVE"
				});
			}
			return map;
		}
		if (!isMissingTable(error)) return map;
	}
	try {
		const rows = await (await (await load_agency_db()).localSql()).query("select user_id, role, status from app_profiles");
		for (const row of rows) map.set(row.user_id, {
			role: row.role === "admin" ? "admin" : "member",
			status: row.status === "REVOKED" ? "REVOKED" : "ACTIVE"
		});
	} catch {
		try {
			const rows = await (await (await load_agency_db()).localSql()).query("select user_id, role from app_profiles");
			for (const row of rows) map.set(row.user_id, {
				role: row.role === "admin" ? "admin" : "member",
				status: "ACTIVE"
			});
		} catch {}
	}
	return map;
}
var listTeamLogins_createServerFn_handler = createServerRpc({
	id: "debd65317af61d579247b8e78f08141c3f9e097787de887fd1d6e5eb00d10380",
	name: "listTeamLogins",
	filename: "src/lib/server/team-access.ts"
}, (opts) => listTeamLogins.__executeServer(opts));
var listTeamLogins = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listTeamLogins_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const [users, profiles] = await Promise.all([readAuthUsers(), readProfiles()]);
	return users.map((user) => {
		const profile = profiles.get(user.id);
		return {
			userId: user.id,
			name: user.name || user.email || "Operator",
			email: user.email,
			role: profile?.role ?? "member",
			status: profile?.status ?? "ACTIVE",
			createdAt: user.createdAt
		};
	});
});
var CreateSchema = object({
	name: string().trim().min(1).max(120),
	email: string().trim().email().max(200),
	password: string().min(8).max(200),
	role: _enum(["admin", "member"]).default("member")
});
async function findUserByEmail(email) {
	return (await readAuthUsers()).find((row) => row.email.toLowerCase() === email.toLowerCase())?.id ?? null;
}
async function createCredentialUser(name, email, password) {
	if (await findUserByEmail(email)) throw new Error("Could not create account");
	const ctx = await auth.$context;
	const hashed = await ctx.password.hash(password);
	const user = await ctx.internalAdapter.createUser({
		name,
		email,
		emailVerified: true
	});
	await ctx.internalAdapter.createAccount({
		userId: user.id,
		providerId: "credential",
		accountId: user.id,
		password: hashed
	});
	return user.id;
}
var createTeamLogin_createServerFn_handler = createServerRpc({
	id: "bbd6dca88b88d1d0b53dadc205f52523e283f3e12e2937d547bc1453be92217a",
	name: "createTeamLogin",
	filename: "src/lib/server/team-access.ts"
}, (opts) => createTeamLogin.__executeServer(opts));
var createTeamLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateSchema.parse(input)).handler(createTeamLogin_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const userId = await createCredentialUser(data.name, data.email, data.password);
	await ensureProfile(userId, data.role, "ACTIVE");
	try {
		const { onAuthEvent } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onAuthEvent({
			actorId: context.userId,
			action: "auth.team_invite",
			summary: `Invited ${data.email} as ${data.role}`,
			metadata: {
				email: data.email,
				role: data.role
			}
		});
	} catch {}
	return {
		ok: true,
		userId
	};
});
var revokeTeamLogin_createServerFn_handler = createServerRpc({
	id: "9dea2914fb9e4c50cf3cbb70ab0fedd6221e4c73c4b3b20943817db3bb365873",
	name: "revokeTeamLogin",
	filename: "src/lib/server/team-access.ts"
}, (opts) => revokeTeamLogin.__executeServer(opts));
var revokeTeamLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(revokeTeamLogin_createServerFn_handler, async ({ context, data: userId }) => {
	await requireAdmin(context.userId);
	if (userId === context.userId) throw new Error("Forbidden");
	await ensureProfile(userId, "member", "REVOKED");
	try {
		await (await auth.$context).internalAdapter.deleteUserSessions(userId);
	} catch {}
	return { ok: true };
});
var PasswordSchema = object({ password: string().min(8).max(200) });
var setSuperAdminPassword_createServerFn_handler = createServerRpc({
	id: "b7a825f85dab2cf4967bc257b357b2b7f983d578a71dc77434bf7897f9dd47cb",
	name: "setSuperAdminPassword",
	filename: "src/lib/server/team-access.ts"
}, (opts) => setSuperAdminPassword.__executeServer(opts));
var setSuperAdminPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PasswordSchema.parse(input)).handler(setSuperAdminPassword_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const hash = await hashSecret(data.password);
	await (await load_app_settings()).writeAppSetting("SUPER_ADMIN_PASSWORD_HASH", hash);
	try {
		const { onAuthEvent } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onAuthEvent({
			actorId: context.userId,
			action: "auth.super_admin",
			summary: "Super Admin password set"
		});
	} catch {}
	return { ok: true };
});
var RESET_KEY = "PASSWORD_RESET_TOKENS_JSON";
async function readResetRows() {
	const raw = await (await load_app_settings()).readAppSetting(RESET_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
async function writeResetRows(rows) {
	await (await load_app_settings()).writeAppSetting(RESET_KEY, JSON.stringify(rows.slice(0, 50)));
}
async function setCredentialPassword(userId, password) {
	const hashed = await (await auth.$context).password.hash(password);
	const sql = await getSql();
	try {
		await sql.query(`update "account" set password = $1 where "userId" = $2 and "providerId" = 'credential'`, [hashed, userId]);
	} catch {
		await sql.query(`update account set password = $1 where user_id = $2 and provider_id = 'credential'`, [hashed, userId]);
	}
}
var requestPasswordReset_createServerFn_handler = createServerRpc({
	id: "ac07431a26759ab6e75248b4ed4d55fd0527afc3a2701f96f0a226760cd0bacf",
	name: "requestPasswordReset",
	filename: "src/lib/server/team-access.ts"
}, (opts) => requestPasswordReset.__executeServer(opts));
var requestPasswordReset = createServerFn({ method: "POST" }).validator((input) => object({ email: string().trim().email() }).parse(input)).handler(requestPasswordReset_createServerFn_handler, async () => {
	(await load_isolation()).assertSameSiteRequest();
	return { ok: true };
});
var createMemberResetLink_createServerFn_handler = createServerRpc({
	id: "59d657b3eb698b804782669ad4472e4b0ff57865440b3d1afd3ba38644123628",
	name: "createMemberResetLink",
	filename: "src/lib/server/team-access.ts"
}, (opts) => createMemberResetLink.__executeServer(opts));
var createMemberResetLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createMemberResetLink_createServerFn_handler, async ({ context, data: userId }) => {
	await requireAdmin(context.userId);
	const token = randomBytes(24).toString("hex");
	const hash = await hashSecret(token);
	const rows = await readResetRows();
	rows.unshift({
		id: token.slice(0, 8),
		userId,
		hash,
		expiresAt: new Date(Date.now() + 36e5).toISOString(),
		usedAt: null
	});
	await writeResetRows(rows);
	return { url: `${(await load_airwallex()).publicAppOrigin()}/reset-password?token=${token}` };
});
var completePasswordReset_createServerFn_handler = createServerRpc({
	id: "c016d1c51087302b35a843fe910fec0053937c9a47811b106d0fd375bfe851ab",
	name: "completePasswordReset",
	filename: "src/lib/server/team-access.ts"
}, (opts) => completePasswordReset.__executeServer(opts));
var completePasswordReset = createServerFn({ method: "POST" }).validator((input) => object({
	token: string().min(16),
	password: string().min(8).max(200)
}).parse(input)).handler(completePasswordReset_createServerFn_handler, async ({ data }) => {
	(await load_isolation()).assertSameSiteRequest();
	const rows = await readResetRows();
	const now = Date.now();
	let matched = null;
	for (const row of rows) {
		if (row.usedAt) continue;
		if (Date.parse(row.expiresAt) < now) continue;
		if (await verifySecret(data.token, row.hash)) {
			matched = row;
			break;
		}
	}
	if (!matched) throw new Error("RESET_INVALID");
	await setCredentialPassword(matched.userId, data.password);
	matched.usedAt = (/* @__PURE__ */ new Date()).toISOString();
	await writeResetRows(rows);
	return { ok: true };
});
var setMemberPassword_createServerFn_handler = createServerRpc({
	id: "4e4b107251a43f0ef2db185758939e7b226a609f1f1b6a0781419798b1151799",
	name: "setMemberPassword",
	filename: "src/lib/server/team-access.ts"
}, (opts) => setMemberPassword.__executeServer(opts));
var setMemberPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: string().min(1),
	password: string().min(8).max(200)
}).parse(input)).handler(setMemberPassword_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await setCredentialPassword(data.userId, data.password);
	return { ok: true };
});
var changeOwnPassword_createServerFn_handler = createServerRpc({
	id: "224ddccff6218e81f01ebbf900ce6f23ae6a95d1b979b17ce5fd1e850d9fd743",
	name: "changeOwnPassword",
	filename: "src/lib/server/team-access.ts"
}, (opts) => changeOwnPassword.__executeServer(opts));
var changeOwnPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	currentPassword: string().min(8).max(200),
	newPassword: string().min(8).max(200)
}).parse(input)).handler(changeOwnPassword_createServerFn_handler, async ({ context, data }) => {
	const ctx = await auth.$context;
	const sql = await getSql();
	let stored = null;
	try {
		stored = (await sql.query(`select password from "account" where "userId" = $1 and "providerId" = 'credential'`, [context.userId]))[0]?.password ?? null;
	} catch {
		stored = (await sql.query(`select password from account where user_id = $1 and provider_id = 'credential'`, [context.userId]))[0]?.password ?? null;
	}
	if (!stored) throw new Error("RESET_INVALID");
	if (!await ctx.password.verify({
		password: data.currentPassword,
		hash: stored
	})) throw new Error("RESET_INVALID");
	await setCredentialPassword(context.userId, data.newPassword);
	return { ok: true };
});
async function ensureOwnerUser() {
	const existing = await findUserByEmail(OWNER_EMAIL);
	if (existing) {
		await ensureProfile(existing, "admin", "ACTIVE");
		return existing;
	}
	const userId = await createCredentialUser("Workspace owner", OWNER_EMAIL, randomBytes(24).toString("hex") + "Aa1!");
	await ensureProfile(userId, "admin", "ACTIVE");
	return userId;
}
async function createSessionToken(userId) {
	const session = await (await auth.$context).internalAdapter.createSession(userId);
	if (!session?.token) throw new Error("Could not sign in");
	return session.token;
}
var unlockSuperAdmin_createServerFn_handler = createServerRpc({
	id: "c55b262b31dba118d22bb0835f279988501a9ada405f9faa7f0e600d7b198a59",
	name: "unlockSuperAdmin",
	filename: "src/lib/server/team-access.ts"
}, (opts) => unlockSuperAdmin.__executeServer(opts));
var unlockSuperAdmin = createServerFn({ method: "POST" }).validator((input) => PasswordSchema.parse(input)).handler(unlockSuperAdmin_createServerFn_handler, async ({ data }) => {
	(await load_isolation()).assertSameSiteRequest();
	const ip = "sa";
	if (!rateLimit(ip)) throw new Error("SUPER_ADMIN_LOCKED");
	const stored = await (await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH");
	if (!stored) throw new Error("SUPER_ADMIN_UNSET");
	if (!await verifySecret(data.password, stored)) {
		recordFail(ip);
		throw new Error("SUPER_ADMIN_INVALID");
	}
	return {
		ok: true,
		token: await createSessionToken(await ensureOwnerUser())
	};
});
var elevateToAdmin_createServerFn_handler = createServerRpc({
	id: "d144d934a4e6f3569c062651990e27c140a357e105d2caf0d1ba90cca55e46b3",
	name: "elevateToAdmin",
	filename: "src/lib/server/team-access.ts"
}, (opts) => elevateToAdmin.__executeServer(opts));
var elevateToAdmin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PasswordSchema.parse(input)).handler(elevateToAdmin_createServerFn_handler, async ({ context, data }) => {
	if (!rateLimit(context.userId)) throw new Error("SUPER_ADMIN_LOCKED");
	const stored = await (await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH");
	if (!stored) throw new Error("SUPER_ADMIN_UNSET");
	if (!await verifySecret(data.password, stored)) {
		recordFail(context.userId);
		throw new Error("SUPER_ADMIN_INVALID");
	}
	await ensureProfile(context.userId, "admin", "ACTIVE");
	try {
		const { onAuthEvent } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onAuthEvent({
			actorId: context.userId,
			action: "auth.super_admin",
			summary: "Super Admin elevation"
		});
	} catch {}
	return { ok: true };
});
//#endregion
export { changeOwnPassword_createServerFn_handler, completePasswordReset_createServerFn_handler, createMemberResetLink_createServerFn_handler, createTeamLogin_createServerFn_handler, elevateToAdmin_createServerFn_handler, listTeamLogins_createServerFn_handler, requestPasswordReset_createServerFn_handler, revokeTeamLogin_createServerFn_handler, setMemberPassword_createServerFn_handler, setSuperAdminPassword_createServerFn_handler, unlockSuperAdmin_createServerFn_handler };
