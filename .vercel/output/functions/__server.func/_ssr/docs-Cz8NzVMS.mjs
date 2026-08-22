import { n as APP_TAGLINE, t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { jt as BookOpen } from "../_libs/lucide-react.mjs";
import { b as ClippyMark, w as Button } from "./router-DRtNPEcw.mjs";
import { t as ThemeToggle } from "./theme-toggle-NsNUnV6r.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/docs-Cz8NzVMS.js
var import_jsx_runtime = require_jsx_runtime();
function DocsPlaceholderPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur-md",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 32 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-body font-semibold tracking-tight",
						children: APP_NAME
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "ghost",
							size: "sm",
							className: "min-h-11",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								children: "Back"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							className: "min-h-11",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/login?intent=access",
								children: "Get Access"
							})
						})
					]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
					className: "size-10 text-accent",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 text-page font-semibold tracking-tight",
					children: "Documentation"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-body text-muted",
					children: [APP_TAGLINE, ". The handbook — Social Machine, liaison APIs, Hermes, Linear, and storage — publishes on GitBook when this repository ships."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-caption text-muted",
					children: "This page is the placeholder. Until GitBook is live, request a demo and we’ll walk the OS with you."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap justify-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/#demo",
							children: "Request a Demo"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							children: "Back to ClippyOS"
						})
					})]
				})
			]
		})]
	});
}
//#endregion
export { DocsPlaceholderPage as component };
