/**
 * Best-effort official metrics fetchers. Never invent numbers.
 * Failures leave existing snapshots intact.
 */
import { ensureFreshToken, readToken, readXApiBase } from "@/lib/server/social-oauth.server";
import { youtubeDataApiAvailable, loadYoutubeApiKey } from "@/lib/server/youtube-data.server";
import { EMPTY_METRICS, type PerformancePlatform, type PerformanceWindow, type PostMetrics } from "@/lib/performance";
import {
  listPostPerformance,
  readLearningPolicy,
  upsertPostPerformance,
  type UpsertPerformanceInput,
} from "@/lib/server/performance.server";
import { ensurePerformanceSchema } from "@/lib/server/performance-schema.server";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import type { SocialPost } from "@/lib/entities";
import { socialPlatformToPerformance, windowForAgeHours } from "@/lib/performance";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

export async function metricsApiStatus(): Promise<{
  youtube: boolean;
  x: boolean;
  tiktok: boolean;
  instagram: boolean;
}> {
  const [youtube, x, tiktok, instagram] = await Promise.all([
    youtubeDataApiAvailable(),
    readToken("x").then((t) => Boolean(t?.accessToken)),
    readToken("tiktok").then((t) => Boolean(t?.accessToken)),
    readToken("instagram").then((t) => Boolean(t?.accessToken && t.userId)),
  ]);
  return { youtube, x, tiktok, instagram };
}

export type FetchResult =
  | { ok: true; metrics: PostMetrics; raw?: unknown }
  | { ok: false; reason: string; manual: boolean };

export async function fetchPlatformMetrics(input: {
  platform: PerformancePlatform;
  externalPostId: string;
}): Promise<FetchResult> {
  try {
    if (input.platform === "X") return await fetchXMetrics(input.externalPostId);
    if (input.platform === "TIKTOK") return await fetchTikTokMetrics(input.externalPostId);
    if (input.platform === "INSTAGRAM") return await fetchInstagramMetrics(input.externalPostId);
    if (input.platform === "YOUTUBE") return await fetchYouTubeMetrics(input.externalPostId);
    return { ok: false, reason: "No metrics API for that platform.", manual: true };
  } catch (error) {
    const code = error instanceof Error ? error.message : "FETCH_FAILED";
    return { ok: false, reason: code, manual: true };
  }
}

async function fetchXMetrics(tweetId: string): Promise<FetchResult> {
  const token = await ensureFreshToken("x").catch(() => null);
  if (!token) return { ok: false, reason: "X is not connected.", manual: true };
  const base = await readXApiBase();
  const url = `${base}/2/tweets/${encodeURIComponent(tweetId)}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token.accessToken}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) return { ok: false, reason: "X token expired.", manual: true };
  if (response.status === 403 || response.status === 429) {
    return { ok: false, reason: "X metrics are not available on this API tier.", manual: true };
  }
  if (!response.ok) return { ok: false, reason: "X metrics request failed.", manual: true };
  const json = (await response.json()) as {
    data?: {
      public_metrics?: {
        impression_count?: number;
        like_count?: number;
        reply_count?: number;
        retweet_count?: number;
        quote_count?: number;
        bookmark_count?: number;
      };
      organic_metrics?: { impression_count?: number; like_count?: number };
    };
    errors?: unknown;
  };
  const pub = json.data?.public_metrics;
  const organic = json.data?.organic_metrics;
  if (!pub && !organic) return { ok: false, reason: "X returned no public metrics.", manual: true };
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
      impressions,
    },
    raw: { public_metrics: pub, organic_metrics: organic },
  };
}

async function fetchTikTokMetrics(videoId: string): Promise<FetchResult> {
  const token = await ensureFreshToken("tiktok").catch(() => null);
  if (!token) return { ok: false, reason: "TikTok is not connected.", manual: true };
  const url =
    "https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filters: { video_ids: [videoId] } }),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) return { ok: false, reason: "TikTok token expired.", manual: true };
  if (!response.ok) {
    return {
      ok: false,
      reason: "TikTok video insights need extra scopes. Enter stats manually.",
      manual: true,
    };
  }
  const json = (await response.json()) as {
    data?: { videos?: Array<{ view_count?: number; like_count?: number; comment_count?: number; share_count?: number }> };
    error?: { message?: string };
  };
  const video = json.data?.videos?.[0];
  if (!video) {
    return { ok: false, reason: "TikTok returned no video stats. Enter them manually.", manual: true };
  }
  return {
    ok: true,
    metrics: {
      ...EMPTY_METRICS,
      views: num(video.view_count),
      likes: num(video.like_count),
      comments: num(video.comment_count),
      shares: num(video.share_count),
    },
    raw: { video },
  };
}

async function fetchInstagramMetrics(mediaId: string): Promise<FetchResult> {
  const token = await ensureFreshToken("instagram").catch(() => null);
  if (!token) return { ok: false, reason: "Instagram is not connected.", manual: true };
  const fields = new URL("https://graph.facebook.com/v21.0/" + encodeURIComponent(mediaId));
  fields.searchParams.set("fields", "like_count,comments_count,media_type");
  fields.searchParams.set("access_token", token.accessToken);
  const mediaRes = await fetch(fields, { signal: AbortSignal.timeout(15000) });
  if (mediaRes.status === 401) return { ok: false, reason: "Instagram token expired.", manual: true };
  const media = mediaRes.ok
    ? ((await mediaRes.json()) as { like_count?: number; comments_count?: number })
    : null;
  const insightsUrl = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}/insights`);
  insightsUrl.searchParams.set("metric", "plays,reach,saved,shares,total_interactions");
  insightsUrl.searchParams.set("access_token", token.accessToken);
  const insightsRes = await fetch(insightsUrl, { signal: AbortSignal.timeout(15000) });
  let plays: number | null = null;
  let saved: number | null = null;
  let shares: number | null = null;
  if (insightsRes.ok) {
    const insights = (await insightsRes.json()) as {
      data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
    };
    for (const row of insights.data ?? []) {
      const value = num(row.values?.[0]?.value);
      if (row.name === "plays" || row.name === "reach") plays = plays ?? value;
      if (row.name === "saved") saved = value;
      if (row.name === "shares") shares = value;
    }
  }
  if (!media && plays == null) {
    return {
      ok: false,
      reason: "Instagram insights need a professional account with insights permission. Enter stats manually.",
      manual: true,
    };
  }
  return {
    ok: true,
    metrics: {
      ...EMPTY_METRICS,
      views: plays,
      likes: num(media?.like_count),
      comments: num(media?.comments_count),
      shares,
      saves: saved,
    },
    raw: { media, plays, saved, shares },
  };
}

async function fetchYouTubeMetrics(videoId: string): Promise<FetchResult> {
  const key = await loadYoutubeApiKey();
  if (!key) return { ok: false, reason: "YouTube Data API key is not configured.", manual: true };
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (response.status === 403 || response.status === 429) {
    return { ok: false, reason: "YouTube quota reached.", manual: true };
  }
  if (!response.ok) return { ok: false, reason: "YouTube stats request failed.", manual: true };
  const json = (await response.json()) as {
    items?: Array<{ statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
  };
  const stats = json.items?.[0]?.statistics;
  if (!stats) return { ok: false, reason: "YouTube returned no statistics.", manual: true };
  return {
    ok: true,
    metrics: {
      ...EMPTY_METRICS,
      views: num(stats.viewCount),
      likes: num(stats.likeCount),
      comments: num(stats.commentCount),
    },
    raw: { statistics: stats },
  };
}

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function sum(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

export async function enqueuePerformanceFetches(input: {
  socialPostId: string;
  externalPostId: string;
  platform: PerformancePlatform;
}): Promise<void> {
  await ensurePerformanceSchema();
  const policy = await readLearningPolicy();
  const delays = policy.fetchDelaysHours.length ? policy.fetchDelaysHours : [1, 24, 168];
  const now = Date.now();
  for (const hours of delays) {
    const window: PerformanceWindow =
      hours <= 36 ? "D1" : hours <= 200 ? "D7" : hours <= 24 * 32 ? "D28" : "LIFETIME";
    const runAt = new Date(now + hours * 3600 * 1000).toISOString();
    await insertQueueRow({
      socialPostId: input.socialPostId,
      externalPostId: input.externalPostId,
      platform: input.platform,
      window,
      runAt,
    });
  }
}

async function insertQueueRow(row: {
  socialPostId: string;
  externalPostId: string;
  platform: PerformancePlatform;
  window: PerformanceWindow;
  runAt: string;
}): Promise<void> {
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
    created_at: nowIso(),
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("performance_fetch_queue").insert(payload);
    if (!error || !isMissingTable(error)) return;
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into performance_fetch_queue
        (id, social_post_id, external_post_id, platform, "window", run_at, status, attempts, last_error, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        payload.id,
        payload.social_post_id,
        payload.external_post_id,
        payload.platform,
        payload.window,
        payload.run_at,
        payload.status,
        payload.attempts,
        payload.last_error,
        payload.created_at,
      ],
    );
  } catch {
    /* ok */
  }
}

export async function sweepDuePerformanceFetches(limit = 12): Promise<number> {
  await ensurePerformanceSchema();
  const due = await listDueQueue(limit);
  let ran = 0;
  for (const row of due) {
    const result = await refreshOnePost({
      socialPostId: row.socialPostId,
      externalPostId: row.externalPostId,
      platform: row.platform,
      window: row.window,
      actorId: "system:performance-sweep",
    });
    await markQueue(row.id, result.ok ? "DONE" : "FAILED", result.ok ? null : (result.reason ?? "FETCH_FAILED"));
    ran += 1;
  }
  return ran;
}

type QueueRow = {
  id: string;
  socialPostId: string | null;
  externalPostId: string;
  platform: PerformancePlatform;
  window: PerformanceWindow;
};

async function listDueQueue(limit: number): Promise<QueueRow[]> {
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("performance_fetch_queue")
      .select("*")
      .eq("status", "PENDING")
      .lte("run_at", stamp)
      .order("run_at", { ascending: true })
      .limit(limit);
    if (!error) {
      return (data ?? []).map((row) => {
        const rec = row as Record<string, unknown>;
        return {
          id: String(rec.id),
          socialPostId: rec.social_post_id ? String(rec.social_post_id) : null,
          externalPostId: String(rec.external_post_id),
          platform: String(rec.platform) as PerformancePlatform,
          window: String(rec.window) as PerformanceWindow,
        };
      });
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select * from performance_fetch_queue
       where status = 'PENDING' and run_at <= $1
       order by run_at asc
       limit $2`,
      [stamp, limit],
    );
    return rows.map((rec) => ({
      id: String(rec.id),
      socialPostId: rec.social_post_id ? String(rec.social_post_id) : null,
      externalPostId: String(rec.external_post_id),
      platform: String(rec.platform) as PerformancePlatform,
      window: String(rec.window) as PerformanceWindow,
    }));
  } catch {
    return [];
  }
}

async function markQueue(id: string, status: "DONE" | "FAILED", error: string | null): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin
      .from("performance_fetch_queue")
      .update({ status, last_error: error, attempts: 1 })
      .eq("id", id);
    return;
  }
  try {
    const sql = await localSql();
    await sql.query(
      "update performance_fetch_queue set status = $2, last_error = $3, attempts = attempts + 1 where id = $1",
      [id, status, error],
    );
  } catch {
    /* ok */
  }
}

export async function refreshOnePost(input: {
  socialPostId?: string | null;
  externalPostId: string;
  platform: PerformancePlatform;
  window?: PerformanceWindow;
  actorId: string;
  post?: Partial<SocialPost> | null;
}): Promise<{ ok: boolean; reason?: string; snapshot?: Awaited<ReturnType<typeof upsertPostPerformance>> }> {
  const fetched = await fetchPlatformMetrics({
    platform: input.platform,
    externalPostId: input.externalPostId,
  });
  if (!fetched.ok) return { ok: false, reason: fetched.reason };
  const post = input.post;
  const publishedAt = post?.createdAt ?? null;
  const ageHours = publishedAt ? (Date.now() - Date.parse(publishedAt)) / 3600000 : 24;
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
    createdBy: input.actorId,
  });
  try {
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
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
        socialPostId: snapshot.socialPostId,
      },
    });
  } catch {
    /* audit is best-effort */
  }
  try {
    const { maybeProposeFromWinner } = await import("@/lib/server/knowledge-proposals.server");
    await maybeProposeFromWinner(snapshot, input.actorId);
  } catch {
    /* proposal is optional */
  }
  return { ok: true, snapshot };
}

export async function onSocialUploadSucceeded(input: {
  post: SocialPost;
  actorId?: string | null;
}): Promise<void> {
  const externalId = input.post.externalPostId;
  if (!externalId) return;
  const platform = socialPlatformToPerformance(input.post.platform);
  await enqueuePerformanceFetches({
    socialPostId: input.post.id,
    externalPostId: externalId,
    platform,
  });
  const fetched = await refreshOnePost({
    socialPostId: input.post.id,
    externalPostId: externalId,
    platform,
    window: "LIFETIME",
    actorId: input.actorId ?? "system:social-upload",
    post: input.post,
  }).catch(() => ({ ok: false as const, reason: "FETCH_FAILED" }));
  if (fetched.ok) return;
  // API miss: keep an unknown snapshot so operators can enter stats. Never write zeros.
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
    createdBy: input.actorId ?? "system:social-upload",
  }).catch(() => null);
}

export async function refreshPostById(socialPostId: string, actorId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const { readSocialPosts } = await import("@/lib/server/social");
  const posts = await readSocialPosts();
  const post = posts.find((row) => row.id === socialPostId);
  if (!post) return { ok: false, reason: "POST_MISSING" };
  if (!post.externalPostId) return { ok: false, reason: "NO_EXTERNAL_ID" };
  return refreshOnePost({
    socialPostId: post.id,
    externalPostId: post.externalPostId,
    platform: socialPlatformToPerformance(post.platform),
    actorId,
    post,
  });
}

export async function sweepStalePublishedPosts(): Promise<number> {
  const { readSocialPosts } = await import("@/lib/server/social");
  const posts = await readSocialPosts();
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const existing = await listPostPerformance({ limit: 500 });
  const recentByPost = new Set(
    existing
      .filter((row) => Date.parse(row.capturedAt) > Date.now() - 20 * 3600 * 1000)
      .map((row) => row.socialPostId)
      .filter(Boolean),
  );
  let n = 0;
  for (const post of posts) {
    if (post.status !== "succeeded" || !post.externalPostId) continue;
    if (Date.parse(post.createdAt) < cutoff) continue;
    if (recentByPost.has(post.id)) continue;
    const result = await refreshOnePost({
      socialPostId: post.id,
      externalPostId: post.externalPostId,
      platform: socialPlatformToPerformance(post.platform),
      actorId: "system:stale-sweep",
      post,
    });
    if (result.ok) n += 1;
  }
  return n;
}
