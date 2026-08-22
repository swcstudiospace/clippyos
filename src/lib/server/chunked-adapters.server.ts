/**
 * Platform adapters for the shared chunked upload engine.
 * X APPEND, TikTok Content-Range, Instagram rupload.
 */
import {
  ensureFreshToken,
  forceRefreshToken,
  readXApiBase,
} from "@/lib/server/social-oauth.server";
import { registerChunkAdapter, type AdapterContext, type ChunkAdapter } from "@/lib/server/chunked-upload.server";

function graphToken(token: { accessToken: string; pageToken: string | null }): string {
  return token.pageToken || token.accessToken;
}

const instagramAdapter: ChunkAdapter = {
  platform: "instagram",
  maxBytes: 300 * 1024 * 1024,
  planChunkSize(total) {
    if (total <= 8 * 1024 * 1024) return total || 1;
    return 8 * 1024 * 1024;
  },
  async init(ctx) {
    const token = await ensureFreshToken("instagram");
    const igUserId = String(ctx.extras.igUserId ?? token.userId ?? "");
    if (!igUserId) throw new Error("IG_PROFESSIONAL_REQUIRED");
    const params = new URLSearchParams({
      media_type: "REELS",
      upload_type: "resumable",
      share_to_feed: "true",
    });
    const caption = String(ctx.extras.caption ?? "");
    if (caption) params.set("caption", caption.slice(0, 2200));
    const access = graphToken(token);
    params.set("access_token", access);
    const created = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
      method: "POST",
      body: params,
      signal: AbortSignal.timeout(30000),
    });
    const text = await created.text();
    if (!created.ok) throw new Error("PUBLISHER_REJECTED");
    const json = JSON.parse(text) as { id?: string; uri?: string };
    if (!json.id) throw new Error("PUBLISHER_REJECTED");
    return {
      externalSessionId: json.id,
      uploadUrl: json.uri || `https://rupload.facebook.com/ig-api-upload/v21.0/${json.id}`,
      extras: { igUserId, containerId: json.id },
    };
  },
  async uploadChunk(ctx, chunk) {
    const token = await ensureFreshToken("instagram");
    const access = graphToken(token);
    const url = ctx.session.externalUploadUrl;
    if (!url) return { ok: false, status: 400, errorBody: "missing upload url" };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${access}`,
        offset: String(chunk.offset),
        file_size: String(chunk.total),
        "Content-Type": "application/octet-stream",
      },
      body: new Blob([new Uint8Array(chunk.bytes)]),
      signal: AbortSignal.timeout(120000),
    });
    const text = await response.text().catch(() => "");
    let accepted = chunk.bytes.byteLength;
    if (response.ok && text) {
      try {
        const json = JSON.parse(text) as { start_offset?: string | number; offset?: string | number };
        const next = Number(json.start_offset ?? json.offset);
        if (Number.isFinite(next) && next > chunk.offset) accepted = next - chunk.offset;
      } catch {
        accepted = chunk.bytes.byteLength;
      }
    }
    return {
      ok: response.ok,
      status: response.status,
      bytesAccepted: accepted,
      errorBody: response.ok ? undefined : text.slice(0, 240),
    };
  },
  async refreshAuth() {
    await forceRefreshToken("instagram");
  },
  async finalize(ctx) {
    const id = ctx.session.externalSessionId;
    if (!id) throw new Error("PUBLISHER_REJECTED");
    const token = await ensureFreshToken("instagram");
    const access = graphToken(token);
    for (let i = 0; i < 30; i += 1) {
      const url = new URL(`https://graph.facebook.com/v21.0/${id}`);
      url.searchParams.set("fields", "status_code,status");
      url.searchParams.set("access_token", access);
      const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const json = (await response.json()) as { status_code?: string };
        const code = (json.status_code ?? "").toUpperCase();
        if (code === "FINISHED" || code === "PUBLISHED") return;
        if (code === "ERROR" || code === "EXPIRED") throw new Error("IG_CONTAINER_FAILED");
      }
      await new Promise((r) => setTimeout(r, Math.min(8000, 2000 + i * 250)));
    }
    throw new Error("IG_CONTAINER_FAILED");
  },
};

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

async function xFetch(path: string, init: RequestInit): Promise<Response> {
  const base = await readXApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const token = await ensureFreshToken("x");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token.accessToken}`);
  return fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(60000) });
}

const xAdapter: ChunkAdapter = {
  platform: "x",
  maxBytes: 512 * 1024 * 1024,
  planChunkSize(total) {
    if (total <= 4 * 1024 * 1024) return total || 1;
    return 4 * 1024 * 1024;
  },
  async init(ctx) {
    const mime = String(ctx.extras.mime ?? ctx.session.mimeType ?? "video/mp4");
    const category = String(ctx.extras.mediaCategory ?? "tweet_video");
    const initJson = await xFetch("/2/media/upload/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: mime,
        total_bytes: ctx.session.totalBytes,
        media_category: category,
      }),
    });
    let mediaId = "";
    let split = false;
    if (initJson.ok) {
      mediaId = mediaIdFrom(await initJson.json());
      split = Boolean(mediaId);
    }
    if (!mediaId) {
      const form = new FormData();
      form.set("command", "INIT");
      form.set("media_type", mime);
      form.set("total_bytes", String(ctx.session.totalBytes));
      form.set("media_category", category);
      const fallback = await xFetch("/2/media/upload", { method: "POST", body: form });
      if (!fallback.ok) throw new Error("PUBLISHER_REJECTED");
      mediaId = mediaIdFrom(await fallback.json());
      split = false;
    }
    if (!mediaId) throw new Error("PUBLISHER_REJECTED");
    return { externalSessionId: mediaId, extras: { split, mediaCategory: category, mime } };
  },
  async uploadChunk(ctx, chunk) {
    const mediaId = ctx.session.externalSessionId ?? "";
    const split = Boolean(ctx.session.platformExtras.split);
    const path = split
      ? `/2/media/upload/${encodeURIComponent(mediaId)}/append`
      : "/2/media/upload";
    const form = new FormData();
    if (!split) {
      form.set("command", "APPEND");
      form.set("media_id", mediaId);
    }
    form.set("segment_index", String(chunk.index));
    form.set(
      "media",
      new Blob([new Uint8Array(chunk.bytes)], { type: String(ctx.extras.mime ?? "video/mp4") }),
      "chunk",
    );
    const response = await xFetch(path, { method: "POST", body: form });
    const errorBody = response.ok ? undefined : (await response.text()).slice(0, 240);
    return {
      ok: response.ok,
      status: response.status,
      bytesAccepted: response.ok ? chunk.bytes.byteLength : 0,
      errorBody,
    };
  },
  async refreshAuth() {
    await forceRefreshToken("x");
  },
  async finalize(ctx) {
    const mediaId = ctx.session.externalSessionId ?? "";
    const split = Boolean(ctx.session.platformExtras.split);
    const path = split
      ? `/2/media/upload/${encodeURIComponent(mediaId)}/finalize`
      : "/2/media/upload";
    const fin = await xFetch(
      path,
      split
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
        : (() => {
            const form = new FormData();
            form.set("command", "FINALIZE");
            form.set("media_id", mediaId);
            return { method: "POST", body: form };
          })(),
    );
    if (!fin.ok) throw new Error("PUBLISHER_REJECTED");
    for (let i = 0; i < 40; i += 1) {
      const status = await xFetch(
        `/2/media/upload?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
        { method: "GET", signal: AbortSignal.timeout(12000) },
      );
      if (!status.ok) return;
      const json = (await status.json()) as {
        data?: { processing_info?: { state?: string; check_after_secs?: number } };
        processing_info?: { state?: string; check_after_secs?: number };
      };
      const info = json.data?.processing_info ?? json.processing_info;
      const state = info?.state;
      if (!state || state === "succeeded") return;
      if (state === "failed") throw new Error("PUBLISHER_REJECTED");
      await new Promise((r) =>
        setTimeout(r, Math.min(8000, Math.max(1000, (info?.check_after_secs ?? 2) * 1000))),
      );
    }
    throw new Error("PUBLISHER_REJECTED");
  },
};

async function tiktokFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await ensureFreshToken("tiktok");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token.accessToken}`);
  const url = path.startsWith("http") ? path : `https://open.tiktokapis.com${path}`;
  return fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(25000) });
}

const tiktokAdapter: ChunkAdapter = {
  platform: "tiktok",
  maxBytes: 512 * 1024 * 1024,
  planChunkSize(total) {
    const min = 5 * 1024 * 1024;
    const preferred = 10 * 1024 * 1024;
    if (total < min) return total || 1;
    if (total <= preferred) return total;
    return preferred;
  },
  async init(ctx) {
    const useDirect = Boolean(ctx.extras.useDirect);
    const chunkSize = ctx.session.chunkSizeBytes;
    const count = Math.max(1, Math.ceil(ctx.session.totalBytes / chunkSize));
    const sourceInfo = {
      source: "FILE_UPLOAD",
      video_size: ctx.session.totalBytes,
      chunk_size: chunkSize,
      total_chunk_count: count,
    };
    const body: Record<string, unknown> = { source_info: sourceInfo };
    if (useDirect && ctx.extras.postInfo) body.post_info = ctx.extras.postInfo;
    const endpoint = useDirect
      ? "/v2/post/publish/video/init/"
      : "/v2/post/publish/inbox/video/init/";
    const init = await tiktokFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (init.status === 401) throw new Error("PUBLISHER_NOT_CONNECTED");
    if (!init.ok) throw new Error(useDirect ? "TIKTOK_AUDIT_REQUIRED" : "PUBLISHER_REJECTED");
    const json = (await init.json()) as {
      data?: { publish_id?: string; upload_url?: string };
      error?: { code?: string };
    };
    if (json.error?.code && json.error.code !== "ok") {
      throw new Error(useDirect ? "TIKTOK_AUDIT_REQUIRED" : "PUBLISHER_REJECTED");
    }
    if (!json.data?.upload_url) throw new Error("PUBLISHER_REJECTED");
    return {
      externalSessionId: json.data.publish_id ?? json.data.upload_url,
      uploadUrl: json.data.upload_url,
      extras: { publishId: json.data.publish_id ?? null, useDirect },
    };
  },
  async uploadChunk(ctx, chunk) {
    const url = ctx.session.externalUploadUrl;
    if (!url) return { ok: false, status: 400, errorBody: "missing upload url" };
    const end = chunk.offset + chunk.bytes.byteLength - 1;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": String(ctx.session.mimeType || "video/mp4"),
        "Content-Length": String(chunk.bytes.byteLength),
        "Content-Range": `bytes ${chunk.offset}-${end}/${chunk.total}`,
      },
      body: new Blob([new Uint8Array(chunk.bytes)]),
      signal: AbortSignal.timeout(120000),
    });
    const ok = response.ok || response.status === 201 || response.status === 206;
    const errorBody = ok ? undefined : (await response.text()).slice(0, 240);
    return {
      ok,
      status: response.status,
      bytesAccepted: ok ? chunk.bytes.byteLength : 0,
      errorBody,
    };
  },
  async refreshAuth() {
    await forceRefreshToken("tiktok");
  },
  async finalize(ctx) {
    const publishId = String(ctx.session.platformExtras.publishId ?? ctx.session.externalSessionId ?? "");
    if (!publishId) return;
    for (let i = 0; i < 24; i += 1) {
      const response = await tiktokFetch("/v2/post/publish/status/fetch/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish_id: publishId }),
      });
      if (response.ok) {
        const json = (await response.json()) as { data?: { status?: string } };
        const status = (json.data?.status ?? "").toUpperCase();
        if (status === "PUBLISH_COMPLETE" || status === "SEND_TO_USER_INBOX") return;
        if (status === "FAILED") throw new Error("PUBLISHER_REJECTED");
      }
      await new Promise((r) => setTimeout(r, Math.min(8000, 1500 + i * 400)));
    }
  },
};

async function youtubeErrorCode(status: number, text: string): Promise<string | null> {
  if (status === 401) return "PUBLISHER_NOT_CONNECTED";
  if (status === 429) return "PUBLISHER_RATE_LIMIT";
  if (status === 403 && /quotaExceeded|dailyLimitExceeded|rateLimitExceeded/i.test(text)) {
    return "YOUTUBE_QUOTA";
  }
  if (status === 400 && /invalidTitle|invalidDescription|invalidTags|invalidMetadata|invalidVideoMetadata/i.test(text)) {
    return "YT_INVALID_METADATA";
  }
  return null;
}

const youtubeAdapter: ChunkAdapter = {
  platform: "youtube",
  maxBytes: 2 * 1024 * 1024 * 1024,
  planChunkSize(total) {
    const size = 8 * 1024 * 1024;
    if (total <= size) return total || 1;
    return size;
  },
  async init(ctx) {
    const token = await ensureFreshToken("youtube");
    const title = String(ctx.extras.title ?? "Untitled upload").slice(0, 100);
    const description = String(ctx.extras.description ?? "").slice(0, 5000);
    const tags = Array.isArray(ctx.extras.tags)
      ? ctx.extras.tags.map(String).filter(Boolean).slice(0, 30)
      : [];
    const privacy =
      ctx.extras.privacyStatus === "public" || ctx.extras.privacyStatus === "private"
        ? ctx.extras.privacyStatus
        : "unlisted";
    const categoryId = String(ctx.extras.categoryId ?? "22").replace(/\D/g, "") || "22";
    const notify = ctx.extras.notifySubscribers === true;
    const mime = String(ctx.extras.mime ?? ctx.session.mimeType ?? "video/mp4");
    const url = new URL("https://www.googleapis.com/upload/youtube/v3/videos");
    url.searchParams.set("uploadType", "resumable");
    url.searchParams.set("part", "snippet,status");
    url.searchParams.set("notifySubscribers", notify ? "true" : "false");
    const init = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(ctx.session.totalBytes),
        "X-Upload-Content-Type": mime,
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags,
          categoryId,
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
          embeddable: true,
          publicStatsViewable: true,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const text = await init.text().catch(() => "");
    const mapped = await youtubeErrorCode(init.status, text);
    if (mapped) throw new Error(mapped);
    if (!init.ok) throw new Error("PUBLISHER_REJECTED");
    const location = init.headers.get("location") || init.headers.get("Location");
    if (!location) throw new Error("PUBLISHER_REJECTED");
    return {
      externalSessionId: `yt:${ctx.session.id}`,
      uploadUrl: location,
      extras: { title, privacyStatus: privacy, categoryId },
    };
  },
  async uploadChunk(ctx, chunk) {
    const url = ctx.session.externalUploadUrl;
    if (!url) return { ok: false, status: 400, errorBody: "missing upload url" };
    const end = chunk.offset + chunk.bytes.byteLength - 1;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": String(ctx.session.mimeType || "video/mp4"),
        "Content-Length": String(chunk.bytes.byteLength),
        "Content-Range": `bytes ${chunk.offset}-${end}/${chunk.total}`,
      },
      body: new Blob([new Uint8Array(chunk.bytes)]),
      signal: AbortSignal.timeout(180000),
    });
    const text = await response.text().catch(() => "");
    if (response.status === 308) {
      const range = response.headers.get("range") || response.headers.get("Range") || "";
      const match = /bytes=\d+-(\d+)/i.exec(range);
      const received = match ? Number(match[1]) + 1 : chunk.offset + chunk.bytes.byteLength;
      const accepted = Math.max(0, received - chunk.offset);
      return { ok: true, status: 308, bytesAccepted: accepted || chunk.bytes.byteLength };
    }
    const mapped = await youtubeErrorCode(response.status, text);
    if (mapped) throw new Error(mapped);
    const complete = response.ok || response.status === 201;
    if (complete && text) {
      try {
        const json = JSON.parse(text) as { id?: string };
        if (json.id) ctx.session.platformExtras.videoId = json.id;
      } catch {
        /* */
      }
    }
    return {
      ok: complete,
      status: response.status,
      bytesAccepted: complete ? chunk.bytes.byteLength : 0,
      errorBody: complete ? undefined : text.slice(0, 240),
    };
  },
  async refreshAuth() {
    await forceRefreshToken("youtube");
  },
  async finalize(ctx) {
    const id = String(ctx.session.platformExtras.videoId ?? "");
    if (id) return;
    throw new Error("PUBLISHER_REJECTED");
  },
};

registerChunkAdapter(instagramAdapter);
registerChunkAdapter(xAdapter);
registerChunkAdapter(tiktokAdapter);
registerChunkAdapter(youtubeAdapter);
