import { o as __toESM, r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as writeAppSetting, n as deleteAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { B as uploadPath, C as parseHttpsProxy, D as parseProxyCountry, F as proxyscrapeListUrl, H as windowsProxyScript, I as shouldResizeWindows, L as snapshotCandidates, M as parseSocialMachineRegion, N as parseSocialMachineSize, O as parseProxyListLine, V as windowsLocaleScript, b as mapProviderState, d as TARGET_WINDOWS_RESOURCES, f as composeProxyUrl, g as instagramGeoWarning, h as idlePolicy, i as DEFAULT_SOCIAL_TIMEZONE, j as parseSocialMachineOs, k as parseResidentialProxy, m as hibernatePlan, n as DEFAULT_SOCIAL_LOCALE, o as HOT_SNAPSHOT_NAME, p as ensureUploadDirCommand, r as DEFAULT_SOCIAL_MACHINE_SIZE, v as isWindowsSnapshot, x as openUrlCommand, y as listWindowsCommand, z as stopActionForOs } from "./social-machine-D22Q8XQF.mjs";
import { a as SOCIAL_LABELS, i as PLATFORM_UPLOAD_URL, m as parseDisplaySize, n as PLATFORM_HOME_URL, o as SOCIAL_NOVNC_PORT } from "./social-CmuIUyLc.mjs";
import { t as Daytona } from "../_libs/@daytona/sdk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/daytona.server-Ccwltk3g.js
var daytona_server_Ccwltk3g_exports = /* @__PURE__ */ __exportAll({
	a: () => listSocialWindows,
	c: () => sanitizeDaytonaError,
	d: () => stopSocialMachine,
	f: () => takeSocialScreenshot,
	i: () => getSocialMachineStatus,
	l: () => setSocialAutoStopMinutes,
	n: () => ensureComputerUseStack,
	o: () => loadDaytonaConfig,
	p: () => transferAndOpenUpload,
	r: () => getRunningSocialSandbox,
	s: () => openPlatformInMachine,
	t: () => daytona_server_exports,
	u: () => startSocialMachine
});
/**
* Daytona Social Machine — on-demand only.
*
* Importing this module, reading status, and Test Connection MUST NEVER start
* a sandbox. Start / Stop are explicit operator actions.
*/
var daytona_server_exports = /* @__PURE__ */ __exportAll$1({
	disconnectDaytona: () => disconnectDaytona,
	ensureComputerUseStack: () => ensureComputerUseStack,
	getRunningSocialSandbox: () => getRunningSocialSandbox,
	getSocialMachineStatus: () => getSocialMachineStatus,
	listSocialWindows: () => listSocialWindows,
	loadDaytonaApiKey: () => loadDaytonaApiKey,
	loadDaytonaConfig: () => loadDaytonaConfig,
	openPlatformInMachine: () => openPlatformInMachine,
	persistDaytonaSettings: () => persistDaytonaSettings,
	provisionLocationProxy: () => provisionLocationProxy,
	refreshDesktopPreview: () => refreshDesktopPreview,
	sanitizeDaytonaError: () => sanitizeDaytonaError,
	setSocialAutoStopMinutes: () => setSocialAutoStopMinutes,
	startSocialMachine: () => startSocialMachine,
	stopSocialMachine: () => stopSocialMachine,
	takeSocialScreenshot: () => takeSocialScreenshot,
	testDaytonaConnection: () => testDaytonaConnection,
	testResidentialProxy: () => testResidentialProxy,
	transferAndOpenUpload: () => transferAndOpenUpload
});
var KEY = "DAYTONA_API_KEY";
var URL_KEY = "DAYTONA_API_URL";
var TARGET_KEY = "DAYTONA_TARGET";
var SANDBOX_KEY = "DAYTONA_SOCIAL_SANDBOX_ID";
var AUTO_STOP_KEY = "DAYTONA_AUTO_STOP_MINUTES";
var STARTED_AT_KEY = "DAYTONA_SOCIAL_STARTED_AT";
var STOPPED_AT_KEY = "DAYTONA_SOCIAL_STOPPED_AT";
var PREVIEW_KEY = "DAYTONA_SOCIAL_PREVIEW_URL";
var PREVIEW_EXPIRES_KEY = "DAYTONA_SOCIAL_PREVIEW_EXPIRES_AT";
var SCREEN_KEY = "DAYTONA_SOCIAL_LAST_SCREENSHOT";
var LAST_ERROR_KEY = "DAYTONA_SOCIAL_LAST_ERROR";
var DISPLAY_KEY = "DAYTONA_SOCIAL_DISPLAY";
var SIZE_KEY = "DAYTONA_SOCIAL_SIZE";
var SNAPSHOT_KEY = "DAYTONA_SOCIAL_SNAPSHOT_NAME";
var OS_KEY = "DAYTONA_SOCIAL_OS";
var PROXY_KEY = "DAYTONA_OUTBOUND_PROXY";
var PROXY_COUNTRY_KEY = "DAYTONA_PROXY_COUNTRY";
var LOCALE_APPLIED_KEY = "DAYTONA_SOCIAL_LOCALE_APPLIED";
var SIGNED_PREVIEW_TTL_SECONDS = 3600;
var REMINT_IF_REMAINING_MS = 6e5;
var PATH_NOTE = "Social Machine opens X, YouTube, Instagram, and TikTok from inside ClippyOS. Hibernate keeps the session hot. Clips stay in immutable cloud storage — never on this machine.";
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
function sanitizeDaytonaError(message) {
	return message.replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 180);
}
async function loadDaytonaApiKey() {
	const env = process.env.DAYTONA_API_KEY?.trim() || "";
	if (env && !looksRedacted(env)) return env;
	const stored = (await readAppSetting(KEY))?.trim() || "";
	if (stored && !looksRedacted(stored)) return stored;
	return null;
}
async function loadDaytonaConfig() {
	const apiKey = await loadDaytonaApiKey();
	if (!apiKey) return null;
	const apiUrl = (await readAppSetting(URL_KEY))?.trim() || process.env.DAYTONA_API_URL?.trim() || "https://app.daytona.io/api";
	const target = (await readAppSetting(TARGET_KEY))?.trim() || process.env.DAYTONA_TARGET?.trim() || "";
	const minutesRaw = (await readAppSetting(AUTO_STOP_KEY))?.trim() || "";
	const parsed = Number.parseInt(minutesRaw, 10);
	const autoStopMinutes = Number.isFinite(parsed) && parsed >= 5 && parsed <= 240 ? parsed : 20;
	const size = parseSocialMachineSize(await readAppSetting(SIZE_KEY));
	const proxyUrl = parseHttpsProxy(await readAppSetting(PROXY_KEY));
	return {
		apiKey,
		apiUrl: apiUrl || "https://app.daytona.io/api",
		target: target || null,
		autoStopMinutes,
		size,
		proxyUrl
	};
}
function createClient(config) {
	return new Daytona({
		apiKey: config.apiKey,
		apiUrl: config.apiUrl,
		...config.target ? { target: config.target } : {},
		useDeprecatedPolling: true,
		requestTimeoutMs: 2e4
	});
}
function mapSandboxState(state) {
	return mapProviderState(state);
}
async function withTimeout(promise, ms, label) {
	let timer;
	try {
		return await Promise.race([promise, new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`${label} timed out`)), ms);
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
async function collectLabeled(daytona) {
	const items = [];
	const labelSets = [{ ...SOCIAL_LABELS }, {
		app: "clippy-admin",
		purpose: "social"
	}];
	for (const labels of labelSets) {
		try {
			const iter = daytona.list({
				labels,
				limit: 10
			});
			await withTimeout((async () => {
				for await (const sandbox of iter) {
					items.push(sandbox);
					if (items.length >= 10) break;
				}
			})(), 12e3, "Daytona list");
		} catch {}
		if (items.length) break;
	}
	return items;
}
async function findSocialSandbox(daytona, storedId) {
	if (storedId) try {
		return await daytona.get(storedId);
	} catch {}
	try {
		return (await collectLabeled(daytona))[0] ?? null;
	} catch {
		return null;
	}
}
function isSignedPreviewUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.searchParams.has("token")) return false;
		return /^\d+-[A-Za-z0-9]/.test(parsed.hostname);
	} catch {
		return false;
	}
}
function withSkipWarning(url) {
	try {
		const parsed = new URL(url);
		if (!parsed.searchParams.has("X-Daytona-Skip-Preview-Warning")) parsed.searchParams.set("X-Daytona-Skip-Preview-Warning", "true");
		return parsed.toString();
	} catch {
		return url;
	}
}
async function cachePreview(url, expiresAt) {
	if (url) {
		await writeAppSetting(PREVIEW_KEY, url);
		if (expiresAt) await writeAppSetting(PREVIEW_EXPIRES_KEY, expiresAt);
	} else {
		await deleteAppSetting(PREVIEW_KEY);
		await deleteAppSetting(PREVIEW_EXPIRES_KEY);
	}
}
async function mintSignedPreview(sandbox) {
	const signed = await withTimeout(sandbox.getSignedPreviewUrl(SOCIAL_NOVNC_PORT, SIGNED_PREVIEW_TTL_SECONDS), 12e3, "Daytona signed preview");
	if (!signed?.url) return null;
	const url = withSkipWarning(signed.url);
	const expiresAt = new Date(Date.now() + SIGNED_PREVIEW_TTL_SECONDS * 1e3).toISOString();
	await cachePreview(url, expiresAt);
	return {
		url,
		expiresAt
	};
}
async function ensureSignedPreview(sandbox, cachedUrl, cachedExpiresAt) {
	const remaining = cachedExpiresAt ? Date.parse(cachedExpiresAt) - Date.now() : 0;
	if (Boolean(cachedUrl) && isSignedPreviewUrl(cachedUrl ?? "") && Number.isFinite(remaining) && remaining > REMINT_IF_REMAINING_MS) return {
		url: cachedUrl,
		expiresAt: cachedExpiresAt
	};
	try {
		const minted = await mintSignedPreview(sandbox);
		if (minted) return minted;
	} catch {}
	if (cachedUrl && isSignedPreviewUrl(cachedUrl) && remaining > 0) return {
		url: cachedUrl,
		expiresAt: cachedExpiresAt
	};
	return {
		url: null,
		expiresAt: null
	};
}
async function cacheScreenshot(dataUrl) {
	if (dataUrl && dataUrl.length < 45e4) await writeAppSetting(SCREEN_KEY, dataUrl);
}
async function cacheDisplaySize(size) {
	if (size && size.width >= 320 && size.height >= 240) await writeAppSetting(DISPLAY_KEY, `${Math.round(size.width)}x${Math.round(size.height)}`);
}
async function readCachedDisplay() {
	return parseDisplaySize((await readAppSetting(DISPLAY_KEY))?.trim() || null);
}
function numberField(value) {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
function sizeFromUnknown(value) {
	if (!value || typeof value !== "object") return null;
	const rec = value;
	const width = numberField(rec.width);
	const height = numberField(rec.height);
	if (width == null || height == null || width < 320 || height < 240) return null;
	if (width > 7680 || height > 4320) return null;
	return {
		width: Math.round(width),
		height: Math.round(height)
	};
}
/**
* Best-effort VM framebuffer size. Never starts Computer Use or the sandbox.
*/
async function readDisplaySize(sandbox) {
	try {
		const info = await withTimeout(sandbox.computerUse.display.getInfo(), 5e3, "display info");
		const size = sizeFromUnknown(info.primary_display) ?? sizeFromUnknown(info.primaryDisplay) ?? sizeFromUnknown(info);
		if (size) {
			await cacheDisplaySize(size);
			return size;
		}
	} catch {}
	return readCachedDisplay();
}
function toDataUrl(screenshot) {
	if (!screenshot) return null;
	if (screenshot.startsWith("data:image/")) return screenshot;
	return `data:image/png;base64,${screenshot}`;
}
function emptyStatus(partial) {
	return {
		state: "not_configured",
		configured: false,
		sandboxId: null,
		autoStopMinutes: 20,
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
		...partial
	};
}
function sandboxLooksWindows(sandbox) {
	const labels = sandbox.labels ?? {};
	if (String(labels.os ?? "").toLowerCase() === "windows") return true;
	return isWindowsSnapshot(sandbox.snapshot);
}
async function resolveOs(sandbox) {
	if (sandbox && sandboxLooksWindows(sandbox)) return "windows";
	const stored = parseSocialMachineOs(await readAppSetting(OS_KEY));
	if (sandbox && !sandboxLooksWindows(sandbox)) return "linux";
	return stored;
}
async function captureHotSnapshot(sandbox) {
	if (!hibernatePlan().snapshotWhileRunning) return null;
	const names = [HOT_SNAPSHOT_NAME, `${HOT_SNAPSHOT_NAME}-${Date.now()}`];
	for (const name of names) try {
		await sandbox.createSnapshot(name, 90);
		await writeAppSetting(SNAPSHOT_KEY, name);
		return name;
	} catch {}
	return null;
}
async function applyIdleIntervals(sandbox, minutes) {
	const policy = idlePolicy(minutes);
	try {
		await sandbox.setAutostopInterval(policy.autoStopInterval);
	} catch {}
	try {
		await sandbox.setAutoPauseInterval(policy.autoPauseInterval);
	} catch {}
	try {
		await sandbox.setAutoDeleteInterval(policy.autoDeleteInterval);
	} catch {}
}
async function applyWindowsProxy(sandbox, proxyUrl) {
	if (!proxyUrl) return;
	try {
		await sandbox.updateNetworkSettings({ outboundProxyUrl: proxyUrl });
	} catch {}
	const script = windowsProxyScript(proxyUrl);
	if (!script) return;
	try {
		await sandbox.process.executeCommand(script, void 0, void 0, 40);
	} catch {}
}
async function maybeResizeWindows(sandbox) {
	if (!shouldResizeWindows(sandbox.cpu, sandbox.memory)) return;
	try {
		await sandbox.resize({
			cpu: TARGET_WINDOWS_RESOURCES.cpu,
			memory: TARGET_WINDOWS_RESOURCES.memory
		}, 120);
	} catch {}
}
async function applyWindowsDesktop(sandbox) {
	if ((await readAppSetting(LOCALE_APPLIED_KEY))?.trim() === sandbox.id) {
		try {
			await sandbox.process.executeCommand(windowsLocaleScript(), void 0, void 0, 40);
		} catch {}
		return;
	}
	try {
		await sandbox.process.executeCommand(windowsLocaleScript(), void 0, void 0, 45);
		await writeAppSetting(LOCALE_APPLIED_KEY, sandbox.id);
	} catch (error) {
		const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Couldn’t apply Australia locale on the desktop.");
		if (!((await readAppSetting(LAST_ERROR_KEY))?.trim() || "")) await writeAppSetting(LAST_ERROR_KEY, message);
	}
}
async function createWindowsSandbox(daytona, config) {
	const region = parseSocialMachineRegion(config.target);
	const policy = idlePolicy(config.autoStopMinutes);
	const storedSnap = (await readAppSetting(SNAPSHOT_KEY))?.trim() || "";
	const candidates = snapshotCandidates(config.size, storedSnap);
	let lastError = null;
	for (const snapshot of candidates) try {
		const sandbox = await daytona.create({
			name: "clippy-os-social",
			snapshot,
			labels: {
				...SOCIAL_LABELS,
				os: "windows",
				region
			},
			autoStopInterval: policy.autoStopInterval,
			autoPauseInterval: policy.autoPauseInterval,
			autoArchiveInterval: policy.autoArchiveInterval,
			autoDeleteInterval: policy.autoDeleteInterval,
			public: false,
			envVars: {
				TZ: DEFAULT_SOCIAL_TIMEZONE,
				LANG: "en_AU.UTF-8",
				LC_ALL: "en_AU.UTF-8",
				CLIPPY_LOCALE: DEFAULT_SOCIAL_LOCALE
			},
			...config.proxyUrl ? { outboundProxyUrl: config.proxyUrl } : {}
		}, { timeout: 240 });
		await writeAppSetting(OS_KEY, "windows");
		await writeAppSetting(SIZE_KEY, config.size);
		return sandbox;
	} catch (error) {
		lastError = error;
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("Couldn’t create the Windows Social Machine.");
}
/**
* Status probe only. Lists or gets the labeled sandbox. Never calls start().
*/
async function getSocialMachineStatus() {
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
		proxyConfigured: Boolean(config?.proxyUrl)
	};
	if (!config) return emptyStatus({
		lastError,
		lastScreenshot,
		stoppedAt,
		...extras,
		proxyConfigured: false
	});
	const storedId = (await readAppSetting(SANDBOX_KEY))?.trim() || null;
	const cachedPreview = (await readAppSetting(PREVIEW_KEY))?.trim() || null;
	const cachedExpires = (await readAppSetting(PREVIEW_EXPIRES_KEY))?.trim() || null;
	if (!storedId) return emptyStatus({
		state: "stopped",
		configured: true,
		autoStopMinutes: config.autoStopMinutes,
		lastScreenshot,
		stoppedAt,
		...extras
	});
	try {
		const daytona = createClient(config);
		let sandbox = null;
		try {
			sandbox = await withTimeout(daytona.get(storedId), 1e4, "Daytona get");
		} catch {
			sandbox = null;
		}
		if (!sandbox) return emptyStatus({
			state: snapshotName ? "paused" : "stopped",
			configured: true,
			sandboxId: storedId,
			autoStopMinutes: config.autoStopMinutes,
			lastScreenshot,
			lastError: "Saved machine id could not be reached. Start to resume the hot snapshot.",
			stoppedAt,
			...extras
		});
		if (sandbox.id && sandbox.id !== storedId) await writeAppSetting(SANDBOX_KEY, sandbox.id);
		const state = mapSandboxState(sandbox.state);
		const os = await resolveOs(sandbox);
		const runningMs = state === "running" && startedAt ? Math.max(0, Date.now() - Date.parse(startedAt)) : null;
		let previewUrl = null;
		let previewExpiresAt = null;
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
			longRunning: runningMs != null && runningMs >= 72e5,
			previewUrl,
			previewExpiresAt,
			lastScreenshot,
			lastError: state === "error" ? sandbox.errorReason ?? lastError : lastError,
			computerUse: state === "running",
			displayWidth: display?.width ?? null,
			displayHeight: display?.height ?? null,
			...extras,
			os,
			snapshotName: sandbox.snapshot ?? extras.snapshotName
		});
	} catch (error) {
		const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Couldn’t reach Daytona.");
		return emptyStatus({
			state: "error",
			configured: true,
			sandboxId: storedId,
			autoStopMinutes: config.autoStopMinutes,
			lastError: message,
			lastScreenshot,
			stoppedAt,
			...extras
		});
	}
}
/**
* Auth probe only. Lists sandboxes. Never starts a VM.
*/
async function testDaytonaConnection() {
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const daytona = createClient(config);
	let count = 0;
	const iter = daytona.list({ limit: 5 });
	await withTimeout((async () => {
		for await (const _sandbox of iter) {
			count += 1;
			if (count >= 5) break;
		}
	})(), 12e3, "Daytona test");
	return {
		ok: true,
		count
	};
}
/**
* Probe a residential HTTPS proxy through undici. Never starts a VM.
*/
async function testResidentialProxy(overrideUrl) {
	const stored = parseHttpsProxy(await readAppSetting(PROXY_KEY));
	const proxyUrl = parseHttpsProxy(overrideUrl) ?? stored;
	if (!proxyUrl) throw new Error("PROXY_MISSING");
	const { ProxyAgent, fetch: undiciFetch } = await import("../_libs/undici.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const response = await undiciFetch("https://api.ipify.org?format=json", {
		dispatcher: new ProxyAgent(proxyUrl),
		signal: AbortSignal.timeout(12e3)
	});
	if (!response.ok) throw new Error("PROXY_UNAVAILABLE");
	const body = await response.json();
	return {
		ok: true,
		egressIp: typeof body.ip === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(body.ip) ? body.ip : null
	};
}
/**
* Pull a country-matched public HTTPS/HTTP proxy (ProxyScrape, no key) and
* keep the first one that can reach the internet. Never starts a VM.
*/
async function provisionLocationProxy(countryRaw) {
	const country = parseProxyCountry(countryRaw ?? await readAppSetting(PROXY_COUNTRY_KEY) ?? "AU");
	const response = await fetch(proxyscrapeListUrl(country), { signal: AbortSignal.timeout(12e3) });
	if (!response.ok) throw new Error("PROXY_UNAVAILABLE");
	const candidates = (await response.text()).split(/\r?\n/).map(parseProxyListLine).filter((row) => Boolean(row)).slice(0, 12);
	if (candidates.length === 0) throw new Error("PROXY_UNAVAILABLE");
	let lastError = null;
	for (const url of candidates) try {
		const probed = await testResidentialProxy(url);
		await writeAppSetting(PROXY_KEY, url);
		await writeAppSetting(PROXY_COUNTRY_KEY, country);
		const host = new URL(url).hostname;
		return {
			ok: true,
			country,
			egressIp: probed.egressIp,
			host
		};
	} catch (error) {
		lastError = error;
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("PROXY_UNAVAILABLE");
}
async function startSocialMachine() {
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const daytona = createClient(config);
	const storedId = (await readAppSetting(SANDBOX_KEY))?.trim() || null;
	let sandbox = null;
	try {
		sandbox = await findSocialSandbox(daytona, storedId);
	} catch {
		sandbox = null;
	}
	try {
		if (sandbox && !sandboxLooksWindows(sandbox)) {
			try {
				await sandbox.stop(60).catch(() => void 0);
			} catch {}
			sandbox = null;
		}
		if (!sandbox) sandbox = await createWindowsSandbox(daytona, config);
		else {
			const state = mapSandboxState(sandbox.state);
			if (state !== "running" && state !== "starting") await sandbox.start(180);
		}
		await writeAppSetting(SANDBOX_KEY, sandbox.id);
		await writeAppSetting(STARTED_AT_KEY, (/* @__PURE__ */ new Date()).toISOString());
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
			const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Desktop stack didn’t start.");
			await writeAppSetting(LAST_ERROR_KEY, message);
		}
		let previewUrl = null;
		let previewExpiresAt = null;
		try {
			const minted = await mintSignedPreview(sandbox);
			previewUrl = minted?.url ?? null;
			previewExpiresAt = minted?.expiresAt ?? null;
		} catch (error) {
			await cachePreview(null);
			const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Desktop preview URL couldn’t be signed.");
			if (!((await readAppSetting(LAST_ERROR_KEY))?.trim() || "")) await writeAppSetting(LAST_ERROR_KEY, message);
		}
		let display = await readCachedDisplay();
		if (computerUse) display = await readDisplaySize(sandbox) ?? display;
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
			snapshotName: sandbox.snapshot ?? await readAppSetting(SNAPSHOT_KEY),
			geoWarning: instagramGeoWarning(parseSocialMachineRegion(config.target)),
			proxyConfigured: Boolean(config.proxyUrl)
		});
	} catch (error) {
		const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Couldn’t start the Social Machine.");
		await writeAppSetting(LAST_ERROR_KEY, message);
		throw new Error(message);
	}
}
async function stopSocialMachine() {
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await findSocialSandbox(createClient(config), (await readAppSetting(SANDBOX_KEY))?.trim() || null).catch(() => null);
	if (sandbox) {
		const os = await resolveOs(sandbox);
		try {
			await sandbox.computerUse.stop().catch(() => void 0);
		} catch {}
		if (stopActionForOs(os) === "pause") {
			if (hibernatePlan().snapshotWhileRunning && mapSandboxState(sandbox.state) === "running") await captureHotSnapshot(sandbox);
			try {
				await sandbox.pause(120);
			} catch {
				await sandbox.stop(120);
			}
		} else await sandbox.stop(120);
	}
	await writeAppSetting(STOPPED_AT_KEY, (/* @__PURE__ */ new Date()).toISOString());
	await deleteAppSetting(STARTED_AT_KEY);
	await cachePreview(null);
	await deleteAppSetting(LAST_ERROR_KEY);
	return getSocialMachineStatus();
}
async function refreshDesktopPreview() {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await createClient(config).get(status.sandboxId);
	let previewUrl = status.previewUrl;
	let previewExpiresAt = status.previewExpiresAt;
	try {
		const minted = await mintSignedPreview(sandbox);
		previewUrl = minted?.url ?? previewUrl;
		previewExpiresAt = minted?.expiresAt ?? previewExpiresAt;
	} catch {}
	let screenshot = null;
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
	return {
		previewUrl,
		screenshot
	};
}
async function openPlatformInMachine(platform) {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await createClient(config).get(status.sandboxId);
	const os = await resolveOs(sandbox);
	const url = PLATFORM_HOME_URL[platform];
	await sandbox.process.executeCommand(openUrlCommand(os, url), void 0, void 0, 20);
}
async function transferAndOpenUpload(input) {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await createClient(config).get(status.sandboxId);
	try {
		await sandbox.computerUse.start();
	} catch {}
	let transferred = false;
	const os = await resolveOs(sandbox);
	if (input.mediaUrl) try {
		const buffer = await fetchMediaBuffer(input.mediaUrl);
		if (buffer) {
			const ext = guessExt(input.mediaUrl);
			const remote = uploadPath(os, input.postId, ext);
			await sandbox.process.executeCommand(ensureUploadDirCommand(os), void 0, void 0, 15);
			await sandbox.fs.uploadFile(buffer, remote);
			transferred = true;
		}
	} catch {
		transferred = false;
	}
	const url = PLATFORM_UPLOAD_URL[input.platform];
	await sandbox.process.executeCommand(openUrlCommand(os, url), void 0, void 0, 20);
	if (input.caption) try {
		await new Promise((resolve) => setTimeout(resolve, 1800));
		await sandbox.computerUse.keyboard.type(input.caption.slice(0, 400));
	} catch {}
	let screenshot = null;
	try {
		screenshot = toDataUrl((await sandbox.computerUse.screenshot.takeFullScreen()).screenshot);
		await cacheScreenshot(screenshot);
	} catch {
		screenshot = (await readAppSetting(SCREEN_KEY))?.trim() || null;
	}
	return {
		screenshot,
		reason: transferred ? "Media is in the Social Machine. Finish login, CAPTCHA, or publish in the desktop view." : "Opened the platform upload page. Confirm login and attach the file in the desktop view."
	};
}
async function fetchMediaBuffer(url) {
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
	const response = await fetch(url, { signal: AbortSignal.timeout(2e4) });
	if (!response.ok) return null;
	const bytes = await response.arrayBuffer();
	if (bytes.byteLength === 0 || bytes.byteLength > 4e7) return null;
	return Buffer.from(bytes);
}
function guessExt(url) {
	const lower = url.toLowerCase();
	if (lower.includes(".mp4") || lower.includes("video")) return ".mp4";
	if (lower.includes(".webm")) return ".webm";
	if (lower.includes(".jpg") || lower.includes("jpeg")) return ".jpg";
	if (lower.includes(".webp")) return ".webp";
	return ".png";
}
async function setSocialAutoStopMinutes(minutes) {
	if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) throw new Error("AUTO_STOP_INVALID");
	const rounded = Math.floor(minutes);
	await writeAppSetting(AUTO_STOP_KEY, String(rounded));
	const status = await getSocialMachineStatus();
	if ((status.state === "running" || status.state === "paused") && status.sandboxId) {
		const config = await loadDaytonaConfig();
		if (config) try {
			await applyIdleIntervals(await createClient(config).get(status.sandboxId), rounded);
		} catch {}
	}
	return getSocialMachineStatus();
}
async function ensureComputerUseStack() {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await createClient(config).get(status.sandboxId);
	try {
		await sandbox.computerUse.start();
		return { computerUse: true };
	} catch (error) {
		const message = sanitizeDaytonaError(error instanceof Error ? error.message : "Desktop stack didn’t start.");
		await writeAppSetting(LAST_ERROR_KEY, message);
		throw new Error("COMPUTER_USE_UNAVAILABLE");
	}
}
async function takeSocialScreenshot() {
	const refreshed = await refreshDesktopPreview();
	return {
		screenshotRef: "social-desktop-latest",
		capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
		mimeType: "image/png",
		dataUrl: refreshed.screenshot && refreshed.screenshot.length < 25e4 ? refreshed.screenshot : null
	};
}
async function listSocialWindows() {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	const sandbox = await createClient(config).get(status.sandboxId);
	const os = await resolveOs(sandbox);
	try {
		const result = await sandbox.process.executeCommand(listWindowsCommand(os), void 0, void 0, 15);
		const raw = String(result.result ?? result.output ?? "").trim();
		const parsed = JSON.parse(raw || "[]");
		const windows = (Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : []).filter((row) => Boolean(row && typeof row === "object")).map((row) => ({
			id: String(row.id ?? "").slice(0, 40),
			title: String(row.title ?? row.MainWindowTitle ?? "").slice(0, 120)
		})).filter((row) => row.id);
		return {
			windows,
			note: windows.length ? "best-effort" : "No windows reported from the desktop."
		};
	} catch {
		return {
			windows: [],
			note: "Window list is best-effort and unavailable on this desktop."
		};
	}
}
async function getRunningSocialSandbox() {
	const status = await getSocialMachineStatus();
	if (status.state !== "running" || !status.sandboxId) throw new Error("MACHINE_STOPPED");
	const config = await loadDaytonaConfig();
	if (!config) throw new Error("DAYTONA_UNAVAILABLE");
	return {
		sandbox: await createClient(config).get(status.sandboxId),
		id: status.sandboxId
	};
}
async function persistDaytonaSettings(values) {
	const key = (values.apiKey ?? "").trim();
	if (key) {
		if (key.length < 12) throw new Error("KEY_TOO_SHORT");
		await writeAppSetting(KEY, key);
	}
	const url = (values.apiUrl ?? "").trim();
	await writeAppSetting(URL_KEY, url || "https://app.daytona.io/api");
	const target = parseSocialMachineRegion(values.target);
	await writeAppSetting(TARGET_KEY, target);
	const minutesRaw = (values.autoStopMinutes ?? "").trim();
	if (minutesRaw) {
		const parsed = Number.parseInt(minutesRaw, 10);
		if (!Number.isFinite(parsed) || parsed < 5 || parsed > 240) throw new Error("AUTO_STOP_INVALID");
		await writeAppSetting(AUTO_STOP_KEY, String(parsed));
	} else await writeAppSetting(AUTO_STOP_KEY, String(20));
	if (values.size !== void 0) await writeAppSetting(SIZE_KEY, parseSocialMachineSize(values.size));
	if (values.proxyUrl !== void 0 || values.proxyHost !== void 0 || values.proxyPort !== void 0 || values.proxyUsername !== void 0 || values.proxyPassword !== void 0 || values.proxyProtocol !== void 0) {
		const structured = parseResidentialProxy({
			url: values.proxyUrl,
			host: values.proxyHost,
			port: values.proxyPort,
			username: values.proxyUsername,
			password: values.proxyPassword,
			protocol: values.proxyProtocol
		});
		const composed = structured ? composeProxyUrl(structured) : parseHttpsProxy(values.proxyUrl);
		if (Boolean(String(values.proxyUrl ?? "").trim() || String(values.proxyHost ?? "").trim() || String(values.proxyPort ?? "").trim()) && !composed) throw new Error("VALIDATION");
		if (composed) await writeAppSetting(PROXY_KEY, composed);
		else await deleteAppSetting(PROXY_KEY);
	}
	if (values.proxyCountry !== void 0) await writeAppSetting(PROXY_COUNTRY_KEY, parseProxyCountry(values.proxyCountry));
}
async function disconnectDaytona() {
	await deleteAppSetting(KEY);
	await deleteAppSetting(URL_KEY);
	await deleteAppSetting(TARGET_KEY);
	await deleteAppSetting(STARTED_AT_KEY);
	await cachePreview(null);
	await deleteAppSetting(LAST_ERROR_KEY);
}
//#endregion
export { listSocialWindows as a, sanitizeDaytonaError as c, stopSocialMachine as d, takeSocialScreenshot as f, getSocialMachineStatus as i, setSocialAutoStopMinutes as l, ensureComputerUseStack as n, loadDaytonaConfig as o, transferAndOpenUpload as p, getRunningSocialSandbox as r, openPlatformInMachine as s, daytona_server_Ccwltk3g_exports as t, startSocialMachine as u };
