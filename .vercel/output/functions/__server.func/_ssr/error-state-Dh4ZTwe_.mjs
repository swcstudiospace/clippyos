import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as GlassCard, O as cn, w as Button } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/error-state-Dh4ZTwe_.js
var import_jsx_runtime = require_jsx_runtime();
function ErrorState({ title = "Something went wrong", description = "Please try again.", onRetry, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		role: "alert",
		className: cn("flex flex-col items-start gap-3", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-body text-muted",
				children: description
			}),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				onClick: onRetry,
				children: "Try again"
			}) : action
		]
	});
}
//#endregion
export { ErrorState as t };
