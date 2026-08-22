import { b as readYoutubePublishDefaults, d as loadPublisherApp, l as ensureFreshToken, v as readToken } from "./social-oauth.server-BkBN9MI7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/youtube-publisher.server-CLMNPevf.js
/**
* YouTube Data API v3 publisher.
* Resumable upload + videos.insert metadata. Drafts land private.
* Tokens stay in AppSetting. Never returned to the client or Hermes.
*/
var TITLE_MAX = 100;
var DESC_MAX = 5e3;
var TAG_MAX = 500;
var SHORTS_MAX_SEC = 180;
var VERTICAL_MAX_RATIO = .62;
var HITS_WINDOW_MS = 36e5;
var HITS_MAX = 8;
var hits = [];
function rateLimitLocal() {
	const now = Date.now();
	while (hits.length && now - hits[0] >= HITS_WINDOW_MS) hits.shift();
	if (hits.length >= HITS_MAX) throw new Error("PUBLISHER_RATE_LIMIT");
	hits.push(now);
}
function isTrustedYtMedia(url) {
	if (!url) return false;
	if (url.startsWith("/api/library/file")) return true;
	if (url.startsWith("data:")) return /^data:(video|image)\//i.test(url);
	try {
		if (new URL(url).pathname === "/api/library/file") return true;
	} catch {}
	return isTrustedImageUrl(url);
}
function clipTitle(raw) {
	const cleaned = raw.replace(/\s+/g, " ").trim();
	if (!cleaned) return "Untitled upload";
	return cleaned.slice(0, TITLE_MAX);
}
function clipDescription(raw) {
	return raw.trim().slice(0, DESC_MAX);
}
function clipTags(tags) {
	if (!tags?.length) return [];
	const out = [];
	let used = 0;
	for (const tag of tags) {
		const value = tag.replace(/[<>]/g, "").trim().slice(0, 30);
		if (!value) continue;
		if (used + value.length + 1 > TAG_MAX) break;
		out.push(value);
		used += value.length + 1;
	}
	return out;
}
function looksLikeShort(input) {
	const duration = input.durationSec ?? null;
	if (duration != null && duration > SHORTS_MAX_SEC) return false;
	const width = input.width ?? 0;
	const height = input.height ?? 0;
	if (width > 0 && height > 0) return height > width && width / height <= VERTICAL_MAX_RATIO;
	return duration != null && duration <= 60;
}
function applyShortsMark(title, description, mark) {
	if (!mark) return {
		title,
		description
	};
	if (/#shorts\b/i.test(title) || /#shorts\b/i.test(description)) return {
		title,
		description
	};
	return {
		title: title.length + 8 <= TITLE_MAX ? `${title} #Shorts` : title,
		description: (description.includes("#Shorts") || description.includes("#shorts") ? description : `${description}\n\n#Shorts`.trim()).slice(0, DESC_MAX)
	};
}
async function readYoutubeDetails() {
	const [token, defaults] = await Promise.all([readToken("youtube"), readYoutubePublishDefaults()]);
	return {
		channelId: token?.userId ?? null,
		channelTitle: token?.handle ?? null,
		categoryId: defaults.categoryId,
		privacyDefault: defaults.privacyDefault,
		eligible: Boolean(token?.accessToken && (token.refreshToken || token.accessToken))
	};
}
async function getYouTubePublisherSnapshot() {
	return readYoutubeDetails();
}
async function isConfigured() {
	try {
		const [app, token] = await Promise.all([loadPublisherApp("youtube"), readToken("youtube")]);
		return Boolean(app && token?.accessToken);
	} catch {
		return false;
	}
}
async function isEligible() {
	if (!await isConfigured()) return {
		ok: false,
		reason: "Connect YouTube with youtube.upload in Settings."
	};
	if (!(await readYoutubeDetails()).eligible) return {
		ok: false,
		reason: "YouTube upload token is missing or expired."
	};
	return {
		ok: true,
		reason: null
	};
}
function resolvePrivacy(input, fallback) {
	if (input.mode === "draft") return "private";
	const requested = input.youtube?.privacyStatus;
	if (requested === "private" || requested === "unlisted" || requested === "public") return requested;
	return fallback === "public" ? "unlisted" : fallback;
}
async function publish(input) {
	rateLimitLocal();
	if (!await isConfigured()) throw new Error("PUBLISHER_NOT_CONNECTED");
	if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
	if (!isTrustedYtMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
	const defaults = await readYoutubePublishDefaults();
	const caption = input.caption.trim();
	const firstLine = caption.split("\n")[0] ?? "";
	let title = clipTitle(input.youtube?.title?.trim() || input.mediaMeta?.title?.trim() || firstLine || "Untitled upload");
	let description = clipDescription(input.youtube?.description ?? caption);
	const tags = clipTags(input.youtube?.tags);
	const privacy = resolvePrivacy(input, defaults.privacyDefault);
	const categoryId = (input.youtube?.categoryId ?? defaults.categoryId ?? "22").replace(/\D/g, "") || "22";
	const notifySubscribers = input.youtube?.notifySubscribers === true;
	const markShorts = Boolean(input.youtube?.markShorts && looksLikeShort({
		durationSec: input.mediaMeta?.durationSec,
		width: input.mediaMeta?.width,
		height: input.mediaMeta?.height
	}));
	({title, description} = applyShortsMark(title, description, markShorts));
	await input.onStatus?.("Starting YouTube resumable upload…");
	const { runChunkedUpload } = await import("./chunked-upload.server-MCqyKsua.mjs");
	let session;
	try {
		session = await runChunkedUpload({
			platform: "youtube",
			sourceUrl: input.mediaUrl,
			jobId: input.jobId,
			postId: input.postId,
			sessionId: input.sessionId,
			extras: {
				title,
				description,
				tags,
				privacyStatus: privacy,
				categoryId,
				notifySubscribers,
				mime: "video/mp4"
			},
			onProgress: async (progress) => {
				await input.onProgress?.({
					percent: progress.percent,
					phase: progress.phase,
					sessionId: progress.sessionId
				});
				await input.onStatus?.(`Uploading to YouTube… ${progress.percent}%`);
			}
		});
	} catch (error) {
		const code = error instanceof Error ? error.message : "PUBLISHER_REJECTED";
		if (code === "YOUTUBE_QUOTA") return {
			status: "needs_attention",
			externalPostId: null,
			externalUrl: null,
			provider: "YOUTUBE",
			reason: "YouTube quota exceeded. Wait for the daily reset before retrying API upload."
		};
		if (code === "YT_INVALID_METADATA") return {
			status: "failed",
			externalPostId: null,
			externalUrl: null,
			provider: "YOUTUBE",
			reason: "YouTube rejected the title, description, or tags. Fix metadata and retry."
		};
		throw error;
	}
	const videoId = String(session.platformExtras.videoId ?? session.externalSessionId ?? "");
	if (!videoId || videoId.startsWith("http")) throw new Error("PUBLISHER_REJECTED");
	if (input.youtube?.thumbUrl && isTrustedYtMedia(input.youtube.thumbUrl)) try {
		await setThumbnail(videoId, input.youtube.thumbUrl);
	} catch {}
	const draftNote = input.mode === "draft" || privacy === "private" ? "Uploaded as private. It is not public." : privacy === "unlisted" ? "Uploaded unlisted." : void 0;
	return {
		status: "succeeded",
		externalPostId: videoId,
		externalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
		provider: "YOUTUBE",
		reason: draftNote
	};
}
async function setThumbnail(videoId, url) {
	const token = await ensureFreshToken("youtube");
	let bytes;
	let mime = "image/jpeg";
	if (url.startsWith("data:")) {
		const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
		if (!match) return;
		mime = match[1];
		bytes = Buffer.from(match[2], "base64");
	} else {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(3e4),
			redirect: "follow"
		});
		if (!response.ok) return;
		mime = response.headers.get("content-type")?.split(";")[0]?.trim() || mime;
		bytes = Buffer.from(await response.arrayBuffer());
	}
	if (bytes.byteLength > 2097152) return;
	await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
			"Content-Type": mime,
			"Content-Length": String(bytes.byteLength)
		},
		body: new Uint8Array(bytes),
		signal: AbortSignal.timeout(3e4)
	});
}
//#endregion
export { getYouTubePublisherSnapshot, isConfigured, isEligible, publish };
