import { createHash, createHmac, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { LIBRARY_BUCKET, pickLibraryBackend, parseS3Config, parseIpfsConfig, parseCid, parseIpfsGateway, parseIpfsPinStrategy, ipfsStrategyNote, DEFAULT_IPFS_GATEWAY, DEFAULT_IPFS_PIN_STRATEGY, PINATA_AUTH_URL, PINATA_PIN_URL, type LibraryBackend, type S3Config, type IpfsConfig, type IpfsPinStrategy } from "@/lib/social-machine";

const S3_ENDPOINT_KEY = "LIBRARY_S3_ENDPOINT";
const S3_REGION_KEY = "LIBRARY_S3_REGION";
const S3_BUCKET_KEY = "LIBRARY_S3_BUCKET";
const S3_ACCESS_KEY = "LIBRARY_S3_ACCESS_KEY";
const S3_SECRET_KEY = "LIBRARY_S3_SECRET";

export async function loadS3Config(): Promise<S3Config | null> {
  const endpoint = (await readAppSetting(S3_ENDPOINT_KEY))?.trim() || process.env.LIBRARY_S3_ENDPOINT?.trim();
  const region = (await readAppSetting(S3_REGION_KEY))?.trim() || process.env.LIBRARY_S3_REGION?.trim();
  const bucket = (await readAppSetting(S3_BUCKET_KEY))?.trim() || process.env.LIBRARY_S3_BUCKET?.trim();
  const accessKey = (await readAppSetting(S3_ACCESS_KEY))?.trim() || process.env.LIBRARY_S3_ACCESS_KEY?.trim();
  const secret = (await readAppSetting(S3_SECRET_KEY))?.trim() || process.env.LIBRARY_S3_SECRET?.trim();
  return parseS3Config({ endpoint, region, bucket, accessKey, secret });
}

export async function persistS3Settings(values: {
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKey?: string;
  secret?: string;
}): Promise<void> {
  if (values.endpoint !== undefined) await writeAppSetting(S3_ENDPOINT_KEY, values.endpoint.trim());
  if (values.region !== undefined) await writeAppSetting(S3_REGION_KEY, values.region.trim() || "us-east-1");
  if (values.bucket !== undefined) await writeAppSetting(S3_BUCKET_KEY, values.bucket.trim());
  if (values.accessKey?.trim()) await writeAppSetting(S3_ACCESS_KEY, values.accessKey.trim());
  if (values.secret?.trim()) await writeAppSetting(S3_SECRET_KEY, values.secret.trim());
}

const IPFS_JWT_KEY = "LIBRARY_PINATA_JWT";
const IPFS_GATEWAY_KEY = "LIBRARY_IPFS_GATEWAY";
const IPFS_LAST_CID_KEY = "LIBRARY_IPFS_LAST_CID";
const IPFS_STRATEGY_KEY = "LIBRARY_IPFS_STRATEGY";

export async function loadIpfsConfig(): Promise<IpfsConfig | null> {
  const pinataJwt =
    (await readAppSetting(IPFS_JWT_KEY))?.trim() || process.env.PINATA_JWT?.trim() || "";
  const gateway =
    (await readAppSetting(IPFS_GATEWAY_KEY))?.trim() ||
    process.env.LIBRARY_IPFS_GATEWAY?.trim() ||
    DEFAULT_IPFS_GATEWAY;
  const strategy = parseIpfsPinStrategy(await readAppSetting(IPFS_STRATEGY_KEY));
  return parseIpfsConfig({ pinataJwt, gateway, strategy });
}

export async function persistIpfsSettings(values: {
  pinataJwt?: string;
  gateway?: string;
  strategy?: string;
}): Promise<void> {
  if (values.pinataJwt?.trim()) await writeAppSetting(IPFS_JWT_KEY, values.pinataJwt.trim());
  if (values.gateway !== undefined) {
    const gateway = parseIpfsGateway(values.gateway);
    if (values.gateway.trim() && !gateway) throw new Error("VALIDATION");
    await writeAppSetting(IPFS_GATEWAY_KEY, gateway ?? DEFAULT_IPFS_GATEWAY);
  }
  if (values.strategy !== undefined) {
    await writeAppSetting(IPFS_STRATEGY_KEY, parseIpfsPinStrategy(values.strategy));
  }
}

export async function publicIpfsStatus(): Promise<{
  configured: boolean;
  gateway: string | null;
  lastCid: string | null;
  strategy: IpfsPinStrategy;
  strategyHint: string;
}> {
  const config = await loadIpfsConfig();
  const lastCid = parseCid(await readAppSetting(IPFS_LAST_CID_KEY));
  const strategy = config?.strategy ?? parseIpfsPinStrategy(await readAppSetting(IPFS_STRATEGY_KEY)) ?? DEFAULT_IPFS_PIN_STRATEGY;
  return {
    configured: Boolean(config),
    gateway: config?.gateway ?? parseIpfsGateway(await readAppSetting(IPFS_GATEWAY_KEY)),
    lastCid,
    strategy,
    strategyHint: ipfsStrategyNote(strategy),
  };
}

export async function testPinataConnection(): Promise<{ ok: true }> {
  const config = await loadIpfsConfig();
  if (!config) throw new Error("IPFS_UNAVAILABLE");
  const response = await fetch(PINATA_AUTH_URL, {
    headers: { Authorization: `Bearer ${config.pinataJwt}` },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 401 || response.status === 403) throw new Error("IPFS_UNAVAILABLE");
  if (!response.ok) throw new Error("IPFS_UNAVAILABLE");
  return { ok: true };
}

/** Best-effort pin. Never the write backend. Never the Windows VM. */
export async function pinLibraryBytes(key: string, bytes: Buffer): Promise<string | null> {
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
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { IpfsHash?: string };
    const cid = parseCid(body.IpfsHash);
    if (cid) await writeAppSetting(IPFS_LAST_CID_KEY, cid);
    return cid;
  } catch {
    return null;
  }
}

async function maybePinAfterWrite(key: string, bytes: Buffer): Promise<void> {
  const config = await loadIpfsConfig();
  if (!config) return;
  if (config.strategy === "manual" || config.strategy === "on_publish") return;
  void pinLibraryBytes(key, bytes);
}

export async function pinOnPublish(key: string, bytes: Buffer): Promise<string | null> {
  const config = await loadIpfsConfig();
  if (!config) return null;
  if (config.strategy !== "on_publish" && config.strategy !== "replicate" && config.strategy !== "eager") {
    return null;
  }
  return pinLibraryBytes(key, bytes);
}

/** Best-effort pin when a library clip goes public. Eager already pinned on write. */
export async function pinMediaUrlOnPublish(mediaUrl: string | null | undefined): Promise<void> {
  if (!mediaUrl) return;
  const config = await loadIpfsConfig();
  if (!config || config.strategy !== "on_publish") return;
  try {
    const token = tokenFromLibraryUrl(mediaUrl);
    if (!token) return;
    const verified = await verifyLibraryToken(token);
    if (!verified) return;
    const { getVersionRow } = await import("@/lib/server/library.server");
    const version = await getVersionRow(verified.versionId);
    if (!version) return;
    const bytes = await readLibraryBytes(version.storageKey);
    await pinLibraryBytes(version.storageKey, bytes);
  } catch {
    /* pin is never the write path */
  }
}

export async function publicS3Status(): Promise<{ configured: boolean; bucket: string | null; endpoint: string | null }> {
  const config = await loadS3Config();
  if (!config) return { configured: false, bucket: null, endpoint: null };
  return { configured: true, bucket: config.bucket, endpoint: config.endpoint };
}

const ROOT = process.env.AGENCY_LIBRARY_ROOT?.trim() || "/tmp/agency-library";
const TOKEN_TTL_SEC = 15 * 60;
const BACKEND_KEY = "LIBRARY_BACKEND";

export function libraryRoot(): string {
  return ROOT;
}

export function storagePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/\.\./g, "_");
  return join(ROOT, safe);
}

export async function ensureLibraryDir(): Promise<void> {
  await mkdir(ROOT, { recursive: true });
}

async function signingSecret(): Promise<string> {
  const existing = (await readAppSetting("LIBRARY_SIGNING_SECRET"))?.trim();
  if (existing) return existing;
  const next = randomBytes(32).toString("hex");
  await writeAppSetting("LIBRARY_SIGNING_SECRET", next);
  return next;
}

async function storageClient() {
  const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
  return tryCreateAdminClient();
}

let bucketReady: Promise<boolean> | null = null;

async function ensureLibraryBucket(): Promise<boolean> {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const client = await storageClient();
    if (!client) return false;
    const { error } = await client.storage.createBucket(LIBRARY_BUCKET, {
      public: false,
      fileSizeLimit: "512MB",
    });
    if (error && !/exists|already/i.test(error.message ?? "")) {
      const listed = await client.storage.listBuckets();
      return Boolean(listed.data?.some((row) => row.name === LIBRARY_BUCKET));
    }
    return true;
  })();
  return bucketReady;
}

export async function libraryBackend(): Promise<LibraryBackend> {
  const stored = (await readAppSetting(BACKEND_KEY))?.trim();
  if (stored === "supabase" || stored === "local") return stored;
  if (stored === "s3" && (await loadS3Config())) return "s3";
  const client = await storageClient();
  const s3 = await loadS3Config();
  return pickLibraryBackend({ hasSupabase: Boolean(client), hasS3: Boolean(s3) });
}

export function makeStorageKey(assetId: string, versionId: string, ext: string): string {
  const clean = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  return `${assetId}/${versionId}.${clean}`;
}

export async function writeLibraryBytes(key: string, bytes: Buffer): Promise<string> {
  const client = await storageClient();
  if (client && (await ensureLibraryBucket())) {
    const { error } = await client.storage.from(LIBRARY_BUCKET).upload(key, bytes, {
      upsert: true,
      contentType: "application/octet-stream",
    });
    if (!error) {
      await writeAppSetting(BACKEND_KEY, "supabase");
      void maybePinAfterWrite(key, bytes);
      return `supabase:${key}`;
    }
  }
  const s3 = await loadS3Config();
  if (s3) {
    try {
      const { s3Put } = await import("@/lib/server/s3.server");
      await s3Put(s3, key, bytes);
      await writeAppSetting(BACKEND_KEY, "s3");
      void maybePinAfterWrite(key, bytes);
      return `s3:${key}`;
    } catch {
      /* fall through to local preview disk */
    }
  }
  await ensureLibraryDir();
  const path = storagePath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  await writeAppSetting(BACKEND_KEY, "local");
  return path;
}

export async function readLibraryBytes(key: string): Promise<Buffer> {
  const storageKey = key.replace(/^(supabase|s3):/, "");
  const client = await storageClient();
  if (client) {
    const { data, error } = await client.storage.from(LIBRARY_BUCKET).download(storageKey);
    if (!error && data) {
      return Buffer.from(await data.arrayBuffer());
    }
  }
  const s3 = await loadS3Config();
  if (s3) {
    try {
      const { s3Get } = await import("@/lib/server/s3.server");
      const bytes = await s3Get(s3, storageKey);
      if (bytes) return bytes;
    } catch {
      /* try local */
    }
  }
  return readFile(storagePath(storageKey));
}

export async function deleteLibraryBytes(key: string): Promise<void> {
  const storageKey = key.replace(/^(supabase|s3):/, "");
  const client = await storageClient();
  if (client) {
    try {
      await client.storage.from(LIBRARY_BUCKET).remove([storageKey]);
    } catch {
      /* missing is fine */
    }
  }
  const s3 = await loadS3Config();
  if (s3) {
    try {
      const { s3Delete } = await import("@/lib/server/s3.server");
      await s3Delete(s3, storageKey);
    } catch {
      /* missing is fine */
    }
  }
  try {
    await unlink(storagePath(storageKey));
  } catch {
    /* missing is fine */
  }
}

export async function hashBytes(bytes: Buffer): Promise<string> {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function hashFile(key: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(storagePath(key));
  for await (const chunk of stream) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export async function signVersionUrl(versionId: string, ttlSec = TOKEN_TTL_SEC): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const secret = await signingSecret();
  const payload = `${versionId}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}.${sig}`).toString("base64url");
  return `/api/library/file?t=${token}`;
}

export function isLibraryFileUrl(url: string): boolean {
  if (!url) return false;
  try {
    if (url.startsWith("/api/library/file")) return true;
    const parsed = new URL(url, "https://library.local");
    return parsed.pathname === "/api/library/file";
  } catch {
    return false;
  }
}

export function tokenFromLibraryUrl(url: string): string | null {
  try {
    if (url.startsWith("/api/library/file")) {
      const parsed = new URL(url, "https://library.local");
      return parsed.searchParams.get("t");
    }
    const parsed = new URL(url);
    if (parsed.pathname === "/api/library/file") return parsed.searchParams.get("t");
    return null;
  } catch {
    return null;
  }
}

export async function verifyLibraryToken(token: string): Promise<{ versionId: string } | null> {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [versionId, expRaw, sig] = parts;
    const exp = Number(expRaw);
    if (!versionId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
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

export function extFromMime(mime: string, filename?: string): string {
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

export function kindFromMime(mime: string): "VIDEO" | "IMAGE" | "AUDIO" | "SUBTITLE" | "OTHER" {
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.includes("srt") || mime.includes("vtt") || mime === "text/vtt") return "SUBTITLE";
  return "OTHER";
}

export function sniffMime(bytes: Buffer, fallback: string, filename?: string): string {
  if (bytes.length >= 12) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return "image/png";
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
    if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WEBP") {
      return "image/webp";
    }
    if (bytes.slice(4, 8).toString("ascii") === "ftyp") return "video/mp4";
    if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WAVE") {
      return "audio/wav";
    }
    if (bytes.slice(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
      return "audio/mpeg";
    }
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
