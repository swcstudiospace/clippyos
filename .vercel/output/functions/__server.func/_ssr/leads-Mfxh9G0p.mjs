import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { u as LEAD_STATUSES } from "./mappers-Bmic_hyw.mjs";
import { c as formatUsd } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as asMoney } from "./money-n66k7fz5.mjs";
import { p as LEAD_STATUS_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { L as Pencil, N as Plus, O as Search, h as Trash2, ut as ExternalLink } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, a as saveLead, c as deriveLeadTotals, i as listLeads, m as userFacingErrorMessage, o as softDeleteLead, p as captureClientError, s as LEADS_QUERY_KEY, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as FilterChip } from "./filter-chip-BzSrTvLw.mjs";
import { t as MetricCard } from "./metric-card-3PC2FfKw.mjs";
import { t as CoolMode } from "./cool-mode-Dv_rzTHj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/leads-Mfxh9G0p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function emptyValues() {
	return {
		name: "",
		channelUrl: "",
		notes: "",
		status: "TO_CONTACT",
		upfrontCash: 0,
		monthlyRecurring: 0
	};
}
function fromLead(lead) {
	return {
		id: lead.id,
		name: lead.name,
		channelUrl: lead.channelUrl ?? "",
		notes: lead.notes ?? "",
		status: lead.status,
		upfrontCash: asMoney(lead.upfrontCash),
		monthlyRecurring: asMoney(lead.monthlyRecurring)
	};
}
function LeadModal({ open, onOpenChange, lead, busy, onSave }) {
	const [values, setValues] = (0, import_react.useState)(emptyValues());
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setValues(lead ? fromLead(lead) : emptyValues());
	}, [open, lead]);
	function submit(event) {
		event.preventDefault();
		const name = values.name.trim();
		if (!name) return;
		onSave({
			...values,
			name,
			channelUrl: values.channelUrl.trim(),
			notes: values.notes.trim(),
			upfrontCash: Math.max(0, Number(values.upfrontCash) || 0),
			monthlyRecurring: Math.max(0, Number(values.monthlyRecurring) || 0)
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "w-[min(100%-2rem,32rem)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: lead ? "Edit lead" : "Add lead" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Pipeline money is live. Closed leads still count toward won cash; lost leads do not." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "mt-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lead-name",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "lead-name",
								required: true,
								maxLength: 200,
								value: values.name,
								onChange: (event) => setValues((current) => ({
									...current,
									name: event.target.value
								})),
								placeholder: "Brand or founder"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lead-channel",
								children: "Channel URL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "lead-channel",
								type: "text",
								inputMode: "url",
								maxLength: 500,
								value: values.channelUrl,
								onChange: (event) => setValues((current) => ({
									...current,
									channelUrl: event.target.value
								})),
								placeholder: "https://youtube.com/@…"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "text-caption font-medium text-fg",
								children: "Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: LEAD_STATUSES.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
									label: LEAD_STATUS_LABELS[status],
									active: values.status === status,
									onClick: () => setValues((current) => ({
										...current,
										status
									}))
								}, status))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "lead-upfront",
									children: "Upfront cash"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "lead-upfront",
									type: "number",
									min: 0,
									step: 100,
									value: values.upfrontCash,
									onChange: (event) => setValues((current) => ({
										...current,
										upfrontCash: Number(event.target.value)
									}))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "lead-mrr",
									children: "Monthly recurring"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "lead-mrr",
									type: "number",
									min: 0,
									step: 100,
									value: values.monthlyRecurring,
									onChange: (event) => setValues((current) => ({
										...current,
										monthlyRecurring: Number(event.target.value)
									}))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lead-notes",
								children: "Notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "lead-notes",
								maxLength: 2e4,
								value: values.notes,
								onChange: (event) => setValues((current) => ({
									...current,
									notes: event.target.value
								})),
								placeholder: "How they found us, offer, next step…"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: busy || !values.name.trim(),
								children: busy ? "Saving…" : lead ? "Save lead" : "Add lead"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => onOpenChange(false),
								children: "Cancel"
							})]
						})
					]
				})
			]
		})
	});
}
function LeadPipeline({ leads, loading, onEdit, onDelete }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 lg:grid-cols-5",
		children: LEAD_STATUSES.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-24" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-20 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-20 w-full" })
		] }, status))
	});
	if (leads.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "No leads in this view",
		description: "Add a prospect to start the pipeline. Totals update from upfront cash and monthly recurring."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 md:grid-cols-2 xl:grid-cols-5",
		children: LEAD_STATUSES.map((status) => {
			const column = leads.filter((lead) => lead.status === status);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "h-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-caption font-semibold tracking-tight",
							children: LEAD_STATUS_LABELS[status]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(status),
							children: column.length
						})]
					}), column.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-caption text-muted",
						children: "Empty"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-2",
						children: column.map((lead) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadCard, {
							lead,
							onEdit,
							onDelete
						}) }, lead.id))
					})]
				})
			}, status);
		})
	});
}
function LeadCard({ lead, onEdit, onDelete }) {
	const excerpt = lead.notes?.trim() ? lead.notes.trim().length > 90 ? `${lead.notes.trim().slice(0, 90)}…` : lead.notes.trim() : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-control bg-secondary-surface/55 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "min-w-0 flex-1 font-medium tracking-tight",
					children: lead.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: statusTone(lead.status),
					children: LEAD_STATUS_LABELS[lead.status]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-caption tabular-nums text-muted",
				children: [
					formatUsd(lead.upfrontCash),
					" up front · ",
					formatUsd(lead.monthlyRecurring),
					" / mo"
				]
			}),
			lead.channelUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: lead.channelUrl,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-accent",
				children: ["Channel", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
					className: "size-3.5",
					"aria-hidden": "true"
				})]
			}) : null,
			excerpt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-caption text-muted",
				children: excerpt
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => onEdit(lead),
					"aria-label": `Edit ${lead.name}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Edit"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => onDelete(lead),
					"aria-label": `Remove ${lead.name}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Remove"]
				})]
			})
		]
	});
}
var EMPTY_LEADS = [];
function LeadsPage() {
	const queryClient = useQueryClient();
	const listQuery = useQuery({
		queryKey: LEADS_QUERY_KEY,
		queryFn: () => listLeads()
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("ALL");
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const leads = listQuery.data ?? EMPTY_LEADS;
	const totals = (0, import_react.useMemo)(() => deriveLeadTotals(leads), [leads]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = search.trim().toLowerCase();
		return leads.filter((lead) => {
			if (status !== "ALL" && lead.status !== status) return false;
			if (!q) return true;
			return `${lead.name} ${lead.channelUrl ?? ""} ${lead.notes ?? ""}`.toLowerCase().includes(q);
		});
	}, [
		leads,
		search,
		status
	]);
	const saveMut = useMutation({
		mutationFn: (values) => saveLead({ data: {
			id: values.id,
			name: values.name,
			channelUrl: values.channelUrl || null,
			notes: values.notes || null,
			status: values.status,
			upfrontCash: values.upfrontCash,
			monthlyRecurring: values.monthlyRecurring
		} }),
		onSuccess: async () => {
			toast.success(editing ? "Lead updated" : "Lead added");
			setModalOpen(false);
			setEditing(null);
			await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
		},
		onError: (error) => {
			captureClientError(error, { source: "save-lead" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	const deleteMut = useMutation({
		mutationFn: (id) => softDeleteLead({ data: id }),
		onSuccess: async () => {
			toast.success("Lead removed from the pipeline");
			setPendingDelete(null);
			await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
		},
		onError: (error) => {
			captureClientError(error, { source: "delete-lead" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Leads",
				description: "Prospect pipeline with live upfront and monthly totals. Removing a lead soft-deletes it and marks it lost.",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoolMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => {
						setEditing(null);
						setModalOpen(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Add lead"]
				}) })
			}),
			listQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					title: "Couldn’t load leads",
					description: "The pipeline couldn’t be read. Try again.",
					onRetry: () => void listQuery.refetch()
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Pipeline totals",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Open upfront",
									value: formatUsd(totals.openUpfront),
									amount: totals.openUpfront,
									hint: `${totals.openCount} open lead${totals.openCount === 1 ? "" : "s"}`,
									loading: listQuery.isPending
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Open monthly",
									value: formatUsd(totals.openMrr),
									amount: totals.openMrr,
									hint: "To contact · contacted · in talks",
									loading: listQuery.isPending
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Closed upfront",
									value: formatUsd(totals.closedUpfront),
									amount: totals.closedUpfront,
									hint: "Won cash",
									tone: "success",
									loading: listQuery.isPending
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
									label: "Closed monthly",
									value: formatUsd(totals.closedMrr),
									amount: totals.closedMrr,
									hint: "Won recurring",
									tone: "success",
									loading: listQuery.isPending
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "pl-10",
								value: search,
								onChange: (event) => setSearch(event.target.value),
								placeholder: "Search leads…",
								"aria-label": "Search leads"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							role: "group",
							"aria-label": "Filter by status",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "All",
								active: status === "ALL",
								onClick: () => setStatus("ALL")
							}), LEAD_STATUSES.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: LEAD_STATUS_LABELS[value],
								active: status === value,
								onClick: () => setStatus(value)
							}, value))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
						title: "Pipeline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadPipeline, {
							leads: filtered,
							loading: listQuery.isPending,
							onEdit: (lead) => {
								setEditing(lead);
								setModalOpen(true);
							},
							onDelete: setPendingDelete
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadModal, {
				open: modalOpen,
				onOpenChange: (open) => {
					setModalOpen(open);
					if (!open) setEditing(null);
				},
				lead: editing,
				busy: saveMut.isPending,
				onSave: (values) => saveMut.mutate(values)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (open) => !open && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Remove this lead?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: pendingDelete ? `${pendingDelete.name} will be marked lost and kept for audit. Totals drop immediately.` : null }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: !pendingDelete || deleteMut.isPending,
							onClick: () => pendingDelete && deleteMut.mutate(pendingDelete.id),
							children: deleteMut.isPending ? "Removing…" : "Remove lead"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setPendingDelete(null),
							children: "Cancel"
						})]
					})
				] })
			})
		]
	});
}
//#endregion
export { LeadsPage as component };
