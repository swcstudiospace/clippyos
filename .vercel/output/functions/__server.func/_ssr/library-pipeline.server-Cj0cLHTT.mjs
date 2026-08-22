import { d as __exportAll } from "./ssr.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { s as writeAuditLog } from "./autonomy-audit.server-vcgB9vCa.mjs";
import { n as emitAutonomyEvent } from "./autonomy-events.server-DCl-_J_B.mjs";
import { d as writeLibraryBytes, i as kindFromMime, l as sniffMime, n as extFromMime, o as makeStorageKey, r as hashBytes, s as readLibraryBytes, t as deleteLibraryBytes } from "./library-storage.server-DfxOTjeL.mjs";
import { p as PRESET_SIZE, v as cuesToSrt, y as cuesToVtt } from "./library-D-Mt5rXw.mjs";
import { _ as patchAsset, a as getCaption, b as readMediaSettings, c as insertAsset, d as insertVersion, f as libraryNewId, g as listRenders, i as getAsset, l as insertCaption, n as derivedRenders, o as getRender, r as findByChecksum, s as getVersionRow, t as aspectLabel, u as insertRender, v as patchCaption, y as patchRender } from "./library.server-vya-JVML.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
import { join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
//#region node_modules/.nitro/vite/services/ssr/assets/library-pipeline.server-Cj0cLHTT.js
/**
* Ingest, caption, and FFmpeg render workers.
* Never auto-starts the Social Machine. Job-scoped work stays local unless Daytona render is on.
*/
var library_pipeline_server_exports = /* @__PURE__ */ __exportAll({
	archiveAsset: () => archiveAsset,
	cancelRender: () => cancelRender,
	captionExport: () => captionExport,
	cuesToSrt: () => cuesToSrt,
	cuesToVtt: () => cuesToVtt,
	generateCaptions: () => generateCaptions,
	ingestBytes: () => ingestBytes,
	ingestFromUrl: () => ingestFromUrl,
	ingestLinkAsset: () => ingestLinkAsset,
	ingestStreamClip: () => ingestStreamClip,
	ingestThumbnailMessage: () => ingestThumbnailMessage,
	isTrustedLibraryUrl: () => isTrustedLibraryUrl,
	pumpRenderQueue: () => pumpRenderQueue,
	queueRender: () => queueRender,
	resolvePublishAsset: () => resolvePublishAsset,
	retryRender: () => retryRender,
	saveCues: () => saveCues,
	testRender: () => testRender,
	uploadSrt: () => uploadSrt
});
var FFMPEG = process.env.FFMPEG_PATH?.trim() || "/usr/local/bin/ffmpeg";
var FFPROBE = process.env.FFPROBE_PATH?.trim() || "/usr/local/bin/ffprobe";
var STT_MAX_SEC = 900;
var FETCH_TIMEOUT_MS = 45e3;
var cancelFlags = /* @__PURE__ */ new Set();
var renderState = { active: 0 };
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
async function audit(actorId, action, entityId, result = "ok") {
	try {
		await writeAuditLog({
			requestId: `${action}:${entityId}`,
			actor: {
				source: "api",
				keyId: actorId,
				label: actorId.slice(0, 80)
			},
			action,
			entityType: "media_asset",
			entityId,
			result
		});
	} catch {}
}
function runCmd(bin, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(bin, args, { stdio: [
			"ignore",
			"pipe",
			"pipe"
		] });
		let stdout = "";
		let stderr = "";
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
		}, opts.timeoutMs ?? 18e4);
		const poll = setInterval(() => {
			if (opts.onCancel?.()) child.kill("SIGKILL");
		}, 400);
		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString("utf8");
			if (stdout.length > 2e5) stdout = stdout.slice(-8e4);
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString("utf8");
			if (stderr.length > 2e5) stderr = stderr.slice(-8e4);
		});
		child.on("error", (error) => {
			clearTimeout(timer);
			clearInterval(poll);
			reject(error);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			clearInterval(poll);
			resolve({
				code: code ?? 1,
				stdout,
				stderr
			});
		});
	});
}
async function probeFile(path) {
	const empty = {
		durationSec: null,
		width: null,
		height: null,
		mime: null
	};
	const fromFfmpeg = async () => {
		const result = await runCmd(FFMPEG, [
			"-hide_banner",
			"-i",
			path
		], { timeoutMs: 3e4 });
		const text = `${result.stdout}\n${result.stderr}`;
		const dur = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
		const dim = /Stream #.*Video:.*\s(\d{2,5})x(\d{2,5})/.exec(text);
		const durationSec = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null;
		return {
			durationSec: Number.isFinite(durationSec) ? durationSec : null,
			width: dim ? Number(dim[1]) : null,
			height: dim ? Number(dim[2]) : null,
			mime: null
		};
	};
	try {
		const result = await runCmd(FFPROBE, [
			"-v",
			"error",
			"-show_entries",
			"format=duration,format_name:stream=width,height,codec_type",
			"-of",
			"json",
			path
		], { timeoutMs: 3e4 });
		if (result.code !== 0) return fromFfmpeg();
		const parsed = JSON.parse(result.stdout);
		const duration = parsed.format?.duration ? Number(parsed.format.duration) : null;
		const video = parsed.streams?.find((row) => row.codec_type === "video");
		return {
			durationSec: Number.isFinite(duration) ? duration : null,
			width: video?.width ?? null,
			height: video?.height ?? null,
			mime: null
		};
	} catch {
		try {
			return await fromFfmpeg();
		} catch {
			return empty;
		}
	}
}
async function ingestBytes(input) {
	const max = (await readMediaSettings()).maxUploadMb * 1024 * 1024;
	if (input.bytes.length > max) throw new Error("MEDIA_TOO_LARGE");
	const mime = sniffMime(input.bytes, input.mimeHint ?? "application/octet-stream", input.filename);
	const kind = kindFromMime(mime);
	const checksum = await hashBytes(input.bytes);
	const existing = await findByChecksum(input.clientId, checksum);
	if (existing) return {
		asset: existing,
		duplicate: true
	};
	const assetId = libraryNewId();
	const versionId = libraryNewId();
	const ext = extFromMime(mime, input.filename);
	const key = makeStorageKey(assetId, versionId, ext);
	await writeLibraryBytes(key, input.bytes);
	const title = sanitizeText(input.title || input.filename || "Untitled").slice(0, 160) || "Untitled";
	await insertAsset({
		id: assetId,
		client_id: input.clientId,
		kind,
		title,
		source: input.source,
		source_ref: input.sourceRef ?? null,
		status: "PROCESSING",
		mime_type: mime,
		byte_size: input.bytes.length,
		checksum,
		current_version_id: versionId,
		parent_asset_id: input.parentAssetId ?? null,
		tags: input.tags,
		created_by: input.actorId
	});
	await insertVersion({
		id: versionId,
		asset_id: assetId,
		version_number: 1,
		storage_key: key,
		mime_type: mime,
		byte_size: input.bytes.length,
		checksum,
		note: input.note ?? "original"
	});
	await finalizeProbe(assetId, versionId, key, mime, input.bytes.length, checksum);
	await audit(input.actorId, "library.ingest", assetId);
	emitAutonomyEvent({
		type: "library.asset.ready",
		entityType: "media_asset",
		entityId: assetId,
		data: {
			source: input.source,
			kind,
			clientId: input.clientId
		}
	});
	const asset = await getAsset(assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	return {
		asset,
		duplicate: false
	};
}
async function finalizeProbe(assetId, versionId, key, mime, byteSize, checksum) {
	const { storagePath } = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
	const probe = await probeFile(storagePath(key));
	await patchAsset(assetId, {
		status: "READY",
		mime_type: mime,
		byte_size: byteSize,
		checksum,
		current_version_id: versionId,
		duration_sec: probe.durationSec,
		width: probe.width,
		height: probe.height,
		aspect_ratio: aspectLabel(probe.width, probe.height)
	});
}
var URL_HOST_ALLOW = [
	"clips.twitch.tv",
	"static-cdn.jtvnw.net",
	"d1m7jfoe9zdc1j.cloudfront.net",
	"i.ytimg.com",
	"img.youtube.com",
	"i.imgur.com",
	"pbs.twimg.com",
	"video.twimg.com",
	"abs.twimg.com"
];
function hostAllowed(host) {
	const h = host.toLowerCase();
	if (URL_HOST_ALLOW.includes(h)) return true;
	if (h.endsWith(".twitch.tv") || h.endsWith(".jtvnw.net")) return true;
	if (h.endsWith(".tiktokcdn.com") || h.endsWith(".tiktok.com") || h.endsWith(".muscdn.com")) return true;
	if (h.endsWith(".cdninstagram.com") || h.endsWith(".fbcdn.net")) return true;
	if (h.endsWith(".googleusercontent.com") || h.endsWith(".ggpht.com")) return true;
	return false;
}
function isTrustedLibraryUrl(url) {
	if (!url) return false;
	if (url.startsWith("data:")) return /^data:(video|image|audio)\//i.test(url);
	if (isTrustedImageUrl(url)) return true;
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	if (parsed.protocol !== "https:") return false;
	if (parsed.username || parsed.password) return false;
	return hostAllowed(parsed.hostname.replace(/^\[|\]$/g, ""));
}
async function ingestFromUrl(input) {
	if (!isTrustedLibraryUrl(input.url) && !isTrustedImageUrl(input.url)) throw new Error("UNTRUSTED_URL");
	if (input.url.startsWith("data:")) {
		const match = /^data:([^;]+);base64,(.+)$/i.exec(input.url);
		if (!match) throw new Error("UNTRUSTED_URL");
		const bytes = Buffer.from(match[2], "base64");
		return ingestBytes({
			actorId: input.actorId,
			clientId: input.clientId,
			title: input.title ?? "Imported",
			mimeHint: match[1],
			bytes,
			source: input.source ?? "URL_IMPORT",
			sourceRef: "data-url",
			tags: input.tags
		});
	}
	const max = (await readMediaSettings()).maxUploadMb * 1024 * 1024;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const response = await fetch(input.url, {
			signal: controller.signal,
			redirect: "follow",
			headers: { "User-Agent": "ClippyAdmin/1.0" }
		});
		if (!response.ok) throw new Error("UNTRUSTED_URL");
		const finalUrl = response.url || input.url;
		if (!isTrustedLibraryUrl(finalUrl) && !isTrustedImageUrl(finalUrl)) throw new Error("UNTRUSTED_URL");
		if (Number(response.headers.get("content-length") ?? 0) > max) throw new Error("MEDIA_TOO_LARGE");
		const buf = Buffer.from(await response.arrayBuffer());
		if (buf.length > max) throw new Error("MEDIA_TOO_LARGE");
		const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
		const name = new URL(finalUrl).pathname.split("/").pop() || "import";
		return ingestBytes({
			actorId: input.actorId,
			clientId: input.clientId,
			title: input.title || name,
			filename: name,
			mimeHint: mime,
			bytes: buf,
			source: input.source ?? "URL_IMPORT",
			sourceRef: finalUrl.slice(0, 500),
			tags: input.tags
		});
	} catch (error) {
		if (error instanceof Error && (error.message === "MEDIA_TOO_LARGE" || error.message === "UNTRUSTED_URL")) throw error;
		throw new Error("UNTRUSTED_URL");
	} finally {
		clearTimeout(timer);
	}
}
async function ingestLinkAsset(input) {
	const assetId = libraryNewId();
	await insertAsset({
		id: assetId,
		client_id: input.clientId,
		kind: input.kind ?? "VIDEO",
		title: sanitizeText(input.title).slice(0, 160) || "Clip",
		source: input.source,
		source_ref: input.url.slice(0, 500),
		status: "READY",
		duration_sec: input.durationSec ?? null,
		mime_type: "text/uri-list",
		tags: input.tags,
		created_by: input.actorId
	});
	await audit(input.actorId, "library.ingest_link", assetId);
	const asset = await getAsset(assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	return asset;
}
async function ingestStreamClip(input) {
	const { getClipById } = await import("./stream.server-Cb1Ya4Jr.mjs");
	const clip = await getClipById(input.clipId);
	if (!clip) throw new Error("ASSET_MISSING");
	if (clip.thumbnailUrl && (isTrustedLibraryUrl(clip.thumbnailUrl) || isTrustedImageUrl(clip.thumbnailUrl))) try {
		const result = await ingestFromUrl({
			actorId: input.actorId,
			clientId: clip.clientId,
			url: clip.thumbnailUrl,
			title: clip.title || "Twitch clip",
			source: "TWITCH_CLIP",
			tags: ["twitch"]
		});
		await patchAsset(result.asset.id, { title: clip.title || result.asset.title });
		const asset = await getAsset(result.asset.id);
		if (asset) return asset;
	} catch {}
	if (!clip.url) throw new Error("ASSET_MISSING");
	return ingestLinkAsset({
		actorId: input.actorId,
		clientId: clip.clientId,
		title: clip.title || "Twitch clip",
		url: clip.url,
		source: "TWITCH_CLIP",
		durationSec: clip.durationSec,
		thumbnailUrl: clip.thumbnailUrl,
		tags: ["twitch"]
	});
}
async function ingestThumbnailMessage(input) {
	const { getAgencyAdmin, localSql } = await import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
	const admin = await getAgencyAdmin();
	let imageUrl = null;
	let clientId = null;
	let title = "Thumbnail";
	if (admin) {
		const { data } = await admin.from("thumbnail_messages").select("id,image_url,session_id,content").eq("id", input.messageId).maybeSingle();
		const rec = data;
		imageUrl = rec?.image_url ?? null;
		if (rec?.session_id) {
			const s = (await admin.from("thumbnail_sessions").select("client_id,title").eq("id", rec.session_id).maybeSingle()).data;
			clientId = s?.client_id ?? null;
			title = s?.title || rec.content?.slice(0, 80) || "Thumbnail";
		}
	}
	if (!imageUrl) {
		const rec = (await (await localSql()).query(`select tm.image_url, tm.content, ts.client_id, ts.title
       from thumbnail_messages tm
       join thumbnail_sessions ts on ts.id = tm.session_id
       where tm.id = $1 limit 1`, [input.messageId]))[0];
		imageUrl = rec ? String(rec.image_url ?? "") : null;
		clientId = rec ? rec.client_id ? String(rec.client_id) : null : null;
		title = rec ? String(rec.title || rec.content || "Thumbnail") : "Thumbnail";
	}
	if (!imageUrl) throw new Error("ASSET_MISSING");
	return (await ingestFromUrl({
		actorId: input.actorId,
		clientId,
		url: imageUrl,
		title,
		source: "THUMBNAIL_GEN",
		tags: ["thumbnail"]
	})).asset;
}
function parseSrt(raw) {
	const blocks = raw.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n\n+/);
	const cues = [];
	for (const block of blocks) {
		const lines = block.split("\n").filter(Boolean);
		if (lines.length < 2) continue;
		const timeLine = lines.find((line) => line.includes("-->"));
		if (!timeLine) continue;
		const match = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(timeLine);
		if (!match) continue;
		const toMs = (h, m, s, f) => Number(h) * 36e5 + Number(m) * 6e4 + Number(s) * 1e3 + Number(f.padEnd(3, "0").slice(0, 3));
		const text = lines.slice(lines.indexOf(timeLine) + 1).join(" ").replace(/<[^>]+>/g, "").trim();
		if (!text) continue;
		cues.push({
			startMs: toMs(match[1], match[2], match[3], match[4]),
			endMs: toMs(match[5], match[6], match[7], match[8]),
			text: text.slice(0, 280)
		});
	}
	return cues;
}
function wordsToCues(words) {
	const cues = [];
	let bucket = [];
	const flush = () => {
		if (!bucket.length) return;
		cues.push({
			startMs: Math.round(bucket[0].start * 1e3),
			endMs: Math.round(bucket[bucket.length - 1].end * 1e3),
			text: bucket.map((w) => w.text).join(" ").replace(/\s+/g, " ").trim()
		});
		bucket = [];
	};
	for (const word of words) {
		if (!word.text.trim()) continue;
		if (bucket.length >= 10 || bucket.length && word.start - bucket[0].start > 3.4 || bucket.length && word.start - bucket[bucket.length - 1].end > .8) flush();
		bucket.push(word);
	}
	flush();
	return cues;
}
async function generateCaptions(input) {
	const asset = await getAsset(input.assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	if (asset.kind !== "VIDEO" && asset.kind !== "AUDIO") throw new Error("LIBRARY_KIND_UNSUPPORTED");
	if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
	if (!(await readMediaSettings()).transcriptionConfigured) throw new Error("CAPTION_ENGINE_MISSING");
	const version = asset.currentVersionId ? await getVersionRow(asset.currentVersionId) : null;
	if (!version) throw new Error("ASSET_MISSING");
	const track = await insertCaption({
		id: libraryNewId(),
		asset_id: asset.id,
		language: input.language ?? "en",
		status: "TRANSCRIBING",
		engine: "XAI_OR_PROVIDER"
	});
	runTranscription({
		trackId: track.id,
		storageKey: version.storageKey,
		language: input.language ?? "en"
	});
	await audit(input.actorId, "library.generate_captions", track.id);
	return track;
}
async function runTranscription(input) {
	const dir = await mkdtemp(join(tmpdir(), "clippy-stt-"));
	try {
		const { storagePath } = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
		const source = storagePath(input.storageKey);
		const wav = join(dir, "audio.wav");
		if ((await runCmd(FFMPEG, [
			"-y",
			"-i",
			source,
			"-vn",
			"-ac",
			"1",
			"-ar",
			"16000",
			"-t",
			String(STT_MAX_SEC),
			wav
		], { timeoutMs: 12e4 })).code !== 0) throw new Error("RENDER_FAILED");
		const audio = await readFile(wav);
		const apiKey = process.env.XAI_API_KEY?.trim();
		if (!apiKey) throw new Error("CAPTION_ENGINE_MISSING");
		const form = new FormData();
		form.append("file", new Blob([new Uint8Array(audio)], { type: "audio/wav" }), "audio.wav");
		form.append("language", input.language);
		form.append("format", "true");
		const response = await fetch("https://api.x.ai/v1/stt", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}` },
			body: form
		});
		if (!response.ok) throw new Error("CAPTION_ENGINE_MISSING");
		const body = await response.json();
		let cues = wordsToCues((body.words ?? []).map((w) => ({
			text: String(w.text ?? ""),
			start: Number(w.start ?? 0),
			end: Number(w.end ?? 0)
		})).filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end)));
		if (!cues.length && body.text?.trim()) cues = [{
			startMs: 0,
			endMs: 3e3,
			text: body.text.trim().slice(0, 280)
		}];
		const srt = cuesToSrt(cues);
		const key = makeStorageKey(input.trackId, "captions", "srt");
		await writeLibraryBytes(key, Buffer.from(srt, "utf8"));
		await patchCaption(input.trackId, {
			status: "READY",
			cues,
			format: "JSON_CUES",
			storage_key: key,
			error: null
		});
		emitAutonomyEvent({
			type: "library.caption.ready",
			entityType: "caption_track",
			entityId: input.trackId,
			data: { cues: cues.length }
		});
	} catch (error) {
		const code = error instanceof Error ? error.message : "CAPTION_ENGINE_MISSING";
		await patchCaption(input.trackId, {
			status: "FAILED",
			error: code
		});
	} finally {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
async function uploadSrt(input) {
	const asset = await getAsset(input.assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	const cues = parseSrt(input.srt);
	if (cues.length === 0) throw new Error("SRT_INVALID");
	const key = makeStorageKey(asset.id, libraryNewId(), "srt");
	await writeLibraryBytes(key, Buffer.from(cuesToSrt(cues), "utf8"));
	const track = await insertCaption({
		id: libraryNewId(),
		asset_id: asset.id,
		language: input.language ?? "en",
		status: "READY",
		format: "JSON_CUES",
		storage_key: key,
		cues,
		engine: "MANUAL"
	});
	await audit(input.actorId, "library.upload_srt", track.id);
	return track;
}
async function saveCues(input) {
	const track = await getCaption(input.trackId);
	if (!track) throw new Error("CAPTION_NOT_READY");
	const cues = input.cues.map((cue) => ({
		startMs: Math.max(0, Math.round(cue.startMs)),
		endMs: Math.max(0, Math.round(cue.endMs)),
		text: sanitizeText(cue.text).slice(0, 280)
	})).filter((cue) => cue.text && cue.endMs > cue.startMs);
	await patchCaption(track.id, {
		cues,
		status: "READY",
		engine: "MANUAL",
		error: null
	});
	const updated = await getCaption(track.id);
	if (!updated) throw new Error("CAPTION_NOT_READY");
	await audit(input.actorId, "library.edit_captions", track.id);
	return updated;
}
async function captionExport(trackId, format) {
	const track = await getCaption(trackId);
	if (!track || track.status !== "READY") throw new Error("CAPTION_NOT_READY");
	const body = format === "VTT" ? cuesToVtt(track.cues) : cuesToSrt(track.cues);
	return {
		filename: `captions.${format.toLowerCase()}`,
		body
	};
}
function presetSize(preset, options) {
	if (preset === "CUSTOM") return {
		width: options.customWidth || options.maxWidth || 1080,
		height: options.customHeight || 1920
	};
	return PRESET_SIZE[preset];
}
async function queueRender(input) {
	const asset = await getAsset(input.assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	if (asset.kind !== "VIDEO" && asset.kind !== "IMAGE") throw new Error("LIBRARY_KIND_UNSUPPORTED");
	if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
	const settings = await readMediaSettings();
	if (!settings.ffmpegAvailable) throw new Error("FFMPEG_UNAVAILABLE");
	const options = {
		burnInCaptions: Boolean(input.options?.burnInCaptions),
		captionStyleId: input.options?.captionStyleId,
		targetMaxDurationSec: input.options?.targetMaxDurationSec,
		trim: input.options?.trim,
		loudnorm: input.options?.loudnorm !== false,
		maxWidth: input.options?.maxWidth,
		format: "mp4",
		customWidth: input.options?.customWidth,
		customHeight: input.options?.customHeight
	};
	if (options.burnInCaptions && input.captionTrackId) {
		const track = await getCaption(input.captionTrackId);
		if (!track || track.status !== "READY") throw new Error("CAPTION_NOT_READY");
	}
	const job = await insertRender({
		id: libraryNewId(),
		client_id: asset.clientId,
		source_asset_id: asset.id,
		source_version_id: asset.currentVersionId,
		caption_track_id: input.captionTrackId ?? null,
		preset: input.preset,
		options,
		status: "QUEUED",
		worker: settings.daytonaRender ? "DAYTONA" : "BASE44_FN",
		created_by: input.actorId
	});
	await audit(input.actorId, "library.queue_render", job.id);
	pumpRenderQueue();
	return job;
}
async function cancelRender(input) {
	const job = await getRender(input.jobId);
	if (!job) throw new Error("JOB_MISSING");
	if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELED") return job;
	cancelFlags.add(job.id);
	await patchRender(job.id, {
		status: "CANCELED",
		finished_at: nowIso(),
		error: "Canceled"
	});
	await audit(input.actorId, "library.cancel_render", job.id);
	const updated = await getRender(job.id);
	if (!updated) throw new Error("JOB_MISSING");
	return updated;
}
async function retryRender(input) {
	const job = await getRender(input.jobId);
	if (!job) throw new Error("JOB_MISSING");
	if (job.status !== "FAILED" && job.status !== "CANCELED") throw new Error("VALIDATION");
	cancelFlags.delete(job.id);
	await patchRender(job.id, {
		status: "QUEUED",
		error: null,
		progress_percent: 0,
		started_at: null,
		finished_at: null
	});
	await audit(input.actorId, "library.retry_render", job.id);
	pumpRenderQueue();
	const updated = await getRender(job.id);
	if (!updated) throw new Error("JOB_MISSING");
	return updated;
}
async function pumpRenderQueue() {
	const max = (await readMediaSettings()).concurrentRenders;
	if (renderState.active >= max) return;
	const queued = (await listRenders({ status: "QUEUED" })).filter((row) => row.status === "QUEUED");
	const next = queued[queued.length - 1] ?? queued[0];
	if (!next) return;
	renderState.active += 1;
	runRenderJob(next.id).catch(() => {}).finally(() => {
		renderState.active = Math.max(0, renderState.active - 1);
		pumpRenderQueue();
	});
}
async function runRenderJob(jobId) {
	const job = await getRender(jobId);
	if (!job || job.status !== "QUEUED") return;
	await patchRender(jobId, {
		status: "RUNNING",
		started_at: nowIso(),
		progress_percent: 5,
		attempts: job.attempts + 1
	});
	const dir = await mkdtemp(join(tmpdir(), "clippy-render-"));
	try {
		const asset = await getAsset(job.sourceAssetId);
		if (!asset?.currentVersionId) throw new Error("ASSET_MISSING");
		const version = await getVersionRow(job.sourceVersionId || asset.currentVersionId);
		if (!version) throw new Error("ASSET_MISSING");
		const { storagePath } = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
		const sourcePath = storagePath(version.storageKey);
		const size = presetSize(job.preset, job.options);
		const outPath = join(dir, "out.mp4");
		const vf = [];
		if (job.options.trim) {}
		vf.push(`scale=${size.width}:${size.height}:force_original_aspect_ratio=increase`, `crop=${size.width}:${size.height}`);
		let srtPath = null;
		if (job.options.burnInCaptions && job.captionTrackId) {
			const track = await getCaption(job.captionTrackId);
			if (!track || track.status !== "READY" || track.cues.length === 0) throw new Error("CAPTION_NOT_READY");
			srtPath = join(dir, "burn.srt");
			await writeFile(srtPath, cuesToSrt(track.cues), "utf8");
			const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
			vf.push(`subtitles='${escaped}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=64'`);
		}
		await patchRender(jobId, { progress_percent: 20 });
		const args = ["-y"];
		if (job.options.trim) args.push("-ss", (job.options.trim.startMs / 1e3).toFixed(3));
		args.push("-i", sourcePath);
		if (job.options.trim) {
			const dur = Math.max(.2, (job.options.trim.endMs - job.options.trim.startMs) / 1e3);
			args.push("-t", dur.toFixed(3));
		} else if (job.options.targetMaxDurationSec) args.push("-t", String(job.options.targetMaxDurationSec));
		args.push("-vf", vf.join(","));
		if (job.options.loudnorm && asset.kind === "VIDEO") args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");
		args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outPath);
		const result = await runCmd(FFMPEG, args, {
			timeoutMs: 24e4,
			onCancel: () => cancelFlags.has(jobId)
		});
		if (cancelFlags.has(jobId)) {
			cancelFlags.delete(jobId);
			return;
		}
		if (result.code !== 0) throw new Error("RENDER_FAILED");
		await patchRender(jobId, { progress_percent: 80 });
		const bytes = await readFile(outPath);
		const output = await ingestBytes({
			actorId: job.createdBy ?? "system",
			clientId: job.clientId,
			title: `${asset.title} · ${job.preset.replace(/_/g, " ")}`,
			filename: "render.mp4",
			mimeHint: "video/mp4",
			bytes,
			source: "RENDER_OUTPUT",
			sourceRef: job.id,
			parentAssetId: asset.id,
			tags: ["render", job.preset.toLowerCase()],
			note: `render ${job.preset}`
		});
		await patchRender(jobId, {
			status: "SUCCEEDED",
			progress_percent: 100,
			output_asset_id: output.asset.id,
			finished_at: nowIso(),
			error: null
		});
		emitAutonomyEvent({
			type: "library.render.succeeded",
			entityType: "render_job",
			entityId: jobId,
			data: {
				outputAssetId: output.asset.id,
				preset: job.preset
			}
		});
		import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onRenderSucceeded({
			jobId,
			outputAssetId: output.asset.id,
			actorId: job.createdBy ?? null
		})).catch(() => {});
	} catch (error) {
		if (cancelFlags.has(jobId)) {
			cancelFlags.delete(jobId);
			return;
		}
		const code = error instanceof Error ? error.message : "RENDER_FAILED";
		await patchRender(jobId, {
			status: "FAILED",
			error: code,
			finished_at: nowIso()
		});
		emitAutonomyEvent({
			type: "library.render.failed",
			entityType: "render_job",
			entityId: jobId,
			data: { error: code }
		});
		import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onRenderFailed({
			jobId,
			error: code,
			actorId: job.createdBy ?? null
		})).catch(() => {});
	} finally {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
async function testRender(actorId) {
	if (!(await readMediaSettings()).ffmpegAvailable) return {
		ok: false,
		message: "FFmpeg is not available on this worker."
	};
	const dir = await mkdtemp(join(tmpdir(), "clippy-test-render-"));
	try {
		const src = join(dir, "src.mp4");
		if ((await runCmd(FFMPEG, [
			"-y",
			"-f",
			"lavfi",
			"-i",
			"color=c=0x111827:s=1280x720:d=1",
			"-f",
			"lavfi",
			"-i",
			"sine=frequency=440:duration=1",
			"-shortest",
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-c:a",
			"aac",
			src
		], { timeoutMs: 2e4 })).code !== 0) return {
			ok: false,
			message: "Could not generate the test clip."
		};
		return {
			ok: true,
			jobId: (await queueRender({
				actorId,
				assetId: (await ingestBytes({
					actorId,
					clientId: null,
					title: "Render health check",
					filename: "health.mp4",
					mimeHint: "video/mp4",
					bytes: await readFile(src),
					source: "RENDER_OUTPUT",
					tags: ["health"]
				})).asset.id,
				preset: "REELS_9x16",
				options: {
					burnInCaptions: false,
					loudnorm: false,
					format: "mp4"
				}
			})).id,
			message: "Queued a 1-second 9:16 health render."
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "RENDER_FAILED"
		};
	} finally {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
async function resolvePublishAsset(input) {
	const asset = await getAsset(input.mediaAssetId);
	if (!asset || asset.clientId && asset.clientId !== input.clientId) throw new Error("ASSET_MISSING");
	if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
	let chosen = asset;
	const wantsVertical = (input.platforms ?? []).some((p) => p === "tiktok" || p === "instagram");
	const wantsLandscape = (input.platforms ?? []).some((p) => p === "youtube") && !wantsVertical;
	if (wantsVertical) {
		const reels = (await derivedRenders(asset.id)).find((row) => row.status === "READY" && row.aspectRatio === "9:16");
		if (reels) chosen = reels;
	} else if (wantsLandscape) {
		const wide = (await derivedRenders(asset.id)).find((row) => row.status === "READY" && row.aspectRatio === "16:9");
		if (wide) chosen = wide;
	}
	if (!chosen.currentVersionId) return {
		asset: chosen,
		mediaUrl: chosen.sourceRef
	};
	const version = await getVersionRow(chosen.currentVersionId);
	if (!version) return {
		asset: chosen,
		mediaUrl: chosen.previewUrl
	};
	let bytes;
	try {
		bytes = await readLibraryBytes(version.storageKey);
	} catch {
		bytes = void 0;
	}
	return {
		asset: chosen,
		mediaUrl: chosen.previewUrl,
		fileBytes: bytes,
		mime: version.mimeType ?? chosen.mimeType ?? void 0
	};
}
async function archiveAsset(input) {
	if (input.role !== "admin") throw new Error("Forbidden");
	const asset = await getAsset(input.assetId);
	if (!asset) throw new Error("ASSET_MISSING");
	await patchAsset(asset.id, { status: "ARCHIVED" });
	if (asset.currentVersionId) {
		const version = await getVersionRow(asset.currentVersionId);
		if (version) await deleteLibraryBytes(version.storageKey);
	}
	await audit(input.actorId, "library.archive", asset.id);
	import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onAssetDeleted({
		actorId: input.actorId,
		assetId: asset.id,
		clientId: asset.clientId
	})).catch(() => {});
}
//#endregion
export { queueRender as a, library_pipeline_server_exports as i, ingestFromUrl as n, resolvePublishAsset as o, ingestStreamClip as r, ingestBytes as t };
