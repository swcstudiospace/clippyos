import { a as emptyInstagramDetails, d as loadPublisherApp, f as mapIgAccountType, l as ensureFreshToken, u as forceRefreshToken, v as readToken } from "./social-oauth.server-BkBN9MI7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/instagram-publisher.server-DyG449YH.js
/**
* Instagram Reels Graph publisher.
* Professional (Business / Creator) accounts only. Personal stays on Computer Use.
* Graph has no durable draft Reel — draft jobs stay in Agency Admin.
* Tokens stay in AppSetting. Never returned to the client or Hermes.
*/
var GRAPH = "https://graph.facebook.com/v21.0";
var CAPTION_MAX = 2200;
var HITS_WINDOW_MS = 36e5;
var HITS_MAX = 25;
var hits = [];
function rateLimitLocal() {
	const now = Date.now();
	while (hits.length && now - hits[0] >= HITS_WINDOW_MS) hits.shift();
	if (hits.length >= HITS_MAX) throw new Error("PUBLISHER_RATE_LIMIT");
	hits.push(now);
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function jitterWait(baseMs) {
	return baseMs + Math.floor(Math.random() * Math.max(250, baseMs * .25));
}
async function readInstagramDetails() {
	const token = await readToken("instagram");
	const igUserId = token?.userId ?? null;
	const username = token?.handle?.replace(/^@/, "") ?? null;
	const accountType = mapIgAccountType(token?.accountType);
	const personal = (token?.accountType ?? "").toUpperCase() === "PERSONAL";
	const eligibleReelsPublish = Boolean(token?.accessToken && igUserId && !personal);
	return {
		igUserId,
		username,
		accountType,
		pageId: token?.pageId ?? null,
		eligibleReelsPublish
	};
}
async function isConfigured() {
	try {
		const [app, token] = await Promise.all([loadPublisherApp("instagram"), readToken("instagram")]);
		return Boolean(app && token?.accessToken && token.userId);
	} catch {
		return false;
	}
}
async function isEligible() {
	if (!await isConfigured()) return {
		ok: false,
		reason: "Connect a professional Instagram account in Settings."
	};
	if (!(await readInstagramDetails()).eligibleReelsPublish) return {
		ok: false,
		reason: "API publish requires an Instagram Professional account."
	};
	return {
		ok: true,
		reason: null
	};
}
function graphToken(token) {
	return token.pageToken || token.accessToken;
}
function isTrustedIgMedia(url) {
	if (!url) return false;
	if (url.startsWith("data:")) return /^data:video\//i.test(url) || isTrustedImageUrl(url);
	return isTrustedImageUrl(url);
}
function canPullUrl(url) {
	if (!url.startsWith("https://")) return false;
	if (!isTrustedIgMedia(url)) return false;
	try {
		const host = new URL(url).hostname.toLowerCase();
		if (host === "localhost" || host.endsWith(".local") || host === "127.0.0.1") return false;
		return true;
	} catch {
		return false;
	}
}
function mapGraphError(status, body) {
	let code = 0;
	let message = "";
	try {
		const json = JSON.parse(body);
		code = json.error?.code ?? 0;
		message = json.error?.message ?? "";
	} catch {}
	if (status === 401 || code === 190) return /* @__PURE__ */ new Error("PUBLISHER_TOKEN_EXPIRED");
	if (status === 429 || code === 4 || code === 17 || code === 613) return /* @__PURE__ */ new Error("PUBLISHER_RATE_LIMIT");
	if (code === 10 || code === 200 || /permission|app review|ppa/i.test(message)) return /* @__PURE__ */ new Error("IG_APP_REVIEW");
	if (/personal|not a business|professional/i.test(message) || status === 403) return /* @__PURE__ */ new Error("IG_PROFESSIONAL_REQUIRED");
	if (/format|codec|aspect|duration|too large|413/i.test(message)) return /* @__PURE__ */ new Error("IG_MEDIA_UNSUPPORTED");
	return /* @__PURE__ */ new Error("PUBLISHER_REJECTED");
}
async function graphFetch(path, makeInit, onStatus) {
	const url = path.startsWith("http") ? path : `${GRAPH}${path.startsWith("/") ? path : `/${path}`}`;
	async function send(access) {
		const req = makeInit();
		const headers = new Headers(req.headers);
		if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${access}`);
		const timeout = req.signal ?? AbortSignal.timeout(3e4);
		return fetch(url, {
			...req,
			headers,
			signal: timeout
		});
	}
	let token = await ensureFreshToken("instagram");
	let access = graphToken(token);
	let response = await send(access);
	if (response.status === 401) {
		token = await forceRefreshToken("instagram");
		access = graphToken(token);
		response = await send(access);
	}
	if (response.status !== 429) return response;
	let delay = 1e3;
	for (let attempt = 0; attempt < 4; attempt += 1) {
		await onStatus?.("Capacity — retrying");
		const retryAfter = Number(response.headers.get("retry-after"));
		const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1e3 : jitterWait(delay);
		await sleep(Math.min(wait, 2e4));
		delay = Math.min(delay * 2, 16e3);
		token = await ensureFreshToken("instagram");
		access = graphToken(token);
		response = await send(access);
		if (response.status === 401) {
			token = await forceRefreshToken("instagram");
			access = graphToken(token);
			response = await send(access);
		}
		if (response.status !== 429) return response;
	}
	return response;
}
async function createPullContainer(igUserId, videoUrl, caption, onStatus) {
	const params = new URLSearchParams({
		media_type: "REELS",
		video_url: videoUrl,
		caption,
		share_to_feed: "true"
	});
	const response = await graphFetch(`/${igUserId}/media`, () => ({
		method: "POST",
		body: params
	}), onStatus);
	const text = await response.text();
	if (!response.ok) {
		if (/url|download|fetch|retrieve/i.test(text)) return null;
		throw mapGraphError(response.status, text);
	}
	const json = JSON.parse(text);
	return json.id ? { id: json.id } : null;
}
async function waitContainer(containerId, onStatus) {
	for (let i = 0; i < 30; i += 1) {
		await onStatus?.("Processing Reel…");
		const response = await graphFetch(`/${containerId}?fields=status_code,status`, () => ({ method: "GET" }), onStatus);
		if (!response.ok) {
			await sleep(jitterWait(2500));
			continue;
		}
		const code = ((await response.json()).status_code ?? "").toUpperCase();
		if (code === "FINISHED" || code === "PUBLISHED") return;
		if (code === "ERROR" || code === "EXPIRED") throw new Error("IG_CONTAINER_FAILED");
		await sleep(Math.min(8e3, 2e3 + i * 250));
	}
	throw new Error("IG_CONTAINER_FAILED");
}
async function publish(input) {
	rateLimitLocal();
	if (!(await isEligible()).ok) throw new Error("IG_PROFESSIONAL_REQUIRED");
	if (input.mode === "draft") return {
		status: "needs_attention",
		externalPostId: null,
		externalUrl: null,
		provider: "INSTAGRAM",
		igContainerId: null,
		reason: "Instagram Graph has no draft Reel. This stays in Agency Admin until you queue Publish."
	};
	if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
	if (!isTrustedIgMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
	const token = await ensureFreshToken("instagram");
	const igUserId = token.userId;
	if (!igUserId) throw new Error("IG_PROFESSIONAL_REQUIRED");
	const caption = input.caption.trim().slice(0, CAPTION_MAX);
	let containerId = null;
	if (canPullUrl(input.mediaUrl)) {
		await input.onStatus?.("Creating Reel container…");
		containerId = (await createPullContainer(igUserId, input.mediaUrl, caption, input.onStatus))?.id ?? null;
		if (containerId) await waitContainer(containerId, input.onStatus);
	}
	if (!containerId) {
		const { runChunkedUpload } = await import("./chunked-upload.server-MCqyKsua.mjs");
		containerId = (await runChunkedUpload({
			platform: "instagram",
			sourceUrl: input.mediaUrl,
			jobId: input.jobId,
			postId: input.postId,
			sessionId: input.sessionId,
			extras: {
				igUserId,
				caption
			},
			onProgress: async (progress) => {
				await input.onProgress?.({
					percent: progress.percent,
					phase: progress.phase,
					sessionId: progress.sessionId
				});
				await input.onStatus?.(`Uploading Reel… ${progress.percent}%`);
			}
		})).externalSessionId;
	}
	if (!containerId) throw new Error("PUBLISHER_REJECTED");
	await input.onStatus?.("Publishing Reel…");
	const published = await graphFetch(`/${igUserId}/media_publish`, () => ({
		method: "POST",
		body: new URLSearchParams({ creation_id: containerId })
	}), input.onStatus);
	const publishedText = await published.text();
	if (!published.ok) throw mapGraphError(published.status, publishedText);
	const id = JSON.parse(publishedText).id ?? containerId;
	const handle = token.handle?.replace(/^@/, "") ?? null;
	return {
		status: "succeeded",
		externalPostId: id,
		externalUrl: handle ? `https://www.instagram.com/${handle}/` : id ? `https://www.instagram.com/reel/${id}/` : null,
		provider: "INSTAGRAM",
		igContainerId: containerId
	};
}
async function getInstagramPublisherSnapshot() {
	try {
		return await readInstagramDetails();
	} catch {
		return emptyInstagramDetails();
	}
}
//#endregion
export { getInstagramPublisherSnapshot, isConfigured, isEligible, publish };
