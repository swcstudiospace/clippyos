import { o as __toESM } from "../_runtime.mjs";
import { Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { c as listClients } from "./clients-CmcyBPZd.mjs";
import { At as Bot, B as PanelLeft, F as Play, y as Square, z as PanelRight } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, D as usePrefersReducedMotion, O as cn, f as Route$40, m as userFacingErrorMessage, w as Button, x as SparklesText } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { c as agentStatusLabel, d as isAgentBusy, i as AGENT_QUERY_KEY, l as agentStatusTone, m as presetCopy, n as AGENT_PRESETS, r as AGENT_PRESET_COPY, s as agentRunQueryKey } from "./agent-BK3m7JzY.mjs";
import { s as LLM_QUERY_KEY } from "./llm-Nttit1BP.mjs";
import { c as listSkillsFn, i as getLlmSnapshot } from "./llm-fns-mh-4gnuG.mjs";
import { t as TypingAnimation } from "./typing-animation-ByKa0Iw8.mjs";
import { t as LinearIssueActions } from "./issue-actions-LfCDQlgU.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent-dlFE4J4Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listAgentRunsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f0e704f0e15911f71899de547f8b035c1195ac38d03394583835daccdcd57744"));
var getAgentRunFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("ea85aa34917a3e967f99c47d77de42f0822348ba11558a0dbee4b72f707cf5e0"));
var startAgentRunFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	goal: string().max(4e3),
	preset: string().min(1),
	clientId: string().nullable().optional(),
	skillId: string().nullable().optional(),
	idempotencyKey: string().max(80).nullable().optional(),
	modelOverride: string().max(80).nullable().optional()
}).parse(input)).handler(createSsrRpc("24f1f64a5ef27f700eff4aea0fa10d297c18273ecde9898006adcc1bd1c85073"));
var cancelAgentRunFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("985414db8ffd3b9ab490df13e88ab680c7e8c5b1ce167fac42442c101d8590e3"));
function AgentTimeline({ detail, rateLimitMessage }) {
	const reduced = usePrefersReducedMotion();
	const running = isAgentBusy(detail.run.status);
	const plan = detail.run.plan ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: presetCopy(detail.run.preset).label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: detail.run.goal
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-caption text-muted",
							children: [
								detail.clientName ?? "No client",
								detail.skillName ? ` · ${detail.skillName}` : "",
								detail.run.provider ? ` · ${detail.run.provider}` : "",
								" · ",
								detail.run.model
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: agentStatusTone(detail.run.status),
						children: agentStatusLabel(detail.run.status)
					})]
				}),
				detail.run.status === "failed" || detail.run.status === "waiting_human" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
						entityType: "AgentRun",
						entityId: detail.run.id,
						title: `[Agent] ${detail.run.status} — ${detail.run.goal.slice(0, 80)}`,
						description: detail.run.goal,
						labels: ["autonomy", detail.run.status === "failed" ? "bug" : "autonomy"],
						compact: true
					})
				}) : null,
				rateLimitMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning",
					role: "status",
					children: rateLimitMessage
				}) : null,
				detail.run.status === "waiting_human" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-caption text-warning",
					children: "Waiting on a human — login wall, CAPTCHA, or skill approval. Open Social if this is a session."
				}) : null,
				detail.run.status === "waiting_resource" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-caption text-warning",
					children: "Waiting on a resource (usually the Social Machine is stopped). Auto-start is off. Start it, then re-run."
				}) : null,
				plan.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-3 grid gap-1 text-caption",
					children: plan.map((step, index) => {
						const done = detail.iterations.some((item) => item.stepId === step.id && item.kind === "tool" && item.status === "ok");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("tabular-nums text-muted", done && "text-success"),
								children: done ? "✓" : `${index + 1}.`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: step.tool
							}), step.purpose ? ` — ${step.purpose}` : ""] })]
						}, step.id);
					})
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "flex flex-col gap-2",
				"aria-live": "polite",
				children: [detail.iterations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "p-4",
					beam: false,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption font-medium",
								children: item.kind === "tool" && item.toolName ? item.toolName : item.kind === "backoff" ? "Backoff" : item.kind === "plan" ? "Plan" : item.kind === "observe" ? "Observe" : item.kind === "decide" ? "Decide" : item.kind === "complete" ? "Complete" : item.kind === "error" ? "Error" : "Agent"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: item.status === "error" ? "red" : item.status === "running" ? "blue" : "neutral",
								children: [item.status, item.durationMs != null ? ` · ${item.durationMs}ms` : ""]
							})]
						}),
						item.argsSummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 truncate font-mono text-[11px] text-muted",
							children: item.argsSummary
						}) : null,
						item.resultSummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 whitespace-pre-wrap text-caption",
							children: item.resultSummary
						}) : null,
						item.screenshotDataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.screenshotDataUrl,
							alt: "Desktop screenshot",
							className: "mt-3 max-h-56 w-full rounded-control object-contain bg-black/40"
						}) : item.screenshotRef ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-caption text-muted",
							children: ["Screenshot: ", item.screenshotRef]
						}) : null
					]
				}) }, item.id)), running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, {
					className: "p-4",
					beam: true,
					children: reduced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Working…"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingAnimation, {
						className: "text-caption text-muted",
						duration: 40,
						children: detail.run.status === "planning" ? "Planning steps…" : "Stepping through the plan…"
					})
				}) }) : null]
			}),
			detail.run.summary && !running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Summary"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 text-body"),
				children: detail.run.summary
			})] }) : null
		]
	});
}
function AgentPage() {
	const { run: runId } = Route$40.useSearch();
	const navigate = useNavigate({ from: Route$40.fullPath });
	const queryClient = useQueryClient();
	const [preset, setPreset] = (0, import_react.useState)("clipping-full-package");
	const [goal, setGoal] = (0, import_react.useState)(AGENT_PRESET_COPY["clipping-full-package"].goal);
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [skillId, setSkillId] = (0, import_react.useState)("");
	const [runsOpen, setRunsOpen] = (0, import_react.useState)(false);
	const [ctxOpen, setCtxOpen] = (0, import_react.useState)(false);
	const llmQuery = useQuery({
		queryKey: LLM_QUERY_KEY,
		queryFn: () => getLlmSnapshot()
	});
	const clientsQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const skillsQuery = useQuery({
		queryKey: ["skills"],
		queryFn: () => listSkillsFn()
	});
	const runsQuery = useQuery({
		queryKey: AGENT_QUERY_KEY,
		queryFn: () => listAgentRunsFn(),
		refetchInterval: 4e3
	});
	const detailQuery = useQuery({
		queryKey: agentRunQueryKey(runId ?? ""),
		queryFn: () => getAgentRunFn({ data: runId }),
		enabled: Boolean(runId),
		refetchInterval: (query) => {
			const status = query.state.data?.run.status;
			return isAgentBusy(status ?? "queued") ? 1200 : false;
		}
	});
	const start = useMutation({
		mutationFn: () => startAgentRunFn({ data: {
			goal,
			preset,
			clientId: clientId || null,
			skillId: skillId || null
		} }),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({ queryKey: AGENT_QUERY_KEY });
			await navigate({ search: { run: result.id } });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const cancel = useMutation({
		mutationFn: () => cancelAgentRunFn({ data: runId }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: agentRunQueryKey(runId ?? "") });
			toast.success("Run cancelled");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const llmReady = Boolean(llmQuery.data?.providers["xai-oauth"].configured || llmQuery.data?.providers["xai-api"].configured || llmQuery.data?.providers["openai-compat"].configured);
	const model = llmQuery.data?.router.defaultModel ?? "grok-4.6";
	const clients = (0, import_react.useMemo)(() => (clientsQuery.data ?? []).filter((row) => row.status === "ACTIVE" && !row.deletedAt), [clientsQuery.data]);
	const skills = (skillsQuery.data ?? []).filter((row) => row.enabled && row.status === "active");
	const selectedClient = clients.find((row) => row.id === clientId) ?? null;
	const selectedSkill = skills.find((row) => row.id === skillId) ?? null;
	const rateLimit = llmQuery.data?.rateLimit;
	const contextPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Context"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body font-medium",
				children: selectedClient?.name ?? "No client selected"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-caption text-muted",
				children: [selectedClient?.currentStage ?? "Stage unknown", " · pin a skill if you want a custom run"]
			})] }),
			selectedSkill ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-caption",
				children: [
					"Skill: ",
					selectedSkill.name,
					" v",
					selectedSkill.version
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "No skill pinned."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Social Machine is on-demand. Presets never start it on login. Draft social jobs wait if the VM is stopped."
			})
		]
	});
	const runsPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-2 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-1 text-caption text-muted",
			children: "Runs"
		}), (runsQuery.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-1 text-caption text-muted",
			children: "No runs yet."
		}) : (runsQuery.data ?? []).map((run) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => {
				navigate({ search: { run: run.id } });
				setRunsOpen(false);
			},
			className: cn("flex min-h-11 w-full min-w-0 flex-col gap-1 rounded-control px-3 py-2 text-left", run.id === runId ? "bg-accent/15" : "hover:bg-secondary-surface/70"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex min-w-0 items-start gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 flex-1 text-caption font-medium break-words line-clamp-2",
					children: run.goal
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: agentStatusTone(run.status),
					children: agentStatusLabel(run.status)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-caption text-muted",
				children: presetCopy(run.preset).label
			})]
		}, run.id))]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex max-w-7xl flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, {
				className: "pointer-events-none absolute inset-0 -z-10 opacity-40",
				quantity: 20
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "AI Clipping Agent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "flex min-w-0 items-center gap-2 text-page font-semibold tracking-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
						className: "size-6 shrink-0",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, {
						className: "text-page font-semibold tracking-tight",
						children: "Agent"
					})]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "purple",
							children: model
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							className: "lg:hidden",
							onClick: () => setRunsOpen(true),
							"aria-label": "Open runs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, { className: "size-4" }), "Runs"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							className: "lg:hidden",
							onClick: () => setCtxOpen(true),
							"aria-label": "Open context",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-4" }), "Context"]
						})
					]
				})]
			}),
			!llmQuery.isPending && !llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, { title: "Connect Grok or an API key to run the clipping agent" }) : null,
			rateLimit?.retrying || rateLimit?.recent429 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-control bg-warning/10 px-3 py-2 text-caption text-warning",
				role: "status",
				children: rateLimit.message ?? "Capacity — retrying…"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative rounded-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, { borderWidth: 1 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							role: "list",
							"aria-label": "Presets",
							children: AGENT_PRESETS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setPreset(id);
									if (id !== "custom") {
										setGoal(AGENT_PRESET_COPY[id].goal);
										const match = skills.find((row) => row.slug === id);
										if (match) setSkillId(match.id);
									}
								},
								className: cn("min-h-11 rounded-full px-3 text-caption", preset === id ? "bg-accent text-accent-fg" : "bg-secondary-surface text-fg"),
								children: AGENT_PRESET_COPY[id].label
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: AGENT_PRESET_COPY[preset].hint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "agent-client",
									children: "Client"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: clientId || "none",
									onValueChange: (value) => setClientId(value === "none" ? "" : value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "agent-client",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a client" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "none",
										children: "No client"
									}), clients.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: client.id,
										children: client.name
									}, client.id))] })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "agent-skill",
									children: "Pinned skill"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: skillId || "none",
									onValueChange: (value) => setSkillId(value === "none" ? "" : value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "agent-skill",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Optional" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "none",
										children: "None"
									}), skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: skill.id,
										children: skill.name
									}, skill.id))] })]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "agent-goal",
								children: "Goal"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "agent-goal",
								value: goal,
								onChange: (event) => setGoal(event.target.value),
								rows: 3,
								className: "min-h-20"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => start.mutate(),
								disabled: start.isPending || !llmReady || !goal.trim(),
								className: "min-h-11",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Run agent"]
							}), detailQuery.data && (isAgentBusy(detailQuery.data.run.status) || detailQuery.data.run.status === "waiting_human" || detailQuery.data.run.status === "waiting_resource") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: () => cancel.mutate(),
								disabled: cancel.isPending,
								className: "min-h-11",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Cancel"]
							}) : null]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(14rem,16rem)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block",
						children: runsQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40" }) : runsPanel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: !runId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, {
						className: "grid min-h-48 place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body text-muted",
							children: "Set a goal and run the agent. Iterations appear here."
						})
					}) : detailQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full rounded-card" }) : detailQuery.isError || !detailQuery.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
						title: "Couldn’t load this run",
						description: "Retry in a moment.",
						onRetry: () => void detailQuery.refetch()
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentTimeline, {
						detail: detailQuery.data,
						rateLimitMessage: rateLimit?.message
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block",
						children: contextPanel
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: runsOpen,
				onOpenChange: setRunsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "left",
					className: "p-0 px-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "sr-only",
							children: "Agent runs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
							className: "sr-only",
							children: "History of clipping agent runs"
						}),
						runsPanel
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: ctxOpen,
				onOpenChange: setCtxOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "right",
					className: "p-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "sr-only",
							children: "Run context"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
							className: "sr-only",
							children: "Selected client and skill"
						}),
						contextPanel
					]
				})
			})
		]
	});
}
//#endregion
export { AgentPage as component };
