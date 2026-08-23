import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole } from "@/lib/server/access";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type SocialPost,
  type SocialPostSource,
  type SocialPostStatus,
} from "@/lib/entities";
import { isMissingColumn, isMissingTable, mapSocialPost } from "@/lib/server/mappers";

import { readClients, readProgress } from "@/lib/server/clients";

import type {
  PlatformSessionState,
  SocialAsset,
  SocialJob,
  SocialJobStatus,
  SocialJobView,
  SocialSnapshot,
  SocialUploadMode,
} from "@/lib/social";
import {
  attachJobProgress,
  parseYoutubeJobOptions,
  type YoutubeJobOptions,
} from "@/lib/social";
import type { SocialPreferredRail } from "@/lib/publishers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}
async function load_app_settings() {
  return import("@/lib/server/app-settings.server");
}
async function load_daytona() {
  return import("@/lib/server/daytona.server");
}

const SESSION_KEY = "SOCIAL_PLATFORM_SESSIONS";
const AUDIT_KEY = "SOCIAL_AUDIT";

const runningLock = { busy: false };
let schemaReady: Promise<void> | null = null;

async function ensureSocialSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await (await load_agency_db()).localSql();
    await sql.query(`
      create table if not exists social_posts (
        id               text primary key,
        client_id        text not null,
        platform         text not null,
        status           text not null,
        content_ref      text,
        media_url        text,
        caption          text,
        external_url     text,
        screenshot_url   text,
        source           text not null default 'DAYTONA',
        attention_reason text,
        job_id           text,
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now(),
        created_by       text
      )
    `);
    await sql.query(`alter table social_posts add column if not exists job_id text`);
    await sql.query(`alter table social_posts add column if not exists rail text`);
    await sql.query(`alter table social_posts add column if not exists external_post_id text`);
    await sql.query(`alter table social_posts add column if not exists tiktok_post_mode text`);
    await sql.query(`alter table social_posts add column if not exists ig_container_id text`);
    await sql.query(`alter table social_posts add column if not exists upload_percent integer`);
    await sql.query(`alter table social_posts add column if not exists upload_phase text`);
    await sql.query(`alter table social_posts add column if not exists resumable_session_id text`);
    await sql.query(`
      create table if not exists social_upload_sessions (
        id                   text primary key,
        job_id               text,
        post_id              text,
        platform             text not null,
        source_url           text not null,
        total_bytes          integer not null default 0,
        chunk_size_bytes     integer not null default 0,
        mime_type            text,
        external_session_id  text,
        external_upload_url  text,
        next_segment_index   integer not null default 0,
        bytes_uploaded       integer not null default 0,
        status               text not null,
        last_error           text,
        attempt_count        integer not null default 0,
        platform_extras      text,
        created_at           timestamptz not null default now(),
        updated_at           timestamptz not null default now()
      )
    `);
    await sql.query(`
      create table if not exists social_jobs (
        id               text primary key,
        client_id        text not null,
        asset_id         text,
        caption          text,
        mode             text not null default 'draft',
        status           text not null,
        platforms        text not null,
        idempotency_key  text,
        error_code       text,
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now(),
        created_by       text
      )
    `);
    await sql.query(`alter table social_jobs add column if not exists preferred_rail text`);
    await sql.query(`alter table social_jobs add column if not exists fallback_to_browser text`);
    await sql.query(`alter table social_jobs add column if not exists media_asset_id text`);
    await sql.query(`alter table social_jobs add column if not exists options text`);
    await sql.query(`alter table social_jobs add column if not exists triggered_by_team_member_id text`);
    try {
      await sql.query(`alter table social_posts drop constraint if exists social_posts_platform_check`);
      await sql.query(
        `alter table social_posts add constraint social_posts_platform_check check (platform in ('instagram', 'x', 'tiktok', 'youtube'))`,
      );
    } catch {
      /* PGLite / already applied */
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

const emptySessions = (): Record<SocialPlatform, PlatformSessionState> => ({
  instagram: "unknown",
  x: "unknown",
  tiktok: "unknown",
  youtube: "unknown",
});

async function readSessions(): Promise<Record<SocialPlatform, PlatformSessionState>> {
  const raw = await (await load_app_settings()).readAppSetting(SESSION_KEY);
  const base = emptySessions();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const platform of SOCIAL_PLATFORMS) {
      const value = parsed[platform];
      if (value === "logged_in" || value === "not_logged_in" || value === "unknown") {
        base[platform] = value;
      }
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

async function writeSessions(
  sessions: Record<SocialPlatform, PlatformSessionState>,
): Promise<void> {
  await (await load_app_settings()).writeAppSetting(SESSION_KEY, JSON.stringify(sessions));
}

async function appendAudit(entry: {
  actorId: string;
  action: string;
  detail: string;
}): Promise<void> {
  const raw = await (await load_app_settings()).readAppSetting(AUDIT_KEY);
  let list: Array<{ at: string; actorId: string; action: string; detail: string }> = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) list = parsed as typeof list;
    } catch {
      list = [];
    }
  }
  list.unshift({
    at: nowIso(),
    actorId: entry.actorId.slice(0, 80),
    action: entry.action.slice(0, 80),
    detail: entry.detail.slice(0, 240),
  });
  await (await load_app_settings()).writeAppSetting(AUDIT_KEY, JSON.stringify(list.slice(0, 50)));
}

export async function readSocialPosts(): Promise<SocialPost[]> {
  try {
    await ensureSocialSchema();
  } catch {
    /* still try reads */
  }
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    if (!error) {
      return (data ?? []).map((row) => mapSocialPost(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from social_posts order by created_at desc limit 80",
    );
    return rows.map(mapSocialPost);
  } catch {
    return [];
  }
}

async function insertSocialPost(row: {
  id: string;
  client_id: string;
  platform: SocialPlatform;
  status: SocialPostStatus;
  content_ref: string | null;
  media_url: string | null;
  caption: string | null;
  external_url: string | null;
  screenshot_url: string | null;
  source: SocialPostSource;
  attention_reason: string | null;
  job_id: string | null;
  rail: "API" | "BROWSER";
  external_post_id: string | null;
  tiktok_post_mode?: string | null;
  ig_container_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<SocialPost> {
  try {
    await ensureSocialSchema();
  } catch {
    /* continue */
  }
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("social_posts").insert(row);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) return mapSocialPost(row);
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into social_posts (
        id, client_id, platform, status, content_ref, media_url, caption,
        external_url, screenshot_url, source, attention_reason, job_id,
        rail, external_post_id, tiktok_post_mode, ig_container_id, created_at, updated_at, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [
      row.id,
      row.client_id,
      row.platform,
      row.status,
      row.content_ref,
      row.media_url,
      row.caption,
      row.external_url,
      row.screenshot_url,
      row.source,
      row.attention_reason,
      row.job_id,
      row.rail,
      row.external_post_id,
      row.tiktok_post_mode ?? null,
      row.ig_container_id ?? null,
      row.created_at,
      row.updated_at,
      row.created_by,
    ],
  );
  return mapSocialPost(row);
}

async function patchSocialPost(
  id: string,
  patch: Partial<{
    status: SocialPostStatus;
    screenshot_url: string | null;
    attention_reason: string | null;
    external_url: string | null;
    rail: "API" | "BROWSER";
    source: SocialPostSource;
    external_post_id: string | null;
    tiktok_post_mode: string | null;
    ig_container_id: string | null;
    upload_percent: number | null;
    upload_phase: string | null;
    resumable_session_id: string | null;
  }>,
): Promise<SocialPost | null> {
  const stamp = nowIso();
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin
      .from("social_posts")
      .update({ ...patch, updated_at: stamp })
      .eq("id", id);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const sets: string[] = ["updated_at = $2"];
    const params: unknown[] = [id, stamp];
    let i = 3;
    if (patch.status !== undefined) {
      sets.push(`status = $${i++}`);
      params.push(patch.status);
    }
    if (patch.screenshot_url !== undefined) {
      sets.push(`screenshot_url = $${i++}`);
      params.push(patch.screenshot_url);
    }
    if (patch.attention_reason !== undefined) {
      sets.push(`attention_reason = $${i++}`);
      params.push(patch.attention_reason);
    }
    if (patch.external_url !== undefined) {
      sets.push(`external_url = $${i++}`);
      params.push(patch.external_url);
    }
    if (patch.rail !== undefined) {
      sets.push(`rail = $${i++}`);
      params.push(patch.rail);
    }
    if (patch.source !== undefined) {
      sets.push(`source = $${i++}`);
      params.push(patch.source);
    }
    if (patch.external_post_id !== undefined) {
      sets.push(`external_post_id = $${i++}`);
      params.push(patch.external_post_id);
    }
    if (patch.tiktok_post_mode !== undefined) {
      sets.push(`tiktok_post_mode = $${i++}`);
      params.push(patch.tiktok_post_mode);
    }
    if (patch.ig_container_id !== undefined) {
      sets.push(`ig_container_id = $${i++}`);
      params.push(patch.ig_container_id);
    }
    if (patch.upload_percent !== undefined) {
      sets.push(`upload_percent = $${i++}`);
      params.push(patch.upload_percent);
    }
    if (patch.upload_phase !== undefined) {
      sets.push(`upload_phase = $${i++}`);
      params.push(patch.upload_phase);
    }
    if (patch.resumable_session_id !== undefined) {
      sets.push(`resumable_session_id = $${i++}`);
      params.push(patch.resumable_session_id);
    }
    await sql.query(`update social_posts set ${sets.join(", ")} where id = $1`, params);
  } catch {
    /* local store may be unavailable */
  }
  const posts = await readSocialPosts();
  return posts.find((row) => row.id === id) ?? null;
}

function parsePlatforms(raw: unknown): SocialPlatform[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is SocialPlatform =>
      SOCIAL_PLATFORMS.includes(item as SocialPlatform),
    );
  }
  if (typeof raw === "string") {
    try {
      return parsePlatforms(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

function mapSocialJob(row: Record<string, unknown>): SocialJob {
  const mode = row.mode === "publish" ? "publish" : "draft";
  const status = (
    ["queued", "running", "needs_attention", "succeeded", "failed", "cancelled", "awaiting_approval"] as const
  ).includes(row.status as SocialJobStatus)
    ? (row.status as SocialJobStatus)
    : "queued";
  return {
    id: String(row.id ?? ""),
    clientId: String(row.client_id ?? ""),
    assetId: row.asset_id == null ? null : String(row.asset_id),
    caption: row.caption == null ? null : String(row.caption),
    mode,
    status,
    platforms: parsePlatforms(row.platforms),
    idempotencyKey: row.idempotency_key == null ? null : String(row.idempotency_key),
    errorCode: row.error_code == null ? null : String(row.error_code),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdBy: row.created_by == null ? null : String(row.created_by),
    triggeredByTeamMemberId: row.triggered_by_team_member_id
      ? String(row.triggered_by_team_member_id)
      : null,
    preferredRail:
      row.preferred_rail === "API" || row.preferred_rail === "BROWSER" || row.preferred_rail === "GROK_BOT"
        ? row.preferred_rail
        : "AUTO",
    fallbackToBrowser: row.fallback_to_browser !== "0" && row.fallback_to_browser !== "false",
    youtube: parseYoutubeJobOptions(
      typeof row.options === "string"
        ? (() => {
            try {
              return JSON.parse(row.options);
            } catch {
              return null;
            }
          })()
        : row.options,
    ),
  };
}

export async function readSocialJobs(): Promise<SocialJob[]> {
  try {
    await ensureSocialSchema();
  } catch {
    /* still try */
  }
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("social_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    if (!error) {
      return (data ?? []).map((row) => mapSocialJob(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from social_jobs order by created_at desc limit 80",
    );
    return rows.map(mapSocialJob);
  } catch {
    return [];
  }
}

async function insertSocialJob(row: {
  id: string;
  client_id: string;
  asset_id: string | null;
  media_asset_id?: string | null;
  caption: string | null;
  mode: SocialUploadMode;
  status: SocialJobStatus;
  platforms: string;
  idempotency_key: string | null;
  error_code: string | null;
  preferred_rail: SocialPreferredRail;
  fallback_to_browser: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  options?: string | null;
}): Promise<SocialJob> {
  try {
    await ensureSocialSchema();
  } catch {
    /* continue */
  }
  const payload = {
    ...row,
    media_asset_id: row.media_asset_id ?? null,
    options: row.options ?? null,
  };
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("social_jobs").insert(payload);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) return mapSocialJob(payload);
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into social_jobs (
        id, client_id, asset_id, media_asset_id, caption, mode, status, platforms,
        idempotency_key, error_code, preferred_rail, fallback_to_browser, options,
        created_at, updated_at, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      payload.id,
      payload.client_id,
      payload.asset_id,
      payload.media_asset_id,
      payload.caption,
      payload.mode,
      payload.status,
      payload.platforms,
      payload.idempotency_key,
      payload.error_code,
      payload.preferred_rail,
      payload.fallback_to_browser,
      payload.options,
      payload.created_at,
      payload.updated_at,
      payload.created_by,
    ],
  );
  return mapSocialJob(payload);
}

async function patchSocialJob(
  id: string,
  patch: Partial<{
    status: SocialJobStatus;
    error_code: string | null;
  }>,
): Promise<SocialJob | null> {
  const stamp = nowIso();
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin
      .from("social_jobs")
      .update({ ...patch, updated_at: stamp })
      .eq("id", id);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const sets: string[] = ["updated_at = $2"];
    const params: unknown[] = [id, stamp];
    let i = 3;
    if (patch.status !== undefined) {
      sets.push(`status = $${i++}`);
      params.push(patch.status);
    }
    if (patch.error_code !== undefined) {
      sets.push(`error_code = $${i++}`);
      params.push(patch.error_code);
    }
    await sql.query(`update social_jobs set ${sets.join(", ")} where id = $1`, params);
  } catch {
    /* local store may be unavailable */
  }
  const jobs = await readSocialJobs();
  return jobs.find((row) => row.id === id) ?? null;
}

export function attachPostsToJobs(jobs: SocialJob[], posts: SocialPost[]): SocialJobView[] {
  return jobs.map((job) => {
    const jobPosts = posts.filter((post) => post.jobId === job.id);
    return {
      ...job,
      posts: jobPosts,
      ...attachJobProgress(jobPosts),
    };
  });
}

export async function peekSocialHealth(): Promise<{
  state: string;
  configured: boolean;
  needsLogin: number;
  failedJobs: number;
  needsAttention: number;
}> {
  const [key, startedAt, sessions, posts] = await Promise.all([
    (await load_app_settings()).readAppSetting("DAYTONA_API_KEY"),
    (await load_app_settings()).readAppSetting("DAYTONA_SOCIAL_STARTED_AT"),
    readSessions(),
    readSocialPosts(),
  ]);
  const configured = Boolean(key?.trim());
  return {
    state: !configured ? "not_configured" : startedAt ? "running" : "stopped",
    configured,
    needsLogin: SOCIAL_PLATFORMS.filter((platform) => sessions[platform] === "not_logged_in").length,
    failedJobs: posts.filter((post) => post.status === "failed").length,
    needsAttention: posts.filter((post) => post.status === "needs_attention").length,
  };
}

async function collectAssets(): Promise<SocialAsset[]> {
  const [clients, progress] = await Promise.all([readClients(), readProgress()]);
  const assets: SocialAsset[] = [];
  try {
    const { listAssets } = await import("@/lib/server/library.server");
    const library = await listAssets({ status: "READY" }, 40);
    for (const row of library) {
      if (!row.clientId || row.status !== "READY") continue;
      assets.push({
        id: row.id,
        clientId: row.clientId,
        kind: "library",
        label: row.title,
        mediaUrl: row.previewUrl,
        caption: null,
      });
    }
  } catch {
    /* library optional */
  }
  const latestStage = new Map<string, (typeof progress)[number]>();
  for (const row of progress) {
    if (!latestStage.has(row.clientId)) latestStage.set(row.clientId, row);
  }

  const thumbnails = await readThumbnailAssets();

  for (const client of clients) {
    if (client.deletedAt || client.status !== "ACTIVE") continue;
    const thumbs = thumbnails.filter((row) => row.clientId === client.id);
    for (const thumb of thumbs.slice(0, 3)) assets.push(thumb);

    const stage = latestStage.get(client.id);
    if (stage?.stage === "PUBLISHED") {
      assets.push({
        id: `published:${client.id}:${stage.id}`,
        clientId: client.id,
        kind: "published",
        label: `Published · ${client.name}`,
        mediaUrl: client.channelThumbnail,
        caption: client.suggestedTitles?.groups[0]?.alternatives[0] ?? client.name,
      });
    }

    const idea = client.suggestedIdeas?.ideas[0];
    if (idea) {
      assets.push({
        id: `idea:${client.id}`,
        clientId: client.id,
        kind: "title",
        label: idea.title,
        mediaUrl: client.channelThumbnail,
        caption: `${idea.title}\n${idea.rationale}`.slice(0, 400),
      });
    }

    if (client.channelThumbnail) {
      assets.push({
        id: `channel:${client.id}`,
        clientId: client.id,
        kind: "channel",
        label: `Channel art · ${client.name}`,
        mediaUrl: client.channelThumbnail,
        caption: client.name,
      });
    }
  }

  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = `${asset.clientId}:${asset.mediaUrl ?? ""}:${asset.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readThumbnailAssets(): Promise<SocialAsset[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("thumbnail_messages")
      .select("id,image_url,content,created_at,session_id")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);
    if (!error && data) {
      const sessions = await admin.from("thumbnail_sessions").select("id,client_id,title");
      const bySession = new Map<string, { clientId: string; title: string }>();
      for (const row of sessions.data ?? []) {
        const rec = row as { id?: string; client_id?: string; title?: string };
        if (rec.id && rec.client_id) {
          bySession.set(rec.id, { clientId: rec.client_id, title: rec.title ?? "Thumbnail" });
        }
      }
      return (data as Array<Record<string, unknown>>)
        .map((row): SocialAsset | null => {
          const session = bySession.get(String(row.session_id ?? ""));
          if (!session || !row.image_url) return null;
          return {
            id: `thumb:${String(row.id)}`,
            clientId: session.clientId,
            kind: "thumbnail",
            label: session.title || "Thumbnail",
            mediaUrl: String(row.image_url),
            caption: typeof row.content === "string" ? row.content.slice(0, 400) : session.title,
          };
        })
        .filter((row): row is SocialAsset => Boolean(row));
    }
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select tm.id, tm.image_url, tm.content, ts.client_id, ts.title
       from thumbnail_messages tm
       join thumbnail_sessions ts on ts.id = tm.session_id
       where tm.image_url is not null
       order by tm.created_at desc
       limit 40`,
    );
    return rows.map((row) => ({
      id: `thumb:${String(row.id)}`,
      clientId: String(row.client_id),
      kind: "thumbnail" as const,
      label: String(row.title ?? "Thumbnail"),
      mediaUrl: String(row.image_url),
      caption: typeof row.content === "string" ? row.content.slice(0, 400) : String(row.title ?? ""),
    }));
  } catch {
    return [];
  }
}

async function buildSnapshot(userId: string): Promise<SocialSnapshot> {
  const [machine, sessions, posts, jobs, assets, clients, role, publishers, performance] = await Promise.all([
    (await load_daytona()).getSocialMachineStatus(),
    readSessions(),
    readSocialPosts(),
    readSocialJobs(),
    collectAssets(),
    readClients(),
    getUserRole(userId),
    import("@/lib/server/social-publish.server").then((mod) => mod.listPublisherStatuses()),
    import("@/lib/server/performance.server")
      .then((mod) => mod.listPostPerformance({ limit: 120 }))
      .catch(() => [] as import("@/lib/performance").PostPerformance[]),
  ]);
  return {
    machine,
    sessions,
    posts,
    jobs: attachPostsToJobs(jobs, posts),
    assets,
    clients: clients
      .filter((row) => !row.deletedAt && row.status === "ACTIVE")
      .map((row) => ({ id: row.id, name: row.name })),
    role,
    publishers,
    performance,
  };
}

export const getSocialSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SocialSnapshot> => {
    return buildSnapshot(context.userId);
  });

export const startSocialDesktop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const machine = await (await load_daytona()).startSocialMachine();
    await appendAudit({
      actorId: context.userId,
      action: "start_social_machine",
      detail: machine.sandboxId ?? "started",
    });
    return buildSnapshot(context.userId);
  });

export const provisionLocationProxyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ country: z.string().min(2).max(4).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const role = await getUserRole(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const result = await (await load_daytona()).provisionLocationProxy(data.country);
    await appendAudit({
      actorId: context.userId,
      action: "provision_location_proxy",
      detail: result.country,
    });
    return result;
  });

export const stopSocialDesktop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await (await load_daytona()).stopSocialMachine();
    await appendAudit({
      actorId: context.userId,
      action: "stop_social_machine",
      detail: "stopped",
    });
    return buildSnapshot(context.userId);
  });

export const refreshSocialDesktop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await (await load_daytona()).refreshDesktopPreview();
    return buildSnapshot(context.userId);
  });

const PlatformSchema = z.enum(SOCIAL_PLATFORMS);

export const openSocialPlatform = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ platform: PlatformSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await (await load_daytona()).openPlatformInMachine(data.platform);
    await appendAudit({
      actorId: context.userId,
      action: "open_platform",
      detail: data.platform,
    });
    return { ok: true as const };
  });

export const markPlatformSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        platform: PlatformSchema,
        state: z.enum(["not_logged_in", "logged_in", "unknown"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const sessions = await readSessions();
    sessions[data.platform] = data.state;
    await writeSessions(sessions);
    await appendAudit({
      actorId: context.userId,
      action: "mark_session",
      detail: `${data.platform}:${data.state}`,
    });
    return buildSnapshot(context.userId);
  });

const UploadSchema = z.object({
  clientId: z.string().min(1),
  assetId: z.string().min(1).optional(),
  mediaAssetId: z.string().min(1).optional(),
  platforms: z.array(PlatformSchema).min(1).max(4),
  caption: z.string().max(2200).optional(),
  mediaUrl: z.string().max(4000).nullable().optional(),
  preferredRail: z.enum(["AUTO", "API", "BROWSER", "GROK_BOT"]).optional(),
  fallbackToBrowser: z.boolean().optional(),
  mode: z.enum(["draft", "publish"]).optional(),
  youtube: z
    .object({
      title: z.string().max(100).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string().max(30)).max(30).optional(),
      privacyStatus: z.enum(["private", "unlisted", "public"]).optional(),
      markShorts: z.boolean().optional(),
      thumbAssetId: z.string().max(80).nullable().optional(),
      categoryId: z.string().max(8).optional(),
      notifySubscribers: z.boolean().optional(),
    })
    .optional(),
});

export const queueSocialUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => UploadSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { createUploadJobInternal } = await import("@/lib/server/social-ops.server");
    await createUploadJobInternal({
      actorId: context.userId,
      clientId: data.clientId,
      assetId: data.assetId,
      mediaAssetId: data.mediaAssetId,
      platforms: data.platforms,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      allowAutoStart: false,
      requireLoggedIn: false,
      mode: data.mode ?? "draft",
      preferredRail: data.preferredRail ?? "AUTO",
      fallbackToBrowser: data.fallbackToBrowser ?? true,
      youtube: data.youtube as YoutubeJobOptions | undefined,
    });
    return buildSnapshot(context.userId);
  });

export const retrySocialUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ jobId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { socialRetryUploadJob } = await import("@/lib/server/social-ops.server");
    await socialRetryUploadJob({ actorId: context.userId, jobId: data.jobId });
    return buildSnapshot(context.userId);
  });

export const cancelSocialUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ jobId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { socialCancelUploadJob } = await import("@/lib/server/social-ops.server");
    await socialCancelUploadJob({ actorId: context.userId, jobId: data.jobId });
    return buildSnapshot(context.userId);
  });

export const updateSocialPostStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        status: z.enum(["needs_attention", "succeeded", "failed"]),
        externalUrl: z.string().max(1000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const updated = await patchSocialPost(data.id, {
      status: data.status,
      external_url: data.externalUrl ?? undefined,
      attention_reason:
        data.status === "needs_attention"
          ? "Operator marked this as still needing attention."
          : null,
    });
    if (!updated) throw new Error("POST_MISSING");
    await appendAudit({
      actorId: context.userId,
      action: "social_post_status",
      detail: `${data.id}:${data.status}`,
    });
    return buildSnapshot(context.userId);
  });

export {
  collectAssets,
  readSessions,
  writeSessions,
  insertSocialPost,
  patchSocialPost,
  insertSocialJob,
  patchSocialJob,
  runningLock,
  appendAudit,
};
export function socialNewId(): string {
  return newId();
}
export function socialNowIso(): string {
  return nowIso();
}
