import { o as __toESM } from "../_runtime.mjs";
import { $t as unknown, Bt as _enum, Gt as literal, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as SOCIAL_PLATFORMS } from "./mappers-Bmic_hyw.mjs";
import { a as formatDate, s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { c as AUDIT_QUERY_KEY, d as NOTIFICATION_CATEGORIES, f as NOTIFICATION_CATEGORY_LABELS, h as SAFETY_SETTINGS_QUERY_KEY, l as DEFAULT_APPROVAL_POLICY, m as SAFETY_INBOX_QUERY_KEY, o as AUDIT_ACTOR_LABELS } from "./safety-CI611PZC.mjs";
import { a as healthLabel$1, i as INTEGRATION_IDS, n as INTEGRATIONS_QUERY_KEY, o as healthTone, r as INTEGRATION_COPY } from "./integrations-BBMsU168.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { d as saveNotificationPrefsFn, f as saveOpsChannelsFn, i as getSafetySettingsFn, n as getNotificationPrefsFn, o as listAuditEventsFn, r as getSafetyInbox, u as saveApprovalPolicyFn } from "./safety-fns-0YjGOs0I.mjs";
import { a as listTeamLogins, i as createTeamLogin, o as revokeTeamLogin, r as createMemberResetLink, s as setSuperAdminPassword } from "./team-access-Di_NZ6Xd.mjs";
import { t as ADDONS_QUERY_KEY } from "./addons-BHnLQdrp.mjs";
import { i as formatPlaybookPackage, n as HERMES_PLAYBOOKS, r as PLAYBOOK_POLICY_LABELS, t as DEFAULT_PLAYBOOK_POLICIES } from "./playbooks-BbqI43Jw.mjs";
import { a as DEFAULT_HERMES_SCOPES, c as MCP_TOOLS, d as WEBHOOK_EVENT_TYPES, i as AUTONOMY_QUERY_KEY, l as SCOPE_LABELS, n as AUTONOMY_AUDIT_QUERY_KEY, o as INBOUND_COMMANDS, t as API_KEY_SCOPES, u as WEBHOOK_EVENT_LABELS } from "./autonomy-CEwFxjUt.mjs";
import { r as getAiStatus } from "./clients-CmcyBPZd.mjs";
import { r as TIKTOK_MODE_LABELS, t as PUBLISHERS_QUERY_KEY } from "./social-oauth.server-BkBN9MI7.mjs";
import { a as FILEBASE_ENDPOINT, t as DEFAULT_IPFS_GATEWAY } from "./social-machine-D22Q8XQF.mjs";
import { f as PRESET_LABELS, m as RENDER_PRESETS, u as LIBRARY_MEDIA_SETTINGS_KEY } from "./library-D-Mt5rXw.mjs";
import { i as LINEAR_COLUMN_LABELS, l as LINEAR_QUERY_KEY, r as LINEAR_COLUMN_HINTS, s as LINEAR_KANBAN_COLUMNS } from "./linear-CrgEmECq.mjs";
import { A as RotateCcw, At as Bot, C as ShieldCheck, Et as Check, F as Play, G as MessageCircle, I as Phone, M as Radio, N as Plus, P as PlugZap, S as Shield, U as MonitorPlay, Y as Lock, _t as Copy, at as HardDrive, b as SquareKanban, ct as FileJson, et as KeyRound, f as Unplug, gt as Cpu, ht as CreditCard, i as WandSparkles, jt as BookOpen, kt as Boxes, l as UserPlus, mt as Database, o as Video, ot as Globe, pt as Download, r as Webhook, rt as Image, t as Youtube, ut as ExternalLink, vt as Clapperboard, w as ShieldAlert, x as Sparkles } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, D as usePrefersReducedMotion, O as cn, m as userFacingErrorMessage, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bsan92LK.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { n as statusTone$1, t as Badge } from "./badge-CDaEWAH4.mjs";
import { n as useIntegrationsUi } from "./provider-BnICEAIZ.mjs";
import { a as saveIntegration, i as runDiscordAgentNow, n as disconnectIntegration, o as testIntegration, r as getIntegrationsStatus } from "./integrations-eci1pPRl.mjs";
import { i as downloadTextFile, t as copyTextToClipboard } from "./clipboard-Yt4ExP0v.mjs";
import { t as DEFAULT_PORTAL_SETTINGS, u as PORTAL_SETTINGS_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { a as LLM_PROVIDER_COPY, i as LLM_MODELS, n as LLM_FEATURES, o as LLM_PROVIDER_IDS, r as LLM_FEATURE_LABELS, s as LLM_QUERY_KEY } from "./llm-Nttit1BP.mjs";
import { a as getSkillFn, c as listSkillsFn, d as setSkillEnabledFn, f as testLlmProvider, i as getLlmSnapshot, l as saveLlmApiKey, n as createSkillFn, o as invokeSkillFn, r as disconnectLlmProvider, s as listSkillRunsFn, t as approveSkillFn, u as saveLlmRouter } from "./llm-fns-mh-4gnuG.mjs";
import { a as loadLinearCatalogFn, c as saveLinearOauthAppFn, i as getLinearStatusFn, l as startLinearOAuthFn, n as disconnectLinearFn, o as saveLinearApiKeyFn, r as ensureLinearMilestonesFn, s as saveLinearBindingFn, u as testLinearFn } from "./issue-actions-LfCDQlgU.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
import { n as SKILLS_QUERY_KEY, r as SKILL_RUNS_QUERY_KEY } from "./skills-BbKBTrYf.mjs";
import { r as PLATFORM_LABELS, s as SOCIAL_QUERY_KEY } from "./social-CmuIUyLc.mjs";
import { i as LEARNING_POLICY_KEY } from "./performance-Cj9pmeSi.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as Switch } from "./switch-BBV5HifB.mjs";
import { c as saveLearningPolicyFn, n as getLearningPolicyFn } from "./performance-fns-BnwGGujQ.mjs";
import { a as SOCIAL_LIFECYCLE_EVENTS, i as PLAYBOOK_PACKAGE_VERSION, n as ADDON_META, o as deriveConnectSteps, r as HERMES_CONNECTION_LABELS, t as ADDON_LAYER_LABELS } from "./connect-Vop9T4X0.mjs";
import { a as MAX_TRAINING_CHARS, c as TRAINING_SCOPES, d as formatCharCount, f as knowledgeEntriesQueryKey, l as TRAINING_SCOPE_META, s as TRAINING_PLACEHOLDER } from "./knowledge-DYmG2i4O.mjs";
import { n as SafeMarkdown, t as ChatInput } from "./markdown-BvUKUwQu.mjs";
import { _ as saveIpfsSettingsFn, c as getMediaSettingsFn, v as saveMediaSettingsFn, x as testRenderFn, y as saveS3SettingsFn } from "./library-fns-D3lY4Qo9.mjs";
import { n as getPortalSettingsFn, o as savePortalSettingsFn, t as KnowledgeProposalsInbox } from "./portal-admin-fns-BtapzDNa.mjs";
import { a as getAutonomySnapshot, c as revokeAutonomyKey, d as rotateWebhookSecret, f as saveAutomationSettings, h as testOutboundWebhook, l as rotateAutonomyKey, m as skipOutboundConnect, n as createAutonomyKey, o as listAutonomyAudit, p as saveOutboundWebhook, r as createHermesPresetKey, s as markPlaybookPasted, t as ackSocialVmPolicy, u as rotateMcpToken } from "./autonomy-admin-D-Lji9O1.mjs";
import { a as testResidentialProxyFn } from "./channel-fns-DBsr47y0.mjs";
import { t as Separator } from "./separator-DmLoB9bW.mjs";
import { n as SANDBOX_THREAT_MITIGATIONS, t as SANDBOX_LABELS } from "./sandbox-DPO25eIO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-C5t0l4Uv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("43a09b40b158553098de53bb4aa1ac9e2bbc488374fed59faa0fa7890440ad93"));
/** Connection health for the agency's Supabase project. Signed-in operators only. */
var getSupabaseStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e2168e4c3356eb148f143cfb07c325220358c36885e945d967db5ffd14bac7cd"));
var HiggsfieldSaveSchema = object({
	keyId: string().trim().min(8).max(200),
	secret: string().trim().min(8).max(400)
});
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => HiggsfieldSaveSchema.parse(input)).handler(createSsrRpc("bbb77fc82c862c6754e4292ea9012f7af5bfcbec38bc9de17b8d0b5f4f5a1097"));
var YoutubeKeySchema = object({ apiKey: string().trim().min(8).max(200) });
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => YoutubeKeySchema.parse(input)).handler(createSsrRpc("d19def7c00ec7a687a5d8eea775a0e10a0287193d8673e1828e6482be13a8a46"));
var startGrokOAuth = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("356959323bfab350d2f09a3ecd2e9afe8ae1da101307fba4ac9e7699d218c72a"));
var pollGrokOAuth = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("9baaf3fa102e791b58ab6c2892c2cf3b9b48f71ef1dd95160d1a706b45601cb1"));
var disconnectGrokOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("1b06bc2f1d50513646095115c2fb4faa8d5ccc84db60a7c51109053b4906911d"));
var scopeSchema = _enum(TRAINING_SCOPES);
var listKnowledgeEntries = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ scope: scopeSchema }).parse(input)).handler(createSsrRpc("eabe09fa712c53084c5ae8a43ff0fc123daebab19d18c42c301b848ff5e25b14"));
var sendTrainingMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	content: string()
}).parse(input)).handler(createSsrRpc("f1d19845aa50f64cb4a4d6c07f100cabf48f3bda58558335ba32f4a07e8c188f"));
var summarizeKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ scope: scopeSchema }).parse(input)).handler(createSsrRpc("96d2268ceb5c7f08c297c1bffa97742db439087c7016e6059aa30a4c759980ba"));
var resetKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	scope: scopeSchema,
	confirm: literal(true)
}).parse(input)).handler(createSsrRpc("8f96a907679a10e5d6aade6bfb945e1d6ad2d6912566380c71ab94408b8980d6"));
function LearningPanel() {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: LEARNING_POLICY_KEY,
		queryFn: () => getLearningPolicyFn()
	});
	const save = useMutation({
		mutationFn: saveLearningPolicyFn,
		onSuccess: async () => {
			toast.success("Learning policy saved");
			await queryClient.invalidateQueries({ queryKey: LEARNING_POLICY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" });
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load learning policy",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	const { policy, metricsApi } = query.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Learning from winners"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "After a post scores as a winner, the OS drafts a KnowledgeProposal. Auto-merge stays off so Ideation and titles only change after you approve."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: metricsApi.youtube ? "green" : "neutral",
					children: ["YouTube ", metricsApi.youtube ? "metrics API" : "manual only"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: metricsApi.x ? "green" : "neutral",
					children: ["X ", metricsApi.x ? "metrics API" : "manual only"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: metricsApi.tiktok ? "green" : "neutral",
					children: ["TikTok ", metricsApi.tiktok ? "metrics API" : "manual only"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: metricsApi.instagram ? "green" : "neutral",
					children: ["IG ", metricsApi.instagram ? "metrics API" : "manual only"]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-body",
						children: "learning.enabled"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-caption text-muted",
						children: "Draft proposals from winning posts."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: policy.enabled,
						onCheckedChange: (enabled) => save.mutate({ data: {
							...policy,
							enabled
						} })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-body",
						children: "learning.autoMerge"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-caption text-muted",
						children: "Off by default. Do not auto-write KnowledgeEntry."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: policy.autoMerge,
						onCheckedChange: (autoMerge) => save.mutate({ data: {
							...policy,
							autoMerge
						} })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
							id: "min-score",
							label: "Min score",
							value: policy.minScore,
							onCommit: (minScore) => save.mutate({ data: {
								...policy,
								minScore
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
							id: "winner-pct",
							label: "Winner percentile",
							value: policy.winnerPercentile,
							onCommit: (winnerPercentile) => save.mutate({ data: {
								...policy,
								winnerPercentile
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
							id: "min-views",
							label: "Min views",
							value: policy.minViews,
							onCommit: (minViews) => save.mutate({ data: {
								...policy,
								minViews
							} })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "fetch-delays",
							children: "Fetch delays (hours)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "fetch-delays",
							defaultValue: policy.fetchDelaysHours.join(", "),
							onBlur: (event) => {
								const hours = event.target.value.split(/[,\s]+/).map((part) => Number(part)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 720).slice(0, 6);
								if (!hours.length) return;
								if (!(hours.length === policy.fetchDelaysHours.length && hours.every((n, i) => n === policy.fetchDelaysHours[i]))) save.mutate({ data: {
									...policy,
									fetchDelaysHours: hours
								} });
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "After a successful publish, stats are pulled at these offsets. Default 1, 24, 168 (7 days)."
						})
					]
				}),
				save.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Saving…"
				}) : null
			]
		})
	] });
}
function NumberField({ id, label, value, onCommit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			type: "number",
			defaultValue: value,
			onBlur: (event) => {
				const n = Number(event.target.value);
				if (Number.isFinite(n) && n !== value) onCommit(Math.round(n));
			}
		})]
	});
}
function TypingIndicator() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-start",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3",
			"aria-live": "polite",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Assistant is extracting principles"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "typing-dots",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				]
			})]
		})
	});
}
function CollapsiblePaste({ text }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	if (text.length <= 900) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "whitespace-pre-wrap text-body",
		children: text
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "whitespace-pre-wrap text-body",
		children: open ? text : `${text.slice(0, 480).trim()}…`
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "mt-2 min-h-11 text-caption text-accent hover:underline",
		onClick: () => setOpen((value) => !value),
		children: open ? "Show less" : `Show full paste (${formatCharCount(text.length)})`
	})] });
}
function TrainerEmpty({ hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-1 flex-col items-center justify-center px-6 py-8 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-sm text-body text-muted",
			children: hint
		})
	});
}
function TrainingChat({ scope }) {
	const meta = TRAINING_SCOPE_META[scope];
	const queryClient = useQueryClient();
	const reduced = usePrefersReducedMotion();
	const endRef = (0, import_react.useRef)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [pendingPaste, setPendingPaste] = (0, import_react.useState)(null);
	const [viewOpen, setViewOpen] = (0, import_react.useState)(false);
	const [resetOpen, setResetOpen] = (0, import_react.useState)(false);
	const [summary, setSummary] = (0, import_react.useState)(null);
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const llmReady = aiQuery.data?.llm ?? false;
	const llmKnown = aiQuery.isSuccess;
	const listQuery = useQuery({
		queryKey: knowledgeEntriesQueryKey(scope),
		queryFn: () => listKnowledgeEntries({ data: { scope } })
	});
	const send = useMutation({
		mutationFn: (content) => sendTrainingMessage({ data: {
			scope,
			content
		} }),
		onMutate: (content) => {
			setFailed(false);
			setPendingPaste(content);
			setDraft("");
		},
		onSuccess: (entry) => {
			setPendingPaste(null);
			queryClient.setQueryData(knowledgeEntriesQueryKey(scope), (current) => [...current ?? [], entry]);
			queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey(scope) });
		},
		onError: (error, content) => {
			setPendingPaste(null);
			setDraft((current) => current.trim() ? current : content);
			setFailed(true);
			captureClientError(error, { source: "training-send" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const summarize = useMutation({
		mutationFn: () => summarizeKnowledge({ data: { scope } }),
		onSuccess: (result) => setSummary(result.summary),
		onError: (error) => {
			captureClientError(error, { source: "training-summary" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const reset = useMutation({
		mutationFn: () => resetKnowledge({ data: {
			scope,
			confirm: true
		} }),
		onSuccess: () => {
			queryClient.setQueryData(knowledgeEntriesQueryKey(scope), []);
			queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey(scope) });
			setResetOpen(false);
			setSummary(null);
			toast.success(`${meta.title} cleared`);
		},
		onError: (error) => {
			captureClientError(error, { source: "training-reset" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const entries = listQuery.data ?? [];
	const inFlight = send.isPending || summarize.isPending;
	const overLimit = draft.length > MAX_TRAINING_CHARS;
	const inputDisabled = llmKnown && !llmReady || inFlight;
	const sizeHint = (0, import_react.useMemo)(() => {
		if (!draft) return void 0;
		return overLimit ? `${formatCharCount(draft.length)} — over the ${formatCharCount(MAX_TRAINING_CHARS)} limit` : formatCharCount(draft.length);
	}, [draft, overLimit]);
	(0, import_react.useEffect)(() => {
		if (reduced) return;
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [
		entries.length,
		send.isPending,
		pendingPaste,
		reduced
	]);
	function onSend() {
		const content = draft.trim();
		if (!content || overLimit || inputDisabled) return;
		send.mutate(content);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "flex min-h-[28rem] flex-col overflow-hidden p-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3 border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-9 place-items-center rounded-control bg-secondary-surface",
						children: scope === "THUMBNAIL_GLOBAL" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
							className: "size-4",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
							className: "size-4",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: meta.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-caption text-muted",
						children: ["Injects into ", meta.injectsInto]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: () => {
							setViewOpen(true);
							summarize.mutate();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
							className: "size-4",
							"aria-hidden": "true"
						}), "View current knowledge"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						disabled: entries.length === 0,
						onClick: () => setResetOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Reset knowledge"]
					})]
				})]
			}),
			llmKnown && !llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
			}) : null,
			listQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col gap-3 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-3/4 rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "ml-auto h-16 w-2/3 rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-4/5 rounded-card" })
				]
			}) : listQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-1 items-center px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					title: "Couldn’t load training",
					description: "Retry this trainer. Other settings are still available.",
					onRetry: () => void listQuery.refetch()
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4",
				"aria-live": "polite",
				"aria-busy": send.isPending,
				children: [
					entries.length === 0 && !send.isPending && !pendingPaste ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrainerEmpty, { hint: meta.emptyHint }) : null,
					entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "msg-bubble-user max-w-[min(100%,36rem)] px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsiblePaste, { text: entry.userInput })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-start",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeMarkdown, { content: entry.learnedPrinciple })
							})
						})]
					}, entry.id)),
					pendingPaste ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "msg-bubble-user max-w-[min(100%,36rem)] px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsiblePaste, { text: pendingPaste })
						})
					}) : null,
					send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingIndicator, {}) : null,
					failed && !send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3",
							role: "alert",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-body",
								children: "Nothing was stored. The paste is still in the composer."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "sm",
								className: "mt-3",
								onClick: () => {
									if (draft.trim()) send.mutate(draft);
								},
								disabled: !draft.trim() || inputDisabled,
								children: "Retry"
							})]
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0 px-3 pb-3 pt-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatInput, {
					value: draft,
					onChange: setDraft,
					onSend,
					disabled: inputDisabled,
					sending: send.isPending,
					placeholder: TRAINING_PLACEHOLDER,
					inputId: `training-input-${scope.toLowerCase()}`,
					maxLength: null,
					maxGrowPx: 240,
					sendDisabled: overLimit,
					hint: sizeHint
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: viewOpen,
				onOpenChange: (open) => {
					setViewOpen(open);
					if (!open) {
						setSummary(null);
						summarize.reset();
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "w-[min(100%-2rem,36rem)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
							"Current ",
							meta.short,
							" knowledge"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Topic-grouped summary of ACTIVE principles. This summary is not stored as new training." }),
						llmKnown && !llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
						}) : summarize.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-2/3" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-5/6" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4" })
							]
						}) : summarize.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
								title: "Couldn’t summarize",
								description: "Retry to generate the topic summary. Your training is unchanged.",
								onRetry: () => summarize.mutate()
							})
						}) : summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 max-h-[min(24rem,50dvh)] overflow-y-auto pr-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeMarkdown, { content: summary })
						}) : null
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: resetOpen,
				onOpenChange: setResetOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
						"Reset ",
						meta.title,
						"?"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"This clears ",
						meta.title,
						" (",
						scope,
						"). ",
						meta.injectsInto,
						" will stop receiving these principles immediately. Records are kept internally as deprecated so an admin can recover them — they are no longer injected."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setResetOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							onClick: () => reset.mutate(),
							disabled: reset.isPending,
							children: "Reset knowledge"
						})]
					})
				] })
			})
		]
	});
}
function AiTrainingSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "ai-training",
		className: "mt-10 scroll-mt-24",
		"aria-labelledby": "ai-training-heading",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "ai-training-heading",
					className: "text-section font-semibold tracking-tight",
					children: "AI Training"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-body text-muted",
					children: "Train the global knowledge used by Ideation and Thumbnails. Knowledge compounds over time and is injected into every relevant AI call. Winning posts draft proposals here — they never auto-inject."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearningPanel, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KnowledgeProposalsInbox, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Thumbnail Training",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrainingChat, { scope: "THUMBNAIL_GLOBAL" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Video & Ideation Training",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrainingChat, { scope: "VIDEO_GLOBAL" })
				})]
			})
		]
	});
}
var ProviderSchema = _enum([
	"x",
	"tiktok",
	"instagram",
	"youtube"
]);
var getSocialPublishers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("99737c9386af68f0eb638407aafdfbb17e5eba191fa9bf951e8a647c0c9cb74e"));
var savePublisherAppFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: ProviderSchema,
	clientId: string().min(6).max(200),
	clientSecret: string().min(6).max(400)
}).parse(input)).handler(createSsrRpc("c1dfe5c40686894ae9aed00fdcdc5778103b62721f7950d748128cff7c1ed3a5"));
var startPublisherOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: ProviderSchema }).parse(input)).handler(createSsrRpc("36a4239799667d7e4c4a0f58cb4948cf75123a3da0ee05cf498fce8b67a84dd0"));
var testPublisherFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: ProviderSchema }).parse(input)).handler(createSsrRpc("1a94fcbb00c217215f984cd9d34c90c71181fea5f154391d666f0669b4817386"));
var disconnectPublisherFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: ProviderSchema,
	tokensOnly: boolean().optional()
}).parse(input)).handler(createSsrRpc("952a706fe9108b21df8f1bc9a8af27be70e52afe6dd76d02d70a5c1c8c92658d"));
var selectInstagramAccountFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ igUserId: string().min(1) }).parse(input)).handler(createSsrRpc("5523341c920fc892e842d23abdbb6bc966401358750de40818bd289b4c3ae036"));
var setTikTokModeFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ mode: _enum(["inbox", "direct"]) }).parse(input)).handler(createSsrRpc("a778cecbb615f73f20f7be5cfa8b983d7286a299b6bd6961a4343ad17ae61857"));
var setTikTokAuditFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ status: _enum([
	"UNAUDITED",
	"AUDITED",
	"UNKNOWN"
]) }).parse(input)).handler(createSsrRpc("4b4e35559197e43cd3b7c5771153655836b700d0b8a31e67996bfb54abe1872c"));
var setTikTokDomainFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ domain: string().max(200) }).parse(input)).handler(createSsrRpc("cb7a4e435c9a8051ab79d3973c76cfe108c1d811310581e663c95773b018ec0c"));
var setYoutubePublishDefaultsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	categoryId: string().max(8).optional(),
	privacyDefault: _enum([
		"private",
		"unlisted",
		"public"
	]).optional()
}).parse(input)).handler(createSsrRpc("301320a7af95f80f8bbf0a0749626c18674da0dc46ce6fb039dd51a4a887df02"));
function GrokOAuthSection({ embedded = false }) {
	const queryClient = useQueryClient();
	const statusQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const source = statusQuery.data?.llmSource ?? "none";
	const email = statusQuery.data?.grokEmail ?? null;
	const connected = source === "oauth";
	const platform = source === "platform";
	const [device, setDevice] = (0, import_react.useState)(null);
	const start = useMutation({
		mutationFn: () => startGrokOAuth(),
		onSuccess: (data) => setDevice(data),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const disconnect = useMutation({
		mutationFn: () => disconnectGrokOAuthFn(),
		onSuccess: async () => {
			toast.success("SuperGrok disconnected");
			await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Grok 4.6"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "SuperGrok Heavy via the same sign-in Grok Build and Hermes use."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone$1(connected ? "CONNECTED" : platform ? "ACTIVE" : "PENDING"),
				children: connected ? "SuperGrok" : platform ? "Platform key" : "Not connected"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 text-body text-muted",
			children: [
				"Connect your SuperGrok account so Ideation, titles, ideas, and training run on Grok 4.6 against your subscription. Tokens stay on the server.",
				email ? ` Signed in as ${email}.` : null,
				platform && !connected ? " A workspace key is already active for this preview." : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5 flex flex-wrap gap-2",
			children: connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				disabled: disconnect.isPending,
				onClick: () => disconnect.mutate(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {
					className: "size-4",
					"aria-hidden": "true"
				}), disconnect.isPending ? "Disconnecting…" : "Disconnect SuperGrok"]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: start.isPending,
				onClick: () => start.mutate(),
				children: start.isPending ? "Starting…" : "Connect SuperGrok"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeviceDialog, {
			device,
			onClose: () => setDevice(null),
			onConnected: async () => {
				setDevice(null);
				toast.success("SuperGrok connected");
				await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
				await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
				await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
			}
		})
	] });
	if (embedded) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-control border border-border/70 bg-secondary-surface/40 p-4",
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: inner });
}
function DeviceDialog({ device, onClose, onConnected }) {
	const intervalRef = (0, import_react.useRef)(device?.interval ?? 5);
	(0, import_react.useEffect)(() => {
		if (!device) return;
		intervalRef.current = device.interval;
		let cancelled = false;
		let timer = 0;
		const tick = async () => {
			try {
				const result = await pollGrokOAuth();
				if (cancelled) return;
				if (result.status === "connected") {
					await onConnected();
					return;
				}
				if (result.status === "expired" || result.status === "denied") {
					toast.error(result.status === "denied" ? "Sign-in was denied." : "That code expired. Start SuperGrok sign-in again.");
					onClose();
					return;
				}
				if (result.status === "slow_down") intervalRef.current = result.interval;
			} catch {}
			if (!cancelled) timer = window.setTimeout(() => void tick(), intervalRef.current * 1e3);
		};
		timer = window.setTimeout(() => void tick(), intervalRef.current * 1e3);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [
		device,
		onClose,
		onConnected
	]);
	if (!device) return null;
	const href = device.verificationUriComplete ?? device.verificationUri;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (open) => {
			if (!open) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Approve SuperGrok" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Open the Grok sign-in page and approve this workspace. The same device flow Grok Build and Hermes Agent use." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-center font-mono text-page tracking-[0.2em]",
				children: device.userCode
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href,
						target: "_blank",
						rel: "noreferrer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Open Grok sign-in"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => {
						copyTextToClipboard(device.userCode).then((ok) => {
							toast[ok ? "success" : "error"](ok ? "Code copied" : "Couldn’t copy");
						});
					},
					children: "Copy code"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-caption text-muted",
				children: "Waiting for approval… this dialog closes when Grok confirms."
			})
		] })
	});
}
function XMarkIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.02-9.16L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18.15h1.81L6.99 3.76H5.05l12.03 16.39Z"
		})
	});
}
var ICONS = {
	ai: Sparkles,
	higgsfield: Image,
	youtube: Youtube,
	discord: Bot,
	notion: BookOpen,
	linear: SquareKanban,
	x: XMarkIcon,
	daytona: MonitorPlay,
	telegram: MessageCircle,
	whatsapp: Phone,
	airwallex: CreditCard
};
function IntegrationsPanel() {
	const query = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const isAdmin = query.data?.role === "admin";
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Add-ons"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-body text-muted",
			children: "Keys stay on the server. Test Connection never returns secrets."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2",
			children: INTEGRATION_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 w-full rounded-card" }, id))
		})]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Add-ons"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "Couldn’t load integrations",
			description: "Status couldn’t be read. Try again.",
			onRetry: () => void query.refetch()
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Add-ons"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-body text-muted",
			children: "ClippyOS is an OS. These integrations are add-ons. Core AI is required. Daytona is the browser runtime for Social Computer Use. Keys stay on the server."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2",
			children: INTEGRATION_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntegrationCard, {
				id,
				isAdmin: Boolean(isAdmin),
				last4: query.data.items[id].last4,
				health: query.data.items[id].health,
				lastTestedAt: query.data.items[id].lastTestedAt,
				lastError: query.data.items[id].lastError,
				discordAgent: id === "discord" ? query.data.discordAgent : null,
				handle: query.data.items[id].handle ?? null
			}, id))
		})]
	});
}
function IntegrationCard({ id, isAdmin, last4, health, lastTestedAt, lastError, discordAgent, handle }) {
	const copy = INTEGRATION_COPY[id];
	const Icon = ICONS[id];
	const { openGuide } = useIntegrationsUi();
	const queryClient = useQueryClient();
	const [reveal, setReveal] = (0, import_react.useState)(false);
	const [pendingDisconnect, setPendingDisconnect] = (0, import_react.useState)(false);
	const [fields, setFields] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (id !== "x") return;
		function onMessage(event) {
			if (event.origin !== window.location.origin) return;
			const data = event.data;
			if (!data || data.source !== "clippy-social-oauth") return;
			if (data.provider && data.provider !== "x") return;
			queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
			if (data.ok) toast.success("X connected");
			else toast.error(data.error || "Couldn’t connect X");
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [id, queryClient]);
	const save = useMutation({
		mutationFn: () => saveIntegration({ data: {
			id,
			values: fields
		} }),
		onSuccess: async () => {
			setFields({});
			toast.success(`${copy.name} saved`);
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const test = useMutation({
		mutationFn: () => testIntegration({ data: id }),
		onSuccess: async () => {
			toast.success("Connected");
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const testProxy = useMutation({
		mutationFn: () => testResidentialProxyFn({ data: { proxyUrl: fields.proxyUrl || void 0 } }),
		onSuccess: (result) => {
			toast.success(result.egressIp ? `Proxy egress ${result.egressIp}. The Social Machine was not started.` : "Proxy responded. The Social Machine was not started.");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const disconnect = useMutation({
		mutationFn: () => disconnectIntegration({ data: id }),
		onSuccess: async () => {
			setPendingDisconnect(false);
			toast.success(`${copy.name} disconnected`);
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const connectX = useMutation({
		mutationFn: () => startPublisherOAuthFn({ data: { provider: "x" } }),
		onSuccess: async (data) => {
			if (!window.open(data.url, "clippy-social-oauth", "popup=yes,width=560,height=740")) {
				const ok = await copyTextToClipboard(data.url);
				toast.message(ok ? "Pop-up blocked — the connect URL is copied. Open it in a new tab." : "Pop-up blocked. Allow pop-ups, then Connect X again.");
			}
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const runAgent = useMutation({
		mutationFn: () => runDiscordAgentNow(),
		onSuccess: async (result) => {
			toast.success(result.summary ?? "Agent finished");
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onSave(event) {
		event.preventDefault();
		save.mutate();
	}
	const configured = health !== "not_configured";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: copy.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: copy.purpose
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: healthTone(health),
				children: healthLabel$1(health)
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: ADDON_META[id].layer === "core" ? "teal" : "neutral",
				children: ADDON_LAYER_LABELS[ADDON_META[id].layer]
			}), copy.required ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "orange",
				children: "Required"
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-caption text-muted",
			children: ADDON_META[id].requiredFor
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-caption text-muted",
			children: ["Used by: ", ADDON_META[id].usedBy.join(" · ")]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-caption text-muted",
			children: [lastTestedAt ? `Last tested ${formatRelativeTime(lastTestedAt)}` : "Not tested yet", lastError ? ` · ${lastError}` : null]
		}),
		id === "x" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-caption",
			children: handle ? `API connected as ${handle.startsWith("@") ? handle : `@${handle}`}` : "API not connected — Social X uploads use Computer Use."
		}) : null,
		id === "linear" && handle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-caption",
			children: [
				"Linear connected as ",
				handle,
				"."
			]
		}) : null,
		configured && last4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 font-mono text-caption",
			children: [reveal ? last4 : "•••• configured", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ml-2 text-accent",
				onClick: () => setReveal((value) => !value),
				children: reveal ? "Hide" : "Reveal last 4"
			})]
		}) : null,
		id === "ai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GrokOAuthSection, { embedded: true })
		}) : null,
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 flex flex-col gap-3",
			onSubmit: onSave,
			children: [
				id === "ai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: `${id}-key`,
					label: "API key",
					value: fields.key ?? "",
					onChange: (value) => setFields({ key: value }),
					placeholder: configured ? "•••• stored on the server" : "Paste the xAI / Grok API key"
				}) : null,
				id === "higgsfield" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "hf-key",
					label: "Key ID",
					value: fields.keyId ?? "",
					onChange: (value) => setFields((cur) => ({
						...cur,
						keyId: value
					})),
					placeholder: configured ? "•••• stored" : "Higgsfield key ID"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "hf-secret",
					label: "Secret",
					value: fields.secret ?? "",
					onChange: (value) => setFields((cur) => ({
						...cur,
						secret: value
					})),
					placeholder: configured ? "•••• stored" : "Higgsfield secret"
				})] }) : null,
				id === "youtube" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "yt-key",
					label: "API key",
					value: fields.apiKey ?? "",
					onChange: (value) => setFields({ apiKey: value }),
					placeholder: configured ? "•••• stored" : "YouTube Data API key"
				}) : null,
				id === "discord" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "dc-token",
					label: "Bot token",
					value: fields.token ?? "",
					onChange: (value) => setFields({ token: value }),
					placeholder: configured ? "•••• stored" : "Discord bot token"
				}) : null,
				id === "notion" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "nt-token",
					label: "Integration token",
					value: fields.token ?? "",
					onChange: (value) => setFields({ token: value }),
					placeholder: configured ? "•••• stored" : "Notion token"
				}) : null,
				id === "linear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "linear-key",
					label: "API key",
					value: fields.apiKey ?? "",
					onChange: (value) => setFields({ apiKey: value }),
					placeholder: configured ? "•••• stored on the server" : "lin_api_…"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Personal API key or OAuth. Map team, project, and Kanban columns in the Linear section below. Test never creates an issue."
				})] }) : null,
				id === "daytona" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-key",
						label: "API key",
						value: fields.key ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							key: value
						})),
						placeholder: configured ? "•••• stored on the server" : "Paste the Daytona API key"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-url",
						label: "API URL",
						type: "url",
						value: fields.apiUrl ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							apiUrl: value
						})),
						placeholder: "https://app.daytona.io/api"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-target",
						label: "Region",
						type: "text",
						value: fields.target ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							target: value
						})),
						placeholder: "us or eu — Daytona has no Australia region"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-size",
						label: "Windows size",
						type: "text",
						value: fields.size ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							size: value
						})),
						placeholder: "windows-large (4 vCPU / 16 GiB) or windows-medium"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-stop",
						label: "Idle hibernate minutes",
						type: "number",
						value: fields.autoStopMinutes ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							autoStopMinutes: value
						})),
						placeholder: "20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-proxy-url",
						label: "Paste proxy URL",
						type: "url",
						value: fields.proxyUrl ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							proxyUrl: value
						})),
						placeholder: "https://user:pass@gate.au.example:8000"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-proxy-host",
						label: "Residential host",
						type: "text",
						value: fields.proxyHost ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							proxyHost: value
						})),
						placeholder: "gate.sydney.example"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-proxy-port",
						label: "Port",
						type: "number",
						value: fields.proxyPort ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							proxyPort: value
						})),
						placeholder: "8000"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-proxy-user",
						label: "Username",
						type: "text",
						value: fields.proxyUsername ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							proxyUsername: value
						})),
						placeholder: "au-user"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "dtn-proxy-pass",
						label: "Password",
						value: fields.proxyPassword ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							proxyPassword: value
						})),
						placeholder: "••••"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Social Machine is a Windows VM. Hibernate pauses a hot snapshot (logins persist). Clock is Australia/Sydney. Daytona only offers US and EU IPs — Instagram Graph API is the reliable AU publish path; a residential HTTPS proxy is optional for browser login. Test Connection and Test proxy never start a VM."
					})
				] }) : null,
				id === "telegram" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "tg-token",
						label: "Bot token",
						value: fields.token ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							token: value
						})),
						placeholder: configured ? "•••• stored" : "123456:ABC…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "tg-secret",
						label: "Webhook secret",
						value: fields.webhookSecret ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							webhookSecret: value
						})),
						placeholder: configured ? "•••• stored" : "Optional — generated if blank"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Professional inbox at Inbox. Set the bot webhook to /api/webhooks/telegram. Test never sends a customer message."
					})
				] }) : null,
				id === "whatsapp" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "wa-token",
						label: "Cloud API token",
						value: fields.token ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							token: value
						})),
						placeholder: configured ? "•••• stored" : "Permanent or system user token"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "wa-phone",
						label: "Phone number ID",
						type: "text",
						value: fields.phoneNumberId ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							phoneNumberId: value
						})),
						placeholder: "1555…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "wa-verify",
						label: "Verify token",
						type: "text",
						value: fields.verifyToken ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							verifyToken: value
						})),
						placeholder: "Webhook hub.verify_token"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "wa-secret",
						label: "App secret",
						value: fields.appSecret ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							appSecret: value
						})),
						placeholder: configured ? "•••• stored" : "X-Hub-Signature-256"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Meta Cloud API only — not WhatsApp Web on the VM. Webhook: /api/webhooks/whatsapp. Test never sends a customer message."
					})
				] }) : null,
				id === "airwallex" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-client",
						label: "Client ID",
						type: "text",
						value: fields.clientId ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							clientId: value
						})),
						placeholder: configured ? "•••• stored on the server" : "Airwallex client ID"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-key",
						label: "API key",
						value: fields.apiKey ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							apiKey: value
						})),
						placeholder: configured ? "•••• stored on the server" : "Airwallex API key"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-wh",
						label: "Webhook secret",
						value: fields.webhookSecret ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							webhookSecret: value
						})),
						placeholder: configured ? "•••• stored" : "Webhook signing secret"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-le",
						label: "Legal entity ID",
						type: "text",
						value: fields.legalEntityId ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							legalEntityId: value
						})),
						placeholder: "le_…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-acct",
						label: "Linked payment account ID",
						type: "text",
						value: fields.linkedPaymentAccountId ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							linkedPaymentAccountId: value
						})),
						placeholder: "acct_…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-env",
						label: "Environment (sandbox or live)",
						type: "text",
						value: fields.env ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							env: value
						})),
						placeholder: "sandbox"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-starter",
						label: "Starter price ID",
						type: "text",
						value: fields.priceStarter ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							priceStarter: value
						})),
						placeholder: "pri_…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-pro",
						label: "Pro price ID",
						type: "text",
						value: fields.pricePro ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							pricePro: value
						})),
						placeholder: "pri_…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "awx-agency",
						label: "Agency price ID",
						type: "text",
						value: fields.priceAgency ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							priceAgency: value
						})),
						placeholder: "pri_…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Hosted Billing Checkout only — cards, Apple Pay, and Google Pay for subscriptions. Test Connection logs in; it never opens checkout. Crypto (e.g. BitPay) is an Airwallex one-off PAYMENT method, not recurring subscriptions."
					})
				] }) : null,
				id === "x" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "x-client-id",
						label: "Client ID",
						type: "text",
						value: fields.clientId ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							clientId: value
						})),
						placeholder: configured ? "•••• stored on the server" : "X OAuth 2.0 Client ID"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "x-client-secret",
						label: "Client secret",
						value: fields.clientSecret ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							clientSecret: value
						})),
						placeholder: configured ? "•••• stored on the server" : "X Client Secret"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "x-api-base",
						label: "API host",
						type: "url",
						value: fields.apiBase ?? "",
						onChange: (value) => setFields((cur) => ({
							...cur,
							apiBase: value
						})),
						placeholder: "https://api.x.com"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all font-mono text-caption text-muted",
							children: typeof window !== "undefined" ? `${window.location.origin}/api/oauth/social` : "/api/oauth/social"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							onClick: async () => {
								const value = typeof window !== "undefined" ? `${window.location.origin}/api/oauth/social` : "/api/oauth/social";
								const ok = await copyTextToClipboard(value);
								toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Copy callback"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "User-context OAuth only. Tokens stay on the server. Test Connection never posts. X has no draft API — draft jobs stay local until Publish."
					})
				] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "secondary",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: "Only owners can change keys."
		}),
		id === "discord" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-caption text-muted",
			children: ["Discord Status Agent is read-only and runs automatically about every 30 minutes. It matches Discord server names to client names and updates production stages.", discordAgent?.lastRunAt ? ` Last run ${formatRelativeTime(discordAgent.lastRunAt)}${discordAgent.summary ? ` — ${discordAgent.summary}` : ""}.` : null]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => openGuide(id),
					children: "Setup Guide"
				}),
				isAdmin && id === "x" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "secondary",
					disabled: !configured || connectX.isPending,
					onClick: () => connectX.mutate(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, { className: "size-3.5" }), connectX.isPending ? "Connecting…" : "Connect X"]
				}) : null,
				isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "secondary",
					disabled: test.isPending,
					onClick: () => test.mutate(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, { className: "size-3.5" }), test.isPending ? "Testing…" : id === "x" ? "Test Connection" : "Test"]
				}) : null,
				isAdmin && id === "daytona" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					disabled: testProxy.isPending,
					onClick: () => testProxy.mutate(),
					children: testProxy.isPending ? "Probing…" : "Test proxy"
				}) : null,
				isAdmin && configured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => setPendingDisconnect(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, { className: "size-3.5" }), "Disconnect"]
				}) : null,
				isAdmin && id === "discord" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					disabled: runAgent.isPending,
					onClick: () => runAgent.mutate(),
					children: runAgent.isPending ? "Running…" : "Run agent now"
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: pendingDisconnect,
			onOpenChange: setPendingDisconnect,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
					"Disconnect ",
					copy.name,
					"?"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: id === "x" ? "OAuth tokens are cleared. Client ID and secret stay so you can Connect X again. Social X uploads fall back to Computer Use." : "The saved secret is removed. Features that need it will show a setup banner until you connect again." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						disabled: disconnect.isPending,
						onClick: () => disconnect.mutate(),
						children: "Disconnect"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setPendingDisconnect(false),
						children: "Cancel"
					})]
				})
			] })
		})
	] });
}
function Field({ id, label, value, onChange, placeholder, type = "password" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			type,
			autoComplete: "new-password",
			spellCheck: false,
			value,
			placeholder,
			onChange: (event) => onChange(event.target.value)
		})]
	});
}
var PROVIDERS = [
	"x",
	"tiktok",
	"instagram",
	"youtube"
];
var GUIDES = {
	x: {
		title: "X (API publish)",
		time: "~10 min",
		steps: [
			{
				title: "Create a Project and App",
				body: "In the X Developer Portal, create a Project and an App with OAuth 2.0. User-context tokens are required — app-only Bearer tokens cannot post."
			},
			{
				title: "Set the callback URL",
				body: "Paste the callback URL from this card into User authentication settings. Copy it from the OAuth callback row above."
			},
			{
				title: "Enable user auth and scopes",
				body: "Enable tweet.read, tweet.write, users.read, media.write, and offline.access."
			},
			{
				title: "Save, Connect X, Test Connection",
				body: "Paste Client ID and Client Secret, Save, then Connect X. Test verifies the user token without posting. X has no draft API — draft jobs stay local until Publish. Computer Use remains the fallback."
			}
		]
	},
	tiktok: {
		title: "TikTok Content Posting API",
		time: "~15 min",
		steps: [
			{
				title: "Create a TikTok app",
				body: "In TikTok for Developers, create an app and add Login Kit plus the Content Posting API product."
			},
			{
				title: "Set the redirect URL",
				body: "Paste the Agency Admin callback URL from this page into the TikTok app’s redirect URI list."
			},
			{
				title: "Request scopes",
				body: "Request user.info.basic, video.upload (inbox drafts), and video.publish (Direct Post). Each creator must consent this app."
			},
			{
				title: "Audit for public Direct Post",
				body: "Until TikTok approves the content posting audit, public Direct Post is usually blocked. Keep default mode on Inbox drafts. Mark Audited here only after TikTok approves the app."
			},
			{
				title: "Connect the creator account",
				body: "Save the client key and secret, Connect TikTok, then Test Connection. Test never posts. Optional: add a verified domain to allow PULL_FROM_URL instead of chunked upload."
			}
		]
	},
	instagram: {
		title: "Instagram (Reels API)",
		time: "~15–20 min",
		steps: [
			{
				title: "Create a Meta app (Business type)",
				body: "In Meta for Developers, create a Business-type app. Development mode only works for role-based test users until App Review."
			},
			{
				title: "Add Instagram and the redirect URL",
				body: "Add the Instagram product and Facebook Login for Business. Paste the Agency Admin callback URL from this page into Valid OAuth Redirect URIs."
			},
			{
				title: "Use a professional Instagram account",
				body: "Convert or use a Business or Creator account linked to a Facebook Page. Personal Instagram accounts cannot publish via API — use Computer Use for those logins."
			},
			{
				title: "Permissions and App Review",
				body: "Request instagram_basic, instagram_content_publish, pages_show_list, and pages_read_engagement. For live traffic beyond testers, complete App Review for instagram_content_publish."
			},
			{
				title: "Connect and select the IG account",
				body: "Save App ID and App Secret, Connect Instagram, then pick the professional account. Test Connection reads metadata and never publishes."
			}
		]
	},
	youtube: {
		title: "YouTube (Publish)",
		time: "~15 min",
		steps: [
			{
				title: "Create a Google Cloud project",
				body: "Enable YouTube Data API v3. This OAuth client is for upload — it is separate from the public Data API key used for analytics."
			},
			{
				title: "Create an OAuth web client",
				body: "Credentials → OAuth 2.0 Client ID → Web application. Paste the Agency Admin callback URL into Authorized redirect URIs."
			},
			{
				title: "Sensitive scope + test users",
				body: "youtube.upload is a sensitive scope. Until Google verifies the app, only listed test users can grant it. Request youtube.upload and youtube.readonly."
			},
			{
				title: "Save, Connect, Test",
				body: "Paste Client ID and Secret, Save, then Connect YouTube. Test lists the channel (channels.list mine=true) and never uploads. Draft jobs land private. Computer Use remains the fallback."
			}
		]
	}
};
function SocialPublishersPanel() {
	const query = useQuery({
		queryKey: PUBLISHERS_QUERY_KEY,
		queryFn: () => getSocialPublishers()
	});
	const metricsQuery = useQuery({
		queryKey: LEARNING_POLICY_KEY,
		queryFn: () => getLearningPolicyFn()
	});
	const [guide, setGuide] = (0, import_react.useState)(null);
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Social publishers"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-body text-muted",
			children: "Native APIs for X, TikTok, Instagram, and YouTube. Computer Use stays the fallback."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
			children: PROVIDERS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full rounded-card" }, id))
		})]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Social publishers"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "Couldn’t load publishers",
			description: "Status couldn’t be read. Try again.",
			onRetry: () => void query.refetch()
		})]
	});
	const snapshot = query.data;
	const isAdmin = snapshot.role === "admin";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "Social publishers"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-body text-muted",
				children: "OAuth tokens stay on the server and are never returned to Hermes. Passwords are never stored. Daytona Computer Use remains the login / CAPTCHA rail."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption font-medium",
					children: "OAuth callback URL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 break-all font-mono text-caption text-muted",
					children: snapshot.callbackUrl
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					onClick: async () => {
						const ok = await copyTextToClipboard(snapshot.callbackUrl);
						toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Copy"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: PROVIDERS.map((platform) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublisherCard, {
					platform,
					status: snapshot.publishers[platform],
					isAdmin,
					igAccounts: snapshot.instagramAccounts,
					tiktokMode: snapshot.tiktokPublishMode,
					tiktok: snapshot.tiktok,
					youtube: snapshot.youtube,
					metricsReady: Boolean(metricsQuery.data?.metricsApi?.[platform]),
					onGuide: () => setGuide(platform)
				}, platform))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: guide !== null,
				onOpenChange: (open) => !open && setGuide(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: guide ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: GUIDES[guide].title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: GUIDES[guide].time }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-4 flex list-decimal flex-col gap-3 pl-4 text-body",
						children: GUIDES[guide].steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: step.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: step.body
						})] }, step.title))
					}),
					guide === "x" || guide === "tiktok" || guide === "instagram" || guide === "youtube" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 rounded-control bg-secondary-surface/50 p-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all font-mono text-caption",
							children: snapshot.callbackUrl
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "secondary",
							onClick: async () => {
								const ok = await copyTextToClipboard(snapshot.callbackUrl);
								toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Copy callback"]
						})]
					}) : null
				] }) : null })
			})
		]
	});
}
function PublisherCard({ platform, status, isAdmin, igAccounts, tiktokMode, tiktok, youtube, metricsReady, onGuide }) {
	const queryClient = useQueryClient();
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [clientSecret, setClientSecret] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		function onMessage(event) {
			if (event.origin !== window.location.origin) return;
			const data = event.data;
			if (!data || data.source !== "clippy-social-oauth") return;
			if (data.provider && data.provider !== platform) return;
			queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
			if (data.ok) toast.success(`${PLATFORM_LABELS[platform]} connected`);
			else toast.error(data.error || "Couldn’t connect");
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [platform, queryClient]);
	const save = useMutation({
		mutationFn: () => savePublisherAppFn({ data: {
			provider: platform,
			clientId,
			clientSecret
		} }),
		onSuccess: async () => {
			setClientId("");
			setClientSecret("");
			toast.success(`${PLATFORM_LABELS[platform]} app saved`);
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const connect = useMutation({
		mutationFn: () => startPublisherOAuthFn({ data: { provider: platform } }),
		onSuccess: async (data) => {
			if (!window.open(data.url, "clippy-social-oauth", "popup=yes,width=560,height=740")) {
				const ok = await copyTextToClipboard(data.url);
				toast.message(ok ? "Pop-up blocked — the connect URL is copied. Open it in a new tab." : "Pop-up blocked. Allow pop-ups, then Connect again.");
			}
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const test = useMutation({
		mutationFn: () => testPublisherFn({ data: { provider: platform } }),
		onSuccess: async () => {
			toast.success("Connected");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const disconnect = useMutation({
		mutationFn: () => disconnectPublisherFn({ data: { provider: platform } }),
		onSuccess: async () => {
			toast.success(`${PLATFORM_LABELS[platform]} disconnected`);
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const selectIg = useMutation({
		mutationFn: (igUserId) => selectInstagramAccountFn({ data: { igUserId } }),
		onSuccess: async () => {
			toast.success("Instagram account selected");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const setMode = useMutation({
		mutationFn: (mode) => setTikTokModeFn({ data: { mode } }),
		onSuccess: async () => {
			toast.success("TikTok mode saved");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const setAudit = useMutation({
		mutationFn: (status) => setTikTokAuditFn({ data: { status } }),
		onSuccess: async () => {
			toast.success("TikTok audit status saved");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const [domain, setDomain] = (0, import_react.useState)("");
	const saveDomain = useMutation({
		mutationFn: () => setTikTokDomainFn({ data: { domain } }),
		onSuccess: async () => {
			toast.success("Verified domain saved");
			setDomain("");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onSave(event) {
		event.preventDefault();
		save.mutate();
	}
	const tone = status.tokenExpired ? "ERROR" : status.eligible ? "CONNECTED" : status.connected || status.appConfigured ? "PENDING" : "UNKNOWN";
	const label = platform === "instagram" ? status.tokenExpired ? "Token expired" : status.eligible ? status.handle ? `Connected (${status.handle})` : "Connected" : status.connected ? "Select account" : status.appConfigured ? "Not configured" : "Not configured" : platform === "x" ? status.tokenExpired ? "Token expired" : status.eligible ? "Connected" : status.appConfigured ? "Not configured" : "Not configured" : status.eligible ? "API ready" : status.connected ? "Connected" : status.appConfigured ? "App saved" : "Not connected";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: platform === "x" ? "X (API publish)" : platform === "tiktok" ? "TikTok (Content Posting API)" : platform === "youtube" ? "YouTube (Publish)" : "Instagram (Reels API)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: status.note
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-end gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: statusTone$1(tone),
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: metricsReady ? "green" : "neutral",
					children: metricsReady ? "Metrics API" : "Manual stats"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-caption text-muted",
			children: [status.handle ? `${status.handle} · ` : null, status.last4 ? `app …${status.last4}` : "No app credentials yet"]
		}),
		status.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-warning",
			children: status.reason
		}) : null,
		platform === "instagram" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning",
			children: "Personal accounts are not supported for API publish — use Browser upload for those logins."
		}) : null,
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 flex flex-col gap-3",
			onSubmit: onSave,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `${platform}-client-id`,
						children: platform === "tiktok" ? "Client key" : "Client ID"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `${platform}-client-id`,
						autoComplete: "off",
						value: clientId,
						onChange: (event) => setClientId(event.target.value),
						placeholder: status.last4 ? `Saved …${status.last4}` : "From the developer portal"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `${platform}-secret`,
						children: "Client secret"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `${platform}-secret`,
						type: "password",
						autoComplete: "off",
						value: clientSecret,
						onChange: (event) => setClientSecret(event.target.value),
						placeholder: "Never shown again"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "sm",
							disabled: save.isPending || !clientId || !clientSecret,
							children: "Save"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "secondary",
							disabled: !status.appConfigured || connect.isPending,
							onClick: () => connect.mutate(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, {
									className: "size-4",
									"aria-hidden": "true"
								}),
								"Connect",
								platform === "x" ? " X" : platform === "instagram" ? " Instagram" : platform === "tiktok" ? " TikTok" : platform === "youtube" ? " YouTube" : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							disabled: !status.connected || test.isPending,
							onClick: () => test.mutate(),
							children: platform === "x" || platform === "instagram" || platform === "youtube" ? "Test Connection" : "Test"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							onClick: onGuide,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Setup Guide"]
						}),
						status.connected || status.appConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							disabled: disconnect.isPending,
							onClick: () => disconnect.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Disconnect"]
						}) : null
					]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-caption text-muted",
			children: "Owner can connect publishers."
		}),
		platform === "instagram" && igAccounts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "ig-account",
				children: "Professional account"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: status.accountId ?? void 0,
				onValueChange: (value) => selectIg.mutate(value),
				disabled: !isAdmin || selectIg.isPending,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					id: "ig-account",
					"aria-label": "Instagram professional account",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select IG professional account" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: igAccounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
					value: account.igUserId,
					children: [
						"@",
						account.username,
						" · ",
						account.pageName,
						account.accountType && account.accountType !== "UNKNOWN" ? ` · ${account.accountType === "CREATOR" ? "Creator" : "Business"}` : " · Professional"
					]
				}, account.igUserId)) })]
			})]
		}) : null,
		platform === "tiktok" && tiktok.auditStatus !== "AUDITED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning",
			children: "Public Direct Post may be limited — using Upload to inbox (draft) by default."
		}) : null,
		platform === "tiktok" && status.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: tiktokMode === "inbox" ? "secondary" : "ghost",
						"aria-pressed": tiktokMode === "inbox",
						disabled: !isAdmin || setMode.isPending,
						onClick: () => setMode.mutate("inbox"),
						children: TIKTOK_MODE_LABELS.UPLOAD_TO_INBOX
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: tiktokMode === "direct" ? "secondary" : "ghost",
						"aria-pressed": tiktokMode === "direct",
						disabled: !isAdmin || setMode.isPending,
						onClick: () => setMode.mutate("direct"),
						children: TIKTOK_MODE_LABELS.DIRECT_POST
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "tiktok-audit",
						children: "Content posting audit"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: tiktok.auditStatus,
						onValueChange: (value) => setAudit.mutate(value),
						disabled: !isAdmin || setAudit.isPending,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "tiktok-audit",
							"aria-label": "TikTok audit status",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "UNAUDITED",
								children: "Unaudited — inbox only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "UNKNOWN",
								children: "Unknown"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "AUDITED",
								children: "Audited — Direct Post allowed"
							})
						] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "tiktok-domain",
							children: "Verified domain (PULL_FROM_URL)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "tiktok-domain",
								value: domain,
								onChange: (event) => setDomain(event.target.value),
								placeholder: tiktok.verifiedDomain ?? "cdn.example.com",
								disabled: !isAdmin
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								disabled: !isAdmin || saveDomain.isPending,
								onClick: () => saveDomain.mutate(),
								children: "Save domain"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Optional. Without a verified domain, clips upload in 5–64 MB chunks instead of a pull URL."
						})
					]
				})
			]
		}) : null,
		platform === "youtube" && status.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YoutubeDefaults, {
			youtube,
			isAdmin
		}) : null
	] });
}
function YoutubeDefaults({ youtube, isAdmin }) {
	const queryClient = useQueryClient();
	const [categoryId, setCategoryId] = (0, import_react.useState)(youtube.categoryId ?? "22");
	const save = useMutation({
		mutationFn: (input) => setYoutubePublishDefaultsFn({ data: input }),
		onSuccess: async () => {
			toast.success("YouTube defaults saved");
			await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: youtube.channelTitle ? `Uploads go to ${youtube.channelTitle}. Per-client channels are phase 2.` : "Uploads go to the connected workspace channel."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "yt-category",
					children: "Default category ID"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "yt-category",
						value: categoryId,
						onChange: (event) => setCategoryId(event.target.value),
						placeholder: "22",
						disabled: !isAdmin
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "secondary",
						disabled: !isAdmin || save.isPending,
						onClick: () => save.mutate({ categoryId }),
						children: "Save"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "yt-privacy",
					children: "Default privacy (publish)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: youtube.privacyDefault,
					onValueChange: (value) => save.mutate({
						categoryId,
						privacyDefault: value
					}),
					disabled: !isAdmin || save.isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						id: "yt-privacy",
						"aria-label": "Default YouTube privacy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "private",
							children: "Private"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "unlisted",
							children: "Unlisted (safer default)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "public",
							children: "Public (still needs approval)"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Draft jobs always upload as private. youtube.upload is a sensitive Google scope — unverified apps only work for listed test users."
			})
		]
	});
}
var GUIDE_STEPS = [
	{
		title: "Create a Linear API key (or OAuth app)",
		body: "Linear Settings → API. Create a personal API key, or an OAuth application with read + write + issues:create. Prefer a dedicated “AI Clipping Dashboard” project."
	},
	{
		title: "Paste the key, Test Connection",
		body: "Paste the API key here (never shown again in full). Test fetches viewer, teams, and projects. OAuth is optional if you saved a Linear app Client ID + secret."
	},
	{
		title: "Select Team + Project",
		body: "Bind the Agency Admin team and the AI Clipping Dashboard project. Issues created from failed jobs land there."
	},
	{
		title: "Map Kanban columns",
		body: "Map Backlog, Ready, In Progress, In Review, and Done to Linear workflow states. Load workflow states if the dropdowns are empty."
	}
];
function healthLabel(health) {
	if (health === "connected") return "Connected";
	if (health === "error") return "Error";
	if (health === "saved") return "Saved";
	return "Not configured";
}
function LinearPanel() {
	const queryClient = useQueryClient();
	const [apiKey, setApiKey] = (0, import_react.useState)("");
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [clientSecret, setClientSecret] = (0, import_react.useState)("");
	const [guideOpen, setGuideOpen] = (0, import_react.useState)(false);
	const [disconnectOpen, setDisconnectOpen] = (0, import_react.useState)(false);
	const [catalog, setCatalog] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: LINEAR_QUERY_KEY,
		queryFn: () => getLinearStatusFn()
	});
	(0, import_react.useEffect)(() => {
		function onMessage(event) {
			if (event.origin !== window.location.origin) return;
			const data = event.data;
			if (!data || data.source !== "clippy-linear-oauth") return;
			queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			if (data.ok) toast.success("Linear connected");
			else toast.error(data.error || "Couldn’t connect Linear");
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [queryClient]);
	const saveKey = useMutation({
		mutationFn: () => saveLinearApiKeyFn({ data: { apiKey } }),
		onSuccess: async () => {
			setApiKey("");
			toast.success("Linear API key saved");
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveOauth = useMutation({
		mutationFn: () => saveLinearOauthAppFn({ data: {
			clientId,
			clientSecret
		} }),
		onSuccess: async () => {
			setClientId("");
			setClientSecret("");
			toast.success("Linear OAuth app saved");
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const test = useMutation({
		mutationFn: () => testLinearFn(),
		onSuccess: async (status) => {
			setCatalog({
				teams: status.teams,
				projects: status.projects,
				states: status.states
			});
			toast.success(status.viewerName ? `Connected as ${status.viewerName}` : "Connected");
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const load = useMutation({
		mutationFn: (teamId) => loadLinearCatalogFn({ data: { teamId } }),
		onSuccess: (data) => setCatalog(data),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const bind = useMutation({
		mutationFn: saveLinearBindingFn,
		onSuccess: async () => {
			toast.success("Linear mapping saved");
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const disconnect = useMutation({
		mutationFn: () => disconnectLinearFn(),
		onSuccess: async () => {
			setDisconnectOpen(false);
			setCatalog(null);
			toast.success("Linear disconnected");
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const oauth = useMutation({
		mutationFn: () => startLinearOAuthFn(),
		onSuccess: async (data) => {
			if (!window.open(data.url, "clippy-linear-oauth", "popup=yes,width=560,height=740")) {
				const ok = await copyTextToClipboard(data.url);
				toast.message(ok ? "Pop-up blocked — the connect URL is copied. Open it in a new tab." : "Pop-up blocked. Allow pop-ups, then Connect Linear again.");
			}
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const milestones = useMutation({
		mutationFn: () => ensureLinearMilestonesFn(),
		onSuccess: async (data) => {
			toast.success(`Milestones ready · ${data.items.length}`);
			await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 w-full" });
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load Linear",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	const status = query.data;
	const teams = catalog?.teams.length ? catalog.teams : status.teams;
	const projects = catalog?.projects.length ? catalog.projects : status.projects;
	const states = catalog?.states.length ? catalog.states : status.states;
	const configured = status.configured;
	function patchFlags(patch) {
		bind.mutate({ data: { flags: {
			...status.flags,
			...patch
		} } });
	}
	function patchColumn(column, stateId) {
		bind.mutate({ data: { stateMap: {
			...status.stateMap,
			[column]: stateId === "none" ? null : stateId
		} } });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "Linear"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-body text-muted",
				children: "Human Kanban for the AI Clipping Dashboard. Agency Admin stays the system of record for clients and media. Linear tracks engineering and ops tickets — outages never block a publish."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Workspace binding"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: status.viewerName ? `Connected as ${status.viewerName}${status.organizationName ? ` · ${status.organizationName}` : ""}` : "Paste a Linear API key or connect OAuth. Tokens stay on the server."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: statusTone$1(status.health === "connected" ? "SUCCEEDED" : status.health === "error" ? "FAILED" : "PENDING"),
						children: healthLabel(status.health)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 flex flex-col gap-3",
					onSubmit: (event) => {
						event.preventDefault();
						if (apiKey.trim()) saveKey.mutate();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "linear-api-key",
								children: "Personal API key"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "linear-api-key",
								type: "password",
								autoComplete: "new-password",
								spellCheck: false,
								value: apiKey,
								placeholder: configured ? "•••• stored on the server" : "lin_api_…",
								onChange: (event) => setApiKey(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all font-mono text-caption text-muted",
							children: status.callbackUrl
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-1 flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "linear-cid",
									children: "OAuth client ID (optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "linear-cid",
									type: "text",
									autoComplete: "off",
									value: clientId,
									placeholder: status.oauthConfigured ? "•••• stored" : "Linear OAuth app id",
									onChange: (event) => setClientId(event.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-1 flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "linear-csec",
									children: "OAuth client secret"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "linear-csec",
									type: "password",
									autoComplete: "new-password",
									value: clientSecret,
									placeholder: status.oauthConfigured ? "•••• stored" : "Linear OAuth secret",
									onChange: (event) => setClientSecret(event.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									variant: "secondary",
									disabled: saveKey.isPending || !apiKey.trim(),
									children: saveKey.isPending ? "Saving…" : "Save API key"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "secondary",
									disabled: saveOauth.isPending || !clientId.trim() || !clientSecret.trim(),
									onClick: () => saveOauth.mutate(),
									children: "Save OAuth app"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "ghost",
									onClick: async () => {
										const ok = await copyTextToClipboard(status.callbackUrl);
										toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Copy callback"]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => setGuideOpen(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-3.5" }), "Setup Guide"]
						}),
						status.oauthConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							disabled: oauth.isPending,
							onClick: () => oauth.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, { className: "size-3.5" }), oauth.isPending ? "Connecting…" : "Connect Linear"]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							disabled: test.isPending,
							onClick: () => test.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, { className: "size-3.5" }), test.isPending ? "Testing…" : "Test Connection"]
						}),
						configured ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setDisconnectOpen(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, { className: "size-3.5" }), "Disconnect"]
						}) : null
					]
				}),
				status.lastError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-caption text-danger",
					children: status.lastError
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Team, project, columns"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "Canonical board: Backlog → Ready → In Progress → In Review → Done. Agency Admin deep-links into Linear — it does not clone the board."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Team" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: status.teamId ?? void 0,
							onValueChange: (teamId) => {
								bind.mutate({ data: { teamId } });
								load.mutate(teamId);
							},
							disabled: !configured,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Linear team",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: status.teamName ?? "Select team" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: (teams.length ? teams : status.teamId ? [{
								id: status.teamId,
								name: status.teamName ?? "Team",
								key: ""
							}] : []).map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: team.id,
								children: [team.name, team.key ? ` (${team.key})` : ""]
							}, team.id)) })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Project" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: status.projectId ?? void 0,
							onValueChange: (projectId) => bind.mutate({ data: { projectId } }),
							disabled: !configured,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Linear project",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: status.projectName ?? "Select project" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: (projects.length ? projects : status.projectId ? [{
								id: status.projectId,
								name: status.projectName ?? "Project"
							}] : []).map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: project.id,
								children: project.name
							}, project.id)) })]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						disabled: !configured || load.isPending,
						onClick: () => load.mutate(status.teamId ?? void 0),
						children: load.isPending ? "Loading…" : "Load workflow states"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: LINEAR_KANBAN_COLUMNS.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [LINEAR_COLUMN_LABELS[column], /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-1 font-normal text-muted",
							children: ["· ", LINEAR_COLUMN_HINTS[column]]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: status.stateMap[column] ?? "none",
							onValueChange: (value) => patchColumn(column, value),
							disabled: !configured,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": `${LINEAR_COLUMN_LABELS[column]} state`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Unmapped" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "none",
								children: "Unmapped"
							}), states.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: state.id,
								children: state.name
							}, state.id))] })]
						})]
					}, column))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Sync policy"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-caption text-muted",
					children: [
						"Opt-in. Issues with the ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "manual-board" }),
						" label are never auto-moved. Failed uploads still succeed or fail in Agency Admin if Linear is down."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							title: "LINEAR_ENABLED",
							hint: "Master switch. When off, Hermes degrades silently with an audit note.",
							checked: status.flags.enabled,
							onChange: (enabled) => patchFlags({ enabled })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							title: "Sync linked jobs",
							hint: "Move linked issues: running → In Progress, awaiting approval → In Review, succeeded → Done. Default off.",
							checked: status.flags.syncJobs,
							onChange: (syncJobs) => patchFlags({ syncJobs })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							title: "Auto-issue on fail",
							hint: "Create a Linear issue when a social upload, render, or agent run fails.",
							checked: status.flags.autoIssueOnFail,
							onChange: (autoIssueOnFail) => patchFlags({ autoIssueOnFail })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							title: "Issue on knowledge proposal",
							hint: "Optional. Label learning. Off by default — proposals already have an inbox here.",
							checked: status.flags.autoIssueOnProposal,
							onChange: (autoIssueOnProposal) => patchFlags({ autoIssueOnProposal })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							title: "Members can create issues",
							hint: "Owners/Admins always can. Members only when this is on.",
							checked: status.flags.membersCanCreate,
							onChange: (membersCanCreate) => patchFlags({ membersCanCreate })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-1.5 sm:max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Failed jobs land in" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: status.flags.failColumn,
						onValueChange: (failColumn) => patchFlags({ failColumn }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							"aria-label": "Fail column",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LINEAR_KANBAN_COLUMNS.filter((col) => col !== "done").map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: col,
							children: LINEAR_COLUMN_LABELS[col]
						}, col)) })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						disabled: !status.projectId || milestones.isPending,
						onClick: () => milestones.mutate(),
						children: milestones.isPending ? "Creating…" : "Ensure M1–M7 milestones"
					}), status.milestones.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-caption text-muted",
						children: status.milestones.map((row) => row.name).join(" · ")
					}) : null]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: guideOpen,
				onOpenChange: setGuideOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Linear · ~10 min" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Connect Linear as the human Kanban. Agency Admin does not replace the Linear UI." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-3 flex flex-col gap-3",
						children: GUIDE_STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-body font-medium",
							children: [
								index + 1,
								". ",
								step.title
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: step.body
						})] }, step.title))
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: disconnectOpen,
				onOpenChange: setDisconnectOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Disconnect Linear?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Clears the API key and OAuth tokens. Existing Linear issues stay in Linear. Links in Agency Admin are left in place so you can reconnect." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setDisconnectOpen(false),
							children: "Keep connected"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => disconnect.mutate(),
							disabled: disconnect.isPending,
							children: disconnect.isPending ? "Disconnecting…" : "Disconnect"
						})]
					})
				] })
			})
		]
	});
}
function Toggle({ title, hint, checked, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-body",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-caption text-muted",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
			checked,
			onCheckedChange: onChange
		})]
	});
}
var LOGINS_KEY = ["team-logins"];
function TeamAccessPanel() {
	const { user } = useCurrentUserState();
	const queryClient = useQueryClient();
	const statusQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const loginsQuery = useQuery({
		queryKey: LOGINS_KEY,
		queryFn: () => listTeamLogins(),
		enabled: statusQuery.data?.role === "admin"
	});
	const isAdmin = statusQuery.data?.role === "admin";
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("member");
	const [saPassword, setSaPassword] = (0, import_react.useState)("");
	const [revokeId, setRevokeId] = (0, import_react.useState)(null);
	const create = useMutation({
		mutationFn: () => createTeamLogin({ data: {
			name: name.trim(),
			email: email.trim(),
			password,
			role
		} }),
		onSuccess: async () => {
			toast.success("Login created");
			setName("");
			setEmail("");
			setPassword("");
			setRole("member");
			await queryClient.invalidateQueries({ queryKey: LOGINS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const revoke = useMutation({
		mutationFn: (userId) => revokeTeamLogin({ data: userId }),
		onSuccess: async () => {
			setRevokeId(null);
			toast.success("Access revoked");
			await queryClient.invalidateQueries({ queryKey: LOGINS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveSa = useMutation({
		mutationFn: () => setSuperAdminPassword({ data: { password: saPassword } }),
		onSuccess: async () => {
			setSaPassword("");
			toast.success("Super Admin password saved");
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const resetLink = useMutation({
		mutationFn: (userId) => createMemberResetLink({ data: userId }),
		onSuccess: async (result) => {
			const ok = await copyTextToClipboard(result.url);
			toast.success(ok ? "Reset link copied" : "Reset link ready — copy failed, check permissions");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onCreate(event) {
		event.preventDefault();
		create.mutate();
	}
	function onSaveSa(event) {
		event.preventDefault();
		saveSa.mutate();
	}
	const pending = loginsQuery.data?.find((row) => row.userId === revokeId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "Team access"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-body text-muted",
				children: "Operators sign in from any network with email, Google, or X. Super Admin Access on the login screen uses a password you set here — never a hard-coded secret."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-start justify-between gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, {
								className: "size-5",
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: "Logins"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Create and revoke workspace accounts. Owners only."
						})] })]
					})
				}),
				!isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-caption text-muted",
					children: "Only owners can create or revoke logins."
				}) : loginsQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-control" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-control" })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 flex flex-col gap-2",
					children: [(loginsQuery.data ?? []).map((row) => {
						const self = row.userId === user?.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-body font-medium",
									children: [row.name, self ? " (you)" : ""]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-caption text-muted",
									children: [
										row.email || "No email",
										" · added ",
										formatDate(row.createdAt)
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: row.role === "admin" ? "purple" : "neutral",
										children: row.role === "admin" ? "Owner" : "Member"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: statusTone$1(row.status),
										children: row.status === "ACTIVE" ? "Active" : "Revoked"
									}),
									!self && row.status === "ACTIVE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => resetLink.mutate(row.userId),
										disabled: resetLink.isPending,
										children: "Reset link"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => setRevokeId(row.userId),
										children: "Revoke"
									})] }) : null
								]
							})]
						}, row.userId);
					}), (loginsQuery.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-caption text-muted",
						children: "No logins yet."
					}) : null]
				}),
				isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-5 grid gap-3 sm:grid-cols-2",
					onSubmit: onCreate,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-name",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "team-name",
								value: name,
								autoComplete: "off",
								onChange: (event) => setName(event.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-email",
								children: "Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "team-email",
								type: "email",
								value: email,
								autoComplete: "off",
								onChange: (event) => setEmail(event.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-password",
								children: "Temporary password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "team-password",
								type: "password",
								value: password,
								autoComplete: "new-password",
								minLength: 8,
								onChange: (event) => setPassword(event.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-role",
								children: "Role"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "team-role",
								className: "min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body",
								value: role,
								onChange: (event) => setRole(event.target.value === "admin" ? "admin" : "member"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "member",
									children: "Member"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "admin",
									children: "Owner"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: create.isPending,
								children: create.isPending ? "Creating…" : "Create login"
							})
						})
					]
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Super Admin Access"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-caption text-muted",
					children: ["Password for the login-screen Super Admin button. Stored as a hash.", statusQuery.data?.superAdminConfigured ? " A password is already set." : " Not set yet."]
				})] })]
			}), isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-3 sm:flex-row sm:items-end",
				onSubmit: onSaveSa,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "sa-password",
						children: "New Super Admin password"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "sa-password",
						type: "password",
						autoComplete: "new-password",
						minLength: 8,
						value: saPassword,
						onChange: (event) => setSaPassword(event.target.value),
						required: true
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: saveSa.isPending,
					children: saveSa.isPending ? "Saving…" : "Save password"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-caption text-muted",
				children: "Only owners can set this password."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pending),
				onOpenChange: (open) => {
					if (!open) setRevokeId(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
						"Revoke ",
						pending?.name,
						"?"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "They will not be able to sign in until an owner creates a new login. Existing sessions stop on the next request." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: revoke.isPending || !pending,
							onClick: () => pending && revoke.mutate(pending.userId),
							children: "Revoke"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setRevokeId(null),
							children: "Cancel"
						})]
					})
				] })
			})
		]
	});
}
function SafetyPanel() {
	const queryClient = useQueryClient();
	const [action, setAction] = (0, import_react.useState)("");
	const [since, setSince] = (0, import_react.useState)("");
	const [until, setUntil] = (0, import_react.useState)("");
	const [webhook, setWebhook] = (0, import_react.useState)("");
	const [emailWebhook, setEmailWebhook] = (0, import_react.useState)("");
	const settings = useQuery({
		queryKey: SAFETY_SETTINGS_QUERY_KEY,
		queryFn: () => getSafetySettingsFn(),
		placeholderData: {
			policy: DEFAULT_APPROVAL_POLICY,
			channels: {
				discordWebhookConfigured: false,
				emailEnabled: false,
				emailWebhookConfigured: false
			},
			retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history."
		}
	});
	const prefs = useQuery({
		queryKey: ["notification-prefs"],
		queryFn: () => getNotificationPrefsFn()
	});
	const isAdmin = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox()
	}).data?.role === "admin";
	const audit = useQuery({
		queryKey: [
			...AUDIT_QUERY_KEY,
			since,
			until
		],
		queryFn: () => listAuditEventsFn({ data: {
			since: since ? `${since}T00:00:00.000Z` : void 0,
			until: until ? `${until}T23:59:59.999Z` : void 0
		} }),
		enabled: isAdmin
	});
	const snapshot = settings.data;
	const policy = snapshot?.policy;
	const savePolicy = useMutation({
		mutationFn: saveApprovalPolicyFn,
		onSuccess: async () => {
			toast.success("Approvals policy saved");
			await queryClient.invalidateQueries({ queryKey: SAFETY_SETTINGS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveChannels = useMutation({
		mutationFn: saveOpsChannelsFn,
		onSuccess: async () => {
			toast.success("Notification channels saved");
			setWebhook("");
			setEmailWebhook("");
			await queryClient.invalidateQueries({ queryKey: SAFETY_SETTINGS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const savePrefs = useMutation({
		mutationFn: saveNotificationPrefsFn,
		onSuccess: async () => {
			toast.success("Notification preferences saved");
			await queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const muted = new Set(prefs.data?.mutedCategories ?? []);
	function togglePlatform(platform, current) {
		return current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform];
	}
	const filteredAudit = (0, import_react.useMemo)(() => {
		const rows = audit.data?.items ?? [];
		if (!action.trim()) return rows;
		const needle = action.trim().toLowerCase();
		return rows.filter((row) => row.action.toLowerCase().includes(needle) || row.summary.toLowerCase().includes(needle) || (row.clientId ?? "").toLowerCase().includes(needle));
	}, [audit.data?.items, action]);
	if (!snapshot || !policy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "approvals",
		className: "scroll-mt-24",
		children: settings.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "Couldn’t load safety settings",
			description: "Admin-only. Sign in again if this keeps happening.",
			onRetry: () => void settings.refetch()
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full max-w-3xl rounded-card" })
	});
	function onPolicy(event) {
		event.preventDefault();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "approvals",
			className: "scroll-mt-24 max-w-3xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Approvals"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Turn on require approval before the first client publish. Draft jobs never wait."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-5 flex flex-col gap-4",
				onSubmit: onPolicy,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-body font-medium",
							children: "Require approval for live publishes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-caption text-muted",
							children: "mode=publish waits for an admin sign-off. Default on for production safety."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: policy.requireForSocialPublish,
							disabled: !isAdmin || savePolicy.isPending,
							onCheckedChange: (checked) => savePolicy.mutate({ data: {
								...policy,
								requireForSocialPublish: checked
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-body font-medium",
							children: "Allow Owner/Admin self-approve"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-caption text-muted",
							children: "Solo operators should leave this on so you can sign off your own posts."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: policy.allowSelfApprove,
							disabled: !isAdmin || savePolicy.isPending,
							onCheckedChange: (checked) => savePolicy.mutate({ data: {
								...policy,
								allowSelfApprove: checked
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-body font-medium",
							children: "Stage advances need approval"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-caption text-muted",
							children: "Manual pipeline moves only. Discord agent still writes."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: policy.stageAdvanceRequiresApproval,
							disabled: !isAdmin || savePolicy.isPending,
							onCheckedChange: (checked) => savePolicy.mutate({ data: {
								...policy,
								stageAdvanceRequiresApproval: checked
							} })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body font-medium",
							children: "Limit to platforms"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Empty means every platform. Pick a subset to gate only those."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: SOCIAL_PLATFORMS.map((platform) => {
								const on = policy.requireForPlatforms.includes(platform);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "sm",
									variant: on ? "primary" : "secondary",
									onClick: () => savePolicy.mutate({ data: {
										...policy,
										requireForPlatforms: togglePlatform(platform, policy.requireForPlatforms)
									} }),
									children: PLATFORM_LABELS[platform]
								}, platform);
							})
						})
					] })
				]
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "notifications",
			className: "scroll-mt-24 max-w-3xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Notification channels"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "In-app is always on. Discord ops webhook and email webhook are optional."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "ops-discord",
							children: "Discord ops webhook"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "ops-discord",
							className: "mt-1",
							type: "url",
							placeholder: settings.data?.channels.discordWebhookConfigured ? "Saved — paste a new URL to replace" : "https://discord.com/api/webhooks/…",
							value: webhook,
							onChange: (event) => setWebhook(event.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "ops-email",
							children: "Email webhook"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "ops-email",
							className: "mt-1",
							type: "url",
							placeholder: settings.data?.channels.emailWebhookConfigured ? "Saved — paste a new URL to replace" : "https://…",
							value: emailWebhook,
							onChange: (event) => setEmailWebhook(event.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								disabled: saveChannels.isPending,
								onClick: () => saveChannels.mutate({ data: {
									discordWebhook: webhook || void 0,
									emailWebhook: emailWebhook || void 0
								} }),
								children: "Save webhooks"
							}), snapshot.channels.discordWebhookConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => saveChannels.mutate({ data: { clearDiscord: true } }),
								children: "Disconnect"
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-body font-medium",
								children: "Email for WARNING/CRITICAL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-caption text-muted",
								children: "Posts to your email webhook if one is saved. Critical stays on for Owner."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: snapshot.channels.emailEnabled,
								onCheckedChange: (checked) => saveChannels.mutate({ data: { emailEnabled: checked } })
							})]
						}),
						prefs.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-body font-medium",
									children: "Mute categories"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-caption text-muted",
									children: "Critical still delivers for Owner/Admin."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: NOTIFICATION_CATEGORIES.map((category) => {
										const on = muted.has(category);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											size: "sm",
											variant: on ? "primary" : "secondary",
											onClick: () => {
												const next = new Set(muted);
												if (on) next.delete(category);
												else next.add(category);
												savePrefs.mutate({ data: {
													mutedCategories: [...next],
													emailEnabled: prefs.data?.emailEnabled ?? false
												} });
											},
											children: NOTIFICATION_CATEGORY_LABELS[category]
										}, category);
									})
								})
							]
						}) : null
					]
				})
			] })
		}),
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "audit",
			className: "scroll-mt-24 max-w-3xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "Audit log"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: snapshot.retentionNote
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: async () => {
								const result = await listAuditEventsFn({ data: {
									format: "csv",
									since: since ? `${since}T00:00:00.000Z` : void 0,
									until: until ? `${until}T23:59:59.999Z` : void 0
								} });
								if (result.csv) downloadTextFile("clippy-audit.csv", result.csv);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Export CSV"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: async () => {
								const result = await listAuditEventsFn({ data: {
									format: "json",
									since: since ? `${since}T00:00:00.000Z` : void 0,
									until: until ? `${until}T23:59:59.999Z` : void 0
								} });
								downloadTextFile("clippy-audit.json", JSON.stringify(result.items, null, 2));
							},
							children: "Export JSON"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "audit-filter",
							children: "Filter"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "audit-filter",
							className: "mt-1",
							value: action,
							onChange: (event) => setAction(event.target.value),
							placeholder: "action, summary, or client"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "audit-since",
							children: "From"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "audit-since",
							className: "mt-1",
							type: "date",
							value: since,
							onChange: (event) => setSince(event.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "audit-until",
							children: "To"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "audit-until",
							className: "mt-1",
							type: "date",
							value: until,
							onChange: (event) => setUntil(event.target.value)
						})] })
					]
				}),
				audit.isFetching && !audit.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-32 w-full" }) : filteredAudit.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-body text-muted",
					children: "No audit events in this range."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 flex flex-col gap-2",
					children: filteredAudit.slice(0, 40).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-body font-medium",
								children: row.summary
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: statusTone$1("PENDING"),
								children: AUDIT_ACTOR_LABELS[row.actorType]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-caption text-muted",
							children: [
								row.action,
								" · ",
								formatRelativeTime(row.at),
								row.entityType ? ` · ${row.entityType}` : ""
							]
						})]
					}, row.id))
				})
			] })
		}) : null
	] });
}
function riskTone(risk) {
	if (risk === "high") return "red";
	if (risk === "medium") return "orange";
	return "green";
}
function PlaybookCatalog({ policies, enabled }) {
	const safe = policies ?? DEFAULT_PLAYBOOK_POLICIES;
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const brief = (0, import_react.useMemo)(() => formatPlaybookPackage({
		policies: safe,
		enabled,
		origin: typeof window === "undefined" ? "{origin}" : window.location.origin,
		version: PLAYBOOK_PACKAGE_VERSION
	}), [safe, enabled]);
	async function copyBrief() {
		const ok = await copyTextToClipboard(brief);
		toast[ok ? "success" : "error"](ok ? "Playbook package copied — paste into Hermes" : "Couldn’t copy — select the text instead");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Hermes Playbook"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Official autonomous workflows. Playbooks run inside Hermes; Agency Admin provides the tools and audit trail."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => void copyBrief(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
					className: "size-4",
					"aria-hidden": "true"
				}), "Copy Playbook package for Hermes"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			tone: "teal",
			className: "mt-3",
			children: "Playbooks run inside Hermes; Agency Admin provides the tools and audit trail."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: HERMES_PLAYBOOKS.map((playbook) => {
				const open = openId === playbook.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-control bg-secondary-surface/50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full flex-col gap-2 px-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between",
						"aria-expanded": open,
						onClick: () => setOpenId(open ? null : playbook.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: playbook.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: playbook.summary
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1",
							children: [
								playbook.id.startsWith("reactor_") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "teal",
									children: "reactor"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "blue",
									children: playbook.trigger
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: riskTone(playbook.risk),
									children: playbook.risk
								})
							]
						})]
					}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border px-3 py-3 text-caption",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.triggerDetail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Steps"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-1 list-decimal pl-4",
								children: playbook.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-muted",
									children: step
								}, step))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Tools"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.tools.join(", ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Scopes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.requiredScopes.map((scope) => SCOPE_LABELS[scope]).join(", ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Integrations"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.requiredIntegrations.join(", ") || "None"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Success"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.success
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Guardrail"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.guardrail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Human-stop"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.humanStop
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Escalation"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.escalation
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-medium",
								children: "Expected audit events"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: playbook.auditEvents.join(", ")
							})
						]
					}) : null]
				}, playbook.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-caption text-muted",
			children: [
				"Pass ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-Playbook-Id" }),
				" and ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-Run-Id" }),
				" (or payload playbook / runId) so every tool call is attributable in the audit log."
			]
		})
	] });
}
async function copy$1(label, value) {
	const ok = await copyTextToClipboard(value);
	toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
	return ok;
}
function StepDot({ n, done }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("grid size-8 shrink-0 place-items-center rounded-full text-caption font-semibold", done ? "bg-success/20 text-success" : "bg-secondary-surface text-muted"),
		"aria-hidden": "true",
		children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : n
	});
}
function HermesConnect({ data, origin, enabled, policies, onPolicies, onPlaintext }) {
	const queryClient = useQueryClient();
	const [outboundUrl, setOutboundUrl] = (0, import_react.useState)(data.outboundUrl ?? "");
	const [events, setEvents] = (0, import_react.useState)(data.outboundEvents.length ? data.outboundEvents : [...SOCIAL_LIFECYCLE_EVENTS]);
	const active = data.keys.filter((key) => !key.revokedAt);
	const hermesKey = active.find((key) => key.name.toLowerCase().includes("hermes")) ?? active[0] ?? null;
	const steps = deriveConnectSteps({
		hasHermesKey: active.length > 0,
		keyLastUsedAt: hermesKey?.lastUsedAt ?? data.lastActivityAt,
		pastedIntoHermes: data.connect.pastedIntoHermes,
		socialPolicyAcked: Boolean(data.connect.socialPolicyAckedAt),
		outboundUrlConfigured: Boolean(data.outboundUrl),
		outboundSkipped: data.connect.outboundSkipped
	});
	const requiredDone = Number(steps.mintKey) + Number(steps.pastePlaybook) + Number(steps.socialPolicy);
	const connection = data.connect.hermesConnection;
	const apiBase = `${origin}/api/v1`;
	const mcpUrl = `${origin}/api/mcp`;
	const webhookUrl = `${origin}/api/webhooks/inbound`;
	const packageText = (0, import_react.useMemo)(() => formatPlaybookPackage({
		policies,
		enabled,
		origin,
		version: PLAYBOOK_PACKAGE_VERSION
	}), [
		policies,
		enabled,
		origin
	]);
	const mcpSnippet = JSON.stringify({ mcpServers: { "clippy-admin": {
		url: mcpUrl,
		headers: { Authorization: "Bearer <MCP_TOKEN>" }
	} } }, null, 2);
	const mint = useMutation({
		mutationFn: () => createHermesPresetKey(),
		onSuccess: async (result) => {
			onPlaintext("Hermes Agent API key", result.plaintext, "Store this in Hermes now. It is shown once. Scopes: read + write:social plus recommended ops. No admin or secret access.");
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.success("Hermes key created — copy it now");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const paste = useMutation({
		mutationFn: () => markPlaybookPasted(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.success("Marked as pasted into Hermes");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const ackPolicy = useMutation({
		mutationFn: () => ackSocialVmPolicy(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.success("Social VM policy confirmed");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const savePolicies = useMutation({
		mutationFn: (next) => saveAutomationSettings({ data: {
			enabled,
			policies: next
		} }),
		onSuccess: async (_result, next) => {
			onPolicies(next);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveOutbound = useMutation({
		mutationFn: () => saveOutboundWebhook({ data: {
			destinationUrl: outboundUrl.trim() || null,
			events
		} }),
		onSuccess: async () => {
			toast.success("Outbound webhook saved");
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const testDelivery = useMutation({
		mutationFn: () => testOutboundWebhook(),
		onSuccess: async (result) => {
			if (result.ok) toast.success("Signed ping delivered");
			else toast.error(result.error === "NO_DESTINATION" ? "Add an HTTPS receiver URL first" : "Delivery failed");
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const skipOutbound = useMutation({
		mutationFn: () => skipOutboundConnect({ data: { skipped: true } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.message("Outbound events skipped — Hermes can poll the API instead");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function subscribeSocial() {
		setEvents((current) => {
			const set = new Set(current);
			for (const event of SOCIAL_LIFECYCLE_EVENTS) set.add(event);
			return [...set];
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "relative overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, { shineColor: [
				"var(--accent)",
				"var(--teal)",
				"var(--purple)"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Connect Hermes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Three builds: mint a scoped key, paste the Playbook package, set the Social VM policy. Outbound events are optional."
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: connection === "fully_connected" ? "green" : connection === "key_only" ? "blue" : "neutral",
						children: ["Hermes: ", HERMES_CONNECTION_LABELS[connection]]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "teal",
						children: [requiredDone, "/3 required"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-5 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-control bg-secondary-surface/50 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDot, {
								n: 1,
								done: steps.mintKey
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
												className: "size-4 text-muted",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-medium",
												children: "Mint Hermes key"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: hermesKey ? "green" : "neutral",
												children: hermesKey ? "Key active" : "Missing"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-caption text-muted",
										children: [
											"Preset scopes: ",
											DEFAULT_HERMES_SCOPES.map((scope) => SCOPE_LABELS[scope]).join(", "),
											". Excluded: admin, secret management, Daytona key access."
										]
									}),
									hermesKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 font-mono text-caption",
										children: [
											hermesKey.name,
											" · ",
											hermesKey.keyPrefix,
											"…",
											hermesKey.last4,
											hermesKey.lastUsedAt ? " · used" : " · never used"
										]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-col gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "break-all rounded-control bg-bg/60 px-3 py-2 text-caption",
											children: apiBase
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "break-all rounded-control bg-bg/60 px-3 py-2 text-caption",
											children: "Authorization: Bearer <API_KEY>"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											className: "min-h-11",
											disabled: mint.isPending,
											onClick: () => mint.mutate(),
											children: hermesKey ? "Mint another Hermes key" : "Create Hermes key"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "secondary",
											className: "min-h-11",
											onClick: () => void copy$1("API base URL", apiBase),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Copy API base"]
										})]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-control bg-secondary-surface/50 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDot, {
								n: 2,
								done: steps.pastePlaybook
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-medium",
										children: "Copy Playbook into Hermes"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-caption text-muted",
										children: [
											"Package ",
											PLAYBOOK_PACKAGE_VERSION,
											": role, connection placeholders, ops + social playbooks, webhook reactors, and policy defaults. No secrets."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												className: "min-h-11",
												onClick: async () => {
													if (await copy$1("Playbook package", packageText)) paste.mutate();
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Copy Playbook package for Hermes"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "secondary",
												className: "min-h-11",
												onClick: () => void copy$1("MCP config", mcpSnippet),
												children: "Copy MCP config snippet"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "secondary",
												className: "min-h-11",
												onClick: () => void copy$1("inbound webhook", `${webhookUrl}\nSigning secret: <WEBHOOK_SECRET>`),
												children: "Copy inbound webhook URL"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											className: "min-h-11",
											disabled: paste.isPending || steps.pastePlaybook,
											onClick: () => paste.mutate(),
											children: steps.pastePlaybook ? "Pasted into Hermes" : "I’ve pasted this into Hermes"
										}), hermesKey?.lastUsedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-caption text-muted",
											children: "First API call observed — step complete."
										}) : null]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-control bg-secondary-surface/50 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDot, {
								n: 3,
								done: steps.socialPolicy
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, {
												className: "size-4 text-muted",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-medium",
												children: "Social VM policy"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: data.connect.socialPolicyAckedAt ? "green" : "neutral",
												children: policies.socialAutoStartForUpload ? "Auto-start ON" : "Auto-start OFF"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-caption text-muted",
										children: "When ON, Hermes upload jobs may Start the Social Machine if it is stopped. This incurs Daytona compute cost. When OFF, uploads fail with MACHINE_STOPPED until a human or playbook explicitly starts the machine. Dashboard login still never starts a VM."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex items-center justify-between gap-3 rounded-control bg-bg/50 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-caption",
											children: "social.auto_start_for_upload"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-caption text-muted",
											children: "Default off. Changing this is audited."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: policies.socialAutoStartForUpload,
											"aria-label": "social.auto_start_for_upload",
											onCheckedChange: (next) => {
												const updated = {
													...policies,
													socialAutoStartForUpload: next
												};
												onPolicies(updated);
												savePolicies.mutate(updated);
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 grid gap-3 sm:grid-cols-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyChips, {
												title: "social.default_upload_mode",
												hint: "Draft is recommended so Hermes never publishes without review.",
												value: policies.socialDefaultUploadMode,
												options: ["draft", "publish"],
												onChange: (value) => {
													const updated = {
														...policies,
														socialDefaultUploadMode: value
													};
													onPolicies(updated);
													savePolicies.mutate(updated);
												}
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyChips, {
												title: "social.max_auto_retries",
												hint: "Retry failed platforms once or twice — never loop.",
												value: String(policies.socialMaxAutoRetries),
												options: ["1", "2"],
												onChange: (value) => {
													const updated = {
														...policies,
														socialMaxAutoRetries: value === "2" ? 2 : 1
													};
													onPolicies(updated);
													savePolicies.mutate(updated);
												}
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyChips, {
												title: "social.max_bulk_jobs_per_run",
												hint: "Hard cap on bulk_create_upload_jobs.",
												value: String(policies.socialMaxBulkJobsPerRun),
												options: [
													"3",
													"5",
													"10"
												],
												onChange: (value) => {
													const n = Number(value);
													const updated = {
														...policies,
														socialMaxBulkJobsPerRun: n === 3 || n === 10 ? n : 5
													};
													onPolicies(updated);
													savePolicies.mutate(updated);
												}
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-3 text-caption text-muted",
										children: [
											"Browser runtime is on-demand.",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/social",
												className: "text-accent underline-offset-2 hover:underline",
												children: "Open Social"
											}),
											" · ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/settings",
												hash: "integrations",
												className: "text-accent underline-offset-2 hover:underline",
												children: "Daytona add-on"
											})
										]
									}),
									!steps.socialPolicy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "secondary",
										className: "mt-3 min-h-11",
										disabled: ackPolicy.isPending,
										onClick: () => ackPolicy.mutate(),
										children: "Confirm policy (keep current)"
									}) : null
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-control bg-secondary-surface/50 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDot, {
								n: 4,
								done: steps.outbound
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
												className: "size-4 text-muted",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-medium",
												children: "Outbound events to Hermes"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "neutral",
												children: "Optional"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-caption text-muted",
										children: "Register a Hermes receiver URL. Subscribe to social.upload.succeeded, social.session.needs_login, and related lifecycle events. Hermes can also poll."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
										className: "mt-3 flex flex-col gap-3",
										onSubmit: (event) => {
											event.preventDefault();
											saveOutbound.mutate();
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "connect-outbound-url",
												children: "Hermes receiver URL (HTTPS)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "connect-outbound-url",
												value: outboundUrl,
												onChange: (event) => setOutboundUrl(event.target.value),
												placeholder: "https://hermes.example/hooks/clippy",
												className: "min-h-11"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-wrap gap-2",
												children: SOCIAL_LIFECYCLE_EVENTS.map((eventType) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													"aria-pressed": events.includes(eventType),
													className: cn("min-h-11 rounded-full px-3 py-1 text-caption", events.includes(eventType) ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
													onClick: () => setEvents((current) => current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType]),
													children: WEBHOOK_EVENT_LABELS[eventType]
												}, eventType))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "ghost",
														className: "min-h-11",
														onClick: subscribeSocial,
														children: "Subscribe to social lifecycle"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "submit",
														variant: "secondary",
														className: "min-h-11",
														disabled: saveOutbound.isPending,
														children: "Save receiver"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "secondary",
														className: "min-h-11",
														disabled: testDelivery.isPending,
														onClick: () => testDelivery.mutate(),
														children: "Test delivery"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "ghost",
														className: "min-h-11",
														disabled: skipOutbound.isPending || steps.outbound,
														onClick: () => skipOutbound.mutate(),
														children: "Skip for now"
													})
												]
											})
										]
									}),
									data.lastDelivery.at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-caption text-muted",
										children: [
											"Last delivery ",
											data.lastDelivery.status,
											" · ",
											data.lastDelivery.eventType
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-caption text-muted",
										children: "No outbound deliveries yet."
									})
								]
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-start gap-2 rounded-control bg-warning/8 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
					className: "mt-0.5 size-4 shrink-0 text-warning",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Paste these values into Hermes. ClippyOS never receives Hermes’ own API key as the primary model. Kill switch: revoke the key or pause automation."
				})]
			})
		]
	});
}
function PolicyChips({ title, hint, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-control bg-bg/50 px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-caption",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: hint
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": value === option,
					className: cn("min-h-11 rounded-full px-3 py-1 text-caption capitalize", value === option ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
					onClick: () => onChange(option),
					children: option
				}, option))
			})
		]
	});
}
function EventBusCard({ data }) {
	const socialEvents = SOCIAL_LIFECYCLE_EVENTS.filter((event) => data.outboundEvents.includes(event));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
					className: "size-5",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: "Event bus"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Domain events (payment.collected, progress.stage_changed, social.upload.*, social.session.*) flow to outbound webhooks when a receiver is set. Otherwise Hermes polls the API. Hermes Playbook is the autonomous controller; ClippyOS is the system of record and the browser runtime."
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-2 sm:grid-cols-2",
			children: SOCIAL_LIFECYCLE_EVENTS.map((event) => {
				const last = data.lastDeliveryByEvent[event];
				const subscribed = data.outboundEvents.includes(event);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-mono text-caption",
							children: event
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: last ? `${last.status} · ${formatRelativeTime(last.at)}` : subscribed ? "Subscribed · no delivery yet" : "Not subscribed"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: subscribed ? "blue" : "neutral",
						children: subscribed ? "On" : "Off"
					})]
				}, event);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: data.outboundUrl ? `Receiver configured. ${socialEvents.length} social events subscribed.` : "No receiver URL — Hermes should poll GET /api/v1/automation/connect-status and social jobs."
		})
	] });
}
function BrowserRuntimeCard({ data, policies }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Browser runtime"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Daytona is a core OS capability: a Windows Social Machine for Instagram, X, TikTok, and YouTube Studio. VMs are on-demand — never auto-start on login. Hibernate pauses a hot snapshot."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
				tone: policies.socialAutoStartForUpload ? "orange" : "green",
				children: ["auto_start_for_upload ", policies.socialAutoStartForUpload ? "on" : "off"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-control bg-secondary-surface/50 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-caption text-muted",
						children: "Idle hibernate"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "font-medium tabular-nums",
						children: [policies.socialIdleStopMinutes, " min"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-control bg-secondary-surface/50 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-caption text-muted",
						children: "Upload mode"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-medium capitalize",
						children: policies.socialDefaultUploadMode
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-control bg-secondary-surface/50 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-caption text-muted",
						children: "Max retries"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-medium tabular-nums",
						children: policies.socialMaxAutoRetries
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-control bg-secondary-surface/50 px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-caption text-muted",
						children: "Bulk cap"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-medium tabular-nums",
						children: policies.socialMaxBulkJobsPerRun
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/social",
					children: "Open Social"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/settings",
					hash: "integrations",
					children: "Daytona add-on"
				})
			})]
		})
	] });
}
function OsFramingBanner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, {
		className: "border-accent/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, {
					className: "size-5",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Autonomous OS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "ClippyOS is the Autonomous Operating System for Clipping. Integrations are Add-ons. Skills are versioned SKILL.md packages (Python in an isolated sandbox, never the Social Machine). The browser runtime is a Windows VM with hot snapshots. Automation & Hermes is the always-on control plane — mint credentials here, paste them into Hermes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 flex flex-wrap items-center gap-2 text-caption text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-3.5",
						"aria-hidden": "true"
					}), "Core AI is required. Media, Analytics, Discord, and Notion are optional add-ons."]
				})
			] })]
		})
	});
}
function SandboxSecurityCard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
					className: "size-5",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: "Sandbox security"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Social Machine and Skill Execution are separate Daytona sandboxes. Skills never inherit browser profiles. Nothing starts on login."
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-2 sm:grid-cols-3",
			children: Object.keys(SANDBOX_LABELS).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-control bg-secondary-surface/50 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: SANDBOX_LABELS[id].title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: SANDBOX_LABELS[id].blurb
				})]
			}, id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 grid gap-2 sm:grid-cols-2",
			children: SANDBOX_THREAT_MITIGATIONS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-control bg-secondary-surface/40 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption font-medium",
					children: row.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: row.detail
				})]
			}, row.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: "VNC is session-gated. Skill env is allowlisted (no Daytona key, no xAI tokens). Artifacts are extension + size capped; cookies and password fields are stripped. Test Connection does not leave a VM running."
		})
	] });
}
function origin() {
	if (typeof window === "undefined") return "";
	return window.location.origin;
}
async function copy(label, value) {
	const ok = await copyTextToClipboard(value);
	toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
}
function CopyRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-caption text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
				className: "min-w-0 flex-1 truncate rounded-control bg-secondary-surface px-3 py-2 text-caption",
				children: value || "—"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "secondary",
				"aria-label": `Copy ${label}`,
				onClick: () => void copy(label, value),
				disabled: !value,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
			})]
		})]
	});
}
function SecretReveal({ title, value, warning, onDone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(value),
		onOpenChange: (open) => !open && onDone(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "w-[min(100%-2rem,32rem)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: warning }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "min-w-0 flex-1 break-all rounded-control bg-secondary-surface px-3 py-3 text-caption",
						children: value
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "secondary",
						"aria-label": "Copy secret",
						onClick: () => void copy("secret", value),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4",
					onClick: onDone,
					children: "I’ve saved it"
				})
			]
		})
	});
}
function AutomationPanel() {
	const queryClient = useQueryClient();
	const roleQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const isAdmin = roleQuery.data?.role === "admin";
	const snap = useQuery({
		queryKey: AUTONOMY_QUERY_KEY,
		queryFn: () => getAutonomySnapshot(),
		enabled: isAdmin
	});
	const audit = useQuery({
		queryKey: AUTONOMY_AUDIT_QUERY_KEY,
		queryFn: () => listAutonomyAudit(),
		enabled: isAdmin
	});
	const [keyName, setKeyName] = (0, import_react.useState)("Hermes");
	const [scopes, setScopes] = (0, import_react.useState)([...DEFAULT_HERMES_SCOPES]);
	const [plaintext, setPlaintext] = (0, import_react.useState)(null);
	const [plainTitle, setPlainTitle] = (0, import_react.useState)("API key");
	const [revokeId, setRevokeId] = (0, import_react.useState)(null);
	const [rotateId, setRotateId] = (0, import_react.useState)(null);
	const [outboundUrl, setOutboundUrl] = (0, import_react.useState)("");
	const [outboundEvents, setOutboundEvents] = (0, import_react.useState)([...WEBHOOK_EVENT_TYPES]);
	const [sourceFilter, setSourceFilter] = (0, import_react.useState)("all");
	const [actionFilter, setActionFilter] = (0, import_react.useState)("");
	const [playbookFilter, setPlaybookFilter] = (0, import_react.useState)("");
	const [dateFilter, setDateFilter] = (0, import_react.useState)("");
	const [plainWarning, setPlainWarning] = (0, import_react.useState)("Store this in Hermes now; it won’t be shown again.");
	const [mcpPlain, setMcpPlain] = (0, import_react.useState)(null);
	const [enabled, setEnabled] = (0, import_react.useState)(true);
	const [policies, setPolicies] = (0, import_react.useState)(null);
	const [pauseOpen, setPauseOpen] = (0, import_react.useState)(false);
	const base = origin();
	const apiBase = `${base}/api/v1`;
	const mcpUrl = `${base}/api/mcp`;
	const webhookUrl = `${base}/api/webhooks/inbound`;
	const data = snap.data;
	(0, import_react.useEffect)(() => {
		if (!data) return;
		setOutboundUrl(data.outboundUrl ?? "");
		if (data.outboundEvents.length) setOutboundEvents(data.outboundEvents);
		setEnabled(data.automationEnabled);
		setPolicies(data.policies);
	}, [data]);
	const createKey = useMutation({
		mutationFn: () => createAutonomyKey({ data: {
			name: keyName.trim(),
			scopes
		} }),
		onSuccess: async (result) => {
			setPlainTitle("API key");
			setPlainWarning("Store this in Hermes now; it won’t be shown again.");
			setPlaintext(result.plaintext);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.success("API key created — copy it now");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const revoke = useMutation({
		mutationFn: (id) => revokeAutonomyKey({ data: id }),
		onSuccess: async () => {
			setRevokeId(null);
			toast.success("Key revoked");
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const rotate = useMutation({
		mutationFn: (id) => rotateAutonomyKey({ data: id }),
		onSuccess: async (result) => {
			setRotateId(null);
			setPlainTitle("Rotated API key");
			setPlainWarning("Store this in Hermes now; it won’t be shown again.");
			setPlaintext(result.plaintext);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const mcp = useMutation({
		mutationFn: () => rotateMcpToken(),
		onSuccess: async (result) => {
			setPlainTitle("MCP token");
			setPlainWarning("Store this in Hermes now; it won’t be shown again.");
			setMcpPlain(result.plaintext);
			setPlaintext(result.plaintext);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const webhook = useMutation({
		mutationFn: () => rotateWebhookSecret(),
		onSuccess: async (result) => {
			setPlainTitle("Webhook signing secret");
			setPlainWarning("Store this in Hermes now; it won’t be shown again. We keep it only to verify inbound signatures.");
			setPlaintext(result.plaintext);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveOutbound = useMutation({
		mutationFn: () => saveOutboundWebhook({ data: {
			destinationUrl: outboundUrl.trim() || null,
			events: outboundEvents
		} }),
		onSuccess: () => toast.success("Outbound webhook saved"),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveSettings = useMutation({
		mutationFn: (next) => saveAutomationSettings({ data: next }),
		onSuccess: async (_result, next) => {
			setEnabled(next.enabled);
			setPolicies(next.policies);
			setPauseOpen(false);
			await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
			toast.success(next.enabled ? "Automation settings saved" : "Hermes mutations paused");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (roleQuery.isPending || isAdmin && snap.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-64" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" })
		]
	});
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "automation",
		className: "scroll-mt-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Automation & Hermes"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-body text-muted",
			children: "Only workspace admins can mint API keys, MCP tokens, and webhook secrets."
		})]
	});
	if (snap.isError || !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load automation",
		description: "Only workspace admins can manage Hermes credentials.",
		onRetry: () => void snap.refetch()
	});
	const grouped = MCP_TOOLS.reduce((acc, tool) => {
		acc[tool.domain] = [...acc[tool.domain] ?? [], tool];
		return acc;
	}, {});
	const auditRows = (audit.data ?? []).filter((row) => {
		if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
		if (actionFilter && !row.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
		if (playbookFilter && !(row.playbookId ?? "").toLowerCase().includes(playbookFilter.toLowerCase()) && !(row.runId ?? "").toLowerCase().includes(playbookFilter.toLowerCase())) return false;
		if (dateFilter && !row.createdAt.startsWith(dateFilter)) return false;
		return true;
	});
	const hermesConfig = JSON.stringify({ mcpServers: { "clippy-admin": {
		url: mcpUrl,
		headers: { Authorization: `Bearer ${mcpPlain ?? "<MCP_TOKEN>"}` }
	} } }, null, 2);
	function toggleScope(scope) {
		setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
	}
	function onCreate(event) {
		event.preventDefault();
		if (!keyName.trim() || scopes.length === 0) return;
		createKey.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "automation",
		className: "flex scroll-mt-24 flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "Automation & Hermes"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-3xl text-body text-muted",
				children: "ClippyOS exposes API, MCP, and Webhooks so Hermes can run the agency autonomously. Complete Connect Hermes below, paste credentials into Hermes, and use the Playbook as the operating manual."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OsFramingBanner, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id: "hermes-connect",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HermesConnect, {
					data,
					origin: base,
					enabled,
					policies: policies ?? data.policies,
					onPolicies: (next) => setPolicies(next),
					onPlaintext: (title, value, warning) => {
						setPlainTitle(title);
						setPlaintext(value);
						setPlainWarning(warning);
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowserRuntimeCard, {
				data,
				policies: policies ?? data.policies
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SandboxSecurityCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, {
				className: "border-warning/40 bg-warning/8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
						className: "mt-0.5 size-5 text-warning",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "Human-only boundary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: "Credentials cannot access integration secrets, Super Admin password, or Disconnect. Those remain human-only. Operator can revoke Hermes keys instantly (kill switch)."
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Kill switch & policies"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "AUTOMATION_ENABLED pauses AGENT-sourced mutations. Human UI stays live. Defaults prevent auto mark-paid, evidence-free stage advances, and auto-creating clients from CLOSED leads."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: enabled ? "green" : "orange",
						children: enabled ? "Live" : "Paused"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: enabled,
						"aria-label": "Automation enabled",
						onCheckedChange: (next) => {
							if (!policies) return;
							if (!next) {
								setPauseOpen(true);
								return;
							}
							saveSettings.mutate({
								enabled: true,
								policies
							});
						}
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-4 flex flex-col gap-3",
				children: [
					PLAYBOOK_POLICY_LABELS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-caption",
							children: row.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: row.hint
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: Boolean(policies?.[row.key]),
							"aria-label": row.title,
							disabled: !policies,
							onCheckedChange: (next) => {
								if (!policies) return;
								const updated = {
									...policies,
									[row.key]: next
								};
								setPolicies(updated);
								saveSettings.mutate({
									enabled,
									policies: updated
								});
							}
						})]
					}, row.key)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-caption",
							children: "analytics_pull_concurrency"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Keep YouTube pulls sequential or low concurrency."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: ["low", "medium"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": policies?.analyticsPullConcurrency === value,
								className: cn("rounded-full px-3 py-1 text-caption capitalize", policies?.analyticsPullConcurrency === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
								onClick: () => {
									if (!policies) return;
									const updated = {
										...policies,
										analyticsPullConcurrency: value
									};
									setPolicies(updated);
									saveSettings.mutate({
										enabled,
										policies: updated
									});
								},
								children: value
							}, value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-caption",
							children: "social.default_upload_mode"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Draft is recommended so Hermes never publishes without review."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: ["draft", "publish"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": policies?.socialDefaultUploadMode === value,
								className: cn("min-h-11 rounded-full px-3 py-1 text-caption capitalize", policies?.socialDefaultUploadMode === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
								onClick: () => {
									if (!policies) return;
									const updated = {
										...policies,
										socialDefaultUploadMode: value
									};
									setPolicies(updated);
									saveSettings.mutate({
										enabled,
										policies: updated
									});
								},
								children: value
							}, value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-caption",
							children: "social.max_auto_retries"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Retry failed platforms once or twice — never loop."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: [1, 2].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": policies?.socialMaxAutoRetries === value,
								className: cn("min-h-11 rounded-full px-3 py-1 text-caption", policies?.socialMaxAutoRetries === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
								onClick: () => {
									if (!policies) return;
									const updated = {
										...policies,
										socialMaxAutoRetries: value
									};
									setPolicies(updated);
									saveSettings.mutate({
										enabled,
										policies: updated
									});
								},
								children: value
							}, value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-caption",
							children: "social.max_bulk_jobs_per_run"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Hard cap on bulk_create_upload_jobs per Hermes run."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: [
								3,
								5,
								10
							].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": policies?.socialMaxBulkJobsPerRun === value,
								className: cn("min-h-11 rounded-full px-3 py-1 text-caption", policies?.socialMaxBulkJobsPerRun === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
								onClick: () => {
									if (!policies) return;
									const updated = {
										...policies,
										socialMaxBulkJobsPerRun: value
									};
									setPolicies(updated);
									saveSettings.mutate({
										enabled,
										policies: updated
									});
								},
								children: value
							}, value))
						})]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "API access"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Bearer keys for Hermes. Shown in plaintext only once."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
						label: "Base URL",
						value: apiBase
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
						label: "Sample header",
						value: "Authorization: Bearer <key>"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: onCreate,
					className: "mt-5 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "key-name",
							children: "New key name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "key-name",
							value: keyName,
							onChange: (event) => setKeyName(event.target.value),
							maxLength: 80,
							required: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "text-caption text-muted",
								children: "Scopes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: API_KEY_SCOPES.map((scope) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => toggleScope(scope),
									"aria-pressed": scopes.includes(scope),
									className: cn("rounded-full px-3 py-1 text-caption", scopes.includes(scope) ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
									children: SCOPE_LABELS[scope]
								}, scope))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-caption text-muted",
								children: "Default Hermes least privilege includes read, progress, mark-paid, leads, AI, and write:social (Social Machine + uploads). Daytona keys stay human-only."
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: createKey.isPending,
							children: "Create API key"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 overflow-x-auto",
					children: data.keys.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body text-muted",
						children: "No API keys yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[40rem] text-left text-caption",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: "Name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: "Scopes"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: "Created"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: "Last used"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: " "
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.keys.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: key.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-muted",
										children: [
											key.keyPrefix,
											"…",
											key.last4
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-1",
										children: key.scopes.map((scope) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "blue",
											children: SCOPE_LABELS[scope]
										}, scope))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-muted",
									children: formatRelativeTime(key.createdAt)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-muted",
									children: key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : "Never"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: key.revokedAt ? "red" : "green",
										children: key.revokedAt ? "Revoked" : "Active"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: key.revokedAt ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setRotateId(key.id),
											children: "Rotate"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setRevokeId(key.id),
											children: "Revoke"
										})]
									})
								})
							]
						}, key.id)) })]
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "MCP server"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Hermes connects to Agency Admin as an MCP client."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "MCP endpoint",
							value: mcpUrl
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: data.mcpConfigured ? "green" : "neutral",
									children: data.mcpConfigured ? "Token issued" : "Not configured"
								}),
								data.mcpLast4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-caption text-muted",
									children: ["…", data.mcpLast4]
								}) : null,
								data.mcpLastUsedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-caption text-muted",
									children: ["Last used ", formatRelativeTime(data.mcpLastUsedAt)]
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => mcp.mutate(),
							disabled: mcp.isPending,
							children: data.mcpConfigured ? "Rotate MCP token" : "Generate MCP token"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "Copy Hermes config",
							value: hermesConfig
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: Object.entries(grouped).map(([domain, tools]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption font-medium",
							children: domain
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 text-caption text-muted",
							children: tools.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: tool.name }, tool.name))
						})]
					}, domain))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Webhook, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Webhooks"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Paste the inbound URL and signing secret into Hermes. Outbound push is optional."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "Inbound webhook URL",
							value: webhookUrl
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: data.webhookConfigured ? "green" : "neutral",
								children: data.webhookConfigured ? "Secret issued" : "Not configured"
							}), data.webhookLast4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-caption text-muted",
								children: ["…", data.webhookLast4]
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => webhook.mutate(),
							disabled: webhook.isPending,
							children: data.webhookConfigured ? "Rotate signing secret" : "Generate signing secret"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-control bg-secondary-surface/50 px-3 py-3 text-caption text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-fg",
									children: "HMAC verification"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1",
									children: [
										"Header ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-Agency-Signature" }),
										" = sha256=HMAC-SHA256(secret, timestamp + \".\" + raw body). Timestamp in ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-Agency-Timestamp" }),
										" (Unix seconds). Rejected if skew exceeds 5 minutes."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2",
									children: ["Commands: ", INBOUND_COMMANDS.join(", ")]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-5 flex flex-col gap-3",
					onSubmit: (event) => {
						event.preventDefault();
						saveOutbound.mutate();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "outbound-url",
							children: "Outbound destination (optional, HTTPS only)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "outbound-url",
							value: outboundUrl,
							onChange: (event) => setOutboundUrl(event.target.value),
							placeholder: "https://hermes.example/hooks/clippy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-caption text-muted",
							children: "Event subscriptions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: WEBHOOK_EVENT_TYPES.map((eventType) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": outboundEvents.includes(eventType),
								onClick: () => setOutboundEvents((current) => current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType]),
								className: cn("rounded-full px-3 py-1 text-caption", outboundEvents.includes(eventType) ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
								children: WEBHOOK_EVENT_LABELS[eventType]
							}, eventType))
						})] }),
						data.lastDelivery.at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-caption text-muted",
							children: [
								"Last delivery ",
								formatRelativeTime(data.lastDelivery.at),
								" · ",
								data.lastDelivery.status,
								" ·",
								" ",
								data.lastDelivery.eventType
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "No outbound deliveries yet. Hermes can poll the API instead."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "secondary",
							disabled: saveOutbound.isPending,
							children: "Save outbound settings"
						})
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaybookCatalog, {
				policies: policies ?? data.policies,
				enabled
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventBusCard, { data }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Agent activity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Append-only. Not editable."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						[
							"all",
							"api",
							"mcp",
							"webhook"
						].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": sourceFilter === value,
							onClick: () => setSourceFilter(value),
							className: cn("rounded-full px-3 py-1 text-caption capitalize", sourceFilter === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted"),
							children: value
						}, value)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							"aria-label": "Filter by action",
							placeholder: "Filter action",
							value: actionFilter,
							onChange: (event) => setActionFilter(event.target.value),
							className: "h-8 w-40"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							"aria-label": "Filter by playbook or run id",
							placeholder: "Playbook / run id",
							value: playbookFilter,
							onChange: (event) => setPlaybookFilter(event.target.value),
							className: "h-8 w-44"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							"aria-label": "Filter by date",
							type: "date",
							value: dateFilter,
							onChange: (event) => setDateFilter(event.target.value),
							className: "h-8 w-40"
						})
					]
				}),
				audit.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-32 w-full" }) : auditRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					className: "mt-4",
					title: "No agent activity yet",
					description: "Once Hermes calls the API, MCP, or inbound webhook, actions appear here."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 flex flex-col gap-2",
					children: auditRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-1 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-body",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: row.action
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [row.entityType, row.entityId ? ` ${row.entityId.slice(0, 8)}` : ""]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-caption text-muted",
							children: [
								row.actorLabel,
								" · ",
								row.source,
								row.playbookId ? ` · ${row.playbookId}` : "",
								row.runId ? ` · ${row.runId.slice(0, 8)}` : "",
								" · ",
								row.requestId.slice(0, 8)
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: row.result === "ok" ? "green" : row.result === "denied" ? "orange" : "red",
								children: row.result
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								className: "text-caption text-muted",
								children: formatRelativeTime(row.createdAt)
							})]
						})]
					}, row.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretReveal, {
				title: plainTitle,
				value: plaintext ?? "",
				warning: plainWarning,
				onDone: () => setPlaintext(null)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(revokeId),
				onOpenChange: (open) => !open && setRevokeId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Revoke this API key?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Hermes will lose access immediately. You can mint a replacement afterwards." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setRevokeId(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: !revokeId || revoke.isPending,
							onClick: () => revokeId && revoke.mutate(revokeId),
							children: "Revoke"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(rotateId),
				onOpenChange: (open) => !open && setRotateId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Rotate this API key?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "The current key is revoked and a new plaintext key is shown once." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setRotateId(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: !rotateId || rotate.isPending,
							onClick: () => rotateId && rotate.mutate(rotateId),
							children: "Rotate"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: pauseOpen,
				onOpenChange: (open) => !open && setPauseOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Pause Hermes mutations?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Reads still work. Mark-as-paid, stage writes, leads, and AI actions from API / MCP / webhooks will fail closed until you turn automation back on. The human dashboard stays live." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setPauseOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: !policies || saveSettings.isPending,
							onClick: () => policies && saveSettings.mutate({
								enabled: false,
								policies
							}),
							children: "Pause automation"
						})]
					})
				] })
			})
		]
	});
}
var listAddons = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("047cfcdf86c850aec240aa7d60b7ff7d05e0177734fe0e198543b3b5824dc59c"));
var setAddonEnabled = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	enabled: boolean()
}).parse(input)).handler(createSsrRpc("4949676a769c7c7113244ee7bab54e48deefb76e7dd23b2ee5bb51c5bdb83f22"));
var installAddonManifest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ manifest: unknown() }).parse(input)).handler(createSsrRpc("ef85fe61cbbb9a48cf3212dd2b22627329d757471890937dc56aab57b5d2dd4c"));
function typeTone(type) {
	if (type === "core") return "teal";
	if (type === "runtime") return "blue";
	if (type === "llm-provider") return "purple";
	if (type === "skill-pack") return "orange";
	return "neutral";
}
function AddonsPanel() {
	const queryClient = useQueryClient();
	const [manifestOpen, setManifestOpen] = (0, import_react.useState)(null);
	const [installOpen, setInstallOpen] = (0, import_react.useState)(false);
	const [installJson, setInstallJson] = (0, import_react.useState)("");
	const roleQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const query = useQuery({
		queryKey: ADDONS_QUERY_KEY,
		queryFn: () => listAddons()
	});
	const isAdmin = roleQuery.data?.role === "admin";
	const toggle = useMutation({
		mutationFn: (input) => setAddonEnabled({ data: input }),
		onSuccess: async () => {
			toast.success("Add-on updated");
			await queryClient.invalidateQueries({ queryKey: ADDONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const install = useMutation({
		mutationFn: async () => {
			let parsed;
			try {
				parsed = JSON.parse(installJson);
			} catch {
				throw new Error("ADDON_INVALID");
			}
			return installAddonManifest({ data: { manifest: parsed } });
		},
		onSuccess: async () => {
			toast.success("Manifest installed");
			setInstallOpen(false);
			setInstallJson("");
			await queryClient.invalidateQueries({ queryKey: ADDONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Add-on registry"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full rounded-card" })]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load add-ons",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-section font-semibold tracking-tight",
					children: "Add-on registry"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-body text-muted",
					children: "Enable or disable OS add-ons. Disabled add-ons hide their MCP tools. Keys stay on the server."
				})] }), isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => setInstallOpen(true),
					children: "Install manifest"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3 md:grid-cols-2",
				children: query.data.items.map(({ manifest, state }) => {
					const locked = Boolean(manifest.locked || manifest.required);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
						className: "h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-10 shrink-0 place-items-center rounded-control bg-secondary-surface",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, {
											className: "size-5",
											"aria-hidden": "true"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-card font-semibold tracking-tight",
											children: manifest.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-caption text-muted",
											children: manifest.id
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: typeTone(manifest.type),
											children: manifest.type
										}),
										locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
											className: "size-3.5 text-muted",
											"aria-hidden": "true"
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: state.enabled,
											disabled: !isAdmin || locked || toggle.isPending,
											"aria-label": `Enable ${manifest.name}`,
											onCheckedChange: (next) => toggle.mutate({
												id: manifest.id,
												enabled: next
											})
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-body text-muted",
								children: manifest.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-caption text-muted",
								children: ["Used by: ", manifest.usedBy.join(", ") || "—"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-caption text-muted",
								children: ["Permissions: ", manifest.permissions.join(", ") || "none"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => setManifestOpen(manifest),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileJson, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Manifest"]
								})
							})
						]
					}) }, manifest.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(manifestOpen),
				onOpenChange: (open) => {
					if (!open) setManifestOpen(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: manifestOpen?.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "schemaVersion 1 — no secrets in this document." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-4 max-h-80 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption",
						children: manifestOpen ? JSON.stringify(manifestOpen, null, 2) : ""
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: installOpen,
				onOpenChange: setInstallOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Install add-on manifest" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Paste a schemaVersion 1 JSON manifest. Unknown permissions are rejected. No remote URL fetch in v1." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-4 min-h-40 font-mono text-caption",
						value: installJson,
						onChange: (event) => setInstallJson(event.target.value),
						placeholder: "{\"schemaVersion\":1,\"id\":\"agency.example\",\"name\":\"Example\",...}"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setInstallOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: install.isPending || !installJson.trim(),
							onClick: () => install.mutate(),
							children: install.isPending ? "Installing…" : "Install"
						})]
					})
				] })
			})
		]
	});
}
var FILTERS = [
	"all",
	"builtin",
	"human",
	"agent",
	"pending"
];
function provenanceTone(value) {
	if (value === "builtin") return "teal";
	if (value === "agent") return "purple";
	return "blue";
}
function statusTone(value) {
	if (value === "active") return "green";
	if (value === "pending_review") return "orange";
	if (value === "archived") return "neutral";
	return "red";
}
function SkillsPanel() {
	const queryClient = useQueryClient();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(`---
name: New skill
description: Describe the procedure.
version: 0.1.0
tags: [custom]
category: custom
provenance: human
permissions: [clients:read]
runtime: { timeoutSec: 30, network: false }
---

# New skill

1. Call existing tools only
2. Never request secrets
`);
	const roleQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const query = useQuery({
		queryKey: SKILLS_QUERY_KEY,
		queryFn: () => listSkillsFn()
	});
	const isAdmin = roleQuery.data?.role === "admin";
	const items = (0, import_react.useMemo)(() => {
		const all = query.data ?? [];
		if (filter === "all") return all;
		if (filter === "pending") return all.filter((row) => row.status === "pending_review");
		return all.filter((row) => row.provenance === filter);
	}, [query.data, filter]);
	const create = useMutation({
		mutationFn: () => createSkillFn({ data: {
			skillMd: draft,
			provenance: "human"
		} }),
		onSuccess: async () => {
			toast.success("Skill created");
			setCreateOpen(false);
			await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Skills"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full rounded-card" })]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load skills",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-section font-semibold tracking-tight",
					children: "Skills"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-body text-muted",
					children: "SKILL.md packages with optional Python. Python runs in an isolated Daytona sandbox — never on the Social Machine. Agent-authored skills stay pending_review until you approve them."
				})] }), isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => setCreateOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "New skill"]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: FILTERS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: filter === row ? "primary" : "secondary",
					onClick: () => setFilter(row),
					children: row
				}, row))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-3",
				children: items.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "min-w-0 text-left",
						onClick: () => setOpenId(skill.id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-card font-semibold tracking-tight",
								children: skill.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-caption text-muted",
								children: skill.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-caption text-muted",
								children: [
									skill.slug,
									" · v",
									skill.version
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: provenanceTone(skill.provenance),
								children: skill.provenance
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: statusTone(skill.status),
								children: skill.status.replace("_", " ")
							}),
							isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: skill.enabled && skill.status === "active",
								disabled: skill.status === "pending_review",
								"aria-label": `Enable ${skill.name}`,
								onCheckedChange: (next) => {
									setSkillEnabledFn({ data: {
										id: skill.id,
										enabled: next
									} }).then(async () => {
										await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
									}).catch((error) => toast.error(userFacingErrorMessage(error)));
								}
							}) : null
						]
					})]
				}) }) }, skill.id))
			}),
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body text-muted",
				children: "No skills in this filter."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillSheet, {
				id: openId,
				onClose: () => setOpenId(null),
				isAdmin
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: createOpen,
				onOpenChange: setCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New skill" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "YAML frontmatter plus markdown. Python is optional. Secrets are stripped on save." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-4 min-h-64 font-mono text-caption",
						value: draft,
						onChange: (event) => setDraft(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setCreateOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: create.isPending,
							onClick: () => create.mutate(),
							children: create.isPending ? "Saving…" : "Create"
						})]
					})
				] })
			})
		]
	});
}
function SkillSheet({ id, onClose, isAdmin }) {
	const queryClient = useQueryClient();
	const [args, setArgs] = (0, import_react.useState)("{}");
	const skillQuery = useQuery({
		queryKey: [...SKILLS_QUERY_KEY, id],
		queryFn: () => getSkillFn({ data: id }),
		enabled: Boolean(id)
	});
	const runsQuery = useQuery({
		queryKey: [...SKILL_RUNS_QUERY_KEY, id],
		queryFn: () => listSkillRunsFn({ data: id }),
		enabled: Boolean(id)
	});
	const invoke = useMutation({
		mutationFn: () => {
			let parsed = {};
			try {
				parsed = JSON.parse(args || "{}");
			} catch {
				throw new Error("VALIDATION");
			}
			return invokeSkillFn({ data: {
				id,
				args: parsed
			} });
		},
		onSuccess: async (result) => {
			toast.success(result.run.status === "completed" ? "Skill finished" : "Skill ran");
			await queryClient.invalidateQueries({ queryKey: SKILL_RUNS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const approve = useMutation({
		mutationFn: () => approveSkillFn({ data: id }),
		onSuccess: async () => {
			toast.success("Skill approved");
			await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const skill = skillQuery.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: Boolean(id),
		onOpenChange: (open) => {
			if (!open) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			children: skillQuery.isPending || !skill ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full rounded-card" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: skill.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetDescription, { children: [
					skill.provenance,
					" · v",
					skill.version,
					" · ",
					skill.status.replace("_", " ")
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: provenanceTone(skill.provenance),
						children: skill.provenance
					}), skill.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "neutral",
						children: tag
					}, tag))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-caption text-muted",
					children: ["Scripts: ", Object.keys(skill.scripts).join(", ") || "none (markdown only)"]
				}),
				skill.status === "pending_review" && isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-4",
					onClick: () => approve.mutate(),
					disabled: approve.isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, {
						className: "size-4",
						"aria-hidden": "true"
					}), approve.isPending ? "Approving…" : "Approve agent skill"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-4 max-h-56 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption whitespace-pre-wrap",
					children: skill.skillMd
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "skill-args",
							children: "Invoke args (JSON)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "skill-args",
							className: "min-h-24 font-mono text-caption",
							value: args,
							onChange: (event) => setArgs(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => invoke.mutate(),
							disabled: invoke.isPending || skill.status !== "active",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": "true"
							}), invoke.isPending ? "Running…" : "Invoke test"]
						})
					]
				}),
				invoke.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: cn("mt-3 max-h-40 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption"),
					children: (invoke.data.run.stdout || invoke.data.run.stderr || invoke.data.run.errorCode || "").slice(0, 4e3)
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "mt-6 text-card font-semibold",
					children: "Recent runs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-2 flex flex-col gap-2",
					children: [(runsQuery.data ?? []).slice(0, 8).map((run) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-2 font-mono text-caption",
						children: [
							run.status,
							" · exit ",
							run.exitCode ?? "—",
							" · ",
							run.durationMs ?? 0,
							"ms"
						]
					}, run.id)), (runsQuery.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-caption text-muted",
						children: "No runs yet."
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 flex items-center gap-2 text-caption text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-3.5",
						"aria-hidden": "true"
					}), "Self-improve proposes agent skills after ≥ 5 successful tools on a run. They stay pending until you approve."]
				})
			] })
		})
	});
}
function LlmProvidersPanel() {
	const queryClient = useQueryClient();
	const roleQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const query = useQuery({
		queryKey: LLM_QUERY_KEY,
		queryFn: () => getLlmSnapshot()
	});
	const isAdmin = roleQuery.data?.role === "admin";
	const saveRouter = useMutation({
		mutationFn: (router) => saveLlmRouter({ data: router }),
		onSuccess: async () => {
			toast.success("LLM routing saved");
			await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "LLM Providers"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full rounded-card" })]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load LLM providers",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	const snap = query.data;
	const router = snap.router;
	function patchRouter(patch) {
		saveRouter.mutate({
			...router,
			...patch,
			features: patch.features ?? router.features
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "LLM Providers"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-body text-muted",
				children: "SuperGrok OAuth uses subscription quota. The metered xAI API key is billed separately on console.x.ai. A 403 on OAuth means this tier cannot run inference — switch to the API key. HTTP 429 uses exponential backoff (not the same as a 403). Tokens never leave the server."
			})] }),
			snap.rateLimit?.retrying || snap.rateLimit?.recent429 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "xAI capacity"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-warning",
					role: "status",
					children: snap.rateLimit.message ?? "Capacity — retrying…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-caption text-muted",
					children: [
						"Recent 429s: ",
						snap.rateLimit.recent429,
						" · in flight: ",
						snap.rateLimit.inFlight,
						snap.rateLimit.backoffUntil ? ` · backoff until ${new Date(snap.rateLimit.backoffUntil).toLocaleTimeString()}` : ""
					]
				})
			] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: LLM_PROVIDER_COPY["xai-oauth"].billing
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GrokOAuthSection, { embedded: true })
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyProviderCard, {
						id: "xai-api",
						isAdmin,
						last4: snap.providers["xai-api"].last4,
						health: snap.providers["xai-api"].health
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyProviderCard, {
						id: "openai-compat",
						isAdmin,
						last4: snap.providers["openai-compat"].last4,
						health: snap.providers["openai-compat"].health
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-card font-semibold tracking-tight",
								children: "Routing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "Default model is grok-4.6. Feature overrides fall back to the system default."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "llm-default-provider",
										children: "System default"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: router.defaultProvider,
										onValueChange: (value) => patchRouter({ defaultProvider: value }),
										disabled: !isAdmin,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "llm-default-provider",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LLM_PROVIDER_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: id,
											children: LLM_PROVIDER_COPY[id].name
										}, id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "llm-default-model",
										children: "Default model"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: router.defaultModel,
										onValueChange: (value) => patchRouter({ defaultModel: value }),
										disabled: !isAdmin,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "llm-default-model",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LLM_MODELS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: row.id,
											children: row.label
										}, row.id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "llm-fallback",
										children: "Fallback"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: router.fallbackProvider ?? "none",
										onValueChange: (value) => patchRouter({ fallbackProvider: value === "none" ? null : value }),
										disabled: !isAdmin,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "llm-fallback",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "none",
											children: "None"
										}), LLM_PROVIDER_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: id,
											children: LLM_PROVIDER_COPY[id].name
										}, id))] })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex flex-col gap-2",
							children: LLM_FEATURES.filter((feature) => feature !== "system").map((feature) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-caption",
									children: LLM_FEATURE_LABELS[feature]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: router.features[feature] ?? "inherit",
									onValueChange: (value) => {
										const features = { ...router.features };
										if (value === "inherit") delete features[feature];
										else features[feature] = value;
										patchRouter({ features });
									},
									disabled: !isAdmin,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "sm:w-56",
										"aria-label": `${feature} provider`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "inherit",
										children: "System default"
									}), LLM_PROVIDER_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: id,
										children: LLM_PROVIDER_COPY[id].name
									}, id))] })]
								})]
							}, feature))
						})
					] })
				]
			})
		]
	});
}
function KeyProviderCard({ id, isAdmin, last4, health }) {
	const queryClient = useQueryClient();
	const [key, setKey] = (0, import_react.useState)("");
	const copy = LLM_PROVIDER_COPY[id];
	const save = useMutation({
		mutationFn: () => saveLlmApiKey({ data: {
			provider: id,
			key: key.trim()
		} }),
		onSuccess: async () => {
			setKey("");
			toast.success("Key saved");
			await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const test = useMutation({
		mutationFn: () => testLlmProvider({ data: { provider: id } }),
		onSuccess: () => toast.success("Provider responded"),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const disconnect = useMutation({
		mutationFn: () => disconnectLlmProvider({ data: { provider: id } }),
		onSuccess: async () => {
			toast.success("Disconnected");
			await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: copy.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: copy.purpose
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone$1(health === "connected" ? "CONNECTED" : "PENDING"),
				children: health === "connected" ? last4 ? `…${last4}` : "Connected" : "Not configured"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: copy.billing
		}),
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 flex flex-col gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				save.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `key-${id}`,
					children: "API key"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: `key-${id}`,
					type: "password",
					autoComplete: "off",
					value: key,
					onChange: (event) => setKey(event.target.value),
					placeholder: id === "xai-api" ? "xai-…" : "sk-…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: save.isPending || key.trim().length < 8,
							children: save.isPending ? "Saving…" : "Save key"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							disabled: test.isPending || health === "not_configured",
							onClick: () => test.mutate(),
							children: test.isPending ? "Testing…" : "Test"
						}),
						health === "connected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "secondary",
							disabled: disconnect.isPending,
							onClick: () => disconnect.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Disconnect"]
						}) : null
					]
				})
			]
		}) : null
	] });
}
function MediaPipelinePanel() {
	const queryClient = useQueryClient();
	const roleQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const query = useQuery({
		queryKey: LIBRARY_MEDIA_SETTINGS_KEY,
		queryFn: () => getMediaSettingsFn()
	});
	const isAdmin = roleQuery.data?.role === "admin";
	const save = useMutation({
		mutationFn: (patch) => saveMediaSettingsFn({ data: patch }),
		onSuccess: async () => {
			toast.success("Media pipeline saved");
			await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const test = useMutation({
		mutationFn: () => testRenderFn(),
		onSuccess: (result) => {
			if (result.ok) toast.success(result.message);
			else toast.error(result.message);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-section font-semibold tracking-tight",
			children: "Media pipeline"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full rounded-card" })]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load media settings",
		description: "Retry in a moment.",
		onRetry: () => void query.refetch()
	});
	const settings = query.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-section font-semibold tracking-tight",
				children: "Media pipeline"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-caption text-muted",
				children: "Transcription, render presets, and FFmpeg worker health. Captions still work from a manual SRT if speech-to-text is off. Clips live in Supabase Storage on Vercel — the Windows Social Machine is not the media backend."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {
								className: "size-5",
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: "Transcription"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: settings.transcriptionHint
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: statusTone$1(settings.transcriptionConfigured ? "CONNECTED" : "PENDING"),
						children: settings.transcriptionConfigured ? "xAI STT" : "Manual SRT"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: settings.ffmpegAvailable ? "green" : "orange",
						children: settings.ffmpegAvailable ? `FFmpeg ${settings.ffmpegVersion ?? "ready"}` : "FFmpeg missing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: settings.libraryBackend === "local" ? "orange" : "green",
						children: settings.libraryBackend === "supabase" ? "Supabase Storage" : settings.libraryBackend === "s3" ? "S3 / Filebase" : "Local preview disk"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-caption text-muted",
					children: settings.libraryBackendHint
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-card font-semibold tracking-tight",
					children: "Defaults"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "default-preset",
								children: "Default render preset"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: settings.defaultPreset,
								disabled: !isAdmin,
								onValueChange: (value) => save.mutate({ defaultPreset: value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "default-preset",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: RENDER_PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: preset,
									children: PRESET_LABELS[preset]
								}, preset)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "max-upload",
								children: "Max upload (MB)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "max-upload",
								type: "number",
								min: 8,
								max: 512,
								defaultValue: settings.maxUploadMb,
								disabled: !isAdmin,
								onBlur: (event) => {
									const value = Number(event.target.value);
									if (Number.isFinite(value) && value !== settings.maxUploadMb) save.mutate({ maxUploadMb: value });
								}
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "concurrent",
								children: "Concurrent renders"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: String(settings.concurrentRenders),
								disabled: !isAdmin,
								onValueChange: (value) => save.mutate({ concurrentRenders: Number(value) }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "concurrent",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "1",
									children: "1"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "2",
									children: "2"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-6 flex items-center gap-2 text-body",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: settings.daytonaRender,
								disabled: !isAdmin,
								onChange: (event) => save.mutate({ daytonaRender: event.target.checked })
							}), "Prefer Daytona for long renders (job-scoped sandbox, never on login)"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "mt-4",
					variant: "secondary",
					disabled: !isAdmin || test.isPending || !settings.ffmpegAvailable,
					onClick: () => test.mutate(),
					children: test.isPending ? "Testing…" : "Test render"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: "Setup"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-3 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-control bg-secondary-surface/50 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption font-medium text-muted",
								children: "Step 1"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1 text-body font-semibold",
								children: "Transcription"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-caption text-muted",
								children: "Auto-captions use the workspace xAI key (same as Ideation). If STT is off, upload an SRT on a video asset — captions still edit and burn in."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-control bg-secondary-surface/50 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption font-medium text-muted",
								children: "Step 2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1 text-body font-semibold",
								children: "FFmpeg worker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-caption text-muted",
								children: "Health is probed on this host. Test render encodes a 1-second 9:16 clip and queues it in Library → Renders."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-control bg-secondary-surface/50 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption font-medium text-muted",
								children: "Step 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1 text-body font-semibold",
								children: "Daytona (optional)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-caption text-muted",
								children: "Long renders can use a job-scoped sandbox. It never starts on login."
							})
						]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorageCard, {
				configured: settings.s3Configured,
				endpoint: settings.s3Endpoint,
				bucket: settings.s3Bucket,
				isAdmin
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IpfsCard, {
				configured: settings.ipfsConfigured,
				gateway: settings.ipfsGateway,
				lastCid: settings.ipfsLastCid,
				strategy: settings.ipfsStrategy,
				strategyHint: settings.ipfsStrategyHint,
				isAdmin
			})
		]
	});
}
function StorageCard({ configured, endpoint, bucket, isAdmin }) {
	const queryClient = useQueryClient();
	const [fields, setFields] = (0, import_react.useState)({
		endpoint: endpoint ?? "https://s3.filebase.com",
		region: "us-east-1",
		bucket: bucket ?? "",
		accessKey: "",
		secret: ""
	});
	const save = useMutation({
		mutationFn: () => saveS3SettingsFn({ data: fields }),
		onSuccess: async () => {
			toast.success("Object storage saved");
			await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onSave(event) {
		event.preventDefault();
		save.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
					className: "size-5",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: "Clip storage"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Vercel has no durable disk. Use Supabase Storage first (free 1 GB). Optional S3-compatible overflow: Filebase (5 GB free, IPFS-backed) or Storj. The Windows Social Machine’s 50 GB disk is for browser profiles and hot snapshots only."
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: configured ? `S3 connected${bucket ? ` · ${bucket}` : ""}${endpoint ? ` · ${endpoint}` : ""}` : "No S3 credentials — Supabase (if connected) or local preview disk."
		}),
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 grid gap-3 sm:grid-cols-2",
			onSubmit: onSave,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "s3-endpoint",
						children: "S3 endpoint"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "s3-endpoint",
						value: fields.endpoint,
						onChange: (event) => setFields((cur) => ({
							...cur,
							endpoint: event.target.value
						})),
						placeholder: FILEBASE_ENDPOINT
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "s3-bucket",
						children: "Bucket"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "s3-bucket",
						value: fields.bucket,
						onChange: (event) => setFields((cur) => ({
							...cur,
							bucket: event.target.value
						})),
						placeholder: "clippy-clips"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "s3-region",
						children: "Region"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "s3-region",
						value: fields.region,
						onChange: (event) => setFields((cur) => ({
							...cur,
							region: event.target.value
						})),
						placeholder: "us-east-1"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "s3-key",
						children: "Access key"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "s3-key",
						value: fields.accessKey,
						onChange: (event) => setFields((cur) => ({
							...cur,
							accessKey: event.target.value
						})),
						placeholder: configured ? "•••• stored" : "Access key"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "s3-secret",
						children: "Secret"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "s3-secret",
						type: "password",
						value: fields.secret,
						onChange: (event) => setFields((cur) => ({
							...cur,
							secret: event.target.value
						})),
						placeholder: configured ? "•••• stored" : "Secret"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						disabled: save.isPending,
						children: save.isPending ? "Saving…" : "Save object storage"
					})
				})
			]
		}) : null
	] });
}
function IpfsCard({ configured, gateway, lastCid, strategy, strategyHint, isAdmin }) {
	const queryClient = useQueryClient();
	const [fields, setFields] = (0, import_react.useState)({
		pinataJwt: "",
		gateway: gateway ?? "https://ipfs.filebase.io/ipfs/",
		strategy
	});
	const save = useMutation({
		mutationFn: () => saveIpfsSettingsFn({ data: fields }),
		onSuccess: async () => {
			toast.success("Pinning strategy saved");
			await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onSave(event) {
		event.preventDefault();
		save.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
					className: "size-5",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: "Content pinning"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Optional pin onto the content network after a clip lands in immutable cloud storage. Never the write backend. Never the Social Machine disk."
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-caption text-muted",
			children: configured ? `${strategyHint}${lastCid ? ` Last pin ${lastCid.slice(0, 12)}…` : ""}` : strategyHint
		}),
		isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 grid gap-3 sm:grid-cols-2",
			onSubmit: onSave,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "ipfs-jwt",
						children: "Pinning token"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "ipfs-jwt",
						type: "password",
						value: fields.pinataJwt,
						onChange: (event) => setFields((cur) => ({
							...cur,
							pinataJwt: event.target.value
						})),
						placeholder: configured ? "•••• stored" : "JWT"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "ipfs-gw",
						children: "Gateway"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "ipfs-gw",
						value: fields.gateway,
						onChange: (event) => setFields((cur) => ({
							...cur,
							gateway: event.target.value
						})),
						placeholder: DEFAULT_IPFS_GATEWAY
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "ipfs-strategy",
						children: "Pinning strategy"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: fields.strategy,
						onValueChange: (value) => setFields((cur) => ({
							...cur,
							strategy: value
						})),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "ipfs-strategy",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "eager",
								children: "Eager — pin every new clip"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "on_publish",
								children: "On publish — pin when it goes public"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "replicate",
								children: "Replicate — pin and keep object storage"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "manual",
								children: "Manual — pin only when asked"
							})
						] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						disabled: save.isPending,
						children: save.isPending ? "Saving…" : "Save pinning"
					})
				})
			]
		}) : null
	] });
}
function PortalPanel() {
	const queryClient = useQueryClient();
	const inbox = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox()
	});
	const settings = useQuery({
		queryKey: PORTAL_SETTINGS_KEY,
		queryFn: () => getPortalSettingsFn()
	});
	const [enabled, setEnabled] = (0, import_react.useState)(true);
	const [allowDownload, setAllowDownload] = (0, import_react.useState)(false);
	const [showMetrics, setShowMetrics] = (0, import_react.useState)(false);
	const [approvalsEnabled, setApprovalsEnabled] = (0, import_react.useState)(true);
	const [agencyName, setAgencyName] = (0, import_react.useState)(DEFAULT_PORTAL_SETTINGS.agencyName);
	const [logoUrl, setLogoUrl] = (0, import_react.useState)("");
	const [welcomeBlurb, setWelcomeBlurb] = (0, import_react.useState)(DEFAULT_PORTAL_SETTINGS.welcomeBlurb);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!settings.data || hydrated) return;
		setEnabled(settings.data.enabled);
		setAllowDownload(settings.data.allowDownload);
		setShowMetrics(settings.data.showMetrics);
		setApprovalsEnabled(settings.data.approvalsEnabled);
		setAgencyName(settings.data.agencyName);
		setLogoUrl(settings.data.logoUrl ?? "");
		setWelcomeBlurb(settings.data.welcomeBlurb);
		setHydrated(true);
	}, [settings.data, hydrated]);
	const save = useMutation({
		mutationFn: () => savePortalSettingsFn({ data: {
			enabled,
			allowDownload,
			showMetrics,
			approvalsEnabled,
			agencyName,
			logoUrl: logoUrl.trim() || null,
			welcomeBlurb
		} }),
		onSuccess: async () => {
			toast.success("Portal settings saved");
			await queryClient.invalidateQueries({ queryKey: PORTAL_SETTINGS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const isAdmin = inbox.data?.role === "admin";
	if (settings.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full max-w-3xl" });
	if (settings.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		className: "max-w-3xl",
		title: "Couldn’t load portal settings",
		onRetry: () => void settings.refetch()
	});
	function onSubmit(event) {
		event.preventDefault();
		save.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "portal",
		className: "scroll-mt-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Client portal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "A separate, mobile-first login for brand stakeholders. Isolated from staff sessions. Invite people from each client page."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 flex flex-col gap-5",
				onSubmit,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-body",
							children: "Enable portal"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: enabled,
							onCheckedChange: setEnabled,
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-body",
							children: "Allow downloads of ready assets"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: allowDownload,
							onCheckedChange: setAllowDownload,
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-body",
							children: "Show high-level view counts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: showMetrics,
							onCheckedChange: setShowMetrics,
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-body",
							children: "Let portal users approve publishes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: approvalsEnabled,
							onCheckedChange: setApprovalsEnabled,
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "portal-agency-name",
							children: "Agency display name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "portal-agency-name",
							value: agencyName,
							onChange: (e) => setAgencyName(e.target.value),
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "portal-logo",
							children: "Logo URL"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "portal-logo",
							value: logoUrl,
							onChange: (e) => setLogoUrl(e.target.value),
							placeholder: "https://…",
							disabled: !isAdmin
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "portal-welcome",
							children: "Welcome blurb"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "portal-welcome",
							value: welcomeBlurb,
							onChange: (e) => setWelcomeBlurb(e.target.value),
							rows: 3,
							disabled: !isAdmin
						})]
					}),
					isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: save.isPending,
						children: save.isPending ? "Saving…" : "Save portal settings"
					}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Only owners can change portal policy."
					})
				]
			})]
		})
	});
}
function SettingsPage() {
	const { user } = useCurrentUserState();
	const statusQuery = useQuery({
		queryKey: ["supabase-status"],
		queryFn: () => getSupabaseStatus()
	});
	(0, import_react.useEffect)(() => {
		function scrollToHash() {
			if (typeof window === "undefined") return;
			const id = window.location.hash.replace(/^#/, "");
			if (!id) return;
			document.getElementById(id)?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}
		scrollToHash();
		window.addEventListener("hashchange", scrollToHash);
		return () => window.removeEventListener("hashchange", scrollToHash);
	}, [statusQuery.data]);
	if (statusQuery.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSkeleton, {});
	if (statusQuery.isError || !statusQuery.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-8 max-w-3xl",
			title: "Could not reach workspace data",
			description: "Sign in again and retry. Your project URL is configured; this check needs an active session.",
			onRetry: () => void statusQuery.refetch()
		})]
	});
	const status = statusQuery.data;
	const connected = status.authHealth && status.jwksHealth;
	const readyCount = status.tables.filter((table) => table.exists).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "llm",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LlmProvidersPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "addons-registry",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddonsPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "skills",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillsPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "integrations",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntegrationsPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "publishers",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialPublishersPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "linear",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "media",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaPipelinePanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutomationPanel, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafetyPanel, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalPanel, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "team",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamAccessPanel, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex max-w-3xl flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
											className: "size-5",
											"aria-hidden": "true"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-card font-semibold tracking-tight",
										children: "Supabase project"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-caption text-muted",
										children: status.projectRef
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: statusTone$1(connected ? "CONNECTED" : "ERROR"),
									children: connected ? "Connected" : "Unreachable"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-5 flex flex-col gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusRow, {
										label: "Auth API",
										ok: status.authHealth,
										detail: "User registration and session service"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusRow, {
										label: "Signing keys",
										ok: status.jwksHealth,
										detail: "JWT verification endpoint"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusRow, {
										label: "Admin API key",
										ok: status.adminConfigured,
										detail: status.adminConfigured ? "Server can write agency data and bypass row-level security" : "Not set on this host — apply schema from the SQL editor"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
												className: "size-5",
												"aria-hidden": "true"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-card font-semibold tracking-tight",
											children: "Workspace tables"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-caption text-muted",
											children: [
												readyCount,
												" of ",
												status.tables.length,
												" ready"
											]
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: statusTone$1(status.schemaReady ? "CONNECTED" : "PENDING"),
										children: status.schemaReady ? "Ready" : "Needs schema"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-body text-muted",
									children: status.schemaReady ? "Agency tables are live in your project. Row-level security keeps the public key from reading fees or payments." : "Tables are not created yet. Copy the schema and run it in the Supabase SQL editor (SQL → New query)."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2",
									children: status.tables.map((table) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 rounded-control bg-secondary-surface/60 px-3 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-caption",
											children: table.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-caption", table.exists ? "text-success" : "text-muted"),
											children: table.exists ? "Ready" : "Missing"
										})]
									}, table.name))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SchemaCopy, { sql: status.schemaSql })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
											className: "size-5",
											"aria-hidden": "true"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-card font-semibold tracking-tight",
										children: "Sign-in"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-caption text-muted",
										children: "How operators enter this workspace"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-5 flex flex-col gap-3 text-body",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex flex-col gap-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: "Google and X"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-caption text-muted",
												children: "Workspace login for this app. Required in the live preview."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex flex-col gap-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: "Email and password"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-caption text-muted",
												children: "Creates a workspace session and also registers the account with your Supabase Auth project when reachable."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex flex-col gap-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: "Super Admin Access"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-caption text-muted",
												children: "Password on the login screen, set under Team access. Hashed in AppSetting — never hard-coded."
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-5" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [status.adminConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "mt-0.5 size-4 text-success",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {
										className: "mt-0.5 size-4 text-muted",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-caption text-muted",
										children: [
											"Signed in as ",
											user?.primaryEmail ?? user?.displayName ?? user?.id ?? "operator",
											status.operatorRole ? ` · ${status.operatorRole}` : "",
											". Data writes go through server functions after this session is verified."
										]
									})]
								})
							] })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiTrainingSection, {})
		]
	});
}
function Header() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Settings",
		description: "Add-ons, Skills, LLM Providers, Hermes Connect, and workspace data. Keys stay on the server with admin-only field security."
	});
}
function StatusRow({ label, ok, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-body font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-caption text-muted",
			children: detail
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			tone: statusTone$1(ok ? "CONNECTED" : "PENDING"),
			children: ok ? "On" : "Off"
		})]
	});
}
function SchemaCopy({ sql }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const areaRef = (0, import_react.useRef)(null);
	const ready = sql.trim().length > 0;
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const handle = window.setTimeout(() => {
			const field = areaRef.current;
			if (!field) return;
			field.focus();
			field.select();
		}, 50);
		return () => window.clearTimeout(handle);
	}, [open]);
	async function copy() {
		if (!ready) {
			toast.error("Schema SQL isn’t available yet. Retry in a moment.");
			return;
		}
		if (await copyTextToClipboard(sql)) {
			setCopied(true);
			toast.success("Schema SQL copied");
			window.setTimeout(() => setCopied(false), 2e3);
			return;
		}
		captureClientError(/* @__PURE__ */ new Error("clipboard-blocked"), { source: "copy-schema" });
		setOpen(true);
		toast.message("Clipboard is blocked here. Select the SQL below, or download the file.");
	}
	function download() {
		if (!ready) {
			toast.error("Schema SQL isn’t available yet. Retry in a moment.");
			return;
		}
		if (downloadTextFile("agency-admin-schema.sql", sql)) {
			toast.success("Download started");
			return;
		}
		setOpen(true);
		toast.message("Download was blocked. Select the SQL below and copy it.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				onClick: () => void copy(),
				className: "min-h-11",
				disabled: !ready,
				children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "size-4",
					"aria-hidden": "true"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
					className: "size-4",
					"aria-hidden": "true"
				}), copied ? "Copied" : "Copy schema SQL"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				onClick: download,
				className: "min-h-11",
				disabled: !ready,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
					className: "size-4",
					"aria-hidden": "true"
				}), "Download .sql"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/api/agency-schema",
				download: "agency-admin-schema.sql",
				className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-transparent px-4 text-body font-medium text-fg hover:bg-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
				children: "Open as file"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(true),
				className: "min-h-11",
				disabled: !ready,
				children: "View SQL"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "w-[min(100%-2rem,48rem)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Workspace schema" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Paste this into the Supabase SQL editor (SQL → New query) and run it. Safe to re-run. Select all, then copy if the clipboard button is blocked." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							ref: areaRef,
							readOnly: true,
							value: sql,
							spellCheck: false,
							className: "mt-4 min-h-64 font-mono text-caption",
							"aria-label": "Workspace schema SQL",
							onFocus: (event) => event.currentTarget.select()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									onClick: () => {
										areaRef.current?.focus();
										areaRef.current?.select();
									},
									children: "Select all"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => void copy(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Copy"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: download,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Download"]
								})
							]
						})
					]
				})
			})
		]
	});
}
function SettingsSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-body text-muted",
				children: "Checking your project…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex max-w-3xl flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 w-full rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full rounded-card" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-48 rounded-control" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-4 w-96 max-w-full rounded-control" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-96 w-full rounded-card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-96 w-full rounded-card" })]
					})
				]
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
