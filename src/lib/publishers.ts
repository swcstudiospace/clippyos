import type { SocialPlatform } from "@/lib/entities";

export const SOCIAL_RAILS = ["API", "BROWSER"] as const;
export type SocialRail = (typeof SOCIAL_RAILS)[number];

export const SOCIAL_PREFERRED_RAILS = ["AUTO", "API", "BROWSER", "GROK_BOT"] as const;
export type SocialPreferredRail = (typeof SOCIAL_PREFERRED_RAILS)[number];

export const SOCIAL_PROVIDERS = ["X", "TIKTOK", "INSTAGRAM", "YOUTUBE", "DAYTONA"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const TIKTOK_POST_MODES = ["UPLOAD_TO_INBOX", "DIRECT_POST"] as const;
export type TikTokPostMode = (typeof TIKTOK_POST_MODES)[number];

export const TIKTOK_AUDIT_STATUSES = ["UNAUDITED", "AUDITED", "UNKNOWN"] as const;
export type TikTokAuditStatus = (typeof TIKTOK_AUDIT_STATUSES)[number];

export const IG_ACCOUNT_TYPES = ["BUSINESS", "CREATOR", "UNKNOWN"] as const;
export type IgAccountType = (typeof IG_ACCOUNT_TYPES)[number];

export const PUBLISHERS_QUERY_KEY = ["social-publishers"] as const;

export type TikTokPublisherDetails = {
  postModeDefault: TikTokPostMode;
  auditStatus: TikTokAuditStatus;
  eligibleDirectPost: boolean;
  eligibleInbox: boolean;
  openId: string | null;
  displayName: string | null;
  verifiedDomain: string | null;
};

export type InstagramPublisherDetails = {
  igUserId: string | null;
  username: string | null;
  accountType: IgAccountType;
  pageId: string | null;
  eligibleReelsPublish: boolean;
};

export type YoutubePublisherDetails = {
  channelId: string | null;
  channelTitle: string | null;
  categoryId: string | null;
  privacyDefault: "private" | "unlisted" | "public";
  eligible: boolean;
};

export type PublisherStatus = {
  platform: SocialPlatform;
  provider: Exclude<SocialProvider, "DAYTONA">;
  appConfigured: boolean;
  connected: boolean;
  eligible: boolean;
  handle: string | null;
  accountId: string | null;
  last4: string | null;
  reason: string | null;
  note: string;
  scopes: string[];
  tokenExpired: boolean;
  tiktok: TikTokPublisherDetails | null;
  instagram: InstagramPublisherDetails | null;
  youtube: YoutubePublisherDetails | null;
};

export type InstagramAccountOption = {
  pageId: string;
  pageName: string;
  igUserId: string;
  username: string;
  accountType: IgAccountType;
};

export type PublisherSnapshot = {
  publishers: Record<SocialPlatform, PublisherStatus>;
  instagramAccounts: InstagramAccountOption[];
  tiktokPublishMode: "inbox" | "direct";
  tiktok: TikTokPublisherDetails;
  instagram: InstagramPublisherDetails;
  youtube: YoutubePublisherDetails;
  callbackUrl: string;
  role: "admin" | "member" | null;
  canEditIntegrations: boolean;
};

export function parsePreferredRail(raw: unknown): SocialPreferredRail {
  return raw === "API" || raw === "BROWSER" || raw === "GROK_BOT" ? raw : "AUTO";
}

export const RAIL_LABELS: Record<SocialPreferredRail | SocialRail, string> = {
  AUTO: "Auto",
  API: "API",
  BROWSER: "Computer Use",
  GROK_BOT: "Grok Bot",
};


export const PROVIDER_LABELS: Record<SocialProvider, string> = {
  X: "X",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  DAYTONA: "Computer Use",
};

export const TIKTOK_MODE_LABELS: Record<TikTokPostMode, string> = {
  UPLOAD_TO_INBOX: "Draft inbox",
  DIRECT_POST: "Direct Post",
};

export function providerForPlatform(platform: SocialPlatform): Exclude<SocialProvider, "DAYTONA"> {
  if (platform === "x") return "X";
  if (platform === "tiktok") return "TIKTOK";
  if (platform === "youtube") return "YOUTUBE";
  return "INSTAGRAM";
}

export function mapIgAccountType(raw: string | null | undefined): IgAccountType {
  const value = (raw ?? "").toUpperCase();
  if (value === "BUSINESS") return "BUSINESS";
  if (value === "CREATOR" || value === "MEDIA_CREATOR") return "CREATOR";
  return "UNKNOWN";
}

export function emptyTikTokDetails(): TikTokPublisherDetails {
  return {
    postModeDefault: "UPLOAD_TO_INBOX",
    auditStatus: "UNAUDITED",
    eligibleDirectPost: false,
    eligibleInbox: false,
    openId: null,
    displayName: null,
    verifiedDomain: null,
  };
}

export function emptyInstagramDetails(): InstagramPublisherDetails {
  return {
    igUserId: null,
    username: null,
    accountType: "UNKNOWN",
    pageId: null,
    eligibleReelsPublish: false,
  };
}

export function emptyYoutubeDetails(): YoutubePublisherDetails {
  return {
    channelId: null,
    channelTitle: null,
    categoryId: "22",
    privacyDefault: "unlisted",
    eligible: false,
  };
}

export function emptyPublisherStatus(platform: SocialPlatform): PublisherStatus {
  const provider = providerForPlatform(platform);
  return {
    platform,
    provider,
    appConfigured: false,
    connected: false,
    eligible: false,
    handle: null,
    accountId: null,
    last4: null,
    reason: "Not connected.",
    note:
      platform === "instagram"
        ? "API publish requires an Instagram Professional account. Personal accounts stay on Computer Use."
        : platform === "tiktok"
          ? "Public Direct Post may require TikTok app audit. Until then, inbox drafts or the browser rail work."
          : platform === "youtube"
            ? "YouTube Data API upload needs an OAuth user token with youtube.upload. Drafts land private. Google may require app verification outside test users."
            : "X posting needs a user-context OAuth token with media + tweet.write. There is no draft API.",
    scopes: [],
    tokenExpired: false,
    tiktok: platform === "tiktok" ? emptyTikTokDetails() : null,
    instagram: platform === "instagram" ? emptyInstagramDetails() : null,
    youtube: platform === "youtube" ? emptyYoutubeDetails() : null,
  };
}

export function emptyPublisherMap(): Record<SocialPlatform, PublisherStatus> {
  return {
    instagram: emptyPublisherStatus("instagram"),
    x: emptyPublisherStatus("x"),
    tiktok: emptyPublisherStatus("tiktok"),
    youtube: emptyPublisherStatus("youtube"),
  };
}
