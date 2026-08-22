import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { a as APPROVAL_TYPE_LABELS, r as APPROVAL_STATUS_LABELS } from "./safety-CI611PZC.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea } from "./input-Do4nFtvO.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { a as PORTAL_APPROVALS_KEY, c as PORTAL_HOME_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { n as decidePortalApprovalFn, o as listPortalApprovalsFn } from "./portal-fns-Arkyj22-.mjs";
import { r as PLATFORM_LABELS } from "./social-CmuIUyLc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/approvals-CB52l9zL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PortalApprovalsPage() {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: PORTAL_APPROVALS_KEY,
		queryFn: () => listPortalApprovalsFn()
	});
	const [notes, setNotes] = (0, import_react.useState)({});
	const decide = useMutation({
		mutationFn: (input) => decidePortalApprovalFn({ data: input }),
		onSuccess: async (_data, vars) => {
			toast.success(vars.decision === "APPROVED" ? "Approved — we’ll publish from here" : "Sent back with your note");
			await queryClient.invalidateQueries({ queryKey: PORTAL_APPROVALS_KEY });
			await queryClient.invalidateQueries({ queryKey: PORTAL_HOME_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" });
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load reviews",
		onRetry: () => void query.refetch()
	});
	const items = query.data?.items ?? [];
	const canApprove = query.data?.canApprove ?? false;
	const pending = items.filter((row) => row.status === "PENDING");
	const history = items.filter((row) => row.status !== "PENDING");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Approvals",
				description: "Sign off on publishes and ready renders. Requesting changes blocks the live post until the team revises."
			}),
			pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "Nothing waiting",
				description: "When a post needs your sign-off, it will show up here with a preview and caption."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-3",
				children: pending.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApprovalCard, {
					request: row,
					canApprove,
					note: notes[row.id] ?? "",
					onNote: (value) => setNotes((prev) => ({
						...prev,
						[row.id]: value
					})),
					busy: decide.isPending,
					onDecide: (decision) => decide.mutate({
						id: row.id,
						decision,
						note: notes[row.id]?.trim() || void 0
					})
				}) }, row.id))
			}),
			history.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-card font-semibold tracking-tight",
				children: "History"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: history.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "flex items-start justify-between gap-3 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body font-medium",
						children: row.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-caption text-muted",
						children: [formatRelativeTime(row.createdAt), row.decisionNote ? ` · ${row.decisionNote}` : ""]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: statusTone(row.status),
						children: APPROVAL_STATUS_LABELS[row.status]
					})]
				}) }, row.id))
			})] }) : null
		]
	});
}
function ApprovalCard({ request, canApprove, note, onNote, onDecide, busy }) {
	const platforms = Array.isArray(request.payload.platforms) ? request.payload.platforms.filter((item) => item === "instagram" || item === "x" || item === "tiktok" || item === "youtube") : [];
	const caption = typeof request.payload.caption === "string" ? request.payload.caption : null;
	const mediaUrl = typeof request.payload.mediaUrl === "string" ? request.payload.mediaUrl : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body font-medium",
				children: request.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-caption text-muted",
				children: [
					APPROVAL_TYPE_LABELS[request.type],
					" · ",
					formatRelativeTime(request.createdAt)
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone(request.status),
				children: APPROVAL_STATUS_LABELS[request.status]
			})]
		}),
		platforms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: platforms.map((p) => PLATFORM_LABELS[p]).join(" · ")
		}) : null,
		caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-body",
			children: caption
		}) : null,
		mediaUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 overflow-hidden rounded-control bg-secondary-surface",
			children: /\.(png|jpe?g|webp|gif)(\?|$)/i.test(mediaUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: mediaUrl,
				alt: "",
				className: "max-h-72 w-full object-contain"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				src: mediaUrl,
				className: "max-h-72 w-full",
				controls: true,
				playsInline: true
			})
		}) : null,
		canApprove ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: note,
				onChange: (e) => onNote(e.target.value),
				placeholder: "Optional for approve · required if you request changes",
				rows: 3
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: busy,
					onClick: () => onDecide("APPROVED"),
					children: "Approve"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					disabled: busy,
					onClick: () => onDecide("REJECTED"),
					children: "Request changes"
				})]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-caption text-muted",
			children: "Approvals are off for this login. Ask your producer if you need to sign off."
		})
	] });
}
//#endregion
export { PortalApprovalsPage as component };
