import { Bt as _enum, Jt as object, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as INTEGRATION_IDS } from "./integrations-BBMsU168.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as getUserRole, r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/integrations-DCpuw-PD.js
async function load_app_settings() {
	return import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_discord() {
	return import("./discord.server-Dlb8OQV5.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_discord_agent() {
	return import("./discord-agent.server-DHPRIa_q.mjs");
}
var META_KEY = "INTEGRATION_META";
var FIRST_LAUNCH_KEY = "FIRST_LAUNCH_COMPLETED";
var testLock = /* @__PURE__ */ new Map();
function emptyMeta() {
	return {
		lastTestedAt: null,
		lastError: null,
		lastOk: null
	};
}
function saneIso(value) {
	if (typeof value !== "string" || !value.trim()) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	if (date.getUTCFullYear() < 2020) return null;
	return value;
}
function sanitizeError(message) {
	return message.replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]").replace(/lin_api_[a-zA-Z0-9]+/g, "[redacted]").replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]").replace(/xai-[a-zA-Z0-9_-]+/g, "[redacted]").replace(/ghp_[a-zA-Z0-9]+/g, "[redacted]").replace(/Bot\s+[A-Za-z0-9._-]+/g, "Bot [redacted]").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 180);
}
async function readMeta() {
	const raw = await (await load_app_settings()).readAppSetting(META_KEY);
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
async function writeMeta(meta) {
	await (await load_app_settings()).writeAppSetting(META_KEY, JSON.stringify(meta));
}
async function patchMeta(id, patch) {
	const meta = await readMeta();
	meta[id] = {
		...emptyMeta(),
		...meta[id],
		...patch
	};
	await writeMeta(meta);
}
async function aiKey() {
	return (await (await load_app_settings()).readAppSetting("XAI_API_KEY"))?.trim() || (await (await load_app_settings()).readAppSetting("AI_API_KEY"))?.trim() || null;
}
async function youtubeKey() {
	const { loadYoutubeApiKey } = await import("./youtube-data.server-CmwbKs56.mjs");
	return loadYoutubeApiKey();
}
async function higgsfieldStored() {
	const key = (await (await load_app_settings()).readAppSetting("HIGGSFIELD_API_KEY"))?.trim() || (await (await load_app_settings()).readAppSetting("HIGGSFIELD_KEY_ID"))?.trim() || "";
	const secret = (await (await load_app_settings()).readAppSetting("HIGGSFIELD_API_SECRET"))?.trim() || (await (await load_app_settings()).readAppSetting("HIGGSFIELD_SECRET"))?.trim() || "";
	if (key && secret) return {
		key,
		secret
	};
	return null;
}
async function notionToken() {
	return (await (await load_app_settings()).readAppSetting("NOTION_TOKEN"))?.trim() || null;
}
async function daytonaKey() {
	const { loadDaytonaApiKey } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
	return loadDaytonaApiKey();
}
async function airwallexConfigured() {
	const { loadAirwallexConfig } = await import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r);
	return Boolean(await loadAirwallexConfig());
}
function healthFor(configured, meta, liveOk) {
	if (!configured) return "not_configured";
	if (meta.lastOk === true) return "connected";
	if (meta.lastOk === false) return "error";
	if (liveOk) return "connected";
	return "saved";
}
function xCard(status, meta) {
	const configured = Boolean(status?.appConfigured || status?.connected);
	let health = "not_configured";
	if (status?.tokenExpired) health = "token_expired";
	else if (!configured) health = "not_configured";
	else if (meta.lastOk === false) health = "error";
	else if (status?.eligible && status.connected) health = "connected";
	else health = "saved";
	return {
		id: "x",
		configured,
		health,
		lastTestedAt: saneIso(meta.lastTestedAt),
		lastError: status?.tokenExpired ? "Token expired" : meta.lastError ?? null,
		last4: status?.last4 ?? null,
		required: false,
		handle: status?.handle ?? null
	};
}
async function buildSnapshot(userId) {
	(await load_discord_agent()).ensureDiscordAgentLoop();
	const [meta, llm, yt, hf, discord, notion, daytona, airwallex, first, sa, role, agent, xPub, linear, telegram, whatsapp] = await Promise.all([
		readMeta(),
		import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c).then((mod) => mod.llmStatus()),
		youtubeKey(),
		higgsfieldStored(),
		(await load_discord()).loadDiscordToken(),
		notionToken(),
		daytonaKey(),
		airwallexConfigured(),
		(await load_app_settings()).readAppSetting(FIRST_LAUNCH_KEY),
		(await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH"),
		getUserRole(userId),
		(await load_discord_agent()).readDiscordAgentHealth(),
		import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m).then((mod) => mod.publisherStatusFor("x")).catch(() => null),
		import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.publicLinearStatus()).catch(() => null),
		import("./channels.server-D0O4sCtY.mjs").then((mod) => mod.loadTelegramToken()).catch(() => null),
		import("./channels.server-D0O4sCtY.mjs").then((mod) => mod.loadWhatsAppConfig()).catch(() => null)
	]);
	const aiConfigured = llm.source !== "none";
	return {
		items: {
			ai: {
				id: "ai",
				configured: aiConfigured,
				health: healthFor(aiConfigured, meta.ai ?? emptyMeta(), llm.available),
				lastTestedAt: saneIso(meta.ai?.lastTestedAt),
				lastError: meta.ai?.lastError ?? null,
				last4: (await load_discord()).last4(await aiKey() ?? (llm.source === "oauth" ? "oauthxxxx" : llm.source === "platform" ? "platxxxx" : null)),
				required: true
			},
			higgsfield: {
				id: "higgsfield",
				configured: Boolean(hf),
				health: healthFor(Boolean(hf), meta.higgsfield ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.higgsfield?.lastTestedAt),
				lastError: meta.higgsfield?.lastError ?? null,
				last4: (await load_discord()).last4(hf?.key ?? null),
				required: false
			},
			youtube: {
				id: "youtube",
				configured: Boolean(yt),
				health: healthFor(Boolean(yt), meta.youtube ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.youtube?.lastTestedAt),
				lastError: meta.youtube?.lastError ?? null,
				last4: (await load_discord()).last4(yt),
				required: false
			},
			discord: {
				id: "discord",
				configured: Boolean(discord),
				health: healthFor(Boolean(discord), meta.discord ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.discord?.lastTestedAt),
				lastError: meta.discord?.lastError ?? null,
				last4: (await load_discord()).last4(discord),
				required: false
			},
			notion: {
				id: "notion",
				configured: Boolean(notion),
				health: healthFor(Boolean(notion), meta.notion ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.notion?.lastTestedAt),
				lastError: meta.notion?.lastError ?? null,
				last4: (await load_discord()).last4(notion),
				required: false
			},
			linear: {
				id: "linear",
				configured: Boolean(linear?.configured),
				health: linear?.health ?? healthFor(Boolean(linear?.configured), meta.linear ?? emptyMeta(), false),
				lastTestedAt: saneIso(linear?.lastTestedAt ?? meta.linear?.lastTestedAt),
				lastError: linear?.lastError ?? meta.linear?.lastError ?? null,
				last4: linear?.last4 ?? null,
				required: false,
				handle: linear?.viewerName ?? linear?.workspaceSlug ?? null
			},
			x: xCard(xPub, meta.x ?? emptyMeta()),
			daytona: {
				id: "daytona",
				configured: Boolean(daytona),
				health: healthFor(Boolean(daytona), meta.daytona ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.daytona?.lastTestedAt),
				lastError: meta.daytona?.lastError ?? null,
				last4: (await load_discord()).last4(daytona),
				required: false
			},
			telegram: {
				id: "telegram",
				configured: Boolean(telegram),
				health: healthFor(Boolean(telegram), meta.telegram ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.telegram?.lastTestedAt),
				lastError: meta.telegram?.lastError ?? null,
				last4: (await load_discord()).last4(telegram),
				required: false
			},
			whatsapp: {
				id: "whatsapp",
				configured: Boolean(whatsapp),
				health: healthFor(Boolean(whatsapp), meta.whatsapp ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.whatsapp?.lastTestedAt),
				lastError: meta.whatsapp?.lastError ?? null,
				last4: (await load_discord()).last4(whatsapp?.token ?? null),
				required: false
			},
			airwallex: {
				id: "airwallex",
				configured: Boolean(airwallex),
				health: healthFor(Boolean(airwallex), meta.airwallex ?? emptyMeta(), false),
				lastTestedAt: saneIso(meta.airwallex?.lastTestedAt),
				lastError: meta.airwallex?.lastError ?? null,
				last4: await import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r).then((mod) => mod.airwallexLast4()),
				required: false
			}
		},
		firstLaunchCompleted: first === "1" || first === "true",
		superAdminConfigured: Boolean(sa),
		role,
		discordAgent: agent
	};
}
var getIntegrationsStatus_createServerFn_handler = createServerRpc({
	id: "1b3697949cdd69f8c7f9185b1ea2a53cc66001ea47279c6ff87991c4d0bf8de5",
	name: "getIntegrationsStatus",
	filename: "src/lib/server/integrations.ts"
}, (opts) => getIntegrationsStatus.__executeServer(opts));
var getIntegrationsStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getIntegrationsStatus_createServerFn_handler, async ({ context }) => {
	return buildSnapshot(context.userId);
});
var completeFirstLaunch_createServerFn_handler = createServerRpc({
	id: "191b1a3b543f4399187a19fafbc1c72b794868890e2c2699ea24229022f3400e",
	name: "completeFirstLaunch",
	filename: "src/lib/server/integrations.ts"
}, (opts) => completeFirstLaunch.__executeServer(opts));
var completeFirstLaunch = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(completeFirstLaunch_createServerFn_handler, async () => {
	await (await load_app_settings()).writeAppSetting(FIRST_LAUNCH_KEY, "1");
	return { ok: true };
});
var SaveSchema = object({
	id: _enum(INTEGRATION_IDS),
	values: record(string(), string())
});
var saveIntegration_createServerFn_handler = createServerRpc({
	id: "c1498107105567482c32611a4309fd37f9c9eeadf95b53b721c0801788126e1f",
	name: "saveIntegration",
	filename: "src/lib/server/integrations.ts"
}, (opts) => saveIntegration.__executeServer(opts));
var saveIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveSchema.parse(input)).handler(saveIntegration_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const values = data.values;
	if (data.id === "ai") {
		const key = (values.key ?? values.apiKey ?? "").trim();
		if (key.length < 8) throw new Error("KEY_TOO_SHORT");
		await (await load_app_settings()).writeAppSetting("XAI_API_KEY", key);
		await (await load_app_settings()).writeAppSetting("AI_API_KEY", key);
	} else if (data.id === "higgsfield") {
		const keyId = (values.keyId ?? values.key ?? "").trim();
		const secret = (values.secret ?? "").trim();
		if (keyId.length < 8 || secret.length < 8) throw new Error("KEY_TOO_SHORT");
		const { persistHiggsfieldCreds, clearHiggsfieldCredsCache } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
		await persistHiggsfieldCreds({
			key: keyId,
			secret
		});
		clearHiggsfieldCredsCache();
	} else if (data.id === "youtube") {
		const key = (values.apiKey ?? values.key ?? "").trim();
		if (key.length < 8) throw new Error("KEY_TOO_SHORT");
		const { persistYoutubeApiKey } = await import("./youtube-data.server-CmwbKs56.mjs");
		await persistYoutubeApiKey(key);
	} else if (data.id === "discord") {
		const token = (values.token ?? values.key ?? "").trim();
		if (token.length < 20) throw new Error("KEY_TOO_SHORT");
		await (await load_app_settings()).writeAppSetting("DISCORD_BOT_TOKEN", token);
	} else if (data.id === "notion") {
		const token = (values.token ?? values.key ?? "").trim();
		if (token.length < 10) throw new Error("KEY_TOO_SHORT");
		await (await load_app_settings()).writeAppSetting("NOTION_TOKEN", token);
	} else if (data.id === "linear") {
		const key = (values.apiKey ?? values.key ?? values.token ?? "").trim();
		if (key.length < 12) throw new Error("KEY_TOO_SHORT");
		const { persistLinearApiKey } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
		await persistLinearApiKey(key);
	} else if (data.id === "daytona") {
		const { persistDaytonaSettings } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
		await persistDaytonaSettings({
			apiKey: values.key ?? values.apiKey,
			apiUrl: values.apiUrl,
			target: values.target,
			autoStopMinutes: values.autoStopMinutes,
			size: values.size,
			proxyUrl: values.proxyUrl ?? values.proxy,
			proxyHost: values.proxyHost,
			proxyPort: values.proxyPort,
			proxyUsername: values.proxyUsername,
			proxyPassword: values.proxyPassword,
			proxyProtocol: values.proxyProtocol
		});
	} else if (data.id === "telegram") {
		const { persistTelegramSettings } = await import("./channels.server-D0O4sCtY.mjs");
		await persistTelegramSettings({
			token: values.token ?? values.key,
			webhookSecret: values.webhookSecret
		});
	} else if (data.id === "whatsapp") {
		const { persistWhatsAppSettings } = await import("./channels.server-D0O4sCtY.mjs");
		await persistWhatsAppSettings({
			token: values.token ?? values.key,
			phoneNumberId: values.phoneNumberId,
			verifyToken: values.verifyToken,
			appSecret: values.appSecret
		});
	} else if (data.id === "airwallex") {
		const { persistAirwallexSettings } = await import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r);
		await persistAirwallexSettings(values);
	} else if (data.id === "x") {
		const clientId = (values.clientId ?? "").trim();
		const clientSecret = (values.clientSecret ?? "").trim();
		const apiBase = (values.apiBase ?? "").trim();
		const oauth = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
		if (clientId && clientSecret) await oauth.persistPublisherApp("x", {
			clientId,
			clientSecret
		});
		if (values.apiBase !== void 0) await oauth.persistXApiBase(apiBase);
		if (!clientId && !clientSecret && values.apiBase === void 0) throw new Error("KEY_TOO_SHORT");
		if (!clientId && !clientSecret && !await oauth.loadPublisherApp("x") && !apiBase) throw new Error("KEY_TOO_SHORT");
	}
	await patchMeta(data.id, { lastError: null });
	return { ok: true };
});
var disconnectIntegration_createServerFn_handler = createServerRpc({
	id: "efd8a6244c76959f3fbacce3abf26b3807497709ec56dc0a58fd544daa34c399",
	name: "disconnectIntegration",
	filename: "src/lib/server/integrations.ts"
}, (opts) => disconnectIntegration.__executeServer(opts));
var disconnectIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => _enum(INTEGRATION_IDS).parse(id)).handler(disconnectIntegration_createServerFn_handler, async ({ context, data: id }) => {
	await requireAdmin(context.userId);
	if (id === "ai") {
		await (await load_app_settings()).deleteAppSetting("XAI_API_KEY");
		await (await load_app_settings()).deleteAppSetting("AI_API_KEY");
		const { disconnectGrokOAuth } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
		await disconnectGrokOAuth();
	} else if (id === "higgsfield") {
		await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_API_KEY");
		await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_API_SECRET");
		await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_KEY_ID");
		await (await load_app_settings()).deleteAppSetting("HIGGSFIELD_SECRET");
		const { clearHiggsfieldCredsCache } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
		clearHiggsfieldCredsCache();
	} else if (id === "youtube") {
		await (await load_app_settings()).deleteAppSetting("YOUTUBE_API_KEY");
		await (await load_app_settings()).deleteAppSetting("YOUTUBE_DATA_API_KEY");
	} else if (id === "discord") {
		await (await load_app_settings()).deleteAppSetting("DISCORD_BOT_TOKEN");
		await (await load_app_settings()).deleteAppSetting("DISCORD_TOKEN");
	} else if (id === "notion") await (await load_app_settings()).deleteAppSetting("NOTION_TOKEN");
	else if (id === "linear") {
		const { disconnectLinear } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
		await disconnectLinear();
	} else if (id === "daytona") {
		const { disconnectDaytona } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
		await disconnectDaytona();
	} else if (id === "telegram") {
		const { disconnectTelegram } = await import("./channels.server-D0O4sCtY.mjs");
		await disconnectTelegram();
	} else if (id === "whatsapp") {
		const { disconnectWhatsApp } = await import("./channels.server-D0O4sCtY.mjs");
		await disconnectWhatsApp();
	} else if (id === "airwallex") {
		const { disconnectAirwallex } = await import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r);
		await disconnectAirwallex();
	} else if (id === "x") {
		const { disconnectPublisherTokens } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
		await disconnectPublisherTokens("x");
	}
	await patchMeta(id, {
		lastTestedAt: null,
		lastError: null,
		lastOk: null
	});
	return { ok: true };
});
async function testAi() {
	const { llmAvailable, xaiText } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	if (!await xaiText({
		messages: [{
			role: "user",
			content: "Reply with the single word pong."
		}],
		maxTokens: 8,
		temperature: 0,
		timeoutMs: 2e4
	})) throw new Error("AI_UNAVAILABLE");
}
async function testHiggsfield() {
	const creds = await higgsfieldStored();
	if (!creds) throw new Error("HIGGSFIELD_UNAVAILABLE");
	const response = await fetch("https://platform.higgsfield.ai/requests", {
		method: "GET",
		headers: {
			Authorization: `Key ${creds.key}:${creds.secret}`,
			Accept: "application/json"
		},
		signal: AbortSignal.timeout(12e3)
	});
	if (response.status === 401 || response.status === 403) throw new Error("HIGGSFIELD_UNAVAILABLE");
	if (response.status === 429) throw new Error("AI_RATE_LIMIT");
}
async function testYoutube() {
	const key = await youtubeKey();
	if (!key) throw new Error("YOUTUBE_KEY_MISSING");
	const url = new URL("https://www.googleapis.com/youtube/v3/channels");
	url.searchParams.set("part", "id");
	url.searchParams.set("id", "UC_x5XG1OV2P6uZZ5FSM9Ttw");
	url.searchParams.set("key", key);
	const response = await fetch(url, { signal: AbortSignal.timeout(12e3) });
	if (response.status === 400 || response.status === 403) throw new Error("YOUTUBE_UNAVAILABLE");
	if (!response.ok) throw new Error("YOUTUBE_UNAVAILABLE");
}
async function testDiscord() {
	const token = await (await load_discord()).loadDiscordToken();
	if (!token) throw new Error("DISCORD_UNAVAILABLE");
	const result = await (await load_discord()).testDiscordToken(token);
	if (!result.ok) throw new Error(result.reason);
}
async function testNotion() {
	const token = await notionToken();
	if (!token) throw new Error("NOTION_UNAVAILABLE");
	const response = await fetch("https://api.notion.com/v1/users/me", {
		headers: {
			Authorization: `Bearer ${token}`,
			"Notion-Version": "2022-06-28"
		},
		signal: AbortSignal.timeout(12e3)
	});
	if (response.status === 401) throw new Error("NOTION_UNAVAILABLE");
	if (!response.ok) throw new Error("NOTION_UNAVAILABLE");
}
async function testDaytona() {
	const { testDaytonaConnection } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
	await testDaytonaConnection();
}
async function testAirwallex() {
	const { testAirwallexConnection } = await import("./airwallex.server-CjwNksJP.mjs").then((n) => n.r).then((n) => n.r);
	await testAirwallexConnection();
}
async function testLinear() {
	const { testLinearConnection } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	await testLinearConnection();
}
var testIntegration_createServerFn_handler = createServerRpc({
	id: "9cb0ff1195b2cb2ec3c80bb512d3239487e30afc5657a3daed804b845a5beebb",
	name: "testIntegration",
	filename: "src/lib/server/integrations.ts"
}, (opts) => testIntegration.__executeServer(opts));
var testIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => _enum(INTEGRATION_IDS).parse(id)).handler(testIntegration_createServerFn_handler, async ({ context, data: id }) => {
	await requireAdmin(context.userId);
	const stamp = `${context.userId}:${id}`;
	const last = testLock.get(stamp) ?? 0;
	if (Date.now() - last < 4e3) throw new Error("AI_RATE_LIMIT");
	testLock.set(stamp, Date.now());
	try {
		if (id === "ai") await testAi();
		else if (id === "higgsfield") await testHiggsfield();
		else if (id === "youtube") await testYoutube();
		else if (id === "discord") await testDiscord();
		else if (id === "daytona") await testDaytona();
		else if (id === "telegram") {
			const { testTelegramConnection } = await import("./channels.server-D0O4sCtY.mjs");
			await testTelegramConnection();
		} else if (id === "whatsapp") {
			const { testWhatsAppConnection } = await import("./channels.server-D0O4sCtY.mjs");
			await testWhatsAppConnection();
		} else if (id === "airwallex") await testAirwallex();
		else if (id === "linear") await testLinear();
		else if (id === "x") {
			const { testPublisherConnection } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
			await testPublisherConnection("x");
		} else await testNotion();
		await patchMeta(id, {
			lastTestedAt: (/* @__PURE__ */ new Date()).toISOString(),
			lastError: null,
			lastOk: true
		});
		return { ok: true };
	} catch (error) {
		const message = error instanceof Error ? sanitizeError(error.message) : "Connection failed.";
		const friendly = message === "AI_UNAVAILABLE" ? "The AI provider didn’t accept the key." : message === "HIGGSFIELD_UNAVAILABLE" ? "Higgsfield rejected those credentials." : message === "YOUTUBE_KEY_MISSING" || message === "YOUTUBE_UNAVAILABLE" ? "YouTube rejected that API key." : message === "NOTION_UNAVAILABLE" ? "Notion rejected that token." : message === "DISCORD_UNAVAILABLE" ? "Discord rejected that bot token." : message === "DAYTONA_UNAVAILABLE" ? "Daytona rejected that API key. Test never starts a machine." : message === "CHANNEL_NOT_CONFIGURED" || message === "CHANNEL_UNAVAILABLE" ? "That channel rejected the credentials. Test never sends a customer message." : message === "AIRWALLEX_UNAVAILABLE" ? "Airwallex rejected those credentials. Test never opens checkout." : message === "PUBLISHER_APP_MISSING" ? "Save the X Client ID and secret, then Connect." : message === "PUBLISHER_NOT_CONNECTED" || message === "PUBLISHER_TOKEN_EXPIRED" ? "Connect X with OAuth. Test never posts." : message === "PUBLISHER_UNAVAILABLE" ? "X didn’t accept that token. Reconnect." : message === "LINEAR_NOT_CONFIGURED" ? "Save a Linear API key first." : message === "LINEAR_UNAUTHORIZED" ? "Linear rejected that key. Create a new one in Linear Settings → API." : message === "LINEAR_UNAVAILABLE" || message === "LINEAR_RATE_LIMIT" ? "Linear didn’t accept that token. Retry Test Connection." : message === "AI_RATE_LIMIT" ? "Too many tests. Wait a few seconds." : message;
		await patchMeta(id, {
			lastTestedAt: (/* @__PURE__ */ new Date()).toISOString(),
			lastError: friendly,
			lastOk: false
		});
		try {
			const { onIntegrationTestFailed } = await import("./safety-hooks.server-CNuRbzza.mjs");
			await onIntegrationTestFailed({
				actorId: context.userId,
				provider: id,
				reason: friendly
			});
		} catch {}
		throw new Error(friendly);
	}
});
var runDiscordAgentNow_createServerFn_handler = createServerRpc({
	id: "55910e1c8926bbc007bbffd53402a7d003ef47ffdab2a9305f7bc40a507c46b6",
	name: "runDiscordAgentNow",
	filename: "src/lib/server/integrations.ts"
}, (opts) => runDiscordAgentNow.__executeServer(opts));
var runDiscordAgentNow = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(runDiscordAgentNow_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_discord_agent()).runDiscordStatusAgent();
});
//#endregion
export { completeFirstLaunch_createServerFn_handler, disconnectIntegration_createServerFn_handler, getIntegrationsStatus_createServerFn_handler, runDiscordAgentNow_createServerFn_handler, saveIntegration_createServerFn_handler, testIntegration_createServerFn_handler };
