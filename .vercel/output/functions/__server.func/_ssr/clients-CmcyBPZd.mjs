import { r as __exportAll } from "../_runtime.mjs";
import { Bt as _enum, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, L as mapProgress, f as PLAN_TYPES, g as PROGRESS_STAGES, i as CLIENT_ONBOARDING_STEPS, j as mapClient } from "./mappers-Bmic_hyw.mjs";
import { d as todayIsoDate, n as addMonthsIso } from "./format-DaT2NYM9.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients-CmcyBPZd.js
var clients_CmcyBPZd_exports = /* @__PURE__ */ __exportAll({
	_: () => softDeleteClient,
	a: () => internalMarkPaymentPaid,
	c: () => listClients,
	d: () => readClients,
	f: () => readProgress,
	g: () => setClientStage,
	h: () => setClientOnboardingStep,
	i: () => getClientBundle,
	l: () => listProgress,
	m: () => saveClient,
	n: () => clients_exports,
	o: () => internalSaveClient,
	p: () => refreshClientAnalysis,
	r: () => getAiStatus,
	s: () => internalSetClientStage,
	t: () => analyzeChannel,
	u: () => markPaymentPaid,
	v: () => updateClientNotes
});
var clients_exports = /* @__PURE__ */ __exportAll$1({
	analyzeChannel: () => analyzeChannel,
	getAiStatus: () => getAiStatus,
	getClientBundle: () => getClientBundle,
	internalMarkPaymentPaid: () => internalMarkPaymentPaid,
	internalSaveClient: () => internalSaveClient,
	internalSetClientStage: () => internalSetClientStage,
	listClients: () => listClients,
	listProgress: () => listProgress,
	markPaymentPaid: () => markPaymentPaid,
	readClients: () => readClients,
	readProgress: () => readProgress,
	refreshClientAnalysis: () => refreshClientAnalysis,
	saveClient: () => saveClient,
	setClientOnboardingStep: () => setClientOnboardingStep,
	setClientStage: () => setClientStage,
	softDeleteClient: () => softDeleteClient,
	updateClientNotes: () => updateClientNotes
});
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var PlanSchema = _enum(PLAN_TYPES);
var StageSchema = _enum(PROGRESS_STAGES);
var SaveSchema = object({
	id: string().optional(),
	name: string().trim().min(1).max(200),
	channelUrl: string().trim().max(500).nullable(),
	channelThumbnail: string().trim().max(1e3).nullable(),
	channelSummary: string().max(8e3).nullable(),
	offers: string().max(8e3).nullable(),
	contentStrategy: string().max(2e4).nullable(),
	planType: PlanSchema,
	customPlanLabel: string().trim().max(120).nullable(),
	setupFee: number().min(0).max(1e6),
	monthlyFee: number().min(0).max(1e6).nullable(),
	startDate: string().nullable(),
	notes: string().max(2e4).nullable()
});
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function assertPlan(input) {
	if (input.planType === "CUSTOM") {
		if (!input.customPlanLabel) throw new Error("CUSTOM_PLAN_LABEL");
		const fee = input.monthlyFee ?? 0;
		if (fee < 0 || fee > 2e4 || fee % 1e3 !== 0) throw new Error("CUSTOM_FEE");
	}
}
function sanitizeNullable(value) {
	if (value == null || value === "") return null;
	return sanitizeText(value);
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
async function readProgress() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("client_progress").select("*").order("created_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapProgress(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from client_progress order by created_at desc")).map(mapProgress);
}
var listClients = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("968d4fe6ee7915f92bcd90cc89ecfc26697868aa2a33764fff8fd32a2c733c9a"));
var listProgress = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("787e6d38446b68e5437028dc4199cd000b9a50174c1e52f838d75db18168f293"));
var getClientBundle = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("927bfcb6351f2e63d261670fcd3a9c92e08d887f5e4c4945f3237a999ed123f4"));
async function upsertClientRow(payload, isInsert) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await (isInsert ? admin.from("clients").insert(payload) : admin.from("clients").update(payload).eq("id", payload.id));
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	if (isInsert) {
		await sql.query(`insert into clients (
        id, name, channel_url, channel_thumbnail, channel_summary, offers, content_strategy,
        plan_type, custom_plan_label, setup_fee, monthly_fee, start_date, status,
        notes, created_at, updated_at, created_by, deleted_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ACTIVE',$13,$14,$14,$15,null
      )`, [
			payload.id,
			payload.name,
			payload.channel_url,
			payload.channel_thumbnail,
			payload.channel_summary,
			payload.offers,
			payload.content_strategy,
			payload.plan_type,
			payload.custom_plan_label,
			payload.setup_fee,
			payload.monthly_fee,
			payload.start_date,
			payload.notes,
			payload.updated_at,
			payload.created_by
		]);
		return;
	}
	await sql.query(`update clients set
      name=$2, channel_url=$3, channel_thumbnail=$4, channel_summary=$5, offers=$6,
      content_strategy=$7, plan_type=$8, custom_plan_label=$9, setup_fee=$10,
      monthly_fee=$11, start_date=$12, notes=$13, updated_at=$14
     where id=$1`, [
		payload.id,
		payload.name,
		payload.channel_url,
		payload.channel_thumbnail,
		payload.channel_summary,
		payload.offers,
		payload.content_strategy,
		payload.plan_type,
		payload.custom_plan_label,
		payload.setup_fee,
		payload.monthly_fee,
		payload.start_date,
		payload.notes,
		payload.updated_at
	]);
}
async function insertProgress(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("client_progress").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into client_progress (id, client_id, stage, source, notes, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$6,$7)`, [
		row.id,
		row.client_id,
		row.stage,
		row.source,
		row.notes,
		row.created_at,
		row.created_by
	]);
}
async function insertPayment(row) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("payments").insert(row);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query(`insert into payments (id, client_id, amount, type, due_date, paid_date, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9)`, [
		row.id,
		row.client_id,
		row.amount,
		row.type,
		row.due_date,
		row.paid_date,
		row.status,
		row.created_at,
		row.created_by
	]);
}
async function internalSetClientStage(input) {
	if (!input.skipApproval && input.source === "MANUAL") try {
		const { readApprovalPolicy, createApprovalRequest } = await import("./approvals.server-Bpax_gE8.mjs");
		if ((await readApprovalPolicy()).stageAdvanceRequiresApproval) return {
			ok: true,
			id: (await createApprovalRequest({
				clientId: input.clientId,
				type: "STAGE_ADVANCE",
				resourceType: "ClientProgress",
				resourceId: input.clientId,
				title: `Advance stage to ${input.stage}`,
				summary: input.notes,
				payload: {
					clientId: input.clientId,
					stage: input.stage,
					notes: input.notes
				},
				requestedBy: input.actorId
			})).id,
			awaitingApproval: true
		};
	} catch {}
	const stamp = nowIso();
	const id = newId();
	await insertProgress({
		id,
		client_id: input.clientId,
		stage: input.stage,
		source: input.source,
		notes: sanitizeNullable(input.notes),
		created_at: stamp,
		updated_at: stamp,
		created_by: input.actorId
	});
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: input.actorId,
			actorType: input.actorId.startsWith("portal:") ? "PORTAL" : input.actorId.startsWith("agent:") ? "HERMES" : input.actorId === "discord-status-agent" ? "SYSTEM" : "USER",
			action: "progress.stage_changed",
			entityType: "client_progress",
			entityId: id,
			clientId: input.clientId,
			summary: `Stage set to ${input.stage}`,
			metadata: {
				stage: input.stage,
				source: input.source
			}
		});
		const { notifyPortalClient } = await import("./portal.server-Bv5Rx_Kz.mjs");
		await notifyPortalClient({
			clientId: input.clientId,
			category: "PIPELINE",
			title: "Production stage updated",
			body: `Now: ${input.stage.replaceAll("_", " ").toLowerCase()}`,
			href: "/portal/home",
			entityType: "client_progress",
			entityId: id
		});
	} catch {}
	return {
		ok: true,
		id
	};
}
async function internalMarkPaymentPaid(id) {
	const stamp = nowIso();
	const paid = todayIsoDate();
	async function markOnSupabase() {
		const admin = await (await load_agency_db()).getAgencyAdmin();
		if (!admin) return "fallback";
		const existing = await admin.from("payments").select("id,status").eq("id", id).maybeSingle();
		if (existing.error) {
			if (isMissingTable(existing.error)) return "fallback";
			throw new Error("DATA_UNAVAILABLE");
		}
		if (!existing.data) throw new Error("PAYMENT_MISSING");
		if (existing.data.status === "PAID") throw new Error("PAYMENT_ALREADY_PAID");
		const { data, error } = await admin.from("payments").update({
			status: "PAID",
			paid_date: paid,
			updated_at: stamp
		}).eq("id", id).neq("status", "PAID").select("id");
		if (error) {
			if (isMissingTable(error)) return "fallback";
			throw new Error("DATA_UNAVAILABLE");
		}
		if (!data || data.length === 0) throw new Error("PAYMENT_ALREADY_PAID");
		return "ok";
	}
	if (await markOnSupabase() === "ok") return {
		ok: true,
		paidDate: paid
	};
	const sql = await (await load_agency_db()).localSql();
	if ((await sql.query("update payments set status = 'PAID', paid_date = $2, updated_at = $3 where id = $1 and status <> 'PAID' returning id", [
		id,
		paid,
		stamp
	])).length > 0) return {
		ok: true,
		paidDate: paid
	};
	if (!(await sql.query("select status from payments where id = $1", [id]))[0]) throw new Error("PAYMENT_MISSING");
	throw new Error("PAYMENT_ALREADY_PAID");
}
async function internalSaveClient(data, actorId, progressSource = "MANUAL") {
	assertPlan(data);
	let channelUrl = data.channelUrl;
	if (channelUrl) {
		const parsed = parseYouTubeChannelUrl(channelUrl);
		if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
		channelUrl = parsed.canonical;
	}
	const isInsert = !data.id;
	const id = data.id ?? newId();
	const stamp = nowIso();
	let feeChanged = false;
	if (!isInsert) {
		const existing = (await readClients()).find((row) => row.id === id);
		if (existing) feeChanged = Number(existing.setupFee) !== data.setupFee || Number(existing.monthlyFee ?? 0) !== data.monthlyFee;
	}
	const payload = {
		id,
		name: sanitizeText(data.name),
		channel_url: channelUrl,
		channel_thumbnail: data.channelThumbnail,
		channel_summary: sanitizeNullable(data.channelSummary),
		offers: sanitizeNullable(data.offers),
		content_strategy: sanitizeNullable(data.contentStrategy),
		plan_type: data.planType,
		custom_plan_label: data.planType === "CUSTOM" ? sanitizeNullable(data.customPlanLabel) : null,
		setup_fee: data.setupFee,
		monthly_fee: data.monthlyFee,
		start_date: data.startDate ?? todayIsoDate(),
		notes: sanitizeNullable(data.notes),
		updated_at: stamp,
		created_by: actorId
	};
	await upsertClientRow(payload, isInsert);
	if (isInsert) {
		await insertProgress({
			id: newId(),
			client_id: id,
			stage: "WAITING_FOR_FOOTAGE",
			source: progressSource,
			notes: null,
			created_at: stamp,
			updated_at: stamp,
			created_by: actorId
		});
		const start = payload.start_date;
		if (data.setupFee > 0) await insertPayment({
			id: newId(),
			client_id: id,
			amount: data.setupFee,
			type: "SETUP",
			due_date: start,
			paid_date: null,
			status: "PENDING",
			created_at: stamp,
			updated_at: stamp,
			created_by: actorId
		});
		if ((data.monthlyFee ?? 0) > 0) await insertPayment({
			id: newId(),
			client_id: id,
			amount: data.monthlyFee ?? 0,
			type: "MONTHLY",
			due_date: addMonthsIso(start, 1),
			paid_date: null,
			status: "PENDING",
			created_at: stamp,
			updated_at: stamp,
			created_by: actorId
		});
	}
	return {
		id,
		created: isInsert,
		feeChanged
	};
}
var saveClient = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveSchema.parse(input)).handler(createSsrRpc("372736f413eb70c2f02ad63c3c0dfeb83416723d83ac2a92bfeab2d3257a2495"));
var softDeleteClient = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("b95daa34585f5d3e994e959ed9bc2e30c72bd933a751d90055252df5f207088b"));
var setClientStage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	stage: StageSchema,
	notes: string().max(2e3).nullable().optional()
}).parse(input)).handler(createSsrRpc("203745b6498bdd3898d8151204267c87f6be1c1877d07653cd07f7f2d1a977c5"));
var updateClientNotes = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	notes: string().max(2e4)
}).parse(input)).handler(createSsrRpc("47050b57cfbafa392a1cbab11bbdf0a68197a15c97fd5fb5bf9022497cb6097c"));
var OnboardingStepSchema = object({
	clientId: string().min(1),
	step: _enum(CLIENT_ONBOARDING_STEPS),
	done: boolean()
});
var setClientOnboardingStep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OnboardingStepSchema.parse(input)).handler(createSsrRpc("d7711e87f3d77a083b60e736ec339692e997e0dcf9eb58c5ffdf92cd30a58f0c"));
var markPaymentPaid = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("5dfdfeff7a839d5e33e3bffcf331f216548b6133518befbee8ab4f51af088a79"));
var getAiStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("aba98b0758090da28ff10a8baaa43aad33151427296a7035264eed6e318590fd"));
var analyzeChannel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((url) => string().min(1).parse(url)).handler(createSsrRpc("bdf569510fdb97140e62af111b4ea7d0da549f4b8e865e181f2935219fa07525"));
var refreshClientAnalysis = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("9e2d526fe4c83f65e94bb915481bff59ecdb6aa8d44f9fb00a046e7a8ec2cc7d"));
//#endregion
export { softDeleteClient as _, internalMarkPaymentPaid as a, listClients as c, readClients as d, readProgress as f, setClientStage as g, setClientOnboardingStep as h, getClientBundle as i, listProgress as l, saveClient as m, clients_CmcyBPZd_exports as n, internalSaveClient as o, refreshClientAnalysis as p, getAiStatus as r, internalSetClientStage as s, analyzeChannel as t, markPaymentPaid as u, updateClientNotes as v };
