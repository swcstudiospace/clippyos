import { A as isMissingTable, B as mapTeamMember, I as mapPayment } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/money-BLxnpxZv.js
var money_exports = /* @__PURE__ */ __exportAll({
	getMoneySnapshot: () => getMoneySnapshot,
	readPayments: () => readPayments,
	readTeamMembers: () => readTeamMembers
});
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
async function readPayments() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("payments").select("*").order("due_date", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapPayment(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from payments order by due_date desc")).map(mapPayment);
}
async function readTeamMembers() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("team_members").select("*").is("deleted_at", null);
		if (!error) return (data ?? []).map((row) => mapTeamMember(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from team_members where deleted_at is null")).map(mapTeamMember);
}
var getMoneySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("37ad4f7bcfb156ee6382bd7e2e70c60f2f14c3daa62bb6ae3de4e6ed23938c90"));
//#endregion
export { readTeamMembers as i, money_exports as n, readPayments as r, getMoneySnapshot as t };
