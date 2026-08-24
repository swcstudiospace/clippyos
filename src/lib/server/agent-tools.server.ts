/**
 * Shared tool dispatcher for the Clipping Agent + MCP/API.
 */
import { sanitizeText } from "@/lib/sanitize";
import { toPublicMachineStatus } from "@/lib/social";
import { visionAnalyze, visionCompare } from "@/lib/server/vision.server";
import {
  computerAccessibilityFind,
  computerKeyboardKey,
  computerKeyboardType,
  computerListWindows,
  computerMouseClick,
  computerMouseDrag,
  computerMouseMove,
  computerMouseScroll,
  computerScreenshot,
  computerStart,
  computerStatus,
  computerStop,
} from "@/lib/server/computer-use.server";
import {
  browserGetPageSummary,
  browserOpenInstagramUpload,
  browserOpenTiktokUpload,
  browserOpenUrl,
  browserOpenXCompose,
  browserUploadFile,
  browserWaitForText,
} from "@/lib/server/browser-use.server";
import {
  clippingDistributeSocial,
  clippingGenerateIdeas,
  clippingGenerateThumbnail,
  clippingGenerateTitles,
  clippingMarkPublished,
  clippingObserveDesktop,
  clippingResearchChannel,
  clippingRunSkill,
  clippingSetStage,
  clippingGetProgress,
  clippingGuaranteeCheck,
  clippingVerifyUpload,
  clippingProposeSkill,
  clippingDashboardSnapshot,
} from "@/lib/server/clipping-tools.server";

export type ToolResult = {
  data: unknown;
  screenshotRef?: string | null;
  screenshotDataUrl?: string | null;
  needsLogin?: boolean;
  pause?: boolean;
  machineStopped?: boolean;
  waitingHuman?: boolean;
};

function str(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function executeAgentTool(input: {
  name: string;
  payload: Record<string, unknown>;
  actorId: string;
}): Promise<ToolResult> {
  const { name, payload, actorId } = input;
  switch (name) {
    case "vision.analyze": {
      const data = await visionAnalyze(payload);
      return { data };
    }
    case "vision.compare": {
      const data = await visionCompare({
        beforeUrl: payload.beforeUrl ?? payload.before,
        afterUrl: payload.afterUrl ?? payload.after,
        prompt: payload.prompt,
      });
      return { data };
    }
    case "computer.start":
      return { data: toPublicMachineStatus(await computerStart()) };
    case "computer.stop":
      return { data: toPublicMachineStatus(await computerStop()) };
    case "computer.screenshot": {
      const shot = await computerScreenshot();
      return {
        data: { screenshotRef: shot.screenshotRef, capturedAt: shot.capturedAt },
        screenshotRef: shot.screenshotRef,
        screenshotDataUrl: shot.dataUrl,
      };
    }
    case "computer.mouse_click":
      return { data: await computerMouseClick(payload) };
    case "computer.mouse_move":
    case "computer.move":
      return { data: await computerMouseMove(payload) };
    case "computer.mouse_drag":
    case "computer.drag":
      return { data: await computerMouseDrag(payload) };
    case "computer.scroll":
    case "computer.mouse_scroll":
      return { data: await computerMouseScroll(payload) };
    case "computer.keyboard_type":
    case "computer.keyboard.type":
      return { data: await computerKeyboardType({ text: payload.text ?? payload.value }) };
    case "computer.key":
    case "computer.hotkey":
    case "computer.keyboard_key":
      return { data: await computerKeyboardKey({ key: payload.key, keys: payload.keys }) };
    case "computer.accessibility_find":
      return { data: await computerAccessibilityFind(payload) };
    case "computer.list_windows":
      return { data: await computerListWindows() };
    case "computer.status": {
      const status = await computerStatus();
      return {
        data: status,
        machineStopped: status.state === "stopped" || status.state === "not_configured",
      };
    }
    case "browser.open_url":
      return { data: await browserOpenUrl(payload) };
    case "browser.wait_for_text":
      return { data: await browserWaitForText(payload) };
    case "browser.upload_file":
      return { data: await browserUploadFile(payload) };
    case "browser.get_page_summary":
      return { data: await browserGetPageSummary() };
    case "browser.open_instagram_upload":
      return { data: await browserOpenInstagramUpload() };
    case "browser.open_x_compose":
      return { data: await browserOpenXCompose() };
    case "browser.open_tiktok_upload":
      return { data: await browserOpenTiktokUpload() };
    case "clipping.research_channel": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return { data: await clippingResearchChannel(clientId) };
    }
    case "clipping.generate_ideas": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return { data: await clippingGenerateIdeas(clientId) };
    }
    case "clipping.generate_titles": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return { data: await clippingGenerateTitles(clientId) };
    }
    case "clipping.generate_thumbnail": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return {
        data: await clippingGenerateThumbnail({
          clientId,
          prompt: typeof payload.prompt === "string" ? payload.prompt : undefined,
          actorId,
        }),
      };
    }
    case "clipping.set_stage": {
      const clientId = str(payload, "clientId", "id");
      const stage = str(payload, "stage");
      if (!clientId || !stage) throw new Error("VALIDATION");
      return {
        data: await clippingSetStage({
          clientId,
          stage,
          notes: typeof payload.notes === "string" ? payload.notes : undefined,
          actorId,
        }),
      };
    }
    case "clipping.mark_published": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return {
        data: await clippingMarkPublished({
          clientId,
          notes: typeof payload.notes === "string" ? payload.notes : undefined,
          actorId,
        }),
      };
    }
    case "clipping.distribute_social": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      const platforms = Array.isArray(payload.platforms) ? payload.platforms.map(String) : undefined;
      return {
        data: await clippingDistributeSocial({
          clientId,
          platforms,
          caption: typeof payload.caption === "string" ? payload.caption : undefined,
          actorId,
          mediaAssetId: str(payload, "mediaAssetId", "assetId") || undefined,
        }),
      };
    }
    case "clipping.run_skill":
    case "skills.invoke": {
      const skillId = str(payload, "skillId", "id");
      if (!skillId) throw new Error("VALIDATION");
      const args =
        payload.arguments && typeof payload.arguments === "object"
          ? (payload.arguments as Record<string, unknown>)
          : payload.args && typeof payload.args === "object"
            ? (payload.args as Record<string, unknown>)
            : {};
      const result = await clippingRunSkill({ skillId, args, actorId });
      return { data: { taskId: result.taskId, run: result.run, skill: result.skill } };
    }
    case "clipping.observe_desktop": {
      const observed = await clippingObserveDesktop();
      const needsLogin = /log ?in|sign in|password/i.test(observed.description);
      return {
        data: { screenshotRef: observed.screenshotRef, description: observed.description },
        screenshotRef: observed.screenshotRef,
        screenshotDataUrl: observed.dataUrl,
        needsLogin,
        pause: needsLogin,
      };
    }
    case "clipping.get_progress":
    case "get_client_progress": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return { data: await clippingGetProgress(clientId) };
    }
    case "clipping.guarantee_check": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      return { data: await clippingGuaranteeCheck(clientId) };
    }
    case "clipping.verify_upload": {
      const jobId = str(payload, "jobId", "id");
      if (!jobId) throw new Error("VALIDATION");
      const verified = await clippingVerifyUpload(jobId);
      return {
        data: verified,
        screenshotRef: verified.screenshotRef,
        screenshotDataUrl: verified.dataUrl,
        needsLogin: verified.needsLogin,
        machineStopped: verified.machineStopped,
      };
    }
    case "clipping.propose_skill":
      return {
        data: await clippingProposeSkill({
          agentRunId: str(payload, "agentRunId", "runId") || null,
          actorId,
        }),
      };
    case "get_dashboard_snapshot":
    case "list_at_risk_clients":
      return { data: await clippingDashboardSnapshot() };
    case "get_analytics_snapshot": {
      const clientId = str(payload, "clientId", "id");
      if (!clientId) throw new Error("VALIDATION");
      const { readSnapshots } = await import("@/lib/server/analytics");
      const rows = (await readSnapshots())
        .filter((row) => row.clientId === clientId)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, 14)
        .map((row) => ({
          date: row.date,
          views: row.views,
          subscribers: row.subscribers,
          watchHours: row.watchHours,
          impressionsCtr: row.impressionsCtr,
        }));
      return { data: { clientId, snapshots: rows, note: "Public snapshots only. Never invented." } };
    }
    case "analytics.refresh_post_performance": {
      const fetch = await import("@/lib/server/performance-fetch.server");
      if (payload.sweep === true || !str(payload, "socialPostId")) {
        const due = await fetch.sweepDuePerformanceFetches(12);
        const stale = await fetch.sweepStalePublishedPosts();
        const { distillWinnersToProposals } = await import("@/lib/server/knowledge-proposals.server");
        const distilled = await distillWinnersToProposals(actorId, 3).catch(() => 0);
        return { data: { due, stale, distilled } };
      }
      const result = await fetch.refreshPostById(str(payload, "socialPostId"), actorId);
      if (!result.ok) throw new Error(result.reason ?? "METRICS_UNAVAILABLE");
      return { data: { ok: true } };
    }
    case "analytics.list_winners": {
      const { listWinners } = await import("@/lib/server/performance.server");
      const winners = await listWinners({
        clientId: str(payload, "clientId") || undefined,
        platform: (str(payload, "platform") || undefined) as
          | "X"
          | "TIKTOK"
          | "INSTAGRAM"
          | "YOUTUBE"
          | "OTHER"
          | undefined,
      });
      return {
        data: {
          winners: winners.map((row) => ({
            id: row.id,
            platform: row.platform,
            score: row.score,
            verdict: row.verdict,
            views: row.metrics.views,
            engagementRate: row.engagementRate,
            clientId: row.clientId,
            mediaAssetId: row.mediaAssetId,
            window: row.window,
          })),
        },
      };
    }
    case "knowledge.list_proposals": {
      const { listKnowledgeProposals } = await import("@/lib/server/knowledge-proposals.server");
      const items = await listKnowledgeProposals({
        status: (str(payload, "status") || undefined) as
          | "PENDING_REVIEW"
          | "APPROVED"
          | "REJECTED"
          | "MERGED"
          | undefined,
        clientId: str(payload, "clientId") || undefined,
      });
      return {
        data: {
          items: items.map((row) => ({
            id: row.id,
            status: row.status,
            suggestedScope: row.suggestedScope,
            learnedPrincipleDraft: row.learnedPrincipleDraft,
            confidence: row.confidence,
            clientId: row.clientId,
          })),
        },
      };
    }
    case "knowledge.decide_proposal": {
      const id = str(payload, "id");
      const decision = str(payload, "decision").toUpperCase();
      if (!id || (decision !== "APPROVED" && decision !== "REJECTED")) throw new Error("VALIDATION");
      const { decideProposal } = await import("@/lib/server/knowledge-proposals.server");
      const row = await decideProposal({
        id,
        decision: decision as "APPROVED" | "REJECTED",
        actorId,
        note: str(payload, "note") || null,
      });
      return { data: { id: row.id, status: row.status, mergedEntryId: row.mergedEntryId } };
    }
    case "linear.get_status": {
      const { getLinearStatusForHermes } = await import("@/lib/server/linear.server");
      return { data: await getLinearStatusForHermes() };
    }
    case "linear.create_issue": {
      const title = str(payload, "title");
      if (title.length < 3) throw new Error("VALIDATION");
      const { createLinearIssue } = await import("@/lib/server/linear.server");
      const { isLinearEntityType } = await import("@/lib/linear");
      const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? (payload.linkTo as { type?: string; id?: string }) : null;
      return {
        data: await createLinearIssue({
          title,
          description: str(payload, "description") || null,
          state: str(payload, "state") || "backlog",
          labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
          actorId,
          linkTo:
            linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id
              ? { type: linkRaw.type, id: String(linkRaw.id) }
              : null,
        }),
      };
    }
    case "linear.update_issue": {
      const { updateLinearIssue } = await import("@/lib/server/linear.server");
      const { isLinearEntityType } = await import("@/lib/linear");
      const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? (payload.linkTo as { type?: string; id?: string }) : null;
      return {
        data: await updateLinearIssue({
          issueId: str(payload, "issueId", "id") || undefined,
          state: str(payload, "state") || null,
          comment: str(payload, "comment") || null,
          actorId,
          linkTo:
            linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id
              ? { type: linkRaw.type, id: String(linkRaw.id) }
              : null,
        }),
      };
    }
    case "linear.find_issues": {
      const { findLinearIssues } = await import("@/lib/server/linear.server");
      return { data: { items: await findLinearIssues(str(payload, "term", "text", "query")) } };
    }
    case "social.get_machine_status": {
      const { getSocialMachineStatus } = await import("@/lib/server/daytona.server");
      const status = toPublicMachineStatus(await getSocialMachineStatus());
      return {
        data: status,
        machineStopped: status.state === "stopped" || status.state === "not_configured",
      };
    }
    case "social.get_upload_job": {
      const { handleSocialAction } = await import("@/lib/server/social-ops.server");
      const id = str(payload, "id", "jobId");
      if (!id) throw new Error("VALIDATION");
      return { data: await handleSocialAction("social.get_upload_job", { id }, actorId) };
    }
    case "social.list_platforms": {
      const { handleSocialAction } = await import("@/lib/server/social-ops.server");
      return { data: await handleSocialAction("social.list_platforms", payload, actorId) };
    }
    case "clipping.finish":
      return { data: { summary: sanitizeText(str(payload, "summary", "text")).slice(0, 2000) }, pause: true };
    default: {
      if (name.startsWith("library.")) {
        const { handleLibraryAction } = await import("@/lib/server/library-tools.server");
        return { data: await handleLibraryAction(name, payload, actorId) };
      }
      if (name.startsWith("stream.") || name.startsWith("bridge.")) {
        const { handleStreamAction } = await import("@/lib/server/stream-tools.server");
        const data = await handleStreamAction(name, payload, actorId);
        if (data === undefined) throw new Error("UNKNOWN_ACTION");
        return { data };
      }
      throw new Error("UNKNOWN_ACTION");
    }
  }
}

export const AGENT_LLM_TOOLS = [
  {
    type: "function",
    function: {
      name: "clipping.research_channel",
      description: "Load the client’s YouTube profile and latest long-form videos (≥ 4 minutes).",
      parameters: { type: "object", required: ["clientId"], properties: { clientId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.generate_ideas",
      description: "Generate long-form video ideas for a client. Persists until regenerate.",
      parameters: { type: "object", required: ["clientId"], properties: { clientId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.generate_titles",
      description: "3 title alternatives for each of the last 5 long-form uploads.",
      parameters: { type: "object", required: ["clientId"], properties: { clientId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.generate_thumbnail",
      description: "Generate a 16:9 4K thumbnail via Higgsfield and register it in the Library when ingest succeeds.",
      parameters: {
        type: "object",
        required: ["clientId"],
        properties: { clientId: { type: "string" }, prompt: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.set_stage",
      description: "Append a ClientProgress stage. Requires notes unless evidence policy is on.",
      parameters: {
        type: "object",
        required: ["clientId", "stage"],
        properties: {
          clientId: { type: "string" },
          stage: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.mark_published",
      description: "Set stage to PUBLISHED with notes.",
      parameters: {
        type: "object",
        required: ["clientId"],
        properties: { clientId: { type: "string" }, notes: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.distribute_social",
      description: "Queue draft social uploads. Does not start the VM unless policy auto_start_for_upload is on.",
      parameters: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "string" },
          platforms: { type: "array", items: { type: "string" } },
          caption: { type: "string" },
          mediaAssetId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.run_skill",
      description: "Invoke an approved skill in a Daytona Python sandbox.",
      parameters: {
        type: "object",
        required: ["skillId"],
        properties: { skillId: { type: "string" }, arguments: { type: "object" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.observe_desktop",
      description: "Screenshot the Social Machine and describe what’s on screen.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "vision.analyze",
      description: "Analyze an image URL or data URL (OCR, UI, thumbnail critique).",
      parameters: {
        type: "object",
        properties: {
          imageUrl: { type: "string" },
          prompt: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "computer.screenshot",
      description: "Capture the Social Machine desktop. Machine must already be running.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "computer.list_windows",
      description: "List open windows on the Social Machine desktop.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "browser.open_url",
      description: "Open an https URL in the Social Machine browser. Machine must already be running.",
      parameters: { type: "object", required: ["url"], properties: { url: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "browser.get_page_summary",
      description: "Screenshot + vision summary of the current page.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.get_progress",
      description: "Read ClientProgress including Discord-sourced stages.",
      parameters: { type: "object", required: ["clientId"], properties: { clientId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.guarantee_check",
      description: "30-day views check from AnalyticsSnapshots. Never invents views.",
      parameters: { type: "object", required: ["clientId"], properties: { clientId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.propose_skill",
      description: "Draft a pending_review skill from a successful Agent run.",
      parameters: { type: "object", properties: { agentRunId: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "library.search_assets",
      description: "Search the unified asset library by client, kind, source, tag, or title.",
      parameters: {
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
    },
  },
  {
    type: "function",
    function: {
      name: "library.queue_render",
      description: "Queue an FFmpeg export (REELS_9x16, SQUARE_1x1, LANDSCAPE_16x9) with optional burned captions.",
      parameters: {
        type: "object",
        required: ["assetId"],
        properties: {
          assetId: { type: "string" },
          preset: { type: "string" },
          burnInCaptions: { type: "boolean" },
          captionTrackId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "library.attach_to_social_job",
      description: "Create a social upload job from a library mediaAssetId. Prefers a 9:16 render for TikTok/IG.",
      parameters: {
        type: "object",
        required: ["clientId", "mediaAssetId"],
        properties: {
          clientId: { type: "string" },
          mediaAssetId: { type: "string" },
          platforms: { type: "array", items: { type: "string" } },
          caption: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analytics.refresh_post_performance",
      description:
        "Pull official metrics for a published social post, or sweep due snapshots. Never invents zeros; missing stays unknown.",
      parameters: {
        type: "object",
        properties: {
          socialPostId: { type: "string" },
          sweep: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analytics.list_winners",
      description: "List winning published posts scored against client+platform peers.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          platform: { type: "string", enum: ["X", "TIKTOK", "INSTAGRAM", "YOUTUBE", "OTHER"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "knowledge.list_proposals",
      description: "List pending knowledge proposals distilled from winning posts. Do not auto-approve.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "MERGED"] },
          clientId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "linear.get_status",
      description: "Linear team/project binding. Never returns tokens. Skip issue create if not enabled.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "linear.create_issue",
      description:
        "Create a Linear issue in the bound project. Use for failed uploads/renders. Does nothing when Linear is off.",
      parameters: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          state: { type: "string" },
          labels: { type: "array", items: { type: "string" } },
          linkTo: { type: "object", properties: { type: { type: "string" }, id: { type: "string" } } },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clipping.finish",
      description: "End the run with a short operator summary. Call when the goal is done or blocked.",
      parameters: { type: "object", required: ["summary"], properties: { summary: { type: "string" } } },
    },
  },
] as const;
