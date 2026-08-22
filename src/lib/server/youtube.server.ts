import { LONG_FORM_SECONDS } from "@/lib/ideation";
import { parseYouTubeChannelUrl } from "@/lib/youtube";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type ClassifiedVideo = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  form: "LONG" | "SHORT" | "UNKNOWN";
};

export type ChannelSnapshot = {
  channelId: string | null;
  title: string;
  description: string;
  thumbnail: string | null;
  canonicalUrl: string;
  subscriberCount: string | null;
  videos: ClassifiedVideo[];
};

export type VideoSnapshot = {
  videoId: string;
  title: string;
  description: string;
  canonicalUrl: string;
  durationSeconds: number | null;
  form: ClassifiedVideo["form"];
  channelTitle: string | null;
  channelId: string | null;
};

function classifyDuration(seconds: number | null): ClassifiedVideo["form"] {
  if (seconds == null || !Number.isFinite(seconds)) return "UNKNOWN";
  return seconds >= LONG_FORM_SECONDS ? "LONG" : "SHORT";
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error("upstream");
  return response.text();
}

function pickMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(re);
  if (match?.[1]) return decodeHtml(match[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  const match2 = html.match(re2);
  return match2?.[1] ? decodeHtml(match2[1]) : null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function extractChannelId(html: string): string | null {
  const patterns = [
    /"channelId":"(UC[\w-]{21,})"/,
    /"externalId":"(UC[\w-]{21,})"/,
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{21,})"/,
    /\/channel\/(UC[\w-]{21,})/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractSubscribers(html: string): string | null {
  const match = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/);
  if (match?.[1]) return match[1];
  const match2 = html.match(/"subscriberCount":"(\d+)"/);
  return match2?.[1] ?? null;
}

function extractDescription(html: string): string {
  return (
    pickMeta(html, "og:description") ??
    pickMeta(html, "description") ??
    ""
  );
}

async function resolvePageUrl(parsed: Extract<ReturnType<typeof parseYouTubeChannelUrl>, { ok: true }>): Promise<string> {
  if (parsed.kind === "video") {
    return `https://www.youtube.com/watch?v=${parsed.value}`;
  }
  return parsed.canonical;
}

async function videosFromRss(channelId: string): Promise<Array<{ videoId: string; title: string; publishedAt: string | null }>> {
  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
  );
  const entries = xml.split("<entry>").slice(1);
  const videos: Array<{ videoId: string; title: string; publishedAt: string | null }> = [];
  for (const entry of entries.slice(0, 25)) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
    if (id && title) videos.push({ videoId: id, title: decodeHtml(title), publishedAt: published });
  }
  return videos;
}

async function durationForVideo(videoId: string): Promise<number | null> {
  try {
    const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240815.00.00", hl: "en" },
        },
        videoId,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      videoDetails?: { lengthSeconds?: string };
    };
    const seconds = Number(body.videoDetails?.lengthSeconds);
    return Number.isFinite(seconds) ? seconds : null;
  } catch {
    return null;
  }
}

async function classifyVideos(
  raw: Array<{ videoId: string; title: string; publishedAt: string | null }>,
): Promise<ClassifiedVideo[]> {
  const slice = raw.slice(0, 20);
  const out: ClassifiedVideo[] = [];
  for (let i = 0; i < slice.length; i += 4) {
    const chunk = slice.slice(i, i + 4);
    const durations = await Promise.all(chunk.map((item) => durationForVideo(item.videoId)));
    chunk.forEach((item, index) => {
      const durationSeconds = durations[index] ?? null;
      out.push({
        ...item,
        durationSeconds,
        form: classifyDuration(durationSeconds),
      });
    });
  }
  return out;
}

export async function fetchVideoSnapshot(videoId: string): Promise<VideoSnapshot> {
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const html = await fetchText(canonicalUrl);
  const durationSeconds = await durationForVideo(videoId);
  const title =
    pickMeta(html, "og:title")?.replace(/\s*-\s*YouTube$/i, "") ??
    html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*-\s*YouTube$/i, "") ??
    "YouTube video";
  const channelTitle =
    html.match(/"ownerChannelName":"([^"]+)"/)?.[1] ??
    html.match(/"author":"([^"]+)"/)?.[1] ??
    null;
  return {
    videoId,
    title: decodeHtml(title.trim()),
    description: extractDescription(html).slice(0, 800),
    canonicalUrl,
    durationSeconds,
    form: classifyDuration(durationSeconds),
    channelTitle: channelTitle ? decodeHtml(channelTitle) : null,
    channelId: extractChannelId(html),
  };
}

export async function fetchChannelSnapshot(url: string): Promise<ChannelSnapshot> {
  const parsed = parseYouTubeChannelUrl(url);
  if (!parsed.ok) throw new Error(parsed.error);
  const pageUrl = await resolvePageUrl(parsed);
  const html = await fetchText(pageUrl);
  let channelId = parsed.kind === "channel" ? parsed.value : extractChannelId(html);
  if (!channelId && parsed.kind !== "channel") {
    const canonical = pickMeta(html, "og:url") ?? "";
    const fromOg = canonical.match(/channel\/(UC[\w-]{21,})/)?.[1];
    channelId = fromOg ?? null;
  }
  const title =
    pickMeta(html, "og:title") ??
    html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*-\s*YouTube$/, "") ??
    (parsed.kind === "handle" ? parsed.value : "YouTube channel");
  const thumbnail = pickMeta(html, "og:image");
  const description = extractDescription(html);
  const subscriberCount = extractSubscribers(html);
  const canonicalUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}`
    : parsed.canonical;
  let videos: ClassifiedVideo[] = [];
  if (channelId) {
    try {
      const rss = await videosFromRss(channelId);
      videos = await classifyVideos(rss);
    } catch {
      videos = [];
    }
  }
  return {
    channelId,
    title: title.trim(),
    description,
    thumbnail,
    canonicalUrl,
    subscriberCount,
    videos,
  };
}

export { LONG_FORM_SECONDS };

export type LongFormPick = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  durationSeconds: number;
  url: string;
  thumbnail: string;
};

/** Last N long-form uploads. Duration ≥ 240s only — never the Shorts tab. */
export async function pickLastLongForm(
  channelUrl: string,
  limit = 5,
): Promise<LongFormPick[]> {
  const snapshot = await fetchChannelSnapshot(channelUrl);
  return snapshot.videos
    .filter(
      (video) =>
        video.form === "LONG" &&
        video.durationSeconds != null &&
        video.durationSeconds >= LONG_FORM_SECONDS,
    )
    .sort((a, b) => {
      const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return right - left;
    })
    .slice(0, limit)
    .map((video) => ({
      videoId: video.videoId,
      title: video.title,
      publishedAt: video.publishedAt,
      durationSeconds: video.durationSeconds as number,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    }));
}

