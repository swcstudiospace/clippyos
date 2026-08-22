//#region node_modules/.nitro/vite/services/ssr/assets/channels-BG56fSeM.js
/** Client-safe Telegram / WhatsApp policy. No secrets. */
var CHANNEL_PROVIDERS = ["telegram", "whatsapp"];
var CHANNELS_QUERY_KEY = ["channels"];
var CHANNEL_LABELS = {
	telegram: "Telegram",
	whatsapp: "WhatsApp"
};
function telegramApiUrl(token, method) {
	const safeToken = String(token ?? "").trim();
	const safeMethod = String(method ?? "").trim();
	if (!safeToken || !/^[A-Za-z0-9:_-]{20,}$/.test(safeToken)) throw new Error("VALIDATION");
	if (!/^[a-zA-Z][a-zA-Z0-9]+$/.test(safeMethod)) throw new Error("VALIDATION");
	return `https://api.telegram.org/bot${safeToken}/${safeMethod}`;
}
function whatsappMessagesUrl(phoneNumberId, version = "v21.0") {
	const id = String(phoneNumberId ?? "").trim();
	const ver = String(version ?? "").trim();
	if (!/^[0-9]{6,20}$/.test(id)) throw new Error("VALIDATION");
	if (!/^v\d+\.\d+$/.test(ver)) throw new Error("VALIDATION");
	return `https://graph.facebook.com/${ver}/${id}/messages`;
}
function whatsappSubscribedAppsUrl(phoneNumberId, version = "v21.0") {
	const id = String(phoneNumberId ?? "").trim();
	const ver = String(version ?? "").trim();
	if (!/^[0-9]{6,20}$/.test(id)) throw new Error("VALIDATION");
	if (!/^v\d+\.\d+$/.test(ver)) throw new Error("VALIDATION");
	return `https://graph.facebook.com/${ver}/${id}/subscribed_apps`;
}
function parseE164(value) {
	const raw = String(value ?? "").trim().replace(/[\s()-]/g, "");
	if (!/^\+[1-9]\d{6,14}$/.test(raw)) return null;
	return raw;
}
function parseTelegramChatId(value) {
	const raw = String(value ?? "").trim();
	if (!raw) return null;
	if (/^-?\d{5,20}$/.test(raw)) return raw;
	if (/^@[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(raw)) return raw;
	return null;
}
//#endregion
export { parseTelegramChatId as a, whatsappSubscribedAppsUrl as c, parseE164 as i, CHANNEL_LABELS as n, telegramApiUrl as o, CHANNEL_PROVIDERS as r, whatsappMessagesUrl as s, CHANNELS_QUERY_KEY as t };
