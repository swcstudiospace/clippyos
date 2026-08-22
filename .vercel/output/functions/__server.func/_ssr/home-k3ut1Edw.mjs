import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as billingStatusLabel, g as PROGRESS_STAGES, o as DEFAULT_SAAS_PLANS, t as BILLING_QUERY_KEY, x as billingStatusTone } from "./mappers-Bmic_hyw.mjs";
import { c as OBJECTIVES_TODOS_KEY, i as DASHBOARD_ALERTS_SESSION_KEY, s as OBJECTIVES_DISMISS_KEY } from "./constants-CdtfzQP2.mjs";
import { a as formatDate, c as formatUsd, d as todayIsoDate, s as formatRelativeTime, u as initials } from "./format-DaT2NYM9.mjs";
import { m as SAFETY_INBOX_QUERY_KEY } from "./safety-CI611PZC.mjs";
import { n as INTEGRATIONS_QUERY_KEY } from "./integrations-BBMsU168.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { r as getSafetyInbox } from "./safety-fns-0YjGOs0I.mjs";
import { r as MONEY_QUERY_KEY, s as isActiveClient } from "./money-n66k7fz5.mjs";
import { C as STAGE_TONES, S as STAGE_LABELS, _ as PLAN_TONES, a as deriveDashboardMetrics, c as deriveRecentActivity, g as PLAN_LABELS, i as deriveDashboardAlerts, l as deriveStuckStageCount, o as deriveGuaranteeItems, r as daysSinceTimestamp, s as derivePipelineCounts, t as DASHBOARD_PROGRESS_QUERY_KEY, u as inclusiveDayCount } from "./dashboard-Dk6DLyWe.mjs";
import { r as AUTONOMY_HEALTH_QUERY_KEY } from "./autonomy-CEwFxjUt.mjs";
import { c as listClients, l as listProgress, r as getAiStatus } from "./clients-CmcyBPZd.mjs";
import { t as ANALYTICS_QUERY_KEY } from "./analytics-qdDcZ6-_.mjs";
import { a as pullAnalytics, r as getAnalytics } from "./analytics-Cxeqvuh1.mjs";
import { t as getMoneySnapshot } from "./money-BLxnpxZv.mjs";
import { At as Bot, C as ShieldCheck, Ft as ArrowRightLeft, N as Plus, Ot as CalendarDays, P as PlugZap, T as Share2, Z as Lightbulb, ht as CreditCard, j as RefreshCw, l as UserPlus, m as TriangleAlert, n as X, s as Users, vt as Clapperboard } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, i as listLeads, m as userFacingErrorMessage, s as LEADS_QUERY_KEY, w as Button } from "./router-DRtNPEcw.mjs";
import { r as getBillingSnapshot } from "./billing-fns-DJqg_cQU.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { r as getIntegrationsStatus } from "./integrations-eci1pPRl.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as BlurFade } from "./blur-fade-Bh-jVmMj.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { r as HERMES_CONNECTION_LABELS } from "./connect-Vop9T4X0.mjs";
import { t as NumberTicker } from "./number-ticker-BX_YJzC_.mjs";
import { t as MetricCard } from "./metric-card-3PC2FfKw.mjs";
import { n as StagePill } from "./stage-pill-D4JnG28X.mjs";
import { t as ClientFormModal } from "./client-form-modal-CRdMPNqb.mjs";
import { t as deriveTeam } from "./team-BcQx73mj.mjs";
import { i as getAutonomyHealth } from "./autonomy-admin-D-Lji9O1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-k3ut1Edw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientStageCards({ clients, loading, filter = null }) {
	const today = todayIsoDate();
	const active = clients.filter(isActiveClient).filter((client) => {
		if (filter === "NONE") return !client.currentStage;
		if (filter) return client.currentStage === filter;
		return true;
	});
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
		children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-10 rounded-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-5 w-32" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-6 w-24" })
		] }, index))
	});
	if (active.length === 0) {
		const filtered = Boolean(filter);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: filtered ? "No clients in this stage" : "No active clients",
			description: filtered ? "Clear the pipeline filter to see the full roster." : "Active roster cards show each client’s current production stage.",
			action: filtered ? void 0 : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/clients",
					children: "Add a client"
				})
			})
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
		children: active.map((client, index) => {
			const dayCount = client.startDate ? inclusiveDayCount(client.startDate, today) : null;
			const inStage = daysSinceTimestamp(client.currentStageAt, today);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
				delay: Math.min(index * .04, .24),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, {
					interactive: true,
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/clients/$clientId",
						params: { clientId: client.id },
						className: "flex h-full flex-col gap-3 p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-10 place-items-center rounded-full bg-secondary-surface text-caption font-semibold",
									"aria-hidden": "true",
									children: client.channelThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: client.channelThumbnail,
										alt: "",
										className: "size-10 rounded-full object-cover"
									}) : initials(client.name)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: PLAN_TONES[client.planType],
									children: client.planType === "CUSTOM" && client.customPlanLabel ? client.customPlanLabel : PLAN_LABELS[client.planType]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-card font-semibold tracking-tight",
								children: client.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StagePill, { stage: client.currentStage }), client.currentSource === "AI_DISCORD" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-caption text-muted",
									children: "via Discord"
								}) : client.currentSource === "AGENT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-caption text-muted",
									children: "via Agent"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-caption text-muted",
								children: [dayCount != null && dayCount > 0 ? `Day ${dayCount}/30` : "No start date", inStage != null && client.currentStage ? inStage === 0 ? " · stage updated today" : ` · ${inStage}d in stage` : null]
							})
						]
					})
				})
			}, client.id);
		})
	});
}
var STATUS_LABEL = {
	on_track: "On track",
	approaching: "Approaching",
	past_deadline: "Past deadline"
};
function readDismissed$1(today) {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(OBJECTIVES_DISMISS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (parsed.date !== today || !Array.isArray(parsed.ids)) return [];
		return parsed.ids.filter((id) => typeof id === "string");
	} catch {
		return [];
	}
}
function writeDismissed$1(today, ids) {
	window.localStorage.setItem(OBJECTIVES_DISMISS_KEY, JSON.stringify({
		date: today,
		ids
	}));
}
function readTodos() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(OBJECTIVES_TODOS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item) => item && typeof item.id === "string" && typeof item.text === "string");
	} catch {
		return [];
	}
}
function DailyObjectives({ items, missingStartDates, loading }) {
	const today = todayIsoDate();
	const [dismissed, setDismissed] = (0, import_react.useState)([]);
	const [todos, setTodos] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setDismissed(readDismissed$1(today));
		setTodos(readTodos());
	}, [today]);
	const visible = (0, import_react.useMemo)(() => items.filter((item) => !dismissed.includes(item.id)), [items, dismissed]);
	function dismiss(id) {
		const next = [.../* @__PURE__ */ new Set([...dismissed, id])];
		setDismissed(next);
		writeDismissed$1(today, next);
	}
	function addTodo(event) {
		event.preventDefault();
		const text = draft.trim();
		if (!text) return;
		const next = [...todos, {
			id: crypto.randomUUID(),
			text: text.slice(0, 200)
		}];
		setTodos(next);
		window.localStorage.setItem(OBJECTIVES_TODOS_KEY, JSON.stringify(next));
		setDraft("");
	}
	function removeTodo(id) {
		const next = todos.filter((item) => item.id !== id);
		setTodos(next);
		window.localStorage.setItem(OBJECTIVES_TODOS_KEY, JSON.stringify(next));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-[1]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "30-day guarantee tracker"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 max-w-2xl text-caption text-muted",
					children: [
						"We guarantee a full refund if a client doesn’t see a views increase in their first ",
						30,
						" days. Day 1 is the client start date (inclusive). Views signals only appear when two or more snapshots exist on or after the start date — never invented. Acknowledge today and the derived items return tomorrow."
					]
				}),
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-14 w-full" }, index))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 flex flex-col gap-2",
					children: [
						visible.length === 0 && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-control bg-secondary-surface/50 px-3 py-3 text-body text-muted",
							children: missingStartDates > 0 ? `Add start dates on ${missingStartDates} active client${missingStartDates === 1 ? "" : "s"} to track the 30-day guarantee.` : "No 30-day windows to track yet. They appear automatically when an active client has a start date."
						}) : null,
						visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: cn("flex flex-col gap-2 rounded-control px-3 py-3 sm:flex-row sm:items-center sm:justify-between", item.tone === "red" && "bg-danger/12", item.tone === "orange" && "bg-warning/12", item.tone === "green" && "bg-success/12", item.tone === "neutral" && "bg-secondary-surface/50"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: item.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-caption text-muted",
									children: [
										"Inclusive day count · ",
										30,
										"-day views guarantee"
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: item.status === "past_deadline" ? "red" : item.status === "approaching" ? "orange" : "green",
										children: STATUS_LABEL[item.status]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: item.viewsSignal === "up" ? "green" : item.viewsSignal === "flat" ? "orange" : "neutral",
										children: item.viewsLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "secondary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/clients/$clientId",
											params: { clientId: item.clientId },
											children: "Open"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => dismiss(item.id),
										children: "Acknowledge today"
									})
								]
							})]
						}, item.id)),
						todos.map((todo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 rounded-control bg-secondary-surface/40 px-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "min-w-0 flex-1 text-body",
								children: todo.text
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "ghost",
								"aria-label": `Remove ${todo.text}`,
								onClick: () => removeTodo(todo.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}, todo.id))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: addTodo,
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft,
						onChange: (event) => setDraft(event.target.value),
						placeholder: "Add a personal to-do…",
						"aria-label": "Add a personal to-do",
						maxLength: 200
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						variant: "secondary",
						"aria-label": "Add to-do",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Add"]
					})]
				})
			]
		})]
	});
}
function DashLink({ href, className, children }) {
	if (href.to === "/clients/$clientId") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/clients/$clientId",
		params: href.params,
		className,
		children
	});
	if (href.to === "/settings") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/settings",
		hash: href.hash,
		className,
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: href.to,
		className,
		children
	});
}
function readDismissed() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.sessionStorage.getItem(DASHBOARD_ALERTS_SESSION_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((id) => typeof id === "string");
	} catch {
		return [];
	}
}
function writeDismissed(ids) {
	window.sessionStorage.setItem(DASHBOARD_ALERTS_SESSION_KEY, JSON.stringify(ids));
}
function AlertStrip({ alerts, loading }) {
	const [dismissed, setDismissed] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setDismissed(readDismissed());
	}, []);
	const visible = (0, import_react.useMemo)(() => alerts.filter((alert) => !dismissed.includes(alert.id)), [alerts, dismissed]);
	function dismiss(id) {
		const next = [.../* @__PURE__ */ new Set([...dismissed, id])];
		setDismissed(next);
		writeDismissed(next);
	}
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-2",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-56" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-44" })]
	});
	if (visible.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "status",
		"aria-live": "polite",
		"aria-label": "Attention needed",
		className: "flex flex-wrap gap-2",
		children: visible.map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("glass-card flex min-h-11 items-stretch overflow-hidden p-0", alert.severity === "critical" && "border-danger/45 bg-danger/10", alert.severity === "warning" && "border-warning/45 bg-warning/10"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashLink, {
				href: alert.href,
				className: "flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-caption font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: cn("size-4 shrink-0", alert.severity === "critical" ? "text-danger" : "text-warning"),
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 text-pretty",
					children: alert.title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "grid min-h-11 min-w-11 place-items-center text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
				"aria-label": `Dismiss ${alert.title}`,
				onClick: () => dismiss(alert.id),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					className: "size-4",
					"aria-hidden": "true"
				})
			})]
		}, alert.id))
	});
}
function QuickActions({ onAddClient, onRefreshAnalytics, refreshing, youtubeReady, highlightIntegrations }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-2",
		"aria-label": "Quick actions",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "secondary",
				className: "shrink-0",
				onClick: onAddClient,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
					className: "size-4",
					"aria-hidden": "true"
				}), "Add Client"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/calendar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Open Calendar"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onRefreshAnalytics,
				disabled: refreshing,
				title: youtubeReady ? "Pull public stats for active clients with a channel" : "Connect a YouTube Data API key in Settings to pull live stats",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
					className: cn("size-4", refreshing && "motion-safe:animate-spin"),
					"aria-hidden": "true"
				}), "Refresh Analytics"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/ideation",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Open Ideation"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/agent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Open Agent"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/social",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Open Social"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/approvals",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Approvals"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: highlightIntegrations ? "secondary" : "ghost",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/settings",
					hash: "integrations",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlugZap, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Integrations"]
				})
			})
		]
	});
}
function PipelineSummary({ counts, filter, onFilter, loading }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Production pipeline"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "Active clients by latest stage."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex gap-2 overflow-hidden",
			children: Array.from({ length: 6 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-28 shrink-0" }, index))
		})
	] });
	if (!counts || counts.total === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "Production pipeline",
		description: "Stage counts appear once you have active clients.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/clients",
				children: "Add a client"
			})
		})
	});
	function toggle(next) {
		onFilter(filter === next ? null : next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-[1]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Production pipeline"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "Active clients by latest stage. Click a stage to filter the cards below."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2 overflow-x-auto pb-1",
					role: "toolbar",
					"aria-label": "Filter clients by production stage",
					children: [PROGRESS_STAGES.map((stage) => {
						const count = counts.stages[stage];
						const selected = filter === stage;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => toggle(stage),
							"aria-pressed": selected,
							className: cn("flex min-h-16 min-w-28 shrink-0 flex-col items-start justify-center rounded-control border px-3 py-2 text-left transition-colors", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", selected ? "border-accent bg-accent/12" : "border-border bg-secondary-surface/50 hover:bg-secondary-surface"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-page font-semibold tabular-nums",
								children: count
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-caption", STAGE_TONES[stage] === "green" && "text-success", STAGE_TONES[stage] === "orange" && "text-warning", STAGE_TONES[stage] === "red" && "text-danger", !selected && "text-muted"),
								children: STAGE_LABELS[stage]
							})]
						}, stage);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => toggle("NONE"),
						"aria-pressed": filter === "NONE",
						className: cn("flex min-h-16 min-w-28 shrink-0 flex-col items-start justify-center rounded-control border px-3 py-2 text-left", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", filter === "NONE" ? "border-accent bg-accent/12" : "border-border bg-secondary-surface/50 hover:bg-secondary-surface"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-page font-semibold tabular-nums",
							children: counts.notStarted
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-caption text-muted",
							children: "Not started"
						})]
					})]
				})
			]
		})]
	});
}
var ICONS = {
	payment_paid: CreditCard,
	stage_change: Clapperboard,
	lead_created: UserPlus,
	lead_moved: ArrowRightLeft,
	client_created: Users
};
function RecentActivity({ items, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-[1]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Recent activity"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "Latest payments, stages, leads, and new clients — derived, not a separate log."
				}),
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: Array.from({ length: 4 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }, index))
				}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-control bg-secondary-surface/50 px-3 py-3 text-body text-muted",
					children: "No recent activity yet"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 flex flex-col gap-1",
					children: items.map((item) => {
						const Icon = ICONS[item.kind];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashLink, {
							href: item.href,
							className: "flex min-h-11 items-center gap-3 rounded-control px-2 py-2 hover:bg-secondary-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "size-4",
										"aria-hidden": "true"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 text-body",
									children: item.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
									className: "shrink-0 text-caption text-muted",
									dateTime: item.at,
									children: formatRelativeTime(item.at)
								})
							]
						}) }, item.id);
					})
				})
			]
		})]
	});
}
function AutomationWidget({ atRisk = 0, overdueCount = 0, stuckStages = 0 }) {
	const health = useQuery({
		queryKey: AUTONOMY_HEALTH_QUERY_KEY,
		queryFn: () => getAutonomyHealth()
	});
	const data = health.data;
	const openEscalations = atRisk + overdueCount + stuckStages;
	let tone = "neutral";
	let label = "Hermes: Not connected";
	const connection = data?.hermesConnection ?? "not_connected";
	if (data && !data.automationEnabled) {
		tone = "orange";
		label = "Paused";
	} else if (connection === "fully_connected") {
		tone = "green";
		label = `Hermes: ${HERMES_CONNECTION_LABELS.fully_connected}`;
	} else if (connection === "key_only") {
		tone = "blue";
		label = `Hermes: ${HERMES_CONNECTION_LABELS.key_only}`;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "Hermes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: "Paste credentials into Hermes from Settings → Connect Hermes. Agency Admin is the server."
					})] })]
				}), health.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-28 rounded-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone,
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-caption text-muted",
							children: "Open escalations"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-page font-semibold tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, { value: openEscalations })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-caption text-muted",
							children: "At-risk 30d"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-page font-semibold tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, { value: atRisk })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-caption text-muted",
							children: "Overdue invoices"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-page font-semibold tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, { value: overdueCount })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-caption text-muted",
							children: "Stuck stages"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-page font-semibold tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, { value: stuckStages })
						})]
					})
				]
			}),
			data?.social ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 rounded-control bg-secondary-surface/50 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption font-medium",
						children: "Social Machine"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: data.social.state === "running" ? "green" : data.social.state === "not_configured" ? "neutral" : "blue",
						children: data.social.state === "running" ? "Running" : data.social.configured ? "Stopped" : "Not configured"
					}),
					data.social.needsLogin > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "orange",
						children: [data.social.needsLogin, " need login"]
					}) : null,
					data.social.needsAttention > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "orange",
						children: [data.social.needsAttention, " need attention"]
					}) : null,
					data.social.failedJobs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "red",
						children: [data.social.failedJobs, " failed"]
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: data?.lastAction ? `Last agent action: ${data.lastAction.action}${data.lastAction.playbookId ? ` · ${data.lastAction.playbookId}` : ""} · ${formatRelativeTime(data.lastAction.at)}` : data?.lastActivityAt ? `Last activity ${formatRelativeTime(data.lastActivityAt)}` : "No agent activity yet."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						hash: "hermes-connect",
						children: "Connect Hermes"
					})
				})]
			})
		]
	});
}
function SubscriptionTracker({ snapshot }) {
	const plan = snapshot.subscription.planKey ? DEFAULT_SAAS_PLANS[snapshot.subscription.planKey] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "ClippyOS subscription"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: plan?.name ?? "No plan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-caption text-muted",
					children: "Separate from client revenue on Money."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: billingStatusTone(snapshot.subscription.status),
				children: billingStatusLabel(snapshot.subscription.status)
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-4 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-caption text-muted",
					children: "Renewal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
					className: "text-body",
					children: [snapshot.subscription.currentPeriodEnd ? formatDate(snapshot.subscription.currentPeriodEnd) : "—", snapshot.subscription.cancelAtPeriodEnd ? " · cancels at period end" : ""]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-caption text-muted",
					children: "SaaS MRR"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "text-body",
					children: snapshot.subscription.mrr != null ? formatUsd(snapshot.subscription.mrr) : "—"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-caption text-muted",
					children: "Seats"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
					className: "text-body",
					children: [snapshot.seatsUsed, snapshot.seatLimit != null ? ` / ${snapshot.seatLimit}` : ""]
				})] })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/billing",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-3.5" }), "Manage billing"]
				})
			})
		})
	] });
}
function DashboardPage() {
	const today = todayIsoDate();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [stageFilter, setStageFilter] = (0, import_react.useState)(null);
	const [addOpen, setAddOpen] = (0, import_react.useState)(false);
	const clientsQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const moneyQuery = useQuery({
		queryKey: MONEY_QUERY_KEY,
		queryFn: () => getMoneySnapshot()
	});
	const analyticsQuery = useQuery({
		queryKey: ANALYTICS_QUERY_KEY,
		queryFn: () => getAnalytics()
	});
	const progressQuery = useQuery({
		queryKey: DASHBOARD_PROGRESS_QUERY_KEY,
		queryFn: () => listProgress()
	});
	const leadsQuery = useQuery({
		queryKey: LEADS_QUERY_KEY,
		queryFn: () => listLeads()
	});
	const integrationsQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const billingQuery = useQuery({
		queryKey: BILLING_QUERY_KEY,
		queryFn: () => getBillingSnapshot()
	});
	const inboxQuery = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox()
	});
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const metrics = (0, import_react.useMemo)(() => {
		if (!moneyQuery.data) return null;
		return deriveDashboardMetrics(moneyQuery.data, today);
	}, [moneyQuery.data, today]);
	const guarantees = (0, import_react.useMemo)(() => {
		const clients = clientsQuery.data ?? [];
		const snapshots = analyticsQuery.data?.snapshots ?? [];
		return deriveGuaranteeItems(clients, snapshots, today);
	}, [
		clientsQuery.data,
		analyticsQuery.data,
		today
	]);
	const pipeline = (0, import_react.useMemo)(() => {
		if (!clientsQuery.data) return null;
		return derivePipelineCounts(clientsQuery.data);
	}, [clientsQuery.data]);
	const activity = (0, import_react.useMemo)(() => {
		return deriveRecentActivity({
			clients: clientsQuery.data ?? moneyQuery.data?.clients ?? [],
			payments: moneyQuery.data?.payments ?? [],
			progress: progressQuery.data ?? [],
			leads: leadsQuery.data ?? []
		});
	}, [
		clientsQuery.data,
		moneyQuery.data,
		progressQuery.data,
		leadsQuery.data
	]);
	const alerts = (0, import_react.useMemo)(() => {
		const integrations = integrationsQuery.data;
		const team = moneyQuery.data ? deriveTeam(moneyQuery.data.clients, moneyQuery.data.teamMembers) : null;
		return deriveDashboardAlerts({
			overdueCount: metrics?.overdueCount ?? 0,
			overdueTotal: metrics?.overdueTotal ?? 0,
			guarantees,
			discordConfigured: Boolean(integrations?.items.discord.configured),
			discordAgent: integrations?.discordAgent ?? null,
			aiConfigured: integrationsQuery.isSuccess || aiQuery.isSuccess ? Boolean(integrations?.items.ai.configured || aiQuery.data?.llm) : true,
			overloaded: (team?.capacity ?? []).filter((row) => row.overloaded),
			nowMs: Date.now(),
			pendingApprovals: inboxQuery.data?.pendingApprovals ?? 0
		});
	}, [
		metrics,
		guarantees,
		integrationsQuery.data,
		integrationsQuery.isSuccess,
		moneyQuery.data,
		aiQuery.data,
		aiQuery.isSuccess,
		inboxQuery.data
	]);
	const missingStartDates = (clientsQuery.data ?? []).filter((client) => isActiveClient(client) && !client.startDate).length;
	const stuckStages = (0, import_react.useMemo)(() => {
		const clients = clientsQuery.data ?? [];
		const progress = progressQuery.data ?? [];
		return deriveStuckStageCount(clients.map((client) => ({
			id: client.id,
			status: client.status,
			deletedAt: client.deletedAt,
			currentStage: client.currentStage
		})), progress, today);
	}, [
		clientsQuery.data,
		progressQuery.data,
		today
	]);
	const youtubeReady = Boolean(analyticsQuery.data?.youtubeDataApi);
	const highlightIntegrations = Boolean(integrationsQuery.data && !integrationsQuery.data.items.ai.configured && !aiQuery.data?.llm);
	const pull = useMutation({
		mutationFn: () => pullAnalytics({ data: { clientId: null } }),
		onSuccess: async (result) => {
			const ok = result.results.filter((row) => row.ok).length;
			toast.success(ok === 0 ? "No channels were pulled. Connect a YouTube URL on each client first." : `Analytics refreshed for ${ok} client${ok === 1 ? "" : "s"}`);
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const moneyError = moneyQuery.isError;
	const clientsError = clientsQuery.isError;
	const overviewLoading = moneyQuery.isPending && !metrics;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, {
				className: "opacity-50",
				quantity: 18
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				sparkle: true,
				title: "Dashboard",
				description: "Agency command center — live roster, collections, pipeline, and the 30-day views guarantee. Nothing here is stored as a rollup."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Alerts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertStrip, {
							alerts,
							loading: moneyQuery.isPending && integrationsQuery.isPending
						})
					}),
					billingQuery.data?.role === "owner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "ClippyOS subscription",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubscriptionTracker, { snapshot: billingQuery.data })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Overview",
						children: moneyError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load overview",
							description: "Totals couldn’t be calculated. Try again.",
							onRetry: () => void moneyQuery.refetch()
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Total MRR",
									value: formatUsd(metrics?.totalMrr ?? 0),
									amount: metrics?.totalMrr ?? 0,
									hint: "Active clients · monthly fee",
									loading: overviewLoading
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Total clients",
									value: String(metrics?.totalClients ?? 0),
									hint: "Active, not churned",
									loading: overviewLoading
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Revenue this month",
									value: formatUsd(metrics?.revenueThisMonth ?? 0),
									amount: metrics?.revenueThisMonth ?? 0,
									hint: "Paid invoices dated this month",
									tone: "success",
									loading: overviewLoading
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Outstanding payments",
									value: formatUsd(metrics?.outstanding ?? 0),
									amount: metrics?.outstanding ?? 0,
									hint: "Pending and overdue",
									tone: metrics && metrics.outstanding > 0 ? "danger" : "default",
									loading: overviewLoading
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Clients at risk",
									value: String(metrics?.clientsAtRisk ?? 0),
									hint: "Day 25+ on the 30-day guarantee",
									tone: metrics && metrics.clientsAtRisk > 0 ? "danger" : "default",
									loading: overviewLoading
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Quick actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActions, {
							onAddClient: () => setAddOpen(true),
							onRefreshAnalytics: () => pull.mutate(),
							refreshing: pull.isPending,
							youtubeReady,
							highlightIntegrations
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Automation",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutomationWidget, {
							atRisk: metrics?.clientsAtRisk ?? 0,
							overdueCount: metrics?.overdueCount ?? 0,
							stuckStages
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Production pipeline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineSummary, {
							counts: pipeline,
							filter: stageFilter,
							onFilter: setStageFilter,
							loading: clientsQuery.isPending
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Client stages",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-section font-semibold tracking-tight",
								children: "Client stages"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-caption text-muted",
								children: "Discord Status Agent is read-only and runs automatically about every 30 minutes. It matches Discord server names to client names and updates production stages."
							}),
							clientsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
								title: "Couldn’t load clients",
								description: "Stage cards need the live roster. Try again.",
								onRetry: () => void clientsQuery.refetch()
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientStageCards, {
								clients: clientsQuery.data ?? [],
								loading: clientsQuery.isPending,
								filter: stageFilter
							})
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "30-day guarantee",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DailyObjectives, {
							items: guarantees,
							missingStartDates,
							loading: clientsQuery.isPending
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Recent activity",
						children: leadsQuery.isError && progressQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load activity",
							description: "Payments, stages, and leads couldn’t be combined. Try again.",
							onRetry: () => {
								leadsQuery.refetch();
								progressQuery.refetch();
							}
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentActivity, {
							items: activity,
							loading: (clientsQuery.isPending || moneyQuery.isPending) && activity.length === 0
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientFormModal, {
				open: addOpen,
				onOpenChange: setAddOpen,
				client: null,
				aiReady: Boolean(aiQuery.data?.llm),
				onSaved: (id) => {
					setAddOpen(false);
					queryClient.invalidateQueries({ queryKey: ["clients"] });
					queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
					navigate({
						to: "/clients/$clientId",
						params: { clientId: id }
					});
				}
			})
		]
	});
}
//#endregion
export { DashboardPage as component };
