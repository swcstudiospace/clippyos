import { createHash } from "node:crypto";
import { sanitizeText } from "@/lib/sanitize";
import { publicOrigin } from "@/lib/server/public-origin";
import {
  DEFAULT_MCP_PRESET,
  MCP_PRESET_IDS,
  MCP_PRESET_LABELS,
  MCP_SCOPE_PRESETS,
  REMOTE_MCP_RATE,
  canonicalizeMcpArgs,
  parseMcpScopes,
  scopesForPreset,
  uniqueMcpScopes,
  type McpPresetId,
  type McpScope,
  type RemoteMcpSnapshot,
  type RemoteMcpTokenRow,
} from "@/lib/remote-mcp";
import {
  generateRemoteMcpTokenPlaintext,
  insertApiKey,
  listRemoteMcpKeyRows,
  rateLimitOrThrow,
  revokeApiKey,
} from "@/lib/server/autonomy-auth.server";

export function digestMcpArgs(input: unknown): string {
  return createHash("sha256").update(canonicalizeMcpArgs(input)).digest("hex").slice(0, 32);
}

function mapToken(row: Record<string, unknown>): RemoteMcpTokenRow {
  return {
    id: String(row.id ?? ""),
    label: String(row.name ?? ""),
    last4: String(row.last4 ?? ""),
    keyPrefix: String(row.key_prefix ?? ""),
    scopes: parseMcpScopes(row.scopes),
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function listRemoteMcpTokens(): Promise<RemoteMcpTokenRow[]> {
  const rows = await listRemoteMcpKeyRows();
  return rows.map(mapToken);
}

export async function mintRemoteMcpToken(input: {
  label: string;
  scopes?: readonly string[];
  preset?: McpPresetId;
  actorId: string;
  expiresAt?: string | null;
}): Promise<{ token: RemoteMcpTokenRow; plaintext: string }> {
  const preset: McpPresetId =
    input.preset && (MCP_PRESET_IDS as readonly string[]).includes(input.preset)
      ? input.preset
      : DEFAULT_MCP_PRESET;
  const scopes = uniqueMcpScopes(input.scopes?.length ? input.scopes : scopesForPreset(preset));
  if (scopes.length === 0) throw new Error("VALIDATION");
  const plaintext = generateRemoteMcpTokenPlaintext();
  const row = await insertApiKey({
    name: sanitizeText(input.label).slice(0, 80) || "ClippyOS MCP",
    scopes,
    plaintext,
    actorId: input.actorId,
    expiresAt: input.expiresAt ?? null,
  });
  return {
    token: {
      id: row.id,
      label: row.name,
      last4: row.last4,
      keyPrefix: row.keyPrefix,
      scopes,
      lastUsedAt: row.lastUsedAt,
      revokedAt: row.revokedAt,
      expiresAt: input.expiresAt ?? null,
      createdAt: row.createdAt,
    },
    plaintext,
  };
}

export async function revokeRemoteMcpToken(id: string): Promise<void> {
  const rows = await listRemoteMcpKeyRows();
  const hit = rows.find((row) => String(row.id) === id);
  if (!hit) throw new Error("KEY_MISSING");
  await revokeApiKey(id);
  try {
    const team = await import("@/lib/server/team.server");
    await team.unlinkAutomationSeatsByTokenId(id);
  } catch {
    /* seats optional */
  }
}

export async function buildRemoteMcpSnapshot(): Promise<RemoteMcpSnapshot> {
  const origin = publicOrigin();
  const tokens = await listRemoteMcpTokens();
  return {
    mcpUrl: origin ? `${origin}/api/mcp` : "/api/mcp",
    connectorsUrl: "https://grok.com/connectors",
    protocol: "2025-03-26",
    transport: "streamable-http",
    tokens,
    presets: MCP_PRESET_IDS.map((id) => ({
      id,
      label: MCP_PRESET_LABELS[id],
      scopes: [...MCP_SCOPE_PRESETS[id]],
    })),
  };
}

export function enforceRemoteToolRate(keyId: string, toolName: string): void {
  if (toolName === "social_create_upload_job") {
    rateLimitOrThrow(`mcp-social-create:${keyId}`, REMOTE_MCP_RATE.socialCreatePerHour, 60 * 60_000);
  }
}

export function assertRemoteArgBudget(args: Record<string, unknown>): void {
  const encoded = JSON.stringify(args);
  if (encoded.length > REMOTE_MCP_RATE.maxArgBytes) throw new Error("VALIDATION");
  walkStrings(args, 0);
}

function walkStrings(input: unknown, depth: number): void {
  if (depth > 8) throw new Error("VALIDATION");
  if (typeof input === "string" && input.length > REMOTE_MCP_RATE.maxStringChars) {
    throw new Error("VALIDATION");
  }
  if (input && typeof input === "object") {
    const values = Array.isArray(input) ? input : Object.values(input as Record<string, unknown>);
    if (values.length > 80) throw new Error("VALIDATION");
    for (const value of values) walkStrings(value, depth + 1);
  }
}

export type { McpScope };
