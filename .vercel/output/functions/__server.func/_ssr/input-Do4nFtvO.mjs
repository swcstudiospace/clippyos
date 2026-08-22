import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-Do4nFtvO.js
var import_jsx_runtime = require_jsx_runtime();
var fieldClass = "w-full min-h-11 rounded-button border border-border bg-elevated px-3 text-body text-fg shadow-(--shadow-border) transition-[box-shadow,border-color] duration-(--motion-quick) ease-[var(--ease-out)] placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent),0_12px_28px_-16px_var(--accent)] disabled:opacity-50";
function Input({ className, type = "text", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn(fieldClass, className),
		...props
	});
}
function Textarea({ className, ref, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		ref,
		className: cn(fieldClass, "min-h-28 py-2.5", className),
		...props
	});
}
//#endregion
export { Textarea as n, Input as t };
