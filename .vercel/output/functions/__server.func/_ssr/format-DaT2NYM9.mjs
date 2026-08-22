import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/format-DaT2NYM9.js
var format_DaT2NYM9_exports = /* @__PURE__ */ __exportAll({
	a: () => formatDate,
	c: () => formatUsd,
	d: () => todayIsoDate,
	i: () => formatCompactUsd,
	l: () => format_exports,
	n: () => addMonthsIso,
	o: () => formatPercent,
	r: () => formatCompactCount,
	s: () => formatRelativeTime,
	t: () => addDaysIso,
	u: () => initials
});
var format_exports = /* @__PURE__ */ __exportAll$1({
	addDaysIso: () => addDaysIso,
	addMonthsIso: () => addMonthsIso,
	formatCompactCount: () => formatCompactCount,
	formatCompactUsd: () => formatCompactUsd,
	formatDate: () => formatDate,
	formatPercent: () => formatPercent,
	formatRelativeTime: () => formatRelativeTime,
	formatUsd: () => formatUsd,
	initials: () => initials,
	todayIsoDate: () => todayIsoDate
});
function formatUsd(value) {
	if (value == null || value === "") return "—";
	const amount = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(amount)) return "—";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2
	}).format(amount);
}
function formatPercent(value, digits = 0) {
	if (value == null || !Number.isFinite(value)) return "0%";
	return `${value.toFixed(digits)}%`;
}
function formatCompactCount(value) {
	if (value == null || !Number.isFinite(value)) return "—";
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 1e9) {
		const n = abs / 1e9;
		return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}B`;
	}
	if (abs >= 1e6) {
		const n = abs / 1e6;
		return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}M`;
	}
	if (abs >= 1e3) {
		const n = abs / 1e3;
		return `${sign}${n >= 10 ? n.toFixed(0) : n.toFixed(1)}K`;
	}
	return `${sign}${new Intl.NumberFormat("en-US").format(Math.round(abs))}`;
}
function formatCompactUsd(value) {
	if (!Number.isFinite(value)) return "$0";
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 1e6) {
		const m = abs / 1e6;
		return `${sign}$${Number.isInteger(m) || abs >= 1e7 ? m.toFixed(0) : m.toFixed(1)}M`;
	}
	if (abs >= 1e3) {
		const k = abs / 1e3;
		return `${sign}$${Number.isInteger(k) || abs >= 1e4 ? k.toFixed(0) : k.toFixed(1)}k`;
	}
	return `${sign}$${Math.round(abs)}`;
}
function formatDate(value) {
	if (!value) return "—";
	const date = value.length <= 10 ? /* @__PURE__ */ new Date(`${value}T00:00:00`) : new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	}).format(date);
}
function formatRelativeTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const sec = Math.round((date.getTime() - Date.now()) / 1e3);
	const abs = Math.abs(sec);
	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	if (abs < 60) return rtf.format(Math.round(sec), "second");
	const min = Math.round(sec / 60);
	if (Math.abs(min) < 60) return rtf.format(min, "minute");
	const hr = Math.round(min / 60);
	if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
	const day = Math.round(hr / 24);
	if (Math.abs(day) < 14) return rtf.format(day, "day");
	return formatDate(value);
}
function todayIsoDate() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function addMonthsIso(isoDate, months) {
	const date = /* @__PURE__ */ new Date(`${isoDate}T00:00:00Z`);
	date.setUTCMonth(date.getUTCMonth() + months);
	return date.toISOString().slice(0, 10);
}
function addDaysIso(isoDate, days) {
	const date = /* @__PURE__ */ new Date(`${isoDate}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}
function initials(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "C";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
//#endregion
export { formatDate as a, formatUsd as c, todayIsoDate as d, formatCompactUsd as i, format_DaT2NYM9_exports as l, addMonthsIso as n, formatPercent as o, formatCompactCount as r, formatRelativeTime as s, addDaysIso as t, initials as u };
