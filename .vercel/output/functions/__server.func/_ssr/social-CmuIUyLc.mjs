//#region node_modules/.nitro/vite/services/ssr/assets/social-CmuIUyLc.js
var SOCIAL_QUERY_KEY = ["social"];
var SOCIAL_NOVNC_PORT = 6080;
var DEFAULT_DESKTOP_WIDTH = 1280;
var SOCIAL_LABELS = {
	app: "clippy-os",
	purpose: "social"
};
var PLATFORM_LABELS = {
	instagram: "Instagram",
	x: "X",
	tiktok: "TikTok",
	youtube: "YouTube"
};
var PLATFORM_HOME_URL = {
	instagram: "https://www.instagram.com/",
	x: "https://x.com/home",
	tiktok: "https://www.tiktok.com/",
	youtube: "https://studio.youtube.com/"
};
var PLATFORM_UPLOAD_URL = {
	instagram: "https://www.instagram.com/",
	x: "https://x.com/compose/post",
	tiktok: "https://www.tiktok.com/tiktokstudio/upload",
	youtube: "https://studio.youtube.com/"
};
function parseYoutubeJobOptions(raw) {
	if (!raw || typeof raw !== "object") return null;
	const rec = raw;
	const nested = rec.youtube && typeof rec.youtube === "object" ? rec.youtube : rec;
	const title = typeof nested.title === "string" ? nested.title : typeof rec.ytTitle === "string" ? rec.ytTitle : void 0;
	const description = typeof nested.description === "string" ? nested.description : typeof rec.ytDescription === "string" ? rec.ytDescription : void 0;
	const tagsRaw = nested.tags ?? rec.ytTags;
	const tags = Array.isArray(tagsRaw) ? tagsRaw.map(String).map((row) => row.trim()).filter(Boolean).slice(0, 30) : typeof tagsRaw === "string" ? tagsRaw.split(",").map((row) => row.trim()).filter(Boolean).slice(0, 30) : void 0;
	const privacyRaw = nested.privacyStatus ?? rec.ytPrivacy;
	const privacyStatus = privacyRaw === "private" || privacyRaw === "unlisted" || privacyRaw === "public" ? privacyRaw : void 0;
	const markShorts = nested.markShorts === true || nested.markShorts === false || rec.ytMarkShorts === true || rec.ytMarkShorts === false ? Boolean(nested.markShorts ?? rec.ytMarkShorts) : void 0;
	const thumbAssetId = typeof nested.thumbAssetId === "string" ? nested.thumbAssetId : typeof rec.ytThumbAssetId === "string" ? rec.ytThumbAssetId : void 0;
	const thumbUrl = typeof nested.thumbUrl === "string" ? nested.thumbUrl : typeof rec.ytThumbUrl === "string" ? rec.ytThumbUrl : void 0;
	const categoryId = typeof nested.categoryId === "string" ? nested.categoryId : typeof rec.ytCategoryId === "string" ? rec.ytCategoryId : void 0;
	const notifySubscribers = nested.notifySubscribers === true || rec.ytNotifySubscribers === true ? true : void 0;
	if (!title && !description && !tags?.length && !privacyStatus && markShorts == null && !thumbAssetId && !thumbUrl && !categoryId && !notifySubscribers) return null;
	return {
		title,
		description,
		tags,
		privacyStatus,
		markShorts,
		thumbAssetId,
		thumbUrl,
		categoryId,
		notifySubscribers
	};
}
function toPublicMachineStatus(machine) {
	return {
		state: machine.state,
		configured: machine.configured,
		sandboxId: machine.sandboxId,
		lastStartedAt: machine.startedAt,
		lastStoppedAt: machine.stoppedAt,
		autoStopMinutes: machine.autoStopMinutes,
		runningDurationMs: machine.runningMs,
		computerUse: machine.computerUse,
		longRunning: machine.longRunning
	};
}
function machineLabel(state) {
	switch (state) {
		case "running": return "Running";
		case "starting": return "Starting";
		case "stopping": return "Hibernating";
		case "paused": return "Hibernated";
		case "error": return "Error";
		case "not_configured": return "Not configured";
		default: return "Stopped";
	}
}
function machineTone(state) {
	switch (state) {
		case "running": return "green";
		case "paused": return "orange";
		case "starting":
		case "stopping": return "orange";
		case "error": return "red";
		case "not_configured": return "neutral";
		default: return "neutral";
	}
}
function postStatusLabel(status) {
	switch (status) {
		case "queued": return "Queued";
		case "running": return "Running";
		case "needs_attention": return "Needs attention";
		case "succeeded": return "Succeeded";
		case "failed": return "Failed";
	}
}
function jobStatusLabel(status) {
	switch (status) {
		case "awaiting_approval": return "Waiting for approval";
		case "queued": return "Queued";
		case "running": return "Running";
		case "needs_attention": return "Needs attention";
		case "succeeded": return "Succeeded";
		case "failed": return "Failed";
		case "cancelled": return "Cancelled";
	}
}
function sessionLabel(state) {
	switch (state) {
		case "logged_in": return "Logged in";
		case "not_logged_in": return "Not logged in";
		default: return "Unknown";
	}
}
function sessionToHealth(state) {
	if (state === "logged_in") return "logged_in";
	if (state === "not_logged_in") return "needs_login";
	return "unknown";
}
function parseDisplaySize(value) {
	if (!value) return null;
	const match = /^(\d{3,5})x(\d{3,5})$/i.exec(value.trim());
	if (!match) return null;
	const width = Number(match[1]);
	const height = Number(match[2]);
	if (width < 320 || height < 240 || width > 7680 || height > 4320) return null;
	return {
		width,
		height
	};
}
function formatDisplaySize(width, height) {
	return `${Math.round(width)}×${Math.round(height)}`;
}
/** Scale the noVNC stream so the entire desktop is visible inside the iframe. */
function novncEmbedUrl(src) {
	if (!src) return null;
	try {
		const parsed = new URL(src);
		if (!parsed.searchParams.has("resize")) parsed.searchParams.set("resize", "scale");
		if (!parsed.searchParams.has("autoconnect")) parsed.searchParams.set("autoconnect", "true");
		return parsed.toString();
	} catch {
		return src;
	}
}
function uploadPhaseLabel(phase) {
	switch (phase) {
		case "init": return "Starting upload";
		case "uploading": return "Uploading";
		case "processing": return "Processing";
		case "publishing": return "Publishing";
		default: return "Uploading";
	}
}
function attachJobProgress(posts) {
	const withProgress = posts.find((post) => post.status === "running" || post.status === "queued") ?? posts.find((post) => post.uploadPercent != null) ?? posts[0];
	return {
		uploadPercent: withProgress?.uploadPercent ?? null,
		uploadPhase: withProgress?.uploadPhase ?? null,
		resumableSessionId: withProgress?.resumableSessionId ?? null
	};
}
//#endregion
export { sessionLabel as _, SOCIAL_LABELS as a, uploadPhaseLabel as b, attachJobProgress as c, machineLabel as d, machineTone as f, postStatusLabel as g, parseYoutubeJobOptions as h, PLATFORM_UPLOAD_URL as i, formatDisplaySize as l, parseDisplaySize as m, PLATFORM_HOME_URL as n, SOCIAL_NOVNC_PORT as o, novncEmbedUrl as p, PLATFORM_LABELS as r, SOCIAL_QUERY_KEY as s, DEFAULT_DESKTOP_WIDTH as t, jobStatusLabel as u, sessionToHealth as v, toPublicMachineStatus as y };
