/** Official Hermes Playbook. Playbooks run inside Hermes; this catalog is the operating manual. */

import type { ApiKeyScope } from "@/lib/autonomy";

export const PLAYBOOK_RISKS = ["low", "medium", "high"] as const;
export type PlaybookRisk = (typeof PLAYBOOK_RISKS)[number];

export const PLAYBOOK_TRIGGERS = ["schedule", "event", "manual"] as const;
export type PlaybookTrigger = (typeof PLAYBOOK_TRIGGERS)[number];

export type PlaybookPolicies = {
  autoMarkPayments: boolean;
  autoAdvanceStageWithoutEvidence: boolean;
  autoCreateClientFromClosedLead: boolean;
  analyticsPullConcurrency: "low" | "medium";
  socialAutoStartForUpload: boolean;
  socialDefaultUploadMode: "draft" | "publish";
  socialMaxAutoRetries: 1 | 2;
  socialMaxBulkJobsPerRun: number;
  socialIdleStopMinutes: number;
  socialRequireLoggedInPlatformsOnly: boolean;
  skillsAutoPublishAgent: boolean;
  skillsMinToolCallsToDistill: number;
  skillsAllowNetwork: boolean;
  skillsProposeOnAgentSuccess: boolean;
};

export const DEFAULT_PLAYBOOK_POLICIES: PlaybookPolicies = {
  autoMarkPayments: false,
  autoAdvanceStageWithoutEvidence: false,
  autoCreateClientFromClosedLead: false,
  analyticsPullConcurrency: "low",
  socialAutoStartForUpload: false,
  socialDefaultUploadMode: "draft",
  socialMaxAutoRetries: 1,
  socialMaxBulkJobsPerRun: 5,
  socialIdleStopMinutes: 20,
  socialRequireLoggedInPlatformsOnly: true,
  skillsAutoPublishAgent: false,
  skillsMinToolCallsToDistill: 5,
  skillsAllowNetwork: false,
  skillsProposeOnAgentSuccess: true,
};

export const HUMAN_APPROVAL_REQUIRED_FOR = [
  "fee changes",
  "client churn (CHURNED)",
  "hard deletes",
  "integration disconnects",
  "bulk mark-paid",
  "large backward stage jumps without evidence",
  "actions while critical integrations are down",
  "Daytona key rotation / Disconnect",
  "permanent sandbox delete",
  "export of raw browser session material",
  "storing social passwords",
] as const;

export type HermesPlaybook = {
  id: string;
  name: string;
  summary: string;
  trigger: PlaybookTrigger;
  triggerDetail: string;
  requiredScopes: ApiKeyScope[];
  requiredIntegrations: string[];
  risk: PlaybookRisk;
  steps: string[];
  tools: string[];
  success: string;
  escalation: string;
  guardrail: string;
  humanStop: string;
  auditEvents: string[];
};

export const HERMES_PLAYBOOKS: readonly HermesPlaybook[] = [
  {
    id: "daily_ops_brief",
    name: "Daily ops brief",
    summary: "Morning snapshot of MRR, outstanding cash, at-risk clients, stalled stages, and integration health.",
    trigger: "schedule",
    triggerDetail: "Scheduled each morning",
    requiredScopes: ["read"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call get_dashboard_snapshot",
      "Call list_at_risk_clients",
      "Call list_payments and keep OVERDUE plus PENDING due soon",
      "Call get_integration_status",
      "Summarize MRR, outstanding $, clients day ≥25, stalled stages, and integration health for the operator",
    ],
    tools: ["get_dashboard_snapshot", "list_at_risk_clients", "list_payments", "get_integration_status"],
    success: "Operator receives a clear daily brief. No mutations.",
    escalation: "Critical integration down, or many clients past day 30.",
    guardrail: "Read-only. Never invent views-increase or analytics.",
    humanStop: "If AI or YouTube is down, still send the brief with honest gaps.",
    auditEvents: ["get_dashboard_snapshot", "list_at_risk_clients", "list_payments", "get_integration_status"],
  },
  {
    id: "collections_sweep",
    name: "Collections sweep",
    summary: "Queue PENDING/OVERDUE invoices. Mark paid only after confirmed collection or when auto_mark_payments is on.",
    trigger: "schedule",
    triggerDetail: "Daily, near payment cadence",
    requiredScopes: ["read", "write:payments"],
    requiredIntegrations: [],
    risk: "medium",
    steps: [
      "Call list_payments for PENDING and OVERDUE with dueDate ≤ today",
      "Report the queue to the operator / reminder channel",
      "Call mark_payment_paid only when collection is confirmed, or when policy auto_mark_payments=true",
    ],
    tools: ["list_payments", "mark_payment_paid", "get_client"],
    success: "Overdue queue is visible; paid rows match real collections.",
    escalation: "Large overdue total, or repeated failed mark-paid.",
    guardrail: "Default is report + queue. Auto mark-paid only if auto_mark_payments is true.",
    humanStop: "Do not bulk mark-paid. Never mark a payment that is already PAID.",
    auditEvents: ["list_payments", "mark_payment_paid"],
  },
  {
    id: "thirty_day_guarantee_monitor",
    name: "30-day guarantee monitor",
    summary: "Track the views guarantee. Flag approaching / at-risk clients using real AnalyticsSnapshots only.",
    trigger: "schedule",
    triggerDetail: "Daily",
    requiredScopes: ["read"],
    requiredIntegrations: ["YouTube Data API (optional pull)"],
    risk: "high",
    steps: [
      "Call list_at_risk_clients and get_dashboard_snapshot",
      "For clients on day 20–30, pull_client_analytics if snapshots are stale",
      "Evaluate views-delta only when ≥2 real AnalyticsSnapshots exist",
      "If views are flat/↓ and day ≥25 → flag Approaching / At risk",
      "If day ≥30 and no verified views increase → escalate refund risk",
    ],
    tools: ["list_at_risk_clients", "pull_client_analytics", "get_analytics_snapshot", "get_client"],
    success: "Every day-25+ client has an honest views signal (up, flat, or insufficient data).",
    escalation: "Any client past day 30 without a verified views increase.",
    guardrail: "Never invent a views increase. Say “Insufficient data” when snapshots are missing.",
    humanStop: "Skip the YouTube pull when the key is missing; still report snapshot gaps.",
    auditEvents: ["list_at_risk_clients", "pull_client_analytics", "get_analytics_snapshot"],
  },
  {
    id: "pipeline_stall_detection",
    name: "Pipeline stall detection",
    summary: "Find ACTIVE clients whose production stage has not moved in 5–7 days and is not PUBLISHED.",
    trigger: "schedule",
    triggerDetail: "Every few hours or daily",
    requiredScopes: ["read", "write:progress"],
    requiredIntegrations: [],
    risk: "medium",
    steps: [
      "Call list_clients and get_client_progress for ACTIVE clients",
      "Detect progress.updatedAt older than 7 days and stage ≠ PUBLISHED",
      "Call set_client_stage only when evidence exists (recent AI_DISCORD write or explicit notes); otherwise notify a human",
    ],
    tools: ["list_clients", "get_client_progress", "set_client_stage"],
    success: "Stalled clients are listed; stages move only with evidence.",
    escalation: "Many stalled clients, or a backward stage jump requested without notes.",
    guardrail: "auto_advance_stage_without_evidence defaults to false.",
    humanStop: "Do not auto-advance without evidence. Large backward jumps need a human.",
    auditEvents: ["list_clients", "get_client_progress", "set_client_stage"],
  },
  {
    id: "discord_agent_followthrough",
    name: "Discord agent follow-through",
    summary: "React to AI_DISCORD stage writes. Optionally regenerate titles when work hits review/upload/published.",
    trigger: "event",
    triggerDetail: "Webhook progress.stage_changed (source=AI_DISCORD) or poll",
    requiredScopes: ["read", "actions:ai"],
    requiredIntegrations: ["Discord bot (independent, read-only)", "AI API"],
    risk: "low",
    steps: [
      "Read the new stage and notes from get_client_progress",
      "If IN_REVIEW / UPLOADING / PUBLISHED, optionally regenerate_suggested_titles or notify the channel manager",
      "Log the follow-through in Hermes memory and the Agency Admin audit trail",
    ],
    tools: ["get_client_progress", "regenerate_suggested_titles", "get_client"],
    success: "Discord-detected stage changes are acknowledged and optional titles jobs are accepted.",
    escalation: "AI unavailable, or Discord agent run_failed webhook.",
    guardrail: "Discord Status Agent stays read-only. Hermes never sends Discord messages.",
    humanStop: "Skip title regen when AI is down; still record the stage event.",
    auditEvents: ["progress.stage_changed", "regenerate_suggested_titles"],
  },
  {
    id: "lead_intake_and_hygiene",
    name: "Lead intake and hygiene",
    summary: "Move new leads through TO_CONTACT → CONTACTED → IN_TALKS. Convert CLOSED only when policy allows.",
    trigger: "event",
    triggerDetail: "lead.created webhook or poll",
    requiredScopes: ["read", "write:leads", "write:clients"],
    requiredIntegrations: ["YouTube (optional enrichment)"],
    risk: "medium",
    steps: [
      "create_lead / update_lead_status through TO_CONTACT → CONTACTED → IN_TALKS",
      "Enrich with channel analysis if YouTube is connected",
      "On CLOSED, optionally create_client from the lead if auto_create_client_from_closed_lead is true, then start onboarding",
    ],
    tools: ["list_leads", "create_lead", "update_lead_status", "create_client"],
    success: "Pipeline totals stay current; CLOSED conversions are intentional.",
    escalation: "Large upfrontCash, or a CLOSED lead that should not auto-create a client.",
    guardrail: "auto_create_client_from_closed_lead defaults to false. Large upfrontCash needs human approval.",
    humanStop: "Do not churn or hard-delete. Do not set fees from a lead conversion.",
    auditEvents: ["lead.created", "lead.status_changed", "client.created"],
  },
  {
    id: "client_onboarding_sequence",
    name: "Client onboarding sequence",
    summary: "New client gets a stage, startDate (30-day clock), analytics pull, and an initial ideas/titles package.",
    trigger: "event",
    triggerDetail: "client.created or closed-won lead conversion",
    requiredScopes: ["read", "write:progress", "write:clients", "actions:ai"],
    requiredIntegrations: ["AI API", "YouTube (optional)"],
    risk: "medium",
    steps: [
      "get_client",
      "pull_client_analytics if a channel URL is present",
      "set_client_stage = WAITING_FOR_FOOTAGE if empty",
      "regenerate_suggested_ideas and regenerate_suggested_titles for the initial package",
      "Ensure startDate is set (starts the 30-day clock)",
      "Write onboarding notes via update_client",
    ],
    tools: [
      "get_client",
      "pull_client_analytics",
      "set_client_stage",
      "regenerate_suggested_ideas",
      "regenerate_suggested_titles",
      "update_client",
    ],
    success: "Client has a stage, startDate, and initial ideas/titles package (or accepted job ids).",
    escalation: "AI or YouTube missing — skip those steps and report the gap.",
    guardrail: "Do not change monthly/setup fees. Notes and startDate only.",
    humanStop: "If startDate is already set, do not overwrite it.",
    auditEvents: ["client.created", "set_client_stage", "regenerate_suggested_ideas", "regenerate_suggested_titles"],
  },
  {
    id: "weekly_analytics_refresh",
    name: "Weekly analytics refresh",
    summary: "Pull public YouTube stats for every ACTIVE client at low concurrency.",
    trigger: "schedule",
    triggerDetail: "Weekly",
    requiredScopes: ["read"],
    requiredIntegrations: ["YouTube Data API"],
    risk: "low",
    steps: [
      "list_clients (ACTIVE)",
      "pull_client_analytics for each client, sequential or low concurrency to respect YouTube quota",
      "Summarize growth / decline from real snapshots",
    ],
    tools: ["list_clients", "pull_client_analytics", "get_analytics_snapshot"],
    success: "Fresh snapshots exist or honest skip reasons are reported.",
    escalation: "YouTube quota or key missing.",
    guardrail: "analytics_pull_concurrency stays low. Skip the whole run if YouTube is not connected.",
    humanStop: "Never fabricate AnalyticsSnapshot rows.",
    auditEvents: ["pull_client_analytics", "analytics.snapshot_created"],
  },
  {
    id: "content_ideation_cadence",
    name: "Content ideation cadence",
    summary: "Weekly (or when waiting for footage / filming) regenerate ideas and titles, then notify with top picks.",
    trigger: "schedule",
    triggerDetail: "Weekly, or when stage is WAITING_FOR_FOOTAGE / FILMING",
    requiredScopes: ["read", "actions:ai"],
    requiredIntegrations: ["AI API"],
    risk: "low",
    steps: [
      "regenerate_suggested_ideas",
      "regenerate_suggested_titles for the latest long-form videos when available",
      "Notify the operator of top picks (jobs return accepted/job id)",
    ],
    tools: ["regenerate_suggested_ideas", "regenerate_suggested_titles", "get_client"],
    success: "Accepted job ids recorded; operator sees new suggestions after jobs complete.",
    escalation: "AI unavailable.",
    guardrail: "Strict ≥4-minute long-form rule is enforced server-side. Do not retry in a tight loop.",
    humanStop: "Skip when AI is down. Do not inject client-specific training into global Ideation/Thumbnails tabs.",
    auditEvents: ["regenerate_suggested_ideas", "regenerate_suggested_titles"],
  },
  {
    id: "team_capacity_guard",
    name: "Team capacity guard",
    summary: "Flag anyone assigned to more than 3 clients. Suggest reassignment in notes — never auto-reassign.",
    trigger: "schedule",
    triggerDetail: "Daily",
    requiredScopes: ["read"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "get_dashboard_snapshot / list_clients with team data",
      "Flag people assigned to more than 3 clients",
      "Suggest reassignment in operator notes — do not auto-reassign humans",
    ],
    tools: ["get_dashboard_snapshot", "list_clients"],
    success: "Overloaded assignees are listed. No team-membership mutations.",
    escalation: "Anyone on 4+ clients.",
    guardrail: "Hermes does not write TeamMember rows.",
    humanStop: "Never reassign people automatically.",
    auditEvents: ["get_dashboard_snapshot"],
  },
  {
    id: "integration_health_watchdog",
    name: "Integration health watchdog",
    summary: "Watch AI / Discord / YouTube. Alert the operator and pause dependent playbooks when a critical integration is down.",
    trigger: "schedule",
    triggerDetail: "Every few hours",
    requiredScopes: ["read"],
    requiredIntegrations: [],
    risk: "high",
    steps: [
      "Call get_integration_status",
      "If AI / Discord / YouTube is down, alert the operator and pause dependent playbooks",
    ],
    tools: ["get_integration_status"],
    success: "Operator knows which integrations are connected vs not. No secret values.",
    escalation: "Any critical integration offline.",
    guardrail: "Never request or log raw keys. Status is connected vs not_configured only.",
    humanStop: "Do not attempt Disconnect or secret rotation. Those stay human-only.",
    auditEvents: ["get_integration_status"],
  },
  {
    id: "end_of_period_rollup",
    name: "End-of-period rollup",
    summary: "End of day / week operator summary: cash collected, stages moved, leads progressed.",
    trigger: "schedule",
    triggerDetail: "End of day / end of week",
    requiredScopes: ["read"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "get_dashboard_snapshot",
      "Review recent payments collected, stages moved, and leads progressed",
      "Produce an operator summary",
    ],
    tools: ["get_dashboard_snapshot", "list_payments", "list_leads", "list_clients"],
    success: "Operator receives a period summary derived from live records.",
    escalation: "None unless totals look inconsistent with Money/Dashboard (then flag, do not write rollups).",
    guardrail: "Do not store derived totals. Single source of truth remains Client / Payment / Lead / Progress.",
    humanStop: "Read-only.",
    auditEvents: ["get_dashboard_snapshot", "list_payments", "list_leads"],
  },
  {
    id: "social_machine_cost_guard",
    name: "Social Machine cost guard",
    summary: "Stop an idle Social Machine so Daytona spend does not run away.",
    trigger: "schedule",
    triggerDetail: "Every 15–30 minutes while automation is enabled",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "low",
    steps: [
      "Call social.get_machine_status",
      "Call social.get_cost_guard",
      "If running beyond the idle threshold and no active jobs, call social.stop_machine",
    ],
    tools: ["social.get_machine_status", "social.get_cost_guard", "social.stop_machine"],
    success: "Idle machines are stopped. Active upload jobs are never interrupted.",
    escalation: "Stop failures, or the machine is running with no recorded jobs.",
    guardrail: "Never start the machine from this playbook. Never auto-start on dashboard login.",
    humanStop: "If stop fails, escalate. Do not loop start/stop.",
    auditEvents: ["social.get_machine_status", "social.stop_machine", "social.machine_stopped"],
  },
  {
    id: "social_session_health_check",
    name: "Social session health check",
    summary: "Confirm Instagram, X, and TikTok sessions before a distribution window.",
    trigger: "schedule",
    triggerDetail: "Daily, or before distribution windows",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "low",
    steps: [
      "Call social.get_machine_status",
      "If stopped and auto_start_for_upload is false, report that a human must start the machine",
      "Otherwise start, then social.ensure_computer_use",
      "Call social.check_session_health for instagram, x, tiktok, and youtube",
      "Call social.mark_platform_session as needed",
      "Call social.take_screenshot for evidence",
      "Stop if idle-stop policy applies",
    ],
    tools: [
      "social.get_machine_status",
      "social.start_machine",
      "social.ensure_computer_use",
      "social.check_session_health",
      "social.mark_platform_session",
      "social.take_screenshot",
      "social.stop_machine",
    ],
    success: "Each platform is logged_in, needs_login, or unknown with a screenshot.",
    escalation: "Any needs_login. Do not attempt to type passwords.",
    guardrail: "Do not store social passwords. Prefer screenshots over VNC URLs.",
    humanStop: "Login walls, CAPTCHA, and 2FA are human-only.",
    auditEvents: ["social.check_session_health", "social.mark_platform_session", "social.take_screenshot"],
  },
  {
    id: "distribute_published_client_asset",
    name: "Distribute published client asset",
    summary: "When a client hits PUBLISHED, plan and queue a social upload job.",
    trigger: "event",
    triggerDetail: "Webhook progress.stage_changed to PUBLISHED, or manual/schedule",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "Call social.list_uploadable_assets for the client",
      "Call social.get_publisher_status — prefer API when eligible",
      "Call social.plan_distribution",
      "Call social.create_upload_job with preferredRail=AUTO (draft or publish per social.default_upload_mode)",
      "Poll social.get_upload_job (uploadPercent, uploadPhase, resumableSessionId — no tokens)",
      "On needs_attention, escalate to a human (login, CAPTCHA, or IG personal / TikTok unaudited)",
      "On success, record posts via social.list_posts (externalPostId / externalUrl)",
    ],
    tools: [
      "social.list_uploadable_assets",
      "social.get_publisher_status",
      "social.plan_distribution",
      "social.create_upload_job",
      "social.get_upload_job",
      "social.list_posts",
    ],
    success: "A job exists with per-platform results. Partial success is valid.",
    escalation: "MACHINE_STOPPED, needs_login, or repeated platform failures.",
    guardrail: "auto_start_for_upload defaults to false and is Daytona-only. Caption from client titles/ideas when present. Never invent assets. Never request OAuth tokens.",
    humanStop: "Do not start the VM unless the operator enabled auto_start_for_upload.",
    auditEvents: ["social.create_upload_job", "social.job_created", "social.job_needs_attention"],
  },
  {
    id: "daily_social_distribution_sweep",
    name: "Daily social distribution sweep",
    summary: "Find recent PUBLISHED assets not yet on social and queue a limited batch.",
    trigger: "schedule",
    triggerDetail: "Daily",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "List ACTIVE clients with recent PUBLISHED assets",
      "Call social.list_posts to skip assets already distributed",
      "For each eligible asset, social.plan_distribution",
      "social.bulk_create_upload_jobs with the configured batch limit",
      "Monitor jobs and produce a summary",
    ],
    tools: [
      "list_clients",
      "get_client_progress",
      "social.list_uploadable_assets",
      "social.list_posts",
      "social.plan_distribution",
      "social.bulk_create_upload_jobs",
      "social.list_upload_jobs",
    ],
    success: "A bounded batch of jobs is created from real assets only.",
    escalation: "Machine stopped, missing sessions, or bulk limit hit with remaining work.",
    guardrail: "Max clients/assets per run from social.max_bulk_jobs_per_run. Never invent assets.",
    humanStop: "Skip when Daytona is disconnected. Do not raise the batch limit yourself.",
    auditEvents: ["social.bulk_create_upload_jobs", "social.job_created"],
  },
  {
    id: "multi_platform_campaign_push",
    name: "Multi-platform campaign push",
    summary: "Push one asset to Instagram, X, and TikTok, retrying failed platforms once.",
    trigger: "manual",
    triggerDetail: "Hermes-initiated or operator request via chat",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "Resolve client + asset with social.resolve_asset",
      "social.create_upload_job for [instagram, x, tiktok]",
      "Handle partial success",
      "social.retry_upload_job for failed platforms once",
      "Escalate remainder",
    ],
    tools: [
      "social.resolve_asset",
      "social.create_upload_job",
      "social.get_upload_job",
      "social.retry_upload_job",
    ],
    success: "Each platform is succeeded, needs_attention, or explicitly escalated.",
    escalation: "needs_login, CAPTCHA, or a second failure after retry.",
    guardrail: "Max auto-retries is 1–2. No infinite loops. Partial success is valid.",
    humanStop: "Do not retry a needs_attention job blindly.",
    auditEvents: ["social.create_upload_job", "social.retry_upload_job"],
  },
  {
    id: "upload_failure_recovery",
    name: "Upload failure recovery",
    summary: "Diagnose a failed or needs_attention job and retry only when it is transient.",
    trigger: "event",
    triggerDetail: "Upload job failed or needs_attention",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "Call social.get_upload_job",
      "Call social.take_screenshot and social.get_platform_status",
      "If needs_login, escalate to a human",
      "If transient, social.retry_upload_job",
      "If UI change, leave needs_attention for Computer Use",
    ],
    tools: [
      "social.get_upload_job",
      "social.take_screenshot",
      "social.get_platform_status",
      "social.retry_upload_job",
    ],
    success: "Transient failures retried once; login walls and UI changes wait for a human.",
    escalation: "needs_login, CAPTCHA, 2FA, or UI change.",
    guardrail: "Max auto-retries 1–2. No infinite loops.",
    humanStop: "Never type passwords. Never loop on needs_attention.",
    auditEvents: ["social.retry_upload_job", "social.job_needs_attention"],
  },
  {
    id: "post_publish_social_notify",
    name: "Post-publish social notify",
    summary: "After a successful upload job, collect external URLs for the daily ops brief.",
    trigger: "event",
    triggerDetail: "Upload job succeeded",
    requiredScopes: ["read", "write:clients"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call social.list_posts for the job",
      "Optionally update_client notes with external URLs",
      "Include the links in daily_ops_brief",
    ],
    tools: ["social.list_posts", "social.get_post", "update_client", "get_dashboard_snapshot"],
    success: "Succeeded posts have URLs in notes or the brief. No fabricated links.",
    escalation: "Succeeded job with missing external URLs.",
    guardrail: "Do not change fees. Notes only.",
    humanStop: "Skip note writes if the operator already recorded the URLs.",
    auditEvents: ["social.list_posts", "update_client"],
  },
  {
    id: "pre_distribution_gate",
    name: "Pre-distribution gate",
    summary: "Abort browser-rail create_upload_job when Daytona or sessions are not ready; allow API-eligible platforms through.",
    trigger: "manual",
    triggerDetail: "Before any create_upload_job in other playbooks",
    requiredScopes: ["read"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call social.get_publisher_status",
      "Call get_integration_status (Daytona) only if any selected platform is not API-eligible",
      "Call social.get_machine_status when a browser rail is required",
      "Call social.list_platforms for session health on browser platforms",
      "Abort with a clear reason if no rail is available",
    ],
    tools: [
      "social.get_publisher_status",
      "get_integration_status",
      "social.get_machine_status",
      "social.list_platforms",
    ],
    success: "Downstream playbooks upload via API when eligible, or via Computer Use when the gate passes.",
    escalation: "No API connector and Daytona disconnected; machine stopped for browser-only platforms; require_logged_in with needs_login.",
    guardrail: "Does not start the machine. Read-only. Tokens never returned.",
    humanStop: "If the machine is stopped and API is ineligible, tell the operator to Start or Connect a publisher — do not imply start.",
    auditEvents: ["social.get_publisher_status", "get_integration_status", "social.get_machine_status"],
  },
  {
    id: "native_api_first_publish",
    name: "Native API-first publish",
    summary:
      "Publish via X, TikTok, and Instagram Graph APIs when connected; Computer Use only for login, CAPTCHA, or ineligible accounts.",
    trigger: "manual",
    triggerDetail: "Preferred path for create_upload_job when publishers are connected",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: [],
    risk: "medium",
    steps: [
      "Call social.get_publisher_status",
      "Call social.list_uploadable_assets and social.resolve_asset",
      "Call social.create_upload_job with preferredRail=AUTO (fallbackToBrowser true)",
      "If the job returns awaiting_approval, call approvals.list_pending and wait for a human (or approvals.decide if scoped approvals:admin)",
      "API-eligible platforms publish without starting the Social Machine",
      "If a platform is ineligible (IG personal, X missing user OAuth), fall back to Computer Use only if Daytona is running or auto_start_for_upload is on. TikTok unaudited publish is forced to inbox (draft) — it is not a public post.",
      "Poll social.get_upload_job; record externalPostId / externalUrl and uploadPercent/uploadPhase",
    ],
    tools: [
      "social.get_publisher_status",
      "social.list_uploadable_assets",
      "social.resolve_asset",
      "social.create_upload_job",
      "approvals.list_pending",
      "social.get_upload_job",
      "social.list_posts",
    ],
    success: "Posts succeed on the API rail with external ids, or land as inbox/draft with a clear reason.",
    escalation: "PUBLISHER_NOT_ELIGIBLE, IG_PROFESSIONAL_REQUIRED, TIKTOK_AUDIT_REQUIRED, token expiry, or needs_attention on the browser rail.",
    guardrail: "Never store social passwords. Never return OAuth tokens. Never auto-start Daytona for API publishes. X has no draft API — keep draft jobs local until Publish.",
    humanStop: "Personal Instagram, unaudited TikTok public posts, login walls, and CAPTCHA.",
    auditEvents: ["social.get_publisher_status", "social.create_upload_job", "social.job_created"],
  },
  {
    id: "native_media_pipeline",
    name: "Library → caption → render → social",
    summary:
      "Ingest or search a library asset, caption it, queue a 9:16 render with optional burn-in, then attach to social.create_upload_job via mediaAssetId.",
    trigger: "manual",
    triggerDetail: "Preferred path for short-form distribution from the asset library",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: [],
    risk: "medium",
    steps: [
      "Call library.search_assets or library.get_asset",
      "If video and no READY captions, library.queue_render still works without burn-in; generate captions when STT is connected or skip",
      "Call library.queue_render preset=REELS_9x16 (burnInCaptions if a READY track exists)",
      "Poll library.list_renders until SUCCEEDED and take outputAssetId",
      "Call library.attach_to_social_job with mediaAssetId (AUTO rail)",
    ],
    tools: [
      "library.search_assets",
      "library.get_asset",
      "library.queue_render",
      "library.list_renders",
      "library.attach_to_social_job",
      "social.create_upload_job",
    ],
    success: "A 9:16 output asset is READY and a social job exists with that mediaAssetId.",
    escalation: "CAPTION_ENGINE_MISSING (upload SRT), FFMPEG_UNAVAILABLE, ASSET_NOT_READY, MACHINE_STOPPED for browser-only platforms.",
    guardrail: "Never auto-start the Social Machine for API-eligible jobs. Never return storage keys or signing secrets.",
    humanStop: "Manual SRT when STT is off. Operator Start for Computer Use fallback.",
    auditEvents: ["library.queue_render", "library.attach_to_social_job", "social.create_upload_job"],
  },
  {
    id: "emergency_stop_social_machine",
    name: "Emergency stop Social Machine",
    summary: "Cancel running jobs if supported and force-stop the VM.",
    trigger: "event",
    triggerDetail: "Cost alert, operator request, or AUTOMATION kill path",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "low",
    steps: [
      "Call social.list_upload_jobs for running jobs",
      "Call social.cancel_upload_job when still queued/running",
      "Call social.force_stop_if_running",
      "Audit the stop",
    ],
    tools: [
      "social.list_upload_jobs",
      "social.cancel_upload_job",
      "social.force_stop_if_running",
    ],
    success: "Machine is stopped. Remaining jobs are cancelled or needs_attention.",
    escalation: "Force-stop failure.",
    guardrail: "Does not delete the sandbox. Does not export session material.",
    humanStop: "Permanent sandbox delete stays human-only.",
    auditEvents: ["social.force_stop_if_running", "social.machine_stopped"],
  },
  {
    id: "reactor_upload_succeeded",
    name: "Reactor — upload succeeded",
    summary: "When a social upload succeeds, record the post and include the URL in the next daily ops brief.",
    trigger: "event",
    triggerDetail: "Webhook social.upload.succeeded (or poll social.list_upload_jobs)",
    requiredScopes: ["read", "write:clients"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call social.get_post / social.list_posts for the job",
      "Optionally update_client notes with externalUrl",
      "Include the link in the next daily_ops_brief",
    ],
    tools: ["social.get_post", "social.list_posts", "update_client"],
    success: "Succeeded posts have URLs in notes or the brief. No fabricated links.",
    escalation: "Succeeded job with missing externalUrl.",
    guardrail: "Do not change fees. Notes only.",
    humanStop: "Skip note writes if the operator already recorded the URLs.",
    auditEvents: ["social.upload.succeeded", "social.list_posts", "update_client"],
  },
  {
    id: "reactor_upload_needs_attention",
    name: "Reactor — upload needs attention",
    summary: "CAPTCHA, 2FA, or UI change. Screenshot, escalate, retry once only if the reason is transient.",
    trigger: "event",
    triggerDetail: "Webhook social.upload.needs_attention",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "Call social.get_upload_job",
      "Call social.take_screenshot if the machine is running",
      "Escalate to a human — do not infinite retry",
      "Optional single social.retry_upload_job only if the reason is transient",
    ],
    tools: ["social.get_upload_job", "social.take_screenshot", "social.retry_upload_job"],
    success: "Transient failures retried once; login walls and UI changes wait for a human.",
    escalation: "needs_login, CAPTCHA, 2FA, or UI change.",
    guardrail: "Honor social.max_auto_retries (1–2). No infinite loops.",
    humanStop: "Never type passwords. Never loop on needs_attention.",
    auditEvents: ["social.upload.needs_attention", "social.retry_upload_job"],
  },
  {
    id: "reactor_session_needs_login",
    name: "Reactor — session needs login",
    summary: "Pause distribution for that platform until a human logs in.",
    trigger: "event",
    triggerDetail: "Webhook social.session.needs_login",
    requiredScopes: ["read"],
    requiredIntegrations: ["Daytona"],
    risk: "high",
    steps: [
      "Pause distribution playbooks for that platform",
      "Notify the operator",
      "Do not create_upload_job for that platform until social.session.healthy or mark_platform_session logged_in",
    ],
    tools: ["social.list_platforms", "social.get_platform_status"],
    success: "No new jobs target a platform that needs login.",
    escalation: "Any needs_login. Login is human-only.",
    guardrail: "Do not store social passwords. Do not type into the login wall.",
    humanStop: "CAPTCHA, 2FA, and login walls stay with the operator.",
    auditEvents: ["social.session.needs_login", "social.get_platform_status"],
  },
  {
    id: "reactor_upload_failed",
    name: "Reactor — upload failed",
    summary: "Classify the error, retry once if transient, otherwise escalate. Respect auto_start_for_upload.",
    trigger: "event",
    triggerDetail: "Webhook social.upload.failed",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: [
      "Call social.get_upload_job and classify errorCode",
      "Retry once if transient",
      "If MACHINE_STOPPED and social.auto_start_for_upload is false, request a human start",
      "If MACHINE_STOPPED and the policy is on, run social.start_machine then retry_upload_job",
    ],
    tools: [
      "social.get_upload_job",
      "social.retry_upload_job",
      "social.start_machine",
      "social.get_machine_status",
    ],
    success: "Transient failures recovered; MACHINE_STOPPED is honest about policy.",
    escalation: "Second failure, or policy forbids auto-start.",
    guardrail: "auto_start_for_upload defaults to false. Max auto-retries 1–2.",
    humanStop: "Do not start the VM unless the operator enabled auto_start_for_upload.",
    auditEvents: ["social.upload.failed", "social.retry_upload_job"],
  },
  {
    id: "reactor_machine_error",
    name: "Reactor — Social Machine error",
    summary: "Force-stop the VM and fail or cancel running upload jobs.",
    trigger: "event",
    triggerDetail: "Webhook social.machine.error",
    requiredScopes: ["read", "write:social"],
    requiredIntegrations: ["Daytona"],
    risk: "high",
    steps: [
      "Call social.force_stop_if_running",
      "Call social.list_upload_jobs for running/queued jobs",
      "Cancel or mark failed as appropriate",
      "Escalate to the operator",
    ],
    tools: [
      "social.force_stop_if_running",
      "social.list_upload_jobs",
      "social.cancel_upload_job",
    ],
    success: "Machine is stopped. Running jobs are cancelled or failed. Operator is notified.",
    escalation: "Force-stop failure.",
    guardrail: "Does not delete the sandbox. Does not export session material.",
    humanStop: "Permanent sandbox delete stays human-only.",
    auditEvents: ["social.machine.error", "social.force_stop_if_running"],
  },
  {
    id: "skill_capture_after_complex_run",
    name: "Capture skill after a complex run",
    summary: "After a successful agent/playbook run with ≥ N tool calls, propose a SKILL.md for review.",
    trigger: "event",
    triggerDetail: "Successful agent or playbook run with ≥ skills.min_tool_calls_to_distill (default 5)",
    requiredScopes: ["read", "skills:manage"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Summarize the audit trace for the run_id",
      "Call skill_manage.create with provenance=agent (pending_review unless skills.auto_publish_agent)",
      "Never embed secrets in skill_md or scripts",
      "permissions ⊆ actor scopes",
    ],
    tools: ["skill_manage.create", "skills.list"],
    success: "A pending skill exists capturing the procedure. Operator can approve it.",
    escalation: "Create rejected for SKILL_SECRETS_FORBIDDEN.",
    guardrail: "Default pending_review. No secrets. Network false.",
    humanStop: "Do not auto-publish unless the operator enabled skills.auto_publish_agent.",
    auditEvents: ["skill_manage.create"],
  },
  {
    id: "skill_refine_on_success",
    name: "Refine skill on success",
    summary: "After a successful skills.invoke, patch pitfalls/steps and bump the version.",
    trigger: "event",
    triggerDetail: "Successful skills.invoke or repeated manual workflow",
    requiredScopes: ["skills:manage", "skills:execute"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call skills.get for the skill",
      "Call skill_manage.patch to update pitfalls/steps",
      "Bump version in SKILL.md",
    ],
    tools: ["skills.get", "skill_manage.patch", "skill_manage.list_versions"],
    success: "SKILL.md reflects the latest successful path. Prior version is snapshot.",
    escalation: "Patch miss (find string not present).",
    guardrail: "No secrets. Do not expand permissions.",
    humanStop: "Skip builtin skills unless the operator asked.",
    auditEvents: ["skill_manage.patch"],
  },
  {
    id: "skill_curator_stale",
    name: "Curate stale agent skills",
    summary: "Weekly: list agent skills unused 30+ days and archive (no hard delete).",
    trigger: "schedule",
    triggerDetail: "Weekly",
    requiredScopes: ["skills:manage"],
    requiredIntegrations: [],
    risk: "low",
    steps: [
      "Call skills.list",
      "Identify agent provenance skills unused 30+ days",
      "Call skill_manage.set_enabled false / set_provenance_review reject to archive",
    ],
    tools: ["skills.list", "skill_manage.set_enabled", "skill_manage.set_provenance_review"],
    success: "Stale agent skills are archived, not deleted.",
    escalation: "None — archival is reversible via rollback.",
    guardrail: "Never hard-delete. Builtin skills stay.",
    humanStop: "Do not archive human-authored skills without confirmation.",
    auditEvents: ["skill_manage.set_enabled"],
  },
  {
    id: "clipping_agent_full_package",
    name: "Clipping Agent — full package",
    summary: "In-app or Hermes: research, ideas, titles, thumbnail, optional draft social.",
    trigger: "manual",
    triggerDetail: "Operator starts an Agent run or Hermes calls clipping.* tools",
    requiredScopes: ["read", "actions:ai"],
    requiredIntegrations: ["AI API"],
    risk: "medium",
    steps: [
      "clipping.research_channel",
      "clipping.generate_ideas and clipping.generate_titles (long-form ≥ 4 minutes only)",
      "clipping.generate_thumbnail when Higgsfield is connected",
      "clipping.set_stage with notes when evidence exists",
      "clipping.distribute_social in draft only if the goal asks — never auto-start the VM",
    ],
    tools: [
      "clipping.research_channel",
      "clipping.generate_ideas",
      "clipping.generate_titles",
      "clipping.generate_thumbnail",
      "clipping.set_stage",
      "clipping.distribute_social",
    ],
    success: "Persisted ideas/titles/thumbnail. Stage writes have notes. Social jobs are drafts.",
    escalation: "AI_RATE_LIMIT (backoff), MACHINE_STOPPED, needs_login.",
    guardrail: "4-minute rule. No fabricated analytics. No VM start unless explicit.",
    humanStop: "Fee changes, churn, Disconnect, and passwords stay human-only.",
    auditEvents: ["clipping.generate_ideas", "clipping.generate_titles", "clipping.set_stage"],
  },
  {
    id: "clipping_preset_ideation",
    name: "Builtin preset — ideation pack",
    summary: "skills.invoke clipping-ideation-pack or Agent chip: ideas + titles, 4-minute rule.",
    trigger: "manual",
    triggerDetail: "Operator starts the Ideation pack chip or Hermes invokes the skill",
    requiredScopes: ["read", "actions:ai", "skills:execute"],
    requiredIntegrations: ["AI API"],
    risk: "low",
    steps: ["clipping.research_channel", "clipping.generate_ideas", "clipping.generate_titles"],
    tools: ["clipping.research_channel", "clipping.generate_ideas", "clipping.generate_titles", "skills.invoke"],
    success: "Persisted ideas and titles. No VM.",
    escalation: "AI_RATE_LIMIT.",
    guardrail: "4-minute rule. No social, no auto-start.",
    humanStop: "Passwords and keys stay human-only.",
    auditEvents: ["clipping.generate_ideas", "clipping.generate_titles"],
  },
  {
    id: "clipping_preset_full_package",
    name: "Builtin preset — full package",
    summary: "End-to-end package via SKILL.md plan; orchestrate.py writes package.json.",
    trigger: "manual",
    triggerDetail: "Agent full-package chip or skills.invoke clipping-full-package",
    requiredScopes: ["read", "actions:ai", "skills:execute"],
    requiredIntegrations: ["AI API"],
    risk: "medium",
    steps: [
      "Load client + long-form",
      "Ideas + titles",
      "Thumbnail if Higgsfield connected",
      "Export package.json via orchestrate.py (script mode) or Agent COMPLETE",
    ],
    tools: [
      "clipping.research_channel",
      "clipping.generate_ideas",
      "clipping.generate_titles",
      "clipping.generate_thumbnail",
      "skills.invoke",
    ],
    success: "package.json with ideas, titles, thumbnailUrl, notes. No invented analytics.",
    escalation: "Higgsfield gap is honest. MACHINE_STOPPED is not used here.",
    guardrail: "Never auto-start Social. 4-minute rule.",
    humanStop: "Stage writes still need notes/evidence.",
    auditEvents: ["clipping.generate_ideas", "clipping.generate_thumbnail"],
  },
  {
    id: "clipping_preset_social_drafts",
    name: "Builtin preset — social drafts",
    summary: "Queue draft uploads. MACHINE_STOPPED waits. Never auto-start unless policy.",
    trigger: "manual",
    triggerDetail: "Agent Social drafts chip or skills.invoke clipping-social-draft-distribute",
    requiredScopes: ["read", "write:social", "skills:execute"],
    requiredIntegrations: ["Daytona"],
    risk: "medium",
    steps: ["social.get_machine_status", "clipping.distribute_social mode=draft"],
    tools: ["social.get_machine_status", "clipping.distribute_social", "social.create_upload_job"],
    success: "Draft job ids, or waiting_resource if the machine is stopped.",
    escalation: "needs_login, MACHINE_STOPPED.",
    guardrail: "auto_start_for_upload default off.",
    humanStop: "Passwords never stored. Operator logs in on the Social tab.",
    auditEvents: ["clipping.distribute_social"],
  },
  {
    id: "performance_after_upload",
    name: "Fetch performance after upload",
    summary:
      "After social.upload.succeeded, schedule metrics fetch (1h / 24h / 7d). Never invent views. Distill winners to pending KnowledgeProposals — do not auto-merge.",
    trigger: "event",
    triggerDetail: "social.upload.succeeded, plus a weekly sweep for active clients",
    requiredScopes: ["read"],
    requiredIntegrations: ["Platform publisher APIs (optional)"],
    risk: "low",
    steps: [
      "On social.upload.succeeded with externalPostId, call analytics.refresh_post_performance",
      "If the API is missing or 403, leave metrics unknown and tell the operator to enter them manually",
      "Weekly: analytics.list_winners for active clients",
      "For new winners, a KnowledgeProposal is created PENDING_REVIEW — never write KnowledgeEntry unless learning.autoMerge is on (default off)",
    ],
    tools: [
      "analytics.refresh_post_performance",
      "analytics.list_winners",
      "knowledge.list_proposals",
      "knowledge.decide_proposal",
    ],
    success: "Published posts have D1/D7 snapshots when APIs allow; winners have pending proposals.",
    escalation: "Repeated API 401/403 — fall back to manual metrics, do not zero-fill.",
    guardrail: "Missing data is unknown, not zero. Auto-merge is off.",
    humanStop: "Do not approve knowledge proposals without an operator. Do not fabricate metrics.",
    auditEvents: ["performance.fetched", "knowledge.proposal.created"],
  },
  {
    id: "reactor_linear_social_fail",
    name: "Reactor — Linear issue on social fail",
    summary:
      "When a social upload fails or needs attention, open a Linear issue in the AI Clipping Dashboard project if Linear is enabled.",
    trigger: "event",
    triggerDetail: "Webhook social.upload.failed or social.upload.needs_attention",
    requiredScopes: ["read", "linear:write"],
    requiredIntegrations: ["Linear"],
    risk: "low",
    steps: [
      "Call linear.get_status — skip if not configured or LINEAR_ENABLED is false (audit note only)",
      "Call social.get_upload_job for the error snippet (no secrets)",
      "Call linear.create_issue with title [Social] Upload failed — {platform} — {clientName}, labels social + bug, deep link to the job",
    ],
    tools: ["linear.get_status", "linear.create_issue", "social.get_upload_job"],
    success: "A Linear issue exists with an Agency Admin deep link. The upload job itself is unchanged.",
    escalation: "Linear 401/429 — retry queue; never fail the Agency job.",
    guardrail: "Never create issues if LINEAR_ENABLED is false. Rate-limit creates.",
    humanStop: "Do not auto-move issues labeled manual-board.",
    auditEvents: ["social.upload.failed", "linear.issue.created"],
  },
  {
    id: "reactor_linear_render_fail",
    name: "Reactor — Linear issue on render fail",
    summary: "Open a Linear issue when a library render job fails.",
    trigger: "event",
    triggerDetail: "Webhook library.render.failed",
    requiredScopes: ["read", "linear:write"],
    requiredIntegrations: ["Linear"],
    risk: "low",
    steps: [
      "Call linear.get_status",
      "Call linear.create_issue titled [Render] Failed — {preset} with label media",
    ],
    tools: ["linear.get_status", "linear.create_issue", "library.list_renders"],
    success: "Failed render is tracked in Linear without blocking the library.",
    escalation: "Linear outage — queue retry.",
    guardrail: "LINEAR_ENABLED false → silent degrade + audit.",
    humanStop: "Do not retry the FFmpeg job from this playbook.",
    auditEvents: ["library.render.failed", "linear.issue.created"],
  },
  {
    id: "reactor_linear_knowledge_proposal",
    name: "Reactor — Linear track learning proposal",
    summary: "Optional. Create a Linear issue “Review learning: {principle}” labeled learning.",
    trigger: "event",
    triggerDetail: "Webhook knowledge.proposal.created (only if auto-issue on proposal is on)",
    requiredScopes: ["read", "linear:write"],
    requiredIntegrations: ["Linear"],
    risk: "low",
    steps: [
      "Call knowledge.list_proposals",
      "If Linear autoIssueOnProposal is on, linear.create_issue with label learning",
    ],
    tools: ["knowledge.list_proposals", "linear.create_issue"],
    success: "Proposal is still pending_review in Agency Admin; Linear is a tracker only.",
    escalation: "None — skip if the flag is off.",
    guardrail: "Never auto-merge knowledge. Never post publicly from this playbook.",
    humanStop: "Approving knowledge stays in the proposals inbox.",
    auditEvents: ["knowledge.proposal.created", "linear.issue.created"],
  },
];

export type PlaybookBoolKey =
  | "autoMarkPayments"
  | "autoAdvanceStageWithoutEvidence"
  | "autoCreateClientFromClosedLead"
  | "socialAutoStartForUpload"
  | "socialRequireLoggedInPlatformsOnly"
  | "skillsAutoPublishAgent"
  | "skillsAllowNetwork"
  | "skillsProposeOnAgentSuccess";

export const PLAYBOOK_POLICY_LABELS: { key: PlaybookBoolKey; title: string; hint: string }[] = [
  {
    key: "autoMarkPayments",
    title: "auto_mark_payments",
    hint: "Off by default. Hermes reports the queue and only marks paid after confirmed collection.",
  },
  {
    key: "autoAdvanceStageWithoutEvidence",
    title: "auto_advance_stage_without_evidence",
    hint: "Off by default. Stage writes need AI_DISCORD evidence or explicit notes.",
  },
  {
    key: "autoCreateClientFromClosedLead",
    title: "auto_create_client_from_closed_lead",
    hint: "Off by default. CLOSED leads do not auto-create clients.",
  },
  {
    key: "socialAutoStartForUpload",
    title: "social.auto_start_for_upload",
    hint: "Off by default. Browser-rail create_upload_job fails with MACHINE_STOPPED when the VM is off. API-eligible jobs never start the VM.",
  },
  {
    key: "skillsAutoPublishAgent",
    title: "skills.auto_publish_agent",
    hint: "Off by default. Agent-authored skills stay pending_review until you approve them.",
  },
  {
    key: "skillsAllowNetwork",
    title: "skills.allow_network",
    hint: "Off by default. Python skills cannot open the network even if SKILL.md asks.",
  },
  {
    key: "skillsProposeOnAgentSuccess",
    title: "skills.propose_on_agent_success",
    hint: "On by default. Successful Agent runs with enough tools draft a pending_review skill. Never auto-publishes.",
  },
];

export function parsePlaybookPolicies(raw: unknown): PlaybookPolicies {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PLAYBOOK_POLICIES };
  const row = raw as Record<string, unknown>;
  const retriesRaw = Number(row.socialMaxAutoRetries ?? row.social_max_auto_retries);
  const bulkRaw = Number(row.socialMaxBulkJobsPerRun ?? row.social_max_bulk_jobs_per_run);
  const idleRaw = Number(row.socialIdleStopMinutes ?? row.social_idle_stop_minutes);
  const modeRaw = String(row.socialDefaultUploadMode ?? row.social_default_upload_mode ?? "");
  return {
    autoMarkPayments: row.autoMarkPayments === true || row.auto_mark_payments === true,
    autoAdvanceStageWithoutEvidence:
      row.autoAdvanceStageWithoutEvidence === true ||
      row.auto_advance_stage_without_evidence === true,
    autoCreateClientFromClosedLead:
      row.autoCreateClientFromClosedLead === true ||
      row.auto_create_client_from_closed_lead === true,
    analyticsPullConcurrency:
      row.analyticsPullConcurrency === "medium" || row.analytics_pull_concurrency === "medium"
        ? "medium"
        : "low",
    socialAutoStartForUpload:
      row.socialAutoStartForUpload === true || row.social_auto_start_for_upload === true,
    socialDefaultUploadMode: modeRaw === "publish" ? "publish" : "draft",
    socialMaxAutoRetries: retriesRaw === 2 ? 2 : 1,
    socialMaxBulkJobsPerRun:
      Number.isFinite(bulkRaw) && bulkRaw >= 1 && bulkRaw <= 20 ? Math.floor(bulkRaw) : 5,
    socialIdleStopMinutes:
      Number.isFinite(idleRaw) && idleRaw >= 5 && idleRaw <= 240 ? Math.floor(idleRaw) : 20,
    socialRequireLoggedInPlatformsOnly:
      row.socialRequireLoggedInPlatformsOnly === undefined &&
      row.social_require_logged_in_platforms_only === undefined
        ? true
        : row.socialRequireLoggedInPlatformsOnly === true ||
          row.social_require_logged_in_platforms_only === true,
    skillsAutoPublishAgent:
      row.skillsAutoPublishAgent === true || row.skills_auto_publish_agent === true,
    skillsMinToolCallsToDistill: (() => {
      const n = Number(row.skillsMinToolCallsToDistill ?? row.skills_min_tool_calls_to_distill);
      return Number.isFinite(n) && n >= 3 && n <= 20 ? Math.floor(n) : 5;
    })(),
    skillsAllowNetwork: row.skillsAllowNetwork === true || row.skills_allow_network === true,
    skillsProposeOnAgentSuccess:
      row.skillsProposeOnAgentSuccess === undefined &&
      row.skills_propose_on_agent_success === undefined
        ? true
        : row.skillsProposeOnAgentSuccess === true ||
          row.skills_propose_on_agent_success === true,
  };
}

export function playbookById(id: string): HermesPlaybook | undefined {
  return HERMES_PLAYBOOKS.find((row) => row.id === id);
}

export function formatPlaybookBrief(policies: PlaybookPolicies, enabled: boolean): string {
  const policyBlock = [
    `auto_mark_payments: ${policies.autoMarkPayments}`,
    `auto_advance_stage_without_evidence: ${policies.autoAdvanceStageWithoutEvidence}`,
    `auto_create_client_from_closed_lead: ${policies.autoCreateClientFromClosedLead}`,
    `analytics_pull_concurrency: ${policies.analyticsPullConcurrency}`,
    `social.auto_start_for_upload: ${policies.socialAutoStartForUpload}`,
    `social.default_upload_mode: ${policies.socialDefaultUploadMode}`,
    `social.max_auto_retries: ${policies.socialMaxAutoRetries}`,
    `social.max_bulk_jobs_per_run: ${policies.socialMaxBulkJobsPerRun}`,
    `social.idle_stop_minutes: ${policies.socialIdleStopMinutes}`,
    `social.require_logged_in_platforms_only: ${policies.socialRequireLoggedInPlatformsOnly}`,
    `skills.auto_publish_agent: ${policies.skillsAutoPublishAgent}`,
    `skills.min_tool_calls_to_distill: ${policies.skillsMinToolCallsToDistill}`,
    `skills.allow_network: ${policies.skillsAllowNetwork}`,
    `skills.propose_on_agent_success: ${policies.skillsProposeOnAgentSuccess}`,
    `AUTOMATION_ENABLED: ${enabled}`,
    `human_approval_required_for: ${HUMAN_APPROVAL_REQUIRED_FOR.join("; ")}`,
  ].join("\n");

  const tools = Array.from(
    new Set(HERMES_PLAYBOOKS.flatMap((row) => row.tools)),
  ).join(", ");

  const body = HERMES_PLAYBOOKS.map((row) => {
    return [
      `## ${row.id} (${row.risk})`,
      `Name: ${row.name}`,
      `Trigger: ${row.trigger} — ${row.triggerDetail}`,
      `Required scopes: ${row.requiredScopes.join(", ")}`,
      `Required integrations: ${row.requiredIntegrations.join(", ") || "none"}`,
      `Steps:`,
      ...row.steps.map((step, i) => `  ${i + 1}. ${step}`),
      `Tools: ${row.tools.join(", ")}`,
      `Success: ${row.success}`,
      `Guardrail: ${row.guardrail}`,
      `Human-stop: ${row.humanStop}`,
      `Escalation: ${row.escalation}`,
      `Expected audit: ${row.auditEvents.join(", ")}`,
    ].join("\n");
  }).join("\n\n");

  return `ClippyOS — Hermes Playbook
Agency Admin is the system of record. Hermes is the client.
Generate API / MCP / webhook credentials in Settings → Automation & Hermes and paste them into Hermes.
Playbooks run inside Hermes; Agency Admin provides the tools and the audit trail.
Carry playbook id + run_id on every tool call (header X-Playbook-Id / X-Run-Id, or payload playbook / runId).

Orientation
- API base: {origin}/api/v1   Authorization: Bearer <agk_live_…>
- MCP: {origin}/api/mcp       Authorization: Bearer <mcp_…>
- Inbound webhook: {origin}/api/webhooks/inbound
  HMAC: X-Agency-Signature = sha256=HMAC-SHA256(secret, timestamp + "." + rawBody)
  Timestamp: X-Agency-Timestamp (Unix seconds, ±5 minutes)

Kill switch: revoke the API key / MCP token, or set AUTOMATION_ENABLED=false. Mutations fail closed. Human UI stays live.

Human-only (never call, never request):
- Integration secrets, Super Admin password, Disconnect
- Minting or revoking keys
- Hard-delete clients
- Arbitrary fee changes
- Fabricating AnalyticsSnapshots or views-increase signals
- Sending Discord messages (Discord bot is read-only)

Policies
${policyBlock}

MCP / API tools
${tools}

Resources: agency://dashboard, agency://pipeline, agency://clients/{id}, agency://playbooks, agency://social/machine, agency://social/platforms, agency://social/publishers, agency://social/jobs/{id}, agency://social/posts, agency://addons, agency://skills, agency://skills/{id}, agency://llm/providers, agency://llm/models, agency://analytics/performance, agency://knowledge/proposals, agency://linear/status

${body}
`;
}

export function formatPlaybookPackage(input: {
  policies: PlaybookPolicies;
  enabled: boolean;
  origin?: string;
  version?: string;
  skills?: Array<{ slug: string; name: string; version: string }>;
  llmProvider?: string;
  llmModel?: string;
}): string {
  const origin = input.origin?.trim() || "{origin}";
  const brief = formatPlaybookBrief(input.policies, input.enabled).replaceAll("{origin}", origin);
  const reactors = HERMES_PLAYBOOKS.filter((row) => row.id.startsWith("reactor_"))
    .map((row) => `- ${row.id}: trigger ${row.triggerDetail}`)
    .join("\n");
  const skillLines = (input.skills ?? [])
    .map((row) => `- ${row.slug}@${row.version} — ${row.name}`)
    .join("\n");
  const header = `ClippyOS — Hermes Playbook package
Version: ${input.version ?? "2026.08.orchestrate"}

Role
You operate Agency Admin, the AI clipping agency OS.
Humans use the dashboard. You run this Playbook against the API, MCP, and inbound webhooks.
Agency Admin is the system of record and the browser runtime (Daytona Social Machine). You are the client.

Connection (paste the real values from Settings → Automation & Hermes; never invent secrets)
- API base: ${origin}/api/v1
  Authorization: Bearer <API_KEY>
- MCP: ${origin}/api/mcp
  Authorization: Bearer <MCP_TOKEN>
- Inbound webhook: ${origin}/api/webhooks/inbound
  Signing secret: <WEBHOOK_SECRET>
  HMAC: X-Agency-Signature = sha256=HMAC-SHA256(secret, timestamp + "." + rawBody)
  Timestamp: X-Agency-Timestamp (Unix seconds, ±5 minutes)
- Outbound events (optional Hermes receiver): operator-configured HTTPS URL
  Verify with the same HMAC. Subscribe at least to social.upload.succeeded and social.session.needs_login.

Scope notes for the minted Hermes key
Required: read, write:social
Recommended ops: write:progress, write:payments, write:leads, actions:ai, skills:execute
Explicitly excluded: admin, secret management, Daytona key access, Super Admin, Disconnect, skills:manage (unless the operator grants it)

Policy defaults (override only when the operator has toggled them in Settings)
auto_mark_payments: false
auto_advance_stage_without_evidence: false
social.auto_start_for_upload: false
  When OFF, browser-rail create_upload_job fails with MACHINE_STOPPED until a human or playbook explicitly starts the machine.
  API-eligible jobs never start the VM. When ON, browser-rail jobs may Start the Social Machine if it is stopped — this incurs Daytona compute cost.
social.default_upload_mode: draft
social.max_auto_retries: 1
social.max_bulk_jobs_per_run: 5
skills.auto_publish_agent: ${input.policies.skillsAutoPublishAgent}
skills.min_tool_calls_to_distill: ${input.policies.skillsMinToolCallsToDistill}
skills.allow_network: ${input.policies.skillsAllowNetwork}
skills.propose_on_agent_success: ${input.policies.skillsProposeOnAgentSuccess}
AUTOMATION_ENABLED: ${input.enabled}

LLM
default provider: ${input.llmProvider ?? "xai-oauth"}
default model: ${input.llmModel ?? "grok-4.6"}
Never request or embed API keys, OAuth refresh tokens, or Daytona credentials.

Enabled skills (approved only; SKILL.md bodies live at skills/get — no secrets)
${skillLines || "- none yet — use skills/list"}

Builtin clipping presets (Agent chips = these skill ids)
- clipping-ideation-pack
- clipping-thumbnail-pass
- clipping-full-package (SKILL.md + scripts/orchestrate.py → package.json)
- clipping-social-draft-distribute (draft jobs; MACHINE_STOPPED waits)
- clipping-social-verify
- clipping-pipeline-nudge
- clipping-30d-guarantee-check (never invents analytics)
- clipping-agent-self-improve (pending_review only)

Starting a preset in the Agent tab creates an AgentRun with presetSkillId. Hermes may skills.invoke the same ids.

MCP skills
- social.get_publisher_status — per-platform API configured/connected/eligible. tiktok includes auditStatus, postModeDefault, eligibleDirectPost, eligibleInbox, openId. instagram includes igUserId, accountType, eligibleReelsPublish. youtube includes channelId, channelTitle, eligible. Never returns tokens. X includes username when connected.
- social.create_upload_job preferredRail=AUTO|API|BROWSER (default AUTO). AUTO uses native APIs when eligible; Computer Use is the fallback when Daytona is running and fallbackToBrowser is true. mode=publish is gated by approvals.requireForSocialPublish (default on) — the job stays AWAITING_APPROVAL until approvals.decide. mode=draft never requires publish approval. Platform x uses the official X API (chunked media + POST /2/tweets) when connected. Platform youtube uses Data API v3 resumable upload (draft → private; publish default unlisted). Prefer mediaAssetId from the library (current version file, 9:16 render for TikTok/IG when present, 16:9 for YouTube-only).
- approvals.list_pending / approvals.decide — Hermes cannot skip the policy. approvals:admin is required to decide.
- library.search_assets / library.get_asset / library.queue_render / library.attach_to_social_job — unified media graph. Captions: generate when STT is connected, else manual SRT.
- social.get_upload_job returns percent, phase, and resumableSessionId for in-flight chunked uploads. social.retry_upload_job resumes from the last persisted offset. social.cancel_upload_job aborts further chunks.
- Instagram API rail is Reels publish for professional accounts only. Draft does not call media_publish. Personal accounts stay on Computer Use. TikTok uses Content Posting API: draft → inbox; publish + audited app → Direct Post; unaudited publish is forced to inbox (not a public post). YouTube API rail uploads to the workspace publish channel (v1); draft is private. Auto falls back to Computer Use if the API is not connected.
- X posting needs user-context OAuth (app-only Bearer cannot tweet). X has no draft API — draft jobs stay local until Publish.
- skills/list, skills/get, skills/invoke (skills:execute for Python in a Daytona sandbox)
- skill_manage.create / edit / patch / write_file / set_enabled / set_provenance_review / list_versions / rollback (skills:manage — not on the default Hermes key)
- vision.analyze, vision.compare
- computer.* and browser.* (write:social; Social Machine must already be running unless computer.start is explicit)
- clipping.* composite tools for the in-app Agent
- tasks/get for long runs
- tools/listChanged when add-ons or skills change

Event bus
Domain events (payment.collected, progress.stage_changed, social.upload.*, social.session.*, social.machine.*)
are delivered as signed outbound webhooks when a receiver URL is configured. If no receiver is set, poll the API.
Webhook reactors (event-driven; do not busy-loop):
${reactors}

Kill switch
Revoke the API key / MCP token, or set AUTOMATION_ENABLED=false. Mutations fail closed. Human UI stays live.
Never request integration secrets, Super Admin password, or Disconnect.

---
`;
  return `${header}\n${brief}`;
}

