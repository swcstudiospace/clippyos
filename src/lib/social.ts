import type { AppRole, SocialPlatform, SocialPost } from "@/lib/entities";
import type { PublisherStatus, SocialPreferredRail } from "@/lib/publishers";
import type { UploadPhase } from "@/lib/chunked-upload";
import type { PostPerformance } from "@/lib/performance";

export const SOCIAL_QUERY_KEY = ["social"] as const;

export const DEFAULT_DAYTONA_API_URL = "https://app.daytona.io/api";
export const DEFAULT_AUTO_STOP_MINUTES = 20;
export const SOCIAL_LONG_RUN_MS = 2 * 60 * 60 * 1000;
export const SOCIAL_NOVNC_PORT = 6080;
export const SOCIAL_MAX_CONCURRENT_JOBS = 2;
export const DEFAULT_DESKTOP_WIDTH = 1280;
export const DEFAULT_DESKTOP_HEIGHT = 800;

export const SOCIAL_LABELS = {
  app: "clippy-os",
  purpose: "social",
} as const;

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export const PLATFORM_HOME_URL: Record<SocialPlatform, string> = {
  instagram: "https://www.instagram.com/",
  x: "https://x.com/home",
  tiktok: "https://www.tiktok.com/",
  youtube: "https://studio.youtube.com/",
};

export const PLATFORM_UPLOAD_URL: Record<SocialPlatform, string> = {
  instagram: "https://www.instagram.com/",
  x: "https://x.com/compose/post",
  tiktok: "https://www.tiktok.com/tiktokstudio/upload",
  youtube: "https://studio.youtube.com/",
};

export const YT_PRIVACY_STATUSES = ["private", "unlisted", "public"] as const;
export type YoutubePrivacyStatus = (typeof YT_PRIVACY_STATUSES)[number];

export type YoutubeJobOptions = {
  title?: string;
  description?: string;
  tags?: string[];
  privacyStatus?: YoutubePrivacyStatus;
  markShorts?: boolean;
  thumbAssetId?: string | null;
  thumbUrl?: string | null;
  categoryId?: string;
  notifySubscribers?: boolean;
};

export function parseYoutubeJobOptions(raw: unknown): YoutubeJobOptions | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const nested =
    rec.youtube && typeof rec.youtube === "object" ? (rec.youtube as Record<string, unknown>) : rec;
  const title =
    typeof nested.title === "string"
      ? nested.title
      : typeof rec.ytTitle === "string"
        ? rec.ytTitle
        : undefined;
  const description =
    typeof nested.description === "string"
      ? nested.description
      : typeof rec.ytDescription === "string"
        ? rec.ytDescription
        : undefined;
  const tagsRaw = nested.tags ?? rec.ytTags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String).map((row) => row.trim()).filter(Boolean).slice(0, 30)
    : typeof tagsRaw === "string"
      ? tagsRaw
          .split(",")
          .map((row) => row.trim())
          .filter(Boolean)
          .slice(0, 30)
      : undefined;
  const privacyRaw = nested.privacyStatus ?? rec.ytPrivacy;
  const privacyStatus =
    privacyRaw === "private" || privacyRaw === "unlisted" || privacyRaw === "public"
      ? privacyRaw
      : undefined;
  const markShorts =
    nested.markShorts === true ||
    nested.markShorts === false ||
    rec.ytMarkShorts === true ||
    rec.ytMarkShorts === false
      ? Boolean(nested.markShorts ?? rec.ytMarkShorts)
      : undefined;
  const thumbAssetId =
    typeof nested.thumbAssetId === "string"
      ? nested.thumbAssetId
      : typeof rec.ytThumbAssetId === "string"
        ? rec.ytThumbAssetId
        : undefined;
  const thumbUrl =
    typeof nested.thumbUrl === "string"
      ? nested.thumbUrl
      : typeof rec.ytThumbUrl === "string"
        ? rec.ytThumbUrl
        : undefined;
  const categoryId =
    typeof nested.categoryId === "string"
      ? nested.categoryId
      : typeof rec.ytCategoryId === "string"
        ? rec.ytCategoryId
        : undefined;
  const notifySubscribers =
    nested.notifySubscribers === true || rec.ytNotifySubscribers === true ? true : undefined;
  if (
    !title &&
    !description &&
    !tags?.length &&
    !privacyStatus &&
    markShorts == null &&
    !thumbAssetId &&
    !thumbUrl &&
    !categoryId &&
    !notifySubscribers
  ) {
    return null;
  }
  return {
    title,
    description,
    tags,
    privacyStatus,
    markShorts,
    thumbAssetId,
    thumbUrl,
    categoryId,
    notifySubscribers,
  };
}

export const SOCIAL_JOB_STATUSES = [
  "queued",
  "running",
  "needs_attention",
  "succeeded",
  "failed",
  "cancelled",
  "awaiting_approval",
] as const;
export type SocialJobStatus = (typeof SOCIAL_JOB_STATUSES)[number];

export const SOCIAL_UPLOAD_MODES = ["draft", "publish"] as const;
export type SocialUploadMode = (typeof SOCIAL_UPLOAD_MODES)[number];

export type MachineState =
  | "not_configured"
  | "stopped"
  | "paused"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export type PlatformSessionState = "logged_in" | "not_logged_in" | "unknown";

export type SocialAsset = {
  id: string;
  clientId: string;
  kind: "thumbnail" | "published" | "title" | "channel" | "library";
  label: string;
  mediaUrl: string | null;
  caption: string | null;
};

export type SocialMachineStatus = {
  state: MachineState;
  configured: boolean;
  sandboxId: string | null;
  autoStopMinutes: number;
  startedAt: string | null;
  stoppedAt: string | null;
  runningMs: number | null;
  longRunning: boolean;
  previewUrl: string | null;
  previewExpiresAt: string | null;
  lastScreenshot: string | null;
  lastError: string | null;
  computerUse: boolean;
  pathNote: string | null;
  displayWidth: number | null;
  displayHeight: number | null;
  os: "windows" | "linux" | null;
  size: string | null;
  region: "us" | "eu" | null;
  snapshotName: string | null;
  geoWarning: string | null;
  proxyConfigured: boolean;
};

export type PublicMachineStatus = {
  state: MachineState;
  configured: boolean;
  sandboxId: string | null;
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
  autoStopMinutes: number;
  runningDurationMs: number | null;
  computerUse: boolean;
  longRunning: boolean;
};

export type SocialJob = {
  id: string;
  clientId: string;
  assetId: string | null;
  caption: string | null;
  mode: SocialUploadMode;
  status: SocialJobStatus;
  platforms: SocialPlatform[];
  idempotencyKey: string | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  preferredRail: SocialPreferredRail;
  fallbackToBrowser: boolean;
  youtube?: YoutubeJobOptions | null;
};

export type SocialJobView = SocialJob & {
  posts: SocialPost[];
  uploadPercent: number | null;
  uploadPhase: UploadPhase | null;
  resumableSessionId: string | null;
};

export type CostGuard = {
  running: boolean;
  durationMs: number | null;
  autoStopMinutes: number;
  activeJobs: number;
  recommendStop: boolean;
};

export type PlatformHealth = {
  platform: SocialPlatform;
  sessionStatus: "logged_in" | "needs_login" | "unknown";
  lastCheckedAt: string | null;
};

export type SocialSnapshot = {
  machine: SocialMachineStatus;
  sessions: Record<SocialPlatform, PlatformSessionState>;
  posts: SocialPost[];
  jobs: SocialJobView[];
  assets: SocialAsset[];
  clients: Array<{ id: string; name: string }>;
  role: AppRole | null;
  publishers: Record<SocialPlatform, PublisherStatus>;
  performance: PostPerformance[];
};

export function toPublicMachineStatus(machine: SocialMachineStatus): PublicMachineStatus {
  return {
    state: machine.state,
    configured: machine.configured,
    sandboxId: machine.sandboxId,
    lastStartedAt: machine.startedAt,
    lastStoppedAt: machine.stoppedAt,
    autoStopMinutes: machine.autoStopMinutes,
    runningDurationMs: machine.runningMs,
    computerUse: machine.computerUse,
    longRunning: machine.longRunning,
  };
}

export function machineLabel(state: MachineState): string {
  switch (state) {
    case "running":
      return "Running";
    case "starting":
      return "Starting";
    case "stopping":
      return "Hibernating";
    case "paused":
      return "Hibernated";
    case "error":
      return "Error";
    case "not_configured":
      return "Not configured";
    default:
      return "Stopped";
  }
}

export function machineTone(
  state: MachineState,
): "green" | "orange" | "red" | "neutral" | "blue" {
  switch (state) {
    case "running":
      return "green";
    case "paused":
      return "orange";
    case "starting":
    case "stopping":
      return "orange";
    case "error":
      return "red";
    case "not_configured":
      return "neutral";
    default:
      return "neutral";
  }
}

export function postStatusLabel(status: SocialPost["status"]): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "needs_attention":
      return "Needs attention";
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
  }
}

export function jobStatusLabel(status: SocialJobStatus): string {
  switch (status) {
    case "awaiting_approval":
      return "Waiting for approval";
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "needs_attention":
      return "Needs attention";
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}

export function sessionLabel(state: PlatformSessionState): string {
  switch (state) {
    case "logged_in":
      return "Logged in";
    case "not_logged_in":
      return "Not logged in";
    default:
      return "Unknown";
  }
}

export function sessionToHealth(
  state: PlatformSessionState,
): PlatformHealth["sessionStatus"] {
  if (state === "logged_in") return "logged_in";
  if (state === "not_logged_in") return "needs_login";
  return "unknown";
}

export function parseDisplaySize(value: string | null | undefined): {
  width: number;
  height: number;
} | null {
  if (!value) return null;
  const match = /^(\d{3,5})x(\d{3,5})$/i.exec(value.trim());
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 320 || height < 240 || width > 7680 || height > 4320) return null;
  return { width, height };
}

export function formatDisplaySize(width: number, height: number): string {
  return `${Math.round(width)}×${Math.round(height)}`;
}

/** Scale the noVNC stream so the entire desktop is visible inside the iframe. */
export function novncEmbedUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  try {
    const parsed = new URL(src);
    if (!parsed.searchParams.has("resize")) parsed.searchParams.set("resize", "scale");
    if (!parsed.searchParams.has("autoconnect")) parsed.searchParams.set("autoconnect", "true");
    return parsed.toString();
  } catch {
    return src;
  }
}

export function uploadPhaseLabel(phase: UploadPhase | null | undefined): string {
  switch (phase) {
    case "init":
      return "Starting upload";
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "publishing":
      return "Publishing";
    default:
      return "Uploading";
  }
}

export function attachJobProgress(posts: SocialPost[]): {
  uploadPercent: number | null;
  uploadPhase: UploadPhase | null;
  resumableSessionId: string | null;
} {
  const running = posts.find((post) => post.status === "running" || post.status === "queued");
  const withProgress = running ?? posts.find((post) => post.uploadPercent != null) ?? posts[0];
  return {
    uploadPercent: withProgress?.uploadPercent ?? null,
    uploadPhase: withProgress?.uploadPhase ?? null,
    resumableSessionId: withProgress?.resumableSessionId ?? null,
  };
}
