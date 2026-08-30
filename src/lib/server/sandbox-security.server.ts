/**
 * Daytona sandbox security — env allowlist, artifact scan, short-lived run tokens.
 * Skill sandboxes never receive Daytona / xAI / webhook secrets.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import {
  SKILL_ARTIFACT_EXTS,
  SKILL_ARTIFACT_MAX_BYTES,
  SKILL_ENV_ALLOWLIST,
  SKILL_ENV_DENY,
  shellEnvAssignment,
} from "@/lib/sandbox";

const TOKEN_KEY = "SKILL_RUN_TOKENS_JSON";
const TOKEN_TTL_MS = 20 * 60 * 1000;

export type SkillRunToken = {
  hash: string;
  skillId: string;
  runId: string;
  tools: string[];
  expiresAt: string;
};

const SECRET_FIELD = /pass(word)?|cookie|secret|token|authorization|set-cookie/i;

export function buildSkillSandboxEnv(input: {
  skillId: string;
  version: string;
  inputPath: string;
  outputDir: string;
  apiBase?: string | null;
  runToken?: string | null;
}): Record<string, string> {
  const env: Record<string, string> = {
    SKILL_ID: input.skillId.slice(0, 80),
    SKILL_VERSION: input.version.slice(0, 32),
    INPUT_PATH: input.inputPath,
    OUTPUT_DIR: input.outputDir,
  };
  if (input.apiBase && /^https?:\/\//i.test(input.apiBase)) {
    env.AGENCY_API_BASE = input.apiBase.replace(/\/$/, "");
  }
  if (input.runToken) env.AGENCY_RUN_TOKEN = input.runToken;
  for (const key of Object.keys(env)) {
    if (!(SKILL_ENV_ALLOWLIST as readonly string[]).includes(key)) delete env[key];
    if ((SKILL_ENV_DENY as readonly string[]).includes(key)) delete env[key];
  }
  return env;
}

export function formatEnvExports(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => shellEnvAssignment(key, value))
    .filter((item): item is string => Boolean(item))
    .join(" ");
}

export function artifactAllowed(name: string, size: number): boolean {
  if (size > SKILL_ARTIFACT_MAX_BYTES) return false;
  const lower = name.toLowerCase();
  if (SECRET_FIELD.test(lower)) return false;
  if (/(^|\/)(cookies?|logins?|passwords?|sessions?)(\.|$)/i.test(lower)) return false;
  const ext = lower.includes(".") ? `.${lower.split(".").pop()}` : "";
  return (SKILL_ARTIFACT_EXTS as readonly string[]).includes(ext);
}

export function scanArtifactText(name: string, body: string): string {
  if (!/\.(json|txt|md|csv)$/i.test(name)) return body;
  try {
    const parsed = JSON.parse(body) as unknown;
    return JSON.stringify(redactSecrets(parsed));
  } catch {
    return body
      .replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]")
      .replace(/xai-[A-Za-z0-9_-]{10,}/g, "[redacted]")
      .replace(/sk-[A-Za-z0-9_-]{10,}/g, "[redacted]")
      .replace(/agk_live_[A-Za-z0-9]+/g, "[redacted]")
      .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[redacted]"')
      .replace(/"cookie"\s*:\s*"[^"]*"/gi, '"cookie":"[redacted]"');
  }
}

function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_FIELD.test(key) ? "[redacted]" : redactSecrets(item);
  }
  return out;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function readTokens(): Promise<SkillRunToken[]> {
  const raw = await readAppSetting(TOKEN_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SkillRunToken[];
    const now = Date.now();
    return parsed.filter((row) => Date.parse(row.expiresAt) > now);
  } catch {
    return [];
  }
}

export async function mintSkillRunToken(input: {
  skillId: string;
  runId: string;
  tools: string[];
}): Promise<string> {
  const plaintext = `srt_${randomBytes(24).toString("hex")}`;
  const row: SkillRunToken = {
    hash: hashToken(plaintext),
    skillId: input.skillId,
    runId: input.runId,
    tools: input.tools.slice(0, 40),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  };
  const existing = await readTokens();
  await writeAppSetting(TOKEN_KEY, JSON.stringify([row, ...existing].slice(0, 40)));
  return plaintext;
}

export async function consumeSkillRunToken(token: string): Promise<SkillRunToken | null> {
  const hash = hashToken(token);
  const existing = await readTokens();
  const found = existing.find((row) => hashesEqual(row.hash, hash)) ?? null;
  if (!found) return null;
  await writeAppSetting(
    TOKEN_KEY,
    JSON.stringify(existing.filter((row) => row.hash !== hash)),
  );
  return found;
}
