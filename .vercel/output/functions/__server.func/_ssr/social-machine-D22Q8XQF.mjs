import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/social-machine-D22Q8XQF.js
var social_machine_D22Q8XQF_exports = /* @__PURE__ */ __exportAll({
	A: () => parseResidentialProxy,
	B: () => stopActionForOs,
	C: () => parseCid,
	D: () => parseIpfsPinStrategy,
	E: () => parseIpfsGateway,
	F: () => pickLibraryBackend,
	H: () => windowsLocaleScript,
	I: () => proxyscrapeListUrl,
	L: () => shouldResizeWindows,
	M: () => parseSocialMachineOs,
	N: () => parseSocialMachineRegion,
	O: () => parseProxyCountry,
	P: () => parseSocialMachineSize,
	R: () => snapshotCandidates,
	S: () => openUrlCommand,
	T: () => parseIpfsConfig,
	U: () => windowsProxyScript,
	V: () => uploadPath,
	_: () => instagramGeoWarning,
	a: () => DEFAULT_SOCIAL_TIMEZONE,
	b: () => listWindowsCommand,
	c: () => LIBRARY_BUCKET,
	d: () => PROXY_COUNTRIES,
	f: () => TARGET_WINDOWS_RESOURCES,
	g: () => idlePolicy,
	h: () => hibernatePlan,
	i: () => DEFAULT_SOCIAL_MACHINE_SIZE,
	j: () => parseS3Config,
	k: () => parseProxyListLine,
	l: () => PINATA_AUTH_URL,
	m: () => ensureUploadDirCommand,
	n: () => DEFAULT_IPFS_PIN_STRATEGY,
	o: () => FILEBASE_ENDPOINT,
	p: () => composeProxyUrl,
	r: () => DEFAULT_SOCIAL_LOCALE,
	s: () => HOT_SNAPSHOT_NAME,
	t: () => DEFAULT_IPFS_GATEWAY,
	u: () => PINATA_PIN_URL,
	v: () => ipfsStrategyNote,
	w: () => parseHttpsProxy,
	x: () => mapProviderState,
	y: () => isWindowsSnapshot,
	z: () => social_machine_exports
});
var social_machine_exports = /* @__PURE__ */ __exportAll$1({
	DEFAULT_IPFS_GATEWAY: () => DEFAULT_IPFS_GATEWAY,
	DEFAULT_IPFS_PIN_STRATEGY: () => DEFAULT_IPFS_PIN_STRATEGY,
	DEFAULT_PROXY_COUNTRY: () => "AU",
	DEFAULT_SOCIAL_LOCALE: () => DEFAULT_SOCIAL_LOCALE,
	DEFAULT_SOCIAL_MACHINE_OS: () => DEFAULT_SOCIAL_MACHINE_OS,
	DEFAULT_SOCIAL_MACHINE_REGION: () => "us",
	DEFAULT_SOCIAL_MACHINE_SIZE: () => DEFAULT_SOCIAL_MACHINE_SIZE,
	DEFAULT_SOCIAL_TIMEZONE: () => DEFAULT_SOCIAL_TIMEZONE,
	FILEBASE_ENDPOINT: () => FILEBASE_ENDPOINT,
	HOT_SNAPSHOT_NAME: () => HOT_SNAPSHOT_NAME,
	LIBRARY_BUCKET: () => LIBRARY_BUCKET,
	LINUX_UPLOAD_DIR: () => LINUX_UPLOAD_DIR,
	PINATA_AUTH_URL: () => PINATA_AUTH_URL,
	PINATA_PIN_URL: () => PINATA_PIN_URL,
	PROXY_COUNTRIES: () => PROXY_COUNTRIES,
	SOCIAL_VOLUME_NAME: () => SOCIAL_VOLUME_NAME,
	TARGET_WINDOWS_RESOURCES: () => TARGET_WINDOWS_RESOURCES,
	WINDOWS_GEO_ID: () => 12,
	WINDOWS_PROFILE_DIR: () => WINDOWS_PROFILE_DIR,
	WINDOWS_TIMEZONE_ID: () => WINDOWS_TIMEZONE_ID,
	WINDOWS_UPLOAD_DIR: () => WINDOWS_UPLOAD_DIR,
	composeProxyUrl: () => composeProxyUrl,
	ensureUploadDirCommand: () => ensureUploadDirCommand,
	escapePowerShellSingleQuoted: () => escapePowerShellSingleQuoted,
	hibernatePlan: () => hibernatePlan,
	idlePolicy: () => idlePolicy,
	instagramGeoWarning: () => instagramGeoWarning,
	ipfsStrategyNote: () => ipfsStrategyNote,
	isWindowsSnapshot: () => isWindowsSnapshot,
	libraryBackendNote: () => libraryBackendNote,
	listWindowsCommand: () => listWindowsCommand,
	mapProviderState: () => mapProviderState,
	openUrlCommand: () => openUrlCommand,
	parseCid: () => parseCid,
	parseHttpsProxy: () => parseHttpsProxy,
	parseIpfsConfig: () => parseIpfsConfig,
	parseIpfsGateway: () => parseIpfsGateway,
	parseIpfsPinStrategy: () => parseIpfsPinStrategy,
	parseProxyCountry: () => parseProxyCountry,
	parseProxyListLine: () => parseProxyListLine,
	parseResidentialProxy: () => parseResidentialProxy,
	parseS3Config: () => parseS3Config,
	parseSocialMachineOs: () => parseSocialMachineOs,
	parseSocialMachineRegion: () => parseSocialMachineRegion,
	parseSocialMachineSize: () => parseSocialMachineSize,
	pickLibraryBackend: () => pickLibraryBackend,
	proxyscrapeListUrl: () => proxyscrapeListUrl,
	shouldResizeWindows: () => shouldResizeWindows,
	snapshotCandidates: () => snapshotCandidates,
	snapshotForSize: () => snapshotForSize,
	stopActionForOs: () => stopActionForOs,
	uploadPath: () => uploadPath,
	windowsLocaleScript: () => windowsLocaleScript,
	windowsProxyScript: () => windowsProxyScript
});
var DEFAULT_SOCIAL_MACHINE_SIZE = "windows-large";
var DEFAULT_SOCIAL_TIMEZONE = "Australia/Sydney";
var DEFAULT_SOCIAL_LOCALE = "en-AU";
/** Windows tzutil id for AEST/AEDT (Sydney). */
var WINDOWS_TIMEZONE_ID = "AUS Eastern Standard Time";
/** Daytona's largest Windows snapshot. Hot-resize existing undersized VMs to this. */
var TARGET_WINDOWS_RESOURCES = {
	cpu: 4,
	memory: 16
};
var HOT_SNAPSHOT_NAME = "clippy-os-social-hot";
var WINDOWS_UPLOAD_DIR = "C:\\Users\\Public\\ClippyOS\\uploads";
var LINUX_UPLOAD_DIR = "/home/daytona/uploads";
var WINDOWS_PROFILE_DIR = "C:\\Users\\Public\\ClippyOS\\profiles";
function parseSocialMachineSize(value) {
	const raw = String(value ?? "").trim();
	if (raw === "windows-medium" || raw === "windows-small") return "windows-medium";
	return "windows-large";
}
function parseSocialMachineRegion(value) {
	return String(value ?? "").trim().toLowerCase() === "eu" ? "eu" : "us";
}
function parseSocialMachineOs(value) {
	return String(value ?? "").trim().toLowerCase() === "linux" ? "linux" : "windows";
}
function snapshotForSize(size) {
	return size;
}
function isWindowsSnapshot(snapshot) {
	return Boolean(snapshot && snapshot.toLowerCase().includes("windows"));
}
function snapshotCandidates(size, stored) {
	const names = [];
	const push = (value) => {
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
function shouldResizeWindows(cpu, memoryGiB) {
	if (cpu == null && memoryGiB == null) return false;
	if (cpu != null && cpu < TARGET_WINDOWS_RESOURCES.cpu) return true;
	if (memoryGiB != null && memoryGiB < TARGET_WINDOWS_RESOURCES.memory) return true;
	return false;
}
/** Pause (hot) instead of stop. Never auto-delete the Social Machine. */
function idlePolicy(idleMinutes) {
	return {
		autoStopInterval: 0,
		autoPauseInterval: Number.isFinite(idleMinutes) ? Math.min(240, Math.max(5, Math.floor(idleMinutes))) : 20,
		autoArchiveInterval: 0,
		autoDeleteInterval: -1
	};
}
function stopActionForOs(os) {
	return os === "windows" ? "pause" : "stop";
}
/** Pause is the hot snapshot (filesystem + memory). Named snapshot is taken while still running. */
function hibernatePlan() {
	return {
		primary: "pause",
		snapshotWhileRunning: true,
		snapshotAfterPause: false,
		neverDelete: true
	};
}
function mapProviderState(state) {
	const value = (state ?? "").toLowerCase();
	if (value === "started") return "running";
	if (value === "starting" || value === "restoring" || value === "creating" || value === "pending" || value === "building" || value === "pulling_snapshot" || value === "snapshotting") return "starting";
	if (value === "pausing") return "stopping";
	if (value === "paused" || value === "archived") return "paused";
	if (value === "stopping") return "stopping";
	if (value === "error" || value === "build_failed") return "error";
	return "stopped";
}
function escapePowerShellSingleQuoted(value) {
	return value.replace(/'/g, "''");
}
function openUrlCommand(os, url) {
	if (!/^https:\/\//i.test(url)) throw new Error("VALIDATION");
	if (os === "windows") return `powershell -NoProfile -Command "Start-Process '${escapePowerShellSingleQuoted(url)}'"`;
	const quoted = url.replace(/'/g, `'\\''`);
	return `xdg-open '${quoted}' >/dev/null 2>&1 || firefox '${quoted}' >/dev/null 2>&1 || google-chrome --no-sandbox '${quoted}' >/dev/null 2>&1 || true`;
}
function uploadPath(os, postId, ext) {
	const safeId = postId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
	const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
	if (os === "windows") return `${WINDOWS_UPLOAD_DIR}\\${safeId}${safeExt}`;
	return `${LINUX_UPLOAD_DIR}/${safeId}${safeExt}`;
}
function ensureUploadDirCommand(os) {
	if (os === "windows") return `powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '${escapePowerShellSingleQuoted(WINDOWS_UPLOAD_DIR)}' | Out-Null"`;
	return "mkdir -p /home/daytona/uploads";
}
function windowsLocaleScript() {
	return [`tzutil /s "${WINDOWS_TIMEZONE_ID}"`, `powershell -NoProfile -Command "try { Set-TimeZone -Id '${WINDOWS_TIMEZONE_ID}' } catch {}; try { Set-WinHomeLocation -GeoId 12 } catch {}; try { Set-WinSystemLocale -SystemLocale ${DEFAULT_SOCIAL_LOCALE} } catch {}; try { Set-Culture ${DEFAULT_SOCIAL_LOCALE} } catch {}; try { Set-WinUserLanguageList -LanguageList ${DEFAULT_SOCIAL_LOCALE} -Force } catch {}; try { Set-WinUILanguageOverride -Language ${DEFAULT_SOCIAL_LOCALE} } catch {}; New-Item -ItemType Directory -Force -Path '${escapePowerShellSingleQuoted(WINDOWS_UPLOAD_DIR)}','${escapePowerShellSingleQuoted(WINDOWS_PROFILE_DIR)}' | Out-Null"`].join(" & ");
}
function windowsProxyScript(proxyUrl) {
	const parsed = parseHttpsProxy(proxyUrl);
	if (!parsed) return null;
	const url = new URL(parsed);
	const safeHost = escapePowerShellSingleQuoted(`${url.hostname}:${url.port || (url.protocol === "https:" ? "443" : "80")}`);
	const safeFull = escapePowerShellSingleQuoted(parsed);
	return `powershell -NoProfile -Command "try { netsh winhttp set proxy '${safeHost}' } catch {}; try { Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 1 } catch {}; try { Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -Value '${safeHost}' } catch {}; [Environment]::SetEnvironmentVariable('HTTPS_PROXY','${safeFull}','User'); [Environment]::SetEnvironmentVariable('HTTP_PROXY','${safeFull}','User'); Write-Output 'proxy-applied'"`;
}
function listWindowsCommand(os) {
	if (os === "windows") return `powershell -NoProfile -Command "$w = Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object -First 30 Id,MainWindowTitle; $w | ForEach-Object { [pscustomobject]@{ id = [string]$_.Id; title = $_.MainWindowTitle } } | ConvertTo-Json -Compress"`;
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
function instagramGeoWarning(region) {
	return `Daytona has no Australia region (only ${region.toUpperCase()}). Instagram often challenges logins from US/EU datacenter IPs even when the Windows clock is Australia/Sydney. Prefer Instagram Graph API in Settings, or set a residential AU HTTPS proxy.`;
}
function parseHttpsProxy(value) {
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
function parseResidentialProxy(input) {
	const pasted = String(input.url ?? "").trim();
	if (pasted) try {
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
			password: parsed.password ? decodeURIComponent(parsed.password) : null
		};
	} catch {
		return null;
	}
	const host = String(input.host ?? "").trim().toLowerCase();
	if (!host || host.length > 253 || /[\s/\\]/.test(host)) return null;
	if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
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
		password: username ? passwordRaw : null
	};
}
function composeProxyUrl(proxy) {
	const auth = proxy.username ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password ?? "")}@` : "";
	return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
}
var PROXY_COUNTRIES = [
	{
		code: "AU",
		name: "Australia"
	},
	{
		code: "NZ",
		name: "New Zealand"
	},
	{
		code: "US",
		name: "United States"
	},
	{
		code: "GB",
		name: "United Kingdom"
	},
	{
		code: "CA",
		name: "Canada"
	},
	{
		code: "SG",
		name: "Singapore"
	},
	{
		code: "JP",
		name: "Japan"
	},
	{
		code: "DE",
		name: "Germany"
	},
	{
		code: "IN",
		name: "India"
	},
	{
		code: "BR",
		name: "Brazil"
	}
];
function parseProxyCountry(value) {
	const raw = String(value ?? "").trim().toUpperCase();
	return PROXY_COUNTRIES.some((row) => row.code === raw) ? raw : "AU";
}
/** ProxyScrape public list — no key. Country-matched HTTPS/HTTP endpoints. */
function proxyscrapeListUrl(country) {
	return `https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&protocol=http&country=${parseProxyCountry(country)}&proxy_format=protocolipport&format=text&timeout=8000`;
}
function parseProxyListLine(line) {
	const raw = line.trim();
	if (!raw || raw.startsWith("#")) return null;
	if (/^https?:\/\//i.test(raw)) return parseHttpsProxy(raw);
	if (/^\d{1,3}(\.\d{1,3}){3}:\d{2,5}$/.test(raw)) return parseHttpsProxy(`http://${raw}`);
	return null;
}
function pickLibraryBackend(input) {
	if (input.hasSupabase) return "supabase";
	if (input.hasS3) return "s3";
	return "local";
}
var LIBRARY_BUCKET = "clippy-library";
var FILEBASE_ENDPOINT = "https://s3.filebase.com";
var DEFAULT_IPFS_GATEWAY = "https://ipfs.filebase.io/ipfs/";
var PINATA_AUTH_URL = "https://api.pinata.cloud/data/testAuthentication";
var PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
var DEFAULT_IPFS_PIN_STRATEGY = "eager";
function parseIpfsPinStrategy(value) {
	const raw = String(value ?? "").trim().toLowerCase();
	if (raw === "on_publish" || raw === "on-publish") return "on_publish";
	if (raw === "replicate") return "replicate";
	if (raw === "manual") return "manual";
	return "eager";
}
function ipfsStrategyNote(strategy) {
	if (strategy === "on_publish") return "Pins a clip when it goes public — not on every ingest. Immutable cloud storage stays the write path.";
	if (strategy === "replicate") return "Pins to the content network after each write and keeps a second copy on object storage. Never the Social Machine disk.";
	if (strategy === "manual") return "Pins only when you ask. Clips still live in immutable cloud storage.";
	return "Pins every new clip after it lands in immutable cloud storage. The Social Machine is never the write backend.";
}
function parseIpfsConfig(input) {
	const pinataJwt = String(input.pinataJwt ?? "").trim();
	if (pinataJwt.length < 20) return null;
	return {
		pinataJwt,
		gateway: parseIpfsGateway(input.gateway) ?? "https://ipfs.filebase.io/ipfs/",
		strategy: parseIpfsPinStrategy(input.strategy)
	};
}
function parseS3Config(input) {
	const endpoint = String(input.endpoint ?? "").trim() || "https://s3.filebase.com";
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
	return {
		endpoint: endpoint.replace(/\/$/, ""),
		region,
		bucket,
		accessKey,
		secret
	};
}
function libraryBackendNote(backend) {
	if (backend === "supabase") return "Clips live in immutable cloud storage. The Social Machine disk is only for browser profiles and hot snapshots — not the library.";
	if (backend === "s3") return "Clips live in immutable object storage. The Social Machine disk is only for browser profiles and hot snapshots — not the library.";
	return "Preview is using local disk. Connect immutable cloud storage so library files survive deploys. Do not store clips on the Social Machine.";
}
function parseCid(value) {
	const raw = String(value ?? "").trim();
	if (!raw || raw.length > 128) return null;
	if (/[\\/:\s]/.test(raw)) return null;
	if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(raw)) return raw;
	if (/^baf[a-z2-7]{20,}$/i.test(raw)) return raw.toLowerCase();
	return null;
}
function parseIpfsGateway(value) {
	const raw = String(value ?? "").trim();
	if (!raw) return DEFAULT_IPFS_GATEWAY;
	if (/ClippyOS|C:\\|file:\/\//i.test(raw)) return null;
	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
		if (!parsed.hostname) return null;
		let href = parsed.toString();
		if (!/\/ipfs\/?/i.test(href)) href = `${href.replace(/\/$/, "")}/ipfs/`;
		if (!href.endsWith("/")) href += "/";
		return href;
	} catch {
		return null;
	}
}
//#endregion
export { parseS3Config as A, uploadPath as B, parseHttpsProxy as C, parseProxyCountry as D, parseIpfsPinStrategy as E, proxyscrapeListUrl as F, windowsProxyScript as H, shouldResizeWindows as I, snapshotCandidates as L, parseSocialMachineRegion as M, parseSocialMachineSize as N, parseProxyListLine as O, pickLibraryBackend as P, social_machine_D22Q8XQF_exports as R, parseCid as S, parseIpfsGateway as T, windowsLocaleScript as V, ipfsStrategyNote as _, FILEBASE_ENDPOINT as a, mapProviderState as b, PINATA_AUTH_URL as c, TARGET_WINDOWS_RESOURCES as d, composeProxyUrl as f, instagramGeoWarning as g, idlePolicy as h, DEFAULT_SOCIAL_TIMEZONE as i, parseSocialMachineOs as j, parseResidentialProxy as k, PINATA_PIN_URL as l, hibernatePlan as m, DEFAULT_SOCIAL_LOCALE as n, HOT_SNAPSHOT_NAME as o, ensureUploadDirCommand as p, DEFAULT_SOCIAL_MACHINE_SIZE as r, LIBRARY_BUCKET as s, DEFAULT_IPFS_GATEWAY as t, PROXY_COUNTRIES as u, isWindowsSnapshot as v, parseIpfsConfig as w, openUrlCommand as x, listWindowsCommand as y, stopActionForOs as z };
