import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as writeAppSetting, n as deleteAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/xai.server-D2IejPGx.js
var xai_server_D2IejPGx_exports = /* @__PURE__ */ __exportAll({
	a: () => xaiRateLimitSnapshot,
	c: () => xai_server_exports,
	i: () => xaiChat,
	n: () => llmAvailable,
	o: () => xaiText,
	r: () => llmStatus,
	s: () => xaiTextContent,
	t: () => XAI_MODEL
});
/**
* Unified xAI / Grok client.
*
* Credential order:
*   1. SuperGrok OAuth (device-code against auth.x.ai — same flow as Grok Build / Hermes)
*   2. Platform-injected XAI_API_KEY (preview + deploy)
*
* OAuth traffic prefers the Grok CLI chat proxy so SuperGrok Heavy quota is used
* instead of API credits. Tokens never leave the server.
*/
var xai_server_exports = /* @__PURE__ */ __exportAll$1({
	XAI_MODEL: () => XAI_MODEL,
	XAI_MODEL_FALLBACK: () => XAI_MODEL_FALLBACK,
	disconnectGrokOAuth: () => disconnectGrokOAuth,
	llmAvailable: () => llmAvailable,
	llmStatus: () => llmStatus,
	pollGrokDeviceLogin: () => pollGrokDeviceLogin,
	resolveCredsFor: () => resolveCredsFor,
	startGrokDeviceLogin: () => startGrokDeviceLogin,
	xaiChat: () => xaiChat,
	xaiRateLimitSnapshot: () => xaiRateLimitSnapshot,
	xaiText: () => xaiText,
	xaiTextContent: () => xaiTextContent
});
var XAI_MODEL = "grok-4.6";
var XAI_MODEL_FALLBACK = "grok-4.5";
var TOKEN_KEY = "GROK_OAUTH_TOKENS";
var PENDING_KEY = "GROK_OAUTH_PENDING";
var ISSUER = "https://auth.x.ai";
var DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;
var DEVICE_CODE_URL = `${ISSUER}/oauth2/device/code`;
var TOKEN_URL = `${ISSUER}/oauth2/token`;
var USERINFO_URL = `${ISSUER}/oauth2/userinfo`;
var PROXY_BASE = "https://cli-chat-proxy.grok.com/v1";
var API_BASE = "https://api.x.ai/v1";
var SCOPE = "openid profile email offline_access grok-cli:access api:access";
var REFRESH_SKEW_MS = 6e4;
var CLIENT_VERSION = "0.2.114";
/**
* Public Grok CLI / Hermes Agent OAuth client. Device-code flow has no secret.
* Override with XAI_OAUTH_CLIENT_ID when xAI issues an app-specific client.
*/
var DEFAULT_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
var mem = globalThis;
function clientId() {
	return process.env.XAI_OAUTH_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
}
function proxyBase() {
	return (process.env.GROK_CLI_CHAT_PROXY_BASE_URL?.trim() || PROXY_BASE).replace(/\/+$/, "");
}
function platformKey() {
	return process.env.XAI_API_KEY?.trim() || null;
}
async function settingsApiKey() {
	const stored = (await readAppSetting("XAI_API_KEY"))?.trim() || "";
	if (!stored || /[•…]|YOUR_|changeme|placeholder/i.test(stored)) return null;
	return stored;
}
async function compatApiKey() {
	const stored = (await readAppSetting("AI_API_KEY"))?.trim() || "";
	if (!stored || /[•…]|YOUR_|changeme|placeholder/i.test(stored)) return null;
	return stored;
}
function parseTokens(raw) {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed.accessToken) return null;
		return {
			accessToken: parsed.accessToken,
			refreshToken: parsed.refreshToken ?? null,
			expiresAt: parsed.expiresAt ?? new Date(Date.now() + 36e5).toISOString(),
			email: parsed.email ?? null,
			tokenType: parsed.tokenType ?? "Bearer"
		};
	} catch {
		return null;
	}
}
async function loadStoredTokens() {
	if (mem.__clippyGrokTokens__?.accessToken) return mem.__clippyGrokTokens__;
	const stored = parseTokens(await readAppSetting(TOKEN_KEY));
	mem.__clippyGrokTokens__ = stored;
	return stored;
}
async function persistTokens(tokens) {
	mem.__clippyGrokTokens__ = tokens;
	if (!tokens) {
		await deleteAppSetting(TOKEN_KEY);
		return;
	}
	await writeAppSetting(TOKEN_KEY, JSON.stringify(tokens));
}
async function loadPending() {
	if (mem.__clippyGrokPending__) return mem.__clippyGrokPending__;
	const raw = await readAppSetting(PENDING_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed.deviceCode) return null;
		mem.__clippyGrokPending__ = parsed;
		return parsed;
	} catch {
		return null;
	}
}
async function persistPending(pending) {
	mem.__clippyGrokPending__ = pending;
	if (!pending) {
		await deleteAppSetting(PENDING_KEY);
		return;
	}
	await writeAppSetting(PENDING_KEY, JSON.stringify(pending));
}
function isExpired(expiresAt, skewMs = REFRESH_SKEW_MS) {
	const at = Date.parse(expiresAt);
	if (!Number.isFinite(at)) return true;
	return at - skewMs <= Date.now();
}
async function refreshTokens(current) {
	if (!current.refreshToken) return null;
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		client_id: clientId(),
		refresh_token: current.refreshToken
	});
	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		},
		body,
		signal: AbortSignal.timeout(15e3)
	});
	if (!response.ok) return null;
	const json = await response.json();
	if (!json.access_token) return null;
	const next = {
		accessToken: json.access_token,
		refreshToken: json.refresh_token ?? current.refreshToken,
		expiresAt: new Date(Date.now() + Math.max(60, json.expires_in ?? 3600) * 1e3).toISOString(),
		email: current.email,
		tokenType: json.token_type ?? "Bearer"
	};
	await persistTokens(next);
	return next;
}
async function lookupEmail(accessToken) {
	try {
		const response = await fetch(USERINFO_URL, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json"
			},
			signal: AbortSignal.timeout(1e4)
		});
		if (!response.ok) return null;
		const json = await response.json();
		return json.email ?? json.preferred_username ?? null;
	} catch {
		return null;
	}
}
async function oauthBearer() {
	let tokens = await loadStoredTokens();
	if (!tokens) return null;
	if (isExpired(tokens.expiresAt)) {
		tokens = await refreshTokens(tokens) ?? tokens;
		if (isExpired(tokens.expiresAt, 0)) {
			await persistTokens(null);
			return null;
		}
	}
	return tokens.accessToken;
}
async function resolveCreds() {
	return resolveCredsFor();
}
async function resolveCredsFor(prefer) {
	if (prefer === "xai-oauth") {
		const oauth = await oauthBearer();
		if (!oauth) return null;
		return oauthCreds(oauth);
	}
	if (prefer === "xai-api") {
		const stored = await settingsApiKey();
		if (stored) return keyCreds(stored);
		const key = platformKey();
		if (key) return {
			source: "platform",
			bearer: key,
			bases: [API_BASE],
			extraHeaders: {}
		};
		return null;
	}
	if (prefer === "openai-compat") {
		const key = await compatApiKey();
		if (!key) return null;
		return {
			source: "key",
			bearer: key,
			bases: [(await readAppSetting("OPENAI_COMPAT_BASE"))?.trim().replace(/\/+$/, "") || "https://api.openai.com/v1"],
			extraHeaders: {}
		};
	}
	const oauth = await oauthBearer();
	if (oauth) return oauthCreds(oauth);
	const stored = await settingsApiKey() || await compatApiKey();
	if (stored) return keyCreds(stored);
	const key = platformKey();
	if (key) return {
		source: "platform",
		bearer: key,
		bases: [API_BASE],
		extraHeaders: {}
	};
	return null;
}
function oauthCreds(oauth) {
	return {
		source: "oauth",
		bearer: oauth,
		bases: [proxyBase(), API_BASE],
		extraHeaders: {
			"x-xai-token-auth": "xai-grok-cli",
			"x-grok-client-identifier": "grok-shell",
			"x-grok-client-version": CLIENT_VERSION,
			"User-Agent": "xai-grok-cli"
		}
	};
}
function keyCreds(stored) {
	return {
		source: "key",
		bearer: stored,
		bases: [API_BASE],
		extraHeaders: {}
	};
}
var limiters = /* @__PURE__ */ new Map();
var MAX_CONCURRENCY = 4;
var MAX_429_ATTEMPTS = 6;
var RECENT_429_WINDOW_MS = 6e5;
function limiterFor(model) {
	const existing = limiters.get(model);
	if (existing) return existing;
	const created = {
		inFlight: 0,
		queue: [],
		recent429: [],
		last429At: null,
		backoffUntil: null
	};
	limiters.set(model, created);
	return created;
}
async function acquireSlot(model) {
	const lim = limiterFor(model);
	if (lim.inFlight < MAX_CONCURRENCY) {
		lim.inFlight += 1;
		return;
	}
	await new Promise((resolve) => {
		lim.queue.push(resolve);
	});
	lim.inFlight += 1;
}
function releaseSlot(model) {
	const lim = limiterFor(model);
	lim.inFlight = Math.max(0, lim.inFlight - 1);
	const next = lim.queue.shift();
	if (next) next();
}
function prune429(lim) {
	const cutoff = Date.now() - RECENT_429_WINDOW_MS;
	lim.recent429 = lim.recent429.filter((at) => at >= cutoff);
}
function backoffMs(attempt, retryAfter) {
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.max(seconds * 1e3, 250), 6e4);
		const date = Date.parse(retryAfter);
		if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 250), 6e4);
	}
	return Math.min(2 ** attempt * 1e3, 32e3) + Math.floor(Math.random() * 400);
}
function xaiRateLimitSnapshot() {
	let recent429 = 0;
	let backoffUntil = null;
	let inFlight = 0;
	for (const lim of limiters.values()) {
		prune429(lim);
		recent429 += lim.recent429.length;
		inFlight += lim.inFlight;
		if (lim.backoffUntil && (backoffUntil == null || lim.backoffUntil > backoffUntil)) backoffUntil = lim.backoffUntil;
	}
	const retrying = backoffUntil != null && backoffUntil > Date.now();
	return {
		recent429,
		backoffUntil: backoffUntil ? new Date(backoffUntil).toISOString() : null,
		inFlight,
		retrying,
		message: retrying ? "Capacity — retrying…" : recent429 > 0 ? "Recent rate limits; requests are queued." : null
	};
}
async function llmAvailable() {
	if (platformKey()) return true;
	if (await settingsApiKey()) return true;
	return Boolean(await oauthBearer());
}
async function llmStatus() {
	const tokens = await loadStoredTokens();
	if (tokens?.accessToken && !isExpired(tokens.expiresAt, 0)) return {
		available: true,
		source: "oauth",
		email: tokens.email
	};
	if (tokens?.refreshToken) {
		const refreshed = await refreshTokens(tokens);
		if (refreshed) return {
			available: true,
			source: "oauth",
			email: refreshed.email
		};
	}
	if (await settingsApiKey()) return {
		available: true,
		source: "key",
		email: null
	};
	if (platformKey()) return {
		available: true,
		source: "platform",
		email: null
	};
	return {
		available: false,
		source: "none",
		email: null
	};
}
async function startGrokDeviceLogin() {
	let deviceUrl = DEVICE_CODE_URL;
	try {
		const disco = await fetch(DISCOVERY_URL, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8e3)
		});
		if (disco.ok) {
			const next = (await disco.json()).device_authorization_endpoint?.trim();
			if (next?.startsWith("https://") && new URL(next).hostname.endsWith("x.ai")) deviceUrl = next;
		}
	} catch {}
	const response = await fetch(deviceUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		},
		body: new URLSearchParams({
			client_id: clientId(),
			scope: SCOPE
		}),
		signal: AbortSignal.timeout(15e3)
	});
	if (!response.ok) throw new Error("OAUTH_START_FAILED");
	const json = await response.json();
	if (!json.device_code || !json.user_code || !json.verification_uri) throw new Error("OAUTH_START_FAILED");
	const expiresIn = Math.max(60, json.expires_in ?? 600);
	const interval = Math.max(3, json.interval ?? 5);
	await persistPending({
		deviceCode: json.device_code,
		interval,
		expiresAt: new Date(Date.now() + expiresIn * 1e3).toISOString()
	});
	return {
		userCode: json.user_code,
		verificationUri: json.verification_uri,
		verificationUriComplete: json.verification_uri_complete ?? null,
		expiresIn,
		interval
	};
}
async function pollGrokDeviceLogin() {
	const pending = await loadPending();
	if (!pending) return { status: "expired" };
	if (isExpired(pending.expiresAt, 0)) {
		await persistPending(null);
		return { status: "expired" };
	}
	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		},
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:device_code",
			device_code: pending.deviceCode,
			client_id: clientId()
		}),
		signal: AbortSignal.timeout(15e3)
	});
	const json = await response.json().catch(() => ({}));
	if (!response.ok) {
		const err = json.error ?? "";
		if (err === "authorization_pending") return {
			status: "pending",
			interval: pending.interval
		};
		if (err === "slow_down") return {
			status: "slow_down",
			interval: pending.interval + 5
		};
		if (err === "access_denied") {
			await persistPending(null);
			return { status: "denied" };
		}
		if (err === "expired_token") {
			await persistPending(null);
			return { status: "expired" };
		}
		return {
			status: "pending",
			interval: pending.interval
		};
	}
	if (!json.access_token) return {
		status: "pending",
		interval: pending.interval
	};
	const email = await lookupEmail(json.access_token);
	await persistTokens({
		accessToken: json.access_token,
		refreshToken: json.refresh_token ?? null,
		expiresAt: new Date(Date.now() + Math.max(60, json.expires_in ?? 3600) * 1e3).toISOString(),
		email,
		tokenType: json.token_type ?? "Bearer"
	});
	await persistPending(null);
	return {
		status: "connected",
		email
	};
}
async function disconnectGrokOAuth() {
	await persistPending(null);
	await persistTokens(null);
}
function modelNotFound(status, body) {
	if (status !== 400 && status !== 404) return false;
	return /model/i.test(body) && /(not found|does not exist|unknown|invalid)/i.test(body);
}
async function xaiChat(params) {
	const creds = await resolveCredsFor(params.provider);
	if (!creds) throw new Error("AI_UNAVAILABLE");
	const requested = params.model?.trim();
	const models = params.provider === "openai-compat" ? [requested && !requested.startsWith("grok") ? requested : "gpt-4o-mini"] : requested ? [
		requested,
		XAI_MODEL,
		XAI_MODEL_FALLBACK
	].filter((item, index, all) => all.indexOf(item) === index) : [XAI_MODEL, XAI_MODEL_FALLBACK];
	let lastStatus = 0;
	let usedRefresh = false;
	for (const base of creds.bases) for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
		const model = models[modelIndex];
		const payload = {
			model,
			temperature: params.temperature ?? .6,
			max_tokens: params.maxTokens ?? 1600,
			messages: params.messages
		};
		if (params.tools) {
			payload.tools = params.tools;
			payload.tool_choice = params.toolChoice ?? "auto";
		}
		if (params.reasoningEffort) payload.reasoning_effort = params.reasoningEffort;
		if (params.promptCacheKey) payload.prompt_cache_key = params.promptCacheKey;
		const extra = { ...creds.extraHeaders };
		if (params.conversationId) extra["x-conversation-id"] = params.conversationId;
		if (params.promptCacheKey) extra["x-prompt-cache-key"] = params.promptCacheKey;
		const lim = limiterFor(model);
		await acquireSlot(model);
		try {
			if (lim.backoffUntil && lim.backoffUntil > Date.now()) await new Promise((resolve) => setTimeout(resolve, lim.backoffUntil - Date.now()));
			let attempt = 0;
			while (attempt < MAX_429_ATTEMPTS) {
				const response = await fetch(`${base}/chat/completions`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						Authorization: `Bearer ${creds.bearer}`,
						...extra
					},
					body: JSON.stringify(payload),
					signal: AbortSignal.timeout(params.timeoutMs ?? 6e4)
				});
				lastStatus = response.status;
				if (response.status === 429) {
					prune429(lim);
					lim.recent429.push(Date.now());
					lim.last429At = Date.now();
					const wait = backoffMs(attempt, response.headers.get("retry-after"));
					lim.backoffUntil = Date.now() + wait;
					attempt += 1;
					if (attempt >= MAX_429_ATTEMPTS) throw new Error("AI_RATE_LIMIT");
					await new Promise((resolve) => setTimeout(resolve, wait));
					continue;
				}
				const raw = await response.text();
				if (response.ok) {
					lim.backoffUntil = null;
					const choice = JSON.parse(raw).choices?.[0];
					return {
						finish: choice?.finish_reason ?? null,
						message: {
							role: "assistant",
							content: choice?.message?.content ?? null,
							tool_calls: choice?.message?.tool_calls
						}
					};
				}
				if (response.status === 403 && creds.source === "oauth") throw new Error("AI_TIER_GATED");
				if (response.status === 401 && creds.source === "oauth" && !usedRefresh) {
					usedRefresh = true;
					const tokens = await loadStoredTokens();
					if (tokens) await refreshTokens(tokens);
					const next = await resolveCreds();
					if (next) {
						creds.bearer = next.bearer;
						modelIndex -= 1;
						break;
					}
				}
				if (modelNotFound(response.status, raw) && modelIndex < models.length - 1) break;
				if (params.reasoningEffort && (response.status === 400 || response.status === 422)) {
					params.reasoningEffort = void 0;
					modelIndex -= 1;
					break;
				}
				if (response.status === 426 || response.status === 402) break;
				break;
			}
		} finally {
			releaseSlot(model);
		}
	}
	if (lastStatus === 429) throw new Error("AI_RATE_LIMIT");
	throw new Error("GENERATION_FAILED");
}
function xaiTextContent(content) {
	if (typeof content === "string") return content.trim();
	if (!content) return "";
	return content.map((part) => part.type === "text" ? part.text : "").join(" ").trim();
}
async function xaiText(params) {
	const { message } = await xaiChat(params);
	const text = xaiTextContent(message.content);
	if (!text) throw new Error("GENERATION_FAILED");
	return text;
}
//#endregion
export { xaiText as a, xaiRateLimitSnapshot as i, llmStatus as n, xaiTextContent as o, xaiChat as r, xai_server_D2IejPGx_exports as s, llmAvailable as t };
