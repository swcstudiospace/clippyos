import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole, requireAdmin } from "@/lib/server/access";
import {
  APPROVAL_STATUSES,
  DEFAULT_APPROVAL_POLICY,
  NOTIFICATION_CATEGORIES,
  parseApprovalPolicy,
  type ApprovalRequest,
  type AppNotification,
  type AuditEvent,
  type NotificationPrefs,
  type SafetyInbox,
  type SafetySettings,
} from "@/lib/safety";
import { readAppSetting, writeAppSetting, deleteAppSetting } from "@/lib/server/app-settings.server";

async function maybeNotifyOverdue(): Promise<void> {
  try {
    const { readPayments } = await import("@/lib/server/money");
    const { displayPaymentStatus } = await import("@/lib/money");
    const { todayIsoDate } = await import("@/lib/format");
    const { notifyAdmins } = await import("@/lib/server/notifications.server");
    const today = todayIsoDate();
    const payments = await readPayments();
    const overdue = payments.filter((row) => displayPaymentStatus(row, today) === "OVERDUE");
    if (overdue.length === 0) return;
    let notified: string[] = [];
    try {
      const raw = await readAppSetting("OVERDUE_NOTIFIED_JSON");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) notified = parsed.map(String);
      }
    } catch {
      notified = [];
    }
    const fresh = overdue.filter((row) => !notified.includes(row.id));
    if (fresh.length === 0) return;
    for (const payment of fresh.slice(0, 8)) {
      await notifyAdmins({
        category: "BILLING",
        severity: "CRITICAL",
        title: "Payment overdue",
        body: "A client payment is past due.",
        href: "/money",
        entityType: "payment",
        entityId: payment.id,
      });
      notified.push(payment.id);
    }
    await writeAppSetting("OVERDUE_NOTIFIED_JSON", JSON.stringify(notified.slice(-200)));
  } catch {
    /* optional */
  }
}

async function maybeNotifyGuaranteeRisk(): Promise<void> {
  try {
    const { readClients } = await import("@/lib/server/clients");
    const { readSnapshots } = await import("@/lib/server/analytics");
    const { deriveGuaranteeItems } = await import("@/lib/dashboard");
    const { todayIsoDate } = await import("@/lib/format");
    const { onGuaranteeRisk } = await import("@/lib/server/safety-hooks.server");
    const today = todayIsoDate();
    const [clients, snapshots] = await Promise.all([readClients(), readSnapshots()]);
    const atRisk = deriveGuaranteeItems(clients, snapshots, today).filter(
      (item) => item.dayCount >= 25 && item.viewsIncreased !== true,
    );
    if (atRisk.length === 0) return;
    let notified: Record<string, string> = {};
    try {
      const raw = await readAppSetting("GUARANTEE_NOTIFIED_JSON");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          notified = parsed as Record<string, string>;
        }
      }
    } catch {
      notified = {};
    }
    let dirty = false;
    for (const item of atRisk.slice(0, 8)) {
      if (notified[item.clientId] === today) continue;
      await onGuaranteeRisk({
        clientId: item.clientId,
        clientName: item.name,
        dayCount: item.dayCount,
      });
      notified[item.clientId] = today;
      dirty = true;
    }
    if (dirty) await writeAppSetting("GUARANTEE_NOTIFIED_JSON", JSON.stringify(notified));
  } catch {
    /* optional */
  }
}

export const getSafetyInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SafetyInbox> => {
    const { listApprovalRequests } = await import("@/lib/server/approvals.server");
    const { listNotifications, unreadCount } = await import("@/lib/server/notifications.server");
    const [pending, latest, unread, role] = await Promise.all([
      listApprovalRequests({ status: "PENDING", limit: 40 }),
      listNotifications(context.userId, { limit: 8 }),
      unreadCount(context.userId),
      getUserRole(context.userId),
    ]);
    void maybeNotifyOverdue().catch(() => {});
    void maybeNotifyGuaranteeRisk().catch(() => {});
    return {
      pendingApprovals: pending.length,
      unreadNotifications: unread,
      latest,
      role,
    };
  });

export const listApprovalsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        status: z.enum(APPROVAL_STATUSES).optional(),
        clientId: z.string().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ items: ApprovalRequest[] }> => {
    const { listApprovalRequests } = await import("@/lib/server/approvals.server");
    const items = await listApprovalRequests({
      status: data.status,
      clientId: data.clientId,
      limit: 80,
    });
    return { items };
  });

export const decideApprovalFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        decision: z.enum(["APPROVED", "REJECTED", "CANCELED"]),
        note: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { decideApproval } = await import("@/lib/server/approvals.server");
    const item = await decideApproval({
      id: data.id,
      actorId: context.userId,
      decision: data.decision,
      note: data.note,
    });
    return { item };
  });

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: AppNotification[] }> => {
    const { listNotifications } = await import("@/lib/server/notifications.server");
    return { items: await listNotifications(context.userId, { limit: 50 }) };
  });

export const markNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        ids: z.array(z.string()).optional(),
        all: z.boolean().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { markNotificationsRead } = await import("@/lib/server/notifications.server");
    const count = await markNotificationsRead({
      userId: context.userId,
      ids: data.ids,
      all: data.all,
    });
    return { ok: true as const, count };
  });

export const getNotificationPrefsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NotificationPrefs> => {
    const { readNotificationPrefs } = await import("@/lib/server/notifications.server");
    return readNotificationPrefs(context.userId);
  });

export const saveNotificationPrefsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        mutedCategories: z.array(z.enum(NOTIFICATION_CATEGORIES)),
        emailEnabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { writeNotificationPrefs } = await import("@/lib/server/notifications.server");
    return writeNotificationPrefs({
      userId: context.userId,
      mutedCategories: data.mutedCategories,
      emailEnabled: data.emailEnabled,
    });
  });

export const listAuditEventsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        action: z.string().max(120).optional(),
        actorUserId: z.string().max(80).optional(),
        clientId: z.string().max(80).optional(),
        since: z.string().max(40).optional(),
        until: z.string().max(40).optional(),
        format: z.enum(["json", "csv"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ items: AuditEvent[]; csv?: string }> => {
    await requireAdmin(context.userId);
    const { listAuditEvents, auditEventsToCsv } = await import("@/lib/server/audit.server");
    const items = await listAuditEvents({
      action: data.action,
      actorUserId: data.actorUserId,
      clientId: data.clientId,
      since: data.since,
      until: data.until,
      limit: 200,
    });
    if (data.format === "csv") return { items, csv: auditEventsToCsv(items) };
    return { items };
  });

export const getSafetySettingsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<SafetySettings> => {
    try {
      const { readApprovalPolicy } = await import("@/lib/server/approvals.server");
      const [policy, webhook, emailOn, emailHook] = await Promise.all([
        readApprovalPolicy(),
        readAppSetting("OPS_DISCORD_WEBHOOK"),
        readAppSetting("OPS_EMAIL_ENABLED"),
        readAppSetting("OPS_EMAIL_WEBHOOK"),
      ]);
      return {
        policy,
        channels: {
          discordWebhookConfigured: Boolean(webhook?.startsWith("https://")),
          emailEnabled: emailOn === "true",
          emailWebhookConfigured: Boolean(emailHook?.startsWith("https://")),
        },
        retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history.",
      };
    } catch {
      return {
        policy: DEFAULT_APPROVAL_POLICY,
        channels: {
          discordWebhookConfigured: false,
          emailEnabled: false,
          emailWebhookConfigured: false,
        },
        retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history.",
      };
    }
  });

export const saveApprovalPolicyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        requireForSocialPublish: z.boolean(),
        requireForPlatforms: z.array(z.enum(["instagram", "x", "tiktok", "youtube"])),
        allowSelfApprove: z.boolean(),
        stageAdvanceRequiresApproval: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { writeApprovalPolicy } = await import("@/lib/server/approvals.server");
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    const policy = await writeApprovalPolicy(parseApprovalPolicy(data) ?? DEFAULT_APPROVAL_POLICY);
    await writeAuditEvent({
      actorUserId: context.userId,
      actorType: "USER",
      action: "settings.approvals.updated",
      entityType: "app_setting",
      entityId: "APPROVALS_POLICY_JSON",
      summary: "Approvals policy updated",
      metadata: { requireForSocialPublish: policy.requireForSocialPublish },
    });
    return { policy };
  });

export const saveOpsChannelsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        discordWebhook: z.string().max(500).optional(),
        emailEnabled: z.boolean().optional(),
        emailWebhook: z.string().max(500).optional(),
        clearDiscord: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.clearDiscord) await deleteAppSetting("OPS_DISCORD_WEBHOOK");
    if (typeof data.discordWebhook === "string" && data.discordWebhook.startsWith("https://")) {
      await writeAppSetting("OPS_DISCORD_WEBHOOK", data.discordWebhook.trim());
    }
    if (typeof data.emailEnabled === "boolean") {
      await writeAppSetting("OPS_EMAIL_ENABLED", data.emailEnabled ? "true" : "false");
    }
    if (typeof data.emailWebhook === "string" && data.emailWebhook.startsWith("https://")) {
      await writeAppSetting("OPS_EMAIL_WEBHOOK", data.emailWebhook.trim());
    }
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    await writeAuditEvent({
      actorUserId: context.userId,
      actorType: "USER",
      action: "settings.notifications.updated",
      entityType: "app_setting",
      entityId: "OPS_CHANNELS",
      summary: "Notification channels updated",
    });
    return { ok: true as const };
  });

export const recordLoginFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { onAuthEvent } = await import("@/lib/server/safety-hooks.server");
    await onAuthEvent({
      actorId: context.userId,
      action: "auth.login",
      summary: "Operator signed in",
    });
    return { ok: true as const };
  });
