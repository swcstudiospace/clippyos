/**
 * Composite clipping tools used by the in-app Agent and MCP.
 */
import { PROGRESS_STAGES, type ProgressStage } from "@/lib/entities";
import { sanitizeText } from "@/lib/sanitize";
import { internalSetClientStage, readClients } from "@/lib/server/clients";
import {
  internalGenerateSuggestedIdeas,
  internalGenerateSuggestedTitles,
} from "@/lib/server/client-tools";
import { generateThumbnailImage } from "@/lib/server/higgsfield.server";
import { invokeSkillInternal } from "@/lib/server/skills.server";
import { visionAnalyze } from "@/lib/server/vision.server";
import { readPlaybookPolicies } from "@/lib/server/autonomy-policy.server";

async function loadClient(clientId: string) {
  const clients = await readClients();
  const client = clients.find((row) => row.id === clientId && !row.deletedAt);
  if (!client) throw new Error("CLIENT_MISSING");
  return client;
}

export async function clippingResearchChannel(clientId: string) {
  const client = await loadClient(clientId);
  const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
  if (!client.channelUrl) {
    return {
      name: client.name,
      channelUrl: null,
      summary: client.channelSummary,
      offers: client.offers,
      strategy: client.contentStrategy,
      note: "No channel URL stored.",
    };
  }
  try {
    const snapshot = await fetchChannelSnapshot(client.channelUrl);
    const longForm = snapshot.videos.filter(
      (video) => typeof video.durationSeconds === "number" && video.durationSeconds >= 240,
    );
    return {
      name: client.name,
      channelUrl: client.channelUrl,
      title: snapshot.title,
      subscriberCount: snapshot.subscriberCount,
      summary: client.channelSummary,
      offers: client.offers,
      strategy: client.contentStrategy,
      longFormCount: longForm.length,
      latestLongForm: longForm.slice(0, 5).map((video) => ({
        id: video.videoId,
        title: video.title,
        durationSeconds: video.durationSeconds,
        publishedAt: video.publishedAt,
      })),
    };
  } catch {
    return {
      name: client.name,
      channelUrl: client.channelUrl,
      summary: client.channelSummary,
      offers: client.offers,
      strategy: client.contentStrategy,
      note: "YouTube lookup unavailable. Using stored profile only.",
    };
  }
}

export async function clippingGenerateIdeas(clientId: string) {
  return internalGenerateSuggestedIdeas(clientId);
}

export async function clippingGenerateTitles(clientId: string) {
  return internalGenerateSuggestedTitles(clientId);
}

export async function clippingGenerateThumbnail(input: {
  clientId: string;
  prompt?: string;
  actorId?: string;
}) {
  const client = await loadClient(input.clientId);
  const prompt =
    (input.prompt?.trim() ||
      `YouTube thumbnail, 16:9, 4K, personal brand for ${client.name}. Bold face, high contrast, readable.`)
      .slice(0, 800);
  const result = await generateThumbnailImage(prompt);
  if (!result.ok) {
    return { ok: false as const, error: result.error, prompt };
  }
  let assetId: string | null = null;
  try {
    const { ingestFromUrl } = await import("@/lib/server/library-pipeline.server");
    const ingested = await ingestFromUrl({
      actorId: input.actorId ?? "agent",
      clientId: client.id,
      url: result.url,
      title: `Thumbnail · ${client.name}`,
      source: "THUMBNAIL_GEN",
      tags: ["thumbnail", "agent"],
    });
    assetId = ingested.asset.id;
  } catch {
    /* library ingest is best-effort */
  }
  return { ok: true as const, url: result.url, provider: result.provider, prompt, assetId };
}

export async function clippingSetStage(input: {
  clientId: string;
  stage: string;
  notes?: string;
  actorId: string;
}) {
  if (!(PROGRESS_STAGES as readonly string[]).includes(input.stage)) {
    throw new Error("VALIDATION");
  }
  const policies = await readPlaybookPolicies();
  const notes = sanitizeText(input.notes ?? "").slice(0, 500);
  if (!notes && !policies.autoAdvanceStageWithoutEvidence) {
    throw new Error("EVIDENCE_REQUIRED");
  }
  await internalSetClientStage({
    clientId: input.clientId,
    stage: input.stage as ProgressStage,
    source: "AGENT",
    notes: notes || "Agent stage write",
    actorId: input.actorId,
  });
  return { ok: true as const, stage: input.stage };
}

export async function clippingMarkPublished(input: { clientId: string; notes?: string; actorId: string }) {
  return clippingSetStage({
    clientId: input.clientId,
    stage: "PUBLISHED",
    notes: input.notes ?? "Marked published by clipping agent.",
    actorId: input.actorId,
  });
}

export async function clippingDistributeSocial(input: {
  clientId: string;
  platforms?: string[];
  caption?: string;
  actorId: string;
  mediaAssetId?: string;
}) {
  const platforms = (input.platforms?.length ? input.platforms : ["instagram", "tiktok"]) as string[];
  if (input.mediaAssetId) {
    const { handleLibraryAction } = await import("@/lib/server/library-tools.server");
    return handleLibraryAction(
      "library.attach_to_social_job",
      {
        clientId: input.clientId,
        mediaAssetId: input.mediaAssetId,
        platforms,
        caption: input.caption,
        mode: "draft",
      },
      input.actorId,
    );
  }
  const { handleSocialAction } = await import("@/lib/server/social-ops.server");
  return handleSocialAction(
    "social.create_upload_job",
    {
      clientId: input.clientId,
      platforms,
      caption: input.caption,
      mode: "draft",
      preferredRail: "AUTO",
      fallbackToBrowser: true,
    },
    input.actorId,
  );
}

export async function clippingRunSkill(input: {
  skillId: string;
  args?: Record<string, unknown>;
  actorId: string;
}) {
  return invokeSkillInternal({
    skillId: input.skillId,
    args: input.args,
    actorId: input.actorId,
  });
}

export async function clippingObserveDesktop() {
  const { getSocialMachineStatus, takeSocialScreenshot } = await import("@/lib/server/daytona.server");
  const status = await getSocialMachineStatus();
  if (status.state !== "running") throw new Error("MACHINE_STOPPED");
  const shot = await takeSocialScreenshot();
  if (!shot.dataUrl) {
    return {
      screenshotRef: shot.screenshotRef,
      description: "Desktop captured. Inline pixels omitted (size). Open Social to view.",
    };
  }
  try {
    const analyzed = await visionAnalyze({
      imageUrl: shot.dataUrl,
      prompt: "What is on screen? Note login walls, upload dialogs, and errors.",
    });
    return {
      screenshotRef: shot.screenshotRef,
      description: analyzed.description,
      dataUrl: shot.dataUrl.length < 180_000 ? shot.dataUrl : null,
    };
  } catch {
    return {
      screenshotRef: shot.screenshotRef,
      description: "Screenshot captured. Vision unavailable.",
      dataUrl: shot.dataUrl.length < 180_000 ? shot.dataUrl : null,
    };
  }
}

export async function clippingGetProgress(clientId: string) {
  const client = await loadClient(clientId);
  const { readProgress } = await import("@/lib/server/clients");
  const rows = (await readProgress())
    .filter((row) => row.clientId === clientId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8)
    .map((row) => ({
      stage: row.stage,
      source: row.source,
      notes: row.notes,
      createdAt: row.createdAt,
      discord: row.source === "AI_DISCORD",
    }));
  return {
    clientId: client.id,
    name: client.name,
    currentStage: rows[0]?.stage ?? null,
    recent: rows,
  };
}

export async function clippingGuaranteeCheck(clientId: string) {
  const client = await loadClient(clientId);
  const { readSnapshots } = await import("@/lib/server/analytics");
  const { deriveGuaranteeItems } = await import("@/lib/dashboard");
  const { todayIsoDate } = await import("@/lib/format");
  const snapshots = await readSnapshots();
  const items = deriveGuaranteeItems([client], snapshots, todayIsoDate());
  const item = items[0];
  if (!item) {
    return {
      clientId: client.id,
      name: client.name,
      dayCount: null,
      viewsSignal: "insufficient" as const,
      viewsLabel: "Insufficient data",
      escalation: false,
      note: "No 30-day window yet (missing start date or not ACTIVE).",
    };
  }
  const escalation =
    (item.dayCount >= 25 && item.viewsSignal !== "up") ||
    (item.dayCount >= 30 && item.viewsSignal !== "up");
  return {
    clientId: client.id,
    name: client.name,
    dayCount: item.dayCount,
    viewsSignal: item.viewsSignal,
    viewsLabel: item.viewsLabel,
    viewsIncreased: item.viewsIncreased,
    status: item.status,
    escalation,
    note: "Derived from AnalyticsSnapshots only. Views are never invented.",
  };
}

export async function clippingVerifyUpload(jobId: string) {
  const { handleSocialAction } = await import("@/lib/server/social-ops.server");
  const job = await handleSocialAction("social.get_upload_job", { id: jobId }, "agent");
  let observed: Awaited<ReturnType<typeof clippingObserveDesktop>> | null = null;
  let error: string | null = null;
  try {
    observed = await clippingObserveDesktop();
  } catch (err) {
    error = err instanceof Error ? err.message : "OBSERVE_FAILED";
  }
  const description = observed?.description ?? "";
  const login = /log ?in|sign in|password/i.test(description);
  const success = /posted|published|success|share/i.test(description);
  return {
    job,
    ok: success && !login && !error,
    notes: error ?? description.slice(0, 800),
    screenshotRef: observed?.screenshotRef ?? null,
    dataUrl: observed?.dataUrl ?? null,
    needsLogin: login,
    machineStopped: error === "MACHINE_STOPPED",
  };
}

export async function clippingProposeSkill(input: {
  agentRunId?: string | null;
  actorId: string;
}) {
  const { listAgentRuns, getAgentRunDetail } = await import("@/lib/server/agent.server");
  const { createSkillInternalFromDistill } = await import("@/lib/server/skills.server");
  const { readPlaybookPolicies } = await import("@/lib/server/autonomy-policy.server");
  let runId = input.agentRunId?.trim() || "";
  if (!runId) {
    const runs = await listAgentRuns(20);
    const found = runs.find((row) => row.status === "succeeded" || row.status === "completed");
    runId = found?.id ?? "";
  }
  if (!runId) throw new Error("JOB_MISSING");
  const detail = await getAgentRunDetail(runId);
  if (!detail) throw new Error("JOB_MISSING");
  const tools = [
    ...new Set(detail.iterations.map((row) => row.toolName).filter((name): name is string => Boolean(name))),
  ];
  const plan = (detail.run.plan ?? [])
    .map((step) => `- ${step.tool}: ${step.purpose}`)
    .join("\n");
  const md = `---
name: Distilled from agent run
description: Procedure captured from Agent run ${runId.slice(0, 8)}.
version: 1.0.0
tags: [agent, distilled]
category: clipping
provenance: agent
permissions: [clients:read]
runtime: { timeoutSec: 30, network: false }
---

# Distilled clipping procedure

Goal: ${detail.run.goal}

Plan:
${plan || "(no persisted plan)"}

Tools: ${tools.join(", ") || "none"}

Replay with the same tools only. Never invent analytics. Never auto-start the Social Machine.
`;
  const policies = await readPlaybookPolicies();
  const skill = await createSkillInternalFromDistill({
    skillMd: md,
    autoPublish: policies.skillsAutoPublishAgent === true,
    createdBy: input.actorId,
  });
  return { skillId: skill.id, status: skill.status, slug: skill.slug, fromRunId: runId };
}

export async function clippingDashboardSnapshot() {
  const { readClients, readProgress } = await import("@/lib/server/clients");
  const { readPayments, readTeamMembers } = await import("@/lib/server/money");
  const { readSnapshots } = await import("@/lib/server/analytics");
  const { deriveDashboardMetrics, deriveGuaranteeItems, derivePipelineCounts } = await import(
    "@/lib/dashboard"
  );
  const { todayIsoDate } = await import("@/lib/format");
  const today = todayIsoDate();
  const [clients, payments, teamMembers, progress, snapshots] = await Promise.all([
    readClients(),
    readPayments(),
    readTeamMembers(),
    readProgress(),
    readSnapshots(),
  ]);
  const latest = new Map<string, string | null>();
  for (const row of progress) {
    if (!latest.has(row.clientId)) latest.set(row.clientId, row.stage);
  }
  const metrics = deriveDashboardMetrics({ clients, payments, teamMembers }, today);
  const guarantees = deriveGuaranteeItems(clients, snapshots, today);
  const pipeline = derivePipelineCounts(
    clients.map((client) => ({
      id: client.id,
      status: client.status,
      deletedAt: client.deletedAt,
      currentStage: (latest.get(client.id) as never) ?? null,
    })),
  );
  return {
    metrics,
    pipeline,
    atRisk: guarantees
      .filter((item) => item.dayCount >= 25)
      .map((item) => ({
        clientId: item.clientId,
        name: item.name,
        dayCount: item.dayCount,
        viewsSignal: item.viewsSignal,
      })),
    generatedAt: new Date().toISOString(),
  };
}
