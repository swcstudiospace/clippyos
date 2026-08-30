import { AsyncLocalStorage } from "node:async_hooks";
import { getRequest } from "@tanstack/react-start/server";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import type { AppRole } from "@/lib/entities";

export type SecretScope = {
  userId: string;
  role: AppRole | null;
  inheritWorkspaceApis: boolean;
};

const storage = new AsyncLocalStorage<SecretScope>();
const byRequest = new WeakMap<Request, SecretScope>();

const WORKSPACE_CONTROL_KEYS = new Set([
  "SUPER_ADMIN_PASSWORD_HASH",
  "PASSWORD_RESET_TOKENS_JSON",
  "FIRST_LAUNCH_COMPLETED",
  "OVERDUE_NOTIFIED_JSON",
  "GUARANTEE_NOTIFIED_JSON",
  "LIBRARY_SIGNING_SECRET",
  "WORKSPACE_SUBSCRIPTION_JSON",
  "BILLING_INVOICES_JSON",
  "PRODUCT_ONBOARDING_JSON",
  "WHOP_WEBHOOK_EVENTS_JSON",
  // Configurable constants that can be overridden via app settings
  "GUARANTEE_WINDOW_DAYS",
  "GUARANTEE_WARNING_DAY",
  "PIPELINE_STALL_DAYS",
  "CAPACITY_OVERLOAD_THRESHOLD",
  "MARK_COLLECTED_CONFIRM_THRESHOLD",
  "DISCORD_AGENT_STALE_MS",
  "DASHBOARD_ACTIVITY_LIMIT",
  "BRAND_ACCENT_HEX",
  "LLM_ROUTER_JSON",
  "OPENAI_COMPAT_BASE",
]);

export function isWorkspaceControlKey(key: string): boolean {
  if (WORKSPACE_CONTROL_KEYS.has(key)) return true;
  if (key.startsWith("PORTAL_")) return true;
  if (key.startsWith("OPS_")) return true;
  return false;
}

export function getSecretScope(): SecretScope | undefined {
  const fromAls = storage.getStore();
  if (fromAls) return fromAls;
  try {
    const request = getRequest();
    if (request) return byRequest.get(request);
  } catch {
    /* no request */
  }
  return undefined;
}

export function runWithSecretScope<T>(scope: SecretScope, fn: () => T): T {
  try {
    const request = getRequest();
    if (request) byRequest.set(request, scope);
  } catch {
    /* no request */
  }
  return storage.run(scope, fn);
}

export function readsWorkspaceSecrets(scope?: SecretScope): boolean {
  if (!scope) return true;
  if (scope.role === "admin") return true;
  return scope.inheritWorkspaceApis;
}

export function secretWriteTarget(
  scope?: SecretScope,
): "workspace" | "operator" | "forbidden" {
  if (!scope) return "workspace";
  if (scope.role === "admin") return "workspace";
  if (scope.inheritWorkspaceApis) return "forbidden";
  return "operator";
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function readOperatorSecret(userId: string, key: string): Promise<string | null> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("operator_secrets")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle<{ value?: string | null }>();
    if (!error) return data?.value ?? null;
    if (!isMissingTable(error)) return null;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ value: string | null }>(
      "select value from operator_secrets where user_id = $1 and key = $2",
      [userId, key],
    );
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function readOperatorSecretsMap(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("operator_secrets")
      .select("key,value")
      .eq("user_id", userId);
    if (!error) {
      for (const row of data ?? []) {
        const rec = row as { key?: string; value?: string | null };
        if (rec.key && rec.value) map.set(rec.key, rec.value);
      }
      return map;
    }
    if (!isMissingTable(error)) return map;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ key: string; value: string | null }>(
      "select key, value from operator_secrets where user_id = $1",
      [userId],
    );
    for (const row of rows) {
      if (row.key && row.value) map.set(row.key, row.value);
    }
  } catch {
    /* empty */
  }
  return map;
}

export async function writeOperatorSecret(
  userId: string,
  key: string,
  value: string,
): Promise<void> {
  const now = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("operator_secrets").upsert(
      { user_id: userId, key, value, updated_at: now },
      { onConflict: "user_id,key" },
    );
    if (error && !isMissingTable(error)) {
      /* local fallback still runs */
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into operator_secrets (user_id, key, value, created_at, updated_at)
       values ($1, $2, $3, $4, $4)
       on conflict (user_id, key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      [userId, key, value, now],
    );
  } catch {
    /* local store may be unavailable */
  }
}

export async function deleteOperatorSecret(userId: string, key: string): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin
      .from("operator_secrets")
      .delete()
      .eq("user_id", userId)
      .eq("key", key);
    if (error && !isMissingTable(error)) {
      /* local fallback still runs */
    }
  }
  try {
    const sql = await localSql();
    await sql.query("delete from operator_secrets where user_id = $1 and key = $2", [userId, key]);
  } catch {
    /* empty */
  }
}
