import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as X } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { O as cn, w as Button } from "./router-DRtNPEcw.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dialog-ChagZPco.js
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		className: cn("fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("text-card font-semibold tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("mt-1 text-body text-muted", className),
		...props
	});
}
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("glass-modal fixed z-50 overflow-hidden p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none", "top-auto bottom-0 left-0 right-0 w-full max-h-[min(92dvh,100%)] translate-x-0 translate-y-0 rounded-b-none rounded-t-[var(--radius-modal)] pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", "md:top-1/2 md:bottom-auto md:left-1/2 md:right-auto md:w-[min(100%-2rem,28rem)] md:max-h-[min(90dvh,100%)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-modal)] md:pb-6 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95", className),
		...props,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "absolute top-3 right-3 z-10 size-11",
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})
			})
		]
	})] });
}
//#endregion
export { DialogTitle as i, DialogContent as n, DialogDescription as r, Dialog as t };
