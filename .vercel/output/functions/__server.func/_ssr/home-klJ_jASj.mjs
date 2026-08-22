import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as ShieldCheck, vt as Clapperboard } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as GlassCard } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { c as PORTAL_HOME_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { r as getPortalHomeFn } from "./portal-fns-Arkyj22-.mjs";
import { n as StagePill } from "./stage-pill-D4JnG28X.mjs";
import { t as PipelineTracker } from "./pipeline-tracker-sk9R9pKX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-klJ_jASj.js
var import_jsx_runtime = require_jsx_runtime();
function PortalHomePage() {
	const home = useQuery({
		queryKey: PORTAL_HOME_KEY,
		queryFn: () => getPortalHomeFn()
	});
	if (home.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" })
		]
	});
	if (home.isError || !home.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load your portal",
		description: "Sign in again with the invite your producer sent.",
		onRetry: () => void home.refetch()
	});
	const data = home.data;
	const greeting = data.client.name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: greeting,
				description: data.settings.welcomeBlurb
			}),
			data.preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-control border border-border bg-secondary-surface/50 px-3 py-2 text-caption text-muted",
				children: "You’re previewing this portal as an operator. Approvals stay read-only."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "Production stage"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StagePill, { stage: data.stage })]
				}),
				data.stageUpdatedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-caption text-muted",
					children: ["Updated ", formatRelativeTime(data.stageUpdatedAt)]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineTracker, {
						current: data.stage,
						disabled: true
					})
				}),
				data.workingOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-body",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-caption text-muted",
						children: "What we’re working on · "
					}), data.workingOn]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-caption text-muted",
					children: "We’ll post a one-liner here when there’s something client-facing in motion."
				}),
				data.dayCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-caption text-muted",
					children: [
						"Day ",
						data.dayCount,
						" of ",
						30
					]
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/portal/approvals",
					className: "block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
						interactive: true,
						className: "h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-section font-semibold tracking-tight",
								children: data.pendingApprovals
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "Waiting for your review"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/portal/assets",
					className: "block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
						interactive: true,
						className: "h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-section font-semibold tracking-tight",
								children: data.newAssetsThisWeek
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "New deliverables this week"
							})
						]
					})
				})]
			})
		]
	});
}
//#endregion
export { PortalHomePage as component };
