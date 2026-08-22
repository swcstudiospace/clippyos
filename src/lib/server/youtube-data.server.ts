/**
 * YouTube Data API v3 — server-side only.
 * Public Data API supplies subscribers, total views, and video stats.
 * Watch time and CTR are YouTube Analytics (OAuth) metrics — never fabricated.
 */
import { LONG_FORM_SECONDS } from "@/lib/ideation";
import { SNAPSHOT_JSON_CAP, TOP_VIDEOS_CAP, type TopVideo } from "@/lib/analytics";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { sanitizeText } from "@/lib/sanitize";

const SETTING_KEYS = ["YOUTUBE_API_KEY", "YOUTUBE_DATA_API_KEY", "YT_API_KEY"] as const;
const BASE = "https://www.googleapis.com/youtube/v3";

export type ChannelStats = {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  canonicalUrl: string;
  subscriberCount: number | null;
  viewCount: number | null;
  videoCount: number | null;
  uploadsPlaylistId: string | null;
};

export type PulledSnapshot = {
  channel: ChannelStats;
  views: number | null;
  subscribers: number | null;
  watchHours: null;
  impressionsCtr: null;
  topVideos: TopVideo[];
  incompleteTopVideos: boolean;
};

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

export async function youtubeDataApiAvailable(): Promise<boolean> {
  return Boolean(await loadYoutubeApiKey());
}

export async function loadYoutubeApiKey(): Promise<string | null> {
  const env =
    process.env.YOUTUBE_API_KEY?.trim() ||
    process.env.YOUTUBE_DATA_API_KEY?.trim() ||
    process.env.YT_API_KEY?.trim() ||
    "";
  if (env && !looksRedacted(env)) return env;
  for (const key of SETTING_KEYS) {
    const value = (await readAppSetting(key))?.trim() ?? "";
    if (value && !looksRedacted(value)) return value;
  }
  return null;
}

export async function persistYoutubeApiKey(key: string): Promise<void> {
  await writeAppSetting("YOUTUBE_API_KEY", key.trim());
}

async function ytGet<T>(path: string, params: Record<string, string>, key: string): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 403 || response.status === 429) throw new Error("YOUTUBE_QUOTA");
  if (!response.ok) throw new Error("YOUTUBE_UNAVAILABLE");
  return (await response.json()) as T;
}

type ChannelList = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
    statistics?: {
      viewCount?: string;
      subscriberCount?: string;
      hiddenSubscriberCount?: boolean;
      videoCount?: string;
    };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
};

function toInt(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function mapChannel(item: NonNullable<ChannelList["items"]>[number]): ChannelStats {
  const thumbs = item.snippet?.thumbnails;
  const thumbnail = thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null;
  const id = item.id ?? "";
  return {
    channelId: id,
    title: item.snippet?.title?.trim() || "YouTube channel",
    description: (item.snippet?.description ?? "").slice(0, 2000),
    thumbnail,
    canonicalUrl: id ? `https://www.youtube.com/channel/${id}` : "",
    subscriberCount: item.statistics?.hiddenSubscriberCount ? null : toInt(item.statistics?.subscriberCount),
    viewCount: toInt(item.statistics?.viewCount),
    videoCount: toInt(item.statistics?.videoCount),
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? (id ? `UU${id.slice(2)}` : null),
  };
}

export async function fetchChannelByIdOrHandle(
  input: { channelId?: string; handle?: string },
  key: string,
): Promise<ChannelStats | null> {
  const params: Record<string, string> = {
    part: "snippet,statistics,contentDetails",
    maxResults: "1",
  };
  if (input.channelId) params.id = input.channelId;
  else if (input.handle) params.forHandle = input.handle.replace(/^@/, "");
  else return null;
  const data = await ytGet<ChannelList>("channels", params, key);
  const item = data.items?.[0];
  return item ? mapChannel(item) : null;
}

function parseIsoDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) ? total : null;
}

type PlaylistItems = {
  nextPageToken?: string;
  items?: Array<{
    contentDetails?: { videoId?: string };
    snippet?: { title?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } };
  }>;
};

type VideosList = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: { maxres?: { url?: string }; high?: { url?: string }; medium?: { url?: string } };
    };
    statistics?: { viewCount?: string; likeCount?: string };
    contentDetails?: { duration?: string };
  }>;
};

export async function pullPublicAnalytics(params: {
  channelId?: string;
  handle?: string;
}): Promise<PulledSnapshot> {
  const key = await loadYoutubeApiKey();
  if (!key) throw new Error("YOUTUBE_KEY_MISSING");
  const channel = await fetchChannelByIdOrHandle(params, key);
  if (!channel) throw new Error("YOUTUBE_CHANNEL_NOT_FOUND");

  let incomplete = false;
  const videos: TopVideo[] = [];
  const playlistId = channel.uploadsPlaylistId;
  if (playlistId) {
    try {
      const ids: string[] = [];
      let page: string | undefined;
      while (ids.length < TOP_VIDEOS_CAP) {
        const pageParams: Record<string, string> = {
          part: "snippet,contentDetails",
          playlistId,
          maxResults: "50",
        };
        if (page) pageParams.pageToken = page;
        const list = await ytGet<PlaylistItems>("playlistItems", pageParams, key);
        for (const item of list.items ?? []) {
          const id = item.contentDetails?.videoId;
          if (id) ids.push(id);
          if (ids.length >= TOP_VIDEOS_CAP) break;
        }
        page = list.nextPageToken;
        if (!page) break;
      }
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const details = await ytGet<VideosList>("videos", {
          part: "snippet,statistics,contentDetails",
          id: chunk.join(","),
        }, key);
        for (const item of details.items ?? []) {
          const videoId = item.id ?? "";
          const duration = parseIsoDuration(item.contentDetails?.duration);
          const thumbs = item.snippet?.thumbnails;
          videos.push({
            videoId,
            title: sanitizeText((item.snippet?.title ?? "Untitled").slice(0, 300)),
            views: toInt(item.statistics?.viewCount),
            likes: toInt(item.statistics?.likeCount),
            durationSeconds: duration,
            publishedAt: item.snippet?.publishedAt ?? null,
            thumbnail: thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? null,
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
            isLongForm: duration != null && duration >= LONG_FORM_SECONDS,
          });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === "YOUTUBE_QUOTA") throw error;
      incomplete = true;
    }
  }

  videos.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
  const capped = videos.slice(0, TOP_VIDEOS_CAP);
  let json = JSON.stringify(capped);
  if (json.length > SNAPSHOT_JSON_CAP) {
    json = JSON.stringify(capped.slice(0, 20));
    incomplete = true;
  }

  return {
    channel,
    views: channel.viewCount,
    subscribers: channel.subscriberCount,
    watchHours: null,
    impressionsCtr: null,
    topVideos: JSON.parse(json) as TopVideo[],
    incompleteTopVideos: incomplete,
  };
}
