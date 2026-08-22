import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/youtube-data.server-CmwbKs56.js
/**
* YouTube Data API v3 — server-side only.
* Public Data API supplies subscribers, total views, and video stats.
* Watch time and CTR are YouTube Analytics (OAuth) metrics — never fabricated.
*/
var SETTING_KEYS = [
	"YOUTUBE_API_KEY",
	"YOUTUBE_DATA_API_KEY",
	"YT_API_KEY"
];
var BASE = "https://www.googleapis.com/youtube/v3";
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
async function youtubeDataApiAvailable() {
	return Boolean(await loadYoutubeApiKey());
}
async function loadYoutubeApiKey() {
	const env = process.env.YOUTUBE_API_KEY?.trim() || process.env.YOUTUBE_DATA_API_KEY?.trim() || process.env.YT_API_KEY?.trim() || "";
	if (env && !looksRedacted(env)) return env;
	for (const key of SETTING_KEYS) {
		const value = (await readAppSetting(key))?.trim() ?? "";
		if (value && !looksRedacted(value)) return value;
	}
	return null;
}
async function persistYoutubeApiKey(key) {
	await writeAppSetting("YOUTUBE_API_KEY", key.trim());
}
async function ytGet(path, params, key) {
	const url = new URL(`${BASE}/${path}`);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	url.searchParams.set("key", key);
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(15e3)
	});
	if (response.status === 403 || response.status === 429) throw new Error("YOUTUBE_QUOTA");
	if (!response.ok) throw new Error("YOUTUBE_UNAVAILABLE");
	return await response.json();
}
function toInt(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
function mapChannel(item) {
	const thumbs = item.snippet?.thumbnails;
	const thumbnail = thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null;
	const id = item.id ?? "";
	return {
		channelId: id,
		title: item.snippet?.title?.trim() || "YouTube channel",
		description: (item.snippet?.description ?? "").slice(0, 2e3),
		thumbnail,
		canonicalUrl: id ? `https://www.youtube.com/channel/${id}` : "",
		subscriberCount: item.statistics?.hiddenSubscriberCount ? null : toInt(item.statistics?.subscriberCount),
		viewCount: toInt(item.statistics?.viewCount),
		videoCount: toInt(item.statistics?.videoCount),
		uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? (id ? `UU${id.slice(2)}` : null)
	};
}
async function fetchChannelByIdOrHandle(input, key) {
	const params = {
		part: "snippet,statistics,contentDetails",
		maxResults: "1"
	};
	if (input.channelId) params.id = input.channelId;
	else if (input.handle) params.forHandle = input.handle.replace(/^@/, "");
	else return null;
	const item = (await ytGet("channels", params, key)).items?.[0];
	return item ? mapChannel(item) : null;
}
function parseIsoDuration(iso) {
	if (!iso) return null;
	const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
	if (!match) return null;
	const hours = Number(match[1] ?? 0);
	const minutes = Number(match[2] ?? 0);
	const seconds = Number(match[3] ?? 0);
	const total = hours * 3600 + minutes * 60 + seconds;
	return Number.isFinite(total) ? total : null;
}
async function pullPublicAnalytics(params) {
	const key = await loadYoutubeApiKey();
	if (!key) throw new Error("YOUTUBE_KEY_MISSING");
	const channel = await fetchChannelByIdOrHandle(params, key);
	if (!channel) throw new Error("YOUTUBE_CHANNEL_NOT_FOUND");
	let incomplete = false;
	const videos = [];
	const playlistId = channel.uploadsPlaylistId;
	if (playlistId) try {
		const ids = [];
		let page;
		while (ids.length < 50) {
			const pageParams = {
				part: "snippet,contentDetails",
				playlistId,
				maxResults: "50"
			};
			if (page) pageParams.pageToken = page;
			const list = await ytGet("playlistItems", pageParams, key);
			for (const item of list.items ?? []) {
				const id = item.contentDetails?.videoId;
				if (id) ids.push(id);
				if (ids.length >= 50) break;
			}
			page = list.nextPageToken;
			if (!page) break;
		}
		for (let i = 0; i < ids.length; i += 50) {
			const details = await ytGet("videos", {
				part: "snippet,statistics,contentDetails",
				id: ids.slice(i, i + 50).join(",")
			}, key);
			for (const item of details.items ?? []) {
				const videoId = item.id ?? "";
				const duration = parseIsoDuration(item.contentDetails?.duration);
				const thumbs = item.snippet?.thumbnails;
				videos.push({
					videoId,
					title: sanitizeText((item.snippet?.title ?? "Untitled").slice(0, 300)),
					views: toInt(item.statistics?.viewCount),
					likes: toInt(item.statistics?.likeCount),
					durationSeconds: duration,
					publishedAt: item.snippet?.publishedAt ?? null,
					thumbnail: thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? null,
					url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
					isLongForm: duration != null && duration >= 240
				});
			}
		}
	} catch (error) {
		if (error instanceof Error && error.message === "YOUTUBE_QUOTA") throw error;
		incomplete = true;
	}
	videos.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
	const capped = videos.slice(0, 50);
	let json = JSON.stringify(capped);
	if (json.length > 64e3) {
		json = JSON.stringify(capped.slice(0, 20));
		incomplete = true;
	}
	return {
		channel,
		views: channel.viewCount,
		subscribers: channel.subscriberCount,
		watchHours: null,
		impressionsCtr: null,
		topVideos: JSON.parse(json),
		incompleteTopVideos: incomplete
	};
}
//#endregion
export { loadYoutubeApiKey, persistYoutubeApiKey, pullPublicAnalytics, youtubeDataApiAvailable };
