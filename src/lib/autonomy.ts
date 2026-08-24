/** Client-safe autonomy catalog. Secrets never live here. */

import type { PlaybookPolicies } from "@/lib/playbooks";

export const API_KEY_SCOPES = [
  "read",
  "write:progress",
  "write:payments",
  "write:leads",
  "write:clients",
  "actions:ai",
  "write:social",
  "skills:execute",
  "skills:manage",
  "approvals:admin",
  "linear:read",
  "linear:write",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const DEFAULT_HERMES_SCOPES: readonly ApiKeyScope[] = [
  "read",
  "write:progress",
  "write:payments",
  "write:leads",
  "actions:ai",
  "write:social",
  "skills:execute",
  "linear:read",
  "linear:write",
];

export const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  read: "Read",
  "write:progress": "Write progress",
  "write:payments": "Mark paid",
  "write:leads": "Write leads",
  "write:clients": "Write clients",
  "actions:ai": "AI actions",
  "write:social": "Social machine & upload",
  "skills:execute": "Execute skills",
  "skills:manage": "Manage skills",
  "approvals:admin": "Decide approvals",
  "linear:read": "Read Linear",
  "linear:write": "Create Linear issues",
};

export const AUTONOMY_QUERY_KEY = ["autonomy"] as const;
export const AUTONOMY_AUDIT_QUERY_KEY = ["autonomy-audit"] as const;
export const AUTONOMY_HEALTH_QUERY_KEY = ["autonomy-health"] as const;

export const WEBHOOK_EVENT_TYPES = [
  "payment.collected",
  "client.created",
  "client.status_changed",
  "progress.stage_changed",
  "client.at_risk_30d",
  "lead.created",
  "lead.status_changed",
  "analytics.snapshot_created",
  "discord_agent.run_completed",
  "discord_agent.run_failed",
  "social.job_created",
  "social.job_completed",
  "social.job_needs_attention",
  "social.machine_started",
  "social.machine_stopped",
  "social.upload.succeeded",
  "social.upload.failed",
  "social.upload.needs_attention",
  "social.session.needs_login",
  "social.session.healthy",
  "social.machine.started",
  "social.machine.stopped",
  "social.machine.error",
  "agent.run.succeeded",
  "agent.run.failed",
  "library.asset.ready",
  "library.render.succeeded",
  "library.render.failed",
  "library.caption.ready",
  "approval.requested",
  "approval.approved",
  "approval.rejected",
  "analytics.performance_fetched",
  "knowledge.proposal.created",
  "knowledge.proposal.approved",
  "linear.issue.created",
  "linear.issue.updated",
  "linear.connected",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  "payment.collected": "Payment collected",
  "client.created": "Client created",
  "client.status_changed": "Client status changed",
  "progress.stage_changed": "Stage changed",
  "client.at_risk_30d": "Client at 30-day risk",
  "lead.created": "Lead created",
  "lead.status_changed": "Lead status changed",
  "analytics.snapshot_created": "Analytics snapshot",
  "discord_agent.run_completed": "Discord agent completed",
  "discord_agent.run_failed": "Discord agent failed",
  "social.job_created": "Social upload job created",
  "social.job_completed": "Social job completed (legacy)",
  "social.job_needs_attention": "Social job needs attention (legacy)",
  "social.machine_started": "Social Machine started (legacy)",
  "social.machine_stopped": "Social Machine stopped (legacy)",
  "social.upload.succeeded": "Social upload succeeded",
  "social.upload.failed": "Social upload failed",
  "social.upload.needs_attention": "Social upload needs attention",
  "social.session.needs_login": "Social session needs login",
  "social.session.healthy": "Social session healthy",
  "social.machine.started": "Social Machine started",
  "social.machine.stopped": "Social Machine stopped",
  "social.machine.error": "Social Machine error",
  "agent.run.succeeded": "Agent run succeeded",
  "agent.run.failed": "Agent run failed",
  "library.asset.ready": "Library asset ready",
  "library.render.succeeded": "Render succeeded",
  "library.render.failed": "Render failed",
  "library.caption.ready": "Captions ready",
  "approval.requested": "Approval requested",
  "approval.approved": "Approval granted",
  "approval.rejected": "Approval rejected",
  "analytics.performance_fetched": "Post performance fetched",
  "knowledge.proposal.created": "Learning proposal created",
  "knowledge.proposal.approved": "Learning proposal approved",
  "linear.issue.created": "Linear issue created",
  "linear.issue.updated": "Linear issue updated",
  "linear.connected": "Linear connected",
};

export const INBOUND_COMMANDS = [
  "mark_payment_paid",
  "set_client_stage",
  "create_lead",
  "update_lead_status",
  "create_client",
  "update_client",
  "pull_analytics",
  "regenerate_suggested_titles",
  "regenerate_suggested_ideas",
  "social.start_machine",
  "social.stop_machine",
  "social.create_upload_job",
  "social.retry_upload_job",
  "social.cancel_upload_job",
  "social.force_stop_if_running",
] as const;

export type InboundCommand = (typeof INBOUND_COMMANDS)[number];

export type McpToolDef = {
  name: string;
  domain: string;
  description: string;
  scopes: ApiKeyScope[];
};

export const MCP_TOOLS: readonly McpToolDef[] = [
  {
    name: "list_clients",
    domain: "Clients",
    description: "List active clients with current production stage.",
    scopes: ["read"],
  },
  {
    name: "get_client",
    domain: "Clients",
    description: "Get one client plus latest progress and analytics summary.",
    scopes: ["read"],
  },
  {
    name: "create_client",
    domain: "Clients",
    description: "Create a client. Optional YouTube URL is stored; analysis runs when AI is connected.",
    scopes: ["write:clients"],
  },
  {
    name: "update_client",
    domain: "Clients",
    description: "Update limited client fields (notes, startDate, status=ACTIVE). Never changes fees or churns.",
    scopes: ["write:clients"],
  },
  {
    name: "list_payments",
    domain: "Payments",
    description: "List payments with derived display status.",
    scopes: ["read"],
  },
  {
    name: "mark_payment_paid",
    domain: "Payments",
    description: "Mark a PENDING or OVERDUE payment as PAID (same rules as Money / Calendar).",
    scopes: ["write:payments"],
  },
  {
    name: "get_client_progress",
    domain: "Progress",
    description: "Latest stage plus history for a client.",
    scopes: ["read"],
  },
  {
    name: "set_client_stage",
    domain: "Progress",
    description: "Append a ClientProgress row for any of the eight stages. Source is AGENT.",
    scopes: ["write:progress"],
  },
  {
    name: "list_leads",
    domain: "Leads",
    description: "List live leads and pipeline totals.",
    scopes: ["read"],
  },
  {
    name: "create_lead",
    domain: "Leads",
    description: "Create a lead with money fields and status.",
    scopes: ["write:leads"],
  },
  {
    name: "update_lead_status",
    domain: "Leads",
    description: "Move a lead through the pipeline.",
    scopes: ["write:leads"],
  },
  {
    name: "pull_client_analytics",
    domain: "Analytics",
    description: "Pull public YouTube stats into an AnalyticsSnapshot.",
    scopes: ["read"],
  },
  {
    name: "get_analytics_snapshot",
    domain: "Analytics",
    description: "List stored analytics snapshots for a client.",
    scopes: ["read"],
  },
  {
    name: "get_dashboard_snapshot",
    domain: "Dashboard",
    description: "Live-derived command-center metrics (same formulas as the home Dashboard).",
    scopes: ["read"],
  },
  {
    name: "list_at_risk_clients",
    domain: "Dashboard",
    description: "Active clients at day 25+ of the 30-day views guarantee.",
    scopes: ["read"],
  },
  {
    name: "regenerate_suggested_titles",
    domain: "AI",
    description: "Regenerate suggested titles for a client’s latest long-form videos.",
    scopes: ["actions:ai"],
  },
  {
    name: "regenerate_suggested_ideas",
    domain: "AI",
    description: "Regenerate suggested long-form ideas for a client.",
    scopes: ["actions:ai"],
  },
  {
    name: "get_integration_status",
    domain: "Integrations",
    description: "Connected vs not for each integration. Never returns secret values.",
    scopes: ["read"],
  },
  {
    name: "get_connect_status",
    domain: "Automation",
    description: "Hermes Connect checklist status, policies, webhook subscriptions, Daytona, and Social Machine state. No secrets.",
    scopes: ["read"],
  },
  {
    name: "get_playbook_package",
    domain: "Automation",
    description: "Copy-ready Playbook package text (ops + social + webhook reactors) with connection placeholders. No secrets.",
    scopes: ["read"],
  },
  {
    name: "skills.list",
    domain: "Skills",
    description: "List enabled skills (id, name, version, provenance). Pending agent skills are omitted unless approved.",
    scopes: ["read"],
  },
  {
    name: "skills.get",
    domain: "Skills",
    description: "Full SKILL.md plus script names (not secret env). No tokens.",
    scopes: ["read"],
  },
  {
    name: "skills.invoke",
    domain: "Skills",
    description: "Run a skill. Markdown-only returns immediately; Python returns a task id and runs in a Daytona sandbox.",
    scopes: ["skills:execute"],
  },
  {
    name: "skills.create",
    domain: "Skills",
    description: "Create a skill from SKILL.md. Agent-authored skills default to pending_review.",
    scopes: ["skills:manage"],
  },
  {
    name: "skills.patch",
    domain: "Skills",
    description: "Update SKILL.md or enable/disable. Cannot embed secrets.",
    scopes: ["skills:manage"],
  },
  {
    name: "skills.set_enabled",
    domain: "Skills",
    description: "Enable or disable a skill.",
    scopes: ["skills:manage"],
  },
  {
    name: "tasks.get",
    domain: "Skills",
    description: "Poll a long-running skill (or other) task by id.",
    scopes: ["read"],
  },
  {
    name: "list_addons",
    domain: "Add-ons",
    description: "Installed add-on manifests and enablement. No secrets.",
    scopes: ["read"],
  },
  {
    name: "get_llm_providers",
    domain: "LLM",
    description: "Provider status, default model, feature routing. Never returns tokens.",
    scopes: ["read"],
  },
  {
    name: "social.get_machine_status",
    domain: "Social",
    description: "Social Machine state (running / hibernated / stopped), Windows snapshot size, region, idle pause minutes. Never starts the VM. Never returns Daytona keys, proxy credentials, or VNC URLs.",
    scopes: ["read"],
  },
  {
    name: "social.start_machine",
    domain: "Social",
    description: "Start or create+start the Social Machine. Optional waitUntilReady. Never implied by other calls unless social.auto_start_for_upload is true.",
    scopes: ["write:social"],
  },
  {
    name: "social.stop_machine",
    domain: "Social",
    description: "Stop the Social Machine. Audited.",
    scopes: ["write:social"],
  },
  {
    name: "social.set_auto_stop",
    domain: "Social",
    description: "Update idle auto-stop minutes for the Social Machine.",
    scopes: ["write:social"],
  },
  {
    name: "social.ensure_computer_use",
    domain: "Social",
    description: "Start the computerUse stack if the machine is already running. Does not start a stopped VM.",
    scopes: ["write:social"],
  },
  {
    name: "social.get_desktop_preview",
    domain: "Social",
    description: "Operator-only preview availability. Hermes should use take_screenshot; the VNC URL is never returned to agents.",
    scopes: ["read"],
  },
  {
    name: "social.take_screenshot",
    domain: "Social",
    description: "Capture a screenshot of the Social Machine desktop for audit/playbook evidence.",
    scopes: ["write:social"],
  },
  {
    name: "social.list_open_windows",
    domain: "Social",
    description: "Best-effort window list from the running desktop. Empty when Computer Use is unavailable.",
    scopes: ["read"],
  },
  {
    name: "social.list_platforms",
    domain: "Social",
    description: "Instagram, X, TikTok, and YouTube session status (logged_in | needs_login | unknown). No passwords.",
    scopes: ["read"],
  },
  {
    name: "social.get_publisher_status",
    domain: "Social",
    description:
      "Per-platform native publisher status (configured, connected, eligible, username). tiktok includes auditStatus, postModeDefault, eligibleDirectPost, eligibleInbox, openId. instagram includes igUserId, accountType, eligibleReelsPublish. youtube includes channelId, channelTitle, eligible. Never returns tokens.",
    scopes: ["read"],
  },
  {
    name: "social.get_platform_status",
    domain: "Social",
    description: "Session status for one platform.",
    scopes: ["read"],
  },
  {
    name: "social.mark_platform_session",
    domain: "Social",
    description: "Mark a platform as logged_in or needs_login. Does not store passwords.",
    scopes: ["write:social"],
  },
  {
    name: "social.open_platform",
    domain: "Social",
    description: "Focus the VM browser on the platform home/upload URL. Machine must already be running.",
    scopes: ["write:social"],
  },
  {
    name: "social.check_session_health",
    domain: "Social",
    description: "Best-effort navigation check. Returns needs_login if a login wall is known or marked.",
    scopes: ["write:social"],
  },
  {
    name: "social.list_uploadable_assets",
    domain: "Social",
    description: "Published videos, shorts, and thumbnails eligible for distribution for a client.",
    scopes: ["read"],
  },
  {
    name: "social.resolve_asset",
    domain: "Social",
    description: "Validate an asset belongs to the client and is eligible to upload.",
    scopes: ["read"],
  },
  {
    name: "social.create_upload_job",
    domain: "Social",
    description:
      "Create an upload job. preferredRail AUTO uses native APIs when eligible, otherwise Computer Use (Daytona, or Grok Bot if prefer-as-computer is on / Daytona is missing). GROK_BOT sends the job to the Grok Bot computer and does not start Daytona. mode=publish waits for ApprovalRequest when approvals.requireForSocialPublish is on (default). mode=draft never requires publish approval. mediaAssetId resolves the library current version (prefers a 9:16 render for TikTok/IG; 16:9 for YouTube-only). TikTok uses Content Posting API (inbox drafts; Direct Post only if the app is audited). Instagram Reels Graph is professional accounts only — draft stays in Agency Admin and does not call media_publish. Platform x uses the X API when connected. Platform youtube uses Data API v3 resumable upload when connected — draft lands private, publish default is unlisted. Does not auto-start the VM unless social.auto_start_for_upload is true (Daytona browser rail only).",
    scopes: ["write:social"],
  },
  {
    name: "social.get_upload_job",
    domain: "Social",
    description:
      "Job status plus per-platform results, errors, screenshot refs, uploadPercent (0–100), uploadPhase (init|uploading|processing|publishing), and resumableSessionId. Never returns tokens or upload URLs.",
    scopes: ["read"],
  },
  {
    name: "social.list_upload_jobs",
    domain: "Social",
    description: "List upload jobs filtered by client, platform, status, or since.",
    scopes: ["read"],
  },
  {
    name: "social.retry_upload_job",
    domain: "Social",
    description: "Retry failed platforms only on an existing job.",
    scopes: ["write:social"],
  },
  {
    name: "social.cancel_upload_job",
    domain: "Social",
    description: "Cancel a job that is still queued or running.",
    scopes: ["write:social"],
  },
  {
    name: "social.list_posts",
    domain: "Social",
    description: "SocialPost records (client, platform, status, externalUrl).",
    scopes: ["read"],
  },
  {
    name: "social.get_post",
    domain: "Social",
    description: "One SocialPost record.",
    scopes: ["read"],
  },
  {
    name: "social.plan_distribution",
    domain: "Social",
    description: "Suggested platforms from session health and prior failures. Suggestion only — does not upload.",
    scopes: ["read"],
  },
  {
    name: "social.bulk_create_upload_jobs",
    domain: "Social",
    description: "Create several upload jobs with a hard batch and concurrency limit.",
    scopes: ["write:social"],
  },
  {
    name: "social.get_cost_guard",
    domain: "Social",
    description: "Running duration, auto-stop minutes, active jobs, and recommend_stop.",
    scopes: ["read"],
  },
  {
    name: "social.force_stop_if_running",
    domain: "Social",
    description: "Emergency stop the Social Machine if it is running.",
    scopes: ["write:social"],
  },
  {
    name: "library.search_assets",
    domain: "Library",
    description: "Search the unified asset library by client, kind, source, tag, or title. Returns ids and metadata, never storage keys.",
    scopes: ["read"],
  },
  {
    name: "library.get_asset",
    domain: "Library",
    description: "One library asset plus caption track summaries and preview URL.",
    scopes: ["read"],
  },
  {
    name: "library.ingest_url",
    domain: "Library",
    description: "Server-side fetch of an allowlisted HTTPS media URL into the library.",
    scopes: ["write:social"],
  },
  {
    name: "library.ingest_stream_clip",
    domain: "Library",
    description: "Register a Twitch StreamClip into the library (download when licensed, otherwise a link asset).",
    scopes: ["write:social"],
  },
  {
    name: "library.ingest_thumbnail",
    domain: "Library",
    description: "Register a generated thumbnail message image as a library asset (source THUMBNAIL_GEN).",
    scopes: ["write:social"],
  },
  {
    name: "library.queue_render",
    domain: "Library",
    description: "Queue an FFmpeg export (REELS_9x16, SQUARE_1x1, LANDSCAPE_16x9) with optional burned captions.",
    scopes: ["write:social"],
  },
  {
    name: "library.list_renders",
    domain: "Library",
    description: "Render job status, progress, and output asset ids.",
    scopes: ["read"],
  },
  {
    name: "library.attach_to_social_job",
    domain: "Library",
    description: "Create a social upload job from a library mediaAssetId. Prefer a 9:16 render for TikTok/IG when present.",
    scopes: ["write:social"],
  },
  {
    name: "library.get_pipeline_status",
    domain: "Library",
    description: "Transcription configured, FFmpeg health, default preset. Never returns keys.",
    scopes: ["read"],
  },
  {
    name: "stream.list_sources",
    domain: "Stream",
    description: "Connected stream sources (Twitch channels) per client.",
    scopes: ["read"],
  },
  {
    name: "stream.list_vods",
    domain: "Stream",
    description: "Archived VODs for a client (syncs from Twitch Helix first when configured).",
    scopes: ["read"],
  },
  {
    name: "stream.list_clips",
    domain: "Stream",
    description: "Planned/created clips for a VOD or client, with status and offsets.",
    scopes: ["read"],
  },
  {
    name: "stream.plan_clips",
    domain: "Stream",
    description: "Deterministic clip plan for a VOD: even offsets with start/end seconds a Computer Use session can execute.",
    scopes: ["read"],
  },
  {
    name: "stream.create_clip",
    domain: "Stream",
    description: "Create a PROCESSING clip record (VOD id + end offset + duration). Recording itself happens on the Social Machine via Computer Use; finished files land in the shared bucket machine-drops/ prefix.",
    scopes: ["write:social"],
  },
  {
    name: "stream.update_clip",
    domain: "Stream",
    description: "Patch a clip record after recording: status READY/FAILED, url, editUrl, thumbnailUrl, title, caption, notes.",
    scopes: ["write:social"],
  },
  {
    name: "bridge.status",
    domain: "Storage",
    description: "Storage-bridge status: S3 config present, Social Machine running, network-drive mount state. Never returns keys.",
    scopes: ["read"],
  },
  {
    name: "bridge.apply_mount",
    domain: "Storage",
    description: "Apply + verify the bucket-backed network drive on the running Social Machine (idempotent rclone mount). Requires the machine to be running; never starts it.",
    scopes: ["write:social"],
  },
  {
    name: "bridge.list_drops",
    domain: "Storage",
    description: "Files the Social Machine dropped into machine-drops/ in the shared bucket.",
    scopes: ["read"],
  },
  {
    name: "bridge.ingest_drop",
    domain: "Storage",
    description: "Ingest one dropped file into the Library (source AGENT, tag machine-drop). Use after Computer Use finishes recording a clip or thumbnail.",
    scopes: ["write:social"],
  },
  {
    name: "skill_manage.create",
    domain: "Skills",
    description: "Create a SKILL.md package. Agent-authored skills default to pending_review. Rejects secret-shaped strings.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.edit",
    domain: "Skills",
    description: "Replace SKILL.md and/or package files. Snapshots the previous version.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.patch",
    domain: "Skills",
    description: "Find-replace inside SKILL.md or a script file.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.write_file",
    domain: "Skills",
    description: "Add or overwrite scripts/*, references/*, templates/*, or SKILL.md.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.set_enabled",
    domain: "Skills",
    description: "Enable or disable a skill.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.set_provenance_review",
    domain: "Skills",
    description: "Approve or reject an agent-authored pending skill.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.list_versions",
    domain: "Skills",
    description: "List saved versions for rollback.",
    scopes: ["skills:manage"],
  },
  {
    name: "skill_manage.rollback",
    domain: "Skills",
    description: "Restore a previous skill version.",
    scopes: ["skills:manage"],
  },
  {
    name: "vision.analyze",
    domain: "Vision",
    description: "Describe an image (OCR, UI, thumbnail critique). Grok vision.",
    scopes: ["actions:ai"],
  },
  {
    name: "vision.compare",
    domain: "Vision",
    description: "Compare before/after frames or thumbnails.",
    scopes: ["actions:ai"],
  },
  {
    name: "computer.start",
    domain: "Computer Use",
    description: "Explicitly start the Social Machine. Never implied by login or other tools.",
    scopes: ["write:social"],
  },
  {
    name: "computer.stop",
    domain: "Computer Use",
    description: "Stop the Social Machine.",
    scopes: ["write:social"],
  },
  {
    name: "computer.screenshot",
    domain: "Computer Use",
    description: "Screenshot the running desktop. Never returns VNC passwords.",
    scopes: ["write:social"],
  },
  {
    name: "computer.mouse_click",
    domain: "Computer Use",
    description: "Click at x,y on the Social Machine desktop.",
    scopes: ["write:social"],
  },
  {
    name: "computer.mouse_move",
    domain: "Computer Use",
    description: "Move the pointer.",
    scopes: ["write:social"],
  },
  {
    name: "computer.mouse_drag",
    domain: "Computer Use",
    description: "Drag from one point to another.",
    scopes: ["write:social"],
  },
  {
    name: "computer.mouse_scroll",
    domain: "Computer Use",
    description: "Scroll at a point.",
    scopes: ["write:social"],
  },
  {
    name: "computer.keyboard_type",
    domain: "Computer Use",
    description: "Type text. Never type passwords.",
    scopes: ["write:social"],
  },
  {
    name: "computer.keyboard_key",
    domain: "Computer Use",
    description: "Press a key or hotkey.",
    scopes: ["write:social"],
  },
  {
    name: "computer.accessibility_find",
    domain: "Computer Use",
    description: "Find a11y nodes by role/name when the desktop supports it.",
    scopes: ["write:social"],
  },
  {
    name: "computer.list_windows",
    domain: "Computer Use",
    description: "List open windows.",
    scopes: ["read"],
  },
  {
    name: "browser.open_url",
    domain: "Browser Use",
    description: "Open an https URL in the Social Machine browser.",
    scopes: ["write:social"],
  },
  {
    name: "browser.wait_for_text",
    domain: "Browser Use",
    description: "Poll screenshot + vision until text appears or timeout.",
    scopes: ["write:social"],
  },
  {
    name: "browser.upload_file",
    domain: "Browser Use",
    description: "Transfer media into the sandbox and open the platform upload UI.",
    scopes: ["write:social"],
  },
  {
    name: "browser.get_page_summary",
    domain: "Browser Use",
    description: "Screenshot + vision summary of the current page.",
    scopes: ["write:social"],
  },
  {
    name: "browser.open_instagram_upload",
    domain: "Browser Use",
    description: "Open Instagram upload in the VM browser.",
    scopes: ["write:social"],
  },
  {
    name: "browser.open_x_compose",
    domain: "Browser Use",
    description: "Open X compose in the VM browser.",
    scopes: ["write:social"],
  },
  {
    name: "browser.open_tiktok_upload",
    domain: "Browser Use",
    description: "Open TikTok upload in the VM browser.",
    scopes: ["write:social"],
  },
  {
    name: "clipping.research_channel",
    domain: "Clipping Agent",
    description: "Client profile + latest long-form videos (≥ 4 minutes).",
    scopes: ["read"],
  },
  {
    name: "clipping.generate_ideas",
    domain: "Clipping Agent",
    description: "Generate and persist long-form ideas for a client.",
    scopes: ["actions:ai"],
  },
  {
    name: "clipping.generate_titles",
    domain: "Clipping Agent",
    description: "Generate and persist title alternatives for latest long-form uploads.",
    scopes: ["actions:ai"],
  },
  {
    name: "clipping.generate_thumbnail",
    domain: "Clipping Agent",
    description: "Higgsfield 16:9 4K thumbnail. Registers a THUMBNAIL_GEN library asset when ingest succeeds.",
    scopes: ["actions:ai"],
  },
  {
    name: "clipping.set_stage",
    domain: "Clipping Agent",
    description: "Append a production stage with notes.",
    scopes: ["write:progress"],
  },
  {
    name: "clipping.mark_published",
    domain: "Clipping Agent",
    description: "Set stage to PUBLISHED.",
    scopes: ["write:progress"],
  },
  {
    name: "clipping.distribute_social",
    domain: "Clipping Agent",
    description: "Queue draft social upload jobs. Pass mediaAssetId to publish from the library (prefers 9:16 for TikTok/IG). Does not auto-start the VM unless policy allows.",
    scopes: ["write:social"],
  },
  {
    name: "clipping.run_skill",
    domain: "Clipping Agent",
    description: "Invoke an approved skill in a sandbox.",
    scopes: ["skills:execute"],
  },
  {
    name: "clipping.observe_desktop",
    domain: "Clipping Agent",
    description: "Screenshot + vision of the Social Machine.",
    scopes: ["write:social"],
  },
  {
    name: "clipping.get_progress",
    domain: "Clipping Agent",
    description: "ClientProgress including AI_DISCORD-sourced stages.",
    scopes: ["read"],
  },
  {
    name: "clipping.guarantee_check",
    domain: "Clipping Agent",
    description: "30-day views check from AnalyticsSnapshots. Never invents data.",
    scopes: ["read"],
  },
  {
    name: "clipping.propose_skill",
    domain: "Clipping Agent",
    description: "Draft a pending_review skill from a successful Agent run.",
    scopes: ["skills:execute"],
  },
  {
    name: "approvals.list_pending",
    domain: "Approvals",
    description: "List pending ApprovalRequest rows. Does not bypass publish policy.",
    scopes: ["read"],
  },
  {
    name: "approvals.decide",
    domain: "Approvals",
    description:
      "Approve, reject, or cancel a pending request. Cannot skip the approvals policy. approvals:admin may decide; write:social is not enough to self-bypass.",
    scopes: ["approvals:admin"],
  },
  {
    name: "analytics.refresh_post_performance",
    domain: "Analytics",
    description:
      "Pull official metrics for a published SocialPost (by id) or sweep due snapshots. Never invents zeros. Falls back to telling the operator to enter stats manually.",
    scopes: ["read"],
  },
  {
    name: "analytics.list_winners",
    domain: "Analytics",
    description: "List winning posts (scored vs client+platform peers). Unknown metrics stay unknown.",
    scopes: ["read"],
  },
  {
    name: "knowledge.list_proposals",
    domain: "Knowledge",
    description: "List KnowledgeProposal rows from winning posts. Pending until a human approves.",
    scopes: ["read"],
  },
  {
    name: "knowledge.decide_proposal",
    domain: "Knowledge",
    description:
      "Approve (merge into KnowledgeEntry) or reject a pending proposal. Default policy never auto-merges.",
    scopes: ["approvals:admin"],
  },
  {
    name: "linear.get_status",
    domain: "Linear",
    description:
      "Linear connector status: configured, enabled, team, project, Kanban state map. Never returns tokens.",
    scopes: ["read"],
  },
  {
    name: "linear.create_issue",
    domain: "Linear",
    description:
      "Create a Linear issue in the bound team/project. Optional linkTo { type, id } stores the Agency↔Linear link. No-ops with an audit note when LINEAR_ENABLED is false. Rate-limited.",
    scopes: ["linear:write"],
  },
  {
    name: "linear.update_issue",
    domain: "Linear",
    description:
      "Update a linked Linear issue (state, labels, comment). Skips issues labeled manual-board.",
    scopes: ["linear:write"],
  },
  {
    name: "linear.find_issues",
    domain: "Linear",
    description: "Text search within the bound Linear team/project. Rate-limited. No tokens.",
    scopes: ["read"],
  },
  {
    name: "grokbot.heartbeat",
    domain: "Grok Bot",
    description:
      "Grok Bot pings ClippyOS. Marks the premium computer online. Call on a short cadence while working.",
    scopes: ["read"],
  },
  {
    name: "grokbot.get_status",
    domain: "Grok Bot",
    description: "Connection, queue counts, last heartbeat. No secrets.",
    scopes: ["read"],
  },
  {
    name: "grokbot.get_brief",
    domain: "Grok Bot",
    description: "Operator brief for the ClippyOS Bot. How to use MCP tools and the cloud computer.",
    scopes: ["read"],
  },
  {
    name: "grokbot.list_work",
    domain: "Grok Bot",
    description: "Queued and claimed jobs for the Grok Bot computer (uploads, agent runs, logins).",
    scopes: ["read"],
  },
  {
    name: "grokbot.claim_work",
    domain: "Grok Bot",
    description: "Claim the next queued job, or a specific id. Do the work on YOUR computer, then complete_work.",
    scopes: ["write:social"],
  },
  {
    name: "grokbot.complete_work",
    domain: "Grok Bot",
    description:
      "Mark claimed work succeeded or failed. For social_upload include posts: [{ platform, status, externalUrl }]. needs_login is a valid failure.",
    scopes: ["write:social"],
  },
  {
    name: "agent.get_run",
    domain: "Agent",
    description: "Agent run status, provider, summary, waiting reason. No secret injection.",
    scopes: ["read"],
  },
  {
    name: "agent.start_run",
    domain: "Agent",
    description: "Start an agent run. Subject to concurrency. provider HERMES | GROK_BOT | AUTO.",
    scopes: ["actions:ai"],
  },
  {
    name: "health.get_summary",
    domain: "Health",
    description: "SLOs, cost guards, integration tones, Hermes last login. No secrets.",
    scopes: ["read"],
  },
  {
    name: "health.list_jobs",
    domain: "Health",
    description: "Unified job feed (render, upload, agent, metrics, Linear). Sanitized errors only.",
    scopes: ["read"],
  },
  {
    name: "health.retry_job",
    domain: "Health",
    description: "Retry a failed job. Idempotent. Never auto-starts the Social Machine. Admin-scoped.",
    scopes: ["write:social"],
  },
] as const;

export const MCP_RESOURCES = [
  { uri: "agency://dashboard", name: "Dashboard snapshot", description: "Live MRR, pipeline, at-risk counts, recent activity." },
  { uri: "agency://pipeline", name: "Production pipeline", description: "Counts of active clients by stage." },
  { uri: "agency://clients/{id}", name: "Client record", description: "One client with latest progress and analytics." },
  { uri: "agency://playbooks", name: "Hermes Playbook", description: "Official autonomous workflows Hermes should run." },
  { uri: "agency://social/machine", name: "Social Machine", description: "Live Social Machine status without secrets or VNC URLs." },
  { uri: "agency://social/platforms", name: "Social platforms", description: "Instagram, X, TikTok session health." },
  { uri: "agency://social/publishers", name: "Social publishers", description: "Native API connector status. No tokens." },
  { uri: "agency://social/jobs/{id}", name: "Social upload job", description: "One upload job with per-platform results." },
  { uri: "agency://social/posts", name: "Social posts", description: "Recent SocialPost activity records." },
  { uri: "agency://automation/connect", name: "Hermes Connect", description: "Connect checklist status, policies, and webhook subscriptions. No secrets." },
  { uri: "agency://automation/playbook-package", name: "Playbook package", description: "Copy-ready Hermes Playbook package with placeholders." },
  { uri: "agency://addons", name: "Add-ons", description: "Enabled add-on manifests and permissions." },
  { uri: "agency://skills", name: "Skills", description: "Approved skills catalog." },
  { uri: "agency://skills/{id}", name: "Skill package", description: "One SKILL.md plus script names." },
  { uri: "agency://llm/providers", name: "LLM providers", description: "Connected providers and models. No secrets." },
  { uri: "agency://llm/models", name: "LLM models", description: "grok-4.6 and catalog ids." },
  { uri: "agency://agent/runs", name: "Clipping Agent runs", description: "Recent in-app agent iterations." },
  { uri: "agency://library/assets", name: "Asset library", description: "READY media assets with preview URLs. No storage keys." },
  { uri: "agency://analytics/performance", name: "Published performance", description: "PostPerformance snapshots and asset rollups. Missing metrics are omitted, never zero." },
  { uri: "agency://knowledge/proposals", name: "Knowledge proposals", description: "Pending learning proposals from winning posts." },
  { uri: "agency://linear/status", name: "Linear", description: "Linear team, project, and Kanban map. No tokens." },
  { uri: "agency://grok-bot", name: "Grok Bot", description: "Premium computer rail status and work queue. No secrets." },
  { uri: "agency://health", name: "Health", description: "Job orchestration snapshot: queues, SLOs, integrations. No secrets." },
] as const;

export type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  last4: string;
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type AuditRow = {
  id: string;
  requestId: string;
  source: "api" | "mcp" | "webhook";
  actorKeyId: string | null;
  actorLabel: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  playbookId: string | null;
  runId: string | null;
  result: "ok" | "error" | "denied";
  errorCode: string | null;
  createdAt: string;
};

export type HermesConnectionState = "not_connected" | "key_only" | "fully_connected";

export type AutonomySnapshot = {
  keys: ApiKeyRow[];
  mcpConfigured: boolean;
  mcpLast4: string | null;
  mcpLastUsedAt: string | null;
  webhookConfigured: boolean;
  webhookLast4: string | null;
  outboundUrl: string | null;
  outboundEvents: WebhookEventType[];
  lastDelivery: {
    at: string | null;
    status: string | null;
    eventType: string | null;
  };
  lastDeliveryByEvent: Partial<Record<WebhookEventType, { at: string; status: string }>>;
  connect: {
    pastedIntoHermes: boolean;
    pastedAt: string | null;
    socialPolicyAckedAt: string | null;
    outboundSkipped: boolean;
    hermesConnection: HermesConnectionState;
    playbookPackageVersion: string;
  };
  paths: {
    apiBase: string;
    mcp: string;
    inboundWebhook: string;
  };
  automationEnabled: boolean;
  policies: PlaybookPolicies;
  lastActivityAt: string | null;
};

export type AutonomyHealth = {
  automationEnabled: boolean;
  mcpConfigured: boolean;
  webhookConfigured: boolean;
  activeKeys: number;
  lastActivityAt: string | null;
  lastAction: {
    action: string;
    source: string;
    playbookId: string | null;
    result: string;
    at: string;
    actorLabel: string | null;
  } | null;
  hermesConnection: HermesConnectionState;
  grokBot: {
    connection: import("@/lib/grok-bot").GrokBotConnectionState;
    queued: number;
    claimed: number;
  } | null;
  social: {
    state: string;
    configured: boolean;
    needsLogin: number;
    failedJobs: number;
    needsAttention: number;
  } | null;
};

export function isApiKeyScope(value: string): value is ApiKeyScope {
  return (API_KEY_SCOPES as readonly string[]).includes(value);
}

export function parseScopes(raw: unknown): ApiKeyScope[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is ApiKeyScope => typeof item === "string" && isApiKeyScope(item));
  }
  if (typeof raw === "string") {
    try {
      return parseScopes(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

export function hasScope(scopes: readonly ApiKeyScope[], needed: ApiKeyScope): boolean {
  return scopes.includes(needed);
}
