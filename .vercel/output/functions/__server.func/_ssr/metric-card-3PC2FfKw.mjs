import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as GlassCard, O as cn } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as NumberTicker } from "./number-ticker-BX_YJzC_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/metric-card-3PC2FfKw.js
var import_jsx_runtime = require_jsx_runtime();
function MetricCard({ label, value, amount, hint, loading = false, tone = "default" }) {
	const numeric = typeof amount === "number" && Number.isFinite(amount) ? amount : null;
	const abs = numeric == null ? 0 : Math.abs(numeric);
	const decimals = abs % 1 === 0 ? 0 : 2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "min-w-0 overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-caption text-muted",
			children: label
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-9 w-36" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-4 w-24" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("metric-in mt-1 min-w-0 text-section font-semibold tracking-tight break-words tabular-nums sm:text-page", tone === "success" && "text-success", tone === "danger" && "text-danger"),
			children: numeric == null ? value : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, {
				value: abs,
				prefix: numeric < 0 ? "-$" : "$",
				decimalPlaces: decimals
			})
		}, `${label}-${value}`), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: hint
		}) : null] })]
	});
}
function MetricCardRowSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
		children: [
			"Total Revenue",
			"Current MRR",
			"Projected Annual",
			"Overall Profit"
		].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
			label,
			value: "",
			loading: true
		}, label))
	});
}
//#endregion
export { MetricCardRowSkeleton as n, MetricCard as t };
