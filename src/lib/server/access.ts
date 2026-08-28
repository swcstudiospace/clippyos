import { getSql } from "@/lib/db";
import { MASKED_SECRET } from "@/lib/constants";
import type { AppRole } from "@/lib/entities";
import type { SecretScope } from "@/lib/server/secret-scope.server";

export const OWNER_EMAILS = ["oveshen.govender@gmail.com"] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (OWNER_EMAILS.includes(normalized as (typeof OWNER_EMAILS)[number])) return true;
  const extra = process.env.OWNER_EMAIL ?? "";
  return extra.split(",").some((part) => part.trim().toLowerCase() === normalized);
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function bootstrapProfile(
  userId: string,
  role: AppRole,
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (admin) {
      await admin.from("app_profiles").upsert(
        { user_id: userId, role, status: "ACTIVE", updated_at: now },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    }
  } catch {
    /* fall through to local */
  }
  try {
    const sql = await getSql();
    await sql.query(
      `insert into app_profiles (user_id, role, status, created_at, updated_at)
       values ($1,$2,'ACTIVE',$3,$3)
       on conflict (user_id) do nothing`,
      [userId, role, now],
    );
  } catch {
    try {
      const sql = await getSql();
      await sql.query(
        `insert into app_profiles (user_id, role, created_at, updated_at)
         values ($1,$2,$3,$3)
         on conflict (user_id) do nothing`,
        [userId, role, now],
      );
    } catch {
      /* empty */
    }
  }
}

function isMissingStatusColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .* does not exist/i.test(message)
  );
}

async function readUserIdentity(
  userId: string,
): Promise<{ email: string | null; emailVerified: boolean | null }> {
  try {
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        email: string | null;
        emailVerified?: boolean | number | string | null;
      }>(`select email, "emailVerified" from "user" where id = $1`, [userId]);
      const raw = rows[0]?.emailVerified;
      return {
        email: rows[0]?.email ?? null,
        emailVerified: raw === true || raw === "t" || raw === "true" || raw === 1,
      };
    } catch (error) {
      const fields =
        error && typeof error === "object"
          ? {
              code: "code" in error && typeof error.code === "string" ? error.code : undefined,
              message: "message" in error && typeof error.message === "string" ? error.message : undefined,
            }
          : null;
      const missingVerified = isMissingStatusColumn(fields);
      try {
        const rows = await sql.query<{ email: string | null }>(
          `select email from "user" where id = $1`,
          [userId],
        );
        return {
          email: rows[0]?.email ?? null,
          emailVerified: missingVerified ? null : false,
        };
      } catch {
        return { email: null, emailVerified: null };
      }
    }
  } catch {
    return { email: null, emailVerified: null };
  }
}

async function roleFromSupabase(userId: string): Promise<AppRole | "REVOKED" | null | undefined> {
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (!admin) return null;
    const withStatus = await admin
      .from("app_profiles")
      .select("role,status")
      .eq("user_id", userId)
      .maybeSingle<{ role: string; status?: string }>();
    if (withStatus.error && isMissingStatusColumn(withStatus.error)) {
      const fallback = await admin
        .from("app_profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle<{ role: string }>();
      if (fallback.error) return undefined;
      if (fallback.data?.role === "admin" || fallback.data?.role === "member") return fallback.data.role;
      return null;
    }
    if (withStatus.error) return undefined;
    if (withStatus.data?.status === "REVOKED") return "REVOKED";
    if (withStatus.data?.role === "admin" || withStatus.data?.role === "member") {
      return withStatus.data.role;
    }
    return null;
  } catch {
    return undefined;
  }
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const identity = await readUserIdentity(userId);
  const owner =
    isOwnerEmail(identity.email) && identity.emailVerified !== false;
  const remote = await roleFromSupabase(userId);
  if (remote === "REVOKED" && !owner) return null;
  if (owner) {
    if (remote !== "admin") await bootstrapProfile(userId, "admin");
    return "admin";
  }
  if (remote === "admin" || remote === "member") return remote;

  let local: AppRole | "REVOKED" | null | undefined;
  try {
    const sql = await getSql();
    try {
      const rows = await sql<{ role: AppRole; status?: string }>`
        select role, status from app_profiles where user_id = ${userId}
      `;
      if (rows[0]?.status === "REVOKED") local = "REVOKED";
      else if (rows[0]?.role === "admin" || rows[0]?.role === "member") local = rows[0].role;
      else local = null;
    } catch {
      try {
        const rows = await sql<{ role: AppRole }>`
          select role from app_profiles where user_id = ${userId}
        `;
        if (rows[0]?.role === "admin" || rows[0]?.role === "member") local = rows[0].role;
        else local = null;
      } catch {
        local = undefined;
      }
    }
  } catch {
    local = undefined;
  }

  if (local === "REVOKED") return null;
  if (local === "admin" || local === "member") return local;

  // Bootstrap only when both backends agree there is no profile — never on read errors.
  if (remote === null && local === null) {
    await bootstrapProfile(userId, "member");
    return "member";
  }
  return null;
}

export async function readInheritWorkspaceApis(userId: string): Promise<boolean> {
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("app_profiles")
        .select("inherit_workspace_apis")
        .eq("user_id", userId)
        .maybeSingle<{ inherit_workspace_apis?: boolean }>();
      if (!error) return Boolean(data?.inherit_workspace_apis);
    }
  } catch {
    /* fall through */
  }
  try {
    const sql = await getSql();
    const rows = await sql.query<{ inherit_workspace_apis: boolean | number | string | null }>(
      "select inherit_workspace_apis from app_profiles where user_id = $1",
      [userId],
    );
    const value = rows[0]?.inherit_workspace_apis;
    return value === true || value === "t" || value === "true" || value === 1;
  } catch {
    return false;
  }
}

export async function getOperatorAccess(userId: string): Promise<SecretScope> {
  const role = await getUserRole(userId);
  const inheritWorkspaceApis = role === "admin" ? true : await readInheritWorkspaceApis(userId);
  return { userId, role, inheritWorkspaceApis };
}

export async function isOperatorRevoked(userId: string): Promise<boolean> {
  if (isOwnerEmail((await readUserIdentity(userId)).email)) return false;
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("app_profiles")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle<{ status?: string }>();
      if (!error && data) return data.status === "REVOKED";
      // No row, missing status column, or remote error: fall through to local SQL.
    }
  } catch {
    /* fall through */
  }
  try {
    const sql = await getSql();
    const rows = await sql<{ status: string }>`
      select status from app_profiles where user_id = ${userId}
    `;
    return rows[0]?.status === "REVOKED";
  } catch {
    return true;
  }
}

/** Fail-closed admin gate for AppSetting and destructive deletes. */
export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (role !== "admin") throw new ForbiddenError();
}

export function operatorCanEditSecrets(
  access: Pick<SecretScope, "role" | "inheritWorkspaceApis">,
): boolean {
  if (access.role === "admin") return true;
  return access.role === "member" && !access.inheritWorkspaceApis;
}

/** Members may edit their own keys unless they inherit workspace APIs. */
export async function requireSecretEditor(userId: string): Promise<SecretScope> {
  const access = await getOperatorAccess(userId);
  if (!access.role) throw new ForbiddenError();
  if (!operatorCanEditSecrets(access)) throw new ForbiddenError();
  return access;
}

export function maskSecret(_value: string | null): string {
  return MASKED_SECRET;
}
