/** Client-safe agency safety contracts. Secrets never live here. */

import type { SocialPlatform } from "@/lib/entities";
import type { SocialPreferredRail } from "@/lib/publishers";
import type { SocialUploadMode } from "@/lib/social";

export const SAFETY_INBOX_QUERY_KEY = ["safety-inbox"] as const;
export const APPROVALS_QUERY_KEY = ["approvals"] as const;
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const AUDIT_QUERY_KEY = ["audit-events"] as const;
export const SAFETY_SETTINGS_QUERY_KEY = ["safety-settings"] as const;

export const APPROVAL_TYPES = [
  "PUBLISH_SOCIAL",
  "RENDER_RELEASE",
  "STAGE_ADVANCE",
  "ASSET_EXTERNAL",
  "CUSTOM",
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const NOTIFICATION_CATEGORIES = [
  "BILLING",
  "SOCIAL",
  "PIPELINE",
  "AGENT",
  "SYSTEM",
  "APPROVAL",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

export const AUDIT_ACTOR_TYPES = ["USER", "SYSTEM", "HERMES", "WEBHOOK", "AGENT", "PORTAL"] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export type ApprovalPolicy = {
  requireForSocialPublish: boolean;
  requireForPlatforms: SocialPlatform[];
  allowSelfApprove: boolean;
  stageAdvanceRequiresApproval: boolean;
};

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = {
  requireForSocialPublish: true,
  requireForPlatforms: [],
  allowSelfApprove: true,
  stageAdvanceRequiresApproval: false,
};

export type NotificationChannels = {
  discordWebhookConfigured: boolean;
  emailEnabled: boolean;
  emailWebhookConfigured: boolean;
};

export type JsonScalar = string | number | boolean | null;
export type JsonRecord = { [key: string]: JsonScalar | JsonScalar[] | { [key: string]: JsonScalar } };

export type SocialPublishPayload = {
  platforms: SocialPlatform[];
  caption: string | null;
  mediaUrl: string | null;
  mediaAssetId: string | null;
  assetId: string | null;
  preferredRail: SocialPreferredRail;
  fallbackToBrowser: boolean;
  mode: SocialUploadMode;
  clientName: string;
};

export type ApprovalRequest = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  type: ApprovalType;
  resourceType: string;
  resourceId: string;
  status: ApprovalStatus;
  title: string;
  summary: string | null;
  payload: JsonRecord;
  requestedBy: string;
  assignedTo: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionNote: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  workspaceId: string;
  userId: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  workspaceId: string;
  at: string;
  actorUserId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string | null;
  entityId: string | null;
  clientId: string | null;
  summary: string;
  metadata: JsonRecord;
  requestId: string | null;
  jobId: string | null;
};

export type NotificationPrefs = {
  userId: string;
  mutedCategories: NotificationCategory[];
  emailEnabled: boolean;
};

export type SafetyInbox = {
  pendingApprovals: number;
  unreadNotifications: number;
  latest: AppNotification[];
  role: "admin" | "member" | null;
};

export type SafetySettings = {
  policy: ApprovalPolicy;
  channels: NotificationChannels;
  retentionNote: string;
};

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  PUBLISH_SOCIAL: "Social publish",
  RENDER_RELEASE: "Render release",
  STAGE_ADVANCE: "Stage advance",
  ASSET_EXTERNAL: "External asset",
  CUSTOM: "Custom",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "Waiting",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  BILLING: "Billing",
  SOCIAL: "Social",
  PIPELINE: "Pipeline",
  AGENT: "Agent",
  SYSTEM: "System",
  APPROVAL: "Approvals",
};

export const AUDIT_ACTOR_LABELS: Record<AuditActorType, string> = {
  USER: "Operator",
  SYSTEM: "System",
  HERMES: "Hermes",
  WEBHOOK: "Webhook",
  AGENT: "Agent",
  PORTAL: "Client portal",
};

export function parseApprovalPolicy(raw: unknown): ApprovalPolicy {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_APPROVAL_POLICY };
  const rec = raw as Record<string, unknown>;
  const platforms = Array.isArray(rec.requireForPlatforms)
    ? rec.requireForPlatforms.filter(
        (item): item is SocialPlatform =>
          item === "instagram" || item === "x" || item === "tiktok" || item === "youtube",
      )
    : [];
  return {
    requireForSocialPublish: rec.requireForSocialPublish !== false,
    requireForPlatforms: platforms,
    allowSelfApprove: rec.allowSelfApprove !== false,
    stageAdvanceRequiresApproval: rec.stageAdvanceRequiresApproval === true,
  };
}

export function requiresSocialPublishApproval(
  policy: ApprovalPolicy,
  platforms: SocialPlatform[],
): boolean {
  if (!policy.requireForSocialPublish) return false;
  if (policy.requireForPlatforms.length === 0) return true;
  return platforms.some((platform) => policy.requireForPlatforms.includes(platform));
}

export function shortActor(id: string | null | undefined): string {
  if (!id) return "Unknown";
  if (id.startsWith("agent:")) return "Hermes";
  if (id.startsWith("portal:")) return "Client portal";
  if (id === "system" || id === "discord-status-agent") return "System";
  if (id.length <= 10) return id;
  return `…${id.slice(-6)}`;
}
