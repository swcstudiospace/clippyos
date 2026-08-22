/** Twitch / stream VOD clipping — client-safe types. Secrets never live here. */

export const STREAM_QUERY_KEY = ["stream"] as const;
export function streamVodsQueryKey(clientId: string) {
  return ["stream-vods", clientId] as const;
}

export const STREAM_PLATFORMS = ["TWITCH"] as const;
export type StreamPlatform = (typeof STREAM_PLATFORMS)[number];

export const STREAM_CLIP_STATUSES = ["PROCESSING", "READY", "FAILED"] as const;
export type StreamClipStatus = (typeof STREAM_CLIP_STATUSES)[number];

export const CLIP_DURATION_MIN = 5;
export const CLIP_DURATION_MAX = 60;
export const CLIP_DURATION_DEFAULT = 30;
export const CLIP_COUNT_DEFAULT = 5;
export const CLIP_COUNT_HARD_MAX = 15;

export type StreamSource = {
  id: string;
  clientId: string;
  platform: StreamPlatform;
  broadcasterId: string | null;
  login: string | null;
  displayName: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
};

export type StreamVod = {
  id: string;
  sourceId: string;
  clientId: string;
  externalId: string;
  title: string;
  url: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number | null;
  publishedAt: string | null;
  createdAt: string;
};

export type StreamClip = {
  id: string;
  vodId: string;
  clientId: string;
  externalId: string | null;
  url: string | null;
  editUrl: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  caption: string | null;
  notes: string | null;
  vodOffsetSec: number;
  durationSec: number;
  status: StreamClipStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClipOffset = {
  vodOffsetSec: number;
  durationSec: number;
  titleHint?: string;
};

export type TwitchVodPackageInputs = {
  clientId: string;
  vodId: string;
  clipCount: number;
  offsets?: ClipOffset[];
  options?: {
    queueSocialDrafts?: boolean;
    platforms?: Array<"instagram" | "x" | "tiktok" | "youtube">;
    captionStyle?: string;
  };
};

export type TwitchVodPackageClip = {
  streamClipId: string;
  externalClipId?: string;
  url?: string;
  title: string;
  caption?: string;
  vodOffsetSec: number;
  durationSec: number;
  status: StreamClipStatus;
  error?: string;
};

export type TwitchVodPackageResult = {
  vodId: string;
  clips: TwitchVodPackageClip[];
  socialJobIds: string[];
  partialSuccess: boolean;
  waitingHuman?: string;
};

export function clampClipDuration(value: unknown, fallback = CLIP_DURATION_DEFAULT): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(CLIP_DURATION_MAX, Math.max(CLIP_DURATION_MIN, Math.round(n)));
}

export function clampClipCount(value: unknown, fallback = CLIP_COUNT_DEFAULT): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(CLIP_COUNT_HARD_MAX, Math.max(1, Math.round(n)));
}

/** vod_offset is the END of the clip and must be >= duration. */
export function proposeEvenOffsets(durationSec: number, clipCount: number, clipDuration = CLIP_DURATION_DEFAULT): ClipOffset[] {
  const count = clampClipCount(clipCount);
  const dur = clampClipDuration(clipDuration);
  if (durationSec < dur) return [];
  const span = durationSec - dur;
  const offsets: ClipOffset[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    const end = Math.round(dur + (span * (i + 1)) / count);
    const vodOffsetSec = Math.min(durationSec, Math.max(dur, end));
    if (seen.has(vodOffsetSec)) continue;
    seen.add(vodOffsetSec);
    offsets.push({ vodOffsetSec, durationSec: dur });
  }
  return offsets;
}

export function formatVodDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}
