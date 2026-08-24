/** Client-safe asset library types. Secrets and storage keys never live here. */

import type { AssetPerformanceRollup, PostPerformance } from "@/lib/performance";

export const LIBRARY_QUERY_KEY = ["library"] as const;
export const LIBRARY_RENDERS_QUERY_KEY = ["library-renders"] as const;
export const LIBRARY_MEDIA_SETTINGS_KEY = ["library-media-settings"] as const;

export function libraryAssetsQueryKey(filters: LibraryFilters) {
  return ["library-assets", filters] as const;
}

export function libraryAssetQueryKey(id: string) {
  return ["library-asset", id] as const;
}

export const ASSET_KINDS = ["VIDEO", "IMAGE", "AUDIO", "SUBTITLE", "OTHER"] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_SOURCES = [
  "UPLOAD",
  "TWITCH_CLIP",
  "YOUTUBE",
  "THUMBNAIL_GEN",
  "RENDER_OUTPUT",
  "URL_IMPORT",
  "AGENT",
] as const;
export type AssetSource = (typeof ASSET_SOURCES)[number];

export const ASSET_STATUSES = ["PROCESSING", "READY", "FAILED", "ARCHIVED"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const CAPTION_STATUSES = ["PENDING", "TRANSCRIBING", "READY", "FAILED"] as const;
export type CaptionStatus = (typeof CAPTION_STATUSES)[number];

export const CAPTION_FORMATS = ["JSON_CUES", "SRT", "VTT"] as const;
export type CaptionFormat = (typeof CAPTION_FORMATS)[number];

export const CAPTION_ENGINES = ["WHISPER_LOCAL", "XAI_OR_PROVIDER", "MANUAL"] as const;
export type CaptionEngine = (typeof CAPTION_ENGINES)[number];

export const RENDER_PRESETS = ["REELS_9x16", "SQUARE_1x1", "LANDSCAPE_16x9", "CUSTOM"] as const;
export type RenderPreset = (typeof RENDER_PRESETS)[number];

export const RENDER_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELED"] as const;
export type RenderStatus = (typeof RENDER_STATUSES)[number];

export const RENDER_WORKERS = ["BASE44_FN", "DAYTONA"] as const;
export type RenderWorker = (typeof RENDER_WORKERS)[number];

export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
};

export type RenderOptions = {
  burnInCaptions: boolean;
  captionStyleId?: string;
  targetMaxDurationSec?: number;
  trim?: { startMs: number; endMs: number };
  loudnorm?: boolean;
  maxWidth?: number;
  format: "mp4";
  customWidth?: number;
  customHeight?: number;
};

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  burnInCaptions: false,
  format: "mp4",
};

export const PRESET_SIZE: Record<Exclude<RenderPreset, "CUSTOM">, { width: number; height: number }> = {
  REELS_9x16: { width: 1080, height: 1920 },
  SQUARE_1x1: { width: 1080, height: 1080 },
  LANDSCAPE_16x9: { width: 1920, height: 1080 },
};

export type LibraryAsset = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  kind: AssetKind;
  title: string;
  description: string | null;
  source: AssetSource;
  sourceRef: string | null;
  status: AssetStatus;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  mimeType: string | null;
  byteSize: number | null;
  checksum: string | null;
  currentVersionId: string | null;
  parentAssetId: string | null;
  tags: string[];
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type LibraryAssetVersion = {
  id: string;
  assetId: string;
  versionNumber: number;
  mimeType: string | null;
  byteSize: number | null;
  checksum: string | null;
  note: string | null;
  previewUrl: string | null;
  createdAt: string;
};

export type CaptionTrack = {
  id: string;
  assetId: string;
  language: string;
  status: CaptionStatus;
  format: CaptionFormat;
  cues: CaptionCue[];
  engine: CaptionEngine;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RenderJob = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  sourceAssetId: string;
  sourceVersionId: string | null;
  captionTrackId: string | null;
  preset: RenderPreset;
  options: RenderOptions;
  status: RenderStatus;
  progressPercent: number;
  outputAssetId: string | null;
  error: string | null;
  attempts: number;
  worker: RenderWorker;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdBy: string | null;
  sourceTitle?: string | null;
};

export type LibraryFilters = {
  clientId?: string;
  kind?: AssetKind;
  source?: AssetSource;
  status?: AssetStatus;
  tag?: string;
  search?: string;
};

export type ClientSummary = {
  id: string;
  name: string;
  status: string;
  deletedAt: string | null;
};

export type LibrarySnapshot = {
  assets: LibraryAsset[];
  renders: RenderJob[];
  clients: ClientSummary[];
  role: "admin" | "member";
  settings: MediaPipelineSettings;
  rollups?: AssetPerformanceRollup[];
};

export type AssetDetail = {
  asset: LibraryAsset;
  versions: LibraryAssetVersion[];
  captions: CaptionTrack[];
  derived: LibraryAsset[];
  renders: RenderJob[];
  performance?: AssetPerformanceRollup | null;
  snapshots?: PostPerformance[];
};

export type MediaPipelineSettings = {
  transcriptionConfigured: boolean;
  transcriptionEngine: CaptionEngine;
  transcriptionHint: string;
  defaultPreset: RenderPreset;
  maxUploadMb: number;
  concurrentRenders: number;
  daytonaRender: boolean;
  ffmpegAvailable: boolean;
  ffmpegVersion: string | null;
  libraryBackend: "supabase" | "s3" | "local";
  libraryBackendHint: string;
  s3Configured: boolean;
  s3Bucket: string | null;
  s3Endpoint: string | null;
  ipfsConfigured: boolean;
  ipfsGateway: string | null;
  ipfsLastCid: string | null;
  ipfsStrategy: "eager" | "on_publish" | "replicate" | "manual";
  ipfsStrategyHint: string;
};

export const DEFAULT_MEDIA_SETTINGS: MediaPipelineSettings = {
  transcriptionConfigured: false,
  transcriptionEngine: "MANUAL",
  transcriptionHint: "Connect transcription in Settings — or upload an SRT to caption manually.",
  defaultPreset: "REELS_9x16",
  maxUploadMb: 256,
  concurrentRenders: 1,
  daytonaRender: false,
  ffmpegAvailable: false,
  ffmpegVersion: null,
  libraryBackend: "local",
  libraryBackendHint:
    "Preview is using local disk. Connect immutable cloud storage so library files survive deploys. Do not store clips on the Social Machine.",
  s3Configured: false,
  s3Bucket: null,
  s3Endpoint: null,
  ipfsConfigured: false,
  ipfsGateway: null,
  ipfsLastCid: null,
  ipfsStrategy: "eager",
  ipfsStrategyHint: "Pins every new clip after it lands in immutable cloud storage.",
};

export const KIND_LABELS: Record<AssetKind, string> = {
  VIDEO: "Video",
  IMAGE: "Image",
  AUDIO: "Audio",
  SUBTITLE: "Subtitle",
  OTHER: "Other",
};

export const SOURCE_LABELS: Record<AssetSource, string> = {
  UPLOAD: "Upload",
  TWITCH_CLIP: "Twitch",
  YOUTUBE: "YouTube",
  THUMBNAIL_GEN: "Thumbnail",
  RENDER_OUTPUT: "Render",
  URL_IMPORT: "URL",
  AGENT: "Agent",
};

export const PRESET_LABELS: Record<RenderPreset, string> = {
  REELS_9x16: "Reels 9:16",
  SQUARE_1x1: "Square 1:1",
  LANDSCAPE_16x9: "Landscape 16:9",
  CUSTOM: "Custom",
};

export function formatDurationSec(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  const total = Math.round(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1073741824) return `${(value / 1048576).toFixed(1)} MB`;
  return `${(value / 1073741824).toFixed(1)} GB`;
}

export function formatTimecode(ms: number): string {
  const t = Math.max(0, Math.round(ms));
  const hours = Math.floor(t / 3600000);
  const minutes = Math.floor((t % 3600000) / 60000);
  const seconds = Math.floor((t % 60000) / 1000);
  const hundredths = Math.floor((t % 1000) / 10);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function parseTimecode(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(trimmed);
  if (match) {
    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const ms = (match[4] ?? "").padEnd(3, "0").slice(0, 3);
    if (![hours, minutes, seconds].every(Number.isFinite) || minutes > 59 || seconds > 59) return null;
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + Number(ms);
  }
  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber) || asNumber < 0) return null;
  return Math.round(asNumber * 1000);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function cueStamp(ms: number, fractionalSep: "," | "."): string {
  const t = Math.max(0, Math.round(ms));
  const hours = Math.floor(t / 3600000);
  const minutes = Math.floor((t % 3600000) / 60000);
  const seconds = Math.floor((t % 60000) / 1000);
  const frac = t % 1000;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${fractionalSep}${String(frac).padStart(3, "0")}`;
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map((cue, index) => {
      return `${index + 1}\n${cueStamp(cue.startMs, ",")} --> ${cueStamp(cue.endMs, ",")}\n${cue.text.trim()}\n`;
    })
    .join("\n");
}

export function cuesToVtt(cues: CaptionCue[]): string {
  const body = cues
    .map((cue) => `${cueStamp(cue.startMs, ".")} --> ${cueStamp(cue.endMs, ".")}\n${cue.text.trim()}\n`)
    .join("\n");
  return `WEBVTT\n\n${body}`;
}
