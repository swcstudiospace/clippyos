import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn, x as SparklesText } from "./router-DRtNPEcw.mjs";
import { t as BlurFade } from "./blur-fade-Bh-jVmMj.mjs";
import { t as AnimatedShinyText } from "./animated-shiny-text-XXcoX7q5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/page-header-D39h3ew5.js
var import_jsx_runtime = require_jsx_runtime();
function PageHeader({ title, description, actions, sparkle = false, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-page font-semibold tracking-tight",
				children: sparkle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, { children: title }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedShinyText, { children: title })
			}) }), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
				delay: .08,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-body text-muted",
					children: description
				})
			}) : null]
		}), actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2",
			children: actions
		}) : null]
	});
}
//#endregion
export { PageHeader as t };
