/**
 * Ingest, caption, and FFmpeg render workers.
 * Never auto-starts the Social Machine. Job-scoped work stays local unless Daytona render is on.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isTrustedImageUrl } from "@/lib/thumbnails";
import { sanitizeText } from "@/lib/sanitize";
import {
  cuesToSrt,
  cuesToVtt,
  PRESET_SIZE,
  type AssetSource,
  type CaptionCue,
  type CaptionTrack,
  type LibraryAsset,
  type RenderJob,
  type RenderOptions,
  type RenderPreset,
} from "@/lib/library";
import {
  aspectLabel,
  derivedRenders,
  findByChecksum,
  getAsset,
  getCaption,
  getRender,
  getVersionRow,
  insertAsset,
  insertCaption,
  insertRender,
  insertVersion,
  libraryNewId,
  listRenders,
  nextVersionNumber,
  patchAsset,
  patchCaption,
  patchRender,
  readMediaSettings,
} from "@/lib/server/library.server";
import {
  deleteLibraryBytes,
  extFromMime,
  hashBytes,
  kindFromMime,
  makeStorageKey,
  readLibraryBytes,
  sniffMime,
  writeLibraryBytes,
} from "@/lib/server/library-storage.server";
import { writeAuditLog } from "@/lib/server/autonomy-audit.server";
import { emitAutonomyEvent } from "@/lib/server/autonomy-events.server";

const FFMPEG = process.env.FFMPEG_PATH?.trim() || "/usr/local/bin/ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH?.trim() || "/usr/local/bin/ffprobe";
const STT_MAX_SEC = 15 * 60;
const FETCH_TIMEOUT_MS = 45_000;

const cancelFlags = new Set<string>();
const renderState = { active: 0 };

function nowIso() {
  return new Date().toISOString();
}

async function audit(actorId: string, action: string, entityId: string, result: "ok" | "error" = "ok") {
  try {
    await writeAuditLog({
      requestId: `${action}:${entityId}`,
      actor: { source: "api", keyId: actorId, label: actorId.slice(0, 80) },
      action,
      entityType: "media_asset",
      entityId,
      result,
    });
  } catch {
    /* best-effort */
  }
}

function runCmd(
  bin: string,
  args: string[],
  opts: { timeoutMs?: number; onCancel?: () => boolean } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, opts.timeoutMs ?? 180_000);
    const poll = setInterval(() => {
      if (opts.onCancel?.()) child.kill("SIGKILL");
    }, 400);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 200_000) stdout = stdout.slice(-80_000);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 200_000) stderr = stderr.slice(-80_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      clearInterval(poll);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      clearInterval(poll);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

type Probe = {
  durationSec: number | null;
  width: number | null;
  height: number | null;
  mime: string | null;
};

async function probeFile(path: string): Promise<Probe> {
  const empty: Probe = { durationSec: null, width: null, height: null, mime: null };
  const fromFfmpeg = async (): Promise<Probe> => {
    const result = await runCmd(FFMPEG, ["-hide_banner", "-i", path], { timeoutMs: 30_000 });
    const text = `${result.stdout}\n${result.stderr}`;
    const dur = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
    const dim = /Stream #.*Video:.*\s(\d{2,5})x(\d{2,5})/.exec(text);
    const durationSec = dur
      ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3])
      : null;
    return {
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      width: dim ? Number(dim[1]) : null,
      height: dim ? Number(dim[2]) : null,
      mime: null,
    };
  };
  try {
    const result = await runCmd(
      FFPROBE,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,format_name:stream=width,height,codec_type",
        "-of",
        "json",
        path,
      ],
      { timeoutMs: 30_000 },
    );
    if (result.code !== 0) return fromFfmpeg();
    const parsed = JSON.parse(result.stdout) as {
      format?: { duration?: string };
      streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
    };
    const duration = parsed.format?.duration ? Number(parsed.format.duration) : null;
    const video = parsed.streams?.find((row) => row.codec_type === "video");
    return {
      durationSec: Number.isFinite(duration) ? duration : null,
      width: video?.width ?? null,
      height: video?.height ?? null,
      mime: null,
    };
  } catch {
    try {
      return await fromFfmpeg();
    } catch {
      return empty;
    }
  }
}

export async function ingestBytes(input: {
  actorId: string;
  clientId: string | null;
  title: string;
  filename?: string;
  mimeHint?: string;
  bytes: Buffer;
  source: AssetSource;
  sourceRef?: string | null;
  tags?: string[];
  parentAssetId?: string | null;
  note?: string;
}): Promise<{ asset: LibraryAsset; duplicate: boolean }> {
  const settings = await readMediaSettings();
  const max = settings.maxUploadMb * 1024 * 1024;
  if (input.bytes.length > max) throw new Error("MEDIA_TOO_LARGE");
  const mime = sniffMime(input.bytes, input.mimeHint ?? "application/octet-stream", input.filename);
  const kind = kindFromMime(mime);
  const checksum = await hashBytes(input.bytes);
  const existing = await findByChecksum(input.clientId, checksum);
  if (existing) return { asset: existing, duplicate: true };

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
    created_by: input.actorId,
  });
  await insertVersion({
    id: versionId,
    asset_id: assetId,
    version_number: 1,
    storage_key: key,
    mime_type: mime,
    byte_size: input.bytes.length,
    checksum,
    note: input.note ?? "original",
  });
  await finalizeProbe(assetId, versionId, key, mime, input.bytes.length, checksum);
  await audit(input.actorId, "library.ingest", assetId);
  emitAutonomyEvent({
    type: "library.asset.ready",
    entityType: "media_asset",
    entityId: assetId,
    data: { source: input.source, kind, clientId: input.clientId },
  });
  const asset = await getAsset(assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  return { asset, duplicate: false };
}

async function finalizeProbe(
  assetId: string,
  versionId: string,
  key: string,
  mime: string,
  byteSize: number,
  checksum: string,
) {
  const { storagePath } = await import("@/lib/server/library-storage.server");
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
    aspect_ratio: aspectLabel(probe.width, probe.height),
  });
}

const URL_HOST_ALLOW = [
  "clips.twitch.tv",
  "static-cdn.jtvnw.net",
  "d1m7jfoe9zdc1j.cloudfront.net",
  "i.ytimg.com",
  "img.youtube.com",
  "i.imgur.com",
  "pbs.twimg.com",
  "video.twimg.com",
  "abs.twimg.com",
];

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  if (URL_HOST_ALLOW.includes(h)) return true;
  if (h.endsWith(".twitch.tv") || h.endsWith(".jtvnw.net")) return true;
  if (h.endsWith(".tiktokcdn.com") || h.endsWith(".tiktok.com") || h.endsWith(".muscdn.com")) return true;
  if (h.endsWith(".cdninstagram.com") || h.endsWith(".fbcdn.net")) return true;
  if (h.endsWith(".googleusercontent.com") || h.endsWith(".ggpht.com")) return true;
  return false;
}

export function isTrustedLibraryUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:")) return /^data:(video|image|audio)\//i.test(url);
  if (isTrustedImageUrl(url)) return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  return hostAllowed(parsed.hostname.replace(/^\[|\]$/g, ""));
}

export async function ingestFromUrl(input: {
  actorId: string;
  clientId: string | null;
  url: string;
  title?: string;
  source?: AssetSource;
  tags?: string[];
}): Promise<{ asset: LibraryAsset; duplicate: boolean }> {
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
      tags: input.tags,
    });
  }
  const settings = await readMediaSettings();
  const max = settings.maxUploadMb * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(input.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "ClippyAdmin/1.0" },
    });
    if (!response.ok) throw new Error("UNTRUSTED_URL");
    const finalUrl = response.url || input.url;
    if (!isTrustedLibraryUrl(finalUrl) && !isTrustedImageUrl(finalUrl)) throw new Error("UNTRUSTED_URL");
    const len = Number(response.headers.get("content-length") ?? 0);
    if (len > max) throw new Error("MEDIA_TOO_LARGE");
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
      tags: input.tags,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "MEDIA_TOO_LARGE" || error.message === "UNTRUSTED_URL")) {
      throw error;
    }
    throw new Error("UNTRUSTED_URL");
  } finally {
    clearTimeout(timer);
  }
}

export async function ingestLinkAsset(input: {
  actorId: string;
  clientId: string | null;
  title: string;
  url: string;
  source: AssetSource;
  kind?: LibraryAsset["kind"];
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  tags?: string[];
}): Promise<LibraryAsset> {
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
    created_by: input.actorId,
  });
  await audit(input.actorId, "library.ingest_link", assetId);
  const asset = await getAsset(assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  return asset;
}

export async function ingestStreamClip(input: {
  actorId: string;
  clipId: string;
}): Promise<LibraryAsset> {
  const { getClipById } = await import("@/lib/server/stream.server");
  const clip = await getClipById(input.clipId);
  if (!clip) throw new Error("ASSET_MISSING");
  if (clip.thumbnailUrl && (isTrustedLibraryUrl(clip.thumbnailUrl) || isTrustedImageUrl(clip.thumbnailUrl))) {
    try {
      const result = await ingestFromUrl({
        actorId: input.actorId,
        clientId: clip.clientId,
        url: clip.thumbnailUrl,
        title: clip.title || "Twitch clip",
        source: "TWITCH_CLIP",
        tags: ["twitch"],
      });
      await patchAsset(result.asset.id, {
        title: clip.title || result.asset.title,
      });
      const asset = await getAsset(result.asset.id);
      if (asset) return asset;
    } catch {
      /* fall through to link */
    }
  }
  if (!clip.url) throw new Error("ASSET_MISSING");
  return ingestLinkAsset({
    actorId: input.actorId,
    clientId: clip.clientId,
    title: clip.title || "Twitch clip",
    url: clip.url,
    source: "TWITCH_CLIP",
    durationSec: clip.durationSec,
    thumbnailUrl: clip.thumbnailUrl,
    tags: ["twitch"],
  });
}

export async function ingestThumbnailMessage(input: {
  actorId: string;
  messageId: string;
}): Promise<LibraryAsset> {
  const { getAgencyAdmin, localSql } = await import("@/lib/server/agency-db.server");
  const admin = await getAgencyAdmin();
  let imageUrl: string | null = null;
  let clientId: string | null = null;
  let title = "Thumbnail";
  if (admin) {
    const { data } = await admin
      .from("thumbnail_messages")
      .select("id,image_url,session_id,content")
      .eq("id", input.messageId)
      .maybeSingle();
    const rec = data as { image_url?: string; session_id?: string; content?: string } | null;
    imageUrl = rec?.image_url ?? null;
    if (rec?.session_id) {
      const session = await admin
        .from("thumbnail_sessions")
        .select("client_id,title")
        .eq("id", rec.session_id)
        .maybeSingle();
      const s = session.data as { client_id?: string; title?: string } | null;
      clientId = s?.client_id ?? null;
      title = s?.title || rec.content?.slice(0, 80) || "Thumbnail";
    }
  }
  if (!imageUrl) {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select tm.image_url, tm.content, ts.client_id, ts.title
       from thumbnail_messages tm
       join thumbnail_sessions ts on ts.id = tm.session_id
       where tm.id = $1 limit 1`,
      [input.messageId],
    );
    const rec = rows[0];
    imageUrl = rec ? String(rec.image_url ?? "") : null;
    clientId = rec ? (rec.client_id ? String(rec.client_id) : null) : null;
    title = rec ? String(rec.title || rec.content || "Thumbnail") : "Thumbnail";
  }
  if (!imageUrl) throw new Error("ASSET_MISSING");
  const result = await ingestFromUrl({
    actorId: input.actorId,
    clientId,
    url: imageUrl,
    title,
    source: "THUMBNAIL_GEN",
    tags: ["thumbnail"],
  });
  return result.asset;
}

function parseSrt(raw: string): CaptionCue[] {
  const blocks = raw.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n\n+/);
  const cues: CaptionCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length < 2) continue;
    const timeLine = lines.find((line) => line.includes("-->"));
    if (!timeLine) continue;
    const match = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(timeLine);
    if (!match) continue;
    const toMs = (h: string, m: string, s: string, f: string) =>
      Number(h) * 3_600_000 + Number(m) * 60_000 + Number(s) * 1000 + Number(f.padEnd(3, "0").slice(0, 3));
    const text = lines
      .slice(lines.indexOf(timeLine) + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text) continue;
    cues.push({
      startMs: toMs(match[1], match[2], match[3], match[4]),
      endMs: toMs(match[5], match[6], match[7], match[8]),
      text: text.slice(0, 280),
    });
  }
  return cues;
}

function wordsToCues(words: Array<{ text: string; start: number; end: number }>): CaptionCue[] {
  const cues: CaptionCue[] = [];
  let bucket: typeof words = [];
  const flush = () => {
    if (!bucket.length) return;
    cues.push({
      startMs: Math.round(bucket[0].start * 1000),
      endMs: Math.round(bucket[bucket.length - 1].end * 1000),
      text: bucket.map((w) => w.text).join(" ").replace(/\s+/g, " ").trim(),
    });
    bucket = [];
  };
  for (const word of words) {
    if (!word.text.trim()) continue;
    if (
      bucket.length >= 10 ||
      (bucket.length && word.start - bucket[0].start > 3.4) ||
      (bucket.length && word.start - bucket[bucket.length - 1].end > 0.8)
    ) {
      flush();
    }
    bucket.push(word);
  }
  flush();
  return cues;
}

export async function generateCaptions(input: {
  actorId: string;
  assetId: string;
  language?: string;
}): Promise<CaptionTrack> {
  const asset = await getAsset(input.assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  if (asset.kind !== "VIDEO" && asset.kind !== "AUDIO") throw new Error("LIBRARY_KIND_UNSUPPORTED");
  if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
  const settings = await readMediaSettings();
  if (!settings.transcriptionConfigured) throw new Error("CAPTION_ENGINE_MISSING");
  const version = asset.currentVersionId ? await getVersionRow(asset.currentVersionId) : null;
  if (!version) throw new Error("ASSET_MISSING");
  const track = await insertCaption({
    id: libraryNewId(),
    asset_id: asset.id,
    language: input.language ?? "en",
    status: "TRANSCRIBING",
    engine: "XAI_OR_PROVIDER",
  });
  void runTranscription({ trackId: track.id, storageKey: version.storageKey, language: input.language ?? "en" });
  await audit(input.actorId, "library.generate_captions", track.id);
  return track;
}

async function runTranscription(input: { trackId: string; storageKey: string; language: string }) {
  const dir = await mkdtemp(join(tmpdir(), "clippy-stt-"));
  try {
    const { storagePath } = await import("@/lib/server/library-storage.server");
    const source = storagePath(input.storageKey);
    const wav = join(dir, "audio.wav");
    const extract = await runCmd(
      FFMPEG,
      ["-y", "-i", source, "-vn", "-ac", "1", "-ar", "16000", "-t", String(STT_MAX_SEC), wav],
      { timeoutMs: 120_000 },
    );
    if (extract.code !== 0) throw new Error("RENDER_FAILED");
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
      body: form,
    });
    if (!response.ok) throw new Error("CAPTION_ENGINE_MISSING");
    const body = (await response.json()) as {
      text?: string;
      words?: Array<{ text?: string; start?: number; end?: number }>;
    };
    const words = (body.words ?? [])
      .map((w) => ({
        text: String(w.text ?? ""),
        start: Number(w.start ?? 0),
        end: Number(w.end ?? 0),
      }))
      .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end));
    let cues = wordsToCues(words);
    if (!cues.length && body.text?.trim()) {
      cues = [{ startMs: 0, endMs: 3000, text: body.text.trim().slice(0, 280) }];
    }
    const srt = cuesToSrt(cues);
    const key = makeStorageKey(input.trackId, "captions", "srt");
    await writeLibraryBytes(key, Buffer.from(srt, "utf8"));
    await patchCaption(input.trackId, {
      status: "READY",
      cues,
      format: "JSON_CUES",
      storage_key: key,
      error: null,
    });
    emitAutonomyEvent({
      type: "library.caption.ready",
      entityType: "caption_track",
      entityId: input.trackId,
      data: { cues: cues.length },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CAPTION_ENGINE_MISSING";
    await patchCaption(input.trackId, { status: "FAILED", error: code });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function uploadSrt(input: {
  actorId: string;
  assetId: string;
  srt: string;
  language?: string;
}): Promise<CaptionTrack> {
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
    engine: "MANUAL",
  });
  await audit(input.actorId, "library.upload_srt", track.id);
  return track;
}

export async function saveCues(input: {
  actorId: string;
  trackId: string;
  cues: CaptionCue[];
}): Promise<CaptionTrack> {
  const track = await getCaption(input.trackId);
  if (!track) throw new Error("CAPTION_NOT_READY");
  const cues = input.cues
    .map((cue) => ({
      startMs: Math.max(0, Math.round(cue.startMs)),
      endMs: Math.max(0, Math.round(cue.endMs)),
      text: sanitizeText(cue.text).slice(0, 280),
    }))
    .filter((cue) => cue.text && cue.endMs > cue.startMs);
  await patchCaption(track.id, { cues, status: "READY", engine: "MANUAL", error: null });
  const updated = await getCaption(track.id);
  if (!updated) throw new Error("CAPTION_NOT_READY");
  await audit(input.actorId, "library.edit_captions", track.id);
  return updated;
}

export async function captionExport(trackId: string, format: "SRT" | "VTT"): Promise<{ filename: string; body: string }> {
  const track = await getCaption(trackId);
  if (!track || track.status !== "READY") throw new Error("CAPTION_NOT_READY");
  const body = format === "VTT" ? cuesToVtt(track.cues) : cuesToSrt(track.cues);
  return { filename: `captions.${format.toLowerCase()}`, body };
}

function presetSize(preset: RenderPreset, options: RenderOptions): { width: number; height: number } {
  if (preset === "CUSTOM") {
    return {
      width: options.customWidth || options.maxWidth || 1080,
      height: options.customHeight || 1920,
    };
  }
  return PRESET_SIZE[preset];
}

export async function queueRender(input: {
  actorId: string;
  assetId: string;
  preset: RenderPreset;
  options?: Partial<RenderOptions>;
  captionTrackId?: string | null;
}): Promise<RenderJob> {
  const asset = await getAsset(input.assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  if (asset.kind !== "VIDEO" && asset.kind !== "IMAGE") throw new Error("LIBRARY_KIND_UNSUPPORTED");
  if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
  const settings = await readMediaSettings();
  if (!settings.ffmpegAvailable) throw new Error("FFMPEG_UNAVAILABLE");
  const options: RenderOptions = {
    burnInCaptions: Boolean(input.options?.burnInCaptions),
    captionStyleId: input.options?.captionStyleId,
    targetMaxDurationSec: input.options?.targetMaxDurationSec,
    trim: input.options?.trim,
    loudnorm: input.options?.loudnorm !== false,
    maxWidth: input.options?.maxWidth,
    format: "mp4",
    customWidth: input.options?.customWidth,
    customHeight: input.options?.customHeight,
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
    created_by: input.actorId,
  });
  await audit(input.actorId, "library.queue_render", job.id);
  void pumpRenderQueue();
  return job;
}

export async function cancelRender(input: { actorId: string; jobId: string }): Promise<RenderJob> {
  const job = await getRender(input.jobId);
  if (!job) throw new Error("JOB_MISSING");
  if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELED") return job;
  cancelFlags.add(job.id);
  await patchRender(job.id, {
    status: "CANCELED",
    finished_at: nowIso(),
    error: "Canceled",
  });
  await audit(input.actorId, "library.cancel_render", job.id);
  const updated = await getRender(job.id);
  if (!updated) throw new Error("JOB_MISSING");
  return updated;
}

export async function retryRender(input: { actorId: string; jobId: string }): Promise<RenderJob> {
  const job = await getRender(input.jobId);
  if (!job) throw new Error("JOB_MISSING");
  if (job.status !== "FAILED" && job.status !== "CANCELED") throw new Error("VALIDATION");
  cancelFlags.delete(job.id);
  await patchRender(job.id, {
    status: "QUEUED",
    error: null,
    progress_percent: 0,
    started_at: null,
    finished_at: null,
  });
  await audit(input.actorId, "library.retry_render", job.id);
  void pumpRenderQueue();
  const updated = await getRender(job.id);
  if (!updated) throw new Error("JOB_MISSING");
  return updated;
}

export async function pumpRenderQueue(): Promise<void> {
  const settings = await readMediaSettings();
  const max = settings.concurrentRenders;
  if (renderState.active >= max) return;
  const queued = (await listRenders({ status: "QUEUED" })).filter((row) => row.status === "QUEUED");
  const next = queued[queued.length - 1] ?? queued[0];
  if (!next) return;
  renderState.active += 1;
  void runRenderJob(next.id)
    .catch(() => {})
    .finally(() => {
      renderState.active = Math.max(0, renderState.active - 1);
      void pumpRenderQueue();
    });
}

async function runRenderJob(jobId: string): Promise<void> {
  const job = await getRender(jobId);
  if (!job || job.status !== "QUEUED") return;
  await patchRender(jobId, {
    status: "RUNNING",
    started_at: nowIso(),
    progress_percent: 5,
    attempts: job.attempts + 1,
  });
  const dir = await mkdtemp(join(tmpdir(), "clippy-render-"));
  try {
    const asset = await getAsset(job.sourceAssetId);
    if (!asset?.currentVersionId) throw new Error("ASSET_MISSING");
    const version = await getVersionRow(job.sourceVersionId || asset.currentVersionId);
    if (!version) throw new Error("ASSET_MISSING");
    const { storagePath } = await import("@/lib/server/library-storage.server");
    const sourcePath = storagePath(version.storageKey);
    const size = presetSize(job.preset, job.options);
    const outPath = join(dir, "out.mp4");
    const vf: string[] = [];
    if (job.options.trim) {
      /* trim is applied as -ss/-t */
    }
    vf.push(
      `scale=${size.width}:${size.height}:force_original_aspect_ratio=increase`,
      `crop=${size.width}:${size.height}`,
    );
    let srtPath: string | null = null;
    if (job.options.burnInCaptions && job.captionTrackId) {
      const track = await getCaption(job.captionTrackId);
      if (!track || track.status !== "READY" || track.cues.length === 0) throw new Error("CAPTION_NOT_READY");
      srtPath = join(dir, "burn.srt");
      await writeFile(srtPath, cuesToSrt(track.cues), "utf8");
      const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
      vf.push(
        `subtitles='${escaped}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=64'`,
      );
    }
    await patchRender(jobId, { progress_percent: 20 });
    const args = ["-y"];
    if (job.options.trim) args.push("-ss", (job.options.trim.startMs / 1000).toFixed(3));
    args.push("-i", sourcePath);
    if (job.options.trim) {
      const dur = Math.max(0.2, (job.options.trim.endMs - job.options.trim.startMs) / 1000);
      args.push("-t", dur.toFixed(3));
    } else if (job.options.targetMaxDurationSec) {
      args.push("-t", String(job.options.targetMaxDurationSec));
    }
    args.push("-vf", vf.join(","));
    if (job.options.loudnorm && asset.kind === "VIDEO") args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outPath,
    );
    const result = await runCmd(FFMPEG, args, {
      timeoutMs: 240_000,
      onCancel: () => cancelFlags.has(jobId),
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
      note: `render ${job.preset}`,
    });
    await patchRender(jobId, {
      status: "SUCCEEDED",
      progress_percent: 100,
      output_asset_id: output.asset.id,
      finished_at: nowIso(),
      error: null,
    });
    emitAutonomyEvent({
      type: "library.render.succeeded",
      entityType: "render_job",
      entityId: jobId,
      data: { outputAssetId: output.asset.id, preset: job.preset },
    });
    void import("@/lib/server/safety-hooks.server")
      .then((mod) =>
        mod.onRenderSucceeded({
          jobId,
          outputAssetId: output.asset.id,
          actorId: job.createdBy ?? null,
        }),
      )
      .catch(() => {});
    void srtPath;
  } catch (error) {
    if (cancelFlags.has(jobId)) {
      cancelFlags.delete(jobId);
      return;
    }
    const code = error instanceof Error ? error.message : "RENDER_FAILED";
    await patchRender(jobId, {
      status: "FAILED",
      error: code,
      finished_at: nowIso(),
    });
    emitAutonomyEvent({
      type: "library.render.failed",
      entityType: "render_job",
      entityId: jobId,
      data: { error: code },
    });
    void import("@/lib/server/safety-hooks.server")
      .then((mod) =>
        mod.onRenderFailed({ jobId, error: code, actorId: job.createdBy ?? null }),
      )
      .catch(() => {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function testRender(actorId: string): Promise<{ ok: boolean; jobId?: string; message: string }> {
  const settings = await readMediaSettings();
  if (!settings.ffmpegAvailable) {
    return { ok: false, message: "FFmpeg is not available on this worker." };
  }
  const dir = await mkdtemp(join(tmpdir(), "clippy-test-render-"));
  try {
    const src = join(dir, "src.mp4");
    const gen = await runCmd(
      FFMPEG,
      [
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
        src,
      ],
      { timeoutMs: 20_000 },
    );
    if (gen.code !== 0) return { ok: false, message: "Could not generate the test clip." };
    const bytes = await readFile(src);
    const ingested = await ingestBytes({
      actorId,
      clientId: null,
      title: "Render health check",
      filename: "health.mp4",
      mimeHint: "video/mp4",
      bytes,
      source: "RENDER_OUTPUT",
      tags: ["health"],
    });
    const job = await queueRender({
      actorId,
      assetId: ingested.asset.id,
      preset: "REELS_9x16",
      options: { burnInCaptions: false, loudnorm: false, format: "mp4" },
    });
    return { ok: true, jobId: job.id, message: "Queued a 1-second 9:16 health render." };
  } catch (error) {
    const code = error instanceof Error ? error.message : "RENDER_FAILED";
    return { ok: false, message: code };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function resolvePublishAsset(input: {
  mediaAssetId: string;
  clientId: string;
  platforms?: string[];
}): Promise<{ asset: LibraryAsset; mediaUrl: string | null; fileBytes?: Buffer; mime?: string }> {
  const asset = await getAsset(input.mediaAssetId);
  if (!asset || (asset.clientId && asset.clientId !== input.clientId)) throw new Error("ASSET_MISSING");
  if (asset.status !== "READY") throw new Error("ASSET_NOT_READY");
  let chosen = asset;
  const wantsVertical = (input.platforms ?? []).some((p) => p === "tiktok" || p === "instagram");
  const wantsLandscape = (input.platforms ?? []).some((p) => p === "youtube") && !wantsVertical;
  if (wantsVertical) {
    const derived = await derivedRenders(asset.id);
    const reels = derived.find((row) => row.status === "READY" && row.aspectRatio === "9:16");
    if (reels) chosen = reels;
  } else if (wantsLandscape) {
    const derived = await derivedRenders(asset.id);
    const wide = derived.find((row) => row.status === "READY" && row.aspectRatio === "16:9");
    if (wide) chosen = wide;
  }
  if (!chosen.currentVersionId) {
    return { asset: chosen, mediaUrl: chosen.sourceRef };
  }
  const version = await getVersionRow(chosen.currentVersionId);
  if (!version) return { asset: chosen, mediaUrl: chosen.previewUrl };
  let bytes: Buffer | undefined;
  try {
    bytes = await readLibraryBytes(version.storageKey);
  } catch {
    bytes = undefined;
  }
  return {
    asset: chosen,
    mediaUrl: chosen.previewUrl,
    fileBytes: bytes,
    mime: version.mimeType ?? chosen.mimeType ?? undefined,
  };
}

export async function archiveAsset(input: { actorId: string; assetId: string; role: "admin" | "member" }) {
  if (input.role !== "admin") throw new Error("Forbidden");
  const asset = await getAsset(input.assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  await patchAsset(asset.id, { status: "ARCHIVED" });
  if (asset.currentVersionId) {
    const version = await getVersionRow(asset.currentVersionId);
    if (version) await deleteLibraryBytes(version.storageKey);
  }
  await audit(input.actorId, "library.archive", asset.id);
  void import("@/lib/server/safety-hooks.server")
    .then((mod) =>
      mod.onAssetDeleted({
        actorId: input.actorId,
        assetId: asset.id,
        clientId: asset.clientId,
      }),
    )
    .catch(() => {});
}

export { cuesToSrt, cuesToVtt };
