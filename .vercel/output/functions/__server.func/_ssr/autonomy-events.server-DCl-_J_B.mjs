import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { d as WEBHOOK_EVENT_TYPES } from "./autonomy-CEwFxjUt.mjs";
import { createHmac } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/autonomy-events.server-DCl-_J_B.js
var autonomy_events_server_exports = /* @__PURE__ */ __exportAll({
	emitAutonomyEvent: () => emitAutonomyEvent,
	emitTestPing: () => emitTestPing,
	readLastDelivery: () => readLastDelivery,
	readLastDeliveryByEvent: () => readLastDeliveryByEvent,
	readOutboundConfig: () => readOutboundConfig,
	signBody: () => signBody,
	verifyInboundSignature: () => verifyInboundSignature,
	writeOutboundConfig: () => writeOutboundConfig
});
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
async function readOutboundConfig() {
	const raw = await readAppSetting("WEBHOOK_OUTBOUND_JSON");
	if (!raw) return {
		destinationUrl: null,
		events: [...WEBHOOK_EVENT_TYPES]
	};
	try {
		const parsed = JSON.parse(raw);
		return {
			destinationUrl: typeof parsed.destinationUrl === "string" && parsed.destinationUrl.startsWith("https://") ? parsed.destinationUrl : null,
			events: Array.isArray(parsed.events) ? parsed.events.filter((item) => WEBHOOK_EVENT_TYPES.includes(String(item))) : [...WEBHOOK_EVENT_TYPES]
		};
	} catch {
		return {
			destinationUrl: null,
			events: [...WEBHOOK_EVENT_TYPES]
		};
	}
}
async function writeOutboundConfig(config) {
	await writeAppSetting("WEBHOOK_OUTBOUND_JSON", JSON.stringify(config));
}
function signBody(secret, timestamp, body) {
	return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}
function verifyInboundSignature(input) {
	const now = input.nowMs ?? Date.now();
	const ts = Number(input.timestamp);
	if (!Number.isFinite(ts)) return false;
	const tsMs = ts > 0xe8d4a51000 ? ts : ts * 1e3;
	if (Math.abs(now - tsMs) > 3e5) return false;
	const expected = signBody(input.secret, input.timestamp, input.rawBody);
	const given = input.signature.replace(/^sha256=/i, "").trim().toLowerCase();
	if (given.length !== expected.length) return false;
	let mismatch = 0;
	for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ given.charCodeAt(i);
	return mismatch === 0;
}
async function persistDelivery(row) {
	try {
		const admin = await getAgencyAdmin();
		if (admin) await admin.from("webhook_deliveries").insert(row);
		else await (await localSql()).query(`insert into webhook_deliveries
          (id, event_id, event_type, payload, destination, status, attempts, last_error, last_attempt_at, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
			row.id,
			row.event_id,
			row.event_type,
			row.payload,
			row.destination,
			row.status,
			row.attempts,
			row.last_error,
			row.last_attempt_at,
			row.created_at
		]);
	} catch {}
}
async function deliverEnvelope(input) {
	const config = await readOutboundConfig();
	const createdAt = nowIso();
	if (!config.destinationUrl) return {
		status: "skipped",
		lastError: "NO_DESTINATION",
		at: createdAt
	};
	const secret = (await readAppSetting("WEBHOOK_SIGNING_SECRET"))?.trim();
	if (!secret) return {
		status: "skipped",
		lastError: "NO_SECRET",
		at: createdAt
	};
	const eventId = newId();
	const envelope = {
		id: eventId,
		type: input.type,
		createdAt,
		resource: {
			type: input.entityType,
			id: input.entityId
		},
		data: input.data
	};
	const body = JSON.stringify(envelope);
	const timestamp = String(Math.floor(Date.now() / 1e3));
	const signature = `sha256=${signBody(secret, timestamp, body)}`;
	let status = "failed";
	let lastError = null;
	let attempts = 0;
	for (let tryN = 0; tryN < 3; tryN += 1) {
		attempts += 1;
		try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 8e3);
			const res = await fetch(config.destinationUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Agency-Signature": signature,
					"X-Agency-Timestamp": timestamp,
					"X-Agency-Event": input.type,
					"X-Agency-Event-Id": eventId
				},
				body,
				signal: controller.signal
			});
			clearTimeout(timer);
			if (res.ok) {
				status = "delivered";
				lastError = null;
				break;
			}
			lastError = `HTTP ${res.status}`;
		} catch {
			lastError = "DELIVERY_FAILED";
		}
		if (tryN < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (tryN + 1)));
	}
	await persistDelivery({
		id: newId(),
		event_id: eventId,
		event_type: input.type,
		payload: body.slice(0, 8e3),
		destination: config.destinationUrl,
		status,
		attempts,
		last_error: lastError,
		last_attempt_at: nowIso(),
		created_at: createdAt
	});
	await writeAppSetting("WEBHOOK_LAST_DELIVERY", JSON.stringify({
		at: createdAt,
		status,
		eventType: input.type
	}));
	return {
		status,
		lastError,
		at: createdAt
	};
}
async function emitAutonomyEvent(input) {
	const config = await readOutboundConfig();
	if (!input.force) {
		if (!config.destinationUrl) return;
		if (!config.events.includes(input.type)) return;
	}
	await deliverEnvelope(input);
}
async function emitTestPing() {
	const result = await deliverEnvelope({
		type: "automation.ping",
		entityType: "automation",
		entityId: "ping",
		data: {
			ping: true,
			source: "clippy-admin"
		}
	});
	return {
		ok: result.status === "delivered",
		status: result.status,
		at: result.at,
		error: result.lastError
	};
}
async function readLastDelivery() {
	const raw = await readAppSetting("WEBHOOK_LAST_DELIVERY");
	if (!raw) return {
		at: null,
		status: null,
		eventType: null
	};
	try {
		const parsed = JSON.parse(raw);
		return {
			at: parsed.at ?? null,
			status: parsed.status ?? null,
			eventType: parsed.eventType ?? null
		};
	} catch {
		return {
			at: null,
			status: null,
			eventType: null
		};
	}
}
async function readLastDeliveryByEvent() {
	const map = {};
	try {
		const admin = await getAgencyAdmin();
		if (admin) {
			const { data, error } = await admin.from("webhook_deliveries").select("event_type, status, created_at").order("created_at", { ascending: false }).limit(80);
			if (!error) {
				for (const row of data ?? []) {
					const type = String(row.event_type ?? "");
					if (!WEBHOOK_EVENT_TYPES.includes(type)) continue;
					const key = type;
					if (map[key]) continue;
					map[key] = {
						at: String(row.created_at ?? ""),
						status: String(row.status ?? "")
					};
				}
				return map;
			}
			if (!isMissingTable(error)) return map;
		}
		const rows = await (await localSql()).query(`select event_type, status, created_at from webhook_deliveries order by created_at desc limit 80`);
		for (const row of rows) {
			if (!WEBHOOK_EVENT_TYPES.includes(row.event_type)) continue;
			const key = row.event_type;
			if (map[key]) continue;
			map[key] = {
				at: row.created_at,
				status: row.status
			};
		}
	} catch {}
	return map;
}
//#endregion
export { readOutboundConfig as a, readLastDeliveryByEvent as i, emitAutonomyEvent as n, verifyInboundSignature as o, readLastDelivery as r, autonomy_events_server_exports as t };
