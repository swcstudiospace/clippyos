import { r as __exportAll } from "../_runtime.mjs";
import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { d as NOTIFICATION_CATEGORIES, n as APPROVAL_STATUSES } from "./safety-CI611PZC.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/safety-fns-0YjGOs0I.js
var safety_fns_0YjGOs0I_exports = /* @__PURE__ */ __exportAll({
	a: () => listApprovalsFn,
	c: () => markNotificationsReadFn,
	d: () => saveNotificationPrefsFn,
	f: () => saveOpsChannelsFn,
	i: () => getSafetySettingsFn,
	l: () => safety_fns_exports,
	n: () => getNotificationPrefsFn,
	o: () => listAuditEventsFn,
	r: () => getSafetyInbox,
	s: () => listNotificationsFn,
	t: () => decideApprovalFn,
	u: () => saveApprovalPolicyFn
});
var safety_fns_exports = /* @__PURE__ */ __exportAll$1({
	decideApprovalFn: () => decideApprovalFn,
	getNotificationPrefsFn: () => getNotificationPrefsFn,
	getSafetyInbox: () => getSafetyInbox,
	getSafetySettingsFn: () => getSafetySettingsFn,
	listApprovalsFn: () => listApprovalsFn,
	listAuditEventsFn: () => listAuditEventsFn,
	listNotificationsFn: () => listNotificationsFn,
	markNotificationsReadFn: () => markNotificationsReadFn,
	recordLoginFn: () => recordLoginFn,
	saveApprovalPolicyFn: () => saveApprovalPolicyFn,
	saveNotificationPrefsFn: () => saveNotificationPrefsFn,
	saveOpsChannelsFn: () => saveOpsChannelsFn
});
var getSafetyInbox = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f1a8f8b902745b590ceaa37de1a8529367441158cbb685c5bf9df3fc820917f7"));
var listApprovalsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	status: _enum(APPROVAL_STATUSES).optional(),
	clientId: string().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("0ceadb4d5f1746640981a4699e7ce1792cb6c5227feaa7cccae6f16a7d93e07b"));
var decideApprovalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum([
		"APPROVED",
		"REJECTED",
		"CANCELED"
	]),
	note: string().max(400).optional()
}).parse(input)).handler(createSsrRpc("05e6cdf2224a05e3a01cbf2f253e70f08832ae00e72e8b301304928b8a03e008"));
var listNotificationsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("03c67e4c5f0d96ff66f3a7d0daa42b6c8cb0d615cf798b9addfb16bb5fd1c23c"));
var markNotificationsReadFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	ids: array(string()).optional(),
	all: boolean().optional()
}).parse(input ?? {})).handler(createSsrRpc("f9201786784d0a723bec795004aabc9ad70ddaafef125627836f2399fc91b60d"));
var getNotificationPrefsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9150e93956fa37c2c9f1c4d5c05073e4a034aa80636b3df17605c76fa60b9de3"));
var saveNotificationPrefsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	mutedCategories: array(_enum(NOTIFICATION_CATEGORIES)),
	emailEnabled: boolean()
}).parse(input)).handler(createSsrRpc("e14294d870943b9e8aa1effe6852bd1c42c1fb4d33c3d6f20e76d3ebaae195a9"));
var listAuditEventsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	action: string().max(120).optional(),
	actorUserId: string().max(80).optional(),
	clientId: string().max(80).optional(),
	since: string().max(40).optional(),
	until: string().max(40).optional(),
	format: _enum(["json", "csv"]).optional()
}).parse(input ?? {})).handler(createSsrRpc("47458ab7aa6ff01f313d35067ed4b857c94675c8fbedd3d8f39bcaad53af14b2"));
var getSafetySettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("fdbf6d2c03c186b5ab81dc215f4f0412bf127569932ebc55b83e27ec46e6d675"));
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
}).parse(input)).handler(createSsrRpc("9e5cb7fbeb541c9662c713145e7afb0898841483b109a817488ae3d8e759e27b"));
var saveOpsChannelsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	discordWebhook: string().max(500).optional(),
	emailEnabled: boolean().optional(),
	emailWebhook: string().max(500).optional(),
	clearDiscord: boolean().optional()
}).parse(input)).handler(createSsrRpc("b0e72f840c33d1e4116ead6df25316a8c71b93d96e8763829a58f189b8b63fc9"));
var recordLoginFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("57bf8bcea1615b04def3e036b6188e17ed3114bebc6ceac706d24822ed4bc946"));
//#endregion
export { listApprovalsFn as a, markNotificationsReadFn as c, saveNotificationPrefsFn as d, saveOpsChannelsFn as f, getSafetySettingsFn as i, safety_fns_0YjGOs0I_exports as l, getNotificationPrefsFn as n, listAuditEventsFn as o, getSafetyInbox as r, listNotificationsFn as s, decideApprovalFn as t, saveApprovalPolicyFn as u };
