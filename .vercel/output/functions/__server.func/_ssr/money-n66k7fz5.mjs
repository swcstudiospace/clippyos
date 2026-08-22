import { r as __exportAll } from "../_runtime.mjs";
import { n as addMonthsIso, t as addDaysIso } from "./format-DaT2NYM9.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/money-n66k7fz5.js
var money_n66k7fz5_exports = /* @__PURE__ */ __exportAll({
	a: () => deriveMoney,
	c: () => money_exports,
	i: () => asMoney,
	l: () => monthKey,
	n: () => MONEY_PERIOD_LABELS,
	o: () => displayPaymentStatus,
	r: () => MONEY_QUERY_KEY,
	s: () => isActiveClient,
	t: () => MONEY_PERIODS
});
var money_exports = /* @__PURE__ */ __exportAll$1({
	MONEY_PERIODS: () => MONEY_PERIODS,
	MONEY_PERIOD_LABELS: () => MONEY_PERIOD_LABELS,
	MONEY_QUERY_KEY: () => MONEY_QUERY_KEY,
	asMoney: () => asMoney,
	deriveMoney: () => deriveMoney,
	displayPaymentStatus: () => displayPaymentStatus,
	isActiveClient: () => isActiveClient,
	monthKey: () => monthKey,
	monthLabel: () => monthLabel,
	perClientTeamCost: () => perClientTeamCost,
	periodStartIso: () => periodStartIso,
	setupFeeStatus: () => setupFeeStatus
});
var MONEY_PERIODS = [
	"all",
	"ytd",
	"12m",
	"90d"
];
var MONEY_PERIOD_LABELS = {
	all: "All time",
	ytd: "This year",
	"12m": "12 months",
	"90d": "Last 90 days"
};
/** Stored monetary fields are never negative; missing / NaN / Infinity → 0. */
function asMoney(value) {
	if (value == null || value === "") return 0;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, n);
}
function isActiveClient(client) {
	return client.status === "ACTIVE" && client.deletedAt == null;
}
function displayPaymentStatus(payment, today) {
	if (payment.status === "PAID") return "PAID";
	if (payment.status === "OVERDUE") return "OVERDUE";
	if (payment.dueDate < today) return "OVERDUE";
	return "PENDING";
}
function setupFeeStatus(client, payments, today) {
	const setups = payments.filter((payment) => payment.clientId === client.id && payment.type === "SETUP");
	if (setups.some((payment) => payment.status === "PAID")) return {
		label: "Paid",
		tone: "green"
	};
	if (setups.some((payment) => displayPaymentStatus(payment, today) === "OVERDUE")) return {
		label: "Outstanding",
		tone: "red"
	};
	if (setups.length === 0 && asMoney(client.setupFee) <= 0) return {
		label: "Paid",
		tone: "green"
	};
	return {
		label: "Outstanding",
		tone: "orange"
	};
}
function periodStartIso(period, today) {
	if (period === "all") return null;
	if (period === "ytd") return `${today.slice(0, 4)}-01-01`;
	if (period === "12m") return addMonthsIso(today, -12);
	return addDaysIso(today, -90);
}
function inWindow(isoDate, start, today) {
	if (!isoDate) return false;
	if (isoDate > today) return false;
	if (start && isoDate < start) return false;
	return true;
}
function monthKey(isoDate) {
	return isoDate.slice(0, 7);
}
function monthLabel(key) {
	const year = Number(key.slice(0, 4));
	const month = Number(key.slice(5, 7));
	if (!Number.isFinite(year) || !Number.isFinite(month)) return key;
	const date = new Date(Date.UTC(year, month - 1, 1));
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	}).format(date);
}
function monthEnd(key) {
	const year = Number(key.slice(0, 4));
	const month = Number(key.slice(5, 7));
	return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
function monthsInRange(fromKey, toKey) {
	const result = [];
	let year = Number(fromKey.slice(0, 4));
	let month = Number(fromKey.slice(5, 7));
	const endYear = Number(toKey.slice(0, 4));
	const endMonth = Number(toKey.slice(5, 7));
	if (![
		year,
		month,
		endYear,
		endMonth
	].every(Number.isFinite)) return result;
	while (year < endYear || year === endYear && month <= endMonth) {
		result.push(`${year}-${String(month).padStart(2, "0")}`);
		month += 1;
		if (month > 12) {
			month = 1;
			year += 1;
		}
	}
	return result;
}
function minIso(values) {
	let min = null;
	for (const value of values) {
		if (!value) continue;
		if (!min || value < min) min = value;
	}
	return min;
}
function visibleMonthKeys(period, today, earliest) {
	const end = monthKey(today);
	let start;
	if (period === "ytd") start = `${today.slice(0, 4)}-01`;
	else if (period === "12m") start = monthKey(addMonthsIso(today, -11));
	else if (period === "90d") start = monthKey(addMonthsIso(today, -2));
	else {
		start = earliest ? monthKey(earliest) : monthKey(addMonthsIso(today, -5));
		const cap = monthKey(addMonthsIso(today, -23));
		if (start < cap) start = cap;
	}
	if (start > end) start = end;
	return monthsInRange(start, end);
}
function perClientTeamCost(clientId, teamMembers) {
	let total = 0;
	for (const member of teamMembers) {
		if (member.clientId !== clientId) continue;
		if (member.deletedAt) continue;
		total += asMoney(member.cost);
	}
	return total;
}
function deriveMoney(snapshot, period, today) {
	const { clients, payments, teamMembers } = snapshot;
	const active = clients.filter(isActiveClient);
	const start = periodStartIso(period, today);
	let currentMrr = 0;
	for (const client of active) currentMrr += asMoney(client.monthlyFee);
	let totalRevenue = 0;
	for (const payment of payments) {
		if (payment.status !== "PAID") continue;
		if (!inWindow(payment.paidDate, start, today)) continue;
		totalRevenue += asMoney(payment.amount);
	}
	let collectionPaid = 0;
	let collectionDue = 0;
	for (const payment of payments) {
		if (!inWindow(payment.dueDate, start, today)) continue;
		const amount = asMoney(payment.amount);
		collectionDue += amount;
		if (payment.status === "PAID") collectionPaid += amount;
	}
	const collectionRate = collectionDue > 0 ? collectionPaid / collectionDue * 100 : 0;
	const mrrRows = active.map((client) => ({
		clientId: client.id,
		name: client.name,
		planType: client.planType,
		customPlanLabel: client.customPlanLabel,
		monthlyFee: asMoney(client.monthlyFee),
		setup: setupFeeStatus(client, payments, today)
	}));
	mrrRows.sort((a, b) => a.name.localeCompare(b.name));
	const nameById = new Map(clients.map((client) => [client.id, client.name]));
	const paymentRows = payments.map((payment) => ({
		id: payment.id,
		clientId: payment.clientId,
		clientName: nameById.get(payment.clientId) ?? "Unknown client",
		amount: asMoney(payment.amount),
		type: payment.type,
		dueDate: payment.dueDate,
		paidDate: payment.paidDate,
		storedStatus: payment.status,
		displayStatus: displayPaymentStatus(payment, today)
	}));
	paymentRows.sort((a, b) => {
		const rank = (status) => status === "OVERDUE" ? 0 : status === "PENDING" ? 1 : 2;
		const byStatus = rank(a.displayStatus) - rank(b.displayStatus);
		if (byStatus !== 0) return byStatus;
		return a.dueDate.localeCompare(b.dueDate);
	});
	let overallTeamCost = 0;
	const profitRows = active.map((client) => {
		const revenue = asMoney(client.monthlyFee);
		const teamCost = perClientTeamCost(client.id, teamMembers);
		overallTeamCost += teamCost;
		const profit = revenue - teamCost;
		return {
			clientId: client.id,
			name: client.name,
			teamCost,
			revenue,
			profit,
			marginPct: revenue > 0 ? profit / revenue * 100 : null
		};
	});
	profitRows.sort((a, b) => a.name.localeCompare(b.name));
	const overallProfit = currentMrr - overallTeamCost;
	const overallMarginPct = currentMrr > 0 ? overallProfit / currentMrr * 100 : null;
	const keys = visibleMonthKeys(period, today, minIso([
		...payments.map((payment) => payment.paidDate),
		...payments.map((payment) => payment.dueDate),
		...clients.map((client) => client.startDate)
	]));
	const liveTeamCost = overallTeamCost;
	const months = keys.map((key) => {
		const end = monthEnd(key);
		let collectedMonthly = 0;
		let collectedAll = 0;
		let dueAmount = 0;
		let paidTowardDue = 0;
		for (const payment of payments) {
			const amount = asMoney(payment.amount);
			if (payment.status === "PAID" && payment.paidDate && monthKey(payment.paidDate) === key) {
				collectedAll += amount;
				if (payment.type === "MONTHLY") collectedMonthly += amount;
			}
			if (monthKey(payment.dueDate) === key) {
				dueAmount += amount;
				if (payment.status === "PAID") paidTowardDue += amount;
			}
		}
		let contractedMrr = 0;
		for (const client of active) {
			const started = client.startDate ?? client.createdAt.slice(0, 10);
			if (started && started <= end) contractedMrr += asMoney(client.monthlyFee);
		}
		return {
			key,
			label: monthLabel(key),
			collectedMonthly,
			contractedMrr,
			collectedAll,
			teamCosts: liveTeamCost,
			dueAmount,
			paidTowardDue,
			collectionRate: dueAmount > 0 ? paidTowardDue / dueAmount * 100 : 0
		};
	});
	const hasMrrGrowth = months.some((month) => month.collectedMonthly > 0 || month.contractedMrr > 0);
	const hasRevenueVsCosts = months.some((month) => month.collectedAll > 0 || month.teamCosts > 0);
	const hasCollectionHistory = months.some((month) => month.dueAmount > 0);
	return {
		currentMrr,
		projectedAnnual: currentMrr * 12,
		totalRevenue,
		overallTeamCost,
		overallProfit,
		overallMarginPct,
		collectionPaid,
		collectionDue,
		collectionRate,
		mrrRows,
		paymentRows,
		profitRows,
		months,
		hasMrrGrowth,
		hasRevenueVsCosts,
		hasCollectionHistory
	};
}
var MONEY_QUERY_KEY = ["money"];
//#endregion
export { deriveMoney as a, money_n66k7fz5_exports as c, asMoney as i, monthKey as l, MONEY_PERIOD_LABELS as n, displayPaymentStatus as o, MONEY_QUERY_KEY as r, isActiveClient as s, MONEY_PERIODS as t };
