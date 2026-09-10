import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { authMiddleware } from "@/lib/auth/middleware";
import { OWNER_EMAILS, isOwnerEmail, requireAdmin } from "@/lib/server/access";
import { isMissingTable } from "@/lib/server/mappers";
import { getSql } from "@/lib/db";
import { auth, SESSION_TOKEN_COOKIE } from "@/lib/auth/server";
import { setCookie } from "@tanstack/react-start/server";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}
async function load_app_settings() {
  return import("@/lib/server/app-settings.server");
}
async function load_isolation() {
  return import("@/lib/auth/isolation.server");
}
async function load_public_origin() {
  return import("@/lib/server/public-origin.server");
}

const scryptAsync = promisify(scrypt);
const OWNER_EMAIL = OWNER_EMAILS[0];
const failMap = new Map<string, { n: number; until: number }>();

export type TeamLogin = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "ACTIVE" | "REVOKED";
  inheritWorkspaceApis: boolean;
  createdAt: string;
};

async function hashSecret(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function verifySecret(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== buf.length) return false;
  return timingSafeEqual(expected, buf);
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const rec = failMap.get(key);
  if (rec && rec.until > now && rec.n >= 5) return false;
  if (rec && rec.until <= now) failMap.delete(key);
  return true;
}

function recordFail(key: string): void {
  const now = Date.now();
  const rec = failMap.get(key);
  if (!rec || rec.until <= now) {
    failMap.set(key, { n: 1, until: now + 15 * 60_000 });
    return;
  }
  rec.n += 1;
}

async function ensureProfile(
  userId: string,
  role: "admin" | "member",
  status: "ACTIVE" | "REVOKED" = "ACTIVE",
  inheritWorkspaceApis = role === "admin",
): Promise<void> {
  const now = new Date().toISOString();
  const inherit = role === "admin" ? true : inheritWorkspaceApis;
  const payload = {
    user_id: userId,
    role,
    status,
    inherit_workspace_apis: inherit,
    updated_at: now,
  };
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("app_profiles").upsert(payload, { onConflict: "user_id" });
    if (!error) return;
    if (!isMissingTable(error)) {
      const fallback = await admin.from("app_profiles").upsert(payload, { onConflict: "user_id" });
      if (!fallback.error) return;
    }
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    await sql.query(
      `insert into app_profiles (user_id, role, status, inherit_workspace_apis, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$5)
       on conflict (user_id) do update set role = excluded.role, status = excluded.status,
         inherit_workspace_apis = excluded.inherit_workspace_apis, updated_at = excluded.updated_at`,
      [userId, role, status, inherit, now],
    );
    return;
  } catch {
    try {
      const sql = await (await load_agency_db()).localSql();
      await sql.query(
        `insert into app_profiles (user_id, role, status, created_at, updated_at)
         values ($1,$2,$3,$4,$4)
         on conflict (user_id) do update set role = excluded.role, status = excluded.status, updated_at = excluded.updated_at`,
        [userId, role, status, now],
      );
      return;
    } catch {
      try {
        const sql = await (await load_agency_db()).localSql();
        await sql.query(
          `insert into app_profiles (user_id, role, created_at, updated_at)
           values ($1,$2,$3,$3)
           on conflict (user_id) do update set role = excluded.role, updated_at = excluded.updated_at`,
          [userId, role, now],
        );
      } catch {
        /* empty */
      }
    }
  }
  if (status === "REVOKED") throw new Error("Could not persist profile");
}

async function readAuthUsers(): Promise<Array<{ id: string; name: string; email: string; createdAt: string }>> {
  try {
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        id: string;
        name: string | null;
        email: string | null;
        createdAt: string;
      }>(`select id, name, email, "createdAt" from "user" order by "createdAt" desc`);
      return rows.map((row) => ({
        id: row.id,
        name: row.name ?? "",
        email: row.email ?? "",
        createdAt: row.createdAt,
      }));
    } catch {
      const rows = await sql.query<{
        id: string;
        name: string | null;
        email: string | null;
        created_at: string;
      }>(`select id, name, email, created_at from "user" order by created_at desc`);
      return rows.map((row) => ({
        id: row.id,
        name: row.name ?? "",
        email: row.email ?? "",
        createdAt: row.created_at,
      }));
    }
  } catch {
    return [];
  }
}

async function readProfiles(): Promise<
  Map<string, { role: "admin" | "member"; status: "ACTIVE" | "REVOKED"; inheritWorkspaceApis: boolean }>
> {
  const map = new Map<
    string,
    { role: "admin" | "member"; status: "ACTIVE" | "REVOKED"; inheritWorkspaceApis: boolean }
  >();
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("app_profiles")
      .select("user_id,role,status,inherit_workspace_apis");
    if (!error) {
      for (const row of data ?? []) {
        const rec = row as {
          user_id?: string;
          role?: string;
          status?: string;
          inherit_workspace_apis?: boolean;
        };
        if (!rec.user_id) continue;
        map.set(rec.user_id, {
          role: rec.role === "admin" ? "admin" : "member",
          status: rec.status === "REVOKED" ? "REVOKED" : "ACTIVE",
          inheritWorkspaceApis: Boolean(rec.inherit_workspace_apis) || rec.role === "admin",
        });
      }
      return map;
    }
    if (!isMissingTable(error)) return map;
  }
  try {
    const sql = await (await load_agency_db()).localSql();
    const rows = await sql.query<{
      user_id: string;
      role: string;
      status?: string;
      inherit_workspace_apis?: boolean | number | string | null;
    }>("select user_id, role, status, inherit_workspace_apis from app_profiles");
    for (const row of rows) {
      const inherit =
        row.inherit_workspace_apis === true ||
        row.inherit_workspace_apis === "t" ||
        row.inherit_workspace_apis === "true" ||
        row.inherit_workspace_apis === 1;
      map.set(row.user_id, {
        role: row.role === "admin" ? "admin" : "member",
        status: row.status === "REVOKED" ? "REVOKED" : "ACTIVE",
        inheritWorkspaceApis: inherit || row.role === "admin",
      });
    }
  } catch {
    try {
      const sql = await (await load_agency_db()).localSql();
      const rows = await sql.query<{ user_id: string; role: string }>(
        "select user_id, role from app_profiles",
      );
      for (const row of rows) {
        map.set(row.user_id, {
          role: row.role === "admin" ? "admin" : "member",
          status: "ACTIVE",
          inheritWorkspaceApis: row.role === "admin",
        });
      }
    } catch {
      /* empty */
    }
  }
  return map;
}

export const listTeamLogins = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TeamLogin[]> => {
    await requireAdmin(context.userId);
    const [users, profiles] = await Promise.all([readAuthUsers(), readProfiles()]);
    return users.map((user) => {
      const profile = profiles.get(user.id);
      const owner = isOwnerEmail(user.email);
      return {
        userId: user.id,
        name: user.name || user.email || "Operator",
        email: user.email,
        role: owner ? "admin" : (profile?.role ?? "member"),
        status: profile?.status ?? "ACTIVE",
        inheritWorkspaceApis: owner || profile?.role === "admin" || Boolean(profile?.inheritWorkspaceApis),
        createdAt: user.createdAt,
      };
    });
  });

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "member"]).default("member"),
  inheritWorkspaceApis: z.boolean().default(false),
});

async function findUserByEmail(email: string): Promise<string | null> {
  const users = await readAuthUsers();
  return users.find((row) => row.email.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function createCredentialUser(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Could not create account");
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser({
    name,
    email,
    emailVerified: true,
  });
  await ctx.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hashed,
  });
  return user.id;
}

export const createTeamLogin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const userId = await createCredentialUser(data.name, data.email, data.password);
    await ensureProfile(
      userId,
      data.role,
      "ACTIVE",
      data.role === "admin" ? true : data.inheritWorkspaceApis,
    );
    try {
      const { onAuthEvent } = await import("@/lib/server/safety-hooks.server");
      await onAuthEvent({
        actorId: context.userId,
        action: "auth.team_invite",
        summary: `Invited ${data.email} as ${data.role}`,
        metadata: { email: data.email, role: data.role, inheritWorkspaceApis: data.inheritWorkspaceApis },
      });
    } catch {
      /* */
    }
    return { ok: true as const, userId };
  });

export const revokeTeamLogin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: userId }) => {
    await requireAdmin(context.userId);
    if (userId === context.userId) throw new Error("Forbidden");
    await ensureProfile(userId, "member", "REVOKED");
    await dropUserSessions(userId);
    return { ok: true as const };
  });

const PasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

export const setSuperAdminPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => PasswordSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const hash = await hashSecret(data.password);
    await (await load_app_settings()).writeAppSetting("SUPER_ADMIN_PASSWORD_HASH", hash);
    const ownerId = await ensureOwnerUser();
    await setCredentialPassword(ownerId, data.password);
    try {
      const { onAuthEvent } = await import("@/lib/server/safety-hooks.server");
      await onAuthEvent({
        actorId: context.userId,
        action: "auth.super_admin",
        summary: "Super Admin password set",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

const RESET_KEY = "PASSWORD_RESET_TOKENS_JSON";

type ResetRow = {
  id: string;
  userId: string;
  hash: string;
  expiresAt: string;
  usedAt: string | null;
};

async function readResetRows(): Promise<ResetRow[]> {
  const raw = await (await load_app_settings()).readAppSetting(RESET_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ResetRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeResetRows(rows: ResetRow[]): Promise<void> {
  await (await load_app_settings()).writeAppSetting(RESET_KEY, JSON.stringify(rows.slice(0, 50)));
}

async function setCredentialPassword(userId: string, password: string): Promise<void> {
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(password);
  const sql = await getSql();
  try {
    await sql.query(
      `update "account" set password = $1 where "userId" = $2 and "providerId" = 'credential'`,
      [hashed, userId],
    );
  } catch {
    await sql.query(
      `update account set password = $1 where user_id = $2 and provider_id = 'credential'`,
      [hashed, userId],
    );
  }
}

async function dropUserSessions(userId: string): Promise<void> {
  try {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUserSessions(userId);
  } catch {
    /* best-effort session drop */
  }
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ email: z.string().trim().email() }).parse(input))
  .handler(async () => {
    (await load_isolation()).assertSameSiteRequest();
    return { ok: true as const };
  });

export const createMemberResetLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: userId }): Promise<{ url: string }> => {
    await requireAdmin(context.userId);
    const token = randomBytes(24).toString("hex");
    const hash = await hashSecret(token);
    const rows = await readResetRows();
    const usedAt = new Date().toISOString();
    for (const row of rows) {
      if (row.userId === userId && !row.usedAt) row.usedAt = usedAt;
    }
    rows.unshift({
      id: token.slice(0, 8),
      userId,
      hash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      usedAt: null,
    });
    await writeResetRows(rows);
    return { url: `${(await load_public_origin()).publicAppOrigin()}/reset-password?token=${token}` };
  });

export const completePasswordReset = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ token: z.string().min(16), password: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    (await load_isolation()).assertSameSiteRequest();
    const rows = await readResetRows();
    const now = Date.now();
    let matched: ResetRow | null = null;
    for (const row of rows) {
      if (row.usedAt) continue;
      if (Date.parse(row.expiresAt) < now) continue;
      if (await verifySecret(data.token, row.hash)) {
        matched = row;
        break;
      }
    }
    if (!matched) throw new Error("RESET_INVALID");
    await setCredentialPassword(matched.userId, data.password);
    matched.usedAt = new Date().toISOString();
    await writeResetRows(rows);
    await dropUserSessions(matched.userId);
    return { ok: true as const };
  });

export const setMemberPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ userId: z.string().min(1), password: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await setCredentialPassword(data.userId, data.password);
    await dropUserSessions(data.userId);
    return { ok: true as const };
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        currentPassword: z.string().min(8).max(200),
        newPassword: z.string().min(8).max(200),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const ctx = await auth.$context;
    const sql = await getSql();
    let stored: string | null = null;
    try {
      const rows = await sql.query<{ password: string | null }>(
        `select password from "account" where "userId" = $1 and "providerId" = 'credential'`,
        [context.userId],
      );
      stored = rows[0]?.password ?? null;
    } catch {
      const rows = await sql.query<{ password: string | null }>(
        `select password from account where user_id = $1 and provider_id = 'credential'`,
        [context.userId],
      );
      stored = rows[0]?.password ?? null;
    }
    if (!stored) throw new Error("RESET_INVALID");
    const ok = await ctx.password.verify({ password: data.currentPassword, hash: stored });
    if (!ok) throw new Error("RESET_INVALID");
    await setCredentialPassword(context.userId, data.newPassword);
    return { ok: true as const };
  });

async function ensureOwnerUser(): Promise<string> {
  const existing = await findUserByEmail(OWNER_EMAIL);
  if (existing) {
    await ensureProfile(existing, "admin", "ACTIVE");
    return existing;
  }
  const password = randomBytes(24).toString("hex") + "Aa1!";
  const userId = await createCredentialUser("Workspace owner", OWNER_EMAIL, password);
  await ensureProfile(userId, "admin", "ACTIVE");
  return userId;
}

async function createSessionToken(userId: string): Promise<{ token: string; maxAge: number }> {
  const ctx = await auth.$context;
  const session = await ctx.internalAdapter.createSession(userId);
  if (!session?.token) throw new Error("Could not sign in");
  const expires =
    session.expiresAt instanceof Date
      ? session.expiresAt.getTime()
      : Date.parse(String(session.expiresAt));
  const maxAge = Number.isFinite(expires)
    ? Math.max(60, Math.floor((expires - Date.now()) / 1000))
    : 60 * 60 * 24 * 7;
  return { token: session.token, maxAge };
}

function writeSessionCookie(token: string, maxAge: number): void {
  setCookie(SESSION_TOKEN_COOKIE, token, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge,
  });
}

export const unlockSuperAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => PasswordSchema.parse(input))
  .handler(async ({ data }) => {
    (await load_isolation()).assertSameSiteRequest();
    const ip = "sa";
    if (!rateLimit(ip)) throw new Error("SUPER_ADMIN_LOCKED");
    const stored = await (await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH");
    if (!stored) throw new Error("SUPER_ADMIN_UNSET");
    const ok = await verifySecret(data.password, stored);
    if (!ok) {
      recordFail(ip);
      throw new Error("SUPER_ADMIN_INVALID");
    }
    const userId = await ensureOwnerUser();
    await setCredentialPassword(userId, data.password);
    const session = await createSessionToken(userId);
    writeSessionCookie(session.token, session.maxAge);
    return { ok: true as const, token: session.token };
  });

export const elevateToAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => PasswordSchema.parse(input))
  .handler(async ({ context, data }) => {
    if (!rateLimit(context.userId)) throw new Error("SUPER_ADMIN_LOCKED");
    const stored = await (await load_app_settings()).readAppSetting("SUPER_ADMIN_PASSWORD_HASH");
    if (!stored) throw new Error("SUPER_ADMIN_UNSET");
    const ok = await verifySecret(data.password, stored);
    if (!ok) {
      recordFail(context.userId);
      throw new Error("SUPER_ADMIN_INVALID");
    }
    await ensureProfile(context.userId, "admin", "ACTIVE");
    try {
      const { onAuthEvent } = await import("@/lib/server/safety-hooks.server");
      await onAuthEvent({
        actorId: context.userId,
        action: "auth.super_admin",
        summary: "Super Admin elevation",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const setLoginInherit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ userId: z.string().min(1), inheritWorkspaceApis: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Forbidden");
    const users = await readAuthUsers();
    const target = users.find((row) => row.id === data.userId);
    if (target && isOwnerEmail(target.email)) {
      await ensureProfile(data.userId, "admin", "ACTIVE", true);
      return { ok: true as const };
    }
    const profiles = await readProfiles();
    const current = profiles.get(data.userId);
    const role = current?.role ?? "member";
    if (role === "admin") {
      await ensureProfile(data.userId, "admin", current?.status ?? "ACTIVE", true);
      return { ok: true as const };
    }
    await ensureProfile(data.userId, "member", current?.status ?? "ACTIVE", data.inheritWorkspaceApis);
    return { ok: true as const };
  });

export const setTeamRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ userId: z.string().min(1), role: z.enum(["admin", "member"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Forbidden");
    const profiles = await readProfiles();
    const current = profiles.get(data.userId);
    await ensureProfile(
      data.userId,
      data.role,
      current?.status ?? "ACTIVE",
      data.role === "admin" ? true : Boolean(current?.inheritWorkspaceApis),
    );
    return { ok: true as const };
  });
