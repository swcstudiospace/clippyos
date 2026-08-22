import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as PLAN_TYPES, g as PROGRESS_STAGES } from "./mappers-Bmic_hyw.mjs";
import { c as formatUsd, u as initials } from "./format-DaT2NYM9.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { S as STAGE_LABELS, _ as PLAN_TONES, g as PLAN_LABELS, w as STATUS_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { _ as softDeleteClient, c as listClients, r as getAiStatus } from "./clients-CmcyBPZd.mjs";
import { L as Pencil, N as Plus, O as Search, h as Trash2 } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { n as StagePill, t as SourceBadge } from "./stage-pill-D4JnG28X.mjs";
import { t as ClientFormModal } from "./client-form-modal-CRdMPNqb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients.index-oXk2o5B_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const listQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const [debounced, setDebounced] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("ACTIVE");
	const [plan, setPlan] = (0, import_react.useState)("ALL");
	const [stage, setStage] = (0, import_react.useState)("ALL");
	const [editMode, setEditMode] = (0, import_react.useState)(false);
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
		return () => window.clearTimeout(handle);
	}, [search]);
	const rows = (0, import_react.useMemo)(() => {
		return (listQuery.data ?? []).filter((client) => {
			if (status === "ACTIVE" && (client.status !== "ACTIVE" || client.deletedAt)) return false;
			if (status === "CHURNED" && client.status !== "CHURNED") return false;
			if (plan !== "ALL" && client.planType !== plan) return false;
			if (stage === "NONE" && client.currentStage) return false;
			if (stage !== "ALL" && stage !== "NONE" && client.currentStage !== stage) return false;
			if (!debounced) return true;
			return `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(debounced);
		});
	}, [
		listQuery.data,
		status,
		plan,
		stage,
		debounced
	]);
	const remove = useMutation({
		mutationFn: (id) => softDeleteClient({ data: id }),
		onSuccess: async () => {
			toast.success("Client marked churned and kept for audit");
			setPendingDelete(null);
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			captureClientError(error, { source: "delete-client" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Clients",
				description: "Content teams for personal-brand channels.",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: editMode ? "secondary" : "ghost",
					onClick: () => setEditMode((value) => !value),
					"aria-pressed": editMode,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Edit"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => {
						setEditing(null);
						setModalOpen(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Add Client"]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "pl-10",
							value: search,
							onChange: (event) => setSearch(event.target.value),
							placeholder: "Search by name or channel…",
							"aria-label": "Search clients"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 overflow-x-auto pb-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "Active",
								active: status === "ACTIVE",
								onClick: () => setStatus("ACTIVE")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "Churned",
								active: status === "CHURNED",
								onClick: () => setStatus("CHURNED")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "All statuses",
								active: status === "ALL",
								onClick: () => setStatus("ALL")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1 hidden h-8 w-px bg-border sm:block",
								"aria-hidden": "true"
							}),
							["ALL", ...PLAN_TYPES].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: value === "ALL" ? "All plans" : PLAN_LABELS[value],
								active: plan === value,
								onClick: () => setPlan(value)
							}, value))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 overflow-x-auto pb-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "Any stage",
								active: stage === "ALL",
								onClick: () => setStage("ALL")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: "Not started",
								active: stage === "NONE",
								onClick: () => setStage("NONE")
							}),
							PROGRESS_STAGES.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
								label: STAGE_LABELS[value],
								active: stage === value,
								onClick: () => setStage(value)
							}, value))
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					listQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : null,
					listQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
						title: "Couldn’t load clients",
						onRetry: () => void listQuery.refetch()
					}) : null,
					!listQuery.isPending && !listQuery.isError && rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						title: debounced || status !== "ACTIVE" || plan !== "ALL" ? "No matching clients" : "No clients yet",
						description: debounced || status !== "ACTIVE" ? "Try clearing search or filters." : "Add the first channel to start production tracking.",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								setEditing(null);
								setModalOpen(true);
							},
							children: "Add Client"
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-3",
						children: rows.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/clients/$clientId",
									params: { clientId: client.id },
									className: "flex min-w-0 flex-1 items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
											name: client.name,
											src: client.channelThumbnail
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-body font-semibold",
												children: client.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-1 flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														tone: PLAN_TONES[client.planType],
														children: [PLAN_LABELS[client.planType], client.planType === "CUSTOM" && client.customPlanLabel ? ` · ${client.customPlanLabel}` : ""]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StagePill, { stage: client.currentStage }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceBadge, { source: client.currentSource }),
													client.status === "CHURNED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														tone: statusTone("CHURNED"),
														children: STATUS_LABELS.CHURNED
													}) : null
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "shrink-0 text-body font-medium",
											children: [formatUsd(client.monthlyFee), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1 text-caption text-muted",
												children: "MRR"
											})]
										})
									]
								}), editMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex shrink-0 gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										"aria-label": `Edit ${client.name}`,
										onClick: () => {
											setEditing(client);
											setModalOpen(true);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										"aria-label": `Delete ${client.name}`,
										onClick: () => setPendingDelete(client),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-danger" })
									})]
								}) : null]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-caption text-muted sm:hidden",
								children: [formatUsd(client.monthlyFee), " MRR"]
							})]
						}) }, client.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientFormModal, {
				open: modalOpen,
				onOpenChange: setModalOpen,
				client: editing,
				aiReady: aiQuery.data?.llm ?? false,
				onSaved: (id) => {
					queryClient.invalidateQueries({ queryKey: ["clients"] });
					queryClient.invalidateQueries({ queryKey: ["client", id] });
					if (!editing) navigate({
						to: "/clients/$clientId",
						params: { clientId: id }
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (next) => !next && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
						"Mark ",
						pendingDelete?.name,
						" as churned?"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "This is a soft delete. The client is set to CHURNED and kept for audit. They leave the active list but are not permanently erased." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: remove.isPending,
							onClick: () => pendingDelete && remove.mutate(pendingDelete.id),
							children: "Mark churned"
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
function FilterChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: cn("min-h-11 rounded-full px-3 text-caption font-medium transition-[background-color,box-shadow] duration-(--motion-quick)", active ? "chip-active-glow bg-accent text-accent-fg" : "bg-secondary-surface text-fg"),
		children: label
	});
}
function Thumb({ name, src }) {
	if (src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		className: "size-12 shrink-0 rounded-control object-cover"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-12 shrink-0 place-items-center rounded-control bg-secondary-surface text-caption font-semibold",
		children: initials(name)
	});
}
function ListSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: Array.from({ length: 4 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-card" }, index))
	});
}
//#endregion
export { ClientsPage as component };
