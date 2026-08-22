import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingColumn, isMissingTable } from "@/lib/server/mappers";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { signVersionUrl } from "@/lib/server/library-storage.server";
import {
  ASSET_KINDS,
  ASSET_SOURCES,
  ASSET_STATUSES,
  CAPTION_ENGINES,
  CAPTION_FORMATS,
  CAPTION_STATUSES,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_RENDER_OPTIONS,
  RENDER_PRESETS,
  RENDER_STATUSES,
  RENDER_WORKERS,
  type AssetKind,
  type AssetSource,
  type AssetStatus,
  type CaptionCue,
  type CaptionEngine,
  type CaptionFormat,
  type CaptionStatus,
  type CaptionTrack,
  type LibraryAsset,
  type LibraryAssetVersion,
  type LibraryFilters,
  type MediaPipelineSettings,
  type RenderJob,
  type RenderOptions,
  type RenderPreset,
  type RenderStatus,
  type RenderWorker,
} from "@/lib/library";

function nowIso() {
  return new Date().toISOString();
}

export function libraryNewId() {
  return crypto.randomUUID();
}

let schemaReady: Promise<void> | null = null;

const SCHEMA_SQL = `
create table if not exists media_assets (
  id                  text primary key,
  workspace_id        text not null default 'default',
  client_id           text,
  kind                text not null,
  title               text not null,
  description         text,
  source              text not null,
  source_ref          text,
  status              text not null,
  duration_sec        double precision,
  width               integer,
  height              integer,
  aspect_ratio        text,
  mime_type           text,
  byte_size           integer,
  checksum            text,
  current_version_id  text,
  parent_asset_id     text,
  tags                text not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text
);
create index if not exists media_assets_client_idx on media_assets (client_id, created_at desc);
create table if not exists media_asset_versions (
  id              text primary key,
  asset_id        text not null,
  version_number  integer not null,
  storage_key     text not null,
  file_url        text,
  mime_type       text,
  byte_size       integer,
  checksum        text,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists media_asset_versions_asset_idx on media_asset_versions (asset_id, version_number desc);
create table if not exists caption_tracks (
  id           text primary key,
  asset_id     text not null,
  language     text not null default 'en',
  status       text not null,
  format       text not null default 'JSON_CUES',
  storage_key  text,
  cues         text,
  engine       text not null,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create table if not exists caption_styles (
  id          text primary key,
  client_id   text,
  name        text not null,
  font        text,
  size        integer,
  position    text,
  outline     text,
  created_at  timestamptz not null default now()
);
create table if not exists render_jobs (
  id                 text primary key,
  workspace_id       text not null default 'default',
  client_id          text,
  source_asset_id    text not null,
  source_version_id  text,
  caption_track_id   text,
  preset             text not null,
  options            text not null default '{}',
  status             text not null,
  progress_percent   integer not null default 0,
  output_asset_id    text,
  error              text,
  attempts           integer not null default 0,
  worker             text not null default 'BASE44_FN',
  created_at         timestamptz not null default now(),
  started_at         timestamptz,
  finished_at        timestamptz,
  created_by         text
);
create index if not exists render_jobs_status_idx on render_jobs (status, created_at desc);
alter table social_jobs add column if not exists media_asset_id text;
`;

export async function ensureLibrarySchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
      await sql.query(stmt);
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function asNullable(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 24);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 24);
  } catch {
    return value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 24);
  }
  return [];
}

function parseCues(value: unknown): CaptionCue[] {
  if (Array.isArray(value)) {
    return value
      .map((row) => {
        const rec = row as Record<string, unknown>;
        const startMs = Number(rec.startMs ?? rec.start_ms ?? 0);
        const endMs = Number(rec.endMs ?? rec.end_ms ?? 0);
        const text = String(rec.text ?? "").trim();
        if (!text || !Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
        return { startMs, endMs, text: text.slice(0, 280) };
      })
      .filter((row): row is CaptionCue => Boolean(row));
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return parseCues(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function parseOptions(value: unknown): RenderOptions {
  let raw: Record<string, unknown> = {};
  if (typeof value === "string" && value.trim()) {
    try {
      raw = JSON.parse(value) as Record<string, unknown>;
    } catch {
      raw = {};
    }
  } else if (value && typeof value === "object") {
    raw = value as Record<string, unknown>;
  }
  const trimRaw = raw.trim && typeof raw.trim === "object" ? (raw.trim as Record<string, unknown>) : null;
  return {
    burnInCaptions: Boolean(raw.burnInCaptions),
    captionStyleId: typeof raw.captionStyleId === "string" ? raw.captionStyleId : undefined,
    targetMaxDurationSec:
      typeof raw.targetMaxDurationSec === "number" ? raw.targetMaxDurationSec : undefined,
    trim:
      trimRaw && Number.isFinite(Number(trimRaw.startMs)) && Number.isFinite(Number(trimRaw.endMs))
        ? { startMs: Number(trimRaw.startMs), endMs: Number(trimRaw.endMs) }
        : undefined,
    loudnorm: raw.loudnorm !== false,
    maxWidth: typeof raw.maxWidth === "number" ? raw.maxWidth : undefined,
    format: "mp4",
    customWidth: typeof raw.customWidth === "number" ? raw.customWidth : undefined,
    customHeight: typeof raw.customHeight === "number" ? raw.customHeight : undefined,
  };
}

async function withPreview(asset: LibraryAsset): Promise<LibraryAsset> {
  if (!asset.currentVersionId) return { ...asset, previewUrl: null };
  try {
    return { ...asset, previewUrl: await signVersionUrl(asset.currentVersionId) };
  } catch {
    return { ...asset, previewUrl: null };
  }
}

export function mapAsset(row: Record<string, unknown>): LibraryAsset {
  return {
    id: asString(row.id),
    workspaceId: asString(row.workspace_id, "default"),
    clientId: asNullable(row.client_id),
    kind: oneOf(row.kind, ASSET_KINDS, "OTHER"),
    title: asString(row.title, "Untitled"),
    description: asNullable(row.description),
    source: oneOf(row.source, ASSET_SOURCES, "UPLOAD"),
    sourceRef: asNullable(row.source_ref),
    status: oneOf(row.status, ASSET_STATUSES, "PROCESSING"),
    durationSec: asNumber(row.duration_sec),
    width: asNumber(row.width),
    height: asNumber(row.height),
    aspectRatio: asNullable(row.aspect_ratio),
    mimeType: asNullable(row.mime_type),
    byteSize: asNumber(row.byte_size),
    checksum: asNullable(row.checksum),
    currentVersionId: asNullable(row.current_version_id),
    parentAssetId: asNullable(row.parent_asset_id),
    tags: parseTags(row.tags),
    previewUrl: null,
    createdAt: asString(row.created_at, nowIso()),
    updatedAt: asString(row.updated_at, nowIso()),
    createdBy: asNullable(row.created_by),
  };
}

export function mapVersion(row: Record<string, unknown>): LibraryAssetVersion {
  return {
    id: asString(row.id),
    assetId: asString(row.asset_id),
    versionNumber: asNumber(row.version_number) ?? 1,
    mimeType: asNullable(row.mime_type),
    byteSize: asNumber(row.byte_size),
    checksum: asNullable(row.checksum),
    note: asNullable(row.note),
    previewUrl: null,
    createdAt: asString(row.created_at, nowIso()),
  };
}

export function mapCaption(row: Record<string, unknown>): CaptionTrack {
  return {
    id: asString(row.id),
    assetId: asString(row.asset_id),
    language: asString(row.language, "en"),
    status: oneOf(row.status, CAPTION_STATUSES, "PENDING"),
    format: oneOf(row.format, CAPTION_FORMATS, "JSON_CUES"),
    cues: parseCues(row.cues),
    engine: oneOf(row.engine, CAPTION_ENGINES, "MANUAL"),
    error: asNullable(row.error),
    createdAt: asString(row.created_at, nowIso()),
    updatedAt: asString(row.updated_at, nowIso()),
  };
}

export function mapRender(row: Record<string, unknown>): RenderJob {
  return {
    id: asString(row.id),
    workspaceId: asString(row.workspace_id, "default"),
    clientId: asNullable(row.client_id),
    sourceAssetId: asString(row.source_asset_id),
    sourceVersionId: asNullable(row.source_version_id),
    captionTrackId: asNullable(row.caption_track_id),
    preset: oneOf(row.preset, RENDER_PRESETS, "REELS_9x16"),
    options: parseOptions(row.options),
    status: oneOf(row.status, RENDER_STATUSES, "QUEUED"),
    progressPercent: Math.min(100, Math.max(0, asNumber(row.progress_percent) ?? 0)),
    outputAssetId: asNullable(row.output_asset_id),
    error: asNullable(row.error),
    attempts: asNumber(row.attempts) ?? 0,
    worker: oneOf(row.worker, RENDER_WORKERS, "BASE44_FN"),
    createdAt: asString(row.created_at, nowIso()),
    startedAt: asNullable(row.started_at),
    finishedAt: asNullable(row.finished_at),
    createdBy: asNullable(row.created_by),
  };
}

export async function getVersionRow(id: string): Promise<(LibraryAssetVersion & { storageKey: string }) | null> {
  await ensureLibrarySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("media_asset_versions").select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      const rec = data as Record<string, unknown>;
      return { ...mapVersion(rec), storageKey: asString(rec.storage_key) };
    }
    if (error && !isMissingTable(error)) return null;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from media_asset_versions where id = $1 limit 1",
      [id],
    );
    const rec = rows[0];
    if (!rec) return null;
    return { ...mapVersion(rec), storageKey: asString(rec.storage_key) };
  } catch {
    return null;
  }
}

export async function insertAsset(row: {
  id: string;
  workspace_id?: string;
  client_id: string | null;
  kind: AssetKind;
  title: string;
  description?: string | null;
  source: AssetSource;
  source_ref?: string | null;
  status: AssetStatus;
  duration_sec?: number | null;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: string | null;
  mime_type?: string | null;
  byte_size?: number | null;
  checksum?: string | null;
  current_version_id?: string | null;
  parent_asset_id?: string | null;
  tags?: string[];
  created_by?: string | null;
}): Promise<LibraryAsset> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const payload = {
    id: row.id,
    workspace_id: row.workspace_id ?? "default",
    client_id: row.client_id,
    kind: row.kind,
    title: row.title.slice(0, 160),
    description: row.description ?? null,
    source: row.source,
    source_ref: row.source_ref ?? null,
    status: row.status,
    duration_sec: row.duration_sec ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    aspect_ratio: row.aspect_ratio ?? null,
    mime_type: row.mime_type ?? null,
    byte_size: row.byte_size ?? null,
    checksum: row.checksum ?? null,
    current_version_id: row.current_version_id ?? null,
    parent_asset_id: row.parent_asset_id ?? null,
    tags: JSON.stringify(row.tags ?? []),
    created_at: stamp,
    updated_at: stamp,
    created_by: row.created_by ?? null,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("media_assets").insert(payload);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  await sql.query(
    `insert into media_assets (
      id, workspace_id, client_id, kind, title, description, source, source_ref, status,
      duration_sec, width, height, aspect_ratio, mime_type, byte_size, checksum,
      current_version_id, parent_asset_id, tags, created_at, updated_at, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
    [
      payload.id,
      payload.workspace_id,
      payload.client_id,
      payload.kind,
      payload.title,
      payload.description,
      payload.source,
      payload.source_ref,
      payload.status,
      payload.duration_sec,
      payload.width,
      payload.height,
      payload.aspect_ratio,
      payload.mime_type,
      payload.byte_size,
      payload.checksum,
      payload.current_version_id,
      payload.parent_asset_id,
      payload.tags,
      payload.created_at,
      payload.updated_at,
      payload.created_by,
    ],
  );
  return mapAsset(payload);
}

export async function insertVersion(row: {
  id: string;
  asset_id: string;
  version_number: number;
  storage_key: string;
  file_url?: string | null;
  mime_type?: string | null;
  byte_size?: number | null;
  checksum?: string | null;
  note?: string | null;
}): Promise<LibraryAssetVersion> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const payload = {
    id: row.id,
    asset_id: row.asset_id,
    version_number: row.version_number,
    storage_key: row.storage_key,
    file_url: row.file_url ?? null,
    mime_type: row.mime_type ?? null,
    byte_size: row.byte_size ?? null,
    checksum: row.checksum ?? null,
    note: row.note ?? null,
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("media_asset_versions").insert(payload);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  await sql.query(
    `insert into media_asset_versions (
      id, asset_id, version_number, storage_key, file_url, mime_type, byte_size, checksum, note, created_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      payload.id,
      payload.asset_id,
      payload.version_number,
      payload.storage_key,
      payload.file_url,
      payload.mime_type,
      payload.byte_size,
      payload.checksum,
      payload.note,
      payload.created_at,
    ],
  );
  return mapVersion(payload);
}

export async function patchAsset(
  id: string,
  patch: Partial<{
    status: AssetStatus;
    title: string;
    description: string | null;
    duration_sec: number | null;
    width: number | null;
    height: number | null;
    aspect_ratio: string | null;
    mime_type: string | null;
    byte_size: number | null;
    checksum: string | null;
    current_version_id: string | null;
    tags: string[];
  }>,
): Promise<void> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const adminPatch: Record<string, unknown> = { updated_at: stamp };
  if (patch.status !== undefined) adminPatch.status = patch.status;
  if (patch.title !== undefined) adminPatch.title = patch.title;
  if (patch.description !== undefined) adminPatch.description = patch.description;
  if (patch.duration_sec !== undefined) adminPatch.duration_sec = patch.duration_sec;
  if (patch.width !== undefined) adminPatch.width = patch.width;
  if (patch.height !== undefined) adminPatch.height = patch.height;
  if (patch.aspect_ratio !== undefined) adminPatch.aspect_ratio = patch.aspect_ratio;
  if (patch.mime_type !== undefined) adminPatch.mime_type = patch.mime_type;
  if (patch.byte_size !== undefined) adminPatch.byte_size = patch.byte_size;
  if (patch.checksum !== undefined) adminPatch.checksum = patch.checksum;
  if (patch.current_version_id !== undefined) adminPatch.current_version_id = patch.current_version_id;
  if (patch.tags !== undefined) adminPatch.tags = JSON.stringify(patch.tags);
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("media_assets").update(adminPatch).eq("id", id);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  const sets = ["updated_at = $2"];
  const params: unknown[] = [id, stamp];
  let i = 3;
  for (const [key, value] of Object.entries(adminPatch)) {
    if (key === "updated_at") continue;
    sets.push(`${key} = $${i++}`);
    params.push(value);
  }
  await sql.query(`update media_assets set ${sets.join(", ")} where id = $1`, params);
}

export async function getAsset(id: string): Promise<LibraryAsset | null> {
  await ensureLibrarySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("media_assets").select("*").eq("id", id).maybeSingle();
    if (!error && data) return withPreview(mapAsset(data as Record<string, unknown>));
    if (error && !isMissingTable(error)) return null;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>("select * from media_assets where id = $1 limit 1", [id]);
    if (!rows[0]) return null;
    return withPreview(mapAsset(rows[0]));
  } catch {
    return null;
  }
}

export async function listAssets(filters: LibraryFilters = {}, limit = 80): Promise<LibraryAsset[]> {
  await ensureLibrarySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("media_assets").select("*").order("created_at", { ascending: false }).limit(limit);
    if (filters.clientId) q = q.eq("client_id", filters.clientId);
    if (filters.kind) q = q.eq("kind", filters.kind);
    if (filters.source) q = q.eq("source", filters.source);
    if (filters.status) q = q.eq("status", filters.status);
    const { data, error } = await q;
    if (!error) {
      let rows = (data ?? []).map((row) => mapAsset(row as Record<string, unknown>));
      rows = applyLocalFilters(rows, filters);
      return Promise.all(rows.map(withPreview));
    }
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from media_assets order by created_at desc limit 200",
    );
    let assets = rows.map(mapAsset);
    assets = applyLocalFilters(assets, filters).slice(0, limit);
    return Promise.all(assets.map(withPreview));
  } catch {
    return [];
  }
}

function applyLocalFilters(rows: LibraryAsset[], filters: LibraryFilters): LibraryAsset[] {
  return rows.filter((row) => {
    if (filters.clientId && row.clientId !== filters.clientId) return false;
    if (filters.kind && row.kind !== filters.kind) return false;
    if (filters.source && row.source !== filters.source) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.tag && !row.tags.includes(filters.tag)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${row.title} ${row.description ?? ""} ${row.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function listVersions(assetId: string): Promise<LibraryAssetVersion[]> {
  await ensureLibrarySchema();
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from media_asset_versions where asset_id = $1 order by version_number desc",
    [assetId],
  );
  const mapped = rows.map(mapVersion);
  return Promise.all(
    mapped.map(async (row) => ({
      ...row,
      previewUrl: await signVersionUrl(row.id).catch(() => null),
    })),
  );
}

export async function nextVersionNumber(assetId: string): Promise<number> {
  const versions = await listVersions(assetId);
  return (versions[0]?.versionNumber ?? 0) + 1;
}

export async function findByChecksum(clientId: string | null, checksum: string): Promise<LibraryAsset | null> {
  if (!checksum) return null;
  const assets = await listAssets({ status: "READY" }, 200);
  return assets.find((row) => row.checksum === checksum && row.clientId === clientId) ?? null;
}

export async function insertCaption(row: {
  id: string;
  asset_id: string;
  language?: string;
  status: CaptionStatus;
  format?: CaptionFormat;
  storage_key?: string | null;
  cues?: CaptionCue[];
  engine: CaptionEngine;
  error?: string | null;
}): Promise<CaptionTrack> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const payload = {
    id: row.id,
    asset_id: row.asset_id,
    language: row.language ?? "en",
    status: row.status,
    format: row.format ?? "JSON_CUES",
    storage_key: row.storage_key ?? null,
    cues: JSON.stringify(row.cues ?? []),
    engine: row.engine,
    error: row.error ?? null,
    created_at: stamp,
    updated_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("caption_tracks").insert(payload);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  await sql.query(
    `insert into caption_tracks (id, asset_id, language, status, format, storage_key, cues, engine, error, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      payload.id,
      payload.asset_id,
      payload.language,
      payload.status,
      payload.format,
      payload.storage_key,
      payload.cues,
      payload.engine,
      payload.error,
      payload.created_at,
      payload.updated_at,
    ],
  );
  return mapCaption(payload);
}

export async function patchCaption(
  id: string,
  patch: Partial<{
    status: CaptionStatus;
    format: CaptionFormat;
    storage_key: string | null;
    cues: CaptionCue[];
    error: string | null;
    engine: CaptionEngine;
  }>,
): Promise<void> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const adminPatch: Record<string, unknown> = { updated_at: stamp };
  if (patch.status !== undefined) adminPatch.status = patch.status;
  if (patch.format !== undefined) adminPatch.format = patch.format;
  if (patch.storage_key !== undefined) adminPatch.storage_key = patch.storage_key;
  if (patch.cues !== undefined) adminPatch.cues = JSON.stringify(patch.cues);
  if (patch.error !== undefined) adminPatch.error = patch.error;
  if (patch.engine !== undefined) adminPatch.engine = patch.engine;
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("caption_tracks").update(adminPatch).eq("id", id);
  }
  const sql = await localSql();
  const sets = ["updated_at = $2"];
  const params: unknown[] = [id, stamp];
  let i = 3;
  for (const [key, value] of Object.entries(adminPatch)) {
    if (key === "updated_at") continue;
    sets.push(`${key} = $${i++}`);
    params.push(value);
  }
  await sql.query(`update caption_tracks set ${sets.join(", ")} where id = $1`, params);
}

export async function getCaption(id: string): Promise<CaptionTrack | null> {
  await ensureLibrarySchema();
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>("select * from caption_tracks where id = $1 limit 1", [id]);
  return rows[0] ? mapCaption(rows[0]) : null;
}

export async function listCaptions(assetId: string): Promise<CaptionTrack[]> {
  await ensureLibrarySchema();
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from caption_tracks where asset_id = $1 order by created_at desc",
    [assetId],
  );
  return rows.map(mapCaption);
}

export async function insertRender(row: {
  id: string;
  client_id: string | null;
  source_asset_id: string;
  source_version_id?: string | null;
  caption_track_id?: string | null;
  preset: RenderPreset;
  options?: RenderOptions;
  status: RenderStatus;
  worker?: RenderWorker;
  created_by?: string | null;
}): Promise<RenderJob> {
  await ensureLibrarySchema();
  const stamp = nowIso();
  const payload = {
    id: row.id,
    workspace_id: "default",
    client_id: row.client_id,
    source_asset_id: row.source_asset_id,
    source_version_id: row.source_version_id ?? null,
    caption_track_id: row.caption_track_id ?? null,
    preset: row.preset,
    options: JSON.stringify(row.options ?? DEFAULT_RENDER_OPTIONS),
    status: row.status,
    progress_percent: 0,
    output_asset_id: null,
    error: null,
    attempts: 0,
    worker: row.worker ?? "BASE44_FN",
    created_at: stamp,
    started_at: null,
    finished_at: null,
    created_by: row.created_by ?? null,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("render_jobs").insert(payload);
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  await sql.query(
    `insert into render_jobs (
      id, workspace_id, client_id, source_asset_id, source_version_id, caption_track_id,
      preset, options, status, progress_percent, output_asset_id, error, attempts, worker,
      created_at, started_at, finished_at, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      payload.id,
      payload.workspace_id,
      payload.client_id,
      payload.source_asset_id,
      payload.source_version_id,
      payload.caption_track_id,
      payload.preset,
      payload.options,
      payload.status,
      payload.progress_percent,
      payload.output_asset_id,
      payload.error,
      payload.attempts,
      payload.worker,
      payload.created_at,
      payload.started_at,
      payload.finished_at,
      payload.created_by,
    ],
  );
  return mapRender(payload);
}

export async function patchRender(
  id: string,
  patch: Partial<{
    status: RenderStatus;
    progress_percent: number;
    output_asset_id: string | null;
    error: string | null;
    attempts: number;
    worker: RenderWorker;
    started_at: string | null;
    finished_at: string | null;
  }>,
): Promise<void> {
  await ensureLibrarySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("render_jobs").update(patch).eq("id", id);
  }
  const sql = await localSql();
  const sets: string[] = [];
  const params: unknown[] = [id];
  let i = 2;
  for (const [key, value] of Object.entries(patch)) {
    sets.push(`${key} = $${i++}`);
    params.push(value);
  }
  if (sets.length === 0) return;
  await sql.query(`update render_jobs set ${sets.join(", ")} where id = $1`, params);
}

export async function getRender(id: string): Promise<RenderJob | null> {
  await ensureLibrarySchema();
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>("select * from render_jobs where id = $1 limit 1", [id]);
  return rows[0] ? mapRender(rows[0]) : null;
}

export async function listRenders(filter: { sourceAssetId?: string; status?: RenderStatus } = {}): Promise<RenderJob[]> {
  await ensureLibrarySchema();
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from render_jobs order by created_at desc limit 80",
  );
  let jobs = rows.map(mapRender);
  if (filter.sourceAssetId) jobs = jobs.filter((row) => row.sourceAssetId === filter.sourceAssetId);
  if (filter.status) jobs = jobs.filter((row) => row.status === filter.status);
  const titles = new Map<string, string>();
  for (const job of jobs) {
    if (!titles.has(job.sourceAssetId)) {
      const asset = await getAsset(job.sourceAssetId);
      titles.set(job.sourceAssetId, asset?.title ?? "Asset");
    }
  }
  return jobs.map((job) => ({ ...job, sourceTitle: titles.get(job.sourceAssetId) ?? null }));
}

export async function countActiveRenders(): Promise<number> {
  const jobs = await listRenders();
  return jobs.filter((row) => row.status === "QUEUED" || row.status === "RUNNING").length;
}

export async function derivedRenders(parentId: string): Promise<LibraryAsset[]> {
  const assets = await listAssets({}, 200);
  return assets.filter((row) => row.parentAssetId === parentId && row.source === "RENDER_OUTPUT");
}

const SETTINGS_KEY = "MEDIA_PIPELINE_JSON";

export async function readMediaSettings(): Promise<MediaPipelineSettings> {
  const raw = await readAppSetting(SETTINGS_KEY);
  const base = { ...DEFAULT_MEDIA_SETTINGS };
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<MediaPipelineSettings>;
      if (parsed.defaultPreset && RENDER_PRESETS.includes(parsed.defaultPreset)) {
        base.defaultPreset = parsed.defaultPreset;
      }
      if (typeof parsed.maxUploadMb === "number") {
        base.maxUploadMb = Math.min(512, Math.max(8, Math.round(parsed.maxUploadMb)));
      }
      if (typeof parsed.concurrentRenders === "number") {
        base.concurrentRenders = Math.min(2, Math.max(1, Math.round(parsed.concurrentRenders)));
      }
      if (typeof parsed.daytonaRender === "boolean") base.daytonaRender = parsed.daytonaRender;
    } catch {
      /* keep defaults */
    }
  }
  const xai = Boolean(process.env.XAI_API_KEY?.trim());
  base.transcriptionConfigured = xai;
  base.transcriptionEngine = xai ? "XAI_OR_PROVIDER" : "MANUAL";
  base.transcriptionHint = xai
    ? "xAI speech-to-text is connected. Generate captions from video, or upload SRT."
    : "Connect transcription in Settings — or upload an SRT to caption manually.";
  const probe = await probeFfmpeg();
  base.ffmpegAvailable = probe.ok;
  base.ffmpegVersion = probe.version;
  try {
    const storage = await import("@/lib/server/library-storage.server");
    const { libraryBackendNote } = await import("@/lib/social-machine");
    const backend = await storage.libraryBackend();
    base.libraryBackend = backend;
    base.libraryBackendHint = libraryBackendNote(backend);
    const s3 = await storage.publicS3Status();
    base.s3Configured = s3.configured;
    base.s3Bucket = s3.bucket;
    base.s3Endpoint = s3.endpoint;
    const ipfs = await storage.publicIpfsStatus();
    base.ipfsConfigured = ipfs.configured;
    base.ipfsGateway = ipfs.gateway;
    base.ipfsLastCid = ipfs.lastCid;
    base.ipfsStrategy = ipfs.strategy;
    base.ipfsStrategyHint = ipfs.strategyHint;
  } catch {
    /* keep default local hint */
  }
  return base;
}

export async function writeMediaSettings(patch: Partial<MediaPipelineSettings>): Promise<MediaPipelineSettings> {
  const current = await readMediaSettings();
  const next: MediaPipelineSettings = {
    ...current,
    defaultPreset: patch.defaultPreset ?? current.defaultPreset,
    maxUploadMb: patch.maxUploadMb ?? current.maxUploadMb,
    concurrentRenders: patch.concurrentRenders ?? current.concurrentRenders,
    daytonaRender: patch.daytonaRender ?? current.daytonaRender,
  };
  await writeAppSetting(
    SETTINGS_KEY,
    JSON.stringify({
      defaultPreset: next.defaultPreset,
      maxUploadMb: next.maxUploadMb,
      concurrentRenders: next.concurrentRenders,
      daytonaRender: next.daytonaRender,
    }),
  );
  return readMediaSettings();
}

async function probeFfmpeg(): Promise<{ ok: boolean; version: string | null }> {
  try {
    const { spawn } = await import("node:child_process");
    const bin = process.env.FFMPEG_PATH?.trim() || "/usr/local/bin/ffmpeg";
    const version = await new Promise<string | null>((resolve) => {
      const child = spawn(bin, ["-version"], { stdio: ["ignore", "pipe", "ignore"] });
      let out = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve(null);
      }, 4000);
      child.stdout.on("data", (chunk: Buffer) => {
        out += chunk.toString("utf8");
      });
      child.on("error", () => {
        clearTimeout(timer);
        resolve(null);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code !== 0) return resolve(null);
        const line = out.split("\n")[0] ?? "";
        const match = /ffmpeg version ([^\s]+)/i.exec(line);
        resolve(match?.[1] ?? line.slice(0, 40) ?? null);
      });
    });
    return { ok: Boolean(version), version };
  } catch {
    return { ok: false, version: null };
  }
}

export function aspectLabel(width: number | null, height: number | null): string | null {
  if (!width || !height) return null;
  const r = width / height;
  if (Math.abs(r - 9 / 16) < 0.08) return "9:16";
  if (Math.abs(r - 1) < 0.08) return "1:1";
  if (Math.abs(r - 16 / 9) < 0.08) return "16:9";
  return `${width}:${height}`;
}
