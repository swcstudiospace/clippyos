import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as SAFETY_INBOX_QUERY_KEY, t as APPROVALS_QUERY_KEY } from "./safety-CI611PZC.mjs";
import { d as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as listApprovalsFn, r as getSafetyInbox } from "./safety-fns-0YjGOs0I.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as ApprovalReview } from "./approval-review-BLKSQwvr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/approvals-jo3aueiP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApprovalsPage() {
	const search = useRouterState({ select: (s) => s.location.search });
	const focusId = typeof search.id === "string" ? search.id : null;
	const [tab, setTab] = (0, import_react.useState)("PENDING");
	const inbox = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox()
	});
	const query = useQuery({
		queryKey: [...APPROVALS_QUERY_KEY, tab],
		queryFn: () => listApprovalsFn({ data: tab === "PENDING" ? { status: "PENDING" } : {} })
	});
	const [sheetId, setSheetId] = (0, import_react.useState)(focusId);
	const items = query.data?.items ?? [];
	const canDecide = (inbox.data?.role ?? null) === "admin";
	const focused = (0, import_react.useMemo)(() => items.find((row) => row.id === (sheetId ?? focusId)) ?? null, [
		items,
		sheetId,
		focusId
	]);
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Approvals",
			description: "Sign off before a publish goes live. Drafts never need this."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-32 w-full rounded-card" })]
	});
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Approvals" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-6",
			title: "Couldn’t load approvals",
			description: "Retry in a moment.",
			onRetry: () => void query.refetch()
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl pb-24 md:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Approvals",
				description: "No accidental public posts. Approve to run the upload; reject to block it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: tab === "PENDING" ? "primary" : "ghost",
					size: "sm",
					onClick: () => setTab("PENDING"),
					children: "Waiting"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: tab === "ALL" ? "primary" : "ghost",
					size: "sm",
					onClick: () => setTab("ALL"),
					children: "All"
				})]
			}),
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				className: "mt-6",
				title: tab === "PENDING" ? "Nothing waiting" : "No approval history",
				description: "Publish jobs appear here when require-approval is on. Drafts skip this queue."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 flex flex-col gap-3",
				children: items.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "w-full text-left md:hidden",
					onClick: () => setSheetId(row.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApprovalReview, {
						request: row,
						canDecide: false,
						compact: true
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApprovalReview, {
						request: row,
						canDecide
					})
				})] }, row.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileReview, {
				request: focused,
				canDecide,
				open: Boolean(sheetId),
				onClose: () => setSheetId(null)
			})
		]
	});
}
function MobileReview({ request, canDecide, open, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: open && Boolean(request),
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Review publish" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Approve to go live, or reject with a note." }),
				request ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApprovalReview, {
						request,
						canDecide
					})
				}) : null
			]
		})
	});
}
//#endregion
export { ApprovalsPage as component };
