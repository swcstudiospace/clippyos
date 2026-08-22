import { s as getRequest } from "./ssr2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/public-origin-xyRmazSv.js
function publicOrigin() {
	const env = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || "";
	if (env) return env.replace(/\/$/, "");
	try {
		const request = getRequest();
		const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
		if (!host) return "";
		return `${request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")}://${host}`;
	} catch {
		return "";
	}
}
//#endregion
export { publicOrigin };
