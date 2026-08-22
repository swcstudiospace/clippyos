import { Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { o as MASKED_SECRET } from "./constants-CdtfzQP2.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-D-5fmHCf.js
/**
* AppSetting FLS: value is never returned to the client in plaintext.
* Admin-only. Empty database remains empty until keys are saved.
*/
var listSettingsMasked_createServerFn_handler = createServerRpc({
	id: "43a09b40b158553098de53bb4aa1ac9e2bbc488374fed59faa0fa7890440ad93",
	name: "listSettingsMasked",
	filename: "src/lib/server/settings.ts"
}, (opts) => listSettingsMasked.__executeServer(opts));
var listSettingsMasked = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listSettingsMasked_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	try {
		const { tryCreateAdminClient, createPublishableClient } = await import("./clients.server-54cTCuV1.mjs");
		const { data, error } = await (tryCreateAdminClient() ?? createPublishableClient()).from("app_settings").select("key").order("key");
		if (!error) return (data ?? []).map((row) => ({
			key: String(row.key ?? ""),
			value: MASKED_SECRET
		}));
	} catch {}
	const { getSql } = await import("./db-Bjmpu96a.mjs").then((n) => n.t).then((n) => n.t);
	return (await (await getSql())`
      select key from app_settings order by key
    `).map((row) => ({
		key: row.key,
		value: MASKED_SECRET
	}));
});
var getSupabaseStatus_createServerFn_handler = createServerRpc({
	id: "e2168e4c3356eb148f143cfb07c325220358c36885e945d967db5ffd14bac7cd",
	name: "getSupabaseStatus",
	filename: "src/lib/server/settings.ts"
}, (opts) => getSupabaseStatus.__executeServer(opts));
var getSupabaseStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSupabaseStatus_createServerFn_handler, async ({ context }) => {
	const { probeSupabase } = await import("./probe.server-BYbF5cZ9.mjs");
	return probeSupabase(context.userId);
});
var HiggsfieldSaveSchema = object({
	keyId: string().trim().min(8).max(200),
	secret: string().trim().min(8).max(400)
});
/**
* Store Higgsfield key id + secret in AppSetting. Values never leave the server
* in the response. Admin-gated (FLS).
*/
var saveHiggsfieldCredentials_createServerFn_handler = createServerRpc({
	id: "bbb77fc82c862c6754e4292ea9012f7af5bfcbec38bc9de17b8d0b5f4f5a1097",
	name: "saveHiggsfieldCredentials",
	filename: "src/lib/server/settings.ts"
}, (opts) => saveHiggsfieldCredentials.__executeServer(opts));
var saveHiggsfieldCredentials = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => HiggsfieldSaveSchema.parse(input)).handler(saveHiggsfieldCredentials_createServerFn_handler, async ({ data }) => {
	const { persistHiggsfieldCreds, clearHiggsfieldCredsCache } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
	await persistHiggsfieldCreds({
		key: data.keyId,
		secret: data.secret
	});
	clearHiggsfieldCredsCache();
	return { ok: true };
});
var YoutubeKeySchema = object({ apiKey: string().trim().min(8).max(200) });
var saveYoutubeApiKey_createServerFn_handler = createServerRpc({
	id: "d19def7c00ec7a687a5d8eea775a0e10a0287193d8673e1828e6482be13a8a46",
	name: "saveYoutubeApiKey",
	filename: "src/lib/server/settings.ts"
}, (opts) => saveYoutubeApiKey.__executeServer(opts));
var saveYoutubeApiKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => YoutubeKeySchema.parse(input)).handler(saveYoutubeApiKey_createServerFn_handler, async ({ data, context }) => {
	await requireAdmin(context.userId);
	const { persistYoutubeApiKey } = await import("./youtube-data.server-CmwbKs56.mjs");
	await persistYoutubeApiKey(data.apiKey);
	return { ok: true };
});
var startGrokOAuth_createServerFn_handler = createServerRpc({
	id: "356959323bfab350d2f09a3ecd2e9afe8ae1da101307fba4ac9e7699d218c72a",
	name: "startGrokOAuth",
	filename: "src/lib/server/settings.ts"
}, (opts) => startGrokOAuth.__executeServer(opts));
var startGrokOAuth = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(startGrokOAuth_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { startGrokDeviceLogin } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	return startGrokDeviceLogin();
});
var pollGrokOAuth_createServerFn_handler = createServerRpc({
	id: "9baaf3fa102e791b58ab6c2892c2cf3b9b48f71ef1dd95160d1a706b45601cb1",
	name: "pollGrokOAuth",
	filename: "src/lib/server/settings.ts"
}, (opts) => pollGrokOAuth.__executeServer(opts));
var pollGrokOAuth = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(pollGrokOAuth_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { pollGrokDeviceLogin } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	return pollGrokDeviceLogin();
});
var disconnectGrokOAuthFn_createServerFn_handler = createServerRpc({
	id: "1b06bc2f1d50513646095115c2fb4faa8d5ccc84db60a7c51109053b4906911d",
	name: "disconnectGrokOAuthFn",
	filename: "src/lib/server/settings.ts"
}, (opts) => disconnectGrokOAuthFn.__executeServer(opts));
var disconnectGrokOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(disconnectGrokOAuthFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { disconnectGrokOAuth } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	await disconnectGrokOAuth();
	return { ok: true };
});
//#endregion
export { disconnectGrokOAuthFn_createServerFn_handler, getSupabaseStatus_createServerFn_handler, listSettingsMasked_createServerFn_handler, pollGrokOAuth_createServerFn_handler, saveHiggsfieldCredentials_createServerFn_handler, saveYoutubeApiKey_createServerFn_handler, startGrokOAuth_createServerFn_handler };
