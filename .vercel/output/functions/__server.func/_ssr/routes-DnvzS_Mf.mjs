import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as APP_TAGLINE, t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as parseProxyCountry, u as PROXY_COUNTRIES } from "./social-machine-D22Q8XQF.mjs";
import { At as Bot, C as ShieldCheck, G as MessageCircle, Pt as ArrowRight, R as Pause, Tt as ChevronDown, U as MonitorPlay, a as Wallet, at as HardDrive, jt as BookOpen, tt as Kanban, vt as Clapperboard, x as Sparkles } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as usePrefersReducedMotion, E as BorderBeam, O as cn, T as AnimatedGridPattern, b as ClippyMark, v as useTheme, w as Button, x as SparklesText } from "./router-DRtNPEcw.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bsan92LK.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { t as ThemeToggle } from "./theme-toggle-NsNUnV6r.mjs";
import { s as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { t as ScrollProgress } from "./scroll-progress-C1dB__k8.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as AuroraText } from "./aurora-text-Bfo7HLWM.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { t as BlurFade } from "./blur-fade-Bh-jVmMj.mjs";
import { t as AnimatedShinyText } from "./animated-shiny-text-XXcoX7q5.mjs";
import { t as TypingAnimation } from "./typing-animation-ByKa0Iw8.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
import { t as NumberTicker } from "./number-ticker-BX_YJzC_.mjs";
import { t as DEMO_ROLES } from "./demo-BGRHcPAA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DnvzS_Mf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Marquee({ children, className, pauseOnHover = true, reverse = false, duration = 36 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("group flex overflow-hidden [--gap:1rem] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]", className),
		style: { "--duration": `${duration}s` },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("flex min-w-full shrink-0 items-center gap-(--gap) py-2", reverse ? "animate-marquee-reverse" : "animate-marquee", pauseOnHover && "group-hover:[animation-play-state:paused]"),
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: cn("flex min-w-full shrink-0 items-center gap-(--gap) py-2", reverse ? "animate-marquee-reverse" : "animate-marquee", pauseOnHover && "group-hover:[animation-play-state:paused]"),
			children
		})]
	});
}
function Spotlight({ className }) {
	const reduced = usePrefersReducedMotion();
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (reduced) return;
		const node = ref.current;
		if (!node) return;
		node.style.setProperty("--spot-x", "50%");
		node.style.setProperty("--spot-y", "20%");
	}, [reduced]);
	function onMove(event) {
		if (reduced) return;
		const node = ref.current;
		if (!node) return;
		const box = node.getBoundingClientRect();
		const x = (event.clientX - box.left) / box.width * 100;
		const y = (event.clientY - box.top) / box.height * 100;
		node.style.setProperty("--spot-x", `${x}%`);
		node.style.setProperty("--spot-y", `${y}%`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		"aria-hidden": "true",
		onMouseMove: onMove,
		className: cn("pointer-events-none absolute inset-0 overflow-hidden", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 opacity-80",
			style: { background: "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 18%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)" }
		})
	});
}
function TiltCard({ children, className }) {
	const reduced = usePrefersReducedMotion();
	const ref = (0, import_react.useRef)(null);
	function onMove(event) {
		if (reduced) return;
		if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
		const node = ref.current;
		if (!node) return;
		const box = node.getBoundingClientRect();
		const px = (event.clientX - box.left) / box.width - .5;
		const py = (event.clientY - box.top) / box.height - .5;
		node.style.transform = `perspective(1100px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
	}
	function onLeave() {
		const node = ref.current;
		if (!node) return;
		node.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		onMouseMove: onMove,
		onMouseLeave: onLeave,
		className: cn("max-w-full transform-gpu overflow-hidden transition-transform duration-200 ease-[var(--ease-out)] will-change-transform", className),
		children
	});
}
var FEATURES = [
	{
		value: 4,
		suffix: "",
		title: "Networks inside the OS",
		description: "X, YouTube, Instagram, and TikTok — opened from the Social Machine, not a pile of browsers."
	},
	{
		value: 3,
		suffix: "",
		title: "Liaison channels",
		description: "Telegram, WhatsApp, and Discord for customers and companies. Threads, not theatre."
	},
	{
		value: 1,
		suffix: "",
		title: "Social Machine to hibernate",
		description: "Start when you need the networks. Hibernate when you don’t. The session stays hot."
	},
	{
		value: 0,
		suffix: "",
		title: "Clips on the machine disk",
		description: "Library is immutable cloud storage. Optional content pins. The VM is never the backend."
	},
	{
		value: 1,
		suffix: "",
		title: "Native Hermes Agent",
		description: "MCP tools, playbooks, and the agent loop live in ClippyOS. Skills run isolated."
	},
	{
		value: 1,
		suffix: "",
		title: "Linear kanban",
		description: "Failed jobs, renders, and agent runs map to Linear. Engineering and ops share one board."
	},
	{
		value: 1,
		suffix: "",
		title: "Approvals before publish",
		description: "Nothing public without a sign-off. Safety inbox and an audit trail on every cut."
	},
	{
		value: 1,
		suffix: "",
		title: "Globally reachable",
		description: "The OS is reachable from anywhere. Storage, liaison, and Command travel with the studio."
	}
];
var SQUARE_PATTERNS = [
	[
		[8, 1],
		[9, 3],
		[7, 2],
		[10, 4],
		[8, 5]
	],
	[
		[7, 2],
		[10, 1],
		[8, 4],
		[9, 5],
		[11, 3]
	],
	[
		[9, 1],
		[8, 3],
		[10, 2],
		[7, 5],
		[11, 4]
	],
	[
		[8, 2],
		[11, 1],
		[9, 4],
		[7, 3],
		[10, 5]
	],
	[
		[10, 2],
		[8, 1],
		[9, 5],
		[11, 3],
		[7, 4]
	],
	[
		[7, 1],
		[9, 2],
		[10, 5],
		[8, 4],
		[11, 1]
	],
	[
		[11, 3],
		[8, 2],
		[7, 5],
		[9, 1],
		[10, 4]
	],
	[
		[9, 4],
		[10, 1],
		[8, 3],
		[11, 2],
		[7, 5]
	]
];
function FeatureGrid() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "features",
		className: "px-4 py-16 md:px-6 md:py-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: FEATURES.map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "relative overflow-hidden rounded-modal border border-border bg-gradient-to-b from-secondary-surface to-elevated p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid, {
						size: 20,
						squares: SQUARE_PATTERNS[index]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-20 text-section font-semibold tracking-tight tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberTicker, {
							value: feature.value,
							suffix: feature.suffix
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "relative z-20 mt-2 text-body font-semibold tracking-tight",
						children: feature.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-20 mt-2 text-caption text-muted",
						children: feature.description
					})
				]
			}, feature.title))
		})
	});
}
function Grid({ size = 20, squares }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-gradient-to-r from-accent/10 to-teal/10 opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GridPattern, {
				width: size,
				height: size,
				x: "-12",
				y: "4",
				squares,
				className: "absolute inset-0 h-full w-full fill-fg/10 stroke-fg/10 mix-blend-overlay"
			})
		})
	});
}
function GridPattern({ width, height, x, y, squares, className }) {
	const patternId = (0, import_react.useId)();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		"aria-hidden": "true",
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
				id: patternId,
				width,
				height,
				patternUnits: "userSpaceOnUse",
				x,
				y,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: `M.5 ${height}V.5H${width}`,
					fill: "none"
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "100%",
				height: "100%",
				strokeWidth: 0,
				fill: `url(#${patternId})`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				x,
				y,
				className: "overflow-visible",
				children: squares.map(([sx, sy]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					strokeWidth: "0",
					width: width + 1,
					height: height + 1,
					x: sx * width,
					y: sy * height
				}, `${sx}-${sy}`))
			})
		]
	});
}
var LOGOS_PER_ROW = 4;
var LOGOS = [
	{
		title: "Daytona",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaytonaMark, {})
	},
	{
		title: "Supabase",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupabaseMark, {})
	},
	{
		title: "Telegram",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelegramMark, {})
	},
	{
		title: "WhatsApp",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppMark, {})
	},
	{
		title: "Discord",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscordMark, {})
	},
	{
		title: "Airwallex",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AirwallexMark, {})
	},
	{
		title: "Hermes Agent",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NousMark, {})
	},
	{
		title: "Linear",
		mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearMark, {})
	}
];
function LogoCloud() {
	const setCount = Math.ceil(LOGOS.length / LOGOS_PER_ROW);
	const [setIndex, setSetIndex] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			setSetIndex((i) => (i + 1) % setCount);
		}, 2800);
		return () => window.clearInterval(id);
	}, [setCount]);
	const visible = LOGOS.slice(setIndex * LOGOS_PER_ROW, setIndex * LOGOS_PER_ROW + LOGOS_PER_ROW);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-y border-border bg-elevated/40 px-4 py-10 md:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-6 md:flex-row md:gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "shrink-0 text-center text-caption font-medium tracking-tight text-muted md:text-left",
				children: "Infrastructure we run on"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid min-h-12 w-full grid-cols-2 items-center justify-items-center gap-4 sm:grid-cols-4 md:flex md:flex-1 md:justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					mode: "popLayout",
					children: visible.map((logo, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						initial: {
							opacity: 0,
							x: -16,
							filter: "blur(8px)"
						},
						animate: {
							opacity: 1,
							x: 0,
							filter: "blur(0px)"
						},
						exit: {
							opacity: 0,
							x: 16,
							filter: "blur(8px)"
						},
						transition: {
							duration: .22,
							ease: "easeInOut",
							delay: index * .08
						},
						className: "flex w-full items-center justify-center gap-2 text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-7 place-items-center text-fg",
							"aria-hidden": "true",
							children: logo.mark
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-caption font-medium tracking-tight",
							children: logo.title
						})]
					}, logo.title))
				})
			})]
		})
	});
}
function DaytonaMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2.2 13.1 10 21 12l-7.9 2L12 21.8 10.9 14 3 12l7.9-2z" })
	});
}
function SupabaseMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.8 2.1c.4-.7 1.4-.4 1.4.5v8.7h6c.9 0 1.3 1.1.7 1.7l-8.9 9.9c-.5.6-1.5.2-1.4-.6v-8.8H4.6c-.9 0-1.3-1.1-.6-1.7z" })
	});
}
function TelegramMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21.5 4.3 2.8 11.4c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3.9 0 .6.3l-9 8.6-.3 4.7c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.5c.3-1.4-.5-2-1.8-1.5z" })
	});
}
function WhatsAppMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.04 2C6.5 2 2 6.4 2 11.9c0 1.7.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.4 10-9.9S17.54 2 12.04 2zm5.8 14.1c-.2.7-1.2 1.2-1.9 1.3-.5.1-1.1.2-3.6-.8-3.1-1.3-5.1-4.5-5.3-4.7-.2-.2-1.5-2-1.5-3.8s1-2.7 1.3-3.1c.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .7.6.3.7.9 2.5 1 2.6.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.7.2.4.9 1.5 2 2.4 1.3 1.2 2.5 1.6 2.8 1.8.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.9.9 2.2 1.1.3.2.5.2.6.4.1.2 0 .8-.2 1.5z" })
	});
}
function DiscordMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19.3 5.1A17 17 0 0 0 15.1 4l-.4.7a16 16 0 0 1 3.2 1.2 14.6 14.6 0 0 0-12 0A16 16 0 0 1 8.9 4.7L8.5 4a17 17 0 0 0-4.2 1.1C2.2 9.1 1.6 12.9 1.9 16.7A17 17 0 0 0 7 19l.7-1.1a11 11 0 0 1-1.8-.9l.4-.3a12.4 12.4 0 0 0 10.4 0l.4.3a11 11 0 0 1-1.8.9l.7 1.1a17 17 0 0 0 5.1-2.3c.4-4.3-.3-8-1.8-11.6zM9.7 14.5c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7zm4.6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.6 1.7-1.5 1.7z" })
	});
}
function AirwallexMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3 3.5 21h3.4l1.6-3.4h7l1.6 3.4h3.4L12 3zm0 5.3 2.5 5.3h-5z" })
	});
}
function NousMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.8",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "8.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 12.5c1.4 2 2.6 3 4 3s2.6-1 4-3" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "9.2",
				cy: "10",
				r: "1",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "14.8",
				cy: "10",
				r: "1",
				fill: "currentColor",
				stroke: "none"
			})
		]
	});
}
function LinearMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "size-6",
		fill: "currentColor",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.2 14.8 14.8 4.2A9.9 9.9 0 0 0 4.2 14.8zm2.4 4.1 12.3-12.3a10 10 0 0 1-12.3 12.3zM19.5 9.7 9.7 19.5a9.9 9.9 0 0 0 9.8-9.8z" })
	});
}
var TESTIMONIALS = [
	{
		title: "Hibernate, don’t destroy",
		quote: "We used to lose Instagram sessions every time a box died. ClippyOS pauses the Social Machine. We come back to the same windows.",
		name: "Amelia Croft",
		role: "Studio lead, Northstar Media",
		initials: "AC"
	},
	{
		title: "Clients live in Inbox",
		quote: "Telegram, WhatsApp, and Discord sit next to the pipeline. We stopped pasting briefs out of group chats into Notion.",
		name: "Jonah Venter",
		role: "Producer, Cut House",
		initials: "JV"
	},
	{
		title: "Nothing ships unsigned",
		quote: "Approvals before publish saved us twice in the first month. The audit trail is the thing agencies actually owe brands.",
		name: "Priya Nair",
		role: "Ops, Frame & Field",
		initials: "PN"
	},
	{
		title: "Money finally matches the day",
		quote: "Retainers, team cost, and collections sit on Command. We stopped reconciling three spreadsheets after standup.",
		name: "Luis Ortega",
		role: "Owner, Ortega Clips",
		initials: "LO"
	},
	{
		title: "Hermes is in the OS, not a tab",
		quote: "The agent loop, skills, and playbooks live here. We don’t babysit a chat window while a render is running.",
		name: "Hana Berg",
		role: "Editor, Berg Studio",
		initials: "HB"
	},
	{
		title: "Linear is the kanban",
		quote: "Failed jobs and agent runs show up on the board we already use. Engineering and clipping share one queue.",
		name: "Marcus Adeyemi",
		role: "CTO, Signal Cut",
		initials: "MA"
	},
	{
		title: "Four networks, one machine",
		quote: "X, YouTube, Instagram, TikTok from inside ClippyOS. No more five Chrome profiles and a sticky note of passwords.",
		name: "Sofia Rahman",
		role: "Social lead, Late Drop",
		initials: "SR"
	},
	{
		title: "Clips never sat on the VM",
		quote: "Immutable cloud storage is the library. If the machine sleeps, the footage is still there. That was the deal-breaker.",
		name: "Eli Kovacs",
		role: "Post supervisor, Kovacs Co.",
		initials: "EK"
	},
	{
		title: "Demo, then checkout",
		quote: "We requested a walkthrough, got the confirmation the same hour, and subscribed when Command made sense for the roster.",
		name: "Nina Walsh",
		role: "Founder, Walsh Agency",
		initials: "NW"
	},
	{
		title: "The day has a command center",
		quote: "Pipeline, money, and what to ship next — one screen. Our morning standup is ten minutes because Command already knows.",
		name: "Theo Park",
		role: "EP, Park & Sons",
		initials: "TP"
	},
	{
		title: "Pin on publish, not as a disk",
		quote: "We pin after a cut goes live. Content network as a second layer. Nobody treats the Social Machine like a NAS.",
		name: "Ravi Desai",
		role: "Technical producer",
		initials: "RD"
	},
	{
		title: "Discord still talks to stages",
		quote: "Status Agent against production stages, not a bot in a vacuum. Clients see progress without us writing updates.",
		name: "Claire Huang",
		role: "Client partner, Huang Edit",
		initials: "CH"
	}
];
function seededRandom(seed) {
	return function next() {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
}
function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2, padding = 20) {
	return !(x1 + w1 + padding < x2 || x2 + w2 + padding < x1 || y1 + h1 + padding < y2 || y2 + h2 + padding < y1);
}
function isInWorldCenterZone(absoluteX, absoluteY, width, height, exclusionWidth, exclusionHeight) {
	const zoneLeft = -exclusionWidth / 2;
	const zoneRight = exclusionWidth / 2;
	const zoneTop = -exclusionHeight / 2;
	const zoneBottom = exclusionHeight / 2;
	return !(absoluteX + width < zoneLeft || absoluteX > zoneRight || absoluteY + height < zoneTop || absoluteY > zoneBottom);
}
function generateTileCards(tileX, tileY, tileSize, testimonials, cardCount, exclusionWidth, exclusionHeight) {
	const random = seededRandom(tileX * 1e4 + tileY);
	const cards = [];
	const minGap = 80;
	for (let i = 0; i < cardCount; i += 1) {
		const testimonial = testimonials[Math.abs(tileX * cardCount + tileY + i) % testimonials.length];
		const baseWidth = 360 + random() * 50;
		const height = 196 + random() * 24;
		let x = 0;
		let y = 0;
		let attempts = 0;
		let valid = false;
		while (attempts < 80 && !valid) {
			x = random() * (tileSize - baseWidth - 80) + 40;
			y = random() * (tileSize - height - 80) + 40;
			if (isInWorldCenterZone(tileX * tileSize + x, tileY * tileSize + y, baseWidth, height, exclusionWidth, exclusionHeight)) {
				attempts += 1;
				continue;
			}
			valid = cards.every((card) => !rectanglesOverlap(x, y, baseWidth, height, card.x, card.y, card.width, card.height, minGap));
			attempts += 1;
		}
		if (valid) cards.push({
			id: `${tileX}-${tileY}-${i}`,
			testimonial,
			x,
			y,
			width: baseWidth,
			height
		});
	}
	return cards;
}
function generateFocusPositions(count, tileSize, testimonials, cardsPerTile, exclusionWidth, exclusionHeight) {
	const positions = [];
	for (let tx = -3; tx <= 3 && positions.length < count; tx += 1) for (let ty = -3; ty <= 3 && positions.length < count; ty += 1) {
		if (tx === 0 && ty === 0) continue;
		const cards = generateTileCards(tx, ty, tileSize, testimonials, cardsPerTile, exclusionWidth, exclusionHeight);
		if (!cards[0]) continue;
		const card = cards[0];
		positions.push({
			x: tx * tileSize + card.x + card.width / 2,
			y: ty * tileSize + card.y + card.height / 2,
			cardId: card.id
		});
	}
	return positions;
}
function easeOutCubic(t) {
	return 1 - (1 - t) ** 3;
}
function Avatar({ initials }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-8 shrink-0 place-items-center rounded-full bg-accent/20 text-caption font-semibold text-accent",
		children: initials
	});
}
function TestimonialsSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "stories",
		className: "relative",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestimonialsCanvas, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-2xl px-4 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h2, {
					initial: {
						opacity: 0,
						filter: "blur(10px)"
					},
					animate: {
						opacity: 1,
						filter: "blur(0px)"
					},
					transition: {
						duration: .55,
						delay: .15
					},
					className: "text-page font-semibold tracking-tight md:text-hero",
					children: "Studios already living in the OS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
					initial: {
						opacity: 0,
						filter: "blur(10px)"
					},
					animate: {
						opacity: 1,
						filter: "blur(0px)"
					},
					transition: {
						duration: .55,
						delay: .3
					},
					className: "mx-auto mt-4 max-w-md text-body text-muted",
					children: "Drag the canvas. Operators talk about hibernate, Inbox, approvals, Hermes, and Linear — the work, not the plumbing."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					initial: {
						opacity: 0,
						filter: "blur(10px)"
					},
					animate: {
						opacity: 1,
						filter: "blur(0px)"
					},
					transition: {
						duration: .55,
						delay: .45
					},
					className: "mt-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "#demo",
							children: ["Request a Demo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "size-4",
								"aria-hidden": "true"
							})]
						})
					})
				})
			]
		}) })
	});
}
function TestimonialsCanvas({ children }) {
	const tileSize = 800;
	const cardsPerTile = 4;
	const exclusionWidth = 700;
	const exclusionHeight = 560;
	const autoPanInterval = 3200;
	const autoPanDuration = 1100;
	const containerRef = (0, import_react.useRef)(null);
	const contentRef = (0, import_react.useRef)(null);
	const offsetRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const velocityRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const isDraggingRef = (0, import_react.useRef)(false);
	const lastPosRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const lastTimeRef = (0, import_react.useRef)(Date.now());
	const rafRef = (0, import_react.useRef)(null);
	const autoPanRafRef = (0, import_react.useRef)(null);
	const autoPanTimerRef = (0, import_react.useRef)(null);
	const isAutoPanningRef = (0, import_react.useRef)(false);
	const focusIndexRef = (0, import_react.useRef)(0);
	const focusPositionsRef = (0, import_react.useRef)([]);
	const [isDragging, setIsDragging] = (0, import_react.useState)(false);
	const [activeCardId, setActiveCardId] = (0, import_react.useState)(null);
	const [visibleTiles, setVisibleTiles] = (0, import_react.useState)([]);
	const updateVisibleTiles = (0, import_react.useCallback)(() => {
		const container = containerRef.current;
		if (!container) return;
		const { width, height } = container.getBoundingClientRect();
		const { x, y } = offsetRef.current;
		const startTileX = Math.floor(x / tileSize) - 1;
		const startTileY = Math.floor(y / tileSize) - 1;
		const endTileX = Math.ceil((x + width) / tileSize) + 1;
		const endTileY = Math.ceil((y + height) / tileSize) + 1;
		const tiles = [];
		for (let tx = startTileX; tx <= endTileX; tx += 1) for (let ty = startTileY; ty <= endTileY; ty += 1) tiles.push({
			tileX: tx,
			tileY: ty,
			cards: generateTileCards(tx, ty, tileSize, TESTIMONIALS, cardsPerTile, exclusionWidth, exclusionHeight)
		});
		setVisibleTiles(tiles);
	}, []);
	const updateTransform = (0, import_react.useCallback)(() => {
		if (!contentRef.current) return;
		const { x, y } = offsetRef.current;
		contentRef.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
	}, []);
	const animate = (0, import_react.useCallback)(() => {
		if (isDraggingRef.current) {
			rafRef.current = requestAnimationFrame(animate);
			return;
		}
		velocityRef.current.x *= .95;
		velocityRef.current.y *= .95;
		if (Math.abs(velocityRef.current.x) > .5 || Math.abs(velocityRef.current.y) > .5) {
			offsetRef.current.x -= velocityRef.current.x;
			offsetRef.current.y -= velocityRef.current.y;
			updateTransform();
			updateVisibleTiles();
			rafRef.current = requestAnimationFrame(animate);
		} else velocityRef.current = {
			x: 0,
			y: 0
		};
	}, [updateTransform, updateVisibleTiles]);
	const stopAutoPan = (0, import_react.useCallback)(() => {
		if (autoPanTimerRef.current) {
			clearTimeout(autoPanTimerRef.current);
			autoPanTimerRef.current = null;
		}
		if (autoPanRafRef.current) {
			cancelAnimationFrame(autoPanRafRef.current);
			autoPanRafRef.current = null;
		}
		isAutoPanningRef.current = false;
		setActiveCardId(null);
	}, []);
	const panToNextTestimonial = (0, import_react.useCallback)(() => {
		if (isDraggingRef.current || isAutoPanningRef.current) return;
		const container = containerRef.current;
		if (!container || focusPositionsRef.current.length === 0) return;
		const { width, height } = container.getBoundingClientRect();
		focusIndexRef.current = (focusIndexRef.current + 1) % focusPositionsRef.current.length;
		const target = focusPositionsRef.current[focusIndexRef.current];
		const targetX = target.x - width / 2;
		const targetY = target.y - height / 2 + 240;
		const startX = offsetRef.current.x;
		const startY = offsetRef.current.y;
		const deltaX = targetX - startX;
		const deltaY = targetY - startY;
		const startTime = performance.now();
		isAutoPanningRef.current = true;
		const tick = (now) => {
			if (isDraggingRef.current) {
				isAutoPanningRef.current = false;
				setActiveCardId(null);
				return;
			}
			const progress = Math.min((now - startTime) / autoPanDuration, 1);
			const eased = easeOutCubic(progress);
			offsetRef.current.x = startX + deltaX * eased;
			offsetRef.current.y = startY + deltaY * eased;
			updateTransform();
			updateVisibleTiles();
			if (progress < 1) autoPanRafRef.current = requestAnimationFrame(tick);
			else {
				isAutoPanningRef.current = false;
				setActiveCardId(target.cardId);
				if (!isDraggingRef.current) autoPanTimerRef.current = setTimeout(panToNextTestimonial, autoPanInterval);
			}
		};
		autoPanRafRef.current = requestAnimationFrame(tick);
	}, [updateTransform, updateVisibleTiles]);
	const startAutoPan = (0, import_react.useCallback)(() => {
		if (autoPanTimerRef.current) clearTimeout(autoPanTimerRef.current);
		autoPanTimerRef.current = setTimeout(panToNextTestimonial, autoPanInterval);
	}, [panToNextTestimonial]);
	const handlePointerDown = (0, import_react.useCallback)((clientX, clientY) => {
		isDraggingRef.current = true;
		setIsDragging(true);
		lastPosRef.current = {
			x: clientX,
			y: clientY
		};
		lastTimeRef.current = Date.now();
		velocityRef.current = {
			x: 0,
			y: 0
		};
		stopAutoPan();
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
	}, [stopAutoPan]);
	const handlePointerMove = (0, import_react.useCallback)((clientX, clientY) => {
		if (!isDraggingRef.current) return;
		const dx = clientX - lastPosRef.current.x;
		const dy = clientY - lastPosRef.current.y;
		const dt = Date.now() - lastTimeRef.current;
		if (dt > 0) {
			velocityRef.current.x = dx / dt * 16;
			velocityRef.current.y = dy / dt * 16;
		}
		offsetRef.current.x -= dx;
		offsetRef.current.y -= dy;
		lastPosRef.current = {
			x: clientX,
			y: clientY
		};
		lastTimeRef.current = Date.now();
		updateTransform();
		updateVisibleTiles();
	}, [updateTransform, updateVisibleTiles]);
	const handlePointerUp = (0, import_react.useCallback)(() => {
		if (!isDraggingRef.current) return;
		isDraggingRef.current = false;
		setIsDragging(false);
		rafRef.current = requestAnimationFrame(animate);
		startAutoPan();
	}, [animate, startAutoPan]);
	(0, import_react.useEffect)(() => {
		const container = containerRef.current;
		if (!container) return;
		const { width, height } = container.getBoundingClientRect();
		offsetRef.current = {
			x: -width / 2,
			y: -height / 2
		};
		focusPositionsRef.current = generateFocusPositions(16, tileSize, TESTIMONIALS, cardsPerTile, exclusionWidth, exclusionHeight);
		updateVisibleTiles();
		updateTransform();
		const initial = setTimeout(() => startAutoPan(), autoPanInterval);
		return () => {
			clearTimeout(initial);
			stopAutoPan();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [
		startAutoPan,
		stopAutoPan,
		updateTransform,
		updateVisibleTiles
	]);
	(0, import_react.useEffect)(() => {
		const onResize = () => updateVisibleTiles();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [updateVisibleTiles]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: containerRef,
		className: cn("relative isolate h-[100dvh] w-full overflow-hidden bg-bg", isDragging ? "cursor-grabbing" : "cursor-grab"),
		onMouseDown: (event) => handlePointerDown(event.clientX, event.clientY),
		onMouseMove: (event) => handlePointerMove(event.clientX, event.clientY),
		onMouseUp: handlePointerUp,
		onMouseLeave: handlePointerUp,
		onTouchStart: (event) => {
			const touch = event.touches[0];
			if (touch) handlePointerDown(touch.clientX, touch.clientY);
		},
		onTouchMove: (event) => {
			if (!isDraggingRef.current) return;
			event.preventDefault();
			const touch = event.touches[0];
			if (touch) handlePointerMove(touch.clientX, touch.clientY);
		},
		onTouchEnd: handlePointerUp,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,color-mix(in_srgb,var(--fg)_10%,transparent)_1px,transparent_1px)] [background-size:24px_24px]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: contentRef,
				className: "absolute will-change-transform",
				children: visibleTiles.map((tile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute",
					style: {
						left: tile.tileX * tileSize,
						top: tile.tileY * tileSize,
						width: tileSize,
						height: tileSize
					},
					children: tile.cards.map((card) => {
						const isActive = activeCardId === card.id;
						const dim = activeCardId !== null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
							className: "absolute overflow-hidden rounded-card border border-border bg-elevated p-5 shadow-(--shadow-border)",
							style: {
								left: card.x,
								top: card.y,
								width: card.width
							},
							initial: false,
							animate: {
								scale: isActive ? 1.08 : 1,
								opacity: dim ? isActive ? 1 : .14 : 1
							},
							transition: {
								type: "spring",
								stiffness: 280,
								damping: 32
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-body font-semibold tracking-tight",
									children: [
										"“",
										card.testimonial.title,
										"”"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-caption text-muted",
									children: card.testimonial.quote
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex min-w-0 items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { initials: card.testimonial.initials }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-caption font-medium",
											children: card.testimonial.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-caption text-muted",
											children: card.testimonial.role
										})]
									})]
								})
							]
						}, card.id);
					})
				}, `${tile.tileX}-${tile.tileY}`))
			}),
			children ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto",
					children
				})
			}) : null
		]
	});
}
var FAQS = [
	{
		question: "What is ClippyOS?",
		answer: "ClippyOS is the autonomous operating system for clipping. Command runs the day. The Social Machine opens X, YouTube, Instagram, and TikTok from inside the OS. Inbox handles Telegram, WhatsApp, and Discord. Clips live in immutable cloud storage — never on the machine disk."
	},
	{
		question: "How does the Social Machine work?",
		answer: "Start it when you need the networks. Hibernate when you don’t. Logins persist because we pause the session instead of destroying it. Four networks, one machine, operated from Command."
	},
	{
		question: "Do clips live on the machine?",
		answer: "No. The Social Machine is a specialist runtime, not a disk. Every clip lands in durable, globally reachable storage. Pinning strategies — eager, on publish, replicate, or manual — copy onto the content network as a second layer."
	},
	{
		question: "Where do clients actually talk to us?",
		answer: "Inbox. Telegram Bot API, WhatsApp Cloud API, and Discord for customers and companies. Liaison never starts the Social Machine. Discord still runs the Status Agent against production stages."
	},
	{
		question: "Is Hermes Agent and Linear built in?",
		answer: "Yes. ClippyOS speaks Hermes natively — MCP tools, playbooks, and isolated skills. Failed jobs, renders, and agent runs map to Linear. The board stays in Linear; the OS deep-links and syncs."
	},
	{
		question: "How do I get access?",
		answer: "Get Access creates a workspace and continues to checkout. Prefer a walkthrough of Command, the Social Machine, liaison, Hermes, and Linear first? Request a Demo and we’ll confirm by email."
	}
];
function LandingFaq() {
	const [open, setOpen] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "faq",
		className: "px-4 py-16 md:px-6 md:py-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-6xl gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-center text-page font-semibold tracking-tight",
					children: "Frequently asked questions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mx-auto max-w-lg text-center text-body text-muted",
					children: [
						"If it isn’t here,",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#demo",
							className: "text-accent underline-offset-2 hover:underline",
							children: "request a demo"
						}),
						" ",
						"and we’ll walk the OS with you."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mt-8 w-full max-w-3xl",
					children: FAQS.map((faq) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaqItem, {
						question: faq.question,
						answer: faq.answer,
						open,
						setOpen
					}, faq.question))
				})
			]
		})
	});
}
function FaqItem({ question, answer, open, setOpen }) {
	const isOpen = open === question;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "mb-4 w-full rounded-card border border-border bg-elevated p-4 text-left shadow-(--shadow-border)",
		onClick: () => setOpen(isOpen ? null : question),
		"aria-expanded": isOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				className: cn("mt-0.5 size-5 shrink-0 text-fg transition-transform duration-(--motion-fast)", isOpen && "rotate-180"),
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-body font-medium tracking-tight",
					children: question
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					initial: false,
					children: isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
						initial: {
							height: 0,
							opacity: 0
						},
						animate: {
							height: "auto",
							opacity: 1
						},
						exit: {
							height: 0,
							opacity: 0
						},
						transition: {
							duration: .2,
							ease: "easeOut"
						},
						className: "overflow-hidden pt-2 text-caption text-muted",
						children: answer
					}) : null
				})]
			})]
		})
	});
}
var SHOTS = [
	{
		name: "command",
		title: "Command",
		caption: "The daily OS: pipeline, money, and what to ship next."
	},
	{
		name: "money",
		title: "Money",
		caption: "Retainers, costs, and collections — the agency ledger."
	},
	{
		name: "clients",
		title: "Clients",
		caption: "Every roster, plan, and production stage in one place."
	},
	{
		name: "ideation",
		title: "Ideation",
		caption: "Titles and briefs, scoped per client, ready to produce."
	},
	{
		name: "agent",
		title: "Agent",
		caption: "Native Hermes loop for clipping work, isolated skills."
	},
	{
		name: "library",
		title: "Library",
		caption: "Immutable cloud storage for every clip. Content pins as a second layer."
	},
	{
		name: "approvals",
		title: "Approvals",
		caption: "Nothing public without a sign-off."
	},
	{
		name: "settings",
		title: "Settings",
		caption: "Add-ons, autonomy, Hermes, and the control plane."
	}
];
var MARQUEE = [
	"Autonomous clipping",
	"Social Machine",
	"X · YouTube · Instagram · TikTok",
	"Telegram · WhatsApp · Discord",
	"Hermes Agent",
	"Linear kanban",
	"Immutable cloud storage",
	"Hot hibernate",
	"Approvals before publish"
];
var LAYERS = [
	{
		icon: Clapperboard,
		title: "Clip pipeline",
		body: "Ingest, caption, render, and ship. One OS from footage to published cut."
	},
	{
		icon: MonitorPlay,
		title: "Social Machine",
		body: "Open X, YouTube, Instagram, and TikTok from inside ClippyOS. Hibernate keeps the session hot."
	},
	{
		icon: MessageCircle,
		title: "Liaison",
		body: "Telegram, WhatsApp, and Discord for customers and companies — professional threads, not browser theatre."
	},
	{
		icon: Wallet,
		title: "Money",
		body: "Setup fees, retainers, team cost, and collections. The ledger the production OS actually needs."
	},
	{
		icon: HardDrive,
		title: "Immutable storage",
		body: "Clips live in durable cloud storage, globally reachable. Optional content pins. Never on the machine disk."
	},
	{
		icon: ShieldCheck,
		title: "Approvals",
		body: "Nothing public without a sign-off. Safety inbox and an audit trail on every publish."
	}
];
function Shot({ name, alt, eager = false }) {
	const { theme } = useTheme();
	const contrast = theme === "dark" ? "light" : "dark";
	const src = `/marketing/${name}-${contrast}.gif?v=3`;
	const fallback = `/marketing/${name}-${contrast}.jpg`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "aspect-video w-full overflow-hidden bg-elevated",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt,
			className: "marketing-shot",
			loading: eager ? "eager" : "lazy",
			decoding: "async",
			onError: (event) => {
				if (event.currentTarget.src.endsWith(fallback)) return;
				event.currentTarget.src = fallback;
			}
		})
	});
}
function AccessButton({ className, label }) {
	const { user } = useCurrentUserState();
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/home",
			children: label ?? "Open OS"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: "/login?intent=access",
			children: label ?? "Get Access"
		})
	});
}
function DemoForm() {
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [company, setCompany] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("agency");
	const [country, setCountry] = (0, import_react.useState)("AU");
	const [message, setMessage] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	async function onSubmit(event) {
		event.preventDefault();
		setBusy(true);
		try {
			const response = await fetch("/api/demo", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					email,
					company,
					role,
					country,
					message
				})
			});
			const body = await response.json();
			if (!response.ok) {
				toast.error(body.error === "DEMO_RATE_LIMIT" ? "Wait a few seconds before sending another request." : "Check the form and try again.");
				setBusy(false);
				return;
			}
			setDone(true);
			toast.success(body.emailed ? "Request received — check your inbox for confirmation." : "Request received. We’ll be in touch.");
		} catch {
			toast.error("Couldn’t send that just now. Retry in a moment.");
		}
		setBusy(false);
	}
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-border bg-elevated p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-card font-semibold tracking-tight",
			children: "You’re on the list."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-body text-muted",
			children: [
				"We sent a confirmation to ",
				email,
				". We’ll reach out to walk ClippyOS — Social Machine, liaison channels, Hermes, and Linear — with your team."
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3 sm:grid-cols-2",
		onSubmit: (event) => void onSubmit(event),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-name",
					children: "Name"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "demo-name",
					value: name,
					required: true,
					minLength: 2,
					onChange: (e) => setName(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-email",
					children: "Work email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "demo-email",
					type: "email",
					value: email,
					required: true,
					onChange: (e) => setEmail(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-company",
					children: "Studio / company"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "demo-company",
					value: company,
					onChange: (e) => setCompany(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-role",
					children: "Role"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: role,
					onValueChange: setRole,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						id: "demo-role",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: DEMO_ROLES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: item,
						children: item[0].toUpperCase() + item.slice(1)
					}, item)) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-country",
					children: "Country"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: country,
					onValueChange: (value) => setCountry(parseProxyCountry(value)),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						id: "demo-country",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: PROXY_COUNTRIES.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: row.code,
						children: row.name
					}, row.code)) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5 sm:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "demo-message",
					children: "What do you want to see?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "demo-message",
					value: message,
					maxLength: 2e3,
					onChange: (e) => setMessage(e.target.value),
					placeholder: "Roster size, platforms, Hermes / Linear setup…"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: busy,
					children: busy ? "Sending…" : "Request a Demo"
				})
			})
		]
	});
}
function LandingPage() {
	const { user } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spotlight, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, { quantity: 36 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-nowrap items-center justify-between gap-2 px-3 py-2.5 md:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "#top",
						className: "flex min-w-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 28 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-body font-semibold tracking-tight",
							children: APP_NAME
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 flex-nowrap items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "ghost",
								size: "sm",
								className: "min-h-10 px-2.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#demo",
									children: "Demo"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessButton, { className: "min-h-10 px-3 text-caption" })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollProgress, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				id: "top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "relative overflow-hidden px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedGridPattern, { className: "opacity-40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded-full border border-border bg-elevated/70 px-3 py-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
										className: "size-3.5 text-accent",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedShinyText, {
										className: "text-caption",
										children: APP_TAGLINE
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
									delay: .08,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
										className: "mt-5 text-hero font-semibold tracking-tight",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuroraText, { children: "ClippyOS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mt-2 block text-fg",
											children: [
												"Clip. Publish. Liaise.",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, { children: "Autonomously." })
											]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
									delay: .16,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 max-w-xl text-body text-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingAnimation, {
											duration: 16,
											children: "Globally reachable clipping OS. Social Machine for X, YouTube, Instagram, and TikTok. Telegram, WhatsApp, and Discord for the people around the work."
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, {
									delay: .24,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-6 flex flex-wrap gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessButton, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												variant: "secondary",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "#demo",
													children: "Request a Demo"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												variant: "ghost",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/docs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
														className: "size-4",
														"aria-hidden": "true"
													}), "Documentation"]
												})
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-caption text-muted",
										children: user ? "You’re signed in. Open the OS to continue." : "Get Access creates a workspace and takes you to checkout. Prefer a walkthrough? Request a Demo."
									})]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
								delay: .12,
								className: "relative",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TiltCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative overflow-hidden rounded-modal border border-border bg-elevated shadow-(--shadow-border)",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BorderBeam, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shot, {
											name: "splash",
											alt: "ClippyOS loading — the OS coming online",
											eager: true
										})
									]
								}) })
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureGrid, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoCloud, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "py-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Marquee, {
							duration: 42,
							children: MARQUEE.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-border bg-elevated px-4 py-1.5 text-caption text-muted",
								children: item
							}, item))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "product",
						className: "px-4 py-16 md:px-6 md:py-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto max-w-6xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "teal",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-page font-semibold tracking-tight",
									children: "The OS, in motion."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 max-w-2xl text-body text-muted",
									children: "Eight live surfaces — Command through Settings. Social Machine and Inbox live further down, once each."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2",
								children: SHOTS.map((shot, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlurFade, {
									delay: index * .06,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TiltCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: "relative min-w-0 overflow-hidden rounded-card border border-border bg-elevated",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BorderBeam, {
												delay: index * .4,
												reverse: index % 2 === 1
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shot, {
												name: shot.name,
												alt: `${shot.title} in ClippyOS`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-card font-semibold tracking-tight",
													children: shot.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-caption text-muted",
													children: shot.caption
												})]
											})
										]
									}) })
								}, shot.title))
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "px-4 py-16 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto max-w-6xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-page font-semibold tracking-tight",
								children: "What you actually get"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-2xl text-body text-muted",
								children: "Benefits of the OS — not the plumbing underneath it."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3",
								children: LAYERS.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-card border border-border bg-elevated p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(layer.icon, {
												className: "size-5 text-accent",
												"aria-hidden": "true"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mt-3 text-card font-semibold tracking-tight",
											children: layer.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-caption text-muted",
											children: layer.body
										})
									]
								}, layer.title))
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "machine",
						className: "px-4 py-16 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "green",
									children: "Social Machine"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-page font-semibold tracking-tight",
									children: "Social apps, inside the OS."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-body text-muted",
									children: "Start the Social Machine when you need X, YouTube, Instagram, or TikTok. Hibernate when you’re done — the session stays hot. Resume picks up the same windows."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-5 flex flex-col gap-3 text-body text-muted",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
												className: "mt-0.5 size-4 shrink-0 text-accent",
												"aria-hidden": "true"
											}), "Hibernate, don’t destroy. Logins persist."]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, {
												className: "mt-0.5 size-4 shrink-0 text-accent",
												"aria-hidden": "true"
											}), "Four networks from one machine, operated from Command."]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
												className: "mt-0.5 size-4 shrink-0 text-accent",
												"aria-hidden": "true"
											}), "Clips never live on the machine. Immutable cloud storage is the library."]
										})
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TiltCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-modal border border-border bg-elevated",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shot, {
									name: "social",
									alt: "Social Machine inside ClippyOS"
								})]
							}) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "inbox",
						className: "px-4 py-16 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "teal",
									children: "Liaison"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-page font-semibold tracking-tight",
									children: "Telegram, WhatsApp, and Discord."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 max-w-2xl text-body text-muted",
									children: "Customers and companies belong in Inbox — Bot API threads, not a browser on the Social Machine. Discord still runs the Status Agent against production stages. Webhooks never start the machine."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TiltCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-modal border border-border bg-elevated",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shot, {
									name: "inbox",
									alt: "Inbox — Telegram, WhatsApp, and Discord liaison"
								})]
							}) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "native",
						className: "px-4 py-16 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-4 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-card border border-border bg-elevated p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
										className: "size-6 text-accent",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-3 text-card font-semibold tracking-tight",
										children: "Native Hermes Agent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-body text-muted",
										children: "ClippyOS speaks Hermes natively — MCP tools, playbooks, and the agent loop live in the OS. Skills run isolated. The Social Machine stays a specialist runtime."
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-card border border-border bg-elevated p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kanban, {
										className: "size-6 text-accent",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-3 text-card font-semibold tracking-tight",
										children: "Native Linear kanban"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-body text-muted",
										children: "Failed jobs, renders, and agent runs map to Linear. The board stays in Linear — ClippyOS deep-links and syncs. Engineering and ops share one kanban."
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "px-4 py-16 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-6xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlurFade, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "teal",
									children: "Storage"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-page font-semibold tracking-tight",
									children: "Immutable cloud. Optional pins."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 max-w-2xl text-body text-muted",
									children: "Every clip lands in durable, globally reachable storage. Pinning strategies — eager, on publish, replicate, or manual — copy onto the content network without ever using the Social Machine as a disk."
								})
							] })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestimonialsSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "demo",
						className: "px-4 pb-16 pt-8 md:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "green",
									children: "Access"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-page font-semibold tracking-tight",
									children: "Subscribe, or request a demo."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-body text-muted",
									children: "Get Access creates your workspace and continues to checkout. Request a Demo if you want us to walk Command, the Social Machine, liaison, Hermes, and Linear with your team first."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 flex flex-wrap gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessButton, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "secondary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/login",
											children: "Sign in"
										})
									})]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-modal border border-border bg-elevated p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "relative z-[1] text-card font-semibold tracking-tight",
										children: "Request a Demo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "relative z-[1] mt-1 mb-4 text-caption text-muted",
										children: "You’ll get a confirmation email in the ClippyOS look."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "relative z-[1]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoForm, {})
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LandingFaq, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-border px-4 py-8 md:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 24 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-caption text-muted",
							children: [
								APP_NAME,
								" · ",
								APP_TAGLINE
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Globally reachable. Immutable storage. Hot hibernate."
					})]
				})
			})
		]
	});
}
var SplitComponent = LandingPage;
//#endregion
export { SplitComponent as component };
