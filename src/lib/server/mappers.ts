import { parseClientChecklist } from "@/lib/billing";
import {
  CLIENT_STATUSES,
  KNOWLEDGE_SCOPES,
  KNOWLEDGE_STATUSES,
  LEAD_STATUSES,
  MESSAGE_ROLES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  PLAN_TYPES,
  PROGRESS_SOURCES,
  PROGRESS_STAGES,
  SOCIAL_PLATFORMS,
  SOCIAL_POST_SOURCES,
  SOCIAL_POST_STATUSES,
  TEAM_ROLES,
  THREAD_STATUSES,
  type Client,
  type ClientProgress,
  type ClientStatus,
  type KnowledgeEntry,
  type KnowledgeScope,
  type KnowledgeStatus,
  type Lead,
  type LeadStatus,
  type MessageRole,
  type Payment,
  type PaymentStatus,
  type PaymentType,
  type PlanType,
  type ProgressSource,
  type ProgressStage,
  type SocialPlatform,
  type SocialPost,
  type SocialPostSource,
  type SocialPostStatus,
  type TeamMember,
  type TeamRole,
  type ThreadStatus,
  type AnalyticsSnapshot,
  type IdeationMessage,
  type IdeationThread,
  type ThumbnailMessage,
  type ThumbnailMessageMeta,
  type ThumbnailSession,
} from "@/lib/entities";
import { parseSuggestedIdeas, parseSuggestedTitles } from "@/lib/client-tools";

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function asNullable(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

function parseJson(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseOnboarding(value: unknown) {
  if (value == null || value === "") return parseClientChecklist(null);
  if (typeof value === "string") {
    try {
      return parseClientChecklist(JSON.parse(value));
    } catch {
      return parseClientChecklist(null);
    }
  }
  return parseClientChecklist(value);
}

export function mapClient(row: Record<string, unknown>): Client {
  return {
    id: asString(row.id),
    name: asString(row.name),
    channelUrl: asNullable(row.channel_url),
    channelThumbnail: asNullable(row.channel_thumbnail),
    channelSummary: asNullable(row.channel_summary),
    offers: asNullable(row.offers),
    contentStrategy: asNullable(row.content_strategy),
    planType: oneOf<PlanType>(row.plan_type, PLAN_TYPES, "TEAM_ONLY"),
    customPlanLabel: asNullable(row.custom_plan_label),
    setupFee: asString(row.setup_fee, "30000"),
    monthlyFee: asNullable(row.monthly_fee),
    startDate: asNullable(row.start_date),
    status: oneOf<ClientStatus>(row.status, CLIENT_STATUSES, "ACTIVE"),
    discordServerId: asNullable(row.discord_server_id),
    googleAccountEmail: asNullable(row.google_account_email),
    notes: asNullable(row.notes),
    suggestedTitles: parseSuggestedTitles(row.suggested_titles),
    suggestedIdeas: parseSuggestedIdeas(row.suggested_ideas),
    suggestedTitlesAt: asNullable(row.suggested_titles_at),
    suggestedIdeasAt: asNullable(row.suggested_ideas_at),
    onboardingChecklist: parseOnboarding(row.onboarding_checklist),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
    deletedAt: asNullable(row.deleted_at),
  };
}

export function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    amount: asString(row.amount, "0"),
    type: oneOf<PaymentType>(row.type, PAYMENT_TYPES, "MONTHLY"),
    dueDate: asString(row.due_date),
    paidDate: asNullable(row.paid_date),
    status: oneOf<PaymentStatus>(row.status, PAYMENT_STATUSES, "PENDING"),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    role: oneOf<TeamRole>(row.role, TEAM_ROLES, "CHANNEL_MANAGER"),
    name: asString(row.name),
    cost: asNullable(row.cost),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
    deletedAt: asNullable(row.deleted_at),
  };
}

export function mapProgress(row: Record<string, unknown>): ClientProgress {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    stage: oneOf<ProgressStage>(row.stage, PROGRESS_STAGES, "WAITING_FOR_FOOTAGE"),
    source: oneOf<ProgressSource>(row.source, PROGRESS_SOURCES, "MANUAL"),
    notes: asNullable(row.notes),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapSnapshot(row: Record<string, unknown>): AnalyticsSnapshot {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    date: asString(row.date),
    views: asNullable(row.views),
    subscribers: asNullable(row.subscribers),
    watchHours: asNullable(row.watch_hours),
    impressionsCtr: asNullable(row.impressions_ctr),
    topVideos:
      typeof row.top_videos === "string"
        ? row.top_videos
        : row.top_videos == null
          ? null
          : JSON.stringify(row.top_videos),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapIdeationThread(row: Record<string, unknown>): IdeationThread {
  return {
    id: asString(row.id),
    title: asString(row.title, "New thread"),
    clientId: asNullable(row.client_id),
    status: oneOf<ThreadStatus>(row.status, THREAD_STATUSES, "ACTIVE"),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapIdeationMessage(row: Record<string, unknown>): IdeationMessage {
  const parsed = parseJson(row.metadata);
  let metadata: { toolsUsed?: string[] } | null = null;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const tools = (parsed as { toolsUsed?: unknown }).toolsUsed;
    if (Array.isArray(tools)) {
      metadata = {
        toolsUsed: tools.filter((item): item is string => typeof item === "string"),
      };
    } else {
      metadata = {};
    }
  }
  return {
    id: asString(row.id),
    threadId: asString(row.thread_id),
    role: oneOf<MessageRole>(row.role, MESSAGE_ROLES, "user"),
    content: asString(row.content),
    timestamp: asString(row.timestamp ?? row.created_at),
    metadata,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

function mapThumbnailMeta(value: unknown): ThumbnailMessageMeta | null {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const kind = record.kind;
  const meta: ThumbnailMessageMeta = {};
  if (kind === "turn" || kind === "variation" || kind === "overlay" || kind === "regenerate") {
    meta.kind = kind;
  }
  if (typeof record.parentId === "string" && record.parentId) meta.parentId = record.parentId;
  if (typeof record.imagePrompt === "string" && record.imagePrompt) {
    meta.imagePrompt = record.imagePrompt.slice(0, 4000);
  }
  if (record.imageFailed === true) meta.imageFailed = true;
  if (typeof record.overlayText === "string" && record.overlayText) {
    meta.overlayText = record.overlayText.slice(0, 120);
  }
  return Object.keys(meta).length ? meta : null;
}

export function mapThumbnailSession(row: Record<string, unknown>): ThumbnailSession {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    title: asString(row.title, "New thumbnail"),
    status: oneOf<ThreadStatus>(row.status, THREAD_STATUSES, "ACTIVE"),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapThumbnailMessage(row: Record<string, unknown>): ThumbnailMessage {
  return {
    id: asString(row.id),
    sessionId: asString(row.session_id),
    role: oneOf<MessageRole>(row.role, MESSAGE_ROLES, "user"),
    content: asString(row.content),
    imageUrl: asNullable(row.image_url),
    rating: asRating(row.rating),
    timestamp: asString(row.timestamp ?? row.created_at),
    metadata: mapThumbnailMeta(row.metadata),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function mapKnowledgeEntry(row: Record<string, unknown>): KnowledgeEntry {
  return {
    id: asString(row.id),
    scope: oneOf<KnowledgeScope>(row.scope, KNOWLEDGE_SCOPES, "VIDEO_GLOBAL"),
    clientId: asNullable(row.client_id),
    userInput: asString(row.user_input),
    learnedPrinciple: asString(row.learned_principle),
    status: oneOf<KnowledgeStatus>(row.status, KNOWLEDGE_STATUSES, "ACTIVE"),
    tags: (row.tags as KnowledgeEntry["tags"]) ?? null,
    timestamp: asNullable(row.timestamp),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
    deletedAt: asNullable(row.deleted_at),
  };
}

export function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: asString(row.id),
    name: asString(row.name),
    channelUrl: asNullable(row.channel_url),
    notes: asNullable(row.notes),
    status: oneOf<LeadStatus>(row.status, LEAD_STATUSES, "TO_CONTACT"),
    upfrontCash: asNullable(row.upfront_cash),
    monthlyRecurring: asNullable(row.monthly_recurring),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
    deletedAt: asNullable(row.deleted_at),
  };
}

export function mapSocialPost(row: Record<string, unknown>): SocialPost {
  return {
    id: asString(row.id),
    clientId: asString(row.client_id),
    platform: oneOf<SocialPlatform>(row.platform, SOCIAL_PLATFORMS, "instagram"),
    status: oneOf<SocialPostStatus>(row.status, SOCIAL_POST_STATUSES, "queued"),
    contentRef: asNullable(row.content_ref),
    mediaUrl: asNullable(row.media_url),
    caption: asNullable(row.caption),
    externalUrl: asNullable(row.external_url),
    screenshotUrl: asNullable(row.screenshot_url),
    source: oneOf<SocialPostSource>(row.source, SOCIAL_POST_SOURCES, "DAYTONA"),
    attentionReason: asNullable(row.attention_reason),
    jobId: asNullable(row.job_id),
    rail: row.rail === "API" ? "API" : "BROWSER",
    externalPostId: asNullable(row.external_post_id),
    tiktokPostMode:
      row.tiktok_post_mode === "DIRECT_POST" || row.tiktok_post_mode === "UPLOAD_TO_INBOX"
        ? row.tiktok_post_mode
        : null,
    igContainerId: asNullable(row.ig_container_id),
    uploadPercent:
      row.upload_percent == null || row.upload_percent === ""
        ? null
        : Number(row.upload_percent),
    uploadPhase:
      row.upload_phase === "init" ||
      row.upload_phase === "uploading" ||
      row.upload_phase === "processing" ||
      row.upload_phase === "publishing"
        ? row.upload_phase
        : null,
    resumableSessionId: asNullable(row.resumable_session_id),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    createdBy: asNullable(row.created_by),
  };
}

export function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /column .* does not exist/i.test(message) ||
    /could not find the ['`].*['`] column/i.test(message)
  );
}

export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (isMissingColumn(error)) return false;
  return (
    error.code === "PGRST205" ||
    /could not find the table/i.test(error.message ?? "") ||
    /relation .* does not exist/i.test(error.message ?? "")
  );
}
