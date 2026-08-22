/** Client-safe Telegram / WhatsApp policy. No secrets. */

export const CHANNEL_PROVIDERS = ["telegram", "whatsapp"] as const;
export type ChannelProvider = (typeof CHANNEL_PROVIDERS)[number];

export const CHANNEL_DIRECTIONS = ["in", "out"] as const;
export type ChannelDirection = (typeof CHANNEL_DIRECTIONS)[number];

export const CHANNEL_MESSAGE_STATUSES = ["queued", "sent", "delivered", "failed"] as const;
export type ChannelMessageStatus = (typeof CHANNEL_MESSAGE_STATUSES)[number];

export const CHANNELS_QUERY_KEY = ["channels"] as const;

export const CHANNEL_LABELS: Record<ChannelProvider, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

export function telegramApiUrl(token: string, method: string): string {
  const safeToken = String(token ?? "").trim();
  const safeMethod = String(method ?? "").trim();
  if (!safeToken || !/^[A-Za-z0-9:_-]{20,}$/.test(safeToken)) throw new Error("VALIDATION");
  if (!/^[a-zA-Z][a-zA-Z0-9]+$/.test(safeMethod)) throw new Error("VALIDATION");
  return `https://api.telegram.org/bot${safeToken}/${safeMethod}`;
}

export function whatsappMessagesUrl(phoneNumberId: string, version = "v21.0"): string {
  const id = String(phoneNumberId ?? "").trim();
  const ver = String(version ?? "").trim();
  if (!/^[0-9]{6,20}$/.test(id)) throw new Error("VALIDATION");
  if (!/^v\d+\.\d+$/.test(ver)) throw new Error("VALIDATION");
  return `https://graph.facebook.com/${ver}/${id}/messages`;
}

export function whatsappSubscribedAppsUrl(phoneNumberId: string, version = "v21.0"): string {
  const id = String(phoneNumberId ?? "").trim();
  const ver = String(version ?? "").trim();
  if (!/^[0-9]{6,20}$/.test(id)) throw new Error("VALIDATION");
  if (!/^v\d+\.\d+$/.test(ver)) throw new Error("VALIDATION");
  return `https://graph.facebook.com/${ver}/${id}/subscribed_apps`;
}

export function parseE164(value: unknown): string | null {
  const raw = String(value ?? "").trim().replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{6,14}$/.test(raw)) return null;
  return raw;
}

export function parseTelegramChatId(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^-?\d{5,20}$/.test(raw)) return raw;
  if (/^@[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(raw)) return raw;
  return null;
}

export type ChannelThread = {
  id: string;
  clientId: string | null;
  provider: ChannelProvider;
  externalId: string;
  contactName: string;
  contactHandle: string | null;
  lastMessageAt: string | null;
  lastPreview: string | null;
  createdAt: string;
};

export type ChannelMessage = {
  id: string;
  threadId: string;
  direction: ChannelDirection;
  body: string;
  status: ChannelMessageStatus;
  externalId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type ChannelsSnapshot = {
  threads: ChannelThread[];
  clients: Array<{ id: string; name: string }>;
  telegramConfigured: boolean;
  whatsappConfigured: boolean;
};