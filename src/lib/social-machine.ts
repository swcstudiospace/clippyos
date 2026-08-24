/** Client-safe Social Machine policy. No secrets, no Daytona SDK. */

export const SOCIAL_MACHINE_OS = ["windows", "linux"] as const;
export type SocialMachineOs = (typeof SOCIAL_MACHINE_OS)[number];

export const SOCIAL_MACHINE_SIZES = ["windows-medium", "windows-large"] as const;
export type SocialMachineSize = (typeof SOCIAL_MACHINE_SIZES)[number];

export const SOCIAL_MACHINE_REGIONS = ["us", "eu"] as const;
export type SocialMachineRegion = (typeof SOCIAL_MACHINE_REGIONS)[number];

export const DEFAULT_SOCIAL_MACHINE_SIZE: SocialMachineSize = "windows-large";
export const DEFAULT_SOCIAL_MACHINE_REGION: SocialMachineRegion = "us";
export const DEFAULT_SOCIAL_MACHINE_OS: SocialMachineOs = "windows";
export const DEFAULT_SOCIAL_TIMEZONE = "Australia/Sydney";
export const DEFAULT_SOCIAL_LOCALE = "en-AU";
/** Windows tzutil id for AEST/AEDT (Sydney). */
export const WINDOWS_TIMEZONE_ID = "AUS Eastern Standard Time";
/** Windows GeoId 12 = Australia. */
export const WINDOWS_GEO_ID = 12;

export const WINDOWS_SNAPSHOTS: Record<SocialMachineSize, { cpu: number; memoryGiB: number; diskGiB: number }> =
  {
    "windows-medium": { cpu: 2, memoryGiB: 8, diskGiB: 50 },
    "windows-large": { cpu: 4, memoryGiB: 16, diskGiB: 50 },
  };

/** Daytona's largest Windows snapshot. Hot-resize existing undersized VMs to this. */
export const TARGET_WINDOWS_RESOURCES = { cpu: 4, memory: 16 } as const;

export const HOT_SNAPSHOT_NAME = "clippy-os-social-hot";
export const SOCIAL_VOLUME_NAME = "clippy-os-social-profiles";
export const WINDOWS_UPLOAD_DIR = "C:\\Users\\Public\\ClippyOS\\uploads";
export const LINUX_UPLOAD_DIR = "/home/daytona/uploads";
export const WINDOWS_PROFILE_DIR = "C:\\Users\\Public\\ClippyOS\\profiles";

export function parseSocialMachineSize(value: unknown): SocialMachineSize {
  const raw = String(value ?? "").trim();
  if (raw === "windows-medium" || raw === "windows-small") return "windows-medium";
  return "windows-large";
}

export function parseSocialMachineRegion(value: unknown): SocialMachineRegion {
  return String(value ?? "").trim().toLowerCase() === "eu" ? "eu" : "us";
}

export function parseSocialMachineOs(value: unknown): SocialMachineOs {
  return String(value ?? "").trim().toLowerCase() === "linux" ? "linux" : "windows";
}

export function snapshotForSize(size: SocialMachineSize): string {
  return size;
}

export function isWindowsSnapshot(snapshot: string | null | undefined): boolean {
  return Boolean(snapshot && snapshot.toLowerCase().includes("windows"));
}

export function isHotSnapshot(name: string | null | undefined): boolean {
  return Boolean(name && name.toLowerCase().includes("clippy-os-social-hot"));
}

export function snapshotCandidates(
  size: SocialMachineSize,
  stored?: string | null,
): string[] {
  const names: string[] = [];
  const push = (value: string | null | undefined) => {
    const name = String(value ?? "").trim();
    if (!name) return;
    if (name.toLowerCase().includes("linux")) return;
    if (names.includes(name)) return;
    names.push(name);
  };
  push(stored);
  push(snapshotForSize(size));
  if (size !== "windows-medium") push("windows-medium");
  return names;
}

export function shouldResizeWindows(
  cpu?: number | null,
  memoryGiB?: number | null,
): boolean {
  if (cpu == null && memoryGiB == null) return false;
  if (cpu != null && cpu < TARGET_WINDOWS_RESOURCES.cpu) return true;
  if (memoryGiB != null && memoryGiB < TARGET_WINDOWS_RESOURCES.memory) return true;
  return false;
}

export type IdlePolicy = {
  autoStopInterval: number;
  autoPauseInterval: number;
  autoArchiveInterval: number;
  autoDeleteInterval: number;
};

/** Pause (hot) instead of stop. Never auto-delete the Social Machine. */
export function idlePolicy(idleMinutes: number): IdlePolicy {
  const minutes = Number.isFinite(idleMinutes)
    ? Math.min(240, Math.max(5, Math.floor(idleMinutes)))
    : 20;
  return {
    autoStopInterval: 0,
    autoPauseInterval: minutes,
    autoArchiveInterval: 0,
    autoDeleteInterval: -1,
  };
}

export type StopAction = "pause" | "stop";

export function stopActionForOs(os: SocialMachineOs): StopAction {
  return os === "windows" ? "pause" : "stop";
}

export type HibernatePlan = {
  primary: "pause";
  snapshotWhileRunning: true;
  snapshotAfterPause: false;
  neverDelete: true;
};

/** Pause is the hot snapshot (filesystem + memory). Named snapshot is taken while still running. */
export function hibernatePlan(): HibernatePlan {
  return {
    primary: "pause",
    snapshotWhileRunning: true,
    snapshotAfterPause: false,
    neverDelete: true,
  };
}

export function mapProviderState(state: string | undefined):
  | "running"
  | "starting"
  | "stopping"
  | "paused"
  | "error"
  | "stopped" {
  const value = (state ?? "").toLowerCase();
  if (value === "started") return "running";
  if (
    value === "starting" ||
    value === "restoring" ||
    value === "creating" ||
    value === "pending" ||
    value === "building" ||
    value === "pulling_snapshot" ||
    value === "snapshotting"
  ) {
    return "starting";
  }
  if (value === "pausing") return "stopping";
  if (value === "paused" || value === "archived") return "paused";
  if (value === "stopping") return "stopping";
  if (value === "error" || value === "build_failed") return "error";
  return "stopped";
}

export function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''");
}

export function openUrlCommand(os: SocialMachineOs, url: string): string {
  if (!/^https:\/\//i.test(url)) throw new Error("VALIDATION");
  if (os === "windows") {
    const safe = escapePowerShellSingleQuoted(url);
    return `powershell -NoProfile -Command "Start-Process '${safe}'"`;
  }
  const quoted = url.replace(/'/g, `'\\''`);
  return `xdg-open '${quoted}' >/dev/null 2>&1 || firefox '${quoted}' >/dev/null 2>&1 || google-chrome --no-sandbox '${quoted}' >/dev/null 2>&1 || true`;
}

export function uploadDir(os: SocialMachineOs): string {
  return os === "windows" ? WINDOWS_UPLOAD_DIR : LINUX_UPLOAD_DIR;
}

export function uploadPath(os: SocialMachineOs, postId: string, ext: string): string {
  const safeId = postId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  if (os === "windows") return `${WINDOWS_UPLOAD_DIR}\\${safeId}${safeExt}`;
  return `${LINUX_UPLOAD_DIR}/${safeId}${safeExt}`;
}

export function ensureUploadDirCommand(os: SocialMachineOs): string {
  if (os === "windows") {
    return `powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '${escapePowerShellSingleQuoted(WINDOWS_UPLOAD_DIR)}' | Out-Null"`;
  }
  return "mkdir -p /home/daytona/uploads";
}

export function windowsLocaleScript(): string {
  return [
    `tzutil /s "${WINDOWS_TIMEZONE_ID}"`,
    `powershell -NoProfile -Command "try { Set-TimeZone -Id '${WINDOWS_TIMEZONE_ID}' } catch {}; try { Set-WinHomeLocation -GeoId ${WINDOWS_GEO_ID} } catch {}; try { Set-WinSystemLocale -SystemLocale ${DEFAULT_SOCIAL_LOCALE} } catch {}; try { Set-Culture ${DEFAULT_SOCIAL_LOCALE} } catch {}; try { Set-WinUserLanguageList -LanguageList ${DEFAULT_SOCIAL_LOCALE} -Force } catch {}; try { Set-WinUILanguageOverride -Language ${DEFAULT_SOCIAL_LOCALE} } catch {}; New-Item -ItemType Directory -Force -Path '${escapePowerShellSingleQuoted(WINDOWS_UPLOAD_DIR)}','${escapePowerShellSingleQuoted(WINDOWS_PROFILE_DIR)}' | Out-Null"`,
  ].join(" & ");
}

export function windowsProxyScript(proxyUrl: string | null): string | null {
  const parsed = parseHttpsProxy(proxyUrl);
  if (!parsed) return null;
  const url = new URL(parsed);
  const hostPort = `${url.hostname}:${url.port || (url.protocol === "https:" ? "443" : "80")}`;
  const safeHost = escapePowerShellSingleQuoted(hostPort);
  const safeFull = escapePowerShellSingleQuoted(parsed);
  return `powershell -NoProfile -Command "try { netsh winhttp set proxy '${safeHost}' } catch {}; try { Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 1 } catch {}; try { Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -Value '${safeHost}' } catch {}; [Environment]::SetEnvironmentVariable('HTTPS_PROXY','${safeFull}','User'); [Environment]::SetEnvironmentVariable('HTTP_PROXY','${safeFull}','User'); Write-Output 'proxy-applied'"`;
}

export function listWindowsCommand(os: SocialMachineOs): string {
  if (os === "windows") {
    return `powershell -NoProfile -Command "$w = Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object -First 30 Id,MainWindowTitle; $w | ForEach-Object { [pscustomobject]@{ id = [string]$_.Id; title = $_.MainWindowTitle } } | ConvertTo-Json -Compress"`;
  }
  return `python3 - <<'PY'
import json, subprocess
wins = []
try:
    out = subprocess.check_output(["wmctrl", "-l"], text=True, stderr=subprocess.DEVNULL)
    for line in out.splitlines():
        parts = line.split(None, 3)
        if len(parts) >= 4:
            wins.append({"id": parts[0], "title": parts[3][:120]})
except Exception:
    pass
print(json.dumps(wins[:30]))
PY`;
}

export function instagramGeoWarning(region: SocialMachineRegion): string {
  return `Daytona has no Australia region (only ${region.toUpperCase()}). Instagram often challenges logins from US/EU datacenter IPs even when the Windows clock is Australia/Sydney. Prefer Instagram Graph API in Settings, or set a residential AU HTTPS proxy.`;
}

export function parseHttpsProxy(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export type ResidentialProxy = {
  protocol: "https" | "http";
  host: string;
  port: number;
  username: string | null;
  password: string | null;
};

export function parseResidentialProxy(input: {
  url?: string | null;
  host?: string | null;
  port?: string | number | null;
  username?: string | null;
  password?: string | null;
  protocol?: string | null;
}): ResidentialProxy | null {
  const pasted = String(input.url ?? "").trim();
  if (pasted) {
    try {
      const parsed = new URL(pasted);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      if (!parsed.hostname) return null;
      const port = Number.parseInt(parsed.port || (parsed.protocol === "https:" ? "443" : "80"), 10);
      if (!Number.isFinite(port) || port < 1 || port > 65535) return null;
      return {
        protocol: parsed.protocol === "http:" ? "http" : "https",
        host: parsed.hostname,
        port,
        username: parsed.username ? decodeURIComponent(parsed.username) : null,
        password: parsed.password ? decodeURIComponent(parsed.password) : null,
      };
    } catch {
      return null;
    }
  }
  const host = String(input.host ?? "").trim().toLowerCase();
  if (!host || host.length > 253 || /[\s/\\]/.test(host)) return null;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return null;
  }
  const port = Number.parseInt(String(input.port ?? "").trim(), 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) return null;
  const protocol = String(input.protocol ?? "https").trim().toLowerCase() === "http" ? "http" : "https";
  const username = String(input.username ?? "").trim() || null;
  const passwordRaw = input.password == null ? "" : String(input.password);
  return {
    protocol,
    host,
    port,
    username,
    password: username ? passwordRaw : null,
  };
}

export function composeProxyUrl(proxy: ResidentialProxy): string {
  const auth = proxy.username
    ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password ?? "")}@`
    : "";
  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
}

export const PROXY_COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
] as const;
export type ProxyCountryCode = (typeof PROXY_COUNTRIES)[number]["code"];
export const DEFAULT_PROXY_COUNTRY: ProxyCountryCode = "AU";

export function parseProxyCountry(value: unknown): ProxyCountryCode {
  const raw = String(value ?? "").trim().toUpperCase();
  return PROXY_COUNTRIES.some((row) => row.code === raw)
    ? (raw as ProxyCountryCode)
    : DEFAULT_PROXY_COUNTRY;
}

/** ProxyScrape public list — no key. Country-matched HTTPS/HTTP endpoints. */
export function proxyscrapeListUrl(country: unknown): string {
  const cc = parseProxyCountry(country);
  return `https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&protocol=http&country=${cc}&proxy_format=protocolipport&format=text&timeout=8000`;
}

export function parseProxyListLine(line: string): string | null {
  const raw = line.trim();
  if (!raw || raw.startsWith("#")) return null;
  if (/^https?:\/\//i.test(raw)) return parseHttpsProxy(raw);
  if (/^\d{1,3}(\.\d{1,3}){3}:\d{2,5}$/.test(raw)) return parseHttpsProxy(`http://${raw}`);
  return null;
}

export type LibraryBackend = "supabase" | "s3" | "local";

export function pickLibraryBackend(input: { hasSupabase: boolean; hasS3?: boolean }): LibraryBackend {
  if (input.hasSupabase) return "supabase";
  if (input.hasS3) return "s3";
  return "local";
}

export const LIBRARY_BUCKET = "clippy-library";
/** Windows drive letter for the bucket-backed network drive on the Social Machine. */
export const WINDOWS_LIBRARY_DRIVE = "Y:";
/** POSIX mountpoint for the bucket on a Linux Social Machine. */
export const LINUX_LIBRARY_MOUNT = "/home/daytona/library";
/** Bucket prefix the Social Machine writes finished clips/thumbnails into. */
export const MACHINE_DROP_PREFIX = "machine-drops";
export const DASHBOARD_WRITE_PREFIX = "library";
/** rclone remote name inside the generated config. */
export const BRIDGE_REMOTE_NAME = "clippy-bridge";

const RCLONE_WINDOWS_DIR = "C:\\Users\\Public\\ClippyOS\\rclone";
const RCLONE_URL = "https://downloads.rclone.org/rclone-current-windows-amd64.zip";

export function machineLibraryRoot(os: SocialMachineOs): string {
  return os === "windows" ? WINDOWS_LIBRARY_DRIVE : LINUX_LIBRARY_MOUNT;
}

/** Path on the machine's network drive for a dropped artifact (clip mp4, thumbnail png, …). */
export function machineDropPath(os: SocialMachineOs, name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return os === "windows"
    ? `${WINDOWS_LIBRARY_DRIVE}\\${MACHINE_DROP_PREFIX}\\${safe}`
    : `${LINUX_LIBRARY_MOUNT}/${MACHINE_DROP_PREFIX}/${safe}`;
}

/** Bucket-relative key matching machineDropPath — what the dashboard reads back. */
export function machineDropKey(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${MACHINE_DROP_PREFIX}/${safe}`;
}

/**
 * Idempotent PowerShell that mounts the S3 bridge bucket as a network drive.
 * Installs rclone on first boot, writes a scoped config, mounts, verifies.
 * Never echoes the secret; prints only machine-readable status tokens.
 */
export function windowsBucketMountScript(input: {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secret: string;
}): string {
  const q = escapePowerShellSingleQuoted;
  const conf = `${RCLONE_WINDOWS_DIR}\\rclone.conf`;
  const exe = `${RCLONE_WINDOWS_DIR}\\rclone.exe`;
  const confText = [
    `[${BRIDGE_REMOTE_NAME}]`,
    "type = s3",
    "provider = Other",
    `access_key_id = ${q(input.accessKey)}`,
    `secret_access_key = ${q(input.secret)}`,
    `endpoint = ${q(input.endpoint)}`,
    `region = ${q(input.region)}`,
    "acl = private",
    "",
  ].join("\n");
  return [
    "$ErrorActionPreference = 'Stop'",
    `if (Test-Path '${q(WINDOWS_LIBRARY_DRIVE)}\\') { Write-Output 'mount-present'; exit 0 }`,
    `New-Item -ItemType Directory -Force -Path '${q(RCLONE_WINDOWS_DIR)}' | Out-Null`,
    `if (-not (Test-Path '${q(exe)}')) {`,
    `  Invoke-WebRequest -Uri '${RCLONE_URL}' -OutFile '${q(RCLONE_WINDOWS_DIR)}\\rclone.zip' -UseBasicParsing`,
    `  Expand-Archive -Force -Path '${q(RCLONE_WINDOWS_DIR)}\\rclone.zip' -DestinationPath '${q(RCLONE_WINDOWS_DIR)}\\unzip'`,
    `  $exe2 = Get-ChildItem -Recurse -Filter rclone.exe '${q(RCLONE_WINDOWS_DIR)}\\unzip' | Select-Object -First 1`,
    `  Copy-Item $exe2.FullName '${q(exe)}'`,
    "}",
    `[IO.File]::WriteAllText('${q(conf)}', @'\n${confText}\n'@)`,
    `$p = Start-Process -FilePath '${q(exe)}' -ArgumentList 'mount','${BRIDGE_REMOTE_NAME}:','${q(WINDOWS_LIBRARY_DRIVE)}','--config','${q(conf)}','--vfs-cache-mode','writes','--network-mode','--log-file','${q(RCLONE_WINDOWS_DIR)}\\rclone.log','--daemon' -PassThru -WindowStyle Hidden`,
    "Start-Sleep -Seconds 6",
    `if (Test-Path '${q(WINDOWS_LIBRARY_DRIVE)}\\') { Write-Output 'mount-ok' } else { Write-Output 'mount-failed'; exit 1 }`,
  ].join("\n");
}

/** Linux twin of the Windows mount script (systemd-free, --daemon mode). */
export function linuxBucketMountScript(input: {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secret: string;
}): string {
  const confDir = "/home/daytona/.config/rclone";
  const conf = `${confDir}/rclone.conf`;
  const confText = [
    `[${BRIDGE_REMOTE_NAME}]`,
    "type = s3",
    "provider = Other",
    `access_key_id = ${input.accessKey.replace(/'/g, "'\\''")}`,
    `secret_access_key = ${input.secret.replace(/'/g, "'\\''")}`,
    `endpoint = ${input.endpoint.replace(/'/g, "'\\''")}`,
    `region = ${input.region.replace(/'/g, "'\\''")}`,
    "acl = private",
    "",
  ].join("\n");
  return [
    "set -e",
    `if mountpoint -q ${LINUX_LIBRARY_MOUNT} 2>/dev/null; then echo mount-present; exit 0; fi`,
    "mkdir -p /home/daytona/.config/rclone " + LINUX_LIBRARY_MOUNT,
    "command -v rclone >/dev/null 2>&1 || (curl -fsSL https://rclone.org/install.sh | bash) >/dev/null 2>&1",
    `cat > ${conf} <<'BRIDGE_EOF'\n${confText}BRIDGE_EOF`,
    "chmod 600 " + conf,
    `(rclone mount ${BRIDGE_REMOTE_NAME}: ${LINUX_LIBRARY_MOUNT} --config ${conf} --vfs-cache-mode writes --daemon >/dev/null 2>&1 || true)`,
    "sleep 4",
    `if mountpoint -q ${LINUX_LIBRARY_MOUNT} 2>/dev/null; then echo mount-ok; else echo mount-failed; exit 1; fi`,
  ].join("\n");
}

export function bucketMountScript(
  os: SocialMachineOs,
  input: { endpoint: string; region: string; bucket: string; accessKey: string; secret: string },
): string {
  return os === "windows" ? windowsBucketMountScript(input) : linuxBucketMountScript(input);
}

/** Cheap probe executed on the machine to confirm the bridge drive is live. */
export function verifyMachineMountCommand(os: SocialMachineOs): string {
  if (os === "windows") {
    return `powershell -NoProfile -Command "if (Test-Path '${escapePowerShellSingleQuoted(`${WINDOWS_LIBRARY_DRIVE}\\${MACHINE_DROP_PREFIX}`)}') { Write-Output 'bridge-ok' } else { Write-Output 'bridge-missing'; exit 1 }"`;
  }
  return `test -d ${LINUX_LIBRARY_MOUNT}/${MACHINE_DROP_PREFIX} && echo bridge-ok || { echo bridge-missing; exit 1; }`;
}

/** One-time bootstrap: create the drop prefix so verification has something to stat. */
export function ensureBridgeDirsCommand(os: SocialMachineOs): string {
  if (os === "windows") {
    return `powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '${escapePowerShellSingleQuoted(`${WINDOWS_LIBRARY_DRIVE}\\${MACHINE_DROP_PREFIX}`)}' | Out-Null; Write-Output 'dirs-ok'"`;
  }
  return `mkdir -p ${LINUX_LIBRARY_MOUNT}/${MACHINE_DROP_PREFIX} && echo dirs-ok`;
}

export function bridgeStatusNote(configured: boolean, mounted: boolean | null): string {
  if (!configured) {
    return "Bridge not configured. Set LIBRARY_S3_* settings so the Social Machine can mount the shared bucket.";
  }
  if (mounted === true) return "Shared bucket mounted on the Social Machine. Drop files in machine-drops/ and ingest them from Studio.";
  if (mounted === false) return "Shared bucket configured but not mounted on the machine yet. It attaches on next Start; or verify while running.";
  return "Shared bucket configured. Mount state unknown until the machine is running.";
}

export const FILEBASE_ENDPOINT = "https://s3.filebase.com";
export const DEFAULT_IPFS_GATEWAY = "https://ipfs.filebase.io/ipfs/";
export const PINATA_AUTH_URL = "https://api.pinata.cloud/data/testAuthentication";
export const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export const IPFS_PIN_STRATEGIES = ["eager", "on_publish", "replicate", "manual"] as const;
export type IpfsPinStrategy = (typeof IPFS_PIN_STRATEGIES)[number];
export const DEFAULT_IPFS_PIN_STRATEGY: IpfsPinStrategy = "eager";

export function parseIpfsPinStrategy(value: unknown): IpfsPinStrategy {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "on_publish" || raw === "on-publish") return "on_publish";
  if (raw === "replicate") return "replicate";
  if (raw === "manual") return "manual";
  return "eager";
}

export function ipfsStrategyNote(strategy: IpfsPinStrategy): string {
  if (strategy === "on_publish") {
    return "Pins a clip when it goes public — not on every ingest. Immutable cloud storage stays the write path.";
  }
  if (strategy === "replicate") {
    return "Pins to the content network after each write and keeps a second copy on object storage. Never the Social Machine disk.";
  }
  if (strategy === "manual") {
    return "Pins only when you ask. Clips still live in immutable cloud storage.";
  }
  return "Pins every new clip after it lands in immutable cloud storage. The Social Machine is never the write backend.";
}

export type IpfsConfig = {
  pinataJwt: string;
  gateway: string;
  strategy: IpfsPinStrategy;
};

export function parseIpfsConfig(input: {
  pinataJwt?: string | null;
  gateway?: string | null;
  strategy?: string | null;
}): IpfsConfig | null {
  const pinataJwt = String(input.pinataJwt ?? "").trim();
  if (pinataJwt.length < 20) return null;
  const gateway = parseIpfsGateway(input.gateway) ?? DEFAULT_IPFS_GATEWAY;
  return { pinataJwt, gateway, strategy: parseIpfsPinStrategy(input.strategy) };
}

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secret: string;
};

export function parseS3Config(input: {
  endpoint?: string | null;
  region?: string | null;
  bucket?: string | null;
  accessKey?: string | null;
  secret?: string | null;
}): S3Config | null {
  const endpoint = String(input.endpoint ?? "").trim() || FILEBASE_ENDPOINT;
  const region = String(input.region ?? "").trim() || "us-east-1";
  const bucket = String(input.bucket ?? "").trim();
  const accessKey = String(input.accessKey ?? "").trim();
  const secret = String(input.secret ?? "").trim();
  if (!bucket || !accessKey || !secret) return null;
  if (accessKey.length < 8 || secret.length < 8) return null;
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.hostname) return null;
  } catch {
    return null;
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(bucket)) return null;
  return { endpoint: endpoint.replace(/\/$/, ""), region, bucket, accessKey, secret };
}

export function libraryBackendNote(backend: LibraryBackend): string {
  if (backend === "supabase") {
    return "Clips live in immutable cloud storage. The Social Machine disk is only for browser profiles and hot snapshots — not the library.";
  }
  if (backend === "s3") {
    return "Clips live in immutable object storage. The Social Machine disk is only for browser profiles and hot snapshots — not the library.";
  }
  return "Preview is using local disk. Connect immutable cloud storage so library files survive deploys. Do not store clips on the Social Machine.";
}

export function parseCid(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 128) return null;
  if (/[\\/:\s]/.test(raw)) return null;
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(raw)) return raw;
  if (/^baf[a-z2-7]{20,}$/i.test(raw)) return raw.toLowerCase();
  return null;
}

export function parseIpfsGateway(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_IPFS_GATEWAY;
  if (/ClippyOS|C:\\|file:\/\//i.test(raw)) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.hostname) return null;
    let href = parsed.toString();
    if (!/\/ipfs\/?/i.test(href)) {
      href = `${href.replace(/\/$/, "")}/ipfs/`;
    }
    if (!href.endsWith("/")) href += "/";
    return href;
  } catch {
    return null;
  }
}

export function ipfsGatewayUrl(gateway: string, cid: string): string {
  const base = parseIpfsGateway(gateway);
  const safeCid = parseCid(cid);
  if (!base || !safeCid) throw new Error("VALIDATION");
  return `${base}${safeCid}`;
}

