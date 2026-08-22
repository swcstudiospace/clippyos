import { o as __toESM } from "../_runtime.mjs";
import { Bt as _enum, Gt as literal, Jt as object, Qt as union, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as isMissingTable, F as mapLead, f as PLAN_TYPES, g as PROGRESS_STAGES, u as LEAD_STATUSES } from "./mappers-Bmic_hyw.mjs";
import { d as THEME_STORAGE_KEY, n as APP_TAGLINE, t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { _ as createRootRoute, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Slot, h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { d as __exportAll } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as auth } from "./server-C5l0fORE.mjs";
import { t as getSessionUser } from "./verify.server-Bpwplt8y.mjs";
import { i as asMoney, o as displayPaymentStatus, s as isActiveClient } from "./money-n66k7fz5.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { a as deriveDashboardMetrics, c as deriveRecentActivity, d as DEFAULT_MONTHLY_FEE, f as DEFAULT_SETUP_FEE, o as deriveGuaranteeItems, s as derivePipelineCounts } from "./dashboard-Dk6DLyWe.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { r as addonIdForTool } from "./addons-BHnLQdrp.mjs";
import { n as HERMES_PLAYBOOKS } from "./playbooks-BbqI43Jw.mjs";
import { i as readPlaybookPolicies, r as readAutomationEnabled, t as AGENT_MUTATIONS } from "./autonomy-policy.server-HcFlL3K7.mjs";
import { c as MCP_TOOLS, f as hasScope, o as INBOUND_COMMANDS, s as MCP_RESOURCES } from "./autonomy-CEwFxjUt.mjs";
import { n as authenticateMcpToken, o as rateLimitOrThrow, s as readWebhookSecret, t as authenticateApiKey } from "./autonomy-auth.server-ayVAPOsv.mjs";
import { a as readIdempotency, c as writeIdempotency, i as readAgentJob, n as insertAgentJob, o as updateAgentJob, s as writeAuditLog } from "./autonomy-audit.server-vcgB9vCa.mjs";
import { n as emitAutonomyEvent, o as verifyInboundSignature } from "./autonomy-events.server-DCl-_J_B.mjs";
import { a as internalMarkPaymentPaid, d as readClients, f as readProgress, o as internalSaveClient, s as internalSetClientStage } from "./clients-CmcyBPZd.mjs";
import { i as internalGenerateSuggestedTitles, r as internalGenerateSuggestedIdeas } from "./client-tools-Ct5oM3yi.mjs";
import { o as loadAirwallexConfig, u as verifyAirwallexSignature } from "./airwallex.server-CjwNksJP.mjs";
import { i as persistPull, o as readSnapshots } from "./analytics-Cxeqvuh1.mjs";
import { n as handleAirwallexWebhook } from "./billing.server-Dn_P3iW1.mjs";
import { i as completePublisherOAuth } from "./social-oauth.server-BkBN9MI7.mjs";
import { s as readLibraryBytes, u as verifyLibraryToken } from "./library-storage.server-DfxOTjeL.mjs";
import { b as readMediaSettings, s as getVersionRow } from "./library.server-vya-JVML.mjs";
import { t as ingestBytes } from "./library-pipeline.server-Cj0cLHTT.mjs";
import { t as completeLinearOAuth } from "./linear.server-DI-z011N.mjs";
import { i as readTeamMembers, r as readPayments } from "./money-BLxnpxZv.mjs";
import { t as schema_default } from "./schema-GKqshK6g.mjs";
import { m as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/radix-ui__react-tooltip.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-C_uf36nf.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/use-prefers-reduced-motion-BcGjzSus.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BorderBeam({ className, size = 72, duration = 8, delay = 0, colorFrom = "var(--accent)", colorTo = "var(--purple)", borderWidth = 1.5, reverse = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: "pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
		style: { borderWidth },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("absolute aspect-square [offset-path:rect(0_auto_auto_0_round_9999px)]", reverse ? "animate-border-beam-reverse" : "animate-border-beam", className),
			style: {
				width: size,
				background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
				animationDuration: `${duration}s`,
				animationDelay: `-${delay}s`
			}
		})
	});
}
function usePrefersReducedMotion() {
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);
	return reduced;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/animated-grid-pattern-DJHMGkfb.js
function AnimatedGridPattern({ className, width = 36, height = 36, numSquares = 28, maxOpacity = .35 }) {
	const reduced = usePrefersReducedMotion();
	const patternId = (0, import_react.useId)().replace(/:/g, "");
	const squares = (0, import_react.useMemo)(() => Array.from({ length: numSquares }, (_, index) => ({
		id: index,
		x: index * 3 % 22,
		y: index * 5 % 14,
		delay: `${index % 10 * .4}s`
	})), [numSquares]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-0 h-full w-full fill-[color-mix(in_srgb,var(--accent)_18%,transparent)] stroke-border/70", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
				id: patternId,
				width,
				height,
				patternUnits: "userSpaceOnUse",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: `M.5 ${height}V.5H${width}`,
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "0.6"
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "100%",
				height: "100%",
				fill: `url(#${patternId})`
			}),
			!reduced ? squares.map((square) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: width - 2,
				height: height - 2,
				x: square.x * width + 1,
				y: square.y * height + 1,
				className: "animate-grid-pulse",
				style: {
					animationDelay: square.delay,
					opacity: maxOpacity
				}
			}, square.id)) : null
		]
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DRtNPEcw.js
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body font-medium transition-[background-color,transform,box-shadow,opacity] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			primary: "btn-shimmer bg-accent text-accent-fg hover:brightness-110",
			secondary: "bg-secondary-surface text-fg hover:bg-secondary-surface/80 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]",
			ghost: "bg-transparent text-fg hover:bg-glass",
			destructive: "btn-shimmer bg-danger text-accent-fg hover:brightness-110",
			rainbow: "rainbow-btn"
		},
		size: {
			default: "min-h-11 px-4",
			sm: "min-h-10 px-3 text-caption",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		type: asChild ? void 0 : type,
		...props
	});
}
function GlassCard({ className, interactive = false, beam = true, children, onMouseMove, onMouseLeave, ...props }) {
	const reduced = usePrefersReducedMotion();
	const [spot, setSpot] = (0, import_react.useState)({
		x: 0,
		y: 0,
		on: false
	});
	function handleMove(event) {
		onMouseMove?.(event);
		if (reduced) return;
		const rect = event.currentTarget.getBoundingClientRect();
		setSpot({
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
			on: true
		});
	}
	function handleLeave(event) {
		onMouseLeave?.(event);
		setSpot((current) => ({
			...current,
			on: false
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("glass-card relative isolate min-w-0 p-5", interactive && "glass-card-interactive", className),
		onMouseMove: handleMove,
		onMouseLeave: handleLeave,
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 transition-opacity duration-(--motion-fast)",
				style: {
					opacity: spot.on ? 1 : 0,
					background: `radial-gradient(320px circle at ${spot.x}px ${spot.y}px, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)`
				}
			}), beam && !reduced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BorderBeam, {
				colorFrom: "var(--accent)",
				colorTo: "var(--purple)"
			}) : null]
		}), children]
	});
}
function OrbsBackground() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"aria-hidden": "true",
		className: "pointer-events-none fixed inset-0 z-0 overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb orb-blue" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb orb-teal" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb orb-purple" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedGridPattern, { className: "opacity-35" })
		]
	});
}
function AppErrorComponent({ error, reset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-6 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "relative z-10 w-full max-w-md px-8 py-10 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "mx-auto size-10 text-danger",
					strokeWidth: 1.75,
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-section font-semibold tracking-tight",
					children: "Something went wrong"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 break-words text-body text-muted",
					children: error.message || "An unexpected error occurred. Try reloading the page."
				}),
				typeof reset === "function" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6",
					onClick: reset,
					children: "Try again"
				}) : null
			]
		})]
	});
}
function Meteors({ number = 12, className }) {
	const reduced = usePrefersReducedMotion();
	const items = (0, import_react.useMemo)(() => Array.from({ length: number }, (_, index) => ({
		id: index,
		left: `${index * 17 % 100}%`,
		delay: `${index % 8 * .35}s`,
		duration: `${3.2 + index % 5 * .45}s`
	})), [number]);
	if (reduced) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-0 overflow-hidden", className),
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "animate-meteor absolute top-0 h-px w-20 bg-linear-to-r from-accent to-transparent",
			style: {
				left: item.left,
				animationDelay: item.delay,
				animationDuration: item.duration
			}
		}, item.id))
	});
}
function SparkleGlyph({ sparkle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className: "pointer-events-none absolute z-[1] animate-sparkle",
		style: {
			left: sparkle.x,
			top: sparkle.y,
			animationDelay: sparkle.delay,
			transform: `scale(${sparkle.scale})`
		},
		width: "14",
		height: "14",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z",
			fill: "var(--accent)"
		})
	});
}
function SparklesText({ children, className, sparkleCount = 5 }) {
	const reduced = usePrefersReducedMotion();
	const sparkles = (0, import_react.useMemo)(() => Array.from({ length: sparkleCount }, (_, id) => ({
		id,
		x: `${8 + id * 19 % 84}%`,
		y: `${id % 2 === 0 ? -18 : 78}%`,
		delay: `${id * .35}s`,
		scale: .55 + id % 3 * .18
	})), [sparkleCount]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative inline-block", className),
		children: [!reduced ? sparkles.map((sparkle) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparkleGlyph, { sparkle }, sparkle.id)) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "relative z-[2]",
			children
		})]
	});
}
function ClippyMark({ size = 32, className }) {
	const rid = (0, import_react.useId)().replace(/:/g, "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative grid shrink-0 place-items-center overflow-hidden rounded-control shadow-(--shadow-border)", className),
		style: {
			width: size,
			height: size
		},
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 32 32",
			width: size,
			height: size,
			className: "block",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: `clippy-g-${rid}`,
					x1: "4",
					y1: "2",
					x2: "28",
					y2: "30",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#6ee7b7"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "50%",
							stopColor: "#10b981"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#047857"
						})
					]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					width: "32",
					height: "32",
					rx: "8",
					fill: "#04140e"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "1",
					y: "1",
					width: "30",
					height: "30",
					rx: "7",
					fill: "none",
					stroke: `url(#clippy-g-${rid})`,
					strokeWidth: "1.2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
					points: "16,4.5 26,10 26,22 16,27.5 6,22 6,10",
					fill: "#0b3d2c",
					stroke: "#34d399",
					strokeWidth: "1.15",
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M12.2 16.2c0-2.4 1.9-4.2 4.3-4.2 2.2 0 3.9 1.5 4.2 3.5",
					fill: "none",
					stroke: "#ecfdf5",
					strokeWidth: "1.85",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M20.7 16.2c0 2.4-1.9 4.2-4.3 4.2-2.2 0-3.9-1.5-4.2-3.5",
					fill: "none",
					stroke: "#ecfdf5",
					strokeWidth: "1.85",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "16.4",
					cy: "16.2",
					r: "1.35",
					fill: "#10b981"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "clippy-mark-shine pointer-events-none absolute inset-0" })]
	});
}
function BrandLockup({ collapsed = false, size = 32, nameClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-3", collapsed && "justify-center"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("overflow-hidden text-body font-semibold tracking-tight whitespace-nowrap transition-[opacity,max-width] duration-(--motion-fast) ease-[var(--ease-out)]", collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100", nameClassName),
			children: APP_NAME
		})]
	});
}
function NotFound() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-6 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "relative z-10 w-full max-w-md overflow-hidden px-8 py-10 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meteors, { number: 8 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-[1] flex flex-col items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 44 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-caption font-medium text-muted",
						children: "404"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-page font-semibold tracking-tight",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, { children: "Page not found" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-body text-muted",
						children: [
							"That route does not exist in ",
							APP_NAME,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							children: "Back to ClippyOS"
						})
					})
				]
			})]
		})]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var ThemeContext = (0, import_react.createContext)(null);
var THEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}})();`;
function readStoredTheme() {
	if (typeof window === "undefined") return "dark";
	try {
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
		return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
	} catch {
		return "dark";
	}
}
function applyTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme);
	document.documentElement.style.colorScheme = theme;
}
function ThemeProvider({ children }) {
	const [theme, setThemeState] = (0, import_react.useState)("dark");
	(0, import_react.useEffect)(() => {
		const initial = readStoredTheme();
		setThemeState(initial);
		applyTheme(initial);
	}, []);
	const setTheme = (0, import_react.useCallback)((next) => {
		setThemeState(next);
		applyTheme(next);
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {}
	}, []);
	const toggleTheme = (0, import_react.useCallback)(() => {
		setTheme(theme === "dark" ? "light" : "dark");
	}, [setTheme, theme]);
	const value = (0, import_react.useMemo)(() => ({
		theme,
		setTheme,
		toggleTheme
	}), [
		theme,
		setTheme,
		toggleTheme
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value,
		children
	});
}
function useTheme() {
	const ctx = (0, import_react.useContext)(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
function Toaster$1() {
	const { theme } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		position: "top-center",
		offset: "max(12px, env(safe-area-inset-top))",
		toastOptions: { className: "glass-card !border-border !bg-glass !text-fg !text-body" }
	});
}
function TooltipProvider({ delayDuration = 200, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Provider, {
		delayDuration,
		children
	});
}
var Tooltip = Root3;
var TooltipTrigger = Trigger;
function TooltipContent({ className, sideOffset = 8, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		sideOffset,
		className: cn("glass-card z-50 px-2.5 py-1.5 text-caption text-fg data-[state=delayed-open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none", className),
		...props
	}) });
}
function captureClientError(error, info) {
	const message = error instanceof Error ? error.message || "An unexpected error occurred" : "An unexpected error occurred";
	const event = {
		message,
		source: info?.source,
		at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("agency-admin:error", { detail: event }));
	console.error("[agency-admin]", info?.source ?? "client", message);
	return event;
}
function userFacingErrorMessage(error) {
	if (error instanceof Error && error.message === "Unauthorized") return "Please sign in to continue.";
	if (error instanceof Error && error.message === "Forbidden") return "You do not have access to that.";
	if (error instanceof Error && error.message === "INVALID_YOUTUBE_URL") return "Use a valid YouTube channel or video URL.";
	if (error instanceof Error && error.message === "CUSTOM_PLAN_LABEL") return "Custom plans need a short label.";
	if (error instanceof Error && error.message === "CUSTOM_FEE") return "Custom monthly fee must be a multiple of 1,000, from 0 to 20,000.";
	if (error instanceof Error && error.message === "DATA_UNAVAILABLE") return "Couldn’t reach workspace data. Try again.";
	if (error instanceof Error && error.message === "AI_UNAVAILABLE") return "This tool will be available once analysis is connected.";
	if (error instanceof Error && error.message === "AI_RATE_LIMIT") return "Capacity — retrying in a moment. xAI rate limits use backoff, not a hard stop.";
	if (error instanceof Error && error.message === "AI_TIER_GATED") return "This SuperGrok tier cannot run inference. Connect the metered xAI API key in Settings.";
	if (error instanceof Error && error.message === "SKILL_SECRETS_FORBIDDEN") return "That skill package looks like it contains a secret. Remove keys and try again.";
	if (error instanceof Error && error.message === "SKILL_PENDING") return "That skill is waiting for review.";
	if (error instanceof Error && error.message === "MACHINE_STOPPED") return "The Social Machine is stopped. Start it for Computer Use, or connect a publisher API in Settings to post without the VM.";
	if (error instanceof Error && error.message === "AGENT_BUSY") return "Another agent run is already in progress. Cancel it or wait.";
	if (error instanceof Error && error.message === "AUTOMATION_DISABLED") return "Automation is off. Enable it in Settings → Automation.";
	if (error instanceof Error && error.message === "EVIDENCE_REQUIRED") return "Stage changes need a short note unless the evidence policy is on.";
	if (error instanceof Error && error.message === "PAYMENT_ALREADY_PAID") return "That payment was already marked paid.";
	if (error instanceof Error && error.message === "PAYMENT_MISSING") return "That payment is no longer available.";
	if (error instanceof Error && error.message === "AWAITING_APPROVAL") return "This publish is waiting for approval.";
	if (error instanceof Error && error.message === "APPROVAL_MISSING") return "That approval request is no longer available.";
	if (error instanceof Error && error.message === "APPROVAL_NOT_PENDING") return "That request was already decided.";
	if (error instanceof Error && error.message === "SELF_APPROVE_DENIED") return "You can’t approve your own request. Another admin needs to sign off.";
	if (error instanceof Error && error.message === "APPROVAL_FORBIDDEN") return "You don’t have permission to decide that request.";
	if (error instanceof Error && error.message === "APPROVAL_EXPIRED") return "That approval request expired.";
	if (error instanceof Error && error.message === "PORTAL_DISABLED") return "The client portal is turned off.";
	if (error instanceof Error && error.message === "PORTAL_RATE_LIMIT") return "Too many tries. Wait a few minutes and try again.";
	if (error instanceof Error && error.message === "PORTAL_EMAIL_INVALID") return "Enter a valid email address.";
	if (error instanceof Error && error.message === "PORTAL_EMAIL_IN_USE") return "That email is already tied to another client portal.";
	if (error instanceof Error && error.message === "PORTAL_INVITE_INVALID") return "That invite isn’t valid.";
	if (error instanceof Error && error.message === "PORTAL_INVITE_EXPIRED") return "That invite expired. Ask your producer for a new link.";
	if (error instanceof Error && error.message === "PORTAL_PASSWORD") return "Use a password of at least 8 characters.";
	if (error instanceof Error && error.message === "PORTAL_LOGIN_FAILED") return "Email or password doesn’t match.";
	if (error instanceof Error && error.message === "PORTAL_USER_MISSING") return "That portal user is no longer available.";
	if (error instanceof Error && error.message === "PORTAL_NOTE_REQUIRED") return "Add a short note when requesting changes.";
	if (error instanceof Error && error.message === "PORTAL_PREVIEW_READONLY") return "Preview is read-only. Approvals stay with the client login.";
	if (error instanceof Error && error.message === "PORTAL_APPROVALS_OFF") return "Portal approvals are turned off in Settings.";
	if (error instanceof Error && error.message === "PORTAL_DOWNLOAD_DENIED") return "Downloads are turned off for this portal.";
	if (error instanceof Error && error.message === "PORTAL_ASSET_MISSING") return "That file isn’t available in this portal.";
	if (error instanceof Error && error.message === "LEAD_MISSING") return "That lead is no longer available.";
	if (error instanceof Error && error.message === "EMPTY_MESSAGE") return "Write a message before sending.";
	if (error instanceof Error && error.message === "THREAD_MISSING") return "That conversation is no longer available.";
	if (error instanceof Error && error.message === "CHANNEL_NOT_CONFIGURED") return "Connect Telegram or WhatsApp in Settings before sending.";
	if (error instanceof Error && error.message === "CHANNEL_UNAVAILABLE") return "That channel rejected the message. Check the bot token or Cloud API credentials.";
	if (error instanceof Error && error.message === "PROXY_MISSING") return "Pick a country so the Social Machine can open social apps from your location.";
	if (error instanceof Error && error.message === "PROXY_UNAVAILABLE") return "Couldn’t match that location automatically. Try another country, or paste credentials in Settings.";
	if (error instanceof Error && error.message === "DEMO_RATE_LIMIT") return "Wait a few seconds before sending another demo request.";
	if (error instanceof Error && error.message === "IPFS_UNAVAILABLE") return "Content pinning rejected those credentials. Clips still live in immutable cloud storage.";
	if (error instanceof Error && error.message === "SESSION_MISSING") return "That thumbnail session is no longer available.";
	if (error instanceof Error && error.message === "CLIENT_REQUIRED") return "Select a client before generating a thumbnail.";
	if (error instanceof Error && error.message === "CLIENT_MISSING") return "That client is no longer available.";
	if (error instanceof Error && error.message === "CHANNEL_MISSING") return "Add a YouTube channel URL before generating titles.";
	if (error instanceof Error && error.message === "YOUTUBE_UNAVAILABLE") return "Couldn’t read this channel’s uploads. Retry in a moment.";
	if (error instanceof Error && error.message === "NO_LONG_FORM") return "No long-form videos (4 minutes or longer) were found on this channel.";
	if (error instanceof Error && error.message === "RATING_INVALID") return "Rate the thumbnail from 1 to 5.";
	if (error instanceof Error && error.message === "IMAGE_FAILED") return "The image didn’t come through. Retry.";
	if (error instanceof Error && error.message === "HIGGSFIELD_UNAVAILABLE") return "This tool will be available once you connect your API key.";
	if (error instanceof Error && error.message === "OVERLAY_TOO_LARGE") return "That overlay is too large. Shorten the text and try again.";
	if (error instanceof Error && error.message === "UNTRUSTED_IMAGE") return "That image can’t be used here.";
	if (error instanceof Error && error.message === "GENERATION_FAILED") return "The reply didn’t come through. Retry to send the same thread.";
	if (error instanceof Error && error.message === "YOUTUBE_KEY_MISSING") return "Add a YouTube Data API key in Settings to pull live stats — or enter a snapshot manually.";
	if (error instanceof Error && error.message === "YOUTUBE_QUOTA") return "YouTube API quota reached — try again later.";
	if (error instanceof Error && error.message === "YOUTUBE_CHANNEL_NOT_FOUND") return "Couldn’t find that YouTube channel.";
	if (error instanceof Error && error.message === "SNAPSHOT_EXISTS") return "A snapshot already exists for that date. Confirm to overwrite it.";
	if (error instanceof Error && error.message === "OAUTH_START_FAILED") return "Couldn’t start SuperGrok sign-in. Retry in a moment.";
	if (error instanceof Error && error.message === "AI_TIER_GATED") return "SuperGrok OAuth is connected, but this account’s tier cannot run inference. Use the metered xAI API key in Settings → LLM Providers.";
	if (error instanceof Error && error.message === "SKILL_MISSING") return "That skill is no longer available.";
	if (error instanceof Error && error.message === "SKILL_DISABLED") return "That skill is disabled.";
	if (error instanceof Error && error.message === "SKILL_PENDING") return "That skill is waiting for human approval.";
	if (error instanceof Error && error.message === "SKILL_EXEC_FAILED") return "The skill didn’t finish in the sandbox. Check the run log.";
	if (error instanceof Error && error.message === "SKILL_TOO_LARGE") return "That skill script is too large to run.";
	if (error instanceof Error && error.message === "ADDON_LOCKED") return "That add-on is required and can’t be turned off.";
	if (error instanceof Error && error.message === "ADDON_MISSING") return "That add-on isn’t installed.";
	if (error instanceof Error && error.message === "ADDON_INVALID") return "That manifest isn’t valid. Check schemaVersion and permissions.";
	if (error instanceof Error && error.message === "ADDON_BUILTIN") return "Built-in add-ons can’t be overwritten. Disable or install a new id.";
	if (error instanceof Error && error.message === "ADDON_REQUIRED") return "That add-on is required by the OS.";
	if (error instanceof Error && error.message === "KNOWLEDGE_TOO_LARGE") return "That paste is larger than the 2 MB training limit. Split it and send again — nothing was stored.";
	if (error instanceof Error && error.message === "EXTRACTION_FAILED") return "Couldn’t extract a principle from that paste. Nothing was stored. Retry.";
	if (error instanceof Error && error.message === "METRICS_UNAVAILABLE") return "Couldn’t pull stats from the platform. Enter them manually — missing is not zero.";
	if (error instanceof Error && error.message === "METRICS_EMPTY") return "Enter at least one metric. Unknown stays blank, not zero.";
	if (error instanceof Error && error.message === "NO_EXTERNAL_ID") return "This post has no platform id yet, so stats can’t be pulled.";
	if (error instanceof Error && error.message === "NO_PERFORMANCE") return "No performance snapshots on this asset yet. Refresh stats or enter them manually.";
	if (error instanceof Error && error.message === "PROPOSAL_MISSING") return "That learning proposal is no longer available.";
	if (error instanceof Error && error.message === "PROPOSAL_NOT_PENDING") return "That proposal was already decided.";
	if (error instanceof Error && error.message === "PROPOSAL_DUPLICATE") return "A similar principle is already pending or approved.";
	if (error instanceof Error && error.message === "KEY_TOO_SHORT") return "That key looks too short. Paste the full value from the provider.";
	if (error instanceof Error && error.message === "SUPER_ADMIN_UNSET") return "Set a Super Admin password in Settings → Team access first.";
	if (error instanceof Error && error.message === "SUPER_ADMIN_INVALID") return "That Super Admin password isn’t right.";
	if (error instanceof Error && error.message === "SUPER_ADMIN_LOCKED") return "Too many Super Admin attempts. Wait a few minutes.";
	if (error instanceof Error && error.message === "HTTPS_ONLY") return "Outbound webhook destinations must use HTTPS.";
	if (error instanceof Error && error.message === "KEY_MISSING") return "That API key is no longer available.";
	if (error instanceof Error && error.message === "AUTOMATION_PAUSED") return "Automation is paused. Human UI is still live.";
	if (error instanceof Error && error.message === "DISCORD_UNAVAILABLE") return "Discord rejected that bot token. Check the token and intents.";
	if (error instanceof Error && error.message === "NOTION_UNAVAILABLE") return "Notion rejected that token. Confirm the integration can access a page.";
	if (error instanceof Error && error.message === "DAYTONA_UNAVAILABLE") return "Connect Daytona in Settings for Computer Use, or connect a publisher API to post without the machine.";
	if (error instanceof Error && error.message === "AIRWALLEX_UNAVAILABLE") return "Connect Airwallex in Settings. Test Connection never opens checkout.";
	if (error instanceof Error && error.message === "AIRWALLEX_CHECKOUT_FAILED") return "Airwallex couldn’t create checkout. Confirm price IDs, legal entity, and payment account.";
	if (error instanceof Error && error.message === "AIRWALLEX_PRICE_MISSING") return "Save an Airwallex price ID for that plan in Settings → Integrations.";
	if (error instanceof Error && error.message === "BILLING_EMAIL_REQUIRED") return "Your account needs an email before checkout.";
	if (error instanceof Error && error.message === "RESET_INVALID") return "That reset link is invalid or expired.";
	if (error instanceof Error && error.message === "MACHINE_STOPPED") return "The Social Machine is stopped. Start it for Computer Use, or connect a publisher API in Settings to post without the VM.";
	if (error instanceof Error && error.message === "UPLOAD_IN_PROGRESS") return "Another upload is already running. Wait or cancel it first.";
	if (error instanceof Error && error.message === "ASSET_MISSING") return "That asset isn’t eligible for this client.";
	if (error instanceof Error && error.message === "PLATFORM_NEEDS_LOGIN") return "Log into that platform in the Social Machine first.";
	if (error instanceof Error && error.message === "COMPUTER_USE_UNAVAILABLE") return "The desktop stack isn’t available. Try Start again.";
	if (error instanceof Error && error.message === "JOB_MISSING") return "That upload job is no longer available.";
	if (error instanceof Error && error.message === "JOB_CANCELLED") return "That upload job was cancelled.";
	if (error instanceof Error && error.message === "UPLOAD_SESSION_MISSING") return "The resumable upload session expired. Retry to start a new transfer.";
	if (error instanceof Error && error.message === "POST_MISSING") return "That social post is no longer available.";
	if (error instanceof Error && error.message === "UPLOAD_IN_PROGRESS") return "An upload is already running. Wait for it to finish.";
	if (error instanceof Error && error.message === "AUTO_STOP_INVALID") return "Auto-stop must be between 5 and 240 minutes.";
	if (error instanceof Error && error.message === "POST_MISSING") return "That social post is no longer available.";
	if (error instanceof Error && error.message === "UPLOAD_FAILED") return "The upload didn’t finish. Retry once the machine is running, or connect the API publisher.";
	if (error instanceof Error && error.message === "PUBLISHER_APP_MISSING") return "Save the platform app ID and secret in Settings before connecting.";
	if (error instanceof Error && error.message === "PUBLISHER_NOT_CONNECTED") return "Connect that platform in Settings → Integrations.";
	if (error instanceof Error && error.message === "PUBLISHER_NOT_ELIGIBLE") return "That account can’t publish via API. Use Computer Use, or pick a professional Instagram / audited TikTok app.";
	if (error instanceof Error && error.message === "PUBLISHER_TOKEN_EXPIRED") return "The platform token expired. Reconnect in Settings → Integrations.";
	if (error instanceof Error && error.message === "PUBLISHER_UNAVAILABLE") return "The platform API didn’t respond. Retry, or use Computer Use.";
	if (error instanceof Error && error.message === "PUBLISHER_RATE_LIMIT") return "The platform rate-limited this publish. Try again in a minute.";
	if (error instanceof Error && error.message === "PUBLISHER_REJECTED") return "The platform rejected the publish. Check the asset, or use Computer Use.";
	if (error instanceof Error && error.message === "IG_PROFESSIONAL_REQUIRED") return "Instagram API publishing needs a professional (Business or Creator) account linked to a Facebook Page.";
	if (error instanceof Error && error.message === "IG_APP_REVIEW") return "Instagram content publish needs Meta App Review, or the app is still in Development mode (role-based test users only).";
	if (error instanceof Error && error.message === "IG_CONTAINER_FAILED") return "Instagram couldn’t finish processing the Reel. Try an MP4 around 9:16.";
	if (error instanceof Error && error.message === "IG_MEDIA_UNSUPPORTED") return "Instagram Reels API needs a short MP4 video.";
	if (error instanceof Error && error.message === "IG_ACCOUNT_MISSING") return "Select a professional Instagram account after connecting.";
	if (error instanceof Error && error.message === "IG_PUBLIC_URL_REQUIRED") return "Instagram API needs a public HTTPS media URL. Use Computer Use for local or data URLs.";
	if (error instanceof Error && error.message === "TIKTOK_AUDIT_REQUIRED") return "TikTok rejected Direct Post (app audit). Inbox drafts or Computer Use still work.";
	if (error instanceof Error && error.message === "TIKTOK_MEDIA_UNSUPPORTED") return "TikTok API publishing needs an MP4 video.";
	if (error instanceof Error && error.message === "X_API_BASE_INVALID") return "X API host must be https://api.x.com (or https://api.twitter.com).";
	if (error instanceof Error && error.message === "YOUTUBE_QUOTA") return "YouTube API quota is exhausted for today. Retry later, or use Computer Use.";
	if (error instanceof Error && error.message === "YT_INVALID_METADATA") return "YouTube rejected the title, description, or tags. Shorten or clean them and retry.";
	if (error instanceof Error && error.message === "YT_MEDIA_UNSUPPORTED") return "YouTube API upload needs an MP4 video.";
	if (error instanceof Error && error.message === "NO_PUBLISH_RAIL") return "Connect a publisher API in Settings, or connect Daytona for Computer Use.";
	if (error instanceof Error && (error.message === "OAUTH_STATE" || error.message === "OAUTH_EXCHANGE")) return "Couldn’t finish the platform connect. Start Connect again from Settings.";
	if (error instanceof Error && error.message === "ASSET_NOT_READY") return "That library asset is still processing.";
	if (error instanceof Error && error.message === "CAPTION_ENGINE_MISSING") return "Connect transcription in Settings, or upload an SRT.";
	if (error instanceof Error && error.message === "CAPTION_NOT_READY") return "Captions aren’t ready yet. Generate or upload an SRT first.";
	if (error instanceof Error && error.message === "SRT_INVALID") return "That SRT couldn’t be parsed. Check the timings and try again.";
	if (error instanceof Error && error.message === "FFMPEG_UNAVAILABLE") return "The render worker isn’t available. Check Settings → Media pipeline.";
	if (error instanceof Error && error.message === "RENDER_FAILED") return "The render didn’t finish. Retry, or simplify the preset.";
	if (error instanceof Error && error.message === "RENDER_BUSY") return "A render is already running. Wait or raise the concurrent limit in Settings.";
	if (error instanceof Error && error.message === "LIBRARY_KIND_UNSUPPORTED") return "That asset kind doesn’t support this action.";
	if (error instanceof Error && error.message === "UNTRUSTED_URL") return "That URL isn’t on the import allowlist.";
	if (error instanceof Error && error.message === "MEDIA_TOO_LARGE") return "That file is larger than the workspace upload limit.";
	if (error instanceof Error && error.message === "LINEAR_NOT_CONFIGURED") return "Connect Linear in Settings first.";
	if (error instanceof Error && error.message === "LINEAR_UNAUTHORIZED") return "Linear rejected that token. Reconnect in Settings.";
	if (error instanceof Error && error.message === "LINEAR_UNAVAILABLE") return "Linear didn’t respond. Agency jobs are unchanged.";
	if (error instanceof Error && error.message === "LINEAR_RATE_LIMIT") return "Linear is rate-limited. Retry shortly.";
	if (error instanceof Error && error.message === "LINEAR_TEAM_REQUIRED") return "Select a Linear team in Settings first.";
	if (error instanceof Error && error.message === "LINEAR_PROJECT_REQUIRED") return "Select a Linear project in Settings first.";
	if (error instanceof Error && error.message === "LINEAR_ISSUE_MISSING") return "That Linear issue isn’t linked yet.";
	if (error instanceof Error && error.message === "LINEAR_OAUTH_APP_MISSING") return "Save a Linear OAuth client ID and secret first.";
	if (error instanceof Error && (error.message === "Could not sign in" || error.message === "Could not create account")) return `${error.message}. Check your details and try again.`;
	if (error instanceof Error && error.message.length > 0 && error.message.length < 180 && /[a-z]/.test(error.message) && error.message.includes(" ")) return error.message;
	return "Something went wrong. Please try again.";
}
var AppErrorBoundary = class extends import_react.Component {
	state = { error: null };
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		captureClientError(error, { source: info.componentStack ? "boundary" : "react" });
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppErrorComponent, {
			error: this.state.error,
			reset: () => this.setState({ error: null })
		});
		return this.props.children;
	}
};
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("84e93aa9a4240c380045ee2a2b03d040f71423f1e8e84c8eba0a02080539bf41"));
var styles_default = "/assets/styles-CJn-9PDR.css";
var Route$47 = createRootRoute({
	beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: APP_TAGLINE
			},
			{
				name: "theme-color",
				content: "#10B981"
			},
			{
				name: "color-scheme",
				content: "dark light"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	const [queryClient] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 3e4,
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: THEME_BOOTSTRAP } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
					client: queryClient,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] })
				}) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$31 = () => import("./routes-DnvzS_Mf.mjs");
var Route$46 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$31, "component") });
var $$splitComponentImporter$30 = () => import("../_app-BleW44Xm.mjs");
var Route$45 = createFileRoute("/_app")({ component: lazyRouteComponent($$splitComponentImporter$30, "component") });
var $$splitComponentImporter$29 = () => import("./docs-Cz8NzVMS.mjs");
var Route$44 = createFileRoute("/docs")({ component: lazyRouteComponent($$splitComponentImporter$29, "component") });
var $$splitComponentImporter$28 = () => import("./login-CDRtDVyL.mjs");
var Route$43 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$28, "component") });
var $$splitComponentImporter$27 = () => import("./portal-D38Mhf9O.mjs");
var Route$42 = createFileRoute("/portal")({ component: lazyRouteComponent($$splitComponentImporter$27, "component") });
var $$splitComponentImporter$26 = () => import("./reset-password-CZ6mLe_g.mjs");
var Route$41 = createFileRoute("/reset-password")({ component: lazyRouteComponent($$splitComponentImporter$26, "component") });
var $$splitComponentImporter$25 = () => import("./agent-dlFE4J4Y.mjs");
var Route$40 = createFileRoute("/_app/agent")({
	validateSearch: (search) => ({ run: typeof search.run === "string" && search.run.length > 0 ? search.run : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./analytics-CD0rQENz.mjs");
var Route$39 = createFileRoute("/_app/analytics")({
	validateSearch: (search) => ({ client: typeof search.client === "string" && search.client.length > 0 ? search.client : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./approvals-jo3aueiP.mjs");
var Route$38 = createFileRoute("/_app/approvals")({ component: lazyRouteComponent($$splitComponentImporter$23, "component") });
var $$splitComponentImporter$22 = () => import("./billing-1q0pUGW_.mjs");
var Route$37 = createFileRoute("/_app/billing")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
var $$splitComponentImporter$21 = () => import("./calendar-W6DgLJ5T.mjs");
var Route$36 = createFileRoute("/_app/calendar")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
var $$splitComponentImporter$20 = () => import("./clients-Db4sx14P.mjs");
var Route$35 = createFileRoute("/_app/clients")({ component: lazyRouteComponent($$splitComponentImporter$20, "component") });
var $$splitComponentImporter$19 = () => import("./home-k3ut1Edw.mjs");
var Route$34 = createFileRoute("/_app/home")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
var $$splitComponentImporter$18 = () => import("./ideation-DUEdiAJV.mjs");
var Route$33 = createFileRoute("/_app/ideation")({
	validateSearch: (search) => ({ thread: typeof search.thread === "string" && search.thread.length > 0 ? search.thread : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./inbox-CRkZMtd-.mjs");
var Route$32 = createFileRoute("/_app/inbox")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./leads-Mfxh9G0p.mjs");
var Route$31 = createFileRoute("/_app/leads")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./library-mlIlRrqd.mjs");
var Route$30 = createFileRoute("/_app/library")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./money-CSPmp1gu.mjs");
var Route$29 = createFileRoute("/_app/money")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./onboarding-DNz0LIHV.mjs");
var Route$28 = createFileRoute("/_app/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./settings-C5t0l4Uv.mjs");
var Route$27 = createFileRoute("/_app/settings")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./social-DJcFXmjw.mjs");
var Route$26 = createFileRoute("/_app/social")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./team-BM9NEPE1.mjs");
var Route$25 = createFileRoute("/_app/team")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./thumbnails-B8KedU9p.mjs");
var Route$24 = createFileRoute("/_app/thumbnails")({
	validateSearch: (search) => ({ session: typeof search.session === "string" && search.session.length > 0 ? search.session : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var Route$23 = createFileRoute("/api/agency-schema")({ server: { handlers: { GET: () => new Response(schema_default, { headers: {
	"Content-Type": "text/plain; charset=utf-8",
	"Content-Disposition": "attachment; filename=\"agency-admin-schema.sql\"",
	"Cache-Control": "no-store"
} }) } } });
function json$8(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
var Route$22 = createFileRoute("/api/demo")({ server: { handlers: { POST: async ({ request }) => {
	let payload = {};
	try {
		payload = await request.json();
	} catch {
		return json$8(400, { error: "VALIDATION" });
	}
	try {
		const { submitDemoRequest } = await import("./demo.server-Pf2MZl9Y.mjs");
		return json$8(200, await submitDemoRequest({
			name: payload.name,
			email: payload.email,
			company: payload.company,
			role: payload.role,
			country: payload.country,
			message: payload.message,
			ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
		}));
	} catch (error) {
		const code = error instanceof Error ? error.message : "DATA_UNAVAILABLE";
		return json$8(code === "DEMO_RATE_LIMIT" ? 429 : code === "VALIDATION" ? 400 : 500, { error: code });
	}
} } } });
var Route$21 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	return new Response(JSON.stringify({
		ok: true,
		product: "ClippyOS",
		startedMachine: false
	}), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
} } } });
/** Live lead pipeline totals. Never stored. */
var LEADS_QUERY_KEY = ["leads"];
var OPEN_LEAD_STATUSES = [
	"TO_CONTACT",
	"CONTACTED",
	"IN_TALKS"
];
function isOpenLead(status) {
	return OPEN_LEAD_STATUSES.includes(status);
}
function deriveLeadTotals(leads) {
	const live = leads.filter((lead) => !lead.deletedAt);
	const byStatus = Object.fromEntries(LEAD_STATUSES.map((status) => [status, {
		count: 0,
		upfront: 0,
		mrr: 0
	}]));
	let openUpfront = 0;
	let openMrr = 0;
	let closedUpfront = 0;
	let closedMrr = 0;
	let overallUpfront = 0;
	let overallMrr = 0;
	let openCount = 0;
	for (const lead of live) {
		const upfront = asMoney(lead.upfrontCash);
		const mrr = asMoney(lead.monthlyRecurring);
		const bucket = byStatus[lead.status];
		bucket.count += 1;
		bucket.upfront += upfront;
		bucket.mrr += mrr;
		if (lead.status === "LOST") continue;
		overallUpfront += upfront;
		overallMrr += mrr;
		if (lead.status === "CLOSED") {
			closedUpfront += upfront;
			closedMrr += mrr;
		} else if (isOpenLead(lead.status)) {
			openCount += 1;
			openUpfront += upfront;
			openMrr += mrr;
		}
	}
	return {
		count: live.length,
		openCount,
		openUpfront,
		openMrr,
		closedUpfront,
		closedMrr,
		overallUpfront,
		overallMrr,
		byStatus
	};
}
async function load_agency_db() {
	return import("./agency-db.server-C5U0oEf7.mjs").then((n) => n.t).then((n) => n.t);
}
var SaveLeadSchema = object({
	id: string().min(1).optional(),
	name: string().trim().min(1).max(200),
	channelUrl: string().trim().max(500).nullable(),
	notes: string().max(2e4).nullable(),
	status: _enum(LEAD_STATUSES),
	upfrontCash: number().min(0).max(1e6),
	monthlyRecurring: number().min(0).max(1e6)
});
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function sanitizeNullable(value) {
	if (value == null || value === "") return null;
	return sanitizeText(value);
}
async function readLeads() {
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("leads").select("*").order("updated_at", { ascending: false });
		if (!error) return (data ?? []).map((row) => mapLead(row));
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	return (await (await (await load_agency_db()).localSql()).query("select * from leads order by updated_at desc")).map(mapLead);
}
async function internalSaveLead(data, actorId) {
	const stamp = nowIso();
	const isInsert = !data.id;
	const id = data.id ?? newId();
	const payload = {
		id,
		name: sanitizeText(data.name),
		channel_url: sanitizeNullable(data.channelUrl),
		notes: sanitizeNullable(data.notes),
		status: data.status,
		upfront_cash: data.upfrontCash,
		monthly_recurring: data.monthlyRecurring,
		updated_at: stamp,
		created_at: stamp,
		created_by: actorId,
		deleted_at: null
	};
	const admin = await (await load_agency_db()).getAgencyAdmin();
	if (admin) {
		if (isInsert) {
			const { error } = await admin.from("leads").insert(payload);
			if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
			if (!error) return mapLead(payload);
		} else {
			const existing = await admin.from("leads").select("*").eq("id", id).maybeSingle();
			if (existing.error && !isMissingTable(existing.error)) throw new Error("DATA_UNAVAILABLE");
			if (!existing.error) {
				if (!existing.data) throw new Error("LEAD_MISSING");
				const { error } = await admin.from("leads").update({
					name: payload.name,
					channel_url: payload.channel_url,
					notes: payload.notes,
					status: payload.status,
					upfront_cash: payload.upfront_cash,
					monthly_recurring: payload.monthly_recurring,
					updated_at: stamp
				}).eq("id", id).is("deleted_at", null);
				if (error) throw new Error("DATA_UNAVAILABLE");
				const current = await admin.from("leads").select("*").eq("id", id).maybeSingle();
				if (current.data) return mapLead(current.data);
			}
		}
	}
	const sql = await (await load_agency_db()).localSql();
	if (isInsert) await sql.query(`insert into leads (
          id, name, channel_url, notes, status, upfront_cash, monthly_recurring,
          created_at, updated_at, created_by, deleted_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,null)`, [
		payload.id,
		payload.name,
		payload.channel_url,
		payload.notes,
		payload.status,
		payload.upfront_cash,
		payload.monthly_recurring,
		stamp,
		actorId
	]);
	else {
		if (!(await sql.query("select id from leads where id = $1 and deleted_at is null", [id]))[0]) throw new Error("LEAD_MISSING");
		await sql.query(`update leads set
          name=$2, channel_url=$3, notes=$4, status=$5,
          upfront_cash=$6, monthly_recurring=$7, updated_at=$8
         where id=$1 and deleted_at is null`, [
			id,
			payload.name,
			payload.channel_url,
			payload.notes,
			payload.status,
			payload.upfront_cash,
			payload.monthly_recurring,
			stamp
		]);
	}
	const rows = await sql.query("select * from leads where id = $1", [id]);
	if (!rows[0]) throw new Error("LEAD_MISSING");
	return mapLead(rows[0]);
}
var listLeads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d20028d52bf23e06e765fd5f9ef65eb26fe51e974f6e76195c6468d572642b8a"));
var saveLead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveLeadSchema.parse(input)).handler(createSsrRpc("8e3d1e2c8280dc6e010c59e6935172aba8935f272ad02cc556abb61ed66b532d"));
var softDeleteLead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("ca3ea92dd652ccb435560128fc3608af4fffce9a5f43e703a30f278553302622"));
function deny(message = "This key cannot perform that action.") {
	return {
		ok: false,
		status: 403,
		code: "FORBIDDEN",
		message
	};
}
function need(actor, scope) {
	return hasScope(actor.scopes, scope);
}
function publicClient(client) {
	return {
		id: client.id,
		name: client.name,
		channelUrl: client.channelUrl,
		planType: client.planType,
		customPlanLabel: client.customPlanLabel,
		status: client.status,
		startDate: client.startDate,
		monthlyFee: client.monthlyFee,
		setupFee: client.setupFee,
		notes: client.notes,
		createdAt: client.createdAt,
		updatedAt: client.updatedAt
	};
}
async function dashboardSnapshot() {
	const today = todayIsoDate();
	const [clients, payments, teamMembers, progress, leads, snapshots] = await Promise.all([
		readClients(),
		readPayments(),
		readTeamMembers(),
		readProgress(),
		readLeads(),
		readSnapshots()
	]);
	const metrics = deriveDashboardMetrics({
		clients,
		payments,
		teamMembers
	}, today);
	const guarantees = deriveGuaranteeItems(clients, snapshots, today);
	const latest = /* @__PURE__ */ new Map();
	for (const row of progress) if (!latest.has(row.clientId)) latest.set(row.clientId, row.stage);
	const pipeline = derivePipelineCounts(clients.map((client) => ({
		id: client.id,
		status: client.status,
		deletedAt: client.deletedAt,
		currentStage: latest.get(client.id) ?? null
	})));
	const activity = deriveRecentActivity({
		clients,
		payments,
		progress,
		leads: leads.filter((lead) => !lead.deletedAt)
	});
	return {
		metrics,
		pipeline,
		atRisk: guarantees.filter((item) => item.dayCount >= 25),
		recentActivity: activity,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		policies: await readPlaybookPolicies(),
		automationEnabled: await readAutomationEnabled()
	};
}
async function patchClientLimited(input) {
	const stamp = (/* @__PURE__ */ new Date()).toISOString();
	const admin = await getAgencyAdmin();
	const patch = { updated_at: stamp };
	if (input.notes !== void 0) patch.notes = input.notes ? sanitizeText(input.notes) : null;
	if (input.status === "CHURNED") {
		patch.status = "CHURNED";
		patch.deleted_at = stamp;
	} else if (input.status === "ACTIVE") {
		patch.status = "ACTIVE";
		patch.deleted_at = null;
	}
	if (admin) {
		const { error } = await admin.from("clients").update(patch).eq("id", input.id);
		if (!error) return;
		if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	}
	const sql = await localSql();
	if (input.status === "CHURNED") await sql.query("update clients set notes = coalesce($3, notes), status = 'CHURNED', deleted_at = $2, updated_at = $2 where id = $1", [
		input.id,
		stamp,
		patch.notes ?? null
	]);
	else if (input.status === "ACTIVE") await sql.query("update clients set notes = coalesce($3, notes), status = 'ACTIVE', deleted_at = null, updated_at = $2 where id = $1", [
		input.id,
		stamp,
		patch.notes ?? null
	]);
	else await sql.query("update clients set notes = $3, updated_at = $2 where id = $1", [
		input.id,
		stamp,
		patch.notes ?? null
	]);
}
async function enqueueAiJob(_actor, kind, clientId, run) {
	const jobId = crypto.randomUUID();
	await insertAgentJob({
		id: jobId,
		kind,
		clientId
	});
	(async () => {
		try {
			await updateAgentJob(jobId, { status: "running" });
			const result = await run();
			await updateAgentJob(jobId, {
				status: "completed",
				result
			});
		} catch (error) {
			const code = error instanceof Error ? error.message.slice(0, 80) : "GENERATION_FAILED";
			await updateAgentJob(jobId, {
				status: "error",
				errorCode: code
			});
		}
	})();
	return {
		ok: true,
		data: {
			status: "accepted",
			jobId,
			clientId
		}
	};
}
async function runAutonomyAction(input) {
	const { actor, action, payload, requestId } = input;
	const playbookId = input.playbookId || (typeof payload.playbook === "string" ? payload.playbook : typeof payload.playbookId === "string" ? payload.playbookId : null);
	const runId = input.runId || (typeof payload.runId === "string" ? payload.runId : typeof payload.run_id === "string" ? payload.run_id : null);
	let entityType = null;
	let entityId = null;
	try {
		if (AGENT_MUTATIONS.has(action) && !await readAutomationEnabled()) {
			await writeAuditLog({
				requestId,
				actor,
				action,
				playbookId,
				runId,
				result: "denied",
				errorCode: "AUTOMATION_PAUSED"
			});
			return {
				ok: false,
				status: 503,
				code: "AUTOMATION_PAUSED",
				message: "Automation is paused. Human UI is still live."
			};
		}
		const result = await execute(actor, action, payload);
		if (result.ok) {
			const meta = result.data;
			entityId = meta && typeof meta === "object" ? meta.id ?? meta.clientId ?? null : null;
			entityType = guessEntity(action);
			await writeAuditLog({
				requestId,
				actor,
				action,
				entityType,
				entityId,
				playbookId,
				runId,
				result: "ok"
			});
			if (AGENT_MUTATIONS.has(action)) import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onHermesPrivileged({
				actorId: actor.keyId ?? actor.source,
				action,
				requestId,
				entityType,
				entityId,
				summary: `Hermes ${action}`
			})).catch(() => {});
			if (runId) import("./skill-distill.server-CxveMxck.mjs").then((mod) => mod.maybeDistillSkillFromRun({
				runId,
				playbookId,
				actorLabel: actor.label
			})).catch(() => {});
		} else if (result.code === "FORBIDDEN") await writeAuditLog({
			requestId,
			actor,
			action,
			playbookId,
			runId,
			result: "denied",
			errorCode: result.code
		});
		else await writeAuditLog({
			requestId,
			actor,
			action,
			playbookId,
			runId,
			result: "error",
			errorCode: result.code
		});
		return result;
	} catch (error) {
		const code = error instanceof Error ? error.message : "DATA_UNAVAILABLE";
		await writeAuditLog({
			requestId,
			actor,
			action,
			entityType,
			entityId,
			playbookId,
			runId,
			result: code === "FORBIDDEN" || code === "UNAUTHORIZED" ? "denied" : "error",
			errorCode: code.slice(0, 80)
		});
		return mapError(code);
	}
}
function guessEntity(action) {
	if (action.startsWith("library.")) return "media_asset";
	if (action.startsWith("linear.")) return "linear_issue";
	if (action.startsWith("skills.") || action === "tasks.get") return "skill";
	if (action === "list_addons") return "addon";
	if (action.includes("llm")) return "llm";
	if (action.includes("payment")) return "payment";
	if (action.includes("lead")) return "lead";
	if (action.includes("client") || action.includes("progress") || action.includes("analytics") || action.includes("suggested")) return "client";
	if (action.includes("dashboard")) return "dashboard";
	return null;
}
function mapError(code) {
	const hit = {
		UNAUTHORIZED: {
			status: 401,
			message: "Invalid or revoked credentials."
		},
		FORBIDDEN: {
			status: 403,
			message: "This key cannot perform that action."
		},
		RATE_LIMITED: {
			status: 429,
			message: "Too many requests. Retry shortly."
		},
		CLIENT_MISSING: {
			status: 404,
			message: "That client is no longer available."
		},
		PAYMENT_MISSING: {
			status: 404,
			message: "That payment is no longer available."
		},
		PAYMENT_ALREADY_PAID: {
			status: 409,
			message: "That payment was already marked paid."
		},
		LEAD_MISSING: {
			status: 404,
			message: "That lead is no longer available."
		},
		AI_UNAVAILABLE: {
			status: 503,
			message: "AI isn’t connected yet."
		},
		YOUTUBE_KEY_MISSING: {
			status: 503,
			message: "YouTube Data API isn’t connected yet."
		},
		YOUTUBE_UNAVAILABLE: {
			status: 502,
			message: "Couldn’t read that YouTube channel."
		},
		CHANNEL_MISSING: {
			status: 400,
			message: "Add a YouTube channel URL first."
		},
		INVALID_YOUTUBE_URL: {
			status: 400,
			message: "Use a valid YouTube channel URL."
		},
		VALIDATION: {
			status: 400,
			message: "The request body didn’t match the expected fields."
		},
		YOUTUBE_CHANNEL_NOT_FOUND: {
			status: 400,
			message: "Couldn’t resolve that YouTube channel."
		},
		GENERATION_FAILED: {
			status: 502,
			message: "Generation didn’t finish. Try again."
		},
		AI_RATE_LIMIT: {
			status: 429,
			message: "AI is rate-limited. Retry shortly."
		},
		CUSTOM_PLAN_LABEL: {
			status: 400,
			message: "Custom plans need a short label."
		},
		CUSTOM_FEE: {
			status: 400,
			message: "Custom monthly fee must be a multiple of 1,000."
		},
		JOB_MISSING: {
			status: 404,
			message: "That job is no longer available."
		},
		DATA_UNAVAILABLE: {
			status: 503,
			message: "Workspace data isn’t reachable."
		},
		AUTOMATION_PAUSED: {
			status: 503,
			message: "Automation is paused. Human UI is still live."
		},
		HUMAN_REQUIRED: {
			status: 403,
			message: "That change needs a human operator."
		},
		MACHINE_STOPPED: {
			status: 409,
			message: "Start the Social Machine first. It stays off until started."
		},
		DAYTONA_UNAVAILABLE: {
			status: 503,
			message: "Daytona isn’t connected yet."
		},
		UPLOAD_IN_PROGRESS: {
			status: 409,
			message: "Another social upload is already running."
		},
		ASSET_MISSING: {
			status: 404,
			message: "That asset isn’t eligible for upload."
		},
		ASSET_NOT_READY: {
			status: 409,
			message: "That library asset is still processing."
		},
		CAPTION_ENGINE_MISSING: {
			status: 503,
			message: "Connect transcription or upload an SRT."
		},
		CAPTION_NOT_READY: {
			status: 409,
			message: "Captions aren’t ready yet."
		},
		SRT_INVALID: {
			status: 400,
			message: "That SRT couldn’t be parsed."
		},
		FFMPEG_UNAVAILABLE: {
			status: 503,
			message: "The render worker isn’t available."
		},
		RENDER_FAILED: {
			status: 502,
			message: "The render didn’t finish."
		},
		LIBRARY_KIND_UNSUPPORTED: {
			status: 400,
			message: "That asset kind doesn’t support this action."
		},
		UNTRUSTED_URL: {
			status: 400,
			message: "That URL isn’t on the import allowlist."
		},
		MEDIA_TOO_LARGE: {
			status: 400,
			message: "That file is larger than the upload limit."
		},
		POST_MISSING: {
			status: 404,
			message: "That social post is no longer available."
		},
		JOB_CANCELLED: {
			status: 409,
			message: "That upload job was cancelled."
		},
		PLATFORM_NEEDS_LOGIN: {
			status: 409,
			message: "That platform needs a human login first."
		},
		COMPUTER_USE_UNAVAILABLE: {
			status: 503,
			message: "The desktop stack isn’t available on the Social Machine."
		},
		AUTO_STOP_INVALID: {
			status: 400,
			message: "Auto-stop must be between 5 and 240 minutes."
		},
		UNTRUSTED_IMAGE: {
			status: 400,
			message: "That media URL can’t be used here."
		},
		AI_TIER_GATED: {
			status: 403,
			message: "SuperGrok OAuth is connected, but this account’s tier cannot run inference. Use the metered xAI API key."
		},
		SKILL_MISSING: {
			status: 404,
			message: "That skill is no longer available."
		},
		SKILL_DISABLED: {
			status: 409,
			message: "That skill is disabled."
		},
		SKILL_PENDING: {
			status: 409,
			message: "That skill is waiting for human approval."
		},
		SKILL_EXEC_FAILED: {
			status: 502,
			message: "The skill didn’t finish in the sandbox."
		},
		SKILL_TOO_LARGE: {
			status: 400,
			message: "That skill script is too large to run."
		},
		APPROVAL_MISSING: {
			status: 404,
			message: "That approval request is no longer available."
		},
		APPROVAL_NOT_PENDING: {
			status: 409,
			message: "That request was already decided."
		},
		APPROVAL_FORBIDDEN: {
			status: 403,
			message: "This key cannot decide that approval."
		},
		SELF_APPROVE_DENIED: {
			status: 403,
			message: "Self-approve is off. Another admin must sign off."
		},
		APPROVAL_EXPIRED: {
			status: 409,
			message: "That approval request expired."
		},
		AWAITING_APPROVAL: {
			status: 409,
			message: "That job is waiting for human approval."
		},
		ADDON_MISSING: {
			status: 404,
			message: "That add-on isn’t installed."
		},
		ADDON_INVALID: {
			status: 400,
			message: "That add-on manifest isn’t valid."
		},
		LINEAR_NOT_CONFIGURED: {
			status: 503,
			message: "Linear isn’t connected yet."
		},
		LINEAR_UNAUTHORIZED: {
			status: 401,
			message: "Linear rejected that token. Reconnect in Settings."
		},
		LINEAR_UNAVAILABLE: {
			status: 502,
			message: "Linear didn’t respond. The Agency job is unchanged."
		},
		LINEAR_RATE_LIMIT: {
			status: 429,
			message: "Linear rate limit. Retry shortly."
		},
		LINEAR_TEAM_REQUIRED: {
			status: 400,
			message: "Select a Linear team in Settings first."
		},
		LINEAR_PROJECT_REQUIRED: {
			status: 400,
			message: "Select a Linear project in Settings first."
		},
		LINEAR_ISSUE_MISSING: {
			status: 404,
			message: "That Linear issue isn’t linked."
		},
		LINEAR_OAUTH_APP_MISSING: {
			status: 400,
			message: "Save a Linear OAuth client ID and secret first."
		}
	}[code] ?? {
		status: 400,
		message: "The request could not be completed."
	};
	return {
		ok: false,
		status: hit.status,
		code,
		message: hit.message
	};
}
async function execute(actor, action, payload) {
	switch (action) {
		case "list_clients": {
			if (!need(actor, "read")) return deny();
			const includeChurned = payload.includeChurned === true;
			const search = typeof payload.search === "string" ? payload.search.trim().toLowerCase() : "";
			const status = payload.status === "CHURNED" || payload.status === "ACTIVE" ? payload.status : null;
			const [clients, progress] = await Promise.all([readClients(), readProgress()]);
			const latest = /* @__PURE__ */ new Map();
			for (const row of progress) if (!latest.has(row.clientId)) latest.set(row.clientId, {
				stage: row.stage,
				source: row.source
			});
			return {
				ok: true,
				data: { clients: clients.filter((client) => includeChurned ? true : isActiveClient(client)).filter((client) => status ? client.status === status : true).filter((client) => search ? `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(search) : true).map((client) => ({
					...publicClient(client),
					currentStage: latest.get(client.id)?.stage ?? null,
					currentSource: latest.get(client.id)?.source ?? null
				})) }
			};
		}
		case "get_client": {
			if (!need(actor, "read")) return deny();
			const id = String(payload.id ?? payload.clientId ?? "");
			if (!id) return mapError("VALIDATION");
			const [clients, progress, snapshots] = await Promise.all([
				readClients(),
				readProgress(),
				readSnapshots()
			]);
			const client = clients.find((row) => row.id === id);
			if (!client || client.deletedAt) return mapError("CLIENT_MISSING");
			const history = progress.filter((row) => row.clientId === id);
			const latestSnap = snapshots.filter((row) => row.clientId === id).sort((a, b) => b.date.localeCompare(a.date))[0];
			return {
				ok: true,
				data: {
					...publicClient(client),
					currentStage: history[0]?.stage ?? null,
					currentSource: history[0]?.source ?? null,
					progress: history.slice(0, 20).map((row) => ({
						id: row.id,
						stage: row.stage,
						source: row.source,
						notes: row.notes,
						createdAt: row.createdAt
					})),
					latestAnalytics: latestSnap ? {
						date: latestSnap.date,
						views: latestSnap.views,
						subscribers: latestSnap.subscribers
					} : null
				}
			};
		}
		case "create_client": {
			if (!need(actor, "write:clients")) return deny();
			const name = String(payload.name ?? "").trim();
			if (!name) return mapError("VALIDATION");
			const planType = PLAN_TYPES.includes(String(payload.planType)) ? payload.planType : "TEAM_ONLY";
			const channelUrl = typeof payload.channelUrl === "string" ? payload.channelUrl : null;
			let extras = {
				channelThumbnail: null,
				channelSummary: null,
				offers: null,
				contentStrategy: null
			};
			if (channelUrl) try {
				const { llmAvailable, synthesizeChannel } = await import("./analyze.server-CGOV0UvB.mjs");
				if (await llmAvailable()) {
					const { fetchChannelSnapshot } = await import("./youtube.server-D98qL7z7.mjs");
					const snapshot = await fetchChannelSnapshot(channelUrl);
					const synthesis = await synthesizeChannel(snapshot);
					extras = {
						channelThumbnail: snapshot.thumbnail,
						channelSummary: synthesis.channelSummary,
						offers: synthesis.offers,
						contentStrategy: synthesis.contentStrategy
					};
				}
			} catch {}
			const created = await internalSaveClient({
				name,
				channelUrl,
				channelThumbnail: extras.channelThumbnail,
				channelSummary: extras.channelSummary,
				offers: extras.offers,
				contentStrategy: extras.contentStrategy,
				planType,
				customPlanLabel: typeof payload.customPlanLabel === "string" ? payload.customPlanLabel : null,
				setupFee: DEFAULT_SETUP_FEE,
				monthlyFee: DEFAULT_MONTHLY_FEE[planType],
				startDate: typeof payload.startDate === "string" ? payload.startDate : todayIsoDate(),
				notes: typeof payload.notes === "string" ? payload.notes : null
			}, `agent:${actor.keyId ?? actor.source}`, "AGENT");
			emitAutonomyEvent({
				type: "client.created",
				entityType: "client",
				entityId: created.id,
				data: { name }
			});
			return {
				ok: true,
				data: { id: created.id }
			};
		}
		case "update_client": {
			if (!need(actor, "write:clients")) return deny();
			const id = String(payload.id ?? payload.clientId ?? "");
			if (!id) return mapError("VALIDATION");
			const client = (await readClients()).find((row) => row.id === id);
			if (!client) return mapError("CLIENT_MISSING");
			if (String(payload.status) === "CHURNED") return mapError("HUMAN_REQUIRED");
			const status = payload.status === "ACTIVE" ? "ACTIVE" : void 0;
			await patchClientLimited({
				id,
				notes: typeof payload.notes === "string" ? payload.notes : void 0,
				status
			});
			if (status && status !== client.status) emitAutonomyEvent({
				type: "client.status_changed",
				entityType: "client",
				entityId: id,
				data: { status }
			});
			return {
				ok: true,
				data: { id }
			};
		}
		case "list_payments": {
			if (!need(actor, "read")) return deny();
			const today = todayIsoDate();
			const clientId = typeof payload.clientId === "string" ? payload.clientId : null;
			const [payments, clients] = await Promise.all([readPayments(), readClients()]);
			const names = new Map(clients.map((row) => [row.id, row.name]));
			return {
				ok: true,
				data: { payments: payments.filter((payment) => clientId ? payment.clientId === clientId : true).map((payment) => ({
					id: payment.id,
					clientId: payment.clientId,
					clientName: names.get(payment.clientId) ?? null,
					amount: asMoney(payment.amount),
					type: payment.type,
					dueDate: payment.dueDate,
					paidDate: payment.paidDate,
					status: payment.status,
					displayStatus: displayPaymentStatus(payment, today)
				})) }
			};
		}
		case "mark_payment_paid": {
			if (!need(actor, "write:payments")) return deny();
			const id = String(payload.id ?? payload.paymentId ?? "");
			if (!id) return mapError("VALIDATION");
			const result = await internalMarkPaymentPaid(id);
			emitAutonomyEvent({
				type: "payment.collected",
				entityType: "payment",
				entityId: id,
				data: { paidDate: result.paidDate }
			});
			import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onPaymentMarkedPaid({
				actorId: actor.keyId ?? actor.source,
				paymentId: id
			})).catch(() => {});
			return {
				ok: true,
				data: {
					id,
					paidDate: result.paidDate
				}
			};
		}
		case "get_client_progress": {
			if (!need(actor, "read")) return deny();
			const id = String(payload.id ?? payload.clientId ?? "");
			if (!id) return mapError("VALIDATION");
			const progress = (await readProgress()).filter((row) => row.clientId === id);
			return {
				ok: true,
				data: {
					clientId: id,
					current: progress[0] ?? null,
					history: progress.slice(0, 30)
				}
			};
		}
		case "set_client_stage": {
			if (!need(actor, "write:progress")) return deny();
			const clientId = String(payload.clientId ?? payload.id ?? "");
			const stage = String(payload.stage ?? "");
			if (!clientId || !PROGRESS_STAGES.includes(stage)) return mapError("VALIDATION");
			const notes = typeof payload.notes === "string" ? payload.notes : null;
			const written = await internalSetClientStage({
				clientId,
				stage,
				source: "AGENT",
				notes,
				actorId: `agent:${actor.keyId ?? actor.source}`
			});
			emitAutonomyEvent({
				type: "progress.stage_changed",
				entityType: "client",
				entityId: clientId,
				data: {
					stage,
					source: "AGENT"
				}
			});
			return {
				ok: true,
				data: {
					id: written.id,
					clientId,
					stage,
					source: "AGENT"
				}
			};
		}
		case "list_leads": {
			if (!need(actor, "read")) return deny();
			const leads = (await readLeads()).filter((lead) => !lead.deletedAt);
			return {
				ok: true,
				data: {
					leads,
					totals: deriveLeadTotals(leads)
				}
			};
		}
		case "create_lead": {
			if (!need(actor, "write:leads")) return deny();
			const name = String(payload.name ?? "").trim();
			if (!name) return mapError("VALIDATION");
			const status = LEAD_STATUSES.includes(String(payload.status)) ? payload.status : "TO_CONTACT";
			const lead = await internalSaveLead({
				name,
				channelUrl: typeof payload.channelUrl === "string" ? payload.channelUrl : null,
				notes: typeof payload.notes === "string" ? payload.notes : null,
				status,
				upfrontCash: typeof payload.upfrontCash === "number" ? payload.upfrontCash : 0,
				monthlyRecurring: typeof payload.monthlyRecurring === "number" ? payload.monthlyRecurring : 0
			}, `agent:${actor.keyId ?? actor.source}`);
			emitAutonomyEvent({
				type: "lead.created",
				entityType: "lead",
				entityId: lead.id,
				data: {
					name: lead.name,
					status: lead.status
				}
			});
			return {
				ok: true,
				data: lead
			};
		}
		case "update_lead":
		case "update_lead_status": {
			if (!need(actor, "write:leads")) return deny();
			const id = String(payload.id ?? payload.leadId ?? "");
			if (!id) return mapError("VALIDATION");
			const existing = (await readLeads()).find((lead) => lead.id === id && !lead.deletedAt);
			if (!existing) return mapError("LEAD_MISSING");
			const status = LEAD_STATUSES.includes(String(payload.status)) ? payload.status : existing.status;
			const lead = await internalSaveLead({
				id,
				name: typeof payload.name === "string" ? payload.name : existing.name,
				channelUrl: typeof payload.channelUrl === "string" ? payload.channelUrl : existing.channelUrl,
				notes: typeof payload.notes === "string" ? payload.notes : existing.notes,
				status,
				upfrontCash: typeof payload.upfrontCash === "number" ? payload.upfrontCash : asMoney(existing.upfrontCash),
				monthlyRecurring: typeof payload.monthlyRecurring === "number" ? payload.monthlyRecurring : asMoney(existing.monthlyRecurring)
			}, `agent:${actor.keyId ?? actor.source}`);
			if (status !== existing.status) emitAutonomyEvent({
				type: "lead.status_changed",
				entityType: "lead",
				entityId: id,
				data: { status }
			});
			return {
				ok: true,
				data: lead
			};
		}
		case "pull_client_analytics":
		case "pull_analytics": {
			if (!need(actor, "read")) return deny();
			const clientId = String(payload.clientId ?? payload.id ?? "");
			if (!clientId) return mapError("VALIDATION");
			const { youtubeDataApiAvailable } = await import("./youtube-data.server-CmwbKs56.mjs");
			if (!await youtubeDataApiAvailable()) throw new Error("YOUTUBE_KEY_MISSING");
			const client = (await readClients()).find((row) => row.id === clientId && isActiveClient(row));
			if (!client) return mapError("CLIENT_MISSING");
			const snapshot = await persistPull({
				client,
				userId: `agent:${actor.keyId ?? actor.source}`
			});
			emitAutonomyEvent({
				type: "analytics.snapshot_created",
				entityType: "client",
				entityId: clientId,
				data: { date: snapshot.date }
			});
			const atRisk = deriveGuaranteeItems([client], [snapshot], todayIsoDate());
			if (atRisk[0] && atRisk[0].dayCount >= 25) emitAutonomyEvent({
				type: "client.at_risk_30d",
				entityType: "client",
				entityId: clientId,
				data: {
					dayCount: atRisk[0].dayCount,
					views: snapshot.views
				}
			});
			return {
				ok: true,
				data: snapshot
			};
		}
		case "get_analytics_snapshot": {
			if (!need(actor, "read")) return deny();
			const clientId = String(payload.clientId ?? payload.id ?? "");
			if (!clientId) return mapError("VALIDATION");
			return {
				ok: true,
				data: { snapshots: (await readSnapshots()).filter((row) => row.clientId === clientId).map((row) => ({
					id: row.id,
					date: row.date,
					views: row.views,
					subscribers: row.subscribers,
					watchHours: row.watchHours,
					impressionsCtr: row.impressionsCtr
				})) }
			};
		}
		case "analytics.refresh_post_performance": {
			if (!need(actor, "read")) return deny();
			const fetch = await import("./performance-fetch.server-BDzg5W1p.mjs");
			if (payload.sweep === true || !payload.socialPostId) {
				const due = await fetch.sweepDuePerformanceFetches(12);
				const stale = await fetch.sweepStalePublishedPosts();
				const { distillWinnersToProposals } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
				return {
					ok: true,
					data: {
						due,
						stale,
						distilled: await distillWinnersToProposals(`agent:${actor.keyId ?? actor.source}`, 3).catch(() => 0)
					}
				};
			}
			const result = await fetch.refreshPostById(String(payload.socialPostId), `agent:${actor.keyId ?? actor.source}`);
			if (!result.ok) return mapError(result.reason ?? "METRICS_UNAVAILABLE");
			return {
				ok: true,
				data: { ok: true }
			};
		}
		case "analytics.list_winners": {
			if (!need(actor, "read")) return deny();
			const { listWinners } = await import("./performance.server-kOlT5k3Z.mjs");
			const platform = payload.platform ? String(payload.platform) : void 0;
			return {
				ok: true,
				data: { winners: (await listWinners({
					clientId: payload.clientId ? String(payload.clientId) : void 0,
					platform
				})).map((row) => ({
					id: row.id,
					platform: row.platform,
					externalPostId: row.externalPostId,
					externalUrl: row.externalUrl,
					score: row.score,
					verdict: row.verdict,
					views: row.metrics.views,
					engagementRate: row.engagementRate,
					clientId: row.clientId,
					mediaAssetId: row.mediaAssetId,
					capturedAt: row.capturedAt,
					window: row.window
				})) }
			};
		}
		case "knowledge.list_proposals": {
			if (!need(actor, "read")) return deny();
			const { listKnowledgeProposals } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
			return {
				ok: true,
				data: { items: (await listKnowledgeProposals({
					status: payload.status ? String(payload.status) : void 0,
					clientId: payload.clientId ? String(payload.clientId) : void 0
				})).map((row) => ({
					id: row.id,
					status: row.status,
					suggestedScope: row.suggestedScope,
					learnedPrincipleDraft: row.learnedPrincipleDraft,
					confidence: row.confidence,
					clientId: row.clientId,
					createdAt: row.createdAt
				})) }
			};
		}
		case "knowledge.decide_proposal": {
			if (!need(actor, "approvals:admin")) return deny();
			const id = String(payload.id ?? "");
			const decision = String(payload.decision ?? "").toUpperCase();
			if (!id || decision !== "APPROVED" && decision !== "REJECTED") return mapError("VALIDATION");
			const { decideProposal } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
			const row = await decideProposal({
				id,
				decision,
				actorId: `agent:${actor.keyId ?? actor.source}`,
				note: payload.note ? String(payload.note) : null
			});
			return {
				ok: true,
				data: {
					id: row.id,
					status: row.status,
					mergedEntryId: row.mergedEntryId
				}
			};
		}
		case "get_dashboard_snapshot":
			if (!need(actor, "read")) return deny();
			return {
				ok: true,
				data: await dashboardSnapshot()
			};
		case "list_at_risk_clients":
			if (!need(actor, "read")) return deny();
			return {
				ok: true,
				data: { clients: (await dashboardSnapshot()).atRisk }
			};
		case "regenerate_suggested_titles": {
			if (!need(actor, "actions:ai")) return deny();
			const clientId = String(payload.clientId ?? payload.id ?? "");
			if (!clientId) return mapError("VALIDATION");
			return enqueueAiJob(actor, "suggested_titles", clientId, () => internalGenerateSuggestedTitles(clientId));
		}
		case "regenerate_suggested_ideas": {
			if (!need(actor, "actions:ai")) return deny();
			const clientId = String(payload.clientId ?? payload.id ?? "");
			if (!clientId) return mapError("VALIDATION");
			return enqueueAiJob(actor, "suggested_ideas", clientId, () => internalGenerateSuggestedIdeas(clientId));
		}
		case "get_job": {
			if (!need(actor, "read")) return deny();
			const id = String(payload.id ?? payload.jobId ?? "");
			if (!id) return mapError("VALIDATION");
			const job = await readAgentJob(id);
			if (!job) return mapError("JOB_MISSING");
			return {
				ok: true,
				data: job
			};
		}
		case "get_integration_status": {
			if (!need(actor, "read")) return deny();
			const { llmStatus } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
			const { higgsfieldAvailable } = await import("./higgsfield.server-DqdavdNF.mjs").then((n) => n.n).then((n) => n.n);
			const { youtubeDataApiAvailable } = await import("./youtube-data.server-CmwbKs56.mjs");
			const { loadDiscordToken } = await import("./discord.server-Dlb8OQV5.mjs").then((n) => n.t).then((n) => n.t);
			const { readAppSetting } = await import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
			const [llm, hf, yt, discord, notion, daytona, xPub, linear] = await Promise.all([
				llmStatus(),
				higgsfieldAvailable(),
				youtubeDataApiAvailable(),
				loadDiscordToken(),
				readAppSetting("NOTION_TOKEN"),
				readAppSetting("DAYTONA_API_KEY"),
				import("./x-publisher.server-XqKsxSab.mjs").then((mod) => mod.isConfigured()).catch(() => false),
				import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.linearEnabledAndReady()).catch(() => false)
			]);
			return {
				ok: true,
				data: {
					ai: llm.available ? "connected" : "not_configured",
					higgsfield: hf ? "connected" : "not_configured",
					youtube: yt ? "connected" : "not_configured",
					discord: discord ? "connected" : "not_configured",
					notion: notion ? "connected" : "not_configured",
					x: xPub ? "connected" : "not_configured",
					daytona: daytona ? "connected" : "not_configured",
					linear: linear ? "connected" : "not_configured"
				}
			};
		}
		case "get_playbook_catalog":
			if (!need(actor, "read")) return deny();
			return {
				ok: true,
				data: {
					playbooks: HERMES_PLAYBOOKS,
					policies: await readPlaybookPolicies(),
					automationEnabled: await readAutomationEnabled()
				}
			};
		case "get_connect_status": {
			if (!need(actor, "read")) return deny();
			const { buildConnectStatus } = await import("./hermes-connect.server-teaCO3Ci.mjs");
			return {
				ok: true,
				data: await buildConnectStatus()
			};
		}
		case "get_playbook_package": {
			if (!need(actor, "read")) return deny();
			const { buildPlaybookPackageText } = await import("./hermes-connect.server-teaCO3Ci.mjs");
			return {
				ok: true,
				data: await buildPlaybookPackageText(typeof payload.origin === "string" ? payload.origin : void 0)
			};
		}
		case "approvals.list_pending": {
			if (!need(actor, "read")) return deny();
			const { listApprovalRequests } = await import("./approvals.server-Bpax_gE8.mjs");
			return {
				ok: true,
				data: { items: (await listApprovalRequests({
					status: "PENDING",
					limit: 40
				})).map((row) => ({
					id: row.id,
					type: row.type,
					status: row.status,
					title: row.title,
					summary: row.summary,
					clientId: row.clientId,
					resourceType: row.resourceType,
					resourceId: row.resourceId,
					createdAt: row.createdAt,
					requestedBy: row.requestedBy
				})) }
			};
		}
		case "approvals.decide": {
			const adminScope = hasScope(actor.scopes, "approvals:admin");
			if (!adminScope) return deny();
			const id = String(payload.id ?? payload.approvalId ?? "");
			const decisionRaw = String(payload.decision ?? payload.status ?? "").toUpperCase();
			const decision = decisionRaw === "APPROVED" || decisionRaw === "REJECTED" || decisionRaw === "CANCELED" ? decisionRaw : null;
			if (!id || !decision) return mapError("VALIDATION");
			const { decideApproval } = await import("./approvals.server-Bpax_gE8.mjs");
			const item = await decideApproval({
				id,
				actorId: `agent:${actor.keyId ?? actor.source}`,
				decision,
				note: typeof payload.note === "string" ? payload.note : null,
				hermesAdmin: adminScope
			});
			return {
				ok: true,
				data: {
					id: item.id,
					status: item.status
				}
			};
		}
		case "skills.list": {
			if (!need(actor, "read")) return deny();
			const { listPublicSkills, publicSkillSummary } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			return {
				ok: true,
				data: { skills: (await listPublicSkills()).map(publicSkillSummary) }
			};
		}
		case "skills.get": {
			if (!need(actor, "read")) return deny();
			const id = String(payload.id ?? payload.skillId ?? "");
			if (!id) return mapError("VALIDATION");
			const { getSkillById, publicSkillMcpGet } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			const skill = await getSkillById(id);
			if (!skill) return mapError("SKILL_MISSING");
			if (skill.status === "pending_review" || skill.status === "archived" || !skill.enabled) {
				if (skill.status === "pending_review") return mapError("SKILL_PENDING");
				if (!skill.enabled || skill.status === "disabled") return mapError("SKILL_DISABLED");
			}
			return {
				ok: true,
				data: publicSkillMcpGet(skill)
			};
		}
		case "skills.invoke": {
			if (!need(actor, "skills:execute")) return deny();
			const id = String(payload.id ?? payload.skillId ?? "");
			if (!id) return mapError("VALIDATION");
			const args = payload.args && typeof payload.args === "object" && !Array.isArray(payload.args) ? payload.args : payload.arguments && typeof payload.arguments === "object" ? payload.arguments : {};
			const { invokeSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			const result = await invokeSkillInternal({
				skillId: id,
				args,
				actorId: actor.keyId ?? actor.source
			});
			return {
				ok: true,
				data: {
					taskId: result.taskId,
					run: result.run,
					skill: {
						id: result.skill.id,
						slug: result.skill.slug,
						name: result.skill.name,
						version: result.skill.version
					}
				}
			};
		}
		case "skills.create": {
			if (!need(actor, "skills:manage")) return deny();
			const skillMd = String(payload.skillMd ?? payload.markdown ?? "");
			if (skillMd.length < 10) return mapError("VALIDATION");
			const { createSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			const { readPlaybookPolicies } = await import("./autonomy-policy.server-HcFlL3K7.mjs").then((n) => n.n);
			const policies = await readPlaybookPolicies();
			const provenance = payload.provenance === "human" ? "human" : "agent";
			return {
				ok: true,
				data: await createSkillInternal({
					skillMd,
					scripts: payload.scripts && typeof payload.scripts === "object" ? payload.scripts : void 0,
					provenance,
					createdBy: actor.label,
					autoPublish: provenance === "agent" ? policies.skillsAutoPublishAgent === true : true
				})
			};
		}
		case "skills.patch": {
			if (!need(actor, "skills:manage")) return deny();
			const id = String(payload.id ?? payload.skillId ?? "");
			if (!id) return mapError("VALIDATION");
			const { patchSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			return {
				ok: true,
				data: await patchSkillInternal({
					id,
					skillMd: typeof payload.skillMd === "string" ? payload.skillMd : void 0,
					enabled: typeof payload.enabled === "boolean" ? payload.enabled : void 0
				})
			};
		}
		case "skills.set_enabled": {
			if (!need(actor, "skills:manage")) return deny();
			const id = String(payload.id ?? payload.skillId ?? "");
			if (!id) return mapError("VALIDATION");
			const enabled = payload.enabled !== false;
			const { patchSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			return {
				ok: true,
				data: await patchSkillInternal({
					id,
					enabled
				})
			};
		}
		case "tasks.get": {
			if (!need(actor, "read")) return deny();
			const id = String(payload.id ?? payload.taskId ?? payload.jobId ?? "");
			if (!id) return mapError("VALIDATION");
			const { getSkillRun } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
			const run = await getSkillRun(id);
			if (run) return {
				ok: true,
				data: {
					kind: "skill",
					task: run
				}
			};
			const job = await readAgentJob(id);
			if (!job) return mapError("JOB_MISSING");
			return {
				ok: true,
				data: {
					kind: "job",
					task: job
				}
			};
		}
		case "list_addons": {
			if (!need(actor, "read")) return deny();
			const { buildAddonsSnapshot } = await import("./addons.server-DwUuR_Y2.mjs").then((n) => n.t).then((n) => n.t);
			const snap = await buildAddonsSnapshot();
			return {
				ok: true,
				data: {
					generation: snap.generation,
					addons: snap.items.map((row) => ({
						id: row.manifest.id,
						name: row.manifest.name,
						version: row.manifest.version,
						type: row.manifest.type,
						enabled: row.state.enabled,
						source: row.state.source,
						permissions: row.manifest.permissions,
						usedBy: row.manifest.usedBy,
						skills: row.manifest.skills
					}))
				}
			};
		}
		case "get_llm_providers": {
			if (!need(actor, "read")) return deny();
			const { buildLlmSnapshot } = await import("./llm-router.server-TNnMY3uU.mjs").then((n) => n.t);
			return {
				ok: true,
				data: await buildLlmSnapshot()
			};
		}
		case "linear.get_status": {
			if (!need(actor, "read") && !need(actor, "linear:read")) return deny();
			const { getLinearStatusForHermes, sweepLinearQueue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
			sweepLinearQueue(4).catch(() => 0);
			return {
				ok: true,
				data: await getLinearStatusForHermes()
			};
		}
		case "linear.create_issue": {
			if (!need(actor, "linear:write") && !need(actor, "write:social")) return deny();
			const title = String(payload.title ?? "").trim();
			if (title.length < 3) return mapError("VALIDATION");
			const { createLinearIssue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
			const { isLinearEntityType } = await import("./linear-CrgEmECq.mjs").then((n) => n.p).then((n) => n.p);
			const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? payload.linkTo : null;
			return {
				ok: true,
				data: await createLinearIssue({
					title,
					description: typeof payload.description === "string" ? payload.description : null,
					state: typeof payload.state === "string" ? payload.state : "backlog",
					labels: Array.isArray(payload.labels) ? payload.labels.map(String) : [],
					priority: typeof payload.priority === "number" ? payload.priority : 0,
					projectId: typeof payload.projectId === "string" ? payload.projectId : null,
					linkTo: linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id ? {
						type: linkRaw.type,
						id: String(linkRaw.id)
					} : null,
					actorId: actor.keyId ?? actor.source
				})
			};
		}
		case "linear.update_issue": {
			if (!need(actor, "linear:write") && !need(actor, "write:social")) return deny();
			const { updateLinearIssue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
			const { isLinearEntityType } = await import("./linear-CrgEmECq.mjs").then((n) => n.p).then((n) => n.p);
			const linkRaw = payload.linkTo && typeof payload.linkTo === "object" ? payload.linkTo : null;
			return {
				ok: true,
				data: await updateLinearIssue({
					issueId: typeof payload.issueId === "string" ? payload.issueId : typeof payload.id === "string" ? payload.id : void 0,
					state: typeof payload.state === "string" ? payload.state : null,
					labels: Array.isArray(payload.labels) ? payload.labels.map(String) : void 0,
					comment: typeof payload.comment === "string" ? payload.comment : null,
					linkTo: linkRaw && isLinearEntityType(linkRaw.type) && linkRaw.id ? {
						type: linkRaw.type,
						id: String(linkRaw.id)
					} : null,
					actorId: actor.keyId ?? actor.source
				})
			};
		}
		case "linear.find_issues": {
			if (!need(actor, "read") && !need(actor, "linear:read")) return deny();
			const term = String(payload.term ?? payload.text ?? payload.query ?? "").trim();
			const { findLinearIssues } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
			return {
				ok: true,
				data: { items: await findLinearIssues(term) }
			};
		}
		default: {
			if (action.startsWith("skill_manage.")) {
				if (!need(actor, "skills:manage")) return deny();
				const skills = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
				const { readPlaybookPolicies } = await import("./autonomy-policy.server-HcFlL3K7.mjs").then((n) => n.n);
				const policies = await readPlaybookPolicies();
				const id = String(payload.id ?? payload.skillId ?? "");
				try {
					if (action === "skill_manage.create") return {
						ok: true,
						data: await skills.skillManageCreate({
							payload,
							actor: actor.label,
							autoPublish: payload.provenance === "human" ? true : policies.skillsAutoPublishAgent === true
						})
					};
					if (action === "skill_manage.edit") {
						if (!id) return mapError("VALIDATION");
						const scripts = payload.scripts && typeof payload.scripts === "object" ? payload.scripts : void 0;
						return {
							ok: true,
							data: await skills.skillManageEdit({
								id,
								skillMd: typeof payload.skill_md === "string" ? payload.skill_md : typeof payload.skillMd === "string" ? payload.skillMd : void 0,
								scripts
							})
						};
					}
					if (action === "skill_manage.patch") {
						if (!id) return mapError("VALIDATION");
						return {
							ok: true,
							data: await skills.skillManagePatch({
								id,
								path: typeof payload.path === "string" ? payload.path : void 0,
								find: String(payload.find ?? ""),
								replace: String(payload.replace ?? "")
							})
						};
					}
					if (action === "skill_manage.write_file") {
						if (!id) return mapError("VALIDATION");
						return {
							ok: true,
							data: await skills.skillManageWriteFile({
								id,
								path: String(payload.path ?? ""),
								content: String(payload.content ?? "")
							})
						};
					}
					if (action === "skill_manage.set_enabled") {
						if (!id) return mapError("VALIDATION");
						return {
							ok: true,
							data: await skills.patchSkillInternal({
								id,
								enabled: payload.enabled !== false
							})
						};
					}
					if (action === "skill_manage.set_provenance_review") {
						if (!id) return mapError("VALIDATION");
						const decision = payload.decision === "reject" ? "reject" : "approve";
						return {
							ok: true,
							data: await skills.skillManageSetProvenanceReview({
								id,
								decision
							})
						};
					}
					if (action === "skill_manage.list_versions") {
						if (!id) return mapError("VALIDATION");
						return {
							ok: true,
							data: { versions: await skills.listSkillVersions(id) }
						};
					}
					if (action === "skill_manage.rollback") {
						if (!id) return mapError("VALIDATION");
						return {
							ok: true,
							data: await skills.rollbackSkill({
								id,
								version: String(payload.version ?? ""),
								actor: actor.label
							})
						};
					}
				} catch (error) {
					return mapError(error instanceof Error ? error.message : "SKILL_FAILED");
				}
				return {
					ok: false,
					status: 404,
					code: "UNKNOWN_ACTION",
					message: "Unknown action."
				};
			}
			if (action.startsWith("vision.") || action.startsWith("computer.") || action.startsWith("browser.") || action.startsWith("clipping.")) {
				const writeSocial = action.startsWith("computer.") || action.startsWith("browser.") || action === "clipping.distribute_social" || action === "clipping.observe_desktop";
				const writeProgress = action === "clipping.set_stage" || action === "clipping.mark_published";
				const ai = action.startsWith("vision.") || action === "clipping.generate_ideas" || action === "clipping.generate_titles" || action === "clipping.generate_thumbnail";
				if (writeSocial && !need(actor, "write:social")) return deny();
				if (writeProgress && !need(actor, "write:progress")) return deny();
				if (ai && !need(actor, "actions:ai") && !need(actor, "read")) return deny();
				if (action === "clipping.run_skill" && !need(actor, "skills:execute")) return deny();
				if (action === "clipping.propose_skill" && !need(actor, "skills:execute")) return deny();
				if (action === "clipping.research_channel" && !need(actor, "read")) return deny();
				if (!writeSocial && !writeProgress && !ai && action !== "clipping.run_skill" && action !== "clipping.propose_skill" && action !== "clipping.research_channel") {
					if (!need(actor, "read")) return deny();
				}
				try {
					const { executeAgentTool } = await import("./agent-tools.server-C9PIcUix.mjs");
					return {
						ok: true,
						data: (await executeAgentTool({
							name: action,
							payload,
							actorId: actor.keyId ?? actor.source
						})).data
					};
				} catch (error) {
					return mapError(error instanceof Error ? error.message : "TOOL_FAILED");
				}
			}
			if (action.startsWith("library.")) {
				const write = action === "library.ingest_url" || action === "library.ingest_stream_clip" || action === "library.ingest_thumbnail" || action === "library.queue_render" || action === "library.attach_to_social_job";
				if (write && !need(actor, "write:social")) return deny();
				if (!write && !need(actor, "read")) return deny();
				const { handleLibraryAction } = await import("./library-tools.server--PSoEAfd.mjs");
				const data = await handleLibraryAction(action, payload, `agent:${actor.keyId ?? actor.source}`);
				if (data === void 0) return {
					ok: false,
					status: 404,
					code: "UNKNOWN_ACTION",
					message: "Unknown action."
				};
				return {
					ok: true,
					data
				};
			}
			if (!action.startsWith("social.")) return {
				ok: false,
				status: 404,
				code: "UNKNOWN_ACTION",
				message: "Unknown action."
			};
			const write = action !== "social.get_machine_status" && action !== "social.get_desktop_preview" && action !== "social.list_open_windows" && action !== "social.list_platforms" && action !== "social.get_publisher_status" && action !== "social.get_platform_status" && action !== "social.list_uploadable_assets" && action !== "social.resolve_asset" && action !== "social.get_upload_job" && action !== "social.list_upload_jobs" && action !== "social.list_posts" && action !== "social.get_post" && action !== "social.plan_distribution" && action !== "social.get_cost_guard";
			if (write && !need(actor, "write:social")) return deny();
			if (!write && !need(actor, "read")) return deny();
			const { handleSocialAction } = await import("./social-ops.server-B3WyGuEW.mjs");
			const data = await handleSocialAction(action, payload, `agent:${actor.keyId ?? actor.source}`);
			if (data === void 0) return {
				ok: false,
				status: 404,
				code: "UNKNOWN_ACTION",
				message: "Unknown action."
			};
			return {
				ok: true,
				data
			};
		}
	}
}
var TOOL_INPUTS = {
	list_clients: {
		type: "object",
		properties: {
			search: { type: "string" },
			status: {
				type: "string",
				enum: ["ACTIVE", "CHURNED"]
			}
		}
	},
	get_client: {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	create_client: {
		type: "object",
		required: ["name"],
		properties: {
			name: { type: "string" },
			channelUrl: { type: "string" },
			planType: { type: "string" },
			notes: { type: "string" }
		}
	},
	update_client: {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			notes: { type: "string" },
			status: {
				type: "string",
				enum: ["ACTIVE", "CHURNED"]
			}
		}
	},
	list_payments: {
		type: "object",
		properties: { clientId: { type: "string" } }
	},
	mark_payment_paid: {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	get_client_progress: {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	set_client_stage: {
		type: "object",
		required: ["clientId", "stage"],
		properties: {
			clientId: { type: "string" },
			stage: { type: "string" },
			notes: { type: "string" }
		}
	},
	list_leads: {
		type: "object",
		properties: {}
	},
	create_lead: {
		type: "object",
		required: ["name"],
		properties: {
			name: { type: "string" },
			status: { type: "string" },
			upfrontCash: { type: "number" },
			monthlyRecurring: { type: "number" }
		}
	},
	update_lead_status: {
		type: "object",
		required: ["id", "status"],
		properties: {
			id: { type: "string" },
			status: { type: "string" }
		}
	},
	pull_client_analytics: {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	get_analytics_snapshot: {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	get_dashboard_snapshot: {
		type: "object",
		properties: {}
	},
	list_at_risk_clients: {
		type: "object",
		properties: {}
	},
	regenerate_suggested_titles: {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	regenerate_suggested_ideas: {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	get_integration_status: {
		type: "object",
		properties: {}
	},
	get_connect_status: {
		type: "object",
		properties: {}
	},
	get_playbook_package: {
		type: "object",
		properties: { origin: { type: "string" } }
	},
	"social.get_machine_status": {
		type: "object",
		properties: {}
	},
	"social.start_machine": {
		type: "object",
		properties: { waitUntilReady: { type: "boolean" } }
	},
	"social.stop_machine": {
		type: "object",
		properties: {}
	},
	"social.set_auto_stop": {
		type: "object",
		required: ["minutes"],
		properties: { minutes: { type: "number" } }
	},
	"social.ensure_computer_use": {
		type: "object",
		properties: {}
	},
	"social.get_desktop_preview": {
		type: "object",
		properties: {}
	},
	"social.take_screenshot": {
		type: "object",
		properties: {}
	},
	"social.list_open_windows": {
		type: "object",
		properties: {}
	},
	"social.list_platforms": {
		type: "object",
		properties: {}
	},
	"social.get_publisher_status": {
		type: "object",
		properties: {}
	},
	"social.get_platform_status": {
		type: "object",
		required: ["platform"],
		properties: { platform: {
			type: "string",
			enum: [
				"instagram",
				"x",
				"tiktok",
				"youtube"
			]
		} }
	},
	"social.mark_platform_session": {
		type: "object",
		required: ["platform", "state"],
		properties: {
			platform: {
				type: "string",
				enum: [
					"instagram",
					"x",
					"tiktok",
					"youtube"
				]
			},
			state: {
				type: "string",
				enum: [
					"logged_in",
					"needs_login",
					"not_logged_in",
					"unknown"
				]
			}
		}
	},
	"social.open_platform": {
		type: "object",
		required: ["platform"],
		properties: { platform: {
			type: "string",
			enum: [
				"instagram",
				"x",
				"tiktok",
				"youtube"
			]
		} }
	},
	"social.check_session_health": {
		type: "object",
		properties: { platform: {
			type: "string",
			enum: [
				"instagram",
				"x",
				"tiktok",
				"youtube"
			]
		} }
	},
	"social.list_uploadable_assets": {
		type: "object",
		properties: { clientId: { type: "string" } }
	},
	"social.resolve_asset": {
		type: "object",
		required: ["clientId", "assetId"],
		properties: {
			clientId: { type: "string" },
			assetId: { type: "string" }
		}
	},
	"social.create_upload_job": {
		type: "object",
		required: ["clientId", "platforms"],
		properties: {
			clientId: { type: "string" },
			assetId: { type: "string" },
			mediaAssetId: { type: "string" },
			platforms: {
				type: "array",
				items: { type: "string" }
			},
			caption: { type: "string" },
			mode: {
				type: "string",
				enum: ["draft", "publish"]
			},
			preferredRail: {
				type: "string",
				enum: [
					"AUTO",
					"API",
					"BROWSER"
				]
			},
			fallbackToBrowser: { type: "boolean" },
			idempotencyKey: { type: "string" },
			title: {
				type: "string",
				description: "YouTube title (also used as caption first line)"
			},
			description: { type: "string" },
			tags: {
				type: "array",
				items: { type: "string" }
			},
			privacyStatus: {
				type: "string",
				enum: [
					"private",
					"unlisted",
					"public"
				]
			},
			markShorts: { type: "boolean" },
			ytTitle: { type: "string" },
			ytDescription: { type: "string" },
			ytTags: {
				type: "array",
				items: { type: "string" }
			},
			ytPrivacy: {
				type: "string",
				enum: [
					"private",
					"unlisted",
					"public"
				]
			},
			ytMarkShorts: { type: "boolean" }
		}
	},
	"social.get_upload_job": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"social.list_upload_jobs": {
		type: "object",
		properties: {
			clientId: { type: "string" },
			platform: { type: "string" },
			status: { type: "string" },
			since: { type: "string" }
		}
	},
	"social.retry_upload_job": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"social.cancel_upload_job": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"social.list_posts": {
		type: "object",
		properties: {
			clientId: { type: "string" },
			platform: { type: "string" },
			status: { type: "string" }
		}
	},
	"social.get_post": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"social.plan_distribution": {
		type: "object",
		required: ["clientId"],
		properties: {
			clientId: { type: "string" },
			assetId: { type: "string" }
		}
	},
	"social.bulk_create_upload_jobs": {
		type: "object",
		required: ["jobs"],
		properties: { jobs: {
			type: "array",
			items: { type: "object" }
		} }
	},
	"social.get_cost_guard": {
		type: "object",
		properties: {}
	},
	"social.force_stop_if_running": {
		type: "object",
		properties: {}
	},
	"approvals.list_pending": {
		type: "object",
		properties: {}
	},
	"approvals.decide": {
		type: "object",
		required: ["id", "decision"],
		properties: {
			id: { type: "string" },
			decision: {
				type: "string",
				enum: [
					"APPROVED",
					"REJECTED",
					"CANCELED"
				]
			},
			note: { type: "string" }
		}
	},
	"analytics.refresh_post_performance": {
		type: "object",
		properties: {
			socialPostId: { type: "string" },
			sweep: { type: "boolean" }
		}
	},
	"analytics.list_winners": {
		type: "object",
		properties: {
			clientId: { type: "string" },
			platform: {
				type: "string",
				enum: [
					"X",
					"TIKTOK",
					"INSTAGRAM",
					"YOUTUBE",
					"OTHER"
				]
			}
		}
	},
	"knowledge.list_proposals": {
		type: "object",
		properties: {
			status: {
				type: "string",
				enum: [
					"PENDING_REVIEW",
					"APPROVED",
					"REJECTED",
					"MERGED"
				]
			},
			clientId: { type: "string" }
		}
	},
	"knowledge.decide_proposal": {
		type: "object",
		required: ["id", "decision"],
		properties: {
			id: { type: "string" },
			decision: {
				type: "string",
				enum: ["APPROVED", "REJECTED"]
			},
			note: { type: "string" }
		}
	},
	"linear.get_status": {
		type: "object",
		properties: {}
	},
	"linear.create_issue": {
		type: "object",
		required: ["title"],
		properties: {
			title: { type: "string" },
			description: { type: "string" },
			state: {
				type: "string",
				enum: [
					"backlog",
					"ready",
					"inProgress",
					"inReview",
					"done"
				]
			},
			labels: {
				type: "array",
				items: { type: "string" }
			},
			priority: { type: "number" },
			projectId: { type: "string" },
			linkTo: {
				type: "object",
				properties: {
					type: {
						type: "string",
						enum: [
							"AgentRun",
							"RenderJob",
							"SocialUploadJob",
							"KnowledgeProposal",
							"ApprovalRequest",
							"Milestone"
						]
					},
					id: { type: "string" }
				}
			}
		}
	},
	"linear.update_issue": {
		type: "object",
		properties: {
			issueId: { type: "string" },
			state: { type: "string" },
			labels: {
				type: "array",
				items: { type: "string" }
			},
			comment: { type: "string" },
			linkTo: {
				type: "object",
				properties: {
					type: { type: "string" },
					id: { type: "string" }
				}
			}
		}
	},
	"linear.find_issues": {
		type: "object",
		properties: {
			term: { type: "string" },
			text: { type: "string" }
		}
	},
	"skills.list": {
		type: "object",
		properties: {}
	},
	"skills.get": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"skills.invoke": {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			args: { type: "object" }
		}
	},
	"skills.create": {
		type: "object",
		required: ["skillMd"],
		properties: {
			skillMd: { type: "string" },
			scripts: { type: "object" },
			provenance: {
				type: "string",
				enum: ["human", "agent"]
			}
		}
	},
	"skills.patch": {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			skillMd: { type: "string" },
			enabled: { type: "boolean" }
		}
	},
	"skills.set_enabled": {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			enabled: { type: "boolean" }
		}
	},
	"skill_manage.create": {
		type: "object",
		properties: {
			name: { type: "string" },
			description: { type: "string" },
			skill_md: { type: "string" },
			scripts: {
				type: "array",
				items: { type: "object" }
			},
			tags: {
				type: "array",
				items: { type: "string" }
			},
			provenance: { type: "string" }
		}
	},
	"skill_manage.edit": {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			skill_md: { type: "string" },
			scripts: { type: "object" }
		}
	},
	"skill_manage.patch": {
		type: "object",
		required: ["id", "find"],
		properties: {
			id: { type: "string" },
			path: { type: "string" },
			find: { type: "string" },
			replace: { type: "string" }
		}
	},
	"skill_manage.write_file": {
		type: "object",
		required: [
			"id",
			"path",
			"content"
		],
		properties: {
			id: { type: "string" },
			path: { type: "string" },
			content: { type: "string" }
		}
	},
	"skill_manage.set_enabled": {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" },
			enabled: { type: "boolean" }
		}
	},
	"skill_manage.set_provenance_review": {
		type: "object",
		required: ["id", "decision"],
		properties: {
			id: { type: "string" },
			decision: {
				type: "string",
				enum: ["approve", "reject"]
			}
		}
	},
	"skill_manage.list_versions": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"skill_manage.rollback": {
		type: "object",
		required: ["id", "version"],
		properties: {
			id: { type: "string" },
			version: { type: "string" }
		}
	},
	"vision.analyze": {
		type: "object",
		properties: {
			imageUrl: { type: "string" },
			prompt: { type: "string" }
		}
	},
	"vision.compare": {
		type: "object",
		properties: {
			beforeUrl: { type: "string" },
			afterUrl: { type: "string" },
			prompt: { type: "string" }
		}
	},
	"computer.start": {
		type: "object",
		properties: {}
	},
	"computer.stop": {
		type: "object",
		properties: {}
	},
	"computer.screenshot": {
		type: "object",
		properties: {}
	},
	"computer.mouse_click": {
		type: "object",
		required: ["x", "y"],
		properties: {
			x: { type: "number" },
			y: { type: "number" },
			button: { type: "string" }
		}
	},
	"computer.mouse_move": {
		type: "object",
		required: ["x", "y"],
		properties: {
			x: { type: "number" },
			y: { type: "number" }
		}
	},
	"computer.mouse_drag": {
		type: "object",
		properties: {
			from: { type: "object" },
			to: { type: "object" }
		}
	},
	"computer.mouse_scroll": {
		type: "object",
		properties: {
			x: { type: "number" },
			y: { type: "number" },
			dy: { type: "number" }
		}
	},
	"computer.keyboard_type": {
		type: "object",
		required: ["text"],
		properties: { text: { type: "string" } }
	},
	"computer.keyboard_key": {
		type: "object",
		properties: {
			key: { type: "string" },
			keys: { type: "array" }
		}
	},
	"computer.accessibility_find": {
		type: "object",
		properties: {
			role: { type: "string" },
			name: { type: "string" }
		}
	},
	"computer.list_windows": {
		type: "object",
		properties: {}
	},
	"browser.open_url": {
		type: "object",
		required: ["url"],
		properties: { url: { type: "string" } }
	},
	"browser.wait_for_text": {
		type: "object",
		required: ["text"],
		properties: {
			text: { type: "string" },
			timeoutMs: { type: "number" }
		}
	},
	"browser.upload_file": {
		type: "object",
		properties: {
			platform: { type: "string" },
			mediaUrl: { type: "string" },
			caption: { type: "string" }
		}
	},
	"browser.get_page_summary": {
		type: "object",
		properties: {}
	},
	"browser.open_instagram_upload": {
		type: "object",
		properties: {}
	},
	"browser.open_x_compose": {
		type: "object",
		properties: {}
	},
	"browser.open_tiktok_upload": {
		type: "object",
		properties: {}
	},
	"clipping.research_channel": {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	"clipping.generate_ideas": {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	"clipping.generate_titles": {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	"clipping.generate_thumbnail": {
		type: "object",
		required: ["clientId"],
		properties: {
			clientId: { type: "string" },
			prompt: { type: "string" }
		}
	},
	"clipping.set_stage": {
		type: "object",
		required: ["clientId", "stage"],
		properties: {
			clientId: { type: "string" },
			stage: { type: "string" },
			notes: { type: "string" }
		}
	},
	"clipping.mark_published": {
		type: "object",
		required: ["clientId"],
		properties: {
			clientId: { type: "string" },
			notes: { type: "string" }
		}
	},
	"clipping.distribute_social": {
		type: "object",
		required: ["clientId"],
		properties: {
			clientId: { type: "string" },
			platforms: {
				type: "array",
				items: { type: "string" }
			},
			caption: { type: "string" },
			mediaAssetId: { type: "string" }
		}
	},
	"library.search_assets": {
		type: "object",
		properties: {
			clientId: { type: "string" },
			kind: { type: "string" },
			source: { type: "string" },
			status: { type: "string" },
			search: { type: "string" },
			tag: { type: "string" }
		}
	},
	"library.get_asset": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	"library.ingest_url": {
		type: "object",
		required: ["url"],
		properties: {
			url: { type: "string" },
			clientId: { type: "string" },
			title: { type: "string" }
		}
	},
	"library.ingest_stream_clip": {
		type: "object",
		required: ["clipId"],
		properties: { clipId: { type: "string" } }
	},
	"library.ingest_thumbnail": {
		type: "object",
		required: ["messageId"],
		properties: { messageId: { type: "string" } }
	},
	"library.queue_render": {
		type: "object",
		required: ["assetId"],
		properties: {
			assetId: { type: "string" },
			preset: {
				type: "string",
				enum: [
					"REELS_9x16",
					"SQUARE_1x1",
					"LANDSCAPE_16x9",
					"CUSTOM"
				]
			},
			burnInCaptions: { type: "boolean" },
			captionTrackId: { type: "string" }
		}
	},
	"library.list_renders": {
		type: "object",
		properties: { assetId: { type: "string" } }
	},
	"library.attach_to_social_job": {
		type: "object",
		required: ["clientId", "mediaAssetId"],
		properties: {
			clientId: { type: "string" },
			mediaAssetId: { type: "string" },
			platforms: {
				type: "array",
				items: { type: "string" }
			},
			caption: { type: "string" },
			mode: {
				type: "string",
				enum: ["draft", "publish"]
			}
		}
	},
	"library.get_pipeline_status": {
		type: "object",
		properties: {}
	},
	"clipping.run_skill": {
		type: "object",
		required: ["skillId"],
		properties: {
			skillId: { type: "string" },
			arguments: { type: "object" }
		}
	},
	"clipping.observe_desktop": {
		type: "object",
		properties: {}
	},
	"clipping.get_progress": {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	"clipping.guarantee_check": {
		type: "object",
		required: ["clientId"],
		properties: { clientId: { type: "string" } }
	},
	"clipping.propose_skill": {
		type: "object",
		properties: { agentRunId: { type: "string" } }
	},
	"tasks.get": {
		type: "object",
		required: ["id"],
		properties: { id: { type: "string" } }
	},
	list_addons: {
		type: "object",
		properties: {}
	},
	get_llm_providers: {
		type: "object",
		properties: {}
	}
};
function rpcResult(id, result) {
	return {
		jsonrpc: "2.0",
		id: id ?? null,
		result
	};
}
function rpcError(id, code, message) {
	return {
		jsonrpc: "2.0",
		id: id ?? null,
		error: {
			code,
			message
		}
	};
}
async function handleMcpRpc(body, actor, requestId) {
	const method = body.method ?? "";
	const id = body.id;
	const params = body.params ?? {};
	if (method === "initialize") return rpcResult(id, {
		protocolVersion: "2025-03-26",
		capabilities: {
			tools: { listChanged: true },
			resources: { listChanged: true },
			skills: { listChanged: true },
			tasks: {}
		},
		serverInfo: {
			name: "clippy-os",
			version: "1.0.0"
		},
		instructions: "ClippyOS MCP. Hermes is the client. Use skills/list, skills/get, skills/invoke, skill_manage.* (if scoped), vision.*, computer.*, browser.*, clipping.*, and tasks/get. Python skills run in an isolated Daytona sandbox (never the Social Machine). The Social Machine is a Windows VM — Hibernate pauses a hot snapshot. Never request integration secrets or Super Admin credentials. Never auto-start the Social Machine on login."
	});
	if (method === "notifications/initialized" || method === "initialized") return rpcResult(id, {});
	if (method === "ping") return rpcResult(id, {});
	if (method === "tools/list") return rpcResult(id, await listVisibleTools());
	if (method === "skills/list") {
		const result = await runAutonomyAction({
			actor,
			action: "skills.list",
			payload: params,
			requestId
		});
		if (!result.ok) return rpcError(id, -32e3, result.message);
		return rpcResult(id, result.data);
	}
	if (method === "skills/get") {
		const result = await runAutonomyAction({
			actor,
			action: "skills.get",
			payload: { id: params.id ?? params.skillId },
			requestId
		});
		if (!result.ok) return rpcError(id, -32e3, result.message);
		return rpcResult(id, result.data);
	}
	if (method === "skills/invoke") {
		const result = await runAutonomyAction({
			actor,
			action: "skills.invoke",
			payload: {
				id: params.id ?? params.skillId,
				args: params.arguments ?? params.args
			},
			requestId,
			playbookId: typeof params.playbook === "string" ? params.playbook : null,
			runId: typeof params.runId === "string" ? params.runId : null
		});
		if (!result.ok) return rpcError(id, -32e3, result.message);
		return rpcResult(id, result.data);
	}
	if (method === "tasks/get") {
		const result = await runAutonomyAction({
			actor,
			action: "tasks.get",
			payload: { id: params.id ?? params.taskId },
			requestId
		});
		if (!result.ok) return rpcError(id, -32e3, result.message);
		return rpcResult(id, result.data);
	}
	if (method === "resources/list") return rpcResult(id, { resources: MCP_RESOURCES.map((row) => ({
		uri: row.uri,
		name: row.name,
		description: row.description,
		mimeType: "application/json"
	})) });
	if (method === "resources/read") {
		const uri = String(params.uri ?? "");
		if (uri === "agency://playbooks") {
			const result = await runAutonomyAction({
				actor,
				action: "get_playbook_catalog",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "application/json",
				text: JSON.stringify(result.data)
			}] });
		}
		if (uri === "agency://automation/connect") {
			const result = await runAutonomyAction({
				actor,
				action: "get_connect_status",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "application/json",
				text: JSON.stringify(result.data)
			}] });
		}
		if (uri === "agency://automation/playbook-package") {
			const result = await runAutonomyAction({
				actor,
				action: "get_playbook_package",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "text/markdown",
				text: JSON.stringify(result.data)
			}] });
		}
		if (uri === "agency://addons") {
			const result = await runAutonomyAction({
				actor,
				action: "list_addons",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "application/json",
				text: JSON.stringify(result.data)
			}] });
		}
		if (uri === "agency://skills") {
			const result = await runAutonomyAction({
				actor,
				action: "skills.list",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "application/json",
				text: JSON.stringify(result.data)
			}] });
		}
		if (uri === "agency://llm/providers" || uri === "agency://llm/models") {
			const result = await runAutonomyAction({
				actor,
				action: "get_llm_providers",
				payload: {},
				requestId
			});
			if (!result.ok) return rpcError(id, -32e3, result.message);
			return rpcResult(id, { contents: [{
				uri,
				mimeType: "application/json",
				text: JSON.stringify(result.data)
			}] });
		}
		const mapped = mapResource(uri);
		if (!mapped) return rpcError(id, -32002, "Unknown resource.");
		const result = await runAutonomyAction({
			actor,
			action: mapped.action,
			payload: mapped.payload,
			requestId
		});
		if (!result.ok) return rpcError(id, -32e3, result.message);
		return rpcResult(id, { contents: [{
			uri,
			mimeType: "application/json",
			text: JSON.stringify(result.data)
		}] });
	}
	if (method === "tools/call") {
		const rawName = String(params.name ?? "");
		const rawArgs = params.arguments && typeof params.arguments === "object" ? params.arguments : {};
		let name = rawName;
		let args = rawArgs;
		if (rawName.startsWith("skill.")) {
			name = "skills.invoke";
			args = {
				id: rawName.slice(6),
				args: rawArgs
			};
		}
		const meta = params._meta && typeof params._meta === "object" ? params._meta : {};
		const result = await runAutonomyAction({
			actor,
			action: name,
			payload: args,
			requestId,
			playbookId: typeof meta.playbook === "string" ? meta.playbook : typeof args.playbook === "string" ? args.playbook : null,
			runId: typeof meta.runId === "string" ? meta.runId : typeof args.runId === "string" ? args.runId : null
		});
		if (!result.ok) return rpcResult(id, {
			isError: true,
			content: [{
				type: "text",
				text: result.message
			}]
		});
		return rpcResult(id, { content: [{
			type: "text",
			text: JSON.stringify(result.data)
		}] });
	}
	return rpcError(id, -32601, "Method not found.");
}
function mapResource(uri) {
	if (uri === "agency://dashboard") return {
		action: "get_dashboard_snapshot",
		payload: {}
	};
	if (uri === "agency://pipeline") return {
		action: "get_dashboard_snapshot",
		payload: {}
	};
	if (uri === "agency://social/machine") return {
		action: "social.get_machine_status",
		payload: {}
	};
	if (uri === "agency://social/platforms") return {
		action: "social.list_platforms",
		payload: {}
	};
	if (uri === "agency://social/publishers") return {
		action: "social.get_publisher_status",
		payload: {}
	};
	if (uri === "agency://social/posts") return {
		action: "social.list_posts",
		payload: {}
	};
	const job = uri.match(/^agency:\/\/social\/jobs\/(.+)$/);
	if (job) return {
		action: "social.get_upload_job",
		payload: { id: job[1] }
	};
	const client = uri.match(/^agency:\/\/clients\/(.+)$/);
	if (client) return {
		action: "get_client",
		payload: { id: client[1] }
	};
	const skill = uri.match(/^agency:\/\/skills\/(.+)$/);
	if (skill) return {
		action: "skills.get",
		payload: { id: skill[1] }
	};
	if (uri === "agency://library/assets") return {
		action: "library.search_assets",
		payload: {}
	};
	if (uri === "agency://analytics/performance") return {
		action: "analytics.list_winners",
		payload: {}
	};
	if (uri === "agency://knowledge/proposals") return {
		action: "knowledge.list_proposals",
		payload: {}
	};
	if (uri === "agency://linear/status") return {
		action: "linear.get_status",
		payload: {}
	};
	return null;
}
async function listVisibleTools() {
	const { enabledAddonIds, readToolsGeneration } = await import("./addons.server-DwUuR_Y2.mjs").then((n) => n.t).then((n) => n.t);
	const [enabled, generation] = await Promise.all([enabledAddonIds(), readToolsGeneration()]);
	const staticTools = MCP_TOOLS.filter((tool) => {
		const addon = addonIdForTool(tool.name);
		return !addon || enabled.has(addon);
	}).map((tool) => ({
		name: tool.name,
		description: tool.description,
		inputSchema: TOOL_INPUTS[tool.name] ?? {
			type: "object",
			properties: {}
		}
	}));
	let skillTools = [];
	if (enabled.has("agency.skills-runtime")) {
		const { listPublicSkills } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
		skillTools = (await listPublicSkills()).map((skill) => ({
			name: `skill.${skill.slug}`,
			description: skill.description,
			inputSchema: skill.inputsSchema && typeof skill.inputsSchema === "object" && !Array.isArray(skill.inputsSchema) ? skill.inputsSchema : {
				type: "object",
				properties: {}
			}
		}));
	}
	return {
		tools: [...staticTools, ...skillTools],
		_meta: {
			toolsGeneration: generation,
			listChanged: true
		}
	};
}
function json$7(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
function sseWrap(payload) {
	const data = JSON.stringify(payload);
	return new Response(`event: message\ndata: ${data}\n\n`, {
		status: 200,
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
async function handle$1(request) {
	const rid = request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
	if (request.method === "GET") return json$7(200, {
		name: "clippy-admin",
		transport: "streamable-http",
		protocol: "2025-03-26",
		capabilities: {
			tools: { listChanged: true },
			resources: { listChanged: true },
			skills: { listChanged: true },
			tasks: {}
		}
	});
	let actor;
	try {
		actor = await authenticateMcpToken(request.headers.get("authorization"));
	} catch (error) {
		const code = error instanceof Error ? error.message : "UNAUTHORIZED";
		if (code === "RATE_LIMITED") return json$7(429, { error: {
			code,
			message: "Too many requests."
		} });
		writeAuditLog({
			requestId: rid,
			actor: {
				source: "mcp",
				keyId: null,
				label: "unknown"
			},
			action: "auth",
			result: "denied",
			errorCode: "UNAUTHORIZED"
		});
		return json$7(401, { error: {
			code: "UNAUTHORIZED",
			message: "Invalid MCP token."
		} });
	}
	let body;
	try {
		body = await request.json();
	} catch {
		return json$7(400, {
			jsonrpc: "2.0",
			error: {
				code: -32700,
				message: "Parse error"
			},
			id: null
		});
	}
	const result = await handleMcpRpc(body, actor, rid);
	if ((request.headers.get("accept") ?? "").includes("text/event-stream")) return sseWrap(result);
	return json$7(200, result);
}
var Route$20 = createFileRoute("/api/mcp")({ server: { handlers: {
	GET: ({ request }) => handle$1(request),
	POST: ({ request }) => handle$1(request)
} } });
var $$splitComponentImporter$8 = () => import("./portal.index-Ca8idVLW.mjs");
var Route$19 = createFileRoute("/portal/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./activity-48Uw8JtZ.mjs");
var Route$18 = createFileRoute("/portal/activity")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./approvals-CB52l9zL.mjs");
var Route$17 = createFileRoute("/portal/approvals")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./assets-I9R0RqFE.mjs");
var Route$16 = createFileRoute("/portal/assets")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./help-CK2LzXKD.mjs");
var Route$15 = createFileRoute("/portal/help")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./home-klJ_jASj.mjs");
var Route$14 = createFileRoute("/portal/home")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./login-Bpvsq0HE.mjs");
var Route$13 = createFileRoute("/portal/login")({
	validateSearch: (search) => ({ invite: typeof search.invite === "string" ? search.invite : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./clients.index-oXk2o5B_.mjs");
var Route$12 = createFileRoute("/_app/clients/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./clients._clientId-BAhHzis5.mjs");
var Route$11 = createFileRoute("/_app/clients/$clientId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$10 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
function json$6(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
function authorized(request) {
	if (request.headers.get("x-vercel-cron") === "1") return true;
	const secret = process.env.CRON_SECRET?.trim();
	if (!secret) return false;
	return (request.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}
var Route$9 = createFileRoute("/api/cron/ops")({ server: { handlers: { GET: async ({ request }) => {
	if (!authorized(request)) return json$6(401, { error: {
		code: "UNAUTHORIZED",
		message: "Cron auth failed."
	} });
	let linearSwept = 0;
	try {
		const { sweepLinearQueue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
		linearSwept = await sweepLinearQueue(8);
	} catch {
		linearSwept = 0;
	}
	let machineState = "unknown";
	try {
		const { getSocialMachineStatus } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
		machineState = (await getSocialMachineStatus()).state;
	} catch {
		machineState = "unknown";
	}
	return json$6(200, {
		ok: true,
		linearSwept,
		machineState,
		startedMachine: false,
		note: "Cron never starts the Social Machine. Idle pause is owned by Daytona. Hibernate is pause, not destroy."
	});
} } } });
var Route$8 = createFileRoute("/api/library/file")({ server: { handlers: { GET: async ({ request }) => {
	const token = new URL(request.url).searchParams.get("t")?.trim() || "";
	if (!token) return new Response("Missing token", { status: 400 });
	const verified = await verifyLibraryToken(token);
	if (!verified) return new Response("Expired or invalid", { status: 403 });
	const version = await getVersionRow(verified.versionId);
	if (!version) return new Response("Not found", { status: 404 });
	let bytes;
	try {
		bytes = await readLibraryBytes(version.storageKey);
	} catch {
		return new Response("Not found", { status: 404 });
	}
	const mime = version.mimeType || "application/octet-stream";
	return new Response(new Uint8Array(bytes), {
		status: 200,
		headers: {
			"content-type": mime,
			"cache-control": "private, max-age=60",
			"content-disposition": "inline"
		}
	});
} } } });
function json$5(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
var Route$7 = createFileRoute("/api/library/upload")({ server: { handlers: { POST: async ({ request }) => {
	const header = request.headers.get("authorization");
	const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : void 0;
	const user = await getSessionUser(bearer);
	if (!user) return json$5(401, { error: "Unauthorized" });
	let form;
	try {
		form = await request.formData();
	} catch {
		return json$5(400, { error: "VALIDATION" });
	}
	const file = form.get("file");
	if (!(file instanceof File)) return json$5(400, { error: "VALIDATION" });
	const settings = await readMediaSettings();
	if (file.size > settings.maxUploadMb * 1024 * 1024) return json$5(400, { error: "MEDIA_TOO_LARGE" });
	const bytes = Buffer.from(await file.arrayBuffer());
	const clientRaw = form.get("clientId");
	const clientId = typeof clientRaw === "string" && clientRaw.trim() ? clientRaw.trim() : null;
	const titleRaw = form.get("title");
	const title = typeof titleRaw === "string" ? titleRaw : file.name;
	try {
		const result = await ingestBytes({
			actorId: user.id,
			clientId,
			title: title || file.name || "Upload",
			filename: file.name,
			mimeHint: file.type,
			bytes,
			source: "UPLOAD"
		});
		return json$5(200, {
			asset: {
				id: result.asset.id,
				title: result.asset.title,
				status: result.asset.status,
				kind: result.asset.kind,
				previewUrl: result.asset.previewUrl
			},
			duplicate: result.duplicate
		});
	} catch (error) {
		return json$5(400, { error: error instanceof Error ? error.message : "DATA_UNAVAILABLE" });
	}
} } } });
function html$1(ok, message) {
	const payload = JSON.stringify({
		source: "clippy-linear-oauth",
		ok,
		provider: "linear",
		error: ok ? null : message
	});
	const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${ok ? "Connected" : "Couldn’t connect"}</title>
  </head>
  <body style="font-family:system-ui;background:#05070d;color:#f5f7fb;padding:2rem">
    <p>${ok ? "Linear connected. You can close this window." : message}</p>
    <script>
      (function () {
        var payload = ${payload};
        try {
          if (window.opener) window.opener.postMessage(payload, window.location.origin);
        } catch (e) {}
        window.close();
      })();
    <\/script>
  </body>
</html>`;
	return new Response(body, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
var Route$6 = createFileRoute("/api/oauth/linear")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const error = url.searchParams.get("error");
	const code = url.searchParams.get("code")?.trim() || "";
	const state = url.searchParams.get("state")?.trim() || "";
	if (error) return html$1(false, "Linear denied the connection.");
	if (!code || !state) return html$1(false, "Missing OAuth code. Start Connect from Settings.");
	try {
		await completeLinearOAuth({
			code,
			state
		});
		return html$1(true, "Connected");
	} catch {
		return html$1(false, "Couldn’t finish Linear connect. Try again from Settings.");
	}
} } } });
function html(ok, provider, message) {
	const payload = JSON.stringify({
		source: "clippy-social-oauth",
		ok,
		provider,
		error: ok ? null : message
	});
	const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${ok ? "Connected" : "Couldn’t connect"}</title>
  </head>
  <body style="font-family:system-ui;background:#05070d;color:#f5f7fb;padding:2rem">
    <p>${ok ? "Account connected. You can close this window." : message}</p>
    <script>
      (function () {
        var payload = ${payload};
        try {
          if (window.opener) window.opener.postMessage(payload, window.location.origin);
        } catch (e) {}
        window.close();
      })();
    <\/script>
  </body>
</html>`;
	return new Response(body, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
var Route$5 = createFileRoute("/api/oauth/social")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const error = url.searchParams.get("error");
	const code = url.searchParams.get("code")?.trim() || "";
	const state = url.searchParams.get("state")?.trim() || "";
	if (error) return html(false, "unknown", "The platform denied the connection.");
	if (!code || !state) return html(false, "unknown", "Missing OAuth code. Start Connect from Settings.");
	try {
		return html(true, (await completePublisherOAuth({
			code,
			state
		})).provider, "Connected");
	} catch {
		return html(false, "unknown", "Couldn’t finish connect. Try again from Settings.");
	}
} } } });
function json$4(status, body, extra) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			...extra
		}
	});
}
function requestIdOf(request) {
	return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}
async function readJson(request) {
	if (request.method === "GET" || request.method === "HEAD") return {};
	const text = await request.text();
	if (!text.trim()) return {};
	try {
		const parsed = JSON.parse(text);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch {
		throw new Error("VALIDATION");
	}
}
function parsePath(url) {
	return url.pathname.replace(/^\/api\/v1\/?/, "").split("/").filter(Boolean);
}
function routeAction(method, parts, body, search) {
	const [a, b, c, d] = parts;
	if (method === "GET" && parts.length === 0) return {
		action: "get_dashboard_snapshot",
		payload: {}
	};
	if (method === "GET" && a === "dashboard") return {
		action: "get_dashboard_snapshot",
		payload: {}
	};
	if (method === "GET" && a === "playbooks") return {
		action: "get_playbook_catalog",
		payload: {}
	};
	if (method === "GET" && a === "automation" && b === "connect-status") return {
		action: "get_connect_status",
		payload: {}
	};
	if (method === "GET" && a === "automation" && b === "playbook-package") return {
		action: "get_playbook_package",
		payload: { origin: body.origin ?? search.get("origin") }
	};
	if (method === "GET" && a === "integrations" && (!b || b === "status")) return {
		action: "get_integration_status",
		payload: {}
	};
	if (method === "GET" && a === "clients" && b === "at-risk") return {
		action: "list_at_risk_clients",
		payload: {}
	};
	if (method === "GET" && a === "clients" && !b) return {
		action: "list_clients",
		payload: {
			search: search.get("search") ?? "",
			status: search.get("status")
		}
	};
	if (method === "POST" && a === "clients" && !b) return {
		action: "create_client",
		payload: body
	};
	if (method === "GET" && a === "clients" && b && !c) return {
		action: "get_client",
		payload: { id: b }
	};
	if (method === "PATCH" && a === "clients" && b && !c) return {
		action: "update_client",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "GET" && a === "clients" && b && c === "progress") return {
		action: "get_client_progress",
		payload: { clientId: b }
	};
	if (method === "POST" && a === "clients" && b && c === "progress") return {
		action: "set_client_stage",
		payload: {
			...body,
			clientId: b
		}
	};
	if (method === "GET" && a === "clients" && b && c === "analytics") return {
		action: "get_analytics_snapshot",
		payload: { clientId: b }
	};
	if (method === "POST" && a === "clients" && b && c === "analytics" && d === "pull") return {
		action: "pull_client_analytics",
		payload: { clientId: b }
	};
	if (method === "POST" && a === "clients" && b && c === "suggested-titles" && d === "regenerate") return {
		action: "regenerate_suggested_titles",
		payload: { clientId: b }
	};
	if (method === "POST" && a === "clients" && b && c === "suggested-ideas" && d === "regenerate") return {
		action: "regenerate_suggested_ideas",
		payload: { clientId: b }
	};
	if (method === "GET" && a === "payments") return {
		action: "list_payments",
		payload: { clientId: search.get("clientId") }
	};
	if (method === "POST" && a === "payments" && b && c === "mark-paid") return {
		action: "mark_payment_paid",
		payload: { id: b }
	};
	if (method === "GET" && a === "leads") return {
		action: "list_leads",
		payload: {}
	};
	if (method === "POST" && a === "leads") return {
		action: "create_lead",
		payload: body
	};
	if (method === "PATCH" && a === "leads" && b) return {
		action: "update_lead",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "GET" && a === "jobs" && b) return {
		action: "get_job",
		payload: { id: b }
	};
	if (method === "GET" && a === "social" && b === "machine" && !c) return {
		action: "social.get_machine_status",
		payload: {}
	};
	if (method === "POST" && a === "social" && b === "machine" && c === "start") return {
		action: "social.start_machine",
		payload: body
	};
	if (method === "POST" && a === "social" && b === "machine" && c === "stop") return {
		action: "social.stop_machine",
		payload: body
	};
	if (method === "POST" && a === "social" && b === "machine" && c === "auto-stop") return {
		action: "social.set_auto_stop",
		payload: body
	};
	if (method === "POST" && a === "social" && b === "machine" && c === "computer-use") return {
		action: "social.ensure_computer_use",
		payload: body
	};
	if (method === "POST" && a === "social" && b === "machine" && c === "force-stop") return {
		action: "social.force_stop_if_running",
		payload: body
	};
	if (method === "GET" && a === "social" && b === "desktop" && c === "preview") return {
		action: "social.get_desktop_preview",
		payload: {}
	};
	if (method === "POST" && a === "social" && b === "screenshot") return {
		action: "social.take_screenshot",
		payload: body
	};
	if (method === "GET" && a === "social" && b === "windows") return {
		action: "social.list_open_windows",
		payload: {}
	};
	if (method === "GET" && a === "social" && b === "platforms" && !c) return {
		action: "social.list_platforms",
		payload: {}
	};
	if (method === "GET" && a === "social" && b === "publishers" && !c) return {
		action: "social.get_publisher_status",
		payload: {}
	};
	if (method === "GET" && a === "social" && b === "platforms" && c && !d) return {
		action: "social.get_platform_status",
		payload: { platform: c }
	};
	if (method === "POST" && a === "social" && b === "platforms" && c && d === "session") return {
		action: "social.mark_platform_session",
		payload: {
			...body,
			platform: c
		}
	};
	if (method === "POST" && a === "social" && b === "platforms" && c && d === "open") return {
		action: "social.open_platform",
		payload: {
			...body,
			platform: c
		}
	};
	if (method === "POST" && a === "social" && b === "platforms" && c && d === "health") return {
		action: "social.check_session_health",
		payload: {
			...body,
			platform: c
		}
	};
	if (method === "GET" && a === "social" && b === "assets" && !c) return {
		action: "social.list_uploadable_assets",
		payload: { clientId: search.get("clientId") }
	};
	if (method === "GET" && a === "social" && b === "assets" && c) return {
		action: "social.resolve_asset",
		payload: {
			assetId: c,
			clientId: search.get("clientId") ?? body.clientId
		}
	};
	if (method === "POST" && a === "social" && b === "jobs" && c === "bulk") return {
		action: "social.bulk_create_upload_jobs",
		payload: body
	};
	if (method === "POST" && a === "social" && b === "jobs" && !c) return {
		action: "social.create_upload_job",
		payload: body
	};
	if (method === "GET" && a === "social" && b === "jobs" && !c) return {
		action: "social.list_upload_jobs",
		payload: {
			clientId: search.get("clientId"),
			platform: search.get("platform"),
			status: search.get("status"),
			since: search.get("since")
		}
	};
	if (method === "GET" && a === "social" && b === "jobs" && c && !d) return {
		action: "social.get_upload_job",
		payload: { id: c }
	};
	if (method === "POST" && a === "social" && b === "jobs" && c && d === "retry") return {
		action: "social.retry_upload_job",
		payload: {
			...body,
			id: c
		}
	};
	if (method === "POST" && a === "social" && b === "jobs" && c && d === "cancel") return {
		action: "social.cancel_upload_job",
		payload: {
			...body,
			id: c
		}
	};
	if (method === "GET" && a === "social" && b === "posts" && !c) return {
		action: "social.list_posts",
		payload: {
			clientId: search.get("clientId"),
			platform: search.get("platform"),
			status: search.get("status")
		}
	};
	if (method === "GET" && a === "social" && b === "posts" && c) return {
		action: "social.get_post",
		payload: { id: c }
	};
	if (method === "POST" && a === "social" && b === "plan") return {
		action: "social.plan_distribution",
		payload: body
	};
	if (method === "GET" && a === "social" && b === "cost-guard") return {
		action: "social.get_cost_guard",
		payload: {}
	};
	if (method === "GET" && a === "addons") return {
		action: "list_addons",
		payload: {}
	};
	if (method === "GET" && a === "skills" && !b) return {
		action: "skills.list",
		payload: {}
	};
	if (method === "GET" && a === "skills" && b && !c) return {
		action: "skills.get",
		payload: { id: b }
	};
	if (method === "POST" && a === "skills" && !b) return {
		action: "skills.create",
		payload: body
	};
	if (method === "POST" && a === "skills" && b && c === "invoke") return {
		action: "skills.invoke",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "PATCH" && a === "skills" && b && !c) return {
		action: "skills.patch",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "skills" && b && c === "enabled") return {
		action: "skills.set_enabled",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "GET" && a === "tasks" && b) return {
		action: "tasks.get",
		payload: { id: b }
	};
	if (method === "GET" && a === "llm" && (b === "providers" || b === "models" || !b)) return {
		action: "get_llm_providers",
		payload: {}
	};
	if (method === "POST" && a === "skill-manage" && b === "create") return {
		action: "skill_manage.create",
		payload: body
	};
	if (method === "POST" && a === "skill-manage" && b && c === "edit") return {
		action: "skill_manage.edit",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "skill-manage" && b && c === "patch") return {
		action: "skill_manage.patch",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "skill-manage" && b && c === "files") return {
		action: "skill_manage.write_file",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "skill-manage" && b && c === "enabled") return {
		action: "skill_manage.set_enabled",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "skill-manage" && b && c === "review") return {
		action: "skill_manage.set_provenance_review",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "GET" && a === "skill-manage" && b && c === "versions") return {
		action: "skill_manage.list_versions",
		payload: { id: b }
	};
	if (method === "POST" && a === "skill-manage" && b && c === "rollback") return {
		action: "skill_manage.rollback",
		payload: {
			...body,
			id: b
		}
	};
	if (method === "POST" && a === "vision" && b === "analyze") return {
		action: "vision.analyze",
		payload: body
	};
	if (method === "POST" && a === "vision" && b === "compare") return {
		action: "vision.compare",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "start") return {
		action: "computer.start",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "stop") return {
		action: "computer.stop",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "screenshot") return {
		action: "computer.screenshot",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "mouse-click") return {
		action: "computer.mouse_click",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "mouse-move") return {
		action: "computer.mouse_move",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "mouse-drag") return {
		action: "computer.mouse_drag",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "scroll") return {
		action: "computer.mouse_scroll",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "type") return {
		action: "computer.keyboard_type",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "key") return {
		action: "computer.keyboard_key",
		payload: body
	};
	if (method === "POST" && a === "computer" && b === "a11y") return {
		action: "computer.accessibility_find",
		payload: body
	};
	if (method === "GET" && a === "computer" && b === "windows") return {
		action: "computer.list_windows",
		payload: {}
	};
	if (method === "POST" && a === "browser" && b === "open") return {
		action: "browser.open_url",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "wait") return {
		action: "browser.wait_for_text",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "upload") return {
		action: "browser.upload_file",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "summary") return {
		action: "browser.get_page_summary",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "instagram") return {
		action: "browser.open_instagram_upload",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "x") return {
		action: "browser.open_x_compose",
		payload: body
	};
	if (method === "POST" && a === "browser" && b === "tiktok") return {
		action: "browser.open_tiktok_upload",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "research") return {
		action: "clipping.research_channel",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "ideas") return {
		action: "clipping.generate_ideas",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "titles") return {
		action: "clipping.generate_titles",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "thumbnail") return {
		action: "clipping.generate_thumbnail",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "stage") return {
		action: "clipping.set_stage",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "publish") return {
		action: "clipping.mark_published",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "distribute") return {
		action: "clipping.distribute_social",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "skill") return {
		action: "clipping.run_skill",
		payload: body
	};
	if (method === "POST" && a === "clipping" && b === "observe") return {
		action: "clipping.observe_desktop",
		payload: body
	};
	if (method === "GET" && a === "library" && b === "assets" && !c) return {
		action: "library.search_assets",
		payload: {
			clientId: search.get("clientId"),
			search: search.get("q")
		}
	};
	if (method === "GET" && a === "library" && b === "assets" && c) return {
		action: "library.get_asset",
		payload: { id: c }
	};
	if (method === "POST" && a === "library" && b === "ingest") return {
		action: "library.ingest_url",
		payload: body
	};
	if (method === "POST" && a === "library" && b === "clips") return {
		action: "library.ingest_stream_clip",
		payload: body
	};
	if (method === "POST" && a === "library" && b === "thumbnails") return {
		action: "library.ingest_thumbnail",
		payload: body
	};
	if (method === "POST" && a === "library" && b === "renders" && !c) return {
		action: "library.queue_render",
		payload: body
	};
	if (method === "GET" && a === "library" && b === "renders") return {
		action: "library.list_renders",
		payload: { assetId: search.get("assetId") }
	};
	if (method === "POST" && a === "library" && b === "attach") return {
		action: "library.attach_to_social_job",
		payload: body
	};
	if (method === "GET" && a === "library" && b === "status") return {
		action: "library.get_pipeline_status",
		payload: {}
	};
	return null;
}
async function handle(request) {
	const rid = requestIdOf(request);
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: { Allow: "GET,POST,PATCH,OPTIONS" }
	});
	let actor;
	try {
		actor = await authenticateApiKey(request.headers.get("authorization"));
	} catch (error) {
		const code = error instanceof Error ? error.message : "UNAUTHORIZED";
		if (code === "RATE_LIMITED") return json$4(429, {
			error: {
				code,
				message: "Too many requests."
			},
			requestId: rid
		}, { "Retry-After": "60" });
		writeAuditLog({
			requestId: rid,
			actor: {
				source: "api",
				keyId: null,
				label: "unknown"
			},
			action: "auth",
			result: "denied",
			errorCode: "UNAUTHORIZED"
		});
		return json$4(401, {
			error: {
				code: "UNAUTHORIZED",
				message: "Invalid or revoked API key."
			},
			requestId: rid
		});
	}
	const idem = request.headers.get("idempotency-key")?.trim();
	if (idem) {
		const cached = await readIdempotency(`api:${actor.keyId}:${idem}`);
		if (cached) return new Response(cached, {
			status: 200,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"X-Request-Id": rid
			}
		});
	}
	let body = {};
	try {
		body = await readJson(request);
	} catch {
		return json$4(400, {
			error: {
				code: "VALIDATION",
				message: "JSON body required."
			},
			requestId: rid
		});
	}
	const url = new URL(request.url);
	const mapped = routeAction(request.method, parsePath(url), body, url.searchParams);
	if (!mapped) return json$4(404, {
		error: {
			code: "NOT_FOUND",
			message: "Unknown endpoint."
		},
		requestId: rid
	});
	if (mapped.action === "get_playbook_package" && !mapped.payload.origin) mapped.payload.origin = url.origin;
	const result = await runAutonomyAction({
		actor,
		action: mapped.action,
		payload: mapped.payload,
		requestId: rid,
		playbookId: request.headers.get("x-playbook-id") || (typeof body.playbook === "string" ? body.playbook : null),
		runId: request.headers.get("x-run-id") || (typeof body.runId === "string" ? body.runId : null)
	});
	if (!result.ok) {
		const headers = { "X-Request-Id": rid };
		if (result.status === 429) headers["Retry-After"] = "60";
		return json$4(result.status, {
			error: {
				code: result.code,
				message: result.message
			},
			requestId: rid
		}, headers);
	}
	const encoded = JSON.stringify({
		data: result.data,
		requestId: rid
	});
	if (idem) await writeIdempotency(`api:${actor.keyId}:${idem}`, encoded);
	return new Response(encoded, {
		status: mapped.action.startsWith("create") && request.method === "POST" ? 201 : 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			"X-Request-Id": rid
		}
	});
}
var Route$4 = createFileRoute("/api/v1/$")({ server: { handlers: {
	GET: ({ request }) => handle(request),
	POST: ({ request }) => handle(request),
	PATCH: ({ request }) => handle(request),
	OPTIONS: ({ request }) => handle(request)
} } });
function json$3(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
function eventNameOf(payload) {
	const name = payload.name ?? payload.event_type ?? payload.type ?? payload.eventType;
	return typeof name === "string" ? name : "";
}
function eventIdOf(payload) {
	const id = payload.id ?? payload.event_id ?? payload.eventId;
	return typeof id === "string" && id.trim() ? id : crypto.randomUUID();
}
var Route$3 = createFileRoute("/api/webhooks/airwallex")({ server: { handlers: { POST: async ({ request }) => {
	const config = await loadAirwallexConfig();
	if (!config?.webhookSecret) return json$3(503, { error: {
		code: "WEBHOOK_UNSET",
		message: "Airwallex webhook secret isn’t configured."
	} });
	const raw = await request.text();
	const timestamp = request.headers.get("x-timestamp") ?? "";
	const signature = request.headers.get("x-signature") ?? "";
	if (!verifyAirwallexSignature({
		secret: config.webhookSecret,
		timestamp,
		rawBody: raw,
		signature
	})) return json$3(401, { error: {
		code: "INVALID_SIGNATURE",
		message: "Invalid webhook signature."
	} });
	let payload;
	try {
		payload = JSON.parse(raw);
	} catch {
		return json$3(400, { error: {
			code: "VALIDATION",
			message: "JSON body required."
		} });
	}
	const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
	await handleAirwallexWebhook(eventIdOf(payload), eventNameOf(payload), data);
	return json$3(200, { received: true });
} } } });
function json$2(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
var Route$2 = createFileRoute("/api/webhooks/inbound")({ server: { handlers: { POST: async ({ request }) => {
	const rid = request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
	const secret = await readWebhookSecret();
	if (!secret) return json$2(503, {
		error: {
			code: "WEBHOOK_UNSET",
			message: "Inbound webhook secret isn’t configured."
		},
		requestId: rid
	});
	const raw = await request.text();
	const timestamp = request.headers.get("x-agency-timestamp") ?? request.headers.get("x-webhook-timestamp") ?? "";
	const signature = request.headers.get("x-agency-signature") ?? request.headers.get("x-webhook-signature") ?? "";
	if (!verifyInboundSignature({
		secret,
		timestamp,
		rawBody: raw,
		signature
	})) {
		writeAuditLog({
			requestId: rid,
			actor: {
				source: "webhook",
				keyId: null,
				label: "inbound"
			},
			action: "auth",
			result: "denied",
			errorCode: "INVALID_SIGNATURE"
		});
		return json$2(401, {
			error: {
				code: "INVALID_SIGNATURE",
				message: "Invalid webhook signature."
			},
			requestId: rid
		});
	}
	try {
		rateLimitOrThrow("webhook:inbound");
	} catch {
		return json$2(429, {
			error: {
				code: "RATE_LIMITED",
				message: "Too many requests."
			},
			requestId: rid
		});
	}
	let envelope;
	try {
		envelope = JSON.parse(raw);
	} catch {
		return json$2(400, {
			error: {
				code: "VALIDATION",
				message: "JSON body required."
			},
			requestId: rid
		});
	}
	const command = String(envelope.command ?? "");
	if (!INBOUND_COMMANDS.includes(command)) return json$2(400, {
		error: {
			code: "UNKNOWN_COMMAND",
			message: "Unsupported command."
		},
		requestId: rid
	});
	const cmdId = envelope.id?.trim();
	if (cmdId) {
		const cached = await readIdempotency(`wh:${cmdId}`);
		if (cached) return new Response(cached, {
			status: 200,
			headers: { "Content-Type": "application/json; charset=utf-8" }
		});
	}
	const result = await runAutonomyAction({
		actor: {
			source: "webhook",
			keyId: "webhook",
			label: "Inbound webhook",
			scopes: [
				"read",
				"write:progress",
				"write:payments",
				"write:leads",
				"write:clients",
				"actions:ai",
				"write:social"
			]
		},
		action: command,
		payload: envelope.payload ?? {},
		requestId: rid,
		playbookId: envelope.playbook ?? envelope.playbookId ?? null,
		runId: envelope.runId ?? envelope.run_id ?? null
	});
	if (!result.ok) return json$2(result.status, {
		error: {
			code: result.code,
			message: result.message
		},
		requestId: rid
	});
	const encoded = JSON.stringify({
		data: result.data,
		requestId: rid
	});
	if (cmdId) await writeIdempotency(`wh:${cmdId}`, encoded);
	return new Response(encoded, {
		status: 200,
		headers: { "Content-Type": "application/json; charset=utf-8" }
	});
} } } });
function json$1(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
var Route$1 = createFileRoute("/api/webhooks/telegram")({ server: { handlers: { POST: async ({ request }) => {
	const { loadTelegramWebhookSecret, upsertInbound } = await import("./channels.server-D0O4sCtY.mjs");
	const secret = await loadTelegramWebhookSecret();
	if (secret) {
		if ((request.headers.get("x-telegram-bot-api-secret-token")?.trim() || "") !== secret) return json$1(401, { ok: false });
	}
	let payload;
	try {
		payload = await request.json();
	} catch {
		return json$1(400, { ok: false });
	}
	const message = payload.message;
	const text = String(message?.text ?? message?.caption ?? "").trim();
	const chatId = message?.chat?.id;
	if (!text || chatId == null) return json$1(200, { ok: true });
	await upsertInbound({
		provider: "telegram",
		externalId: String(chatId),
		contactName: message?.chat?.first_name || message?.chat?.title || "Telegram",
		contactHandle: message?.chat?.username ? `@${message.chat.username}` : null,
		body: text,
		externalMessageId: message?.message_id != null ? String(message.message_id) : null
	});
	return json$1(200, { ok: true });
} } } });
function json(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
function validSignature(secret, raw, header) {
	const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
	const left = Buffer.from(expected);
	const right = Buffer.from(header);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
var Route = createFileRoute("/api/webhooks/whatsapp")({ server: { handlers: {
	GET: async ({ request }) => {
		const { loadWhatsAppConfig } = await import("./channels.server-D0O4sCtY.mjs");
		const config = await loadWhatsAppConfig();
		const url = new URL(request.url);
		const mode = url.searchParams.get("hub.mode");
		const token = url.searchParams.get("hub.verify_token");
		const challenge = url.searchParams.get("hub.challenge");
		if (mode === "subscribe" && config?.verifyToken && token === config.verifyToken && challenge) return new Response(challenge, {
			status: 200,
			headers: { "Content-Type": "text/plain" }
		});
		return json(403, { ok: false });
	},
	POST: async ({ request }) => {
		const { loadWhatsAppConfig, upsertInbound } = await import("./channels.server-D0O4sCtY.mjs");
		const config = await loadWhatsAppConfig();
		if (!config) return json(503, { ok: false });
		const raw = await request.text();
		if (config?.appSecret) {
			const header = request.headers.get("x-hub-signature-256")?.trim() || "";
			if (!header || !validSignature(config.appSecret, raw, header)) return json(401, { ok: false });
		}
		let payload;
		try {
			payload = JSON.parse(raw);
		} catch {
			return json(400, { ok: false });
		}
		for (const entry of payload.entry ?? []) for (const change of entry.changes ?? []) {
			const value = change.value;
			const contacts = new Map((value?.contacts ?? []).map((row) => [String(row.wa_id ?? ""), row.profile?.name ?? "WhatsApp"]));
			for (const message of value?.messages ?? []) {
				const text = String(message.text?.body ?? "").trim();
				const from = String(message.from ?? "").trim();
				if (!text || !from) continue;
				await upsertInbound({
					provider: "whatsapp",
					externalId: from,
					contactName: contacts.get(from) || from,
					contactHandle: `+${from}`,
					body: text,
					externalMessageId: message.id ?? null
				});
			}
		}
		return json(200, { ok: true });
	}
} } });
var IndexRoute = Route$46.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$47
});
var AppRoute = Route$45.update({
	id: "/_app",
	getParentRoute: () => Route$47
});
var DocsRoute = Route$44.update({
	id: "/docs",
	path: "/docs",
	getParentRoute: () => Route$47
});
var LoginRoute = Route$43.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$47
});
var PortalRoute = Route$42.update({
	id: "/portal",
	path: "/portal",
	getParentRoute: () => Route$47
});
var ResetPasswordRoute = Route$41.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$47
});
var AppAgentRoute = Route$40.update({
	id: "/agent",
	path: "/agent",
	getParentRoute: () => AppRoute
});
var AppAnalyticsRoute = Route$39.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => AppRoute
});
var AppApprovalsRoute = Route$38.update({
	id: "/approvals",
	path: "/approvals",
	getParentRoute: () => AppRoute
});
var AppBillingRoute = Route$37.update({
	id: "/billing",
	path: "/billing",
	getParentRoute: () => AppRoute
});
var AppCalendarRoute = Route$36.update({
	id: "/calendar",
	path: "/calendar",
	getParentRoute: () => AppRoute
});
var AppClientsRoute = Route$35.update({
	id: "/clients",
	path: "/clients",
	getParentRoute: () => AppRoute
});
var AppHomeRoute = Route$34.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => AppRoute
});
var AppIdeationRoute = Route$33.update({
	id: "/ideation",
	path: "/ideation",
	getParentRoute: () => AppRoute
});
var AppInboxRoute = Route$32.update({
	id: "/inbox",
	path: "/inbox",
	getParentRoute: () => AppRoute
});
var AppLeadsRoute = Route$31.update({
	id: "/leads",
	path: "/leads",
	getParentRoute: () => AppRoute
});
var AppLibraryRoute = Route$30.update({
	id: "/library",
	path: "/library",
	getParentRoute: () => AppRoute
});
var AppMoneyRoute = Route$29.update({
	id: "/money",
	path: "/money",
	getParentRoute: () => AppRoute
});
var AppOnboardingRoute = Route$28.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => AppRoute
});
var AppSettingsRoute = Route$27.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AppRoute
});
var AppSocialRoute = Route$26.update({
	id: "/social",
	path: "/social",
	getParentRoute: () => AppRoute
});
var AppTeamRoute = Route$25.update({
	id: "/team",
	path: "/team",
	getParentRoute: () => AppRoute
});
var AppThumbnailsRoute = Route$24.update({
	id: "/thumbnails",
	path: "/thumbnails",
	getParentRoute: () => AppRoute
});
var ApiAgencySchemaRoute = Route$23.update({
	id: "/api/agency-schema",
	path: "/api/agency-schema",
	getParentRoute: () => Route$47
});
var ApiDemoRoute = Route$22.update({
	id: "/api/demo",
	path: "/api/demo",
	getParentRoute: () => Route$47
});
var ApiHealthRoute = Route$21.update({
	id: "/api/health",
	path: "/api/health",
	getParentRoute: () => Route$47
});
var ApiMcpRoute = Route$20.update({
	id: "/api/mcp",
	path: "/api/mcp",
	getParentRoute: () => Route$47
});
var PortalIndexRoute = Route$19.update({
	id: "/",
	path: "/",
	getParentRoute: () => PortalRoute
});
var PortalActivityRoute = Route$18.update({
	id: "/activity",
	path: "/activity",
	getParentRoute: () => PortalRoute
});
var PortalApprovalsRoute = Route$17.update({
	id: "/approvals",
	path: "/approvals",
	getParentRoute: () => PortalRoute
});
var PortalAssetsRoute = Route$16.update({
	id: "/assets",
	path: "/assets",
	getParentRoute: () => PortalRoute
});
var PortalHelpRoute = Route$15.update({
	id: "/help",
	path: "/help",
	getParentRoute: () => PortalRoute
});
var PortalHomeRoute = Route$14.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => PortalRoute
});
var PortalLoginRoute = Route$13.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => PortalRoute
});
var AppClientsIndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppClientsRoute
});
var AppClientsClientIdRoute = Route$11.update({
	id: "/$clientId",
	path: "/$clientId",
	getParentRoute: () => AppClientsRoute
});
var ApiAuthSplatRoute = Route$10.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$47
});
var ApiCronOpsRoute = Route$9.update({
	id: "/api/cron/ops",
	path: "/api/cron/ops",
	getParentRoute: () => Route$47
});
var ApiLibraryFileRoute = Route$8.update({
	id: "/api/library/file",
	path: "/api/library/file",
	getParentRoute: () => Route$47
});
var ApiLibraryUploadRoute = Route$7.update({
	id: "/api/library/upload",
	path: "/api/library/upload",
	getParentRoute: () => Route$47
});
var ApiOauthLinearRoute = Route$6.update({
	id: "/api/oauth/linear",
	path: "/api/oauth/linear",
	getParentRoute: () => Route$47
});
var ApiOauthSocialRoute = Route$5.update({
	id: "/api/oauth/social",
	path: "/api/oauth/social",
	getParentRoute: () => Route$47
});
var ApiV1SplatRoute = Route$4.update({
	id: "/api/v1/$",
	path: "/api/v1/$",
	getParentRoute: () => Route$47
});
var ApiWebhooksAirwallexRoute = Route$3.update({
	id: "/api/webhooks/airwallex",
	path: "/api/webhooks/airwallex",
	getParentRoute: () => Route$47
});
var ApiWebhooksInboundRoute = Route$2.update({
	id: "/api/webhooks/inbound",
	path: "/api/webhooks/inbound",
	getParentRoute: () => Route$47
});
var ApiWebhooksTelegramRoute = Route$1.update({
	id: "/api/webhooks/telegram",
	path: "/api/webhooks/telegram",
	getParentRoute: () => Route$47
});
var ApiWebhooksWhatsappRoute = Route.update({
	id: "/api/webhooks/whatsapp",
	path: "/api/webhooks/whatsapp",
	getParentRoute: () => Route$47
});
var AppClientsRouteChildren = {
	AppClientsClientIdRoute,
	AppClientsIndexRoute
};
var AppRouteChildren = {
	AppAgentRoute,
	AppAnalyticsRoute,
	AppApprovalsRoute,
	AppBillingRoute,
	AppCalendarRoute,
	AppClientsRoute: AppClientsRoute._addFileChildren(AppClientsRouteChildren),
	AppHomeRoute,
	AppIdeationRoute,
	AppInboxRoute,
	AppLeadsRoute,
	AppLibraryRoute,
	AppMoneyRoute,
	AppOnboardingRoute,
	AppSettingsRoute,
	AppSocialRoute,
	AppTeamRoute,
	AppThumbnailsRoute
};
var AppRouteWithChildren = AppRoute._addFileChildren(AppRouteChildren);
var PortalRouteChildren = {
	PortalActivityRoute,
	PortalApprovalsRoute,
	PortalAssetsRoute,
	PortalHelpRoute,
	PortalHomeRoute,
	PortalLoginRoute,
	PortalIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRouteWithChildren,
	DocsRoute,
	LoginRoute,
	PortalRoute: PortalRoute._addFileChildren(PortalRouteChildren),
	ResetPasswordRoute,
	ApiAgencySchemaRoute,
	ApiDemoRoute,
	ApiHealthRoute,
	ApiMcpRoute,
	ApiAuthSplatRoute,
	ApiCronOpsRoute,
	ApiLibraryFileRoute,
	ApiLibraryUploadRoute,
	ApiOauthLinearRoute,
	ApiOauthSocialRoute,
	ApiV1SplatRoute,
	ApiWebhooksAirwallexRoute,
	ApiWebhooksInboundRoute,
	ApiWebhooksTelegramRoute,
	ApiWebhooksWhatsappRoute
};
var routeTree = Route$47._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent,
		defaultNotFoundComponent: NotFound,
		defaultPreload: "intent",
		scrollRestoration: true
	});
}
//#endregion
export { GlassCard as C, usePrefersReducedMotion as D, BorderBeam as E, cn as O, OrbsBackground as S, AnimatedGridPattern as T, TooltipTrigger as _, saveLead as a, ClippyMark as b, deriveLeadTotals as c, Route$39 as d, Route$40 as f, TooltipContent as g, Tooltip as h, listLeads as i, Route$24 as l, userFacingErrorMessage as m, Route$11 as n, softDeleteLead as o, captureClientError as p, Route$13 as r, LEADS_QUERY_KEY as s, router_exports as t, Route$33 as u, useTheme as v, Button as w, SparklesText as x, BrandLockup as y };
