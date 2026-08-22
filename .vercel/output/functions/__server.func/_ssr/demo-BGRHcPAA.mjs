//#region node_modules/.nitro/vite/services/ssr/assets/demo-BGRHcPAA.js
/** Client-safe demo request types. No secrets. */
var DEMO_ROLES = [
	"founder",
	"producer",
	"editor",
	"agency",
	"other"
];
function parseDemoEmail(value) {
	const raw = String(value ?? "").trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || raw.length > 200) return null;
	return raw;
}
function parseDemoName(value) {
	const raw = String(value ?? "").trim().replace(/\s+/g, " ");
	if (raw.length < 2 || raw.length > 80) return null;
	return raw;
}
//#endregion
export { parseDemoEmail as n, parseDemoName as r, DEMO_ROLES as t };
