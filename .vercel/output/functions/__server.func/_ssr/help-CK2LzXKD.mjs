import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as GlassCard } from "./router-DRtNPEcw.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-CK2LzXKD.js
var import_jsx_runtime = require_jsx_runtime();
function PortalHelpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Help",
				description: "This portal is a read-only window into production, with optional sign-off on publishes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "What you can do"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 flex flex-col gap-2 text-body text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "See the current production stage for your brand." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Preview ready videos and images." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Approve a post or request changes before it goes live." })
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "What you cannot see"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 flex flex-col gap-2 text-body text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Team costs, invoices, or payment amounts." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Internal tools, agents, or other clients." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Workspace settings and API keys." })
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Need a change?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-body text-muted",
					children: "Request changes on an approval with a short note. Your producer is notified immediately. For access issues, ask them to send a new invite — revoked logins stop working instantly."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-caption text-muted",
					children: [
						"Staff?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							className: "text-fg underline-offset-4 hover:underline",
							children: "Open the agency workspace"
						})
					]
				})
			] })
		]
	});
}
//#endregion
export { PortalHelpPage as component };
