import { Bt as _enum, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, B as mapTeamMember, I as mapPayment, L as mapProgress, R as mapSnapshot, W as parseClientChecklist, f as PLAN_TYPES, g as PROGRESS_STAGES, i as CLIENT_ONBOARDING_STEPS, j as mapClient, w as emptyClientChecklist } from "./mappers-Bmic_hyw.mjs";
import { d as todayIsoDate, n as addMonthsIso } from "./format-DaT2NYM9.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients-C2NKmSul.js
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
function latestProgress(progress) {
	if (progress.length === 0) return null;
	return [...progress].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)[0] ?? null;
}
function latestStage(progress) {
	return latestProgress(progress)?.stage ?? null;
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
var listClients_createServerFn_handler = createServerRpc({
	id: "968d4fe6ee7915f92bcd90cc89ecfc26697868aa2a33764fff8fd32a2c733c9a",
	name: "listClients",
	filename: "src/lib/server/clients.ts"
}, (opts) => listClients.__executeServer(opts));
var listClients = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listClients_createServerFn_handler, async () => {
	const [clients, progress] = await Promise.all([readClients(), readProgress()]);
	const latest = /* @__PURE__ */ new Map();
	for (const row of progress) if (!latest.has(row.clientId)) latest.set(row.clientId, {
		stage: row.stage,
		source: row.source,
		at: row.updatedAt || row.createdAt
	});
	return clients.map((client) => {
		const rec = latest.get(client.id);
		return {
			...client,
			currentStage: rec?.stage ?? null,
			currentSource: rec?.source ?? null,
			currentStageAt: rec?.at ?? null
		};
	});
});
var listProgress_createServerFn_handler = createServerRpc({
	id: "787e6d38446b68e5437028dc4199cd000b9a50174c1e52f838d75db18168f293",
	name: "listProgress",
	filename: "src/lib/server/clients.ts"
}, (opts) => listProgress.__executeServer(opts));
var listProgress = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listProgress_createServerFn_handler, async () => {
	return readProgress();
});
var getClientBundle_createServerFn_handler = createServerRpc({
	id: "927bfcb6351f2e63d261670fcd3a9c92e08d887f5e4c4945f3237a999ed123f4",
	name: "getClientBundle",
	filename: "src/lib/server/clients.ts"
}, (opts) => getClientBundle.__executeServer(opts));
var getClientBundle = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(getClientBundle_createServerFn_handler, async ({ data: id }) => {
	const client = (await readClients()).find((row) => row.id === id) ?? null;
	if (!client) return null;
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const [progressRes, teamRes, payRes, snapRes] = await Promise.all([
			admin.from("client_progress").select("*").eq("client_id", id).order("created_at", { ascending: false }),
			admin.from("team_members").select("*").eq("client_id", id).is("deleted_at", null),
			admin.from("payments").select("*").eq("client_id", id).order("due_date", { ascending: false }),
			admin.from("analytics_snapshots").select("*").eq("client_id", id).order("date", { ascending: false }).limit(1)
		]);
		if (!progressRes.error && !teamRes.error && !payRes.error) {
			const progress = (progressRes.data ?? []).map((row) => mapProgress(row));
			return {
				client,
				progress,
				currentStage: latestStage(progress),
				currentSource: latestProgress(progress)?.source ?? null,
				team: (teamRes.data ?? []).map((row) => mapTeamMember(row)),
				payments: (payRes.data ?? []).map((row) => mapPayment(row)),
				analytics: snapRes.data?.[0] ? mapSnapshot(snapRes.data[0]) : null
			};
		}
		if (![
			progressRes.error,
			teamRes.error,
			payRes.error,
			snapRes.error
		].every((err) => !err || isMissingTable(err))) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	const progress = (await sql.query("select * from client_progress where client_id = $1 order by created_at desc", [id])).map(mapProgress);
	const team = (await sql.query("select * from team_members where client_id = $1 and deleted_at is null", [id])).map(mapTeamMember);
	const payments = (await sql.query("select * from payments where client_id = $1 order by due_date desc", [id])).map(mapPayment);
	const snapshots = await sql.query("select * from analytics_snapshots where client_id = $1 order by date desc limit 1", [id]);
	return {
		client,
		progress,
		currentStage: latestStage(progress),
		currentSource: latestProgress(progress)?.source ?? null,
		team,
		payments,
		analytics: snapshots[0] ? mapSnapshot(snapshots[0]) : null
	};
});
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
var saveClient_createServerFn_handler = createServerRpc({
	id: "372736f413eb70c2f02ad63c3c0dfeb83416723d83ac2a92bfeab2d3257a2495",
	name: "saveClient",
	filename: "src/lib/server/clients.ts"
}, (opts) => saveClient.__executeServer(opts));
var saveClient = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveSchema.parse(input)).handler(saveClient_createServerFn_handler, async ({ context, data }) => {
	const result = await internalSaveClient(data, context.userId, "MANUAL");
	try {
		const { onClientMutated, onPaymentCreated } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onClientMutated({
			actorId: context.userId,
			action: result.created ? "client.created" : "client.updated",
			clientId: result.id,
			summary: result.created ? "Client created" : "Client updated"
		});
		if (result.created) {
			const { readPayments } = await import("./money-BLxnpxZv.mjs").then((n) => n.n);
			const payments = (await readPayments()).filter((row) => row.clientId === result.id);
			for (const payment of payments) await onPaymentCreated({
				actorId: context.userId,
				paymentId: payment.id,
				clientId: result.id,
				amount: payment.amount,
				type: payment.type
			});
		} else if (result.feeChanged) await onClientMutated({
			actorId: context.userId,
			action: "client.plan_fee_changed",
			clientId: result.id,
			summary: "Plan fee changed",
			metadata: {
				setupFee: data.setupFee,
				monthlyFee: data.monthlyFee
			}
		});
	} catch {}
	return { id: result.id };
});
var softDeleteClient_createServerFn_handler = createServerRpc({
	id: "b95daa34585f5d3e994e959ed9bc2e30c72bd933a751d90055252df5f207088b",
	name: "softDeleteClient",
	filename: "src/lib/server/clients.ts"
}, (opts) => softDeleteClient.__executeServer(opts));
var softDeleteClient = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(softDeleteClient_createServerFn_handler, async ({ context, data: id }) => {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("clients").update({
			status: "CHURNED",
			deleted_at: stamp,
			updated_at: stamp
		}).eq("id", id);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) {
			try {
				const { onClientMutated } = await import("./safety-hooks.server-CNuRbzza.mjs");
				await onClientMutated({
					actorId: context.userId,
					action: "client.deleted",
					clientId: id,
					summary: "Client archived"
				});
			} catch {}
			return { ok: true };
		}
	}
	await (await (await load_agency_db()).localSql()).query("update clients set status = 'CHURNED', deleted_at = $2, updated_at = $2 where id = $1", [id, stamp]);
	try {
		const { onClientMutated } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onClientMutated({
			actorId: context.userId,
			action: "client.deleted",
			clientId: id,
			summary: "Client archived"
		});
	} catch {}
	return { ok: true };
});
var setClientStage_createServerFn_handler = createServerRpc({
	id: "203745b6498bdd3898d8151204267c87f6be1c1877d07653cd07f7f2d1a977c5",
	name: "setClientStage",
	filename: "src/lib/server/clients.ts"
}, (opts) => setClientStage.__executeServer(opts));
var setClientStage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	stage: StageSchema,
	notes: string().max(2e3).nullable().optional()
}).parse(input)).handler(setClientStage_createServerFn_handler, async ({ context, data }) => {
	return internalSetClientStage({
		clientId: data.clientId,
		stage: data.stage,
		source: "MANUAL",
		notes: data.notes ?? null,
		actorId: context.userId
	});
});
var updateClientNotes_createServerFn_handler = createServerRpc({
	id: "47050b57cfbafa392a1cbab11bbdf0a68197a15c97fd5fb5bf9022497cb6097c",
	name: "updateClientNotes",
	filename: "src/lib/server/clients.ts"
}, (opts) => updateClientNotes.__executeServer(opts));
var updateClientNotes = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	notes: string().max(2e4)
}).parse(input)).handler(updateClientNotes_createServerFn_handler, async ({ data }) => {
	const stamp = nowIso();
	const notes = sanitizeText(data.notes);
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("clients").update({
			notes,
			updated_at: stamp
		}).eq("id", data.id);
		if (!error) return { ok: true };
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await (await load_agency_db()).localSql()).query("update clients set notes = $2, updated_at = $3 where id = $1", [
		data.id,
		notes,
		stamp
	]);
	return { ok: true };
});
var OnboardingStepSchema = object({
	clientId: string().min(1),
	step: _enum(CLIENT_ONBOARDING_STEPS),
	done: boolean()
});
var setClientOnboardingStep_createServerFn_handler = createServerRpc({
	id: "d7711e87f3d77a083b60e736ec339692e997e0dcf9eb58c5ffdf92cd30a58f0c",
	name: "setClientOnboardingStep",
	filename: "src/lib/server/clients.ts"
}, (opts) => setClientOnboardingStep.__executeServer(opts));
var setClientOnboardingStep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OnboardingStepSchema.parse(input)).handler(setClientOnboardingStep_createServerFn_handler, async ({ data }) => {
	const client = (await readClients()).find((row) => row.id === data.clientId);
	if (!client) throw new Error("DATA_UNAVAILABLE");
	const current = parseClientChecklist(client.onboardingChecklist ?? emptyClientChecklist());
	current.steps[data.step] = {
		done: data.done,
		at: data.done ? nowIso() : null
	};
	const stamp = nowIso();
	const payload = JSON.stringify(current);
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("clients").update({
			onboarding_checklist: payload,
			updated_at: stamp
		}).eq("id", data.clientId);
		if (!error) return {
			ok: true,
			checklist: current
		};
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	try {
		await sql.query("update clients set onboarding_checklist = $2, updated_at = $3 where id = $1", [
			data.clientId,
			payload,
			stamp
		]);
	} catch {
		await sql.query("alter table clients add column if not exists onboarding_checklist text");
		await sql.query("update clients set onboarding_checklist = $2, updated_at = $3 where id = $1", [
			data.clientId,
			payload,
			stamp
		]);
	}
	return {
		ok: true,
		checklist: current
	};
});
var markPaymentPaid_createServerFn_handler = createServerRpc({
	id: "5dfdfeff7a839d5e33e3bffcf331f216548b6133518befbee8ab4f51af088a79",
	name: "markPaymentPaid",
	filename: "src/lib/server/clients.ts"
}, (opts) => markPaymentPaid.__executeServer(opts));
var markPaymentPaid = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(markPaymentPaid_createServerFn_handler, async ({ context, data: id }) => {
	const result = await internalMarkPaymentPaid(id);
	try {
		const { onPaymentMarkedPaid } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onPaymentMarkedPaid({
			actorId: context.userId,
			paymentId: id
		});
	} catch {}
	return result;
});
var getAiStatus_createServerFn_handler = createServerRpc({
	id: "aba98b0758090da28ff10a8baaa43aad33151427296a7035264eed6e318590fd",
	name: "getAiStatus",
	filename: "src/lib/server/clients.ts"
}, (opts) => getAiStatus.__executeServer(opts));
var getAiStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAiStatus_createServerFn_handler, async () => {
	const { llmStatus } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	const { higgsfieldAvailable, imageGenAvailable } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
	const { youtubeDataApiAvailable } = await import("./youtube-data.server-CmwbKs56.mjs");
	const [higgsfield, imageGen, llm, youtubeDataApi] = await Promise.all([
		higgsfieldAvailable(),
		imageGenAvailable(),
		llmStatus(),
		youtubeDataApiAvailable()
	]);
	return {
		llm: llm.available,
		llmSource: llm.source,
		grokEmail: llm.email,
		youtube: true,
		youtubeDataApi,
		higgsfield,
		imageGen
	};
});
var analyzeChannel_createServerFn_handler = createServerRpc({
	id: "bdf569510fdb97140e62af111b4ea7d0da549f4b8e865e181f2935219fa07525",
	name: "analyzeChannel",
	filename: "src/lib/server/clients.ts"
}, (opts) => analyzeChannel.__executeServer(opts));
var analyzeChannel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((url) => string().min(1).parse(url)).handler(analyzeChannel_createServerFn_handler, async ({ data: url }) => {
	const parsed = parseYouTubeChannelUrl(url);
	if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
	const { llmAvailable, synthesizeChannel } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const { fetchChannelSnapshot } = await import("./youtube.server-D98qL7z7.mjs");
	const snapshot = await fetchChannelSnapshot(parsed.canonical);
	const synthesis = await synthesizeChannel(snapshot);
	return {
		name: snapshot.title,
		channelUrl: snapshot.canonicalUrl,
		channelThumbnail: snapshot.thumbnail,
		subscriberCount: snapshot.subscriberCount,
		...synthesis
	};
});
var refreshClientAnalysis_createServerFn_handler = createServerRpc({
	id: "9e2d526fe4c83f65e94bb915481bff59ecdb6aa8d44f9fb00a046e7a8ec2cc7d",
	name: "refreshClientAnalysis",
	filename: "src/lib/server/clients.ts"
}, (opts) => refreshClientAnalysis.__executeServer(opts));
var refreshClientAnalysis = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(refreshClientAnalysis_createServerFn_handler, async ({ data: id }) => {
	const client = (await readClients()).find((row) => row.id === id);
	if (!client?.channelUrl) throw new Error("INVALID_YOUTUBE_URL");
	const { llmAvailable, synthesizeChannel } = await import("./analyze.server-CGOV0UvB.mjs");
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const { fetchChannelSnapshot } = await import("./youtube.server-D98qL7z7.mjs");
	const snapshot = await fetchChannelSnapshot(client.channelUrl);
	const synthesis = await synthesizeChannel(snapshot);
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	const patch = {
		name: snapshot.title || client.name,
		channel_url: snapshot.canonicalUrl,
		channel_thumbnail: snapshot.thumbnail,
		channel_summary: synthesis.channelSummary,
		offers: synthesis.offers,
		content_strategy: synthesis.contentStrategy,
		updated_at: stamp
	};
	if (admin) {
		const { error } = await admin.from("clients").update(patch).eq("id", id);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) return { ok: true };
	}
	await (await (await load_agency_db()).localSql()).query(`update clients set name=$2, channel_url=$3, channel_thumbnail=$4, channel_summary=$5,
        offers=$6, content_strategy=$7, updated_at=$8 where id=$1`, [
		id,
		patch.name,
		patch.channel_url,
		patch.channel_thumbnail,
		patch.channel_summary,
		patch.offers,
		patch.content_strategy,
		stamp
	]);
	return { ok: true };
});
//#endregion
export { analyzeChannel_createServerFn_handler, getAiStatus_createServerFn_handler, getClientBundle_createServerFn_handler, listClients_createServerFn_handler, listProgress_createServerFn_handler, markPaymentPaid_createServerFn_handler, refreshClientAnalysis_createServerFn_handler, saveClient_createServerFn_handler, setClientOnboardingStep_createServerFn_handler, setClientStage_createServerFn_handler, softDeleteClient_createServerFn_handler, updateClientNotes_createServerFn_handler };
