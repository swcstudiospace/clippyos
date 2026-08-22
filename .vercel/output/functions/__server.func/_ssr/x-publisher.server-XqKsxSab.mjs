import { l as ensureFreshToken, p as publisherStatusFor, u as forceRefreshToken, v as readToken, y as readXApiBase } from "./social-oauth.server-BkBN9MI7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/x-publisher.server-XqKsxSab.js
/**
* Native X (Twitter) API publisher.
* Official v2 only: chunked media upload + POST /2/tweets.
* Tokens stay in AppSetting. App-only Bearer cannot tweet.
*/
var X_CAPTION_MAX = 280;
var HITS_WINDOW_MS = 9e5;
var HITS_MAX = 15;
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
async function isConfigured() {
	try {
		if (!(await readToken("x"))?.accessToken) return false;
		const status = await publisherStatusFor("x");
		return status.connected && status.eligible && !status.tokenExpired;
	} catch {
		return false;
	}
}
async function publish(input) {
	rateLimitLocal();
	if (!await isConfigured()) throw new Error("PUBLISHER_NOT_CONNECTED");
	if (input.mode === "draft") return {
		status: "needs_attention",
		externalPostId: null,
		externalUrl: null,
		provider: "X",
		reason: "X has no draft API. This post is held locally — queue again with Publish, or use the browser rail."
	};
	if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
	if (!isTrustedXMediaUrl(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
	const caption = input.caption.trim();
	const text = caption.slice(0, X_CAPTION_MAX);
	const category = inferKind("", input.mediaUrl);
	const { runChunkedUpload } = await import("./chunked-upload.server-MCqyKsua.mjs");
	const mediaId = (await runChunkedUpload({
		platform: "x",
		sourceUrl: input.mediaUrl,
		jobId: input.jobId,
		postId: input.postId,
		sessionId: input.sessionId,
		extras: { mediaCategory: category },
		onProgress: async (progress) => {
			await input.onProgress?.({
				percent: progress.percent,
				phase: progress.phase,
				sessionId: progress.sessionId
			});
			await input.onStatus?.(`Uploading… ${progress.percent}%`);
		}
	})).externalSessionId;
	if (!mediaId) throw new Error("PUBLISHER_REJECTED");
	const tweet = await xApi("/2/tweets", () => ({
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			text: text || void 0,
			media: { media_ids: [mediaId] }
		}),
		signal: AbortSignal.timeout(2e4)
	}), input.onStatus);
	if (tweet.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
	if (!tweet.ok) throw new Error("PUBLISHER_REJECTED");
	const id = (await tweet.json()).data?.id ?? null;
	const handle = (await readToken("x"))?.handle?.replace(/^@/, "") ?? null;
	return {
		status: "succeeded",
		externalPostId: id,
		externalUrl: id ? handle ? `https://x.com/${handle}/status/${id}` : `https://x.com/i/status/${id}` : null,
		provider: "X",
		reason: caption.length > X_CAPTION_MAX ? "Caption truncated to 280 characters for X." : void 0
	};
}
function isTrustedXMediaUrl(url) {
	if (!url) return false;
	if (url.startsWith("data:")) return isTrustedImageUrl(url) || /^data:(video|image)\//i.test(url);
	return isTrustedImageUrl(url);
}
function inferKind(mime, filename) {
	const lower = `${mime} ${filename}`.toLowerCase();
	if (lower.includes("gif")) return "tweet_gif";
	if (lower.includes("video") || lower.includes("mp4") || lower.includes("quicktime") || lower.includes("mov") || lower.includes("webm")) return "tweet_video";
	return "tweet_image";
}
async function xApi(path, makeInit, onStatus) {
	const url = `${await readXApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
	async function send(accessToken) {
		const req = makeInit();
		const headers = new Headers(req.headers);
		headers.set("Authorization", `Bearer ${accessToken}`);
		const isUpload = path.includes("/append") || path.includes("/finalize") || path.includes("/initialize") || req.body instanceof FormData;
		const timeout = req.signal ?? AbortSignal.timeout(isUpload ? 6e4 : 25e3);
		return fetch(url, {
			...req,
			headers,
			signal: timeout
		});
	}
	let token = await ensureFreshToken("x");
	let response = await send(token.accessToken);
	if (response.status === 401) {
		token = await forceRefreshToken("x");
		response = await send(token.accessToken);
	}
	if (response.status !== 429) return response;
	let delay = 1e3;
	for (let attempt = 0; attempt < 4; attempt += 1) {
		await onStatus?.("Capacity — retrying");
		const retryAfter = Number(response.headers.get("retry-after"));
		const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1e3 : jitterWait(delay);
		await sleep(Math.min(wait, 2e4));
		delay = Math.min(delay * 2, 16e3);
		token = await ensureFreshToken("x");
		response = await send(token.accessToken);
		if (response.status === 401) {
			token = await forceRefreshToken("x");
			response = await send(token.accessToken);
		}
		if (response.status !== 429) return response;
	}
	return response;
}
//#endregion
export { isConfigured, publish };
