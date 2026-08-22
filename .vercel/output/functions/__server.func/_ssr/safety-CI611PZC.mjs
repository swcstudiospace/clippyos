import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/safety-CI611PZC.js
var safety_CI611PZC_exports = /* @__PURE__ */ __exportAll({
	_: () => safety_exports,
	a: () => APPROVAL_TYPE_LABELS,
	c: () => AUDIT_QUERY_KEY,
	d: () => NOTIFICATION_CATEGORIES,
	f: () => NOTIFICATION_CATEGORY_LABELS,
	g: () => parseApprovalPolicy,
	h: () => SAFETY_SETTINGS_QUERY_KEY,
	i: () => APPROVAL_TYPES,
	l: () => DEFAULT_APPROVAL_POLICY,
	m: () => SAFETY_INBOX_QUERY_KEY,
	n: () => APPROVAL_STATUSES,
	o: () => AUDIT_ACTOR_LABELS,
	p: () => NOTIFICATION_SEVERITIES,
	r: () => APPROVAL_STATUS_LABELS,
	s: () => AUDIT_ACTOR_TYPES,
	t: () => APPROVALS_QUERY_KEY,
	u: () => NOTIFICATIONS_QUERY_KEY,
	v: () => shortActor
});
var safety_exports = /* @__PURE__ */ __exportAll$1({
	APPROVALS_QUERY_KEY: () => APPROVALS_QUERY_KEY,
	APPROVAL_STATUSES: () => APPROVAL_STATUSES,
	APPROVAL_STATUS_LABELS: () => APPROVAL_STATUS_LABELS,
	APPROVAL_TYPES: () => APPROVAL_TYPES,
	APPROVAL_TYPE_LABELS: () => APPROVAL_TYPE_LABELS,
	AUDIT_ACTOR_LABELS: () => AUDIT_ACTOR_LABELS,
	AUDIT_ACTOR_TYPES: () => AUDIT_ACTOR_TYPES,
	AUDIT_QUERY_KEY: () => AUDIT_QUERY_KEY,
	DEFAULT_APPROVAL_POLICY: () => DEFAULT_APPROVAL_POLICY,
	NOTIFICATIONS_QUERY_KEY: () => NOTIFICATIONS_QUERY_KEY,
	NOTIFICATION_CATEGORIES: () => NOTIFICATION_CATEGORIES,
	NOTIFICATION_CATEGORY_LABELS: () => NOTIFICATION_CATEGORY_LABELS,
	NOTIFICATION_SEVERITIES: () => NOTIFICATION_SEVERITIES,
	SAFETY_INBOX_QUERY_KEY: () => SAFETY_INBOX_QUERY_KEY,
	SAFETY_SETTINGS_QUERY_KEY: () => SAFETY_SETTINGS_QUERY_KEY,
	parseApprovalPolicy: () => parseApprovalPolicy,
	requiresSocialPublishApproval: () => requiresSocialPublishApproval,
	shortActor: () => shortActor
});
var SAFETY_INBOX_QUERY_KEY = ["safety-inbox"];
var APPROVALS_QUERY_KEY = ["approvals"];
var NOTIFICATIONS_QUERY_KEY = ["notifications"];
var AUDIT_QUERY_KEY = ["audit-events"];
var SAFETY_SETTINGS_QUERY_KEY = ["safety-settings"];
var APPROVAL_TYPES = [
	"PUBLISH_SOCIAL",
	"RENDER_RELEASE",
	"STAGE_ADVANCE",
	"ASSET_EXTERNAL",
	"CUSTOM"
];
var APPROVAL_STATUSES = [
	"PENDING",
	"APPROVED",
	"REJECTED",
	"CANCELED",
	"EXPIRED"
];
var NOTIFICATION_CATEGORIES = [
	"BILLING",
	"SOCIAL",
	"PIPELINE",
	"AGENT",
	"SYSTEM",
	"APPROVAL"
];
var NOTIFICATION_SEVERITIES = [
	"INFO",
	"WARNING",
	"CRITICAL"
];
var AUDIT_ACTOR_TYPES = [
	"USER",
	"SYSTEM",
	"HERMES",
	"WEBHOOK",
	"AGENT",
	"PORTAL"
];
var DEFAULT_APPROVAL_POLICY = {
	requireForSocialPublish: true,
	requireForPlatforms: [],
	allowSelfApprove: true,
	stageAdvanceRequiresApproval: false
};
var APPROVAL_TYPE_LABELS = {
	PUBLISH_SOCIAL: "Social publish",
	RENDER_RELEASE: "Render release",
	STAGE_ADVANCE: "Stage advance",
	ASSET_EXTERNAL: "External asset",
	CUSTOM: "Custom"
};
var APPROVAL_STATUS_LABELS = {
	PENDING: "Waiting",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	CANCELED: "Canceled",
	EXPIRED: "Expired"
};
var NOTIFICATION_CATEGORY_LABELS = {
	BILLING: "Billing",
	SOCIAL: "Social",
	PIPELINE: "Pipeline",
	AGENT: "Agent",
	SYSTEM: "System",
	APPROVAL: "Approvals"
};
var AUDIT_ACTOR_LABELS = {
	USER: "Operator",
	SYSTEM: "System",
	HERMES: "Hermes",
	WEBHOOK: "Webhook",
	AGENT: "Agent",
	PORTAL: "Client portal"
};
function parseApprovalPolicy(raw) {
	if (!raw || typeof raw !== "object") return { ...DEFAULT_APPROVAL_POLICY };
	const rec = raw;
	const platforms = Array.isArray(rec.requireForPlatforms) ? rec.requireForPlatforms.filter((item) => item === "instagram" || item === "x" || item === "tiktok" || item === "youtube") : [];
	return {
		requireForSocialPublish: rec.requireForSocialPublish !== false,
		requireForPlatforms: platforms,
		allowSelfApprove: rec.allowSelfApprove !== false,
		stageAdvanceRequiresApproval: rec.stageAdvanceRequiresApproval === true
	};
}
function requiresSocialPublishApproval(policy, platforms) {
	if (!policy.requireForSocialPublish) return false;
	if (policy.requireForPlatforms.length === 0) return true;
	return platforms.some((platform) => policy.requireForPlatforms.includes(platform));
}
function shortActor(id) {
	if (!id) return "Unknown";
	if (id.startsWith("agent:")) return "Hermes";
	if (id.startsWith("portal:")) return "Client portal";
	if (id === "system" || id === "discord-status-agent") return "System";
	if (id.length <= 10) return id;
	return `…${id.slice(-6)}`;
}
//#endregion
export { safety_CI611PZC_exports as _, APPROVAL_TYPE_LABELS as a, AUDIT_QUERY_KEY as c, NOTIFICATION_CATEGORIES as d, NOTIFICATION_CATEGORY_LABELS as f, parseApprovalPolicy as g, SAFETY_SETTINGS_QUERY_KEY as h, APPROVAL_TYPES as i, DEFAULT_APPROVAL_POLICY as l, SAFETY_INBOX_QUERY_KEY as m, APPROVAL_STATUSES as n, AUDIT_ACTOR_LABELS as o, NOTIFICATION_SEVERITIES as p, APPROVAL_STATUS_LABELS as r, AUDIT_ACTOR_TYPES as s, APPROVALS_QUERY_KEY as t, NOTIFICATIONS_QUERY_KEY as u, shortActor as v };
