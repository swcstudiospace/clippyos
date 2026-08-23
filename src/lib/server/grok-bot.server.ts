import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { listApiKeyRows } from "@/lib/server/autonomy-auth.server";
import { publicOrigin } from "@/lib/server/public-origin";
import {
  deriveGrokBotConnection,
  grokBotOperatorBrief,
  type GrokBotJson,
  type GrokBotSnapshot,
  type GrokBotWorkItem,
  type GrokBotWorkKind,
  type GrokBotWorkStatus,
} from "@/lib/grok-bot";

const CONFIG_KEY = "GROK_BOT_JSON";
const WORK_KEY = "GROK_BOT_WORK_JSON";

export type GrokBotConfig = {
  enabled: boolean;
  preferAsComputer: boolean;
  fallbackToDaytona: boolean;
  botName: string;
  pastedConnectorAt: string | null;
  lastHeartbeatAt: string | null;
};

const DEFAULT_CONFIG: GrokBotConfig = {
  enabled: true,
  preferAsComputer: false,
  fallbackToDaytona: true,
  botName: "ClippyOS Operator",
  pastedConnectorAt: null,
  lastHeartbeatAt: null,
};


function nowIso(): string {
  return new Date().toISOString();
}

function asJsonRecord(value: unknown): { [key: string]: GrokBotJson } {
  try {
    const parsed = JSON.parse(JSON.stringify(value ?? {})) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as { [key: string]: GrokBotJson };
  } catch {
    return {};
  }
}

export async function readGrokBotConfig(): Promise<GrokBotConfig> {
  const raw = await readAppSetting(CONFIG_KEY);
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<GrokBotConfig>;
    return {
      enabled: parsed.enabled !== false,
      preferAsComputer: parsed.preferAsComputer === true,
      fallbackToDaytona: parsed.fallbackToDaytona !== false,
      botName: typeof parsed.botName === "string" && parsed.botName.trim() ? parsed.botName.trim().slice(0, 80) : DEFAULT_CONFIG.botName,
      pastedConnectorAt: typeof parsed.pastedConnectorAt === "string" ? parsed.pastedConnectorAt : null,
      lastHeartbeatAt: typeof parsed.lastHeartbeatAt === "string" ? parsed.lastHeartbeatAt : null,
    };

  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeGrokBotConfig(patch: Partial<GrokBotConfig>): Promise<GrokBotConfig> {
  const current = await readGrokBotConfig();
  const next: GrokBotConfig = { ...current, ...patch };
  await writeAppSetting(CONFIG_KEY, JSON.stringify(next));
  return next;
}

async function readWork(): Promise<GrokBotWorkItem[]> {
  const raw = await readAppSetting(WORK_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GrokBotWorkItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 80) : [];
  } catch {
    return [];
  }
}

async function writeWork(rows: GrokBotWorkItem[]): Promise<void> {
  await writeAppSetting(WORK_KEY, JSON.stringify(rows.slice(0, 80)));
}

function isGrokBotKeyName(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("grok bot") || n.includes("grok-bot") || n === "grokbot";
}

export async function grokBotKeyRow() {
  const keys = (await listApiKeyRows()).filter((row) => !row.revokedAt);
  return keys.find((row) => isGrokBotKeyName(row.name)) ?? null;
}

export async function grokBotIsConnected(): Promise<boolean> {
  const [config, key] = await Promise.all([readGrokBotConfig(), grokBotKeyRow()]);
  if (!config.enabled) return false;
  return Boolean(key);
}

export async function grokBotShouldTakeComputer(): Promise<boolean> {
  const config = await readGrokBotConfig();
  if (!config.enabled || !config.preferAsComputer) return false;
  return grokBotIsConnected();
}

export async function enqueueGrokBotWork(input: {
  kind: GrokBotWorkKind;
  title: string;
  brief: string;
  payload?: { [key: string]: GrokBotJson } | Record<string, unknown>;
}): Promise<GrokBotWorkItem> {
  const rows = await readWork();
  const item: GrokBotWorkItem = {
    id: crypto.randomUUID(),
    kind: input.kind,
    status: "queued",
    title: input.title.slice(0, 200),
    brief: input.brief.slice(0, 8000),
    payload: asJsonRecord(input.payload ?? {}),
    createdAt: nowIso(),
    claimedAt: null,
    completedAt: null,
    result: null,
    error: null,
  };
  rows.unshift(item);
  await writeWork(rows);
  return item;
}

export async function listGrokBotWork(status?: GrokBotWorkStatus): Promise<GrokBotWorkItem[]> {
  const rows = await readWork();
  if (!status) return rows;
  return rows.filter((row) => row.status === status);
}

export async function claimGrokBotWork(id?: string): Promise<GrokBotWorkItem | null> {
  const rows = await readWork();
  const target =
    (id ? rows.find((row) => row.id === id && (row.status === "queued" || row.status === "claimed")) : null) ??
    rows.find((row) => row.status === "queued") ??
    null;
  if (!target) return null;
  target.status = "claimed";
  target.claimedAt = nowIso();
  await writeWork(rows);
  await writeGrokBotConfig({ lastHeartbeatAt: nowIso() });
  return target;
}

export async function completeGrokBotWork(input: {
  id: string;
  ok: boolean;
  result?: { [key: string]: GrokBotJson } | Record<string, unknown> | null;
  error?: string | null;
}): Promise<GrokBotWorkItem> {
  const rows = await readWork();
  const target = rows.find((row) => row.id === input.id);
  if (!target) throw new Error("JOB_MISSING");
  if (target.status === "cancelled") throw new Error("JOB_CANCELLED");
  target.status = input.ok ? "succeeded" : "failed";
  target.completedAt = nowIso();
  target.result = input.result ? asJsonRecord(input.result) : null;
  target.error = input.ok ? null : (input.error ?? "GROK_BOT_FAILED").slice(0, 400);
  await writeWork(rows);
  await writeGrokBotConfig({ lastHeartbeatAt: nowIso() });
  if (target.kind === "social_upload") {
    await applySocialUploadResult(target);
  }
  if (target.kind === "agent_run") {
    await applyAgentRunResult(target);
  }
  return target;
}

export async function cancelGrokBotWork(id: string): Promise<void> {
  const rows = await readWork();
  const target = rows.find((row) => row.id === id);
  if (!target) throw new Error("JOB_MISSING");
  if (target.status === "succeeded" || target.status === "failed") return;
  target.status = "cancelled";
  target.completedAt = nowIso();
  await writeWork(rows);
}

export async function cancelGrokBotWorkByPayload(key: string, value: string): Promise<number> {
  const rows = await readWork();
  const stamp = nowIso();
  let n = 0;
  for (const row of rows) {
    if ((row.status === "queued" || row.status === "claimed") && row.payload[key] === value) {
      row.status = "cancelled";
      row.completedAt = stamp;
      n += 1;
    }
  }
  if (n) await writeWork(rows);
  return n;
}


async function applySocialUploadResult(item: GrokBotWorkItem): Promise<void> {
  const jobId = typeof item.payload.jobId === "string" ? item.payload.jobId : null;
  if (!jobId) return;
  try {
    const social = await import("@/lib/server/social");
    const posts = await social.readSocialPosts();
    const related = posts.filter((row) => row.jobId === jobId);
    const results = Array.isArray(item.result?.posts) ? (item.result!.posts as Array<Record<string, unknown>>) : [];
    for (const post of related) {
      const hit = results.find((row) => row.platform === post.platform);
      const ok = item.status === "succeeded" && (!hit || hit.status !== "failed");
      const needsLogin = hit?.status === "needs_login" || item.error === "needs_login";
      await social.patchSocialPost(post.id, {
        status: needsLogin ? "needs_attention" : ok ? "succeeded" : "failed",
        rail: "BROWSER",
        source: "GROK_BOT",
        external_url: typeof hit?.externalUrl === "string" ? hit.externalUrl : post.externalUrl,
        attention_reason: needsLogin
          ? "Log into that app on the Grok Bot computer, then retry."
          : ok
            ? null
            : (typeof hit?.error === "string" ? hit.error : item.error),
      });
    }
    const remaining = (await social.readSocialPosts()).filter((row) => row.jobId === jobId);
    const allOk = remaining.every((row) => row.status === "succeeded");
    const anyAttention = remaining.some((row) => row.status === "needs_attention");
    await social.patchSocialJob(jobId, {
      status: anyAttention ? "needs_attention" : allOk && item.status === "succeeded" ? "succeeded" : "failed",
    });
  } catch {
    /* social tables may be empty in preview */
  }
}

async function applyAgentRunResult(item: GrokBotWorkItem): Promise<void> {
  const runId = typeof item.payload.runId === "string" ? item.payload.runId : null;
  if (!runId) return;
  try {
    const agent = await import("@/lib/server/agent.server");
    await agent.patchAgentRun(runId, {
      status: item.status === "succeeded" ? "succeeded" : "failed",
      errorCode: item.status === "succeeded" ? null : (item.error ?? "GROK_BOT_FAILED"),
      summary: item.status === "succeeded" ? "Finished on the Grok Bot computer." : item.error,
      finishedAt: item.completedAt,
    });
  } catch {
    /* */
  }
}

export async function heartbeatGrokBot(note?: string): Promise<{ ok: true; at: string; note: string | null }> {
  const at = nowIso();
  await writeGrokBotConfig({ lastHeartbeatAt: at });
  return { ok: true, at, note: note?.slice(0, 280) ?? null };
}

export async function buildGrokBotSnapshot(): Promise<GrokBotSnapshot> {
  const origin = publicOrigin() || "";
  const mcpUrl = origin ? `${origin}/api/mcp` : "/api/mcp";
  const [config, key, work] = await Promise.all([readGrokBotConfig(), grokBotKeyRow(), readWork()]);
  const queued = work.filter((row) => row.status === "queued").length;
  const claimed = work.filter((row) => row.status === "claimed").length;
  return {
    enabled: config.enabled,
    preferAsComputer: config.preferAsComputer,
    fallbackToDaytona: config.fallbackToDaytona,
    botName: config.botName,
    connection: deriveGrokBotConnection({
      hasKey: Boolean(key),
      pastedConnectorAt: config.pastedConnectorAt,
      lastHeartbeatAt: config.lastHeartbeatAt,
      claimed,
    }),
    hasKey: Boolean(key),
    keyLast4: key?.last4 ?? null,
    keyLastUsedAt: key?.lastUsedAt ?? null,
    pastedConnectorAt: config.pastedConnectorAt,
    lastHeartbeatAt: config.lastHeartbeatAt,
    queued,
    claimed,
    work: work.slice(0, 20),
    mcpUrl,
    connectorsUrl: "https://grok.com/connectors",
    botAppUrl: "https://x.ai/bot",
    docsUrl: "https://docs.x.ai/grok-bot/overview",
  };
}

export function operatorBriefFor(origin: string, botName: string): string {
  const mcpUrl = origin ? `${origin.replace(/\/+$/, "")}/api/mcp` : "/api/mcp";
  return grokBotOperatorBrief({ origin, mcpUrl, botName });
}
