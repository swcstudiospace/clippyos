import { u as initials } from "./format-DaT2NYM9.mjs";
import { d as useRouterState, m as Outlet, v as Link, x as useRouter, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as ShieldCheck, J as LogOut, bt as CircleCheck, it as House, vt as Clapperboard, yt as CircleHelp } from "../_libs/lucide-react.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { O as cn, S as OrbsBackground, b as ClippyMark, w as Button } from "./router-DRtNPEcw.mjs";
import { t as ThemeToggle } from "./theme-toggle-NsNUnV6r.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as SplashScreen } from "./splash-screen-xzDEjK1B.mjs";
import { c as PORTAL_HOME_KEY, h as setPortalBearerToken, l as PORTAL_QUERY_KEY } from "./portal-BZQkNPFJ.mjs";
import { i as getPortalSessionFn, r as getPortalHomeFn, u as portalLogoutFn } from "./portal-fns-Arkyj22-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-D38Mhf9O.js
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/portal/home",
		label: "Home",
		icon: House
	},
	{
		to: "/portal/assets",
		label: "Assets",
		icon: Clapperboard
	},
	{
		to: "/portal/approvals",
		label: "Approvals",
		icon: ShieldCheck
	},
	{
		to: "/portal/activity",
		label: "Activity",
		icon: CircleCheck
	},
	{
		to: "/portal/help",
		label: "Help",
		icon: CircleHelp
	}
];
function PortalShell() {
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const session = useQuery({
		queryKey: PORTAL_QUERY_KEY,
		queryFn: () => getPortalSessionFn(),
		retry: false
	});
	const home = useQuery({
		queryKey: PORTAL_HOME_KEY,
		queryFn: () => getPortalHomeFn(),
		enabled: Boolean(session.data)
	});
	const logout = useMutation({
		mutationFn: () => portalLogoutFn(),
		onSettled: async () => {
			setPortalBearerToken(null);
			await router.navigate({ to: "/portal/login" });
		}
	});
	if (session.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { label: "Opening portal" });
	if (session.isError || !session.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/portal/login" });
	const settings = home.data?.settings;
	const client = home.data?.client;
	const pending = home.data?.pendingApprovals ?? 0;
	const agency = settings?.agencyName ?? "Client portal";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#portal-main",
				className: "skip-link",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 border-b border-border/80 bg-bg/75 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-5xl items-center gap-3 px-4 py-3",
					children: [
						settings?.logoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: settings.logoUrl,
							alt: "",
							className: "size-9 rounded-control object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 36 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-caption text-muted",
								children: agency
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-body font-semibold tracking-tight",
								children: client?.name ?? "Your brand"
							})]
						}),
						session.data.preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "orange",
							children: "Preview"
						}) : null,
						client?.channelThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: client.channelThumbnail,
							alt: "",
							className: "hidden size-9 rounded-full object-cover sm:block"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden size-9 place-items-center rounded-full bg-secondary-surface text-caption font-semibold sm:grid",
							children: initials(client?.name ?? "C")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							className: "min-h-11",
							onClick: () => logout.mutate(),
							disabled: logout.isPending,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
								className: "size-4",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Sign out"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Portal",
					className: "mx-auto hidden max-w-5xl gap-1 px-3 pb-2 md:flex",
					children: NAV.map((item) => {
						const active = pathname === item.to || item.to === "/portal/home" && pathname === "/portal";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-caption font-medium", active ? "bg-secondary-surface text-fg" : "text-muted hover:text-fg"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
									className: "size-4",
									"aria-hidden": "true"
								}),
								item.label,
								item.to === "/portal/approvals" && pending > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.65rem] text-accent-fg",
									children: pending
								}) : null
							]
						}, item.to);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "portal-main",
				className: "relative z-10 mx-auto max-w-5xl px-4 py-6 pb-28 md:pb-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "Portal mobile",
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-5",
					children: NAV.map((item) => {
						const active = pathname === item.to;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium", active ? "text-accent" : "text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
								className: "size-5",
								"aria-hidden": "true"
							}), item.label]
						}) }, item.to);
					})
				})
			})
		]
	});
}
function PortalLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (pathname === "/portal/login" || pathname === "/portal" || pathname === "/portal/") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalShell, {});
}
//#endregion
export { PortalLayout as component };
