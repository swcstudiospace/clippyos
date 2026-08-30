import type { ApiKeyScope } from "@/lib/autonomy";
import type { McpOAuthDiscovery, McpOAuthGrantRow } from "@/lib/mcp-oauth";

export const REMOTE_MCP_QUERY_KEY = ["clippy-os-mcp"] as const;

export const MCP_SCOPES = [
  "mcp:discover",
  "clients:read",
  "library:read",
  "library:write",
  "social:read",
  "social:write",
  "agent:read",
  "agent:write",
  "approvals:read",
  "approvals:write",
  "analytics:read",
  "linear:write",
  "admin:mcp",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const MCP_SCOPE_LABELS: Record<McpScope, string> = {
  "mcp:discover": "List tools",
  "clients:read": "Read clients",
  "library:read": "Read library",
  "library:write": "Register library metadata",
  "social:read": "Read social jobs",
  "social:write": "Create social jobs",
  "agent:read": "Read agent runs",
  "agent:write": "Start agent runs",
  "approvals:read": "List pending approvals",
  "approvals:write": "Decide approvals",
  "analytics:read": "Read winners",
  "linear:write": "Create Linear issues",
  "admin:mcp": "Mint MCP tokens (Settings only)",
};

export const MCP_PRESET_IDS = [
  "pilot",
  "readonly-ops",
  "publisher",
  "agent-operator",
  "approver",
  "full-connector",
] as const;
export type McpPresetId = (typeof MCP_PRESET_IDS)[number];

export const MCP_PRESET_LABELS: Record<McpPresetId, string> = {
  pilot: "Pilot (read + publish)",
  "readonly-ops": "Read-only ops",
  publisher: "Publisher",
  "agent-operator": "Agent operator",
  approver: "Approver",
  "full-connector": "Full connector",
};

const DISCOVER: McpScope = "mcp:discover";

export const MCP_SCOPE_PRESETS: Record<McpPresetId, readonly McpScope[]> = {
  "readonly-ops": [
    DISCOVER,
    "clients:read",
    "library:read",
    "social:read",
    "analytics:read",
    "approvals:read",
  ],
  publisher: [
    DISCOVER,
    "clients:read",
    "library:read",
    "social:read",
    "social:write",
    "analytics:read",
  ],
  "agent-operator": [
    DISCOVER,
    "clients:read",
    "library:read",
    "social:read",
    "analytics:read",
    "approvals:read",
    "agent:read",
    "agent:write",
  ],
  approver: [DISCOVER, "approvals:read", "approvals:write"],
  "full-connector": MCP_SCOPES.filter((scope) => scope !== "admin:mcp"),
  pilot: [
    DISCOVER,
    "clients:read",
    "library:read",
    "social:read",
    "social:write",
    "analytics:read",
    "approvals:read",
  ],
};

export const DEFAULT_MCP_PRESET: McpPresetId = "pilot";

export const REMOTE_MCP_TOKEN_PREFIX = "cos_mcp_";

export const REMOTE_MCP_RATE = {
  toolsPerMinute: 60,
  burst: 20,
  burstWindowMs: 10_000,
  socialCreatePerHour: 10,
  maxArgBytes: 32_768,
  maxStringChars: 8_000,
} as const;

export const MCP_DENIED_TOOLS = [
  "mark_payment_paid",
  "skill_manage.create",
  "skill_manage.edit",
  "computer.start",
  "computer.stop",
  "library.ingest_url",
  "get_llm_providers",
] as const;

const SECRET_ARG_KEYS = new Set([
  "token",
  "secret",
  "password",
  "authorization",
  "apiKey",
  "api_key",
  "apikey",
  "webhook",
  "cookie",
  "bearer",
  "accessToken",
  "refreshToken",
  "privateKey",
  "clientSecret",
  "signingSecret",
]);

export type RemoteMcpToolDef = {
  name: string;
  action: string;
  domain: string;
  description: string;
  scopes: readonly McpScope[];
  inputSchema: Record<string, unknown>;
};

export const REMOTE_MCP_TOOLS: readonly RemoteMcpToolDef[] = [
  {
    name: "clients_list",
    action: "list_clients",
    domain: "Clients",
    description: "List clients with current stage. No team cost internals.",
    scopes: ["clients:read"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "clients_get",
    action: "get_client",
    domain: "Clients",
    description: "Public client summary. Never returns fees or team cost internals.",
    scopes: ["clients:read"],
    inputSchema: {
      type: "object",
      required: ["clientId"],
      properties: { clientId: { type: "string" } },
    },
  },
  {
    name: "library_search_assets",
    action: "library.search_assets",
    domain: "Library",
    description: "Search library assets. Returns ids and metadata, never storage keys.",
    scopes: ["library:read"],
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        kind: { type: "string" },
        query: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "library_get_asset",
    action: "library.get_asset",
    domain: "Library",
    description: "Asset metadata plus a short-lived preview URL. Never raw storage secrets.",
    scopes: ["library:read"],
    inputSchema: {
      type: "object",
      required: ["assetId"],
      properties: { assetId: { type: "string" } },
    },
  },
  {
    name: "crayo_get_account",
    action: "crayo.get_account",
    domain: "Crayo",
    description: "Crayo plan and credits. Never returns the API key.",
    scopes: ["agent:read"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "crayo_run_short",
    action: "crayo.run_short",
    domain: "Crayo",
    description: "Generate a 9:16 Crayo short and ingest the mp4 into the Filebase library.",
    scopes: ["agent:write"],
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string" },
        script: { type: "string" },
        title: { type: "string" },
        clientId: { type: "string" },
      },
    },
  },
  {
    name: "crayo_run_autoclip",
    action: "crayo.run_autoclip",
    domain: "Crayo",
    description: "Import a long-form https URL, AutoClip, ingest thumbnails into the Filebase library.",
    scopes: ["agent:write"],
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string" },
        clipCount: { type: "number" },
        clipLength: { type: "number" },
        clientId: { type: "string" },
      },
    },
  },
  {
    name: "crayo_ingest_to_library",
    action: "crayo.ingest_to_library",
    domain: "Crayo",
    description: "Copy a Crayo CDN https file into the Filebase library. Rejects non-Crayo hosts.",
    scopes: ["agent:write"],
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: { url: { type: "string" }, title: { type: "string" }, clientId: { type: "string" } },
    },
  },
  {
    name: "social_get_publisher_status",
    action: "social.get_publisher_status",
    domain: "Social",
    description: "Per-platform configured / eligible / rail hints. Never returns tokens.",
    scopes: ["social:read"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "social_get_upload_job",
    action: "social.get_upload_job",
    domain: "Social",
    description: "Upload job status, platform, rail, external URL, error. Never tokens.",
    scopes: ["social:read"],
    inputSchema: {
      type: "object",
      required: ["jobId"],
      properties: { jobId: { type: "string" } },
    },
  },
  {
    name: "social_create_upload_job",
    action: "social.create_upload_job",
    domain: "Social",
    description:
      "Create an upload job. mode=publish waits for approval when requireForSocialPublish is on. Never bypasses approvals.",
    scopes: ["social:write"],
    inputSchema: {
      type: "object",
      required: ["mediaAssetId", "platforms", "mode"],
      properties: {
        clientId: { type: "string" },
        mediaAssetId: { type: "string" },
        platforms: {
          type: "array",
          items: { type: "string", enum: ["x", "tiktok", "instagram", "youtube"] },
        },
        caption: { type: "string" },
        mode: { type: "string", enum: ["draft", "publish"] },
        preferredRail: { type: "string", enum: ["AUTO", "API", "BROWSER", "GROK_BOT"] },
        idempotencyKey: { type: "string" },
      },
    },
  },
  {
    name: "agent_get_run",
    action: "agent.get_run",
    domain: "Agent",
    description: "Agent run status, provider, summary, and waiting reason.",
    scopes: ["agent:read"],
    inputSchema: {
      type: "object",
      required: ["runId"],
      properties: { runId: { type: "string" } },
    },
  },
  {
    name: "agent_start_run",
    action: "agent.start_run",
    domain: "Agent",
    description: "Start an agent run. Subject to concurrency. No secret injection.",
    scopes: ["agent:write"],
    inputSchema: {
      type: "object",
      required: ["goal"],
      properties: {
        goal: { type: "string" },
        clientId: { type: "string" },
        presetSkillId: { type: "string" },
        provider: { type: "string", enum: ["HERMES", "GROK_BOT", "AUTO"] },
        idempotencyKey: { type: "string" },
      },
    },
  },
  {
    name: "approvals_list_pending",
    action: "approvals.list_pending",
    domain: "Approvals",
    description: "Pending approval requests. Does not bypass publish policy.",
    scopes: ["approvals:read"],
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "approvals_decide",
    action: "approvals.decide",
    domain: "Approvals",
    description: "Approve or reject a pending request. Cannot skip the approvals policy.",
    scopes: ["approvals:write"],
    inputSchema: {
      type: "object",
      required: ["approvalId", "decision"],
      properties: {
        approvalId: { type: "string" },
        decision: { type: "string", enum: ["APPROVE", "REJECT"] },
        note: { type: "string" },
      },
    },
  },
  {
    name: "analytics_list_winners",
    action: "analytics.list_winners",
    domain: "Analytics",
    description: "Winning posts scored vs peers. Never fabricates metrics.",
    scopes: ["analytics:read"],
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "linear_create_issue",
    action: "linear.create_issue",
    domain: "Linear",
    description: "Create a Linear issue if Linear is connected.",
    scopes: ["linear:write"],
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        labelHints: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "grokbot_heartbeat",
    action: "grokbot.heartbeat",
    domain: "Grok Bot",
    description: "Mark the Grok Bot computer as online. Never starts Daytona.",
    scopes: ["social:read"],
    inputSchema: {
      type: "object",
      properties: { note: { type: "string" } },
    },
  },
  {
    name: "grokbot_get_status",
    action: "grokbot.get_status",
    domain: "Grok Bot",
    description: "Grok Bot connection and work counts. No secrets.",
    scopes: ["social:read"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "grokbot_get_brief",
    action: "grokbot.get_brief",
    domain: "Grok Bot",
    description: "Operator brief for the Grok Bot computer.",
    scopes: ["social:read"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "grokbot_list_work",
    action: "grokbot.list_work",
    domain: "Grok Bot",
    description: "Queued and claimed work for the Grok Bot computer.",
    scopes: ["social:read"],
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["queued", "claimed", "succeeded", "failed", "cancelled"],
        },
      },
    },
  },
  {
    name: "grokbot_claim_work",
    action: "grokbot.claim_work",
    domain: "Grok Bot",
    description: "Claim the next Grok Bot work item. Do not start Daytona.",
    scopes: ["social:write"],
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "grokbot_complete_work",
    action: "grokbot.complete_work",
    domain: "Grok Bot",
    description: "Complete a claimed Grok Bot work item.",
    scopes: ["social:write"],
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        ok: { type: "boolean" },
        error: { type: "string" },
        result: { type: "object" },
      },
    },
  },
  {
    name: "health_get_summary",
    action: "health.get_summary",
    domain: "Health",
    description: "SLOs, cost guards, integration tones, Hermes last login. No secrets.",
    scopes: ["clients:read"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "health_list_jobs",
    action: "health.list_jobs",
    domain: "Health",
    description: "Unified job feed. Sanitized errors only. Never starts Daytona.",
    scopes: ["social:read"],
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string" },
        status: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "health_retry_job",
    action: "health.retry_job",
    domain: "Health",
    description: "Retry a failed job. Idempotent. Never auto-starts the Social Machine.",
    scopes: ["social:write"],
    inputSchema: {
      type: "object",
      required: ["id", "type"],
      properties: {
        id: { type: "string" },
        type: {
          type: "string",
          enum: ["RENDER", "SOCIAL_UPLOAD", "AGENT", "PERFORMANCE_FETCH", "LINEAR_SYNC"],
        },
      },
    },
  },
];

export const REMOTE_MCP_TOOL_NAMES = new Set(REMOTE_MCP_TOOLS.map((tool) => tool.name));

export type RemoteMcpTokenRow = {
  id: string;
  label: string;
  last4: string;
  keyPrefix: string;
  scopes: McpScope[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type RemoteMcpSnapshot = {
  mcpUrl: string;
  mcpAliasUrl: string;
  mcpUrls: readonly string[];
  connectorsUrl: string;
  protocol: string;
  transport: string;
  tokens: RemoteMcpTokenRow[];
  presets: Array<{ id: McpPresetId; label: string; scopes: McpScope[] }>;
  oauth: McpOAuthDiscovery;
  grants: McpOAuthGrantRow[];
};

export function isMcpScope(value: string): value is McpScope {
  return (MCP_SCOPES as readonly string[]).includes(value);
}

export function parseMcpScopes(raw: unknown): McpScope[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is McpScope => typeof item === "string" && isMcpScope(item));
  }
  if (typeof raw === "string") {
    try {
      return parseMcpScopes(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

export function hasMcpScope(scopes: readonly McpScope[], needed: McpScope): boolean {
  return scopes.includes(needed);
}

export function uniqueMcpScopes(scopes: readonly string[]): McpScope[] {
  const seen = new Set<McpScope>();
  for (const scope of scopes) {
    if (isMcpScope(scope) && scope !== "admin:mcp") seen.add(scope);
  }
  seen.add("mcp:discover");
  return MCP_SCOPES.filter((scope) => seen.has(scope));
}

export function scopesForPreset(id: McpPresetId): McpScope[] {
  return [...MCP_SCOPE_PRESETS[id]];
}

export function remoteToolAllowed(tool: RemoteMcpToolDef, scopes: readonly McpScope[]): boolean {
  return tool.scopes.every((scope) => hasMcpScope(scopes, scope));
}

export function formatClippyOsMcpConnectorJson(mcpUrl: string, token = "<CLIPPYOS_MCP_TOKEN>"): string {
  return JSON.stringify(
    {
      name: "ClippyOS",
      type: "custom",
      url: mcpUrl,
      headers: { Authorization: `Bearer ${token}` },
    },
    null,
    2,
  );
}

export function isSecretArgKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/[_-]/g, "");
  if (SECRET_ARG_KEYS.has(key) || SECRET_ARG_KEYS.has(normalized)) return true;
  return /token|secret|password|authorization|apikey|cookie|bearer|privatekey/.test(normalized);
}

export function redactMcpArgs(input: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (input == null) return input;
  if (typeof input === "string") return input.length > 240 ? `${input.slice(0, 240)}…` : input;
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) return input.slice(0, 40).map((item) => redactMcpArgs(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = isSecretArgKey(key) ? "[redacted]" : redactMcpArgs(value, depth + 1);
  }
  return out;
}

export function canonicalizeMcpArgs(input: unknown): string {
  return JSON.stringify(sortKeys(redactMcpArgs(input)));
}

function sortKeys(input: unknown): unknown {
  if (input == null || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(sortKeys);
  const entries = Object.entries(input as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, unknown> = {};
  for (const [key, value] of entries) out[key] = sortKeys(value);
  return out;
}

export function mapRemoteToolCall(
  name: string,
  args: Record<string, unknown>,
): { action: string; payload: Record<string, unknown> } | null {
  const tool = REMOTE_MCP_TOOLS.find((row) => row.name === name);
  if (!tool) return null;
  const payload: Record<string, unknown> = { ...args };
  if (name === "clients_list") {
    if (typeof payload.query === "string" && typeof payload.search !== "string") payload.search = payload.query;
  }
  if (name === "clients_get") {
    if (typeof payload.clientId === "string" && typeof payload.id !== "string") payload.id = payload.clientId;
  }
  if (name === "library_search_assets") {
    if (typeof payload.query === "string" && typeof payload.search !== "string") payload.search = payload.query;
  }
  if (name === "library_get_asset") {
    if (typeof payload.assetId === "string" && typeof payload.id !== "string") payload.id = payload.assetId;
  }
  if (name === "social_get_upload_job") {
    if (typeof payload.jobId === "string" && typeof payload.id !== "string") payload.id = payload.jobId;
  }
  if (name === "approvals_decide") {
    if (typeof payload.approvalId === "string" && typeof payload.id !== "string") payload.id = payload.approvalId;
    const decision = String(payload.decision ?? "").toUpperCase();
    if (decision === "APPROVE") payload.decision = "APPROVED";
    if (decision === "REJECT") payload.decision = "REJECTED";
  }
  if (name === "linear_create_issue") {
    if (Array.isArray(payload.labelHints) && !payload.labels) payload.labels = payload.labelHints;
  }
  if (name === "agent_get_run") {
    if (typeof payload.runId === "string" && typeof payload.id !== "string") payload.id = payload.runId;
  }
  if (name === "agent_start_run") {
    if (typeof payload.presetSkillId === "string" && typeof payload.skillId !== "string") {
      payload.skillId = payload.presetSkillId;
    }
  }
  return { action: tool.action, payload };
}

export function shapeRemoteMcpResult(name: string, data: unknown): unknown {
  if (data == null || typeof data !== "object") return data;
  const record = data as Record<string, unknown>;
  if (name === "clients_list") {
    const clients = Array.isArray(record.clients) ? record.clients : Array.isArray(data) ? data : [];
    return (clients as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      name: row.name,
      planType: row.planType ?? null,
      stage: row.currentStage ?? row.stage ?? null,
      channelUrl: row.channelUrl ?? null,
    }));
  }
  if (name === "clients_get") {
    return {
      id: record.id,
      name: record.name,
      planType: record.planType ?? null,
      stage: record.currentStage ?? record.stage ?? null,
      channelUrl: record.channelUrl ?? null,
      status: record.status ?? null,
      startDate: record.startDate ?? null,
      notes: record.notes ?? null,
    };
  }
  if (name === "library_search_assets") {
    const assets = Array.isArray(record.assets) ? record.assets : [];
    return (assets as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      status: row.status,
      durationSec: row.durationSec ?? null,
      clientId: row.clientId ?? null,
    }));
  }
  if (name === "library_get_asset") {
    const asset = (record.asset as Record<string, unknown> | undefined) ?? record;
    return {
      id: asset.id,
      title: asset.title,
      kind: asset.kind,
      status: asset.status,
      durationSec: asset.durationSec ?? null,
      clientId: asset.clientId ?? null,
      previewUrl: asset.previewUrl ?? null,
      captions: record.captions ?? [],
    };
  }
  if (name === "social_get_publisher_status") {
    const publishers = Array.isArray(record.publishers) ? record.publishers : [];
    return (publishers as Array<Record<string, unknown>>).map((row) => ({
      platform: row.platform ?? row.id ?? null,
      configured: Boolean(row.configured),
      eligible: Boolean(row.eligible),
      railHints: row.recommendedRail ?? row.railHints ?? null,
    }));
  }
  if (name === "social_get_upload_job") {
    return {
      jobId: record.id ?? record.jobId,
      status: record.status,
      platform: record.platform ?? null,
      rail: record.preferredRail ?? record.rail ?? null,
      externalUrl: record.externalUrl ?? null,
      error: record.error ?? record.lastError ?? null,
    };
  }
  if (name === "social_create_upload_job") {
    return { jobId: record.id ?? record.jobId, status: record.status ?? "queued" };
  }
  if (name === "agent_get_run" || name === "agent_start_run") {
    return data;
  }
  if (name === "approvals_list_pending") {
    const items = Array.isArray(record.items) ? record.items : [];
    return (items as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      createdAt: row.createdAt,
    }));
  }
  if (name === "approvals_decide") {
    return { id: record.id, status: record.status };
  }
  if (name === "analytics_list_winners") {
    const winners = Array.isArray(record.winners) ? record.winners : [];
    return (winners as Array<Record<string, unknown>>).map((row) => ({
      assetId: row.mediaAssetId ?? row.assetId ?? row.id,
      score: row.score ?? null,
      platform: row.platform ?? null,
      views: row.views ?? null,
    }));
  }
  if (name === "linear_create_issue") {
    const issue = (record.issue as Record<string, unknown> | undefined) ?? record;
    return {
      issueId: issue.id ?? issue.identifier ?? record.issueId,
      url: issue.url ?? record.url ?? null,
      skipped: record.skipped ?? null,
    };
  }
  return data;
}

export function hermesScopesFromMcp(scopes: readonly McpScope[]): ApiKeyScope[] {
  const out = new Set<ApiKeyScope>();
  for (const scope of scopes) {
    switch (scope) {
      case "clients:read":
      case "library:read":
      case "social:read":
      case "agent:read":
      case "approvals:read":
      case "analytics:read":
      case "mcp:discover":
        out.add("read");
        break;
      case "library:write":
      case "social:write":
        out.add("write:social");
        break;
      case "agent:write":
        out.add("actions:ai");
        out.add("skills:execute");
        break;
      case "approvals:write":
        out.add("approvals:admin");
        break;
      case "linear:write":
        out.add("linear:write");
        break;
      case "admin:mcp":
        break;
    }
  }
  return [...out];
}

export const REMOTE_MCP_INSTRUCTIONS =
  "ClippyOS Remote MCP. Least-privilege tools only. Publish honors Approvals — never bypass. Never request AppSetting secrets, OAuth tokens, webhook secrets, Super Admin, or Daytona start. Crayo: crayo_get_account, crayo_run_short, crayo_run_autoclip, crayo_ingest_to_library (Filebase library, Crayo CDN only). Grok Bot clients: grokbot_heartbeat, grokbot_list_work, grokbot_claim_work, grokbot_complete_work. Do not start Daytona.";
