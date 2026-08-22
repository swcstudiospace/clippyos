import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-Cj9pmeSi.js
var performance_Cj9pmeSi_exports = /* @__PURE__ */ __exportAll({
	A: () => windowForAgeHours,
	C: () => mergeMetrics,
	D: () => performance_exports,
	E: () => percentileRank,
	O: () => principleHash,
	S: () => latestSnapshotPerPost,
	T: () => parseMetrics,
	_: () => classifyVerdict,
	a: () => METRICS_SOURCES,
	b: () => formatEngagementPct,
	c: () => PERFORMANCE_VERDICTS,
	d: () => PROPOSAL_SCOPES,
	f: () => PROPOSAL_SOURCES,
	g: () => WINDOW_LABELS,
	h: () => VERDICT_LABELS,
	i: () => LEARNING_POLICY_KEY,
	k: () => socialPlatformToPerformance,
	l: () => PERFORMANCE_WINDOWS,
	m: () => SCOPE_LABELS,
	n: () => EMPTY_METRICS,
	o: () => PERFORMANCE_PLATFORMS,
	p: () => PROPOSAL_STATUSES,
	r: () => KNOWLEDGE_PROPOSALS_KEY,
	s: () => PERFORMANCE_QUERY_KEY,
	t: () => DEFAULT_LEARNING_POLICY,
	u: () => PLATFORM_LABELS,
	v: () => compositeScore,
	w: () => parseLearningPolicy,
	x: () => formatUnknownNumber,
	y: () => engagementRate
});
var performance_exports = /* @__PURE__ */ __exportAll$1({
	DEFAULT_LEARNING_POLICY: () => DEFAULT_LEARNING_POLICY,
	EMPTY_METRICS: () => EMPTY_METRICS,
	KNOWLEDGE_PROPOSALS_KEY: () => KNOWLEDGE_PROPOSALS_KEY,
	LEARNING_POLICY_KEY: () => LEARNING_POLICY_KEY,
	METRICS_SOURCES: () => METRICS_SOURCES,
	PERFORMANCE_PLATFORMS: () => PERFORMANCE_PLATFORMS,
	PERFORMANCE_QUERY_KEY: () => PERFORMANCE_QUERY_KEY,
	PERFORMANCE_VERDICTS: () => PERFORMANCE_VERDICTS,
	PERFORMANCE_WINDOWS: () => PERFORMANCE_WINDOWS,
	PLATFORM_LABELS: () => PLATFORM_LABELS,
	PROPOSAL_SCOPES: () => PROPOSAL_SCOPES,
	PROPOSAL_SOURCES: () => PROPOSAL_SOURCES,
	PROPOSAL_STATUSES: () => PROPOSAL_STATUSES,
	SCOPE_LABELS: () => SCOPE_LABELS,
	VERDICT_LABELS: () => VERDICT_LABELS,
	WINDOW_LABELS: () => WINDOW_LABELS,
	classifyVerdict: () => classifyVerdict,
	compositeScore: () => compositeScore,
	engagementRate: () => engagementRate,
	formatEngagementPct: () => formatEngagementPct,
	formatUnknownNumber: () => formatUnknownNumber,
	latestSnapshotPerPost: () => latestSnapshotPerPost,
	mergeMetrics: () => mergeMetrics,
	parseLearningPolicy: () => parseLearningPolicy,
	parseMetrics: () => parseMetrics,
	percentileRank: () => percentileRank,
	principleHash: () => principleHash,
	socialPlatformToPerformance: () => socialPlatformToPerformance,
	toNonNeg: () => toNonNeg,
	windowForAgeHours: () => windowForAgeHours
});
/** Client-safe post-performance scoring. Missing metrics stay unknown — never zero. */
var PERFORMANCE_QUERY_KEY = ["post-performance"];
var KNOWLEDGE_PROPOSALS_KEY = ["knowledge-proposals"];
var LEARNING_POLICY_KEY = ["learning-policy"];
var PERFORMANCE_PLATFORMS = [
	"X",
	"TIKTOK",
	"INSTAGRAM",
	"YOUTUBE",
	"OTHER"
];
var METRICS_SOURCES = [
	"API",
	"MANUAL",
	"IMPORT"
];
var PERFORMANCE_WINDOWS = [
	"LIFETIME",
	"D1",
	"D7",
	"D28"
];
var PERFORMANCE_VERDICTS = [
	"WINNER",
	"WEAK",
	"NEUTRAL",
	"UNKNOWN"
];
var PROPOSAL_STATUSES = [
	"PENDING_REVIEW",
	"APPROVED",
	"REJECTED",
	"MERGED"
];
var PROPOSAL_SOURCES = [
	"POST_PERFORMANCE",
	"PACKAGE",
	"MANUAL"
];
var PROPOSAL_SCOPES = [
	"CLIENT_TITLES",
	"CLIENT_IDEAS",
	"THUMBNAIL_GLOBAL",
	"VIDEO_GLOBAL",
	"CLIENT_CLIPPING"
];
var EMPTY_METRICS = {
	views: null,
	likes: null,
	comments: null,
	shares: null,
	saves: null,
	watchTimeSec: null,
	avgWatchPct: null,
	impressions: null,
	clicks: null,
	ctr: null
};
var DEFAULT_LEARNING_POLICY = {
	enabled: true,
	autoMerge: false,
	winnerPercentile: 75,
	minScore: 70,
	minViews: 100,
	fetchDelaysHours: [
		1,
		24,
		168
	]
};
var PLATFORM_LABELS = {
	X: "X",
	TIKTOK: "TikTok",
	INSTAGRAM: "Instagram",
	YOUTUBE: "YouTube",
	OTHER: "Other"
};
var WINDOW_LABELS = {
	LIFETIME: "Lifetime",
	D1: "Day 1",
	D7: "Day 7",
	D28: "Day 28"
};
var VERDICT_LABELS = {
	WINNER: "Winner",
	WEAK: "Weak",
	NEUTRAL: "Neutral",
	UNKNOWN: "Unknown"
};
var SCOPE_LABELS = {
	CLIENT_TITLES: "Client titles",
	CLIENT_IDEAS: "Client ideas",
	THUMBNAIL_GLOBAL: "Thumbnails (global)",
	VIDEO_GLOBAL: "Video & ideation (global)",
	CLIENT_CLIPPING: "Client clipping"
};
function parseLearningPolicy(raw) {
	if (!raw || typeof raw !== "object") return { ...DEFAULT_LEARNING_POLICY };
	const row = raw;
	const percentile = Number(row.winnerPercentile ?? row.winner_percentile);
	const minScore = Number(row.minScore ?? row.min_score);
	const minViews = Number(row.minViews ?? row.min_views);
	const delaysRaw = row.fetchDelaysHours ?? row.fetch_delays_hours;
	const delays = Array.isArray(delaysRaw) ? delaysRaw.map((item) => Number(item)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 720).slice(0, 6) : DEFAULT_LEARNING_POLICY.fetchDelaysHours;
	return {
		enabled: row.enabled !== false && row.enabled !== 0 && row.enabled !== "false",
		autoMerge: row.autoMerge === true || row.auto_merge === true,
		winnerPercentile: Number.isFinite(percentile) && percentile >= 50 && percentile <= 99 ? Math.round(percentile) : DEFAULT_LEARNING_POLICY.winnerPercentile,
		minScore: Number.isFinite(minScore) && minScore >= 0 && minScore <= 100 ? Math.round(minScore) : DEFAULT_LEARNING_POLICY.minScore,
		minViews: Number.isFinite(minViews) && minViews >= 0 && minViews <= 1e6 ? Math.round(minViews) : DEFAULT_LEARNING_POLICY.minViews,
		fetchDelaysHours: delays.length ? delays : DEFAULT_LEARNING_POLICY.fetchDelaysHours
	};
}
function parseMetrics(raw) {
	const row = raw && typeof raw === "object" ? raw : typeof raw === "string" ? safeJson(raw) : null;
	if (!row) return { ...EMPTY_METRICS };
	return {
		views: toNonNeg(row.views),
		likes: toNonNeg(row.likes),
		comments: toNonNeg(row.comments),
		shares: toNonNeg(row.shares),
		saves: toNonNeg(row.saves),
		watchTimeSec: toNonNeg(row.watchTimeSec ?? row.watch_time_sec),
		avgWatchPct: toNonNeg(row.avgWatchPct ?? row.avg_watch_pct),
		impressions: toNonNeg(row.impressions),
		clicks: toNonNeg(row.clicks),
		ctr: toNonNeg(row.ctr)
	};
}
function safeJson(raw) {
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function toNonNeg(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < 0) return null;
	return n;
}
function sumPresent(values) {
	const present = values.filter((n) => n != null);
	if (!present.length) return null;
	return present.reduce((sum, n) => sum + n, 0);
}
/** Engagement rate is unknown unless views exist. Missing engagement fields are omitted, not zeroed. */
function mergeMetrics(prev, next) {
	return {
		views: next.views ?? prev.views,
		likes: next.likes ?? prev.likes,
		comments: next.comments ?? prev.comments,
		shares: next.shares ?? prev.shares,
		saves: next.saves ?? prev.saves,
		watchTimeSec: next.watchTimeSec ?? prev.watchTimeSec,
		avgWatchPct: next.avgWatchPct ?? prev.avgWatchPct,
		impressions: next.impressions ?? prev.impressions,
		clicks: next.clicks ?? prev.clicks,
		ctr: next.ctr ?? prev.ctr
	};
}
function engagementRate(metrics) {
	if (metrics.views == null) return null;
	const engagement = sumPresent([
		metrics.likes,
		metrics.comments,
		metrics.shares,
		metrics.saves
	]);
	if (engagement == null) return null;
	return engagement / Math.max(metrics.views, 1);
}
function percentileRank(value, peers) {
	const usable = peers.filter((n) => Number.isFinite(n));
	if (usable.length < 2) return null;
	return usable.filter((n) => n < value).length / (usable.length - 1);
}
function compositeScore(viewsPercentile, engagementPercentile) {
	if (viewsPercentile == null && engagementPercentile == null) return null;
	if (engagementPercentile == null) return clampScore(viewsPercentile * 100);
	if (viewsPercentile == null) return clampScore(engagementPercentile * 100);
	return clampScore(.6 * viewsPercentile * 100 + .4 * engagementPercentile * 100);
}
function clampScore(n) {
	return Math.max(0, Math.min(100, Math.round(n)));
}
function classifyVerdict(input) {
	if (input.score == null || input.views == null) return "UNKNOWN";
	if (input.views < input.policy.minViews) return "NEUTRAL";
	const winnerByScore = input.score >= input.policy.minScore;
	const winnerByPct = input.viewsPercentile != null && input.viewsPercentile >= input.policy.winnerPercentile / 100;
	if (winnerByScore || winnerByPct) return "WINNER";
	if (input.viewsPercentile != null && input.viewsPercentile <= .25) return "WEAK";
	return "NEUTRAL";
}
function latestSnapshotPerPost(rows) {
	const map = /* @__PURE__ */ new Map();
	const sorted = [...rows].sort((a, b) => a.capturedAt < b.capturedAt ? 1 : -1);
	for (const row of sorted) {
		const key = row.socialPostId ?? `${row.platform}:${row.externalPostId}`;
		if (!map.has(key)) map.set(key, row);
	}
	return [...map.values()];
}
function formatUnknownNumber(value, compact) {
	if (value == null || !Number.isFinite(value)) return "—";
	return compact ? compact(value) : String(value);
}
function formatEngagementPct(rate) {
	if (rate == null || !Number.isFinite(rate)) return "—";
	return `${(rate * 100).toFixed(rate >= .1 ? 1 : 2)}%`;
}
function principleHash(text) {
	const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 400);
	let hash = 0;
	for (let i = 0; i < normalized.length; i += 1) hash = hash * 31 + normalized.charCodeAt(i) | 0;
	return `${normalized.slice(0, 48)}:${(hash >>> 0).toString(16)}`;
}
function socialPlatformToPerformance(platform) {
	if (platform === "x") return "X";
	if (platform === "tiktok") return "TIKTOK";
	if (platform === "instagram") return "INSTAGRAM";
	if (platform === "youtube") return "YOUTUBE";
	return "OTHER";
}
function windowForAgeHours(hours) {
	if (hours <= 30) return "D1";
	if (hours <= 192) return "D7";
	if (hours <= 720) return "D28";
	return "LIFETIME";
}
//#endregion
export { windowForAgeHours as A, mergeMetrics as C, performance_Cj9pmeSi_exports as D, percentileRank as E, principleHash as O, latestSnapshotPerPost as S, parseMetrics as T, classifyVerdict as _, METRICS_SOURCES as a, formatEngagementPct as b, PERFORMANCE_VERDICTS as c, PROPOSAL_SCOPES as d, PROPOSAL_SOURCES as f, WINDOW_LABELS as g, VERDICT_LABELS as h, LEARNING_POLICY_KEY as i, socialPlatformToPerformance as k, PERFORMANCE_WINDOWS as l, SCOPE_LABELS as m, EMPTY_METRICS as n, PERFORMANCE_PLATFORMS as o, PROPOSAL_STATUSES as p, KNOWLEDGE_PROPOSALS_KEY as r, PERFORMANCE_QUERY_KEY as s, DEFAULT_LEARNING_POLICY as t, PLATFORM_LABELS as u, compositeScore as v, parseLearningPolicy as w, formatUnknownNumber as x, engagementRate as y };
