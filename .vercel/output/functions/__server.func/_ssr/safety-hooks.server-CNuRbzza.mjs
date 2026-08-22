import { writeAuditEvent } from "./audit.server-B2Y-2eMJ.mjs";
import { notifyAdmins, notifyUsers } from "./notifications.server-CiVCMOdN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/safety-hooks.server-CNuRbzza.js
function actorTypeFromId(actorId) {
	if (!actorId) return "SYSTEM";
	if (actorId.startsWith("agent:")) return "HERMES";
	if (actorId.startsWith("portal:")) return "PORTAL";
	if (actorId === "discord-status-agent") return "SYSTEM";
	if (actorId.startsWith("webhook:")) return "WEBHOOK";
	return "USER";
}
async function onSocialEvent(type, entityType, entityId, data) {
	const clientId = typeof data.clientId === "string" ? data.clientId : null;
	const jobId = typeof data.jobId === "string" ? data.jobId : null;
	const platform = typeof data.platform === "string" ? data.platform : null;
	const rail = typeof data.rail === "string" ? data.rail : null;
	const actorId = typeof data.actorId === "string" ? data.actorId : null;
	if (type === "social.upload.succeeded") {
		await writeAuditEvent({
			actorUserId: actorId,
			actorType: actorTypeFromId(actorId),
			action: "social.publish.succeeded",
			entityType,
			entityId,
			clientId,
			jobId,
			summary: `Published to ${platform ?? "social"} via ${rail ?? "unknown"}`,
			metadata: {
				platform,
				rail,
				provider: data.provider ?? null,
				externalPostId: data.externalPostId ?? null,
				externalUrl: data.externalUrl ?? null,
				mode: data.mode ?? null
			}
		});
		return;
	}
	if (type === "social.upload.failed") {
		await writeAuditEvent({
			actorUserId: actorId,
			actorType: actorTypeFromId(actorId),
			action: "social.publish.failed",
			entityType,
			entityId,
			clientId,
			jobId,
			summary: `Publish failed on ${platform ?? "social"}`,
			metadata: {
				platform,
				rail,
				errorCode: data.errorCode ?? null
			}
		});
		await notifyAdmins({
			extraUserIds: actorId ? [actorId] : [],
			category: "SOCIAL",
			severity: "WARNING",
			title: "Social publish failed",
			body: typeof data.message === "string" ? data.message : `${platform ?? "A platform"} failed to publish.`,
			href: "/social",
			entityType,
			entityId
		});
		import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
			entityType: "SocialUploadJob",
			entityId: jobId ?? entityId,
			failed: true,
			status: "FAILED",
			title: `[Social] Upload failed — ${platform ?? "social"}`,
			description: [
				typeof data.message === "string" ? data.message : "Publish failed.",
				jobId ? `Job: ${jobId}` : "",
				platform ? `Platform: ${platform}` : "",
				rail ? `Rail: ${rail}` : "",
				data.errorCode ? `Error: ${String(data.errorCode)}` : ""
			].filter(Boolean).join("\n"),
			labels: ["social", "bug"],
			priority: 2,
			actorId
		})).catch(() => {});
		return;
	}
	if (type === "social.upload.needs_attention" || type === "social.job_needs_attention") {
		await notifyAdmins({
			extraUserIds: actorId ? [actorId] : [],
			category: "SOCIAL",
			severity: "WARNING",
			title: "Social job needs attention",
			body: typeof data.reason === "string" ? data.reason : "Finish login, CAPTCHA, or publish in the desktop.",
			href: "/social",
			entityType,
			entityId
		});
		import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
			entityType: "SocialUploadJob",
			entityId: jobId ?? entityId,
			status: "NEEDS_ATTENTION",
			failed: true,
			title: `[Social] Needs attention — ${platform ?? "social"}`,
			description: typeof data.reason === "string" ? data.reason : "Job needs a human.",
			labels: ["social"],
			actorId
		})).catch(() => {});
		return;
	}
	if (type === "social.session.needs_login") await notifyAdmins({
		category: "SOCIAL",
		severity: "WARNING",
		title: "Social login needed",
		body: `Sign in to ${platform ?? "a platform"} on the Social Machine before browser-rail publishes can finish.`,
		href: "/social",
		entityType,
		entityId
	});
}
async function onPaymentMarkedPaid(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: actorTypeFromId(input.actorId),
		action: "payment.marked_paid",
		entityType: "payment",
		entityId: input.paymentId,
		clientId: input.clientId ?? null,
		summary: "Payment marked paid",
		metadata: { amount: input.amount ?? null }
	});
	await notifyAdmins({
		extraUserIds: [input.actorId],
		category: "BILLING",
		severity: "INFO",
		title: "Payment collected",
		body: "A payment was marked paid.",
		href: "/money",
		entityType: "payment",
		entityId: input.paymentId
	});
}
async function onPaymentCreated(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: actorTypeFromId(input.actorId),
		action: "payment.created",
		entityType: "payment",
		entityId: input.paymentId,
		clientId: input.clientId ?? null,
		summary: `Payment created${input.type ? ` (${input.type})` : ""}`,
		metadata: {
			amount: input.amount ?? null,
			type: input.type ?? null
		}
	});
}
async function onPayLinkCreated(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: actorTypeFromId(input.actorId),
		action: "payment.pay_link_created",
		entityType: "workspace_subscription",
		entityId: input.checkoutId,
		summary: "Pay link created",
		metadata: { planKey: input.planKey ?? null }
	});
}
async function onSaasStatus(input) {
	if (input.status !== "past_due" && input.status !== "canceled" && input.status !== "unpaid") return;
	await notifyAdmins({
		category: "BILLING",
		severity: "CRITICAL",
		title: input.status === "canceled" ? "Workspace subscription canceled" : "Workspace subscription past due",
		body: "Check Billing to restore access for the team.",
		href: "/billing",
		entityType: "workspace_subscription",
		entityId: "default"
	});
	await writeAuditEvent({
		actorType: "WEBHOOK",
		action: "billing.subscription.updated",
		entityType: "workspace_subscription",
		entityId: "default",
		summary: `SaaS subscription ${input.status}`,
		metadata: { status: input.status }
	});
}
async function onRenderFailed(input) {
	await writeAuditEvent({
		actorUserId: input.actorId ?? null,
		actorType: actorTypeFromId(input.actorId),
		action: "render.failed",
		entityType: "render_job",
		entityId: input.jobId,
		summary: "Render job failed",
		metadata: { error: input.error ?? null }
	});
	await notifyAdmins({
		extraUserIds: input.actorId ? [input.actorId] : [],
		category: "PIPELINE",
		severity: "WARNING",
		title: "Render failed",
		body: input.error ?? "A library render did not finish.",
		href: "/library",
		entityType: "render_job",
		entityId: input.jobId
	});
	import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
		entityType: "RenderJob",
		entityId: input.jobId,
		failed: true,
		status: "FAILED",
		title: `[Render] Failed — ${input.jobId.slice(0, 8)}`,
		description: input.error ?? "A library render did not finish.",
		labels: ["media", "bug"],
		priority: 2,
		actorId: input.actorId
	})).catch(() => {});
}
async function onRenderSucceeded(input) {
	await writeAuditEvent({
		actorUserId: input.actorId ?? null,
		actorType: actorTypeFromId(input.actorId),
		action: "render.succeeded",
		entityType: "render_job",
		entityId: input.jobId,
		summary: "Render job succeeded",
		metadata: { outputAssetId: input.outputAssetId ?? null }
	});
	import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
		entityType: "RenderJob",
		entityId: input.jobId,
		status: "SUCCEEDED",
		title: `[Render] Succeeded — ${input.jobId.slice(0, 8)}`,
		labels: ["media"],
		actorId: input.actorId
	})).catch(() => {});
}
async function onAgentFailed(input) {
	await notifyAdmins({
		category: "AGENT",
		severity: "WARNING",
		title: "Agent run failed",
		body: input.summary ?? "An agent run did not complete.",
		href: "/agent",
		entityType: "agent_run",
		entityId: input.runId
	});
	import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
		entityType: "AgentRun",
		entityId: input.runId,
		failed: true,
		status: "FAILED",
		title: `[Agent] Run failed — ${input.runId.slice(0, 8)}`,
		description: input.summary ?? "An agent run did not complete.",
		labels: ["autonomy", "bug"],
		priority: 2
	})).catch(() => {});
}
async function onAgentWaitingHuman(input) {
	await notifyAdmins({
		category: "AGENT",
		severity: "WARNING",
		title: "Agent waiting on a human",
		body: input.summary ?? "Login, CAPTCHA, or approval is blocking this run.",
		href: "/agent",
		entityType: "agent_run",
		entityId: input.runId
	});
}
async function onIntegrationTestFailed(input) {
	await notifyUsers({
		userIds: [input.actorId],
		category: "SYSTEM",
		severity: "WARNING",
		title: "Connection test failed",
		body: input.reason ?? `${input.provider} did not connect.`,
		href: "/settings#integrations",
		entityType: "integration",
		entityId: input.provider
	});
}
async function onIntegrationChanged(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "USER",
		action: `settings.integration.${input.action}`,
		entityType: "integration",
		entityId: input.provider,
		summary: `${input.provider} ${input.action}`,
		metadata: { provider: input.provider }
	});
}
async function onAuthEvent(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "USER",
		action: input.action,
		entityType: "auth",
		entityId: input.actorId,
		summary: input.summary,
		metadata: input.metadata
	});
}
async function onClientMutated(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: actorTypeFromId(input.actorId),
		action: input.action,
		entityType: "client",
		entityId: input.clientId,
		clientId: input.clientId,
		summary: input.summary,
		metadata: input.metadata
	});
}
async function onAssetDeleted(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: actorTypeFromId(input.actorId),
		action: "asset.deleted",
		entityType: "media_asset",
		entityId: input.assetId,
		clientId: input.clientId ?? null,
		summary: "Library asset deleted"
	});
}
async function onDiscordStageWrite(input) {
	await writeAuditEvent({
		actorType: "SYSTEM",
		action: "progress.stage_changed",
		entityType: "client_progress",
		entityId: input.clientId,
		clientId: input.clientId,
		summary: `Discord agent set stage to ${input.stage}`,
		metadata: {
			source: "AI_DISCORD",
			stage: input.stage,
			notes: input.notes ?? null
		}
	});
}
async function onHermesPrivileged(input) {
	await writeAuditEvent({
		actorUserId: input.actorId,
		actorType: "HERMES",
		action: input.action,
		entityType: input.entityType ?? null,
		entityId: input.entityId ?? null,
		requestId: input.requestId,
		summary: input.summary
	});
}
async function onGuaranteeRisk(input) {
	await notifyAdmins({
		category: "PIPELINE",
		severity: "WARNING",
		title: "30-day guarantee risk",
		body: `${input.clientName} is on day ${input.dayCount} without a views lift.`,
		href: `/clients/${input.clientId}`,
		entityType: "client",
		entityId: input.clientId
	});
}
//#endregion
export { onAgentFailed, onAgentWaitingHuman, onAssetDeleted, onAuthEvent, onClientMutated, onDiscordStageWrite, onGuaranteeRisk, onHermesPrivileged, onIntegrationChanged, onIntegrationTestFailed, onPayLinkCreated, onPaymentCreated, onPaymentMarkedPaid, onRenderFailed, onRenderSucceeded, onSaasStatus, onSocialEvent };
