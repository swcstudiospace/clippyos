import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { C as mergeMetrics, E as percentileRank, T as parseMetrics, _ as classifyVerdict, a as METRICS_SOURCES, c as PERFORMANCE_VERDICTS, l as PERFORMANCE_WINDOWS, o as PERFORMANCE_PLATFORMS, t as DEFAULT_LEARNING_POLICY, v as compositeScore, w as parseLearningPolicy, y as engagementRate } from "./performance-Cj9pmeSi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance.server-kOlT5k3Z.js
var schemaReady = null;
var DDL = `
alter table knowledge_entries drop constraint if exists knowledge_entries_scope_check;
alter table knowledge_entries add constraint knowledge_entries_scope_check
  check (scope in (
    'THUMBNAIL_GLOBAL',
    'VIDEO_GLOBAL',
    'CLIENT_TITLES',
    'CLIENT_IDEAS',
    'CLIENT_CLIPPING'
  ));
create table if not exists post_performance (
  id                      text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  social_job_id           text,
  social_post_id          text,
  platform                text not null,
  external_post_id        text not null,
  external_url            text,
  media_asset_id          text,
  stream_clip_id          text,
  published_at            timestamptz,
  metrics                 text not null default '{}',
  metrics_source          text not null,
  captured_at             timestamptz not null,
  captured_day            text not null,
  "window"                text not null,
  score                   integer,
  views_percentile        double precision,
  engagement_percentile   double precision,
  engagement_rate         double precision,
  verdict                 text,
  raw                     text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              text
);
create unique index if not exists post_performance_idemp_uidx
  on post_performance (external_post_id, "window", captured_day);
create index if not exists post_performance_client_idx
  on post_performance (client_id, captured_at desc);
create index if not exists post_performance_post_idx
  on post_performance (social_post_id);
create index if not exists post_performance_asset_idx
  on post_performance (media_asset_id);
create table if not exists asset_performance_rollups (
  asset_id                text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  best_platform           text,
  best_external_post_id   text,
  score                   integer,
  views_total             bigint,
  engagement_rate         double precision,
  sample_count            integer not null default 0,
  winner_count            integer not null default 0,
  updated_at              timestamptz not null default now()
);
create table if not exists knowledge_proposals (
  id                      text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  status                  text not null,
  suggested_scope         text not null,
  source                  text not null,
  source_refs             text not null default '{}',
  user_input_draft        text not null,
  learned_principle_draft text not null,
  principle_hash          text,
  confidence              double precision,
  created_at              timestamptz not null default now(),
  reviewed_by             text,
  reviewed_at             timestamptz,
  decision_note           text,
  merged_entry_id         text,
  created_by              text
);
create index if not exists knowledge_proposals_status_idx
  on knowledge_proposals (status, created_at desc);
create index if not exists knowledge_proposals_hash_idx
  on knowledge_proposals (principle_hash);
create table if not exists performance_fetch_queue (
  id               text primary key,
  social_post_id   text,
  external_post_id text not null,
  platform         text not null,
  "window"         text not null,
  run_at           timestamptz not null,
  status           text not null default 'PENDING',
  attempts         integer not null default 0,
  last_error       text,
  created_at       timestamptz not null default now()
);
create index if not exists performance_fetch_queue_due_idx
  on performance_fetch_queue (status, run_at);
`;
async function ensurePerformanceSchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		try {
			const sql = await localSql();
			for (const statement of DDL.split(";").map((part) => part.trim()).filter(Boolean)) try {
				await sql.query(`${statement};`);
			} catch {}
		} catch {
			schemaReady = null;
		}
	})();
	return schemaReady;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function capturedDay(iso) {
	return iso.slice(0, 10);
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function asNullable(value) {
	if (value == null || value === "") return null;
	return String(value);
}
function asInt(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.round(n);
}
function asFloat(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
function redactRaw(raw) {
	if (raw == null) return null;
	return (typeof raw === "string" ? raw : JSON.stringify(raw)).replace(/"(access_token|refresh_token|token|authorization|secret)"\s*:\s*"[^"]*"/gi, "\"$1\":\"[redacted]\"").slice(0, 8e3);
}
function mapPostPerformance(row) {
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
		createdBy: asNullable(row.created_by)
	};
}
function mapRollup(row) {
	return {
		assetId: String(row.asset_id ?? ""),
		workspaceId: String(row.workspace_id ?? "default"),
		clientId: asNullable(row.client_id),
		bestPlatform: row.best_platform ? oneOf(row.best_platform, PERFORMANCE_PLATFORMS, "OTHER") : null,
		bestExternalPostId: asNullable(row.best_external_post_id),
		score: asInt(row.score),
		viewsTotal: asInt(row.views_total),
		engagementRate: asFloat(row.engagement_rate),
		sampleCount: asInt(row.sample_count) ?? 0,
		winnerCount: asInt(row.winner_count) ?? 0,
		updatedAt: String(row.updated_at ?? "")
	};
}
async function readLearningPolicy() {
	const raw = await readAppSetting("LEARNING_POLICY_JSON");
	if (!raw) return { ...DEFAULT_LEARNING_POLICY };
	try {
		return parseLearningPolicy(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_LEARNING_POLICY };
	}
}
async function writeLearningPolicy(policy) {
	const next = parseLearningPolicy(policy);
	await writeAppSetting("LEARNING_POLICY_JSON", JSON.stringify(next));
	return next;
}
async function listPostPerformance(filters) {
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
		if (!error) return (data ?? []).map((row) => mapPostPerformance(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		const sql = await localSql();
		const clauses = [];
		const params = [];
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
		return (await sql.query(`select * from post_performance ${where} order by captured_at desc limit $${params.length}`, params)).map(mapPostPerformance);
	} catch {
		return [];
	}
}
async function listAssetRollups(clientId) {
	await ensurePerformanceSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		let q = admin.from("asset_performance_rollups").select("*").order("score", {
			ascending: false,
			nullsFirst: false
		});
		if (clientId) q = q.eq("client_id", clientId);
		const { data, error } = await q;
		if (!error) return (data ?? []).map((row) => mapRollup(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		const sql = await localSql();
		return (clientId ? await sql.query("select * from asset_performance_rollups where client_id = $1 order by score desc nulls last", [clientId]) : await sql.query("select * from asset_performance_rollups order by score desc nulls last")).map(mapRollup);
	} catch {
		return [];
	}
}
async function getAssetRollup(assetId) {
	return (await listAssetRollups()).find((row) => row.assetId === assetId) ?? null;
}
async function upsertPostPerformance(input) {
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
		score: null,
		views_percentile: null,
		engagement_percentile: null,
		engagement_rate: rate,
		verdict: "UNKNOWN",
		raw: redactRaw(input.raw),
		created_at: stamp,
		updated_at: stamp,
		created_by: input.createdBy ?? null
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const existing = await admin.from("post_performance").select("id, metrics").eq("external_post_id", input.externalPostId).eq("window", input.window).eq("captured_day", day).maybeSingle();
		if (!existing.error && existing.data) {
			const id = String(existing.data.id);
			const merged = mergeMetrics(parseMetrics(existing.data.metrics), input.metrics);
			const mergedRate = engagementRate(merged);
			const { data, error } = await admin.from("post_performance").update({
				metrics: JSON.stringify(merged),
				metrics_source: payload.metrics_source,
				captured_at: stamp,
				engagement_rate: mergedRate,
				raw: payload.raw,
				social_post_id: payload.social_post_id,
				social_job_id: payload.social_job_id,
				media_asset_id: payload.media_asset_id,
				external_url: payload.external_url,
				updated_at: stamp
			}).eq("id", id).select("*").maybeSingle();
			if (!error && data) {
				const mapped = mapPostPerformance(data);
				await rescorePeerSet(mapped.clientId, mapped.platform);
				return (await listPostPerformance({ limit: 500 })).find((row) => row.id === mapped.id) ?? mapped;
			}
		} else {
			const { data, error } = await admin.from("post_performance").insert(payload).select("*").maybeSingle();
			if (!error && data) {
				const mapped = mapPostPerformance(data);
				await rescorePeerSet(mapped.clientId, mapped.platform);
				return (await listPostPerformance({ limit: 500 })).find((row) => row.id === mapped.id) ?? mapped;
			}
			if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		}
	}
	const sql = await localSql();
	const existing = await sql.query(`select id, metrics from post_performance
     where external_post_id = $1 and "window" = $2 and captured_day = $3
     limit 1`, [
		input.externalPostId,
		input.window,
		day
	]);
	let id = existing[0]?.id;
	if (id) {
		const merged = mergeMetrics(parseMetrics(existing[0]?.metrics), input.metrics);
		const mergedRate = engagementRate(merged);
		await sql.query(`update post_performance
       set metrics = $2, metrics_source = $3, captured_at = $4, engagement_rate = $5,
           raw = $6, social_post_id = $7, social_job_id = $8, media_asset_id = $9,
           external_url = $10, updated_at = $4
       where id = $1`, [
			id,
			JSON.stringify(merged),
			payload.metrics_source,
			stamp,
			mergedRate,
			payload.raw,
			payload.social_post_id,
			payload.social_job_id,
			payload.media_asset_id,
			payload.external_url
		]);
	} else {
		id = payload.id;
		await sql.query(`insert into post_performance
        (id, workspace_id, client_id, social_job_id, social_post_id, platform, external_post_id,
         external_url, media_asset_id, stream_clip_id, published_at, metrics, metrics_source,
         captured_at, captured_day, "window", score, views_percentile, engagement_percentile,
         engagement_rate, verdict, raw, created_at, updated_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23,$24)`, [
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
			payload.created_by
		]);
	}
	await rescorePeerSet(input.clientId ?? null, input.platform);
	const hit = (await listPostPerformance({ limit: 500 })).find((row) => row.id === id);
	if (!hit) throw new Error("DATA_UNAVAILABLE");
	return hit;
}
async function rescorePeerSet(clientId, platform) {
	const policy = await readLearningPolicy();
	const all = await listPostPerformance({
		clientId: clientId ?? void 0,
		platform,
		limit: 500
	});
	const cutoff = Date.now() - 7776e6;
	const recent = all.filter((row) => Date.parse(row.capturedAt) >= cutoff);
	const latestByPost = /* @__PURE__ */ new Map();
	for (const row of recent.sort((a, b) => a.capturedAt < b.capturedAt ? 1 : -1)) {
		const key = `${row.externalPostId}:${row.window}`;
		if (!latestByPost.has(key)) latestByPost.set(key, row);
	}
	const peers = [...latestByPost.values()];
	const views = peers.map((row) => row.metrics.views).filter((n) => n != null);
	const rates = peers.map((row) => row.engagementRate).filter((n) => n != null);
	const stamp = nowIso();
	for (const row of peers) {
		const viewsPct = row.metrics.views != null ? percentileRank(row.metrics.views, views) : null;
		const engPct = row.engagementRate != null ? percentileRank(row.engagementRate, rates) : null;
		const score = compositeScore(viewsPct, engPct);
		const verdict = classifyVerdict({
			score,
			views: row.metrics.views,
			viewsPercentile: viewsPct,
			policy
		});
		await patchScores(row.id, {
			score,
			viewsPercentile: viewsPct,
			engagementPercentile: engPct,
			verdict,
			stamp
		});
	}
	const assetIds = [...new Set(peers.map((row) => row.mediaAssetId).filter((id) => Boolean(id)))];
	for (const assetId of assetIds) await rebuildAssetRollup(assetId);
}
async function patchScores(id, values) {
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("post_performance").update({
			score: values.score,
			views_percentile: values.viewsPercentile,
			engagement_percentile: values.engagementPercentile,
			verdict: values.verdict,
			updated_at: values.stamp
		}).eq("id", id);
		if (!error) return;
		if (!isMissingTable(error)) return;
	}
	try {
		await (await localSql()).query(`update post_performance
       set score = $2, views_percentile = $3, engagement_percentile = $4, verdict = $5, updated_at = $6
       where id = $1`, [
			id,
			values.score,
			values.viewsPercentile,
			values.engagementPercentile,
			values.verdict,
			values.stamp
		]);
	} catch {}
}
async function rebuildAssetRollup(assetId) {
	await ensurePerformanceSchema();
	const rows = await listPostPerformance({
		mediaAssetId: assetId,
		limit: 200
	});
	const latest = /* @__PURE__ */ new Map();
	for (const row of rows.sort((a, b) => a.capturedAt < b.capturedAt ? 1 : -1)) if (!latest.has(row.externalPostId)) latest.set(row.externalPostId, row);
	const samples = [...latest.values()];
	if (!samples.length) return null;
	let viewsWeighted = 0;
	let scoreWeighted = 0;
	let viewsKnown = 0;
	let rateSum = 0;
	let rateN = 0;
	let winnerCount = 0;
	let best = null;
	for (const row of samples) {
		const views = row.metrics.views;
		if (views != null) {
			viewsKnown += views;
			if (row.score != null) {
				viewsWeighted += views;
				scoreWeighted += row.score * views;
			}
		} else if (row.score != null && best == null) best = row;
		if (row.engagementRate != null) {
			rateSum += row.engagementRate;
			rateN += 1;
		}
		if (row.verdict === "WINNER") winnerCount += 1;
		if (!best || (row.score ?? -1) > (best.score ?? -1)) best = row;
	}
	const score = viewsWeighted > 0 ? Math.round(scoreWeighted / viewsWeighted) : best?.score ?? null;
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
		updated_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("asset_performance_rollups").upsert(payload, { onConflict: "asset_id" });
		if (error && !isMissingTable(error)) {} else if (!error) return mapRollup(payload);
	}
	try {
		await (await localSql()).query(`insert into asset_performance_rollups
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
         updated_at = excluded.updated_at`, [
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
			payload.updated_at
		]);
	} catch {}
	return mapRollup(payload);
}
async function listWinners(input) {
	const rows = await listPostPerformance({
		clientId: input?.clientId,
		platform: input?.platform,
		winnersOnly: true,
		limit: input?.limit ?? 50
	});
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const row of rows) {
		if (seen.has(row.externalPostId)) continue;
		seen.add(row.externalPostId);
		out.push(row);
	}
	return out;
}
//#endregion
export { getAssetRollup, listAssetRollups, listPostPerformance, listWinners, readLearningPolicy, ensurePerformanceSchema as t, upsertPostPerformance, writeLearningPolicy };
