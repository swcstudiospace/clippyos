import { Bt as _enum, Jt as object, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, F as mapLead, u as LEAD_STATUSES } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/leads-CIVwufAh.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var SaveLeadSchema = object({
	id: string().min(1).optional(),
	name: string().trim().min(1).max(200),
	channelUrl: string().trim().max(500).nullable(),
	notes: string().max(2e4).nullable(),
	status: _enum(LEAD_STATUSES),
	upfrontCash: number().min(0).max(1e6),
	monthlyRecurring: number().min(0).max(1e6)
});
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function sanitizeNullable(value) {
	if (value == null || value === "") return null;
	return sanitizeText(value);
}
async function readLeads() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("leads").select("*").order("updated_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapLead(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from leads order by updated_at desc")).map(mapLead);
}
async function internalSaveLead(data, actorId) {
	const stamp = nowIso();
	const isInsert = !data.id;
	const id = data.id ?? newId();
	const payload = {
		id,
		name: sanitizeText(data.name),
		channel_url: sanitizeNullable(data.channelUrl),
		notes: sanitizeNullable(data.notes),
		status: data.status,
		upfront_cash: data.upfrontCash,
		monthly_recurring: data.monthlyRecurring,
		updated_at: stamp,
		created_at: stamp,
		created_by: actorId,
		deleted_at: null
	};
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		if (isInsert) {
			const { error } = await admin.from("leads").insert(payload);
			if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
			if (!error) return mapLead(payload);
		} else {
			const existing = await admin.from("leads").select("*").eq("id", id).maybeSingle();
			if (existing.error && !isMissingTable(existing.error)) throw new Error("DATA_UNAVAILABLE");
			if (!existing.error) {
				if (!existing.data) throw new Error("LEAD_MISSING");
				const { error } = await admin.from("leads").update({
					name: payload.name,
					channel_url: payload.channel_url,
					notes: payload.notes,
					status: payload.status,
					upfront_cash: payload.upfront_cash,
					monthly_recurring: payload.monthly_recurring,
					updated_at: stamp
				}).eq("id", id).is("deleted_at", null);
				if (error) throw new Error("DATA_UNAVAILABLE");
				const current = await admin.from("leads").select("*").eq("id", id).maybeSingle();
				if (current.data) return mapLead(current.data);
			}
		}
	}
	const sql = await (await load_agency_db()).localSql();
	if (isInsert) await sql.query(`insert into leads (
          id, name, channel_url, notes, status, upfront_cash, monthly_recurring,
          created_at, updated_at, created_by, deleted_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,null)`, [
		payload.id,
		payload.name,
		payload.channel_url,
		payload.notes,
		payload.status,
		payload.upfront_cash,
		payload.monthly_recurring,
		stamp,
		actorId
	]);
	else {
		if (!(await sql.query("select id from leads where id = $1 and deleted_at is null", [id]))[0]) throw new Error("LEAD_MISSING");
		await sql.query(`update leads set
          name=$2, channel_url=$3, notes=$4, status=$5,
          upfront_cash=$6, monthly_recurring=$7, updated_at=$8
         where id=$1 and deleted_at is null`, [
			id,
			payload.name,
			payload.channel_url,
			payload.notes,
			payload.status,
			payload.upfront_cash,
			payload.monthly_recurring,
			stamp
		]);
	}
	const rows = await sql.query("select * from leads where id = $1", [id]);
	if (!rows[0]) throw new Error("LEAD_MISSING");
	return mapLead(rows[0]);
}
var listLeads_createServerFn_handler = createServerRpc({
	id: "d20028d52bf23e06e765fd5f9ef65eb26fe51e974f6e76195c6468d572642b8a",
	name: "listLeads",
	filename: "src/lib/server/leads.ts"
}, (opts) => listLeads.__executeServer(opts));
var listLeads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listLeads_createServerFn_handler, async () => {
	return (await readLeads()).filter((lead) => !lead.deletedAt);
});
var saveLead_createServerFn_handler = createServerRpc({
	id: "8e3d1e2c8280dc6e010c59e6935172aba8935f272ad02cc556abb61ed66b532d",
	name: "saveLead",
	filename: "src/lib/server/leads.ts"
}, (opts) => saveLead.__executeServer(opts));
var saveLead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveLeadSchema.parse(input)).handler(saveLead_createServerFn_handler, async ({ context, data }) => {
	return internalSaveLead(data, context.userId);
});
var softDeleteLead_createServerFn_handler = createServerRpc({
	id: "ca3ea92dd652ccb435560128fc3608af4fffce9a5f43e703a30f278553302622",
	name: "softDeleteLead",
	filename: "src/lib/server/leads.ts"
}, (opts) => softDeleteLead.__executeServer(opts));
var softDeleteLead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(softDeleteLead_createServerFn_handler, async ({ data: id }) => {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const existing = await admin.from("leads").select("id").eq("id", id).maybeSingle();
		if (existing.error && !isMissingTable(existing.error)) throw new Error("DATA_UNAVAILABLE");
		if (!existing.error) {
			if (!existing.data) throw new Error("LEAD_MISSING");
			const { error } = await admin.from("leads").update({
				deleted_at: stamp,
				status: "LOST",
				updated_at: stamp
			}).eq("id", id);
			if (error) throw new Error("DATA_UNAVAILABLE");
			return { ok: true };
		}
	}
	if ((await (await (await load_agency_db()).localSql()).query("update leads set deleted_at = $2, status = 'LOST', updated_at = $2 where id = $1 and deleted_at is null returning id", [id, stamp])).length === 0) throw new Error("LEAD_MISSING");
	return { ok: true };
});
//#endregion
export { listLeads_createServerFn_handler, saveLead_createServerFn_handler, softDeleteLead_createServerFn_handler };
