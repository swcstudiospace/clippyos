import { hasScope, MCP_RESOURCES, MCP_TOOLS } from "@/lib/autonomy";
import { writeAuditLog } from "@/lib/server/autonomy-audit.server";
import { addonIdForTool } from "@/lib/addons";
import { runAutonomyAction } from "@/lib/server/autonomy-actions.server";
import type { AutonomyActor } from "@/lib/server/autonomy-auth.server";
import {
  REMOTE_MCP_INSTRUCTIONS,
  REMOTE_MCP_TOOLS,
  mapRemoteToolCall,
  remoteToolAllowed,
  shapeRemoteMcpResult,
} from "@/lib/remote-mcp";

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const TOOL_INPUTS: Record<string, Record<string, unknown>> = {
  list_clients: {
    type: "object",
    properties: {
      search: { type: "string" },
      status: { type: "string", enum: ["ACTIVE", "CHURNED"] },
    },
  },
  get_client: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  create_client: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      channelUrl: { type: "string" },
      planType: { type: "string" },
      notes: { type: "string" },
    },
  },
  update_client: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      notes: { type: "string" },
      status: { type: "string", enum: ["ACTIVE", "CHURNED"] },
    },
  },
  list_payments: {
    type: "object",
    properties: { clientId: { type: "string" } },
  },
  mark_payment_paid: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  get_client_progress: {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  set_client_stage: {
    type: "object",
    required: ["clientId", "stage"],
    properties: {
      clientId: { type: "string" },
      stage: { type: "string" },
      notes: { type: "string" },
    },
  },
  list_leads: { type: "object", properties: {} },
  create_lead: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      status: { type: "string" },
      upfrontCash: { type: "number" },
      monthlyRecurring: { type: "number" },
    },
  },
  update_lead_status: {
    type: "object",
    required: ["id", "status"],
    properties: { id: { type: "string" }, status: { type: "string" } },
  },
  pull_client_analytics: {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  get_analytics_snapshot: {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  get_dashboard_snapshot: { type: "object", properties: {} },
  list_at_risk_clients: { type: "object", properties: {} },
  regenerate_suggested_titles: {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  regenerate_suggested_ideas: {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  get_integration_status: { type: "object", properties: {} },
  get_connect_status: { type: "object", properties: {} },
  get_playbook_package: {
    type: "object",
    properties: { origin: { type: "string" } },
  },
  "social.get_machine_status": { type: "object", properties: {} },
  "social.start_machine": {
    type: "object",
    properties: { waitUntilReady: { type: "boolean" } },
  },
  "social.stop_machine": { type: "object", properties: {} },
  "social.set_auto_stop": {
    type: "object",
    required: ["minutes"],
    properties: { minutes: { type: "number" } },
  },
  "social.ensure_computer_use": { type: "object", properties: {} },
  "social.get_desktop_preview": { type: "object", properties: {} },
  "social.take_screenshot": { type: "object", properties: {} },
  "social.list_open_windows": { type: "object", properties: {} },
  "social.list_platforms": { type: "object", properties: {} },
  "social.get_publisher_status": { type: "object", properties: {} },
  "social.get_platform_status": {
    type: "object",
    required: ["platform"],
    properties: { platform: { type: "string", enum: ["instagram", "x", "tiktok", "youtube"] } },
  },
  "social.mark_platform_session": {
    type: "object",
    required: ["platform", "state"],
    properties: {
      platform: { type: "string", enum: ["instagram", "x", "tiktok", "youtube"] },
      state: { type: "string", enum: ["logged_in", "needs_login", "not_logged_in", "unknown"] },
    },
  },
  "social.open_platform": {
    type: "object",
    required: ["platform"],
    properties: { platform: { type: "string", enum: ["instagram", "x", "tiktok", "youtube"] } },
  },
  "social.check_session_health": {
    type: "object",
    properties: { platform: { type: "string", enum: ["instagram", "x", "tiktok", "youtube"] } },
  },
  "social.list_uploadable_assets": {
    type: "object",
    properties: { clientId: { type: "string" } },
  },
  "social.resolve_asset": {
    type: "object",
    required: ["clientId", "assetId"],
    properties: { clientId: { type: "string" }, assetId: { type: "string" } },
  },
  "social.create_upload_job": {
    type: "object",
    required: ["clientId", "platforms"],
    properties: {
      clientId: { type: "string" },
      assetId: { type: "string" },
      mediaAssetId: { type: "string" },
      platforms: { type: "array", items: { type: "string" } },
      caption: { type: "string" },
      mode: { type: "string", enum: ["draft", "publish"] },
      preferredRail: { type: "string", enum: ["AUTO", "API", "BROWSER", "GROK_BOT"] },
      fallbackToBrowser: { type: "boolean" },
      idempotencyKey: { type: "string" },
      title: { type: "string", description: "YouTube title (also used as caption first line)" },
      description: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      privacyStatus: { type: "string", enum: ["private", "unlisted", "public"] },
      markShorts: { type: "boolean" },
      ytTitle: { type: "string" },
      ytDescription: { type: "string" },
      ytTags: { type: "array", items: { type: "string" } },
      ytPrivacy: { type: "string", enum: ["private", "unlisted", "public"] },
      ytMarkShorts: { type: "boolean" },
    },
  },
  "social.get_upload_job": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "social.list_upload_jobs": {
    type: "object",
    properties: {
      clientId: { type: "string" },
      platform: { type: "string" },
      status: { type: "string" },
      since: { type: "string" },
    },
  },
  "social.retry_upload_job": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "social.cancel_upload_job": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "social.list_posts": {
    type: "object",
    properties: {
      clientId: { type: "string" },
      platform: { type: "string" },
      status: { type: "string" },
    },
  },
  "social.get_post": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "social.plan_distribution": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" }, assetId: { type: "string" } },
  },
  "social.bulk_create_upload_jobs": {
    type: "object",
    required: ["jobs"],
    properties: {
      jobs: { type: "array", items: { type: "object" } },
    },
  },
  "social.get_cost_guard": { type: "object", properties: {} },
  "social.force_stop_if_running": { type: "object", properties: {} },
  "approvals.list_pending": { type: "object", properties: {} },
  "approvals.decide": {
    type: "object",
    required: ["id", "decision"],
    properties: {
      id: { type: "string" },
      decision: { type: "string", enum: ["APPROVED", "REJECTED", "CANCELED"] },
      note: { type: "string" },
    },
  },
  "analytics.refresh_post_performance": {
    type: "object",
    properties: {
      socialPostId: { type: "string" },
      sweep: { type: "boolean" },
    },
  },
  "analytics.list_winners": {
    type: "object",
    properties: {
      clientId: { type: "string" },
      platform: { type: "string", enum: ["X", "TIKTOK", "INSTAGRAM", "YOUTUBE", "OTHER"] },
    },
  },
  "knowledge.list_proposals": {
    type: "object",
    properties: {
      status: { type: "string", enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "MERGED"] },
      clientId: { type: "string" },
    },
  },
  "knowledge.decide_proposal": {
    type: "object",
    required: ["id", "decision"],
    properties: {
      id: { type: "string" },
      decision: { type: "string", enum: ["APPROVED", "REJECTED"] },
      note: { type: "string" },
    },
  },
  "linear.get_status": { type: "object", properties: {} },
  "linear.create_issue": {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      state: { type: "string", enum: ["backlog", "ready", "inProgress", "inReview", "done"] },
      labels: { type: "array", items: { type: "string" } },
      priority: { type: "number" },
      projectId: { type: "string" },
      linkTo: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["AgentRun", "RenderJob", "SocialUploadJob", "KnowledgeProposal", "ApprovalRequest", "Milestone"],
          },
          id: { type: "string" },
        },
      },
    },
  },
  "linear.update_issue": {
    type: "object",
    properties: {
      issueId: { type: "string" },
      state: { type: "string" },
      labels: { type: "array", items: { type: "string" } },
      comment: { type: "string" },
      linkTo: { type: "object", properties: { type: { type: "string" }, id: { type: "string" } } },
    },
  },
  "linear.find_issues": {
    type: "object",
    properties: { term: { type: "string" }, text: { type: "string" } },
  },
  "grokbot.heartbeat": {
    type: "object",
    properties: { note: { type: "string" } },
  },
  "grokbot.get_status": { type: "object", properties: {} },
  "grokbot.get_brief": { type: "object", properties: {} },
  "grokbot.list_work": {
    type: "object",
    properties: { status: { type: "string", enum: ["queued", "claimed", "succeeded", "failed", "cancelled"] } },
  },
  "grokbot.claim_work": {
    type: "object",
    properties: { id: { type: "string" } },
  },
  "grokbot.complete_work": {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      ok: { type: "boolean" },
      error: { type: "string" },
      result: { type: "object" },
    },
  },
  "skills.list": { type: "object", properties: {} },
  "skills.get": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "skills.invoke": {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      args: { type: "object" },
    },
  },
  "skills.create": {
    type: "object",
    required: ["skillMd"],
    properties: {
      skillMd: { type: "string" },
      scripts: { type: "object" },
      provenance: { type: "string", enum: ["human", "agent"] },
    },
  },
  "skills.patch": {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
      skillMd: { type: "string" },
      enabled: { type: "boolean" },
    },
  },
  "skills.set_enabled": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" }, enabled: { type: "boolean" } },
  },
  "skill_manage.create": {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      skill_md: { type: "string" },
      scripts: { type: "array", items: { type: "object" } },
      tags: { type: "array", items: { type: "string" } },
      provenance: { type: "string" },
    },
  },
  "skill_manage.edit": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" }, skill_md: { type: "string" }, scripts: { type: "object" } },
  },
  "skill_manage.patch": {
    type: "object",
    required: ["id", "find"],
    properties: {
      id: { type: "string" },
      path: { type: "string" },
      find: { type: "string" },
      replace: { type: "string" },
    },
  },
  "skill_manage.write_file": {
    type: "object",
    required: ["id", "path", "content"],
    properties: { id: { type: "string" }, path: { type: "string" }, content: { type: "string" } },
  },
  "skill_manage.set_enabled": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" }, enabled: { type: "boolean" } },
  },
  "skill_manage.set_provenance_review": {
    type: "object",
    required: ["id", "decision"],
    properties: { id: { type: "string" }, decision: { type: "string", enum: ["approve", "reject"] } },
  },
  "skill_manage.list_versions": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "skill_manage.rollback": {
    type: "object",
    required: ["id", "version"],
    properties: { id: { type: "string" }, version: { type: "string" } },
  },
  "vision.analyze": {
    type: "object",
    properties: { imageUrl: { type: "string" }, prompt: { type: "string" } },
  },
  "vision.compare": {
    type: "object",
    properties: { beforeUrl: { type: "string" }, afterUrl: { type: "string" }, prompt: { type: "string" } },
  },
  "computer.start": { type: "object", properties: {} },
  "computer.stop": { type: "object", properties: {} },
  "computer.screenshot": { type: "object", properties: {} },
  "computer.mouse_click": {
    type: "object",
    required: ["x", "y"],
    properties: { x: { type: "number" }, y: { type: "number" }, button: { type: "string" } },
  },
  "computer.mouse_move": {
    type: "object",
    required: ["x", "y"],
    properties: { x: { type: "number" }, y: { type: "number" } },
  },
  "computer.mouse_drag": { type: "object", properties: { from: { type: "object" }, to: { type: "object" } } },
  "computer.mouse_scroll": { type: "object", properties: { x: { type: "number" }, y: { type: "number" }, dy: { type: "number" } } },
  "computer.keyboard_type": {
    type: "object",
    required: ["text"],
    properties: { text: { type: "string" } },
  },
  "computer.keyboard_key": { type: "object", properties: { key: { type: "string" }, keys: { type: "array" } } },
  "computer.accessibility_find": { type: "object", properties: { role: { type: "string" }, name: { type: "string" } } },
  "computer.list_windows": { type: "object", properties: {} },
  "browser.open_url": {
    type: "object",
    required: ["url"],
    properties: { url: { type: "string" } },
  },
  "browser.wait_for_text": {
    type: "object",
    required: ["text"],
    properties: { text: { type: "string" }, timeoutMs: { type: "number" } },
  },
  "browser.upload_file": {
    type: "object",
    properties: { platform: { type: "string" }, mediaUrl: { type: "string" }, caption: { type: "string" } },
  },
  "browser.get_page_summary": { type: "object", properties: {} },
  "browser.open_instagram_upload": { type: "object", properties: {} },
  "browser.open_x_compose": { type: "object", properties: {} },
  "browser.open_tiktok_upload": { type: "object", properties: {} },
  "clipping.research_channel": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  "clipping.generate_ideas": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  "clipping.generate_titles": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  "clipping.generate_thumbnail": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" }, prompt: { type: "string" } },
  },
  "clipping.set_stage": {
    type: "object",
    required: ["clientId", "stage"],
    properties: { clientId: { type: "string" }, stage: { type: "string" }, notes: { type: "string" } },
  },
  "clipping.mark_published": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" }, notes: { type: "string" } },
  },
  "clipping.distribute_social": {
    type: "object",
    required: ["clientId"],
    properties: {
      clientId: { type: "string" },
      platforms: { type: "array", items: { type: "string" } },
      caption: { type: "string" },
      mediaAssetId: { type: "string" },
    },
  },
  "library.search_assets": {
    type: "object",
    properties: {
      clientId: { type: "string" },
      kind: { type: "string" },
      source: { type: "string" },
      status: { type: "string" },
      search: { type: "string" },
      tag: { type: "string" },
    },
  },
  "library.get_asset": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "library.ingest_url": {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string" },
      clientId: { type: "string" },
      title: { type: "string" },
    },
  },
  "library.ingest_stream_clip": {
    type: "object",
    required: ["clipId"],
    properties: { clipId: { type: "string" } },
  },
  "library.ingest_thumbnail": {
    type: "object",
    required: ["messageId"],
    properties: { messageId: { type: "string" } },
  },
  "library.queue_render": {
    type: "object",
    required: ["assetId"],
    properties: {
      assetId: { type: "string" },
      preset: { type: "string", enum: ["REELS_9x16", "SQUARE_1x1", "LANDSCAPE_16x9", "CUSTOM"] },
      burnInCaptions: { type: "boolean" },
      captionTrackId: { type: "string" },
    },
  },
  "library.list_renders": {
    type: "object",
    properties: { assetId: { type: "string" } },
  },
  "library.attach_to_social_job": {
    type: "object",
    required: ["clientId", "mediaAssetId"],
    properties: {
      clientId: { type: "string" },
      mediaAssetId: { type: "string" },
      platforms: { type: "array", items: { type: "string" } },
      caption: { type: "string" },
      mode: { type: "string", enum: ["draft", "publish"] },
    },
  },
  "library.get_pipeline_status": { type: "object", properties: {} },
  "stream.list_sources": {
    type: "object",
    properties: { clientId: { type: "string" } },
  },
  "stream.list_vods": {
    type: "object",
    required: ["clientId"],
    properties: {
      clientId: { type: "string" },
      twitchLogin: { type: "string", description: "Channel login when the client has no stored source yet" },
    },
  },
  "stream.list_clips": {
    type: "object",
    properties: { clientId: { type: "string" }, vodId: { type: "string" } },
  },
  "stream.plan_clips": {
    type: "object",
    required: ["vodId"],
    properties: {
      vodId: { type: "string" },
      clipCount: { type: "number", description: "1–15, default 5" },
      durationSec: { type: "number", description: "5–60, default 30" },
    },
  },
  "stream.create_clip": {
    type: "object",
    required: ["vodId", "vodOffsetSec"],
    properties: {
      vodId: { type: "string" },
      vodOffsetSec: { type: "number", description: "END of the clip within the VOD; must be >= durationSec" },
      durationSec: { type: "number", description: "5–60, default 30" },
      title: { type: "string" },
    },
  },
  "stream.update_clip": {
    type: "object",
    required: ["clipId"],
    properties: {
      clipId: { type: "string" },
      status: { type: "string", enum: ["PROCESSING", "READY", "FAILED"] },
      url: { type: "string" },
      editUrl: { type: "string" },
      thumbnailUrl: { type: "string" },
      title: { type: "string" },
      caption: { type: "string" },
      notes: { type: "string" },
      error: { type: "string" },
    },
  },
  "bridge.status": { type: "object", properties: {} },
  "bridge.apply_mount": { type: "object", properties: {} },
  "bridge.list_drops": { type: "object", properties: {} },
  "bridge.ingest_drop": {
    type: "object",
    required: ["dropName"],
    properties: {
      dropName: { type: "string", description: "File name inside machine-drops/ (no path separators)" },
      clientId: { type: "string" },
      title: { type: "string" },
    },
  },
  "clipping.run_skill": {
    type: "object",
    required: ["skillId"],
    properties: { skillId: { type: "string" }, arguments: { type: "object" } },
  },
  "clipping.observe_desktop": { type: "object", properties: {} },
  "clipping.get_progress": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  "clipping.guarantee_check": {
    type: "object",
    required: ["clientId"],
    properties: { clientId: { type: "string" } },
  },
  "clipping.propose_skill": {
    type: "object",
    properties: { agentRunId: { type: "string" } },
  },
  "clipping.check_crayo_login": { type: "object", properties: {} },
  "clipping.run_browser_procedure": {
    type: "object",
    required: ["skillSlug"],
    properties: { skillSlug: { type: "string" } },
  },
  "tasks.get": {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  "agent.get_run": {
    type: "object",
    required: ["runId"],
    properties: { runId: { type: "string" } },
  },
  "agent.start_run": {
    type: "object",
    required: ["goal"],
    properties: {
      goal: { type: "string" },
      clientId: { type: "string" },
      presetSkillId: { type: "string" },
      provider: { type: "string", enum: ["HERMES", "GROK_BOT", "AUTO"] },
      idempotencyKey: { type: "string" },
    },
  },
  "health.get_summary": { type: "object", properties: {} },
  "health.list_jobs": {
    type: "object",
    properties: {
      type: { type: "string" },
      status: { type: "string" },
      limit: { type: "number" },
    },
  },
  "health.retry_job": {
    type: "object",
    required: ["id", "type"],
    properties: {
      id: { type: "string" },
      type: {
        type: "string",
        enum: ["RENDER", "SOCIAL_UPLOAD", "AGENT", "PERFORMANCE_FETCH", "LINEAR_SYNC"],
      },
    },
  },
  list_addons: { type: "object", properties: {} },
  get_llm_providers: { type: "object", properties: {} },
};

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: string | number | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export async function handleMcpRpc(
  body: JsonRpc,
  actor: AutonomyActor,
  requestId: string,
): Promise<unknown> {
  const method = body.method ?? "";
  const id = body.id;
  const params = body.params ?? {};

  if (method === "initialize") {
    const remote = actor.catalog === "remote";
    return rpcResult(id, {
      protocolVersion: "2025-03-26",
      capabilities: {
        tools: { listChanged: true },
        resources: remote ? {} : { listChanged: true },
        skills: remote ? {} : { listChanged: true },
        tasks: remote ? {} : {},
      },
      serverInfo: { name: "clippy-os", version: "1.0.0" },
      instructions: remote
        ? REMOTE_MCP_INSTRUCTIONS
        : "ClippyOS MCP. Hermes Agent and Grok Bot are both valid clients. Hermes drives the in-OS Daytona Social Machine. Grok Bot uses its own cloud computer — call grokbot.heartbeat, grokbot.list_work, grokbot.claim_work, grokbot.complete_work. Use skills/list, skills/get, skills/invoke, skill_manage.* (if scoped), vision.*, computer.*, browser.*, clipping.*, and tasks/get. Python skills run in an isolated Daytona sandbox (never the Social Machine). Never request integration secrets or Super Admin credentials. Never auto-start the Social Machine on login. Grok Bot jobs must not start Daytona.",
    });
  }
  if (method === "notifications/initialized" || method === "initialized") {
    return rpcResult(id, {});
  }
  if (method === "ping") return rpcResult(id, {});
  if (method === "tools/list") {
    const tools = await listVisibleTools(actor);
    return rpcResult(id, tools);
  }
  if (actor.catalog === "remote" && (method.startsWith("skills/") || method.startsWith("resources/") || method === "tasks/get")) {
    return rpcError(id, -32601, "Method not found.");
  }
  if (method === "skills/list") {
    const result = await runAutonomyAction({
      actor,
      action: "skills.list",
      payload: params,
      requestId,
    });
    if (!result.ok) return rpcError(id, -32000, result.message);
    return rpcResult(id, result.data);
  }
  if (method === "skills/get") {
    const result = await runAutonomyAction({
      actor,
      action: "skills.get",
      payload: { id: params.id ?? params.skillId },
      requestId,
    });
    if (!result.ok) return rpcError(id, -32000, result.message);
    return rpcResult(id, result.data);
  }
  if (method === "skills/invoke") {
    const result = await runAutonomyAction({
      actor,
      action: "skills.invoke",
      payload: {
        id: params.id ?? params.skillId,
        args: params.arguments ?? params.args,
      },
      requestId,
      playbookId: typeof params.playbook === "string" ? params.playbook : null,
      runId: typeof params.runId === "string" ? params.runId : null,
    });
    if (!result.ok) return rpcError(id, -32000, result.message);
    return rpcResult(id, result.data);
  }
  if (method === "tasks/get") {
    const result = await runAutonomyAction({
      actor,
      action: "tasks.get",
      payload: { id: params.id ?? params.taskId },
      requestId,
    });
    if (!result.ok) return rpcError(id, -32000, result.message);
    return rpcResult(id, result.data);
  }
  if (method === "resources/list") {
    return rpcResult(id, {
      resources: MCP_RESOURCES.map((row) => ({
        uri: row.uri,
        name: row.name,
        description: row.description,
        mimeType: "application/json",
      })),
    });
  }
  if (method === "resources/read") {
    const uri = String(params.uri ?? "");
    if (uri === "agency://playbooks") {
      const result = await runAutonomyAction({
        actor,
        action: "get_playbook_catalog",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result.data) }],
      });
    }
    if (uri === "agency://automation/connect") {
      const result = await runAutonomyAction({
        actor,
        action: "get_connect_status",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result.data) }],
      });
    }
    if (uri === "agency://automation/playbook-package") {
      const result = await runAutonomyAction({
        actor,
        action: "get_playbook_package",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "text/markdown", text: JSON.stringify(result.data) }],
      });
    }
    if (uri === "agency://addons") {
      const result = await runAutonomyAction({
        actor,
        action: "list_addons",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result.data) }],
      });
    }
    if (uri === "agency://skills") {
      const result = await runAutonomyAction({
        actor,
        action: "skills.list",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result.data) }],
      });
    }
    if (uri === "agency://llm/providers" || uri === "agency://llm/models") {
      const result = await runAutonomyAction({
        actor,
        action: "get_llm_providers",
        payload: {},
        requestId,
      });
      if (!result.ok) return rpcError(id, -32000, result.message);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result.data) }],
      });
    }
    const mapped = mapResource(uri);
    if (!mapped) return rpcError(id, -32002, "Unknown resource.");
    const result = await runAutonomyAction({
      actor,
      action: mapped.action,
      payload: mapped.payload,
      requestId,
    });
    if (!result.ok) return rpcError(id, -32000, result.message);
    return rpcResult(id, {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(result.data),
        },
      ],
    });
  }
  if (method === "tools/call") {
    const rawName = String(params.name ?? "");
    const rawArgs =
      params.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};
    const remote = actor.catalog === "remote";
    let name = rawName;
    let args = rawArgs;
    let auditName = rawName;
    if (remote) {
      const mapped = mapRemoteToolCall(rawName, rawArgs);
      if (!mapped) {
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: "This connector cannot call that tool." }],
        });
      }
      const tool = REMOTE_MCP_TOOLS.find((row) => row.name === rawName);
      if (!tool || !remoteToolAllowed(tool, actor.mcpScopes ?? [])) {
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: "This connector cannot call that tool." }],
        });
      }
      try {
        const { assertRemoteArgBudget, digestMcpArgs, enforceRemoteToolRate } = await import(
          "@/lib/server/remote-mcp.server"
        );
        assertRemoteArgBudget(rawArgs);
        if (actor.keyId) enforceRemoteToolRate(actor.keyId, rawName);
        name = mapped.action;
        args = mapped.payload;
        auditName = rawName;
        const result = await runAutonomyAction({
          actor,
          action: name,
          payload: args,
          requestId,
          auditAction: auditName,
          argsDigest: digestMcpArgs(rawArgs),
          playbookId:
            typeof (params._meta as { playbook?: string } | undefined)?.playbook === "string"
              ? (params._meta as { playbook: string }).playbook
              : typeof args.playbook === "string"
                ? args.playbook
                : null,
          runId:
            typeof (params._meta as { runId?: string } | undefined)?.runId === "string"
              ? (params._meta as { runId: string }).runId
              : typeof args.runId === "string"
                ? args.runId
                : null,
        });
        if (!result.ok) {
          return rpcResult(id, {
            isError: true,
            content: [{ type: "text", text: result.message }],
          });
        }
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(shapeRemoteMcpResult(rawName, result.data)) }],
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : "VALIDATION";
        if (code === "RATE_LIMITED") {
          return rpcResult(id, {
            isError: true,
            content: [{ type: "text", text: "Too many requests. Retry shortly." }],
          });
        }
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: "The request could not be completed." }],
        });
      }
    }
    if (rawName.startsWith("skill.")) {
      name = "skills.invoke";
      args = { id: rawName.slice("skill.".length), args: rawArgs };
    }
    const catalog = MCP_TOOLS.find((tool) => tool.name === name);
    if (!catalog) {
      await writeAuditLog({
        requestId,
        actor,
        action: name,
        result: "denied",
        errorCode: "UNKNOWN_ACTION",
      });
      return rpcResult(id, {
        isError: true,
        content: [{ type: "text", text: "Unknown tool." }],
      });
    }
    if (!catalog.scopes.every((scope) => hasScope(actor.scopes, scope))) {
      await writeAuditLog({
        requestId,
        actor,
        action: name,
        result: "denied",
        errorCode: "FORBIDDEN",
      });
      return rpcResult(id, {
        isError: true,
        content: [{ type: "text", text: "This key cannot perform that action." }],
      });
    }
    const meta = params._meta && typeof params._meta === "object" ? (params._meta as Record<string, unknown>) : {};
    const result = await runAutonomyAction({
      actor,
      action: name,
      payload: args,
      requestId,
      playbookId:
        typeof meta.playbook === "string"
          ? meta.playbook
          : typeof args.playbook === "string"
            ? args.playbook
            : null,
      runId:
        typeof meta.runId === "string" ? meta.runId : typeof args.runId === "string" ? args.runId : null,
    });
    if (!result.ok) {
      return rpcResult(id, {
        isError: true,
        content: [{ type: "text", text: result.message }],
      });
    }
    return rpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(result.data) }],
    });
  }
  return rpcError(id, -32601, "Method not found.");
}

function mapResource(uri: string): { action: string; payload: Record<string, unknown> } | null {
  if (uri === "agency://dashboard") return { action: "get_dashboard_snapshot", payload: {} };
  if (uri === "agency://pipeline") return { action: "get_dashboard_snapshot", payload: {} };
  if (uri === "agency://social/machine") return { action: "social.get_machine_status", payload: {} };
  if (uri === "agency://social/platforms") return { action: "social.list_platforms", payload: {} };
  if (uri === "agency://social/publishers") return { action: "social.get_publisher_status", payload: {} };
  if (uri === "agency://social/posts") return { action: "social.list_posts", payload: {} };
  const job = uri.match(/^agency:\/\/social\/jobs\/(.+)$/);
  if (job) return { action: "social.get_upload_job", payload: { id: job[1] } };
  const client = uri.match(/^agency:\/\/clients\/(.+)$/);
  if (client) return { action: "get_client", payload: { id: client[1] } };
  const skill = uri.match(/^agency:\/\/skills\/(.+)$/);
  if (skill) return { action: "skills.get", payload: { id: skill[1] } };
  if (uri === "agency://library/assets") return { action: "library.search_assets", payload: {} };
  if (uri === "agency://analytics/performance") return { action: "analytics.list_winners", payload: {} };
  if (uri === "agency://knowledge/proposals") return { action: "knowledge.list_proposals", payload: {} };
  if (uri === "agency://linear/status") return { action: "linear.get_status", payload: {} };
  if (uri === "agency://grok-bot") return { action: "grokbot.get_status", payload: {} };
  if (uri === "agency://health") return { action: "health.get_summary", payload: {} };
  return null;
}

async function listVisibleTools(actor?: AutonomyActor): Promise<{
  tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
  _meta: { toolsGeneration: number; listChanged: true };
}> {
  const { enabledAddonIds, readToolsGeneration } = await import("@/lib/server/addons.server");
  const [enabled, generation] = await Promise.all([enabledAddonIds(), readToolsGeneration()]);
  if (actor?.catalog === "remote") {
    const scopes = actor.mcpScopes ?? [];
    const tools = REMOTE_MCP_TOOLS.filter((tool) => {
      if (!remoteToolAllowed(tool, scopes)) return false;
      const addon = addonIdForTool(tool.action);
      return !addon || enabled.has(addon);
    }).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    return { tools, _meta: { toolsGeneration: generation, listChanged: true } };
  }
  const staticTools = MCP_TOOLS.filter((tool) => {
    if (actor && !tool.scopes.every((scope) => hasScope(actor.scopes, scope))) return false;
    const addon = addonIdForTool(tool.name);
    return !addon || enabled.has(addon);
  }).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: TOOL_INPUTS[tool.name] ?? { type: "object", properties: {} },
  }));
  let skillTools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> = [];
  const invoke = MCP_TOOLS.find((tool) => tool.name === "skills.invoke");
  const mayInvokeSkills =
    invoke !== undefined && (!actor || invoke.scopes.every((scope) => hasScope(actor.scopes, scope)));
  if (mayInvokeSkills && enabled.has("agency.skills-runtime")) {
    const { listPublicSkills } = await import("@/lib/server/skills.server");
    const skills = await listPublicSkills();
    skillTools = skills.map((skill) => ({
      name: `skill.${skill.slug}`,
      description: skill.description,
      inputSchema:
        skill.inputsSchema && typeof skill.inputsSchema === "object" && !Array.isArray(skill.inputsSchema)
          ? (skill.inputsSchema as Record<string, unknown>)
          : { type: "object", properties: {} },
    }));
  }
  return {
    tools: [...staticTools, ...skillTools],
    _meta: { toolsGeneration: generation, listChanged: true },
  };
}
