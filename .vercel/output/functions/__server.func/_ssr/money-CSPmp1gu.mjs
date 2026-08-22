import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as formatDate, c as formatUsd, d as todayIsoDate, i as formatCompactUsd, o as formatPercent } from "./format-DaT2NYM9.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as deriveMoney, n as MONEY_PERIOD_LABELS, r as MONEY_QUERY_KEY, t as MONEY_PERIODS } from "./money-n66k7fz5.mjs";
import { _ as PLAN_TONES, g as PLAN_LABELS, h as PAYMENT_TYPE_LABELS, m as PAYMENT_STATUS_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { t as getMoneySnapshot } from "./money-BLxnpxZv.mjs";
import { Lt as ArrowDown, Nt as ArrowUp, O as Search } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as GlassCard, D as usePrefersReducedMotion, O as cn, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as FilterChip } from "./filter-chip-BzSrTvLw.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, f as Legend, i as YAxis, l as Bar, n as BarChart, o as Area, r as LineChart, s as Line, t as AreaChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
import { t as useMarkPaymentPaid } from "./use-mark-payment-paid-DS6VRsGH.mjs";
import { n as MetricCardRowSkeleton, t as MetricCard } from "./metric-card-3PC2FfKw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/money-CSPmp1gu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MrrBreakdown({ rows, total, loading }) {
	const [sortKey, setSortKey] = (0, import_react.useState)("name");
	const [sortDir, setSortDir] = (0, import_react.useState)("asc");
	const sorted = (0, import_react.useMemo)(() => {
		const copy = [...rows];
		copy.sort((a, b) => {
			const cmp = sortKey === "name" ? a.name.localeCompare(b.name) : a.monthlyFee - b.monthlyFee;
			return sortDir === "asc" ? cmp : -cmp;
		});
		return copy;
	}, [
		rows,
		sortKey,
		sortDir
	]);
	function toggle(next) {
		if (sortKey === next) {
			setSortDir((dir) => dir === "asc" ? "desc" : "asc");
			return;
		}
		setSortKey(next);
		setSortDir(next === "fee" ? "desc" : "asc");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "overflow-hidden p-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-end justify-between gap-3 px-5 pt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "MRR Breakdown"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Active clients only"
			})] })
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2 p-5",
			children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }, index))
		}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-5 py-8 text-body text-muted",
			children: "No active clients. Add an active client to see contracted monthly recurring revenue."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 hidden overflow-x-auto md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-full text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
						className: "sr-only",
						children: "Monthly recurring revenue by active client"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-y border-border text-caption text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader$1, {
									label: "Client",
									active: sortKey === "name",
									dir: sortDir,
									onClick: () => toggle("name")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3",
								children: "Plan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader$1, {
									label: "Monthly fee",
									active: sortKey === "fee",
									dir: sortDir,
									onClick: () => toggle("fee")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3",
								children: "Setup fee"
							})
						]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sorted.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/clients/$clientId",
									params: { clientId: row.clientId },
									className: "inline-flex min-h-11 items-center font-medium text-fg hover:text-accent",
									children: row.name
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									tone: PLAN_TONES[row.planType],
									children: [PLAN_LABELS[row.planType], row.planType === "CUSTOM" && row.customPlanLabel ? ` · ${row.customPlanLabel}` : ""]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-3 tabular-nums",
								children: formatUsd(row.monthlyFee)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: row.setup.tone,
									children: row.setup.label
								})
							})
						]
					}, row.clientId)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-body font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-4",
								colSpan: 2,
								children: "Current MRR"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-4 tabular-nums",
								children: formatUsd(total)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-4" })
						]
					}) })
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-3 flex flex-col gap-2 px-5 pb-5 md:hidden",
			children: [sorted.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-control bg-secondary-surface/50 px-3 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/clients/$clientId",
					params: { clientId: row.clientId },
					className: "flex min-h-11 items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-medium",
							children: row.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-caption text-muted",
							children: [
								PLAN_LABELS[row.planType],
								" · ",
								row.setup.label
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 tabular-nums",
						children: formatUsd(row.monthlyFee)
					})]
				})
			}, row.clientId)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between px-1 pt-1 font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Current MRR" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums",
					children: formatUsd(total)
				})]
			})]
		})] })]
	});
}
function SortHeader$1({ label, active, dir, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("inline-flex min-h-11 items-center gap-1 font-medium", active ? "text-fg" : "text-muted"),
		"aria-sort": active ? dir === "asc" ? "ascending" : "descending" : "none",
		children: [label, active ? dir === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
			className: "size-3.5",
			"aria-hidden": "true"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
			className: "size-3.5",
			"aria-hidden": "true"
		}) : null]
	});
}
var STATUS_RANK = {
	OVERDUE: 0,
	PENDING: 1,
	PAID: 2
};
function PaymentTracker({ rows, loading }) {
	const paidMut = useMarkPaymentPaid("money-mark-paid");
	const [search, setSearch] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("ALL");
	const [sortKey, setSortKey] = (0, import_react.useState)("status");
	const [sortDir, setSortDir] = (0, import_react.useState)("asc");
	const [pending, setPending] = (0, import_react.useState)(null);
	const filtered = (0, import_react.useMemo)(() => {
		const q = search.trim().toLowerCase();
		const copy = rows.filter((row) => {
			if (status !== "ALL" && row.displayStatus !== status) return false;
			if (!q) return true;
			return row.clientName.toLowerCase().includes(q);
		});
		copy.sort((a, b) => {
			let cmp = 0;
			if (sortKey === "name") cmp = a.clientName.localeCompare(b.clientName);
			else if (sortKey === "amount") cmp = a.amount - b.amount;
			else if (sortKey === "dueDate") cmp = a.dueDate.localeCompare(b.dueDate);
			else cmp = STATUS_RANK[a.displayStatus] - STATUS_RANK[b.displayStatus];
			if (cmp === 0) cmp = a.dueDate.localeCompare(b.dueDate);
			return sortDir === "asc" ? cmp : -cmp;
		});
		return copy;
	}, [
		rows,
		search,
		status,
		sortKey,
		sortDir
	]);
	function toggle(next) {
		if (sortKey === next) {
			setSortDir((dir) => dir === "asc" ? "desc" : "asc");
			return;
		}
		setSortKey(next);
		setSortDir("asc");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "overflow-hidden p-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "Payment Tracker"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: "Status is derived live. Overdue means still unpaid after the due date."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "pl-10",
							value: search,
							onChange: (event) => setSearch(event.target.value),
							placeholder: "Search by client…",
							"aria-label": "Search payments by client"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							"ALL",
							"OVERDUE",
							"PENDING",
							"PAID"
						].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							label: value === "ALL" ? "All" : PAYMENT_STATUS_LABELS[value],
							active: status === value,
							onClick: () => setStatus(value)
						}, value))
					})
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2 p-5",
				children: Array.from({ length: 4 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-14 w-full" }, index))
			}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-5 py-8 text-body text-muted",
				children: "No payments yet"
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-5 py-8 text-body text-muted",
				children: "No matching payments."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 flex flex-col gap-2 px-5 pb-5 md:hidden",
				children: filtered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-control bg-secondary-surface/50 px-3 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentRow, {
						row,
						busy: paidMut.isPending && paidMut.variables === row.id,
						onPay: () => setPending(row),
						compact: true
					})
				}, row.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 hidden overflow-x-auto md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-full text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "sr-only",
							children: "Client payments and collection status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-y border-border text-caption text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
										label: "Client",
										active: sortKey === "name",
										dir: sortDir,
										onClick: () => toggle("name")
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: "Type"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
										label: "Amount",
										active: sortKey === "amount",
										dir: sortDir,
										onClick: () => toggle("amount")
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
										label: "Due",
										active: sortKey === "dueDate",
										dir: sortDir,
										onClick: () => toggle("dueDate")
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
										label: "Status",
										active: sortKey === "status",
										dir: sortDir,
										onClick: () => toggle("status")
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									scope: "col",
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Actions"
									})
								})
							]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border last:border-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentRow, {
								row,
								busy: paidMut.isPending && paidMut.variables === row.id,
								onPay: () => setPending(row)
							})
						}, row.id)) })
					]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pending),
				onOpenChange: (open) => !open && setPending(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Mark as paid?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: pending ? `Record ${formatUsd(pending.amount)} from ${pending.clientName} as paid today. Amount, due date, and type stay the same.` : null }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: !pending || paidMut.isPending,
							onClick: () => {
								if (!pending) return;
								const id = pending.id;
								setPending(null);
								paidMut.mutate(id);
							},
							children: "Mark as paid"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setPending(null),
							children: "Cancel"
						})]
					})
				] })
			})
		]
	});
}
function PaymentRow({ row, busy, onPay, compact = false }) {
	const action = row.displayStatus === "PAID" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		size: "sm",
		variant: "secondary",
		disabled: busy,
		onClick: onPay,
		"aria-label": `Mark ${row.clientName} ${formatUsd(row.amount)} as paid`,
		children: busy ? "Saving…" : "Mark as Paid"
	});
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/clients/$clientId",
					params: { clientId: row.clientId },
					className: "font-medium text-fg hover:text-accent",
					children: row.clientName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-caption text-muted",
					children: [
						PAYMENT_TYPE_LABELS[row.type],
						" · Due ",
						formatDate(row.dueDate)
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tabular-nums",
				children: formatUsd(row.amount)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone(row.displayStatus),
				children: PAYMENT_STATUS_LABELS[row.displayStatus]
			}), action]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/clients/$clientId",
				params: { clientId: row.clientId },
				className: "inline-flex min-h-11 items-center font-medium text-fg hover:text-accent",
				children: row.clientName
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-2 text-caption text-muted",
			children: PAYMENT_TYPE_LABELS[row.type]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-2 tabular-nums",
			children: formatUsd(row.amount)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-2 text-caption",
			children: formatDate(row.dueDate)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone(row.displayStatus),
				children: PAYMENT_STATUS_LABELS[row.displayStatus]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-5 py-2 text-right",
			children: action
		})
	] });
}
function SortHeader({ label, active, dir, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("inline-flex min-h-11 items-center gap-1 font-medium", active ? "text-fg" : "text-muted"),
		"aria-sort": active ? dir === "asc" ? "ascending" : "descending" : "none",
		children: [label, active ? dir === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
			className: "size-3.5",
			"aria-hidden": "true"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
			className: "size-3.5",
			"aria-hidden": "true"
		}) : null]
	});
}
function CostProfit({ rows, teamCost, revenue, profit, marginPct, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "overflow-hidden p-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pt-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "Cost & Profit"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Profit is monthly fee minus assigned team cost. Missing team rows count as $0. Soft-deleted members are excluded."
			})]
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2 p-5",
			children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }, index))
		}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-5 py-8 text-body text-muted",
			children: "No active clients to measure yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-full text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
						className: "sr-only",
						children: "Per-client cost, revenue, and margin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-y border-border text-caption text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-5 py-3 font-medium",
								children: "Client"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3 py-3 font-medium",
								children: "Team cost"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3 py-3 font-medium",
								children: "Revenue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-3 py-3 font-medium",
								children: "Profit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								scope: "col",
								className: "px-5 py-3 font-medium",
								children: "Margin"
							})
						]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/clients/$clientId",
									params: { clientId: row.clientId },
									className: "inline-flex min-h-11 items-center font-medium text-fg hover:text-accent",
									children: row.name
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: formatUsd(row.teamCost)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums",
								children: formatUsd(row.revenue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-3 py-2 tabular-nums", signedTone(row.profit)),
								children: formatUsd(row.profit)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-5 py-2 tabular-nums", signedTone(row.profit)),
								children: row.marginPct == null ? "—" : formatPercent(row.marginPct, 0)
							})
						]
					}, row.clientId)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-body font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-4",
								children: "Agency total"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-4 tabular-nums",
								children: formatUsd(teamCost)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-4 tabular-nums",
								children: formatUsd(revenue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-3 py-4 tabular-nums", signedTone(profit)),
								children: formatUsd(profit)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-5 py-4 tabular-nums", signedTone(profit)),
								children: marginPct == null ? "—" : formatPercent(marginPct, 0)
							})
						]
					}) })
				]
			})
		})]
	});
}
function signedTone(value) {
	if (value < 0) return "text-danger";
	if (value > 0) return "text-success";
	return "";
}
var tooltipStyle = {
	background: "var(--elevated)",
	border: "0.5px solid var(--border)",
	borderRadius: "12px",
	color: "var(--fg)",
	fontSize: 13
};
function MoneyCharts({ derived, loading }) {
	const reduceMotion = usePrefersReducedMotion();
	const months = derived?.months ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
				title: "MRR Growth Over Time",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					title: "MRR Growth Over Time",
					caption: "Solid line is cash collected from paid monthly invoices. Dotted line is contracted MRR from the current active roster (not audited history).",
					loading,
					empty: !loading && !derived?.hasMrrGrowth,
					chart: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: months,
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
									tickFormatter: (value) => formatCompactUsd(value),
									tickCount: 5,
									width: 44
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: tooltipStyle,
									formatter: (value) => formatUsd(Number(value ?? 0))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "collectedMonthly",
									name: "Collected",
									stroke: "var(--accent)",
									fill: "var(--accent)",
									fillOpacity: .18,
									isAnimationActive: !reduceMotion
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "contractedMrr",
									name: "Contracted",
									stroke: "var(--teal)",
									strokeWidth: 2,
									strokeDasharray: "4 4",
									dot: false,
									isAnimationActive: !reduceMotion
								})
							]
						})
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthTable, {
						months,
						columns: [{
							key: "collectedMonthly",
							label: "Collected"
						}, {
							key: "contractedMrr",
							label: "Contracted"
						}]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
				title: "Revenue vs Costs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					title: "Revenue vs Costs",
					caption: "Revenue is all paid invoices in that month. Costs use live team assignments — there are no historical cost snapshots, so each month shows current active-client team cost.",
					loading,
					empty: !loading && !derived?.hasRevenueVsCosts,
					chart: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: months,
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
									tickFormatter: (value) => formatCompactUsd(value),
									tickCount: 5,
									width: 44
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: tooltipStyle,
									formatter: (value) => formatUsd(Number(value ?? 0))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "collectedAll",
									name: "Revenue",
									fill: "var(--accent)",
									radius: [
										6,
										6,
										0,
										0
									],
									isAnimationActive: !reduceMotion
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "teamCosts",
									name: "Team cost",
									fill: "var(--warning)",
									radius: [
										6,
										6,
										0,
										0
									],
									isAnimationActive: !reduceMotion
								})
							]
						})
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthTable, {
						months,
						columns: [{
							key: "collectedAll",
							label: "Revenue"
						}, {
							key: "teamCosts",
							label: "Team cost"
						}]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Payment Collection Rate",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ChartCard, {
						title: "Payment Collection Rate",
						caption: "Paid amounts ÷ amounts due through today in the selected window.",
						loading,
						empty: !loading && !derived?.hasCollectionHistory,
						chart: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
								data: months,
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
										domain: [0, 100],
										tickFormatter: (value) => `${value}%`,
										width: 48
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
										contentStyle: tooltipStyle,
										formatter: (value) => formatPercent(Number(value ?? 0), 0)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "collectionRate",
										name: "Monthly rate",
										stroke: "var(--success)",
										strokeWidth: 2,
										dot: false,
										isAnimationActive: !reduceMotion
									})
								]
							})
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-page font-semibold tracking-tight tabular-nums",
									children: formatPercent(derived?.collectionRate ?? 0, 0)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-caption text-muted",
									children: [
										formatUsd(derived?.collectionPaid ?? 0),
										" collected of",
										" ",
										formatUsd(derived?.collectionDue ?? 0),
										" due"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 h-3 overflow-hidden rounded-full bg-secondary-surface",
									role: "progressbar",
									"aria-valuemin": 0,
									"aria-valuemax": 100,
									"aria-valuenow": Math.round(derived?.collectionRate ?? 0),
									"aria-label": "Collection rate",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full rounded-full bg-success transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
										style: { width: `${Math.min(100, Math.max(0, derived?.collectionRate ?? 0))}%` }
									})
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthTable, {
							months,
							columns: [{
								key: "collectionRate",
								label: "Rate",
								kind: "percent"
							}]
						})]
					})
				})
			})
		]
	});
}
function ChartCard({ title, caption, loading, empty, className, chart, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: caption
			}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 h-64 w-full min-w-0",
				children: [
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-full w-full" }) : null,
					!loading && empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-full place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body text-muted",
							children: "Not enough data yet"
						})
					}) : null,
					!loading && !empty ? chart : null
				]
			})
		]
	});
}
function MonthTable({ months, columns }) {
	if (months.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "sr-only",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Month" }), columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: column.label }, column.key))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: months.map((month) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: month.label }), columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: column.kind === "percent" ? formatPercent(month[column.key], 0) : formatUsd(month[column.key]) }, column.key))] }, month.key)) })]
	});
}
function MoneyPage() {
	const [period, setPeriod] = (0, import_react.useState)("all");
	const snapshotQuery = useQuery({
		queryKey: MONEY_QUERY_KEY,
		queryFn: () => getMoneySnapshot()
	});
	const today = todayIsoDate();
	const derived = (0, import_react.useMemo)(() => {
		if (!snapshotQuery.data) return null;
		return deriveMoney(snapshotQuery.data, period, today);
	}, [
		snapshotQuery.data,
		period,
		today
	]);
	const loading = snapshotQuery.isPending;
	const profitTone = !derived || derived.overallProfit === 0 ? "default" : derived.overallProfit > 0 ? "success" : "danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Money",
			description: "Live totals from clients, payments, and team costs — nothing is stored as a rollup.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				role: "group",
				"aria-label": "Reporting period",
				children: MONEY_PERIODS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					label: MONEY_PERIOD_LABELS[value],
					active: period === value,
					onClick: () => setPeriod(value)
				}, value))
			})
		}), snapshotQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "Couldn’t load money",
				description: "Workspace totals couldn’t be calculated. Try again.",
				onRetry: () => void snapshotQuery.refetch()
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Revenue overview",
					children: loading || !derived ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCardRowSkeleton, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Total Revenue",
								value: formatUsd(derived.totalRevenue),
								amount: derived.totalRevenue,
								hint: MONEY_PERIOD_LABELS[period]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Current MRR",
								value: formatUsd(derived.currentMrr),
								amount: derived.currentMrr,
								hint: "Active clients · monthly recurring"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Projected Annual",
								value: formatUsd(derived.projectedAnnual),
								amount: derived.projectedAnnual,
								hint: "Current MRR × 12"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Overall Profit",
								value: formatUsd(derived.overallProfit),
								amount: derived.overallProfit,
								hint: derived.overallMarginPct == null ? "Monthly · active roster" : `${formatPercent(derived.overallMarginPct, 0)} margin`,
								tone: profitTone
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "MRR Breakdown",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MrrBreakdown, {
						rows: derived?.mrrRows ?? [],
						total: derived?.currentMrr ?? 0,
						loading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Payment Tracker",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentTracker, {
						rows: derived?.paymentRows ?? [],
						loading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
					title: "Cost & Profit",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CostProfit, {
						rows: derived?.profitRows ?? [],
						teamCost: derived?.overallTeamCost ?? 0,
						revenue: derived?.currentMrr ?? 0,
						profit: derived?.overallProfit ?? 0,
						marginPct: derived?.overallMarginPct ?? null,
						loading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCharts, {
					derived,
					loading
				})
			]
		})]
	});
}
//#endregion
export { MoneyPage as component };
