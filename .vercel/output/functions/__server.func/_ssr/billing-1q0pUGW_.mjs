import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as billingStatusLabel, t as BILLING_QUERY_KEY, x as billingStatusTone } from "./mappers-Bmic_hyw.mjs";
import { a as formatDate, c as formatUsd } from "./format-DaT2NYM9.mjs";
import { d as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { ht as CreditCard, ut as ExternalLink } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { a as refreshBillingEntitlement, r as getBillingSnapshot, s as startBillingCheckout, t as cancelWorkspaceSubscription } from "./billing-fns-DJqg_cQU.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/billing-1q0pUGW_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BillingPage() {
	const queryClient = useQueryClient();
	const search = useRouterState({ select: (s) => s.location.searchStr });
	const query = useQuery({
		queryKey: BILLING_QUERY_KEY,
		queryFn: () => getBillingSnapshot()
	});
	const [cancelOpen, setCancelOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!search.includes("checkout=success")) return;
		refreshBillingEntitlement().then(async () => {
			toast.success("Subscription updated");
			await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
		}).catch(() => void 0);
	}, [search, queryClient]);
	const checkout = useMutation({
		mutationFn: (planKey) => startBillingCheckout({ data: { planKey } }),
		onSuccess: (result) => {
			window.location.assign(result.url);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const cancel = useMutation({
		mutationFn: () => cancelWorkspaceSubscription(),
		onSuccess: async () => {
			setCancelOpen(false);
			toast.success("Cancels at period end");
			await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Billing",
			description: "ClippyOS subscription"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-40 w-full rounded-card" })]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Billing",
			description: "ClippyOS subscription"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-6",
			title: "Couldn’t load billing",
			description: "Try again. Keys stay on the server.",
			onRetry: () => void query.refetch()
		})]
	});
	const snapshot = query.data;
	const owner = snapshot.role === "owner";
	const sub = snapshot.subscription;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Billing",
				description: "ClippyOS subscription — not client invoices. Those stay on Money."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "relative mt-6 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-[1] flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "Current plan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-section font-semibold tracking-tight",
								children: snapshot.plans.find((plan) => plan.key === sub.planKey)?.name ?? "None"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-caption text-muted",
								children: [sub.currentPeriodEnd ? `Renews ${formatDate(sub.currentPeriodEnd)}` : "No renewal date yet", sub.cancelAtPeriodEnd ? " · cancels at period end" : ""]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: billingStatusTone(sub.status),
							children: billingStatusLabel(sub.status)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "relative z-[1] mt-4 grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-caption text-muted",
								children: "SaaS MRR"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-body",
								children: sub.mrr != null ? formatUsd(sub.mrr) : "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-caption text-muted",
								children: "Seats"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
								className: "text-body",
								children: [snapshot.seatsUsed, snapshot.seatLimit != null ? ` / ${snapshot.seatLimit}` : ""]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-caption text-muted",
								children: "Last invoice"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-body",
								children: sub.lastInvoiceStatus ?? "—"
							})] })
						]
					}),
					owner && snapshot.subscription.status !== "none" && !sub.cancelAtPeriodEnd ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-[1] mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setCancelOpen(true),
							children: "Cancel at period end"
						})
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-card font-semibold tracking-tight",
				children: "Plans"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Subscribe via Airwallex Hosted Checkout. Cards, Apple Pay, and Google Pay. Price IDs come from Settings → Integrations."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-3",
				children: snapshot.plans.map((plan) => {
					const current = sub.planKey === plan.key && snapshot.entitled;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-caption text-muted",
							children: [plan.displayPrice, "/mo"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: plan.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: plan.blurb
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-caption text-muted",
							children: [plan.seats, " seats"]
						}),
						owner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-4 w-full",
							variant: current ? "secondary" : "primary",
							disabled: checkout.isPending || !plan.priceId,
							onClick: () => checkout.mutate(plan.key),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-4" }), checkout.isPending ? "Opening checkout…" : current ? "Manage / update" : plan.priceId ? "Subscribe" : "Add price ID"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-caption text-muted",
							children: "Only Owners can change the plan."
						})
					] }, plan.key);
				})
			}),
			!snapshot.airwallex.configured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-caption text-muted",
				children: "Connect Airwallex in Settings → Integrations before checkout. Until a price ID is saved, the rest of the product stays open so you can finish setup."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-card font-semibold tracking-tight",
				children: "Invoices"
			}),
			snapshot.invoices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-caption text-muted",
				children: "No invoices yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-col gap-2",
				children: snapshot.invoices.map((invoice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-body font-medium",
						children: [
							formatUsd(invoice.amount),
							" ",
							invoice.currency
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-caption text-muted",
						children: [
							invoice.paidAt ? formatDate(invoice.paidAt) : formatDate(invoice.createdAt),
							" ·",
							" ",
							invoice.status
						]
					})] }), invoice.hostedUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: invoice.hostedUrl,
							target: "_blank",
							rel: "noreferrer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "View"]
						})
					}) : null]
				}, invoice.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: cancelOpen,
				onOpenChange: setCancelOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Cancel at period end?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "You’ll keep access until the current period ends. No refund is issued from this screen." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							disabled: cancel.isPending,
							onClick: () => cancel.mutate(),
							children: "Confirm cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setCancelOpen(false),
							children: "Keep plan"
						})]
					})
				] })
			})
		]
	});
}
//#endregion
export { BillingPage as component };
