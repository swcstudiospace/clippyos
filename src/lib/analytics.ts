/** Client-safe analytics derivation. Charts and cards read AnalyticsSnapshot only. */

import type { AnalyticsSnapshot, Client } from "@/lib/entities";

export const ANALYTICS_QUERY_KEY = ["analytics"] as const;
export const TOP_VIDEOS_CAP = 50;
export const SNAPSHOT_JSON_CAP = 64_000;

export type TopVideo = {
  videoId: string;
  title: string;
  views: number | null;
  likes: number | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  thumbnail: string | null;
  url: string;
  isLongForm: boolean;
};

export type ParsedSnapshot = AnalyticsSnapshot & {
  viewsN: number | null;
  subscribersN: number | null;
  watchHoursN: number | null;
  ctrN: number | null;
  videos: TopVideo[];
};

export type ClientAnalyticsRow = {
  client: Client;
  latest: ParsedSnapshot | null;
};

function toNum(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseTopVideos(raw: string | null | undefined): TopVideo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: TopVideo[] = [];
    for (const item of parsed.slice(0, TOP_VIDEOS_CAP)) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const videoId = String(row.videoId ?? "").trim();
      const title = String(row.title ?? "").trim();
      if (!videoId && !title) continue;
      const duration = toNum(row.durationSeconds as string | number | null);
      out.push({
        videoId,
        title: title.slice(0, 300),
        views: toNum(row.views as string | number | null),
        likes: toNum(row.likes as string | number | null),
        durationSeconds: duration,
        publishedAt: row.publishedAt == null ? null : String(row.publishedAt),
        thumbnail: row.thumbnail == null ? null : String(row.thumbnail),
        url:
          typeof row.url === "string" && row.url.startsWith("https://")
            ? row.url
            : videoId
              ? `https://www.youtube.com/watch?v=${videoId}`
              : "",
        isLongForm: row.isLongForm === true || (duration != null && duration >= 240),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function parseSnapshot(row: AnalyticsSnapshot): ParsedSnapshot {
  return {
    ...row,
    viewsN: toNum(row.views),
    subscribersN: toNum(row.subscribers),
    watchHoursN: toNum(row.watchHours),
    ctrN: toNum(row.impressionsCtr),
    videos: parseTopVideos(row.topVideos),
  };
}

export function latestByClient(snapshots: AnalyticsSnapshot[]): Map<string, ParsedSnapshot> {
  const map = new Map<string, ParsedSnapshot>();
  const sorted = [...snapshots].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const row of sorted) {
    if (!map.has(row.clientId)) map.set(row.clientId, parseSnapshot(row));
  }
  return map;
}

export function snapshotsForClient(
  snapshots: AnalyticsSnapshot[],
  clientId: string,
): ParsedSnapshot[] {
  return snapshots
    .filter((row) => row.clientId === clientId)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(parseSnapshot);
}

export function averageCtr(history: ParsedSnapshot[]): number | null {
  const values = history.map((row) => row.ctrN).filter((n): n is number => n != null);
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export type AnalyticsTotals = {
  subscribers: number | null;
  views: number | null;
  watchHours: number | null;
  ctr: number | null;
  clientsWithData: number;
};

export function aggregateLatest(rows: ClientAnalyticsRow[]): AnalyticsTotals {
  let subscribers = 0;
  let views = 0;
  let watchHours = 0;
  let ctrSum = 0;
  let subN = 0;
  let viewN = 0;
  let watchN = 0;
  let ctrN = 0;
  let clientsWithData = 0;
  for (const row of rows) {
    if (!row.latest) continue;
    clientsWithData += 1;
    if (row.latest.subscribersN != null) {
      subscribers += row.latest.subscribersN;
      subN += 1;
    }
    if (row.latest.viewsN != null) {
      views += row.latest.viewsN;
      viewN += 1;
    }
    if (row.latest.watchHoursN != null) {
      watchHours += row.latest.watchHoursN;
      watchN += 1;
    }
    if (row.latest.ctrN != null) {
      ctrSum += row.latest.ctrN;
      ctrN += 1;
    }
  }
  return {
    subscribers: subN ? subscribers : null,
    views: viewN ? views : null,
    watchHours: watchN ? watchHours : null,
    ctr: ctrN ? ctrSum / ctrN : null,
    clientsWithData,
  };
}

export function publicMetricUnavailable(value: number | null): boolean {
  return value == null;
}
