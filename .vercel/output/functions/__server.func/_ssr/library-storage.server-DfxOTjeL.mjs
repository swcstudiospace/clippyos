import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { A as parseS3Config, E as parseIpfsPinStrategy, P as pickLibraryBackend, S as parseCid, T as parseIpfsGateway, _ as ipfsStrategyNote, c as PINATA_AUTH_URL, l as PINATA_PIN_URL, s as LIBRARY_BUCKET, w as parseIpfsConfig } from "./social-machine-D22Q8XQF.mjs";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/library-storage.server-DfxOTjeL.js
var library_storage_server_DfxOTjeL_exports = /* @__PURE__ */ __exportAll({
	a: () => library_storage_server_exports,
	c: () => signVersionUrl,
	d: () => writeLibraryBytes,
	i: () => kindFromMime,
	l: () => sniffMime,
	n: () => extFromMime,
	o: () => makeStorageKey,
	r: () => hashBytes,
	s: () => readLibraryBytes,
	t: () => deleteLibraryBytes,
	u: () => verifyLibraryToken
});
var library_storage_server_exports = /* @__PURE__ */ __exportAll$1({
	deleteLibraryBytes: () => deleteLibraryBytes,
	ensureLibraryDir: () => ensureLibraryDir,
	extFromMime: () => extFromMime,
	hashBytes: () => hashBytes,
	kindFromMime: () => kindFromMime,
	libraryBackend: () => libraryBackend,
	loadIpfsConfig: () => loadIpfsConfig,
	loadS3Config: () => loadS3Config,
	makeStorageKey: () => makeStorageKey,
	persistIpfsSettings: () => persistIpfsSettings,
	persistS3Settings: () => persistS3Settings,
	pinLibraryBytes: () => pinLibraryBytes,
	pinMediaUrlOnPublish: () => pinMediaUrlOnPublish,
	publicIpfsStatus: () => publicIpfsStatus,
	publicS3Status: () => publicS3Status,
	readLibraryBytes: () => readLibraryBytes,
	signVersionUrl: () => signVersionUrl,
	sniffMime: () => sniffMime,
	storagePath: () => storagePath,
	testPinataConnection: () => testPinataConnection,
	tokenFromLibraryUrl: () => tokenFromLibraryUrl,
	verifyLibraryToken: () => verifyLibraryToken,
	writeLibraryBytes: () => writeLibraryBytes
});
var S3_ENDPOINT_KEY = "LIBRARY_S3_ENDPOINT";
var S3_REGION_KEY = "LIBRARY_S3_REGION";
var S3_BUCKET_KEY = "LIBRARY_S3_BUCKET";
var S3_ACCESS_KEY = "LIBRARY_S3_ACCESS_KEY";
var S3_SECRET_KEY = "LIBRARY_S3_SECRET";
async function loadS3Config() {
	const endpoint = (await readAppSetting(S3_ENDPOINT_KEY))?.trim() || process.env.LIBRARY_S3_ENDPOINT?.trim();
	const region = (await readAppSetting(S3_REGION_KEY))?.trim() || process.env.LIBRARY_S3_REGION?.trim();
	const bucket = (await readAppSetting(S3_BUCKET_KEY))?.trim() || process.env.LIBRARY_S3_BUCKET?.trim();
	const accessKey = (await readAppSetting(S3_ACCESS_KEY))?.trim() || process.env.LIBRARY_S3_ACCESS_KEY?.trim();
	const secret = (await readAppSetting(S3_SECRET_KEY))?.trim() || process.env.LIBRARY_S3_SECRET?.trim();
	return parseS3Config({
		endpoint,
		region,
		bucket,
		accessKey,
		secret
	});
}
async function persistS3Settings(values) {
	if (values.endpoint !== void 0) await writeAppSetting(S3_ENDPOINT_KEY, values.endpoint.trim());
	if (values.region !== void 0) await writeAppSetting(S3_REGION_KEY, values.region.trim() || "us-east-1");
	if (values.bucket !== void 0) await writeAppSetting(S3_BUCKET_KEY, values.bucket.trim());
	if (values.accessKey?.trim()) await writeAppSetting(S3_ACCESS_KEY, values.accessKey.trim());
	if (values.secret?.trim()) await writeAppSetting(S3_SECRET_KEY, values.secret.trim());
}
var IPFS_JWT_KEY = "LIBRARY_PINATA_JWT";
var IPFS_GATEWAY_KEY = "LIBRARY_IPFS_GATEWAY";
var IPFS_LAST_CID_KEY = "LIBRARY_IPFS_LAST_CID";
var IPFS_STRATEGY_KEY = "LIBRARY_IPFS_STRATEGY";
async function loadIpfsConfig() {
	const pinataJwt = (await readAppSetting(IPFS_JWT_KEY))?.trim() || process.env.PINATA_JWT?.trim() || "";
	const gateway = (await readAppSetting(IPFS_GATEWAY_KEY))?.trim() || process.env.LIBRARY_IPFS_GATEWAY?.trim() || "https://ipfs.filebase.io/ipfs/";
	const strategy = parseIpfsPinStrategy(await readAppSetting(IPFS_STRATEGY_KEY));
	return parseIpfsConfig({
		pinataJwt,
		gateway,
		strategy
	});
}
async function persistIpfsSettings(values) {
	if (values.pinataJwt?.trim()) await writeAppSetting(IPFS_JWT_KEY, values.pinataJwt.trim());
	if (values.gateway !== void 0) {
		const gateway = parseIpfsGateway(values.gateway);
		if (values.gateway.trim() && !gateway) throw new Error("VALIDATION");
		await writeAppSetting(IPFS_GATEWAY_KEY, gateway ?? "https://ipfs.filebase.io/ipfs/");
	}
	if (values.strategy !== void 0) await writeAppSetting(IPFS_STRATEGY_KEY, parseIpfsPinStrategy(values.strategy));
}
async function publicIpfsStatus() {
	const config = await loadIpfsConfig();
	const lastCid = parseCid(await readAppSetting(IPFS_LAST_CID_KEY));
	const strategy = config?.strategy ?? parseIpfsPinStrategy(await readAppSetting(IPFS_STRATEGY_KEY)) ?? "eager";
	return {
		configured: Boolean(config),
		gateway: config?.gateway ?? parseIpfsGateway(await readAppSetting(IPFS_GATEWAY_KEY)),
		lastCid,
		strategy,
		strategyHint: ipfsStrategyNote(strategy)
	};
}
async function testPinataConnection() {
	const config = await loadIpfsConfig();
	if (!config) throw new Error("IPFS_UNAVAILABLE");
	const response = await fetch(PINATA_AUTH_URL, {
		headers: { Authorization: `Bearer ${config.pinataJwt}` },
		signal: AbortSignal.timeout(12e3)
	});
	if (response.status === 401 || response.status === 403) throw new Error("IPFS_UNAVAILABLE");
	if (!response.ok) throw new Error("IPFS_UNAVAILABLE");
	return { ok: true };
}
/** Best-effort pin. Never the write backend. Never the Windows VM. */
async function pinLibraryBytes(key, bytes) {
	const config = await loadIpfsConfig();
	if (!config) return null;
	try {
		const form = new FormData();
		const safeName = key.replace(/[^a-zA-Z0-9._/-]/g, "_").slice(0, 80) || "clip.bin";
		form.append("file", new Blob([new Uint8Array(bytes)]), safeName);
		form.append("pinataMetadata", JSON.stringify({ name: `clippyos/${safeName}` }));
		const response = await fetch(PINATA_PIN_URL, {
			method: "POST",
			headers: { Authorization: `Bearer ${config.pinataJwt}` },
			body: form,
			signal: AbortSignal.timeout(3e4)
		});
		if (!response.ok) return null;
		const body = await response.json();
		const cid = parseCid(body.IpfsHash);
		if (cid) await writeAppSetting(IPFS_LAST_CID_KEY, cid);
		return cid;
	} catch {
		return null;
	}
}
async function maybePinAfterWrite(key, bytes) {
	const config = await loadIpfsConfig();
	if (!config) return;
	if (config.strategy === "manual" || config.strategy === "on_publish") return;
	pinLibraryBytes(key, bytes);
}
/** Best-effort pin when a library clip goes public. Eager already pinned on write. */
async function pinMediaUrlOnPublish(mediaUrl) {
	if (!mediaUrl) return;
	const config = await loadIpfsConfig();
	if (!config || config.strategy !== "on_publish") return;
	try {
		const token = tokenFromLibraryUrl(mediaUrl);
		if (!token) return;
		const verified = await verifyLibraryToken(token);
		if (!verified) return;
		const { getVersionRow } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
		const version = await getVersionRow(verified.versionId);
		if (!version) return;
		const bytes = await readLibraryBytes(version.storageKey);
		await pinLibraryBytes(version.storageKey, bytes);
	} catch {}
}
async function publicS3Status() {
	const config = await loadS3Config();
	if (!config) return {
		configured: false,
		bucket: null,
		endpoint: null
	};
	return {
		configured: true,
		bucket: config.bucket,
		endpoint: config.endpoint
	};
}
var ROOT = process.env.AGENCY_LIBRARY_ROOT?.trim() || "/tmp/agency-library";
var TOKEN_TTL_SEC = 900;
var BACKEND_KEY = "LIBRARY_BACKEND";
function storagePath(key) {
	const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/\.\./g, "_");
	return join(ROOT, safe);
}
async function ensureLibraryDir() {
	await mkdir(ROOT, { recursive: true });
}
async function signingSecret() {
	const existing = (await readAppSetting("LIBRARY_SIGNING_SECRET"))?.trim();
	if (existing) return existing;
	const next = randomBytes(32).toString("hex");
	await writeAppSetting("LIBRARY_SIGNING_SECRET", next);
	return next;
}
async function storageClient() {
	const { tryCreateAdminClient } = await import("./clients.server-54cTCuV1.mjs");
	return tryCreateAdminClient();
}
var bucketReady = null;
async function ensureLibraryBucket() {
	if (bucketReady) return bucketReady;
	bucketReady = (async () => {
		const client = await storageClient();
		if (!client) return false;
		const { error } = await client.storage.createBucket(LIBRARY_BUCKET, {
			public: false,
			fileSizeLimit: "512MB"
		});
		if (error && !/exists|already/i.test(error.message ?? "")) {
			const listed = await client.storage.listBuckets();
			return Boolean(listed.data?.some((row) => row.name === LIBRARY_BUCKET));
		}
		return true;
	})();
	return bucketReady;
}
async function libraryBackend() {
	const stored = (await readAppSetting(BACKEND_KEY))?.trim();
	if (stored === "supabase" || stored === "local") return stored;
	if (stored === "s3" && await loadS3Config()) return "s3";
	const client = await storageClient();
	const s3 = await loadS3Config();
	return pickLibraryBackend({
		hasSupabase: Boolean(client),
		hasS3: Boolean(s3)
	});
}
function makeStorageKey(assetId, versionId, ext) {
	return `${assetId}/${versionId}.${ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin"}`;
}
async function writeLibraryBytes(key, bytes) {
	const client = await storageClient();
	if (client && await ensureLibraryBucket()) {
		const { error } = await client.storage.from(LIBRARY_BUCKET).upload(key, bytes, {
			upsert: true,
			contentType: "application/octet-stream"
		});
		if (!error) {
			await writeAppSetting(BACKEND_KEY, "supabase");
			maybePinAfterWrite(key, bytes);
			return `supabase:${key}`;
		}
	}
	const s3 = await loadS3Config();
	if (s3) try {
		const { s3Put } = await import("./s3.server-DyS0K5ZV.mjs");
		await s3Put(s3, key, bytes);
		await writeAppSetting(BACKEND_KEY, "s3");
		maybePinAfterWrite(key, bytes);
		return `s3:${key}`;
	} catch {}
	await ensureLibraryDir();
	const path = storagePath(key);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, bytes);
	await writeAppSetting(BACKEND_KEY, "local");
	return path;
}
async function readLibraryBytes(key) {
	const storageKey = key.replace(/^(supabase|s3):/, "");
	const client = await storageClient();
	if (client) {
		const { data, error } = await client.storage.from(LIBRARY_BUCKET).download(storageKey);
		if (!error && data) return Buffer.from(await data.arrayBuffer());
	}
	const s3 = await loadS3Config();
	if (s3) try {
		const { s3Get } = await import("./s3.server-DyS0K5ZV.mjs");
		const bytes = await s3Get(s3, storageKey);
		if (bytes) return bytes;
	} catch {}
	return readFile(storagePath(storageKey));
}
async function deleteLibraryBytes(key) {
	const storageKey = key.replace(/^(supabase|s3):/, "");
	const client = await storageClient();
	if (client) try {
		await client.storage.from(LIBRARY_BUCKET).remove([storageKey]);
	} catch {}
	const s3 = await loadS3Config();
	if (s3) try {
		const { s3Delete } = await import("./s3.server-DyS0K5ZV.mjs");
		await s3Delete(s3, storageKey);
	} catch {}
	try {
		await unlink(storagePath(storageKey));
	} catch {}
}
async function hashBytes(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}
async function signVersionUrl(versionId, ttlSec = TOKEN_TTL_SEC) {
	const exp = Math.floor(Date.now() / 1e3) + ttlSec;
	const secret = await signingSecret();
	const payload = `${versionId}.${exp}`;
	const sig = createHmac("sha256", secret).update(payload).digest("hex");
	return `/api/library/file?t=${Buffer.from(`${payload}.${sig}`).toString("base64url")}`;
}
function tokenFromLibraryUrl(url) {
	try {
		if (url.startsWith("/api/library/file")) return new URL(url, "https://library.local").searchParams.get("t");
		const parsed = new URL(url);
		if (parsed.pathname === "/api/library/file") return parsed.searchParams.get("t");
		return null;
	} catch {
		return null;
	}
}
async function verifyLibraryToken(token) {
	try {
		const parts = Buffer.from(token, "base64url").toString("utf8").split(".");
		if (parts.length !== 3) return null;
		const [versionId, expRaw, sig] = parts;
		const exp = Number(expRaw);
		if (!versionId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1e3)) return null;
		const secret = await signingSecret();
		const expected = createHmac("sha256", secret).update(`${versionId}.${exp}`).digest("hex");
		if (expected.length !== sig.length) return null;
		let ok = 0;
		for (let i = 0; i < expected.length; i += 1) ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
		if (ok !== 0) return null;
		return { versionId };
	} catch {
		return null;
	}
}
function extFromMime(mime, filename) {
	const fromName = filename?.split(".").pop()?.toLowerCase();
	if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
	if (mime.includes("mp4")) return "mp4";
	if (mime.includes("quicktime")) return "mov";
	if (mime.includes("webm")) return "webm";
	if (mime.includes("png")) return "png";
	if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
	if (mime.includes("webp")) return "webp";
	if (mime.includes("gif")) return "gif";
	if (mime.includes("wav")) return "wav";
	if (mime.includes("mpeg") && mime.includes("audio")) return "mp3";
	if (mime.includes("srt")) return "srt";
	if (mime.includes("vtt")) return "vtt";
	return "bin";
}
function kindFromMime(mime) {
	if (mime.startsWith("video/")) return "VIDEO";
	if (mime.startsWith("image/")) return "IMAGE";
	if (mime.startsWith("audio/")) return "AUDIO";
	if (mime.includes("srt") || mime.includes("vtt") || mime === "text/vtt") return "SUBTITLE";
	return "OTHER";
}
function sniffMime(bytes, fallback, filename) {
	if (bytes.length >= 12) {
		if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return "image/png";
		if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
		if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return "image/gif";
		if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
		if (bytes.slice(4, 8).toString("ascii") === "ftyp") return "video/mp4";
		if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WAVE") return "audio/wav";
		if (bytes.slice(0, 3).toString("ascii") === "ID3" || bytes[0] === 255 && (bytes[1] & 224) === 224) return "audio/mpeg";
	}
	const name = filename?.toLowerCase() ?? "";
	if (name.endsWith(".srt")) return "application/x-subrip";
	if (name.endsWith(".vtt")) return "text/vtt";
	if (name.endsWith(".mp4")) return "video/mp4";
	if (name.endsWith(".mov")) return "video/quicktime";
	if (name.endsWith(".webm")) return "video/webm";
	if (name.endsWith(".png")) return "image/png";
	if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
	if (fallback && fallback !== "application/octet-stream") return fallback;
	return "application/octet-stream";
}
//#endregion
export { library_storage_server_DfxOTjeL_exports as a, signVersionUrl as c, writeLibraryBytes as d, kindFromMime as i, sniffMime as l, extFromMime as n, makeStorageKey as o, hashBytes as r, readLibraryBytes as s, deleteLibraryBytes as t, verifyLibraryToken as u };
