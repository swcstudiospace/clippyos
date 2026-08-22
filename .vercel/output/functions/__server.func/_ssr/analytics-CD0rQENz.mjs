import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as formatDate, d as todayIsoDate, o as formatPercent, r as formatCompactCount, s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
import { a as latestByClient, i as averageCtr, o as snapshotsForClient, r as aggregateLatest, t as ANALYTICS_QUERY_KEY } from "./analytics-qdDcZ6-_.mjs";
import { a as pullAnalytics, n as connectChannel, r as getAnalytics, s as saveManualSnapshot } from "./analytics-Cxeqvuh1.mjs";
import { j as RefreshCw } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, D as usePrefersReducedMotion, O as cn, d as Route$39, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { S as latestSnapshotPerPost, b as formatEngagementPct, g as WINDOW_LABELS, o as PERFORMANCE_PLATFORMS, s as PERFORMANCE_QUERY_KEY, u as PLATFORM_LABELS, x as formatUnknownNumber } from "./performance-Cj9pmeSi.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as Switch } from "./switch-BBV5HifB.mjs";
import { t as FilterChip } from "./filter-chip-BzSrTvLw.mjs";
import { t as ScoreBadge } from "./score-badge-IJk18-LU.mjs";
import { o as recordManualMetricsFn, r as getPerformanceSnapshot, s as refreshPostPerformanceFn } from "./performance-fns-BnwGGujQ.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, f as Legend, i as YAxis, o as Area, t as AreaChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-CD0rQENz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AnalyticsMetricCard({ label, value, hint, loading = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-caption text-muted",
		children: label
	}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-9 w-28" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-4 w-24" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "metric-in mt-1 text-page font-semibold tracking-tight tabular-nums",
		children: value
	}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-caption text-muted",
		children: hint
	}) : null] })] });
}
function AnalyticsMetricRow({ subscribers, views, ctr, watchHours, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricCard, {
				label: "Subscribers",
				value: formatCompactCount(subscribers),
				hint: "Latest snapshot",
				loading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricCard, {
				label: "Total Views",
				value: formatCompactCount(views),
				hint: "Channel lifetime",
				loading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricCard, {
				label: "Average CTR",
				value: ctr == null ? "—" : formatPercent(ctr, 2),
				hint: ctr == null ? "Not available via public API" : "Mean of stored snapshots",
				loading
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricCard, {
				label: "Watch Hours",
				value: watchHours == null ? "—" : formatCompactCount(watchHours),
				hint: watchHours == null ? "Not available via public API" : "From stored snapshots",
				loading
			})
		]
	});
}
var tooltipStyle = {
	background: "var(--elevated)",
	border: "0.5px solid var(--border)",
	borderRadius: "12px",
	color: "var(--fg)",
	fontSize: 13
};
function ChartFrame({ title, caption, loading, empty, emptyTitle, emptyDescription, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "flex min-h-[280px] flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-card font-semibold tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: caption
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 min-h-0 flex-1",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[220px] w-full" }) : empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-[220px] flex-col justify-center rounded-control bg-secondary-surface/40 px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body font-medium",
						children: emptyTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: emptyDescription
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[220px] w-full",
					children
				})
			})
		]
	});
}
function AnalyticsCharts({ history, loading }) {
	const reduceMotion = usePrefersReducedMotion();
	const data = history.map((row) => ({
		label: formatDate(row.date),
		views: row.viewsN,
		watchHours: row.watchHoursN
	}));
	const hasViews = data.some((row) => row.views != null);
	const hasWatch = data.some((row) => row.watchHours != null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartFrame, {
			title: "Views over time",
			caption: "Each point is an AnalyticsSnapshot for this client, ordered by date.",
			loading,
			empty: !loading && !hasViews,
			emptyTitle: "No view history yet",
			emptyDescription: "Pull from YouTube or enter a snapshot to start the series.",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
					data,
					margin: {
						top: 12,
						right: 12,
						left: 4,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "var(--border)",
							vertical: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "label",
							tick: {
								fill: "var(--muted)",
								fontSize: 13
							},
							axisLine: false,
							tickLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							tick: {
								fill: "var(--muted)",
								fontSize: 13
							},
							axisLine: false,
							tickLine: false,
							tickFormatter: (value) => formatCompactCount(value),
							tickCount: 5,
							width: 48
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							contentStyle: tooltipStyle,
							formatter: (value) => formatCompactCount(Number(value ?? 0))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
							type: "monotone",
							dataKey: "views",
							name: "Views",
							stroke: "var(--accent)",
							fill: "var(--accent)",
							fillOpacity: .18,
							connectNulls: true,
							isAnimationActive: !reduceMotion
						})
					]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartFrame, {
			title: "Watch-time trends",
			caption: "Public YouTube Data API does not expose watch hours. Manual snapshots can fill this series.",
			loading,
			empty: !loading && !hasWatch,
			emptyTitle: "Watch time not available",
			emptyDescription: "Enter watch hours manually — the public API cannot supply them.",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
					data,
					margin: {
						top: 12,
						right: 12,
						left: 4,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "var(--border)",
							vertical: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "label",
							tick: {
								fill: "var(--muted)",
								fontSize: 13
							},
							axisLine: false,
							tickLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							tick: {
								fill: "var(--muted)",
								fontSize: 13
							},
							axisLine: false,
							tickLine: false,
							tickFormatter: (value) => formatCompactCount(value),
							tickCount: 5,
							width: 48
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							contentStyle: tooltipStyle,
							formatter: (value) => formatCompactCount(Number(value ?? 0))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
							type: "monotone",
							dataKey: "watchHours",
							name: "Watch hours",
							stroke: "var(--teal)",
							fill: "var(--teal)",
							fillOpacity: .18,
							connectNulls: true,
							isAnimationActive: !reduceMotion
						})
					]
				})
			})
		})]
	});
}
function TopVideos({ videos, loading }) {
	const [longFormOnly, setLongFormOnly] = (0, import_react.useState)(false);
	const rows = (0, import_react.useMemo)(() => longFormOnly ? videos.filter((video) => video.isLongForm) : videos, [videos, longFormOnly]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-card font-semibold tracking-tight",
			children: "Top-performing videos"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "From the latest snapshot. Public API returns recent uploads ranked by views."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-11 items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
				id: "long-form-filter",
				checked: longFormOnly,
				onCheckedChange: setLongFormOnly,
				"aria-label": "Show only long-form videos"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "long-form-filter",
				children: "Long-form only (≥ 4 min)"
			})]
		})]
	}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 flex flex-col gap-2",
		children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-full" }, i))
	}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		className: "mt-4",
		title: longFormOnly ? "No long-form videos in this snapshot" : "No videos stored yet",
		description: "Pull analytics or enter videos on a manual snapshot."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 flex flex-col gap-2",
		children: rows.map((video, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: video.url || void 0,
			target: video.url ? "_blank" : void 0,
			rel: "noreferrer",
			className: "flex min-h-11 items-center gap-3 rounded-control bg-secondary-surface/50 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
			children: [
				video.thumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: video.thumbnail,
					alt: "",
					className: "size-12 shrink-0 rounded-control object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-12 shrink-0 place-items-center rounded-control bg-secondary-surface text-caption text-muted",
					children: index + 1
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-body",
						children: video.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-caption text-muted",
						children: [
							formatCompactCount(video.views),
							" views",
							video.publishedAt ? ` · ${formatDate(video.publishedAt)}` : ""
						]
					})]
				}),
				video.isLongForm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "green",
					children: "Long-form"
				}) : video.durationSeconds != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "neutral",
					children: "Short"
				}) : null
			]
		}) }, `${video.videoId || video.title}-${index}`))
	})] });
}
function num(value) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
function ManualEntryForm({ clients, selectedClientId }) {
	const queryClient = useQueryClient();
	const [clientId, setClientId] = (0, import_react.useState)(selectedClientId ?? clients[0]?.id ?? "");
	const [date, setDate] = (0, import_react.useState)(todayIsoDate());
	const [views, setViews] = (0, import_react.useState)("");
	const [subscribers, setSubscribers] = (0, import_react.useState)("");
	const [watchHours, setWatchHours] = (0, import_react.useState)("");
	const [ctr, setCtr] = (0, import_react.useState)("");
	const [overwrite, setOverwrite] = (0, import_react.useState)(false);
	const [confirm, setConfirm] = (0, import_react.useState)(false);
	const save = useMutation({
		mutationFn: (force) => saveManualSnapshot({ data: {
			clientId,
			date,
			views: num(views),
			subscribers: num(subscribers),
			watchHours: num(watchHours),
			impressionsCtr: num(ctr),
			overwrite: force
		} }),
		onSuccess: async () => {
			toast.success("Snapshot saved");
			setOverwrite(false);
			setConfirm(false);
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
		},
		onError: (error) => {
			if (error instanceof Error && error.message === "SNAPSHOT_EXISTS") {
				setConfirm(true);
				return;
			}
			toast.error(userFacingErrorMessage(error));
		}
	});
	const active = clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-card font-semibold tracking-tight",
			children: "Enter data manually"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "Always available. Use this for watch hours and CTR, or when the YouTube key is missing."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 grid gap-3 sm:grid-cols-2",
			onSubmit: (event) => {
				event.preventDefault();
				if (!clientId) return;
				save.mutate(overwrite);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-client",
						children: "Client"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						id: "manual-client",
						className: "min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body",
						value: clientId,
						onChange: (event) => setClientId(event.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Select a client"
						}), active.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: client.id,
							children: client.name
						}, client.id))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-date",
						children: "Date"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "manual-date",
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-subs",
						children: "Subscribers"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "manual-subs",
						inputMode: "numeric",
						value: subscribers,
						onChange: (e) => setSubscribers(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-views",
						children: "Views"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "manual-views",
						inputMode: "numeric",
						value: views,
						onChange: (e) => setViews(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-watch",
						children: "Watch hours"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "manual-watch",
						inputMode: "decimal",
						value: watchHours,
						onChange: (e) => setWatchHours(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "manual-ctr",
						children: "Average CTR (%)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "manual-ctr",
						inputMode: "decimal",
						value: ctr,
						onChange: (e) => setCtr(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: save.isPending || !clientId,
						children: save.isPending ? "Saving…" : "Save snapshot"
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: confirm,
			onOpenChange: setConfirm,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Overwrite this date?" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"A snapshot already exists for this client on ",
					date,
					". Saving replaces that day’s numbers."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setConfirm(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							setOverwrite(true);
							save.mutate(true);
						},
						children: "Overwrite"
					})]
				})
			] })
		})
	] });
}
function PublishedPerformance({ rows, metricsApi, clientId, clientNames }) {
	const queryClient = useQueryClient();
	const [platform, setPlatform] = (0, import_react.useState)("ALL");
	const [winnersOnly, setWinnersOnly] = (0, import_react.useState)(false);
	const [manualFor, setManualFor] = (0, import_react.useState)(null);
	const latest = (0, import_react.useMemo)(() => latestSnapshotPerPost(rows), [rows]);
	const filtered = (0, import_react.useMemo)(() => {
		return latest.filter((row) => {
			if (clientId && row.clientId !== clientId) return false;
			if (platform !== "ALL" && row.platform !== platform) return false;
			if (winnersOnly && row.verdict !== "WINNER") return false;
			return true;
		});
	}, [
		latest,
		clientId,
		platform,
		winnersOnly
	]);
	const refresh = useMutation({
		mutationFn: (socialPostId) => refreshPostPerformanceFn({ data: { socialPostId } }),
		onSuccess: async () => {
			toast.success("Stats refreshed");
			await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const sweep = useMutation({
		mutationFn: () => refreshPostPerformanceFn({ data: { sweep: true } }),
		onSuccess: async () => {
			toast.success("Swept published stats");
			await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "Published performance"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Scores compare each post to other posts for the same client and platform (90 days). Missing stats stay blank — never zero."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-start gap-2 sm:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricsApiPills, { status: metricsApi }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					disabled: sweep.isPending,
					onClick: () => sweep.mutate(),
					children: sweep.isPending ? "Sweeping…" : "Sweep published stats"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			role: "group",
			"aria-label": "Platform filter",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: "All platforms",
					active: platform === "ALL",
					onClick: () => setPlatform("ALL")
				}),
				PERFORMANCE_PLATFORMS.filter((p) => p !== "OTHER").map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: PLATFORM_LABELS[p],
					active: platform === p,
					onClick: () => setPlatform(p)
				}, p)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: "Winners only",
					active: winnersOnly,
					onClick: () => setWinnersOnly((v) => !v)
				})
			]
		}),
		filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			className: "mt-6",
			title: "No published stats yet",
			description: "After a post goes live, refresh stats or enter views manually. YouTube channel snapshots stay in the section above."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: filtered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-body font-medium",
								children: [
									row.clientId ? clientNames.get(row.clientId) ?? "Client" : "Workspace",
									" ·",
									" ",
									PLATFORM_LABELS[row.platform]
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-caption text-muted",
								children: [
									WINDOW_LABELS[row.window],
									" · ",
									formatRelativeTime(row.capturedAt),
									" · ",
									row.metricsSource,
									row.externalUrl ? "" : row.externalPostId ? ` · ${row.externalPostId.slice(0, 12)}` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-caption",
								children: [
									formatUnknownNumber(row.metrics.views, formatCompactCount),
									" views ·",
									" ",
									formatUnknownNumber(row.metrics.likes, formatCompactCount),
									" likes ·",
									" ",
									formatEngagementPct(row.engagementRate),
									" engagement"
								]
							}),
							row.externalUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: row.externalUrl,
								target: "_blank",
								rel: "noreferrer",
								className: "mt-1 inline-block text-caption text-accent underline-offset-2 hover:underline",
								children: "Open post"
							}) : null,
							row.mediaAssetId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/library",
								className: "ml-3 inline-block text-caption text-accent underline-offset-2 hover:underline",
								children: "Asset"
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, {
								score: row.score,
								verdict: row.verdict
							}),
							row.socialPostId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								disabled: refresh.isPending,
								onClick: () => refresh.mutate(row.socialPostId),
								children: "Refresh stats"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setManualFor(row),
								children: "Enter manually"
							})
						]
					})]
				})
			}, row.id))
		}),
		manualFor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualMetricsForm, {
			seed: manualFor,
			onClose: () => setManualFor(null),
			onSaved: async () => {
				setManualFor(null);
				await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
			}
		}) : null
	] });
}
function MetricsApiPills({ status }) {
	const items = [
		["YouTube", status.youtube],
		["X", status.x],
		["TikTok", status.tiktok],
		["Instagram", status.instagram]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children: items.map(([label, ok]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			tone: ok ? "green" : "neutral",
			children: [
				label,
				" ",
				ok ? "API" : "manual"
			]
		}, label))
	});
}
function ManualMetricsForm({ seed, onClose, onSaved }) {
	const [views, setViews] = (0, import_react.useState)(seed.metrics.views?.toString() ?? "");
	const [likes, setLikes] = (0, import_react.useState)(seed.metrics.likes?.toString() ?? "");
	const [comments, setComments] = (0, import_react.useState)(seed.metrics.comments?.toString() ?? "");
	const [shares, setShares] = (0, import_react.useState)(seed.metrics.shares?.toString() ?? "");
	const [saves, setSaves] = (0, import_react.useState)(seed.metrics.saves?.toString() ?? "");
	const save = useMutation({
		mutationFn: () => recordManualMetricsFn({ data: {
			socialPostId: seed.socialPostId ?? void 0,
			clientId: seed.clientId,
			platform: seed.platform,
			externalPostId: seed.externalPostId,
			externalUrl: seed.externalUrl,
			mediaAssetId: seed.mediaAssetId,
			window: seed.window,
			metrics: {
				views: parseOptional(views),
				likes: parseOptional(likes),
				comments: parseOptional(comments),
				shares: parseOptional(shares),
				saves: parseOptional(saves)
			}
		} }),
		onSuccess: async () => {
			toast.success("Manual snapshot saved");
			await onSaved();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-4 grid gap-3 rounded-control border border-border bg-bg/40 p-3 sm:grid-cols-2",
		onSubmit: (event) => {
			event.preventDefault();
			save.mutate();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sm:col-span-2 text-caption text-muted",
				children: "Leave a field blank if you don’t know it. Blank is unknown, not zero."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: "pf-views",
				label: "Views",
				value: views,
				onChange: setViews
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: "pf-likes",
				label: "Likes",
				value: likes,
				onChange: setLikes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: "pf-comments",
				label: "Comments",
				value: comments,
				onChange: setComments
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: "pf-shares",
				label: "Shares",
				value: shares,
				onChange: setShares
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: "pf-saves",
				label: "Saves",
				value: saves,
				onChange: setSaves
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-2 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save snapshot"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					onClick: onClose,
					children: "Cancel"
				})]
			})
		]
	});
}
function Field({ id, label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			inputMode: "numeric",
			value,
			onChange: (event) => onChange(event.target.value),
			placeholder: "unknown"
		})]
	});
}
function parseOptional(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
function AnalyticsPage() {
	const { client: selectedId } = Route$39.useSearch();
	const navigate = useNavigate({ from: Route$39.fullPath });
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: ANALYTICS_QUERY_KEY,
		queryFn: () => getAnalytics()
	});
	const performanceQuery = useQuery({
		queryKey: PERFORMANCE_QUERY_KEY,
		queryFn: () => getPerformanceSnapshot()
	});
	const [channelInput, setChannelInput] = (0, import_react.useState)("");
	const [linkClientId, setLinkClientId] = (0, import_react.useState)("");
	const clients = query.data?.clients ?? [];
	const snapshots = query.data?.snapshots ?? [];
	const youtubeDataApi = query.data?.youtubeDataApi === true;
	const active = (0, import_react.useMemo)(() => clients.filter((row) => row.status === "ACTIVE" && !row.deletedAt), [clients]);
	const latestMap = (0, import_react.useMemo)(() => latestByClient(snapshots), [snapshots]);
	const rows = (0, import_react.useMemo)(() => active.map((client) => ({
		client,
		latest: latestMap.get(client.id) ?? null
	})), [active, latestMap]);
	const selected = selectedId ? clients.find((row) => row.id === selectedId) ?? null : null;
	const history = selected ? snapshotsForClient(snapshots, selected.id) : [];
	const latest = selected ? latestMap.get(selected.id) ?? null : null;
	const totals = aggregateLatest(rows);
	const connect = useMutation({
		mutationFn: () => connectChannel({ data: {
			input: channelInput.trim(),
			clientId: linkClientId || selectedId || null
		} }),
		onSuccess: async (result) => {
			if (!result.ok) {
				toast.error("No matching client. Create or pick a client, then connect.");
				return;
			}
			toast.success(result.alreadyLinked ? `${result.client.name} already has this channel` : `Connected ${result.channelTitle} to ${result.client.name}`);
			setChannelInput("");
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
			navigate({ search: { client: result.client.id } });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const pull = useMutation({
		mutationFn: (clientId) => pullAnalytics({ data: { clientId } }),
		onSuccess: async () => {
			toast.success("Analytics snapshot updated");
			await queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function selectClient(id) {
		navigate({ search: { client: id } });
	}
	const loading = query.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Analytics",
				description: "Subscribers, views, and video stats from stored snapshots — never from a live API response held only in memory.",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						disabled: pull.isPending || !youtubeDataApi,
						onClick: () => pull.mutate(selectedId ?? null),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
							className: `size-4 ${pull.isPending ? "animate-spin" : ""}`,
							"aria-hidden": "true"
						}), pull.isPending ? "Pulling…" : selected ? "Refresh Analytics" : "Pull latest"]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				role: "group",
				"aria-label": "Client filter",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: "All clients",
					active: !selectedId,
					onClick: () => selectClient(void 0)
				}), active.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: client.name,
					active: selectedId === client.id,
					onClick: () => selectClient(client.id)
				}, client.id))]
			}),
			!youtubeDataApi ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {
					title: "Automated YouTube pulls will be available once you connect your API key",
					integration: "youtube"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectBar, {
				value: channelInput,
				onChange: setChannelInput,
				clients: active,
				linkClientId: linkClientId || selectedId || "",
				onLinkClient: setLinkClientId,
				pending: connect.isPending,
				onConnect: () => {
					const parsed = parseYouTubeChannelUrl(channelInput);
					if (!parsed.ok) {
						toast.error(parsed.error);
						return;
					}
					connect.mutate();
				}
			}),
			query.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					title: "Couldn’t load analytics",
					description: "Workspace snapshots couldn’t be read. Try again.",
					onRetry: () => void query.refetch()
				})
			}) : selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Client dashboard",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-card font-semibold tracking-tight",
										children: selected.name
									}),
									selected.channelUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: selected.channelUrl,
										target: "_blank",
										rel: "noreferrer",
										className: "mt-1 inline-flex min-h-11 items-center text-caption text-accent",
										children: "Open channel"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-caption text-muted",
										children: "No channel connected yet."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-caption text-muted",
										children: [
											"Last snapshot",
											" ",
											latest ? `${formatDate(latest.date)} · ${formatRelativeTime(latest.updatedAt)}` : "never"
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								disabled: pull.isPending || !youtubeDataApi || !selected.channelUrl,
								onClick: () => pull.mutate(selected.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Refresh Analytics"]
							})]
						}) })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Metrics",
						children: latest || loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricRow, {
							subscribers: latest?.subscribersN ?? null,
							views: latest?.viewsN ?? null,
							ctr: averageCtr(history),
							watchHours: latest?.watchHoursN ?? null,
							loading
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							title: "No snapshots for this client",
							description: "Pull from YouTube or enter the first snapshot manually.",
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									disabled: !youtubeDataApi || !selected.channelUrl || pull.isPending,
									onClick: () => pull.mutate(selected.id),
									children: "Refresh Analytics"
								})
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Trends",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsCharts, {
							history,
							loading
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Top videos",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopVideos, {
							videos: latest?.videos ?? [],
							loading
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Published performance",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublishedPerformance, {
							rows: performanceQuery.data?.posts ?? [],
							metricsApi: performanceQuery.data?.metricsApi ?? {
								youtube: youtubeDataApi,
								x: false,
								tiktok: false,
								instagram: false
							},
							clientId: selected.id,
							clientNames: new Map(clients.map((row) => [row.id, row.name]))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Manual entry",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualEntryForm, {
							clients,
							selectedClientId: selected.id
						})
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Overview",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricRow, {
							subscribers: null,
							views: null,
							ctr: null,
							watchHours: null,
							loading: true
						}) : active.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							title: "No active clients",
							description: "Add a client first, then connect their YouTube channel.",
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/clients",
									children: "Go to Clients"
								})
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsMetricRow, {
							subscribers: totals.subscribers,
							views: totals.views,
							ctr: totals.ctr,
							watchHours: totals.watchHours
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "All clients",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" }, i))
						}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							title: "Nothing to compare yet",
							description: "Active clients appear here with their latest snapshot."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-left",
								onClick: () => selectClient(row.client.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
									interactive: true,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-card font-semibold tracking-tight",
											children: row.client.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: statusTone(row.client.channelUrl ? "CONNECTED" : "PENDING"),
											children: row.client.channelUrl ? "Channel" : "No channel"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-3 grid grid-cols-2 gap-2 text-caption",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-muted",
												children: "Subscribers"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "tabular-nums",
												children: formatCompactCount(row.latest?.subscribersN ?? null)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-muted",
												children: "Views"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "tabular-nums",
												children: formatCompactCount(row.latest?.viewsN ?? null)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-muted",
												children: "CTR"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "tabular-nums",
												children: row.latest?.ctrN == null ? "—" : `${row.latest.ctrN.toFixed(2)}%`
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-muted",
												children: "Updated"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: row.latest ? formatDate(row.latest.date) : "—" })] })
										]
									})]
								})
							}, row.client.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Published performance",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublishedPerformance, {
							rows: performanceQuery.data?.posts ?? [],
							metricsApi: performanceQuery.data?.metricsApi ?? {
								youtube: youtubeDataApi,
								x: false,
								tiktok: false,
								instagram: false
							},
							clientNames: new Map(clients.map((row) => [row.id, row.name]))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Manual entry",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualEntryForm, {
							clients,
							selectedClientId: null
						})
					})
				]
			})
		]
	});
}
function ConnectBar({ value, onChange, clients, linkClientId, onLinkClient, pending, onConnect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "mt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "Connect channel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Paste a YouTube URL or channel ID (UC…). We match an existing client instead of creating orphan stats."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-3 lg:flex-row lg:items-end",
				onSubmit: (event) => {
					event.preventDefault();
					onConnect();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "channel-input",
							children: "Channel URL or ID"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "channel-input",
							className: "mt-1.5",
							placeholder: "https://www.youtube.com/@handle or UC…",
							value,
							onChange: (event) => onChange(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full lg:w-56",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "link-client",
							children: "Link to client"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "link-client",
							className: "mt-1.5 min-h-11 w-full rounded-button border border-border bg-elevated px-3 text-body",
							value: linkClientId,
							onChange: (event) => onLinkClient(event.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Auto-match"
							}), clients.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: client.id,
								children: client.name
							}, client.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: pending || value.trim().length < 3,
						children: pending ? "Connecting…" : "Connect"
					})
				]
			})
		]
	});
}
//#endregion
export { AnalyticsPage as component };
