/**
 * Instagram Reels Graph publisher.
 * Professional (Business / Creator) accounts only. Personal stays on Computer Use.
 * Graph has no durable draft Reel — draft jobs stay in Agency Admin.
 * Tokens stay in AppSetting. Never returned to the client or Hermes.
 */
import { isTrustedImageUrl } from "@/lib/thumbnails";
import type { SocialUploadMode } from "@/lib/social";
import type { InstagramPublisherDetails } from "@/lib/publishers";
import { emptyInstagramDetails, mapIgAccountType } from "@/lib/publishers";
import {
  ensureFreshToken,
  forceRefreshToken,
  loadPublisherApp,
  readToken,
} from "@/lib/server/social-oauth.server";

export type IgPublishInput = {
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

export type IgPublishResult = {
  status: "succeeded" | "needs_attention" | "failed";
  externalPostId: string | null;
  externalUrl: string | null;
  reason?: string;
  provider: "INSTAGRAM";
  igContainerId?: string | null;
};

const GRAPH = "https://graph.facebook.com/v21.0";
const CAPTION_MAX = 2200;
const VIDEO_MAX = 300 * 1024 * 1024;
const HITS_WINDOW_MS = 60 * 60 * 1000;
const HITS_MAX = 25;

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

export async function readInstagramDetails(): Promise<InstagramPublisherDetails> {
  const token = await readToken("instagram");
  const igUserId = token?.userId ?? null;
  const username = token?.handle?.replace(/^@/, "") ?? null;
  const accountType = mapIgAccountType(token?.accountType);
  const personal = (token?.accountType ?? "").toUpperCase() === "PERSONAL";
  const eligibleReelsPublish = Boolean(token?.accessToken && igUserId && !personal);
  return {
    igUserId,
    username,
    accountType,
    pageId: token?.pageId ?? null,
    eligibleReelsPublish,
  };
}

export async function isConfigured(): Promise<boolean> {
  try {
    const [app, token] = await Promise.all([loadPublisherApp("instagram"), readToken("instagram")]);
    return Boolean(app && token?.accessToken && token.userId);
  } catch {
    return false;
  }
}

export async function isEligible(): Promise<{ ok: boolean; reason: string | null }> {
  if (!(await isConfigured())) {
    return { ok: false, reason: "Connect a professional Instagram account in Settings." };
  }
  const details = await readInstagramDetails();
  if (!details.eligibleReelsPublish) {
    return {
      ok: false,
      reason: "API publish requires an Instagram Professional account.",
    };
  }
  return { ok: true, reason: null };
}

function graphToken(token: { accessToken: string; pageToken: string | null }): string {
  return token.pageToken || token.accessToken;
}

function isTrustedIgMedia(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/library/file")) return true;
  if (url.startsWith("data:")) return /^data:video\//i.test(url) || isTrustedImageUrl(url);
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/library/file") return true;
  } catch {
    /* */
  }
  return isTrustedImageUrl(url);
}

function isVideo(mime: string, url: string): boolean {
  const hay = `${mime} ${url}`.toLowerCase();
  return hay.includes("video") || hay.includes("mp4") || hay.includes("quicktime") || hay.includes("mov");
}

function canPullUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  if (!isTrustedIgMedia(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchIgVideo(url: string): Promise<{ bytes: Buffer; mime: string }> {
  if (!isTrustedIgMedia(url)) throw new Error("UNTRUSTED_IMAGE");
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) throw new Error("UNTRUSTED_IMAGE");
    const mime = match[1];
    if (!isVideo(mime, url)) throw new Error("IG_MEDIA_UNSUPPORTED");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.byteLength > VIDEO_MAX) throw new Error("MEDIA_TOO_LARGE");
    return { bytes, mime: mime.startsWith("video/") ? mime : "video/mp4" };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(180000), redirect: "follow" });
  if (!response.ok) throw new Error("MEDIA_FETCH_FAILED");
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.byteLength > VIDEO_MAX) throw new Error("MEDIA_TOO_LARGE");
  if (!isVideo(mime, url)) throw new Error("IG_MEDIA_UNSUPPORTED");
  return { bytes: buf, mime: mime.startsWith("video/") ? mime : "video/mp4" };
}

function mapGraphError(status: number, body: string): Error {
  let code = 0;
  let message = "";
  try {
    const json = JSON.parse(body) as {
      error?: { code?: number; error_subcode?: number; message?: string; type?: string };
    };
    code = json.error?.code ?? 0;
    message = json.error?.message ?? "";
  } catch {
    /* raw */
  }
  if (status === 401 || code === 190) return new Error("PUBLISHER_TOKEN_EXPIRED");
  if (status === 429 || code === 4 || code === 17 || code === 613) return new Error("PUBLISHER_RATE_LIMIT");
  if (code === 10 || code === 200 || /permission|app review|ppa/i.test(message)) {
    return new Error("IG_APP_REVIEW");
  }
  if (/personal|not a business|professional/i.test(message) || status === 403) {
    return new Error("IG_PROFESSIONAL_REQUIRED");
  }
  if (/format|codec|aspect|duration|too large|413/i.test(message)) {
    return new Error("IG_MEDIA_UNSUPPORTED");
  }
  return new Error("PUBLISHER_REJECTED");
}

async function graphFetch(
  path: string,
  makeInit: () => RequestInit,
  onStatus?: IgPublishInput["onStatus"],
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GRAPH}${path.startsWith("/") ? path : `/${path}`}`;

  async function send(access: string): Promise<Response> {
    const req = makeInit();
    const headers = new Headers(req.headers);
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${access}`);
    const timeout = req.signal ?? AbortSignal.timeout(30000);
    return fetch(url, { ...req, headers, signal: timeout });
  }

  let token = await ensureFreshToken("instagram");
  let access = graphToken(token);
  let response = await send(access);
  if (response.status === 401) {
    token = await forceRefreshToken("instagram");
    access = graphToken(token);
    response = await send(access);
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
    token = await ensureFreshToken("instagram");
    access = graphToken(token);
    response = await send(access);
    if (response.status === 401) {
      token = await forceRefreshToken("instagram");
      access = graphToken(token);
      response = await send(access);
    }
    if (response.status !== 429) return response;
  }
  return response;
}

async function createPullContainer(
  igUserId: string,
  videoUrl: string,
  caption: string,
  onStatus?: IgPublishInput["onStatus"],
): Promise<{ id: string } | null> {
  const params = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: "true",
  });
  const response = await graphFetch(
    `/${igUserId}/media`,
    () => ({ method: "POST", body: params }),
    onStatus,
  );
  const text = await response.text();
  if (!response.ok) {
    if (/url|download|fetch|retrieve/i.test(text)) return null;
    throw mapGraphError(response.status, text);
  }
  const json = JSON.parse(text) as { id?: string };
  return json.id ? { id: json.id } : null;
}

async function createResumableContainer(
  igUserId: string,
  caption: string,
  media: { bytes: Buffer; mime: string },
  onStatus?: IgPublishInput["onStatus"],
): Promise<string> {
  const params = new URLSearchParams({
    media_type: "REELS",
    upload_type: "resumable",
    caption,
    share_to_feed: "true",
  });
  const created = await graphFetch(
    `/${igUserId}/media`,
    () => ({ method: "POST", body: params }),
    onStatus,
  );
  const createdText = await created.text();
  if (!created.ok) throw mapGraphError(created.status, createdText);
  const json = JSON.parse(createdText) as { id?: string; uri?: string };
  const containerId = json.id;
  if (!containerId) throw new Error("PUBLISHER_REJECTED");
  const uploadUri =
    json.uri || `https://rupload.facebook.com/ig-api-upload/v21.0/${containerId}`;
  await onStatus?.("Uploading Reel…");
  const token = await ensureFreshToken("instagram");
  const access = graphToken(token);
  const put = await fetch(uploadUri, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${access}`,
      offset: "0",
      file_size: String(media.bytes.byteLength),
      "Content-Type": media.mime || "application/octet-stream",
    },
    body: new Uint8Array(media.bytes),
    signal: AbortSignal.timeout(180000),
  });
  if (put.status === 401) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  if (put.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
  if (put.status === 413) throw new Error("MEDIA_TOO_LARGE");
  if (!put.ok) throw new Error("PUBLISHER_REJECTED");
  return containerId;
}

async function waitContainer(
  containerId: string,
  onStatus?: IgPublishInput["onStatus"],
): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    await onStatus?.("Processing Reel…");
    const response = await graphFetch(
      `/${containerId}?fields=status_code,status`,
      () => ({ method: "GET" }),
      onStatus,
    );
    if (!response.ok) {
      await sleep(jitterWait(2500));
      continue;
    }
    const json = (await response.json()) as { status_code?: string };
    const code = (json.status_code ?? "").toUpperCase();
    if (code === "FINISHED" || code === "PUBLISHED") return;
    if (code === "ERROR" || code === "EXPIRED") throw new Error("IG_CONTAINER_FAILED");
    await sleep(Math.min(8000, 2000 + i * 250));
  }
  throw new Error("IG_CONTAINER_FAILED");
}

export async function publish(input: IgPublishInput): Promise<IgPublishResult> {
  rateLimitLocal();
  const eligible = await isEligible();
  if (!eligible.ok) throw new Error("IG_PROFESSIONAL_REQUIRED");
  if (input.mode === "draft") {
    return {
      status: "needs_attention",
      externalPostId: null,
      externalUrl: null,
      provider: "INSTAGRAM",
      igContainerId: null,
      reason:
        "Instagram Graph has no draft Reel. This stays in Agency Admin until you queue Publish.",
    };
  }
  if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
  if (!isTrustedIgMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");

  const token = await ensureFreshToken("instagram");
  const igUserId = token.userId;
  if (!igUserId) throw new Error("IG_PROFESSIONAL_REQUIRED");
  const caption = input.caption.trim().slice(0, CAPTION_MAX);
  let containerId: string | null = null;

  if (canPullUrl(input.mediaUrl)) {
    await input.onStatus?.("Creating Reel container…");
    const pulled = await createPullContainer(igUserId, input.mediaUrl, caption, input.onStatus);
    containerId = pulled?.id ?? null;
    if (containerId) await waitContainer(containerId, input.onStatus);
  }
  if (!containerId) {
    const { runChunkedUpload } = await import("@/lib/server/chunked-upload.server");
    const session = await runChunkedUpload({
      platform: "instagram",
      sourceUrl: input.mediaUrl,
      jobId: input.jobId,
      postId: input.postId,
      sessionId: input.sessionId,
      extras: { igUserId, caption },
      onProgress: async (progress) => {
        await input.onProgress?.({
          percent: progress.percent,
          phase: progress.phase,
          sessionId: progress.sessionId,
        });
        await input.onStatus?.(`Uploading Reel… ${progress.percent}%`);
      },
    });
    containerId = session.externalSessionId;
  }
  if (!containerId) throw new Error("PUBLISHER_REJECTED");

  await input.onStatus?.("Publishing Reel…");
  const published = await graphFetch(
    `/${igUserId}/media_publish`,
    () => ({
      method: "POST",
      body: new URLSearchParams({ creation_id: containerId! }),
    }),
    input.onStatus,
  );
  const publishedText = await published.text();
  if (!published.ok) throw mapGraphError(published.status, publishedText);
  const json = JSON.parse(publishedText) as { id?: string };
  const id = json.id ?? containerId;
  const handle = token.handle?.replace(/^@/, "") ?? null;
  return {
    status: "succeeded",
    externalPostId: id,
    externalUrl: handle
      ? `https://www.instagram.com/${handle}/`
      : id
        ? `https://www.instagram.com/reel/${id}/`
        : null,
    provider: "INSTAGRAM",
    igContainerId: containerId,
  };
}

export async function getInstagramPublisherSnapshot(): Promise<InstagramPublisherDetails> {
  try {
    return await readInstagramDetails();
  } catch {
    return emptyInstagramDetails();
  }
}
