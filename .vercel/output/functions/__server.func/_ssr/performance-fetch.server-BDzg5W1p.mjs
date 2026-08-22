import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { l as ensureFreshToken, v as readToken, y as readXApiBase } from "./social-oauth.server-BkBN9MI7.mjs";
import { A as windowForAgeHours, k as socialPlatformToPerformance, n as EMPTY_METRICS } from "./performance-Cj9pmeSi.mjs";
import { listPostPerformance, readLearningPolicy, t as ensurePerformanceSchema, upsertPostPerformance } from "./performance.server-kOlT5k3Z.mjs";
import { loadYoutubeApiKey, youtubeDataApiAvailable } from "./youtube-data.server-CmwbKs56.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-fetch.server-BDzg5W1p.js
/**
* Best-effort official metrics fetchers. Never invent numbers.
* Failures leave existing snapshots intact.
*/
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
async function metricsApiStatus() {
	const [youtube, x, tiktok, instagram] = await Promise.all([
		youtubeDataApiAvailable(),
		readToken("x").then((t) => Boolean(t?.accessToken)),
		readToken("tiktok").then((t) => Boolean(t?.accessToken)),
		readToken("instagram").then((t) => Boolean(t?.accessToken && t.userId))
	]);
	return {
		youtube,
		x,
		tiktok,
		instagram
	};
}
async function fetchPlatformMetrics(input) {
	try {
		if (input.platform === "X") return await fetchXMetrics(input.externalPostId);
		if (input.platform === "TIKTOK") return await fetchTikTokMetrics(input.externalPostId);
		if (input.platform === "INSTAGRAM") return await fetchInstagramMetrics(input.externalPostId);
		if (input.platform === "YOUTUBE") return await fetchYouTubeMetrics(input.externalPostId);
		return {
			ok: false,
			reason: "No metrics API for that platform.",
			manual: true
		};
	} catch (error) {
		return {
			ok: false,
			reason: error instanceof Error ? error.message : "FETCH_FAILED",
			manual: true
		};
	}
}
async function fetchXMetrics(tweetId) {
	const token = await ensureFreshToken("x").catch(() => null);
	if (!token) return {
		ok: false,
		reason: "X is not connected.",
		manual: true
	};
	const url = `${await readXApiBase()}/2/tweets/${encodeURIComponent(tweetId)}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
			Accept: "application/json"
		},
		signal: AbortSignal.timeout(15e3)
	});
	if (response.status === 401) return {
		ok: false,
		reason: "X token expired.",
		manual: true
	};
	if (response.status === 403 || response.status === 429) return {
		ok: false,
		reason: "X metrics are not available on this API tier.",
		manual: true
	};
	if (!response.ok) return {
		ok: false,
		reason: "X metrics request failed.",
		manual: true
	};
	const json = await response.json();
	const pub = json.data?.public_metrics;
	const organic = json.data?.organic_metrics;
	if (!pub && !organic) return {
		ok: false,
		reason: "X returned no public metrics.",
		manual: true
	};
	const likes = num(organic?.like_count ?? pub?.like_count);
	const impressions = num(organic?.impression_count ?? pub?.impression_count);
	return {
		ok: true,
		metrics: {
			...EMPTY_METRICS,
			views: impressions,
			likes,
			comments: num(pub?.reply_count),
			shares: sum(num(pub?.retweet_count), num(pub?.quote_count)),
			saves: num(pub?.bookmark_count),
			impressions
		},
		raw: {
			public_metrics: pub,
			organic_metrics: organic
		}
	};
}
async function fetchTikTokMetrics(videoId) {
	const token = await ensureFreshToken("tiktok").catch(() => null);
	if (!token) return {
		ok: false,
		reason: "TikTok is not connected.",
		manual: true
	};
	const response = await fetch("https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ filters: { video_ids: [videoId] } }),
		signal: AbortSignal.timeout(15e3)
	});
	if (response.status === 401) return {
		ok: false,
		reason: "TikTok token expired.",
		manual: true
	};
	if (!response.ok) return {
		ok: false,
		reason: "TikTok video insights need extra scopes. Enter stats manually.",
		manual: true
	};
	const video = (await response.json()).data?.videos?.[0];
	if (!video) return {
		ok: false,
		reason: "TikTok returned no video stats. Enter them manually.",
		manual: true
	};
	return {
		ok: true,
		metrics: {
			...EMPTY_METRICS,
			views: num(video.view_count),
			likes: num(video.like_count),
			comments: num(video.comment_count),
			shares: num(video.share_count)
		},
		raw: { video }
	};
}
async function fetchInstagramMetrics(mediaId) {
	const token = await ensureFreshToken("instagram").catch(() => null);
	if (!token) return {
		ok: false,
		reason: "Instagram is not connected.",
		manual: true
	};
	const fields = new URL("https://graph.facebook.com/v21.0/" + encodeURIComponent(mediaId));
	fields.searchParams.set("fields", "like_count,comments_count,media_type");
	fields.searchParams.set("access_token", token.accessToken);
	const mediaRes = await fetch(fields, { signal: AbortSignal.timeout(15e3) });
	if (mediaRes.status === 401) return {
		ok: false,
		reason: "Instagram token expired.",
		manual: true
	};
	const media = mediaRes.ok ? await mediaRes.json() : null;
	const insightsUrl = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}/insights`);
	insightsUrl.searchParams.set("metric", "plays,reach,saved,shares,total_interactions");
	insightsUrl.searchParams.set("access_token", token.accessToken);
	const insightsRes = await fetch(insightsUrl, { signal: AbortSignal.timeout(15e3) });
	let plays = null;
	let saved = null;
	let shares = null;
	if (insightsRes.ok) {
		const insights = await insightsRes.json();
		for (const row of insights.data ?? []) {
			const value = num(row.values?.[0]?.value);
			if (row.name === "plays" || row.name === "reach") plays = plays ?? value;
			if (row.name === "saved") saved = value;
			if (row.name === "shares") shares = value;
		}
	}
	if (!media && plays == null) return {
		ok: false,
		reason: "Instagram insights need a professional account with insights permission. Enter stats manually.",
		manual: true
	};
	return {
		ok: true,
		metrics: {
			...EMPTY_METRICS,
			views: plays,
			likes: num(media?.like_count),
			comments: num(media?.comments_count),
			shares,
			saves: saved
		},
		raw: {
			media,
			plays,
			saved,
			shares
		}
	};
}
async function fetchYouTubeMetrics(videoId) {
	const key = await loadYoutubeApiKey();
	if (!key) return {
		ok: false,
		reason: "YouTube Data API key is not configured.",
		manual: true
	};
	const url = new URL("https://www.googleapis.com/youtube/v3/videos");
	url.searchParams.set("part", "statistics");
	url.searchParams.set("id", videoId);
	url.searchParams.set("key", key);
	const response = await fetch(url, { signal: AbortSignal.timeout(15e3) });
	if (response.status === 403 || response.status === 429) return {
		ok: false,
		reason: "YouTube quota reached.",
		manual: true
	};
	if (!response.ok) return {
		ok: false,
		reason: "YouTube stats request failed.",
		manual: true
	};
	const stats = (await response.json()).items?.[0]?.statistics;
	if (!stats) return {
		ok: false,
		reason: "YouTube returned no statistics.",
		manual: true
	};
	return {
		ok: true,
		metrics: {
			...EMPTY_METRICS,
			views: num(stats.viewCount),
			likes: num(stats.likeCount),
			comments: num(stats.commentCount)
		},
		raw: { statistics: stats }
	};
}
function num(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
function sum(a, b) {
	if (a == null && b == null) return null;
	return (a ?? 0) + (b ?? 0);
}
async function enqueuePerformanceFetches(input) {
	await ensurePerformanceSchema();
	const policy = await readLearningPolicy();
	const delays = policy.fetchDelaysHours.length ? policy.fetchDelaysHours : [
		1,
		24,
		168
	];
	const now = Date.now();
	for (const hours of delays) {
		const window = hours <= 36 ? "D1" : hours <= 200 ? "D7" : hours <= 768 ? "D28" : "LIFETIME";
		const runAt = new Date(now + hours * 3600 * 1e3).toISOString();
		await insertQueueRow({
			socialPostId: input.socialPostId,
			externalPostId: input.externalPostId,
			platform: input.platform,
			window,
			runAt
		});
	}
}
async function insertQueueRow(row) {
	const payload = {
		id: newId(),
		social_post_id: row.socialPostId,
		external_post_id: row.externalPostId,
		platform: row.platform,
		window: row.window,
		run_at: row.runAt,
		status: "PENDING",
		attempts: 0,
		last_error: null,
		created_at: nowIso()
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("performance_fetch_queue").insert(payload);
		if (!error || !isMissingTable(error)) return;
	}
	try {
		await (await localSql()).query(`insert into performance_fetch_queue
        (id, social_post_id, external_post_id, platform, "window", run_at, status, attempts, last_error, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
			payload.id,
			payload.social_post_id,
			payload.external_post_id,
			payload.platform,
			payload.window,
			payload.run_at,
			payload.status,
			payload.attempts,
			payload.last_error,
			payload.created_at
		]);
	} catch {}
}
async function sweepDuePerformanceFetches(limit = 12) {
	await ensurePerformanceSchema();
	const due = await listDueQueue(limit);
	let ran = 0;
	for (const row of due) {
		const result = await refreshOnePost({
			socialPostId: row.socialPostId,
			externalPostId: row.externalPostId,
			platform: row.platform,
			window: row.window,
			actorId: "system:performance-sweep"
		});
		await markQueue(row.id, result.ok ? "DONE" : "FAILED", result.ok ? null : result.reason ?? "FETCH_FAILED");
		ran += 1;
	}
	return ran;
}
async function listDueQueue(limit) {
	const stamp = nowIso();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("performance_fetch_queue").select("*").eq("status", "PENDING").lte("run_at", stamp).order("run_at", { ascending: true }).limit(limit);
		if (!error) return (data ?? []).map((row) => {
			const rec = row;
			return {
				id: String(rec.id),
				socialPostId: rec.social_post_id ? String(rec.social_post_id) : null,
				externalPostId: String(rec.external_post_id),
				platform: String(rec.platform),
				window: String(rec.window)
			};
		});
	}
	try {
		return (await (await localSql()).query(`select * from performance_fetch_queue
       where status = 'PENDING' and run_at <= $1
       order by run_at asc
       limit $2`, [stamp, limit])).map((rec) => ({
			id: String(rec.id),
			socialPostId: rec.social_post_id ? String(rec.social_post_id) : null,
			externalPostId: String(rec.external_post_id),
			platform: String(rec.platform),
			window: String(rec.window)
		}));
	} catch {
		return [];
	}
}
async function markQueue(id, status, error) {
	const admin = await getAgencyAdmin();
	if (admin) {
		await admin.from("performance_fetch_queue").update({
			status,
			last_error: error,
			attempts: 1
		}).eq("id", id);
		return;
	}
	try {
		await (await localSql()).query("update performance_fetch_queue set status = $2, last_error = $3, attempts = attempts + 1 where id = $1", [
			id,
			status,
			error
		]);
	} catch {}
}
async function refreshOnePost(input) {
	const fetched = await fetchPlatformMetrics({
		platform: input.platform,
		externalPostId: input.externalPostId
	});
	if (!fetched.ok) return {
		ok: false,
		reason: fetched.reason
	};
	const post = input.post;
	const publishedAt = post?.createdAt ?? null;
	const ageHours = publishedAt ? (Date.now() - Date.parse(publishedAt)) / 36e5 : 24;
	const window = input.window ?? windowForAgeHours(ageHours);
	const snapshot = await upsertPostPerformance({
		clientId: post?.clientId ?? null,
		socialJobId: post?.jobId ?? null,
		socialPostId: input.socialPostId ?? post?.id ?? null,
		platform: input.platform,
		externalPostId: input.externalPostId,
		externalUrl: post?.externalUrl ?? null,
		mediaAssetId: post?.contentRef ?? null,
		publishedAt,
		metrics: fetched.metrics,
		metricsSource: "API",
		window,
		raw: fetched.raw,
		createdBy: input.actorId
	});
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: input.actorId.startsWith("system:") ? null : input.actorId,
			actorType: input.actorId.startsWith("system:") ? "SYSTEM" : "USER",
			action: "performance.fetched",
			entityType: "post_performance",
			entityId: snapshot.id,
			clientId: snapshot.clientId,
			summary: `Fetched ${snapshot.platform} ${snapshot.window} metrics`,
			metadata: {
				source: snapshot.metricsSource,
				window: snapshot.window,
				views: snapshot.metrics.views,
				verdict: snapshot.verdict,
				socialPostId: snapshot.socialPostId
			}
		});
	} catch {}
	try {
		const { maybeProposeFromWinner } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
		await maybeProposeFromWinner(snapshot, input.actorId);
	} catch {}
	return {
		ok: true,
		snapshot
	};
}
async function onSocialUploadSucceeded(input) {
	const externalId = input.post.externalPostId;
	if (!externalId) return;
	const platform = socialPlatformToPerformance(input.post.platform);
	await enqueuePerformanceFetches({
		socialPostId: input.post.id,
		externalPostId: externalId,
		platform
	});
	if ((await refreshOnePost({
		socialPostId: input.post.id,
		externalPostId: externalId,
		platform,
		window: "LIFETIME",
		actorId: input.actorId ?? "system:social-upload",
		post: input.post
	}).catch(() => ({
		ok: false,
		reason: "FETCH_FAILED"
	}))).ok) return;
	await upsertPostPerformance({
		clientId: input.post.clientId ?? null,
		socialJobId: input.post.jobId ?? null,
		socialPostId: input.post.id,
		platform,
		externalPostId: externalId,
		externalUrl: input.post.externalUrl ?? null,
		mediaAssetId: input.post.contentRef ?? null,
		publishedAt: input.post.createdAt ?? null,
		metrics: { ...EMPTY_METRICS },
		metricsSource: "MANUAL",
		window: "LIFETIME",
		createdBy: input.actorId ?? "system:social-upload"
	}).catch(() => null);
}
async function refreshPostById(socialPostId, actorId) {
	const { readSocialPosts } = await import("./social-Cwlrz0WD.mjs");
	const post = (await readSocialPosts()).find((row) => row.id === socialPostId);
	if (!post) return {
		ok: false,
		reason: "POST_MISSING"
	};
	if (!post.externalPostId) return {
		ok: false,
		reason: "NO_EXTERNAL_ID"
	};
	return refreshOnePost({
		socialPostId: post.id,
		externalPostId: post.externalPostId,
		platform: socialPlatformToPerformance(post.platform),
		actorId,
		post
	});
}
async function sweepStalePublishedPosts() {
	const { readSocialPosts } = await import("./social-Cwlrz0WD.mjs");
	const posts = await readSocialPosts();
	const cutoff = Date.now() - 2592e6;
	const existing = await listPostPerformance({ limit: 500 });
	const recentByPost = new Set(existing.filter((row) => Date.parse(row.capturedAt) > Date.now() - 72e6).map((row) => row.socialPostId).filter(Boolean));
	let n = 0;
	for (const post of posts) {
		if (post.status !== "succeeded" || !post.externalPostId) continue;
		if (Date.parse(post.createdAt) < cutoff) continue;
		if (recentByPost.has(post.id)) continue;
		if ((await refreshOnePost({
			socialPostId: post.id,
			externalPostId: post.externalPostId,
			platform: socialPlatformToPerformance(post.platform),
			actorId: "system:stale-sweep",
			post
		})).ok) n += 1;
	}
	return n;
}
//#endregion
export { metricsApiStatus, onSocialUploadSucceeded, refreshPostById, sweepDuePerformanceFetches, sweepStalePublishedPosts };
