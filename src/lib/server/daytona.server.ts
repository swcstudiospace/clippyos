/**
 * Daytona Social Machine — on-demand only.
 *
 * Importing this module, reading status, and Test Connection MUST NEVER start
 * a sandbox. Start / Stop are explicit operator actions.
 */
import { Daytona, type Sandbox } from "@daytona/sdk";
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import {
  DEFAULT_AUTO_STOP_MINUTES,
  DEFAULT_DAYTONA_API_URL,
  PLATFORM_HOME_URL,
  PLATFORM_UPLOAD_URL,
  SOCIAL_LABELS,
  SOCIAL_LONG_RUN_MS,
  SOCIAL_NOVNC_PORT,
  parseDisplaySize,
  type MachineState,
  type SocialMachineStatus,
} from "@/lib/social";
import type { SocialPlatform } from "@/lib/entities";
import {
  DEFAULT_SOCIAL_LOCALE,
  DEFAULT_SOCIAL_TIMEZONE,
  HOT_SNAPSHOT_NAME,
  DEFAULT_SOCIAL_MACHINE_SIZE,
  ensureUploadDirCommand,
  hibernatePlan,
  idlePolicy,
  instagramGeoWarning,
  isWindowsSnapshot,
  listWindowsCommand,
  mapProviderState,
  openUrlCommand,
  parseHttpsProxy,
  parseResidentialProxy,
  composeProxyUrl,
  parseProxyCountry,
  parseProxyListLine,
  proxyscrapeListUrl,
  DEFAULT_PROXY_COUNTRY,
  parseSocialMachineOs,
  parseSocialMachineRegion,
  parseSocialMachineSize,
  shouldResizeWindows,
  snapshotCandidates,
  stopActionForOs,
  TARGET_WINDOWS_RESOURCES,
  uploadPath,
  windowsLocaleScript,
  windowsProxyScript,
  type SocialMachineOs,
  type SocialMachineRegion,
  type SocialMachineSize,
} from "@/lib/social-machine";

const KEY = "DAYTONA_API_KEY";
const URL_KEY = "DAYTONA_API_URL";
const TARGET_KEY = "DAYTONA_TARGET";
const SANDBOX_KEY = "DAYTONA_SOCIAL_SANDBOX_ID";
const AUTO_STOP_KEY = "DAYTONA_AUTO_STOP_MINUTES";
const STARTED_AT_KEY = "DAYTONA_SOCIAL_STARTED_AT";
const STOPPED_AT_KEY = "DAYTONA_SOCIAL_STOPPED_AT";
const PREVIEW_KEY = "DAYTONA_SOCIAL_PREVIEW_URL";
const PREVIEW_EXPIRES_KEY = "DAYTONA_SOCIAL_PREVIEW_EXPIRES_AT";
const SCREEN_KEY = "DAYTONA_SOCIAL_LAST_SCREENSHOT";
const LAST_ERROR_KEY = "DAYTONA_SOCIAL_LAST_ERROR";
const DISPLAY_KEY = "DAYTONA_SOCIAL_DISPLAY";
const SIZE_KEY = "DAYTONA_SOCIAL_SIZE";
const SNAPSHOT_KEY = "DAYTONA_SOCIAL_SNAPSHOT_NAME";
const OS_KEY = "DAYTONA_SOCIAL_OS";
const PROXY_KEY = "DAYTONA_OUTBOUND_PROXY";
const PROXY_COUNTRY_KEY = "DAYTONA_PROXY_COUNTRY";
const LOCALE_APPLIED_KEY = "DAYTONA_SOCIAL_LOCALE_APPLIED";

const SIGNED_PREVIEW_TTL_SECONDS = 3600;
const REMINT_IF_REMAINING_MS = 10 * 60 * 1000;

const PATH_NOTE =
  "Social Machine opens X, YouTube, Instagram, and TikTok from inside ClippyOS. Hibernate keeps the session hot. Clips stay in immutable cloud storage — never on this machine.";

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

export function sanitizeDaytonaError(message: string): string {
  return message
    .replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 180);
}

export type DaytonaConfig = {
  apiKey: string;
  apiUrl: string;
  target: string | null;
  autoStopMinutes: number;
  size: SocialMachineSize;
  proxyUrl: string | null;
};

export async function loadDaytonaApiKey(): Promise<string | null> {
  const env = process.env.DAYTONA_API_KEY?.trim() || "";
  if (env && !looksRedacted(env)) return env;
  const stored = (await readAppSetting(KEY))?.trim() || "";
  if (stored && !looksRedacted(stored)) return stored;
  return null;
}

export async function loadDaytonaConfig(): Promise<DaytonaConfig | null> {
  const apiKey = await loadDaytonaApiKey();
  if (!apiKey) return null;
  const apiUrl =
    (await readAppSetting(URL_KEY))?.trim() ||
    process.env.DAYTONA_API_URL?.trim() ||
    DEFAULT_DAYTONA_API_URL;
  const target =
    (await readAppSetting(TARGET_KEY))?.trim() ||
    process.env.DAYTONA_TARGET?.trim() ||
    "";
  const minutesRaw = (await readAppSetting(AUTO_STOP_KEY))?.trim() || "";
  const parsed = Number.parseInt(minutesRaw, 10);
  const autoStopMinutes =
    Number.isFinite(parsed) && parsed >= 5 && parsed <= 240
      ? parsed
      : DEFAULT_AUTO_STOP_MINUTES;
  const size = parseSocialMachineSize(await readAppSetting(SIZE_KEY));
  const proxyUrl = parseHttpsProxy(await readAppSetting(PROXY_KEY));
  return {
    apiKey,
    apiUrl: apiUrl || DEFAULT_DAYTONA_API_URL,
    target: target || null,
    autoStopMinutes,
    size,
    proxyUrl,
  };
}

function createClient(config: DaytonaConfig): Daytona {
  return new Daytona({
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
    ...(config.target ? { target: config.target } : {}),
    useDeprecatedPolling: true,
    requestTimeoutMs: 20_000,
  });
}

function mapSandboxState(state: string | undefined): MachineState {
  return mapProviderState(state);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function collectLabeled(daytona: Daytona): Promise<Sandbox[]> {
  const items: Sandbox[] = [];
  const labelSets = [{ ...SOCIAL_LABELS }, { app: "clippy-admin", purpose: "social" }];
  for (const labels of labelSets) {
    try {
      const iter = daytona.list({
        labels,
        limit: 10,
      });
      await withTimeout(
        (async () => {
          for await (const sandbox of iter) {
            items.push(sandbox);
            if (items.length >= 10) break;
          }
        })(),
        12000,
        "Daytona list",
      );
    } catch {
      /* try next label set */
    }
    if (items.length) break;
  }
  return items;
}

async function findSocialSandbox(
  daytona: Daytona,
  storedId: string | null,
): Promise<Sandbox | null> {
  if (storedId) {
    try {
      return await daytona.get(storedId);
    } catch {
      /* fall through to labeled list — never start */
    }
  }
  try {
    const listed = await collectLabeled(daytona);
    return listed[0] ?? null;
  } catch {
    return null;
  }
}

function isSignedPreviewUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("token")) return false;
    return /^\d+-[A-Za-z0-9]/.test(parsed.hostname);
  } catch {
    return false;
  }
}

function withSkipWarning(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("X-Daytona-Skip-Preview-Warning")) {
      parsed.searchParams.set("X-Daytona-Skip-Preview-Warning", "true");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function cachePreview(url: string | null, expiresAt?: string | null): Promise<void> {
  if (url) {
    await writeAppSetting(PREVIEW_KEY, url);
    if (expiresAt) await writeAppSetting(PREVIEW_EXPIRES_KEY, expiresAt);
  } else {
    await deleteAppSetting(PREVIEW_KEY);
    await deleteAppSetting(PREVIEW_EXPIRES_KEY);
  }
}

async function mintSignedPreview(sandbox: Sandbox): Promise<{
  url: string;
  expiresAt: string;
} | null> {
  const signed = await withTimeout(
    sandbox.getSignedPreviewUrl(SOCIAL_NOVNC_PORT, SIGNED_PREVIEW_TTL_SECONDS),
    12000,
    "Daytona signed preview",
  );
  if (!signed?.url) return null;
  const url = withSkipWarning(signed.url);
  const expiresAt = new Date(Date.now() + SIGNED_PREVIEW_TTL_SECONDS * 1000).toISOString();
  await cachePreview(url, expiresAt);
  return { url, expiresAt };
}

async function ensureSignedPreview(
  sandbox: Sandbox,
  cachedUrl: string | null,
  cachedExpiresAt: string | null,
): Promise<{ url: string | null; expiresAt: string | null }> {
  const remaining = cachedExpiresAt ? Date.parse(cachedExpiresAt) - Date.now() : 0;
  const reusable =
    Boolean(cachedUrl) &&
    isSignedPreviewUrl(cachedUrl ?? "") &&
    Number.isFinite(remaining) &&
    remaining > REMINT_IF_REMAINING_MS;
  if (reusable) return { url: cachedUrl, expiresAt: cachedExpiresAt };
  try {
    const minted = await mintSignedPreview(sandbox);
    if (minted) return minted;
  } catch {
    /* keep a still-valid signed URL; never fall back to header-token previews */
  }
  if (cachedUrl && isSignedPreviewUrl(cachedUrl) && remaining > 0) {
    return { url: cachedUrl, expiresAt: cachedExpiresAt };
  }
  return { url: null, expiresAt: null };
}

async function cacheScreenshot(dataUrl: string | null): Promise<void> {
  if (dataUrl && dataUrl.length < 450_000) {
    await writeAppSetting(SCREEN_KEY, dataUrl);
  }
}

async function cacheDisplaySize(size: { width: number; height: number } | null): Promise<void> {
  if (size && size.width >= 320 && size.height >= 240) {
    await writeAppSetting(DISPLAY_KEY, `${Math.round(size.width)}x${Math.round(size.height)}`);
  }
}

async function readCachedDisplay(): Promise<{ width: number; height: number } | null> {
  return parseDisplaySize((await readAppSetting(DISPLAY_KEY))?.trim() || null);
}

function numberField(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function sizeFromUnknown(value: unknown): { width: number; height: number } | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const width = numberField(rec.width);
  const height = numberField(rec.height);
  if (width == null || height == null || width < 320 || height < 240) return null;
  if (width > 7680 || height > 4320) return null;
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Best-effort VM framebuffer size. Never starts Computer Use or the sandbox.
 */
async function readDisplaySize(sandbox: Sandbox): Promise<{ width: number; height: number } | null> {
  try {
    const info = (await withTimeout(
      sandbox.computerUse.display.getInfo() as Promise<unknown>,
      5000,
      "display info",
    )) as Record<string, unknown>;
    const size =
      sizeFromUnknown(info.primary_display) ??
      sizeFromUnknown(info.primaryDisplay) ??
      sizeFromUnknown(info);
    if (size) {
      await cacheDisplaySize(size);
      return size;
    }
  } catch {
    /* optional — screenshot / cache still usable */
  }
  return readCachedDisplay();
}

function toDataUrl(screenshot: string | undefined): string | null {
  if (!screenshot) return null;
  if (screenshot.startsWith("data:image/")) return screenshot;
  return `data:image/png;base64,${screenshot}`;
}

function emptyStatus(partial: Partial<SocialMachineStatus>): SocialMachineStatus {
  return {
    state: "not_configured",
    configured: false,
    sandboxId: null,
    autoStopMinutes: DEFAULT_AUTO_STOP_MINUTES,
    startedAt: null,
    stoppedAt: null,
    runningMs: null,
    longRunning: false,
    previewUrl: null,
    previewExpiresAt: null,
    lastScreenshot: null,
    lastError: null,
    computerUse: false,
    pathNote: PATH_NOTE,
    displayWidth: null,
    displayHeight: null,
    os: "windows",
    size: DEFAULT_SOCIAL_MACHINE_SIZE,
    region: "us",
    snapshotName: null,
    geoWarning: instagramGeoWarning("us"),
    proxyConfigured: false,
    ...partial,
  };
}

function sandboxLooksWindows(sandbox: Sandbox): boolean {
  const labels = sandbox.labels ?? {};
  if (String(labels.os ?? "").toLowerCase() === "windows") return true;
  return isWindowsSnapshot(sandbox.snapshot);
}

async function resolveOs(sandbox?: Sandbox | null): Promise<SocialMachineOs> {
  if (sandbox && sandboxLooksWindows(sandbox)) return "windows";
  const stored = parseSocialMachineOs(await readAppSetting(OS_KEY));
  if (sandbox && !sandboxLooksWindows(sandbox)) return "linux";
  return stored;
}

async function captureHotSnapshot(sandbox: Sandbox): Promise<string | null> {
  const plan = hibernatePlan();
  if (!plan.snapshotWhileRunning) return null;
  const names = [HOT_SNAPSHOT_NAME, `${HOT_SNAPSHOT_NAME}-${Date.now()}`];
  for (const name of names) {
    try {
      await sandbox.createSnapshot(name, 90);
      await writeAppSetting(SNAPSHOT_KEY, name);
      return name;
    } catch {
      /* try a unique name */
    }
  }
  return null;
}

async function applyIdleIntervals(sandbox: Sandbox, minutes: number): Promise<void> {
  const policy = idlePolicy(minutes);
  try {
    await sandbox.setAutostopInterval(policy.autoStopInterval);
  } catch {
    /* older runners */
  }
  try {
    await sandbox.setAutoPauseInterval(policy.autoPauseInterval);
  } catch {
    /* applies on next create */
  }
  try {
    await sandbox.setAutoDeleteInterval(policy.autoDeleteInterval);
  } catch {
    /* never delete */
  }
}

async function applyWindowsProxy(sandbox: Sandbox, proxyUrl: string | null): Promise<void> {
  if (!proxyUrl) return;
  try {
    await sandbox.updateNetworkSettings({ outboundProxyUrl: proxyUrl } as never);
  } catch {
    /* optional — script still applies WinHTTP */
  }
  const script = windowsProxyScript(proxyUrl);
  if (!script) return;
  try {
    await sandbox.process.executeCommand(script, undefined, undefined, 40);
  } catch {
    /* locale/proxy are best-effort */
  }
}

async function maybeResizeWindows(sandbox: Sandbox): Promise<void> {
  if (!shouldResizeWindows(sandbox.cpu, sandbox.memory)) return;
  try {
    await sandbox.resize(
      { cpu: TARGET_WINDOWS_RESOURCES.cpu, memory: TARGET_WINDOWS_RESOURCES.memory },
      120,
    );
  } catch {
    /* quota / class limit — windows-large snapshot still used on next create */
  }
}

async function applyWindowsDesktop(sandbox: Sandbox): Promise<void> {
  const applied = (await readAppSetting(LOCALE_APPLIED_KEY))?.trim();
  if (applied === sandbox.id) {
    try {
      await sandbox.process.executeCommand(windowsLocaleScript(), undefined, undefined, 40);
    } catch {
      /* already applied; best-effort refresh */
    }
    return;
  }
  try {
    await sandbox.process.executeCommand(windowsLocaleScript(), undefined, undefined, 45);
    await writeAppSetting(LOCALE_APPLIED_KEY, sandbox.id);
  } catch (error) {
    const message = sanitizeDaytonaError(
      error instanceof Error ? error.message : "Couldn’t apply Australia locale on the desktop.",
    );
    const existing = (await readAppSetting(LAST_ERROR_KEY))?.trim() || "";
    if (!existing) await writeAppSetting(LAST_ERROR_KEY, message);
  }
}

async function createWindowsSandbox(daytona: Daytona, config: DaytonaConfig): Promise<Sandbox> {
  const region = parseSocialMachineRegion(config.target);
  const policy = idlePolicy(config.autoStopMinutes);
  const storedSnap = (await readAppSetting(SNAPSHOT_KEY))?.trim() || "";
  const candidates = snapshotCandidates(config.size, storedSnap);
  let lastError: unknown = null;
  for (const snapshot of candidates) {
    try {
      const sandbox = await daytona.create(
        {
          name: "clippy-os-social",
          snapshot,
          labels: { ...SOCIAL_LABELS, os: "windows", region },
          autoStopInterval: policy.autoStopInterval,
          autoPauseInterval: policy.autoPauseInterval,
          autoArchiveInterval: policy.autoArchiveInterval,
          autoDeleteInterval: policy.autoDeleteInterval,
          public: false,
          envVars: {
            TZ: DEFAULT_SOCIAL_TIMEZONE,
            LANG: "en_AU.UTF-8",
            LC_ALL: "en_AU.UTF-8",
            CLIPPY_LOCALE: DEFAULT_SOCIAL_LOCALE,
          },
          ...(config.proxyUrl ? { outboundProxyUrl: config.proxyUrl } : {}),
        },
        { timeout: 240 },
      );
      await writeAppSetting(OS_KEY, "windows");
      await writeAppSetting(SIZE_KEY, config.size);
      return sandbox;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Couldn’t create the Windows Social Machine.");
}

/**
 * Status probe only. Lists or gets the labeled sandbox. Never calls start().
 */
export async function getSocialMachineStatus(): Promise<SocialMachineStatus> {
  const config = await loadDaytonaConfig();
  const lastError = (await readAppSetting(LAST_ERROR_KEY))?.trim() || null;
  const lastScreenshot = (await readAppSetting(SCREEN_KEY))?.trim() || null;
  const startedAt = (await readAppSetting(STARTED_AT_KEY))?.trim() || null;
  const stoppedAt = (await readAppSetting(STOPPED_AT_KEY))?.trim() || null;
  const snapshotName = (await readAppSetting(SNAPSHOT_KEY))?.trim() || null;
  const extras = {
    os: parseSocialMachineOs(await readAppSetting(OS_KEY)),
    size: parseSocialMachineSize(await readAppSetting(SIZE_KEY)),
    region: parseSocialMachineRegion(config?.target),
    snapshotName,
    geoWarning: instagramGeoWarning(parseSocialMachineRegion(config?.target)),
    proxyConfigured: Boolean(config?.proxyUrl),
  };
  if (!config) {
    return emptyStatus({
      lastError,
      lastScreenshot,
      stoppedAt,
      ...extras,
      proxyConfigured: false,
    });
  }

  const storedId = (await readAppSetting(SANDBOX_KEY))?.trim() || null;
  const cachedPreview = (await readAppSetting(PREVIEW_KEY))?.trim() || null;
  const cachedExpires = (await readAppSetting(PREVIEW_EXPIRES_KEY))?.trim() || null;
  if (!storedId) {
    return emptyStatus({
      state: "stopped",
      configured: true,
      autoStopMinutes: config.autoStopMinutes,
      lastScreenshot,
      stoppedAt,
      ...extras,
    });
  }
  try {
    const daytona = createClient(config);
    let sandbox: Sandbox | null = null;
    try {
      sandbox = await withTimeout(daytona.get(storedId), 10000, "Daytona get");
    } catch {
      sandbox = null;
    }
    if (!sandbox) {
      return emptyStatus({
        state: snapshotName ? "paused" : "stopped",
        configured: true,
        sandboxId: storedId,
        autoStopMinutes: config.autoStopMinutes,
        lastScreenshot,
        lastError: "Saved machine id could not be reached. Start to resume the hot snapshot.",
        stoppedAt,
        ...extras,
      });
    }
    if (sandbox.id && sandbox.id !== storedId) {
      await writeAppSetting(SANDBOX_KEY, sandbox.id);
    }
    const state = mapSandboxState(sandbox.state);
    const os = await resolveOs(sandbox);
    const runningMs =
      state === "running" && startedAt
        ? Math.max(0, Date.now() - Date.parse(startedAt))
        : null;
    let previewUrl: string | null = null;
    let previewExpiresAt: string | null = null;
    let display = await readCachedDisplay();
    if (state === "running") {
      const preview = await ensureSignedPreview(sandbox, cachedPreview, cachedExpires);
      previewUrl = preview.url;
      previewExpiresAt = preview.expiresAt;
      if (!display) display = await readDisplaySize(sandbox);
    }
    return emptyStatus({
      state,
      configured: true,
      sandboxId: sandbox.id,
      autoStopMinutes: sandbox.autoPauseInterval || sandbox.autoStopInterval || config.autoStopMinutes,
      startedAt: state === "running" ? startedAt : null,
      stoppedAt: state === "running" ? null : stoppedAt,
      runningMs,
      longRunning: runningMs != null && runningMs >= SOCIAL_LONG_RUN_MS,
      previewUrl,
      previewExpiresAt,
      lastScreenshot,
      lastError: state === "error" ? sandbox.errorReason ?? lastError : lastError,
      computerUse: state === "running",
      displayWidth: display?.width ?? null,
      displayHeight: display?.height ?? null,
      ...extras,
      os,
      snapshotName: sandbox.snapshot ?? extras.snapshotName,
    });
  } catch (error) {
    const message = sanitizeDaytonaError(
      error instanceof Error ? error.message : "Couldn’t reach Daytona.",
    );
    return emptyStatus({
      state: "error",
      configured: true,
      sandboxId: storedId,
      autoStopMinutes: config.autoStopMinutes,
      lastError: message,
      lastScreenshot,
      stoppedAt,
      ...extras,
    });
  }
}

/**
 * Auth probe only. Lists sandboxes. Never starts a VM.
 */
export async function testDaytonaConnection(): Promise<{ ok: true; count: number }> {
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  let count = 0;
  const iter = daytona.list({ limit: 5 });
  await withTimeout(
    (async () => {
      for await (const _sandbox of iter) {
        count += 1;
        if (count >= 5) break;
      }
    })(),
    12000,
    "Daytona test",
  );
  return { ok: true, count };
}

/**
 * Probe a residential HTTPS proxy through undici. Never starts a VM.
 */
export async function testResidentialProxy(overrideUrl?: string | null): Promise<{
  ok: true;
  egressIp: string | null;
}> {
  const stored = parseHttpsProxy(await readAppSetting(PROXY_KEY));
  const proxyUrl = parseHttpsProxy(overrideUrl) ?? stored;
  if (!proxyUrl) throw new Error("PROXY_MISSING");
  const { ProxyAgent, fetch: undiciFetch } = await import("undici");
  const agent = new ProxyAgent(proxyUrl);
  const response = await undiciFetch("https://api.ipify.org?format=json", {
    dispatcher: agent,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("PROXY_UNAVAILABLE");
  const body = (await response.json()) as { ip?: string };
  const ip = typeof body.ip === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(body.ip) ? body.ip : null;
  return { ok: true, egressIp: ip };
}

/**
 * Pull a country-matched public HTTPS/HTTP proxy (ProxyScrape, no key) and
 * keep the first one that can reach the internet. Never starts a VM.
 */
export async function provisionLocationProxy(countryRaw?: string | null): Promise<{
  ok: true;
  country: string;
  egressIp: string | null;
  host: string;
}> {
  const country = parseProxyCountry(countryRaw ?? (await readAppSetting(PROXY_COUNTRY_KEY)) ?? DEFAULT_PROXY_COUNTRY);
  const response = await fetch(proxyscrapeListUrl(country), { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("PROXY_UNAVAILABLE");
  const text = await response.text();
  const candidates = text
    .split(/\r?\n/)
    .map(parseProxyListLine)
    .filter((row): row is string => Boolean(row))
    .slice(0, 12);
  if (candidates.length === 0) throw new Error("PROXY_UNAVAILABLE");
  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const probed = await testResidentialProxy(url);
      await writeAppSetting(PROXY_KEY, url);
      await writeAppSetting(PROXY_COUNTRY_KEY, country);
      const host = new URL(url).hostname;
      return { ok: true, country, egressIp: probed.egressIp, host };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("PROXY_UNAVAILABLE");
}

export async function startSocialMachine(): Promise<SocialMachineStatus> {
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const storedId = (await readAppSetting(SANDBOX_KEY))?.trim() || null;
  let sandbox: Sandbox | null = null;
  try {
    sandbox = await findSocialSandbox(daytona, storedId);
  } catch {
    sandbox = null;
  }
  try {
    if (sandbox && !sandboxLooksWindows(sandbox)) {
      try {
        await sandbox.stop(60).catch(() => undefined);
      } catch {
        /* migrate away from Linux */
      }
      sandbox = null;
    }
    if (!sandbox) {
      sandbox = await createWindowsSandbox(daytona, config);
    } else {
      const state = mapSandboxState(sandbox.state);
      if (state !== "running" && state !== "starting") {
        await sandbox.start(180);
      }
    }
    await writeAppSetting(SANDBOX_KEY, sandbox.id);
    await writeAppSetting(STARTED_AT_KEY, new Date().toISOString());
    await deleteAppSetting(STOPPED_AT_KEY);
    await deleteAppSetting(LAST_ERROR_KEY);
    await writeAppSetting(OS_KEY, "windows");

    if (sandboxLooksWindows(sandbox)) {
      await maybeResizeWindows(sandbox);
      await applyIdleIntervals(sandbox, config.autoStopMinutes);
      await applyWindowsDesktop(sandbox);
      await applyWindowsProxy(sandbox, config.proxyUrl);
    }

    let computerUse = false;
    try {
      await sandbox.computerUse.start();
      computerUse = true;
    } catch (error) {
      const message = sanitizeDaytonaError(
        error instanceof Error ? error.message : "Desktop stack didn’t start.",
      );
      await writeAppSetting(LAST_ERROR_KEY, message);
    }

    let previewUrl: string | null = null;
    let previewExpiresAt: string | null = null;
    try {
      const minted = await mintSignedPreview(sandbox);
      previewUrl = minted?.url ?? null;
      previewExpiresAt = minted?.expiresAt ?? null;
    } catch (error) {
      await cachePreview(null);
      const message = sanitizeDaytonaError(
        error instanceof Error ? error.message : "Desktop preview URL couldn’t be signed.",
      );
      const existing = (await readAppSetting(LAST_ERROR_KEY))?.trim() || "";
      if (!existing) await writeAppSetting(LAST_ERROR_KEY, message);
    }

    let display = await readCachedDisplay();
    if (computerUse) {
      display = (await readDisplaySize(sandbox)) ?? display;
    }

    return emptyStatus({
      state: "running",
      configured: true,
      sandboxId: sandbox.id,
      autoStopMinutes: sandbox.autoPauseInterval || config.autoStopMinutes,
      startedAt: await readAppSetting(STARTED_AT_KEY),
      runningMs: 0,
      longRunning: false,
      previewUrl,
      previewExpiresAt,
      lastScreenshot: (await readAppSetting(SCREEN_KEY))?.trim() || null,
      lastError: (await readAppSetting(LAST_ERROR_KEY))?.trim() || null,
      computerUse,
      displayWidth: display?.width ?? null,
      displayHeight: display?.height ?? null,
      os: "windows",
      size: config.size,
      region: parseSocialMachineRegion(config.target),
      snapshotName: sandbox.snapshot ?? (await readAppSetting(SNAPSHOT_KEY)),
      geoWarning: instagramGeoWarning(parseSocialMachineRegion(config.target)),
      proxyConfigured: Boolean(config.proxyUrl),
    });
  } catch (error) {
    const message = sanitizeDaytonaError(
      error instanceof Error ? error.message : "Couldn’t start the Social Machine.",
    );
    await writeAppSetting(LAST_ERROR_KEY, message);
    throw new Error(message);
  }
}

export async function stopSocialMachine(): Promise<SocialMachineStatus> {
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const storedId = (await readAppSetting(SANDBOX_KEY))?.trim() || null;
  const sandbox = await findSocialSandbox(daytona, storedId).catch(() => null);
  if (sandbox) {
    const os = await resolveOs(sandbox);
    try {
      await sandbox.computerUse.stop().catch(() => undefined);
    } catch {
      /* still hibernate */
    }
    if (stopActionForOs(os) === "pause") {
      const plan = hibernatePlan();
      if (plan.snapshotWhileRunning && mapSandboxState(sandbox.state) === "running") {
        await captureHotSnapshot(sandbox);
      }
      try {
        await sandbox.pause(120);
      } catch {
        await sandbox.stop(120);
      }
    } else {
      await sandbox.stop(120);
    }
  }
  await writeAppSetting(STOPPED_AT_KEY, new Date().toISOString());
  await deleteAppSetting(STARTED_AT_KEY);
  await cachePreview(null);
  await deleteAppSetting(LAST_ERROR_KEY);
  return getSocialMachineStatus();
}

export async function refreshDesktopPreview(): Promise<{
  previewUrl: string | null;
  screenshot: string | null;
}> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);
  let previewUrl: string | null = status.previewUrl;
  let previewExpiresAt: string | null = status.previewExpiresAt;
  try {
    const minted = await mintSignedPreview(sandbox);
    previewUrl = minted?.url ?? previewUrl;
    previewExpiresAt = minted?.expiresAt ?? previewExpiresAt;
  } catch {
    /* keep cached signed URL */
  }
  let screenshot: string | null = null;
  try {
    const shot = await sandbox.computerUse.screenshot.takeFullScreen();
    screenshot = toDataUrl(shot.screenshot);
    await cacheScreenshot(screenshot);
    const shotSize = sizeFromUnknown(shot);
    if (shotSize) await cacheDisplaySize(shotSize);
    else await readDisplaySize(sandbox);
  } catch {
    screenshot = (await readAppSetting(SCREEN_KEY))?.trim() || null;
  }
  return { previewUrl, screenshot };
}

export async function openPlatformInMachine(platform: SocialPlatform): Promise<void> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);
  const os = await resolveOs(sandbox);
  const url = PLATFORM_HOME_URL[platform];
  await sandbox.process.executeCommand(openUrlCommand(os, url), undefined, undefined, 20);
}

export async function transferAndOpenUpload(input: {
  platform: SocialPlatform;
  caption: string | null;
  mediaUrl: string | null;
  postId: string;
}): Promise<{ screenshot: string | null; reason: string }> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);

  try {
    await sandbox.computerUse.start();
  } catch {
    /* already running is fine */
  }

  let transferred = false;
  const os = await resolveOs(sandbox);
  if (input.mediaUrl) {
    try {
      const buffer = await fetchMediaBuffer(input.mediaUrl);
      if (buffer) {
        const ext = guessExt(input.mediaUrl);
        const remote = uploadPath(os, input.postId, ext);
        await sandbox.process.executeCommand(ensureUploadDirCommand(os), undefined, undefined, 15);
        await sandbox.fs.uploadFile(buffer, remote);
        transferred = true;
      }
    } catch {
      transferred = false;
    }
  }

  const url = PLATFORM_UPLOAD_URL[input.platform];
  await sandbox.process.executeCommand(openUrlCommand(os, url), undefined, undefined, 20);

  if (input.caption) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      await sandbox.computerUse.keyboard.type(input.caption.slice(0, 400));
    } catch {
      /* operator finishes in the stream */
    }
  }

  let screenshot: string | null = null;
  try {
    const shot = await sandbox.computerUse.screenshot.takeFullScreen();
    screenshot = toDataUrl(shot.screenshot);
    await cacheScreenshot(screenshot);
  } catch {
    screenshot = (await readAppSetting(SCREEN_KEY))?.trim() || null;
  }

  const reason = transferred
    ? "Media is in the Social Machine. Finish login, CAPTCHA, or publish in the desktop view."
    : "Opened the platform upload page. Confirm login and attach the file in the desktop view.";
  return { screenshot, reason };
}

async function fetchMediaBuffer(url: string): Promise<Buffer | null> {
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma < 0) return null;
    const raw = url.slice(comma + 1);
    try {
      return Buffer.from(raw, "base64");
    } catch {
      return null;
    }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) return null;
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > 40_000_000) return null;
  return Buffer.from(bytes);
}

function guessExt(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".mp4") || lower.includes("video")) return ".mp4";
  if (lower.includes(".webm")) return ".webm";
  if (lower.includes(".jpg") || lower.includes("jpeg")) return ".jpg";
  if (lower.includes(".webp")) return ".webp";
  return ".png";
}

export async function setSocialAutoStopMinutes(minutes: number): Promise<SocialMachineStatus> {
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) {
    throw new Error("AUTO_STOP_INVALID");
  }
  const rounded = Math.floor(minutes);
  await writeAppSetting(AUTO_STOP_KEY, String(rounded));
  const status = await getSocialMachineStatus();
  if ((status.state === "running" || status.state === "paused") && status.sandboxId) {
    const config = await loadDaytonaConfig();
    if (config) {
      try {
        const daytona = createClient(config);
        const sandbox = await daytona.get(status.sandboxId);
        await applyIdleIntervals(sandbox, rounded);
      } catch {
        /* setting is persisted; applies on next start */
      }
    }
  }
  return getSocialMachineStatus();
}

export async function ensureComputerUseStack(): Promise<{ computerUse: boolean }> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);
  try {
    await sandbox.computerUse.start();
    return { computerUse: true };
  } catch (error) {
    const message = sanitizeDaytonaError(
      error instanceof Error ? error.message : "Desktop stack didn’t start.",
    );
    await writeAppSetting(LAST_ERROR_KEY, message);
    throw new Error("COMPUTER_USE_UNAVAILABLE");
  }
}

export async function takeSocialScreenshot(): Promise<{
  screenshotRef: string;
  capturedAt: string;
  mimeType: "image/png";
  dataUrl: string | null;
}> {
  const refreshed = await refreshDesktopPreview();
  const capturedAt = new Date().toISOString();
  return {
    screenshotRef: "social-desktop-latest",
    capturedAt,
    mimeType: "image/png",
    dataUrl: refreshed.screenshot && refreshed.screenshot.length < 250_000 ? refreshed.screenshot : null,
  };
}

export async function listSocialWindows(): Promise<{
  windows: Array<{ id: string; title: string }>;
  note: string;
}> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);
  const os = await resolveOs(sandbox);
  try {
    const result = (await sandbox.process.executeCommand(
      listWindowsCommand(os),
      undefined,
      undefined,
      15,
    )) as { result?: string; output?: string };
    const raw = String(result.result ?? result.output ?? "").trim();
    const parsed = JSON.parse(raw || "[]") as unknown;
    const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
    const windows = rows
      .filter((row): row is { id: string | number; title?: string; MainWindowTitle?: string } =>
        Boolean(row && typeof row === "object"),
      )
      .map((row) => ({
        id: String((row as { id?: unknown }).id ?? "").slice(0, 40),
        title: String(
          (row as { title?: unknown; MainWindowTitle?: unknown }).title ??
            (row as { MainWindowTitle?: unknown }).MainWindowTitle ??
            "",
        ).slice(0, 120),
      }))
      .filter((row) => row.id);
    return { windows, note: windows.length ? "best-effort" : "No windows reported from the desktop." };
  } catch {
    return { windows: [], note: "Window list is best-effort and unavailable on this desktop." };
  }
}

export async function getRunningSocialSandbox(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sandbox: any;
  id: string;
}> {
  const status = await getSocialMachineStatus();
  if (status.state !== "running" || !status.sandboxId) {
    throw new Error("MACHINE_STOPPED");
  }
  const config = await loadDaytonaConfig();
  if (!config) throw new Error("DAYTONA_UNAVAILABLE");
  const daytona = createClient(config);
  const sandbox = await daytona.get(status.sandboxId);
  return { sandbox, id: status.sandboxId };
}

export async function persistDaytonaSettings(values: {
  apiKey?: string;
  apiUrl?: string;
  target?: string;
  autoStopMinutes?: string;
  size?: string;
  proxyUrl?: string;
  proxyHost?: string;
  proxyPort?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  proxyProtocol?: string;
  proxyCountry?: string;
}): Promise<void> {
  const key = (values.apiKey ?? "").trim();
  if (key) {
    if (key.length < 12) throw new Error("KEY_TOO_SHORT");
    await writeAppSetting(KEY, key);
  }
  const url = (values.apiUrl ?? "").trim();
  await writeAppSetting(URL_KEY, url || DEFAULT_DAYTONA_API_URL);
  const target = parseSocialMachineRegion(values.target);
  await writeAppSetting(TARGET_KEY, target);
  const minutesRaw = (values.autoStopMinutes ?? "").trim();
  if (minutesRaw) {
    const parsed = Number.parseInt(minutesRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 5 || parsed > 240) {
      throw new Error("AUTO_STOP_INVALID");
    }
    await writeAppSetting(AUTO_STOP_KEY, String(parsed));
  } else {
    await writeAppSetting(AUTO_STOP_KEY, String(DEFAULT_AUTO_STOP_MINUTES));
  }
  if (values.size !== undefined) {
    await writeAppSetting(SIZE_KEY, parseSocialMachineSize(values.size));
  }
  const proxyTouched =
    values.proxyUrl !== undefined ||
    values.proxyHost !== undefined ||
    values.proxyPort !== undefined ||
    values.proxyUsername !== undefined ||
    values.proxyPassword !== undefined ||
    values.proxyProtocol !== undefined;
  if (proxyTouched) {
    const structured = parseResidentialProxy({
      url: values.proxyUrl,
      host: values.proxyHost,
      port: values.proxyPort,
      username: values.proxyUsername,
      password: values.proxyPassword,
      protocol: values.proxyProtocol,
    });
    const composed = structured ? composeProxyUrl(structured) : parseHttpsProxy(values.proxyUrl);
    const anyFilled = Boolean(
      String(values.proxyUrl ?? "").trim() ||
        String(values.proxyHost ?? "").trim() ||
        String(values.proxyPort ?? "").trim(),
    );
    if (anyFilled && !composed) throw new Error("VALIDATION");
    if (composed) await writeAppSetting(PROXY_KEY, composed);
    else await deleteAppSetting(PROXY_KEY);
  }
  if (values.proxyCountry !== undefined) {
    await writeAppSetting(PROXY_COUNTRY_KEY, parseProxyCountry(values.proxyCountry));
  }
}

export async function disconnectDaytona(): Promise<void> {
  await deleteAppSetting(KEY);
  await deleteAppSetting(URL_KEY);
  await deleteAppSetting(TARGET_KEY);
  await deleteAppSetting(STARTED_AT_KEY);
  await cachePreview(null);
  await deleteAppSetting(LAST_ERROR_KEY);
  /* sandbox id is kept so a later connect can reuse browser profiles */
}
