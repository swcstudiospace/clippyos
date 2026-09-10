import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { hashToken, rateLimitOrThrow, type AutonomyActor } from "@/lib/server/autonomy-auth.server";
import { hermesScopesFromMcp, parseMcpScopes, uniqueMcpScopes, type McpScope } from "@/lib/remote-mcp";
import { REMOTE_MCP_RATE } from "@/lib/remote-mcp";
import {
  MCP_OAUTH_ACCESS_PREFIX,
  MCP_OAUTH_ACCESS_TTL_SEC,
  MCP_OAUTH_CODE_PREFIX,
  MCP_OAUTH_CODE_TTL_SEC,
  MCP_OAUTH_REFRESH_PREFIX,
  MCP_OAUTH_REFRESH_TTL_SEC,
  isAllowedOAuthRedirectUri,
  mcpResourceUrl,
  parseRedirectUris,
  requestedMcpScopes,
  scopeString,
  stripTrailingSlash,
  type McpOAuthGrantRow,
} from "@/lib/mcp-oauth";
import { mcpResourcesEquivalent, originFromRequest } from "@/lib/app-hosts";

const SCHEMA_STATEMENTS = [
  `create table if not exists mcp_oauth_clients (
    client_id text primary key,
    client_name text not null,
    redirect_uris text not null,
    token_endpoint_auth_method text not null default 'none',
    grant_types text not null,
    response_types text not null,
    scope text,
    client_uri text,
    software_id text,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists mcp_oauth_codes (
    code_hash text primary key,
    client_id text not null,
    user_id text not null,
    redirect_uri text not null,
    code_challenge text not null,
    code_challenge_method text not null,
    scope text not null,
    resource text not null,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists mcp_oauth_codes_expires_idx on mcp_oauth_codes (expires_at)`,
  `create table if not exists mcp_oauth_tokens (
    id text primary key,
    access_token_hash text not null,
    refresh_token_hash text,
    client_id text not null,
    user_id text not null,
    scope text not null,
    resource text not null,
    access_expires_at timestamptz not null,
    refresh_expires_at timestamptz,
    revoked_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists mcp_oauth_tokens_access_uidx on mcp_oauth_tokens (access_token_hash)`,
  `create unique index if not exists mcp_oauth_tokens_refresh_uidx on mcp_oauth_tokens (refresh_token_hash) where refresh_token_hash is not null`,
  `create index if not exists mcp_oauth_tokens_client_idx on mcp_oauth_tokens (client_id)`,
];

let schemaReady: Promise<void> | null = null;

export async function ensureMcpOAuthSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    for (const statement of SCHEMA_STATEMENTS) {
      try {
        await sql.query(statement);
      } catch {
        /* already applied, or this statement isn't valid on the remote path */
      }
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function randomToken(prefix: string, bytes = 24): string {
  return `${prefix}${randomBytes(bytes).toString("hex")}`;
}

export function requestOrigin(request: Request): string {
  return stripTrailingSlash(originFromRequest(request));
}

export function canonicalMcpResource(origin: string): string {
  return mcpResourceUrl(origin);
}

export function resourcesMatch(left: string, right: string): boolean {
  return mcpResourcesEquivalent(left, right);
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  if (!verifier || verifier.length < 43 || verifier.length > 128) return false;
  if (!/^[A-Za-z0-9._~-]+$/.test(verifier)) return false;
  const digest = createHash("sha256").update(verifier).digest();
  const computed = digest.toString("base64url");
  const expected = Buffer.from(challenge);
  const actual = Buffer.from(computed);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export type McpOAuthClient = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  createdAt: string;
};

function mapClient(row: Record<string, unknown>): McpOAuthClient {
  let redirectUris: string[] = [];
  try {
    redirectUris = parseRedirectUris(JSON.parse(String(row.redirect_uris ?? "[]")));
  } catch {
    redirectUris = parseRedirectUris(row.redirect_uris);
  }
  return {
    clientId: String(row.client_id ?? ""),
    clientName: String(row.client_name ?? "MCP client"),
    redirectUris,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function registerMcpOAuthClient(input: {
  clientName?: string;
  redirectUris: unknown;
  scope?: string;
  clientUri?: string;
  softwareId?: string;
  tokenEndpointAuthMethod?: string;
}): Promise<{
  client_id: string;
  client_id_issued_at: number;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  code_challenge_methods: string[];
}> {
  await ensureMcpOAuthSchema();
  const redirectUris = parseRedirectUris(input.redirectUris);
  if (redirectUris.length === 0) throw new Error("invalid_redirect_uri");
  const method = (input.tokenEndpointAuthMethod ?? "none").trim() || "none";
  if (method !== "none") throw new Error("invalid_client_metadata");
  const clientId = `cos_cli_${randomBytes(16).toString("hex")}`;
  const clientName = (input.clientName ?? "").trim().slice(0, 80) || "MCP client";
  const stamp = nowIso();
  const row = {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: JSON.stringify(redirectUris),
    token_endpoint_auth_method: "none",
    grant_types: JSON.stringify(["authorization_code", "refresh_token"]),
    response_types: JSON.stringify(["code"]),
    scope: input.scope ?? scopeString(requestedMcpScopes("")),
    client_uri: input.clientUri ?? null,
    software_id: input.softwareId ?? null,
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("mcp_oauth_clients").insert(row);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) {
      return {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.parse(stamp) / 1000),
        client_name: clientName,
        redirect_uris: redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        code_challenge_methods: ["S256"],
      };
    }
  }
  const sql = await localSql();
  await sql.query(
    `insert into mcp_oauth_clients (client_id, client_name, redirect_uris, token_endpoint_auth_method, grant_types, response_types, scope, client_uri, software_id, created_at)
     values ($1,$2,$3,'none',$4,$5,$6,$7,$8,$9)`,
    [
      clientId,
      clientName,
      row.redirect_uris,
      row.grant_types,
      row.response_types,
      row.scope,
      row.client_uri,
      row.software_id,
      stamp,
    ],
  );
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.parse(stamp) / 1000),
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    code_challenge_methods: ["S256"],
  };
}

export async function getMcpOAuthClient(clientId: string): Promise<McpOAuthClient | null> {
  await ensureMcpOAuthSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("mcp_oauth_clients").select("*").eq("client_id", clientId).maybeSingle();
    if (!error) return data ? mapClient(data as Record<string, unknown>) : null;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from mcp_oauth_clients where client_id = $1 limit 1",
      [clientId],
    );
    return rows[0] ? mapClient(rows[0]) : null;
  } catch {
    return null;
  }
}

export type AuthorizeRequest = {
  responseType: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  resource: string;
};

export function parseAuthorizeRequest(params: URLSearchParams, origin: string): AuthorizeRequest {
  return {
    responseType: (params.get("response_type") ?? "").trim(),
    clientId: (params.get("client_id") ?? "").trim(),
    redirectUri: (params.get("redirect_uri") ?? "").trim(),
    state: (params.get("state") ?? "").trim(),
    codeChallenge: (params.get("code_challenge") ?? "").trim(),
    codeChallengeMethod: (params.get("code_challenge_method") ?? "S256").trim() || "S256",
    scope: (params.get("scope") ?? "").trim(),
    resource: (params.get("resource") ?? canonicalMcpResource(origin)).trim(),
  };
}

export type ConsentPreview = {
  signedIn: boolean;
  isAdmin: boolean;
  clientName: string;
  clientId: string;
  redirectHost: string;
  scopes: McpScope[];
  scopeLabels: string;
  resource: string;
  error: string | null;
};

export async function previewMcpOAuthConsent(input: {
  params: AuthorizeRequest;
  origin: string;
  userId: string | null;
  isAdmin: boolean;
}): Promise<ConsentPreview> {
  const empty: ConsentPreview = {
    signedIn: Boolean(input.userId),
    isAdmin: input.isAdmin,
    clientName: "",
    clientId: input.params.clientId,
    redirectHost: "",
    scopes: [],
    scopeLabels: "",
    resource: input.params.resource,
    error: null,
  };
  if (input.params.responseType !== "code") {
    return { ...empty, error: "This connector must use the authorization code flow." };
  }
  if (!input.params.clientId) return { ...empty, error: "Missing client. Start the connection from Grok again." };
  if (input.params.codeChallengeMethod !== "S256" || !input.params.codeChallenge) {
    return { ...empty, error: "This connector must use PKCE (S256)." };
  }
  const client = await getMcpOAuthClient(input.params.clientId);
  if (!client) return { ...empty, error: "Unknown connector. Grok needs to register again." };
  if (!client.redirectUris.includes(input.params.redirectUri) || !isAllowedOAuthRedirectUri(input.params.redirectUri)) {
    return { ...empty, error: "Redirect doesn’t match the registered connector." };
  }
  const expectedResource = canonicalMcpResource(input.origin);
  if (input.params.resource && !resourcesMatch(input.params.resource, expectedResource)) {
    return { ...empty, error: "This token is only valid for the ClippyOS MCP server." };
  }
  let redirectHost = input.params.redirectUri;
  try {
    redirectHost = new URL(input.params.redirectUri).host;
  } catch {
    /* keep raw */
  }
  const scopes = requestedMcpScopes(input.params.scope);
  const { scopeSummary } = await import("@/lib/mcp-oauth");
  return {
    signedIn: Boolean(input.userId),
    isAdmin: input.isAdmin,
    clientName: client.clientName,
    clientId: client.clientId,
    redirectHost,
    scopes,
    scopeLabels: scopeSummary(scopes),
    resource: expectedResource,
    error: null,
  };
}

export async function issueMcpAuthorizationCode(input: {
  params: AuthorizeRequest;
  origin: string;
  userId: string;
}): Promise<{ redirectUrl: string }> {
  const preview = await previewMcpOAuthConsent({
    params: input.params,
    origin: input.origin,
    userId: input.userId,
    isAdmin: true,
  });
  if (preview.error) throw new Error(preview.error);
  await ensureMcpOAuthSchema();
  const plaintext = randomToken(MCP_OAUTH_CODE_PREFIX, 24);
  const stamp = nowIso();
  const expires = new Date(Date.now() + MCP_OAUTH_CODE_TTL_SEC * 1000).toISOString();
  const row = {
    code_hash: hashToken(plaintext),
    client_id: input.params.clientId,
    user_id: input.userId,
    redirect_uri: input.params.redirectUri,
    code_challenge: input.params.codeChallenge,
    code_challenge_method: "S256",
    scope: scopeString(preview.scopes),
    resource: canonicalMcpResource(input.origin),
    expires_at: expires,
    used_at: null as string | null,
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("mcp_oauth_codes").insert(row);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) {
      const { appendOAuthQuery } = await import("@/lib/mcp-oauth");
      return {
        redirectUrl: appendOAuthQuery(input.params.redirectUri, {
          code: plaintext,
          state: input.params.state || undefined,
        }),
      };
    }
  }
  const sql = await localSql();
  await sql.query(
    `insert into mcp_oauth_codes (code_hash, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, scope, resource, expires_at, used_at, created_at)
     values ($1,$2,$3,$4,$5,'S256',$6,$7,$8,null,$9)`,
    [
      row.code_hash,
      row.client_id,
      row.user_id,
      row.redirect_uri,
      row.code_challenge,
      row.scope,
      row.resource,
      expires,
      stamp,
    ],
  );
  const { appendOAuthQuery } = await import("@/lib/mcp-oauth");
  return {
    redirectUrl: appendOAuthQuery(input.params.redirectUri, {
      code: plaintext,
      state: input.params.state || undefined,
    }),
  };
}

export async function denyMcpAuthorization(input: {
  params: AuthorizeRequest;
}): Promise<{ redirectUrl: string }> {
  if (!input.params.redirectUri || !isAllowedOAuthRedirectUri(input.params.redirectUri)) {
    throw new Error("Redirect doesn’t match the registered connector.");
  }
  const client = await getMcpOAuthClient(input.params.clientId);
  if (!client || !client.redirectUris.includes(input.params.redirectUri)) {
    throw new Error("Redirect doesn’t match the registered connector.");
  }
  const { appendOAuthQuery } = await import("@/lib/mcp-oauth");
  return {
    redirectUrl: appendOAuthQuery(input.params.redirectUri, {
      error: "access_denied",
      error_description: "The operator declined this connection.",
      state: input.params.state || undefined,
    }),
  };
}

type CodeRow = {
  code_hash: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  resource: string;
  expires_at: string;
  used_at: string | null;
};

async function claimAuthorizationCode(digest: string): Promise<CodeRow | null> {
  await ensureMcpOAuthSchema();
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("mcp_oauth_codes")
      .update({ used_at: stamp })
      .eq("code_hash", digest)
      .is("used_at", null)
      .gt("expires_at", stamp)
      .select("*");
    if (!error) {
      const rows = (data ?? []) as CodeRow[];
      return rows[0] ?? null;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<CodeRow>(
      "update mcp_oauth_codes set used_at = $2 where code_hash = $1 and used_at is null and expires_at > now() returning *",
      [digest, stamp],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

type TokenRow = Record<string, unknown> & { id: string };

async function lookupTokenByHash(column: "access_token_hash" | "refresh_token_hash", digest: string): Promise<TokenRow | null> {
  await ensureMcpOAuthSchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("mcp_oauth_tokens").select("*").eq(column, digest).maybeSingle();
    if (!error) return (data as TokenRow | null) ?? null;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<TokenRow>(`select * from mcp_oauth_tokens where ${column} = $1 limit 1`, [digest]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function insertTokenRow(row: Record<string, unknown>): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("mcp_oauth_tokens").insert(row);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) return;
  }
  const sql = await localSql();
  await sql.query(
    `insert into mcp_oauth_tokens (id, access_token_hash, refresh_token_hash, client_id, user_id, scope, resource, access_expires_at, refresh_expires_at, revoked_at, last_used_at, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,null,$10)`,
    [
      row.id,
      row.access_token_hash,
      row.refresh_token_hash,
      row.client_id,
      row.user_id,
      row.scope,
      row.resource,
      row.access_expires_at,
      row.refresh_expires_at,
      row.created_at,
    ],
  );
}

async function claimRefreshToken(digest: string): Promise<TokenRow | null> {
  await ensureMcpOAuthSchema();
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("mcp_oauth_tokens")
      .update({ revoked_at: stamp })
      .eq("refresh_token_hash", digest)
      .is("revoked_at", null)
      .select("*");
    if (!error) {
      const rows = (data ?? []) as TokenRow[];
      return rows[0] ?? null;
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<TokenRow>(
      "update mcp_oauth_tokens set revoked_at = $2 where refresh_token_hash = $1 and revoked_at is null returning *",
      [digest, stamp],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function mintTokenPair(input: {
  clientId: string;
  userId: string;
  scope: string;
  resource: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const access = randomToken(MCP_OAUTH_ACCESS_PREFIX, 24);
  const refresh = randomToken(MCP_OAUTH_REFRESH_PREFIX, 24);
  const stamp = nowIso();
  await insertTokenRow({
    id: newId(),
    access_token_hash: hashToken(access),
    refresh_token_hash: hashToken(refresh),
    client_id: input.clientId,
    user_id: input.userId,
    scope: input.scope,
    resource: input.resource,
    access_expires_at: new Date(Date.now() + MCP_OAUTH_ACCESS_TTL_SEC * 1000).toISOString(),
    refresh_expires_at: new Date(Date.now() + MCP_OAUTH_REFRESH_TTL_SEC * 1000).toISOString(),
    revoked_at: null,
    last_used_at: null,
    created_at: stamp,
  });
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: MCP_OAUTH_ACCESS_TTL_SEC,
    scope: input.scope,
  };
}

export async function exchangeMcpAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier: string;
  resource?: string;
  origin: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  if (!input.code.startsWith(MCP_OAUTH_CODE_PREFIX)) throw new Error("invalid_grant");
  const row = await claimAuthorizationCode(hashToken(input.code));
  if (!row) throw new Error("invalid_grant");
  if (row.client_id !== input.clientId) throw new Error("invalid_grant");
  if (row.redirect_uri !== input.redirectUri) throw new Error("invalid_grant");
  if (row.code_challenge_method !== "S256" || !verifyPkceS256(input.codeVerifier, row.code_challenge)) {
    throw new Error("invalid_grant");
  }
  const expectedResource = row.resource || canonicalMcpResource(input.origin);
  if (input.resource && !resourcesMatch(input.resource, expectedResource)) throw new Error("invalid_target");
  return mintTokenPair({
    clientId: row.client_id,
    userId: row.user_id,
    scope: row.scope,
    resource: expectedResource,
  });
}

export async function refreshMcpOAuthToken(input: {
  refreshToken: string;
  clientId?: string;
  resource?: string;
  origin: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  if (!input.refreshToken.startsWith(MCP_OAUTH_REFRESH_PREFIX)) throw new Error("invalid_grant");
  const row = await claimRefreshToken(hashToken(input.refreshToken));
  if (!row) throw new Error("invalid_grant");
  const refreshExp = row.refresh_expires_at ? Date.parse(String(row.refresh_expires_at)) : NaN;
  if (Number.isFinite(refreshExp) && refreshExp < Date.now()) throw new Error("invalid_grant");
  const tokenClientId = String(row.client_id ?? "");
  if (input.clientId) {
    if (input.clientId !== tokenClientId) throw new Error("invalid_grant");
  } else if (tokenClientId) {
    throw new Error("invalid_grant");
  }
  const expectedResource = String(row.resource ?? canonicalMcpResource(input.origin));
  if (input.resource && !resourcesMatch(input.resource, expectedResource)) throw new Error("invalid_target");
  return mintTokenPair({
    clientId: String(row.client_id),
    userId: String(row.user_id),
    scope: String(row.scope ?? ""),
    resource: expectedResource,
  });
}

async function touchOAuthToken(id: string): Promise<void> {
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("mcp_oauth_tokens").update({ last_used_at: stamp }).eq("id", id);
    return;
  }
  try {
    const sql = await localSql();
    await sql.query("update mcp_oauth_tokens set last_used_at = $2 where id = $1", [id, stamp]);
  } catch {
    /* ignore */
  }
}

export async function authenticateMcpOAuthAccessToken(token: string): Promise<AutonomyActor> {
  if (!token.startsWith(MCP_OAUTH_ACCESS_PREFIX)) throw new Error("UNAUTHORIZED");
  const row = await lookupTokenByHash("access_token_hash", hashToken(token));
  if (!row) throw new Error("UNAUTHORIZED");
  if (row.revoked_at) throw new Error("TOKEN_REVOKED");
  const exp = Date.parse(String(row.access_expires_at ?? ""));
  if (!Number.isFinite(exp) || exp < Date.now()) throw new Error("UNAUTHORIZED");
  const mcpScopes = uniqueMcpScopes(parseMcpScopes(String(row.scope ?? "").split(/\s+/)));
  if (mcpScopes.length === 0) throw new Error("UNAUTHORIZED");
  rateLimitOrThrow(
    `mcp-oauth:${row.id}`,
    REMOTE_MCP_RATE.toolsPerMinute,
    60_000,
    REMOTE_MCP_RATE.burst,
    REMOTE_MCP_RATE.burstWindowMs,
  );
  void touchOAuthToken(String(row.id));
  const client = await getMcpOAuthClient(String(row.client_id ?? ""));
  return {
    source: "mcp",
    keyId: String(row.id),
    label: client?.clientName ? `OAuth · ${client.clientName}` : "OAuth connector",
    scopes: hermesScopesFromMcp(mcpScopes),
    catalog: "remote",
    mcpScopes,
  };
}

export async function listMcpOAuthGrants(): Promise<McpOAuthGrantRow[]> {
  await ensureMcpOAuthSchema();
  let rows: Record<string, unknown>[] = [];
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("mcp_oauth_tokens").select("*").order("created_at", { ascending: false });
    if (!error) rows = (data ?? []) as Record<string, unknown>[];
    else if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  } else {
    try {
      const sql = await localSql();
      rows = await sql.query<Record<string, unknown>>("select * from mcp_oauth_tokens order by created_at desc");
    } catch {
      rows = [];
    }
  }
  const clients = new Map<string, string>();
  const out: McpOAuthGrantRow[] = [];
  for (const row of rows) {
    const clientId = String(row.client_id ?? "");
    if (!clients.has(clientId)) {
      const client = await getMcpOAuthClient(clientId);
      clients.set(clientId, client?.clientName ?? "MCP client");
    }
    out.push({
      id: String(row.id ?? ""),
      clientId,
      clientName: clients.get(clientId) ?? "MCP client",
      scopes: uniqueMcpScopes(parseMcpScopes(String(row.scope ?? "").split(/\s+/))),
      lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
      createdAt: String(row.created_at ?? ""),
      accessExpiresAt: String(row.access_expires_at ?? ""),
      revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    });
  }
  return out;
}

export async function revokeMcpOAuthGrant(id: string): Promise<void> {
  await ensureMcpOAuthSchema();
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("mcp_oauth_tokens").update({ revoked_at: stamp }).eq("id", id).is("revoked_at", null);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    if (!error) return;
  }
  const sql = await localSql();
  await sql.query("update mcp_oauth_tokens set revoked_at = $2 where id = $1 and revoked_at is null", [id, stamp]);
}

export async function hasActiveMcpOAuthGrant(): Promise<boolean> {
  const grants = await listMcpOAuthGrants();
  return grants.some((row) => !row.revokedAt && Date.parse(row.accessExpiresAt) > Date.now() - MCP_OAUTH_REFRESH_TTL_SEC * 1000);
}

export async function countActiveMcpOAuthGrants(): Promise<number> {
  const grants = await listMcpOAuthGrants();
  return grants.filter((row) => !row.revokedAt).length;
}
