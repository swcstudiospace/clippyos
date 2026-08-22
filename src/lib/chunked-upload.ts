export const UPLOAD_SESSION_STATUSES = [
  "INIT",
  "UPLOADING",
  "FINALIZING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
] as const;
export type UploadSessionStatus = (typeof UPLOAD_SESSION_STATUSES)[number];

export const UPLOAD_PLATFORMS = ["instagram", "x", "tiktok", "youtube"] as const;
export type UploadPlatform = (typeof UPLOAD_PLATFORMS)[number];

export const UPLOAD_PHASES = ["init", "uploading", "processing", "publishing"] as const;
export type UploadPhase = (typeof UPLOAD_PHASES)[number];

export type ChunkProgress = {
  bytesUploaded: number;
  totalBytes: number;
  percent: number;
  segmentIndex: number;
  segmentCount: number;
  phase: UploadPhase;
  sessionId: string;
};

export type ResumableUploadSession = {
  id: string;
  jobId: string | null;
  postId: string | null;
  platform: UploadPlatform;
  sourceUrl: string;
  totalBytes: number;
  chunkSizeBytes: number;
  mimeType: string;
  externalSessionId: string | null;
  externalUploadUrl: string | null;
  nextSegmentIndex: number;
  bytesUploaded: number;
  status: UploadSessionStatus;
  lastError: string | null;
  attemptCount: number;
  platformExtras: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function uploadPercent(session: {
  bytesUploaded: number;
  totalBytes: number;
}): number {
  if (!session.totalBytes) return 0;
  return Math.min(100, Math.max(0, Math.round((session.bytesUploaded / session.totalBytes) * 100)));
}

export function phaseFromSession(status: UploadSessionStatus): UploadPhase {
  if (status === "INIT") return "init";
  if (status === "UPLOADING") return "uploading";
  if (status === "FINALIZING" || status === "PROCESSING") return "processing";
  return "publishing";
}
