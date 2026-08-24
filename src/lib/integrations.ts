export const INTEGRATION_IDS = [
  "ai",
  "higgsfield",
  "youtube",
  "discord",
  "notion",
  "linear",
  "x",
  "daytona",
  "telegram",
  "whatsapp",
  "whop",
] as const;

export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export type IntegrationHealth =
  | "not_configured"
  | "saved"
  | "connected"
  | "error"
  | "token_expired";

export type IntegrationMeta = {
  lastTestedAt: string | null;
  lastError: string | null;
  lastOk: boolean | null;
};

export type DiscordAgentHealth = {
  lastRunAt: string | null;
  lastOk: boolean | null;
  summary: string | null;
  matched: number;
  skipped: number;
};

export type IntegrationCardStatus = {
  id: IntegrationId;
  configured: boolean;
  health: IntegrationHealth;
  lastTestedAt: string | null;
  lastError: string | null;
  last4: string | null;
  required: boolean;
  handle?: string | null;
};

export type IntegrationsSnapshot = {
  items: Record<IntegrationId, IntegrationCardStatus>;
  firstLaunchCompleted: boolean;
  superAdminConfigured: boolean;
  role: "admin" | "member" | null;
  inheritWorkspaceApis: boolean;
  canEditIntegrations: boolean;
  discordAgent: DiscordAgentHealth;
};

export const INTEGRATIONS_QUERY_KEY = ["integrations"] as const;

export const INTEGRATION_COPY: Record<
  IntegrationId,
  { name: string; purpose: string; required: boolean; time: string }
> = {
  ai: {
    name: "AI API",
    purpose: "Ideation, thumbnails, channel analysis, and the Discord agent.",
    required: true,
    time: "~2 min",
  },
  higgsfield: {
    name: "Higgsfield",
    purpose: "16:9 4K YouTube thumbnails via nano-banana-pro.",
    required: false,
    time: "~3 min",
  },
  youtube: {
    name: "YouTube Data API",
    purpose: "Public channel stats for Analytics snapshots. Upload uses Settings → Social publishers (OAuth).",
    required: false,
    time: "~5 min",
  },
  discord: {
    name: "Discord Bot",
    purpose: "Read-only Status Agent that updates production stages.",
    required: false,
    time: "~5 min",
  },
  notion: {
    name: "Notion",
    purpose: "Optional notes and briefing access.",
    required: false,
    time: "~4 min",
  },
  linear: {
    name: "Linear",
    purpose: "Kanban for engineering and ops tickets. Deep-links only — the board stays in Linear.",
    required: false,
    time: "~10 min",
  },
  x: {
    name: "X (API publish)",
    purpose: "Post clips to X via the official API. Computer Use stays the fallback.",
    required: false,
    time: "~10 min",
  },
  daytona: {
    name: "Daytona (Windows Social Machine)",
    purpose: "On-demand Windows VM for Computer Use. Hibernate = hot snapshot. AU clock, US/EU IPs. Optional residential proxy.",
    required: false,
    time: "~5 min",
  },
  telegram: {
    name: "Telegram",
    purpose: "Professional customer and company liaison via Bot API. Inbox, not Computer Use.",
    required: false,
    time: "~4 min",
  },
  whatsapp: {
    name: "WhatsApp",
    purpose: "Business Cloud API for client and company chats. Inbox, not Computer Use.",
    required: false,
    time: "~8 min",
  },
  whop: {
    name: "Whop Billing",
    purpose: "SaaS subscription checkout + community for ClippyOS itself — not client invoices.",
    required: false,
    time: "~8 min",
  },
};

export const BANNER_BY_PATH: Array<{
  match: (path: string) => boolean;
  id: IntegrationId;
}> = [
  {
    match: (path) =>
      path.startsWith("/ideation") ||
      path.startsWith("/agent") ||
      path.startsWith("/thumbnails") ||
      path.startsWith("/clients"),
    id: "ai",
  },
  { match: (path) => path.startsWith("/thumbnails") || path.startsWith("/agent"), id: "higgsfield" },
  { match: (path) => path.startsWith("/analytics"), id: "youtube" },
  { match: (path) => path.startsWith("/social") || path.startsWith("/agent") || path.startsWith("/health"), id: "daytona" },
  { match: (path) => path.startsWith("/inbox"), id: "telegram" },
  { match: (path) => path.startsWith("/inbox"), id: "whatsapp" },
  { match: (path) => path.startsWith("/billing"), id: "whop" },
];

export function healthLabel(health: IntegrationHealth): string {
  switch (health) {
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    case "token_expired":
      return "Token expired";
    case "saved":
      return "Saved";
    default:
      return "Not configured";
  }
}

export function healthTone(
  health: IntegrationHealth,
): "green" | "red" | "blue" | "orange" | "neutral" {
  switch (health) {
    case "connected":
      return "green";
    case "error":
      return "red";
    case "token_expired":
      return "orange";
    case "saved":
      return "blue";
    default:
      return "neutral";
  }
}
