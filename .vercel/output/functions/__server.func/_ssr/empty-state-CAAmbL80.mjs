import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as GlassCard, O as cn } from "./router-DRtNPEcw.mjs";
import { t as Ripple } from "./ripple-7-CEEHUm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/empty-state-CAAmbL80.js
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ title, description, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: cn("relative flex flex-col items-start gap-3 overflow-hidden", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ripple, {
				className: "opacity-40",
				mainCircleSize: 120,
				numCircles: 4
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "relative z-[1] text-card font-semibold tracking-tight",
				children: title
			}),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "relative z-[1] max-w-md text-body text-muted",
				children: description
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-[1]",
				children: action
			}) : null
		]
	});
}
//#endregion
export { EmptyState as t };
