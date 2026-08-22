/** Client-safe Hermes Connect + Autonomous OS catalog. Secrets never live here. */

import type { HermesConnectionState, WebhookEventType } from "@/lib/autonomy";
import type { IntegrationId } from "@/lib/integrations";
import type { PlaybookPolicies } from "@/lib/playbooks";

export type { HermesConnectionState } from "@/lib/autonomy";

export const PLAYBOOK_PACKAGE_VERSION = "2026.08.orchestrate";

export const HERMES_CONNECT_QUERY_KEY = ["hermes-connect"] as const;

export const HERMES_CONNECTION_STATES = [
  "not_connected",
  "key_only",
  "fully_connected",
] as const satisfies readonly HermesConnectionState[];

export const HERMES_CONNECTION_LABELS: Record<HermesConnectionState, string> = {
  not_connected: "Not connected",
  key_only: "Key only",
  fully_connected: "Fully connected",
};

export type HermesConnectFlags = {
  pastedIntoHermes: boolean;
  pastedAt: string | null;
  socialPolicyAckedAt: string | null;
  outboundSkipped: boolean;
};

export type HermesConnectStepId = "mintKey" | "pastePlaybook" | "socialPolicy" | "outbound";

export type HermesConnectSteps = Record<HermesConnectStepId, boolean>;

export type DeliveryByEvent = Partial<
  Record<WebhookEventType, { at: string; status: string }>
>;

export type HermesConnectStatus = {
  hasHermesKey: boolean;
  keyLastUsedAt: string | null;
  keyLast4: string | null;
  keyName: string | null;
  hermesConnection: HermesConnectionState;
  playbookPackageVersion: string;
  pastedIntoHermes: boolean;
  pastedAt: string | null;
  socialPolicyAcked: boolean;
  outboundSkipped: boolean;
  policies: PlaybookPolicies;
  webhookSubscriptions: WebhookEventType[];
  outboundUrlConfigured: boolean;
  lastDelivery: {
    at: string | null;
    status: string | null;
    eventType: string | null;
  };
  lastDeliveryByEvent: DeliveryByEvent;
  daytonaConnected: boolean;
  socialMachineState: string;
  automationEnabled: boolean;
  mcpConfigured: boolean;
  webhookConfigured: boolean;
  steps: HermesConnectSteps;
  completedRequired: number;
  requiredTotal: number;
};

export const SOCIAL_LIFECYCLE_EVENTS = [
  "social.upload.succeeded",
  "social.upload.failed",
  "social.upload.needs_attention",
  "social.session.needs_login",
  "social.session.healthy",
  "social.machine.started",
  "social.machine.stopped",
  "social.machine.error",
] as const satisfies readonly WebhookEventType[];

export type AddonLayer = "core" | "addon" | "control-plane";

export type AddonMeta = {
  id: IntegrationId;
  layer: AddonLayer;
  requiredFor: string;
  usedBy: string[];
};

export const ADDON_META: Record<IntegrationId, AddonMeta> = {
  ai: {
    id: "ai",
    layer: "core",
    requiredFor: "Required for Ideation, Thumbnails, titles/ideas, and the Discord agent",
    usedBy: [
      "Ideation",
      "Thumbnails",
      "Client titles & ideas",
      "Discord Status Agent",
      "content_ideation_cadence",
    ],
  },
  higgsfield: {
    id: "higgsfield",
    layer: "addon",
    requiredFor: "Media generation for 16:9 4K thumbnails",
    usedBy: ["Thumbnails"],
  },
  youtube: {
    id: "youtube",
    layer: "addon",
    requiredFor: "Public YouTube Data API pulls into AnalyticsSnapshot",
    usedBy: ["Analytics", "weekly_analytics_refresh", "thirty_day_guarantee_monitor"],
  },
  discord: {
    id: "discord",
    layer: "addon",
    requiredFor: "Read-only production-stage agent",
    usedBy: ["Client pipeline", "discord_agent_followthrough"],
  },
  notion: {
    id: "notion",
    layer: "addon",
    requiredFor: "Optional notes and briefing access",
    usedBy: ["Optional notes"],
  },
  linear: {
    id: "linear",
    layer: "addon",
    requiredFor: "Optional Kanban for failed jobs, renders, and agent runs",
    usedBy: ["Social", "Library", "Agent", "reactor_linear_social_fail"],
  },
  x: {
    id: "x",
    layer: "addon",
    requiredFor: "Native X API publishing without Computer Use",
    usedBy: ["Social", "distribute_published_client_asset", "daily_social_distribution_sweep"],
  },
  daytona: {
    id: "daytona",
    layer: "core",
    requiredFor: "Required for Social Computer Use (Instagram, X, TikTok)",
    usedBy: [
      "Social",
      "distribute_published_client_asset",
      "daily_social_distribution_sweep",
      "social_session_health_check",
      "reactor_session_needs_login",
    ],
  },
  telegram: {
    id: "telegram",
    layer: "addon",
    requiredFor: "Professional Telegram liaison for customers and companies",
    usedBy: ["Inbox"],
  },
  whatsapp: {
    id: "whatsapp",
    layer: "addon",
    requiredFor: "Professional WhatsApp Cloud API liaison",
    usedBy: ["Inbox"],
  },
  airwallex: {
    id: "airwallex",
    layer: "control-plane",
    requiredFor: "Workspace subscription checkout and entitlement",
    usedBy: ["Billing", "Access gate"],
  },
};

export const ADDON_LAYER_LABELS: Record<AddonLayer, string> = {
  core: "Core OS",
  addon: "Add-on",
  "control-plane": "Control plane",
};

export function deriveHermesConnection(input: {
  hasHermesKey: boolean;
  keyLastUsedAt: string | null;
}): HermesConnectionState {
  if (!input.hasHermesKey) return "not_connected";
  if (input.keyLastUsedAt) return "fully_connected";
  return "key_only";
}

export function deriveConnectSteps(input: {
  hasHermesKey: boolean;
  keyLastUsedAt: string | null;
  pastedIntoHermes: boolean;
  socialPolicyAcked: boolean;
  outboundUrlConfigured: boolean;
  outboundSkipped: boolean;
}): HermesConnectSteps {
  return {
    mintKey: input.hasHermesKey,
    pastePlaybook: input.pastedIntoHermes || Boolean(input.keyLastUsedAt),
    socialPolicy: input.socialPolicyAcked,
    outbound: input.outboundUrlConfigured || input.outboundSkipped,
  };
}
