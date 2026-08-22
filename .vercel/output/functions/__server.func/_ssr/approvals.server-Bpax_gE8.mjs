import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { g as parseApprovalPolicy, i as APPROVAL_TYPES, l as DEFAULT_APPROVAL_POLICY, n as APPROVAL_STATUSES } from "./safety-CI611PZC.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { n as getUserRole } from "./access-CV3glphY.mjs";
import { r as PLATFORM_LABELS } from "./social-CmuIUyLc.mjs";
import { t as ensureSafetySchema } from "./safety-schema.server-pGsE9nul.mjs";
import { writeAuditEvent } from "./audit.server-B2Y-2eMJ.mjs";
import { notifyAdmins, notifyUsers } from "./notifications.server-CiVCMOdN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/approvals.server-Bpax_gE8.js
var POLICY_KEY = "APPROVALS_POLICY_JSON";
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
	return crypto.randomUUID();
}
function oneOf(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function parsePayload(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) return value;
	if (typeof value !== "string" || !value) return {};
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
function mapApproval(row) {
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
		createdAt: String(row.created_at ?? "")
	};
}
async function readApprovalPolicy() {
	const raw = await readAppSetting(POLICY_KEY);
	if (!raw) return { ...DEFAULT_APPROVAL_POLICY };
	try {
		return parseApprovalPolicy(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_APPROVAL_POLICY };
	}
}
async function writeApprovalPolicy(policy) {
	const next = parseApprovalPolicy(policy);
	await writeAppSetting(POLICY_KEY, JSON.stringify(next));
	return next;
}
async function createApprovalRequest(input) {
	await ensureSafetySchema();
	const stamp = nowIso();
	let assignedTo = input.assignedTo ?? null;
	if (!assignedTo && (input.type === "PUBLISH_SOCIAL" || input.type === "RENDER_RELEASE") && input.clientId) try {
		const { readPortalSettings } = await import("./portal.server-Bv5Rx_Kz.mjs");
		const portal = await readPortalSettings();
		if (portal.enabled && portal.approvalsEnabled) assignedTo = "portal";
	} catch {}
	const row = {
		id: newId(),
		workspace_id: "default",
		client_id: input.clientId ?? null,
		type: input.type,
		resource_type: input.resourceType,
		resource_id: input.resourceId,
		status: "PENDING",
		title: input.title.slice(0, 160),
		summary: input.summary?.slice(0, 400) ?? null,
		payload: JSON.stringify(input.payload),
		requested_by: input.requestedBy,
		assigned_to: assignedTo,
		reviewed_by: null,
		reviewed_at: null,
		decision_note: null,
		expires_at: input.expiresAt ?? null,
		created_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("approval_requests").insert(row);
		if (error && !isMissingTable(error)) {}
	}
	try {
		await (await localSql()).query(`insert into approval_requests
        (id, workspace_id, client_id, type, resource_type, resource_id, status, title, summary, payload, requested_by, assigned_to, expires_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
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
			row.created_at
		]);
	} catch {}
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
		metadata: {
			type: mapped.type,
			resourceType: mapped.resourceType,
			resourceId: mapped.resourceId
		}
	});
	const platforms = Array.isArray(input.payload.platforms) ? input.payload.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ") : "";
	await notifyAdmins({
		extraUserIds: [input.requestedBy, input.assignedTo].filter((id) => Boolean(id)),
		category: "APPROVAL",
		severity: "WARNING",
		title: "Approval needed",
		body: platforms ? `${mapped.title} · ${platforms}` : mapped.title,
		href: `/approvals?id=${mapped.id}`,
		entityType: "approval_request",
		entityId: mapped.id
	});
	if (mapped.type === "PUBLISH_SOCIAL") import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
		entityType: "SocialUploadJob",
		entityId: mapped.resourceId,
		status: "AWAITING_APPROVAL",
		title: `[Social] Awaiting approval — ${mapped.title}`,
		labels: ["social"],
		actorId: input.requestedBy
	})).catch(() => {});
	if (mapped.clientId && (mapped.type === "PUBLISH_SOCIAL" || mapped.type === "RENDER_RELEASE")) try {
		const { notifyPortalClient } = await import("./portal.server-Bv5Rx_Kz.mjs");
		await notifyPortalClient({
			clientId: mapped.clientId,
			category: "APPROVAL",
			severity: "WARNING",
			title: "Review requested",
			body: platforms ? `${mapped.title} · ${platforms}` : mapped.title,
			href: `/portal/approvals`,
			entityType: "approval_request",
			entityId: mapped.id
		});
	} catch {}
	return mapped;
}
async function getApprovalRequest(id) {
	await ensureSafetySchema();
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("approval_requests").select("*").eq("id", id).maybeSingle();
		if (!error && data) return mapApproval(data);
		if (error && !isMissingTable(error)) return null;
	}
	try {
		const rows = await (await localSql()).query("select * from approval_requests where id = $1", [id]);
		return rows[0] ? mapApproval(rows[0]) : null;
	} catch {
		return null;
	}
}
async function listApprovalRequests(filter) {
	await ensureSafetySchema();
	const limit = Math.min(Math.max(filter.limit ?? 60, 1), 200);
	const admin = await getAgencyAdmin();
	if (admin) {
		let q = admin.from("approval_requests").select("*").order("created_at", { ascending: false }).limit(limit);
		if (filter.status) q = q.eq("status", filter.status);
		if (filter.clientId) q = q.eq("client_id", filter.clientId);
		const { data, error } = await q;
		if (!error) return (data ?? []).map((row) => mapApproval(row));
		if (!isMissingTable(error)) return [];
	}
	try {
		const sql = await localSql();
		const clauses = [];
		const params = [];
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
		return (await sql.query(`select * from approval_requests ${where} order by created_at desc limit $${i}`, params)).map(mapApproval);
	} catch {
		return [];
	}
}
function canDecide(input) {
	if (input.request.status !== "PENDING") return {
		ok: false,
		code: "APPROVAL_NOT_PENDING"
	};
	if (input.request.expiresAt && Date.parse(input.request.expiresAt) < Date.now()) return {
		ok: false,
		code: "APPROVAL_EXPIRED"
	};
	if (input.actorId.startsWith("portal:")) return { ok: true };
	const isAdmin = input.role === "admin";
	const assigned = input.request.assignedTo && input.request.assignedTo === input.actorId;
	if (!isAdmin && !assigned) return {
		ok: false,
		code: "APPROVAL_FORBIDDEN"
	};
	const self = input.request.requestedBy === input.actorId;
	if (self && !input.policy.allowSelfApprove) return {
		ok: false,
		code: "SELF_APPROVE_DENIED"
	};
	if (self && !isAdmin) return {
		ok: false,
		code: "SELF_APPROVE_DENIED"
	};
	return { ok: true };
}
async function patchApproval(id, patch) {
	const admin = await getAgencyAdmin();
	if (admin) await admin.from("approval_requests").update(patch).eq("id", id);
	try {
		await (await localSql()).query(`update approval_requests
       set status = $2, reviewed_by = $3, reviewed_at = $4, decision_note = $5
       where id = $1`, [
			id,
			patch.status,
			patch.reviewed_by,
			patch.reviewed_at,
			patch.decision_note
		]);
	} catch {}
}
async function decideApproval(input) {
	const request = await getApprovalRequest(input.id);
	if (!request) throw new Error("APPROVAL_MISSING");
	const policy = await readApprovalPolicy();
	const portalActor = input.actorId.startsWith("portal:");
	const role = portalActor || input.actorId.startsWith("agent:") ? null : await getUserRole(input.actorId);
	const gate = canDecide({
		request,
		actorId: input.actorId,
		role,
		policy
	});
	if (!gate.ok) {
		if (!(input.hermesAdmin && request.status === "PENDING" && gate.code !== "APPROVAL_EXPIRED")) throw new Error(gate.code);
	}
	const stamp = nowIso();
	const note = input.note?.trim().slice(0, 400) || null;
	await patchApproval(input.id, {
		status: input.decision,
		reviewed_by: input.actorId,
		reviewed_at: stamp,
		decision_note: note
	});
	const next = await getApprovalRequest(input.id) ?? {
		...request,
		status: input.decision,
		reviewedBy: input.actorId,
		reviewedAt: stamp,
		decisionNote: note
	};
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: input.actorId.startsWith("agent:") ? "HERMES" : input.actorId.startsWith("portal:") ? "PORTAL" : "USER",
		action: input.decision === "APPROVED" ? "approval.approved" : input.decision === "REJECTED" ? "approval.rejected" : "approval.canceled",
		entityType: "approval_request",
		entityId: next.id,
		clientId: next.clientId,
		jobId: next.type === "PUBLISH_SOCIAL" ? next.resourceId : null,
		summary: `${input.decision === "APPROVED" ? "Approved" : input.decision === "REJECTED" ? "Rejected" : "Canceled"}: ${next.title}`,
		metadata: {
			type: next.type,
			resourceType: next.resourceType,
			resourceId: next.resourceId,
			note
		}
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
			summary: input.decision === "APPROVED" ? `Client portal approved: ${next.title}` : `Client portal requested changes: ${next.title}`,
			metadata: { note }
		});
		await notifyAdmins({
			extraUserIds: [next.requestedBy].filter(Boolean),
			category: "APPROVAL",
			severity: input.decision === "APPROVED" ? "INFO" : "WARNING",
			title: input.decision === "APPROVED" ? "Client approved a publish" : "Client requested changes",
			body: note ? `${next.title} · ${note}` : next.title,
			href: `/approvals?id=${next.id}`,
			entityType: "approval_request",
			entityId: next.id
		});
	}
	if (next.requestedBy && next.requestedBy !== input.actorId) await notifyUsers({
		userIds: [next.requestedBy],
		category: "APPROVAL",
		severity: input.decision === "APPROVED" ? "INFO" : "WARNING",
		title: input.decision === "APPROVED" ? "Publish approved" : "Publish blocked",
		body: note ? `${next.title} · ${note}` : next.title,
		href: next.type === "PUBLISH_SOCIAL" ? "/social" : `/approvals?id=${next.id}`,
		entityType: "approval_request",
		entityId: next.id
	});
	if (next.type === "PUBLISH_SOCIAL" && next.resourceType === "SocialUploadJob") {
		const { resumeUploadJobAfterApproval, rejectUploadJobAfterApproval } = await import("./social-ops.server-B3WyGuEW.mjs");
		if (input.decision === "APPROVED") await resumeUploadJobAfterApproval({
			actorId: input.actorId,
			jobId: next.resourceId,
			payload: next.payload
		});
		else await rejectUploadJobAfterApproval({
			actorId: input.actorId,
			jobId: next.resourceId,
			note
		});
	}
	if (next.type === "STAGE_ADVANCE" && input.decision === "APPROVED") {
		const clientId = typeof next.payload.clientId === "string" ? next.payload.clientId : next.clientId;
		const stage = typeof next.payload.stage === "string" ? next.payload.stage : null;
		if (clientId && stage) {
			const { internalSetClientStage } = await import("./clients-CmcyBPZd.mjs").then((n) => n.n).then((n) => n.n);
			if ((await import("./mappers-Bmic_hyw.mjs").then((n) => n.U).then((n) => n.Y)).PROGRESS_STAGES.includes(stage)) await internalSetClientStage({
				clientId,
				stage,
				source: "MANUAL",
				notes: note,
				actorId: input.actorId,
				skipApproval: true
			});
		}
	}
	return next;
}
async function cancelApprovalsForResource(resourceType, resourceId) {
	const matches = (await listApprovalRequests({
		status: "PENDING",
		limit: 80
	})).filter((row) => row.resourceType === resourceType && row.resourceId === resourceId);
	for (const row of matches) await patchApproval(row.id, {
		status: "CANCELED",
		reviewed_by: "system",
		reviewed_at: nowIso(),
		decision_note: "Resource canceled"
	});
}
//#endregion
export { cancelApprovalsForResource, createApprovalRequest, decideApproval, getApprovalRequest, listApprovalRequests, readApprovalPolicy, writeApprovalPolicy };
