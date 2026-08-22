import {
  PROGRESS_STAGES,
  LEAD_STATUSES,
  PLAN_TYPES,
  type ProgressStage,
  type LeadStatus,
  type ClientStatus,
  type PlanType,
} from "@/lib/entities";
import { hasScope, type ApiKeyScope } from "@/lib/autonomy";
import { isActiveClient, displayPaymentStatus, asMoney } from "@/lib/money";
import {
  deriveDashboardMetrics,
  deriveGuaranteeItems,
  derivePipelineCounts,
  deriveRecentActivity,
} from "@/lib/dashboard";
import { deriveLeadTotals } from "@/lib/leads";
import { DEFAULT_MONTHLY_FEE, DEFAULT_SETUP_FEE } from "@/lib/labels";
import { todayIsoDate } from "@/lib/format";
import { sanitizeText } from "@/lib/sanitize";
import {
  internalMarkPaymentPaid,
  internalSetClientStage,
  internalSaveClient,
  readClients,
  readProgress,
} from "@/lib/server/clients";
import { readPayments, readTeamMembers } from "@/lib/server/money";
import { persistPull, readSnapshots } from "@/lib/server/analytics";
import { internalSaveLead, readLeads } from "@/lib/server/leads";
import {
  internalGenerateSuggestedTitles,
  internalGenerateSuggestedIdeas,
} from "@/lib/server/client-tools";
import { writeAuditLog, insertAgentJob, updateAgentJob, readAgentJob } from "@/lib/server/autonomy-audit.server";
import { emitAutonomyEvent } from "@/lib/server/autonomy-events.server";
import type { AutonomyActor } from "@/lib/server/autonomy-auth.server";
import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import {
  AGENT_MUTATIONS,
  readAutomationEnabled,
  readPlaybookPolicies,
} from "@/lib/server/autonomy-policy.server";
import { HERMES_PLAYBOOKS } from "@/lib/playbooks";

export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; code: string; message: string };

function deny(message = "This key cannot perform that action."): ActionResult {
  return { ok: false, status: 403, code: "FORBIDDEN", message };
}

function need(actor: AutonomyActor, scope: ApiKeyScope): boolean {
  return hasScope(actor.scopes, scope);
}

function publicClient(client: Awaited<ReturnType<typeof readClients>>[number]) {
  return {
    id: client.id,
    name: client.name,
    channelUrl: client.channelUrl,
    planType: client.planType,
    customPlanLabel: client.customPlanLabel,
    status: client.status,
    startDate: client.startDate,
    monthlyFee: client.monthlyFee,
    setupFee: client.setupFee,
    notes: client.notes,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

async function dashboardSnapshot() {
  const today = todayIsoDate();
  const [clients, payments, teamMembers, progress, leads, snapshots] = await Promise.all([
    readClients(),
    readPayments(),
    readTeamMembers(),
    readProgress(),
    readLeads(),
    readSnapshots(),
  ]);
  const metrics = deriveDashboardMetrics({ clients, payments, teamMembers }, today);
  const guarantees = deriveGuaranteeItems(clients, snapshots, today);
  const latest = new Map<string, ProgressStage | null>();
  for (const row of progress) {
    if (!latest.has(row.clientId)) latest.set(row.clientId, row.stage);
  }
  const pipeline = derivePipelineCounts(
    clients.map((client) => ({
      id: client.id,
      status: client.status,
      deletedAt: client.deletedAt,
      currentStage: latest.get(client.id) ?? null,
    })),
  );
  const activity = deriveRecentActivity({
    clients,
    payments,
    progress,
    leads: leads.filter((lead) => !lead.deletedAt),
  });
  return {
    metrics,
    pipeline,
    atRisk: guarantees.filter((item) => item.dayCount >= 25),
    recentActivity: activity,
    generatedAt: new Date().toISOString(),
    policies: await readPlaybookPolicies(),
    automationEnabled: await readAutomationEnabled(),
  };
}

async function patchClientLimited(input: {
  id: string;
  notes?: string | null;
  status?: ClientStatus;
}): Promise<void> {
  const stamp = new Date().toISOString();
  const admin = await getAgencyAdmin();
  const patch: Record<string, unknown> = { updated_at: stamp };
  if (input.notes !== undefined) patch.notes = input.notes ? sanitizeText(input.notes) : null;
  if (input.status === "CHURNED") {
    patch.status = "CHURNED";
    patch.deleted_at = stamp;
  } else if (input.status === "ACTIVE") {
    patch.status = "ACTIVE";
    patch.deleted_at = null;
  }
  if (admin) {
    const { error } = await admin.from("clients").update(patch).eq("id", input.id);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  if (input.status === "CHURNED") {
    await sql.query(
      "update clients set notes = coalesce($3, notes), status = 'CHURNED', deleted_at = $2, updated_at = $2 where id = $1",
      [input.id, stamp, patch.notes ?? null],
    );
  } else if (input.status === "ACTIVE") {
    await sql.query(
      "update clients set notes = coalesce($3, notes), status = 'ACTIVE', deleted_at = null, updated_at = $2 where id = $1",
      [input.id, stamp, patch.notes ?? null],
    );
  } else {
    await sql.query("update clients set notes = $3, updated_at = $2 where id = $1", [
      input.id,
      stamp,
      patch.notes ?? null,
    ]);
  }
}

async function enqueueAiJob(
  _actor: AutonomyActor,
  kind: string,
  clientId: string,
  run: () => Promise<unknown>,
): Promise<ActionResult> {
  const jobId = crypto.randomUUID();
  await insertAgentJob({ id: jobId, kind, clientId });
  void (async () => {
    try {
      await updateAgentJob(jobId, { status: "running" });
      const result = await run();
      await updateAgentJob(jobId, { status: "completed", result });
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 80) : "GENERATION_FAILED";
      await updateAgentJob(jobId, { status: "error", errorCode: code });
    }
  })();
  return { ok: true, data: { status: "accepted", jobId, clientId } };
}

export async function runAutonomyAction(input: {
  actor: AutonomyActor;
  action: string;
  payload: Record<string, unknown>;
  requestId: string;
  playbookId?: string | null;
  runId?: string | null;
}): Promise<ActionResult> {
  const { actor, action, payload, requestId } = input;
  const playbookId =
    input.playbookId ||
    (typeof payload.playbook === "string"
      ? payload.playbook
      : typeof payload.playbookId === "string"
        ? payload.playbookId
        : null);
  const runId =
    input.runId ||
    (typeof payload.runId === "string"
      ? payload.runId
      : typeof payload.run_id === "string"
        ? payload.run_id
        : null);
  let entityType: string | null = null;
  let entityId: string | null = null;
  try {
    if (AGENT_MUTATIONS.has(action) && !(await readAutomationEnabled())) {
      await writeAuditLog({
        requestId,
        actor,
        action,
        playbookId,
        runId,
        result: "denied",
        errorCode: "AUTOMATION_PAUSED",
      });
      return {
        ok: false,
        status: 503,
        code: "AUTOMATION_PAUSED",
        message: "Automation is paused. Human UI is still live.",
      };
    }
    const result = await execute(actor, action, payload);
    if (result.ok) {
      const meta = result.data as { id?: string; clientId?: string } | null;
      entityId = meta && typeof meta === "object" ? (meta.id ?? meta.clientId ?? null) : null;
      entityType = guessEntity(action);
      await writeAuditLog({
        requestId,
        actor,
        action,
        entityType,
        entityId,
        playbookId,
        runId,
        result: "ok",
      });
      if (AGENT_MUTATIONS.has(action)) {
        void import("@/lib/server/safety-hooks.server")
          .then((mod) =>
            mod.onHermesPrivileged({
              actorId: actor.keyId ?? actor.source,
              action,
              requestId,
              entityType,
              entityId,
              summary: `Hermes ${action}`,
            }),
          )
          .catch(() => {});
      }
      if (runId) {
        void import("@/lib/server/skill-distill.server")
          .then((mod) =>
            mod.maybeDistillSkillFromRun({
              runId,
              playbookId,
              actorLabel: actor.label,
            }),
          )
          .catch(() => {});
      }
    } else if (result.code === "FORBIDDEN") {
      await writeAuditLog({
        requestId,
        actor,
        action,
        playbookId,
        runId,
        result: "denied",
        errorCode: result.code,
      });
    } else {
      await writeAuditLog({
        requestId,
        actor,
        action,
        playbookId,
        runId,
        result: "error",
        errorCode: result.code,
      });
    }
    return result;
  } catch (error) {
    const code = error instanceof Error ? error.message : "DATA_UNAVAILABLE";
    await writeAuditLog({
      requestId,
      actor,
      action,
      entityType,
      entityId,
      playbookId,
      runId,
      result: code === "FORBIDDEN" || code === "UNAUTHORIZED" ? "denied" : "error",
      errorCode: code.slice(0, 80),
    });
    return mapError(code);
  }
}

function guessEntity(action: string): string | null {
  if (action.startsWith("library.")) return "media_asset";
  if (action.startsWith("linear.")) return "linear_issue";
  if (action.startsWith("skills.") || action === "tasks.get") return "skill";
  if (action === "list_addons") return "addon";
  if (action.includes("llm")) return "llm";
  if (action.includes("payment")) return "payment";
  if (action.includes("lead")) return "lead";
  if (action.includes("client") || action.includes("progress") || action.includes("analytics") || action.includes("suggested"))
    return "client";
  if (action.includes("dashboard")) return "dashboard";
  return null;
}

function mapError(code: string): ActionResult {
  const friendly: Record<string, { status: number; message: string }> = {
    UNAUTHORIZED: { status: 401, message: "Invalid or revoked credentials." },
    FORBIDDEN: { status: 403, message: "This key cannot perform that action." },
    RATE_LIMITED: { status: 429, message: "Too many requests. Retry shortly." },
    CLIENT_MISSING: { status: 404, message: "That client is no longer available." },
    PAYMENT_MISSING: { status: 404, message: "That payment is no longer available." },
    PAYMENT_ALREADY_PAID: { status: 409, message: "That payment was already marked paid." },
    LEAD_MISSING: { status: 404, message: "That lead is no longer available." },
    AI_UNAVAILABLE: { status: 503, message: "AI isn’t connected yet." },
    YOUTUBE_KEY_MISSING: { status: 503, message: "YouTube Data API isn’t connected yet." },
    YOUTUBE_UNAVAILABLE: { status: 502, message: "Couldn’t read that YouTube channel." },
    CHANNEL_MISSING: { status: 400, message: "Add a YouTube channel URL first." },
    INVALID_YOUTUBE_URL: { status: 400, message: "Use a valid YouTube channel URL." },
    VALIDATION: { status: 400, message: "The request body didn’t match the expected fields." },
    YOUTUBE_CHANNEL_NOT_FOUND: { status: 400, message: "Couldn’t resolve that YouTube channel." },
    GENERATION_FAILED: { status: 502, message: "Generation didn’t finish. Try again." },
    AI_RATE_LIMIT: { status: 429, message: "AI is rate-limited. Retry shortly." },
    CUSTOM_PLAN_LABEL: { status: 400, message: "Custom plans need a short label." },
    CUSTOM_FEE: { status: 400, message: "Custom monthly fee must be a multiple of 1,000." },
    JOB_MISSING: { status: 404, message: "That job is no longer available." },
    DATA_UNAVAILABLE: { status: 503, message: "Workspace data isn’t reachable." },
    AUTOMATION_PAUSED: { status: 503, message: "Automation is paused. Human UI is still live." },
    HUMAN_REQUIRED: { status: 403, message: "That change needs a human operator." },
    MACHINE_STOPPED: { status: 409, message: "Start the Social Machine first. It stays off until started." },
    DAYTONA_UNAVAILABLE: { status: 503, message: "Daytona isn’t connected yet." },
    UPLOAD_IN_PROGRESS: { status: 409, message: "Another social upload is already running." },
    ASSET_MISSING: { status: 404, message: "That asset isn’t eligible for upload." },
    ASSET_NOT_READY: { status: 409, message: "That library asset is still processing." },
    CAPTION_ENGINE_MISSING: { status: 503, message: "Connect transcription or upload an SRT." },
    CAPTION_NOT_READY: { status: 409, message: "Captions aren’t ready yet." },
    SRT_INVALID: { status: 400, message: "That SRT couldn’t be parsed." },
    FFMPEG_UNAVAILABLE: { status: 503, message: "The render worker isn’t available." },
    RENDER_FAILED: { status: 502, message: "The render didn’t finish." },
    LIBRARY_KIND_UNSUPPORTED: { status: 400, message: "That asset kind doesn’t support this action." },
    UNTRUSTED_URL: { status: 400, message: "That URL isn’t on the import allowlist." },
    MEDIA_TOO_LARGE: { status: 400, message: "That file is larger than the upload limit." },
    POST_MISSING: { status: 404, message: "That social post is no longer available." },
    JOB_CANCELLED: { status: 409, message: "That upload job was cancelled." },
    PLATFORM_NEEDS_LOGIN: { status: 409, message: "That platform needs a human login first." },
    COMPUTER_USE_UNAVAILABLE: { status: 503, message: "The desktop stack isn’t available on the Social Machine." },
    AUTO_STOP_INVALID: { status: 400, message: "Auto-stop must be between 5 and 240 minutes." },
    UNTRUSTED_IMAGE: { status: 400, message: "That media URL can’t be used here." },
    AI_TIER_GATED: {
      status: 403,
      message:
        "SuperGrok OAuth is connected, but this account’s tier cannot run inference. Use the metered xAI API key.",
    },
    SKILL_MISSING: { status: 404, message: "That skill is no longer available." },
    SKILL_DISABLED: { status: 409, message: "That skill is disabled." },
    SKILL_PENDING: { status: 409, message: "That skill is waiting for human approval." },
    SKILL_EXEC_FAILED: { status: 502, message: "The skill didn’t finish in the sandbox." },
    SKILL_TOO_LARGE: { status: 400, message: "That skill script is too large to run." },
    APPROVAL_MISSING: { status: 404, message: "That approval request is no longer available." },
    APPROVAL_NOT_PENDING: { status: 409, message: "That request was already decided." },
    APPROVAL_FORBIDDEN: { status: 403, message: "This key cannot decide that approval." },
    SELF_APPROVE_DENIED: { status: 403, message: "Self-approve is off. Another admin must sign off." },
    APPROVAL_EXPIRED: { status: 409, message: "That approval request expired." },
    AWAITING_APPROVAL: { status: 409, message: "That job is waiting for human approval." },
    ADDON_MISSING: { status: 404, message: "That add-on isn’t installed." },
    ADDON_INVALID: { status: 400, message: "That add-on manifest isn’t valid." },
    LINEAR_NOT_CONFIGURED: { status: 503, message: "Linear isn’t connected yet." },
    LINEAR_UNAUTHORIZED: { status: 401, message: "Linear rejected that token. Reconnect in Settings." },
    LINEAR_UNAVAILABLE: { status: 502, message: "Linear didn’t respond. The Agency job is unchanged." },
    LINEAR_RATE_LIMIT: { status: 429, message: "Linear rate limit. Retry shortly." },
    LINEAR_TEAM_REQUIRED: { status: 400, message: "Select a Linear team in Settings first." },
    LINEAR_PROJECT_REQUIRED: { status: 400, message: "Select a Linear project in Settings first." },
    LINEAR_ISSUE_MISSING: { status: 404, message: "That Linear issue isn’t linked." },
    LINEAR_OAUTH_APP_MISSING: { status: 400, message: "Save a Linear OAuth client ID and secret first." },
  };
  const hit = friendly[code] ?? { status: 400, message: "The request could not be completed." };
  return { ok: false, status: hit.status, code, message: hit.message };
}

async function execute(
  actor: AutonomyActor,
  action: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  switch (action) {
    case "list_clients": {
      if (!need(actor, "read")) return deny();
      const includeChurned = payload.includeChurned === true;
      const search = typeof payload.search === "string" ? payload.search.trim().toLowerCase() : "";
      const status = payload.status === "CHURNED" || payload.status === "ACTIVE" ? payload.status : null;
      const [clients, progress] = await Promise.all([readClients(), readProgress()]);
      const latest = new Map<string, { stage: string; source: string }>();
      for (const row of progress) {
        if (!latest.has(row.clientId)) latest.set(row.clientId, { stage: row.stage, source: row.source });
      }
      const rows = clients
        .filter((client) => (includeChurned ? true : isActiveClient(client)))
        .filter((client) => (status ? client.status === status : true))
        .filter((client) =>
          search ? `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(search) : true,
        )
        .map((client) => ({
          ...publicClient(client),
          currentStage: latest.get(client.id)?.stage ?? null,
          currentSource: latest.get(client.id)?.source ?? null,
        }));
      return { ok: true, data: { clients: rows } };
    }
    case "get_client": {
      if (!need(actor, "read")) return deny();
      const id = String(payload.id ?? payload.clientId ?? "");
      if (!id) return mapError("VALIDATION");
      const [clients, progress, snapshots] = await Promise.all([
        readClients(),
        readProgress(),
        readSnapshots(),
      ]);
      const client = clients.find((row) => row.id === id);
      if (!client || client.deletedAt) return mapError("CLIENT_MISSING");
      const history = progress.filter((row) => row.clientId === id);
      const latestSnap = snapshots
        .filter((row) => row.clientId === id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        ok: true,
        data: {
          ...publicClient(client),
          currentStage: history[0]?.stage ?? null,
          currentSource: history[0]?.source ?? null,
          progress: history.slice(0, 20).map((row) => ({
            id: row.id,
            stage: row.stage,
            source: row.source,
            notes: row.notes,
            createdAt: row.createdAt,
          })),
          latestAnalytics: latestSnap
            ? {
                date: latestSnap.date,
                views: latestSnap.views,
                subscribers: latestSnap.subscribers,
              }
            : null,
        },
      };
    }
    case "create_client": {
      if (!need(actor, "write:clients")) return deny();
      const name = String(payload.name ?? "").trim();
      if (!name) return mapError("VALIDATION");
      const planType = (PLAN_TYPES as readonly string[]).includes(String(payload.planType))
        ? (payload.planType as PlanType)
        : "TEAM_ONLY";
      const channelUrl = typeof payload.channelUrl === "string" ? payload.channelUrl : null;
      let extras = {
        channelThumbnail: null as string | null,
        channelSummary: null as string | null,
        offers: null as string | null,
        contentStrategy: null as string | null,
      };
      if (channelUrl) {
        try {
          const { llmAvailable, synthesizeChannel } = await import("@/lib/server/analyze.server");
          if (await llmAvailable()) {
            const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
            const snapshot = await fetchChannelSnapshot(channelUrl);
            const synthesis = await synthesizeChannel(snapshot);
            extras = {
              channelThumbnail: snapshot.thumbnail,
              channelSummary: synthesis.channelSummary,
              offers: synthesis.offers,
              contentStrategy: synthesis.contentStrategy,
            };
          }
        } catch {
          /* store the URL even if analysis isn't available */
        }
      }
      const created = await internalSaveClient(
        {
          name,
          channelUrl,
          channelThumbnail: extras.channelThumbnail,
          channelSummary: extras.channelSummary,
          offers: extras.offers,
          contentStrategy: extras.contentStrategy,
          planType,
          customPlanLabel: typeof payload.customPlanLabel === "string" ? payload.customPlanLabel : null,
          setupFee: DEFAULT_SETUP_FEE,
          monthlyFee: DEFAULT_MONTHLY_FEE[planType],
          startDate: typeof payload.startDate === "string" ? payload.startDate : todayIsoDate(),
          notes: typeof payload.notes === "string" ? payload.notes : null,
        },
        `agent:${actor.keyId ?? actor.source}`,
        "AGENT",
      );
      void emitAutonomyEvent({
        type: "client.created",
        entityType: "client",
        entityId: created.id,
        data: { name },
      });
      return { ok: true, data: { id: created.id } };
    }
    case "update_client": {
      if (!need(actor, "write:clients")) return deny();
      const id = String(payload.id ?? payload.clientId ?? "");
      if (!id) return mapError("VALIDATION");
      const clients = await readClients();
      const client = clients.find((row) => row.id === id);
      if (!client) return mapError("CLIENT_MISSING");
      if (String(payload.status) === "CHURNED") return mapError("HUMAN_REQUIRED");
      const status = payload.status === "ACTIVE" ? "ACTIVE" : undefined;
      await patchClientLimited({
        id,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        status,
      });
      if (status && status !== client.status) {
        void emitAutonomyEvent({
          type: "client.status_changed",
          entityType: "client",
          entityId: id,
          data: { status },
        });
      }
      return { ok: true, data: { id } };
    }
    case "list_payments": {
      if (!need(actor, "read")) return deny();
      const today = todayIsoDate();
      const clientId = typeof payload.clientId === "string" ? payload.clientId : null;
      const [payments, clients] = await Promise.all([readPayments(), readClients()]);
      const names = new Map(clients.map((row) => [row.id, row.name]));
      const rows = payments
        .filter((payment) => (clientId ? payment.clientId === clientId : true))
        .map((payment) => ({
          id: payment.id,
          clientId: payment.clientId,
          clientName: names.get(payment.clientId) ?? null,
          amount: asMoney(payment.amount),
          type: payment.type,
          dueDate: payment.dueDate,
          paidDate: payment.paidDate,
          status: payment.status,
          displayStatus: displayPaymentStatus(payment, today),
        }));
      return { ok: true, data: { payments: rows } };
    }
    case "mark_payment_paid": {
      if (!need(actor, "write:payments")) return deny();
      const id = String(payload.id ?? payload.paymentId ?? "");
      if (!id) return mapError("VALIDATION");
      const result = await internalMarkPaymentPaid(id);
      void emitAutonomyEvent({
        type: "payment.collected",
        entityType: "payment",
        entityId: id,
        data: { paidDate: result.paidDate },
      });
      void import("@/lib/server/safety-hooks.server")
        .then((mod) =>
          mod.onPaymentMarkedPaid({
            actorId: actor.keyId ?? actor.source,
            paymentId: id,
          }),
        )
        .catch(() => {});
      return { ok: true, data: { id, paidDate: result.paidDate } };
    }
    case "get_client_progress": {
      if (!need(actor, "read")) return deny();
      const id = String(payload.id ?? payload.clientId ?? "");
      if (!id) return mapError("VALIDATION");
      const progress = (await readProgress()).filter((row) => row.clientId === id);
      return {
        ok: true,
        data: {
          clientId: id,
          current: progress[0] ?? null,
          history: progress.slice(0, 30),
        },
      };
    }
    case "set_client_stage": {
      if (!need(actor, "write:progress")) return deny();
      const clientId = String(payload.clientId ?? payload.id ?? "");
      const stage = String(payload.stage ?? "");
      if (!clientId || !(PROGRESS_STAGES as readonly string[]).includes(stage)) {
        return mapError("VALIDATION");
      }
      const notes = typeof payload.notes === "string" ? payload.notes : null;
      const written = await internalSetClientStage({
        clientId,
        stage: stage as ProgressStage,
        source: "AGENT",
        notes,
        actorId: `agent:${actor.keyId ?? actor.source}`,
      });
      void emitAutonomyEvent({
        type: "progress.stage_changed",
        entityType: "client",
        entityId: clientId,
        data: { stage, source: "AGENT" },
      });
      return { ok: true, data: { id: written.id, clientId, stage, source: "AGENT" } };
    }
    case "list_leads": {
      if (!need(actor, "read")) return deny();
      const leads = (await readLeads()).filter((lead) => !lead.deletedAt);
      return { ok: true, data: { leads, totals: deriveLeadTotals(leads) } };
    }
    case "create_lead": {
      if (!need(actor, "write:leads")) return deny();
      const name = String(payload.name ?? "").trim();
      if (!name) return mapError("VALIDATION");
      const status = (LEAD_STATUSES as readonly string[]).includes(String(payload.status))
        ? (payload.status as LeadStatus)
        : "TO_CONTACT";
      const lead = await internalSaveLead(
        {
          name,
          channelUrl: typeof payload.channelUrl === "string" ? payload.channelUrl : null,
          notes: typeof payload.notes === "string" ? payload.notes : null,
          status,
          upfrontCash: typeof payload.upfrontCash === "number" ? payload.upfrontCash : 0,
          monthlyRecurring:
            typeof payload.monthlyRecurring === "number" ? payload.monthlyRecurring : 0,
        },
        `agent:${actor.keyId ?? actor.source}`,
      );
      void emitAutonomyEvent({
        type: "lead.created",
        entityType: "lead",
        entityId: lead.id,
        data: { name: lead.name, status: lead.status },
      });
      return { ok: true, data: lead };
    }
    case "update_lead":
    case "update_lead_status": {
      if (!need(actor, "write:leads")) return deny();
      const id = String(payload.id ?? payload.leadId ?? "");
      if (!id) return mapError("VALIDATION");
      const existing = (await readLeads()).find((lead) => lead.id === id && !lead.deletedAt);
      if (!existing) return mapError("LEAD_MISSING");
      const status = (LEAD_STATUSES as readonly string[]).includes(String(payload.status))
        ? (payload.status as LeadStatus)
        : existing.status;
      const lead = await internalSaveLead(
        {
          id,
          name: typeof payload.name === "string" ? payload.name : existing.name,
          channelUrl:
            typeof payload.channelUrl === "string" ? payload.channelUrl : existing.channelUrl,
          notes: typeof payload.notes === "string" ? payload.notes : existing.notes,
          status,
          upfrontCash:
            typeof payload.upfrontCash === "number"
              ? payload.upfrontCash
              : asMoney(existing.upfrontCash),
          monthlyRecurring:
            typeof payload.monthlyRecurring === "number"
              ? payload.monthlyRecurring
              : asMoney(existing.monthlyRecurring),
        },
        `agent:${actor.keyId ?? actor.source}`,
      );
      if (status !== existing.status) {
        void emitAutonomyEvent({
          type: "lead.status_changed",
          entityType: "lead",
          entityId: id,
          data: { status },
        });
      }
      return { ok: true, data: lead };
    }
    case "pull_client_analytics":
    case "pull_analytics": {
      if (!need(actor, "read")) return deny();
      const clientId = String(payload.clientId ?? payload.id ?? "");
      if (!clientId) return mapError("VALIDATION");
      const { youtubeDataApiAvailable } = await import("@/lib/server/youtube-data.server");
      if (!(await youtubeDataApiAvailable())) throw new Error("YOUTUBE_KEY_MISSING");
      const clients = await readClients();
      const client = clients.find((row) => row.id === clientId && isActiveClient(row));
      if (!client) return mapError("CLIENT_MISSING");
      const snapshot = await persistPull({
        client,
        userId: `agent:${actor.keyId ?? actor.source}`,
      });
      void emitAutonomyEvent({
        type: "analytics.snapshot_created",
        entityType: "client",
        entityId: clientId,
        data: { date: snapshot.date },
      });
      const atRisk = deriveGuaranteeItems([client], [snapshot], todayIsoDate());
      if (atRisk[0] && atRisk[0].dayCount >= 25) {
        void emitAutonomyEvent({
          type: "client.at_risk_30d",
          entityType: "client",
          entityId: clientId,
          data: { dayCount: atRisk[0].dayCount, views: snapshot.views },
        });
      }
      return { ok: true, data: snapshot };
    }
    case "get_analytics_snapshot": {
      if (!need(actor, "read")) return deny();
      const clientId = String(payload.clientId ?? payload.id ?? "");
      if (!clientId) return mapError("VALIDATION");
      const snapshots = (await readSnapshots())
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          id: row.id,
          date: row.date,
          views: row.views,
          subscribers: row.subscribers,
          watchHours: row.watchHours,
          impressionsCtr: row.impressionsCtr,
        }));
      return { ok: true, data: { snapshots } };
    }
    case "analytics.refresh_post_performance": {
      if (!need(actor, "read")) return deny();
      const fetch = await import("@/lib/server/performance-fetch.server");
      if (payload.sweep === true || !payload.socialPostId) {
        const due = await fetch.sweepDuePerformanceFetches(12);
        const stale = await fetch.sweepStalePublishedPosts();
        const { distillWinnersToProposals } = await import("@/lib/server/knowledge-proposals.server");
        const distilled = await distillWinnersToProposals(
          `agent:${actor.keyId ?? actor.source}`,
          3,
        ).catch(() => 0);
        return { ok: true, data: { due, stale, distilled } };
      }
      const result = await fetch.refreshPostById(String(payload.socialPostId), `agent:${actor.keyId ?? actor.source}`);
      if (!result.ok) return mapError(result.reason ?? "METRICS_UNAVAILABLE");
      return { ok: true, data: { ok: true } };
    }
    case "analytics.list_winners": {
      if (!need(actor, "read")) return deny();
      const { listWinners } = await import("@/lib/server/performance.server");
      const platform = payload.platform ? String(payload.platform) : undefined;
      const winners = await listWinners({
        clientId: payload.clientId ? String(payload.clientId) : undefined,
        platform: platform as "X" | "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "OTHER" | undefined,
      });
      return {
        ok: true,
        data: {
          winners: winners.map((row) => ({
            id: row.id,
            platform: row.platform,
            externalPostId: row.externalPostId,
            externalUrl: row.externalUrl,
            score: row.score,
            verdict: row.verdict,
            views: row.metrics.views,
            engagementRate: row.engagementRate,
            clientId: row.clientId,
            mediaAssetId: row.mediaAssetId,
            capturedAt: row.capturedAt,
            window: row.window,
          })),
        },
      };
    }
    case "knowledge.list_proposals": {
      if (!need(actor, "read")) return deny();
      const { listKnowledgeProposals } = await import("@/lib/server/knowledge-proposals.server");
      const status = payload.status ? String(payload.status) : undefined;
      const items = await listKnowledgeProposals({
        status: status as "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "MERGED" | undefined,
        clientId: payload.clientId ? String(payload.clientId) : undefined,
      });
      return {
        ok: true,
        data: {
          items: items.map((row) => ({
            id: row.id,
            status: row.status,
            suggestedScope: row.suggestedScope,
            learnedPrincipleDraft: row.learnedPrincipleDraft,
            confidence: row.confidence,
            clientId: row.clientId,
            createdAt: row.createdAt,
          })),
        },
      };
    }
    case "knowledge.decide_proposal": {
      if (!need(actor, "approvals:admin")) return deny();
      const id = String(payload.id ?? "");
      const decision = String(payload.decision ?? "").toUpperCase();
      if (!id || (decision !== "APPROVED" && decision !== "REJECTED")) return mapError("VALIDATION");
      const { decideProposal } = await import("@/lib/server/knowledge-proposals.server");
      const row = await decideProposal({
        id,
        decision: decision as "APPROVED" | "REJECTED",
        actorId: `agent:${actor.keyId ?? actor.source}`,
        note: payload.note ? String(payload.note) : null,
      });
      return { ok: true, data: { id: row.id, status: row.status, mergedEntryId: row.mergedEntryId } };
    }
    case "get_dashboard_snapshot": {
      if (!need(actor, "read")) return deny();
      return { ok: true, data: await dashboardSnapshot() };
    }
    case "list_at_risk_clients": {
      if (!need(actor, "read")) return deny();
      const dash = await dashboardSnapshot();
      return { ok: true, data: { clients: dash.atRisk } };
    }
    case "regenerate_suggested_titles": {
      if (!need(actor, "actions:ai")) return deny();
      const clientId = String(payload.clientId ?? payload.id ?? "");
      if (!clientId) return mapError("VALIDATION");
      return enqueueAiJob(actor, "suggested_titles", clientId, () =>
        internalGenerateSuggestedTitles(clientId),
      );
    }
    case "regenerate_suggested_ideas": {
      if (!need(actor, "actions:ai")) return deny();
      const clientId = String(payload.clientId ?? payload.id ?? "");
      if (!clientId) return mapError("VALIDATION");
      return enqueueAiJob(actor, "suggested_ideas", clientId, () =>
        internalGenerateSuggestedIdeas(clientId),
      );
    }
    case "get_job": {
      if (!need(actor, "read")) return deny();
      const id = String(payload.id ?? payload.jobId ?? "");
      if (!id) return mapError("VALIDATION");
      const job = await readAgentJob(id);
      if (!job) return mapError("JOB_MISSING");
      return { ok: true, data: job };
    }
    case "get_integration_status": {
      if (!need(actor, "read")) return deny();
      const { llmStatus } = await import("@/lib/server/xai.server");
      const { higgsfieldAvailable } = await import("@/lib/server/higgsfield.server");
      const { youtubeDataApiAvailable } = await import("@/lib/server/youtube-data.server");
      const { loadDiscordToken } = await import("@/lib/server/discord.server");
      const { readAppSetting } = await import("@/lib/server/app-settings.server");
      const [llm, hf, yt, discord, notion, daytona, xPub, linear] = await Promise.all([
        llmStatus(),
        higgsfieldAvailable(),
        youtubeDataApiAvailable(),
        loadDiscordToken(),
        readAppSetting("NOTION_TOKEN"),
        readAppSetting("DAYTONA_API_KEY"),
        import("@/lib/server/x-publisher.server")
          .then((mod) => mod.isConfigured())
          .catch(() => false),
        import("@/lib/server/linear.server")
          .then((mod) => mod.linearEnabledAndReady())
          .catch(() => false),
      ]);
      return {
        ok: true,
        data: {
          ai: llm.available ? "connected" : "not_configured",
          higgsfield: hf ? "connected" : "not_configured",
          youtube: yt ? "connected" : "not_configured",
          discord: discord ? "connected" : "not_configured",
          notion: notion ? "connected" : "not_configured",
          x: xPub ? "connected" : "not_configured",
          daytona: daytona ? "connected" : "not_configured",
          linear: linear ? "connected" : "not_configured",
        },
      };
    }
    case "get_playbook_catalog": {
      if (!need(actor, "read")) return deny();
      return {
        ok: true,
        data: {
          playbooks: HERMES_PLAYBOOKS,
          policies: await readPlaybookPolicies(),
          automationEnabled: await readAutomationEnabled(),
        },
      };
    }
    case "get_connect_status": {
      if (!need(actor, "read")) return deny();
      const { buildConnectStatus } = await import("@/lib/server/hermes-connect.server");
      return { ok: true, data: await buildConnectStatus() };
    }
    case "get_playbook_package": {
      if (!need(actor, "read")) return deny();
      const { buildPlaybookPackageText } = await import("@/lib/server/hermes-connect.server");
      const origin = typeof payload.origin === "string" ? payload.origin : undefined;
      return { ok: true, data: await buildPlaybookPackageText(origin) };
    }
    case "approvals.list_pending": {
      if (!need(actor, "read")) return deny();
      const { listApprovalRequests } = await import("@/lib/server/approvals.server");
      const items = await listApprovalRequests({ status: "PENDING", limit: 40 });
      return {
        ok: true,
        data: {
          items: items.map((row) => ({
            id: row.id,
            type: row.type,
            status: row.status,
            title: row.title,
            summary: row.summary,
            clientId: row.clientId,
            resourceType: row.resourceType,
            resourceId: row.resourceId,
            createdAt: row.createdAt,
            requestedBy: row.requestedBy,
          })),
        },
      };
    }
    case "approvals.decide": {
      const adminScope = hasScope(actor.scopes, "approvals:admin");
      if (!adminScope) return deny();
      const id = String(payload.id ?? payload.approvalId ?? "");
      const decisionRaw = String(payload.decision ?? payload.status ?? "").toUpperCase();
      const decision =
        decisionRaw === "APPROVED" || decisionRaw === "REJECTED" || decisionRaw === "CANCELED"
          ? decisionRaw
          : null;
      if (!id || !decision) return mapError("VALIDATION");
      const { decideApproval } = await import("@/lib/server/approvals.server");
      const item = await decideApproval({
        id,
        actorId: `agent:${actor.keyId ?? actor.source}`,
        decision,
        note: typeof payload.note === "string" ? payload.note : null,
        hermesAdmin: adminScope,
      });
      return { ok: true, data: { id: item.id, status: item.status } };
    }
    case "skills.list": {
      if (!need(actor, "read")) return deny();
      const { listPublicSkills, publicSkillSummary } = await import("@/lib/server/skills.server");
      const skills = await listPublicSkills();
      return { ok: true, data: { skills: skills.map(publicSkillSummary) } };
    }
    case "skills.get": {
      if (!need(actor, "read")) return deny();
      const id = String(payload.id ?? payload.skillId ?? "");
      if (!id) return mapError("VALIDATION");
      const { getSkillById, publicSkillMcpGet } = await import("@/lib/server/skills.server");
      const skill = await getSkillById(id);
      if (!skill) return mapError("SKILL_MISSING");
      if (skill.status === "pending_review" || skill.status === "archived" || !skill.enabled) {
        if (skill.status === "pending_review") return mapError("SKILL_PENDING");
        if (!skill.enabled || skill.status === "disabled") return mapError("SKILL_DISABLED");
      }
      return { ok: true, data: publicSkillMcpGet(skill) };
    }
    case "skills.invoke": {
      if (!need(actor, "skills:execute")) return deny();
      const id = String(payload.id ?? payload.skillId ?? "");
      if (!id) return mapError("VALIDATION");
      const args =
        payload.args && typeof payload.args === "object" && !Array.isArray(payload.args)
          ? (payload.args as Record<string, unknown>)
          : payload.arguments && typeof payload.arguments === "object"
            ? (payload.arguments as Record<string, unknown>)
            : {};
      const { invokeSkillInternal } = await import("@/lib/server/skills.server");
      const result = await invokeSkillInternal({
        skillId: id,
        args,
        actorId: actor.keyId ?? actor.source,
      });
      return {
        ok: true,
        data: {
          taskId: result.taskId,
          run: result.run,
          skill: {
            id: result.skill.id,
            slug: result.skill.slug,
            name: result.skill.name,
            version: result.skill.version,
          },
        },
      };
    }
    case "skills.create": {
      if (!need(actor, "skills:manage")) return deny();
      const skillMd = String(payload.skillMd ?? payload.markdown ?? "");
      if (skillMd.length < 10) return mapError("VALIDATION");
      const { createSkillInternal } = await import("@/lib/server/skills.server");
      const { readPlaybookPolicies } = await import("@/lib/server/autonomy-policy.server");
      const policies = await readPlaybookPolicies();
      const provenance = payload.provenance === "human" ? "human" : "agent";
      const scripts =
        payload.scripts && typeof payload.scripts === "object"
          ? (payload.scripts as Record<string, string>)
          : undefined;
      const skill = await createSkillInternal({
        skillMd,
        scripts,
        provenance,
        createdBy: actor.label,
        autoPublish: provenance === "agent" ? policies.skillsAutoPublishAgent === true : true,
      });
      return { ok: true, data: skill };
    }
    case "skills.patch": {
      if (!need(actor, "skills:manage")) return deny();
      const id = String(payload.id ?? payload.skillId ?? "");
      if (!id) return mapError("VALIDATION");
      const { patchSkillInternal } = await import("@/lib/server/skills.server");
      const skill = await patchSkillInternal({
        id,
        skillMd: typeof payload.skillMd === "string" ? payload.skillMd : undefined,
        enabled: typeof payload.enabled === "boolean" ? payload.enabled : undefined,
      });
      return { ok: true, data: skill };
    }
    case "skills.set_enabled": {
      if (!need(actor, "skills:manage")) return deny();
      const id = String(payload.id ?? payload.skillId ?? "");
      if (!id) return mapError("VALIDATION");
      const enabled = payload.enabled !== false;
      const { patchSkillInternal } = await import("@/lib/server/skills.server");
      const skill = await patchSkillInternal({ id, enabled });
      return { ok: true, data: skill };
    }
    case "tasks.get": {
      if (!need(actor, "read")) return deny();
      const id = String(payload.id ?? payload.taskId ?? payload.jobId ?? "");
      if (!id) return mapError("VALIDATION");
      const { getSkillRun } = await import("@/lib/server/skills.server");
      const run = await getSkillRun(id);
      if (run) return { ok: true, data: { kind: "skill" as const, task: run } };
      const job = await readAgentJob(id);
      if (!job) return mapError("JOB_MISSING");
      return { ok: true, data: { kind: "job" as const, task: job } };
    }
    case "list_addons": {
      if (!need(actor, "read")) return deny();
      const { buildAddonsSnapshot } = await import("@/lib/server/addons.server");
      const snap = await buildAddonsSnapshot();
      return {
        ok: true,
        data: {
          generation: snap.generation,
          addons: snap.items.map((row) => ({
            id: row.manifest.id,
            name: row.manifest.name,
            version: row.manifest.version,
            type: row.manifest.type,
            enabled: row.state.enabled,
            source: row.state.source,
            permissions: row.manifest.permissions,
            usedBy: row.manifest.usedBy,
            skills: row.manifest.skills,
          })),
        },
      };
    }
    case "get_llm_providers": {
      if (!need(actor, "read")) return deny();
      const { buildLlmSnapshot } = await import("@/lib/server/llm-router.server");
      return { ok: true, data: await buildLlmSnapshot() };
    }
    case "linear.get_status": {
      if (!need(actor, "read") && !need(actor, "linear:read")) return deny();
      const { getLinearStatusForHermes, sweepLinearQueue } = await import("@/lib/server/linear.server");
      void sweepLinearQueue(4).catch(() => 0);
      return { ok: true, data: await getLinearStatusForHermes() };
    }
    case "linear.create_issue": {
      if (!need(actor, "linear:write") && !need(actor, "write:social")) return deny();
      const title = String(payload.title ?? "").trim();
      if (title.length < 3) return mapError("VALIDATION");
      const { createLinearIssue } = await import("@/lib/server/linear.server");
      const { isLinearEntityType } = await import("@/lib/linear");
      const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? (payload.linkTo as { type?: string; id?: string }) : null;
      const result = await createLinearIssue({
        title,
        description: typeof payload.description === "string" ? payload.description : null,
        state: typeof payload.state === "string" ? payload.state : "backlog",
        labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
        priority: typeof payload.priority === "number" ? payload.priority : 0,
        projectId: typeof payload.projectId === "string" ? payload.projectId : null,
        linkTo:
          linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id
            ? { type: linkRaw.type, id: String(linkRaw.id) }
            : null,
        actorId: actor.keyId ?? actor.source,
      });
      return { ok: true, data: result };
    }
    case "linear.update_issue": {
      if (!need(actor, "linear:write") && !need(actor, "write:social")) return deny();
      const { updateLinearIssue } = await import("@/lib/server/linear.server");
      const { isLinearEntityType } = await import("@/lib/linear");
      const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? (payload.linkTo as { type?: string; id?: string }) : null;
      const result = await updateLinearIssue({
        issueId: typeof payload.issueId === "string" ? payload.issueId : typeof payload.id === "string" ? payload.id : undefined,
        state: typeof payload.state === "string" ? payload.state : null,
        labels: Array.isArray(payload.labels) ? payload.labels.map(String) : undefined,
        comment: typeof payload.comment === "string" ? payload.comment : null,
        linkTo:
          linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id
            ? { type: linkRaw.type, id: String(linkRaw.id) }
            : null,
        actorId: actor.keyId ?? actor.source,
      });
      return { ok: true, data: result };
    }
    case "linear.find_issues": {
      if (!need(actor, "read") && !need(actor, "linear:read")) return deny();
      const term = String(payload.term ?? payload.text ?? payload.query ?? "").trim();
      const { findLinearIssues } = await import("@/lib/server/linear.server");
      return { ok: true, data: { items: await findLinearIssues(term) } };
    }
    default: {
      if (action.startsWith("skill_manage.")) {
        if (!need(actor, "skills:manage")) return deny();
        const skills = await import("@/lib/server/skills.server");
        const { readPlaybookPolicies } = await import("@/lib/server/autonomy-policy.server");
        const policies = await readPlaybookPolicies();
        const id = String(payload.id ?? payload.skillId ?? "");
        try {
          if (action === "skill_manage.create") {
            const skill = await skills.skillManageCreate({
              payload,
              actor: actor.label,
              autoPublish: payload.provenance === "human" ? true : policies.skillsAutoPublishAgent === true,
            });
            return { ok: true, data: skill };
          }
          if (action === "skill_manage.edit") {
            if (!id) return mapError("VALIDATION");
            const scripts =
              payload.scripts && typeof payload.scripts === "object"
                ? (payload.scripts as Record<string, string>)
                : undefined;
            return {
              ok: true,
              data: await skills.skillManageEdit({
                id,
                skillMd: typeof payload.skill_md === "string" ? payload.skill_md : typeof payload.skillMd === "string" ? payload.skillMd : undefined,
                scripts,
              }),
            };
          }
          if (action === "skill_manage.patch") {
            if (!id) return mapError("VALIDATION");
            return {
              ok: true,
              data: await skills.skillManagePatch({
                id,
                path: typeof payload.path === "string" ? payload.path : undefined,
                find: String(payload.find ?? ""),
                replace: String(payload.replace ?? ""),
              }),
            };
          }
          if (action === "skill_manage.write_file") {
            if (!id) return mapError("VALIDATION");
            return {
              ok: true,
              data: await skills.skillManageWriteFile({
                id,
                path: String(payload.path ?? ""),
                content: String(payload.content ?? ""),
              }),
            };
          }
          if (action === "skill_manage.set_enabled") {
            if (!id) return mapError("VALIDATION");
            return {
              ok: true,
              data: await skills.patchSkillInternal({ id, enabled: payload.enabled !== false }),
            };
          }
          if (action === "skill_manage.set_provenance_review") {
            if (!id) return mapError("VALIDATION");
            const decision = payload.decision === "reject" ? "reject" : "approve";
            return { ok: true, data: await skills.skillManageSetProvenanceReview({ id, decision }) };
          }
          if (action === "skill_manage.list_versions") {
            if (!id) return mapError("VALIDATION");
            return { ok: true, data: { versions: await skills.listSkillVersions(id) } };
          }
          if (action === "skill_manage.rollback") {
            if (!id) return mapError("VALIDATION");
            return {
              ok: true,
              data: await skills.rollbackSkill({
                id,
                version: String(payload.version ?? ""),
                actor: actor.label,
              }),
            };
          }
        } catch (error) {
          const code = error instanceof Error ? error.message : "SKILL_FAILED";
          return mapError(code);
        }
        return { ok: false, status: 404, code: "UNKNOWN_ACTION", message: "Unknown action." };
      }
      if (
        action.startsWith("vision.") ||
        action.startsWith("computer.") ||
        action.startsWith("browser.") ||
        action.startsWith("clipping.")
      ) {
        const writeSocial =
          action.startsWith("computer.") ||
          action.startsWith("browser.") ||
          action === "clipping.distribute_social" ||
          action === "clipping.observe_desktop";
        const writeProgress = action === "clipping.set_stage" || action === "clipping.mark_published";
        const ai =
          action.startsWith("vision.") ||
          action === "clipping.generate_ideas" ||
          action === "clipping.generate_titles" ||
          action === "clipping.generate_thumbnail";
        if (writeSocial && !need(actor, "write:social")) return deny();
        if (writeProgress && !need(actor, "write:progress")) return deny();
        if (ai && !need(actor, "actions:ai") && !need(actor, "read")) return deny();
        if (action === "clipping.run_skill" && !need(actor, "skills:execute")) return deny();
        if (action === "clipping.propose_skill" && !need(actor, "skills:execute")) return deny();
        if (action === "clipping.research_channel" && !need(actor, "read")) return deny();
        if (
          !writeSocial &&
          !writeProgress &&
          !ai &&
          action !== "clipping.run_skill" &&
          action !== "clipping.propose_skill" &&
          action !== "clipping.research_channel"
        ) {
          if (!need(actor, "read")) return deny();
        }
        try {
          const { executeAgentTool } = await import("@/lib/server/agent-tools.server");
          const result = await executeAgentTool({
            name: action,
            payload,
            actorId: actor.keyId ?? actor.source,
          });
          return { ok: true, data: result.data };
        } catch (error) {
          const code = error instanceof Error ? error.message : "TOOL_FAILED";
          return mapError(code);
        }
      }
      if (action.startsWith("library.")) {
        const write =
          action === "library.ingest_url" ||
          action === "library.ingest_stream_clip" ||
          action === "library.ingest_thumbnail" ||
          action === "library.queue_render" ||
          action === "library.attach_to_social_job";
        if (write && !need(actor, "write:social")) return deny();
        if (!write && !need(actor, "read")) return deny();
        const { handleLibraryAction } = await import("@/lib/server/library-tools.server");
        const data = await handleLibraryAction(action, payload, `agent:${actor.keyId ?? actor.source}`);
        if (data === undefined) {
          return { ok: false, status: 404, code: "UNKNOWN_ACTION", message: "Unknown action." };
        }
        return { ok: true, data };
      }
      if (!action.startsWith("social.")) {
        return { ok: false, status: 404, code: "UNKNOWN_ACTION", message: "Unknown action." };
      }
      const write = action !== "social.get_machine_status" &&
        action !== "social.get_desktop_preview" &&
        action !== "social.list_open_windows" &&
        action !== "social.list_platforms" &&
        action !== "social.get_publisher_status" &&
        action !== "social.get_platform_status" &&
        action !== "social.list_uploadable_assets" &&
        action !== "social.resolve_asset" &&
        action !== "social.get_upload_job" &&
        action !== "social.list_upload_jobs" &&
        action !== "social.list_posts" &&
        action !== "social.get_post" &&
        action !== "social.plan_distribution" &&
        action !== "social.get_cost_guard";
      if (write && !need(actor, "write:social")) return deny();
      if (!write && !need(actor, "read")) return deny();
      const { handleSocialAction } = await import("@/lib/server/social-ops.server");
      const data = await handleSocialAction(
        action,
        payload,
        `agent:${actor.keyId ?? actor.source}`,
      );
      if (data === undefined) {
        return { ok: false, status: 404, code: "UNKNOWN_ACTION", message: "Unknown action." };
      }
      return { ok: true, data };
    }
  }
}

export { dashboardSnapshot };
