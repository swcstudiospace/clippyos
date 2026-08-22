import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { d as NOTIFICATION_CATEGORIES, g as parseApprovalPolicy, l as DEFAULT_APPROVAL_POLICY, n as APPROVAL_STATUSES } from "./safety-CI611PZC.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { i as writeAppSetting, n as deleteAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { n as getUserRole, r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/safety-fns-DBVxkEDV.js
async function maybeNotifyOverdue() {
	try {
		const { readPayments } = await import("./money-BLxnpxZv.mjs").then((n) => n.n);
		const { displayPaymentStatus } = await import("./money-n66k7fz5.mjs").then((n) => n.c).then((n) => n.c);
		const { todayIsoDate } = await import("./format-DaT2NYM9.mjs").then((n) => n.l).then((n) => n.l);
		const { notifyAdmins } = await import("./notifications.server-CiVCMOdN.mjs");
		const today = todayIsoDate();
		const overdue = (await readPayments()).filter((row) => displayPaymentStatus(row, today) === "OVERDUE");
		if (overdue.length === 0) return;
		let notified = [];
		try {
			const raw = await readAppSetting("OVERDUE_NOTIFIED_JSON");
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) notified = parsed.map(String);
			}
		} catch {
			notified = [];
		}
		const fresh = overdue.filter((row) => !notified.includes(row.id));
		if (fresh.length === 0) return;
		for (const payment of fresh.slice(0, 8)) {
			await notifyAdmins({
				category: "BILLING",
				severity: "CRITICAL",
				title: "Payment overdue",
				body: "A client payment is past due.",
				href: "/money",
				entityType: "payment",
				entityId: payment.id
			});
			notified.push(payment.id);
		}
		await writeAppSetting("OVERDUE_NOTIFIED_JSON", JSON.stringify(notified.slice(-200)));
	} catch {}
}
async function maybeNotifyGuaranteeRisk() {
	try {
		const { readClients } = await import("./clients-CmcyBPZd.mjs").then((n) => n.n).then((n) => n.n);
		const { readSnapshots } = await import("./analytics-Cxeqvuh1.mjs").then((n) => n.t);
		const { deriveGuaranteeItems } = await import("./dashboard-Dk6DLyWe.mjs").then((n) => n.n);
		const { todayIsoDate } = await import("./format-DaT2NYM9.mjs").then((n) => n.l).then((n) => n.l);
		const { onGuaranteeRisk } = await import("./safety-hooks.server-CNuRbzza.mjs");
		const today = todayIsoDate();
		const [clients, snapshots] = await Promise.all([readClients(), readSnapshots()]);
		const atRisk = deriveGuaranteeItems(clients, snapshots, today).filter((item) => item.dayCount >= 25 && item.viewsIncreased !== true);
		if (atRisk.length === 0) return;
		let notified = {};
		try {
			const raw = await readAppSetting("GUARANTEE_NOTIFIED_JSON");
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) notified = parsed;
			}
		} catch {
			notified = {};
		}
		let dirty = false;
		for (const item of atRisk.slice(0, 8)) {
			if (notified[item.clientId] === today) continue;
			await onGuaranteeRisk({
				clientId: item.clientId,
				clientName: item.name,
				dayCount: item.dayCount
			});
			notified[item.clientId] = today;
			dirty = true;
		}
		if (dirty) await writeAppSetting("GUARANTEE_NOTIFIED_JSON", JSON.stringify(notified));
	} catch {}
}
var getSafetyInbox_createServerFn_handler = createServerRpc({
	id: "f1a8f8b902745b590ceaa37de1a8529367441158cbb685c5bf9df3fc820917f7",
	name: "getSafetyInbox",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => getSafetyInbox.__executeServer(opts));
var getSafetyInbox = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSafetyInbox_createServerFn_handler, async ({ context }) => {
	const { listApprovalRequests } = await import("./approvals.server-Bpax_gE8.mjs");
	const { listNotifications, unreadCount } = await import("./notifications.server-CiVCMOdN.mjs");
	const [pending, latest, unread, role] = await Promise.all([
		listApprovalRequests({
			status: "PENDING",
			limit: 40
		}),
		listNotifications(context.userId, { limit: 8 }),
		unreadCount(context.userId),
		getUserRole(context.userId)
	]);
	maybeNotifyOverdue().catch(() => {});
	maybeNotifyGuaranteeRisk().catch(() => {});
	return {
		pendingApprovals: pending.length,
		unreadNotifications: unread,
		latest,
		role
	};
});
var listApprovalsFn_createServerFn_handler = createServerRpc({
	id: "0ceadb4d5f1746640981a4699e7ce1792cb6c5227feaa7cccae6f16a7d93e07b",
	name: "listApprovalsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => listApprovalsFn.__executeServer(opts));
var listApprovalsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	status: _enum(APPROVAL_STATUSES).optional(),
	clientId: string().min(1).optional()
}).parse(input ?? {})).handler(listApprovalsFn_createServerFn_handler, async ({ data }) => {
	const { listApprovalRequests } = await import("./approvals.server-Bpax_gE8.mjs");
	return { items: await listApprovalRequests({
		status: data.status,
		clientId: data.clientId,
		limit: 80
	}) };
});
var decideApprovalFn_createServerFn_handler = createServerRpc({
	id: "05e6cdf2224a05e3a01cbf2f253e70f08832ae00e72e8b301304928b8a03e008",
	name: "decideApprovalFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => decideApprovalFn.__executeServer(opts));
var decideApprovalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum([
		"APPROVED",
		"REJECTED",
		"CANCELED"
	]),
	note: string().max(400).optional()
}).parse(input)).handler(decideApprovalFn_createServerFn_handler, async ({ context, data }) => {
	const { decideApproval } = await import("./approvals.server-Bpax_gE8.mjs");
	return { item: await decideApproval({
		id: data.id,
		actorId: context.userId,
		decision: data.decision,
		note: data.note
	}) };
});
var listNotificationsFn_createServerFn_handler = createServerRpc({
	id: "03c67e4c5f0d96ff66f3a7d0daa42b6c8cb0d615cf798b9addfb16bb5fd1c23c",
	name: "listNotificationsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => listNotificationsFn.__executeServer(opts));
var listNotificationsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotificationsFn_createServerFn_handler, async ({ context }) => {
	const { listNotifications } = await import("./notifications.server-CiVCMOdN.mjs");
	return { items: await listNotifications(context.userId, { limit: 50 }) };
});
var markNotificationsReadFn_createServerFn_handler = createServerRpc({
	id: "f9201786784d0a723bec795004aabc9ad70ddaafef125627836f2399fc91b60d",
	name: "markNotificationsReadFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => markNotificationsReadFn.__executeServer(opts));
var markNotificationsReadFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	ids: array(string()).optional(),
	all: boolean().optional()
}).parse(input ?? {})).handler(markNotificationsReadFn_createServerFn_handler, async ({ context, data }) => {
	const { markNotificationsRead } = await import("./notifications.server-CiVCMOdN.mjs");
	return {
		ok: true,
		count: await markNotificationsRead({
			userId: context.userId,
			ids: data.ids,
			all: data.all
		})
	};
});
var getNotificationPrefsFn_createServerFn_handler = createServerRpc({
	id: "9150e93956fa37c2c9f1c4d5c05073e4a034aa80636b3df17605c76fa60b9de3",
	name: "getNotificationPrefsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => getNotificationPrefsFn.__executeServer(opts));
var getNotificationPrefsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getNotificationPrefsFn_createServerFn_handler, async ({ context }) => {
	const { readNotificationPrefs } = await import("./notifications.server-CiVCMOdN.mjs");
	return readNotificationPrefs(context.userId);
});
var saveNotificationPrefsFn_createServerFn_handler = createServerRpc({
	id: "e14294d870943b9e8aa1effe6852bd1c42c1fb4d33c3d6f20e76d3ebaae195a9",
	name: "saveNotificationPrefsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => saveNotificationPrefsFn.__executeServer(opts));
var saveNotificationPrefsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	mutedCategories: array(_enum(NOTIFICATION_CATEGORIES)),
	emailEnabled: boolean()
}).parse(input)).handler(saveNotificationPrefsFn_createServerFn_handler, async ({ context, data }) => {
	const { writeNotificationPrefs } = await import("./notifications.server-CiVCMOdN.mjs");
	return writeNotificationPrefs({
		userId: context.userId,
		mutedCategories: data.mutedCategories,
		emailEnabled: data.emailEnabled
	});
});
var listAuditEventsFn_createServerFn_handler = createServerRpc({
	id: "47458ab7aa6ff01f313d35067ed4b857c94675c8fbedd3d8f39bcaad53af14b2",
	name: "listAuditEventsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => listAuditEventsFn.__executeServer(opts));
var listAuditEventsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	action: string().max(120).optional(),
	actorUserId: string().max(80).optional(),
	clientId: string().max(80).optional(),
	since: string().max(40).optional(),
	until: string().max(40).optional(),
	format: _enum(["json", "csv"]).optional()
}).parse(input ?? {})).handler(listAuditEventsFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { listAuditEvents, auditEventsToCsv } = await import("./audit.server-B2Y-2eMJ.mjs");
	const items = await listAuditEvents({
		action: data.action,
		actorUserId: data.actorUserId,
		clientId: data.clientId,
		since: data.since,
		until: data.until,
		limit: 200
	});
	if (data.format === "csv") return {
		items,
		csv: auditEventsToCsv(items)
	};
	return { items };
});
var getSafetySettingsFn_createServerFn_handler = createServerRpc({
	id: "fdbf6d2c03c186b5ab81dc215f4f0412bf127569932ebc55b83e27ec46e6d675",
	name: "getSafetySettingsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => getSafetySettingsFn.__executeServer(opts));
var getSafetySettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSafetySettingsFn_createServerFn_handler, async () => {
	try {
		const { readApprovalPolicy } = await import("./approvals.server-Bpax_gE8.mjs");
		const [policy, webhook, emailOn, emailHook] = await Promise.all([
			readApprovalPolicy(),
			readAppSetting("OPS_DISCORD_WEBHOOK"),
			readAppSetting("OPS_EMAIL_ENABLED"),
			readAppSetting("OPS_EMAIL_WEBHOOK")
		]);
		return {
			policy,
			channels: {
				discordWebhookConfigured: Boolean(webhook?.startsWith("https://")),
				emailEnabled: emailOn === "true",
				emailWebhookConfigured: Boolean(emailHook?.startsWith("https://"))
			},
			retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history."
		};
	} catch {
		return {
			policy: DEFAULT_APPROVAL_POLICY,
			channels: {
				discordWebhookConfigured: false,
				emailEnabled: false,
				emailWebhookConfigured: false
			},
			retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history."
		};
	}
});
var saveApprovalPolicyFn_createServerFn_handler = createServerRpc({
	id: "9e5cb7fbeb541c9662c713145e7afb0898841483b109a817488ae3d8e759e27b",
	name: "saveApprovalPolicyFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => saveApprovalPolicyFn.__executeServer(opts));
var saveApprovalPolicyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	requireForSocialPublish: boolean(),
	requireForPlatforms: array(_enum([
		"instagram",
		"x",
		"tiktok",
		"youtube"
	])),
	allowSelfApprove: boolean(),
	stageAdvanceRequiresApproval: boolean()
}).parse(input)).handler(saveApprovalPolicyFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { writeApprovalPolicy } = await import("./approvals.server-Bpax_gE8.mjs");
	const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
	const policy = await writeApprovalPolicy(parseApprovalPolicy(data) ?? DEFAULT_APPROVAL_POLICY);
	await writeAuditEvent({
		actorUserId: context.userId,
		actorType: "USER",
		action: "settings.approvals.updated",
		entityType: "app_setting",
		entityId: "APPROVALS_POLICY_JSON",
		summary: "Approvals policy updated",
		metadata: { requireForSocialPublish: policy.requireForSocialPublish }
	});
	return { policy };
});
var saveOpsChannelsFn_createServerFn_handler = createServerRpc({
	id: "b0e72f840c33d1e4116ead6df25316a8c71b93d96e8763829a58f189b8b63fc9",
	name: "saveOpsChannelsFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => saveOpsChannelsFn.__executeServer(opts));
var saveOpsChannelsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	discordWebhook: string().max(500).optional(),
	emailEnabled: boolean().optional(),
	emailWebhook: string().max(500).optional(),
	clearDiscord: boolean().optional()
}).parse(input)).handler(saveOpsChannelsFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.clearDiscord) await deleteAppSetting("OPS_DISCORD_WEBHOOK");
	if (typeof data.discordWebhook === "string" && data.discordWebhook.startsWith("https://")) await writeAppSetting("OPS_DISCORD_WEBHOOK", data.discordWebhook.trim());
	if (typeof data.emailEnabled === "boolean") await writeAppSetting("OPS_EMAIL_ENABLED", data.emailEnabled ? "true" : "false");
	if (typeof data.emailWebhook === "string" && data.emailWebhook.startsWith("https://")) await writeAppSetting("OPS_EMAIL_WEBHOOK", data.emailWebhook.trim());
	const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
	await writeAuditEvent({
		actorUserId: context.userId,
		actorType: "USER",
		action: "settings.notifications.updated",
		entityType: "app_setting",
		entityId: "OPS_CHANNELS",
		summary: "Notification channels updated"
	});
	return { ok: true };
});
var recordLoginFn_createServerFn_handler = createServerRpc({
	id: "57bf8bcea1615b04def3e036b6188e17ed3114bebc6ceac706d24822ed4bc946",
	name: "recordLoginFn",
	filename: "src/lib/server/safety-fns.ts"
}, (opts) => recordLoginFn.__executeServer(opts));
var recordLoginFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(recordLoginFn_createServerFn_handler, async ({ context }) => {
	const { onAuthEvent } = await import("./safety-hooks.server-CNuRbzza.mjs");
	await onAuthEvent({
		actorId: context.userId,
		action: "auth.login",
		summary: "Operator signed in"
	});
	return { ok: true };
});
//#endregion
export { decideApprovalFn_createServerFn_handler, getNotificationPrefsFn_createServerFn_handler, getSafetyInbox_createServerFn_handler, getSafetySettingsFn_createServerFn_handler, listApprovalsFn_createServerFn_handler, listAuditEventsFn_createServerFn_handler, listNotificationsFn_createServerFn_handler, markNotificationsReadFn_createServerFn_handler, recordLoginFn_createServerFn_handler, saveApprovalPolicyFn_createServerFn_handler, saveNotificationPrefsFn_createServerFn_handler, saveOpsChannelsFn_createServerFn_handler };
