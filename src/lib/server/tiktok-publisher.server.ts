/**
 * TikTok Content Posting API publisher.
 * Inbox (draft) by default; Direct Post only when the operator marks the app audited.
 * Tokens stay in AppSetting. Never returned to the client or Hermes.
 */
import { isTrustedImageUrl } from "@/lib/thumbnails";
import type { SocialUploadMode } from "@/lib/social";
import type { TikTokAuditStatus, TikTokPostMode, TikTokPublisherDetails } from "@/lib/publishers";
import { emptyTikTokDetails } from "@/lib/publishers";
import {
  ensureFreshToken,
  forceRefreshToken,
  loadPublisherApp,
  readTikTokAuditStatus,
  readTikTokPublishMode,
  readTikTokVerifiedDomain,
  readToken,
} from "@/lib/server/social-oauth.server";

export type TikTokPublishInput = {
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

export type TikTokPublishResult = {
  status: "succeeded" | "needs_attention" | "failed";
  externalPostId: string | null;
  externalUrl: string | null;
  reason?: string;
  provider: "TIKTOK";
  tiktokPostMode: TikTokPostMode;
};

const API = "https://open.tiktokapis.com";
const TITLE_MAX = 150;
const VIDEO_MAX = 512 * 1024 * 1024;
const MIN_CHUNK = 5 * 1024 * 1024;
const MAX_CHUNK = 64 * 1024 * 1024;
const PREFERRED_CHUNK = 10 * 1024 * 1024;
const HITS_WINDOW_MS = 60 * 1000;
const HITS_MAX = 6;

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

function hasScope(scopes: string[], needle: string): boolean {
  return scopes.some((scope) => scope.toLowerCase().includes(needle.toLowerCase()));
}

export function toTikTokPostMode(raw: "inbox" | "direct" | TikTokPostMode): TikTokPostMode {
  if (raw === "direct" || raw === "DIRECT_POST") return "DIRECT_POST";
  return "UPLOAD_TO_INBOX";
}

export async function readTikTokDetails(): Promise<TikTokPublisherDetails> {
  const [token, mode, audit, domain] = await Promise.all([
    readToken("tiktok"),
    readTikTokPublishMode(),
    readTikTokAuditStatus(),
    readTikTokVerifiedDomain(),
  ]);
  const connected = Boolean(token?.accessToken);
  const scopes = token?.scopes ?? [];
  const inboxOk = connected && (scopes.length === 0 || hasScope(scopes, "video.upload") || hasScope(scopes, "video.publish"));
  const directOk =
    connected &&
    audit === "AUDITED" &&
    (hasScope(scopes, "video.publish") || scopes.length === 0);
  return {
    postModeDefault: toTikTokPostMode(mode),
    auditStatus: audit,
    eligibleInbox: inboxOk,
    eligibleDirectPost: directOk,
    openId: token?.openId ?? token?.userId ?? null,
    displayName: token?.handle ?? null,
    verifiedDomain: domain,
  };
}

export async function isConfigured(): Promise<boolean> {
  try {
    const [app, token] = await Promise.all([loadPublisherApp("tiktok"), readToken("tiktok")]);
    return Boolean(app && token?.accessToken);
  } catch {
    return false;
  }
}

export async function isEligible(mode: SocialUploadMode): Promise<{
  ok: boolean;
  reason: string | null;
  postMode: TikTokPostMode;
}> {
  const details = await readTikTokDetails();
  if (!(await isConfigured()) || !details.eligibleInbox) {
    return { ok: false, reason: "TikTok is not connected for API publishing.", postMode: "UPLOAD_TO_INBOX" };
  }
  if (mode === "draft") {
    return { ok: true, reason: null, postMode: "UPLOAD_TO_INBOX" };
  }
  if (details.postModeDefault === "DIRECT_POST" && details.eligibleDirectPost) {
    return { ok: true, reason: null, postMode: "DIRECT_POST" };
  }
  return {
    ok: true,
    reason:
      details.auditStatus === "AUDITED"
        ? null
        : "Public Direct Post needs an audited TikTok app. Inbox drafts still work.",
    postMode: "UPLOAD_TO_INBOX",
  };
}

function isTrustedTikTokMedia(url: string): boolean {
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

function isMp4Like(mime: string, url: string): boolean {
  const hay = `${mime} ${url}`.toLowerCase();
  return hay.includes("mp4") || hay.includes("quicktime") || hay.includes("video/");
}

async function fetchTikTokMedia(url: string): Promise<{ bytes: Buffer; mime: string }> {
  if (!isTrustedTikTokMedia(url)) throw new Error("UNTRUSTED_IMAGE");
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) throw new Error("UNTRUSTED_IMAGE");
    const mime = match[1];
    if (!isMp4Like(mime, url)) throw new Error("TIKTOK_MEDIA_UNSUPPORTED");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.byteLength > VIDEO_MAX) throw new Error("MEDIA_TOO_LARGE");
    return { bytes, mime: mime.startsWith("video/") ? mime : "video/mp4" };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(180000), redirect: "follow" });
  if (!response.ok) throw new Error("MEDIA_FETCH_FAILED");
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.byteLength > VIDEO_MAX) throw new Error("MEDIA_TOO_LARGE");
  if (!isMp4Like(mime, url)) throw new Error("TIKTOK_MEDIA_UNSUPPORTED");
  return { bytes: buf, mime: mime.startsWith("video/") ? mime : "video/mp4" };
}

function planChunks(size: number): { chunkSize: number; count: number } {
  if (size <= 0) throw new Error("MEDIA_REQUIRED");
  if (size < MIN_CHUNK) return { chunkSize: size, count: 1 };
  const chunkSize = Math.min(MAX_CHUNK, PREFERRED_CHUNK);
  if (size <= chunkSize) return { chunkSize: size, count: 1 };
  return { chunkSize, count: Math.ceil(size / chunkSize) };
}

function domainAllowsPull(mediaUrl: string, verified: string | null): boolean {
  if (!verified || !mediaUrl.startsWith("https://")) return false;
  try {
    const host = new URL(mediaUrl).hostname.toLowerCase();
    const domain = verified
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .toLowerCase()
      .replace(/^\*\./, "");
    if (!domain) return false;
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

async function tiktokFetch(
  path: string,
  makeInit: () => RequestInit,
  onStatus?: TikTokPublishInput["onStatus"],
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API}${path}`;

  async function send(accessToken: string): Promise<Response> {
    const req = makeInit();
    const headers = new Headers(req.headers);
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
    const timeout = req.signal ?? AbortSignal.timeout(25000);
    return fetch(url, { ...req, headers, signal: timeout });
  }

  let token = await ensureFreshToken("tiktok");
  let response = await send(token.accessToken);
  if (response.status === 401) {
    token = await forceRefreshToken("tiktok");
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
    token = await ensureFreshToken("tiktok");
    response = await send(token.accessToken);
    if (response.status === 401) {
      token = await forceRefreshToken("tiktok");
      response = await send(token.accessToken);
    }
    if (response.status !== 429) return response;
  }
  return response;
}

async function creatorPrivacy(
  mode: SocialUploadMode,
  onStatus?: TikTokPublishInput["onStatus"],
): Promise<string> {
  try {
    const response = await tiktokFetch(
      "/v2/post/publish/creator_info/query/",
      () => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
      onStatus,
    );
    if (!response.ok) return "SELF_ONLY";
    const json = (await response.json()) as {
      data?: { privacy_level_options?: string[] };
    };
    const options = json.data?.privacy_level_options ?? [];
    if (mode !== "draft" && options.includes("PUBLIC_TO_EVERYONE")) {
      return "PUBLIC_TO_EVERYONE";
    }
    if (options.includes("SELF_ONLY")) return "SELF_ONLY";
    return options[0] ?? "SELF_ONLY";
  } catch {
    return "SELF_ONLY";
  }
}

async function putChunks(
  uploadUrl: string,
  media: { bytes: Buffer; mime: string },
  chunkSize: number,
  onStatus?: TikTokPublishInput["onStatus"],
): Promise<void> {
  const total = media.bytes.byteLength;
  let index = 0;
  for (let offset = 0; offset < total; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, total);
    const chunk = media.bytes.subarray(offset, end);
    await onStatus?.(`Uploading TikTok video… ${Math.min(100, Math.round((end / total) * 100))}%`);
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": media.mime || "video/mp4",
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${offset}-${end - 1}/${total}`,
      },
      body: new Uint8Array(chunk),
      signal: AbortSignal.timeout(120000),
    });
    if (put.status === 401) throw new Error("PUBLISHER_TOKEN_EXPIRED");
    if (put.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
    if (!put.ok && put.status !== 201 && put.status !== 206) throw new Error("PUBLISHER_REJECTED");
    index += 1;
    void index;
  }
}

async function pollPublish(
  publishId: string,
  inbox: boolean,
  onStatus?: TikTokPublishInput["onStatus"],
): Promise<"ok" | "failed" | "timeout"> {
  for (let i = 0; i < 24; i += 1) {
    await onStatus?.(inbox ? "Waiting for TikTok inbox…" : "Waiting for TikTok publish…");
    const response = await tiktokFetch(
      "/v2/post/publish/status/fetch/",
      () => ({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish_id: publishId }),
      }),
      onStatus,
    );
    if (!response.ok) {
      await sleep(jitterWait(2500));
      continue;
    }
    const json = (await response.json()) as {
      data?: { status?: string; fail_reason?: string };
    };
    const status = (json.data?.status ?? "").toUpperCase();
    if (status === "PUBLISH_COMPLETE" || status === "SEND_TO_USER_INBOX") return "ok";
    if (status === "FAILED") return "failed";
    await sleep(Math.min(8000, 1500 + i * 400));
  }
  return "timeout";
}

export async function publish(input: TikTokPublishInput): Promise<TikTokPublishResult> {
  rateLimitLocal();
  if (!(await isConfigured())) throw new Error("PUBLISHER_NOT_CONNECTED");
  if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");

  const details = await readTikTokDetails();
  const wantDirect = input.mode === "publish" && details.postModeDefault === "DIRECT_POST";
  const useDirect = wantDirect && details.eligibleDirectPost;
  const forcedInbox = wantDirect && !useDirect;
  const postMode: TikTokPostMode = useDirect ? "DIRECT_POST" : "UPLOAD_TO_INBOX";

  if (wantDirect && details.auditStatus !== "AUDITED") {
    await input.onStatus?.(
      "TikTok app is not audited — sending to inbox instead of posting publicly.",
    );
  }

  const title = input.caption.trim().slice(0, TITLE_MAX);
  const pullable = domainAllowsPull(input.mediaUrl, details.verifiedDomain);
  const postInfo = useDirect
    ? {
        title: title || "Clip",
        privacy_level: await creatorPrivacy(input.mode, input.onStatus),
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        brand_content_toggle: false,
        brand_organic_toggle: false,
      }
    : undefined;

  let publishId: string | null = null;

  if (pullable) {
    const endpoint = useDirect
      ? "/v2/post/publish/video/init/"
      : "/v2/post/publish/inbox/video/init/";
    const initBody: Record<string, unknown> = {
      source_info: { source: "PULL_FROM_URL", video_url: input.mediaUrl },
    };
    if (postInfo) initBody.post_info = postInfo;
    const init = await tiktokFetch(
      endpoint,
      () => ({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initBody),
      }),
      input.onStatus,
    );
    if (init.status === 401) throw new Error("PUBLISHER_NOT_CONNECTED");
    if (init.status === 429) throw new Error("PUBLISHER_RATE_LIMIT");
    if (!init.ok) {
      if (useDirect) throw new Error("TIKTOK_AUDIT_REQUIRED");
      throw new Error("PUBLISHER_REJECTED");
    }
    const json = (await init.json()) as {
      data?: { publish_id?: string };
      error?: { code?: string };
    };
    if (json.error?.code && json.error.code !== "ok") {
      if (useDirect) throw new Error("TIKTOK_AUDIT_REQUIRED");
      throw new Error("PUBLISHER_REJECTED");
    }
    publishId = json.data?.publish_id ?? null;
    if (publishId) {
      const polled = await pollPublish(publishId, !useDirect, input.onStatus);
      if (polled === "failed") throw new Error("PUBLISHER_REJECTED");
      if (polled === "timeout") {
        return {
          status: "needs_attention",
          externalPostId: publishId,
          externalUrl: null,
          provider: "TIKTOK",
          tiktokPostMode: postMode,
          reason: "TikTok did not confirm the publish in time. Check TikTok and retry if it did not land.",
        };
      }
    }
  } else {
    if (!isTrustedTikTokMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
    const { runChunkedUpload } = await import("@/lib/server/chunked-upload.server");
    const session = await runChunkedUpload({
      platform: "tiktok",
      sourceUrl: input.mediaUrl,
      jobId: input.jobId,
      postId: input.postId,
      sessionId: input.sessionId,
      extras: { useDirect, postInfo },
      onProgress: async (progress) => {
        await input.onProgress?.({
          percent: progress.percent,
          phase: progress.phase,
          sessionId: progress.sessionId,
        });
        await input.onStatus?.(`Uploading TikTok video… ${progress.percent}%`);
      },
    });
    publishId = String(session.platformExtras.publishId ?? session.externalSessionId ?? "") || null;
  }

  if (!useDirect) {
    return {
      status: forcedInbox ? "needs_attention" : "succeeded",
      externalPostId: publishId,
      externalUrl: null,
      provider: "TIKTOK",
      tiktokPostMode: postMode,
      reason: forcedInbox
        ? "Sent to TikTok inbox (draft). This was not posted publicly — Direct Post needs an audited TikTok app."
        : "Uploaded to TikTok inbox (draft). Public Direct Post needs an audited TikTok app.",
    };
  }

  return {
    status: "succeeded",
    externalPostId: publishId,
    externalUrl: null,
    provider: "TIKTOK",
    tiktokPostMode: "DIRECT_POST",
  };
}

export async function getTikTokPublisherSnapshot(): Promise<TikTokPublisherDetails> {
  try {
    return await readTikTokDetails();
  } catch {
    return emptyTikTokDetails();
  }
}
