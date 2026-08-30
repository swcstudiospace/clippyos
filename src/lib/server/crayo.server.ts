/**
 * Crayo.ai Integration — AI-powered short-form video generation.
 * 
 * Crayo.ai provides an API for generating short-form videos (TikTok/Reels/Shorts)
 * from text prompts, scripts, or article URLs. This module wraps the Crayo API
 * with the same patterns as other ClippyOS integrations (Higgsfield, xAI).
 * 
 * Documentation: https://docs.crayo.ai (reference)
 * API Base: https://api.crayo.ai/v1
 * Authentication: Bearer token (API key)
 */

import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { isTrustedImageUrl } from "@/lib/thumbnails";

const CRAYO_BASE = "https://api.crayo.ai/v1";
const POLL_MS = 3000;
const MAX_POLLS = 60; // 3 minutes max for video generation

const SETTING_KEY_IDS = ["CRAYO_API_KEY", "CRAYO_KEY"];
const SETTING_SECRET_IDS = ["CRAYO_API_SECRET", "CRAYO_SECRET"];
const SETTING_COMBINED_IDS = ["CRAYO_CREDENTIALS", "CRAYO_KEY"];

export type CrayoVideoResult =
  | { ok: true; videoUrl: string; jobId: string; provider: "crayo" }
  | { ok: false; error: "missing" | "rate_limit" | "timeout" | "failed" | "processing" };

type CrayoCreds = { key: string; secret: string };

let credsCache: { at: number; creds: CrayoCreds | null } | null = null;
const CREDS_TTL_MS = 30_000;
let persistAttempted = false;

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

function envPair(): CrayoCreds | null {
  const key = process.env.CRAYO_API_KEY?.trim() || process.env.CRAYO_KEY?.trim() || "";
  if (key && !looksRedacted(key)) {
    const secret = process.env.CRAYO_API_SECRET?.trim() || process.env.CRAYO_SECRET?.trim() || "";
    return { key, secret };
  }
  return null;
}

async function readSettingsMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("app_settings").select("key,value");
    if (!error) {
      for (const row of data ?? []) {
        const record = row as { key?: string; value?: string | null };
        if (record.key && record.value) map.set(record.key, record.value);
      }
      return map;
    }
    if (!isMissingTable(error)) return map;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ key: string; value: string | null }>(
      "select key, value from app_settings",
    );
    for (const row of rows) {
      if (row.key && row.value) map.set(row.key, row.value);
    }
  } catch {
    /* empty */
  }
  return map;
}

function credsFromSettings(map: Map<string, string>): CrayoCreds | null {
  const combinedKey = SETTING_COMBINED_IDS.find((id) => map.get(id)?.includes(":"));
  if (combinedKey) {
    const combined = map.get(combinedKey)!;
    if (looksRedacted(combined)) return null;
    const idx = combined.indexOf(":");
    const key = combined.slice(0, idx).trim();
    const secret = combined.slice(idx + 1).trim();
    if (key && key.startsWith("crayo_sk_")) return { key, secret };
    if (key && secret) return { key, secret };
  }
  const keyId = SETTING_KEY_IDS.find((id) => map.get(id)?.trim());
  if (keyId) {
    const key = map.get(keyId)!.trim();
    if (!key || looksRedacted(key)) return null;
    const secretId = SETTING_SECRET_IDS.find((id) => map.get(id)?.trim());
    const secret = secretId ? map.get(secretId)!.trim() : "";
    return { key, secret };
  }
  return null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("app_settings").upsert(
      {
        id,
        key,
        value,
        created_at: now,
        updated_at: now,
        created_by: null,
      },
      { onConflict: "key" },
    );
    if (error && !isMissingTable(error)) {
      const existing = await admin.from("app_settings").select("id").eq("key", key).maybeSingle();
      if (existing.data && typeof (existing.data as { id?: string }).id === "string") {
        await admin
          .from("app_settings")
          .update({ value, updated_at: now })
          .eq("id", (existing.data as { id: string }).id);
      } else if (!existing.error || isMissingTable(existing.error)) {
        await admin.from("app_settings").insert({
          id,
          key,
          value,
          created_at: now,
          updated_at: now,
          created_by: null,
        });
      }
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into app_settings (id, key, value, created_at, updated_at, created_by)
       values ($1, $2, $3, $4, $5, null)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      [id, key, value, now, now],
    );
  } catch {
    /* local store may be unavailable */
  }
}

export async function persistCrayoCreds(creds: CrayoCreds): Promise<void> {
  if (!creds.key || !creds.secret) return;
  await writeSetting("CRAYO_API_KEY", creds.key);
  await writeSetting("CRAYO_API_SECRET", creds.secret);
  credsCache = { at: Date.now(), creds };
}

async function persistPreviewIfNeeded(creds: CrayoCreds): Promise<void> {
  if (persistAttempted) return;
  persistAttempted = true;
  try {
    const map = await readSettingsMap();
    if (credsFromSettings(map)) return;
    await persistCrayoCreds(creds);
  } catch {
    /* non-fatal — in-memory / preview fallback still works */
  }
}

export function clearCrayoCredsCache(): void {
  credsCache = null;
  persistAttempted = false;
}

export async function loadCrayoCreds(): Promise<CrayoCreds | null> {
  const now = Date.now();
  if (credsCache && now - credsCache.at < CREDS_TTL_MS) return credsCache.creds;
  const fromEnv = envPair();
  if (fromEnv) {
    credsCache = { at: now, creds: fromEnv };
    void persistPreviewIfNeeded(fromEnv);
    return fromEnv;
  }
  try {
    const map = await readSettingsMap();
    const fromSettings = credsFromSettings(map);
    if (fromSettings) {
      credsCache = { at: now, creds: fromSettings };
      return fromSettings;
    }
  } catch {
    /* fall through — no credentials configured */
  }
  credsCache = { at: now, creds: null };
  return null;
}

export async function crayoAvailable(): Promise<boolean> {
  return Boolean(await loadCrayoCreds());
}

function authHeader(creds: CrayoCreds): string {
  const token = creds.key.startsWith("crayo_sk_")
    ? creds.key
    : creds.key.includes(":")
      ? creds.key.slice(0, creds.key.indexOf(":")).trim()
      : creds.key;
  return `Bearer ${token}`;
}

function requestHeaders(creds: CrayoCreds): Record<string, string> {
  return {
    Authorization: authHeader(creds),
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "clippyos-crayo/1.0",
  };
}

function extractVideoUrl(payload: unknown, depth = 0): string | null {
  if (depth > 8 || payload == null) return null;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return isTrustedImageUrl(trimmed) ? trimmed : null;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  for (const key of ["video_url", "videoUrl", "url", "download_url", "downloadUrl", "result_url", "resultUrl"]) {
    const found = extractVideoUrl(obj[key], depth + 1);
    if (found) return found;
  }
  for (const key of ["video", "output", "result", "data", "job", "generation"]) {
    const found = extractVideoUrl(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function detailText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && ("detail" in payload || "message" in payload || "error" in payload)) {
    const detail = (payload as { detail?: unknown; message?: unknown; error?: unknown }).detail ??
      (payload as { message?: unknown }).message ??
      (payload as { error?: unknown }).error;
    if (typeof detail === "string") return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return "";
    }
  }
  return "";
}

function mapHttpError(status: number, _payload?: unknown): CrayoVideoResult {
  if (status === 429) return { ok: false, error: "rate_limit" };
  if (status === 401 || status === 403) return { ok: false, error: "missing" };
  if (status === 402) return { ok: false, error: "failed" }; // insufficient credits
  if (status >= 500) return { ok: false, error: "failed" };
  return { ok: false, error: "failed" };
}

async function pollStatus(jobId: string, creds: CrayoCreds): Promise<CrayoVideoResult> {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    let response: Response;
    try {
      response = await fetch(`${CRAYO_BASE}/jobs/${jobId}/status`, {
        headers: requestHeaders(creds),
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        continue;
      }
      return { ok: false, error: "failed" };
    }
    if (response.status === 429) return { ok: false, error: "rate_limit" };
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return mapHttpError(response.status, body);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, error: "failed" };
    }
    const status =
      typeof body === "object" && body && "status" in body
        ? String((body as { status?: unknown }).status ?? "").toLowerCase()
        : "";
    if (
      status === "completed" ||
      status === "complete" ||
      status === "succeeded" ||
      status === "success" ||
      status === "done" ||
      status === "ready"
    ) {
      const url = extractVideoUrl(body);
      if (url) return { ok: true, videoUrl: url, jobId, provider: "crayo" };
      return { ok: false, error: "failed" };
    }
    if (
      status === "failed" ||
      status === "error" ||
      status === "cancelled" ||
      status === "canceled"
    ) {
      return { ok: false, error: "failed" };
    }
    // Still processing (queued, processing, rendering, etc.)
    if (status === "processing" || status === "rendering" || status === "queued") {
      continue;
    }
  }
  return { ok: false, error: "timeout" };
}

async function submitCrayoJob(
  creds: CrayoCreds,
  input: {
    prompt?: string;
    script?: string;
    articleUrl?: string;
    style?: string;
    duration?: number;
    aspectRatio?: "9:16" | "16:9" | "1:1";
    voiceId?: string;
    musicId?: string;
  },
): Promise<CrayoVideoResult> {
  const body = JSON.stringify({
    prompt: input.prompt,
    script: input.script,
    article_url: input.articleUrl,
    style: input.style || "default",
    duration_seconds: input.duration || 60,
    aspect_ratio: input.aspectRatio || "9:16",
    voice_id: input.voiceId,
    music_id: input.musicId,
  });

  let response: Response;
  try {
    response = await fetch(`${CRAYO_BASE}/videos/generate`, {
      method: "POST",
      headers: requestHeaders(creds),
      body,
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, error: "timeout" };
    }
    return { ok: false, error: "failed" };
  }

  if (response.status === 429) return { ok: false, error: "rate_limit" };
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) return mapHttpError(response.status, payload);

  const jobId =
    typeof payload === "object" && payload && "job_id" in payload
      ? String((payload as { job_id?: unknown }).job_id ?? "")
      : typeof payload === "object" && payload && "id" in payload
        ? String((payload as { id?: unknown }).id ?? "")
        : "";

  if (!jobId) return { ok: false, error: "failed" };

  // Poll for completion
  return pollStatus(jobId, creds);
}

export async function generateCrayoVideo(input: {
  prompt?: string;
  script?: string;
  articleUrl?: string;
  style?: string;
  duration?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  voiceId?: string;
  musicId?: string;
}): Promise<CrayoVideoResult> {
  const creds = await loadCrayoCreds();
  if (!creds) {
    return { ok: false, error: "missing" };
  }
  const result = await submitCrayoJob(creds, input);
  if (result.ok) return result;
  // On rate limit or timeout, return as-is for caller to handle
  if (result.error === "rate_limit" || result.error === "timeout") {
    return result;
  }
  return result;
}

export function crayoErrorMessage(
  error: "missing" | "rate_limit" | "timeout" | "failed" | "processing",
): string {
  if (error === "rate_limit") return "Crayo.ai is busy. Retry in a moment.";
  if (error === "timeout") return "Video generation took too long. Retry.";
  if (error === "missing") return "This tool will be available once you connect your Crayo.ai API key.";
  if (error === "processing") return "Video is still being generated. Check back shortly.";
  return "The video didn't come through. Retry.";
}

export class CrayoApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function crayoJson(
  creds: CrayoCreds,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const url = path.startsWith("http") ? path : `${CRAYO_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders(creds),
      body: body && method !== "GET" && method !== "DELETE" ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(method === "GET" ? 20000 : 45000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new CrayoApiError("TIMEOUT", "Crayo request timed out.", 504);
    throw new CrayoApiError("FAILED", "Couldn’t reach Crayo.", 502);
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (response.status === 401 || response.status === 403) {
    throw new CrayoApiError("UNAUTHORIZED", "Crayo API key is missing or revoked.", response.status);
  }
  if (response.status === 429) throw new CrayoApiError("RATE_LIMIT", "Crayo rate limit. Retry shortly.", 429);
  if (response.status === 402) throw new CrayoApiError("INSUFFICIENT_CREDITS", "Crayo credits or storage are exhausted.", 402);
  if (!response.ok) {
    const message = detailText(payload) || `Crayo returned ${response.status}.`;
    throw new CrayoApiError("FAILED", message.slice(0, 280), response.status);
  }
  return payload;
}

function requireCredsOrThrow(creds: CrayoCreds | null): CrayoCreds {
  if (!creds) throw new CrayoApiError("MISSING", crayoErrorMessage("missing"), 503);
  return creds;
}

export async function crayoGetAccount(): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "GET", "/account");
}

export async function crayoListAssets(input: { type?: string; limit?: number } = {}): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  const params = new URLSearchParams();
  if (input.type) params.set("type", input.type);
  if (input.limit) params.set("limit", String(Math.min(100, Math.max(1, input.limit))));
  const q = params.toString();
  return crayoJson(creds, "GET", `/assets${q ? `?${q}` : ""}`);
}

export async function crayoImportAsset(input: { url: string; name?: string }): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", "/assets", { url: input.url, name: input.name });
}

export async function crayoGenerateImage(input: {
  prompt: string;
  aspectRatio?: string;
  model?: string;
}): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", "/image-generator", {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio ?? "9:16",
    model: input.model,
  });
}

export async function crayoListVoices(input: { search?: string; limit?: number } = {}): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  const params = new URLSearchParams();
  if (input.search) params.set("search", input.search);
  params.set("limit", String(input.limit ?? 20));
  return crayoJson(creds, "GET", `/voices?${params.toString()}`);
}

export async function crayoGenerateVoiceover(input: {
  script: string;
  voiceId: string;
  title?: string;
}): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", "/voiceover-generator", {
    script: input.script,
    voice_id: input.voiceId,
    title: input.title,
  });
}

export async function crayoCreateProject(input: Record<string, unknown>): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", "/projects", input);
}

export async function crayoExportProject(projectId: string): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", `/projects/${encodeURIComponent(projectId)}/export`);
}

export async function crayoGetExport(exportId: string): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "GET", `/exports/${encodeURIComponent(exportId)}`);
}

export async function crayoCreateAutoclip(input: {
  assetId: string;
  clipCount?: number;
  clipLength?: number;
  editLevel?: string;
  prompt?: string;
}): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "POST", "/autoclip", {
    asset_id: input.assetId,
    clip_count: input.clipCount ?? 5,
    clip_length: input.clipLength ?? 60,
    edit_level: input.editLevel ?? "full",
    prompt: input.prompt,
  });
}

export async function crayoGetAutoclip(id: string): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  return crayoJson(creds, "GET", `/autoclip/${encodeURIComponent(id)}`);
}

export async function crayoPollExport(exportId: string): Promise<unknown> {
  const creds = requireCredsOrThrow(await loadCrayoCreds());
  for (let i = 0; i < MAX_POLLS; i += 1) {
    const payload = await crayoJson(creds, "GET", `/exports/${encodeURIComponent(exportId)}`);
    const status = String(
      (payload && typeof payload === "object" && "export" in payload
        ? (payload as { export?: { status?: string } }).export?.status
        : (payload as { status?: string }).status) ?? "",
    ).toLowerCase();
    if (status === "completed" || status === "complete" || status === "succeeded") return payload;
    if (status === "failed" || status === "error") {
      throw new CrayoApiError("FAILED", "Crayo export failed.", 400);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new CrayoApiError("TIMEOUT", "Crayo export is still processing.", 504);
}