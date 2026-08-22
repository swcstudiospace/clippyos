import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { ensurePerformanceSchema } from "@/lib/server/performance-schema.server";
import {
  DEFAULT_LEARNING_POLICY,
  PERFORMANCE_PLATFORMS,
  PERFORMANCE_VERDICTS,
  PERFORMANCE_WINDOWS,
  METRICS_SOURCES,
  classifyVerdict,
  compositeScore,
  engagementRate,
  mergeMetrics,
  parseLearningPolicy,
  parseMetrics,
  percentileRank,
  type AssetPerformanceRollup,
  type LearningPolicy,
  type MetricsSource,
  type PerformancePlatform,
  type PerformanceVerdict,
  type PerformanceWindow,
  type PostMetrics,
  type PostPerformance,
} from "@/lib/performance";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function capturedDay(iso: string): string {
  return iso.slice(0, 10);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asNullable(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function asInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function asFloat(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function redactRaw(raw: unknown): string | null {
  if (raw == null) return null;
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text
    .replace(/"(access_token|refresh_token|token|authorization|secret)"\s*:\s*"[^"]*"/gi, '"$1":"[redacted]"')
    .slice(0, 8000);
}

export function mapPostPerformance(row: Record<string, unknown>): PostPerformance {
  return {
    id: String(row.id ?? ""),
    workspaceId: String(row.workspace_id ?? "default"),
    clientId: asNullable(row.client_id),
    socialJobId: asNullable(row.social_job_id),
    socialPostId: asNullable(row.social_post_id),
    platform: oneOf(row.platform, PERFORMANCE_PLATFORMS, "OTHER"),
    externalPostId: String(row.external_post_id ?? ""),
    externalUrl: asNullable(row.external_url),
    mediaAssetId: asNullable(row.media_asset_id),
    streamClipId: asNullable(row.stream_clip_id),
    publishedAt: asNullable(row.published_at),
    metrics: parseMetrics(row.metrics),
    metricsSource: oneOf(row.metrics_source, METRICS_SOURCES, "MANUAL"),
    capturedAt: String(row.captured_at ?? row.created_at ?? ""),
    capturedDay: String(row.captured_day ?? capturedDay(String(row.captured_at ?? ""))),
    window: oneOf(row.window, PERFORMANCE_WINDOWS, "LIFETIME"),
    score: asInt(row.score),
    viewsPercentile: asFloat(row.views_percentile),
    engagementPercentile: asFloat(row.engagement_percentile),
    engagementRate: asFloat(row.engagement_rate),
    verdict: oneOf(row.verdict, PERFORMANCE_VERDICTS, "UNKNOWN"),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdBy: asNullable(row.created_by),
  };
}

export function mapRollup(row: Record<string, unknown>): AssetPerformanceRollup {
  return {
    assetId: String(row.asset_id ?? ""),
    workspaceId: String(row.workspace_id ?? "default"),
    clientId: asNullable(row.client_id),
    bestPlatform: row.best_platform
      ? oneOf(row.best_platform, PERFORMANCE_PLATFORMS, "OTHER")
      : null,
    bestExternalPostId: asNullable(row.best_external_post_id),
    score: asInt(row.score),
    viewsTotal: asInt(row.views_total),
    engagementRate: asFloat(row.engagement_rate),
    sampleCount: asInt(row.sample_count) ?? 0,
    winnerCount: asInt(row.winner_count) ?? 0,
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function readLearningPolicy(): Promise<LearningPolicy> {
  const raw = await readAppSetting("LEARNING_POLICY_JSON");
  if (!raw) return { ...DEFAULT_LEARNING_POLICY };
  try {
    return parseLearningPolicy(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LEARNING_POLICY };
  }
}

export async function writeLearningPolicy(policy: LearningPolicy): Promise<LearningPolicy> {
  const next = parseLearningPolicy(policy);
  await writeAppSetting("LEARNING_POLICY_JSON", JSON.stringify(next));
  return next;
}

export async function listPostPerformance(filters?: {
  clientId?: string;
  platform?: PerformancePlatform;
  winnersOnly?: boolean;
  socialPostId?: string;
  mediaAssetId?: string;
  limit?: number;
}): Promise<PostPerformance[]> {
  await ensurePerformanceSchema();
  const limit = Math.min(Math.max(filters?.limit ?? 200, 1), 500);
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("post_performance").select("*").order("captured_at", { ascending: false }).limit(limit);
    if (filters?.clientId) q = q.eq("client_id", filters.clientId);
    if (filters?.platform) q = q.eq("platform", filters.platform);
    if (filters?.socialPostId) q = q.eq("social_post_id", filters.socialPostId);
    if (filters?.mediaAssetId) q = q.eq("media_asset_id", filters.mediaAssetId);
    if (filters?.winnersOnly) q = q.eq("verdict", "WINNER");
    const { data, error } = await q;
    if (!error) return (data ?? []).map((row) => mapPostPerformance(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters?.clientId) {
      params.push(filters.clientId);
      clauses.push(`client_id = $${params.length}`);
    }
    if (filters?.platform) {
      params.push(filters.platform);
      clauses.push(`platform = $${params.length}`);
    }
    if (filters?.socialPostId) {
      params.push(filters.socialPostId);
      clauses.push(`social_post_id = $${params.length}`);
    }
    if (filters?.mediaAssetId) {
      params.push(filters.mediaAssetId);
      clauses.push(`media_asset_id = $${params.length}`);
    }
    if (filters?.winnersOnly) clauses.push(`verdict = 'WINNER'`);
    params.push(limit);
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const rows = await sql.query<Record<string, unknown>>(
      `select * from post_performance ${where} order by captured_at desc limit $${params.length}`,
      params,
    );
    return rows.map(mapPostPerformance);
  } catch {
    return [];
  }
}

export async function listAssetRollups(clientId?: string): Promise<AssetPerformanceRollup[]> {
  await ensurePerformanceSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("asset_performance_rollups").select("*").order("score", { ascending: false, nullsFirst: false });
    if (clientId) q = q.eq("client_id", clientId);
    const { data, error } = await q;
    if (!error) return (data ?? []).map((row) => mapRollup(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = clientId
      ? await sql.query<Record<string, unknown>>(
          "select * from asset_performance_rollups where client_id = $1 order by score desc nulls last",
          [clientId],
        )
      : await sql.query<Record<string, unknown>>(
          "select * from asset_performance_rollups order by score desc nulls last",
        );
    return rows.map(mapRollup);
  } catch {
    return [];
  }
}

export async function getAssetRollup(assetId: string): Promise<AssetPerformanceRollup | null> {
  const rows = await listAssetRollups();
  return rows.find((row) => row.assetId === assetId) ?? null;
}

export type UpsertPerformanceInput = {
  clientId?: string | null;
  socialJobId?: string | null;
  socialPostId?: string | null;
  platform: PerformancePlatform;
  externalPostId: string;
  externalUrl?: string | null;
  mediaAssetId?: string | null;
  streamClipId?: string | null;
  publishedAt?: string | null;
  metrics: PostMetrics;
  metricsSource: MetricsSource;
  window: PerformanceWindow;
  raw?: unknown;
  createdBy?: string | null;
};

export async function upsertPostPerformance(input: UpsertPerformanceInput): Promise<PostPerformance> {
  await ensurePerformanceSchema();
  const stamp = nowIso();
  const day = capturedDay(stamp);
  const rate = engagementRate(input.metrics);
  const payload = {
    id: newId(),
    workspace_id: "default",
    client_id: input.clientId ?? null,
    social_job_id: input.socialJobId ?? null,
    social_post_id: input.socialPostId ?? null,
    platform: input.platform,
    external_post_id: input.externalPostId,
    external_url: input.externalUrl ?? null,
    media_asset_id: input.mediaAssetId ?? null,
    stream_clip_id: input.streamClipId ?? null,
    published_at: input.publishedAt ?? null,
    metrics: JSON.stringify(input.metrics),
    metrics_source: input.metricsSource,
    captured_at: stamp,
    captured_day: day,
    window: input.window,
    score: null as number | null,
    views_percentile: null as number | null,
    engagement_percentile: null as number | null,
    engagement_rate: rate,
    verdict: "UNKNOWN",
    raw: redactRaw(input.raw),
    created_at: stamp,
    updated_at: stamp,
    created_by: input.createdBy ?? null,
  };

  const admin = await getAgencyAdmin();
  if (admin) {
    const existing = await admin
      .from("post_performance")
      .select("id, metrics")
      .eq("external_post_id", input.externalPostId)
      .eq("window", input.window)
      .eq("captured_day", day)
      .maybeSingle();
    if (!existing.error && existing.data) {
      const id = String((existing.data as { id: string }).id);
      const merged = mergeMetrics(
        parseMetrics((existing.data as { metrics?: unknown }).metrics),
        input.metrics,
      );
      const mergedRate = engagementRate(merged);
      const { data, error } = await admin
        .from("post_performance")
        .update({
          metrics: JSON.stringify(merged),
          metrics_source: payload.metrics_source,
          captured_at: stamp,
          engagement_rate: mergedRate,
          raw: payload.raw,
          social_post_id: payload.social_post_id,
          social_job_id: payload.social_job_id,
          media_asset_id: payload.media_asset_id,
          external_url: payload.external_url,
          updated_at: stamp,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (!error && data) {
        const mapped = mapPostPerformance(data as Record<string, unknown>);
        await rescorePeerSet(mapped.clientId, mapped.platform);
        const refreshed = (await listPostPerformance({ limit: 500 })).find((row) => row.id === mapped.id);
        return refreshed ?? mapped;
      }
    } else {
      const { data, error } = await admin.from("post_performance").insert(payload).select("*").maybeSingle();
      if (!error && data) {
        const mapped = mapPostPerformance(data as Record<string, unknown>);
        await rescorePeerSet(mapped.clientId, mapped.platform);
        const refreshed = (await listPostPerformance({ limit: 500 })).find((row) => row.id === mapped.id);
        return refreshed ?? mapped;
      }
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
  }

  const sql = await localSql();
  const existing = await sql.query<{ id: string; metrics: unknown }>(
    `select id, metrics from post_performance
     where external_post_id = $1 and "window" = $2 and captured_day = $3
     limit 1`,
    [input.externalPostId, input.window, day],
  );
  let id = existing[0]?.id;
  if (id) {
    const merged = mergeMetrics(parseMetrics(existing[0]?.metrics), input.metrics);
    const mergedRate = engagementRate(merged);
    await sql.query(
      `update post_performance
       set metrics = $2, metrics_source = $3, captured_at = $4, engagement_rate = $5,
           raw = $6, social_post_id = $7, social_job_id = $8, media_asset_id = $9,
           external_url = $10, updated_at = $4
       where id = $1`,
      [
        id,
        JSON.stringify(merged),
        payload.metrics_source,
        stamp,
        mergedRate,
        payload.raw,
        payload.social_post_id,
        payload.social_job_id,
        payload.media_asset_id,
        payload.external_url,
      ],
    );
  } else {
    id = payload.id;
    await sql.query(
      `insert into post_performance
        (id, workspace_id, client_id, social_job_id, social_post_id, platform, external_post_id,
         external_url, media_asset_id, stream_clip_id, published_at, metrics, metrics_source,
         captured_at, captured_day, "window", score, views_percentile, engagement_percentile,
         engagement_rate, verdict, raw, created_at, updated_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23,$24)`,
      [
        payload.id,
        payload.workspace_id,
        payload.client_id,
        payload.social_job_id,
        payload.social_post_id,
        payload.platform,
        payload.external_post_id,
        payload.external_url,
        payload.media_asset_id,
        payload.stream_clip_id,
        payload.published_at,
        payload.metrics,
        payload.metrics_source,
        payload.captured_at,
        payload.captured_day,
        payload.window,
        payload.score,
        payload.views_percentile,
        payload.engagement_percentile,
        payload.engagement_rate,
        payload.verdict,
        payload.raw,
        payload.created_at,
        payload.created_by,
      ],
    );
  }
  await rescorePeerSet(input.clientId ?? null, input.platform);
  const rows = await listPostPerformance({ limit: 500 });
  const hit = rows.find((row) => row.id === id);
  if (!hit) throw new Error("DATA_UNAVAILABLE");
  return hit;
}

export async function rescorePeerSet(
  clientId: string | null,
  platform: PerformancePlatform,
): Promise<void> {
  const policy = await readLearningPolicy();
  const all = await listPostPerformance({
    clientId: clientId ?? undefined,
    platform,
    limit: 500,
  });
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = all.filter((row) => Date.parse(row.capturedAt) >= cutoff);
  const latestByPost = new Map<string, PostPerformance>();
  for (const row of recent.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))) {
    const key = `${row.externalPostId}:${row.window}`;
    if (!latestByPost.has(key)) latestByPost.set(key, row);
  }
  const peers = [...latestByPost.values()];
  const views = peers.map((row) => row.metrics.views).filter((n): n is number => n != null);
  const rates = peers.map((row) => row.engagementRate).filter((n): n is number => n != null);
  const stamp = nowIso();

  for (const row of peers) {
    const viewsPct =
      row.metrics.views != null ? percentileRank(row.metrics.views, views) : null;
    const engPct = row.engagementRate != null ? percentileRank(row.engagementRate, rates) : null;
    const score = compositeScore(viewsPct, engPct);
    const verdict = classifyVerdict({
      score,
      views: row.metrics.views,
      viewsPercentile: viewsPct,
      policy,
    });
    await patchScores(row.id, {
      score,
      viewsPercentile: viewsPct,
      engagementPercentile: engPct,
      verdict,
      stamp,
    });
  }

  const assetIds = [...new Set(peers.map((row) => row.mediaAssetId).filter((id): id is string => Boolean(id)))];
  for (const assetId of assetIds) {
    await rebuildAssetRollup(assetId);
  }
}

async function patchScores(
  id: string,
  values: {
    score: number | null;
    viewsPercentile: number | null;
    engagementPercentile: number | null;
    verdict: PerformanceVerdict;
    stamp: string;
  },
): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin
      .from("post_performance")
      .update({
        score: values.score,
        views_percentile: values.viewsPercentile,
        engagement_percentile: values.engagementPercentile,
        verdict: values.verdict,
        updated_at: values.stamp,
      })
      .eq("id", id);
    if (!error) return;
    if (!isMissingTable(error)) return;
  }
  try {
    const sql = await localSql();
    await sql.query(
      `update post_performance
       set score = $2, views_percentile = $3, engagement_percentile = $4, verdict = $5, updated_at = $6
       where id = $1`,
      [id, values.score, values.viewsPercentile, values.engagementPercentile, values.verdict, values.stamp],
    );
  } catch {
    /* ok */
  }
}

export async function rebuildAssetRollup(assetId: string): Promise<AssetPerformanceRollup | null> {
  await ensurePerformanceSchema();
  const rows = await listPostPerformance({ mediaAssetId: assetId, limit: 200 });
  const latest = new Map<string, PostPerformance>();
  for (const row of rows.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))) {
    if (!latest.has(row.externalPostId)) latest.set(row.externalPostId, row);
  }
  const samples = [...latest.values()];
  if (!samples.length) return null;
  let viewsWeighted = 0;
  let scoreWeighted = 0;
  let viewsKnown = 0;
  let rateSum = 0;
  let rateN = 0;
  let winnerCount = 0;
  let best: PostPerformance | null = null;
  for (const row of samples) {
    const views = row.metrics.views;
    if (views != null) {
      viewsKnown += views;
      if (row.score != null) {
        viewsWeighted += views;
        scoreWeighted += row.score * views;
      }
    } else if (row.score != null && best == null) {
      best = row;
    }
    if (row.engagementRate != null) {
      rateSum += row.engagementRate;
      rateN += 1;
    }
    if (row.verdict === "WINNER") winnerCount += 1;
    if (!best || (row.score ?? -1) > (best.score ?? -1)) best = row;
  }
  const score =
    viewsWeighted > 0
      ? Math.round(scoreWeighted / viewsWeighted)
      : best?.score ?? null;
  const stamp = nowIso();
  const payload = {
    asset_id: assetId,
    workspace_id: "default",
    client_id: samples[0]?.clientId ?? null,
    best_platform: best?.platform ?? null,
    best_external_post_id: best?.externalPostId ?? null,
    score,
    views_total: viewsKnown > 0 ? viewsKnown : null,
    engagement_rate: rateN > 0 ? rateSum / rateN : null,
    sample_count: samples.length,
    winner_count: winnerCount,
    updated_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("asset_performance_rollups").upsert(payload, { onConflict: "asset_id" });
    if (error && !isMissingTable(error)) {
      /* fall through */
    } else if (!error) {
      return mapRollup(payload);
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into asset_performance_rollups
        (asset_id, workspace_id, client_id, best_platform, best_external_post_id, score,
         views_total, engagement_rate, sample_count, winner_count, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (asset_id) do update set
         client_id = excluded.client_id,
         best_platform = excluded.best_platform,
         best_external_post_id = excluded.best_external_post_id,
         score = excluded.score,
         views_total = excluded.views_total,
         engagement_rate = excluded.engagement_rate,
         sample_count = excluded.sample_count,
         winner_count = excluded.winner_count,
         updated_at = excluded.updated_at`,
      [
        payload.asset_id,
        payload.workspace_id,
        payload.client_id,
        payload.best_platform,
        payload.best_external_post_id,
        payload.score,
        payload.views_total,
        payload.engagement_rate,
        payload.sample_count,
        payload.winner_count,
        payload.updated_at,
      ],
    );
  } catch {
    /* ok */
  }
  return mapRollup(payload);
}

export async function listWinners(input?: {
  clientId?: string;
  platform?: PerformancePlatform;
  limit?: number;
}): Promise<PostPerformance[]> {
  const rows = await listPostPerformance({
    clientId: input?.clientId,
    platform: input?.platform,
    winnersOnly: true,
    limit: input?.limit ?? 50,
  });
  const seen = new Set<string>();
  const out: PostPerformance[] = [];
  for (const row of rows) {
    if (seen.has(row.externalPostId)) continue;
    seen.add(row.externalPostId);
    out.push(row);
  }
  return out;
}
