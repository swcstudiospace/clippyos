/** Client-safe post-performance scoring. Missing metrics stay unknown — never zero. */

export const PERFORMANCE_QUERY_KEY = ["post-performance"] as const;
export const PERFORMANCE_ROLLUPS_KEY = ["asset-performance"] as const;
export const KNOWLEDGE_PROPOSALS_KEY = ["knowledge-proposals"] as const;
export const LEARNING_POLICY_KEY = ["learning-policy"] as const;

export const PERFORMANCE_PLATFORMS = ["X", "TIKTOK", "INSTAGRAM", "YOUTUBE", "OTHER"] as const;
export type PerformancePlatform = (typeof PERFORMANCE_PLATFORMS)[number];

export const METRICS_SOURCES = ["API", "MANUAL", "IMPORT"] as const;
export type MetricsSource = (typeof METRICS_SOURCES)[number];

export const PERFORMANCE_WINDOWS = ["LIFETIME", "D1", "D7", "D28"] as const;
export type PerformanceWindow = (typeof PERFORMANCE_WINDOWS)[number];

export const PERFORMANCE_VERDICTS = ["WINNER", "WEAK", "NEUTRAL", "UNKNOWN"] as const;
export type PerformanceVerdict = (typeof PERFORMANCE_VERDICTS)[number];

export const PROPOSAL_STATUSES = ["PENDING_REVIEW", "APPROVED", "REJECTED", "MERGED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_SOURCES = ["POST_PERFORMANCE", "PACKAGE", "MANUAL"] as const;
export type ProposalSource = (typeof PROPOSAL_SOURCES)[number];

export const PROPOSAL_SCOPES = [
  "CLIENT_TITLES",
  "CLIENT_IDEAS",
  "THUMBNAIL_GLOBAL",
  "VIDEO_GLOBAL",
  "CLIENT_CLIPPING",
] as const;
export type ProposalScope = (typeof PROPOSAL_SCOPES)[number];

export type PostMetrics = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  watchTimeSec: number | null;
  avgWatchPct: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
};

export const EMPTY_METRICS: PostMetrics = {
  views: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  watchTimeSec: null,
  avgWatchPct: null,
  impressions: null,
  clicks: null,
  ctr: null,
};

export type PostPerformance = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  socialJobId: string | null;
  socialPostId: string | null;
  platform: PerformancePlatform;
  externalPostId: string;
  externalUrl: string | null;
  mediaAssetId: string | null;
  streamClipId: string | null;
  publishedAt: string | null;
  metrics: PostMetrics;
  metricsSource: MetricsSource;
  capturedAt: string;
  capturedDay: string;
  window: PerformanceWindow;
  score: number | null;
  viewsPercentile: number | null;
  engagementPercentile: number | null;
  engagementRate: number | null;
  verdict: PerformanceVerdict;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type AssetPerformanceRollup = {
  assetId: string;
  workspaceId: string;
  clientId: string | null;
  bestPlatform: PerformancePlatform | null;
  bestExternalPostId: string | null;
  score: number | null;
  viewsTotal: number | null;
  engagementRate: number | null;
  sampleCount: number;
  winnerCount: number;
  updatedAt: string;
};

export type KnowledgeProposal = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  status: ProposalStatus;
  suggestedScope: ProposalScope;
  source: ProposalSource;
  sourceRefs: { postPerformanceIds: string[]; assetIds: string[] };
  userInputDraft: string;
  learnedPrincipleDraft: string;
  principleHash: string | null;
  confidence: number | null;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionNote: string | null;
  mergedEntryId: string | null;
  createdBy: string | null;
};

export type LearningPolicy = {
  enabled: boolean;
  autoMerge: boolean;
  winnerPercentile: number;
  minScore: number;
  minViews: number;
  fetchDelaysHours: number[];
};

export const DEFAULT_LEARNING_POLICY: LearningPolicy = {
  enabled: true,
  autoMerge: false,
  winnerPercentile: 75,
  minScore: 70,
  minViews: 100,
  fetchDelaysHours: [1, 24, 168],
};

export type MetricsApiStatus = {
  youtube: boolean;
  x: boolean;
  tiktok: boolean;
  instagram: boolean;
};

export const PLATFORM_LABELS: Record<PerformancePlatform, string> = {
  X: "X",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  OTHER: "Other",
};

export const WINDOW_LABELS: Record<PerformanceWindow, string> = {
  LIFETIME: "Lifetime",
  D1: "Day 1",
  D7: "Day 7",
  D28: "Day 28",
};

export const VERDICT_LABELS: Record<PerformanceVerdict, string> = {
  WINNER: "Winner",
  WEAK: "Weak",
  NEUTRAL: "Neutral",
  UNKNOWN: "Unknown",
};

export const SCOPE_LABELS: Record<ProposalScope, string> = {
  CLIENT_TITLES: "Client titles",
  CLIENT_IDEAS: "Client ideas",
  THUMBNAIL_GLOBAL: "Thumbnails (global)",
  VIDEO_GLOBAL: "Video & ideation (global)",
  CLIENT_CLIPPING: "Client clipping",
};

export function parseLearningPolicy(raw: unknown): LearningPolicy {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LEARNING_POLICY };
  const row = raw as Record<string, unknown>;
  const percentile = Number(row.winnerPercentile ?? row.winner_percentile);
  const minScore = Number(row.minScore ?? row.min_score);
  const minViews = Number(row.minViews ?? row.min_views);
  const delaysRaw = row.fetchDelaysHours ?? row.fetch_delays_hours;
  const delays = Array.isArray(delaysRaw)
    ? delaysRaw
        .map((item) => Number(item))
        .filter((n) => Number.isFinite(n) && n >= 0 && n <= 720)
        .slice(0, 6)
    : DEFAULT_LEARNING_POLICY.fetchDelaysHours;
  return {
    enabled: row.enabled !== false && row.enabled !== 0 && row.enabled !== "false",
    autoMerge: row.autoMerge === true || row.auto_merge === true,
    winnerPercentile:
      Number.isFinite(percentile) && percentile >= 50 && percentile <= 99
        ? Math.round(percentile)
        : DEFAULT_LEARNING_POLICY.winnerPercentile,
    minScore:
      Number.isFinite(minScore) && minScore >= 0 && minScore <= 100
        ? Math.round(minScore)
        : DEFAULT_LEARNING_POLICY.minScore,
    minViews:
      Number.isFinite(minViews) && minViews >= 0 && minViews <= 1_000_000
        ? Math.round(minViews)
        : DEFAULT_LEARNING_POLICY.minViews,
    fetchDelaysHours: delays.length ? delays : DEFAULT_LEARNING_POLICY.fetchDelaysHours,
  };
}

export function parseMetrics(raw: unknown): PostMetrics {
  const row =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : typeof raw === "string"
        ? safeJson(raw)
        : null;
  if (!row) return { ...EMPTY_METRICS };
  return {
    views: toNonNeg(row.views),
    likes: toNonNeg(row.likes),
    comments: toNonNeg(row.comments),
    shares: toNonNeg(row.shares),
    saves: toNonNeg(row.saves),
    watchTimeSec: toNonNeg(row.watchTimeSec ?? row.watch_time_sec),
    avgWatchPct: toNonNeg(row.avgWatchPct ?? row.avg_watch_pct),
    impressions: toNonNeg(row.impressions),
    clicks: toNonNeg(row.clicks),
    ctr: toNonNeg(row.ctr),
  };
}

function safeJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function toNonNeg(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function sumPresent(values: Array<number | null>): number | null {
  const present = values.filter((n): n is number => n != null);
  if (!present.length) return null;
  return present.reduce((sum, n) => sum + n, 0);
}

/** Engagement rate is unknown unless views exist. Missing engagement fields are omitted, not zeroed. */
export function mergeMetrics(prev: PostMetrics, next: PostMetrics): PostMetrics {
  return {
    views: next.views ?? prev.views,
    likes: next.likes ?? prev.likes,
    comments: next.comments ?? prev.comments,
    shares: next.shares ?? prev.shares,
    saves: next.saves ?? prev.saves,
    watchTimeSec: next.watchTimeSec ?? prev.watchTimeSec,
    avgWatchPct: next.avgWatchPct ?? prev.avgWatchPct,
    impressions: next.impressions ?? prev.impressions,
    clicks: next.clicks ?? prev.clicks,
    ctr: next.ctr ?? prev.ctr,
  };
}

export function engagementRate(metrics: PostMetrics): number | null {
  if (metrics.views == null) return null;
  const engagement = sumPresent([metrics.likes, metrics.comments, metrics.shares, metrics.saves]);
  if (engagement == null) return null;
  return engagement / Math.max(metrics.views, 1);
}

export function percentileRank(value: number, peers: number[]): number | null {
  const usable = peers.filter((n) => Number.isFinite(n));
  if (usable.length < 2) return null;
  const below = usable.filter((n) => n < value).length;
  return below / (usable.length - 1);
}

export function compositeScore(
  viewsPercentile: number | null,
  engagementPercentile: number | null,
): number | null {
  if (viewsPercentile == null && engagementPercentile == null) return null;
  if (engagementPercentile == null) return clampScore(viewsPercentile! * 100);
  if (viewsPercentile == null) return clampScore(engagementPercentile * 100);
  return clampScore(0.6 * viewsPercentile * 100 + 0.4 * engagementPercentile * 100);
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function classifyVerdict(input: {
  score: number | null;
  views: number | null;
  viewsPercentile: number | null;
  policy: LearningPolicy;
}): PerformanceVerdict {
  if (input.score == null || input.views == null) return "UNKNOWN";
  if (input.views < input.policy.minViews) return "NEUTRAL";
  const winnerByScore = input.score >= input.policy.minScore;
  const winnerByPct =
    input.viewsPercentile != null && input.viewsPercentile >= input.policy.winnerPercentile / 100;
  if (winnerByScore || winnerByPct) return "WINNER";
  if (input.viewsPercentile != null && input.viewsPercentile <= 0.25) return "WEAK";
  return "NEUTRAL";
}

export function latestSnapshotPerPost(rows: PostPerformance[]): PostPerformance[] {
  const map = new Map<string, PostPerformance>();
  const sorted = [...rows].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
  for (const row of sorted) {
    const key = row.socialPostId ?? `${row.platform}:${row.externalPostId}`;
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

export function formatUnknownNumber(value: number | null | undefined, compact?: (n: number) => string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return compact ? compact(value) : String(value);
}

export function formatEngagementPct(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(rate >= 0.1 ? 1 : 2)}%`;
}

export function principleHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 400);
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }
  return `${normalized.slice(0, 48)}:${(hash >>> 0).toString(16)}`;
}

export function socialPlatformToPerformance(
  platform: "instagram" | "x" | "tiktok" | string,
): PerformancePlatform {
  if (platform === "x") return "X";
  if (platform === "tiktok") return "TIKTOK";
  if (platform === "instagram") return "INSTAGRAM";
  if (platform === "youtube") return "YOUTUBE";
  return "OTHER";
}

export function windowForAgeHours(hours: number): PerformanceWindow {
  if (hours <= 30) return "D1";
  if (hours <= 24 * 8) return "D7";
  if (hours <= 24 * 30) return "D28";
  return "LIFETIME";
}
