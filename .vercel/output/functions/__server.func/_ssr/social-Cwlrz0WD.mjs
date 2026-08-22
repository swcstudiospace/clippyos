import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { A as isMissingTable, k as isMissingColumn, v as SOCIAL_PLATFORMS, z as mapSocialPost } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { d as readClients, f as readProgress } from "./clients-CmcyBPZd.mjs";
import { c as attachJobProgress, h as parseYoutubeJobOptions } from "./social-CmuIUyLc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/social-Cwlrz0WD.js
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_app_settings() {
	return import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
}
var SESSION_KEY = "SOCIAL_PLATFORM_SESSIONS";
var AUDIT_KEY = "SOCIAL_AUDIT";
var runningLock = { busy: false };
var schemaReady = null;
async function ensureSocialSchema() {
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
		try {
			await sql.query(`alter table social_posts drop constraint if exists social_posts_platform_check`);
			await sql.query(`alter table social_posts add constraint social_posts_platform_check check (platform in ('instagram', 'x', 'tiktok', 'youtube'))`);
		} catch {}
	})().catch((error) => {
		schemaReady = null;
		throw error;
	});
	return schemaReady;
}
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
var emptySessions = () => ({
	instagram: "unknown",
	x: "unknown",
	tiktok: "unknown",
	youtube: "unknown"
});
async function readSessions() {
	const raw = await (await load_app_settings()).readAppSetting(SESSION_KEY);
	const base = emptySessions();
	if (!raw) return base;
	try {
		const parsed = JSON.parse(raw);
		for (const platform of SOCIAL_PLATFORMS) {
			const value = parsed[platform];
			if (value === "logged_in" || value === "not_logged_in" || value === "unknown") base[platform] = value;
		}
	} catch {}
	return base;
}
async function writeSessions(sessions) {
	await (await load_app_settings()).writeAppSetting(SESSION_KEY, JSON.stringify(sessions));
}
async function appendAudit(entry) {
	const raw = await (await load_app_settings()).readAppSetting(AUDIT_KEY);
	let list = [];
	if (raw) try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) list = parsed;
	} catch {
		list = [];
	}
	list.unshift({
		at: nowIso(),
		actorId: entry.actorId.slice(0, 80),
		action: entry.action.slice(0, 80),
		detail: entry.detail.slice(0, 240)
	});
	await (await load_app_settings()).writeAppSetting(AUDIT_KEY, JSON.stringify(list.slice(0, 50)));
}
async function readSocialPosts() {
	try {
		await ensureSocialSchema();
	} catch {}
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("social_posts").select("*").order("created_at", { ascending: false }).limit(80);
		if (!error) return (data ?? []).map((row) => mapSocialPost(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	try {
		return (await (await (await load_agency_db()).localSql()).query("select * from social_posts order by created_at desc limit 80")).map(mapSocialPost);
	} catch {
		return [];
	}
}
async function insertSocialPost(row) {
	try {
		await ensureSocialSchema();
	} catch {}
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("social_posts").insert(row);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) return mapSocialPost(row);
	}
	await (await (await load_agency_db()).localSql()).query(`insert into social_posts (
        id, client_id, platform, status, content_ref, media_url, caption,
        external_url, screenshot_url, source, attention_reason, job_id,
        rail, external_post_id, tiktok_post_mode, ig_container_id, created_at, updated_at, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`, [
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
		row.created_by
	]);
	return mapSocialPost(row);
}
async function patchSocialPost(id, patch) {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("social_posts").update({
			...patch,
			updated_at: stamp
		}).eq("id", id);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	try {
		const sql = await (await load_agency_db()).localSql();
		const sets = ["updated_at = $2"];
		const params = [id, stamp];
		let i = 3;
		if (patch.status !== void 0) {
			sets.push(`status = $${i++}`);
			params.push(patch.status);
		}
		if (patch.screenshot_url !== void 0) {
			sets.push(`screenshot_url = $${i++}`);
			params.push(patch.screenshot_url);
		}
		if (patch.attention_reason !== void 0) {
			sets.push(`attention_reason = $${i++}`);
			params.push(patch.attention_reason);
		}
		if (patch.external_url !== void 0) {
			sets.push(`external_url = $${i++}`);
			params.push(patch.external_url);
		}
		if (patch.rail !== void 0) {
			sets.push(`rail = $${i++}`);
			params.push(patch.rail);
		}
		if (patch.source !== void 0) {
			sets.push(`source = $${i++}`);
			params.push(patch.source);
		}
		if (patch.external_post_id !== void 0) {
			sets.push(`external_post_id = $${i++}`);
			params.push(patch.external_post_id);
		}
		if (patch.tiktok_post_mode !== void 0) {
			sets.push(`tiktok_post_mode = $${i++}`);
			params.push(patch.tiktok_post_mode);
		}
		if (patch.ig_container_id !== void 0) {
			sets.push(`ig_container_id = $${i++}`);
			params.push(patch.ig_container_id);
		}
		if (patch.upload_percent !== void 0) {
			sets.push(`upload_percent = $${i++}`);
			params.push(patch.upload_percent);
		}
		if (patch.upload_phase !== void 0) {
			sets.push(`upload_phase = $${i++}`);
			params.push(patch.upload_phase);
		}
		if (patch.resumable_session_id !== void 0) {
			sets.push(`resumable_session_id = $${i++}`);
			params.push(patch.resumable_session_id);
		}
		await sql.query(`update social_posts set ${sets.join(", ")} where id = $1`, params);
	} catch {}
	return (await readSocialPosts()).find((row) => row.id === id) ?? null;
}
function parsePlatforms(raw) {
	if (Array.isArray(raw)) return raw.filter((item) => SOCIAL_PLATFORMS.includes(item));
	if (typeof raw === "string") try {
		return parsePlatforms(JSON.parse(raw));
	} catch {
		return [];
	}
	return [];
}
function mapSocialJob(row) {
	const mode = row.mode === "publish" ? "publish" : "draft";
	const status = [
		"queued",
		"running",
		"needs_attention",
		"succeeded",
		"failed",
		"cancelled",
		"awaiting_approval"
	].includes(row.status) ? row.status : "queued";
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
		preferredRail: row.preferred_rail === "API" || row.preferred_rail === "BROWSER" ? row.preferred_rail : "AUTO",
		fallbackToBrowser: row.fallback_to_browser !== "0" && row.fallback_to_browser !== "false",
		youtube: parseYoutubeJobOptions(typeof row.options === "string" ? (() => {
			try {
				return JSON.parse(row.options);
			} catch {
				return null;
			}
		})() : row.options)
	};
}
async function readSocialJobs() {
	try {
		await ensureSocialSchema();
	} catch {}
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("social_jobs").select("*").order("created_at", { ascending: false }).limit(80);
		if (!error) return (data ?? []).map((row) => mapSocialJob(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	try {
		return (await (await (await load_agency_db()).localSql()).query("select * from social_jobs order by created_at desc limit 80")).map(mapSocialJob);
	} catch {
		return [];
	}
}
async function insertSocialJob(row) {
	try {
		await ensureSocialSchema();
	} catch {}
	const payload = {
		...row,
		media_asset_id: row.media_asset_id ?? null,
		options: row.options ?? null
	};
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("social_jobs").insert(payload);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
		if (!error) return mapSocialJob(payload);
	}
	await (await (await load_agency_db()).localSql()).query(`insert into social_jobs (
        id, client_id, asset_id, media_asset_id, caption, mode, status, platforms,
        idempotency_key, error_code, preferred_rail, fallback_to_browser, options,
        created_at, updated_at, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [
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
		payload.created_by
	]);
	return mapSocialJob(payload);
}
async function patchSocialJob(id, patch) {
	const stamp = nowIso();
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("social_jobs").update({
			...patch,
			updated_at: stamp
		}).eq("id", id);
		if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
	}
	try {
		const sql = await (await load_agency_db()).localSql();
		const sets = ["updated_at = $2"];
		const params = [id, stamp];
		let i = 3;
		if (patch.status !== void 0) {
			sets.push(`status = $${i++}`);
			params.push(patch.status);
		}
		if (patch.error_code !== void 0) {
			sets.push(`error_code = $${i++}`);
			params.push(patch.error_code);
		}
		await sql.query(`update social_jobs set ${sets.join(", ")} where id = $1`, params);
	} catch {}
	return (await readSocialJobs()).find((row) => row.id === id) ?? null;
}
function attachPostsToJobs(jobs, posts) {
	return jobs.map((job) => {
		const jobPosts = posts.filter((post) => post.jobId === job.id);
		return {
			...job,
			posts: jobPosts,
			...attachJobProgress(jobPosts)
		};
	});
}
async function peekSocialHealth() {
	const [key, startedAt, sessions, posts] = await Promise.all([
		(await load_app_settings()).readAppSetting("DAYTONA_API_KEY"),
		(await load_app_settings()).readAppSetting("DAYTONA_SOCIAL_STARTED_AT"),
		readSessions(),
		readSocialPosts()
	]);
	const configured = Boolean(key?.trim());
	return {
		state: !configured ? "not_configured" : startedAt ? "running" : "stopped",
		configured,
		needsLogin: SOCIAL_PLATFORMS.filter((platform) => sessions[platform] === "not_logged_in").length,
		failedJobs: posts.filter((post) => post.status === "failed").length,
		needsAttention: posts.filter((post) => post.status === "needs_attention").length
	};
}
async function collectAssets() {
	const [clients, progress] = await Promise.all([readClients(), readProgress()]);
	const assets = [];
	try {
		const { listAssets } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
		const library = await listAssets({ status: "READY" }, 40);
		for (const row of library) {
			if (!row.clientId || row.status !== "READY") continue;
			assets.push({
				id: row.id,
				clientId: row.clientId,
				kind: "library",
				label: row.title,
				mediaUrl: row.previewUrl,
				caption: null
			});
		}
	} catch {}
	const latestStage = /* @__PURE__ */ new Map();
	for (const row of progress) if (!latestStage.has(row.clientId)) latestStage.set(row.clientId, row);
	const thumbnails = await readThumbnailAssets();
	for (const client of clients) {
		if (client.deletedAt || client.status !== "ACTIVE") continue;
		const thumbs = thumbnails.filter((row) => row.clientId === client.id);
		for (const thumb of thumbs.slice(0, 3)) assets.push(thumb);
		const stage = latestStage.get(client.id);
		if (stage?.stage === "PUBLISHED") assets.push({
			id: `published:${client.id}:${stage.id}`,
			clientId: client.id,
			kind: "published",
			label: `Published · ${client.name}`,
			mediaUrl: client.channelThumbnail,
			caption: client.suggestedTitles?.groups[0]?.alternatives[0] ?? client.name
		});
		const idea = client.suggestedIdeas?.ideas[0];
		if (idea) assets.push({
			id: `idea:${client.id}`,
			clientId: client.id,
			kind: "title",
			label: idea.title,
			mediaUrl: client.channelThumbnail,
			caption: `${idea.title}\n${idea.rationale}`.slice(0, 400)
		});
		if (client.channelThumbnail) assets.push({
			id: `channel:${client.id}`,
			clientId: client.id,
			kind: "channel",
			label: `Channel art · ${client.name}`,
			mediaUrl: client.channelThumbnail,
			caption: client.name
		});
	}
	const seen = /* @__PURE__ */ new Set();
	return assets.filter((asset) => {
		const key = `${asset.clientId}:${asset.mediaUrl ?? ""}:${asset.label}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
async function readThumbnailAssets() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("thumbnail_messages").select("id,image_url,content,created_at,session_id").not("image_url", "is", null).order("created_at", { ascending: false }).limit(40);
		if (!error && data) {
			const sessions = await admin.from("thumbnail_sessions").select("id,client_id,title");
			const bySession = /* @__PURE__ */ new Map();
			for (const row of sessions.data ?? []) {
				const rec = row;
				if (rec.id && rec.client_id) bySession.set(rec.id, {
					clientId: rec.client_id,
					title: rec.title ?? "Thumbnail"
				});
			}
			return data.map((row) => {
				const session = bySession.get(String(row.session_id ?? ""));
				if (!session || !row.image_url) return null;
				return {
					id: `thumb:${String(row.id)}`,
					clientId: session.clientId,
					kind: "thumbnail",
					label: session.title || "Thumbnail",
					mediaUrl: String(row.image_url),
					caption: typeof row.content === "string" ? row.content.slice(0, 400) : session.title
				};
			}).filter((row) => Boolean(row));
		}
	}
	try {
		return (await (await (await load_agency_db()).localSql()).query(`select tm.id, tm.image_url, tm.content, ts.client_id, ts.title
       from thumbnail_messages tm
       join thumbnail_sessions ts on ts.id = tm.session_id
       where tm.image_url is not null
       order by tm.created_at desc
       limit 40`)).map((row) => ({
			id: `thumb:${String(row.id)}`,
			clientId: String(row.client_id),
			kind: "thumbnail",
			label: String(row.title ?? "Thumbnail"),
			mediaUrl: String(row.image_url),
			caption: typeof row.content === "string" ? row.content.slice(0, 400) : String(row.title ?? "")
		}));
	} catch {
		return [];
	}
}
var getSocialSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5fb31e2bc94bd8ae5543852dfccf22b3f98d1d936e57fb3c7c7a03adb0d2acec"));
var startSocialDesktop = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("9770f49fbc566f4cb07731964a388650dd54636b1427b41c3753f2ae52a7277e"));
var provisionLocationProxyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ country: string().min(2).max(4).optional() }).parse(input ?? {})).handler(createSsrRpc("ec7a20dad7215fd0f06e0f2be5450ab590be2aa8973061ec565cdb5b1eec8a28"));
var stopSocialDesktop = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("ade7c211721ebbf6deb4d810819dea2a05a40fb19060f8d9d2fdd4427aa64f57"));
var refreshSocialDesktop = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("ace65608d0ca62e3ffdec87ad94747c0e6ce1df6e764a60ae6d23199b61e2dc5"));
var PlatformSchema = _enum(SOCIAL_PLATFORMS);
var openSocialPlatform = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ platform: PlatformSchema }).parse(input)).handler(createSsrRpc("2eb20356ef7375d9dfc4fe99136ad461081d9880ee3bda2a717e7b7e14865c19"));
var markPlatformSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	platform: PlatformSchema,
	state: _enum([
		"not_logged_in",
		"logged_in",
		"unknown"
	])
}).parse(input)).handler(createSsrRpc("c8151e077ebe7b17a214c87fe096342b570dc1eb694c325e3662752ccc1fde37"));
var UploadSchema = object({
	clientId: string().min(1),
	assetId: string().min(1).optional(),
	mediaAssetId: string().min(1).optional(),
	platforms: array(PlatformSchema).min(1).max(4),
	caption: string().max(2200).optional(),
	mediaUrl: string().max(4e3).nullable().optional(),
	preferredRail: _enum([
		"AUTO",
		"API",
		"BROWSER"
	]).optional(),
	fallbackToBrowser: boolean().optional(),
	mode: _enum(["draft", "publish"]).optional(),
	youtube: object({
		title: string().max(100).optional(),
		description: string().max(5e3).optional(),
		tags: array(string().max(30)).max(30).optional(),
		privacyStatus: _enum([
			"private",
			"unlisted",
			"public"
		]).optional(),
		markShorts: boolean().optional(),
		thumbAssetId: string().max(80).nullable().optional(),
		categoryId: string().max(8).optional(),
		notifySubscribers: boolean().optional()
	}).optional()
});
var queueSocialUpload = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => UploadSchema.parse(input)).handler(createSsrRpc("ae7ae6312cea5e0906ba5dfcb14d619211ecd764ae07de8de21213ebf854f60b"));
var retrySocialUpload = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(createSsrRpc("01c9cd3d1756230a697d7d9436b3d6f8255f8f1c4af8259c69e1fe1d749ec0d5"));
var cancelSocialUpload = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(createSsrRpc("ccb9b41f247a11de692d723a4aff76b32ab9fb2db426302da5bf7fa83233fb03"));
var updateSocialPostStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	status: _enum([
		"needs_attention",
		"succeeded",
		"failed"
	]),
	externalUrl: string().max(1e3).nullable().optional()
}).parse(input)).handler(createSsrRpc("7f097877adb526fcad469fe2cf906a2a9b99257a517e66b33c0442153db2ef7d"));
function socialNewId() {
	return newId();
}
function socialNowIso() {
	return nowIso();
}
//#endregion
export { appendAudit, attachPostsToJobs, cancelSocialUpload, collectAssets, getSocialSnapshot, insertSocialJob, insertSocialPost, markPlatformSession, openSocialPlatform, patchSocialJob, patchSocialPost, peekSocialHealth, provisionLocationProxyFn, queueSocialUpload, readSessions, readSocialJobs, readSocialPosts, refreshSocialDesktop, retrySocialUpload, runningLock, socialNewId, socialNowIso, startSocialDesktop, stopSocialDesktop, updateSocialPostStatus, writeSessions };
