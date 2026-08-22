/**
 * Twitch Helix client. Tokens stay in AppSetting. Never returned to the browser.
 * Create Clip From VOD: POST /helix/videos/clips (channel:manage:clips | editor:manage:clips).
 */
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import { CLIP_DURATION_DEFAULT, clampClipDuration } from "@/lib/stream";

const CLIENT_ID_KEY = "TWITCH_CLIENT_ID";
const CLIENT_SECRET_KEY = "TWITCH_CLIENT_SECRET";
const USER_TOKEN_KEY = "TWITCH_USER_ACCESS_TOKEN";
const REFRESH_TOKEN_KEY = "TWITCH_REFRESH_TOKEN";
const USER_ID_KEY = "TWITCH_USER_ID";
const APP_TOKEN_KEY = "TWITCH_APP_ACCESS_TOKEN";
const APP_TOKEN_EXP_KEY = "TWITCH_APP_TOKEN_EXPIRES_AT";

const HELIX = "https://api.twitch.tv/helix";
const ID = "https://id.twitch.tv/oauth2";

export type TwitchConfig = {
  clientId: string;
  clientSecret: string;
  userAccessToken: string | null;
  userId: string | null;
};

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

export async function loadTwitchConfig(): Promise<TwitchConfig | null> {
  const clientId = (await readAppSetting(CLIENT_ID_KEY))?.trim() || "";
  const clientSecret = (await readAppSetting(CLIENT_SECRET_KEY))?.trim() || "";
  if (!clientId || !clientSecret || looksRedacted(clientId) || looksRedacted(clientSecret)) {
    return null;
  }
  const userAccessToken = (await readAppSetting(USER_TOKEN_KEY))?.trim() || "";
  const userId = (await readAppSetting(USER_ID_KEY))?.trim() || "";
  return {
    clientId,
    clientSecret,
    userAccessToken: userAccessToken && !looksRedacted(userAccessToken) ? userAccessToken : null,
    userId: userId || null,
  };
}

export async function twitchConfigured(): Promise<boolean> {
  return Boolean(await loadTwitchConfig());
}

export async function twitchLast4(): Promise<string | null> {
  const cfg = await loadTwitchConfig();
  if (!cfg) return null;
  const src = cfg.userAccessToken || cfg.clientId;
  return src.slice(-4);
}

export async function persistTwitchSettings(values: Record<string, string | undefined>): Promise<void> {
  const clientId = (values.clientId ?? values.key ?? "").trim();
  const clientSecret = (values.clientSecret ?? values.secret ?? "").trim();
  const userToken = (values.userAccessToken ?? values.token ?? "").trim();
  if (clientId && !looksRedacted(clientId)) await writeAppSetting(CLIENT_ID_KEY, clientId);
  if (clientSecret && !looksRedacted(clientSecret) && clientSecret.length >= 8) {
    await writeAppSetting(CLIENT_SECRET_KEY, clientSecret);
  }
  if (userToken && !looksRedacted(userToken) && userToken.length >= 8) {
    await writeAppSetting(USER_TOKEN_KEY, userToken);
  }
}

export async function disconnectTwitch(): Promise<void> {
  await deleteAppSetting(CLIENT_ID_KEY);
  await deleteAppSetting(CLIENT_SECRET_KEY);
  await deleteAppSetting(USER_TOKEN_KEY);
  await deleteAppSetting(REFRESH_TOKEN_KEY);
  await deleteAppSetting(USER_ID_KEY);
  await deleteAppSetting(APP_TOKEN_KEY);
  await deleteAppSetting(APP_TOKEN_EXP_KEY);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function helixFetch(
  path: string,
  init: RequestInit,
  token: string,
  clientId: string,
  attempt = 0,
): Promise<{ status: number; json: unknown }> {
  const url = path.startsWith("http") ? path : `${HELIX}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Client-Id": clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text.slice(0, 200) };
  }
  if (response.status === 429 && attempt < 4) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? "");
    const wait = Number.isFinite(retryAfter) ? retryAfter * 1000 : 400 * 2 ** attempt;
    await sleep(Math.min(8000, wait));
    return helixFetch(path, init, token, clientId, attempt + 1);
  }
  return { status: response.status, json };
}

async function appAccessToken(config: TwitchConfig): Promise<string> {
  const cached = (await readAppSetting(APP_TOKEN_KEY))?.trim() || "";
  const exp = Date.parse((await readAppSetting(APP_TOKEN_EXP_KEY))?.trim() || "");
  if (cached && Number.isFinite(exp) && exp - Date.now() > 60_000) return cached;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch(`${ID}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("TWITCH_UNAVAILABLE");
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("TWITCH_UNAVAILABLE");
  await writeAppSetting(APP_TOKEN_KEY, json.access_token);
  const expiresAt = new Date(Date.now() + Math.max(60, json.expires_in ?? 3600) * 1000).toISOString();
  await writeAppSetting(APP_TOKEN_EXP_KEY, expiresAt);
  return json.access_token;
}

export async function testTwitchConnection(): Promise<{ ok: true; login: string | null }> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  const token = config.userAccessToken ?? (await appAccessToken(config));
  const { status, json } = await helixFetch("/users", { method: "GET" }, token, config.clientId);
  if (status === 401 || status === 403) throw new Error("TWITCH_SCOPE_MISSING");
  if (status >= 400) throw new Error("TWITCH_UNAVAILABLE");
  const data = (json as { data?: Array<{ id?: string; login?: string }> }).data ?? [];
  const user = data[0];
  if (user?.id) await writeAppSetting(USER_ID_KEY, user.id);
  return { ok: true, login: user?.login ?? null };
}

export type HelixUser = { id: string; login: string; displayName: string };

export async function helixGetUserByLogin(login: string): Promise<HelixUser | null> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  const token = config.userAccessToken ?? (await appAccessToken(config));
  const { status, json } = await helixFetch(
    `/users?login=${encodeURIComponent(login.trim().replace(/^@/, ""))}`,
    { method: "GET" },
    token,
    config.clientId,
  );
  if (status >= 400) throw new Error("TWITCH_UNAVAILABLE");
  const row = ((json as { data?: Array<{ id?: string; login?: string; display_name?: string }> }).data ?? [])[0];
  if (!row?.id) return null;
  return { id: row.id, login: row.login ?? login, displayName: row.display_name ?? row.login ?? login };
}

export type HelixVideo = {
  id: string;
  userId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  durationSec: number;
  viewCount: number;
  publishedAt: string | null;
};

function parseTwitchDuration(raw: string | undefined): number {
  if (!raw) return 0;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw.trim());
  if (!match) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return (Number(match[1] ?? 0) * 3600) + (Number(match[2] ?? 0) * 60) + Number(match[3] ?? 0);
}

export async function helixListArchives(broadcasterId: string): Promise<HelixVideo[]> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  const token = config.userAccessToken ?? (await appAccessToken(config));
  const { status, json } = await helixFetch(
    `/videos?user_id=${encodeURIComponent(broadcasterId)}&type=archive&first=20`,
    { method: "GET" },
    token,
    config.clientId,
  );
  if (status === 401 || status === 403) throw new Error("TWITCH_SCOPE_MISSING");
  if (status >= 400) throw new Error("TWITCH_UNAVAILABLE");
  const rows = (json as { data?: Array<Record<string, unknown>> }).data ?? [];
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? broadcasterId),
    title: String(row.title ?? "Untitled VOD"),
    url: String(row.url ?? `https://www.twitch.tv/videos/${row.id}`),
    thumbnailUrl: String(row.thumbnail_url ?? "").replace("%{width}", "640").replace("%{height}", "360"),
    durationSec: parseTwitchDuration(typeof row.duration === "string" ? row.duration : undefined),
    viewCount: Number(row.view_count ?? 0) || 0,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
  }));
}

export async function helixGetVideo(vodId: string): Promise<HelixVideo | null> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  const token = config.userAccessToken ?? (await appAccessToken(config));
  const { status, json } = await helixFetch(
    `/videos?id=${encodeURIComponent(vodId)}`,
    { method: "GET" },
    token,
    config.clientId,
  );
  if (status >= 400) return null;
  const row = ((json as { data?: Array<Record<string, unknown>> }).data ?? [])[0];
  if (!row?.id) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    title: String(row.title ?? "Untitled VOD"),
    url: String(row.url ?? `https://www.twitch.tv/videos/${row.id}`),
    thumbnailUrl: String(row.thumbnail_url ?? "").replace("%{width}", "640").replace("%{height}", "360"),
    durationSec: parseTwitchDuration(typeof row.duration === "string" ? row.duration : undefined),
    viewCount: Number(row.view_count ?? 0) || 0,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
  };
}

export type CreatedHelixClip = {
  id: string;
  editUrl: string | null;
  waitingHuman?: string;
};

export async function helixCreateClipFromVod(input: {
  broadcasterId: string;
  vodId: string;
  vodOffsetSec: number;
  durationSec: number;
  title: string;
}): Promise<CreatedHelixClip> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  if (!config.userAccessToken) {
    return {
      id: "",
      editUrl: null,
      waitingHuman:
        "Connect a Twitch user token with channel:manage:clips or editor:manage:clips to create clips from VODs.",
    };
  }
  const editorId = config.userId || "";
  const duration = clampClipDuration(input.durationSec, CLIP_DURATION_DEFAULT);
  const offset = Math.max(duration, Math.round(input.vodOffsetSec));
  const title = input.title.slice(0, 100) || "Clip";
  const params = new URLSearchParams({
    broadcaster_id: input.broadcasterId,
    vod_id: input.vodId,
    vod_offset: String(offset),
    duration: String(duration),
    title,
  });
  if (editorId) params.set("editor_id", editorId);

  let { status, json } = await helixFetch(
    `/videos/clips?${params.toString()}`,
    { method: "POST" },
    config.userAccessToken,
    config.clientId,
  );

  if (status === 404) {
    const fallback = new URLSearchParams({
      vod_id: input.vodId,
      offset: String(offset),
      duration: String(duration),
    });
    ({ status, json } = await helixFetch(
      `/clips?${fallback.toString()}`,
      { method: "POST" },
      config.userAccessToken,
      config.clientId,
    ));
  }

  if (status === 401 || status === 403) {
    const message =
      (json as { message?: string })?.message ??
      "Twitch rejected clip creation. Need channel:manage:clips or editor:manage:clips.";
    return { id: "", editUrl: null, waitingHuman: message.slice(0, 240) };
  }
  if (status >= 400) {
    const message = (json as { message?: string })?.message || "Twitch clip create failed.";
    throw new Error(message.slice(0, 180));
  }
  const row = ((json as { data?: Array<{ id?: string; edit_url?: string }> }).data ?? [])[0];
  if (!row?.id) throw new Error("TWITCH_CLIP_FAILED");
  return { id: row.id, editUrl: row.edit_url ?? null };
}

export type HelixClip = {
  id: string;
  url: string;
  embedUrl: string | null;
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  vodOffset: number | null;
};

export async function helixGetClip(id: string): Promise<HelixClip | null> {
  const config = await loadTwitchConfig();
  if (!config) throw new Error("TWITCH_UNAVAILABLE");
  const token = config.userAccessToken ?? (await appAccessToken(config));
  const { status, json } = await helixFetch(
    `/clips?id=${encodeURIComponent(id)}`,
    { method: "GET" },
    token,
    config.clientId,
  );
  if (status >= 400) return null;
  const row = ((json as { data?: Array<Record<string, unknown>> }).data ?? [])[0];
  if (!row?.id) return null;
  return {
    id: String(row.id),
    url: String(row.url ?? `https://clips.twitch.tv/${row.id}`),
    embedUrl: typeof row.embed_url === "string" ? row.embed_url : null,
    title: String(row.title ?? ""),
    thumbnailUrl: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    duration: Number(row.duration ?? 0) || 0,
    vodOffset: typeof row.vod_offset === "number" ? row.vod_offset : null,
  };
}

export async function pollHelixClip(id: string, timeoutMs = 45_000): Promise<HelixClip | null> {
  const started = Date.now();
  let delay = 1500;
  while (Date.now() - started < timeoutMs) {
    const clip = await helixGetClip(id);
    if (clip) return clip;
    await sleep(delay);
    delay = Math.min(6000, Math.round(delay * 1.4));
  }
  return null;
}
