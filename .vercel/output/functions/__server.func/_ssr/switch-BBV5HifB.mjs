import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/switch-BBV5HifB.js
var import_jsx_runtime = require_jsx_runtime();
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border bg-secondary-surface transition-[background-color,box-shadow] duration-(--motion-quick) ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg data-[state=checked]:bg-accent data-[state=checked]:shadow-[0_0_18px_-4px_var(--accent)] disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-1 rounded-full bg-fg shadow-sm transition-transform duration-(--motion-quick) ease-[var(--ease-out)] data-[state=checked]:translate-x-6 data-[state=checked]:bg-accent-fg" })
	});
}
//#endregion
export { Switch as t };
