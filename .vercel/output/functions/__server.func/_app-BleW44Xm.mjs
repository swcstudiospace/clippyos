import { o as __toESM } from "./_runtime.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { o as signOut } from "./_ssr/client-C4IS_tWT.mjs";
import { b as billingStatusLabel, h as PRODUCT_ONBOARDING_STEPS, m as PRODUCT_ONBOARDING_QUERY_KEY, p as PRODUCT_ONBOARDING_COPY, t as BILLING_QUERY_KEY, x as billingStatusTone } from "./_ssr/mappers-Bmic_hyw.mjs";
import { l as SIDEBAR_STORAGE_KEY, t as APP_NAME } from "./_ssr/constants-CdtfzQP2.mjs";
import { s as formatRelativeTime } from "./_ssr/format-DaT2NYM9.mjs";
import { f as NOTIFICATION_CATEGORY_LABELS, m as SAFETY_INBOX_QUERY_KEY, u as NOTIFICATIONS_QUERY_KEY } from "./_ssr/safety-CI611PZC.mjs";
import { i as INTEGRATION_IDS, n as INTEGRATIONS_QUERY_KEY, r as INTEGRATION_COPY, t as BANNER_BY_PATH } from "./_ssr/integrations-BBMsU168.mjs";
import { d as useRouterState, m as Outlet, v as Link, y as Navigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "./_libs/@radix-ui/react-collapsible+[...].mjs";
import { c as markNotificationsReadFn, r as getSafetyInbox, s as listNotificationsFn } from "./_ssr/safety-fns-0YjGOs0I.mjs";
import { t as changeOwnPassword } from "./_ssr/team-access-Di_NZ6Xd.mjs";
import { At as Bot, C as ShieldCheck, Dt as ChartColumn, E as Settings, Et as Check, G as MessageCircle, J as LogOut, K as Menu, Mt as Bell, Ot as CalendarDays, Q as LayoutDashboard, St as ChevronsLeft, T as Share2, Y as Lock, Z as Lightbulb, _t as Copy, a as Wallet, et as KeyRound, g as Target, ht as CreditCard, l as UserPlus, rt as Image, s as Users, u as UserCog, vt as Clapperboard, xt as ChevronsRight } from "./_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "./_libs/tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { C as GlassCard, O as cn, S as OrbsBackground, _ as TooltipTrigger, b as ClippyMark, g as TooltipContent, h as Tooltip, m as userFacingErrorMessage, p as captureClientError, w as Button, y as BrandLockup } from "./_ssr/router-DRtNPEcw.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./_ssr/use-current-user-Bsan92LK.mjs";
import { i as getProductOnboarding, n as dismissProductOnboarding, o as setProductOnboardingStep, r as getBillingSnapshot } from "./_ssr/billing-fns-DJqg_cQU.mjs";
import { t as Skeleton } from "./_ssr/skeleton-8ICuXo8q.mjs";
import { a as DropdownMenuSeparator, i as DropdownMenuLabel, n as DropdownMenuContent, o as DropdownMenuTrigger, r as DropdownMenuItem, t as DropdownMenu } from "./_ssr/dropdown-menu-DZ8z19go.mjs";
import { t as Input } from "./_ssr/input-Do4nFtvO.mjs";
import { t as Label } from "./_ssr/label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./_ssr/shine-border-CYiRLf3h.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./_ssr/dialog-ChagZPco.mjs";
import { t as ThemeToggle } from "./_ssr/theme-toggle-NsNUnV6r.mjs";
import { o as LayoutGroup } from "./_libs/framer-motion+[...].mjs";
import { t as motion } from "./_libs/motion.mjs";
import { t as ScrollProgress } from "./_ssr/scroll-progress-C1dB__k8.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./_ssr/sheet-J1oGBwS0.mjs";
import { n as statusTone, t as Badge } from "./_ssr/badge-CDaEWAH4.mjs";
import { t as SplashScreen } from "./_ssr/splash-screen-xzDEjK1B.mjs";
import { n as useIntegrationsUi, t as IntegrationsProvider } from "./_ssr/provider-BnICEAIZ.mjs";
import { o as testIntegration, r as getIntegrationsStatus, t as completeFirstLaunch } from "./_ssr/integrations-eci1pPRl.mjs";
import { t as copyTextToClipboard } from "./_ssr/clipboard-Yt4ExP0v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-BleW44Xm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
var NAV_ITEMS = [
	{
		to: "/home",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/money",
		label: "Money",
		icon: Wallet
	},
	{
		to: "/clients",
		label: "Clients",
		icon: Users
	},
	{
		to: "/calendar",
		label: "Calendar",
		icon: CalendarDays
	},
	{
		to: "/leads",
		label: "Leads",
		icon: Target
	},
	{
		to: "/ideation",
		label: "Ideation",
		icon: Lightbulb
	},
	{
		to: "/agent",
		label: "Agent",
		icon: Bot
	},
	{
		to: "/thumbnails",
		label: "Thumbnails",
		icon: Image
	},
	{
		to: "/library",
		label: "Library",
		icon: Clapperboard
	},
	{
		to: "/social",
		label: "Social",
		icon: Share2
	},
	{
		to: "/inbox",
		label: "Inbox",
		icon: MessageCircle
	},
	{
		to: "/approvals",
		label: "Approvals",
		icon: ShieldCheck
	},
	{
		to: "/analytics",
		label: "Analytics",
		icon: ChartColumn
	},
	{
		to: "/team",
		label: "Team",
		icon: UserCog
	},
	{
		to: "/onboarding",
		label: "Onboarding",
		icon: UserPlus
	},
	{
		to: "/billing",
		label: "Billing",
		icon: CreditCard
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings
	}
];
function BrandMark({ collapsed }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex h-14 items-center gap-3 px-4", collapsed && "justify-center px-0"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, { collapsed })
	});
}
function SidebarNav({ collapsed, onNavigate }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [hovered, setHovered] = (0, import_react.useState)(null);
	const billing = useQuery({
		queryKey: BILLING_QUERY_KEY,
		queryFn: () => getBillingSnapshot()
	});
	const inbox = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox(),
		refetchInterval: 2e4
	});
	const items = Boolean(billing.data?.enforced && !billing.data.entitled) ? billing.data?.role === "owner" ? NAV_ITEMS.filter((item) => item.to === "/billing" || item.to === "/settings") : [] : NAV_ITEMS;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGroup, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Primary",
		className: "flex flex-1 flex-col gap-1 overflow-y-auto px-3",
		children: items.map((item) => {
			const Icon = item.icon;
			const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
			const link = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				"aria-current": active ? "page" : void 0,
				"aria-label": item.label,
				onClick: onNavigate,
				onMouseEnter: () => setHovered(item.to),
				onMouseLeave: () => setHovered(null),
				className: cn("sidebar-item group/sidebar relative", collapsed && "justify-center px-0", active && "sidebar-item-active"),
				children: [
					hovered === item.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
						layoutId: "hovered-sidebar-link",
						className: "absolute inset-0 z-0 rounded-control bg-secondary-surface",
						transition: {
							type: "spring",
							stiffness: 380,
							damping: 32
						}
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "relative z-10 size-5 shrink-0",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("relative z-10 overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform] duration-(--motion-fast) ease-[var(--ease-out)] group-hover/sidebar:translate-x-1", collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"),
						children: item.label
					}),
					item.to === "/approvals" && (inbox.data?.pendingApprovals ?? 0) > 0 && !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "relative z-10 ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-caption font-medium text-warning",
						children: inbox.data?.pendingApprovals
					}) : null
				]
			});
			if (!collapsed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: link }, item.to);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
				asChild: true,
				children: link
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, {
				side: "right",
				children: item.label
			})] }, item.to);
		})
	}) });
}
function Sidebar({ collapsed, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-bg/80 backdrop-blur-xl md:flex md:flex-col", "transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", collapsed ? "w-sidebar-collapsed" : "w-sidebar"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { collapsed }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarNav, { collapsed }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("p-3", collapsed && "flex justify-center"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: collapsed ? "icon" : "default",
					className: cn("w-full", collapsed && "w-11"),
					onClick: onToggle,
					"aria-expanded": !collapsed,
					"aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
					children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsRight, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsLeft, { className: "size-4" }), "Collapse"] })
				})
			})
		]
	});
}
function MobileBrand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 md:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 32 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-body font-semibold tracking-tight",
			children: APP_NAME
		})]
	});
}
function AccountMenu() {
	const { user, isPending } = useCurrentUserState();
	const display = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const [pwOpen, setPwOpen] = (0, import_react.useState)(false);
	const [currentPassword, setCurrentPassword] = (0, import_react.useState)("");
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const [pwBusy, setPwBusy] = (0, import_react.useState)(false);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, {
		className: "size-11 rounded-full",
		"aria-hidden": "true"
	});
	if (!user || !display) return null;
	const label = display.displayName ?? display.primaryEmail ?? "Account";
	const initial = label.charAt(0).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "ghost",
			size: "icon",
			className: "rounded-full",
			"aria-label": `Account menu for ${label}`,
			children: display.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: display.profileImageUrl,
				alt: "",
				className: "size-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-8 place-items-center rounded-full bg-secondary-surface text-caption font-medium",
				children: initial
			})
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-body text-fg",
					children: label
				}), display.primaryEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-caption text-muted",
					children: display.primaryEmail
				}) : null]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onSelect: () => setPwOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "size-4" }), "Change password"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				disabled: signingOut,
				onSelect: () => {
					setSigningOut(true);
					signOut("/login").catch((error) => {
						setSigningOut(false);
						captureClientError(error, { source: "sign-out" });
						toast.error(userFacingErrorMessage(error));
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), signingOut ? "Signing out…" : "Sign out"]
			})
		]
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: pwOpen,
		onOpenChange: setPwOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Change password" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Updates the email/password for this account. OAuth logins are unchanged." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-3",
				onSubmit: (event) => {
					event.preventDefault();
					setPwBusy(true);
					changeOwnPassword({ data: {
						currentPassword,
						newPassword
					} }).then(() => {
						toast.success("Password updated");
						setPwOpen(false);
						setCurrentPassword("");
						setNewPassword("");
					}).catch((error) => {
						captureClientError(error, { source: "change-password" });
						toast.error(userFacingErrorMessage(error));
					}).finally(() => setPwBusy(false));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "current-pw",
							children: "Current password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "current-pw",
							type: "password",
							autoComplete: "current-password",
							value: currentPassword,
							onChange: (event) => setCurrentPassword(event.target.value),
							required: true,
							minLength: 8
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "new-pw",
							children: "New password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "new-pw",
							type: "password",
							autoComplete: "new-password",
							value: newPassword,
							onChange: (event) => setNewPassword(event.target.value),
							required: true,
							minLength: 8
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: pwBusy,
						children: pwBusy ? "Saving…" : "Update password"
					})
				]
			})
		] })
	})] });
}
function NotificationList({ items, onRead, onReadAll }) {
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-3 py-6 text-body text-muted",
		children: "No notifications yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 px-3 pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "Ops alerts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onReadAll,
				children: "Mark all read"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "max-h-[min(24rem,70dvh)] overflow-y-auto",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: item.href ?? "/",
				className: cn("flex flex-col gap-1 rounded-control px-3 py-3 hover:bg-glass", !item.readAt && "bg-accent/5"),
				onClick: () => {
					if (!item.readAt) onRead(item.id);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 flex-1 truncate text-body font-medium",
							children: item.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(item.severity),
							children: item.severity
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: item.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-caption text-muted",
						children: [
							NOTIFICATION_CATEGORY_LABELS[item.category],
							" · ",
							formatRelativeTime(item.createdAt)
						]
					})
				]
			}) }, item.id))
		})]
	});
}
function NotificationBell() {
	const queryClient = useQueryClient();
	const inbox = useQuery({
		queryKey: SAFETY_INBOX_QUERY_KEY,
		queryFn: () => getSafetyInbox(),
		refetchInterval: 2e4
	});
	const list = useQuery({
		queryKey: NOTIFICATIONS_QUERY_KEY,
		queryFn: () => listNotificationsFn(),
		enabled: false
	});
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [wide, setWide] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const apply = () => setWide(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, []);
	const mark = useMutation({
		mutationFn: (input) => markNotificationsReadFn({ data: input }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: SAFETY_INBOX_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
		}
	});
	const unread = inbox.data?.unreadNotifications ?? 0;
	const items = (0, import_react.useMemo)(() => list.data?.items ?? inbox.data?.latest ?? [], [list.data?.items, inbox.data?.latest]);
	function openList() {
		list.refetch();
	}
	const panel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationList, {
		items,
		onRead: (id) => mark.mutate({ ids: [id] }),
		onReadAll: () => mark.mutate({ all: true })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: wide ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, {
		onOpenChange: (open) => {
			if (open) openList();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				size: "icon",
				className: "relative size-11",
				"aria-label": "Notifications",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5" }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg",
					children: unread > 9 ? "9+" : unread
				}) : null]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
			align: "end",
			className: "w-[min(100vw-2rem,22rem)] p-2",
			children: panel
		})]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "ghost",
		size: "icon",
		className: "relative size-11",
		"aria-label": "Notifications",
		onClick: () => {
			setMobileOpen(true);
			openList();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5" }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg",
			children: unread > 9 ? "9+" : unread
		}) : null]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: mobileOpen,
		onOpenChange: setMobileOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Notifications" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
					className: "sr-only",
					children: "Ops alerts for this workspace"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: panel
				})
			]
		})
	})] }) });
}
function TopBar({ onOpenNav }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-bg/70 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "size-11 md:hidden",
				onClick: onOpenNav,
				"aria-label": "Open navigation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileBrand, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationBell, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountMenu, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollProgress, {})
		]
	});
}
function WelcomeModal() {
	const queryClient = useQueryClient();
	const { openGuide } = useIntegrationsUi();
	const statusQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const skip = useMutation({
		mutationFn: () => completeFirstLaunch(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
		}
	});
	const data = statusQuery.data;
	const aiMissing = data && data.items.ai.health === "not_configured";
	const open = Boolean(data && !data.firstLaunchCompleted && aiMissing);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => {
			if (!next) skip.mutate();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "flex max-h-[min(90dvh,40rem)] w-[min(100%-2rem,32rem)] flex-col overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 pr-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 40 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Welcome to ClippyOS" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Connect integrations in this order. AI is required for ideation, thumbnails, analysis, and the Discord agent." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 flex flex-col gap-2",
					children: INTEGRATION_IDS.map((id) => {
						const copy = INTEGRATION_COPY[id];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-body font-medium",
								children: copy.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: copy.required ? "orange" : "neutral",
								children: copy.required ? "Required" : "Optional"
							})]
						}, id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky bottom-0 mt-5 flex flex-wrap gap-2 bg-elevated/80 pt-2 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							skip.mutate();
							openGuide("ai");
						},
						children: "Get Started"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => skip.mutate(),
						disabled: skip.isPending,
						children: "Skip for now"
					})]
				})
			]
		})
	});
}
var GUIDES = {
	ai: {
		id: "ai",
		title: "AI API",
		time: "~2 min",
		intro: "Set this up first — it powers ideation, thumbnails, channel analysis, and the Discord agent.",
		steps: [
			{
				title: "Create an xAI / Grok API key",
				body: "Open the xAI console, create an API key, and copy it. SuperGrok subscribers can instead use Connect SuperGrok on the card (same device flow as Grok Build).",
				copy: {
					label: "Console",
					value: "https://console.x.ai"
				}
			},
			{
				title: "Paste the key",
				body: "ClippyOS → Settings → Integrations → AI API. Paste the key and Save. The value is stored server-side and never shown again in full."
			},
			{
				title: "Test connection",
				body: "Use Test Connection on the card or in this guide. A successful ping marks the integration Connected."
			}
		],
		checklist: [
			"Key created at the provider console (or SuperGrok connected)",
			"Key pasted and saved in Integrations",
			"Test Connection returns Connected"
		]
	},
	higgsfield: {
		id: "higgsfield",
		title: "Higgsfield",
		time: "~3 min",
		intro: "Thumbnails generate 16:9 4K stills with nano-banana-pro. You need both a key ID and a secret.",
		steps: [
			{
				title: "Create Higgsfield credentials",
				body: "In the Higgsfield dashboard, create an API key and secret.",
				copy: {
					label: "Higgsfield",
					value: "https://higgsfield.ai"
				}
			},
			{
				title: "Paste both values",
				body: "ClippyOS → Settings → Integrations → Higgsfield. Paste the Key ID and Secret, then Save."
			},
			{
				title: "Test connection",
				body: "Run Test Connection. Thumbnails stay 16:9 and 4K. If Higgsfield is out of credits, generation can fall back to the workspace image model."
			}
		],
		checklist: [
			"Key ID and secret created",
			"Both saved in the Higgsfield card",
			"Test Connection succeeds"
		]
	},
	youtube: {
		id: "youtube",
		title: "YouTube Data API v3",
		time: "~5 min",
		intro: "Used for public subscriber and view snapshots. Watch time and CTR stay manual.",
		steps: [
			{
				title: "Enable the API",
				body: "Google Cloud Console → APIs & Services → enable YouTube Data API v3.",
				copy: {
					label: "Cloud Console",
					value: "https://console.cloud.google.com/apis/library/youtube.googleapis.com"
				}
			},
			{
				title: "Create an API key",
				body: "Credentials → Create credentials → API key. Restrict to YouTube Data API v3 if you want."
			},
			{
				title: "Paste and test",
				body: "ClippyOS → Settings → Integrations → YouTube Data API. Save, then Test Connection."
			}
		],
		checklist: [
			"YouTube Data API v3 enabled",
			"API key created",
			"Key saved and Test Connection succeeds"
		]
	},
	discord: {
		id: "discord",
		title: "Discord bot",
		time: "~5 min",
		intro: "The Status Agent is read-only. It never sends messages. Discord server names should closely match Client names.",
		steps: [
			{
				title: "Create an application",
				body: "Discord Developer Portal → New Application → Bot → Reset Token → copy the token.",
				copy: {
					label: "Developer Portal",
					value: "https://discord.com/developers/applications"
				}
			},
			{
				title: "Enable Message Content Intent",
				body: "Bot → Privileged Gateway Intents → Message Content Intent. Required to read message text."
			},
			{
				title: "Invite with read-only permissions",
				body: "OAuth2 → URL Generator. Scope = bot. Permissions = View Channels + Read Message History only. Do not grant Send Messages. Invite the bot to each client Discord server.",
				copy: {
					label: "Permission integer",
					value: "66560"
				}
			},
			{
				title: "Paste the token",
				body: "ClippyOS → Settings → Integrations → Discord Bot. Save, then Test Connection. Name each Discord server after the client so the agent can match them."
			}
		],
		checklist: [
			"Bot token copied",
			"Message Content Intent enabled",
			"Bot invited with View Channels + Read Message History only",
			"Token saved and Test Connection succeeds"
		]
	},
	notion: {
		id: "notion",
		title: "Notion",
		time: "~4 min",
		intro: "Optional. Lets operators attach a Notion integration token for briefing pages.",
		steps: [
			{
				title: "Create an internal integration",
				body: "Notion → Settings → Connections → Develop or manage integrations → New integration. Copy the token.",
				copy: {
					label: "My integrations",
					value: "https://www.notion.so/my-integrations"
				}
			},
			{
				title: "Share pages",
				body: "Open the pages or databases the agency should read and add the integration under connections."
			},
			{
				title: "Paste and test",
				body: "ClippyOS → Settings → Integrations → Notion. Save, then Test Connection."
			}
		],
		checklist: [
			"Internal integration created",
			"Pages shared with the integration",
			"Token saved and Test Connection succeeds"
		]
	},
	linear: {
		id: "linear",
		title: "Linear",
		time: "~10 min",
		intro: "Linear is the human Kanban for the AI Clipping Dashboard. Agency Admin stays the system of record for clients and media. Failed jobs can open tickets here — Linear outages never block a publish.",
		steps: [
			{
				title: "Create an API key",
				body: "Linear → Settings → API. Create a personal API key (or an OAuth app with read, write, issues:create). Prefer a dedicated project named AI Clipping Dashboard.",
				copy: {
					label: "Linear API",
					value: "https://linear.app/settings/api"
				}
			},
			{
				title: "Paste and Test",
				body: "Settings → Integrations → Linear, or the Linear section below. Save the key, then Test Connection. Test fetches viewer, teams, and projects — it never creates an issue."
			},
			{
				title: "Select team and project",
				body: "Bind the Agency team and the AI Clipping Dashboard project. Load workflow states and map Backlog, Ready, In Progress, In Review, and Done."
			},
			{
				title: "Optional: auto-issue on fail",
				body: "Turn on LINEAR_ENABLED and Auto-issue on fail so social/render/agent failures open a ticket with a deep link. Sync linked jobs is off by default."
			}
		],
		checklist: [
			"API key or OAuth app created in Linear",
			"Test Connection shows the connected user",
			"Team + project selected",
			"Five Kanban columns mapped to workflow states"
		]
	},
	x: {
		id: "x",
		title: "X (API publish)",
		time: "~10 min",
		intro: "Connect a user-context X app so Social can post clips via the official API. App-only Bearer tokens cannot tweet. Computer Use remains the fallback for CAPTCHA or missing API access.",
		steps: [
			{
				title: "Create a Project and App",
				body: "In the X Developer Portal, create a Project and an App with OAuth 2.0. User authentication is required — app-only Bearer tokens cannot post.",
				copy: {
					label: "X Developer Portal",
					value: "https://developer.x.com"
				}
			},
			{
				title: "Set the callback URL",
				body: "In User authentication settings, add this callback. Copy it from the X (API publish) card if you need the full origin.",
				copy: {
					label: "Callback path",
					value: "/api/oauth/social"
				}
			},
			{
				title: "Enable user auth and scopes",
				body: "Turn on OAuth 2.0. Request tweet.read, tweet.write, users.read, media.write, and offline.access — least privilege for media upload + posting."
			},
			{
				title: "Save Client ID and secret",
				body: "Paste Client ID and Client Secret on the X (API publish) card. API host defaults to https://api.x.com. Save, then Connect X."
			},
			{
				title: "Connect and Test",
				body: "Connect X opens the X consent screen (user context). Test Connection calls users/me and never posts. Disconnect clears tokens only."
			}
		],
		checklist: [
			"Project/App created in the X Developer Portal",
			"Callback URL saved on the app",
			"User auth + media.write / tweet.write enabled",
			"Connect X completes and Test shows the connected user"
		]
	},
	daytona: {
		id: "daytona",
		title: "Daytona (Computer Use / Social)",
		time: "~5 min",
		intro: "Powers the on-demand Windows Social Machine. The machine stays off until you press Start. Hibernate pauses a hot snapshot. Test Connection only checks the API — it never starts a VM.",
		steps: [
			{
				title: "Create a Daytona API key",
				body: "Open the Daytona dashboard, create an API key, and copy it. Windows-large is the production path for Instagram, X, and TikTok web sessions.",
				copy: {
					label: "Daytona",
					value: "https://app.daytona.io"
				}
			},
			{
				title: "Paste into ClippyOS",
				body: "Settings → Integrations → Daytona. Paste the API key. Optional: US or EU region, windows-large, idle hibernate minutes, and a residential AU HTTPS proxy (host/port/user)."
			},
			{
				title: "Test Connection (and Test proxy)",
				body: "Test Connection lists sandboxes and never starts a machine. Test proxy uses the residential URL through an HTTPS agent and never starts a VM. Open Social and press Start only when you are ready to post."
			}
		],
		checklist: [
			"API key created at app.daytona.io",
			"Key saved in the Daytona card",
			"Test Connection succeeds without starting a VM",
			"Social → Start is used only when you need the desktop"
		]
	},
	telegram: {
		id: "telegram",
		title: "Telegram",
		time: "~4 min",
		intro: "Professional customer and company liaison. Messages land in Inbox. Computer Use is never used for Telegram.",
		steps: [
			{
				title: "Create a bot",
				body: "Talk to @BotFather, create a bot, and copy the token.",
				copy: {
					label: "BotFather",
					value: "https://t.me/BotFather"
				}
			},
			{
				title: "Save the token",
				body: "ClippyOS → Settings → Integrations → Telegram. Paste the bot token. A webhook secret is generated if you leave it blank."
			},
			{
				title: "Set the webhook",
				body: "Point Telegram at this app’s webhook. Include the secret token header.",
				copy: {
					label: "Webhook path",
					value: "/api/webhooks/telegram"
				}
			},
			{
				title: "Test, then Inbox",
				body: "Test Connection calls getMe and never sends a chat. Open Inbox to reply as the agency."
			}
		],
		checklist: [
			"Bot created with BotFather",
			"Token saved",
			"Webhook pointed at /api/webhooks/telegram",
			"Test Connection succeeds without messaging a customer"
		]
	},
	whatsapp: {
		id: "whatsapp",
		title: "WhatsApp Cloud API",
		time: "~8 min",
		intro: "Meta Cloud API for business chats. Not WhatsApp Web on the Windows VM. Inbox is the liaison surface.",
		steps: [
			{
				title: "Create a Meta app",
				body: "In Meta for Developers, add WhatsApp, copy the phone number ID and a permanent access token.",
				copy: {
					label: "Meta Developers",
					value: "https://developers.facebook.com"
				}
			},
			{
				title: "Save credentials",
				body: "Paste the token, phone number ID, verify token, and app secret on the WhatsApp card."
			},
			{
				title: "Verify the webhook",
				body: "Set the callback URL and verify token. GET verification and POST signatures are checked.",
				copy: {
					label: "Webhook path",
					value: "/api/webhooks/whatsapp"
				}
			},
			{
				title: "Test, then Inbox",
				body: "Test Connection reads the phone number and never sends a customer message. Replies go through Inbox."
			}
		],
		checklist: [
			"Phone number ID and token saved",
			"Verify token matches Meta",
			"Webhook subscribed",
			"Test Connection succeeds without sending a chat"
		]
	},
	airwallex: {
		id: "airwallex",
		title: "Airwallex Billing",
		time: "~8 min",
		intro: "Powers ClippyOS’s own SaaS subscription. Agency client invoices stay on the Money tab. Test Connection only fetches a token — it never opens checkout.",
		steps: [
			{
				title: "Create API credentials",
				body: "In Airwallex, create an API client (Client ID + API key). Use the sandbox host first. Copy the webhook secret for this app’s endpoint.",
				copy: {
					label: "Airwallex",
					value: "https://www.airwallex.com"
				}
			},
			{
				title: "Create Product + Prices",
				body: "In Billing, create a Product (ClippyOS) and monthly Prices for Starter / Pro / Agency. Paste each price_id into the Airwallex card."
			},
			{
				title: "Legal entity and payment account",
				body: "If your account has more than one legal entity or linked payment account, paste those IDs. Hosted Checkout needs them to create the subscription."
			},
			{
				title: "Webhook endpoint",
				body: "Point Airwallex to this app’s webhook URL. Events: billing_checkout.completed, subscription.* , invoice.paid / invoice.payment_failed. Signature uses x-timestamp + x-signature HMAC.",
				copy: {
					label: "Webhook path",
					value: "/api/webhooks/airwallex"
				}
			},
			{
				title: "Test Connection, then subscribe",
				body: "Save, Test Connection (login ping only). Open Billing and Subscribe — Airwallex Hosted Checkout collects cards and supported wallets. Access unlocks after the webhook or the success return."
			}
		],
		checklist: [
			"Client ID and API key saved",
			"At least one price_id saved",
			"Webhook secret saved and endpoint configured",
			"Test Connection succeeds without opening checkout"
		]
	}
};
function SetupGuideSheet({ id, open, onOpenChange }) {
	const guide = id ? GUIDES[id] : null;
	const queryClient = useQueryClient();
	const test = useMutation({
		mutationFn: () => testIntegration({ data: id }),
		onSuccess: async () => {
			toast.success("Connected");
			await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, { children: guide ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pr-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, { children: [guide.title, " setup"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "blue",
							children: guide.time
						}),
						INTEGRATION_COPY[guide.id].required ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "orange",
							children: "Required"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "neutral",
							children: "Optional"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: guide.intro })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 flex flex-col gap-4",
				children: guide.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-control bg-secondary-surface/50 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-caption font-medium text-muted",
							children: ["Step ", index + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-1 text-body font-semibold",
							children: step.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-caption text-muted",
							children: step.body
						}),
						step.copy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: step.copy.label,
							value: step.copy.value
						}) : null
					]
				}, step.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-body font-semibold",
					children: "Checklist"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 flex flex-col gap-2",
					children: guide.checklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-2 text-caption text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "mt-0.5 size-4 text-accent",
							"aria-hidden": "true"
						}), item]
					}, item))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !id || test.isPending,
					onClick: () => test.mutate(),
					children: test.isPending ? "Testing…" : "Test Connection"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => onOpenChange(false),
					children: "Done"
				})]
			})
		] }) : null })
	});
}
function CopyRow({ label, value }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "mt-3 flex min-h-11 w-full items-center justify-between gap-2 rounded-control bg-elevated px-3 text-left",
		onClick: () => {
			copyTextToClipboard(value).then((ok) => {
				if (ok) {
					setCopied(true);
					toast.success(`${label} copied`);
					window.setTimeout(() => setCopied(false), 1500);
				} else toast.error("Couldn’t copy");
			});
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-caption text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate font-mono text-caption",
				children: value
			})]
		}), copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4 text-muted" })]
	});
}
var DISMISS_KEY = "agency-admin-banner-dismissed";
function readDismissed() {
	try {
		const raw = window.sessionStorage.getItem(DISMISS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function MissingIntegrationBanners() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { openGuide } = useIntegrationsUi();
	const statusQuery = useQuery({
		queryKey: INTEGRATIONS_QUERY_KEY,
		queryFn: () => getIntegrationsStatus()
	});
	const [dismissed, setDismissed] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setDismissed(readDismissed());
	}, []);
	const items = statusQuery.data?.items;
	if (!items) return null;
	const needed = BANNER_BY_PATH.filter((entry) => entry.match(pathname)).map((entry) => items[entry.id]).filter((item, index, list) => item && item.health !== "connected" && !dismissed.includes(item.id) && list.findIndex((row) => row.id === item.id) === index);
	if (needed.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-4 flex flex-col gap-2",
		children: needed.map((item) => {
			const copy = INTEGRATION_COPY[item.id];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 rounded-control border border-border bg-secondary-surface/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
				role: "status",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-caption",
					children: [
						"This feature requires ",
						copy.name,
						" to be configured.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-accent underline-offset-2 hover:underline",
							onClick: () => openGuide(item.id),
							children: "Set it up now →"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => {
						const next = [...dismissed, item.id];
						setDismissed(next);
						try {
							window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
						} catch {}
					},
					children: "Dismiss"
				})]
			}, item.id);
		})
	});
}
function BillingGate({ snapshot }) {
	const owner = snapshot.role === "owner";
	const pastDue = snapshot.subscription.status === "past_due" || snapshot.subscription.status === "unpaid";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto flex min-h-[60dvh] max-w-lg flex-col justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "relative overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-[1] flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 40 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-section font-semibold tracking-tight",
							children: pastDue ? "Update billing to continue" : "Subscribe to ClippyOS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "ClippyOS subscription — not client revenue on the Money tab."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "size-4 text-muted",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: billingStatusTone(snapshot.subscription.status),
							children: billingStatusLabel(snapshot.subscription.status)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body text-muted",
						children: owner ? pastDue ? "The last invoice didn’t clear. Open Billing to pay or update the payment method via Airwallex Hosted Checkout." : "Choose a plan on Billing. Checkout is hosted by Airwallex — cards, Apple Pay, and Google Pay. ClippyOS never sees card numbers." : "This workspace doesn’t have an active ClippyOS subscription yet. Ask an Owner to subscribe from Billing."
					}),
					owner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/billing",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-4" }), "Open Billing"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/settings",
								children: "Settings"
							})
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Members can sign in, but product tabs stay locked until an Owner completes checkout."
					})
				]
			})]
		})
	});
}
function ProductOnboardingCard({ entitled }) {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: PRODUCT_ONBOARDING_QUERY_KEY,
		queryFn: () => getProductOnboarding(),
		enabled: entitled
	});
	const toggle = useMutation({
		mutationFn: (input) => setProductOnboardingStep({ data: input }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: PRODUCT_ONBOARDING_QUERY_KEY });
		}
	});
	const dismiss = useMutation({
		mutationFn: () => dismissProductOnboarding(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: PRODUCT_ONBOARDING_QUERY_KEY });
		}
	});
	const state = query.data;
	if (!entitled || !state || state.dismissed) return null;
	const remaining = PRODUCT_ONBOARDING_STEPS.filter((step) => !state.steps[step].done).length;
	if (remaining === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "mb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "Welcome to ClippyOS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-caption text-muted",
				children: [
					remaining,
					" step",
					remaining === 1 ? "" : "s",
					" left after purchase."
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => dismiss.mutate(),
				disabled: dismiss.isPending,
				children: "Dismiss"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 flex flex-col gap-2",
			children: PRODUCT_ONBOARDING_STEPS.map((step) => {
				const copy = PRODUCT_ONBOARDING_COPY[step];
				const done = state.steps[step].done;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-3 rounded-control bg-secondary-surface/40 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "mt-1 size-4",
						checked: done,
						onChange: (event) => toggle.mutate({
							step,
							done: event.target.checked
						}),
						"aria-label": copy.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-body font-medium",
								children: copy.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: copy.body
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: copy.href,
								className: "text-caption text-accent underline-offset-4 hover:underline",
								children: "Open"
							})
						]
					})]
				}, step);
			})
		})]
	});
}
function readCollapsed() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}
function AppShell() {
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setCollapsed(readCollapsed());
	}, []);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		try {
			if (window.sessionStorage.getItem("clippy-login-audited") === "1") return;
			window.sessionStorage.setItem("clippy-login-audited", "1");
		} catch {
			return;
		}
		import("./_ssr/safety-fns-0YjGOs0I.mjs").then((n) => n.l).then((n) => n.l).then((mod) => mod.recordLoginFn()).catch(() => {});
	}, []);
	function toggleCollapsed() {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
			} catch {}
			return next;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntegrationsProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "skip-link",
				children: "Skip to main content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
				collapsed,
				onToggle: toggleCollapsed
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("relative z-10 min-h-dvh min-w-0 transition-[margin] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", collapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, { onOpenNav: () => setMobileOpen(true) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					id: "main",
					className: "relative min-w-0 overflow-x-clip px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MissingIntegrationBanners, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GatedOutlet, {})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: mobileOpen,
				onOpenChange: setMobileOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "left",
					className: "p-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "sr-only",
							children: "Navigation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetDescription, {
							className: "sr-only",
							children: ["Primary sections of ", APP_NAME]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-full flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-6 pb-3 pt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarNav, {
								collapsed: false,
								onNavigate: () => setMobileOpen(false)
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WelcomeModal, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideHost, {})
		]
	}) });
}
function GatedOutlet() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const billing = useQuery({
		queryKey: BILLING_QUERY_KEY,
		queryFn: () => getBillingSnapshot()
	});
	if (billing.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { label: "Checking access" });
	const snapshot = billing.data;
	if (snapshot?.enforced && !snapshot.entitled) {
		const allowed = pathname.startsWith("/settings") || pathname.startsWith("/billing");
		if (snapshot.role === "owner" && allowed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillingGate, { snapshot });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [pathname === "/home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductOnboardingCard, { entitled: Boolean(snapshot?.entitled) }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})] });
}
function GuideHost() {
	const { guide, closeGuide } = useIntegrationsUi();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupGuideSheet, {
		id: guide,
		open: guide !== null,
		onOpenChange: (open) => {
			if (!open) closeGuide();
		}
	});
}
function AppShellSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { label: "Loading your workspace" });
}
function AuthenticatedLayout() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShellSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { AuthenticatedLayout as component };
