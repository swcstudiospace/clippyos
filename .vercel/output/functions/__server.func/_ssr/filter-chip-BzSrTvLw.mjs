import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/filter-chip-BzSrTvLw.js
var import_jsx_runtime = require_jsx_runtime();
function FilterChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: cn("min-h-11 rounded-full px-3 text-caption font-medium transition-[background-color,box-shadow,transform] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:scale-[0.96]", active ? "chip-active-glow bg-accent text-accent-fg" : "bg-secondary-surface text-fg hover:bg-secondary-surface/80"),
		children: label
	});
}
//#endregion
export { FilterChip as t };
