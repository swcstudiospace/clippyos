import { A as isMissingTable, k as isMissingColumn } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll } from "./ssr.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { c as signVersionUrl } from "./library-storage.server-DfxOTjeL.mjs";
import { a as CAPTION_FORMATS, c as DEFAULT_RENDER_OPTIONS, g as RENDER_WORKERS, h as RENDER_STATUSES, i as CAPTION_ENGINES, m as RENDER_PRESETS, n as ASSET_SOURCES, o as CAPTION_STATUSES, r as ASSET_STATUSES, s as DEFAULT_MEDIA_SETTINGS, t as ASSET_KINDS } from "./library-D-Mt5rXw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library.server-vya-JVML.js
var library_server_exports = /* @__PURE__ */ __exportAll({
	aspectLabel: () => aspectLabel,
	derivedRenders: () => derivedRenders,
	ensureLibrarySchema: () => ensureLibrarySchema,
	findByChecksum: () => findByChecksum,
	getAsset: () => getAsset,
	getCaption: () => getCaption,
	getRender: () => getRender,
	getVersionRow: () => getVersionRow,
	insertAsset: () => insertAsset,
	insertCaption: () => insertCaption,
	insertRender: () => insertRender,
	insertVersion: () => insertVersion,
	libraryNewId: () => libraryNewId,
	listAssets: () => listAssets,
	listCaptions: () => listCaptions,
	listRenders: () => listRenders,
	listVersions: () => listVersions,
	mapAsset: () => mapAsset,
	mapCaption: () => mapCaption,
	mapRender: () => mapRender,
	mapVersion: () => mapVersion,
	patchAsset: () => patchAsset,
	patchCaption: () => patchCaption,
	patchRender: () => patchRender,
	readMediaSettings: () => readMediaSettings,
	writeMediaSettings: () => writeMediaSettings
});
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function libraryNewId() {
	return crypto.randomUUID();
}
var schemaReady = null;
var SCHEMA_SQL = `
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
async function ensureLibrarySchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		const sql = await localSql();
		for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) await sql.query(stmt);
	})().catch((error) => {
		schemaReady = null;
		throw error;
	});
	return schemaReady;
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function asString(value, fallback = "") {
	if (value == null) return fallback;
	return String(value);
}
function asNullable(value) {
	if (value == null || value === "") return null;
	return String(value);
}
function asNumber(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
function parseTags(value) {
	if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 24);
	if (typeof value !== "string" || !value.trim()) return [];
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return parsed.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 24);
	} catch {
		return value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 24);
	}
	return [];
}
function parseCues(value) {
	if (Array.isArray(value)) return value.map((row) => {
		const rec = row;
		const startMs = Number(rec.startMs ?? rec.start_ms ?? 0);
		const endMs = Number(rec.endMs ?? rec.end_ms ?? 0);
		const text = String(rec.text ?? "").trim();
		if (!text || !Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
		return {
			startMs,
			endMs,
			text: text.slice(0, 280)
		};
	}).filter((row) => Boolean(row));
	if (typeof value === "string" && value.trim()) try {
		return parseCues(JSON.parse(value));
	} catch {
		return [];
	}
	return [];
}
function parseOptions(value) {
	let raw = {};
	if (typeof value === "string" && value.trim()) try {
		raw = JSON.parse(value);
	} catch {
		raw = {};
	}
	else if (value && typeof value === "object") raw = value;
	const trimRaw = raw.trim && typeof raw.trim === "object" ? raw.trim : null;
	return {
		burnInCaptions: Boolean(raw.burnInCaptions),
		captionStyleId: typeof raw.captionStyleId === "string" ? raw.captionStyleId : void 0,
		targetMaxDurationSec: typeof raw.targetMaxDurationSec === "number" ? raw.targetMaxDurationSec : void 0,
		trim: trimRaw && Number.isFinite(Number(trimRaw.startMs)) && Number.isFinite(Number(trimRaw.endMs)) ? {
			startMs: Number(trimRaw.startMs),
			endMs: Number(trimRaw.endMs)
		} : void 0,
		loudnorm: raw.loudnorm !== false,
		maxWidth: typeof raw.maxWidth === "number" ? raw.maxWidth : void 0,
		format: "mp4",
		customWidth: typeof raw.customWidth === "number" ? raw.customWidth : void 0,
		customHeight: typeof raw.customHeight === "number" ? raw.customHeight : void 0
	};
}
async function withPreview(asset) {
	if (!asset.currentVersionId) return {
		...asset,
		previewUrl: null
	};
	try {
		return {
			...asset,
			previewUrl: await signVersionUrl(asset.currentVersionId)
		};
	} catch {
		return {
			...asset,
			previewUrl: null
		};
	}
}
function mapAsset(row) {
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
		createdBy: asNullable(row.created_by)
	};
}
function mapVersion(row) {
	return {
		id: asString(row.id),
		assetId: asString(row.asset_id),
		versionNumber: asNumber(row.version_number) ?? 1,
		mimeType: asNullable(row.mime_type),
		byteSize: asNumber(row.byte_size),
		checksum: asNullable(row.checksum),
		note: asNullable(row.note),
		previewUrl: null,
		createdAt: asString(row.created_at, nowIso())
	};
}
function mapCaption(row) {
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
		updatedAt: asString(row.updated_at, nowIso())
	};
}
function mapRender(row) {
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
		createdBy: asNullable(row.created_by)
	};
}
async function getVersionRow(id) {
	await ensureLibrarySchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("media_asset_versions").select("*").eq("id", id).maybeSingle();
		if (!error && data) {
			const rec = data;
			return {
				...mapVersion(rec),
				storageKey: asString(rec.storage_key)
			};
		}
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rec = (await (await localSql()).query("select * from media_asset_versions where id = $1 limit 1", [id]))[0];
		if (!rec) return null;
		return {
			...mapVersion(rec),
			storageKey: asString(rec.storage_key)
		};
	} catch {
		return null;
	}
}
async function insertAsset(row) {
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
		created_by: row.created_by ?? null
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("media_assets").insert(payload);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await localSql()).query(`insert into media_assets (
      id, workspace_id, client_id, kind, title, description, source, source_ref, status,
      duration_sec, width, height, aspect_ratio, mime_type, byte_size, checksum,
      current_version_id, parent_asset_id, tags, created_at, updated_at, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`, [
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
		payload.created_by
	]);
	return mapAsset(payload);
}
async function insertVersion(row) {
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
		created_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("media_asset_versions").insert(payload);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await localSql()).query(`insert into media_asset_versions (
      id, asset_id, version_number, storage_key, file_url, mime_type, byte_size, checksum, note, created_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
		payload.id,
		payload.asset_id,
		payload.version_number,
		payload.storage_key,
		payload.file_url,
		payload.mime_type,
		payload.byte_size,
		payload.checksum,
		payload.note,
		payload.created_at
	]);
	return mapVersion(payload);
}
async function patchAsset(id, patch) {
	await ensureLibrarySchema();
	const stamp = nowIso();
	const adminPatch = { updated_at: stamp };
	if (patch.status !== void 0) adminPatch.status = patch.status;
	if (patch.title !== void 0) adminPatch.title = patch.title;
	if (patch.description !== void 0) adminPatch.description = patch.description;
	if (patch.duration_sec !== void 0) adminPatch.duration_sec = patch.duration_sec;
	if (patch.width !== void 0) adminPatch.width = patch.width;
	if (patch.height !== void 0) adminPatch.height = patch.height;
	if (patch.aspect_ratio !== void 0) adminPatch.aspect_ratio = patch.aspect_ratio;
	if (patch.mime_type !== void 0) adminPatch.mime_type = patch.mime_type;
	if (patch.byte_size !== void 0) adminPatch.byte_size = patch.byte_size;
	if (patch.checksum !== void 0) adminPatch.checksum = patch.checksum;
	if (patch.current_version_id !== void 0) adminPatch.current_version_id = patch.current_version_id;
	if (patch.tags !== void 0) adminPatch.tags = JSON.stringify(patch.tags);
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("media_assets").update(adminPatch).eq("id", id);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await localSql();
	const sets = ["updated_at = $2"];
	const params = [id, stamp];
	let i = 3;
	for (const [key, value] of Object.entries(adminPatch)) {
		if (key === "updated_at") continue;
		sets.push(`${key} = $${i++}`);
		params.push(value);
	}
	await sql.query(`update media_assets set ${sets.join(", ")} where id = $1`, params);
}
async function getAsset(id) {
	await ensureLibrarySchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("media_assets").select("*").eq("id", id).maybeSingle();
		if (!error && data) return withPreview(mapAsset(data));
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from media_assets where id = $1 limit 1", [id]);
		if (!rows[0]) return null;
		return withPreview(mapAsset(rows[0]));
	} catch {
		return null;
	}
}
async function listAssets(filters = {}, limit = 80) {
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
			let rows = (data ?? []).map((row) => mapAsset(row));
			rows = applyLocalFilters(rows, filters);
			return Promise.all(rows.map(withPreview));
		}
		if (!isMissingTable(error)) return [];
	}
	try {
		let assets = (await (await localSql()).query("select * from media_assets order by created_at desc limit 200")).map(mapAsset);
		assets = applyLocalFilters(assets, filters).slice(0, limit);
		return Promise.all(assets.map(withPreview));
	} catch {
		return [];
	}
}
function applyLocalFilters(rows, filters) {
	return rows.filter((row) => {
		if (filters.clientId && row.clientId !== filters.clientId) return false;
		if (filters.kind && row.kind !== filters.kind) return false;
		if (filters.source && row.source !== filters.source) return false;
		if (filters.status && row.status !== filters.status) return false;
		if (filters.tag && !row.tags.includes(filters.tag)) return false;
		if (filters.search) {
			const q = filters.search.toLowerCase();
			if (!`${row.title} ${row.description ?? ""} ${row.tags.join(" ")}`.toLowerCase().includes(q)) return false;
		}
		return true;
	});
}
async function listVersions(assetId) {
	await ensureLibrarySchema();
	const mapped = (await (await localSql()).query("select * from media_asset_versions where asset_id = $1 order by version_number desc", [assetId])).map(mapVersion);
	return Promise.all(mapped.map(async (row) => ({
		...row,
		previewUrl: await signVersionUrl(row.id).catch(() => null)
	})));
}
async function findByChecksum(clientId, checksum) {
	if (!checksum) return null;
	return (await listAssets({ status: "READY" }, 200)).find((row) => row.checksum === checksum && row.clientId === clientId) ?? null;
}
async function insertCaption(row) {
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
		updated_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("caption_tracks").insert(payload);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await localSql()).query(`insert into caption_tracks (id, asset_id, language, status, format, storage_key, cues, engine, error, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
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
		payload.updated_at
	]);
	return mapCaption(payload);
}
async function patchCaption(id, patch) {
	await ensureLibrarySchema();
	const stamp = nowIso();
	const adminPatch = { updated_at: stamp };
	if (patch.status !== void 0) adminPatch.status = patch.status;
	if (patch.format !== void 0) adminPatch.format = patch.format;
	if (patch.storage_key !== void 0) adminPatch.storage_key = patch.storage_key;
	if (patch.cues !== void 0) adminPatch.cues = JSON.stringify(patch.cues);
	if (patch.error !== void 0) adminPatch.error = patch.error;
	if (patch.engine !== void 0) adminPatch.engine = patch.engine;
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("caption_tracks").update(adminPatch).eq("id", id);
	const sql = await localSql();
	const sets = ["updated_at = $2"];
	const params = [id, stamp];
	let i = 3;
	for (const [key, value] of Object.entries(adminPatch)) {
		if (key === "updated_at") continue;
		sets.push(`${key} = $${i++}`);
		params.push(value);
	}
	await sql.query(`update caption_tracks set ${sets.join(", ")} where id = $1`, params);
}
async function getCaption(id) {
	await ensureLibrarySchema();
	const rows = await (await localSql()).query("select * from caption_tracks where id = $1 limit 1", [id]);
	return rows[0] ? mapCaption(rows[0]) : null;
}
async function listCaptions(assetId) {
	await ensureLibrarySchema();
	return (await (await localSql()).query("select * from caption_tracks where asset_id = $1 order by created_at desc", [assetId])).map(mapCaption);
}
async function insertRender(row) {
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
		created_by: row.created_by ?? null
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("render_jobs").insert(payload);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	await (await localSql()).query(`insert into render_jobs (
      id, workspace_id, client_id, source_asset_id, source_version_id, caption_track_id,
      preset, options, status, progress_percent, output_asset_id, error, attempts, worker,
      created_at, started_at, finished_at, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [
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
		payload.created_by
	]);
	return mapRender(payload);
}
async function patchRender(id, patch) {
	await ensureLibrarySchema();
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("render_jobs").update(patch).eq("id", id);
	const sql = await localSql();
	const sets = [];
	const params = [id];
	let i = 2;
	for (const [key, value] of Object.entries(patch)) {
		sets.push(`${key} = $${i++}`);
		params.push(value);
	}
	if (sets.length === 0) return;
	await sql.query(`update render_jobs set ${sets.join(", ")} where id = $1`, params);
}
async function getRender(id) {
	await ensureLibrarySchema();
	const rows = await (await localSql()).query("select * from render_jobs where id = $1 limit 1", [id]);
	return rows[0] ? mapRender(rows[0]) : null;
}
async function listRenders(filter = {}) {
	await ensureLibrarySchema();
	let jobs = (await (await localSql()).query("select * from render_jobs order by created_at desc limit 80")).map(mapRender);
	if (filter.sourceAssetId) jobs = jobs.filter((row) => row.sourceAssetId === filter.sourceAssetId);
	if (filter.status) jobs = jobs.filter((row) => row.status === filter.status);
	const titles = /* @__PURE__ */ new Map();
	for (const job of jobs) if (!titles.has(job.sourceAssetId)) {
		const asset = await getAsset(job.sourceAssetId);
		titles.set(job.sourceAssetId, asset?.title ?? "Asset");
	}
	return jobs.map((job) => ({
		...job,
		sourceTitle: titles.get(job.sourceAssetId) ?? null
	}));
}
async function derivedRenders(parentId) {
	return (await listAssets({}, 200)).filter((row) => row.parentAssetId === parentId && row.source === "RENDER_OUTPUT");
}
var SETTINGS_KEY = "MEDIA_PIPELINE_JSON";
async function readMediaSettings() {
	const raw = await readAppSetting(SETTINGS_KEY);
	const base = { ...DEFAULT_MEDIA_SETTINGS };
	if (raw) try {
		const parsed = JSON.parse(raw);
		if (parsed.defaultPreset && RENDER_PRESETS.includes(parsed.defaultPreset)) base.defaultPreset = parsed.defaultPreset;
		if (typeof parsed.maxUploadMb === "number") base.maxUploadMb = Math.min(512, Math.max(8, Math.round(parsed.maxUploadMb)));
		if (typeof parsed.concurrentRenders === "number") base.concurrentRenders = Math.min(2, Math.max(1, Math.round(parsed.concurrentRenders)));
		if (typeof parsed.daytonaRender === "boolean") base.daytonaRender = parsed.daytonaRender;
	} catch {}
	const xai = Boolean(process.env.XAI_API_KEY?.trim());
	base.transcriptionConfigured = xai;
	base.transcriptionEngine = xai ? "XAI_OR_PROVIDER" : "MANUAL";
	base.transcriptionHint = xai ? "xAI speech-to-text is connected. Generate captions from video, or upload SRT." : "Connect transcription in Settings — or upload an SRT to caption manually.";
	const probe = await probeFfmpeg();
	base.ffmpegAvailable = probe.ok;
	base.ffmpegVersion = probe.version;
	try {
		const storage = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
		const { libraryBackendNote } = await import("./social-machine-D22Q8XQF.mjs").then((n) => n.R).then((n) => n.z);
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
	} catch {}
	return base;
}
async function writeMediaSettings(patch) {
	const current = await readMediaSettings();
	const next = {
		...current,
		defaultPreset: patch.defaultPreset ?? current.defaultPreset,
		maxUploadMb: patch.maxUploadMb ?? current.maxUploadMb,
		concurrentRenders: patch.concurrentRenders ?? current.concurrentRenders,
		daytonaRender: patch.daytonaRender ?? current.daytonaRender
	};
	await writeAppSetting(SETTINGS_KEY, JSON.stringify({
		defaultPreset: next.defaultPreset,
		maxUploadMb: next.maxUploadMb,
		concurrentRenders: next.concurrentRenders,
		daytonaRender: next.daytonaRender
	}));
	return readMediaSettings();
}
async function probeFfmpeg() {
	try {
		const { spawn } = await import("node:child_process");
		const bin = process.env.FFMPEG_PATH?.trim() || "/usr/local/bin/ffmpeg";
		const version = await new Promise((resolve) => {
			const child = spawn(bin, ["-version"], { stdio: [
				"ignore",
				"pipe",
				"ignore"
			] });
			let out = "";
			const timer = setTimeout(() => {
				child.kill("SIGKILL");
				resolve(null);
			}, 4e3);
			child.stdout.on("data", (chunk) => {
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
				resolve(/ffmpeg version ([^\s]+)/i.exec(line)?.[1] ?? line.slice(0, 40) ?? null);
			});
		});
		return {
			ok: Boolean(version),
			version
		};
	} catch {
		return {
			ok: false,
			version: null
		};
	}
}
function aspectLabel(width, height) {
	if (!width || !height) return null;
	const r = width / height;
	if (Math.abs(r - 9 / 16) < .08) return "9:16";
	if (Math.abs(r - 1) < .08) return "1:1";
	if (Math.abs(r - 16 / 9) < .08) return "16:9";
	return `${width}:${height}`;
}
//#endregion
export { patchAsset as _, getCaption as a, readMediaSettings as b, insertAsset as c, insertVersion as d, libraryNewId as f, listRenders as g, listCaptions as h, getAsset as i, insertCaption as l, listAssets as m, derivedRenders as n, getRender as o, library_server_exports as p, findByChecksum as r, getVersionRow as s, aspectLabel as t, insertRender as u, patchCaption as v, patchRender as y };
