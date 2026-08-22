import { _ as readTikTokVerifiedDomain, d as loadPublisherApp, g as readTikTokPublishMode, h as readTikTokAuditStatus, l as ensureFreshToken, s as emptyTikTokDetails, u as forceRefreshToken, v as readToken } from "./social-oauth.server-BkBN9MI7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tiktok-publisher.server-CpHI9WDA.js
/**
* TikTok Content Posting API publisher.
* Inbox (draft) by default; Direct Post only when the operator marks the app audited.
* Tokens stay in AppSetting. Never returned to the client or Hermes.
*/
var API = "https://open.tiktokapis.com";
var TITLE_MAX = 150;
var HITS_WINDOW_MS = 6e4;
var HITS_MAX = 6;
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
function hasScope(scopes, needle) {
	return scopes.some((scope) => scope.toLowerCase().includes(needle.toLowerCase()));
}
function toTikTokPostMode(raw) {
	if (raw === "direct" || raw === "DIRECT_POST") return "DIRECT_POST";
	return "UPLOAD_TO_INBOX";
}
async function readTikTokDetails() {
	const [token, mode, audit, domain] = await Promise.all([
		readToken("tiktok"),
		readTikTokPublishMode(),
		readTikTokAuditStatus(),
		readTikTokVerifiedDomain()
	]);
	const connected = Boolean(token?.accessToken);
	const scopes = token?.scopes ?? [];
	const inboxOk = connected && (scopes.length === 0 || hasScope(scopes, "video.upload") || hasScope(scopes, "video.publish"));
	const directOk = connected && audit === "AUDITED" && (hasScope(scopes, "video.publish") || scopes.length === 0);
	return {
		postModeDefault: toTikTokPostMode(mode),
		auditStatus: audit,
		eligibleInbox: inboxOk,
		eligibleDirectPost: directOk,
		openId: token?.openId ?? token?.userId ?? null,
		displayName: token?.handle ?? null,
		verifiedDomain: domain
	};
}
async function isConfigured() {
	try {
		const [app, token] = await Promise.all([loadPublisherApp("tiktok"), readToken("tiktok")]);
		return Boolean(app && token?.accessToken);
	} catch {
		return false;
	}
}
async function isEligible(mode) {
	const details = await readTikTokDetails();
	if (!await isConfigured() || !details.eligibleInbox) return {
		ok: false,
		reason: "TikTok is not connected for API publishing.",
		postMode: "UPLOAD_TO_INBOX"
	};
	if (mode === "draft") return {
		ok: true,
		reason: null,
		postMode: "UPLOAD_TO_INBOX"
	};
	if (details.postModeDefault === "DIRECT_POST" && details.eligibleDirectPost) return {
		ok: true,
		reason: null,
		postMode: "DIRECT_POST"
	};
	return {
		ok: true,
		reason: details.auditStatus === "AUDITED" ? null : "Public Direct Post needs an audited TikTok app. Inbox drafts still work.",
		postMode: "UPLOAD_TO_INBOX"
	};
}
function isTrustedTikTokMedia(url) {
	if (!url) return false;
	if (url.startsWith("data:")) return /^data:video\//i.test(url) || isTrustedImageUrl(url);
	return isTrustedImageUrl(url);
}
function domainAllowsPull(mediaUrl, verified) {
	if (!verified || !mediaUrl.startsWith("https://")) return false;
	try {
		const host = new URL(mediaUrl).hostname.toLowerCase();
		const domain = verified.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase().replace(/^\*\./, "");
		if (!domain) return false;
		return host === domain || host.endsWith(`.${domain}`);
	} catch {
		return false;
	}
}
async function tiktokFetch(path, makeInit, onStatus) {
	const url = path.startsWith("http") ? path : `${API}${path}`;
	async function send(accessToken) {
		const req = makeInit();
		const headers = new Headers(req.headers);
		if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
		const timeout = req.signal ?? AbortSignal.timeout(25e3);
		return fetch(url, {
			...req,
			headers,
			signal: timeout
		});
	}
	let token = await ensureFreshToken("tiktok");
	let response = await send(token.accessToken);
	if (response.status === 401) {
		token = await forceRefreshToken("tiktok");
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
		token = await ensureFreshToken("tiktok");
		response = await send(token.accessToken);
		if (response.status === 401) {
			token = await forceRefreshToken("tiktok");
			response = await send(token.accessToken);
		}
		if (response.status !== 429) return response;
	}
	return response;
}
async function creatorPrivacy(onStatus) {
	try {
		const response = await tiktokFetch("/v2/post/publish/creator_info/query/", () => ({
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{}"
		}), onStatus);
		if (!response.ok) return "SELF_ONLY";
		const options = (await response.json()).data?.privacy_level_options ?? [];
		if (options.includes("SELF_ONLY")) return "SELF_ONLY";
		return options[0] ?? "SELF_ONLY";
	} catch {
		return "SELF_ONLY";
	}
}
async function pollPublish(publishId, inbox, onStatus) {
	for (let i = 0; i < 24; i += 1) {
		await onStatus?.(inbox ? "Waiting for TikTok inbox…" : "Waiting for TikTok publish…");
		const response = await tiktokFetch("/v2/post/publish/status/fetch/", () => ({
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ publish_id: publishId })
		}), onStatus);
		if (!response.ok) {
			await sleep(jitterWait(2500));
			continue;
		}
		const status = ((await response.json()).data?.status ?? "").toUpperCase();
		if (status === "PUBLISH_COMPLETE" || status === "SEND_TO_USER_INBOX") return "ok";
		if (status === "FAILED") return "failed";
		await sleep(Math.min(8e3, 1500 + i * 400));
	}
	return "timeout";
}
async function publish(input) {
	rateLimitLocal();
	if (!await isConfigured()) throw new Error("PUBLISHER_NOT_CONNECTED");
	if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
	const details = await readTikTokDetails();
	const wantDirect = input.mode === "publish" && details.postModeDefault === "DIRECT_POST";
	const useDirect = wantDirect && details.eligibleDirectPost;
	const forcedInbox = wantDirect && !useDirect;
	const postMode = useDirect ? "DIRECT_POST" : "UPLOAD_TO_INBOX";
	if (wantDirect && details.auditStatus !== "AUDITED") await input.onStatus?.("TikTok app is not audited — sending to inbox instead of posting publicly.");
	const title = input.caption.trim().slice(0, TITLE_MAX);
	const pullable = domainAllowsPull(input.mediaUrl, details.verifiedDomain);
	const postInfo = useDirect ? {
		title: title || "Clip",
		privacy_level: await creatorPrivacy(input.onStatus),
		disable_duet: false,
		disable_comment: false,
		disable_stitch: false,
		brand_content_toggle: false,
		brand_organic_toggle: false
	} : void 0;
	let publishId = null;
	if (pullable) {
		const endpoint = useDirect ? "/v2/post/publish/video/init/" : "/v2/post/publish/inbox/video/init/";
		const initBody = { source_info: {
			source: "PULL_FROM_URL",
			video_url: input.mediaUrl
		} };
		if (postInfo) initBody.post_info = postInfo;
		const init = await tiktokFetch(endpoint, () => ({
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(initBody)
		}), input.onStatus);
		if (init.status === 401) throw new Error("PUBLISHER_NOT_CONNECTED");
		if (init.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
		if (!init.ok) {
			if (useDirect) throw new Error("TIKTOK_AUDIT_REQUIRED");
			throw new Error("PUBLISHER_REJECTED");
		}
		const json = await init.json();
		if (json.error?.code && json.error.code !== "ok") {
			if (useDirect) throw new Error("TIKTOK_AUDIT_REQUIRED");
			throw new Error("PUBLISHER_REJECTED");
		}
		publishId = json.data?.publish_id ?? null;
		if (publishId) {
			if (await pollPublish(publishId, !useDirect, input.onStatus) === "failed") throw new Error("PUBLISHER_REJECTED");
		}
	} else {
		if (!isTrustedTikTokMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
		const { runChunkedUpload } = await import("./chunked-upload.server-MCqyKsua.mjs");
		const session = await runChunkedUpload({
			platform: "tiktok",
			sourceUrl: input.mediaUrl,
			jobId: input.jobId,
			postId: input.postId,
			sessionId: input.sessionId,
			extras: {
				useDirect,
				postInfo
			},
			onProgress: async (progress) => {
				await input.onProgress?.({
					percent: progress.percent,
					phase: progress.phase,
					sessionId: progress.sessionId
				});
				await input.onStatus?.(`Uploading TikTok video… ${progress.percent}%`);
			}
		});
		publishId = String(session.platformExtras.publishId ?? session.externalSessionId ?? "") || null;
	}
	if (!useDirect) return {
		status: forcedInbox ? "needs_attention" : "succeeded",
		externalPostId: publishId,
		externalUrl: null,
		provider: "TIKTOK",
		tiktokPostMode: postMode,
		reason: forcedInbox ? "Sent to TikTok inbox (draft). This was not posted publicly — Direct Post needs an audited TikTok app." : "Uploaded to TikTok inbox (draft). Public Direct Post needs an audited TikTok app."
	};
	return {
		status: "succeeded",
		externalPostId: publishId,
		externalUrl: null,
		provider: "TIKTOK",
		tiktokPostMode: "DIRECT_POST"
	};
}
async function getTikTokPublisherSnapshot() {
	try {
		return await readTikTokDetails();
	} catch {
		return emptyTikTokDetails();
	}
}
//#endregion
export { getTikTokPublisherSnapshot, isConfigured, isEligible, publish };
