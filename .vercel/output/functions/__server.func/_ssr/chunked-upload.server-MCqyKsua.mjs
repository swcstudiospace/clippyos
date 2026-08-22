import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { open, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
//#region node_modules/.nitro/vite/services/ssr/assets/chunked-upload.server-MCqyKsua.js
function uploadPercent(session) {
	if (!session.totalBytes) return 0;
	return Math.min(100, Math.max(0, Math.round(session.bytesUploaded / session.totalBytes * 100)));
}
function phaseFromSession(status) {
	if (status === "INIT") return "init";
	if (status === "UPLOADING") return "uploading";
	if (status === "FINALIZING" || status === "PROCESSING") return "processing";
	return "publishing";
}
/**
* Shared chunked / resumable video upload engine.
* Tokens and upload URLs stay server-side. Chunks are streamed; the whole file
* is never held in one Buffer when the source can be ranged or spilled to disk.
*/
var MAX_CHUNK_RETRIES = 4;
var aborts = /* @__PURE__ */ new Map();
var adapters = /* @__PURE__ */ new Map();
function getAdapter(platform) {
	const adapter = adapters.get(platform);
	if (!adapter) throw new Error("PUBLISHER_UNAVAILABLE");
	return adapter;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function jitterWait(baseMs) {
	return baseMs + Math.floor(Math.random() * Math.max(250, baseMs * .25));
}
function isTrustedSource(url) {
	if (!url) return false;
	if (url.startsWith("data:")) return /^data:(video|image)\//i.test(url) || isTrustedImageUrl(url);
	return isTrustedImageUrl(url);
}
var tempFiles = /* @__PURE__ */ new Map();
async function probeSource(url, maxBytes) {
	if (!isTrustedSource(url)) throw new Error("UNTRUSTED_IMAGE");
	if (url.startsWith("data:")) {
		const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
		if (!match) throw new Error("UNTRUSTED_IMAGE");
		const bytes = Math.floor(match[2].length * 3 / 4);
		if (bytes > maxBytes) throw new Error("MEDIA_TOO_LARGE");
		return {
			totalBytes: bytes,
			mime: match[1]
		};
	}
	const probe = await fetch(url, {
		method: "HEAD",
		signal: AbortSignal.timeout(15e3),
		redirect: "follow"
	}).catch(() => null);
	if (probe?.ok) {
		const mime = probe.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
		const totalBytes = Number(probe.headers.get("content-length")) || 0;
		if (totalBytes > maxBytes) throw new Error("MEDIA_TOO_LARGE");
		if (totalBytes) return {
			totalBytes,
			mime
		};
	}
	const range = await fetch(url, {
		headers: { Range: "bytes=0-0" },
		signal: AbortSignal.timeout(2e4),
		redirect: "follow"
	});
	if (!range.ok && range.status !== 206) throw new Error("MEDIA_FETCH_FAILED");
	const mime = range.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
	const rangeTotal = range.headers.get("content-range")?.split("/")[1];
	const totalBytes = Number(rangeTotal) || Number(range.headers.get("content-length")) || 0;
	await range.arrayBuffer().catch(() => void 0);
	if (totalBytes > maxBytes) throw new Error("MEDIA_TOO_LARGE");
	return {
		totalBytes,
		mime
	};
}
async function createSourceReader(url, maxBytes, sessionId) {
	if (!isTrustedSource(url)) throw new Error("UNTRUSTED_IMAGE");
	if (url.startsWith("data:")) {
		const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
		if (!match) throw new Error("UNTRUSTED_IMAGE");
		const mime = match[1];
		const bytes = Buffer.from(match[2], "base64");
		if (bytes.byteLength > maxBytes) throw new Error("MEDIA_TOO_LARGE");
		return {
			totalBytes: bytes.byteLength,
			mime,
			async read(offset, length) {
				return new Uint8Array(bytes.subarray(offset, offset + length));
			},
			async close() {}
		};
	}
	const probe = await fetch(url, {
		headers: { Range: "bytes=0-0" },
		signal: AbortSignal.timeout(2e4),
		redirect: "follow"
	});
	if (!probe.ok && probe.status !== 206) throw new Error("MEDIA_FETCH_FAILED");
	const mime = probe.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
	const rangeTotal = probe.headers.get("content-range")?.split("/")[1];
	const lengthHeader = Number(probe.headers.get("content-length"));
	const totalBytes = Number(rangeTotal) || (probe.status === 206 ? 0 : lengthHeader) || 0;
	const supportsRange = probe.status === 206 && totalBytes > 0;
	if (totalBytes > maxBytes) throw new Error("MEDIA_TOO_LARGE");
	await probe.arrayBuffer().catch(() => void 0);
	if (supportsRange) return {
		totalBytes,
		mime,
		async read(offset, length) {
			const end = Math.min(offset + length, totalBytes) - 1;
			const res = await fetch(url, {
				headers: { Range: `bytes=${offset}-${end}` },
				signal: AbortSignal.timeout(12e4),
				redirect: "follow"
			});
			if (!res.ok && res.status !== 206) throw new Error("MEDIA_FETCH_FAILED");
			return new Uint8Array(await res.arrayBuffer());
		},
		async close() {}
	};
	const full = await fetch(url, {
		signal: AbortSignal.timeout(18e4),
		redirect: "follow"
	});
	if (!full.ok || !full.body) throw new Error("MEDIA_FETCH_FAILED");
	const tmp = join(tmpdir(), `clippy-upload-${sessionId}-${createHash("sha1").update(url).digest("hex").slice(0, 12)}`);
	const fh = await open(tmp, "w");
	let written = 0;
	const reader = full.body.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value) continue;
			written += value.byteLength;
			if (written > maxBytes) throw new Error("MEDIA_TOO_LARGE");
			await fh.write(value);
		}
	} finally {
		await fh.close();
		reader.releaseLock();
	}
	tempFiles.set(sessionId, tmp);
	return {
		totalBytes: written,
		mime: full.headers.get("content-type")?.split(";")[0]?.trim() || mime,
		async read(offset, length) {
			const handle = await open(tmp, "r");
			try {
				const buf = Buffer.alloc(length);
				const result = await handle.read(buf, 0, length, offset);
				return new Uint8Array(buf.subarray(0, result.bytesRead));
			} finally {
				await handle.close();
			}
		},
		async close() {
			await unlink(tmp).catch(() => void 0);
			tempFiles.delete(sessionId);
		}
	};
}
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
function rowToSession(row) {
	let extras = {};
	if (typeof row.platform_extras === "string" && row.platform_extras) try {
		extras = JSON.parse(row.platform_extras);
	} catch {
		extras = {};
	}
	return {
		id: String(row.id ?? ""),
		jobId: row.job_id == null ? null : String(row.job_id),
		postId: row.post_id == null ? null : String(row.post_id),
		platform: row.platform ?? "instagram",
		sourceUrl: String(row.source_url ?? ""),
		totalBytes: Number(row.total_bytes ?? 0),
		chunkSizeBytes: Number(row.chunk_size_bytes ?? 0),
		mimeType: String(row.mime_type ?? "application/octet-stream"),
		externalSessionId: row.external_session_id == null ? null : String(row.external_session_id),
		externalUploadUrl: row.external_upload_url == null ? null : String(row.external_upload_url),
		nextSegmentIndex: Number(row.next_segment_index ?? 0),
		bytesUploaded: Number(row.bytes_uploaded ?? 0),
		status: row.status ?? "INIT",
		lastError: row.last_error == null ? null : String(row.last_error),
		attemptCount: Number(row.attempt_count ?? 0),
		platformExtras: extras,
		createdAt: String(row.created_at ?? ""),
		updatedAt: String(row.updated_at ?? "")
	};
}
async function ensureUploadSessionSchema() {
	await (await (await load_agency_db()).localSql()).query(`
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
}
async function persistSession(session) {
	session.updatedAt = nowIso();
	try {
		await ensureUploadSessionSchema();
	} catch {}
	const extras = JSON.stringify(session.platformExtras ?? {});
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("social_upload_sessions").upsert({
			id: session.id,
			job_id: session.jobId,
			post_id: session.postId,
			platform: session.platform,
			source_url: session.sourceUrl,
			total_bytes: session.totalBytes,
			chunk_size_bytes: session.chunkSizeBytes,
			mime_type: session.mimeType,
			external_session_id: session.externalSessionId,
			external_upload_url: session.externalUploadUrl,
			next_segment_index: session.nextSegmentIndex,
			bytes_uploaded: session.bytesUploaded,
			status: session.status,
			last_error: session.lastError,
			attempt_count: session.attemptCount,
			platform_extras: extras,
			created_at: session.createdAt,
			updated_at: session.updatedAt
		});
		if (!error) return;
	}
	await (await (await load_agency_db()).localSql()).query(`insert into social_upload_sessions (
      id, job_id, post_id, platform, source_url, total_bytes, chunk_size_bytes, mime_type,
      external_session_id, external_upload_url, next_segment_index, bytes_uploaded, status,
      last_error, attempt_count, platform_extras, created_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    on conflict (id) do update set
      job_id = excluded.job_id,
      post_id = excluded.post_id,
      total_bytes = excluded.total_bytes,
      chunk_size_bytes = excluded.chunk_size_bytes,
      mime_type = excluded.mime_type,
      external_session_id = excluded.external_session_id,
      external_upload_url = excluded.external_upload_url,
      next_segment_index = excluded.next_segment_index,
      bytes_uploaded = excluded.bytes_uploaded,
      status = excluded.status,
      last_error = excluded.last_error,
      attempt_count = excluded.attempt_count,
      platform_extras = excluded.platform_extras,
      updated_at = excluded.updated_at`, [
		session.id,
		session.jobId,
		session.postId,
		session.platform,
		session.sourceUrl,
		session.totalBytes,
		session.chunkSizeBytes,
		session.mimeType,
		session.externalSessionId,
		session.externalUploadUrl,
		session.nextSegmentIndex,
		session.bytesUploaded,
		session.status,
		session.lastError,
		session.attemptCount,
		extras,
		session.createdAt,
		session.updatedAt
	]);
}
async function readUploadSession(id) {
	try {
		await ensureUploadSessionSchema();
	} catch {}
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("social_upload_sessions").select("*").eq("id", id).maybeSingle();
		if (!error && data) return rowToSession(data);
	}
	try {
		const rows = await (await (await load_agency_db()).localSql()).query("select * from social_upload_sessions where id = $1 limit 1", [id]);
		return rows[0] ? rowToSession(rows[0]) : null;
	} catch {
		return null;
	}
}
async function findSessionForPost(postId, platform) {
	try {
		await ensureUploadSessionSchema();
		const rows = await (await (await load_agency_db()).localSql()).query(`select * from social_upload_sessions
       where post_id = $1 and platform = $2
       order by updated_at desc limit 1`, [postId, platform]);
		return rows[0] ? rowToSession(rows[0]) : null;
	} catch {
		return null;
	}
}
function classify(status) {
	if (status === 200 || status === 201 || status === 202 || status === 204 || status === 206) return "ok";
	if (status === 401) return "auth";
	if (status === 408 || status === 409 || status === 425 || status === 429) return "retry";
	if (status >= 500 || status === 0) return "retry";
	return "permanent";
}
async function emitProgress(session, onProgress, phase) {
	const percent = uploadPercent(session);
	await onProgress?.({
		bytesUploaded: session.bytesUploaded,
		totalBytes: session.totalBytes,
		percent,
		segmentIndex: session.nextSegmentIndex,
		segmentCount: session.chunkSizeBytes ? Math.max(1, Math.ceil(session.totalBytes / session.chunkSizeBytes)) : 1,
		phase: phase ?? phaseFromSession(session.status),
		sessionId: session.id
	});
}
async function initChunkedSession(input) {
	await import("./chunked-adapters.server-la_KkjCS.mjs");
	const adapter = getAdapter(input.platform);
	if (input.sessionId) {
		const existing = await readUploadSession(input.sessionId);
		if (existing && existing.platform === input.platform) return existing;
	}
	if (input.postId) {
		const existing = await findSessionForPost(input.postId, input.platform);
		if (existing && existing.sourceUrl === input.sourceUrl && existing.status !== "SUCCEEDED" && existing.status !== "CANCELED") return existing;
	}
	const probed = await probeSource(input.sourceUrl, adapter.maxBytes);
	const chunkSize = adapter.planChunkSize(probed.totalBytes || 1);
	const stamp = nowIso();
	const session = {
		id: randomUUID(),
		jobId: input.jobId ?? null,
		postId: input.postId ?? null,
		platform: input.platform,
		sourceUrl: input.sourceUrl,
		totalBytes: probed.totalBytes,
		chunkSizeBytes: chunkSize,
		mimeType: probed.mime,
		externalSessionId: null,
		externalUploadUrl: null,
		nextSegmentIndex: 0,
		bytesUploaded: 0,
		status: "INIT",
		lastError: null,
		attemptCount: 0,
		platformExtras: {
			...input.extras ?? {},
			mime: probed.mime
		},
		createdAt: stamp,
		updatedAt: stamp
	};
	await persistSession(session);
	return session;
}
async function uploadUntilDone(sessionId, opts = {}) {
	await import("./chunked-adapters.server-la_KkjCS.mjs");
	let session = await readUploadSession(sessionId);
	if (!session) throw new Error("UPLOAD_SESSION_MISSING");
	if (session.status === "SUCCEEDED") return session;
	if (session.status === "CANCELED") throw new Error("JOB_CANCELLED");
	const adapter = getAdapter(session.platform);
	const controller = new AbortController();
	aborts.set(sessionId, controller);
	const aborted = () => opts.signal?.aborted || controller.signal.aborted;
	const reader = await createSourceReader(session.sourceUrl, adapter.maxBytes, session.id);
	session.totalBytes = reader.totalBytes || session.totalBytes;
	session.mimeType = reader.mime || session.mimeType;
	if (!session.chunkSizeBytes) session.chunkSizeBytes = adapter.planChunkSize(session.totalBytes);
	try {
		if (!session.externalSessionId) {
			session.status = "INIT";
			await persistSession(session);
			await emitProgress(session, opts.onProgress, "init");
			const inited = await adapter.init({
				session,
				extras: session.platformExtras
			});
			session.externalSessionId = inited.externalSessionId;
			session.externalUploadUrl = inited.uploadUrl ?? null;
			session.platformExtras = {
				...session.platformExtras,
				...inited.extras ?? {}
			};
			session.status = "UPLOADING";
			await persistSession(session);
		} else {
			session.status = "UPLOADING";
			await persistSession(session);
		}
		const total = session.totalBytes;
		const size = session.chunkSizeBytes;
		while (session.bytesUploaded < total) {
			if (aborted()) {
				session.status = "CANCELED";
				session.lastError = "Cancelled.";
				await persistSession(session);
				throw new Error("JOB_CANCELLED");
			}
			const offset = session.bytesUploaded;
			const length = Math.min(size, total - offset);
			const bytes = await reader.read(offset, length);
			const index = session.nextSegmentIndex;
			let refreshed = false;
			let delay = 1e3;
			let lastStatus = 0;
			let lastBody = "";
			let accepted = 0;
			for (let attempt = 0; attempt < MAX_CHUNK_RETRIES; attempt += 1) {
				if (aborted()) throw new Error("JOB_CANCELLED");
				session.attemptCount += 1;
				try {
					const result = await adapter.uploadChunk({
						session,
						extras: session.platformExtras
					}, {
						offset,
						index,
						bytes,
						total
					});
					lastStatus = result.status;
					lastBody = (result.errorBody ?? "").slice(0, 240);
					const kind = result.ok ? "ok" : classify(result.status);
					if (kind === "ok") {
						accepted = result.bytesAccepted ?? bytes.byteLength;
						break;
					}
					if (kind === "auth" && !refreshed) {
						await adapter.refreshAuth({
							session,
							extras: session.platformExtras
						});
						refreshed = true;
						continue;
					}
					if (kind === "permanent") {
						session.status = "FAILED";
						session.lastError = lastBody || `Upload rejected (${result.status})`;
						await persistSession(session);
						throw new Error("PUBLISHER_REJECTED");
					}
				} catch (error) {
					if (error instanceof Error && (error.message === "PUBLISHER_REJECTED" || error.message === "YOUTUBE_QUOTA" || error.message === "YT_INVALID_METADATA" || error.message === "JOB_CANCELLED")) throw error;
					lastStatus = 0;
					lastBody = error instanceof Error ? error.message : "network";
				}
				await emitProgress(session, opts.onProgress, "uploading");
				const wait = lastStatus === 429 ? jitterWait(delay * 2) : jitterWait(delay);
				await sleep(Math.min(wait, 2e4));
				delay = Math.min(delay * 2, 16e3);
				accepted = 0;
			}
			if (!accepted) {
				session.status = "FAILED";
				session.lastError = lastBody || `Chunk failed after retries (${lastStatus})`;
				await persistSession(session);
				throw new Error("PUBLISHER_REJECTED");
			}
			session.bytesUploaded = offset + accepted;
			session.nextSegmentIndex = index + 1;
			session.lastError = null;
			await persistSession(session);
			await emitProgress(session, opts.onProgress, "uploading");
		}
		session.status = "FINALIZING";
		await persistSession(session);
		await emitProgress(session, opts.onProgress, "processing");
		if (adapter.finalize) {
			session.status = "PROCESSING";
			await persistSession(session);
			await adapter.finalize({
				session,
				extras: session.platformExtras
			});
		}
		session.status = "SUCCEEDED";
		session.bytesUploaded = session.totalBytes;
		session.lastError = null;
		await persistSession(session);
		await emitProgress(session, opts.onProgress, "publishing");
		return session;
	} catch (error) {
		if (session.status !== "CANCELED" && session.status !== "FAILED") {
			session.status = "FAILED";
			session.lastError = error instanceof Error ? error.message : "Upload failed";
			await persistSession(session).catch(() => void 0);
		}
		throw error;
	} finally {
		aborts.delete(sessionId);
		await reader.close().catch(() => void 0);
	}
}
async function cancelChunkedUpload(sessionId) {
	aborts.get(sessionId)?.abort();
	const session = await readUploadSession(sessionId);
	if (!session) return;
	if (session.status === "SUCCEEDED") return;
	session.status = "CANCELED";
	session.lastError = "Cancelled.";
	await persistSession(session);
	const tmp = tempFiles.get(sessionId);
	if (tmp) await unlink(tmp).catch(() => void 0);
}
async function cancelChunkedUploadsForJob(jobId) {
	try {
		await ensureUploadSessionSchema();
		const rows = await (await (await load_agency_db()).localSql()).query("select id from social_upload_sessions where job_id = $1", [jobId]);
		for (const row of rows) await cancelChunkedUpload(String(row.id));
	} catch {}
}
async function runChunkedUpload(input) {
	return uploadUntilDone((await initChunkedSession(input)).id, {
		onProgress: input.onProgress,
		signal: input.signal
	});
}
//#endregion
export { cancelChunkedUploadsForJob, runChunkedUpload };
