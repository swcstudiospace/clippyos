/**
 * Page-link video fetch — client-safe constants and pure helpers.
 *
 * Crayo only imports a raw media *file*. Links to YouTube, TikTok, Vimeo, X, Twitch and friends
 * are HTML pages, so ClippyOS fetches those with yt-dlp inside a short-lived Daytona sandbox and
 * PUTs the file straight to Crayo's signed upload URL (video ≤ 1GB). Nothing here touches secrets.
 */

/** Hosts yt-dlp can resolve to a media file. Matched on the registrable host, `www.`/`m.` stripped. */
export const FETCHABLE_PAGE_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
  "tiktok.com",
  "twitch.tv",
  "x.com",
  "twitter.com",
  "kick.com",
  "rumble.com",
  "dailymotion.com",
  "facebook.com",
  "fb.watch",
  "instagram.com",
] as const;

/** Page hosts that need a signed-in browser or a share link, which yt-dlp cannot use unattended. */
export const UNFETCHABLE_PAGE_HOSTS = ["drive.google.com", "dropbox.com", "onedrive.live.com"] as const;

/** Crayo AutoClip accepts a video between 1 minute and 3 hours (docs: Create AutoClip job). */
export const MEDIA_MIN_SECONDS = 60;
export const MEDIA_MAX_SECONDS = 3 * 60 * 60;
/** Crayo direct upload cap for video is 1GB; keep headroom for container overhead. */
export const MEDIA_MAX_BYTES = 950 * 1024 * 1024;
export const MEDIA_MAX_HEIGHT = 720;

/**
 * yt-dlp format selectors. The merged form needs ffmpeg in the sandbox; the progressive form
 * (single mp4 stream, ≤720p on YouTube) needs nothing. Both stay under the Crayo 1GB cap via
 * `--max-filesize`.
 */
export const YTDLP_FORMAT_MERGED = `bv*[height<=${MEDIA_MAX_HEIGHT}][ext=mp4]+ba[ext=m4a]/b[height<=${MEDIA_MAX_HEIGHT}][ext=mp4]/b[ext=mp4]/b`;
export const YTDLP_FORMAT_PROGRESSIVE = `b[ext=mp4][vcodec^=avc1][height<=${MEDIA_MAX_HEIGHT}]/b[ext=mp4][height<=${MEDIA_MAX_HEIGHT}]/b[ext=mp4]/b[height<=${MEDIA_MAX_HEIGHT}]/b`;

/** Daytona rejects a sandbox allow-list with more than this many entries. */
export const DAYTONA_DOMAIN_ALLOWLIST_MAX = 20;

/** Always needed: yt-dlp install sources and Crayo's signed upload hosts. */
const MEDIA_FETCH_BASE_DOMAINS = [
  "pypi.org",
  "files.pythonhosted.org",
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "uploads.crayo.ai",
  "*.crayo.ai",
] as const;

/** Per-site page + CDN domains. Only the family matching the source URL is opened. */
const MEDIA_FETCH_SITE_DOMAINS: ReadonlyArray<{ hosts: readonly string[]; allow: readonly string[] }> = [
  {
    hosts: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    allow: ["youtube.com", "*.youtube.com", "youtu.be", "*.googlevideo.com", "*.ytimg.com", "*.ggpht.com"],
  },
  { hosts: ["vimeo.com"], allow: ["vimeo.com", "*.vimeo.com", "*.vimeocdn.com", "*.akamaized.net"] },
  {
    hosts: ["tiktok.com"],
    allow: ["tiktok.com", "*.tiktok.com", "*.tiktokcdn.com", "*.tiktokcdn-us.com", "*.byteoversea.com"],
  },
  { hosts: ["twitch.tv"], allow: ["twitch.tv", "*.twitch.tv", "*.ttvnw.net", "*.jtvnw.net"] },
  { hosts: ["x.com", "twitter.com"], allow: ["x.com", "*.x.com", "twitter.com", "*.twitter.com", "*.twimg.com"] },
  { hosts: ["kick.com"], allow: ["kick.com", "*.kick.com"] },
  { hosts: ["rumble.com"], allow: ["rumble.com", "*.rumble.com", "*.rmbl.ws"] },
  { hosts: ["dailymotion.com"], allow: ["dailymotion.com", "*.dailymotion.com", "*.dmcdn.net"] },
  { hosts: ["facebook.com", "fb.watch"], allow: ["facebook.com", "*.facebook.com", "fb.watch", "*.fbcdn.net"] },
  { hosts: ["instagram.com"], allow: ["instagram.com", "*.instagram.com", "*.cdninstagram.com"] },
];

export type MediaSourceKind = "direct" | "fetch";

function registrableHost(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  return parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
}

function hostMatches(host: string, list: readonly string[]): boolean {
  return list.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * How AutoClip should treat a source URL:
 * - `fetch`: a page link yt-dlp can resolve (YouTube, TikTok, …) → sandbox fetch + Crayo upload
 * - `direct`: any other https URL → Crayo imports the file itself
 * - `null`: not usable (non-https, malformed, or a share-page host yt-dlp cannot read)
 */
export function mediaSourceKind(url: string): MediaSourceKind | null {
  const host = registrableHost(url);
  if (!host) return null;
  if (hostMatches(host, UNFETCHABLE_PAGE_HOSTS)) return null;
  if (hostMatches(host, FETCHABLE_PAGE_HOSTS)) return "fetch";
  return "direct";
}

/**
 * Domain allow-list for the sandbox fetching `sourceUrl`: the install/upload base, the one site
 * family that matches the source, and any extra hosts (Crayo's signed PUT host). Always at most
 * DAYTONA_DOMAIN_ALLOWLIST_MAX entries — Daytona refuses longer lists outright.
 */
export function mediaFetchAllowlist(sourceUrl: string, extraHosts: string[] = []): string {
  const set = new Set<string>(MEDIA_FETCH_BASE_DOMAINS);
  const host = registrableHost(sourceUrl);
  if (host) {
    const family = MEDIA_FETCH_SITE_DOMAINS.find((site) => hostMatches(host, site.hosts));
    for (const domain of family?.allow ?? [host]) set.add(domain);
  }
  for (const extra of extraHosts) {
    const clean = extra.trim().toLowerCase();
    if (/^[a-z0-9.*-]+$/.test(clean)) set.add(clean);
  }
  return [...set].slice(0, DAYTONA_DOMAIN_ALLOWLIST_MAX).join(",");
}

export type MediaProbe = {
  title: string;
  durationSec: number | null;
  ext: string | null;
  uploader: string | null;
};

/** Parse `yt-dlp -J` output. Tolerates leading log noise and playlist wrappers. */
export function parseMediaProbe(raw: string): MediaProbe | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw.slice(start));
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  let info = json as Record<string, unknown>;
  if (Array.isArray(info.entries) && info.entries.length && typeof info.entries[0] === "object") {
    info = info.entries[0] as Record<string, unknown>;
  }
  const duration = Number(info.duration);
  return {
    title: typeof info.title === "string" ? info.title.replace(/\s+/g, " ").trim().slice(0, 100) : "",
    durationSec: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
    ext: typeof info.ext === "string" && /^[a-z0-9]{2,6}$/i.test(info.ext) ? info.ext.toLowerCase() : null,
    uploader: typeof info.uploader === "string" ? info.uploader.slice(0, 80) : null,
  };
}

/** Why a probed video cannot go to AutoClip, or null when it fits Crayo's bounds. */
export function mediaProbeProblem(probe: MediaProbe): string | null {
  if (probe.durationSec == null) return null; // live/unknown — let the download decide
  if (probe.durationSec < MEDIA_MIN_SECONDS) {
    return `This video is ${probe.durationSec}s long; Crayo AutoClip needs at least ${MEDIA_MIN_SECONDS}s.`;
  }
  if (probe.durationSec > MEDIA_MAX_SECONDS) {
    return `This video is ${Math.round(probe.durationSec / 60)} minutes long; Crayo AutoClip caps at 3 hours.`;
  }
  return null;
}

/** MIME type Crayo accepts for the downloaded container, or null when it is not a video Crayo takes. */
export function mediaContentType(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  if (ext === "mkv") return "video/x-matroska";
  return null;
}

/** Filename Crayo will show for the asset (≤100 chars after sanitizing, per docs). */
export function mediaAssetFilename(title: string, ext: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "long-form"}.${ext.replace(/[^a-z0-9]/gi, "") || "mp4"}`;
}

/**
 * Shell that resolves a yt-dlp launcher inside the sandbox and prints it on the last line.
 * Prefers an installed binary, then pip, then the static GitHub release.
 */
export const YTDLP_BOOTSTRAP_SCRIPT = `set -u
mkdir -p /tmp/mf
if command -v yt-dlp >/dev/null 2>&1; then echo "yt-dlp"; exit 0; fi
if python3 -c "import yt_dlp" >/dev/null 2>&1; then echo "python3 -m yt_dlp"; exit 0; fi
(python3 -m pip install -q --disable-pip-version-check --user yt-dlp || python3 -m pip install -q --disable-pip-version-check yt-dlp) >/tmp/mf/pip.log 2>&1 || true
if python3 -c "import yt_dlp" >/dev/null 2>&1; then echo "python3 -m yt_dlp"; exit 0; fi
if curl -fsSL --max-time 60 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/mf/yt-dlp 2>>/tmp/mf/pip.log; then
  chmod +x /tmp/mf/yt-dlp
  if /tmp/mf/yt-dlp --version >/dev/null 2>&1; then echo "/tmp/mf/yt-dlp"; exit 0; fi
fi
echo "NO_YTDLP"
tail -n 3 /tmp/mf/pip.log 2>/dev/null
exit 1
`;

/** Probe metadata as JSON on stdout. Reads MF_BIN and MF_URL from the environment. */
export const YTDLP_PROBE_SCRIPT = `set -u
$MF_BIN -J --no-playlist --no-warnings --no-check-certificate "$MF_URL" 2>/tmp/mf/probe.err || { echo "PROBE_FAILED"; tail -n 4 /tmp/mf/probe.err; exit 1; }
`;

/**
 * Download to /tmp/mf/src.<ext> and print `<bytes>\\t<path>` on the last line.
 * Reads MF_BIN, MF_URL, MF_FORMAT, MF_MAX (yt-dlp --max-filesize value) from the environment.
 */
export const YTDLP_DOWNLOAD_SCRIPT = `set -u
rm -f /tmp/mf/src.*
MERGE=""
if command -v ffmpeg >/dev/null 2>&1; then MERGE="--merge-output-format mp4"; fi
$MF_BIN --no-playlist --no-warnings --no-progress --no-check-certificate --retries 3 --fragment-retries 5 \\
  -f "$MF_FORMAT" $MERGE --max-filesize "$MF_MAX" -o "/tmp/mf/src.%(ext)s" "$MF_URL" >/tmp/mf/dl.log 2>&1 \\
  || { echo "DOWNLOAD_FAILED"; tail -n 6 /tmp/mf/dl.log; exit 1; }
FILE=$(ls -S /tmp/mf/src.* 2>/dev/null | head -n 1)
if [ -z "$FILE" ]; then echo "DOWNLOAD_FAILED"; tail -n 6 /tmp/mf/dl.log; exit 1; fi
printf '%s\\t%s\\n' "$(stat -c %s "$FILE")" "$FILE"
`;

/** PUT the file to Crayo's signed URL; prints the HTTP status. Reads MF_FILE, MF_CT, MF_PUT_URL. */
export const CRAYO_PUT_SCRIPT = `set -u
curl -sS -o /tmp/mf/put.out -w '%{http_code}' -X PUT -H "content-type: $MF_CT" --upload-file "$MF_FILE" --max-time 280 "$MF_PUT_URL" || { echo " PUT_FAILED"; tail -c 300 /tmp/mf/put.out 2>/dev/null; exit 1; }
`;
