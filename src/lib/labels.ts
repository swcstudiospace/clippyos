import type {
  ClientStatus,
  LeadStatus,
  PaymentStatus,
  PaymentType,
  PlanType,
  ProgressSource,
  ProgressStage,
  TeamRole,
} from "@/lib/entities";
import type { BadgeProps } from "@/components/ui/badge";

export const PLAN_LABELS: Record<PlanType, string> = {
  TEAM_ONLY: "Team only",
  PERSONAL_INVOLVED: "Personal involved",
  CUSTOM: "Custom",
};

export const DEFAULT_SETUP_FEE = 30000;

export const DEFAULT_MONTHLY_FEE: Record<PlanType, number> = {
  TEAM_ONLY: 3000,
  PERSONAL_INVOLVED: 5000,
  CUSTOM: 0,
};

export const STAGE_LABELS: Record<ProgressStage, string> = {
  WAITING_FOR_FOOTAGE: "Waiting for footage",
  FILMING: "Filming",
  EDITING_SHORT_FORM: "Editing short-form",
  EDITING_LONG_FORM: "Editing long-form",
  DESIGNING_THUMBNAIL: "Designing thumbnail",
  IN_REVIEW: "In review",
  UPLOADING: "Uploading",
  PUBLISHED: "Published",
};

export const STAGE_TONES: Record<ProgressStage, NonNullable<BadgeProps["tone"]>> = {
  WAITING_FOR_FOOTAGE: "neutral",
  FILMING: "orange",
  EDITING_SHORT_FORM: "teal",
  EDITING_LONG_FORM: "blue",
  DESIGNING_THUMBNAIL: "purple",
  IN_REVIEW: "orange",
  UPLOADING: "teal",
  PUBLISHED: "green",
};

export const SOURCE_LABELS: Record<ProgressSource, string> = {
  MANUAL: "Manual",
  AI_DISCORD: "Discord",
  AGENT: "Agent",
};

export const SOURCE_TONES: Record<ProgressSource, NonNullable<BadgeProps["tone"]>> = {
  MANUAL: "neutral",
  AI_DISCORD: "purple",
  AGENT: "teal",
};

export const PLAN_TONES: Record<PlanType, NonNullable<BadgeProps["tone"]>> = {
  TEAM_ONLY: "blue",
  PERSONAL_INVOLVED: "purple",
  CUSTOM: "teal",
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  CHURNED: "Churned",
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  CHANNEL_MANAGER: "Channel manager",
  SHORT_FORM_EDITOR: "Short-form editor",
  LONG_FORM_EDITOR: "Long-form editor",
  THUMBNAIL_DESIGNER: "Thumbnail designer",
  AUTOMATION: "Automation",
};

export const ROLE_TONES: Record<TeamRole, NonNullable<BadgeProps["tone"]>> = {
  CHANNEL_MANAGER: "blue",
  SHORT_FORM_EDITOR: "teal",
  LONG_FORM_EDITOR: "purple",
  THUMBNAIL_DESIGNER: "orange",
  AUTOMATION: "teal",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  SETUP: "Setup",
  MONTHLY: "Monthly",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  TO_CONTACT: "To contact",
  CONTACTED: "Contacted",
  IN_TALKS: "In talks",
  CLOSED: "Closed",
  LOST: "Lost",
};
