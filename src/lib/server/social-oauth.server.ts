/**
 * OAuth tokens for X, TikTok, Instagram Graph, and YouTube Data API upload.
 * Tokens stay in AppSetting. Never returned to the client or Hermes.
 */
import { createHash, randomBytes } from "node:crypto";
import {
  deleteAppSetting,
  readAppSetting,
  writeAppSetting,
} from "@/lib/server/app-settings.server";
import { getOperatorAccess } from "@/lib/server/access";
import { getSecretScope, runWithSecretScope } from "@/lib/server/secret-scope.server";
import { publicAppOrigin } from "@/lib/server/public-origin.server";
import { last4 } from "@/lib/server/discord.server";
import type { SocialPlatform } from "@/lib/entities";
import type {
  IgAccountType,
  InstagramAccountOption,
  PublisherStatus,
  TikTokAuditStatus,
} from "@/lib/publishers";
import { emptyInstagramDetails, emptyPublisherStatus, emptyTikTokDetails, emptyYoutubeDetails, mapIgAccountType } from "@/lib/publishers";

export type PublisherId = "x" | "tiktok" | "instagram" | "youtube";

type TokenBlob = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  tokenType: string;
  scopes: string[];
  userId: string | null;
  handle: string | null;
  openId: string | null;
  pageId: string | null;
  pageToken: string | null;
  accountType: string | null;
};

type PendingOauth = {
  provider: PublisherId;
  codeVerifier: string;
  createdAt: string;
  userId: string;
};

const APP_KEYS: Record<PublisherId, { id: string; secret: string }> = {
  x: { id: "X_CLIENT_ID", secret: "X_CLIENT_SECRET" },
  tiktok: { id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET" },
  instagram: { id: "IG_APP_ID", secret: "IG_APP_SECRET" },
  youtube: { id: "YT_PUBLISH_CLIENT_ID", secret: "YT_PUBLISH_CLIENT_SECRET" },
};

const TOKEN_KEYS: Record<PublisherId, string> = {
  x: "X_OAUTH_TOKENS",
  tiktok: "TIKTOK_OAUTH_TOKENS",
  instagram: "IG_OAUTH_TOKENS",
  youtube: "YT_PUBLISH_OAUTH_TOKENS",
};

const X_FLAT_KEYS = {
  access: "X_ACCESS_TOKEN",
  refresh: "X_REFRESH_TOKEN",
  expires: "X_TOKEN_EXPIRES_AT",
  userId: "X_CONNECTED_USER_ID",
  username: "X_CONNECTED_USERNAME",
} as const;

const X_API_BASE_KEY = "X_API_BASE";
const X_API_BASE_DEFAULT = "https://api.x.com";
const X_API_BASE_ALLOWED = new Set(["https://api.x.com", "https://api.twitter.com"]);

const PENDING_KEY = "SOCIAL_OAUTH_PENDING";
const IG_ACCOUNTS_KEY = "IG_ACCOUNT_OPTIONS";
const IG_PAGE_TOKENS_KEY = "IG_PAGE_TOKENS";
const IG_FLAT_KEYS = {
  access: "IG_ACCESS_TOKEN",
  expires: "IG_TOKEN_EXPIRES_AT",
  userId: "IG_USER_ID",
  username: "IG_USERNAME",
  accountType: "IG_ACCOUNT_TYPE",
  pageId: "IG_PAGE_ID",
} as const;
const TIKTOK_MODE_KEY = "TIKTOK_PUBLISH_MODE";
const TIKTOK_AUDIT_KEY = "TIKTOK_AUDIT_STATUS";
const TIKTOK_DOMAIN_KEY = "TIKTOK_VERIFIED_DOMAIN";
const YT_FLAT_KEYS = {
  access: "YT_PUBLISH_ACCESS_TOKEN",
  refresh: "YT_PUBLISH_REFRESH_TOKEN",
  expires: "YT_PUBLISH_TOKEN_EXPIRES_AT",
  channelId: "YT_PUBLISH_CHANNEL_ID",
  channelTitle: "YT_PUBLISH_CHANNEL_TITLE",
} as const;
const YT_CATEGORY_KEY = "YT_PUBLISH_CATEGORY_ID";
const YT_PRIVACY_KEY = "YT_PUBLISH_PRIVACY_DEFAULT";

const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "media.write", "offline.access"];
const TIKTOK_SCOPES = ["user.info.basic", "video.upload", "video.publish"];
const IG_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
];
const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function urlSafe(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function s256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

export async function readXApiBase(): Promise<string> {
  const raw = (await readAppSetting(X_API_BASE_KEY))?.trim().replace(/\/+$/, "") ?? "";
  if (raw && X_API_BASE_ALLOWED.has(raw)) return raw;
  return X_API_BASE_DEFAULT;
}

export async function persistXApiBase(value: string): Promise<void> {
  const cleaned = value.trim().replace(/\/+$/, "");
  if (!cleaned) {
    await deleteAppSetting(X_API_BASE_KEY);
    return;
  }
  if (!X_API_BASE_ALLOWED.has(cleaned)) throw new Error("X_API_BASE_INVALID");
  await writeAppSetting(X_API_BASE_KEY, cleaned);
}

export function socialOauthCallbackUrl(): string {
  return `${publicAppOrigin()}/api/oauth/social`;
}

export async function loadPublisherApp(id: PublisherId): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  const keys = APP_KEYS[id];
  const clientId = (await readAppSetting(keys.id))?.trim() || "";
  const clientSecret = (await readAppSetting(keys.secret))?.trim() || "";
  if (!clientId || looksRedacted(clientId) || clientId.length < 6) return null;
  if (!clientSecret || looksRedacted(clientSecret) || clientSecret.length < 6) return null;
  return { clientId, clientSecret };
}

export async function persistPublisherApp(
  id: PublisherId,
  values: { clientId?: string; clientSecret?: string },
): Promise<void> {
  const keys = APP_KEYS[id];
  const clientId = (values.clientId ?? "").trim();
  const clientSecret = (values.clientSecret ?? "").trim();
  if (clientId.length < 6 || clientSecret.length < 6) throw new Error("KEY_TOO_SHORT");
  await writeAppSetting(keys.id, clientId);
  await writeAppSetting(keys.secret, clientSecret);
}

export async function readToken(id: PublisherId): Promise<TokenBlob | null> {
  const raw = await readAppSetting(TOKEN_KEYS[id]);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as TokenBlob;
      if (parsed?.accessToken && !looksRedacted(parsed.accessToken)) return parsed;
    } catch {
      /* fall through to flat X keys */
    }
  }
  if (id === "x") return readXFlatToken();
  if (id === "instagram") return readIgFlatToken();
  if (id === "youtube") return readYtFlatToken();
  return null;
}

async function readIgFlatToken(): Promise<TokenBlob | null> {
  const accessToken = (await readAppSetting(IG_FLAT_KEYS.access))?.trim() || "";
  if (!accessToken || looksRedacted(accessToken)) return null;
  const expiresAt = (await readAppSetting(IG_FLAT_KEYS.expires))?.trim() || null;
  const userId = (await readAppSetting(IG_FLAT_KEYS.userId))?.trim() || null;
  const username = (await readAppSetting(IG_FLAT_KEYS.username))?.trim() || null;
  const accountType = (await readAppSetting(IG_FLAT_KEYS.accountType))?.trim() || null;
  const pageId = (await readAppSetting(IG_FLAT_KEYS.pageId))?.trim() || null;
  return {
    accessToken,
    refreshToken: null,
    expiresAt,
    tokenType: "bearer",
    scopes: IG_SCOPES,
    userId,
    handle: username ? (username.startsWith("@") ? username : `@${username}`) : null,
    openId: null,
    pageId,
    pageToken: null,
    accountType,
  };
}

async function readXFlatToken(): Promise<TokenBlob | null> {
  const accessToken = (await readAppSetting(X_FLAT_KEYS.access))?.trim() || "";
  if (!accessToken || looksRedacted(accessToken)) return null;
  const refreshToken = (await readAppSetting(X_FLAT_KEYS.refresh))?.trim() || null;
  const expiresAt = (await readAppSetting(X_FLAT_KEYS.expires))?.trim() || null;
  const userId = (await readAppSetting(X_FLAT_KEYS.userId))?.trim() || null;
  const username = (await readAppSetting(X_FLAT_KEYS.username))?.trim() || null;
  return {
    accessToken,
    refreshToken,
    expiresAt,
    tokenType: "bearer",
    scopes: [],
    userId,
    handle: username ? (username.startsWith("@") ? username : `@${username}`) : null,
    openId: null,
    pageId: null,
    pageToken: null,
    accountType: null,
  };
}

async function writeXFlatToken(token: TokenBlob): Promise<void> {
  await writeAppSetting(X_FLAT_KEYS.access, token.accessToken);
  if (token.refreshToken) await writeAppSetting(X_FLAT_KEYS.refresh, token.refreshToken);
  else await deleteAppSetting(X_FLAT_KEYS.refresh);
  if (token.expiresAt) await writeAppSetting(X_FLAT_KEYS.expires, token.expiresAt);
  else await deleteAppSetting(X_FLAT_KEYS.expires);
  if (token.userId) await writeAppSetting(X_FLAT_KEYS.userId, token.userId);
  else await deleteAppSetting(X_FLAT_KEYS.userId);
  const username = token.handle?.replace(/^@/, "") ?? "";
  if (username) await writeAppSetting(X_FLAT_KEYS.username, username);
  else await deleteAppSetting(X_FLAT_KEYS.username);
}

async function clearXFlatToken(): Promise<void> {
  await deleteAppSetting(X_FLAT_KEYS.access);
  await deleteAppSetting(X_FLAT_KEYS.refresh);
  await deleteAppSetting(X_FLAT_KEYS.expires);
  await deleteAppSetting(X_FLAT_KEYS.userId);
  await deleteAppSetting(X_FLAT_KEYS.username);
}

async function writeToken(id: PublisherId, token: TokenBlob): Promise<void> {
  await writeAppSetting(TOKEN_KEYS[id], JSON.stringify(token));
  if (id === "x") await writeXFlatToken(token);
  if (id === "instagram") await writeIgFlatToken(token);
  if (id === "youtube") await writeYtFlatToken(token);
}

async function readYtFlatToken(): Promise<TokenBlob | null> {
  const accessToken = (await readAppSetting(YT_FLAT_KEYS.access))?.trim() || "";
  if (!accessToken || looksRedacted(accessToken)) return null;
  const refreshToken = (await readAppSetting(YT_FLAT_KEYS.refresh))?.trim() || null;
  const expiresAt = (await readAppSetting(YT_FLAT_KEYS.expires))?.trim() || null;
  const channelId = (await readAppSetting(YT_FLAT_KEYS.channelId))?.trim() || null;
  const channelTitle = (await readAppSetting(YT_FLAT_KEYS.channelTitle))?.trim() || null;
  return {
    accessToken,
    refreshToken,
    expiresAt,
    tokenType: "Bearer",
    scopes: YT_SCOPES,
    userId: channelId,
    handle: channelTitle,
    openId: null,
    pageId: null,
    pageToken: null,
    accountType: null,
  };
}

async function writeYtFlatToken(token: TokenBlob): Promise<void> {
  await writeAppSetting(YT_FLAT_KEYS.access, token.accessToken);
  if (token.refreshToken) await writeAppSetting(YT_FLAT_KEYS.refresh, token.refreshToken);
  else await deleteAppSetting(YT_FLAT_KEYS.refresh);
  if (token.expiresAt) await writeAppSetting(YT_FLAT_KEYS.expires, token.expiresAt);
  else await deleteAppSetting(YT_FLAT_KEYS.expires);
  if (token.userId) await writeAppSetting(YT_FLAT_KEYS.channelId, token.userId);
  else await deleteAppSetting(YT_FLAT_KEYS.channelId);
  if (token.handle) await writeAppSetting(YT_FLAT_KEYS.channelTitle, token.handle);
  else await deleteAppSetting(YT_FLAT_KEYS.channelTitle);
}

async function clearYtFlatToken(): Promise<void> {
  await deleteAppSetting(YT_FLAT_KEYS.access);
  await deleteAppSetting(YT_FLAT_KEYS.refresh);
  await deleteAppSetting(YT_FLAT_KEYS.expires);
  await deleteAppSetting(YT_FLAT_KEYS.channelId);
  await deleteAppSetting(YT_FLAT_KEYS.channelTitle);
}

export async function readYoutubePublishDefaults(): Promise<{
  categoryId: string;
  privacyDefault: "private" | "unlisted" | "public";
}> {
  const categoryId = (await readAppSetting(YT_CATEGORY_KEY))?.trim() || "22";
  const raw = (await readAppSetting(YT_PRIVACY_KEY))?.trim().toLowerCase();
  const privacyDefault =
    raw === "private" || raw === "public" || raw === "unlisted" ? raw : "unlisted";
  return { categoryId: categoryId.slice(0, 8) || "22", privacyDefault };
}

export async function persistYoutubePublishDefaults(input: {
  categoryId?: string;
  privacyDefault?: "private" | "unlisted" | "public";
}): Promise<void> {
  if (input.categoryId !== undefined) {
    const cleaned = input.categoryId.trim().replace(/\D/g, "").slice(0, 8);
    if (cleaned) await writeAppSetting(YT_CATEGORY_KEY, cleaned);
    else await deleteAppSetting(YT_CATEGORY_KEY);
  }
  if (input.privacyDefault) {
    await writeAppSetting(YT_PRIVACY_KEY, input.privacyDefault);
  }
}

async function writeIgFlatToken(token: TokenBlob): Promise<void> {
  await writeAppSetting(IG_FLAT_KEYS.access, token.accessToken);
  if (token.expiresAt) await writeAppSetting(IG_FLAT_KEYS.expires, token.expiresAt);
  else await deleteAppSetting(IG_FLAT_KEYS.expires);
  if (token.userId) await writeAppSetting(IG_FLAT_KEYS.userId, token.userId);
  else await deleteAppSetting(IG_FLAT_KEYS.userId);
  const username = token.handle?.replace(/^@/, "") ?? "";
  if (username) await writeAppSetting(IG_FLAT_KEYS.username, username);
  else await deleteAppSetting(IG_FLAT_KEYS.username);
  if (token.accountType) await writeAppSetting(IG_FLAT_KEYS.accountType, token.accountType);
  else await deleteAppSetting(IG_FLAT_KEYS.accountType);
  if (token.pageId) await writeAppSetting(IG_FLAT_KEYS.pageId, token.pageId);
  else await deleteAppSetting(IG_FLAT_KEYS.pageId);
}

async function clearIgFlatToken(): Promise<void> {
  await deleteAppSetting(IG_FLAT_KEYS.access);
  await deleteAppSetting(IG_FLAT_KEYS.expires);
  await deleteAppSetting(IG_FLAT_KEYS.userId);
  await deleteAppSetting(IG_FLAT_KEYS.username);
  await deleteAppSetting(IG_FLAT_KEYS.accountType);
  await deleteAppSetting(IG_FLAT_KEYS.pageId);
  await deleteAppSetting(IG_PAGE_TOKENS_KEY);
}

export async function clearPublisher(id: PublisherId): Promise<void> {
  await deleteAppSetting(TOKEN_KEYS[id]);
  await deleteAppSetting(APP_KEYS[id].id);
  await deleteAppSetting(APP_KEYS[id].secret);
  if (id === "x") {
    await clearXFlatToken();
    await deleteAppSetting(X_API_BASE_KEY);
  }
  if (id === "instagram") {
    await deleteAppSetting(IG_ACCOUNTS_KEY);
    await clearIgFlatToken();
  }
  if (id === "youtube") {
    await clearYtFlatToken();
    await deleteAppSetting(YT_CATEGORY_KEY);
    await deleteAppSetting(YT_PRIVACY_KEY);
  }
}

export async function disconnectPublisherTokens(id: PublisherId): Promise<void> {
  if (id === "youtube") {
    const token = await readToken("youtube").catch(() => null);
    if (token?.accessToken) {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: token.accessToken }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => undefined);
    }
  }
  await deleteAppSetting(TOKEN_KEYS[id]);
  if (id === "x") await clearXFlatToken();
  if (id === "instagram") {
    await deleteAppSetting(IG_ACCOUNTS_KEY);
    await clearIgFlatToken();
  }
  if (id === "youtube") await clearYtFlatToken();
}

async function withWorkspaceSecrets<T>(fn: () => Promise<T>): Promise<T> {
  const prev = getSecretScope();
  try {
    return await runWithSecretScope(
      {
        userId: prev?.userId ?? "workspace",
        role: "admin",
        inheritWorkspaceApis: true,
      },
      fn,
    );
  } finally {
    if (prev) runWithSecretScope(prev, () => undefined);
  }
}

async function readPending(): Promise<Record<string, PendingOauth>> {
  const raw = await withWorkspaceSecrets(() => readAppSetting(PENDING_KEY));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, PendingOauth>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writePending(pending: Record<string, PendingOauth>): Promise<void> {
  await withWorkspaceSecrets(() => writeAppSetting(PENDING_KEY, JSON.stringify(pending)));
}

export async function startPublisherOAuth(input: {
  provider: PublisherId;
  userId: string;
}): Promise<{ url: string }> {
  const app = await loadPublisherApp(input.provider);
  if (!app) throw new Error("PUBLISHER_APP_MISSING");
  const state = urlSafe(24);
  const verifier = urlSafe(32);
  const pending = await readPending();
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, value] of Object.entries(pending)) {
    if (Date.parse(value.createdAt) < cutoff) delete pending[key];
  }
  pending[state] = {
    provider: input.provider,
    codeVerifier: verifier,
    createdAt: new Date().toISOString(),
    userId: input.userId,
  };
  await writePending(pending);
  const redirect = socialOauthCallbackUrl();
  const url = new URL(
    input.provider === "x"
      ? "https://twitter.com/i/oauth2/authorize"
      : input.provider === "tiktok"
        ? "https://www.tiktok.com/v2/auth/authorize/"
        : input.provider === "youtube"
          ? "https://accounts.google.com/o/oauth2/v2/auth"
          : "https://www.facebook.com/v21.0/dialog/oauth",
  );
  if (input.provider === "x") {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", app.clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", X_SCOPES.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", s256(verifier));
    url.searchParams.set("code_challenge_method", "S256");
  } else if (input.provider === "tiktok") {
    url.searchParams.set("client_key", app.clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", TIKTOK_SCOPES.join(","));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", s256(verifier));
    url.searchParams.set("code_challenge_method", "S256");
  } else if (input.provider === "youtube") {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", app.clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", YT_SCOPES.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", s256(verifier));
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
  } else {
    url.searchParams.set("client_id", app.clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", IG_SCOPES.join(","));
  }
  return { url: url.toString() };
}

export async function completePublisherOAuth(input: {
  code: string;
  state: string;
}): Promise<{ provider: PublisherId }> {
  const pendingAll = await readPending();
  const pending = pendingAll[input.state];
  if (!pending) throw new Error("OAUTH_STATE");
  delete pendingAll[input.state];
  await writePending(pendingAll);
  const app = await loadPublisherApp(pending.provider);
  if (!app) throw new Error("PUBLISHER_APP_MISSING");
  const redirect = socialOauthCallbackUrl();
  const scope = await getOperatorAccess(pending.userId);
  await runWithSecretScope(scope, async () => {
    if (pending.provider === "x") await exchangeX(app, input.code, pending.codeVerifier, redirect);
    else if (pending.provider === "tiktok") {
      await exchangeTikTok(app, input.code, pending.codeVerifier, redirect);
    } else if (pending.provider === "youtube") {
      await exchangeYouTube(app, input.code, pending.codeVerifier, redirect);
    } else {
      await exchangeInstagram(app, input.code, redirect);
    }
  });
  return { provider: pending.provider };
}

async function exchangeX(
  app: { clientId: string; clientSecret: string },
  code: string,
  verifier: string,
  redirect: string,
): Promise<void> {
  const basic = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  const base = await readXApiBase();
  const response = await fetch(`${base}/2/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("OAUTH_EXCHANGE");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  if (!json.access_token) throw new Error("OAUTH_EXCHANGE");
  let handle: string | null = null;
  let userId: string | null = null;
  try {
    const me = await fetch(`${base}/2/users/me`, {
      headers: { Authorization: `Bearer ${json.access_token}` },
      signal: AbortSignal.timeout(12000),
    });
    if (me.ok) {
      const data = (await me.json()) as { data?: { id?: string; username?: string } };
      userId = data.data?.id ?? null;
      handle = data.data?.username ? `@${data.data.username}` : null;
    }
  } catch {
    /* optional */
  }
  await writeToken("x", {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null,
    tokenType: json.token_type ?? "bearer",
    scopes: (json.scope ?? "").split(" ").filter(Boolean),
    userId,
    handle,
    openId: null,
    pageId: null,
    pageToken: null,
    accountType: null,
  });
}

async function exchangeTikTok(
  app: { clientId: string; clientSecret: string },
  code: string,
  verifier: string,
  redirect: string,
): Promise<void> {
  const body = new URLSearchParams({
    client_key: app.clientId,
    client_secret: app.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("OAUTH_EXCHANGE");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    open_id?: string;
  };
  if (!json.access_token) throw new Error("OAUTH_EXCHANGE");
  let handle: string | null = null;
  try {
    const me = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
      headers: { Authorization: `Bearer ${json.access_token}` },
      signal: AbortSignal.timeout(12000),
    });
    if (me.ok) {
      const data = (await me.json()) as {
        data?: { user?: { open_id?: string; display_name?: string } };
      };
      handle = data.data?.user?.display_name ?? null;
    }
  } catch {
    /* optional */
  }
  await writeToken("tiktok", {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null,
    tokenType: json.token_type ?? "Bearer",
    scopes: (json.scope ?? "").split(/[,\s]+/).filter(Boolean),
    userId: json.open_id ?? null,
    handle,
    openId: json.open_id ?? null,
    pageId: null,
    pageToken: null,
    accountType: null,
  });
}

async function exchangeInstagram(
  app: { clientId: string; clientSecret: string },
  code: string,
  redirect: string,
): Promise<void> {
  const shortUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  shortUrl.searchParams.set("client_id", app.clientId);
  shortUrl.searchParams.set("client_secret", app.clientSecret);
  shortUrl.searchParams.set("redirect_uri", redirect);
  shortUrl.searchParams.set("code", code);
  const shortRes = await fetch(shortUrl, { signal: AbortSignal.timeout(20000) });
  if (!shortRes.ok) throw new Error("OAUTH_EXCHANGE");
  const shortJson = (await shortRes.json()) as { access_token?: string };
  if (!shortJson.access_token) throw new Error("OAUTH_EXCHANGE");
  const longUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", app.clientId);
  longUrl.searchParams.set("client_secret", app.clientSecret);
  longUrl.searchParams.set("fb_exchange_token", shortJson.access_token);
  const longRes = await fetch(longUrl, { signal: AbortSignal.timeout(20000) });
  const longJson = longRes.ok
    ? ((await longRes.json()) as { access_token?: string; expires_in?: number })
    : { access_token: shortJson.access_token, expires_in: 60 * 60 };
  const userToken = longJson.access_token ?? shortJson.access_token;
  const { accounts, pageTokens } = await listInstagramAccounts(userToken);
  await writeAppSetting(IG_ACCOUNTS_KEY, JSON.stringify(accounts));
  await writeAppSetting(IG_PAGE_TOKENS_KEY, JSON.stringify(pageTokens));
  const existing = await readToken("instagram");
  const selected = existing?.userId
    ? accounts.find((row) => row.igUserId === existing.userId) ?? null
    : null;
  const keepSelected = Boolean(existing?.userId);
  await writeToken("instagram", {
    accessToken: userToken,
    refreshToken: null,
    expiresAt: longJson.expires_in
      ? new Date(Date.now() + longJson.expires_in * 1000).toISOString()
      : null,
    tokenType: "bearer",
    scopes: IG_SCOPES,
    userId: selected?.igUserId ?? (keepSelected ? existing?.userId ?? null : null),
    handle: selected ? `@${selected.username}` : keepSelected ? existing?.handle ?? null : null,
    openId: null,
    pageId: selected?.pageId ?? (keepSelected ? existing?.pageId ?? null : null),
    pageToken: selected
      ? pageTokens[selected.igUserId] ?? existing?.pageToken ?? null
      : keepSelected
        ? existing?.pageToken ?? null
        : null,
    accountType: selected?.accountType ?? (keepSelected ? existing?.accountType ?? null : null),
  });
}

async function exchangeYouTube(
  app: { clientId: string; clientSecret: string },
  code: string,
  verifier: string,
  redirect: string,
): Promise<void> {
  const body = new URLSearchParams({
    client_id: app.clientId,
    client_secret: app.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("OAUTH_EXCHANGE");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  if (!json.access_token) throw new Error("OAUTH_EXCHANGE");
  let channelId: string | null = null;
  let channelTitle: string | null = null;
  try {
    const me = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${json.access_token}` },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (me.ok) {
      const data = (await me.json()) as {
        items?: Array<{ id?: string; snippet?: { title?: string } }>;
      };
      const item = data.items?.[0];
      channelId = item?.id ?? null;
      channelTitle = item?.snippet?.title ?? null;
    }
  } catch {
    /* optional */
  }
  await writeToken("youtube", {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null,
    tokenType: json.token_type ?? "Bearer",
    scopes: (json.scope ?? YT_SCOPES.join(" ")).split(/\s+/).filter(Boolean),
    userId: channelId,
    handle: channelTitle,
    openId: null,
    pageId: null,
    pageToken: null,
    accountType: null,
  });
}

async function listInstagramAccounts(
  userToken: string,
): Promise<{ accounts: InstagramAccountOption[]; pageTokens: Record<string, string> }> {
  const url = new URL("https://graph.facebook.com/v21.0/me/accounts");
  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username,account_type}",
  );
  url.searchParams.set("access_token", userToken);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) return { accounts: [], pageTokens: {} };
  const json = (await response.json()) as {
    data?: Array<{
      id?: string;
      name?: string;
      access_token?: string;
      instagram_business_account?: { id?: string; username?: string; account_type?: string };
    }>;
  };
  const accounts: InstagramAccountOption[] = [];
  const pageTokens: Record<string, string> = {};
  for (const page of json.data ?? []) {
    const ig = page.instagram_business_account;
    if (page.id && ig?.id) {
      accounts.push({
        pageId: page.id,
        pageName: page.name ?? page.id,
        igUserId: ig.id,
        username: ig.username ?? ig.id,
        accountType: mapIgAccountType(ig.account_type),
      });
      if (page.access_token) pageTokens[ig.id] = page.access_token;
    }
  }
  return { accounts, pageTokens };
}

async function readPageTokens(): Promise<Record<string, string>> {
  const raw = await readAppSetting(IG_PAGE_TOKENS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function readInstagramAccounts(): Promise<InstagramAccountOption[]> {
  const raw = await readAppSetting(IG_ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as InstagramAccountOption[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => ({
      ...row,
      accountType: mapIgAccountType(row.accountType),
    }));
  } catch {
    return [];
  }
}

export async function selectInstagramAccount(igUserId: string): Promise<void> {
  const accounts = await readInstagramAccounts();
  const match = accounts.find((row) => row.igUserId === igUserId);
  if (!match) throw new Error("IG_ACCOUNT_MISSING");
  const token = await readToken("instagram");
  if (!token) throw new Error("PUBLISHER_NOT_CONNECTED");
  const pageTokens = await readPageTokens();
  await writeToken("instagram", {
    ...token,
    userId: match.igUserId,
    handle: `@${match.username}`,
    pageId: match.pageId,
    pageToken: pageTokens[match.igUserId] ?? token.pageToken,
    accountType: match.accountType,
  });
}

export async function readTikTokPublishMode(): Promise<"inbox" | "direct"> {
  const raw = (await readAppSetting(TIKTOK_MODE_KEY))?.trim();
  return raw === "direct" ? "direct" : "inbox";
}

export async function setTikTokPublishMode(mode: "inbox" | "direct"): Promise<void> {
  await writeAppSetting(TIKTOK_MODE_KEY, mode);
}

export async function readTikTokAuditStatus(): Promise<TikTokAuditStatus> {
  const raw = (await readAppSetting(TIKTOK_AUDIT_KEY))?.trim().toUpperCase();
  if (raw === "AUDITED" || raw === "UNKNOWN") return raw;
  return "UNAUDITED";
}

export async function setTikTokAuditStatus(status: TikTokAuditStatus): Promise<void> {
  await writeAppSetting(TIKTOK_AUDIT_KEY, status);
}

export async function readTikTokVerifiedDomain(): Promise<string | null> {
  const raw = (await readAppSetting(TIKTOK_DOMAIN_KEY))?.trim() || "";
  return raw || null;
}

export async function setTikTokVerifiedDomain(domain: string): Promise<void> {
  const cleaned = domain.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  if (!cleaned) {
    await deleteAppSetting(TIKTOK_DOMAIN_KEY);
    return;
  }
  await writeAppSetting(TIKTOK_DOMAIN_KEY, cleaned.slice(0, 200));
}

export async function forceRefreshToken(id: PublisherId): Promise<TokenBlob> {
  const token = await readToken(id);
  if (!token) throw new Error("PUBLISHER_NOT_CONNECTED");
  if (id !== "instagram" && !token.refreshToken) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const app = await loadPublisherApp(id);
  if (!app) throw new Error("PUBLISHER_APP_MISSING");
  if (id === "x") return refreshX(app, token);
  if (id === "tiktok") return refreshTikTok(app, token);
  if (id === "instagram") return refreshInstagram(app, token);
  if (id === "youtube") return refreshYouTube(app, token);
  throw new Error("PUBLISHER_TOKEN_EXPIRED");
}

export async function ensureFreshToken(id: PublisherId): Promise<TokenBlob> {
  const token = await readToken(id);
  if (!token) throw new Error("PUBLISHER_NOT_CONNECTED");
  const expires = token.expiresAt ? Date.parse(token.expiresAt) : 0;
  const soon = Date.now() + 5 * 60 * 1000;
  if (!expires || expires > soon) return token;
  return forceRefreshToken(id);
}

async function refreshX(
  app: { clientId: string; clientSecret: string },
  token: TokenBlob,
): Promise<TokenBlob> {
  const basic = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64");
  const base = await readXApiBase();
  const response = await fetch(`${base}/2/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken ?? "",
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!json.access_token) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const next: TokenBlob = {
    ...token,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? token.refreshToken,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : token.expiresAt,
    scopes: json.scope ? json.scope.split(" ").filter(Boolean) : token.scopes,
  };
  await writeToken("x", next);
  return next;
}

async function refreshTikTok(
  app: { clientId: string; clientSecret: string },
  token: TokenBlob,
): Promise<TokenBlob> {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: app.clientId,
      client_secret: app.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken ?? "",
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!json.access_token) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const next: TokenBlob = {
    ...token,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? token.refreshToken,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : token.expiresAt,
    scopes: json.scope ? json.scope.split(/[,\s]+/).filter(Boolean) : token.scopes,
  };
  await writeToken("tiktok", next);
  return next;
}

async function refreshInstagram(
  app: { clientId: string; clientSecret: string },
  token: TokenBlob,
): Promise<TokenBlob> {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", app.clientId);
  url.searchParams.set("client_secret", app.clientSecret);
  url.searchParams.set("fb_exchange_token", token.accessToken);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const { accounts, pageTokens } = await listInstagramAccounts(json.access_token);
  await writeAppSetting(IG_ACCOUNTS_KEY, JSON.stringify(accounts));
  await writeAppSetting(IG_PAGE_TOKENS_KEY, JSON.stringify(pageTokens));
  const selectedId = token.userId;
  const selected = selectedId ? accounts.find((row) => row.igUserId === selectedId) : undefined;
  const next: TokenBlob = {
    ...token,
    accessToken: json.access_token,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : token.expiresAt,
    pageToken: selectedId ? pageTokens[selectedId] ?? token.pageToken : token.pageToken,
    pageId: selected?.pageId ?? token.pageId,
    handle: selected ? `@${selected.username}` : token.handle,
    accountType: selected?.accountType ?? token.accountType,
  };
  await writeToken("instagram", next);
  return next;
}

async function refreshYouTube(
  app: { clientId: string; clientSecret: string },
  token: TokenBlob,
): Promise<TokenBlob> {
  if (!token.refreshToken) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!json.access_token) throw new Error("PUBLISHER_TOKEN_EXPIRED");
  const next: TokenBlob = {
    ...token,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? token.refreshToken,
    expiresAt: json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : token.expiresAt,
    scopes: json.scope ? json.scope.split(/\s+/).filter(Boolean) : token.scopes,
  };
  await writeToken("youtube", next);
  return next;
}

export async function testPublisherConnection(id: PublisherId): Promise<void> {
  const app = await loadPublisherApp(id);
  if (!app) throw new Error("PUBLISHER_APP_MISSING");
  const token = await readToken(id);
  if (!token) throw new Error("PUBLISHER_NOT_CONNECTED");
  const fresh = await ensureFreshToken(id);
  if (id === "x") {
    const base = await readXApiBase();
    const response = await fetch(`${base}/2/users/me`, {
      headers: { Authorization: `Bearer ${fresh.accessToken}` },
      signal: AbortSignal.timeout(12000),
    });
    if (response.status === 401 || response.status === 403) throw new Error("PUBLISHER_NOT_CONNECTED");
    if (!response.ok) throw new Error("PUBLISHER_UNAVAILABLE");
    try {
      const data = (await response.json()) as { data?: { id?: string; username?: string } };
      if (data.data?.username) {
        await writeToken("x", {
          ...fresh,
          userId: data.data.id ?? fresh.userId,
          handle: `@${data.data.username}`,
        });
      }
    } catch {
      /* optional profile refresh */
    }
    return;
  }
  if (id === "tiktok") {
    const response = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
      {
        headers: { Authorization: `Bearer ${fresh.accessToken}` },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (response.status === 401) throw new Error("PUBLISHER_NOT_CONNECTED");
    if (!response.ok) throw new Error("PUBLISHER_UNAVAILABLE");
    try {
      const data = (await response.json()) as {
        data?: { user?: { open_id?: string; display_name?: string } };
      };
      const openId = data.data?.user?.open_id ?? fresh.openId;
      const handle = data.data?.user?.display_name ?? fresh.handle;
      await writeToken("tiktok", { ...fresh, openId, userId: openId, handle });
    } catch {
      /* optional profile refresh */
    }
    return;
  }
  if (id === "youtube") {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${fresh.accessToken}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.status === 401) throw new Error("PUBLISHER_NOT_CONNECTED");
    if (response.status === 403) {
      const text = await response.text().catch(() => "");
      if (/quotaExceeded/i.test(text)) throw new Error("YOUTUBE_QUOTA");
      throw new Error("PUBLISHER_UNAVAILABLE");
    }
    if (!response.ok) throw new Error("PUBLISHER_UNAVAILABLE");
    try {
      const data = (await response.json()) as {
        items?: Array<{ id?: string; snippet?: { title?: string } }>;
      };
      const item = data.items?.[0];
      if (item?.id) {
        await writeToken("youtube", {
          ...fresh,
          userId: item.id,
          handle: item.snippet?.title ?? fresh.handle,
        });
      }
    } catch {
      /* optional profile refresh */
    }
    return;
  }
  if (!fresh.userId) throw new Error("IG_PROFESSIONAL_REQUIRED");
  const access = fresh.pageToken || fresh.accessToken;
  const url = new URL(`https://graph.facebook.com/v21.0/${fresh.userId}`);
  url.searchParams.set("fields", "id,username,account_type");
  url.searchParams.set("access_token", access);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (response.status === 400 || response.status === 401) throw new Error("IG_PROFESSIONAL_REQUIRED");
  if (!response.ok) throw new Error("PUBLISHER_UNAVAILABLE");
  try {
    const data = (await response.json()) as {
      id?: string;
      username?: string;
      account_type?: string;
    };
    if (data.username || data.account_type) {
      await writeToken("instagram", {
        ...fresh,
        userId: data.id ?? fresh.userId,
        handle: data.username ? `@${data.username}` : fresh.handle,
        accountType: data.account_type ?? fresh.accountType,
      });
    }
  } catch {
    /* optional */
  }
}

export async function publisherStatusFor(platform: SocialPlatform): Promise<PublisherStatus> {
  const id: PublisherId =
    platform === "x"
      ? "x"
      : platform === "tiktok"
        ? "tiktok"
        : platform === "youtube"
          ? "youtube"
          : "instagram";
  const base = emptyPublisherStatus(platform);
  const app = await loadPublisherApp(id);
  const token = await readToken(id);
  const appConfigured = Boolean(app);
  const connected = Boolean(token?.accessToken);
  let eligible = connected;
  let reason = base.reason;
  if (!appConfigured) reason = "Save the app client ID and secret, then Connect.";
  else if (!connected) reason = "App saved. Connect with OAuth to publish via API.";
  else reason = null;
  if (platform === "instagram" && connected && !token?.userId) {
    eligible = false;
    reason = "Select a professional Instagram account. Personal accounts cannot publish via API.";
  }
  const expiresAt = token?.expiresAt ? Date.parse(token.expiresAt) : NaN;
  const expired = Boolean(token && Number.isFinite(expiresAt) && expiresAt < Date.now());
  const tokenExpired = expired && !token?.refreshToken;
  let tiktok = platform === "tiktok" ? emptyTikTokDetails() : null;
  let instagram = platform === "instagram" ? emptyInstagramDetails() : null;
  let youtube = platform === "youtube" ? emptyYoutubeDetails() : null;
  if (platform === "tiktok") {
    const { getTikTokPublisherSnapshot } = await import("@/lib/server/tiktok-publisher.server");
    tiktok = await getTikTokPublisherSnapshot();
    if (connected && !tokenExpired) {
      eligible = tiktok.eligibleInbox;
      if (!eligible) reason = "Reconnect TikTok with video.upload to send inbox drafts.";
      else if (!tiktok.eligibleDirectPost) {
        reason =
          tiktok.auditStatus === "AUDITED"
            ? "Inbox drafts are ready. Direct Post needs the video.publish scope."
            : "Public Direct Post may be limited — using Upload to inbox (draft) by default.";
      } else {
        reason = null;
      }
    }
  }
  if (platform === "instagram") {
    const { getInstagramPublisherSnapshot } = await import("@/lib/server/instagram-publisher.server");
    instagram = await getInstagramPublisherSnapshot();
    if (connected) {
      if ((token?.accountType ?? "").toUpperCase() === "PERSONAL") {
        eligible = false;
        reason = "API publish requires an Instagram Professional account. Use Computer Use for personal logins.";
      } else if (!token?.userId) {
        eligible = false;
        reason = "Select a professional Instagram account after connecting.";
      } else {
        eligible = instagram.eligibleReelsPublish;
        reason = eligible
          ? null
          : "API publish requires an Instagram Professional account.";
      }
    }
  }
  if (platform === "youtube") {
    const { getYouTubePublisherSnapshot } = await import("@/lib/server/youtube-publisher.server");
    youtube = await getYouTubePublisherSnapshot();
    if (connected && !tokenExpired) {
      eligible = youtube.eligible;
      reason = eligible
        ? null
        : "Connect YouTube with youtube.upload to publish via API. Browser rail remains available.";
    }
  }
  if (tokenExpired) {
    eligible = false;
    reason = "Token expired. Reconnect to publish via API.";
  }
  return {
    ...base,
    appConfigured,
    connected,
    eligible,
    tokenExpired,
    handle: token?.handle ?? tiktok?.displayName ?? instagram?.username ?? youtube?.channelTitle ?? null,
    accountId: token?.userId ?? token?.openId ?? youtube?.channelId ?? null,
    last4: last4(app?.clientId ?? null),
    reason,
    scopes: token?.scopes ?? [],
    tiktok,
    instagram,
    youtube,
  };
}
