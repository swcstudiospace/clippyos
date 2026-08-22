import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as clientTrainingQueryKey, E as formatVideoDuration } from "./mappers-Bmic_hyw.mjs";
import { a as formatDate, c as formatUsd, r as formatCompactCount, s as formatRelativeTime, u as initials } from "./format-DaT2NYM9.mjs";
import { c as AUDIT_QUERY_KEY, m as SAFETY_INBOX_QUERY_KEY, o as AUDIT_ACTOR_LABELS, t as APPROVALS_QUERY_KEY } from "./safety-CI611PZC.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime, n as Root, r as Trigger, t as Content } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as listApprovalsFn, o as listAuditEventsFn, r as getSafetyInbox } from "./safety-fns-0YjGOs0I.mjs";
import { _ as PLAN_TONES, g as PLAN_LABELS, h as PAYMENT_TYPE_LABELS, m as PAYMENT_STATUS_LABELS, v as ROLE_LABELS, w as STATUS_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { g as setClientStage, i as getClientBundle, p as refreshClientAnalysis, r as getAiStatus, u as markPaymentPaid, v as updateClientNotes } from "./clients-CmcyBPZd.mjs";
import { a as listClientTraining, n as generateSuggestedTitles, o as sendClientTraining, t as generateSuggestedIdeas } from "./client-tools-Ct5oM3yi.mjs";
import { x as formatDurationSec } from "./library-D-Mt5rXw.mjs";
import { Et as Check, It as ArrowLeft, L as Pencil, S as Shield, Tt as ChevronDown, X as Link2, Z as Lightbulb, _t as Copy, j as RefreshCw, l as UserPlus, lt as Eye, p as Type, ut as ExternalLink } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, n as Route$11, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as copyTextToClipboard } from "./clipboard-Yt4ExP0v.mjs";
import { h as setPortalBearerToken, i as PORTAL_ADMIN_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as AnimatedShinyText } from "./animated-shiny-text-XXcoX7q5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { s as PERFORMANCE_QUERY_KEY } from "./performance-Cj9pmeSi.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as Switch } from "./switch-BBV5HifB.mjs";
import { t as ScoreBadge } from "./score-badge-IJk18-LU.mjs";
import { r as getPerformanceSnapshot } from "./performance-fns-BnwGGujQ.mjs";
import { t as parseStrategy } from "./strategy-yAcUlYNF.mjs";
import { t as ApprovalReview } from "./approval-review-BLKSQwvr.mjs";
import { d as formatCharCount } from "./knowledge-DYmG2i4O.mjs";
import { n as StagePill, t as SourceBadge } from "./stage-pill-D4JnG28X.mjs";
import { t as PipelineTracker } from "./pipeline-tracker-sk9R9pKX.mjs";
import { t as ClientFormModal } from "./client-form-modal-CRdMPNqb.mjs";
import { n as SafeMarkdown, t as ChatInput } from "./markdown-BvUKUwQu.mjs";
import { t as ClientOnboardingChecklistCard } from "./client-checklist-giEw1nhx.mjs";
import { p as listLibraryAssetsFn } from "./library-fns-D3lY4Qo9.mjs";
import { a as revokePortalUserFn, c as setPortalCanApproveFn, i as listPortalUsersFn, l as startPortalPreviewFn, r as invitePortalUserFn, s as savePortalWorkingOnFn, t as KnowledgeProposalsInbox } from "./portal-admin-fns-BtapzDNa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients._clientId-BAhHzis5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StrategyBullet({ title, reasoning }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const expandable = Boolean(reasoning);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		open,
		onOpenChange: setOpen,
		disabled: !expandable,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-control bg-secondary-surface/50 px-3 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
				asChild: true,
				disabled: !expandable,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cn("flex w-full items-start gap-2 text-left", expandable ? "min-h-11" : "cursor-default"),
					"aria-expanded": expandable ? open : void 0,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 size-1.5 shrink-0 rounded-full bg-accent",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 text-body",
							children: title
						}),
						expandable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							className: cn("mt-1 size-4 shrink-0 text-muted transition-transform duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", open && "rotate-180"),
							"aria-hidden": "true"
						}) : null
					]
				})
			}), expandable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
				className: "overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 pr-6 pb-1 pl-3.5 text-caption text-muted",
					children: reasoning
				})
			}) : null]
		})
	});
}
function CollapsedPaste({ text }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	if (text.length <= 900) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "whitespace-pre-wrap",
		children: text
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "whitespace-pre-wrap",
		children: open ? text : `${text.slice(0, 480).trim()}…`
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "mt-1 min-h-11 text-caption text-accent hover:underline",
		onClick: () => setOpen((value) => !value),
		children: open ? "Show less" : `Show full paste (${formatCharCount(text.length)})`
	})] });
}
function ClientTrainingBox({ scope, clientId, label, placeholder, disabled }) {
	const queryClient = useQueryClient();
	const endRef = (0, import_react.useRef)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const listQuery = useQuery({
		queryKey: clientTrainingQueryKey(scope, clientId),
		queryFn: () => listClientTraining({ data: {
			scope,
			clientId
		} })
	});
	const send = useMutation({
		mutationFn: (content) => sendClientTraining({ data: {
			scope,
			clientId,
			content
		} }),
		onMutate: () => setDraft(""),
		onSuccess: (entry) => {
			queryClient.setQueryData(clientTrainingQueryKey(scope, clientId), (current) => [...current ?? [], entry]);
		},
		onError: (error, content) => {
			setDraft((current) => current.trim() ? current : content);
			captureClientError(error, { source: "client-training" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const entries = (listQuery.data ?? []).slice(-6);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [entries.length, send.isPending]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 min-w-0 overflow-x-hidden rounded-control border border-border bg-secondary-surface/40 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto",
				children: [
					listQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Loading notes…"
					}) : entries.length === 0 && !send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Critique a title, paste a preferred example, or add a principle. Stored for this client only."
					}) : entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "self-end max-w-[90%] rounded-control bg-accent/15 px-3 py-2 text-caption",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsedPaste, { text: entry.userInput })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "self-start max-w-[90%] rounded-control bg-elevated px-3 py-2 text-caption",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeMarkdown, { content: entry.learnedPrinciple })
						})]
					}, entry.id)),
					send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						"aria-live": "polite",
						children: "Extracting principle…"
					}) : null,
					send.isError && !send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption",
						children: "Nothing was stored."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						className: "mt-1",
						onClick: () => {
							if (draft.trim()) send.mutate(draft);
						},
						children: "Retry"
					})] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatInput, {
					value: draft,
					onChange: setDraft,
					onSend: () => {
						const content = draft.trim();
						if (!content || disabled || send.isPending) return;
						send.mutate(content);
					},
					disabled: disabled || send.isPending,
					sending: send.isPending,
					placeholder,
					inputId: `client-train-${scope}-${clientId}`,
					maxLength: null,
					maxGrowPx: 96
				})
			})
		]
	});
}
function CopyTitle({ text }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-start justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "min-w-0 flex-1 text-body",
			children: text
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "ghost",
			size: "icon",
			className: "size-11 shrink-0",
			"aria-label": copied ? `Copied “${text}”` : `Copy “${text}”`,
			onClick: async () => {
				if (await copyTextToClipboard(text)) {
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1500);
				} else toast.message("Select the title and copy it.");
			},
			children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
				className: "size-4",
				"aria-hidden": "true"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
				className: "size-4",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: copied ? "Copied" : "Copy"
			})]
		})]
	});
}
function TitleGroup({ group }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-control border border-border/70 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-3",
			children: [group.originalThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: group.originalThumbnail,
				alt: "",
				className: "size-16 shrink-0 rounded-control object-cover"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: group.originalUrl,
					target: "_blank",
					rel: "noreferrer",
					className: "text-body font-medium hover:text-accent",
					children: group.originalTitle
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-caption text-muted",
					children: [formatVideoDuration(group.durationSeconds), group.publishedAt ? ` · ${formatRelativeTime(group.publishedAt)}` : ""]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 flex flex-col gap-1.5",
			children: group.alternatives.map((title) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyTitle, { text: title }, title))
		})]
	});
}
function IdeaRow({ idea }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-control border border-border/70 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body font-medium",
				children: idea.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "size-11 shrink-0",
				"aria-label": copied ? `Copied “${idea.title}”` : `Copy “${idea.title}”`,
				onClick: async () => {
					if (await copyTextToClipboard(idea.title)) {
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1500);
					} else toast.message("Select the title and copy it.");
				},
				children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "size-4",
					"aria-hidden": "true"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
					className: "size-4",
					"aria-hidden": "true"
				})
			})]
		}), idea.rationale ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: idea.rationale
		}) : null]
	});
}
function ToolSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-col gap-3",
		"aria-busy": "true",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Generating…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-2/3" })
		]
	});
}
function patchClientBundle(current, patch) {
	if (!current) return current;
	return {
		...current,
		client: {
			...current.client,
			...patch
		}
	};
}
function SuggestedTools({ client, llmReady }) {
	const queryClient = useQueryClient();
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const hasChannel = Boolean(client.channelUrl);
	const titlesMut = useMutation({
		mutationFn: () => generateSuggestedTitles({ data: { clientId: client.id } }),
		onSuccess: async (payload) => {
			toast.success("Titles updated");
			const apply = (current) => patchClientBundle(current, {
				suggestedTitles: payload,
				suggestedTitlesAt: payload.generatedAt
			});
			queryClient.setQueryData(["client", client.id], apply);
			await queryClient.invalidateQueries({ queryKey: ["client", client.id] });
			queryClient.setQueryData(["client", client.id], (current) => current?.client.suggestedTitles ? current : apply(current));
		},
		onError: (error) => {
			captureClientError(error, { source: "suggest-titles" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const ideasMut = useMutation({
		mutationFn: () => generateSuggestedIdeas({ data: { clientId: client.id } }),
		onSuccess: async (payload) => {
			toast.success("Ideas updated");
			const apply = (current) => patchClientBundle(current, {
				suggestedIdeas: payload,
				suggestedIdeasAt: payload.generatedAt
			});
			queryClient.setQueryData(["client", client.id], apply);
			await queryClient.invalidateQueries({ queryKey: ["client", client.id] });
			queryClient.setQueryData(["client", client.id], (current) => current?.client.suggestedIdeas ? current : apply(current));
		},
		onError: (error) => {
			captureClientError(error, { source: "suggest-ideas" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	function requestTitles() {
		if (!llmReady) {
			toast.message("Connect AI to generate titles.");
			return;
		}
		if (!hasChannel) {
			toast.message("Add a YouTube channel URL before generating titles.");
			return;
		}
		if (client.suggestedTitles) {
			setConfirm("titles");
			return;
		}
		titlesMut.mutate();
	}
	function requestIdeas() {
		if (!llmReady) {
			toast.message("Connect AI to generate ideas.");
			return;
		}
		if (client.suggestedIdeas) {
			setConfirm("ideas");
			return;
		}
		ideasMut.mutate();
	}
	const titles = titlesMut.data ?? client.suggestedTitles;
	const ideas = ideasMut.data ?? client.suggestedIdeas;
	const titlesBusy = titlesMut.isPending;
	const ideasBusy = ideasMut.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
			title: "Suggested Titles",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "min-w-0 overflow-x-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Suggested Titles"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-caption text-muted",
								children: [titles ? `Last generated ${formatRelativeTime(client.suggestedTitlesAt ?? titles.generatedAt)}` : "Never generated", titles ? ` · ${titles.longFormCount} long-form video${titles.longFormCount === 1 ? "" : "s"}` : ""]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							disabled: titlesBusy || !llmReady || !hasChannel,
							onClick: requestTitles,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								className: `size-4 ${titlesBusy ? "animate-spin" : ""}`,
								"aria-hidden": "true"
							}), titlesBusy ? "Generating…" : titles ? "Regenerate" : "Generate Titles"]
						})]
					}),
					!llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, { title: "Title generation and title training will be available once analysis is connected" })
					}) : null,
					titlesMut.isError && !titlesBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t generate titles",
							description: "Previous results are unchanged. Retry when you’re ready.",
							onRetry: () => titlesMut.mutate()
						})
					}) : null,
					titlesBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolSkeleton, {}) : titles && titles.groups.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-col gap-3",
						children: titles.groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleGroup, { group }, group.originalVideoId))
					}) : titles && titles.groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-body text-muted",
						children: "No long-form videos (4 minutes or longer) were found on this channel."
					}) : !titlesMut.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body text-muted",
							children: "Generate 3 alternative titles for each of the last 5 long-form uploads (4 minutes or longer). Results stay until you regenerate."
						}), !hasChannel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: "Add a YouTube channel URL in Edit first."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							disabled: !llmReady,
							onClick: requestTitles,
							children: "Generate Titles"
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientTrainingBox, {
						scope: "CLIENT_TITLES",
						clientId: client.id,
						label: "Train titles for this client",
						placeholder: "Critique a title or paste a preferred example…",
						disabled: !llmReady || titlesBusy
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
			title: "Suggested Ideas",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "min-w-0 overflow-x-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Suggested Ideas"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: ideas ? `Last generated ${formatRelativeTime(client.suggestedIdeasAt ?? ideas.generatedAt)}` : "Never generated"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							disabled: ideasBusy || !llmReady,
							onClick: requestIdeas,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								className: `size-4 ${ideasBusy ? "animate-spin" : ""}`,
								"aria-hidden": "true"
							}), ideasBusy ? "Generating…" : ideas ? "Regenerate" : "Generate Ideas"]
						})]
					}),
					!llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, { title: "Idea generation and idea training will be available once analysis is connected" })
					}) : null,
					ideasMut.isError && !ideasBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t generate ideas",
							description: "Previous results are unchanged. Retry when you’re ready.",
							onRetry: () => ideasMut.mutate()
						})
					}) : null,
					ideasBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolSkeleton, {}) : ideas && ideas.ideas.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 flex flex-col gap-2",
						children: ideas.ideas.map((idea) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IdeaRow, { idea }, idea.title))
					}) : !ideasMut.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body text-muted",
							children: "Generate fresh long-form ideas tailored to this client. They stay until you regenerate."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							disabled: !llmReady,
							onClick: requestIdeas,
							children: "Generate Ideas"
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientTrainingBox, {
						scope: "CLIENT_IDEAS",
						clientId: client.id,
						label: "Train ideas for this client",
						placeholder: "Add an angle, example, or critique…",
						disabled: !llmReady || ideasBusy
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: Boolean(confirm),
			onOpenChange: (open) => !open && setConfirm(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: confirm === "titles" ? "Replace suggested titles?" : "Replace suggested ideas?" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "This overwrites the stored set with a new generation using the latest long-form uploads and this client’s training notes. The previous set is not kept." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setConfirm(null),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							const which = confirm;
							setConfirm(null);
							if (which === "titles") titlesMut.mutate();
							if (which === "ideas") ideasMut.mutate();
						},
						children: "Regenerate"
					})]
				})
			] })
		})
	] });
}
function PortalAccessPanel({ clientId }) {
	const queryClient = useQueryClient();
	const [email, setEmail] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [canApprove, setCanApprove] = (0, import_react.useState)(true);
	const [inviteUrl, setInviteUrl] = (0, import_react.useState)(null);
	const [workingOn, setWorkingOn] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: [...PORTAL_ADMIN_KEY, clientId],
		queryFn: () => listPortalUsersFn({ data: { clientId } })
	});
	const users = query.data?.users ?? [];
	const savedNote = query.data?.workingOn ?? "";
	const invite = useMutation({
		mutationFn: () => invitePortalUserFn({ data: {
			clientId,
			email: email.trim(),
			name: name.trim() || void 0,
			canApprove
		} }),
		onSuccess: async (data) => {
			setInviteUrl(data.inviteUrl);
			setEmail("");
			setName("");
			toast.success("Invite ready — copy the portal link");
			await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const revoke = useMutation({
		mutationFn: (id) => revokePortalUserFn({ data: { id } }),
		onSuccess: async () => {
			toast.success("Access revoked");
			await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const toggleApprove = useMutation({
		mutationFn: (input) => setPortalCanApproveFn({ data: input }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: [...PORTAL_ADMIN_KEY, clientId] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveNote = useMutation({
		mutationFn: () => savePortalWorkingOnFn({ data: {
			clientId,
			note: (workingOn ?? savedNote).trim() || null
		} }),
		onSuccess: () => toast.success("Client-visible note saved"),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const preview = useMutation({
		mutationFn: () => startPortalPreviewFn({ data: { clientId } }),
		onSuccess: (data) => {
			setPortalBearerToken(data.token);
			window.open("/portal/home", "_blank", "noopener,noreferrer");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function onInvite(event) {
		event.preventDefault();
		invite.mutate();
	}
	const portalLink = typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "/portal/login";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "Portal access"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Brand stakeholders land on /portal only. They never see Money, Settings, or other clients."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: async () => {
						const ok = await copyTextToClipboard(portalLink);
						toast.success(ok ? "Portal link copied" : "Copy the URL from the address bar");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "Copy portal link"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: () => preview.mutate(),
					disabled: preview.isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), "View as client"]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2",
			onSubmit: onInvite,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "portal-invite-email",
						children: "Invite email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "portal-invite-email",
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						required: true,
						placeholder: "brand@studio.com"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "portal-invite-name",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "portal-invite-name",
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Optional"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex min-h-11 items-center gap-3 text-caption",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: canApprove,
						onCheckedChange: setCanApprove
					}), "Can approve publishes"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: invite.isPending,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), invite.isPending ? "Inviting…" : "Send invite"]
					})
				})
			]
		}),
		inviteUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-2 rounded-control bg-secondary-surface/60 p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Magic invite link — they set a password on first open."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "min-w-0 flex-1 truncate text-caption",
					children: inviteUrl
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: async () => {
						const ok = await copyTextToClipboard(inviteUrl);
						toast.success(ok ? "Invite copied" : inviteUrl);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Copy"]
				})]
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "portal-working-on",
					children: "What we’re working on"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "portal-working-on",
					value: workingOn ?? savedNote,
					onChange: (e) => setWorkingOn(e.target.value),
					placeholder: "Client-visible one-liner. Internal notes stay on the client record.",
					rows: 2
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => saveNote.mutate(),
					disabled: saveNote.isPending,
					children: "Save note"
				}) })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No portal users yet",
				description: "Invite the brand owner by email. They only ever see this client."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-body font-medium",
							children: user.name || user.email
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-caption text-muted",
							children: [user.email, user.lastLoginAt ? ` · last in ${formatRelativeTime(user.lastLoginAt)}` : ""]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(user.status === "ACTIVE" ? "ACTIVE" : user.status === "INVITED" ? "PENDING" : "ERROR"),
							children: user.status === "INVITED" ? "Invited" : user.status === "ACTIVE" ? "Active" : "Revoked"
						}), user.status !== "REVOKED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-caption text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: user.canApprove,
									onCheckedChange: (next) => {
										if (typeof next === "boolean") toggleApprove.mutate({
											id: user.id,
											canApprove: next
										});
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
									className: "size-3.5",
									"aria-hidden": "true"
								}),
								"Approve"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							disabled: revoke.isPending,
							onClick: () => revoke.mutate(user.id),
							children: "Revoke"
						})] }) : null]
					})]
				}, user.id))
			})
		})
	] });
}
function ClientDetailPage() {
	const { clientId } = Route$11.useParams();
	const queryClient = useQueryClient();
	const bundleQuery = useQuery({
		queryKey: ["client", clientId],
		queryFn: () => getClientBundle({ data: clientId })
	});
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const assetsQuery = useQuery({
		queryKey: ["library-assets", clientId],
		queryFn: () => listLibraryAssetsFn({ data: {
			clientId,
			status: "READY"
		} })
	});
	const performanceQuery = useQuery({
		queryKey: [...PERFORMANCE_QUERY_KEY, clientId],
		queryFn: () => getPerformanceSnapshot()
	});
	const pendingApprovals = useQuery({
		queryKey: [...APPROVALS_QUERY_KEY, clientId],
		queryFn: () => listApprovalsFn({ data: {
			status: "PENDING",
			clientId
		} })
	});
	const inbox = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox()
	});
	const activity = useQuery({
		queryKey: [...AUDIT_QUERY_KEY, clientId],
		queryFn: () => listAuditEventsFn({ data: { clientId } }),
		enabled: inbox.data?.role === "admin"
	});
	const [editOpen, setEditOpen] = (0, import_react.useState)(false);
	const [pendingStage, setPendingStage] = (0, import_react.useState)(null);
	const [notes, setNotes] = (0, import_react.useState)("");
	const bundle = bundleQuery.data ?? null;
	(0, import_react.useEffect)(() => {
		setNotes(bundle?.client.notes ?? "");
	}, [bundle?.client.notes]);
	const refresh = useMutation({
		mutationFn: () => refreshClientAnalysis({ data: clientId }),
		onSuccess: async () => {
			toast.success("Analysis refreshed from latest uploads");
			await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			captureClientError(error, { source: "refresh-analysis" });
			const message = error instanceof Error && error.message === "AI_UNAVAILABLE" ? "Analysis isn’t available right now." : error instanceof Error && error.message === "AI_RATE_LIMIT" ? "The analysis service is busy. Retry in a moment." : userFacingErrorMessage(error);
			toast.error(message);
		}
	});
	const stageMut = useMutation({
		mutationFn: (stage) => setClientStage({ data: {
			clientId,
			stage,
			notes: null
		} }),
		onSuccess: async () => {
			setPendingStage(null);
			toast.success("Pipeline updated");
			await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			captureClientError(error, { source: "set-stage" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const notesMut = useMutation({
		mutationFn: (value) => updateClientNotes({ data: {
			id: clientId,
			notes: value
		} }),
		onSuccess: () => toast.success("Notes saved"),
		onError: (error) => {
			captureClientError(error, { source: "save-notes" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const paidMut = useMutation({
		mutationFn: (id) => markPaymentPaid({ data: id }),
		onSuccess: async () => {
			toast.success("Marked paid");
			await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
			await queryClient.invalidateQueries({ queryKey: ["money"] });
		},
		onError: (error) => {
			captureClientError(error, { source: "mark-paid" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	if (bundleQuery.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailSkeleton, {});
	if (bundleQuery.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load this client",
		onRetry: () => void bundleQuery.refetch()
	});
	if (!bundle) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "Client not found",
		description: "It may have been removed or the link is outdated.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ButtonLink, {})
	});
	const { client } = bundle;
	const strategy = parseStrategy(client.contentStrategy);
	const aiReady = aiQuery.data?.llm ?? false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/clients",
						className: "inline-flex min-h-11 items-center gap-2 text-caption text-muted hover:text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Clients"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-page font-semibold tracking-tight",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedShinyText, { children: client.name })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(client.status),
							children: STATUS_LABELS[client.status]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						disabled: refresh.isPending || !client.channelUrl,
						onClick: () => {
							if (!aiReady) {
								toast.message("Connect AI to refresh analysis");
								return;
							}
							refresh.mutate();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
							className: `size-4 ${refresh.isPending ? "animate-spin" : ""}`,
							"aria-hidden": "true"
						}), refresh.isPending ? "Refreshing…" : "Refresh Analysis"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => setEditOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Edit"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionBoundary, {
						title: "Overview",
						children: [pendingApprovals.data?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 flex flex-col gap-2",
							children: pendingApprovals.data.items.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApprovalReview, {
								request: row,
								canDecide: inbox.data?.role === "admin",
								compact: true
							}, row.id))
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4 sm:flex-row",
							children: [client.channelThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: client.channelThumbnail,
								alt: "",
								className: "size-24 rounded-control object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-24 place-items-center rounded-control bg-secondary-surface text-section font-semibold",
								children: initials(client.name)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												tone: PLAN_TONES[client.planType],
												children: [PLAN_LABELS[client.planType], client.customPlanLabel ? ` · ${client.customPlanLabel}` : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-body",
												children: [formatUsd(client.monthlyFee), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1 text-caption text-muted",
													children: "/ mo"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-caption text-muted",
												children: ["Setup ", formatUsd(client.setupFee)]
											})
										]
									}),
									client.channelUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: client.channelUrl,
										target: "_blank",
										rel: "noreferrer",
										className: "mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-accent",
										children: [client.channelUrl, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
											className: "size-3.5",
											"aria-hidden": "true"
										})]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-caption text-muted",
										children: "Uploads go to the connected workspace YouTube publish channel (v1). Per-client OAuth is phase 2."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-body text-muted",
										children: client.channelSummary || "No channel summary yet."
									})
								]
							})]
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Assets",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Library"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/library",
								className: "text-caption text-accent",
								children: "Open library"
							})]
						}), assetsQuery.data?.assets.filter((asset) => asset.kind === "VIDEO" || asset.kind === "IMAGE").length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex gap-3 overflow-x-auto pb-1",
							children: assetsQuery.data.assets.filter((asset) => asset.kind === "VIDEO" || asset.kind === "IMAGE").slice(0, 8).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "w-36 shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/library",
									className: "block overflow-hidden rounded-control bg-secondary-surface",
									children: [
										asset.previewUrl && (asset.kind === "IMAGE" || asset.kind === "VIDEO") ? asset.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: asset.previewUrl,
											alt: "",
											className: "aspect-video w-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
											src: asset.previewUrl,
											muted: true,
											playsInline: true,
											preload: "metadata",
											className: "aspect-video w-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-video" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate px-2 py-1.5 text-caption",
											children: asset.title
										}),
										asset.durationSec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-2 pb-1.5 text-caption text-muted",
											children: formatDurationSec(asset.durationSec)
										}) : null
									]
								})
							}, asset.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-caption text-muted",
							children: "No READY assets yet. Upload from Library or save a Twitch clip."
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionBoundary, {
						title: "Winning assets",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: (() => {
							const pendingCount = (performanceQuery.data?.proposals ?? []).filter((row) => row.status === "PENDING_REVIEW" && row.clientId === clientId).length;
							const winners = (performanceQuery.data?.rollups ?? []).filter((row) => row.clientId === clientId && (row.winnerCount > 0 || (row.score ?? 0) >= 70)).slice(0, 6);
							const assets = assetsQuery.data?.assets ?? [];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-3 text-caption text-muted",
								children: [
									pendingCount,
									" learning proposal",
									pendingCount === 1 ? "" : "s",
									" waiting for review."
								]
							}) : null, !winners.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "Winners appear after published posts have stats. Missing metrics stay unknown."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-col gap-2",
								children: winners.map((row) => {
									const asset = assets.find((item) => item.id === row.assetId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/library",
											className: "min-w-0 text-body hover:underline",
											children: asset?.title ?? "Asset"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [row.viewsTotal != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-caption text-muted",
												children: [formatCompactCount(row.viewsTotal), " views"]
											}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, {
												score: row.score,
												verdict: row.winnerCount > 0 ? "WINNER" : "NEUTRAL"
											})]
										})]
									}, row.assetId);
								})
							})] });
						})() }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KnowledgeProposalsInbox, {
								clientId,
								clientNames: /* @__PURE__ */ new Map([[clientId, client.name]]),
								compact: true
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Strategy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-card font-semibold tracking-tight",
									children: "Strategy"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => setEditOpen(true),
									children: "Edit"
								})]
							}),
							strategy.bullets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-body text-muted",
								children: "No strategy bullets yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 flex flex-col gap-2",
								children: strategy.bullets.map((bullet) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrategyBullet, {
									title: bullet.title,
									reasoning: bullet.reasoning
								}) }, bullet.title))
							}),
							strategy.style || strategy.growth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-caption text-muted",
								children: [
									strategy.style,
									strategy.style && strategy.growth ? " · " : "",
									strategy.growth
								]
							}) : null
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestedTools, {
						client,
						llmReady: aiReady
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Production pipeline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Production pipeline"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-caption text-muted",
								children: [
									"Current stage:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StagePill, { stage: bundle.currentStage }),
									bundle.currentSource ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceBadge, { source: bundle.currentSource })] }) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-caption text-muted",
								children: "Discord Status Agent is read-only and runs automatically about every 30 minutes. It matches Discord server names to client names and updates production stages. Manual updates are kept for two hours."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineTracker, {
									current: bundle.currentStage,
									onSelect: (stage) => setPendingStage(stage)
								})
							})
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Onboarding",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnboardingChecklistCard, {
							clientId: client.id,
							checklist: client.onboardingChecklist
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Portal access",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalAccessPanel, { clientId: client.id })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Team",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: "Team"
						}), bundle.team.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-body text-muted",
							children: "No team members assigned yet."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex flex-col gap-2",
							children: bundle.team.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-body font-medium",
									children: member.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-caption text-muted",
									children: ROLE_LABELS[member.role]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-body",
									children: formatUsd(member.cost)
								})]
							}, member.id))
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Payments",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: "Payments"
						}), bundle.payments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-body text-muted",
							children: "No payments recorded."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex flex-col gap-2",
							children: bundle.payments.map((payment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-wrap items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-body font-medium",
									children: [
										formatUsd(payment.amount),
										" · ",
										PAYMENT_TYPE_LABELS[payment.type]
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-caption text-muted",
									children: ["Due ", formatDate(payment.dueDate)]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: statusTone(payment.status),
										children: PAYMENT_STATUS_LABELS[payment.status]
									}), payment.status !== "PAID" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "secondary",
										disabled: paidMut.isPending,
										onClick: () => paidMut.mutate(payment.id),
										children: "Mark paid"
									}) : null]
								})]
							}, payment.id))
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Performance",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: "Performance"
						}), bundle.analytics ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Views",
									value: bundle.analytics.views
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Subscribers",
									value: bundle.analytics.subscribers
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Watch hours",
									value: bundle.analytics.watchHours
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "CTR",
									value: bundle.analytics.impressionsCtr
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-body text-muted",
							children: "No analytics yet."
						})] })
					}),
					inbox.data?.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Activity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Activity"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-caption text-muted",
								children: "Publishes, payments, and approvals for this client."
							}),
							activity.isFetching && !activity.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-body text-muted",
								children: "Loading activity…"
							}) : (activity.data?.items.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-body text-muted",
								children: "No audit events for this client yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 flex flex-col gap-2",
								children: (activity.data?.items ?? []).slice(0, 12).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-body font-medium",
										children: row.summary
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-caption text-muted",
										children: [
											row.action,
											" · ",
											AUDIT_ACTOR_LABELS[row.actorType],
											" · ",
											formatRelativeTime(row.at)
										]
									})]
								}, row.id))
							})
						] })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Notes",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Notes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "mt-3",
								value: notes,
								onChange: (event) => setNotes(event.target.value),
								"aria-label": "Client notes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-3",
								variant: "secondary",
								disabled: notesMut.isPending,
								onClick: () => notesMut.mutate(notes),
								children: notesMut.isPending ? "Saving…" : "Save notes"
							})
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Refresh analysis",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Refresh analysis"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-body text-muted",
								children: "Always fetches the latest uploads and rewrites the summary, offers, and strategy. Long-form is any video 4 minutes or longer."
							}),
							!aiReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
							}) : null
						] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientFormModal, {
				open: editOpen,
				onOpenChange: setEditOpen,
				client,
				aiReady,
				onSaved: () => {
					queryClient.invalidateQueries({ queryKey: ["client", clientId] });
					queryClient.invalidateQueries({ queryKey: ["clients"] });
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pendingStage),
				onOpenChange: (next) => !next && setPendingStage(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Update production stage?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"This records a manual progress update",
						pendingStage ? ` to ${pendingStage.replaceAll("_", " ").toLowerCase()}` : "",
						". The previous stage stays in the history."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: !pendingStage || stageMut.isPending,
							onClick: () => pendingStage && stageMut.mutate(pendingStage),
							children: "Update stage"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setPendingStage(null),
							children: "Cancel"
						})]
					})
				] })
			})
		]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-control bg-secondary-surface/50 px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-caption text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 text-body font-medium",
			children: value ?? "—"
		})]
	});
}
function ButtonLink() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/clients",
		className: "inline-flex min-h-11 items-center text-caption text-accent",
		children: "Back to clients"
	});
}
function DetailSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-40" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-12 w-72" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 w-full rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full rounded-card" })
				]
			})
		]
	});
}
//#endregion
export { ClientDetailPage as component };
