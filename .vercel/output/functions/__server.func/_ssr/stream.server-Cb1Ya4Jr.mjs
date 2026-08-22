import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stream.server-Cb1Ya4Jr.js
var schemaReady = null;
async function ensureStreamSchema() {
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
function mapClip(row) {
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
		status: status === "READY" || status === "FAILED" ? status : "PROCESSING",
		error: row.error ? String(row.error) : null,
		createdAt: String(row.created_at ?? ""),
		updatedAt: String(row.updated_at ?? "")
	};
}
async function listClipsForClient(clientId) {
	await ensureStreamSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("stream_clips").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(40);
		if (!error) return (data ?? []).map((row) => mapClip(row));
	}
	try {
		return (await (await localSql()).query("select * from stream_clips where client_id = $1 order by created_at desc limit 40", [clientId])).map(mapClip);
	} catch {
		return [];
	}
}
async function getClipById(id) {
	await ensureStreamSchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("stream_clips").select("*").eq("id", id).maybeSingle();
		if (!error && data) return mapClip(data);
	}
	try {
		const rows = await (await localSql()).query("select * from stream_clips where id = $1", [id]);
		return rows[0] ? mapClip(rows[0]) : null;
	} catch {
		return null;
	}
}
//#endregion
export { getClipById, listClipsForClient };
