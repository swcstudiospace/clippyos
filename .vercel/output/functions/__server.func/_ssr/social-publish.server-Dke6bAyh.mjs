import { n as getUserRole } from "./access-CV3glphY.mjs";
import { a as emptyInstagramDetails, c as emptyYoutubeDetails, g as readTikTokPublishMode, m as readInstagramAccounts, o as emptyPublisherMap, p as publisherStatusFor, s as emptyTikTokDetails, x as socialOauthCallbackUrl } from "./social-oauth.server-BkBN9MI7.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/social-publish.server-Dke6bAyh.js
/**
* Native social publishers (X, TikTok, Instagram Graph, YouTube Data API).
* Browser Computer Use remains the fallback rail.
*/
function isTrustedMediaUrl(url) {
	if (!url) return false;
	if (url.startsWith("/api/library/file")) return true;
	if (url.startsWith("data:")) return isTrustedImageUrl(url) || /^data:(video|image|audio)\//i.test(url);
	try {
		if (new URL(url).pathname === "/api/library/file") return true;
	} catch {}
	return isTrustedImageUrl(url);
}
async function getPublisherSnapshot(userId) {
	const [instagram, x, tiktok, youtube, accounts, mode, role] = await Promise.all([
		publisherStatusFor("instagram"),
		publisherStatusFor("x"),
		publisherStatusFor("tiktok"),
		publisherStatusFor("youtube"),
		readInstagramAccounts(),
		readTikTokPublishMode(),
		getUserRole(userId)
	]);
	return {
		publishers: {
			instagram,
			x,
			tiktok,
			youtube
		},
		instagramAccounts: accounts,
		tiktokPublishMode: mode,
		tiktok: tiktok.tiktok ?? emptyTikTokDetails(),
		instagram: instagram.instagram ?? emptyInstagramDetails(),
		youtube: youtube.youtube ?? emptyYoutubeDetails(),
		callbackUrl: socialOauthCallbackUrl(),
		role
	};
}
async function listPublisherStatuses() {
	try {
		const [instagram, x, tiktok, youtube] = await Promise.all([
			publisherStatusFor("instagram"),
			publisherStatusFor("x"),
			publisherStatusFor("tiktok"),
			publisherStatusFor("youtube")
		]);
		return {
			instagram,
			x,
			tiktok,
			youtube
		};
	} catch {
		return emptyPublisherMap();
	}
}
function providerFor(platform) {
	if (platform === "x") return "X";
	if (platform === "tiktok") return "TIKTOK";
	if (platform === "youtube") return "YOUTUBE";
	return "INSTAGRAM";
}
async function resolveRail(input) {
	const status = await publisherStatusFor(input.platform);
	let apiReady = input.platform === "x" ? await (await import("./x-publisher.server-XqKsxSab.mjs")).isConfigured() : status.appConfigured && status.connected && status.eligible;
	if (input.platform === "tiktok") {
		const { isConfigured, isEligible } = await import("./tiktok-publisher.server-CpHI9WDA.mjs");
		const configured = await isConfigured();
		const eligible = await isEligible(input.mode ?? "draft");
		apiReady = configured && eligible.ok;
	}
	if (input.platform === "instagram") {
		const { isConfigured, isEligible } = await import("./instagram-publisher.server-DyG449YH.mjs");
		const configured = await isConfigured();
		if ((input.mode ?? "draft") === "draft") apiReady = configured;
		else {
			const eligible = await isEligible();
			apiReady = configured && eligible.ok;
		}
	}
	if (input.platform === "youtube") {
		const { isConfigured, isEligible } = await import("./youtube-publisher.server-CLMNPevf.mjs");
		const configured = await isConfigured();
		const eligible = await isEligible();
		apiReady = configured && eligible.ok;
	}
	if (input.preferred === "API") {
		if (apiReady) return {
			rail: "API",
			reason: null
		};
		throw new Error("PUBLISHER_NOT_ELIGIBLE");
	}
	if (input.preferred === "BROWSER") {
		if (!input.daytonaConfigured) throw new Error("DAYTONA_UNAVAILABLE");
		return {
			rail: "BROWSER",
			reason: null
		};
	}
	if (apiReady) return {
		rail: "API",
		reason: null
	};
	if (input.daytonaConfigured) return {
		rail: "BROWSER",
		reason: status.reason ?? "API not eligible — using Computer Use."
	};
	throw new Error("NO_PUBLISH_RAIL");
}
async function publishViaApi(platform, input) {
	if (platform === "x") return publishX(input);
	if (platform === "tiktok") return publishTikTok(input);
	if (platform === "youtube") return publishYouTube(input);
	return publishInstagram(input);
}
function sourceFromProvider(provider) {
	if (provider === "X") return "X";
	if (provider === "TIKTOK") return "TIKTOK";
	if (provider === "INSTAGRAM") return "INSTAGRAM";
	if (provider === "YOUTUBE") return "YOUTUBE";
	return "DAYTONA";
}
async function publishX(input) {
	const { publish } = await import("./x-publisher.server-XqKsxSab.mjs");
	return publish(input);
}
async function publishTikTok(input) {
	const { publish } = await import("./tiktok-publisher.server-CpHI9WDA.mjs");
	return publish(input);
}
async function publishInstagram(input) {
	const { publish } = await import("./instagram-publisher.server-DyG449YH.mjs");
	return publish(input);
}
async function publishYouTube(input) {
	const { publish } = await import("./youtube-publisher.server-CLMNPevf.mjs");
	return publish(input);
}
//#endregion
export { getPublisherSnapshot, isTrustedMediaUrl, listPublisherStatuses, providerFor, publishViaApi, resolveRail, sourceFromProvider };
