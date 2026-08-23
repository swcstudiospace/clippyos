import { getSql } from "@/lib/db";
import { MASKED_SECRET } from "@/lib/constants";
import type { AppRole } from "@/lib/entities";
import type { SecretScope } from "@/lib/server/secret-scope.server";

export const OWNER_EMAILS = ["oveshen.govender@gmail.com"] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase() as (typeof OWNER_EMAILS)[number]);
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
        { onConflict: "user_id" },
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
    /column .*status.* does not exist/i.test(message)
  );
}

async function readUserEmail(userId: string): Promise<string | null> {
  try {
    const sql = await getSql();
    try {
      const rows = await sql.query<{ email: string | null }>(
        `select email from "user" where id = $1`,
        [userId],
      );
      return rows[0]?.email ?? null;
    } catch {
      const rows = await sql.query<{ email: string | null }>(
        `select email from "user" where id = $1`,
        [userId],
      );
      return rows[0]?.email ?? null;
    }
  } catch {
    return null;
  }
}

async function roleFromSupabase(userId: string): Promise<AppRole | "REVOKED" | null | undefined> {
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (!admin) return undefined;
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
  const owner = isOwnerEmail(await readUserEmail(userId));
  const remote = await roleFromSupabase(userId);
  if (remote === "REVOKED" && !owner) return null;
  if (owner) {
    if (remote !== "admin") await bootstrapProfile(userId, "admin");
    return "admin";
  }
  if (remote === "admin" || remote === "member") return remote;

  try {
    const sql = await getSql();
    try {
      const rows = await sql<{ role: AppRole; status?: string }>`
        select role, status from app_profiles where user_id = ${userId}
      `;
      if (rows[0]?.status === "REVOKED") return null;
      if (rows[0]?.role === "admin" || rows[0]?.role === "member") return rows[0].role;
    } catch {
      const rows = await sql<{ role: AppRole }>`
        select role from app_profiles where user_id = ${userId}
      `;
      if (rows[0]?.role === "admin" || rows[0]?.role === "member") return rows[0].role;
    }
  } catch {
    /* empty */
  }

  // Self-serve sign-up and newly created logins are isolated members.
  // Owners are the listed emails (and Super Admin, which signs in as that owner).
  await bootstrapProfile(userId, "member");
  return "member";
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
  if (isOwnerEmail(await readUserEmail(userId))) return false;
  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
    const admin = tryCreateAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("app_profiles")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle<{ status?: string }>();
      if (!error) return data?.status === "REVOKED";
      if (error && isMissingStatusColumn(error)) return false;
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
    return false;
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
