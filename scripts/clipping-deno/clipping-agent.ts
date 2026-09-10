/// <reference lib="deno.ns" />
/// <reference lib="esnext" />

/**
 * Clipping agent (Deno 2) — headless crayo workflow runner for ClippyOS.
 *
 * Drives the ClippyOS v1 REST surface end-to-end: starts the Social Machine,
 * inspects the clipping session snapshot, opens crayo.io inside the VM,
 * verifies crayo login state (with optional human-in-the-loop wait), runs one
 * recorded browser-procedure skill, then watches the machine's drops folder
 * for new clips.
 *
 * Required scopes (ClippyOS → Settings → Automation, keys look like `agk_…`):
 *   write:social   — machine start / drops listing
 *   write:clipping — crayo login check + browser-procedure skill run
 *
 * Workflow:
 *   1. POST /api/v1/social/machine/start            (waitUntilReady)
 *   2. GET  /api/v1/clipping/session                (log machine/proxy/crayo)
 *   3. POST /api/v1/browser/open                    (CRAYO_URL)
 *   4. POST /api/v1/clipping/crayo/check-login      (login_wall → see below)
 *   5. POST /api/v1/clipping/skills/{SKILL_SLUG}/run (when SKILL_SLUG is set;
 *      idempotent via X-Idempotency-Key persisted in Deno KV per slug+day)
 *   6. GET  /api/v1/social/machine/drops            (each iteration; logs new
 *      drop filenames, tolerates 404/mapper gaps)
 *
 * Environment:
 *   CLIPPYOS_API_URL   ClippyOS base URL                  (default http://127.0.0.1:8080)
 *   CLIPPYOS_API_KEY   Bearer API key `agk_…`             (required)
 *   CRAYO_URL          Platform URL opened in the VM      (default https://crayo.io)
 *   POLL_MS            Sleep between polls, ms            (default 30000)
 *   MAX_ITERATIONS     Stop after N poll cycles           (default 0 = unlimited)
 *   SKILL_SLUG         Browser-procedure skill to run     (optional)
 *   WAIT_FOR_LOGIN     Poll until crayo login succeeds    (default false)
 *
 * Login handling: when check-login reports `login_wall`, the agent prints
 * human-in-the-loop instructions (log in inside the VM at the dashboard URL).
 * Without WAIT_FOR_LOGIN it exits 2 immediately; with WAIT_FOR_LOGIN=true it
 * re-checks every POLL_MS until `logged_in` or MAX_ITERATIONS is exhausted
 * (then exits 2). New drops observed while waiting are logged too.
 *
 * Every request is bounded by REQUEST_TIMEOUT_MS and retried on 429/5xx
 * honoring Retry-After, up to 3 tries total.
 *
 * Exit codes: 0 success · 1 error (bad args, missing key, auth denied,
 * unrecoverable network) · 2 needs human login.
 *
 * Usage:
 *   CLIPPYOS_API_KEY=agk_… deno run --allow-net --allow-env --unstable-kv \
 *     scripts/clipping-deno/clipping-agent.ts [--help]
 */

const PROGRAM = "clipping-agent";
const EXIT_ERROR = 1;
const EXIT_NEEDS_LOGIN = 2;

const DEFAULT_API_URL = "http://127.0.0.1:8080";
const DEFAULT_CRAYO_URL = "https://crayo.io";
const DEFAULT_POLL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;
const FETCH_MAX_TRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

interface AgentConfig {
  apiUrl: string;
  apiKey: string;
  crayoUrl: string;
  pollMs: number;
  maxIterations: number;
  skillSlug: string | null;
  waitForLogin: boolean;
}

/** Result of one REST call; failures never throw so the runner degrades gracefully. */
type CallResult =
  | { kind: "ok"; data: unknown }
  | { kind: "http"; status: number; code: string; message: string; body: string }
  | { kind: "network"; message: string };

interface ApiErrorEnvelope {
  error?: { code?: unknown; message?: unknown };
}

function printHelp(): void {
  console.log(`${PROGRAM} — headless crayo workflow runner for ClippyOS.

Workflow: start the Social Machine, log the clipping session snapshot, open
crayo.io in the VM browser, verify crayo login state (optionally waiting for a
human to log in), run one recorded browser-procedure skill, then watch the
machine's drops folder for new clips.

Usage:
  deno run --allow-net --allow-env --unstable-kv scripts/clipping-deno/clipping-agent.ts
  deno run ... ${PROGRAM}.ts --help

Options:
  -h, --help    Show this help and exit.

Environment variables:
  CLIPPYOS_API_URL   Base URL of the ClippyOS server.
                     Default: ${DEFAULT_API_URL}
  CLIPPYOS_API_KEY   Bearer API key (\`agk_…\`) from ClippyOS → Settings →
                     Automation. Needs scopes: write:social, write:clipping.
                     Required.
  CRAYO_URL          Platform URL opened in the VM browser.
                     Default: ${DEFAULT_CRAYO_URL}
  POLL_MS            Milliseconds between login checks / drop polls.
                     Default: 30000
  MAX_ITERATIONS     Stop after N poll cycles (login waits and/or drop polls).
                     0 means unlimited.
                     Default: 0
  SKILL_SLUG         Slug of a browser-procedure skill to run after login
                     succeeds. Optional.
  WAIT_FOR_LOGIN     When crayo shows a login wall, poll instead of exiting:
                     "1"/"true"/"yes"/"on" enable it.
                     Default: false

Exit codes:
  0    Success (workflow completed, including the drop-watch loop).
  1    Error — bad arguments, missing CLIPPYOS_API_KEY, rejected key
       (401/403), or an unrecoverable request failure.
  2    Needs human login — crayo reported a login wall and either
       WAIT_FOR_LOGIN is disabled or the wait was exhausted.`);
}

/** Normalize API string fields: empty/missing strings become null everywhere. */
function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Narrow untyped JSON payloads to object records across all responses. */
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

function readBoolEnv(name: string, fallback: boolean): boolean {
  const raw = Deno.env.get(name)?.trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  console.error(`${PROGRAM}: ignoring invalid ${name}="${raw}", using ${fallback}`);
  return fallback;
}

function readConfig(): AgentConfig {
  const apiKey = Deno.env.get("CLIPPYOS_API_KEY")?.trim() ?? "";
  if (!apiKey) {
    console.error(
      `${PROGRAM}: CLIPPYOS_API_KEY is required. Create an API key (agk_…) in ` +
        `ClippyOS → Settings → Automation with the write:social and write:clipping scopes.`,
    );
    Deno.exit(EXIT_ERROR);
  }
  const rawApiUrl = Deno.env.get("CLIPPYOS_API_URL")?.trim();
  const rawCrayoUrl = Deno.env.get("CRAYO_URL")?.trim();
  const rawSkillSlug = Deno.env.get("SKILL_SLUG")?.trim();
  return {
    apiUrl: (rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : DEFAULT_API_URL).replace(/\/+$/, ""),
    apiKey,
    crayoUrl: rawCrayoUrl && rawCrayoUrl.length > 0 ? rawCrayoUrl : DEFAULT_CRAYO_URL,
    pollMs: readCountEnv("POLL_MS", DEFAULT_POLL_MS),
    maxIterations: readCountEnv("MAX_ITERATIONS", 0),
    skillSlug: rawSkillSlug && rawSkillSlug.length > 0 ? rawSkillSlug : null,
    waitForLogin: readBoolEnv("WAIT_FOR_LOGIN", false),
  };
}

/** Retry-After in seconds or HTTP-date; clamped to sane bounds. */
function parseRetryAfterMs(header: string | null): number {
  if (header) {
    const seconds = Number.parseInt(header, 10);
    if (Number.isSafeInteger(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    }
    const at = Date.parse(header);
    if (!Number.isNaN(at)) {
      return Math.min(Math.max(at - Date.now(), 0), MAX_RETRY_DELAY_MS);
    }
  }
  return DEFAULT_RETRY_DELAY_MS;
}

/**
 * One REST call against /api/v1 with timeout plus retry on 429/5xx honoring
 * Retry-After (≤ ${FETCH_MAX_TRIES} tries). 401/403 aborts the process with a scope hint.
 */
async function apiFetch(
  config: AgentConfig,
  method: "GET" | "POST",
  path: string,
  opts: { payload?: Record<string, unknown>; idempotencyKey?: string } = {},
): Promise<CallResult> {
  const hasBody = method !== "GET" && opts.payload !== undefined;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.apiKey}`,
    "Accept": "application/json",
  };
  if (hasBody) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

  for (let attempt = 1; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${config.apiUrl}/api/v1${path}`, {
        method,
        headers,
        body: hasBody ? JSON.stringify(opts.payload) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      return { kind: "network", message: error instanceof Error ? error.message : String(error) };
    }

    if ((response.status === 429 || response.status >= 500) && attempt < FETCH_MAX_TRIES) {
      const delayMs = parseRetryAfterMs(response.headers.get("retry-after"));
      await response.body?.cancel().catch(() => {});
      console.error(
        `${PROGRAM}: ${method} ${path} got HTTP ${response.status}; retrying ` +
          `(${attempt + 1}/${FETCH_MAX_TRIES}) in ${delayMs}ms.`,
      );
      await sleep(delayMs);
      continue;
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
        `${PROGRAM}: ${method} ${path} failed: HTTP ${response.status}${code ? ` ${code}` : ""}` +
          `${message ? ` — ${message}` : ""} :: ${text.slice(0, 200)}`,
      );
      if (response.status === 401 || response.status === 403) {
        console.error(
          `${PROGRAM}: API key was rejected (HTTP ${response.status}). Verify the key exists and ` +
            `has the write:social and write:clipping scopes: ClippyOS → Settings → Automation.`,
        );
        Deno.exit(EXIT_ERROR);
      }
      return { kind: "http", status: response.status, code, message, body: text.slice(0, 200) };
    }

    let parsed: unknown = null;
    try {
      parsed = text.length > 0 ? JSON.parse(text) : null;
    } catch {
      // Empty or malformed success body; treat as unshaped data.
    }
    const record = asRecord(parsed);
    return { kind: "ok", data: record ? record.data : null };
  }
}

function isAlreadyRunningFailure(result: CallResult): boolean {
  if (result.kind !== "http") return false;
  return /ALREADY_RUNNING/.test(result.code) ||
    /already running/i.test(result.message) ||
    /already running/i.test(result.body);
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

/**
 * Stable idempotency key for the skill-run POST: one UUID per skill slug per
 * UTC day, persisted in Deno KV so retries across processes reuse it. Falls
 * back to an ephemeral UUID when KV is unavailable.
 */
async function loadIdempotencyKey(skillSlug: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const kv = await Deno.openKv();
    try {
      const key = ["clipping_agent", "skill_run", skillSlug, day];
      const existing = await kv.get<string>(key);
      if (typeof existing.value === "string" && existing.value.length > 0) {
        return existing.value;
      }
      const fresh = crypto.randomUUID();
      await kv.set(key, fresh);
      return fresh;
    } finally {
      kv.close();
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`${PROGRAM}: Deno KV unavailable (${detail}); using an ephemeral idempotency key.`);
    return crypto.randomUUID();
  }
}

async function startMachine(config: AgentConfig): Promise<boolean> {
  const started = await apiFetch(config, "POST", "/social/machine/start", {
    payload: { waitUntilReady: true },
  });
  if (started.kind === "ok") {
    const state = asText(asRecord(started.data)?.state) ?? "unknown";
    console.log(`${PROGRAM}: social/machine/start ok (state=${state})`);
    return true;
  }
  if (started.kind === "network") {
    console.error(`${PROGRAM}: network error starting the machine: ${started.message}`);
    return false;
  }
  if (isAlreadyRunningFailure(started)) {
    console.log(`${PROGRAM}: machine reports already running; continuing.`);
    return true;
  }
  return false;
}

/** Never echo proxy URLs or credentials into logs. */
function describeProxy(proxy: Record<string, unknown> | null): string {
  if (!proxy) return "unknown";
  if (asText(proxy.url) || asText(proxy.host)) return "configured";
  const enabled = proxy.enabled ?? proxy.configured;
  if (typeof enabled === "boolean") return enabled ? "enabled" : "disabled";
  return "present";
}

async function logSessionSnapshot(config: AgentConfig): Promise<void> {
  const session = await apiFetch(config, "GET", "/clipping/session");
  if (session.kind !== "ok") {
    if (session.kind === "network") {
      console.error(`${PROGRAM}: network error reading the clipping session: ${session.message}`);
    } else {
      console.error(`${PROGRAM}: clipping session unavailable (HTTP ${session.status}).`);
    }
    return;
  }
  const snap = asRecord(session.data);
  if (!snap) {
    console.log(`${PROGRAM}: clipping/session responded with an unexpected shape.`);
    return;
  }
  const machine = asRecord(snap.machine);
  const crayo = asRecord(snap.crayoLogin);
  console.log(
    `${PROGRAM}: session: machine=${asText(machine?.state) ?? "unknown"} ` +
      `proxy=${describeProxy(asRecord(snap.proxy))} ` +
      `crayoLogin=${asText(crayo?.state) ?? "unknown"} ` +
      `(checkedAt=${asText(crayo?.checkedAt) ?? "never"})`,
  );
}

async function openCrayo(config: AgentConfig): Promise<void> {
  const opened = await apiFetch(config, "POST", "/browser/open", { payload: { url: config.crayoUrl } });
  if (opened.kind === "ok") {
    console.log(`${PROGRAM}: open requested for ${config.crayoUrl}`);
  } else if (opened.kind === "network") {
    console.error(`${PROGRAM}: network error opening ${config.crayoUrl}: ${opened.message}`);
  } else {
    console.error(`${PROGRAM}: opening ${config.crayoUrl} failed (HTTP ${opened.status}).`);
  }
}

interface CrayoLogin {
  state: "logged_in" | "login_wall" | "unknown";
  checkedAt: string | null;
}

function readLoginState(data: unknown): CrayoLogin {
  const record = asRecord(data);
  const raw = asText(record?.state) ?? "unknown";
  const state = raw === "logged_in" || raw === "login_wall" ? raw : "unknown";
  return { state, checkedAt: asText(record?.checkedAt) };
}

async function checkCrayoLogin(config: AgentConfig): Promise<CrayoLogin> {
  const result = await apiFetch(config, "POST", "/clipping/crayo/check-login");
  if (result.kind === "ok") return readLoginState(result.data);
  if (result.kind === "network") {
    console.error(`${PROGRAM}: network error checking crayo login: ${result.message}`);
  } else {
    console.error(`${PROGRAM}: crayo login check failed (HTTP ${result.status}).`);
  }
  return { state: "unknown", checkedAt: null };
}

function printLoginInstructions(crayoUrl: string): void {
  console.log(`${PROGRAM}: ── ACTION REQUIRED: crayo login ──`);
  console.log(
    `${PROGRAM}: crayo is showing a login wall. Open the VM desktop and log in to crayo ` +
      `in the browser there (dashboard URL: ${crayoUrl}).`,
  );
  console.log(
    `${PROGRAM}: Set WAIT_FOR_LOGIN=true to have this agent poll every POLL_MS until the ` +
      `login succeeds instead of exiting now.`,
  );
}

/** Extract a display filename from one drops row across mapper shapes. */
function dropFilename(row: unknown): string | null {
  if (typeof row === "string" && row.length > 0) return row;
  const record = asRecord(row);
  if (!record) return null;
  for (const key of ["filename", "fileName", "name", "file", "path"]) {
    const value = asText(record[key]);
    if (value) return value.split(/[\\/]/).pop() || value;
  }
  return null;
}

let dropsGapNoted = false;

/** One drops poll cycle: log any filenames not seen before; tolerate 404 gaps. */
async function pollDrops(config: AgentConfig, seen: Set<string>): Promise<void> {
  const drops = await apiFetch(config, "GET", "/social/machine/drops");
  if (drops.kind === "ok") {
    dropsGapNoted = false;
    const rows = Array.isArray(drops.data) ? drops.data : [];
    for (const row of rows) {
      const name = dropFilename(row);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      console.log(`${PROGRAM}: new drop: ${name}`);
    }
  } else if (drops.kind === "http" && drops.status === 404) {
    // Mapper gap: drops listing not exposed by every server build yet.
    if (!dropsGapNoted) {
      dropsGapNoted = true;
      console.log(`${PROGRAM}: drops listing not available yet; skipping (logged once).`);
    }
  } else if (drops.kind === "network") {
    console.error(`${PROGRAM}: network error listing drops: ${drops.message}`);
  }
}

/** Iteration label helper shared by the wait and watch loops. */
function iterationLabel(iteration: number, maxIterations: number): string {
  return maxIterations > 0 ? `${iteration}/${maxIterations}` : `${iteration}`;
}

/**
 * Poll check-login every POLL_MS until logged_in. Returns true once logged in;
 * false when MAX_ITERATIONS polls were exhausted. New drops are logged along
 * the way.
 */
async function waitForLogin(config: AgentConfig, seen: Set<string>): Promise<boolean> {
  for (let iteration = 1; config.maxIterations === 0 || iteration <= config.maxIterations; iteration += 1) {
    await sleep(config.pollMs);
    console.log(`${PROGRAM}: ── login wait ${iterationLabel(iteration, config.maxIterations)} ──`);
    const login = await checkCrayoLogin(config);
    if (login.state === "logged_in") {
      console.log(`${PROGRAM}: crayo login confirmed.`);
      return true;
    }
    console.log(`${PROGRAM}: crayo login state=${login.state}; still waiting for a human to log in.`);
    await pollDrops(config, seen);
  }
  return false;
}

async function runSkill(config: AgentConfig, skillSlug: string): Promise<void> {
  const idempotencyKey = await loadIdempotencyKey(skillSlug);
  console.log(
    `${PROGRAM}: running browser procedure skill "${skillSlug}" (idempotency key issued for today).`,
  );
  const result = await apiFetch(config, "POST", `/clipping/skills/${encodeURIComponent(skillSlug)}/run`, {
    idempotencyKey,
  });
  if (result.kind === "ok") {
    console.log(`${PROGRAM}: skill "${skillSlug}" step results:`);
    console.log(JSON.stringify(result.data, null, 2));
  } else if (result.kind === "network") {
    console.error(`${PROGRAM}: network error running skill "${skillSlug}": ${result.message}`);
  } else {
    console.error(
      `${PROGRAM}: skill "${skillSlug}" run failed (HTTP ${result.status} ${result.code}).`,
    );
  }
}

async function main(): Promise<void> {
  if (Deno.args.some((arg) => arg === "--help" || arg === "-h")) {
    printHelp();
    return;
  }
  const config = readConfig();
  console.log(
    `${PROGRAM}: api=${config.apiUrl} crayo=${config.crayoUrl} poll=${config.pollMs}ms ` +
      `maxIterations=${config.maxIterations === 0 ? "unlimited" : config.maxIterations} ` +
      `skill=${config.skillSlug ?? "(none)"} waitForLogin=${config.waitForLogin}`,
  );

  await startMachine(config);
  await logSessionSnapshot(config);
  await openCrayo(config);

  const seen = new Set<string>();
  const login = await checkCrayoLogin(config);
  if (login.state !== "logged_in") {
    printLoginInstructions(config.crayoUrl);
    if (!config.waitForLogin) Deno.exit(EXIT_NEEDS_LOGIN);
    const loggedIn = await waitForLogin(config, seen);
    if (!loggedIn) {
      console.error(
        `${PROGRAM}: crayo still not logged in after ${
          config.maxIterations === 0 ? "the wait window" : `${config.maxIterations} poll(s)`
        }; exiting.`,
      );
      Deno.exit(EXIT_NEEDS_LOGIN);
    }
  }

  if (config.skillSlug) await runSkill(config, config.skillSlug);

  let iteration = 0;
  while (config.maxIterations === 0 || iteration < config.maxIterations) {
    iteration += 1;
    console.log(`${PROGRAM}: ── drops watch ${iterationLabel(iteration, config.maxIterations)} ──`);
    await pollDrops(config, seen);
    if (config.maxIterations !== 0 && iteration >= config.maxIterations) break;
    await sleep(config.pollMs);
  }
  console.log(`${PROGRAM}: done.`);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const detail = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`${PROGRAM}: fatal: ${detail}`);
    Deno.exit(EXIT_ERROR);
  });
}
