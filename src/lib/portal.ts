/** Client-safe portal contracts. Tokens and password hashes never live here. */

import type { ProgressStage } from "@/lib/entities";
import type { ApprovalRequest, AppNotification } from "@/lib/safety";
import type { LibraryAsset } from "@/lib/library";

export const PORTAL_QUERY_KEY = ["portal-session"] as const;
export const PORTAL_HOME_KEY = ["portal-home"] as const;
export const PORTAL_ASSETS_KEY = ["portal-assets"] as const;
export const PORTAL_APPROVALS_KEY = ["portal-approvals"] as const;
export const PORTAL_ACTIVITY_KEY = ["portal-activity"] as const;
export const PORTAL_ADMIN_KEY = ["portal-admin"] as const;
export const PORTAL_SETTINGS_KEY = ["portal-settings"] as const;
export const PORTAL_TOKEN_STORAGE_KEY = "clippy-portal-token";

export const PORTAL_USER_STATUSES = ["INVITED", "ACTIVE", "REVOKED"] as const;
export type PortalUserStatus = (typeof PORTAL_USER_STATUSES)[number];

export const PORTAL_CLIENT_FACING_TYPES = ["PUBLISH_SOCIAL", "RENDER_RELEASE"] as const;

export const PORTAL_ACTIVITY_ACTIONS = [
  "approval.requested",
  "approval.approved",
  "approval.rejected",
  "progress.stage_changed",
  "social.publish.succeeded",
  "portal.login",
  "portal.approve",
  "portal.reject",
  "portal.invite",
  "library.asset_ready",
] as const;

export type PortalSettings = {
  enabled: boolean;
  allowDownload: boolean;
  showMetrics: boolean;
  approvalsEnabled: boolean;
  welcomeBlurb: string;
  agencyName: string;
  logoUrl: string | null;
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  enabled: true,
  allowDownload: false,
  showMetrics: false,
  approvalsEnabled: true,
  welcomeBlurb: "Here’s where production stands, what’s ready to review, and what already shipped.",
  agencyName: "ClippyOS",
  logoUrl: null,
};

export type PortalUserPublic = {
  id: string;
  clientId: string;
  email: string;
  name: string | null;
  status: PortalUserStatus;
  lastLoginAt: string | null;
  canApprove: boolean;
  createdAt: string;
};

export type PortalSession = {
  userId: string | null;
  clientId: string;
  email: string | null;
  name: string | null;
  canApprove: boolean;
  preview: boolean;
  status: PortalUserStatus | "PREVIEW";
};

export type PortalClientPublic = {
  id: string;
  name: string;
  channelThumbnail: string | null;
  planLabel: string;
  startDate: string | null;
};

export type PortalHome = {
  settings: PortalSettings;
  client: PortalClientPublic;
  stage: ProgressStage | null;
  stageUpdatedAt: string | null;
  workingOn: string | null;
  pendingApprovals: number;
  newAssetsThisWeek: number;
  dayCount: number | null;
  preview: boolean;
  canApprove: boolean;
  notifications: AppNotification[];
  unread: number;
};

export type PortalAsset = Pick<
  LibraryAsset,
  "id" | "kind" | "title" | "status" | "durationSec" | "previewUrl" | "createdAt" | "mimeType"
> & {
  views: number | null;
};

export type PortalActivityItem = {
  id: string;
  at: string;
  action: string;
  title: string;
  detail: string | null;
};

export type PortalApproval = ApprovalRequest;

export type PortalInvitePreview = {
  email: string;
  clientName: string;
  agencyName: string;
  expiresAt: string | null;
};

export function portalActorId(userId: string): string {
  return `portal:${userId}`;
}

export function isPortalActorId(id: string | null | undefined): boolean {
  return Boolean(id && id.startsWith("portal:"));
}

export function getPortalBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PORTAL_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPortalBearerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, token);
    else window.sessionStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
}

export function parsePortalSettings(raw: unknown): PortalSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PORTAL_SETTINGS };
  const rec = raw as Record<string, unknown>;
  const logo = typeof rec.logoUrl === "string" ? rec.logoUrl.trim() : "";
  const name = typeof rec.agencyName === "string" ? rec.agencyName.trim() : "";
  const blurb = typeof rec.welcomeBlurb === "string" ? rec.welcomeBlurb.trim() : "";
  return {
    enabled: rec.enabled !== false,
    allowDownload: rec.allowDownload === true,
    showMetrics: rec.showMetrics === true,
    approvalsEnabled: rec.approvalsEnabled !== false,
    welcomeBlurb: blurb.slice(0, 400) || DEFAULT_PORTAL_SETTINGS.welcomeBlurb,
    agencyName: name.slice(0, 80) || DEFAULT_PORTAL_SETTINGS.agencyName,
    logoUrl: logo && /^https?:\/\//i.test(logo) ? logo.slice(0, 500) : null,
  };
}
