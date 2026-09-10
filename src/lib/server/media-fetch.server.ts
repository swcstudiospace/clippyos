/**
 * Fetch a page-link video (YouTube, TikTok, Vimeo, …) into a Crayo asset.
 *
 * Runs yt-dlp inside a throw-away Daytona sandbox and PUTs the file straight to Crayo's signed
 * upload URL, so no video bytes ever pass through a Vercel function. The Crayo key stays on the
 * server: the sandbox only ever sees the single-use PUT URL. The sandbox is deleted in `finally`.
 *
 * Never import from a client component.
 */
import { createClient, loadDaytonaConfig } from "@/lib/server/daytona.server";
import {
  crayoCompleteUpload,
  crayoCreateUpload,
} from "@/lib/server/crayo.server";
import {
  CRAYO_PUT_SCRIPT,
  MEDIA_MAX_BYTES,
  YTDLP_BOOTSTRAP_SCRIPT,
  YTDLP_DOWNLOAD_SCRIPT,
  YTDLP_FORMAT_MERGED,
  YTDLP_FORMAT_PROGRESSIVE,
  YTDLP_PROBE_SCRIPT,
  mediaAssetFilename,
  mediaContentType,
  mediaFetchAllowlist,
  mediaProbeProblem,
  parseMediaProbe,
} from "@/lib/media-fetch";

export class MediaFetchError extends Error {
  detail: string;
  constructor(code: string, detail: string) {
    super(code);
    this.detail = detail;
  }
}

export type MediaFetchResult = {
  assetId: string;
  title: string;
  durationSec: number | null;
  bytes: number;
  contentType: string;
};

type Progress = (message: string) => Promise<void> | void;

const SANDBOX_AUTOSTOP_MINUTES = 10;
const LABELS = { purpose: "media-fetch", app: "clippyos" } as const;
/** Leave room under Vercel's 300s function ceiling for the Crayo AutoClip call that follows. */
const DEFAULT_BUDGET_MS = 235_000;

function tail(text: string, lines = 4): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-lines)
    .join(" · ")
    .slice(0, 300);
}

/** Strip anything that could be a signed URL or token before a message leaves the server. */
function scrub(text: string): string {
  return text.replace(/https?:\/\/\S+/g, "<url>").replace(/X-Amz-[A-Za-z-]+=\S+/g, "").slice(0, 300);
}

function outputOf(result: unknown): string {
  const rec = (result ?? {}) as { result?: unknown; stdout?: unknown; artifacts?: { stdout?: unknown } };
  return String(rec.result ?? rec.artifacts?.stdout ?? rec.stdout ?? "");
}

function exitOf(result: unknown): number {
  const code = Number((result as { exitCode?: unknown })?.exitCode);
  return Number.isFinite(code) ? code : 1;
}

export async function fetchPageVideoToCrayoAsset(input: {
  url: string;
  name?: string;
  onProgress?: Progress;
  budgetMs?: number;
}): Promise<MediaFetchResult> {
  const config = await loadDaytonaConfig();
  if (!config) {
    throw new MediaFetchError(
      "DAYTONA_UNAVAILABLE",
      "Fetching a YouTube/TikTok link needs the Daytona sandbox. Connect Daytona in Settings → Social Machine.",
    );
  }
  const started = Date.now();
  const budget = Math.max(60_000, input.budgetMs ?? DEFAULT_BUDGET_MS);
  const remainingSec = (reserveSec = 0) =>
    Math.max(5, Math.floor((budget - (Date.now() - started)) / 1000) - reserveSec);
  const progress: Progress = input.onProgress ?? (() => {});

  const daytona = createClient(config);
  let sandbox: any = null;
  try {
    await progress("Starting a Daytona sandbox to fetch the video (no bytes touch this server).");
    sandbox = await daytona.create(
      {
        language: "python",
        autoStopInterval: SANDBOX_AUTOSTOP_MINUTES,
        labels: { ...LABELS },
        public: false,
        networkBlockAll: false,
        domainAllowList: mediaFetchAllowlist(input.url),
        ...(config.proxyUrl ? { outboundProxyUrl: config.proxyUrl } : {}),
      } as never,
      { timeout: Math.min(120, remainingSec(90)) },
    );

    const exec = async (script: string, env: Record<string, string>, timeoutSec: number) => {
      const command = `bash -c ${shellQuote(script)}`;
      if (sandbox.process?.executeCommand) {
        return sandbox.process.executeCommand(command, undefined, env, Math.max(5, Math.floor(timeoutSec)));
      }
      return sandbox.process.execute(command);
    };

    await progress("Installing yt-dlp in the sandbox.");
    const boot = await exec(YTDLP_BOOTSTRAP_SCRIPT, {}, Math.min(90, remainingSec(60)));
    const bootOut = outputOf(boot).trim().split("\n");
    const bin = bootOut.find((line) => /^(yt-dlp|python3 -m yt_dlp|\/tmp\/mf\/yt-dlp)$/.test(line.trim()))?.trim();
    if (exitOf(boot) !== 0 || !bin) {
      throw new MediaFetchError(
        "MEDIA_FETCH_FAILED",
        `yt-dlp could not be installed in the sandbox: ${scrub(tail(outputOf(boot)))}`,
      );
    }

    await progress("Reading the video's title and length.");
    const probeRes = await exec(YTDLP_PROBE_SCRIPT, { MF_BIN: bin, MF_URL: input.url }, Math.min(60, remainingSec(45)));
    const probeOut = outputOf(probeRes);
    const probe = exitOf(probeRes) === 0 ? parseMediaProbe(probeOut) : null;
    if (!probe) {
      throw new MediaFetchError(
        "MEDIA_FETCH_FAILED",
        `The page could not be read by yt-dlp: ${scrub(tail(probeOut))}`,
      );
    }
    const durationProblem = mediaProbeProblem(probe);
    if (durationProblem) throw new MediaFetchError("MEDIA_LENGTH_OUT_OF_RANGE", durationProblem);

    await progress(
      `Downloading “${probe.title || "video"}”${probe.durationSec ? ` (${Math.round(probe.durationSec / 60)} min)` : ""} at up to 720p.`,
    );
    const hasFfmpeg = /^\/?.*ffmpeg/.test(outputOf(await exec("command -v ffmpeg || true", {}, 10)));
    const download = await exec(
      YTDLP_DOWNLOAD_SCRIPT,
      {
        MF_BIN: bin,
        MF_URL: input.url,
        MF_FORMAT: hasFfmpeg ? YTDLP_FORMAT_MERGED : YTDLP_FORMAT_PROGRESSIVE,
        MF_MAX: `${Math.floor(MEDIA_MAX_BYTES / (1024 * 1024))}m`,
      },
      remainingSec(45),
    );
    const dlOut = outputOf(download).trim();
    const last = dlOut.split("\n").pop() ?? "";
    const [bytesRaw, filePath] = last.split("\t");
    const bytes = Number(bytesRaw);
    if (exitOf(download) !== 0 || !filePath || !Number.isFinite(bytes) || bytes <= 0) {
      const reason = scrub(tail(dlOut));
      const code = /max-filesize|File is larger than/i.test(reason) ? "MEDIA_TOO_LARGE" : "MEDIA_FETCH_FAILED";
      throw new MediaFetchError(code, `Download failed: ${reason}`);
    }
    if (bytes > MEDIA_MAX_BYTES) {
      throw new MediaFetchError("MEDIA_TOO_LARGE", `Downloaded file is ${Math.round(bytes / 1_048_576)}MB; Crayo caps video uploads at 1GB.`);
    }
    const contentType = mediaContentType(filePath);
    if (!contentType) {
      throw new MediaFetchError("MEDIA_FETCH_FAILED", `Downloaded container “${filePath.split(".").pop()}” is not one Crayo accepts.`);
    }

    await progress(`Uploading ${Math.round(bytes / 1_048_576)}MB to Crayo.`);
    const filename = mediaAssetFilename(input.name?.trim() || probe.title, filePath.split(".").pop() ?? "mp4");
    const upload = await crayoCreateUpload({ filename, contentType, sizeBytes: bytes });
    let putHost = "";
    try {
      putHost = new URL(upload.url).hostname;
    } catch {
      putHost = "";
    }
    if (putHost) {
      try {
        await sandbox.updateNetworkSettings({ domainAllowList: mediaFetchAllowlist(input.url, [putHost]) });
      } catch {
        /* allow-list already covers *.crayo.ai; best-effort for S3-style hosts */
      }
    }
    const put = await exec(
      CRAYO_PUT_SCRIPT,
      { MF_FILE: filePath, MF_CT: upload.headers["content-type"] ?? contentType, MF_PUT_URL: upload.url },
      remainingSec(15),
    );
    const putOut = outputOf(put).trim();
    const status = Number(putOut.match(/^(\d{3})/)?.[1] ?? 0);
    if (exitOf(put) !== 0 || status < 200 || status >= 300) {
      throw new MediaFetchError(
        "MEDIA_UPLOAD_FAILED",
        `Crayo's signed upload URL answered ${status || "with a network error"}: ${scrub(tail(putOut))}`,
      );
    }

    await progress("Finalizing the Crayo asset.");
    const assetId = await crayoCompleteUpload(upload.id);
    return { assetId, title: probe.title, durationSec: probe.durationSec, bytes, contentType };
  } finally {
    try {
      if (sandbox?.delete) await sandbox.delete();
      else if (sandbox?.stop) await sandbox.stop();
    } catch {
      /* auto-stop + auto-delete policy still applies */
    }
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
