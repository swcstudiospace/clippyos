/**
 * YouTube Data API v3 publisher.
 * Resumable upload + videos.insert metadata. Drafts land private.
 * Tokens stay in AppSetting. Never returned to the client or Hermes.
 */
import { isTrustedImageUrl } from "@/lib/thumbnails";
import type { SocialUploadMode, YoutubeJobOptions, YoutubePrivacyStatus } from "@/lib/social";
import type { YoutubePublisherDetails } from "@/lib/publishers";
import { emptyYoutubeDetails } from "@/lib/publishers";
import {
  ensureFreshToken,
  loadPublisherApp,
  readToken,
  readYoutubePublishDefaults,
} from "@/lib/server/social-oauth.server";

export type YtPublishInput = {
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
  youtube?: YoutubeJobOptions | null;
  mediaMeta?: {
    durationSec?: number | null;
    width?: number | null;
    height?: number | null;
    title?: string | null;
  } | null;
};

export type YtPublishResult = {
  status: "succeeded" | "needs_attention" | "failed";
  externalPostId: string | null;
  externalUrl: string | null;
  reason?: string;
  provider: "YOUTUBE";
};

const TITLE_MAX = 100;
const DESC_MAX = 5000;
const TAG_MAX = 500;
const SHORTS_MAX_SEC = 180;
const VERTICAL_MAX_RATIO = 0.62;
const HITS_WINDOW_MS = 60 * 60 * 1000;
const HITS_MAX = 8;

const hits: number[] = [];

function rateLimitLocal(): void {
  const now = Date.now();
  while (hits.length && now - hits[0]! >= HITS_WINDOW_MS) hits.shift();
  if (hits.length >= HITS_MAX) throw new Error("PUBLISHER_RATE_LIMIT");
  hits.push(now);
}

function isTrustedYtMedia(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/library/file")) return true;
  if (url.startsWith("data:")) return /^data:(video|image)\//i.test(url);
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/library/file") return true;
  } catch {
    /* */
  }
  return isTrustedImageUrl(url);
}

function clipTitle(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled upload";
  return cleaned.slice(0, TITLE_MAX);
}

function clipDescription(raw: string): string {
  return raw.trim().slice(0, DESC_MAX);
}

function clipTags(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  const out: string[] = [];
  let used = 0;
  for (const tag of tags) {
    const value = tag.replace(/[<>]/g, "").trim().slice(0, 30);
    if (!value) continue;
    if (used + value.length + 1 > TAG_MAX) break;
    out.push(value);
    used += value.length + 1;
  }
  return out;
}

export function looksLikeShort(input: {
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
}): boolean {
  const duration = input.durationSec ?? null;
  if (duration != null && duration > SHORTS_MAX_SEC) return false;
  const width = input.width ?? 0;
  const height = input.height ?? 0;
  if (width > 0 && height > 0) {
    return height > width && width / height <= VERTICAL_MAX_RATIO;
  }
  return duration != null && duration <= 60;
}

function applyShortsMark(title: string, description: string, mark: boolean): {
  title: string;
  description: string;
} {
  if (!mark) return { title, description };
  const has = /#shorts\b/i.test(title) || /#shorts\b/i.test(description);
  if (has) return { title, description };
  const taggedTitle = title.length + 8 <= TITLE_MAX ? `${title} #Shorts` : title;
  const taggedDesc = description.includes("#Shorts") || description.includes("#shorts")
    ? description
    : `${description}\n\n#Shorts`.trim();
  return { title: taggedTitle, description: taggedDesc.slice(0, DESC_MAX) };
}

export async function readYoutubeDetails(): Promise<YoutubePublisherDetails> {
  const [token, defaults] = await Promise.all([readToken("youtube"), readYoutubePublishDefaults()]);
  const channelId = token?.userId ?? null;
  const channelTitle = token?.handle ?? null;
  return {
    channelId,
    channelTitle,
    categoryId: defaults.categoryId,
    privacyDefault: defaults.privacyDefault,
    eligible: Boolean(token?.accessToken && (token.refreshToken || token.accessToken)),
  };
}

export async function getYouTubePublisherSnapshot(): Promise<YoutubePublisherDetails> {
  return readYoutubeDetails();
}

export async function isConfigured(): Promise<boolean> {
  try {
    const [app, token] = await Promise.all([loadPublisherApp("youtube"), readToken("youtube")]);
    return Boolean(app && token?.accessToken);
  } catch {
    return false;
  }
}

export async function isEligible(): Promise<{ ok: boolean; reason: string | null }> {
  if (!(await isConfigured())) {
    return { ok: false, reason: "Connect YouTube with youtube.upload in Settings." };
  }
  const details = await readYoutubeDetails();
  if (!details.eligible) {
    return { ok: false, reason: "YouTube upload token is missing or expired." };
  }
  return { ok: true, reason: null };
}

function resolvePrivacy(input: YtPublishInput, fallback: YoutubePrivacyStatus): YoutubePrivacyStatus {
  if (input.mode === "draft") return "private";
  const requested = input.youtube?.privacyStatus;
  if (requested === "private" || requested === "unlisted" || requested === "public") return requested;
  return fallback === "public" ? "unlisted" : fallback;
}

export async function publish(input: YtPublishInput): Promise<YtPublishResult> {
  rateLimitLocal();
  if (!(await isConfigured())) throw new Error("PUBLISHER_NOT_CONNECTED");
  if (!input.mediaUrl) throw new Error("MEDIA_REQUIRED");
  if (!isTrustedYtMedia(input.mediaUrl)) throw new Error("UNTRUSTED_IMAGE");

  const defaults = await readYoutubePublishDefaults();
  const caption = input.caption.trim();
  const firstLine = caption.split("\n")[0] ?? "";
  let title = clipTitle(
    input.youtube?.title?.trim() || input.mediaMeta?.title?.trim() || firstLine || "Untitled upload",
  );
  let description = clipDescription(input.youtube?.description ?? caption);
  const tags = clipTags(input.youtube?.tags);
  const privacy = resolvePrivacy(input, defaults.privacyDefault);
  const categoryId = (input.youtube?.categoryId ?? defaults.categoryId ?? "22").replace(/\D/g, "") || "22";
  const notifySubscribers = input.youtube?.notifySubscribers === true;
  const markShorts = Boolean(
    input.youtube?.markShorts &&
      looksLikeShort({
        durationSec: input.mediaMeta?.durationSec,
        width: input.mediaMeta?.width,
        height: input.mediaMeta?.height,
      }),
  );
  ({ title, description } = applyShortsMark(title, description, markShorts));

  await input.onStatus?.("Starting YouTube resumable upload…");
  const { runChunkedUpload } = await import("@/lib/server/chunked-upload.server");
  let session;
  try {
    session = await runChunkedUpload({
      platform: "youtube",
      sourceUrl: input.mediaUrl,
      jobId: input.jobId,
      postId: input.postId,
      sessionId: input.sessionId,
      extras: {
        title,
        description,
        tags,
        privacyStatus: privacy,
        categoryId,
        notifySubscribers,
        mime: "video/mp4",
      },
      onProgress: async (progress) => {
        await input.onProgress?.({
          percent: progress.percent,
          phase: progress.phase,
          sessionId: progress.sessionId,
        });
        await input.onStatus?.(`Uploading to YouTube… ${progress.percent}%`);
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PUBLISHER_REJECTED";
    if (code === "YOUTUBE_QUOTA") {
      return {
        status: "needs_attention",
        externalPostId: null,
        externalUrl: null,
        provider: "YOUTUBE",
        reason: "YouTube quota exceeded. Wait for the daily reset before retrying API upload.",
      };
    }
    if (code === "YT_INVALID_METADATA") {
      return {
        status: "failed",
        externalPostId: null,
        externalUrl: null,
        provider: "YOUTUBE",
        reason: "YouTube rejected the title, description, or tags. Fix metadata and retry.",
      };
    }
    throw error;
  }

  const videoId = String(session.platformExtras.videoId ?? session.externalSessionId ?? "");
  if (!videoId || videoId.startsWith("http")) throw new Error("PUBLISHER_REJECTED");

  if (input.youtube?.thumbUrl && isTrustedYtMedia(input.youtube.thumbUrl)) {
    try {
      await setThumbnail(videoId, input.youtube.thumbUrl);
    } catch {
      /* thumbnail is optional */
    }
  }

  const draftNote =
    input.mode === "draft" || privacy === "private"
      ? "Uploaded as private. It is not public."
      : privacy === "unlisted"
        ? "Uploaded unlisted."
        : undefined;

  return {
    status: "succeeded",
    externalPostId: videoId,
    externalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    provider: "YOUTUBE",
    reason: draftNote,
  };
}

async function setThumbnail(videoId: string, url: string): Promise<void> {
  const token = await ensureFreshToken("youtube");
  let bytes: Buffer;
  let mime = "image/jpeg";
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) return;
    mime = match[1];
    bytes = Buffer.from(match[2], "base64");
  } else {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "follow" });
    if (!response.ok) return;
    mime = response.headers.get("content-type")?.split(";")[0]?.trim() || mime;
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.byteLength > 2 * 1024 * 1024) return;
  await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": mime,
        "Content-Length": String(bytes.byteLength),
      },
      body: new Uint8Array(bytes),
      signal: AbortSignal.timeout(30000),
    },
  );
}
