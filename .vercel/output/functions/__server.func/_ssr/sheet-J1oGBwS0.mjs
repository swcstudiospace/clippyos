import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as X } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { O as cn, w as Button } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sheet-J1oGBwS0.js
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog;
var SheetPortal = DialogPortal;
function SheetOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
		className: cn("fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none", className),
		...props
	});
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
		className: cn("text-card font-semibold tracking-tight", className),
		...props
	});
}
function SheetDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
		className: cn("mt-1 text-body text-muted", className),
		...props
	});
}
function SheetContent({ className, children, side = "right", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("glass-modal fixed z-50 flex flex-col overflow-y-auto p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none", side === "right" && "inset-y-0 right-0 h-dvh w-[min(100%,32rem)] rounded-none border-y-0 border-r-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right", side === "left" && "inset-y-0 left-0 h-dvh w-[min(100%,24rem)] rounded-none border-y-0 border-l-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left", side === "bottom" && "inset-x-0 bottom-0 max-h-[min(92dvh,100%)] w-full rounded-b-none rounded-t-[var(--radius-modal)] pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", className, "pt-14"),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "absolute top-3 right-3 z-10 size-11",
				"aria-label": "Close",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})
		})]
	})] });
}
//#endregion
export { SheetTitle as i, SheetContent as n, SheetDescription as r, Sheet as t };
