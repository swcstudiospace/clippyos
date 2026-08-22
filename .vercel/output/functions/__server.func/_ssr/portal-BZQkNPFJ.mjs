import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-BZQkNPFJ.js
var portal_BZQkNPFJ_exports = /* @__PURE__ */ __exportAll({
	a: () => PORTAL_APPROVALS_KEY,
	c: () => PORTAL_HOME_KEY,
	d: () => getPortalBearerToken,
	f: () => parsePortalSettings,
	h: () => setPortalBearerToken,
	i: () => PORTAL_ADMIN_KEY,
	l: () => PORTAL_QUERY_KEY,
	m: () => portal_exports,
	n: () => PORTAL_ACTIVITY_ACTIONS,
	o: () => PORTAL_ASSETS_KEY,
	p: () => portalActorId,
	r: () => PORTAL_ACTIVITY_KEY,
	s: () => PORTAL_CLIENT_FACING_TYPES,
	t: () => DEFAULT_PORTAL_SETTINGS,
	u: () => PORTAL_SETTINGS_KEY
});
var portal_exports = /* @__PURE__ */ __exportAll$1({
	DEFAULT_PORTAL_SETTINGS: () => DEFAULT_PORTAL_SETTINGS,
	PORTAL_ACTIVITY_ACTIONS: () => PORTAL_ACTIVITY_ACTIONS,
	PORTAL_ACTIVITY_KEY: () => PORTAL_ACTIVITY_KEY,
	PORTAL_ADMIN_KEY: () => PORTAL_ADMIN_KEY,
	PORTAL_APPROVALS_KEY: () => PORTAL_APPROVALS_KEY,
	PORTAL_ASSETS_KEY: () => PORTAL_ASSETS_KEY,
	PORTAL_CLIENT_FACING_TYPES: () => PORTAL_CLIENT_FACING_TYPES,
	PORTAL_HOME_KEY: () => PORTAL_HOME_KEY,
	PORTAL_QUERY_KEY: () => PORTAL_QUERY_KEY,
	PORTAL_SETTINGS_KEY: () => PORTAL_SETTINGS_KEY,
	PORTAL_TOKEN_STORAGE_KEY: () => PORTAL_TOKEN_STORAGE_KEY,
	getPortalBearerToken: () => getPortalBearerToken,
	parsePortalSettings: () => parsePortalSettings,
	portalActorId: () => portalActorId,
	setPortalBearerToken: () => setPortalBearerToken
});
var PORTAL_QUERY_KEY = ["portal-session"];
var PORTAL_HOME_KEY = ["portal-home"];
var PORTAL_ASSETS_KEY = ["portal-assets"];
var PORTAL_APPROVALS_KEY = ["portal-approvals"];
var PORTAL_ACTIVITY_KEY = ["portal-activity"];
var PORTAL_ADMIN_KEY = ["portal-admin"];
var PORTAL_SETTINGS_KEY = ["portal-settings"];
var PORTAL_TOKEN_STORAGE_KEY = "clippy-portal-token";
var PORTAL_CLIENT_FACING_TYPES = ["PUBLISH_SOCIAL", "RENDER_RELEASE"];
var PORTAL_ACTIVITY_ACTIONS = [
	"approval.requested",
	"approval.approved",
	"approval.rejected",
	"progress.stage_changed",
	"social.publish.succeeded",
	"portal.login",
	"portal.approve",
	"portal.reject",
	"portal.invite",
	"library.asset_ready"
];
var DEFAULT_PORTAL_SETTINGS = {
	enabled: true,
	allowDownload: false,
	showMetrics: false,
	approvalsEnabled: true,
	welcomeBlurb: "Here’s where production stands, what’s ready to review, and what already shipped.",
	agencyName: "ClippyOS",
	logoUrl: null
};
function portalActorId(userId) {
	return `portal:${userId}`;
}
function getPortalBearerToken() {
	if (typeof window === "undefined") return null;
	try {
		return window.sessionStorage.getItem(PORTAL_TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}
function setPortalBearerToken(token) {
	if (typeof window === "undefined") return;
	try {
		if (token) window.sessionStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, token);
		else window.sessionStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY);
	} catch {}
}
function parsePortalSettings(raw) {
	if (!raw || typeof raw !== "object") return { ...DEFAULT_PORTAL_SETTINGS };
	const rec = raw;
	const logo = typeof rec.logoUrl === "string" ? rec.logoUrl.trim() : "";
	const name = typeof rec.agencyName === "string" ? rec.agencyName.trim() : "";
	const blurb = typeof rec.welcomeBlurb === "string" ? rec.welcomeBlurb.trim() : "";
	return {
		enabled: rec.enabled !== false,
		allowDownload: rec.allowDownload === true,
		showMetrics: rec.showMetrics === true,
		approvalsEnabled: rec.approvalsEnabled !== false,
		welcomeBlurb: blurb.slice(0, 400) || DEFAULT_PORTAL_SETTINGS.welcomeBlurb,
		agencyName: name.slice(0, 80) || DEFAULT_PORTAL_SETTINGS.agencyName,
		logoUrl: logo && /^https?:\/\//i.test(logo) ? logo.slice(0, 500) : null
	};
}
//#endregion
export { PORTAL_APPROVALS_KEY as a, PORTAL_HOME_KEY as c, getPortalBearerToken as d, parsePortalSettings as f, setPortalBearerToken as h, PORTAL_ADMIN_KEY as i, PORTAL_QUERY_KEY as l, portal_BZQkNPFJ_exports as m, PORTAL_ACTIVITY_ACTIONS as n, PORTAL_ASSETS_KEY as o, portalActorId as p, PORTAL_ACTIVITY_KEY as r, PORTAL_CLIENT_FACING_TYPES as s, DEFAULT_PORTAL_SETTINGS as t, PORTAL_SETTINGS_KEY as u };
