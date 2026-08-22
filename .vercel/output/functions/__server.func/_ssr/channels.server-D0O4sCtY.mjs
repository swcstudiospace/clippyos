import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, n as deleteAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { a as parseTelegramChatId, c as whatsappSubscribedAppsUrl, i as parseE164, o as telegramApiUrl, r as CHANNEL_PROVIDERS, s as whatsappMessagesUrl } from "./channels-BG56fSeM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channels.server-D0O4sCtY.js
var TELEGRAM_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
var TELEGRAM_SECRET_KEY = "TELEGRAM_WEBHOOK_SECRET";
var WHATSAPP_TOKEN_KEY = "WHATSAPP_ACCESS_TOKEN";
var WHATSAPP_PHONE_KEY = "WHATSAPP_PHONE_NUMBER_ID";
var WHATSAPP_VERIFY_KEY = "WHATSAPP_VERIFY_TOKEN";
var WHATSAPP_APP_SECRET_KEY = "WHATSAPP_APP_SECRET";
var SCHEMA_SQL = [
	`create table if not exists channel_threads (
  id text primary key,
  client_id text,
  provider text not null check (provider in ('telegram', 'whatsapp')),
  external_id text not null,
  contact_name text not null,
  contact_handle text,
  last_message_at timestamptz,
  last_preview text,
  created_at timestamptz not null default now()
)`,
	`create unique index if not exists channel_threads_provider_ext_uidx
  on channel_threads (provider, external_id)`,
	`create index if not exists channel_threads_last_idx
  on channel_threads (last_message_at desc)`,
	`create table if not exists channel_messages (
  id text primary key,
  thread_id text not null,
  direction text not null check (direction in ('in', 'out')),
  body text not null,
  status text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  external_id text,
  created_at timestamptz not null default now(),
  created_by text
)`,
	`create index if not exists channel_messages_thread_idx
  on channel_messages (thread_id, created_at)`
];
var schemaReady = null;
async function ensureChannelsSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		try {
			const sql = await localSql();
			for (const statement of SCHEMA_SQL) try {
				await sql.query(`${statement};`);
			} catch {}
		} catch {}
	})();
	return schemaReady;
}
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
async function loadTelegramToken() {
	const env = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
	if (env && !looksRedacted(env)) return env;
	const stored = (await readAppSetting(TELEGRAM_TOKEN_KEY))?.trim() || "";
	return stored && !looksRedacted(stored) ? stored : null;
}
async function loadTelegramWebhookSecret() {
	const stored = (await readAppSetting(TELEGRAM_SECRET_KEY))?.trim() || "";
	return stored && !looksRedacted(stored) ? stored : null;
}
async function loadWhatsAppConfig() {
	const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || (await readAppSetting(WHATSAPP_TOKEN_KEY))?.trim() || "";
	const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || (await readAppSetting(WHATSAPP_PHONE_KEY))?.trim() || "";
	if (!token || looksRedacted(token) || !/^[0-9]{6,20}$/.test(phoneNumberId)) return null;
	return {
		token,
		phoneNumberId,
		verifyToken: (await readAppSetting(WHATSAPP_VERIFY_KEY))?.trim() || null,
		appSecret: (await readAppSetting(WHATSAPP_APP_SECRET_KEY))?.trim() || null
	};
}
async function persistTelegramSettings(values) {
	const token = (values.token ?? "").trim();
	if (token) {
		if (token.length < 20) throw new Error("KEY_TOO_SHORT");
		await writeAppSetting(TELEGRAM_TOKEN_KEY, token);
	}
	const secret = (values.webhookSecret ?? "").trim();
	if (secret) await writeAppSetting(TELEGRAM_SECRET_KEY, secret);
	else if (!await loadTelegramWebhookSecret()) await writeAppSetting(TELEGRAM_SECRET_KEY, crypto.randomUUID().replace(/-/g, ""));
	await registerTelegramWebhook();
}
async function registerTelegramWebhook() {
	const token = await loadTelegramToken();
	if (!token) return;
	const { publicOrigin } = await import("./public-origin-xyRmazSv.mjs");
	const origin = publicOrigin();
	if (!origin) return;
	const secret = await loadTelegramWebhookSecret();
	await fetch(telegramApiUrl(token, "setWebhook"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: `${origin}/api/webhooks/telegram`,
			secret_token: secret ?? void 0,
			allowed_updates: ["message"],
			drop_pending_updates: false
		}),
		signal: AbortSignal.timeout(12e3)
	}).catch(() => void 0);
}
async function testTelegramConnection() {
	const token = await loadTelegramToken();
	if (!token) throw new Error("CHANNEL_NOT_CONFIGURED");
	const me = await fetch(telegramApiUrl(token, "getMe"), { signal: AbortSignal.timeout(12e3) });
	if (me.status === 401) throw new Error("CHANNEL_UNAVAILABLE");
	if (!me.ok) throw new Error("CHANNEL_UNAVAILABLE");
	const body = await me.json();
	if (!body.ok) throw new Error("CHANNEL_UNAVAILABLE");
	await registerTelegramWebhook();
	return {
		ok: true,
		username: body.result?.username ?? null
	};
}
async function persistWhatsAppSettings(values) {
	const token = (values.token ?? "").trim();
	if (token) {
		if (token.length < 20) throw new Error("KEY_TOO_SHORT");
		await writeAppSetting(WHATSAPP_TOKEN_KEY, token);
	}
	const phone = (values.phoneNumberId ?? "").trim();
	if (phone) {
		if (!/^[0-9]{6,20}$/.test(phone)) throw new Error("VALIDATION");
		await writeAppSetting(WHATSAPP_PHONE_KEY, phone);
	}
	if (values.verifyToken !== void 0) {
		const verify = values.verifyToken.trim();
		await writeAppSetting(WHATSAPP_VERIFY_KEY, verify || crypto.randomUUID().replace(/-/g, ""));
	} else if (!await readAppSetting(WHATSAPP_VERIFY_KEY)) await writeAppSetting(WHATSAPP_VERIFY_KEY, crypto.randomUUID().replace(/-/g, ""));
	if (values.appSecret?.trim()) await writeAppSetting(WHATSAPP_APP_SECRET_KEY, values.appSecret.trim());
	await registerWhatsAppApp();
}
async function registerWhatsAppApp() {
	const config = await loadWhatsAppConfig();
	if (!config) return;
	await fetch(whatsappSubscribedAppsUrl(config.phoneNumberId), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({}),
		signal: AbortSignal.timeout(12e3)
	}).catch(() => void 0);
}
async function disconnectTelegram() {
	await deleteAppSetting(TELEGRAM_TOKEN_KEY);
	await deleteAppSetting(TELEGRAM_SECRET_KEY);
}
async function disconnectWhatsApp() {
	await deleteAppSetting(WHATSAPP_TOKEN_KEY);
	await deleteAppSetting(WHATSAPP_PHONE_KEY);
	await deleteAppSetting(WHATSAPP_VERIFY_KEY);
	await deleteAppSetting(WHATSAPP_APP_SECRET_KEY);
}
async function testWhatsAppConnection() {
	const config = await loadWhatsAppConfig();
	if (!config) throw new Error("CHANNEL_NOT_CONFIGURED");
	const response = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}?fields=display_phone_number,verified_name`, {
		headers: { Authorization: `Bearer ${config.token}` },
		signal: AbortSignal.timeout(12e3)
	});
	if (response.status === 401 || response.status === 403) throw new Error("CHANNEL_UNAVAILABLE");
	if (!response.ok) throw new Error("CHANNEL_UNAVAILABLE");
	await registerWhatsAppApp();
	return { ok: true };
}
function mapThread(row) {
	return {
		id: String(row.id),
		clientId: row.client_id ? String(row.client_id) : null,
		provider: CHANNEL_PROVIDERS.includes(String(row.provider)) ? row.provider : "telegram",
		externalId: String(row.external_id ?? ""),
		contactName: String(row.contact_name ?? "Unknown"),
		contactHandle: row.contact_handle ? String(row.contact_handle) : null,
		lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
		lastPreview: row.last_preview ? String(row.last_preview) : null,
		createdAt: String(row.created_at ?? (/* @__PURE__ */ new Date()).toISOString())
	};
}
function mapMessage(row) {
	return {
		id: String(row.id),
		threadId: String(row.thread_id),
		direction: row.direction === "out" ? "out" : "in",
		body: String(row.body ?? ""),
		status: row.status === "sent" || row.status === "delivered" || row.status === "failed" ? row.status : "queued",
		externalId: row.external_id ? String(row.external_id) : null,
		createdAt: String(row.created_at ?? (/* @__PURE__ */ new Date()).toISOString()),
		createdBy: row.created_by ? String(row.created_by) : null
	};
}
async function insertRow(table, payload) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from(table).insert(payload);
		if (!error) return true;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await localSql();
	const keys = Object.keys(payload);
	const cols = keys.join(", ");
	const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
	await sql.query(`insert into ${table} (${cols}) values (${placeholders})`, keys.map((k) => payload[k]));
	return true;
}
async function updateThread(id, patch) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("channel_threads").update(patch).eq("id", id);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await localSql();
	const keys = Object.keys(patch);
	const sets = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
	await sql.query(`update channel_threads set ${sets} where id = $1`, [id, ...keys.map((k) => patch[k])]);
}
async function listThreads() {
	await ensureChannelsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("channel_threads").select("*").order("last_message_at", {
			ascending: false,
			nullsFirst: false
		});
		if (!error) return (data ?? []).map((row) => mapThread(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await localSql()).query("select * from channel_threads order by last_message_at desc nulls last")).map(mapThread);
}
async function listMessages(threadId) {
	await ensureChannelsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("channel_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(200);
		if (!error) return (data ?? []).map((row) => mapMessage(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await localSql()).query("select * from channel_messages where thread_id = $1 order by created_at asc limit 200", [threadId])).map(mapMessage);
}
async function getThread(id) {
	await ensureChannelsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("channel_threads").select("*").eq("id", id).maybeSingle();
		if (!error) return data ? mapThread(data) : null;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await localSql()).query("select * from channel_threads where id = $1 limit 1", [id]);
	return rows[0] ? mapThread(rows[0]) : null;
}
async function findThread(provider, externalId) {
	await ensureChannelsSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("channel_threads").select("*").eq("provider", provider).eq("external_id", externalId).maybeSingle();
		if (!error) return data ? mapThread(data) : null;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await localSql()).query("select * from channel_threads where provider = $1 and external_id = $2 limit 1", [provider, externalId]);
	return rows[0] ? mapThread(rows[0]) : null;
}
async function upsertInbound(input) {
	await ensureChannelsSchema();
	const body = sanitizeText(input.body).slice(0, 4e3);
	if (!body) throw new Error("EMPTY_MESSAGE");
	const stamp = (/* @__PURE__ */ new Date()).toISOString();
	let thread = await findThread(input.provider, input.externalId);
	if (!thread) {
		const payload = {
			id: crypto.randomUUID(),
			client_id: null,
			provider: input.provider,
			external_id: input.externalId,
			contact_name: sanitizeText(input.contactName).slice(0, 120) || "Unknown",
			contact_handle: input.contactHandle ? sanitizeText(input.contactHandle).slice(0, 80) : null,
			last_message_at: stamp,
			last_preview: body.slice(0, 140),
			created_at: stamp
		};
		await insertRow("channel_threads", payload);
		thread = mapThread(payload);
	} else await updateThread(thread.id, {
		last_message_at: stamp,
		last_preview: body.slice(0, 140),
		contact_name: sanitizeText(input.contactName).slice(0, 120) || thread.contactName,
		contact_handle: input.contactHandle ? sanitizeText(input.contactHandle).slice(0, 80) : thread.contactHandle
	});
	await insertRow("channel_messages", {
		id: crypto.randomUUID(),
		thread_id: thread.id,
		direction: "in",
		body,
		status: "delivered",
		external_id: input.externalMessageId ?? null,
		created_at: stamp,
		created_by: null
	});
	return thread;
}
async function assignThreadClient(threadId, clientId) {
	if (!await getThread(threadId)) throw new Error("THREAD_MISSING");
	await updateThread(threadId, { client_id: clientId });
}
async function sendChannelMessage(input) {
	await ensureChannelsSchema();
	const body = sanitizeText(input.body).slice(0, 4e3);
	if (!body) throw new Error("EMPTY_MESSAGE");
	let thread = input.threadId ? await getThread(input.threadId) : null;
	if (!thread) {
		const provider = input.provider;
		if (!provider) throw new Error("VALIDATION");
		const to = String(input.to ?? "").trim();
		const externalId = provider === "whatsapp" ? parseE164(to.startsWith("+") ? to : `+${to}`) : parseTelegramChatId(to);
		if (!externalId) throw new Error("VALIDATION");
		const existing = await findThread(provider, externalId.replace(/^\+/, ""));
		if (existing) thread = existing;
		else {
			const id = crypto.randomUUID();
			const stamp = (/* @__PURE__ */ new Date()).toISOString();
			const payload = {
				id,
				client_id: input.clientId ?? null,
				provider,
				external_id: provider === "whatsapp" ? externalId.replace(/^\+/, "") : externalId,
				contact_name: externalId,
				contact_handle: provider === "telegram" && externalId.startsWith("@") ? externalId : null,
				last_message_at: stamp,
				last_preview: body.slice(0, 140),
				created_at: stamp
			};
			await insertRow("channel_threads", payload);
			thread = mapThread(payload);
		}
	}
	const stamp = (/* @__PURE__ */ new Date()).toISOString();
	const messageId = crypto.randomUUID();
	let status = "queued";
	let externalId = null;
	try {
		if (thread.provider === "telegram") {
			const token = await loadTelegramToken();
			if (!token) throw new Error("CHANNEL_NOT_CONFIGURED");
			const response = await fetch(telegramApiUrl(token, "sendMessage"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: thread.externalId,
					text: body
				}),
				signal: AbortSignal.timeout(15e3)
			});
			if (!response.ok) throw new Error("CHANNEL_UNAVAILABLE");
			const payload = await response.json();
			if (!payload.ok) throw new Error("CHANNEL_UNAVAILABLE");
			externalId = payload.result?.message_id != null ? String(payload.result.message_id) : null;
			status = "sent";
		} else {
			const config = await loadWhatsAppConfig();
			if (!config) throw new Error("CHANNEL_NOT_CONFIGURED");
			const to = parseE164(thread.externalId.startsWith("+") ? thread.externalId : `+${thread.externalId}`);
			if (!to) throw new Error("VALIDATION");
			const response = await fetch(whatsappMessagesUrl(config.phoneNumberId), {
				method: "POST",
				headers: {
					Authorization: `Bearer ${config.token}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					messaging_product: "whatsapp",
					to: to.replace(/^\+/, ""),
					type: "text",
					text: {
						body,
						preview_url: false
					}
				}),
				signal: AbortSignal.timeout(15e3)
			});
			if (!response.ok) throw new Error("CHANNEL_UNAVAILABLE");
			externalId = (await response.json()).messages?.[0]?.id ?? null;
			status = "sent";
		}
	} catch (error) {
		if (error instanceof Error && (error.message === "CHANNEL_NOT_CONFIGURED" || error.message === "VALIDATION")) throw error;
		status = "failed";
	}
	const messagePayload = {
		id: messageId,
		thread_id: thread.id,
		direction: "out",
		body,
		status,
		external_id: externalId,
		created_at: stamp,
		created_by: input.actorId
	};
	await insertRow("channel_messages", messagePayload);
	await updateThread(thread.id, {
		last_message_at: stamp,
		last_preview: body.slice(0, 140)
	});
	if (status === "failed") throw new Error("CHANNEL_UNAVAILABLE");
	return {
		thread,
		message: mapMessage(messagePayload)
	};
}
async function channelsSnapshot(clients) {
	const [threads, telegram, whatsapp] = await Promise.all([
		listThreads(),
		loadTelegramToken(),
		loadWhatsAppConfig()
	]);
	return {
		threads,
		clients,
		telegramConfigured: Boolean(telegram),
		whatsappConfigured: Boolean(whatsapp)
	};
}
//#endregion
export { assignThreadClient, channelsSnapshot, disconnectTelegram, disconnectWhatsApp, getThread, listMessages, loadTelegramToken, loadTelegramWebhookSecret, loadWhatsAppConfig, persistTelegramSettings, persistWhatsAppSettings, sendChannelMessage, testTelegramConnection, testWhatsAppConnection, upsertInbound };
