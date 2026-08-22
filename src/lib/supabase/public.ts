/** Public Supabase project config. Safe to ship to the browser. */

export const SUPABASE_URL = "https://xpfoidcvbwmpbwodjvqb.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_TygDEM3S66tJtHLKaTqcCg_uSEvRvyu";
export const SUPABASE_JWKS_URL =
  "https://xpfoidcvbwmpbwodjvqb.supabase.co/auth/v1/.well-known/jwks.json";

export const SUPABASE_PROJECT_REF = "xpfoidcvbwmpbwodjvqb";

export const AGENCY_TABLES = [
  "clients",
  "payments",
  "team_members",
  "client_progress",
  "analytics_snapshots",
  "ideation_threads",
  "ideation_messages",
  "thumbnail_sessions",
  "thumbnail_messages",
  "knowledge_entries",
  "leads",
  "app_settings",
  "app_profiles",
  "api_keys",
  "agent_audit_log",
  "webhook_deliveries",
  "agent_jobs",
  "agent_idempotency",
  "social_posts",
  "skills",
  "skill_runs",
  "workspace_subscriptions",
  "billing_invoices",
  "approval_requests",
  "notifications",
  "audit_events",
  "notification_preferences",
  "client_portal_users",
  "client_portal_sessions",
  "post_performance",
  "asset_performance_rollups",
  "knowledge_proposals",
  "performance_fetch_queue",
] as const;

export type AgencyTable = (typeof AGENCY_TABLES)[number];
