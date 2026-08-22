import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { sanitizeText } from "@/lib/sanitize";
import type { StreamClip, StreamClipStatus, StreamSource, StreamVod } from "@/lib/stream";

function nowIso() {
  return new Date().toISOString();
}
function newId() {
  return crypto.randomUUID();
}

let schemaReady: Promise<void> | null = null;

export async function ensureStreamSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    await sql.query(`
      create table if not exists stream_sources (
        id               text primary key,
        client_id        text not null,
        platform         text not null default 'TWITCH',
        broadcaster_id   text,
        login            text,
        display_name     text,
        status           text not null default 'ACTIVE',
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now(),
        created_by       text
      )
    `);
    await sql.query(`create index if not exists stream_sources_client_idx on stream_sources (client_id, platform)`);
    await sql.query(`
      create table if not exists stream_vods (
        id               text primary key,
        source_id        text not null,
        client_id        text not null,
        external_id      text not null,
        title            text not null,
        url              text,
        thumbnail_url    text,
        duration_sec     integer not null default 0,
        view_count       integer,
        published_at     timestamptz,
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now()
      )
    `);
    await sql.query(`create unique index if not exists stream_vods_external_idx on stream_vods (external_id)`);
    await sql.query(`create index if not exists stream_vods_client_idx on stream_vods (client_id, published_at desc)`);
    await sql.query(`
      create table if not exists stream_clips (
        id               text primary key,
        vod_id           text not null,
        client_id        text not null,
        external_id      text,
        url              text,
        edit_url         text,
        thumbnail_url    text,
        title            text,
        caption          text,
        notes            text,
        vod_offset_sec   integer not null default 0,
        duration_sec     integer not null default 30,
        status           text not null default 'PROCESSING',
        error            text,
        created_at       timestamptz not null default now(),
        updated_at       timestamptz not null default now(),
        created_by       text
      )
    `);
    await sql.query(`create index if not exists stream_clips_vod_idx on stream_clips (vod_id, created_at desc)`);
    await sql.query(`create index if not exists stream_clips_client_idx on stream_clips (client_id, created_at desc)`);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function mapSource(row: Record<string, unknown>): StreamSource {
  return {
    id: String(row.id ?? ""),
    clientId: String(row.client_id ?? ""),
    platform: "TWITCH",
    broadcasterId: row.broadcaster_id ? String(row.broadcaster_id) : null,
    login: row.login ? String(row.login) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    status: row.status === "DISABLED" ? "DISABLED" : "ACTIVE",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapVod(row: Record<string, unknown>): StreamVod {
  return {
    id: String(row.id ?? ""),
    sourceId: String(row.source_id ?? ""),
    clientId: String(row.client_id ?? ""),
    externalId: String(row.external_id ?? ""),
    title: String(row.title ?? ""),
    url: row.url ? String(row.url) : null,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
    durationSec: Number(row.duration_sec ?? 0) || 0,
    viewCount: row.view_count != null ? Number(row.view_count) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at ?? ""),
  };
}

function mapClip(row: Record<string, unknown>): StreamClip {
  const status = String(row.status ?? "PROCESSING");
  return {
    id: String(row.id ?? ""),
    vodId: String(row.vod_id ?? ""),
    clientId: String(row.client_id ?? ""),
    externalId: row.external_id ? String(row.external_id) : null,
    url: row.url ? String(row.url) : null,
    editUrl: row.edit_url ? String(row.edit_url) : null,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
    title: row.title ? String(row.title) : null,
    caption: row.caption ? String(row.caption) : null,
    notes: row.notes ? String(row.notes) : null,
    vodOffsetSec: Number(row.vod_offset_sec ?? 0) || 0,
    durationSec: Number(row.duration_sec ?? 30) || 30,
    status: status === "READY" || status === "FAILED" ? (status as StreamClipStatus) : "PROCESSING",
    error: row.error ? String(row.error) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function readStreamSources(clientId?: string): Promise<StreamSource[]> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    let query = admin.from("stream_sources").select("*").eq("status", "ACTIVE");
    if (clientId) query = query.eq("client_id", clientId);
    const { data, error } = await query.order("updated_at", { ascending: false });
    if (!error) return (data ?? []).map((row) => mapSource(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = clientId
      ? await sql.query<Record<string, unknown>>(
          "select * from stream_sources where status = 'ACTIVE' and client_id = $1 order by updated_at desc",
          [clientId],
        )
      : await sql.query<Record<string, unknown>>(
          "select * from stream_sources where status = 'ACTIVE' order by updated_at desc",
        );
    return rows.map(mapSource);
  } catch {
    return [];
  }
}

export async function upsertTwitchSource(input: {
  clientId: string;
  login: string;
  broadcasterId: string;
  displayName: string;
  createdBy?: string | null;
}): Promise<StreamSource> {
  await ensureStreamSchema();
  const existing = (await readStreamSources(input.clientId)).find((row) => row.platform === "TWITCH");
  const stamp = nowIso();
  if (existing) {
    const patch = {
      login: input.login.toLowerCase(),
      broadcaster_id: input.broadcasterId,
      display_name: input.displayName,
      updated_at: stamp,
    };
    const admin = await getAgencyAdmin();
    if (admin) await admin.from("stream_sources").update(patch).eq("id", existing.id);
    try {
      const sql = await localSql();
      await sql.query(
        `update stream_sources set login = $2, broadcaster_id = $3, display_name = $4, updated_at = $5 where id = $1`,
        [existing.id, patch.login, patch.broadcaster_id, patch.display_name, stamp],
      );
    } catch {
      /* dual-write */
    }
    return { ...existing, login: patch.login, broadcasterId: input.broadcasterId, displayName: input.displayName, updatedAt: stamp };
  }
  const row = {
    id: newId(),
    client_id: input.clientId,
    platform: "TWITCH",
    broadcaster_id: input.broadcasterId,
    login: input.login.toLowerCase(),
    display_name: input.displayName,
    status: "ACTIVE",
    created_at: stamp,
    updated_at: stamp,
    created_by: input.createdBy ?? null,
  };
  const admin = await getAgencyAdmin();
  if (admin) await admin.from("stream_sources").insert(row);
  const sql = await localSql();
  await sql.query(
    `insert into stream_sources (id, client_id, platform, broadcaster_id, login, display_name, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [row.id, row.client_id, row.platform, row.broadcaster_id, row.login, row.display_name, row.status, row.created_at, row.updated_at, row.created_by],
  );
  return mapSource(row);
}

export async function upsertStreamVod(input: {
  sourceId: string;
  clientId: string;
  externalId: string;
  title: string;
  url: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number | null;
  publishedAt: string | null;
}): Promise<StreamVod> {
  await ensureStreamSchema();
  const stamp = nowIso();
  const existing = await getVodByExternal(input.externalId);
  if (existing) {
    const patch = {
      title: sanitizeText(input.title).slice(0, 200),
      url: input.url,
      thumbnail_url: input.thumbnailUrl,
      duration_sec: input.durationSec,
      view_count: input.viewCount,
      published_at: input.publishedAt,
      updated_at: stamp,
    };
    const admin = await getAgencyAdmin();
    if (admin) await admin.from("stream_vods").update(patch).eq("id", existing.id);
    try {
      const sql = await localSql();
      await sql.query(
        `update stream_vods set title=$2, url=$3, thumbnail_url=$4, duration_sec=$5, view_count=$6, published_at=$7, updated_at=$8 where id=$1`,
        [existing.id, patch.title, patch.url, patch.thumbnail_url, patch.duration_sec, patch.view_count, patch.published_at, stamp],
      );
    } catch {
      /* dual-write */
    }
    return { ...existing, title: patch.title, url: input.url, thumbnailUrl: input.thumbnailUrl, durationSec: input.durationSec, viewCount: input.viewCount, publishedAt: input.publishedAt };
  }
  const row = {
    id: newId(),
    source_id: input.sourceId,
    client_id: input.clientId,
    external_id: input.externalId,
    title: sanitizeText(input.title).slice(0, 200) || "Untitled VOD",
    url: input.url,
    thumbnail_url: input.thumbnailUrl,
    duration_sec: input.durationSec,
    view_count: input.viewCount,
    published_at: input.publishedAt,
    created_at: stamp,
    updated_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) await admin.from("stream_vods").insert(row);
  const sql = await localSql();
  await sql.query(
    `insert into stream_vods (id, source_id, client_id, external_id, title, url, thumbnail_url, duration_sec, view_count, published_at, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [row.id, row.source_id, row.client_id, row.external_id, row.title, row.url, row.thumbnail_url, row.duration_sec, row.view_count, row.published_at, row.created_at, row.updated_at],
  );
  return mapVod(row);
}

export async function getVodByExternal(externalId: string): Promise<StreamVod | null> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("stream_vods").select("*").eq("external_id", externalId).maybeSingle();
    if (!error && data) return mapVod(data as Record<string, unknown>);
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from stream_vods where external_id = $1", [externalId]);
    return rows[0] ? mapVod(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getVodById(id: string): Promise<StreamVod | null> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("stream_vods").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapVod(data as Record<string, unknown>);
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from stream_vods where id = $1 or external_id = $1", [id]);
    return rows[0] ? mapVod(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listVodsForClient(clientId: string): Promise<StreamVod[]> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("stream_vods")
      .select("*")
      .eq("client_id", clientId)
      .order("published_at", { ascending: false })
      .limit(40);
    if (!error) return (data ?? []).map((row) => mapVod(row as Record<string, unknown>));
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from stream_vods where client_id = $1 order by published_at desc nulls last limit 40",
      [clientId],
    );
    return rows.map(mapVod);
  } catch {
    return [];
  }
}

export async function insertStreamClip(input: {
  vodId: string;
  clientId: string;
  vodOffsetSec: number;
  durationSec: number;
  title: string | null;
  createdBy?: string | null;
}): Promise<StreamClip> {
  await ensureStreamSchema();
  const stamp = nowIso();
  const row = {
    id: newId(),
    vod_id: input.vodId,
    client_id: input.clientId,
    external_id: null as string | null,
    url: null as string | null,
    edit_url: null as string | null,
    thumbnail_url: null as string | null,
    title: input.title,
    caption: null as string | null,
    notes: null as string | null,
    vod_offset_sec: input.vodOffsetSec,
    duration_sec: input.durationSec,
    status: "PROCESSING",
    error: null as string | null,
    created_at: stamp,
    updated_at: stamp,
    created_by: input.createdBy ?? null,
  };
  const admin = await getAgencyAdmin();
  if (admin) await admin.from("stream_clips").insert(row);
  const sql = await localSql();
  await sql.query(
    `insert into stream_clips (id, vod_id, client_id, external_id, url, edit_url, thumbnail_url, title, caption, notes, vod_offset_sec, duration_sec, status, error, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [row.id, row.vod_id, row.client_id, row.external_id, row.url, row.edit_url, row.thumbnail_url, row.title, row.caption, row.notes, row.vod_offset_sec, row.duration_sec, row.status, row.error, row.created_at, row.updated_at, row.created_by],
  );
  return mapClip(row);
}

export async function patchStreamClip(
  id: string,
  patch: Partial<{
    externalId: string | null;
    url: string | null;
    editUrl: string | null;
    thumbnailUrl: string | null;
    title: string | null;
    caption: string | null;
    notes: string | null;
    status: StreamClipStatus;
    error: string | null;
  }>,
): Promise<void> {
  await ensureStreamSchema();
  const stamp = nowIso();
  const cols: Record<string, unknown> = { updated_at: stamp };
  if (patch.externalId !== undefined) cols.external_id = patch.externalId;
  if (patch.url !== undefined) cols.url = patch.url;
  if (patch.editUrl !== undefined) cols.edit_url = patch.editUrl;
  if (patch.thumbnailUrl !== undefined) cols.thumbnail_url = patch.thumbnailUrl;
  if (patch.title !== undefined) cols.title = patch.title;
  if (patch.caption !== undefined) cols.caption = patch.caption;
  if (patch.notes !== undefined) cols.notes = patch.notes;
  if (patch.status !== undefined) cols.status = patch.status;
  if (patch.error !== undefined) cols.error = patch.error;
  const admin = await getAgencyAdmin();
  if (admin) await admin.from("stream_clips").update(cols).eq("id", id);
  try {
    const sql = await localSql();
    const sets: string[] = ["updated_at = $2"];
    const params: unknown[] = [id, stamp];
    let i = 3;
    for (const [key, value] of Object.entries(cols)) {
      if (key === "updated_at") continue;
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }
    await sql.query(`update stream_clips set ${sets.join(", ")} where id = $1`, params);
  } catch {
    /* dual-write */
  }
}

export async function listClipsForVod(vodId: string): Promise<StreamClip[]> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("stream_clips")
      .select("*")
      .eq("vod_id", vodId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (!error) return (data ?? []).map((row) => mapClip(row as Record<string, unknown>));
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from stream_clips where vod_id = $1 order by created_at desc limit 80",
      [vodId],
    );
    return rows.map(mapClip);
  } catch {
    return [];
  }
}

export async function listClipsForClient(clientId: string): Promise<StreamClip[]> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("stream_clips")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (!error) return (data ?? []).map((row) => mapClip(row as Record<string, unknown>));
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from stream_clips where client_id = $1 order by created_at desc limit 40",
      [clientId],
    );
    return rows.map(mapClip);
  } catch {
    return [];
  }
}

export async function getClipById(id: string): Promise<StreamClip | null> {
  await ensureStreamSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("stream_clips").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapClip(data as Record<string, unknown>);
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from stream_clips where id = $1", [id]);
    return rows[0] ? mapClip(rows[0]) : null;
  } catch {
    return null;
  }
}
