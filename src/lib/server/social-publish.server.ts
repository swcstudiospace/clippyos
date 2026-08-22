/**
 * Native social publishers (X, TikTok, Instagram Graph, YouTube Data API).
 * Browser Computer Use remains the fallback rail.
 */
import { isTrustedImageUrl } from "@/lib/thumbnails";
import type { SocialPlatform } from "@/lib/entities";
import type { SocialPostSource } from "@/lib/entities";
import type { SocialPreferredRail, SocialProvider, SocialRail, TikTokPostMode } from "@/lib/publishers";
import { emptyInstagramDetails, emptyPublisherMap, emptyTikTokDetails, emptyYoutubeDetails } from "@/lib/publishers";
import type { PublisherSnapshot, PublisherStatus } from "@/lib/publishers";
import { getUserRole } from "@/lib/server/access";
import {
  publisherStatusFor,
  readInstagramAccounts,
  readTikTokPublishMode,
  socialOauthCallbackUrl,
  type PublisherId,
} from "@/lib/server/social-oauth.server";
import type { SocialUploadMode, YoutubeJobOptions } from "@/lib/social";
import type { UploadPhase } from "@/lib/chunked-upload";

export type PublishInput = {
  mediaUrl: string | null;
  caption: string;
  mode: SocialUploadMode;
  onStatus?: (message: string) => Promise<void> | void;
  onProgress?: (progress: {
    percent: number;
    phase: UploadPhase;
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

export type PublishResult = {
  status: "succeeded" | "needs_attention" | "failed";
  externalPostId: string | null;
  externalUrl: string | null;
  reason?: string;
  provider: SocialProvider;
  tiktokPostMode?: TikTokPostMode;
  igContainerId?: string | null;
};

const hits = new Map<string, number[]>();

function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (list.length >= max) throw new Error("PUBLISHER_RATE_LIMIT");
  list.push(now);
  hits.set(key, list);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTrustedMediaUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/library/file")) return true;
  if (url.startsWith("data:")) return isTrustedImageUrl(url) || /^data:(video|image|audio)\//i.test(url);
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/library/file") return true;
  } catch {
    /* not a url */
  }
  return isTrustedImageUrl(url);
}

async function fetchMedia(url: string): Promise<{
  bytes: Buffer;
  mime: string;
  filename: string;
  isVideo: boolean;
}> {
  if (!isTrustedMediaUrl(url)) throw new Error("UNTRUSTED_IMAGE");
  if (url.startsWith("/api/library/file") || url.includes("/api/library/file")) {
    const { tokenFromLibraryUrl, readLibraryBytes } = await import("@/lib/server/library-storage.server");
    const { getVersionRow } = await import("@/lib/server/library.server");
    const token = tokenFromLibraryUrl(url);
    if (!token) throw new Error("UNTRUSTED_IMAGE");
    const { verifyLibraryToken } = await import("@/lib/server/library-storage.server");
    const verified = await verifyLibraryToken(token);
    if (!verified) throw new Error("UNTRUSTED_IMAGE");
    const version = await getVersionRow(verified.versionId);
    if (!version) throw new Error("UNTRUSTED_IMAGE");
    const bytes = await readLibraryBytes(version.storageKey);
    const mime = version.mimeType || "application/octet-stream";
    return {
      bytes,
      mime,
      filename: `library.${mime.includes("mp4") ? "mp4" : "bin"}`,
      isVideo: mime.startsWith("video/"),
    };
  }
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (!match) throw new Error("UNTRUSTED_IMAGE");
    const mime = match[1];
    const bytes = Buffer.from(match[2], "base64");
    return {
      bytes,
      mime,
      filename: mime.includes("video") ? "upload.mp4" : "upload.jpg",
      isVideo: mime.startsWith("video/"),
    };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: "follow" });
  if (!response.ok) throw new Error("MEDIA_FETCH_FAILED");
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.byteLength > 80 * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");
  const ext = mime.includes("mp4")
    ? "mp4"
    : mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : mime.includes("gif")
          ? "gif"
          : "jpg";
  return {
    bytes: buf,
    mime,
    filename: `upload.${ext}`,
    isVideo: mime.startsWith("video/") || ext === "mp4",
  };
}

export async function getPublisherSnapshot(userId: string): Promise<PublisherSnapshot> {
  const [instagram, x, tiktok, youtube, accounts, mode, role] = await Promise.all([
    publisherStatusFor("instagram"),
    publisherStatusFor("x"),
    publisherStatusFor("tiktok"),
    publisherStatusFor("youtube"),
    readInstagramAccounts(),
    readTikTokPublishMode(),
    getUserRole(userId),
  ]);
  return {
    publishers: { instagram, x, tiktok, youtube },
    instagramAccounts: accounts,
    tiktokPublishMode: mode,
    tiktok: tiktok.tiktok ?? emptyTikTokDetails(),
    instagram: instagram.instagram ?? emptyInstagramDetails(),
    youtube: youtube.youtube ?? emptyYoutubeDetails(),
    callbackUrl: socialOauthCallbackUrl(),
    role,
  };
}

export async function listPublisherStatuses(): Promise<Record<SocialPlatform, PublisherStatus>> {
  try {
    const [instagram, x, tiktok, youtube] = await Promise.all([
      publisherStatusFor("instagram"),
      publisherStatusFor("x"),
      publisherStatusFor("tiktok"),
      publisherStatusFor("youtube"),
    ]);
    return { instagram, x, tiktok, youtube };
  } catch {
    return emptyPublisherMap();
  }
}

export function providerFor(platform: SocialPlatform): SocialProvider {
  if (platform === "x") return "X";
  if (platform === "tiktok") return "TIKTOK";
  if (platform === "youtube") return "YOUTUBE";
  return "INSTAGRAM";
}

export function publisherIdFor(platform: SocialPlatform): PublisherId {
  return platform === "x"
    ? "x"
    : platform === "tiktok"
      ? "tiktok"
      : platform === "youtube"
        ? "youtube"
        : "instagram";
}

export async function resolveRail(input: {
  platform: SocialPlatform;
  preferred: SocialPreferredRail;
  fallbackToBrowser: boolean;
  daytonaConfigured: boolean;
  machineRunning: boolean;
  mode?: import("@/lib/social").SocialUploadMode;
}): Promise<{ rail: SocialRail; reason: string | null }> {
  const status = await publisherStatusFor(input.platform);
  let apiReady =
    input.platform === "x"
      ? await (await import("@/lib/server/x-publisher.server")).isConfigured()
      : status.appConfigured && status.connected && status.eligible;
  if (input.platform === "tiktok") {
    const { isConfigured, isEligible } = await import("@/lib/server/tiktok-publisher.server");
    const configured = await isConfigured();
    const eligible = await isEligible(input.mode ?? "draft");
    apiReady = configured && eligible.ok;
  }
  if (input.platform === "instagram") {
    const { isConfigured, isEligible } = await import("@/lib/server/instagram-publisher.server");
    const configured = await isConfigured();
    if ((input.mode ?? "draft") === "draft") {
      apiReady = configured;
    } else {
      const eligible = await isEligible();
      apiReady = configured && eligible.ok;
    }
  }
  if (input.platform === "youtube") {
    const { isConfigured, isEligible } = await import("@/lib/server/youtube-publisher.server");
    const configured = await isConfigured();
    const eligible = await isEligible();
    apiReady = configured && eligible.ok;
  }
  if (input.preferred === "API") {
    if (apiReady) return { rail: "API", reason: null };
    throw new Error("PUBLISHER_NOT_ELIGIBLE");
  }
  if (input.preferred === "BROWSER") {
    if (!input.daytonaConfigured) throw new Error("DAYTONA_UNAVAILABLE");
    return { rail: "BROWSER", reason: null };
  }
  if (apiReady) return { rail: "API", reason: null };
  if (input.daytonaConfigured) {
    return {
      rail: "BROWSER",
      reason: status.reason ?? "API not eligible — using Computer Use.",
    };
  }
  throw new Error("NO_PUBLISH_RAIL");
}

export async function publishViaApi(
  platform: SocialPlatform,
  input: PublishInput,
): Promise<PublishResult> {
  if (platform === "x") return publishX(input);
  if (platform === "tiktok") return publishTikTok(input);
  if (platform === "youtube") return publishYouTube(input);
  return publishInstagram(input);
}

export function sourceFromProvider(provider: SocialProvider): SocialPostSource {
  if (provider === "X") return "X";
  if (provider === "TIKTOK") return "TIKTOK";
  if (provider === "INSTAGRAM") return "INSTAGRAM";
  if (provider === "YOUTUBE") return "YOUTUBE";
  return "DAYTONA";
}

async function publishX(input: PublishInput): Promise<PublishResult> {
  const { publish } = await import("@/lib/server/x-publisher.server");
  return publish(input);
}

async function publishTikTok(input: PublishInput): Promise<PublishResult> {
  const { publish } = await import("@/lib/server/tiktok-publisher.server");
  return publish(input);
}

async function publishInstagram(input: PublishInput): Promise<PublishResult> {
  const { publish } = await import("@/lib/server/instagram-publisher.server");
  return publish(input);
}

async function publishYouTube(input: PublishInput): Promise<PublishResult> {
  const { publish } = await import("@/lib/server/youtube-publisher.server");
  return publish(input);
}
