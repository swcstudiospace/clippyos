import { A as isMissingTable, B as mapTeamMember, I as mapPayment, j as mapClient } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/money-uP_UlduJ.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
async function readClients() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("clients").select("*").order("name");
		if (!error) return (data ?? []).map((row) => mapClient(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from clients order by name")).map(mapClient);
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
var getMoneySnapshot_createServerFn_handler = createServerRpc({
	id: "37ad4f7bcfb156ee6382bd7e2e70c60f2f14c3daa62bb6ae3de4e6ed23938c90",
	name: "getMoneySnapshot",
	filename: "src/lib/server/money.ts"
}, (opts) => getMoneySnapshot.__executeServer(opts));
var getMoneySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMoneySnapshot_createServerFn_handler, async () => {
	const [clients, payments, teamMembers] = await Promise.all([
		readClients(),
		readPayments(),
		readTeamMembers()
	]);
	return {
		clients,
		payments,
		teamMembers
	};
});
//#endregion
export { getMoneySnapshot_createServerFn_handler };
