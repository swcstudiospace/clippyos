/**
 * Native X (Twitter) API publisher.
 * Official v2 only: chunked media upload + POST /2/tweets.
 * Tokens stay in AppSetting. App-only Bearer cannot tweet.
 */
import { isTrustedImageUrl } from "@/lib/thumbnails";
import type { SocialUploadMode } from "@/lib/social";
import {
  ensureFreshToken,
  forceRefreshToken,
  publisherStatusFor,
  readToken,
  readXApiBase,
} from "@/lib/server/social-oauth.server";

export type XPublishInput = {
  mediaUrl: string | null;
  caption: string;
  mode: SocialUploadMode;
  onStatus?: (message: string) => Promise<void> | void;
  onProgress?: (progress: {
    percent: number;
    phase: "init" | "uploading" | "processing" | "publishing";
    sessionId: string;
  }) => Promise<void> | void;
  jobId?: string | null;
  postId?: string | null;
  sessionId?: string | null;
};

export type XPublishResult = {
  status: "succeeded" | "needs_attention" | "failed";
  externalPostId: string | null;
  externalUrl: string | null;
  reason?: string;
  provider: "X";
};

const X_CAPTION_MAX = 280;
const X_IMAGE_MAX = 5 * 1024 * 1024;
const X_GIF_MAX = 15 * 1024 * 1024;
const X_VIDEO_MAX = 512 * 1024 * 1024;
const CHUNK_SIZE = 4 * 1024 * 1024;
const HITS_WINDOW_MS = 15 * 60 * 1000;
const HITS_MAX = 15;

const hits: number[] = [];

function rateLimitLocal(): void {
  const now = Date.now();
  while (hits.length && now - hits[0]! >= HITS_WINDOW_MS) hits.shift();
  if (hits.length >= HITS_MAX) throw new Error("PUBLISHER_RATE_LIMIT");
  hits.push(now);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterWait(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * Math.max(250, baseMs * 0.25));
}

export async function isConfigured(): Promise<boolean> {
  try {
    const token = await readToken("x");
    if (!token?.accessToken) return false;
    const status = await publisherStatusFor("x");
    return status.connected && status.eligible && !status.tokenExpired;
  } catch {
    return false;
  }
}

export async function publish(input: XPublishInput): Promise<XPublishResult> {
  rateLimitLocal();
  if (!(await isConfigured())) throw new Error("PUBLISHER_NOT_CONNECTED");
  if (input.mode === "draft") {
    return {
      status: "needs_attention",
      externalPostId: null,
      externalUrl: null,
      provider: "X",
      reason:
        "X has no draft API. This post is held locally — queue again with Publish, or use the browser rail.",
    };
  }
  if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
  if (!isTrustedXMediaUrl(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
  const caption = input.caption.trim();
  const text = caption.slice(0, X_CAPTION_MAX);
  const category = inferKind("", input.mediaUrl);
  const { runChunkedUpload } = await import("@/lib/server/chunked-upload.server");
  const session = await runChunkedUpload({
    platform: "x",
    sourceUrl: input.mediaUrl,
    jobId: input.jobId,
    postId: input.postId,
    sessionId: input.sessionId,
    extras: { mediaCategory: category },
    onProgress: async (progress) => {
      await input.onProgress?.({
        percent: progress.percent,
        phase: progress.phase,
        sessionId: progress.sessionId,
      });
      await input.onStatus?.(`Uploading… ${progress.percent}%`);
    },
  });
  const mediaId = session.externalSessionId;
  if (!mediaId) throw new Error("PUBLISHER_REJECTED");
  const tweet = await xApi(
    "/2/tweets",
    () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text || undefined,
        media: { media_ids: [mediaId] },
      }),
      signal: AbortSignal.timeout(20000),
    }),
    input.onStatus,
  );
  if (tweet.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
  if (!tweet.ok) throw new Error("PUBLISHER_REJECTED");
  const json = (await tweet.json()) as { data?: { id?: string } };
  const id = json.data?.id ?? null;
  const fresh = await readToken("x");
  const handle = fresh?.handle?.replace(/^@/, "") ?? null;
  return {
    status: "succeeded",
    externalPostId: id,
    externalUrl: id
      ? handle
        ? `https://x.com/${handle}/status/${id}`
        : `https://x.com/i/status/${id}`
      : null,
    provider: "X",
    reason: caption.length > X_CAPTION_MAX ? "Caption truncated to 280 characters for X." : undefined,
  };
}

type XMedia = {
  bytes: Buffer;
  mime: string;
  category: "tweet_image" | "tweet_gif" | "tweet_video";
};

function isTrustedXMediaUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/library/file")) return true;
  if (url.startsWith("data:")) {
    return isTrustedImageUrl(url) || /^data:(video|image)\//i.test(url);
  }
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/library/file") return true;
  } catch {
    /* */
  }
  return isTrustedImageUrl(url);
}

function inferKind(mime: string, filename: string): XMedia["category"] {
  const lower = `${mime} ${filename}`.toLowerCase();
  if (lower.includes("gif")) return "tweet_gif";
  if (
    lower.includes("video") ||
    lower.includes("mp4") ||
    lower.includes("quicktime") ||
    lower.includes("mov") ||
    lower.includes("webm")
  ) {
    return "tweet_video";
  }
  return "tweet_image";
}

function mediaTypeFor(category: XMedia["category"], mime: string): string {
  if (category === "tweet_video") {
    if (mime.startsWith("video/")) return mime === "video/quicktime" ? "video/quicktime" : "video/mp4";
    return "video/mp4";
  }
  if (category === "tweet_gif") return "image/gif";
  if (mime === "image/png" || mime === "image/webp" || mime === "image/jpeg" || mime === "image/pjpeg") {
    return mime;
  }
  return "image/jpeg";
}

function assertSize(category: XMedia["category"], bytes: number): void {
  if (category === "tweet_image" && bytes > X_IMAGE_MAX) {
    throw new Error("X image uploads must be 5 MB or smaller.");
  }
  if (category === "tweet_gif" && bytes > X_GIF_MAX) {
    throw new Error("X GIFs must be 15 MB or smaller.");
  }
  if (category === "tweet_video" && bytes > X_VIDEO_MAX) {
    throw new Error("X videos must be 512 MB or smaller.");
  }
}

async function fetchXMedia(url: string): Promise<XMedia> {
  if (!isTrustedXMediaUrl(url)) throw new Error("UNTRUSTED_IMAGE");
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) throw new Error("UNTRUSTED_IMAGE");
    const mime = match[1];
    const bytes = Buffer.from(match[2], "base64");
    const category = inferKind(mime, mime);
    if (category === "tweet_image" && !mime.startsWith("image/")) {
      throw new Error("X_MEDIA_UNSUPPORTED");
    }
    assertSize(category, bytes.byteLength);
    return { bytes, mime: mediaTypeFor(category, mime), category };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(180000), redirect: "follow" });
  if (!response.ok) throw new Error("MEDIA_FETCH_FAILED");
  const headerLen = Number(response.headers.get("content-length"));
  if (Number.isFinite(headerLen) && headerLen > X_VIDEO_MAX) {
    throw new Error("X videos must be 512 MB or smaller.");
  }
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  const buf = Buffer.from(await response.arrayBuffer());
  const category = inferKind(mime, url);
  if (
    category === "tweet_image" &&
    !mime.startsWith("image/") &&
    !/\.(jpe?g|png|webp)(\?|$)/i.test(url)
  ) {
    throw new Error("X_MEDIA_UNSUPPORTED");
  }
  assertSize(category, buf.byteLength);
  return { bytes: buf, mime: mediaTypeFor(category, mime), category };
}

function mediaIdFrom(json: unknown): string {
  const rec = json as {
    data?: { id?: string | number; media_id_string?: string; media_id?: number };
    media_id_string?: string;
    media_id?: number;
    id?: string | number;
  };
  const raw =
    rec.data?.id ??
    rec.data?.media_id_string ??
    rec.data?.media_id ??
    rec.media_id_string ??
    rec.media_id ??
    rec.id;
  return raw == null ? "" : String(raw);
}

async function xApi(
  path: string,
  makeInit: () => RequestInit,
  onStatus?: XPublishInput["onStatus"],
): Promise<Response> {
  const base = await readXApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  async function send(accessToken: string): Promise<Response> {
    const req = makeInit();
    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    const isUpload =
      path.includes("/append") ||
      path.includes("/finalize") ||
      path.includes("/initialize") ||
      req.body instanceof FormData;
    const timeout = req.signal ?? AbortSignal.timeout(isUpload ? 60000 : 25000);
    return fetch(url, { ...req, headers, signal: timeout });
  }

  let token = await ensureFreshToken("x");
  let response = await send(token.accessToken);
  if (response.status === 401) {
    token = await forceRefreshToken("x");
    response = await send(token.accessToken);
  }
  if (response.status !== 429) return response;

  let delay = 1000;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await onStatus?.("Capacity — retrying");
    const retryAfter = Number(response.headers.get("retry-after"));
    const wait =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : jitterWait(delay);
    await sleep(Math.min(wait, 20000));
    delay = Math.min(delay * 2, 16000);
    token = await ensureFreshToken("x");
    response = await send(token.accessToken);
    if (response.status === 401) {
      token = await forceRefreshToken("x");
      response = await send(token.accessToken);
    }
    if (response.status !== 429) return response;
  }
  return response;
}

async function uploadXMedia(media: XMedia, onStatus?: XPublishInput["onStatus"]): Promise<string> {
  const initJson = await xApi(
    "/2/media/upload/initialize",
    () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: media.mime,
        total_bytes: media.bytes.byteLength,
        media_category: media.category,
      }),
    }),
    onStatus,
  );
  let mediaId = "";
  let split = false;
  if (initJson.ok) {
    mediaId = mediaIdFrom(await initJson.json());
    split = Boolean(mediaId);
  }
  if (!mediaId) {
    const fallback = await xApi(
      "/2/media/upload",
      () => {
        const form = new FormData();
        form.set("command", "INIT");
        form.set("media_type", media.mime);
        form.set("total_bytes", String(media.bytes.byteLength));
        form.set("media_category", media.category);
        return { method: "POST", body: form };
      },
      onStatus,
    );
    if (!fallback.ok) throw new Error("PUBLISHER_REJECTED");
    mediaId = mediaIdFrom(await fallback.json());
    split = false;
  }
  if (!mediaId) throw new Error("PUBLISHER_REJECTED");

  let index = 0;
  for (let offset = 0; offset < media.bytes.byteLength; offset += CHUNK_SIZE) {
    const chunk = media.bytes.subarray(offset, offset + CHUNK_SIZE);
    const segment = index;
    const appendPath = split
      ? `/2/media/upload/${encodeURIComponent(mediaId)}/append`
      : "/2/media/upload";
    const append = await xApi(
      appendPath,
      () => {
        const form = new FormData();
        if (!split) {
          form.set("command", "APPEND");
          form.set("media_id", mediaId);
        }
        form.set("segment_index", String(segment));
        form.set("media", new Blob([new Uint8Array(chunk)], { type: media.mime }), "chunk");
        return { method: "POST", body: form };
      },
      onStatus,
    );
    if (!append.ok) throw new Error("PUBLISHER_REJECTED");
    index += 1;
  }

  const finPath = split
    ? `/2/media/upload/${encodeURIComponent(mediaId)}/finalize`
    : "/2/media/upload";
  const fin = await xApi(
    finPath,
    () => {
      if (split) {
        return {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        };
      }
      const form = new FormData();
      form.set("command", "FINALIZE");
      form.set("media_id", mediaId);
      return { method: "POST", body: form };
    },
    onStatus,
  );
  if (!fin.ok) throw new Error("PUBLISHER_REJECTED");
  const finalized = (await fin.json()) as unknown;
  const finalizedId = mediaIdFrom(finalized) || mediaId;
  return finalizedId;
}

function processingInfo(json: unknown): {
  state?: string;
  check_after_secs?: number;
} | null {
  const rec = json as {
    data?: { processing_info?: { state?: string; check_after_secs?: number } };
    processing_info?: { state?: string; check_after_secs?: number };
  };
  return rec.data?.processing_info ?? rec.processing_info ?? null;
}

async function waitXProcessed(mediaId: string, onStatus?: XPublishInput["onStatus"]): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    const status = await xApi(
      `/2/media/upload?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
      () => ({ method: "GET", signal: AbortSignal.timeout(12000) }),
      onStatus,
    );
    if (!status.ok) return;
    const json = (await status.json()) as unknown;
    const info = processingInfo(json);
    const state = info?.state;
    if (!state || state === "succeeded") return;
    if (state === "failed") throw new Error("PUBLISHER_REJECTED");
    await sleep(Math.min(8000, Math.max(1000, (info?.check_after_secs ?? 2) * 1000)));
  }
  throw new Error("PUBLISHER_REJECTED");
}
