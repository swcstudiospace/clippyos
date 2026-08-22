import { g as PROGRESS_STAGES } from "./mappers-Bmic_hyw.mjs";
import { d as __exportAll } from "./ssr.mjs";
import { i as asMoney, l as monthKey, o as displayPaymentStatus, s as isActiveClient } from "./money-n66k7fz5.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-Dk6DLyWe.js
var PLAN_LABELS = {
	TEAM_ONLY: "Team only",
	PERSONAL_INVOLVED: "Personal involved",
	CUSTOM: "Custom"
};
var DEFAULT_SETUP_FEE = 3e4;
var DEFAULT_MONTHLY_FEE = {
	TEAM_ONLY: 3e3,
	PERSONAL_INVOLVED: 5e3,
	CUSTOM: 0
};
var STAGE_LABELS = {
	WAITING_FOR_FOOTAGE: "Waiting for footage",
	FILMING: "Filming",
	EDITING_SHORT_FORM: "Editing short-form",
	EDITING_LONG_FORM: "Editing long-form",
	DESIGNING_THUMBNAIL: "Designing thumbnail",
	IN_REVIEW: "In review",
	UPLOADING: "Uploading",
	PUBLISHED: "Published"
};
var STAGE_TONES = {
	WAITING_FOR_FOOTAGE: "neutral",
	FILMING: "orange",
	EDITING_SHORT_FORM: "teal",
	EDITING_LONG_FORM: "blue",
	DESIGNING_THUMBNAIL: "purple",
	IN_REVIEW: "orange",
	UPLOADING: "teal",
	PUBLISHED: "green"
};
var SOURCE_LABELS = {
	MANUAL: "Manual",
	AI_DISCORD: "Discord",
	AGENT: "Agent"
};
var SOURCE_TONES = {
	MANUAL: "neutral",
	AI_DISCORD: "purple",
	AGENT: "teal"
};
var PLAN_TONES = {
	TEAM_ONLY: "blue",
	PERSONAL_INVOLVED: "purple",
	CUSTOM: "teal"
};
var STATUS_LABELS = {
	ACTIVE: "Active",
	CHURNED: "Churned"
};
var ROLE_LABELS = {
	CHANNEL_MANAGER: "Channel manager",
	SHORT_FORM_EDITOR: "Short-form editor",
	LONG_FORM_EDITOR: "Long-form editor",
	THUMBNAIL_DESIGNER: "Thumbnail designer"
};
var ROLE_TONES = {
	CHANNEL_MANAGER: "blue",
	SHORT_FORM_EDITOR: "teal",
	LONG_FORM_EDITOR: "purple",
	THUMBNAIL_DESIGNER: "orange"
};
var PAYMENT_TYPE_LABELS = {
	SETUP: "Setup",
	MONTHLY: "Monthly"
};
var PAYMENT_STATUS_LABELS = {
	PENDING: "Pending",
	PAID: "Paid",
	OVERDUE: "Overdue"
};
var LEAD_STATUS_LABELS = {
	TO_CONTACT: "To contact",
	CONTACTED: "Contacted",
	IN_TALKS: "In talks",
	CLOSED: "Closed",
	LOST: "Lost"
};
var dashboard_exports = /* @__PURE__ */ __exportAll({
	DASHBOARD_PROGRESS_QUERY_KEY: () => DASHBOARD_PROGRESS_QUERY_KEY,
	daysSinceTimestamp: () => daysSinceTimestamp,
	deriveDashboardAlerts: () => deriveDashboardAlerts,
	deriveDashboardMetrics: () => deriveDashboardMetrics,
	deriveGuaranteeItems: () => deriveGuaranteeItems,
	derivePipelineCounts: () => derivePipelineCounts,
	deriveRecentActivity: () => deriveRecentActivity,
	deriveStuckStageCount: () => deriveStuckStageCount,
	guaranteeStatusForDay: () => guaranteeStatusForDay,
	inclusiveDayCount: () => inclusiveDayCount
});
var DASHBOARD_PROGRESS_QUERY_KEY = ["client-progress"];
/** Inclusive: the start date is Day 1 of the 30-day window. */
function inclusiveDayCount(startDate, today) {
	const start = Date.parse(`${startDate}T00:00:00Z`);
	const end = Date.parse(`${today}T00:00:00Z`);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
	return Math.floor((end - start) / 864e5) + 1;
}
/** Whole calendar days since an ISO timestamp (same day → 0). */
function daysSinceTimestamp(iso, today) {
	if (!iso) return null;
	const date = iso.slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
	const start = Date.parse(`${date}T00:00:00Z`);
	const end = Date.parse(`${today}T00:00:00Z`);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
	return Math.floor((end - start) / 864e5);
}
function deriveDashboardMetrics(snapshot, today) {
	const active = snapshot.clients.filter(isActiveClient);
	let totalMrr = 0;
	let clientsAtRisk = 0;
	for (const client of active) {
		totalMrr += asMoney(client.monthlyFee);
		if (!client.startDate) continue;
		if (inclusiveDayCount(client.startDate, today) >= 25) clientsAtRisk += 1;
	}
	const thisMonth = monthKey(today);
	let revenueThisMonth = 0;
	let outstanding = 0;
	let overdueCount = 0;
	let overdueTotal = 0;
	for (const payment of snapshot.payments) {
		const amount = asMoney(payment.amount);
		if (payment.status === "PAID" && payment.paidDate && monthKey(payment.paidDate) === thisMonth) revenueThisMonth += amount;
		const display = displayPaymentStatus(payment, today);
		if (display === "PENDING" || display === "OVERDUE") outstanding += amount;
		if (display === "OVERDUE") {
			overdueCount += 1;
			overdueTotal += amount;
		}
	}
	return {
		totalMrr,
		totalClients: active.length,
		revenueThisMonth,
		outstanding,
		clientsAtRisk,
		overdueCount,
		overdueTotal
	};
}
function viewsIncreasedForClient(clientId, startDate, snapshots) {
	const points = snapshots.filter((row) => row.clientId === clientId && row.date >= startDate && row.views != null && row.views !== "").map((row) => ({
		date: row.date,
		views: Number(row.views)
	})).filter((row) => Number.isFinite(row.views)).sort((a, b) => a.date.localeCompare(b.date));
	if (points.length < 2) return null;
	const first = points[0].views;
	return points[points.length - 1].views > first;
}
function guaranteeStatusForDay(dayCount) {
	if (dayCount >= 30) return "past_deadline";
	if (dayCount >= 25) return "approaching";
	return "on_track";
}
function deriveGuaranteeItems(clients, snapshots, today) {
	const items = [];
	for (const client of clients) {
		if (!isActiveClient(client) || !client.startDate) continue;
		const dayCount = inclusiveDayCount(client.startDate, today);
		if (dayCount <= 0) continue;
		const viewsIncreased = viewsIncreasedForClient(client.id, client.startDate, snapshots);
		const status = guaranteeStatusForDay(dayCount);
		const viewsSignal = viewsIncreased === true ? "up" : viewsIncreased === false ? "flat" : "insufficient";
		const viewsLabel = viewsSignal === "up" ? "Views ↑" : viewsSignal === "flat" ? "Views flat/↓" : "Insufficient data";
		let tone = "neutral";
		if (viewsIncreased === true) tone = "green";
		else if (status === "past_deadline") tone = "red";
		else if (status === "approaching") tone = "orange";
		let label = `Day ${dayCount}/30 — monitor views for ${client.name}`;
		if (viewsIncreased === true) label = `Day ${dayCount}/30 — views are up for ${client.name}`;
		else if (status === "past_deadline") label = `Day ${dayCount}/30 — refund window for ${client.name}`;
		items.push({
			id: client.id,
			clientId: client.id,
			name: client.name,
			dayCount,
			tone,
			status,
			viewsIncreased,
			viewsSignal,
			viewsLabel,
			label
		});
	}
	items.sort((a, b) => b.dayCount - a.dayCount || a.name.localeCompare(b.name));
	return items;
}
function derivePipelineCounts(clients) {
	const stages = Object.fromEntries(PROGRESS_STAGES.map((stage) => [stage, 0]));
	let notStarted = 0;
	let total = 0;
	for (const client of clients) {
		if (client.status !== "ACTIVE" || client.deletedAt) continue;
		total += 1;
		const stage = client.currentStage ?? null;
		if (!stage) notStarted += 1;
		else stages[stage] += 1;
	}
	return {
		stages,
		notStarted,
		total
	};
}
function deriveStuckStageCount(clients, progress, today, stallDays = 7) {
	const latest = /* @__PURE__ */ new Map();
	for (const row of progress) if (!latest.has(row.clientId)) latest.set(row.clientId, row);
	let count = 0;
	for (const client of clients) {
		if (client.status !== "ACTIVE" || client.deletedAt) continue;
		const row = latest.get(client.id);
		if (!row || row.stage === "PUBLISHED") continue;
		const days = daysSinceTimestamp(row.createdAt, today);
		if (days != null && days >= stallDays) count += 1;
	}
	return count;
}
function deriveRecentActivity(input) {
	const names = new Map(input.clients.map((client) => [client.id, sanitizeText(client.name)]));
	const items = [];
	for (const client of input.clients) {
		if (client.deletedAt) continue;
		items.push({
			id: `client:${client.id}`,
			kind: "client_created",
			at: client.createdAt,
			title: `Client added — ${sanitizeText(client.name)}`,
			href: {
				to: "/clients/$clientId",
				params: { clientId: client.id }
			}
		});
	}
	for (const payment of input.payments) {
		if (payment.status !== "PAID" || !payment.paidDate) continue;
		const who = names.get(payment.clientId) || "a client";
		items.push({
			id: `pay:${payment.id}`,
			kind: "payment_paid",
			at: payment.paidDate,
			title: `Payment collected — ${who}`,
			href: { to: "/money" }
		});
	}
	for (const row of input.progress) {
		const who = names.get(row.clientId) || "Client";
		items.push({
			id: `stage:${row.id}`,
			kind: "stage_change",
			at: row.createdAt,
			title: `${who} → ${STAGE_LABELS[row.stage]}`,
			href: {
				to: "/clients/$clientId",
				params: { clientId: row.clientId }
			}
		});
	}
	for (const lead of input.leads) {
		if (lead.deletedAt) continue;
		const name = sanitizeText(lead.name);
		items.push({
			id: `lead-new:${lead.id}`,
			kind: "lead_created",
			at: lead.createdAt,
			title: `Lead added — ${name}`,
			href: { to: "/leads" }
		});
		if (lead.updatedAt && lead.updatedAt !== lead.createdAt && lead.status !== "TO_CONTACT") items.push({
			id: `lead-move:${lead.id}:${lead.updatedAt}`,
			kind: "lead_moved",
			at: lead.updatedAt,
			title: `${name} → ${LEAD_STATUS_LABELS[lead.status]}`,
			href: { to: "/leads" }
		});
	}
	items.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
	return items.slice(0, 8);
}
function deriveDashboardAlerts(input) {
	const alerts = [];
	if ((input.pendingApprovals ?? 0) > 0) alerts.push({
		id: "approvals",
		severity: "warning",
		title: `${input.pendingApprovals} publish${input.pendingApprovals === 1 ? "" : "es"} waiting for approval`,
		href: { to: "/approvals" }
	});
	if (input.overdueCount > 0) alerts.push({
		id: "overdue",
		severity: "critical",
		title: `${input.overdueCount} overdue payment${input.overdueCount === 1 ? "" : "s"}`,
		href: { to: "/money" }
	});
	const past = input.guarantees.filter((item) => item.status === "past_deadline" && item.viewsIncreased !== true);
	if (past.length > 0) {
		const first = past[0];
		alerts.push({
			id: "guarantee-past",
			severity: "critical",
			title: past.length === 1 ? `${first.name} is past the 30-day views window` : `${past.length} clients are past the 30-day views window`,
			href: past.length === 1 ? {
				to: "/clients/$clientId",
				params: { clientId: first.clientId }
			} : { to: "/clients" }
		});
	}
	const approaching = input.guarantees.filter((item) => item.status === "approaching" && item.viewsIncreased !== true);
	if (approaching.length > 0) alerts.push({
		id: "guarantee-warn",
		severity: "warning",
		title: `${approaching.length} client${approaching.length === 1 ? "" : "s"} approaching day 30`,
		href: { to: "/clients" }
	});
	if (!input.aiConfigured) alerts.push({
		id: "ai-missing",
		severity: "warning",
		title: "AI isn’t connected — ideation and titles are paused",
		href: {
			to: "/settings",
			hash: "integrations"
		}
	});
	if (input.discordConfigured) {
		const last = input.discordAgent?.lastRunAt ? Date.parse(input.discordAgent.lastRunAt) : NaN;
		if (!Number.isFinite(last) || input.nowMs - last > 54e5) alerts.push({
			id: "discord-stale",
			severity: "warning",
			title: "Discord Status Agent hasn’t run recently",
			href: {
				to: "/settings",
				hash: "integrations"
			}
		});
		else if (input.discordAgent?.lastOk === false) alerts.push({
			id: "discord-fail",
			severity: "warning",
			title: "Discord Status Agent’s last run failed",
			href: {
				to: "/settings",
				hash: "integrations"
			}
		});
	}
	if (input.overloaded.length > 0) alerts.push({
		id: "capacity",
		severity: "warning",
		title: `${input.overloaded.length} teammate${input.overloaded.length === 1 ? "" : "s"} assigned to more than 3 clients`,
		href: { to: "/team" }
	});
	return alerts;
}
//#endregion
export { STAGE_TONES as C, STAGE_LABELS as S, PLAN_TONES as _, deriveDashboardMetrics as a, SOURCE_LABELS as b, deriveRecentActivity as c, DEFAULT_MONTHLY_FEE as d, DEFAULT_SETUP_FEE as f, PLAN_LABELS as g, PAYMENT_TYPE_LABELS as h, deriveDashboardAlerts as i, deriveStuckStageCount as l, PAYMENT_STATUS_LABELS as m, dashboard_exports as n, deriveGuaranteeItems as o, LEAD_STATUS_LABELS as p, daysSinceTimestamp as r, derivePipelineCounts as s, DASHBOARD_PROGRESS_QUERY_KEY as t, inclusiveDayCount as u, ROLE_LABELS as v, STATUS_LABELS as w, SOURCE_TONES as x, ROLE_TONES as y };
