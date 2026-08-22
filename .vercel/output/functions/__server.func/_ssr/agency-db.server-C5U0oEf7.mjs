import { r as __exportAll } from "../_runtime.mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as getSql } from "./db-Bjmpu96a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agency-db.server-C5U0oEf7.js
var agency_db_server_C5U0oEf7_exports = /* @__PURE__ */ __exportAll({
	n: () => getAgencyAdmin,
	r: () => localSql,
	t: () => agency_db_server_exports
});
var agency_db_server_exports = /* @__PURE__ */ __exportAll$1({
	getAgencyAdmin: () => getAgencyAdmin,
	localSql: () => localSql,
	supabaseTableReady: () => supabaseTableReady
});
async function getAgencyAdmin() {
	const { tryCreateAdminClient } = await import("./clients.server-54cTCuV1.mjs");
	return tryCreateAdminClient();
}
async function supabaseTableReady(admin, table) {
	const { error } = await admin.from(table).select("*").limit(0);
	return !error || !isMissingTable(error);
}
async function localSql() {
	return getSql();
}
//#endregion
export { getAgencyAdmin as n, localSql as r, agency_db_server_C5U0oEf7_exports as t };
