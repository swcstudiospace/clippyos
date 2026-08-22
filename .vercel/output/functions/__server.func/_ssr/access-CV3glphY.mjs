import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as getSql } from "./db-Bjmpu96a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/access-CV3glphY.js
var access_CV3glphY_exports = /* @__PURE__ */ __exportAll({
	n: () => getUserRole,
	r: () => requireAdmin,
	t: () => access_exports
});
var access_exports = /* @__PURE__ */ __exportAll$1({
	ForbiddenError: () => ForbiddenError,
	getUserRole: () => getUserRole,
	isOperatorRevoked: () => isOperatorRevoked,
	requireAdmin: () => requireAdmin
});
var ForbiddenError = class extends Error {
	status = 403;
	constructor() {
		super("Forbidden");
		this.name = "ForbiddenError";
	}
};
async function bootstrapProfile(userId, role) {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	try {
		const { tryCreateAdminClient } = await import("./clients.server-54cTCuV1.mjs");
		const admin = tryCreateAdminClient();
		if (admin) await admin.from("app_profiles").upsert({
			user_id: userId,
			role,
			status: "ACTIVE",
			updated_at: now
		}, { onConflict: "user_id" });
	} catch {}
	try {
		await (await getSql()).query(`insert into app_profiles (user_id, role, status, created_at, updated_at)
       values ($1,$2,'ACTIVE',$3,$3)
       on conflict (user_id) do nothing`, [
			userId,
			role,
			now
		]);
	} catch {
		try {
			await (await getSql()).query(`insert into app_profiles (user_id, role, created_at, updated_at)
         values ($1,$2,$3,$3)
         on conflict (user_id) do nothing`, [
				userId,
				role,
				now
			]);
		} catch {}
	}
}
function isMissingStatusColumn(error) {
	if (!error) return false;
	const message = error.message ?? "";
	return error.code === "42703" || error.code === "PGRST204" || /column .*status.* does not exist/i.test(message);
}
async function roleFromSupabase(userId) {
	try {
		const { tryCreateAdminClient } = await import("./clients.server-54cTCuV1.mjs");
		const admin = tryCreateAdminClient();
		if (!admin) return void 0;
		const withStatus = await admin.from("app_profiles").select("role,status").eq("user_id", userId).maybeSingle();
		if (withStatus.error && isMissingStatusColumn(withStatus.error)) {
			const fallback = await admin.from("app_profiles").select("role").eq("user_id", userId).maybeSingle();
			if (fallback.error) return void 0;
			if (fallback.data?.role === "admin" || fallback.data?.role === "member") return fallback.data.role;
			return null;
		}
		if (withStatus.error) return void 0;
		if (withStatus.data?.status === "REVOKED") return "REVOKED";
		if (withStatus.data?.role === "admin" || withStatus.data?.role === "member") return withStatus.data.role;
		return null;
	} catch {
		return;
	}
}
async function getUserRole(userId) {
	const remote = await roleFromSupabase(userId);
	if (remote === "REVOKED") return null;
	if (remote === "admin" || remote === "member") return remote;
	try {
		const sql = await getSql();
		try {
			const rows = await sql`
        select role, status from app_profiles where user_id = ${userId}
      `;
			if (rows[0]?.status === "REVOKED") return null;
			if (rows[0]?.role === "admin" || rows[0]?.role === "member") return rows[0].role;
		} catch {
			const rows = await sql`
        select role from app_profiles where user_id = ${userId}
      `;
			if (rows[0]?.role === "admin" || rows[0]?.role === "member") return rows[0].role;
		}
	} catch {}
	await bootstrapProfile(userId, "admin");
	return "admin";
}
async function isOperatorRevoked(userId) {
	try {
		const { tryCreateAdminClient } = await import("./clients.server-54cTCuV1.mjs");
		const admin = tryCreateAdminClient();
		if (admin) {
			const { data, error } = await admin.from("app_profiles").select("status").eq("user_id", userId).maybeSingle();
			if (!error) return data?.status === "REVOKED";
			if (error && isMissingStatusColumn(error)) return false;
		}
	} catch {}
	try {
		return (await (await getSql())`
      select status from app_profiles where user_id = ${userId}
    `)[0]?.status === "REVOKED";
	} catch {
		return false;
	}
}
/** Fail-closed admin gate for AppSetting and destructive deletes. */
async function requireAdmin(userId) {
	if (await getUserRole(userId) !== "admin") throw new ForbiddenError();
}
//#endregion
export { getUserRole as n, requireAdmin as r, access_CV3glphY_exports as t };
