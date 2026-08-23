import { isTrustedImageUrl } from "@/lib/thumbnails";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";

const HIGGSFIELD_BASE = "https://platform.higgsfield.ai";
/** Confirmed live path. 404s are skipped so a renamed catalog still works. */
const MODEL_PATHS = ["nano-banana-pro", "google/nano-banana-pro"] as const;
const POLL_MS = 2000;
const MAX_POLLS = 45;
const SETTING_KEY_IDS = [
  "HIGGSFIELD_API_KEY",
  "HIGGSFIELD_KEY_ID",
  "HF_API_KEY",
  "HF_API_KEY_ID",
];
const SETTING_SECRET_IDS = [
  "HIGGSFIELD_API_SECRET",
  "HIGGSFIELD_SECRET",
  "HF_API_SECRET",
  "HF_API_KEY_SECRET",
];
const SETTING_COMBINED_IDS = ["HIGGSFIELD_KEY", "HF_KEY", "HF_CREDENTIALS"];

/**
 * Credentials resolve from operator Settings or process env only — never
 * embedded in source. Never import this module from a client component.
 */

export type ImageGenResult =
  | { ok: true; url: string; provider: "higgsfield" | "xai" }
  | { ok: false; error: "missing" | "rate_limit" | "timeout" | "failed" };

type HiggsfieldCreds = { key: string; secret: string };

let credsCache: { at: number; creds: HiggsfieldCreds | null } | null = null;
const CREDS_TTL_MS = 30_000;
let persistAttempted = false;

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

function envCombined(): string | null {
  const combined =
    process.env.HF_CREDENTIALS?.trim() ||
    process.env.HF_KEY?.trim() ||
    process.env.HIGGSFIELD_KEY?.trim() ||
    "";
  return combined || null;
}

function envPair(): HiggsfieldCreds | null {
  const key =
    process.env.HF_API_KEY_ID?.trim() ||
    process.env.HF_API_KEY?.trim() ||
    process.env.HIGGSFIELD_API_KEY?.trim() ||
    "";
  const secret =
    process.env.HF_API_KEY_SECRET?.trim() ||
    process.env.HF_API_SECRET?.trim() ||
    process.env.HIGGSFIELD_API_SECRET?.trim() ||
    "";
  if (key && secret && !looksRedacted(key) && !looksRedacted(secret)) {
    return { key, secret };
  }
  const combined = envCombined();
  if (combined?.includes(":") && !looksRedacted(combined)) {
    const idx = combined.indexOf(":");
    return { key: combined.slice(0, idx), secret: combined.slice(idx + 1) };
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

function credsFromSettings(map: Map<string, string>): HiggsfieldCreds | null {
  const combinedKey = SETTING_COMBINED_IDS.find((id) => map.get(id)?.includes(":"));
  if (combinedKey) {
    const combined = map.get(combinedKey)!;
    if (looksRedacted(combined)) return null;
    const idx = combined.indexOf(":");
    const key = combined.slice(0, idx).trim();
    const secret = combined.slice(idx + 1).trim();
    if (key && secret) return { key, secret };
  }
  const keyId = SETTING_KEY_IDS.find((id) => map.get(id)?.trim());
  const secretId = SETTING_SECRET_IDS.find((id) => map.get(id)?.trim());
  if (keyId && secretId) {
    const key = map.get(keyId)!.trim();
    const secret = map.get(secretId)!.trim();
    if (key && secret && !looksRedacted(key) && !looksRedacted(secret)) {
      return { key, secret };
    }
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

export async function persistHiggsfieldCreds(creds: HiggsfieldCreds): Promise<void> {
  if (!creds.key || !creds.secret) return;
  await writeSetting("HIGGSFIELD_API_KEY", creds.key);
  await writeSetting("HIGGSFIELD_API_SECRET", creds.secret);
  credsCache = { at: Date.now(), creds };
}

async function persistPreviewIfNeeded(creds: HiggsfieldCreds): Promise<void> {
  if (persistAttempted) return;
  persistAttempted = true;
  try {
    const map = await readSettingsMap();
    if (credsFromSettings(map)) return;
    await persistHiggsfieldCreds(creds);
  } catch {
    /* non-fatal — in-memory / preview fallback still works */
  }
}

export function clearHiggsfieldCredsCache(): void {
  credsCache = null;
  persistAttempted = false;
}

export async function loadHiggsfieldCreds(): Promise<HiggsfieldCreds | null> {
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

export async function higgsfieldAvailable(): Promise<boolean> {
  return Boolean(await loadHiggsfieldCreds());
}

export async function imageGenAvailable(): Promise<boolean> {
  if (await higgsfieldAvailable()) return true;
  const { llmAvailable } = await import("@/lib/server/xai.server");
  return llmAvailable();
}

function authHeader(creds: HiggsfieldCreds): string {
  return `Key ${creds.key}:${creds.secret}`;
}

function requestHeaders(creds: HiggsfieldCreds): Record<string, string> {
  return {
    Authorization: authHeader(creds),
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "higgsfield-server-js/2.0",
  };
}

function extractImageUrl(payload: unknown, depth = 0): string | null {
  if (depth > 8 || payload == null) return null;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return isTrustedImageUrl(trimmed) ? trimmed : null;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractImageUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  for (const key of ["url", "image_url", "imageUrl", "image"]) {
    const found = extractImageUrl(obj[key], depth + 1);
    if (found) return found;
  }
  for (const key of ["images", "output", "result", "results", "raw", "data", "images_data", "jobs"]) {
    const found = extractImageUrl(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function detailText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return "";
    }
  }
  return "";
}

function mapHttpError(status: number, payload?: unknown): ImageGenResult {
  if (status === 429) return { ok: false, error: "rate_limit" };
  const detail = detailText(payload).toLowerCase();
  if (status === 401) return { ok: false, error: "missing" };
  if (status === 403) {
    if (detail.includes("not_enough_credits") || detail.includes("credit")) {
      return { ok: false, error: "failed" };
    }
    return { ok: false, error: "missing" };
  }
  return { ok: false, error: "failed" };
}

async function pollStatus(statusUrl: string, creds: HiggsfieldCreds): Promise<ImageGenResult> {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    let response: Response;
    try {
      response = await fetch(statusUrl, {
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
      status === "done"
    ) {
      const url = extractImageUrl(body);
      if (url) return { ok: true, url, provider: "higgsfield" };
      return { ok: false, error: "failed" };
    }
    if (
      status === "failed" ||
      status === "error" ||
      status === "nsfw" ||
      status === "cancelled" ||
      status === "canceled"
    ) {
      return { ok: false, error: "failed" };
    }
  }
  return { ok: false, error: "timeout" };
}

async function submitHiggsfield(
  creds: HiggsfieldCreds,
  prompt: string,
): Promise<ImageGenResult> {
  const body = JSON.stringify({
    prompt,
    aspect_ratio: "16:9",
    resolution: "4k",
  });
  for (const path of MODEL_PATHS) {
    let response: Response;
    try {
      response = await fetch(`${HIGGSFIELD_BASE}/${path}`, {
        method: "POST",
        headers: requestHeaders(creds),
        body,
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return { ok: false, error: "timeout" };
      }
      continue;
    }
    if (response.status === 404) continue;
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (response.status === 429) return { ok: false, error: "rate_limit" };
    if (!response.ok) return mapHttpError(response.status, payload);
    const immediate = extractImageUrl(payload);
    if (immediate) return { ok: true, url: immediate, provider: "higgsfield" };
    const statusUrl =
      typeof payload === "object" && payload && "status_url" in payload
        ? String((payload as { status_url?: unknown }).status_url ?? "")
        : "";
    const requestId =
      typeof payload === "object" && payload && "request_id" in payload
        ? String((payload as { request_id?: unknown }).request_id ?? "")
        : "";
    const pollUrl =
      statusUrl ||
      (requestId ? `${HIGGSFIELD_BASE}/requests/${requestId}/status` : "");
    if (!pollUrl) return { ok: false, error: "failed" };
    return pollStatus(pollUrl, creds);
  }
  return { ok: false, error: "failed" };
}

async function generateWithXai(prompt: string): Promise<ImageGenResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "missing" };
  const models = [
    "grok-imagine-image-2.0",
    "grok-imagine-image-quality",
    "grok-imagine-image",
  ];
  for (const model of models) {
    try {
      const response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: `${prompt}\n\nYouTube thumbnail, exact 16:9 widescreen, ultra sharp, high contrast, cinematic lighting.`,
          n: 1,
          aspect_ratio: "16:9",
          resolution: "2k",
          response_format: "url",
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (response.status === 404) {
        continue;
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("[thumbnails-image]", model, response.status, detail.slice(0, 240));
        if (response.status === 429) return { ok: false, error: "rate_limit" };
        return mapHttpError(response.status);
      }
      const payload = (await response.json()) as {
        data?: { url?: string; b64_json?: string }[];
      };
      const first = payload.data?.[0];
      if (first?.url && isTrustedImageUrl(first.url)) {
        return { ok: true, url: first.url, provider: "xai" };
      }
      if (first?.b64_json) {
        const dataUrl = `data:image/png;base64,${first.b64_json}`;
        if (isTrustedImageUrl(dataUrl)) return { ok: true, url: dataUrl, provider: "xai" };
      }
      return { ok: false, error: "failed" };
    } catch (error) {
      console.error(
        "[thumbnails-image] throw",
        model,
        error instanceof Error ? `${error.name}: ${error.message}` : "error",
      );
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return { ok: false, error: "timeout" };
      }
    }
  }
  return { ok: false, error: "failed" };
}

export async function generateThumbnailImage(prompt: string): Promise<ImageGenResult> {
  const trimmed = prompt.replace(/\s+/g, " ").trim().slice(0, 3500);
  if (!trimmed) return { ok: false, error: "failed" };
  const creds = await loadHiggsfieldCreds();
  if (creds) {
    const result = await submitHiggsfield(creds, trimmed);
    if (result.ok) return result;
    // Credits / transient Higgsfield errors fall through to the platform image model.
    if (result.error === "missing" || result.error === "failed") {
      const fallback = await generateWithXai(trimmed);
      if (fallback.ok) return fallback;
    }
    return result;
  }
  return generateWithXai(trimmed);
}

export function imageErrorMessage(
  error: "missing" | "rate_limit" | "timeout" | "failed",
): string {
  if (error === "rate_limit") return "The image service is busy. Retry in a moment.";
  if (error === "timeout") return "The image took too long. Retry.";
  if (error === "missing") return "This tool will be available once you connect your API key.";
  return "The image didn’t come through. Retry.";
}
