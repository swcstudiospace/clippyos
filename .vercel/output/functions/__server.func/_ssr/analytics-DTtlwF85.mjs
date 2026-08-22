import { Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, R as mapSnapshot, j as mapClient } from "./mappers-Bmic_hyw.mjs";
import { d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
import { n as SNAPSHOT_JSON_CAP } from "./analytics-qdDcZ6-_.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-DTtlwF85.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
async function readClients() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("clients").select("*").order("name");
		if (!error) return (data ?? []).map((row) => mapClient(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from clients order by name")).map(mapClient);
}
async function readSnapshots() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("analytics_snapshots").select("*").order("date", { ascending: true });
		if (!error) return (data ?? []).map((row) => mapSnapshot(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from analytics_snapshots order by date asc")).map(mapSnapshot);
}
async function findSnapshot(clientId, date) {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("analytics_snapshots").select("*").eq("client_id", clientId).eq("date", date).maybeSingle();
		if (!error) return data ? mapSnapshot(data) : null;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const rows = await (await (await load_agency_db()).localSql()).query("select * from analytics_snapshots where client_id = $1 and date = $2 limit 1", [clientId, date]);
	return rows[0] ? mapSnapshot(rows[0]) : null;
}
async function upsertSnapshot(row) {
	const stamp = nowIso();
	const payload = {
		id: row.existingId ?? row.id,
		client_id: row.clientId,
		date: row.date,
		views: row.views,
		subscribers: row.subscribers,
		watch_hours: row.watchHours,
		impressions_ctr: row.impressionsCtr,
		top_videos: row.topVideos ? JSON.parse(row.topVideos) : null,
		created_at: stamp,
		updated_at: stamp,
		created_by: row.createdBy
	};
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		if (row.existingId) {
			const { data, error } = await admin.from("analytics_snapshots").update({
				views: payload.views,
				subscribers: payload.subscribers,
				watch_hours: payload.watch_hours,
				impressions_ctr: payload.impressions_ctr,
				top_videos: payload.top_videos,
				updated_at: stamp
			}).eq("id", row.existingId).select("*").maybeSingle();
			if (!error && data) return mapSnapshot(data);
			if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		} else {
			const { data, error } = await admin.from("analytics_snapshots").insert(payload).select("*").maybeSingle();
			if (!error && data) return mapSnapshot(data);
			if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
		}
	}
	const sql = await (await load_agency_db()).localSql();
	if (row.existingId) {
		const rows = await sql.query(`update analytics_snapshots
       set views = $2, subscribers = $3, watch_hours = $4, impressions_ctr = $5,
           top_videos = $6::jsonb, updated_at = $7
       where id = $1
       returning *`, [
			row.existingId,
			row.views,
			row.subscribers,
			row.watchHours,
			row.impressionsCtr,
			row.topVideos,
			stamp
		]);
		if (rows[0]) return mapSnapshot(rows[0]);
	} else {
		const rows = await sql.query(`insert into analytics_snapshots
         (id, client_id, date, views, subscribers, watch_hours, impressions_ctr, top_videos, created_at, updated_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9,$10)
       returning *`, [
			row.id,
			row.clientId,
			row.date,
			row.views,
			row.subscribers,
			row.watchHours,
			row.impressionsCtr,
			row.topVideos,
			stamp,
			row.createdBy
		]);
		if (rows[0]) return mapSnapshot(rows[0]);
	}
	throw new Error("DATA_UNAVAILABLE");
}
async function patchClientChannel(params) {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const patch = {
			channel_url: params.channelUrl,
			channel_thumbnail: params.channelThumbnail,
			updated_at: stamp
		};
		if (params.name) patch.name = params.name;
		const { error } = await admin.from("clients").update(patch).eq("id", params.id);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await (await load_agency_db()).localSql();
	if (params.name) await sql.query("update clients set channel_url = $2, channel_thumbnail = $3, name = $4, updated_at = $5 where id = $1", [
		params.id,
		params.channelUrl,
		params.channelThumbnail,
		params.name,
		stamp
	]);
	else await sql.query("update clients set channel_url = $2, channel_thumbnail = $3, updated_at = $4 where id = $1", [
		params.id,
		params.channelUrl,
		params.channelThumbnail,
		stamp
	]);
}
async function ensureSnapshotUnique() {
	try {
		await (await (await load_agency_db()).localSql()).query("create unique index if not exists analytics_snapshots_client_date_uidx on analytics_snapshots (client_id, date)");
	} catch {}
}
var getAnalytics_createServerFn_handler = createServerRpc({
	id: "40d717d7faa7e364391652b9a6420cf9b0725fbf000d5eba79ca2e35c6efb7dd",
	name: "getAnalytics",
	filename: "src/lib/server/analytics.ts"
}, (opts) => getAnalytics.__executeServer(opts));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAnalytics_createServerFn_handler, async () => {
	await ensureSnapshotUnique();
	const { youtubeDataApiAvailable } = await import("./youtube-data.server-CmwbKs56.mjs");
	const [clients, snapshots, youtubeDataApi] = await Promise.all([
		readClients(),
		readSnapshots(),
		youtubeDataApiAvailable()
	]);
	return {
		clients,
		snapshots,
		youtubeDataApi
	};
});
var ConnectSchema = object({
	input: string().trim().min(1).max(500),
	clientId: string().min(1).nullable()
});
function matchClient(clients, channelId, canonical) {
	const active = clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt);
	if (channelId) {
		const hit = active.find((row) => (row.channelUrl ?? "").includes(channelId));
		if (hit) return hit;
	}
	return active.find((row) => row.channelUrl === canonical) ?? null;
}
var connectChannel_createServerFn_handler = createServerRpc({
	id: "a683379f16e8bd385144b5be62334846eb624848052a2002adfa18a00d850c9c",
	name: "connectChannel",
	filename: "src/lib/server/analytics.ts"
}, (opts) => connectChannel.__executeServer(opts));
var connectChannel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ConnectSchema.parse(input)).handler(connectChannel_createServerFn_handler, async ({ data }) => {
	const parsed = parseYouTubeChannelUrl(data.input);
	if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
	const { fetchChannelSnapshot } = await import("./youtube.server-D98qL7z7.mjs");
	let snapshot;
	try {
		snapshot = await fetchChannelSnapshot(parsed.canonical);
	} catch {
		throw new Error("YOUTUBE_UNAVAILABLE");
	}
	const canonical = snapshot.canonicalUrl || parsed.canonical;
	const clients = await readClients();
	let client = data.clientId ? clients.find((row) => row.id === data.clientId) ?? null : matchClient(clients, snapshot.channelId, canonical);
	if (!client) return {
		ok: false,
		reason: "NO_CLIENT",
		channelTitle: snapshot.title,
		channelUrl: canonical
	};
	const alreadyLinked = Boolean(client.channelUrl && (client.channelUrl === canonical || snapshot.channelId && client.channelUrl.includes(snapshot.channelId)));
	if (!alreadyLinked) await patchClientChannel({
		id: client.id,
		channelUrl: canonical,
		channelThumbnail: snapshot.thumbnail
	});
	return {
		ok: true,
		client: (await readClients()).find((row) => row.id === client.id) ?? client,
		channelUrl: canonical,
		channelTitle: snapshot.title,
		alreadyLinked
	};
});
function channelLookup(url) {
	const parsed = parseYouTubeChannelUrl(url);
	if (!parsed.ok) return {};
	if (parsed.kind === "channel") return { channelId: parsed.value };
	if (parsed.kind === "handle") return { handle: parsed.value };
	return {};
}
async function persistPull(params) {
	const url = params.client.channelUrl;
	if (!url) throw new Error("CHANNEL_MISSING");
	const { pullPublicAnalytics } = await import("./youtube-data.server-CmwbKs56.mjs");
	const lookup = channelLookup(url);
	if (!lookup.channelId && !lookup.handle) {
		const { fetchChannelSnapshot } = await import("./youtube.server-D98qL7z7.mjs");
		const snap = await fetchChannelSnapshot(url);
		if (snap.channelId) lookup.channelId = snap.channelId;
	}
	if (!lookup.channelId && !lookup.handle) throw new Error("YOUTUBE_CHANNEL_NOT_FOUND");
	const pulled = await pullPublicAnalytics(lookup);
	const date = todayIsoDate();
	const existing = await findSnapshot(params.client.id, date);
	const topVideos = JSON.stringify(pulled.topVideos).slice(0, SNAPSHOT_JSON_CAP);
	const saved = await upsertSnapshot({
		id: newId(),
		existingId: existing?.id,
		clientId: params.client.id,
		date,
		views: pulled.views,
		subscribers: pulled.subscribers,
		watchHours: null,
		impressionsCtr: null,
		topVideos,
		createdBy: params.userId
	});
	if (pulled.channel.canonicalUrl && pulled.channel.canonicalUrl !== params.client.channelUrl) await patchClientChannel({
		id: params.client.id,
		channelUrl: pulled.channel.canonicalUrl,
		channelThumbnail: pulled.channel.thumbnail
	});
	return saved;
}
var PullSchema = object({ clientId: string().min(1).nullable() });
var pullAnalytics_createServerFn_handler = createServerRpc({
	id: "ee227c40ee73ffb5d45160021271d79eafd24706e7d614d01dd215cbcc142e83",
	name: "pullAnalytics",
	filename: "src/lib/server/analytics.ts"
}, (opts) => pullAnalytics.__executeServer(opts));
var pullAnalytics = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PullSchema.parse(input)).handler(pullAnalytics_createServerFn_handler, async ({ data, context }) => {
	const { youtubeDataApiAvailable } = await import("./youtube-data.server-CmwbKs56.mjs");
	if (!await youtubeDataApiAvailable()) throw new Error("YOUTUBE_KEY_MISSING");
	const clients = await readClients();
	const targets = data.clientId ? clients.filter((row) => row.id === data.clientId) : clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt && row.channelUrl);
	if (targets.length === 0) throw new Error("CLIENT_MISSING");
	const results = [];
	for (const client of targets.slice(0, 8)) try {
		await persistPull({
			client,
			userId: context.userId
		});
		results.push({
			clientId: client.id,
			ok: true
		});
	} catch (error) {
		if (error instanceof Error && error.message === "YOUTUBE_QUOTA") throw error;
		results.push({
			clientId: client.id,
			ok: false
		});
	}
	if (data.clientId && results[0] && !results[0].ok) throw new Error("YOUTUBE_UNAVAILABLE");
	return { results };
});
var ManualVideoSchema = object({
	title: string().trim().min(1).max(300),
	views: number().min(0).max(0x38d7ea4c68000).nullable(),
	url: string().trim().max(500).nullable()
});
var ManualSchema = object({
	clientId: string().min(1),
	date: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	views: number().min(0).max(0x38d7ea4c68000).nullable(),
	subscribers: number().min(0).max(0xe8d4a51000).nullable(),
	watchHours: number().min(0).max(1e9).nullable(),
	impressionsCtr: number().min(0).max(100).nullable(),
	topVideos: array(ManualVideoSchema).max(20).optional(),
	overwrite: boolean()
});
var saveManualSnapshot_createServerFn_handler = createServerRpc({
	id: "7670f181875d8341c845cca80688f502fc82cb7f674fb7fb0521f97dbd2d7a0e",
	name: "saveManualSnapshot",
	filename: "src/lib/server/analytics.ts"
}, (opts) => saveManualSnapshot.__executeServer(opts));
var saveManualSnapshot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ManualSchema.parse(input)).handler(saveManualSnapshot_createServerFn_handler, async ({ data, context }) => {
	if (!(await readClients()).find((row) => row.id === data.clientId)) throw new Error("CLIENT_MISSING");
	const existing = await findSnapshot(data.clientId, data.date);
	if (existing && !data.overwrite) throw new Error("SNAPSHOT_EXISTS");
	const videos = (data.topVideos ?? []).map((row) => ({
		videoId: "",
		title: sanitizeText(row.title),
		views: row.views,
		likes: null,
		durationSeconds: null,
		publishedAt: null,
		thumbnail: null,
		url: row.url && row.url.startsWith("https://") ? row.url : "",
		isLongForm: true
	}));
	return upsertSnapshot({
		id: newId(),
		existingId: existing?.id,
		clientId: data.clientId,
		date: data.date,
		views: data.views,
		subscribers: data.subscribers,
		watchHours: data.watchHours,
		impressionsCtr: data.impressionsCtr,
		topVideos: videos.length ? JSON.stringify(videos) : null,
		createdBy: context.userId
	});
});
//#endregion
export { connectChannel_createServerFn_handler, getAnalytics_createServerFn_handler, pullAnalytics_createServerFn_handler, saveManualSnapshot_createServerFn_handler };
