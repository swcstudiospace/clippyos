import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { readAppSetting } from "@/lib/server/app-settings.server";
import { ensureSafetySchema, listActiveOperatorIds } from "@/lib/server/safety-schema.server";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SEVERITIES,
  type AppNotification,
  type NotificationCategory,
  type NotificationPrefs,
  type NotificationSeverity,
} from "@/lib/safety";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function mapNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id ?? ""),
    workspaceId: String(row.workspace_id ?? "default"),
    userId: String(row.user_id ?? ""),
    category: oneOf(row.category, NOTIFICATION_CATEGORIES, "SYSTEM"),
    severity: oneOf(row.severity, NOTIFICATION_SEVERITIES, "INFO"),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    href: row.href == null ? null : String(row.href),
    entityType: row.entity_type == null ? null : String(row.entity_type),
    entityId: row.entity_id == null ? null : String(row.entity_id),
    readAt: row.read_at == null ? null : String(row.read_at),
    createdAt: String(row.created_at ?? ""),
  };
}

async function readPrefs(userId: string): Promise<NotificationPrefs> {
  try {
    await ensureSafetySchema();
  } catch {
    /* still */
  }
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data) {
      const rec = data as Record<string, unknown>;
      let muted: NotificationCategory[] = [];
      try {
        const parsed = JSON.parse(String(rec.muted_categories ?? "[]")) as unknown;
        if (Array.isArray(parsed)) {
          muted = parsed.filter((item): item is NotificationCategory =>
            NOTIFICATION_CATEGORIES.includes(item as NotificationCategory),
          );
        }
      } catch {
        muted = [];
      }
      return {
        userId,
        mutedCategories: muted,
        emailEnabled: rec.email_enabled === "1" || rec.email_enabled === true,
      };
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ muted_categories: string; email_enabled: string }>(
      "select muted_categories, email_enabled from notification_preferences where user_id = $1",
      [userId],
    );
    if (rows[0]) {
      let muted: NotificationCategory[] = [];
      try {
        const parsed = JSON.parse(rows[0].muted_categories) as unknown;
        if (Array.isArray(parsed)) {
          muted = parsed.filter((item): item is NotificationCategory =>
            NOTIFICATION_CATEGORIES.includes(item as NotificationCategory),
          );
        }
      } catch {
        muted = [];
      }
      return { userId, mutedCategories: muted, emailEnabled: rows[0].email_enabled === "1" };
    }
  } catch {
    /* empty */
  }
  return { userId, mutedCategories: [], emailEnabled: false };
}

export async function writeNotificationPrefs(input: {
  userId: string;
  mutedCategories: NotificationCategory[];
  emailEnabled: boolean;
}): Promise<NotificationPrefs> {
  await ensureSafetySchema();
  const stamp = nowIso();
  const muted = JSON.stringify(input.mutedCategories);
  const email = input.emailEnabled ? "1" : "0";
  const payload = {
    user_id: input.userId,
    muted_categories: muted,
    email_enabled: email,
    updated_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into notification_preferences (user_id, muted_categories, email_enabled, updated_at)
       values ($1,$2,$3,$4)
       on conflict (user_id) do update set muted_categories = excluded.muted_categories, email_enabled = excluded.email_enabled, updated_at = excluded.updated_at`,
      [input.userId, muted, email, stamp],
    );
  } catch {
    /* ok */
  }
  return { userId: input.userId, mutedCategories: input.mutedCategories, emailEnabled: input.emailEnabled };
}

async function insertNotification(row: {
  id: string;
  workspace_id: string;
  user_id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("notifications").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) return;
  }
  const sql = await localSql();
  await sql.query(
    `insert into notifications
      (id, workspace_id, user_id, category, severity, title, body, href, entity_type, entity_id, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      row.id,
      row.workspace_id,
      row.user_id,
      row.category,
      row.severity,
      row.title,
      row.body,
      row.href,
      row.entity_type,
      row.entity_id,
      row.created_at,
    ],
  );
}

async function deliverExternal(input: {
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string | null;
}): Promise<void> {
  const webhook = (await readAppSetting("OPS_DISCORD_WEBHOOK"))?.trim() ?? "";
  if (webhook.startsWith("https://")) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**${input.title}**\n${input.body}${input.href ? `\n${input.href}` : ""}`.slice(0, 1800),
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      /* optional */
    }
  }
  const emailOn = (await readAppSetting("OPS_EMAIL_ENABLED"))?.trim() === "true";
  const emailHook = (await readAppSetting("OPS_EMAIL_WEBHOOK"))?.trim() ?? "";
  if (emailOn && emailHook.startsWith("https://") && (input.severity === "CRITICAL" || input.severity === "WARNING")) {
    try {
      await fetch(emailHook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.title, body: input.body, href: input.href, severity: input.severity }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      /* optional */
    }
  }
}

export async function notifyUsers(input: {
  userIds: string[];
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  forceCritical?: boolean;
}): Promise<void> {
  try {
    await ensureSafetySchema();
  } catch {
    /* still */
  }
  const stamp = nowIso();
  const ids = [...new Set(input.userIds.filter(Boolean))];
  for (const userId of ids) {
    const prefs = await readPrefs(userId);
    const muted =
      input.severity !== "CRITICAL" &&
      !input.forceCritical &&
      prefs.mutedCategories.includes(input.category);
    if (muted) continue;
    try {
      await insertNotification({
        id: newId(),
        workspace_id: "default",
        user_id: userId,
        category: input.category,
        severity: input.severity,
        title: input.title.slice(0, 160),
        body: input.body.slice(0, 600),
        href: input.href ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        created_at: stamp,
      });
    } catch {
      /* isolated */
    }
  }
  if (input.severity === "CRITICAL" || input.severity === "WARNING") {
    void deliverExternal({
      severity: input.severity,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    });
  }
}

export async function notifyAdmins(
  input: Omit<Parameters<typeof notifyUsers>[0], "userIds"> & { extraUserIds?: string[] },
): Promise<void> {
  const admins = await listActiveOperatorIds({ adminsOnly: true });
  const extras = input.extraUserIds ?? [];
  const userIds = admins.length > 0 ? [...admins, ...extras] : extras;
  if (userIds.length === 0) return;
  await notifyUsers({ ...input, userIds });
}

export async function listNotifications(
  userId: string,
  opts?: { unreadOnly?: boolean; limit?: number },
): Promise<AppNotification[]> {
  try {
    await ensureSafetySchema();
  } catch {
    /* still */
  }
  const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 100);
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (opts?.unreadOnly) q = q.is("read_at", null);
    const { data, error } = await q;
    if (!error) return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      opts?.unreadOnly
        ? "select * from notifications where user_id = $1 and read_at is null order by created_at desc limit $2"
        : "select * from notifications where user_id = $1 order by created_at desc limit $2",
      [userId, limit],
    );
    return rows.map(mapNotification);
  } catch {
    return [];
  }
}

export async function markNotificationsRead(input: {
  userId: string;
  ids?: string[];
  all?: boolean;
}): Promise<number> {
  await ensureSafetySchema();
  const stamp = nowIso();
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("notifications").update({ read_at: stamp }).eq("user_id", input.userId).is("read_at", null);
    if (!input.all && input.ids && input.ids.length > 0) q = q.in("id", input.ids);
    const { error } = await q;
    if (error && !isMissingTable(error)) {
      /* local fallback */
    }
  }
  try {
    const sql = await localSql();
    if (input.all) {
      const rows = await sql.query<{ id: string }>(
        "update notifications set read_at = $2 where user_id = $1 and read_at is null returning id",
        [input.userId, stamp],
      );
      return rows.length;
    }
    const ids = input.ids ?? [];
    if (ids.length === 0) return 0;
    const rows = await sql.query<{ id: string }>(
      "update notifications set read_at = $3 where user_id = $1 and id = any($2::text[]) and read_at is null returning id",
      [input.userId, ids, stamp],
    );
    return rows.length;
  } catch {
    return 0;
  }
}

export async function unreadCount(userId: string): Promise<number> {
  const rows = await listNotifications(userId, { unreadOnly: true, limit: 80 });
  return rows.length;
}

export { readPrefs as readNotificationPrefs };
