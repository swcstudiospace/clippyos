import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as formatUsd, d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as deriveMoney, i as asMoney, l as monthKey, r as MONEY_QUERY_KEY } from "./money-n66k7fz5.mjs";
import { h as PAYMENT_TYPE_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { t as getMoneySnapshot } from "./money-BLxnpxZv.mjs";
import { Ct as ChevronRight, wt as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as GlassCard, O as cn, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as FilterChip } from "./filter-chip-BzSrTvLw.mjs";
import { t as useMarkPaymentPaid } from "./use-mark-payment-paid-DS6VRsGH.mjs";
import { t as MetricCard } from "./metric-card-3PC2FfKw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-W6DgLJ5T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKDAY_LABELS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
function shiftMonth(year, month, delta) {
	const date = new Date(Date.UTC(year, month - 1 + delta, 1));
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1
	};
}
function monthTitle(year, month) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}
function monthGrid(year, month, today) {
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const cells = [];
	for (let i = 0; i < firstWeekday; i += 1) cells.push({
		iso: "",
		day: 0,
		inMonth: false,
		isToday: false
	});
	for (let day = 1; day <= days; day += 1) {
		const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		cells.push({
			iso,
			day,
			inMonth: true,
			isToday: iso === today
		});
	}
	while (cells.length % 7 !== 0) cells.push({
		iso: "",
		day: 0,
		inMonth: false,
		isToday: false
	});
	return cells;
}
function paymentsForMonth(payments, year, month) {
	const key = `${year}-${String(month).padStart(2, "0")}`;
	return payments.filter((row) => monthKey(row.dueDate) === key);
}
function groupPaymentsByDueDate(rows) {
	const map = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const list = map.get(row.dueDate) ?? [];
		list.push(row);
		map.set(row.dueDate, list);
	}
	for (const list of map.values()) list.sort((a, b) => {
		const rank = (status) => status === "OVERDUE" ? 0 : status === "PENDING" ? 1 : 2;
		const byStatus = rank(a.displayStatus) - rank(b.displayStatus);
		if (byStatus !== 0) return byStatus;
		return a.clientName.localeCompare(b.clientName);
	});
	return map;
}
function cashCollected(payments, scope, month) {
	let total = 0;
	for (const payment of payments) {
		if (payment.status !== "PAID" || !payment.paidDate) continue;
		if (scope === "month" && monthKey(payment.paidDate) !== month) continue;
		total += asMoney(payment.amount);
	}
	return total;
}
function markerTone(status) {
	if (status === "PAID") return "green";
	if (status === "OVERDUE") return "red";
	return "orange";
}
function CalendarMonthView({ payments, rows, today, loading }) {
	const todayDate = /* @__PURE__ */ new Date(`${today}T00:00:00Z`);
	const [cursor, setCursor] = (0, import_react.useState)({
		year: todayDate.getUTCFullYear(),
		month: todayDate.getUTCMonth() + 1
	});
	const [scope, setScope] = (0, import_react.useState)("month");
	const [pending, setPending] = (0, import_react.useState)(null);
	const [daySheet, setDaySheet] = (0, import_react.useState)(null);
	const paidMut = useMarkPaymentPaid("calendar-mark-paid");
	const viewedKey = `${cursor.year}-${String(cursor.month).padStart(2, "0")}`;
	const cells = (0, import_react.useMemo)(() => monthGrid(cursor.year, cursor.month, today), [
		cursor.year,
		cursor.month,
		today
	]);
	const monthRows = (0, import_react.useMemo)(() => paymentsForMonth(rows, cursor.year, cursor.month), [
		rows,
		cursor.year,
		cursor.month
	]);
	const grouped = (0, import_react.useMemo)(() => groupPaymentsByDueDate(monthRows), [monthRows]);
	const collected = cashCollected(payments, scope, scope === "month" ? viewedKey : monthKey(today));
	const viewingCurrent = cursor.year === todayDate.getUTCFullYear() && cursor.month === todayDate.getUTCMonth() + 1;
	function requestCollect(row) {
		if (row.displayStatus === "PAID") return;
		if (row.amount >= 5e3) {
			setPending(row);
			return;
		}
		paidMut.mutate(row.id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-14 z-10 grid gap-3 sm:static sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
					label: "Cash collected",
					value: formatUsd(collected),
					amount: collected,
					hint: scope === "all" ? "All-time paid invoices" : `Paid in ${monthTitle(cursor.year, cursor.month)}`,
					loading,
					tone: "success"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "flex flex-col justify-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Collection window"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						role: "group",
						"aria-label": "Cash collected range",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							label: monthTitle(cursor.year, cursor.month),
							active: scope === "month",
							onClick: () => setScope("month")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
							label: "All time",
							active: scope === "all",
							onClick: () => setScope("all")
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "overflow-hidden p-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									size: "icon",
									"aria-label": "Previous month",
									onClick: () => setCursor((value) => shiftMonth(value.year, value.month, -1)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "min-w-36 flex-1 text-center text-card font-semibold tracking-tight sm:flex-none",
									children: monthTitle(cursor.year, cursor.month)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									size: "icon",
									"aria-label": "Next month",
									onClick: () => setCursor((value) => shiftMonth(value.year, value.month, 1)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full sm:w-auto",
							variant: viewingCurrent ? "ghost" : "secondary",
							disabled: viewingCurrent,
							onClick: () => setCursor({
								year: todayDate.getUTCFullYear(),
								month: todayDate.getUTCMonth() + 1
							}),
							children: "Today"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-7 border-t border-border text-center text-caption text-muted",
						children: WEEKDAY_LABELS.map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-1 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "sm:hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: label.slice(0, 1)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: label
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: label
							})]
						}, label))
					}),
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-7 border-t border-border",
						children: Array.from({ length: 35 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-24 border-border p-2 not-first:border-l [&:nth-child(n+8)]:border-t",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-full w-full" })
						}, index))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-7 border-t border-border",
						children: cells.map((cell, index) => {
							const dayRows = cell.iso ? grouped.get(cell.iso) ?? [] : [];
							const visible = dayRows.slice(0, 2);
							const extra = dayRows.length - visible.length;
							const CellTag = cell.inMonth ? "button" : "div";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CellTag, {
								type: cell.inMonth ? "button" : void 0,
								onClick: cell.inMonth && cell.iso ? () => setDaySheet(cell.iso) : void 0,
								className: cn("min-h-11 border-border p-1.5 text-left sm:min-h-28 sm:p-2", index % 7 !== 0 && "border-l", index >= 7 && "border-t", cell.isToday && "bg-accent/8 motion-safe:animate-pulse-glow", !cell.inMonth && "bg-secondary-surface/20", cell.inMonth && "hover:bg-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"),
								children: cell.inMonth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: cn("text-caption tabular-nums", cell.isToday ? "font-semibold text-accent" : "text-muted"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sr-only",
											children: [cell.isToday ? "Today, " : "", cell.iso]
										}), cell.day]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
										className: "mt-1 hidden flex-col gap-1 md:flex",
										children: [visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkerButton, {
											row,
											busy: paidMut.isPending && paidMut.variables === row.id,
											onCollect: () => requestCollect(row)
										}) }, row.id)), extra > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "text-caption text-muted",
											children: [
												"+",
												extra,
												" more"
											]
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 flex flex-wrap gap-1 md:hidden",
										"aria-hidden": "true",
										children: dayRows.slice(0, 4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", markerTone(row.displayStatus) === "green" && "bg-success", markerTone(row.displayStatus) === "orange" && "bg-warning", markerTone(row.displayStatus) === "red" && "bg-danger") }, row.id))
									})
								] }) : null
							}, `${cell.iso}-${index}`);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "md:hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "This month’s payments"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: "Tap a pending or overdue row to mark it collected."
					}),
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: Array.from({ length: 3 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-14 w-full" }, index))
					}) : monthRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-body text-muted",
						children: "No invoices due this month."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-2",
						children: monthRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgendaRow, {
							row,
							busy: paidMut.isPending && paidMut.variables === row.id,
							onCollect: () => requestCollect(row)
						}) }, row.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block",
				children: loading ? null : monthRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: "No invoices this month",
					description: "Payments appear on the day they are due. Mark collected turns the marker green and adds to cash collected."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Agenda"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 flex flex-col gap-2",
					children: monthRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgendaRow, {
						row,
						busy: paidMut.isPending && paidMut.variables === row.id,
						onCollect: () => requestCollect(row)
					}) }, row.id))
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: Boolean(daySheet),
				onOpenChange: (open) => !open && setDaySheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "md:max-w-lg md:mx-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: daySheet ? `Payments on ${daySheet}` : "Payments" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Tap an unpaid invoice to mark it collected. Same action as Money." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex flex-col gap-2",
							children: (daySheet ? grouped.get(daySheet) ?? [] : []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-body text-muted",
								children: "No invoices due this day."
							}) : (grouped.get(daySheet ?? "") ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgendaRow, {
								row,
								busy: paidMut.isPending && paidMut.variables === row.id,
								onCollect: () => {
									setDaySheet(null);
									requestCollect(row);
								}
							}) }, row.id))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pending),
				onOpenChange: (open) => !open && setPending(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Mark as collected?" }),
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
							children: "Mark collected"
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
function MarkerButton({ row, busy, onCollect }) {
	const tone = markerTone(row.displayStatus);
	const paid = row.displayStatus === "PAID";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled: paid || busy,
		onClick: onCollect,
		className: cn("flex min-h-11 w-full flex-col items-start rounded-control px-2 py-1.5 text-left text-caption leading-tight transition-[background-color,transform] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:not-disabled:scale-[0.98]", tone === "green" && "bg-success/15 text-success", tone === "orange" && "bg-warning/15 text-warning", tone === "red" && "bg-danger/15 text-danger"),
		"aria-label": paid ? `Collected ${formatUsd(row.amount)} from ${row.clientName}` : `Mark ${formatUsd(row.amount)} from ${row.clientName} as collected`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-full truncate font-medium",
			children: row.clientName
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: formatUsd(row.amount)
		})]
	});
}
function AgendaRow({ row, busy, onCollect }) {
	const paid = row.displayStatus === "PAID";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate font-medium",
				children: row.clientName
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-caption text-muted",
				children: [
					row.dueDate,
					" · ",
					PAYMENT_TYPE_LABELS[row.type],
					" · ",
					formatUsd(row.amount)
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: statusTone(row.displayStatus),
				children: row.displayStatus === "PAID" ? "Collected" : row.displayStatus === "OVERDUE" ? "Overdue" : "Pending"
			}), paid ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				disabled: busy,
				onClick: onCollect,
				"aria-label": `Mark ${row.clientName} ${formatUsd(row.amount)} as collected`,
				children: busy ? "Saving…" : "Mark collected"
			})]
		})]
	});
}
function CalendarPage() {
	const today = todayIsoDate();
	const snapshotQuery = useQuery({
		queryKey: MONEY_QUERY_KEY,
		queryFn: () => getMoneySnapshot()
	});
	const derived = (0, import_react.useMemo)(() => {
		if (!snapshotQuery.data) return null;
		return deriveMoney(snapshotQuery.data, "all", today);
	}, [snapshotQuery.data, today]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Calendar",
			description: "Monthly collection tracker. Mark collected uses the same paid mutation as Money — markers turn green immediately."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: snapshotQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "Couldn’t load the calendar",
				description: "Payment due dates couldn’t be read. Try again.",
				onRetry: () => void snapshotQuery.refetch()
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
				title: "Payment calendar",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarMonthView, {
					payments: snapshotQuery.data?.payments ?? [],
					rows: derived?.paymentRows ?? [],
					today,
					loading: snapshotQuery.isPending
				})
			})
		})]
	});
}
//#endregion
export { CalendarPage as component };
