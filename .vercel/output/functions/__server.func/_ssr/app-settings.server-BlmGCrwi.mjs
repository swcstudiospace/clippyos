import { r as __exportAll } from "../_runtime.mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-settings.server-BlmGCrwi.js
var app_settings_server_BlmGCrwi_exports = /* @__PURE__ */ __exportAll({
	i: () => writeAppSetting,
	n: () => deleteAppSetting,
	r: () => readAppSetting,
	t: () => app_settings_server_exports
});
var app_settings_server_exports = /* @__PURE__ */ __exportAll$1({
	deleteAppSetting: () => deleteAppSetting,
	readAppSetting: () => readAppSetting,
	readAppSettingsMap: () => readAppSettingsMap,
	writeAppSetting: () => writeAppSetting
});
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
async function readAppSettingsMap() {
	const map = /* @__PURE__ */ new Map();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("app_settings").select("key,value");
		if (!error) {
			for (const row of data ?? []) {
				const record = row;
				if (record.key && record.value) map.set(record.key, record.value);
			}
			return map;
		}
		if (!isMissingTable(error)) return map;
	}
	try {
		const rows = await (await localSql()).query("select key, value from app_settings");
		for (const row of rows) if (row.key && row.value) map.set(row.key, row.value);
	} catch {}
	return map;
}
async function readAppSetting(key) {
	return (await readAppSettingsMap()).get(key) ?? null;
}
async function writeAppSetting(key, value) {
	const now = nowIso();
	const id = crypto.randomUUID();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("app_settings").upsert({
			id,
			key,
			value,
			created_at: now,
			updated_at: now,
			created_by: null
		}, { onConflict: "key" });
		if (error && !isMissingTable(error)) {
			const existing = await admin.from("app_settings").select("id").eq("key", key).maybeSingle();
			if (existing.data && typeof existing.data.id === "string") await admin.from("app_settings").update({
				value,
				updated_at: now
			}).eq("id", existing.data.id);
			else if (!existing.error || isMissingTable(existing.error)) await admin.from("app_settings").insert({
				id,
				key,
				value,
				created_at: now,
				updated_at: now,
				created_by: null
			});
		}
	}
	try {
		await (await localSql()).query(`insert into app_settings (id, key, value, created_at, updated_at, created_by)
       values ($1, $2, $3, $4, $5, null)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`, [
			id,
			key,
			value,
			now,
			now
		]);
	} catch {}
}
async function deleteAppSetting(key) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("app_settings").delete().eq("key", key);
		if (error && !isMissingTable(error)) {}
	}
	try {
		await (await localSql()).query("delete from app_settings where key = $1", [key]);
	} catch {}
}
//#endregion
export { writeAppSetting as i, deleteAppSetting as n, readAppSetting as r, app_settings_server_BlmGCrwi_exports as t };
