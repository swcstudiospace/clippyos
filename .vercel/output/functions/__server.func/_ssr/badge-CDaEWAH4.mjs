import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-CDaEWAH4.js
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("badge-shine inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium", {
	variants: { tone: {
		neutral: "bg-secondary-surface text-fg",
		blue: "bg-accent/15 text-accent",
		green: "bg-success/15 text-success",
		orange: "bg-warning/15 text-warning",
		red: "bg-danger/15 text-danger",
		purple: "bg-purple/15 text-purple",
		teal: "bg-teal/15 text-teal"
	} },
	defaultVariants: { tone: "neutral" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
function statusTone(status) {
	switch (status) {
		case "PAID":
		case "ACTIVE":
		case "CONNECTED":
		case "CLOSED":
		case "PUBLISHED":
		case "RUNNING":
		case "READY":
		case "SUCCEEDED":
		case "LOGGED_IN": return "green";
		case "PENDING":
		case "PROCESSING":
		case "TRANSCRIBING":
		case "IN_TALKS":
		case "CONTACTED":
		case "IN_REVIEW":
		case "QUEUED":
		case "STARTING":
		case "STOPPING":
		case "NEEDS_ATTENTION":
		case "AWAITING_APPROVAL":
		case "WAITING": return "orange";
		case "OVERDUE":
		case "LOST":
		case "CHURNED":
		case "ERROR":
		case "FAILED":
		case "CANCELED":
		case "ARCHIVED": return "red";
		default: return "blue";
	}
}
//#endregion
export { statusTone as n, Badge as t };
