import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as GlassCard } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { r as PORTAL_ACTIVITY_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { a as listPortalActivityFn } from "./portal-fns-Arkyj22-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/activity-48Uw8JtZ.js
var import_jsx_runtime = require_jsx_runtime();
function PortalActivityPage() {
	const query = useQuery({
		queryKey: PORTAL_ACTIVITY_KEY,
		queryFn: () => listPortalActivityFn()
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" });
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load activity",
		onRetry: () => void query.refetch()
	});
	const items = query.data?.items ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Activity",
			description: "Client-visible updates only — stage changes, ready assets, and approvals. No fees or internal tools."
		}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "Quiet so far",
			description: "Stage changes and approvals will appear on this timeline."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex flex-col gap-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body font-medium",
						children: item.title
					}),
					item.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: item.detail
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-caption text-muted",
						children: formatRelativeTime(item.at)
					})
				]
			}) }, item.id))
		})]
	});
}
//#endregion
export { PortalActivityPage as component };
