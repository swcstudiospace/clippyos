import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  CLIENT_STATUSES,
  PLAN_TYPES,
  PROGRESS_STAGES,
  type Client,
  type ClientProgress,
  type Payment,
  type PlanType,
  type ProgressStage,
  type ProgressSource,
  type TeamMember,
  type AnalyticsSnapshot,
} from "@/lib/entities";
import { sanitizeText } from "@/lib/sanitize";
import { addMonthsIso, todayIsoDate } from "@/lib/format";
import { parseYouTubeChannelUrl } from "@/lib/youtube";
import { CLIENT_ONBOARDING_STEPS, emptyClientChecklist, parseClientChecklist } from "@/lib/billing";
import {
  mapClient,
  mapPayment,
  mapProgress,
  mapSnapshot,
  mapTeamMember,
  isMissingTable,
} from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export type ClientListItem = Client & {
  currentStage: ProgressStage | null;
  currentSource: ProgressSource | null;
  currentStageAt: string | null;
};

export type ClientBundle = {
  client: Client;
  progress: ClientProgress[];
  currentStage: ProgressStage | null;
  currentSource: ProgressSource | null;
  team: TeamMember[];
  payments: Payment[];
  analytics: AnalyticsSnapshot | null;
};

const PlanSchema = z.enum(PLAN_TYPES);
const StageSchema = z.enum(PROGRESS_STAGES);

const SaveSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(200),
  channelUrl: z.string().trim().max(500).nullable(),
  channelThumbnail: z.string().trim().max(1000).nullable(),
  channelSummary: z.string().max(8000).nullable(),
  offers: z.string().max(8000).nullable(),
  contentStrategy: z.string().max(20000).nullable(),
  planType: PlanSchema,
  customPlanLabel: z.string().trim().max(120).nullable(),
  setupFee: z.number().min(0).max(1_000_000),
  monthlyFee: z.number().min(0).max(1_000_000).nullable(),
  startDate: z.string().nullable(),
  notes: z.string().max(20000).nullable(),
});

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function assertPlan(input: z.infer<typeof SaveSchema>) {
  if (input.planType === "CUSTOM") {
    if (!input.customPlanLabel) {
      throw new Error("CUSTOM_PLAN_LABEL");
    }
    const fee = input.monthlyFee ?? 0;
    if (fee < 0 || fee > 20000 || fee % 1000 !== 0) {
      throw new Error("CUSTOM_FEE");
    }
  }
}

function sanitizeNullable(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return sanitizeText(value);
}

function latestProgress(progress: ClientProgress[]): ClientProgress | null {
  if (progress.length === 0) return null;
  const sorted = [...progress].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  return sorted[0] ?? null;
}

function latestStage(progress: ClientProgress[]): ProgressStage | null {
  return latestProgress(progress)?.stage ?? null;
}

export async function readClients(): Promise<Client[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("clients")
      .select("*")
      .order("name");
    if (!error) return (data ?? []).map((row) => mapClient(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from clients order by name",
  );
  return rows.map(mapClient);
}

export async function readProgress(): Promise<ClientProgress[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("client_progress")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) return (data ?? []).map((row) => mapProgress(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from client_progress order by created_at desc",
  );
  return rows.map(mapProgress);
}

export const listClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ClientListItem[]> => {
    const [clients, progress] = await Promise.all([readClients(), readProgress()]);
    const latest = new Map<
      string,
      { stage: ProgressStage; source: ProgressSource; at: string }
    >();
    for (const row of progress) {
      if (!latest.has(row.clientId)) {
        latest.set(row.clientId, {
          stage: row.stage,
          source: row.source,
          at: row.updatedAt || row.createdAt,
        });
      }
    }
    return clients.map((client) => {
      const rec = latest.get(client.id);
      return {
        ...client,
        currentStage: rec?.stage ?? null,
        currentSource: rec?.source ?? null,
        currentStageAt: rec?.at ?? null,
      };
    });
  });

export const listProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ClientProgress[]> => {
    return readProgress();
  });

export const getClientBundle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }): Promise<ClientBundle | null> => {
    const clients = await readClients();
    const client = clients.find((row) => row.id === id) ?? null;
    if (!client) return null;
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const [progressRes, teamRes, payRes, snapRes] = await Promise.all([
        admin.from("client_progress").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        admin.from("team_members").select("*").eq("client_id", id).is("deleted_at", null),
        admin.from("payments").select("*").eq("client_id", id).order("due_date", { ascending: false }),
        admin.from("analytics_snapshots").select("*").eq("client_id", id).order("date", { ascending: false }).limit(1),
      ]);
      if (!progressRes.error && !teamRes.error && !payRes.error) {
        const progress = (progressRes.data ?? []).map((row) => mapProgress(row as Record<string, unknown>));
        return {
          client,
          progress,
          currentStage: latestStage(progress),
          currentSource: latestProgress(progress)?.source ?? null,
          team: (teamRes.data ?? []).map((row) => mapTeamMember(row as Record<string, unknown>)),
          payments: (payRes.data ?? []).map((row) => mapPayment(row as Record<string, unknown>)),
          analytics: snapRes.data?.[0]
            ? mapSnapshot(snapRes.data[0] as Record<string, unknown>)
            : null,
        };
      }
      if (
        ![progressRes.error, teamRes.error, payRes.error, snapRes.error].every(
          (err) => !err || isMissingTable(err),
        )
      ) {
        throw new Error("DATA_UNAVAILABLE");
      }
    }
    const sql = await (await load_agency_db()).localSql();
    const progress = (
      await sql.query<Record<string, unknown>>(
        "select * from client_progress where client_id = $1 order by created_at desc",
        [id],
      )
    ).map(mapProgress);
    const team = (
      await sql.query<Record<string, unknown>>(
        "select * from team_members where client_id = $1 and deleted_at is null",
        [id],
      )
    ).map(mapTeamMember);
    const payments = (
      await sql.query<Record<string, unknown>>(
        "select * from payments where client_id = $1 order by due_date desc",
        [id],
      )
    ).map(mapPayment);
    const snapshots = await sql.query<Record<string, unknown>>(
      "select * from analytics_snapshots where client_id = $1 order by date desc limit 1",
      [id],
    );
    return {
      client,
      progress,
      currentStage: latestStage(progress),
      currentSource: latestProgress(progress)?.source ?? null,
      team,
      payments,
      analytics: snapshots[0] ? mapSnapshot(snapshots[0]) : null,
    };
  });

async function upsertClientRow(
  payload: Record<string, unknown>,
  isInsert: boolean,
): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const query = isInsert
      ? admin.from("clients").insert(payload)
      : admin.from("clients").update(payload).eq("id", payload.id as string);
    const { error } = await query;
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  if (isInsert) {
    await sql.query(
      `insert into clients (
        id, name, channel_url, channel_thumbnail, channel_summary, offers, content_strategy,
        plan_type, custom_plan_label, setup_fee, monthly_fee, start_date, status,
        notes, created_at, updated_at, created_by, deleted_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ACTIVE',$13,$14,$14,$15,null
      )`,
      [
        payload.id,
        payload.name,
        payload.channel_url,
        payload.channel_thumbnail,
        payload.channel_summary,
        payload.offers,
        payload.content_strategy,
        payload.plan_type,
        payload.custom_plan_label,
        payload.setup_fee,
        payload.monthly_fee,
        payload.start_date,
        payload.notes,
        payload.updated_at,
        payload.created_by,
      ],
    );
    return;
  }
  await sql.query(
    `update clients set
      name=$2, channel_url=$3, channel_thumbnail=$4, channel_summary=$5, offers=$6,
      content_strategy=$7, plan_type=$8, custom_plan_label=$9, setup_fee=$10,
      monthly_fee=$11, start_date=$12, notes=$13, updated_at=$14
     where id=$1`,
    [
      payload.id,
      payload.name,
      payload.channel_url,
      payload.channel_thumbnail,
      payload.channel_summary,
      payload.offers,
      payload.content_strategy,
      payload.plan_type,
      payload.custom_plan_label,
      payload.setup_fee,
      payload.monthly_fee,
      payload.start_date,
      payload.notes,
      payload.updated_at,
    ],
  );
}

async function insertProgress(row: {
  id: string;
  client_id: string;
  stage: ProgressStage;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("client_progress").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into client_progress (id, client_id, stage, source, notes, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$6,$7)`,
    [row.id, row.client_id, row.stage, row.source, row.notes, row.created_at, row.created_by],
  );
}

async function insertPayment(row: {
  id: string;
  client_id: string;
  amount: number;
  type: string;
  due_date: string;
  paid_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}): Promise<void> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("payments").insert(row);
    if (!error) return;
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  await sql.query(
    `insert into payments (id, client_id, amount, type, due_date, paid_date, status, created_at, updated_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9)`,
    [
      row.id,
      row.client_id,
      row.amount,
      row.type,
      row.due_date,
      row.paid_date,
      row.status,
      row.created_at,
      row.created_by,
    ],
  );
}

export async function internalSetClientStage(input: {
  clientId: string;
  stage: ProgressStage;
  source: ProgressSource;
  notes: string | null;
  actorId: string;
  skipApproval?: boolean;
}): Promise<{ ok: true; id: string; awaitingApproval?: boolean }> {
  if (!input.skipApproval && input.source === "MANUAL") {
    try {
      const { readApprovalPolicy, createApprovalRequest } = await import("@/lib/server/approvals.server");
      const policy = await readApprovalPolicy();
      if (policy.stageAdvanceRequiresApproval) {
        const request = await createApprovalRequest({
          clientId: input.clientId,
          type: "STAGE_ADVANCE",
          resourceType: "ClientProgress",
          resourceId: input.clientId,
          title: `Advance stage to ${input.stage}`,
          summary: input.notes,
          payload: { clientId: input.clientId, stage: input.stage, notes: input.notes },
          requestedBy: input.actorId,
        });
        return { ok: true as const, id: request.id, awaitingApproval: true };
      }
    } catch {
      /* proceed if safety schema isn't ready */
    }
  }
  const stamp = nowIso();
  const id = newId();
  await insertProgress({
    id,
    client_id: input.clientId,
    stage: input.stage,
    source: input.source,
    notes: sanitizeNullable(input.notes),
    created_at: stamp,
    updated_at: stamp,
    created_by: input.actorId,
  });
  try {
    const { writeAuditEvent } = await import("@/lib/server/audit.server");
    await writeAuditEvent({
      actorUserId: input.actorId,
      actorType: input.actorId.startsWith("portal:")
        ? "PORTAL"
        : input.actorId.startsWith("agent:")
          ? "HERMES"
          : input.actorId === "discord-status-agent"
            ? "SYSTEM"
            : "USER",
      action: "progress.stage_changed",
      entityType: "client_progress",
      entityId: id,
      clientId: input.clientId,
      summary: `Stage set to ${input.stage}`,
      metadata: { stage: input.stage, source: input.source },
    });
    const { notifyPortalClient } = await import("@/lib/server/portal.server");
    await notifyPortalClient({
      clientId: input.clientId,
      category: "PIPELINE",
      title: "Production stage updated",
      body: `Now: ${input.stage.replaceAll("_", " ").toLowerCase()}`,
      href: "/portal/home",
      entityType: "client_progress",
      entityId: id,
    });
  } catch {
    /* optional */
  }
  return { ok: true as const, id };
}

export async function internalMarkPaymentPaid(
  id: string,
): Promise<{ ok: true; paidDate: string }> {
  const stamp = nowIso();
  const paid = todayIsoDate();

  async function markOnSupabase(): Promise<"ok" | "fallback"> {
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (!admin) return "fallback";
    const existing = await admin
      .from("payments")
      .select("id,status")
      .eq("id", id)
      .maybeSingle<{ id: string; status: string }>();
    if (existing.error) {
      if (isMissingTable(existing.error)) return "fallback";
      throw new Error("DATA_UNAVAILABLE");
    }
    if (!existing.data) throw new Error("PAYMENT_MISSING");
    if (existing.data.status === "PAID") throw new Error("PAYMENT_ALREADY_PAID");
    const { data, error } = await admin
      .from("payments")
      .update({ status: "PAID", paid_date: paid, updated_at: stamp })
      .eq("id", id)
      .neq("status", "PAID")
      .select("id");
    if (error) {
      if (isMissingTable(error)) return "fallback";
      throw new Error("DATA_UNAVAILABLE");
    }
    if (!data || data.length === 0) throw new Error("PAYMENT_ALREADY_PAID");
    return "ok";
  }

  const remote = await markOnSupabase();
  if (remote === "ok") return { ok: true as const, paidDate: paid };

  const sql = await (await load_agency_db()).localSql();
  const updated = await sql.query<{ id: string }>(
    "update payments set status = 'PAID', paid_date = $2, updated_at = $3 where id = $1 and status <> 'PAID' returning id",
    [id, paid, stamp],
  );
  if (updated.length > 0) return { ok: true as const, paidDate: paid };
  const existing = await sql.query<{ status: string }>(
    "select status from payments where id = $1",
    [id],
  );
  if (!existing[0]) throw new Error("PAYMENT_MISSING");
  throw new Error("PAYMENT_ALREADY_PAID");
}

export async function internalSaveClient(
  data: z.infer<typeof SaveSchema>,
  actorId: string,
  progressSource: ProgressSource = "MANUAL",
): Promise<{ id: string; created: boolean; feeChanged: boolean }> {
  assertPlan(data);
  let channelUrl = data.channelUrl;
  if (channelUrl) {
    const parsed = parseYouTubeChannelUrl(channelUrl);
    if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
    channelUrl = parsed.canonical;
  }
  const isInsert = !data.id;
  const id = data.id ?? newId();
  const stamp = nowIso();
  let feeChanged = false;
  if (!isInsert) {
    const existing = (await readClients()).find((row) => row.id === id);
    if (existing) {
      feeChanged =
        Number(existing.setupFee) !== data.setupFee ||
        Number(existing.monthlyFee ?? 0) !== data.monthlyFee;
    }
  }
  const payload = {
    id,
    name: sanitizeText(data.name),
    channel_url: channelUrl,
    channel_thumbnail: data.channelThumbnail,
    channel_summary: sanitizeNullable(data.channelSummary),
    offers: sanitizeNullable(data.offers),
    content_strategy: sanitizeNullable(data.contentStrategy),
    plan_type: data.planType,
    custom_plan_label:
      data.planType === "CUSTOM" ? sanitizeNullable(data.customPlanLabel) : null,
    setup_fee: data.setupFee,
    monthly_fee: data.monthlyFee,
    start_date: data.startDate ?? todayIsoDate(),
    notes: sanitizeNullable(data.notes),
    updated_at: stamp,
    created_by: actorId,
  };
  await upsertClientRow(payload, isInsert);
  if (isInsert) {
    await insertProgress({
      id: newId(),
      client_id: id,
      stage: "WAITING_FOR_FOOTAGE",
      source: progressSource,
      notes: null,
      created_at: stamp,
      updated_at: stamp,
      created_by: actorId,
    });
    const start = payload.start_date as string;
    if (data.setupFee > 0) {
      await insertPayment({
        id: newId(),
        client_id: id,
        amount: data.setupFee,
        type: "SETUP",
        due_date: start,
        paid_date: null,
        status: "PENDING",
        created_at: stamp,
        updated_at: stamp,
        created_by: actorId,
      });
    }
    if ((data.monthlyFee ?? 0) > 0) {
      await insertPayment({
        id: newId(),
        client_id: id,
        amount: data.monthlyFee ?? 0,
        type: "MONTHLY",
        due_date: addMonthsIso(start, 1),
        paid_date: null,
        status: "PENDING",
        created_at: stamp,
        updated_at: stamp,
        created_by: actorId,
      });
    }
  }
  return { id, created: isInsert, feeChanged };
}

export const saveClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ context, data }) => {
    const result = await internalSaveClient(data, context.userId, "MANUAL");
    try {
      const { onClientMutated, onPaymentCreated } = await import("@/lib/server/safety-hooks.server");
      await onClientMutated({
        actorId: context.userId,
        action: result.created ? "client.created" : "client.updated",
        clientId: result.id,
        summary: result.created ? "Client created" : "Client updated",
      });
      if (result.created) {
        const { readPayments } = await import("@/lib/server/money");
        const payments = (await readPayments()).filter((row) => row.clientId === result.id);
        for (const payment of payments) {
          await onPaymentCreated({
            actorId: context.userId,
            paymentId: payment.id,
            clientId: result.id,
            amount: payment.amount,
            type: payment.type,
          });
        }
      } else if (result.feeChanged) {
        await onClientMutated({
          actorId: context.userId,
          action: "client.plan_fee_changed",
          clientId: result.id,
          summary: "Plan fee changed",
          metadata: {
            setupFee: data.setupFee,
            monthlyFee: data.monthlyFee,
          },
        });
      }
    } catch {
      /* non-blocking */
    }
    return { id: result.id };
  });

export const softDeleteClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    const stamp = nowIso();
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const { error } = await admin
        .from("clients")
        .update({ status: "CHURNED", deleted_at: stamp, updated_at: stamp })
        .eq("id", id);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
      if (!error) {
        try {
          const { onClientMutated } = await import("@/lib/server/safety-hooks.server");
          await onClientMutated({
            actorId: context.userId,
            action: "client.deleted",
            clientId: id,
            summary: "Client archived",
          });
        } catch {
          /* */
        }
        return { ok: true as const };
      }
    }
    const sql = await (await load_agency_db()).localSql();
    await sql.query(
      "update clients set status = 'CHURNED', deleted_at = $2, updated_at = $2 where id = $1",
      [id, stamp],
    );
    try {
      const { onClientMutated } = await import("@/lib/server/safety-hooks.server");
      await onClientMutated({
        actorId: context.userId,
        action: "client.deleted",
        clientId: id,
        summary: "Client archived",
      });
    } catch {
      /* */
    }
    return { ok: true as const };
  });

export const setClientStage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().min(1),
        stage: StageSchema,
        notes: z.string().max(2000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    return internalSetClientStage({
      clientId: data.clientId,
      stage: data.stage,
      source: "MANUAL",
      notes: data.notes ?? null,
      actorId: context.userId,
    });
  });

export const updateClientNotes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), notes: z.string().max(20000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const stamp = nowIso();
    const notes = sanitizeText(data.notes);
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const { error } = await admin
        .from("clients")
        .update({ notes, updated_at: stamp })
        .eq("id", data.id);
      if (!error) return { ok: true as const };
      if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
    const sql = await (await load_agency_db()).localSql();
    await sql.query("update clients set notes = $2, updated_at = $3 where id = $1", [
      data.id,
      notes,
      stamp,
    ]);
    return { ok: true as const };
  });

const OnboardingStepSchema = z.object({
  clientId: z.string().min(1),
  step: z.enum(CLIENT_ONBOARDING_STEPS),
  done: z.boolean(),
});

export const setClientOnboardingStep = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => OnboardingStepSchema.parse(input))
  .handler(async ({ data }) => {
    const clients = await readClients();
    const client = clients.find((row) => row.id === data.clientId);
    if (!client) throw new Error("DATA_UNAVAILABLE");
    const current = parseClientChecklist(client.onboardingChecklist ?? emptyClientChecklist());
    current.steps[data.step] = {
      done: data.done,
      at: data.done ? nowIso() : null,
    };
    const stamp = nowIso();
    const payload = JSON.stringify(current);
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const { error } = await admin
        .from("clients")
        .update({ onboarding_checklist: payload, updated_at: stamp })
        .eq("id", data.clientId);
      if (!error) return { ok: true as const, checklist: current };
      if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
    }
    const sql = await (await load_agency_db()).localSql();
    try {
      await sql.query(
        "update clients set onboarding_checklist = $2, updated_at = $3 where id = $1",
        [data.clientId, payload, stamp],
      );
    } catch {
      await sql.query("alter table clients add column if not exists onboarding_checklist text");
      await sql.query(
        "update clients set onboarding_checklist = $2, updated_at = $3 where id = $1",
        [data.clientId, payload, stamp],
      );
    }
    return { ok: true as const, checklist: current };
  });

export const markPaymentPaid = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    const result = await internalMarkPaymentPaid(id);
    try {
      const { onPaymentMarkedPaid } = await import("@/lib/server/safety-hooks.server");
      await onPaymentMarkedPaid({ actorId: context.userId, paymentId: id });
    } catch {
      /* non-blocking */
    }
    return result;
  });

export const getAiStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { llmStatus } = await import("@/lib/server/xai.server");
    const { higgsfieldAvailable, imageGenAvailable } = await import(
      "@/lib/server/higgsfield.server"
    );
    const { youtubeDataApiAvailable } = await import("@/lib/server/youtube-data.server");
    const [higgsfield, imageGen, llm, youtubeDataApi] = await Promise.all([
      higgsfieldAvailable(),
      imageGenAvailable(),
      llmStatus(),
      youtubeDataApiAvailable(),
    ]);
    return {
      llm: llm.available,
      llmSource: llm.source,
      grokEmail: llm.email,
      youtube: true,
      youtubeDataApi,
      higgsfield,
      imageGen,
    };
  });

export const analyzeChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((url: unknown) => z.string().min(1).parse(url))
  .handler(async ({ data: url }) => {
    const parsed = parseYouTubeChannelUrl(url);
    if (!parsed.ok) throw new Error("INVALID_YOUTUBE_URL");
    const { llmAvailable, synthesizeChannel } = await import("@/lib/server/analyze.server");
    if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
    const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
    const snapshot = await fetchChannelSnapshot(parsed.canonical);
    const synthesis = await synthesizeChannel(snapshot);
    return {
      name: snapshot.title,
      channelUrl: snapshot.canonicalUrl,
      channelThumbnail: snapshot.thumbnail,
      subscriberCount: snapshot.subscriberCount,
      ...synthesis,
    };
  });

export const refreshClientAnalysis = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const clients = await readClients();
    const client = clients.find((row) => row.id === id);
    if (!client?.channelUrl) throw new Error("INVALID_YOUTUBE_URL");
    const { llmAvailable, synthesizeChannel } = await import("@/lib/server/analyze.server");
    if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");
    const { fetchChannelSnapshot } = await import("@/lib/server/youtube.server");
    const snapshot = await fetchChannelSnapshot(client.channelUrl);
    const synthesis = await synthesizeChannel(snapshot);
    const stamp = nowIso();
    const admin = await (await load_agency_db()).getAgencyAdmin();
    const patch = {
      name: snapshot.title || client.name,
      channel_url: snapshot.canonicalUrl,
      channel_thumbnail: snapshot.thumbnail,
      channel_summary: synthesis.channelSummary,
      offers: synthesis.offers,
      content_strategy: synthesis.contentStrategy,
      updated_at: stamp,
    };
    if (admin) {
      const { error } = await admin.from("clients").update(patch).eq("id", id);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
      if (!error) {
        return { ok: true as const };
      }
    }
    const sql = await (await load_agency_db()).localSql();
    await sql.query(
      `update clients set name=$2, channel_url=$3, channel_thumbnail=$4, channel_summary=$5,
        offers=$6, content_strategy=$7, updated_at=$8 where id=$1`,
      [
        id,
        patch.name,
        patch.channel_url,
        patch.channel_thumbnail,
        patch.channel_summary,
        patch.offers,
        patch.content_strategy,
        stamp,
      ],
    );
    return { ok: true as const };
  });

export { CLIENT_STATUSES, type PlanType };
