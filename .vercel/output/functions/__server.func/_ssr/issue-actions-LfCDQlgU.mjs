import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { c as LINEAR_LINKS_QUERY_KEY, l as LINEAR_QUERY_KEY, o as LINEAR_ENTITY_TYPES, s as LINEAR_KANBAN_COLUMNS } from "./linear-CrgEmECq.mjs";
import { ut as ExternalLink } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/issue-actions-LfCDQlgU.js
var import_jsx_runtime = require_jsx_runtime();
var getLinearStatusFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("dbab82b8ff52acd6722205c7d6d00930fb79810bdf93995f60d23dcc4127020d"));
var saveLinearApiKeyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ apiKey: string().trim().min(12).max(400) }).parse(input)).handler(createSsrRpc("7a5bc5bce12d82d34dfa2416e649f3001a363244f7ee3d10f658094d3b85daec"));
var saveLinearOauthAppFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().trim().min(8).max(200),
	clientSecret: string().trim().min(8).max(400)
}).parse(input)).handler(createSsrRpc("dc5ce359248374d5dfd2356a69845e9ff3dd7e4f95c6fa561e3847602431ff0a"));
var testLinearFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("16d0b82dab672e3b7b760fe1457cf2abf93adf53da073b0513bc248e1383c30a"));
var loadLinearCatalogFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ teamId: string().optional() }).parse(input ?? {})).handler(createSsrRpc("eefd455d5edc448f24b54784500b1a8e00d3cee087d09166fa3a792f9072ad76"));
var BindingSchema = object({
	teamId: string().nullable().optional(),
	projectId: string().nullable().optional(),
	stateMap: object({
		backlog: string().nullable().optional(),
		ready: string().nullable().optional(),
		inProgress: string().nullable().optional(),
		inReview: string().nullable().optional(),
		done: string().nullable().optional()
	}).optional(),
	flags: object({
		enabled: boolean().optional(),
		syncJobs: boolean().optional(),
		autoIssueOnFail: boolean().optional(),
		autoIssueOnProposal: boolean().optional(),
		membersCanCreate: boolean().optional(),
		failColumn: _enum(LINEAR_KANBAN_COLUMNS).optional()
	}).optional()
});
var saveLinearBindingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => BindingSchema.parse(input)).handler(createSsrRpc("74790204ebaf276017ca70573c20c80bcd1674f6ab972948adedb98291da2515"));
var disconnectLinearFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("bbed08cef4855935de33a350c23823736454129406477e2a26d3961ded80c031"));
var startLinearOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("d9aee8add62757752f46eee9c75f5420e1eaa99a4bdf2af8bad5654a85df89b7"));
var ensureLinearMilestonesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("00a8922a9369ba396f51f6c855d55f5c7ea26c6cfbc0152320818a9a67a0cde3"));
var CreateIssueSchema = object({
	title: string().trim().min(3).max(250),
	description: string().max(8e3).optional(),
	state: _enum(LINEAR_KANBAN_COLUMNS).optional(),
	labels: array(string().max(40)).max(8).optional(),
	priority: number().int().min(0).max(4).optional(),
	entityType: _enum(LINEAR_ENTITY_TYPES).optional(),
	entityId: string().max(80).optional()
});
var createLinearIssueFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateIssueSchema.parse(input)).handler(createSsrRpc("78b10d897224704e6fd33023ccd5511378801b19ed00870e83668472721117fc"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	entityType: _enum(LINEAR_ENTITY_TYPES),
	entityId: string().min(1)
}).parse(input)).handler(createSsrRpc("0853cb4ad9da6ecd34f530de4b6985cc4e9caa2c0507c4eb287b60ee2cef74d4"));
var listLinearLinksFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f23e54a9689407f4165876f04173ad73903216201dbdd840cc3b972b62a63bd4"));
function LinearIssueActions({ entityType, entityId, title, description, labels, compact }) {
	const queryClient = useQueryClient();
	const links = useQuery({
		queryKey: LINEAR_LINKS_QUERY_KEY,
		queryFn: () => listLinearLinksFn(),
		staleTime: 15e3
	});
	const status = useQuery({
		queryKey: LINEAR_QUERY_KEY,
		queryFn: () => getLinearStatusFn(),
		staleTime: 6e4
	});
	const link = (links.data ?? []).find((row) => row.agencyEntityType === entityType && row.agencyEntityId === entityId);
	const create = useMutation({
		mutationFn: () => createLinearIssueFn({ data: {
			title,
			description,
			labels,
			entityType,
			entityId,
			state: "backlog"
		} }),
		onSuccess: async (result) => {
			if (result.skipped) {
				toast.message("Linear is off. Enable it in Settings.");
				return;
			}
			toast.success(result.issue.identifier ? `Opened ${result.issue.identifier}` : "Linear issue created");
			await queryClient.invalidateQueries({ queryKey: LINEAR_LINKS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (status.data && !status.data.configured) return null;
	if (link?.linearUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: link.linearUrl,
		target: "_blank",
		rel: "noreferrer",
		className: "inline-flex min-h-11 items-center gap-1 text-caption text-accent underline-offset-2 hover:underline",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
			className: "size-3.5",
			"aria-hidden": "true"
		}), link.linearIdentifier ? `Open ${link.linearIdentifier}` : "Open in Linear"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		size: "sm",
		variant: compact ? "ghost" : "secondary",
		disabled: create.isPending || status.data?.flags.enabled === false,
		onClick: () => create.mutate(),
		children: create.isPending ? "Creating…" : compact ? "Track in Linear" : "Create Linear issue"
	});
}
//#endregion
export { loadLinearCatalogFn as a, saveLinearOauthAppFn as c, getLinearStatusFn as i, startLinearOAuthFn as l, disconnectLinearFn as n, saveLinearApiKeyFn as o, ensureLinearMilestonesFn as r, saveLinearBindingFn as s, LinearIssueActions as t, testLinearFn as u };
