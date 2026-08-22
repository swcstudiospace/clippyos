import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { getUserRole } from "@/lib/server/access";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { ensureSafetySchema } from "@/lib/server/safety-schema.server";
import { writeAuditEvent } from "@/lib/server/audit.server";
import { notifyAdmins, notifyUsers } from "@/lib/server/notifications.server";
import {
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  DEFAULT_APPROVAL_POLICY,
  parseApprovalPolicy,
  type ApprovalPolicy,
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalType,
  type JsonRecord,
} from "@/lib/safety";
import { PLATFORM_LABELS } from "@/lib/social";
import type { SocialPlatform } from "@/lib/entities";

const POLICY_KEY = "APPROVALS_POLICY_JSON";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function parsePayload(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  if (typeof value !== "string" || !value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

function mapApproval(row: Record<string, unknown>): ApprovalRequest {
  return {
    id: String(row.id ?? ""),
    workspaceId: String(row.workspace_id ?? "default"),
    clientId: row.client_id == null ? null : String(row.client_id),
    type: oneOf(row.type, APPROVAL_TYPES, "CUSTOM"),
    resourceType: String(row.resource_type ?? ""),
    resourceId: String(row.resource_id ?? ""),
    status: oneOf(row.status, APPROVAL_STATUSES, "PENDING"),
    title: String(row.title ?? ""),
    summary: row.summary == null ? null : String(row.summary),
    payload: parsePayload(row.payload),
    requestedBy: String(row.requested_by ?? ""),
    assignedTo: row.assigned_to == null ? null : String(row.assigned_to),
    reviewedBy: row.reviewed_by == null ? null : String(row.reviewed_by),
    reviewedAt: row.reviewed_at == null ? null : String(row.reviewed_at),
    decisionNote: row.decision_note == null ? null : String(row.decision_note),
    expiresAt: row.expires_at == null ? null : String(row.expires_at),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function readApprovalPolicy(): Promise<ApprovalPolicy> {
  const raw = await readAppSetting(POLICY_KEY);
  if (!raw) return { ...DEFAULT_APPROVAL_POLICY };
  try {
    return parseApprovalPolicy(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_APPROVAL_POLICY };
  }
}

export async function writeApprovalPolicy(policy: ApprovalPolicy): Promise<ApprovalPolicy> {
  const next = parseApprovalPolicy(policy);
  await writeAppSetting(POLICY_KEY, JSON.stringify(next));
  return next;
}

export async function createApprovalRequest(input: {
  clientId?: string | null;
  type: ApprovalType;
  resourceType: string;
  resourceId: string;
  title: string;
  summary?: string | null;
  payload: JsonRecord;
  requestedBy: string;
  assignedTo?: string | null;
  expiresAt?: string | null;
}): Promise<ApprovalRequest> {
  await ensureSafetySchema();
  const stamp = nowIso();
  let assignedTo = input.assignedTo ?? null;
  if (!assignedTo && (input.type === "PUBLISH_SOCIAL" || input.type === "RENDER_RELEASE") && input.clientId) {
    try {
      const { readPortalSettings } = await import("@/lib/server/portal.server");
      const portal = await readPortalSettings();
      if (portal.enabled && portal.approvalsEnabled) assignedTo = "portal";
    } catch {
      /* optional */
    }
  }
  const row = {
    id: newId(),
    workspace_id: "default",
    client_id: input.clientId ?? null,
    type: input.type,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    status: "PENDING" as const,
    title: input.title.slice(0, 160),
    summary: input.summary?.slice(0, 400) ?? null,
    payload: JSON.stringify(input.payload),
    requested_by: input.requestedBy,
    assigned_to: assignedTo,
    reviewed_by: null,
    reviewed_at: null,
    decision_note: null,
    expires_at: input.expiresAt ?? null,
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("approval_requests").insert(row);
    if (error && !isMissingTable(error)) {
      /* local fallback */
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into approval_requests
        (id, workspace_id, client_id, type, resource_type, resource_id, status, title, summary, payload, requested_by, assigned_to, expires_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        row.id,
        row.workspace_id,
        row.client_id,
        row.type,
        row.resource_type,
        row.resource_id,
        row.status,
        row.title,
        row.summary,
        row.payload,
        row.requested_by,
        row.assigned_to,
        row.expires_at,
        row.created_at,
      ],
    );
  } catch {
    /* supabase-only */
  }
  const mapped = mapApproval(row);
  await writeAuditEvent({
    actorUserId: input.requestedBy,
    actorType: input.requestedBy.startsWith("agent:") ? "HERMES" : "USER",
    action: "approval.requested",
    entityType: "approval_request",
    entityId: mapped.id,
    clientId: mapped.clientId,
    jobId: mapped.type === "PUBLISH_SOCIAL" ? mapped.resourceId : null,
    summary: mapped.title,
    metadata: { type: mapped.type, resourceType: mapped.resourceType, resourceId: mapped.resourceId },
  });
  const platforms = Array.isArray(input.payload.platforms)
    ? (input.payload.platforms as string[]).map((p) => PLATFORM_LABELS[p as SocialPlatform] ?? p).join(", ")
    : "";
  await notifyAdmins({
    extraUserIds: [input.requestedBy, input.assignedTo].filter((id): id is string => Boolean(id)),
    category: "APPROVAL",
    severity: "WARNING",
    title: "Approval needed",
    body: platforms ? `${mapped.title} · ${platforms}` : mapped.title,
    href: `/approvals?id=${mapped.id}`,
    entityType: "approval_request",
    entityId: mapped.id,
  });
  if (mapped.type === "PUBLISH_SOCIAL") {
    void import("@/lib/server/linear.server")
      .then((mod) =>
        mod.notifyLinearOfEntity({
          entityType: "SocialUploadJob",
          entityId: mapped.resourceId,
          status: "AWAITING_APPROVAL",
          title: `[Social] Awaiting approval — ${mapped.title}`,
          labels: ["social"],
          actorId: input.requestedBy,
        }),
      )
      .catch(() => {});
  }
  if (mapped.clientId && (mapped.type === "PUBLISH_SOCIAL" || mapped.type === "RENDER_RELEASE")) {
    try {
      const { notifyPortalClient } = await import("@/lib/server/portal.server");
      await notifyPortalClient({
        clientId: mapped.clientId,
        category: "APPROVAL",
        severity: "WARNING",
        title: "Review requested",
        body: platforms ? `${mapped.title} · ${platforms}` : mapped.title,
        href: `/portal/approvals`,
        entityType: "approval_request",
        entityId: mapped.id,
      });
    } catch {
      /* optional */
    }
  }
  return mapped;
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
  await ensureSafetySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("approval_requests").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapApproval(data as Record<string, unknown>);
    if (error && !isMissingTable(error)) return null;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from approval_requests where id = $1",
      [id],
    );
    return rows[0] ? mapApproval(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listApprovalRequests(filter: {
  status?: ApprovalStatus;
  clientId?: string;
  limit?: number;
}): Promise<ApprovalRequest[]> {
  await ensureSafetySchema();
  const limit = Math.min(Math.max(filter.limit ?? 60, 1), 200);
  const admin = await getAgencyAdmin();
  if (admin) {
    let q = admin.from("approval_requests").select("*").order("created_at", { ascending: false }).limit(limit);
    if (filter.status) q = q.eq("status", filter.status);
    if (filter.clientId) q = q.eq("client_id", filter.clientId);
    const { data, error } = await q;
    if (!error) return (data ?? []).map((row) => mapApproval(row as Record<string, unknown>));
    if (!isMissingTable(error)) return [];
  }
  try {
    const sql = await localSql();
    const clauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filter.status) {
      clauses.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.clientId) {
      clauses.push(`client_id = $${i++}`);
      params.push(filter.clientId);
    }
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    params.push(limit);
    const rows = await sql.query<Record<string, unknown>>(
      `select * from approval_requests ${where} order by created_at desc limit $${i}`,
      params,
    );
    return rows.map(mapApproval);
  } catch {
    return [];
  }
}

export async function pendingApprovalCount(clientId?: string): Promise<number> {
  const rows = await listApprovalRequests({ status: "PENDING", clientId, limit: 80 });
  return rows.length;
}

function canDecide(input: {
  request: ApprovalRequest;
  actorId: string;
  role: "admin" | "member" | null;
  policy: ApprovalPolicy;
}): { ok: true } | { ok: false; code: string } {
  if (input.request.status !== "PENDING") return { ok: false, code: "APPROVAL_NOT_PENDING" };
  if (input.request.expiresAt && Date.parse(input.request.expiresAt) < Date.now()) {
    return { ok: false, code: "APPROVAL_EXPIRED" };
  }
  if (input.actorId.startsWith("portal:")) {
    return { ok: true };
  }
  const isAdmin = input.role === "admin";
  const assigned = input.request.assignedTo && input.request.assignedTo === input.actorId;
  if (!isAdmin && !assigned) return { ok: false, code: "APPROVAL_FORBIDDEN" };
  const self = input.request.requestedBy === input.actorId;
  if (self && !input.policy.allowSelfApprove) return { ok: false, code: "SELF_APPROVE_DENIED" };
  if (self && !isAdmin) return { ok: false, code: "SELF_APPROVE_DENIED" };
  return { ok: true };
}

async function patchApproval(
  id: string,
  patch: {
    status: ApprovalStatus;
    reviewed_by: string;
    reviewed_at: string;
    decision_note: string | null;
  },
): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    await admin.from("approval_requests").update(patch).eq("id", id);
  }
  try {
    const sql = await localSql();
    await sql.query(
      `update approval_requests
       set status = $2, reviewed_by = $3, reviewed_at = $4, decision_note = $5
       where id = $1`,
      [id, patch.status, patch.reviewed_by, patch.reviewed_at, patch.decision_note],
    );
  } catch {
    /* ok */
  }
}

export async function decideApproval(input: {
  id: string;
  actorId: string;
  decision: "APPROVED" | "REJECTED" | "CANCELED";
  note?: string | null;
  hermesAdmin?: boolean;
}): Promise<ApprovalRequest> {
  const request = await getApprovalRequest(input.id);
  if (!request) throw new Error("APPROVAL_MISSING");
  const policy = await readApprovalPolicy();
  const portalActor = input.actorId.startsWith("portal:");
  const role =
    portalActor || input.actorId.startsWith("agent:") ? null : await getUserRole(input.actorId);
  const gate = canDecide({ request, actorId: input.actorId, role, policy });
  if (!gate.ok) {
    if (!(input.hermesAdmin && request.status === "PENDING" && gate.code !== "APPROVAL_EXPIRED")) {
      throw new Error(gate.code);
    }
  }
  const stamp = nowIso();
  const note = input.note?.trim().slice(0, 400) || null;
  await patchApproval(input.id, {
    status: input.decision,
    reviewed_by: input.actorId,
    reviewed_at: stamp,
    decision_note: note,
  });
  const next = (await getApprovalRequest(input.id)) ?? {
    ...request,
    status: input.decision,
    reviewedBy: input.actorId,
    reviewedAt: stamp,
    decisionNote: note,
  };

  await writeAuditEvent({
    actorUserId: input.actorId,
    actorType: input.actorId.startsWith("agent:")
      ? "HERMES"
      : input.actorId.startsWith("portal:")
        ? "PORTAL"
        : "USER",
    action: input.decision === "APPROVED" ? "approval.approved" : input.decision === "REJECTED" ? "approval.rejected" : "approval.canceled",
    entityType: "approval_request",
    entityId: next.id,
    clientId: next.clientId,
    jobId: next.type === "PUBLISH_SOCIAL" ? next.resourceId : null,
    summary: `${input.decision === "APPROVED" ? "Approved" : input.decision === "REJECTED" ? "Rejected" : "Canceled"}: ${next.title}`,
    metadata: { type: next.type, resourceType: next.resourceType, resourceId: next.resourceId, note },
  });

  if (portalActor) {
    await writeAuditEvent({
      actorUserId: input.actorId,
      actorType: "PORTAL",
      action: input.decision === "APPROVED" ? "portal.approve" : "portal.reject",
      entityType: "approval_request",
      entityId: next.id,
      clientId: next.clientId,
      jobId: next.type === "PUBLISH_SOCIAL" ? next.resourceId : null,
      summary:
        input.decision === "APPROVED"
          ? `Client portal approved: ${next.title}`
          : `Client portal requested changes: ${next.title}`,
      metadata: { note },
    });
    await notifyAdmins({
      extraUserIds: [next.requestedBy].filter(Boolean),
      category: "APPROVAL",
      severity: input.decision === "APPROVED" ? "INFO" : "WARNING",
      title: input.decision === "APPROVED" ? "Client approved a publish" : "Client requested changes",
      body: note ? `${next.title} · ${note}` : next.title,
      href: `/approvals?id=${next.id}`,
      entityType: "approval_request",
      entityId: next.id,
    });
  }

  if (next.requestedBy && next.requestedBy !== input.actorId) {
    await notifyUsers({
      userIds: [next.requestedBy],
      category: "APPROVAL",
      severity: input.decision === "APPROVED" ? "INFO" : "WARNING",
      title: input.decision === "APPROVED" ? "Publish approved" : "Publish blocked",
      body: note ? `${next.title} · ${note}` : next.title,
      href: next.type === "PUBLISH_SOCIAL" ? "/social" : `/approvals?id=${next.id}`,
      entityType: "approval_request",
      entityId: next.id,
    });
  }

  if (next.type === "PUBLISH_SOCIAL" && next.resourceType === "SocialUploadJob") {
    const { resumeUploadJobAfterApproval, rejectUploadJobAfterApproval } = await import(
      "@/lib/server/social-ops.server"
    );
    if (input.decision === "APPROVED") {
      await resumeUploadJobAfterApproval({
        actorId: input.actorId,
        jobId: next.resourceId,
        payload: next.payload,
      });
    } else {
      await rejectUploadJobAfterApproval({
        actorId: input.actorId,
        jobId: next.resourceId,
        note,
      });
    }
  }

  if (next.type === "STAGE_ADVANCE" && input.decision === "APPROVED") {
    const clientId = typeof next.payload.clientId === "string" ? next.payload.clientId : next.clientId;
    const stage = typeof next.payload.stage === "string" ? next.payload.stage : null;
    if (clientId && stage) {
      const { internalSetClientStage } = await import("@/lib/server/clients");
      const entities = await import("@/lib/entities");
      if ((entities.PROGRESS_STAGES as readonly string[]).includes(stage)) {
        await internalSetClientStage({
          clientId,
          stage: stage as (typeof entities.PROGRESS_STAGES)[number],
          source: "MANUAL",
          notes: note,
          actorId: input.actorId,
          skipApproval: true,
        });
      }
    }
  }

  return next;
}

export async function cancelApprovalsForResource(resourceType: string, resourceId: string): Promise<void> {
  const pending = await listApprovalRequests({ status: "PENDING", limit: 80 });
  const matches = pending.filter((row) => row.resourceType === resourceType && row.resourceId === resourceId);
  for (const row of matches) {
    await patchApproval(row.id, {
      status: "CANCELED",
      reviewed_by: "system",
      reviewed_at: nowIso(),
      decision_note: "Resource canceled",
    });
  }
}
