import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as formatUsd } from "./format-DaT2NYM9.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { r as MONEY_QUERY_KEY } from "./money-n66k7fz5.mjs";
import { v as ROLE_LABELS, y as ROLE_TONES } from "./dashboard-Dk6DLyWe.mjs";
import { t as getMoneySnapshot } from "./money-BLxnpxZv.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as GlassCard, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as BlurFade } from "./blur-fade-Bh-jVmMj.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as MetricCard } from "./metric-card-3PC2FfKw.mjs";
import { t as deriveTeam } from "./team-BcQx73mj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/team-BM9NEPE1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AllocationLanes({ lanes, loading }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: Array.from({ length: 2 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-40" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-12 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-12 w-full" })
		] }, index))
	});
	if (lanes.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "No active clients",
		description: "Allocation lanes appear once you add an active client. Team costs stay attached to each roster.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/clients",
				children: "Open clients"
			})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: lanes.map((lane, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
			delay: Math.min(index * .04, .2),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/clients/$clientId",
						params: { clientId: lane.clientId },
						className: "text-card font-semibold tracking-tight hover:text-accent",
						children: lane.clientName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: lane.members.length === 0 ? "No team assigned" : `${lane.members.length} teammate${lane.members.length === 1 ? "" : "s"}`
					})]
				}),
				lane.members.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-body text-muted",
					children: "Assign editors and designers from the client record. Costs roll into the lane total."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 flex flex-col gap-2",
					children: lane.members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: ROLE_TONES[member.role],
								children: ROLE_LABELS[member.role]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: member.name
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums text-body",
							children: [formatUsd(member.cost), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-caption text-muted",
								children: " / mo"
							})]
						})]
					}, member.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-body font-medium",
					children: [
						"Total team cost:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatUsd(lane.totalCost)
						})
					]
				})
			] })
		}, lane.clientId))
	});
}
function CapacityTracker({ rows, loading }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-40" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-12 w-full" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-12 w-full" })
	] });
	if (rows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "Capacity tracker",
		description: `No one is assigned yet. Overloaded means more than 3 active clients.`
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Capacity tracker"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-caption text-muted",
			children: [
				"People are grouped by name across active clients. Overloaded means more than ",
				3,
				" clients."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: row.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: row.clientNames.join(", ")
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums text-body",
						children: [
							row.clientCount,
							" client",
							row.clientCount === 1 ? "" : "s"
						]
					}), row.overloaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: row.clientCount > 4 ? "red" : "orange",
						children: "Overloaded"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "green",
						children: "Healthy"
					})]
				})]
			}, row.key))
		})
	] });
}
function TeamPage() {
	const snapshotQuery = useQuery({
		queryKey: MONEY_QUERY_KEY,
		queryFn: () => getMoneySnapshot()
	});
	const derived = (0, import_react.useMemo)(() => {
		if (!snapshotQuery.data) return null;
		return deriveTeam(snapshotQuery.data.clients, snapshotQuery.data.teamMembers);
	}, [snapshotQuery.data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Team",
			description: `Allocation by client and capacity by person. Overloaded means more than 3 active clients.`
		}), snapshotQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "Couldn’t load team",
				description: "Assignments couldn’t be read. Try again.",
				onRetry: () => void snapshotQuery.refetch()
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Overview",
					children: snapshotQuery.isPending || !derived ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-card" }, index))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Team cost",
								value: formatUsd(derived.overallCost),
								amount: derived.overallCost,
								hint: "Sum of active-client lanes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "People assigned",
								value: String(derived.assignedPeople),
								hint: "Unique names on active clients"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Overloaded",
								value: String(derived.overloadedCount),
								hint: `Over 3 clients`,
								tone: derived.overloadedCount > 0 ? "danger" : "default"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Capacity",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapacityTracker, {
						rows: derived?.capacity ?? [],
						loading: snapshotQuery.isPending
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Allocation lanes",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationLanes, {
						lanes: derived?.lanes ?? [],
						loading: snapshotQuery.isPending
					})
				})
			]
		})]
	});
}
//#endregion
export { TeamPage as component };
