/**
 * Background page-link fetch → Crayo AutoClip, for sources too long for one function call.
 *
 * A Daytona sandbox does the heavy lifting between ticks: it installs yt-dlp + ffmpeg, probes
 * the source, downloads Crayo-sized segments (≤3 h, ≤1 GB) and PUTs each one to Crayo's signed
 * upload URL. Every tick is short (a few API calls) and idempotent; it is driven by the Agent
 * tab's polling (getAgentRunFn) and by /api/cron/ops as a backstop, so the job survives Vercel's
 * function limit and a closed tab. State lives in agent_runs.outputs.mediaFetch. The Crayo key
 * never enters the sandbox.
 */
import { createClient, loadDaytonaConfig } from "@/lib/server/daytona.server";
import {
  crayoCompleteUpload,
  crayoCreateAutoclip,
  crayoCreateUpload,
  crayoGetAutoclip,
  CrayoApiError,
} from "@/lib/server/crayo.server";
import { getAgentRun, insertIteration, listAgentRuns, patchAgentRun } from "@/lib/server/agent.server";
import { explainAgentToolError } from "@/lib/agent";
import type { JsonValue } from "@/lib/skills";
import {
  MEDIA_JOB_MAX_MS,
  MEDIA_JOB_PUT_SCRIPT,
  MEDIA_JOB_STAGE1_SCRIPT,
  MEDIA_JOB_STAGE2_SCRIPT,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_SEGMENTS,
  MEDIA_MIN_SECONDS,
  YTDLP_FORMAT_MERGED,
  YTDLP_FORMAT_PROGRESSIVE,
  maxSegmentSeconds,
  mediaAssetFilename,
  mediaContentType,
  mediaFetchAllowlist,
  parseMediaJobStatus,
  planMediaSegments,
  type MediaJobStatus,
} from "@/lib/media-fetch";

export const MEDIA_FETCH_ERROR_CODE = "MEDIA_FETCH";

type SegmentState = {
  index: number;
  startSec: number;
  endSec: number | null;
  state: "pending" | "downloading" | "ready" | "uploading" | "uploaded" | "autoclipping" | "done" | "failed";
  bytes?: number;
  path?: string;
  uploadId?: string;
  assetId?: string;
  autoclipId?: string;
  clips?: { title: string; projectId: string | null; thumbnailUrl: string | null; library: unknown }[];
  error?: string;
};

export type MediaFetchJobState = {
  version: 1;
  phase: "booting" | "downloading" | "uploading" | "autoclipping" | "done" | "failed";
  url: string;
  sandboxId: string | null;
  actorId: string;
  clientId: string | null;
  clipCount: number;
  clipLength: number;
  editLevel: string;
  prompt: string | null;
  startedAt: string;
  deadlineAt: string;
  lockUntil: string | null;
  lastProgress: string | null;
  iterationIndex: number;
  probe: { title: string; durationSec: number | null } | null;
  clipsPerSegment: number | null;
  segments: SegmentState[];
  error: string | null;
};

const LOCK_MS = 25_000;
const LABELS = { purpose: "media-fetch-job", app: "clippyos" } as const;

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function scrub(text: string): string {
  return text.replace(/https?:\/\/\S+/g, "<url>").replace(/X-Amz-[A-Za-z-]+=\S+/g, "").replace(/\s+/g, " ").slice(0, 300);
}

function outputOf(result: unknown): string {
  const rec = (result ?? {}) as { result?: unknown; stdout?: unknown; artifacts?: { stdout?: unknown } };
  return String(rec.result ?? rec.artifacts?.stdout ?? rec.stdout ?? "");
}

function readState(outputs: Record<string, JsonValue> | null | undefined): MediaFetchJobState | null {
  const raw = outputs?.mediaFetch;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const state = raw as unknown as MediaFetchJobState;
  return state.version === 1 && Array.isArray(state.segments) ? state : null;
}

async function saveState(runId: string, outputs: Record<string, JsonValue> | null | undefined, state: MediaFetchJobState): Promise<void> {
  await patchAgentRun(runId, { outputs: { ...(outputs ?? {}), mediaFetch: state as unknown as JsonValue } });
}

async function progress(runId: string, state: MediaFetchJobState, message: string): Promise<void> {
  if (state.lastProgress === message) return;
  state.lastProgress = message;
  state.iterationIndex += 1;
  await insertIteration({
    runId,
    index: state.iterationIndex,
    kind: "observe",
    toolName: "crayo.run_autoclip",
    resultSummary: message.slice(0, 500),
    status: "running",
  }).catch(() => {});
  await patchAgentRun(runId, { summary: message.slice(0, 300) }).catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// Sandbox helpers
// ---------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySandbox = any;

async function daytonaClient() {
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  return { config, daytona: createClient(config) };
}

async function exec(sandbox: AnySandbox, script: string, env: Record<string, string>, timeoutSec: number): Promise<{ out: string; code: number }> {
  const result = await sandbox.process.executeCommand(`bash -c ${shellQuote(script)}`, undefined, env, Math.max(5, Math.floor(timeoutSec)));
  const code = Number((result as { exitCode?: unknown })?.exitCode);
  return { out: outputOf(result), code: Number.isFinite(code) ? code : 1 };
}

async function writeFile(sandbox: AnySandbox, path: string, body: string): Promise<void> {
  if (sandbox.fs?.uploadFile) {
    await sandbox.fs.uploadFile(Buffer.from(body, "utf8"), path);
    return;
  }
  const b64 = Buffer.from(body, "utf8").toString("base64");
  await exec(sandbox, `python3 -c "import pathlib,base64; pathlib.Path('${path}').write_bytes(base64.b64decode('${b64}'))"`, {}, 20);
}

/** Launch a script in the background; returns immediately. */
async function launch(sandbox: AnySandbox, scriptPath: string, logPath: string, env: Record<string, string>): Promise<void> {
  const exports = Object.entries(env)
    .map(([k, v]) => `export ${k}=${shellQuote(v)};`)
    .join(" ");
  await exec(sandbox, `${exports} setsid nohup bash ${scriptPath} > ${logPath} 2>&1 < /dev/null & disown; echo launched`, {}, 20);
}

async function readStatus(sandbox: AnySandbox): Promise<MediaJobStatus | null> {
  const { out } = await exec(sandbox, "cat /tmp/mf/status.json 2>/dev/null || true", {}, 15);
  return parseMediaJobStatus(out);
}

async function getSandbox(daytona: { get: (id: string) => Promise<AnySandbox> }, id: string): Promise<AnySandbox> {
  const sandbox = await daytona.get(id);
  const state = String(sandbox?.state ?? "").toLowerCase();
  if (state && state !== "started" && state !== "starting" && sandbox.start) {
    await sandbox.start(60).catch(() => {});
  }
  return sandbox;
}

async function deleteSandbox(sandboxId: string | null): Promise<void> {
  if (!sandboxId) return;
  try {
    const { daytona } = await daytonaClient();
    const sandbox = await daytona.get(sandboxId);
    if (sandbox?.delete) await sandbox.delete();
    else if (sandbox?.stop) await sandbox.stop();
  } catch {
    /* auto-stop / auto-delete policy still applies */
  }
}

// ---------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------

/**
 * Start the background job for a run: create the sandbox, launch stage 1, park the run in
 * waiting_resource / MEDIA_FETCH. The agent loop returns after this; ticks take over.
 */
export async function startMediaFetchJob(input: {
  runId: string;
  url: string;
  actorId: string;
  clientId: string | null;
  clipCount: number;
  clipLength: number;
  editLevel: string;
  prompt: string | null;
}): Promise<MediaFetchJobState> {
  const { config, daytona } = await daytonaClient();
  const run = await getAgentRun(input.runId);
  if (!run) throw new Error("JOB_MISSING");
  const now = Date.now();
  const state: MediaFetchJobState = {
    version: 1,
    phase: "booting",
    url: input.url,
    sandboxId: null,
    actorId: input.actorId,
    clientId: input.clientId,
    clipCount: input.clipCount,
    clipLength: input.clipLength,
    editLevel: input.editLevel,
    prompt: input.prompt,
    startedAt: new Date(now).toISOString(),
    deadlineAt: new Date(now + MEDIA_JOB_MAX_MS).toISOString(),
    lockUntil: null,
    lastProgress: null,
    iterationIndex: run.iterationCount + 1,
    probe: null,
    clipsPerSegment: null,
    segments: [],
    error: null,
  };
  const sandbox = await daytona.create(
    {
      language: "python",
      autoStopInterval: 60,
      labels: { ...LABELS, run: input.runId.slice(0, 36) },
      public: false,
      networkBlockAll: false,
      domainAllowList: mediaFetchAllowlist(input.url),
      ...(config.proxyUrl ? { outboundProxyUrl: config.proxyUrl } : {}),
    } as never,
    { timeout: 120 },
  );
  state.sandboxId = sandbox.id;
  try {
    await exec(sandbox, "mkdir -p /tmp/mf", {}, 15);
    await writeFile(sandbox, "/tmp/mf/stage1.sh", MEDIA_JOB_STAGE1_SCRIPT);
    await writeFile(sandbox, "/tmp/mf/stage2.sh", MEDIA_JOB_STAGE2_SCRIPT);
    await writeFile(sandbox, "/tmp/mf/put.sh", MEDIA_JOB_PUT_SCRIPT);
    await launch(sandbox, "/tmp/mf/stage1.sh", "/tmp/mf/stage1.log", { MF_URL: input.url });
  } catch (error) {
    await deleteSandbox(sandbox.id);
    throw error;
  }
  await saveState(input.runId, run.outputs, state);
  await progress(input.runId, state, "Sandbox started. Installing yt-dlp + ffmpeg and reading the stream's length. Long streams are split into ≤3 h / ≤1 GB segments, each its own Crayo AutoClip job.");
  return state;
}

/** One bounded, idempotent step of the job. Safe to call from polling and cron concurrently. */
export async function tickMediaFetchJob(runId: string): Promise<"idle" | "advanced" | "done" | "failed"> {
  const run = await getAgentRun(runId);
  if (!run || run.status !== "waiting_resource" || run.errorCode !== MEDIA_FETCH_ERROR_CODE) return "idle";
  const state = readState(run.outputs);
  if (!state) return "idle";
  if (run.cancelRequested) {
    await deleteSandbox(state.sandboxId);
    return "idle";
  }
  const now = Date.now();
  if (state.lockUntil && Date.parse(state.lockUntil) > now) return "idle";
  state.lockUntil = new Date(now + LOCK_MS).toISOString();
  await saveState(runId, run.outputs, state);

  const fail = async (code: string, detail: string) => {
    state.phase = "failed";
    state.error = detail;
    state.lockUntil = null;
    await saveState(runId, run.outputs, state);
    const summary = `${explainAgentToolError(code)}\n\nProvider said: ${scrub(detail)}`.slice(0, 800);
    await insertIteration({
      runId,
      index: state.iterationIndex + 1,
      kind: "error",
      toolName: "crayo.run_autoclip",
      resultSummary: summary,
      status: "error",
    }).catch(() => {});
    await patchAgentRun(runId, { status: "failed", errorCode: code, summary, finishedAt: new Date().toISOString() });
    await deleteSandbox(state.sandboxId);
    return "failed" as const;
  };

  try {
    if (Date.parse(state.deadlineAt) < now) {
      return await fail("MEDIA_FETCH_TIMEOUT", "The background fetch ran past its 4-hour ceiling.");
    }

    // ---- Phases that still need the sandbox ----
    if (state.phase === "booting" || state.phase === "downloading" || state.phase === "uploading") {
      const { daytona } = await daytonaClient();
      const sandbox = await getSandbox(daytona, state.sandboxId!);
      const status = await readStatus(sandbox);

      if (status?.phase === "failed") return await fail("MEDIA_FETCH_FAILED", status.error ?? "sandbox job failed");

      if (state.phase === "booting") {
        if (!status || status.phase === "install") {
          await progress(runId, state, "Installing yt-dlp + ffmpeg in the sandbox.");
        } else if (status.phase === "probe") {
          await progress(runId, state, "Reading the stream's title and length.");
        } else if (status.phase === "probed" && status.probe) {
          const duration = status.probe.durationSec ?? null;
          state.probe = { title: status.probe.title ?? "", durationSec: duration };
          if (duration != null && duration < MEDIA_MIN_SECONDS) {
            return await fail("MEDIA_LENGTH_OUT_OF_RANGE", `This video is ${duration}s long; Crayo AutoClip needs at least ${MEDIA_MIN_SECONDS}s.`);
          }
          const plan = planMediaSegments({ durationSec: duration ?? maxSegmentSeconds(), clipCount: state.clipCount });
          if (!plan) {
            return await fail(
              "MEDIA_LENGTH_OUT_OF_RANGE",
              `This stream is ${Math.round((duration ?? 0) / 3600)} h long; the most ClippyOS will split is ${MEDIA_MAX_SEGMENTS} segments (about ${Math.round((MEDIA_MAX_SEGMENTS * maxSegmentSeconds()) / 3600)} h at 720p).`,
            );
          }
          state.clipsPerSegment = plan.clipsPerSegment;
          state.segments = plan.segments.map((seg) => ({ index: seg.index, startSec: seg.startSec, endSec: seg.endSec, state: "pending" }));
          await writeFile(sandbox, "/tmp/mf/plan.json", JSON.stringify(plan));
          const { out } = await exec(sandbox, "cat /tmp/mf/ffmpeg.txt 2>/dev/null || true", {}, 10);
          const hasFfmpeg = out.trim().length > 0;
          await launch(sandbox, "/tmp/mf/stage2.sh", "/tmp/mf/stage2.log", {
            MF_URL: state.url,
            MF_FORMAT: hasFfmpeg ? YTDLP_FORMAT_MERGED : YTDLP_FORMAT_PROGRESSIVE,
          });
          state.phase = "downloading";
          const mins = duration ? Math.round(duration / 60) : null;
          await progress(
            runId,
            state,
            plan.segments.length === 1
              ? `Downloading “${state.probe.title || "video"}”${mins ? ` (${mins} min)` : ""} at up to 720p.`
              : `“${state.probe.title || "video"}” is ${mins} min long — splitting into ${plan.segments.length} segments of ~${Math.round(plan.segmentSeconds / 60)} min, ${plan.clipsPerSegment} clips each (${plan.totalClips} Crayo credits). Downloading segment 1.`,
          );
        }
        await saveState(runId, run.outputs, { ...state, lockUntil: null });
        return "advanced";
      }

      // downloading / uploading: reconcile sandbox status into state
      const rows = status?.segments ?? [];
      for (const seg of state.segments) {
        const row = rows.find((r) => r.index === seg.index);
        if (!row) continue;
        if (row.state === "failed" && seg.state !== "failed") {
          return await fail("MEDIA_SEGMENT_FAILED", `Segment ${seg.index + 1} download failed: ${row.error ?? "unknown"}`);
        }
        if (row.state === "downloading" && seg.state === "pending") {
          seg.state = "downloading";
          await progress(runId, state, `Downloading segment ${seg.index + 1} of ${state.segments.length}.`);
        }
        if (row.state === "ready" && (seg.state === "pending" || seg.state === "downloading")) {
          seg.state = "ready";
          seg.path = row.path;
          seg.bytes = row.bytes;
        }
      }

      // Start uploads for ready segments (one Crayo upload each); complete finished PUTs.
      for (const seg of state.segments) {
        if (seg.state === "ready" && seg.path) {
          if ((seg.bytes ?? 0) > MEDIA_MAX_BYTES) {
            return await fail("MEDIA_TOO_LARGE", `Segment ${seg.index + 1} is ${Math.round((seg.bytes ?? 0) / 1_048_576)}MB, over Crayo's 1GB upload cap.`);
          }
          const contentType = mediaContentType(seg.path);
          if (!contentType) return await fail("MEDIA_FETCH_FAILED", `Segment ${seg.index + 1} is not a container Crayo accepts.`);
          const ext = seg.path.split(".").pop() ?? "mp4";
          const base = state.probe?.title || "long-form";
          const filename = mediaAssetFilename(state.segments.length > 1 ? `${base} part ${seg.index + 1}` : base, ext);
          const upload = await crayoCreateUpload({ filename, contentType, sizeBytes: seg.bytes ?? 0 });
          let host = "";
          try {
            host = new URL(upload.url).hostname;
          } catch {
            host = "";
          }
          if (host) {
            try {
              await sandbox.updateNetworkSettings({ domainAllowList: mediaFetchAllowlist(state.url, [host]) });
            } catch {
              /* *.crayo.ai already allowed */
            }
          }
          await launch(sandbox, "/tmp/mf/put.sh", `/tmp/mf/put-${seg.index}.log`, {
            MF_INDEX: String(seg.index),
            MF_FILE: seg.path,
            MF_CT: upload.headers["content-type"] ?? contentType,
            MF_PUT_URL: upload.url,
          });
          seg.uploadId = upload.id;
          seg.state = "uploading";
          state.phase = "uploading";
          await progress(runId, state, `Uploading segment ${seg.index + 1} (${Math.round((seg.bytes ?? 0) / 1_048_576)}MB) to Crayo.`);
        } else if (seg.state === "uploading" && seg.uploadId) {
          const { out } = await exec(sandbox, `cat /tmp/mf/put-${seg.index}.json 2>/dev/null || true`, {}, 10);
          const start = out.indexOf("{");
          if (start >= 0) {
            let put: { status?: number; body?: string; error?: string } = {};
            try {
              put = JSON.parse(out.slice(start));
            } catch {
              put = {};
            }
            const code = Number(put.status ?? 0);
            if (code >= 200 && code < 300) {
              seg.assetId = await crayoCompleteUpload(seg.uploadId);
              const job = (await crayoCreateAutoclip({
                assetId: seg.assetId,
                clipCount: state.clipsPerSegment ?? state.clipCount,
                clipLength: state.clipLength,
                editLevel: state.editLevel,
                prompt: state.prompt ?? undefined,
              })) as { autoclip?: { id?: string } } | null;
              const autoclipId = job?.autoclip?.id;
              if (!autoclipId) return await fail("CRAYO_FAILED", "Crayo accepted the upload but returned no AutoClip job id.");
              seg.autoclipId = autoclipId;
              seg.state = "autoclipping";
              await progress(runId, state, `Segment ${seg.index + 1} is in Crayo (asset ${seg.assetId}); AutoClip job ${autoclipId} started (${state.clipsPerSegment} clips).`);
            } else if (code > 0) {
              return await fail("MEDIA_UPLOAD_FAILED", `Crayo's signed upload URL answered ${code}: ${put.body || put.error || ""}`);
            }
          }
        }
      }

      const allPastSandbox = state.segments.length > 0 && state.segments.every((seg) => seg.state === "autoclipping" || seg.state === "done");
      if (allPastSandbox) {
        state.phase = "autoclipping";
        await deleteSandbox(state.sandboxId);
        state.sandboxId = null;
        await progress(runId, state, `All ${state.segments.length} segment(s) are in Crayo. Waiting for AutoClip to finish (Crayo can take several minutes per job).`);
      }
      await saveState(runId, run.outputs, { ...state, lockUntil: null });
      return "advanced";
    }

    // ---- Crayo-only phase ----
    if (state.phase === "autoclipping") {
      for (const seg of state.segments) {
        if (seg.state !== "autoclipping" || !seg.autoclipId) continue;
        const payload = (await crayoGetAutoclip(seg.autoclipId)) as { autoclip?: { status?: string; clips?: unknown[] } } | null;
        const status = String(payload?.autoclip?.status ?? "").toLowerCase();
        if (status === "completed" || status === "complete" || status === "succeeded") {
          const { ingestCrayoMedia } = await import("@/lib/server/crayo-tools.server");
          const clips = [];
          for (const clip of (payload?.autoclip?.clips ?? []).slice(0, 20) as Record<string, unknown>[]) {
            const title = String(clip.title ?? "AutoClip");
            const thumbnailUrl = typeof clip.thumbnail_url === "string" ? clip.thumbnail_url : null;
            const projectId = typeof clip.project_id === "string" ? clip.project_id : null;
            const library = thumbnailUrl ? await ingestCrayoMedia(state.actorId, state.clientId, thumbnailUrl, title, ["autoclip"]) : null;
            clips.push({ title, projectId, thumbnailUrl, library });
          }
          seg.clips = clips;
          seg.state = "done";
          await progress(runId, state, `Segment ${seg.index + 1}: ${clips.length} clip(s) ready.`);
        } else if (status === "failed" || status === "error") {
          return await fail("FAILED", `Crayo AutoClip job ${seg.autoclipId} (segment ${seg.index + 1}) failed.`);
        }
      }
      if (state.segments.every((seg) => seg.state === "done")) {
        state.phase = "done";
        state.lockUntil = null;
        const clips = state.segments.flatMap((seg) => seg.clips ?? []);
        const summary = `AutoClip finished: ${clips.length} clip(s) across ${state.segments.length} segment(s) of “${state.probe?.title ?? "video"}”. ${clips.map((c) => c.title).slice(0, 8).join(" · ")}`;
        await saveState(runId, run.outputs, state);
        await insertIteration({
          runId,
          index: state.iterationIndex + 1,
          kind: "complete",
          resultSummary: summary.slice(0, 2000),
          status: "ok",
        }).catch(() => {});
        await patchAgentRun(runId, {
          status: "succeeded",
          errorCode: null,
          summary: summary.slice(0, 800),
          finishedAt: new Date().toISOString(),
          outputs: {
            ...(run.outputs ?? {}),
            mediaFetch: state as unknown as JsonValue,
            autoclips: state.segments.map((seg) => ({ segment: seg.index, assetId: seg.assetId ?? null, autoclipId: seg.autoclipId ?? null, clips: seg.clips ?? [] })) as unknown as JsonValue,
          },
        });
        return "done";
      }
      await saveState(runId, run.outputs, { ...state, lockUntil: null });
      return "advanced";
    }
    return "idle";
  } catch (error) {
    const code = error instanceof CrayoApiError ? error.code : error instanceof Error && /^[A-Z_]{3,60}$/.test(error.message) ? error.message : "MEDIA_FETCH_FAILED";
    const detail = error instanceof Error ? error.message : "unknown error";
    // Transient sandbox/API hiccups: release the lock and let the next tick retry, unless fatal.
    if (code === "MEDIA_FETCH_FAILED" && !/not found|does not exist|deleted/i.test(detail)) {
      state.lockUntil = null;
      await saveState(runId, run.outputs, state).catch(() => {});
      console.error("[media-fetch-job] transient", runId, scrub(detail));
      return "idle";
    }
    return await fail(code, detail);
  }
}

/** Tick every parked run — used by the ops cron as a backstop when no tab is polling. */
export async function tickPendingMediaFetchJobs(limit = 5): Promise<number> {
  const runs = await listAgentRuns(40);
  let ticked = 0;
  for (const run of runs) {
    if (run.status !== "waiting_resource" || run.errorCode !== MEDIA_FETCH_ERROR_CODE) continue;
    await tickMediaFetchJob(run.id).catch(() => {});
    ticked += 1;
    if (ticked >= limit) break;
  }
  return ticked;
}

/** Best-effort cleanup when a run is cancelled. */
export async function abortMediaFetchJob(outputs: Record<string, JsonValue> | null | undefined): Promise<void> {
  const state = readState(outputs);
  if (state?.sandboxId) await deleteSandbox(state.sandboxId);
}


/**
 * Reap orphaned Daytona sandboxes from the synchronous (non-job) media-fetch path used by
 * external API callers (see media-fetch.server.ts). That path has no AgentRun tracking it, and
 * its `finally { sandbox.delete() }` never runs if the caller's Vercel function is killed on
 * timeout instead of throwing — so a failing/retrying external caller (e.g. a Hermes playbook
 * step) can leak one sandbox per attempt well before Daytona's own 10-minute autoStopInterval
 * catches up, and a burst of leaked sandboxes can exhaust the account's concurrency limit and
 * stall unrelated, properly-tracked runs. Called from /api/cron/ops as a backstop.
 *
 * Only targets `purpose: media-fetch` sandboxes (the untracked sync path). `media-fetch-job`
 * sandboxes are already tracked by tickMediaFetchJob/abortMediaFetchJob and have their own
 * 60-minute autoStopInterval, so reaping them here would risk killing a run still legitimately
 * in progress.
 */
export async function reapStaleMediaFetchSandboxes(maxAgeMinutes = 8): Promise<number> {
  let daytona: Awaited<ReturnType<typeof daytonaClient>>["daytona"];
  try {
    ({ daytona } = await daytonaClient());
  } catch {
    return 0;
  }
  const cutoff = Date.now() - maxAgeMinutes * 60_000;
  let reaped = 0;
  try {
    const iter = daytona.list({ labels: { purpose: "media-fetch", app: "clippyos" }, limit: 20 });
    for await (const sandbox of iter as AsyncIterable<AnySandbox>) {
      const state = String(sandbox.state ?? "").toLowerCase();
      if (state === "stopped" || state === "destroyed" || state === "destroying" || state === "archived") continue;
      const createdAt = Date.parse(String(sandbox.createdAt ?? ""));
      if (!Number.isFinite(createdAt) || createdAt > cutoff) continue;
      try {
        if (sandbox.delete) await sandbox.delete();
        else if (sandbox.stop) await sandbox.stop();
        reaped += 1;
      } catch {
        /* best-effort; auto-stop still applies */
      }
    }
  } catch {
    /* Daytona list unavailable this tick; try again next cron run */
  }
  return reaped;
}
