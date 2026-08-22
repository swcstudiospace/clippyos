import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/youtube.server-D98qL7z7.js
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
function classifyDuration(seconds) {
	if (seconds == null || !Number.isFinite(seconds)) return "UNKNOWN";
	return seconds >= 240 ? "LONG" : "SHORT";
}
async function fetchText(url) {
	const response = await fetch(url, {
		headers: {
			"User-Agent": UA,
			"Accept-Language": "en-US,en;q=0.9"
		},
		signal: AbortSignal.timeout(12e3),
		redirect: "follow"
	});
	if (!response.ok) throw new Error("upstream");
	return response.text();
}
function pickMeta(html, property) {
	const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
	const match = html.match(re);
	if (match?.[1]) return decodeHtml(match[1]);
	const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i");
	const match2 = html.match(re2);
	return match2?.[1] ? decodeHtml(match2[1]) : null;
}
function decodeHtml(value) {
	return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&#x27;/gi, "'");
}
function extractChannelId(html) {
	for (const pattern of [
		/"channelId":"(UC[\w-]{21,})"/,
		/"externalId":"(UC[\w-]{21,})"/,
		/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{21,})"/,
		/\/channel\/(UC[\w-]{21,})/
	]) {
		const match = html.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
}
function extractSubscribers(html) {
	const match = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/);
	if (match?.[1]) return match[1];
	return html.match(/"subscriberCount":"(\d+)"/)?.[1] ?? null;
}
function extractDescription(html) {
	return pickMeta(html, "og:description") ?? pickMeta(html, "description") ?? "";
}
async function resolvePageUrl(parsed) {
	if (parsed.kind === "video") return `https://www.youtube.com/watch?v=${parsed.value}`;
	return parsed.canonical;
}
async function videosFromRss(channelId) {
	const entries = (await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`)).split("<entry>").slice(1);
	const videos = [];
	for (const entry of entries.slice(0, 25)) {
		const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
		const title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
		const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
		if (id && title) videos.push({
			videoId: id,
			title: decodeHtml(title),
			publishedAt: published
		});
	}
	return videos;
}
async function durationForVideo(videoId) {
	try {
		const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": UA
			},
			body: JSON.stringify({
				context: { client: {
					clientName: "WEB",
					clientVersion: "2.20240815.00.00",
					hl: "en"
				} },
				videoId
			}),
			signal: AbortSignal.timeout(8e3)
		});
		if (!response.ok) return null;
		const body = await response.json();
		const seconds = Number(body.videoDetails?.lengthSeconds);
		return Number.isFinite(seconds) ? seconds : null;
	} catch {
		return null;
	}
}
async function classifyVideos(raw) {
	const slice = raw.slice(0, 20);
	const out = [];
	for (let i = 0; i < slice.length; i += 4) {
		const chunk = slice.slice(i, i + 4);
		const durations = await Promise.all(chunk.map((item) => durationForVideo(item.videoId)));
		chunk.forEach((item, index) => {
			const durationSeconds = durations[index] ?? null;
			out.push({
				...item,
				durationSeconds,
				form: classifyDuration(durationSeconds)
			});
		});
	}
	return out;
}
async function fetchVideoSnapshot(videoId) {
	const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
	const html = await fetchText(canonicalUrl);
	const durationSeconds = await durationForVideo(videoId);
	const title = pickMeta(html, "og:title")?.replace(/\s*-\s*YouTube$/i, "") ?? html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*-\s*YouTube$/i, "") ?? "YouTube video";
	const channelTitle = html.match(/"ownerChannelName":"([^"]+)"/)?.[1] ?? html.match(/"author":"([^"]+)"/)?.[1] ?? null;
	return {
		videoId,
		title: decodeHtml(title.trim()),
		description: extractDescription(html).slice(0, 800),
		canonicalUrl,
		durationSeconds,
		form: classifyDuration(durationSeconds),
		channelTitle: channelTitle ? decodeHtml(channelTitle) : null,
		channelId: extractChannelId(html)
	};
}
async function fetchChannelSnapshot(url) {
	const parsed = parseYouTubeChannelUrl(url);
	if (!parsed.ok) throw new Error(parsed.error);
	const html = await fetchText(await resolvePageUrl(parsed));
	let channelId = parsed.kind === "channel" ? parsed.value : extractChannelId(html);
	if (!channelId && parsed.kind !== "channel") channelId = (pickMeta(html, "og:url") ?? "").match(/channel\/(UC[\w-]{21,})/)?.[1] ?? null;
	const title = pickMeta(html, "og:title") ?? html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*-\s*YouTube$/, "") ?? (parsed.kind === "handle" ? parsed.value : "YouTube channel");
	const thumbnail = pickMeta(html, "og:image");
	const description = extractDescription(html);
	const subscriberCount = extractSubscribers(html);
	const canonicalUrl = channelId ? `https://www.youtube.com/channel/${channelId}` : parsed.canonical;
	let videos = [];
	if (channelId) try {
		videos = await classifyVideos(await videosFromRss(channelId));
	} catch {
		videos = [];
	}
	return {
		channelId,
		title: title.trim(),
		description,
		thumbnail,
		canonicalUrl,
		subscriberCount,
		videos
	};
}
/** Last N long-form uploads. Duration ≥ 240s only — never the Shorts tab. */
async function pickLastLongForm(channelUrl, limit = 5) {
	return (await fetchChannelSnapshot(channelUrl)).videos.filter((video) => video.form === "LONG" && video.durationSeconds != null && video.durationSeconds >= 240).sort((a, b) => {
		const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
		return (b.publishedAt ? Date.parse(b.publishedAt) : 0) - left;
	}).slice(0, limit).map((video) => ({
		videoId: video.videoId,
		title: video.title,
		publishedAt: video.publishedAt,
		durationSeconds: video.durationSeconds,
		url: `https://www.youtube.com/watch?v=${video.videoId}`,
		thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
	}));
}
//#endregion
export { fetchChannelSnapshot, fetchVideoSnapshot, pickLastLongForm };
