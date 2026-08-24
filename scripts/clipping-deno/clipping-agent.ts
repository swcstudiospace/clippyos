/// <reference lib="deno.ns" />
/// <reference lib="esnext" />

/**
 * Clipping agent (Deno 2) — headless driver for the ClippyOS Clipping tab.
 *
 * Autonomously runs the crayo.io login/clip loop against the authenticated
 * ClippyOS v1 tool API, issuing the same computer.* / social.* actions Hermes
 * uses, so operators can orchestrate headlessly (cron, systemd, CI) without
 * opening the desktop UI.
 *
 * Required scopes:
 *   write:social — every action below is write-scoped. Create an API key in
 *   ClippyOS → Settings → Automation (keys look like `agk_…`) and pass it via
 *   CLIPPYOS_API_KEY.
 *
 * Environment:
 *   CLIPPYOS_API_URL   ClippyOS base URL                    (default http://127.0.0.1:8080)
 *   CLIPPYOS_API_KEY   Bearer API key `agk_…`               (required; exit 2 when missing)
 *   CRAYO_URL          Platform URL opened each iteration   (default https://crayo.io)
 *   POLL_MS            Sleep between iterations, ms         (default 30000)
 *   MAX_ITERATIONS     Stop after N iterations              (default 0 = unlimited)
 *
 * Per iteration: social.start_machine{waitUntilReady:true} → computer.screenshot
 * → browser.open_url(CRAYO_URL, falls back to social.open_platform{platform:"crayo"}
 * on 4xx) → best-effort social.list_machine_drops (not exposed by every v1
 * mapper; unknown-action responses are logged and skipped) → sleep POLL_MS.
 * Every request is bounded by REQUEST_TIMEOUT_MS so a wedged server degrades
 * into a logged network error instead of stalling the loop indefinitely.
 *
 * Exit codes: 0 clean stop · 1 fatal error · 2 missing CLIPPYOS_API_KEY ·
 * 3 authentication/authorization denied (HTTP 401/403).
 *
 * Usage:
 *   CLIPPYOS_API_KEY=agk_… deno run --allow-net --allow-env \
 *     scripts/clipping-deno/clipping-agent.ts
 */

const PROGRAM = "clipping-agent";
const EXIT_FATAL = 1;
const EXIT_MISSING_KEY = 2;
const EXIT_AUTH_DENIED = 3;

const DEFAULT_API_URL = "http://127.0.0.1:8080";
const DEFAULT_CRAYO_URL = "https://crayo.io";
const DEFAULT_POLL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;

interface AgentConfig {
  apiUrl: string;
  apiKey: string;
  crayoUrl: string;
  pollMs: number;
  maxIterations: number;
}

/** Result of one v1 action call; failures never throw so the loop survives. */
type CallResult =
  | { kind: "ok"; data: unknown }
  | { kind: "http"; status: number; code: string; message: string; body: string }
  | { kind: "network"; message: string };

interface ApiErrorEnvelope {
  error?: { code?: unknown; message?: unknown };
}

/** Normalize API string fields: empty/missing strings become null everywhere. */
function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Narrow untyped JSON payloads to object records across all action responses. */
function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readCountEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name)?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 0) {
    console.error(`${PROGRAM}: ignoring invalid ${name}="${raw}", using ${fallback}`);
    return fallback;
  }
  return value;
}

function readConfig(): AgentConfig {
  const apiKey = Deno.env.get("CLIPPYOS_API_KEY")?.trim() ?? "";
  if (!apiKey) {
    console.error(
      `${PROGRAM}: CLIPPYOS_API_KEY is required. Create an API key (agk_…) in ` +
        `ClippyOS → Settings → Automation with the write:social scope.`,
    );
    Deno.exit(EXIT_MISSING_KEY);
  }
  const rawApiUrl = Deno.env.get("CLIPPYOS_API_URL")?.trim();
  const rawCrayoUrl = Deno.env.get("CRAYO_URL")?.trim();
  return {
    apiUrl: (rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : DEFAULT_API_URL).replace(/\/+$/, ""),
    apiKey,
    crayoUrl: rawCrayoUrl && rawCrayoUrl.length > 0 ? rawCrayoUrl : DEFAULT_CRAYO_URL,
    pollMs: readCountEnv("POLL_MS", DEFAULT_POLL_MS),
    maxIterations: readCountEnv("MAX_ITERATIONS", 0),
  };
}

/**
 * POST one action to the v1 mapper. Prints any non-2xx status plus a ≤200-char
 * body snippet; 401/403 aborts the process with a scope hint (exit 3). Network
 * throws are reported as `{kind:"network"}` so callers log and continue.
 */
async function callAction(
  config: AgentConfig,
  path: string,
  payload?: Record<string, unknown>,
): Promise<CallResult> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}/api/v1${path}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    return { kind: "network", message: error instanceof Error ? error.message : String(error) };
  }

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    let envelope: ApiErrorEnvelope | null = null;
    try {
      envelope = JSON.parse(text) as ApiErrorEnvelope;
    } catch {
      // Non-JSON error body; fall through with generic code.
    }
    const code = asText(envelope?.error?.code) ?? `HTTP_${response.status}`;
    const message = asText(envelope?.error?.message) ?? "";
    console.error(
      `${PROGRAM}: POST ${path} failed: HTTP ${response.status}${code ? ` ${code}` : ""}` +
        `${message ? ` — ${message}` : ""} :: ${text.slice(0, 200)}`,
    );
    if (response.status === 401 || response.status === 403) {
      console.error(
        `${PROGRAM}: API key was rejected (HTTP ${response.status}). Verify the key exists and ` +
          `has the write:social scope: ClippyOS → Settings → Automation.`,
      );
      Deno.exit(EXIT_AUTH_DENIED);
    }
    return { kind: "http", status: response.status, code, message, body: text.slice(0, 200) };
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    // Empty or malformed success body; treat as unshaped data.
  }
  const record = asRecord(parsed);
  return { kind: "ok", data: record ? record.data : null };
}

function isAlreadyRunningFailure(result: CallResult): boolean {
  if (result.kind !== "http") return false;
  return /ALREADY_RUNNING/.test(result.code) ||
    /already running/i.test(result.message) ||
    /already running/i.test(result.body);
}

function isUnknownAction(result: CallResult): boolean {
  // 404 covers both "unknown endpoint" (mapper gap) and UNKNOWN_ACTION.
  return result.kind === "http" && result.status === 404;
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

let dropsGapNoted = false;

/** One polling cycle: start machine → screenshot → open crayo → drops peek. */
async function runIteration(config: AgentConfig): Promise<void> {
  const started = await callAction(config, "/social/machine/start", { waitUntilReady: true });
  if (started.kind === "ok") {
    const state = asText(asRecord(started.data)?.state) ?? "unknown";
    console.log(`${PROGRAM}: social.start_machine ok (state=${state})`);
  } else if (started.kind === "network") {
    console.error(`${PROGRAM}: network error calling social.start_machine: ${started.message}`);
  } else if (isAlreadyRunningFailure(started)) {
    console.log(`${PROGRAM}: social.start_machine reports the machine is already running; continuing.`);
  }

  const shot = await callAction(config, "/computer/screenshot");
  if (shot.kind === "ok") {
    const capturedAt = asText(asRecord(shot.data)?.capturedAt) ?? "(no timestamp)";
    console.log(`${PROGRAM}: computer.screenshot capturedAt=${capturedAt}`);
  } else if (shot.kind === "network") {
    console.error(`${PROGRAM}: network error calling computer.screenshot: ${shot.message}`);
  }

  let opened = await callAction(config, "/browser/open", { url: config.crayoUrl });
  if (opened.kind === "http" && opened.status >= 400 && opened.status < 500) {
    console.log(
      `${PROGRAM}: browser.open_url got HTTP ${opened.status}; retrying once via ` +
        `social.open_platform platform="crayo".`,
    );
    opened = await callAction(config, "/social/platforms/crayo/open", { platform: "crayo" });
  }
  if (opened.kind === "ok") {
    console.log(`${PROGRAM}: open requested for ${config.crayoUrl}`);
  } else if (opened.kind === "network") {
    console.error(`${PROGRAM}: network error opening ${config.crayoUrl}: ${opened.message}`);
  }

  const drops = await callAction(config, "/social/machine/drops");
  if (drops.kind === "ok") {
    const rows = Array.isArray(drops.data) ? drops.data : null;
    dropsGapNoted = false;
    console.log(
      rows
        ? `${PROGRAM}: social.list_machine_drops returned ${rows.length} drop(s)`
        : `${PROGRAM}: social.list_machine_drops responded`,
    );
  } else if (drops.kind === "http" && isUnknownAction(drops)) {
    if (!dropsGapNoted) {
      dropsGapNoted = true;
      console.log(
        `${PROGRAM}: drops listing is not exposed by this server's v1 mapper yet; skipping ` +
          `(logged once).`,
      );
    }
  } else if (drops.kind === "network") {
    console.error(`${PROGRAM}: network error listing drops: ${drops.message}`);
  }
}

async function main(): Promise<void> {
  const config = readConfig();
  console.log(
    `${PROGRAM}: api=${config.apiUrl} crayo=${config.crayoUrl} poll=${config.pollMs}ms ` +
      `maxIterations=${config.maxIterations === 0 ? "unlimited" : config.maxIterations}`,
  );

  let iteration = 0;
  while (config.maxIterations === 0 || iteration < config.maxIterations) {
    iteration += 1;
    const label = config.maxIterations > 0 ? `${iteration}/${config.maxIterations}` : `${iteration}`;
    console.log(`${PROGRAM}: ── iteration ${label} ──`);
    await runIteration(config);
    if (config.maxIterations !== 0 && iteration >= config.maxIterations) break;
    await sleep(config.pollMs);
  }
  console.log(`${PROGRAM}: done after ${iteration} iteration(s).`);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`${PROGRAM}: fatal: ${detail}`);
  Deno.exit(EXIT_FATAL);
});
