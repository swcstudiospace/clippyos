import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { r as INTEGRATION_COPY } from "./integrations-BBMsU168.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime, n as Root, r as Trigger, t as Content } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { Tt as ChevronDown } from "../_libs/lucide-react.mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
import { n as useIntegrationsUi } from "./provider-BnICEAIZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-fallback-panel-KjxISs65.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AIFallbackPanel({ title = "This tool will be available once you connect your API key", integration = "ai" }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const { openGuide } = useIntegrationsUi();
	const copy = INTEGRATION_COPY[integration];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-control bg-secondary-surface/60 px-4 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-caption text-muted",
				children: [
					"This feature requires ",
					copy.name,
					" to be configured.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-accent underline-offset-2 hover:underline",
						onClick: () => openGuide(integration),
						children: "Set it up now →"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-muted hover:text-fg",
						"aria-expanded": open,
						children: ["Here’s how", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							className: cn("size-4 transition-transform duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", open && "rotate-180"),
							"aria-hidden": "true"
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content, {
					className: "overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-2 list-decimal space-y-1 pl-5 text-caption text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open the setup guide from the link above, or go to Settings → Integrations." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Paste the ",
								copy.name,
								" credential and run Test Connection. Keys stay on the server and never appear in the browser."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Return here and run the action again. It activates on the next use without a reload." })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						className: "mt-3 inline-flex min-h-11 items-center text-caption text-accent",
						children: "Go to Settings"
					})]
				})]
			})
		]
	});
}
//#endregion
export { AIFallbackPanel as t };
