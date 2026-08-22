import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { a as APPROVAL_TYPE_LABELS, m as SAFETY_INBOX_QUERY_KEY, r as APPROVAL_STATUS_LABELS, t as APPROVALS_QUERY_KEY, v as shortActor } from "./safety-CI611PZC.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as decideApprovalFn } from "./safety-fns-0YjGOs0I.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { n as Textarea } from "./input-Do4nFtvO.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { r as PLATFORM_LABELS, s as SOCIAL_QUERY_KEY } from "./social-CmuIUyLc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/approval-review-BLKSQwvr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApprovalReview({ request, canDecide, compact }) {
	const queryClient = useQueryClient();
	const [note, setNote] = (0, import_react.useState)("");
	const decide = useMutation({
		mutationFn: (decision) => decideApprovalFn({ data: {
			id: request.id,
			decision,
			note: note || void 0
		} }),
		onSuccess: async (_data, decision) => {
			toast.success(decision === "APPROVED" ? "Approved — publish will run now" : "Rejected");
			await queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SAFETY_INBOX_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["client"] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const payload = request.payload;
	const platforms = Array.isArray(payload.platforms) ? payload.platforms.filter((item) => item === "instagram" || item === "x" || item === "tiktok" || item === "youtube") : [];
	const caption = typeof payload.caption === "string" ? payload.caption : null;
	const mediaUrl = typeof payload.mediaUrl === "string" ? payload.mediaUrl : null;
	const rail = typeof payload.preferredRail === "string" ? payload.preferredRail : null;
	const pending = request.status === "PENDING";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-control border border-border bg-secondary-surface/40 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body font-medium",
						children: request.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-caption text-muted",
						children: [
							APPROVAL_TYPE_LABELS[request.type],
							" · ",
							formatRelativeTime(request.createdAt),
							` · ${shortActor(request.requestedBy)}`,
							request.summary ? ` · ${request.summary}` : ""
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: statusTone(request.status),
					children: APPROVAL_STATUS_LABELS[request.status]
				})]
			}),
			platforms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-caption text-muted",
				children: [platforms.map((p) => PLATFORM_LABELS[p]).join(" · "), rail ? ` · ${rail}` : ""]
			}) : null,
			caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-body",
				children: caption
			}) : null,
			mediaUrl && !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 truncate text-caption text-muted",
				children: mediaUrl
			}) : null,
			request.decisionNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-caption text-muted",
				children: ["Note: ", request.decisionNote]
			}) : null,
			pending && canDecide ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: note,
					onChange: (event) => setNote(event.target.value),
					placeholder: "Optional note",
					rows: 2,
					"aria-label": "Decision note"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "min-h-11 flex-1 sm:flex-none",
						disabled: decide.isPending,
						onClick: () => decide.mutate("APPROVED"),
						children: "Approve"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "min-h-11 flex-1 sm:flex-none",
						disabled: decide.isPending,
						onClick: () => decide.mutate("REJECTED"),
						children: "Reject"
					})]
				})]
			}) : null
		]
	});
}
//#endregion
export { ApprovalReview as t };
