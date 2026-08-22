import { Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as LinearIssueActions } from "./issue-actions-LfCDQlgU.mjs";
import { m as SCOPE_LABELS, r as KNOWLEDGE_PROPOSALS_KEY } from "./performance-Cj9pmeSi.mjs";
import { i as listKnowledgeProposalsFn, t as decideKnowledgeProposalFn } from "./performance-fns-BnwGGujQ.mjs";
import { f as knowledgeEntriesQueryKey } from "./knowledge-DYmG2i4O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-admin-fns-BtapzDNa.js
var import_jsx_runtime = require_jsx_runtime();
function KnowledgeProposalsInbox({ clientId, clientNames, compact }) {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: [...KNOWLEDGE_PROPOSALS_KEY, clientId ?? "all"],
		queryFn: () => listKnowledgeProposalsFn({ data: {
			status: "PENDING_REVIEW",
			clientId
		} })
	});
	const decide = useMutation({
		mutationFn: (input) => decideKnowledgeProposalFn({ data: input }),
		onSuccess: async (row) => {
			toast.success(row.status === "MERGED" ? "Merged into knowledge" : "Proposal rejected");
			await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PROPOSALS_KEY });
			await queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey("VIDEO_GLOBAL") });
			await queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey("THUMBNAIL_GLOBAL") });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" });
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load proposals",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	const items = query.data?.items ?? [];
	if (items.length === 0) {
		if (compact) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Proposals from performance"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "Winning posts draft principles here. Approve to inject them into Ideation, titles, and thumbnails. Auto-merge stays off."
		})] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: ["Proposals from performance", items.length ? ` · ${items.length}` : ""]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "Human review only. Approving writes a KnowledgeEntry in the suggested scope."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-3",
			children: items.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProposalCard, {
				row,
				clientName: row.clientId ? clientNames?.get(row.clientId) : void 0,
				pending: decide.isPending,
				onDecide: (decision) => decide.mutate({
					id: row.id,
					decision
				})
			}, row.id))
		})
	] });
}
function ProposalCard({ row, clientName, pending, onDecide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: statusTone("PENDING"),
						children: SCOPE_LABELS[row.suggestedScope]
					}),
					clientName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "neutral",
						children: clientName
					}) : null,
					row.confidence != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-caption text-muted",
						children: [Math.round(row.confidence * 100), "% confidence"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-caption text-muted",
						children: formatRelativeTime(row.createdAt)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-body",
				children: row.learnedPrincipleDraft
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: row.userInputDraft
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: pending,
						onClick: () => onDecide("APPROVED"),
						children: "Approve & merge"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						disabled: pending,
						onClick: () => onDecide("REJECTED"),
						children: "Reject"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
						entityType: "KnowledgeProposal",
						entityId: row.id,
						title: `Review learning: ${row.learnedPrincipleDraft.slice(0, 80)}`,
						description: row.learnedPrincipleDraft,
						labels: ["learning"],
						compact: true
					})
				]
			})
		]
	});
}
var getPortalSettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8d6c5a2d78184d7c6fcc0ace459f5bb2d1c40838ff54a5a314d2d5d150011169"));
var savePortalSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	enabled: boolean(),
	allowDownload: boolean(),
	showMetrics: boolean(),
	approvalsEnabled: boolean(),
	welcomeBlurb: string().max(400),
	agencyName: string().max(80),
	logoUrl: string().max(500).nullable()
}).parse(input)).handler(createSsrRpc("f2aff30be45c2f1f4046ddb1633b4c3a8f314b2da10134b681ab5fc55acc4dce"));
var listPortalUsersFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(createSsrRpc("8eb6279e042004e4a31b7d38e743d9cdcded74ced12181a9a5ada4669d89ef97"));
var invitePortalUserFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	email: string().email().max(200),
	name: string().max(80).optional(),
	canApprove: boolean().optional()
}).parse(input)).handler(createSsrRpc("cf65b1d00f15bc4ee94b99b26d1e26f60a2199d5e7e5ba2683a30a5b7f840b02"));
var revokePortalUserFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: string().min(1) }).parse(input)).handler(createSsrRpc("cee5338de188c424e85620cfd1f3ba7e3b44f762305a3bbfc1c49cc1a95aed3f"));
var setPortalCanApproveFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	canApprove: boolean()
}).parse(input)).handler(createSsrRpc("19e511a5bedb39d9e9ed4337666af46d6a6cb4bd64ab4f19bca88bdbf230a9cd"));
var savePortalWorkingOnFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	note: string().max(280).nullable()
}).parse(input)).handler(createSsrRpc("85ffaa66de3c87fa7913f9ba69ef91fa5bf11a8e1b563a7dbcd4d6ad75ba410e"));
var startPortalPreviewFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(createSsrRpc("a368f14624cbb579bf8e8e7b80f6c8bd1875230a433723f42865b7679ac1e82c"));
//#endregion
export { revokePortalUserFn as a, setPortalCanApproveFn as c, listPortalUsersFn as i, startPortalPreviewFn as l, getPortalSettingsFn as n, savePortalSettingsFn as o, invitePortalUserFn as r, savePortalWorkingOnFn as s, KnowledgeProposalsInbox as t };
