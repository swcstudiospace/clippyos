import { r as __exportAll } from "../_runtime.mjs";
import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/higgsfield.server-DqdavdNF.js
var higgsfield_server_DqdavdNF_exports = /* @__PURE__ */ __exportAll({
	n: () => higgsfield_server_exports,
	t: () => generateThumbnailImage
});
var higgsfield_server_exports = /* @__PURE__ */ __exportAll$1({
	clearHiggsfieldCredsCache: () => clearHiggsfieldCredsCache,
	generateThumbnailImage: () => generateThumbnailImage,
	higgsfieldAvailable: () => higgsfieldAvailable,
	imageGenAvailable: () => imageGenAvailable,
	loadHiggsfieldCreds: () => loadHiggsfieldCreds,
	persistHiggsfieldCreds: () => persistHiggsfieldCreds
});
var HIGGSFIELD_BASE = "https://platform.higgsfield.ai";
/** Confirmed live path. 404s are skipped so a renamed catalog still works. */
var MODEL_PATHS = ["nano-banana-pro", "google/nano-banana-pro"];
var POLL_MS = 2e3;
var MAX_POLLS = 45;
var SETTING_KEY_IDS = [
	"HIGGSFIELD_API_KEY",
	"HIGGSFIELD_KEY_ID",
	"HF_API_KEY",
	"HF_API_KEY_ID"
];
var SETTING_SECRET_IDS = [
	"HIGGSFIELD_API_SECRET",
	"HIGGSFIELD_SECRET",
	"HF_API_SECRET",
	"HF_API_KEY_SECRET"
];
var SETTING_COMBINED_IDS = [
	"HIGGSFIELD_KEY",
	"HF_KEY",
	"HF_CREDENTIALS"
];
/**
* Preview fallback so Thumbnails keeps working without a `.env` file.
* Never import this module from a client component.
*/
var PREVIEW_KEY_ID = "2ad0f35d-b528-4999-906d-8840a4c1cec3";
var PREVIEW_SECRET = "00e36bd22052dca705da146b9468224909978e00a8153efcf095893f4ac76e68";
var credsCache = null;
var CREDS_TTL_MS = 3e4;
var persistAttempted = false;
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
function envCombined() {
	return process.env.HF_CREDENTIALS?.trim() || process.env.HF_KEY?.trim() || process.env.HIGGSFIELD_KEY?.trim() || null;
}
function envPair() {
	const key = process.env.HF_API_KEY_ID?.trim() || process.env.HF_API_KEY?.trim() || process.env.HIGGSFIELD_API_KEY?.trim() || "";
	const secret = process.env.HF_API_KEY_SECRET?.trim() || process.env.HF_API_SECRET?.trim() || process.env.HIGGSFIELD_API_SECRET?.trim() || "";
	if (key && secret && !looksRedacted(key) && !looksRedacted(secret)) return {
		key,
		secret
	};
	const combined = envCombined();
	if (combined?.includes(":") && !looksRedacted(combined)) {
		const idx = combined.indexOf(":");
		return {
			key: combined.slice(0, idx),
			secret: combined.slice(idx + 1)
		};
	}
	return null;
}
function previewPair() {
	if (looksRedacted(PREVIEW_KEY_ID) || looksRedacted(PREVIEW_SECRET)) return null;
	return {
		key: PREVIEW_KEY_ID,
		secret: PREVIEW_SECRET
	};
}
async function readSettingsMap() {
	const map = /* @__PURE__ */ new Map();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("app_settings").select("key,value");
		if (!error) {
			for (const row of data ?? []) {
				const record = row;
				if (record.key && record.value) map.set(record.key, record.value);
			}
			return map;
		}
		if (!isMissingTable(error)) return map;
	}
	try {
		const rows = await (await localSql()).query("select key, value from app_settings");
		for (const row of rows) if (row.key && row.value) map.set(row.key, row.value);
	} catch {}
	return map;
}
function credsFromSettings(map) {
	const combinedKey = SETTING_COMBINED_IDS.find((id) => map.get(id)?.includes(":"));
	if (combinedKey) {
		const combined = map.get(combinedKey);
		if (looksRedacted(combined)) return null;
		const idx = combined.indexOf(":");
		const key = combined.slice(0, idx).trim();
		const secret = combined.slice(idx + 1).trim();
		if (key && secret) return {
			key,
			secret
		};
	}
	const keyId = SETTING_KEY_IDS.find((id) => map.get(id)?.trim());
	const secretId = SETTING_SECRET_IDS.find((id) => map.get(id)?.trim());
	if (keyId && secretId) {
		const key = map.get(keyId).trim();
		const secret = map.get(secretId).trim();
		if (key && secret && !looksRedacted(key) && !looksRedacted(secret)) return {
			key,
			secret
		};
	}
	return null;
}
async function writeSetting(key, value) {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const id = crypto.randomUUID();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("app_settings").upsert({
			id,
			key,
			value,
			created_at: now,
			updated_at: now,
			created_by: null
		}, { onConflict: "key" });
		if (error && !isMissingTable(error)) {
			const existing = await admin.from("app_settings").select("id").eq("key", key).maybeSingle();
			if (existing.data && typeof existing.data.id === "string") await admin.from("app_settings").update({
				value,
				updated_at: now
			}).eq("id", existing.data.id);
			else if (!existing.error || isMissingTable(existing.error)) await admin.from("app_settings").insert({
				id,
				key,
				value,
				created_at: now,
				updated_at: now,
				created_by: null
			});
		}
	}
	try {
		await (await localSql()).query(`insert into app_settings (id, key, value, created_at, updated_at, created_by)
       values ($1, $2, $3, $4, $5, null)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`, [
			id,
			key,
			value,
			now,
			now
		]);
	} catch {}
}
async function persistHiggsfieldCreds(creds) {
	if (!creds.key || !creds.secret) return;
	await writeSetting("HIGGSFIELD_API_KEY", creds.key);
	await writeSetting("HIGGSFIELD_API_SECRET", creds.secret);
	credsCache = {
		at: Date.now(),
		creds
	};
}
async function persistPreviewIfNeeded(creds) {
	if (persistAttempted) return;
	persistAttempted = true;
	try {
		if (credsFromSettings(await readSettingsMap())) return;
		await persistHiggsfieldCreds(creds);
	} catch {}
}
function clearHiggsfieldCredsCache() {
	credsCache = null;
	persistAttempted = false;
}
async function loadHiggsfieldCreds() {
	const now = Date.now();
	if (credsCache && now - credsCache.at < CREDS_TTL_MS) return credsCache.creds;
	const fromEnv = envPair();
	if (fromEnv) {
		credsCache = {
			at: now,
			creds: fromEnv
		};
		persistPreviewIfNeeded(fromEnv);
		return fromEnv;
	}
	try {
		const fromSettings = credsFromSettings(await readSettingsMap());
		if (fromSettings) {
			credsCache = {
				at: now,
				creds: fromSettings
			};
			return fromSettings;
		}
	} catch {}
	const preview = previewPair();
	credsCache = {
		at: now,
		creds: preview
	};
	if (preview) persistPreviewIfNeeded(preview);
	return preview;
}
async function higgsfieldAvailable() {
	return Boolean(await loadHiggsfieldCreds());
}
async function imageGenAvailable() {
	if (await higgsfieldAvailable()) return true;
	const { llmAvailable } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	return llmAvailable();
}
function authHeader(creds) {
	return `Key ${creds.key}:${creds.secret}`;
}
function requestHeaders(creds) {
	return {
		Authorization: authHeader(creds),
		"Content-Type": "application/json",
		Accept: "application/json",
		"User-Agent": "higgsfield-server-js/2.0"
	};
}
function extractImageUrl(payload, depth = 0) {
	if (depth > 8 || payload == null) return null;
	if (typeof payload === "string") {
		const trimmed = payload.trim();
		return isTrustedImageUrl(trimmed) ? trimmed : null;
	}
	if (Array.isArray(payload)) {
		for (const item of payload) {
			const found = extractImageUrl(item, depth + 1);
			if (found) return found;
		}
		return null;
	}
	if (typeof payload !== "object") return null;
	const obj = payload;
	for (const key of [
		"url",
		"image_url",
		"imageUrl",
		"image"
	]) {
		const found = extractImageUrl(obj[key], depth + 1);
		if (found) return found;
	}
	for (const key of [
		"images",
		"output",
		"result",
		"results",
		"raw",
		"data",
		"images_data",
		"jobs"
	]) {
		const found = extractImageUrl(obj[key], depth + 1);
		if (found) return found;
	}
	return null;
}
function detailText(payload) {
	if (typeof payload === "string") return payload;
	if (payload && typeof payload === "object" && "detail" in payload) {
		const detail = payload.detail;
		if (typeof detail === "string") return detail;
		try {
			return JSON.stringify(detail);
		} catch {
			return "";
		}
	}
	return "";
}
function mapHttpError(status, payload) {
	if (status === 429) return {
		ok: false,
		error: "rate_limit"
	};
	const detail = detailText(payload).toLowerCase();
	if (status === 401) return {
		ok: false,
		error: "missing"
	};
	if (status === 403) {
		if (detail.includes("not_enough_credits") || detail.includes("credit")) return {
			ok: false,
			error: "failed"
		};
		return {
			ok: false,
			error: "missing"
		};
	}
	return {
		ok: false,
		error: "failed"
	};
}
async function pollStatus(statusUrl, creds) {
	for (let i = 0; i < MAX_POLLS; i += 1) {
		await new Promise((resolve) => setTimeout(resolve, POLL_MS));
		let response;
		try {
			response = await fetch(statusUrl, {
				headers: requestHeaders(creds),
				signal: AbortSignal.timeout(15e3)
			});
		} catch (error) {
			if (error instanceof Error && error.name === "TimeoutError") continue;
			return {
				ok: false,
				error: "failed"
			};
		}
		if (response.status === 429) return {
			ok: false,
			error: "rate_limit"
		};
		if (!response.ok) {
			const body = await response.json().catch(() => null);
			return mapHttpError(response.status, body);
		}
		let body;
		try {
			body = await response.json();
		} catch {
			return {
				ok: false,
				error: "failed"
			};
		}
		const status = typeof body === "object" && body && "status" in body ? String(body.status ?? "").toLowerCase() : "";
		if (status === "completed" || status === "complete" || status === "succeeded" || status === "success" || status === "done") {
			const url = extractImageUrl(body);
			if (url) return {
				ok: true,
				url,
				provider: "higgsfield"
			};
			return {
				ok: false,
				error: "failed"
			};
		}
		if (status === "failed" || status === "error" || status === "nsfw" || status === "cancelled" || status === "canceled") return {
			ok: false,
			error: "failed"
		};
	}
	return {
		ok: false,
		error: "timeout"
	};
}
async function submitHiggsfield(creds, prompt) {
	const body = JSON.stringify({
		prompt,
		aspect_ratio: "16:9",
		resolution: "4k"
	});
	for (const path of MODEL_PATHS) {
		let response;
		try {
			response = await fetch(`${HIGGSFIELD_BASE}/${path}`, {
				method: "POST",
				headers: requestHeaders(creds),
				body,
				signal: AbortSignal.timeout(3e4)
			});
		} catch (error) {
			if (error instanceof Error && error.name === "TimeoutError") return {
				ok: false,
				error: "timeout"
			};
			continue;
		}
		if (response.status === 404) continue;
		let payload = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}
		if (response.status === 429) return {
			ok: false,
			error: "rate_limit"
		};
		if (!response.ok) return mapHttpError(response.status, payload);
		const immediate = extractImageUrl(payload);
		if (immediate) return {
			ok: true,
			url: immediate,
			provider: "higgsfield"
		};
		const statusUrl = typeof payload === "object" && payload && "status_url" in payload ? String(payload.status_url ?? "") : "";
		const requestId = typeof payload === "object" && payload && "request_id" in payload ? String(payload.request_id ?? "") : "";
		const pollUrl = statusUrl || (requestId ? `${HIGGSFIELD_BASE}/requests/${requestId}/status` : "");
		if (!pollUrl) return {
			ok: false,
			error: "failed"
		};
		return pollStatus(pollUrl, creds);
	}
	return {
		ok: false,
		error: "failed"
	};
}
async function generateWithXai(prompt) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "missing"
	};
	for (const model of [
		"grok-imagine-image-2.0",
		"grok-imagine-image-quality",
		"grok-imagine-image"
	]) try {
		const response = await fetch("https://api.x.ai/v1/images/generations", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model,
				prompt: `${prompt}\n\nYouTube thumbnail, exact 16:9 widescreen, ultra sharp, high contrast, cinematic lighting.`,
				n: 1,
				aspect_ratio: "16:9",
				resolution: "2k",
				response_format: "url"
			}),
			signal: AbortSignal.timeout(9e4)
		});
		if (response.status === 404) continue;
		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			console.error("[thumbnails-image]", model, response.status, detail.slice(0, 240));
			if (response.status === 429) return {
				ok: false,
				error: "rate_limit"
			};
			return mapHttpError(response.status);
		}
		const first = (await response.json()).data?.[0];
		if (first?.url && isTrustedImageUrl(first.url)) return {
			ok: true,
			url: first.url,
			provider: "xai"
		};
		if (first?.b64_json) {
			const dataUrl = `data:image/png;base64,${first.b64_json}`;
			if (isTrustedImageUrl(dataUrl)) return {
				ok: true,
				url: dataUrl,
				provider: "xai"
			};
		}
		return {
			ok: false,
			error: "failed"
		};
	} catch (error) {
		console.error("[thumbnails-image] throw", model, error instanceof Error ? `${error.name}: ${error.message}` : "error");
		if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return {
			ok: false,
			error: "timeout"
		};
	}
	return {
		ok: false,
		error: "failed"
	};
}
async function generateThumbnailImage(prompt) {
	const trimmed = prompt.replace(/\s+/g, " ").trim().slice(0, 3500);
	if (!trimmed) return {
		ok: false,
		error: "failed"
	};
	const creds = await loadHiggsfieldCreds();
	if (creds) {
		const result = await submitHiggsfield(creds, trimmed);
		if (result.ok) return result;
		if (result.error === "missing" || result.error === "failed") {
			const fallback = await generateWithXai(trimmed);
			if (fallback.ok) return fallback;
		}
		return result;
	}
	return generateWithXai(trimmed);
}
//#endregion
export { higgsfield_server_DqdavdNF_exports as n, generateThumbnailImage as t };
