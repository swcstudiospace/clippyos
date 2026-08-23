/** Canonical entity enums and row shapes matching migrations/0002_agency.sql */

export const PLAN_TYPES = ["TEAM_ONLY", "PERSONAL_INVOLVED", "CUSTOM"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const CLIENT_STATUSES = ["ACTIVE", "CHURNED"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PAYMENT_TYPES = ["SETUP", "MONTHLY"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "OVERDUE"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const HUMAN_ROLES = [
  "CHANNEL_MANAGER",
  "SHORT_FORM_EDITOR",
  "LONG_FORM_EDITOR",
  "THUMBNAIL_DESIGNER",
] as const;
export type HumanRole = (typeof HUMAN_ROLES)[number];

export const TEAM_ROLES = [
  "CHANNEL_MANAGER",
  "SHORT_FORM_EDITOR",
  "LONG_FORM_EDITOR",
  "THUMBNAIL_DESIGNER",
  "AUTOMATION",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const AUTOMATION_KINDS = ["GROK_BOT", "HERMES_WORKER", "OTHER"] as const;
export type AutomationKind = (typeof AUTOMATION_KINDS)[number];

export const BOT_ROLE_KEYS = [
  "CLIPPY_OPS",
  "PUBLISH_DESK",
  "CLIENT_SUCCESS",
  "ENG_BOT",
  "LEARNING_BOT",
  "REVENUE_OPS",
  "CUSTOM",
] as const;
export type BotRoleKey = (typeof BOT_ROLE_KEYS)[number];

export const AUTOMATION_RUNTIME_HINTS = ["HERMES", "GROK_BOT", "AUTO"] as const;
export type AutomationRuntimeHint = (typeof AUTOMATION_RUNTIME_HINTS)[number];

export const PROGRESS_STAGES = [
  "WAITING_FOR_FOOTAGE",
  "FILMING",
  "EDITING_SHORT_FORM",
  "EDITING_LONG_FORM",
  "DESIGNING_THUMBNAIL",
  "IN_REVIEW",
  "UPLOADING",
  "PUBLISHED",
] as const;
export type ProgressStage = (typeof PROGRESS_STAGES)[number];

export const PROGRESS_SOURCES = ["MANUAL", "AI_DISCORD", "AGENT"] as const;
export type ProgressSource = (typeof PROGRESS_SOURCES)[number];

export const THREAD_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export const MESSAGE_ROLES = ["user", "assistant"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const KNOWLEDGE_SCOPES = [
  "THUMBNAIL_GLOBAL",
  "VIDEO_GLOBAL",
  "CLIENT_TITLES",
  "CLIENT_IDEAS",
  "CLIENT_CLIPPING",
] as const;
export type KnowledgeScope = (typeof KNOWLEDGE_SCOPES)[number];

export const KNOWLEDGE_STATUSES = ["ACTIVE", "DEPRECATED"] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

export const LEAD_STATUSES = [
  "TO_CONTACT",
  "CONTACTED",
  "IN_TALKS",
  "CLOSED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const APP_ROLES = ["admin", "member"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const SOCIAL_PLATFORMS = ["instagram", "x", "tiktok", "youtube"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_POST_STATUSES = [
  "queued",
  "running",
  "needs_attention",
  "succeeded",
  "failed",
] as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

export const SOCIAL_POST_SOURCES = ["DAYTONA", "GROK_BOT", "X", "TIKTOK", "INSTAGRAM", "YOUTUBE"] as const;
export type SocialPostSource = (typeof SOCIAL_POST_SOURCES)[number];

export type SocialPost = AuditFields & {
  clientId: string;
  platform: SocialPlatform;
  status: SocialPostStatus;
  contentRef: string | null;
  mediaUrl: string | null;
  caption: string | null;
  externalUrl: string | null;
  screenshotUrl: string | null;
  source: SocialPostSource;
  attentionReason: string | null;
  jobId: string | null;
  rail: "API" | "BROWSER";
  externalPostId: string | null;
  tiktokPostMode: "UPLOAD_TO_INBOX" | "DIRECT_POST" | null;
  igContainerId: string | null;
  uploadPercent: number | null;
  uploadPhase: "init" | "uploading" | "processing" | "publishing" | null;
  resumableSessionId: string | null;
};

export type AuditFields = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type SoftDelete = { deletedAt: string | null };

export type SuggestedTitleGroup = {
  originalVideoId: string;
  originalTitle: string;
  originalUrl: string;
  originalThumbnail: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  alternatives: [string, string, string];
};

export type SuggestedTitlesPayload = {
  generatedAt: string;
  longFormCount: number;
  groups: SuggestedTitleGroup[];
};

export type SuggestedIdea = {
  title: string;
  rationale: string;
};

export type SuggestedIdeasPayload = {
  generatedAt: string;
  ideas: SuggestedIdea[];
};

export type Client = AuditFields &
  SoftDelete & {
    name: string;
    channelUrl: string | null;
    channelThumbnail: string | null;
    channelSummary: string | null;
    offers: string | null;
    contentStrategy: string | null;
    planType: PlanType;
    customPlanLabel: string | null;
    setupFee: string;
    monthlyFee: string | null;
    startDate: string | null;
    status: ClientStatus;
    discordServerId: string | null;
    googleAccountEmail: string | null;
    notes: string | null;
    suggestedTitles: SuggestedTitlesPayload | null;
    suggestedIdeas: SuggestedIdeasPayload | null;
    suggestedTitlesAt: string | null;
    suggestedIdeasAt: string | null;
    onboardingChecklist: import("@/lib/billing").ClientOnboardingChecklist | null;
  };

export type Payment = AuditFields & {
  clientId: string;
  amount: string;
  type: PaymentType;
  dueDate: string;
  paidDate: string | null;
  status: PaymentStatus;
};

export type TeamMember = AuditFields &
  SoftDelete & {
    clientId: string | null;
    role: TeamRole;
    name: string;
    cost: string | null;
    isAutomation: boolean;
    automationKind: AutomationKind | null;
    botLabel: string | null;
    botRoleKey: BotRoleKey | null;
    mcpTokenId: string | null;
    mcpTokenLabel: string | null;
    runtimeHint: AutomationRuntimeHint | null;
    isActive: boolean;
    notes: string | null;
    assignedClientIds: string[];
  };

export type ClientProgress = AuditFields & {
  clientId: string;
  stage: ProgressStage;
  source: ProgressSource;
  notes: string | null;
};

export type AnalyticsSnapshot = AuditFields & {
  clientId: string;
  date: string;
  views: string | null;
  subscribers: string | null;
  watchHours: string | null;
  impressionsCtr: string | null;
  topVideos: string | null;
};

export type IdeationThread = AuditFields & {
  title: string;
  clientId: string | null;
  status: ThreadStatus;
};

export type IdeationMessage = AuditFields & {
  threadId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata: { toolsUsed?: string[] } | null;
};

export type ThumbnailSession = AuditFields & {
  clientId: string;
  title: string;
  status: ThreadStatus;
};

export type ThumbnailMessageMeta = {
  kind?: "turn" | "variation" | "overlay" | "regenerate";
  parentId?: string;
  imagePrompt?: string;
  imageFailed?: boolean;
  overlayText?: string;
};

export type ThumbnailMessage = AuditFields & {
  sessionId: string;
  role: MessageRole;
  content: string;
  imageUrl: string | null;
  rating: number | null;
  timestamp: string;
  metadata: ThumbnailMessageMeta | null;
};

export type KnowledgeEntry = AuditFields &
  SoftDelete & {
    scope: KnowledgeScope;
    clientId: string | null;
    userInput: string;
    learnedPrinciple: string;
    status: KnowledgeStatus;
    tags: unknown;
    timestamp: string | null;
  };

export type Lead = AuditFields &
  SoftDelete & {
    name: string;
    channelUrl: string | null;
    notes: string | null;
    status: LeadStatus;
    upfrontCash: string | null;
    monthlyRecurring: string | null;
  };

export type AppSetting = AuditFields & {
  key: string;
  value: string | null;
};

export type AppProfile = {
  userId: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};
