import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { Et as Check, Tt as ChevronDown } from "../_libs/lucide-react.mjs";
import { a as SelectItemIndicator, c as SelectTrigger$1, i as SelectItem$1, l as SelectValue$1, n as SelectContent$1, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select$1, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/select-Cb8e3ND-.js
var import_jsx_runtime = require_jsx_runtime();
var Select = Select$1;
var SelectValue = SelectValue$1;
function SelectTrigger({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
		className: cn("flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-button border border-border bg-elevated px-3 text-left text-body text-fg shadow-(--shadow-border) transition-[box-shadow] duration-(--motion-quick) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:opacity-50 [&>span]:min-w-0 [&>span]:truncate", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })
		})]
	});
}
function SelectContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, {
		className: cn("glass-card z-50 overflow-hidden p-1 data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none", className),
		position: "popper",
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: "p-1",
			children
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
		className: cn("relative flex min-h-11 cursor-pointer items-center rounded-control py-1.5 pr-8 pl-3 text-body outline-none select-none focus:bg-glass data-disabled:pointer-events-none data-disabled:opacity-50", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, {
			className: "absolute right-2 inline-flex",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-accent" })
		})]
	});
}
//#endregion
export { SelectValue as a, SelectTrigger as i, SelectContent as n, SelectItem as r, Select as t };
