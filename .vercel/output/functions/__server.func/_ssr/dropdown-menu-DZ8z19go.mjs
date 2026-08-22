import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as Root2, i as Portal2, n as Item2, o as Separator2, r as Label2, s as Trigger, t as Content2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dropdown-menu-DZ8z19go.js
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		sideOffset,
		className: cn("glass-card z-50 min-w-48 overflow-hidden p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none", className),
		...props
	}) });
}
function DropdownMenuItem({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
		className: cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-body text-fg outline-none select-none focus:bg-glass data-disabled:pointer-events-none data-disabled:opacity-50", className),
		...props
	});
}
function DropdownMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
		className: cn("my-1 h-px bg-border", className),
		...props
	});
}
function DropdownMenuLabel({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
		className: cn("px-3 py-2 text-caption font-medium text-muted", className),
		...props
	});
}
//#endregion
export { DropdownMenuSeparator as a, DropdownMenuLabel as i, DropdownMenuContent as n, DropdownMenuTrigger as o, DropdownMenuItem as r, DropdownMenu as t };
